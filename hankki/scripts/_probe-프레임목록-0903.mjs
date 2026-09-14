// 🖼 **레꾸 「프레임」 탭에 무엇이 «몇 개» 있나 — 화면에서 읽는다** (2026-09-03)
//
// 📮 창업자 = *"가을프레임으로 꾸미기 하나 만들면 어떨까."*
// ⛔ 자산 열쇠(`pf_au01`…)로 짐작하지 않는다 — 유저가 보는 건 «이름표»다(절대원칙 30).
//    실제로 「가을 프레임」을 누르니 화면엔 **「가을의 정원 세트」**(그릇 4컷)가 떠 있었다 — 다른 묶음이다.
// ⛔ 브라우저 경로를 판에 박지 않는다 — `SMOKE_CHROMIUM` 만 읽는다
//
// ⚠️⚠️ **정직하게 — 이 판은 «훑개»지 «잣대»가 아니다.**
//    돌려보니 서랍 «밖» 글자까지 딸려왔다(「한끼 기본 레시피」·「#한그릇」·「요리모드 시작」).
//    굴릴 자리를 「세로로 넘치는 것 중 제일 큰 것」으로 고르는데, 그게 서랍이 아닐 때가 있다.
//    ⭐ 찾은 것 = 가을 프레임 · 출시기념 여름 · 기본 · 요리 프레임 · 음식 프레임
//       ＋ 화면 캡처에서 본 「가을의 정원 세트」(특별 선물 · 그릇 4컷) — **이건 이 판이 못 잡았다.**
//    ⛔ 그러니 이 출력을 「프레임이 이게 전부다」로 쓰지 말 것. 개수를 세는 데 쓰지 말 것.
//    ✅ 「어떤 이름표가 있나」를 눈으로 훑는 용도로만. 판정은 캡처를 «열어서»(절대원칙 21).
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
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p = await ctx.newPage()

const 시트닫기 = async () => {
  for (let i = 0; i < 5; i++) {
    const 닫았나 = await p.evaluate(() => {
      const b = [...document.querySelectorAll('button, [role="button"]')]
        .filter((x) => x.getBoundingClientRect().height > 8)
        .find((x) => /^(나중에 볼게요|닫기)$/.test((x.innerText || '').trim()))
      if (!b) return false; b.click(); return true
    })
    if (닫았나) { await p.waitForTimeout(450); continue }
    if (!(await p.locator('.sheet-mask').count())) break
    await p.keyboard.press('Escape'); await p.waitForTimeout(300)
  }
}

await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(2200); await 시트닫기()
await p.locator('.nav-item', { hasText: '레시피' }).first().click()
await p.waitForTimeout(1200); await 시트닫기()
await p.evaluate(() => {
  const 납작 = (s) => String(s || '').replace(/\s+/g, '')
  const c = [...document.querySelectorAll('button, a, [role="button"], li, article')]
    .map((e) => ({ e, t: 납작(e.innerText), r: e.getBoundingClientRect() }))
    .filter((x) => x.t.includes('뚝딱버섯') && x.r.width > 60 && x.r.height > 60)
  c.sort((a, z) => a.r.width * a.r.height - z.r.width * z.r.height)
  c[0]?.e.click()
})
await p.waitForTimeout(1400); await 시트닫기()
for (let i = 0; i < 3; i++) {
  const ok = await p.evaluate(() => {
    const b2 = [...document.querySelectorAll('button, [role="button"]')]
      .filter((x) => x.getBoundingClientRect().height > 8)
      .find((x) => /^(꾸미기|레시피 꾸미기)$/.test((x.innerText || '').trim()))
    if (!b2) return false; b2.click(); return true
  })
  if (!ok) break
  await p.waitForTimeout(1100)
}
await 시트닫기()
await p.evaluate(() => {
  const b = [...document.querySelectorAll('button, [role="button"]')].find((x) => (x.innerText || '').trim() === '프레임')
  b?.click()
})
await p.waitForTimeout(1000)

// ⭐ 서랍을 «끝까지» 굴려서 묶음 이름표를 전부 모은다 (한 화면엔 몇 개만 보인다)
const 묶음 = await p.evaluate(async () => {
  const 잠깐 = (ms) => new Promise((r) => setTimeout(r, ms))
  // 굴릴 수 있는 자리 = 세로로 넘치는 것 중 제일 큰 것
  const 굴릴것 = [...document.querySelectorAll('div, section, ul')]
    .filter((e) => e.scrollHeight > e.clientHeight + 40 && e.clientHeight > 120)
    .sort((a, z) => z.clientHeight - a.clientHeight)[0]
  const 모음 = new Set()
  const 훑기 = () => {
    for (const e of document.querySelectorAll('div, span, h2, h3, p, button')) {
      const t = (e.innerText || '').trim()
      if (!t || t.length > 18 || t.includes('\n')) continue
      if (/프레임|세트|접시|그릇|여름|가을|기본|요리|음식/.test(t)) 모음.add(t)
    }
  }
  훑기()
  if (굴릴것) {
    for (let y = 0; y < 잘라내기(굴릴것.scrollHeight, 6000); y += 260) {
      굴릴것.scrollTop = y; await 잠깐(160); 훑기()
    }
  }
  function 잘라내기 (v, max) { return Math.min(v, max) }
  return [...모음]
})

console.log('\n🖼 레꾸 「프레임」 탭 — 무엇이 있나\n')
for (const m of 묶음) console.log(`   · ${m}`)
console.log(`\n   모두 ${묶음.length}개\n`)
await ctx.close(); await b.close(); srv.close()
