// 🧹 「설정 정리」 재현판 — 갈래로 나누면서 «줄이 사라지지 않았나» (2026-09-03)
//
// 📮 창업자 = *"설정 깔끔하게 다시 정리하는거"*
// ⛔⛔ 정리하다 줄을 흘리는 게 제일 무서운 사고다 — 「계정 · 데이터 삭제」가 없어지면
//    그건 보기 나쁨이 아니라 **Play 정책 위반**이다(support.google.com/googleplay/android-developer/answer/13327111).
// 그래서 이 판은 «예쁨»을 안 본다. **열 줄이 다 있나**만 본다.
import './_fresh.mjs'
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
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const { FAV_NAME } = await import('../src/favName.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 412, height: 915 } })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch { /* noop */ } })
let page = await ctx.newPage()
page.setDefaultTimeout(15000)
await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2200)
// ⛔ 첫 방문엔 로그인 화면이 뜬다 — 새 탭으로 다시 열면 안 뜬다(다른 판들과 같은 방식).
if (await page.getByText('Google 계정으로 시작하기').count()) {
  const p2 = await ctx.newPage(); p2.setDefaultTimeout(15000)
  await p2.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' })
  await p2.waitForTimeout(2200); await page.close(); page = p2
}
// 설정 탭으로
await page.getByRole('button', { name: '설정', exact: true }).first().click({ force: true })
await page.waitForTimeout(1500)

// ⭐ 있어야 하는 열 줄 — 하나라도 없으면 실패다.
const 있어야할것 = [
  // ⛔ 「책갈피」라고 손으로 적었다가 틀렸다 — 진짜 이름은 `src/favName.js` 가 가진다(실측 = 「해볼 것」).
  //    ⭐ 그래서 «적지 않고 가져다» 쓴다. 창업자가 이름을 또 바꿔도 이 판은 안 깨진다.
  '스토어에 한마디', FAV_NAME, '요리 가이드', '앱 소개 다시 보기', '기능 안내 다시 보기',
  '도움말 및 문의', '한끼연구소', '계정 · 데이터 삭제', '개인정보처리방침', '오픈소스 라이선스',
]
let 실패 = 0
for (const 이름 of 있어야할것) {
  const n = await page.locator('.opt-row', { hasText: 이름 }).count()
  if (n === 1) console.log(`  ✅ ${이름}`)
  else { console.log(`  ⛔ ${이름} — ${n}개 (1개여야 한다)`); 실패++ }
}
// ⭐ 갈래 이름표가 «진짜로» 붙었나 — 안 붙으면 정리가 안 된 것이다.
// ⛔ 「한끼를 도와주기」는 창업자가 물렸다(2026-09-03) → 「함께 만들기」.
// ⭐ 갈래 밖에 떠 있던 상자들(백업·테마·버전)도 이름표를 받았다 — 그것들도 여기서 지킨다.
for (const 이름표 of ['내 것 지키기', '알림과 소식', '함께 만들기', '다시 보기', '화면 꾸미기', '계정과 약관', '앱 정보']) {
  const n = await page.getByText(이름표, { exact: true }).count()
  if (n >= 1) console.log(`  ✅ 이름표 「${이름표}」`)
  else { console.log(`  ⛔ 이름표 「${이름표}」가 없다`); 실패++ }
}
// ⭐ 상자가 여럿으로 «갈라졌나» — 한 상자에 열 줄이면 정리 전 그대로다.
const 줄수 = await page.locator('.opt-row').count()
console.log(`  🔢 설정 화면 줄 = ${줄수}개`)

await b.close(); srv.close()
console.log(실패 ? `\n⛔ ${실패}개 실패` : '\n✅ 다 통과 — 줄이 하나도 안 사라졌다')
process.exit(실패 ? 1 : 0)
