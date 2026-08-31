// 📸 「한 줄」 한 바퀴가 실제로 도나 — 네 자리를 이어서 찍는다 (2026-08-19)
//
// 📮 창업자 = *"그 한줄도 담에 만들때 바로 보여야 의미가 있는건데"* ·
//    *"약간 포스트잇 붙이듯이. 자동으로 붙여주면 유저는 편하겠지"* ·
//    *"이걸쓰면 비로소 나만의 레시피가 되는거잖아"*
//
// 🔁 한 바퀴 = ①홈 카드 → ②한 줄 쓰는 창 → ③레시피 상세(재료 위) → ④요리 모드(재료 준비)
//    ⭐ ①에서 쓰면 ③④에 «자동으로» 붙어야 한다. 그게 안 되면 이 기능은 반쪽이다.
//
// ⛔ page.reload() ＋ addInitScript 를 안 쓴다(시드가 덮는다 · check-mistakes) — 같은 컨텍스트에 «새 탭»
// ⛔ 저장 JSON 모양을 짐작하지 않는다 — 한 번 띄워 «진짜 저장값»을 읽고 고친다
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
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
await new Promise((r) => srv.listen(4393, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 1500 }, timezoneId: 'Asia/Seoul', deviceScaleFactor: 2 })
const 오류 = []
const 결과 = []
const 새탭 = async () => {
  const p = await ctx.newPage()
  await p.addInitScript(SEED_COACH_SEEN)
  await p.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
  p.on('pageerror', (e) => 오류.push(String(e)))
  await p.goto('http://127.0.0.1:4393/', { waitUntil: 'networkidle' })
  // ⛔ 시간으로 기다리지 않는다 — 저장은 렌더 «뒤»라 800ms 가 모자랄 때가 있다(실제로 null 이 나왔다)
  await p.waitForFunction(() => !!localStorage.getItem('hankki:v1'), null, { timeout: 15000 })
  await p.waitForTimeout(400)
  return p
}

// ── 준비: 「어제·그제·3일 전에 만들고 한 줄은 안 썼다」를 심는다 ──────────
const p0 = await 새탭()
const 심은것 = await p0.evaluate(() => {
  const 하루 = 24 * 60 * 60 * 1000
  const now = Date.now()
  const s = JSON.parse(localStorage.getItem('hankki:v1'))
  const 셋 = s.recipes.slice(0, 3)
  s.diary = 셋.map((r, i) => ({
    id: 'd' + i, recipeId: r.id, title: r.title, source: r.source,
    at: now - (i + 1) * 하루, rating: 0, note: '', photo: null,
  }))
  셋.forEach((r, i) => { r.cooked = 1; r.cookedAt = now - (i + 1) * 하루 })
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  return { 이름들: 셋.map((r) => r.title), 첫id: 셋[0].id }
})
await p0.close()

