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
// ⏰ 아래 '15:30' 은 «가짜 일정»의 시각이다 — 창업자 확정값이 아니다(그건 push-schedule.mjs 의 시각표 = 17:00).
//    여기서 재는 건 「적힌 시각 «전»엔 안 보내고, 그 뒤 60분 안에만 보낸다」는 «창»이라 숫자가 무엇이든 상관없다.
//    ⛔ 이 줄을 보고 「알림은 15:30 이다」로 읽지 말 것 — 시각표는 ⑧ 칸이 잰다.
const 일정 = { 날: { '2026-09-21': { 제목: '한끼', 본문: '이번 주 레시피가 열렸어요 — 버섯', 길: './', 시각: '15:30' } } }
let fetch셈 = 0
const 보낸곳 = []
const 애플몸통 = []   // 🍎 아이폰에 «실제로 실려 간» 알맹이 — 제목·본문이 들었나를 여기서 본다
let 응답표 = {}   // endpoint → status
globalThis.fetch = async (url, opt = {}) => {
  fetch셈++
  const u = String(url)
  if (u.includes('/push/schedule.json')) return new Response(JSON.stringify(일정), { status: 200 })
  보낸곳.push(u)
  // 🍎 [2026-09-20] 애플 문 — 웹 푸시와 «헤더도 몸통도» 다르다. 아래 vapid 검사에 걸리면 안 되니 «먼저» 가른다.
  if (u.includes('push.apple.com')) {
    const h = opt.headers || {}
    if (!/^bearer [\w-]+\.[\w-]+\.[\w-]+$/.test(h.authorization || '')) return new Response(JSON.stringify({ reason: 'MissingProviderToken' }), { status: 403 })
    if (h['apns-topic'] !== 'kr.hankki.app') return new Response(JSON.stringify({ reason: 'BadTopic' }), { status: 400 })
    애플몸통.push(JSON.parse(opt.body || '{}'))
    const st = 응답표[u] ?? 200
    return new Response(st === 200 ? '' : JSON.stringify({ reason: 응답표[u + ':왜'] || 'BadDeviceToken' }), { status: st })
  }
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
  잰다(r0.했나 === false && /아직/.test(r0.왜) && 보낸곳.length === 0, '③ 일정에 적힌 시각 «전»엔 안 보낸다', r0.왜)
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
  잰다(시각표.cart === '09:00' && 시각표.recipe === '17:00' && 시각표.sns === '17:00' && 시각표.decor === '20:00', '⑧ 시각표 = 창업자 확정(토 09:00 · 월수 17:00 · 꾸미기 20:00) — ⏰17:00 은 2026-09-20 GA4 시간대 실측으로 15:30 에서 옮긴 값이다')
  // 🎃 [2026-09-20 창업자 「할로윈은 16일로 미뤄」] 핼러윈 창이 10/01 → **10/16** 으로 옮겨졌다.
  //   📮 왜 = *"10월1일에 다 열어버리면 한달 내내 뭐가 없어"* → 10월을 셋으로 나눴다(10/01 가을 · 10/16 핼러윈＋이벤트 · 11/01 늦가을).
  //   ⭐ 이 잣대가 재는 것은 «날짜»가 아니라 **「명절 이름이 붙으면 밋밋한 줄이 합쳐져 사라진다」** 이다. 그래서 날짜만 옮긴다.
  const 핼 = s.날['2026-10-16']
  잰다(핼 && 핼.시각 === '20:00' && /핼러윈 꾸미기가 열렸어요/.test(핼.본문) && !/새 꾸미기가 열렸어요/.test(핼.본문), '⑧ 10/16 = 핼러윈 줄 하나(밋밋한 「새 꾸미기」 줄은 합쳐져 사라진다)', 핼?.본문)
  // ⛔ 그리고 10/01 은 «가을»이라 밋밋한 줄이어야 한다 — 여기에 핼러윈이 뜨면 날짜가 도로 밀린 것이다.
  const 가을 = s.날['2026-10-01']
  잰다(가을 && /새 꾸미기가 열렸어요/.test(가을.본문) && !/핼러윈/.test(가을.본문), '⑧ 10/1 = 가을(밋밋한 줄) — 핼러윈이 뜨면 창이 도로 10/01 로 밀린 것이다', 가을?.본문)
  const 겹침 = 날들.find(([, v]) => v.갈래.length > 1)
  잰다(!겹침 || 겹침[1].시각 === 겹침[1].갈래.map((k) => 시각표[k]).sort()[0], '⑧ 갈래가 겹치는 날 시각 = «제일 이른 것»', 겹침 ? `${겹침[0]} ${겹침[1].갈래.join('+')} → ${겹침[1].시각}` : '(120일 안에 겹치는 날 없음)')
}

