// 🍱 표지 버튼 시안 넷 — 창업자 판정용 (2026-08-06)
//
// 창업자 = *"아이콘은 레시피꾸미기에 «너무 큰 알약 2개가 간섭»되는거 아닐까?"*
// ⭐ 이건 새 말이 아니다 — 2026-07-28 에 이미 두 번 말했다:
//    *"버튼이 7개야 그림 속에 · 간섭이 심해"* · 「레꾸가 주인공이라 표지를 최대한 안 가린다」
//    → 오늘 내가 알약을 하나 더 만들며 그 원칙을 거슬렀다.
//
// ⛔ 시안을 «따로 그리지» 않는다 — 실제 앱을 띄워 버튼만 갈아끼우고 찍는다.
//    (글꼴·표지·아이콘이 전부 진짜여야 판정이 된다)
//
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_shot-coverbtn.mjs
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다 (2026-08-06)
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  // ⚠️ 먼저 «읽고» 그다음에 헤더를 쓴다 — 순서를 바꾸면 없는 주소에서 헤더가 두 번 나가 서버가 죽는다
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4341, r))

const { BASICS_VERSION, basicRecipes } = await import('../src/data/basics.js')
const now = Date.now()
const kong = basicRecipes.find((r) => r.title === '콩국수')
const recipes = [
  // ⓐ 창업자 화면과 같은 조건 = 안 꾸민 표지
  { id: 'u1', title: '오징어볶음', category: '한식', time: 20, thumb: 'icon', icon: 'fe_75',
    ingredients: ['오징어 2마리'], steps: ['볶는다.'], tags: [], savedAt: now + 9e4, source: 'user', cooked: 1 },
  // ⓑ 꾸민 표지 = 「레꾸가 주인공」이 제일 잘 드러나는 경우
  { id: 'u2', title: '들깨나물무침', category: '한식', time: 15, thumb: 'icon', icon: 'fe_143',
    decorBg: kong?.decorBg, decor: kong?.decor, ingredients: ['시래기 200g'], steps: ['볶는다.'], tags: [], savedAt: now + 8e4, source: 'user', cooked: 3 },
]

// ── 시안 넷 ─────────────────────────────────────────────────────────
// 왼쪽(아이콘 바꾸기) · 오른쪽(레시피 꾸미기) 를 각각 어떻게 할지만 적는다.
const VARIANTS = [
  { key: 'A', name: 'A. 지금 (오늘 아침에 만든 것)', note: '알약 둘 · 높이 34',
    left: { pill: true, label: '아이콘 바꾸기', h: 34, fs: 12.5, icon: 21 }, right: { label: '레시피 꾸미기', h: 34, fs: 12.5 } },
  { key: 'B', name: 'B. 왼쪽 글자만 짧게', note: '「아이콘」 두 자 · 폭이 확 준다',
    left: { pill: true, label: '아이콘', h: 34, fs: 12.5, icon: 21 }, right: { label: '레시피 꾸미기', h: 34, fs: 12.5 } },
  { key: 'C', name: 'C. 왼쪽은 아이콘만 (글자 없음)', note: '표지를 제일 안 가린다 · 원래 크기 그대로',
    left: { pill: false, label: '', h: 34, fs: 12.5, icon: 22 }, right: { label: '레시피 꾸미기', h: 34, fs: 12.5 } },
  { key: 'D', name: 'D. 둘 다 한 단계 작게', note: '왼쪽 「아이콘」 · 오른쪽 「꾸미기」 · 높이 30',
    left: { pill: true, label: '아이콘', h: 30, fs: 11.5, icon: 19 }, right: { label: '꾸미기', h: 30, fs: 11.5 } },
]

const W = 360
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: W, height: 880 }, deviceScaleFactor: 3 })
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, { recipes, diary: [], seedV: BASICS_VERSION })

