// 🎬🍂 **릴스 본편 — 「차돌짬뽕을 가을 프레임으로 꾸미는 과정」을 프레임으로 찍는다** (2026-09-03)
//
// 📮 창업자 = *"영상은 네가 찍되 (내가 꾸민거랑 똑같이 네가찍어서 편집해줘) 내가 영상을 찍으면 진짜 오래걸리거든?"*
//    ＋ *"레시피고, 프레임은 목도리 타원이야."*  ＋ *"찍으면 검수할게"*
//
// ⛔⛔ **영상 «녹화»(recordVideo)를 쓰지 않는다 — 실측으로 버렸다(2026-09-03)**
//    Playwright 녹화는 뷰포트(540×960)를 1080×1920 캔버스에 «키우지 않고» 그대로 얹는다
//    → 화면이 왼쪽 위에 «작게 박히고» 나머지가 회색. 프레임을 뽑아 «열어서» 확인했다(절대원칙 21).
//    ✅ 대신 프레임을 한 장씩 캡처한다 — `deviceScaleFactor 2` 가 살아 **진짜 1080×1920**.
//       9/1 릴스의 목업 대화방(237프레임)이 쓴 바로 그 방식이고,
//       그때 창업자가 짚은 *"네가준거는 살짝 뿌얘"* 를 처음부터 피한다.
//
// ⭐ 살아 있는 앱을 띄운다 — 흉내가 아니다(절대원칙 30).
// ⛔ 브라우저 경로를 판에 박지 않는다 — `SMOKE_CHROMIUM` 만 읽는다(v10.90 사고)
//
// 쓰는 법 = node scripts/_shot-릴스꾸미기-0903.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = process.env.OUT || '/tmp/hankki-릴스꾸미기'
rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p = await ctx.newPage()

let n = 0
const 찍기 = async (이름) => {
  n++
  await p.screenshot({ path: join(OUT, `${String(n).padStart(3, '0')}-${이름}.png`) })
}
const 시트닫기 = async () => {
  for (let i = 0; i < 5; i++) {
    const 닫았나 = await p.evaluate(() => {
      const b = [...document.querySelectorAll('button, [role="button"]')]
        .filter((x) => x.getBoundingClientRect().height > 8)
        .find((x) => /^(나중에 볼게요|닫기)$/.test((x.innerText || '').trim()))
      if (!b) return false; b.click(); return true
    })
    if (닫았나) { await p.waitForTimeout(450); continue }
    if (!(await p.locator('.sheet-mask').count())) break
    await p.keyboard.press('Escape'); await p.waitForTimeout(300)
  }
}
// 탭(배경·프레임·마테·데코·글자·친구들)을 이름으로 누른다
const 탭누르기 = async (이름) => p.evaluate((t) => {
  const b = [...document.querySelectorAll('button, [role="button"]')]
    .find((x) => (x.innerText || '').trim() === t)
  if (!b) return false; b.click(); return true
}, 이름)

// 서랍에서 «묶음 이름표»를 찾아 화면에 오게 굴린다
const 묶음으로 = async (이름) => p.evaluate((t) => {
  const 납작 = (s) => String(s || '').replace(/\s+/g, '')
  const 타깃 = 납작(t)
  const e = [...document.querySelectorAll('div, span, h2, h3, p, button')]
    .filter((x) => x.getBoundingClientRect().height > 6)
    .find((x) => 납작(x.innerText) === 타깃)
  if (!e) return false
  e.scrollIntoView({ block: 'center' })
  return true
}, 이름)

