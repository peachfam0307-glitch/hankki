import fs from 'fs'
import pw from '/home/user/hankki/hankki/node_modules/playwright-core/index.js'
const { chromium } = pw
const H = '/home/user/hankki/hankki', PH = `${H}/src/assets/stickers/photo`, FT = `${H}/design/promo/fonts`
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const jua = fs.readFileSync(`${FT}/jua-korean-400.woff2`).toString('base64')
const gaegu = fs.readFileSync(`${FT}/gaegu-korean-400.woff2`).toString('base64')
const b = (p) => `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`
const F = (k) => b(`${PH}/${k}.png`)

const head = `<style>
@font-face{font-family:'Jua';src:url(data:font/woff2;base64,${jua}) format('woff2');}
@font-face{font-family:'Gaegu';src:url(data:font/woff2;base64,${gaegu}) format('woff2');}
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1920px;font-family:'Jua',sans-serif;overflow:hidden;position:relative;}
.dots{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.32) 9px,transparent 10px);background-size:100px 100px;}
.cap{position:absolute;top:104px;left:0;right:0;text-align:center;z-index:9;padding:0 56px;}
.cap h1{font-size:92px;line-height:1.15;letter-spacing:-1px;}
.cap .sub{margin-top:18px;font-size:40px;}
.card{background:#fffdf8;border-radius:42px;padding:26px 26px 30px;box-shadow:0 30px 60px rgba(90,60,30,.3);position:relative;}
.cover{position:relative;border-radius:28px;overflow:hidden;}
.tape{position:absolute;top:-24px;left:50%;transform:translateX(-50%) rotate(-2deg);width:230px;height:54px;background:rgba(255,214,150,.85);border:2px dashed rgba(160,110,55,.5);border-radius:6px;}
.spark{position:absolute;filter:drop-shadow(0 2px 3px rgba(0,0,0,.1));}
.postit{position:absolute;padding:16px 20px;border-radius:9px;font-family:'Gaegu';line-height:1.1;box-shadow:0 8px 16px rgba(120,90,30,.22);}
.chip{background:#fff;border-radius:26px;box-shadow:0 8px 18px rgba(90,60,30,.18);display:flex;align-items:center;justify-content:center;}
</style>`
const page = (bg, cap, body) => `<!doctype html><html><head><meta charset="utf-8">${head}</head><body style="background:${bg}"><div class="dots"></div>${cap}${body}</body></html>`
const im = (k,css) => `<img src="${F(k)}" style="position:absolute;${css}"/>`

// 카드 (배경색 민트와 조화 = 웜크림 커버 + 예쁜 진짜 스티커)
const cover = `linear-gradient(150deg,#fbf5e8,#f2ecda)`
const deco = `
  ${im('dc_dhb14','left:38px;top:46px;width:70px;transform:rotate(-10deg);filter:drop-shadow(0 4px 6px rgba(80,90,50,.2))')}
  ${im('dc_dhb10','right:42px;top:52px;width:74px;transform:rotate(10deg);filter:drop-shadow(0 4px 6px rgba(120,80,90,.2))')}
  ${im('dc_dhb04','left:34px;top:262px;width:54px;transform:rotate(-8deg);filter:drop-shadow(0 4px 6px rgba(120,70,70,.2))')}
  ${im('dc_dsy04','right:50px;top:280px;width:60px;transform:rotate(8deg)')}
  <span class="spark" style="top:150px;left:158px;font-size:34px">✨</span>`
const cardHtml = `<div class="card" style="width:640px;transform:rotate(-3deg)">
  <div class="cover" style="height:600px;background:${cover}">
    <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(150,140,100,.15) 5px,transparent 6px);background-size:52px 52px"></div>
    ${deco}
    ${im('fe_06','top:50%;left:50%;transform:translate(-50%,-50%);width:346px;filter:drop-shadow(0 10px 16px rgba(90,60,30,.22))')}
    ${im('gp_pengv','left:-6px;bottom:-8px;width:198px;transform:rotate(-5deg);filter:drop-shadow(0 8px 12px rgba(90,60,30,.22))')}
    <div class="postit" style="right:28px;bottom:36px;background:#dde5cf;transform:rotate(4deg);font-size:36px;color:#4f5a44">내 최애 ♡</div>
  </div>
  <div style="margin-top:20px;text-align:center"><div style="font-size:52px;color:#33302b">연어 포케볼</div><div style="font-size:30px;color:#b3a898">2026.07.24</div></div></div>`

const html = page('linear-gradient(160deg,#d3e3c8,#eaf2e2)',
  `<div class="cap"><h1 style="color:#4a6b42">레시피 정리?<br>우린 레시피 레꾸해요</h1><div class="sub" style="color:#5f7a54">레시피 꾸미기 = 레꾸! 곰펭이랑 톡톡 꾸며요</div></div>`,
  `<div style="position:absolute;top:560px;left:50%;transform:translateX(-50%);text-align:center">
     ${cardHtml}
     <div style="margin-top:34px;background:#fff;border-radius:36px;padding:28px 24px;box-shadow:0 16px 34px rgba(70,90,60,.2);width:640px;display:flex;justify-content:space-between;align-items:center">
       ${['gp_gomhi','gp_penghi','fh_k27','fe_15'].map(k=>`<div class="chip" style="width:120px;height:120px"><img src="${F(k)}" style="width:80%"/></div>`).join('')}
       <div class="chip" style="width:120px;height:120px;font-size:54px;background:#5d3410;color:#fff">＋</div>
     </div>
     <div style="margin-top:24px;font-family:'Gaegu';font-size:40px;color:#4a6b42">👆 톡 눌러 붙이기만 하면 끝!</div>
  </div>`)

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await br.newPage({ viewport: { width: 1080, height: 1920 } })
await p.setContent(html, { waitUntil: 'networkidle' }); await p.waitForTimeout(250)
await p.screenshot({ path: `${OUT}/2-decorate-v2.png` }); await br.close()
console.log('rendered 2-decorate-v2')
