// 🏪🏪 스토어 스크린샷 v4 — **앱 안의 온보딩을 그대로 찍는다** (2026-08-16)
//
// 📮 창업자 = *"우리 패드에도 되니까 만들어야해"* · *"**온보드가 최신이니까 참고해서 만들어**"*
//
// ⭐⭐⭐ 왜 이게 v3 보다 나은가 — **v3 의 «뿌리»를 없앤다**
//   v3 주석이 스스로 이렇게 적어놨다:
//     *"여섯 다 뿌리가 같다 — **스샷을 앱 밖에서 따로 그려서 앱이 바뀌어도 안 따라온다.**"*
//   그런데 v3 도 앱 «밖»에서 HTML 로 그렸다. 그래서 또 낡았다 —
//     · 「218종」이 386컷으로 (그 자리가 88 → 218 → 386 으로 **두 번** 낡았다)
//     · **일기가 없다**(v9.94 에 생겼는데 v3 는 7/31 판)
//     · 요리 모드 상세 꾸미기가 없다(v10.03)
//   ✅ **온보딩은 앱 «안»이다.** 앱이 바뀌면 온보딩도 같이 바뀌고, 스샷도 따라온다.
//
// ⭐ 규격이 이미 맞는다 — `Onboarding.jsx:59` = *"1080×1920 스테이지 … (스샷 디자인 픽셀 그대로)"*
//   `Stage` 가 `zoom: scale` 로 축소해 보여줄 뿐, 원본은 **1080×1920**.
//   `fit()` = `min(innerWidth/1080, innerHeight*0.82/1920)` 이므로
//   **뷰포트를 1080×2342 로 두면 scale ≈ 1** 이 되어 축소가 풀린다. ＋`deviceScaleFactor:2` = 2160×3840.
//
// 📐 Play 규격(콘솔 실물 2026-08-16) = PNG/JPEG · 장당 최대 8MB · **비율 16:9 «또는» 9:16**
//   · 휴대전화 = 320~3840px  · 7인치 태블릿 = 320~3840px  · 10인치 태블릿 = **1080~7680px**
//   ⭐ 그래서 **2160×3840 한 벌로 셋 다 올라간다**(10인치의 1080 하한도 넘는다).
//
// 실행: node design/promo/스토어스샷-2507/scripts/store_v4_onboarding.mjs
import fs from 'node:fs'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import pw from '/home/user/hankki/hankki/node_modules/playwright-core/index.js'
const { chromium } = pw

const H = '/home/user/hankki/hankki'
const DIST = `${H}/dist`
const OUT = `${H}/design/promo/스토어스샷-2507/renders-v4`
fs.mkdirSync(OUT, { recursive: true })

// ⛔ dist 가 낡았으면 «옛 화면»을 찍는다 — 스모크가 당한 것과 같은 함정이라 먼저 막는다
if (!fs.existsSync(`${DIST}/index.html`)) { console.log('⛔ dist 가 없다 — `npm run build` 부터'); process.exit(1) }

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4380, r))

const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
// ⭐ 1080×2342 → Stage 의 scale 이 1 이 된다(위 주석 계산). deviceScaleFactor 2 = 2160×3840 출력.
const page = await b.newPage({ viewport: { width: 1080, height: 2342 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))

await page.goto('http://127.0.0.1:4380/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)

// ⛔⛔ 첫 판이 **1장만** 찍혔다 — 두 가지를 틀렸다(규칙 18 ⓘ · 검사가 무엇을 보는지)
//   ⑴ 「다음」 버튼을 `visibility:hidden` 으로 숨겼더니 **접근성 트리에서 빠져** Playwright 가 못 찾았다
//      → ✅ **숨길 필요가 없다.** 아래처럼 «스테이지 요소만» 찍으면 바깥 버튼은 애초에 안 들어간다.
//   ⑵ `.first()` 로 스테이지를 잡았는데, 온보딩은 **10장을 DOM 에 전부 렌더**해 두고
//      `translateX` 로 옮길 뿐이다 → 다음을 눌러도 **늘 1번 장**을 찍는다.
//      → ✅ **`.nth(i)` 로 «그 장»을 집는다.** 옮길 필요도 없어져 클릭이 아예 필요 없다.
await page.addStyleTag({ content: `
  .hk-fx, [class^="hk-m-"] { animation-play-state: paused !important; }
` })

const 이름 = ['01-왜만들었나', '02-다섯친구', '03-히어로', '04-레꾸', '05-한끼일기', '06-공유', '07-장보기', '08-큐레이션', '09-감정', '10-브랜드']
// ⛔⛔ 두 번째 판도 틀렸다 — **한 장당 2개**가 잡혀 같은 그림이 두 번씩 저장됐다(파일 크기가 둘씩 동일).
//   `Stage()` 는 **두 겹**이다(`Onboarding.jsx:70-71`) — 바깥 `1080*scale × 1920*scale` ＋ 안쪽 `1080×1920`.
//   우리는 scale 을 1 로 맞췄으니 **바깥도 「1080px × 1920px」** 이 되어 선택자에 같이 걸렸다.
//   ✅ 안쪽에만 있는 **`zoom`** 으로 가른다.
//   📌 「20장」 경고가 이걸 잡았다 — 개수를 찍어두는 게 값을 했다.
const 판들 = page.locator('div[style*="width: 1080px"][style*="height: 1920px"][style*="zoom"]')
const 개수 = await 판들.count()
console.log(`  · DOM 에 있는 스테이지 = ${개수}장`)
if (개수 !== 이름.length) console.log(`  ⚠️ 이름표는 ${이름.length}개인데 스테이지는 ${개수}장 — 장이 늘었나 확인할 것`)

let 찍음 = 0
for (let i = 0; i < Math.min(개수, 이름.length); i++) {
  await 판들.nth(i).screenshot({ path: join(OUT, `${이름[i]}.png`) })
  찍음++
}

console.log(`\n  ✅ ${찍음}장 찍음 → ${OUT}`)
console.log(errors.length ? `  ⛔ pageerror ${errors.length}건 — ${errors[0]}` : '  ✅ pageerror 0')
await b.close(); srv.close()
if (찍음 < 10) { console.log(`  ⛔ 10장이어야 하는데 ${찍음}장이다`); process.exit(1) }
