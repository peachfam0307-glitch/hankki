// 🎁 웰컴 20장 로직 재현 — worker.js 의 판정을 «그대로» 떼어 와서 돌려본다.
//
// 왜 이렇게 하나 = worker 는 Cloudflare 런타임이라 여기서 못 돌린다.
//   ⭐ 그래서 «판정 부분만» 같은 순서로 옮겨 시뮬한다. ⛔로직을 바꾸면 여기도 같이 고칠 것.
//
// 무엇을 확인하나 (전부 «돈·유저 신뢰»가 걸린 것)
//   ① 첫 유저가 «정확히 20장» 받는다 (19도 21도 아니다)
//   ② 21장째엔 막힌다 → 앱이 기본 인식으로 떨어진다
//   ③ 웰컴을 다 쓰면 «그 달엔 5장이 더 안 나온다» (창업자 확정: 20장이지 25장이 아니다)
//   ④ 다음 달엔 5장이 열린다
//   ⑤ 웰컴이 남은 채로 달이 바뀌어도 «남아 있다» (창업자 Ⓐ — 이월된다)
//   ⑥ 응답의 「남은 장수」가 유저가 세는 것과 맞는다

const LIMITS = { PER_USER_MONTHLY: 5, WELCOME_FREE: 20 }

// ── worker 를 흉내내는 최소 KV ────────────────────────────
const mkKv = () => {
  const m = new Map()
  return {
    get: async (k) => (m.has(k) ? m.get(k) : null),
    put: async (k, v) => { m.set(k, v) },
    _dump: m,
  }
}
const num = async (kv, k) => { const v = await kv.get(k); return v ? parseInt(v, 10) || 0 : 0 }
const inc = async (kv, k) => { await kv.put(k, String((await num(kv, k)) + 1)) }

// worker.js 의 순서 그대로 — 잔량 읽기 → 한도 검사 → 카운터 증가 → 응답
async function call(kv, uid, ym) {
  const raw = await kv.get(`w:${uid}`)
  const welcomeLeft = raw === null ? LIMITS.WELCOME_FREE : (parseInt(raw, 10) || 0)
  const userC = await num(kv, `u:${uid}:${ym}`)

  if (welcomeLeft <= 0 && userC >= LIMITS.PER_USER_MONTHLY) return { ok: false, error: 'user_quota' }

  await inc(kv, `u:${uid}:${ym}`)
  if (welcomeLeft > 0) await kv.put(`w:${uid}`, String(welcomeLeft - 1))

  const leftWelcome = Math.max(0, welcomeLeft - 1)
  let leftMonth = LIMITS.PER_USER_MONTHLY
  if (leftWelcome <= 0) leftMonth = Math.max(0, LIMITS.PER_USER_MONTHLY - (await num(kv, `u:${uid}:${ym}`)))
  return { ok: true, left: { welcome: leftWelcome, month: leftMonth } }
}

// ── 확인 ──────────────────────────────────────────────────
let ok = 0, ng = 0
const chk = (설명, got, want) => {
  if (String(got) === String(want)) { console.log(`   ✅ ${설명}`); ok++ }
  else { console.log(`   ⛔ ${설명}  기대 ${want} · 실제 ${got}`); ng++ }
}

console.log('\n🎁 웰컴 20장 재현\n')

{
  const kv = mkKv()
  let 성공 = 0, 마지막 = null
  for (let i = 0; i < 25; i++) {
    const r = await call(kv, 'u1', '2026-08')
    if (r.ok) { 성공++; 마지막 = r } else break
  }
  chk('① 첫 달에 «정확히 20장» 된다', 성공, 20)
  chk('② 21장째는 막힌다(기본 인식으로)', (await call(kv, 'u1', '2026-08')).error, 'user_quota')
  chk('③ 20장을 다 쓰면 그 달 «5장이 더 안 나온다» (25가 아니다)', 성공, 20)
  chk('⑥ 마지막 장에서 「웰컴 0 · 이번 달 0」으로 알려준다', `${마지막.left.welcome}/${마지막.left.month}`, '0/0')

  // 다음 달
  let 다음달 = 0
  for (let i = 0; i < 8; i++) { if ((await call(kv, 'u1', '2026-09')).ok) 다음달++; else break }
  chk('④ 다음 달엔 5장이 열린다', 다음달, 5)
}

{
  // ⑤ 웰컴을 3장만 쓰고 달이 바뀌면 — 17장이 «그대로» 남아야 한다(창업자 Ⓐ)
  const kv = mkKv()
  for (let i = 0; i < 3; i++) await call(kv, 'u2', '2026-08')
  let 다음달 = 0
  for (let i = 0; i < 30; i++) { if ((await call(kv, 'u2', '2026-09')).ok) 다음달++; else break }
  chk('⑤ 안 쓴 웰컴은 다음 달로 이월된다 (17 남음 → 17장)', 다음달, 17)
}

{
  // 첫 장에서 알려주는 잔량이 맞나 — 20장 중 하나를 썼으니 19가 남는다
  const kv = mkKv()
  const r = await call(kv, 'u3', '2026-08')
  chk('⑥-b 첫 장 뒤 「웰컴 19장 남음」', r.left.welcome, 19)
}

console.log(`\n   ── ${ok}칸 통과 · ${ng}칸 어긋남 ──\n`)
process.exit(ng ? 1 : 0)
