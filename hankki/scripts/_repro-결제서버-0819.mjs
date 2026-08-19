#!/usr/bin/env node
// 💳 결제 서버 재현판 — `ocr-proxy/worker.js` 의 «결제 길»을 진짜로 돌려 본다. (2026-08-19)
//
// ⭐⭐ 왜 있나 (창업자 *"우리서버하는거 너믿고하는거니까 «진짜 리스크 없이» 가야해"*)
//   서비스 계정은 **프로덕션 승인 뒤**에 만든다(창업자 확정 ⓑ) → 그때까진 구글에 못 물어본다.
//   그렇다고 「코드 다 짰다」로 넘어가면 켜는 날 처음 돌려 보게 된다. **그건 리스크다.**
//   → 구글·D1 을 «똑같이 생긴 가짜»로 세워 두고 **우리 코드를 그대로** 돌린다.
//
// ⛔ **이 판이 증명하는 것과 «못» 하는 것을 갈라 둔다** (규칙 18 ⓘ)
//   ✅ 증명한다 = 우리 코드의 흐름·멱등·잔량 셈·복원·되돌리기·꺼짐·OCR 이 안 다쳤나
//   ⛔ 못 한다   = 구글이 «진짜로» 그 JSON 을 주는가 · 서비스 계정 권한이 붙는가 · 상품 ID 가 맞는가
//                 → 그 셋은 **승인 뒤 실물(라이선스 테스트)로만** 닫힌다.
//
// 🔒 D1 가짜는 «우리가 실제로 쓰는 쿼리 14개»만 안다. 쿼리를 바꾸면 여기서 **죽는다** — 일부러 그렇게 뒀다.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { webcrypto } from 'node:crypto'

const HERE = dirname(fileURLToPath(import.meta.url))
const WORKER = join(HERE, '..', 'ocr-proxy', 'worker.js')
const ORIGIN = 'https://peachfam0307-glitch.github.io'
const APP_TOKEN = 'test-app-token'

let ok = 0, bad = 0
const fail = (m, got) => { bad++; console.log(`  ⛔ ${m}${got === undefined ? '' : ` — 나온 값: ${JSON.stringify(got)}`}`) }
const pass = (m) => { ok++; console.log(`  ✅ ${m}`) }
const eq = (m, a, b) => (JSON.stringify(a) === JSON.stringify(b) ? pass(m) : fail(m, a))

