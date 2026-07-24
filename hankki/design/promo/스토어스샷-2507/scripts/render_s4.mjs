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
</style>`
const page = (bg, cap, body) => `<!doctype html><html><head><meta charset="utf-8">${head}</head><body style="background:${bg}"><div class="dots"></div>${cap}${body}</body></html>`
const grid = ['fh_k01','fh_k22','fy_y03','fi_j01','fh_k27','fj_c05','fy_y06','fy_y10','fe_08','fe_09','fi_j04','fh_k02']
const html = page('linear-gradient(160deg,#f4e2a4,#f9edc2)',
  `<div class="cap"><h1 style="color:#9a7b1e">요리 이름만 쓰면,<br>이모지가 착! 🍚</h1><div class="sub" style="color:#8a7326">사진 없어도 예쁘게 — 88종 자동으로</div></div>`,
  `<div style="position:absolute;top:600px;left:50%;transform:translateX(-50%);width:860px;display:grid;grid-template-columns:repeat(3,1fr);gap:32px">
     ${grid.map(k=>`<div style="aspect-ratio:1;background:linear-gradient(135deg,#fffdf8,#f3ecd8);border-radius:34px;box-shadow:0 12px 24px rgba(150,120,40,.16);display:flex;align-items:center;justify-content:center"><img src="${F(k)}" style="width:72%"/></div>`).join('')}
  </div>
  <div class="foot"><span class="pill" style="background:#5d3410;color:#fffdf8">한식·양식·중식·일식·분식 🍚</span></div>`)
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await br.newPage({ viewport: { width: 1080, height: 1920 } })
await p.setContent(html, { waitUntil: 'networkidle' }); await p.waitForTimeout(250)
await p.screenshot({ path: `${OUT}/4-icons-v2.png` }); await br.close()
console.log('rendered 4-icons-v2')
