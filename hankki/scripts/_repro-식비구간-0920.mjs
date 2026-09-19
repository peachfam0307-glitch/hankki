#!/usr/bin/env node
// 📅🔒 식비 «달 구간»에 구멍이 없나 — 2026-09-20 (창업자 「구멍이 전혀 없다는 거야?」)
//   ⭐ 잣대 = 어떤 날짜든 «딱 한» 구간에 들어간다(빠짐 0 · 겹침 0). 시작일 1~28 × 2년치(731일) 전부 돈다.
//   ⭐ 함수는 FoodCostView.jsx 에서 «글자 그대로» 뽑아 쓴다 — 베끼면 둘이 갈린다(2026-09-12 사고).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
const src = readFileSync(join(new URL('..', import.meta.url).pathname, 'src/screens/FoodCostView.jsx'), 'utf8')
const 뽑기 = (이름) => { const m = new RegExp(`(?:function ${이름}\\([^)]*\\) \\{[\\s\\S]*?\\n\\}|const ${이름} = [^\\n]+)`).exec(src); if (!m) { console.error('⛔ 못 뽑았다', 이름); process.exit(1) } return m[0] }
const { 달첫날, 달끝날 } = new Function(`${뽑기('두자리')}\n${뽑기('달첫날')}\n${뽑기('달끝날')}\nreturn { 달첫날, 달끝날 }`)()
let 나쁨 = 0
const 날들 = []; for (let t = Date.UTC(2026, 0, 1); t <= Date.UTC(2027, 11, 31); t += 86400000) 날들.push(new Date(t).toISOString().slice(0, 10))
for (let s = 1; s <= 28; s++) {
  const 구간 = new Set(); let 빠짐 = 0, 겹침 = 0, 안맞음 = 0
  for (const d of 날들) {
    const 첫 = 달첫날(d, s), 끝 = 달끝날(첫)
    if (!(첫 <= d && d <= 끝)) 안맞음++            // 그 날이 자기 구간 안에 있나
    if (첫.slice(8) !== String(s).padStart(2, '0')) 안맞음++   // 첫날의 «일»이 시작일인가
    구간.add(첫 + '~' + 끝)
  }
  // 구간들을 이어 붙이면 끊김·겹침 없이 한 줄이 되나
  const 줄 = [...구간].sort()
  for (let i = 1; i < 줄.length; i++) { const 앞끝 = 줄[i - 1].split('~')[1], 뒤첫 = 줄[i].split('~')[0]; const 다음날 = new Date(new Date(앞끝 + 'T00:00:00Z').getTime() + 86400000).toISOString().slice(0, 10); if (다음날 < 뒤첫) 빠짐++; if (다음날 > 뒤첫) 겹침++ }
  const 참 = !안맞음 && !빠짐 && !겹침
  if (!참) 나쁨++
  if (!참 || s === 1 || s === 13 || s === 28) console.log(`  ${참 ? '✅' : '⛔'} 시작일 ${String(s).padStart(2)} · 구간 ${줄.length}개 · 빠짐 ${빠짐} · 겹침 ${겹침} · 안맞음 ${안맞음}   예) ${줄[8]}`)
}
// 29~31 은 못 고른다 (store 가 막는다)
const store = readFileSync(join(new URL('..', import.meta.url).pathname, 'src/store.jsx'), 'utf8')
const 막나 = /if \(n < 1 \|\| n > 28\) return state/.test(store); if (!막나) 나쁨++
console.log(`  ${막나 ? '✅' : '⛔'} 29~31 은 store 가 안 받는다 (2월에 없는 날)`)
console.log(나쁨 ? `\n⛔ ${나쁨}개 틀렸다` : '\n✅ 시작일 1~28 × 731일 전부 «딱 한 구간» — 빠짐 0 · 겹침 0')
process.exit(나쁨 ? 1 : 0)
