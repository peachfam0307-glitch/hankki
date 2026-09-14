// 🚨📅 **내일(2026-09-05) «저절로» 열리는 것을 «오늘» 검수한다** — 절대원칙 28
//
// 📮 창업자 = *"자동으로 올라가기 전날에 꼭 검수하고 내보내자. **이건 절대원칙.**"* (2026-08-01)
//    ＋ *"좋아 검수판 ㄱㄱ"* (2026-09-04)
//
// 🔢 `release-calendar.mjs --tomorrow` 실측 = **주부의 장바구니 제품 3개**
//    · 젓갈·액젓 — 양념낙지젓 (한살림)
//    · 스톡·육수 — 설성목장 한우 사골 곰탕 스틱 (쿠팡)
//    · 버섯·채소 — 국내산 베이비 브로콜리 (쿠팡)
//    ⛔ 컷(스티커)이 아니라 «제품»이다 — 그래서 `_shot-공개검수-0901` 을 그대로 못 쓴다.
//
// ⭐⭐ **어떻게 「내일」을 보나 — 날짜를 속인다**
//    `curation.js` 는 `it.from <= 오늘` 로 거른다. 그래서 오늘 화면엔 이 셋이 «없다».
//    ✅ 브라우저의 `Date` 를 내일로 돌려 **앱이 스스로 그 셋을 열게** 한다.
//       ⛔ 데이터를 파싱해 내가 다시 그리지 않는다 — 그러면 「앱과 다른 걸 보여주는」
//          2026-08-17 사고를 되풀이한다(절대원칙 30). 화면이 그린 것을 그대로 찍는다.
//
// 실행: BACKUP=<백업.json> node scripts/_shot-공개검수-0905.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const 볼날 = process.env.DAY || '2026-09-05'
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/공개검수-0905'
mkdirSync(OUT, { recursive: true })

const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(0, r))
const 집 = `http://127.0.0.1:${srv.address().port}/`

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
// 📱 폰 세로로 찍는다 — 창업자가 «폰에서» 검수한다(CLAUDE.md 검수판 절대원칙)
const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 3 })

// ⏰⏰ 날짜를 «내일»로 돌린다 — 앱이 스스로 그날 것을 연다
//    ⛔ `Date.now()` 만 바꾸면 `new Date()` 가 안 따라온다 → 생성자까지 통째로 감싼다.
//    ⭐ KST 정오로 맞춘다(자정 근처로 두면 시간대 때문에 하루가 밀린다 · 절대원칙 27)
await ctx.addInitScript((날) => {
  const [y, m, d] = 날.split('-').map(Number)
  const 고정 = Date.UTC(y, m - 1, d, 3, 0, 0)   // KST 정오
  const 진짜 = Date
  function 가짜(...a) {
    if (a.length === 0) return new 진짜(고정)
    return new 진짜(...a)
  }
  가짜.prototype = 진짜.prototype
  가짜.now = () => 고정
  가짜.parse = 진짜.parse
  가짜.UTC = 진짜.UTC
  Object.setPrototypeOf(가짜, 진짜)
  window.Date = 가짜
}, 볼날)
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch { /* noop */ } })

const 백업파일 = process.env.BACKUP
if (백업파일) {
  const 원본 = JSON.parse(readFileSync(백업파일, 'utf8'))
  const 담을것 = {}
  for (const k of Object.keys(원본)) if (!k.startsWith('_')) 담을것[k] = 원본[k]
  await ctx.addInitScript((v) => {
    try {
      const 이미 = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
      localStorage.setItem('hankki:v1', JSON.stringify({ ...이미, ...v }))
    } catch { /* noop */ }
  }, 담을것)
}

const p = await ctx.newPage()
p.setDefaultTimeout(15000)
await p.goto(집, { waitUntil: 'networkidle' })
await p.waitForTimeout(1800)
for (const 글자 of ['나중에 볼게요', '확인', '닫기']) {
  const t = p.getByRole('button', { name: 글자 }).first()
  if (await t.count()) { await t.click({ timeout: 2000 }).catch(() => {}); await p.waitForTimeout(500) }
}
// 🧹 청소 안내 띠가 걷힐 때까지
for (let i = 0; i < 14; i++) {
  if (!(await p.evaluate(() => /정리해|비웠어요/.test(document.body.innerText)))) break
  await p.waitForTimeout(1000)
}

