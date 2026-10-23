#!/usr/bin/env node
// 💳 재현판 — 구글 영수증 확인 · 산 열쇠 원장 (2026-10-22 · 워커 `결제길`)
//
// 📮 창업자 = *"진짜 리스크 없이 가야해"*(8/19) · 10/22 확정 ⓐ = 「열쇠는 로그인한 사람만 산다」
// ⭐ 워커를 «직접 import 해서 진짜로 부른다»(절대원칙 30). 가짜는 구글·D1·KV 셋뿐이다.
// ⭐ 8/19 사고판(`hold/결제서버-0819` `_repro-결제사고-0819.mjs`)이 잡은 구멍을 «지금 워커»에서 다시 잰다.
// 📜 구글 응답 모양 = androidpublisher v3 purchases.products 공식 reference(2026-10-22 열람)
//    purchaseState 0구매·1취소·2보류 · consumptionState · acknowledgementState · quantity(없으면 1)
// ⛔ 이 판이 증명 못 하는 것 = 구글이 «진짜로» 그 모양으로 답하나 · 권한이 붙었나 → 라이선스 테스트 실물로.
import { webcrypto } from 'node:crypto'

let 통과 = 0, 실패 = 0
const 잰다 = (c, m, v) => { if (c) { 통과++; console.log('  ✅ ' + m) } else { 실패++; console.log('  ⛔ ' + m + (v !== undefined ? '   나온 값: ' + JSON.stringify(v) : '')) } }
const b64u = (b) => Buffer.from(b).toString('base64url')
const ORIGIN = 'https://peachfam0307-glitch.github.io'
const PACK = 'ocr_pack_20'
const YM = new Date().toISOString().slice(0, 7)

// ── 🧪 가짜 구글 (OAuth · Play · Vision) ─────────────────────
const 구글 = {
  영수증: new Map(),      // 토큰 → ProductPurchase
  권한: true,             // false = 권한 전파 전(403)
  ack실패: false, consume실패: false,
  부름: { get: 0, ack: 0, consume: 0, oauth: 0, vision: 0, voided: 0 },
  비전: 'ok',
  무효쪽: [],             // 무효 구매 목록 쪽들 — [['t1'], ['t2']] = 두 쪽
  끝없는쪽: false,        // true = 다음 쪽 토큰을 끝없이 준다(고장 흉내)
}
globalThis.fetch = async (url) => {
  const u = String(url)
  if (u.startsWith('https://oauth2.googleapis.com/token')) {
    구글.부름.oauth++
    return new Response(JSON.stringify({ access_token: 'at-1', expires_in: 3600 }), { status: 200 })
  }
  if (u.includes('vision.googleapis.com')) {
    구글.부름.vision++
    if (구글.비전 === '오류') return new Response('bad', { status: 500 })
    return new Response(JSON.stringify({ responses: [{ fullTextAnnotation: { text: '연근 400g\n간장 2큰술\n1. 굽는다 ' + Math.random() } }] }), { status: 200 })
  }
  // 무효 구매 목록 — 공식 모양: voidedPurchases[] · tokenPagination.nextPageToken
  if (u.includes('/purchases/voidedpurchases')) {
    구글.부름.voided++
    if (!구글.권한) return new Response('denied', { status: 403 })
    const q = new URL(u).searchParams
    if (!(Number(q.get('startTime')) > Date.now() - 30 * 86400000)) return new Response('startTime too old', { status: 400 })
    const 쪽 = Number(q.get('token') || 0)
    const 이쪽 = 구글.무효쪽[쪽] || []
    const 다음 = 구글.끝없는쪽 || 쪽 + 1 < 구글.무효쪽.length ? String(쪽 + 1) : undefined
    return new Response(JSON.stringify({ voidedPurchases: 이쪽.map((t) => ({ purchaseToken: t, orderId: 'GPA.' + t, voidedTimeMillis: String(Date.now()) })), ...(다음 ? { tokenPagination: { nextPageToken: 다음 } } : {}) }), { status: 200 })
  }
  const m = u.match(/purchases\/products\/([^/]+)\/tokens\/([^:/]+)(?::(acknowledge|consume))?$/)
  if (m) {
    if (!구글.권한) return new Response('denied', { status: 403 })
    const 토큰 = decodeURIComponent(m[2])
    const r = 구글.영수증.get(토큰)
    if (!r) return new Response('nf', { status: 404 })
    if (m[3] === 'acknowledge') {
      구글.부름.ack++
      if (구글.ack실패) return new Response('err', { status: 500 })
      r.acknowledgementState = 1; return new Response('{}', { status: 200 })
    }
    if (m[3] === 'consume') {
      구글.부름.consume++
      if (구글.consume실패) return new Response('err', { status: 500 })
      r.consumptionState = 1; r.acknowledgementState = 1; return new Response('{}', { status: 200 })
    }
    구글.부름.get++
    return new Response(JSON.stringify(r), { status: 200 })
  }
  throw new Error('가짜 구글이 모르는 주소: ' + u)
}
const 영수증 = (토큰, 고칠 = {}) => 구글.영수증.set(토큰, { purchaseState: 0, acknowledgementState: 0, consumptionState: 0, quantity: 1, orderId: 'GPA.' + 토큰, ...고칠 })

