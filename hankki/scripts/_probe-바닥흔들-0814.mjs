// 🩺 「고정이어야 하는데 스크롤하면 움직인다」 — 막대가 아니라 «바닥»이 흔들리나를 잰다
//    📮 창업자 2026-08-14 *"아직도 좀 덜덜하긴해 왜 그러지? 걔는 고정이어야하는데 스크롤하면 움직이니까."*
//
// ⭐ 앞선 두 판(v10.68 늦음 · v10.69 덜덜)은 «막대 손잡이»만 봤다.
//    창업자 말은 **막대가 붙어 있는 «바닥»이 움직인다**는 얘기다 — 그럼 손잡이를 아무리 고쳐도 소용없다.
//
// 🔎 의심 = `src/main.jsx` 의
//      window.visualViewport.addEventListener('scroll', setAppHeight)
//    → 스크롤 «도중»에 --app-height 를 새로 쓴다 → `.app-frame { height: var(--app-height) }` 가 다시 레이아웃.
//    막대는 position: fixed(뷰포트 기준)인데 내용은 프레임 기준이라 **둘이 따로 논다.**
//
// ⛔⛔ 이 판에서 못 재는 것 (규칙 18 — 「없다」와 「내가 못 잡는다」는 다른 말)
//    안드로이드 크롬의 «주소창 접힘»이 여기엔 없다. visualViewport 가 안 움직이니
//    setAppHeight 가 스크롤 중에 «안» 불릴 수 있다 → 숫자가 0 이어도 그건 「폰에서도 0」이 아니다.
//    ✅ 그래서 «두 갈래»로 잰다:
//       ⑴ 있는 그대로 (이 판의 사실)
//       ⑵ 주소창이 접히는 폰을 «흉내» — visualViewport 리사이즈를 강제로 일으켜
//          --app-height 가 바뀌면 막대와 내용이 «얼마나» 어긋나는지
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = '/home/user/hankki/hankki/dist'
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let b, t = M[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4459, r))
const { SEED_COACH_SEEN } = await import('/home/user/hankki/hankki/src/coach.js')

// ⑴ 있는 그대로 — 굴리는 «동안» --app-height / 프레임 높이 / 화면 rect 가 흔들리나
const 잰다1 = `(async () => {
  const raf = () => new Promise(r => requestAnimationFrame(() => r()))
  const list = document.querySelectorAll('.app-frame .screen')
  const el = list[list.length - 1]
  const frame = document.querySelector('.app-frame')
  if (!el || !frame) return { 오류: '화면을 못 찾았다' }

  // setAppHeight 가 스크롤 중에 «몇 번» 불리나 — style 쓰기를 가로채 센다
  let 쓴횟수 = 0
  const root = document.documentElement
  const 원래 = root.style.setProperty.bind(root.style)
  root.style.setProperty = (k, v) => { if (k === '--app-height') 쓴횟수++; return 원래(k, v) }

  let vvScroll = 0, vvResize = 0
  if (window.visualViewport) {
    window.visualViewport.addEventListener('scroll', () => vvScroll++)
    window.visualViewport.addEventListener('resize', () => vvResize++)
  }

  const 값 = () => ({
    appH: getComputedStyle(root).getPropertyValue('--app-height').trim(),
    frameH: Math.round(frame.getBoundingClientRect().height),
    screenTop: Math.round(el.getBoundingClientRect().top),
    screenH: Math.round(el.getBoundingClientRect().height),
    clientH: el.clientHeight,
    scrollH: el.scrollHeight,
  })
  const 처음 = 값()
  const 흔들 = { appH: new Set(), frameH: new Set(), screenTop: new Set(), screenH: new Set(), clientH: new Set(), scrollH: new Set() }
  for (const 목표 of [200, 600, 1100, 1700, 2400, 1200, 300]) {
    el.scrollTop = 목표
    await raf(); await raf()
    const v = 값()
    for (const k of Object.keys(흔들)) 흔들[k].add(v[k])
  }
  root.style.setProperty = 원래
  return {
    처음,
    가짓수: Object.fromEntries(Object.entries(흔들).map(([k, s]) => [k, s.size])),
    'appHeight 쓴 횟수': 쓴횟수,
    'visualViewport scroll': vvScroll,
    'visualViewport resize': vvResize,
  }
})()`

