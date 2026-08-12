// 🎬 상세 꾸미기 «움직이는» 판 — 창업자 2026-08-08 *"움직이는거 한번 보고싶은데"*
//   ⭐ CSS 를 옮겨 흉내내지 않고 **진짜 앱 화면을 여러 프레임 찍는다.**
//      글꼴·색·크기가 폰에서 보는 것과 «같다»(옮겨 그리면 어디선가 어긋난다).
//   ⚠️ 주기가 서로 다르다 — 냠냠 1.6초 · 쿵착지 1.9초 · 맛있는것들 3초.
//      3초를 담으면 쿵착지는 1.6번 돈다. 루프가 딱 안 맞지만 **앱도 그렇다**(정직한 그림).
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/frames'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4364, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const N = 30, STEP = 100   // 30프레임 × 100ms = 3초
let bad = 0

for (const [theme, tname] of [['greige', '그레이지'], ['dark', '다크']]) {
  const page = await b.newPage({ viewport: { width: 360, height: 1400 }, deviceScaleFactor: 2 })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
  await page.addInitScript((a) => {
    localStorage.setItem('hankki:v1', JSON.stringify(a.s)); localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1'); localStorage.setItem('hankki-theme', a.theme)
    for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
  }, { s: { recipes: [], seedV: BASICS_VERSION }, theme })
  await page.goto('http://127.0.0.1:4364/hankki/?decor=final', { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  await page.locator('.grid-card').first().click()
  await page.waitForTimeout(800)

  // 찍을 두 자리를 «여백째» 감싼다 — ⛔요소만 찍으면 밖으로 나간 효과 조각이 잘린다(한 번 당했다)
  await page.evaluate(() => {
    const mk = (el, id, pad) => {
      const w = document.createElement('div'); w.id = id
      w.style.cssText = `padding:${pad};background:var(--bg)`
      el.parentNode.insertBefore(w, el); w.appendChild(el)
    }
    const head = [...document.querySelectorAll('.sec-head')].find((h) => /만드는 법/.test(h.textContent))
    mk(head, 'shot-head', '10px 0 6px')
    mk(document.querySelector('.done-strip'), 'shot-done', '26px 0 10px')
  })

  for (const [sel, name] of [['#shot-head', 'head'], ['#shot-done', 'done']]) {
    const el = page.locator(sel)
    if (!(await el.count())) { bad++; console.log(`   ⛔ ${tname}/${name} — 자리를 못 찾았다`); continue }
    // ⛔⛔ **찍는 데 걸리는 시간을 «재야» 한다.**
    //    screenshot() 자체가 오래 걸리면 실제 간격이 STEP 보다 커지는데, 재생은 STEP 으로 하니
    //    **판이 앱보다 빨라진다** — 앱은 멀쩡한데 「너무 빠르다」로 보인다.
    //    (창업자 2026-08-08 "다됐어요 저 속도야?? 너무 빨라.." → 이걸 재서 갈랐다)
    const t0 = Date.now()
    for (let i = 0; i < N; i++) {
      await el.screenshot({ path: `${OUT}/${theme}-${name}-${String(i).padStart(2, '0')}.png` })
      await page.waitForTimeout(STEP)
    }
    const real = Math.round((Date.now() - t0) / N)
    const warn = real > STEP * 1.15 ? ` ⛔ 재생도 ${real}ms 로 해야 한다(안 그러면 ${(real / STEP).toFixed(1)}배 빨라 보인다)` : ''
    console.log(`   ✅ ${tname}/${name} — ${N}프레임 · 실제 간격 ${real}ms${warn}`)
  }
  if (errors.length) { bad++; console.log(`   ⛔ ${tname} — pageerror ${errors.length}`) }
  await page.close()
}

console.log(`\n   ${bad ? `⛔ 문제 ${bad}건` : '✅ pageerror 0'}`)
await b.close(); srv.close()
console.log(`📁 ${OUT}/`)
