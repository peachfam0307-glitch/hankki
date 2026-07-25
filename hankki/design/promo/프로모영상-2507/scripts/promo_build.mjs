// 한끼 프로모 영상 — 애니메이션 HTML 생성 (9:16 세로 1080x1920, ~31s)
// 6장면: 훅 → 꾸미기 → 공유 → 큐레이션담고사기 → 감정 → 로고CTA
import fs from 'fs'
const H = '/home/user/hankki/hankki', PH = `${H}/src/assets/stickers/photo`, FT = `${H}/design/promo/fonts`
const EP = `${H}/docs/stickers/곰펭-에피소드-2507`, LG = `${H}/design/promo/logo`
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/vid'
const b64 = (p) => fs.readFileSync(p).toString('base64')
const font = (f) => `data:font/woff2;base64,${b64(`${FT}/${f}`)}`
const img = (p) => `data:image/png;base64,${b64(p)}`
const F = (k) => img(`${PH}/${k}.png`)
const jua = font('jua-korean-400.woff2'), gaegu = font('gaegu-korean-400.woff2')
// 곰펭 컷
const gomft = F('gp_gomft'), pengv = F('gp_pengv'), gomv = F('gp_gomv'), gomhi = F('gp_gomhi'),
  penghi = F('gp_penghi'), gomtb = F('gp_gomtb'), duotb = F('gp_duotb'), duoht = F('gp_duoht'), duohi = F('gp_duohi'), pengft = F('gp_pengft')
const heart = img(`${EP}/heart_gom.png`), combo = img(`${EP}/gomjang_combo.png`)
const logo = img(`${LG}/한끼로고-곰ㅎ-브라운-2507.png`)
// 음식 아이콘
const kimbap = F('fh_k22'), salmon = F('fe_06'), gambas = F('fe_08') // ①히어로 김밥 · ②레꾸 연어포케볼 · ③공유 감바스 (시안 실물 fe_)

const CSS = `
@font-face{font-family:'Jua';src:url(${jua}) format('woff2')}
@font-face{font-family:'Gaegu';src:url(${gaegu}) format('woff2')}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden}
body{font-family:'Jua',sans-serif;position:relative;background:#000}
.scene{position:absolute;inset:0;opacity:0;transition:opacity .55s ease}
.scene.on{opacity:1}
.dots{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.30) 9px,transparent 10px);background-size:104px 104px}
.cap{position:absolute;top:130px;left:0;right:0;text-align:center;padding:0 70px;z-index:20}
.cap h1{font-size:96px;line-height:1.14;letter-spacing:-1px}
.cap .sub{margin-top:22px;font-size:44px}
.card{background:#fffdf8;border-radius:46px;padding:28px 28px 32px;box-shadow:0 34px 66px rgba(90,60,30,.32);position:relative}
.cover{position:relative;border-radius:30px;overflow:hidden}
.cgrid{position:absolute;inset:0;background-image:radial-gradient(rgba(150,120,80,.16) 5px,transparent 6px);background-size:54px 54px}
.tape{position:absolute;top:-24px;left:50%;width:236px;height:56px;background:rgba(255,214,150,.85);border:2px dashed rgba(160,110,55,.5);border-radius:6px;transform:translateX(-50%) rotate(-2deg)}
.spark{position:absolute;filter:drop-shadow(0 2px 3px rgba(0,0,0,.1))}
.postit{position:absolute;padding:18px 22px;border-radius:10px;font-family:'Gaegu';line-height:1.1;box-shadow:0 8px 16px rgba(120,90,30,.22)}
.pill{display:inline-block;padding:20px 48px;border-radius:48px;font-size:46px}
.foot{position:absolute;bottom:250px;left:0;right:0;text-align:center;z-index:20}
.chip{background:#fff;border-radius:28px;box-shadow:0 8px 18px rgba(90,60,30,.18);display:flex;align-items:center;justify-content:center}
/* 애니 유틸 — 래퍼가 회전 담당, .anim이 등장 담당 */
.anim{opacity:0;transition:transform .6s cubic-bezier(.34,1.45,.5,1),opacity .5s ease}
.anim.pop{transform:scale(.3)}
.anim.up{transform:translateY(60px)}
.anim.dn{transform:translateY(-50px)}
.anim.lf{transform:translateX(70px)}
.anim.rt{transform:translateX(-70px)}
.anim.show{opacity:1;transform:none}
.flywrap{position:absolute;transition:transform .55s cubic-bezier(.34,1.5,.5,1),opacity .4s ease}
/* 앱 실제 곰펭 모션 (styles.css 그대로) */
@keyframes hk-kong{0%,100%{transform:translateY(0)}45%{transform:translateY(-20%)}}
.hk-m-kong{animation:hk-kong 1.15s cubic-bezier(.3,.7,.4,1) infinite;transform-origin:bottom center}
@keyframes hk-tongtong{0%,100%{transform:translateY(0) scale(1,1)}15%{transform:scale(1.05,.95)}40%{transform:translateY(-6%) scale(.97,1.03)}65%{transform:scale(1.03,.97)}80%{transform:translateY(-1%) scale(.99,1.01)}}
.hk-m-tongtong{animation:hk-tongtong 2.4s ease-in-out infinite;transform-origin:bottom center}
@keyframes hk-sway{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}
.hk-m-sway{animation:hk-sway 1.7s ease-in-out infinite;transform-origin:bottom center}
`