// ── ① 홈 카드 ─────────────────────────────────────────────
const p1 = await 새탭()
await p1.screenshot({ path: `${OUT}/한바퀴-1-홈.png`, fullPage: true })
const 홈 = await p1.evaluate(() => {
  const 줄 = document.querySelector('.next-row')
  const 카드들 = [...document.querySelectorAll('.next-card')]
  const 첫 = 카드들[0]
  const 읽 = (el, s) => (el?.querySelector(s)?.textContent || '').trim()
  return {
    장수: 카드들.length,
    글: 첫 ? [읽(첫, '.next-label'), 읽(첫, '.next-title'), 읽(첫, '.next-reason'), 읽(첫, '.next-eg'), 읽(첫, '.next-cta')].filter(Boolean).join(' / ') : '(없음)',
    y: 첫 ? Math.round(첫.getBoundingClientRect().top) : -1,
    // ⛔ 첫 칸이 왼쪽으로 잘렸나 — 2026-08-14 테스터 영상 사고(scroll-padding)
    //    ⚠️ 줄의 «테두리»가 아니라 «패딩 안쪽»과 견줘야 한다 — 줄엔 좌우 여백 20px 이 있고
    //       그만큼 떨어져 있는 게 «정상»이다. 첫 판이 그걸 안 빼고 재서 멀쩡한 걸 ⛔로 잡았다(규칙 18 ⓘ).
    첫칸왼쪽: 첫 && 줄 ? Math.round(
      첫.getBoundingClientRect().left - (줄.getBoundingClientRect().left + parseFloat(getComputedStyle(줄).paddingLeft))
    ) : -99,
    // ⭐ 진짜 사고 지표는 이것 — 열자마자 브라우저가 스스로 밀어 놓았나
    밀림: 줄 ? Math.round(줄.scrollLeft) : -1,
    가로넘침: document.documentElement.scrollWidth > window.innerWidth,
  }
})
결과.push(['① 홈 카드', `${홈.장수}장 · y=${홈.y}px · 첫칸왼쪽 ${홈.첫칸왼쪽}px · 밀림 ${홈.밀림} · 가로넘침 ${홈.가로넘침}`, 홈.글])

// ── ② 한 줄 쓰는 창 ───────────────────────────────────────
await p1.click('.next-cta')
await p1.waitForTimeout(600)
await p1.screenshot({ path: `${OUT}/한바퀴-2-쓰는창.png`, fullPage: false })
const 창 = await p1.evaluate(() => {
  const 힌트 = document.querySelector('.oneline-hint')
  const 메모 = document.querySelector('.one-note')
  const 별 = document.querySelector('.sheet svg, .sheet [class*="star"]')
  return {
    안내: 힌트 ? [힌트.querySelector('.oneline-hint-head')?.textContent, 힌트.querySelector('.oneline-hint-sub')?.textContent].filter(Boolean).join(' / ') : '(없음)',
    메모칸: !!메모,
    // 📌 메모칸이 별점보다 «위»에 있나 (창업자 확정 = 별점 안 권한다)
    메모y: 메모 ? Math.round(메모.getBoundingClientRect().top) : -1,
    별y: 별 ? Math.round(별.getBoundingClientRect().top) : -1,
    안내글자: 힌트 ? 힌트.textContent.trim() : '',
  }
})
결과.push(['② 한 줄 쓰는 창', `메모칸 ${창.메모칸 ? '있음' : '⛔없음'} · 메모 y=${창.메모y} · 별점 y=${창.별y} ${창.메모y > 0 && 창.별y > 0 ? (창.메모y < 창.별y ? '(메모가 위 ✅)' : '⛔별점이 위') : ''}`, 창.안내])

// ── ②-b 한 줄을 실제로 쓰고 저장 ──────────────────────────
await p1.fill('.one-note', '간장 반만')
await p1.click('text=저장하기')
await p1.waitForTimeout(700)
const 쓴뒤 = await p1.evaluate(() => {
  const 카드들 = [...document.querySelectorAll('.next-card')]
  const 읽 = (el, s) => (el?.querySelector(s)?.textContent || '').trim()
  return {
    장수: 카드들.length,
    첫제목: 읽(카드들[0], '.next-title'),
    시트열림: !!document.querySelector('.oneline-hint'),
  }
})
await p1.screenshot({ path: `${OUT}/한바퀴-2b-쓴뒤홈.png`, fullPage: false })
결과.push(['②-b 쓰고 난 뒤', `시트 ${쓴뒤.시트열림 ? '⛔안 닫힘' : '닫힘 ✅'} · 카드 ${홈.장수}장 → ${쓴뒤.장수}장`, `맨 앞이 「${쓴뒤.첫제목}」 으로 바뀜`])

