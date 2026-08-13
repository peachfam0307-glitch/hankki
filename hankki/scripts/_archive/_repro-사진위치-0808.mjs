// 🫳 사진 위치 조정 — 끌면 «바뀌고 · 저장되고 · 남는가» (창업자 2026-08-08 "사진 위치조정이 안되네")
//
// ⛔⛔ **`page.reload()` 로는 못 잰다** — `addInitScript` 가 되돌아올 때마다 처음 상태를 다시 심어
//    **저장값을 «검사가» 지운다.** 그러면 앱이 멀쩡한데 「안 남는다」로 나온다.
//    2026-08-06 에 `_shot-diary.mjs` 에서 이미 속아 경고까지 적어뒀는데 2026-08-08 에 또 밟았다.
//    ✅ 가른 방법 = probe 로 「reload 후 localStorage 가 시드로 돌아오는지」를 직접 재봤다(돌아왔다).
//    ⭐ 대신 ⑴«뒤로 갔다 다시 들어오기»(유저가 실제로 하는 행동) ⑵«새 탭»(앱 껐다 켜기)로 잰다.
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
await new Promise((r) => srv.listen(4356, r))

// 세로로 «긴» 시험 사진 — 위(하늘)·가운데(초록)·아래(갈색) 세 띠라 «어디가 보이는지»가 색으로 읽힌다
const tall = 'data:image/svg+xml;base64,' + Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="1200">
  <rect width="400" height="400" fill="#7fb0c8"/><rect y="400" width="400" height="400" fill="#7a9c6e"/>
  <rect y="800" width="400" height="400" fill="#b08a6a"/>
  <text x="200" y="215" font-size="90" text-anchor="middle" fill="#fff">위</text>
  <text x="200" y="615" font-size="90" text-anchor="middle" fill="#fff">중</text>
  <text x="200" y="1015" font-size="90" text-anchor="middle" fill="#fff">아래</text></svg>`).toString('base64')

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = (() => { const d = new Date(); d.setHours(12, 0, 0, 0); return d.getTime() })()
const entry = {
  id: 'd-pos', kind: 'diary', at: now,
  paper: { rule: 'plain', skin: 'ivory', art: 'snap' },
  decor: [], title: '위치 조정 시험', note: '', photo: tall,
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
  // ⚠️ 이미 저장된 게 있으면 «안 덮는다» — 새 탭(앱 껐다 켜기)에서도 저장값이 살아 있어야 한다
  if (!localStorage.getItem('hankki:v1')) localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, { recipes: [], diary: [entry], seedV: BASICS_VERSION })

const openDiary = async (pg) => {
  await pg.getByText('일기', { exact: true }).last().click(); await pg.waitForTimeout(600)
  await pg.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click(); await pg.waitForTimeout(1000)
}
const SEL = 'button[aria-label^="사진"]'
const posOf = (pg) => pg.locator(`${SEL} img`).first().evaluate((i) => getComputedStyle(i).objectPosition)

await page.goto('http://127.0.0.1:4356/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1000)
await openDiary(page)

const btn = page.locator(SEL).first()
if (!(await btn.count())) { no('사진 버튼을 못 찾았다'); await b.close(); srv.close(); process.exit(1) }

// ① 끌 수 있다고 «말해주나» — 이름표에 안 적히면 아무도 못 찾는다
const label = await btn.getAttribute('aria-label')
if (/끌어서/.test(label)) ok(`이름표가 끌기를 알려준다 — 「${label}」`)
else no(`이름표에 끌기 안내가 없다 — 「${label}」`)

// ② 처음 = 가운데(옛 일기 호환 — 위치값 없이 저장된 사진이 그대로 보여야 한다)
const p0 = await posOf(page)
if (p0.includes('50%')) ok(`처음 위치 = ${p0} (가운데 · 옛 일기 그대로)`)
else no(`처음 위치가 가운데가 아니다: ${p0}`)

// ③ 아래로 끌면 사진의 «위»가 보인다 (objectPosition y 감소)
const bb = await btn.boundingBox()
const cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2
await page.mouse.move(cx, cy); await page.mouse.down()
await page.mouse.move(cx, cy + 70, { steps: 10 }); await page.mouse.up()
await page.waitForTimeout(600)
const p1 = await posOf(page)
const y1 = parseFloat(p1.split(' ')[1])
if (y1 < 45) ok(`아래로 끌자 위쪽이 보인다 — ${p1}`)
else no(`끌어도 위치가 안 변한다: ${p1} (이게 창업자가 본 증상이다)`)

// ④ 저장됐나
const savedPos = await page.evaluate(() => {
  const d = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  return (d.diary || []).find((x) => x.id === 'd-pos')?.photoPos || ''
})
if (savedPos && parseFloat(savedPos.split(' ')[1]) < 45) ok(`저장값 photoPos = ${savedPos}`)
else no(`photoPos 가 저장 안 됨: 「${savedPos}」`)

// ⑤ 나갔다 들어와도 그대로인가 (⛔reload 금지 — 맨 위 주석 참고)
await page.locator('.bar-btn[aria-label="뒤로"]').first().click(); await page.waitForTimeout(700)
await page.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
const p2 = await posOf(page)
if (Math.abs(parseFloat(p2.split(' ')[1]) - y1) < 3) ok(`나갔다 들어와도 유지 — ${p2}`)
else no(`나갔다 들어오니 달라짐: ${p2} (전 ${p1})`)
await page.screenshot({ path: join(OUT, '사진위치-끌고난뒤.png'), clip: await page.locator('.paper').first().boundingBox() })

// ⑥ 앱을 껐다 켠 판 — 같은 저장소를 쓰는 새 탭
const page2 = await ctx.newPage()
await page2.goto('http://127.0.0.1:4356/hankki/', { waitUntil: 'networkidle' }); await page2.waitForTimeout(900)
await openDiary(page2)
const p3 = await posOf(page2)
if (Math.abs(parseFloat(p3.split(' ')[1]) - y1) < 3) ok(`앱 껐다 켜도 유지 — ${p3}`)
else no(`앱 껐다 켜니 달라짐: ${p3} (전 ${p1})`)
await page2.close()

// ⑦ 짧은 탭 = 여전히 「사진 바꾸기」 (드래그가 탭을 잡아먹으면 안 된다)
const clicked = await page.evaluate(() => new Promise((res) => {
  const input = document.querySelector('input[type="file"]')
  if (!input) return res('no-input')
  input.addEventListener('click', (e) => { e.preventDefault(); res('clicked') }, { once: true })
  setTimeout(() => res('timeout'), 2500)
  document.querySelector('button[aria-label^="사진"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))
}))
if (clicked === 'clicked') ok('짧은 탭 = 사진 바꾸기 그대로')
else no(`짧은 탭이 파일창을 안 연다: ${clicked}`)

if (!errors.length) ok('pageerror 0')
else no(`pageerror: ${errors[0]}`)

await b.close(); srv.close()
console.log(bad ? `\n⛔ ${bad}건 어긋남` : '\n✅ 사진 위치 조정 재현 통과')
process.exit(bad ? 1 : 0)
