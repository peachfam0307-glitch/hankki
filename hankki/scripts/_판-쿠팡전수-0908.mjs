// 🔍 쿠팡 파트너스 링크 «전수검사» 판 — 61개가 진짜 그 제품으로 가나
//
// 📮 창업자 2026-09-08 = *"전수검사하자 쿠팡링크"*
//
// ⛔⛔ **내가 대신 못 연다 — 재보고 확정했다.**
//    `curl -s -o /dev/null -w "%{http_code}" https://link.coupang.com/a/…` → **000**
//    `https://www.coupang.com/` → **000** (프록시가 CONNECT 를 막는다 · 조직 정책)
//    → 링크가 어디로 가는지는 **창업자 폰에서만** 알 수 있다(규칙 15).
//
// ⭐ **짝이 밀렸나»는 이미 논리로 닫혔다**(개수 37 = 자리 46 − 없음 9 · 창업자가 6번 눌러 경계 확정).
//    이 판이 잡는 건 «다른 종류»다 — **링크 자체가 엉뚱한 상품으로 가나.**
//    ⚠️ 실제로 걱정되는 자리가 있다: 풀무원 콩물은 원래 *"검색하면 다른 풀무원 콩물이 먼저 뜬다"* 고
//       상품 링크로 박아뒀던 자리인데, 이번에 검색 링크로 바뀌었다.
//
// ⭐⭐ **순서 = 「위험한 것」 먼저.** 검색어가 짧을수록(브랜드 특정이 약할수록) 엉뚱한 게 먼저 뜬다.
//    🔢 실측 = 낱말 2개 이하 **21개** · 3개 **23개** · 4개 이상 **17개**
//    → 중간에 멈춰도 «위험한 건 이미 봤다»가 되게 한다(창업자 시간 · 규칙 8).
//
// ☑️ 검수판 절대원칙(2026-08-19) = 체크 ＋ 복사 · localStorage 저장(껐다 켜도 이어서).
// 쓰는 법: node scripts/_판-쿠팡전수-0908.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const APP = '/home/user/hankki/hankki'
const cur = readFileSync(`${APP}/src/data/curation.js`, 'utf8')
const 레 = readFileSync(`${APP}/src/data/basics.js`, 'utf8')

// ⛔ 손으로 목록을 적지 않는다 — 코드에서 «지금» 값을 읽는다(손으로 적은 목록은 반드시 낡는다)
const 줄들 = []
for (const m of cur.matchAll(/\{[^{}]*link\.coupang\.com\/a\/[A-Za-z0-9]+[^{}]*\}/g)) {
  const s = m[0]
  const name = (/name: '([^']+)'/.exec(s) || [])[1]
  const brand = (/brand: '([^']+)'/.exec(s) || [])[1] || ''
  const q = (/q: '([^']+)'/.exec(s) || [])[1] || (brand ? `${brand} ${name}` : name)
  const code = /a\/([A-Za-z0-9]+)/.exec(s)[1]
  const mm = /matches:\s*\[([^\]]*)\]/.exec(s)
  const words = mm ? [...mm[1].matchAll(/'([^']+)'/g)].map((x) => x[1]) : []
  const hits = words.reduce((n, w) => n + (레.split(w).length - 1), 0)
  const 낱말 = q.trim().split(/\s+/).length
  줄들.push({ q, code, hits, 위험: 낱말 <= 2 ? 2 : 낱말 === 3 ? 1 : 0 })
}
줄들.sort((a, b) => b.위험 - a.위험 || b.hits - a.hits)