// ⑵ 주소창이 접히는 폰 흉내 — --app-height 가 «스크롤 도중» 바뀌면 막대와 내용이 얼마나 어긋나나
const 잰다2 = `(async () => {
  const raf = () => new Promise(r => requestAnimationFrame(() => r()))
  const list = document.querySelectorAll('.app-frame .screen')
  const el = list[list.length - 1]
  const bar = () => document.querySelector('[data-vhint]')
  const root = document.documentElement
  if (!el || !bar()) return { 오류: '막대가 안 그려졌다' }

  const 기준높이 = parseInt(getComputedStyle(root).getPropertyValue('--app-height')) || window.innerHeight

  // 「막대가 있어야 할 자리」 = 지금 화면 rect 로 다시 계산한 값
  const 있어야할자리 = () => {
    const r = el.getBoundingClientRect()
    const { scrollHeight: sh, clientHeight: ch, scrollTop: st } = el
    const h = Math.max(28, (ch / sh) * r.height)
    return r.top + (st / Math.max(1, sh - ch)) * (r.height - h)
  }
  const 어긋남 = () => Math.round(Math.abs(bar().getBoundingClientRect().top - 있어야할자리()))

  // ⚠️⚠️ 첫 판은 scrollTop 을 «같은 값»으로 넣어서 scroll 이벤트가 «안 났다» —
  //    그래서 「앱 높이만 바뀌고 아무도 다시 안 재는」 상황만 쟀다(폰은 굴리면서 주소창이 움직인다).
  //    ✅ 두 갈래로 나눠 잰다. ⓐ가 진짜 폰이고 ⓑ는 「아무 신호도 없을 때」의 바닥값이다.
  // ⚠️⚠️ 폰에서 «실제로» 일어나는 순서를 그대로 흉내낸다 —
  //    ⛔ 여긴 «템플릿 문자열 안»이라 주석에도 백틱을 쓰면 안 된다(CLAUDE.md 함정 · 또 밟았다) → 낫표로.
  //    ⑴브라우저가 주소창을 접어 «보이는 뷰포트»가 작아진다
  //    → ⑵「visualViewport」 의 resize 가 뜬다
  //    → ⑶「main.jsx」 의 setAppHeight 가 그 높이를 읽어 --app-height 를 다시 쓴다
  //    → ⑷앱이 반응한다.
  //
  // ⛔⛔ 여기서 «두 번» 틀렸다. 둘 다 규칙 18 ⓘ — 「검사가 무엇을 보는지」를 안 본 것이다.
  //    ① 첫 판 = ⑶만 손으로 했다(CSS 변수만 바꿈) → ⑵를 듣는 코드가 영영 안 불려 «실제보다 나쁘게» 나왔다.
  //    ② 둘째 판 = ⑵만 쐈다(resize 만) → setAppHeight 가 «진짜» 뷰포트 높이(안 변함)를 읽어
  //       내가 줄여놓은 값을 **되돌려 놨다.** 프레임이 아예 안 변하니 어긋날 것도 없어
  //       **옛 판까지 0px 로 통과했다** — 아무것도 안 재는 검사였다.
  //    ✅ 그래서 ⑴부터 흉내낸다 — visualViewport.height «자체»를 줄이고 resize 를 쏜다.
  //       그러면 setAppHeight 가 스스로 그 값을 읽어 --app-height 를 쓴다(우리가 안 넣는다).
  const vv = window.visualViewport
  const 진짜높이 = vv ? vv.height : window.innerHeight
  let 가짜높이 = null
  if (vv) {
    try { Object.defineProperty(vv, 'height', { configurable: true, get: () => (가짜높이 === null ? 진짜높이 : 가짜높이) }) }
    catch (e) { return { 오류: 'visualViewport.height 를 흉내낼 수 없다 — ' + e.message } }
  }
  const 주소창 = (줄임) => {
    가짜높이 = 진짜높이 - 줄임
    if (vv) vv.dispatchEvent(new Event('resize'))
    else root.style.setProperty('--app-height', 가짜높이 + 'px')
  }
  // ⭐ 「프레임높이」를 «같이» 찍는다 — 이 값이 안 흔들리면 흉내가 안 먹힌 것이고,
  //    그럼 어긋남이 0 이어도 그건 «고쳐졌다»가 아니라 «아무것도 안 쟀다»다(오늘 두 번 당했다).
  const 프레임 = document.querySelector('.app-frame')
  const 잰다 = async (굴릴곳, 줄임) => {
    주소창(줄임)
    if (굴릴곳 !== null) el.scrollTop = 굴릴곳
    await raf(); await raf(); await raf()
    return { 어긋남: 어긋남(), 프레임높이: Math.round(프레임.getBoundingClientRect().height) }
  }
  // ⚠️ 이름에 ⓐ·ⓑ 같은 «기호»는 못 쓴다 — JS 식별자가 아니라 SyntaxError 로 죽는다(실제로 당했다).
  const 굴리며 = []   // 굴리면서 주소창이 움직인다 (진짜 폰)
  let 곳 = 900
  for (const 줄임 of [0, 56, 0, 64, 0]) { 곳 += 130; 굴리며.push({ '줄임': 줄임, 굴린곳: 곳, ...(await 잰다(곳, 줄임)) }) }
  const 가만히 = []   // 손가락을 뗀 채 주소창만 움직인다 (스크롤 이벤트 0)
  el.scrollTop = 1200; await raf(); await raf()
  for (const 줄임 of [0, 56, 0, 64, 0]) 가만히.push({ '줄임': 줄임, ...(await 잰다(null, 줄임)) })
  주소창(0) // 원래대로 되돌린다(가짜 높이를 풀고 resize 한 번)
  return {
    굴리며, 가만히,
    막대: getComputedStyle(bar()).position,
    '흉내가 먹혔나': root.style.getPropertyValue('--app-height'), // ⭐ 비면 흉내 자체가 실패한 것이다
  }
})()`

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul' })
await ctx.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1'); localStorage.setItem('hankki:giftSheetSeen', '1') })
await ctx.addInitScript({ content: SEED_COACH_SEEN })
const pg = await ctx.newPage()
await pg.goto('http://127.0.0.1:4459/hankki/', { waitUntil: 'networkidle' }); await pg.waitForTimeout(900)
const a = pg.getByRole('button', { name: '나중에' }).first()
if (await a.count() && await a.isVisible().catch(() => false)) await a.click().catch(() => {})
await pg.getByRole('button', { name: /^레시피/ }).last().click(); await pg.waitForTimeout(1000)

