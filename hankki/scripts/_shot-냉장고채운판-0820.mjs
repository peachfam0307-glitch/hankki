// 🥕 홍보용 «재료가 들어 있는» 냉장고 화면 (2026-08-20)
//
// ⛔ 갓 깐 앱의 냉장고는 «텅 비어 있다» — 안내 문구만 뜬다. 홍보물엔 못 쓴다.
//    📌 규칙 21 로 잡았다 — 찍고 «열어봐서» 알았다. 숫자로는 「찍혔다」로 초록불이었다.
//
// ⭐ 재료는 «UI로» 넣는다 — localStorage 를 직접 만지면 앱이 실제로 쓰는 모양과
//    어긋날 수 있고(v11.00 의 addShopItem 이 필드를 골라 버린 사고와 같은 뿌리),
//    아이콘도 앱이 스스로 붙여야 진짜 화면이 된다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_shot-냉장고채운판-0820.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홍보/앱화면'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4383, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
await page.goto('http://127.0.0.1:4383/hankki/', { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(900)

// 장보기 → 냉장고
await page.locator('.bottom-nav .nav-item').filter({ hasText: '장보기' }).first().click()
await page.waitForTimeout(1200)
await page.locator('[data-coach="pantry"]').first().click()
await page.waitForTimeout(1000)

// ⭐ 창업자 재료 아이콘(ig_ 171컷)이 실제로 붙는 이름들로 고른다
const 재료들 = ['달걀', '두부', '애호박', '대파', '우유', '돼지고기', '양파', '당근']
let 넣은수 = 0
for (const 이름 of 재료들) {
  const 담기 = page.getByRole('button', { name: /재료 담기/ }).first()
  if (!(await 담기.count())) break
  await 담기.click(); await page.waitForTimeout(700)
  const 칸 = page.locator('input[type="text"]:visible, input:not([type]):visible').first()
  if (!(await 칸.count())) { await page.keyboard.press('Escape'); await page.waitForTimeout(400); continue }
  await 칸.fill(이름); await page.waitForTimeout(600)
  // 저장 단추 — 「담기」·「추가」·「저장」 중 시트 «안»에 있는 것
  let 눌렀나 = false
  for (const 글자 of [/^추가$/, /^담기$/, /^저장$/, /넣기/]) {
    const btn = page.getByRole('button', { name: 글자 }).last()
    if (await btn.count()) { await btn.click(); 눌렀나 = true; break }
  }
  if (!눌렀나) await page.keyboard.press('Enter')
  await page.waitForTimeout(800)
  넣은수++
}

console.log(`  🥕 재료 ${넣은수}개 시도`)
await page.waitForTimeout(900)
// 시트가 남아 있으면 닫는다
for (const 글자 of ['닫기', '취소']) {
  const btn = page.getByRole('button', { name: 글자 }).first()
  if (await btn.count()) { await btn.click(); await page.waitForTimeout(600) }
}
await page.waitForTimeout(700)

// 실제로 들어갔나 — 「집에 있는 재료를 넣어두세요」 안내가 사라졌으면 찼다는 뜻
const 비었나 = await page.getByText('집에 있는 재료를 넣어두세요', { exact: false }).count()
await page.screenshot({ path: join(OUT, '05-냉장고.png') })

// 📮 창업자 = *"레꾸자랑이랑 화면두"* — 꾸민 표지를 자랑하는 탭
await page.locator('.bottom-nav .nav-item').filter({ hasText: '레꾸자랑' }).first().click()
await page.waitForTimeout(1500)
await page.screenshot({ path: join(OUT, '08-레꾸자랑.png') })
console.log(`  ✅ 레꾸자랑 → ${join(OUT, '08-레꾸자랑.png')}`)

await b.close(); srv.close()

if (비었나) { console.log('  ⛔ 냉장고가 아직 비어 있다 — 재료 넣는 흐름을 다시 봐야 한다'); process.exit(1) }
console.log(`  ✅ 재료가 든 냉장고 → ${join(OUT, '05-냉장고.png')}`)