// 🔑🔑 **자산 «열쇠»로 고른다 — 이름표 아래 순서로 고르지 않는다.**
//
// ⛔⛔ 2026-09-03 사고: 「가을 프레임」 머리 «아래 첫 칸」을 눌렀더니
//    **초록 몬스테라(출시기념 여름)** 가 붙었다. 서랍이 굴러가면 머리와 칸의 위아래가
//    내가 본 캡처와 달라져서, 「아래에 있는 첫 번째」가 다른 묶음 것이 된다.
//    📮 창업자도 그 자리에서 바로 짚었다 = *"저 프레임 아니야 ㅠㅠ 가을프레임"*
//    ⭐ 그림을 «열어봐서» 잡았다(절대원칙 21) — 숫자만 봤으면 「✅붙임」으로 끝났을 것이다.
//
// ✅ 열쇠(`pf_au01`)는 번들에서도 파일 이름에 그대로 남는다(`pf_au01-CrFirxBT.png` · 실측).
//    자리가 어떻게 굴러가도 «그 그림»을 정확히 집는다.
const 열쇠로누르기 = async (열쇠) => p.evaluate((k) => {
  const 후보 = [...document.querySelectorAll('button, [role="button"]')]
    .map((e) => ({ e, img: e.querySelector('img'), r: e.getBoundingClientRect() }))
    .filter((x) => x.img && x.r.width > 30 && x.r.height > 30)
    .filter((x) => new RegExp(`/${k}[-.]`).test(x.img.currentSrc || x.img.src || ''))
  if (!후보.length) return null
  const 고른것 = 후보[0]
  고른것.e.scrollIntoView({ block: 'center' })
  고른것.e.click()
  return { 폭: Math.round(고른것.r.width), 주소: (고른것.img.currentSrc || 고른것.img.src).split('/').pop() }
}, 열쇠)

// 🔍 지금 «판»에 무엇이 얹혀 있나 — 붙인 게 맞는지 그림 주소로 확인한다(⛔말로 믿지 않는다)
const 판위에 = async () => p.evaluate(() => {
  const 무대 = document.querySelector('.decor-stage, .stage, [class*="stage"]') || document.body
  return [...무대.querySelectorAll('img')]
    .map((i) => (i.currentSrc || i.src || '').split('/').pop())
    .filter((s) => s && !/^data:/.test(s))
    .slice(0, 12)
})

console.log('\n🎬 릴스 본편 — 차돌짬뽕 레꾸 찍기\n')

await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(2200); await 시트닫기()
await 찍기('홈')

// ① 레시피 탭 → 차돌짬뽕
await p.locator('.nav-item', { hasText: '레시피' }).first().click()
await p.waitForTimeout(1300); await 시트닫기()
await 찍기('목록')

const 연것 = await p.evaluate(() => {
  const 납작 = (s) => String(s || '').replace(/\s+/g, '')
  const c = [...document.querySelectorAll('button, a, [role="button"], li, article')]
    .map((e) => ({ e, t: 납작(e.innerText), r: e.getBoundingClientRect() }))
    .filter((x) => x.t.includes('차돌짬뽕') && x.r.width > 60 && x.r.height > 60)
  c.sort((a, z) => a.r.width * a.r.height - z.r.width * z.r.height)
  if (!c[0]) return null
  c[0].e.click(); return true
})
await p.waitForTimeout(1500); await 시트닫기()
await 찍기('상세')

// ② 레시피 꾸미기
for (let i = 0; i < 3; i++) {
  const ok = await p.evaluate(() => {
    const b2 = [...document.querySelectorAll('button, [role="button"]')]
      .filter((x) => x.getBoundingClientRect().height > 8)
      .find((x) => /^(꾸미기|레시피 꾸미기)$/.test((x.innerText || '').trim()))
    if (!b2) return false; b2.click(); return true
  })
  if (!ok) break
  await p.waitForTimeout(1200)
}
await 시트닫기(); await p.waitForTimeout(600)
await 찍기('레꾸-빈판')

// ③ 🍂 프레임 탭 → 가을 프레임 → 첫 칸(목도리 타원)
const 결과 = {}
결과.프레임탭 = await 탭누르기('프레임')
await p.waitForTimeout(900)
결과.가을묶음 = await 묶음으로('가을 프레임')
await p.waitForTimeout(600)
await 찍기('프레임-가을묶음')

