// 📸📅 달 시작일 화면 찍기 (2026-09-20) — 창업자 「보여줘」 · 「9월 13일-10월 12일로 계산」
//   ⛔ 지어낸 그림이 아니라 «앱이 그리는 그것»(규칙 30). 씨앗은 앱이 한 번 저장한 뒤 심는다(load 가 빈손을 버린다).
// 쓰는 법: SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_shot-식비달시작일-0920.mjs
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4617, r))
const 밖 = process.env.OUT || process.env.CLAUDE_SCRATCHPAD_DIR || '/tmp'
const { todayKST } = await import('../src/today.js')
const 며칠 = (n) => { const d = new Date(todayKST() + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
// 9/1~9/12 에도 기록이 있어야 「13일부터」로 바꿨을 때 합계가 «달라지는 게» 보인다
const 씨 = [
  { d: 며칠(0), k: 'out', won: 59300, memo: '난장다이닝' }, { d: 며칠(-1), k: 'shop', won: 38400, memo: '쿠팡' },
  { d: 며칠(-3), k: 'out', won: 15000, memo: '배민 치킨' }, { d: 며칠(-5), k: 'shop', won: 26800, memo: '컬리' },
  { d: 며칠(-8), k: 'shop', won: 41000, memo: '이마트몰' }, { d: 며칠(-12), k: 'out', won: 21000, memo: '분식' },
  { d: 며칠(-15), k: 'shop', won: 33000, memo: '한살림' }, { d: 며칠(-17), k: 'shop', won: 12700, memo: '자연드림' },
]
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, locale: 'ko-KR' })
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1'); const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { if (typeof k === 'string' && k.startsWith('hankki:coach')) return '1'; return g.call(this, k) } } catch { /* noop */ } })
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4617/hankki/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2300)
console.log('씨앗 =', await p.evaluate((줄들) => { try { const s = JSON.parse(localStorage.getItem('hankki:v1') || 'null'); if (!s || !Array.isArray(s.recipes)) return '아직 저장 전'; s.foodCost = 줄들.map((e, i) => ({ id: 'seed' + i, ...e })); s.foodBudget = { w: 150000, m: 400000 }; localStorage.setItem('hankki:v1', JSON.stringify(s)); return '심었다 ' + s.foodCost.length + '줄' } catch (e) { return '⛔ ' + e.message } }, 씨))
await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2300)
for (let i = 0; i < 12; i++) { const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first(); if (await 것.count() && await 것.isVisible().catch(() => false)) { await 것.click({ timeout: 1500 }).catch(() => {}); await p.waitForTimeout(250) } else break }
await p.locator('.bottom-nav .nav-item').filter({ hasText: '장보기' }).first().click(); await p.waitForTimeout(700)
await p.locator('.segment .seg').filter({ hasText: '식비' }).first().click(); await p.waitForTimeout(600)
await p.locator('.fc-scale button').filter({ hasText: '달별' }).first().click(); await p.waitForTimeout(500)
await p.screenshot({ path: join(밖, '달시작일-1-기본.png') })
await p.locator('.fc-mstart').click(); await p.waitForTimeout(400)
await p.screenshot({ path: join(밖, '달시작일-2-고르기.png') })
await p.locator('.fc-mstart-in input').fill('13'); await p.waitForTimeout(300)
await p.screenshot({ path: join(밖, '달시작일-2b-13침.png') })
await p.locator('.fc-ask-btns button.danger').click(); await p.waitForTimeout(700)
await p.screenshot({ path: join(밖, '달시작일-3-13일부터.png') })
console.log('구간 글자 =', await p.locator('.fc-big').first().locator('xpath=..').innerText().catch(() => '?'))
console.log('시작일 저장 =', await p.evaluate(() => JSON.parse(localStorage.getItem('hankki:v1')).foodBudget))
await b.close(); srv.close(); console.log('✅ →', 밖)
