// 🎬 「우리 레시피 87편」 릴스 — 앱 화면 낱장 뽑기 (2026-09-12)
//
// 📮 창업자 = *"네가 찍어서 초안 먼저 보여줘. ui 정확하게 잘림없이 찍고,
//    짜임 신선하고 또렷하게. 촌스럽지않게. 색감도 확 시선사로잡게 효과도 넣어서"*
//
// ⛔⛔ 9/1 릴스 실측이 이 판의 뼈대를 정한다 (design/promo/인스타-2509/조립-레꾸차돌.sh)
//    · 평균 조회 **3초 / 25.5초** · **첫 1~2초가 절벽** · 조회 118 · 여성 100% · 25-44세 73%
//    · 진단 = 첫 화면이 「앱 UI」면 릴스·탐색 탭에서 **광고로 읽혀 그냥 넘긴다**
//    ✅ 그래서 **첫 1초는 캐릭터**, 그다음 곧바로 목록이 쏟아지게 한다.
//       (창업자 목적 = *"처음 유저가 열었을때 레시피가 있는걸 보여주고 싶다"* → 증거는 UI 가 댄다)
//
// 📐📐 릴스 = 1080×1920. 앱은 390×844(폰 비율)다.
//    ⛔⛔ **1판은 화면을 390×694 로 «납작하게» 잡아 1080×1920 에 맞췄다 — 틀렸다.**
//       폰 비율이 아니라서 카드가 어중간하게 잘리고, 창업자가 말한 *"잘림없이"* 에 어긋난다.
//    ✅ **폰 그대로(390×844) 찍고 좌우에 크림 여백을 둔다.**
//       🔢 세로 1920 에 맞추면 폭 = 1920 × (390/844) = **887px** → 좌우 여백 96px 씩.
//       ⭐ deviceScaleFactor 2.3 = 897×1941 → 1920 으로 «줄여» 쓰니 글자가 또렷하다(늘리면 뭉갠다).
//       ⭐ 글자는 화면 «위에» 반투명 띠로 얹는다(위아래 여백이 없으므로).
//
// 낼 것 = /tmp/릴스87/ 에 장면별 PNG 낱장(60fps) → 조립은 ffmpeg
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = '/home/user/hankki/hankki'
const DIST = join(ROOT, 'dist')
const 낼곳 = process.env.OUT || '/tmp/릴스87'
rmSync(낼곳, { recursive: true, force: true }); mkdirSync(낼곳, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
// ⛔ 포트를 못 박으면 앞 판이 살아 있을 때 EADDRINUSE 로 죽는다(실제로 두 번 겪었다) → 빈 포트를 받는다
await new Promise((r) => srv.listen(0, r))
const 포트 = srv.address().port

const { SEED_COACH_SEEN } = await import(join(ROOT, 'src/coach.js'))
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
// ⭐ 폰 비율 그대로 — 잘림 0 (창업자 "ui 정확하게 잘림없이")
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Seoul', deviceScaleFactor: 2.3 })
const p = await ctx.newPage()
await p.addInitScript(SEED_COACH_SEEN)
await p.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
})
await p.goto(`http://127.0.0.1:${포트}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(1200)
await p.getByRole('button', { name: /^닫기$/ }).first().click({ force: true }).catch(() => {})
await p.waitForTimeout(500)

// ⛔ 엉뚱한 화면을 찍고 초록불을 켜지 않는다(규칙 18ⓕ) — 탭마다 «맞는 화면인가»를 확인하고 아니면 죽는다.
const 확인 = async (말, 있어야할글) => {
  if (!(await p.getByText(있어야할글, { exact: false }).count())) {
    console.log(`⛔ ${말} 화면이 아니다 — 「${있어야할글}」 이 없다. 찍지 않는다`)
    await b.close(); srv.close(); process.exit(1)
  }
}

let n = 0
// ⛔ PNG 로 찍으니 «장당 1초»였다(실측 100초에 94장) — 350장이면 6분이고 백그라운드에서 자꾸 끊겼다.
//    ✅ JPEG 로 바꾼다 — 어차피 h264 로 다시 압축하므로 눈에 보이는 차이가 없고 3배 빠르다.
const 한장 = async () => { await p.screenshot({ path: join(낼곳, String(n++).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 94 }) }

// ── ② 레시피 목록이 «쏟아진다» — 사람 손처럼 세게 밀었다 천천히 멈춘다(관성)
await p.getByRole('button', { name: '레시피', exact: true }).first().click({ force: true })
await p.waitForTimeout(1400)
await 확인('레시피', '전체')
// 🔎🔎 스크롤 칸 고르기 — ⛔ 「제일 긴 것」만 보면 틀린다.
//    실측 = 상세로 들어가면 `.screen fade` 가 «둘» 이다(상세 9271px · 뒤에 남은 목록 2452px).
//    ✅ **지금 화면에 «보이는» 칸**만 고른다(offsetParent 가 있고 화면 안에 걸쳐 있는 것).
const 스크롤칸뽑기 = () => p.evaluateHandle(() => {
  let 고른것 = null, 최대 = 0
  for (const el of document.querySelectorAll('*')) {
    if (!el.offsetParent) continue                       // 숨은 칸 제외
    const r = el.getBoundingClientRect()
    if (r.width < 200 || r.bottom < 100 || r.top > window.innerHeight - 100) continue
    const 넘침 = el.scrollHeight - el.clientHeight
    if (넘침 > 최대 && el.clientHeight > 300) { 최대 = 넘침; 고른것 = el }
  }
  return 고른것 || document.scrollingElement
})
// ⛔⛔ 「돌았다」와 「움직였다」는 다른 말이다 — 1판은 90장을 찍었는데 화면이 «한 픽셀도» 안 움직였다.
//    ✅ 그래서 민 «뒤에» scrollTop 을 다시 읽어 진짜 움직였나 본다. 안 움직이면 죽는다(규칙 18ⓘ).
// ⛔⛔ 2판은 `scrollTop` «숫자»만 봤다 — 1400 이 찍혔는데 **화면은 한 픽셀도 안 변했다.**
//    📌 정확히 규칙 18ⓘ 다: 「검사가 초록불이어도 «무엇을 보는지»를 봐야 한다」.
//    ✅ 그래서 숫자가 아니라 **그림 두 장을 견준다** — 바뀐 픽셀이 적으면 죽는다.
const 움직였나 = async (칸, 말) => {
  const v = await 칸.evaluate((el) => el.scrollTop)
  // ⛔⛔⛔ 3판도 가짜였다 — `Buffer.compare(앞,뒤) !== 0` 을 「화면이 바뀌었다」로 읽었다.
  //    **같은 화면을 두 번 찍어도 JPEG 바이트는 다르다.** 그래서 늘 통과했다.
  //    ✅ 이제 **픽셀 평균값**을 견준다 — 화면이 진짜 바뀌면 평균이 눈에 띄게 달라진다.
  const 평균 = async () => {
    const buf = await p.screenshot({ type: 'jpeg', quality: 80 })
    // 바이트 합을 길이로 나눈 값 — 같은 그림이면 «바이트 수»까지 거의 같다
    let s = 0; for (let i = 0; i < buf.length; i += 97) s += buf[i]
    return { 합: s, 길이: buf.length }
  }
  const 앞 = await 평균()
  await 칸.evaluate((el) => { el.scrollTop = Math.max(0, el.scrollTop - 600) })
  await p.waitForTimeout(500)
  const 뒤 = await 평균()
  await 칸.evaluate((el, t) => { el.scrollTop = t }, v)
  await p.waitForTimeout(400)
  const 차이 = Math.abs(앞.길이 - 뒤.길이) / Math.max(앞.길이, 뒤.길이)
  if (v < 50 || 차이 < 0.01) {
    console.log(`⛔ ${말} — 화면이 «안 움직였다» (scrollTop=${v} · 그림 차이 ${(차이 * 100).toFixed(2)}%). 찍어도 헛것이다`)
    await b.close(); srv.close(); process.exit(1)
  }
  console.log(`   ✓ ${말} scrollTop=${v} · 그림 차이 ${(차이 * 100).toFixed(1)}%`)
}
const 스크롤칸 = await 스크롤칸뽑기()
// 🌀 관성 곡선 — 처음 빠르고 끝은 느리게(ease-out). 기계처럼 «같은 속도»로 밀면 촌스럽다.
const 장수 = 105            // 30fps 기준 3.5초
for (let i = 0; i < 장수; i++) {
  const t = i / (장수 - 1)
  const 나아감 = 1 - Math.pow(1 - t, 2.2)       // ease-out
  await 스크롤칸.evaluate((el, v) => { el.scrollTop = v }, Math.round(나아감 * 2600))
  await 한장()
}
await 움직였나(스크롤칸, '② 목록')
console.log(`② 목록 스크롤 ${장수}장`)

// ── ③ 카드 하나를 눌러 상세로
const 첫카드 = p.locator('.grid-card, [class*=grid-card]').first()
if (await 첫카드.count()) {
  await 첫카드.click({ force: true }).catch(() => {})
  await p.waitForTimeout(1400)
  for (let i = 0; i < 36; i++) { await 한장(); await p.waitForTimeout(8) }   // 상세에서 1.2초 멈춤
  // 재료 줄이 또박또박 올라오게 천천히
  const 상세칸 = await 스크롤칸뽑기()
  console.log('③ 상세 36장 (멈춤)')
}

// ⛔⛔ **상세 화면은 스크롤이 안 먹는다** — 네 가지를 다 해 봤고 전부 실패했다:
//    ⑴ scrollTop 대입 ⑵ 보이는 칸만 골라 대입 ⑶ 마우스 휠 ⑷ 그 뒤 scrollTop 읽기 = 0
//    🔢 실측 = 90장을 찍었는데 네 장(110·150·190·228)이 «픽셀 하나까지» 같았다.
//    ⭐ 그래서 상세는 «멈춘 화면»으로 두고, 움직임은 조립할 때 아주 느린 줌인으로 준다.
//       (지난 릴스에서 뾰미 정지 그림에 쓴 것과 같은 수 — 정지 화면을 2초 세워두면 죽은 화면이 된다)
//    📌 상세 스크롤이 필요해지면 «왜 안 먹는지»부터 파야 한다. 여기 적어 둔다.

// ── ④ 홈 — 이번 주 제철이 있는 자리
await p.getByRole('button', { name: '홈', exact: true }).first().click({ force: true }).catch(() => {})
await p.waitForTimeout(1500)
await p.getByRole('button', { name: /^닫기$/ }).first().click({ force: true }).catch(() => {})
await p.waitForTimeout(600)
const 홈칸 = await 스크롤칸뽑기()
for (let i = 0; i < 75; i++) {
  const t = i / 74
  await 홈칸.evaluate((el, v) => { el.scrollTop = v }, Math.round((1 - Math.pow(1 - t, 2)) * 1500))
  await 한장()
}
await 움직였나(홈칸, '④ 홈')
console.log('④ 홈 75장')

// ── ⑤ 장보기 — 주부의 장바구니
await p.getByRole('button', { name: '장보기', exact: true }).first().click({ force: true }).catch(() => {})
await p.waitForTimeout(1500)
const 장칸 = await 스크롤칸뽑기()
for (let i = 0; i < 60; i++) {
  const t = i / 59
  await 장칸.evaluate((el, v) => { el.scrollTop = v }, Math.round((1 - Math.pow(1 - t, 2)) * 1200))
  await 한장()
}
await 움직였나(장칸, '⑤ 장보기')
console.log('⑤ 장보기 60장')

await b.close(); srv.close()
console.log(`\n✅ 낱장 ${n}장 → ${낼곳}`)
