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

// 📄 40자를 넘는 «레시피 모양» 가짜 글자 — tidy.js 의 「짧으면 안 부른다」(40자) 를 넘기려고
const 가짜글자 = '김치찌개\n재료\n신김치 200g\n돼지고기 150g\n두부 반 모\n만드는 법\n김치를 볶아요\n물을 붓고 끓여요\n두부를 넣어요'
const 칸 = []
const 재기 = (이름, 됐나, 값 = '') => { 칸.push({ 이름, 됐나, 값 }); console.log(`${됐나 ? '✅' : '⛔'} ${이름}${값 ? ' — ' + 값 : ''}`) }

// 📷📷 사진을 물리고 **자르기 시트까지 넘긴다.**
//   ⛔⛔ 이 단계를 빼면 «읽기가 시작조차 안 한다» — 그러면 어느 갈래든 프록시 호출이 0 이라
//      「그냥 읽기 = 0번」이 **통과했는데 아무것도 안 잰 초록불**이 된다(규칙 18 ⓘ).
//      실제로 첫 판이 그랬고, 짝인 ④(AI 는 «불러야» 한다)가 «맞게» 걸려서 드러났다.
//   📌 **되짚는 칸을 같이 두면 가짜 통과가 스스로 드러난다.** 한쪽만 재면 영영 못 본다.
// ✂️ [창업자 확정 2026-09-13] 자르기 화면을 «안 띄우게» 바꿨다 → 「전체 사용」 단추가 없어졌다.
//   ⛔ 옛 판은 그 단추를 8초 기다리다 죽었다 — 고쳐진 앱을 고장이라 우긴 것이다.
//   ⭐ 이제는 사진을 넣으면 «곧바로» 읽기가 시작된다. 그래서 누를 것 없이 기다리기만 하면 된다.
//   ⛔ 위 주석의 걱정(「읽기가 시작조차 안 하면 가짜 초록불」)은 그대로 유효하다 —
//      그래서 기다리는 시간을 넉넉히 두고, 짝인 ④(AI 는 «불러야» 한다)가 여전히 되짚는다.
async function 사진넣고자르기(p) {
  await p.locator('input[type=file]').first().setInputFiles({ name: 'r.png', mimeType: 'image/png', buffer: 사진 })
  await p.waitForTimeout(5700)
}

