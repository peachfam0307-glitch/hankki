// 📸 지금 「레시피 상세」가 어떻게 보이나 — 손대기 «전»의 실물 (2026-08-08)
//   📮 테스터 제보: *"재료부터 만드는 법까지 다 글밖에 없다. 귀여운 스티커나 움직이는 거 붙여주면 좋겠다.
//      그걸 보면서 요리하는 사람들도 많다. 심심해 보이니까"*
//   ⛔ 시안을 그리기 «전»에 지금을 먼저 본다 — 무엇이 심심한지 내가 정하지 않는다(규칙 15·18).
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다
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
await new Promise((r) => srv.listen(4361, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 3 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, { recipes: [], seedV: BASICS_VERSION })
await page.goto('http://127.0.0.1:4361/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

// 홈 「최근 저장」 첫 칸 = 기본 레시피 (스모크와 같은 길)
await page.locator('.grid-card').first().click()
await page.waitForTimeout(900)

// ⛔ 제목을 `h1` 으로 찾았다가 «상단바 브랜드 "한끼"»를 잡았다 — 화면에서 «무엇을 잡았는지» 먼저 본다(규칙 18)
const title = await page.locator('.ing').first().isVisible().then(() => page.title()).catch(() => '?')
const ingCount = await page.locator('.ing').count()
const stepCount = await page.locator('.step').count()
console.log(`   재료 줄 ${ingCount}개 · 만드는 법 ${stepCount}단계 (문서제목=${title})`)
if (ingCount === 0 || stepCount === 0) { console.log('   ⛔ 재료·순서를 못 찾았다 — 셀렉터가 틀렸다. 여기서 멈춘다'); await b.close(); srv.close(); process.exit(1) }

// 화면 «전체»를 한 장으로 — 잘라 보면 「심심한 정도」가 안 보인다
await page.screenshot({ path: `${OUT}/상세-지금-전체.png`, fullPage: true })

// 🔢 「글밖에 없다」를 «세어» 확인한다 — 내 인상이 아니라 숫자로
//   ⛔ 처음엔 `.h-section` 의 «부모»를 절이라 여겨 61×23px 짜리 라벨 상자를 쟀다(글자 9자).
//      실제 구조 = 재료 줄 `.ing` · 순서 줄 `.step`. **줄을 직접 센다.**
const n = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('.ing, .ing-head, .step')]
  let img = 0, svg = 0, chars = 0
  for (const s of rows) {
    img += s.querySelectorAll('img').length
    svg += s.querySelectorAll('svg').length
    chars += (s.innerText || '').replace(/\s/g, '').length
  }
  return { rows: rows.length, img, svg, chars }
})
console.log(`   📊 재료·순서 ${n.rows}줄 안 — 그림 ${n.img}장 · 아이콘(svg) ${n.svg}개 · 글자 ${n.chars}자`)
console.log(n.img + n.svg === 0 ? '   ⛔ 그림도 아이콘도 «한 개도» 없다 — 테스터 말 그대로다' : '   · 뭔가 있긴 하다')

// 절 통째로 찍기 — 요소를 «직접» 찍는다(clip 좌표를 손으로 계산하면 어긋난다. 한 번 틀렸다)
for (const [name, sel] of [['재료', '.ing'], ['만드는법', '.step']]) {
  const first = page.locator(sel).first()
  const box = await first.evaluate((el) => { const p = el.parentElement.getBoundingClientRect(); return { w: p.width, h: p.height } })
  await first.locator('xpath=..').screenshot({ path: `${OUT}/상세-지금-${name}.png` })
  console.log(`   ${name} = ${Math.round(box.w)}×${Math.round(box.h)}px`)
}
console.log(errors.length ? `   ⛔ pageerror ${errors.length}` : '   ✅ pageerror 0')

await b.close(); srv.close()
console.log(`\n📁 ${OUT}/상세-지금-*.png`)
