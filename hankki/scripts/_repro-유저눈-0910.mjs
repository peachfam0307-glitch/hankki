// 👀👀 [2026-09-10] 「유저 눈으로 보기」 스위치가 진짜로 도나 — 앱을 돌려서 잰다
//
// 📮 창업자 = *"이게 나랑 유저랑 보이는 화면이 다르니까 테스트하기가 너무 어렵네"*
// ⛔ 그날 하루를 이걸로 태웠다 — 창업자 폰에서 단추가 하나만 떠서 세 번을 버그로 의심했다.
//    진짜는 «창업자가 무제한이라» 그런 것이었고 시크릿 모드에선 멀쩡했다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
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
await new Promise((r) => srv.listen(4495, r))

const OUT = process.env.SHOT_OUT || '/tmp/유저눈'
mkdirSync(OUT, { recursive: true })
let 나쁨 = 0
const 잰다 = (참, 말, 값 = '') => { if (참) console.log(`  ✅ ${말}${값 ? `  ${값}` : ''}`); else { 나쁨 += 1; console.log(`  ⛔ ${말}${값 ? `  ${값}` : ''}`) } }

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

async function 설정화면(운영자) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 860 }, locale: 'ko-KR' })
  await ctx.addInitScript((운영자) => {
    try {
      localStorage.setItem('hankki:nudge:cloudgate', '1')
      localStorage.setItem('hankki:onboarded', '1')
      if (운영자) localStorage.setItem('hankki:founder', '시험열쇠')
    } catch { /* noop */ }
  }, 운영자)
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4495/hankki/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(2400)
  for (let i = 0; i < 10; i++) {
    const 시트 = p.locator('.sheet-mask button', { hasText: /^(닫기|확인|알겠어요|나중에)/ }).first()
    if (await 시트.count() > 0 && await 시트.isVisible().catch(() => false)) { await 시트.click(); await p.waitForTimeout(500); continue }
    const 코치 = p.locator('[aria-label="다음 안내 보기"]').first()
    if (await 코치.count() > 0 && await 코치.isVisible().catch(() => false)) { await 코치.click(); await p.waitForTimeout(500); continue }
    break
  }
  // ⛔ 설정은 «하단 탭에 없다» — 홈 오른쪽 위 톱니다(BottomNav.jsx:8)
  await p.locator('[aria-label="설정"]').first().click()
  await p.waitForTimeout(1400)
  for (let i = 0; i < 6; i++) {
    const 코치 = p.locator('[aria-label="다음 안내 보기"]').first()
    if (await 코치.count() === 0 || !(await 코치.isVisible().catch(() => false))) break
    await 코치.click(); await p.waitForTimeout(500)
  }
  return { ctx, p }
}
const 살핌 = (p) => p.evaluate(() => ({
  스위치: !!document.body.innerText.match(/유저 눈으로 보기/),
  상태글: (document.body.innerText.match(/(켜짐|꺼짐) · [^\n]+/) || [null])[0],
  열쇠배지: (document.body.innerText.match(/운영자|매달 무료 \d+개/) || [null])[0],
}))

console.log('\n👀 유저 눈으로 보기\n')

// ── ① 일반 유저 — 스위치가 «안» 보여야 한다
{
  const { ctx, p } = await 설정화면(false)
  const m = await 살핌(p)
  잰다(m.스위치 === false, '① 일반 유저에겐 스위치가 «안» 보인다', JSON.stringify(m))
  await ctx.close()
}

