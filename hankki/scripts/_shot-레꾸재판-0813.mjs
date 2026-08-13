// 🐻🐧 꼬르곰·펭펭 재판 32컷 — 앱 서랍·캔버스에 실제로 떴나 (2026-08-13)
//   ⛔ 검수 절대원칙 ⑤ = **실제 앱 렌더.** 파일이 멀쩡해도 라벨이 안 뜨거나 그림이 깨질 수 있다.
//   ⭐ 오늘 갈아끼운 32컷(rs_v01~16 · rs_k01~16)이 대상이다.
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
await new Promise((r) => srv.listen(4361, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const KEYS = [
  ...[...Array(16)].map((_, i) => `rs_v${String(i + 1).padStart(2, '0')}`),
  ...[...Array(16)].map((_, i) => `rs_k${String(i + 1).padStart(2, '0')}`),
]
const now = Date.now()
// ⭐ 32컷을 캔버스에 다 올린다 — 그려지는 크기·흰 테 두께를 «눈으로» 본다
const decor = KEYS.map((key, i) => ({
  id: `t${i}`, type: 'sticker', key,
  x: 0.11 + (i % 5) * 0.195, y: 0.07 + Math.floor(i / 5) * 0.132, s: 0.15, r: 0,
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
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'home3', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor', 'diary']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, state)
await page.goto('http://127.0.0.1:4361/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
// ⚠️ 하단 탭 이름은 «일기» 다 — 화면 제목(한끼 일기)과 다르다(2026-08-13 진단으로 확인)
await page.getByText('일기', { exact: true }).last().click()
await page.waitForTimeout(600)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click().catch(() => {})
await page.waitForTimeout(1400)

// ① 캔버스 — 32컷이 다 그려졌나 + 깨진 그림 0
const stage = page.locator('.decor-stage, .paper-box').first()
const 그려짐 = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')].filter((i) => /rs_[kv]\d\d/.test(i.src))
  return { 수: imgs.length, 깨짐: imgs.filter((i) => i.complete && i.naturalWidth === 0).length }
})
그려짐.수 >= 32 ? ok(`캔버스에 ${그려짐.수}컷 그려짐`) : no(`캔버스에 ${그려짐.수}컷만 (32이라야)`)
그려짐.깨짐 === 0 ? ok('깨진 그림 0') : no(`깨진 그림 ${그려짐.깨짐}개`)
if (await stage.count()) await stage.screenshot({ path: `${OUT}/앱-캔버스-재판32.png` })

// ② 서랍 — 두 그룹 라벨이 뜨나
//   ⚠️ 이 두 그룹은 일기 꾸미기에선 «기록» 탭에 있다(tabDiary: record) — 탭을 열어야 보인다.
//      ⛔ 2026-08-13: 탭을 안 열고 「안 보임」이라 했다. 규칙 18 — 「없다」가 아니라 내가 안 열었다.
await page.getByRole('button', { name: '기록' }).first().click().catch(() => {})
await page.waitForTimeout(700)
for (const 라벨 of ['반응 · 별점', '조리법 · 기록']) {
  const n = await page.getByText(라벨, { exact: true }).count()
  n > 0 ? ok(`서랍 라벨 「${라벨}」`) : no(`서랍 라벨 「${라벨}」 안 보임`)
}
const drawer = page.locator('.decor-drawer').first()
if (await drawer.count()) await drawer.screenshot({ path: `${OUT}/앱-서랍-재판32.png` })

errors.length === 0 ? ok('pageerror 0') : no(`pageerror ${errors.length}: ${errors[0]}`)
console.log(bad === 0 ? '\n✅ 앱 렌더 검수 통과' : `\n⛔ ${bad}건 어긋남`)
await b.close(); srv.close(); process.exit(bad ? 1 : 0)
