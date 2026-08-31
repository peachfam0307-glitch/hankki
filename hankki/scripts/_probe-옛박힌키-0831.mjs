// 🔎🔎 「폰에 «옛 키»가 박혀 있을 수 있는 자리 전수」 — 저장소가 답을 갖고 있다
//
// 📮 창업자 2026-08-31 = *"크림파스타, 애호박덮밥, 김치볶음밥에 아직도 붙어있었어"* ·
//    *"저거는 새컷이고 예전 카와이컷이 붙어있었어"* · *"**옛키가 어디어디 박혀있는지 모르겠어.**"*
//
// ⭐⭐ **창업자가 폰 속을 알 방법은 없다 — 그런데 저장소는 안다.**
//    씨앗 레시피(`basics.js`)의 `icon:` 은 저장될 때 레시피에 «박힌다»(`Thumb` = `recipe.icon || guess`).
//    그러니 **basics.js 의 «역대» icon 값 전부**가 곧 「폰에 박혀 있을 수 있는 키」의 전부다.
//    ⛔ 짐작할 필요가 없다. 커밋 히스토리를 세면 된다.
//
// ⛔⛔ **지난번에 여기서 틀렸다** — 「픽커에 없으면 카와이」로 넓게 잡았다가
//    픽커에서 내려간 이유가 «카와이만은 아니어서» 엉뚱한 것까지 걸었다(store.jsx v96 주석).
//    ✅ 그래서 이 판은 **판정하지 않는다.** 「후보」만 뽑고 «그림은 눈으로» 본다(절대원칙 21).
//
// 실행: node /home/user/hankki/hankki/scripts/_probe-옛박힌키-0831.mjs
import { execFileSync } from 'node:child_process'

const REPO = '/home/user/hankki'
const FILE = 'hankki/src/data/basics.js'
const git = (...a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 })

// 한 판(커밋)의 basics.js 에서 «레시피 id → icon» 을 뽑는다.
//   ⚠️ `id:` 와 `icon:` 이 같은 객체 안에 있고 순서가 고정이 아니다 → 「다음 id 가 나오기 전까지」로 묶는다.
const 뽑기 = (src) => {
  const map = new Map()
  let cur = null
  for (const line of src.split('\n')) {
    const mi = line.match(/^\s*id:\s*'([^']+)'/)
    if (mi) { cur = mi[1]; continue }
    const mc = line.match(/^\s*icon:\s*'([^']+)'/)
    if (mc && cur) map.set(cur, mc[1])
  }
  return map
}

const commits = git('log', '--format=%H %ad', '--date=format:%Y-%m-%d', '--', FILE).trim().split('\n')
  .map((l) => { const [h, d] = l.split(' '); return { h, d } })

const 지금 = 뽑기(git('show', `${commits[0].h}:${FILE}`))
const 역대 = new Map()   // id → Map(icon → 마지막으로 쓰인 날)
for (const c of commits) {
  let m
  try { m = 뽑기(git('show', `${c.h}:${FILE}`)) } catch { continue }
  for (const [id, icon] of m) {
    if (!역대.has(id)) 역대.set(id, new Map())
    const t = 역대.get(id)
    if (!t.has(icon)) t.set(icon, c.d)   // 최신 커밋부터 도니 처음 본 날이 «마지막으로 쓰인 날»
  }
}

console.log(`📚 basics.js 커밋 ${commits.length}판 (${commits[commits.length - 1].d} ~ ${commits[0].d})`)
console.log(`🍳 레시피 ${지금.size}편 · 역대 등장 ${역대.size}편\n`)

const 낡은키 = new Map()   // 옛 icon → [{id, 지금키, 마지막날}]
for (const [id, t] of 역대) {
  const now = 지금.get(id)
  for (const [icon, day] of t) {
    if (!now || icon === now) continue
    if (!낡은키.has(icon)) 낡은키.set(icon, [])
    낡은키.get(icon).push({ id, now, day })
  }
}

const 줄 = [...낡은키].sort((a, b) => b[1].length - a[1].length)
console.log(`⚠️ 「폰에 박혀 있을 수 있는 옛 키」 = ${줄.length}개 · 걸린 레시피 ${new Set([...낡은키.values()].flat().map((x) => x.id)).size}편\n`)
for (const [icon, rows] of 줄) {
  const r = rows.slice(0, 3).map((x) => `${x.id}→${x.now}`).join(' · ')
  console.log(`  ${icon.padEnd(12)} ${String(rows.length).padStart(2)}편  마지막 ${rows[0].day}   ${r}${rows.length > 3 ? ` 외 ${rows.length - 3}` : ''}`)
}

// 이미 손댄 것과 대조 — ⛔여기 없는 것이 «아직 안 고쳐진» 자리다
// ⛔⛔ 첫 판이 여기서 «아무것도 안 재고» 초록불을 냈다(규칙 18 ⓘ) —
//    따옴표 붙은 것만 세는 바람에 표의 **출발지 키**(`fh_k13: 'gr_387'` 처럼 따옴표가 없다)를 통째로 놓쳤다.
//    그래서 「아무도 안 맡은 키」가 실제보다 훨씬 많게 나왔다. ✅ 따옴표 «있든 없든» 센다.
const store = git('show', `HEAD:hankki/src/store.jsx`)
const 이미 = new Set([
  ...[...store.matchAll(/'([a-z]{2,3}_[A-Za-z0-9_]+)'/g)].map((m) => m[1]),
  ...[...store.matchAll(/(?:^|[\s{,])([a-z]{2,3}_[A-Za-z0-9_]+)\s*:/gm)].map((m) => m[1]),
])
const 남은 = 줄.map(([k]) => k).filter((k) => !이미.has(k))
console.log(`\n🧹 store.jsx 마이그레이션이 «이미 맡은» 키 = ${줄.filter(([k]) => 이미.has(k)).length}개`)
console.log(`🚨 아직 «아무도 안 맡은» 옛 키 = ${남은.length}개`)
console.log(`   ${남은.join(' ')}`)
