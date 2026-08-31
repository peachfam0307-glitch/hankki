// 🍳 레꾸 상황·평가 99컷 — 서랍에 실제로 떴나 (2026-08-08)
//   ⛔ 검수 절대원칙 ⑤ = **실제 앱 렌더.** 파일이 멀쩡해도 라벨이 안 뜨거나 그림이 깨질 수 있다.
//   글자 탭(notetext)에 rs_ 8그룹 — 라벨은 Stickers.jsx 에서 «읽어서» 확인(베껴 적지 않는다).
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다
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

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

// 라벨·키를 Stickers.jsx 에서 읽는다 — 이름을 바꾸면 검사가 따라온다
const SRC = readFileSync(join(new URL('..', import.meta.url).pathname, 'src/components/Stickers.jsx'), 'utf8')
const GROUPS = [...SRC.matchAll(/\{ key: 'rs_[a-z]+', tab: 'notetext', label: '([^']+)', items: \[([^\]]+)\] \}/g)]
  .map((m) => ({ label: m[1], items: [...m[2].matchAll(/'(rs_[a-z0-9]+)'/g)].map((x) => x[1]) }))
const ALL = GROUPS.flatMap((g) => g.items)
if (GROUPS.length === 8 && ALL.length === 99) ok(`Stickers.jsx 에서 rs_ 8그룹 · 99컷 읽음`)
else no(`Stickers.jsx 에서 읽은 게 ${GROUPS.length}그룹 · ${ALL.length}컷 — 8그룹 99컷이라야 한다`)

const { BASICS_VERSION } = await import('../src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 3 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, { recipes: [], seedV: BASICS_VERSION })
await page.goto('http://127.0.0.1:4353/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

// 레꾸 경로 = 홈 카드 → 상세 → 레시피 꾸미기 (스모크와 같은 길)
await page.locator('.grid-card').first().click(); await page.waitForTimeout(800)
await page.getByRole('button', { name: /레시피 꾸미기/ }).first().click(); await page.waitForTimeout(1200)

// 「레꾸」 칸 → 「글자」 탭
await page.getByRole('button', { name: '레꾸', exact: true }).first().click().catch(() => {})
await page.waitForTimeout(500)
await page.getByRole('button', { name: '글자', exact: true }).first().click(); await page.waitForTimeout(900)

// ① 글자 탭에 8그룹 라벨이 다 보이나
const secLabels = await page.$$eval('.decor-sec-label', (ns) => ns.map((n) => n.textContent.trim()))
for (const g of GROUPS) {
  if (secLabels.includes(g.label)) ok(`글자 탭에 「${g.label}」 있다`)
  else no(`글자 탭에 「${g.label}」 없다 — 실제: ${secLabels.join(' / ')}`)
}

// ② 서랍 이미지 99컷 — 다 뜨고 깨진 것 0인가 (lazy 로드 대비 그룹 라벨까지 스크롤)
const scroller = page.locator('.decor-scroll').first()
for (const g of GROUPS) {
  await page.getByText(g.label, { exact: true }).first().scrollIntoViewIfNeeded().catch(() => {})
  await page.waitForTimeout(250)
}
await page.waitForTimeout(600)
const shot = await page.evaluate((all) => {
  const imgs = [...document.querySelectorAll('img')]
  const missing = [], broken = []
  for (const k of all) {
    const m = imgs.filter((i) => (i.currentSrc || i.src).includes(k))
    if (!m.length) missing.push(k)
    for (const i of m) if (i.complete && i.naturalWidth === 0) broken.push(k)
  }
  return { missing, broken }
}, ALL)
if (!shot.missing.length) ok('서랍에 99컷이 다 있다')
else no(`서랍에 안 뜬 컷 ${shot.missing.length}개 — ${shot.missing.slice(0, 8).join(' ')}`)
if (!shot.broken.length) ok('깨진 그림 0')
else no(`깨진 그림 ${shot.broken.length}개 — ${shot.broken.slice(0, 8).join(' ')}`)

// ③ 서랍 스크린샷 — 글자 탭 맨 위(기존 문구)와 rs_ 구간 두 장
await page.getByText(GROUPS[0].label, { exact: true }).first().scrollIntoViewIfNeeded()
await page.waitForTimeout(400)
await page.screenshot({ path: join(OUT, 'rs-1-서랍-맛평가부터.png') })
await page.getByText(GROUPS[4].label, { exact: true }).first().scrollIntoViewIfNeeded()
await page.waitForTimeout(400)
await page.screenshot({ path: join(OUT, 'rs-2-서랍-식사상황부터.png') })

// ④ 캔버스 판 — 그룹당 1컷씩 8컷을 실제로 붙여 본다 (표시 크기·화질)
const reps = GROUPS.map((g) => g.items[0])
for (const k of reps) {
  const btn = page.locator(`.decor-scroll button[aria-label^="${k}"]`).first()
  if (await btn.count()) {
    await btn.scrollIntoViewIfNeeded(); await btn.click(); await page.waitForTimeout(250)
  } else {
    // aria-label 이 키가 아닐 수 있다 — 이미지 src 로 찾는다
    const img = page.locator(`.decor-scroll img[src*="${k}"]`).first()
    if (await img.count()) { await img.scrollIntoViewIfNeeded(); await img.locator('..').click(); await page.waitForTimeout(250) }
    else no(`서랍에서 ${k} 버튼을 못 찾았다`)
  }
}
await page.waitForTimeout(600)
const onCanvas = await page.evaluate((keys) => {
  const stage = document.querySelector('.decor-stage') || document
  const imgs = [...stage.querySelectorAll('img')]
  return keys.filter((k) => imgs.some((i) => (i.currentSrc || i.src).includes(k))).length
}, reps)
if (onCanvas === reps.length) ok(`판에 대표 ${reps.length}컷이 다 붙었다`)
else no(`판에 붙은 대표 컷 ${onCanvas}/${reps.length}`)
await page.screenshot({ path: join(OUT, 'rs-3-판에올린8컷.png') })

if (!errors.length) ok('pageerror 0')
else no(`pageerror ${errors.length} — ${errors[0]}`)

await b.close(); srv.close()
console.log(bad ? `\n⛔ ${bad}건 어긋남` : '\n✅ 레꾸 상황·평가 99컷 실물 검수 통과')
process.exit(bad ? 1 : 0)
