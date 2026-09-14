import fs from 'fs'
import pw from '/home/user/hankki/hankki/node_modules/playwright-core/index.js'
const { chromium } = pw
const H = '/home/user/hankki/hankki', PH = `${H}/src/assets/stickers/photo`, FT = `${H}/design/promo/fonts`
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const jua = fs.readFileSync(`${FT}/jua-korean-400.woff2`).toString('base64')
const gaegu = fs.readFileSync(`${FT}/gaegu-korean-400.woff2`).toString('base64')
const b = (p) => `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`
const F = (k) => b(`${PH}/${k}.png`)
const im = (k,css) => `<img src="${F(k)}" style="position:absolute;${css}"/>`

const head = `<style>
@font-face{font-family:'Jua';src:url(data:font/woff2;base64,${jua}) format('woff2');}
@font-face{font-family:'Gaegu';src:url(data:font/woff2;base64,${gaegu}) format('woff2');}
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1920px;font-family:'Jua',sans-serif;overflow:hidden;position:relative;}
.dots{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.32) 9px,transparent 10px);background-size:100px 100px;}
.cap{position:absolute;top:92px;left:0;right:0;text-align:center;z-index:9;padding:0 56px;}
.cap h1{font-size:82px;line-height:1.15;letter-spacing:-1px;}
.cap .sub{margin-top:16px;font-size:38px;}
.foot{position:absolute;bottom:80px;left:0;right:0;text-align:center;font-size:42px;}
.pill{padding:16px 40px;border-radius:44px;}
.rbub{position:absolute;background:#fff;font-family:'Gaegu';font-size:38px;color:#3a2f2a;box-shadow:0 10px 22px rgba(150,50,80,.24);z-index:5;}
</style>`
const page = (bg, cap, body) => `<!doctype html><html><head><meta charset="utf-8">${head}</head><body style="background:${bg}"><div class="dots"></div>${cap}${body}</body></html>`
const banner = (t) => `<div style="position:absolute;top:16px;left:50%;transform:translateX(-50%) rotate(-2deg);padding:10px 34px;background:#f0b7c6;background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.5) 0 10px,transparent 10px 20px),repeating-linear-gradient(90deg,rgba(255,255,255,.5) 0 10px,transparent 10px 20px);border-radius:4px;box-shadow:0 6px 13px rgba(150,90,90,.22);font-family:'Gaegu';font-size:38px;color:#7a4a52;white-space:nowrap">${t}</div>`