const r1 = await pg.evaluate(잰다1)
console.log('\n🩺 ⑴ 있는 그대로 — 굴리는 «동안» 바닥이 흔들리나\n')
if (r1.오류) { console.log('  ⛔', r1.오류) } else {
  console.log('  처음 :', JSON.stringify(r1.처음))
  console.log('  굴리는 동안 값이 몇 «가지»였나 (1 이면 안 흔들린 것) :')
  for (const [k, v] of Object.entries(r1.가짓수)) console.log(`     ${v > 1 ? '⛔' : '✅'} ${k} : ${v}가지`)
  console.log(`  --app-height 를 다시 쓴 횟수 : ${r1['appHeight 쓴 횟수']}`)
  console.log(`  visualViewport scroll : ${r1['visualViewport scroll']} · resize : ${r1['visualViewport resize']}`)
  console.log('\n  ⚠️ 여기엔 «주소창»이 없다 — 0 이 나와도 그건 「폰에서도 0」이 아니다(규칙 18).')
}

const r2 = await pg.evaluate(잰다2)
console.log('\n🩺 ⑵ 주소창이 접히는 폰 흉내 — 앱 높이가 바뀌면 막대가 얼마나 어긋나나\n')
if (r2.오류) { console.log('  ⛔', r2.오류) } else {
  console.log('  막대를 붙인 방식 :', r2.막대, '· 흉내 뒤 --app-height =', r2['흉내가 먹혔나'] || '(빔)', '\n')
  const 흔들린높이 = new Set([...r2.굴리며, ...r2.가만히].map((x) => x.프레임높이))
  if (흔들린높이.size < 2) {
    console.log(`  ⛔⛔ 흉내가 «안 먹혔다» — 프레임 높이가 ${[...흔들린높이]}px 하나뿐이다.`)
    console.log('     어긋남이 0 이어도 그건 「고쳐졌다」가 아니라 「아무것도 안 쟀다」다. 여기서 판정하지 말 것.\n')
  } else {
    console.log(`  ✅ 흉내가 먹혔다 — 프레임 높이가 ${[...흔들린높이].sort((a, b) => b - a).join(' ↔ ')}px 로 실제로 흔들렸다\n`)
  }
  const 보이기 = (이름, 줄들) => {
    for (const x of 줄들) console.log('   ', JSON.stringify(x))
    const 최대 = Math.max(...줄들.map((x) => x.어긋남))
    console.log(`   ${최대 > 2 ? '⛔' : '✅'} ${이름} — 최대 ${최대}px\n`)
    return 최대
  }
  console.log('  ⓐ 굴리면서 주소창이 움직인다 (진짜 폰의 모습)')
  const a = 보이기('굴리며', r2.굴리며)
  console.log('  ⓑ 손가락을 뗀 채 주소창만 움직인다 (스크롤 이벤트가 «0»)')
  const b = 보이기('가만히', r2.가만히)
  console.log(a > 2 || b > 2
    ? `  ⛔ 아직 어긋난다 — 폰에선 스크롤 내내 이게 일어난다(주소창 접힘) = 덜덜`
    : `  ✅ 앱 높이가 바뀌어도 막대가 내용을 따라간다 — 「고정이어야 하는데 움직인다」가 없어졌다`)
}
await b.close(); srv.close()
