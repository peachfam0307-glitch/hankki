// 🎨 글자 색 칩이 «몇 개 그려지고 몇 개가 실제로 보이나»
//
// ⛔⛔ 2026-08-07 — 내가 코드를 `key: '…'` 정규식으로 세서 **「4색뿐」이라고 창업자에게 잘못 말했다.**
//    `TEXT_COLORS` 는 옛 4색 ＋ `...STICKER_COLORS.map(...)` 스프레드라 **리터럴 key 가 없는 11개**를 놓쳤다.
//    📌 규칙 18 — **「없다」는 «내 확인 방식»부터 의심한다.** 그래서 이번엔 «화면에 그려진 것»을 센다.
// ⭐ 그러면 창업자 제보(*"글자색도 스티커처럼 추가되면 좋겠어"*)의 정체는
//    「없다」가 아니라 **「가로 스크롤에 밀려 안 보인다」**일 수 있다 → **보이는 개수**까지 잰다.
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
await new Promise((r) => srv.listen(4407, r))
const { BASICS_VERSION } = await import('../src/data/basics.js')

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await (await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2 })).newPage()
await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, { recipes: [], seedV: BASICS_VERSION, diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor: [] }] })
await page.goto('http://127.0.0.1:4407/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1100)
// ⚠️ 「글자」는 하단 세그먼트가 아니라 «탭 안의 갈래 칩»이다 — 먼저 「일꾸」로 들어가야 보인다
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)
await page.getByRole('button', { name: '글자', exact: true }).last().click(); await page.waitForTimeout(700)

// 글자를 하나 넣는다
const add = page.locator('.decor-drawer button').filter({ hasText: /^글자 넣기$/ }).first()
await add.click(); await page.waitForTimeout(800)
const ta = page.locator('.hk-sheet textarea, .hk-sheet input').first()
if (await ta.count()) { await ta.fill('맛있겠다'); await page.waitForTimeout(300) }
const save = page.locator('.hk-sheet button').filter({ hasText: /저장|확인|넣기|완료/ }).first()
if (await save.count()) { await save.click(); await page.waitForTimeout(900) }
const stk = page.locator('.decor-stage [style*="rotate"]').last()
if (await stk.count()) { await stk.click({ force: true }); await page.waitForTimeout(800) }

const r = await page.evaluate(() => {
  const chips = [...document.querySelectorAll('[aria-label^="글자색"]')]
  if (!chips.length) return null
  const row = chips[0].parentElement
  const rb = row.getBoundingClientRect()
  // ⭐ 「보인다」 = 그 칩이 스크롤 칸 «안»에 온전히 들어와 있다
  const vis = chips.filter((c) => {
    const b = c.getBoundingClientRect()
    return b.left >= rb.left - 1 && b.right <= rb.right + 1 && b.width > 0
  })
  return {
    전체: chips.length, 보이는것: vis.length,
    줄폭: Math.round(rb.width), 칩폭: Math.round(chips[0].getBoundingClientRect().width),
    넘치는폭: Math.round(row.scrollWidth - row.clientWidth),
    색: chips.map((c) => getComputedStyle(c).backgroundColor),
  }
})
if (!r) { console.log('⛔ 글자색 칩을 못 찾았다 — 검사 방식부터 볼 것'); await b.close(); srv.close(); process.exit(1) }
console.log(`🎨 글자색 칩 = 그려진 것 ${r.전체}개 · «한눈에 보이는 것» ${r.보이는것}개`)
console.log(`   줄 폭 ${r.줄폭}px · 칩 ${r.칩폭}px · 오른쪽으로 밀린 폭 ${r.넘치는폭}px`)
const uniq = [...new Set(r.색)]
console.log(`   실제로 그려진 «서로 다른» 색 = ${uniq.length}개`)
if (r.보이는것 < r.전체) console.log(`   ⛔ ${r.전체 - r.보이는것}개는 «가로로 밀려» 안 보인다 — 「색이 몇 개 없다」로 읽힌다`)
else console.log('   ✅ 다 보인다')
await b.close(); srv.close()
