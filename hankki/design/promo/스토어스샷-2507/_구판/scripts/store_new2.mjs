import fs from 'fs'
import pw from '/home/user/hankki/hankki/node_modules/playwright-core/index.js'
const { chromium } = pw
const H = '/home/user/hankki/hankki', PH = `${H}/src/assets/stickers/photo`, FT = `${H}/design/promo/fonts`
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/store2'
const jua = fs.readFileSync(`${FT}/jua-korean-400.woff2`).toString('base64')
const gaegu = fs.readFileSync(`${FT}/gaegu-korean-400.woff2`).toString('base64')
const b = (p) => `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`
const F = (k) => b(`${PH}/${k}.png`)
const gom = F('gp_gomv'), peng = F('gp_pengv')

const head = `<style>
@font-face{font-family:'Jua';src:url(data:font/woff2;base64,${jua}) format('woff2');}
@font-face{font-family:'Gaegu';src:url(data:font/woff2;base64,${gaegu}) format('woff2');}
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1920px;font-family:'Jua',sans-serif;overflow:hidden;position:relative;}
.dots{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.32) 9px,transparent 10px);background-size:100px 100px;}
.cap{position:absolute;top:104px;left:0;right:0;text-align:center;z-index:9;padding:0 56px;}
.cap h1{font-size:88px;line-height:1.15;letter-spacing:-1px;}
.cap .sub{margin-top:18px;font-size:40px;}
.foot{position:absolute;bottom:88px;left:0;right:0;text-align:center;font-size:42px;}
.pill{padding:16px 40px;border-radius:44px;}
.panel{background:#fffdf8;border-radius:40px;box-shadow:0 26px 54px rgba(60,70,90,.24);}
</style>`
const page = (bg, cap, body) => `<!doctype html><html><head><meta charset="utf-8">${head}</head><body style="background:${bg}"><div class="dots"></div>${cap}${body}</body></html>`

const malls = [['쿠팡','# e63946'.replace(' ',''),'#fff'],['마켓컬리','#5f259f','#fff'],['이마트몰','#ffce00','#333'],['네이버','#03c75a','#fff'],['오아시스','#8bc34a','#fff'],['한살림','#4a8b3a','#fff']]

// 장보기 — soft blue
const shopping = page('linear-gradient(160deg,#a9cadd,#d0e3ee)',
  `<div class="cap"><h1 style="color:#2f6a8c">재료, 한 번에<br>사러가기 🛒</h1><div class="sub" style="color:#3f7d9e">레시피 재료 그대로 톡 — 6개 마트 연결</div></div>`,
  `<div style="position:absolute;top:560px;left:50%;transform:translateX(-50%);width:720px">
    <div class="panel" style="padding:44px 40px">
      <div style="display:flex;align-items:center;gap:18px;border-bottom:3px dashed #e6e0d4;padding-bottom:22px;margin-bottom:12px">
        <div style="width:96px;height:96px;border-radius:22px;background:linear-gradient(135deg,#fffdf8,#f0ece0);display:flex;align-items:center;justify-content:center"><img src="${F('fh_k02')}" style="width:80%"/></div>
        <div><div style="font-size:46px;color:#33302b">김치찌개 재료</div><div style="font-size:30px;color:#a99">돼지고기·두부·대파·김치…</div></div>
      </div>
      ${[['돼지고기 앞다리','쿠팡','#e63946'],['두부 한 모','오아시스','#8bc34a'],['대파 한 단','마켓컬리','#5f259f']].map(([n,m,c])=>
        `<div style="display:flex;align-items:center;justify-content:space-between;padding:20px 6px;border-bottom:2px solid #f2ede2">
           <div style="font-size:40px;color:#4a4438">・ ${n}</div>
           <div style="background:${c};color:#fff;font-size:30px;padding:12px 26px;border-radius:30px">${m} 🛒</div></div>`).join('')}
    </div>
    <div class="panel" style="margin-top:30px;padding:30px 34px;text-align:center">
      <div style="font-size:34px;color:#6a7a86;margin-bottom:20px">내 단골 마트로 바로가기</div>
      <div style="display:flex;flex-wrap:wrap;gap:14px;justify-content:center">
        ${malls.map(([n,c,t])=>`<span style="background:${c};color:${t};font-size:30px;padding:12px 26px;border-radius:28px">${n}</span>`).join('')}
      </div>
    </div>
    <img src="${F('gp_gomhi')}" style="position:absolute;right:-40px;bottom:-150px;width:220px;transform:rotate(6deg);filter:drop-shadow(0 8px 14px rgba(40,60,80,.25))"/>
  </div>
  <div class="foot"><span class="pill" style="background:#2f6a8c;color:#fff">장 볼 거 까먹을 일 없이 🛒</span></div>`)