const mod = await import('../ocr-proxy/worker.js')
const worker = mod.default

// ── 🔐 로그인 토큰 (토큰검증 재현판과 같은 방법 — 우리 키로 서명하고 공개키를 워커에 넣는다) ──
const { privateKey, publicKey } = await webcrypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'])
mod._공개키넣기({ k1: { ...(await webcrypto.subtle.exportKey('jwk', publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' } })
const 지금 = Math.floor(Date.now() / 1000)
async function 로그인토큰(구글번호) {
  const h = b64u(JSON.stringify({ alg: 'RS256', kid: 'k1', typ: 'JWT' }))
  const p = b64u(JSON.stringify({
    iss: 'https://securetoken.google.com/hankki-6a768', aud: 'hankki-6a768', auth_time: 지금 - 60, iat: 지금 - 60, exp: 지금 + 3000,
    sub: 'fb' + 구글번호, firebase: { sign_in_provider: 'google.com', identities: { 'google.com': [구글번호] } },
  }))
  const s = await webcrypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(h + '.' + p))
  return h + '.' + p + '.' + b64u(new Uint8Array(s))
}
const 엄마 = await 로그인토큰('111'), 아빠 = await 로그인토큰('222')

// ── 🔑 서비스 계정 열쇠(가짜지만 진짜 모양 · pkcs8 PEM) ──
const sa = await webcrypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign'])
const pem = '-----BEGIN PRIVATE KEY-----\n' + Buffer.from(await webcrypto.subtle.exportKey('pkcs8', sa.privateKey)).toString('base64').match(/.{1,64}/g).join('\n') + '\n-----END PRIVATE KEY-----\n'
const SA_JSON = JSON.stringify({ client_email: 'hankki-billing@hankki-6a768.iam.gserviceaccount.com', private_key: pem })

// ── 🗄 가짜 D1 — 워커가 쓰는 문장을 «전부» 안다. 모르는 문장이면 죽는다(몰래 새 문장이 생기면 판이 알린다). ──
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
    [/^SELECT 토큰, 남음 FROM 산열쇠 WHERE 통 = \? AND 남음 < 0 ORDER BY 처음$/, ([통]) => [...열쇠.values()].filter((r) => r.통 === 통 && r.남음 < 0).sort((a, b) => a.처음 - b.처음).map((r) => ({ 토큰: r.토큰, 남음: r.남음 }))],
    [/^UPDATE 산열쇠 SET 남음 = 남음 \+ \?, 때 = \? WHERE 토큰 = \?$/, ([k, , t]) => { const r = 열쇠.get(t); if (r) { r.남음 += k; return 1 } return 0 }],
    [/^UPDATE 산열쇠 SET 남음 = 0, 때 = \? WHERE 토큰 = \?$/, ([, t]) => { const r = 열쇠.get(t); if (r) { r.남음 = 0; return 1 } return 0 }],
    [/^UPDATE 산열쇠 SET 남음 = 0, 때 = \? WHERE 토큰 = \? AND 남음 > 0$/, ([, t]) => { const r = 열쇠.get(t); if (r && r.남음 > 0) { r.남음 = 0; return 1 } return 0 }],
    [/^SELECT COUNT\(\*\) AS n, SUM\(CASE WHEN 상태 = 1 THEN 1 ELSE 0 END\) AS 환불 FROM 산구매$/, () => ({ n: 구매.size, 환불: [...구매.values()].filter((r) => r.상태 === 1).length })],
    [/^SELECT COALESCE\(SUM\(남음\),0\) AS n FROM 산열쇠$/, () => ({ n: [...열쇠.values()].reduce((s, r) => s + r.남음, 0) })],
    [/^UPDATE 산구매 SET 상태 = 1, 때 = \? WHERE 토큰 = \?$/, ([, t]) => { const r = 구매.get(t); if (r) { r.상태 = 1; return 1 } return 0 }],
    [/^INSERT OR IGNORE INTO 산구매 /, ([t, 상품, 통, 주문, 처음]) => { if (구매.has(t)) return 0; 구매.set(t, { 토큰: t, 상품, 통, 주문, 상태: 0, 확인: 0, 비움: 0, 처음 }); return 1 }],
    [/^INSERT OR IGNORE INTO 산열쇠 /, ([t, 통, 남음, 처음]) => {
      if (st.고장 === 'credit-insert') { st.고장 = null; throw new Error('d1 hiccup') }
      if (열쇠.has(t)) return 0; 열쇠.set(t, { 토큰: t, 통, 남음, 처음 }); return 1
    }],
    [/^UPDATE 산구매 SET 확인 = 1, 때 = \? WHERE 토큰 = \?$/, ([, t]) => { const r = 구매.get(t); if (r) r.확인 = 1; return r ? 1 : 0 }],
    [/^UPDATE 산구매 SET 비움 = 1, 때 = \? WHERE 토큰 = \?$/, ([, t]) => { const r = 구매.get(t); if (r) r.비움 = 1; return r ? 1 : 0 }],
    [/^SELECT 토큰, 상품, 주문, 상태, 처음 FROM 산구매 WHERE 주문 = \? OR 토큰 = \? LIMIT 1$/, ([a, b]) => [...구매.values()].find((r) => r.주문 === a || r.토큰 === b) || null],
    [/^SELECT 토큰, 상품, 주문, 상태, 처음 FROM 보존구매 WHERE 주문 = \? OR 토큰 = \? LIMIT 1$/, ([a, b]) => [...보존.values()].find((r) => r.주문 === a || r.토큰 === b) || null],
    [/^SELECT 남음 FROM 산열쇠 WHERE 토큰 = \?$/, ([t]) => (열쇠.has(t) ? { 남음: 열쇠.get(t).남음 } : null)],
    [/^SELECT 때 FROM 산열쇠씀 WHERE 토큰 = \? ORDER BY 때 LIMIT 500$/, ([t]) => ({ results: 씀.filter((r) => r.토큰 === t) })],
    [/^SELECT 때 FROM 보존씀 WHERE 토큰 = \? ORDER BY 때 LIMIT 500$/, ([t]) => ({ results: 보존씀.filter((r) => r.토큰 === t) })],
    [/^DELETE FROM 보존씀 WHERE 토큰 IN \(SELECT 토큰 FROM 보존구매 WHERE 처음 < \?\)$/, ([기준]) => { const 지울 = new Set([...보존.values()].filter((r) => r.처음 < 기준).map((r) => r.토큰)); const 전 = 보존씀.length; for (let i = 보존씀.length - 1; i >= 0; i--) if (지울.has(보존씀[i].토큰)) 보존씀.splice(i, 1); return 전 - 보존씀.length }],
    [/^DELETE FROM 보존구매 WHERE 처음 < \?$/, ([기준]) => { let n = 0; for (const [k, r] of [...보존]) if (r.처음 < 기준) { 보존.delete(k); n++ } return n }],
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
      return { bind: (...b) => ({ first: async () => f(b), all: async () => f(b), run: async () => ({ meta: { changes: f(b) } }) }) }
    },
  }
}
const 가짜KV = () => { const m = new Map(); return { _m: m, get: async (k) => (m.has(k) ? m.get(k) : null), put: async (k, v) => { m.set(k, String(v)) } } }

let env
const 새판 = (고칠 = {}) => {
  env = { APP_TOKEN: 'tk', OCR_KV: 가짜KV(), DB: 가짜D1(), PLAY_SA_JSON: SA_JSON, VISION_KEY: 'v', ...고칠 }
  구글.영수증.clear(); 구글.권한 = true; 구글.ack실패 = false; 구글.consume실패 = false; 구글.비전 = 'ok'; 구글.무효쪽 = []; 구글.끝없는쪽 = false
  for (const k in 구글.부름) 구글.부름[k] = 0
  mod._sa토큰비우기()
}
const 부르기 = async (경로, 몸, 토큰, 더 = {}) => {
  const h = { 'Content-Type': 'application/json', Origin: ORIGIN, 'x-hankki-token': 'tk', 'CF-Connecting-IP': '1.1.1.' + Math.floor(Math.random() * 250), ...더 }
  if (토큰) h['x-hankki-idtoken'] = 토큰
  const r = await worker.fetch(new Request('https://w.example' + 경로, { method: 'POST', headers: h, body: JSON.stringify(몸) }), env)
  return { status: r.status, ...(await r.json()) }
}
const sync = (토큰, 목록) => 부르기('/billing/sync', { purchases: 목록 }, 토큰)
const 사진 = (토큰, 몸 = {}, 더) => 부르기('/', { image: 'data:image/png;base64,' + b64u(String(Math.random())), uid: 'dev1', ...몸 }, 토큰, 더)
const 무료다씀 = (계정) => { env.OCR_KV._m.set(`wu:a:${계정}`, '30'); env.OCR_KV._m.set(`u:dev1:${YM}`, '5') }
const 남음 = (t) => env.DB.열쇠.get(t) && env.DB.열쇠.get(t).남음

console.log('\n💳 결제 — 영수증 확인 · 산 열쇠 원장\n')

console.log('① 꺼져 있으면 아무것도 안 한다')
새판({ PLAY_SA_JSON: undefined })
잰다((await sync(엄마, [{ sku: PACK, token: 't1' }])).error === 'billing_off', '서비스 계정 없음 → billing_off')
잰다((await 사진(엄마)).깎음 === true, '그래도 OCR 은 그대로 돈다')
새판({ DB: undefined })
잰다((await sync(엄마, [])).error === 'billing_off', '창고(D1) 없음 → billing_off')

console.log('\n② 로그인 «확인»이 필수다 (ⓐ)')
새판()
let r = await sync(null, [{ sku: PACK, token: 't1' }])
잰다(r.status === 401 && r.error === 'login_required', '토큰 없음 → 401', r)
r = await sync('fake.id.token',[{ sku: PACK, token: 't1' }])
잰다(r.status === 401, '가짜 토큰 → 401', r)
잰다(구글.부름.get === 0, '로그인 못 하면 구글에 묻지도 않는다')

console.log('\n③ 정상 구매')
새판(); 영수증('t1')
r = await sync(엄마, [{ sku: PACK, token: 't1' }])
잰다(r.ok && r.results[0].ok && r.paid === 20, '열쇠 20개가 들어온다', r)
잰다(구글.부름.ack === 1 && 구글.부름.consume === 1, 'acknowledge·consume 둘 다 불렀다', 구글.부름)
잰다(env.DB.구매.get('t1').확인 === 1 && env.DB.구매.get('t1').비움 === 1, '원장에 「확인·비움」 표시')
r = await 부르기('/billing/state', {}, 엄마)
잰다(r.paid === 20, '/billing/state 도 20', r)

console.log('\n④ 같은 영수증을 또 보내도 한 번만 (멱등)')
r = await sync(엄마, [{ sku: PACK, token: 't1' }, { sku: PACK, token: 't1' }])
잰다(r.paid === 20, '세 번 보내도 20', r)
잰다(구글.부름.ack === 1 && 구글.부름.consume === 1, '이미 끝난 건 구글에 다시 안 시킨다', 구글.부름)

console.log('\n⑤ 원장이 반만 들어갔다 (8/19 구멍 ①)')
새판(); 영수증('t2'); env.DB.st.고장 = 'credit-insert'
r = await sync(엄마, [{ sku: PACK, token: 't2' }])
잰다(!r.results[0].ok && r.results[0].reason === 'db_error' && r.paid === 0, '첫 판은 실패라고 말한다(성공이라 안 한다)', r)
잰다(구글.부름.ack === 0, '열쇠가 안 들어갔으면 acknowledge 도 안 한다(3일 안에 다시 기회가 있다)')
r = await sync(엄마, [{ sku: PACK, token: 't2' }])
잰다(r.results[0].ok && r.paid === 20, '다음 sync 에서 20개가 마저 들어온다', r)

console.log('\n⑥ 환불 → 남은 것만 거둔다')
새판(); 영수증('t3'); await sync(엄마, [{ sku: PACK, token: 't3' }]); 무료다씀('111')
await 사진(엄마); await 사진(엄마)
잰다(남음('t3') === 18, '두 장 읽어 18', env.DB.열쇠.get('t3'))
구글.영수증.get('t3').purchaseState = 1
r = await sync(엄마, [{ sku: PACK, token: 't3' }])
잰다(r.results[0].reason === 'revoked' && r.paid === 0, '환불 → 0', r)
r = await 사진(엄마)
잰다(r.error === 'debt' && r.빚 === 2, '환불 뒤엔 산 열쇠로 못 읽는다(쓴 2 만큼 빚 안내 · 10/23)', r)

console.log('\n⑦ 구글에 없는 영수증(404) → 절대 안 거둔다 (8/19 구멍 ⑥)')
새판(); 영수증('t4'); await sync(엄마, [{ sku: PACK, token: 't4' }]); 구글.영수증.delete('t4')
r = await sync(엄마, [{ sku: PACK, token: 't4' }])
잰다(r.results[0].reason === 'token_unknown' && r.paid === 20, '404 여도 20 그대로', r)

console.log('\n⑧ 보류(입금 대기) → 아직 안 준다')
새판(); 영수증('t5', { purchaseState: 2 })
r = await sync(엄마, [{ sku: PACK, token: 't5' }])
잰다(r.results[0].reason === 'pending' && r.paid === 0, '보류 → 0', r)
잰다(구글.부름.ack === 0, '보류는 acknowledge 안 한다')
구글.영수증.get('t5').purchaseState = 0
r = await sync(엄마, [{ sku: PACK, token: 't5' }])
잰다(r.paid === 20, '입금되면 20', r)

console.log('\n⑨ acknowledge 실패 → 실패라고 말하고, 다시 보내면 된다')
새판(); 영수증('t6'); 구글.ack실패 = true
r = await sync(엄마, [{ sku: PACK, token: 't6' }])
잰다(r.results[0].reason === 'ack_failed', 'ack 실패를 성공이라 안 한다', r)
잰다(r.paid === 20, '열쇠는 «먼저» 들어가 있다(돈 낸 사람이 기다리지 않는다)', r)
구글.ack실패 = false
r = await sync(엄마, [{ sku: PACK, token: 't6' }])
잰다(r.results[0].ok && r.paid === 20 && 구글.영수증.get('t6').acknowledgementState === 1, '다시 보내면 확인 끝 · 열쇠는 여전히 20', r)

console.log('\n⑩ consume 실패 → 열쇠는 주고, 다음에 다시 비운다')
새판(); 영수증('t7'); 구글.consume실패 = true
r = await sync(엄마, [{ sku: PACK, token: 't7' }])
잰다(r.results[0].ok && r.paid === 20 && env.DB.구매.get('t7').비움 === 0, '열쇠 20 · 비움은 아직', r)
구글.consume실패 = false
await sync(엄마, [{ sku: PACK, token: 't7' }])
잰다(env.DB.구매.get('t7').비움 === 1 && 구글.영수증.get('t7').consumptionState === 1, '다음 sync 에서 비웠다')

console.log('\n⑪ 남의 영수증 — 다른 계정이 보내면 안 준다')
새판(); 영수증('t8'); await sync(엄마, [{ sku: PACK, token: 't8' }])
r = await sync(아빠, [{ sku: PACK, token: 't8' }])
잰다(r.results[0].reason === 'other_account' && r.paid === 0, '아빠 계정엔 0', r)
r = await 부르기('/billing/state', {}, 엄마)
잰다(r.paid === 20, '엄마 계정은 20 그대로', r)

console.log('\n⑫ 이상한 입력')
새판(); 영수증('t9')
r = await sync(엄마, [{ sku: 'keys_999', token: 't9' }, { sku: PACK, token: '' }, { sku: PACK, token: 'x'.repeat(600) }, null, 'abc'])
잰다(r.results.every((x) => !x.ok) && r.paid === 0, '모르는 상품·빈 토큰·긴 토큰·쓰레기 전부 0', r.results.map((x) => x.reason))
r = await sync(엄마, Array.from({ length: 100 }, (_, i) => ({ sku: PACK, token: 'z' + i })))
잰다(r.results.length === 10, '한 번에 10개까지만 본다(무료 워커 바깥 호출 50번 한계)', r.results.length)
r = await 부르기('/billing/nope', {}, 엄마)
잰다(r.status === 404, '없는 길 → 404')

console.log('\n⑬ 수량')
새판(); 영수증('q3', { quantity: 3 }); 영수증('q999', { quantity: 999 }); 영수증('q0', { quantity: undefined })
r = await sync(엄마, [{ sku: PACK, token: 'q3' }])
잰다(r.paid === 60, '3개 → 60', r)
r = await sync(아빠, [{ sku: PACK, token: 'q999' }])
잰다(r.paid === 1000, '말도 안 되는 수량은 50 으로 자른다(1000)', r)
r = await sync(await 로그인토큰('333'), [{ sku: PACK, token: 'q0' }])
잰다(r.paid === 20, 'quantity 가 없으면 1 (공식: 없으면 1)', r)

console.log('\n⑭ 권한 전파 전(403) · 망가진 열쇠 — 아무것도 안 바뀐다')
새판(); 영수증('t10'); 구글.권한 = false
r = await sync(엄마, [{ sku: PACK, token: 't10' }])
잰다(r.results[0].reason === 'sa_denied' && r.paid === 0 && env.DB.구매.size === 0, 'sa_denied · 원장 그대로', r)
새판({ PLAY_SA_JSON: '{"client_email":"x"}' }); 영수증('t10')
r = await sync(엄마, [{ sku: PACK, token: 't10' }])
잰다(r.results[0].reason === 'no_service_account', '열쇠 없는 JSON → no_service_account', r)
새판({ PLAY_SA_JSON: '이건 JSON 이 아니다' }); 영수증('t10')
r = await sync(엄마, [{ sku: PACK, token: 't10' }])
잰다(r.results[0].reason === 'no_service_account', '깨진 JSON → no_service_account', r)
새판(); 영수증('t11'); await sync(엄마, [{ sku: PACK, token: 't11' }]); await sync(엄마, [{ sku: PACK, token: 't11' }])
잰다(구글.부름.oauth === 1, '여러 번 불러도 구글 로그인은 한 번(토큰 재사용)', 구글.부름)

console.log('\n⑮ OCR — 산 열쇠는 «무료를 다 쓴 뒤»에만 깎인다')
새판(); 영수증('o1'); await sync(엄마, [{ sku: PACK, token: 'o1' }])
r = await 사진(엄마)
잰다(r.깎음 === true && 남음('o1') === 20, '웰컴이 남았으면 산 열쇠는 그대로', env.DB.열쇠.get('o1'))
잰다(r.left && r.left.paid === 20, '남은알림에 paid 20', r.left)
무료다씀('111')
r = await 사진(엄마)
잰다(r.깎음 === true && 남음('o1') === 19 && r.left.paid === 19, '무료를 다 쓰면 산 열쇠로 읽고 19', r.left)
r = await 사진(엄마, {}, {})
잰다(남음('o1') === 18, '한 장 더 → 18', env.DB.열쇠.get('o1'))
잰다(env.DB.씀.length === 2 && env.DB.씀.every((x) => x.토큰 === 'o1' && x.통 === 'a:111'), '산 열쇠 사용 기록 2줄(어느 구매·누구)', env.DB.씀)

console.log('\n⑯ OCR — 몸통 번호만으로는 남의 산 열쇠를 못 태운다')
새판(); 영수증('o2'); await sync(엄마, [{ sku: PACK, token: 'o2' }]); 무료다씀('111')
r = await 사진(null, { sub: '111' })
잰다(r.error === 'user_quota' && 남음('o2') === 20, 'sub 만 적어 오면 막힌다 · 엄마 열쇠 20 그대로', r)

console.log('\n⑰ OCR — 구글 Vision 이 실패하면 산 열쇠도 안 깎는다')
새판(); 영수증('o3'); await sync(엄마, [{ sku: PACK, token: 'o3' }]); 무료다씀('111'); 구글.비전 = '오류'
r = await 사진(엄마)
잰다(r.깎음 === false && 남음('o3') === 20, 'Vision 실패 → 20 그대로', r)

console.log('\n⑱ OCR — 원장을 못 읽으면 «공짜로» 열어 주지도, 「0개」라고 하지도 않는다')
새판(); 영수증('o4'); await sync(엄마, [{ sku: PACK, token: 'o4' }]); 무료다씀('111'); env.DB.st.고장 = 'read'
r = await 사진(엄마)
잰다(r.error === 'user_quota', '못 읽으면 막힌다(새지 않는다)', r)
r = await 부르기('/', { 조회: 1, uid: 'dev1' }, 엄마)
잰다(r.left && r.left.paidStale === true, '조회 답에 paidStale 표 — 앱이 화면을 안 건드린다', r.left)

console.log('\n⑲ OCR — 운영자는 산 열쇠를 안 쓴다')
새판({ FOUNDER_SECRET: 'fs' }); 영수증('o5'); await sync(엄마, [{ sku: PACK, token: 'o5' }]); 무료다씀('111')
r = await 사진(엄마, {}, { 'x-hankki-founder': 'fs' })
잰다(r.status === 200 && 남음('o5') === 20, '운영자 → 20 그대로', r)

console.log('\n⑳ 마지막 한 개 — 마이너스로 안 간다')
새판(); 영수증('o6'); await sync(엄마, [{ sku: PACK, token: 'o6' }]); 무료다씀('111'); env.DB.열쇠.get('o6').남음 = 1
await Promise.all([사진(엄마), 사진(엄마), 사진(엄마)])
잰다(남음('o6') === 0, '동시에 셋 → 0 (−1·−2 아님)', env.DB.열쇠.get('o6'))
잰다(env.DB.씀.length === 1, '사용 기록도 실제로 깎인 1줄만', env.DB.씀)

console.log('\n㉑ 로그인 안 한 사람 화면 — paid 는 0, 결제와 무관하게 OCR 그대로')
새판()
r = await 사진(null)
잰다(r.깎음 === true && r.left.paid === 0 && !r.left.paidStale, '비로그인 = paid 0', r.left)

console.log('\n㉒ 환불 회수(하루 한 번) — consume 뒤 환불도 거둔다')
const 회수 = async (key = 'fs') => {
  const r = await worker.fetch(new Request('https://w.example/?voided=1&key=' + key, { method: 'GET', headers: { Origin: ORIGIN } }), env)
  return { status: r.status, ...(await r.json()) }
}
새판({ FOUNDER_SECRET: 'fs' }); 영수증('v1'); await sync(엄마, [{ sku: PACK, token: 'v1' }]); 무료다씀('111'); await 사진(엄마); await 사진(엄마)
잰다(남음('v1') === 18 && 구글.영수증.get('v1').consumptionState === 1, '사고 두 장 읽음 · 구글 쪽은 이미 비움(앱이 다시 안 보낸다)')
구글.무효쪽 = [['v1', '남의토큰']]
r = await 회수()
잰다(r.ok && r.본 === 2 && r.거둠 === 1 && 남음('v1') === -2, '무효 목록에서 찾아 남은 18 → 쓴 2 만큼 빚(-2 · 10/23) · 원장에 없는 토큰은 지나간다', r)
잰다(env.DB.구매.get('v1').상태 === 1, '원장에 「환불」 표시')
r = await 회수()
잰다(r.ok && r.거둠 === 0 && 남음('v1') === -2, '다음 날 또 받아도 같다(멱등)', r)
r = await 사진(엄마)
잰다(r.error === 'debt' && r.빚 === 2, '회수 뒤엔 산 열쇠로 못 읽는다(빚 2 안내)', r)

새판({ FOUNDER_SECRET: 'fs' }); 영수증('v2'); 영수증('v3'); await sync(엄마, [{ sku: PACK, token: 'v2' }, { sku: PACK, token: 'v3' }])
구글.무효쪽 = [['x1'], ['x2'], ['v3']]
r = await 회수()
잰다(r.ok && r.쪽 === 3 && 남음('v3') === 0 && 남음('v2') === 20, '세 쪽을 넘겨 셋째 쪽 v3 만 거둔다 · v2 는 그대로', r)
구글.끝없는쪽 = true; 구글.무효쪽 = [[]]
r = await 회수()
잰다(r.쪽 === 5 && 구글.부름.voided <= 3 + 5, '다음 쪽이 끝없이 와도 5쪽에서 멈춘다', r)

새판({ FOUNDER_SECRET: 'fs' }); 영수증('v4'); await sync(엄마, [{ sku: PACK, token: 'v4' }]); 구글.무효쪽 = [['v4']]; 구글.권한 = false
r = await 회수()
잰다(!r.ok && r.reason === 'sa_denied' && 남음('v4') === 20, '권한 없음 → 아무것도 안 바꾼다', r)
잰다(JSON.parse(env.OCR_KV._m.get('vp:last')).ok === false, '실패도 계기판 기록(vp:last)에 남는다')
r = await 회수('틀린열쇠')
잰다(r.status === 401, '운영자 열쇠가 틀리면 401', r)

새판({ FOUNDER_SECRET: 'fs' }); 영수증('v5'); await sync(엄마, [{ sku: PACK, token: 'v5' }]); 구글.무효쪽 = [['v5']]
{
  const 기다림 = []
  await worker.scheduled({ cron: '0 18 * * *' }, env, { waitUntil: (p) => 기다림.push(p) })
  await Promise.all(기다림)
  잰다(남음('v5') === 0, 'Cron(scheduled) 이 부르면 거둔다')
}
{
  const rr = await worker.fetch(new Request('https://w.example/?quota=1&key=fs', { method: 'GET', headers: { Origin: ORIGIN } }), env)
  const q = await rr.json()
  잰다(q.결제 && q.결제.켜짐 && q.결제.산건수 === 1 && q.결제.환불건수 === 1 && q.결제.환불회수마지막 && q.결제.환불회수마지막.ok, '계기판(?quota=1)에 산 건수·환불·마지막 회수가 보인다', q.결제)
}
새판({ FOUNDER_SECRET: 'fs', PLAY_SA_JSON: undefined })
r = await 회수()
잰다(r.reason === 'billing_off' && 구글.부름.voided === 0, '결제가 꺼져 있으면 구글에 묻지도 않는다', r)

console.log('\n㉓ 계정 삭제 — 산 열쇠는 지우고, 기록은 «누구»를 떼어 낸다')
새판(); 영수증('d1'); await sync(엄마, [{ sku: PACK, token: 'd1' }]); 무료다씀('111'); await 사진(엄마)
r = await 부르기('/billing/forget', {}, 엄마)
잰다(r.ok && r.사라진열쇠 === 19 && !env.DB.열쇠.has('d1'), '남은 19개는 지워진다 · 몇 개가 사라졌는지 알려 준다', r)
잰다(!env.DB.구매.has('d1') && env.DB.보존.get('d1')?.주문 === 'GPA.d1' && !('통' in env.DB.보존.get('d1')) && env.DB.씀.length === 0 && env.DB.보존씀.length === 1, '구매·사용 기록은 보존 전용 표로 옮겨진다(계정 번호 칸 없음 · 주문은 남는다)', [env.DB.보존.get('d1'), env.DB.보존씀])
r = await sync(엄마, [{ sku: PACK, token: 'd1' }])
잰다(r.results[0].reason === 'other_account' && r.paid === 0, '같은 영수증을 다시 보내도 열쇠가 되살아나지 않는다', r)
{ // 🧾 거래기록 찾기(운영자) · 환불 표시 · 5년 삭제 (2026-10-23)
  const 찾기 = async (q, key = 'fs') => (await worker.fetch(new Request(`https://w.example/?order=${encodeURIComponent(q)}&key=${key}`, { method: 'GET' }), env)).json()
  env.FOUNDER_SECRET = 'fs'
  let q = await 찾기('GPA.d1', 'nope')
  잰다(q.error === 'unauthorized', '운영자 열쇠 없이는 거래기록을 못 본다', q)
  q = await 찾기('GPA.d1')
  잰다(q.찾음 && q.계정삭제됨 && q.상품 === PACK && q.지급 === 20 && q.쓴때.length === 1 && !('통' in q), '지운 계정의 주문도 찾는다(계정 번호는 안 준다)', q)
  q = await 찾기('GPA.없음')
  잰다(q.ok && q.찾음 === false, '없는 주문은 「없다」', q)
  const ps = []; env.DB.보존.get('d1').처음 = Date.now() - 4 * 365 * 86400000
  await worker.scheduled({}, env, { waitUntil: (p) => ps.push(p) }); await Promise.all(ps)
  잰다(env.DB.보존.has('d1'), '4년 된 보존 기록은 남는다')
  env.DB.보존.get('d1').처음 = Date.now() - 6 * 365 * 86400000; ps.length = 0
  await worker.scheduled({}, env, { waitUntil: (p) => ps.push(p) }); await Promise.all(ps)
  잰다(!env.DB.보존.has('d1') && env.DB.보존씀.length === 0, '5년 지난 보존 기록은 사용 기록과 같이 지워진다', [env.DB.보존, env.DB.보존씀])
}
r = await 부르기('/billing/forget', {}, null)
잰다(r.status === 401, '로그인 확인 없이는 못 지운다', r)
새판({ PLAY_SA_JSON: undefined })
r = await 부르기('/billing/forget', {}, 엄마)
잰다(r.ok && r.사라진열쇠 === 0, '결제가 꺼져 있어도 지우기는 된다(창고만 있으면)', r)

console.log(`\n${실패 === 0 ? '✅' : '⛔'} ${통과}/${통과 + 실패} 통과\n`)
process.exit(실패 === 0 ? 0 : 1)
