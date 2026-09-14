// 🪜🪜 [2026-09-10] 가져오기 퍼널의 «두 걸음»이 진짜로 나가나 — 앱을 돌려서 잰다
//
// 🔢 왜 = GA4 2026-09-10 캡처 = import 조회 19 → editor 조회 6. 그 사이가 통째로 안 보였다.
//    이제 `import_<갈래>` 와 `recipe_saved` 를 보낸다. **말로 「보낸다」고 하지 말고 재서 확인한다.**
//
// ⛔ 이 판은 아무것도 안 고친다. gtag 를 «가짜»로 세워 두고 무엇이 나가는지 받아 적는다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4491, r))

let 나쁨 = 0
const 잰다 = (참, 말, 값 = '') => { if (참) console.log(`  ✅ ${말}${값 ? `  ${값}` : ''}`); else { 나쁨 += 1; console.log(`  ⛔ ${말}${값 ? `  ${값}` : ''}`) } }

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 860 }, locale: 'ko-KR' })
// 🚧🚧 구글 태그 스크립트를 «막는다» — 그러면 gtag 는 `dataLayer` 에 쌓기만 하고
//    밖으로는 한 건도 안 나간다(stats.js 63~110줄 = gtag 는 dataLayer.push 가 전부이고,
//    진짜 전송은 저 스크립트가 붙은 뒤에 일어난다).
//    ⛔⛔ 가짜 gtag 를 심는 방법은 «안 된다» — 앱이 나중에 자기 gtag 로 덮어쓴다(실제로 그래서 0건이었다).
await ctx.route('**://www.googletagmanager.com/**', (r) => r.abort())
await ctx.route('**://*.google-analytics.com/**', (r) => r.abort())
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('hankki:nudge:cloudgate', '1')
    localStorage.setItem('hankki:onboarded', '1')
  } catch { /* noop */ }
})
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4491/hankki/', { waitUntil: 'networkidle' })
await p.waitForTimeout(2400)

// 코치마크가 앞을 막으면 아무것도 못 누른다
for (let i = 0; i < 8; i++) {
  const 코치 = p.locator('[aria-label="다음 안내 보기"]').first()
  if (await 코치.count() === 0 || !(await 코치.isVisible().catch(() => false))) break
  await 코치.click(); await p.waitForTimeout(500)
}

// 📥 dataLayer 에 쌓인 것을 읽는다 — 담기는 것은 `arguments` 라 배열로 바꿔서 본다
const 이름들 = () => p.evaluate(() => [...(window.dataLayer || [])]
  // ⛔⛔ [2026-09-10] dataLayer 에는 «배열이 아닌 것»도 들어온다 — GTM 스니펫이
  //    { 'gtm.start': … } 같은 평범한 객체를 밀어 넣는다. 그걸 펼치려 하면 not iterable 로 죽는다.
  //    📌 내 폰(로컬)에선 안 걸리고 CI 에서만 죽어서 v13.11 배포가 통째로 막혔다.
  .filter((a) => a && typeof a.length === 'number')
  .map((a) => [...a])
  .filter((a) => a[0] === 'event' && a[1] === 'page_view')
  .map((a) => a[2]?.page_title))

console.log('\n🪜 가져오기 퍼널 — 두 걸음\n')

await p.locator('.nav-item', { hasText: '가져오기' }).first().click()
await p.waitForTimeout(1200)
for (let i = 0; i < 8; i++) {
  const 코치 = p.locator('[aria-label="다음 안내 보기"]').first()
  if (await 코치.count() === 0 || !(await 코치.isVisible().catch(() => false))) break
  await 코치.click(); await p.waitForTimeout(500)
}
잰다((await 이름들()).includes('import'), '① 가져오기 화면이 잡힌다')

// ── ② 갈래를 누르면 «그 갈래 이름»이 나간다 (직접 입력 = write)
await p.locator('.imp-opt').nth(3).click()
await p.waitForTimeout(900)
const 갈래뒤 = await 이름들()
잰다(갈래뒤.includes('import_write'), '② 갈래를 누르면 그 갈래가 나간다', JSON.stringify(갈래뒤.slice(-3)))
잰다(!갈래뒤.some((n) => n && n.startsWith('import_') && n !== 'import_write'),
  '② 다른 갈래는 «안» 나갔다 — 넷이 안 섞인다')

// ── ③ 저장하면 recipe_saved 가 나간다
await p.locator('button', { hasText: '빈 종이 열기' }).first().click()
await p.waitForTimeout(1400)
잰다((await 이름들()).includes('editor'), '③ 편집기 화면이 잡힌다')
잰다(!(await 이름들()).includes('recipe_saved'), '③ 아직 저장 전이라 recipe_saved 가 «없다»')

// ⛔ `input` 첫 칸은 «숨은 파일 고르기»다 — placeholder 로 콕 집는다
const 제목칸 = p.locator('input[placeholder="예) 명란 크림 파스타"]')
await 제목칸.fill('퍼널 시험 레시피')
await p.waitForTimeout(300)
const 저장 = p.locator('button', { hasText: /저장|완료/ }).last()
await 저장.click()
await p.waitForTimeout(1800)
const 저장뒤 = await 이름들()
잰다(저장뒤.includes('recipe_saved'), '③ 저장하면 recipe_saved 가 나간다', JSON.stringify(저장뒤.slice(-3)))
잰다(저장뒤.filter((n) => n === 'recipe_saved').length === 1, '③ 딱 «한 번»만 나갔다')

// ── ④ 통계를 끈 사람은 한 건도 안 나간다
await p.evaluate(() => { localStorage.setItem('hankki:stats:off', '1') })
await p.reload({ waitUntil: 'networkidle' })
await p.waitForTimeout(2000)
잰다((await 이름들()).length === 0, '④ 통계를 끄면 한 건도 안 나간다', JSON.stringify(await 이름들()))

await b.close(); srv.close()
console.log(나쁨 ? `\n✗ ${나쁨}칸 실패` : '\n✅ 퍼널 두 걸음 통과')
process.exit(나쁨 ? 1 : 0)
