// 📸🔄 내일(9/19) 소개 릴스용 화면 — 「레시피 → 장보기 → 식비 → 냉장고」 흐름 ＋ 식비탭 구체 소개
//
// 📮 창업자 = *"레시피->장보기->식비->냉장고로 가는 흐름을 내일 릴스에 녹이자. 식비탭을 구체적으로 소개하고."*
//   ⭐ 지어낸 그림이 아니라 «앱이 그리는 그것»이라야 한다(규칙 30).
//   ⛔ 코치마크는 접두어(hankki:coach)로 막아 «다 본 것»으로 만든다 — 열쇠를 올려도 안 낡는다.
//   ⛔ 씨앗은 «앱이 한 번 저장한 뒤»에 심는다 — load() 는 recipes 배열이 없으면 저장본을 통째로 버린다(store.jsx:145).
//   ⛔ 날짜를 여기서 «만들지» 않는다(절대원칙 27) — todayKST() 에서 ±n일만 옮긴다.
//
// 쓰는 법: SMOKE_CHROMIUM=… node scripts/_shot-흐름릴스-0919.mjs
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
await new Promise((r) => srv.listen(4612, r))
const 밖 = process.env.OUT || '/tmp/claude-0/흐름릴스-0919'
const { mkdirSync } = await import('node:fs'); mkdirSync(밖, { recursive: true })
const { todayKST } = await import('../src/today.js')
const 며칠 = (n) => { const d = new Date(주첫 + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const 주첫 = (() => { const d = new Date(todayKST() + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - d.getUTCDay()); return d.toISOString().slice(0, 10) })()
const 씨 = [
  { d: 며칠(0), k: 'shop', won: 38400, memo: '쿠팡' },
  { d: 며칠(1), k: 'out', won: 15000, memo: '배민 치킨' },
  { d: 며칠(2), k: 'shop', won: 12700, memo: '자연드림' },
  { d: 며칠(3), k: 'out', won: 9500, memo: '쿠팡이츠 국밥' },
  { d: 며칠(4), k: 'shop', won: 26800, memo: '컬리' },
  { d: 며칠(5), k: 'out', won: 32000, memo: '외식 삼겹살' },
  { d: 며칠(-6), k: 'shop', won: 41000, memo: '이마트몰' },
  { d: 며칠(-4), k: 'out', won: 21000, memo: '분식' },
  { d: 며칠(-9), k: 'shop', won: 33000, memo: '한살림' },
]
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, locale: 'ko-KR' })
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('hankki:nudge:cloudgate', '1')
    const _get = Storage.prototype.getItem
    Storage.prototype.getItem = function (k) { if (typeof k === 'string' && k.startsWith('hankki:coach')) return '1'; return _get.call(this, k) }
  } catch { /* noop */ }
})
const p = await ctx.newPage()
const 안내치우기 = async () => {
  for (let i = 0; i < 10; i++) {
    const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first()
    if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break
    try { await 것.click({ timeout: 1500 }); await p.waitForTimeout(350) } catch { break }
  }
}
const 찍기 = async (이름) => { await p.screenshot({ path: join(밖, 이름 + '.png') }); console.log('  📸', 이름) }
await p.goto('http://127.0.0.1:4612/hankki/', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(2300); await 안내치우기()
const 심음 = await p.evaluate((줄들) => {
  try {
    const s = JSON.parse(localStorage.getItem('hankki:v1') || 'null')
    if (!s || !Array.isArray(s.recipes)) return '아직 저장 전'
    s.foodCost = 줄들.map((e, i) => ({ id: 'seed' + i, ...e }))
    s.foodBudget = { w: 150000, m: 600000 }
    localStorage.setItem('hankki:v1', JSON.stringify(s))
    return '심었다 ' + s.foodCost.length + '줄'
  } catch (e) { return '⛔ ' + e.message }
}, 씨)
console.log('씨앗 =', 심음)
await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2200); await 안내치우기()

