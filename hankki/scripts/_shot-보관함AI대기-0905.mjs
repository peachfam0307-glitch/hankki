// 📸 「AI 가 성공했을 때만 보관함을 졸업한다」 눈으로 보기 — 2026-09-05 (창업자 = *"ⓑ로 먼저 찍어서 보여줘"*)
//
// ⭐ 절대원칙 21 — 창업자에게 보여주기 «전»에 내가 열어서 본다.
// ⭐ 절대원칙 30 — 앱 코드는 «진짜»(dist)를 쓰고 «바깥 세계»(OCR 워커·AI 워커)만 가로챈다.
//    ⛔ 이 컨테이너는 workers.dev 를 못 부른다(403) — 그래서 흉내가 아니라 «가로채기»다.
//
// 찍는 것 — 두 갈래
//   Ⓐ AI 성공  ① 공유 직후(파서만 · 보관함에 «남아 있다»)  ② AI 끝난 뒤(레시피 탭으로 «저절로» 갔다)
//   Ⓑ AI 실패  ③ 실패 뒤에도 보관함에 «남아 있다»  ④ 그 편을 열자 만회 → ⑤ 레시피 탭에 «나왔다»
//
// 실행: SMOKE_CHROMIUM=… node scripts/_shot-보관함AI대기-0905.mjs   (그림 = $SHOT_DIR 또는 /tmp/shot-보관함AI대기-0905)
// 🏷 이름표 = 눈으로 보는 판 · smoke 아님
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = process.env.SHOT_DIR || '/tmp/shot-보관함AI대기-0905'
mkdirSync(OUT, { recursive: true })
const PORT = 4479
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(PORT, r))
const URL0 = `http://127.0.0.1:${PORT}/hankki/`

// 🔢 9/05 아침 창업자 캡처 그대로의 «모양» — 파서만 돌면 이렇게 나온다(앞 게시물 꼬리 ＋ 팬 광고문)
const 파서만글 = [
  '계속됩니다.. 커밍쑨',
  '[재료]',
  '바닥 5중, 옆면 3중에 커버도 묵직해 수분이 날아가는 걸',
  '스파게티면 200g',
  '[만드는 법]',
  '1. 이 팬은 열 보존이 정말 좋아요',
  '2. 지금 링크에서 확인하세요',
].join('\n')
// AI 가 «성공»하면 주는 답 (창업자 캡처 ② 의 모양)
const AI답 = {
  title: '얼큰 국물 파스타',
  ingredients: ['스파게티면 200g', '양파 1/2개', '마늘 3쪽', '고춧가루 1큰술', '토마토소스 1컵', '물 2컵', '치즈 약간'],
  steps: ['면을 삶아요', '양파·마늘을 볶아요', '고춧가루와 소스를 넣어요', '물을 붓고 끓여요', '면을 넣고 국물이 배게 해요', '치즈를 올려요'],
  model: 'shot',
}

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// 공유받기 = 서비스워커가 CacheStorage 에 넣어둔 것을 앱이 꺼내는 구조 → 같은 것을 우리가 넣는다
const 공유심기 = async (ctx) => {
  const p0 = await ctx.newPage()
  await p0.goto(URL0, { waitUntil: 'networkidle' })
  await p0.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1350
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 1080, 1350)
    x.fillStyle = '#222'; x.font = '36px sans-serif'; x.fillText('(인스타 캡처 흉내)', 60, 200)
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.8))
    const cache = await caches.open('hankki-shared')
    await cache.put('shared-meta', new Response(JSON.stringify({ hasImage: true, imageCount: 1, title: '', text: '', url: '' }), { headers: { 'content-type': 'application/json' } }))
    await cache.put('shared-image-0', new Response(blob, { headers: { 'content-type': 'image/jpeg' } }))
    localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
  })
  await p0.close()
}
const 가로채기 = (page, { AI, 지연 = 0, 셈 }) => {
  page.route('**/hankki-ocr.annyeong-hankki.workers.dev/**', (route) => {
    const body = route.request().postData() || ''
    if (/"기본"/.test(body)) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ 웰컴: 10, 매월: 5 }) })
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ text: 파서만글, left: { total: 9, unknown: false } }) })
  })
  page.route('**/hankki-tidy.annyeong-hankki.workers.dev/**', async (route) => {
    셈.AI++
    await new Promise((r) => setTimeout(r, 지연))
    if (!AI) return route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"shot_fail"}' })
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AI답) })
  })
}
const 상태 = (page) => page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  return (s.recipes || []).filter((r) => r.source === 'photo').slice(0, 3).map((r) => `${r.title} · status=${r.status} · tidyFail=${r.tidyFail ?? '-'} · 재료${(r.ingredients || []).length} 걸음${(r.steps || []).length}`)
})
const 레시피탭 = async (ctx, 파일) => {
  const p = await ctx.newPage()
  await p.goto(URL0, { waitUntil: 'networkidle' }); await p.waitForTimeout(2200)
  await p.evaluate(() => {
    const 바 = document.querySelector('.bottom-nav') || document.querySelector('nav')
    ;[...(바?.querySelectorAll('button') || [])].find((b) => (b.innerText || '').trim() === '레시피')?.click()
  })
  await p.waitForTimeout(1200); await p.screenshot({ path: join(OUT, 파일) })
  const 있나 = await p.evaluate(() => /얼큰 국물 파스타|계속됩니다/.test(document.body.innerText))
  await p.close(); return 있나
}
const 보관함 = async (ctx, 파일) => {
  const p = await ctx.newPage()
  await p.goto(URL0, { waitUntil: 'networkidle' }); await p.waitForTimeout(2200)
  await p.getByRole('button', { name: /임시보관함/ }).first().click().catch(() => {})
  await p.waitForTimeout(900); await p.screenshot({ path: join(OUT, 파일) })
  const 줄 = await p.evaluate(() => [...document.querySelectorAll('.inbox-row')].map((e) => e.innerText.replace(/\n/g, ' / ').slice(0, 80)))
  await p.close(); return 줄
}

