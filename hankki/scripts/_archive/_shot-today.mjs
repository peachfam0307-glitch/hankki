// 🍚 「오늘의 한끼」 속지 실물 — 창업자 판정용 (2026-08-06)
//   좌표가 «그림의 칸»에 정확히 앉았나를 눈으로 본다. 숫자로 통과해도 반 픽셀씩 어긋나면 티가 난다.
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
await new Promise((r) => srv.listen(4350, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
const state = {
  recipes: [],
  diary: [{
    id: 'dd', kind: 'diary', at: now,
    paper: { rule: 'lined', skin: 'ivory', art: 'today' }, decor: [],
    title: '엄마 김치찌개', note: '들기름 조금 더 넣으니 훨씬 고소했다. 다음엔 두부를 반 모 더.',
    picks: { who: 'on', sky: 'on', score: '4' },
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
await page.goto('http://127.0.0.1:4350/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(700)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(700)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1100)

// ⭐ 칸이 다 그려졌나 — 하나라도 빠지면 그 자리가 죽은 칸이 된다
const has = async (label, n = 1) => {
  const c = await page.getByLabel(label).count()
  if (c === n) ok(`「${label}」 칸이 있다`)
  else no(`「${label}」 칸이 ${c}개 (기대 ${n})`)
}
await has('제목'); await has('일기 본문')
for (const [ax, cnt] of [['함께 표시', 1], ['장소 표시', 1], ['날씨 표시', 1], ['기분 표시', 1], ['시간 표시', 1]]) {
  const c = await page.getByRole('button', { name: ax, exact: true }).count()
  if (c === cnt) ok(`「${ax}」 버튼이 있다`); else no(`「${ax}」 버튼 ${c}개`)
}
const dots = await page.getByRole('button', { name: /^만족도 [1-5]$/ }).count()
if (dots === 5) ok('만족도 점 다섯을 고를 수 있다'); else no(`만족도 점이 ${dots}개 (기대 5)`)
// 사진칸
const shot = await page.getByRole('button', { name: /^사진 (넣기|바꾸기)$/ }).count()
if (shot === 1) ok('사진칸이 있다'); else no(`사진칸 ${shot}개`)
// ⭐ 줄이 «메모칸 안에만» 있나 — 종이 전체에 그어지면 사진칸까지 줄이 간다(창업자 질문)
const paperCls = await page.locator('.paper').first().getAttribute('class')
if (!/\blined\b|\bgrid\b|\bdots\b/.test(paperCls || '')) ok(`종이 전체엔 줄이 없다 (${paperCls})`)
else no(`종이 전체에 줄이 그어졌다 — 사진칸에도 줄이 간다 (${paperCls})`)

await page.screenshot({ path: join(OUT, 'today-1-일기화면.png') })
const box = await page.locator('.paper').first().boundingBox()
await page.screenshot({ path: join(OUT, 'today-2-종이만.png'), clip: box })

if (errors.length) errors.forEach((e) => no(`pageerror — ${e}`))
else ok('pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
