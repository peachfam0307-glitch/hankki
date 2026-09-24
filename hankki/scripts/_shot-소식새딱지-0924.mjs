// 📣🆕 [2026-09-24] 「한끼 소식」 새로 올라온 줄 — 시안 둘(A 딱지 · B 색) · 창업자 판정용
// 📮 창업자 2026-09-23 = *"한끼소식에 새로 올라온거는 색을 다르게 적거나 아니면 거기에 딱지를 붙이거나 하자.
//                        내용이 많아서 한눈에 보이게 하는게 좋지않을까"*
// ⛔ 앱 소스는 안 고친다 — 진짜 시트를 열고 위에 «얹어» 찍는다. 시안에선 맨 위 두 줄을 「새로」로 친다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4509, r))
const OUT = process.env.SHOT_OUT || '/tmp/소식새딱지'
mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
async function 치우기(p) {
  for (let i = 0; i < 12; i++) {
    const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first()
    if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break
    try { await 것.click({ timeout: 2000 }); await p.waitForTimeout(600) } catch { break }
  }
}
for (const 안 of ['지금', 'A-딱지', 'B-색']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'ko-KR' })
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1') } catch { /* noop */ } })
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4509/hankki/', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(2600); await 치우기(p)
  await p.getByText('한끼 소식', { exact: false }).first().click()
  await p.waitForTimeout(1500)
  await p.evaluate((안) => {
    const 머리 = [...document.querySelectorAll('span')].find((s) => s.textContent.trim() === '방금 열렸어요')
    if (!머리) return
    const 줄들 = [...머리.parentElement.nextElementSibling.children].slice(0, 2)
    for (const 줄 of 줄들) {
      const 제목 = 줄.querySelector('span[style*="font-weight: 800"]')
      if (안 === 'A-딱지' && 제목) {
        const 딱 = document.createElement('span')
        딱.textContent = '새로'
        딱.style.cssText = 'font-size:13px;font-weight:900;color:#fff;background:#e0703a;border-radius:999px;padding:1px 8px;line-height:1.5'
        제목.parentElement.prepend(딱)
      }
      if (안 === 'B-색') {
        줄.style.background = 'color-mix(in srgb, #e0703a 14%, var(--cream))'
        줄.style.boxShadow = 'inset 4px 0 0 #e0703a'
      }
    }
    머리.scrollIntoView({ block: 'start' })
  }, 안)
  await p.waitForTimeout(500)
  await p.screenshot({ path: join(OUT, `${안}.png`) })
  await ctx.close()
}
// ── [실물] 고친 뒤 — 열쇠 없음 / 처음 여는 사람 / 9/22 에 본 사람
for (const [안, 주소, 봤다] of [['실물-열쇠없음', '/hankki/', null], ['실물-처음', '/hankki/?소식새로=1', null], ['실물-0922에봄', '/hankki/?소식새로=1', '2026-09-22']]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'ko-KR' })
  await ctx.addInitScript((봤다) => { try { localStorage.setItem('hankki:nudge:cloudgate', '1'); if (봤다) localStorage.setItem('hankki:news:봤다', 봤다) } catch { /* noop */ } }, 봤다)
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4509' + encodeURI(주소), { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(2600); await 치우기(p)
  await p.getByText('한끼 소식', { exact: false }).first().click()
  await p.waitForTimeout(1500)
  const n = await p.evaluate(() => { const 머리 = [...document.querySelectorAll('span')].find((s) => s.textContent.trim() === '방금 열렸어요'); 머리?.scrollIntoView({ block: 'start' }); return document.querySelectorAll('[data-new="1"]').length })
  console.log(`${안} — 색 띠 ${n}줄`)
  await p.waitForTimeout(400)
  await p.screenshot({ path: join(OUT, `${안}.png`) })
  await ctx.close()
}
console.log(`📂 ${OUT}`)
await b.close(); srv.close()
