// 🍳 레꾸자랑 「② 레시피」 고른 채 보내면 한 장만 가나 — 눈검사 (2026-10-12 · _shot-레꾸자랑재기-0924 본뜸)
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
await new Promise((r) => srv.listen(4512, r))
const OUT = process.env.SHOT_OUT || '/tmp/레시피만보내기'
mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })

async function 치우기(p) {
  for (let i = 0; i < 12; i++) {
    const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first()
    if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break
    try { await 것.click({ timeout: 2000 }); await p.waitForTimeout(600) } catch { break }
  }
}

async function 한판(이름, 닫기, 시작주소 = 'http://127.0.0.1:4512/hankki/') {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR' })
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
const 뽑기 = async (p, 앞) => {
  const 보냄 = await p.evaluate(() => window.__보냄)
  보냄.forEach((s, i) => s.files.forEach((f, j) => writeFileSync(join(OUT, `${앞}-${i}-${j}-${f.name}`), Buffer.from(f.b))))
  // ⭐ 앱이 통계를 켜면 window.gtag 를 «자기 것»(dataLayer 에 쌓기)으로 갈아 끼운다 → dataLayer 에서 이름을 뽑는다
  const 계측 = await p.evaluate(() => [...window.__계측, ...(window.dataLayer || []).filter((a) => a && a[0] === 'event' && a[2] && a[2].page_title).map((a) => a[2].page_title)])
  return { 계측: [...new Set(계측)], 글: 보냄.map((s) => ({ text: s.text, url: s.url, 장: s.files.length })) }
}
const 결과 = {}
for (const 쪽 of [1, 2]) {
  const { ctx, p } = await 한판('랜덤', false)
  await p.locator('.bottom-nav .nav-item').filter({ hasText: '레꾸자랑' }).first().click()
  await p.waitForTimeout(1000); await 치우기(p)
  await p.locator('.grid-card').first().click(); await p.waitForTimeout(2500)
  const 랜덤 = p.locator('button', { hasText: /랜덤/ }).first()
  if (await 랜덤.count()) { await 랜덤.click(); await p.waitForTimeout(6000) }
  if (쪽 === 2) { await p.locator('button', { hasText: '② 레시피' }).first().click(); await p.waitForTimeout(800) }
  await p.screenshot({ path: join(OUT, `쪽${쪽}-보내기전.png`) })
  const 공유 = p.locator('button', { hasText: /공유|보내기/ }).first()
  console.log(`쪽${쪽} 공유 단추 = ${(await 공유.innerText().catch(() => '')).replace(/\s+/g, ' ')}`)
  if (await 공유.count()) { await 공유.click(); await p.waitForTimeout(9000) }
  결과['쪽' + 쪽] = await 뽑기(p, '쪽' + 쪽)
  await ctx.close()
}
console.log(JSON.stringify(결과, null, 1))
await b.close(); srv.close()
