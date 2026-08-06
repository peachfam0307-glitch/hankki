// 📄 속지 고르기·편집창·글쓰기 크기 — 창업자 폰 제보 2026-08-07
//
// ⭐⭐ **이 검사가 있는 이유** — 「오늘의 한끼」 속지의 고르기 칸(함께·장소·날씨·기분·시간·만족도)이
//   **만든 날부터 한 번도 안 눌렸다.** 그날 검사는 「찍어서 보기」만 했지 «눌러보지» 않았다.
//   📌 보이는 것과 «되는 것»은 다르다(규칙 18 ⓘ).
//
// ⛔ 지켜야 하는 것 넷:
//   ① **꾸미는 중에도** 고르기 칸이 눌린다 (서랍이 열린 채로)
//   ② 만족도는 **별점처럼 차오른다** — 3을 고르면 1·2·3 이 다 칠해진다
//   ③ 종이 «바깥»을 눌러도 편집 표시창이 사라진다
//   ④ 글쓰기 중 **키보드가 떠도 속지가 안 줄어든다**
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
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
await new Promise((r) => srv.listen(4382, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const state = {
  recipes: [],
  diary: [{
    id: 'dd', kind: 'diary', at: Date.now(),
    paper: { rule: 'write', skin: 'ivory', art: 'today' }, note: '',
    decor: [{ id: 'b1', type: 'sticker', key: 'gp_gomhi', x: 0.5, y: 0.5, s: 0.26, r: 0 }],
  }],
  seedV: BASICS_VERSION,
}

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, state)
await page.goto('http://127.0.0.1:4382/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(600)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1000)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1000)

// ⚠️⚠️ 같은 이름표가 «두 곳»에 있다 — 뒤에 깔린 일기 화면 ＋ 서랍 안 판.
//   ⛔ `.first()` 로 잡으면 서랍(z=220)이 덮은 «뒤 화면» 것을 눌러 아무 일도 안 난다.
//      2026-08-07 에 실제로 그렇게 재다가 「안 고쳐졌다」는 거짓 결과를 냈다(규칙 18 ⓕ).
//   ⭐ 그래서 반드시 `.decor-stage` 안에서 찾는다.
const inStage = (label) => page.locator(`.decor-stage [aria-label="${label}"]`)
const litCount = () => page.evaluate(() => [...document.querySelectorAll('.decor-stage [aria-label^="만족도 "]')]
  .filter((x) => x.getAttribute('aria-pressed') === 'true').length)

// ── ① 꾸미는 중에도 고르기 칸이 «눌린다» ─────────────────
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)
const hit = await page.evaluate(() => {
  const out = []
  for (const label of ['날씨 표시', '기분 표시', '만족도 3']) {
    const el = document.querySelector(`.decor-stage [aria-label="${label}"]`)
    if (!el) { out.push([label, '없음']); continue }
    const r = el.getBoundingClientRect()
    const top = document.elementsFromPoint(r.x + r.width / 2, r.y + r.height / 2)[0]
    out.push([label, top === el ? 'ok' : (top?.tagName || '?') + '[' + (top?.className || '무') + ']'])
  }
  return out
})
for (const [label, got] of hit) {
  if (got === 'ok') ok(`꾸미는 중에도 「${label}」이 눌린다`)
  else no(`「${label}」이 안 눌린다 — ${got} 가 덮고 있다`)
}

// ── ② 만족도는 별점처럼 차오른다 ────────────────────────
const three = inStage('만족도 3')
if (await three.count() === 0) no('「만족도 3」이 서랍 판에 없다')
else {
  await three.first().click(); await page.waitForTimeout(600)
  const n = await litCount()
  if (n === 3) ok(`⭐ 3을 고르니 1·2·3 이 «다» 칠해졌다 (${n}개)`)
  else no(`3을 골랐는데 ${n}개만 칠해졌다 — 별점처럼 차올라야 한다`)
  // 같은 걸 다시 누르면 지워진다(토글)
  await three.first().click(); await page.waitForTimeout(500)
  const off = await litCount()
  if (off === 0) ok('같은 걸 다시 누르니 지워졌다')
  else no(`다시 눌렀는데 ${off}개가 남았다`)
}

// ── ③ 종이 «바깥»을 눌러도 편집 표시창이 사라진다 ────────
const stage = await page.locator('.decor-stage').first().boundingBox()
const editUi = () => page.locator('.decor-stage button[aria-label="스티커 삭제"]').count()
const bear = page.locator('.decor-stage img[src*="gp_gomhi"]').first()
const bb = await bear.boundingBox()
await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.waitForTimeout(500)
if (await editUi() === 1) ok('스티커를 고르니 편집 표시창이 떴다')
else no('스티커를 골랐는데 편집 표시창이 안 뜬다')
await page.mouse.click(stage.x + stage.width * 0.04, stage.y + stage.height * 0.5); await page.waitForTimeout(500)
if (await editUi() === 0) ok('⭐ 종이 «바깥»을 누르니 편집 표시창이 사라졌다')
else no('종이 바깥을 눌렀는데 편집 표시창이 그대로다')

// ── ④ 글쓰기 중 키보드가 떠도 속지가 «안 줄어든다» ───────
await page.getByRole('button', { name: '글쓰기', exact: true }).first().click(); await page.waitForTimeout(900)
const paperH = async () => (await page.locator('.decor-stage [class*="paper"]').first().boundingBox()).height
const h0 = await paperH()
// 📱 폰에서 키보드가 뜨면 «보이는 화면»이 줄어든다 — 뷰포트를 줄여 흉내낸다
await page.setViewportSize({ width: 360, height: 420 }); await page.waitForTimeout(700)
const h1 = await paperH()
const keep = h1 / h0
if (keep > 0.95) ok(`⭐ 키보드가 떠도 속지가 그대로다 (${Math.round(h0)} → ${Math.round(h1)}px)`)
else no(`키보드가 뜨니 속지가 ${Math.round(keep * 100)}% 로 줄었다 (${Math.round(h0)} → ${Math.round(h1)}px) — vh 를 쓰면 이렇게 된다`)
// 줄어든 만큼은 스크롤로 볼 수 있어야 한다
const scrollable = await page.evaluate(() => {
  const el = document.querySelector('.decor-stage.writing')
  return el ? el.scrollHeight > el.clientHeight + 4 : null
})
if (scrollable) ok('넘치는 만큼은 스크롤로 볼 수 있다')
else no('스크롤이 안 된다 — 종이가 화면 밖으로 잘린다')
await page.screenshot({ path: join(OUT, '속지고르기-확인.png') })

if (errors.length) errors.forEach((e) => no(`pageerror — ${e}`))
else ok('pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
