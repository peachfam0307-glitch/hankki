// 🧊🔴 **「장보기 탭 점 · 냉장고 ②」 재현판** — 창업자 확정 2026-09-06
//   *"맨 마지막장 시안으로 해줘 가져오기 장보기에 빨간 점_냉장고 2개"*
//   (홈 맨 위 한 줄(hold/유통기한홈줄-0906)은 *"줄이 셋이면 지저분해"* 로 접었다)
//
// ⭐ 재는 것
//   ① 임박(D-3 이내)·지난 재료가 있으면 탭바 장보기 카트에 점 · 홈엔 글줄이 «없다»
//   ② 장보기 화면 「냉장고」 탭에 그 개수 — D-20·기한 없음은 «안» 센다(냉장고 D-3 칩과 같은 잣대)
//   ③ 냉장고 탭을 열면 임박 재료가 맨 위(이미 있던 정렬)
//   ④ 재료를 지우면(✕) 점·숫자가 같이 꺼진다 — 닫기 단추 없이 «상태»로만
//   ⑤ 냉장고가 비었거나 기한 없는 재료뿐이면 점이 없다
//   ⑥ 순수 함수 = pantryExpiryCount 셈
//
// ⛔ 함정 사전(check-mistakes ⑧) — page.reload() ＋ addInitScript 는 시드가 저장값을 덮는다 → 새 컨텍스트로 연다.
// 실행: SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_repro-유통기한탭점-0906.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import http from 'node:http'
import { readFileSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { COACH } from '../src/coach.js'
import { pantryExpiryCount, expiringPantry } from '../src/pantryExpiry.js'

const ROOT = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p.startsWith('/hankki/')) p = p.slice(7)
  const f = join(ROOT, p === '/' ? 'index.html' : p)
  try { statSync(f); res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)) }
  catch { res.writeHead(404); res.end('nope') }
})
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port
const COACH_KEYS = Object.values(COACH)

const 날 = (n) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const 씨앗 = (pantry) => `
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'); localStorage.setItem('hankki:coach:loginpop', '1')
  localStorage.setItem('hankki:v1', JSON.stringify({
    recipes: [], folders: [], profile: { name: '한끼러버', bio: '' }, shops: [], wishlist: [],
    shoppingList: [], pantry: ${JSON.stringify(pantry)}, diary: [], seedV: 999, memoCleanV: 9, removedSeedIds: [],
  }))`

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const errs = []
let 통과 = 0, 전체 = 0
const 칸 = (좋나, 이름, 덧 = '') => { 전체++; if (좋나) 통과++; console.log(`${좋나 ? '✅' : '⛔'} ${이름}${덧 ? ' — ' + 덧 : ''}`) }

async function 창 (init) {
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await ctx.route('**/*.googleapis.com/**', (r) => r.abort())
  await ctx.route('**/*.gstatic.com/**', (r) => r.abort())
  const pg = await ctx.newPage()
  pg.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message))
  await pg.addInitScript((ks) => { ks.forEach((k) => localStorage.setItem(k, '1')) }, COACH_KEYS)
  await pg.addInitScript(init)
  await pg.goto(`http://localhost:${PORT}/hankki/`, { waitUntil: 'domcontentloaded' })
  await pg.waitForFunction(() => (document.body?.innerText || '').trim().length > 30, null, { timeout: 30000 })
  await pg.waitForTimeout(700)
  return { ctx, pg }
}
const 점 = (pg) => pg.locator('[data-testid="pantry-exp-dot"]').count()
const 숫자 = (pg) => pg.evaluate(() => document.querySelector('[data-testid="pantry-exp-count"]')?.textContent || '')

const 냉장고 = [
  { id: 'p1', name: '우유', icon: null, expiry: 날(1), addedAt: 1 },
  { id: 'p2', name: '두부', icon: null, expiry: 날(2), addedAt: 1 },
  { id: 'p3', name: '대파', icon: null, expiry: 날(20), addedAt: 1 },
  { id: 'p4', name: '소금', icon: null, expiry: null, addedAt: 1 },
  { id: 'p5', name: '요거트', icon: null, expiry: 날(-2), addedAt: 1 },
]

console.log('\n── 🧊🔴 장보기 탭 점 · 냉장고 ② ──')

