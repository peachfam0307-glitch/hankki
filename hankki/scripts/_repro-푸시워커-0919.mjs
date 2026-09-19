#!/usr/bin/env node
// 🔔⏰ 푸시 워커(ocr-proxy/worker-push.js) 재현판 — 2026-09-19 · 가짜 KV·fetch·시계로 «실제로 돌린다»
//
// 재는 것
//   ① /vapid = 열쇠를 «스스로» 만들고(87자 b64url) 두 번 불러도 «같은» 열쇠(KV 에 남는다) · 비밀 열쇠는 응답에 «없다»
//   ② /subscribe = 오리진·토큰·모양 검사 · 같은 주소는 안 늘어난다 · 41번째가 «새 묶음»(묶음크기 40)
//   ③ 보내기 = 때가 아니면 안 보낸다 · 때가 되면 «묶음 하나»만 · 잠금을 «먼저» 박는다 · 또 부르면 다음 묶음 · 다 보내면 멈춘다
//   ④ 410 은 묶음에서 «빠진다» · 일시 실패(500)는 «남는다» · 기록(보냄·성공·만료삭제)이 쌓인다
//   ⑤ 한 번 깨어날 때 바깥 요청(KV 포함) ≤ 50 (무료 상한) — 여기가 규모 검토가 잡은 그 자리다
//   ⑥ /today = 있는 날은 표(tag)가 «날짜별» · 없는 날은 404 · 보낼 것 없는 날은 보내기가 «안 한다»
//   ⑦ ?quota=1 = 열쇠 없으면 401 · 맞으면 구독 수·이달 기록
//   ⑧ 앱이 굽는 일정(push-schedule.mjs) = 하루 «한 줄» · 시각은 갈래 중 제일 이른 것 · 명절 줄이 있으면 밋밋한 꾸미기 줄은 없다
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

let 나쁨 = 0
const 잰다 = (좋나, 이름, 덧 = '') => { if (!좋나) 나쁨++; console.log(`  ${좋나 ? '✅' : '⛔'} ${이름}${덧 ? ' — ' + 덧 : ''}`) }
console.log('\n🔔⏰ 푸시 워커\n')

// ── 가짜 KV (Cloudflare 꼴: get(key, 'json') · put · 셈)
let kv셈 = 0
const 서랍 = new Map()
const KV = {
  get: async (k, t) => { kv셈++; const v = 서랍.has(k) ? 서랍.get(k) : null; return t === 'json' && v != null ? JSON.parse(v) : v },
  put: async (k, v) => { kv셈++; 서랍.set(k, String(v)) },
}
const env = { PUSH_KV: KV, APP_TOKEN: 'tok', FOUNDER_SECRET: 'fs' }
// ── 가짜 바깥 — 일정 JSON ＋ 푸시 endpoint
const 일정 = { 날: { '2026-09-21': { 제목: '한끼', 본문: '이번 주 레시피가 열렸어요 — 버섯', 길: './', 시각: '15:30' } } }
let fetch셈 = 0
const 보낸곳 = []
let 응답표 = {}   // endpoint → status
globalThis.fetch = async (url, opt = {}) => {
  fetch셈++
  const u = String(url)
  if (u.includes('/push/schedule.json')) return new Response(JSON.stringify(일정), { status: 200 })
  보낸곳.push(u)
  const st = 응답표[u] ?? 201
  if (opt.headers) { const a = opt.headers.Authorization || ''; if (!/^vapid t=[\w-]+\.[\w-]+\.[\w-]+, k=[\w-]{80,}$/.test(a)) return new Response('bad vapid', { status: 400 }) }
  return new Response('', { status: st })
}
const W = await import('../ocr-proxy/worker-push.js')
const worker = W.default
const 요청 = (p, o = {}) => worker.fetch(new Request('https://hankki-push.annyeong-hankki.workers.dev' + p, { headers: { Origin: 'https://peachfam0307-glitch.github.io', ...(o.headers || {}) }, method: o.method || 'GET', body: o.body }), env, { waitUntil: () => {} })
const 구독 = (i) => ({ endpoint: `https://fcm.example/send/${i}`, keys: { p256dh: 'x', auth: 'y' } })
const 넣기 = (i, extra = {}) => 요청('/subscribe', { method: 'POST', headers: { 'x-hankki-token': 'tok', 'Content-Type': 'application/json', ...(extra.headers || {}) }, body: JSON.stringify({ platform: 'web', sub: extra.sub || 구독(i) }) })

