// 📐 검증 — 꾸미기 판 모양을 바꿔도 스티커가 «제자리»에 있나 (2026-08-06 ④)
//
// 다이어리는 세로 종이(3:4)인데 꾸미기 캔버스가 `aspectRatio: '1/1'` 로 박혀 있었다.
// 비율을 인자로 받게 고쳤는데, **진짜 되는지는 재봐야 안다.**
//   ⭐ 되는 근거로 든 것 = 스티커 좌표가 % 라 판이 바뀌어도 따라온다는 것.
//   ⛔ 「그럴 것이다」로 넘어가면 안 된다 — 여름 물결 배경이 세로 %를 못 써서
//      «안 움직이던» 사고가 정확히 이 자리였다.
//
// 판정
//   ⓐ 표지 꾸미기는 여전히 정사각인가 (회귀)
//   ⓑ 판을 3:4 로 바꾸면 캔버스가 실제로 세로로 길어지나
//   ⓒ 그때 스티커의 «상대 위치»(판 안에서 몇 %)가 그대로인가
//   ⓓ 스티커 «크기»가 판 모양 때문에 안 찌그러지나 (가로세로 비가 유지되나)
//
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_repro-decorratio.mjs
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다 (2026-08-06)
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4345, r))

const { BASICS_VERSION, basicRecipes } = await import('../src/data/basics.js')
const kong = basicRecipes.find((r) => r.title === '콩국수')
const now = Date.now()
const state = {
  recipes: [{ id: 'r1', title: '들깨나물무침', category: '한식', time: 15, thumb: 'icon', icon: 'fe_143',
    decorBg: kong?.decorBg, decor: kong?.decor, ingredients: ['시래기 200g'], steps: ['볶는다.'], tags: [], savedAt: now, source: 'user' }],
  diary: [], seedV: BASICS_VERSION,
}

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 880 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1') // 서랍 첫 안내가 판을 가리지 않게
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, state)
await page.goto('http://127.0.0.1:4345/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('.grid-card').first().click(); await page.waitForTimeout(800)
await page.getByText('레시피 꾸미기').first().click(); await page.waitForTimeout(1400)
await page.getByRole('button', { name: '나중에' }).first().click({ timeout: 2000 }).catch(() => {})
await page.waitForTimeout(500)

const stage = page.locator('.decor-stage > div').first()
// 스티커 = 판 바로 밑에서 left/top 이 %로 박힌 것들
const read = () => page.evaluate(() => {
  const st = document.querySelector('.decor-stage > div')
  const r = st.getBoundingClientRect()
  const kids = [...st.querySelectorAll(':scope > div > div')].filter((d) => d.style.left && d.style.left.includes('%'))
  return {
    w: Math.round(r.width), h: Math.round(r.height),
    items: kids.map((d) => {
      const k = d.getBoundingClientRect()
      return {
        cx: +(((k.left + k.width / 2) - r.left) / r.width * 100).toFixed(1),
        cy: +(((k.top + k.height / 2) - r.top) / r.height * 100).toFixed(1),
        wh: +(k.width / Math.max(1, k.height)).toFixed(3),
      }
    }),
  }
})

console.log('\n── ⓐ 표지 꾸미기 = 정사각인가 (회귀) ──')
const a = await read()
console.log(`   판 ${a.w} x ${a.h} · 스티커 ${a.items.length}개`)
if (Math.abs(a.w - a.h) <= 1) ok('정사각 그대로 — 표지 꾸미기는 안 바뀌었다')
else no(`정사각이 아니다 (${a.w}x${a.h}) — 표지가 망가졌다`)
if (!a.items.length) no('스티커를 하나도 못 찾았다 — 이 검사로는 판정이 안 된다')

console.log('\n── ⓑ~ⓓ 판을 3:4 로 바꾸면 ──')
await page.evaluate(() => { document.querySelector('.decor-stage > div').style.aspectRatio = '3/4' })
await page.waitForTimeout(500)
const c = await read()
console.log(`   판 ${c.w} x ${c.h}`)
const want = c.w * 4 / 3
if (Math.abs(c.h - want) <= 2) ok(`세로로 길어졌다 (3:4 = ${Math.round(want)} 기대 · 실제 ${c.h})`)
else no(`3:4 가 안 됐다 — 기대 ${Math.round(want)} · 실제 ${c.h}`)

let moved = 0, squashed = 0
a.items.forEach((it, i) => {
  const d = c.items[i]
  if (!d) return
  if (Math.abs(d.cx - it.cx) > 1.2 || Math.abs(d.cy - it.cy) > 1.2) moved++
  if (Math.abs(d.wh - it.wh) > 0.06) squashed++
})
if (!moved) ok(`스티커 ${a.items.length}개 전부 «판 안에서 같은 자리»에 있다 (% 좌표라 따라온다)`)
else no(`스티커 ${moved}개가 자리를 벗어났다 — 판 모양이 바뀌면 꾸민 게 어긋난다`)
if (!squashed) ok('스티커 가로세로 비가 그대로 — 안 찌그러진다')
else no(`스티커 ${squashed}개가 찌그러졌다`)

if (errors.length) errors.forEach((e) => no(`pageerror — ${e}`))
else ok('pageerror 0')

await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
