// 📸 홍보물에 쓸 «앱 실제 화면» 원본 캡처 (2026-08-20)
//
// 📮 창업자 = *"실제 앱 화면 캡처 … 화면 전체가 보이도록 원본 캡처로 부탁해.
//    홍보물 속에서도 UI는 임의로 다시 그리지 않고 «실제 화면을 살리는 편»이 좋아."*
//
// ⭐⭐ 왜 「다시 그리지 않는다」가 중요한가 — 2026-07-31 스토어 스샷 사고가 정확히 그것이었다.
//    앱 밖에서 따로 그린 스샷이라 **앱 문구가 바뀌어도 안 따라왔고**(*"내 레시피, 예쁘게 꾸며요"*
//    vs 실제 *"한 끼를 해낸다면, 레꾸하세요."*) **이모지가 깨진 채로 스토어에 올라가 있었다.**
//    실제 화면을 찍으면 그 갈림이 «구조적으로» 안 생긴다.
//
// ⭐ 찍는 순서 = 창업자가 매긴 우선순위 그대로
//    ① 레시피 목록 ② 레시피 상세 ③ 꾸미기 편집 ④ 장보기·냉장고·타이머
//
// ⛔ 온보딩·코치마크를 «끄고» 찍는다 — 안 끄면 안내 딱지가 화면을 덮는다(규칙 21).
// ⛔ 화면 한가운데를 덮은 것이 있으면 «찍기 전에» 알린다 — 2026-08-11 에 온보딩 화면 3장을
//    「우리집레시피 시안」이라며 창업자에게 보낸 사고가 있었다. 숫자는 전부 초록불이었다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_shot-홍보용앱화면-0820.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홍보/앱화면'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4381, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const { ONBOARD_KEY } = await import('../src/components/Onboarding.jsx').catch(() => ({ ONBOARD_KEY: 'hankki:onboarded' }))

const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const 찍은것 = []
const 놓친것 = []

// 🥕🥕 **예시를 «넣고» 찍는다** — 창업자 2026-08-20 *"예시도 넣고(장보기나 냉장고)"*
//   ⛔⛔ 갓 깐 앱은 **장보기·냉장고·일기가 텅 비어 있다.** 그 화면을 홍보물에 얹으면
//      「이 앱 아무것도 없네」가 첫인상이 된다. 우리가 팔려는 건 «채워진 뒤»의 모습이다.
//   ⛔ `page.reload()` 금지 — 저장값이 시드로 덮인다(check-mistakes ⑧). **새 탭으로 연다.**
//   ⚠️ 유통기한은 «오늘 기준»으로 만든다 — 날짜를 박아두면 내일 캡처가 낡는다.
const 씨앗 = () => {
  const st = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const 오늘 = new Date(); 오늘.setHours(12, 0, 0, 0)
  const 날 = (d) => { const x = new Date(오늘); x.setDate(x.getDate() + d); return x.getTime() }

  // 🧊 냉장고 — 유통기한이 «가까운 것부터» 보이게 섞는다(D-1 · D-3 이 있어야 그 기능이 보인다)
  st.pantry = [
    { id: 'pz1', name: '두부', qty: '1모', exp: 날(1), at: 날(-2) },
    { id: 'pz2', name: '애호박', qty: '1개', exp: 날(3), at: 날(-2) },
    { id: 'pz3', name: '달걀', qty: '10구', exp: 날(12), at: 날(-4) },
    { id: 'pz4', name: '대파', qty: '2대', exp: 날(6), at: 날(-1) },
    { id: 'pz5', name: '돼지고기 앞다리살', qty: '400g', exp: 날(2), at: 날(-1) },
    { id: 'pz6', name: '신김치', qty: '1/4포기', exp: 날(30), at: 날(-9) },
    { id: 'pz7', name: '양파', qty: '3개', exp: 날(15), at: 날(-5) },
  ]
  // 🛒 장보기 — «산 것 ＋ 안 산 것»이 섞여야 체크 기능이 보인다
  st.shop = [
    { id: 'sz1', name: '콩나물', qty: '1봉', done: false },
    { id: 'sz2', name: '두부', qty: '1모', done: true },
    { id: 'sz3', name: '청양고추', qty: '3개', done: false },
    { id: 'sz4', name: '느타리버섯', qty: '1팩', done: false },
    { id: 'sz5', name: '다시마', qty: '1봉', done: true },
  ]
  localStorage.setItem('hankki:v1', JSON.stringify(st))
}

