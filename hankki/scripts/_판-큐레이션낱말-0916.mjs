// 🛒📋 **큐레이션이 레시피에 «안 붙는» 문제 — 낱말 검수판** (2026-09-16)
//
// 📮 창업자 = *"고춧가루 외에는 재료에 들어가는게 없어? 어묵, 다른 양념 치즈 등등"*
//        ＋ *"스톡류 훈제오리 등등.."* ＋ *"고기류도 쿠팡꺼 많던데"*
//        ＋ *"넣을거 뺄거 알려줄게. 내가 적을 곳도 마련해줘"*
//
// 🔢 실측(앱과 «같은 함수» `picksForIngredients` 로 203편 전수) —
//    큐레이션 129개 중 레시피에 붙는 것은 **36개(28%)**, **93개(72%)가 한 번도 안 붙는다.**
//
// 🌲 뿌리 = `matches`(재료 이름으로 붙는 낱말)가 «없거나 좁다».
//    ① matches 가 없다 → 재료 줄에 **풀네임**이 그대로 있어야만 붙는다 (어묵탕맛·전통된장…)
//    ② matches 는 있는데 그 낱말을 쓰는 레시피가 0편이다 (「대패목심」 — 레시피엔 「대패삼겹」뿐)
//
// ⛔⛔ **`matches` 를 클로드가 지어내지 않는다.** 2026-08-03 사고 =
//    재료가 `노두유`(중국 진간장)인데 「두유」가 걸려 **국산콩두유** 광고가 붙었다.
//    같은 꼴 = 「간장게장」↔간장 · 「참치액」↔참치 · 「고추장아찌」↔고추장.
//    ⭐ 그래서 이 판은 **후보 낱말마다 «몇 편에 붙는지» 숫자를 보여주고 창업자가 고른다.**
//
// 🔒 검수판 게이트 둘 (`check-panmemo` · `check-pancopy`)
//    ① localStorage 로 고른 것 기억  ② 결과 복사 ＋ 복사 실패 폴백
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-큐레이션낱말-0916.mjs
//   (먼저 /tmp/편토큰.json · /tmp/픽셈.json 이 있어야 한다 — 만드는 법은 아래 주석)
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const APP = join(dirname(fileURLToPath(import.meta.url)), '..')
const cur = readFileSync(join(APP, 'src/data/curation.js'), 'utf8')

// 📦 편별 재료 토큰 — `basics.js` 는 vite `import.meta.glob` 을 써서 node 로 못 연다.
//    그래서 esbuild 로 번들해 한 번 뽑아 둔 값을 읽는다(만드는 법은 작업복기에).
const 편 = JSON.parse(readFileSync('/tmp/편토큰.json', 'utf8'))
const 붙는셈 = JSON.parse(readFileSync('/tmp/픽셈.json', 'utf8')).셈

// 🧭 앱과 «같은 잣대» — `startsWith` 로 낱말 «앞»을 본다(조사는 뒤에 붙는다)
const 몇편 = (w) => {
  if (!w) return 0
  let n = 0
  for (const p of 편) if (p.tokens.some((t) => t.startsWith(w))) n++
  return n
}

// 🛒 제품 목록 — PRODUCTS 안의 덩어리를 하나씩
const 것들 = [...cur.matchAll(/\{\s*name: '([^']+)'[^}]*\}/g)].map((m) => {
  const 전체 = m[0]
  return {
    이름: m[1],
    브랜드: (/brand: '([^']*)'/.exec(전체) || [])[1] || '',
    몰: (/mall: '([^']*)'/.exec(전체) || [])[1] || '',
    matches: (/matches: \[([^\]]*)\]/.exec(전체) || [])[1]
      ? [...((/matches: \[([^\]]*)\]/.exec(전체) || [])[1]).matchAll(/'([^']+)'/g)].map((x) => x[1]) : [],
  }
})
const 유일 = {}; 것들.forEach((p) => { if (!유일[p.이름]) 유일[p.이름] = p })
const 제품 = Object.values(유일)
const 안붙음 = 제품.filter((p) => !붙는셈[p.이름])

