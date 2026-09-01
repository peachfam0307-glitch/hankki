// 🆓🆓 [2026-08-29] 「그냥 읽기」가 «진짜로» 열쇠를 안 쓰나 — 재현판(smoke)
//
// 📮 창업자 = *"한끼에서 가져오기를 무료ocr로 읽게하면 안돼??"* → 갈래 둘 중 **ⓑ**(고르게)
//    *"3번은 열쇠다썼지만 무료로 쓰고싶은 사용자들이 거의 쓰겠네 안내도 잘해줘야 할 듯."*
//
// ⭐⭐⭐ **심장 = 「사진을 실어 프록시로 요청이 나갔나」.** 그게 곧 열쇠 차감이다.
//    ⛔ 「프록시를 불렀나」로 재지 않는다 — 2026-09-01 부터 «묻기만 하는 길»(조회)이 생겨
//       부르고도 안 깎는 요청이 있다. 아래 route 주석에 경위를 적어 뒀다.
//    ⛔ 「문구에 «열쇠 안 써요»가 적혀 있나」를 재면 **안 된다** — 적어놓고 깎으면 그게 제일 나쁜 사고다
//       (v11.00 사고와 같은 자리: 「넘겼다」와 「저장됐다」는 다른 말이다 · 규칙 18 ⓘ).
//    ✅ 그래서 «네트워크»를 가로채 **부른 횟수**를 센다. 0 이라야 통과다.
//
// ⛔ 이 컨테이너는 `cdn.jsdelivr.net` 을 못 연다 → tesseract 폴백이 죽으며 pageerror 를 쏜다.
//    ⭐ 그래도 **판정에는 영향이 없다** — 우리가 재는 건 「프록시를 불렀나」이고
//       그 판단은 tesseract «앞»에서 끝난다.
//
// 🧪 규칙 12 = `ocr.js` 의 `!opts.noVision` 을 지우면 ③이 죽고, 되돌리면 다시 산다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4477, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// 📷 글자가 든 작은 PNG — 파일 고르기에 물릴 «진짜 파일»
const 사진 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAGQAAAAyCAIAAAC4GHDeAAAAWklEQVR4nO3QMQEAAAjDMMC/56EB' +
  'ExIFfXpnAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAvBpVSAABw3aBpwAAAABJRU5ErkJggg==', 'base64')

const 칸 = []
const 재기 = (이름, 됐나, 값 = '') => { 칸.push({ 이름, 됐나, 값 }); console.log(`${됐나 ? '✅' : '⛔'} ${이름}${값 ? ' — ' + 값 : ''}`) }

// 📷📷 사진을 물리고 **자르기 시트까지 넘긴다.**
//   ⛔⛔ 이 단계를 빼면 «읽기가 시작조차 안 한다» — 그러면 어느 갈래든 프록시 호출이 0 이라
//      「그냥 읽기 = 0번」이 **통과했는데 아무것도 안 잰 초록불**이 된다(규칙 18 ⓘ).
//      실제로 첫 판이 그랬고, 짝인 ④(AI 는 «불러야» 한다)가 «맞게» 걸려서 드러났다.
//   📌 **되짚는 칸을 같이 두면 가짜 통과가 스스로 드러난다.** 한쪽만 재면 영영 못 본다.
async function 사진넣고자르기(p) {
  await p.locator('input[type=file]').first().setInputFiles({ name: 'r.png', mimeType: 'image/png', buffer: 사진 })
  await p.waitForTimeout(1200)
  const 전체 = p.locator('button', { hasText: '전체 사용' }).first()
  await 전체.waitFor({ state: 'visible', timeout: 8000 })
  await 전체.click()
  await p.waitForTimeout(4500)
}

