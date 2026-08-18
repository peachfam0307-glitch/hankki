// 🔖 인덱스를 **몇 종류** 쓰면 화면이 복잡해지나 — 창업자 물음에 답하는 판 (2026-08-18)
//
// 📮 창업자 *"2개이상고르면 **화면이 복잡해져??**"*
// ⛔ 말로 답할 게 아니다. **같은 화면에 종류 수만 바꿔** 나란히 놓는다.
//
// ✅ 창업자 확정 = *"하나만 고른다면 **요리사모자(아무것도 없는거)**"* → `ck_27`
//    2종이면 짝은 `cl_01`(일기장) — **일곱 중 제일 진하다**(진한 획 42% ↔ ck_27 16%).
//    ⭐ 「복잡해지나」는 개수보다 «얼마나 달라 보이나»가 정한다 → 제일 대비되는 짝으로 재야 최악이 보인다.
//
// 📐 종류 셋 × 크기 하나(30px · 창업자 뜻 28~32 의 가운데) · 작은 격자
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-인덱스몇종-0818.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const PX = Number(process.env.IDX_PX || 30)
const 밖 = -4, 위밖 = 22

const 폴더 = { cl: join(ROOT, 'docs/stickers/클립인덱스-창업자-2026-08-18/낱개'), ck: join(ROOT, 'docs/stickers/요리소품-창업자-2026-08-17/낱개') }
const url = (k) => 'data:image/png;base64,' + readFileSync(join(폴더[k.slice(0, 2)], `${k}.png`)).toString('base64')

const 갈래 = [
  { 이름: '1종', 컷: ['ck_27'] },
  { 이름: '2종', 컷: ['ck_27', 'cl_01'] },
  { 이름: '7종', 컷: ['ck_27', 'cl_13', 'cl_03', 'cl_01', 'cl_15', 'cl_16', 'ck_30'] },
]
const 모든컷 = [...new Set(갈래.flatMap((g) => g.컷))]
const 그림 = Object.fromEntries(모든컷.map((k) => [k, url(k)]))

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4385, r))

const { BASICS_VERSION, allBasicRecipes } = await import('../src/data/basics.js')
const 샘플 = allBasicRecipes.find((r) => r.decor?.length)
const now = Date.now()
const 아이콘 = ['fe_143', 'fh_k02', 'fe_18', 'fe_133', 'fe_128', 'fh_k18', 'fe_66', 'fe_95', 'fe_04', 'fh_k12']
// ⭐ 실제 목록처럼 — 꾸민 것 넷 ＋ 기본 여덟 ＋ 인덱스 안 건 것 셋
const 요리 = ['들깨나물무침', '콩나물국', '제육볶음', '된장찌개', '김치찌개', '어묵탕', '두부조림', '무생채', '계란말이', '미역국', '갈치조림', '고등어구이', '잡채', '비빔밥', '카레']
const 꾸민것 = new Set(['들깨나물무침', '제육볶음', '어묵탕', '계란말이'])
const 안건것 = new Set(['잡채', '비빔밥', '카레'])
const R = (t, i) => 꾸민것.has(t)
  ? { ...샘플, id: 'x'.repeat(i + 1), title: t, savedAt: now - i * 1000, source: 'user', status: 'sorted', favorite: true, cooked: 0, sample: false }
  : { id: 'x'.repeat(i + 1), title: t, category: '한식', time: 15, thumb: 'icon', icon: 아이콘[i % 10], ingredients: ['재료 1'], steps: ['끓여요.'], tags: [], savedAt: now - i * 1000, source: 'user', status: 'sorted', favorite: !안건것.has(t), cooked: 0 }
const state = { recipes: 요리.map(R), diary: [], seedV: BASICS_VERSION }

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const errors = []
const page = await b.newPage({ viewport: { width: 360, height: 1020 }, deviceScaleFactor: 3 })
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1'); localStorage.setItem('hankki:gridSize', 'small')
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, state)
await page.goto('http://127.0.0.1:4385/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(1200)

for (const g of 갈래) {
  const 잰것 = await page.evaluate(({ 그림, PX, 밖, 위밖, 요리, 안건것, 컷 }) => {
    const 남길 = new Set(요리), 텅 = new Set(안건것)
    const 카드들 = [...document.querySelectorAll('.grid-card')]
    let 본것 = new Set(), i = 0, 걸린수 = 0
    for (const c of 카드들) {
      const t = c.querySelector('.name')?.textContent
      if (!남길.has(t) || 본것.has(t)) { c.style.display = 'none'; continue }
      본것.add(t); c.style.display = ''
      const d = c.querySelector('.fav-dot')
      if (d) {
        if (텅.has(t)) { d.innerHTML = ''; d.style.background = 'none' }
        else {
          d.style.background = 'none'; d.style.backdropFilter = 'none'; d.style.webkitBackdropFilter = 'none'
          d.style.width = 'auto'; d.style.height = 'auto'; d.style.overflow = 'visible'
          d.style.top = `${8 - 위밖}px`; d.style.right = `${8 - 밖}px`
          d.innerHTML = `<img src="${그림[컷[걸린수 % 컷.length]]}" style="display:block;height:${PX}px;width:auto" alt="">`
          걸린수++
        }
      }
      i++
    }
    document.querySelectorAll('.grid-card').forEach((c) => { c.style.overflow = 'visible' })
    return { 칸: i, 걸린수 }
  }, { 그림, PX, 밖, 위밖, 요리, 안건것: [...안건것], 컷: g.컷 })
  await page.waitForTimeout(450)
  await page.screenshot({ path: join(OUT, `인덱스몇종-${g.이름}.png`), fullPage: true })
  console.log(`   ✅ ${g.이름} — 칸 ${잰것.칸} · 인덱스 ${잰것.걸린수}개 · 종류 ${g.컷.length}`)
}

if (errors.length) errors.forEach((e) => console.log('   ⛔ pageerror —', e))
else console.log('   ✅ pageerror 0')
await b.close(); srv.close()
console.log(`\n✅ → ${OUT}\n`)
