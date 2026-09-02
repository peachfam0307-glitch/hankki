// 🔬 다듬은 PNG 를 «앱과 같은 길»로 읽고 정리한다 (2단계·3단계)
//   ① tesseract.js (앱과 같은 판·kor+eng)  ② src/parseRecipeText() — 앱의 그 함수
// ⚠️ 흉내인 곳 하나 = 앱은 브라우저에서, 여기선 node 에서 tesseract 를 돌린다.
//    같은 라이브러리·같은 언어팩이지만 «완전히 같다»고는 말 못 한다.
// 쓰기 = node scripts/_판-무료인식읽기-0829.mjs <다듬은PNG…>
import { createWorker } from 'tesseract.js'
import { parseRecipeText } from '../src/parseRecipe.js'
import fs from 'node:fs'
import path from 'node:path'

const 그림들 = process.argv.slice(2)
if (!그림들.length) { console.error('⛔ 다듬은 PNG 경로를 달라'); process.exit(1) }
const 언어팩 = process.env.TESSDATA || '/tmp/tess'
if (!fs.existsSync(path.join(언어팩, 'kor.traineddata'))) {
  console.error(`⛔ 언어팩이 없다 — ${언어팩}/kor.traineddata · 파일 머리주석의 curl 을 먼저 돌릴 것`)
  process.exit(1)
}

const w = await createWorker('kor+eng', 1, { langPath: 언어팩, gzip: false, cachePath: 언어팩 })
for (const g of 그림들) {
  console.log(`\n=========== ${path.basename(g)} ===========`)
  const { data } = await w.recognize(g)
  const r = parseRecipeText(data.text)
  console.log('제목 :', JSON.stringify(r.title))
  console.log(`재료 ${(r.ingredients || []).length}개`)
  ;(r.ingredients || []).forEach((x, i) => console.log('  ' + (i + 1), x))
  console.log(`걸음 ${(r.steps || []).length}개`)
  ;(r.steps || []).forEach((x, i) => console.log('  ' + (i + 1), x))
}
await w.terminate()
