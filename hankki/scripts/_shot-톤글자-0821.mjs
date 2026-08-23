// 📸 [2026-08-21] 「톤D ＋ 글자2」가 실제로 어떻게 보이나 — 탭 다섯 장을 찍는다
//
// 📮 창업자 확정 = *"아까 검수판은 **톤D 글자2**"* → 코드에 넣었으니 «실물»을 본다.
// ⭐ 절대원칙 21 = 창업자에게 보여주기 «전»에 내가 열어서 눈으로 본다.
//    숫자(대비·px)는 다 초록불이어도 «가려짐·겹침·깨짐»은 숫자로 안 잡힌다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_shot-톤글자-0821.mjs
//      W=820 H=1180 node scripts/_shot-톤글자-0821.mjs   ← 패드로 찍기
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/톤글자'
mkdirSync(OUT, { recursive: true })
const W = Number(process.env.W || 390), H = Number(process.env.H || 844)

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4433, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4433/hankki/', { waitUntil: 'networkidle' })
await p.evaluate(() => document.fonts.ready)
await p.waitForTimeout(900)

// ⛔ 찍기 «전»에 화면 한가운데를 덮은 것이 있나 본다 — 온보딩·코치마크가 덮으면 헛것을 찍는다
const 덮임 = await p.evaluate(() => {
  const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2)
  return el ? (el.closest('.onboarding,.coach,[class*="coach"],[class*="onboard"]') ? '⛔덮임' : '✅안 덮임') : '?'
})
console.log(`\n📸 ${W}×${H} · 가운데 = ${덮임}`)

const 탭들 = ['홈', '레시피', '장보기', '일기', '레꾸자랑']
for (const 이름 of 탭들) {
  await p.evaluate((T) => {
    const bs = [...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')]
    bs.find((x) => (x.innerText || '').replace(/\s+/g, '').includes(T))?.click()
  }, 이름)
  await p.waitForTimeout(700)
  const 파일 = join(OUT, `${이름}-${W}.png`)
  await p.screenshot({ path: 파일 })
  // 🔢 찍은 «그 화면»의 글자 바닥값도 같이 찍어 둔다 — 그림과 숫자가 어긋나면 바로 드러난다
  const 값 = await p.evaluate(() => {
    const 것 = []
    for (const el of document.querySelectorAll('*')) {
      if (!el.childNodes.length) continue
      const t = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join('')
      if (!t) continue
      const r = el.getBoundingClientRect()
      if (r.width < 2 || r.height < 2) continue
      것.push(Math.round(parseFloat(getComputedStyle(el).fontSize) * 10) / 10)
    }
    것.sort((a, b) => a - b)
    return { 개수: 것.length, 제일작은: 것[0], 가운데: 것[Math.floor(것.length / 2)] }
  })
  console.log(`  ${이름.padEnd(5, ' ')} → ${파일}   (글자 ${값.개수}덩이 · 제일 작은 ${값.제일작은}px · 가운데 ${값.가운데}px)`)
}

await b.close(); srv.close()
console.log('\n⭐ ⛔여기서 끝내지 말 것 — 창업자에게 보내기 «전»에 이 PNG 를 «열어서» 눈으로 본다(절대원칙 21).')
