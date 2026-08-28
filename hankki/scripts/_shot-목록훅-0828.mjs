// 🪝 릴스 «첫 장» 훅 — 레시피가 «주르륵» 쌓여 있는 장면 (2026-08-28)
//
// 📮 창업자 = *"**첫장에 시선을 끌 한장이 필요해**"* · *"**쌓아둔 레시피 많은거를..**"* · *"쌓여있는 레시피들 있는"*
//
// ⭐⭐ 릴스는 «첫 1초»가 전부다 — 스크롤을 멈추게 하지 못하면 나머지 20초는 아무도 안 본다.
//    지금 첫 장은 인스타 캡션 화면이라 **글자만 빽빽해서 눈이 안 멈춘다.**
//
// ⭐ 우리가 이미 가진 제일 센 그림 = **레시피가 격자로 쌓인 목록**.
//    「많다」는 정지 그림으로는 전달이 약한데 **흘러가면** 한 번에 읽힌다.
//    → 스크롤 자리를 달리해 여러 장 찍고, 릴스가 그걸 빠르게 넘겨 «주르륵»을 만든다.
//
// ⛔ 왜 `fullPage: true` 로 한 장 길게 안 찍나 — 앱은 `.app-frame` 이 화면 높이에 «고정»이라
//    fullPage 로도 한 화면만 나온다(스크롤은 안쪽 칸이 먹는다).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_shot-목록훅-0828.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홍보/앱화면'
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
// ⛔ 포트를 4382 로 쓰면 `_shot-스토어용화면` 과 부딪친다(끊긴 판이 물고 있으면 EADDRINUSE)
await new Promise((r) => srv.listen(4386, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })

const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4386/', { waitUntil: 'networkidle' })
await p.waitForTimeout(1000)

const 탭 = p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first()
await 탭.click()
await p.waitForTimeout(1300)

// 📸 스크롤을 조금씩 내리며 찍는다 — 릴스가 이걸 빠르게 넘겨 「주르륵」을 만든다
//    ⭐ 한 걸음 = 카드 한 줄 남짓(560px). 너무 크면 «건너뛴» 것처럼 보이고 작으면 안 흐른다.
const 걸음 = 560
const 장수 = 6
const 낸것 = []
for (let i = 0; i < 장수; i++) {
  if (i > 0) {
    await p.mouse.move(195, 500)
    await p.mouse.wheel(0, 걸음)
    await p.waitForTimeout(560)
  }
  const 길 = join(OUT, `28${'abcdef'[i]}-목록훅.png`)
  await p.screenshot({ path: 길 })
  낸것.push(길)
  console.log(`  ✅ 28${'abcdef'[i]}-목록훅`)
}

await b.close()
srv.close()

// 🔒 스스로 검사 — 「진짜로 흘렀나」.
//    ⛔ 안 굴렀으면 여섯 장이 «똑같은 그림»이고, 그러면 훅이 아니라 정지 화면이 된다.
//       그런데도 「6장 찍었다」는 초록불이 뜬다(규칙 18 ⓘ — 통과했는데 아무것도 안 쟀다).
const { createHash } = await import('node:crypto')
const 해시들 = 낸것.map((f) => createHash('sha1').update(readFileSync(f)).digest('hex').slice(0, 12))
const 다른것 = new Set(해시들).size
console.log(`\n🔎 서로 다른 그림 ${다른것}/${장수}`)
if (다른것 < 장수) {
  console.error('⛔ 목록이 «안 굴렀다» — 같은 그림이 섞였다. 훅이 안 된다.')
  process.exit(1)
}
console.log(`📸 ${장수}장 → ${OUT}`)
