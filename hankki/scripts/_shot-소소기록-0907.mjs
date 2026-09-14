// 📸📔 소소 기능 캐러셀 3편 「기록은 내 것」 앱 화면 재료 (2026-09-07)
//
// 📮 창업자 20:13 확정 묶음 ② = 제철 · 우리집 · SNS 영상칩 · 다른 추천 · 자주 해먹는 · 검색/폴더/북마크
// 📮 창업자 23:50 = *"패드 되는 것도 한 줄 넣어줘"* → 패드(820×1180) 홈도 한 장 찍는다
//
// ⭐ 재료는 «UI 로» 넣는다 — 「만들었어요」를 눌러 cooked 를 쌓아야 「자주 해먹는 요리」 줄이 뜬다.
// ⭐ 규칙 21 — 찍고 «열어 보고» 판정한다.
//
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/_shot-소소기록-0907.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = process.env.OUT || join(ROOT, 'design/promo/소소기능-앱화면-2509/기록')
mkdirSync(OUT, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4432, r))
const URL0 = 'http://127.0.0.1:4432/hankki/'

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const 문닫기 = (ctx) => ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
await ctx.addInitScript(SEED_COACH_SEEN); await 문닫기(ctx)
const p = await ctx.newPage()
const 쉼 = (ms) => p.waitForTimeout(ms)
const 찍 = async (이름, pg = p) => { await pg.screenshot({ path: join(OUT, 이름 + '.png') }); console.log('  📸', 이름) }
const 탭 = async (글자) => { await p.locator('.bottom-nav .nav-item').filter({ hasText: 글자 }).first().click(); await 쉼(1100) }
const 맨위 = () => p.evaluate(() => { document.querySelectorAll('*').forEach((e) => { if (e.scrollHeight > e.clientHeight + 4) e.scrollTop = 0 }); window.scrollTo(0, 0) })
const 보이게 = async (loc, block = 'center') => { await loc.evaluate((el, block) => el.scrollIntoView({ block }), block); await 쉼(500) }

await p.goto(URL0, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready); await 쉼(900)

// ── ① 창업자 백업(2026-09-07 · 레시피 269 · 만든 것 14 · 책갈피 12 · 폴더 12)을 «앱 UI 로» 불러온다 ─────
//    📮 창업자 = *"옛화면 그만찍고 요즘 화면찍어"* · *"이것도 예전꺼 찍기 금지. 최신 json파일 내가 줬잖아"*
//    ⛔ 시드 화면으로 찍지 않는다 — 실제 창업자 폰과 같은 데이터로 찍는다.
const 백업 = process.env.BACKUP || join(ROOT, 'docs/_내레시피-백업/2026-09-07.json')
await p.locator('button[aria-label="설정"]').first().click(); await 쉼(900)
// 「백업 파일 불러오기」는 설정의 「백업」 카드를 눌러 여는 시트 «안»에 있다
const 백업카드 = p.locator('[data-coach="backup"]').first(); await 백업카드.evaluate((el) => el.scrollIntoView({ block: 'center' })); await 쉼(300); await 백업카드.click(); await 쉼(900)
// ⛔ 「백업 파일 불러오기」(파일 고르기)는 Playwright 에선 onChange 가 안 난다(filechooser·setInputFiles 둘 다 12초 기다려도 시트 없음 · _probe-백업시트-0907)
//    → 「코드 붙여넣기로 불러오기」에 JSON 글자를 통째로 넣는다. 앱 쪽 흐름은 둘 다 같은 importFromText/불러오기끝 이다.
const 불러 = p.getByRole('button', { name: '코드 붙여넣기로 불러오기' }).first()
await 불러.evaluate((el) => el.scrollIntoView({ block: 'center' })); await 쉼(300)
await 불러.click(); await 쉼(700)
await p.locator('textarea:visible').first().evaluate((el, v) => { const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set; set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })) }, readFileSync(백업, 'utf8'))
await 쉼(400); await p.getByRole('button', { name: '불러오기', exact: true }).last().click()
// ⏳ 7MB 를 읽고 파싱한 뒤에야 확인 시트(「레시피 N개가 담긴 백업이에요」)가 뜬다 — 뜰 때까지 기다린다(1.5초로는 안 떠서 시드 70편을 찍었었다)
await p.getByText(/레시피 \d+개가 담긴 백업/).waitFor({ timeout: 60000 })
await p.getByRole('button', { name: '불러오기', exact: true }).last().click(); await 쉼(5000)
console.log('  📦 백업 불러옴 →', 백업.split('/').pop())
await p.goto(URL0, { waitUntil: 'networkidle' }); await 쉼(1200)

