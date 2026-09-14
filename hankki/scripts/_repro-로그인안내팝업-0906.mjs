// ☁️📣 로그인 안내 팝업 — «이미 쓰던 사람 · 로그인 안 함 · 레시피 1편↑»에게 딱 한 번 (창업자 2026-09-06 ㄱㄱ)
//
// 📮 창업자 = *"그럼 로그인 안내부터 하자 ㄱㄱ"* → *"안내 팝업이 낫지않을까??"* → *"로그인을 해야 남는거잖아."*
// ⭐ 이 판이 지키는 것
//    ⓐ 쓰던 사람(레시피 1편·로그인 안 함·소식 팝업 꺼짐)에겐 **뜬다** — 확정 문구 첫 줄 ＋ 이유 세 줄
//    ⓑ 「나중에 하기」로 닫으면 **다시 켜도 안 뜬다**(한 번만 · 재촉 금지)
//    ⓒ 로그인해 둔 사람에겐 **안 뜬다**
//    ⓓ 갓 깐 사람(내 레시피 0)에겐 **안 뜬다** — 잃을 게 없다
//    ⓔ 뜨는 날은 홈의 「로그인하면 새 폰에서도」 한 줄이 **같이 안 그려진다** — 같은 말 두 번 = 재촉
//    ⓕ 숫자(열쇠 10→30 · 편수)가 **코드 값**과 같다 — 글자로 박지 않았다
// ⛔ 뿌리를 컨테이너 경로로 박지 않는다(2026-08-31 #1965·#1966 교훈) — 이 파일 자리에서 dist 를 찾는다.
import { chromium } from 'playwright'
import http from 'node:http'
import { readFileSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
// ⛔ SEED_COACH_SEEN 을 쓰면 «이 팝업도» 본 상태가 된다(열쇠가 코치 접두어 아래) → 코치 열쇠만 «이름으로» 심는다
import { COACH } from '../src/coach.js'
const COACH_KEYS = Object.values(COACH).filter((k) => k !== COACH.loginpop) // ⭐ 이 팝업 열쇠만 «빼고» 심는다

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

const 씨앗 = ({ 편수 = 1, 일기 = 0, 로그인 = false, 봤음 = false } = {}) => `
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'); localStorage.setItem('hankki:coach:home', '1')
  ${로그인 ? "localStorage.setItem('hankki:cloud:on', '1')" : ''}
  ${봤음 ? `localStorage.setItem('${COACH.loginpop}', '1')` : ''}
  localStorage.setItem('hankki:v1', JSON.stringify({
    recipes: ${JSON.stringify(Array.from({ length: 편수 }, (_, i) => ({ id: 'u' + i, title: '내가 쓴 레시피 ' + i, ingredients: [], steps: [] })))},
    folders: [], profile: { name: '한끼러버', bio: '' }, shops: [], wishlist: [],
    shoppingList: [], pantry: [], diary: ${JSON.stringify(Array.from({ length: 일기 }, (_, i) => ({ id: 'd' + i, kind: 'diary', title: '오늘 한 끼 ' + i, date: '2026-09-0' + (i + 1) })))}, seedV: 999, memoCleanV: 9, removedSeedIds: [],
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
const 팝업글 = (pg) => pg.evaluate(() => document.querySelector('.sheet-mask .sheet')?.innerText || '')

// ⓐ 쓰던 사람 → 뜬다 · 문구 · 숫자
{
  const { ctx, pg } = await 창(씨앗({ 편수: 12, 일기: 3 }))
  const 글 = await 팝업글(pg)
  칸(/앱을 지우거나 폰을 바꾸면/.test(글) && /내가 저장한 레시피 12편·일기 3편이 사라져요/.test(글.replace(/\n/g, '')), 'ⓐ 쓰던 사람(레시피 12·일기 3)에게 팝업이 뜬다 · 첫 줄 = 확정 문구 ＋ 둘 다', 글.slice(0, 70).replace(/\n/g, ' / '))
  칸(/구글로 로그인하면/.test(글) && /폰을 바꿔도, 앱을 다시 깔아도 그대로 남아요/.test(글) && /패드에서도 이어서 써요/.test(글), 'ⓐ 이유 세 줄 중 둘이 확정 문구 그대로')
  // ⓕ 열쇠 숫자 = 코드 값(WELCOME_ANON → WELCOME_ACCT)
  // ⛔ ocr.js 를 node 에서 import 하지 않는다(브라우저 전제) — 파일 글자에서 상수를 읽는다(내보내지 않은 const 라서)
  const ocr = readFileSync(join(new URL('..', import.meta.url).pathname, 'src/ocr.js'), 'utf8')
  const 상수 = (n) => Number((ocr.match(new RegExp(`const ${n} = (\\d+)`)) || [])[1])
  const WELCOME_ANON = 상수('WELCOME_ANON'), WELCOME_ACCT = 상수('WELCOME_ACCT')
  const KEY_NAME = (ocr.match(/export const KEY_NAME = '([^']+)'/) || [])[1]
  const 열쇠줄 = new RegExp(`무료 ${KEY_NAME}가 ${WELCOME_ANON}개 → ${WELCOME_ACCT}개로 늘어요`)
  칸(열쇠줄.test(글), `ⓕ 열쇠 줄이 코드 값과 같다 (${WELCOME_ANON} → ${WELCOME_ACCT})`)
  칸(/구글로 로그인/.test(글) && /나중에 하기/.test(글), 'ⓐ 단추 둘 = 구글로 로그인 · 나중에 하기')
  // 📏 줄간격 — 이유 세 줄 사이가 붙어 있지 않다(창업자 *"줄간격 신경써서"*)
  const 간격 = await pg.evaluate(() => {
    const 줄 = [...document.querySelectorAll('.sheet-mask .sheet div')].filter((d) => /^·/.test(d.innerText.trim()) && d.children.length === 2)
    if (줄.length < 3) return null
    const r = 줄.map((d) => d.getBoundingClientRect())
    return Math.round(Math.min(r[1].top - r[0].bottom, r[2].top - r[1].bottom))
  })
  칸(간격 !== null && 간격 >= 6, '📏 이유 세 줄 사이 간격 ≥ 6px', `${간격}px`)
  // ⓔ 홈 한 줄이 같이 안 그려진다
  const 본문 = await pg.evaluate(() => document.body.innerText)
  const 홈줄수 = (본문.match(/로그인하면 새 폰에서도 이어서 써요/g) || []).length
  칸(홈줄수 === 0, 'ⓔ 뜨는 날은 홈 「로그인하면 새 폰에서도」 한 줄이 안 그려진다', `${홈줄수}곳`)
  // ⓑ 「나중에 하기」 → 표식 · 다시 켜도 안 뜬다
  await pg.evaluate(() => [...document.querySelectorAll('.sheet-mask .sheet button')].find((x) => x.innerText.trim() === '나중에 하기')?.click())
  await pg.waitForTimeout(400)
  // ⛔⛔ 열쇠 이름을 «글자로» 박지 않는다 — 2026-09-08 에 이름을 갈자(loginpop→loginpop2) 이 판이 배포를 막았다.
  //    `COACH` 를 부르면 이름이 바뀌어도 검사는 «같은 것»을 잰다.
  const 표식 = await pg.evaluate((k) => localStorage.getItem(k), COACH.loginpop)
  칸(표식 === '1' && !(await 팝업글(pg)), 'ⓑ 「나중에 하기」 → 봤음 표식 · 닫힌다')
  await pg.reload({ waitUntil: 'domcontentloaded' })
  await pg.waitForFunction(() => (document.body?.innerText || '').trim().length > 30, null, { timeout: 30000 })
  await pg.waitForTimeout(700)
  칸(!/사라져요/.test(await 팝업글(pg)), 'ⓑ 다시 켜도 안 뜬다(한 번만)')
  await ctx.close()
}
// ⓒ 로그인해 둔 사람 → 안 뜬다
{
  const { ctx, pg } = await 창(씨앗({ 편수: 5, 로그인: true }))
  칸(!/사라져요/.test(await 팝업글(pg)), 'ⓒ 로그인해 둔 사람에겐 안 뜬다')
  await ctx.close()
}
// ⓓ **[창업자 확정 2026-09-08 · 잣대가 뒤집혔다] 0편인 사람에게도 «뜬다».**
//   📮 창업자 = *"0편인 사람한테도 뜨게 하자"* ＋ *"앞으로 저장하는 것들을 잃게 된다고 알려줘야할 듯"*
//   ⛔ 옛 잣대 = 「잃을 게 없으니 안 뜬다」. 그런데 **0편이 제일 위험하다** —
//      지금 잃을 건 없지만 **앞으로 쌓을 것을 통째로** 잃는다. 그래서 문구도 「앞으로 저장할…」로 갈랐다.
//   ⭐ 그래서 여기서 재는 것도 바뀐다 = 「뜨나」 ＋ **「0편 전용 문구가 나오나」**
//      (0편 갈래가 없으면 「내가 저장한 «이» 사라져요」로 «깨진 문장»이 나온다 — 그걸 이 칸이 막는다)
{
  const { ctx, pg } = await 창(씨앗({ 편수: 0, 일기: 0 }))
  const 글 = await 팝업글(pg)
  칸(/사라져요/.test(글), 'ⓓ 0편인 사람에게도 뜬다(앞으로 쌓을 것을 잃는다)')
  칸(/앞으로 저장할 레시피와 일기가/.test(글), 'ⓓ-b 0편 전용 문구가 나온다(「내가 저장한 이」가 아니다)')
  await ctx.close()
}
// ⓖ 일기만 쓴 사람 → 뜬다 · 첫 줄은 「일기 M편」만(레시피 0편을 부르지 않는다)
{
  const { ctx, pg } = await 창(씨앗({ 편수: 0, 일기: 2 }))
  const 글 = (await 팝업글(pg)).replace(/\n/g, '')
  칸(/내가 저장한 일기 2편이 사라져요/.test(글) && !/레시피 0편/.test(글), 'ⓖ 일기만 2편이면 뜬다 · 첫 줄 = 「일기 2편」만', 글.slice(0, 50))
  await ctx.close()
}
// ⓗ 레시피만 쓴 사람 → 첫 줄은 「레시피 N편」만
{
  const { ctx, pg } = await 창(씨앗({ 편수: 5, 일기: 0 }))
  const 글 = (await 팝업글(pg)).replace(/\n/g, '')
  칸(/내가 저장한 레시피 5편이 사라져요/.test(글) && !/일기/.test(글.split('사라져요')[0]), 'ⓗ 레시피만 5편이면 첫 줄 = 「레시피 5편」만')
  await ctx.close()
}

await b.close(); srv.close()
if (errs.length) console.log('⛔ pageerror:', errs.join(' | '))
console.log(`\n${통과}/${전체}`)
process.exit(통과 === 전체 && !errs.length ? 0 : 1)
