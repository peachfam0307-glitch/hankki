// 🕳🔬 식비 «구멍 찾기» 판 (2026-09-17) — 창업자 *"오류나 버그 구멍있나 시뮬돌려보고 배포해"*
//   ⭐ 잘 되는 길이 아니라 «일부러 잘못 굴리는» 길만 본다(절대원칙 33 2차).
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
await new Promise((r) => srv.listen(4541, r))
let 통과 = 0; const 실패 = []
const 본다 = (n, 참) => { if (참) { 통과++; console.log('  ✓', n) } else { 실패.push(n); console.log('  ✗', n) } }
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR' })
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1') } catch { /* noop */ } })
const p = await ctx.newPage(); const 오류 = []
p.on('pageerror', (e) => 오류.push(String(e)))
p.on('console', (m) => { if (m.type() === 'error' && !/net::|ERR_TUNNEL/.test(m.text())) 오류.push(m.text()) })
async function 치우기() { for (let i = 0; i < 12; i++) { const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first(); if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break; try { await 것.click({ timeout: 1500 }); await p.waitForTimeout(400) } catch { break } } }
async function 식비로() {
  await p.locator('.bottom-nav .nav-item').filter({ hasText: '장보기' }).first().click(); await p.waitForTimeout(800); await 치우기()
  await p.locator('.segment .seg').filter({ hasText: '식비' }).first().click(); await p.waitForTimeout(600)
}
const 판 = () => p.evaluate(() => JSON.parse(localStorage.getItem('hankki:v1') || '{}'))

