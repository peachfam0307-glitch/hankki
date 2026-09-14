// 🔗 파트너스 링크 «짝 맞추기» 판 — 창업자가 «누르면서» 맞나 확인한다
//
// 📮 창업자 2026-09-08 = *"내 링크랑 이름을 짝지어봐 **내가 바로바로 눌러서 체크할 수 있게**"*
//    ＋ *"순서는 나도 몰라 쭉 적어준거야;;"*  ＋ *"**저렇게많은데**"*(＝38개를 다 못 누른다)
//
// ⛔⛔ **왜 짐작으로 박으면 안 되나** = 링크 37개인데 채울 자리가 38개다.
//    어딘가 「없음」을 말 없이 건너뛴 곳이 하나 있고, **그 지점부터 뒤가 «전부» 한 칸씩 밀린다.**
//    밀린 채로 박으면 「굴소스 자리에 김치찌개 링크」가 되고, 유저는 그걸 «그 제품인 줄» 안다(절대원칙 37).
//
// ⭐⭐ **38개를 다 누르게 하지 않는다 — 「반씩 좁혀」 최대 6번.**
//    어긋남은 «한 지점부터 뒤가 전부» 밀리는 모양이라 **경계 하나만 찾으면 된다.**
//    🔢 38칸 → 2^6=64 > 38 이라 **여섯 번이면 반드시 잡힌다.** 창업자 손이 38번 → 6번(규칙 8).
//    ⭐ 판이 «지금 누를 것 하나»만 크게 띄우고, 맞음/다름에 따라 다음을 스스로 고른다.
//
// ⛔ 답을 `localStorage` 에 남긴다 — 폰에서 보다가 껐다 켜도 이어서 한다(검수판 절대원칙 2026-08-19).
// 쓰는 법: node scripts/_판-파트너스짝-0908.mjs
import { writeFileSync } from 'node:fs'

// 창업자가 준 순서 그대로 (23~68번 자리 · 「없음」이라 말한 곳은 건너뛴다)
const 링크 = `gRZIvJoLfw gRZPuJSP7c gRZRPRtxsq gRZTAzw6Ka gRZWncLMoS gRZ2eh1AfA gRZ3ZiKoNw gRZ5ovZeMe gRZ6ABJsEC gRZ8DZ10x2 gR0iYfaF3I gR0kG4w7hs gR0nzFheX6 gR0o71e6tU gR0tQ4teVN gR0vvlmv0K gR0xUdOyWq gR0McSFGRo gR0NP8ZbH2 gR0PbfrVbE gR0QyrVhx6 gR0TgRJopo gR01WV52tM gR032LV564 gR05PZNscK gR08wQAotE gR1cAvlyqi gR1d0H64iW gR1fjRGFYz gR1hD6q9jE gR1i3KemiG gR1lBuWHdI gR1mVwLGk8 gR1n7yW2Kq gR1pAVcxKm gR1rf7MFyu gR1syklmsS`.split(/\s+/)