// ── ② 홈 「한 줄 남기기」 → 별점·한 줄 시트 ──────────────────
//    ⛔ 「만들었어요」는 눌러도 폼이 «안» 뜬다(RecipeDetailScreen 252줄 · 창업자 확정 2026-08-06 = 토스트만).
//       별점을 매기는 자리는 둘뿐 = 홈 「한 줄 남기기」(OneLineSheet) · 레시피 상세 포스트잇(.memo-note)
await 탭('홈'); await 맨위(); await 쉼(800)
// ⚠️ 실측(_probe-기록화면-0907) — 창업자 백업에선 홈에 「한 줄 남기기」 카드가 «안» 뜬다.
//    nextUp 은 «다음 날부터» 뜨고 note 가 차면 빠진다(HomeScreen 307·311줄) → 백업엔 이미 다 찼다.
//    그래서 별점·메모는 «레시피 상세 포스트잇»(.memo-note → DiaryEntrySheet)으로 간다.
const 한줄카드 = p.getByText('한 줄 남기기', { exact: false }).first()
if (await 한줄카드.count()) {
  await 보이게(한줄카드); await 찍('01-홈-한줄남기기카드')
  await 한줄카드.click(); await 쉼(900)
  const 시트 = p.locator('.sheet.one-sheet')
  if (await 시트.count()) {
    await 찍('02-시트-한줄-빈판')
    // 별 넷을 주고 한 줄을 적은 «쓴 뒤» 모습까지 — 빈 판만 보여주면 기능이 안 보인다
    const 별 = p.locator('button[aria-label="4점"]').first()
    if (await 별.count()) { await 별.click(); await 쉼(500) }
    const 글칸 = p.locator('textarea.one-note').first()
    if (await 글칸.count()) { await 글칸.fill('간장 반만 · 면 1분 덜 삶기'); await 쉼(600) }
    await 찍('03-시트-한줄-쓴뒤')
    const 나중 = p.locator('.one-later')
    if (await 나중.count()) { await 나중.click(); await 쉼(700) }
  } else console.log('  ⚠️ 한 줄 시트가 안 떴다')
} else console.log('  ⚠️ 홈에 「한 줄 남기기」 카드가 없다')