// ---------- 장면 HTML ----------
// S0 훅 — 밋밋 → 예쁜 카드
const S0 = `<div class="scene" id="s0" style="background:radial-gradient(circle at 30% 16%,#f0c79b,#e3aa73 55%,#d99a5f)">
  <div class="dots"></div>
  <div class="cap"><h1 id="s0h" style="color:#fffdf8;text-shadow:0 4px 0 rgba(150,95,40,.28);transition:transform .35s cubic-bezier(.34,1.6,.5,1)">그냥 저장만 하던<br>레시피가…</h1></div>
  <div style="position:absolute;top:600px;left:50%;transform:translateX(-50%) rotate(-4deg)">
    <div class="card" id="s0card" style="width:660px;transition:transform .22s ease">
      <div id="s0tape" style="position:absolute;top:-24px;left:50%;margin-left:-118px;width:236px;height:56px;background:rgba(255,214,150,.85);border:2px dashed rgba(160,110,55,.5);border-radius:6px;opacity:0;transform:scale(.2) rotate(-24deg);transition:transform .5s cubic-bezier(.34,1.7,.5,1),opacity .3s"></div>
      <div class="cover" style="height:620px;background:#e6e3dd">
        <div id="s0col" style="position:absolute;inset:0;background:linear-gradient(150deg,#e9f2e6,#fbe9d6);clip-path:circle(0% at 50% 46%);transition:clip-path .6s cubic-bezier(.4,0,.2,1)"></div>
        <div class="cgrid" id="s0grid" style="opacity:0;transition:opacity .5s ease"></div>
        <div id="s0plain" style="position:absolute;inset:0;padding:60px 54px;transition:opacity .35s ease,transform .35s ease;filter:grayscale(.55) opacity(.9)">
          <div style="font-size:52px;color:#8f887e">엄마표 김밥</div>
          <div style="margin-top:30px;font-size:34px;color:#aaa398;line-height:1.9">· 밥 3공기<br>· 김밥용 김 4장<br>· 단무지 · 당근 · 오이<br>· 계란 · 맛살 · 햄</div>
        </div>
        <img id="s0food" src="${kimbap}" style="position:absolute;top:50%;left:50%;margin:-190px 0 0 -190px;width:380px;filter:drop-shadow(0 10px 16px rgba(90,60,30,.22));opacity:0;transform:scale(.15) rotate(-10deg);transition:transform .55s cubic-bezier(.34,1.7,.5,1),opacity .3s"/>
        <img id="s0bear" src="${gomft}" style="position:absolute;right:-8px;bottom:-6px;width:236px;opacity:0;transform:translateY(260px) scale(.4) rotate(-16deg);transition:transform .6s cubic-bezier(.34,1.6,.5,1),opacity .3s"/>
        <span class="spark s0b" style="top:34px;right:46px;font-size:66px">✨</span>
        <span class="spark s0b" style="top:150px;left:44px;font-size:56px">❤️</span>
        <span class="spark s0b" style="bottom:210px;right:64px;font-size:54px">⭐</span>
        <span class="spark s0b" style="top:264px;right:52px;font-size:44px">💛</span>
        <span class="spark s0b" style="bottom:150px;left:70px;font-size:48px">✨</span>
        <div id="s0post" style="position:absolute;left:34px;bottom:44px;width:250px;background:#fff6b8;font-size:40px;color:#6b5330;text-align:center;padding:18px 22px;border-radius:10px;font-family:'Gaegu';box-shadow:0 8px 16px rgba(120,90,30,.22);opacity:0;transform:scale(.2) rotate(14deg);transition:transform .5s cubic-bezier(.34,1.6,.5,1),opacity .3s">오늘 한 끼 완성! 🍳</div>
        <div id="s0stamp" style="position:absolute;top:26px;left:50%;margin-left:-95px;width:190px;text-align:center;background:#ff7a59;color:#fff;font-size:46px;padding:12px 0;border-radius:40px;box-shadow:0 10px 20px rgba(200,80,50,.4);opacity:0;transform:scale(0) rotate(-8deg);transition:transform .5s cubic-bezier(.34,1.85,.5,1),opacity .25s">짠! ✨</div>
      </div>
      <div style="margin-top:22px;text-align:center"><div style="font-size:54px;color:#33302b">엄마표 김밥</div><div style="font-size:32px;color:#b3a898">2026.07.24</div></div>
    </div>
  </div>
  <div id="s0flash" style="position:absolute;inset:0;background:#fff;opacity:0;z-index:60;pointer-events:none;transition:opacity .1s ease"></div>
</div>`

