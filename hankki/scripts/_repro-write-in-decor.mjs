// ✍️ 꾸미기 «안»에서 바로 글쓰기 — 창업자 2026-08-06 제보 재현판
//
//   창업자 원문 = *"속지고르고 꾸미고 저장해야 글을 쓸수있어서 불편한데.. 속지 고른상태에서
//     속지 화면 줄 클릭하면 글쓰고(꾸미기칸자동내려감) 글쓰고 사진넣고 다시 꾸미기버튼 누르면 꾸미고"*
//
// ⭐ 그래서 **옛 코드로 먼저 돌려 진짜 걸리는지** 본다(규칙 12) — 아래 ①이 그 검사다.
//    옛 판에선 꾸미기 안에 글칸이 «아예 없어서» ①이 실패해야 한다.
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다 (2026-08-06)
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
await new Promise((r) => srv.listen(4353, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
const state = {
  recipes: [],
  diary: [{
    id: 'dd', kind: 'diary', at: now,
    paper: { rule: 'lined', skin: 'sage', art: 'today' }, decor: [],
    title: '', note: '', picks: {},
  }],
  seedV: BASICS_VERSION,
}

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 3 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, state)
await page.goto('http://127.0.0.1:4353/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(600)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1000)
await page.getByRole('button', { name: /꾸미기/ }).first().click(); await page.waitForTimeout(900)

// ① 서랍에 칸이 넷인가 — 속지 · 글쓰기 · 일꾸 · 레꾸
//   📔 셋 → 넷 (창업자 2026-08-06 *"버튼이 2개 나오게 … 두가지를 다쓰되"*).
//      「꾸미기」 한 칸을 둘로 쪼갠 것이다 — 속지·글쓰기는 그대로 한 칸씩.
const WANT = '속지|글쓰기|일꾸|레꾸'
const segs = await page.locator('.decor-editor .segment .seg').allInnerTexts()
if (segs.join('|') === WANT) ok(`서랍 칸 넷 (${segs.join(' · ')})`)
else no(`서랍 칸이 「${segs.join(' · ')}」 — 기대: ${WANT.replace(/\|/g, ' · ')}`)

// ② 「꾸미기」 상태에선 글칸이 손가락을 안 먹는다(스티커를 끌어야 하니까)
await page.locator('.decor-editor .segment .seg').last().click(); await page.waitForTimeout(400)
const decorMode = await page.evaluate(() => {
  const ta = document.querySelector('.decor-editor textarea[aria-label="일기 본문"]')
  const lay = document.querySelector('.decor-editor .decor-stage [style*="position: absolute"][style*="inset: 0px"]')
  return { hasTextarea: !!ta, layerTouch: lay ? getComputedStyle(lay).pointerEvents : null }
})
if (!decorMode.hasTextarea) ok('꾸미기 상태 — 종이는 읽기 전용(스티커를 끌 수 있다)')
else no('꾸미기 상태인데 글칸이 살아 있다 — 스티커를 못 끈다')

// ③ ⭐ 창업자가 말한 길 — **종이의 메모칸을 탭하면 글쓰기로**
const box = await page.locator('.decor-editor .paper').first().boundingBox()
// 「오늘의 한끼」 메모칸 = write { top 74.5 · left 13.7 · right 15.4 · bottom 5.5 } → 가운데쯤을 찍는다
await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.85)
await page.waitForTimeout(600)
// ⛔ `nth(1)` 로 재면 안 된다 — 옛 판(두 칸)에선 그 자리가 「꾸미기」라 **거짓으로 통과**한다.
//    실제로 옛 코드로 돌려보고 잡았다(규칙 12). 「글쓰기」라고 «쓰인» 칸이 켜졌나로 본다.
const writeSeg = page.locator('.decor-editor .segment .seg', { hasText: /^글쓰기$/ })
const onWrite = (await writeSeg.count()) ? await writeSeg.first().getAttribute('class') : ''
if ((onWrite || '').includes('on')) ok('메모칸을 탭하니 「글쓰기」로 넘어갔다')
else no('메모칸을 탭했는데 글쓰기로 안 넘어간다')

// ④ 글칸이 «진짜로» 써지나
const ta = page.locator('.decor-editor textarea[aria-label="일기 본문"]')
if (await ta.count()) {
  await ta.fill('꾸미기 안에서 바로 썼다')
  await page.waitForTimeout(700)
  const v = await ta.inputValue()
  if (v === '꾸미기 안에서 바로 썼다') ok('꾸미기를 안 닫고 글이 써진다')
  else no(`글이 안 들어간다 (${v})`)
} else no('글쓰기인데 본문 칸이 없다')

// ⑤ 서랍이 접혔나 — 종이가 커져야 「쓰는 판」으로 읽힌다
const m = await page.evaluate(() => {
  const d = document.querySelector('.decor-drawer'), p = document.querySelector('.decor-editor .paper')
  return { drawer: d?.getBoundingClientRect().height || 0, paper: p?.getBoundingClientRect().height || 0, h: innerHeight }
})
if (m.drawer / m.h < 0.32) ok(`서랍이 접혔다 (${Math.round(m.drawer / m.h * 100)}% · 종이 ${Math.round(m.paper / m.h * 100)}%)`)
else no(`서랍이 아직 ${Math.round(m.drawer / m.h * 100)}% 를 먹는다`)
await page.screenshot({ path: join(OUT, 'write-1-글쓰기.png') })

// ⑥ 「꾸미기」로 돌아가면 서랍이 다시 열리나
await page.locator('.decor-editor .segment .seg').last().click(); await page.waitForTimeout(500)
const back = await page.evaluate(() => document.querySelector('.decor-drawer')?.getBoundingClientRect().height || 0)
if (back / m.h > 0.32) ok(`「꾸미기」로 돌아가니 서랍이 다시 열린다 (${Math.round(back / m.h * 100)}%)`)
else no(`돌아왔는데 서랍이 ${Math.round(back / m.h * 100)}% 뿐이다`)
await page.screenshot({ path: join(OUT, 'write-2-꾸미기로.png') })

// ⑦ 스티커가 다시 잡히나 — 글쓰기가 꾸미기를 망가뜨리면 안 된다
await page.getByRole('button', { name: '데코', exact: true }).first().click(); await page.waitForTimeout(600)
const cells = page.locator('.decor-editor .decor-cell')
if (await cells.count()) {
  await cells.first().click(); await page.waitForTimeout(500)
  const n = await page.evaluate(() => document.querySelectorAll('.decor-editor .decor-stage img').length)
  if (n > 0) ok('꾸미기로 돌아와 스티커가 붙는다'); else no('스티커가 안 붙는다')
} else no('데코 탭에 스티커가 없다')

// ⑧ 저장하면 글도 같이 남나
await page.getByRole('button', { name: '저장', exact: true }).first().click(); await page.waitForTimeout(1000)
const stored = await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const d = (s.diary || []).find((x) => x.kind === 'diary')
  return { note: d?.note || '', decor: (d?.decor || []).length }
})
if (stored.note === '꾸미기 안에서 바로 썼다') ok(`저장에 글이 남았다 (꾸민 것 ${stored.decor}개도 같이)`)
else no(`저장된 글이 「${stored.note}」`)

if (errors.length) errors.forEach((e) => no(`pageerror — ${e}`))
else ok('pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
