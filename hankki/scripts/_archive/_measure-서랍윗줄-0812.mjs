// 📏 서랍 «위쪽 고정 줄»이 자리를 얼마나 먹나 — 그리고 꼬르곰은 어디 있나
//    📮 창업자 2026-08-12 *"나는 제목을 접는건 줄 알았는데 (프ㄹ레임 마테 등등). 얘들 높이도 줄이자니까.."*
//       ＋ *"꼬르곰은 어디있어?"*
//    ⛔ 내가 「접기」를 «그룹 이름표»로 읽었다. 창업자가 말한 건 «탭 줄(프레임·마테…)의 높이»다.
//    ⭐ 그래서 잰다 — 스티커가 나오기 «전»에 무엇이 몇 px 을 먹고 있나.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = M[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4412, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2 })
await ctx.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
  localStorage.setItem('hankki:giftSheetSeen', '1')
})
await ctx.addInitScript({ content: SEED_COACH_SEEN })
const pg = await ctx.newPage()
const 닫기 = async () => {
  for (const t of ['나중에', '닫기']) {
    const x = pg.getByRole('button', { name: t }).first()
    if (await x.count() && await x.isVisible().catch(() => false)) { await x.click().catch(() => {}); await pg.waitForTimeout(180) }
  }
}
await pg.goto('http://127.0.0.1:4412/hankki/', { waitUntil: 'networkidle' }); await pg.waitForTimeout(1000); await 닫기()
await pg.locator('.grid-card').first().click(); await pg.waitForTimeout(800); await 닫기()
await pg.getByRole('button', { name: /꾸미기/ }).first().click(); await pg.waitForTimeout(1000); await 닫기()
await pg.getByRole('button', { name: '글자', exact: true }).first().click(); await pg.waitForTimeout(600)

// 📏 서랍 맨 위 → 첫 스티커 칸까지, 무엇이 몇 px 을 먹나
const 자 = await pg.evaluate(() => {
  const dr = document.querySelector('.decor-drawer')
  const sc = document.querySelector('.decor-scroll')
  const top = dr.getBoundingClientRect().top
  const 줄 = []
  const 재기 = (el, 이름) => { if (!el) return; const r = el.getBoundingClientRect(); 줄.push({ 이름, y: Math.round(r.top - top), h: Math.round(r.height) }) }
  재기(dr.querySelector('.segment, .decor-tabs'), '탭 줄(속지·글쓰기·일꾸·레꾸)')
  // 갈래 칩 줄 — 「배경 프레임 마테 데코 글자 친구들 재료」
  const 칩줄 = [...dr.querySelectorAll('div')].find((d) => {
    const t = (d.textContent || '')
    return /프레임/.test(t) && /마테/.test(t) && /데코/.test(t) && d.querySelectorAll('button').length >= 5 && d.querySelectorAll('button').length <= 10
  })
  재기(칩줄, '갈래 칩 줄(프레임·마테·데코…)')
  재기(dr.querySelector('.decor-quick'), '선물 줄')
  const 되돌리기 = [...dr.querySelectorAll('button')].find((x) => /되돌리기/.test(x.textContent || ''))
  재기(되돌리기, '배경 음식 아이콘 되돌리기')
  const 첫칸 = sc.querySelector('.decor-cell')
  재기(첫칸, '⭐ 첫 스티커 칸')
  // 꼬르곰 두 그룹
  const base = sc.getBoundingClientRect().top - sc.scrollTop
  const f = (t) => [...sc.querySelectorAll('.decor-sec-label')].find((e) => (e.textContent || '').includes(t))
  const 반응 = f('반응 · 별점'), 조리 = f('조리법 · 기록')
  return {
    서랍: Math.round(dr.getBoundingClientRect().height),
    굴칸: sc.clientHeight, 담긴것: sc.scrollHeight,
    굴칸y: Math.round(sc.getBoundingClientRect().top - top),
    줄,
    꼬르곰: { 반응: 반응 ? Math.round(반응.getBoundingClientRect().top - base) : null,
      조리법: 조리 ? Math.round(조리.getBoundingClientRect().top - base) : null },
    이름표높이: [...sc.querySelectorAll('.decor-sec-label')].map((e) => Math.round(e.getBoundingClientRect().height))[0],
    화살표: (() => { const s = document.querySelector('.decor-sec-label span[aria-hidden]'); if (!s) return null
      const r = s.getBoundingClientRect(); return { w: Math.round(r.width), fs: getComputedStyle(s).fontSize } })(),
  }
})
console.log('\n📏 레꾸 「글자」 탭 · 폰 411×891')
console.log(`   서랍 전체 ${자.서랍}px · 그중 굴러가는 칸 ${자.굴칸}px (서랍 맨 위에서 ${자.굴칸y}px 아래부터)`)
console.log(`   담긴 것 ${자.담긴것}px = ${(자.담긴것 / 자.굴칸).toFixed(1)} 화면\n`)
console.log('   ── 스티커가 나오기 «전»에 자리를 먹는 줄 ──')
for (const r of 자.줄) console.log(`   y ${String(r.y).padStart(4)}  높이 ${String(r.h).padStart(3)}px   ${r.이름}`)
const 첫칸 = 자.줄.find((r) => r.이름.includes('첫 스티커'))
if (첫칸) console.log(`\n   ⛔ 스티커 한 칸이 나올 때까지 ${첫칸.y}px 을 «고르는 줄»이 먹는다 (서랍 ${자.서랍}px 의 ${Math.round(첫칸.y / 자.서랍 * 100)}%)`)
console.log(`\n🐻 꼬르곰 32컷 — 굴칸 맨 위에서`)
console.log(`   「반응 · 별점」  ${자.꼬르곰.반응}px   ${자.꼬르곰.반응 > 자.굴칸 ? '⛔ 굴칸(' + 자.굴칸 + 'px) 밖 — 굴려야 보인다' : '✅ 안 굴려도 보인다'}`)
console.log(`   「조리법 · 기록」 ${자.꼬르곰.조리법}px  ${자.꼬르곰.조리법 > 자.굴칸 ? '⛔ 굴칸 밖' : '✅'}`)
console.log(`\n▾ 접기 화살표 = 폭 ${자.화살표?.w}px · 글자크기 ${자.화살표?.fs} · 이름표 줄 높이 ${자.이름표높이}px`)
console.log(`   📮 창업자 *"삼각형이 너무 작아서 … 그냥 글씨앞에 붙은 모양인줄"* — 재보니 맞다`)

// 📸 꼬르곰이 «어디»에 있는지 — 굴려서 찍는다
await pg.evaluate(() => {
  const sc = document.querySelector('.decor-scroll')
  const f = [...sc.querySelectorAll('.decor-sec-label')].find((e) => (e.textContent || '').includes('반응 · 별점'))
  if (f) sc.scrollTop = f.offsetTop - 8
})
await pg.waitForTimeout(400)
await pg.screenshot({ path: join(OUT, '꼬르곰-어디있나.png'), clip: await pg.locator('.decor-drawer').first().boundingBox() })
console.log('\n📸 /꼬르곰-어디있나.png — 굴려서 꼬르곰이 나온 화면')
await b.close(); srv.close(); process.exit(0)