// ── 가짜 D1 ────────────────────────────────────────────────
function fakeDB() {
  const T = { purchases: new Map(), credits: new Map(), entitlements: new Map() }
  const Q = {
    'INSERT OR IGNORE INTO purchases (token, sku, uid, order_id, state, acked, created_at, updated_at) VALUES (?,?,?,?,?,0,?,?)':
      (a) => {
        if (T.purchases.has(a[0])) return { meta: { changes: 0 } }
        T.purchases.set(a[0], { token: a[0], sku: a[1], uid: a[2], order_id: a[3], state: a[4], acked: 0 })
        return { meta: { changes: 1 } }
      },
    'INSERT OR IGNORE INTO credits (token, sku, uid, remaining, needs_consume, consumed, created_at, updated_at) VALUES (?,?,?,?,0,0,?,?)':
      (a) => {
        if (T.credits.has(a[0])) return { meta: { changes: 0 } }
        T.credits.set(a[0], { token: a[0], sku: a[1], uid: a[2], remaining: a[3], needs_consume: 0, consumed: 0, created_at: a[4] })
        return { meta: { changes: 1 } }
      },
    'UPDATE credits SET uid=?, updated_at=? WHERE token=?': (a) => {
      const r = T.credits.get(a[2]); if (!r) return { meta: { changes: 0 } }
      r.uid = a[0]; return { meta: { changes: 1 } }
    },
    'SELECT uid FROM credits WHERE token=?': (a) => {
      const r = T.credits.get(a[0]); return r ? { uid: r.uid } : null
    },
    'UPDATE credits SET uid=?, updated_at=? WHERE uid=? AND remaining>0': (a) => {
      let n = 0
      for (const r of T.credits.values()) if (r.uid === a[2] && r.remaining > 0) { r.uid = a[0]; n++ }
      return { meta: { changes: n } }
    },
    'UPDATE purchases SET uid=?, updated_at=? WHERE token=?': (a) => {
      const r = T.purchases.get(a[2]); if (!r) return { meta: { changes: 0 } }
      r.uid = a[0]; return { meta: { changes: 1 } }
    },
    'INSERT OR REPLACE INTO entitlements (uid, sku, token, created_at) VALUES (?,?,?,?)': (a) => {
      T.entitlements.set(`${a[0]}|${a[1]}`, { uid: a[0], sku: a[1], token: a[2] }); return { meta: { changes: 1 } }
    },
    'UPDATE purchases SET acked=1, updated_at=? WHERE token=?': (a) => {
      const r = T.purchases.get(a[1]); if (!r) return { meta: { changes: 0 } }
      r.acked = 1; return { meta: { changes: 1 } }
    },
    'SELECT token, sku FROM credits WHERE uid=? AND consumed=0 LIMIT 10': (a) =>
      ({ results: [...T.credits.values()].filter((r) => r.uid === a[0] && !r.consumed).slice(0, 10) }),
    'SELECT token, sku FROM credits WHERE uid=? AND consumed=0 AND needs_consume=1 LIMIT 10': (a) =>
      ({ results: [...T.credits.values()].filter((r) => r.uid === a[0] && !r.consumed && r.needs_consume === 1).slice(0, 10) }),
    'UPDATE credits SET consumed=1, updated_at=? WHERE token=?': (a) => {
      const r = T.credits.get(a[1]); if (!r) return { meta: { changes: 0 } }
      r.consumed = 1; return { meta: { changes: 1 } }
    },
    'SELECT COALESCE(SUM(remaining),0) AS n FROM credits WHERE uid=?': (a) =>
      ({ n: [...T.credits.values()].filter((r) => r.uid === a[0]).reduce((s, r) => s + r.remaining, 0) }),
    'SELECT sku FROM entitlements WHERE uid=?': (a) =>
      ({ results: [...T.entitlements.values()].filter((r) => r.uid === a[0]) }),
    'SELECT token FROM credits WHERE uid=? AND remaining>0 ORDER BY created_at LIMIT 1': (a) => {
      const list = [...T.credits.values()].filter((r) => r.uid === a[0] && r.remaining > 0)
        .sort((x, y) => x.created_at - y.created_at)
      return list[0] || null
    },
    'UPDATE credits SET remaining=remaining-1, needs_consume=CASE WHEN remaining-1<=0 THEN 1 ELSE 0 END, updated_at=? WHERE token=? AND remaining>0': (a) => {
      const r = T.credits.get(a[1]); if (!r || r.remaining <= 0) return { meta: { changes: 0 } }
      r.remaining -= 1; r.needs_consume = r.remaining <= 0 ? 1 : 0; return { meta: { changes: 1 } }
    },
    'UPDATE credits SET remaining=remaining+1, updated_at=? WHERE token=?': (a) => {
      const r = T.credits.get(a[1]); if (!r) return { meta: { changes: 0 } }
      r.remaining += 1; return { meta: { changes: 1 } }
    },
  }
  return {
    _T: T,
    prepare(sql) {
      const f = Q[sql]
      // ⛔ 모르는 쿼리면 «죽는다» — 쿼리를 고쳤는데 이 판을 안 고치면 여기서 잡힌다
      if (!f) throw new Error(`⛔ 재현판이 모르는 쿼리다:\n${sql}`)
      let args = []
      const api = {
        bind(...a) { args = a; return api },
        async run() { return { success: true, ...f(args) } },
        async first() { const r = f(args); return r && r.results ? (r.results[0] || null) : r },
        async all() { const r = f(args); return r && r.results ? r : { results: r ? [r] : [] } },
      }
      return api
    },
  }
}

// ── 가짜 KV ────────────────────────────────────────────────
function fakeKV(init = {}) {
  const m = new Map(Object.entries(init))
  return { _m: m, async get(k) { return m.has(k) ? m.get(k) : null }, async put(k, v) { m.set(k, String(v)) } }
}

