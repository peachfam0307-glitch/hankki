// 🍚 「오늘의 한끼」 낱개 24 — 서랍에 실제로 떴나 (2026-08-06)
//   ⛔ 검수 절대원칙 ⑤ = **실제 앱 렌더.** 파일이 멀쩡해도 라벨이 안 뜨거나 그림이 깨질 수 있다.
//   ⚠️ 서랍(56px)은 작게 보여 멀쩡해 보인다 → 캔버스에 올린 판도 같이 찍는다.
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
await new Promise((r) => srv.listen(4352, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const KEYS = [...Array(21)].map((_, i) => `dc_td${String(i + 1).padStart(2, '0')}`)
const TAPES = ['wt_td01', 'wt_td02', 'wt_td03']
const now = Date.now()
// ⭐ 24컷을 «캔버스에 다 올려» 둔다 — 그려지는 크기·화질을 눈으로 본다
// ⚠️ 마테 «그림»(`wt_*`)도 type 은 **'sticker'** 다 — 서랍의 「마테」 탭은 CSS 띠(`TAPE_PATTERNS`)와
//    그림 스티커를 «같은 탭에 놓을» 뿐이고, 그림 쪽은 보통 스티커로 붙는다.
//    ⛔ 처음에 `type:'tape'` 로 넣었더니 「판에 안 뜬다」고 나왔다 — **검사가 틀렸던 것**이다(규칙 18).
const decor = [...KEYS, ...TAPES].map((key, i) => ({
  id: `t${i}`, type: 'sticker', key,
  x: 0.13 + (i % 5) * 0.185, y: 0.1 + Math.floor(i / 5) * 0.155,
  s: TAPES.includes(key) ? 0.34 : 0.15, r: 0,
}))
const state = {
  recipes: [],
  diary: [{ id: 'dd', kind: 'diary', at: now, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor, note: '' }],
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
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, state)
await page.goto('http://127.0.0.1:4352/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(600)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1200)

// ① 캔버스 — 24컷이 다 그려졌나 + 깨진 그림 0
const shot = await page.evaluate((all) => {
  const imgs = [...document.querySelectorAll('img')]
  const hit = {}, broken = []
  for (const k of all) {
    const m = imgs.filter((i) => i.currentSrc.includes(k) || i.src.includes(k))
    hit[k] = m.length
    for (const i of m) if (i.complete && i.naturalWidth === 0) broken.push(k)
  }
  return { hit, broken }
}, [...KEYS, ...TAPES])
const missing = Object.entries(shot.hit).filter(([, n]) => n === 0).map(([k]) => k)
if (!missing.length) ok(`24컷이 판에 다 그려졌다`)
else no(`판에 안 뜬 컷 ${missing.length}개 — ${missing.join(' ')}`)
if (!shot.broken.length) ok('깨진 그림 0')
else no(`깨진 그림 ${shot.broken.length}개 — ${shot.broken.join(' ')}`)
await page.screenshot({ path: join(OUT, 'td-1-판에올린24컷.png'), clip: await page.locator('.paper').first().boundingBox() })

// ② 서랍 — 새 그룹 이름표가 다 보이나
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(900)
// 📔 서랍 맨 위 네 칸 = 「속지 · 글쓰기 · 일꾸 · 레꾸」 → 일기 세트는 «일꾸» 칸에 있다
//   ⛔ nth(N) 로 세지 말 것 — 칸이 늘면 조용히 딴 걸 누르고 검사가 «거짓 통과» 한다(2026-08-06 실제로 겪었다).
await page.getByRole('button', { name: '일꾸', exact: true }).first().click(); await page.waitForTimeout(500)
await page.getByRole('button', { name: '데코', exact: true }).first().click(); await page.waitForTimeout(700)
// ⛔ 라벨을 여기 «베껴 적지» 않는다 — 창업자가 이름을 바꾸면 검사가 죽는다(2026-08-06 실제로 그랬다).
//    `Stickers.jsx` 에서 `diary: true` 붙은 그룹의 라벨을 «읽어서» 쓴다.
//    ⚠️ Stickers.jsx 는 JSX 라 node 가 import 못 한다 → 글자로 뽑는다.
const SRC = readFileSync(join(new URL('..', import.meta.url).pathname, 'src/components/Stickers.jsx'), 'utf8')
const DIARY = [...SRC.matchAll(/\{ key: '[a-z0-9_]+', tab: '([a-z]+)', diary: true, label: '([^']+)'/g)]
  .map((m) => ({ tab: m[1], label: m[2] }))
if (DIARY.length) ok(`Stickers.jsx 에서 일기 세트 ${DIARY.length}그룹 읽음`)
else no('Stickers.jsx 에 `diary: true` 그룹이 하나도 없다')

// 📐 「먼저 보이나」 = 데코 탭 그룹 이름표를 «순서대로» 읽어 앞쪽에 몰려 있는지 본다
const secLabels = () => page.$$eval('.decor-sec-label', (ns) => ns.map((n) => n.textContent.trim()))
const decoLabels = await secLabels()
const wantDeco = DIARY.filter((d) => d.tab === 'deco').map((d) => d.label)
for (const label of wantDeco) {
  if (decoLabels.includes(label)) ok(`데코 탭에 「${label}」 있다`); else no(`데코 탭에 「${label}」 없다`)
}
const head = decoLabels.slice(0, wantDeco.length)
if (wantDeco.every((l) => head.includes(l))) ok(`데코 탭 «맨 앞 ${wantDeco.length}칸»이 일기 세트다`)
else no(`데코 탭 맨 앞이 일기 세트가 아니다 — 실제: ${head.join(' / ')}`)
await page.screenshot({ path: join(OUT, 'td-2-서랍-데코.png') })
// 마테 탭
await page.getByRole('button', { name: '마테', exact: true }).first().click().catch(() => {})
await page.waitForTimeout(600)
const tapeLabels = await secLabels()
for (const d of DIARY.filter((x) => x.tab === 'tape')) {
  if (tapeLabels[0] === d.label) ok(`마테 탭 «맨 위»가 「${d.label}」 이다`)
  else if (tapeLabels.includes(d.label)) no(`마테 탭에 「${d.label}」 은 있는데 맨 위가 아니다 (맨 위: ${tapeLabels[0]})`)
  else no(`마테 탭에 「${d.label}」 이 없다`)
}
await page.screenshot({ path: join(OUT, 'td-3-서랍-마테.png') })

if (errors.length) errors.forEach((e) => no(`pageerror — ${e}`))
else ok('pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
