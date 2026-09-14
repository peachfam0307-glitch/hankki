// 🫧🍂 **가을 샘플(꽃게탕) 표지에 「뽀글」이 실제로 붙나** — 살아 있는 앱을 띄워 찍는다 (2026-09-09)
//
// 📮 창업자 = *"샘플에 뽀글효과넣어줘. 꼬르곰펭펭낙엽스티커있지? 거기에"*
//    → `basics.js` 꽃게탕 `decor` 의 `kgt-duo`(au_b30 = 꼬르곰＋펭펭 낙엽 더미)에 `fx: 'bubble'` 을 넣었다.
//
// ⭐ 왜 찍나 = 절대원칙 21(보여주기 «전»에 내가 실물을 열어 본다).
//    ⛔ 코드에 `fx: 'bubble'` 이 «있다»는 것과 화면에 «떠 있다»는 것은 다른 말이다.
//       실제로 `au_b` 효과는 2026-08-07 «전»엔 `FRIEND_IDS` 로 좁혀놔서 골라도 안 떴다.
//
// ⛔ 브라우저 경로를 판에 박지 않는다 — `SMOKE_CHROMIUM` 만 읽는다(v10.90 사고)
//
// 쓰는 법 = node scripts/_shot-가을샘플뽀글-0909.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = process.env.OUT || '/tmp/hankki-뽀글'
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

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
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
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

await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(2200)
await 시트닫기()

// ── 레시피 탭 → 꽃게탕 ────────────────────────────────────────
await p.locator('.nav-item', { hasText: '레시피' }).first().click()
await p.waitForTimeout(1200)
await 시트닫기()
await p.getByText('꽃게탕', { exact: false }).first().click()
await p.waitForTimeout(1800)
await 시트닫기()

// ⭐ 「효과 조각이 «몇 개» 화면에 있나」를 숫자로도 확인한다 — 캡처는 한 순간이라
//    애니메이션이 투명한 구간에 걸리면 «없는 것처럼» 보일 수 있다(규칙 18ⓘ · 숫자와 눈 둘 다).
const 뽀글수 = await p.evaluate(() => document.querySelectorAll('.hk-fx-bubble').length)
console.log(`🫧 화면의 뽀글 조각 = ${뽀글수}개`)

const 표지 = p.locator('.decor-layer, .cover-decor, [class*="cover"]').first()
try {
  await 표지.screenshot({ path: join(OUT, '01-표지.png') })
} catch {
  await p.screenshot({ path: join(OUT, '01-표지.png') })
}
await p.screenshot({ path: join(OUT, '02-화면전체.png') })

console.log(`📄 ${OUT}`)
await b.close(); srv.close()
process.exit(뽀글수 > 0 ? 0 : 1)
