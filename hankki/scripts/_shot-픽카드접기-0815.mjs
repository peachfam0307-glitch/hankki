// 🔽 픽카드 접기 — 「접힌 모습 ↔ 펼친 모습」을 실물 화면으로 찍는다
//
// 📮 창업자 2026-08-15 — *"4칸남어가면 접을 수 있게 해줘. 너무 길면 좀 그래."*
//    ＋ *"올리브유는 빼자"* → `curation.js` 1L 의 `matches` 제거
//
// 🔢 실측(113편) — 올리브유 빼기 «전» 5개 이상이 15편 → «뒤» 9편. 평균 2.54 → 2.37개.
//    제일 긴 편 = 어묵탕 7개(11/23 잠금) · 지금 열려 있는 것 중엔 돼지고기 김치찌개 6개.
//
// ⭐ 규칙 21 — **보내기 전에 내가 열어 본다.** 숫자만 보고 보내지 않는다.
// ⛔ 규칙 19 — 「접기」가 펼친 뒤에도 그려지는지까지 본다(ShopScreen 에서 냈던 사고).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = '/home/user/hankki/hankki/dist'
const OUT = process.env.SHOT_OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/픽카드접기'
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
await new Promise((r) => srv.listen(4481, r))
const { SEED_COACH_SEEN } = await import('/home/user/hankki/hankki/src/coach.js')

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 4, timezoneId: 'Asia/Seoul' })
await ctx.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  localStorage.setItem('hankki:giftSheetSeen', '1')
})
await ctx.addInitScript({ content: SEED_COACH_SEEN })
const pg = await ctx.newPage()
const 터짐 = []
pg.on('pageerror', (e) => 터짐.push(String(e).slice(0, 140)))
await pg.goto('http://127.0.0.1:4481/hankki/', { waitUntil: 'networkidle' })
await pg.waitForTimeout(1200)
{
  const a = pg.getByRole('button', { name: '나중에' }).first()
  if (await a.count() && await a.isVisible().catch(() => false)) await a.click().catch(() => {})
  await pg.waitForTimeout(400)
}

await pg.getByRole('button', { name: /^레시피/ }).last().click()
await pg.waitForTimeout(900)

const 열기 = async (제목) => {
  const 칸 = pg.locator(`.app-frame .screen :text("${제목}")`).first()
  if (!await 칸.count()) return false
  await 칸.click(); await pg.waitForTimeout(1100); return true
}
// 🔎 픽이 «제일 많은» 편부터 — 접힘이 실제로 보이는 편이라야 판정이 된다
let 연것 = null
for (const t of ['돼지고기 김치찌개', '부대찌개', '국물 떡볶이', '감바스']) { if (await 열기(t)) { 연것 = t; break } }
if (!연것) { console.error('⛔ 레시피를 못 열었다 — 목록 모양이 바뀌었나(규칙 18)'); process.exit(1) }

const 재기 = async () => pg.evaluate(`(() => {
  const d = document.querySelector('[data-coach="pantry"]')
  if (!d) return { 없다: true }
  d.scrollIntoView({ block: 'center' })
  const r = d.getBoundingClientRect()
  const 줄 = [...d.querySelectorAll('img')].length
  const 글 = (d.innerText || '').split('\\n').filter(Boolean)
  return { 높이: Math.round(r.height), 제품줄: 줄, 글 }
})()`)

const 접힘 = await 재기()
if (접힘.없다) { console.error('⛔ 픽카드가 이 편엔 없다'); process.exit(1) }
await pg.waitForTimeout(400)
await pg.screenshot({ path: join(OUT, '01-접힌모습-화면.png') })
{
  const box = await pg.locator('[data-coach="pantry"]').boundingBox()
  await pg.screenshot({ path: join(OUT, '02-접힌모습-카드.png'), clip: { x: Math.max(0, box.x - 8), y: Math.max(0, box.y - 8), width: Math.min(VW, box.width + 16), height: Math.min(VH - box.y + 8, box.height + 16) } })
}
console.log(`   📍 ${연것} — 접힘: 높이 ${접힘.높이}px · 제품줄 ${접힘.제품줄}`)
console.log(`      글: ${접힘.글.join(' / ')}`)

// 🔽 「더보기」를 눌러 본다
const 더 = pg.locator('[data-coach="pantry"] button', { hasText: /더보기/ }).first()
if (!await 더.count()) { console.error('⛔ 「더보기」 버튼이 없다 — 이 편은 픽이 4개 이하인가'); process.exit(1) }
await 더.click(); await pg.waitForTimeout(500)
const 펼침 = await 재기()
await pg.waitForTimeout(300)
await pg.screenshot({ path: join(OUT, '03-펼친모습-화면.png') })
{
  const box = await pg.locator('[data-coach="pantry"]').boundingBox()
  await pg.screenshot({ path: join(OUT, '04-펼친모습-카드.png'), clip: { x: Math.max(0, box.x - 8), y: Math.max(0, box.y - 8), width: Math.min(VW, box.width + 16), height: Math.min(VH - box.y + 8, box.height + 16) } })
}
console.log(`   📍 ${연것} — 펼침: 높이 ${펼침.높이}px · 제품줄 ${펼침.제품줄}`)

// ⛔ ShopScreen 에서 냈던 사고 — 펼친 뒤 「접기」가 안 그려지면 되돌아갈 길이 없다
const 접기있나 = await pg.locator('[data-coach="pantry"] button', { hasText: /^접기$/ }).count()
console.log(`   ${접기있나 ? '✅ 펼친 뒤 「접기」 있다' : '⛔ 펼친 뒤 「접기」가 없다 — 되돌아갈 길이 없다'}`)
if (접기있나) { await pg.locator('[data-coach="pantry"] button', { hasText: /^접기$/ }).first().click(); await pg.waitForTimeout(400) }
const 되접힘 = await 재기()
console.log(`   ${되접힘.제품줄 === 접힘.제품줄 ? '✅ 다시 접힌다' : '⛔ 접기가 안 먹는다'} (${되접힘.제품줄}줄)`)

console.log(`   📏 카드 높이 ${접힘.높이}px → ${펼침.높이}px (접으면 ${펼침.높이 - 접힘.높이}px 짧다)`)
console.log(`   ${터짐.length ? '⛔ pageerror ' + 터짐.length + ' ' + 터짐[0] : '✅ pageerror 0'}`)
console.log(`   📁 ${OUT}`)
await b.close(); srv.close()