// S1 꾸미기 — 큰 카드 + 곰펭 콩콩 점프 + 스티커 하나씩 크게
const S1 = `<div class="scene" id="s1" style="background:linear-gradient(160deg,#d3e3c8,#eaf2e2)">
  <div class="dots" style="background-image:radial-gradient(rgba(255,255,255,.22) 9px,transparent 10px)"></div>
  <div class="cap"><h1 style="color:#4a6b42">내 레시피,<br>예쁘게 꾸며요</h1><div class="sub" style="color:#5f7a54">스티커 톡 붙이고, 곰펭이 콩콩 — 레꾸 ✨</div></div>
  <div style="position:absolute;top:512px;left:50%;transform:translateX(-50%) rotate(-3deg)">
    <div class="card" style="width:700px">
      <div class="cover" id="s1cover" style="height:660px;background:#eef3ea;transition:background .55s ease">
        <div class="cgrid"></div>
        <img class="anim pop" data-t="s1a" src="${salmon}" style="position:absolute;top:44%;left:50%;transform:translate(-50%,-50%);width:410px;filter:drop-shadow(0 10px 16px rgba(90,60,30,.22))"/>
        <div class="anim lf" data-t="s1b" style="position:absolute;left:-8px;bottom:6px;width:252px"><img class="hk-m-kong" src="${pengv}" style="width:100%;filter:drop-shadow(0 8px 12px rgba(90,60,30,.25))"/></div>
        <div class="anim rt" data-t="s1c" style="position:absolute;right:22px;top:24px;width:154px"><img class="hk-m-tongtong" src="${gomhi}" style="width:100%;filter:drop-shadow(0 6px 10px rgba(90,60,30,.22))"/></div>
        <div style="position:absolute;right:26px;bottom:38px;transform:rotate(6deg)"><div class="anim pop" data-t="s1d" style="background:#dde5cf;font-size:58px;color:#4f5a44;padding:30px 40px;border-radius:14px;font-family:'Gaegu';line-height:1.1;box-shadow:0 10px 18px rgba(120,90,30,.24)">내 최애 ♡</div></div>
        <span class="spark anim pop" data-t="s1e" style="top:150px;left:56px;font-size:80px">✨</span>
        <span class="spark anim pop" data-t="s1f" style="top:248px;left:44px;font-size:58px">🌸</span>
      </div>
      <div style="margin-top:22px;text-align:center"><div style="font-size:54px;color:#33302b">연어 포케볼</div></div>
    </div>
    <div class="anim up" data-t="s1tray" style="margin-top:26px;background:#fff;border-radius:38px;padding:24px 22px;box-shadow:0 16px 34px rgba(70,90,60,.2);width:700px;display:flex;justify-content:space-between;align-items:center">
      ${['gp_gomhi','gp_penghi','fh_k27','fe_15'].map(k=>`<div class="chip" style="width:120px;height:120px"><img src="${F(k)}" style="width:80%"/></div>`).join('')}
      <div class="chip" style="width:120px;height:120px;font-size:58px;background:#5d3410;color:#fff">＋</div>
    </div>
    <div class="anim pop" data-t="s1hand" style="position:absolute;right:70px;bottom:-26px;font-size:104px;filter:drop-shadow(0 6px 8px rgba(0,0,0,.2))">👆</div>
  </div>
</div>`

