// 🔎 「그대로 저장」이 «그 줄 하나만» 옮기나 — 2026-09-02 〔반영됨〕
//
// ⛔ 왜 만들었나 = 눈으로 본 판(_shot-보관함나가는길-0902)에서 홈 「최근 저장」에
//    «안 옮긴 줄»까지 떠 있어서 「단추가 여러 줄을 옮기나」를 의심했다.
// ✅ 답 = 아니다. 옮긴 건 딱 한 줄이고, 홈에 뜬 건 **「HomeScreen」의 「recent」에
//    unsorted 필터가 «아예 없어서»**다(recipes 를 savedAt 순으로 4개 자른다 · :268).
//    ⛔ 내 메모엔 *"HomeScreen:211 이 unsorted 만 뺀다"* 라고 적혀 있었는데 «틀렸다» —
//       :211 은 「오늘 뭐 해먹지」 추천 pool 이고 최근 저장과 다른 줄이다.
//    ⭐ 그게 창업자가 본 어긋남의 정확한 자리다 — *"최근저장에는 뜨는데 레시피탭에 가면 안보여."*
//    ⛔ 그래도 «고치지 않는다» — 창업자 판정 = *"홈화면에 계속 표시되니까."* 보이는 게 맞다.
//
// 실행: node scripts/_probe-그대로저장-0902.mjs
// 🏷 이름표 = 반영됨 (한 번 재는 판 · smoke 아님)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4474, r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p0 = await ctx.newPage()
await p0.goto('http://127.0.0.1:4474/hankki/', { waitUntil: 'networkidle' }); await p0.waitForTimeout(1200)
await p0.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}'); const t = Date.now()
  s.recipes = [
    { id: 'zz-a', title: '가나다 반쪽', status: 'unsorted', source: 'photo', savedAt: t, ingredients: ['콩나물 300g', '들기름 1큰술'], steps: [], favorite: false, cooked: 0 },
    { id: 'zz-b', title: '라마바 빈것', status: 'unsorted', source: 'photo', savedAt: t - 1000, ingredients: [], steps: [], favorite: false, cooked: 0 },
    { id: 'zz-c', title: '사아자 빈것', status: 'unsorted', source: 'photo', savedAt: t - 2000, ingredients: [], steps: [], favorite: false, cooked: 0 },
    ...(s.recipes || [])]
  delete s.inboxV; localStorage.setItem('hankki:v1', JSON.stringify(s))
})
await p0.close()
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4474/hankki/', { waitUntil: 'networkidle' }); await p.waitForTimeout(2500)
await p.getByRole('button', { name: /임시보관함/ }).first().click(); await p.waitForTimeout(800)
const 전 = await p.evaluate(() => JSON.parse(localStorage.getItem('hankki:v1')).recipes.filter(r => /^zz-/.test(r.id)).map(r => r.id + '=' + r.status))
// 가운데 줄(라마바)의 「그대로 저장」을 누른다
await p.evaluate(() => {
  const 줄 = [...document.querySelectorAll('.inbox-row')].find((e) => /라마바/.test(e.innerText))
  const 칸 = 줄?.parentElement?.parentElement
  ;[...(칸?.querySelectorAll('button') || [])].find((b) => /그대로 저장/.test(b.innerText))?.click()
})
await p.waitForTimeout(900)
const 후 = await p.evaluate(() => JSON.parse(localStorage.getItem('hankki:v1')).recipes.filter(r => /^zz-/.test(r.id)).map(r => r.id + '=' + r.status))
console.log('  전 =', 전.join(' · '))
console.log('  후 =', 후.join(' · '))
const 바뀐 = 후.filter((v, i) => v !== 전[i])
console.log(바뀐.length === 1 && 바뀐[0] === 'zz-b=sorted' ? '  ✅ 딱 그 줄 하나만 옮겼다' : `  ❌ 바뀐 것 = ${바뀐.join(' · ')}`)
await b.close(); srv.close()
process.exit(바뀐.length === 1 && 바뀐[0] === 'zz-b=sorted' ? 0 : 1)
