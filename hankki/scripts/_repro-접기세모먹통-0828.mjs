// 🔺🔺 「친구들 옆 세모(▲)가 먹통」 재현판 (창업자 폰 제보 2026-08-28)
//
// 📮 창업자 = *"그리고 저거 먹통익던데 **친구들옆에 세모있자나**"*
//
// 🔎 그 세모 = `.decor-pickfold` — 「고르는 줄 접기」다(DecorEditor 1680줄).
//    ⭐ 접는 대상이 «셋»뿐이다 — ⑴종이(무늬·모양) ⑵글씨체 ⑶글씨 크기.
//       셋 다 **종이나 글자를 «고른 뒤»에만** 화면에 뜬다(1579·1604·1642줄 조건).
//    ⛔ 그래서 **아무것도 안 골랐거나 스티커를 고른 상태**에서는 접을 게 «0줄»이라
//       눌러도 화면이 한 픽셀도 안 바뀐다 = 창업자가 본 「먹통」.
//    📌 고장이 아니라 **「할 일이 없는데 단추가 서 있는 것」**이다 —
//       유저는 그걸 구분할 방법이 없다. 안 되는 단추는 «없는 게» 낫다.
//
// ⭐ 재는 것 = **누르기 «전»과 «후»의 서랍 화면이 달라지나**(픽셀·줄 수).
//    ⛔ 「눌렸나」·「aria-expanded 가 바뀌었나」로는 못 잰다 — 상태는 바뀌는데 «보이는 게» 안 바뀐다.
//       그게 정확히 이 사고다(절대원칙 18 ⓘ).
//
// 실행: node /home/user/hankki/hankki/scripts/_repro-접기세모먹통-0828.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홍보/앱화면'
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
await new Promise((r) => srv.listen(4394, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const _N = new Date()

// 🗓🗓 **시계를 「이번 달 15일 낮」으로 고정한다** (2026-09-01 · 달이 바뀌는 날 셋이 한꺼번에 죽었다)
//   ⛔ 뿌리 = 씨앗 날짜를 `Date.now()` 에서 «며칠 빼서» 만드는데, **달 초에 돌리면 지난달로 떨어진다.**
//      일기·달력 화면은 «이번 달»을 열므로 화면이 텅 비고, 찾던 것이 영영 안 나온다.
//      🔢 실측(2026-09-01 = 1일) — `_repro-일기그달`·`_repro-접기세모먹통`·`_repro-일기포스트잇` **셋 다 실패**.
//         손 안 댄 배포 갈래에서도 똑같이 죽었다 = **앱이 아니라 검사가 낡은 것**이다(절대원칙 18 ⓘ).
//   ⛔ 「1 로 눌러 담기」(`Math.max(1, T-10)`)는 답이 아니었다 — 1일엔 **엿새가 한 날로 뭉쳐**
//      「제육볶음이 3번 뜬다」·「요리 안 한 날이 없다」처럼 **재려던 상황 자체가 사라진다.**
//   ✅ 15일이면 앞뒤로 열흘씩 여유가 있어 **어느 달, 어느 날에 돌려도 같은 그림**이 나온다.
await ctx.clock.install({ time: new Date(_N.getFullYear(), _N.getMonth(), 15, 12, 0, 0) })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })

const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4394/', { waitUntil: 'networkidle' })
await p.waitForTimeout(1000)
await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click()
await p.waitForTimeout(1200)
await p.locator('.name').first().click()
await p.waitForTimeout(1200)
const 레꾸 = p.locator('button', { hasText: '레시피 꾸미기' }).first()
await 레꾸.waitFor({ state: 'visible', timeout: 8000 })
await 레꾸.click()
await p.waitForTimeout(1600)
for (let i = 0; i < 4; i++) {
  if (!(await p.locator('.sheet-mask').count())) break
  await p.keyboard.press('Escape'); await p.waitForTimeout(400)
  if (await p.locator('.sheet-mask').count()) { await p.mouse.click(195, 60); await p.waitForTimeout(400) }
}

const 칸 = [] // 검사 결과
// ⛔⛔ **「화면 픽셀이 바뀌었나」로 재면 안 된다** — 세모 «그림 자체»가 뒤집히므로
//    아무 일도 안 해도 늘 «바뀜»으로 나온다. 첫 판이 그래서 2/2 초록불이었다(절대원칙 18 ⓘ).
// ✅ 잣대 = **세모 «말고» 나머지가 움직였나** — 첫 스티커 칸의 y 와 서랍에 뜬 줄 수.
//    접기가 일하면 위 줄들이 사라져 **아래 것이 위로 올라온다.**
//    ⛔ `.decor-cell` 로 재면 «배경 탭»에선 늘 null 이다(배경지는 딴 마크업) — 첫 판이 그랬다.
//       칩 줄(`.decor-catsrow`) «바로 다음» 덩어리를 본다 — 어느 탭에서나 있다.
const 재기 = () => p.evaluate(() => {
  const 접힘 = document.querySelector('.decor-pickfold')
  const 칩줄 = document.querySelector('.decor-catsrow')
  const 다음 = 칩줄?.nextElementSibling
  let 굴림 = 칩줄?.parentElement
  while (굴림 && !(굴림.scrollHeight - 굴림.clientHeight > 40)) 굴림 = 굴림.parentElement
  return {
    다음덩어리y: 다음 ? Math.round(다음.getBoundingClientRect().top) : null,
    서랍속높이: 굴림 ? 굴림.scrollHeight : null,
    세모있나: !!접힘,
    펴짐: 접힘?.getAttribute('aria-expanded'),
  }
})

