// 스토어 피처 그래픽 1024×500 — v2: 왼쪽 "붕뜸" 해결
// 카드(떠보임) 제거 → 크림을 '전체높이 구조 영역'으로(물결 곡선 분할). 로고는 크림 안에 안착.
import pw from '/opt/node22/lib/node_modules/playwright/index.js'
const CHROME='/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const OUT='/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/'
const { readFileSync } = await import('fs')
const b64f=(p)=>readFileSync(p).toString('base64')
const GD=b64f('/home/user/hankki/hankki/design/promo/fonts/gowun-dodum-korean-400.woff2')
const JUA=b64f('/home/user/hankki/hankki/design/promo/fonts/jua-korean-400.woff2')
const LOGO=b64f(OUT+'logo-real-trans.png')
const BEAR=b64f('/home/user/hankki/hankki/src/assets/stickers/photo/gp_gomhi.png')

const b=await pw.chromium.launch({executablePath:CHROME})
const p=await(await b.newContext({deviceScaleFactor:2})).newPage()
await p.setViewportSize({width:1024,height:500})
await p.setContent(`<meta charset=utf-8><style>
@font-face{font-family:'GD';src:url(data:font/woff2;base64,${GD}) format('woff2')}
@font-face{font-family:'JUA';src:url(data:font/woff2;base64,${JUA}) format('woff2')}
*{margin:0;box-sizing:border-box}
.stage{width:1024px;height:500px;position:relative;overflow:hidden;font-family:'GD';
  background:linear-gradient(125deg,#f7cf95 0%,#f0b271 50%,#e79554 100%)}
/* 도트는 캐러멜(오른쪽)에만 보이게 — 크림 SVG가 왼쪽 덮음 */
.dots{position:absolute;inset:0;z-index:1;opacity:.45;
  background-image:radial-gradient(circle, rgba(255,250,240,.5) 22%, transparent 24%);
  background-size:48px 48px}
/* 전체높이 크림 영역 + 오른쪽 가장자리 물결 곡선(붕뜸 제거·구조화) */
.cream{position:absolute;inset:0;z-index:2;width:100%;height:100%;
  filter:drop-shadow(2px 0 26px rgba(150,92,38,.20))}
.logo-wrap{position:absolute;left:34px;top:50%;transform:translateY(-50%);
  width:392px;z-index:4;text-align:center}
.logo-wrap img{height:205px;display:block;margin:0 auto 2px}
.logo-wrap .tag{font-family:'JUA';font-size:29px;color:#6b4f3a;letter-spacing:-.5px;line-height:1.32;margin-top:10px}
.bear{position:absolute;right:6px;bottom:-26px;height:512px;z-index:3;
  filter:drop-shadow(0 14px 20px rgba(90,55,20,.24))}
</style>
<div class=stage>
  <div class=dots></div>
  <svg class=cream viewBox="0 0 1024 500" preserveAspectRatio="none">
    <path d="M0,0 L432,0 Q556,250 432,500 L0,500 Z" fill="#fffdf8"/>
  </svg>
  <div class=logo-wrap>
    <img src="data:image/png;base64,${LOGO}">
    <div class=tag>내 레시피, 예쁘게<br>꾸미고 자랑해요</div>
  </div>
  <img class=bear src="data:image/png;base64,${BEAR}">
</div>`,{waitUntil:'networkidle'})
await p.waitForTimeout(400)
await (await p.$('.stage')).screenshot({path:OUT+'store-graphic.png'})
console.log('done')
await b.close()
