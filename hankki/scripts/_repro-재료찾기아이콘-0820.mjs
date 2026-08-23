// 🥕 검색 화면 「재료로 찾기」가 «옛 도형»을 쓰던 것 — 재현판 (2026-08-20)
//
// 📮 창업자 = *"저 재료로 찾기는 왜 옛날 아이콘이지??????"*
//
// ⭐⭐ v10.96 과 «같은 뿌리»다 — 그때는 냉장고 픽커가 옛 SVG 도형만 보여줬고
//    창업자가 *"근데 우리 이거 아이콘 내가 새로 다 뽑은걸로 기억하는데"* · *"다 어디갔어?????"* 라고 잡았다.
//    그때 고친 건 **냉장고(PantryView)** 였고, **검색 화면은 손대지 않았다.**
//
// ⛔ 심장 = 「재료 칸인데 «재료 규칙»(guessIngredientIcon)이 아니라 «요리 규칙»(guessFoodIcon)을 부른다」
//    `SearchScreen.jsx:97` = FoodIcon name={c.icon || guessFoodIcon(c.name)}
//    → 「계란」을 «요리 이름»으로 판정하니 창업자가 뽑은 재료컷(ig_)이 붙을 리가 없다.
//
// ⭐ 재는 법 = 화면의 «실제 그림 파일 이름»을 읽는다(규칙 30 — 앱이 쓰는 그 값).
//    ⛔ 코드를 눈으로 읽고 판정하지 않는다. 박힌 icon 이 규칙을 덮는 구조라(v10.76) 코드만 봐선 모른다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-재료찾기아이콘-0820.mjs
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
await new Promise((r) => srv.listen(4382, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
await page.goto('http://127.0.0.1:4382/hankki/', { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(900)

// 검색 화면으로 — 하단바의 「가져오기」 옆이 아니라 홈의 검색창을 거친다
await page.locator('.bottom-nav .nav-item').filter({ hasText: '홈' }).first().click()
await page.waitForTimeout(700)
const 검색열기 = page.locator('[class*="search"], [aria-label*="검색"]').first()
if (await 검색열기.count()) { await 검색열기.click(); await page.waitForTimeout(900) }

const 칸 = await page.evaluate(() => {
  const 머리 = [...document.querySelectorAll('*')].find((e) => e.textContent.trim() === '재료로 찾기' && e.children.length === 0)
  if (!머리) return null
  const 격자 = 머리.nextElementSibling
  if (!격자) return null
  return [...격자.querySelectorAll('button')].map((btn) => {
    const 이름 = btn.querySelector('span')?.textContent?.trim() || ''
    const img = btn.querySelector('img')
    const svg = btn.querySelector('svg')
    return { 이름, 그림: img ? (img.getAttribute('src') || '').split('/').pop() : (svg ? 'SVG 도형' : '없음') }
  })
})

let bad = 0
console.log('\n🥕 검색 화면 「재료로 찾기」 — 화면이 실제로 그리는 그림')
if (!칸) { console.log('  ⛔ 「재료로 찾기」 칸을 못 찾았다'); bad++ }
else for (const c of 칸) {
  // ⭐ 창업자가 뽑은 재료컷은 `ig_` 접두어다(v10.96 · 171컷). 그 밖이면 재료컷이 아니다
  const 재료컷 = /^ig_/.test(c.그림)
  if (!재료컷) bad++
  console.log(`  ${재료컷 ? '✅' : '⛔'} ${c.이름.padEnd(8)} → ${c.그림}`)
}

await b.close(); srv.close()
console.log(bad ? `\n⛔ 재료컷이 아닌 칸 ${bad}개 — 창업자 재료 아이콘(ig_)이 안 붙고 있다` : '\n✅ 전부 창업자 재료컷(ig_)')
process.exit(bad ? 1 : 0)
