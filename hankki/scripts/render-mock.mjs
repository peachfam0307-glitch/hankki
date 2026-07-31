#!/usr/bin/env node
/**
 * 🖼 시안 렌더 — HTML 목업을 진짜 브라우저로 찍어서 그림으로 뽑는다.
 *
 * 왜 필요한가 (2026-07-31 여름 배경 고를 때):
 *   배경·질감·그라데이션은 **CSS로 만드는데** 파이썬으로 흉내 내 그리면
 *   실제 앱과 다르게 나온다. 창업자에게 보여준 시안과 앱 화면이 다르면 판단이 헛돈다.
 *   → 같은 CSS를 **같은 브라우저(Chromium)** 로 찍어서 보여준다.
 *
 * 쓰기:
 *   SMOKE_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
 *   node scripts/render-mock.mjs <목업.html> <낼그림.png> [폭] [높이]
 *
 * 🎞 움직이는 시안 = `--frames N <낼폴더>`
 *   목업이 `window.setPhase(t)` 를 만들어두면 t=0…1 을 N등분해 프레임을 찍는다.
 *   ⭐ **t=1 이 t=0 과 같아지게** 만들어야 이음매 없이 도는 GIF가 된다.
 *   왜 필요한가 = *"이거 움직이는거 맞아?"* — **정지 그림으로는 움직임을 판단할 수 없다.**
 *
 * ⚠️ 이 파일은 `npm run smoke` 체인에 넣지 않는다 — 게이트가 아니라 **시안 도구**다.
 *    (시끄러운 게이트는 아무도 안 본다 — 같은 이유로 검사와 도구를 섞지 않는다.)
 */
import { chromium } from 'playwright'

const argv = process.argv.slice(2)
const fi = argv.indexOf('--frames')
const frames = fi >= 0 ? Number(argv[fi + 1]) : 0
const rest = fi >= 0 ? argv.slice(0, fi) : argv
const [html, out, w = '1360', h = '1150'] = rest
if (!html || !out) {
  console.log('쓰기: node scripts/render-mock.mjs <목업.html> <낼그림.png> [폭] [높이]')
  process.exit(1)
}
const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const page = await browser.newPage({
  viewport: { width: Number(w), height: Number(h) },
  deviceScaleFactor: 2,          // 폰처럼 고DPR로 찍어야 선·글자가 실제처럼 보인다
})
await page.goto('file://' + html)
await page.waitForTimeout(500)   // 폰트·이미지 로드 여유

if (frames > 0) {
  const { mkdirSync } = await import('node:fs')
  mkdirSync(out, { recursive: true })
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.setPhase(t), i / frames)
    await page.screenshot({ path: `${out}/f${String(i).padStart(3, '0')}.png` })
  }
  console.log(`${out} 에 ${frames}장 저장`)
} else {
  await page.screenshot({ path: out, fullPage: true })
  console.log(`${out} 저장`)
}
await browser.close()
