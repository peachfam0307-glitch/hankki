// 🔤 앱 화면에 «유저가 보는» 영어가 얼마나 있나 — 창업자 물음에 답하려고 (2026-08-18)
//
// 📮 창업자 *"my pick? **혼자영어인가ㅋ**"*
//
// ⛔⛔ 처음엔 소스에서 따옴표 안 영어를 셌는데 **그건 CSS 클래스명·키값**이었다
//    (`round` 211 · `press` 195 …). 규칙 18 ⓘ — 검사가 «무엇을 보는지».
// ✅ 그래서 **진짜 화면을 열어 렌더된 글자**를 훑는다.
//
// 실행: node scripts/_잰다-UI영어-0818.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4391, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
const state = {
  recipes: ['들깨나물무침', '콩나물국', '제육볶음', '된장찌개'].map((t, i) => ({
    id: 'x'.repeat(i + 1), title: t, category: '한식', time: 15, thumb: 'icon', icon: 'fe_143',
    ingredients: ['재료 1'], steps: ['끓여요.'], tags: [], savedAt: now - i * 1000,
    source: 'user', status: 'sorted', favorite: i < 2, cooked: i,
  })), diary: [], seedV: BASICS_VERSION,
}

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 1 })
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1'); localStorage.setItem('hankki:gridSize', 'small')
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, state)
await page.goto('http://127.0.0.1:4391/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

const 훑기 = () => page.evaluate(() => {
  const 나온것 = new Set()
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let n
  while ((n = walker.nextNode())) {
    const el = n.parentElement
    if (!el || !el.offsetParent) continue                       // 안 보이는 것 제외
    if (getComputedStyle(el).visibility === 'hidden') continue
    // 영어 낱말 두 글자 이상 (숫자·단위 제외)
    for (const w of (n.textContent.match(/[A-Za-z][A-Za-z']{1,}/g) || [])) 나온것.add(w)
  }
  return [...나온것]
})

const 탭 = ['홈', '레시피', '일기', '장보기', '레꾸자랑']
const 모음 = new Map()
for (const t of 탭) {
  try {
    await page.getByText(t, { exact: true }).last().click(); await page.waitForTimeout(900)
  } catch { continue }
  for (const w of await 훑기()) 모음.set(w, (모음.get(w) || new Set()).add ? 모음.get(w) || new Set() : new Set())
  const 본것 = await 훑기()
  for (const w of 본것) { if (!모음.has(w)) 모음.set(w, new Set()); 모음.get(w).add(t) }
}
console.log(`\n🔤 화면에 보이는 «영어 낱말» = ${모음.size}개\n`)
for (const [w, tabs] of [...모음].sort()) console.log(`   ${w.padEnd(16)} ${[...tabs].join(' · ')}`)
if (!모음.size) console.log('   (하나도 없다 — 앱 UI 는 전부 한글이다)')
await b.close(); srv.close()