// ── ③ 레시피 상세 포스트잇(메모) ─────────────────────────────
await 탭('레시피'); await 맨위(); await 쉼(700)
// ⚠️ .album-tile 은 «일기» 탭에 있다(레시피 탭엔 0개 · 실측). 상세로 가는 길은 홈의 「자주 해먹는」 미니카드다.
await 탭('홈'); await 맨위(); await 쉼(700)
// ⚠️ 실측 — .h-section 안에서 .mini-card 를 찾으면 0 이다(줄 머리와 가로 스크롤이 형제다).
//    그래서 홈의 미니카드를 «앞에서부터» 눌러 보고 «포스트잇이 있는» 레시피를 찾는다(메모가 없는 편도 있다).
// 🔎 창업자 2026-09-07 = *"소이 최애반찬은 다른 레시피로 바꿔줘"* — 「소이」·「우리 딸」은 개인 이름이라 홍보물에 안 쓴다.
//    대신 «기능을 그대로 보여주는» 메모를 골랐다 = 수제 떡갈비
//    「감칠맛+단맛 살짝 더 들어가면 좋을 듯 / 아우노올리고당 넣어야겠다」 별 4 — 이게 「다음엔 이렇게」다.
//    ⛔ 미니카드를 훑지 않고 «검색으로 콕» 집는다 — 홈 차례가 바뀌어도 같은 레시피가 나온다
let 열림 = false
await p.locator('button[aria-label="검색"]').first().click(); await 쉼(900)
const 검색칸 = p.locator('input[placeholder="검색어를 입력하세요"]').first()
if (await 검색칸.count()) {
  await 검색칸.fill('수제 떡갈비'); await 쉼(1100)
  const 결과 = p.locator('.grid-card').first()   // 검색 결과 = .grid-card (SearchScreen 68줄)
  if (await 결과.count()) {
    await 결과.click(); await 쉼(1500)
    if (await p.locator('.memo-note').count()) 열림 = true
    else console.log('  ⚠️ 수제 떡갈비에 포스트잇이 없다')
  } else console.log('  ⚠️ 검색 결과가 없다')
}
if (!열림) console.log('  ⚠️ 포스트잇이 붙은 레시피를 못 찾았다')
const 첫칸 = p.locator('.memo-note').first()
if (열림) {
  const 포스트잇 = p.locator('.memo-note').first()
  if (await 포스트잇.count()) {
    await 보이게(포스트잇, 'center'); await 찍('04-상세-포스트잇')
    // 포스트잇을 누르면 «요리 기록» 시트가 열린다 = 별점·사진·메모 한 화면
    await 포스트잇.click(); await 쉼(1100)
    if (await p.locator('.sheet').count()) {
      await 찍('02-시트-기록-별점메모')
      // ⚠️ 실측 — 이 기록은 «이미 별 4» 라서 4점을 누르면 토글로 «꺼져» 별 0 이 찍혔다. 5점으로 올린다.
      const 별5 = p.locator('button[aria-label="5점"]').first()
      if (await 별5.count()) { await 별5.click(); await 쉼(500); await 찍('03-시트-기록-별넷') }
      // 시트 닫기 — Escape 로는 안 닫혀서 «덮개»를 직접 누른다(실측)
      await p.locator('.sheet-mask').first().click({ position: { x: 10, y: 10 } }).catch(() => {})
      await 쉼(900)
    } else console.log('  ⚠️ 포스트잇을 눌러도 기록 시트가 안 열렸다')
  }
  else console.log('  ⚠️ 포스트잇이 없다(메모·기록이 없는 레시피다)')
  // 요리모드 — 「화면이 꺼지지 않아요」
  const 요리 = p.locator('[data-coach="cook"]').first()
  if (await 요리.count()) {
    await 보이게(요리, 'center'); await 요리.click({ force: true }); await 쉼(1600)
    const 안내 = p.getByText('화면이 꺼지지 않아요', { exact: false }).first()
    if (await 안내.count()) { await 보이게(안내, 'center'); await 찍('05-요리모드-화면안꺼짐') }
    else { await 찍('05-요리모드-화면안꺼짐'); console.log('  ⚠️ 「화면이 꺼지지 않아요」 글자를 못 찾았다') }
    // 🍳 여기까지는 «재료 준비» 화면이다 — 창업자 2026-09-07 = *"요리하는 동안 안꺼지는 걸 보여줘야하는데 안맞잖아"*
    //    「재료 준비 완료 · 시작 →」을 눌러야 «요리하는 동안»의 단계 화면(큰 글씨 ＋ 타이머)이 나온다
    const 시작 = p.getByRole('button', { name: /재료 준비 완료/ }).first()
    if (await 시작.count()) {
      await 시작.click({ force: true }); await 쉼(1800)
      await 찍('05b-요리모드-단계')
      // ⏱ 타이머가 붙은 단계까지 넘겨 본다 — 「필요할 때 단계에서 눌러 쓰세요」의 실물
      for (let i = 0; i < 6; i++) {
        const 타이머 = p.getByText(/분|초/).filter({ hasText: /타이머|⏱|시작/ }).first()
        if (await 타이머.count()) break
        const 다음 = p.getByRole('button', { name: /다음|→/ }).last()
        if (!(await 다음.count())) break
        await 다음.click({ force: true }); await 쉼(900)
      }
      await 찍('05c-요리모드-타이머')
    } else console.log('  ⚠️ 「재료 준비 완료」 단추를 못 찾았다')
    await p.goBack(); await 쉼(900)
  }
  await p.goBack(); await 쉼(900)
}

