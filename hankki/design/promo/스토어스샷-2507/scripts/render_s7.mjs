import fs from 'fs'
import pw from '/home/user/hankki/hankki/node_modules/playwright-core/index.js'
const { chromium } = pw
const FT = '/home/user/hankki/hankki/design/promo/fonts'
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const jua = fs.readFileSync(`${FT}/jua-korean-400.woff2`).toString('base64')
const b = (p) => `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`
const heart = b(`${OUT}/heart_gom.png`)
const head = `<style>
@font-face{font-family:'Jua';src:url(data:font/woff2;base64,${jua}) format('woff2');}
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1920px;font-family:'Jua',sans-serif;overflow:hidden;position:relative;}
.dots{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.14) 9px,transparent 10px);background-size:100px 100px;}
.cap{position:absolute;top:120px;left:0;right:0;text-align:center;z-index:9;padding:0 56px;}
.cap h1{font-size:92px;line-height:1.15;letter-spacing:-1px;}
.cap .sub{margin-top:20px;font-size:40px;}
.foot{position:absolute;bottom:96px;left:0;right:0;text-align:center;font-size:42px;}
.pill{padding:16px 40px;border-radius:44px;}
.spark{position:absolute;filter:drop-shadow(0 2px 3px rgba(0,0,0,.1));}
</style>`
const html = `<!doctype html><html><head><meta charset="utf-8">${head}</head>
<body style="background:radial-gradient(circle at 50% 44%,#8a6a4c,#6f5238 70%,#5f4630)"><div class="dots"></div>
  <div class="cap"><h1 style="color:#fff6ea">오늘도 한 끼,<br>해냈어요</h1><div class="sub" style="color:#e8d3bd">요리하는 나를 위한 작은 위로 🐻</div></div>
  <div style="position:absolute;top:660px;left:50%;transform:translateX(-50%);width:760px;height:760px;display:flex;align-items:center;justify-content:center">
     <div style="position:absolute;width:660px;height:660px;border-radius:50%;background:radial-gradient(circle,rgba(255,244,230,.55),rgba(255,244,230,0) 68%)"></div>
     <img src="${heart}" style="width:452px;filter:drop-shadow(0 20px 30px rgba(40,25,10,.42))"/>
     <span class="spark" style="top:60px;left:96px;font-size:56px">✨</span>
     <span class="spark" style="bottom:150px;right:104px;font-size:48px">💛</span>
  </div>
  <div class="foot"><span class="pill" style="background:#fff6ea;color:#6f5238">감정 레시피북 · 한끼</span></div>
</body></html>`
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await br.newPage({ viewport: { width: 1080, height: 1920 } })
await p.setContent(html, { waitUntil: 'networkidle' }); await p.waitForTimeout(250)
await p.screenshot({ path: `${OUT}/7-emotion-v2.png` }); await br.close()
console.log('rendered 7-emotion-v2')
