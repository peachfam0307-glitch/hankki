// 🪝 릴스 「레시피가 담겼어요」 — 목록이 «주르륵» 흘러 «공심채»에서 멈춘다 (2026-08-28)
//
// 📮 창업자 = *"**첫장에 시선을 끌 한장이 필요해**"* · *"**쌓아둔 레시피 많은거를..**"* · *"쌓여있는 레시피들 있는"*
//    📮 그리고 = *"**레시피가 저장되었어요에 공심채가 없어**"*
//
// ⭐⭐ 「많다」는 정지 그림으로는 전달이 약한데 **흘러가면** 한 번에 읽힌다.
//    → 스크롤 자리를 달리해 여러 장 찍고, 릴스가 그걸 빠르게 넘겨 «주르륵»을 만든다.
//
// ⛔⛔ **첫 판은 목록 «맨 위»에서 여섯 장을 찍었다 — 공심채가 한 장에도 안 나왔다.**
//    🔢 실측(`_probe-공심채자리-0828.mjs`) = 공심채는 **57편 중 36번째 · 4212px 아래**인데
//       여섯 장이 2800px 까지밖에 안 갔다. **자막은 「담겼어요」인데 담긴 게 화면에 없었다.**
//    ✅ 그래서 **마지막 장이 공심채에 «착지»하게** 굴린다 —
//       흐르는 동안 「이만큼 쌓였다」를 보여주고, **멈추는 순간 「그게 여기 있다」**가 된다.
//       ⭐ 다음 장면(s6·s7)이 공심채 재료·만드는 법이라 **그대로 이어진다.**
//    ⛔ 굴릴 양을 «손으로 적지 않는다» — 레시피가 늘면 자리가 바뀌어 그 숫자가 조용히 낡는다.
//       화면에서 **재서** 정한다.
//
// ⛔ 왜 `fullPage: true` 로 한 장 길게 안 찍나 — 앱은 `.app-frame` 이 화면 높이에 «고정»이라
//    fullPage 로도 한 화면만 나온다(스크롤은 안쪽 칸이 먹는다).
//
// 실행: node /home/user/hankki/hankki/scripts/_shot-목록훅-0828.mjs
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
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })

const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4386/', { waitUntil: 'networkidle' })
await p.waitForTimeout(1000)

const 탭 = p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first()
await 탭.click()
await p.waitForTimeout(1300)

// 🎯 착지 자리를 «재서» 정한다 — 공심채 카드가 화면 위쪽(y≈300)에 서는 스크롤 값
const 착지 = await p.evaluate(() => {
  const 이름표 = [...document.querySelectorAll('.name')].find((n) => n.textContent.includes('공심채'))
  if (!이름표) return null
  // 이 카드를 «품고 있는» 굴림칸을 찾는다 (⛔화면에 남아 있는 앞 화면의 칸을 집으면 엉뚱한 데를 굴린다)
  let 칸 = 이름표.parentElement
  while (칸 && !(칸.scrollHeight - 칸.clientHeight > 200 && 칸.clientHeight > 300)) 칸 = 칸.parentElement
  if (!칸) return null
  const 카드 = 이름표.getBoundingClientRect()
  const 칸r = 칸.getBoundingClientRect()
  return {
    목표: Math.round(칸.scrollTop + (카드.top - 칸r.top) - 300),
    최대: 칸.scrollHeight - 칸.clientHeight,
  }
})
if (!착지) { console.error('⛔ 목록에서 「공심채」를 못 찾았다 — 자막 「레시피가 담겼어요」와 화면이 어긋난다'); process.exit(1) }

// 📸 맨 위에서 시작해 착지 자리까지 고르게 굴리며 찍는다
//    ⭐ 한 걸음이 카드 한 줄(≈560px) 언저리라야 «흐르는» 것으로 보인다 —
//       너무 크면 «건너뛴» 것처럼 보이고 작으면 안 흐른다. → 장수를 그 기준으로 정한다
const 장수 = Math.max(2, Math.min(12, Math.round(착지.목표 / 560) + 1))
const 걸음 = 착지.목표 / (장수 - 1)
const 이름 = 'abcdefghijkl'
console.log(`🎯 공심채 착지 = ${착지.목표}px (최대 ${착지.최대}) · ${장수}장 · 한 걸음 ${Math.round(걸음)}px`)

const 낸것 = []
for (let i = 0; i < 장수; i++) {
  const 자리 = Math.round(걸음 * i)
  await p.evaluate((y) => {
    const 이름표 = [...document.querySelectorAll('.name')].find((n) => n.textContent.includes('공심채'))
    let 칸 = 이름표?.parentElement
    while (칸 && !(칸.scrollHeight - 칸.clientHeight > 200 && 칸.clientHeight > 300)) 칸 = 칸.parentElement
    if (칸) 칸.scrollTop = y
  }, 자리)
  await p.waitForTimeout(520)
  const 길 = join(OUT, `28${이름[i]}-목록훅.png`)
  await p.screenshot({ path: 길 })
  낸것.push(길)
  console.log(`  ✅ 28${이름[i]}-목록훅  (${자리}px)`)
}

// 🔒 스스로 검사 ① — **공심채가 마지막 장에 «진짜로 보이나»**
//    ⛔ 이게 이 판을 다시 만든 «이유»다. 「몇 장 찍었다」는 이걸 하나도 안 잰다(규칙 18 ⓘ).
const 보이나 = await p.evaluate(() => {
  const 이름표 = [...document.querySelectorAll('.name')].find((n) => n.textContent.includes('공심채'))
  if (!이름표) return null
  const r = 이름표.getBoundingClientRect()
  return { top: Math.round(r.top), 화면안: r.top >= 0 && r.bottom <= innerHeight }
})
await b.close()
srv.close()
if (!보이나?.화면안) {
  console.error(`⛔ 마지막 장에 공심채가 «안 보인다» (top=${보이나?.top}) — 자막과 화면이 어긋난다`)
  process.exit(1)
}
console.log(`🥬 공심채 이름표 y=${보이나.top} — 마지막 장에 보인다`)

// 🔒 스스로 검사 ② — 「진짜로 흘렀나」.
//    ⛔ 안 굴렀으면 여러 장이 «똑같은 그림»이고, 그러면 훅이 아니라 정지 화면이 된다.
const { createHash } = await import('node:crypto')
const 해시들 = 낸것.map((f) => createHash('sha1').update(readFileSync(f)).digest('hex').slice(0, 12))
const 다른것 = new Set(해시들).size
console.log(`🔎 서로 다른 그림 ${다른것}/${장수}`)
if (다른것 < 장수) {
  console.error('⛔ 목록이 «안 굴렀다» — 같은 그림이 섞였다. 훅이 안 된다.')
  process.exit(1)
}
console.log(`📸 ${장수}장 → ${OUT}`)
