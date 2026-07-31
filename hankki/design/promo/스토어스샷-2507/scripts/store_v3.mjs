// 🏪 스토어 스크린샷 8장 — v3 (2026-07-31)
//
// 왜 다시 만드나 (= `docs/AAB-재빌드때-한번에-2026-07-31.md` §3)
//   ① 문구가 앱과 다르다 — 스샷은 7/24에 그렸고 앱은 v8.71에 바뀌었다
//   ② ⛔ 유니코드 이모지가 박혀 있다 — 앱 UI는 v8.63~8.98에 전부 우리 스티커로 갈았는데 스샷만 남았다
//   ③ 🐛 `🍳` 가 **돋보기로 깨져** 렌더된 채 스토어에 올라가 있다(렌더 환경에 이모지 폰트가 없어 대체됨)
//   ④ 「88종」이 낡았다 — 지금 218종
//   ⑤ ⛔「곰펭」이 3곳 — 결과물엔 **꼬르곰·펭펭** 풀네임 (CLAUDE.md 규칙)
//   ⑥ ⛔「흩어진」이 ⑧에 남아 있다 — v8.28~29에 폐기한 옛 브랜드 문구
//   📌 여섯 다 뿌리가 같다 — **스샷을 앱 밖에서 따로 그려서 앱이 바뀌어도 안 따라온다.**
//
// ⭐ 이모지를 안 쓰는 게 왜 「스타일」이 아니라 「안전」인가
//   렌더 환경에 이모지 폰트가 없으면 **다른 글자로 조용히 대체된다.** 🍳가 돋보기가 된 게 그거다.
//   우리 스티커 `<img>` 는 파일이라 그런 일이 없다. → 아래 EMOJI 검사로 **자동 차단**한다.
//
// 실행: node design/promo/스토어스샷-2507/scripts/store_v3.mjs
import fs from 'fs'
import pw from '/home/user/hankki/hankki/node_modules/playwright-core/index.js'
const { chromium } = pw
const H = '/home/user/hankki/hankki'
const PH = `${H}/src/assets/stickers/photo`, UI = `${H}/src/assets/ui`, CU = `${H}/src/assets/curation`
const FT = `${H}/design/promo/fonts`
const OUT = `${H}/design/promo/스토어스샷-2507/renders-v3`
fs.mkdirSync(OUT, { recursive: true })

const jua = fs.readFileSync(`${FT}/jua-korean-400.woff2`).toString('base64')
const gaegu = fs.readFileSync(`${FT}/gaegu-korean-400.woff2`).toString('base64')
const b = (p) => `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`
const F = (k) => b(`${PH}/${k}.png`)
const U = (k) => b(`${UI}/${k}.png`)
const C = (k) => b(`${CU}/${k}.png`)
const gom = F('gp_gomv'), peng = F('gp_pengv')
const logo = b(`${H}/design/promo/logo/한끼로고-곰ㅎ-크림-2507.png`)

// 우리 라인 아이콘 — `src/components/Icon.jsx` 와 같은 path (이모지 대체)
const line = (d, col = 'currentColor', sw = 2) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;vertical-align:-.12em">${d}</svg>`
const ICart = (c, sw) => line('<path d="M4 5h2l2 11h9l2-8H7"/><circle cx="9" cy="19" r="1.2"/><circle cx="17" cy="19" r="1.2"/>', c, sw)
const IHeart = (c, sw) => line('<path d="M12 20s-7-4.5-9.2-9C1.3 8 3 5 6 5c2 0 3.2 1.4 4 2.5C10.8 6.4 12 5 14 5c3 0 4.7 3 3.2 6-2.2 4.5-9.2 9-9.2 9z"/>', c, sw)
const IShare = (c, sw) => line('<path d="M12 3.5v10.5"/><path d="m8 7.5 4-4 4 4"/><path d="M7.5 11H6a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-1.5"/>', c, sw)
// 스티커 조각 — 이모지 자리에 들어가는 우리 그림
const spark = (css) => `<img src="${F('dn_sparkle')}" style="position:absolute;${css}"/>`
const star = (css) => `<img src="${F('dn_star')}" style="position:absolute;${css}"/>`

