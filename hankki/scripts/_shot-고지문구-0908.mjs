// 📸 제휴 고지 문구가 «화면에» 어떻게 뜨나 — 규칙 21(보여주기 전에 내가 열어본다)
//
// 📮 창업자 확정 2026-09-08 = *"쿠팡 파트너스 활동으로 일정액의 수수료를 받아요 · 값은 그대로예요"*
// ⛔ 옛 문구 = 「제휴 수수료를 «받아도» 값은 그대로예요」 — 공정위 심사지침이 조건부 표현을 부적절 예시로 명시.
//
// 보는 것 셋: ①문구가 그대로 떴나 ②좁은 폰(320px)에서 「쿠팡 파트너스」 덩어리가 안 갈리나 ③몇 줄이 되나
// 쓰는 법: node scripts/_shot-고지문구-0908.mjs
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = dirname(fileURLToPath(import.meta.url))
const dist = join(여기, '../dist')
const 낼곳 = join(여기, '../../_shots')
if (!existsSync(낼곳)) mkdirSync(낼곳, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.webp': 'image/webp', '.svg': 'image/svg+xml' }
const srv = createServer((req, res) => {
  let p = join(dist, decodeURIComponent(req.url.split('?')[0]).replace(/^\/hankki/, ''))
  if (!existsSync(p) || p.endsWith('/')) p = join(dist, 'index.html')
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' })
  res.end(readFileSync(p))
}).listen(0)
const port = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || undefined })

for (const 폭 of [390, 320]) {
  const pg = await b.newPage({ viewport: { width: 폭, height: 844 }, deviceScaleFactor: 3 })
  await pg.addInitScript(SEED_COACH_SEEN)
  await pg.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
  await pg.goto(`http://localhost:${port}/hankki/`)
  await pg.waitForTimeout(1400)
  await pg.getByRole('button', { name: /장보기|장바구니/ }).first().click().catch(() => {})
  await pg.waitForTimeout(900)

  const 본문 = await pg.evaluate(() => document.body.innerText)
  const 있나 = (s) => (본문.includes(s) ? '✅' : '⛔')
  console.log(`\n📸 ${폭}px`)
  console.log(`  ① 「쿠팡 파트너스 활동으로」   ${있나('쿠팡 파트너스 활동으로')}`)
  console.log(`  ② 「일정액의 수수료를 받아요」 ${있나('일정액의 수수료를 받아요')}`)
  console.log(`  ③ 옛 문구 「받아도」가 남았나  ${본문.includes('받아도') ? '⛔ 남았다' : '✅ 없다'}`)

  // 고지 줄만 딱 잘라 찍는다 — 창업자가 «그 줄»만 보면 되게
  const 줄 = pg.locator('text=일정액의 수수료를 받아요').first()
  if (await 줄.count()) {
    const box = await 줄.boundingBox()
    console.log(`  ④ 높이 ${Math.round(box.height)}px (한 줄 ≈22px · 두 줄 ≈44px)`)
    await pg.screenshot({ path: join(낼곳, `고지문구-${폭}-줄.png`), clip: { x: 0, y: Math.max(0, box.y - 46), width: 폭, height: box.height + 70 } })
  }
  await pg.screenshot({ path: join(낼곳, `고지문구-${폭}-전체.png`) })
  await pg.close()
}
await b.close()
srv.close()
