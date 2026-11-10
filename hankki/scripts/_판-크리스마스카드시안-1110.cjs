const { chromium } = require('/home/user/hankki/hankki/node_modules/playwright'), fs = require('fs')
const S = process.argv[2], A = '/home/user/hankki/hankki/', d = (p, t = 'image/png') => `data:${t};base64,` + fs.readFileSync(p).toString('base64')
const F = (n) => d(A + 'src/assets/fonts/' + n, 'font/woff2')
const C = A + 'docs/stickers/겨울크리스마스-캐릭터-2026-08-04/낱개/', G = A + 'docs/stickers/크리스마스-진저소품-2611/낱개/'
const card = (bg, night, hero, p1, p2, house) => `<div class="c" style="background:${night ? '#4a3c37' : '#fdf1e1'}">
 <img src="${bg}" style="position:absolute;inset:0;width:1080px;height:1350px;object-fit:cover">
 <img src="${house}" style="position:absolute;left:0;bottom:0;width:1080px">
 <div class="brand" style="color:${night ? '#fff6ea' : '#6b3d2a'}">한끼 · 레꾸자랑</div>
 <div class="badge">Merry Christmas</div>
 <div class="panel"><div class="sub">크리스마스엔, 이 한 끼</div><div class="t">뜨끈한<br>어묵탕</div>
  <div class="chips"><span>⏱ 20분</span><span>쉬움</span><span>2인분</span></div>
  <img src="${p1}" style="position:absolute;left:-60px;bottom:-50px;width:140px;transform:rotate(-14deg)">
  <img src="${p2}" style="position:absolute;right:-36px;top:-48px;width:120px;transform:rotate(12deg)"></div>
 <img src="${hero}" style="position:absolute;right:24px;bottom:150px;height:520px;filter:drop-shadow(0 0 0 #fff) drop-shadow(0 10px 18px rgba(80,50,20,.3))">
 <div class="foot" style="color:${night ? '#fff6ea' : '#6b3d2a'}">App Store · Google Play 에서 「한끼 레시피북」 검색</div></div>`
const html = `<html><head><style>
@font-face{font-family:Jua;src:url(${F('jua-korean-400.woff2')})}@font-face{font-family:Jua;src:url(${F('jua-latin-400.woff2')})}
@font-face{font-family:Gaegu;src:url(${F('gaegu-korean-400.woff2')})}@font-face{font-family:Gaegu;src:url(${F('gaegu-latin-400.woff2')})}
body{margin:0;display:flex;gap:40px;background:#ddd}.c{position:relative;width:1080px;height:1350px;overflow:hidden}
.brand{position:absolute;left:64px;top:70px;font:40px Jua;text-shadow:0 2px 10px rgba(255,250,240,.6)}
.badge{position:absolute;right:64px;top:70px;transform:rotate(-7deg);font:31px Jua;color:#fff;background:linear-gradient(180deg,#d9483b,#b8322a);padding:10px 24px;border-radius:30px;box-shadow:0 6px 14px rgba(120,30,20,.35)}
.panel{position:absolute;left:58px;right:58px;top:300px;padding:34px 38px 40px;border-radius:34px;background:rgba(253,250,244,.93);box-shadow:0 18px 40px -18px rgba(90,50,20,.45)}
.sub{font:700 44px Gaegu;color:#b8322a}.t{font:132px/0.99 Jua;letter-spacing:-3px;color:#4a2a1c;margin-top:4px}
.chips{margin-top:26px;display:flex;gap:12px}.chips span{font:30px Jua;color:#2f6b3f;background:rgba(80,140,90,.18);padding:8px 20px;border-radius:24px}
.foot{position:absolute;left:0;right:0;bottom:40px;text-align:center;font:32px Jua;color:#fff !important;text-shadow:0 2px 8px rgba(60,30,10,.7) !important;text-shadow:0 2px 8px rgba(0,0,0,.25)}
</style></head><body>${card(d(S + '/눈바탕2/쿠키위3.png'), 0, d(C + 'xn012_03.png'), d(G + 'xg01.png'), d(G + 'xg04.png'), d(S + '/눈바탕2/쿠키집3.png'))}${card(d(S + '/눈바탕2/밤위3.png'), 1, d(C + 'xc02_01.png'), d(G + 'xg02.png'), d(G + 'xg07.png'), d(S + '/눈바탕2/밤집3.png'))}</body></html>`
;(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); const p = await b.newPage({ viewport: { width: 2200, height: 1350 } })
  await p.setContent(html); await p.waitForTimeout(800); await p.screenshot({ path: S + '/카드시안.png' }); await b.close() })()
