// 🗂 **갈래별로 「무엇이 들어 있나」를 앱 화면 그대로 찍는다** (2026-09-11)
// 📮 창업자 = *"초피액젓, 진간장, 맛간장, 고추장 이런것들을 다양하게 보여주면 좋겠어. 어묵. 햄 이런 것도"*
//            ＋ *"갈래별로 들어있는 것 캡쳐해서 보여주고"*
// 🗓 시계를 2026-09-12(토)로 옮겨 찍는다 — 그날 기준으로 열린 것만 보인다.
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = '/home/user/hankki/hankki'
const DIST = join(ROOT, 'dist')
const 낼곳 = process.env.CARD_DIR || '/tmp/갈래캡처'
mkdirSync(낼곳, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4427, r))

const { SEED_COACH_SEEN } = await import(join(ROOT, 'src/coach.js'))
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
// 📐📐 **화면을 길게 잡는다 — `fullPage: true` 가 여기선 «안 먹는다».**
//   ⛔ 1판은 fullPage 로 찍었는데 열 장이 전부 1688px(=844x2)로 똑같이 나왔다 —
//      앱이 «내부 스크롤 칸»을 쓰기 때문에 문서 높이가 화면 높이와 같다.
//      그래서 갈래마다 «첫 화면»만 찍히고 아래 카드가 통째로 잘렸다.
//      📮 창업자가 말한 그 모양이다 — *"잘려있으니까"*
//   ✅ 화면 자체를 길게(390x3000) 잡으면 카드가 다 들어온다.
const ctx = await b.newContext({ viewport: { width: 390, height: 3000 }, timezoneId: 'Asia/Seoul', deviceScaleFactor: 2 })
const p = await ctx.newPage()
await p.addInitScript(SEED_COACH_SEEN)
await p.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
  const 진짜 = Date
  const 옮김 = new 진짜('2026-09-12T10:00:00+09:00').getTime() - 진짜.now()
  window.Date = class extends 진짜 {
    constructor(...a) { if (a.length === 0) super(진짜.now() + 옮김); else super(...a) }
    static now() { return 진짜.now() + 옮김 }
  }
})
await p.goto('http://127.0.0.1:4427/', { waitUntil: 'networkidle' })
await p.click('text=장보기'); await p.waitForTimeout(1000)

// 🏷 갈래 칩이 무엇무엇인지 «앱에게 묻는다» — ⛔내가 목록을 적지 않는다(적으면 어긋난다)
const 칩들 = await p.evaluate(() => [...document.querySelectorAll('.cur-chips button, .cur-chips .pill')].map((b) => b.textContent.trim()))
console.log('🏷 갈래 칩 —', 칩들.join(' · '))

for (const 칩 of 칩들) {
  const 단추 = p.locator('.cur-chips').getByText(칩, { exact: true }).first()
  if (!(await 단추.count())) { console.log(`   ⛔ 「${칩}」 못 누름`); continue }
  await 단추.click(); await p.waitForTimeout(600)
  // 📖 그 갈래의 카드를 다 펼친다 — 설명이 이 릴스의 전부다
  for (let i = 0; i < 20; i++) {
    const 더 = p.locator('text=더보기').first()
    if (!(await 더.count())) break
    try { await 더.click({ timeout: 900 }) } catch { break }
    await p.waitForTimeout(110)
  }
  // ⬆️ 맨 위로 올리고 찍는다 — 펼치느라 스크롤이 내려가 있으면 «갈래 이름과 첫 카드»가 잘린다
  await p.evaluate(() => {
    for (const el of document.querySelectorAll('*')) if (el.scrollTop > 0) el.scrollTop = 0
    window.scrollTo(0, 0)
  })
  await p.waitForTimeout(400)
  const 목록 = await p.evaluate(() => [...document.querySelectorAll('.cur-card')].map((c) => {
    const 이름 = c.querySelector('h3,b,strong,.cur-name')?.textContent?.trim() || c.innerText.split('\n')[0]
    const 조합원 = /조합원 전용/.test(c.innerText)
    return (조합원 ? '🔒' : '  ') + 이름
  }))
  const 파일 = 칩.replace(/[\/·\s]/g, '') || '무제'
  // 🖼 그 갈래 «전체»를 한 장으로 — fullPage 로 찍어야 아래 카드가 안 잘린다
  await p.screenshot({ path: join(낼곳, `${파일}.png`), fullPage: true })
  console.log(`\n📸 ${파일}.png — ${목록.length}개`)
  목록.forEach((m) => console.log('   ', m))
}

await b.close(); srv.close()
console.log('\n🔒 = 한살림(조합원 전용) — 창업자 지시대로 릴스에서 뺀다')
