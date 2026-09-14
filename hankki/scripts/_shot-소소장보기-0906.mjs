// 📸🛒 소소 기능 캐러셀 1편 「장보기·냉장고」 앱 화면 재료 (2026-09-06)
//
// 📮 창업자 20:13 = *"아직 소개 안 한 것+내가 적은 것 해서 2,3번에 나눠서 올려보자. 종류별로 묶어서"*
//    1편 묶음 = 영수증(창업자 캡처 둘) → 찾은 재료 → 냉장고 D-day → 가진 재료 추천 → 장보기 체크→냉장고 → 쇼핑몰 → 인분 조절
//
// ⭐ 재료는 «UI 로» 넣는다(냉장고채운판-0820 과 같은 이유 — localStorage 를 직접 만지면 앱 실제 모양과 어긋난다).
// ⭐ 규칙 21 — 찍고 «열어 보고» 판정한다.
//
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/_shot-소소장보기-0906.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = process.env.OUT || join(ROOT, 'design/promo/소소기능-앱화면-2509')   // 캐러셀 생산기가 여기서 읽는다
mkdirSync(OUT, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4431, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p = await ctx.newPage()
const 쉼 = (ms) => p.waitForTimeout(ms)
const 찍 = async (이름) => { await p.screenshot({ path: join(OUT, 이름 + '.png') }); console.log('  📸', 이름) }
const 탭 = async (글자) => { await p.locator('.bottom-nav .nav-item').filter({ hasText: 글자 }).first().click(); await 쉼(1100) }
const 단추 = async (re, 어디 = 'first') => { const l = p.getByRole('button', { name: re }); const n = await l.count(); if (!n) return false; await (어디 === 'last' ? l.last() : l.first()).click(); await 쉼(700); return true }

await p.goto('http://127.0.0.1:4431/hankki/', { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready); await 쉼(900)

// ── ① 레시피 상세 — 인분 조절 ＋ 장보기 담기 ─────────────────────────
await 탭('레시피')
const 레시피 = process.env.RECIPE || '버섯솥밥'
const 카드 = p.locator(`text=${레시피}`).first()
if (!(await 카드.count())) { console.log(`  ⛔ 「${레시피}」 카드가 목록에 없다`); process.exit(1) }
await 카드.click(); await 쉼(900)
const 인분 = p.locator('.serv-row')
if (await 인분.count()) {
  await 인분.scrollIntoViewIfNeeded(); await 쉼(300)
  await p.getByRole('button', { name: '늘리기' }).first().click(); await 쉼(250)
  await p.getByRole('button', { name: '늘리기' }).first().click(); await 쉼(500)
  await 찍('05-인분조절')
} else console.log('  ⚠️ serv-row 없음 — 인분 조절을 못 찍었다')
if (!(await 단추(/장보기 담기/))) console.log('  ⚠️ 장보기 담기 단추 없음')
await 쉼(800)
for (const 글자 of ['나중에 볼게요', '닫기']) await 단추(new RegExp(글자))
// 상세엔 아래 탭이 없다 — 뒤로 나간다
await p.goBack(); await 쉼(900)
if (!(await p.locator('.bottom-nav').count())) { await p.goto('http://127.0.0.1:4431/hankki/', { waitUntil: 'networkidle' }); await 쉼(900) }

// ── ② 장보기 — 담긴 줄 체크 → 「샀어요! 냉장고에 넣어뒀어요」 ─────────
await 탭('장보기')
const 리스트머리 = p.locator('.h-section', { hasText: '장보기' }).first()
// 맨 위로 — 제목·탭까지 보이게(안쪽 스크롤 상자를 찾아 0으로)
if (await 리스트머리.count()) { await 리스트머리.evaluate((el) => { let e = el; while (e && e !== document.body) { if (e.scrollHeight > e.clientHeight + 4) e.scrollTop = 0; e = e.parentElement } window.scrollTo(0, 0) }); await 쉼(400) }
const 체크 = p.locator('.shop-row .check-box')
const n체크 = await 체크.count()
console.log(`  🛒 장보기 줄 ${n체크}개`)
if (n체크) { await 체크.nth(0).click(); await 쉼(150); await 체크.nth(1).click(); await 쉼(350); await 찍('03-장보기체크') }
await 쉼(2500)
const 쇼핑몰 = p.locator('.h-section', { hasText: '쇼핑몰' }).first()
if (await 쇼핑몰.count()) { await 쇼핑몰.evaluate((el) => el.scrollIntoView({ block: 'center' })); await 쉼(500); await 찍('04-쇼핑몰') }

// ── ③ 냉장고 — 재료 담기(유통기한) → D-day 표 ＋ 가진 재료 추천 ────────
await p.locator('[data-coach="pantry"]').first().click(); await 쉼(1000)
const { todayKST } = await import('../src/today.js')   // ⏰ 절대원칙 27 — 날짜는 today.js 에서만
// 오늘(KST)에 d 일을 더한다 — 문자열 산수(연·월·일 숫자로) · toISOString 을 안 쓴다(check-kst)
const 날짜 = (d) => { const [y, m, dd] = todayKST().split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, dd + d)); return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}` }
const 재료들 = [['두부', 2], ['달걀', 6], ['애호박', 4], ['대파', 3], ['우유', 1], ['돼지고기', 2], ['양파', 12], ['버섯', 5]]
let 넣은 = 0
for (const [이름, d] of 재료들) {
  if (!(await 단추(/재료 담기/))) break
  const 칸 = p.locator('input[type="text"]:visible, input:not([type]):visible').first()
  if (!(await 칸.count())) { await p.keyboard.press('Escape'); await 쉼(300); continue }
  await 칸.fill(이름); await 쉼(400)
  const 기한 = p.locator('input[type="date"]:visible').first()
  if (await 기한.count()) await 기한.fill(날짜(d))
  let 눌 = false
  for (const 글자 of [/^추가$/, /^담기$/, /^저장$/, /넣기/]) { if (await 단추(글자, 'last')) { 눌 = true; break } }
  if (!눌) await p.keyboard.press('Enter')
  await 쉼(500); 넣은++
}
console.log(`  🥕 재료 ${넣은}개 넣음`)
for (const 글자 of ['닫기', '취소']) await 단추(new RegExp(`^${글자}$`))
await p.mouse.wheel(0, -4000); await 쉼(3200)   // 토스트가 사라진 뒤
await 찍('01-냉장고추천')
// ⚠️ 첫 .exp-chip 은 안내 상자의 예시 「D-3」 — 진짜 줄은 그 다음부터
const 셋째칩 = p.locator('.exp-chip').nth(3)
if (await 셋째칩.count()) { await 셋째칩.evaluate((el) => el.scrollIntoView({ block: 'center' })); await 쉼(500); await 찍('02-냉장고Dday') }
const 칩 = await p.locator('.exp-chip').allTextContents()
console.log('  📅 D-day 표 =', 칩.join(' '))

await b.close(); srv.close()
console.log(`\n✅ → ${OUT}`)