const shots = {} // { 'ⓐA': dataURI, ... }
for (const [ci, rc] of recipes.entries()) {
  await page.goto('http://127.0.0.1:4341/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await page.locator('.grid-card').nth(ci).click()
  await page.waitForTimeout(900)

  for (const v of VARIANTS) {
    const size = await page.evaluate((vv) => {
      const L = document.querySelector('[aria-label="표지 아이콘 바꾸기"]')
      const R = document.querySelector('[aria-label="레시피 꾸미기"]')
      if (!L.dataset.orig) { L.dataset.orig = L.innerHTML; R.dataset.orig = R.innerHTML }
      const icoHTML = L.dataset.orig.match(/<(img|svg)[\s\S]*?<\/\1>|<img[^>]*>/)[0]

      // ── 왼쪽 ──
      L.innerHTML = icoHTML + (vv.left.label || '')
      const ico = L.querySelector('img, svg')
      if (ico) { ico.style.width = vv.left.icon + 'px'; ico.style.height = vv.left.icon + 'px' }
      Object.assign(L.style, vv.left.pill
        ? { width: 'auto', height: vv.left.h + 'px', padding: '0 12px 0 8px', gap: '5px', fontSize: vv.left.fs + 'px', justifyContent: 'flex-start' }
        : { width: vv.left.h + 'px', height: vv.left.h + 'px', padding: '0', gap: '0', fontSize: '0px', justifyContent: 'center' })

      // ── 오른쪽 ──
      R.innerHTML = R.dataset.orig.replace(/(<\/svg>)[\s\S]*$/, '$1') + vv.right.label
      Object.assign(R.style, { height: vv.right.h + 'px', fontSize: vv.right.fs + 'px' })

      const lb = L.getBoundingClientRect(), rb = R.getBoundingClientRect()
      return { l: Math.round(lb.width), r: Math.round(rb.width), gap: Math.round(rb.left - lb.right), h: Math.round(lb.height) }
    }, v)
    await page.waitForTimeout(250)

    const cover = (await page.locator('[aria-label="표지 아이콘 바꾸기"]').evaluateHandle((el) => el.parentElement)).asElement()
    const buf = await cover.screenshot()
    shots[`${ci}${v.key}`] = 'data:image/png;base64,' + buf.toString('base64')
    if (ci === 0) console.log(`  ${v.key} · 왼쪽 ${size.l}px · 오른쪽 ${size.r}px · 사이 ${size.gap}px · 높이 ${size.h}`)
  }
}

// ── 판 한 장으로 묶기 (앱 글꼴 그대로 쓰려고 앱 CSS 를 물린다) ──────
const cssHref = (readFileSync(join(DIST, 'index.html'), 'utf8').match(/href="[^"]*?(assets\/[^"]+\.css)"/) || [])[1]
const card = (ci, v) => `
  <div class="v">
    <div class="vh"><b>${v.name}</b><span>${v.note}</span></div>
    <div class="vs"><img src="${shots[`${ci}${v.key}`]}"></div>
  </div>`
const html = `<meta charset="utf-8"><link rel="stylesheet" href="/hankki/${cssHref}">
<style>
  body{margin:0;background:#e9e5dd;font-family:'Pretendard',system-ui,sans-serif;padding:22px}
  h2{font-size:19px;margin:0 0 4px;color:#3a322a}
  .sub{font-size:13px;color:#7b7168;margin:0 0 18px}
  .row{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:26px}
  .v{width:300px}
  .vh{margin-bottom:7px}
  .vh b{display:block;font-size:14px;color:#3a322a}
  .vh span{font-size:11.5px;color:#8b8177}
  .vs{border-radius:14px;overflow:hidden;box-shadow:0 3px 12px rgba(0,0,0,.13)}
  .vs img{display:block;width:100%}
</style>
<h2>🍱 표지 버튼 시안 넷 — 폭 360px 실물</h2>
<p class="sub">전부 «진짜 앱»을 띄워 버튼만 갈아끼우고 찍은 것. 글꼴·표지·아이콘 다 실물.</p>
<h2>ⓐ 안 꾸민 표지 <span style="font-size:12.5px;color:#8b8177">— 네 오징어볶음 화면과 같은 조건</span></h2>
<div class="row">${VARIANTS.map((v) => card(0, v)).join('')}</div>
<h2>ⓑ 꾸민 표지 <span style="font-size:12.5px;color:#8b8177">— 「레꾸가 주인공」이 제일 잘 드러나는 경우</span></h2>
<div class="row">${VARIANTS.map((v) => card(1, v)).join('')}</div>`
writeFileSync(join(OUT, '_coverbtn.html'), html)

const sheet = await b.newPage({ viewport: { width: 1290, height: 900 }, deviceScaleFactor: 2 })
await sheet.goto('http://127.0.0.1:4341/hankki/x') // 같은 오리진이라야 CSS·글꼴이 물린다
await sheet.setContent(html, { waitUntil: 'networkidle' })
await sheet.waitForTimeout(900)
await sheet.screenshot({ path: join(OUT, '표지버튼-시안넷.png'), fullPage: true })
console.log('→ /표지버튼-시안넷.png')
await b.close(); srv.close()
