// ═══════════════════════════════════════════════════════════════
// 🔔 한끼 폰 알림(웹 푸시) — Cloudflare Worker   (2026-09-19 · 1판)
//
// 하는 일 = ①앱이 준 구독(폰 주소)을 «묶음»으로 담아 두고 ②정한 때가 되면 «빈 푸시(tickle)»를 보낸다.
//   폰의 서비스워커(`src/sw.js`)가 빈 푸시를 받으면 여기 `/today` 로 «오늘 문구»를 가져와 띄운다.
//   📄 설계 = docs/알림-설계-2026-09-19.md (설계 관문 통과판) · 창업자 확정 = 월수 15:30 · 토 09:00 · 꾸미기 20:00 · 하루 한 번
//
// ⛔⛔ **왜 「빈 푸시」인가** — 글자를 실어 보내려면 RFC 8291 암호화(aes128gcm·HKDF·ECDH)를 «손으로» 짜야 한다.
//   대시보드에 붙여넣는 워커는 라이브러리를 못 쓴다. 150줄짜리 암호화를 틀리면 «조용히» 안 온다.
//   ✅ 빈 푸시면 암호화 0줄 — 필요한 건 VAPID 서명(WebCrypto ES256 · 40줄)뿐이다.
//   ✅ 문구는 앱이 «구운» `push/schedule.json` 에서 온다 → 문구를 바꾸는 건 앱 배포(저절로)지 워커 붙여넣기가 아니다.
//
// ⛔⛔ **한 번 실행에 바깥 요청 50개** (무료 플랜 · 열람 2026-09-19) — KV 읽기·쓰기도 다 센다.
//   그래서 «묶음 하나 = 40명» · «한 번 깨어나면 묶음 하나»만 보낸다. 91명이면 3번(15분) 안에 다 간다.
//   ⛔ 묶음을 키우거나 한 번에 여러 묶음을 보내면 «41번째 사람부터 조용히 못 받는다». 우리는 보낸 줄 안다.
//
// ⛔ 이 워커가 죽어도 앱은 안 죽는다 — 앱은 답을 «기다리지 않는다»(구독 보내기가 실패하면 다음에 또 보낸다).
// 🔒 지키는 판 = scripts/_repro-푸시워커-0919.mjs (가짜 KV·fetch 로 «실제로 돌린다»)
//
// ── 창업자가 대시보드에서 할 것 (7분) ──────────────────────────
//   1. Workers & Pages → Create → Worker → 이름 `hankki-push`   ⛔이름이 다르면 앱이 못 찾는다(주소가 이름에서 나온다)
//   2. 이 파일 내용을 통째로 붙여넣고 Deploy
//   3. Settings → Bindings → **KV 네임스페이스** 새로 만들기 `hankki-push-kv` · 변수 이름 `PUSH_KV`
//   4. Settings → Variables and Secrets →
//        Secret `APP_TOKEN`      = (기존 OCR 워커와 «같은» 값 · 구독 넣기에 쓴다)
//        Secret `FOUNDER_SECRET` = (기존 OCR 워커와 «같은» 값 · `?quota=1` 통로)
//   5. Settings → **Triggers → Cron Triggers → `*/5 * * * *`** (5분마다 · 보낼 때인지는 워커가 스스로 본다)
//      ⛔ 이걸 안 걸면 «영영 안 보낸다». 구독은 쌓이는데 알림은 0 — 조용한 실패다.
//   6. 확인 = `https://hankki-push.annyeong-hankki.workers.dev/vapid` 를 폰 브라우저로 열면 `{ pub: "…" }` 가 떠야 한다
//      (VAPID 열쇠는 워커가 «첫 실행에 스스로» 만들어 KV 에 둔다 — 비밀 열쇠는 아무도 안 만진다)
// ═══════════════════════════════════════════════════════════════

const ALLOWED_ORIGINS = [
  'https://peachfam0307-glitch.github.io',
  'capacitor://localhost',   // 🍎 아이폰 껍데기 — 지금은 웹 푸시가 안 돼서 시트가 안 뜨지만, 주소는 맞춰 둔다
]
const 일정주소 = 'https://peachfam0307-glitch.github.io/hankki/push/schedule.json'
const 앱길 = 'https://peachfam0307-glitch.github.io/hankki/'
const 연락처 = 'mailto:annyeong.hankki@gmail.com'   // VAPID sub — 공개돼도 되는 지원 메일이다(README 와 같은 값)

