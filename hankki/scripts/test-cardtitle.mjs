// 🎴 카드 제목 줄나눔·크기 테스트
//
// 왜 생겼나(2026-07-29): 창업자 폰 제보 — 본인이 추가한 "교촌허니콤보"가
// 카드에서 **"교촌허 / 니콤보"** 로 나왔다. 띄어쓰기가 없으면 글자 수를 반으로 잘랐기 때문.
// 한글은 낱말 경계를 코드가 알 수 없으니 **안 쪼개고 한 줄로 두고 글자를 줄이는** 게 맞다.
//
// ⚠️ `splitTitle`/`headSize`는 ShareDrawCard.jsx에서 **소스를 직접 읽어** 평가한다.
//    (JSX 파일이라 import가 안 되므로. 함수 본문이 바뀌면 이 테스트가 같이 따라간다.)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = fs.readFileSync(path.join(root, 'src/components/ShareDrawCard.jsx'), 'utf8')

const grab = (startMark, endMark) => {
  const i = src.indexOf(startMark)
  if (i < 0) throw new Error(`소스에서 못 찾음: ${startMark}`)
  const j = src.indexOf(endMark, i)
  return src.slice(i, j + endMark.length)
}
const code = 'const PAD = 64\n'
  + grab('function splitTitle(t) {', '\n}')
  + '\n'
  + grab('const headSize = (lines', '\n}')
  + '\nreturn { splitTitle, headSize }'
// eslint-disable-next-line no-new-func
const { splitTitle, headSize } = new Function(code)()

let fail = 0
const ok = (cond, msg, extra = '') => {
  console.log(`  ${cond ? 'ok ' : '❌ '} ${msg}${extra ? `  ${extra}` : ''}`)
  if (!cond) fail++
}

console.log('\n── ① 띄어쓰기 없는 제목은 쪼개지 않는다 (창업자 제보) ──')
for (const t of ['교촌허니콤보', '떡볶이', '소고기무국', '알리오올리오파스타']) {
  const [a, b] = splitTitle(t)
  ok(a === t && b === '', `"${t}" → 한 줄`, `["${a}"${b ? `, "${b}"` : ''}]`)
}

console.log('\n── ② 띄어쓰기가 있으면 거기서 나눈다 ──')
for (const [t, e1, e2] of [['돼지고기 김치찌개', '돼지고기', '김치찌개'], ['엄마표 김밥', '엄마표', '김밥']]) {
  const [a, b] = splitTitle(t)
  ok(a === e1 && b === e2, `"${t}" → "${e1}" / "${e2}"`, `["${a}", "${b}"]`)
}

console.log('\n── ③ 제목이 칸을 넘지 않는다 ──')
// 각 카드의 (렌더되는 줄, base, 쓸 수 있는 가로폭) — ShareDrawCard의 호출부와 같은 값
const LAYOUTS = [
  ['① warm', 150, 1080 - 64 - 340, false],
  ['② panel', 128, 1080 - 128, true],
  ['③ pola', 112, 1080 - 128, true],
  ['④ mag', 116, 1080 - 128, true],
  ['⑤ summer', 138, 1080 - 64 - 330, false],
  ['⑥ night', 124, 1080 - 128, true],
]
const TITLES = ['교촌허니콤보', '떡볶이', '돼지고기 김치찌개', '소고기 미역국', '알리오올리오파스타', '새우해장파스타']
for (const [name, base, avail, oneLine] of LAYOUTS) {
  let worst = 0, worstT = ''
  for (const t of TITLES) {
    const [l1, l2] = splitTitle(t)
    const lines = oneLine ? [`${l1} ${l2}`.trim()] : [l1, l2]
    const n = Math.max(1, ...lines.map((x) => String(x || '').length))
    const w = n * (headSize(lines, base, avail) - 3)     // letterSpacing -3 보정
    if (w > worst) { worst = w; worstT = t }
  }
  ok(worst <= avail, `${name} 제일 긴 줄 ${Math.round(worst)}px ≤ 칸 ${avail}px`, `("${worstT}")`)
}

console.log('\n── ④ 큰 타이포 규칙은 지킨다 (짧은 제목이 작아지면 안 됨) ──')
ok(headSize(['떡볶이'], 150, 1080 - 64 - 340) >= 130, '3글자 제목은 130px 이상', `${headSize(['떡볶이'], 150, 1080 - 64 - 340)}px`)

console.log(fail ? `\n❌ ${fail}개 실패\n` : '\n✅ 카드 제목 테스트 전부 통과\n')
process.exit(fail ? 1 : 0)
