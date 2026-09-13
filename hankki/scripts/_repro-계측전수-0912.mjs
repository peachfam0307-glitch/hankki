// 📊📊 [2026-09-12] 계측 여덟 자리를 «전수»로 잰다 — 앱을 돌려서
//
// 📮 창업자 = *"이상하게 심어놓고 침소봉대하고;; 당황스럽네"* → *"다 확인해 하나하나. 짐작하지말라했자나"*
//    → *"제대로해. 다 고쳐"* → *"다 재고 고쳐"*
//
// ⛔⛔ **왜 필요했나** — 2026-09-10 에 심은 계측이 «반쪽»이었다. 저장되는 길 셋 중 하나만 세고,
//    담는 길 넷 중 하나만 세고, 갈래가 바뀌는 여덟 길이 안 세졌다.
//    그 숫자로 「38명 중 1명만 저장」이라고 창업자에게 말했다 — **근거 없는 말이었다.**
//
// ⭐ 이 판이 지키는 것 = 「빠지나」와 「부푸나」를 «둘 다» 잰다. 하나만 재면 반대쪽이 조용히 틀어진다.
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
await new Promise((r) => srv.listen(4485, r))

let 나쁨 = 0
const 잰다 = (참, 말, 값 = '') => { if (참) console.log(`  ✅ ${말}${값 ? `  ${값}` : ''}`); else { 나쁨 += 1; console.log(`  ⛔ ${말}${값 ? `  ${값}` : ''}`) } }

const { SEED_COACH_SEEN } = await import(join(ROOT, 'src/coach.js'))
// 📅 「오늘(KST)」은 «한 곳»에서만 만든다 — 절대원칙 27. 앱과 «같은 값»을 쓴다(절대원칙 30).
const { todayKST } = await import(join(ROOT, 'src/today.js'))
const 오늘 = todayKST()
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

async function 방() {
  const ctx = await b.newContext({ viewport: { width: 390, height: 860 }, locale: 'ko-KR', serviceWorkers: 'block' })
  await ctx.route('**://www.googletagmanager.com/**', (r) => r.abort())
  await ctx.route('**://*.google-analytics.com/**', (r) => r.abort())
  await ctx.route('**://*.coupang.com/**', (r) => r.abort())
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript((오늘) => {
    try {
      localStorage.setItem('hankki:onboarded', '1')
      localStorage.setItem('hankki:news:off', '1')
      localStorage.setItem('hankki:nudge:cloudgate', '1')
      // 📅 「다시 왔나」가 끼어들지 않게 오늘 날짜를 미리 적는다 — 이 판은 행동만 잰다.
      //    ⛔ 날짜를 여기서 «만들지» 않는다(절대원칙 27) — 앱과 같은 todayKST() 값을 밖에서 받아 넣는다.
      localStorage.setItem('hankki:lastOpen', 오늘)
    } catch { /* noop */ }
  }, 오늘)
  const p = await ctx.newPage()
  await p.route('**/hankki-ocr.annyeong-hankki.workers.dev/**', async (route) => {
    const left = { welcome: 19, month: 5, cap: 19, bonus: 0, earned: [], anon: 10, acct: 30, signed: false }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, left }) })
  })
  await p.goto('http://127.0.0.1:4485/hankki/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(2400)
  return { ctx, p }
}
const 이름들 = (p) => p.evaluate(() => [...(window.dataLayer || [])]
  // ⛔ dataLayer 에는 «배열이 아닌 것»도 들어온다(GTM 의 { 'gtm.start': … }) — 펼치면 죽는다
  .filter((a) => a && typeof a.length === 'number')
  .map((a) => [...a])
  .filter((a) => a[0] === 'event' && a[1] === 'page_view')
  .map((a) => a[2]?.page_title))
const 셈 = (목록, 이름) => 목록.filter((n) => n === 이름).length
const 길막 = async (p) => {
  for (let i = 0; i < 8; i++) {
    const s = p.locator('.sheet-mask button', { hasText: /^(닫기|확인|알겠어요|나중에)/ }).first()
    if (await s.count() > 0 && await s.isVisible().catch(() => false)) { await s.click(); await p.waitForTimeout(400); continue }
    const c = p.locator('[aria-label="다음 안내 보기"]').first()
    if (await c.count() > 0 && await c.isVisible().catch(() => false)) { await c.click(); await p.waitForTimeout(400); continue }
    break
  }
}

console.log('\n📊 계측 전수\n')