const LIMITS = {
  묶음크기: 40,        // ⛔ 50 이 상한인데 KV 읽기·쓰기 몫을 빼면 40 이 안전선이다
  보내는창분: 60,      // 정한 시각부터 60분 안에만 보낸다 — 지나면 «그날은 안 보낸다»(늦은 알림은 짜증이다)
  최대묶음: 50,        // 40 × 50 = 2,000명까지. 그 위는 유료(월 5달러)로 가야 한다
}

const 칸 = {
  열쇠: 'push:vapid',
  묶음: (플랫폼, n) => `push:${플랫폼}:${n}`,
  묶음수: 'push:n',
  보냄: (날, 플랫폼, n) => `push:sent:${날}:${플랫폼}:${n}`,
  기록: (달) => `push:log:${달}`,
}

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || ''
    const cors = corsHeaders(origin)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
    const url = new URL(request.url)
    const kv = env.PUSH_KV

    // 📊 운영자 — 「구독 몇 명 · 이달 몇 번 보냈나」 (OCR·tidy 워커와 같은 모양·같은 열쇠)
    if (url.searchParams.get('quota') === '1') {
      if (!env.FOUNDER_SECRET) return json({ error: 'no_secret' }, 500, cors)
      const 준열쇠 = request.headers.get('x-hankki-founder') || url.searchParams.get('key') || ''
      if (준열쇠 !== env.FOUNDER_SECRET) return json({ error: 'unauthorized' }, 401, cors)
      if (!kv) return json({ 왜: 'KV 가 안 붙어 있어 셀 수가 없어요' }, 200, cors)
      const n = await 묶음수읽기(kv)
      const 세기 = async (플랫폼) => { let 합 = 0; for (let i = 0; i < n[플랫폼]; i++) 합 += (await 묶음읽기(kv, 플랫폼, i)).length; return 합 }
      const 열쇠 = await kv.get(칸.열쇠, 'json')
      return json({
        날: kstDay(new Date()), 구독: { web: await 세기('web'), ios: await 세기('ios'), 묶음: n },
        이달: (await kv.get(칸.기록(kstDay(new Date()).slice(0, 7)), 'json')) || { 보냄: 0, 성공: 0, 만료삭제: 0, 실행: 0 },
        vapid: 열쇠 ? '있음' : '아직 없음(첫 /vapid 호출 때 생긴다)',
      }, 200, cors)
    }

    // 🔑 공개 열쇠 — 앱이 구독을 만들 때 쓴다. 없으면 «지금» 만든다(비밀 열쇠는 KV 밖으로 안 나간다).
    if (url.pathname === '/vapid' && request.method === 'GET') {
      if (!kv) return json({ error: 'no_kv' }, 501, cors)
      const 열쇠 = await 열쇠꺼내기(kv)
      return json({ pub: 열쇠.pub }, 200, cors)
    }

    // 📨 오늘 문구 — 서비스워커가 빈 푸시를 받고 여기로 온다. ⛔ 없으면 «기본 문구»가 아니라 404 — 워커가 기본 문구를 쓴다.
    if (url.pathname === '/today' && request.method === 'GET') {
      const 오늘 = await 오늘문구(kstDay(new Date()))
      return 오늘 ? json(오늘, 200, { ...cors, 'Cache-Control': 'no-store' }) : json({ error: 'none' }, 404, cors)
    }

    // 📥 구독 넣기 — { platform: 'web'|'ios', sub: { endpoint, keys } }
    if (url.pathname === '/subscribe' && request.method === 'POST') {
      if (!ALLOWED_ORIGINS.includes(origin)) return json({ error: 'forbidden' }, 403, cors)
      if (env.APP_TOKEN && request.headers.get('x-hankki-token') !== env.APP_TOKEN) return json({ error: 'unauthorized' }, 401, cors)
      if (!kv) return json({ error: 'no_kv' }, 501, cors)
      let body = null
      try { body = await request.json() } catch { return json({ error: 'bad_json' }, 400, cors) }
      const 플랫폼 = body?.platform === 'ios' ? 'ios' : 'web'
      const sub = body?.sub
      if (!sub || typeof sub.endpoint !== 'string' || !/^https:\/\//.test(sub.endpoint) || sub.endpoint.length > 2048) return json({ error: 'bad_sub' }, 400, cors)
      const r = await 구독넣기(kv, 플랫폼, { endpoint: sub.endpoint, keys: sub.keys || {} })
      return json(r, r.error ? 507 : 200, cors)
    }

    return json({ error: 'not_found' }, 404, cors)
  },

  // ⏰ 5분마다 깨어난다 — 보낼 때인지·보낼 묶음이 남았는지는 여기서 스스로 본다
  async scheduled(event, env, ctx) {
    ctx.waitUntil(보내기(env, new Date()))
  },
}

