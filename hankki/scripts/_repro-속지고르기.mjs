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
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
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

// ── ①-B 📷 「속지」 탭에서 «틀의 사진칸»이 눌린다 ────────
//   ⭐ 창업자 제보 *"사진은 일꾸 글쓰기는 글쓰기 각탭에서 수정해야해서 번거로움"* →
//      **고르는 일(축·사진)을 「속지」 탭 한 곳에** 모았다. 전엔 사진칸이 «글쓰기» 탭에서만 눌렸다.
//   ⚠️ 일꾸 탭에선 안 눌리는 게 «맞다» — 거기선 스티커 판이 종이를 덮어야 스티커를 끌 수 있다.
//      (축은 zIndex 1 이라 위에 있고, 사진칸은 «틀 선이 사진 위에 그려져 창이 되도록» 일부러 아래에 둔다)
await page.getByRole('button', { name: '속지', exact: true }).first().click(); await page.waitForTimeout(900)
const shot = await page.evaluate(() => {
  const el = document.querySelector('.decor-stage [aria-label="사진 넣기"], .decor-stage [aria-label="사진 바꾸기"]')
  if (!el) return '없음'
  const r = el.getBoundingClientRect()
  const top = document.elementsFromPoint(r.x + r.width / 2, r.y + r.height / 2)[0]
  return top === el ? 'ok' : (top?.tagName || '?') + '[' + (top?.className || '무') + ']'
})
if (shot === 'ok') ok('⭐ 「속지」 탭에서 틀의 사진칸이 눌린다 — 탭을 옮겨다닐 일이 없다')
else no(`「속지」 탭인데 사진칸이 안 눌린다 — ${shot} 가 덮고 있다`)
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)

// ── ② 만족도는 별점처럼 차오른다 ────────────────────────
const three = inStage('만족도 3')
if (await three.count() === 0) no('「만족도 3」이 서랍 판에 없다')
else {
  await three.first().click(); await page.waitForTimeout(600)
  const n = await litCount()
  if (n === 3) ok(`⭐ 3을 고르니 1·2·3 이 «다» 칠해졌다 (${n}개)`)
  else no(`3을 골랐는데 ${n}개만 칠해졌다 — 별점처럼 차올라야 한다`)
  // ⚠️⚠️ **`aria-pressed` 만 보면 거짓 통과한다** — 상태는 켜졌는데 «화면에 안 보일» 수 있다.
  //   2026-08-07 에 실제로 그랬다: 만족도 점이 초록 원＋베이지 마테 위라 형광펜이 묻혀
  //   검사는 「3개 칠해짐」이라 했는데 캡처를 3배로 키워야 겨우 보였다(칠한 것 51 vs 안 칠한 것 34).
  //   ⭐ 그래서 **화면 픽셀로** 잰다 — 칠한 점과 안 칠한 점의 «노랑기» 차이.
  const dots = await page.evaluate(() => [...document.querySelectorAll('.decor-stage [aria-label^="만족도 "]')]
    .map((d) => { const r = d.getBoundingClientRect(); return { on: d.getAttribute('aria-pressed') === 'true', x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width } }))
  if (dots.length < 5) no('만족도 점 다섯을 못 찾았다')
  else {
    const yellow = async (d) => {
      const s = Math.max(6, Math.round(d.w * 0.5))
      const png = await page.screenshot({ clip: { x: d.x - s / 2, y: d.y - s / 2, width: s, height: s } })
      const f = join(OUT, '_dot.png'); writeFileSync(f, png)
      return Number(execFileSync('python3', ['-c', `
from PIL import Image
import numpy as np, sys
a = np.asarray(Image.open(sys.argv[1]).convert('RGB'), dtype=float).reshape(-1, 3).mean(0)
print(round((a[0] + a[1]) / 2 - a[2], 1))
`, f]).toString().trim())
    }
    const lit = await yellow(dots[1])   // 칠해진 것(2번)
    const dark = await yellow(dots[4])  // 안 칠해진 것(5번)
    const gap = lit - dark
    if (gap > 40) ok(`⭐ 칠한 점이 «눈에 띈다» — 노랑기 ${lit} vs ${dark} (차이 ${Math.round(gap)})`)
    else no(`칠했는데 티가 안 난다 — 노랑기 ${lit} vs ${dark} (차이 ${Math.round(gap)}) · 40 은 넘어야 보인다`)
  }
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

// ── ⑤ 📷 사진 스티커는 «안 잘린다» — 원본 비율 그대로 ─────
//   창업자 폰 제보 *"무지 내사진넣기에서 크롭기능있으면"*
//   ⛔ 전엔 무조건 정사각(`cropSquare`)이라 세로 사진의 위아래가 잘려 나갔고 되찾을 길이 없었다.
//   ⭐ 세로로 긴 그림(1:3)을 넣어 «비율이 살아 있나»를 잰다.
await page.setViewportSize({ width: 360, height: 880 }); await page.waitForTimeout(500)
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)
const TW = 300, TH = 900
const b64 = await page.evaluate(([w, h]) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const x = c.getContext('2d'); x.fillStyle = '#cc8866'; x.fillRect(0, 0, w, h)
  return c.toDataURL('image/png').split(',')[1]
}, [TW, TH])
const fileInput = page.locator('.decor-drawer input[type=file]').first()
if (await fileInput.count() === 0) no('서랍에 사진 고르는 칸이 없다')
else {
  await fileInput.setInputFiles({ name: 'tall.png', mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') })
  await page.waitForTimeout(1600)
  const box = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('.decor-stage img')].filter((i) => (i.currentSrc || i.src).startsWith('data:'))
    const el = imgs[imgs.length - 1]
    if (!el) return null
    const p = el.closest('[style*="translate(-50%"]') || el.parentElement
    const r = p.getBoundingClientRect()
    return { w: r.width, h: r.height }
  })
  if (!box) no('붙인 사진을 판에서 못 찾았다')
  else {
    const got = box.w / box.h
    const want = TW / TH
    if (Math.abs(got - want) < 0.08) ok(`⭐ 세로 사진이 «안 잘렸다» — 판 위 비율 ${got.toFixed(2)} (원본 ${want.toFixed(2)})`)
    else no(`사진이 잘렸다 — 판 위 ${got.toFixed(2)} vs 원본 ${want.toFixed(2)} (정사각이면 1.00)`)
  }
}

if (errors.length) errors.forEach((e) => no(`pageerror — ${e}`))
else ok('pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
