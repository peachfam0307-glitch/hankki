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

// 🔍🔍 ⛔ 셀렉터를 «짐작하지 않는다» — 화면을 훑어 사진이 «어디에» 그려졌는지 찾아낸다.
//    📌 2026-08-23 에 내 짐작 셀렉터가 「칸을 못 찾음」 둘 ＋ 엉뚱한 칸 하나를 냈다(규칙 18 ⓘ).
//       그래서 「그 칸에 있나」가 아니라 **「사진이 어느 칸에 있나」**로 뒤집었다.
// ⛔⛔ 「data:image 면 유저 사진」이 «아니다» — 빌드가 작은 앱 자산(책갈피 `idx_chef.png` 등)을
//    base64 로 인라인해서 그것도 data:image 다. 첫 판이 그걸 33개나 「사진」으로 셌다(규칙 18 ⓘ).
// ✅ 그래서 **localStorage 에 저장된 «그 사진 값»과 글자 그대로 대조**한다. 흉내낼 수가 없다.
const 사진찾기 = (page, 아는사진들) => page.evaluate((KNOWN) => {
  // ⛔⛔ 화면을 옮겨도 «앞 화면 DOM 은 남는다»(2026-08-21 에 겪은 함정).
  //    그래서 크기·opacity 만 보면 일기 탭에서도 레시피 상세 표지가 잡힌다.
  // ✅ 「그 자리에 «실제로 칠해진» 것이 이 그림인가」를 브라우저에 직접 묻는다.
  const 보이나 = (el) => {
    const r = el.getBoundingClientRect()
    if (r.width < 4 || r.height < 4) return false
    if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return false
    const s = getComputedStyle(el)
    if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) <= 0.05) return false
    const 위 = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    return !!위 && (위 === el || el.contains(위) || 위.contains(el))
  }
  // 자리를 «사람 말»로 — 조상 넷까지 훑어 클래스와 가까운 글자를 모은다
  const 자리이름 = (el) => {
    const 길 = []
    let p = el
    for (let i = 0; i < 5 && p && p !== document.body; i++) {
      const c = (p.className && typeof p.className === 'string') ? p.className.trim().split(/\s+/).slice(0, 3).join('.') : ''
      if (c) 길.push(c)
      p = p.parentElement
    }
    return 길.join(' ← ') || '(클래스 없음)'
  }
  const 가까운글자 = (el) => {
    let p = el
    for (let i = 0; i < 5 && p && p !== document.body; i++) {
      const t = (p.innerText || '').replace(/\s+/g, ' ').trim()
      if (t.length >= 2) return t.slice(0, 40)
      p = p.parentElement
    }
    return ''
  }
  const 아는것 = new Set(KNOWN)
  const 사진들 = [...document.querySelectorAll('img')]
    .filter((i) => 아는것.has(i.currentSrc || i.src || ''))
    .filter(보이나)
    .map((i) => {
      const r = i.getBoundingClientRect()
      return { 자리: 자리이름(i), 글자: 가까운글자(i), 크기: `${Math.round(r.width)}×${Math.round(r.height)}`, y: Math.round(r.top) }
    })
  const 아이콘수 = [...document.querySelectorAll('img')]
    .filter((i) => !아는것.has(i.currentSrc || i.src || ''))
    .filter(보이나).length
  return { 사진들, 아이콘수 }
}, 아는사진들)

const 찍기 = async (page, 화면, 아는사진들) => {
  const r = await 사진찾기(page, 아는사진들)
  // ⭐ 「진짜 그 화면에 갔나」를 같이 찍는다 — 안 갔으면 숫자를 읽어도 헛것이다
  // ⛔ body.innerText 를 쓰면 «맨 위 화면»만 읽혀 레이어가 열려도 안 바뀐다(2026-08-23 에 그걸로 속았다).
  //    ⭐ 화면 «가운데»에 실제로 칠해진 것에서 글자를 집는다.
  const 머리 = await page.evaluate(() => {
    const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2)
    let p = el
    for (let i = 0; i < 8 && p && p !== document.body; i++) {
      const t = (p.innerText || '').replace(/\s+/g, ' ').trim()
      if (t.length >= 6) return t.slice(0, 34)
      p = p.parentElement
    }
    return '(글자 없음)'
  })
  console.log(`   [${화면}] 📷사진 ${r.사진들.length}개 · 🍽아이콘 ${r.아이콘수}개   ← 화면 글자「${머리}」`)
  r.사진들.sort((a, b) => a.y - b.y).forEach((s) => console.log(`      · ${s.크기}  「${s.글자}」  ${s.자리}`))
  if (!r.사진들.length) console.log('      (사진 없음 — 아이콘만 그려진다)')
  return r
}

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

  // ⭐ 「이것이 유저 사진이다」의 근거 = 저장된 값 그 자체. 짐작이 아니다.
  const 아는사진 = [r?.image, d?.photo].filter((x) => String(x || '').startsWith('data:image'))
  console.log('   🔑 대조할 사진 값 =', 아는사진.length, '개 (recipe.image · diary.photo)')

  await page.close()

  // ── 화면을 돌며 «사진이 어디에 그려졌나»를 찾는다 (셀렉터 짐작 없음)
  // ⛔⛔ 화면마다 «새 탭»으로 들어간다 — 레시피 상세는 «레이어»라 하단바를 덮어서
  //    한 탭에서 이어 누르면 탭이 «안 바뀐다»(그래도 숫자는 나와서 헛것을 읽게 된다).
  //    ⭐ localStorage 는 같은 컨텍스트라 그대로 남는다.
  console.log('\n   🔍 화면마다 사진이 «어디에» 그려졌나 (화면마다 새 탭)')

  const p1 = await 새탭(); await 탭으로(p1, '레시피')
  const 목록 = await 찍기(p1, '🍳 레시피 목록', 아는사진); await p1.close()

  const p2 = await 새탭(); await 탭으로(p2, '레시피')
  await p2.evaluate((T) => {
    const t = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim().startsWith(T))
    if (t) t.click()
  }, 골라둔.title)
  await p2.waitForTimeout(1000)
  const 상세 = await 찍기(p2, '🎨 레시피 상세(레꾸 표지)', 아는사진); await p2.close()

  const p3 = await 새탭(); await 탭으로(p3, '일기')
  const 일기 = await 찍기(p3, '📔 일기 탭', 아는사진); await p3.close()

  const p4 = await 새탭()
  const 홈 = await 찍기(p4, '🏠 홈', 아는사진); await p4.close()

  줄('🍳 레시피 목록 카드', { 있나: true, 사진: 목록.사진들.length > 0, 음식아이콘: 목록.아이콘수 > 0 }, '📷 사진')
  줄('🎨 레시피 상세 «레꾸 표지»', { 있나: true, 사진: 상세.사진들.length > 0, 음식아이콘: 상세.아이콘수 > 0 }, '📷 사진 ← 창업자가 원하는 것')
  줄('📔 일기 탭', { 있나: true, 사진: 일기.사진들.length > 0, 음식아이콘: 일기.아이콘수 > 0 }, '🍽 음식아이콘 (사진이면 안 됨)')
  줄('🏠 홈', { 있나: true, 사진: 홈.사진들.length > 0, 음식아이콘: 홈.아이콘수 > 0 }, '(참고)')
}

