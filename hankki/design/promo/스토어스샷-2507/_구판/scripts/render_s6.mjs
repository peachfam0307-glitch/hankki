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
.foot{position:absolute;bottom:88px;left:0;right:0;text-align:center;font-size:42px;}
.pill{padding:16px 40px;border-radius:44px;}
.panel{background:#fffdf8;border-radius:40px;box-shadow:0 26px 54px rgba(60,70,90,.24);}
</style>`
const page = (bg, cap, body) => `<!doctype html><html><head><meta charset="utf-8">${head}</head><body style="background:${bg}"><div class="dots"></div>${cap}${body}</body></html>`

const curation = page('linear-gradient(160deg,#cdd2a0,#e4e7c6)',
  `<div class="cap"><h1 style="color:#5f6a30">아무거나 말고,<br>써본 것만 나눠요</h1><div class="sub" style="color:#72803a">18년차 주부가 직접 쓰고 좋았던 살림템만 ⭐</div></div>`,
  `<div style="position:absolute;top:600px;left:50%;transform:translateX(-50%);width:740px;display:flex;flex-direction:column;gap:28px">
     ${[['든든한 보리면','쫄깃하고 속 편한, 든든한 한 끼','#c9a84e','🍜'],['만능 대파소금','이거 하나면 간이 딱 맞아요','#7a9b56','🧂'],['간편 쯔유 스톡','물만 부으면 국물요리 뚝딱','#8b6f4a','🍶']].map(([n,d,c,e])=>
       `<div class="panel" style="padding:30px 32px;display:flex;align-items:center;gap:26px;position:relative">
          <div style="width:110px;height:110px;border-radius:26px;background:${c};display:flex;align-items:center;justify-content:center;font-size:56px;color:#fff;flex-shrink:0">${e}</div>
          <div style="flex:1"><div style="font-size:42px;color:#33302b">${n}</div><div style="font-size:32px;color:#8a8570;font-family:'Gaegu';margin-top:4px">${d}</div></div>
          <div style="position:absolute;top:-16px;right:24px;background:#ffcf3f;color:#6a4a10;font-size:28px;padding:8px 22px;border-radius:24px;box-shadow:0 6px 12px rgba(150,110,20,.25)">⭐ 곰펭 PICK</div>
        </div>`).join('')}
  </div>
  <img src="${b(`${OUT}/naengmyeon.png`)}" style="position:absolute;left:50%;bottom:210px;transform:translateX(-50%);width:498px;filter:drop-shadow(0 14px 22px rgba(70,80,40,.3))"/>
  <div class="foot"><span class="pill" style="background:#5f6a30;color:#fff">믿고 사는 살림템 🐻👍</span></div>`)

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await br.newPage({ viewport: { width: 1080, height: 1920 } })
await p.setContent(curation, { waitUntil: 'networkidle' }); await p.waitForTimeout(250)
await p.screenshot({ path: `${OUT}/6-curation-v2.png` }); await br.close()
console.log('rendered 6-curation-v2')