// ═══ Ⓐ AI 성공 ═══════════════════════════════════════════════
console.log('\nⒶ AI 가 «성공»하는 날')
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await 공유심기(ctx)
  const 셈 = { AI: 0 }
  const p = await ctx.newPage(); p.on('pageerror', (e) => console.log('  ⚠️ pageerror:', e.message))
  가로채기(p, { AI: true, 지연: 7000, 셈 })
  await p.goto(URL0, { waitUntil: 'load' })          // ⛔ networkidle 은 AI 답까지 기다려 «도는 중»을 못 찍는다
  await p.waitForTimeout(3500)                       // OCR 끝 · 파서 채움 · AI 는 아직 도는 중
  await p.screenshot({ path: join(OUT, 'A1-공유직후-AI도는중.png') })
  console.log('  ① 공유 직후 =', (await 상태(p)).join(' | ') || '(없음)')
  await p.waitForTimeout(7000)                       // AI 답이 온다
  await p.screenshot({ path: join(OUT, 'A2-AI끝난뒤-그자리.png') })
  console.log('  ② AI 뒤   =', (await 상태(p)).join(' | '), '· AI 부른 횟수', 셈.AI)
  console.log('  ②-보관함 =', JSON.stringify(await 보관함(ctx, 'A3-AI끝난뒤-보관함.png')))
  console.log('  ②-레시피탭에 있나 =', await 레시피탭(ctx, 'A4-AI끝난뒤-레시피탭.png'))
  await ctx.close()
}