// ── ② 운영자 — 스위치가 보이고, 열쇠 배지는 「운영자」
{
  const { ctx, p } = await 설정화면(true)
  const m1 = await 살핌(p)
  잰다(m1.스위치 === true, '② 운영자에겐 스위치가 보인다')
  잰다(/꺼짐/.test(m1.상태글 || ''), '② 처음엔 꺼짐', m1.상태글)
  잰다(m1.열쇠배지 === '운영자', '② 열쇠 배지가 「운영자」', String(m1.열쇠배지))
  await p.screenshot({ path: `${OUT}/1-off.jpg`, quality: 40, type: 'jpeg' })

  // ── ③ 켜면 «유저 화면»이 된다
  await p.locator('button', { hasText: '유저 눈으로 보기' }).first().click()
  await p.waitForTimeout(2600)
  for (let i = 0; i < 8; i++) {
    const 코치 = p.locator('[aria-label="다음 안내 보기"]').first()
    if (await 코치.count() === 0 || !(await 코치.isVisible().catch(() => false))) break
    await 코치.click(); await p.waitForTimeout(500)
  }
  const 설정탭 = p.locator('[aria-label="설정"]').first()
  if (await 설정탭.count() > 0) { await 설정탭.click(); await p.waitForTimeout(1400) }
  const m2 = await 살핌(p)
  잰다(m2.스위치 === true, '③ 켠 뒤에도 스위치는 «남아 있다» (안 그러면 못 끈다)')
  잰다(/켜짐/.test(m2.상태글 || ''), '③ 켜짐으로 바뀐다', m2.상태글)
  잰다(m2.열쇠배지 !== '운영자', '③ ⭐열쇠 배지가 «유저처럼» 바뀐다', String(m2.열쇠배지))
  await p.screenshot({ path: `${OUT}/2-on.jpg`, quality: 40, type: 'jpeg' })

  // ── ④ ⭐⭐ 유저 눈을 켜도 **통계는 여전히 「우리 것」이다**
  //    📮 창업자 = *"유저 눈 스위치 켜면 통계도 안 잡히게 되는거야?"*
  //    ⛔ 화면은 유저처럼 보이지만 GA4 에는 traffic_type: 'internal' 이 그대로 나가야 한다.
  //       안 그러면 창업자가 눌러 보는 것이 «유저 행동»으로 쌓여 숫자가 망가진다(활성 19명 기준).
  const 보낸것 = await p.evaluate(() => [...(window.dataLayer || [])]
    // ⛔⛔ [2026-09-10] dataLayer 에는 «배열이 아닌 것»도 들어온다 — GTM 스니펫이
  //    { 'gtm.start': … } 같은 평범한 객체를 밀어 넣는다. 그걸 펼치려 하면 not iterable 로 죽는다.
  //    📌 내 폰(로컬)에선 안 걸리고 CI 에서만 죽어서 v13.11 배포가 통째로 막혔다.
  .filter((a) => a && typeof a.length === 'number')
  .map((a) => [...a])
    .filter((a) => a[0] === 'config')
    .map((a) => a[2]?.traffic_type || null))
  잰다(보낸것.length > 0, '④ 통계 설정이 나갔다', JSON.stringify(보낸것))
  잰다(보낸것.every((t) => t === 'internal'),
    '④ ⭐유저 눈을 켜도 통계는 «우리 것»으로 나간다 (화면만 유저처럼)', JSON.stringify(보낸것))
  await ctx.close()
}

// ── ⑤ ⭐⭐ 워커로 «운영자 열쇠»가 실려 나가나 (2026-09-10 저녁 · 창업자 "a로가")
//    ⛔⛔ 여기가 반쪽으로 돌던 자리다 — 화면은 유저처럼 바뀌는데 서버로는 계속 운영자 열쇠가 갔다.
//       그래서 ⑴계기판의 「창업자」가 계속 올라가고 ⑵서버가 「무제한」이라 답해 선택 창이 안 떴다.
//    📌 워커가 «둘»이다(hankki-ocr · hankki-tidy) — 둘 다 본다.
//    ⛔ 밖으로 한 건도 안 나간다 — route 로 가로채 가짜 답을 준다.
async function 열쇠헤더실렸나(유저눈, 열쇠 = 'TESTKEY123') {
  // ⛔⛔ serviceWorkers: 'block' 이 «없으면» 한 건도 안 잡힌다 — 우리 앱은 워크박스 SW 가
  //    fetch 를 가로채는데, Playwright 의 ctx.route 는 «SW 안에서 나가는» 요청을 기본으론 못 본다.
  //    (처음에 이걸 몰라서 「끔 0건 · 켬 0건」으로 잣대가 헛돌았다 · 규칙 18 ⓘ)
  const ctx = await b.newContext({ viewport: { width: 390, height: 860 }, locale: 'ko-KR', serviceWorkers: 'block' })
  const 본헤더 = []
  await ctx.route('**://*.workers.dev/**', async (r) => {
    본헤더.push(r.request().headers()['x-hankki-founder'] || null)
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ welcome: 5, month: 5, cap: 20, bonus: 0, 무제한: false }) })
  })
  await ctx.addInitScript(([유저눈, 열쇠]) => {
    try {
      localStorage.setItem('hankki:nudge:cloudgate', '1')
      localStorage.setItem('hankki:onboarded', '1')
      // ⛔ 기본은 ASCII — 헤더는 ISO-8859-1 만 실린다(한글 열쇠는 ⑥에서 «일부러» 넣어 본다)
      localStorage.setItem('hankki:founder', 열쇠)
      if (유저눈) localStorage.setItem('hankki:유저눈', '1')
    } catch { /* noop */ }
  }, [유저눈, 열쇠])
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4495/hankki/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(2600)
  // ⛔ 「가져오기」 탭으로는 워커를 안 부른다 — 부르는 건 useKeyLeft(열쇠 배지)다.
  //    그게 붙은 자리 = 설정(홈 오른쪽 위 톱니 · BottomNav 에 없다).
  // ⛔⛔ 길막(코치마크·시트)을 «먼저» 치운다 — 안 치우면 톱니를 못 눌러 설정이 아예 안 열리고,
  //    그러면 워커를 한 번도 안 불러서 잣대가 「0건」으로 헛돈다(내가 실제로 두 번 밟았다).
  for (let i = 0; i < 10; i++) {
    const 시트 = p.locator('.sheet-mask button', { hasText: /^(닫기|확인|알겠어요|나중에)/ }).first()
    if (await 시트.count() > 0 && await 시트.isVisible().catch(() => false)) { await 시트.click(); await p.waitForTimeout(500); continue }
    const 코치 = p.locator('[aria-label="다음 안내 보기"]').first()
    if (await 코치.count() > 0 && await 코치.isVisible().catch(() => false)) { await 코치.click(); await p.waitForTimeout(500); continue }
    break
  }
  await p.locator('[aria-label="설정"]').first().click().catch(() => {})
  await p.waitForTimeout(2600)
  const 열림 = await p.evaluate(() => /유저 눈으로 보기/.test(document.body.innerText))
  if (!열림) console.log('    ⚠️ 설정이 안 열렸다 — 잣대가 헛돈다', (await p.evaluate(() => document.body.innerText.slice(0, 120))).replace(/\n/g, ' | '))
  await ctx.close()
  return 본헤더
}
{
  const 끔 = await 열쇠헤더실렸나(false)
  const 켬 = await 열쇠헤더실렸나(true)
  // ⛔⛔ 「켬」 건수도 «반드시» 본다 — [].every() 는 true 라서, 켬 회차가 0건이면
  //    바로 아래 별표 칸이 «공짜로» 통과한다(스위치가 통째로 고장나도 초록불).
  //    📌 적대적 검토가 잡았다(2026-09-10). 잣대가 안 도는 것과 잣대가 통과하는 것은 다른 말이다.
  잰다(끔.length > 0 && 켬.length > 0, '⑤ 두 회차 모두 워커를 실제로 불렀다 (0 이면 아무것도 못 잰 것이다)', `끔 ${끔.length}건 · 켬 ${켬.length}건`)
  잰다(끔.some((h) => h === 'TESTKEY123'), '⑤ 유저 눈 «끄면» 운영자 열쇠가 실린다', JSON.stringify(끔))
  잰다(켬.every((h) => h === null), '⑤ ⭐유저 눈 «켜면» 운영자 열쇠가 «안» 실린다', JSON.stringify(켬))
}

