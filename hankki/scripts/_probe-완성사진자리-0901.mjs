// 📷📐 **요리모드 «마지막 걸음»의 완성 사진 칸 — 폰·패드에서 어디에 서 있나** (2026-09-01)
//
// 📮 창업자 = *"패드에서 요리모드 제일 마지막에 사진 넣는 부분 좀 이상하고. 폰도 다시 봐야 할듯"*
//    📸 창업자 캡처(패드 가로) = **동그라미는 왼쪽 끝 · 「완성 사진」 글자는 한가운데** — 둘이 따로 논다.
//
// ⛔ 짐작하지 않는다 — CSS 는 `.cook-shot.empty { flex-direction: column; align-items: flex-end }` 라
//    «오른쪽»에 모여야 맞다. 캡처는 그 반대다. **재서 무엇이 이기는지 본다**(절대원칙 30).
//
// 🔢 재는 것 = 동그라미·글자의 «가운데 x» 와 줄 상자의 가운데. 셋이 어긋나면 그게 창업자가 본 그것이다.
//
// 실행: node /home/user/hankki/hankki/scripts/_probe-완성사진자리-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/완성사진자리'
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
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

const 화면들 = [
  { 이름: '폰 세로', w: 390, h: 844 },
  { 이름: '패드 세로', w: 800, h: 1280 },
  { 이름: '패드 가로', w: 1280, h: 800 },
]

let 어긋남 = 0
for (const v of 화면들) {
  const ctx = await b.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(2200)
  for (let i = 0; i < 3; i++) { if (!(await p.locator('.sheet-mask').count())) break; await p.keyboard.press('Escape'); await p.waitForTimeout(350) }
  await p.locator('.nav-item', { hasText: '레시피' }).first().click()
  await p.waitForTimeout(900)
  await p.evaluate(() => {
    const c = [...document.querySelectorAll('button, a')].find((x) => x.querySelector('img') && (x.innerText || '').trim().length > 1)
    c?.click()
  })
  await p.waitForTimeout(1100)
  const 시작 = await p.evaluate(() => {
    const c = [...document.querySelectorAll('button')].find((x) => /요리모드 시작/.test((x.innerText || '').trim()))
    if (!c) return false; c.click(); return true
  })
  await p.waitForTimeout(1300)
  if (!시작) { console.error(`✗ ${v.이름} — 요리모드를 못 열었다`); await ctx.close(); continue }

  // ⏭ 마지막 걸음까지 — 진행 점을 «마지막»으로 눌러 한 번에 간다(다음을 여러 번 누르면 느리다)
  await p.evaluate(() => {
    const segs = [...document.querySelectorAll('.cp-seg')]
    segs[segs.length - 1]?.click()
  })
  await p.waitForTimeout(900)

  const r = await p.evaluate(() => {
    const row = document.querySelector('.cook-shot')
    if (!row) return null
    const btn = row.querySelector('.cook-shot-add')
    const lab = row.querySelector('.cook-shot-label')
    const mid = (e) => { const b = e.getBoundingClientRect(); return { x: +(b.left + b.width / 2).toFixed(1), y: +(b.top + b.height / 2).toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1), left: +b.left.toFixed(1), right: +b.right.toFixed(1) } }
    const s = getComputedStyle(row)
    return {
      줄: mid(row), 동그라미: btn ? mid(btn) : null, 글자: lab ? mid(lab) : null,
      방향: s.flexDirection, 맞춤: s.alignItems, 글자정렬: lab ? getComputedStyle(lab).textAlign : null,
      비었나: row.className.includes('empty'),
    }
  })
  await p.screenshot({ path: join(OUT, `${v.이름.replace(/\s/g, '')}.png`) })
  if (!r) { console.log(`\n📱 ${v.이름} — ⛔ 완성 사진 줄을 못 찾았다`); await ctx.close(); continue }

  const 차 = r.동그라미 && r.글자 ? Math.abs(r.동그라미.x - r.글자.x) : 0
  const 나쁨 = 차 > 24
  if (나쁨) 어긋남++
  console.log(`\n📱 ${v.이름} (${v.w}×${v.h})  ${r.비었나 ? '(사진 없음)' : '(사진 있음)'}`)
  console.log(`   줄     x ${r.줄.left} ~ ${r.줄.right}  (폭 ${r.줄.w})   방향 ${r.방향} · 맞춤 ${r.맞춤}`)
  if (r.동그라미) console.log(`   동그라미 가운데 x ${r.동그라미.x}  (${r.동그라미.w}×${r.동그라미.h})`)
  if (r.글자) console.log(`   글자     가운데 x ${r.글자.x}  (폭 ${r.글자.w} · 정렬 ${r.글자정렬})`)
  console.log(`   ${나쁨 ? '⛔' : '✅'} 동그라미↔글자 어긋난 거리 = ${차.toFixed(1)}px`)
  await ctx.close()
}

console.log(`\n${어긋남 ? '⛔' : '✅'} 판정 = ${어긋남 ? `${어긋남}개 화면에서 동그라미와 글자가 따로 논다` : '어느 화면에서도 안 어긋난다'}`)
console.log(`🖼 캡처 = ${OUT}`)
await b.close(); srv.close()
process.exit(어긋남 ? 1 : 0)
