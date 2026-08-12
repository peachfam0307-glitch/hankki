// 🐻 레꾸 서랍에서 「반응·별점 / 조리법·기록」 32컷이 «어디»에 있나 — 실물로 찍는다.
//    📮 창업자 2026-08-12 *"꼬르곰 안보이는데?? 레꾸 어디에 넣었어?"*
//    ⛔ 코드만 보고 「글자 탭에 있다」고 말하지 않는다(규칙 21) — 열어서 눈으로 본다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4402, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 3 })
await ctx.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
  localStorage.setItem('hankki:giftSheetSeen', '1')
})
await ctx.addInitScript({ content: SEED_COACH_SEEN })
const page = await ctx.newPage()
page.on('pageerror', (e) => console.log('⛔ pageerror', String(e).slice(0, 100)))
await page.goto('http://127.0.0.1:4402/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1200)

// 홈 → 레시피 한 장 → 「레시피 꾸미기」
await page.locator('.grid-card').first().click(); await page.waitForTimeout(900)
const 시트닫기 = async () => {
  for (const t of ['나중에', '닫기']) {
    const x = page.getByRole('button', { name: t }).first()
    if (await x.count() && await x.isVisible().catch(() => false)) { await x.click().catch(() => {}); await page.waitForTimeout(250) }
  }
}
await 시트닫기()
await page.getByRole('button', { name: /꾸미기/ }).first().click(); await page.waitForTimeout(1200)
await 시트닫기()

// 「글자」 탭
await page.getByRole('button', { name: '글자', exact: true }).first().click(); await page.waitForTimeout(700)
await page.screenshot({ path: join(OUT, '레꾸-글자탭-맨위.png') })

// 서랍을 굴려서 「반응 · 별점」이 나올 때까지
const 서랍 = page.locator('.decor-drawer').first()
const 라벨 = await page.evaluate(() => [...document.querySelectorAll('.decor-drawer *')]
  .filter((e) => e.children.length === 0 && /반응|조리법|한끼 문구|문구/.test(e.textContent || ''))
  .map((e) => (e.textContent || '').trim()))
console.log('서랍 안 이름표 :', [...new Set(라벨)].join(' / ') || '(없음)')

// 📏 굴리는 «진짜» 칸을 찾는다 — `.decor-drawer` 가 아니라 그 안쪽일 수 있다(짐작 금지)
const 자 = await page.evaluate(() => {
  const 굴칸 = [...document.querySelectorAll('.decor-drawer, .decor-drawer *')]
    .filter((e) => e.scrollHeight - e.clientHeight > 40)
    .map((e) => ({ cls: e.className && String(e.className).slice(0, 40), h: e.clientHeight, sh: e.scrollHeight }))
  const 이름 = (t) => [...document.querySelectorAll('.decor-drawer *')]
    .find((e) => e.children.length === 0 && (e.textContent || '').trim() === t)
  const 칸 = document.querySelector('.decor-drawer')
  const base = 칸.getBoundingClientRect().top
  const 줄 = {}
  for (const t of ['반응 · 별점', '조리법 · 기록', '한끼 문구', '문구']) {
    const el = 이름(t)
    if (el) 줄[t] = Math.round(el.getBoundingClientRect().top - base)
  }
  return { 굴칸, 줄, 서랍높이: 칸.clientHeight }
})
console.log('굴러가는 칸 :', JSON.stringify(자.굴칸))
console.log('서랍 높이 :', 자.서랍높이, 'px · 서랍 맨 위에서 이름표까지 :', JSON.stringify(자.줄))

for (let i = 0; i < 20; i++) {
  const 보임 = await page.evaluate(() => {
    const t = [...document.querySelectorAll('.decor-drawer *')]
      .find((e) => e.children.length === 0 && (e.textContent || '').trim() === '반응 · 별점')
    if (!t) return null
    const r = t.getBoundingClientRect()
    return { top: Math.round(r.top), 보임: r.top > 0 && r.top < innerHeight - 40 }
  })
  if (보임?.보임) { console.log('✅ 「반응 · 별점」 이 화면에 보인다 — y', 보임.top, `(${i}번 굴렸다)`); break }
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('.decor-drawer, .decor-drawer *')]
      .find((e) => e.scrollHeight - e.clientHeight > 40)
    if (el) el.scrollTop += 200
  })
  await page.waitForTimeout(200)
  if (i === 19) console.log('⛔ 굴려도 「반응 · 별점」 을 못 찾았다 —', JSON.stringify(보임))
}
await page.waitForTimeout(300)
await page.screenshot({ path: join(OUT, '레꾸-꼬르곰32컷.png') })

// 그림이 진짜 그려졌나(깨짐 0)
const 깨짐 = await page.evaluate(() => [...document.querySelectorAll('.decor-drawer img')]
  .filter((i) => i.complete && i.naturalWidth === 0).length)
console.log(깨짐 === 0 ? '✅ 서랍 그림 깨짐 0' : `⛔ 깨진 그림 ${깨짐}장`)

await b.close(); srv.close(); process.exit(0)
