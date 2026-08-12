// 🔠 글자가 «그림 안에» 박힌 그룹에 `wordy: true` 를 단다 — 창업자 확정 Ⓑ(88px) 2026-08-12
//
// 📮 *"레꾸 글자에 한끼문구~건강태그까지 글자가 너무 작아서 (그림도) 잘 안보여."* → *"나도b가 좋아"*
//
// ⭐ 왜 접두어(`tw_`·`rs_`)로 판단하지 않나 = CLAUDE.md 원칙 —
//    「이름 규칙·표시용 라벨로 분류하지 말고, 데이터에 표시를 단다.」
//    나중에 글자 박힌 그룹이 늘면 `wordy: true` 한 줄만 붙이면 된다.
// ⛔ `text_num`(요일·라벨)은 «건강 태그 뒤»라 창업자가 짚은 범위 밖이다. 넓히지 않는다.
import { readFileSync, writeFileSync } from 'node:fs'

const 파일 = 'src/components/Stickers.jsx'
const 대상 = ['text_hankki', 'text_word', 'rs_taste', 'rs_react', 'rs_cook',
              'rs_scene', 'rs_meal', 'rs_prep', 'rs_store', 'rs_health']

let s = readFileSync(파일, 'utf8')
let 붙임 = 0, 이미 = 0
for (const key of 대상) {
  const re = new RegExp(`(\\{ key: '${key}', tab: 'notetext')(, wordy: true)?`, 'g')
  const m = s.match(re)
  if (!m) { console.log(`⛔ 못 찾음 — ${key}`); continue }
  if (m[0].includes('wordy')) { 이미++; continue }         // ⭐ 멱등 — 두 번 돌려도 안 죽는다
  s = s.replace(re, `$1, wordy: true`)
  붙임++
}
if (붙임) writeFileSync(파일, s)
console.log(`✅ wordy 표시 — 새로 ${붙임}개 · 이미 있던 것 ${이미}개 / 대상 ${대상.length}개`)

// 🔢 컷 수를 세어 확인 (짐작하지 않는다)
const 셈 = 대상.reduce((a, key) => {
  const m = s.match(new RegExp(`\\{ key: '${key}',[^\\n]*?items: \\[([^\\]]*)\\]`))
  return a + (m ? (m[1].match(/'[^']+'/g) || []).length : 0)
}, 0)
console.log(`   → ${대상.length}그룹 ${셈}컷 이 큰 칸으로 뜬다`)
