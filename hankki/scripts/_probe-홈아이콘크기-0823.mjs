// 📏 홈 — 「자주 해먹는 요리」 음식 그림이 다른 칸보다 작나 (창업자 2026-08-23)
//
// 📮 창업자 = *"자주해먹는요리 요리이모지들어간 그림 크기 다른칸이비해 작음. 조금만더크게수정."*
//
// ⭐ 재는 법 = 화면에 «실제로 그려진 px»(절대원칙 30). 코드의 % 값이 아니라 결과를 본다.
//   ⛔ `iconSize` 는 어느 칸이나 '56%' 로 «같다» — 다른 건 그 %가 걸리는 «상자 크기»다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_probe-홈아이콘크기-0823.mjs
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
await new Promise((r) => srv.listen(4391, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
await page.goto('http://127.0.0.1:4391/hankki/', { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(1000)

const 잰것 = await page.evaluate(() => {
  // ⛔ DOM 을 더듬어 찾다 «머리글의 작은 아이콘»을 재서 27px 이 나왔다 —
  //    잣대는 «그 물건»을 콕 집어야 한다(절대원칙 18 ⓘ). 그래서 클래스로 직접 집는다.
  const 잰다 = (sel) => {
    const btn = document.querySelector(sel)
    if (!btn) return null
    const img = btn.querySelector('img')
    if (!img) return null
    const r = img.getBoundingClientRect()
    const 상자 = btn.getBoundingClientRect()
    const 판 = img.parentElement.getBoundingClientRect()
    return {
      그림: Math.round(Math.min(r.width, r.height)),
      판: Math.round(판.width),
      카드폭: Math.round(상자.width),
      비율: +(Math.min(r.width, r.height) / 판.width).toFixed(3),
    }
  }
  return { 자주: 잰다('.mini-card'), 최근: 잰다('.grid-card'), }
})

console.log('\n📏 홈 — 음식 그림 크기 (390×844)\n')
for (const [이름, v] of Object.entries(잰것)) {
  if (!v) { console.log(`  ⛔ ${이름} — 못 찾았다`); continue }
  console.log(`  ${이름.padEnd(6)}  그림 ${String(v.그림).padStart(3)}px   카드폭 ${String(v.카드폭).padStart(3)}px   그림÷카드 ${v.비율}`)
}
const a = 잰것.자주, c = 잰것.최근
if (a && c) {
  console.log(`\n  ⭐ 「자주 해먹는」 그림이 「최근 저장」의 ${(a.그림 / c.그림 * 100).toFixed(0)}% 크기다`)
  console.log(`     ⛔ 카드가 좁아서다(${a.카드폭} vs ${c.카드폭}) — 그림÷카드 비율은 ${a.비율} vs ${c.비율} 로 «같다»`)
}
console.log()

await b.close(); srv.close()
