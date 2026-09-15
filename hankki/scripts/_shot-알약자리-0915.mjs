// 🛒📍 [2026-09-15] **「담기」알약을 어디에 붙일까 — 시안 셋.**
//   📮 창업자 = *"다 담고 누르기 좋은 위치가 어딘지"*
//   🔢 실측(`_probe-알약자리-0915.mjs`) = 담기알약 693 · 재료끝 1174~1492
//      → 체크를 다 하면 손가락은 «목록 끝»인데 단추는 **최대 799px 위** = 화면 한 판을 되올라가야 한다.
//   ⛔ 앱 소스를 한 글자도 안 고친다 — 주입으로 그려 보여줄 뿐이다(규칙 11).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4513, r))
const OUT = process.env.SHOT_OUT || '/tmp/알약자리'
mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
async function 치우기(p) {
  for (let i = 0; i < 12; i++) {
    const 것 = p.locator('.sheet-mask button, [aria-label="다음 안내 보기"], button:has-text("건너뛰기"), button:has-text("시작하기")').first()
    if (await 것.count() === 0 || !(await 것.isVisible().catch(() => false))) break
    try { await 것.click({ timeout: 2000 }); await p.waitForTimeout(600) } catch { break }
  }
}
const 손질 = {
  '지금': () => {},
  // ⭐ A = 담기를 **재료 목록 끝**으로 내린다. 머리엔 안 남긴다(하나만 있어야 헷갈리지 않는다).
  //    색을 «채운 brown» 넓은 단추로 바꿔 아래 크림 알약(장바구니)과 결을 다르게 한다
  //    — 📮 *"알약이 연속으로 막 있으면 정신이 없어"* 를 피하는 방법이 «같은 모양을 두 번 안 쓰는 것»이다.
  'A-목록끝-채운단추': () => {
    const 옛 = document.querySelector('.mini-buy'); if (!옛) return
    const 새 = document.createElement('button')
    새.className = 'press'
    새.setAttribute('style', 'display:flex;align-items:center;justify-content:center;gap:7px;width:100%;'
      + 'margin-top:16px;padding:15px;border-radius:16px;background:var(--brown);color:#fff;font-weight:800;font-size:17px;border:none')
    새.innerHTML = 옛.innerHTML.replace(/fill="[^"]*"/g, 'fill="#fff"')
    새.style.color = '#fff'
    옛.remove()
    const 재료들 = [...document.querySelectorAll('.ing')]
    const 끝 = 재료들[재료들.length - 1]
    if (끝?.parentElement) 끝.parentElement.appendChild(새)
  },
  // ⭐ B = A ＋ 머리에도 «그대로» 남긴다 (짧은 레시피에선 위가 편할 수 있다)
  'B-위아래-둘다': () => {
    const 옛 = document.querySelector('.mini-buy'); if (!옛) return
    const 새 = 옛.cloneNode(true)
    새.setAttribute('style', 'display:flex;align-items:center;justify-content:center;gap:7px;width:100%;'
      + 'margin-top:16px;padding:15px;border-radius:16px;background:var(--brown);color:#fff;font-weight:800;font-size:17px;border:none')
    const 재료들 = [...document.querySelectorAll('.ing')]
    const 끝 = 재료들[재료들.length - 1]
    if (끝?.parentElement) 끝.parentElement.appendChild(새)
  },
}
for (const [이름, 고침] of Object.entries(손질)) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'ko-KR' })
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:nudge:cloudgate', '1') } catch { /* noop */ } })
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4513/hankki/', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(2600); await 치우기(p)
  await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click(); await p.waitForTimeout(900); await 치우기(p)
  await p.locator('.grid-card').nth(1).click(); await p.waitForTimeout(1100); await 치우기(p)
  await p.evaluate(고침); await p.waitForTimeout(400)
  // 📍 «재료 끝 ~ 장바구니 알약» 이 한 판에 같이 보이게 굴린다 — 거기가 판정할 자리다
  await p.evaluate(() => {
    const 재료들 = [...document.querySelectorAll('.ing')]
    const 끝 = 재료들[재료들.length - 1]
    if (끝) { 끝.scrollIntoView({ block: 'center' }); window.scrollBy(0, 180) }
  })
  await p.waitForTimeout(600)
  await p.screenshot({ path: join(OUT, `${이름}.jpg`), type: 'jpeg', quality: 78 })
  console.log(`  ${이름}`)
  await ctx.close()
}
await b.close(); srv.close()
console.log(`\n📂 ${OUT}`)
