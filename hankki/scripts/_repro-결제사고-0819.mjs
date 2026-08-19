#!/usr/bin/env node
// 💸 결제 «사고» 재현판 — 「어떻게 하면 돈이 새나」만 모았다. (2026-08-19)
//
// 📮 창업자 = *"다시한번 검토, **다양한 케이스로 재현**해봐."*
//
// ⭐⭐ 앞의 `_repro-결제서버-0819.mjs` 와 «보는 것이 다르다»
//   · 그 판  = **잘 될 때** 잘 되나 (정상 흐름·복원·멱등)
//   · 이 판  = **틀어질 때** 손해가 나나 (환불·중간 실패·동시 요청·깨진 열쇠·이상한 입력)
//   ⛔ 둘을 한 파일에 섞으면 정상 흐름이 사고 케이스에 파묻힌다.
//
// 🔒 여기서 잡은 구멍 다섯 (전부 «고치기 전»엔 실제로 새던 것)
//   ① 원장 한쪽만 들어가면 **장수를 영영 못 받는다**(돈 내고 0장)
//   ② 20장 받고 **환불해도 장수가 그대로** 남는다
//   ③ 마지막 한 장을 **동시에 두 번** 쓰면 한 장 공짜
//   ④ 원장을 **못 읽은 것**을 「산 게 없다」로 앱에 알려 산 팩이 잠긴다
//   ⑤ 영구 팩을 **환불해도 팩이 열린 채로** 남는다

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { webcrypto } from 'node:crypto'

const HERE = dirname(fileURLToPath(import.meta.url))
const WORKER = join(HERE, '..', 'ocr-proxy', 'worker.js')
const ORIGIN = 'https://peachfam0307-glitch.github.io'
const APP_TOKEN = 'test-app-token'
const PACK = 'ocr_pack_20'
const YM = new Date().toISOString().slice(0, 7)

let ok = 0, bad = 0
const pass = (m) => { ok++; console.log(`  ✅ ${m}`) }
const fail = (m, got) => { bad++; console.log(`  ⛔ ${m} — 나온 값: ${JSON.stringify(got)}`) }
const eq = (m, a, b) => (JSON.stringify(a) === JSON.stringify(b) ? pass(m) : fail(m, a))

