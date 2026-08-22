// 📷🔍 「완성 사진을 넣으면 «어느 자리»가 사진으로 바뀌나」 — 자리별로 잰다 (2026-08-23)
//
// 📮 창업자 2026-08-22 (할 일 11건 · 2번) =
//    *"다 만들었어요에서 사진넣기하면 지금 **일기아이콘＋일기아래 음식아이콘**이 바뀜.
//      －우리계획은 **레꾸음식아이콘**이 사진으로 바뀌어야함."*
//
// ⛔⛔ 왜 «새» 판이 필요한가 — `_repro-완성사진-0821.mjs` 는 **32/32 통과한다.**
//    그건 «저장됐나»(localStorage 의 diary.photo · recipe.thumb)를 재기 때문이다.
//    창업자가 본 건 저장이 아니라 **화면에 그려진 것**이다. 그래서 이 판은 «그려진 것»만 본다.
//    📌 2026-08-22 v11.00 사고와 같은 결 — 「저장됐다」와 「보인다」는 다른 말이다.
//
// ⛔ 소스 grep 아님 · 짐작 아님 — 자리마다 **img[src^=data:image] 가 있나**로 잰다(규칙 18 ⓘ · 30).
//    · 사진      = <img src="data:image…">
//    · 음식아이콘 = FoodIcon → <img src="/…asset"> 또는 <svg>  (FoodIcon.jsx:1586~1600 실측)
//
// 실행: cd /home/user/hankki/hankki && node scripts/_probe-완성사진어디-0823.mjs
//       (브라우저 = SMOKE_CHROMIUM 환경변수로 지정 가능)
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
await new Promise((r) => srv.listen(4413, r))

// 🖼 8×8 빨강 PNG — 「사진을 골랐다」를 흉내내는 최소 파일
const 빨강PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAHUlEQVQoU2P8z8Dwn4GBgYERxsAmAFOEISjLBAAj8gX9Ol5b0AAAAABJRU5ErkJggg==',
  'base64',
)

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })

// ⛔ page.reload() 금지 — 저장값이 시드로 덮인다(`check-mistakes` ⑧). 새 탭으로 연다.
const 새탭 = async () => {
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log('  ⚠️ pageerror:', String(e.message || e).split('\n')[0]))
  await page.goto('http://127.0.0.1:4413/hankki/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(700)
  return page
}
const 저장값 = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('hankki:v1') || '{}'))
const 탭으로 = async (page, 이름) => {
  await page.evaluate((T) => {
    const bs = [...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')]
    bs.find((x) => (x.innerText || '').replace(/\s+/g, '').includes(T))?.click()
  }, 이름)
  await page.waitForTimeout(700)
}

// 🍳 요리 모드를 «마지막 단계»까지 — 앱을 실제로 눌러서
const 요리끝까지 = async (page, 제목) => {
  await 탭으로(page, '레시피')
  const 열림 = await page.evaluate((T) => {
    const t = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim().startsWith(T))
    if (!t) return false; t.click(); return true
  }, 제목)
  if (!열림) { console.log('     ↳ 카드를 못 눌렀다'); return false }
  await page.waitForTimeout(700)
  const 시작 = await page.evaluate(() => {
    const t = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').includes('요리 시작'))
    if (!t) return false; t.click(); return true
  })
  if (!시작) { console.log('     ↳ 「요리 시작」을 못 찾았다'); return false }
  await page.waitForTimeout(600)
  for (let n = 0; n < 40; n++) {
    const 다음 = await page.evaluate(() => {
      const t = [...document.querySelectorAll('.cook-navbtn')].find((x) => /시작 →|다음 →/.test(x.innerText || ''))
      if (!t) return false; t.click(); return true
    })
    if (!다음) break
    await page.waitForTimeout(180)
  }
  return page.evaluate(() => !!document.querySelector('.cook-navbtn.primary') && /다 만들었어요/.test(document.querySelector('.cook-nav')?.innerText || ''))
}

// 📷 사진을 넣고 끝낸다. 표지스위치 = null 이면 «기본값 그대로 둔다»
const 사진넣고끝내기 = async (page, 표지스위치) => {
  await page.setInputFiles('.cook-shot input[type=file]', { name: '완성.png', mimeType: 'image/png', buffer: 빨강PNG })
  await page.waitForTimeout(700)
  // ⛔ 「그대로 쓰기」가 아니다 — 실제 글자는 「전체 사용」이다
  await page.evaluate(() => {
    const t = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim() === '전체 사용')
    if (t) t.click()
  })
  await page.waitForTimeout(900)
  const 기본켜짐 = await page.evaluate(() => document.querySelector('.cook-shot-cover')?.getAttribute('aria-pressed'))
  if (표지스위치 !== null && String(기본켜짐) !== String(표지스위치)) {
    await page.evaluate(() => document.querySelector('.cook-shot-cover')?.click())
    await page.waitForTimeout(400)
  }
  const 최종 = await page.evaluate(() => document.querySelector('.cook-shot-cover')?.getAttribute('aria-pressed'))
  await page.evaluate(() => [...document.querySelectorAll('.cook-navbtn')].find((x) => /다 만들었어요/.test(x.innerText))?.click())
  await page.waitForTimeout(1000)
  return { 기본켜짐, 최종 }
}

