#!/usr/bin/env node
// 📅🔒 식비 «달 구간·주 구간»에 구멍이 없나 — 2026-09-20 (창업자 「구멍이 전혀 없다는 거야?」)
//   ⭐ 잣대 = 어떤 날짜든 «딱 한» 구간에 들어간다(빠짐 0 · 겹침 0).
//      달 = 시작일 1~28 × 2년치(731일) · 주 = 시작 요일 일~토 × 731일.
//   ⭐ 함수는 FoodCostView.jsx 에서 «글자 그대로» 뽑아 쓴다 — 베끼면 둘이 갈린다(2026-09-12 사고).
//   📌 「오늘」을 안 만든다 — 2026-01-01~2027-12-31 «박힌» 날짜를 돈다(kst-allow 에 이유 있음).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
const R = new URL('..', import.meta.url).pathname
const src = readFileSync(join(R, 'src/screens/FoodCostView.jsx'), 'utf8')
const 뽑기 = (이름) => { const m = new RegExp(`(?:function ${이름}\\([^\\n]*\\) \\{[\\s\\S]*?\\n\\}|const ${이름} = [^\\n]+)`).exec(src); if (!m) { console.error('⛔ 못 뽑았다', 이름); process.exit(1) } return m[0] }
const 앱 = new Function(`const 오늘 = () => '2026-09-20'\n${뽑기('두자리')}\n${뽑기('달첫날')}\n${뽑기('달끝날')}\n${뽑기('며칠뒤')}\n${뽑기('주의첫날')}\nreturn { 달첫날, 달끝날, 며칠뒤, 주의첫날 }`)()
let 나쁨 = 0
const 날들 = []; for (let t = Date.UTC(2026, 0, 1); t <= Date.UTC(2027, 11, 31); t += 86400000) 날들.push(new Date(t).toISOString().slice(0, 10))

// 구간 목록이 끊김·겹침 없이 한 줄로 이어지나
const 이어지나 = (줄) => { let 빠짐 = 0, 겹침 = 0; for (let i = 1; i < 줄.length; i++) { const 다음날 = 앱.며칠뒤(줄[i - 1].split('~')[1], 1), 뒤첫 = 줄[i].split('~')[0]; if (다음날 < 뒤첫) 빠짐++; if (다음날 > 뒤첫) 겹침++ } return { 빠짐, 겹침 } }

console.log('\n📅 달 — 시작일 1~28')
for (let s = 1; s <= 28; s++) {
  const 구간 = new Set(); let 안맞음 = 0
  for (const d of 날들) { const 첫 = 앱.달첫날(d, s), 끝 = 앱.달끝날(첫); if (!(첫 <= d && d <= 끝)) 안맞음++; if (첫.slice(8) !== String(s).padStart(2, '0')) 안맞음++; 구간.add(첫 + '~' + 끝) }
  const 줄 = [...구간].sort(); const { 빠짐, 겹침 } = 이어지나(줄)
  const 참 = !안맞음 && !빠짐 && !겹침; if (!참) 나쁨++
  if (!참 || s === 1 || s === 13 || s === 28) console.log(`  ${참 ? '✅' : '⛔'} 시작일 ${String(s).padStart(2)} · 구간 ${줄.length}개 · 빠짐 ${빠짐} · 겹침 ${겹침} · 안맞음 ${안맞음}   예) ${줄[8]}`)
}

console.log('\n📅 주 — 시작 요일 일~토 (늘 7일)')
for (let w = 0; w <= 6; w++) {
  const 주 = new Set(); let 안맞음 = 0
  for (const d of 날들) { const 첫 = 앱.주의첫날(d, w), 끝 = 앱.며칠뒤(첫, 6); if (!(첫 <= d && d <= 끝)) 안맞음++; if (new Date(첫 + 'T00:00:00Z').getUTCDay() !== w) 안맞음++; 주.add(첫 + '~' + 끝) }
  const 줄 = [...주].sort(); const { 빠짐, 겹침 } = 이어지나(줄)
  const 참 = !안맞음 && !빠짐 && !겹침; if (!참) 나쁨++
  if (!참 || w === 1 || w === 6) console.log(`  ${참 ? '✅' : '⛔'} 주 시작 ${'일월화수목금토'[w]} · 주 ${줄.length}개 · 빠짐 ${빠짐} · 겹침 ${겹침} · 안맞음 ${안맞음}   예) ${줄[37]}`)
}

// 못 고르는 값은 store 가 막는다 — 달 29~31(2월에 없다) · 주 0~6 밖
const store = readFileSync(join(R, 'src/store.jsx'), 'utf8')
const 달막나 = /if \(n < 1 \|\| n > 28\) return state/.test(store); if (!달막나) 나쁨++
const 주막나 = /if \(!\(n >= 0 && n <= 6\)\) return state/.test(store); if (!주막나) 나쁨++
console.log(`\n  ${달막나 ? '✅' : '⛔'} 달 29~31 은 store 가 안 받는다 · ${주막나 ? '✅' : '⛔'} 주 0~6 밖은 store 가 안 받는다`)
console.log(나쁨 ? `\n⛔ ${나쁨}개 틀렸다` : '\n✅ 달 시작일 1~28 · 주 시작 요일 7 × 731일 전부 «딱 한 구간» — 빠짐 0 · 겹침 0')
process.exit(나쁨 ? 1 : 0)
