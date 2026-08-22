// 📸 스토어 스샷 v5 에 쓸 «앱 화면» 추가 캡처 (2026-08-22)
//
// ⛔⛔ 왜 또 찍나 — `_shot-홍보용앱화면-0820` 이 찍은 「레시피 상세」는 **맨 위(표지)**라
//    화면에 «파란 물결 그림»만 크게 보인다. 그걸 스토어 첫 장에 쓰면
//    **「그림 그리는 앱」으로 읽히고 «레시피 앱»이라는 게 안 보인다.**
//    📮 창업자 = *"우리 감성은 살리면서 **우리가 뭐하는 앱인지 잘보이게.**"*
//    → 그래서 **재료·순서가 보이는 자리까지 굴려서** 찍는다.
//
// ⭐ 규칙 21 — 찍고 나서 «열어 보고» 판정한다. 숫자로는 「무슨 앱으로 보이나」를 못 잰다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_shot-스토어용화면-0822.mjs
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
await new Promise((r) => srv.listen(4382, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
// ⛔ `SEED_COACH_SEEN` 은 «함수»다 — JSON 으로 넘기면 안내 딱지가 그대로 떠서
//    클릭을 가로챈다(2026-08-22 실제로 그랬다 · 규칙 18 ⓘ). 0820 판과 «같은 방식»으로 넘긴다.
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })

const 찍은것 = []
const 찍자 = async (p, 이름, 설명) => {
  await p.waitForTimeout(700)
  // 🔎 규칙 21 — 화면 한가운데를 «덮은 것»이 있으면 알린다
  const 덮개 = await p.evaluate(() => {
    const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2)
    const s = el?.closest('[class*="coach"],[class*="onboard"],[role="dialog"]')
    return s ? s.className || s.getAttribute('role') : null
  })
  if (덮개) console.log(`  ⚠️ ${이름} — 한가운데를 「${덮개}」가 덮고 있다`)
  await p.screenshot({ path: join(OUT, `${이름}.png`) })
  찍은것.push(이름)
  console.log(`  ✅ ${이름} — ${설명}`)
}

const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4382/', { waitUntil: 'networkidle' })
await p.waitForTimeout(900)

// ① 레시피 목록 — ⭐「요리책」이 한눈에. 표지가 깔린 격자라 «레시피 앱»이 바로 읽힌다
// ⛔ `getByRole('레시피')` 는 «검색 화면의 딴 버튼»이 먼저 걸린다 → 하단바를 콕 집는다(0820 교훈)
await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click()
await p.waitForTimeout(1300)
await 찍자(p, '20-레시피목록', '레시피 목록 — 꾸민 표지 격자')

// ② 레시피 상세를 «재료·순서가 보이는 자리»까지 굴린다
await p.locator('text=콩국수').first().click()
await p.waitForTimeout(800)
// ⛔⛔ `scrollHeight > clientHeight` 로 «찾은 첫 요소»에 scrollTop 을 넣었더니 **한 픽셀도 안 굴렀다**
//    (2026-08-22 · 찍힌 그림이 표지 그대로였다 — 규칙 21 이 잡았다).
//    ✅ 바퀴를 «실제로» 굴린다 — 어느 요소가 스크롤을 먹든 브라우저가 알아서 고른다.
const 굴리기 = async (page, 픽셀) => {
  await page.mouse.move(195, 500)
  await page.mouse.wheel(0, 픽셀)
  await page.waitForTimeout(700)
}
await 굴리기(p, 700)
await 찍자(p, '21-상세-재료순서', '레시피 상세 — 재료·만드는 법이 보이는 자리')

// ③ 한 번 더 굴려 「만드는 법」 걸음이 나오는 자리
await 굴리기(p, 800)
await 찍자(p, '22-상세-만드는법', '레시피 상세 — 만드는 법 걸음')

console.log(`\n📸 ${찍은것.length}장 → ${OUT}`)
await b.close(); srv.close()
