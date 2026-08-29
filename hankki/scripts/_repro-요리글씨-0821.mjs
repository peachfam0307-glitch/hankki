// 🍳🔠 [2026-08-21] 요리 모드 글씨 — 「더 커도 된다」의 «한계»를 964걸음 전수로 찾는다
//
// 📮 창업자 = *"**요리시작모드 글씨는 사실 더 커도돼**"*
//    ＋ *"**요리시작에서 글자 두줄넘어갈때 잘리지않게 확인만 잘하면 되고**"*
//    ＋ (그 앞) *"요리시작모드에서 줄바꿈 잘 되어야해. **전수검사 잘해야해ㅠ**"*
//
// ⭐⭐ **「잘린다」의 진짜 뜻을 갈라야 한다** — 우리 요리 모드는 2026-08-04 테스터 제보
//    (*"제육볶음 재료 14줄에서 다음 버튼이 화면 밖"*) 뒤로 `.cook-body` 에
//    **`overflow-y:auto` ＋ `justify-content: safe center`** 가 이미 붙어 있다.
//    → 글이 길어도 **«안 잘리고 스크롤»** 된다. 즉 「잘림」은 이미 막혀 있다.
//    ⛔ 그런데 **부엌에서 스크롤은 «잘린 것과 거의 같다»** — 손에 물 묻은 채 흘깃 보는 자리다.
//    ✅ 그래서 이 판이 재는 것 = **「스크롤 없이 한눈에 다 보이는 걸음이 몇 %인가」**
//       ＋ ⛔「다음」 단추가 화면 «안»에 있나(2026-08-04 그 사고가 되살아나지 않았나)
//
// ⭐ 964걸음을 «진짜 요리 모드 DOM»에 하나씩 넣어 잰다 — 흉내가 아니다(절대원칙 30).
//    앱을 964번 여는 게 아니라 **한 번 열고 글자만 갈아끼운다**(같은 CSS·같은 상자).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-요리글씨-0821.mjs
//      FS=26,28,30 node scripts/_repro-요리글씨-0821.mjs   ← 크기를 바꿔 재본다
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
await new Promise((r) => srv.listen(4422, r))

// ⭐ 걸음은 «앱과 같은 모듈»에서 뽑는다 — 파일을 다시 파싱하지 않는다(절대원칙 30)
const B = await import('../src/data/basics.js')
const 전체 = Array.isArray(B.allBasicRecipes) ? B.allBasicRecipes : (B.default || [])
const 걸음들 = []
전체.forEach((r) => (r.steps || []).forEach((s, i) => {
  const t = typeof s === 'string' ? s : (s.text || s.t || '')
  if (t.trim()) 걸음들.push({ 편: r.title, 번: i + 1, 글: t })
}))

