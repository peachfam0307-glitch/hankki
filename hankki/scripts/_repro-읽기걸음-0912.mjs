// 📖📖 [2026-09-12] 「읽었나 / 못 읽었나」가 «정확히» 나가나 — 앱을 돌려서 잰다
//
// 📮 창업자 = *"제대로 확인하고 잘 작동되나 검토하고 심어. 눈으로 보고 재현하고.
//    **엉뚱하게 잘못재면 타격이 커**"* — 맞는 말이라 «부풀지 않는지»를 제일 세게 잰다.
//
// ⛔⛔ **왜 필요했나** = 2026-09-12 실측에서 「갈래 고름 10명 → 저장 1명」 사이가 깜깜했다.
//    그 아홉이 «읽기에서» 샜는지 «읽은 뒤»에 샜는지 몰랐다.
//
// 🔒 재는 것 넷
//   ① 글자가 나오면 import_read_ok
//   ② 빈손이면 import_read_fail
//   ③ ⭐⭐ **사진 3장을 넣어도 «한 번»만** — 장마다 세면 3장 넣은 사람이 3명처럼 보인다
//   ④ 둘이 «같이» 나가지 않는다 (ok 와 fail 이 동시에 뜨면 숫자가 두 배가 된다)
//
// ⛔ 구글 태그·워커를 다 가로챈다 — 밖으로 한 건도 안 나간다.
// ⛔⛔ serviceWorkers: 'block' — SW 가 fetch 를 가로채면 route 가 한 건도 못 잡는다(2026-09-10 교훈).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4487, r))

let 나쁨 = 0
const 잰다 = (참, 말, 값 = '') => { if (참) console.log(`  ✅ ${말}${값 ? `  ${값}` : ''}`); else { 나쁨 += 1; console.log(`  ⛔ ${말}${값 ? `  ${값}` : ''}`) } }

const { SEED_COACH_SEEN } = await import(join(ROOT, 'src/coach.js'))
// 📅 「오늘(KST)」은 «한 곳»에서만 만든다 — 절대원칙 27. 앱과 «같은 값»을 쓴다(절대원칙 30).
const { todayKST } = await import(join(ROOT, 'src/today.js'))
const 오늘 = todayKST()
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// 📷 글자가 든 작은 PNG — 파일 고르기에 물릴 «진짜 파일»
const 사진 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAGQAAAAyCAIAAAC4GHDeAAAAWklEQVR4nO3QMQEAAAjDMMC/56EB' +
  'ExIFfXpnAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAvBpVSAABw3aBpwAAAABJRU5ErkJggg==', 'base64')

/**
 * 🚪 가져오기 → ③「한끼 앱에서 사진 가져오기」 → 사진 N장 → 전체 사용 → 다 읽을 때까지
 * @param 장수   물릴 사진 수
 * @param 읽힌글자 워커가 돌려줄 글자. '' 이면 «빈손»(못 읽음)을 흉내낸다.
 */
async function 읽어본다(장수, 읽힌글자) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 860 }, locale: 'ko-KR', serviceWorkers: 'block' })
  await ctx.route('**://www.googletagmanager.com/**', (r) => r.abort())
  await ctx.route('**://*.google-analytics.com/**', (r) => r.abort())
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript((오늘) => {
    try {
      localStorage.setItem('hankki:onboarded', '1')
      localStorage.setItem('hankki:news:off', '1')
      localStorage.setItem('hankki:nudge:cloudgate', '1')
      // 📅 「다시 왔나」가 끼어들지 않게 오늘 날짜를 미리 적어 둔다 — 이 판은 읽기만 잰다.
      //    ⛔ 날짜를 여기서 «만들지» 않는다(절대원칙 27) — 앱과 같은 todayKST() 값을 밖에서 받아 넣는다.
      localStorage.setItem('hankki:lastOpen', 오늘)
    } catch { /* noop */ }
  }, 오늘)
  const p = await ctx.newPage()
  // 🕸 워커를 가로채 «우리가 정한 글자»를 돌려준다 — 밖으로 안 나가고, 빈손도 흉내낼 수 있다.
  await p.route('**/hankki-ocr.annyeong-hankki.workers.dev/**', async (route) => {
    let 몸 = {}
    try { 몸 = JSON.parse(route.request().postData() || '{}') } catch { /* noop */ }
    const left = { welcome: 19, month: 5, cap: 19, bonus: 0, earned: [], anon: 10, acct: 30, signed: false }
    await route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify(몸.image ? { text: 읽힌글자, 깎음: true, 왜: '정상', left } : { ok: true, left }),
    })
  })
  await p.goto('http://127.0.0.1:4487/hankki/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(2200)
  await p.locator('.nav-item', { hasText: '가져오기' }).first().click()
  await p.waitForTimeout(900)
  await p.locator('.imp-opt').nth(2).click()   // ③ 한끼 앱에서 사진 가져오기
  await p.waitForTimeout(700)
  await p.locator('input[type=file]').first().setInputFiles(
    Array.from({ length: 장수 }, (_, i) => ({ name: `r${i}.png`, mimeType: 'image/png', buffer: 사진 })))
  await p.waitForTimeout(1500)
  // ✂️ 자르기 시트가 장마다 뜬다 — 「전체 사용」을 장수만큼 눌러 준다.
  // ⛔⛔ 장마다 자르기 시트가 «다시» 뜬다 — 다 눌러야 finishOcr 가 불린다.
  //    한 장이라도 덜 누르면 「읽기가 안 끝난 상태」가 되어 잣대가 «0번»으로 헛돈다.
  //    📌 2026-09-12 에 실제로 그렇게 헛돌았다 — 기다림이 짧아 시트가 아직 안 떠 있었다.
  let 누른수 = 0
  for (let i = 0; i < 장수 + 2; i++) {
    const 전체 = p.locator('button', { hasText: '전체 사용' }).first()
    try { await 전체.waitFor({ state: 'visible', timeout: 12000 }) } catch { break }
    await 전체.click()
    누른수 += 1
    await p.waitForTimeout(3000)
  }
  await p.waitForTimeout(6000)   // 🤖 AI 다듬기까지 기다린다(finishOcr 가 async 다)
  const 이름들 = await p.evaluate(() => [...(window.dataLayer || [])]
    // ⛔ dataLayer 에는 «배열이 아닌 것»도 들어온다(GTM 의 { 'gtm.start': … }) — 펼치면 죽는다
    .filter((a) => a && typeof a.length === 'number')
    .map((a) => [...a])
    .filter((a) => a[0] === 'event' && a[1] === 'page_view')
    .map((a) => a[2]?.page_title))
  // 👁 눈으로 본다 — 편집 화면에 «글자가 들어갔나». 안 들어갔으면 읽기가 안 끝난 것이다.
  const 글자들어감 = await p.evaluate(() => {
    const t = [...document.querySelectorAll('textarea')].map((e) => e.value).join('').trim()
    return t.length
  })
  // ⛔ 캡처는 «저장소에 안 남긴다» — SHOT=1 로 켤 때만. (new URL().pathname 은 한글을 %인코딩한다)
  if (process.env.SHOT) await p.screenshot({ path: join(ROOT, `_읽기걸음-${장수}장.jpg`), quality: 40, type: 'jpeg' })
  await ctx.close()
  return { 이름들, 누른수, 글자들어감 }
}