const head = `<style>
@font-face{font-family:'Jua';src:url(data:font/woff2;base64,${jua}) format('woff2');}
@font-face{font-family:'Gaegu';src:url(data:font/woff2;base64,${gaegu}) format('woff2');}
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1920px;font-family:'Jua',sans-serif;overflow:hidden;position:relative;}
.dots{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.32) 9px,transparent 10px);background-size:100px 100px;}
.cap{position:absolute;top:104px;left:0;right:0;text-align:center;z-index:9;padding:0 56px;}
.cap h1{font-size:88px;line-height:1.15;letter-spacing:-1px;}
.cap .sub{margin-top:18px;font-size:38px;}
.card{background:#fffdf8;border-radius:42px;padding:26px 26px 30px;box-shadow:0 30px 60px rgba(90,60,30,.3);position:relative;}
.cover{position:relative;border-radius:28px;overflow:hidden;}
.cgrid{position:absolute;inset:0;background-image:radial-gradient(rgba(150,120,80,.16) 5px,transparent 6px);background-size:52px 52px;}
.tape{position:absolute;top:-24px;left:50%;transform:translateX(-50%) rotate(-2deg);width:230px;height:54px;background:rgba(255,214,150,.85);border:2px dashed rgba(160,110,55,.5);border-radius:6px;}
.postit{position:absolute;padding:16px 20px;border-radius:9px;font-family:'Gaegu';line-height:1.1;box-shadow:0 8px 16px rgba(120,90,30,.22);}
.foot{position:absolute;bottom:88px;left:0;right:0;text-align:center;font-size:40px;}
.pill{padding:16px 40px;border-radius:44px;display:inline-flex;align-items:center;gap:14px;}
.pill img{height:46px}
.chip{background:#fff;border-radius:26px;box-shadow:0 8px 18px rgba(90,60,30,.18);display:flex;align-items:center;justify-content:center;}
.panel{background:#fffdf8;border-radius:40px;box-shadow:0 26px 54px rgba(60,70,90,.24);}
</style>`
const page = (bg, cap, body) => `<!doctype html><html><head><meta charset="utf-8">${head}</head><body style="background:${bg}"><div class="dots"></div>${cap}${body}</body></html>`
const S = []