// ═══ Ⓑ AI 실패 → 나중에 열면 만회 ════════════════════════════
console.log('\nⒷ AI 가 «실패»하는 날 → 그 편을 열면 만회')
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await 공유심기(ctx)
  const 셈 = { AI: 0 }
  const p = await ctx.newPage(); p.on('pageerror', (e) => console.log('  ⚠️ pageerror:', e.message))
  가로채기(p, { AI: false, 지연: 300, 셈 })
  await p.goto(URL0, { waitUntil: 'load' })
  await p.waitForTimeout(6000)                       // OCR → 파서 → AI 실패(재시도 포함)
  await p.screenshot({ path: join(OUT, 'B1-AI실패-그자리.png') })
  console.log('  ③ AI 실패 뒤 =', (await 상태(p)).join(' | '), '· AI 부른 횟수', 셈.AI)
  console.log('  ③-보관함 =', JSON.stringify(await 보관함(ctx, 'B2-AI실패-보관함.png')))
  await p.close()

  // 그 편을 «연다» — 이번엔 AI 가 된다 → 만회 → 졸업
  const p2 = await ctx.newPage(); p2.on('pageerror', (e) => console.log('  ⚠️ pageerror:', e.message))
  가로채기(p2, { AI: true, 지연: 500, 셈 })
  await p2.goto(URL0, { waitUntil: 'networkidle' }); await p2.waitForTimeout(2200)
  await p2.getByRole('button', { name: /임시보관함/ }).first().click().catch(() => {})
  await p2.waitForTimeout(900)
  await p2.evaluate(() => { const 줄 = document.querySelector('.inbox-row'); 줄?.click() })
  await p2.waitForTimeout(3500)
  await p2.screenshot({ path: join(OUT, 'B3-열어서-만회.png') })
  console.log('  ④ 열어서 만회 =', (await 상태(p2)).join(' | '), '· AI 부른 횟수', 셈.AI)
  await p2.close()
  console.log('  ⑤-보관함 =', JSON.stringify(await 보관함(ctx, 'B4-만회뒤-보관함.png')))
  console.log('  ⑤-레시피탭에 있나 =', await 레시피탭(ctx, 'B5-만회뒤-레시피탭.png'))
  await ctx.close()
}

// ═══ Ⓒ AI 실패 → 보관함 「AI로 다듬기」 단추 (창업자 2026-09-05 ㄱㄱ) ═══
console.log('\nⒸ AI 가 «실패»하는 날 → 보관함에서 「AI로 다듬기」 단추')
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await 공유심기(ctx)
  const 셈 = { AI: 0 }
  const p = await ctx.newPage(); p.on('pageerror', (e) => console.log('  ⚠️ pageerror:', e.message))
  가로채기(p, { AI: false, 지연: 300, 셈 })
  await p.goto(URL0, { waitUntil: 'load' })
  await p.waitForTimeout(6000)
  await p.close()

  const p2 = await ctx.newPage(); p2.on('pageerror', (e) => console.log('  ⚠️ pageerror:', e.message))
  가로채기(p2, { AI: true, 지연: 2500, 셈 })
  await p2.goto(URL0, { waitUntil: 'networkidle' }); await p2.waitForTimeout(2200)
  await p2.getByRole('button', { name: /임시보관함/ }).first().click().catch(() => {})
  await p2.waitForTimeout(900)
  await p2.screenshot({ path: join(OUT, 'C1-보관함-단추.png') })
  const 단추 = p2.getByRole('button', { name: /^AI로 다듬기$/ }).first()
  console.log('  ⑥ 단추 있나 =', await 단추.count())
  await 단추.click()
  await p2.waitForTimeout(800)
  await p2.screenshot({ path: join(OUT, 'C2-누른직후-다듬는중.png') })
  await p2.waitForTimeout(4000)
  await p2.screenshot({ path: join(OUT, 'C3-다듬은뒤-보관함.png') })
  console.log('  ⑦ 누른 뒤 =', (await 상태(p2)).join(' | '), '· AI 부른 횟수', 셈.AI)
  const 남은줄 = await p2.evaluate(() => document.querySelectorAll('.inbox-row').length)
  console.log('  ⑦-보관함 남은 줄 =', 남은줄)
  await p2.close()
  console.log('  ⑧-레시피탭에 있나 =', await 레시피탭(ctx, 'C4-다듬은뒤-레시피탭.png'))
  await ctx.close()
}

await b.close(); srv.close()
console.log('\n📁 ' + OUT)
