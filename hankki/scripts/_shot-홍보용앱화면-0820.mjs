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

const 새페이지 = async () => {
  // ⭐ deviceScaleFactor 3 = 폰 실물 해상도(1170×2532). 홍보물에 크게 얹어도 안 뭉갠다
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
  await page.addInitScript(SEED_COACH_SEEN)
  await page.addInitScript((k) => { try { localStorage.setItem(k, '1') } catch {} }, ONBOARD_KEY || 'hankki:onboarded')
  await page.goto('http://127.0.0.1:4381/hankki/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(900)
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
const p3 = await 새페이지()
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

await b.close(); srv.close()

console.log(`\n📸 찍은 것 ${찍은것.length}장 → ${OUT}`)
for (const s of 찍은것) console.log(`   · ${s.이름}.png — ${s.설명}`)
if (놓친것.length) {
  console.log(`\n⚠️ 못 찍은 것 ${놓친것.length}개 — 「없다」가 아니라 「내 찾는 방식이 안 맞았다」일 수 있다 (규칙 18)`)
  for (const m of 놓친것) console.log(`   ⛔ ${m}`)
}