// ① vapid
{
  const a = await (await 요청('/vapid')).json()
  const b = await (await 요청('/vapid')).json()
  잰다(typeof a.pub === 'string' && a.pub.length === 87 && /^[\w-]+$/.test(a.pub), '① /vapid 가 열쇠를 스스로 만든다 (87자 b64url)', a.pub?.slice(0, 12) + '…')
  잰다(a.pub === b.pub && !('priv' in a), '① 두 번 불러도 같은 열쇠 · 비밀 열쇠는 응답에 없다')
}
// ② subscribe
{
  const 남 = await worker.fetch(new Request('https://x/subscribe', { method: 'POST', headers: { Origin: 'https://evil.example' }, body: '{}' }), env, {})
  잰다(남.status === 403, '② 딴 오리진 = 403')
  잰다((await 넣기(0, { headers: { 'x-hankki-token': 'wrong' } })).status === 401, '② 토큰 틀리면 401')
  잰다((await 넣기(0, { sub: { endpoint: 'http://no-tls' } })).status === 400, '② https 가 아니면 400')
  const r1 = await (await 넣기(1)).json(); const r2 = await (await 넣기(1)).json()
  잰다(r1.ok && r1.묶음 === 0 && r2.이미 === true, '② 첫 구독 = 묶음 0 · 같은 주소 다시 = 「이미」')
  for (let i = 2; i <= 41; i++) await 넣기(i)
  const n = await KV.get('push:n', 'json')
  const 묶0 = await KV.get('push:web:0', 'json'), 묶1 = await KV.get('push:web:1', 'json')
  잰다(n.web === 2 && 묶0.length === 40 && 묶1.length === 1, '② 41명 = 묶음 0 에 40 · 묶음 1 에 1 (묶음크기 40)', `n=${JSON.stringify(n)}`)
}
// ③ 보내기 — 때·묶음 하나·잠금·다음 묶음·끝
{
  const 아침 = new Date('2026-09-21T00:00:00Z')      // 09:00 KST — 레시피 날인데 아직 때가 아니다
  const r0 = await W.보내기(env, 아침)
  잰다(r0.했나 === false && /아직/.test(r0.왜) && 보낸곳.length === 0, '③ 15:30 전엔 안 보낸다', r0.왜)
  const 때 = new Date('2026-09-21T06:31:00Z')        // 15:31 KST
  fetch셈 = 0; kv셈 = 0
  const r1 = await W.보내기(env, 때)
  const 첫판요청 = fetch셈 + kv셈
  잰다(r1.했나 === true && r1.묶음 === 0 && r1.보냄 === 40 && 보낸곳.length === 40, '③ 때가 되면 «묶음 0 만» 40명', JSON.stringify(r1))
  잰다(await KV.get('push:sent:2026-09-21:web:0') === '1', '③ 잠금 push:sent:<날>:web:0 이 박혔다')
  const r2 = await W.보내기(env, 때)
  잰다(r2.했나 === true && r2.묶음 === 1 && r2.보냄 === 1 && 보낸곳.length === 41, '③ 또 부르면 «다음 묶음»(1명)')
  const r3 = await W.보내기(env, 때)
  잰다(r3.했나 === false && /다 보냈다/.test(r3.왜) && 보낸곳.length === 41, '③ 다 보냈으면 멈춘다 — 같은 사람에게 두 번 안 간다')
  const 늦게 = new Date('2026-09-21T08:00:00Z')      // 17:00 KST — 창(60분)이 지났다
  const r4 = await W.보내기(env, 늦게)
  잰다(r4.했나 === false && /아직/.test(r4.왜), '③ 60분 창이 지나면 그날은 안 보낸다 (늦은 알림은 짜증이다)')
  // ⑤ 규모 — 한 번 깨어날 때 바깥 요청 ≤ 50
  잰다(첫판요청 <= 50, `⑤ 한 번 깨어날 때 바깥 요청(fetch＋KV) ${첫판요청} ≤ 50 (무료 상한)`)
}
// ④ 410 은 빠진다 · 500 은 남는다 · 기록
{
  서랍.delete('push:sent:2026-09-21:web:0'); 서랍.delete('push:sent:2026-09-21:web:1')
  응답표 = { 'https://fcm.example/send/3': 410, 'https://fcm.example/send/4': 500 }
  보낸곳.length = 0
  await W.보내기(env, new Date('2026-09-21T06:40:00Z'))
  const 묶0 = await KV.get('push:web:0', 'json')
  잰다(묶0.length === 39 && !묶0.some((s) => s.endpoint.endsWith('/3')) && 묶0.some((s) => s.endpoint.endsWith('/4')), '④ 410 은 묶음에서 빠지고(39명) 500 은 남는다')
  const 기록 = await KV.get('push:log:2026-09', 'json')
  잰다(기록.만료삭제 === 1 && 기록.보냄 >= 80 && 기록.실행 >= 3, '④ 기록(보냄·성공·만료삭제·실행)이 쌓인다', JSON.stringify(기록))
}
// ⑥ today
{
  globalThis.Date = class extends Date { constructor(...a) { super(...(a.length ? a : ['2026-09-21T06:31:00Z'])) } }
  const t = await (await 요청('/today')).json()
  잰다(t.본문 && t.표 === 'hankki-2026-09-21', '⑥ /today = 오늘 문구 ＋ 날짜별 tag', t.표)
  globalThis.Date = class extends Date { constructor(...a) { super(...(a.length ? a : ['2026-09-22T06:31:00Z'])) } }
  잰다((await 요청('/today')).status === 404, '⑥ 보낼 것 없는 날 = 404')
  const r = await W.보내기(env, new Date('2026-09-22T06:31:00Z'))
  잰다(r.했나 === false && /없음/.test(r.왜), '⑥ 보낼 것 없는 날은 보내기도 «안 한다»')
}
// ⑦ quota
{
  잰다((await 요청('/?quota=1&key=nope')).status === 401, '⑦ quota 열쇠 틀리면 401')
  const q = await (await 요청('/?quota=1&key=fs')).json()
  잰다(q.구독?.web === 40 && q.이달?.실행 >= 3 && q.vapid === '있음', '⑦ quota = 구독 40(410 하나 빠진 뒤) · 이달 기록 · vapid 있음', JSON.stringify(q.구독))
}
// ⑧ 일정 굽기
{
  const { 일정만들기, 시각표 } = await import('./push-schedule.mjs')
  const s = 일정만들기('2026-09-19')
  const 날들 = Object.entries(s.날)
  잰다(날들.length > 0 && 날들.every(([d, v]) => /^\d{4}-\d{2}-\d{2}$/.test(d) && v.본문 && v.시각), `⑧ 일정 ${날들.length}일치 · 날마다 «한 줄»`)
  잰다(시각표.cart === '09:00' && 시각표.recipe === '15:30' && 시각표.decor === '20:00', '⑧ 시각표 = 창업자 확정(토 09:00 · 월수 15:30 · 꾸미기 20:00)')
  const 핼 = s.날['2026-10-01']
  잰다(핼 && 핼.시각 === '20:00' && /핼러윈 꾸미기가 열렸어요/.test(핼.본문) && !/새 꾸미기가 열렸어요/.test(핼.본문), '⑧ 10/1 = 핼러윈 줄 하나(밋밋한 「새 꾸미기」 줄은 합쳐져 사라진다)', 핼?.본문)
  const 겹침 = 날들.find(([, v]) => v.갈래.length > 1)
  잰다(!겹침 || 겹침[1].시각 === 겹침[1].갈래.map((k) => 시각표[k]).sort()[0], '⑧ 갈래가 겹치는 날 시각 = «제일 이른 것»', 겹침 ? `${겹침[0]} ${겹침[1].갈래.join('+')} → ${겹침[1].시각}` : '(120일 안에 겹치는 날 없음)')
}

console.log(나쁨 ? `\n⛔ ${나쁨}개 틀렸다` : '\n✅ 푸시 워커 — 묶음·잠금·410·상한 다 제자리')
process.exit(나쁨 ? 1 : 0)
