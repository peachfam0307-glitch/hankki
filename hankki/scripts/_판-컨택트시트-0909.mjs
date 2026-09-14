// 🖼 아무 컷 목록이나 «한 장으로» 붙여 보는 판 (2026-09-09 신설)
//
// 📮 왜 = 2026-09-09 에 「명란 바지락 파스타」에 만화체 옛 컷(fe_188)이 붙어 나갔다.
//    비교하려면 파스타 컷을 «나란히» 봐야 했는데, 그때마다 판을 새로 짜고 있었다.
//    `_판-카와이431-0905.mjs` 는 431장 목록이 박혀 있어 다른 목록엔 못 쓴다 → 목록을 받는 판으로 뺐다.
//
// 쓰는 법  node scripts/_판-컨택트시트-0909.mjs <나올자리> <id,쉼표,목록> "<제목>" [열수=5]
// ⛔ setContent 는 file:// 그림을 «안 싣는다» — 파일로 써서 연다(0905 에 빈 칸 431개가 났던 자리다).
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
const APP = resolve(new URL('..', import.meta.url).pathname)   // ⛔ 내 컨테이너 경로를 박지 않는다(2026-09-04 에 배포가 죽은 자리)
const OUT = process.argv[2]
const ids = process.argv[3].split(',')
const 제목 = process.argv[4] || ''
const 열 = Number(process.argv[5] || 5), 칸 = 150
mkdirSync(OUT, { recursive: true })
const html = `<body style="margin:12px;background:#fff;font:12px/1.3 sans-serif">
<div style="font-size:15px;margin-bottom:8px">${제목}</div>
<div style="display:grid;grid-template-columns:repeat(${열},${칸}px);gap:8px">
${ids.map(id=>`<div style="text-align:center"><img src="file://${join(APP,'src/assets/stickers/photo',id+'.png')}" style="width:${칸-8}px;height:${칸-8}px;object-fit:contain;background:#f6f2ea;border-radius:8px;display:block"><span>${id}</span></div>`).join('')}
</div></body>`
const p = join(OUT,'sheet.html'); writeFileSync(p, html)
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport:{width:열*(칸+8)+40,height:600}, deviceScaleFactor:1 })
await page.goto('file://'+p); await page.waitForLoadState('networkidle')
await page.screenshot({ path: join(OUT,'sheet.png'), fullPage: true })
await b.close(); console.log('ok', join(OUT,'sheet.png'))