// ── ④ 한끼 일기 — 달력 ──────────────────────────────────────
await 탭('일기'); await 맨위(); await 쉼(900)
const 달력 = p.locator('[data-coach="cal"]').first()
// 📮 창업자 2026-09-07 = *"해먹은 날이 달력에 쌓여요에서 달력에 쌓인게 별로 없어"* — 맞다.
//    9월은 7일까지라 일기가 6일치뿐이다(8월은 17일치). ⛔데이터를 지어내지 않고 «지난 달»로 넘겨 찍는다.
if (await 달력.count()) {
  await 보이게(달력, 'start')
  await p.locator('button[aria-label="이전 달"]').first().click(); await 쉼(900)
  await 찍('06-일기-달력')
}
else console.log('  ⚠️ 달력을 못 찾았다')

// ── ⑤ 일기 꾸미기 — 속지(종이·선) · 글씨체 ─────────────────────
const 일기쓰기 = p.locator('[data-coach="diary-write"]').first()
if (await 일기쓰기.count()) {
  await 보이게(일기쓰기, 'center'); await 일기쓰기.click(); await 쉼(1500)
  // 🎁 실측 — 일기를 열면 「받은 선물」 시트가 먼저 뜬다. 안 닫으면 꾸미기 판을 덮어 «선물 시트»가 찍힌다(07·08 이 그랬다)
  const 나중에 = p.getByRole('button', { name: '나중에 볼게요' }).first()
  if (await 나중에.count()) { await 나중에.click(); await 쉼(900); console.log('  🎁 선물 시트 닫음') }
  const 꾸미기 = p.locator('button[aria-label="꾸미기 열기"]').first()
  if (await 꾸미기.count()) {
    await 꾸미기.click({ force: true }); await 쉼(1800)
    // 🎁 실측 — 「받은 선물」 시트는 꾸미기를 «연 뒤에» 떠서 판을 통째로 덮는다(07·08 이 그 시트로 찍혔다).
    //    그래서 닫기는 «여기»서 한다. 열기 «전»에 찾으면 아직 없어서 못 찾는다.
    for (let i = 0; i < 3; i++) {
      const 나중에 = p.getByRole('button', { name: '나중에 볼게요' }).first()
      if (!(await 나중에.count())) break
      await 나중에.click({ force: true }); await 쉼(900); console.log('  🎁 선물 시트 닫음')
    }
    // ⚠️ 꾸미기 판은 Portal 이라 .app-frame «밖»에 뜬다 — 프레임 안에서 찾지 말 것
    await 찍('07-꾸미기-속지')
    const 글쓰기탭 = p.locator('button.seg', { hasText: '글쓰기' }).first()
    // ⛔ 꾸미기 판 위에 .sheet-mask 가 덮여 있어 보통 클릭이 튕긴다(실측) → force
if (await 글쓰기탭.count()) { await 글쓰기탭.click({ force: true }); await 쉼(900); await 찍('08-꾸미기-글씨체') }
    else console.log('  ⚠️ 「글쓰기」 탭을 못 찾았다')
  } else console.log('  ⚠️ 「꾸미기」 단추를 못 찾았다')
}

// ── ⑥ 설정 — 백업·클라우드 · 테마 ─────────────────────────────
await p.goto(URL0, { waitUntil: 'networkidle' }); await 쉼(1200)
await 탭('홈'); await 맨위(); await 쉼(700)   // ⛔ 설정 단추는 «홈»에만 있다(꾸미기에서 바로 가면 못 찾는다 · 실측)
await p.locator('button[aria-label="설정"]').first().click(); await 쉼(1000)
const 백업카드2 = p.locator('[data-coach="backup"]').first()
if (await 백업카드2.count()) { await 보이게(백업카드2, 'center'); await 찍('09-설정-백업클라우드') }
const 테마 = p.getByText('앱 화면 색을 골라요', { exact: false }).first()
if (await 테마.count()) { await 보이게(테마, 'center'); await 찍('10-설정-테마') }
else console.log('  ⚠️ 테마 칸을 못 찾았다')

await b.close(); srv.close()
console.log(`\n✅ → ${OUT}`)
