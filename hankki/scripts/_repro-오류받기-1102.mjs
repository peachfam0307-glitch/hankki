// ⚠️ 앱 오류 받기 재현판 (운영 2단계 · 2026-11-02) — worker-push.js 의 /error 를 가짜 KV·fetch 로 «실제로 돌린다»
//   ① 처음 보는 오류 = 창업자 폰 알림 1번 ② 같은 오류 = 안 울림 ③ 하루 20가지 넘으면 안 울림
//   ④ 개인 칸(글·메일)은 로그에 안 남는다 ⑤ 출처·열쇠 없으면 막는다 ⑥ inbox 문구 = 「처음 보는 오류」
//   ⛔ 주소는 전부 가짜(.example 예약 도메인) — 바깥으로 요청이 안 나간다
const 담 = new Map()
const kv = { get: async (k, t) => { const v = 담.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v }, put: async (k, v) => { 담.set(k, v) }, delete: async (k) => { 담.delete(k) } }
let 푸시 = 0
globalThis.fetch = async (u) => { if (String(u).startsWith('https://push.example')) { 푸시++; return new Response('', { status: 201 }) } return new Response('', { status: 404 }) }
const 로그 = []; const 원로그 = console.log; console.log = (...a) => 로그.push(a.join(' '))
const { default: w, 미룬오류울리기 } = await import('../ocr-proxy/worker-push.js')
// ⏩ 2026-11-06 창업자 「1번하자」 = 오류 알림은 «바로» 안 울리고 아침 7시·저녁 7시에 모아서 한 번(그때 cron 이 울린다)
const 울릴때가지나서 = async () => 미룬오류울리기(kv, new Date(Date.now() + 13 * 3600000))
const env = { PUSH_KV: kv, APP_TOKEN: 't', FOUNDER_SECRET: 'f' }
const 기다림 = []; const ctx = { waitUntil: (p) => 기다림.push(p) }
const 보냄 = (몸, 머리 = {}) => w.fetch(new Request('https://w.example/error', { method: 'POST', headers: { Origin: 'https://peachfam0307-glitch.github.io', 'x-hankki-token': 't', ...머리 }, body: JSON.stringify(몸) }), env, ctx)
await kv.put('push:founder:subs', JSON.stringify([{ endpoint: 'https://push.example/1', keys: {} }]))
let 틀림 = 0; const 잰다 = (ok, m) => { 원로그(`  ${ok ? '✅' : '⛔'} ${m}`); if (!ok) 틀림++ }
const 오류 = { 판: 'v14.71', 기기: 'ios', 화면: 'detail', 종류: 'error', 메시지: 'x is undefined', 위치: 'at a (index.js:1:200)', 직전: ['home:open', 'detail:open', 'memo:tap'], 글: '비밀 일기', 메일: 'a@b.c' }
let r = await (await 보냄(오류)).json(); await Promise.all(기다림)
잰다(r.처음 === true && 푸시 === 0, `①-1 처음 보는 오류 → «바로는» 안 울림 (푸시 ${푸시})`)
await 울릴때가지나서()
잰다(푸시 === 1, `①-2 울릴 때(7시·19시)가 지나면 1번 (푸시 ${푸시})`)
r = await (await 보냄(오류)).json(); await Promise.all(기다림); await 울릴때가지나서()
잰다(!r.처음 && 푸시 === 1, `② 같은 오류 다시 → 안 울림 (푸시 ${푸시})`)
for (let i = 0; i < 25; i++) await 보냄({ ...오류, 메시지: `다른 오류 ${i}` })
await Promise.all(기다림); await 울릴때가지나서()
잰다(푸시 === 2, `③ 여러 가지가 와도 한 번에 묶어 1번 (푸시 ${푸시})`)
const 줄 = 로그.find((l) => l.includes('앱오류')) || ''
잰다(줄.includes('memo:tap') && 줄.includes('index.js:1:200') && 줄.includes('v14.71'), '④-1 로그에 판·위치·직전 행동이 남는다')
잰다(!줄.includes('비밀 일기') && !줄.includes('a@b.c'), '④-2 개인 칸(글·메일)은 로그에 없다')
잰다((await 보냄(오류, { 'x-hankki-token': 'x' })).status === 401, '⑤-1 열쇠 틀리면 401')
const 남 = await w.fetch(new Request('https://w.example/error', { method: 'POST', headers: { Origin: 'https://evil.example', 'x-hankki-token': 't' }, body: '{}' }), env, ctx)
잰다(남.status === 403, '⑤-2 남의 사이트면 403')
잰다((await 보냄({ 메시지: 'x'.repeat(9000) })).status === 413, '⑤-3 너무 크면 413')
await kv.put('push:founder:pending', JSON.stringify([{ 가게: '오류', 때: 1 }]))
const 해시 = await (async (s) => { const b = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))); let h = ''; for (let i = 0; i < 12; i++) h += b[i].toString(16).padStart(2, '0'); return h })('https://push.example/1')
const 인 = await (await w.fetch(new Request(`https://w.example/founder/inbox?h=${해시}`), env, ctx)).json()
잰다(/처음 보는 오류/.test(인.제목), `⑥ 폰에 뜨는 제목 = 「${인.제목}」`)
원로그(틀림 ? `⛔ ${틀림}칸 어긋남` : '✅ 오류 받기 — 처음만 울림 · 하루 20 · 개인 칸 없음 · 문 지킴')
process.exit(틀림 ? 1 : 0)
