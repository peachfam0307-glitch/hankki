// 🔬 「열쇠 없는 쪽(tesseract)」이 얼마나 읽나 — 앱과 «같은 다듬기»로 잰다
//
// 📮 창업자 = *"열쇠 없음 tesseract 내 규칙 이거는 어느정도 인식률이 돼?"*
//    → *"초창기에 해봤는데 좀 이상하긴해도 나름 나쁘지 않았거든"*
//    → *"나는 무료인식이 아예 안돼. 설정을 내꺼는 무료끝나도 AI되게 만들어놔서"*
//
// ⛔ 창업자 폰은 «운영자 모드»라 tesseract 로 안 떨어진다 → 창업자가 직접 못 잰다.
//    ⛔ 운영자 모드를 껐다 켜는 건 위험하다(다시 켜려면 비밀 주소가 필요하다).
//    ✅ 그래서 창업자가 캡처만 주고 여기서 잰다.
//
// ⭐⭐ 절대원칙 30 — 「판이 앱을 흉내 내면 조용히 어긋난다」
//    그래서 다듬기 코드를 «손으로 옮겨 적지 않고» src/ocr.js 에서 «그대로 뽑아» 브라우저에 주입한다.
//    → 앱이 고쳐지면 이 판도 저절로 같이 바뀐다.
//
// 쓰기 = node scripts/_판-무료인식-0829.mjs <이미지…>
//   결과 = scratchpad 에 다듬은 PNG · 콘솔에 읽은 글자
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const 원본들 = process.argv.slice(2)
if (!원본들.length) { console.error('⛔ 이미지 경로를 달라'); process.exit(1) }

// ── src/ocr.js 에서 다듬기 함수 셋을 «그대로» 뽑는다 ──
const src = fs.readFileSync(new URL('../src/ocr.js', import.meta.url), 'utf8')
function 함수뽑기(이름) {
  const 시작 = src.indexOf(`function ${이름}(`)
  if (시작 < 0) throw new Error(`⛔ ${이름} 을 못 찾았다 — ocr.js 가 바뀌었나`)
  // 중괄호 세어 함수 끝을 찾는다
  let i = src.indexOf('{', 시작), 깊이 = 0
  for (; i < src.length; i++) {
    if (src[i] === '{') 깊이++
    else if (src[i] === '}') { 깊이--; if (깊이 === 0) break }
  }
  return src.slice(시작, i + 1)
}
const 주입 = [함수뽑기('screenshotCrop'), 함수뽑기('bradleyThreshold'), 함수뽑기('preprocess')].join('\n\n')
console.log(`✅ ocr.js 에서 다듬기 코드 ${주입.length}자를 그대로 뽑았다 (흉내가 아니다)`)

const 낼곳 = process.env.OUT || '/tmp/무료인식'
fs.mkdirSync(낼곳, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage()
await page.addScriptTag({ content: 주입 })

for (const 원본 of 원본들) {
  const b64 = fs.readFileSync(원본).toString('base64')
  const 확장 = path.extname(원본).slice(1) || 'png'
  const dataUrl = `data:image/${확장};base64,${b64}`
  const 결과 = await page.evaluate(async (u) => {
    const r = await preprocess(u)              // ⭐ 앱과 같은 기본값(mode 'global')
    return { url: r.url, inverted: r.inverted }
  }, dataUrl)
  const 낼 = path.join(낼곳, path.basename(원본).replace(/\.\w+$/, '') + '-다듬음.png')
  fs.writeFileSync(낼, Buffer.from(결과.url.split(',')[1], 'base64'))
  console.log(`📄 ${path.basename(원본)} → ${낼}  (반전=${결과.inverted})`)
}
await browser.close()
console.log('\n⏭ 이제 이 PNG 들을 tesseract 에 넣는다.')

// ── 2단계·3단계도 «같은 파일»에 둔다 ──────────────────────────────
// ⛔ 2026-08-29 에 이 둘을 /tmp 에 흩어 뒀다가 정리하며 잃을 뻔했다.
//    📌 CLAUDE.md = *"임시 자리에 두면 세션이 날아갈 때 같이 날아가고 다음에 또 처음부터 한다."*
//
// 쓰기 = node scripts/_판-무료인식-0829.mjs --읽기 <다듬은PNG…>
//   ⭐ 언어팩이 없으면 먼저 받는다(이 컨테이너는 tessdata.projectnaptha.com 이 막혀 GitHub raw 로):
//      mkdir -p /tmp/tess && cd /tmp/tess
//      curl -sSL -o kor.traineddata.gz https://raw.githubusercontent.com/naptha/tessdata/gh-pages/4.0.0/kor.traineddata.gz
//      curl -sSL -o eng.traineddata.gz https://raw.githubusercontent.com/naptha/tessdata/gh-pages/4.0.0/eng.traineddata.gz
//      gunzip -kf kor.traineddata.gz eng.traineddata.gz
//   ⚠️ 한 장에 3~6분 걸린다. 여러 장이면 배경으로 돌릴 것.
