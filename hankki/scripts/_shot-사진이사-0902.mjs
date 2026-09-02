// 📸 「사진 이사」 눈으로 보기 — 2026-09-02 〔반영됨〕
//
// ⭐ 절대원칙 21 — 창업자에게 보여주기 «전»에 내가 열어서 본다.
//    게이트 19칸이 전부 초록불이어도 **「표지가 늦게 뜨나」·「저장 공간 줄이 예쁜가」**는 못 잰다.
//
// 찍는 것 넷 = ① 레시피 탭(껐다 켠 뒤 표지) ② 상세 표지 ③ 설정 「저장 공간」 ④ 일기(달력·앨범 사진)
//
// 🖼 **여기(보여주는 판)와 「_repro-사진이사-0902.mjs」(재는 게이트)는 «다른 그림»을 쓴다 — 일부러 그렇다.**
//    · 이 판   = 앱에 든 «진짜 요리 사진»(public/recipe-photos/) → 창업자가 실물을 판정할 수 있어야 하니까
//    · 게이트 = 900×1200 로 «직접 그린» 그림 → 「내가 심은 그 사진인가」를 naturalWidth===900 으로 콕 집으려고
//    ⛔ 둘을 맞추려 하지 말 것. 하는 일이 다르다(보여주기 ↔ 재기).
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

// 📸📸 **심는 사진 = «진짜 요리 사진»** (2026-09-02 · 창업자 지적으로 고침)
//
//   ⛔⛔ 첫 판은 캔버스에 색을 칠하고 「조림」이라고 «글자를 써서» 만든 가짜였다.
//      📮 창업자 = *"저 사진보면 조림 이렇게써있는데?? 저 빨강 초록 보라 동그라미는 뭘까"*
//      📌 **판이 앱을 흉내 내면 창업자가 «실물»을 판정할 수 없다**(절대원칙 30).
//         봐야 할 것은 「내 음식 사진이 껐다 켜도 그대로 뜨나」인데 색 동그라미로는 그게 안 보인다.
//
//   ✅ 그래서 **앱이 이미 갖고 있는 진짜 요리 사진**(`public/recipe-photos/`)을 읽어서 심는다.
//      ⭐ `data:` 로 바꿔 넣는 게 «핵심»이다 — 그래야 유저가 직접 넣은 사진과 «같은 길»을 탄다
//         (창고로 이사 → 쪽지 → 화면에서 다시 꺼내기). 주소(`/recipe-photos/…`)로 두면 이사를 안 탄다.
const 사진읽기 = (파일) => 'data:image/webp;base64,' +
  readFileSync(join(ROOT, 'public/recipe-photos', 파일)).toString('base64')
const 심을것 = [
  { id: 'sh-1', 제목: '김치찌개', 파일: 'kimchijjigae.webp', 재료: ['돼지고기 200g', '신김치 1/4포기'], 걸음: ['볶아요', '끓여요'], 책갈피: true, 만든횟수: 2 },
  { id: 'sh-2', 제목: '잡채', 파일: 'japchae.webp', 재료: ['당면 200g', '시금치 한 줌'], 걸음: ['불려요', '볶아요'], 책갈피: false, 만든횟수: 1 },
  { id: 'sh-3', 제목: '새우 파스타', 파일: 'shrimppasta.webp', 재료: ['스파게티 180g', '새우 10마리'], 걸음: ['삶아요', '볶아요'], 책갈피: false, 만든횟수: 0 },
]
const 사진들 = 심을것.map((r) => 사진읽기(r.파일))
console.log('   심은 사진 =', 심을것.map((r, i) => `${r.제목} ${Math.round(사진들[i].length / 1024)}KB`).join(' · '))

await p0.evaluate(([오늘, 목록, 그림들]) => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const t = Date.now()
  s.recipes = [
    ...목록.map((r, i) => ({
      id: r.id, title: r.제목, status: 'sorted', source: 'manual', thumb: 'photo',
      image: 그림들[i], savedAt: t - i,
      ingredients: r.재료, steps: r.걸음, favorite: r.책갈피, cooked: r.만든횟수,
    })),
    ...(s.recipes || [])]
  s.diary = [{ id: 'sh-d1', at: t, date: 오늘, title: 목록[0].제목, recipeId: 목록[0].id, rating: 5, note: '오늘 잘 됐다', photo: 그림들[0] }, ...(s.diary || [])]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
}, [todayKST(), 심을것, 사진들])
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
  const c = [...document.querySelectorAll('.grid-card')].find((x) => x.innerText.includes('김치찌개'))
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
