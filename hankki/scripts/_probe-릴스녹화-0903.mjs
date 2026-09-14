// 🎥 **「내가 앱을 «녹화»할 수 있나」를 재서 답한다** (2026-09-03)
//
// 📮 창업자 = *"영상은 네가 찍되 … 내가 영상을 찍으면 진짜 오래걸리거든?"*
//
// ⛔ 「된다」고 «말하기 전에» 실제로 파일이 나오는지 본다(규칙 15·29).
//    지난 릴스(9/1)는 창업자 폰 화면녹화를 받아서 만들었다 —
//    그래서 「내가 찍을 수 있나」는 **아직 한 번도 확인된 적이 없다.**
//
// 🔢 재는 것 = ⑴영상 파일이 «생기나» ⑵몇 초·몇 바이트인가 ⑶크기가 릴스에 쓸 만한가
//              ⑷꾸미기 화면까지 «실제로» 들어가지나
// ⭐ 살아 있는 앱을 띄운다 — 흉내가 아니다(절대원칙 30).
// ⛔ 브라우저 경로를 박지 않는다 — SMOKE_CHROMIUM 만 읽는다(v10.90 사고)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, readdirSync, statSync, mkdirSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const 낼곳 = join(ROOT, '.tmp-녹화시험')
rmSync(낼곳, { recursive: true, force: true })
mkdirSync(낼곳, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

// ⭐ 릴스 규격 그대로 = 1080×1920 의 절반(540×960) · deviceScaleFactor 2 → 실제 1080×1920
const ctx = await b.newContext({
  viewport: { width: 540, height: 960 },
  deviceScaleFactor: 2,
  recordVideo: { dir: 낼곳, size: { width: 1080, height: 1920 } },
})
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })

const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(2000)
for (let i = 0; i < 3; i++) { if (!(await p.locator('.sheet-mask').count())) break; await p.keyboard.press('Escape'); await p.waitForTimeout(400) }

// ── 레시피 한 장 열기 → 꾸미기 입구 찾기 ────────────────────
let 어디까지 = '홈'
try {
  await p.locator('.nav-item', { hasText: '레시피' }).first().click({ timeout: 4000 })
  await p.waitForTimeout(1200)
  어디까지 = '레시피 목록'
  await p.locator('.card, .recipe-card, li a, article').first().click({ timeout: 4000 })
  await p.waitForTimeout(1200)
  어디까지 = '레시피 상세'
  const 들어감 = await p.evaluate(() => {
    const c = [...document.querySelectorAll('button, [role="button"], a')]
      .filter((x) => /꾸미|레꾸/.test(x.innerText || x.getAttribute('aria-label') || ''))
    if (!c.length) return null
    c[0].click(); return (c[0].innerText || '').trim().slice(0, 20)
  })
  if (들어감) { await p.waitForTimeout(1500); 어디까지 = `꾸미기(「${들어감}」 눌러서)` }
} catch (e) {
  어디까지 += ` — 여기서 막힘: ${String(e.message).split('\n')[0].slice(0, 60)}`
}

await p.waitForTimeout(1200)
await ctx.close()          // ⭐ 컨텍스트를 닫아야 영상 파일이 «완성»된다
await b.close()
srv.close()

const 파일 = readdirSync(낼곳).filter((f) => /\.(webm|mp4)$/.test(f))
console.log('\n🎥 릴스 녹화 — 될까?\n')
console.log(`   어디까지 갔나 = ${어디까지}`)
if (!파일.length) {
  console.log('   ❌ 영상 파일이 «안 생겼다» — 이 환경에선 녹화가 안 된다.\n')
  process.exit(1)
}
for (const f of 파일) {
  const 바이트 = statSync(join(낼곳, f)).size
  console.log(`   ✅ ${f} — ${바이트.toLocaleString()} B`)
  if (바이트 < 10000) { console.log('   ⚠️ 너무 작다 — 빈 영상일 수 있다. 열어서 확인할 것.\n'); process.exit(1) }
}
console.log(`   📁 ${낼곳}\n`)
