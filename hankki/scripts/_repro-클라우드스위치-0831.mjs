// ☁️🔀 클라우드 로그인 «공개 스위치» — 지금은 «전체 공개»다 (2026-08-31)
//
// 📮 창업자 = *"배포하면 이미 깔린 폰에 즉시 반영되고 되돌릴 창이 없다(TWA)"* → 「운영자 스위치로 먼저」
//    → 폰↔패드 왕복을 실물로 다 돌려 본 뒤 = *"b로 만들고 문제없으면 스위치도 켜"* → **켰다(22:30)**
//
// ⭐⭐ 이 판이 지키는 것 = **입구 셋이 «같은 답»을 쓴다.**
//    ⛔ 한 자리만 열리거나 한 자리만 막히면 말이 갈린다 — v11.02 「책갈피」가 정확히 그 사고였다(이름이 일곱 곳).
//    입구 셋 = ①첫 화면(CloudGate) ②홈 한 줄 ③설정 카드
//
// ⛔⛔ **잣대가 2026-08-31 밤에 «뒤집혔다»** — 스위치를 켜기 전엔 「유저에게 하나도 안 보여야」였고
//    지금은 「유저에게 전부 보여야」다. 게이트가 빨간불이 된 것은 «고장»이 아니라 **잣대가 낡은 것**이었다.
//    📌 스위치를 다시 끄면 이 판의 ⓐ 를 도로 「안 보인다」로 뒤집는다. 그때 ⓒ 는 안 건드려도 된다.
//
// 🧪 규칙 12 = ⓒ 가 심장이다 — 입구 셋 중 하나라도 `클라우드보임()` 을 안 부르게 만들면 죽는다.
//    (스위치를 끄든 켜든 «셋이 함께» 움직여야 한다는 것이 진짜 지킬 것이다)
import { chromium } from 'playwright'
import http from 'node:http'
import { readFileSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { SEED_COACH_SEEN } from '../src/coach.js'

// ⛔⛔ 뿌리를 «이 컨테이너 경로»로 박으면 CI 에선 그 폴더가 없어 전부 404 → 화면이 영영 빈칸이 된다.
//    2026-08-31 배포가 두 번 그렇게 막혔다(#1965 · #1966). 다른 판들처럼 «이 파일 자리»에서 찾는다.
const ROOT = join(new URL('..', import.meta.url).pathname, 'dist')
const SRC = join(new URL('..', import.meta.url).pathname, 'src')
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
  // ⛔⛔ 고정 대기(1.5초)로 재면 «내 컴퓨터에선 통과하고 CI 에선 죽는다» — 2026-08-31 배포가 실제로 그렇게 막혔다.
  //    CI 러너가 느려 화면이 아직 비었는데 글자를 읽고 「입구가 없다」로 판정했다(도착 확인 칸이 그걸 잡아 줬다).
  // ✅ 시간이 아니라 «화면이 그려졌나»를 기다린다.
  await pg.waitForFunction(() => (document.body?.innerText || '').trim().length > 30, null, { timeout: 30000 })
  await pg.waitForTimeout(600)   // 첫 그림 뒤 상태가 한 번 더 도는 여유
  return { ctx, pg }
}

// 설정 화면까지 가서 「클라우드 저장」 카드가 있나 — ⛔글자로 찾되 «설정 화면에 도착했나»를 먼저 잰다(규칙 18 ⓘ)
async function 설정에클라우드있나 (pg) {
  await pg.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /설정/.test(x.getAttribute('aria-label') || ''))
    if (b) b.click()
  })
  // ⭐ 여기도 시간이 아니라 «설정 화면이 그려졌나»를 기다린다(CI 느림 대비)
  await pg.waitForFunction(() => /백업|테마|의견 보내기/.test(document.body?.innerText || ''), null, { timeout: 15000 }).catch(() => {})
  const 글 = await pg.textContent('body')
  const 도착 = /백업|테마|의견 보내기/.test(글)
  return { 도착, 있나: /클라우드 저장/.test(글) }
}

console.log('── ⓐ 보통 유저(운영자 표식 없음) — 전체 공개라 입구 셋이 «전부» 보여야 한다 ──')
{
  const { ctx, pg } = await 창(false)          // 새로 깐 사람
  const 글 = await pg.textContent('body')
  칸(/Google 계정으로 시작하기/.test(글), '① 첫 화면에 로그인이 뜬다')
  // 📷 오늘 편 안내 한 줄도 «같이» 본다 — 접힌 곳으로 다시 들어가면 유저가 사진 얘기를 영영 못 본다
  칸(/직접 넣은 사진은 저장되지 않아요/.test(글), '①-b 사진 안내가 «접히지 않고» 보인다')
  await ctx.close()
}
{
  const { ctx, pg } = await 창(false, 씨앗쓰던사람)   // 이미 쓰던 사람
  const 글 = await pg.textContent('body')
  칸(/지금은 레시피·일기가 이 폰에만 있어요/.test(글), '② 홈 한 줄이 뜬다')
  const s = await 설정에클라우드있나(pg)
  칸(s.도착, '  (도착 확인) 설정 화면에 왔다')
  칸(s.도착 && s.있나, '③ 설정에 「클라우드 저장」 카드가 있다')
  await ctx.close()
}

console.log('\n── ⓑ 창업자 폰(운영자 표식 있음) — 그대로 셋 다 보인다 ──')
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

console.log('\n── ⓒ 🧪 입구 셋이 «같은 답»을 쓰나 (소스) ──')
{
  const 읽기 = (p) => readFileSync(join(SRC, p), 'utf8')
  const nudges = 읽기('nudges.js')
  칸((nudges.match(/const 클라우드_전체공개/g) || []).length === 1, '④ 스위치 상수가 «한 곳»뿐이다')
  칸(/if \(클라우드_전체공개\) return true/.test(nudges) && /hankki:founder/.test(nudges),
    '⑤ 끄면 «운영자 표식»으로 되돌아가는 길이 남아 있다')
  const 자리들 = [['첫 화면', 'App.jsx'], ['홈 한 줄', 'screens/HomeScreen.jsx'], ['설정 카드', 'screens/ProfileScreen.jsx']]
  for (const [이름, p] of 자리들) 칸(/클라우드보임\(\)/.test(읽기(p)), `⑥ ${이름}이 «같은 답»(클라우드보임)을 쓴다`)
}

console.log(`\n${통과}/${전체} 통과 · 자바스크립트 오류 = ${errs.length ? errs.join(' / ') : '0'}`)
await b.close(); srv.close()
process.exit(통과 === 전체 && !errs.length ? 0 : 1)
