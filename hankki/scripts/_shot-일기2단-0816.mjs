// 🗓 일기 가로 2단 — 「왼쪽 달력 ＋ 오른쪽 일기」가 실제로 그렇게 그려지나
//
// 📮 창업자 2026-08-16 = *"다른건 다 가로인데 **일기만 세로라 이상해**"* · *"**왼쪽에 달력을 붙이던가 꽉차보여야해**"*
//    ＋ 갈래 물음에 **ⓑ** = 달력만이 아니라 **일기도 같이 보여야 한다**
//
// ⭐⭐ 「보이나」가 아니라 **「두 칸이 나란히 있고 둘 다 내용이 있나」**를 잰다(규칙 18 ⓘ).
//    달력이 DOM 에 있어도 `display:none` 이면 안 보인다 — **자리(rect)로** 판정한다.
// ⛔ **폰 세로도 같이 찍는다** — 가로만 고치려다 세로를 건드리면 여기서 걸린다.
//
// 실행: node scripts/_shot-일기2단-0816.mjs
import fs from 'node:fs'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import pw from '/home/user/hankki/hankki/node_modules/playwright-core/index.js'
const { chromium } = pw

const H = '/home/user/hankki/hankki'
const DIST = `${H}/dist`
const OUT = `${H}/design/promo/스토어스샷-2507/_일기2단`
fs.mkdirSync(OUT, { recursive: true })
if (!fs.existsSync(`${DIST}/index.html`)) { console.log('⛔ dist 가 없다 — 빌드부터'); process.exit(1) }

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4394, r))

const { SEED_COACH_SEEN } = await import(`${H}/src/coach.js`)
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

const 화면들 = [
  // ⛔ 키 이름을 한글 「2단이어야」로 지었다가 죽었다 — **숫자로 시작하는 이름은 JS 가 못 받는다**
  //    (`s.2단이어야` 는 문법 오류). 값·주석은 한글이어도 되지만 «이름»은 ASCII 로.
  { 이름: '패드-가로', w: 1280, h: 720, dpr: 2, twoCol: true },
  { 이름: '폰-가로', w: 780, h: 360, dpr: 2, twoCol: true },
  { 이름: '폰-세로', w: 411, h: 891, dpr: 2, twoCol: false },
]

let 실패 = 0
for (const s of 화면들) {
  const page = await b.newPage({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: s.dpr })
  const 오류 = []
  page.on('pageerror', (e) => 오류.push(String(e.message || e).split('\n')[0]))
  await page.addInitScript(SEED_COACH_SEEN)
  await page.addInitScript(() => localStorage.setItem('hankki:onboarded', '1'))
  await page.addInitScript(() => localStorage.setItem('hankki:nudge:giftpack', '1'))
  await page.goto('http://127.0.0.1:4394/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1600)

  // 일기 탭 → 샘플 일기 칸
  await page.getByText('일기', { exact: true }).last().click().catch(() => {})
  await page.waitForTimeout(1200)
  const 칸 = page.locator('.grid-card, .cal-diary, .mini-card').first()
  if (await 칸.count()) { await 칸.click(); await page.waitForTimeout(2000) }
  else console.log(`  ⛔ ${s.이름} — 샘플 일기 칸을 못 찾았다`)
  await page.waitForTimeout(1600)

  // ── 잰다 ──
  const 잼 = await page.evaluate(() => {
    const r = (q) => { const el = document.querySelector(q); if (!el) return null; const b = el.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } }
    const 달력 = r('.diary-cal')
    const 종이 = r('.paper-box') || r('.paper')
    // 일기 내용이 «진짜로» 있나 — 글칸 value 는 innerText 로 안 잡힌다
    const 글 = [...document.querySelectorAll('textarea, input')].map((t) => t.value).join('\n')
    const 일기있나 = 글.includes('방학언제끝나냐') || document.body.innerText.includes('돌밥돌밥')
    // 달력 칸이 실제로 그려졌나(날짜 숫자가 있나)
    const 달력칸수 = document.querySelectorAll('.diary-cal button, .diary-cal [class*="cal"]').length
    return { 달력, 종이, 일기있나, 달력칸수, 화면: { w: window.innerWidth, h: window.innerHeight } }
  })

  const 보임 = !!(잼.달력 && 잼.달력.w > 0 && 잼.달력.h > 0)
  const 나란히 = 보임 && 잼.종이 && 잼.달력.x + 잼.달력.w <= 잼.종이.x + 8
  const ok = s.twoCol ? (보임 && 나란히 && 잼.일기있나) : (!보임 && 잼.일기있나)
  if (!ok) 실패++
  if (오류.length) { console.log(`  ⛔ pageerror(${s.이름}):`, 오류[0]); 실패++ }

  console.log(`\n▸ ${s.이름} (${잼.화면.w}×${잼.화면.h}) — 기대: ${s.twoCol ? '2단' : '세로 그대로'}`)
  console.log(`   달력  = ${보임 ? `x${잼.달력.x} w${잼.달력.w} h${잼.달력.h} · 칸 ${잼.달력칸수}개` : '안 보임'}`)
  console.log(`   종이  = ${잼.종이 ? `x${잼.종이.x} w${잼.종이.w} h${잼.종이.h}` : '못 찾음'}`)
  console.log(`   일기 내용 = ${잼.일기있나 ? '있다' : '⛔ 없다'}`)
  console.log(`   판정  = ${ok ? '✅' : '⛔'}`)

  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(700)
  await page.screenshot({ path: join(OUT, `${s.이름}.png`) })
  await page.close()
}

await b.close(); srv.close()
console.log(`\n📁 ${OUT}`)
console.log(실패 === 0 ? '✅ 통과' : `⛔ 실패 ${실패}칸`)
process.exit(실패 === 0 ? 0 : 1)
