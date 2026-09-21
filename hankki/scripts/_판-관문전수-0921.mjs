// 🔬🔬 [2026-09-21] **앱을 «실제로 눌러가며» 어떤 관문이 나가는지 잡는다.**
//
// 📮 창업자 = *"전체적으로 일일이 다 확인해보고(누르고 재현하고 시뮬레이션 3번씩 돌리고) 다각도로 흔들어서 재검토해."*
//    ＋ *"식비도 사용하는지 재야하고"* · *"레꾸 일기 등등"* · *"일꾸, 레꾸 스티커들 진짜 사용하는지"*
//    ＋ *"주부의 장바구니도 몇명이 눌러봤는지 사러가기 눌러본 사람은 몇명인지"*
//    ＋ *"진짜 디테일하게 알아야 우리가 기능을 살릴지 없앨지 판단할거자나"*
//
// ⛔⛔ **왜 코드를 «읽지» 않고 «누르나»** — 2026-09-21 에 BragScreen 버그를 코드로 찾았는데,
//    그건 운이 좋았다. `import` 이름이 `useRef` 에 덮여 `catch` 가 삼키는 꼴이라
//    **코드에 호출이 «있어도» 실제로는 안 나갈 수 있다.** 눌러 봐야 안다(절대원칙 21).
//
// 🛒 **쿠팡은 «절대» 안 연다** — 파트너스 링크로 나가는 길은 route 에서 막는다.
//    📮 창업자 = 「누르는 건 된다. 사는 건 안 된다」이지만, 스크립트가 매번 누르면 클릭이 쌓인다.
//    ⭐ 우리가 알고 싶은 건 「그 단추가 관문을 보내나」이지 「쿠팡이 열리나」가 아니다.
//
// ⭐ 무엇을 잡나 = `gtag('event', 'page_view', {page_title})` ＋ 아이폰 직접 전송(`/g/collect?...&dt=`)
//    둘 다 잡는다. 통로가 둘이라 한쪽만 보면 아이폰 길을 놓친다(`src/stats.js:228·557`).
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
await new Promise((r) => srv.listen(4491, r))

const 브라우저 = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

