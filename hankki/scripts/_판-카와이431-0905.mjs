// 🍜 「음식사진 카와이컷 431장」 — 지우기 «전» 창업자가 눈으로 볼 판 (2026-09-05)
//
// 📮 창업자 = *"우리 레시피꾸미기에 들어가는 음식사진 카와이컷도 모두 폐기 삭제."*
//    → *"그냥 카와이컷이 아니라 **음식사진카와이컷만**이야. **레꾸에 들어가는**"*
// ⭐ 지울 목록 = `docs/stickers/카와이-전수판정-2026-08-31.json` 의 431장 그대로 (창업자가 8/31 에 직접 골랐다).
//    ⛔ 손으로 고르지 않는다 — 그 판정을 «보여만» 준다. 규칙 13·21.
// 📸 브라우저로 108장씩 한 장에 얹어 PNG 로 찍는다 → 4장. (PIL·sharp 가 이 환경에 없다)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'

const APP = resolve(new URL('..', import.meta.url).pathname)
const 목록 = JSON.parse(readFileSync(join(APP, 'docs/stickers/카와이-전수판정-2026-08-31.json'), 'utf8'))['카와이']
const OUT = process.argv[2] || join(APP, '..', '_판-카와이431')
mkdirSync(OUT, { recursive: true })

const 한장 = 108, 열 = 12, 칸 = 118
const CHROMIUM = process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium'   // 샌드박스 = 직접 경로 (smoke.mjs 와 같은 잣대)
const b = await chromium.launch({ executablePath: CHROMIUM })
const page = await b.newPage({ viewport: { width: 열 * 칸 + 24, height: 900 }, deviceScaleFactor: 1 })
for (let i = 0; i * 한장 < 목록.length; i++) {
  const 조각 = 목록.slice(i * 한장, (i + 1) * 한장)
  const html = `<body style="margin:12px;background:#fff;font:11px/1.2 sans-serif">
  <div style="font-size:14px;margin-bottom:8px">🍜 음식사진 카와이컷 — 지울 431장 · ${i + 1}/${Math.ceil(목록.length / 한장)} (${i * 한장 + 1}~${i * 한장 + 조각.length})</div>
  <div style="display:grid;grid-template-columns:repeat(${열},${칸 - 6}px);gap:6px">
  ${조각.map((id) => `<div style="text-align:center"><img src="file://${join(APP, 'src/assets/stickers/photo', id + '.png')}" style="width:100px;height:100px;object-fit:contain;background:#f6f2ea;border-radius:8px;display:block;margin:0 auto 2px"><span style="color:#555">${id}</span></div>`).join('')}
  </div></body>`
  // ⛔ setContent(about:blank) 는 file:// 그림을 «안 싣는다» — 첫 판이 빈 칸 431개였다(규칙 21 이 잡았다). 파일로 써서 연다.
  const htmlPath = join(OUT, `카와이431-${i + 1}.html`)
  writeFileSync(htmlPath, html)
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' })
  await page.screenshot({ path: join(OUT, `카와이431-${i + 1}.png`), fullPage: true })
  console.log(`📸 ${i + 1}: ${조각.length}장 → ${join(OUT, `카와이431-${i + 1}.png`)}`)
}
await b.close()
console.log(`\n✅ 판 ${Math.ceil(목록.length / 한장)}장 · 총 ${목록.length}컷 → ${OUT}`)