const insta = page('radial-gradient(circle at 50% 26%,#f7bccb,#f2a0b4 66%,#ec8ea6)',
  `<div class="cap">
     <h1 style="color:#fffdf8;text-shadow:0 3px 0 rgba(180,70,100,.32)">예쁜 카드 한 장으로,<br>센스있게 레시피 공유 📲</h1>
     <div class="sub" style="color:#7a3550">내 한끼를 친구들과 나눠요 🥰</div>
     <div style="margin-top:22px;display:flex;gap:16px;justify-content:center">
       <span style="background:#fffdf8;color:#c0506a;font-size:29px;padding:9px 24px 9px 11px;border-radius:30px;box-shadow:0 6px 14px rgba(150,60,85,.2);display:inline-flex;align-items:center;gap:11px"><span style="display:inline-flex;width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#fdd85d,#f6772e 38%,#e33a72 66%,#b23bb0);position:relative;flex-shrink:0"><span style="position:absolute;inset:8px;border:3.5px solid #fff;border-radius:8px"></span><span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:13px;height:13px;border:3.5px solid #fff;border-radius:50%"></span><span style="position:absolute;right:9px;top:9px;width:5px;height:5px;border-radius:50%;background:#fff"></span></span>인스타 스토리</span>
       <span style="background:#fffdf8;color:#7a5a1e;font-size:29px;padding:9px 24px 9px 11px;border-radius:30px;box-shadow:0 6px 14px rgba(150,60,85,.2);display:inline-flex;align-items:center;gap:11px"><span style="display:inline-flex;width:40px;height:40px;border-radius:12px;background:#FEE500;position:relative;flex-shrink:0"><span style="position:absolute;left:50%;top:45%;transform:translate(-50%,-50%);width:26px;height:20px;background:#3A1D1D;border-radius:12px"></span><span style="position:absolute;left:11px;bottom:8px;width:7px;height:7px;background:#3A1D1D;transform:rotate(28deg)"></span></span>카카오톡</span>
     </div>
   </div>`,
  `<div style="position:absolute;top:566px;left:50%;transform:translateX(-50%);width:560px">
     <div style="border-radius:56px;padding:8px;background:conic-gradient(from 30deg,#f9a825,#f06292,#ab47bc,#5c9df0,#f9a825);box-shadow:0 30px 60px rgba(150,50,80,.35)">
       <div style="background:#fff;border-radius:50px;overflow:hidden;position:relative">
         <div style="display:flex;align-items:center;gap:14px;padding:22px 26px">
           <div style="width:74px;height:74px;border-radius:50%;background:linear-gradient(135deg,#f6c79b,#e3aa73);display:flex;align-items:center;justify-content:center;overflow:hidden"><img src="${F('gp_gomtb')}" style="width:116%"/></div>
           <div style="font-size:34px;color:#333">꼬르곰맘</div><div style="font-size:28px;color:#aaa">· 스토리</div>
         </div>
         <div style="position:relative;height:600px;background:linear-gradient(150deg,#fdf3e8,#f5ead9)">
           <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(150,120,80,.14) 5px,transparent 6px);background-size:52px 52px"></div>
           ${banner('감바스 알 아히요 🍤')}
           ${im('dc_dhb10','left:22px;top:98px;width:64px;transform:rotate(-12deg)')}
           ${im('dc_dhb01','right:26px;top:104px;width:58px;transform:rotate(10deg)')}
           ${im('dc_dhb04','left:26px;top:270px;width:48px;transform:rotate(-8deg)')}
           <span style="position:absolute;top:180px;left:150px;font-size:40px">✨</span>
           ${im('fe_08','top:49%;left:50%;transform:translate(-50%,-50%);width:296px;filter:drop-shadow(0 10px 16px rgba(90,60,30,.2))')}
           ${im('gp_duoht','right:-4px;bottom:-4px;width:252px')}
           <div style="position:absolute;left:24px;bottom:34px;padding:14px 18px;background:#fff6b8;border-radius:9px;transform:rotate(-4deg);font-family:'Gaegu';font-size:32px;color:#6b5330;line-height:1.2">오늘 저녁<br>성공! 🍤</div>
         </div>
         <div style="display:flex;align-items:center;gap:16px;padding:22px 26px">
           <div style="flex:1;border:3px solid #eee;border-radius:40px;padding:12px 24px;font-size:28px;color:#bbb">메시지 보내기…</div>
           <span style="font-size:44px">🤍</span><span style="font-size:44px">📤</span>
         </div>
       </div>
     </div>
     <div class="rbub" style="left:-70px;top:220px;border-radius:30px 30px 30px 6px;padding:15px 26px;transform:rotate(-5deg)">우와 맛있겠다 😍</div>
     <div class="rbub" style="right:-64px;top:450px;border-radius:30px 30px 6px 30px;padding:15px 26px;transform:rotate(5deg)">레시피 공유해줘 🙏</div>
     <div class="rbub" style="left:-46px;bottom:58px;border-radius:30px 30px 30px 6px;padding:15px 28px;transform:rotate(-3deg);background:#5d3410;color:#fff">같이 해먹자! 🥰</div>
  </div>
  <div class="foot"><span class="pill" style="background:#fffdf8;color:#c04a68">센스있는 레시피 한 장, 친구에게 톡 💕</span></div>`)

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await br.newPage({ viewport: { width: 1080, height: 1920 } })
await p.setContent(insta, { waitUntil: 'networkidle' }); await p.waitForTimeout(250)
await p.screenshot({ path: `${OUT}/3-insta-v2.png` }); await br.close()
console.log('rendered 3-insta-v2')
