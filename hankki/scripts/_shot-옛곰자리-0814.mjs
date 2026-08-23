// 🐻 「옛 매끈 곰」이 지금 «어디에» 나오나 — 화면마다 실물로 찍는다
//
// 📮 창업자 2026-08-14 *"지금 온보딩에 옛날곰이 들어가있다고? 어디? 다 스샷찍어줘 고화질로"*
// ✅ 창업자 판정 *"2.4번만 옛날곰이고 나머지는 물결곰이야."*
//    → **옛 곰 = `gom_thumbsup`(엄지척) · `gom_clap`(손뼉) 둘뿐.**
//      `gom_heart`(하트) · `gom_shop`(장보기)은 **물결 곰이라 안 건드린다.**
//
// ⛔ 표만 적어 보내지 않는다 — 규칙 21(보여주기 전에 내가 실물을 «열어서» 본다).
// ⛔⛔ 첫 판이 «화면 밖» 그림까지 셌다 — 온보딩은 열 장이 옆으로 늘어서 DOM 에 다 있고,
//     안내 코치도 안 뜬 칸이 미리 들어 있다. **보이는 자리 안에 있는 것만** 센다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = '/home/user/hankki/hankki/dist'
// 낼 곳 = 환경변수로 바꿀 수 있다(갈아끼운 «뒤» 화면을 딴 폴더에 담으려고)
const OUT = process.env.SHOT_OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/옛곰'
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
await new Promise((r) => srv.listen(4471, r))

// ⭐ 판정 둘 — ⑴옛 곰 컷인가(파일 이름) ⑵«보이는 자리 안»에 있나(화면 밖 제외)
const 찾기 = `(() => {
  const out = []
  for (const im of document.querySelectorAll('img')) {
    const src = im.currentSrc || im.src || ''
    const m = src.match(/\\/(gom_thumbsup|gom_clap)-/)
    if (!m) continue
    const r = im.getBoundingClientRect()
    if (r.width < 6 || r.height < 6) continue
    // 화면 밖(옆 슬라이드·안 뜬 코치)은 뺀다 — 통째로 들어와 있어야 «지금 보이는 것»이다
    if (r.left < -1 || r.top < -1 || r.right > ${VW} + 1 || r.bottom > ${VH} + 1) continue
    const cs = getComputedStyle(im)
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.05) continue
    // 진짜 눈에 보이나 — 그 자리를 찍었을 때 이 그림(이나 자식)이 잡히나
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    const 가림 = !(hit === im || im.contains(hit) || (hit && hit.contains(im)))
    out.push({ 컷: m[1], x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), 가림 })
  }
  return out
})()`

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const 찍은것 = []
let 번호 = 0

async function 찍자(pg, 이름, 설명) {
  const 곰들 = (await pg.evaluate(찾기)).filter((g) => !g.가림)
  if (!곰들.length) return 0
  번호++
  const n = String(번호).padStart(2, '0')
  const 화면 = `${n}-${이름}.png`
  await pg.screenshot({ path: join(OUT, 화면) })
  for (let i = 0; i < 곰들.length; i++) {
    const g = 곰들[i]
    const pad = Math.max(16, Math.round(g.w * 0.6))
    const x = Math.max(0, g.x - pad), y = Math.max(0, g.y - pad)
    const clip = { x, y, width: Math.min(VW - x, g.w + pad * 2), height: Math.min(VH - y, g.h + pad * 2) }
    const 확대 = `${n}-${이름}-확대${곰들.length > 1 ? i + 1 : ''}.png`
    await pg.screenshot({ path: join(OUT, 확대), clip })
    찍은것.push({ 자리: 이름, 설명, 컷: g.컷, px: `${g.w}×${g.h}` })
    console.log(`   ✅ ${이름.padEnd(24)} ${g.컷.padEnd(13)} ${String(g.w).padStart(3)}×${g.h}px   ${설명}`)
  }
  return 곰들.length
}

// 안내 코치가 클릭을 가로챈다 — 끝까지 넘겨서 없앤다(찍을 건 찍고)
async function 코치넘기기(pg, 라벨) {
  for (let k = 0; k < 8; k++) {
    const 말 = await pg.evaluate(`(() => { const c = document.querySelector('[class*=coach] b, [class*=coach] strong, .coach-card'); return c ? (c.innerText||'').split('\\n')[0].slice(0,24) : '' })()`).catch(() => '')
    await 찍자(pg, `${라벨}-안내코치${k + 1}`, 말 ? `안내 코치 「${말}」` : '안내 코치')
    const nx = pg.locator('[aria-label="다음 안내 보기"], [aria-label*="안내"]').first()
    if (await nx.count() && await nx.isVisible().catch(() => false)) { await nx.click({ force: true }).catch(() => {}); await pg.waitForTimeout(500); continue }
    break
  }
  // 남아 있으면 통째로 걷어낸다
  await pg.evaluate(`(() => { for (const e of document.querySelectorAll('[aria-label="다음 안내 보기"]')) { const p = e.closest('div[style*="position: fixed"], div[class*=coach]') || e; p.remove() } })()`).catch(() => {})
  await pg.waitForTimeout(300)
}

