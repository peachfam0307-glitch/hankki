// 🧾 냉장고 안내 두 자리 — 「영수증만 찍으면 저절로」로 고친 실물을 «열어서» 본다 (2026-08-20)
//
// 📮 창업자 = *"네가 냉장고가 약하다고 해서.. 탭 개선 말한거였거든"*
// ⭐ 탭 갈래 셋이 다 «뭔가를 잃어서» 창업자가 못 골랐다(*"무조건 괜찮다하는게 없엉"*).
//    → 잃는 게 «진짜로» 0인 자리를 찾았다 = **화면이 하는 «말»**.
//
// 📸 절대원칙 21 = 보여주기 «전»에 내가 실물을 열어서 본다.
// ⛔ 두 자리는 «뜨는 조건»이 다르다 —
//    ① 코치마크  = 장보기 탭 «첫 방문»에만 (SEED_COACH_SEEN 을 «안» 넣어야 뜬다)
//    ② 빈 냉장고 = 재료가 «0개»일 때만 (시드에 재료가 있으면 안 뜬다 → 비우고 연다)
//
// 실행: cd /home/user/hankki/hankki && node scripts/_shot-냉장고안내-0820.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/냉장고안내'
mkdirSync(OUT, { recursive: true })
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

const 열기 = async (ctx) => {
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log('  ⚠️ pageerror:', String(e.message || e).split('\n')[0]))
  await page.goto('http://127.0.0.1:4396/hankki/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(900)
  return page
}
const 장보기로 = async (page) => {
  await page.evaluate(() => {
    const 칸 = [...document.querySelectorAll('.bottom-nav .nav-item')]
      .find((e) => ([...e.querySelectorAll('span')].pop()?.textContent || '').trim() === '장보기')
    칸?.click()
  })
  await page.waitForTimeout(700)
}

// ─────────────────────────────────────────────────────────
// ① 코치마크 — «첫 방문»이라야 뜬다 (SEED_COACH_SEEN 을 안 넣는다)
// ─────────────────────────────────────────────────────────
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
  const page = await 열기(ctx)
  await 장보기로(page)

  // 코치는 여러 장이라 「냉장고」 장까지 넘긴다
  let 찾음 = ''
  for (let i = 0; i < 6; i++) {
    찾음 = await page.evaluate(() => {
      const t = document.body.innerText
      return /영수증만 찍으면 재료가 저절로/.test(t) ? '새 문구' : (/재료를 넣으면 유통기한/.test(t) ? '⛔옛 문구' : '')
    })
    if (찾음) break
    // ⛔⛔ 처음엔 「다음」 «버튼»을 찾았는데 **그런 버튼이 없다** — 코치는 *"탭해서 다음"* 이라
    //    **화면 아무 데나 탭**해야 넘어간다. 그래서 첫 장에 멈춘 채 「코치가 안 떴다」로 잘못 읽었다.
    //    📌 규칙 18 — 「없다」가 아니라 «내가 넘기는 방법을 몰랐다».
    await page.mouse.click(195, 420)
    await page.waitForTimeout(600)
  }
  await page.screenshot({ path: join(OUT, '1-코치.png') })
  console.log(`① 코치마크 — ${찾음 || '⛔ 못 찾음(코치가 안 떴을 수 있다)'}`)
  await ctx.close()
}

// ─────────────────────────────────────────────────────────
// ② 빈 냉장고 — 재료를 «비우고» 연다
// ─────────────────────────────────────────────────────────
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
  let page = await 열기(ctx)

  // ⛔ page.reload() 금지 — 저장값이 시드로 덮인다(check-mistakes ⑧). 비우고 «새 탭»으로 연다.
  const 뺀수 = await page.evaluate(() => {
    const st = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    const n = (st.pantry || []).length
    st.pantry = []
    localStorage.setItem('hankki:v1', JSON.stringify(st))
    return n
  })
  await page.close()
  page = await 열기(ctx)
  await 장보기로(page)
  await page.evaluate(() => {
    const 냉 = [...document.querySelectorAll('.seg')].find((e) => (e.textContent || '').trim() === '냉장고')
    냉?.click()
  })
  await page.waitForTimeout(700)

  const 잰값 = await page.evaluate(() => {
    const t = document.body.innerText
    return {
      새문구: /영수증만 찍으면 집에 있는 재료가 저절로/.test(t),
      옛문구: /집에 있는 재료를 넣어두세요/.test(t),
      가로넘침: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    }
  })
  await page.screenshot({ path: join(OUT, '2-빈냉장고.png') })
  console.log(`② 빈 냉장고 (재료 ${뺀수}개 비움) — ${잰값.새문구 ? '새 문구 ✅' : (잰값.옛문구 ? '⛔옛 문구' : '⛔둘 다 없음')}`
    + (잰값.가로넘침 ? ' · ⛔가로 넘침' : ''))
  await ctx.close()
}

await b.close(); srv.close()
console.log(`\n📁 ${OUT}`)