// ⑥ 순수 함수부터
{
  칸(expiringPantry(냉장고).map((p) => p.name).join(',') === '요거트,우유,두부', '⑥ 임박·지남만 급한 순(요거트·우유·두부) · D-20·기한 없음은 «안» 센다', expiringPantry(냉장고).map((p) => p.name).join(','))
  칸(pantryExpiryCount(냉장고) === 3, '⑥ 개수 = 3', String(pantryExpiryCount(냉장고)))
  칸(pantryExpiryCount([냉장고[2], 냉장고[3]]) === 0, '⑥ 먼 것·기한 없음뿐이면 0')
  칸(pantryExpiryCount([]) === 0, '⑥ 빈 냉장고 = 0')
}

// ① 홈 — 탭바 점만, 글줄은 없다 · ② 장보기 「냉장고 3」 · ③ 맨 위 · ④ 지우면 꺼진다
{
  const { ctx, pg } = await 창(씨앗(냉장고))
  칸((await 점(pg)) === 1, '① 홈에서 장보기 카트에 점 하나', String(await 점(pg)))
  const 홈글 = await pg.evaluate(() => document.body.innerText)
  칸(!/유통기한 (지난|임박)|지나는 재료|오늘까지인 재료/.test(홈글), '① 홈에 유통기한 «글줄»은 없다(점만)')
  await pg.screenshot({ path: (process.env.SHOT_OUT || '/tmp') + '/탭점-1-홈.png' })
  await pg.getByRole('button', { name: '장보기', exact: true }).first().click({ force: true })
  await pg.waitForTimeout(900)
  칸((await 숫자(pg)) === '3', '② 장보기 화면 「냉장고 3」 — 참기름(D-20)·소금(기한 없음)은 안 센다', await 숫자(pg))
  await pg.screenshot({ path: (process.env.SHOT_OUT || '/tmp') + '/탭점-2-장보기.png' })
  await pg.locator('.seg', { hasText: '냉장고' }).first().click({ force: true })
  await pg.waitForTimeout(900)
  //    ⛔ `.exp-chip` 첫째는 안내 상자의 «D-3 보기»다 — 재료 줄(`.wish-row`)에서 본다
  const 첫줄 = await pg.evaluate(() => document.querySelector('.wish-row')?.innerText.replace(/\n/g, ' ') || '')
  칸(/요거트/.test(첫줄), '③ 냉장고 탭 맨 위 = 제일 급한 재료(요거트 2일 지남)', 첫줄)
  칸((await 숫자(pg)) === '3', '③ 냉장고 탭이 켜져도 숫자가 보인다', await 숫자(pg))
  await pg.screenshot({ path: (process.env.SHOT_OUT || '/tmp') + '/탭점-3-냉장고.png' })
  // ④ 요거트·우유·두부를 지운다 → 숫자·점이 꺼진다
  //    재료함은 급한 순이라 ✕(aria-label 삭제) «맨 위»를 세 번 누르면 요거트·우유·두부가 빠진다(확인 시트 없음 · PantryView.jsx:510)
  //    (playwright click 은 터치 컨텍스트에서 스크롤 상자 안 단추를 30초 기다리다 죽었다 → DOM 으로 누른다)
  for (let i = 0; i < 3; i++) {
    await pg.evaluate(() => document.querySelector('.wish-row button[aria-label="삭제"]')?.click())
    await pg.waitForTimeout(400)
  }
  //    ⛔ body 글 전체로 보면 안 된다 — 「요거트 아이스크림」 같은 추천 레시피 이름이 남는다 → 재료 줄만 본다
  const 남은 = await pg.evaluate(() => [...document.querySelectorAll('.wish-row')].map((r) => r.innerText.split('\n')[0]).join(','))
  const 다지웠나 = !/요거트|우유|두부/.test(남은)
  칸(다지웠나 ? (await 숫자(pg)) === '' && (await 점(pg)) === 0 : false, '④ 임박 재료를 다 지우면 숫자·점이 «같이» 꺼진다', `지웠나=${다지웠나} 숫자="${await 숫자(pg)}" 점=${await 점(pg)}`)
  await ctx.close()
}

// ⑤ 기한 없는 재료뿐 → 점 없음
{
  const { ctx, pg } = await 창(씨앗([냉장고[2], 냉장고[3]]))
  칸((await 점(pg)) === 0, '⑤ 먼 것·기한 없는 재료뿐이면 점이 «없다»')
  await ctx.close()
}

await b.close(); srv.close()
if (errs.length) console.log('⛔ pageerror:', errs.join(' | '))
console.log(`\n${통과}/${전체}`)
process.exit(통과 === 전체 && !errs.length ? 0 : 1)
