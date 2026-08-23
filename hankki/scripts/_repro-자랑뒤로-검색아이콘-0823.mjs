// 🐛🐛 재현판 — 창업자 할일 **1번·4번** (2026-08-23)
//
// 📮 1번 = *"레꾸자랑에서 고르고하고 뒤로가면 홈으로 감."*
// 📮 4번 = *"홈에서 검색하면 아래 음식아이콘 옛날꺼."*
//
// ⛔⛔ 심장 둘 — 「보이는 것」이 아니라 «앱이 실제로 쓰는 값»을 잰다(절대원칙 30)
//
//   ① 자랑 뒤로가기 = 「시트가 «히스토리 칸»을 안 쌓는다」
//      🔢 뿌리 = `BragScreen.jsx:219` 가 `.sheet-mask` 를 **맨손으로** 그린다.
//         `useLayerBack`(＝`nav.openModal`)을 안 부르니 시트는 «뒤로가기 층»에 없다.
//         → 뒤로가기가 시트를 못 보고 `App.jsx:216` 4번 갈래(「다른 탭이면 홈으로」)로 떨어진다.
//      ⭐ 재는 법 = 뒤로 누른 «뒤»에 **하단바에서 켜진 탭 이름**을 읽는다. 「홈」이면 샌 것이다.
//
//   ② 검색 재료 아이콘 = 「재료 칸인데 «요리 규칙»을 부른다」
//      🔢 뿌리 = `SearchScreen.jsx:97` = `FoodIcon name={c.icon || guessFoodIcon(c.name)}`
//         `INGREDIENT_CHIPS`(`seed.js:48`)엔 `icon` 이 **한 줄도 없다** → 늘 `guessFoodIcon` 이 뽑힌다.
//         「계란」을 «요리 이름»으로 판정하니 창업자가 뽑은 재료컷(`ig_`)이 붙을 리가 없다.
//      ⭐ 2026-08-20 `_repro-재료찾기아이콘-0820.mjs` 가 **같은 자리를 이미 짚었다** — 그때 안 고쳤다.
//      ⭐ 재는 법 = 화면의 «실제 그림 파일 이름»을 읽는다. 코드를 눈으로 읽고 판정하지 않는다
//         (박힌 icon 이 규칙을 덮는 구조라 코드만 봐선 모른다 · v10.76).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-자랑뒤로-검색아이콘-0823.mjs
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
await new Promise((r) => srv.listen(4386, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
await page.goto('http://127.0.0.1:4386/hankki/', { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(900)

const 칸 = []
const 잰다 = (이름, 참, 실제) => { 칸.push({ 이름, 참, 실제 }) }

// 지금 켜진 탭 이름 — 하단바에서 «켜진» 칸의 글자를 읽는다(앱이 쓰는 그 표시)
const 켜진탭 = () => page.evaluate(() => {
  const on = [...document.querySelectorAll('.bottom-nav .nav-item')]
    .find((e) => e.classList.contains('on') || e.getAttribute('aria-current') === 'page' || /\bactive\b/.test(e.className))
  return (on?.innerText || '').trim().split('\n')[0] || '(모름)'
})
const 탭으로 = async (글자) => {
  await page.locator('.bottom-nav .nav-item').filter({ hasText: 글자 }).first().click()
  await page.waitForTimeout(700)
}

// ─────────────────────────────────────────────────────────────
// ① 레꾸자랑 — 고르고 뒤로가면 어디로 가나
// ─────────────────────────────────────────────────────────────
await 탭으로('자랑')
const 자랑탭이름 = await 켜진탭()
잰다('①-a 자랑 탭이 켜졌다', true, 자랑탭이름 !== '홈' && 자랑탭이름 !== '(모름)')

const 카드 = page.locator('[aria-label$="자랑하기"]')
const 카드수 = await 카드.count()
잰다('①-b 자랑할 레시피가 하나라도 있다', true, 카드수 > 0)

if (카드수 > 0) {
  await 카드.first().click()
  await page.waitForTimeout(600)
  const 시트떴나 = await page.locator('.sheet-mask').count()
  잰다('①-c 고르면 선택 시트가 뜬다', true, 시트떴나 > 0)

  // ⭐ 여기가 심장 — 뒤로가기 한 번
  await page.goBack()
  await page.waitForTimeout(800)
  const 시트남았나 = await page.locator('.sheet-mask').count()
  const 뒤로간탭 = await 켜진탭()
  잰다('①-d 뒤로가면 시트가 닫힌다', true, 시트남았나 === 0)
  잰다('①-e ⭐뒤로가도 «자랑» 탭에 남는다 (홈으로 새면 안 된다)', true, 뒤로간탭 !== '홈')
  칸.push({ 이름: '   └ 실제로 간 곳', 참: '자랑', 실제: 뒤로간탭, 글: true })
}

// ─────────────────────────────────────────────────────────────
// ② 검색 — 「재료로 찾기」가 재료컷을 쓰나
// ─────────────────────────────────────────────────────────────
await 탭으로('홈')
const 검색열기 = page.locator('[class*="search"], [aria-label*="검색"]').first()
if (await 검색열기.count()) { await 검색열기.click(); await page.waitForTimeout(900) }

const 재료칸 = await page.evaluate(() => {
  const 머리 = [...document.querySelectorAll('*')].find((e) => e.textContent.trim() === '재료로 찾기' && e.children.length === 0)
  const 격자 = 머리?.nextElementSibling
  if (!격자) return null
  return [...격자.querySelectorAll('button')].map((btn) => {
    const img = btn.querySelector('img')
    return {
      이름: btn.querySelector('span')?.textContent?.trim() || '',
      그림: img ? (img.getAttribute('src') || '').split('/').pop().replace(/[?#].*$/, '') : (btn.querySelector('svg') ? 'SVG 도형' : '없음'),
    }
  })
})
잰다('②-a 「재료로 찾기」 칸을 찾았다', true, !!재료칸 && 재료칸.length > 0)

if (재료칸) {
  // ⭐ 심장 = 재료컷(`ig_`)이 붙어야 한다. SVG 도형·요리컷(`fe_`·`fh_`…)이면 옛것이다.
  const 재료컷 = 재료칸.filter((c) => /^ig_/.test(c.그림)).length
  잰다(`②-b ⭐${재료칸.length}칸 «전부» 재료컷(ig_)이다`, 재료칸.length, 재료컷)
  const 도형 = 재료칸.filter((c) => c.그림 === 'SVG 도형').length
  잰다('②-c 옛 SVG 도형이 하나도 없다', 0, 도형)
  for (const c of 재료칸) 칸.push({ 이름: `   └ ${c.이름}`, 참: 'ig_…', 실제: c.그림, 글: true })
}

// ─────────────────────────────────────────────────────────────
const 통과 = 칸.filter((c) => !c.글 && c.참 === c.실제).length
const 전체 = 칸.filter((c) => !c.글).length
console.log('\n🐛 재현 — 1번(자랑 뒤로가기) · 4번(검색 재료 아이콘)\n')
for (const c of 칸) {
  if (c.글) { console.log(`      ${c.이름}  =  ${c.실제}`); continue }
  console.log(`${c.참 === c.실제 ? '  ✅' : '  ⛔'} ${c.이름}  기대 ${c.참} · 실제 ${c.실제}`)
}
console.log(`\n  ${통과 === 전체 ? '✅' : '⛔'} ${통과}/${전체}\n`)

await b.close(); srv.close()
process.exit(통과 === 전체 ? 0 : 1)