// ── 보내기 ────────────────────────────────────────────────────────────────
/** 한 번 깨어나면 «묶음 하나»만. 돌려주는 값은 재현판이 본다. */
export async function 보내기(env, now) {
  const kv = env.PUSH_KV
  if (!kv) return { 했나: false, 왜: 'no_kv' }
  const 날 = kstDay(now)
  const 문구 = await 오늘문구(날)
  if (!문구) return { 했나: false, 왜: '오늘 보낼 것 없음' }
  const 분 = kstMinutes(now)
  const [h, m] = String(문구.시각 || '15:30').split(':').map(Number)
  const 시작 = h * 60 + m
  if (분 < 시작 || 분 >= 시작 + LIMITS.보내는창분) return { 했나: false, 왜: `아직 아니다(${문구.시각} 부터 ${LIMITS.보내는창분}분)` }

  const n = await 묶음수읽기(kv)
  // ⛔ 1판은 web 만 보낸다 — ios 칸은 APNs 가 붙을 때 쓴다(구독은 담아 두되 «웹 푸시로는 안 쏜다»)
  for (let i = 0; i < n.web; i++) {
    const 잠금 = 칸.보냄(날, 'web', i)
    if (await kv.get(잠금)) continue                       // 이미 보낸 묶음
    await kv.put(잠금, '1', { expirationTtl: 60 * 60 * 48 })   // ⛔ 보내기 «전»에 먼저 박는다 — 두 번 보내기 방지
    const 목록 = await 묶음읽기(kv, 'web', i)
    const 열쇠 = await 열쇠꺼내기(kv)
    let 성공 = 0, 만료 = 0
    const 남길것 = []
    for (const s of 목록) {
      const r = await 푸시하나(s, 열쇠)
      if (r === 'ok') { 성공++; 남길것.push(s) } else if (r === 'gone') { 만료++ } else { 남길것.push(s) }   // 일시 실패는 남긴다
    }
    if (만료) await kv.put(칸.묶음('web', i), JSON.stringify(남길것))
    await 기록더하기(kv, 날.slice(0, 7), { 보냄: 목록.length, 성공, 만료삭제: 만료, 실행: 1 })
    return { 했나: true, 묶음: i, 보냄: 목록.length, 성공, 만료삭제: 만료 }
  }
  return { 했나: false, 왜: '오늘 묶음 다 보냈다' }
}

/** 빈 푸시 하나. 'ok' | 'gone'(410·404 → 지운다) | 'fail'(일시) */
async function 푸시하나(sub, 열쇠) {
  try {
    const aud = new URL(sub.endpoint).origin
    const jwt = await vapidJwt(열쇠, aud)
    const r = await fetch(sub.endpoint, {
      method: 'POST',
      headers: { TTL: '86400', Urgency: 'normal', Authorization: `vapid t=${jwt}, k=${열쇠.pub}`, 'Content-Length': '0' },
    })
    if (r.status === 404 || r.status === 410) return 'gone'
    return r.status >= 200 && r.status < 300 ? 'ok' : 'fail'
  } catch { return 'fail' }
}