// 주부 큐레이션 — sage/olive
const curation = page('linear-gradient(160deg,#cdd2a0,#e4e7c6)',
  `<div class="cap"><h1 style="color:#5f6a30">아무거나 말고,<br>써본 것만 나눠요</h1><div class="sub" style="color:#72803a">18년차 주부가 직접 쓰고 좋았던 살림템만 ⭐</div></div>`,
  `<div style="position:absolute;top:600px;left:50%;transform:translateX(-50%);width:740px;display:flex;flex-direction:column;gap:28px">
     ${[['보보리쿡시 보리면','쫄깃하고 속 편한, 든든한 보리면','#c9a84e','🍜'],['모에솔트 대파소금','이거 하나면 간이 딱 맞아요','#7a9b56','🧂'],['위드잇 쯔유스톡','물만 부으면 국물요리 뚝딱','#8b6f4a','🍶']].map(([n,d,c,e],i)=>
       `<div class="panel" style="padding:30px 32px;display:flex;align-items:center;gap:26px;position:relative">
          <div style="width:110px;height:110px;border-radius:26px;background:${c};display:flex;align-items:center;justify-content:center;font-size:56px;color:#fff;flex-shrink:0">${e}</div>
          <div style="flex:1"><div style="font-size:42px;color:#33302b">${n}</div><div style="font-size:32px;color:#8a8570;font-family:'Gaegu';margin-top:4px">${d}</div></div>
          <div style="position:absolute;top:-16px;right:24px;background:#ffcf3f;color:#6a4a10;font-size:28px;padding:8px 22px;border-radius:24px;box-shadow:0 6px 12px rgba(150,110,20,.25)">⭐ 곰펭 PICK</div>
        </div>`).join('')}
     <img src="${F('gp_pengym')}" style="position:absolute;left:-50px;bottom:-140px;width:180px;transform:rotate(-6deg)"/>
     <img src="${F('gp_gomtb')}" style="position:absolute;right:-46px;bottom:-150px;width:210px;transform:rotate(6deg)"/>
  </div>
  <div class="foot"><span class="pill" style="background:#5f6a30;color:#fff">믿고 사는 살림템 🐻👍</span></div>`)

