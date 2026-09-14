// 📐 패드 크기 «고친 안»을 실제로 렌더해서 찍는다 (2026-08-26)
//
// 📮 창업자 = *"홈 자주해먹는요리랑 장보기세로나누기는 «패드에서 보여지는거» 고치는거야."*
//
// ⭐⭐ 실측이 문제를 정확히 짚었다 —
//    · 홈 카드 = 폰 **167px**(화면의 40.5%) ↔ 패드 세로 **114px**(13.7%). **패드에서 «더 작다».**
//      ⛔ 뿌리 = `styles.css:691` 의 `.mini-card { width: 108px }` **고정값**.
//         칸은 넓어지는데 카드는 그대로라 「이름이 잘리고」(「토마토달걀볶／음」) 그림도 쪼그라든다.
//    · 장보기 = 좌우 2열은 «되고 있다». 다만 **오른쪽 아래가 49.4% 빈다**(패드 가로는 54.7%).
//
// ⛔ 고친 CSS 는 «주입»만 한다 — 파일은 창업자가 고르고 나서 고친다(규칙 11).
//
// 씀: cd /home/user/hankki/hankki && node scripts/_shot-패드안-0826.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/패드0826'
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
await new Promise((r) => srv.listen(4392, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

// ── 홈 카드 안 셋 ──────────────────────────────────────────────
// ⭐ 셋 다 «패드에서만» 바뀐다(`min-width:700px`) — 폰은 한 픽셀도 안 건드린다.
const 홈안 = {
  지금: '',
  // ⭐⭐ 뿌리 = 카드 «크기»가 아니라 «칸 나누기»다.
  //    패드에선 `.weekly-box` 가 좌우 2열이라 한 상자가 387px 인데 그 안을 **3칸**으로 나눈다 → 114px.
  //    폰은 전폭 371px 를 **2칸**으로 나눠서 167px. 그래서 «패드가 폰보다 작다».
  // ⛔ 겨냥할 곳 = `styles.css:2550` 의 **`.week-pair.two .weekly-box > .weekly-row`**.
  //    거기서 카드 폭이 `calc((100% - 20px) / 3)` = **칸의 1/3** 로 못 박혀 있다.
  //    ⚠️ 그 줄은 창업자가 두 번 판정해서 나온 모양이다(*"레시피2개 오른쪽자리비어"* → 가운데 모으기).
  A: `@media (min-width:700px){
        /* 3칸 기준 → «2칸» 기준. 개수가 적으면 가운데로 모으는 것은 그대로 */
        .week-pair.two .weekly-box > .weekly-row{
          grid-template-columns:repeat(auto-fit, calc((100% - 10px) / 2)) }
        .mini-card .name{ word-break:keep-all }
      }`,
  B: `@media (min-width:700px){
        /* 2칸 ＋ 이름 글자도 칸에 맞춰 */
        .week-pair.two .weekly-box > .weekly-row{
          grid-template-columns:repeat(auto-fit, calc((100% - 10px) / 2)) }
        .mini-card .name{ word-break:keep-all; font-size:19px }
      }`,
  C: `@media (min-width:700px){
        /* 두 상자를 «위아래»로 — 한 상자가 전폭을 쓴다. 카드는 3칸 그대로인데 칸이 두 배 넓다 */
        .week-pair.two{ grid-template-columns:minmax(0,1fr) }
        .mini-card .name{ word-break:keep-all; font-size:19px }
      }`,
}

// ── 장보기 오른쪽 빈 자리 안 둘 ────────────────────────────────
const 장안 = {
  지금: '',
  A: `@media (min-width:700px){
        /* 왼쪽이 길고 오른쪽이 짧다 → 칸 폭을 «내용에 맞게» 나눈다(리스트는 좁아도 된다) */
        .shop-pair{ grid-template-columns:minmax(0,1.35fr) minmax(0,1fr) }
      }`,
  B: `@media (min-width:700px){
        /* 쇼핑몰 바로가기를 «한 줄에 더 많이» — 오른쪽 아래 빈 자리를 줄인다 */
        .shop-pair{ grid-template-columns:minmax(0,1.35fr) minmax(0,1fr) }
        .mall-row{ display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px }
      }`,
}

async function 찍기(꼬리, css, 어디, W, H) {
  const page = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 })
  await page.addInitScript(SEED_COACH_SEEN)
  await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  await page.goto('http://127.0.0.1:4392/hankki/', { waitUntil: 'networkidle' })
  if (css) await page.addStyleTag({ content: css })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(900)
  if (어디 === '장보기') {
    const t = page.locator('.bottom-nav .nav-item').filter({ hasText: '장보기' }).first()
    if (await t.count()) { await t.click(); await page.waitForTimeout(1300) }
  }
  const 잰값 = await page.evaluate((어디) => {
    if (어디 === '홈') {
      const c = document.querySelector('.mini-card'); if (!c) return null
      const r = c.getBoundingClientRect()
      const n = c.querySelector('.name')
      return { 폭: Math.round(r.width), 높이: Math.round(r.height),
               글자: n ? getComputedStyle(n).fontSize : '?',
               이름줄: n ? Math.round(n.getBoundingClientRect().height / parseFloat(getComputedStyle(n).lineHeight || 20)) : 0 }
    }
    const 쌍 = document.querySelector('.shop-pair'); if (!쌍) return null
    const 왼 = 쌍.querySelector('.shop-cur'), 오 = 쌍.querySelector('.shop-list')
    const a = 왼.getBoundingClientRect(), c = 오.getBoundingClientRect(), p = 쌍.getBoundingClientRect()
    const 안쪽 = [...오.children].reduce((m, e) => Math.max(m, e.getBoundingClientRect().bottom), c.top)
    return { 왼: Math.round(a.width), 오: Math.round(c.width),
             빈비율: +(100 - (안쪽 - c.top) / p.height * 100).toFixed(1) }
  }, 어디)
  await page.screenshot({ path: join(OUT, `안-${어디}-${꼬리}.png`) })
  await page.close()
  return 잰값
}

console.log('\n🏠 홈 「자주 해먹는 요리」 — 패드 세로 834×1194')
for (const [k, css] of Object.entries(홈안)) {
  const v = await 찍기(k, css, '홈', 834, 1194)
  console.log(`   ${k.padEnd(4)} 카드 ${v.폭}×${v.높이}px · 이름 ${v.글자} · ${v.이름줄}줄`)
}
console.log('\n🛒 장보기 — 패드 세로 834×1194')
for (const [k, css] of Object.entries(장안)) {
  const v = await 찍기(k, css, '장보기', 834, 1194)
  console.log(`   ${k.padEnd(4)} 왼 ${v.왼} / 오른 ${v.오}px · 오른쪽 «빈» 세로 ${v.빈비율}%`)
}

await b.close(); srv.close()
console.log(`\n🖼 ${OUT}`)