// ═══════════════════════════════════════════════════════════
// ⓑ ⭐⭐ 꾸민 레시피 — 「표지로도 쓰기」 기본 «꺼짐». 창업자가 실제로 겪은 경우다
//    (창업자는 레꾸를 해서 쓴다 → 표지는 안 바뀌고 일기만 바뀐다 = 제보 그대로)
// ═══════════════════════════════════════════════════════════
console.log('\nⓑ ⭐꾸민 레시피 (「표지로도 쓰기」 기본 «꺼짐») — 창업자가 겪은 경우')
{
  const p0 = await 새탭()
  const 꾸민것 = await p0.evaluate(() => {
    const st = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    const r = (st.recipes || []).find((x) => (x.steps || []).length >= 2 && x.thumb !== 'photo')
    if (!r) return null
    st.recipes = st.recipes.map((x) => (x.id === r.id ? { ...x, decor: [{ k: 'gp_gomhi', x: 0.5, y: 0.5, s: 0.3 }] } : x))
    // ⛔⛔ ⓐ 에서 «같은 날» 이미 요리했다 — 안 비우면 달력 칸이 ⓐ 것을 보여줘서
    //    ⓑ 사진과 대조하면 «0개»가 나온다. 그건 「안 바뀐다」가 아니라 «못 쟀다»는 뜻이다.
    st.diary = []
    localStorage.setItem('hankki:v1', JSON.stringify(st))
    return { id: r.id, title: r.title }
  })
  await p0.close()
  console.log('   레시피 =', 꾸민것?.title, '(꾸민 흔적을 심었다)')

  const page = await 새탭()
  await 요리끝까지(page, 꾸민것.title)
  const sw = await 사진넣고끝내기(page, null)
  console.log('   「표지로도 쓰기」 기본 =', sw.기본켜짐, '· 끝낼 때 =', sw.최종)
  const st = await 저장값(page)
  const r = (st.recipes || []).find((x) => x.id === 꾸민것.id)
  const d = (st.diary || []).find((x) => x.recipeId === 꾸민것.id)
  console.log('   💾 저장값 = recipe.thumb:', r?.thumb, '· diary.photo:', String(d?.photo || '').startsWith('data:') ? '있다' : '없다')
  const 아는사진B = [r?.image, d?.photo].filter((x) => String(x || '').startsWith('data:image'))
  console.log('   🔑 대조할 사진 값 =', 아는사진B.length, '개')
  await page.close()

  const q1 = await 새탭(); await 탭으로(q1, '레시피')
  await q1.evaluate((T) => {
    const t = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim().startsWith(T))
    if (t) t.click()
  }, 꾸민것.title)
  await q1.waitForTimeout(1000)
  const 상세B = await 찍기(q1, '🎨 레시피 상세(레꾸 표지)', 아는사진B); await q1.close()

  const q2 = await 새탭(); await 탭으로(q2, '일기')
  const 일기B = await 찍기(q2, '📔 일기 탭', 아는사진B); await q2.close()

  줄('── 꾸민 레시피 ──', { 있나: true, 사진: false, 음식아이콘: false }, '')
  줄('🎨 레시피 상세 «레꾸 표지»', { 있나: true, 사진: 상세B.사진들.length > 0, 음식아이콘: 상세B.아이콘수 > 0 }, '📷 사진 ← 창업자가 원하는 것')
  줄('📔 일기 탭', { 있나: true, 사진: 일기B.사진들.length > 0, 음식아이콘: 일기B.아이콘수 > 0 }, '🍽 음식아이콘 (사진이면 안 됨)')
}

console.log('\n📋 표 — 화면마다 «사진이 그려지나»\n')
console.log('   | 자리 | 지금 | 창업자 기대 |')
console.log('   |---|---|---|')
표.forEach((x) => console.log(`   | ${x.자리} | ${x.그려진것} | ${x.창업자기대} |`))
console.log('\n   ⛔ 「사진 있음」은 «그 화면 어딘가»라는 뜻이다 — 위 목록의 자리·글자로 어느 칸인지 본다.\n')

await b.close(); srv.close()
