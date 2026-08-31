// ⚖️ 「글씨체를 늘리면 무거워지나」 — 창업자 2026-08-07 *"무거워진다며 또 다른 버그생기는거 아냐?"*
//
// ⛔ 짐작으로 답하지 않는다. **화면을 실제로 열어서 내려받은 바이트를 센다.**
//    ⚠️ 걱정되는 자리 = 글씨체 «고르는 칸». 칸마다 이름을 «그 글씨체로» 보여주니
//       탭을 여는 순간 열두 벌을 다 받을 수 있다.
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
await new Promise((r) => srv.listen(4401, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await (await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2 })).newPage()

const got = []
page.on('response', async (r) => {
  if (!/\.woff2(\?|$)/.test(r.url())) return
  try { got.push({ url: r.url().split('/').pop(), n: (await r.body()).length }) } catch { /* noop */ }
})
const mark = (label) => {
  const n = got.reduce((a, x) => a + x.n, 0)
  console.log(`   ${label.padEnd(26)} 글꼴 ${String(got.length).padStart(2)}벌 · ${(n / 1024).toFixed(0)} KB`)
  return n
}

await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, {
  recipes: [], seedV: BASICS_VERSION,
  diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'lined', skin: 'ivory', art: 'none' }, note: '', decor: [] }],
})

console.log('\n⚖️ 글씨체 파일을 «언제 얼마나» 받나')
await page.goto('http://127.0.0.1:4401/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1500)
mark('① 앱 켠 직후')

await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(600)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1200)
mark('② 일기 화면')

await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1400)
mark('③ 꾸미기 열기')

await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(900)
// 「글자」 탭 — 여기에 글씨체 칸이 있다
const tab = page.locator('.decor-tabs button, .decor-cats button').filter({ hasText: '글자' })
if (await tab.count()) { await tab.first().click(); await page.waitForTimeout(2200) }
else {
  const any = page.getByRole('button', { name: '글자', exact: true })
  if (await any.count()) { await any.first().click(); await page.waitForTimeout(2200) }
  else console.log('   ⚠️ 「글자」 탭을 못 찾았다 — 아래 숫자는 그 탭을 안 연 값이다')
}
const after = mark('④ ⭐ 「글자」 탭을 열면')

console.log('\n   받은 것:', got.map((g) => `${g.url.split('-')[0]} ${(g.n / 1024).toFixed(0)}KB`).join(' · ') || '(없음)')
console.log(`\n   ⭐ 「글자」 탭 한 번에 ${(after / 1024 / 1024).toFixed(2)} MB`)
await b.close(); srv.close()
