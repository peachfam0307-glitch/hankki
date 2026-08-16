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

// 🏷🏷 **파일 이름에 `태블릿-` 을 붙인다** (2026-08-16)
//   ⛔ 전엔 폰 판(`renders-v4/`)과 «이름이 똑같았다** — `04-레꾸.png` 가 두 곳에 있었다.
//      그래서 배포 게이트(`latest-map --check`)가 **「옛 세대가 되살아났다」로 읽고 배포를 막았다.**
//   ⭐ 게이트가 틀린 게 아니다 — **폴더가 달라도 같은 이름이면 사람도 헷갈린다.**
//      창업자가 스토어에 올릴 때 「이게 폰 거야 패드 거야」를 파일 이름만 보고 알아야 한다.
//   📌 이름 원칙 그대로 = **「무엇이 들어 있는지」를 이름이 말해야 한다**(CLAUDE.md).
const 찍기 = async (이름0) => {
  const 이름 = `태블릿-${이름0}`
  // ⛔ 웹폰트가 덜 실린 채 찍으면 손글씨 칩이 **빈 회색 알약**으로 나온다 —
  //    07-일기 첫 판이 그랬다(글씨체 고르는 칸 5개가 텅 빈 회색으로 찍혔다 · 규칙 21 로 잡았다).
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(900)
  await page.screenshot({ path: join(OUT, `${이름}.png`) })
  console.log(`  ✓ ${이름}`)
}

// ⭐⭐ 순서 = **유저가 앱을 여는 순서**. 홈이 첫 장이다.
//   ⛔ 첫 판은 「화면이 꽉 차는 것부터」로 정해 홈을 여섯째에 뒀고 창업자가 잡았다 —
//      *"**홈 화면이 6번째로 가있네**"*. 맞다. **앱을 열면 처음 보는 화면이 스토어에서도 처음**이라야
//      스토어에서 본 그림과 깔고 나서 보는 첫 화면이 이어진다.
const 탭 = async (이름) => { await page.getByText(이름, { exact: true }).last().click(); await page.waitForTimeout(1100) }

// ① 홈 — 앱을 열면 보는 화면
await 탭('홈')
if (!(await page.getByText('이번 주 제철', { exact: false }).first().count())) console.log('  ⛔ 01-홈 — 「이번 주 제철」이 없다')
await 찍기('01-홈')

// ② 레시피 목록 — ⭐태블릿 최고의 장. 음식 그림이 한 화면에 쫙 들어온다
await 탭('레시피')
await 찍기('02-레시피목록')

// ② 레시피 상세 — 재료·순서가 오른쪽에 갈려 보이는 장. 재료가 많은 편으로.
const 카드 = page.locator('.grid-card').filter({ hasText: '김치찌개' }).first()
const 아무카드 = (await 카드.count()) ? 카드 : page.locator('.grid-card').nth(1)
await 아무카드.click()
await 찍기('03-레시피상세')

