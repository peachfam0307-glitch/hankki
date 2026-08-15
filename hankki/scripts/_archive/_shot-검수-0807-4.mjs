// 📸 2026-08-07 다섯 번째 검수판 — 창업자 폰 제보 셋 ＋ 글자 크기 3단 (규칙 13 · 고화질)
//   ⓐ 스티커 붙이고 빈 종이 탭 → 글쓰기로 튀던 것   ⓑ 길게 눌러 늘릴 때 구글 검색 뜨던 것
//   ⓒ 글쓰기 탭에서 «본문» 글씨체 고르기          ⓓ 작게·보통·크게 ＋ 「보통」에서 열둘 나란히
//
// ⛔ 줄여서 찍지 않는다 — 캡처는 화면 3배(dsf 3)로 뜨고, 비교판은 그 픽셀을 «1:1로» 붙인다.
//    (줄이면 글씨가 다 고만고만해 보여서 크기 판정 자체가 안 된다)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, readdirSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/검수-0807-4'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')

// 📖 글씨체 이름은 코드에서 읽는다 — 손으로 적으면 낡는다
const SRC = readFileSync(join(ROOT, 'src/components/Stickers.jsx'), 'utf8')
const TBL = SRC.slice(SRC.indexOf('export const TEXT_FONTS = ['))
const LABELS = [...TBL.slice(0, TBL.indexOf('\n]')).matchAll(/key: '[\w]+', label: '([^']+)'/g)].map((m) => m[1])
if (LABELS.length < 6) { console.log(`⛔ TEXT_FONTS 를 못 읽었다 (${LABELS.length}개)`); process.exit(1) }

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4404, r))
const { BASICS_VERSION } = await import('../src/data/basics.js')

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const errs = []
const page = await (await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 3 })).newPage()
page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, {
  recipes: [], seedV: BASICS_VERSION,
  diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'lined', skin: 'ivory', art: 'none' }, note: '', decor: [] }],
})
await page.goto('http://127.0.0.1:4404/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1100)
const shot = async (n) => { await page.screenshot({ path: join(OUT, `${n}.png`) }); console.log('  📸', n) }

// ⓐ 일꾸에서 셋을 붙이고 빈 자리를 눌러 보기 — 탭이 그대로여야 한다
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)
const chips = page.locator('.decor-drawer .decor-sec img')
for (let i = 0; i < Math.min(3, await chips.count()); i++) { await chips.nth(i).click(); await page.waitForTimeout(450) }
const st = await page.locator('.decor-stage .paper').first().boundingBox()
await page.mouse.click(st.x + st.width * 0.22, st.y + st.height * 0.7); await page.waitForTimeout(700)
await shot('1-일꾸에서-셋-붙이고-빈종이-탭')

// ⓒ 글쓰기 탭 — 본문 글씨체 줄
await page.getByRole('button', { name: '글쓰기', exact: true }).last().click(); await page.waitForTimeout(800)
const ta = page.locator('.decor-stage textarea').first()
if (await ta.count()) { await ta.fill('오늘도 한 끼 해냈다\n맛있겠다  5분 컷'); await page.waitForTimeout(600) }
await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(700)
await shot('2-글쓰기-글씨체줄-귀염체')

for (const name of ['삐뚤체', '몽글체', '납작체']) {
  const btn = page.locator('.decor-drawer button').filter({ hasText: new RegExp(`^${name}$`) })
  if (!(await btn.count())) continue
  await btn.first().click(); await page.waitForTimeout(700)
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(600)
  await shot(`3-글쓰기-${name}`)
}

// ═══ ⓓ 글자 크기 ═══════════════════════════════════════
// 종이 «윗부분»만 잘라 붙인다 — 종이 전체를 넣으면 글씨가 작아져 크기 비교가 안 된다
const pick = async (label) => {
  const bt = page.locator('.decor-drawer button').filter({ hasText: new RegExp(`^${label}$`) })
  if (!(await bt.count())) return false
  await bt.first().click(); await page.waitForTimeout(520)
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(280)
  return true
}
const paperBox = async () => {
  const bx = await page.locator('.decor-stage .paper').first().boundingBox()
  return { x: Math.round(bx.x), y: Math.round(bx.y), width: Math.round(bx.width), height: Math.round(bx.height * 0.4) }
}
const crop = async () => (await page.screenshot({ clip: await paperBox() })).toString('base64')