// 💡 후보 낱말 = 제품 «이름»을 잘라 만든 조각 중 **실제로 레시피에 있는 것**
//    ⛔ 제안일 뿐이다 — 숫자를 같이 보여주고 창업자가 고른다.
const 후보만들기 = (p) => {
  const 씨 = new Set()
  for (const w of String(p.이름).split(/[\s·/()]+/)) if (w.length >= 2) 씨.add(w)
  // 「~ 200g」 같은 꼬리는 뺀다
  const 나온것 = [...씨].filter((w) => !/^\d/.test(w)).map((w) => ({ w, n: 몇편(w) })).filter((x) => x.n > 0)
  // 지금 matches 도 숫자와 함께 보여준다(0편이면 왜 안 붙는지가 보인다)
  const 지금 = p.matches.map((w) => ({ w, n: 몇편(w), 지금: true }))
  const 합 = [...지금]
  for (const c of 나온것) if (!합.some((x) => x.w === c.w)) 합.push(c)
  return 합.sort((a, b) => b.n - a.n).slice(0, 8)
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const 카드 = (p, k) => {
  const 후보 = 후보만들기(p)
  return `
<section class="p" data-k="${k}" data-name="${esc(p.이름)}">
  <h2>
    <span class="t">${esc(p.이름)}</span>
    ${p.브랜드 ? `<span class="b">${esc(p.브랜드)}</span>` : ''}
    ${p.몰 ? `<span class="m">${esc(p.몰)}</span>` : ''}
  </h2>
  <div class="now">지금 낱말 ${p.matches.length ? p.matches.map((w) => `<code>${esc(w)}</code>`).join(' ') : '<i>없다 — 풀네임이 재료에 그대로 있어야만 붙는다</i>'}</div>
  <div class="chips">
    ${후보.length ? 후보.map((c) => `<button class="w${c.지금 ? ' cur' : ''}" data-k="${k}" data-w="${esc(c.w)}">${esc(c.w)} <b>${c.n}편</b></button>`).join('') : '<i class="none">레시피에 나오는 낱말이 하나도 없다 — 직접 적어야 한다</i>'}
  </div>
  <div class="row">
    <input class="free" data-k="${k}" placeholder="직접 적기 (쉼표로 여러 개)">
    <button class="skip" data-k="${k}">안 넣음</button>
  </div>
  <div class="pick" id="pk${k}"></div>
</section>`
}

const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>큐레이션 낱말 검수판 — 2026-09-16</title>
<style>
:root{--bg:#fdf6ee;--ink:#3b342c;--sub:#8d8175;--line:#e9dfd2;--pt:#5878a0;--card:#fff;--warn:#c2703f}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 -apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Pretendard',sans-serif;padding:0 0 120px}
header{position:sticky;top:0;z-index:9;background:var(--bg);border-bottom:1px solid var(--line);padding:14px 16px 12px}
h1{margin:0 0 4px;font-size:17px}
.sum{font-size:13px;color:var(--sub)}
.bar{display:flex;gap:6px;margin-top:10px}
.bar button{flex:1;border:none;border-radius:10px;padding:10px 8px;font-size:13px;font-weight:700;background:var(--pt);color:#fff}
.bar button.g2{background:#e9dfd2;color:var(--ink)}
main{padding:0 16px}
.p{background:var(--card);border:1px solid var(--line);border-radius:14px;margin:12px 0;padding:12px}
.p.done{border-color:var(--pt)}
.p.skip{opacity:.42}
h2{margin:0 0 6px;font-size:15.5px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
h2 .t{font-weight:800}
h2 .b{font-size:12px;color:var(--sub)}
h2 .m{font-size:11px;background:#f0e8dc;border-radius:5px;padding:1px 5px;color:var(--sub)}
.now{font-size:12.5px;color:var(--sub);margin-bottom:8px}
.now code{background:#f3ece2;border-radius:5px;padding:1px 5px;font-size:12px}
.now i{color:var(--warn)}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.chips .w{border:1px solid var(--line);background:#fff;border-radius:999px;padding:6px 10px;font-size:13px;color:var(--ink)}
.chips .w b{color:var(--pt);font-size:12px}
.chips .w.cur{border-style:dashed}
.chips .w.on{background:var(--pt);color:#fff;border-color:var(--pt)}
.chips .w.on b{color:#fff}
.chips .none{font-size:12.5px;color:var(--warn)}
.row{display:flex;gap:6px}
.row input{flex:1;min-width:0;padding:8px 10px;border:1px solid var(--line);border-radius:10px;font-size:14px}
.row .skip{flex:0 0 auto;border:1px solid var(--line);background:#fff;border-radius:10px;padding:8px 12px;font-size:13px;color:var(--sub)}
.row .skip.on{background:var(--warn);color:#fff;border-color:var(--warn)}
.pick{font-size:13px;color:var(--pt);font-weight:700;margin-top:8px;min-height:0}
#out{white-space:pre-wrap;font-size:12px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px;margin:12px 16px;display:none;user-select:all}
.note{font-size:12.5px;color:var(--sub);margin:10px 16px;line-height:1.7}
</style></head><body>
<header>
  <h1>🛒 큐레이션 낱말 검수판</h1>
  <div class="sum">큐레이션 ${제품.length}개 중 <b>레시피에 안 붙는 ${안붙음.length}개</b> · <span id="cnt">0</span>개 정했다</div>
  <div class="bar"><button id="copy">📋 결과 복사</button><button class="g2" id="reset">처음부터</button></div>
</header>
<div class="note">
  낱말 알약을 누르면 <b>그 제품이 그 낱말로 붙는다</b>. 옆 숫자는 <b>넣으면 몇 편에 붙는지</b>다.<br>
  점선 알약 = 지금 이미 들어 있는 낱말(<b>0편</b>이면 그게 안 붙는 까닭이다).<br>
  <b>직접 적기</b> 칸에 쓰면 그대로 들어간다 (쉼표로 여러 개).<br>
  안 넣을 제품은 <b>안 넣음</b>. 고른 것은 저절로 저장된다.
</div>
<main>${안붙음.map(카드).join('')}</main>
<div id="out"></div>
<script>
var KEY='hankki:pan:큐레이션낱말:0916'
var 이름들=${JSON.stringify(안붙음.map((p) => p.이름))}
var 고름={}
try{고름=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){고름={}}
function 저장(){try{localStorage.setItem(KEY,JSON.stringify(고름))}catch(e){}}
function 그린다(){
  var n=0
  이름들.forEach(function(_,k){
    var m=고름[k]||{}
    var 낱=(m.w||[]), 자유=(m.free||''), 뺌=!!m.skip
    if(낱.length||자유||뺌)n++
    var sec=document.querySelector('.p[data-k="'+k+'"]')
    if(!sec)return
    sec.classList.toggle('done',(낱.length>0||!!자유)&&!뺌)
    sec.classList.toggle('skip',뺌)
    sec.querySelectorAll('.w').forEach(function(b){b.classList.toggle('on',낱.indexOf(b.dataset.w)>=0)})
    var inp=sec.querySelector('.free'); if(inp.value!==자유)inp.value=자유
    sec.querySelector('.skip').classList.toggle('on',뺌)
    var 다=낱.concat(자유?자유.split(',').map(function(s){return s.trim()}).filter(Boolean):[])
    sec.querySelector('#pk'+k).textContent=뺌?'안 넣음':(다.length?'→ '+다.join(' · '):'')
  })
  document.getElementById('cnt').textContent=n
}
document.addEventListener('click',function(e){
  var b=e.target.closest('.w')
  if(b){var k=b.dataset.k,w=b.dataset.w,m=고름[k]||{};var a=m.w||[]
    var i=a.indexOf(w); if(i>=0)a.splice(i,1); else a.push(w)
    m.w=a; m.skip=false; 고름[k]=m; 저장(); 그린다(); return}
  var s=e.target.closest('.skip')
  if(s){var k2=s.dataset.k,m2=고름[k2]||{}; m2.skip=!m2.skip; if(m2.skip){m2.w=[];m2.free=''} 고름[k2]=m2; 저장(); 그린다()}
})
document.addEventListener('input',function(e){
  var i=e.target.closest('.free'); if(!i)return
  var k=i.dataset.k,m=고름[k]||{}; m.free=i.value; m.skip=false; 고름[k]=m; 저장(); 그린다()
})
document.getElementById('reset').addEventListener('click',function(){
  if(!confirm('고른 것을 전부 지울까요?'))return
  고름={};저장();그린다()
})
function 글만들기(){
  var 넣 =[], 뺄=[]
  이름들.forEach(function(이름,k){
    var m=고름[k]; if(!m)return
    if(m.skip){뺄.push(이름);return}
    var 다=(m.w||[]).concat(m.free?m.free.split(',').map(function(s){return s.trim()}).filter(Boolean):[])
    if(다.length)넣.push('- '+이름+' : '+다.join(', '))
  })
  var L=['# 큐레이션 낱말 — 창업자가 고른 것 (2026-09-16)','']
  L.push('## 넣을 것 ('+넣.length+'개)'); L=L.concat(넣.length?넣:['(없음)'])
  L.push(''); L.push('## 안 넣을 것 ('+뺄.length+'개)'); L=L.concat(뺄.length?뺄.map(function(n){return '- '+n}):['(없음)'])
  return L.join('\\n')
}
document.getElementById('copy').addEventListener('click',function(){
  var t=글만들기(), out=document.getElementById('out')
  // ⛔ writeText 는 «성공으로 resolve 되고도» 실패한다 — 글을 화면에도 띄운다(v10.97 사고)
  out.style.display='block'; out.textContent=t
  try{navigator.clipboard.writeText(t).then(function(){},function(){})}catch(e){}
  out.scrollIntoView({behavior:'smooth',block:'center'})
})
그린다()
</script></body></html>`

const 나갈곳 = process.env.PAN_OUT || '/tmp/큐레이션낱말-검수판-2026-09-16.html'
writeFileSync(나갈곳, html)
console.log(`✅ ${나갈곳}`)
console.log(`   큐레이션 ${제품.length}개 · 레시피에 안 붙는 것 ${안붙음.length}개`)
