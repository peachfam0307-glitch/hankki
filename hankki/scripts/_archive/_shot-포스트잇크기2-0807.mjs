// 📏📏 포스트잇 크기 — **진짜 `s` 값으로** 그린다 (창업자 2026-08-07 *"저렇게 클필요 없을 것 같아"*)
//   ⛔⛔ 앞 판(`_shot-포스트잇크기`)은 겉 상자만 px 로 줄여서 **글씨 크기가 안 따라갔다** —
//      24% 판만 네 줄로 쪼개진 게 그 증거였다. 그 판으로 크기를 정하면 안 된다(규칙 15·18).
//   ✅ 그래서 일기에 `s` 를 «미리 박아» 저장해 두고 꾸미기를 연다 = 앱이 실제로 그리는 길 그대로.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/포스트잇크기'
mkdirSync(OUT, { recursive: true })
const DIST = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4426, r))
const { BASICS_VERSION } = await import('/home/user/hankki/hankki/src/data/basics.js')

const SENT = '오늘 김치찌개\n진짜 맛있었다'
const CAND = [
  { id: 'n1', key: 'butter', s: 0.34, x: 0.28, y: 0.26 },
  { id: 'n2', key: 'sage', s: 0.28, x: 0.72, y: 0.26 },
  { id: 'n3', key: 'lavender', s: 0.24, x: 0.28, y: 0.62 },
  { id: 'n4', key: 'mint', s: 0.20, x: 0.72, y: 0.62 },
]
const decor = CAND.map((c) => ({ id: c.id, type: 'note', key: c.key, text: SENT, font: 'gaegu', x: c.x, y: c.y, s: c.s, r: 0 }))

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const page = await (await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 3 })).newPage()
page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, { recipes: [], seedV: BASICS_VERSION, diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor }] })

await page.goto('http://127.0.0.1:4426/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1300)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1400)
await page.mouse.click(8, 300); await page.waitForTimeout(500)   // 고른 표시 풀기

const m = await page.evaluate(() => {
  const st = document.querySelector('.decor-stage').getBoundingClientRect()
  return {
    종이: `${Math.round(st.width)}×${Math.round(st.height)}`,
    각각: [...document.querySelectorAll('.decor-stage [style*="rotate"]')].map((n) => {
      const r = n.getBoundingClientRect()
      const t = n.querySelector('div,span')
      return `${Math.round(r.width)}×${Math.round(r.height)}px (판의 ${Math.round(r.width / st.width * 100)}%) · 글씨 ${t ? getComputedStyle(t).fontSize : '?'}`
    }),
  }
})
console.log('   📐', JSON.stringify(m, null, 1))
const box = await page.locator('.decor-stage').boundingBox()
writeFileSync(join(OUT, '3-진짜크기-네후보.png'), await page.screenshot({ clip: { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) } }))
console.log('  📸 3-진짜크기-네후보')
console.log(errs.length ? `⛔ pageerror ${errs.length}건 — ${errs[0]}` : '✅ pageerror 0')
await b.close(); srv.close()
