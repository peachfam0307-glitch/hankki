// 💰🔬 식비 «값 적기» 재현판 (2026-09-17 시제품 · hold)
//   📮 창업자 = *"품목별로 금액죽 적으면 아래 총합이 뜨게도 가능해?"* → *"직접 돌려보고 오류있나 해보고 나한테 보여줘"*
//   ⭐ 무엇을 재나 = ①값 적으면 합계가 «적은 것만» 더하나 ②「산 것만 식비로 적기」가 한 줄로 남나
//      ③백업→복원에 식비가 살아남나 ④일부러 잘못(0·글자·엄청 큰 수·값 적고 체크 안 함)을 굴린다
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4533, r))
let 통과 = 0; const 실패 = []
const 본다 = (이름, 참) => { if (참) { 통과++; console.log('  ✓', 이름) } else { 실패.push(이름); console.log('  ✗', 이름) } }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR' })
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1') } catch { /* noop */ } })
const p = await ctx.newPage()
const 오류 = []
p.on('pageerror', (e) => 오류.push(String(e)))
p.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|net::/.test(m.text())) 오류.push(m.text()) })
await p.goto('http://127.0.0.1:4533/hankki/', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(2600)
async function 치우기() { for (let i = 0; i < 12; i++) { const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first(); if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break; try { await 것.click({ timeout: 2000 }); await p.waitForTimeout(500) } catch { break } } }
await 치우기()
await p.locator('.bottom-nav .nav-item').filter({ hasText: '장보기' }).first().click()
await p.waitForTimeout(1000); await 치우기()

// ① 재료 셋 담기
for (const n of ['두부', '대파', '참치캔']) {
  await p.locator('input[placeholder*="살 재료"]').first().fill(n)
  await p.keyboard.press('Enter'); await p.waitForTimeout(350)
}
본다('재료 3줄 담김', await p.locator('.shop-row').count() === 3)

// ② 값 적기 — 두부 3,900 · 대파 2,500 · 참치캔은 «안 적는다»
async function 값적기(이름, 글) {
  const row = p.locator('.shop-row').filter({ hasText: 이름 }).first()
  await row.locator('button[aria-label*="값 적기"]').click(); await p.waitForTimeout(250)
  await row.locator('input[inputmode="numeric"]').fill(글)
  await p.keyboard.press('Enter'); await p.waitForTimeout(350)
}
await 값적기('두부', '3900'); await 값적기('대파', '2500')
await p.screenshot({ path: (process.env.OUT || '/tmp/claude-0') + '/식비값-합계.png', fullPage: true })
const 합계글 = (await p.locator('.sum-v').first().textContent().catch(() => '')) || ''
본다('합계 = 적은 것만 (6,400원)', 합계글.replace(/\s/g, '') === '6,400원')
본다('「값 적은 것 2개」라고 밝힌다', ((await p.locator('.sum-n').first().textContent()) || '').includes('2개'))

// ③ 일부러 잘못 — 글자·0·엄청 큰 수
await 값적기('참치캔', 'abc')
본다('글자를 적으면 값이 안 붙는다', ((await p.locator('.sum-n').first().textContent()) || '').includes('2개'))
await 값적기('참치캔', '0')
본다('0 이면 값이 안 붙는다', ((await p.locator('.sum-n').first().textContent()) || '').includes('2개'))
await 값적기('참치캔', '99999999999')
const 큰값 = await p.evaluate(() => JSON.parse(localStorage.getItem('hankki:v1') || '{}').shoppingList?.find((i) => i.name === '참치캔')?.won)
본다('9,999,999 을 넘지 않는다', 큰값 === 9999999)
await 값적기('참치캔', '0')   // 되돌림

// ④ 「산 것만 식비로 적기」 — 두부·대파만 체크하고 누른다
for (const n of ['두부', '대파']) {
  await p.locator('.shop-row').filter({ hasText: n }).first().locator('.check-box').click(); await p.waitForTimeout(300)
}
await p.locator('.sum-btn').first().click(); await p.waitForTimeout(700)
const 판 = () => p.evaluate(() => JSON.parse(localStorage.getItem('hankki:v1') || '{}'))
let d = await 판()
본다('식비 한 줄이 생겼다', (d.foodCost || []).length === 1)
본다('그 줄 값 = 6,400', d.foodCost?.[0]?.won === 6400)
본다('그 줄에 품목 이름 2개가 남았다', (d.foodCost?.[0]?.items || []).length === 2)
본다('날짜가 오늘(KST)', d.foodCost?.[0]?.d === new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10))
본다('체크한 줄만 지워졌다(참치캔 남음)', (d.shoppingList || []).length === 1)
본다('값 없이 체크만 한 건 안 쌓인다(식비 1줄뿐)', (d.foodCost || []).length === 1)

// ⑤ 백업 → 식비 지움 → 복원
const 백업 = await 판()
await p.evaluate((b2) => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  s.foodCost = []; localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('__백업', JSON.stringify(b2))
}, 백업)
await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2200); await 치우기()
d = await 판(); 본다('지우면 식비가 0줄', (d.foodCost || []).length === 0)
// 복원 = 백업 글을 그대로 넣고 새로 읽기(앱의 복원 자리와 같은 칸을 쓴다)
await p.evaluate(() => { localStorage.setItem('hankki:v1', localStorage.getItem('__백업')) })
await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2200); await 치우기()
d = await 판(); 본다('복원하면 식비가 되살아난다', (d.foodCost || []).length === 1 && d.foodCost[0].won === 6400)

본다('콘솔 오류 0', 오류.length === 0)
if (오류.length) console.log('   ⛔ 오류:', 오류.slice(0, 5))
await p.screenshot({ path: (process.env.OUT || '/tmp/claude-0') + '/식비값-실물.png', fullPage: true })
await b.close(); srv.close()
console.log(`\n${실패.length ? '⛔' : '✅'} 통과 ${통과} · 실패 ${실패.length}`)
if (실패.length) { 실패.forEach((t) => console.log('   ·', t)); process.exit(1) }
