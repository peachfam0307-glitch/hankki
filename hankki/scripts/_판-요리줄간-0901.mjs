// 📐↕️ **요리모드 걸음 글자 «줄간»을 얼마나 늘릴까** (창업자 2026-09-01)
//
// 📮 창업자 원문 = *"만드는 법 줄간을 좀 더 늘리자."* → 되물으니 **「요리모드 (지금 보던 판)」** (규칙 25)
//    ⭐ 「만드는 법」은 레시피 «상세»의 절 이름이기도 해서 콕 집어 물었다. 상세는 안 건드린다.
//
// 🔢 **네 화면 × 줄간 후보 × 제일 «키 큰» 걸음** — 늘리면 세로로 자라니 **스크롤이 관문**이다.
//    ⛔ 패드만 보고 정하면 안 된다 — 폰(390×844)은 자리가 빠듯하고,
//       `styles.css` 요리모드 절에 *"28px 는 964걸음 전수로 스크롤 0 을 확인해 정한 값"* 이라 적혀 있다.
//    ⭐ 그래서 «걸음 전수»로 스크롤을 센다(대표 하나로 재면 제일 긴 걸음을 놓친다).
//
// ⛔ 소스를 안 고친다 — 살아 있는 화면에 얹어 잰다(절대원칙 30).
//
// 실행: node /home/user/hankki/hankki/scripts/_판-요리줄간-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { 레시피들 } from './recipe.mjs'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/줄간'
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

const 걸음들 = []
for (const r of 레시피들()) for (const s of (r.steps || [])) {
  const 첫줄 = String(s).split('\n')[0].trim()
  if (첫줄) 걸음들.push(첫줄)
}
const 후보들 = [1.5, 1.6, 1.7, 1.8, 1.9]

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

async function 요리모드로(폭, 높이) {
  const ctx = await b.newContext({ viewport: { width: 폭, height: 높이 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1200)
  for (let i = 0; i < 3; i++) { if (!(await p.locator('.sheet-mask').count())) break; await p.keyboard.press('Escape'); await p.waitForTimeout(400) }
  await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click().catch(() => {})
  await p.waitForTimeout(1000)
  const 카드 = p.locator('.screen button, .screen [role="button"], .screen a').filter({ hasText: /[가-힣]/ })
  const n = Math.min(await 카드.count(), 14)
  for (let i = 0; i < n; i++) {
    await 카드.nth(i).click().catch(() => {}); await p.waitForTimeout(800)
    if (await p.locator('[data-coach="cook"]').count()) break
    await p.goBack().catch(() => {}); await p.waitForTimeout(600)
  }
  if (!(await p.locator('[data-coach="cook"]').count())) return { ctx, p, 됐나: false }
  await p.locator('[data-coach="cook"]').first().click(); await p.waitForTimeout(1200)
  for (let i = 0; i < 4; i++) {
    if (await p.locator('.cook-steptext').count()) break
    await p.locator('button, [role="button"]').filter({ hasText: /다음|시작/ }).last().click().catch(() => {}); await p.waitForTimeout(700)
  }
  return { ctx, p, 됐나: await p.locator('.cook-steptext').count() > 0 }
}

const 기기 = [
  { id: 'small', 이름: '작은 폰 360×640', 폭: 360, 높이: 640 },
  { id: 'phone', 이름: '폰 390×844', 폭: 390, 높이: 844 },
  { id: 'pad', 이름: '패드 세로 820×1180', 폭: 820, 높이: 1180 },
  { id: 'padland', 이름: '패드 가로 1180×820', 폭: 1180, 높이: 820 },
]

let 죽음 = 0
for (const g of 기기) {
  const { ctx, p, 됐나 } = await 요리모드로(g.폭, g.높이)
  if (!됐나) { console.error(`✗ ${g.이름} — 요리모드를 못 열었다`); 죽음++; await ctx.close(); continue }

  const 기본 = await p.evaluate(() => {
    const e = document.querySelector('.cook-steptext'), body = document.querySelector('.cook-body')
    const cs = getComputedStyle(e)
    return { 크기: cs.fontSize, 줄간: cs.lineHeight, 본문키: Math.round(body.clientHeight) }
  })
  console.log(`\n── ${g.이름} ── 글자 ${기본.크기} · 지금 줄 높이 ${기본.줄간} · 본문이 쓸 수 있는 키 ${기본.본문키}px`)

  const 잰값 = await p.evaluate(({ 걸음들, 후보들 }) => {
    const el = document.querySelector('.cook-steptext'), body = document.querySelector('.cook-body')
    const 원래글 = el.innerHTML, 원래줄간 = el.style.lineHeight
    const out = []
    for (const lh of 후보들) {
      el.style.lineHeight = String(lh)
      let 스크롤 = 0, 최대줄 = 0
      let 제일큰넘침 = 0, 제일큰걸음 = ''
      const 줄높이 = parseFloat(getComputedStyle(el).lineHeight)
      for (const t of 걸음들) {
        el.textContent = t
        const 줄 = Math.max(1, Math.round(el.getBoundingClientRect().height / 줄높이))
        if (줄 > 최대줄) 최대줄 = 줄
        const 넘침 = body.scrollHeight - body.clientHeight
        if (넘침 > 1) { 스크롤 += 1; if (넘침 > 제일큰넘침) { 제일큰넘침 = 넘침; 제일큰걸음 = t } }
      }
      out.push({ 줄간: lh, 줄높이: Math.round(줄높이 * 10) / 10, 스크롤, 최대줄, 제일큰넘침: Math.round(제일큰넘침), 제일큰걸음 })
    }
    el.style.lineHeight = 원래줄간; el.innerHTML = 원래글
    return out
  }, { 걸음들, 후보들 })

  for (const r of 잰값) {
    const 나쁨 = r.스크롤 > 0
    if (나쁨) 죽음++
    console.log(
      `   줄간 ${r.줄간.toFixed(2)} (줄 높이 ${String(r.줄높이).padStart(5)}px) │ 최다 ${r.최대줄}줄 │ ` +
      (나쁨 ? `⛔ 스크롤 ${r.스크롤}걸음 (최대 ${r.제일큰넘침}px 넘침)` : '✅ 스크롤 0')
    )
  }

  // 📸 패드 가로만 눈으로 (절대원칙 21) — 두 줄이 되는 걸음으로
  if (g.id === 'padland') {
    const 두줄걸음 = '물 500ml, 간장 4큰술·원당 3큰술·미림 3큰술·다진 마늘 2큰술·와사비 1작은술을 섞어 소스를 만들어요.'
    for (const lh of [1.5, 1.7, 1.9]) {
      await p.evaluate(({ lh, t }) => {
        const el = document.querySelector('.cook-steptext')
        el.style.lineHeight = String(lh); el.style.maxWidth = '820px'; el.style.textWrap = 'balance'; el.textContent = t
      }, { lh, t: 두줄걸음 })
      await p.waitForTimeout(250)
      await p.screenshot({ path: join(OUT, `줄간-${String(lh).replace('.', '_')}.png`) })
    }
  }
  await ctx.close()
}
await b.close(); srv.close()

console.log(죽음 === 0
  ? `\n✅ 후보 ${후보들.length}개 × 네 화면 전부 스크롤 0 — 어디까지 늘려도 «자리»는 된다`
  : `\n⛔ ${죽음}칸이 걸렸다 — 그 줄간은 못 쓴다`)
console.log(`\n📁 ${OUT}`)
