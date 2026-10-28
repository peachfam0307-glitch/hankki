// ✍️ 릴스에 얹을 «글자판» 낱장 — 우리 폰트로, 브라우저에서 그린다 (2026-09-12)
//
// ⛔ ffmpeg 의 drawtext 는 우리 폰트를 못 읽는다(우리 건 woff2 다).
//    ✅ 그래서 브라우저에서 그려 투명 PNG 로 뽑고 overlay 한다 — 지난 릴스(_판-반짝임-0903)와 같은 길.
//
// 📮 창업자 = *"짜임 신선하고 또렷하게. 촌스럽지않게. 색감도 확 시선사로잡게"*
//    ⭐ 그래서 «흰 글씨에 검은 그림자» 같은 흔한 자막을 안 쓴다 —
//       우리 톤(진갈색 #5d3410 · 크림)으로 **둥근 알약 띠**에 얹는다. 우리 앱 배지와 같은 모양이다.
// ⭐⭐ 숫자(87)는 «앱 화면이 이미» 보여준다 → 글자는 «거드는 말»만. 두 번 말하면 광고로 읽힌다.
import { chromium } from 'playwright'
import { mkdirSync, rmSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = '/home/user/hankki/hankki'
const 낼곳 = process.env.OUT || '/tmp/릴스글자'
rmSync(낼곳, { recursive: true, force: true }); mkdirSync(낼곳, { recursive: true })

// [파일이름, 큰 글자, 작은 글자]
const 판들 = [
  ['01-훅', '깔자마자', '레시피가 가득'],
  ['02-빈앱', '빈 앱 아니에요', '바로 보고 바로 해 먹어요'],
  ['03-고름', '화려한 요리는 아니지만', '계속 해먹을 수 있는 것들'],
  ['04-제철', '제철 재료로 요리 두 가지', '버리는 재료 없이 알차게'],
  ['05-주기', '월 · 수 · 토', '매주 새로 열려요'],
  ['06-끝', '한끼', '오늘도 한 끼 해냈네요'],
]

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })

const 폰트 = readFileSync(join(ROOT, 'src/assets/fonts/gowun-dodum-korean-400.woff2')).toString('base64')
const 폰트라틴 = readFileSync(join(ROOT, 'src/assets/fonts/gowun-dodum-latin-400.woff2')).toString('base64')

for (const [이름, 큰, 작은] of 판들) {
  await p.setContent(`<!doctype html><meta charset=utf-8><style>
@font-face{font-family:'GD';src:url(data:font/woff2;base64,${폰트}) format('woff2')}
@font-face{font-family:'GD';src:url(data:font/woff2;base64,${폰트라틴}) format('woff2')}
html,body{margin:0;width:1080px;height:1920px;background:transparent}
.wrap{position:absolute;left:0;right:0;bottom:210px;display:flex;flex-direction:column;align-items:center;gap:20px}
/* 🏷 우리 앱 배지와 같은 «둥근 알약» — 흔한 흰 자막 대신 브랜드 모양을 쓴다 */
.big{font-family:GD,sans-serif;font-size:74px;font-weight:700;color:#fff;background:#5d3410;
     padding:24px 52px;border-radius:999px;letter-spacing:-.02em;white-space:nowrap;
     box-shadow:0 10px 30px rgba(93,52,16,.28)}
.sub{font-family:GD,sans-serif;font-size:44px;color:#5d3410;background:rgba(255,253,247,.94);
     padding:16px 40px;border-radius:999px;letter-spacing:-.01em;white-space:nowrap;
     box-shadow:0 6px 20px rgba(93,52,16,.16)}
</style><div class=wrap><div class=big>${큰}</div><div class=sub>${작은}</div></div>`)
  await p.waitForTimeout(350)
  await p.screenshot({ path: join(낼곳, `${이름}.png`), omitBackground: true })
  console.log('✍️', 이름, '—', 큰, '·', 작은)
}
await b.close()
console.log(`\n✅ 글자판 ${판들.length}장 → ${낼곳}`)
