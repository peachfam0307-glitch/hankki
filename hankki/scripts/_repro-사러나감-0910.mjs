// 🛒🛒 [2026-09-10] 「사러 나갔다」·「담았다」가 진짜로 세지나 — 앱을 돌려서 잰다
//
// 🔢 왜 = 쿠팡 파트너스는 클릭 77 · 구매 1 · 수익 832원만 알려준다(2026-09-10 창업자 캡처).
//    분모(몇 명이 봤나)도 자리(어느 단추)도 없다. 그래서 우리가 «누른 자리»를 센다.
//    ⛔ 「보낸다」고 말로 하지 않는다 — 재서 확인한다.
//
// ⛔ 구글 태그 스크립트를 막고 dataLayer 를 읽는다(밖으로 한 건도 안 나간다).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4493, r))

let 나쁨 = 0
const 잰다 = (참, 말, 값 = '') => { if (참) console.log(`  ✅ ${말}${값 ? `  ${값}` : ''}`); else { 나쁨 += 1; console.log(`  ⛔ ${말}${값 ? `  ${값}` : ''}`) } }

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 860 }, locale: 'ko-KR' })
await ctx.route('**://www.googletagmanager.com/**', (r) => r.abort())
await ctx.route('**://*.google-analytics.com/**', (r) => r.abort())
// 🛒 쇼핑몰로 진짜 나가지 않게 막는다 — 새 탭이 떠도 아무것도 안 받는다
await ctx.route('**://*.coupang.com/**', (r) => r.abort())
await ctx.route('**://*.naver.com/**', (r) => r.abort())
await ctx.route('**://*.oasis.co.kr/**', (r) => r.abort())
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('hankki:nudge:cloudgate', '1')
    localStorage.setItem('hankki:onboarded', '1')
  } catch { /* noop */ }
})
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4493/hankki/', { waitUntil: 'networkidle' })
await p.waitForTimeout(2400)

const 길막 = async () => {
  for (let i = 0; i < 10; i++) {
    const 시트 = p.locator('.sheet-mask button', { hasText: /^(닫기|확인|알겠어요|나중에)/ }).first()
    if (await 시트.count() > 0 && await 시트.isVisible().catch(() => false)) { await 시트.click(); await p.waitForTimeout(500); continue }
    const 코치 = p.locator('[aria-label="다음 안내 보기"]').first()
    if (await 코치.count() > 0 && await 코치.isVisible().catch(() => false)) { await 코치.click(); await p.waitForTimeout(500); continue }
    break
  }
}
const 이름들 = () => p.evaluate(() => [...(window.dataLayer || [])]
  // ⛔⛔ [2026-09-10] dataLayer 에는 «배열이 아닌 것»도 들어온다 — GTM 스니펫이
  //    { 'gtm.start': … } 같은 평범한 객체를 밀어 넣는다. 그걸 펼치려 하면 not iterable 로 죽는다.
  //    📌 내 폰(로컬)에선 안 걸리고 CI 에서만 죽어서 v13.11 배포가 통째로 막혔다.
  .filter((a) => a && typeof a.length === 'number')
  .map((a) => [...a])
  .filter((a) => a[0] === 'event' && a[1] === 'page_view')
  .map((a) => a[2]?.page_title))

console.log('\n🛒 사러 나갔다 · 담았다\n')
await 길막()
await p.locator('.nav-item', { hasText: '장보기' }).first().click()
await p.waitForTimeout(1400); await 길막()
잰다((await 이름들()).includes('shop'), '① 장보기 화면이 잡힌다', JSON.stringify((await 이름들()).slice(-3)))

// ── ② 주부의 장바구니에서 「담기」
// ⛔ 한 줄만 담으면 그게 «한살림»일 수 있다 — 한살림은 사러가기를 «안 그린다»(noBuy).
//    그러면 ③-2 가 「단추가 없다」로 죽는데, 그건 고장이 아니라 «담은 것이 그런 줄»인 것이다.
//    ✅ 그래서 셋을 담는다 — 하나라도 주소가 있으면 리스트에 사러가기가 그려진다.
const 담기들 = p.locator('button', { hasText: /^담기$/ })
const 담을수 = Math.min(3, await 담기들.count())
// ⛔ 같은 이름은 두 번 안 담긴다(store.jsx addShopItem) → «서로 다른» 줄을 누른다
for (let i = 0; i < 담을수; i++) { await 담기들.nth(i).click().catch(() => {}); await p.waitForTimeout(700) }
const 담기 = p.locator('button', { hasText: /^담기$/ }).first()
if (담을수 > 0) {
  잰다((await 이름들()).includes('shop_added'), '② 담으면 shop_added 가 나간다', JSON.stringify((await 이름들()).slice(-2)))
} else {
  잰다(false, '② 「담기」 단추를 못 찾았다 — ⛔여기서 판정하지 말 것')
}

// ── ③ 주부의 장바구니에서 「사러가기」 (＝pick_shop)
const 픽사러 = p.locator('.curation-buy, button', { hasText: /^사러가기$/ })
const 몇 = await 픽사러.count()
console.log(`  · 화면에 보이는 「사러가기」 = ${몇}개`)
if (몇 > 0) {
  await 픽사러.first().click(); await p.waitForTimeout(1200)
  const 뒤 = await 이름들()
  잰다(뒤.some((n) => n === 'buy_pick_shop' || n === 'buy_cart'),
    '③ 사러가기를 누르면 buy_ 가 나간다', JSON.stringify(뒤.slice(-2)))
} else {
  잰다(false, '③ 「사러가기」 단추를 못 찾았다 — ⛔여기서 판정하지 말 것')
}

// ── ③-2 «내가 담은» 리스트 줄의 사러가기 (＝cart) — 자리가 «갈리는지»가 이 판의 핵심이다
const 살핌 = await p.evaluate(() => ({
  mini: document.querySelectorAll('.mini-buy').length,
  사러가기: [...document.querySelectorAll('button')].filter((e) => e.innerText.trim() === '사러가기').length,
  담긴줄: [...document.querySelectorAll('.shop-row, li')].length,
}))
console.log(`  · 살핌 = ${JSON.stringify(살핌)}`)
const 리스트사러 = p.locator('.mini-buy').first()
if (await 리스트사러.count() > 0) {
  await 리스트사러.scrollIntoViewIfNeeded().catch(() => {})
  await 리스트사러.click(); await p.waitForTimeout(1200)
  const 뒤2 = await 이름들()
  잰다(뒤2.includes('buy_cart'), '③-2 ⭐담은 줄에서 누르면 buy_cart 로 «갈려서» 나간다', JSON.stringify(뒤2.slice(-2)))
} else {
  잰다(false, '③-2 리스트 줄의 사러가기를 못 찾았다 — ⛔여기서 판정하지 말 것')
}

// ── ④ 통계를 끄면 한 건도 안 나간다
await p.evaluate(() => { localStorage.setItem('hankki:stats:off', '1') })
await p.reload({ waitUntil: 'networkidle' })
await p.waitForTimeout(2000)
잰다((await 이름들()).length === 0, '④ 통계를 끄면 한 건도 안 나간다', JSON.stringify(await 이름들()))

await b.close(); srv.close()
console.log(나쁨 ? `\n✗ ${나쁨}칸 실패` : '\n✅ 사러 나감 통과')
process.exit(나쁨 ? 1 : 0)
