// 📸 창업자가 짚은 «그 줄»을 그대로 찍는다 — 「…미림 3큰술· / 다진 마늘 2큰술…」 (2026-09-01)
//
// 📮 창업자 원문 = *"2줄이 좋은데 **다진/ 마늘이네..**"* →
//    *"**3큰술 · 다진마늘이잖아. 그럼 다진마늘부터 줄이 바뀌어야지. ·를 기준으로**"*
//
// ⛔⛔ **그 줄이 든 편(「항정수육」)은 `from: '2026-11-09'` 라 오늘 앱엔 «없다».**
//    ⭐ 그래서 **앱의 시계를 11/10 으로 돌려 둔다** — 내가 레시피를 심는 게 아니라
//       **앱의 날짜 문이 스스로 연다.** 화면을 그리는 코드는 한 줄도 안 바꾼다(절대원칙 30).
//    ⛔ `Date` 를 바꾸는 것은 **찍을 때만** 이다. 앱 코드·레시피 글자는 그대로다.
//
// ⚠️ 이 판은 «보여주기»용이라 통과·실패를 판정하지 않는다.
//    판정 게이트는 `_shot-요리글씨확정-0901.mjs` 다(거기가 네 화면을 재고 막는다).
//
// 실행: node /home/user/hankki/hankki/scripts/_shot-가운뎃점-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/확정판'
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
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 })

// ⏰ 앱 시계를 11/10 으로 — 날짜 문이 「항정수육」(11/09)을 스스로 연다
await ctx.addInitScript(() => {
  const 진짜 = Date
  const 어긋남 = new 진짜('2026-11-10T09:00:00+09:00').getTime() - 진짜.now()
  function 가짜(...a) { return a.length ? new 진짜(...a) : new 진짜(진짜.now() + 어긋남) }
  가짜.prototype = 진짜.prototype
  가짜.now = () => 진짜.now() + 어긋남
  가짜.parse = 진짜.parse; 가짜.UTC = 진짜.UTC
  window.Date = 가짜
})
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })

const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(1200)
for (let i = 0; i < 3; i++) { if (!(await p.locator('.sheet-mask').count())) break; await p.keyboard.press('Escape'); await p.waitForTimeout(400) }

await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click().catch(() => {})
await p.waitForTimeout(1000)
const 카드 = p.locator('.screen button, .screen [role="button"], .screen a').filter({ hasText: '항정수육' })
if (!(await 카드.count())) { console.error('✗ 「항정수육」을 못 찾았다 — 날짜 문이 안 열렸을 수 있다'); await b.close(); srv.close(); process.exit(1) }
await 카드.first().click(); await p.waitForTimeout(900)
await p.locator('[data-coach="cook"]').first().click(); await p.waitForTimeout(1200)

// 「다진 마늘」이 든 걸음이 나올 때까지 다음
let 잰것 = null
for (let i = 0; i < 14; i++) {
  잰것 = await p.evaluate(() => {
    const e = document.querySelector('.cook-steptext')
    if (!e || !e.innerText.includes('다진 마늘')) return null
    // 📏 줄이 «어디서» 갈렸나 — 글자 하나씩 세로 자리를 재서 줄머리를 찾는다
    const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT)
    const 줄 = []; let 앞top = null
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const t = n.textContent
      for (let k = 0; k < t.length; k++) {
        const r = document.createRange(); r.setStart(n, k); r.setEnd(n, k + 1)
        const b = r.getClientRects()[0]; if (!b) continue
        if (앞top === null || b.top > 앞top + 4) { 줄.push(''); 앞top = b.top }
        줄[줄.length - 1] += t[k]
      }
    }
    return { 줄, 폭: Math.round(e.getBoundingClientRect().width), 묶인항목: [...e.querySelectorAll('span')].filter((s) => getComputedStyle(s).whiteSpace === 'nowrap').length }
  })
  if (잰것) break
  // ⛔ 첫 화면 단추는 「다음」이 아니라 **「재료 준비 완료 · 시작 →」** 이다 — 「다음」만 찾으면 영영 못 넘어간다
  const 다음 = p.locator('button, [role="button"]').filter({ hasText: /^다음|재료 준비 완료/ }).last()
  if (!(await 다음.count())) break
  await 다음.click().catch(() => {}); await p.waitForTimeout(350)
}

if (!잰것) console.error('✗ 「다진 마늘」이 든 걸음을 못 만났다')
else {
  console.log(`\n── 패드 가로 1180×820 · 글줄 폭 ${잰것.폭}px · 묶인 항목 ${잰것.묶인항목}개 ──`)
  잰것.줄.forEach((l, i) => console.log(`  ${i + 1}줄 │ ${l}`))
  const 갈림 = 잰것.줄.slice(1).some((l) => /^마늘|^ ?마늘/.test(l.trim()))
  console.log(갈림 ? '\n⛔ 「다진 / 마늘」이 아직 갈린다' : '\n✅ 「다진 마늘」이 한 덩어리로 붙어 있다')
}
await p.screenshot({ path: join(OUT, 'padland-다진마늘.png') })
await b.close(); srv.close()