// S2 공유 — 폰 스토리 목업(카드 올라가고 친구 반응) = "어떻게 공유되는지" 명확
const S2 = `<div class="scene" id="s2" style="background:radial-gradient(circle at 50% 26%,#f7bccb,#f2a0b4 66%,#ec8ea6)">
  <div class="dots" style="background-image:radial-gradient(rgba(255,255,255,.26) 9px,transparent 10px)"></div>
  <div class="cap"><h1 style="color:#fffdf8;text-shadow:0 3px 0 rgba(180,70,100,.32)">예쁜 카드를<br>카톡·인스타로 톡!</h1><div class="sub" style="color:#7a3550">내 한끼를 친구들과 나눠요 🥰</div></div>
  <div class="anim dn" data-t="s2badge" style="position:absolute;top:446px;left:0;right:0;display:flex;gap:22px;justify-content:center;z-index:10">
    <span style="background:#fffdf8;border-radius:32px;padding:13px 28px;font-size:34px;color:#c0506a;box-shadow:0 10px 20px rgba(150,60,85,.28);white-space:nowrap">📸 인스타 스토리</span>
    <span style="background:#fffdf8;border-radius:32px;padding:13px 28px;font-size:34px;color:#7a5a1e;box-shadow:0 10px 20px rgba(150,60,85,.28);white-space:nowrap">💬 카카오톡</span>
  </div>
  <div style="position:absolute;top:520px;left:50%;transform:translateX(-50%);width:560px">
    <div style="border-radius:54px;padding:9px;background:conic-gradient(from 30deg,#f9a825,#f06292,#ab47bc,#5c9df0,#f9a825);box-shadow:0 28px 56px rgba(150,50,80,.38)">
      <div style="background:#fff;border-radius:48px;overflow:hidden">
        <div style="display:flex;align-items:center;gap:14px;padding:22px 26px">
          <div style="width:70px;height:70px;border-radius:50%;background:linear-gradient(135deg,#f6c79b,#e3aa73);overflow:hidden;display:flex;align-items:center;justify-content:center"><img src="${gomtb}" style="width:116%"/></div>
          <div style="font-size:34px;color:#333">꼬르곰맘</div><div style="font-size:28px;color:#aaa">· 스토리</div>
        </div>
        <div style="position:relative;height:600px;background:linear-gradient(150deg,#fdf3e8,#f5ead9);overflow:hidden">
          <div style="position:absolute;inset:0;background-image:radial-gradient(rgba(150,120,80,.14) 5px,transparent 6px);background-size:52px 52px"></div>
          <div class="flywrap" id="s2card" style="position:absolute;inset:0;opacity:0;transform:translateY(140px)">
            <div style="position:absolute;top:18px;left:50%;transform:translateX(-50%) rotate(-2deg);background:#f0b7c6;padding:9px 30px;border-radius:5px;font-family:'Gaegu';font-size:36px;color:#7a4a52;white-space:nowrap">감바스 알 아히요 🍤</div>
            <img src="${gambas}" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:300px;filter:drop-shadow(0 10px 16px rgba(90,60,30,.2))"/>
            <img src="${duoht}" style="position:absolute;right:-6px;bottom:-6px;width:250px"/>
            <div style="position:absolute;left:24px;bottom:32px;background:#fff6b8;padding:14px 18px;border-radius:9px;transform:rotate(-4deg);font-family:'Gaegu';font-size:32px;color:#6b5330;line-height:1.2">오늘 저녁<br>성공! 🍤</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:16px;padding:22px 26px">
          <div style="flex:1;border:3px solid #eee;border-radius:40px;padding:14px 26px;font-size:30px;color:#bbb">메시지 보내기…</div>
          <span style="font-size:46px">🤍</span><span style="font-size:46px">📤</span>
        </div>
      </div>
    </div>
    <div class="anim pop" data-t="s2b1" style="position:absolute;left:-72px;top:250px;background:#fff;font-family:'Gaegu';font-size:40px;color:#3a2f2a;padding:16px 28px;border-radius:32px 32px 32px 6px;transform:rotate(-5deg);box-shadow:0 12px 24px rgba(150,50,80,.26)">우와 맛있겠다 😍</div>
    <div class="anim pop" data-t="s2b2" style="position:absolute;right:-64px;top:470px;background:#5d3410;color:#fff;font-family:'Gaegu';font-size:40px;padding:16px 28px;border-radius:32px 32px 6px 32px;transform:rotate(5deg);box-shadow:0 12px 24px rgba(150,50,80,.26)">레시피 공유해줘 🙏</div>
  </div>
</div>`