// 🔎 날짜가 정말 내일로 갔나 — «시끄럽게» 확인한다(안 갔으면 오늘 것을 검수하게 된다)
const 앱날짜 = await p.evaluate(() => new Date().toISOString().slice(0, 10))
console.log(`⏰ 앱이 보는 날짜 = ${앱날짜} ${앱날짜 === 볼날 ? '' : ''}`)

const 탭 = p.locator('.bottom-nav .nav-item').filter({ hasText: '장보기' }).first()
if (await 탭.count()) { await 탭.click(); await p.waitForTimeout(1500) }

// 🛒 오늘 열리는 셋을 «이름으로» 찾아 각각 찍는다
const 볼것 = [
  { 이름: '양념낙지젓', 갈래: '젓갈·액젓', 몰: '한살림' },
  { 이름: '한우 사골 곰탕 스틱', 갈래: '스톡·육수', 몰: '쿠팡' },
  { 이름: '국내산 베이비 브로콜리', 갈래: '버섯·채소', 몰: '쿠팡' },
]

// 갈래 칩을 「전체」로 열어야 다 보인다
const 전체칩 = p.locator('.shop-chip').filter({ hasText: /^전체$/ }).first()
if (await 전체칩.count()) { await 전체칩.click({ timeout: 4000 }).catch(() => {}); await p.waitForTimeout(1200) }

let 찾은수 = 0
for (const v of 볼것) {
  // ⛔ 카드 «전체»를 찍는다 — 이름만 보면 설명·사러가기·딱지를 못 본다(전수 검수의 뜻이 없어진다)
  const 카드 = p.locator('div').filter({ hasText: new RegExp(v.이름) }).last()
  const 이름칸 = p.getByText(v.이름, { exact: false }).first()
  if (!(await 이름칸.count())) {
    console.log(`  ⛔⛔ 「${v.이름}」을 화면에서 못 찾았다 — 열리지 않았거나 이름이 다르다`)
    continue
  }
  await 이름칸.scrollIntoViewIfNeeded().catch(() => {})
  await p.waitForTimeout(700)
  // 그 줄이 든 «제품 카드»를 위로 올라가며 찾는다(사러가기 단추가 같이 든 상자까지)
  const 상자 = await 이름칸.evaluateHandle((el) => {
    let n = el
    for (let i = 0; i < 8 && n.parentElement; i++) {
      n = n.parentElement
      if (/사러가기|담기/.test(n.innerText || '')) return n
    }
    return el.parentElement
  })
  const 이름파일 = v.이름.replace(/\s+/g, '')
  await 상자.asElement()?.screenshot({ path: join(OUT, `${이름파일}.png`) }).catch(async () => {
    await p.screenshot({ path: join(OUT, `${이름파일}.png`) })
  })
  // 🔗 링크가 어디로 가나 — «화면이 실제로 쓰는» 값을 읽는다
  const 링크 = await 상자.asElement()?.evaluate((n) => {
    const a = n.querySelector('a[href]')
    return a ? a.getAttribute('href') : (/사러가기/.test(n.innerText) ? '(단추인데 href 없음)' : '(사러가기 없음)')
  }).catch(() => '(못 읽음)')
  console.log(`  ✅ ${v.이름}  [${v.갈래} · ${v.몰}]  링크 = ${링크}`)
  찾은수++
}

await p.screenshot({ path: join(OUT, '00-장보기-전체.png'), fullPage: true })
console.log(`\n🔢 ${찾은수}/${볼것.length} 개를 찍었다`)
await b.close(); srv.close()
console.log(`📁 ${OUT}`)
console.log('⭐ 규칙 21 — 열어서 «고화질로» 보고 판정한다')