// ⛔ 기본은 «지금 앱에 박힌 셋»만 잰다 — smoke 에서 8종을 다 쓸면 너무 느리다
const 크기들 = (process.env.FS || '24,28,38').split(',').map(Number)
// 📱 좁고 «짧은» 화면이 진짜 시험대다 — 키가 작으면 두 줄만 넘어도 스크롤이 생긴다
const 화면들 = [[320, 568, '작은 폰'], [360, 640, '보통(짧은)'], [390, 844, '갤럭시'], [412, 915, '큰 폰'], [820, 1180, '패드 세로'], [1194, 834, '패드 가로']]

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// 🍳 요리 모드를 «한 번» 연다
const 요리모드열기 = async (page) => {
  const 제목 = await page.evaluate(() => JSON.parse(localStorage.getItem('hankki:v1') || '{}').recipes?.find((r) => (r.steps || []).length >= 2)?.title || '')
  await page.evaluate(() => {
    const bs = [...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')]
    bs.find((x) => (x.innerText || '').replace(/\s+/g, '').includes('레시피'))?.click()
  })
  await page.waitForTimeout(500)
  await page.evaluate((T) => [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim().startsWith(T))?.click(), 제목)
  await page.waitForTimeout(600)
  // ⛔⛔ [2026-08-29] 옛 판은 «글자»(「요리 시작」)로 이 버튼을 찾았다 →
  //    창업자가 「요리모드 시작」으로 이름을 바꾸자 **6칸이 통째로 죽었다**(게이트가 «맞게» 걸린 것).
  //    v11.30 「레시피열쇠」 때 게이트 넷이 같은 이유로 죽은 자리와 판박이다.
  // ✅ `data-coach="cook"` 을 콕 집는다 — 이름이 또 바뀌어도 안 죽는다.
  await page.evaluate(() => document.querySelector('[data-coach="cook"]')?.click())
  await page.waitForTimeout(600)
  // 재료 준비 → 첫 조리 걸음
  await page.evaluate(() => [...document.querySelectorAll('.cook-navbtn')].find((x) => /시작 →|다음 →/.test(x.innerText || ''))?.click())
  await page.waitForTimeout(400)
  return page.evaluate(() => !!document.querySelector('.cook-steptext'))
}

console.log(`\n🍳 요리 모드 글씨 — 걸음 ${걸음들.length}개 «전수» × 크기 ${크기들.join('/')}px × 화면 ${화면들.length}개\n`)

const 표 = []
for (const [W, H, 이름] of 화면들) {
  const ctx = await b.newContext({ viewport: { width: W, height: H } })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4422/hankki/', { waitUntil: 'networkidle' })
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(700)
  const 열림 = await 요리모드열기(p)
  if (!열림) { console.log(`  ⛔ ${이름} — 요리 모드를 못 열었다`); await ctx.close(); continue }

  for (const fs of 크기들) {
    const r = await p.evaluate(({ 걸음들, fs }) => {
      const el = document.querySelector('.cook-steptext')
      const body = document.querySelector('.cook-body')
      const nav = document.querySelector('.cook-nav')
      if (!el || !body) return null
      const 옛 = el.style.fontSize
      el.style.fontSize = fs + 'px'
      const 한줄 = parseFloat(getComputedStyle(el).lineHeight)
      let 스크롤 = 0, 넘침 = 0, 세줄이상 = 0, 최다줄 = 0
      const 스크롤예 = []
      const navBottom = nav ? nav.getBoundingClientRect().bottom : 0
      for (const s of 걸음들) {
        el.textContent = s.글
        // ⭐ 「스크롤이 필요한가」 = 본문이 상자보다 큰가
        const 필요 = body.scrollHeight > body.clientHeight + 1
        if (필요) { 스크롤++; if (스크롤예.length < 3) 스크롤예.push(`${s.편} ${s.번}번(${s.글.length}자)`) }
        // ⭐ 「가로로 넘치나」 = 한 낱말이 칸보다 넓은가 (keep-all 이라 긴 낱말은 안 쪼개진다)
        if (el.scrollWidth > el.clientWidth + 1) 넘침++
        const 줄 = Math.round(el.getBoundingClientRect().height / 한줄)
        if (줄 > 최다줄) 최다줄 = 줄
        if (줄 >= 3) 세줄이상++
      }
      el.style.fontSize = 옛
      el.textContent = ''
      return {
        스크롤, 넘침, 세줄이상, 최다줄, 스크롤예,
        // ⛔ 2026-08-04 사고 = 「다음」이 화면 «밖»으로 밀렸다. 되살아나지 않았나
        nav밖: navBottom > window.innerHeight + 1,
      }
    }, { 걸음들, fs })
    if (!r) continue
    표.push({ 이름, W, H, fs, ...r })
  }
  await ctx.close()
}

await b.close(); srv.close()

console.log('화면          크기   스크롤 필요        3줄↑    최다줄   가로넘침  「다음」')
표.forEach((t) => {
  const 퍼 = (t.스크롤 / 걸음들.length * 100).toFixed(1)
  console.log(
    `${t.이름.padEnd(11, ' ')} ${String(t.fs).padStart(2)}px  ` +
    `${String(t.스크롤).padStart(4)}개 (${퍼.padStart(5)}%)  ` +
    `${String(t.세줄이상).padStart(4)}개  ` +
    `${String(t.최다줄).padStart(4)}줄  ` +
    `${String(t.넘침).padStart(5)}개  ` +
    `${t.nav밖 ? '⛔밖' : '✅안'}`,
  )
})

console.log('\n⭐ 읽는 법')
console.log('   · 「스크롤 필요」 = 그 걸음이 «한눈에 안 들어온다» — 부엌에선 잘린 것과 거의 같다')
console.log('   · 「가로넘침」 = 한 낱말이 칸보다 넓다 (keep-all 이라 안 쪼개진다) — 0 이어야 한다')
console.log('   · 「다음」 = 2026-08-04 사고(단추가 화면 밖) 가 되살아났나')

// ───────── 🚦 게이트 — `FS` 를 안 주면 «지금 앱에 박힌 값»으로 판정한다 ─────────
// ⭐ `FS=…` 를 주면 «둘러보기»(위 표만), 안 주면 **배포를 막는 검사**가 된다.
//    ⛔ 둘러보기 모드까지 배포를 막으면 크기를 재보는 것조차 못 한다.
if (!process.env.FS) {
  console.log('\n🚦 게이트 — 지금 앱에 박힌 크기로 판정')
  let 실패 = 0
  const chk = (이름, ok) => { console.log(`  ${ok ? '✅' : '⛔'} ${이름}`); if (!ok) 실패++ }
  // 화면마다 «실제로 적용된» 크기 한 줄만 골라 본다
  const 적용 = { '작은 폰': 24, '보통(짧은)': 24, '갤럭시': 28, '큰 폰': 28, '패드 세로': 38, '패드 가로': 38 }
  // 🔢 손보기 «전»(전부 24px) 실측 = 이 값보다 나빠지면 «누군가는 손해»다
  const 전 = { '작은 폰': 168, '보통(짧은)': 2, '갤럭시': 0, '큰 폰': 0, '패드 세로': 0, '패드 가로': 0 }
  Object.entries(적용).forEach(([화면, fs]) => {
    const t = 표.find((x) => x.이름 === 화면 && x.fs === fs)
    if (!t) { chk(`  ${화면} ${fs}px 를 재지 못했다`, false); return }
    chk(`  ${화면.padEnd(11, ' ')} ${fs}px · 스크롤 ${t.스크롤}개 (전 ${전[화면]}개 — 늘면 실패)`, t.스크롤 <= 전[화면])
    chk(`  ${화면.padEnd(11, ' ')} 가로 넘침 0`, t.넘침 === 0)
    chk(`  ${화면.padEnd(11, ' ')} 「다음」 단추가 화면 «안» (2026-08-04 사고)`, !t.nav밖)
  })
  console.log(`\n${실패 ? '⛔' : '✅'} ${실패 ? '실패 ' + 실패 + '칸' : '전부 통과'} — 걸음 ${걸음들.length}개 전수\n`)
  process.exit(실패 ? 1 : 0)
}
