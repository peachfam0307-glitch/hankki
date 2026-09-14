// 🎬🍂 **릴스용 «레꾸(레시피 꾸미기)» 판 — 가을 프레임으로 꾸며서 찍는다** (2026-09-03)
//
// 📮 창업자 = *"이걸로 하고 가을프레임으로 꾸미기 하나 만들면 어떨까."* ·
//    *"영상은 네가 찍되 … 내가 영상을 찍으면 진짜 오래걸리거든?"* ·
//    *"돌솥비빔밥 이나 뚝딱 버섯밥귀여운데."*
//
// ⛔⛔ **영상 «녹화»(recordVideo) 를 쓰지 않는다 — 실측으로 버렸다(2026-09-03)**
//    Playwright 녹화는 뷰포트(540×960)를 1080×1920 캔버스에 **키우지 않고 그대로 얹는다**
//    → 화면이 왼쪽 위에 작게 박히고 나머지가 회색이 된다(프레임을 뽑아 «눈으로» 확인 · 규칙 21).
//    ✅ 대신 **프레임을 한 장씩 캡처**한다 — `deviceScaleFactor 2` 가 살아서 **진짜 1080×1920** 으로 나온다.
//       9/1 릴스의 목업 대화방(237프레임)이 쓴 바로 그 방식이고,
//       그때 창업자가 짚은 *"네가준거는 살짝 뿌얘"* 를 처음부터 피하는 길이다.
//
// ⭐ 살아 있는 앱을 띄운다 — 흉내가 아니다(절대원칙 30).
// ⛔ 브라우저 경로를 판에 박지 않는다 — `SMOKE_CHROMIUM` 만 읽는다(v10.90 사고)
//
// 쓰는 법 = node scripts/_shot-릴스레꾸-0903.mjs [레시피이름조각]
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const 찾을이름 = process.argv[2] || '뚝딱 버섯'
const OUT = process.env.OUT || '/tmp/hankki-릴스레꾸'
rmSync(OUT, { recursive: true, force: true })
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
const ctx = await b.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p = await ctx.newPage()

// ⛔⛔ `.sheet-mask` «만» 보면 못 닫는 시트가 있다 — 레꾸에 들어가면 「받은 선물」이 화면을 덮는다
//    (실물을 찍어 «열어봐서» 잡았다 · 절대원칙 21 — 숫자만 봤으면 「들어갔다」로 끝났을 것이다)
const 시트닫기 = async () => {
  for (let i = 0; i < 5; i++) {
    const 닫았나 = await p.evaluate(() => {
      const b = [...document.querySelectorAll('button, [role="button"]')]
        .filter((x) => x.getBoundingClientRect().height > 8)
        .find((x) => /^(나중에 볼게요|닫기)$/.test((x.innerText || '').trim()))
      if (!b) return false; b.click(); return true
    })
    if (닫았나) { await p.waitForTimeout(500); continue }
    if (!(await p.locator('.sheet-mask').count())) break
    await p.keyboard.press('Escape'); await p.waitForTimeout(350)
  }
}
let n = 0
const 찍기 = async (이름) => {
  n++; const f = join(OUT, `${String(n).padStart(2, '0')}-${이름}.png`)
  await p.screenshot({ path: f }); return f
}

await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(2200)
await 시트닫기()

// ── ① 레시피 탭 ─────────────────────────────────────────────
await p.locator('.nav-item', { hasText: '레시피' }).first().click()
await p.waitForTimeout(1200)
await 시트닫기()

// ── ② «이름으로» 찾아 연다 ⛔「제일 큰 카드」로 고르지 않는다 — 다른 편이 잡힌다
const 열린이름 = await p.evaluate((이름) => {
  const 납작 = (s) => String(s || '').replace(/\s+/g, '')
  const 타깃 = 납작(이름)
  const 후보 = [...document.querySelectorAll('button, a, [role="button"], li, article')]
    .map((e) => ({ e, t: 납작(e.innerText), r: e.getBoundingClientRect() }))
    .filter((x) => x.t.includes(타깃) && x.r.width > 60 && x.r.height > 60)
  if (!후보.length) return null
  후보.sort((a, c) => a.r.width * a.r.height - c.r.width * c.r.height)   // 가장 «작은» 것 = 그 카드 자체
  const 고른것 = 후보[0]
  고른것.e.click()
  return 고른것.e.innerText.trim().slice(0, 40)
}, 찾을이름)
await p.waitForTimeout(1400)
await 시트닫기()
await 찍기('레시피상세')

// ── ③ 「레시피 꾸미기」 ⛔ /^꾸미기$/ 로 찾으면 안 걸린다(단추 이름이 「레시피 꾸미기」다)
let 레꾸들어감 = false
for (let i = 0; i < 3; i++) {
  const 눌렀나 = await p.evaluate(() => {
    const b2 = [...document.querySelectorAll('button, [role="button"]')]
      .filter((x) => x.getBoundingClientRect().height > 8)
      .find((x) => /^(꾸미기|레시피 꾸미기)$/.test((x.innerText || '').trim()))
    if (!b2) return false; b2.click(); return true
  })
  if (!눌렀나) break
  레꾸들어감 = true
  await p.waitForTimeout(1200)
}
await 시트닫기()
await p.waitForTimeout(700)
await 찍기('레꾸화면')

// ── ③-b 🍂 「프레임」 탭 → 가을 프레임 붙이기
//    ⛔ 자산 열쇠(pf_au01…)로 찾지 않는다 — 화면엔 그 글자가 없다. «그려진 이름표»로 찾는다.
const 프레임탭 = await p.evaluate(() => {
  const b = [...document.querySelectorAll('button, [role="button"]')]
    .find((x) => (x.innerText || '').trim() === '프레임')
  if (!b) return false; b.click(); return true
})
await p.waitForTimeout(900)
await 찍기('프레임탭')

const 가을탭 = await p.evaluate(() => {
  const b = [...document.querySelectorAll('button, [role="button"], div, span')]
    .filter((x) => x.getBoundingClientRect().height > 8)
    .find((x) => /^가을 프레임$/.test((x.innerText || '').trim()))
  if (!b) return null
  b.click(); return (b.innerText || '').trim()
})
await p.waitForTimeout(900)
await 찍기('가을프레임')

// ── ④ 화면에 무엇이 있나 — ⛔이름을 짐작하지 않고 «그려진 글자»를 읽는다
const 화면 = await p.evaluate(() => {
  const 눌림 = [...document.querySelectorAll('button, [role="button"]')]
    .map((x) => (x.innerText || '').trim())
    .filter((t) => t && t.length <= 12)
  return { 탭: [...new Set(눌림)].slice(0, 40), 제목: document.title }
})

console.log('\n🎬 릴스용 레꾸 판 — 어디까지 갔나\n')
console.log(`   찾은 레시피 = ${열린이름 || '⛔ 못 찾음 (이름조각: ' + 찾을이름 + ')'}`)
console.log(`   레꾸 화면    = ${레꾸들어감 ? '✅ 들어감' : '⛔ 못 들어감'}`)
console.log(`   프레임 탭    = ${프레임탭 ? '✅' : '⛔ 못 찾음'}   가을 프레임 = ${가을탭 || '⛔ 못 찾음'}`)
console.log(`   화면의 단추  = ${화면.탭.join(' · ')}`)
console.log(`   📁 ${OUT}\n`)

await ctx.close(); await b.close(); srv.close()
if (!열린이름 || !레꾸들어감) process.exit(1)
