// 📱📱 「한 장씩 따로따로」 — 창업자 확정 ⓑ (2026-08-28)
//
// 📮 창업자 = *"내꾸, 레꾸 **둘다 저렇게 작게떠.** 어쩔수 없는거야?? **폰처럼 한장씩 따로따로는 못들어가?**"*
//    → 갈래 둘(ⓐ그냥 둔다 / ⓑ한 장 보내고 「레시피도 보낼까요?」로 한 번 더) 중 **"ㄴ으로 하자"**
//
// 🔎 **뿌리** = 앱이 `navigator.share({ files: [표지, 레시피] })` 로 **두 장을 한 번에** 넘겼다.
//    받는 앱(카톡)이 사진 두 장을 **앨범 격자**로 묶어 한 칸씩 작게 그린다.
//    ⭐ 폰에서 커 보였던 건 폰이 나아서가 아니라 **두 장 공유가 안 되는 폰이라 한 장으로 떨어졌기** 때문이다.
//
// ⭐⭐⭐ **이 판의 심장 = 「`navigator.share` 에 파일이 «한 장»만 갔나」.**
//    ⛔ 「시트가 뜨나」만 재면 안 된다 — 시트는 떠도 두 장을 같이 보내면 창업자 문제가 그대로다.
//    ⭐ 그래서 흉내낸 `share` 가 **넘어온 인자를 통째로 기록**하고, 그걸 잰다.
//
// ⛔ **못 재는 것 — 정직하게**: 「카톡이 앨범으로 묶나」는 여기서 못 본다(받는 앱 쪽 동작).
//    우리가 잴 수 있는 것은 **「우리가 몇 장을 넘겼나」**뿐이고, 뿌리가 정확히 그 자리다.
//    최종 판정은 창업자 폰이다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-한장씩-0828.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4421, r))

let 통과 = 0, 실패 = 0
const chk = (이름, 값, 기대) => {
  const ok = 기대 === undefined ? !!값 : String(값) === String(기대)
  console.log(`  ${ok ? '✅' : '⛔'} ${이름}${ok ? '' : `   ← 나온 값: ${값}`}`)
  ok ? 통과++ : 실패++
}

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })

// ⛔ page.reload() 금지 — 저장값이 시드로 덮인다(`check-mistakes` ⑧). 새 탭으로 연다.
const 새탭 = async () => {
  const page = await ctx.newPage()
  page.on('pageerror', (e) => { console.log('  ⚠️ pageerror:', String(e.message || e).split('\n')[0]); 실패++ })
  await page.goto('http://127.0.0.1:4421/hankki/', { waitUntil: 'networkidle' })
  await page.evaluate(() => { try { localStorage.removeItem('hankki:nudge:review') } catch {} })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(700)
  return page
}

// 🎭 `navigator.share` 흉내 — 헤드리스엔 공유창이 없다.
//    ⭐⭐ **인자를 통째로 적어 둔다** — 이 판이 재려는 게 「몇 번 불렀나」가 아니라 «무엇을 넘겼나» 라서다.
const 공유흉내 = (page) => page.evaluate(() => {
  window.__보낸것 = []
  navigator.canShare = () => true
  navigator.share = (opt) => {
    const fs = (opt && opt.files) || []
    window.__보낸것.push({ 장수: fs.length, 이름: fs.map((f) => f.name).join(','), 글: String((opt && opt.text) || '') })
    return Promise.resolve()
  }
})
const 보낸것 = (page) => page.evaluate(() => window.__보낸것 || [])
const 글자 = (page) => page.evaluate(() => document.body.innerText || '')
const 눌러 = (page, 글) => page.evaluate((t) => {
  const x = [...document.querySelectorAll('button')].find((b) => (b.innerText || '').includes(t))
  x?.click(); return !!x
}, 글)