/** 한 판 = 새 사람 하나를 세워 앱을 끝까지 눌러 본다. */
async function 한판({ 소개봄 }) {
  const ctx = await 브라우저.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
  // 🔬 gtag 를 «가로채» 무엇이 나가는지 모은다 — 진짜 GA4 로는 한 건도 안 보낸다.
  // ⛔⛔ **[2026-09-21 내가 밟은 함정] 이 함수 «안»에서 Node 쪽 변수를 쓰면 안 된다.**
  //    처음에 `if (소개봄)` 을 여기 넣었는데 브라우저엔 그런 변수가 없어 **ReferenceError** 가 났고,
  //    그러면 `window.__관문` 자체가 안 깔려 **모든 걸음이 「관문 0개」로 보였다.**
  //    ＝ 앱이 멀쩡한데 「안 세어진다」고 보고할 뻔했다. 값은 «인자»로 넘긴다.
  await ctx.addInitScript(() => {
    window.__관문 = []
    window.dataLayer = []
    window.gtag = function () {
      try {
        const a = arguments
        if (a[0] === 'event' && a[2] && a[2].page_title) window.__관문.push(String(a[2].page_title))
      } catch { /* noop */ }
    }
    // 🍎 아이폰 직접 전송도 같은 통에 담는다
    navigator.sendBeacon = function (u) {
      try { const m = String(u).match(/[?&]dt=([^&]*)/); if (m) window.__관문.push(decodeURIComponent(m[1])) } catch { /* noop */ }
      return true
    }
  })
  if (소개봄) {
    await ctx.addInitScript(() => {
      try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:cloudgate', '1') } catch { /* noop */ }
    })
    // ⛔⛔ **코치마크를 끄지 않으면 아무것도 못 누른다** — 2026-09-21 에 이걸로 전 걸음이 「못 눌렀다」로 나왔다.
    //    🔢 실측 = 덮개가 «화면 전체»다(position: fixed · inset: 0 · z-index: 500 · 844px).
    //    ⭐ 그건 고장이 아니라 설계다(탭하면 다음 장). 다만 «판»은 넘기고 시작해야 한다.
    const { SEED_COACH_SEEN } = await import('../src/coach.js')
    await ctx.addInitScript(SEED_COACH_SEEN)
  }

  const p = await ctx.newPage()
  p.on('pageerror', () => { /* noop */ })
  // 🛒 쿠팡·스토어로 나가는 길은 «막는다»
  await p.route('**://*.coupang.com/**', (r) => r.abort())
  await p.route('**://link.coupang.com/**', (r) => r.abort())
  await p.route('**://play.google.com/**', (r) => r.abort())
  await p.route('**://apps.apple.com/**', (r) => r.abort())
  await p.route('**://www.googletagmanager.com/**', (r) => r.abort())
  await p.route('**://www.google-analytics.com/**', (r) => r.abort())

  await p.goto('http://127.0.0.1:4491/hankki/', { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(2600)

  // 🔒🔒 **판이 스스로 「내가 제대로 깔렸나」를 확인한다** — ⛔이게 없으면 «내 고장»을 «앱 탓»으로 보고한다.
  //    2026-09-21 에 실제로 그랬다(위 주석). 조용히 실패하는 판은 없는 판이다.
  const 깔렸나 = await p.evaluate(() => Array.isArray(window.__관문) && typeof window.gtag === 'function')
  if (!깔렸나) { await ctx.close(); throw new Error('⛔ 가로채기가 안 깔렸다 — 이 판의 결과는 버린다(앱 문제가 아니다)') }
  // 🔒 화면이 그려졌나 — 아무것도 없는 화면에서 「못 눌렀다」를 세면 그것도 거짓말이다.
  const 글자수 = await p.evaluate(() => (document.body.innerText || '').trim().length)
  if (글자수 < 50) { await ctx.close(); throw new Error(`⛔ 화면이 안 떴다(글자 ${글자수}자) — 이 판의 결과는 버린다`) }

  const 본것 = []
  // ⛔⛔ **앱이 자기 gtag 를 «덮어쓴다»**(stats.js:267 — dataLayer 에 밀어넣는 꼴).
  //    그래서 내 가로채기만 보면 «0개»로 보인다(2026-09-21 에 실제로 그렇게 나왔다).
  //    ✅ 그 대신 dataLayer 를 읽는다 — 앱이 실제로 밀어넣은 자리다.
  const 비우기 = () => p.evaluate(() => {
    const v = window.__관문.slice()
    window.__관문.length = 0
    for (const a of (window.dataLayer || [])) {
      try { if (a && a[0] === 'event' && a[2] && a[2].page_title) v.push(String(a[2].page_title)) } catch { /* noop */ }
    }
    if (window.dataLayer) window.dataLayer.length = 0
    return v
  })
  await 비우기()

  /** 한 걸음 — 누르고, 그 뒤 나간 관문을 적는다. ⛔못 눌렀으면 «못 눌렀다»고 적는다(꾸미지 않는다). */
  // ⛔⛔ **오류를 삼키지 않는다** — 2026-09-21 에 `catch {}` 로 삼켰더니 «내 판의 고장»이
  //    「앱이 안 세어진다」로 보였다. 조용히 실패하는 판은 없는 판이다(§BragScreen 과 같은 뿌리).
  async function 걸음(이름, 누르기, 기다림 = 1100) {
    let 눌렀나 = false, 탈 = ''
    try { 눌렀나 = await 누르기() } catch (e) { 눌렀나 = false; 탈 = String(e && e.message || e).split('\n')[0].slice(0, 110) }
    // 🔎 못 눌렀으면 «무엇이 덮고 있나»를 같이 적는다 — 「못 찾았다」만으로는 판 고장인지 앱 고장인지 못 가른다
    if (!눌렀나) {
      try {
        탈 += ' ‖ 덮개=' + await p.evaluate(() => {
          const el = document.elementFromPoint(195, 422)
          const 이름 = el ? `${el.tagName.toLowerCase()}.${String(el.className || '').split(' ').slice(0, 2).join('.')}` : '없음'
          const 글 = (el && (el.closest('.sheet, .sheet-mask, [role=dialog]') || el).innerText || '').replace(/\s+/g, ' ').slice(0, 70)
          return `${이름} 「${글}」`
        })
      } catch { /* noop */ }
    }
    await p.waitForTimeout(기다림)
    const 나간것 = await 비우기()
    본것.push({ 걸음: 이름, 눌렀나: !!눌렀나, 관문: 나간것, 탈 })
  }
  const 글자눌러 = (re) => async () => {
    const el = p.locator(`text=${re}`).first()
    if (!(await el.count())) return false
    await el.click({ timeout: 2500 })
    return true
  }
  const 탭눌러 = (이름) => async () => {
    const el = p.locator('.nav-item', { hasText: 이름 }).first()
    if (!(await el.count())) return false
    await el.click({ timeout: 2500 })
    return true
  }

  await 걸음('앱 켜자마자', async () => true, 300)
  await 걸음('레시피 탭', 탭눌러('레시피'))
  await 걸음('레시피 하나 열기', async () => {
    // ⛔ 처음엔 `.card, .rec-card` 를, 다음엔 `.album-grid .press` 를 짐작으로 썼다 — 둘 다 «못 눌렀다».
    //    `.album-grid` 는 «일기 앨범» 타일이다. 레시피 탭 타일 = MyRecipesScreen 941줄 `.grid-card > button.press`(openRecipe).
    const el = p.locator('.grid-card .press').first()
    if (!(await el.count())) return false
    await el.scrollIntoViewIfNeeded(); await el.click({ timeout: 2500 }); return true
  }, 1400)
  // 상세의 단추는 글자가 아니라 `data-coach` 로 잡는다(RecipeDetailScreen 649·1236줄) — 글자 매칭은 코치마크 설명문에도 걸린다.
  await 걸음('레꾸(꾸미기) 열기', async () => {
    const el = p.locator('[data-coach="decor"]').first()
    if (!(await el.count())) return false
    await el.scrollIntoViewIfNeeded(); await el.click({ timeout: 2500 }); return true
  }, 1600)
  // ⛔ 처음엔 `p.goBack()` 으로 닫았다 — 그건 «페이지 밖»으로 나가서 뒤 걸음이 전부 빈 화면이 됐다(판 고장 넷째). 앱 안의 「취소」 단추로 닫는다(DecorEditor 1173줄).
  // 🎁 처음 레꾸를 열면 「받은 선물」 시트(GiftPackSheet)가 «먼저» 덮는다 — 판 덮개 실측으로 잡았다(2026-09-21).
  //    ⚠️ 이 시트는 관문이 없다 → 아래 표에 「관문 0개」로 찍히는 게 «맞는» 결과다(설계 문서 §7 에 적는다).
  await 걸음('받은 선물 시트 닫기', async () => {
    const el = p.locator('.sheet button.press', { hasText: /^닫기$/ }).first()
    if (!(await el.count())) return false
    await el.click({ timeout: 2500 }); return true
  }, 800)
  await 걸음('레꾸 닫기(취소)', async () => {
    const el = p.locator('button.press', { hasText: /^취소$/ }).last()
    if (!(await el.count())) return false
    await el.click({ timeout: 2500 }); return true
  }, 900)
  await 걸음('요리 시작', async () => {
    const el = p.locator('[data-coach="cook"]').first()
    if (!(await el.count())) return false
    await el.scrollIntoViewIfNeeded(); await el.click({ timeout: 2500 }); return true
  }, 1600)
  await 걸음('요리모드 닫기', async () => {
    const el = p.locator('[aria-label="닫기"]').first()
    if (!(await el.count())) return false
    await el.click({ timeout: 2500 }); return true
  }, 900)
  await 걸음('상세 닫기(뒤로)', async () => {
    const el = p.locator('[aria-label="뒤로"]').first()
    if (!(await el.count())) return false
    await el.click({ timeout: 2500 }); return true
  }, 900)
  await 걸음('일기 탭', 탭눌러('일기'))
  await 걸음('장보기 탭', 탭눌러('장보기'))
  // ⛔ [2026-09-21 내가 밟은 함정] 처음엔 «제목 글자» 「주부의 장바구니」를 눌렀다 — 그건 아무 단추도 아니라 관문 0개로 «보였다».
  //    진짜 「펼쳐 봤다」는 **카테고리 칩**(`.cur-chips .pill`)을 누르는 것이다(ShopScreen 의 chip()). 기본 칩(pick)이 이미 켜져 있어 «둘째 칩»을 누른다.
  await 걸음('주부의 장바구니 칩 눌러 펼치기', async () => {
    const el = p.locator('.cur-chips .pill').nth(1)
    if (!(await el.count())) return false
    await el.scrollIntoViewIfNeeded(); await el.click({ timeout: 2500 }); return true
  }, 1300)
  await 걸음('사러가기 (쿠팡은 막아둠)', 글자눌러('/사러가기/'), 1300)
  await 걸음('식비 열기', 글자눌러('/식비|이번 달 식비/'), 1300)
  await 걸음('냉장고 열기', 글자눌러('/냉장고|재료함/'), 1300)
  await 걸음('레꾸자랑 탭', 탭눌러('레꾸자랑'))
  await 걸음('자랑할 카드 고르기', async () => {
    const el = p.locator('[aria-label*="자랑하기"]').first()
    if (!(await el.count())) return false
    // ⛔ 첫 판에선 «타임아웃»이었다 — 단추는 있는데 화면 밖(스크롤 아래)이라 못 눌렀다. 「없다」가 아니다.
    await el.scrollIntoViewIfNeeded(); await el.click({ timeout: 2500 }); return true
  }, 1400)
  // 자랑 선택 시트(.sheet-mask)가 탭바를 덮는다 — 닫고 나서 홈을 누른다(⛔안 닫으면 「홈 탭 못 눌렀다」가 «앱 탓»으로 보인다)
  await 걸음('자랑 시트 닫기', async () => {
    const el = p.locator('.sheet-mask').first()
    if (!(await el.count())) return false
    // 시트는 올라오는 «움직임»이 있다 — 그 사이에 누르면 3판 중 1판만 닫혔다. 다 올라온 뒤 마스크 «위쪽 빈자리»를 누른다.
    await p.waitForTimeout(500)
    await el.click({ position: { x: 20, y: 40 }, force: true, timeout: 2500 })
    await p.waitForTimeout(400)
    return !(await p.locator('.sheet-mask').count())
  }, 700)
  await 걸음('홈 탭', 탭눌러('홈'))

  await ctx.close()
  return 본것
}

// 🔁 창업자 = *"시뮬레이션 3번씩 돌리고"* — 같은 길을 세 번 걸어 «들쭉날쭉한 것»을 가려낸다.
const 판들 = []
for (let i = 0; i < 3; i++) 판들.push(await 한판({ 소개봄: true }))

console.log('\n🔬 관문 전수 — 같은 길을 «세 번» 걸었다\n')
const 걸음이름 = 판들[0].map((x) => x.걸음)
for (let i = 0; i < 걸음이름.length; i++) {
  const 셋 = 판들.map((판) => 판[i])
  const 눌린수 = 셋.filter((x) => x.눌렀나).length
  const 모둠 = 셋.map((x) => x.관문.join(',')).join(' | ')
  const 같나 = new Set(셋.map((x) => x.관문.join(','))).size === 1
  const 첫 = 셋[0].관문
  let 표
  if (눌린수 === 0) 표 = '⚪ 못 눌렀다 — ' + (셋[0].탈 || '단추를 못 찾았다')
  else if (첫.length === 0) 표 = '⛔ 관문 0개 — 안 세어진다'
  else 표 = `✅ ${첫.join(' · ')}`
  console.log(`  ${표}`)
  console.log(`     ${걸음이름[i]}   (3판 중 ${눌린수}판 눌림${같나 ? '' : ' · ⚠️들쭉날쭉: ' + 모둠})`)
}

await 브라우저.close()
srv.close()
