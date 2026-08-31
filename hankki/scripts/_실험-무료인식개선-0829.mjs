// 🧪 「열쇠 없는 쪽」을 더 낫게 만들 수 있나 — 다듬기 갈래를 나란히 재는 판
//   📮 창업자 = *"이걸 네가 좀더 향상시킬수있어?"*
// ⭐ 앱 코드(src/ocr.js)의 preprocess 를 «그대로» 쓰되, 인자만 바꿔 견준다(절대원칙 30).
//   ⓐ 지금 그대로(global)  ⓑ 2배로 키워서(global)  ⓒ adaptive
//   🔢 왜 ⓑ 인가 = 앱은 «1500px 미만»일 때만 최대 3배 키운다.
//      창업자 캡처는 1958px 이라 «한 번도 안 키워졌다». tesseract 는 글자가 클수록 잘 읽는다.
// 쓰기 = node scripts/_실험-무료인식개선-0829.mjs <원본이미지>
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const 원본 = process.argv[2]
if (!원본) { console.error('⛔ 이미지 경로를 달라'); process.exit(1) }

const src = fs.readFileSync(new URL('../src/ocr.js', import.meta.url), 'utf8')
function 함수뽑기(이름) {
  const s = src.indexOf(`function ${이름}(`)
  if (s < 0) throw new Error(`⛔ ${이름} 을 못 찾았다`)
  let i = src.indexOf('{', s), d = 0
  for (; i < src.length; i++) { if (src[i] === '{') d++; else if (src[i] === '}') { d--; if (!d) break } }
  return src.slice(s, i + 1)
}
const 주입 = ['screenshotCrop', 'bradleyThreshold', 'preprocess'].map(함수뽑기).join('\n\n')

const 낼곳 = '/tmp/무료인식-실험'
fs.mkdirSync(낼곳, { recursive: true })
const b64 = fs.readFileSync(원본).toString('base64')
const dataUrl = `data:image/${path.extname(원본).slice(1) || 'png'};base64,${b64}`

const browser = await chromium.launch()
const page = await browser.newPage()
await page.addScriptTag({ content: 주입 })

// ⓑ 는 preprocess «전»에 원본을 2배로 키운다 — 그러면 앱의 「1500 미만이면 확대」 규칙이 안 걸리고
//    우리가 준 큰 그림을 그대로 다듬는다(2400 상한에 걸려 되레 줄지 않게 상한도 함께 본다).
const 갈래 = [
  ['a-지금그대로', `await preprocess(U)`],
  ['b-2배확대', `await preprocess(await 두배(U))`],
  ['c-adaptive', `await preprocess(U, undefined, false, 'adaptive')`],
]
await page.evaluate(() => {
  window.두배 = (u) => new Promise((res) => {
    const im = new Image()
    im.onload = () => {
      const c = document.createElement('canvas')
      c.width = im.width * 2; c.height = im.height * 2
      const x = c.getContext('2d')
      x.imageSmoothingQuality = 'high'
      x.drawImage(im, 0, 0, c.width, c.height)
      res(c.toDataURL('image/png'))
    }
    im.src = u
  })
})
for (const [이름, 식] of 갈래) {
  const r = await page.evaluate(async ({ U, code }) => {
    const f = new Function('U', 'preprocess', '두배', `return (async()=>{ return ${code} })()`)
    return await f(U, preprocess, window.두배)
  }, { U: dataUrl, code: 식 })
  const 낼 = path.join(낼곳, `${이름}.png`)
  fs.writeFileSync(낼, Buffer.from(r.url.split(',')[1], 'base64'))
  const sz = fs.statSync(낼).size
  console.log(`📄 ${이름} → ${낼}  (${(sz / 1024 | 0)}KB · 반전=${r.inverted})`)
}
await browser.close()
console.log('\n⏭ node scripts/_판-무료인식읽기-0829.mjs /tmp/무료인식-실험/*.png')