// S3 큐레이션 → 담기 → 사기
const rows = [['든든한 보리면','#c9a84e','🍜'],['만능 대파소금','#7a9b56','🧂'],['간편 쯔유 스톡','#8b6f4a','🍶']]
const S3 = `<div class="scene" id="s3" style="background:linear-gradient(160deg,#cdd2a0,#e4e7c6)">
  <div class="dots" style="background-image:radial-gradient(rgba(255,255,255,.22) 9px,transparent 10px)"></div>
  <div class="cap"><h1 style="color:#5f6a30">써본 것만 콕,<br>바로 담아 사요</h1><div class="sub" style="color:#72803a">18년차 주부 큐레이션 → 장바구니까지 뚝딱</div></div>
  <div style="position:absolute;top:560px;left:50%;transform:translateX(-50%);width:720px">
    ${rows.map(([n,c,e],i)=>`<div class="anim rt" data-t="s3r${i}" style="background:#fffdf8;border-radius:34px;padding:26px 30px;margin-bottom:26px;display:flex;align-items:center;gap:26px;box-shadow:0 16px 30px rgba(90,90,40,.16);position:relative">
      <div style="width:104px;height:104px;border-radius:26px;background:${c};display:flex;align-items:center;justify-content:center;font-size:52px;color:#fff;flex-shrink:0">${e}</div>
      <div style="flex:1"><div style="font-size:40px;color:#33302b">${n}</div><div style="font-size:28px;color:#8a8570;font-family:'Gaegu'">⭐ 곰펭 PICK</div></div>
      <div class="s3add" style="background:#5f6a30;color:#fff;font-size:34px;padding:16px 30px;border-radius:26px">담기</div>
    </div>`).join('')}
  </div>
  <!-- 담기 → 장바구니 나는 아이콘 -->
  <div class="flywrap" id="s3fly" style="left:50%;top:640px;font-size:76px;opacity:0">🛒</div>
  <img class="anim up" data-t="s3bear" src="${combo}" style="position:absolute;left:50%;bottom:250px;margin-left:-230px;width:460px;filter:drop-shadow(0 14px 22px rgba(70,80,40,.3))"/>
  <div class="foot" style="bottom:180px"><span class="anim pop" data-t="s3buy" style="display:inline-block;background:#5d3410;color:#fffdf8;padding:24px 60px;border-radius:52px;font-size:52px;box-shadow:0 16px 30px rgba(80,60,20,.3)">🛒 바로 사러가기</span></div>
</div>`

