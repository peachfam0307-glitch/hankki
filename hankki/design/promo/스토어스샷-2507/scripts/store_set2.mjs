import fs from 'fs'
import pw from '/home/user/hankki/hankki/node_modules/playwright-core/index.js'
const { chromium } = pw
const H = '/home/user/hankki/hankki', PH = `${H}/src/assets/stickers/photo`, FT = `${H}/design/promo/fonts`
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/store2'
fs.mkdirSync(OUT, { recursive: true })
const jua = fs.readFileSync(`${FT}/jua-korean-400.woff2`).toString('base64')
const gaegu = fs.readFileSync(`${FT}/gaegu-korean-400.woff2`).toString('base64')
const b = (p) => `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`
const F = (k) => b(`${PH}/${k}.png`)
const gom = F('gp_gomv'), peng = F('gp_pengv'), duo = F('gp_duoh5'), duo2 = F('gp_duotb')
const logo = b(`${H}/design/promo/logo/한끼로고-곰ㅎ-크림-2507.png`)

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
.cgrid{position:absolute;inset:0;background-image:radial-gradient(rgba(150,120,80,.16) 5px,transparent 6px);background-size:52px 52px;}
.tape{position:absolute;top:-24px;left:50%;transform:translateX(-50%) rotate(-2deg);width:230px;height:54px;background:rgba(255,214,150,.85);border:2px dashed rgba(160,110,55,.5);border-radius:6px;}
.spark{position:absolute;filter:drop-shadow(0 2px 3px rgba(0,0,0,.1));}
.postit{position:absolute;padding:16px 20px;border-radius:9px;font-family:'Gaegu';line-height:1.1;box-shadow:0 8px 16px rgba(120,90,30,.22);}
.foot{position:absolute;bottom:88px;left:0;right:0;text-align:center;font-size:42px;}
.pill{padding:16px 40px;border-radius:44px;}
.chip{background:#fff;border-radius:26px;box-shadow:0 8px 18px rgba(90,60,30,.18);display:flex;align-items:center;justify-content:center;}
.holo{position:absolute;inset:0;background:conic-gradient(from 20deg,#ff9aa2,#ffdac1,#e2f0cb,#b5ead7,#c7ceea,#f7c6ff,#ffabe0,#ff9aa2);mix-blend-mode:screen;opacity:.5;}
.shine{position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.55) 48%,transparent 62%);mix-blend-mode:screen;}
</style>`
const page = (bg, cap, body) => `<!doctype html><html><head><meta charset="utf-8">${head}</head><body style="background:${bg}"><div class="dots"></div>${cap}${body}</body></html>`
const S = []

// helper: decorated polaroid card (charHtml/patternCss/decoHtml로 카드마다 다르게)
const card = (opt) => {
  const { food, cover, title, date = '2026.07.24', pengPos, gomW = 224, tape = 1, postit, holo = 0, rot = -4,
    charHtml, patternCss = 'background-image:radial-gradient(rgba(150,120,80,.16) 5px,transparent 6px);background-size:52px 52px',
    decoHtml = '<span class="spark" style="top:26px;right:38px;font-size:54px">✨</span><span class="spark" style="bottom:120px;right:52px;font-size:40px">✨</span>' } = opt
  const defChar = `${pengPos ? `<img src="${peng}" style="position:absolute;left:8px;top:14px;width:146px;transform:rotate(-8deg);filter:drop-shadow(0 8px 12px rgba(90,60,30,.22))"/>` : ''}<img src="${gom}" style="position:absolute;right:-6px;bottom:-10px;width:${gomW}px;transform:rotate(6deg);filter:drop-shadow(0 8px 12px rgba(90,60,30,.25))"/>`
  return `<div class="card" style="width:640px;transform:rotate(${rot}deg)">
    ${tape ? '<div class="tape"></div>' : ''}
    <div class="cover" style="height:600px;background:${cover}">${holo ? '<div class="holo"></div><div class="shine"></div>' : ''}
      <div style="position:absolute;inset:0;${patternCss}"></div>
      ${decoHtml}
      ${food ? `<img src="${F(food)}" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:380px;filter:drop-shadow(0 10px 16px rgba(90,60,30,.22))"/>` : ''}
      ${charHtml || defChar}
      ${postit || ''}
    </div>
    <div style="margin-top:20px;text-align:center"><div style="font-size:52px;color:#33302b">${title}</div><div style="font-size:30px;color:#b3a898">${date}</div></div>
  </div>`
}

// 1 HERO 캐러멜 — 내 레시피 예쁘게
S.push(['1-hero', page('radial-gradient(circle at 30% 16%,#f0c79b,#e3aa73 55%,#d99a5f)',
  `<div class="cap"><h1 style="color:#fffdf8;text-shadow:0 4px 0 rgba(150,95,40,.28)">내 레시피,<br>예쁘게 꾸며요</h1><div class="sub" style="color:#5d3410;opacity:.85">꼬르곰·펭펭이랑 레꾸 — 저 카드, 나도 만들래 ✨</div></div>`,
  `<div style="position:absolute;top:560px;left:50%;transform:translateX(-50%)">${card({food:'fh_k22',cover:'linear-gradient(150deg,#e9f2e6,#fbe9d6)',title:'엄마표 김밥',charHtml:`<img src="${F('gp_gomft')}" style="position:absolute;right:-8px;bottom:-6px;width:232px;transform:rotate(4deg);filter:drop-shadow(0 8px 12px rgba(90,60,30,.25))"/>`,decoHtml:`<span class="spark" style="top:30px;right:44px;font-size:52px">✨</span><span class="spark" style="top:150px;left:44px;font-size:46px">❤️</span>`,postit:`<div class="postit" style="left:32px;bottom:42px;width:236px;background:#fff6b8;transform:rotate(-5deg);font-size:38px;color:#6b5330;text-align:center">오늘 한 끼 완성! 🍳</div>`})}</div>
   <div class="foot"><span class="pill" style="background:#5d3410;color:#fffdf8">탭 한 번이면 뚝딱 🐻</span></div>`)])

// 2 꾸미기 민트 — 레시피 정리? 우린 레시피 레꾸해요
S.push(['2-decorate', page('linear-gradient(160deg,#d3e3c8,#eaf2e2)',
  `<div class="cap"><h1 style="color:#4a6b42">레시피 정리?<br>우린 레시피 레꾸해요</h1><div class="sub" style="color:#5f7a54">레시피 꾸미기 = 레꾸! 곰펭이랑 톡톡 꾸며요</div></div>`,
  `<div style="position:absolute;top:560px;left:50%;transform:translateX(-50%);text-align:center">
     ${card({food:'fy_y10',cover:'linear-gradient(150deg,#fde8ef,#eaf0fb)',title:'폭신 오므라이스',rot:-3,patternCss:'background-image:repeating-linear-gradient(48deg,rgba(255,255,255,.5) 0 14px,transparent 14px 38px)',charHtml:`<img src="${F('gp_pengv')}" style="position:absolute;left:-6px;bottom:-8px;width:198px;transform:rotate(-5deg);filter:drop-shadow(0 8px 12px rgba(90,60,30,.22))"/>`,decoHtml:`<span class="spark" style="top:36px;right:40px;font-size:48px">⭐</span><span class="spark" style="bottom:160px;right:56px;font-size:44px">🌸</span><span class="spark" style="top:150px;left:52px;font-size:38px">💫</span>`,postit:`<div class="postit" style="right:28px;bottom:36px;background:#c9e8ff;transform:rotate(4deg);font-size:36px;color:#3a6a86">내 최애 ♡</div>`})}
     <div style="margin-top:34px;background:#fff;border-radius:36px;padding:28px 24px;box-shadow:0 16px 34px rgba(70,90,60,.2);width:640px;display:flex;justify-content:space-between;align-items:center">
       ${['gp_gomhi','gp_penghi','fh_k27','fe_15'].map(k=>`<div class="chip" style="width:120px;height:120px"><img src="${F(k)}" style="width:80%"/></div>`).join('')}
       <div class="chip" style="width:120px;height:120px;font-size:54px;background:#5d3410;color:#fff">＋</div>
     </div>
     <div style="margin-top:24px;font-family:'Gaegu';font-size:40px;color:#4a6b42">👆 톡 눌러 붙이기만 하면 끝!</div>
  </div>`)])

// 3 자랑 피치 — 오늘 뭐 해먹지 말고, 오늘 뭐 해냈지
S.push(['3-share', page('linear-gradient(160deg,#f6cfc2,#fae0d6)',
  `<div class="cap"><h1 style="color:#b5573f;font-size:80px">오늘 뭐 해먹지 말고,<br>오늘 뭐 해냈지</h1><div class="sub" style="color:#a35f4a">예쁘게 꾸며서 카톡·인스타로 톡 자랑</div></div>`,
  `<div style="position:absolute;top:640px;left:50%;transform:translateX(-50%);width:920px;height:680px">
     ${[['fj_c05','#fbe9d6','-15deg','-250px','80px','.9'],['fy_y06','#eae6fb','0deg','0px','-10px','1.05'],['fi_j01','#e6f0e9','15deg','250px','80px','.9']].map(([k,bg,rot,tx,ty,sc])=>
       `<div class="card" style="width:400px;position:absolute;left:50%;top:0;transform:translateX(-50%) translate(${tx},${ty}) rotate(${rot}) scale(${sc})">
          <div class="cover" style="height:400px;background:linear-gradient(150deg,${bg},#fff)"><div class="cgrid"></div>
            <img src="${F(k)}" style="position:absolute;top:48%;left:50%;transform:translate(-50%,-50%);width:250px"/>
            <img src="${gom}" style="position:absolute;right:-6px;bottom:-6px;width:128px"/></div></div>`).join('')}
  </div>
  <div class="foot"><span class="pill" style="background:#5d3410;color:#fffdf8">🔗 꾸민 그대로 이미지 공유</span></div>`)])

// 4 글자만 카드 라벤더 — 이모지 빼고 글자로만도
S.push(['4-textcard', page('linear-gradient(160deg,#d8cbe8,#eae2f4)',
  `<div class="cap"><h1 style="color:#6a5090">이모지 빼고,<br>글자로만도 예뻐요</h1><div class="sub" style="color:#7d669f">곰펭이 얹으면 뭐든 레꾸 완성</div></div>`,
  `<div style="position:absolute;top:600px;left:50%;transform:translateX(-50%)"><div class="card" style="width:640px;transform:rotate(3deg)">
     <div class="tape"></div>
     <div class="cover" style="height:600px;background:linear-gradient(150deg,#efe6fb,#fdeef4)"><div class="cgrid"></div>
       <span class="spark" style="top:40px;left:44px;font-size:50px">💜</span><span class="spark" style="bottom:60px;left:60px;font-size:44px">✨</span>
       <div style="position:absolute;top:44%;left:50%;transform:translate(-50%,-50%) rotate(-3deg);text-align:center;font-family:'Gaegu';font-size:120px;color:#6a5090;line-height:1.05">오늘의<br>한 끼 ♡</div>
       <img src="${peng}" style="position:absolute;left:2px;bottom:-8px;width:170px;transform:rotate(-6deg)"/>
       <img src="${gom}" style="position:absolute;right:-6px;bottom:-10px;width:200px;transform:rotate(6deg)"/>
       <div class="postit" style="right:34px;top:36px;background:#e5d6ff;transform:rotate(6deg);font-size:34px;color:#5a4482">참 잘했어요!</div>
     </div>
     <div style="margin-top:20px;text-align:center"><div style="font-size:52px;color:#33302b">비 오는 날 부침개</div><div style="font-size:30px;color:#b3a898">2026.07.24</div></div>
  </div></div>`)])

// 5 아이콘 그리드 버터 — 이모지 자동
const grid = ['fh_k01','fh_k22','fy_y03','fi_j01','fh_k27','fj_c05','fy_y06','fy_y10','fe_08','fe_09','fi_j04','fh_k02']
S.push(['5-icons', page('linear-gradient(160deg,#f4e2a4,#f9edc2)',
  `<div class="cap"><h1 style="color:#9a7b1e">이모지 넣으면<br>자동으로 예쁘게</h1><div class="sub" style="color:#8a7326">요리 이름만 쓰면 착 — 88종 (사진 없어도!)</div></div>`,
  `<div style="position:absolute;top:600px;left:50%;transform:translateX(-50%);width:860px;display:grid;grid-template-columns:repeat(3,1fr);gap:32px">
     ${grid.map(k=>`<div style="aspect-ratio:1;background:linear-gradient(135deg,#fffdf8,#f3ecd8);border-radius:34px;box-shadow:0 12px 24px rgba(150,120,40,.16);display:flex;align-items:center;justify-content:center"><img src="${F(k)}" style="width:72%"/></div>`).join('')}
  </div>
  <div class="foot"><span class="pill" style="background:#5d3410;color:#fffdf8">한식·양식·중식·일식·분식 🍚</span></div>`)])

// 6 다크+홀로 스페셜
S.push(['6-holo', page('radial-gradient(circle at 50% 30%,#2e2a3e,#211d30 70%,#181524)',
  `<div class="cap"><h1 style="color:#fff;text-shadow:0 0 30px rgba(200,180,255,.6)">꼬르곰·펭펭<br>홀로그램 스페셜 ✨</h1><div class="sub" style="color:#c7bdf0">반짝이는 스페셜 레꾸 테마</div></div>`,
  `<div style="position:absolute;top:580px;left:50%;transform:translateX(-50%)">${card({food:'fi_j04',cover:'linear-gradient(150deg,#3a3350,#4a3f66)',title:'<span style=\"color:#fff\">한밤의 라멘</span>',date:'✦ SPECIAL ✦',pengPos:1,holo:1,rot:-3,postit:`<div class="postit" style="left:30px;bottom:38px;background:linear-gradient(120deg,#ffd6f5,#d6f5ff);transform:rotate(-5deg);font-size:34px;color:#5a4482">✨holo✨</div>`})}</div>
   <div class="foot"><span class="pill" style="background:linear-gradient(120deg,#f7c6ff,#c7ceea);color:#3a3350">🌙 스페셜 · 띠부씰 감성</span></div>`)])

// 7 여름버전 아쿠아
S.push(['7-summer', page('linear-gradient(165deg,#a8e0ef,#cdeef5 60%,#e6f7fb)',
  `<div class="cap"><h1 style="color:#2f7d94">시원한<br>여름 한 끼 🍧</h1><div class="sub" style="color:#4a94aa">곰펭이랑 여름 레꾸 — 얼음처럼 상큼하게</div></div>`,
  `<div style="position:absolute;top:560px;left:50%;transform:translateX(-50%)">${card({food:'fe_15',cover:'linear-gradient(150deg,#d6f0f7,#eafaf0)',title:'아보카도 스무디',pengPos:1,rot:-4,postit:`<div class="postit" style="left:30px;bottom:40px;background:#bdeeff;transform:rotate(-5deg);font-size:36px;color:#2f7d94">여름엔 이거지 😎</div>`})}
     <span class="spark" style="position:absolute;top:-20px;left:60px;font-size:60px">💧</span></div>
   <div class="foot"><span class="pill" style="background:#2f7d94;color:#fff">☀️ 여름 시즌 테마</span></div>`)])

// 8 감정 모카
S.push(['8-emotion', page('radial-gradient(circle at 50% 42%,#8a6a4c,#6f5238 70%,#5f4630)',
  `<div class="cap"><h1 style="color:#fff6ea">오늘도 한 끼,<br>해냈어요</h1><div class="sub" style="color:#e8d3bd">요리하는 나를 위한 작은 위로 🐻</div></div>`,
  `<div style="position:absolute;top:640px;left:50%;transform:translateX(-50%);width:760px;height:720px;display:flex;align-items:center;justify-content:center">
     <div style="position:absolute;width:640px;height:640px;border-radius:50%;background:radial-gradient(circle,rgba(255,244,230,.5),rgba(255,244,230,0) 68%)"></div>
     <img src="${F('gp_gomtb')}" style="width:520px;filter:drop-shadow(0 20px 30px rgba(40,25,10,.4))"/>
     <span class="spark" style="top:70px;left:90px;font-size:60px">💛</span><span class="spark" style="bottom:120px;right:100px;font-size:52px">✨</span>
  </div><div class="foot"><span class="pill" style="background:#fff6ea;color:#6f5238">감정 레시피북 · 한끼</span></div>`)])

// 9 브랜드 CTA 코랄 — 꼬르곰·펭펭이랑
S.push(['9-brand', page('radial-gradient(circle at 50% 30%,#f6b49e,#ee9a80 70%,#e5896d)',
  `<div class="cap"><h1 style="color:#fffdf8;text-shadow:0 4px 0 rgba(160,80,55,.3)">꼬르곰·펭펭이랑,<br>감정 레시피북</h1></div>`,
  `<div style="position:absolute;top:520px;left:50%;transform:translateX(-50%);text-align:center;width:900px">
     <img src="${F('gp_duotb')}" style="width:560px;filter:drop-shadow(0 18px 26px rgba(120,50,30,.35))"/>
     <div style="margin-top:36px;background:#fffdf8;border-radius:40px;padding:44px 40px;box-shadow:0 20px 40px rgba(150,70,45,.28)">
       <img src="${F('gp_duohi')}" style="width:300px"/><div style="margin-top:14px;font-size:38px;color:#7a5238">내 레시피를 예쁘게, 레꾸해요</div></div>
  </div><div class="foot"><span class="pill" style="background:#5d3410;color:#fffdf8">지금 한끼 시작하기 🐻🐧</span></div>`)])

const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [name, html] of S) {
  const p = await br.newPage({ viewport: { width: 1080, height: 1920 } })
  await p.setContent(html, { waitUntil: 'networkidle' }); await p.waitForTimeout(250)
  await p.screenshot({ path: `${OUT}/${name}.png` }); await p.close()
}
const imgs = S.map(([n]) => b(`${OUT}/${n}.png`))
const csHtml = `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0;box-sizing:border-box}body{background:#eceae6;padding:26px;display:grid;grid-template-columns:repeat(3,1fr);gap:20px;width:1100px}img{width:100%;border-radius:12px;box-shadow:0 6px 16px rgba(0,0,0,.15)}</style></head><body>${imgs.map(i => `<img src="${i}"/>`).join('')}</body></html>`
const p = await br.newPage({ viewport: { width: 1100, height: 2000 } })
await p.setContent(csHtml, { waitUntil: 'networkidle' }); await p.waitForTimeout(250)
await p.screenshot({ path: `${OUT}/_contact.png`, fullPage: true })
await br.close()
console.log('rendered', S.length, 'screens + contact →', OUT)
