// 📸 애플 출시기념 캐러셀에 쓸 «앱 화면» 넉 장 (2026-09-13)
//
// 📮 창업자 = *"이제 아이폰이서도 돼요"* · *"아! 로그인화면도 하나 캐러셀에 넣자"*
// ⛔ 이 파일은 «찍기만» 한다 — 판(캐러셀)은 `_판-애플기념-0913.mjs` 가 만든다.
//    그래야 화면이 바뀌어도 찍기만 다시 돌리면 된다.
//
// ⛔⛔ 찍기 전에 끄는 것 셋 (2026-08-11 사고 — 온보딩 화면을 홈이라고 보냈다)
//    ①온보딩 ②코치마크 ③한가운데를 덮은 것이 있나 확인
import { chromium } from 'playwright'
import { SEED_COACH_SEEN } from '../src/coach.js'
import { createServer } from 'node:http'
import { readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const 여기 = dirname(fileURLToPath(import.meta.url))
const dist = join(여기, '../dist')
const 낼곳 = process.env.OUT || '/tmp/claude-0/애플기념화면'
rmSync(낼곳, { recursive: true, force: true }); mkdirSync(낼곳, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' }
const srv = createServer((req, res) => {
  let p = join(dist, decodeURIComponent(req.url.split('?')[0]).replace(/^\/hankki/, ''))
  if (!existsSync(p) || p.endsWith('/')) p = join(dist, 'index.html')
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' })
  res.end(readFileSync(p))
}).listen(0)
const port = srv.address().port

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || undefined })
// 📱🍎 [창업자 2026-09-13] *"아이폰에서 보이는 화면으로 찍어줘"*
//   ⛔ 그 전엔 411×891(갤럭시)로 찍었다 — 아이폰 출시 캐러셀인데 안드로이드 화면이면 말이 안 된다.
//   🔢 아이폰 14/15/16 기본 = **393×852** · 화면 배율 3배 (애플 공식 기기 해상도 1179×2556 ÷ 3)
//   ⭐ 사파리 사용자문자열까지 아이폰으로 맞춘다 — 화면이 기기를 보고 갈리는 곳이 있으면 같이 따라간다.
const ctx = await b.newContext({
  viewport: { width: 393, height: 852 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
})
// 🍎🔐 [실측 2026-09-13 · 왜 「앱 안」을 판마다 갈라 심나]
//    아이폰 앱 안에선 **로그인해 두지 않으면 홈이 아예 안 뜬다**(App.jsx:111 · 창업자 확정 「로그인 필수」).
//    그리고 이 컨테이너는 구글에 못 나가서 «진짜 로그인»을 할 수가 없다 —
//    표식(`hankki:cloud:on`)을 심어 봐도 `사람지켜보기` 가 「사람 없음 확정」을 주면 문이 다시 덮인다(실측 3판).
//    ✅ 그래서 이렇게 나눈다 —
//       · **5장 로그인** = 「앱 안」으로 심어서 찍는다 (애플 단추가 뜨는 «아이폰만의» 화면이라 이게 주인공)
//       · **나머지** = 심지 않고 찍는다. ⭐화면 크기·사용자문자열은 아이폰 그대로다.
//         ⛔ 속이는 게 아니다 — 로그인을 마친 아이폰 유저가 보는 화면과 «같은 화면»이다.
//            앱 안이냐 아니냐로 갈리는 건 «로그인 문»뿐이고, 그 문은 5장이 이미 보여준다.

// ⭐ 로그인 벽은 «끄지 않고» 그대로 찍는다 — 그게 5장의 주인공이다(확정 설계 · v12.73)
// 🍎🍎 애플 단추는 «아이폰 앱 안»에서만 뜬다 — nativeAuth.js 의 앱안인가() 가
//    window.Capacitor.isNativePlatform() 으로 가른다(실측 · src/nativeAuth.js:19).
//    ⛔ 그냥 찍으면 구글 단추만 나온다. 아이폰 출시 캐러셀인데 애플이 없으면 말이 안 된다.
//    ✅ 그래서 «아이폰 앱에서 열었을 때와 같은 화면»이 되게 그 값을 심는다.
//       ⚠️ 이건 «보이는 것을 속이는 것»이 아니다 — 아이폰에서 실제로 이렇게 보인다.
const 로그인판 = await ctx.newPage()
await 로그인판.addInitScript(() => {
  window.Capacitor = { isNativePlatform: () => true, Plugins: {} }
})
await 로그인판.goto(`http://localhost:${port}/hankki/`)
await 로그인판.waitForTimeout(2000)
await 로그인판.screenshot({ path: join(낼곳, '5-로그인.png') })
console.log('📸 5-로그인')

// ⭐ 나머지 셋은 «로그인을 통과한» 상태라야 보인다 — 시드를 심어 연다
const p = await ctx.newPage()
// ⛔ [2026-09-13] 처음엔 'hankki:coachSeen' 을 심었는데 «그런 키가 없다» — 코치가 그대로 덮였다.
//    ✅ 실측한 진짜 키 = src/coach.js 의 COACH (접두 'hankki:coach:' ＋ home3·myrecipes·…).
//       ⛔ 기억으로 키를 짓지 말 것. 코드에서 읽는다.
//    ⛔⛔ [고침 2] 이름을 손으로 적었더니 **'loginpop2'·'brag' 가 빠져** 로그인 유도 팝업이 화면을 덮었고
//       탭이 눌리지 않았다(Playwright = "intercepts pointer events"). 이름 목록은 반드시 낡는다.
//    ✅ 그래서 coach.js 가 «접두어로» 내보내 주는 조각(SEED_COACH_SEEN)을 그대로 쓴다 — 키가 늘어도 안 낡는다.
await p.addInitScript(SEED_COACH_SEEN)
await p.addInitScript(() => {
  try {
    localStorage.setItem('hankki:onboarded', '1')
    // 🍎 [실측 2026-09-13] **아이폰 앱 안에서는 로그인 전엔 홈이 «아예» 안 뜬다** —
    //    App.jsx:111 `앱안인가() ? !로그인해뒀나() : …` 라서 로그인 벽이 화면을 통째로 덮는다.
    //    그래서 홈·레시피·레꾸자랑을 찍으려면 «로그인을 마친 아이폰 유저» 상태라야 한다.
    //    ⛔ 보이는 것을 속이는 게 아니다 — 로그인하면 아이폰에서 실제로 이 화면이다.
    //    🔑 표식 = cloud.js:123 `hankki:cloud:on` (⛔이름을 지어내지 말 것 · 코드에서 읽었다)
    localStorage.setItem('hankki:cloud:on', '1')
    // ⛔⛔ 심어만 두면 «지워진다» — cloud.js:215 가 파이어베이스에서 「사람 없음」을 받으면
    //    표식을 지운다(이 컨테이너는 구글에 못 나가니 늘 「사람 없음」이 온다 · 실측).
    //    ✅ 그래서 그 칸만 «못 지우게» 막는다 — coach.js 의 SEED_COACH_SEEN 이 쓰는 것과 같은 수법이다.
    const _rm = Storage.prototype.removeItem
    Storage.prototype.removeItem = function (k) {
      if (k === 'hankki:cloud:on') return
      return _rm.call(this, k)
    }
  } catch {}
})
await p.goto(`http://localhost:${port}/hankki/`)
await p.waitForTimeout(2500)
await p.screenshot({ path: join(낼곳, '2-홈.png') })
console.log('📸 2-홈')

// ⭐ 3장(담아두기)·4장(꾸미기) 후보 — ⛔어느 게 나은지는 «열어 보고» 고른다(절대원칙 21)
const 탭찍기 = async (label, 이름) => {
  await p.getByText(label, { exact: true }).first().click()
  await p.waitForTimeout(1800)
  await p.screenshot({ path: join(낼곳, 이름) })
  console.log('📸 ' + 이름)
}
await 탭찍기('레시피', '3a-레시피탭.png')
await 탭찍기('레꾸자랑', '4a-레꾸자랑.png')
// 4장 후보 ②: 「꾸민 표지」가 «한 장으로» 보이는 상세 화면
await p.getByText('꽃게탕', { exact: true }).first().click()
await p.waitForTimeout(2000)
await p.screenshot({ path: join(낼곳, '4b-꾸민표지-상세.png') })
console.log('📸 4b-꾸민표지-상세')

await b.close(); srv.close()
console.log(`\n✅ ${낼곳} 에 찍었다 — ⛔ 반드시 «열어서» 눈으로 볼 것(절대원칙 21)`)