const 자랑탭열기 = async (page) => {
  await page.evaluate(() => {
    const bs = [...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')]
    bs.find((x) => (x.innerText || '').replace(/\s+/g, '').includes('레꾸자랑'))?.click()
  })
  await page.waitForTimeout(700)
  return page.evaluate(() => /레꾸자랑/.test(document.body.innerText || ''))
}

// ⭐ 「콩국수」로 잰다 — **씨앗에서 유일하게 «꾸며진» 편**이고(창업자가 직접 꾸민 샘플)
//    재료·순서가 다 있어 «레시피 2장째»가 실제로 만들어진다. ⛔안 꾸민 편은 상세로 보내버린다.
const 콩국수시트 = async (page) => {
  await page.evaluate(() => document.querySelector('button[aria-label="콩국수 자랑하기"]')?.click())
  await page.waitForFunction(
    () => [...document.querySelectorAll('button')].some((x) => (x.innerText || '').includes('내가 꾸민 표지 그대로')),
    null, { timeout: 20000 },
  ).catch(() => {})
  return page.evaluate(() => [...document.querySelectorAll('button')].some((x) => (x.innerText || '').includes('내가 꾸민 표지 그대로')))
}

// 「누른 뒤 공유가 «늘었나»」를 기다린다.
//   ⛔ 「부른 적이 있나」로 기다리면 **두 번째 공유 때 조건이 처음부터 참**이라 안 기다린다
//      (2026-08-28 에 리뷰 판이 정확히 이걸로 흔들렸다 — 그 교훈을 그대로 가져왔다).
const 공유기다리기 = async (page, 전) => {
  await page.waitForFunction((n) => (window.__보낸것 || []).length > n, 전, { timeout: 60000 }).catch(() => {})
  await page.waitForTimeout(600)
}

console.log('\n📱 「한 장씩 따로따로」 — navigator.share 에 몇 장이 갔나\n')

// ─────────────────────────────────────────────────────────────
console.log('① 🎨 내가 꾸민 표지 그대로 — 표지 «한 장»만 나가나')
// ─────────────────────────────────────────────────────────────
{
  const page = await 새탭()
  await 공유흉내(page)
  chk('레꾸자랑 탭이 열렸다', await 자랑탭열기(page))
  chk('콩국수 선택 시트가 떴다', await 콩국수시트(page))

  await 눌러(page, '내가 꾸민 표지 그대로')
  await 공유기다리기(page, 0)
  const 한번째 = (await 보낸것(page))[0]

  chk('공유가 실제로 불렸다', !!한번째)                      // ⭐먼저 이걸 재야 아래가 헛돌지 않는다
  chk('넘긴 파일 = 한 장', 한번째 && 한번째.장수, 1)          // ⭐⭐ 이 판의 심장
  chk('그 한 장이 «표지»다', 한번째 && /cover/.test(한번째.이름 || ''))
  chk('문구에 「재료·레시피 같이」가 없다', 한번째 && !/재료·레시피 같이/.test(한번째.글 || ''))

  const t = await 글자(page)
  chk('「레시피도 보내기」를 청한다', /레시피도 보내기/.test(t))
  // ⛔ 시트 위에 시트 금지 — 리뷰는 이 시트가 «닫힌 뒤»에 나와야 한다
  chk('리뷰창이 «아직» 안 떴다', !/스토어에 한마디/.test(t))

  // ── ② 「레시피도 보내기」 = 두 번째도 한 장 ──
  console.log('\n② 📄 「레시피도 보내기」 — 두 번째도 «한 장»으로 나가나')
  await 눌러(page, '레시피도 보내기')
  await 공유기다리기(page, 1)
  const 전부 = await 보낸것(page)
  chk('공유가 «두 번» 나갔다', 전부.length, 2)
  chk('두 번째도 한 장', 전부[1] && 전부[1].장수, 1)
  chk('두 번째가 «레시피»다', 전부[1] && /recipe/.test(전부[1].이름 || ''))

  await page.waitForTimeout(900)
  const t2 = await 글자(page)
  chk('시트가 닫혔다', !/레시피도 보내기/.test(t2))
  chk('그제서야 리뷰를 청한다', /스토어에 한마디/.test(t2))
  await page.close()
}

// ─────────────────────────────────────────────────────────────
console.log('\n③ 🎴 랜덤 카드도 같은가 — 여기도 한 장씩')
// ─────────────────────────────────────────────────────────────
{
  const page = await 새탭()
  await 공유흉내(page)
  await 자랑탭열기(page)
  await 콩국수시트(page)
  await 눌러(page, '랜덤 카드로 뽑기')
  await page.waitForFunction(
    () => [...document.querySelectorAll('button')].some((x) => /공유하기/.test(x.innerText || '')),
    null, { timeout: 45000 },
  ).catch(() => {})
  const 카드글 = await 글자(page)
  chk('랜덤 카드가 떴다', /공유하기/.test(카드글))
  // ✍️ 「되는 척」하는 글자가 남았나 — v11.19 「링크 정직」과 같은 자리.
  //   ⛔ 소스를 grep 하면 «주석에 적어둔 옛 문구»까지 걸려 고쳐놓고도 실패한다(규칙 18 ⓘ)
  //      → **화면에 그려진 글자**(innerText)로 본다.
  chk('⛔ 「2장이 함께 가요」가 «안» 남았다', !/2장\(카드\+레시피\)이 함께 가요/.test(카드글))
  chk('한 장씩이라고 말한다', /한 장 더 보내요/.test(카드글))

  await 눌러(page, '공유하기')
  await 공유기다리기(page, 0)
  const 한번째 = (await 보낸것(page))[0]
  chk('공유가 실제로 불렸다', !!한번째)
  chk('넘긴 파일 = 한 장', 한번째 && 한번째.장수, 1)
  chk('그 한 장이 «카드»다', 한번째 && /hankki-1/.test(한번째.이름 || ''))
  chk('문구에 「재료·레시피 같이」가 없다', 한번째 && !/재료·레시피 같이/.test(한번째.글 || ''))
  chk('「레시피도 보내기」를 청한다', /레시피도 보내기/.test(await 글자(page)))

  await 눌러(page, '레시피도 보내기')
  await 공유기다리기(page, 1)
  const 전부 = await 보낸것(page)
  chk('공유가 «두 번» 나갔다', 전부.length, 2)
  chk('두 번째도 한 장', 전부[1] && 전부[1].장수, 1)
  chk('두 번째가 «레시피»다', 전부[1] && /recipe/.test(전부[1].이름 || ''))
  await page.close()
}

// ─────────────────────────────────────────────────────────────
console.log('\n④ 🙅 「괜찮아요」 — 안 보내고 닫히나 (⛔몰래 보내면 안 된다)')
// ─────────────────────────────────────────────────────────────
{
  const page = await 새탭()
  await 공유흉내(page)
  await 자랑탭열기(page)
  await 콩국수시트(page)
  await 눌러(page, '내가 꾸민 표지 그대로')
  await 공유기다리기(page, 0)
  chk('「레시피도 보내기」가 떴다', /레시피도 보내기/.test(await 글자(page)))
  await 눌러(page, '괜찮아요')
  await page.waitForTimeout(900)
  const 전부 = await 보낸것(page)
  chk('공유는 «한 번»뿐이다', 전부.length, 1)
  chk('시트가 닫혔다', !/레시피도 보내기/.test(await 글자(page)))
  await page.close()
}

await b.close()
srv.close()
console.log(`\n${실패 ? '⛔' : '✅'} ${통과}/${통과 + 실패}\n`)
process.exit(실패 ? 1 : 0)
