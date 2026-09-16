// 🙋‍♀️📊 [2026-09-16] 「우리 기기는 통계를 «아예 안 보낸다»」 — 재현판
//
// 📮 창업자 = *"아이폰 유저가 늘었을때 내폰이랑 섞이면 진짜 어려워지거든?? 네가 설계를 잘 해야해.."*
//           *"내가 레시피, 레꾸자랑 장보기등등 (아이폰으로) 열어보는 것들이 애널리틱스에 표시가 되거나 아예 안잡혀야해"*
// 🔢 설계 관문 통과 2026-09-16 21:2x — 잃던 것 = 창업자 아이폰 사용이 전부 유저 숫자에 섞임 · 잃을 것 = 첫 설치~열쇠 사이 몇 건.
//
// 재는 것(빌드된 앱을 진짜 띄워서 — 저장소 잣대가 아니라 «나가는 요청»을 센다):
//   ① 보통 유저(열쇠 없음)  → 화면을 돌면 GA 요청이 나간다 · internal 딱지 없음 · 경로 /hankki/
//   ② 우리 기기(열쇠 있음)  → 같은 화면을 돌아도 GA 요청 «0건» · 설정 맨 아래에 「내부 기기」 글자
//   ③ 우리 기기 + 점검 켬   → 요청이 나가고 internal 딱지가 붙는다 · 보낸 기록 5건이 쌓인다
//   ④ 설정 버전 글자 7번 탭 → 열쇠 칸이 뜨고, 넣으면 hankki:founder 에 그대로 저장(＋가 든 열쇠도 안 깨진다)
//   ⑤ 앱으로 켠 것(standalone) → 경로 /hankki/app · 브라우저 → /hankki/  (순수 함수 보낼경로 로도 잰다)
//   ⑥ 유저가 통계를 껐으면(hankki:stats:off) 점검을 켜도 안 나간다 — 유저 스위치가 늘 이긴다
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-내부기기-0916.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { 보낼경로 } from '../src/stats.js'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4391, r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')