// ── 가짜 구글 ──────────────────────────────────────────────
const calls = []
function fakeFetch(state) {
  return async (url, opt = {}) => {
    const u = String(url)
    calls.push({ u, method: opt.method || 'GET' })
    if (u.startsWith('https://oauth2.googleapis.com/token')) {
      return new Response(JSON.stringify({ access_token: 'fake-token', expires_in: 3600 }), { status: 200 })
    }
    if (u.includes('androidpublisher')) {
      if (u.endsWith(':acknowledge')) { state.acked++; return new Response('{}', { status: 200 }) }
      if (u.endsWith(':consume')) { state.consumed++; return new Response('{}', { status: 200 }) }
      return new Response(JSON.stringify(state.purchase), { status: state.getStatus || 200 })
    }
    if (u.includes('vision.googleapis.com')) {
      if (state.visionFail) return new Response('nope', { status: 500 })
      return new Response(JSON.stringify({ responses: [{ fullTextAnnotation: { text: '읽은 글자' } }] }), { status: 200 })
    }
    throw new Error(`가짜가 모르는 주소: ${u}`)
  }
}

// ── 서비스 계정(진짜 RSA 열쇠로 만든다 — 서명 코드까지 돌려 봐야 하니까) ──
async function makeSA() {
  const kp = await webcrypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true, ['sign', 'verify'],
  )
  const der = new Uint8Array(await webcrypto.subtle.exportKey('pkcs8', kp.privateKey))
  let b = ''
  for (let i = 0; i < der.length; i++) b += String.fromCharCode(der[i])
  const pem = `-----BEGIN PRIVATE KEY-----\n${btoa(b).replace(/(.{64})/g, '$1\n')}\n-----END PRIVATE KEY-----\n`
  return JSON.stringify({ client_email: 'hankki@test.iam.gserviceaccount.com', private_key: pem })
}

const req = (path, body) => new Request(`https://hankki-ocr.workers.dev${path}`, {
  method: 'POST',
  headers: { Origin: ORIGIN, 'Content-Type': 'application/json', 'x-hankki-token': APP_TOKEN },
  body: JSON.stringify(body),
})