// 🚪 가져오기 → ③ 「한끼 앱에서 사진 가져오기」 안내 화면까지
async function 안내까지(ctx, 남은 = 19) {
  const p = await ctx.newPage()
  let 열쇠쓴호출 = 0
  // 🕸 프록시를 가로채 «횟수»를 센다. 실제로 나가게 두지 않는다(이 환경은 workers.dev 를 막는다).
  //
  // ⛔⛔ **잣대를 옮겼다 (2026-09-01)** — 전엔 «프록시를 불렀나»를 셌고 그게 곧 열쇠 차감이었다.
  //    그날 «묻기만 하는 길»(`조회`)이 생겼다 — 화면이 뜰 때 「내 상태가 뭐예요」를 물어본다.
  //    그건 아무것도 주지도 깎지도 않는데 **호출 수는 는다** → 이 판이 «맞게» 죽었다(0번 기대 · 2번).
  //    ✅ 그래서 「사진을 실어 보냈나(`image`)」로 옮긴다 — **그게 진짜로 열쇠를 쓰는 요청**이다.
  //       ⛔ 느슨하게 만든 게 아니라 «더 정확하게» 만든 것이다. 조회를 실수로 차감하게 바꾸면
  //          몸통에 image 가 실리므로 여전히 잡힌다.
  await p.route('**/hankki-ocr.annyeong-hankki.workers.dev/**', async (route) => {
    let 몸 = {}
    try { 몸 = JSON.parse(route.request().postData() || '{}') } catch { /* noop */ }
    if (몸.image) 열쇠쓴호출 += 1
    // ⭐ 조회 답도 «이 판이 심어둔 상태»와 같아야 한다 — 안 그러면 서버 답이 씨앗을 덮어
    //    「열쇠 0개」 시험이 19개짜리 화면을 재게 된다(그것도 2026-09-01 에 실제로 났다).
    const left = {
      welcome: 남은, month: 남은 > 0 ? 5 : 0, cap: 남은, bonus: 0, earned: [],
      anon: 10, acct: 30, monthly: 5, signed: false,
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(몸.image ? { text: '가짜', left } : { ok: true, left }),
    })
  })
  await p.goto('http://127.0.0.1:4477/hankki/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(2200)
  await p.locator('.nav-item', { hasText: '가져오기' }).first().click()
  await p.waitForTimeout(900)
  await p.locator('.imp-opt').nth(2).click() // ③
  await p.waitForTimeout(700)
  return { p, 횟수: () => 열쇠쓴호출 }
}

// ① 목록에 「무료로도 돼요」 알약이 붙었나
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 860 } })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch { /* noop */ } })
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4477/hankki/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(2200)
  await p.locator('.nav-item', { hasText: '가져오기' }).first().click()
  await p.waitForTimeout(900)
  const 알약들 = await p.locator('.imp-opt-pill').allInnerTexts()
  // ✍️ [창업자 2026-08-29] *"무료로도 말고 열쇠가 없어도"* ＋ *"직접입력하기 위에도"* → 알약이 «셋»이다
  재기('목록 알약 셋 = 「제일 많이 써요」 ＋ 「열쇠가 없어도」 ×2',
    알약들.length === 3 && 알약들[1].includes('열쇠가 없어도') && 알약들[2].includes('열쇠가 없어도'), JSON.stringify(알약들))
  const 초록 = (await p.locator('.imp-notice').innerText()).replace(/\n/g, ' ⏎ ')
  재기('초록 박스 = 창업자 문구 그대로',
    초록.includes('다 쓰면 기본 인식으로') && 초록.includes('그래도') && 초록.includes('무료로 계속'), 초록)
  await ctx.close()
}

// ② 열쇠가 남았으면 단추가 «둘»
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 860 } })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
      localStorage.setItem('hankki:ocrLeft', JSON.stringify({ welcome: 20, month: 5, total: 20 }))
    } catch { /* noop */ }
  })
  const { p } = await 안내까지(ctx)
  const 단추 = await p.locator('.pad.fade button').allInnerTexts()
  const 살아있는 = 단추.filter((t) => t.includes('읽기'))
  재기('열쇠 있으면 단추 둘 (AI · 그냥)',
    살아있는.length === 2 && 살아있는[0].includes('AI') && 살아있는[1].includes('열쇠 안 써요'), JSON.stringify(살아있는))
  const 결과 = await p.locator('.pad.fade').innerText()
  재기('「덜 읽혀요」를 집어 준다 (창업자 지시)',
    결과.includes('기본 인식은 덜 읽혀요') && 결과.includes('보면서 고칠 수'), 결과.includes('덜 읽혀요') ? 'ok' : '없다')
  await ctx.close()
}

// ③ ⭐심장 — 「그냥 읽기」로 고르면 프록시를 «0번» 부른다
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 860 } })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
      localStorage.setItem('hankki:ocrLeft', JSON.stringify({ welcome: 20, month: 5, total: 20 }))
    } catch { /* noop */ }
  })
  const { p, 횟수 } = await 안내까지(ctx)
  p.on('pageerror', () => { /* tesseract CDN 이 막혀 터진다 — 판정과 무관 */ })
  await p.locator('.pad.fade button', { hasText: '그냥 읽기' }).click()
  await 사진넣고자르기(p)
  재기('⭐ 「그냥 읽기」 → 프록시 호출 0번 (＝열쇠 안 깎임)', 횟수() === 0, `${횟수()}번`)
  await ctx.close()
}

// ④ 되짚기 — 「AI로 읽기」는 프록시를 «부른다»(공짜 길이 열쇠 길을 죽이지 않았나)
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 860 } })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
      localStorage.setItem('hankki:ocrLeft', JSON.stringify({ welcome: 20, month: 5, total: 20 }))
    } catch { /* noop */ }
  })
  const { p, 횟수 } = await 안내까지(ctx)
  p.on('pageerror', () => { /* 위와 같다 */ })
  await p.locator('.pad.fade button', { hasText: 'AI로' }).click()
  await 사진넣고자르기(p)
  재기('⭐ 「AI로 읽기」 → 프록시 호출 1번 이상 (열쇠 길은 그대로 산다)', 횟수() >= 1, `${횟수()}번`)
  await ctx.close()
}

