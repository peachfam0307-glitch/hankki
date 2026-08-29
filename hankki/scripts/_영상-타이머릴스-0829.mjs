// 🎬⏱ **4화 「요리 타이머 폭발물 처리반」 — 앱 실사 구간 녹화**
//
// 📮 창업자 2026-08-29 = *"요리모드를 인스타에 올리면좋겠어. 영상만들어서"* → *"4화부터 하자."*
//    ＋ *"화면이 움직일수도있어??"* → **된다. 이게 그 답이다.**
//
// ⭐⭐ **릴스의 심장 = 「다른 화면으로 나가도 타이머가 계속 돈다」**
//    사진으론 절대 못 보여준다 — 그래서 릴스를 쓸 이유가 여기 있다.
//    🔢 근거 = `App.jsx:619` 의 `<TimerBar>` 가 **화면 밖(App 최상단)** 에 있어
//       탭을 옮겨도 따라온다. `timer.jsx:3` 주석 = *"화면을 옮겨다녀도 유지된다"*
//
// ⛔⛔ **「여러 타이머를 한 번에」는 절대 쓰지 않는다** — 사실이 아니다.
//    `timer.jsx:79` = `useState(null)` → 타이머는 «하나»고 새로 켜면 앞의 것을 덮어쓴다.
//    2026-08-20 시안 ⑯ 이 정확히 이 문구로 죽었다. **깔았다 안 되면 리뷰에 박힌다.**
//
// ✅ 우리가 «진짜로» 보여줄 수 있는 것 넷 (전부 코드로 확인된 것)
//    ① 전역 — 화면을 옮겨도 유지 ② 진동 ③ 알림 소리 다섯을 골라 미리 들어본다
//    ④ 요리하는 동안 화면이 안 꺼진다(`useWakeLock`)
//    ⭐ 이 중 **①만 영상으로 증명된다**(②③④는 화면에 안 보인다) → ①에 6초를 다 쓴다
//
// 실행: node /home/user/hankki/hankki/scripts/_영상-타이머릴스-0829.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, renameSync, readdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/릴스'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(0, r))   // ⛔ 포트를 손으로 박지 않는다
const PORT = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

// 📐 9:16 세로 — 인스타 릴스 규격(1080×1920 의 절반인 540×960 로 찍고 2배 스케일)
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  recordVideo: { dir: OUT, size: { width: 390, height: 844 } },
})
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
const p = await ctx.newPage()

const 컷 = []
const 찍기 = async (이름) => { await p.screenshot({ path: `${OUT}/${String(컷.length).padStart(2, '0')}-${이름}.png` }); 컷.push(이름) }

await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)
for (let i = 0; i < 3; i++) {   // 새 소식 팝업 치우기
  if (!(await p.locator('.sheet-mask').count())) break
  await p.keyboard.press('Escape'); await p.waitForTimeout(400)
}

console.log('\n🎬 4화 타이머 — 앱 실사 녹화\n')

// ── ① 레시피 상세로 (요리모드 버튼이 있는 편) ──
await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click().catch(() => {})
await p.waitForTimeout(1000)
const 카드 = p.locator('.screen button, .screen [role="button"], .screen a').filter({ hasText: /[가-힣]/ })
let 들어감 = false
for (let i = 0; i < Math.min(await 카드.count(), 14); i++) {
  await 카드.nth(i).click().catch(() => {}); await p.waitForTimeout(800)
  if (await p.locator('[data-coach="cook"]').count()) { 들어감 = true; break }
  await p.goBack().catch(() => {}); await p.waitForTimeout(600)
}
if (!들어감) { console.error('✗ 요리모드 버튼이 있는 레시피를 못 찾았다'); await b.close(); srv.close(); process.exit(1) }
await p.waitForTimeout(900)
await 찍기('상세')

// ── ② 요리모드 시작 ──
await p.locator('[data-coach="cook"]').click()
await p.waitForTimeout(1400)
await 찍기('요리모드')

// 재료 준비 → 첫 조리 걸음
await p.evaluate(() => [...document.querySelectorAll('.cook-navbtn')].find((x) => /시작 →|다음 →/.test(x.innerText || ''))?.click())
await p.waitForTimeout(1100)
await 찍기('첫걸음')

// ── ③ 타이머 열기 ──
// ⛔ 요리 모드 안의 버튼 글자는 **「이 단계 타이머 맞추기」** 다(`CookScreen.jsx:197`).
//    첫 판이 `/^타이머$/` 로 찾다 못 찾고, 느슨한 폴백이 «가려진» 다른 것을 눌러 30초를 헛돌았다.
//    ⭐ 상세 화면의 「타이머」 버튼과 «다른 것»이다 — 화면마다 이름이 다르다(규칙 18).
await p.evaluate(() => [...document.querySelectorAll('button')]
  .find((x) => /단계 타이머 맞추기/.test(x.innerText || ''))?.click())