// 🍂 목도리 타원 = `pf_au01` (창업자 = *"프레임은 목도리 타원이야"*)
결과.붙인것 = await 열쇠로누르기('pf_au01')
await p.waitForTimeout(1200)
await 찍기('프레임-붙임')
결과.판위 = await 판위에()

console.log(`   프레임 탭 ${결과.프레임탭 ? '✅' : '⛔'} · 가을 묶음 ${결과.가을묶음 ? '✅' : '⛔'}`)
console.log(`   누른 그림 = ${결과.붙인것 ? 결과.붙인것.주소 : '⛔ pf_au01 을 못 찾았다'}`)
// 🔒 「붙였다」를 말로 믿지 않는다 — 판 위에 그 그림이 «있나»를 본다
const 맞나 = (결과.판위 || []).some((s) => /^pf_au01[-.]/.test(s))
console.log(`   판 위 그림 = ${(결과.판위 || []).join(' · ') || '(없음)'}`)
console.log(`   ${맞나 ? '✅ 목도리 타원이 판에 얹혔다' : '⛔ 판에 pf_au01 이 없다 — 다른 게 붙었거나 안 붙었다'}`)
console.log(`\n   📁 ${OUT}  (${n}장)\n`)


// ── ⑤ 📏 프레임 크기 맞추기 — 손잡이를 «실제로 끈다»
//    ⭐ 끄는 장면 자체가 릴스에 쓸 만하다(유저가 하는 그 동작이다).
//    ⛔ 상태(`s`)를 코드로 찔러 넣지 않는다 — 앱이 하는 일과 달라지면 릴스가 «거짓»이 된다(절대원칙 30).
const 프레임재기 = async () => p.evaluate(() => {
  const img = [...document.querySelectorAll('img')]
    .find((i) => /\/pf_au01[-.]/.test(i.currentSrc || i.src || ''))
  if (!img) return null
  const r = img.getBoundingClientRect()
  return { w: Math.round(r.width), h: Math.round(r.height), cx: Math.round(r.x + r.width / 2), cy: Math.round(r.y + r.height / 2), x2: Math.round(r.right), y2: Math.round(r.bottom) }
})

const 전 = await 프레임재기()
console.log(`   프레임 크기(전) = ${전 ? `${전.w}×${전.h}` : '⛔ 못 잼'}`)

if (전) {
  // ↻ 손잡이 = 고른 상자의 «오른아래». 상자는 그림보다 살짝 크다 → 그림 오른아래에서 조금 바깥.
  const hx = 전.x2 - 2
  const hy = 전.y2 - 2
  // 가운데 쪽으로 18% 끌어 줄인다
  const tx = Math.round(전.cx + (hx - 전.cx) * 0.82)
  const ty = Math.round(전.cy + (hy - 전.cy) * 0.82)
  await p.mouse.move(hx, hy)
  await p.mouse.down()
  // ⭐ 여러 걸음으로 나눠 끈다 — 한 번에 뛰면 앱이 «끌기»로 안 읽는 수가 있다
  for (let k = 1; k <= 8; k++) {
    await p.mouse.move(hx + (tx - hx) * k / 8, hy + (ty - hy) * k / 8)
    await p.waitForTimeout(60)
  }
  await p.mouse.up()
  await p.waitForTimeout(700)
  await 찍기('프레임-크기맞춤')
  const 후 = await 프레임재기()
  console.log(`   프레임 크기(후) = ${후 ? `${후.w}×${후.h}` : '⛔ 못 잼'}`)
  console.log(`   ${후 && 후.w < 전.w ? `✅ 줄었다 (${전.w} → ${후.w})` : '⛔ 안 줄었다 — 손잡이 자리를 다시 봐야 한다'}`)
}

await ctx.close(); await b.close(); srv.close()
