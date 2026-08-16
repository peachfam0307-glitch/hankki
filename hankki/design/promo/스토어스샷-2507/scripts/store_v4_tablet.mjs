// 🖥🖥 태블릿 스토어 스크린샷 — **가로모드 실제 앱 화면** (2026-08-16)
//
// 📮 창업자 = *"우리 패드에도 되니까 만들어야해"* → *"**이왕하는거 가로모드로 하자.**"*
//
// ⭐ 왜 가로인가 — 세로(온보딩 판)도 규격은 통과하지만, **태블릿의 «강점»이 안 보인다.**
//   우리는 v10.08 에 가로모드를 열었고 v10.62~65 에 패드 레이아웃을 고쳤다.
//   가로에서 레꾸는 **종이 왼쪽 · 꾸미기 서랍 오른쪽**으로 갈린다 — 그게 폰과 다른 자리다.
//
// 📐 Play 규격(콘솔 실물 2026-08-16) = 16:9 또는 9:16 · 7인치 320~3840px · **10인치 1080~7680px**
//   → **2560×1440 (16:9)** 로 간다. 10인치 하한(1080)을 넘고 상한(3840)에 여유가 있다.
//   ⛔ 3840×2160 은 상한에 «딱» 걸려 위험하다.
//
// ⛔ 이 판은 «실제 앱»이라 온보딩·코치마크가 화면을 덮는다 — 둘 다 미리 끈다.
//    (2026-08-11 에 그걸 안 꺼서 온보딩 화면을 홈이라고 창업자에게 보냈다 · 규칙 21)
//
// 실행: node design/promo/스토어스샷-2507/scripts/store_v4_tablet.mjs
import fs from 'node:fs'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import pw from '/home/user/hankki/hankki/node_modules/playwright-core/index.js'
const { chromium } = pw

const H = '/home/user/hankki/hankki'
const DIST = `${H}/dist`
const OUT = `${H}/design/promo/스토어스샷-2507/renders-v4-tablet`
fs.mkdirSync(OUT, { recursive: true })
if (!fs.existsSync(`${DIST}/index.html`)) { console.log('⛔ dist 가 없다 — `npm run build` 부터'); process.exit(1) }

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4381, r))

const { SEED_COACH_SEEN } = await import(`${H}/src/coach.js`)
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
// ⛔⛔⛔ 첫 판이 **2560×1440 · DPR 1** 이었다 — 창업자 판정 *"2346번은 비어있고 글자 작은게 너무 이상해"*
//   ⭐ 「글자가 작다」가 결정적 단서였다. 원인 = **CSS 픽셀 폭을 두 배로 잡았다.**
//      실제 갤럭시탭은 화면이 2560px 이어도 **DPR 2** 라 앱은 **1280 CSS 픽셀**로 그린다.
//      나는 2560 CSS 픽셀로 띄웠으니 **글자는 절반 크기 · 빈 공간은 두 배**가 됐다.
//   📌 **앱이 휑한 게 아니라 내가 잰 조건이 실제와 달랐다**(규칙 18 — 「없다」의 이유를 내가 정하지 말 것).
//   ✅ 1280×720 CSS × DPR 2 = **출력은 그대로 2560×1440**, 레이아웃만 실제 태블릿과 같아진다.
const page = await b.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript(SEED_COACH_SEEN)                                   // 코치마크가 클릭을 가로챈다
await page.addInitScript(() => localStorage.setItem('hankki:onboarded', '1')) // 온보딩이 화면을 덮는다
// ⛔ 꾸미기 서랍을 «처음» 열면 「출시 기념 선물」 시트가 아래 절반을 덮는다(`nudges.js` K_GIFT).
//    첫 판에서 03-레꾸 가 그 시트에 먹혔다 — 봤으니까 잡았다(규칙 21).
await page.addInitScript(() => localStorage.setItem('hankki:nudge:giftpack', '1'))

await page.goto('http://127.0.0.1:4381/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)

// ⭐ 「무엇이 화면 한가운데를 덮고 있나」를 «찍기 전에» 본다 — 규칙 21 의 장치
const 덮개 = await page.evaluate(() => {
  const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)
  return el ? (el.className || el.tagName) + '' : '없음'
})
console.log('  · 화면 한가운데 =', 덮개)

const 찍기 = async (이름) => {
  await page.waitForTimeout(900)
  await page.screenshot({ path: join(OUT, `${이름}.png`) })
  console.log(`  ✓ ${이름}`)
}

// ⭐ 순서 = 「화면이 꽉 차는 것」부터. 홈은 가로에서 아래가 많이 비어 마지막에 둔다.
const 탭 = async (이름) => { await page.getByText(이름, { exact: true }).last().click(); await page.waitForTimeout(1100) }

