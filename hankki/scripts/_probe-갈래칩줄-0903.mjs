// 🥟📏 **「중식 칩을 넣으면 칩 줄이 넘치나」를 재서 답한다** (2026-09-03)
//
// 📮 창업자 = *"오른쪽으로 스크롤 가능하게 해줘. 너무 길면 나중에 2줄로 만들거나 해야하지 않을까"*
//
// ⭐ 먼저 코드를 봤더니 칩 줄은 이미 `.hscroll`(`overflow-x: auto`)이었다.
//    ⛔ 그래도 「된다」고 «말로» 답하지 않는다 — 폭을 재서 답한다(규칙 15·29).
//
// 🔢 재는 것 = ⑴칩 줄이 «진짜로» 굴러가나(scrollWidth > clientWidth 이고 굴려진다)
//              ⑵제일 좁은 폰에서 첫 칸이 잘리나 (2026-08-14 테스터 영상 사고)
//              ⑶칩이 몇 개·전체 폭이 얼마인가 — 「2줄로 갈 때」를 판단할 근거
// 📱 폭 셋 = 320(제일 좁은 폰) · 360(갤럭시 기본) · 390(요즘 폰)
//
// ⛔ 브라우저 경로를 판에 박지 않는다 — `SMOKE_CHROMIUM` 만 읽는다(v10.90 사고)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = process.env.OUT || '/tmp/hankki-갈래칩'
mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

let 틀림 = 0
console.log('\n🥟 갈래 칩 줄 — 중식이 늘어도 괜찮나\n')

for (const 폭 of [320, 360, 390]) {
  const ctx = await b.newContext({ viewport: { width: 폭, height: 800 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1800)
  for (let i = 0; i < 3; i++) { if (!(await p.locator('.sheet-mask').count())) break; await p.keyboard.press('Escape'); await p.waitForTimeout(300) }
  await p.locator('.nav-item', { hasText: '레시피' }).first().click()
  await p.waitForTimeout(1300)

  const 잰값 = await p.evaluate(async () => {
    const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms))
    // 칩 줄 = `.hscroll` 중 「전체」가 든 것
    const 줄 = [...document.querySelectorAll('.hscroll')]
      .find((e) => /전체\s*\d/.test(e.innerText || ''))
    if (!줄) return null
    const 칩 = [...줄.querySelectorAll('.pill')]
    const 첫칸 = 칩[0]?.getBoundingClientRect()
    const 줄박스 = 줄.getBoundingClientRect()
    // ⭐ 진짜 굴러가나 — 끝까지 밀어 보고 값이 «변했나»를 본다(스타일만 믿지 않는다)
    const 처음 = 줄.scrollLeft
    줄.scrollLeft = 99999
    await 잠깐(200)
    const 끝 = 줄.scrollLeft
    줄.scrollLeft = 처음
    return {
      칩수: 칩.length,
      이름: 칩.map((c) => (c.innerText || '').trim().split(/\s+/)[0]).join('·'),
      전체폭: Math.round(줄.scrollWidth),
      보이는폭: Math.round(줄.clientWidth),
      굴러감: 끝 > 처음,
      첫칸왼끝: Math.round((첫칸?.left ?? 0) - 줄박스.left),
      가로넘침: Math.round(document.documentElement.scrollWidth - document.documentElement.clientWidth),
    }
  })

  if (!잰값) { console.log(`   ❌ ${폭}px — 칩 줄을 못 찾았다`); 틀림++; await ctx.close(); continue }

  const 넘침 = 잰값.전체폭 > 잰값.보이는폭
  const ok굴림 = !넘침 || 잰값.굴러감              // 넘치면 반드시 굴러가야 한다
  const ok첫칸 = 잰값.첫칸왼끝 >= 0                 // 첫 칸이 왼쪽으로 잘리면 안 된다
  const ok몸통 = 잰값.가로넘침 <= 1                 // 화면 «전체»가 가로로 밀리면 안 된다
  if (!ok굴림 || !ok첫칸 || !ok몸통) 틀림++

  console.log(`   ${ok굴림 && ok첫칸 && ok몸통 ? '✅' : '❌'} ${폭}px — 칩 ${잰값.칩수}개 (${잰값.이름})`)
  console.log(`        폭 ${잰값.전체폭} / 보이는 ${잰값.보이는폭}  ${넘침 ? `→ ${잰값.전체폭 - 잰값.보이는폭}px 넘침` : '→ 다 들어감'}`)
  console.log(`        굴러가나 ${잰값.굴러감 ? '✅' : (넘침 ? '❌ 안 굴러감' : '— (넘칠 게 없다)')}  ·  첫 칸 왼끝 ${잰값.첫칸왼끝}px  ·  화면 가로넘침 ${잰값.가로넘침}px`)

  await p.screenshot({ path: join(OUT, `칩줄-${폭}.png`) })
  await ctx.close()
}

await b.close(); srv.close()
console.log(`\n   📁 ${OUT}\n`)
if (틀림) { console.log(`❌ ${틀림}칸 틀렸다.\n`); process.exit(1) }
console.log('✅ 칩 줄은 넘쳐도 «굴러간다» — 2줄로 갈 필요가 아직 없다.\n')
