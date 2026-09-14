#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// 🔐 눈 시험판 「이 열쇠를 한끼 앱에도 넣기」 단추 — 2026-09-01
//
// 📮 창업자 = *"열쇠 자리에 FOUNDER_SECRET 값?? 이게 뭔지모르겠어"* → *"아까그값?? 그게 뭔지 모르겠어"* → *"만들어줘"*
//
// ⭐⭐ **이 판의 심장 = 「`localStorage` 에 «진짜로» 들어갔나」**
//    ⛔ 소스를 grep 하면 «주석에 적어둔 열쇠 이름»까지 걸려 고쳐놓고도 통과한다(규칙 18 ⓘ).
//    ⛔ 「단추가 보인다」도 아니다 — 보이는데 아무 일도 안 하는 단추를 우리는 이미 만든 적이 있다.
//       그래서 **눌러 보고 저장소를 읽는다.**
//
// 🧷 왜 이게 값이 있나 = 이 열쇠 하나가 셋을 정한다(전부 실측)
//    ① `?quota=1` 이 창업자/유저를 갈라 센다(worker-tidy.js:219 · src/tidy.js:81)
//    ② AI 실패 이유를 창업자 화면에 보여준다(App.jsx:555 `if (tidyFounder())`)
//    ③ OCR 열쇠 무제한(src/ocr.js:66~69)
//    📌 2026-09-01 실물 = 창업자가 담은 것이 `창업자:0 · 유저:1` 로 셌고, AI 실패 알림도 안 떴다.
//
// ⛔ 이름을 바꾸면 안 되는 것 = `hankki:founder` — 앱 세 곳이 이 이름으로만 읽는다.
// ═══════════════════════════════════════════════════════════════
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
await new Promise((r) => srv.listen(4641, r))

let 통과 = 0, 실패 = 0
const ok = (m, v) => { console.log('  ✅ ' + m + (v !== undefined ? '  ' + v : '')); 통과++ }
const no = (m, v) => { console.log('  ⛔ ' + m + (v !== undefined ? '  ' + v : '')); 실패++ }
const 잰다 = (조건, m, v) => (조건 ? ok(m, v) : no(m, v))

console.log('\n🔐 눈 시험판 → 한끼 앱 열쇠 넘기기\n')

const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 390, height: 844 } })
const 오류 = []
page.on('pageerror', (e) => 오류.push(String(e && e.message || e)))