const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>쿠팡 링크 전수검사</title>
<style>
 body{margin:0;background:#f7f4ee;font:15px/1.6 -apple-system,'Noto Sans KR',sans-serif;color:#3a2c1e;padding:14px 12px 96px}
 h1{font-size:19px;margin:0 0 8px}
 .note{background:#fff6e0;border:1px solid #e8d5a8;border-radius:12px;padding:12px 14px;font-size:13.5px;margin:0 0 14px}
 .sec{font-size:14px;font-weight:800;color:#8a7a66;margin:18px 0 8px;padding-left:2px}
 .row{background:#fff;border:1px solid #e8e0d4;border-radius:12px;padding:11px 13px;margin-bottom:8px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
 .row.ok{background:#eefbef;border-color:#a9dcae}
 .row.no{background:#fdeeee;border-color:#e8b3b3}
 .nm{flex:1 1 100%;font-weight:700;font-size:15px}
 .hit{font-weight:400;color:#a08f78;font-size:12.5px;margin-left:6px}
 a.go{background:#5d3410;color:#fff;text-decoration:none;padding:8px 16px;border-radius:9px;font-size:14px;font-weight:700}
 button{padding:8px 14px;border:1px solid #d8cdbc;background:#fff;border-radius:9px;font-size:14px;font-weight:700;color:#3a2c1e}
 button.on{background:#5d3410;color:#fff;border-color:#5d3410}
 .bar{position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:1px solid #e0d6c8;padding:11px 13px;display:flex;gap:10px;align-items:center}
 .bar b{flex:1;font-size:14px}
 .bar button{background:#5d3410;color:#fff;border:0;padding:11px 18px}
 #out{white-space:pre-wrap;font-family:monospace;font-size:12px;background:#fff;border:1px solid #ddd;border-radius:9px;padding:11px;margin-top:12px;display:none}
</style>
<h1>🔍 쿠팡 링크 전수검사 · ${줄들.length}개</h1>
<div class="note">
👉 <b>「열기」</b> 눌러서 뜬 상품이 이름과 <b>같으면 ✅, 다르면 ⛔</b>.<br>
⭐ <b>위험한 것부터</b> 줄 세웠어 — 검색어가 짧을수록 엉뚱한 게 먼저 뜨거든.<br>
중간에 멈춰도 돼. 저장되니까 나중에 이어서 하면 돼.
</div>
<div id="list"></div>
<div id="out"></div>
<div class="bar"><b id="cnt">0 / ${줄들.length}</b><button id="cp">결과 복사</button></div>
<script>
var D=${JSON.stringify(줄들)}
var KEY='hankki:쿠팡전수:0908'
var S={}; try{S=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
var TIT={2:'⚠️ 위험 — 검색어가 짧아 엉뚱한 게 뜰 수 있어',1:'· 주의',0:'· 나머지'}
function build(){
  var h='',last=null
  D.forEach(function(r,i){
    if(r.위험!==last){h+='<div class="sec">'+TIT[r.위험]+'</div>';last=r.위험}
    h+='<div class="row" data-i="'+i+'"><div class="nm">'+r.q+'<span class="hit">'+r.hits+'회</span></div>'
      +'<a class="go" href="https://link.coupang.com/a/'+r.code+'" target="_blank" rel="noopener">열기 ↗</a>'
      +'<button data-v="y">✅</button><button data-v="n">⛔</button></div>'
  })
  document.getElementById('list').innerHTML=h
}
function draw(){
  document.querySelectorAll('.row').forEach(function(el){
    var v=S[el.dataset.i]
    el.classList.toggle('ok',v==='y'); el.classList.toggle('no',v==='n')
    el.querySelectorAll('button').forEach(function(b){b.classList.toggle('on',b.dataset.v===v)})
  })
  document.getElementById('cnt').textContent=Object.keys(S).length+' / '+D.length
}
document.addEventListener('click',function(e){
  var b=e.target.closest('.row button'); if(!b)return
  var i=b.closest('.row').dataset.i
  if(S[i]===b.dataset.v)delete S[i]; else S[i]=b.dataset.v
  try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}
  draw()
})
document.getElementById('cp').onclick=function(){
  var bad=[],ok=0
  D.forEach(function(r,i){ if(S[i]==='n')bad.push(r.q); else if(S[i]==='y')ok++ })
  var t='쿠팡 링크 전수검사\\n확인 '+Object.keys(S).length+'/'+D.length+' · 맞음 '+ok+' · 틀림 '+bad.length
    +(bad.length?'\\n\\n⛔ 틀린 것:\\n'+bad.map(function(x){return '· '+x}).join('\\n'):'\\n\\n틀린 것 없음')
  var o=document.getElementById('out'); o.style.display='block'; o.textContent=t
  try{navigator.clipboard&&navigator.clipboard.writeText(t)}catch(e){}
  var r=document.createRange(); r.selectNodeContents(o)
  var s=getSelection(); s.removeAllRanges(); s.addRange(r)
  o.scrollIntoView({behavior:'smooth',block:'center'})
}
build(); draw()
</script>`

const 낼곳 = '/tmp/claude-0/-home-user-hankki/a2a1e2e3-d972-556f-b791-6ad309c4df0c/scratchpad/쿠팡전수-0908.html'
writeFileSync(낼곳, html)
const c = (n) => 줄들.filter((r) => r.위험 === n).length
console.log(`${줄들.length}개 · 위험 ${c(2)} · 주의 ${c(1)} · 나머지 ${c(0)}`)
console.log(낼곳)