const 새페이지 = async (씨앗넣기 = false) => {
  // ⭐ deviceScaleFactor 3 = 폰 실물 해상도(1170×2532). 홍보물에 크게 얹어도 안 뭉갠다
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
  await page.addInitScript(SEED_COACH_SEEN)
  // 📰 [2026-09-01] 소식 팝업도 끈다 — 안 끄면 홍보용 화면에 팝업이 얹혀 찍힌다
  await page.addInitScript((k) => { try { localStorage.setItem(k, '1'); localStorage.setItem('hankki:news:off', '1') } catch {} }, ONBOARD_KEY || 'hankki:onboarded')
  await page.goto('http://127.0.0.1:4381/hankki/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(900)
  if (씨앗넣기) {
    await page.evaluate(씨앗)
    // ⛔⛔ `b.newPage()` 로 «새 탭»을 열면 안 된다 — Playwright 는 그때마다 **새 컨텍스트**를 만들어서
    //    localStorage 가 통째로 갈린다(씨앗이 통째로 사라진다). 2026-08-20 에 짜다가 잡았다.
    // ⛔ `page.reload()` 도 안 된다 — 저장값이 시드로 덮인다(check-mistakes ⑧ 「옛 함정 사전」).
    // ✅ **같은 페이지에서 `goto`** — localStorage 는 살고 앱만 다시 읽는다.
    await page.goto('http://127.0.0.1:4381/hankki/', { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(1100)
  }
  return page
}

// 🔎 찍기 «전»에 — 화면을 덮은 것이 있나 (규칙 21)
// ⛔⛔ 첫 판은 «한가운데 한 점»(y=420)만 봤다가 「출시 기념 선물」 시트를 놓쳤다 —
//    그 시트는 y=620 부터 올라와서 420 지점엔 여전히 표지가 보였다. **한 점은 화면이 아니다.**
//    → 위·가운데·아래 «세 높이»를 본다. 아래쪽 시트는 아래에서만 잡힌다.
const 덮였나 = async (page) => page.evaluate(() => {
  const 덮개판정 = '[class*="onboard"],[class*="coach"],[class*="overlay"],[class*="backdrop"],[class*="modal"],[class*="sheet"]'
  for (const y of [200, 420, 700]) {
    const el = document.elementFromPoint(195, y)
    const 덮개 = el?.closest(덮개판정)
    if (덮개) return `y=${y} · ${덮개.className}`
  }
  return ''
})

// 🎁 「출시 기념 선물」처럼 «저절로 뜨는» 시트를 닫는다 — 홍보 캡처엔 안 나와야 한다
const 시트닫기 = async (page) => {
  for (const 글자 of ['나중에 볼게요', '닫기']) {
    const btn = page.getByRole('button', { name: 글자 }).first()
    if (await btn.count()) { await btn.click(); await page.waitForTimeout(900); return true }
  }
  return false
}

// ⚠️ 시트로 «뜨는 게 정상»인 화면(타이머)은 덮개 검사를 건너뛴다 —
//    안 그러면 찍어야 할 것 자체를 덮개로 오판해 막는다(규칙 18 ⓘ · 2026-08-20 실제로 그랬다)
const 찍자 = async (page, 이름, 설명, 시트정상 = false) => {
  const 덮개 = 시트정상 ? '' : await 덮였나(page)
  if (덮개) { 놓친것.push(`${이름} — 화면이 덮여 있다 (${덮개})`); console.log(`  ⛔ ${이름} — 덮개: ${덮개}`); return false }
  const 길 = join(OUT, `${이름}.png`)
  await page.screenshot({ path: 길 })
  찍은것.push({ 이름, 설명, 길 })
  console.log(`  ✅ ${이름} — ${설명}`)
  return true
}

// ⛔ getByRole 로 「레시피」를 찾으면 «검색 화면의 딴 버튼»이 먼저 걸린다(2026-08-20 실측).
//    하단바를 콕 집는다 — 「.bottom-nav 안의 그 글자」라야 한다.
const 탭으로 = async (page, 글자) => {
  const t = page.locator('.bottom-nav .nav-item').filter({ hasText: 글자 }).first()
  if (!(await t.count())) return false
  await t.click(); await page.waitForTimeout(1300)
  return true
}

// ── ① 레시피 목록 ────────────────────────────────────────────
const p = await 새페이지()
p.on('pageerror', (e) => console.log('  ⚠️ pageerror:', String(e.message || e).split('\n')[0]))

await 찍자(p, '00-홈', '홈 — 첫인상')

if (await 탭으로(p, '레시피')) await 찍자(p, '01-레시피목록', '레시피 목록 — 표지가 깔린 화면')
else 놓친것.push('레시피 탭을 못 찾았다')

// ── ② 레시피 상세 ────────────────────────────────────────────
// 카드 아무거나 하나 — 「표지가 예쁜 편」이 앞에 오도록 목록 첫 칸을 쓴다
const 카드 = p.locator('.grid-card, .album-tile').first()
if (await 카드.count()) {
  await 카드.click(); await p.waitForTimeout(1400)
  await 찍자(p, '02-레시피상세', '레시피 상세 — 표지·재료·순서')
} else 놓친것.push('레시피 카드를 못 찾았다')

// ── ③ 꾸미기 편집 화면 ───────────────────────────────────────
const 꾸미기 = p.getByRole('button', { name: '레시피 꾸미기' }).first()
if (await 꾸미기.count()) {
  await 꾸미기.click(); await p.waitForTimeout(1600)
  await 시트닫기(p)
  await p.waitForTimeout(600)
  await 찍자(p, '03-꾸미기편집', '레꾸 — 스티커 서랍이 열린 편집 화면')
} else 놓친것.push('「레시피 꾸미기」 버튼을 못 찾았다')

// ── ④ 타이머 ─────────────────────────────────────────────────
const p2 = await 새페이지()
if (await 탭으로(p2, '레시피')) {
  const c2 = p2.locator('.grid-card, .album-tile').first()
  if (await c2.count()) {
    await c2.click(); await p2.waitForTimeout(1400)
    const 타이머 = p2.getByRole('button', { name: /^타이머$/ }).first()
    if (await 타이머.count()) {
      await 타이머.scrollIntoViewIfNeeded()
      await 타이머.click(); await p2.waitForTimeout(1200)
      await 찍자(p2, '06-타이머', '요리 타이머', true)
    } else 놓친것.push('「타이머」 버튼을 못 찾았다')
  }
}

// ── ⑤ 장보기 · 냉장고 ────────────────────────────────────────
const p3 = await 새페이지(true)   // ⭐ 씨앗 = 장보기·냉장고에 실제 재료를 넣고 연다
if (await 탭으로(p3, '장보기')) {
  await 찍자(p3, '04-장보기', '장보기 목록')
  const 냉장고 = p3.locator('[data-coach="pantry"]').first()
  if (await 냉장고.count()) {
    await 냉장고.click(); await p3.waitForTimeout(1200)
    await 찍자(p3, '05-냉장고', '냉장고 재료 — 유통기한')
  } else 놓친것.push('「냉장고」 토글을 못 찾았다')
} else 놓친것.push('장보기 탭을 못 찾았다')

// ── ⑥ 일기 (덤 — 「그날의 기억」 카드에 쓸 재료) ──────────────
const p4 = await 새페이지()
if (await 탭으로(p4, '일기')) await 찍자(p4, '07-일기', '요리 일기')

// ═══════════════════════════════════════════════════════════════
// 🆕 [2026-08-20 밤] 창업자 = *"오늘 준 것보다 더 자세히 찍어줘야 좋을 것 같아"*
//    ⭐ 홍보 시안(「레꾸자랑 만드는 법 ①②」)이 «레꾸자랑 흐름»을 쓰는데 그게 통째로 빠져 있었다.
//    ⛔ 지피티가 «기억으로» 그리면 오차가 난다 — 실제로 「한식 32」(진짜 35) ·
//       「Ploy스토어」(진짜 Play) 가 그렇게 나왔다. **실물을 주면 그럴 일이 구조적으로 없다.**
// ═══════════════════════════════════════════════════════════════

// 📜 스크롤해서 «아래쪽»도 찍는다 — 한 화면에 안 들어가는 것이 많다(냉장고 재료 목록이 잘렸다)
const 굴려찍자 = async (page, 이름, 설명, px = 700) => {
  await page.evaluate((y) => {
    const el = document.querySelector('.screen') || document.scrollingElement
    el.scrollTop = y
  }, px)
  await page.waitForTimeout(700)
  return 찍자(page, 이름, 설명)
}

// ── ⑦ 냉장고 «재료 목록» — D-3 배지가 보이는 자리 ────────────
if (await 탭으로(p3, '장보기')) {
  const 냉2 = p3.locator('[data-coach="pantry"]').first()
  if (await 냉2.count()) {
    await 냉2.click(); await p3.waitForTimeout(1000)
    await 굴려찍자(p3, '05b-냉장고-재료목록', '냉장고 — 재료 목록·유통기한 배지', 900)
  }
}

// ── ⑧ 레꾸자랑 목록 (홍보 시안 ①이 쓰는 화면) ────────────────
const p5 = await 새페이지()
if (await 탭으로(p5, '레꾸자랑')) {
  await 시트닫기(p5)
  await 찍자(p5, '08-레꾸자랑목록', '레꾸자랑 — 자랑할 레시피 고르기')

  // ── ⑨ 카드 고르기 시트 ＋ ⑩ 랜덤 카드 (시안 ②가 쓰는 화면) ──
  const 첫칸 = p5.locator('.grid-card, .album-tile, .brag-card').first()
  if (await 첫칸.count()) {
    await 첫칸.click(); await p5.waitForTimeout(1300)
    await 찍자(p5, '09-카드고르기', '레꾸자랑 — 내 표지 or 랜덤 카드 고르기', true)

    // 「랜덤 카드」 쪽을 눌러 실제 카드 화면까지
    const 랜덤 = p5.getByRole('button', { name: /랜덤/ }).first()
    if (await 랜덤.count()) {
      await 랜덤.click(); await p5.waitForTimeout(2200)   // 카드 그리는 데 시간이 걸린다
      await 찍자(p5, '10-랜덤카드', '랜덤 카드 — 뽑을 때마다 달라지는 그 화면', true)
    } else 놓친것.push('「랜덤 카드」 버튼을 못 찾았다')
  } else 놓친것.push('레꾸자랑 목록의 첫 칸을 못 찾았다')
} else 놓친것.push('레꾸자랑 탭을 못 찾았다')

// ── ⑪ 가져오기 (＋) — 「흩어진 걸 담는다」를 보여주는 자리 ────
const p6 = await 새페이지()
if (await 탭으로(p6, '가져오기')) {
  await p6.waitForTimeout(900)
  await 찍자(p6, '11-가져오기', '가져오기 — 캡처·붙여넣기로 담기', true)
}

await b.close(); srv.close()

console.log(`\n📸 찍은 것 ${찍은것.length}장 → ${OUT}`)
for (const s of 찍은것) console.log(`   · ${s.이름}.png — ${s.설명}`)
if (놓친것.length) {
  console.log(`\n⚠️ 못 찍은 것 ${놓친것.length}개 — 「없다」가 아니라 「내 찾는 방식이 안 맞았다」일 수 있다 (규칙 18)`)
  for (const m of 놓친것) console.log(`   ⛔ ${m}`)
}
