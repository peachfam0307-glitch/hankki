// 🏷📋 **재료 «묶음 표기» 전수 검수판** — 203편을 폰에서 훑으며 고른다 (2026-09-16)
//
// 📮 창업자 = *"다른 레시피도 이렇게 구별하게 적기 어려운가?"* → *"내가 전수볼게 그냥"*
//        ＋ *"100개 넘어도 돼 내가 다 볼게"* ＋ *"전수 목록 안읽혀 html로 뽑아줘 검수판을"*
//        ＋ *"양념재료가 2번 나오는 파도 있을거야. 절임이라던가.. 다른 용도로"* → **묶음을 여럿 만들 수 있게**
//
// ⭐ v13.55 부터 **대괄호만 적히면 화면이 알아서 파란 소제목 한 줄로 만든다.**
//    그러니 여기서 고를 것은 «어느 줄부터 어떤 이름의 묶음인가» 하나뿐이다.
//
// 🔒 검수판 게이트 둘을 지킨다 (`check-panmemo` · `check-pancopy`)
//    ① **localStorage 로 고른 것을 기억한다** — 폰에서 보다 전화가 와도 안 날아간다
//    ② **「결과 복사」** ＋ **복사 실패 폴백**(글을 화면에도 띄운다 — writeText 는 성공으로 resolve 되고도 실패한다)
//
// ⛔⛔ **레시피 글은 이 판이 한 글자도 안 고친다.** 창업자가 고른 것을 «내게 보내는» 판이다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-재료묶음-0916.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const APP = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(join(APP, 'src/data/basics.js'), 'utf8')