// ⑤ 열쇠가 0개면 고르라고 «안» 한다 — 거짓 선택지를 만들지 않는다
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 860 } })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
      localStorage.setItem('hankki:ocrLeft', JSON.stringify({ welcome: 0, month: 0, total: 0 }))
    } catch { /* noop */ }
  })
  // ⭐ 서버도 «0개»라고 답하게 한다 — 화면이 뜰 때 물어보므로(2026-09-01~) 씨앗만 심으면 덮인다.
  //    📌 폰에 심어둔 값과 서버 답이 다르면 «서버가 이긴다». 그게 맞는 동작이라 판을 거기 맞춘다.
  const { p } = await 안내까지(ctx, 0)
  const 단추 = await p.locator('.pad.fade button').allInnerTexts()
  const AI단추 = 단추.filter((t) => t.includes('AI로'))
  재기('열쇠 0개면 AI 단추를 아예 안 그린다', AI단추.length === 0 && 단추.some((t) => t.includes('사진 고르기')), JSON.stringify(단추.filter((t) => t.includes('고르기') || t.includes('읽기'))))
  await ctx.close()
}

// ⑥ [창업자 확정 2026-08-29] 많이 고르면 «확인 팝업» — ⛔막는 게 아니라 되돌릴 자리를 만든다
//    📮 *"5장 올리면 팝업으로 열쇠다섯개가 사용된다고 확인받는건?"* · *"10장이든 20장이든 유저가 선택하면 되니깐"*
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 860 } })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
      localStorage.setItem('hankki:ocrLeft', JSON.stringify({ welcome: 20, month: 5, total: 20 }))
    } catch { /* noop */ }
  })
  const { p, 횟수 } = await 안내까지(ctx)
  p.on('pageerror', () => { /* tesseract CDN */ })
  await p.locator('.pad.fade button', { hasText: 'AI로' }).click()
  await p.locator('input[type=file]').first().setInputFiles(
    Array.from({ length: 5 }, (_, i) => ({ name: `r${i}.png`, mimeType: 'image/png', buffer: 사진 })))
  await p.waitForTimeout(1500)
  const 글 = await p.locator('body').innerText()
  재기('⭐ 5장 고르면 «확인 팝업»이 뜬다', /사진 5장을 골랐어요/.test(글) && /5개를 써요/.test(글), 글.includes('5장을 골랐어요') ? 'ok' : '안 뜸')
  // ⛔⛔ 심장 = **확인하기 «전»엔 프록시를 안 부른다.** 안 그러면 팝업이 장식일 뿐이다.
  재기('⭐ 확인 전엔 열쇠를 «안» 쓴다 (프록시 0번)', 횟수() === 0, `${횟수()}번`)
  await ctx.close()
}

// ⑦ [창업자 제보 2026-08-29] 예시 사진 «크게 보기» — 안 보이면 안내가 안내를 못 한다
//    📮 *"예시이미지가 확대도 안되고 작아서 잘 안보여 특히 빨강동그라미부분.."*
//       → *"ㄱㄱ (눌러서 크게보기 되는거 표시도 해주는거지?)"*
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 860 } })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch { /* noop */ } })
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4477/hankki/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(2200)
  await p.locator('.nav-item', { hasText: '가져오기' }).first().click()
  await p.waitForTimeout(900)
  await p.locator('.imp-opt').nth(1).click() // ② 갤러리
  await p.waitForTimeout(800)
  재기('예시 사진에 「눌러서 크게 보기」 표시가 있다',
    (await p.locator('.imp-shot-hint').count()) === 1 && /눌러서 크게 보기/.test(await p.locator('.imp-shot-hint').innerText()))
  await p.locator('.imp-shot button').click()
  await p.waitForTimeout(700)
  // ⭐⭐ 심장 = **원본 폭(1060) 그대로** 떴나. 화면에 맞춰 줄면 «크게 보기»가 아니다.
  const z = await p.evaluate(() => {
    const i = [...document.querySelectorAll('img')].find((x) => x.naturalWidth > 800 && x.getBoundingClientRect().width > 500)
    if (!i) return { 폭: 0, 굴릴양: 0 }
    return { 폭: Math.round(i.getBoundingClientRect().width), 굴릴양: i.parentElement.scrollWidth - i.parentElement.clientWidth }
  })
  재기('⭐ 크게 보기가 «원본 폭»으로 뜬다 (줄이지 않는다)', z.폭 >= 1000, `${z.폭}px`)
  재기('가로로 굴러 2·3번 칸도 볼 수 있다', z.굴릴양 > 300, `${z.굴릴양}px`)
  await ctx.close()
}

await b.close(); srv.close()
const 통과 = 칸.filter((c) => c.됐나).length
console.log(`\n${통과}/${칸.length} 통과`)
process.exit(통과 === 칸.length ? 0 : 1)