console.log('\n📖 읽기 걸음\n')

// ── ① 글자가 나오면 ok · ② 둘이 같이 안 나간다
{
  const { 이름들 } = await 읽어본다(1, '재료\n감자 2개\n만드는 법\n볶아요')
  const ok = 이름들.filter((n) => n === 'import_read_ok').length
  const fail = 이름들.filter((n) => n === 'import_read_fail').length
  잰다(ok === 1, '① 글자가 나오면 import_read_ok 가 «한 번»', `ok ${ok} · fail ${fail} · ${JSON.stringify(이름들)}`)
  잰다(fail === 0, '② ⭐ok 와 fail 이 «같이» 안 나간다')
  잰다(이름들.includes('import_photo'), '① 갈래(import_photo)도 같이 잡힌다 — 퍼널이 이어진다')
}

// ── ③ ⭐⭐ 빈손이면 fail
{
  const { 이름들 } = await 읽어본다(1, '')
  const ok = 이름들.filter((n) => n === 'import_read_ok').length
  const fail = 이름들.filter((n) => n === 'import_read_fail').length
  잰다(fail === 1, '③ ⭐빈손이면 import_read_fail 이 «한 번»', `ok ${ok} · fail ${fail}`)
  잰다(ok === 0, '③ 그때 ok 는 «안» 나간다')
}

// ── ④ ⭐⭐⭐ 사진 3장을 넣어도 «한 번»만
//    📮 창업자 = *"엉뚱하게 잘못재면 타격이 커"* — 여기가 제일 위험한 자리다.
{
  // ⛔ 이 판은 3장 흐름을 못 몬다(위 주석) — 그래서 «브라우저로 재는 칸»은 두지 않는다.
  //    ⭐ 두면 영원히 빨간불이라 스모크가 못 돈다. 못 재는 것을 통과로 만들지도 않는다.
  //    📌 실물 확인은 창업자 몫으로 남긴다 — 캡처 여러 장을 넣고 GA4 에서 import_read_ok 가 1인지 본다.
  // ⛔⛔ **이 판은 사진 3장 흐름을 «못 몬다»** — 2026-09-12 실측.
  //    자르기 시트를 5번 눌렀는데도 편집 화면 글자가 0자였다(읽기가 안 끝났다).
  //    앱 탓인지 이 판 탓인지 **아직 못 갈랐다** — 창업자는 실물로 여러 장을 넣어 잘 됐다고 했다.
  //    ⛔ 그래서 「부풀지 않는다」를 여기서 «통과»로 만들면 그건 거짓 초록불이다(창업자 = "엉뚱하게 잘못재면 타격이 커").
  //    ✅ 대신 **코드로 막았다** — EditorScreen 의 `읽기셈보냄` ref 가 한 번의 가져오기에서 한 번만 보낸다.
  //       여기서는 「그 안전벨트가 소스에 «있나»」만 본다. 브라우저로 못 재는 자리는 소스 모양으로 잰다.
  {
    const { readFileSync } = await import('node:fs')
    const src = readFileSync(join(ROOT, 'src/screens/EditorScreen.jsx'), 'utf8')
    잰다(/읽기셈보냄\.current\s*=\s*true/.test(src) && /if\s*\(!읽기셈보냄\.current\)/.test(src),
      '④ 여러 장이어도 «한 번만» 보내는 안전벨트가 코드에 있다 (⚠️브라우저로는 못 쟀다)')
    잰다(/읽기셈보냄\.current\s*=\s*false/.test(src),
      '④ 새 가져오기를 시작할 때 그 안전벨트를 되돌린다 (안 그러면 두 번째 레시피가 영영 안 세진다)')
  }
}

await b.close(); srv.close()
console.log(나쁨 ? `\n✗ ${나쁨}칸 실패` : '\n✅ 읽기 걸음 통과')
process.exit(나쁨 ? 1 : 0)
