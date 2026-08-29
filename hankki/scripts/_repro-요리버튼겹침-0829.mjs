// 🍳🏁 **「요리모드 시작 버튼이 «다 됐어요»(완성 칸)와 겹치나」 재현판**
//
// 📮 창업자 제보 2026-08-29 = *"요리시작버튼이 다됐어요버튼이랑만 겹쳐져. 확인해줄래"* ＋ 폰 캡처 둘
//    ⭐ **「다 됐어요」 = 완성 칸(꼬르곰)이다** — 창업자가 그렇게 부른다.
//       근거 = `RecipeDetailScreen.jsx:720` 에 창업자 원문이 박혀 있다:
//       *"소스레시피만(만드는법 없음) 추가하면 **꼬르곰(다 됐어요)**이 안뜨는거야"*
//    ⛔ 「만들었어요」 «버튼»이 아니다 — 그 둘은 나란히 있어 겹칠 수가 없다(flex 형제).
//
// 🔎 **의심하는 원인** = `.action-bar` 의 배경이
//    `linear-gradient(to top, var(--bg) 72%, transparent)` 라 **위쪽 28% 가 투명**이다.
//    sticky 라 그 밑으로 내용이 지나가는데, 투명부에선 «가려지다 만» 상태로 비친다.
//
// ⭐⭐ **재는 법 = 「글자가 보이나」가 아니라 «픽셀이 실제로 겹치나»** (절대원칙 18 ⓘ).
//    완성 칸의 상자와 action-bar 상자가 화면에서 겹친 높이를 px 로 잰다.
//    ⛔ 스크롤을 «끝»까지 내리면 sticky 가 제자리를 찾아 안 겹친다 —
//       창업자가 본 건 «지나가는 중»이다. 그래서 **스크롤을 여러 지점에서** 잰다.
//
// ＋ 같은 판에서 **버튼 이름이 길어진 것**(「요리 시작」 5자 → 「요리모드 시작」 7자)도 잰다.
//    좁은 폰에서 넘치면 그게 새 사고다(v11.31 「제일 많이 써요」와 같은 자리).
//
// 실행: node /home/user/hankki/hankki/scripts/_repro-요리버튼겹침-0829.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/shot'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
// ⛔ 포트를 손으로 박지 않는다 (EADDRINUSE 사고 둘 · v11.31 4413 · 0829 4419)
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

let 죽음 = 0
const 나쁨 = (m) => { console.error(`  ✗ ${m}`); 죽음++ }
const 좋음 = (m) => console.log(`  ok  ${m}`)

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

