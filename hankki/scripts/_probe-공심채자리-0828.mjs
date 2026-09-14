// 🔎 레시피 목록에서 「공심채 볶음」이 «몇 번째·어디»에 있나 (2026-08-28)
//
// 📮 창업자 = *"**레시피가 저장되었어요에 공심채가 없어**"*
//    릴스 s5 자막이 「레시피가 담겼어요」인데 화면에 공심채가 없으면 «말과 그림이 어긋난다».
//    인스타에서 공심채를 공유해서 담는 이야기라 **담긴 목록에 그게 보여야** 흐름이 이어진다.
//
// ⛔ 「목록 맨 위부터 찍으면 되겠지」로 짐작하지 않는다 — 실제 자리를 «재서» 그 자리부터 찍는다.
//    (2026-08-28 실측 = 맨 위 여섯 장을 찍었는데 공심채가 한 장에도 안 나왔다)
//
// 실행: node /home/user/hankki/hankki/scripts/_probe-공심채자리-0828.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4392, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })

const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4392/', { waitUntil: 'networkidle' })
await p.waitForTimeout(900)
await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click()
await p.waitForTimeout(1400)

const 답 = await p.evaluate(() => {
  const 이름들 = [...document.querySelectorAll('.name')].map((n) => n.textContent.trim())
  const 몇번째 = 이름들.findIndex((n) => n.includes('공심채'))
  // 굴러가는 칸 = 안쪽에서 제 키보다 내용이 긴 것
  let 굴림 = null
  for (const el of document.querySelectorAll('*')) {
    if (el.scrollHeight - el.clientHeight > 200 && el.clientHeight > 300) { 굴림 = el; break }
  }
  const 카드 = [...document.querySelectorAll('.name')][몇번째]
  const 굴림r = 굴림 ? 굴림.getBoundingClientRect() : null
  const 카드r = 카드 ? 카드.getBoundingClientRect() : null
  return {
    전체: 이름들.length,
    몇번째,
    앞열개: 이름들.slice(0, 10),
    굴림칸: 굴림 ? { class: 굴림.className, 보이는키: 굴림.clientHeight, 속키: 굴림.scrollHeight } : null,
    // 「공심채 이름표」를 화면 위쪽에 두려면 얼마나 굴려야 하나
    굴릴양: 카드r && 굴림r ? Math.round(카드r.top - 굴림r.top - 300) : null,
  }
})
console.log(JSON.stringify(답, null, 1))

await b.close()
srv.close()
