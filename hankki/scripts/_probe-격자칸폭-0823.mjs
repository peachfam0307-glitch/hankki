// 📐 앱의 «모든» 격자 — 칸 폭이 고른가 (2026-08-23)
//
// ⛔ `.grid3` 하나를 고치고 끝내지 않는다. `1fr`(＝`minmax(auto, 1fr)`)은 저장소 곳곳에 있고,
//    2026-08-22 에 `word-break: keep-all` 을 **body 뿌리**에 걸면서 **전부가 같은 구멍**이 됐다.
//    (안 끊기는 긴 낱말이 그 칸의 «최소 너비»가 되어 칸을 벌린다)
//
// ⭐ 잣대 = 「같은 줄에 선 칸들의 폭이 같은가」. `1fr` 이 여럿이면 같아야 한다.
//    ⚠️ 일부러 다르게 짠 격자(`42% 1fr` 처럼)는 «같을 이유가 없다» → 값이 다른 건 알려만 주고 안 죽인다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_probe-격자칸폭-0823.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4396, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
await page.goto('http://127.0.0.1:4396/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(900)

const 재기 = () => page.evaluate(() => {
  const out = []
  for (const g of document.querySelectorAll('*')) {
    const cs = getComputedStyle(g)
    if (cs.display !== 'grid' && cs.display !== 'inline-grid') continue
    const kids = [...g.children].filter((k) => getComputedStyle(k).display !== 'none')
    if (kids.length < 2) continue
    // 첫 줄만 본다 — 같은 y 에 선 것들
    const y0 = Math.round(kids[0].getBoundingClientRect().y)
    const 줄 = kids.filter((k) => Math.abs(Math.round(k.getBoundingClientRect().y) - y0) <= 1)
    if (줄.length < 2) continue
    const 폭 = 줄.map((k) => Math.round(k.getBoundingClientRect().width))
    const 벌어짐 = Math.max(...폭) - Math.min(...폭)
    // `1fr` 이 둘 이상 적힌 격자만 «같아야 한다»고 본다
    const tpl = cs.gridTemplateColumns
    out.push({
      선택자: g.className ? `.${String(g.className).trim().split(/\s+/).join('.')}` : g.tagName.toLowerCase(),
      칸수: 줄.length, 폭, 벌어짐, 정의: tpl.slice(0, 60),
    })
  }
  return out
})

const 탭들 = ['홈', '레시피', '일기', '장보기', '레꾸자랑']
const 본것 = new Map()
for (const t of 탭들) {
  await page.locator('.bottom-nav .nav-item').filter({ hasText: t }).first().click()
  await page.waitForTimeout(800)
  for (const g of await 재기()) {
    const k = `${g.선택자}|${g.칸수}`
    // 제일 심하게 벌어진 판을 남긴다
    if (!본것.has(k) || 본것.get(k).벌어짐 < g.벌어짐) 본것.set(k, { ...g, 탭: t })
  }
}

const 줄들 = [...본것.values()].sort((a, b) => b.벌어짐 - a.벌어짐)
console.log('\n📐 앱의 격자 — 첫 줄 칸 폭')
console.log('   탭      선택자                              칸  폭                     벌어짐')
for (const g of 줄들) {
  const 나쁨 = g.벌어짐 > 1
  console.log(`   ${나쁨 ? '⛔' : '✅'} ${g.탭.padEnd(6)} ${g.선택자.slice(0, 34).padEnd(34)} ${String(g.칸수).padStart(2)}  ${JSON.stringify(g.폭).padEnd(22)} ${String(g.벌어짐).padStart(4)}px`)
  if (나쁨) console.log(`      └ 정의 = ${g.정의}`)
}
const 나쁜것 = 줄들.filter((g) => g.벌어짐 > 1)
console.log(`\n${나쁜것.length ? `⚠️ 고르지 않은 격자 ${나쁜것.length}개 — «일부러 그런 것»인지 정의를 볼 것` : '✅ 모든 격자가 고르다'}\n`)

await b.close(); srv.close()