// ── 레시피 상세로 가는 길 (steps 가 있는 편이라야 「요리모드 시작」 버튼이 뜬다) ──
async function 상세로(폭) {
  const ctx = await b.newContext({ viewport: { width: 폭, height: 844 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1200)
  for (let i = 0; i < 3; i++) {           // 새 소식 팝업 치우기
    if (!(await p.locator('.sheet-mask').count())) break
    await p.keyboard.press('Escape'); await p.waitForTimeout(400)
  }
  // ⛔ 하단 탭은 `.bottom-nav .nav-item` 이다 — 첫 판이 `.tabbar`/`.bottomnav` 로 찾아 못 갔다(규칙 18)
  await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click().catch(() => {})
  await p.waitForTimeout(1000)
  // 「요리모드 시작」 버튼이 있는 편을 만날 때까지 카드를 눌러 본다
  const 카드 = p.locator('.screen button, .screen [role="button"], .screen a').filter({ hasText: /[가-힣]/ })
  const n = Math.min(await 카드.count(), 14)
  for (let i = 0; i < n; i++) {
    await 카드.nth(i).click().catch(() => {})
    await p.waitForTimeout(800)
    if (await p.locator('[data-coach="cook"]').count()) return { ctx, p }
    await p.goBack().catch(() => {}); await p.waitForTimeout(600)
  }
  return { ctx, p }
}

console.log('\n── 🍳 요리모드 시작 버튼 ──')

const { ctx, p } = await 상세로(390)
const 있나 = await p.locator('[data-coach="cook"]').count()
if (!있나) { 나쁨('상세 화면에서 「요리모드 시작」 버튼을 못 찾았다 — 아래 칸은 아무것도 못 잰다'); }
else {
  // ① 이름이 바뀌었나 (화면에 «그려진» 글자로 · ⛔소스 grep 은 주석까지 걸린다)
  const 글자 = (await p.locator('[data-coach="cook"]').innerText()).trim()
  console.log(`  · 버튼 글자 = 「${글자}」`)
  if (글자 !== '요리모드 시작') 나쁨(`버튼 글자가 「요리모드 시작」이 아니다 — 「${글자}」`)
  else 좋음('버튼 글자 = 「요리모드 시작」')

  // ② 완성 칸과 «픽셀이» 겹치나 — 스크롤을 여러 지점에서
  const 잰값 = await p.evaluate(async () => {
    const 바 = document.querySelector('.action-bar')
    // 완성 칸 = 「완성!」 글자를 가진 제일 안쪽 상자
    const 완성 = [...document.querySelectorAll('div,span')]
      .filter((e) => /완성!/.test(e.textContent || '') && e.children.length < 4).pop()
    if (!바 || !완성) return { 없음: !바 ? 'action-bar' : '완성 칸' }
    // ⛔⛔ `document.querySelector('.screen')` 을 쓰면 «앞 화면»(레시피 목록)을 잡는다 —
    //    화면을 옮겨도 앞 화면 DOM 이 남아 `.screen` 이 둘이다(v11.19 링크정직 판과 같은 함정).
    //    첫 판이 그래서 앞 화면을 스크롤했고 **상세는 맨 위 그대로였다** → 겹침 0px 로 «거짓 통과».
    // ✅ 완성 칸이 «실제로 들어 있는» 스크롤 조상을 콕 집는다.
    const 스크롤 = 완성.closest('.screen') || document.scrollingElement
    const 총 = 스크롤.scrollHeight - 스크롤.clientHeight
    if (총 < 50) return { 없음: `스크롤이 안 되는 화면이다(총 ${총}px) — 아무것도 못 잰다` }
    const 결과 = []
    for (const 비율 of [0.5, 0.6, 0.7, 0.8, 0.9, 1.0]) {
      스크롤.scrollTop = Math.round(총 * 비율)
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      const a = 바.getBoundingClientRect(), c = 완성.getBoundingClientRect()
      const 겹침 = Math.max(0, Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top))
      결과.push({ 비율, 겹침: Math.round(겹침), 완성bottom: Math.round(c.bottom), 바top: Math.round(a.top) })
    }
    const cs = getComputedStyle(바)
    // ⭐ 「스크롤이 진짜로 됐나」를 같이 찍는다 — 안 찍으면 «아무것도 안 재고 통과»한다(규칙 18 ⓘ)
    return { 결과, 총, 배경: cs.background.slice(0, 90), 바높이: Math.round(바.getBoundingClientRect().height) }
  })

  if (잰값.없음) 나쁨(`${잰값.없음} 을 못 찾았다`)
  else {
    console.log(`  · 스크롤 가능한 총량 ${잰값.총}px  (0 이면 아무것도 못 잰 것이다)`)
    console.log(`  · action-bar 높이 ${잰값.바높이}px · 배경 = ${잰값.배경}`)
    let 겹친적 = 0
    for (const r of 잰값.결과) {
      const 표 = r.겹침 > 0 ? '⚠️ 겹침' : '  '
      console.log(`  · 스크롤 ${Math.round(r.비율 * 100)}% → 겹친 높이 ${r.겹침}px  ${표}`)
      if (r.겹침 > 0) 겹친적 = Math.max(겹친적, r.겹침)
    }
    // ⭐⭐ **잣대를 바꿨다** — 「겹쳤나」로 재면 안 된다.
    //    sticky 라 내용이 바 뒤로 지나가는 건 «필연»이고, 그걸 없애려면 sticky 를 버려야 한다.
    //    진짜 문제는 **배경 위쪽이 투명해 지나가는 글자가 «읽힐 만큼» 비치는 것**이었다.
    //    → 재는 것 = **페이드 구간(비치는 띠)이 몇 px 인가.** 글자 한 줄(≈25px)보다 훨씬 작아야 한다.
    const 불투명 = Number((잰값.배경.match(/(\d+)%/) || [])[1] || 0)
    const 비치는띠 = Math.round(잰값.바높이 * (100 - 불투명) / 100)
    console.log(`  · 배경이 불투명해지는 지점 ${불투명}% → **비치는 띠 ${비치는띠}px**`)
    if (겹친적 > 0) console.log(`  · (참고) 완성 칸이 바 뒤로 최대 ${겹친적}px 지나간다 — sticky 라 정상이다`)
    if (!불투명) 나쁨('배경 그라디언트에서 불투명 지점을 못 읽었다 — 잣대가 헛돌았다')
    else if (비치는띠 > 10) 나쁨(`비치는 띠가 ${비치는띠}px — 글자가 읽힐 만큼 비친다(창업자 제보 그 자리)`)
    else 좋음(`비치는 띠가 ${비치는띠}px 뿐이라 글자로 안 읽힌다`)
  }

  await p.screenshot({ path: `${OUT}/요리버튼-390.png` })
}
await ctx.close()

// ③ 좁은 폰에서 이름이 길어져 넘치지 않나
console.log('\n── 📐 버튼 폭 (이름이 5자 → 7자로 길어졌다) ──')
for (const 폭 of [320, 360, 390, 412]) {
  const { ctx: c2, p: p2 } = await 상세로(폭)
  if (!(await p2.locator('[data-coach="cook"]').count())) { await c2.close(); continue }
  const m = await p2.evaluate((W) => {
    const 바 = document.querySelector('.action-bar')
    const 시작 = document.querySelector('[data-coach="cook"]')
    const 만들 = [...바.querySelectorAll('button')].find((x) => /만들었어요/.test(x.innerText))
    const a = 시작.getBoundingClientRect(), b = 만들?.getBoundingClientRect()
    const s = getComputedStyle(시작)
    return {
      시작폭: Math.round(a.width), 만들폭: b ? Math.round(b.width) : 0,
      오른끝넘침: Math.round((b ? b.right : a.right) - W),
      줄바꿈: 시작.scrollHeight > a.height + 2,
      글자잘림: 시작.scrollWidth > 시작.clientWidth + 1,
      글꼴: s.fontSize,
    }
  }, 폭)
  const 탈 = []
  if (m.오른끝넘침 > 0) 탈.push(`오른쪽으로 ${m.오른끝넘침}px 넘침`)
  if (m.줄바꿈) 탈.push('두 줄로 넘어감')
  if (m.글자잘림) 탈.push('글자 잘림')
  console.log(`  · ${폭}px — 시작 ${m.시작폭}px · 만들었어요 ${m.만들폭}px · ${m.글꼴}${탈.length ? '  ⚠️ ' + 탈.join(' · ') : ''}`)
  if (탈.length) 나쁨(`${폭}px 에서 ${탈.join(' · ')}`)
  await p2.screenshot({ path: `${OUT}/요리버튼-${폭}.png` })
  await c2.close()
}

await b.close(); srv.close()
console.log(죽음 ? `\n✗ ${죽음}칸 실패\n` : '\n✅ 전부 통과\n')
process.exit(죽음 ? 1 : 0)