const card = (opt) => {
  const { food, cover, title, date = '2026.07.31', gomW = 224, tape = 1, postit, rot = -4, charHtml,
    patternCss = 'background-image:radial-gradient(rgba(150,120,80,.16) 5px,transparent 6px);background-size:52px 52px',
    decoHtml = spark('top:22px;right:34px;width:70px') } = opt
  return `<div class="card" style="width:640px;transform:rotate(${rot}deg)">
    ${tape ? '<div class="tape"></div>' : ''}
    <div class="cover" style="height:600px;background:${cover}">
      <div style="position:absolute;inset:0;${patternCss}"></div>
      ${decoHtml}
      ${food ? `<img src="${F(food)}" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:380px;filter:drop-shadow(0 10px 16px rgba(90,60,30,.22))"/>` : ''}
      ${charHtml || `<img src="${gom}" style="position:absolute;right:-6px;bottom:-10px;width:${gomW}px;transform:rotate(6deg);filter:drop-shadow(0 8px 12px rgba(90,60,30,.25))"/>`}
      ${postit || ''}
    </div>
    <div style="margin-top:20px;text-align:center"><div style="font-size:52px;color:#33302b">${title}</div><div style="font-size:30px;color:#b3a898">${date}</div></div>
  </div>`
}

// ───────────────────────────────────────────────────────── ① 히어로
// ⭐ 제목 = v8.71 확정 브랜드 한 줄. 창업자가 여러 후보 중 고른 말인데
//    정작 제일 많이 보는 자리(스토어 첫 장)에 안 걸려 있었다.
// 🐛 포스트잇의 `🍳` 가 돋보기로 깨져 스토어에 올라가 있었다 → 글자만 남긴다.
S.push(['01-히어로', page('radial-gradient(circle at 30% 16%,#f0c79b,#e3aa73 55%,#d99a5f)',
  `<div class="cap"><h1 style="color:#fffdf8;text-shadow:0 4px 0 rgba(150,95,40,.28)">한 끼를 해낸다면,<br>레꾸하세요.</h1>
   <div class="sub" style="color:#5d3410;opacity:.85">꼬르곰·펭펭이랑 레꾸 — 저 카드, 나도 만들래</div></div>`,
  `<div style="position:absolute;top:560px;left:50%;transform:translateX(-50%)">${card({
     food: 'fh_k22', cover: 'linear-gradient(150deg,#e9f2e6,#fbe9d6)', title: '엄마표 김밥',
     charHtml: `<img src="${F('gp_gomft')}" style="position:absolute;right:-8px;bottom:-6px;width:232px;transform:rotate(4deg);filter:drop-shadow(0 8px 12px rgba(90,60,30,.25))"/>`,
     decoHtml: spark('top:26px;right:38px;width:76px') + spark('bottom:150px;left:40px;width:56px'),
     postit: `<div class="postit" style="left:32px;bottom:42px;width:236px;background:#fff6b8;transform:rotate(-5deg);font-size:38px;color:#6b5330;text-align:center">오늘 한 끼 완성!</div>` })}</div>
   <div class="foot"><span class="pill" style="background:#5d3410;color:#fffdf8"><img src="${F('gp_gomhi')}"/>탭 한 번이면 뚝딱</span></div>`)])

// ───────────────────────────────────────────────────────── ② 레꾸
// ⭐ Sub = v8.71 확정 "레꾸하면, 한 끼가 추억이 된다"
// ⛔ 옛 문구의 「곰펭이랑」 → 꼬르곰·펭펭 (결과물엔 풀네임)
S.push(['02-레꾸', page('linear-gradient(160deg,#d3e3c8,#eaf2e2)',
  `<div class="cap"><h1 style="color:#4a6b42">레시피 정리?<br>우린 레시피 레꾸해요</h1>
   <div class="sub" style="color:#5f7a54">레꾸하면, 한 끼가 추억이 된다</div></div>`,
  `<div style="position:absolute;top:560px;left:50%;transform:translateX(-50%);text-align:center">
     ${card({ food: 'fe_06', cover: 'linear-gradient(150deg,#fbf5e8,#f2ecda)', title: '연어 포케볼', rot: -3, tape: 0,
       
       charHtml: `<img src="${F('gp_pengv')}" style="position:absolute;left:-6px;bottom:-8px;width:198px;transform:rotate(-5deg);filter:drop-shadow(0 8px 12px rgba(90,60,30,.22))"/>`,
       decoHtml: star('top:30px;right:36px;width:80px') + spark('bottom:150px;right:48px;width:64px') + spark('top:146px;left:44px;width:56px'),
       postit: `<div class="postit" style="right:26px;bottom:38px;background:#dbe8d4;transform:rotate(3deg);font-size:36px;color:#4a6b42">내 최애 ♡</div>` })}
     <div style="margin-top:34px;background:#fff;border-radius:36px;padding:28px 24px;box-shadow:0 16px 34px rgba(70,90,60,.2);width:640px;display:flex;justify-content:space-between;align-items:center">
       ${['gp_gomhi', 'gp_penghi', 'fh_k27', 'fe_15'].map(k => `<div class="chip" style="width:120px;height:120px"><img src="${F(k)}" style="width:80%"/></div>`).join('')}
       <div class="chip" style="width:120px;height:120px;font-size:54px;background:#5d3410;color:#fff">＋</div>
     </div>
     <div style="margin-top:24px;font-family:'Gaegu';font-size:40px;color:#4a6b42;display:flex;align-items:center;justify-content:center;gap:12px">
       <img src="${U('hand_point')}" style="height:52px"/>톡 눌러 붙이기만 하면 끝!</div>
  </div>`)])

// ───────────────────────────────────────────────────────── ③ 인스타 공유
// ⛔ 📲🤍📤😍🍲 전부 제거 — 인스타 UI 흉내 자리는 우리 라인 아이콘으로(온보딩과 같은 방식)
S.push(['03-인스타공유', page('radial-gradient(circle at 50% 28%,#f7bccb,#f2a0b4 68%,#ec8ea6)',
  `<div class="cap"><h1 style="color:#fffdf8;text-shadow:0 3px 0 rgba(180,70,100,.32);font-size:80px">예쁜 카드 한 장으로,<br>센스있게 레시피 공유</h1>
   <div class="sub" style="color:#7a3550">내 한끼를 친구들과 나눠요</div>
   <div style="margin-top:26px;display:flex;gap:18px;justify-content:center">
     ${[['인스타 스토리', 'conic-gradient(from 30deg,#f9a825,#f06292,#ab47bc,#f9a825)'], ['카카오톡', '#ffe812']].map(([t, bg]) =>
       `<span style="background:#fffdf8;border-radius:38px;padding:12px 28px;font-size:32px;color:#7a3550;display:inline-flex;align-items:center;gap:12px;box-shadow:0 8px 18px rgba(150,50,80,.2)"><span style="width:38px;height:38px;border-radius:11px;background:${bg}"></span>${t}</span>`).join('')}
   </div></div>`,
  `<div style="position:absolute;top:620px;left:50%;transform:translateX(-50%);width:560px">
     <div style="border-radius:56px;padding:8px;background:conic-gradient(from 30deg,#f9a825,#f06292,#ab47bc,#f9a825);box-shadow:0 30px 60px rgba(150,50,80,.35)">
       <div style="background:#fff;border-radius:50px;overflow:hidden;position:relative">
         <div style="display:flex;align-items:center;gap:14px;padding:22px 26px">
           <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#f6c79b,#e3aa73);display:flex;align-items:center;justify-content:center;overflow:hidden"><img src="${F('gp_gomtb')}" style="width:112%"/></div>
           <div style="font-size:34px;color:#333">꼬르곰맘</div><div style="font-size:28px;color:#aaa">· 스토리</div>
         </div>
         <div style="position:relative;height:640px;background:linear-gradient(150deg,#fdf3e8,#f7ecdf)">
           <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(150,120,80,.14) 5px,transparent 6px);background-size:52px 52px"></div>
           <div style="position:absolute;top:22px;left:50%;transform:translateX(-50%) rotate(-2deg);padding:10px 30px;background:#f0b7c6;background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.5) 0 10px,transparent 10px 20px),repeating-linear-gradient(90deg,rgba(255,255,255,.5) 0 10px,transparent 10px 20px);border-radius:4px;box-shadow:0 6px 13px rgba(150,90,90,.22);font-family:'Gaegu';font-size:38px;color:#7a4a52;white-space:nowrap">감바스 알 아히요</div>
           <img src="${F('fe_08')}" style="position:absolute;top:52%;left:50%;transform:translate(-50%,-50%);width:340px"/>
           <img src="${F('gp_duoht')}" style="position:absolute;right:-6px;bottom:-6px;width:270px"/>
           <img src="${F('dn_star')}" style="position:absolute;top:150px;right:34px;width:74px"/>
           <img src="${F('ch_che04')}" style="position:absolute;top:330px;left:26px;width:72px"/>
           ${spark('top:250px;left:150px;width:52px')}
           <div style="position:absolute;left:26px;bottom:44px;padding:14px 20px;background:#fff6b8;border-radius:9px;transform:rotate(-4deg);font-family:'Gaegu';font-size:34px;color:#6b5330;line-height:1.15">오늘 저녁<br>성공!</div>
         </div>
         <div style="display:flex;align-items:center;gap:18px;padding:22px 26px;color:#555">
           <div style="flex:1;border:3px solid #eee;border-radius:40px;padding:12px 24px;font-size:28px;color:#bbb">메시지 보내기…</div>
           <span style="font-size:44px">${IHeart('#e06a8a', 2.2)}</span><span style="font-size:40px">${IShare('#8a8a8a', 2.2)}</span>
         </div>
       </div>
     </div>
     <div style="position:absolute;left:-96px;top:250px;background:#fff;border-radius:30px 30px 30px 6px;padding:16px 26px;font-family:'Gaegu';font-size:38px;color:#333;box-shadow:0 10px 22px rgba(150,50,80,.22)">우와 맛있겠다</div>
     <div style="position:absolute;right:-88px;top:520px;background:#fff;border-radius:30px 30px 6px 30px;padding:16px 26px;font-family:'Gaegu';font-size:38px;color:#333;box-shadow:0 10px 22px rgba(150,50,80,.22)">레시피 공유해줘</div>
     <div style="position:absolute;left:-64px;bottom:96px;background:#5d3410;color:#fff;border-radius:30px 30px 30px 6px;padding:14px 28px;font-family:'Gaegu';font-size:40px;box-shadow:0 10px 22px rgba(150,50,80,.28)">같이 해먹자!</div>
  </div>
  <div class="foot"><span class="pill" style="background:#fffdf8;color:#c04a68">센스있는 레시피 한 장, 친구에게 톡</span></div>`)])

// ───────────────────────────────────────────────────────── ④ 음식 아이콘
// ⚠️ 「88종」이 낡았다 → 218종. 앱에서 부르는 이름도 '이모지'가 아니라 '음식 아이콘'이다.
const grid = ['fh_k01', 'fh_k22', 'fy_y03', 'fi_j01', 'fh_k27', 'fj_c05', 'fy_y06', 'fy_y10', 'fe_08', 'fe_09', 'fi_j04', 'fh_k02']
S.push(['04-음식아이콘', page('linear-gradient(160deg,#f4e2a4,#f9edc2)',
  `<div class="cap"><h1 style="color:#9a7b1e">요리 이름만 쓰면,<br>이모지가 착!</h1>
   <div class="sub" style="color:#8a7326">사진 없어도 예쁘게 — 218종 자동으로</div></div>`,
  `<div style="position:absolute;top:600px;left:50%;transform:translateX(-50%);width:860px;display:grid;grid-template-columns:repeat(3,1fr);gap:32px">
     ${grid.map(k => `<div style="aspect-ratio:1;background:linear-gradient(135deg,#fffdf8,#f3ecd8);border-radius:34px;box-shadow:0 12px 24px rgba(150,120,40,.16);display:flex;align-items:center;justify-content:center"><img src="${F(k)}" style="width:72%"/></div>`).join('')}
  </div>
  <div class="foot"><span class="pill" style="background:#5d3410;color:#fffdf8">한식·양식·중식·일식·분식</span></div>`)])

// ───────────────────────────────────────────────────────── ⑤ 장보기
// ⛔ 마트·제품 «브랜드명» 안 쓴다 (창업자 2026-07-31 *"큐레이션 브랜드명 안쓰기로했어"* · *"장보기도.."*)
//   우리 레시피 표기 원칙과 같다(v8.23~31: 재료는 일반명, 제품명은 메모에만).
//   ⚠️ 스토어 스크린샷은 «남의 상표»를 우리 홍보물에 박는 자리라 제일 조심할 곳이다.
//   ⭐ 예전 최종본도 이렇게 «종류»로 돼 있었다 — 내가 옛 스크립트에서 브랜드판을 가져온 게 실수.
const malls = [['새벽배송', '#5f8fb0', '#fff'], ['대형몰', '#7a8a99', '#fff'], ['친환경마켓', '#7aa05a', '#fff'], ['오픈마켓', '#c08a5a', '#fff'], ['동네마트', '#9a7fb0', '#fff']]
S.push(['05-장보기', page('linear-gradient(160deg,#a9cadd,#d0e3ee)',
  `<div class="cap"><h1 style="color:#2f6a8c">재료, 한 번에<br>사러가기 <span style="font-size:.9em">${ICart('#2f6a8c', 2.2)}</span></h1>
   <div class="sub" style="color:#3f7d9e">레시피 재료 그대로 톡 — 여러 마트로 바로</div></div>`,
  `<div style="position:absolute;top:560px;left:50%;transform:translateX(-50%);width:720px">
    <div class="panel" style="padding:44px 40px">
      <div style="display:flex;align-items:center;gap:18px;border-bottom:3px dashed #e6e0d4;padding-bottom:22px;margin-bottom:12px">
        <div style="width:96px;height:96px;border-radius:22px;background:linear-gradient(135deg,#fffdf8,#f0ece0);display:flex;align-items:center;justify-content:center"><img src="${F('fh_k02')}" style="width:80%"/></div>
        <div><div style="font-size:46px;color:#33302b">김치찌개 재료</div><div style="font-size:30px;color:#a99">돼지고기·두부·대파·김치…</div></div>
      </div>
      ${[['돼지고기 앞다리'], ['두부 한 모'], ['대파 한 단']].map(([n]) =>
        `<div style="display:flex;align-items:center;justify-content:space-between;padding:20px 6px;border-bottom:2px solid #f2ede2">
           <div style="font-size:40px;color:#4a4438">・ ${n}</div>
           <div style="background:#5f8fb0;color:#fff;font-size:30px;padding:12px 30px;border-radius:30px;display:inline-flex;align-items:center;gap:10px">담기 ${ICart('#fff', 2.4)}</div></div>`).join('')}
    </div>
    <div class="panel" style="margin-top:30px;padding:30px 34px;text-align:center">
      <div style="font-size:36px;color:#2f6a8c;display:flex;align-items:center;justify-content:center;gap:12px">내가 자주 쓰는 마트로 바로 ${ICart('#2f6a8c', 2.2)}</div>
      <div style="font-size:28px;color:#8a97a2;margin:8px 0 20px">원하는 곳으로 톡 — 장바구니째 이동</div>
      <div style="display:flex;flex-wrap:wrap;gap:14px;justify-content:center">
        ${malls.map(([n, c, t]) => `<span style="background:${c};color:${t};font-size:30px;padding:12px 26px;border-radius:28px">${n}</span>`).join('')}
      </div>
    </div>
    <img class="char" src="${b(`${H}/src/assets/sharepool/duo_cart.png`)}" style="position:absolute;left:50%;transform:translateX(-50%);bottom:-295px;width:270px;filter:drop-shadow(0 10px 16px rgba(40,60,80,.25))"/>
  </div>
  <div class="foot"><span class="pill" style="background:#2f6a8c;color:#fff">장 볼 거 까먹을 일 없이 ${ICart('#fff', 2.2)}</span></div>`)])

// ───────────────────────────────────────────────────────── ⑥ 큐레이션
// ⭐ 제품 이모지 🍜🧂🍶 → 쇼핑 화면에서 쓰는 **진짜 제품 일러**(온보딩 v8.98과 같은 교체)
// ⛔ 「곰펭 PICK」 → 꼬르곰·펭펭 PICK (결과물엔 풀네임)
S.push(['06-큐레이션', page('linear-gradient(160deg,#cdd2a0,#e4e7c6)',
  `<div class="cap"><h1 style="color:#5f6a30">아무거나 말고,<br>써본 것만 나눠요</h1>
   <div class="sub" style="color:#72803a">18년차 주부가 직접 쓰고 좋았던 살림템만</div></div>`,
  `<div style="position:absolute;top:600px;left:50%;transform:translateX(-50%);width:740px;display:flex;flex-direction:column;gap:28px">
     ${[['든든한 보리면', '쫄깃하고 속 편한, 든든한 한 끼', '#e8dfc2', 'cu_noodle'],
        ['만능 대파소금', '이거 하나면 간이 딱 맞아요', '#dce8cf', 'cu_salt'],
        ['간편 쯔유 스톡', '물만 부으면 국물요리 뚝딱', '#e3d8c7', 'cu_stock_tsuyu']].map(([n, d, c, k]) =>
       `<div class="panel" style="padding:30px 32px;display:flex;align-items:center;gap:26px;position:relative">
          <div style="width:118px;height:118px;border-radius:26px;background:#fff;border:3px solid ${c};display:flex;align-items:center;justify-content:center;flex-shrink:0"><img src="${C(k)}" style="width:88%"/></div>
          <div style="flex:1"><div style="font-size:42px;color:#33302b">${n}</div><div style="font-size:32px;color:#8a8570;font-family:'Gaegu';margin-top:4px">${d}</div></div>
          <div style="position:absolute;top:-16px;right:20px;background:#ffcf3f;color:#6a4a10;font-size:25px;padding:8px 20px;border-radius:24px;box-shadow:0 6px 12px rgba(150,110,20,.25);display:inline-flex;align-items:center;gap:8px"><img src="${F('dn_star')}" style="height:32px"/>꼬르곰·펭펭 PICK</div>
        </div>`).join('')}
     <img class="char" src="${b(`${H}/src/assets/sharepool/duo_naengmyeon.png`)}" style="position:absolute;left:50%;transform:translateX(-50%);bottom:-468px;width:380px;filter:drop-shadow(0 10px 16px rgba(70,90,40,.22))"/>
  </div>
  <div class="foot"><span class="pill" style="background:#5f6a30;color:#fff"><img src="${U('gom_thumbsup')}"/>믿고 사는 살림템</span></div>`)])

// ───────────────────────────────────────────────────────── ⑦ 감정
// ⭐ v8.71에서 제목↔부제가 바뀌었다 — 스샷만 옛 배치로 남아 있었다
S.push(['07-감정', page('radial-gradient(circle at 50% 42%,#8a6a4c,#6f5238 70%,#5f4630)',
  `<div class="cap"><h1 style="color:#fff6ea;font-size:80px">레시피를 넘기면,<br>그날의 내가 보여요</h1>
   <div class="sub" style="color:#e8d3bd">오늘도 한 끼, 해냈어요</div></div>`,
  `<div style="position:absolute;top:640px;left:50%;transform:translateX(-50%);width:760px;height:720px;display:flex;align-items:center;justify-content:center">
     <div style="position:absolute;width:760px;height:760px;border-radius:50%;background:radial-gradient(circle,rgba(255,246,234,.62),rgba(255,246,234,.24) 42%,rgba(255,246,234,0) 72%)"></div>
     <img src="${U('gom_heart')}" style="width:520px;filter:drop-shadow(0 20px 30px rgba(40,25,10,.4))"/>
  </div><div class="foot"><span class="pill" style="background:#fff6ea;color:#6f5238">감정 레시피북 · 한끼</span></div>`)])

// ───────────────────────────────────────────────────────── ⑧ 브랜드
// ⛔ 「흩어진 내 레시피, 곰펭이랑 예쁘게」 = v8.28~29에 폐기한 옛 문구 + 「곰펭」
//    → APP_TAGLINE 그대로: 꼬르곰·펭펭과 레꾸해요
S.push(['08-브랜드', page('radial-gradient(circle at 50% 30%,#f6b49e,#ee9a80 70%,#e5896d)',
  `<div class="cap"><h1 style="color:#fffdf8;text-shadow:0 4px 0 rgba(160,80,55,.3)">꼬르곰·펭펭과<br>감정 레시피북</h1></div>`,
  `<div style="position:absolute;top:520px;left:50%;transform:translateX(-50%);text-align:center;width:900px">
     <img src="${F('gp_duohi')}" style="width:520px;filter:drop-shadow(0 18px 26px rgba(120,50,30,.35))"/>
     <div style="margin-top:36px;background:#fffdf8;border-radius:40px;padding:44px 40px;box-shadow:0 20px 40px rgba(150,70,45,.28)">
       <img src="${logo}" style="width:300px"/><div style="margin-top:14px;font-size:38px;color:#7a5238">꼬르곰·펭펭과 레꾸해요</div></div>
  </div><div class="foot"><span class="pill" style="background:#5d3410;color:#fffdf8"><img src="${F('gp_duohi')}"/>지금 한끼 시작하기</span></div>`)])

// ═══════════════════════════════════════════════════════ 렌더 + 자동 검사
// ⭐ 고해상도 = deviceScaleFactor 2 → 2160×3840.
//   Play 폰 스크린샷 상한이 한 변 3840px 이라 딱 맞는 최대치다(그 위로는 못 올린다).
// ⚠️ `♡`(U+2661)·`＋`(U+FF0B) 는 **이모지가 아니라 한글 폰트에 들어 있는 글자**라 예외.
//    짐작이 아니라 재봤다 — 개구체(Gaegu)로 120px 렌더 시 폭 108px = 두부(tofu)가 아니다.
//    ⛔ 여기에 예외를 늘릴 땐 «폰트에 진짜 있는지 렌더해서 폭을 재고» 넣을 것.
const ALLOW = /[\u2661\uFF0B\u30FB\u00B7]/gu
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{1F000}-\u{1F0FF}\u{23E9}-\u{23FA}]/u
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
let bad = []
for (const [name, html] of S) {
  const p = await br.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 })
  await p.setContent(html, { waitUntil: 'networkidle' }); await p.waitForTimeout(300)
  // 🐛 재발 방지 — 화면에 그려진 «글자» 중에 유니코드 이모지가 하나라도 있으면 실패시킨다.
  //    (이모지 폰트가 없는 렌더 환경에서 조용히 다른 글자로 대체되는 게 `🍳`→돋보기 사고였다)
  const texts = await p.evaluate(() => {
    const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    while (w.nextNode()) { const t = w.currentNode.nodeValue.trim(); if (t) out.push(t) }
    return out
  })
  const hits = texts.filter((t) => EMOJI.test(t.replace(ALLOW, '')))
  if (hits.length) bad.push([name, hits])
  // 그림이 하나라도 안 뜨면 조용히 빈칸으로 나간다 → 그것도 잡는다
  const broken = await p.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).length)
  if (broken) bad.push([name, [`깨진 이미지 ${broken}개`]])
  // 🐛 «캐릭터가 글자를 가린다» — 눈으로 보고 넘기지 말고 좌표로 잡는다.
  //    창업자 지적 2026-07-31 *"큐레이션 장보기->애들 좀내려야해 글자 가림"*.
  //    ⚠️ 처음엔 꼬리말 알약만 쟀는데 «안 걸렸다» — 실제로 가려진 건 위쪽 흰 패널의 칩이었다.
  //       (⑤ 곰 모자가 「동네마트」 칩을, ⑥ 모자가 「간편 쯔유 스톡」 카드를 덮었다)
  //       📌 교훈 = 검사를 만들면 «옛 값으로 진짜 걸리는지» 먼저 돌려볼 것. 안 걸리면 가정이 틀린 거다.
  //    두 그림 다 알파 여백이 8px뿐이라(재봤다) 사각형 그대로 비교해도 된다.
  const lap = await p.evaluate(() => {
    const boxes = [...document.querySelectorAll('.panel, .foot .pill')]
    return [...document.querySelectorAll('.char')].flatMap((c) => {
      const r = c.getBoundingClientRect()
      return boxes.map((el) => {
        const f = el.getBoundingClientRect()
        const ov = Math.min(r.bottom, f.bottom) - Math.max(r.top, f.top)
        const oh = Math.min(r.right, f.right) - Math.max(r.left, f.left)
        return ov > 2 && oh > 2 ? `그림이 «${(el.innerText || '').trim().split('\n')[0].slice(0, 14)}» 칸을 ${Math.round(ov)}px 덮음(그림 위 ${Math.round(r.top)} / 칸 밑 ${Math.round(f.bottom)})` : ''
      }).filter(Boolean)
    })
  })
  if (lap.length) bad.push([name, lap])
  await p.screenshot({ path: `${OUT}/${name}.png` }); await p.close()
}
// 모아보기
const imgs = S.map(([n]) => b(`${OUT}/${n}.png`))
const cs = `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0;box-sizing:border-box;font-family:sans-serif}body{background:#e8e6e2;padding:34px;width:2280px}h2{color:#5d3410;margin-bottom:20px;font-size:38px}.g{display:grid;grid-template-columns:repeat(2,1fr);gap:30px}img{width:100%;border-radius:14px;box-shadow:0 8px 20px rgba(0,0,0,.18)}.l{text-align:center;font-size:26px;color:#444;margin-top:10px;font-weight:700}</style></head><body><h2>한끼 스토어 스크린샷 v3 — 2160×3840 (순서대로)</h2><div class="g">${S.map(([n], i) => `<div><img src="${imgs[i]}"/><div class="l">${n}</div></div>`).join('')}</div></body></html>`
const p = await br.newPage({ viewport: { width: 2280, height: 1200 } })
await p.setContent(cs, { waitUntil: 'networkidle' }); await p.waitForTimeout(300)
await p.screenshot({ path: `${OUT}/_모아보기.png`, fullPage: true })
await br.close()

for (const [n, s] of bad) console.log('❌', n, s.join(' '))
if (bad.length) { console.log(`\n⛔ 검사 실패 ${bad.length}건 — 위 자리를 우리 스티커·아이콘으로 바꿀 것`); process.exit(1) }
const sz = S.map(([n]) => `${n} ${(fs.statSync(`${OUT}/${n}.png`).size / 1024 / 1024).toFixed(1)}MB`)
console.log('✅ 8장 렌더 완료 · 유니코드 이모지 0 · 깨진 이미지 0')
console.log('   2160×3840 ·', sz.join(' / '))
console.log('   →', OUT)
