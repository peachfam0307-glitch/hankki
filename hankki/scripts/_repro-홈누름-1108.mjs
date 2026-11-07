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
await new Promise((r) => srv.listen(4493, r))

let 나쁨 = 0
const 잰다 = (참, 말, 값 = '') => { if (참) console.log(`  ✅ ${말}${값 ? `  ${값}` : ''}`); else { 나쁨 += 1; console.log(`  ⛔ ${말}${값 ? `  ${값}` : ''}`) } }
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 860 }, locale: 'ko-KR' })
await ctx.route('**://www.googletagmanager.com/**', (r) => r.abort())
await ctx.route('**://*.google-analytics.com/**', (r) => r.abort())
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1'); localStorage.setItem('hankki:onboarded', '1') } catch { /* noop */ } })
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4493/hankki/', { waitUntil: 'networkidle' })
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
const 이름들 = () => p.evaluate(() => [...(window.dataLayer || [])].filter((a) => a && typeof a.length === 'number').map((a) => [...a])
  .filter((a) => a[0] === 'event' && a[1] === 'page_view').map((a) => a[2]?.page_title))
const 홈으로 = async () => { await p.locator('.nav-item', { hasText: '홈' }).first().click(); await p.waitForTimeout(1000); await 길막() }

console.log('\n🏠 홈 누름 · 만드는 법 — 진짜로 나가나 (2026-11-08)\n')
await 길막()
await p.locator('.today-refresh').first().click(); await p.waitForTimeout(500)
잰다((await 이름들()).includes('h_today_more'), '① 「다른 추천」 → h_today_more')
await p.locator('.today-main').first().click(); await p.waitForTimeout(1400); await 길막()
const 뒤1 = await 이름들()
잰다(뒤1.includes('h_today') && 뒤1.includes('detail'), '② 「오늘 뭐 해먹지」 → h_today · detail', JSON.stringify(뒤1.slice(-3)))
잰다(!뒤1.includes('detail_steps'), '③ 상세 맨 위에선 detail_steps 가 «아직» 안 나간다')
await p.locator('.sec-head', { hasText: '만드는 법' }).first().scrollIntoViewIfNeeded(); await p.waitForTimeout(800)
await p.mouse.wheel(0, -200); await p.waitForTimeout(400); await p.mouse.wheel(0, 200); await p.waitForTimeout(600)   // 안내(코치)가 이미 맨 아래로 내려 둘 수 있어 «위로 조금 → 다시 아래»
const 뒤2 = await 이름들()
잰다(뒤2.filter((x) => x === 'detail_steps').length === 1, '④ 만드는 법까지 내리면 detail_steps «한 번»', JSON.stringify(뒤2.slice(-3)))
await p.mouse.wheel(0, -2000); await p.waitForTimeout(400); await p.mouse.wheel(0, 2000); await p.waitForTimeout(600)
잰다((await 이름들()).filter((x) => x === 'detail_steps').length === 1, '⑤ 다시 오르내려도 더 안 센다')
await p.goBack().catch(() => {}); await p.waitForTimeout(1000); await 홈으로()
await p.locator('[aria-label="검색"]').first().click(); await p.waitForTimeout(800)
잰다((await 이름들()).includes('h_search'), '⑥ 검색 단추 → h_search')
const 전부 = await 이름들()
잰다(!전부.some((x) => /^h_.*basic-|^detail_steps./.test(x || '')), '⑦ 레시피 이름은 안 나간다', JSON.stringify([...new Set(전부)].filter((x) => /^h_|steps/.test(x))))
await b.close(); srv.close()
console.log(나쁨 ? `\n✗ ${나쁨}칸 실패` : '\n✅ 홈 누름 통과')
process.exit(나쁨 ? 1 : 0)
