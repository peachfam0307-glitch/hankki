// ⏱ 레시피 상세 체류 시간 — detail 과 view: 가 «어느 순서»로 찍히나 재현 (2026-10-19 · 창업자 「상세 시간 고쳐줘」)
// 🎴📊 [2026-09-24] 레꾸자랑 «재기»를 눈으로 — 실제로 눌러서 ①나가는 카드 그림 ②글·주소 ③찍힌 계측 이름을 뽑는다.
//   폰 공유창은 가짜로 바꿔 끼운다(보낸 파일·글을 그대로 붙잡는다). 「닫기」도 흉내 낸다(AbortError).
//   ⛔ 찍고 재기만 한다. 앱 소스는 안 고친다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
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
await new Promise((r) => srv.listen(4513, r))
const OUT = process.env.SHOT_OUT || '/tmp/상세순서'
mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })

async function 치우기(p) {
  for (let i = 0; i < 12; i++) {
    const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first()
    if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break
    try { await 것.click({ timeout: 2000 }); await p.waitForTimeout(600) } catch { break }
  }
}

async function 한판(이름, 닫기, 시작주소 = 'http://127.0.0.1:4513/hankki/') {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul' })
  await ctx.addInitScript((닫기) => {
    try { localStorage.setItem('hankki:nudge:cloudgate', '1') } catch { /* noop */ }
    window.__계측 = []; window.__보냄 = []
    window.gtag = function (...a) { if (a[0] === 'event' && a[2] && a[2].page_title) window.__계측.push(a[2].page_title) }
    navigator.canShare = () => true
    navigator.share = async (d) => {
      if (닫기) { const e = new Error('닫음'); e.name = 'AbortError'; throw e }
      const files = []
      for (const f of d.files || []) { const buf = new Uint8Array(await f.arrayBuffer()); files.push({ name: f.name, b: Array.from(buf) }) }
      window.__보냄.push({ text: d.text, url: d.url, files })
    }
  }, 닫기)
  const p = await ctx.newPage()
  await p.goto(시작주소, { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(2600); await 치우기(p)
  return { ctx, p }
}
const { ctx, p } = await 한판('레시피', false)
await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click()
await p.waitForTimeout(1500); await 치우기(p)
const 앞 = (await p.evaluate(() => window.__계측.slice())).length
await p.locator('text=통단호박').first().click(); await p.waitForTimeout(2500)
const 뒤 = (await p.evaluate(() => window.__계측.slice())).slice(앞)
console.log('상세를 연 뒤 찍힌 순서 =', JSON.stringify(뒤))
const iD = 뒤.indexOf('detail'), iV = 뒤.findIndex((t) => String(t).startsWith('view:'))
const 맞음 = iD >= 0 && iV >= 0 && iV < iD && 뒤.slice(iD + 1).every((t) => !String(t).startsWith('view:'))
console.log(맞음 ? '✅ view: 가 먼저, detail 이 «마지막» — 머문 시간이 detail 에 붙는다' : '⛔ detail 뒤에 view: 가 찍힌다 — 머문 시간이 view: 로 샌다')
await ctx.close(); await b.close(); srv.close()
process.exit(맞음 ? 0 : 1)