// 🔍 «그 칸 안에» 사진이 그려졌나 — data: 그림이 있으면 사진, 없으면 아이콘
const 칸검사 = (page, 셀렉터) => page.evaluate((sel) => {
  const el = document.querySelector(sel)
  if (!el) return { 있나: false }
  const imgs = [...el.querySelectorAll('img')]
  return {
    있나: true,
    사진: imgs.some((i) => (i.currentSrc || i.src || '').startsWith('data:image')),
    음식아이콘: imgs.some((i) => !(i.currentSrc || i.src || '').startsWith('data:image')) || !!el.querySelector('svg'),
  }
}, 셀렉터)

const 표 = []
const 줄 = (자리, r, 기대) => 표.push({ 자리, 그려진것: !r.있나 ? '⚠️칸을 못 찾음' : r.사진 ? '📷 사진' : r.음식아이콘 ? '🍽 음식아이콘' : '(빈칸)', 창업자기대: 기대 })

console.log('\n📷🔍 완성 사진 — 「어느 자리가 사진으로 바뀌나」 (390×844)')
console.log('   ⛔ 저장값이 아니라 «화면에 그려진 것»을 잰다\n')

// ═══════════════════════════════════════════════════════════
// ⓐ 안 꾸민 레시피 — 「표지로도 쓰기」 기본 켜짐
// ═══════════════════════════════════════════════════════════
console.log('ⓐ 안 꾸민 레시피 (「표지로도 쓰기」 기본값 그대로)')
{
  const page = await 새탭()
  const 골라둔 = await page.evaluate(() => {
    const st = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    const r = (st.recipes || []).find((x) => (x.steps || []).length >= 2 && !(x.decor?.length > 0))
    return r ? { id: r.id, title: r.title } : null
  })
  console.log('   레시피 =', 골라둔?.title)
  await 요리끝까지(page, 골라둔.title)
  const sw = await 사진넣고끝내기(page, null)
  console.log('   「표지로도 쓰기」 기본 =', sw.기본켜짐, '· 끝낼 때 =', sw.최종)

  const st = await 저장값(page)
  const r = (st.recipes || []).find((x) => x.id === 골라둔.id)
  const d = (st.diary || []).find((x) => x.recipeId === 골라둔.id)
  console.log('   💾 저장값 = recipe.thumb:', r?.thumb, '· diary.photo:', String(d?.photo || '').startsWith('data:') ? '있다' : '없다')

  // 🍳 레시피 목록 카드
  await 탭으로(page, '레시피')
  const 목록 = await page.evaluate((T) => {
    const t = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim().startsWith(T))
    if (!t) return { 있나: false }
    const imgs = [...t.querySelectorAll('img')]
    return { 있나: true, 사진: imgs.some((i) => (i.currentSrc || i.src || '').startsWith('data:image')), 음식아이콘: imgs.some((i) => !(i.currentSrc || i.src || '').startsWith('data:image')) || !!t.querySelector('svg') }
  }, 골라둔.title)
  줄('🍳 레시피 목록 카드', 목록, '📷 사진')

  // 🍳 레시피 상세 = 레꾸(꾸미기) 표지 자리
  await page.evaluate((T) => {
    const t = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim().startsWith(T))
    if (t) t.click()
  }, 골라둔.title)
  await page.waitForTimeout(900)
  줄('🎨 레시피 상세 «레꾸 표지»', await 칸검사(page, '.detail-cover, .rd-cover, .cover, .thumb-lg'), '📷 사진 ← 창업자가 원하는 것')

  await page.close()
}

// ═══════════════════════════════════════════════════════════
// ⓑ 일기 쪽 — 창업자가 「바뀐다」고 말한 두 자리
// ═══════════════════════════════════════════════════════════
console.log('\nⓑ 일기 탭 — 창업자가 「바뀐다」고 한 자리')
{
  const page = await 새탭()
  await 탭으로(page, '일기')
  const 일기글 = await page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 200))
  console.log('   일기 탭 =', 일기글.slice(0, 120))
  줄('📔 일기 달력 칸', await 칸검사(page, '.cal-cell.has, .cal-day.has, [class*="cal"] [class*="has"]'), '🍽 음식아이콘 (사진이면 안 됨)')
  줄('📔 「이 날 만든 요리」', await 칸검사(page, '.card'), '🍽 음식아이콘 (사진이면 안 됨)')
  await page.close()
}

console.log('\n📋 표 — 자리별로 «지금 무엇이 그려지나»\n')
console.log('   | 자리 | 지금 | 창업자 기대 |')
console.log('   |---|---|---|')
표.forEach((x) => console.log(`   | ${x.자리} | ${x.그려진것} | ${x.창업자기대} |`))
console.log('')

await b.close(); srv.close()
