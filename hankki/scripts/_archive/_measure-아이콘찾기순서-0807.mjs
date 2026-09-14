// 🔎 「친 이름이 맨 앞에 오나」 — 음식 아이콘 찾기 순서 (2026-08-07 전수검사에서 나온 것)
//   ⛔ 「김밥」을 치면 **오니기리**가 먼저 나왔다 — 오니기리 별명에 「삼각김밥」이 있고,
//      v9.79 창업자 확정 탭 순서상 «일식»이 «분식»보다 앞이라서다.
//   ⚠️ Node 는 .jsx 를 직접 못 읽는다 → **실제 화면에서** 픽커를 열어 첫 칸을 읽는다(규칙 15).
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
await new Promise((r) => srv.listen(4468, r))
const { BASICS_VERSION } = await import('../src/data/basics.js')

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await (await b.newContext({ viewport: { width: 360, height: 800 } })).newPage()
await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, { recipes: [{ id: 'r1', title: '들깨나물', at: Date.now(), thumb: 'icon', ings: [], steps: [] }], seedV: BASICS_VERSION })
await page.goto('http://127.0.0.1:4468/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1200)
await page.locator('.grid-card').first().click(); await page.waitForTimeout(800)
await page.locator('[aria-label="편집"]').first().click(); await page.waitForTimeout(700)
await page.locator('button.pill', { hasText: '아이콘' }).first().click(); await page.waitForTimeout(300)
await page.locator('[aria-label="아이콘 선택"]').first().click()
await page.locator('.emoji-sheet').waitFor({ timeout: 5000 })

// 「친 그대로의 이름이 있는」 말들 — 첫 칸에 그게 와야 한다
const 물음 = ['김밥', '떡볶이', '김치찌개', '라면', '카레', '만두', '비빔밥', '된장찌개', '잡채']
for (const q of 물음) {
  await page.locator('.emoji-sheet input').first().fill(q)
  await page.waitForTimeout(350)
  const 이름들 = await page.locator('.ficon-cell').evaluateAll((els) => els.slice(0, 4).map((e) => e.getAttribute('aria-label') || ''))
  if (!이름들.length) { no(`「${q}」 — 하나도 안 걸린다`); continue }
  const 첫 = (이름들[0] || '').replace(/\s+/g, '')
  console.log(`   ℹ️ 「${q}」 → 첫 칸 "${이름들[0]}"  (그다음 ${이름들.slice(1).join(' · ')})`)
  if (첫 === q || 첫.startsWith(q)) ok(`「${q}」 를 치면 «${이름들[0]}» 이 맨 앞`)
  else no(`「${q}」 를 쳤는데 맨 앞이 «${이름들[0]}» 이다 — 친 이름이 뒤로 밀렸다`)
}

// 🈳 초성도 여전히 도나 (순서를 바꾸다 초성 찾기를 죽이면 안 된다)
await page.locator('.emoji-sheet input').first().fill('ㄱㅊㅉㄱ')
await page.waitForTimeout(350)
const 초 = await page.locator('.ficon-cell').evaluateAll((els) => els.slice(0, 2).map((e) => e.getAttribute('aria-label') || ''))
console.log(`   ℹ️ 초성 「ㄱㅊㅉㄱ」 → ${초.join(' · ') || '(없음)'}`)
if (초.length) ok('초성 찾기가 그대로 돈다')
else no('초성 「ㄱㅊㅉㄱ」 이 하나도 안 걸린다 — 초성 찾기가 죽었다')

await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 친 이름이 늘 맨 앞에 온다\n')
process.exit(bad ? 1 : 0)
