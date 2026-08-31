// 🔖 「안 걸린 칸」을 어떻게 그리나 — 창업자 판정용 (2026-08-18)
//
// ⛔⛔ **실물을 보고서야 드러났다** — 26px 클립을 넣고 찍었더니
//    「걸린 것」은 작고 조용한데 **「안 걸린」 흰 동그라미(34px · 흰색 0.85)가 훨씬 도드라졌다.**
//    화면에 흰 동그라미가 11개 떠서 **정작 걸린 게 안 보인다. 표시용인데 반대가 됐다.**
//    📮 창업자 *"**표시용이니까 존재감이 너무 크면 곤란해**"* 가 정확히 여기 걸린다.
//    ⭐ 그리고 이게 창업자가 「안 걸린 칸은 텅」이라 확정한 «이유»를 그대로 증명한다.
//
// 📐 세 갈래 — ⓐ지금(동그라미＋책갈피) ⓑ동그라미 빼고 책갈피만 ⓒ텅
//    ⛔ ⓒ 는 누를 자리가 사라진다 → 거는 방법을 「길게 누르기」로 옮겨야 한다.
//
// 실행: node scripts/_판-안걸린칸-0818.mjs
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
await new Promise((r) => srv.listen(4387, r))

const { BASICS_VERSION, allBasicRecipes } = await import('../src/data/basics.js')
const 샘플 = allBasicRecipes.find((r) => r.decor?.length)
const now = Date.now()
const 아이콘 = ['fe_143', 'fh_k02', 'fe_18', 'fe_133', 'fe_128', 'fh_k18', 'fe_66', 'fe_95', 'fe_04', 'fh_k12']
const 요리 = ['들깨나물무침', '콩나물국', '제육볶음', '된장찌개', '김치찌개', '어묵탕', '두부조림', '무생채', '계란말이', '미역국', '갈치조림', '고등어구이']
const 꾸민것 = new Set(['들깨나물무침', '어묵탕'])
// ⭐ 실제 목록처럼 «드문드문» 걸린다 — 12칸 중 4칸.
//    ⛔ 전부 걸어 놓으면 「안 걸린 칸」이 안 보여서 판정이 안 된다.
const 걸린것 = new Set(['들깨나물무침', '된장찌개', '어묵탕', '계란말이'])
const R = (t, i) => 꾸민것.has(t)
  ? { ...샘플, id: 'x'.repeat(i + 1), title: t, savedAt: now - i * 1000, source: 'user', status: 'sorted', favorite: 걸린것.has(t), cooked: 0, sample: false }
  : { id: 'x'.repeat(i + 1), title: t, category: '한식', time: 15, thumb: 'icon', icon: 아이콘[i % 10], ingredients: ['재료 1'], steps: ['끓여요.'], tags: [], savedAt: now - i * 1000, source: 'user', status: 'sorted', favorite: 걸린것.has(t), cooked: 0 }
const state = { recipes: 요리.map(R), diary: [], seedV: BASICS_VERSION }

const 갈래 = [
  { 이름: 'a-지금', css: '' },
  { 이름: 'b-책갈피만', css: '.fav-dot:not(.on){background:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}' },
  { 이름: 'c-텅', css: '.fav-dot:not(.on){display:none!important}' },
]

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const errors = []
for (const g of 갈래) {
  const page = await b.newPage({ viewport: { width: 360, height: 900 }, deviceScaleFactor: 3 })
  page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
  await page.addInitScript((s) => {
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1'); localStorage.setItem('hankki:gridSize', 'small')
    const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
  }, state)
  await page.goto('http://127.0.0.1:4387/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1400)
  await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(1100)
  // ⛔ 같은 이름의 기본 레시피가 섞인다 — 처음 나온 하나만
  await page.evaluate(({ 요리, css }) => {
    const 남길 = new Set(요리); const 본것 = new Set()
    for (const c of document.querySelectorAll('.grid-card')) {
      const t = c.querySelector('.name')?.textContent
      if (!남길.has(t) || 본것.has(t)) { c.style.display = 'none'; continue }
      본것.add(t)
    }
    if (css) { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s) }
  }, { 요리, css: g.css })
  await page.waitForTimeout(400)
  await page.screenshot({ path: join(OUT, `안걸린칸-${g.이름}.png`), fullPage: true })
  console.log(`   ✅ ${g.이름}`)
  await page.close()
}
if (errors.length) errors.forEach((e) => console.log('   ⛔ pageerror —', e))
else console.log('   ✅ pageerror 0')
await b.close(); srv.close()
console.log(`\n✅ → ${OUT}\n`)
