// 🖼 가로 2단 «비율» 갈래 — 창업자 2026-08-09 *"난 b 2단이 더 보기 편한 것 같아. 비율은 지금이 몇대 몇이야?"*
//    ⭐ 숫자만 답하지 않고 **네 가지를 실물로 찍어** 고르게 한다(규칙 8 — 시행착오는 클로드가).
//    ⛔ 앱 코드는 안 건드린다 — 화면에 CSS 만 얹는다.
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R = '/home/user/hankki/hankki/', D = join(R, 'dist')
const OUT = join(R, 'docs/검수-2026-08-09-가로2단')
mkdirSync(OUT, { recursive: true })
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = M[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(D, p)) } catch { b = readFileSync(join(D, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise(r => srv.listen(4427, r))
const 판 = (pct) => `@media (orientation: landscape) and (min-width: 700px) {
  .screen { padding-left: 20px; padding-right: 12px; }
  .screen > .pad { overflow: hidden; }
  .screen > .cover-box { float: left; width: ${pct}%; max-width: none; margin: 0 20px 0 0; border-radius: 16px; overflow: hidden; }
  .screen > .cover-box + div { float: left; clear: left; width: ${pct}%; margin: 10px 20px 12px 0; padding-left: 0 !important; padding-right: 0 !important; }
}`
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
for (const pct of [32, 38, 44, 50]) {
  const page = await b.newPage({ viewport: { width: 1600, height: 900 }, timezoneId: 'Asia/Seoul', locale: 'ko-KR', deviceScaleFactor: 2 })
  await page.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1'); const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) } })
  await page.goto('http://127.0.0.1:4427/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1100)
  await page.locator('.grid-card').first().click(); await page.waitForTimeout(1300)
  await page.addStyleTag({ content: 판(pct) }); await page.waitForTimeout(700)
  const 잰 = await page.evaluate(() => {
    const cov = document.querySelector('.cover-box'), cr = cov.getBoundingClientRect()
    const pad = document.querySelector('.pad'), pr = pad.getBoundingClientRect()
    const 찾 = (re) => [...document.querySelectorAll('div, h2, h3, span')].find((x) => x.children.length === 0 && re.test((x.textContent || '').trim()))
    const 법 = 찾(/^(만드는 법|조리|순서)/)
    const 줄 = [...document.querySelectorAll('.pad li, .pad p')].length
    return { 표지: Math.round(cr.width), 글칸: Math.round(pr.width), 만드는법y: 법 ? Math.round(법.getBoundingClientRect().top) : null, 재료줄바뀜: 줄 }
  })
  console.log(`   ${pct}:${100 - pct}  표지 ${잰.표지}px · 글칸 ${잰.글칸}px · 만드는법 y=${잰.만드는법y}`)
  await page.screenshot({ path: join(OUT, `비율-${pct}대${100 - pct}.png`) })
  await page.close()
}
await b.close(); srv.close()
console.log(`\n✅ 비율 네 갈래 → ${OUT}`)
