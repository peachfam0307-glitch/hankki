// 🎞 인스타 프레임 뽑기 — 오버레이(투명 배경) ＋ 아웃트로(불투명)
// ⭐ 글자를 «AI가 그리는 게» 아니라 우리 글꼴(Jua)로 진짜 렌더한다 → 오타가 물리적으로 안 난다(「추섴」 전례)
//
//   node scripts/_promo-frames.mjs <작업폴더> [html파일이름]
//
// html 안의 `.stage` 를 전부 훑어 «id 그대로» png 로 뽑는다.
// ⚠️ 투명 여부는 요소의 «실제 배경색»으로 정한다 — 이름 규칙에 기대지 않는다.
//    (전에 body 에 배경이 깔려 있어 투명이 안 나온 적이 있다)
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const S = process.argv[2]
const NAME = process.argv[3] || 'video-frames.html'
const html = readFileSync(`${S}/${NAME}`, 'utf8')

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const page = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })
await page.setContent(`<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`)
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(600)

const stages = await page.evaluate(() =>
  [...document.querySelectorAll('.stage')].map((el) => {
    const bg = getComputedStyle(el).backgroundColor
    const img = getComputedStyle(el).backgroundImage
    const clear = (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') && img === 'none'
    const r = el.getBoundingClientRect()
    return { id: el.id, clear, w: Math.round(r.width), h: Math.round(r.height) }
  })
)
if (!stages.length) { console.error('❌ .stage 가 하나도 없다'); process.exit(1) }

for (const s of stages) {
  const el = await page.$(`#${s.id}`)
  await el.scrollIntoViewIfNeeded()
  await el.screenshot({ path: `${S}/${s.id}.png`, omitBackground: s.clear })
  console.log(`  ${s.id}.png  ${s.w}×${s.h}  ${s.clear ? '투명(영상이 비친다)' : '불투명'}`)
}
console.log(`✅ ${stages.length}장`)
await b.close()
