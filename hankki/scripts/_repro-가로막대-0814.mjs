// ➡️ 「가로 막대」가 자기 줄에 «붙어» 있나 — 세로로 굴릴 때 떨어지나
//
// 📮 창업자 2026-08-14 *"아니 막대가 «가로»라니까 세로막대아니고"*
//    ⛔⛔ 나는 오늘 하루를 **세로 막대**만 보고 고쳤다(v10.68·69·70·71).
//       창업자가 말한 「회색 막대기」는 **가로로 넘치는 줄에 붙는 막대**(`data-hhint`)였다.
//    ⭐ 그러면 *"걔는 고정이어야하는데 스크롤하면 움직이니까"* 가 그대로 읽힌다 —
//       **가로 막대는 «자기 줄»에 딱 붙어 있어야 한다.** 세로로 굴리면 줄과 «함께» 움직여야지
//       줄에서 떨어졌다 붙었다 하면 안 된다.
//
// 🔎 의심 = 가로 막대는 `position: fixed` 이고 자리를 **JS(`paint()`)가 매번 계산**한다
//    (`r.bottom - 3`). 그런데 줄 자체는 **컴포지터가 즉시** 굴린다 →
//    줄은 이미 올라갔는데 막대는 «한 박자 뒤»에 따라온다 = 줄에서 떨어져 보인다 = 덜덜.
//
// ✅ 재는 것 = **세로로 굴린 뒤, 막대가 자기 줄 바닥에서 몇 px 어긋나 있나.**
//    ⛔ 「몇 프레임 늦나」가 아니다 — 늦어도 결국 붙으면 눈엔 «떨림»으로 남는다.
//       그래서 «굴리는 도중»의 어긋남을 본다.
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
await new Promise((r) => srv.listen(4462, r))
const { SEED_COACH_SEEN } = await import('/home/user/hankki/hankki/src/coach.js')

const 잰다 = `(async () => {
  const raf = () => new Promise(r => requestAnimationFrame(() => r()))
  const list = document.querySelectorAll('.app-frame .screen')
  const el = list[list.length - 1]
  if (!el) return { 오류: '화면 없음' }
  const 막대들 = () => [...document.querySelectorAll('[data-hhint]')]
  if (!막대들().length) return { 오류: '가로 막대가 안 그려졌다(가로로 넘치는 줄이 없을 수 있다)' }

  // 가로로 넘치는 줄들 — 앱이 찾는 방식과 «같게»
  const 줄찾기 = () => {
    const out = []
    for (const e of el.querySelectorAll('div, ul, nav')) {
      if (e.scrollWidth <= e.clientWidth + 8) continue
      if (e.hasAttribute('data-hstrip')) continue
      if (!/auto|scroll/.test(getComputedStyle(e).overflowX)) continue
      const r = e.getBoundingClientRect()
      if (r.width < 60 || r.bottom < 4 || r.top > innerHeight - 4) continue
      out.push(e)
    }
    return out
  }

  // 막대 i 는 줄 i 의 «바닥에서 3px 위»에 있어야 한다
  const 어긋남 = () => {
    const 줄 = 줄찾기(), 막 = 막대들()
    const n = Math.min(줄.length, 막.length)
    let 최대 = 0
    for (let i = 0; i < n; i++) {
      const a = 줄[i].getBoundingClientRect(), b = 막[i].getBoundingClientRect()
      최대 = Math.max(최대, Math.abs(b.top - (a.bottom - 3)))
    }
    return { 최대: Math.round(최대), 줄: 줄.length, 막대: 막.length }
  }

  // ⚠️ 붙이는 방식은 «굴리기 전»에 읽는다 — 굴린 뒤엔 막대가 다시 그려져 사라졌을 수 있다
  //    (그대로 뒀다가 getComputedStyle(undefined) 로 죽었다)
  const 붙이는방식 = getComputedStyle(막대들()[0]).position

  const 결과 = []
  // ⭐ 「굴린 «그 순간»」과 「1프레임 뒤」를 본다 — 눈에 보이는 떨림은 그 사이에 산다
  for (const 목표 of [60, 140, 220, 300, 380]) {
    el.scrollTop = 목표
    const t0 = 어긋남()
    await raf()
    const t1 = 어긋남()
    await raf(); await raf()
    const t끝 = 어긋남()
    결과.push({ 굴린곳: 목표, 같은순간: t0.최대, '1프레임뒤': t1.최대, '3프레임뒤': t끝.최대, 줄: t0.줄, 막대: t0.막대 })
  }
  return { 결과, 붙이는방식 }
})()`

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul' })
await ctx.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1'); localStorage.setItem('hankki:giftSheetSeen', '1') })
await ctx.addInitScript({ content: SEED_COACH_SEEN })
const pg = await ctx.newPage()
await pg.goto('http://127.0.0.1:4462/hankki/', { waitUntil: 'networkidle' }); await pg.waitForTimeout(900)
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
  console.log(`\n➡️ ${이름}`)
  if (r.오류) { console.log('   ⚠️', r.오류); continue }
  for (const x of r.결과) console.log('   ', JSON.stringify(x))
  console.log('   붙이는 방식 :', r.붙이는방식)
  // ⭐ 판정 = 굴린 «그 순간»에도 자기 줄에 붙어 있어야 한다.
  //    JS 가 쫓아다니면 여기서 수십 px 이 뜬다 — 그게 눈엔 「줄에서 떨어졌다 붙었다」로 보인다.
  const 나쁨 = r.결과.filter((x) => x.같은순간 > 2).length
  if (나쁨) 죽음++
  console.log(나쁨
    ? `   ⛔ ${나쁨}/${r.결과.length} 번은 굴린 «그 순간» 막대가 자기 줄에서 떨어졌다 (최대 ${Math.max(...r.결과.map((x) => x.같은순간))}px)`
    : `   ✅ 굴려도 막대가 자기 줄에 붙어 있다`)
}

console.log('')
if (죽음) {
  console.error(`⛔⛔ ${죽음}개 화면에서 **가로 막대가 세로 스크롤 때 자기 줄에서 떨어진다.**`)
  console.error('   📌 창업자 2026-08-14 *"걔는 고정이어야하는데 스크롤하면 움직이니까"* 가 이것이다.')
  console.error('   ✅ 고치는 길 = 막대를 «그 줄과 같은 상자»에 넣어 브라우저가 함께 옮기게 한다(JS 0).')
  await b.close(); srv.close(); process.exit(1)
}
console.log('✅ 가로 막대가 자기 줄에 붙어 있다')
await b.close(); srv.close()
