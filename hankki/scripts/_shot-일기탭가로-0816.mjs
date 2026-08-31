// 🗓 일기 «탭» 가로 2단 — 「왼쪽 달력 · 오른쪽 만든 음식」
//
// 📮 창업자 2026-08-16 확정 = *"**달력왼쪽 오른쪽에 만든음식이 나오고**, 달력 일기를 클릭하면 일기＋꾸미기가 나와야해"*
//    ＋ *"우리지금 폰이나 패드 가로모드 이렇게 되고 있지 않아? **달력만 세로모드로 되어있었네**"*
//
// 🍚 **달력에 요리 기록을 심는다** (창업자 *"달력에 이미지 몇개는 넣어둬야하고, 15일 누를때 소불고기 아이콘이 달력에 있어야해"*
//    ＋ *"달력은 샘플이니까 이것저것 넣어도 돼. **여러개 붙여둬**"*)
//    ⛔⛔ **앱 씨앗 데이터는 «안» 건드린다** — 그건 유저에게도 나가는 별개 결정이다.
//       여기서는 **찍을 때만** localStorage 에 심는다. 앱 코드는 한 줄도 안 바뀐다.
//    ⚠️ 날짜를 «이번 달»로 계산해서 넣는다 — 달력은 늘 이번 달을 열기 때문에 고정 날짜는 반드시 낡는다.
//
// 실행: node scripts/_shot-일기탭가로-0816.mjs
import fs from 'node:fs'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import pw from '/home/user/hankki/hankki/node_modules/playwright-core/index.js'
const { chromium } = pw

const H = '/home/user/hankki/hankki'
const DIST = `${H}/dist`
const OUT = `${H}/design/promo/스토어스샷-2507/_일기탭가로`
fs.mkdirSync(OUT, { recursive: true })
if (!fs.existsSync(`${DIST}/index.html`)) { console.log('⛔ dist 가 없다 — 빌드부터'); process.exit(1) }

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4396, r))

const { SEED_COACH_SEEN } = await import(`${H}/src/coach.js`)
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// 🍚 심을 요리 기록 — 「며칠 전」으로 넣어 이번 달 달력에 흩어지게 한다.
//   ⭐ 제목만 주면 앱이 알아서 그림을 고른다(`guessFoodIcon`) — 아이콘 키를 손으로 박지 않는다.
//      박아두면 규칙이 바뀔 때 낡는다(2026-08-14 「붙는 그림」 사고와 같은 뿌리).
const 심을것 = [
  { 며칠전: 1, title: '수제 떡갈비' },
  { 며칠전: 2, title: '목살돼지갈비구이' },
  { 며칠전: 3, title: '감바스' },
  { 며칠전: 5, title: '소불고기' },
  { 며칠전: 6, title: '콩국수' },
  { 며칠전: 8, title: '된장찌개' },
  { 며칠전: 9, title: '제육볶음' },
  { 며칠전: 12, title: '소고기 미역국' },
]

const 씨앗 = (목록) => {
  const raw = localStorage.getItem('hankki:v1')
  if (!raw) return
  const st = JSON.parse(raw)
  const 이제 = Date.now()
  const 새것 = 목록.map((x, i) => ({
    id: `shot-cook-${i}`,
    at: 이제 - x.며칠전 * 86400000,
    title: x.title,
    rating: 0,
  }))
  st.diary = [...새것, ...(st.diary || [])]
  localStorage.setItem('hankki:v1', JSON.stringify(st))
}

const 화면들 = [
  { 이름: '패드-가로', w: 1280, h: 720, twoCol: true },
  { 이름: '폰-세로', w: 411, h: 891, twoCol: false },
]

let 실패 = 0
for (const s of 화면들) {
  const page = await b.newPage({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 2 })
  const 오류 = []
  page.on('pageerror', (e) => 오류.push(String(e.message || e).split('\n')[0]))
  await page.addInitScript(SEED_COACH_SEEN)
  await page.addInitScript(() => localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'))
  await page.addInitScript(() => localStorage.setItem('hankki:nudge:giftpack', '1'))
  await page.goto('http://127.0.0.1:4396/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1600)

  // 요리 기록을 심고 새로 연다 — ⛔ `reload()` 는 쓰지 않는다(초기 스크립트가 다시 돌아 값을 덮는다 · 옛 함정)
  await page.evaluate(씨앗, 심을것)
  await page.goto('http://127.0.0.1:4396/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)

  await page.getByText('일기', { exact: true }).last().click().catch(() => {})
  await page.waitForTimeout(1800)

  const 잼 = await page.evaluate(() => {
    const r = (q) => { const el = document.querySelector(q); if (!el) return null; const b = el.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } }
    const 달력 = r('.log-cal')
    const 오른쪽 = r('.log-main')
    // 달력에 실제로 «그림»이 떴나 — 이게 창업자가 말한 「만든 이모지」다
    const 그림수 = document.querySelectorAll('.cal-food').length
    const 펜수 = document.querySelectorAll('.cal-diary').length
    // 오른쪽에 앨범 카드가 있나
    const 카드수 = document.querySelectorAll('.log-main img').length
    const 제목 = (document.querySelector('.cal-title') || {}).innerText || ''
    return { 달력, 오른쪽, 그림수, 펜수, 카드수, 제목, 화면: { w: innerWidth, h: innerHeight } }
  })

  const 나란히 = !!(잼.달력 && 잼.오른쪽 && 잼.달력.x + 잼.달력.w <= 잼.오른쪽.x + 8 && 잼.달력.y > 0 && Math.abs(잼.달력.y - 잼.오른쪽.y) < 40)
  const ok = s.twoCol ? (나란히 && 잼.그림수 >= 5) : (!나란히 && 잼.그림수 >= 5)
  if (!ok) 실패++
  if (오류.length) { console.log(`  ⛔ pageerror(${s.이름}):`, 오류[0]); 실패++ }

  console.log(`\n▸ ${s.이름} (${잼.화면.w}×${잼.화면.h}) — 기대: ${s.twoCol ? '가로 2단' : '위아래로 쌓임'}`)
  console.log(`   달력   = ${잼.달력 ? `x${잼.달력.x} y${잼.달력.y} ${잼.달력.w}×${잼.달력.h}` : '못 찾음'}   ${잼.제목.replace(/\n/g, ' ')}`)
  console.log(`   오른쪽 = ${잼.오른쪽 ? `x${잼.오른쪽.x} y${잼.오른쪽.y} ${잼.오른쪽.w}×${잼.오른쪽.h}` : '못 찾음'}`)
  console.log(`   달력 그림 ${잼.그림수}개 · 펜 ${잼.펜수}개 · 오른쪽 그림 ${잼.카드수}개`)
  console.log(`   나란히? ${나란히 ? '예' : '아니오'} → 판정 ${ok ? '✅' : '⛔'}`)

  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(800)
  await page.screenshot({ path: join(OUT, `${s.이름}.png`) })
  await page.close()
}

await b.close(); srv.close()
console.log(`\n📁 ${OUT}`)
console.log(실패 === 0 ? '✅ 통과' : `⛔ 실패 ${실패}칸`)
process.exit(실패 === 0 ? 0 : 1)