// ── ① 갈래고름 — 흐름 «안»의 길도 세나 ＋ 같은 갈래를 두 번 안 세나
{
  const { ctx, p } = await 방()
  await 길막(p)
  await p.locator('.nav-item', { hasText: '가져오기' }).first().click()
  await p.waitForTimeout(900)
  await p.locator('.imp-opt').nth(0).click()          // 첫 갈래(share)
  await p.waitForTimeout(700)
  const a = await 이름들(p)
  잰다(a.some((n) => /^import_/.test(n || '')), '① 갈래를 누르면 세진다', JSON.stringify(a.filter((n) => /^import_/.test(n || ''))))

  // 🔁 흐름 «안»에서 갈래 바꾸기 — 전엔 이 길이 한 건도 안 세졌다
  const 안쪽 = p.locator('button', { hasText: '이미 캡처해 뒀으면 여기서 고르기' }).first()
  if (await 안쪽.count() > 0) {
    await 안쪽.click(); await p.waitForTimeout(900)
    const c = await 이름들(p)
    잰다(c.includes('import_photo'), '① ⭐흐름 «안»에서 갈래를 바꿔도 세진다 (전엔 0건이었다)', JSON.stringify(c.filter((n) => /^import_/.test(n || ''))))
  } else {
    잰다(false, '① 「이미 캡처해 뒀으면 여기서 고르기」를 못 찾았다 — ⛔여기서 판정하지 말 것')
  }
  await ctx.close()
}

// ── ② 갈래고름 — 목록으로 나갔다 «다시» 눌러도 한 번만
{
  const { ctx, p } = await 방()
  await 길막(p)
  await p.locator('.nav-item', { hasText: '가져오기' }).first().click()
  await p.waitForTimeout(900)
  for (let i = 0; i < 3; i++) {
    await p.locator('.imp-opt').nth(0).click(); await p.waitForTimeout(600)
    const 닫기 = p.locator('[aria-label="닫기"]').first()
    if (await 닫기.count() > 0) { await 닫기.click(); await p.waitForTimeout(600) }
  }
  const a = await 이름들(p)
  const 첫갈래 = a.find((n) => /^import_/.test(n || ''))
  잰다(첫갈래 && 셈(a, 첫갈래) === 1, '② ⭐같은 갈래를 세 번 눌러도 «한 번»만 (전엔 3건이었다)', `${첫갈래} ${셈(a, 첫갈래)}번`)
  await ctx.close()
}

// ── ③ shop_added — 레시피 상세의 「장보기 담기」 (전엔 0건)
{
  const { ctx, p } = await 방()
  await 길막(p)
  await p.locator('.nav-item', { hasText: '레시피' }).first().click()
  await p.waitForTimeout(1400); await 길막(p)
  // ⛔ 카드 «클래스»로 안 열린다(.r-card·.rc-card·[data-recipe] 셋 다 안 맞았다) — 상세에 못 들어간 채
  //    아래 칸이 「단추를 못 찾았다」로 헛돌았다. ⛔막연한 한글 글자로도 안 된다
  //    (「여기에 다 모았어」 말풍선을 먼저 잡았다 — 캡처로 눈으로 봤다). ✅레시피 «제목»을 콕 집는다.
  await 길막(p)   // ⛔ 누르기 «직전»에 한 번 더 — 시트가 늦게 떠서 클릭을 가로챘다(2026-09-12)
  // ⛔⛔ 그래도 못 닫는 시트가 있다(길막은 「닫기/확인/알겠어요/나중에」만 안다).
  //    ⭐ 그 시트가 무엇이든 **마스크를 직접 치운다** — 이 판은 시트를 재는 판이 아니다.
  await p.evaluate(() => { document.querySelectorAll('.sheet-mask').forEach((e) => e.remove()) })
  await p.waitForTimeout(400)
  await p.getByText('가지 소고기 덮밥', { exact: true }).first().click({ timeout: 15000 }).catch(() => {})
  await p.waitForTimeout(1600); await 길막(p)
  // ⛔ 캡처는 «저장소에 안 남긴다» — 필요할 때만 SHOT=1 로 켠다.
  //    ⛔⛔ new URL().pathname 은 한글을 %인코딩한다 → `_%EA%B3%84…jpg` 로 저장되어
  //       「캡처가 안 찍혔다」고 오해했다(2026-09-12). join() 으로 만든다.
  if (process.env.SHOT) await p.screenshot({ path: join(ROOT, '_계측전수-레시피탭.jpg'), quality: 40, type: 'jpeg' })
  잰다((await 이름들(p)).includes('detail'), '③ 레시피 상세에 들어갔다 (0 이면 아래가 헛돈다)', JSON.stringify((await 이름들(p)).slice(-3)))
  const 담기 = p.locator('button', { hasText: '장보기 담기' }).first()
  if (await 담기.count() > 0) {
    await 담기.click(); await p.waitForTimeout(900)
    const a = await 이름들(p)
    잰다(셈(a, 'shop_added') === 1, '③ ⭐상세의 「장보기 담기」가 «한 번» 세진다 (전엔 0건)', `${셈(a, 'shop_added')}번`)
  } else {
    잰다(false, '③ 「장보기 담기」 단추를 못 찾았다 — ⛔여기서 판정하지 말 것')
  }
  await ctx.close()
}

