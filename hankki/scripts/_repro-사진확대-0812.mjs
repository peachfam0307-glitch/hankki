// 🔍 틀 사진칸 «두 손가락 확대» — 커지나 · 저장되나 · 남나 · 종이까지 같이 커지진 않나
//
// 📮 창업자 폰 제보 2026-08-12 *"아까 불고기사진처럼 사진 붙이면 위아래로 움직이는데
//    확대 축소는 안되더라. 수정가능해?"*
//
// ⛔ `page.reload()` 금지(옛 함정 사전) — `addInitScript` 가 저장값을 시드로 덮어 «앱이 멀쩡한데 실패»가 난다.
//    다시 켜기는 «새 탭»으로 흉내낸다.
// ⚠️ 두 손가락은 `page.mouse` 로 못 만든다(포인터가 하나다) → PointerEvent 를 직접 쏜다.
//    ⭐ 그래서 «앱이 진짜로 받는 이벤트»(pointerdown/move/up ＋ pointerId 둘)를 그대로 흉내낸다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4398, r))

// 세로로 긴 시험 사진 — 위·중·아래 세 띠라 「어디가 보이나」가 색으로 읽힌다
const tall = 'data:image/svg+xml;base64,' + Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="1200">
  <rect width="400" height="400" fill="#7fb0c8"/><rect y="400" width="400" height="400" fill="#7a9c6e"/>
  <rect y="800" width="400" height="400" fill="#b08a6a"/></svg>`).toString('base64')

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = (() => { const d = new Date(); d.setHours(12, 0, 0, 0); return d.getTime() })()
const entry = {
  id: 'd-zoom', kind: 'diary', at: now,
  paper: { rule: 'plain', skin: 'ivory', art: 'snap' },
  decor: [], title: '확대 시험', note: '', photo: tall,
}

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const ctx = await b.newContext({ viewport: { width: 360, height: 880 } })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  if (!localStorage.getItem('hankki:v1')) localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
}, { recipes: [], diary: [entry], seedV: BASICS_VERSION })
// 🧭 코치는 «이름»이 아니라 «접두어»로 막는다 — 키가 올라가도 이 검사가 안 낡는다(`src/coach.js`)
const { SEED_COACH_SEEN } = await import('../src/coach.js')
await ctx.addInitScript({ content: SEED_COACH_SEEN })

const SEL = 'button[aria-label^="사진"]'
const openDiary = async (pg) => {
  await pg.getByText('일기', { exact: true }).last().click(); await pg.waitForTimeout(600)
  await pg.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click(); await pg.waitForTimeout(1000)
}
// 지금 화면에 그려진 «실제» 배율 — 저장값이 아니라 눈에 보이는 것을 잰다
const zoomOf = (pg) => pg.locator(`${SEL} img`).first().evaluate((i) => {
  const m = new DOMMatrixReadOnly(getComputedStyle(i).transform)
  return Math.round(m.a * 1000) / 1000                       // transform none → a = 1
})
const posOf = (pg) => pg.locator(`${SEL} img`).first().evaluate((i) => getComputedStyle(i).objectPosition)
// ⚠️ 저장 키를 「photoZoom」으로 박지 «않는다» — 속지마다 자기 사진 키를 쓴다(v10.06).
//    「…Zoom 으로 끝나는 칸」을 통째로 훑어야 속지가 바뀌어도 이 검사가 안 깨진다.
const savedOf = (pg) => pg.evaluate(() => {
  const d = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const e = (d.diary || []).find((x) => x.id === 'd-zoom') || {}
  const z = Object.entries(e).filter(([k, v]) => k.endsWith('Zoom') && v)
  const p = Object.entries(e).filter(([k, v]) => k.endsWith('Pos') && v)
  return { zoom: z.length ? Number(z[0][1]) : null, key: z.length ? z[0][0] : '', pos: p.length ? p[0][1] : null }
})

// 🤏 두 손가락 벌리기·오므리기 — 버튼 한가운데를 기준으로 위아래로 `d0` → `d1` 만큼
const 벌리기 = (pg, sel, d0, d1) => pg.evaluate(({ sel, d0, d1 }) => {
  const el = document.querySelector(sel)
  const r = el.getBoundingClientRect()
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2
  const 쏘기 = (type, id, y) => el.dispatchEvent(new PointerEvent(type, {
    bubbles: true, cancelable: true, pointerId: id, pointerType: 'touch',
    clientX: cx, clientY: y, isPrimary: id === 11,
  }))
  쏘기('pointerdown', 11, cy - d0 / 2)
  쏘기('pointerdown', 12, cy + d0 / 2)
  for (let s = 1; s <= 8; s++) {
    const d = d0 + (d1 - d0) * (s / 8)
    쏘기('pointermove', 11, cy - d / 2)
    쏘기('pointermove', 12, cy + d / 2)
  }
  쏘기('pointerup', 11, cy - d1 / 2)
  쏘기('pointerup', 12, cy + d1 / 2)
}, { sel, d0, d1 })

await page.goto('http://127.0.0.1:4398/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1000)
await openDiary(page)

const btn = page.locator(SEL).first()
if (!(await btn.count())) { no('사진 버튼을 못 찾았다'); await b.close(); srv.close(); process.exit(1) }

console.log('\n① 알려주나 · 처음 상태')
const label = await btn.getAttribute('aria-label')
label.includes('확대·축소') ? ok(`이름표가 확대를 알려준다 — 「${label}」`) : no(`이름표에 확대 안내가 없다 — 「${label}」`)
// ⭐ 배율 없이 저장된 옛 사진이 «하나도 안 움직여야» 한다(규칙 18 ⓙ — 이미 깔린 폰)
const z0 = await zoomOf(page)
z0 === 1 ? ok('처음 배율 = 1 (옛 사진 그대로)') : no(`처음부터 배율이 1이 아니다: ${z0}`)

console.log('\n② 벌리면 커지나')
await 벌리기(page, SEL, 60, 120)            // 두 배로 벌린다
await page.waitForTimeout(500)
const z1 = await zoomOf(page)
z1 > 1.5 ? ok(`벌리니 ${z1}배 (이게 창업자가 못 하던 것)`) : no(`벌려도 안 커진다: ${z1}배`)

console.log('\n③ 저장되나 · 남나')
const s1 = await savedOf(page)
s1.zoom > 1.5 ? ok(`저장값 ${s1.key} = ${s1.zoom}`) : no(`확대 배율이 저장 안 됨: ${JSON.stringify(s1)}`)
await page.locator('.bar-btn[aria-label="뒤로"]').first().click(); await page.waitForTimeout(700)
await page.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
const z2 = await zoomOf(page)
Math.abs(z2 - z1) < 0.05 ? ok(`나갔다 들어와도 유지 — ${z2}배`) : no(`나갔다 들어오니 ${z2}배 (전 ${z1})`)
const p2 = await ctx.newPage()
await p2.goto('http://127.0.0.1:4398/hankki/', { waitUntil: 'networkidle' }); await p2.waitForTimeout(900)
await openDiary(p2)
const z3 = await zoomOf(p2)
Math.abs(z3 - z1) < 0.05 ? ok(`앱 껐다 켜도 유지 — ${z3}배`) : no(`앱 껐다 켜니 ${z3}배`)
await p2.close()

console.log('\n④ 확대한 채로도 끌 수 있나')
const before = parseFloat((await posOf(page)).split(' ')[1])
const bb = await btn.boundingBox()
await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.mouse.down()
await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2 + 60, { steps: 10 }); await page.mouse.up()
await page.waitForTimeout(500)
const after = parseFloat((await posOf(page)).split(' ')[1])
after < before - 2 ? ok(`확대 상태에서도 끌린다 — ${before}% → ${after}%`) : no(`확대하면 못 끈다: ${before}% → ${after}%`)
const z4 = await zoomOf(page)
Math.abs(z4 - z1) < 0.05 ? ok('끌어도 배율은 그대로') : no(`끌었더니 배율이 ${z4} 로 바뀜`)

console.log('\n⑤ 오므리면 «사진 전체»가 보이나 (창업자 확정 2026-08-12 — 1 밑을 열었다)')
// ⛔ 옛 잣대(「1에서 멈춘다」)는 죽었다 — 창업자가 «전체가 보이게» 로 정했다. 기준을 바꾼다.
await 벌리기(page, SEL, 160, 20)            // 아주 많이 오므린다
await page.waitForTimeout(500)
const z5 = await zoomOf(page)
const 맞춤 = await page.locator(`${SEL} img`).first().evaluate((i) => getComputedStyle(i).objectFit)
z5 < 1 && z5 >= 0.5 ? ok(`1 밑으로 내려간다 — ${z5}배 (0.5 에서 멈춘다)`) : no(`안 줄어든다: ${z5}`)
맞춤 === 'contain' ? ok('사진 «전체»가 창 안에 들어온다 (잘리지 않는다)') : no(`아직 잘린다: objectFit ${맞춤}`)

console.log('\n⑥ 짧은 탭 = 사진 바꾸기 그대로')
// 🚪 파일창이 열리나 = 숨은 `<input type=file>` 이 click 을 받나
const 탭해보기 = (pg) => pg.evaluate(() => new Promise((res) => {
  const input = document.querySelector('input[type="file"]')
  if (!input) return res('no-input')
  input.addEventListener('click', (e) => { e.preventDefault(); res('clicked') }, { once: true })
  setTimeout(() => res('timeout'), 1200)
  document.querySelector('button[aria-label^="사진"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))
}))
// ⭐⭐ 여기가 재현판의 알맹이 — **벌린 «직후»에** 눌러 본다.
//    두 손가락 뒤엔 click 이 «안 오므로», 손짓 표시가 안 풀리면 이 한 번을 잡아먹는다.
const afterPinch = await 탭해보기(page)
afterPinch === 'clicked' ? ok('두 손가락으로 벌린 «뒤»에도 탭하면 사진 바꾸기가 열린다')
  : no(`벌린 뒤 첫 탭을 잡아먹는다: ${afterPinch} (「한 번 안 먹는다」로 보인다)`)
// 반대쪽 — 끄는 «중»에 따라온 click 은 삼켜야 한다(안 그러면 끌 때마다 파일창이 뜬다)
//   ⚠️ 이건 «진짜» 마우스로 끈다 — 끝나면 브라우저가 click 을 저절로 붙인다. 그 click 이 대상이다.
await page.evaluate(() => {
  window.__filePicked = false
  document.querySelector('input[type="file"]')
    .addEventListener('click', (e) => { e.preventDefault(); window.__filePicked = true }, { once: true })
})
const bb2 = await btn.boundingBox()
await page.mouse.move(bb2.x + bb2.width / 2, bb2.y + bb2.height / 2); await page.mouse.down()
await page.mouse.move(bb2.x + bb2.width / 2, bb2.y + bb2.height / 2 - 50, { steps: 8 }); await page.mouse.up()
await page.waitForTimeout(400)
const 떴나 = await page.evaluate(() => window.__filePicked)
떴나 === false ? ok('끌고 난 뒤 따라온 click 은 삼킨다 (파일창이 안 뜬다)') : no('끌었는데 파일창이 떴다')

console.log('\n⑦ 꾸미기 판 — 사진만 커지고 «종이»는 안 커지나')
// ⛔ 여기가 핵심이다. 꾸미기 판엔 「두 손가락으로 종이 전체 확대」가 이미 있다(v10.17).
//    사진 위에서 벌렸는데 종이까지 같이 커지면 화면이 통째로 튄다.
await page.getByRole('button', { name: /일기 꾸미기|꾸미기/ }).first().click(); await page.waitForTimeout(1200)
const 종이 = page.locator('.decor-stage .paper-box, .decor-stage .paper').first()
const 판사진 = page.locator(`.decor-editor ${SEL}, ${SEL}`).first()
if (!(await 판사진.count())) no('꾸미기 판에서 사진칸을 못 찾았다')
else {
  const w0 = (await 종이.boundingBox())?.width || 0
  const zz0 = await 판사진.locator('img').evaluate((i) => new DOMMatrixReadOnly(getComputedStyle(i).transform).a)
  await 벌리기(page, SEL, 40, 100)
  await page.waitForTimeout(500)
  const w1 = (await 종이.boundingBox())?.width || 0
  const zz1 = await 판사진.locator('img').evaluate((i) => new DOMMatrixReadOnly(getComputedStyle(i).transform).a)
  zz1 > zz0 + 0.2 ? ok(`꾸미기 판에서도 사진이 커진다 — ${Math.round(zz0 * 100) / 100} → ${Math.round(zz1 * 100) / 100}배`)
    : no(`꾸미기 판에선 안 커진다: ${zz0} → ${zz1}`)
  Math.abs(w1 - w0) < 3 ? ok(`종이는 그대로 — ${Math.round(w0)}px`) : no(`종이까지 같이 커졌다: ${Math.round(w0)} → ${Math.round(w1)}px`)
  await page.screenshot({ path: join(OUT, '사진확대-꾸미기판.png') })
}

errors.length ? no(`pageerror: ${errors[0]}`) : ok('pageerror 0')

await b.close(); srv.close()
console.log(bad ? `\n⛔ ${bad}건 어긋남` : '\n✅ 사진 확대 재현 통과')
process.exit(bad ? 1 : 0)
