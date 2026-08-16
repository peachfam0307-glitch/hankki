// 📸 창업자 폰과 «같은 조건»(KST · 아침)에서 홈이 어떻게 나오나 (2026-08-17)
//   ⛔ 우리 컨테이너는 UTC 라 그냥 찍으면 «맞게» 나온다 — 그래서 여태 못 봤다.
//   ⭐ 브라우저에 **타임존을 Asia/Seoul 로 주고** 시계도 아침 8:01 로 맞춰서 찍는다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
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
await new Promise((r) => srv.listen(4391, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

// 창업자가 실제로 본 순간 = 2026-08-17 08:01 KST
const 그순간 = new Date('2026-08-16T23:01:00Z').getTime()

const 찍기 = async (tz, 이름) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 1400 }, timezoneId: tz, deviceScaleFactor: 2 })
  const p = await ctx.newPage()
  await p.addInitScript(SEED_COACH_SEEN)
  await p.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1') })
  // ⏰ 시계를 그 순간으로 고정 — 「아침 8시」라야 이 버그가 드러난다
  await p.addInitScript(`{
    const 고정 = ${그순간}
    const R = Date
    Date = class extends R { constructor(...a){ if(!a.length) super(고정); else super(...a) } static now(){ return 고정 } }
    Date.parse = R.parse; Date.UTC = R.UTC
  }`)
  await p.goto('http://127.0.0.1:4391/hankki/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(1400)
  const 제철 = await p.evaluate(() => {
    const el = [...document.querySelectorAll('*')].find((e) => e.textContent.trim() === '이번 주 제철')
    const box = el?.closest('div')?.parentElement
    return box ? box.innerText.split('\n').slice(0, 3).join(' / ') : '(못 찾음)'
  })
  console.log(`  ${이름.padEnd(18)} → ${제철}`)
  await p.screenshot({ path: join(OUT, `KST홈-${이름}.png`) })
  await ctx.close()
  return 제철
}

console.log('📸 2026-08-17 08:01 (한국 아침) 에 홈이 어떻게 나오나\n')
const kst = await 찍기('Asia/Seoul', '창업자폰-KST')
const utc = await 찍기('UTC', '내컨테이너-UTC')

await b.close(); srv.close()
const 맞나 = /여름 시원한 것/.test(kst)
console.log(맞나 ? '\n✅ 한국 폰에서 「여름 시원한 것」이 뜬다' : `\n⛔ 한국 폰에서 아직 «${kst}»`)
process.exit(맞나 ? 0 : 1)