const 세모 = p.locator('.decor-pickfold')
const 있나 = await 세모.count()

// ── ① 아무것도 안 고른 상태 (창업자가 본 그 상태) ──────────────────
const 전상태 = await 재기()
if (있나) { await 세모.first().click(); await p.waitForTimeout(700) }
const 후상태 = await 재기()
const 잰다 = (a, b) => Math.max(Math.abs((a.다음덩어리y ?? 0) - (b.다음덩어리y ?? 0)), Math.abs((a.서랍속높이 ?? 0) - (b.서랍속높이 ?? 0)))
const 움직임 = 잰다(전상태, 후상태)

칸.push(['① 레꾸에는 세모가 «없다» (있다면 눌러서 서랍이 움직여야 한다)', !있나 || 움직임 > 4])
console.log(`   세모 ${있나 ? '있음' : '없음'} · 눌렀을 때 서랍이 ${움직임}px 움직였다`)
console.log(`   전 ${JSON.stringify(전상태)}\n   후 ${JSON.stringify(후상태)}`)
await p.screenshot({ path: join(OUT, '32-세모-레꾸.png') })

// ── ② 일꾸(일기 꾸미기) = 접을 줄이 «진짜로 있는» 자리 ────────────────
// ⭐⭐ 이 칸이 «고침의 값»을 지킨다 — 세모를 그냥 없애 버리면 ①은 통과하지만
//    일기에서 「고르는 줄 접기」가 통째로 사라진다(창업자 2026-08-13 요청으로 만든 기능이다).
//    ⛔ 그래서 ①만 있는 재현판은 반쪽이다.
// ⛔ 「취소」로 나오면 «레시피 상세»(전체화면)라 하단바가 없다 — 거기서 탭을 찾으면 30초 기다리다 죽는다.
//    ⭐ 처음부터 다시 연다. 이 판은 «두 화면»을 재는 것이라 한 흐름으로 이을 이유가 없다.
await p.goto('http://127.0.0.1:4394/', { waitUntil: 'networkidle' })
await p.waitForTimeout(1200)
await p.locator('.bottom-nav .nav-item').filter({ hasText: '일기' }).first().click()
await p.waitForTimeout(1400)
// ⛔ 일기 탭의 단추는 「오늘 일기 쓰기」다 — 「…꾸미기」로 찾으면 못 찾고 조용히 지나간다
const 일꾸 = p.locator('button', { hasText: '오늘 일기 쓰기' }).first()
let 있나2 = 0, 움직임2 = 0
if (await 일꾸.count()) {
  await 일꾸.click()
  await p.waitForTimeout(1400)
  // ⛔ 한 번 더 — 일기 «쓰는» 화면이 먼저 나오고 그 아래 「꾸미기」 단추가 일꾸를 연다
  const 꾸미기 = p.locator('button', { hasText: '꾸미기' }).first()
  await 꾸미기.waitFor({ state: 'visible', timeout: 8000 })
  await 꾸미기.click()
  await p.waitForTimeout(1600)
  for (let i = 0; i < 4; i++) {
    if (!(await p.locator('.sheet-mask').count())) break
    await p.keyboard.press('Escape'); await p.waitForTimeout(400)
    if (await p.locator('.sheet-mask').count()) { await p.mouse.click(195, 60); await p.waitForTimeout(400) }
  }
  // ⛔ 일꾸 서랍은 «속지» 탭으로 열린다 — 세모는 「데코 갈래」일 때만 있는 줄에 붙는다.
  //    「일꾸」 탭을 눌러야 갈래칩 줄이 뜬다.
  const 일꾸탭 = p.locator('button').filter({ hasText: /^일꾸$/ }).first()
  if (await 일꾸탭.count()) { await 일꾸탭.click(); await p.waitForTimeout(1100) }
  const 전2 = await 재기()
  const 세모2 = p.locator('.decor-pickfold')
  있나2 = await 세모2.count()
  if (있나2) { await 세모2.first().click(); await p.waitForTimeout(700) }
  const 후2 = await 재기()
  움직임2 = 잰다(전2, 후2)
}
칸.push(['② 일꾸에는 세모가 «있고 일한다»(서랍이 움직인다)', 있나2 > 0 && 움직임2 > 4])
console.log(`\n   (일꾸) 세모 ${있나2 ? '있음' : '없음'} · 눌렀을 때 서랍이 ${움직임2}px 움직였다`)
await p.screenshot({ path: join(OUT, '33-세모-일꾸.png') })

await b.close()
srv.close()

console.log('')
let 죽음 = 0
for (const [이름, ok] of 칸) { console.log(`${ok ? '✅' : '⛔'} ${이름}`); if (!ok) 죽음++ }
console.log(`\n${칸.length - 죽음}/${칸.length}`)
process.exit(죽음 ? 1 : 0)