// ── ① 온보딩 ───────────────────────────────────────────────
console.log('\n🎬 ① 온보딩 (첫 실행 · 설정 → 「앱 소개 다시 보기」)\n')
{
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 4, timezoneId: 'Asia/Seoul' })
  const pg = await ctx.newPage()
  await pg.goto('http://127.0.0.1:4471/hankki/', { waitUntil: 'networkidle' })
  await pg.waitForTimeout(1200)
  const 다음 = pg.getByRole('button', { name: /^다음$/ })
  for (let k = 0; k < 11; k++) {
    const 글 = await pg.evaluate(`(() => {
      const w = document.querySelector('.ob-wrap, [class*=ob-]') || document.body
      let best = null
      for (const h of w.querySelectorAll('h1,h2')) {
        const r = h.getBoundingClientRect()
        if (r.left >= -1 && r.right <= ${VW} + 1 && r.width > 20) { best = h.innerText.replace(/\\n/g, ' '); break }
      }
      return best || ''
    })()`).catch(() => '')
    await 찍자(pg, `온보딩-${k + 1}장`, 글 ? `「${글}」 장` : `${k + 1}번째 장`)
    if (!(await 다음.count())) break
    await 다음.click().catch(() => {})
    await pg.waitForTimeout(750)
  }
  await ctx.close()
}

// ── ② 나머지 화면 ──────────────────────────────────────────
const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 4, timezoneId: 'Asia/Seoul' })
await ctx.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  localStorage.setItem('hankki:giftSheetSeen', '1')
})
const pg = await ctx.newPage()
const 터짐 = []
pg.on('pageerror', (e) => 터짐.push(String(e).slice(0, 140)))
await pg.goto('http://127.0.0.1:4471/hankki/', { waitUntil: 'networkidle' })
await pg.waitForTimeout(1100)
{
  const a = pg.getByRole('button', { name: '나중에' }).first()
  if (await a.count() && await a.isVisible().catch(() => false)) await a.click().catch(() => {})
  await pg.waitForTimeout(400)
}

console.log('\n🏠 ② 홈 — 안내 코치 (앱 처음 켤 때 한 번)\n')
await 코치넘기기(pg, '홈')

console.log('\n💛 ③ 레꾸자랑 — 안내 코치 ＋ 자랑 시트\n')
await pg.getByRole('button', { name: /^레꾸자랑/ }).last().click().catch(() => {})
await pg.waitForTimeout(900)
await 코치넘기기(pg, '레꾸자랑')
{
  const c = pg.locator('.app-frame .screen .grid-card, .app-frame .screen .mini-card').first()
  if (await c.count()) {
    await c.click({ force: true }).catch(() => {}); await pg.waitForTimeout(1000)
    await 찍자(pg, '레꾸자랑-자랑시트', '레시피를 누르면 뜨는 「어떻게 보낼까요?」 시트')
    await pg.locator('.sheet-mask').first().click({ position: { x: 10, y: 10 } }).catch(() => {})
    await pg.waitForTimeout(500)
  } else console.log('   ⚠️ 레꾸자랑에서 레시피 카드를 못 찾았다')
}

console.log('\n🍳 ④ 레시피 상세 — 맨 끝 완성 칸 · 공유 시트\n')
await pg.getByRole('button', { name: /^레시피/ }).last().click().catch(() => {})
await pg.waitForTimeout(800)
await 코치넘기기(pg, '레시피')
const 카드 = pg.locator('.app-frame .screen .grid-card, .app-frame .screen .mini-card').first()
if (await 카드.count()) {
  await 카드.click({ force: true }); await pg.waitForTimeout(1100)
  await pg.evaluate(`(() => { const s = document.querySelector('.app-frame .screen'); if (s) s.scrollTop = s.scrollHeight })()`)
  await pg.waitForTimeout(900)
  await 찍자(pg, '레시피상세-완성칸', '맨 끝 「다 됐어요」 칸 (쿵 착지 모션)')
  const 공유 = pg.getByRole('button', { name: /공유|자랑/ }).first()
  if (await 공유.count()) {
    await 공유.click({ force: true }).catch(() => {}); await pg.waitForTimeout(1000)
    await 찍자(pg, '레시피상세-공유시트', '「친구랑 공유하기」 시트')
  } else console.log('   ⚠️ 상세에서 공유 단추를 못 찾았다')
} else console.log('   ⚠️ 레시피 카드를 못 찾았다')

console.log(`\n💥 pageerror ${터짐.length}건`)
터짐.slice(0, 3).forEach((e) => console.log('   ', e))
console.log(`\n📁 ${OUT}\n📸 ${찍은것.length}자리`)
console.table(찍은것)
await b.close(); srv.close()
