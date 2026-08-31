// ☁️🔀 클라우드 로그인 «공개 스위치» — 창업자 폰에서만 보이나 (2026-08-31)
//
// 📮 창업자 = *"배포하면 이미 깔린 폰에 즉시 반영되고 되돌릴 창이 없다(TWA)"* → 「운영자 스위치로 먼저」
//
// ⭐⭐ 이 판이 지키는 것 = **유저 화면에 로그인 입구가 «하나도» 안 보인다.**
//    ⛔ 한 자리만 막으면 다른 자리로 샌다 — v11.02 「책갈피」가 정확히 그 사고였다(이름이 일곱 곳).
//    그래서 입구 «셋»을 한 판에서 다 본다: ①첫 화면(CloudGate) ②홈 한 줄 ③설정 카드
//
// 🧪 규칙 12 = 스위치를 지우면(=`클라우드보임` 을 늘 true 로) ①②③이 유저에게 보여 **죽는다**.
import { chromium } from 'playwright'
import http from 'node:http'
import { readFileSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { SEED_COACH_SEEN } from '../src/coach.js'

const ROOT = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json' }
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p.startsWith('/hankki/')) p = p.slice(7)
  const f = join(ROOT, p === '/' ? 'index.html' : p)
  try { statSync(f); res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)) }
  catch { res.writeHead(404); res.end('nope') }
})
await new Promise((r) => srv.listen(4632, r))

const 씨앗쓰던사람 = () => {
  localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:coach:home', '1')
  localStorage.setItem('hankki:v1', JSON.stringify({
    recipes: [{ id: 'u1', title: '내가 쓴 레시피', ingredients: [], steps: [] }],
    folders: [], profile: { name: '한끼러버', bio: '' }, shops: [], wishlist: [],
    shoppingList: [], pantry: [], diary: [], seedV: 999, memoCleanV: 9, removedSeedIds: [],
  }))
}

const b = await chromium.launch()
const errs = []
let 통과 = 0, 전체 = 0
const 칸 = (좋나, 이름, 덧 = '') => { 전체++; if (좋나) 통과++; console.log(`${좋나 ? '✅' : '⛔'} ${이름}${덧 ? ' — ' + 덧 : ''}`) }

async function 창 (운영자, init) {
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await ctx.route('**/*.googleapis.com/**', (r) => r.abort())
  await ctx.route('**/*.gstatic.com/**', (r) => r.abort())
  const pg = await ctx.newPage()
  pg.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message))
  await pg.addInitScript(SEED_COACH_SEEN)
  // ⭐ 운영자 표식 = `?founder=…` 로 들어온 기기에 저장되는 그 값(`ocr.js:68` 과 같은 열쇠)
  if (운영자) await pg.addInitScript(() => localStorage.setItem('hankki:founder', '테스트열쇠'))
  if (init) await pg.addInitScript(init)
  await pg.goto('http://localhost:4632/hankki/', { waitUntil: 'domcontentloaded' })
  await pg.waitForTimeout(1500)
  return { ctx, pg }
}

// 설정 화면까지 가서 「클라우드 저장」 카드가 있나 — ⛔글자로 찾되 «설정 화면에 도착했나»를 먼저 잰다(규칙 18 ⓘ)
async function 설정에클라우드있나 (pg) {
  await pg.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /설정/.test(x.getAttribute('aria-label') || ''))
    if (b) b.click()
  })
  await pg.waitForTimeout(900)
  const 글 = await pg.textContent('body')
  const 도착 = /백업|테마|의견 보내기/.test(글)
  return { 도착, 있나: /클라우드 저장/.test(글) }
}

console.log('── ⓐ 보통 유저(운영자 표식 없음) — 입구 셋이 «전부» 없어야 한다 ──')
{
  const { ctx, pg } = await 창(false)          // 새로 깐 사람
  const 글 = await pg.textContent('body')
  칸(!/Google 계정으로 시작하기/.test(글), '① 첫 화면에 로그인 화면이 «안» 뜬다')
  칸(/건너뛰기|시작하기/.test(글), '  (도착 확인) 소개 화면엔 제대로 왔다')
  await ctx.close()
}
{
  const { ctx, pg } = await 창(false, 씨앗쓰던사람)   // 이미 쓰던 사람
  const 글 = await pg.textContent('body')
  칸(!/지금은 레시피·일기가 이 폰에만 있어요/.test(글), '② 홈 한 줄이 «안» 뜬다')
  const s = await 설정에클라우드있나(pg)
  칸(s.도착, '  (도착 확인) 설정 화면에 왔다')
  칸(s.도착 && !s.있나, '③ 설정에 「클라우드 저장」 카드가 «없다»')
  await ctx.close()
}

console.log('\n── ⓑ 창업자 폰(운영자 표식 있음) — 입구 셋이 «전부» 보여야 한다 ──')
{
  const { ctx, pg } = await 창(true)
  const 글 = await pg.textContent('body')
  칸(/Google 계정으로 시작하기/.test(글), '① 첫 화면에 로그인이 뜬다')
  await ctx.close()
}
{
  const { ctx, pg } = await 창(true, 씨앗쓰던사람)
  const 글 = await pg.textContent('body')
  칸(/지금은 레시피·일기가 이 폰에만 있어요/.test(글), '② 홈 한 줄이 뜬다')
  const s = await 설정에클라우드있나(pg)
  칸(s.도착 && s.있나, '③ 설정에 「클라우드 저장」 카드가 있다')
  await ctx.close()
}

console.log(`\n${통과}/${전체} 통과 · 자바스크립트 오류 = ${errs.length ? errs.join(' / ') : '0'}`)
await b.close(); srv.close()
process.exit(통과 === 전체 && !errs.length ? 0 : 1)
