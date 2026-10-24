#!/usr/bin/env node
// 🍎 재현판 — 아이폰 결제(App Store Server API 로 «다시 묻기») · 워커 `애플구매하나`·`애플알림`·`애플환불회수` (2026-10-22)
//
// 📮 창업자 = *"아이폰도 테스트해봐야하는거 아닌가? 버그 설계 오류도 검토해줘"* → *"갤럭시 끝나면 아이폰꺼도 미리 만들어둬"*
// 📜 애플 응답 모양 = 애플 공개 서버 라이브러리(app-store-server-library-node · models/*.ts · 2026-10-22 열람)
// ⭐ 워커를 «직접 import 해서 진짜로 부른다». 가짜는 애플 서버·D1·KV 셋뿐이다.
// ⛔ 이 판이 증명 못 하는 것 = 애플이 «진짜로» 그 모양으로 답하나 · 우리 키로 인증이 되나 → TestFlight 시험 결제로.
import { webcrypto } from 'node:crypto'

let 통과 = 0, 실패 = 0
const 잰다 = (c, m, v) => { if (c) { 통과++; console.log('  ✅ ' + m) } else { 실패++; console.log('  ⛔ ' + m + (v !== undefined ? '   나온 값: ' + JSON.stringify(v) : '')) } }
const b64u = (b) => Buffer.from(b).toString('base64url')
const ORIGIN = 'capacitor://localhost'
const PACK = 'ocr_pack_20'
const 서명없는JWS = (몸) => b64u(JSON.stringify({ alg: 'ES256', x5c: [] })) + '.' + b64u(JSON.stringify(몸)) + '.c2ln'

// ── 🧪 가짜 애플 (본 서버 · 샌드박스) ──
const 애플 = { 거래: new Map(), 권한: true, 부름: { 본: 0, 샌드: 0, 기록: 0 }, 기록: [], 받은JWT: [], 사용답: [] }
const 거래 = (id, 고칠 = {}) => 애플.거래.set(id, { 환경: 'Production', t: { transactionId: id, originalTransactionId: id, bundleId: 'kr.hankki.app', productId: PACK, type: 'Consumable', quantity: 1, environment: 'Production', ...고칠 } })
globalThis.fetch = async (url, o = {}) => {
  const u = new URL(String(url))
  const 본 = u.host === 'api.storekit.apple.com', 샌드 = u.host === 'api.storekit-sandbox.apple.com'
  if (!본 && !샌드) {
    if (u.host.includes('vision.googleapis.com')) return new Response(JSON.stringify({ responses: [{ fullTextAnnotation: { text: '연근 400g\n간장 2큰술\n1. 굽는다 ' + Math.random() } }] }), { status: 200 })
    throw new Error('가짜가 모르는 주소: ' + u)
  }
  애플.받은JWT.push(String((o.headers || {}).Authorization || ''))
  if (!애플.권한) return new Response('denied', { status: 401 })
  if (u.pathname === '/inApps/v1/notifications/history') {
    애플.부름.기록++
    const 이쪽 = 본 ? 애플.기록 : []
    return new Response(JSON.stringify({ notificationHistory: 이쪽.map((p) => ({ signedPayload: p })), hasMore: false }), { status: 200 })
  }
  const 사 = u.pathname.match(/^\/inApps\/v2\/transactions\/consumption\/(\d+)$/)
  if (사 && o.method === 'PUT') { 애플.사용답.push({ id: 사[1], 샌드, 몸: JSON.parse(o.body) }); return new Response(null, { status: 202 }) }
  const m = u.pathname.match(/^\/inApps\/v1\/transactions\/(\d+)$/)
  if (m) {
    if (본) 애플.부름.본++; else 애플.부름.샌드++
    const x = 애플.거래.get(m[1])
    if (!x || (x.환경 === 'Sandbox') !== 샌드) return new Response('{"errorCode":4040010}', { status: 404 })
    return new Response(JSON.stringify({ signedTransactionInfo: 서명없는JWS(x.t) }), { status: 200 })
  }
  return new Response('nf', { status: 404 })
}

const mod = await import('../ocr-proxy/worker.js')
const worker = mod.default

