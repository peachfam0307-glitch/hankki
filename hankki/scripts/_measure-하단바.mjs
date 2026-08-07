// 📏 하단 탭바 — 지금 한 칸이 몇 px 이고, 여섯이 되면 얼마나 좁아지나
//
// 창업자 2026-08-07 *"맨 아래 바에 한끼일기도 넣자. 일기쓰려면 레시피에서 한끼일기 또 들어가야 하니까"*
//                    *"홈가져오기를 플로팅으로 띄울까.. 홈에"* · *"여러각도로 고민해서 알려줘"*
// ⛔ 「좁아진다」는 느낌이다 — 몇 px 인지, 글자가 실제로 넘치는지 **재서** 판단한다.
// 📌 문서엔 이미 *"하단 탭 5개가 이미 꽉 찼고"*(리텐션-설계원칙 188줄) 라고 적혀 있다 — 그 근거를 숫자로 만든다.
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
await new Promise((r) => srv.listen(4411, r))
const { BASICS_VERSION } = await import('../src/data/basics.js')

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
// ⭐ 폭 세 가지로 잰다 — 작은 폰(320)·보통(360)·큰 폰(412). 좁은 쪽이 먼저 깨진다.
for (const W of [320, 360, 412]) {
  const page = await (await b.newContext({ viewport: { width: W, height: 800 }, deviceScaleFactor: 2 })).newPage()
  await page.addInitScript((s) => {
    localStorage.clear(); localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
    for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
  }, { recipes: [], seedV: BASICS_VERSION })
  await page.goto('http://127.0.0.1:4411/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1100)
  const r = await page.evaluate(() => {
    const nav = document.querySelector('.bottom-nav')
    if (!nav) return null
    const items = [...nav.querySelectorAll('.nav-item')]
    const cell = items[0]?.getBoundingClientRect().width || 0
    // 라벨이 실제로 몇 px 인가 — 칸보다 넓으면 줄바꿈되거나 잘린다
    const labels = items.map((el) => {
      const sp = [...el.querySelectorAll('span')].find((s) => (s.textContent || '').trim())
      if (!sp) return null
      const t = sp.textContent.trim()
      const m = document.createElement('span')
      const cs = getComputedStyle(sp)
      m.style.cssText = `position:fixed;left:-9999px;white-space:pre;font:${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily};letter-spacing:${cs.letterSpacing}`
      m.textContent = t; document.body.appendChild(m)
      const w = Math.ceil(m.getBoundingClientRect().width); m.remove()
      return { t, w, size: cs.fontSize }
    }).filter(Boolean)
    return { nav: Math.round(nav.getBoundingClientRect().width), n: items.length, cell: Math.round(cell), labels }
  })
  if (!r) { console.log(`⛔ ${W}px — 하단바를 못 찾았다`); await page.close(); continue }
  const six = r.nav / (r.n + 1)
  console.log(`\n📱 화면 ${W}px — 하단바 ${r.nav}px · 탭 ${r.n}개 · 한 칸 ${r.cell}px`)
  console.log(`   여섯이 되면 한 칸 = ${six.toFixed(1)}px  (지금보다 ${(r.cell - six).toFixed(1)}px 좁아진다)`)
  const worst = r.labels.slice().sort((a, b) => b.w - a.w)[0]
  console.log(`   글자 = ${r.labels.map((l) => `${l.t} ${l.w}px`).join(' · ')}  (글자 크기 ${r.labels[0].size})`)
  // ⭐ 칸에는 좌우 여백이 필요하다 — 글자가 칸의 «거의 전부»를 먹으면 붙어 보인다. 여유 4px 로 본다.
  console.log(`   ⚖️ 제일 긴 글자 「${worst.t}」 ${worst.w}px — 다섯이면 ${r.cell - worst.w}px 남고, 여섯이면 ${(six - worst.w).toFixed(1)}px 남는다`)
  if (six - worst.w < 4) console.log(`   ⛔ 여섯이면 「${worst.t}」가 칸을 꽉 채운다 — 글자가 붙거나 줄바꿈된다`)
  else console.log(`   ✅ 여섯이어도 「${worst.t}」는 들어간다`)
  await page.close()
}
await b.close(); srv.close()