// 23~68번 자리 · 창업자가 「없다」고 말한 것은 없음으로
const 자리 = [
  [23, '알라 하바티치즈', '없음(품절·소량)'],
  [24, '종가 석박지'],
  [25, '포프리 엑스트라버진 올리브 김', '없음'],
  [26, '설성목장 한우 사골 곰탕 스틱'],
  [27, '굽네 닭가슴살 만두'],
  [28, '세끼판다 메밀면 샐러드'],
  [29, '그라놀로지 시그니쳐 크런치 코코넛'],
  [30, '크놀라 크런치 코코넛'],
  [31, '채담카레'],
  [32, '상하농원 버터치킨카레'],
  [33, '또요 또먹는 플레인 요거트'],
  [34, '국내산 무농약인증 건목이버섯'],
  [35, '죽장연 전통된장'],
  [36, '모에솔트 대파소금'],
  [37, '아우노슈가'],
  [38, '마야항아리 기버터 260g'],
  [39, '아이레스 데 크리스탈 하엔 올리브오일', '없음'],
  [40, '위드잇 슬라이스햄 슬림'],
  [41, '선진포크 한돈 생 대패목심'],
  [42, '보보리쿡시 보리면'],
  [43, '농협식품 우리콩 두부면 넓은면', '없음(품절)'],
  [44, '누들핏 어묵탕맛', '없음'],
  [45, '심플잇 김치볶음밥 포켓누룽지'],
  [46, '바다숲 뿌려먹는 감태랑 해물이랑'],
  [47, '매홍 국내산 촉촉한 군고구마 말랭이'],
  [48, '농심 누룽지팝'],
  [49, '연세우유 생크림 우유롤'],
  [50, '더바른 삼색꿀떡 (냉동)', '없음(품절)'],
  [51, '매일 마이카페라떼 마일드'],
  [52, '임실치즈마을 요거트 더 달콤 스트로베리'],
  [53, '풀무원 들기름 볶음김치'],
  [54, '대복 포기김치 5kg'],
  [55, '치밀 유기농 골드퀸 현미밥 즉석밥', '없음(품절)'],
  [56, '빅마마 이혜정 꽉찬 수제 영양밥 전복'],
  [57, '더오담 김치콩비지찌개'],
  [58, '오모가리 수제 김치찌개'],
  [59, '하남쭈꾸미'],
  [60, '샐러딩 야키토리 샐러드'],
  [61, '그라도스커피 콜롬비아 디카페인 원두'],
  [62, '평창다원 유기농 타타리메밀차'],
  [63, '포비베이글 호두크림치즈'],
  [64, '포비 무화과 스프레드'],
  [65, '무설탕 저당 알룰로스 딸기잼 파우치'],
  [66, '자연애찬 반숙이 6구'],
  [67, '하진이네버섯뜰에 건조 흰목이버섯 80g'],
  [68, '국내산 베이비 브로콜리', '없음(품절)'],
]

let k = 0
const 줄들 = 자리.map(([n, 이름, 없음]) => {
  if (없음) return { n, 이름, 없음 }
  const u = 링크[k++]
  return { n, 이름, url: u ? `https://link.coupang.com/a/${u}` : null, 코드: u || '⛔모자람' }
})
// ⛔ 링크가 «있는» 칸만 물어본다 — 없는 칸은 누를 게 없다
const 후보 = 줄들.filter((r) => !r.없음 && r.url)

