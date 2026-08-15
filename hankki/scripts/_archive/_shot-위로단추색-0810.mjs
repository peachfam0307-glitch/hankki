// 🎨 「위로」 단추 색 갈래 — 창업자 판정용 (2026-08-10 *"단추색 보여줘"*)
//
// ⭐ 테마 셋 «전부» 찍는다 — 창업자 2026-08-08 *"앱배경 우리 테마 3개라 다 잘어울려야해"*.
//    한 테마만 보고 고르면 다른 테마에서 묻히거나 튄다(형광펜 때 실제로 그랬다).
// ⭐ 색만 갈아 끼우고 **나머지는 진짜 앱 화면 그대로** — 배경·카드·하단바와 같이 봐야 판정이 된다.
// ⛔ 줄여서 보여주지 않는다(규칙 13) — 크롭해서 «실제 픽셀 그대로» 붙인다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(`${OUT}/단추색`, { recursive: true })

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const now = Date.now()
const state = { recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })), seedV: BASICS_VERSION }

// 갈래 — CSS 변수로만 쓴다(테마가 바뀌면 색도 따라 바뀐다)
const 갈래 = [
  { key: 'A', 이름: 'A · 지금 (흰 바탕)', bg: 'var(--surface)', line: '1px solid var(--line)', ink: 'var(--text)' },
  { key: 'B', 이름: 'B · 포인트색 채움', bg: 'var(--brown)', line: 'none', ink: '#fff' },
  { key: 'C', 이름: 'C · 진한 잉크 채움', bg: 'var(--text)', line: 'none', ink: 'var(--bg)' },
  { key: 'D', 이름: 'D · 흰 바탕 + 파란 화살표', bg: 'var(--surface)', line: '1px solid var(--brown)', ink: 'var(--brown)' },
]
const 테마 = [
  { key: 'greige', 이름: '그레이지 (기본)' },
  { key: 'cream', 이름: '크림' },
  { key: 'dark', 이름: '다크' },
]

const PORT = Number(process.env.PORT || 4335)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
const stop = () => { try { srv.kill() } catch { /* noop */ } }
process.on('exit', stop)
await new Promise((r) => setTimeout(r, 900))

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const url = `http://127.0.0.1:${PORT}/`

for (const t of 테마) {
  const ctx = await browser.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul' })
  await ctx.addInitScript({ content: SEED_COACH_SEEN })
  const page = await ctx.newPage()
  await page.goto(url)
  await page.evaluate(([s, th]) => {
    localStorage.setItem('hankki:v1', JSON.stringify(s))
    localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki-theme', th)
  }, [state, t.key])
  await page.goto(url)
  await page.waitForTimeout(1400)
  await page.getByText('레시피', { exact: true }).last().click()
  await page.waitForTimeout(900)
  await page.evaluate(() => {
    const l = document.querySelectorAll('.app-frame .screen')
    l[l.length - 1].scrollTop = 1400
  })
  await page.waitForTimeout(600)

  for (const g of 갈래) {
    // 단추 색만 갈아 끼운다 — 위치·크기·그림자는 그대로
    await page.evaluate((g) => {
      const b = document.querySelector('[data-totop]')
      if (!b) return
      b.style.background = g.bg
      b.style.border = g.line
      const svg = b.querySelector('svg')
      if (svg) svg.setAttribute('stroke', g.ink)
    }, g)
    await page.waitForTimeout(200)
    // 카드 조금 + 단추 + 하단바가 같이 보이게 잘라 찍는다
    await page.screenshot({ path: `${OUT}/단추색/${t.key}-${g.key}.png`, clip: { x: 0, y: 640, width: 411, height: 251 } })
  }
  await ctx.close()
}

// 판 — 갈래(가로) × 테마(세로). 캡처는 실제 픽셀 1:1 로 붙인다(줄이면 판정이 안 된다).
const 칸 = (t, g) => `
  <figure>
    <img src="단추색/${t.key}-${g.key}.png" width="411" height="251" alt="">
    <figcaption>${g.이름}</figcaption>
  </figure>`
const html = `<title>「위로」 단추 색 — 갈래 ${갈래.length}</title>
<style>
  body { margin:0; background:#f4f2ee; color:#2E2823; font-family: -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif; }
  .wrap { max-width: 1760px; margin: 0 auto; padding: 28px 20px 60px; }
  h1 { font-size: 26px; margin: 0 0 6px; letter-spacing: -.02em; }
  .lede { color:#6B6157; font-size:15px; margin:0 0 26px; }
  h2 { font-size: 18px; margin: 34px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #E1DAD0; }
  .row { display: flex; gap: 14px; flex-wrap: wrap; }
  figure { margin: 0; }
  figure img { display:block; border:1px solid #DDD5CA; border-radius: 10px; }
  figcaption { font-size: 13px; color:#6B6157; margin-top: 7px; font-weight: 700; }
</style>
<div class="wrap">
  <h1>「위로」 단추 색 — 갈래 ${갈래.length}</h1>
  <p class="lede">실제 앱 화면이야(줄이지 않은 실제 픽셀). 색만 갈아 끼웠고 자리·크기는 다 같아.</p>
  ${테마.map((t) => `<h2>${t.이름}</h2><div class="row">${갈래.map((g) => 칸(t, g)).join('')}</div>`).join('')}
</div>`
writeFileSync(`${OUT}/단추색판.html`, html)

// 판을 한 장 그림으로 — 폰에서 바로 보게
const ctx2 = await browser.newContext({ viewport: { width: 1800, height: 1200 }, deviceScaleFactor: 2 })
const p2 = await ctx2.newPage()
await p2.goto(`file://${OUT}/단추색판.html`)
await p2.waitForTimeout(900)
await p2.screenshot({ path: `${OUT}/위로단추-색갈래.png`, fullPage: true })
await ctx2.close()
await browser.close(); stop()
console.log(`\n✅ ${갈래.length}갈래 × ${테마.length}테마 = ${갈래.length * 테마.length}장 → ${OUT}/위로단추-색갈래.png\n`)
