// 🥕 냉장고 「재료 담기」 아이콘 픽커 — 재료 갈래가 맨 위로 왔나 (창업자 폰 제보 · 2026-08-16)
//   📮 창업자 *"냉장고에 유통기한넣을때 아이콘바꾸는거 **음식이 먼저다떠**"*
//   📮 *"장보기는 체크표시가 뜨지 아이콘이 안떠 **냉장고재료함에만 아이콘이 뜨지.**"* (→ 고칠 곳은 한 곳)
//
//   ⭐⭐ 심장 = **「갈래 «제목»이 실제로 어떤 차례로 그려지나」를 DOM 에서 읽는다.**
//      ⛔ 「채소가 있나」를 물으면 안 된다 — 옛 판에도 «있었다». 밑에 있었을 뿐이다(규칙 18 ⓘ).
//         물어야 할 건 **「몇 번째냐」**다.
//   ⭐ 그리고 **레시피 편집(요리 자리)은 안 바뀌었나**를 같은 판에서 같이 잰다.
//      한쪽을 고치다 다른 쪽을 뒤집으면 그게 더 큰 사고다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
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
await new Promise((r) => srv.listen(4381, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
// ⛔ `/opt/pw-browsers/chromium` 를 박지 않는다 — 이 컨테이너에만 있는 길이라 CI 가 죽는다
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
let fail = 0
const 죽자 = async (why, page, name) => {
  console.log(`  ⛔ ${why}`); fail++
  if (page) await page.screenshot({ path: join(OUT, `냉장고아이콘-실패-${name}.png`), fullPage: false })
}

const 새판 = async () => {
  const p = await b.newPage({ viewport: { width: 390, height: 860 }, deviceScaleFactor: 2 })
  p.on('pageerror', (e) => console.log('  ⛔ pageerror:', String(e.message || e).split('\n')[0]))
  await p.addInitScript(SEED_COACH_SEEN)
  await p.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1') })
  await p.goto('http://127.0.0.1:4381/hankki/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(1100)
  return p
}

// 픽커 시트가 열린 뒤 갈래 «제목»을 그려진 차례대로 읽는다
const 갈래순서 = (page) => page.$$eval('.emoji-scroll .emoji-cat', (els) => els.map((e) => e.textContent.trim()))

console.log('🥕 냉장고 「재료 담기」 아이콘 픽커 — 갈래 차례\n')

// ── ① 냉장고: 장보기 탭 → 냉장고 → 재료 담기 → 아이콘 타일 ──────────────
const p1 = await 새판()
await p1.getByRole('button', { name: /장보기/ }).first().click().catch(() => {})
await p1.waitForTimeout(600)
// 「냉장고」 칸으로 (탭 이름은 화면 글자로 찾는다 — 코드 상수를 베끼지 않는다)
const 냉장고 = p1.getByText(/냉장고/).first()
if (await 냉장고.count()) { await 냉장고.click().catch(() => {}); await p1.waitForTimeout(600) }
// 재료 담기 열기
const 담기 = p1.getByText(/재료 담기|담기|추가/).first()
if (await 담기.count()) { await 담기.click().catch(() => {}); await p1.waitForTimeout(700) }

let 시트 = await p1.$('.wa-inp[placeholder*="재료 이름"]')
if (!시트) {
  await 죽자('「재료 담기」 시트를 못 열었다 — 화면 경로가 바뀌었나(규칙 18: 「없다」가 아니라 「내가 못 열었다」)', p1, '경로')
} else {
  await p1.locator('.emoji-tile').first().click()
  await p1.waitForTimeout(700)
  const 순서 = await 갈래순서(p1)
  console.log('  냉장고 픽커 차례 (앞 8개):', 순서.slice(0, 8).join(' · '))
  const 채소 = 순서.indexOf('채소')
  const 밥 = 순서.indexOf('밥')
  if (채소 < 0) await 죽자('「채소」 갈래가 아예 없다', p1, '채소없음')
  else if (채소 > 3) await 죽자(`「채소」가 ${채소 + 1}번째다 — 재료가 아직 뒤에 있다`, p1, '뒤에있음')
  else console.log(`  ✅ 「채소」가 ${채소 + 1}번째 — 재료가 앞으로 왔다`)
  if (밥 >= 0 && 밥 < 채소) await 죽자(`요리 갈래(밥)가 ${밥 + 1}번째로 재료보다 앞이다`, p1, '요리먼저')
  else if (밥 < 0) await 죽자('요리 갈래(밥)가 사라졌다 — 지우면 안 된다(남은 찌개를 넣을 수도 있다)', p1, '요리사라짐')
  else console.log(`  ✅ 요리 갈래도 살아 있다 — 「밥」이 ${밥 + 1}번째(재료 뒤)`)
  await p1.screenshot({ path: join(OUT, '냉장고-아이콘-새판.png') })
}

// ── ② 레시피 편집(요리 자리) — 여긴 «안 바뀌어야» 한다 ────────────────
const p2 = await 새판()
await p2.getByRole('button', { name: /새 레시피|쓰기|추가/ }).first().click().catch(() => {})
await p2.waitForTimeout(700)
const 타일 = await p2.$('.emoji-tile')
if (!타일) {
  console.log('  ⚠️ 레시피 편집 화면의 아이콘 타일을 못 찾았다 — 이 칸은 판정하지 않는다(규칙 18)')
} else {
  await 타일.click(); await p2.waitForTimeout(700)
  const 순서2 = await 갈래순서(p2)
  console.log('  레시피 픽커 차례 (앞 6개):', 순서2.slice(0, 6).join(' · '))
  const 첫갈래 = 순서2.find((s) => !/최근에 쓴 것/.test(s))
  if (첫갈래 !== '밥') await 죽자(`레시피 픽커 첫 갈래가 「${첫갈래}」다 — 요리 자리는 그대로여야 한다`, p2, '요리자리바뀜')
  else console.log('  ✅ 레시피 픽커는 그대로 — 첫 갈래가 「밥」')
  await p2.screenshot({ path: join(OUT, '레시피-아이콘-그대로.png') })
}

await b.close(); srv.close()
console.log(fail ? `\n⛔ ${fail}칸 실패` : '\n✅ 통과 — 냉장고는 재료 먼저, 레시피는 그대로')
process.exit(fail ? 1 : 0)