// 🚪 가져오기 → ③ 「한끼 앱에서 사진 가져오기」 안내 화면까지
async function 안내까지(ctx, 남은 = 19) {
  const p = await ctx.newPage()
  // 🔐 [2026-09-14] AI 동의를 «미리» 심는다 — 안 심으면 동의 시트가 앞을 막아
  //    다듬기 워커가 «어느 갈래에서도» 0 번이 되고, 「그냥 읽기 0번」이 아무것도 안 잰 초록불이 된다.
  //    ⛔ 실제로 이 칸을 더한 첫 시도가 그랬고 — 짝인 ④(「AI로 읽기」는 «불러야» 한다)가 맞게 걸려서 드러났다.
  await p.addInitScript(() => { try { localStorage.setItem('hankki:ai:consent', 'yes') } catch { /* noop */ } })
  let 열쇠쓴호출 = 0
  const 기본신호 = []
  // 🕸 프록시를 가로채 «횟수»를 센다. 실제로 나가게 두지 않는다(이 환경은 workers.dev 를 막는다).
  //
  // ⛔⛔ **잣대를 옮겼다 (2026-09-01)** — 전엔 «프록시를 불렀나»를 셌고 그게 곧 열쇠 차감이었다.
  //    그날 «묻기만 하는 길»(`조회`)이 생겼다 — 화면이 뜰 때 「내 상태가 뭐예요」를 물어본다.
  //    그건 아무것도 주지도 깎지도 않는데 **호출 수는 는다** → 이 판이 «맞게» 죽었다(0번 기대 · 2번).
  //    ✅ 그래서 「사진을 실어 보냈나(`image`)」로 옮긴다 — **그게 진짜로 열쇠를 쓰는 요청**이다.
  //       ⛔ 느슨하게 만든 게 아니라 «더 정확하게» 만든 것이다. 조회를 실수로 차감하게 바꾸면
  //          몸통에 image 가 실리므로 여전히 잡힌다.
  // 🤖🤖 [2026-09-14] **AI 다듬기 워커도 «센다».**
  //   📮 창업자 = *"열쇠쓰기를 안했는데 ai가 읽는거 되는거 고쳐야해"*
  //   ⭐ 확정(2026-08-29 · 재론 금지) = 갈래는 «둘»뿐 —
  //      잘 되는 쪽(구글 Vision ＋ AI · 열쇠 1개) · 불편한 쪽(tesseract ＋ 규칙 파서 · 0개).
  //      ⛔ 「열쇠 없이도 AI 정리」를 어디에도 열지 않는다 — 열면 그 순간 열쇠가 안 팔린다.
  //   ⛔ 「팝업이 떴나」로 재지 않는다 — 떠도 안 돌 수 있고, 안 떠도 돌 수 있다.
  //      ✅ **워커를 불렀나**가 곧 「AI 가 읽었나」다.
  let 다듬기호출 = 0
  await p.route('**hankki-tidy.annyeong-hankki.workers.dev**', async (route) => {
    다듬기호출 += 1
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: false }) })
  })
  await p.route('**/hankki-ocr.annyeong-hankki.workers.dev/**', async (route) => {
    let 몸 = {}
    try { 몸 = JSON.parse(route.request().postData() || '{}') } catch { /* noop */ }
    if (몸.image) 열쇠쓴호출 += 1
    // 📊 [2026-09-01] 「기본 인식으로 읽었다」 신호를 모은다 — 갈래가 «갈리는지»를 아래서 잰다.
    //   ⭐ 갈래가 틀리면 숫자는 있는데 «처방»이 틀린다(막힘↑ = 팔 때 / 고름↑ = 값이 비싸다 / 실패↑ = 우리 문제).
    if (몸.기본) 기본신호.push(몸)
    // ⭐ 조회 답도 «이 판이 심어둔 상태»와 같아야 한다 — 안 그러면 서버 답이 씨앗을 덮어
    //    「열쇠 0개」 시험이 19개짜리 화면을 재게 된다(그것도 2026-09-01 에 실제로 났다).
    const left = {
      welcome: 남은, month: 남은 > 0 ? 5 : 0, cap: 남은, bonus: 0, earned: [],
      anon: 10, acct: 30, monthly: 5, signed: false,
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      // ⛔⛔ [2026-09-14] 전엔 「가짜」 두 글자였다 —  는 **40자 미만이면 AI 를 아예 안 부른다.**
      //    그래서 어느 갈래에서든 다듬기가 0 번이 되어, 아래 「그냥 읽기 0번」이 «아무것도 안 잰» 초록불이었다.
      //    ✅ 40자를 넘는 «레시피 모양» 글자를 준다 — 그래야 짝인 ④가 되짚을 수 있다.
      body: JSON.stringify(몸.image ? { text: 가짜글자, left } : { ok: true, left }),
    })
  })
  await p.goto('http://127.0.0.1:4477/hankki/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(2200)
  await p.locator('.nav-item', { hasText: '가져오기' }).first().click()
  await p.waitForTimeout(900)
  await p.locator('.imp-opt').nth(2).click() // ③
  await p.waitForTimeout(700)
  return { p, 횟수: () => 열쇠쓴호출, 다듬기: () => 다듬기호출, 기본신호 }
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
  const { p, 횟수, 다듬기, 기본신호 } = await 안내까지(ctx)
  p.on('pageerror', () => { /* tesseract CDN 이 막혀 터진다 — 판정과 무관 */ })
  await p.locator('.pad.fade button', { hasText: '그냥 읽기' }).click()
  await 사진넣고자르기(p)
  재기('⭐ 「그냥 읽기」 → 프록시 호출 0번 (＝열쇠 안 깎임)', 횟수() === 0, `${횟수()}번`)
  // 🤖 [2026-09-14 창업자 제보] AI 다듬기도 «안» 돌아야 한다 — 확정의 「불편한 쪽」은 규칙 파서다
  await p.waitForTimeout(2500)
  재기('🤖⭐ 「그냥 읽기」 → AI 다듬기 워커 0번 (＝열쇠 없이 AI 정리가 안 열린다)', 다듬기() === 0, `${다듬기()}번`)
  // 📊📊 [2026-09-01 창업자 지시] 「무료로 얼마나 읽히나」를 세려면 앱이 «알려줘야» 한다.
  //   📮 *"기본인식을 얼마나 썼는지도 알아야 하지 않을까"* · *"유료 켤때 무료이용률도 알아야 가격이나 장수를 수정하니까"*
  //   ⭐⭐ 재는 것은 개수가 아니라 **갈래가 갈리나** — 갈래가 틀리면 숫자는 있는데 «처방»이 정반대가 된다
  //      (막힘↑ = 팔 때다 / 고름↑ = 값이 비싸다 / 실패↑ = 우리 문제다).
  await p.waitForTimeout(600)
  재기('📊 「그냥 읽기」는 «고름»으로 알린다', 기본신호.length >= 1 && 기본신호[0].기본 === '고름',
    JSON.stringify(기본신호.map((x) => x.기본)))
  // ⛔ 이 신호가 «열쇠를 쓰는 요청»으로 세지면 안 된다 — 위 「0번」과 같이 봐야 뜻이 있다
  재기('📊 ⛔알림은 열쇠를 «안» 쓴다(위 0번이 그대로다)', 횟수() === 0, `${횟수()}번`)
  재기('📊 ⛔기기 번호도 사진도 «안» 보낸다(전역 숫자만 · 개인별은 안 센다)',
    기본신호.every((x) => !x.uid && !x.image && !x.sub), JSON.stringify(기본신호[0] || null))
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
  const { p, 횟수, 다듬기 } = await 안내까지(ctx)
  p.on('pageerror', () => { /* 위와 같다 */ })
  await p.locator('.pad.fade button', { hasText: 'AI로' }).click()
  await 사진넣고자르기(p)
  재기('⭐ 「AI로 읽기」 → 프록시 호출 1번 이상 (열쇠 길은 그대로 산다)', 횟수() >= 1, `${횟수()}번`)
  // 🤖 되짚기 — 열쇠를 쓴 쪽은 AI 다듬기가 «돌아야» 한다(확정 = 열쇠를 쓰면 «무조건» AI 정리까지)
  //   ⛔ 이 칸이 없으면 「그냥 읽기 0번」이 «아무것도 안 재고» 통과할 수 있다(규칙 18 ⓘ).
  await p.waitForTimeout(3500)
  재기('🤖⭐ 「AI로 읽기」 → AI 다듬기 워커 1번 이상 (열쇠 값어치가 반쪽이 아니다)', 다듬기() >= 1, `${다듬기()}번`)
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
