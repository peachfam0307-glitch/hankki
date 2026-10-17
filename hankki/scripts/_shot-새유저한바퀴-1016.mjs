// 👀 새 유저 한 바퀴 — 철 지난 것 남았나 (2026-10-16)
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
await new Promise((r) => srv.listen(4515, r))
const OUT = process.env.SHOT_OUT || '/tmp/새유저'
mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })

async function 치우기(p) {
  for (let i = 0; i < 12; i++) {
    const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first()
    if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break
    try { await 것.click({ timeout: 2000 }); await p.waitForTimeout(600) } catch { break }
  }
}

async function 한판(이름, 닫기, 시작주소 = 'http://127.0.0.1:4515/hankki/') {
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
const { ctx, p } = await 한판('새유저', false)
await p.waitForTimeout(1500); await 치우기(p)
await p.screenshot({ path: join(OUT, '홈.png') })
await p.evaluate(() => window.scrollTo(0, 900)); await p.waitForTimeout(600); await p.screenshot({ path: join(OUT, '홈아래.png') })
await p.evaluate(() => window.scrollTo(0, 0))
await p.getByText('한끼 소식').first().click().catch(() => {}); await p.waitForTimeout(1500); await p.screenshot({ path: join(OUT, '소식.png') })
await p.keyboard.press('Escape'); await p.goBack().catch(() => {}); await p.waitForTimeout(800)
for (const 탭 of ['일기', '장보기']) { await p.locator('.bottom-nav .nav-item').filter({ hasText: 탭 }).first().click().catch(() => {}); await p.waitForTimeout(1500); await 치우기(p); await p.screenshot({ path: join(OUT, `탭-${탭}.png`) }) }
const 픽 = await p.evaluate(() => { const h = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && /이번 주 픽/.test(e.textContent)); const box = h && h.closest('section, div'); return document.body.innerText.split('이번 주 픽').slice(1).join(' | ').slice(0, 900) })
console.log('PICK', 픽.replace(/\n+/g, ' / '))
await ctx.close(); await b.close(); srv.close()
