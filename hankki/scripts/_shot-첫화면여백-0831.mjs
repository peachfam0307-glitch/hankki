// 🕳📸 로그인 첫 화면(CloudGate) 「위가 휑하다」 — 시안 다섯 판을 «진짜 앱에서» 찍고 잰다 — 2026-08-31
//
// 📮 창업자 = *"위에 좀 휑한데 뭘 넣자니 지저분할 것 같고 어떻게 해야?"*
//
// ⛔ CSS 를 새로 심지 않는다(절대원칙 30) — 화면에 «이미 있는» 곰펭 그림의 `width` · `margin` 만
//    갈아끼운다. 그래서 여기서 나온 숫자가 곧 `CloudGate.jsx` 한 줄을 고쳤을 때의 숫자다.
//
// ⭐ 지렛대 = 「곰펭 ↔ 글자 사이 간격」(지금 34px). 그것만 벌리면 곰펭이 위로 올라가고
//    단추는 제자리 → **새로 넣는 요소가 0개**라 창업자 걱정(*"지저분"*)이 구조적으로 안 생긴다.
//
// 재는 것 = ①위 빈 자리 ②곰펭 표시 폭 ③3배 화면 기준 배율(1.0 밑이면 흐려진다)
//          ④단추가 아래에서 몇 px(엄지 자리 · 8/21 확정을 깨면 안 된다)
//          ⑤「자세히」를 편 상태에서 위가 잘리지 않나(주석에 박힌 `flex-end` 함정)
//
// 쓰기 = node scripts/_shot-첫화면여백-0831.mjs        (기본 412px)
//        POLS=360,320 node scripts/_shot-첫화면여백-0831.mjs   (작은 폰까지)
import { chromium } from 'playwright'
import http from 'node:http'
import { readFileSync, statSync, mkdirSync } from 'node:fs'
import { extname, join } from 'node:path'
import { SEED_COACH_SEEN } from '../src/coach.js'

const ROOT = '/home/user/hankki/hankki/dist'
const 낼곳 = '/tmp/login-gap'
mkdirSync(낼곳, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json' }
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p.startsWith('/hankki/')) p = p.slice(7)
  const f = join(ROOT, p === '/' ? 'index.html' : p)
  try { statSync(f); res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)) }
  catch { res.writeHead(404); res.end('nope') }
})
await new Promise((r) => srv.listen(4631, r))

// 원본 곰펭 = 760×649 (src/assets/sharepool/duo_hi.png)
const 원본폭 = 760
// ⛔⛔ `maxWidth` 를 같이 안 주면 «폭을 키워도 안 커진다» — 62% 가 먼저 걸린다.
//    412px 화면에서 안쪽 폭 364px × 62% = 225.7px → `width: 240` 을 줘도 **226px** 로 잘린다.
//    첫 판이 그렇게 나와서 이 줄을 붙였다(재고 나서야 알았다).
const 판들 = [
  { id: 'plate0', 이름: '0-지금',        폭: 210, 최대: '62%', 간격: 34,  가운데: false, 왜: '견줄 바닥' },
  { id: 'plate1', 이름: '가-간격만',      폭: 210, 최대: '62%', 간격: 110, 가운데: false, 왜: '⭐넣는 것 0개 — 간격 하나로 얼마나 주나' },
  { id: 'plate2', 이름: '나-간격＋곰펭',   폭: 240, 최대: '66%', 간격: 110, 가운데: false, 왜: '안전선(240)까지 키우고 간격도' },
  { id: 'plate3', 이름: '다-많이',        폭: 240, 최대: '66%', 간격: 170, 가운데: false, 왜: '더 벌리면 오히려 흩어지나' },
  { id: 'plate4', 이름: '라-가운데',      폭: 210, 최대: '62%', 간격: 34,  가운데: true,  왜: '8/21 에 접은 안 — 왜 접었는지 눈으로 다시' },
]
const 폭들 = (process.env.POLS || '412').split(',').map((n) => +n)
const 화면높이 = +(process.env.HEIGHT || 915)   // ⭐작은 폰(640·740)으로 낮추면 「자세히」 넘침을 실제로 겪는다

const b = await chromium.launch()
const errs = []
let 나쁨 = 0