// S4 감정
const S4 = `<div class="scene" id="s4" style="background:radial-gradient(circle at 50% 42%,#8a6a4c,#6f5238 70%,#5f4630)">
  <div class="dots" style="background-image:radial-gradient(rgba(255,255,255,.14) 9px,transparent 10px)"></div>
  <div class="cap"><h1 style="color:#fff6ea">오늘도 한 끼,<br>해냈어요</h1><div class="sub" style="color:#e8d3bd">요리하는 나를 위한 작은 위로 🐻</div></div>
  <div style="position:absolute;top:680px;left:50%;transform:translateX(-50%);width:760px;height:760px;display:flex;align-items:center;justify-content:center">
    <div style="position:absolute;width:660px;height:660px;border-radius:50%;background:radial-gradient(circle,rgba(255,244,230,.5),rgba(255,244,230,0) 68%)"></div>
    <img class="anim pop" data-t="s4h" src="${heart}" style="width:470px;filter:drop-shadow(0 20px 30px rgba(40,25,10,.42))"/>
    <span class="spark anim pop" data-t="s4s1" style="top:60px;left:90px;font-size:62px">💛</span>
    <span class="spark anim pop" data-t="s4s2" style="bottom:150px;right:100px;font-size:54px">✨</span>
  </div>
  <div class="foot" style="bottom:230px"><span class="pill anim up" data-t="s4p" style="background:#fff6ea;color:#6f5238">감정 레시피북 · 한끼</span></div>
</div>`

// S5 로고 CTA
const S5 = `<div class="scene" id="s5" style="background:radial-gradient(circle at 50% 30%,#f6b49e,#ee9a80 70%,#e5896d)">
  <div class="dots" style="background-image:radial-gradient(rgba(255,255,255,.26) 9px,transparent 10px)"></div>
  <div style="position:absolute;top:340px;left:0;right:0;text-align:center;padding:0 70px">
    <div class="anim dn" data-t="s5duo" style="display:inline-block;width:560px"><img class="hk-m-sway" src="${duohi}" style="width:100%;filter:drop-shadow(0 18px 26px rgba(120,50,30,.35))"/></div>
    <div class="anim up" data-t="s5card" style="margin-top:30px;background:#fffdf8;border-radius:46px;padding:52px 44px;box-shadow:0 22px 44px rgba(150,70,45,.3);display:inline-block">
      <img src="${logo}" style="width:340px"/>
      <div style="margin-top:18px;font-size:44px;color:#7a5238">내 레시피를 예쁘게, 레꾸해요</div>
    </div>
  </div>
  <div class="foot" style="bottom:300px"><span class="pill anim pop" data-t="s5cta" style="background:#5d3410;color:#fffdf8;font-size:52px">지금 무료로 시작하기 🐻🐧</span></div>
</div>`