// 🧭 편을 «정확히» 자른다 — title 자리로 나눈다(정규식 하나로 통째로 훑으면 편이 섞인다)
const 자리 = [...src.matchAll(/title: '([^']+)'/g)].map((m) => ({ 이름: m[1], i: m.index }))
const 편들 = 자리.map((p, k) => {
  const 끝 = k + 1 < 자리.length ? 자리[k + 1].i : src.length
  const 덩어리 = src.slice(p.i, 끝)
  const mm = /ingredients: \[([\s\S]*?)\n\s*\]/.exec(덩어리)
  const 줄들 = mm ? [...mm[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((x) => x[1]) : []
  return { 이름: p.이름, 줄들 }
}).filter((p) => p.줄들.length)

// 🏷 이미 묶음이 있는 편 = 손댈 것 없다
const 있음 = (p) => p.줄들.some((s) => /^\[/.test(s.trim()))
const 이미 = 편들.filter(있음)
const 할것 = 편들.filter((p) => !있음(p))

// 🔢 «양념류가 뒤에 몰렸나»로 순서를 매긴다 — 손볼 게 많은 편이 위로
const 양념 = ['고춧가루', '간장', '설탕', '다진 마늘', '다진마늘', '참기름', '들기름', '소금', '후추', '식초', '올리고당', '물엿', '고추장', '된장', '쌈장', '맛술', '미림', '청주', '다시다', '매실액', '굴소스', '액젓', '통깨', '참깨', '생강', '꿀', '케첩', '마요네즈', '전분', '녹말', '머스터드', '올리브유', '식용유', '버터', '청양', '미원', '조미료', '참치액', '까나리', '새우젓', '고추기름', '두반장', '춘장', '연두', '아우노슈가', '맛소금', '후춧']
const 뒤양념 = (p) => { let n = 0; for (let i = p.줄들.length - 1; i >= 0; i--) { if (양념.some((w) => p.줄들[i].includes(w))) n++; else break } return n }
할것.forEach((p) => { p.n = 뒤양념(p) })
할것.sort((a, b) => b.n - a.n)

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// 🏷 자주 쓰는 묶음 이름 — 이미 쓰이고 있는 것에서 뽑았다(새로 지어내지 않는다)
const 흔한이름 = ['양념', '양념장', '소스', '육수', '절임', '밑간', '고명', '반죽', '마무리', '드레싱']

const 편HTML = (p, k) => `
<section class="p" data-k="${k}" data-name="${esc(p.이름)}">
  <h2><span class="t">${esc(p.이름)}</span><span class="c" id="c${k}">묶음 0</span></h2>
  <div class="rows">
    ${p.줄들.map((s, i) => `
    <div class="r" data-i="${i}">
      <button class="cut" data-k="${k}" data-i="${i}">＋ 여기부터</button>
      <span class="g" id="g${k}_${i}"></span>
      <span class="txt">${esc(s)}</span>
    </div>`).join('')}
  </div>
</section>`

const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>재료 묶음 검수판 — 2026-09-16</title>
<style>
:root{--bg:#fdf6ee;--ink:#3b342c;--sub:#8d8175;--line:#e9dfd2;--pt:#5878a0;--card:#fff}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 -apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Pretendard',sans-serif;padding:0 0 120px}
header{position:sticky;top:0;z-index:9;background:var(--bg);border-bottom:1px solid var(--line);padding:14px 16px calc(12px);backdrop-filter:blur(6px)}
h1{margin:0 0 4px;font-size:17px}
.sum{font-size:13px;color:var(--sub)}
.bar{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}
.bar button{flex:1;min-width:92px;border:none;border-radius:10px;padding:10px 8px;font-size:13px;font-weight:700;background:var(--pt);color:#fff}
.bar button.g2{background:#e9dfd2;color:var(--ink)}
main{padding:0 16px}
.p{background:var(--card);border:1px solid var(--line);border-radius:14px;margin:12px 0;padding:12px 12px 8px}
.p.done{opacity:.5}
h2{margin:0 0 8px;font-size:16px;display:flex;align-items:center;gap:8px}
h2 .t{flex:1;min-width:0}
h2 .c{font-size:12px;color:var(--sub);white-space:nowrap}
.r{display:flex;align-items:flex-start;gap:8px;padding:3px 0;font-size:14px}
.r .cut{flex:0 0 auto;border:1px dashed var(--line);background:none;color:var(--sub);border-radius:8px;font-size:11px;padding:2px 6px;cursor:pointer}
.r.head .cut{border-style:solid;border-color:var(--pt);color:var(--pt)}
.r .g{flex:0 0 auto;font-weight:800;color:var(--pt);font-size:13px}
.r .txt{flex:1;min-width:0}
.r.under .txt{padding-left:10px}
dialog{border:none;border-radius:16px;padding:16px;max-width:320px;width:86%}
dialog h3{margin:0 0 10px;font-size:15px}
dialog input{width:100%;padding:10px;border:1px solid var(--line);border-radius:10px;font-size:15px}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}
.chips button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:6px 10px;font-size:13px}
dialog .row{display:flex;gap:8px;margin-top:12px}
dialog .row button{flex:1;border:none;border-radius:10px;padding:10px;font-weight:700;background:var(--pt);color:#fff}
dialog .row button.g2{background:#e9dfd2;color:var(--ink)}
#out{white-space:pre-wrap;font-size:12px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px;margin:12px 16px;display:none;user-select:all}
.note{font-size:12.5px;color:var(--sub);margin:10px 16px;line-height:1.7}
</style></head><body>
<header>
  <h1>🏷 재료 묶음 검수판</h1>
  <div class="sum">전체 ${편들.length}편 · 이미 묶음 있는 ${이미.length}편은 뺐다 · <b>고를 것 ${할것.length}편</b> · <span id="cnt">0</span>편 정했다</div>
  <div class="bar">
    <button id="copy">📋 결과 복사</button>
    <button class="g2" id="reset">처음부터</button>
  </div>
</header>
<div class="note">
  줄 왼쪽 <b>＋ 여기부터</b> 를 누르면 «그 줄부터 새 묶음»이 된다. 이름을 고르거나 직접 적으면 된다.<br>
  한 편에 <b>여러 번</b> 누를 수 있다 — 절임물 ＋ 양념처럼 묶음이 둘일 때 그렇게 쓴다.<br>
  같은 줄을 다시 누르면 취소된다. 고른 것은 <b>저절로 저장</b>되니 중간에 닫아도 된다.
</div>
<main>${할것.map(편HTML).join('')}</main>
<div id="out"></div>
<dialog id="dlg">
  <h3>묶음 이름</h3>
  <input id="nm" placeholder="예: 양념">
  <div class="chips">${흔한이름.map((n) => `<button data-n="${n}">${n}</button>`).join('')}</div>
  <div class="row"><button class="g2" id="cancel">취소</button><button id="ok">넣기</button></div>
</dialog>
<script>
var KEY='hankki:pan:재료묶음:0916'
var 편이름=${JSON.stringify(할것.map((p) => p.이름))}
var 고름={}
try{고름=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){고름={}}
function 저장(){try{localStorage.setItem(KEY,JSON.stringify(고름))}catch(e){}}
function 그린다(){
  var 정한편=0
  편이름.forEach(function(_,k){
    var m=고름[k]||{}
    var keys=Object.keys(m)
    if(keys.length)정한편++
    var sec=document.querySelector('.p[data-k="'+k+'"]')
    if(!sec)return
    sec.classList.toggle('done',keys.length>0)
    sec.querySelector('#c'+k).textContent='묶음 '+keys.length
    var rows=sec.querySelectorAll('.r')
    var 지금=null
    rows.forEach(function(r,i){
      var 이름=m[i]
      var g=document.getElementById('g'+k+'_'+i)
      if(이름){지금=이름;r.classList.add('head');r.classList.remove('under');g.textContent='['+이름+']'}
      else{r.classList.remove('head');g.textContent='';r.classList.toggle('under',!!지금)}
    })
  })
  document.getElementById('cnt').textContent=정한편
}
var 대상=null
document.addEventListener('click',function(e){
  var b=e.target.closest('.cut'); if(!b)return
  var k=b.dataset.k,i=b.dataset.i
  var m=고름[k]||{}
  if(m[i]){delete m[i];고름[k]=m;if(!Object.keys(m).length)delete 고름[k];저장();그린다();return}
  대상={k:k,i:i}
  document.getElementById('nm').value=''
  document.getElementById('dlg').showModal()
  setTimeout(function(){document.getElementById('nm').focus()},50)
})
document.querySelectorAll('.chips button').forEach(function(b){
  b.addEventListener('click',function(){document.getElementById('nm').value=b.dataset.n})
})
document.getElementById('cancel').addEventListener('click',function(){document.getElementById('dlg').close()})
document.getElementById('ok').addEventListener('click',function(){
  var v=document.getElementById('nm').value.trim()
  if(!v||!대상){document.getElementById('dlg').close();return}
  var m=고름[대상.k]||{}; m[대상.i]=v; 고름[대상.k]=m
  저장(); 그린다(); document.getElementById('dlg').close()
})
document.getElementById('reset').addEventListener('click',function(){
  if(!confirm('고른 것을 전부 지울까요?'))return
  고름={};저장();그린다()
})
function 글만들기(){
  var L=['# 재료 묶음 — 창업자가 고른 것 (2026-09-16)','']
  var n=0
  편이름.forEach(function(이름,k){
    var m=고름[k]; if(!m)return
    n++
    var ks=Object.keys(m).map(Number).sort(function(a,b){return a-b})
    L.push('- '+이름+' : '+ks.map(function(i){return i+'번째 줄부터 ['+m[i]+']'}).join(' · '))
  })
  L.splice(1,0,'정한 편 = '+n+'편 / '+편이름.length+'편','')
  return L.join('\\n')
}
document.getElementById('copy').addEventListener('click',function(){
  var t=글만들기()
  var out=document.getElementById('out')
  // ⛔ writeText 는 «성공으로 resolve 되고도» 실패한다 — 그래서 글을 화면에도 띄운다(v10.97 사고)
  out.style.display='block'; out.textContent=t
  try{navigator.clipboard.writeText(t).then(function(){},function(){})}catch(e){}
  out.scrollIntoView({behavior:'smooth',block:'center'})
})
그린다()
</script></body></html>`

const 나갈곳 = process.env.PAN_OUT || '/tmp/재료묶음-검수판-2026-09-16.html'
writeFileSync(나갈곳, html)
console.log(`✅ ${나갈곳}`)
console.log(`   전체 ${편들.length}편 · 이미 묶음 있음 ${이미.length}편 · 고를 것 ${할것.length}편`)
