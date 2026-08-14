// 🔒 「막대가 스크롤을 «진짜로» 따라가나」 — 오늘 하루를 태운 그 물음을 검사로 박는다
//
// ⛔⛔ 무슨 일이 있었나 (2026-08-14)
//   v10.69 에서 CSS `scroll-timeline` 으로 막대를 옮기게 바꿨다. 헤드리스에선 잘 돌았고
//   재현판도 초록불이었다. **그런데 창업자 폰에선 시계가 «안 돌았다».**
//   🔢 창업자 영상 실측 — 레시피 화면 3.7초 동안 **내용은 2,272px 굴렀는데 막대는 40px 안에서 떨기만** 했다.
//      막대가 맨 위(`--hk-vy0`)에 붙박여 제자리 진동만 한 것 = 창업자가 본 「덜덜」.
//   ⛔ 게다가 시계를 믿고 JS 그리기를 꺼버려서 **되살릴 길이 없었다.**
//
// ⛔⛔ **왜 기존 검사가 못 잡았나 — 「무엇을 보는지」가 틀렸다** (규칙 18 ⓘ)
//   · `_repro-막대따라옴-0814.mjs` 는 **「몇 프레임 늦나」**를 봤다 → 붙박여 있어도 «안 늦은» 걸로 나온다
//   · `CSS.supports('animation-timeline','scroll()')` 는 **「기능이 있나」**를 물었다 →
//     우리가 실제로 쓰는 건 `timeline-scope` 로 «이름 붙인» 시계라 **다른 기능**이다
//   ✅ 그래서 이 검사는 **「많이 굴렸을 때 막대도 많이 갔나」**를 본다. 그것만 본다.
//
// 📌 한 줄 = **늦는 것과 안 가는 것은 다르다.** 늦음은 따라오고, 붙박이는 영영 안 온다.
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
await new Promise((r) => srv.listen(4461, r))
const { SEED_COACH_SEEN } = await import('/home/user/hankki/hankki/src/coach.js')

const 잰다 = `(async () => {
  const raf = () => new Promise(r => requestAnimationFrame(() => r()))
  const list = document.querySelectorAll('.app-frame .screen')
  const el = list[list.length - 1]
  const bar = () => document.querySelector('[data-vhint]')
  if (!el) return { 오류: '화면 없음' }
  if (!bar()) return { 오류: '세로 막대가 안 그려졌다' }
  const 막대y = () => bar().getBoundingClientRect().top

  const { scrollHeight: sh, clientHeight: ch } = el
  if (sh <= ch + 8) return { 오류: '이 화면은 안 넘친다 — 잴 수 없다' }

  // 맨 위 → 맨 아래로 굴리며 막대가 «따라오는지»
  const 자국 = []
  const 끝 = sh - ch
  for (const 몫 of [0, 0.25, 0.5, 0.75, 1]) {
    el.scrollTop = Math.round(끝 * 몫)
    await raf(); await raf(); await raf()
    자국.push({ 몫, scrollTop: el.scrollTop, 막대y: Math.round(막대y()) })
  }
  const 화면높이 = el.getBoundingClientRect().height
  const 막대높이 = bar().getBoundingClientRect().height
  return {
    자국,
    갈수있는거리: Math.round(화면높이 - 막대높이),
    실제간거리: Math.round(자국[자국.length - 1].막대y - 자국[0].막대y),
    옮기는방식: (() => {
      const cs = getComputedStyle(bar())
      return { position: cs.position, animation: cs.animationName, 시계: cs.animationTimeline, 인라인: bar().style.transform ? '있음' : '(없음)' }
    })(),
  }
})()`

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul' })
await ctx.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1'); localStorage.setItem('hankki:giftSheetSeen', '1') })
await ctx.addInitScript({ content: SEED_COACH_SEEN })
const pg = await ctx.newPage()
await pg.goto('http://127.0.0.1:4461/hankki/', { waitUntil: 'networkidle' }); await pg.waitForTimeout(900)
const a = pg.getByRole('button', { name: '나중에' }).first()
if (await a.count() && await a.isVisible().catch(() => false)) await a.click().catch(() => {})

let 죽음 = 0
for (const [이름, 열기] of [
  ['레시피', async () => { await pg.getByRole('button', { name: /^레시피/ }).last().click() }],
  ['홈', async () => { await pg.getByRole('button', { name: /^홈/ }).last().click() }],
  ['장보기', async () => { await pg.getByRole('button', { name: /^장보기/ }).last().click() }],
]) {
  await 열기(); await pg.waitForTimeout(1000)
  const r = await pg.evaluate(잰다)
  console.log(`\n📜 ${이름}`)
  if (r.오류) { console.log('   ⚠️', r.오류); continue }
  for (const x of r.자국) console.log('   ', JSON.stringify(x))
  console.log('   옮기는 방식 :', JSON.stringify(r.옮기는방식))
  // ⭐ 판정 = 「갈 수 있는 거리」의 최소 80% 는 가야 한다.
  //    붙박이면 0 에 가깝게 나온다(창업자 폰이 그랬다).
  const 몫 = r.갈수있는거리 > 0 ? r.실제간거리 / r.갈수있는거리 : 0
  const ok = 몫 >= 0.8
  if (!ok) 죽음++
  console.log(`   ${ok ? '✅' : '⛔'} 맨 위→맨 아래로 굴렸을 때 막대가 간 거리 = ${r.실제간거리}px / 갈 수 있는 ${r.갈수있는거리}px (${Math.round(몫 * 100)}%)`)
}

console.log('')
if (죽음) {
  console.error(`⛔⛔ ${죽음}개 화면에서 **막대가 스크롤을 안 따라간다.**`)
  console.error('   붙박인 막대는 「덜덜거린다」로 보인다 — 제자리에서 재측정 때마다 몇 px 씩 튀기 때문이다.')
  console.error('   📌 2026-08-14 창업자 영상이 정확히 이것이었다(내용 2,272px ↔ 막대 40px).')
  await b.close(); srv.close(); process.exit(1)
}
console.log('✅ 막대가 스크롤을 끝까지 따라간다 — 붙박이 없음')
await b.close(); srv.close()