// ── ③ 레시피 상세 (재료 위) ───────────────────────────────
const p2 = await 새탭()
await p2.click(`text=${심은것.이름들[0]}`)
await p2.waitForTimeout(900)
const 상세 = await p2.evaluate(() => {
  const 메모 = document.querySelector('.memo-note')
  const 재료 = [...document.querySelectorAll('.sec-head')].find((el) => el.textContent.includes('재료'))
  return {
    붙었나: !!메모,
    글: 메모 ? 메모.textContent.trim().replace(/\s+/g, ' ') : '(없음)',
    메모y: 메모 ? Math.round(메모.getBoundingClientRect().top + window.scrollY) : -1,
    재료y: 재료 ? Math.round(재료.getBoundingClientRect().top + window.scrollY) : -1,
  }
})
await p2.screenshot({ path: `${OUT}/한바퀴-3-상세.png`, fullPage: true })
결과.push(['③ 레시피 상세', `${상세.붙었나 ? '붙음 ✅' : '⛔안 붙음'} · 메모 y=${상세.메모y} · 재료 y=${상세.재료y} ${상세.메모y > 0 && 상세.재료y > 0 ? (상세.메모y < 상세.재료y ? '(재료보다 위 ✅)' : '⛔재료 아래') : ''}`, 상세.글])

// ── ④ 요리 모드 (재료 준비) ───────────────────────────────
await p2.click('text=요리 시작')
await p2.waitForTimeout(900)
const 요리 = await p2.evaluate(() => {
  const 메모 = document.querySelector('.memo-note')
  return {
    붙었나: !!메모,
    글: 메모 ? 메모.textContent.trim().replace(/\s+/g, ' ') : '(없음)',
    화면: (document.querySelector('.cook-stepno')?.textContent || '').trim(),
  }
})
await p2.screenshot({ path: `${OUT}/한바퀴-4-요리모드.png`, fullPage: true })
결과.push(['④ 요리 모드', `${요리.붙었나 ? '붙음 ✅' : '⛔안 붙음'} · 화면 「${요리.화면}」`, 요리.글])

await ctx.close(); await b.close(); srv.close()

console.log('\n🔁 「한 줄」 한 바퀴\n')
for (const [칸, 잰것, 글] of 결과) {
  console.log(`[${칸}] ${잰것}`)
  console.log(`   ${글}\n`)
}
if (오류.length) console.log(`⛔ pageerror ${오류.length}건:`, 오류.slice(0, 3).join(' | '))

const 나쁨 = []
if (홈.장수 !== 3) 나쁨.push(`홈 카드가 ${홈.장수}장(3장이어야)`)
if (홈.첫칸왼쪽 !== 0) 나쁨.push(`첫 칸이 ${홈.첫칸왼쪽}px 어긋남(0이어야 · 2026-08-14 사고)`)
if (홈.가로넘침) 나쁨.push('가로로 넘친다')
if (!창.메모칸) 나쁨.push('쓰는 창에 메모칸이 없다')
if (창.메모y > 0 && 창.별y > 0 && 창.메모y > 창.별y) 나쁨.push('별점이 메모보다 위 (창업자 확정 위반)')
if (쓴뒤.시트열림) 나쁨.push('저장했는데 시트가 안 닫힘')
if (쓴뒤.장수 !== 홈.장수 - 1) 나쁨.push(`쓰고 났는데 카드가 안 줄었다(${홈.장수}→${쓴뒤.장수})`)
if (!상세.붙었나) 나쁨.push('레시피 상세에 메모가 안 붙었다')
if (상세.메모y > 상세.재료y) 나쁨.push('상세에서 메모가 재료보다 아래')
if (!요리.붙었나) 나쁨.push('요리 모드 재료 준비에 메모가 안 붙었다')
if (오류.length) 나쁨.push(`pageerror ${오류.length}건`)

console.log(나쁨.length ? `⛔ ${나쁨.length}건\n   · ${나쁨.join('\n   · ')}` : '✅ 한 바퀴가 돈다 — 쓰면 사라지고, 다음에 만들 때 붙는다')
process.exit(나쁨.length ? 1 : 0)
