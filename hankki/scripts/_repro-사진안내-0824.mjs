// 📔📔 「사진이 어디에 담기는지」 안내가 뜨나 — 재현판 (창업자 제보 2026-08-24) 〔반영됨〕
//
// 📮 창업자 = *"요리모드→사진→레시피표지로 넣으시겠습니까? 하면 일기탭이랑 달력에자동저장되네..
//    난 레꾸표지만 되는 줄. **안내가 없어서.**"*
//
// ⛔⛔ 뿌리 = 체크박스는 「레시피 표지로도 쓰기」라고 **표지만** 말하는데,
//    사진은 체크와 «무관하게 항상» 두 곳에 더 담긴다:
//      · 일기      — `CookScreen.jsx` `addDiary`/`updateDiary`
//      · 달력 칸   — `MyRecipesScreen.jsx` (일기에 photo 가 있으면 사진, 없으면 음식 아이콘)
//    ⭐ 그래서 「도」를 쓴다 — 체크박스와 «별개로» 이미 담긴다는 뜻.
//
// ⭐⭐ 이 판의 심장 = **「화면에 그려진 글자」**를 본다. ⛔소스 grep 아님(절대원칙 18 ⓘ · 30).
//    소스를 grep 하면 «주석에 적어둔 문구»까지 걸려 고쳐놓고도 통과한다(2026-08-21 링크정직 판에서 겪었다).
//
// ⛔ 자르기 시트를 «건너뛴다»(「원본 그대로」) — 8×8 짜리 가짜 PNG 는 자르기 캔버스가 못 삼킨다.
//    2026-08-23 판(`_shot-완성사진자리-0823`)이 바로 여기서 「사진 ⛔」로 멈췄다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-사진안내-0824.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const 기대문구 = '사진은 한끼 일기·달력에도 담겨요'

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4412, r))

// 🖼 240×240 짜리 진짜 PNG — 자르기 캔버스가 삼킬 만큼 크다
function 그림(size = 240) {
  const { createCanvas } = { createCanvas: null }   // 노드 캔버스 없음 → 손으로 만든 PNG 대신 큰 데이터URL
  void createCanvas; void size
  return null
}
void 그림

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch { /* noop */ } })
const page = await ctx.newPage()
const 칸 = []
const 재기 = (이름, 참) => { 칸.push([이름, !!참]); console.log(`  ${참 ? '✅' : '⛔'} ${이름}`) }

await page.goto('http://127.0.0.1:4412/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(900)

// 🍳 레시피 상세 → 요리 모드 → 마지막 걸음
await page.evaluate(() => {
  const b2 = [...document.querySelectorAll('button, a')].find((e) => (e.getAttribute('aria-label') || e.textContent || '').trim().startsWith('레시피'))
  b2?.click()
})
await page.waitForTimeout(900)
await page.evaluate(() => document.querySelector('.grid2 button, .grid3 button, .rc-card')?.click())
await page.waitForTimeout(900)
await page.evaluate(() => {
  const t = [...document.querySelectorAll('button')].find((x) => /요리 (모드|시작)|같이 만들/.test(x.innerText || ''))
  t?.click()
})
await page.waitForTimeout(900)
// 마지막 걸음까지 「다음」
for (let i = 0; i < 30; i++) {
  const 끝 = await page.evaluate(() => {
    const n = [...document.querySelectorAll('.cook-navbtn')].find((x) => /다음|시작/.test(x.innerText || ''))
    if (!n) return true
    n.click(); return false
  })
  if (끝) break
  await page.waitForTimeout(160)
}
await page.waitForTimeout(500)

재기('요리 모드 마지막 걸음까지 왔다', await page.evaluate(() => !!document.querySelector('.cook-shot')))

// ⑴ 사진을 «넣기 전»엔 안내가 없다 — 아직 아무 일도 안 일어났으니까
const 전 = await page.evaluate((s) => (document.body.innerText || '').includes(s), 기대문구)
재기('사진 넣기 «전»엔 안내가 없다', !전)

// ⑵ 사진을 넣는다 — 자르기 시트는 「원본 그대로」로 건너뛴다
const 큰PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAPAAAADwCAYAAAA+VemSAAAAt0lEQVR42u3RAQ0AAAjDMO5fNCCDkC5w' +
  '0lXPBQwoUKBAgQIFChQoUKBAgQIFChQoUKBAgQIFChQoUKBAgQIFChQoUKBAgQIFChQoUKBAgQIFChQo' +
  'UKBAgQIFChQoUKBAgQIFChQoUKBAgQIFChQoUKBAgQIFChQoUKBAgQIFChQoUKBAgQIFChQoUKBAgQIF' +
  'ChQoUKBAgQIFChQoUKBAgQIFChQoUKBAgQIFChQoUKBAgQIFChQoUKBAgQIF6qUFyi0GAWZM+kkAAAAA' +
  'SUVORK5CYII=',
  'base64',
)
const fc = page.waitForEvent('filechooser')
await page.click('.cook-shot-add')
;(await fc).setFiles({ name: 'shot.png', mimeType: 'image/png', buffer: 큰PNG })
await page.waitForTimeout(1000)
// ✂️ 자르기 시트 — 실물 버튼 이름은 「전체 사용」(skip) · 「이 부분만 담기」(confirm) 다.
//    ⛔ `evaluate` 안의 `.click()` 으로는 안 닫혔다 — Playwright 의 «진짜» 클릭을 쓴다.
//    ⭐ 「전체 사용」을 고른다 — 자르기 계산을 건너뛰어 흔들릴 자리가 하나 줄어든다.
await page.getByRole('button', { name: '전체 사용' }).click()
await page.waitForTimeout(1400)

