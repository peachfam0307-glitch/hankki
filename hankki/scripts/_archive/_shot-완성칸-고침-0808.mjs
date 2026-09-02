// 🖼 검수판 — 「완성 칸 조각이 단계 글자를 덮던 것」 고친 뒤 실물
//
// ⚠️⚠️ **지난 검수판이 이 버그를 놓친 이유** = `_shot-detail-hl.mjs`·`_shot-detail-motion.mjs` 는
//    **완성 칸 요소만 잘라** 찍었다. 칸 «위»가 사진에 안 들어와서 조각이 단계를 덮는 걸 볼 수가 없었다.
//    ✅ 그래서 이 판은 **마지막 단계 두 개 ＋ 완성 칸을 «한 장에»** 담는다.
//
// 🍓 ＋ 딸기 잘림 — 지금 쓰는 컷(89x77)은 **파일 자체가 잘려 있다**(아랫변 알파 255).
//    저장소에 깨끗한 원본(145x175)이 둘 있어 나란히 놓는다. **톤 판정은 창업자 몫**(규칙 11).
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
await new Promise((r) => srv.listen(4372, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
let bad = 0

// 🎨 테마 셋 다 — 창업자 *"앱배경 우리 테마 3개라 다 잘어울려야해"*
for (const [theme, tname] of [['greige', '그레이지'], ['cream', '크림'], ['dark', '다크']]) {
  const page = await b.newPage({ viewport: { width: 360, height: 1000 }, deviceScaleFactor: 3 })
  page.on('pageerror', (e) => { console.log('⛔ pageerror:', String(e.message).split('\n')[0]); bad++ })
  await page.addInitScript((a) => {
    localStorage.setItem('hankki:v1', JSON.stringify(a.s)); localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1'); localStorage.setItem('hankki-theme', a.theme)
    for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
  }, { s: { recipes: [], seedV: BASICS_VERSION }, theme })
  await page.goto('http://127.0.0.1:4372/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  await page.locator('.grid-card').first().click()
  await page.waitForTimeout(900)

  // ⭐ 마지막 단계 «두 개» ~ 완성 칸까지를 한 상자로 묶어 찍는다
  const clip = await page.evaluate(() => {
    const steps = [...document.querySelectorAll('.step')]
    const strip = document.querySelector('.done-strip')
    if (!strip) return null
    const from = steps.length >= 2 ? steps[steps.length - 2] : steps[steps.length - 1]
    if (from) from.scrollIntoView({ block: 'start' })
    return true
  })
  if (!clip) { console.log('⛔ 완성 칸 없음'); bad++; await page.close(); continue }
  await page.waitForTimeout(500)

  const box = await page.evaluate(() => {
    const steps = [...document.querySelectorAll('.step')]
    const strip = document.querySelector('.done-strip')
    const from = (steps.length >= 2 ? steps[steps.length - 2] : steps[steps.length - 1]).getBoundingClientRect()
    const sr = strip.getBoundingClientRect()
    return { x: 8, y: Math.max(0, from.top - 14), width: 344, height: (sr.bottom - from.top) + 28 }
  })
  await page.screenshot({ path: `${OUT}/고침-완성칸-${theme}.png`, clip: box })
  console.log(`   ✅ ${tname} — 단계 두 개 ＋ 완성 칸 한 장 (${Math.round(box.height)}px)`)
  await page.close()
}

// ── 🍓 딸기 후보 나란히 (원본 픽셀 100% · 판정은 창업자) ──────────
const CANDS = [
  ['src/assets/stickers/fx/strawberry.png', '지금 쓰는 것 (89x77 · ⛔아랫변 잘림)'],
  ['docs/stickers/보너스-음식도구-2507/낱개/fruit_strawberry.png', '후보 A — 보너스 음식도구 (145x175)'],
  ['docs/stickers/음식이모지-재업로드-2507/낱개/food_strawberry.png', '후보 B — 음식이모지 재업로드 (145x175)'],
]
const p2 = await b.newPage({ viewport: { width: 720, height: 460 }, deviceScaleFactor: 3 })
const imgs = CANDS.map(([f, n]) => {
  const d = readFileSync(join(ROOT, f)).toString('base64')
  return `<figure><img src="data:image/png;base64,${d}"><figcaption>${n}</figcaption></figure>`
}).join('')
await p2.setContent(`<style>
  body{margin:0;background:#efece4;font-family:"Noto Sans KR",sans-serif;padding:18px}
  h1{font-size:16px;margin:0 0 4px;color:#332e28}
  p{font-size:12.5px;color:#7b7264;margin:0 0 14px}
  .row{display:flex;gap:14px;align-items:flex-end}
  figure{margin:0;flex:1;text-align:center;background:#faf8f4;border:1px solid #e0d9cb;border-radius:12px;padding:12px}
  img{display:block;margin:0 auto;image-rendering:auto;max-height:175px}
  figcaption{font-size:11px;color:#7b7264;margin-top:8px;line-height:1.4}
</style><h1>🍓 딸기 조각 — 어느 걸 쓸까</h1>
<p>지금 것은 <b>파일 자체가 잘려 있다</b>(아랫변이 캔버스 끝에 붙어 알파 255). 원본 픽셀 100%로 띄웠어.</p>
<div class="row">${imgs}</div>`)
await p2.waitForTimeout(300)
await p2.screenshot({ path: `${OUT}/딸기-후보.png`, fullPage: true })
console.log('   ✅ 딸기 후보 셋 나란히')
await p2.close()

await b.close(); srv.close()
console.log(bad ? `\n⛔ 문제 ${bad}건` : '\n✅ 검수판 완료 — pageerror 0')
process.exit(bad ? 1 : 0)
