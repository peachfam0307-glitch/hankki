// 📸 「주부의 장바구니」 1판이 화면에 실제로 뜨나 — 규칙 21(보여주기 «전»에 내가 열어본다)
//
// 보는 것 셋:
//   ① 새 「유제품」 칩이 생겼나 (큰 칸 6 → 7)
//   ② 알라 하바티치즈 카드가 «치즈» 갈래에 뜨나 · 사러가기가 쿠팡으로 가나
//   ③ 자연드림 우리밀 올리고당이 «설탕» 갈래에 뜨나
//
// 쓰는 법: node scripts/_shot-장바구니1판-0817.mjs
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

const b = await chromium.launch()
const pg = await b.newPage({ viewport: { width: 390, height: 844 } })
// ⛔⛔ 온보딩·코치마크가 화면을 덮으면 「없다」로 잘못 본다(규칙 21)
//   📌 첫 판에서 실제로 당했다 — 키를 «짐작»해서 `hankki:coachSeen` 이라 썼더니 안 먹었고,
//      「레시피 가져오기」 코치마크가 탭 클릭을 가로채 홈에 머물렀다. 셋 다 ⛔로 나왔지만
//      **제품은 멀쩡히 들어가 있었다.** ✅ 저장소에 표준이 이미 있다 → `src/coach.js` 의 `SEED_COACH_SEEN`.
const { SEED_COACH_SEEN } = await import('../src/coach.js')
await pg.addInitScript(SEED_COACH_SEEN)
await pg.addInitScript(() => localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'))
await pg.goto(`http://localhost:${port}/hankki/`)
await pg.waitForTimeout(1500)

// 장보기 탭으로
await pg.getByRole('button', { name: /장보기|장바구니/ }).first().click().catch(() => {})
await pg.waitForTimeout(600)
await pg.waitForTimeout(900)

const 본문 = await pg.evaluate(() => document.body.innerText)
const 있나 = (s) => (본문.includes(s) ? '✅' : '⛔')
console.log('\n📸 장보기 화면에서 실제로 읽힌 것')
console.log(`  ① 「유제품」 칩          ${있나('유제품')}`)
console.log(`  ② 알라 하바티치즈        ${있나('하바티')}`)
console.log(`  ③ 자연드림 우리밀 올리고당 ${있나('올리고당')}`)

await pg.screenshot({ path: join(낼곳, '장보기-1판-전체.png'), fullPage: true })

// 「유제품」 칩을 눌러 그 안이 열리나
const 칩 = pg.getByText('유제품', { exact: false }).first()
if (await 칩.count()) {
  await 칩.click().catch(() => {})
  await pg.waitForTimeout(700)
  await pg.screenshot({ path: join(낼곳, '장보기-유제품칸.png'), fullPage: true })
  const 안 = await pg.evaluate(() => document.body.innerText)
  console.log(`  ④ 유제품 칸 안에 하바티  ${안.includes('하바티') ? '✅' : '⛔'}`)
  const 링크 = await pg.evaluate(() => [...document.querySelectorAll('a')].map((a) => a.href).filter((h) => h.includes('coupang')))
  console.log(`  ⑤ 쿠팡 사러가기 링크     ${링크.length ? '✅ ' + 링크[0].slice(0, 60) : '⛔ 없다'}`)
}

console.log(`\n  📁 ${낼곳}\n`)
await b.close(); srv.close()
