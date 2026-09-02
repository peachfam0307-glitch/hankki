// 📸 「사진 이사」 눈으로 보기 — 2026-09-02 〔반영됨〕
//
// ⭐ 절대원칙 21 — 창업자에게 보여주기 «전»에 내가 열어서 본다.
//    게이트 19칸이 전부 초록불이어도 **「표지가 늦게 뜨나」·「저장 공간 줄이 예쁜가」**는 못 잰다.
//
// 찍는 것 넷 = ① 레시피 탭(껐다 켠 뒤 표지) ② 상세 표지 ③ 설정 「저장 공간」 ④ 일기(달력·앨범 사진)
// 실행: node scripts/_shot-사진이사-0902.mjs
// 🏷 이름표 = 반영됨 (눈으로 보는 판 · smoke 아님)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = process.env.SHOT_DIR || '/tmp/shot-사진이사-0902'
mkdirSync(OUT, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4497, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })

// ── 씨앗 = 사진 표지 셋 ＋ 일기 사진 하나(옛 폰처럼 서랍에 통째로) ──
const p0 = await ctx.newPage()
await p0.goto('http://127.0.0.1:4497/hankki/', { waitUntil: 'networkidle' })
await p0.waitForTimeout(1500)
// ⭐ 날짜는 «한 곳»에서만 만든다(절대원칙 27) — 여기서 toISOString 을 쓰면 KST 게이트가 막는다
const { todayKST } = await import('../src/today.js')
await p0.evaluate((오늘) => {
  const 그림 = (색, 글) => {
    const c = document.createElement('canvas'); c.width = 900; c.height = 1200
    const x = c.getContext('2d'); x.fillStyle = 색; x.fillRect(0, 0, 900, 1200)
    x.fillStyle = '#fff'; x.font = 'bold 110px sans-serif'; x.textAlign = 'center'
    x.fillText(글, 450, 640)
    return c.toDataURL('image/jpeg', 0.8)
  }
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const t = Date.now()
  s.recipes = [
    { id: 'sh-1', title: '항정살 조림', status: 'sorted', source: 'manual', thumb: 'photo', image: 그림('#b5523f', '조림'), savedAt: t, ingredients: ['항정살 400g', '간장 3큰술'], steps: ['핏물을 빼요', '조려요'], favorite: true, cooked: 2 },
    { id: 'sh-2', title: '콩나물 무침', status: 'sorted', source: 'manual', thumb: 'photo', image: 그림('#4d7a4a', '무침'), savedAt: t - 1, ingredients: ['콩나물 300g'], steps: ['데쳐요', '무쳐요'], favorite: false, cooked: 1 },
    { id: 'sh-3', title: '들기름 막국수', status: 'sorted', source: 'manual', thumb: 'photo', image: 그림('#6b5aa6', '국수'), savedAt: t - 2, ingredients: ['메밀면 200g'], steps: ['삶아요', '비벼요'], favorite: false, cooked: 0 },
    ...(s.recipes || [])]
  s.diary = [{ id: 'sh-d1', at: t, date: 오늘, title: '항정살 조림', recipeId: 'sh-1', rating: 5, note: '오늘 잘 됐다', photo: 그림('#b5523f', '조림') }, ...(s.diary || [])]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
}, todayKST())
await p0.close()

// ── 이사를 한 번 돌린 뒤 «껐다 켠» 탭에서 찍는다(진짜 유저가 보는 그 순간) ──
const p1 = await ctx.newPage()
await p1.goto('http://127.0.0.1:4497/hankki/', { waitUntil: 'networkidle' })
await p1.waitForTimeout(3500)
await p1.close()

const p = await ctx.newPage()
const 오류 = []
p.on('pageerror', (e) => { if (!/tesseract|importScripts|cdn\.jsdelivr|Failed to fetch/i.test(e.message)) 오류.push(e.message) })
await p.goto('http://127.0.0.1:4497/hankki/', { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)

const 탭 = (이름) => p.evaluate((n) => {
  const 바 = document.querySelector('.bottom-nav') || document.querySelector('nav')
  ;[...(바?.querySelectorAll('button') || [])].find((x) => (x.innerText || '').trim().includes(n))?.click()
}, 이름)

// ① 레시피 탭 — 표지가 창고에서 꺼내져 그려지나
await 탭('레시피')
await p.waitForTimeout(2200)
await p.screenshot({ path: join(OUT, '1-레시피탭.png') })

// ② 상세 — 표지 한 장 크게
await p.evaluate(() => {
  // ⛔ 카드 상자를 누르면 아무 일도 안 난다 — 누를 수 있는 건 «안쪽 단추»다(첫 판이 그래서 목록만 찍혔다)
  const c = [...document.querySelectorAll('.grid-card')].find((x) => x.innerText.includes('항정살 조림'))
  ;(c?.querySelector('button') || c)?.click()
})
await p.waitForTimeout(1800)
await p.screenshot({ path: join(OUT, '2-상세표지.png') })
await p.evaluate(() => { [...document.querySelectorAll('button')].find((x) => x.getAttribute('aria-label') === '뒤로')?.click() })
await p.waitForTimeout(900)

// ③ 일기 — 달력·앨범 사진
await 탭('일기')
await p.waitForTimeout(2200)
await p.screenshot({ path: join(OUT, '3-일기.png') })

// ④ 설정 — 「저장 공간」 줄
await 탭('홈')
await p.waitForTimeout(900)
await p.evaluate(() => { [...document.querySelectorAll('button')].find((x) => x.getAttribute('aria-label') === '설정')?.click() })
await p.waitForTimeout(1600)
await p.screenshot({ path: join(OUT, '4-설정-저장공간.png') })
const 줄 = await p.evaluate(() => (document.querySelector('[data-probe="storage"]')?.innerText || '(없다)').replace(/\n/g, ' · '))
console.log('   저장 공간 줄 =', 줄)
console.log('   pageerror =', 오류.length ? 오류.join(' · ') : 0)

await b.close(); srv.close()
console.log('📸', OUT)
