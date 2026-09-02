// 🍳✍️ **요리모드 «재료 준비» 화면 — 귀염체로 바뀌었나** (2026-09-01)
//
// 📮 창업자 = *"요리모드 첨에 재료나오는 화면도 글씨체 귀염체?로 바꿔야함."*
//
// ⭐ 숫자만 보고 끝내지 않는다 — **찍어서 눈으로 본다**(절대원칙 21).
//    ＋ 「진짜 Gaegu 가 그려졌나」는 화면 글자로는 못 안다 → `document.fonts.check` 로 «파일이 왔나»까지 본다.
// ⛔ 레시피 «상세»의 재료 줄은 «안» 바뀌어야 한다 — 창업자가 말한 화면이 아니다. 그것도 같이 잰다.
//
// 실행: node /home/user/hankki/hankki/scripts/_shot-재료귀염체-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/재료귀염체'
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
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(2200)
for (let i = 0; i < 3; i++) { if (!(await p.locator('.sheet-mask').count())) break; await p.keyboard.press('Escape'); await p.waitForTimeout(350) }

await p.locator('.nav-item', { hasText: '레시피' }).first().click()
await p.waitForTimeout(900)
await p.evaluate(() => {
  const c = [...document.querySelectorAll('button, a')].find((x) => x.querySelector('img') && (x.innerText || '').trim().length > 1)
  c?.click()
})
await p.waitForTimeout(1100)

// 📏 ① 상세의 재료 줄 — «안» 바뀌어야 한다
const 상세 = await p.evaluate(() => {
  const e = document.querySelector('.ing:not(.cook-ing)')
  if (!e) return null
  const s = getComputedStyle(e)
  return { 글씨체: s.fontFamily, 크기: s.fontSize, 획: s.webkitTextStrokeWidth, 글: (e.innerText || '').trim().slice(0, 24) }
})
await p.screenshot({ path: join(OUT, '1-상세-재료.png') })

// 🍳 요리 시작
const 들어감 = await p.evaluate(() => {
  // ⛔ 이름을 짐작하지 않는다 — 실물은 「요리모드 시작」이다(`RecipeDetailScreen.jsx:788`)
  const c = [...document.querySelectorAll('button')].find((x) => /요리모드 시작/.test((x.innerText || '').trim()))
  if (!c) return null; c.click(); return (c.innerText || '').trim()
})
await p.waitForTimeout(1400)
if (!들어감) { console.error('✗ 요리 시작 단추를 못 찾았다 — ⛔여기서 판정하지 않는다'); await b.close(); srv.close(); process.exit(2) }

// 📏 ② 요리모드 재료 줄 — 귀염체라야 한다
const 요리 = await p.evaluate(async () => {
  await document.fonts.ready
  const e = document.querySelector('.cook-ing')
  if (!e) return null
  const s = getComputedStyle(e)
  return {
    글씨체: s.fontFamily, 크기: s.fontSize, 획: s.webkitTextStrokeWidth, 굵기: s.fontWeight,
    // ⭐⭐ 「이름만 적힌 것」과 「진짜 그려진 것」은 다르다 — **글자 폭으로** 본다.
    //   ⛔⛔ `document.fonts.check()` 는 **못 쓴다.** 글자를 안 주면 라틴 샘플("BESbswy")로 재는데
    //      우리 Gaegu 는 «한글 부분집합» 파일이라 그 글자가 없어 **멀쩡히 그려지는데도 「안 왔다」**가 나온다.
    //      글자를 줘도 그대로였다(라틴·한글 두 @font-face 가 unicode-range 없이 겹쳐 있다).
    //      → 캡처를 열어 보고서야 알았다(절대원칙 21). 검사가 «무엇을 보는지»를 본 것이다(규칙 18 ⓘ).
    //   ✅ 대신 우리 저장소가 이미 재둔 사실을 쓴다 — **Pretendard 가 Gaegu 보다 14.7% 넓다**
    //      (`styles.css:2337` · `_probe-옛표왜틀렸나-0901`). 글씨체를 갈아끼워 폭이 «달라지면» 진짜 Gaegu 다.
    폰트옴: (() => {
      const 잰다 = () => { const r = document.createRange(); r.selectNodeContents(e); return r.getBoundingClientRect().width }
      const 지금 = 잰다()
      const 원래 = e.style.fontFamily
      e.style.fontFamily = 'Pretendard, sans-serif'
      const 대조 = 잰다()
      e.style.fontFamily = 원래
      return Math.abs(지금 - 대조) > 2
    })(),
    글: (e.innerText || '').trim().slice(0, 24),
    줄수: document.querySelectorAll('.cook-ing').length,
  }
})
await p.screenshot({ path: join(OUT, '2-요리모드-재료준비.png') })

console.log('\n📖 레시피 «상세» 재료 줄 (⛔안 바뀌어야 한다)')
console.log('  ', 상세 ? `${상세.글씨체.split(',')[0]} · ${상세.크기} · 획 ${상세.획} · 「${상세.글}」` : '⛔ 못 찾았다')
console.log('\n🍳 요리모드 «재료 준비» 줄 (✅귀염체라야 한다)')
console.log('  ', 요리 ? `${요리.글씨체.split(',')[0]} · ${요리.크기} · 획 ${요리.획} · 굵기 ${요리.굵기} · 줄 ${요리.줄수}개 · 「${요리.글}」` : '⛔ 못 찾았다')
console.log('   폰트 파일이 실제로 왔나 =', 요리?.폰트옴 ? '✅ 왔다' : '⛔ 안 왔다(이름만 적힌 것이다)')

const ok = 요리 && /Gaegu/.test(요리.글씨체) && 요리.폰트옴 && 상세 && !/Gaegu/.test(상세.글씨체)
console.log(`\n${ok ? '✅' : '⛔'} 판정 = ${ok ? '요리모드만 귀염체 · 상세는 그대로' : '어긋났다'}`)
console.log(`🖼 캡처 = ${OUT}`)
await b.close(); srv.close()
process.exit(ok ? 0 : 1)
