// 🧪 adaptive 다듬기를 «네 장 전부»에 적용해 지금(global)과 견준다
//   ⛔ 한 장(골쫄면)에서 adaptive 가 이겼다고 바로 바꾸지 않는다 —
//      이미 «잘 나오던» 부대찌개·탕수육이 나빠질 수 있다(규칙 18).
// 쓰기 = node scripts/_실험-adaptive전수-0829.mjs <원본…>
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
const 원본들 = process.argv.slice(2)
const src = fs.readFileSync(new URL('../src/ocr.js', import.meta.url), 'utf8')
function 함수뽑기(이름) {
  const s = src.indexOf(`function ${이름}(`); if (s < 0) throw new Error(이름)
  let i = src.indexOf('{', s), d = 0
  for (; i < src.length; i++) { if (src[i] === '{') d++; else if (src[i] === '}') { d--; if (!d) break } }
  return src.slice(s, i + 1)
}
const 주입 = ['screenshotCrop', 'bradleyThreshold', 'preprocess'].map(함수뽑기).join('\n\n')
const 낼곳 = '/tmp/무료인식-adaptive'; fs.mkdirSync(낼곳, { recursive: true })
const browser = await chromium.launch(); const page = await browser.newPage()
await page.addScriptTag({ content: 주입 })
for (const o of 원본들) {
  const u = `data:image/${path.extname(o).slice(1)};base64,${fs.readFileSync(o).toString('base64')}`
  const r = await page.evaluate((U) => preprocess(U, undefined, false, 'adaptive'), u)
  const 낼 = path.join(낼곳, path.basename(o).replace(/\.\w+$/, '') + '.png')
  fs.writeFileSync(낼, Buffer.from(r.url.split(',')[1], 'base64'))
  console.log('📄', 낼)
}
await browser.close()