// 🛒 「장보기 담기」 — ④장보기와 ⑤냉장고를 채우는 길이다.
//   ⛔⛔ 첫 판은 여기서 담은 것이 **「두부 1/2모」·「해물가루육수 1봉」**으로 찍혔고
//      창업자가 그걸 보고 잡았다 — *"장보기에 두부1/2모 양파1/2개를 사진 않지.."* ·
//      *"그냥 두부 양파를 사지. **해물가루육수 1봉을 사진 않잖아**"*
//   ✅ **앱을 고쳤다**(`utils.ingredientName`) — 이제 「두부」·「해물가루육수」로 담기고
//      「돼지고기 200g」처럼 «파는 단위»는 그대로 남는다(창업자 *"양파 1망 돼지고기 600g은 맞지."*).
//   📌 그러니 이 스샷은 **고친 것이 실제로 도는지 보는 자리**이기도 하다.
const 담기 = page.getByRole('button', { name: /장보기 담기/ }).first()
if (await 담기.count()) { await 담기.click(); await page.waitForTimeout(1400) }
else console.log('  ⛔ 상세에서 「장보기 담기」를 못 찾았다 — 장보기·냉장고가 빈 채로 나온다')

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
  await 찍기('04-레꾸')
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
// ④ 장보기 — ⛔`확인찍기` 를 안 쓴다. **찍기 «전»에 체크를 눌러야** 해서 사이에 손이 들어간다
await page.goto('http://127.0.0.1:4381/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1300)
await 탭('장보기')
if (!(await page.getByText('주부의 장바구니', { exact: false }).first().count())) {
  console.log('  ⛔ 05-장보기 — 화면에 「주부의 장바구니」가 없다. 딴 탭을 찍을 뻔했다')
} else {
  // ⭐⭐ **찍는 것이 «먼저»다.** 첫 판은 체크부터 해서 ⑴「샀어요!」 토스트가 화면에 떠 있고
  //    ⑵열두 줄 중 다섯이 취소선이라 «다 사고 난 뒤»로 읽혔다(내가 열어 보고 잡았다 · 규칙 21).
  //    📌 장보기 화면이 보여줄 것은 **「살 것 목록」**이지 「산 것 목록」이 아니다.
  await 찍기('05-장보기')

  // 🛒 찍은 «뒤에» 몇 개를 「샀어요」로 → **그 재료가 냉장고로 들어간다**(⑤ 를 채우는 것이 이 줄이다)
  //   ⚠️ 체크하면 줄 차례가 바뀔 수 있어 **늘 첫 칸을 누른다** — nth(i) 로 잡으면 어긋난다
  const 살것 = await page.locator('.check-box').count()
  const 살개수 = Math.min(5, 살것)
  for (let i = 0; i < 살개수; i++) {
    await page.locator('.check-box[data-on="false"]').first().click().catch(() => {})
    await page.waitForTimeout(350)
  }
  console.log(`  · 장보기 ${살것}칸 중 ${살개수}칸을 「샀어요」로 → 냉장고로 들어간다`)
  await page.waitForTimeout(2600)   // ⛔ 「샀어요!」 토스트가 사라질 때까지 — 안 기다리면 ⑤에 토스트가 찍힌다
}

// ⑤ 냉장고 — 창업자 *"냉장고랑"*. 장보기 탭 «안»의 토글이라 거기서 한 번 더 누른다
const 냉장고 = page.getByText('냉장고', { exact: true }).first()
if (await 냉장고.count()) {
  await 냉장고.click(); await page.waitForTimeout(1400)
  // ⛔ 빈 냉장고를 찍으면 스토어에 「휑한 화면」이 올라간다 — 재료가 들어왔는지 «보고» 찍는다
  const 비었나 = await page.getByText('집에 있는 재료를 넣어두세요', { exact: false }).first().count()
  if (비었나) console.log('  ⛔ 06-냉장고 — 아직 비어 있다. 「샀어요」가 냉장고로 안 넘어갔다')
  else await 찍기('06-냉장고')
} else console.log('  ⛔ 장보기에서 「냉장고」 토글을 못 찾았다')

// ⛔ 「레꾸자랑」은 뺐다 — 창업자 *"레꾸자랑이랑 레시피는 화면이 똑같아"*.
//    맞다. 둘 다 음식 카드 그리드라 한 장을 낭비한다. 레시피 목록(02)이 그 역할을 이미 한다.

// ⑦ 한끼 일기 — 창업자 *"일기는?"* → *"**가짜일기있자나 우리 불고기 그거**"*
//   ⛔⛔ 내가 여기에 *"시드에 일기가 0개라 달력만 텅 빈 화면"* 이라고 적어놨는데 **틀렸다.**
//      `src/data/sampleDiary.js` = **창업자가 8/12 에 직접 쓴 일기**(불고기 전골 사진 · 「방학언제끝나냐..」)가
//      `SAMPLE_READY = true` 로 **처음 켠 사람에게 한 장 놓인다**(`store.jsx:355` `withSample`).
//      📌 규칙 18 — 「없다」가 아니라 «내가 못 찾은 것»이었다. **창업자가 잡아줬다.**
//   ✅ 그래서 빈 종이(「오늘 일기 쓰기」)가 아니라 **그 샘플을 열어서** 찍는다 —
//      사진·스티커 5개·포스트잇·모션이 다 붙어 있어 «태블릿에서 이렇게 넓게 꾸민다»가 한 장에 다 보인다.
//   ⛔ 스샷용 «가짜 일기»를 새로 만들지는 않는다 — 앱에 이미 있는 것을 그대로 연다.
// ⭐⭐⭐ **[2026-08-16 바꿈] 이제 「일기 «탭»」을 찍는다 — 일기 «한 장»이 아니라.**
//   📮 창업자 = *"다른건 다 가로인데 **일기만 세로라 이상해**"* (바로 이 스샷을 보고 한 말이다)
//      → *"**왼쪽에 달력을 붙이던가 꽉차보여야해**"*
//      → 확정 = *"**달력왼쪽 오른쪽에 만든음식이 나오고**, 달력 일기를 클릭하면 일기＋꾸미기가 나와야해"*
//   ✅ 오늘 그 화면을 만들었다(`styles.css` `.pad.log-2col`) — **왼쪽 달력 · 오른쪽 만든 음식.**
//      일기 «한 장»은 3:4 세로 종이라 가로 화면에서 좌우가 비는 게 «구조상» 어쩔 수 없다.
//      ⭐ 그 대신 **프로모 영상**이 일기 한 장과 일꾸(꾸미기)를 담는다 — 자산끼리 역할을 나눈다.
//
// 🍚 **달력에 요리 기록을 심는다** (창업자 *"달력에 이미지 몇개는 넣어둬야하고"* · *"여러개 붙여둬"*)
//   ⛔⛔ 옛 주석의 *"31칸이 거의 다 빈 화면이라 안 찍는다"* 는 **이 씨앗으로 사라진 이유**다.
//      기록을 심으니 칸마다 그날 만든 음식 그림이 뜬다 — 창업자 *"달력 옆에는 만든 이모지가 떠야하는건데"*.
//   ⛔ **앱 씨앗 데이터는 안 건드린다** — 찍을 때만 localStorage 에 심는다(유저에겐 안 나간다).
//   ⚠️ 날짜는 «오늘에서 며칠 전»으로 — 고정 날짜는 달이 바뀌면 달력에서 사라진다.
await page.goto('http://127.0.0.1:4381/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1300)
await page.evaluate((목록) => {
  const raw = localStorage.getItem('hankki:v1'); if (!raw) return
  const st = JSON.parse(raw)
  const 이제 = Date.now()
  st.diary = [
    ...목록.map((x, i) => ({ id: `shot-cook-${i}`, at: 이제 - x[0] * 86400000, title: x[1], rating: 0 })),
    ...(st.diary || []),
  ]
  localStorage.setItem('hankki:v1', JSON.stringify(st))
}, [[1, '수제 떡갈비'], [2, '목살돼지갈비구이'], [3, '감바스'], [5, '소불고기'], [6, '콩국수'], [8, '된장찌개'], [9, '제육볶음'], [12, '소고기 미역국']])
await page.goto('http://127.0.0.1:4381/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await 탭('일기')
await page.waitForTimeout(2200)

// ⭐ 「2단이 실제로 섰나」를 «자리»로 확인한다 — 안 서면 세로판을 찍게 되고 그게 원래 문제였다(규칙 18 ⓘ)
const 이단 = await page.evaluate(() => {
  const r = (q) => { const el = document.querySelector(q); if (!el) return null; const b = el.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width) } }
  const 달력 = r('.log-cal'), 오른 = r('.log-main')
  return { 달력, 오른, 그림: document.querySelectorAll('.cal-food').length }
})
const 나란히 = !!(이단.달력 && 이단.오른 && 이단.달력.x + 이단.달력.w <= 이단.오른.x + 8 && Math.abs(이단.달력.y - 이단.오른.y) < 40)
console.log(`  · 일기 탭 2단 = ${나란히 ? '✅ 왼쪽 달력 · 오른쪽 만든 음식' : '⛔ 2단이 안 섰다'} · 달력 그림 ${이단.그림}개`)
if (!나란히 || 이단.그림 < 5) console.log('  ⛔ 07-일기 — 이 판은 창업자에게 그대로 보내지 말 것')

// 🗄 옛 판에 있던 「일기 종이 아래 잘림」 처리는 여기서 **뺐다** — 이제 일기 «한 장»을 안 연다.
//    (그 처리는 `styles.css` `.paper-box` 고침으로 이미 0px 이 됐고, 필요하면 git 히스토리에 있다)
await 찍기('07-일기')

// ⑧⑨ 요리 모드 ＋ 타이머 — 창업자 *"요리시작해서 타이머 설정 그런것도 찍자."* ·
//    *"**시간 카운트되고 요리모드 되는거**"*
//
// ⭐⭐ 이 장이 「이건 요리하면서 «쓰는» 앱이다」를 말한다 — 나머지 일곱은 «보고 고르는» 화면이다.
//    큰 글씨 · 화면 안 꺼짐 · 단계 타이머 = 브라우저 탭으로는 못 하는 일이고, 손에 물 묻은 채 쓰는 자리다.
// 📌 타이머를 켜면 시트가 닫히고 **`TimerBar`**(진행 막대 ＋ 남은 시간)가 화면 아래에서 «돈다» —
//    창업자가 말한 「시간 카운트되고 요리모드 되는거」가 바로 그 화면이다.
// ⛔ 요리 모드는 **풀스크린이라 하단 탭이 없다** — 그래서 맨 뒤에 둔다(빠져나올 일이 없다).
await page.goto('http://127.0.0.1:4381/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1300)
await 탭('레시피')
const 요리카드 = page.locator('.grid-card').filter({ hasText: '김치찌개' }).first()
if (await 요리카드.count()) { await 요리카드.click(); await page.waitForTimeout(1400) }
else console.log('  ⚠️ 김치찌개를 못 찾았다 — 지금 열린 레시피로 간다')

const 요리시작 = page.getByRole('button', { name: /요리 시작/ }).first()
if (!(await 요리시작.count())) console.log('  ⛔ 상세에서 「요리 시작」을 못 찾았다')
else {
  await 요리시작.click(); await page.waitForTimeout(1500)
  // ⛔ 첫 화면은 «재료 준비»(체크 목록)라 타이머 버튼이 «없다» — 한 칸 넘겨야 STEP 화면이 나온다
  const 준비완료 = page.getByRole('button', { name: /재료 준비 완료/ }).first()
  if (await 준비완료.count()) { await 준비완료.click(); await page.waitForTimeout(1300) }

  // ⑨ 타이머 «맞추는» 화면 — 프리셋 ＋ 분·초 ＋ 알림음 고르기
  const 타이머버튼 = page.getByRole('button', { name: /타이머 맞추기/ }).first()
  if (!(await 타이머버튼.count())) console.log('  ⛔ 「이 단계 타이머 맞추기」를 못 찾았다 — STEP 화면이 아닌가')
  else {
    await 타이머버튼.click(); await page.waitForTimeout(1300)
    await 찍기('09-타이머맞추기')

    // ⏱ 「5분 시작」을 눌러 «실제로 켠다» — 시트가 닫히고 아래 막대가 카운트다운을 시작한다
    //   ⛔ 첫 프리셋(1분)을 누르면 「0:55」가 찍힌다 — **요리 타이머로는 안 어울리는 숫자**다.
    //      ✅ 커스텀 기본값이 5분이라 「5분 시작」을 누르면 「4:5x」 — 볶고 끓이는 시간으로 읽힌다.
    const 프리셋 = page.getByRole('button', { name: /분 시작$/ }).first()
    if (await 프리셋.count()) {
      const 몇분 = (await 프리셋.innerText()).trim()
      await 프리셋.click()
      // ⭐ 잠깐 기다린다 — 켜자마자 찍으면 「5:00」 이라 «멈춰 있는지 도는지» 구분이 안 된다.
      //    몇 초 흘려 「4:5x」 가 되면 «가고 있다»가 한눈에 읽힌다.
      await page.waitForTimeout(4200)
      // ⛔ 막대가 실제로 떴나 — 안 떴으면 그냥 요리 화면이라 창업자가 말한 장이 아니다
      const 돌고있나 = await page.evaluate(() => {
        const bar = document.querySelector('.timer-bar')
        return bar ? (bar.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40) : ''
      })
      console.log(돌고있나 ? `  · 타이머 ${몇분} 켜짐 → 막대 「${돌고있나}」` : `  ⛔ 타이머를 켰는데 막대가 안 보인다`)
    } else console.log('  ⛔ 타이머 프리셋 버튼을 못 찾았다')
    await 찍기('08-요리모드')
  }
}

console.log(errors.length ? `\n  ⛔ pageerror ${errors.length}건 — ${errors[0]}` : '\n  ✅ pageerror 0')
await b.close(); srv.close()