await pick('귀염체')
const sizes = {}
for (const nm of ['작게', '보통', '크게']) if (await pick(nm)) sizes[nm] = await crop()
await pick('보통')                       // ⭐ 열둘 비교는 반드시 「보통」에서
const fonts = {}
for (const label of LABELS) if (await pick(label)) fonts[label] = await crop()
console.log(`  🖼 크기 ${Object.keys(sizes).length}컷 · 글씨체 ${Object.keys(fonts).length}컷`)

// 🧩 비교판 = 캡처 픽셀을 «1:1»로 붙인다 (dsf 1 · img 는 naturalWidth 그대로)
// ⚠️ 헤드리스엔 한글 글꼴이 없을 수 있다 → 판의 «글자»도 우리 글꼴 파일로 직접 심는다
const HANGUL = readdirSync(join(DIST, 'assets')).find((f) => /^gowun-dodum-korean-.*\.woff2$/.test(f)) || ''
const board = async (title, note, items, cols, file) => {
  const cells = Object.entries(items)
  if (!cells.length) return
  const gp = await b.newPage()
  // ⚠️ 좁은 창에서 그리면 «제목이 그 폭에 갇힌 채» 굳는다(첫 판에 실제로 세로로 쭈그러졌다)
  //    → 넉넉히 벌려 그린 뒤, 격자 폭에 맞춰 «줄인다».
  await gp.setViewportSize({ width: 5200, height: 1400 })
  await gp.setContent(`<style>
    @font-face{font-family:'P';src:url('http://127.0.0.1:4404/hankki/assets/${HANGUL}') format('woff2');font-display:block}
    body{margin:0;background:#2a2723;font-family:'P',system-ui,sans-serif;color:#fff;padding:34px}
    h1{font-size:44px;margin:0 0 6px} p{font-size:26px;margin:0 0 26px;color:#e5cf9e}
    .g{display:grid;width:max-content;grid-template-columns:repeat(${cols},max-content);gap:26px}
    figure{margin:0;background:#fff;border-radius:12px;overflow:hidden}
    img{display:block}
    figcaption{background:#3f382e;color:#fff;font-size:30px;font-weight:800;padding:12px 16px;text-align:center}
  </style>
  <h1>${title}</h1><p>${note}</p>
  <div class="g">${cells.map(([k, v]) => `<figure><img src="data:image/png;base64,${v}"><figcaption>${k}</figcaption></figure>`).join('')}</div>`, { waitUntil: 'load' })
  await gp.waitForTimeout(600)
  const g = await gp.locator('.g').boundingBox()
  const w = Math.ceil(g.width) + 68
  await gp.setViewportSize({ width: w, height: 1400 }); await gp.waitForTimeout(350)
  // ⚠️ body 높이는 내용이 짧으면 «창 높이»가 그대로 나온다 → 격자 바닥을 기준으로 잰다
  const h = await gp.evaluate(() => Math.ceil(document.querySelector('.g').getBoundingClientRect().bottom))
  await gp.setViewportSize({ width: w, height: h + 34 }); await gp.waitForTimeout(250)
  await gp.screenshot({ path: join(OUT, `${file}.png`) })
  await gp.close()
  console.log('  📸', file)
}
await board('글자 크기 — 작게 · 보통 · 크게', '같은 글씨체(귀염체)로 단계만 바꿨다. 줄 간격은 안 움직인다(종이에 인쇄된 줄과 맞춘 값).', sizes, 3, '4-크기-작게보통크게')
await board('「보통」에서 글씨체 열둘', '글씨체마다 실제로 차지하는 높이가 1.5배까지 달라서, 재서 보정값을 넣었다. 열둘이 비슷해 보이면 성공.', fonts, 3, '5-보통-글씨체열둘')

console.log(errs.length ? `⛔ pageerror ${errs.length}건 — ${errs[0]}` : '✅ pageerror 0')
await b.close(); srv.close()
console.log('📁', OUT)
