// 🎃 핼러윈 «이벤트 테마» 시안 — 진짜 홈 화면에 입혀서 찍는다 (2026-09-09)
//
// 📮 창업자 = *"테마를 이벤트테마로 추가할수있냐는거야. 추석은 얼마안남았으니 할로윈이라도.."*
//
// ⭐ 왜 이렇게 하나 = 색을 «말»로 고르면 반드시 헛돈다(규칙 11 · 미감은 눈으로 판정한다).
//    소스를 고치지 «않고» 후보 팔레트를 화면에 얹어 찍는다 — 고를 때까지 저장소는 그대로다.
//
// ⛔ 후보마다 `--brown`(포인트)이 다르다. 지금 규칙은 **전 테마 통일 = 더스티 블루**인데
//    「이벤트 테마」는 그걸 깨는 게 «목적»일 수 있다 → 창업자가 판정할 자리다. 내가 안 정한다.
//
// ⛔ 브라우저 경로를 판에 박지 않는다 — `SMOKE_CHROMIUM` 만 읽는다(v10.90 사고)
//
// 쓰는 법 = node scripts/_shot-핼러윈테마시안-0909.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = process.env.OUT || '/tmp/hankki-핼러윈테마'
rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true })

// 🎨 후보 셋 — 살구 테마(styles.css 194줄)를 «틀»로 삼아 같은 변수 17개를 채운다.
//    ⛔ 변수를 하나라도 빼면 앞 테마 값이 남아 «섞인 화면»이 된다.
const 후보 = [
  { key: 'A-호박밤', 설명: '옅은 호박빛 · 밝게 (살구의 사촌)', v: {
    '--bg': '#fdf0e0', '--surface': '#ffffff', '--cream': '#fbe4cb', '--cream-deep': '#f5d4b2',
    '--sand': '#dcb389', '--brown': '#d2691e', '--text': '#3b3128', '--text-sub': '#8d7a68',
    '--line': '#f6e2cc', '--danger': '#c85a3f', '--frame': '#f9ead9',
    '--nav-bg': 'rgba(253,240,224,0.92)', '--today-grad': 'linear-gradient(135deg,#fffbf5,#fdf4e9)',
    '--tease': 'linear-gradient(100deg,#efe7f3,#e4d9ec)', '--tease-ic': '#7a5aa6', '--tease-line': '#ddd0e6',
    '--thumb': 'linear-gradient(160deg,#ffffff,#fcf2e6)' } },
  { key: 'B-마녀의밤', 설명: '깊은 보라 차콜 · 어둡게 (다크의 핼러윈판)', v: {
    '--bg': '#1c1622', '--surface': '#292036', '--cream': '#332942', '--cream-deep': '#3d3150',
    '--sand': '#5a4a70', '--brown': '#f0932b', '--text': '#efe7f5', '--text-sub': '#a99cb8',
    '--line': '#3a2f4a', '--danger': '#e07a5f', '--frame': '#2f2640',
    '--nav-bg': 'rgba(28,22,34,0.92)', '--today-grad': 'linear-gradient(135deg,#332942,#292036)',
    '--tease': 'linear-gradient(100deg,#33294a,#2b2440)', '--tease-ic': '#c9a6f0', '--tease-line': '#443a58',
    '--thumb': 'linear-gradient(160deg,#332942,#282034)' } },
  { key: 'C-보랏빛저녁', 설명: '옅은 라벤더 · 밝게 (호박 대신 보라로)', v: {
    '--bg': '#f4eff8', '--surface': '#ffffff', '--cream': '#ebe1f2', '--cream-deep': '#ded0ea',
    '--sand': '#c3aed6', '--brown': '#7a4fa8', '--text': '#3a3140', '--text-sub': '#877a94',
    '--line': '#eae0f2', '--danger': '#c85a3f', '--frame': '#f2ebf7',
    '--nav-bg': 'rgba(244,239,248,0.92)', '--today-grad': 'linear-gradient(135deg,#fdfbff,#f6f1fa)',
    '--tease': 'linear-gradient(100deg,#fdeee2,#f9e2cf)', '--tease-ic': '#d2691e', '--tease-line': '#f0dcc6',
    '--thumb': 'linear-gradient(160deg,#ffffff,#f7f2fb)' } },
]

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p = await ctx.newPage()

const 시트닫기 = async () => {
  for (let i = 0; i < 5; i++) {
    const 닫았나 = await p.evaluate(() => {
      const b = [...document.querySelectorAll('button, [role="button"]')]
        .filter((x) => x.getBoundingClientRect().height > 8)
        .find((x) => /^(나중에 볼게요|닫기)$/.test((x.innerText || '').trim()))
      if (!b) return false; b.click(); return true
    })
    if (닫았나) { await p.waitForTimeout(500); continue }
    if (!(await p.locator('.sheet-mask').count())) break
    await p.keyboard.press('Escape'); await p.waitForTimeout(350)
  }
}

// 🔢 대비를 «재서» 같이 찍는다 — 눈으로만 고르면 읽기 힘든 판을 고를 수 있다(WCAG AA = 4.5)
const 대비 = (a, b) => {
  const L = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] }
  const [x, y] = [L(a), L(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05)
}

await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(2200)
await 시트닫기()

// 지금 판(그레이지) 도 같이 찍는다 — 「무엇이 달라지나」는 나란히 놔야 보인다
await p.screenshot({ path: join(OUT, '00-지금-그레이지.png') })

for (const c of 후보) {
  await p.evaluate((v) => { const r = document.documentElement
    for (const [k, val] of Object.entries(v)) r.style.setProperty(k, val) }, c.v)
  await p.waitForTimeout(500)
  await p.screenshot({ path: join(OUT, `${c.key}.png`) })
  const 글자대비 = 대비(c.v['--bg'], c.v['--text']).toFixed(2)
  console.log(`🎨 ${c.key.padEnd(12)} 글자대비 ${글자대비} ${글자대비 >= 4.5 ? '✅' : '⛔ 4.5 미만'}  — ${c.설명}`)
}

console.log(`📄 ${OUT}`)
await b.close(); srv.close()
