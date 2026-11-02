// 📈 한도 70% 알림 재현판 (운영 3단계 · 2026-11-02) — 푸시 워커 /founder/ping 에 「한도」가 들어가고 폰 제목이 맞나
//   ① 한도사진 소식 → 폰 알림 1번 ② inbox 제목 = 「사용량이 한도의 70%」 ③ 구매와 섞이면 본문에 같이 실린다
//   ⛔ 주소는 전부 가짜(.example) — 바깥으로 안 나간다
const 담 = new Map()
const kv = { get: async (k, t) => { const v = 담.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v }, put: async (k, v) => { 담.set(k, v) } }
let 푸시 = 0
globalThis.fetch = async (u) => { if (String(u).startsWith('https://push.example')) { 푸시++; return new Response('', { status: 201 }) } return new Response('', { status: 404 }) }
const { default: w } = await import('../ocr-proxy/worker-push.js')
const env = { PUSH_KV: kv, APP_TOKEN: 't', FOUNDER_SECRET: 'f' }
const ctx = { waitUntil: () => {} }
await kv.put('push:founder:subs', JSON.stringify([{ endpoint: 'https://push.example/1', keys: {} }]))
const 핑 = (가게) => w.fetch(new Request('https://w.example/founder/ping', { method: 'POST', headers: { 'x-hankki-founder': 'f', 'Content-Type': 'application/json' }, body: JSON.stringify({ 가게 }) }), env, ctx)
const 해시 = await (async (s) => { const b = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))); let h = ''; for (let i = 0; i < 12; i++) h += b[i].toString(16).padStart(2, '0'); return h })('https://push.example/1')
const 받기 = async () => (await w.fetch(new Request(`https://w.example/founder/inbox?h=${해시}`), env, ctx)).json()
let 틀림 = 0; const 잰다 = (ok, m) => { console.log(`  ${ok ? '✅' : '⛔'} ${m}`); if (!ok) 틀림++ }
await 핑('한도사진')
잰다(푸시 === 1, `① 한도 소식 → 폰 알림 1번 (푸시 ${푸시})`)
let 인 = await 받기()
잰다(/한도의 70%/.test(인.제목) && /사진 읽기/.test(인.본문), `② 제목 「${인.제목}」 · 본문 「${인.본문}」`)
await 핑('한도정리'); await 핑('구글')
인 = await 받기()
잰다(/팔렸/.test(인.제목) && /AI 정리/.test(인.본문), `③ 구매와 섞임 → 「${인.제목}」 · 「${인.본문}」`)
// 사진·정리 워커 쪽 = 70% 문턱 줄이 있나(실제 Vision 을 부르지 않고 코드로만 확인)
const { readFileSync } = await import('node:fs')
const ocr = readFileSync(new URL('../ocr-proxy/worker.js', import.meta.url), 'utf8')
const tidy = readFileSync(new URL('../ocr-proxy/worker-tidy.js', import.meta.url), 'utf8')
잰다(/MONTHLY_GLOBAL \* 0\.7/.test(ocr) && /'한도사진'/.test(ocr) && /qa:\$\{ym\}/.test(ocr), '④ 사진 워커 = 이번 달 70% · 달마다 한 번')
잰다(/DAILY_GLOBAL \* 0\.7/.test(tidy) && /'한도정리'/.test(tidy) && /qa:\$\{ymd\}/.test(tidy), '⑤ 정리 워커 = 오늘 70% · 하루 한 번')
console.log(틀림 ? `⛔ ${틀림}칸 어긋남` : '✅ 한도 70% 알림')
process.exit(틀림 ? 1 : 0)
