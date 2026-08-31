// 🖼 대수술(안 D) 검수판 — 창업자 판정용 (2026-08-07 · 규칙 13)
//   📱 창업자 폰 그대로 360×780 · DPR 3 · ⛔줄이지 말 것
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/대수술'
mkdirSync(OUT, { recursive: true })
const DIST = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4446, r))
const { BASICS_VERSION } = await import('/home/user/hankki/hankki/src/data/basics.js')

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const page = await (await b.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 3 })).newPage()
page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, { recipes: [], seedV: BASICS_VERSION, diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor: [{ id: 'n1', type: 'note', key: 'kraft', text: '맛있는\n김치찌개', font: 'tongtong', shape: 'star', pattern: 'line', x: 0.5, y: 0.45, s: 0.42, r: 3 }] }] })
await page.goto('http://127.0.0.1:4446/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1400)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1500)
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)

const shot = async (n) => { writeFileSync(join(OUT, `${n}.png`), await page.screenshot()); console.log('  📸', n) }
const tab = async (k) => { const t = page.locator(`button[data-ctxtab="${k}"]`); if (await t.count()) { await t.first().click(); await page.waitForTimeout(400) } }

// ① 아무것도 안 고른 상태 — 도구 바가 «자리를 지킨다»
await page.mouse.click(8, 300); await page.waitForTimeout(400)
await shot('1-안고른상태')

// ② 포스트잇 고른 상태 — 갈래 일곱이 «한 줄»에
await page.locator('.decor-stage [style*="rotate"]').first().click(); await page.waitForTimeout(600)
await shot('2-포스트잇-갈래일곱')

// ③ 색 갈래
await tab('color'); await shot('3-색')
// ④ 움직임 갈래
await tab('motion'); await shot('4-움직임')
// ⑤ 모양 갈래
await tab('shape'); await shot('5-모양')

// ⑥ 데코 탭 — 서랍이 얼마나 보이나
await page.getByRole('button', { name: '데코', exact: true }).last().click(); await page.waitForTimeout(700)
await shot('6-데코서랍')

// ⑦ 자판이 올라온 상태 — 도구가 «자판 바로 위»에 오나
await page.locator('.decor-stage [style*="rotate"]').first().click(); await page.waitForTimeout(500)
await page.locator('.decor-stage [style*="rotate"]').first().click(); await page.waitForTimeout(700)
await page.setViewportSize({ width: 360, height: 400 })
await page.waitForTimeout(900)
await shot('7-자판올라온상태')

console.log(errs.length ? `\n⛔ pageerror ${errs.length}건 — ${errs[0]}` : '\n✅ pageerror 0')
await b.close(); srv.close()
console.log('📁', OUT)
