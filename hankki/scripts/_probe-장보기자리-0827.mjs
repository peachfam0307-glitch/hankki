/**
 * 🛒 스토어 스샷 「장보기」 장 — «담긴 리스트»가 보이는 자리를 잰다 (2026-08-27)
 *
 * 📮 창업자 = *"장보기는 재료 담긴 걸로 다시 찍어줘"*
 *
 * ⛔ 8/27 아침 판 = 아래 절반이 «빈 리스트»
 * ⛔ 그다음 판 = 리스트가 채워지자 화면이 길어져 **더 굴러 리스트가 아예 안 보였다**
 *    (굴리기 잣대가 「소개글이 사라질 때까지」라 «리스트가 어디 있나»를 안 본다 — 규칙 18 ⓘ)
 *
 * ⭐ 그래서 «자리»를 숫자로 잡는다 — 「장보기 리스트」 머리글이 화면 어디쯤 와야
 *    ⑴위에 제품 카드 한 장(담기·사러가기)이 남고 ⑵아래에 담긴 줄이 여럿 보이나.
 *
 * 쓰기: cd /home/user/hankki/hankki && node scripts/_probe-장보기자리-0827.mjs
 */
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4384, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch { /* noop */ } })
const p = await ctx.newPage()

const 홈으로 = async () => { await p.goto('http://127.0.0.1:4384/', { waitUntil: 'networkidle' }); await p.waitForTimeout(900) }
const 탭 = async (글자) => {
  const t = p.locator('.bottom-nav .nav-item').filter({ hasText: 글자 }).first()
  if (!(await t.count())) return false
  await t.click(); await p.waitForTimeout(1200); return true
}

// ── ① 레시피 재료를 «앱이 담는 길»로 담는다 ─────────────────────────
await 홈으로()
await 탭('레시피')
await p.locator('text=콩국수').first().click()
await p.waitForTimeout(800)
const 담기 = p.getByRole('button', { name: /장보기 담기/ }).first()
console.log(`「장보기 담기」 단추 = ${await 담기.count() ? '있다' : '⛔없다'}`)
if (await 담기.count()) { await 담기.click(); await p.waitForTimeout(1300) }
for (const 글자 of ['나중에 볼게요', '닫기']) {
  const b2 = p.getByRole('button', { name: 글자 }).first()
  if (await b2.count()) { await b2.click(); await p.waitForTimeout(700) }
}

// ── ② 저장된 값을 «직접» 읽는다 (넘겼나가 아니라 담겼나 · v11.00 교훈) ──
const 담긴것 = await p.evaluate(() => {
  try { return (JSON.parse(localStorage.getItem('hankki:v1') || '{}').shoppingList || []).map((x) => x.name) } catch { return null }
})
console.log(`담긴 줄 ${담긴것?.length ?? '읽기 실패'}개 — ${(담긴것 || []).join(' · ')}`)

// ── ③ 장보기 화면에서 「장보기 리스트」 머리글 자리를 굴려 가며 잰다 ──
await 홈으로()
await 탭('장보기')
const 카드담기 = p.locator('.cur-card').locator('button', { hasText: '담기' }).first()
if (await 카드담기.count()) { await 카드담기.click(); await p.waitForTimeout(900); console.log('제품 카드 「담기」 눌렀다') }

// ⛔ 「담기」를 누르면 스크롤이 어디로 가는지 모른다 — «맨 위로» 되돌리고 나서 잰다(규칙 18)
await p.evaluate(() => {
  for (const e of document.querySelectorAll('*')) { if (e.scrollHeight > e.clientHeight + 40) e.scrollTop = 0 }
  scrollTo(0, 0)
})
await p.waitForTimeout(600)
const { mkdirSync } = await import('node:fs')
const SHOT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/장보기자리'
mkdirSync(SHOT, { recursive: true })

console.log('\n굴린양   리스트머리   위에 보이는 카드   아래 보이는 줄   소개글')
for (let n = 0; n <= 14; n++) {
  const r = await p.evaluate(() => {
    const 머리 = [...document.querySelectorAll('h2,h3,div,span')]
      .find((e) => /장보기 리스트/.test(e.textContent || '') && (e.textContent || '').length < 20)
    const mt = 머리 ? Math.round(머리.getBoundingClientRect().top) : null
    const 카드 = [...document.querySelectorAll('.cur-card')]
      .filter((e) => { const b = e.getBoundingClientRect(); return b.top > -10 && b.bottom < innerHeight + 10 }).length
    const 줄 = [...document.querySelectorAll('li,[class*="shop-item"],[class*="check"]')]
      .filter((e) => { const b = e.getBoundingClientRect(); return b.top > (mt ?? 0) && b.bottom < innerHeight && b.height > 24 }).length
    const 소개 = [...document.querySelectorAll('div,p,span')]
      .filter((e) => /제휴 수수료|계속 올라와요/.test(e.textContent || '') && (e.textContent || '').length < 120)
      .some((e) => { const b = e.getBoundingClientRect(); return b.bottom > 0 && b.top < innerHeight })
    return { mt, 카드, 줄, 소개 }
  })
  console.log(`${String(n * 120).padStart(5)}px ${String(r.mt ?? '-').padStart(10)} ${String(r.카드).padStart(14)} ${String(r.줄).padStart(14)}   ${r.소개 ? '⛔보임' : '없음'}`)
  await p.screenshot({ path: `${SHOT}/${String(n * 120).padStart(4, '0')}.png` })
  await p.mouse.move(195, 500); await p.mouse.wheel(0, 120); await p.waitForTimeout(500)
}
await b.close(); srv.close()