// 인스타 공유 — 바이럴 핵심 (친구가 올린 카드 → 나도)
const insta = page('radial-gradient(circle at 50% 28%,#f7bccb,#f2a0b4 68%,#ec8ea6)',
  `<div class="cap"><h1 style="color:#fffdf8;text-shadow:0 3px 0 rgba(180,70,100,.32)">친구가 올린 저 카드,<br>나도 만들래 📲</h1><div class="sub" style="color:#7a3550">예쁘게 꾸며 인스타·카톡에 톡 — 소문은 저절로</div></div>`,
  `<div style="position:absolute;top:530px;left:50%;transform:translateX(-50%);width:560px">
     <div style="border-radius:56px;padding:8px;background:conic-gradient(from 30deg,#f9a825,#f06292,#ab47bc,#f9a825);box-shadow:0 30px 60px rgba(150,50,80,.35)">
       <div style="background:#fff;border-radius:50px;overflow:hidden;position:relative">
         <div style="display:flex;align-items:center;gap:14px;padding:22px 26px">
           <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#f6c79b,#e3aa73);display:flex;align-items:center;justify-content:center;overflow:hidden"><img src="${F('gp_gomtb')}" style="width:112%"/></div>
           <div style="font-size:34px;color:#333">지현맘</div><div style="font-size:28px;color:#aaa">· 스토리</div>
         </div>
         <div style="position:relative;height:600px;background:linear-gradient(150deg,#fde8ef,#eaf0fb)">
           <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(150,120,80,.14) 5px,transparent 6px);background-size:52px 52px"></div>
           <img src="${F('fj_c05')}" style="position:absolute;top:46%;left:50%;transform:translate(-50%,-50%);width:330px"/>
           <img src="${F('gp_duoht')}" style="position:absolute;right:-8px;bottom:-8px;width:282px"/>
           <span style="position:absolute;top:30px;right:44px;font-size:50px">✨</span>
           <div style="position:absolute;left:28px;bottom:36px;padding:14px 20px;background:#fff6b8;border-radius:9px;transform:rotate(-4deg);font-family:'Gaegu';font-size:34px;color:#6b5330">오늘 저녁 성공 🍲</div>
         </div>
         <div style="display:flex;align-items:center;gap:16px;padding:22px 26px">
           <div style="flex:1;border:3px solid #eee;border-radius:40px;padding:12px 24px;font-size:28px;color:#bbb">메시지 보내기…</div>
           <span style="font-size:44px">🤍</span><span style="font-size:44px">📤</span>
         </div>
       </div>
     </div>
     <div style="position:absolute;left:-84px;top:200px;background:#fff;border-radius:30px 30px 30px 6px;padding:16px 26px;font-family:'Gaegu';font-size:38px;color:#333;box-shadow:0 10px 22px rgba(150,50,80,.22)">헐 이거 뭐야 😍</div>
     <div style="position:absolute;right:-70px;top:440px;background:#fff;border-radius:30px 30px 6px 30px;padding:16px 26px;font-family:'Gaegu';font-size:38px;color:#333;box-shadow:0 10px 22px rgba(150,50,80,.22)">어플 뭐야??</div>
     <div style="position:absolute;left:-56px;bottom:40px;background:#5d3410;color:#fff;border-radius:30px 30px 30px 6px;padding:16px 28px;font-family:'Gaegu';font-size:40px;box-shadow:0 10px 22px rgba(150,50,80,.28)">나도 깔래! 🐻</div>
  </div>
  <div class="foot"><span class="pill" style="background:#fffdf8;color:#c04a68">카드가 곧 광고 — 친구가 따라 와요 💕</span></div>`)

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [name, html] of [['A-shopping', shopping], ['B-curation', curation], ['C-insta', insta]]) {
  const p = await br.newPage({ viewport: { width: 1080, height: 1920 } })
  await p.setContent(html, { waitUntil: 'networkidle' }); await p.waitForTimeout(250)
  await p.screenshot({ path: `${OUT}/${name}.png` }); await p.close()
}
// contact of the 2 new
const imgs = ['C-insta', 'A-shopping', 'B-curation'].map(n => b(`${OUT}/${n}.png`))
const cs = `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0}body{background:#eceae6;padding:24px;display:grid;grid-template-columns:repeat(3,1fr);gap:20px;width:1160px}img{width:100%;border-radius:12px;box-shadow:0 6px 16px rgba(0,0,0,.15)}</style></head><body>${imgs.map(i=>`<img src="${i}"/>`).join('')}</body></html>`
const p = await br.newPage({ viewport: { width: 1160, height: 780 } })
await p.setContent(cs, { waitUntil: 'networkidle' }); await p.waitForTimeout(200)
await p.screenshot({ path: `${OUT}/_new2.png`, fullPage: true })
await br.close()
console.log('rendered 장보기 + 주부큐레이션 →', OUT)
