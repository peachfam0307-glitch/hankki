// 🐻 레시피 상세 두 자리만 따로 — 맨 끝 「다 됐어요」 칸(손뼉 곰) ＋ 공유 시트(엄지척 곰)
// 📮 창업자 2026-08-14 *"다 스샷찍어줘 고화질로"* — 앞 스크립트가 이 둘을 못 잡아서 갈라 찍는다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = '/home/user/hankki/hankki/dist'
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/옛곰'
const VW = 411, VH = 891
mkdirSync(OUT, { recursive: true })
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let b, t = M[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4472, r))
const { SEED_COACH_SEEN } = await import('/home/user/hankki/hankki/src/coach.js')

const 찾기 = `(() => {
  const out = []
  for (const im of document.querySelectorAll('img')) {
    const m = (im.currentSrc || im.src || '').match(/\\/(gom_thumbsup|gom_clap)-/)
    if (!m) continue
    const r = im.getBoundingClientRect()
    if (r.width < 6 || r.left < -1 || r.top < -1 || r.right > ${VW} + 1 || r.bottom > ${VH} + 1) continue
    const cs = getComputedStyle(im)
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.05) continue
    out.push({ 컷: m[1], x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) })
  }
  return out
})()`

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 4, timezoneId: 'Asia/Seoul' })
await ctx.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  localStorage.setItem('hankki:giftSheetSeen', '1')
})
await ctx.addInitScript({ content: SEED_COACH_SEEN })   // ⭐ 코치마크를 «본 걸로» 심는다 — 클릭을 가로채지 않게
const pg = await ctx.newPage()
const 터짐 = []
pg.on('pageerror', (e) => 터짐.push(String(e).slice(0, 140)))
await pg.goto('http://127.0.0.1:4472/hankki/', { waitUntil: 'networkidle' })
await pg.waitForTimeout(1200)
{
  const a = pg.getByRole('button', { name: '나중에' }).first()
  if (await a.count() && await a.isVisible().catch(() => false)) await a.click().catch(() => {})
  await pg.waitForTimeout(400)
}

async function 찍자(이름, 설명) {
  const 곰들 = await pg.evaluate(찾기)
  if (!곰들.length) { console.log(`   ⛔ ${이름} — 못 찾음`); return }
  await pg.screenshot({ path: join(OUT, `${이름}.png`) })
  for (const [i, g] of 곰들.entries()) {
    const pad = Math.max(16, Math.round(g.w * 0.7))
    const x = Math.max(0, g.x - pad), y = Math.max(0, g.y - pad)
    await pg.screenshot({ path: join(OUT, `${이름}-확대${곰들.length > 1 ? i + 1 : ''}.png`), clip: { x, y, width: Math.min(VW - x, g.w + pad * 2), height: Math.min(VH - y, g.h + pad * 2) } })
  }
  console.log(`   ✅ ${이름.padEnd(26)} ${곰들.map((g) => `${g.컷} ${g.w}×${g.h}px`).join(' · ')}   ${설명}`)
}

await pg.getByRole('button', { name: /^레시피/ }).last().click()
await pg.waitForTimeout(900)
await pg.locator('.app-frame .screen .grid-card, .app-frame .screen .mini-card').first().click()
await pg.waitForTimeout(1200)

// ① 맨 끝 완성 칸 — 「쿵 착지」 모션이라 다 내려앉은 뒤에 찍는다
// ⛔ `.screen` 을 굴리는 것만으론 «안 됐다» — 굴리는 상자가 거기가 아닐 수 있다(규칙 18).
//    그래서 칸을 콕 집어 `scrollIntoView` 하고, 진짜로 왔는지 자리를 찍어 본다.
const 어디 = await pg.evaluate(`(() => {
  const d = document.querySelector('.done-strip')
  if (!d) return { 없다: true }
  d.scrollIntoView({ block: 'center' })
  const r = d.getBoundingClientRect()
  return { top: Math.round(r.top), h: Math.round(r.height) }
})()`)
console.log('   📍 완성 칸 자리 =', JSON.stringify(어디))
await pg.waitForTimeout(1600)
await 찍자('06-레시피상세-완성칸', '맨 끝 「다 됐어요」 칸')

// ② 공유 시트
const 공유 = pg.locator('.app-frame button[aria-label*="공유"], .app-frame button:has-text("공유")').first()
if (await 공유.count()) { await 공유.click(); await pg.waitForTimeout(1100); await 찍자('07-레시피상세-공유시트', '「친구랑 공유하기」 시트 첫 줄') }
else console.log('   ⛔ 공유 단추를 못 찾았다')

console.log(`\n💥 pageerror ${터짐.length}건`)
터짐.slice(0, 3).forEach((e) => console.log('   ', e))
await b.close(); srv.close()