for (const 화면폭 of 폭들) {
  console.log(`\n════ 화면 ${화면폭}×${화면높이} ════`)
  for (const 판 of 판들) {
    const ctx = await b.newContext({ viewport: { width: 화면폭, height: 화면높이 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    await ctx.route('**/*.googleapis.com/**', (r) => r.abort())
    await ctx.route('**/*.gstatic.com/**', (r) => r.abort())
    const pg = await ctx.newPage()
    pg.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message))
    await pg.addInitScript(SEED_COACH_SEEN)
    await pg.goto('http://localhost:4631/hankki/', { waitUntil: 'domcontentloaded' })
    await pg.waitForTimeout(1500)

    // ⛔ «도착했나»를 먼저 잰다 — 안 온 화면에선 아무것도 못 재는데 숫자는 초록불로 나온다(규칙 18 ⓘ)
    const 글 = await pg.textContent('body')
    if (!/Google 계정으로 시작하기/.test(글)) {
      console.log(`⛔ ${판.이름} — 로그인 첫 화면에 못 갔다. 본문 = ${글.slice(0, 120)}`)
      나쁨++; await ctx.close(); continue
    }

    // ── 판 얹기 = «이미 있는» 값만 갈아끼운다 ──────────────────────────
    await pg.evaluate(({ 폭, 최대, 간격, 가운데 }) => {
      const img = document.querySelector('img[src*="duo_hi"]')
      const 뿌리 = img.parentElement
      img.style.width = 폭 + 'px'
      img.style.maxWidth = 최대
      if (가운데) { 뿌리.style.justifyContent = 'center'; img.style.margin = `0 auto ${간격}px` }
      else { 뿌리.style.justifyContent = 'flex-start'; img.style.margin = `auto auto ${간격}px` }
    }, 판)
    await pg.waitForTimeout(250)

    const 잰것 = await pg.evaluate(() => {
      const img = document.querySelector('img[src*="duo_hi"]')
      const r = img.getBoundingClientRect()
      const 뿌리 = img.parentElement
      const 단추 = [...뿌리.querySelectorAll('button')].find((b) => /Google 계정으로 시작하기/.test(b.textContent))
      const br = 단추.getBoundingClientRect()
      // ⛔ 화면 «전체»에서 「한끼」를 찾으면 뒤에 깔린 화면의 글자를 집는다(첫 판이 다섯 판 다 18px 로 나왔다)
      const 제목 = [...뿌리.querySelectorAll('div')].find((d) => d.textContent.trim() === '한끼')
      return {
        위빈자리: Math.round(r.top), 곰펭폭: Math.round(r.width), 곰펭높이: Math.round(r.height),
        곰펭아래: Math.round(r.bottom),
        제목위: 제목 ? Math.round(제목.getBoundingClientRect().top) : -1,
        단추아래에서: Math.round(window.innerHeight - br.bottom),
        단추위: Math.round(br.top),
      }
    })
    const 배율 = (원본폭 / (잰것.곰펭폭 * 3)).toFixed(2)   // 갤럭시 = 화면 배율 3배
    await pg.screenshot({ path: `${낼곳}/${판.id}.png` })

    // ── 「자세히」를 펴면 위가 잘리나 ────────────────────────────────
    // ⛔ `getByText` 는 «단추 안의 글자 div»를 집는다 → 부모가 클릭을 가로챈다(규칙 18 ⓘ).
    // ⛔⛔ 그리고 화면 «전체»에서 찾으면 안 된다 — 설정의 「클라우드 저장」 시트에 **같은 글자의 단추**가
    //    또 있어서, 첫 판이 그걸 눌러 엉뚱한 시트를 열어놓고 「안 넘침 ✅」이라 찍었다.
    //    **PNG 를 열어보고서야 알았다**(절대원칙 21 · 숫자만 봤으면 못 잡는다). → «이 화면의» 그 단추를 콕 집는다.
    await pg.evaluate(() => {
      const img = document.querySelector('img[src*="duo_hi"]')
      const b = [...img.parentElement.querySelectorAll('button')].find((x) => /로그인하면 새 폰에서도/.test(x.textContent))
      b.click()
    })
    await pg.waitForTimeout(450)
    const 편뒤 = await pg.evaluate(() => {
      const img = document.querySelector('img[src*="duo_hi"]')
      const 뿌리 = img.parentElement
      const 위 = Math.round(img.getBoundingClientRect().top)
      // 굴려서 맨 위로 갈 수 있나 — flex-end 함정은 «굴려도 못 올라간다»
      뿌리.scrollTop = 0
      const 굴린뒤위 = Math.round(img.getBoundingClientRect().top)
      return { 넘침: 뿌리.scrollHeight > 뿌리.clientHeight + 1, 위, 굴린뒤위, 굴림값: 뿌리.scrollTop }
    })
    await pg.screenshot({ path: `${낼곳}/${판.id}-open.png` })
    const 잘렸나 = 편뒤.굴린뒤위 < -1

    console.log(
      `${잘렸나 ? '⛔' : '✅'} ${판.이름.padEnd(9)} ` +
      `위빈자리 ${String(잰것.위빈자리).padStart(3)}px · 곰펭 ${잰것.곰펭폭}×${잰것.곰펭높이} · 배율 ${배율}배 · ` +
      `제목위 ${잰것.제목위}px · 단추 아래에서 ${잰것.단추아래에서}px · ` +
      `자세히 펴면 ${편뒤.넘침 ? `넘침(위 ${편뒤.굴린뒤위}px)` : '안 넘침'}`
    )
    if (배율 < 1) console.log(`   ⚠️ 배율이 1.0 밑이다 — 3배 화면에서 흐려진다`)
    if (잘렸나) 나쁨++
    await ctx.close()
  }
}

console.log(`\n판 = ${낼곳}/plate0~4.png ＋ plate0~4-open.png(「자세히」 편 것)`)
console.log('자바스크립트 오류 = ' + (errs.length ? errs.join(' / ') : '0'))
await b.close(); srv.close()
process.exit(errs.length || 나쁨 ? 1 : 0)
