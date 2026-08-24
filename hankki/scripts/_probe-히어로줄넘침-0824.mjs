// 📏 「사진 · 직접 작성하기 ＋ 제일 많이 써요」 줄이 «넘치나» (창업자 제보 2026-08-24)
//
// 📮 창업자 = *"제일많이써요 그 줄 넘쳤어"*
//
// ⭐ 「넘쳤다」가 될 수 있는 것이 셋이라 셋 다 잰다 —
//    ⑴ 가로로 카드 밖으로 삐져나갔다  ⑵ 배지가 잘렸다(제 폭을 못 받았다)  ⑶ 줄이 밀려 두 줄이 됐다
//    ⛔ 하나만 재고 「멀쩡하다」고 말하지 않는다(규칙 18 — 검사가 «무엇을 보는지»).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_probe-히어로줄넘침-0824.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/히어로줄'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4424, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch()
const 잰값 = []

for (const 폭 of [320, 360, 390, 412]) {
  const ctx = await b.newContext({ viewport: { width: 폭, height: 844 }, deviceScaleFactor: 3 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch { /* noop */ } })
  const page = await ctx.newPage()
  await page.goto('http://127.0.0.1:4424/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  await page.evaluate(() => {
    const t = [...document.querySelectorAll('button, a')].find((e) => (e.getAttribute('aria-label') || e.textContent || '').trim().startsWith('가져오기'))
    t?.click()
  })
  await page.waitForTimeout(1300)

  const 값 = await page.evaluate(() => {
    const 배지 = [...document.querySelectorAll('span, div, b')]
      .find((x) => /^제일 많이 써요$/.test((x.textContent || '').trim()))
    if (!배지) return { 없다: true }
    const 제목 = [...document.querySelectorAll('div, span')]
      .find((x) => /직접 작성하기/.test(x.textContent || '')
        && /제일 많이 써요/.test(x.textContent || '')
        && ![...x.children].some((c) => /직접 작성하기/.test(c.textContent || '') && /제일 많이 써요/.test(c.textContent || '')))
    const 카드 = 배지.closest('button') || 배지.parentElement
    const rb = 배지.getBoundingClientRect()
    const rc = 카드.getBoundingClientRect()
    // 줄 수 — Range 로 그려진 줄 상자를 센다
    const 줄수 = (el) => {
      if (!el) return null
      const r = document.createRange(); r.selectNodeContents(el)
      const y = [...new Set([...r.getClientRects()].filter((x) => x.height > 4 && x.width > 1).map((x) => Math.round(x.top)))]
      return y.length
    }
    return {
      배지오른끝: Math.round(rb.right), 카드오른끝: Math.round(rc.right),
      삐짐: Math.round(rb.right - rc.right),
      배지폭: Math.round(rb.width), 배지제폭: Math.round(배지.scrollWidth),
      잘림: Math.round(배지.scrollWidth - rb.width),
      제목줄: 줄수(제목),
      제목글: (제목?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40),
      바디넘침: Math.round(document.documentElement.scrollWidth - window.innerWidth),
    }
  })
  if (값.없다) { console.log(`⛔ ${폭}px — 「제일 많이 써요」 배지를 못 찾았다`); await ctx.close(); continue }
  잰값.push({ 폭, 제목줄: 값.제목줄, 삐짐: 값.삐짐, 배지잘림: 값.잘림, 배지폭: `${값.배지폭}/${값.배지제폭}`, 가로넘침: 값.바디넘침 })
  if (폭 === 390) console.log(`  제목 줄 = 「${값.제목글}」`)
  await page.screenshot({ path: join(OUT, `${폭}.png`), clip: { x: 0, y: 250, width: 폭, height: 140 } })
  await ctx.close()
}
console.table(잰값)
// ⛔⛔ 첫 잣대가 「제목줄 > 1」을 «넘침»으로 셌다 — 틀렸다.
//    `flexWrap` 을 켜면 배지가 아랫줄로 내려가는 게 **정상 동작**이고, 그게 바로 안 잘리게 하는 방법이다.
//    ✅ 「넘침」은 «삐짐 · 잘림 · 가로넘침» 셋으로만 판정한다. 줄 수는 «정보»로만 찍는다(규칙 18 ⓘ).
const 나쁨 = 잰값.filter((v) => v.삐짐 > 0 || v.배지잘림 > 0 || v.가로넘침 > 0)
console.log(나쁨.length
  ? `⛔ 넘친 폭 ${나쁨.length}개 — ${나쁨.map((v) => v.폭).join(',')}`
  : '✅ 네 폭 모두 안 넘친다 (삐짐 0 · 잘림 0 · 가로넘침 0)')
const 두줄 = 잰값.filter((v) => (v.제목줄 || 0) > 2)
console.log(두줄.length ? `ℹ️ 배지가 아랫줄로 내려간 폭 = ${두줄.map((v) => v.폭).join(',')} (고장이 아니라 «안 잘리게» 내려간 것)` : 'ℹ️ 네 폭 모두 배지가 제목과 한 줄')
console.log(`📁 ${OUT}`)
await b.close(); srv.close()