// ── ⑥ ⭐⭐ 한글 열쇠가 «AI 읽기를 통째로 죽이지» 않나 (2026-09-10 · 실측으로 물었다)
//    ⛔ HTTP 헤더는 ISO-8859-1 만 싣는다. 한글이 한 글자라도 있으면 fetch 가
//       TypeError 로 죽고 **아무 말 없이** AI 읽기가 전부 먹통이 된다.
//       (내가 시험 열쇠를 「시험열쇠」로 뒀다가 ⑤가 「0건」으로 헛돌아서 잡았다)
//    ✅ 지금은 못 실을 열쇠면 «안 싣고 그냥 보낸다» — 운영자 대접만 못 받고 앱은 돈다.
{
  const 한글 = await 열쇠헤더실렸나(false, '한글열쇠임')
  잰다(한글.length > 0, '⑥ ⭐한글 열쇠여도 요청은 «나간다» (0 이면 AI 읽기가 통째로 죽은 것)', )
  잰다(한글.every((h) => h === null), '⑥ 한글 열쇠는 «안» 실린다', JSON.stringify(한글))
}

// ── ⑦ ⭐⭐ 다듬기 워커(hankki-tidy)도 «같은 잣대»인가 — 소스를 읽어서 본다
//    ⛔⛔ ⑤⑥ 은 hankki-ocr 만 잰다(설정 화면이 부르는 게 그것뿐이다).
//       hankki-tidy 는 사진→다듬기 경로에서만 불려서 이 판이 «한 번도 안 눌러 본다».
//       그래서 실제로 tidy.js 에만 방패가 빠져 있었는데도 ⑤⑥ 이 전부 초록불이었다.
//    ⭐ 브라우저로 못 재는 자리는 «소스 모양»으로 잰다 — 안 재는 것보다 낫다.
//       (규칙 18 ⓘ — 검사가 «무엇을 보는지»를 본다. 여기서 보는 것은 「두 워커가 같은 잣대인가」다)
{
  const { readFileSync } = await import('node:fs')
  const 읽기 = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8')
  for (const 파일 of ['ocr.js', 'tidy.js']) {
    const s = 읽기(파일)
    잰다(/유저눈인가\(\)/.test(s), `⑦ ${파일} 가 유저 눈을 본다`)
    잰다(/x20-\\x7e/.test(s), `⑦ ${파일} 에 ASCII 방패가 있다 (한글 열쇠가 fetch 를 죽이지 않게)`)
  }
}

await b.close(); srv.close()
console.log(`\n📂 ${OUT}`)
console.log(나쁨 ? `\n✗ ${나쁨}칸 실패` : '\n✅ 유저 눈 스위치 통과')
process.exit(나쁨 ? 1 : 0)