await page.goto('http://127.0.0.1:4641/hankki/vision-test.html', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(400)

const 앱열쇠 = () => page.evaluate(() => { try { return localStorage.getItem('hankki:founder') } catch { return '__막힘__' } })
const 알림 = () => page.locator('#알림').innerText()

// ── ① 단추가 «있나» (여기서 죽으면 뒤가 다 헛것이다) ──────────────
console.log('  ── ① 단추가 화면에 있나 ──')
const 넣기 = page.locator('#앱에넣기')
const 빼기 = page.locator('#앱에서빼기')
잰다(await 넣기.count() === 1, '①-1 「한끼 앱에도 넣기」 단추가 있다')
잰다(await 빼기.count() === 1, '①-2 「한끼 앱에서 빼기」 단추가 있다')
잰다(await 넣기.isVisible(), '①-3 눈에 보인다(숨어 있지 않다)')
const 안내첫판 = await page.locator('#앱열쇠').innerText()
잰다(/앱에 열쇠 없음/.test(안내첫판), '①-4 처음엔 「앱에 열쇠 없음」이라 말해준다', 안내첫판.slice(0, 40))

// ── ② ⭐빈 열쇠로 누르면 «안 덮는다» (규칙 18 ⓙ) ────────────────
//   먼저 앱에 열쇠를 심어두고, 빈 칸으로 눌러 «살아남나»를 본다.
console.log('  ── ② 빈 값으로 «덮지» 않는다 ──')
await page.evaluate(() => localStorage.setItem('hankki:founder', '먼저있던열쇠'))
await page.fill('#key', '')
await 넣기.click()
await page.waitForTimeout(150)
잰다(await 앱열쇠() === '먼저있던열쇠', '②-1 ⭐빈 칸으로 눌러도 «있던 열쇠가 그대로»다')
잰다(/먼저 넣어줘/.test(await 알림()), '②-2 왜 안 넣었는지 화면에 말한다')

// ── ③ 진짜로 들어가나 ──────────────────────────────────────────
console.log('  ── ③ localStorage 에 «진짜로» 들어가나 ──')
const 열쇠값 = 'TESTKEY_' + 'x'.repeat(24)
await page.fill('#key', 열쇠값)
await 넣기.click()
await page.waitForTimeout(150)
잰다(await 앱열쇠() === 열쇠값, '③-1 ⭐⭐앱 열쇠칸(`hankki:founder`)에 그 값이 들어갔다')
const 안내 = await page.locator('#앱열쇠').innerText()
잰다(/앱에 들어 있어요/.test(안내), '③-2 「들어 있어요」로 바뀐다', 안내.slice(0, 40))
잰다(!안내.includes(열쇠값), '③-3 ⛔값 자체는 화면에 «안» 띄운다')
잰다(!(await 알림()).includes(열쇠값), '③-4 ⛔알림에도 값이 안 샌다')

// ── ④ 앞뒤 공백을 떼고 넣나 (9/1 아침 unauthorized 사고의 그 자리) ──
console.log('  ── ④ 붙여넣기 공백을 떼고 넣나 ──')
await page.fill('#key', '  ' + 열쇠값 + '​ ')
await 넣기.click()
await page.waitForTimeout(150)
잰다(await 앱열쇠() === 열쇠값, '④-1 ⭐앞뒤 빈칸·보이지 않는 글자를 떼고 넣는다')

// ── ⑤ 빼기 ────────────────────────────────────────────────────
console.log('  ── ⑤ 다시 뺄 수 있나 ──')
await 빼기.click()
await page.waitForTimeout(150)
잰다(await 앱열쇠() === null, '⑤-1 앱에서 지워진다')
const 뺀뒤 = await page.locator('#key').inputValue()
잰다(뺀뒤.trim().length > 0, '⑤-2 ⭐시험판 «자기» 열쇠는 그대로 남는다(여기서 계속 시험한다)')
잰다(/앱에 열쇠 없음/.test(await page.locator('#앱열쇠').innerText()), '⑤-3 안내가 「없음」으로 돌아온다')

// ── ⑥ 이름이 앱과 «같은 말»인가 ────────────────────────────────
//   ⛔ 여기만 grep 이다 — 앱 소스는 브라우저로 못 재는 자리라서.
console.log('  ── ⑥ 앱이 읽는 이름과 같나 ──')
const 앱소스 = ['src/App.jsx', 'src/tidy.js', 'src/ocr.js'].map((f) => readFileSync(join(ROOT, f), 'utf8')).join('\n')
잰다((앱소스.match(/hankki:founder/g) || []).length >= 3, '⑥-1 앱 세 파일이 `hankki:founder` 로 읽는다')

// ── ⑦ 📊 통 보기 단추 (2026-09-01) ──────────────────────────────
//   📮 창업자 = *"어떻게 하는지 알려주면 할게 «간단히 말하면 모르겠어»"*
//   ⭐⭐ 이 칸의 심장 = **「완성된 주소가 화면에 안 나오나」** — 나오면 캡처 한 장에 열쇠가 샌다.
//      ⛔ 「단추가 있다」가 아니다. 단추는 있는데 주소를 띄우면 그게 더 나쁘다.
console.log('  ── ⑦ 통 보기 단추 ──')
const 통열쇠 = 'TESTKEY_' + 'q'.repeat(20)
const 부른주소 = []
// ⭐ 진짜 워커를 부르지 않는다 — 가로채서 «무엇을 불렀나»를 본다(절대원칙 30: 흉내가 아니라 실제 요청을 잰다)
await page.route('https://hankki-ocr.annyeong-hankki.workers.dev/**', (route) => {
  부른주소.push(route.request().url())
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ 웰컴: 30, 매월: 5 }) })
})
await page.route('https://hankki-tidy.annyeong-hankki.workers.dev/**', (route) => {
  부른주소.push(route.request().url())
  route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'unauthorized' }) })
})