const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>파트너스 링크 짝 맞추기</title>
<style>
 body{margin:0;background:#f7f4ee;font:15px/1.6 -apple-system,'Noto Sans KR',sans-serif;color:#3a2c1e;padding:16px 13px 40px}
 h1{font-size:19px;margin:0 0 8px}
 .note{background:#fff6e0;border:1px solid #e8d5a8;border-radius:12px;padding:12px 14px;font-size:13.5px;margin:0 0 16px}
 .card{background:#fff;border:2px solid #5d3410;border-radius:16px;padding:20px 17px;text-align:center}
 .step{font-size:13px;color:#a08f78;margin-bottom:9px}
 .nm{font-size:21px;font-weight:800;line-height:1.35;margin-bottom:4px}
 .code{font-family:monospace;font-size:12px;color:#a08f78;margin-bottom:16px}
 a.go{display:block;background:#5d3410;color:#fff;text-decoration:none;padding:15px;border-radius:12px;font-size:17px;font-weight:800;margin-bottom:14px}
 .btns{display:flex;gap:10px}
 button{flex:1;padding:15px 0;border:2px solid #d8cdbc;background:#fff;border-radius:12px;font-size:16px;font-weight:800;color:#3a2c1e}
 .done{background:#eefbef;border:2px solid #a9dcae;border-radius:16px;padding:20px 17px;text-align:center;font-size:16px;line-height:1.7}
 .done b{font-size:19px}
 #log{margin-top:18px;font-size:13px;color:#8a7a66}
 #log div{padding:3px 0}
 .rs{margin-top:14px;text-align:center}
 .rs button{padding:9px 16px;font-size:13px;font-weight:400;flex:0 0 auto;border-width:1px;width:auto}
 #out{white-space:pre-wrap;font-family:monospace;font-size:12.5px;background:#fff;border:1px solid #ddd;border-radius:10px;padding:12px;margin-top:14px;text-align:left}
</style>
<h1>🔗 파트너스 링크 짝 맞추기</h1>
<div class="note">
⛔ 링크가 <b>하나 모자라</b>(37개 · 자리 38개) — 어딘가 「없음」을 안 적고 넘어간 데가 있어.<br>
⭐ <b>다 누를 필요 없어. 최대 6번이면 찾아.</b><br>
👉 「열기」 눌러서 뜬 상품이 <b>위 이름과 같으면 ✅, 다르면 ⛔</b>.
</div>
<div id="app"></div>
<div id="log"></div>
<script>
var D=${JSON.stringify(후보.map((r) => ({ n: r.n, nm: r.이름, c: r.코드, u: r.url })))}
var KEY='hankki:파트너스짝2:0908'
var S={lo:0,hi:D.length-1,log:[]}
try{var v=JSON.parse(localStorage.getItem(KEY)||'null'); if(v&&typeof v.lo==='number')S=v}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function render(){
  var app=document.getElementById('app')
  document.getElementById('log').innerHTML=S.log.map(function(x){return '<div>'+(x.v==='y'?'✅':'⛔')+' '+x.n+'번 '+x.nm+'</div>'}).join('')
  if(S.lo>S.hi){
    var 자리=S.lo>=D.length?'맨 끝(67번 흰목이버섯)':(D[S.lo].n+'번 「'+D[S.lo].nm+'」')
    var txt='어긋난 자리: '+자리+'\\n'+S.log.map(function(x){return (x.v==='y'?'맞음 ':'다름 ')+x.n+' '+x.nm}).join('\\n')
    app.innerHTML='<div class="done">🎯 찾았어<br><b>'+자리+'</b> 부터 어긋나<br><span style="font-size:14px;color:#5a7a5c">이 화면 그대로 보여주면 내가 고쳐서 다시 줄게</span></div>'
      +'<div id="out"></div><div class="rs"><button onclick="reset()">처음부터 다시</button></div>'
    document.getElementById('out').textContent=txt
    try{navigator.clipboard&&navigator.clipboard.writeText(txt)}catch(e){}
    return
  }
  var m=Math.floor((S.lo+S.hi)/2), r=D[m]
  var 남=Math.ceil(Math.log(S.hi-S.lo+2)/Math.log(2))
  app.innerHTML='<div class="card"><div class="step">'+(S.log.length+1)+'번째 · 앞으로 최대 '+남+'번</div>'
    +'<div class="nm">'+r.n+'. '+r.nm+'</div><div class="code">'+r.c+'</div>'
    +'<a class="go" href="'+r.u+'" target="_blank" rel="noopener">이 링크 열어보기 ↗</a>'
    +'<div class="btns"><button onclick="ans(1)">✅ 같아</button><button onclick="ans(0)">⛔ 달라</button></div></div>'
    +'<div class="rs"><button onclick="reset()">처음부터 다시</button></div>'
}
function ans(ok){
  var m=Math.floor((S.lo+S.hi)/2), r=D[m]
  S.log.push({n:r.n,nm:r.nm,v:ok?'y':'n'})
  if(ok)S.lo=m+1; else S.hi=m-1
  save(); render()
}
function reset(){S={lo:0,hi:D.length-1,log:[]};save();render()}
render()
</script>`

const 낼곳 = '/tmp/claude-0/-home-user-hankki/a2a1e2e3-d972-556f-b791-6ad309c4df0c/scratchpad/파트너스짝-0908.html'
writeFileSync(낼곳, html)
console.log(`후보 ${후보.length}칸 · 최대 ${Math.ceil(Math.log2(후보.length + 1))}번이면 경계를 찾는다`)
console.log(낼곳)