재기('사진이 들어갔다', await page.evaluate(() => !!document.querySelector('.cook-shot-thumb')))

// ⑶ 안내 줄이 «화면에» 떴나 — 심장
const 본 = await page.evaluate(() => {
  const el = document.querySelector('.cook-shot-note')
  if (!el) return null
  const r = el.getBoundingClientRect()
  const cs = getComputedStyle(el)
  return { 글: (el.innerText || '').replace(/\s+/g, ' ').trim(), 폭: Math.round(r.width), 위: Math.round(r.top), 글자: cs.fontSize }
})
재기('안내 줄이 화면에 있다', !!본)
재기(`글자가 맞다 — 「${본?.글 || ''}」`, 본?.글 === 기대문구)
재기(`글자 크기 14px 이상 (지금 ${본?.글자 || '?'})`, 본 && parseFloat(본.글자) >= 14)
재기('가로로 안 잘린다', 본 && 본.폭 > 0 && 본.폭 <= 390)

// ⑷ 체크박스는 «표지»만 말한다 — 둘이 서로 다른 말을 해야 한다
const 체크글 = await page.evaluate(() => {
  const c = document.querySelector('.cook-shot-cover')
  return c ? (c.innerText || '').replace(/\s+/g, ' ').trim() : ''
})
재기(`체크박스는 표지만 말한다 — 「${체크글}」`, /표지/.test(체크글) && !/일기|달력/.test(체크글))

// ⑸ 안내가 체크박스 «바깥»에 있다 — 안에 있으면 「끄면 일기에도 안 가나?」로 읽힌다
재기('안내가 체크박스 «바깥»에 있다', await page.evaluate(() => {
  const c = document.querySelector('.cook-shot-cover'); const n = document.querySelector('.cook-shot-note')
  return !!(c && n) && !c.contains(n)
}))

// ⑹ 체크를 꺼도 안내는 그대로 — 사진은 체크와 무관하게 일기·달력에 간다
await page.evaluate(() => document.querySelector('.cook-shot-cover')?.click())
await page.waitForTimeout(400)
재기('체크를 꺼도 안내는 그대로 뜬다', await page.evaluate((s) => {
  const n = document.querySelector('.cook-shot-note')
  return !!n && (n.innerText || '').includes(s)
}, 기대문구))

await page.screenshot({ path: '/tmp/사진안내-0824.png' })
const 좋 = 칸.filter(([, v]) => v).length
console.log(`\n📷 /tmp/사진안내-0824.png`)
console.log(`${좋 === 칸.length ? '✅' : '⛔'} ${좋}/${칸.length}`)
await b.close(); srv.close()
process.exit(좋 === 칸.length ? 0 : 1)