// ⑨ 📅 D-2 «따로» 알림 — /expiry 로 날짜만 · 일정 없는 날 아침 9시에 그 폰들에게만 · 40명씩 · 두 번 안 보냄 · 일정 있는 날은 안 보냄
{
  const 날짜넣기 = (ep, dates, tok = 'tok') => 요청('/expiry', { method: 'POST', headers: { 'x-hankki-token': tok, 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: ep, dates }) })
  const 폰A = 'https://fcm.example/send/A', 폰B = 'https://fcm.example/send/B'
  잰다((await 날짜넣기(폰A, ['2026-09-24'], 'wrong')).status === 401, '⑨ /expiry 토큰 틀리면 401')
  잰다((await (await 날짜넣기(폰A, 'x')).json()).error === 'bad_dates', '⑨ dates 가 배열이 아니면 400')
  const a1 = await (await 날짜넣기(폰A, ['2026-09-24', '2026-09-27', '2026-09-24', '2020-01-01', 'zzz'])).json()
  잰다(a1.ok && a1.더함 === 2 && a1.뺌 === 0, '⑨ 폰A = 9/24·9/27 (중복·지난 날·엉뚱한 글자는 버린다)', JSON.stringify(a1))
  await 날짜넣기(폰B, ['2026-09-24'])
  잰다(JSON.stringify(await KV.get('push:exp:2026-09-24', 'json')) === JSON.stringify([폰A, 폰B]), '⑨ push:exp:2026-09-24 = [A, B]')
  const a2 = await (await 날짜넣기(폰A, ['2026-09-27', '2026-09-30'])).json()
  const 날24 = await KV.get('push:exp:2026-09-24', 'json'), 날30 = await KV.get('push:exp:2026-09-30', 'json')
  잰다(a2.더함 === 1 && a2.뺌 === 1 && JSON.stringify(날24) === JSON.stringify([폰B]) && JSON.stringify(날30) === JSON.stringify([폰A]), '⑨ 폰A 가 목록을 바꾸면 «옛 날짜에서 빠지고» 새 날짜에 들어간다 (재료를 먹어 치운 폰에 안 보낸다)')
  const a3 = await (await 날짜넣기(폰A, ['2026-09-27', '2026-09-30'])).json()
  잰다(a3.더함 === 0 && a3.뺌 === 0, '⑨ 같은 목록 다시 = KV 쓰기 없이 0·0 (폰이 같으면 안 보내지만 워커도 한 번 더 막는다)')
  const 시월 = Array.from({ length: 20 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`), 동지 = Array.from({ length: 20 }, (_, i) => `2026-11-${String(i + 1).padStart(2, '0')}`)
  await 날짜넣기('https://fcm.example/send/C', 시월)
  const a4 = await (await 날짜넣기('https://fcm.example/send/C', 동지)).json()
  const a5 = await (await 날짜넣기('https://fcm.example/send/C', 동지)).json()
  잰다(a4.partial === true && a4.더함 + a4.뺌 === 20 && !a5.partial && a4.더함 + a4.뺌 + a5.더함 + a5.뺌 === 40, '⑨ 한 요청에 바꿀 칸이 20 넘으면 partial → 앱이 한 번 더 보내면 마저 맞춘다 (50 요청 상한)', JSON.stringify(a4) + ' → ' + JSON.stringify(a5))
  // 보내기 — 9/24 는 일정 «없는» 날(일정 = 9/21 만) → 09:00 창에 폰B(위에서 9/24 는 B 만 남았다)
  보낸곳.length = 0
  const r0 = await W.보내기(env, new Date('2026-09-23T23:30:00Z'))   // KST 9/24 08:30
  잰다(r0.했나 === false && /D-2/.test(r0.왜), '⑨ 08:30 = 아직 안 보낸다', r0.왜)
  const r1 = await W.보내기(env, new Date('2026-09-24T00:10:00Z'))   // KST 09:10
  잰다(r1.했나 === true && r1.임박 === true && r1.보냄 === 1 && 보낸곳.length === 1 && 보낸곳[0] === 폰B, '⑨ 09:10 = 9/24 에 적힌 폰B «하나»에게만 빈 푸시', JSON.stringify(r1))
  const r2 = await W.보내기(env, new Date('2026-09-24T00:20:00Z'))
  잰다(r2.했나 === false && /다 보냈다/.test(r2.왜) && 보낸곳.length === 1, '⑨ 5분 뒤 또 깨어나도 «두 번 안 보낸다»')
  // 41명이 같은 날이면 40 ＋ 1
  for (let i = 0; i < 41; i++) await 날짜넣기(`https://fcm.example/send/m${i}`, ['2026-09-25'])
  보낸곳.length = 0
  const r3 = await W.보내기(env, new Date('2026-09-25T00:05:00Z'))
  const r4 = await W.보내기(env, new Date('2026-09-25T00:10:00Z'))
  const r5 = await W.보내기(env, new Date('2026-09-25T00:15:00Z'))
  잰다(r3.보냄 === 40 && r4.보냄 === 1 && r5.했나 === false && 보낸곳.length === 41, '⑨ 41명 = 40 → 1 → 끝 (한 번 깨어나면 40명 · 50 상한)')
  // 일정 «있는» 날(9/21)엔 따로 안 보낸다 — 얹기가 대신한다
  await 날짜넣기('https://fcm.example/send/z', ['2026-09-21'])
  보낸곳.length = 0
  const r6 = await W.보내기(env, new Date('2026-09-21T00:10:00Z'))   // KST 9/21 09:10 — 일정은 15:30
  잰다(r6.했나 === false && !/D-2/.test(r6.왜) && 보낸곳.length === 0, '⑨ 일정 있는 날(9/21) 아침엔 D-2 를 «따로 안 보낸다» — 그날 알림 둘째 줄에 얹힌다(하루 한 번)', r6.왜)
  잰다(!JSON.stringify([...서랍.keys()]).includes('두부') && ![...서랍.values()].some((v) => /두부|우유|name/.test(v)), '⑨ KV 어디에도 재료 이름이 없다 — 날짜와 주소뿐')
}

// ⑩ 🍎 아이폰(APNs) — 2026-09-20 · 딸 아이폰 실측 「푸시 API: 없음」이라 네이티브로 간다
{
  서랍.clear(); 보낸곳.length = 0; 애플몸통.length = 0; 응답표 = {}
  const { generateKeyPairSync } = await import('node:crypto')
  const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256', privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } })
  const 아이폰env = { ...env, APNS_KEY: privateKey, APNS_KEY_ID: 'ABCD123456', APNS_TEAM_ID: 'TEAM123456' }
  const 토큰 = (n) => String(n).padStart(2, '0').repeat(32)   // 16진 64자
  const 아이폰넣기 = (n, extra = {}) => 요청('/subscribe', { method: 'POST', headers: { 'x-hankki-token': 'tok', 'Content-Type': 'application/json' }, body: JSON.stringify({ platform: 'ios', sub: { endpoint: 토큰(n) }, ...extra }) })

  잰다((await 아이폰넣기('zz')).status === 400, '⑩ 16진 64자가 아니면 400 (잣대를 좁게 — 쓰레기가 KV 에 안 쌓인다)')
  const a = await (await 아이폰넣기(1)).json()
  잰다(a.ok === true && (await KV.get('push:n', 'json')).ios === 1, '⑩ 아이폰 구독이 «ios 칸»에 담긴다 (웹 묶음과 안 섞인다)')
  잰다((await KV.get('push:ios:0', 'json'))[0].문 === 'production', '⑩ 기본 문 = production (TestFlight·스토어가 그 문이다)')

  const 때 = new Date('2026-09-21T06:40:00Z')   // KST 15:40 — 일정 15:30 부터 60분 안
  const r = await W.보내기(아이폰env, 때)
  잰다(r.했나 === true && r.플랫폼 === 'ios' && r.성공 === 1, '⑩ 때가 되면 아이폰에 보낸다', JSON.stringify(r))
  잰다(보낸곳.some((u) => u.startsWith('https://api.push.apple.com/3/device/')), '⑩ 애플 문으로 간다 (sandbox 가 아니다)')
  잰다(애플몸통[0]?.aps?.alert?.본문 === undefined && 애플몸통[0]?.aps?.alert?.body === '이번 주 레시피가 열렸어요 — 버섯', '⑩ ⭐제목·본문을 «실어서» 보낸다 — 아이폰엔 가져올 서비스워커가 없다')
  잰다(애플몸통[0]?.aps?.alert?.title === '한끼' && typeof 애플몸통[0]?.길 === 'string', '⑩ 제목 ＋ 누르면 갈 자리도 같이 간다')
  잰다((await W.보내기(아이폰env, 때)).했나 === false, '⑩ 5분 뒤 또 깨어나도 «두 번 안 보낸다» (잠금)')

  // 🚪 문이 틀렸을 뿐이면 버리지 않고 «문을 바꿔» 둔다
  서랍.clear(); 보낸곳.length = 0
  await 아이폰넣기(2)
  응답표[`https://api.push.apple.com/3/device/${토큰(2)}`] = 400
  응답표[`https://api.push.apple.com/3/device/${토큰(2)}:왜`] = 'BadDeviceToken'
  await W.보내기(아이폰env, 때)
  const 남음 = await KV.get('push:ios:0', 'json')
  잰다(남음.length === 1 && 남음[0].문 === 'sandbox', '⑩ BadDeviceToken(production) = 버리지 «않고» sandbox 로 바꿔 둔다 — 다음 판에 간다')

  // 앱을 지운 폰 = 410 → 묶음에서 빠진다
  서랍.clear(); 보낸곳.length = 0
  await 아이폰넣기(3)
  응답표[`https://api.push.apple.com/3/device/${토큰(3)}`] = 410
  await W.보내기(아이폰env, 때)
  잰다((await KV.get('push:ios:0', 'json')).length === 0, '⑩ 410(앱 지움) = 묶음에서 빠진다 — 죽은 토큰이 KV 를 안 채운다')

  // ⭐ 열쇠가 아직 없을 때 = 아이폰만 건너뛰고 «웹은 그대로 나간다»
  서랍.clear(); 보낸곳.length = 0; 응답표 = {}
  await 아이폰넣기(4)
  await 넣기(77)
  const r열쇠없음 = await W.보내기(env, 때)   // env = APNS_* 가 «없는» 그대로
  잰다(r열쇠없음.했나 === true && r열쇠없음.플랫폼 === undefined && 보낸곳.every((u) => !u.includes('apple')), '⑩ ⭐APNs 열쇠가 없으면 아이폰만 조용히 건너뛰고 «웹 알림은 나간다» (한쪽이 없다고 둘 다 안 멈춘다)')
}

console.log(나쁨 ? `\n⛔ ${나쁨}개 틀렸다` : '\n✅ 푸시 워커 — 묶음·잠금·410·상한 다 제자리 · D-2 따로 · 🍎아이폰 APNs')
process.exit(나쁨 ? 1 : 0)
