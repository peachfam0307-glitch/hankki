// 🔍🎨 창업자 꾸미기 카드와 «똑같이» 얹고, 원본 위에 겹쳐 본다 (2026-09-19)
//
// 📮 창업자 2026-09-18 = *"내꺼랑 똑같은 자리에 정확하게 얹어야해"*
//   ＋ *"근데 너는 이상하게 붙이더라고... 예전에도 그래서 결국 내가 했었던 기억이 난다"*
//   ＋ *"특히 그릇프레임쓸때 정확하게 검은 테두리 가리게 잘 붙여야해"* · *"위에 얹는거야."*
//
// ⛔⛔ **내 미감으로 자리를 고르지 않는다** — 창업자 카드에서 «잰» 값을 그대로 넣는다.
//    📏 잰 값 = docs/꾸미기릴스-창업자카드-실측-2026-09-19.json
// ⭐ 그릇 프레임은 사진 «위»에 얹혀 원래 접시의 검은 테를 덮는다 → 자리·크기가 어긋나면 테가 삐져나온다.
//    그래서 대조판에 «접시 테두리 확대»를 따로 넣는다.
//
// 쓰는 법: SMOKE_CHROMIUM=… node scripts/_판-꾸미기대조-0919.mjs
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
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
await new Promise((r) => srv.listen(4617, r))
const 밖 = process.env.OUT || '/tmp/claude-0/꾸미기녹화'
mkdirSync(밖, { recursive: true })

// 🧩 창업자 카드 — «잰 값» 그대로. ⛔여기 숫자를 내 눈대중으로 고치지 않는다.
//    조각 이름은 서랍 411칸을 찍어 «눈으로» 골랐다(⛔문서에서 짐작 안 함).
const 겹 = [
  { 이름: '그릇 접시',        it: { type: 'sticker', key: 'pf_ad08', x: 0.505, y: 0.46, s: 0.75, r: 0 } },
  { 이름: '포토코너(왼위)',   it: { type: 'sticker', key: 'pc3_02', x: 0.125, y: 0.155, s: 0.19, r: 0 } },
  { 이름: '포토코너(오른아래)', it: { type: 'sticker', key: 'pc3_02', x: 0.85, y: 0.875, s: 0.18, r: 180 } },
  { 이름: '하트 마테',        it: { type: 'sticker', key: 'wt_dy06', x: 0.60, y: 0.78, s: 0.32, r: -3 } },
  { 이름: '제목 글자',        it: { type: 'note', text: '새우관자전', font: 'gaegu', color: '#83495d', x: 0.47, y: 0.135, s: 0.40, r: 0 } },
  { 이름: '카롱＋펭펭',       it: { type: 'sticker', key: 'kp_shoulder', x: 0.195, y: 0.68, s: 0.18, r: 0 } },
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
  let 맑음 = 0
  for (let i = 0; i < 20; i++) {
    const 것 = p.locator('.sheet-mask button, button:has-text("건너뛰기"), button:has-text("시작하기")').first()
    if (await 것.count() > 0 && await 것.isVisible().catch(() => false)) {
      try { await 것.click({ timeout: 1500 }); await p.waitForTimeout(250); continue } catch { /* 다시 */ }
    }
    if (await p.locator('.sheet-mask, button:has-text("건너뛰기")').count() === 0) { 맑음++; if (맑음 >= 2) return }
    else 맑음 = 0
    await p.waitForTimeout(500)
  }
}
await p.goto('http://127.0.0.1:4617/hankki/', { waitUntil: 'domcontentloaded' })
await p.waitForTimeout(2200); await 안내치우기()

// 💾 꾸미기를 «저장본에 직접» 심는다 — 앱이 한 번 저장한 뒤라야 한다(store.jsx:145)
const 심기 = async (몇겹) => {
  const 결과 = await p.evaluate(([줄들, n]) => {
    try {
      const s = JSON.parse(localStorage.getItem('hankki:v1') || 'null')
      if (!s || !Array.isArray(s.recipes)) return '아직 저장 전'
      const id = 'basic-saeu-gwanja-jeon'
      const 것들 = 줄들.slice(0, n).map((x, i) => ({ id: 'cmp' + i, ...x.it }))
      // ⛔⛔ 원래 줄을 «지우고 새로 넣으면» 레시피가 통째로 사라진다(2026-09-18 실측 — 목록에서 없어졌다).
      //    저장본의 그 줄은 «레시피 전부»를 들고 있다. 꾸미기만 얹는다.
      const 그줄 = s.recipes.find((r) => r.id === id)
      if (!그줄) return '⛔ 저장본에 그 레시피가 없다'
      그줄.decor = 것들
      그줄.decorBg = 'grid'
      localStorage.setItem('hankki:v1', JSON.stringify(s))
      return '심었다 ' + 것들.length + '겹'
    } catch (e) { return '⛔ ' + e.message }
  }, [겹, 몇겹])
  return 결과
}
console.log('  🌱', await 심기(겹.length))
await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2000); await 안내치우기()

// 🍤 레시피 상세 → 표지를 찍는다(꾸미기 화면이 아니라 «유저가 보는» 표지)
await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click()
await p.waitForTimeout(1200); await 안내치우기()
const 것 = p.locator('text=새우관자전').first().locator('xpath=ancestor-or-self::*[self::button or self::a][1]')
if (await 것.count() === 0) { await p.screenshot({ path: join(밖, '⚠️못찾음.png') }); console.log('  ⚠️ 새우관자전을 못 찾았다 — ⚠️못찾음.png 를 볼 것'); await b.close(); srv.close(); process.exit(1) }
await 것.scrollIntoViewIfNeeded(); await 것.click({ force: true })
await p.waitForTimeout(1600); await 안내치우기()
await p.screenshot({ path: join(밖, '내판-상세.png') })
// 🎨 꾸미기 화면도 — 창업자 캡처와 «같은 화면»이라야 겹쳐 볼 수 있다
await p.locator('[data-coach="decor"]').first().click({ force: true })
await p.waitForTimeout(1800); await 안내치우기()
await p.screenshot({ path: join(밖, '내판-꾸미기.png') })
const r = await p.evaluate(() => { const e = document.querySelector('.decor-stage'); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height } })
console.log('  📐 판 자리 =', JSON.stringify(r))
if (r) await p.screenshot({ path: join(밖, '내판-판만.png'), clip: r })
else console.log('  ⚠️ .decor-stage 를 못 찾았다 — 꾸미기 화면이 안 열렸다')
console.log('✅ →', 밖)
await b.close(); srv.close()
