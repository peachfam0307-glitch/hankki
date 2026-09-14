// 🎬 프로모 프레임 뽑기 — HTML 의 `.stage` 를 id 그대로 PNG 로
//
// ⛔⛔ 이 도구는 «저장소에» 둔다. 2026-08-05 에 만든 판이 scratchpad 에 있어서
//    세션과 함께 날아갔고, 2026-08-26 에 영상 문구를 고치려다 처음부터 다시 만들었다.
//    📌 임시 자리에 두면 다음 사람이 또 만든다(자르기 도구 때와 같은 교훈).
//
// 쓰는 법
//   cd /home/user/hankki/hankki
//   node scripts/_promo-frames.mjs design/promo/인스타-2508 video-frames-4대5-3대4-정사각.html
//   node scripts/_promo-frames.mjs design/promo/인스타-2508 video-frames.html o916   ← 특정 id 만
//
// ⭐ 투명 여부는 «요소의 실제 배경색»으로 판단한다 — 이름 규칙에 기대지 않는다.
//    (전에 body 에 배경이 깔려 있어 투명이 안 나온 적이 있다)
// 🏷 이름표 = 살아있는 도구
import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'

const [폴더, 파일, 만찍을것] = process.argv.slice(2)
if (!폴더 || !파일) {
  console.error('쓰는 법: node scripts/_promo-frames.mjs <폴더> <html> [id]')
  process.exit(1)
}
const 앱 = path.dirname(path.dirname(new URL(import.meta.url).pathname))
const 뿌리 = path.isAbsolute(폴더) ? 폴더 : path.join(앱, 폴더)
const html = path.join(뿌리, 파일)
if (!fs.existsSync(html)) { console.error(`⛔ 없다: ${html}`); process.exit(1) }

const 크로뮴 = process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium/chrome-linux/chrome'
const 옵션 = fs.existsSync(크로뮴) ? { executablePath: 크로뮴 } : {}
const browser = await chromium.launch(옵션)
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 })
await page.goto('file://' + html, { waitUntil: 'load' })
await page.waitForTimeout(600)   // 글꼴(base64) 이 앉을 시간

const 칸들 = await page.$$('.stage')
console.log(`${파일} — .stage ${칸들.length}개`)
let 뽑음 = 0
for (const el of 칸들) {
  const id = await el.getAttribute('id')
  if (!id) continue
  if (만찍을것 && id !== 만찍을것) continue
  // ⭐ 배경이 «투명»인지 실제 계산값으로 본다
  const 투명 = await el.evaluate((n) => {
    const bg = getComputedStyle(n).backgroundColor
    return bg === 'transparent' || /rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(bg)
  })
  const out = path.join(뿌리, `${id}.png`)
  await el.screenshot({ path: out, omitBackground: 투명 })
  const box = await el.boundingBox()
  console.log(`  ${id}.png  ${Math.round(box.width)}×${Math.round(box.height)}  ${투명 ? '투명' : '불투명'}`)
  뽑음++
}
await browser.close()
console.log(뽑음 ? `✅ ${뽑음}장` : '⛔ 한 장도 안 뽑혔다 — id 를 확인할 것')