잰다(await page.locator('#통OCR').count() === 1 && await page.locator('#통AI').count() === 1, '⑦-1 통 보기 단추 둘이 있다')

// 👁👁 **글자가 «스쳐 지나가는» 것까지 잡는다** — ⛔여기서 한 번 틀렸다(2026-09-01).
//   첫 판은 다 끝난 «뒤»에 화면 글자를 한 번 읽었는데, 주소를 「보는 중…」에 띄워도
//   곧 답으로 덮여서 **초록불이 그대로 나왔다**(규칙 18 ⓘ — 통과했는데 아무것도 안 쟀다).
//   ✅ 그래서 «지켜본다» — 바뀔 때마다 글자를 모아 두고, 그 «전부»에서 열쇠를 찾는다.
await page.evaluate(() => {
  window.__본글자 = []
  const 모으기 = () => { try { window.__본글자.push(document.body.innerText) } catch {} }
  모으기()
  new MutationObserver(모으기).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true })
})

// ⑦-2 ⭐빈 열쇠로 누르면 «부르지도 않는다» (401 만 받고 끝날 요청을 아예 안 만든다)
await page.fill('#key', '')
await page.locator('#통OCR').click()
await page.waitForTimeout(200)
잰다(부른주소.length === 0, '⑦-2 ⭐열쇠가 비면 «부르지 않는다»')
잰다(/열쇠.*채워/.test(await page.locator('#통결과').innerText()), '⑦-3 왜 안 불렀는지 말해준다')

// ⑦-4 열쇠를 넣고 누르면 «부르고», 주소에 열쇠가 실린다
await page.fill('#key', 통열쇠)
await page.locator('#통OCR').click()
await page.waitForTimeout(400)
잰다(부른주소.length === 1 && 부른주소[0].includes('quota=1') && 부른주소[0].includes(통열쇠), '⑦-4 quota=1 ＋ 열쇠를 실어 부른다')

// ⑦-5 ⭐⭐ 이 판의 심장 — 화면에 그 주소·열쇠가 «한 순간도» 안 보였다
//   ⛔ 「지금 안 보인다」가 아니라 «지켜본 동안 한 번도 안 보였다»를 잰다
const 본글자 = await page.evaluate(() => (window.__본글자 || []).join('\n'))
잰다(본글자.length > 0, '⑦-5a 지켜보기가 «실제로 돌았다»(글자를 모았다)', 본글자.length + '자')
잰다(!본글자.includes(통열쇠), '⑦-5 ⭐⭐열쇠가 화면에 «한 순간도» 안 떴다')
잰다(!본글자.includes('quota=1'), '⑦-6 ⭐⭐완성된 주소가 화면에 «한 순간도» 안 떴다')
잰다(/웰컴/.test(await page.locator('#통결과').innerText()), '⑦-7 답(JSON)은 보여준다')
잰다(await page.locator('#통결과 button').count() === 1, '⑦-8 「이 답 복사하기」 단추가 붙는다')

// ⑦-9 401 이면 «열쇠가 틀렸다»고 갈라 말한다 (「안 된다」와 처방이 다르다)
await page.locator('#통AI').click()
await page.waitForTimeout(400)
잰다(/열쇠가 안 맞아/.test(await page.locator('#통결과').innerText()), '⑦-9 401 을 「열쇠가 안 맞아」로 가른다')

잰다(오류.length === 0, '⑥-2 페이지 오류 0개', 오류.join(' / ').slice(0, 120))

await b.close(); srv.close()
console.log('\n' + (실패 ? `⛔ ${실패}칸 실패 (통과 ${통과})` : `✅ ${통과}/${통과} 통과`) + '\n')
process.exit(실패 ? 1 : 0)
