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
// ⑤ 정리 워커를 «실제로» 돌린다 — 가짜 AI·KV·PUSH 바인딩 · 오늘 칸을 139(문턱 140 바로 아래)로 두고 두 번 부른다
{
  const 칸 = new Map(); const tkv = { get: async (k) => 칸.get(k) ?? null, put: async (k, v) => { 칸.set(k, String(v)) } }
  const { default: tw } = await import('../ocr-proxy/worker-tidy.js')
  const { todayKST } = await import('../src/today.js')
  const 핑 = []
  const tenv = { TIDY_KV: tkv, APP_TOKEN: 't', FOUNDER_SECRET: 'f', AI: { run: async () => ({ response: '{"title":"김치찌개","ingredients":[],"steps":[]}' }) },
    PUSH: { fetch: async (u, o) => { 핑.push(JSON.parse(o.body).가게); return new Response('{}') } } }
  const 대기 = []; const tctx = { waitUntil: (p) => 대기.push(p) }
  const 부름 = () => tw.fetch(new Request('https://t.example/', { method: 'POST', headers: { Origin: 'https://peachfam0307-glitch.github.io', 'x-hankki-token': 't', 'Content-Type': 'application/json' }, body: JSON.stringify({ text: '김치찌개\n김치 300g\n돼지고기 200g\n1. 볶는다\n2. 끓인다' }) }), tenv, tctx)
  // ⚠️ 한 번 부를 때 모델을 «여러 번» 부를 수 있다(앞 모델 실패 → 다음 모델) — 통은 «모델 부른 횟수»로 센다(상한과 같은 잣대).
  //    그래서 «몇 번 불렀나»가 아니라 «통이 몇이 됐나»로 판정한다(2026-11-02 실측: 가짜 AI 한 번 = 통 +2)
  const 통 = () => Number(칸.get(`td:${todayKST()}`) || 0)
  칸.set(`td:${todayKST()}`, '100'); await 부름(); await Promise.all(대기)
  잰다(통() < 140 && 핑.length === 0, `⑤-1 문턱 아래(통 ${통()}) → 안 울림 (핑 ${핑.length})`)
  칸.set(`td:${todayKST()}`, '139'); await 부름(); await Promise.all(대기)
  잰다(통() >= 140 && 핑.length === 1 && 핑[0] === '한도정리', `⑤-2 140 넘음(통 ${통()}) → 1번 「${핑[0]}」`)
  await 부름(); await 부름(); await Promise.all(대기)
  잰다(핑.length === 1, `⑤-3 같은 날 더 불러도 안 울림 (통 ${통()} · 핑 ${핑.length})`)
  // ⑤-4 바인딩이 «있을 때»와 «없을 때» 답이 같아야 한다(가짜 AI 는 빈 답이라 둘 다 «모델 다 실패» 답이 나온다 — 그 답이 같으면 된다)
  const 있을때 = (await 부름()).status
  delete tenv.PUSH; 칸.delete(`qa:${todayKST()}`)
  let 끝 = 0; try { 끝 = (await 부름()).status } catch (e) { 끝 = String(e) }
  잰다(끝 === 있을때, `⑤-4 PUSH 바인딩이 없어도 답이 같다 (있을 때 ${있을때} · 없을 때 ${끝})`)
}
console.log(틀림 ? `⛔ ${틀림}칸 어긋남` : '✅ 한도 70% 알림')
process.exit(틀림 ? 1 : 0)
