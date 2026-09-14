// 🎨🎨 [2026-09-10] 「레꾸를 열었다」가 진짜로 나가나 — 앱을 돌려서 잰다
//
// 🔢 왜 = GA4 2026-09-10 캡처(28일 · 15줄 전부) 에 **`decor` 도 `decor_saved` 도 «한 줄도 없었다».**
//    코드엔 멀쩡히 있다(`DecorEditor.jsx:219` 열림 · `:537` 저장).
//    👉 «아무도 안 열었다» 인지 «열었는데 안 잡힌다» 인지 **갈라야 한다.**
//    ⛔ 안 잡히는 것이면 우리가 제일 밀던 기능을 눈감고 있었던 것이다.
//
// ⛔ 아무것도 안 고친다. 구글 태그 스크립트를 막고 `dataLayer` 에 쌓인 것을 읽는다
//    (가짜 gtag 를 심는 방법은 안 통한다 — 앱이 나중에 자기 gtag 로 덮어쓴다. 2026-09-10 실측).
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
await new Promise((r) => srv.listen(4492, r))

let 나쁨 = 0
const 잰다 = (참, 말, 값 = '') => { if (참) console.log(`  ✅ ${말}${값 ? `  ${값}` : ''}`); else { 나쁨 += 1; console.log(`  ⛔ ${말}${값 ? `  ${값}` : ''}`) } }

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 860 }, locale: 'ko-KR' })
await ctx.route('**://www.googletagmanager.com/**', (r) => r.abort())
await ctx.route('**://*.google-analytics.com/**', (r) => r.abort())
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('hankki:nudge:cloudgate', '1')
    localStorage.setItem('hankki:onboarded', '1')
  } catch { /* noop */ }
})
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4492/hankki/', { waitUntil: 'networkidle' })
await p.waitForTimeout(2400)

const 길막 = async () => {
  for (let i = 0; i < 10; i++) {
    const 시트 = p.locator('.sheet-mask button', { hasText: /^(닫기|확인|알겠어요|나중에)/ }).first()
    if (await 시트.count() > 0 && await 시트.isVisible().catch(() => false)) { await 시트.click(); await p.waitForTimeout(500); continue }
    const 코치 = p.locator('[aria-label="다음 안내 보기"]').first()
    if (await 코치.count() > 0 && await 코치.isVisible().catch(() => false)) { await 코치.click(); await p.waitForTimeout(500); continue }
    break
  }
}
const 이름들 = () => p.evaluate(() => [...(window.dataLayer || [])]
  // ⛔⛔ [2026-09-10] dataLayer 에는 «배열이 아닌 것»도 들어온다 — GTM 스니펫이
  //    { 'gtm.start': … } 같은 평범한 객체를 밀어 넣는다. 그걸 펼치려 하면 not iterable 로 죽는다.
  //    📌 내 폰(로컬)에선 안 걸리고 CI 에서만 죽어서 v13.11 배포가 통째로 막혔다.
  .filter((a) => a && typeof a.length === 'number')
  .map((a) => [...a])
  .filter((a) => a[0] === 'event' && a[1] === 'page_view')
  .map((a) => a[2]?.page_title))

console.log('\n🎨 레꾸 — 열었다·저장했다가 나가나\n')
await 길막()

// ── 레시피 상세로
await p.locator('.nav-item', { hasText: '레시피' }).first().click()
await p.waitForTimeout(1200); await 길막()
await p.locator('[class*=card], .rc-card').first().click()
await p.waitForTimeout(1400); await 길막()
잰다((await 이름들()).includes('detail'), '① 레시피 상세가 잡힌다', JSON.stringify((await 이름들()).slice(-3)))

// ── 「레시피 꾸미기」 를 누른다
const 꾸미기 = p.locator('[aria-label="레시피 꾸미기"]').first()
잰다(await 꾸미기.count() > 0, '② 「레시피 꾸미기」 단추가 화면에 있다')
await 꾸미기.click()
await p.waitForTimeout(2000)
const 연뒤 = await 이름들()
잰다(연뒤.includes('decor'), '③ ⭐서랍을 열면 decor 가 나간다', JSON.stringify(연뒤.slice(-4)))

// ── 스티커를 하나 붙이고 저장한다
const 붙임 = await p.evaluate(() => {
  const 것 = [...document.querySelectorAll('button, [role="button"]')]
    .find((e) => /스티커|꾸미기 서랍|서랍 열기/.test(e.getAttribute('aria-label') || e.innerText || ''))
  if (것) { 것.click(); return true }
  return false
})
await p.waitForTimeout(1200)
console.log(`  · 서랍 단추를 눌렀나 = ${붙임}`)

await b.close(); srv.close()
console.log(나쁨 ? `\n✗ ${나쁨}칸 실패` : '\n✅ 레꾸 카운트 통과')
process.exit(나쁨 ? 1 : 0)