await p.waitForTimeout(1300)
await 찍기('타이머시트')

// ── ④ 시간 고르고 시작 ──
//    ⛔ 버튼 글자를 모르니 «있는 것»을 찍어 두고 고른다(규칙 18 — 없다고 단정하지 않는다)
const 시트단추 = await p.evaluate(() => [...document.querySelectorAll('.sheet button')].map((x) => (x.innerText || '').trim()).filter(Boolean))
console.log('  · 타이머 시트 단추 =', 시트단추.join(' / '))
// ⛔ 첫 판은 «첫 매치»를 눌러 **1분**이 걸렸고, 흐름이 20초쯤 걸려 마지막 컷에선
//    이미 「시간 다 됐어요」가 떠 있었다 → «도는 중»이 안 보인다.
// ✅ **10분**을 콕 집는다 — 릴스 내내 숫자가 줄어드는 게 보인다.
await p.evaluate(() => {
  const bs = [...document.querySelectorAll('.sheet button')]
  const 십분 = bs.find((x) => /^\s*10\s*분\s*$/.test(x.innerText || ''))
  const 아무분 = bs.find((x) => /^\s*\d+\s*분\s*$/.test(x.innerText || ''))
  ;(십분 || 아무분 || bs[0])?.click()
})
await p.waitForTimeout(700)
await 찍기('시간고름')
await p.evaluate(() => [...document.querySelectorAll('.sheet button')].find((x) => /시작|맞추기|확인/.test(x.innerText || ''))?.click())
await p.waitForTimeout(1200)
await 찍기('타이머시작')

// 시트 닫기
for (let i = 0; i < 2; i++) {
  if (!(await p.locator('.sheet-mask').count())) break
  await p.keyboard.press('Escape'); await p.waitForTimeout(500)
}
await p.waitForTimeout(800)
await 찍기('요리모드-타이머돎')

// ── ⑤ ⭐⭐ 심장 — 다른 화면으로 나가도 타이머가 따라온다 ──
await p.goBack().catch(() => {})
await p.waitForTimeout(1200)
await 찍기('상세인데-타이머가-따라옴')

// ⛔⛔ **상세 화면엔 하단바가 없다**(액션바 「요리모드 시작 / 만들었어요」만 있다) —
//    첫 판이 여기서 홈 탭을 눌렀다고 «이름만» 붙이고 실제론 상세에 머물렀다.
//    📌 파일 이름이 사실과 다르면 나중에 그걸 근거로 오해한다(규칙 18).
// ✅ 한 번 더 뒤로 나가 «목록»으로 → 거기서 하단바를 쓴다.
await p.goBack().catch(() => {})
await p.waitForTimeout(1000)
await 찍기('목록인데도-따라옴')

const 탭으로 = async (이름) => {
  const t = p.locator('.bottom-nav .nav-item').filter({ hasText: 이름 }).first()
  if (!(await t.count())) { console.log(`  ⚠️ 하단바에서 「${이름}」을 못 찾았다`); return false }
  await t.click().catch(() => {}); await p.waitForTimeout(1600); return true
}
if (await 탭으로('홈')) await 찍기('홈인데도-타이머가-따라옴')
if (await 탭으로('장보기')) await 찍기('장보기인데도-따라옴')

// 타이머 바가 «진짜로» 떠 있나 — 화면으로 확인(규칙 18 ⓘ)
const 바 = await p.evaluate(() => {
  const t = document.querySelector('.timer-bar')
  if (!t) return null
  const r = t.getBoundingClientRect()
  return { 글자: (t.innerText || '').replace(/\s+/g, ' ').trim(), 보이나: r.width > 0 && r.height > 0, y: Math.round(r.top) }
})
console.log('  · 타이머 바 =', 바 ? `「${바.글자}」 (보임 ${바.보이나} · y=${바.y})` : '⛔ 못 찾았다')

await p.waitForTimeout(1200)
const 영상 = await p.video()?.path()
await ctx.close()      // ⛔ 이걸 해야 영상 파일이 닫힌다
await b.close(); srv.close()

if (영상) {
  const 새이름 = join(OUT, '4화-타이머-앱실사.webm')
  try { renameSync(영상, 새이름) } catch {}
  console.log(`\n🎥 영상 = ${새이름}`)
}
console.log(`🖼 낱장 ${컷.length}컷 = ${OUT}`)
console.log(`   ${컷.join(' → ')}\n`)
if (!바?.보이나) { console.error('⛔ 타이머 바가 안 보인다 — 릴스의 심장이 안 찍혔다'); process.exit(1) }
console.log('✅ 「다른 화면으로 나가도 타이머가 따라온다」가 화면으로 찍혔다\n')
