// 🌑 주부의 장바구니 릴스 2판 — «다크» 시안 다시 (2026-09-12)
//
// 📮 창업자 = *"다크모드좋다. 근데 네가준시안2개 똑같아보여"*
// ⛔⛔ 첫 판의 잘못 = 두 장이 «같은 짜임»이었다 — 가운데 정렬 · 위에 흰 큰글씨 · 아래 베이지 알약.
//    글자만 바뀌니 「제목만 바뀐 화면」이 된다. (레시피 릴스에서도 똑같이 지적받았다)
// ✅ 그래서 **짜임 자체를 갈랐다** —
//    A = 그림이 주인공 : 글자는 왼쪽 위 «모서리»에 작게 · 스샷을 크게 기울여 화면 밖으로 넘김
//    B = 숫자가 그림 : 알약 «크기»를 실측 개수로 (쿠팡 72 / 컬리 19 / 한살림 14 / 자연드림 11 / 오아시스 3)
//        → 정보가 곧 짜임이 된다. 가운데 정렬이 아니라 흩뿌린다.
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, rmSync } from 'node:fs'
const R = '/home/user/hankki/hankki'
const 낼곳 = process.env.OUT || '/tmp/큐레다크2'
rmSync(낼곳, { recursive: true, force: true }); mkdirSync(낼곳, { recursive: true })
const F = (n) => readFileSync(`${R}/src/assets/fonts/${n}`).toString('base64')
const 고운 = F('gowun-dodum-korean-400.woff2'), 라틴 = F('gowun-dodum-latin-400.woff2')
const PNG = (p) => 'data:image/png;base64,' + readFileSync(p).toString('base64')
// 🔢 실측 = curation.js 를 세어 나온 값 (⛔손으로 적지 않는다)
const 몰들 = [['쿠팡', 72], ['마켓컬리', 19], ['한살림', 14], ['자연드림', 11], ['오아시스', 3]]

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })
const 바탕 = `background:radial-gradient(120% 80% at 50% 0%,#2a1f17 0%,#1b1410 60%,#140f0c 100%)`
const 폰트 = `@font-face{font-family:'GD';src:url(data:font/woff2;base64,${고운}) format('woff2')}
@font-face{font-family:'GD';src:url(data:font/woff2;base64,${라틴}) format('woff2')}`

// ── A · 그림이 주인공 ─────────────────────────────────────
// ⭐ 글자를 «모서리»로 보내고 스샷을 키웠다. 안전띠(위 240) 아래에서 시작한다.
await p.setContent(`<!doctype html><meta charset=utf-8><style>${폰트}
html,body{margin:0;width:1080px;height:1920px;font-family:GD,sans-serif;overflow:hidden;${바탕};color:#fff}
.corner{position:absolute;left:72px;top:300px;max-width:620px}
.k1{font-size:40px;font-weight:700;color:#e8c89a;letter-spacing:.02em;margin-bottom:14px}
.k2{font-size:72px;font-weight:700;line-height:1.18;letter-spacing:-.03em;text-shadow:0 6px 24px rgba(0,0,0,.6)}
/* 📱 크게 · 살짝 기울여 · 화면 아래로 넘긴다 — 「앱 안을 들여다보는」 느낌 */
.tilt{position:absolute;left:210px;top:700px;width:900px;transform:rotate(-4deg);
  border-radius:44px;overflow:hidden;box-shadow:-30px 40px 100px rgba(0,0,0,.7);border:3px solid rgba(232,200,154,.3)}
.tilt img{display:block;width:900px}
</style>
<div class=corner><div class=k1>주부의 장바구니</div>
<div class=k2>18년차 주부가<br>직접 써본 것만</div></div>
<div class=tilt><img src="${PNG('/tmp/큐레샷2/1-장보기-위.png')}"></div>`)
await p.waitForTimeout(250)
await p.screenshot({ path: `${낼곳}/A-그림주인공.jpg`, type: 'jpeg', quality: 94 }); console.log('📸 A-그림주인공')

// ── B · 숫자가 그림 ──────────────────────────────────────
// ⭐ 알약 크기 = 제품 개수. 가운데 정렬을 버리고 흩뿌린다.
const 큰것 = 몰들[0][1]
const 알약 = 몰들.map(([이름, n]) => {
  const 배 = 0.42 + 0.58 * (n / 큰것)          // 0.42~1.0 — 3개짜리도 읽히게 바닥을 깐다
  return `<div class=mall style="font-size:${Math.round(88 * 배)}px;padding:${Math.round(30 * 배)}px ${Math.round(54 * 배)}px">
    ${이름}<i>${n}</i></div>`
}).join('')
await p.setContent(`<!doctype html><meta charset=utf-8><style>${폰트}
html,body{margin:0;width:1080px;height:1920px;font-family:GD,sans-serif;overflow:hidden;${바탕};color:#fff}
.cloud{position:absolute;left:60px;right:60px;top:420px;display:flex;flex-wrap:wrap;align-items:center;
  justify-content:center;gap:30px 24px}
.mall{font-weight:700;color:#1b1410;background:#f2e4cf;border-radius:999px;white-space:nowrap;
  box-shadow:0 14px 34px rgba(0,0,0,.5);display:flex;align-items:baseline;gap:14px}
.mall i{font-style:normal;font-size:.5em;color:#8a6a3e}
.foot{position:absolute;left:0;right:0;bottom:470px;text-align:center}
.f1{font-size:66px;font-weight:700;letter-spacing:-.03em;text-shadow:0 6px 24px rgba(0,0,0,.6)}
.f2{margin-top:26px;font-size:40px;font-weight:700;color:#e8c89a}
.f2 b{color:#fff;border-bottom:3px dashed rgba(232,200,154,.6);padding-bottom:4px}
</style>
<div class=cloud>${알약}</div>
<div class=foot><div class=f1>한 몰에 묶이지 않아요</div>
<div class=f2>코스트코 · 트레이더스는 <b>준비중</b></div></div>`)
await p.waitForTimeout(250)
await p.screenshot({ path: `${낼곳}/B-숫자가그림.jpg`, type: 'jpeg', quality: 94 }); console.log('📸 B-숫자가그림')
console.log(`\n✅ ${낼곳}`)
await b.close()
