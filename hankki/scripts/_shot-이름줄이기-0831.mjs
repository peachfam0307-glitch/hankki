// 🔠 「이름이 너무 길다」 — 줄인 뒤를 실물로 찍고 «몇 줄로 접히는지»를 잰다 (창업자 2026-08-31)
//
// 📮 창업자 = *"아니면 **이름을줄이자 너무길어**"* → 물어보니 **셋 다** 골랐다
//    ⓐ 장바구니 카드 제품 이름 ⓑ 레시피 재료 줄 ⓒ 메모 「제가 쓰는 양념 —」 줄
//
// 🔬 재는 것 = **화면에 그려진 높이**다(글자 수가 아니다).
//    한 줄인지 두 줄인지는 `getClientRects().length` 가 말해준다 — CSS 값으로는 알 수 없다.
//
// ⭐ 여는 레시피 = **「뚝딱 버섯 볶음밥」** — 창업자가 실제로 폰에서 본 그 편이다(2026-08-31 열림).
//    ⛔ 다른 편으로 찍으면 「창업자가 본 화면」이 아니다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_shot-이름줄이기-0831.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = '/home/user/hankki/hankki/dist'
const OUT = process.env.SHOT_OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/이름줄이기'
const VW = Number(process.env.W || 411), VH = Number(process.env.H || 891)
mkdirSync(OUT, { recursive: true })
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let b, t = M[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4487, r))
const { SEED_COACH_SEEN } = await import('/home/user/hankki/hankki/src/coach.js')

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 3, timezoneId: 'Asia/Seoul' })
await ctx.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  localStorage.setItem('hankki:giftSheetSeen', '1')
})
await ctx.addInitScript({ content: SEED_COACH_SEEN })
const pg = await ctx.newPage()
const 터짐 = []
pg.on('pageerror', (e) => 터짐.push(String(e).slice(0, 140)))
await pg.goto('http://127.0.0.1:4487/hankki/', { waitUntil: 'networkidle' })
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
  await 칸.click(); await pg.waitForTimeout(1200); return true
}
// ⛔ 목록이 길면 스크롤해서 찾는다
let 연것 = null
for (let 번 = 0; 번 < 8 && !연것; 번++) {
  if (await 열기('뚝딱 버섯 볶음밥')) { 연것 = '뚝딱 버섯 볶음밥'; break }
  await pg.mouse.wheel(0, 900); await pg.waitForTimeout(350)
}
if (!연것) { console.error('⛔ 「뚝딱 버섯 볶음밥」을 못 열었다 — 목록 모양이 바뀌었나(규칙 18)'); process.exit(1) }

// ── 📏 «그려진» 줄 수를 센다 ─────────────────────────────────
// ⛔⛔ [2026-08-31 · 규칙 18 ⓘ] **첫 판이 「전부 1줄」이라고 초록불을 냈는데 화면은 두 줄이었다.**
//    뿌리 = `height / lineHeight` 로 셌다. `.ing` 은 위아래 여백(padding·margin)이 있어서
//    그 나눗셈이 두 줄을 1로 반올림해 버린다. **CSS 값으로 재면 이렇게 조용히 틀린다.**
//    ✅ `Range` 로 «글자가 실제로 그려진 상자»를 세면 여백이 안 섞인다 — 그게 진짜 줄 수다.
const 잰다 = await pg.evaluate(`(() => {
  const 줄수 = (el) => {
    const r = document.createRange()
    r.selectNodeContents(el)
    const rects = [...r.getClientRects()].filter((x) => x.width > 1 && x.height > 1)
    // 같은 «윗변»을 쓰는 상자는 한 줄이다(배지·span 이 섞여도 안 부풀려진다)
    return new Set(rects.map((x) => Math.round(x.top))).size || 1
  }
  const 카드 = document.querySelector('[data-coach="pantry"]')
  const 픽 = 카드 ? [...카드.querySelectorAll('span')].filter((s) => s.style.fontSize === '19px').map((s) => ({ 글: s.textContent, 줄: 줄수(s) })) : []
  const 재료 = [...document.querySelectorAll('.ing')].map((d) => ({ 글: d.textContent, 줄: 줄수(d) }))
  return { 픽, 재료: 재료.filter((x) => x.글.includes('어떤 것이든') || x.글.length > 20) }
})()`)
console.log(`\n🛒 픽 카드 제품 이름 — ${잰다.픽.length}개`)
for (const p of 잰다.픽) console.log(`   ${p.줄 > 1 ? '⚠️ ' + p.줄 + '줄' : '✅ 1줄 '} | ${p.글}`)
console.log(`\n🥬 긴 재료 줄 — ${잰다.재료.length}개`)
for (const r of 잰다.재료) console.log(`   ${r.줄 > 1 ? '⚠️ ' + r.줄 + '줄' : '✅ 1줄 '} | ${r.글}`)

const 접힘 = [...잰다.픽, ...잰다.재료].filter((x) => x.줄 > 1).length
console.log(`\n   📊 두 줄로 접힌 것 = ${접힘}개`)

await pg.evaluate(`document.querySelector('[data-coach="pantry"]').scrollIntoView({ block: 'center' })`)
await pg.waitForTimeout(400)
await pg.screenshot({ path: join(OUT, '01-픽카드-화면.png') })
const box = await pg.locator('[data-coach="pantry"]').boundingBox()
await pg.screenshot({ path: join(OUT, '02-픽카드.png'), clip: { x: Math.max(0, box.x - 8), y: Math.max(0, box.y - 8), width: Math.min(VW, box.width + 16), height: Math.min(VH - box.y + 8, box.height + 16) } })

// 재료 + 메모가 같이 보이는 자리
await pg.evaluate(`{ const d = document.querySelectorAll('.ing'); if (d.length) d[Math.floor(d.length / 2)].scrollIntoView({ block: 'center' }) }`)
await pg.waitForTimeout(400)
await pg.screenshot({ path: join(OUT, '03-재료줄.png') })

// 메모(「제가 쓰는 양념 —」)
const 메모있나 = await pg.evaluate(`(() => {
  const el = [...document.querySelectorAll('div,p,span')].find((d) => d.children.length === 0 && /제가 쓰는 양념/.test(d.textContent))
  if (!el) return null
  el.scrollIntoView({ block: 'center' })
  return el.textContent.slice(0, 120)
})()`)
await pg.waitForTimeout(400)
if (메모있나) { await pg.screenshot({ path: join(OUT, '04-메모.png') }); console.log(`\n📝 메모 = ${메모있나}`) }
else console.log('\n📝 메모 「제가 쓰는 양념」 줄을 화면에서 못 찾았다')

console.log(`   ${터짐.length ? '⛔ pageerror ' + 터짐.length + ' — ' + 터짐[0] : '✅ pageerror 0'}`)
console.log(`   📁 ${OUT}\n`)
await b.close(); srv.close()