// ── 오늘 문구 = 앱이 구운 일정에서 ────────────────────────────────────────
async function 오늘문구(날) {
  try {
    const r = await fetch(일정주소, { headers: { 'Cache-Control': 'no-cache' } })
    if (!r.ok) return null
    const 일정 = await r.json()
    const 오늘 = 일정?.날?.[날]
    if (!오늘 || !오늘.본문) return null
    return { 제목: String(오늘.제목 || '한끼'), 본문: String(오늘.본문), 길: String(오늘.길 || 앱길), 표: `hankki-${날}`, 시각: String(오늘.시각 || '15:30') }
  } catch { return null }
}

// ── 구독 묶음 ─────────────────────────────────────────────────────────────
async function 묶음수읽기(kv) { const v = await kv.get(칸.묶음수, 'json'); return { web: Number(v?.web) || 0, ios: Number(v?.ios) || 0 } }
async function 묶음읽기(kv, 플랫폼, i) { const v = await kv.get(칸.묶음(플랫폼, i), 'json'); return Array.isArray(v) ? v : [] }

/** 같은 endpoint 면 안 넣는다(재구독). 마지막 묶음이 차면 새 묶음. ⛔ 최대묶음을 넘으면 «못 넣었다»고 말한다. */
async function 구독넣기(kv, 플랫폼, sub) {
  const n = await 묶음수읽기(kv)
  for (let i = 0; i < n[플랫폼]; i++) {
    const 목록 = await 묶음읽기(kv, 플랫폼, i)
    if (목록.some((s) => s.endpoint === sub.endpoint)) return { ok: true, 이미: true, 묶음: i }
  }
  let i = Math.max(0, n[플랫폼] - 1)
  let 목록 = n[플랫폼] ? await 묶음읽기(kv, 플랫폼, i) : []
  if (!n[플랫폼] || 목록.length >= LIMITS.묶음크기) {
    if (n[플랫폼] >= LIMITS.최대묶음) return { error: 'full' }
    i = n[플랫폼]; 목록 = []
    n[플랫폼] = i + 1
    await kv.put(칸.묶음수, JSON.stringify(n))
  }
  목록.push(sub)
  await kv.put(칸.묶음(플랫폼, i), JSON.stringify(목록))
  return { ok: true, 묶음: i, 자리: 목록.length }
}

async function 기록더하기(kv, 달, 더할것) {
  const 지금 = (await kv.get(칸.기록(달), 'json')) || { 보냄: 0, 성공: 0, 만료삭제: 0, 실행: 0 }
  for (const k of Object.keys(더할것)) 지금[k] = (Number(지금[k]) || 0) + 더할것[k]
  await kv.put(칸.기록(달), JSON.stringify(지금))
}

// ── VAPID (ES256) — WebCrypto 만 쓴다 ─────────────────────────────────────
async function 열쇠꺼내기(kv) {
  const 있는것 = await kv.get(칸.열쇠, 'json')
  if (있는것?.pub && 있는것?.priv) return 있는것
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
  const pub = b64url(new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey)))
  const priv = await crypto.subtle.exportKey('jwk', pair.privateKey)
  const 열쇠 = { pub, priv }
  await kv.put(칸.열쇠, JSON.stringify(열쇠))
  return 열쇠
}
async function vapidJwt(열쇠, aud) {
  const key = await crypto.subtle.importKey('jwk', 열쇠.priv, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
  const enc = (o) => b64url(new TextEncoder().encode(JSON.stringify(o)))
  const 몸 = `${enc({ typ: 'JWT', alg: 'ES256' })}.${enc({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 연락처 })}`
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(몸))   // WebCrypto 는 r‖s 64바이트를 준다 — DER 변환 필요 없다
  return `${몸}.${b64url(new Uint8Array(sig))}`
}
function b64url(bytes) { let s = ''; for (const b of bytes) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') }

// ── 시간(KST) — 서머타임 없는 UTC+9 고정(src/today.js 와 같은 산수) ────────────
function kstDay(d) { return new Date(d.getTime() + 9 * 3600000).toISOString().slice(0, 10) }
function kstMinutes(d) { const k = new Date(d.getTime() + 9 * 3600000); return k.getUTCHours() * 60 + k.getUTCMinutes() }

function corsHeaders(origin) {
  const ok = ALLOWED_ORIGINS.includes(origin)
  return {
    'Access-Control-Allow-Origin': ok ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-hankki-token, x-hankki-founder',
    'Access-Control-Max-Age': '86400',
  }
}
function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors } })
}