// ① 레시피 목록 — ⭐태블릿 최고의 장. 음식 그림 44컷이 한 화면에 들어온다
await 탭('레시피')
await 찍기('01-레시피목록')

// ② 레시피 상세 — 재료·순서가 오른쪽에 갈려 보이는 장. 재료가 많은 편으로.
const 카드 = page.locator('.grid-card').filter({ hasText: '김치찌개' }).first()
const 아무카드 = (await 카드.count()) ? 카드 : page.locator('.grid-card').nth(1)
await 아무카드.click()
await 찍기('02-레시피상세')

// ⭐ 레꾸는 «이미 꾸며진» 레시피로 연다 — 김치찌개는 꾸민 게 없어 「꾸미기 전」 화면이 나왔다.
//   레꾸 샘플(콩국수)은 표지에 배·꼬르곰·펭펭이 붙어 있어 **결과가 보인다.**
await page.goBack(); await page.waitForTimeout(1200)
const 콩국수 = page.locator('.grid-card').filter({ hasText: '콩국수' }).first()
if (await 콩국수.count()) { await 콩국수.click(); await page.waitForTimeout(1400) }
else console.log('  ⚠️ 콩국수 카드를 못 찾았다 — 지금 열린 레시피로 찍는다')

// ③ 레꾸(표지 꾸미기) — ⭐⭐가로에서 «종이 왼쪽 · 서랍 오른쪽»으로 갈린다. 폰과 제일 다른 자리
//    ⛔ 버튼 이름을 짐작하지 않는다 — 못 찾으면 «시끄럽게» 넘어간다(조용히 딴 걸 찍는 게 제일 나쁘다)
const 꾸미기 = page.getByRole('button', { name: /꾸미|레꾸/ }).first()
if (await 꾸미기.count()) {
  await 꾸미기.click(); await page.waitForTimeout(1600)
  // ⛔ 서랍이 «배경» 탭으로 열려서 색 팔레트만 보였다 — 태블릿 강점(종이＋스티커 서랍)이 안 산다.
  //    ✅ 「친구들」 탭을 열어 꼬르곰·펭펭 스티커로 서랍을 채운다.
  const 친구들 = page.getByText('친구들', { exact: true }).first()
  if (await 친구들.count()) { await 친구들.click(); await page.waitForTimeout(1200) }
  else console.log('  ⚠️ 서랍에서 「친구들」 탭을 못 찾았다 — 배경 탭 그대로 찍는다')
  await 찍기('03-레꾸')
} else console.log('  ⛔ 상세에서 「꾸미기」 버튼을 못 찾았다 — 이름을 확인할 것')

// ④~⑤ 나머지 탭
// ⛔ 첫 판은 `goto` 로 새로 열고 탭을 눌렀는데 **07-홈 이 06-레꾸자랑과 똑같이 나왔다** —
//    앱이 «마지막 탭»을 기억해서 goto 뒤에도 그 화면으로 돌아온다.
//    ✅ goto 를 빼고 **하단 탭만 눌러** 옮긴다. ＋찍은 뒤 「무엇이 보이나」를 글자로 확인한다(규칙 18 ⓘ).
const 확인찍기 = async (탭이름, 파일, 보여야할글) => {
  // ⛔ 레꾸(꾸미기)는 **전체화면이라 하단 탭이 없다** — 거기서 탭을 누르려다 30초 타임아웃으로 죽었다.
  //    ✅ 매번 새로 열어 탭이 있는 화면으로 돌아온다. (앱이 마지막 탭을 기억하니 하단바가 있는 곳이다)
  await page.goto('http://127.0.0.1:4381/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1300)
  await 탭(탭이름)
  const 맞나 = await page.getByText(보여야할글, { exact: false }).first().count()
  if (!맞나) { console.log(`  ⛔ ${파일} — 화면에 「${보여야할글}」이 없다. 딴 탭을 찍을 뻔했다`); return }
  await 찍기(파일)
}
await 확인찍기('장보기', '04-장보기', '주부의 장바구니')
await 확인찍기('레꾸자랑', '05-레꾸자랑', '자랑할 레시피')
await 확인찍기('홈', '06-홈', '이번 주 제철')

// ⛔ 「일기」는 뺐다 — 시드에 일기가 0개라 **달력만 텅 빈 화면**이 나온다.
//    스샷용으로 가짜 일기를 만들지 않는다. 일기는 온보딩 세로 판(05-한끼일기)이 이미 잘 보여준다.

console.log(errors.length ? `\n  ⛔ pageerror ${errors.length}건 — ${errors[0]}` : '\n  ✅ pageerror 0')
await b.close(); srv.close()