// ── 가짜 D1 (쿼리 «전수»를 안다 — 모르는 쿼리면 죽는다) ──
function fakeDB(opts = {}) {
  const T = { purchases: new Map(), credits: new Map(), entitlements: new Map() }
  const Q = {
    'INSERT OR IGNORE INTO purchases (token, sku, uid, order_id, state, acked, created_at, updated_at) VALUES (?,?,?,?,?,0,?,?)': (a) => {
      if (T.purchases.has(a[0])) return { meta: { changes: 0 } }
      T.purchases.set(a[0], { token: a[0], sku: a[1], uid: a[2], order_id: a[3], state: a[4], acked: 0 })
      return { meta: { changes: 1 } }
    },
    'INSERT OR IGNORE INTO credits (token, sku, uid, remaining, needs_consume, consumed, created_at, updated_at) VALUES (?,?,?,?,0,0,?,?)': (a) => {
      if (T.credits.has(a[0])) return { meta: { changes: 0 } }
      T.credits.set(a[0], { token: a[0], sku: a[1], uid: a[2], remaining: a[3], needs_consume: 0, consumed: 0, created_at: a[4] })
      return { meta: { changes: 1 } }
    },
    'SELECT uid FROM credits WHERE token=?': (a) => { const r = T.credits.get(a[0]); return r ? { uid: r.uid } : null },
    'UPDATE credits SET uid=?, updated_at=? WHERE token=?': (a) => {
      const r = T.credits.get(a[2]); if (!r) return { meta: { changes: 0 } }
      r.uid = a[0]; return { meta: { changes: 1 } }
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
    'UPDATE credits SET remaining=0, updated_at=? WHERE token=?': (a) => {
      const r = T.credits.get(a[1]); if (!r) return { meta: { changes: 0 } }
      r.remaining = 0; return { meta: { changes: 1 } }
    },
    'DELETE FROM entitlements WHERE token=?': (a) => {
      let n = 0
      for (const [k, r] of [...T.entitlements]) if (r.token === a[0]) { T.entitlements.delete(k); n++ }
      return { meta: { changes: n } }
    },
    'UPDATE purchases SET state=?, updated_at=? WHERE token=?': (a) => {
      const r = T.purchases.get(a[2]); if (!r) return { meta: { changes: 0 } }
      r.state = a[0]; return { meta: { changes: 1 } }
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
      if (!f) throw new Error(`⛔ 사고판이 모르는 쿼리다:\n${sql}`)
      // 🔧 「이 쿼리만 골라서 죽게」 만들 수 있다 — 중간에 끊기는 사고를 흉내내려고
      if (opts.die && opts.die.test(sql)) return { bind() { return this }, run() { throw new Error('D1 down') }, first() { throw new Error('D1 down') }, all() { throw new Error('D1 down') } }
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

const fakeKV = (init = {}) => {
  const m = new Map(Object.entries(init))
  return { _m: m, async get(k) { return m.has(k) ? m.get(k) : null }, async put(k, v) { m.set(k, String(v)) } }
}

// ── 가짜 구글 ──
function fakeFetch(S) {
  return async (url, opt = {}) => {
    const u = String(url)
    S.calls.push(u)
    if (u.startsWith('https://oauth2.googleapis.com/token')) {
      if (S.oauthFail) return new Response('nope', { status: 500 })
      return new Response(JSON.stringify({ access_token: 'fake', expires_in: 3600 }), { status: 200 })
    }
    if (u.includes('androidpublisher')) {
      if (u.endsWith(':acknowledge')) { if (S.ackFail) return new Response('boom', { status: 503 }); S.acked++; return new Response('{}', { status: 200 }) }
      if (u.endsWith(':consume')) { if (S.consumeFail) return new Response('boom', { status: 503 }); S.consumed++; return new Response('{}', { status: 200 }) }
      if (S.getStatus && S.getStatus !== 200) return new Response('err', { status: S.getStatus })
      return new Response(JSON.stringify(S.purchase), { status: 200 })
    }
    if (u.includes('vision.googleapis.com')) {
      if (S.visionFail) return new Response('x', { status: 500 })
      return new Response(JSON.stringify({ responses: [{ fullTextAnnotation: { text: '읽은 글자' } }] }), { status: 200 })
    }
    throw new Error(`가짜가 모르는 주소: ${u}`)
  }
}

async function makeSA(broken) {
  if (broken === 'json') return '{이건 JSON 이 아니다'
  const kp = await webcrypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true, ['sign', 'verify'],
  )
  const der = new Uint8Array(await webcrypto.subtle.exportKey('pkcs8', kp.privateKey))
  let b = ''
  for (let i = 0; i < der.length; i++) b += String.fromCharCode(der[i])
  const pem = `-----BEGIN PRIVATE KEY-----\n${btoa(b).replace(/(.{64})/g, '$1\n')}\n-----END PRIVATE KEY-----\n`
  if (broken === 'pem') return JSON.stringify({ client_email: 'a@b.iam.gserviceaccount.com', private_key: '-----BEGIN PRIVATE KEY-----\n엉터리\n-----END PRIVATE KEY-----\n' })
  if (broken === 'nokey') return JSON.stringify({ client_email: 'a@b.iam.gserviceaccount.com' })
  return JSON.stringify({ client_email: 'a@b.iam.gserviceaccount.com', private_key: pem })
}

const post = (path, body) => new Request(`https://w.dev${path}`, {
  method: 'POST',
  headers: { Origin: ORIGIN, 'Content-Type': 'application/json', 'x-hankki-token': APP_TOKEN },
  body: typeof body === 'string' ? body : JSON.stringify(body),
})
const scan = (uid, batch) => post('/', { image: 'data:image/png;base64,AAAA', uid, batch })

// 무료를 다 쓴 사람으로 만든다(＝유료 길로 들어간다)
const brokeKV = (uid) => fakeKV({ [`w:${uid}`]: '0', [`u:${uid}:${YM}`]: '5' })

// ═══════════════════════════════════════════════════════════
const run = async () => {
  const src = readFileSync(WORKER, 'utf8')
  // ⚠️⚠️ **구글 액세스 토큰은 «한 판(isolate) 안에서» 캐시된다** — 그게 정상이고 그래야 빠르다.
  //   ⛔ 그런데 시험에선 그 캐시 때문에 «망가진 열쇠»를 넣어도 앞 시험의 토큰을 그대로 써 버린다.
  //      → 그런 칸은 **판을 새로 띄워서** 잰다(`fresh()`). 2026-08-19 에 실제로 이걸로 한 번 속았다.
  let _n = 0
  const fresh = async () => (await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(`${src}\n//${_n++}`)}`)).default
  const worker = await fresh()
  const SA = await makeSA()
  const buy = { purchaseState: 0, acknowledgementState: 0, orderId: 'GPA.1', quantity: 1 }
  const S = () => ({ acked: 0, consumed: 0, calls: [], purchase: { ...buy } })

  const setup = async (dbOpts) => {
    const st = S()
    globalThis.fetch = fakeFetch(st)
    const db = fakeDB(dbOpts)
    const uid = 'u1'
    const env = { APP_TOKEN, VISION_KEY: 'k', OCR_KV: brokeKV(uid), PLAY_SA_JSON: SA, HANKKI_DB: db }
    return { st, db, env, uid }
  }
  const jr = async (r) => r.json()

  // ═══ ① 원장이 «반만» 들어갔다 ═══
  console.log('\n① 팩은 샀는데 «원장 한쪽만» 들어갔다 (D1 이 잠깐 죽었다)')
  {
    // credits 넣는 문장만 죽인다 → purchases 엔 들어가고 장수는 못 받는다
    const a = await setup({ die: /INSERT OR IGNORE INTO credits/ })
    const r1 = await worker.fetch(post('/billing/sync', { uid: a.uid, purchases: [{ sku: PACK, token: 'T1' }] }), a.env)
    eq('그때는 실패로 답한다(성공이라 말하지 않는다)', (await jr(r1)).results[0].ok, false)
    eq('장수는 아직 0', a.db._T.credits.size, 0)
    eq('그런데 purchases 엔 들어갔다(＝「처음 보는 토큰」이 소진됐다)', a.db._T.purchases.size, 1)
    // D1 이 살아난 뒤 앱이 다시 보낸다 — 그때 「이미 본 토큰」이라고 넘겨 버리면 «돈 내고 0장»이다
    const db2 = fakeDB()
    db2._T.purchases.set('T1', { token: 'T1', sku: PACK, uid: a.uid, state: 0, acked: 0 })
    const env2 = { ...a.env, HANKKI_DB: db2 }
    const r2 = await worker.fetch(post('/billing/sync', { uid: a.uid, purchases: [{ sku: PACK, token: 'T1' }] }), env2)
    eq('⭐다시 보내니 «그제야» 20장을 받았다 (돈 내고 0장이 안 된다)', (await jr(r2)).credits, 20)
  }

  // ═══ ② 20장 받고 환불 ═══
  console.log('\n② 20장 받고 «환불»했다 — 장수를 거둬들이나')
  {
    const a = await setup()
    await worker.fetch(post('/billing/sync', { uid: a.uid, purchases: [{ sku: PACK, token: 'T2' }] }), a.env)
    eq('먼저 20장을 받았다', a.db._T.credits.get('T2').remaining, 20)
    a.st.purchase = { purchaseState: 1, acknowledgementState: 1 }   // 구글이 「취소됨」이라 답한다
    const r = await worker.fetch(post('/billing/sync', { uid: a.uid, purchases: [{ sku: PACK, token: 'T2' }] }), a.env)
    const j = await jr(r)
    eq('revoked 로 답한다', j.results[0].reason, 'revoked')
    eq('⭐장수를 «거둬들였다» (0장)', j.credits, 0)
    const r2 = await worker.fetch(scan(a.uid, 'b1'), a.env)
    eq('그래서 스캔도 막힌다(429)', r2.status, 429)
  }

  // ═══ ③ 영구 팩을 환불 ═══
  // ⭐ 환불된 구매는 `listPurchases()` 엔 «안» 나온다 — 그래서 앱이 `listPurchaseHistory()` 도 같이 보내는 게
//   복원뿐 아니라 «회수»에도 값을 한다(History 는 취소된 것까지 준다 · 공식).
  console.log('\n③ 꾸미기 팩(영구)을 «환불»했다 — 팩을 도로 잠그나')
  {
    const a = await setup()
    await worker.fetch(post('/billing/sync', { uid: a.uid, purchases: [{ sku: 'deco_chuseok', token: 'D1' }] }), a.env)
    eq('먼저 팩이 열렸다', (await jr(await worker.fetch(post('/billing/state', { uid: a.uid }), a.env))).entitlements, ['deco_chuseok'])
    a.st.purchase = { purchaseState: 1, acknowledgementState: 1 }
    const r = await worker.fetch(post('/billing/sync', { uid: a.uid, purchases: [{ sku: 'deco_chuseok', token: 'D1' }] }), a.env)
    eq('⭐팩이 도로 잠겼다', (await jr(r)).entitlements, [])
  }

  // ═══ ④ 「구글이 모르는 토큰」은 회수하지 «않는다» ═══
  console.log('\n④ 구글이 404 로 답한다 — ⛔이때는 «거둬들이면 안 된다»(오래돼 지워진 것일 수 있다)')
  {
    const a = await setup()
    await worker.fetch(post('/billing/sync', { uid: a.uid, purchases: [{ sku: PACK, token: 'T4' }] }), a.env)
    a.st.getStatus = 404
    const r = await worker.fetch(post('/billing/sync', { uid: a.uid, purchases: [{ sku: PACK, token: 'T4' }] }), a.env)
    const j = await jr(r)
    eq('token_unknown 으로 답한다', j.results[0].reason, 'token_unknown')
    eq('⭐그래도 장수는 «그대로»(멀쩡한 사람의 것을 뺏지 않는다)', j.credits, 20)
  }

  // ═══ ⑤ 마지막 한 장을 «동시에» ═══
  console.log('\n⑤ 마지막 한 장을 «동시에 두 번» 쓴다')
  {
    const a = await setup()
    await worker.fetch(post('/billing/sync', { uid: a.uid, purchases: [{ sku: PACK, token: 'T5' }] }), a.env)
    a.db._T.credits.get('T5').remaining = 1
    const [x, y] = await Promise.all([worker.fetch(scan(a.uid, 'c1'), a.env), worker.fetch(scan(a.uid, 'c2'), a.env)])
    const codes = [x.status, y.status].sort()
    eq('⭐하나만 되고 하나는 막힌다 (한 장 공짜가 없다)', codes, [200, 429])
    eq('장수는 0에서 멈춘다(마이너스 없음)', a.db._T.credits.get('T5').remaining, 0)
  }

  // ═══ ⑥ 같은 구매를 «동시에» 두 번 sync ═══
  console.log('\n⑥ 앱이 두 번 떠서 «같은 구매»를 동시에 보낸다')
  {
    const a = await setup()
    await Promise.all([
      worker.fetch(post('/billing/sync', { uid: a.uid, purchases: [{ sku: PACK, token: 'T6' }] }), a.env),
      worker.fetch(post('/billing/sync', { uid: a.uid, purchases: [{ sku: PACK, token: 'T6' }] }), a.env),
    ])
    eq('⭐장수가 «40 이 아니라» 20', a.db._T.credits.get('T6').remaining, 20)
  }

  // ═══ ⑦ 원장을 «못 읽었다» ═══
  console.log('\n⑦ 원장을 «못 읽었다» — 「산 게 없다」로 말하면 산 팩이 잠긴다')
  {
    const a = await setup()
    await worker.fetch(post('/billing/sync', { uid: a.uid, purchases: [{ sku: 'deco_chuseok', token: 'D7' }] }), a.env)
    const env2 = { ...a.env, HANKKI_DB: fakeDB({ die: /SELECT COALESCE|SELECT sku FROM entitlements/ }) }
    const j = await jr(await worker.fetch(post('/billing/state', { uid: a.uid }), env2))
    eq('⭐「못 읽었다」를 표로 세워 알린다', j.stale, true)
    const bill = readFileSync(join(HERE, '..', 'src', 'billing.js'), 'utf8')
    eq('⭐앱이 stale 이면 화면을 안 건드린다', /if \(j\.stale\) return \{ ok: false, reason: 'stale' \}/.test(bill), true)
  }

  // ═══ ⑧ acknowledge 가 실패했다 ═══
  console.log('\n⑧ acknowledge 가 실패했다 (구글 장애) — ⛔성공이라 말하면 3일 뒤 팩이 사라진다')
  {
    const a = await setup()
    a.st.ackFail = true
    const r1 = await worker.fetch(post('/billing/sync', { uid: a.uid, purchases: [{ sku: PACK, token: 'T8' }] }), a.env)
    const j1 = await jr(r1)
    eq('실패라고 말한다', j1.results[0].reason, 'ack_failed')
    eq('⭐그래도 장수는 «먼저» 줬다 (돈 내고 못 쓰는 시간이 없다)', j1.credits, 20)
    a.st.ackFail = false
    const j2 = await jr(await worker.fetch(post('/billing/sync', { uid: a.uid, purchases: [{ sku: PACK, token: 'T8' }] }), a.env))
    eq('⭐다시 보내니 acknowledge 가 붙었다', [j2.results[0].ok, a.st.acked], [true, 1])
    eq('장수는 그대로 20 (두 번 안 준다)', j2.credits, 20)
  }

  // ═══ ⑨ consume 이 실패했다 ═══
  console.log('\n⑨ consume 이 실패했다 — 다음에 다시 시도하나')
  {
    const a = await setup()
    a.st.consumeFail = true
    await worker.fetch(post('/billing/sync', { uid: a.uid, purchases: [{ sku: PACK, token: 'T9' }] }), a.env)
    eq('아직 안 비웠다고 표시돼 있다', a.db._T.credits.get('T9').consumed, 0)
    a.st.consumeFail = false
    await worker.fetch(post('/billing/sync', { uid: a.uid, purchases: [{ sku: PACK, token: 'T9' }] }), a.env)
    eq('⭐다음 sync 에서 비웠다(＝또 살 수 있게 됐다)', [a.db._T.credits.get('T9').consumed, a.st.consumed], [1, 1])
    eq('장수는 그대로 20', a.db._T.credits.get('T9').remaining, 20)
  }

  // ═══ ⑩ 서비스 계정이 망가졌다 ═══
  console.log('\n⑩ 서비스 계정 열쇠가 망가졌다 — 조용히 죽지 말고 «실패»라고 말해야 한다')
  {
    for (const [what, broken] of [['JSON 이 깨졌다', 'json'], ['PEM 이 엉터리다', 'pem'], ['private_key 가 없다', 'nokey']]) {
      const w = await fresh()
      const st = S(); globalThis.fetch = fakeFetch(st)
      const env = { APP_TOKEN, PLAY_SA_JSON: await makeSA(broken), HANKKI_DB: fakeDB() }
      const j = await jr(await w.fetch(post('/billing/sync', { uid: 'u1', purchases: [{ sku: PACK, token: 'TA' }] }), env))
      eq(`${what} → no_service_account`, j.results[0].reason, 'no_service_account')
      eq(`${what} → 장수를 안 준다`, j.credits, 0)
    }
    const w2 = await fresh()
    const st = S(); st.oauthFail = true; globalThis.fetch = fakeFetch(st)
    const env = { APP_TOKEN, PLAY_SA_JSON: SA, HANKKI_DB: fakeDB() }
    const j = await jr(await w2.fetch(post('/billing/sync', { uid: 'u1', purchases: [{ sku: PACK, token: 'TA' }] }), env))
    eq('구글 로그인이 실패 → no_service_account', j.results[0].reason, 'no_service_account')
    // ⭐ 열쇠 캐시 = 한 판 안에서 «한 번만» 로그인한다(느려지면 안 되니까)
    const w3 = await fresh()
    const st3 = S(); globalThis.fetch = fakeFetch(st3)
    const env3 = { APP_TOKEN, PLAY_SA_JSON: SA, HANKKI_DB: fakeDB() }
    for (let i = 0; i < 3; i++) await w3.fetch(post('/billing/sync', { uid: 'u1', purchases: [{ sku: PACK, token: `TC${i}` }] }), env3)
    eq('⭐세 번 불러도 구글 로그인은 한 번뿐', st3.calls.filter((u) => u.startsWith('https://oauth2')).length, 1)
  }

  // ═══ ⑪ 구글이 권한을 거절한다(403) ═══
  console.log('\n⑪ 서비스 계정 권한이 아직 안 붙었다(403) — 최대 24시간 걸리는 그 자리')
  {
    const a = await setup()
    a.st.getStatus = 403
    const j = await jr(await worker.fetch(post('/billing/sync', { uid: a.uid, purchases: [{ sku: PACK, token: 'TB' }] }), a.env))
    eq('sa_denied 로 답한다(＝권한 문제라고 알 수 있다)', j.results[0].reason, 'sa_denied')
    eq('장수를 안 줬다', j.credits, 0)
  }

  // ═══ ⑫ 이상한 입력 ═══
  console.log('\n⑫ 앱이 이상한 걸 보낸다 — 던지지 말고 «막아야» 한다')
  {
    const a = await setup()
    const cases = [
      ['본문이 JSON 이 아니다', 'not json', 400],
      ['uid 가 없다', { purchases: [] }, 400],
      ['uid 가 특수문자뿐', { uid: '!!!@@@', purchases: [] }, 400],
      ['purchases 가 배열이 아니다', { uid: 'u1', purchases: 'hi' }, 200],
      ['목록이 비었다', { uid: 'u1', purchases: [] }, 200],
      ['목록에 null 이 있다', { uid: 'u1', purchases: [null, 3, 'x'] }, 200],
      ['토큰이 없다', { uid: 'u1', purchases: [{ sku: PACK }] }, 200],
      ['토큰이 아주 길다', { uid: 'u1', purchases: [{ sku: PACK, token: 'x'.repeat(600) }] }, 200],
      ['sku 에 이상한 글자', { uid: 'u1', purchases: [{ sku: '../../etc', token: 'z' }] }, 200],
    ]
    for (const [what, body, want] of cases) {
      const r = await worker.fetch(post('/billing/sync', body), a.env)
      eq(`${what} → ${want}`, r.status, want)
    }
    eq('⭐그중 어느 것도 장수를 못 만들었다', a.db._T.credits.size, 0)
    // 목록이 30개를 넘으면 잘라 낸다(구글을 30번만 부른다)
    const many = Array.from({ length: 50 }, (_, i) => ({ sku: PACK, token: `M${i}` }))
    const j = await jr(await worker.fetch(post('/billing/sync', { uid: 'u1', purchases: many }), a.env))
    eq('50개를 보내도 30개까지만 본다', j.results.length, 30)
  }

  // ═══ ⑬ 여러 개를 한꺼번에 산 경우 ═══
  console.log('\n⑬ 한 번에 «세 팩»을 샀다(quantity 3) · 그리고 이상한 quantity')
  {
    const a = await setup()
    a.st.purchase = { ...buy, quantity: 3 }
    const j = await jr(await worker.fetch(post('/billing/sync', { uid: a.uid, purchases: [{ sku: PACK, token: 'TQ' }] }), a.env))
    eq('20 × 3 = 60장', j.credits, 60)
    const b = await setup()
    b.st.purchase = { ...buy, quantity: 99999 }
    const j2 = await jr(await worker.fetch(post('/billing/sync', { uid: b.uid, purchases: [{ sku: PACK, token: 'TQ2' }] }), b.env))
    eq('⭐말도 안 되는 수량은 잘라 낸다(20 × 50)', j2.credits, 1000)
    const c = await setup()
    c.st.purchase = { ...buy, quantity: 'ㅋㅋ' }
    const j3 = await jr(await worker.fetch(post('/billing/sync', { uid: c.uid, purchases: [{ sku: PACK, token: 'TQ3' }] }), c.env))
    eq('글자가 와도 1개로 본다', j3.credits, 20)
  }

  // ═══ ⑭ 보류 중(pending) 결제 ═══
  console.log('\n⑭ 보류 중 결제(편의점 입금 대기 등) — 아직 주면 안 된다')
  {
    const a = await setup()
    a.st.purchase = { purchaseState: 2, acknowledgementState: 0 }
    const j = await jr(await worker.fetch(post('/billing/sync', { uid: a.uid, purchases: [{ sku: PACK, token: 'TP' }] }), a.env))
    eq('pending 이라 답한다', j.results[0].reason, 'pending')
    eq('장수를 안 줬다', j.credits, 0)
    eq('acknowledge 도 안 했다', a.st.acked, 0)
    a.st.purchase = { ...buy }
    const j2 = await jr(await worker.fetch(post('/billing/sync', { uid: a.uid, purchases: [{ sku: PACK, token: 'TP' }] }), a.env))
    eq('⭐입금이 끝나면 그때 20장을 준다', j2.credits, 20)
  }

  // ═══ ⑮ OCR 이 결제 때문에 다치지 않는다 ═══
  console.log('\n⑮ OCR 이 결제 «때문에» 다치지 않는다')
  {
    // ⓐ 결제가 통째로 꺼져 있어도 OCR 은 그대로
    const st = S(); globalThis.fetch = fakeFetch(st)
    const envOff = { APP_TOKEN, VISION_KEY: 'k', OCR_KV: fakeKV() }
    const r = await worker.fetch(scan('z1'), envOff)
    eq('결제 꺼짐 + 웰컴 20장 → 그대로 읽힌다', [r.status, (await jr(r)).left.welcome], [200, 19])
    // ⓑ D1 이 죽어도 무료 유저는 그대로
    const envDead = { APP_TOKEN, VISION_KEY: 'k', OCR_KV: fakeKV(), PLAY_SA_JSON: SA, HANKKI_DB: fakeDB({ die: /SELECT/ }) }
    const r2 = await worker.fetch(scan('z2'), envDead)
    eq('D1 이 죽어도 무료 유저는 그대로 읽힌다', r2.status, 200)
    // ⓒ D1 이 죽고 무료도 다 쓴 사람 → 예전과 «똑같이» 429
    const envDead2 = { ...envDead, OCR_KV: brokeKV('z3') }
    const r3 = await worker.fetch(scan('z3'), envDead2)
    eq('⭐D1 이 죽으면 예전과 똑같이 429 (더 나빠지지 않는다)', [r3.status, (await jr(r3)).error], [429, 'user_quota'])
    // ⓓ 전역 상한은 유료 유저에게도 그대로 (비용 방어가 이긴다)
    const a = await setup()
    await worker.fetch(post('/billing/sync', { uid: a.uid, purchases: [{ sku: PACK, token: 'TG' }] }), a.env)
    await a.env.OCR_KV.put(`m:${YM}`, '900')
    const r4 = await worker.fetch(scan(a.uid, 'g1'), a.env)
    eq('⛔전역 900 은 돈 낸 사람도 못 넘는다(비용 $0 보장이 먼저다)', [r4.status, (await jr(r4)).error], [429, 'global_quota'])
    eq('그때 장수를 깎지도 않았다', a.db._T.credits.get('TG').remaining, 20)
  }

  // ═══ ⑯ 운영자 모드 ═══
  console.log('\n⑯ 운영자(창업자) 모드 — 결제와 섞이지 않는다')
  {
    const a = await setup()
    const req = new Request('https://w.dev/', {
      method: 'POST',
      headers: { Origin: ORIGIN, 'Content-Type': 'application/json', 'x-hankki-token': APP_TOKEN, 'x-hankki-founder': 'SECRET' },
      body: JSON.stringify({ image: 'data:image/png;base64,AAAA', uid: a.uid }),
    })
    const env = { ...a.env, FOUNDER_SECRET: 'SECRET' }
    const r = await worker.fetch(req, env)
    eq('운영자는 무료를 다 써도 읽힌다', r.status, 200)
    eq('⭐그리고 «산 장수»를 깎지 않는다', a.db._T.credits.size, 0)
  }

  console.log(`\n${'─'.repeat(52)}\n✅ ${ok}칸 통과 · ⛔ ${bad}칸 실패`)
  if (bad) { console.log('\n⛔ 결제 사고판이 실패했다.'); process.exit(1) }
}

run().catch((e) => { console.error('⛔ 사고판이 죽었다:', e); process.exit(1) })