let 나쁨 = 0
const 잰다 = (참, 말, 값 = '') => { if (참) console.log(`  ✅ ${말}${값 ? `  ${값}` : ''}`); else { 나쁨 += 1; console.log(`  ⛔ ${말}${값 ? `  ${값}` : ''}`) } }
const 열쇠 = 'test+key/with=plus'   // ＋ 가 든 모양 — App.jsx 가 잡았던 함정(URLSearchParams 가 ＋를 공백으로)

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// GA 로 «나가는» 요청을 전부 잡아 세고, 밖으로는 안 보낸다(샌드박스는 어차피 막혀 있다)
async function 열기({ 저장, standalone = false } = {}) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' })
  const page = await ctx.newPage()
  const 요청 = []
  await page.route(/google-analytics\.com|googletagmanager\.com|analytics\.google\.com/, (route) => {
    const u = route.request().url()
    요청.push({ url: u, body: route.request().postData() || '' })
    // gtag.js 자체는 «가짜 본체»로 응답 — 진짜 gtag 처럼 dataLayer 를 g/collect 로 흘려보내진 않는다.
    //   그래서 gtag 모드의 «보냄»은 dataLayer 에 쌓인 page_view 로 잰다(아래 dataLayer 검사).
    if (/gtag\/js/.test(u)) return route.fulfill({ status: 200, contentType: 'text/javascript', body: '/* stub */' })
    return route.fulfill({ status: 204, body: '' })
  })
  await page.addInitScript(SEED_COACH_SEEN)
  await page.addInitScript((kv) => {
    try {
      localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
      for (const [k, v] of Object.entries(kv || {})) v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v)
    } catch {}
  }, 저장 || {})
  if (standalone) await page.emulateMedia({ media: 'screen' })
  await page.addInitScript((on) => {
    if (!on) return
    const 원래 = window.matchMedia
    window.matchMedia = (q) => (q.includes('display-mode: standalone') ? { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : 원래.call(window, q))
  }, standalone)
  await page.goto('http://127.0.0.1:4391/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2600)   // requestIdleCallback 로 미룬 gtag 붙이기까지 기다린다
  return { ctx, page, 요청 }
}
const 탭 = async (page, 글자) => { const t = page.locator('.bottom-nav .nav-item').filter({ hasText: 글자 }).first(); await t.click(); await page.waitForTimeout(700) }
const 페이지뷰들 = (page) => page.evaluate(() => (window.dataLayer || []).filter((a) => a && a[0] === 'event' && a[1] === 'page_view').map((a) => a[2] || {}))
const 설정값 = (page) => page.evaluate(() => (window.dataLayer || []).filter((a) => a && a[0] === 'config').map((a) => a[2] || {}))

// ── ① 보통 유저 ────────────────────────────────────────────────
console.log('① 보통 유저(열쇠 없음)')
{
  const { ctx, page, 요청 } = await 열기()
  await 탭(page, '레시피'); await 탭(page, '장보기')
  const pv = await 페이지뷰들(page); const cfg = await 설정값(page)
  잰다(요청.some((r) => /gtag\/js/.test(r.url)), 'gtag 스크립트를 받으러 나간다(＝통계가 켜져 있다)')
  잰다(pv.length >= 2, `화면을 돌면 page_view 가 쌓인다`, `${pv.length}건`)
  잰다(cfg.length === 1 && !('traffic_type' in cfg[0]), '보통 유저는 internal 딱지 없음')
  잰다(pv.every((p) => new URL(p.page_location).pathname === '/hankki/'), '브라우저 = 경로 /hankki/', pv[0] && new URL(pv[0].page_location).pathname)
  const 기록 = await page.evaluate(() => localStorage.getItem('hankki:stats:log'))
  잰다(기록 === null, '유저 폰엔 「보낸 기록」이 안 쌓인다')
  await ctx.close()
}

// ── ② 우리 기기 = 안 보냄 ──────────────────────────────────────
console.log('② 우리 기기(열쇠 있음) — 아예 안 보냄')
{
  const { ctx, page, 요청 } = await 열기({ 저장: { 'hankki:founder': 열쇠 } })
  await 탭(page, '레시피'); await 탭(page, '장보기'); await 탭(page, '레꾸자랑')
  const pv = await 페이지뷰들(page)
  잰다(요청.length === 0, 'GA 로 나가는 요청 0건(gtag 도 안 받는다)', `${요청.length}건`)
  잰다(pv.length === 0, 'dataLayer 에도 page_view 0건', `${pv.length}건`)
  await 탭(page, '홈')
  const 글자 = await page.getByText('내부 기기', { exact: false }).count()
  await page.locator('.bottom-nav .nav-item').last().click().catch(() => {})
  await ctx.close()
  void 글자
}

// ── ②-b 설정 화면에 「내부 기기」 글자 ─────────────────────────
console.log('②-b 설정 맨 아래 「내부 기기 · 통계 안 보냄」')
{
  const { ctx, page } = await 열기({ 저장: { 'hankki:founder': 열쇠 } })
  await page.evaluate(() => { try { sessionStorage.setItem('hankki:tab', 'profile') } catch {} })
  await page.goto('http://127.0.0.1:4391/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(900)
  const 있음 = await page.getByText('내부 기기', { exact: false }).count()
  잰다(있음 > 0, '설정에 「내부 기기」 표시가 보인다(저장값이 날아가면 이 글자가 사라진다 = 눈으로 안다)')
  await ctx.close()
}

// ── ③ 우리 기기 + 점검 켬 = internal 로 보냄 + 기록 ────────────
console.log('③ 우리 기기 + 점검용 보내기 켬')
{
  const { ctx, page, 요청 } = await 열기({ 저장: { 'hankki:founder': 열쇠, 'hankki:stats:probe': '1' } })
  await 탭(page, '레시피'); await 탭(page, '장보기')
  const pv = await 페이지뷰들(page); const cfg = await 설정값(page)
  잰다(요청.some((r) => /gtag\/js/.test(r.url)), '점검이면 gtag 를 받는다')
  잰다(cfg.length === 1 && cfg[0].traffic_type === 'internal', '점검 보내기는 internal 딱지를 단다(보고서엔 안 실린다)')
  잰다(pv.length >= 2, '화면을 돌면 page_view 가 나간다', `${pv.length}건`)
  const 기록 = await page.evaluate(() => JSON.parse(localStorage.getItem('hankki:stats:log') || '[]'))
  잰다(기록.length >= 2 && 기록.length <= 5 && 기록.every((r) => r.내부 === true && r.이름), '「보낸 기록」이 최대 5건 쌓인다(우리 쪽 검증용)', 기록.map((r) => r.이름).join(','))
  await ctx.close()
}

// ── ④ 7번 탭 → 열쇠 칸 → 저장 ──────────────────────────────────
console.log('④ 설정 버전 글자 7번 탭 → 열쇠 넣기')
{
  const { ctx, page } = await 열기()
  await page.evaluate(() => { try { sessionStorage.setItem('hankki:tab', 'profile') } catch {} })
  await page.goto('http://127.0.0.1:4391/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(900)
  const 버전 = page.locator('[data-tap="version"]').first()
  잰다(await 버전.count() === 1, '버전 글자가 있다(data-tap=version)')
  for (let i = 0; i < 6; i++) { await 버전.click(); await page.waitForTimeout(80) }
  잰다((await page.getByText('운영자 열쇠', { exact: false }).count()) === 0, '6번까지는 아무것도 안 뜬다')
  await 버전.click(); await page.waitForTimeout(500)
  const 칸 = page.locator('input[placeholder*="열쇠"]').first()
  잰다(await 칸.count() === 1, '7번째에 열쇠 칸이 뜬다')
  await 칸.fill(열쇠)
  await page.getByRole('button', { name: '저장' }).last().click()
  await page.waitForTimeout(1200)
  const 저장됨 = await page.evaluate(() => localStorage.getItem('hankki:founder'))
  잰다(저장됨 === 열쇠, '넣은 열쇠가 hankki:founder 에 «그대로» 저장(＋도 안 깨짐)', 저장됨)
  await ctx.close()
}

// ── ⑤ 앱으로 켠 것 = /hankki/app ───────────────────────────────
console.log('⑤ 앱(standalone)으로 켜면 경로 /hankki/app')
{
  const { ctx, page } = await 열기({ standalone: true })
  await 탭(page, '레시피')
  const pv = await 페이지뷰들(page)
  잰다(pv.length >= 1 && pv.every((p) => new URL(p.page_location).pathname === '/hankki/app'), '앱 = 경로 /hankki/app', pv[0] && new URL(pv[0].page_location).pathname)
  await ctx.close()
}
잰다(보낼경로({ 경로: '/hankki/', 앱: true }) === '/hankki/app' && 보낼경로({ 경로: '/hankki/', 앱: false }) === '/hankki/' && 보낼경로({ 경로: '/x', 앱: true }) === '/x/app', '보낼경로 순수 함수 = 슬래시 있든 없든 …/app')

// ── ⑥ 유저 스위치가 이긴다 ─────────────────────────────────────
console.log('⑥ 유저가 통계를 껐으면 점검을 켜도 안 나간다')
{
  const { ctx, page, 요청 } = await 열기({ 저장: { 'hankki:founder': 열쇠, 'hankki:stats:probe': '1', 'hankki:stats:off': '1' } })
  await 탭(page, '레시피')
  const pv = await 페이지뷰들(page)
  잰다(!요청.some((r) => /gtag\/js/.test(r.url)) && pv.length === 0, '꺼짐이 점검보다 세다(요청 0 · page_view 0)')
  await ctx.close()
}

await b.close(); srv.close()
console.log(나쁨 ? `\n⛔ ${나쁨}칸 틀렸다` : '\n✅ 전부 통과')
process.exit(나쁨 ? 1 : 0)