// ── ④ decor_saved — 꾸미기를 «열었다 그냥 나가면» 안 세진다
//    ⛔⛔ **「이미 꾸며진」 레시피라야 잰다.** 처음엔 「가지 소고기 덮밥」(안 꾸민 편)으로 짰는데
//       옛 코드로 되돌려도 그대로 통과했다 — items 가 비어 있어 옛 잣대로도 false 였다.
//       ＝ 아무것도 안 보는 칸이었다(규칙 12 로 잡았다). 「꽃게탕」은 스티커가 붙어 있다.
{
  const { ctx, p } = await 방()
  await 길막(p)
  await p.locator('.nav-item', { hasText: '레시피' }).first().click()
  await p.waitForTimeout(1400); await 길막(p)
  // ⛔ 카드 «클래스»로 안 열린다(.r-card·.rc-card·[data-recipe] 셋 다 안 맞았다)
  //    ⛔ 막연한 한글 글자로도 안 된다 — 「여기에 다 모았어」 말풍선을 먼저 잡았다(캡처로 눈으로 봤다).
  //    ✅ 레시피 «제목»을 콕 집는다.
  await 길막(p)   // ⛔ 누르기 «직전»에 한 번 더 — 시트가 늦게 떠서 클릭을 가로챘다(2026-09-12)
  // ⛔⛔ 그래도 못 닫는 시트가 있다(길막은 「닫기/확인/알겠어요/나중에」만 안다).
  //    ⭐ 그 시트가 무엇이든 **마스크를 직접 치운다** — 이 판은 시트를 재는 판이 아니다.
  await p.evaluate(() => { document.querySelectorAll('.sheet-mask').forEach((e) => e.remove()) })
  await p.waitForTimeout(400)
  await p.getByText('꽃게탕', { exact: true }).first().click({ timeout: 15000 }).catch(() => {})
  await p.waitForTimeout(1600); await 길막(p)
  잰다((await 이름들(p)).includes('detail'), '④ 레시피 상세에 들어갔다 (0 이면 아래가 헛돈다)', JSON.stringify((await 이름들(p)).slice(-3)))
  const 꾸미기 = p.locator('[aria-label="레시피 꾸미기"]').first()
  if (await 꾸미기.count() > 0) {
    await 꾸미기.click(); await p.waitForTimeout(2200)
    // 🔙 «아무것도 안 붙이고» 나간다 — 이게 이 칸의 전부다.
    //    ⛔ 화면의 「뒤로」 단추는 시트가 가려서 못 누른다(2026-09-12 실측) → 브라우저 뒤로가기를 쓴다.
    //       앱이 뒤로가기를 「저장하고 닫기」로 받으므로(DecorEditor 주석) 잣대가 그대로 맞다.
    await p.goBack().catch(() => {})
    await p.waitForTimeout(1600)
    const a = await 이름들(p)
    잰다(셈(a, 'decor') >= 1, '④ 꾸미기를 열면 decor 가 세진다', `${셈(a, 'decor')}번`)
    잰다(셈(a, 'decor_saved') === 0, '④ ⭐열었다 «그냥 나가면» decor_saved 는 0 (전엔 1이었다)', `${셈(a, 'decor_saved')}번`)
  } else {
    잰다(false, '④ 「레시피 꾸미기」 단추를 못 찾았다 — ⛔여기서 판정하지 말 것')
  }
  await ctx.close()
}

// ── ⑤ AI 자동정리 시트 단추 — 「사진으로 시작하기」가 «사진» 갈래로 간다
{
  const { ctx, p } = await 방()
  await 길막(p)
  await p.locator('.nav-item', { hasText: '가져오기' }).first().click()
  await p.waitForTimeout(900)
  const 초록 = p.locator('button', { hasText: 'AI 자동 정리' }).first()
  if (await 초록.count() > 0) {
    await 초록.click(); await p.waitForTimeout(900)
    const 시작 = p.locator('button', { hasText: '사진으로 시작하기' }).first()
    await 시작.click(); await p.waitForTimeout(900)
    const a = await 이름들(p)
    잰다(a.includes('import_photo'), '⑤ ⭐「사진으로 시작하기」가 사진 갈래로 간다 (전엔 빈 종이였다)', JSON.stringify(a.filter((n) => /^import_/.test(n || ''))))
    잰다(!a.includes('import_write'), '⑤ 「직접 입력」으로 «안» 센다')
  } else {
    잰다(false, '⑤ 「AI 자동정리」 초록 상자를 못 찾았다 — ⛔여기서 판정하지 말 것')
  }
  await ctx.close()
}

await b.close(); srv.close()
console.log(나쁨 ? `\n✗ ${나쁨}칸 실패` : '\n✅ 계측 전수 통과')
process.exit(나쁨 ? 1 : 0)