const TIMELINE = `
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s)
const at=(t,fn)=>setTimeout(fn,t)
const show=(sel)=>$$(sel).forEach(e=>e.classList.add('show'))
const scene=(id,on)=>$(id).classList[on?'add':'remove']('on')
function run(){
// ===== S0 훅 (0-4.8s) 드라마틱 변신 =====
at(1800,()=>{const f=$('#s0flash');f.style.opacity=.92;setTimeout(()=>f.style.opacity=0,120)})
at(1850,()=>{const p=$('#s0plain');p.style.opacity=0;p.style.transform='scale(.8)';
  $('#s0col').style.clipPath='circle(150% at 50% 46%)';$('#s0grid').style.opacity=1;
  const h=$('#s0h');h.innerHTML='이렇게 예뻐졌죠! ✨';h.style.transform='scale(1.16)';setTimeout(()=>h.style.transform='scale(1)',300)})
at(2100,()=>{const f=$('#s0food');f.style.opacity=1;f.style.transform='none'})
at(2350,()=>{const b=$('#s0bear');b.style.opacity=1;b.style.transform='translateY(0) scale(1) rotate(6deg)'})
at(2500,()=>{const t=$('#s0tape');t.style.opacity=1;t.style.transform='scale(1) rotate(-2deg)'})
$$('#s0 .s0b').forEach((el,i)=>at(2550+i*95,()=>{el.style.opacity='1';el.style.transform='scale(1) rotate(0deg)'}))
at(2950,()=>{const p=$('#s0post');p.style.opacity=1;p.style.transform='scale(1) rotate(-5deg)';const s=$('#s0stamp');s.style.opacity=1;s.style.transform='scale(1) rotate(-8deg)'})
at(3100,()=>{const c=$('#s0card');c.style.transform='scale(1.05)';setTimeout(()=>c.style.transform='scale(1)',200)})
at(4800,()=>{scene('#s0',0);scene('#s1',1)})

// ===== S1 꾸미기 (4.8-11.3s) 큰 카드 + 곰펭 콩콩 + 스티커 하나씩 크게 =====
at(5150,()=>show('#s1 [data-t=s1a]'))     // 연어 포케볼
at(5550,()=>show('#s1 [data-t=s1tray]'))  // 트레이
at(6050,()=>show('#s1 [data-t=s1hand]'))  // 손 톡
at(6350,()=>show('#s1 [data-t=s1b]'))     // 펭 콩콩 점프 (큼)
at(7150,()=>show('#s1 [data-t=s1c]'))     // 곰 통통
at(7900,()=>show('#s1 [data-t=s1d]'))     // 포스트잇 (큼)
at(8600,()=>{$('#s1cover').style.background='linear-gradient(150deg,#fbf5e8,#f2ecda)';show('#s1 [data-t=s1e]')}) // 배경색+반짝
at(9300,()=>show('#s1 [data-t=s1f]'))     // 🌸
at(11300,()=>{scene('#s1',0);scene('#s2',1)})

// ===== S2 공유 (11.3-17.3s) 폰 스토리에 카드 올리고 친구 반응 =====
at(11700,()=>show('#s2 [data-t=s2badge]'))                                       // 인스타/카톡 배지
at(12300,()=>{const c=$('#s2card');c.style.opacity=1;c.style.transform='translateY(0)'}) // 카드가 스토리로 슉 (공유!)
at(13400,()=>show('#s2 [data-t=s2b1]'))                                          // 친구 반응
at(14300,()=>show('#s2 [data-t=s2b2]'))
at(17300,()=>{scene('#s2',0);scene('#s3',1)})

// ===== S3 큐레이션 (17.3-22.0s) =====
at(17700,()=>show('#s3 [data-t=s3r0]'))
at(17950,()=>show('#s3 [data-t=s3r1]'))
at(18200,()=>show('#s3 [data-t=s3r2]'))
at(18800,()=>show('#s3 [data-t=s3bear]'))
at(19300,()=>{const r=$('#s3 [data-t=s3r0] .s3add');r.style.transition='transform .15s';r.style.transform='scale(.86)';const f=$('#s3fly');f.style.opacity=1;f.style.transform='translate(240px,-40px) scale(.6)'})
at(19800,()=>{$('#s3 [data-t=s3r0] .s3add').style.transform='scale(1)';const f=$('#s3fly');f.style.transform='translate(300px,340px) scale(1)';f.style.opacity=0})
at(20400,()=>show('#s3 [data-t=s3buy]'))
at(22000,()=>{scene('#s3',0);scene('#s4',1)})

// ===== S4 감정 (22.0-25.5s, 짧게) =====
at(22400,()=>show('#s4 [data-t=s4h]'))
at(23000,()=>{show('#s4 [data-t=s4s1]');show('#s4 [data-t=s4s2]')})
at(23500,()=>show('#s4 [data-t=s4p]'))
at(25500,()=>{scene('#s4',0);scene('#s5',1)})

// ===== S5 로고 (25.5-30s, 짧게) — 곰펭 안녕 인사(sway) =====
at(25900,()=>show('#s5 [data-t=s5duo]'))
at(26400,()=>show('#s5 [data-t=s5card]'))
at(27000,()=>show('#s5 [data-t=s5cta]'))
}
window.__go=run
function boot(){Promise.all([].map.call(document.images,i=>i.decode().catch(()=>{}))).then(()=>requestAnimationFrame(()=>{$$('#s0 .s0b').forEach(el=>{el.style.opacity='0';el.style.transform='scale(0) rotate(-90deg)';el.style.transition='transform .5s cubic-bezier(.34,1.7,.5,1),opacity .3s'});const s0el=$('#s0');s0el.style.transition='none';scene('#s0',1);requestAnimationFrame(()=>{s0el.style.transition='';window.__ready=1})}))}
if(document.readyState==='complete') boot(); else window.addEventListener('load',boot)
`

const HTML = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head>
<body>${S0}${S1}${S2}${S3}${S4}${S5}
<script>${TIMELINE}<\/script></body></html>`

fs.writeFileSync(`${OUT}/promo.html`, HTML)
console.log('promo.html 생성 완료:', (HTML.length/1024/1024).toFixed(1), 'MB')
