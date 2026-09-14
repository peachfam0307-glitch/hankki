// 📐📐 「패드에서 카톡으로 레꾸자랑 보내면 «파일이 작게» 간다」 — 픽셀로 잰다 (2026-08-28)
//
// 📮 창업자 = *"패드는 카톡으로 레꾸자랑 보내기했을때 **파일이 작게 가.** 핸드폰은 **1장씩 크게** 가거든."*
//
// ⭐⭐ 이 판의 심장 = **「만들어진 파일이 몇 픽셀인가」** — 카톡 말풍선 크기가 아니다.
//    ⛔ 창업자 캡처는 «가로로 눕힌 패드»의 카톡이라 말풍선 폭 자체가 다르다.
//       말풍선만 보고 「작다」를 판정하면 **표시 문제와 파일 문제를 못 가른다**(규칙 18).
//    ✅ 그래서 앱이 `navigator.share` 에 «넘기는 File» 을 가로채 **가로×세로와 바이트**를 잰다.
//
// 🔢 소스에서 미리 읽은 것(짐작 아님) —
//    · 표지 카드 = `shareCover.js` 의 최종 캔버스가 **`W = 1080` 고정** (105줄)
//      단 높이는 `coverImg` 비율을 따른다 → **화면의 표지 «모양»이 다르면 세로가 달라진다**
//    · 레시피 카드 = `RecipeCard` 가 **`width: 1080, height: 1350` 고정** ＋ `pixelRatio: 1.6`
//      → 1728×2160 이 나와야 «정상»이다
//    👉 그러니 폭이 1080(또는 1728)이 아니면 그게 곧 답이다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_probe-패드공유크기-0828.mjs
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
await new Promise((r) => srv.listen(4423, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// 🧾 기기 둘 — 창업자가 실제로 쓰는 것(둘 다 갤럭시 · 같은 크롬 엔진)
const 기기들 = [
  { 이름: '📱 폰 (갤럭시 · 세로)', w: 390, h: 844, dpr: 3 },
  { 이름: '🖥 패드 (갤럭시탭 · 세로)', w: 800, h: 1280, dpr: 2 },
  { 이름: '🖥 패드 (갤럭시탭 · 가로)', w: 1280, h: 800, dpr: 2 },
]

const 결과 = []
for (const 기기 of 기기들) {
  const ctx = await b.newContext({ viewport: { width: 기기.w, height: 기기.h }, deviceScaleFactor: 기기.dpr })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  // 🎭 공유를 가로채 «넘어온 파일»을 그대로 잰다 — 흉내는 브라우저가 하는 일까지다
  await ctx.addInitScript(() => {
    window.__잰것 = []
    navigator.canShare = () => true
    navigator.share = async (opt) => {
      for (const f of (opt.files || [])) {
        const url = URL.createObjectURL(f)
        const im = new Image()
        await new Promise((r) => { im.onload = r; im.onerror = r; im.src = url })
        window.__잰것.push({ 이름: f.name, 타입: f.type, KB: Math.round(f.size / 1024), 가로: im.naturalWidth, 세로: im.naturalHeight })
      }
      return undefined
    }
  })
  const page = await ctx.newPage()
  await page.goto('http://127.0.0.1:4423/hankki/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(800)

  // 레꾸자랑 탭 → 첫 레시피 → 「내가 꾸민 표지 그대로」
  await page.evaluate(() => {
    const bs = [...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')]
    bs.find((x) => (x.innerText || '').replace(/\s+/g, '').includes('레꾸자랑'))?.click()
  })
  await page.waitForTimeout(800)
  await page.evaluate(() => { [...document.querySelectorAll('button[aria-label$="자랑하기"]')][0]?.click() })
  await page.waitForFunction(
    () => [...document.querySelectorAll('button')].some((x) => (x.innerText || '').includes('내가 꾸민 표지 그대로')),
    null, { timeout: 20000 },
  ).catch(() => {})

  // 📏 캡처 «대상»의 CSS 폭도 같이 잰다 — 파일 폭이 여기서 나온다
  const 잰폭 = await page.evaluate(() => {
    const 커버 = document.querySelector('.cover-box') || document.querySelector('[class*="cover"]')
    const out = { 커버: 커버 ? Math.round(커버.getBoundingClientRect().width) : null, 레시피: null }
    for (const d of document.querySelectorAll('div')) {
      const r = d.getBoundingClientRect()
      if (Math.round(r.width) === 1080 && Math.round(r.height) === 1350) { out.레시피 = 1080; break }
    }
    return out
  })

  await page.evaluate(() => {
    [...document.querySelectorAll('button')].find((x) => (x.innerText || '').includes('내가 꾸민 표지 그대로'))?.click()
  })
  await page.waitForFunction(() => (window.__잰것 || []).length > 0, null, { timeout: 60000 }).catch(() => {})
  await page.waitForTimeout(600)
  const 파일들 = await page.evaluate(() => window.__잰것 || [])
  결과.push({ 기기: 기기.이름, 잰폭, 파일들 })
  await page.close(); await ctx.close()
}

console.log('\n📐 레꾸자랑 「내가 꾸민 표지 그대로」 — 실제로 «나가는 파일»\n')
for (const r of 결과) {
  console.log(`${r.기기}`)
  console.log(`   화면 표지 폭 = ${r.잰폭.커버 ?? '못 찾음'}px · 레시피카드 = ${r.잰폭.레시피 ?? '없음(재료·순서가 없는 편)'}`)
  if (!r.파일들.length) { console.log('   ⛔ 나간 파일이 없다 — 공유까지 못 갔다\n'); continue }
  for (const f of r.파일들) console.log(`   · ${f.이름.padEnd(20)} ${String(f.가로).padStart(5)} × ${String(f.세로).padStart(5)} px · ${f.KB}KB`)
  console.log('')
}

// 판정 — 표지는 1080 폭이 «고정»이라야 하고, 레시피카드는 1728 이라야 한다
let 이상 = 0
for (const r of 결과) {
  for (const f of r.파일들) {
    const 표지 = /cover|hankki-share|표지/.test(f.이름) || f.가로 === 1080
    const 기대 = 표지 ? 1080 : 1728
    if (f.가로 !== 기대) { console.log(`⛔ ${r.기기} · ${f.이름} 가로 ${f.가로}px — ${기대}px 이라야 한다`); 이상++ }
  }
}
console.log(이상 ? `\n⛔ 기기마다 파일 크기가 다르다 (${이상}건)\n` : '\n✅ 세 기기에서 나가는 파일 크기가 «같다» — 파일은 안 작아진다\n')

await b.close(); srv.close()