await p.goto('http://127.0.0.1:4541/hankki/?%EC%8B%9D%EB%B9%84=1', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(2400); await 치우기()

// ① 기록 0 — 빈 화면에서 잘못 굴리기
await 식비로()
본다('기록 0 이면 빈 안내가 뜬다', await p.locator('.fc-empty-t').count() === 1)
본다('빈 화면엔 잣대 토글이 없다(볼 게 없다)', await p.locator('.fc-scale').count() === 0)
await p.locator('.fc-out-btn').first().click(); await p.waitForTimeout(500)
본다('빈 화면에서도 외식 적기가 열린다', await p.locator('.fc-in').count() === 1)
// ② 0 원으로 저장 시도
본다('아무것도 안 쳤으면 「적었어요」가 잠겨 있다', await p.locator('.fc-save').first().isDisabled())
// ③ 계산기 — ＋ 만 여러 번
for (const k of ['＋', '＋', '0']) { await p.locator('.fc-key', { hasText: new RegExp(`^${k === '＋' ? '＋' : '0'}$`) }).first().click(); await p.waitForTimeout(120) }
본다('값 없이 ＋ 를 눌러도 안 늘어난다', (await p.locator('.fc-in').first().textContent()).replace(/\s/g, '') === '0원')
// ④ 9,999,999 넘게 치기
for (const k of ['9', '9', '9', '9', '9', '9', '9', '9', '9']) { await p.locator('.fc-key', { hasText: /^9$/ }).first().click(); await p.waitForTimeout(90) }
본다('일곱 자리를 넘지 않는다', (await p.locator('.fc-in').first().textContent()).replace(/[^0-9]/g, '').length <= 7)
// ⑤ 계산기로 두 번 더해 저장
await p.locator('.fc-key.bk', { hasText: '지움' }).first().click(); await p.waitForTimeout(150)
for (const k of ['1', '000']) { await p.locator('.fc-key', { hasText: new RegExp(`^${k}$`) }).first().click(); await p.waitForTimeout(120) }
await p.locator('.fc-key.plus').first().click(); await p.waitForTimeout(150)
for (const k of ['2', '000']) { await p.locator('.fc-key', { hasText: new RegExp(`^${k}$`) }).first().click(); await p.waitForTimeout(120) }
본다('계산기가 1,000 ＋ 2,000 = 3,000 을 보여준다', (await p.locator('.fc-in').first().textContent()).replace(/\s/g, '') === '3,000원')
await p.locator('.fc-save').first().click(); await p.waitForTimeout(700)
let d = await 판()
본다('계산기 합계가 한 줄로 저장된다', d.foodCost?.length === 1 && d.foodCost[0].won === 3000)
// ⑥ 가게 추가 — 빈칸·주소만
await p.locator('.fc-out-btn').first().click(); await p.waitForTimeout(500)
await p.locator('.fc-shop.add').first().click(); await p.waitForTimeout(500)
본다('이름·주소가 비면 「더할게요」가 잠겨 있다', await p.locator('.fc-save').last().isDisabled())
await p.locator('.fc-add-name').fill('우리동네마트')
await p.locator('.fc-add-url').fill('mart.example.com')   // ⛔ https 없이
await p.locator('.fc-save').last().click(); await p.waitForTimeout(600)
d = await 판()
const 새가게 = (d.costShops || []).find((s) => s.name === '우리동네마트')
본다('주소에 https 가 저절로 붙는다', 새가게?.url === 'https://mart.example.com')
본다('더한 가게가 목록에 뜬다', await p.locator('.fc-shop', { hasText: '우리동네마트' }).count() === 1)
// ⑦ 같은 주소 또 더하기
await p.locator('.fc-shop.add').first().click(); await p.waitForTimeout(400)
await p.locator('.fc-add-name').fill('또우리동네')
await p.locator('.fc-add-url').fill('https://mart.example.com')
await p.locator('.fc-save').last().click(); await p.waitForTimeout(600)
d = await 판()
본다('같은 주소는 두 번 안 들어간다', (d.costShops || []).filter((s) => s.url === 'https://mart.example.com').length === 1)
await p.keyboard.press('Escape'); await p.waitForTimeout(400)
await p.keyboard.press('Escape'); await p.waitForTimeout(400)
// ⑧-0 [2026-09-18] 「두부 1990」 한 번에 치기 — 창업자 «값을 눌러 또 금액을 적고 좀 번거로워»
//   ⛔ 시트가 열려 있으면 뒤 화면을 못 누른다 — 먼저 닫는다(sheet-mask 가 손가락을 막는다)
for (let i = 0; i < 4; i++) { const 막 = p.locator('.sheet-mask'); if (!(await 막.count())) break; await 막.last().click({ position: { x: 5, y: 5 } }); await p.waitForTimeout(450) }
await p.locator('.segment .seg').filter({ hasText: '장보기' }).first().click(); await p.waitForTimeout(600)
const 담기 = p.locator('input[placeholder*="살 재료"], input[placeholder*="1990"]').first()
// ⛔ 앞 단계에서 두부·대파는 «식비로 옮겨져» 목록에서 빠졌다 — 다시 담아야 여기서 잰다
for (const 글 of ['두부 1990', '돼지고기 600g', '양파 3', '대파 1,500']) { await 담기.fill(글); await p.keyboard.press('Enter'); await p.waitForTimeout(400) }
await p.waitForTimeout(400)
d = await 판()
const 찾 = (n) => (d.shoppingList || []).find((i) => i.name === n)
본다('「두부 1990」 → 이름 두부 · 값 1,990', 찾('두부')?.won === 1990)
본다('「대파 1,500」 쉼표도 읽는다', 찾('대파')?.won === 1500)
본다('「돼지고기 600g」 은 값이 아니다(사는 양)', !!찾('돼지고기 600g') && !찾('돼지고기 600g')?.won)
본다('「양파 3」 은 값이 아니다(세 자리 미만)', !!찾('양파 3') && !찾('양파 3')?.won)
// ✏️ [2026-09-18] 잘못 적었을 때 고치기 — 창업자 «수정도 되게 해줘»
// ⛔ 고치기를 누르면 그 줄 «글자»가 입력칸으로 바뀐다 → 「두부」로는 더 못 찾는다. 열린 칸을 바로 잡는다.
const 고치기열기 = async (이름) => { await p.locator('.shop-row').filter({ hasText: 이름 }).first().locator('button[aria-label*="고치기"]').click(); await p.waitForTimeout(400); return p.locator('.shop-row input').first() }
let 칸 = await 고치기열기('두부')
본다('고치기 칸에 «이름 값»이 같이 들어 있다', (await 칸.inputValue()) === '두부 1990')
await 칸.fill('두부 2500'); await p.keyboard.press('Enter'); await p.waitForTimeout(500)
d = await 판()
본다('「두부 2500」으로 고치면 값이 바뀐다', (d.shoppingList || []).find((i) => i.name === '두부')?.won === 2500)
칸 = await 고치기열기('두부')
await 칸.fill('두부'); await p.keyboard.press('Enter'); await p.waitForTimeout(500)
d = await 판()
본다('숫자를 빼고 저장하면 값이 지워진다', !(d.shoppingList || []).find((i) => i.name === '두부')?.won)
await p.locator('.segment .seg').filter({ hasText: '식비' }).first().click(); await p.waitForTimeout(500)

// ⑧ 날짜 거꾸로 고르기 (까지 < 부터)
await p.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const 날 = (n) => { const d = new Date(Date.now() + 9 * 3600e3); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10) }
  s.foodCost = [{ id: 'q1', d: 날(1), k: 'shop', won: 10000 }, { id: 'q2', d: 날(20), k: 'out', won: 20000 }]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
})
await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2200); await 치우기(); await 식비로()
await p.locator('.fc-scale button', { hasText: '날짜 고르기' }).first().click(); await p.waitForTimeout(400)
const 부터칸 = p.locator('.fc-range input').first()
const 까지칸 = p.locator('.fc-range input').nth(1)
await 부터칸.fill('2026-09-17'); await p.waitForTimeout(300)
await 까지칸.fill('2026-09-01'); await p.waitForTimeout(500)
const 거꾸로 = (await p.locator('.fc-v').first().textContent()).replace(/[^0-9]/g, '')
본다('날짜를 거꾸로 골라도 죽지 않고 그 사이를 센다', Number(거꾸로) > 0)
// ⑨ 아주 먼 옛날 / 앞날
await 부터칸.fill('2000-01-01'); await p.waitForTimeout(300)
await 까지칸.fill('2099-12-31'); await p.waitForTimeout(500)
본다('100년을 골라도 죽지 않는다', (await p.locator('.fc-v').first().textContent()).includes('원'))
// ⑩ 지우기 — 묻고 지운다
await p.locator('.fc-scale button', { hasText: '주별' }).first().click(); await p.waitForTimeout(400)
const 전 = (await 판()).foodCost.length
await p.locator('.fc-row button[aria-label="지우기"]').first().click(); await p.waitForTimeout(500)
본다('X 를 누르면 «묻는다»(바로 안 지운다)', (await 판()).foodCost.length === 전)
await p.locator('button', { hasText: '그대로 둘게요' }).first().click(); await p.waitForTimeout(500)
본다('「그대로 둘게요」면 안 지워진다', (await 판()).foodCost.length === 전)
await p.locator('.fc-row button[aria-label="지우기"]').first().click(); await p.waitForTimeout(400)
await p.locator('button', { hasText: '지울게요' }).first().click(); await p.waitForTimeout(600)
본다('「지울게요」면 한 줄만 지워진다', (await 판()).foodCost.length === 전 - 1)
// ⑪ 새로고침해도 남아 있나
await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2200); await 치우기(); await 식비로()
본다('새로고침해도 기록이 남는다', (await 판()).foodCost.length === 전 - 1)
본다('더한 가게도 남는다', (await 판()).costShops.some((s) => s.name === '우리동네마트'))
// 💰 예산 — 창업자 2026-09-18 «이번주 식비를 20만원안에서 살기» · 주·달 따로
await p.locator('.fc-bud-new').first().click(); await p.waitForTimeout(500)
본다('처음엔 「안 정할래요」다', (await p.locator('.fc-save').last().textContent()).includes('안 정할래요'))
for (const k of ['5', '000']) { await p.locator('.fc-key', { hasText: new RegExp('^' + k + '$') }).first().click(); await p.waitForTimeout(120) }
본다('만 원 미만이면 잠긴다', await p.locator('.fc-save').last().isDisabled())
await p.locator('.fc-key.bk', { hasText: '지움' }).first().click(); await p.waitForTimeout(150)
for (const k of ['2', '00', '000']) { await p.locator('.fc-key', { hasText: new RegExp('^' + k + '$') }).first().click(); await p.waitForTimeout(120) }
await p.locator('.fc-save').last().click(); await p.waitForTimeout(600)
d = await 판()
console.log('   예산 =', JSON.stringify(d.foodBudget))
본다('주 예산 20만원이 저장된다', d.foodBudget?.w === 200000)
본다('남은 돈이 뜬다', /남았어요|더 썼어요/.test(await p.locator('.fc-bud-s b').first().textContent()))
await p.locator('.fc-scale button', { hasText: '달별' }).first().click(); await p.waitForTimeout(500)
본다('달별은 «달 예산»이라 아직 안 정한 상태다', await p.locator('.fc-bud-new').count() === 1)
await p.locator('.fc-scale button', { hasText: '주별' }).first().click(); await p.waitForTimeout(500)
본다('주별로 돌아오면 예산이 그대로 있다', await p.locator('.fc-bud-s').count() === 1)
본다('콘솔 오류 0', 오류.length === 0)
if (오류.length) console.log('   ⛔', 오류.slice(0, 5))
await b.close(); srv.close()
console.log(`\n${실패.length ? '⛔' : '✅'} 통과 ${통과} · 실패 ${실패.length}`)
if (실패.length) { 실패.forEach((t) => console.log('   ·', t)); process.exit(1) }