// ═══════════════════════════════════════════════════════════
const run = async () => {
  const src = readFileSync(WORKER, 'utf8')
  const worker = (await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(src)}`)).default

  const SA = await makeSA()
  const state = { acked: 0, consumed: 0, purchase: { purchaseState: 0, acknowledgementState: 0, orderId: 'GPA.1', quantity: 1 } }
  globalThis.fetch = fakeFetch(state)

  const PACK = 'ocr_pack_20'
  const TOK = 'tok-abc'

  // ── ① 꺼져 있을 때 = 아무것도 안 한다 (지금 상태) ─────────
  console.log('\n① 서비스 계정이 없으면 «꺼져 있다» (창업자 확정 ⓑ — 승인 뒤에 만든다)')
  {
    const env = { APP_TOKEN, OCR_KV: fakeKV() }   // PLAY_SA_JSON·HANKKI_DB 없음
    const r = await worker.fetch(req('/billing/sync', { uid: 'u1', purchases: [{ sku: PACK, token: TOK }] }), env)
    eq('/billing/sync → 503 billing_off', [r.status, (await r.json()).error], [503, 'billing_off'])
  }

  // ── ② OCR 은 «한 톨도» 안 바뀐다 ──────────────────────────
  console.log('\n② OCR — 결제를 얹어도 지금과 똑같이 돈다')
  {
    const env = { APP_TOKEN, VISION_KEY: 'k', OCR_KV: fakeKV() }
    const r = await worker.fetch(req('/', { image: 'data:image/png;base64,AAAA', uid: 'u9' }), env)
    const j = await r.json()
    eq('글자가 나온다', [r.status, j.text], [200, '읽은 글자'])
    eq('웰컴 20 → 19 · 유료 칸은 «안» 붙는다', [j.left.welcome, 'paid' in j.left], [19, false])
  }
  console.log('\n②-b 무료를 다 쓴 사람 — D1 이 «없으면» 지금과 똑같이 막힌다')
  {
    const kv = fakeKV({ 'w:u8': '0', ['u:u8:' + new Date().toISOString().slice(0, 7)]: '5' })
    const env = { APP_TOKEN, VISION_KEY: 'k', OCR_KV: kv }   // HANKKI_DB 없음
    const r = await worker.fetch(req('/', { image: 'data:image/png;base64,AAAA', uid: 'u8' }), env)
    eq('429 user_quota (예전 그대로)', [r.status, (await r.json()).error], [429, 'user_quota'])
  }

  // ── ③ 팩을 산다 → 확인·원장·acknowledge ───────────────────
  console.log('\n③ 20장 팩을 샀다 — 확인하고 acknowledge 한다 (⛔안 하면 3일 뒤 환불·회수)')
  const db = fakeDB()
  const kv3 = fakeKV({ 'w:u1': '0', ['u:u1:' + new Date().toISOString().slice(0, 7)]: '5' })
  const env3 = { APP_TOKEN, VISION_KEY: 'k', OCR_KV: kv3, PLAY_SA_JSON: SA, HANKKI_DB: db }
  {
    const r = await worker.fetch(req('/billing/sync', { uid: 'u1', purchases: [{ sku: PACK, token: TOK }] }), env3)
    const j = await r.json()
    eq('ok · 잔량 20', [j.ok, j.credits], [true, 20])
    eq('acknowledge 를 «한 번» 불렀다', state.acked, 1)
    eq('원장에 acked=1 로 적혔다', db._T.purchases.get(TOK).acked, 1)
  }

  // ── ④ 같은 걸 또 보내도 결과가 같다 (멱등) ────────────────
  console.log('\n④ 앱이 켜질 때마다 다시 보낸다 — 몇 번을 보내도 같아야 한다 (멱등)')
  {
    state.purchase.acknowledgementState = 1   // 이제 구글도 「이미 했다」고 답한다
    const r = await worker.fetch(req('/billing/sync', { uid: 'u1', purchases: [{ sku: PACK, token: TOK }] }), env3)
    const j = await r.json()
    eq('잔량이 «40 이 아니라» 20 그대로', j.credits, 20)
    eq('acknowledge 를 다시 안 불렀다', state.acked, 1)
  }

  // ── ⑤ 돈 낸 사람이 «진짜로» 쓴다 ──────────────────────────
  console.log('\n⑤ 무료를 다 쓴 사람인데 «산 장수»가 있다 → 막지 않는다')
  {
    const r = await worker.fetch(req('/', { image: 'data:image/png;base64,AAAA', uid: 'u1' }), env3)
    const j = await r.json()
    eq('글자가 나온다', [r.status, j.text], [200, '읽은 글자'])
    eq('산 장수 20 → 19 로 줄었다', j.left.paid, 19)
  }
  console.log('\n⑤-b 한 묶음(batch)은 여러 장을 읽어도 «한 장»만 깎는다')
  {
    await worker.fetch(req('/', { image: 'data:image/png;base64,AAAA', uid: 'u1', batch: 'B1' }), env3)
    const r = await worker.fetch(req('/', { image: 'data:image/png;base64,AAAA', uid: 'u1', batch: 'B1' }), env3)
    eq('19 → 18 하나만', (await r.json()).left.paid, 18)
  }
  console.log('\n⑤-c Vision 이 죽으면 «돈 낸 장»을 되돌려 준다')
  {
    const before = db._T.credits.get(TOK).remaining
    state.visionFail = true
    const r = await worker.fetch(req('/', { image: 'data:image/png;base64,AAAA', uid: 'u1', batch: 'B2' }), env3)
    state.visionFail = false
    eq('502 로 돌아왔다', r.status, 502)
    eq('장수가 그대로다(깎였다 되돌아왔다)', db._T.credits.get(TOK).remaining, before)
  }

  // ── ⑥ 폰을 바꿨다 = 복원 ──────────────────────────────────
  console.log('\n⑥ 폰을 바꾸거나 앱을 지웠다 깔았다 (uid 가 바뀐다) → 남은 장수가 «따라온다»')
  {
    const left = db._T.credits.get(TOK).remaining
    const r = await worker.fetch(req('/billing/sync', { uid: 'NEW-uid', purchases: [{ sku: PACK, token: TOK }] }), env3)
    const j = await r.json()
    eq('새 기기가 남은 장수를 그대로 받았다', j.credits, left)
    const old = await worker.fetch(req('/billing/state', { uid: 'u1' }), env3)
    eq('옛 기기 쪽은 0 이 됐다(두 배로 늘지 않는다)', (await old.json()).credits, 0)
  }

  // ── ⑥-b 제일 어려운 경우 = 두 번 산 사람이 앱을 지웠다 깐다 ──
  console.log('\n⑥-b 팩을 «두 번» 산 사람이 앱을 지웠다 깐다 — 둘 다 따라와야 한다')
  {
    // 두 번째 팩(다른 토큰)을 지금 기기에 붙인다
    state.purchase = { purchaseState: 0, acknowledgementState: 0, orderId: 'GPA.2', quantity: 1 }
    await worker.fetch(req('/billing/sync', { uid: 'NEW-uid', purchases: [{ sku: PACK, token: 'tok-2nd' }] }), env3)
    const before = (await (await worker.fetch(req('/billing/state', { uid: 'NEW-uid' }), env3)).json()).credits
    eq('두 팩이 한 기기에 모였다', before > 20, true)
    // ⚠️ 앱을 지웠다 깔면 uid 가 바뀌고, `listPurchaseHistory()` 는 **최근 한 건**만 준다
    //    → 두 번째 토큰만 돌아온다. 그래도 옛 주인을 타고 «첫 팩까지» 와야 한다.
    const r = await worker.fetch(req('/billing/sync', { uid: 'AFTER-reinstall', purchases: [{ sku: PACK, token: 'tok-2nd' }] }), env3)
    eq('⭐토큰 하나만 돌아왔는데 «두 팩이 다» 따라왔다', (await r.json()).credits, before)
    const old = await worker.fetch(req('/billing/state', { uid: 'NEW-uid' }), env3)
    eq('옛 기기 쪽은 0 (두 배로 늘지 않는다)', (await old.json()).credits, 0)
  }

  // ── ⑦ 다 쓰면 consume → «또 살 수 있다» ───────────────────
  console.log('\n⑦ 사자마자 비운다(consume) → «언제든 또 살 수 있다». 그래도 남은 장수는 안 사라진다')
  {
    // ⛔ 「다 쓸 때까지 미룬다」는 죽은 길이다 — 안 비우면 Play 가 `ITEM_ALREADY_OWNED` 로
    //    **다 쓰기 전엔 한 팩도 더 못 팔게** 막는다(공식 안드로이드 문서 · 2026-08-19 확인).
    eq('산 팩마다 그때그때 비웠다(＝언제든 또 살 수 있다)', state.consumed, 2)
    // ⭐⭐ 이 칸이 2026-08-19 의 버그를 잡았다 — 「구글이 비웠다」와 「우리 장수가 없다」는 다른 말이다.
    const row = db._T.credits.get(TOK)
    eq('⭐그런데도 남은 장수는 그대로 살아 있다', [row.consumed, row.remaining > 0], [1, true])

    const c0 = state.consumed
    const ME = 'AFTER-reinstall'
    for (const r of db._T.credits.values()) r.remaining = 0
    row.remaining = 1
    const kv7 = env3.OCR_KV
    await kv7.put(`w:${ME}`, '0'); await kv7.put(`u:${ME}:` + new Date().toISOString().slice(0, 7), '5')
    const r1 = await worker.fetch(req('/', { image: 'data:image/png;base64,AAAA', uid: ME, batch: 'B9' }), env3)
    eq('마지막 한 장을 썼다', [(await r1.json()).left.paid, row.remaining], [0, 0])
    eq('OCR 길에선 구글을 한 번도 안 부른다(사진 읽기가 느려지니까)', state.consumed, c0)
    const r2 = await worker.fetch(req('/', { image: 'data:image/png;base64,AAAA', uid: ME, batch: 'B10' }), env3)
    eq('다 쓰면 다시 기본 인식으로(429) — ⛔막는 건 그때가 처음이다', r2.status, 429)
  }

  // ── ⑧ 영구 팩 ─────────────────────────────────────────────
  console.log('\n⑧ 꾸미기 팩(영구) — acknowledge 만 하고 ⛔consume 은 «절대» 안 한다')
  {
    const c0 = state.consumed
    const a0 = state.acked
    state.purchase.acknowledgementState = 0
    const r = await worker.fetch(req('/billing/sync', { uid: 'u2', purchases: [{ sku: 'deco_chuseok', token: 'tok-deco' }] }), env3)
    const j = await r.json()
    eq('추석팩이 붙었다', j.entitlements, ['deco_chuseok'])
    eq('acknowledge 했다', state.acked > a0, true)
    eq('consume 은 안 했다', state.consumed, c0)
  }

  // ── ⑨ 가짜·취소·모르는 상품은 막는다 ──────────────────────
  console.log('\n⑨ 앱 말을 믿지 않는다 — 가짜·취소·모르는 상품')
  {
    const r1 = await worker.fetch(req('/billing/sync', { uid: 'u3', purchases: [{ sku: 'deco_없는것', token: 'x' }] }), env3)
    eq('모르는 상품 → unknown_sku', (await r1.json()).results[0].reason, 'unknown_sku')
    state.purchase = { purchaseState: 1, acknowledgementState: 0 }
    const r2 = await worker.fetch(req('/billing/sync', { uid: 'u3', purchases: [{ sku: PACK, token: 'tok-cancel' }] }), env3)
    eq('취소된 구매 → revoked (＋이미 준 게 있으면 거둬들인다 · 사고판 참고)', (await r2.json()).results[0].reason, 'revoked')
    state.getStatus = 404
    const r3 = await worker.fetch(req('/billing/sync', { uid: 'u3', purchases: [{ sku: PACK, token: 'tok-fake' }] }), env3)
    eq('구글이 모르는 토큰 → token_unknown', (await r3.json()).results[0].reason, 'token_unknown')
    state.getStatus = 200
    eq('가짜에는 장수를 안 줬다', (await (await worker.fetch(req('/billing/state', { uid: 'u3' }), env3)).json()).credits, 0)
  }

  // ── ⑩ 벽은 그대로 ─────────────────────────────────────────
  console.log('\n⑩ 결제 길도 «같은 벽» 뒤에 있다 (오리진·앱토큰)')
  {
    const bad1 = new Request('https://x/billing/state', { method: 'POST', headers: { Origin: 'https://evil.example', 'x-hankki-token': APP_TOKEN }, body: '{}' })
    eq('남의 사이트 → 403', (await worker.fetch(bad1, env3)).status, 403)
    const bad2 = new Request('https://x/billing/state', { method: 'POST', headers: { Origin: ORIGIN }, body: '{}' })
    eq('앱 토큰 없음 → 401', (await worker.fetch(bad2, env3)).status, 401)
    const bad3 = await worker.fetch(req('/billing/없는길', { uid: 'u1' }), env3)
    eq('모르는 길 → 404', bad3.status, 404)
  }

  // ── ⑪ 앱 쪽 — 여긴 «글자로» 본다(브라우저가 없으면 못 돌린다) ──
  console.log('\n⑪ 앱이 제 몫을 하나 (⛔여기가 비면 서버가 아무리 멀쩡해도 소용없다)')
  {
    const bill = readFileSync(join(HERE, '..', 'src', 'billing.js'), 'utf8')
    const main = readFileSync(join(HERE, '..', 'src', 'main.jsx'), 'utf8')
    eq('산 직후 서버에 알린다(＝acknowledge 가 걸린다)', /const sync = await syncPurchases\(\)/.test(bill), true)
    eq('앱을 켤 때마다 다시 보낸다', /syncPurchases\(\)/.test(main), true)
    eq('지금 가진 것을 보낸다(listPurchases)', /await purchases\(\)/.test(bill), true)
    eq('⭐비운 구매까지 되짚는다(listPurchaseHistory) — 이게 빠지면 복원이 죽는다',
      /listPurchaseHistory\(\)/.test(bill) && /await purchaseHistory\(\)/.test(bill), true)
    eq('같은 토큰을 두 번 안 보낸다', /seen\.has\(p\.token\)/.test(bill), true)
    eq('산 장수를 화면 숫자에 바로 반영한다', /setOcrPaid\(j\.credits\)/.test(bill), true)
    eq('⛔꾸미기 팩엔 consume 을 안 부른다', /await s\.consume\(token\)/.test(bill) && !/consume\(.*deco/.test(bill), true)
  }

  console.log(`\n${'─'.repeat(50)}\n✅ ${ok}칸 통과 · ⛔ ${bad}칸 실패`)
  if (bad) { console.log('\n⛔ 결제 서버 재현판이 실패했다.'); process.exit(1) }
}

run().catch((e) => { console.error('⛔ 재현판이 죽었다:', e); process.exit(1) })
