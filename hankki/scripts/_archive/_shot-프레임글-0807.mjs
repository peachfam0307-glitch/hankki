// 🖼 「구멍 뚫린 프레임에도 글자가 써지나?」 (창업자 2026-08-07)
//   ⛔ 짐작 금지 — 프레임은 가운데가 «투명»이라 글이 어떻게 보일지 실물로 봐야 한다(규칙 15).
//   ⭐ 같이 확인할 것 = 이 8컷은 **프레임 탭 「기본」 그룹과 완전히 같은 컷**이다(코드 대조).
//      프레임으로 쓰면 «사진»을 끼우고, 글 상자로 쓰면 «글»을 얹는다 — 쓰임이 다르다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/검수2'
mkdirSync(OUT, { recursive: true })
const DIST = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4434, r))
const { BASICS_VERSION } = await import('/home/user/hankki/hankki/src/data/basics.js')

// 글 상자로 붙인다 — `type:'note'` ＋ `art` (새 타입을 안 만든 그 구조)
const P = [
  { art: 'pf_f06', t: '오늘 김치찌개\n국물이 진해' },   // 41번 · 클립보드(가운데 뚫림)
  { art: 'pf_f08', t: '8월 7일\n금요일' },              // 42번 · 팔각 점선
  { art: 'pf_i07', t: '우리집 최고' },                   // 44번 · 구름
  { art: 'pf_a07', t: '맛있음' },                        // 39번 · 태그
]
const decor = P.map((p, i) => ({
  id: `f${i}`, type: 'note', art: p.art, text: p.t, font: 'gaegu',
  x: 0.28 + (i % 2) * 0.44, y: 0.26 + Math.floor(i / 2) * 0.4, s: 0.4, r: 0,
}))

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
await page.goto('http://127.0.0.1:4434/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1400)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1500)
await page.mouse.click(8, 300); await page.waitForTimeout(500)

const box = await page.locator('.decor-stage').boundingBox()
writeFileSync(join(OUT, '4-프레임에-글.png'), await page.screenshot({ clip: { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) } }))
console.log('  📸 4-프레임에-글')
console.log(errs.length ? `⛔ pageerror ${errs.length}건 — ${errs[0]}` : '✅ pageerror 0')
await b.close(); srv.close()
