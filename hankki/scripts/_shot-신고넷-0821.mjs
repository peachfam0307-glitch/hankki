// 🗑️📸 신고 넷 ②③ — 「계정·데이터 삭제」 줄과 두 안내 페이지를 «열어서» 본다 (2026-08-21)
//   ⛔ 절대원칙 21 — 보여주기 전에 내가 연다. 빌드 통과는 «떴다»는 뜻이 아니다.
import { chromium } from 'playwright'
import http from 'node:http'
import { readFileSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { SEED_COACH_SEEN } from '../src/coach.js'

const DIST = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' }
const srv = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0])
  const f = join(DIST, p === '/' ? 'index.html' : p)
  try { statSync(f); res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)) }
  catch { res.writeHead(404); res.end('nope') }
})
await new Promise((r) => srv.listen(4614, r))
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
await ctx.route('**/*.googleapis.com/**', (r) => r.abort())
await ctx.route('**/*.gstatic.com/**', (r) => r.abort())
let 나쁨 = 0
const 잰다 = (이름, 참) => { console.log(`${참 ? '✅' : '⛔'} ${이름}`); if (!참) 나쁨++ }

// ① 설정 화면에 「계정 · 데이터 삭제」 줄이 «보이나»
const pg = await ctx.newPage()
const 탈 = []
pg.on('pageerror', (e) => 탈.push(String(e)))
await pg.addInitScript(SEED_COACH_SEEN)
await pg.goto('http://localhost:4614/', { waitUntil: 'domcontentloaded' })
await pg.waitForTimeout(2200)
const 눌러 = async (n) => { try { await pg.getByRole('button', { name: n, exact: true }).first().click({ timeout: 2500 }); await pg.waitForTimeout(1300) } catch { /* noop */ } }
await 눌러('나중에 하기'); await 눌러('그냥 시작하기')
for (let i = 0; i < 12; i++) await 눌러('다음')
await 눌러('한끼 시작하기')
await pg.waitForTimeout(1500)
await 눌러('설정'); await pg.waitForTimeout(1500)
const 줄 = pg.getByText('계정 · 데이터 삭제', { exact: true }).first()
잰다('설정에 「계정 · 데이터 삭제」 줄이 있다', await 줄.count() > 0)
if (await 줄.count() > 0) {
  await 줄.scrollIntoViewIfNeeded()
  잰다('그 줄이 «화면에 보인다»(가려지지 않았다)', await 줄.isVisible())
}
잰다('설정 화면 pageerror 0', 탈.length === 0)
await pg.screenshot({ path: '/tmp/신고넷1-설정.png', fullPage: true })

// ② 두 안내 페이지가 «열리나» — 새 절이 실제로 그려지나
for (const [파일, 찾을것, 낼곳] of [
  ['privacy.html', '3. 클라우드 저장 (구글 계정으로 로그인)', '/tmp/신고넷2-방침.png'],
  ['delete-account.html', '3. 앱에서 직접 삭제', '/tmp/신고넷3-삭제안내.png'],
]) {
  const p2 = await ctx.newPage()
  const 탈2 = []
  p2.on('pageerror', (e) => 탈2.push(String(e)))
  await p2.goto(`http://localhost:4614/${파일}`, { waitUntil: 'domcontentloaded' })
  await p2.waitForTimeout(700)
  잰다(`${파일} — 「${찾을것}」 절이 있다`, await p2.getByText(찾을것, { exact: false }).count() > 0)
  // ⏳ 자리표시자는 «지금은 있는 게 맞다» — 배포하는 날 그날 날짜로 바꾼다.
  //    ⛔ 그대로 나가는 것은 `check-mistakes` ⑭ 가 «배포 브랜치에서» 막는다. 여기선 세지 않고 «알리기만» 한다.
  const 남았나2 = (await p2.locator('body').innerText()).includes('@@시행일@@')
  console.log(`   ${남았나2 ? '⏳' : '✅'} ${파일} — 시행일 ${남았나2 ? '아직 비어 있다(배포 전이라 정상 · 게이트 ⑭ 가 지킨다)' : '채워져 있다'}`)
  잰다(`${파일} — pageerror 0`, 탈2.length === 0)
  await p2.screenshot({ path: 낼곳, fullPage: true })
  await p2.close()
}

await ctx.close(); await b.close(); srv.close()
console.log(나쁨 ? `\n⛔ ${나쁨}칸 실패` : '\n✅ 신고 넷 ②③ — 전부 통과')
process.exit(나쁨 ? 1 : 0)