// ① 레시피 — 흐름의 첫 칸
await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click()
await p.waitForTimeout(1100); await 안내치우기(); await 찍기('1-레시피')
// ①-b 레시피 «상세» — 두부조림(두부로 이야기가 하나로 이어진다)
const 두부조림 = p.locator('text=어남선생 두부조림').first()
if (await 두부조림.count()) {
  await 두부조림.click(); await p.waitForTimeout(1300); await 안내치우기(); await 찍기('1b-레시피상세')
  // 🛒 「재료 담기」 — 흐름의 이음매. 단추 이름이 바뀔 수 있어 몇 가지로 찾는다.
  const 담기 = p.locator('button:has-text("재료 담기"), button:has-text("장보기 담기"), button:has-text("담기")').first()
  if (await 담기.count()) {
    await 담기.scrollIntoViewIfNeeded(); await p.waitForTimeout(400); await 찍기('1c-재료담기단추')
    // ✅ 재료 줄(.ing)을 눌러 «고른다» — 릴스에서 고르는 장면이 된다.
    //    ⛔ 안 고르고 「장보기 담기」를 누르면 토스트 「담을 재료를 체크해 주세요」만 뜬다(RecipeDetailScreen.jsx:1054).
    let 고른수 = 0
    for (const 이름 of ['두부', '대파', '양파']) {
      const 칸 = p.locator('.ing').filter({ hasText: 이름 }).first()
      if (await 칸.count()) {
        try { await 칸.scrollIntoViewIfNeeded(); await 칸.click({ timeout: 2500 }); 고른수++; await p.waitForTimeout(300) } catch { /* 못 누르면 넘어간다 */ }
      }
    }
    console.log('  ✅ 고른 재료 =', 고른수)
    await 찍기('1e-재료체크')
    // 🧺 그다음 「장보기 담기」를 누르면 «담긴다»
    await 담기.scrollIntoViewIfNeeded(); await 담기.click({ force: true }); await p.waitForTimeout(1300); await 안내치우기()
    await 찍기('1f-담김')
  } else { console.log('  ⚠️ 「재료 담기」 단추를 못 찾았다 — 이름을 확인할 것') }
}
// ② 장보기 — 담긴 재료가 쭉 들어온 자리
// ⛔ 상세 화면에선 아래 띠가 가려질 수 있다 — 뒤로 나온 뒤 누른다
await p.locator('button[aria-label="뒤로"], .detail-top button').first().click({ force: true }).catch(() => {})
await p.waitForTimeout(900); await 안내치우기()
await p.locator('.bottom-nav .nav-item').filter({ hasText: '장보기' }).first().click({ force: true })
await p.waitForTimeout(900); await 안내치우기(); await 찍기('2-장보기')
// ②-a-2 레시피에서 담은 재료는 «금액이 비어 있다» — 창업자 2026-09-18 *"근데 그런 가격은 다시입력해야하긴해"*
//   ⭐ 그 「＋ 금액」 칸을 눌러 적는 장면이 «흐름의 이음매»다. 이게 없으면 레시피→식비가 끊겨 보인다.
const 금액칸 = p.locator('button[aria-label*="금액 적기"]').first()
if (await 금액칸.count()) {
  await 금액칸.scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await 찍기('2a-금액칸')
  await 금액칸.click({ force: true }); await p.waitForTimeout(900); await 찍기('2a2-금액적기')
  const 시트칸 = p.locator('input[type="text"], input[inputmode="numeric"]').last()
  if (await 시트칸.count()) { try { await 시트칸.fill('1910'); await p.waitForTimeout(500); await 찍기('2a3-1910적음') } catch { /* noop */ } }
  await p.keyboard.press('Escape').catch(() => {}); await p.waitForTimeout(600)
}
// ②-b 새로 적을 때는 «한 줄로» — 두부 1910
const 적는칸 = p.locator('input[aria-label="살 재료 적기"]').first()
if (await 적는칸.count()) {
  await 적는칸.click(); await p.waitForTimeout(200)
  for (const 글 of ['두부', '두부 19', '두부 1910']) { await 적는칸.fill(글); await p.waitForTimeout(250) }
  await 찍기('2b-금액타자')
  await 적는칸.press('Enter'); await p.waitForTimeout(800); await 찍기('2c-식비에넣기')
}
// ③ 식비 — 요약 · 목록 · 달별 (구체 소개)
await p.locator('.segment .seg').filter({ hasText: '식비' }).first().click({ force: true }); await p.waitForTimeout(1100)
await 찍기('3-식비-요약')
await p.locator('.fc-hit').nth(5).evaluate((el) => el.scrollIntoView({ block: 'center' })); await p.waitForTimeout(600)
await 찍기('4-식비-목록')
await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400)
await p.locator('.fc-scale button').filter({ hasText: '달별' }).first().click({ force: true }); await p.waitForTimeout(800)
await 찍기('5-식비-달별')
await p.locator('.fc-scale button').filter({ hasText: '주별' }).first().click({ force: true }); await p.waitForTimeout(600)
// ④ 냉장고 — 흐름의 끝 칸
await p.locator('.segment .seg').filter({ hasText: '냉장고' }).first().click({ force: true }); await p.waitForTimeout(1000)
await 안내치우기(); await 찍기('6-냉장고')
console.log('✅ 다 찍었다 →', 밖)
await b.close(); srv.close()
