// 🛒 픽카드 문구 — 「전 ↔ 후」를 실물 화면으로 찍는다
//
// 📮 창업자 전달(2026-08-15) — 🧑‍🤝‍🧑테스터 *"왜 많은 재료중에 몇개만 올려놨냐"*
//    ＋ 창업자 관찰 *"레시피에 광고부분에(주부의 장바구니에서 볼수있다는 내용이 없네)"*
//
// ⛔ 카드 어디에도 「주부의 장바구니」라는 말이 없어서 **어디서 온 목록인지 알 방법이 없었다.**
//    제목 「이 레시피, 이걸로 만들었어요」가 «재료 목록»으로 읽혀 「몇 개만 올렸다」가 된다.
// 🔢 실측 = 평균 재료 11.6줄 → 픽 2.9개 · 제일 큰 차이는 전복솥밥 28줄 → 2개.
//
// ⭐ 규칙 21 — **보내기 전에 내가 열어 본다.** 숫자만 보고 보내지 않는다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = '/home/user/hankki/hankki/dist'
const OUT = process.env.SHOT_OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/픽카드'
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
await new Promise((r) => srv.listen(4479, r))
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
await pg.goto('http://127.0.0.1:4479/hankki/', { waitUntil: 'networkidle' })
await pg.waitForTimeout(1200)
{
  const a = pg.getByRole('button', { name: '나중에' }).first()
  if (await a.count() && await a.isVisible().catch(() => false)) await a.click().catch(() => {})
  await pg.waitForTimeout(400)
}

// 🔎 픽카드가 «많이» 뜨는 편으로 간다 — 부대찌개(재료 24줄 → 픽 5개)가 오해를 제일 잘 보여준다
await pg.getByRole('button', { name: /^레시피/ }).last().click()
await pg.waitForTimeout(900)

const 열기 = async (제목) => {
  const 칸 = pg.locator(`.app-frame .screen :text("${제목}")`).first()
  if (!await 칸.count()) return false
  await 칸.click(); await pg.waitForTimeout(1100); return true
}
let 연것 = null
for (const t of ['부대찌개', '감바스', '목살조림']) { if (await 열기(t)) { 연것 = t; break } }
if (!연것) { console.error('⛔ 레시피를 못 열었다 — 목록 모양이 바뀌었나(규칙 18)'); process.exit(1) }

// ⭐ 카드를 콕 집어 화면 가운데로. `.screen` 만 굴리면 «굴리는 상자가 거기가 아닐» 수 있다(규칙 18)
const 자리 = await pg.evaluate(`(() => {
  const d = document.querySelector('[data-coach="pantry"]')
  if (!d) return { 없다: true }
  d.scrollIntoView({ block: 'center' })
  const r = d.getBoundingClientRect()
  return { top: Math.round(r.top), h: Math.round(r.height), 글: (d.innerText || '').split('\\n').slice(0, 2).join(' / ') }
})()`)
console.log(`   📍 ${연것} — 픽카드 자리 =`, JSON.stringify(자리, null, 0))
if (자리.없다) { console.error('⛔ 픽카드가 이 편엔 없다'); process.exit(1) }
await pg.waitForTimeout(500)

await pg.screenshot({ path: join(OUT, '01-화면전체.png') })
const box = await pg.locator('[data-coach="pantry"]').boundingBox()
await pg.screenshot({ path: join(OUT, '02-픽카드.png'), clip: { x: Math.max(0, box.x - 8), y: Math.max(0, box.y - 8), width: Math.min(VW, box.width + 16), height: Math.min(VH - box.y + 8, box.height + 16) } })

// 🔢 몇 줄 중 몇 개인지 같이 찍는다 — 「왜 몇 개만」이 이 숫자에서 나온다
const 셈 = await pg.evaluate(`(() => {
  const 재료 = document.querySelectorAll('[data-coach="ingredients"] li, .ing-row').length
  const 픽 = document.querySelectorAll('[data-coach="pantry"] button').length - 2   // 사러가기들 ＋ 다담기 ＋ ?
  return { 재료, 픽: Math.max(0, 픽) }
})()`)
console.log(`   🔢 ${연것} — 재료 ${셈.재료}줄 · 픽 ${셈.픽}개`)
console.log(`   ${터짐.length ? '⛔ pageerror ' + 터짐.length : '✅ pageerror 0'}`)
console.log(`   📁 ${OUT}`)
await b.close(); srv.close()
