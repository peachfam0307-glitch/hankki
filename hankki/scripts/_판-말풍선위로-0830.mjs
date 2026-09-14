// 💬⬆️ 「말풍선을 조금만 위로」 — 얼마나 올릴지 «실물»로 고르게 한다 (2026-08-30)
//   📮 창업자 = *"우리 말풍선(홈, 레시피등등) 조금만 위로 올리자. 넘 아래로 내려와있어"*
//   🔢 실측 = 상단바 아래 5px 인데, **상단바 «자체»에 아래 여백이 있어** 캐릭터와는 더 멀다.
//   ⛔ 소스를 안 고친다 — 화면에서 CSS 값만 갈아끼워 찍는다(절대원칙 30).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/말풍선위로'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST,'index.html')); type='text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4399, r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

const 안 = [
  { 이름: '지금', mt: 5,  hint: '지금 그대로' },
  { 이름: '가',   mt: -2, hint: '7px 위로' },
  { 이름: '나',   mt: -8, hint: '13px 위로' },
  { 이름: '다',   mt: -14, hint: '19px 위로 — 상단바를 파고든다' },
]
console.log('안   | 상단바아래 | 캐릭터아래 | 겹침')
console.log('─'.repeat(52))
for (const a of 안) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
  const p = await ctx.newPage()
  await p.addInitScript(SEED_COACH_SEEN)
  await p.goto('http://localhost:4399/hankki/'); await p.waitForTimeout(1200)
  // ⛔ 온보딩을 «반드시» 끈다 — 안 끄면 온보딩 화면이 찍히고 그걸 말풍선인 줄 알고 보낸다
  //    (2026-08-11 사고 · 절대원칙 21 로 잡았다)
  await p.evaluate(() => { try { localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1') } catch(e){} })
  await p.reload(); await p.waitForTimeout(1500)
  // ⭐ 찍기 «전»에 상단바가 실제로 있나 본다 — 없으면 그 판은 거짓말이다
  const 상단바있나 = await p.evaluate(() => !!document.querySelector('.topbar'))
  if (!상단바있나) { console.log('⛔ 상단바가 없다 — 화면이 온보딩이거나 못 들어갔다'); process.exit(1) }
  await p.getByText('레시피', { exact: true }).last().click().catch(()=>{})
  await p.waitForTimeout(700)
  await p.evaluate((mt) => {
    const el = document.querySelector('.tab-talk'); if (el) el.style.marginTop = mt + 'px'
  }, a.mt)
  await p.waitForTimeout(250)
  const r = await p.evaluate(() => {
    const t = document.querySelector('.tab-talk').getBoundingClientRect()
    const bar = document.querySelector('.topbar').getBoundingClientRect()
    const 캐 = document.querySelector('.topbar img')?.getBoundingClientRect()
    return { 바아래: +(t.top - bar.bottom).toFixed(1), 캐아래: 캐 ? +(t.top - 캐.bottom).toFixed(1) : null }
  })
  console.log(`${a.이름.padEnd(4)} | ${String(r.바아래).padStart(10)} | ${String(r.캐아래).padStart(10)} | ${r.바아래 < 0 ? '상단바를 파고듦' : '-'}`)
  await p.screenshot({ path: `${OUT}/${a.이름}.png`, clip: { x: 0, y: 0, width: 390, height: 175 } })
  await ctx.close()
}
await b.close(); srv.close()
console.log(`\n📁 ${OUT}`)
