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
// 마트 "종류"(상표 아님) — 안전
const kinds = ['새벽배송', '대형몰', '친환경마켓', '오픈마켓', '동네마트']

const shopping = page('linear-gradient(160deg,#a9cadd,#d0e3ee)',
  `<div class="cap"><h1 style="color:#2f6a8c">재료, 한 번에<br>사러가기 🛒</h1><div class="sub" style="color:#3f7d9e">레시피 재료 그대로 톡 — 여러 마트로 바로</div></div>`,
  `<div style="position:absolute;top:512px;left:50%;transform:translateX(-50%);width:720px">
    <div class="panel" style="padding:44px 40px">
      <div style="display:flex;align-items:center;gap:18px;border-bottom:3px dashed #e6e0d4;padding-bottom:22px;margin-bottom:12px">
        <div style="width:96px;height:96px;border-radius:22px;background:linear-gradient(135deg,#fffdf8,#f0ece0);display:flex;align-items:center;justify-content:center"><img src="${F('fh_k02')}" style="width:80%"/></div>
        <div><div style="font-size:46px;color:#33302b">김치찌개 재료</div><div style="font-size:30px;color:#a99">돼지고기·두부·대파·김치…</div></div>
      </div>
      ${['돼지고기 앞다리','두부 한 모','대파 한 단'].map((n)=>
        `<div style="display:flex;align-items:center;justify-content:space-between;padding:20px 6px;border-bottom:2px solid #f2ede2">
           <div style="font-size:40px;color:#4a4438">・ ${n}</div>
           <div style="background:#4a7f9e;color:#fff;font-size:32px;padding:12px 30px;border-radius:30px">담기 🛒</div></div>`).join('')}
    </div>
    <div class="panel" style="margin-top:30px;padding:34px 34px 40px;text-align:center">
      <div style="font-size:38px;color:#2f6a8c;margin-bottom:8px">내가 자주 쓰는 마트로 바로 🛒</div>
      <div style="font-size:29px;color:#8a9aa6;margin-bottom:24px">원하는 곳으로 톡 — 장바구니째 이동</div>
      <div style="display:flex;flex-wrap:wrap;gap:14px;justify-content:center">
        ${kinds.map((n)=>`<span style="background:#eaf1f6;color:#4a7a96;font-size:31px;padding:13px 30px;border-radius:28px;border:2px solid #d5e3ec">${n}</span>`).join('')}
      </div>
    </div>
  </div>
  <img src="${b(`${OUT}/gomjang_combo.png`)}" style="position:absolute;left:50%;transform:translateX(-48%);bottom:168px;width:396px;filter:drop-shadow(0 12px 20px rgba(40,60,80,.3))"/>
  <div class="foot"><span class="pill" style="background:#2f6a8c;color:#fff">장 볼 거 까먹을 일 없이 🛒</span></div>`)

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await br.newPage({ viewport: { width: 1080, height: 1920 } })
await p.setContent(shopping, { waitUntil: 'networkidle' }); await p.waitForTimeout(250)
await p.screenshot({ path: `${OUT}/5-shopping-combo.png` }); await br.close()
console.log('rendered 5-shopping-combo')
