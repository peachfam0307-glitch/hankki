// 🚱 앱을 띄워 «진짜로» 물이 안 담기는지 본다 (2026-09-12)
//   📮 창업자 = *"레시피 상세에서 담기 누르면 물500ml이런것도 담겨"*
//   ⛔ 번들에서 담을만한가 를 못 꺼내니 «실제 담는 길»을 탄다 — 자유 입력으로 넣어 본다.
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const R = dirname(dirname(fileURLToPath(import.meta.url)))   // ⛔ 컨테이너 경로를 박지 않는다 — CI 엔 그 자리가 없다
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2' }
const srv = createServer((q,s)=>{ let p=join(`${R}/dist`, decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'')); if(!existsSync(p)||p.endsWith('/'))p=join(`${R}/dist`,'index.html'); s.writeHead(200,{'Content-Type':MIME[extname(p)]||'application/octet-stream'}); s.end(readFileSync(p)) }).listen(0)
const port = srv.address().port
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const pg = await b.newPage({ viewport: { width: 390, height: 844 } })
const { SEED_COACH_SEEN } = await import(`${R}/src/coach.js`)
await pg.addInitScript(SEED_COACH_SEEN)
await pg.addInitScript(()=>{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1')})
await pg.goto(`http://localhost:${port}/hankki/`); await pg.waitForTimeout(1600)
await pg.getByRole('button',{name:/장보기|장바구니/}).first().click().catch(()=>{}); await pg.waitForTimeout(900)

const 넣기 = async (말) => {
  const 칸 = pg.getByPlaceholder('살 재료 입력하고 Enter').first()
  if (!(await 칸.count())) throw new Error('⛔ 입력칸을 못 찾았다 — 이 판정은 믿을 수 없다')
  await 칸.scrollIntoViewIfNeeded(); await 칸.fill(말); await 칸.press('Enter'); await pg.waitForTimeout(450)
  return pg.evaluate(() => {
    const raw = localStorage.getItem('hankki:v1') || '{}'
    try { return (JSON.parse(raw).shoppingList || []).map((i) => i.name) } catch { return [] }
  })
}
let 나쁨 = 0
// ⛔ 담기면 안 되는 것
for (const 말 of ['물 500ml', '물', '뜨거운 물', '밥 1공기', '면수']) {
  const 목록 = await 넣기(말)
  const 담겼나 = 목록 && 목록.some((n) => n === 말)
  console.log(`  ${담겼나 ? '⛔ 담겼다' : '✅ 안 담김'}  ${말}`)
  if (담겼나) 나쁨++
}
// ✅ 담겨야 하는 것 — 너무 많이 거르면 그것도 사고다
for (const 말 of ['두부', '소금', '육수', '돼지고기 600g']) {
  const 목록 = await 넣기(말)
  const 담겼나 = 목록 && 목록.some((n) => n === 말)
  console.log(`  ${담겼나 ? '✅ 담겼다' : '⛔ 안 담김'}  ${말}`)
  if (!담겼나) 나쁨++
}
await b.close(); srv.close()
if (나쁨) { console.log(`\n⛔ ${나쁨}군데 틀렸다`); process.exit(1) }
console.log('\n✅ 물류는 안 담기고 살 것은 담긴다')
