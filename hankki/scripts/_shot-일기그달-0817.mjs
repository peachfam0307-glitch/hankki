// 📸 「한끼 일기 · 그 달」 검수판 — 창업자에게 보여줄 실물 (2026-08-17)
//
// ⭐ 규칙 21 = 보여주기 «전»에 내가 열어서 본다. 그래서 «앨범 자리까지 굴려서» 찍는다.
//    ⛔ `fullPage: true` 는 안 먹는다 — 우리 앱은 `.app-frame` 안에서 굴러가는 구조라
//       페이지 자체는 한 화면 높이다. 굴릴 놈을 «찾아서» 굴려야 한다.
//
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_shot-일기그달-0817.mjs
import './_fresh.mjs'
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
await new Promise((r) => srv.listen(4362, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const N = new Date(), Y = N.getFullYear(), M = N.getMonth(), T = N.getDate()
const at = (y, m, d) => new Date(y, m, d, 12, 0, 0).getTime()
const dA = T, dB = Math.max(1, T - 2), dC = Math.max(1, T - 4), dJ = Math.max(1, T - 6)
const cook = (id, d, title, icon) => ({ id, recipeId: icon, title, at: at(Y, M, d), rating: 5, note: '', photo: null })
const R = (id, title, icon) => ({ id, title, category: '한식', time: 15, thumb: 'icon', icon, ingredients: ['재료 1'], steps: ['끓여요.'], tags: [], savedAt: Date.now(), source: 'user' })
const state = {
  recipes: [R('들깨나물무침', '들깨나물무침', 'fe_143'), R('콩나물국', '콩나물국', 'fh_k02'), R('제육볶음', '제육볶음', 'fe_18'), R('된장찌개', '된장찌개', 'fe_133'), R('김치찌개', '김치찌개', 'fe_128'), R('어묵탕', '어묵탕', 'fh_k18')],
  diary: [
    cook('c1', dA, '들깨나물무침', '들깨나물무침'),
    cook('c2', dA, '콩나물국', '콩나물국'),
    cook('c3', dB, '제육볶음', '제육볶음'),
    cook('c4', dC, '된장찌개', '된장찌개'),
    { id: 'p1', recipeId: '김치찌개', title: '김치찌개', at: at(Y, M - 1, 20), rating: 4, note: '', photo: null },
    { id: 'p2', recipeId: '어묵탕', title: '어묵탕', at: at(Y, M - 1, 22), rating: 4, note: '', photo: null },
    { id: 'j1', kind: 'diary', at: at(Y, M, dJ), paper: { rule: 'plain', skin: 'kraft', art: 'none' }, decor: [], note: '' },
  ],
  seedV: BASICS_VERSION,
}

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, state)
await page.goto('http://127.0.0.1:4362/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(700)
await page.locator('.seg', { hasText: '한끼 일기' }).first().click(); await page.waitForTimeout(900)

// 🔎 굴릴 놈을 «찾는다» — 화면마다 다를 수 있어 손으로 박지 않는다.
const 굴리기 = async (y) => page.evaluate((top) => {
  const els = [document.scrollingElement, ...document.querySelectorAll('*')]
  const s = els.find((e) => e && e.scrollHeight - e.clientHeight > 40)
  if (s) s.scrollTop = top
  return s ? `${s.className || s.tagName} ${s.scrollHeight}` : 'none'
}, y)

const 찍기 = async (name, y) => {
  await 굴리기(y); await page.waitForTimeout(400)
  await page.screenshot({ path: join(OUT, name) })
  console.log('  📸', name)
}

// ① 날짜 고르기 «전» — 앨범에 전체
await 찍기('일기그달-1-고르기전-위.png', 0)
await 찍기('일기그달-2-고르기전-앨범.png', 900)

// ② 달력에서 오늘을 누른다 → 일기 화면 → 뒤로 (창업자가 겪은 그 길)
await page.locator('.cal-day').filter({ has: page.locator('.cal-num', { hasText: new RegExp(`^${dA}$`) }) }).first().click()
await page.waitForTimeout(900)
await page.getByRole('button', { name: '뒤로' }).first().click(); await page.waitForTimeout(900)
await 찍기('일기그달-3-고른뒤-그날과그달.png', 900)
await 찍기('일기그달-4-고른뒤-아래.png', 1500)

// ③ 요리를 «안» 한 날(일기만 쓴 날)
await page.locator('.cal-day').filter({ has: page.locator('.cal-num', { hasText: new RegExp(`^${dJ}$`) }) }).first().click()
await page.waitForTimeout(900)
await page.getByRole('button', { name: '뒤로' }).first().click(); await page.waitForTimeout(900)
await 찍기('일기그달-5-요리안한날.png', 900)

await b.close(); srv.close()
console.log('\n✅ 스샷 완료 →', OUT, '\n')