// 🔐 로그인 토큰(토큰검증 재현판과 같은 방법)
const { privateKey, publicKey } = await webcrypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'])
mod._공개키넣기({ k1: { ...(await webcrypto.subtle.exportKey('jwk', publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' } })
const 지금 = Math.floor(Date.now() / 1000)
async function 로그인토큰(애플번호) {
  const h = b64u(JSON.stringify({ alg: 'RS256', kid: 'k1', typ: 'JWT' }))
  const p = b64u(JSON.stringify({ iss: 'https://securetoken.google.com/hankki-6a768', aud: 'hankki-6a768', auth_time: 지금 - 60, iat: 지금 - 60, exp: 지금 + 3000, sub: 'fb' + 애플번호, firebase: { sign_in_provider: 'apple.com', identities: { 'apple.com': [애플번호] } } }))
  const s = await webcrypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(h + '.' + p))
  return h + '.' + p + '.' + b64u(new Uint8Array(s))
}
const 딸 = await 로그인토큰('001.aaa.111'), 남 = await 로그인토큰('002.bbb.222')
const 딸통 = 'a:apple_001aaa111'

// 🔑 인앱 구매 키(가짜지만 진짜 모양 · EC P-256 pkcs8)
const ec = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
const P8 = '-----BEGIN PRIVATE KEY-----\n' + Buffer.from(await webcrypto.subtle.exportKey('pkcs8', ec.privateKey)).toString('base64').match(/.{1,64}/g).join('\n') + '\n-----END PRIVATE KEY-----\n'

function 가짜D1() {
  const 구매 = new Map(), 열쇠 = new Map(), 씀 = [], 보존 = new Map(), 보존씀 = []
  const st = { 고장: null }   // 'read' | 'credit-insert' — 일부러 망가뜨린다
  const 문장 = [
    [/^SELECT COALESCE\(SUM\(남음\),0\) AS n FROM 산열쇠 WHERE 통 = \?$/, ([통]) => {
      if (st.고장 === 'read') throw new Error('d1 down')
      let n = 0; for (const r of 열쇠.values()) if (r.통 === 통) n += r.남음; return { n }
    }],
    [/^SELECT 토큰 FROM 산열쇠 WHERE 통 = \? AND 남음 > 0 ORDER BY 처음 LIMIT 1$/, ([통]) => {
      const 줄 = [...열쇠.values()].filter((r) => r.통 === 통 && r.남음 > 0).sort((a, b) => a.처음 - b.처음)[0]; return 줄 ? { 토큰: 줄.토큰 } : null
    }],
    [/^DELETE FROM 산열쇠 WHERE 통 = \?$/, ([통]) => { let n = 0; for (const [k, r] of [...열쇠]) if (r.통 === 통) { 열쇠.delete(k); n++ } return n }],
    // 🧾 계정 삭제 = 보존 전용 표로 «옮긴다»(2026-10-23 분리 보존)
    [/^INSERT OR IGNORE INTO 보존구매 \(토큰, 상품, 주문, 상태, 처음, 지운때\) SELECT .* FROM 산구매 WHERE 통 = \?$/, ([때, 통]) => { let n = 0; for (const r of 구매.values()) if (r.통 === 통 && !보존.has(r.토큰)) { 보존.set(r.토큰, { 토큰: r.토큰, 상품: r.상품, 주문: r.주문, 상태: r.상태, 처음: r.처음, 지운때: 때 }); n++ } return n }],
    [/^INSERT INTO 보존씀 \(토큰, 때\) SELECT 토큰, 때 FROM 산열쇠씀 WHERE 통 = \?$/, ([통]) => { const 옮김 = 씀.filter((r) => r.통 === 통); 보존씀.push(...옮김.map((r) => ({ 토큰: r.토큰, 때: r.때 }))); return 옮김.length }],
    [/^DELETE FROM 산구매 WHERE 통 = \?$/, ([통]) => { let n = 0; for (const [k, r] of [...구매]) if (r.통 === 통) { 구매.delete(k); n++ } return n }],
    [/^DELETE FROM 산열쇠씀 WHERE 통 = \?$/, ([통]) => { const 전 = 씀.length; for (let i = 씀.length - 1; i >= 0; i--) if (씀[i].통 === 통) 씀.splice(i, 1); return 전 - 씀.length }],
    [/^SELECT 1 AS y FROM 보존구매 WHERE 토큰 = \?$/, ([t]) => (보존.has(t) ? { y: 1 } : null)],
    [/^UPDATE 보존구매 SET 상태 = 1 WHERE 토큰 = \?$/, ([t]) => { const r = 보존.get(t); if (r) { r.상태 = 1; return 1 } return 0 }],
    [/^INSERT INTO 산열쇠씀 \(토큰, 통, 때\) VALUES \(\?, \?, \?\)$/, ([t, 통]) => { 씀.push({ 토큰: t, 통 }); return 1 }],
    [/^UPDATE 산열쇠 SET 남음 = 남음 - 1, 때 = \? WHERE 토큰 = \? AND 남음 > 0$/,([, t]) => { const r = 열쇠.get(t); if (r && r.남음 > 0) { r.남음--; return 1 } return 0 }],
    [/^SELECT 통 FROM 산구매 WHERE 토큰 = \?$/, ([t]) => (구매.has(t) ? { 통: 구매.get(t).통 } : null)],
    // 💸 거둠 = 쓴 만큼 빚(10/23)
    [/^UPDATE 산열쇠 SET 남음 = -\(SELECT COUNT\(\*\) FROM 산열쇠씀 WHERE 산열쇠씀\.토큰 = 산열쇠\.토큰\), 때 = \? WHERE 토큰 = \? AND \(남음 > 0 OR /, ([, t]) => { const r = 열쇠.get(t); const n = 씀.filter((x) => x.토큰 === t).length; if (r && (r.남음 > 0 || (r.남음 === 0 && n > 0))) { r.남음 = -씀.filter((x) => x.토큰 === t).length; return 1 } return 0 }],
    [/^SELECT COUNT\(\*\) AS n FROM 산구매 WHERE 통 = \? AND 상태 = 1$/, ([통]) => ({ n: [...구매.values()].filter((r) => r.통 === 통 && r.상태 === 1).length })],
    [/^INSERT OR REPLACE INTO 결제동의 /, ([통]) => { (globalThis.__동의 ||= new Set()).add(통); return 1 }],
    [/^SELECT 1 AS y FROM 결제동의 WHERE 통 = \?$/, ([통]) => ((globalThis.__동의 || new Set()).has(통) ? { y: 1 } : null)],
    [/^SELECT 통, 상품 FROM 산구매 WHERE 토큰 = \?$/, ([t]) => (구매.has(t) ? { 통: 구매.get(t).통, 상품: 구매.get(t).상품 } : null)],
    [/^SELECT COUNT\(\*\) AS n FROM 산열쇠씀 WHERE 토큰 = \?$/, ([t]) => ({ n: 씀.filter((x) => x.토큰 === t).length })],
    [/^SELECT 토큰 FROM 산구매 WHERE 주문 = \? OR 토큰 = \? LIMIT 1$/, ([k]) => { for (const r of 구매.values()) if (r.주문 === k || r.토큰 === k) return { 토큰: r.토큰 }; return null }],
    [/^UPDATE 산열쇠 SET 남음 = 0, 때 = \? WHERE 토큰 = \? AND 남음 < 0$/, ([, t]) => { const r = 열쇠.get(t); if (r && r.남음 < 0) { r.남음 = 0; return 1 } return 0 }],
    [/^SELECT 토큰, 남음 FROM 산열쇠 WHERE 통 = \? AND 남음 < 0 ORDER BY 처음$/, ([통]) => [...열쇠.values()].filter((r) => r.통 === 통 && r.남음 < 0).sort((a, b) => a.처음 - b.처음).map((r) => ({ 토큰: r.토큰, 남음: r.남음 }))],
    [/^UPDATE 산열쇠 SET 남음 = 남음 \+ \?, 때 = \? WHERE 토큰 = \?$/, ([k, , t]) => { const r = 열쇠.get(t); if (r) { r.남음 += k; return 1 } return 0 }],
    [/^UPDATE 산열쇠 SET 남음 = 0, 때 = \? WHERE 토큰 = \?$/, ([, t]) => { const r = 열쇠.get(t); if (r) { r.남음 = 0; return 1 } return 0 }],
    [/^UPDATE 산열쇠 SET 남음 = 0, 때 = \? WHERE 토큰 = \? AND 남음 > 0$/, ([, t]) => { const r = 열쇠.get(t); if (r && r.남음 > 0) { r.남음 = 0; return 1 } return 0 }],
    [/^SELECT COUNT\(\*\) AS n, SUM\(CASE WHEN 상태 = 1 THEN 1 ELSE 0 END\) AS 환불 FROM 산구매$/, () => ({ n: 구매.size, 환불: [...구매.values()].filter((r) => r.상태 === 1).length })],
    [/^SELECT COUNT\(\*\) AS n FROM 산구매 WHERE 주문 LIKE 'apple:Sandbox%'$/, () => ({ n: [...구매.values()].filter((r) => String(r.주문).startsWith('apple:Sandbox')).length })],
    [/^SELECT COALESCE\(SUM\(남음\),0\) AS n FROM 산열쇠$/, () => ({ n: [...열쇠.values()].reduce((s, r) => s + r.남음, 0) })],
    [/^UPDATE 산구매 SET 상태 = 1, 때 = \? WHERE 토큰 = \?$/, ([, t]) => { const r = 구매.get(t); if (r) { r.상태 = 1; return 1 } return 0 }],
    [/^INSERT OR IGNORE INTO 산구매 /, ([t, 상품, 통, 주문, 처음]) => { if (구매.has(t)) return 0; 구매.set(t, { 토큰: t, 상품, 통, 주문, 상태: 0, 확인: 0, 비움: 0, 처음 }); return 1 }],
    [/^INSERT OR IGNORE INTO 산열쇠 /, ([t, 통, 남음, 처음]) => {
      if (st.고장 === 'credit-insert') { st.고장 = null; throw new Error('d1 hiccup') }
      if (열쇠.has(t)) return 0; 열쇠.set(t, { 토큰: t, 통, 남음, 처음 }); return 1
    }],
    [/^UPDATE 산구매 SET 확인 = 1, 때 = \? WHERE 토큰 = \?$/, ([, t]) => { const r = 구매.get(t); if (r) r.확인 = 1; return r ? 1 : 0 }],
    [/^UPDATE 산구매 SET 비움 = 1, 때 = \? WHERE 토큰 = \?$/, ([, t]) => { const r = 구매.get(t); if (r) r.비움 = 1; return r ? 1 : 0 }],
    // 지문장부(OCR 길) — 「없으면 넣기」만 흉내낸다
    [/^SELECT 글자 FROM 지문장부/, () => null],
    [/^INSERT OR IGNORE INTO 지문장부/, () => 1],
    [/^UPDATE 지문장부/, () => 1],
    [/^DELETE FROM 지문장부/, () => 0],
  ]
  const 찾기 = (sql) => { for (const [re, f] of 문장) if (re.test(sql)) return f; throw new Error('가짜 D1 이 모르는 문장: ' + sql) }
  return {
    구매, 열쇠, 씀, 보존, 보존씀, st,
    exec: async () => {},
    batch: async (묶음) => { for (const s of 묶음) await s.run() },
    prepare: (sql) => {
      const f = 찾기(sql)
      return { bind: (...b) => ({ first: async () => f(b), all: async () => ({ results: f(b) }), run: async () => ({ meta: { changes: f(b) } }) }) }
    },
  }
}
const 가짜KV = () => { const m = new Map(); return { _m: m, get: async (k) => (m.has(k) ? m.get(k) : null), put: async (k, v) => { m.set(k, String(v)) } } }

let env
const 새판 = (고칠 = {}) => {
  env = { APP_TOKEN: 'tk', OCR_KV: 가짜KV(), DB: 가짜D1(), APPLE_IAP_KEY: P8, APPLE_KEY_ID: 'KEY123', APPLE_ISSUER_ID: 'iss-uuid', VISION_KEY: 'v', FOUNDER_SECRET: 'fs', ...고칠 }
  애플.거래.clear(); 애플.권한 = true; 애플.기록 = []; 애플.받은JWT = []; 애플.사용답 = []; globalThis.__동의 = new Set()
  for (const k in 애플.부름) 애플.부름[k] = 0
  mod._애플토큰비우기()
}
const 부르기 = async (경로, 몸, 토큰, 더 = {}) => {
  const h = { 'Content-Type': 'application/json', Origin: ORIGIN, 'x-hankki-token': 'tk', ...더 }
  if (토큰) h['x-hankki-idtoken'] = 토큰
  const r = await worker.fetch(new Request('https://w.example' + 경로, { method: 'POST', headers: h, body: JSON.stringify(몸) }), env)
  return { status: r.status, ...(await r.json()) }
}
const sync = (토큰, ids) => 부르기('/billing/apple/sync', { transactions: ids.map((id) => ({ id })) }, 토큰)
const 알림 = (몸) => worker.fetch(new Request('https://w.example/billing/apple/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(몸) }), env).then((r) => r.json())
const 환불알림 = (id, 종류 = 'REFUND') => ({ signedPayload: 서명없는JWS({ notificationType: 종류, data: { bundleId: 'kr.hankki.app', signedTransactionInfo: 서명없는JWS({ transactionId: id }) } }) })
const 남음 = (id) => env.DB.열쇠.get('apple:' + id) && env.DB.열쇠.get('apple:' + id).남음

console.log('\n🍎 아이폰 결제 — 애플에 다시 묻기\n')

console.log('① 꺼져 있으면 아무것도 안 한다')
새판({ APPLE_IAP_KEY: undefined })
let r = await sync(딸, ['1001'])
잰다(r.error === 'billing_off', '인앱 구매 키 없음 → billing_off', r)
잰다((await 알림(환불알림('1001'))).reason === 'billing_off', '알림도 꺼짐')
새판({ APPLE_IAP_KEY: undefined, PLAY_SA_JSON: '{}' })
r = await sync(딸, ['1001'])
잰다(r.error === 'billing_off', '구글만 켜져 있어도 애플 길은 꺼짐', r)

console.log('\n② 로그인 «확인» 필수')
새판(); 거래('1001')
r = await sync(null, ['1001'])
잰다(r.status === 401, '토큰 없음 → 401', r)

console.log('\n③ 정상 구매(본 서버)')
r = await sync(딸, ['1001'])
잰다(r.ok && r.results[0].ok && r.paid === 20 && !r.results[0].sandbox, '20개 · 본 서버', r)
{
  const jwt = 애플.받은JWT[0].replace('Bearer ', '')
  const [h, p, s] = jwt.split('.')
  const 머리 = JSON.parse(Buffer.from(h, 'base64url')), 몸 = JSON.parse(Buffer.from(p, 'base64url'))
  const 맞나 = await webcrypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, ec.publicKey, Buffer.from(s, 'base64url'), new TextEncoder().encode(h + '.' + p))
  잰다(머리.alg === 'ES256' && 머리.kid === 'KEY123' && 몸.iss === 'iss-uuid' && 몸.aud === 'appstoreconnect-v1' && 몸.bid === 'kr.hankki.app' && 몸.exp - 몸.iat <= 3600, '우리 인증 JWT 모양(ES256·kid·iss·aud·bid·만료)', { 머리, 몸 })
  잰다(맞나, '우리 키로 서명이 «진짜로» 맞는다(r‖s 꼴)')
}

console.log('\n④ 같은 거래를 또 보내도 한 번만')
r = await sync(딸, ['1001', '1001'])
잰다(r.paid === 20, '세 번 보내도 20', r)

console.log('\n⑤ 샌드박스(심사관·TestFlight) — 받되 표시한다')
새판(); 애플.거래.set('2001', { 환경: 'Sandbox', t: { transactionId: '2001', bundleId: 'kr.hankki.app', productId: PACK, type: 'Consumable', quantity: 1, environment: 'Sandbox' } })
r = await sync(딸, ['2001'])
잰다(r.results[0].ok && r.results[0].sandbox && r.paid === 20 && 애플.부름.본 === 1 && 애플.부름.샌드 === 1, '본 서버에 없으면 샌드박스로 · 20개 · sandbox 표시', r)
잰다(env.DB.구매.get('apple:2001').주문 === 'apple:Sandbox', '원장 주문 칸 = apple:Sandbox')

console.log('\n⑥ 남의 앱·다른 상품·비소모품·이상한 번호')
새판(); 거래('3001', { bundleId: 'com.other.app' }); 거래('3002', { productId: 'deco_xmas' }); 거래('3003', { type: 'Non-Consumable' })
r = await sync(딸, ['3001', '3002', '3003', 'abc', '', '1'.repeat(40), '9999'])
잰다(r.results.map((x) => x.reason).join() === 'wrong_app,unknown_sku,wrong_type,bad_args,bad_args,bad_args,token_unknown' && r.paid === 0, '전부 0', r.results.map((x) => x.reason))

console.log('\n⑦ 남의 계정이 같은 거래를 보내면')
새판(); 거래('4001'); await sync(딸, ['4001'])
r = await sync(남, ['4001'])
잰다(r.results[0].reason === 'other_account' && r.paid === 0, '남 계정 0 · 딸 20 그대로', r)

console.log('\n⑧ 이미 취소된 거래 · 권한 없음')
새판(); 거래('5001', { revocationDate: Date.now() })
r = await sync(딸, ['5001'])
잰다(r.results[0].reason === 'revoked' && r.paid === 0, '취소된 거래 → 0', r)
새판(); 거래('5002'); 애플.권한 = false
r = await sync(딸, ['5002'])
잰다(r.results[0].reason === 'apple_denied' && 애플.부름.샌드 === 0 && env.DB.구매.size === 0, '401 → 샌드박스로 안 넘어가고 원장 그대로', r)
새판({ APPLE_IAP_KEY: '이건 키가 아니다' }); 거래('5003')
r = await sync(딸, ['5003'])
잰다(r.results[0].reason === 'no_apple_key', '망가진 키 → no_apple_key', r)

console.log('\n⑨ 환불 알림 — 애플에 다시 물어 «취소»일 때만 거둔다')
새판(); 거래('6001'); await sync(딸, ['6001'])
await 부르기('/', { image: 'data:image/png;base64,' + b64u('x' + Math.random()), uid: 'd1' }, 딸)   // 무료로 읽힘(산 열쇠는 그대로)
r = await 알림(환불알림('6001'))
잰다(r.ok && r.거둠 === 0 && 남음('6001') === 20, '가짜 알림(애플은 취소 아님이라 답함) → 안 거둔다', r)
애플.거래.get('6001').t.revocationDate = Date.now()
r = await 알림(환불알림('6001'))
잰다(r.ok && r.거둠 === 1 && 남음('6001') === 0 && env.DB.구매.get('apple:6001').상태 === 1, '진짜 취소 → 0 · 원장 환불 표시', r)
r = await 알림(환불알림('6001'))
잰다(r.거둠 === 0 && 남음('6001') === 0, '같은 알림 또 → 같다(멱등)', r)
r = await 알림({ signedPayload: 서명없는JWS({ notificationType: 'TEST' }) })
잰다(r.ok && r.거둠 === 0, 'TEST 같은 다른 알림 → 그냥 받아 둔다', r)
r = await 알림({ signedPayload: '쓰레기' })
잰다(r.ok && r.거둠 === 0, '쓰레기 본문 → 아무것도 안 한다', r)
{
  const rr = await worker.fetch(new Request('https://w.example/billing/apple/notify', { method: 'POST', body: '{' }), env)
  잰다(rr.status === 200, '애플 서버는 오리진·앱 토큰 없이 부른다 — 막히지 않는다')
}

console.log('\n⑩ 하루 한 번 — 알림이 빠졌을 때 기록으로 메운다')
새판(); 거래('7001'); 거래('7002'); await sync(딸, ['7001', '7002'])
애플.거래.get('7002').t.revocationDate = Date.now()
애플.기록 = [환불알림('7002').signedPayload, 환불알림('7001').signedPayload]
{
  const 기다림 = []
  await worker.scheduled({ cron: '0 18 * * *' }, env, { waitUntil: (p) => 기다림.push(p) })
  await Promise.all(기다림)
}
잰다(남음('7002') === 0 && 남음('7001') === 20, 'Cron → 진짜 취소된 7002 만 거둔다(7001 은 애플이 취소 아님)', [남음('7001'), 남음('7002')])
잰다(JSON.parse(env.OCR_KV._m.get('ap:last')).ok === true, '계기판 기록(ap:last)')

console.log('\n⑪ 산 열쇠는 구글 것과 «같은 통»으로 쓰인다(OCR)')
새판(); 거래('8001'); await sync(딸, ['8001'])
env.OCR_KV._m.set(`wu:${딸통}`, '30'); env.OCR_KV._m.set(`u:d1:${new Date().toISOString().slice(0, 7)}`, '5')
r = await 부르기('/', { image: 'data:image/png;base64,' + b64u('y' + Math.random()), uid: 'd1' }, 딸)
잰다(r.깎음 === true && 남음('8001') === 19 && r.left.paid === 19, '무료 다 쓴 뒤 애플 열쇠로 읽고 19', r.left)

console.log('\n⑬ 구매자 표(appAccountToken · 2026-10-23)')
새판()
{
  const s딸 = await 부르기('/billing/state', {}, 딸), s남 = await 부르기('/billing/state', {}, 남)
  const 모양 = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
  잰다(모양.test(s딸.account) && s딸.account !== s남.account, '/billing/state 가 사람마다 다른 UUID 를 준다', [s딸.account, s남.account])
  잰다((await 부르기('/billing/state', {}, 딸)).account === s딸.account, '같은 사람은 늘 같은 표', s딸.account)
  거래('9101', { appAccountToken: s딸.account.toUpperCase() })   // 애플이 대문자로 줘도
  r = await sync(남, ['9101'])
  잰다(r.results[0].reason === 'not_this_account' && r.paid === 0 && !env.DB.구매.has('apple:9101'), '딸 표가 붙은 거래를 남이 보내면 안 넣는다(원장에도 안 적음)', r)
  r = await sync(딸, ['9101'])
  잰다(r.results[0].ok && r.paid === 20, '그 뒤 딸이 보내면 들어간다(남이 먼저 보내도 못 가로챈다)', r)
  거래('9102')   // 표 없는 거래(옛 판)
  r = await sync(남, ['9102'])
  잰다(r.results[0].ok && r.paid === 20, '표 없는 거래는 옛 규칙(먼저 보낸 사람)', r)
}

console.log('\n⑭ 환불 악용 막기 — 빚 · 반복 환불 · 사용량 답하기 (창업자 10/23)')
{
  const 읽기 = () => { for (const k of [...env.OCR_KV._m.keys()]) if (k.startsWith('ip:')) env.OCR_KV._m.delete(k); return 부르기('/', { image: 'data:image/png;base64,' + b64u('z' + Math.random()), uid: 'd1' }, 딸) }
  const 무료끝 = () => { env.OCR_KV._m.set(`wu:${딸통}`, '30'); env.OCR_KV._m.set(`u:d1:${new Date().toISOString().slice(0, 7)}`, '5') }
  새판(); 거래('9201'); await sync(딸, ['9201']); 무료끝()
  for (let i = 0; i < 20; i++) await 읽기()
  잰다(남음('9201') === 0 && env.DB.씀.filter((x) => x.토큰 === 'apple:9201').length === 20, '20개 다 씀', 남음('9201'))
  // 사용량 답하기 — 동의 없으면 안 보낸다
  r = await 알림(환불알림('9201', 'CONSUMPTION_REQUEST'))
  잰다(r.ok && r.답함 === false && r.왜 === '동의없음' && 애플.사용답.length === 0, '동의 없으면 애플에 안 보낸다', r)
  r = await 부르기('/billing/consent', {}, 딸)
  잰다(r.ok, '동의 적기', r)
  r = await 알림(환불알림('9201', 'CONSUMPTION_REQUEST'))
  const 답 = 애플.사용답[0] && 애플.사용답[0].몸
  잰다(r.답함 && 답 && 답.customerConsented === true && 답.deliveryStatus === 'DELIVERED' && 답.sampleContentProvided === true && 답.consumptionPercentage === 100000 && 답.refundPreference === 'DECLINE', '다 썼으면 100% · DECLINE', 답)
  r = await 알림(환불알림('9999', 'CONSUMPTION_REQUEST'))
  잰다(!r.답함 && 애플.사용답.length === 1, '애플이 모르는 거래 → 안 보낸다', r)
  // 환불되면 쓴 20 만큼 빚 → 다음에 산 20 은 빚부터 메운다
  애플.거래.get('9201').t.revocationDate = Date.now()
  await 알림(환불알림('9201'))
  잰다(남음('9201') === -20 && (await 부르기('/billing/state', {}, 딸)).paid === 0, '다 쓰고 환불 → 빚 -20 · 보이는 수는 0', 남음('9201'))
  거래('9202'); r = await sync(딸, ['9202'])
  잰다(r.paid === 0, '새로 산 20 은 빚을 메워 0', r)
  r = await 읽기()
  잰다(남음('9202') === 20 && r.error === 'user_quota', '빚이 남아 있는 동안 산 열쇠로 못 읽는다(막힘 · 새 열쇠 안 깎임)', r)
  // 일부만 씀 → GRANT_PRORATED
  거래('9203'); await sync(딸, ['9203'])
  거래('9204'); await sync(딸, ['9204'])
  잰다((await 부르기('/billing/state', {}, 딸)).paid === 40, '빚 -20 ＋ 20·20·20 = 40')
  // 반복 환불 — 3번째부터 막는다
  for (const id of ['9202', '9203']) { 애플.거래.get(id).t.revocationDate = Date.now(); await 알림(환불알림(id)) }
  const s = await 부르기('/billing/state', {}, 딸)
  잰다(s.blocked === 'refunds', '환불 3번 → blocked', s)
  const s남 = await 부르기('/billing/state', {}, 남)
  잰다(!s남.blocked, '다른 사람은 안 막힌다', s남)
}
{
  새판(); 거래('9301'); await sync(딸, ['9301'])
  await 부르기('/billing/consent', {}, 딸)
  const 읽기 = () => { for (const k of [...env.OCR_KV._m.keys()]) if (k.startsWith('ip:')) env.OCR_KV._m.delete(k); return 부르기('/', { image: 'data:image/png;base64,' + b64u('w' + Math.random()), uid: 'd1' }, 딸) }
  env.OCR_KV._m.set(`wu:${딸통}`, '30'); env.OCR_KV._m.set(`u:d1:${new Date().toISOString().slice(0, 7)}`, '5')
  for (let i = 0; i < 5; i++) await 읽기()
  await 알림(환불알림('9301', 'CONSUMPTION_REQUEST'))
  const 답 = 애플.사용답[0] && 애플.사용답[0].몸
  잰다(답 && 답.consumptionPercentage === 25000 && 답.refundPreference === 'GRANT_PRORATED', '5개 씀 → 25% · GRANT_PRORATED', 답)
  새판(); 거래('9302'); await sync(딸, ['9302']); await 부르기('/billing/consent', {}, 딸)
  await 알림(환불알림('9302', 'CONSUMPTION_REQUEST'))
  잰다(애플.사용답[0] && 애플.사용답[0].몸.refundPreference === 'GRANT_FULL' && 애플.사용답[0].몸.consumptionPercentage === 0, '안 씀 → 0% · GRANT_FULL', 애플.사용답[0])
}

{
  // 💸 빚 갚기(B) — 무료 열쇠가 먼저 빚을 갚는다
  const 읽기 = () => { for (const k of [...env.OCR_KV._m.keys()]) if (k.startsWith('ip:')) env.OCR_KV._m.delete(k); return 부르기('/', { image: 'data:image/png;base64,' + b64u('v' + Math.random()), uid: 'd1' }, 딸) }
  const 달 = `u:d1:${new Date().toISOString().slice(0, 7)}`
  새판(); 거래('9401'); await sync(딸, ['9401'])
  env.OCR_KV._m.set(`wu:${딸통}`, '30'); env.OCR_KV._m.set(달, '5')
  for (let i = 0; i < 20; i++) await 읽기()
  애플.거래.get('9401').t.revocationDate = Date.now(); await 알림(환불알림('9401'))
  잰다(남음('9401') === -20, '다 쓰고 환불 → 빚 -20', 남음('9401'))
  env.OCR_KV._m.set(달, '0')   // 새 달 — 무료 5
  r = await 읽기()
  잰다(r.error === 'debt' && r.빚 === 15 && 남음('9401') === -15 && env.OCR_KV._m.get(달) === '5', '새 달 무료 5 가 빚을 갚고 AI 읽기는 막힘 · 빚 15 안내', r)
  r = await 읽기()
  잰다(r.error === 'debt' && r.빚 === 15 && 남음('9401') === -15, '같은 달 또 해도 더 안 깎인다', r)
  env.OCR_KV._m.set(`wu:${딸통}`, '0'); env.OCR_KV._m.set(달, '0')   // 웰컴 30 이 남아 있는 경우
  r = await 읽기()
  잰다(r.깎음 === true && 남음('9401') === 0 && env.OCR_KV._m.get(`wu:${딸통}`) === '16', '웰컴 30 중 15 로 빚을 다 갚고 바로 읽는다(15+1)', [r.깎음, 남음('9401'), env.OCR_KV._m.get(`wu:${딸통}`)])
  // 🤝 탕감
  거래('9402'); await sync(딸, ['9402']); env.DB.열쇠.get('apple:9402').남음 = -7
  const 탕 = async (q) => (await worker.fetch(new Request('https://w.example/?forgive=' + q, { method: 'GET' }), env)).json()
  잰다((await 탕('9402&key=틀림')).error === 'unauthorized', '탕감은 운영자 키가 있어야')
  r = await 탕('9402&key=fs')
  잰다(r.탕감 === 1 && 남음('9402') === 0, '탕감 → 빚 -7 이 0 (더 주지는 않는다)', r)
  잰다((await 탕('9402&key=fs')).탕감 === 0 && 남음('9402') === 0, '또 해도 0 그대로')

}

console.log('\n⑫ 계기판 · 계정 삭제')


새판(); 거래('9001'); 애플.거래.set('9002', { 환경: 'Sandbox', t: { transactionId: '9002', bundleId: 'kr.hankki.app', productId: PACK, type: 'Consumable', environment: 'Sandbox' } }); await sync(딸, ['9001', '9002'])
{
  const rr = await worker.fetch(new Request('https://w.example/?quota=1&key=fs', { method: 'GET' }), env)
  const q = await rr.json()
  잰다(q.결제 && q.결제.애플 === true && q.결제.구글 === false && q.결제.산건수 === 2 && q.결제.애플시험결제 === 1, '애플 켜짐 · 산 2 · 그중 시험 결제 1', q.결제)
}
r = await 부르기('/billing/forget', {}, 딸)
잰다(r.ok && r.사라진열쇠 === 40 && !env.DB.열쇠.has('apple:9001'), '계정 삭제 → 애플 열쇠도 지워진다', r)

console.log(`\n${실패 === 0 ? '✅' : '⛔'} ${통과}/${통과 + 실패} 통과\n`)
process.exit(실패 === 0 ? 0 : 1)
