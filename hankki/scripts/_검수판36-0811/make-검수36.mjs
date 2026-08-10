import { readFileSync, writeFileSync } from 'node:fs'
import { 창업자말, 내가한것, 뺀것, 물어볼것, 정정2차, 전수정정, 전수한것 } from './검수36-데이터.mjs'

const DIR = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const d = JSON.parse(readFileSync('/home/user/hankki/hankki/docs/_대기/레시피-정리-초안-2026-08-10.json', 'utf8'))
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// 🖍 고친 자리를 눈에 띄게 — 「(…)」 안의 대체품과 우리 양념 이름
// ⚠️ 순서가 중요하다 — 긴 낱말을 «먼저» 칠해야 짧은 낱말이 그 안을 안 쪼갠다
//    (「해물가루육수」를 먼저 칠해야 「야채가루육수」·「가루육수」가 안 깨진다)
const 강조말 = ['해물가루육수', '야채가루육수', '초피액젓', '멸치액젓', '아우노슈가', '일반설탕',
  '올리브유', '올리고당', '그릭요거트', '갈아만든배', '배즙', '백간장']
const 칠 = (s) => {
  let out = esc(s)
  for (const w of 강조말) out = out.split(w).join(`<b class="hi">${w}</b>`)
  return out.replace(/(（|\()([^)）]*)(\)|）)/g, '<span class="sub">($2)</span>')
}

// ⛔ 개수를 손으로 세지 말 것 — 데이터에서 «센다»
const 식용유편 = ['간장 제육볶음', '마파두부', '매콤 콩나물덮밥', '목살조림', '10분 버섯밥']
const 손댔나 = (t) => !!창업자말[t] || !!정정2차[t] || 식용유편.includes(t)
const 고침수 = d.filter((r) => 손댔나(r.title)).length
const 오늘수 = d.filter((r) => !!정정2차[r.title] || 식용유편.includes(r.title)).length

const cards = d.map((r) => {
  const 고쳤나 = 손댔나(r.title)
  const 한것 = 내가한것[r.title] || []
  const 오늘 = 정정2차[r.title]
  const 식용유 = 식용유편.includes(r.title)
  const 새것 = !!오늘 || 식용유
  return `
<article class="rc${고쳤나 ? ' fix' : ''}${새것 ? ' n2' : ''}" data-it data-q="${esc(r.title)} ${고쳤나 ? '고침' : '그대로'} ${새것 ? '오늘' : ''}">
  <header>
    <span class="cat ${r.cat}">${r.cat === 'home' ? '🏠 생활요리' : '⭐ 특별한 날'}</span>
    <h3>${esc(r.title)}</h3>
    ${새것 ? '<span class="badge b-new">🔁 오늘 아침</span>' : ''}
    <span class="badge ${고쳤나 ? 'b-fix' : 'b-ok'}">${고쳤나 ? '✏️ 고침' : '✅ 그대로'}</span>
  </header>

  ${오늘 ? `<div class="diff new">
    <div class="said"><span class="k">🔁 오늘 아침 네가 말한 것</span><p>${esc(오늘[0])}</p></div>
    <div class="did"><span class="k">내가 한 것</span><ul>${오늘[1].map((x) => `<li>${칠(x)}</li>`).join('')}</ul></div>
  </div>` : ''}
  ${식용유 && !오늘 ? `<div class="diff new">
    <div class="said"><span class="k">🔁 오늘 아침 네가 말한 것</span><p>${esc(전수정정[0])}</p></div>
    <div class="did"><span class="k">내가 한 것</span><ul><li>${칠('식용유 → 올리브유')}</li></ul></div>
  </div>` : ''}
  ${식용유 && 오늘 ? `<div class="diff new">
    <div class="said"><span class="k">🔁 오늘 아침 ＋ 전수</span><p>${esc(전수정정[0])}</p></div>
    <div class="did"><span class="k">내가 한 것</span><ul><li>${칠('식용유 → 올리브유')}</li></ul></div>
  </div>` : ''}

  ${창업자말[r.title] ? `<div class="diff">
    <div class="said"><span class="k">어제 네가 말한 것</span><p>${esc(창업자말[r.title])}</p></div>
    <div class="did"><span class="k">내가 한 것</span><ul>${한것.map((x) => `<li>${칠(x)}</li>`).join('')}</ul></div>
  </div>` : ''}

  <div class="body">
    <div class="col">
      <h4>재료 <span class="n">${r.ingredients.length}</span></h4>
      <ul class="ing">${r.ingredients.map((x) => (x.startsWith('[') ? `<li class="sec">${esc(x)}</li>` : `<li>${칠(x)}</li>`)).join('')}</ul>
    </div>
    <div class="col">
      <h4>만드는 법 <span class="n">${r.steps.length}</span></h4>
      <ol class="stp">${r.steps.map((x) => `<li>${칠(x)}</li>`).join('')}</ol>
      ${r.memo ? `<div class="memo"><span class="k">메모</span>${r.memo.split('\n').map((x) => `<p>${칠(x)}</p>`).join('')}</div>` : ''}
    </div>
  </div>
</article>`
}).join('')

const html = `<title>레시피 36편 — 고친 것 확인</title>
<style>
:root{--bg:#F7F4EC;--surface:#FFFDF8;--sunk:#F1ECE1;--ink:#3A2A1C;--muted:#8A7660;--line:#E5DCCB;
  --ok:#5F7A5A;--ok-bg:#E9F0E6;--fix:#A9762A;--fix-bg:#F8EFDD;--out:#A05A5A;--out-bg:#F4E6E3;
  --said:#5878A0;--said-bg:#EAF0F7;--hi:#8A5A18;--hi-bg:#F6E7C9;
  --new:#3F7D78;--new-bg:#E3F0EE;
  --shadow:0 1px 2px rgba(58,42,28,.06),0 8px 24px rgba(58,42,28,.05);}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#191510;--surface:#231E17;--sunk:#1E1912;
  --ink:#EFE6D8;--muted:#A5927A;--line:#392F23;--ok:#93B58B;--ok-bg:#22301F;--fix:#DDAE5E;--fix-bg:#332812;
  --out:#D28E8E;--out-bg:#331E1E;--said:#8CAFD6;--said-bg:#1C2530;--hi:#E7BF7A;--hi-bg:#3A2C13;
  --shadow:0 1px 2px rgba(0,0,0,.4),0 8px 24px rgba(0,0,0,.35);}}
:root[data-theme="dark"]{--bg:#191510;--surface:#231E17;--sunk:#1E1912;--ink:#EFE6D8;--muted:#A5927A;--line:#392F23;
  --ok:#93B58B;--ok-bg:#22301F;--fix:#DDAE5E;--fix-bg:#332812;--out:#D28E8E;--out-bg:#331E1E;
  --said:#8CAFD6;--said-bg:#1C2530;--hi:#E7BF7A;--hi-bg:#3A2C13;--new:#7FBFB8;--new-bg:#152A28;--shadow:0 1px 2px rgba(0,0,0,.4),0 8px 24px rgba(0,0,0,.35);}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);line-height:1.65;-webkit-text-size-adjust:100%;
  font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif}
.wrap{max-width:720px;margin:0 auto;padding:0 13px 60px}
.hero{padding:26px 0 6px}
.kicker{font-size:12px;letter-spacing:.14em;color:var(--muted);font-weight:700;margin:0 0 7px}
h1{margin:0 0 9px;font-size:25px;line-height:1.28;letter-spacing:-.01em;text-wrap:balance}
.lead{margin:0;color:var(--muted);font-size:14.5px}
.sum{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:16px 0 0}
.card{background:var(--surface);border:1px solid var(--line);border-radius:13px;padding:11px 13px;box-shadow:var(--shadow)}
.card b{display:block;font-size:21px;font-variant-numeric:tabular-nums;line-height:1.2}
.card span{font-size:12px;color:var(--muted)}
.card.a b{color:var(--fix)} .card.b b{color:var(--ok)} .card.c b{color:var(--out)} .card.d b{color:var(--new)}
.allfix{margin:14px 0 0;padding:13px 15px;background:var(--new-bg);border-radius:13px;
  border:1px solid color-mix(in srgb,var(--new) 25%,transparent)}
.allfix h2{margin:0 0 8px;font-size:14px;color:var(--new);letter-spacing:.02em}
.allfix .q{margin:0 0 6px;font-size:13.5px;color:var(--ink);font-style:italic}
.allfix ul{margin:9px 0 0;padding-left:17px} .allfix li{font-size:13.5px;color:var(--muted);margin-bottom:4px}
.ask{margin:14px 0 0;padding:13px 15px;background:var(--said-bg);border:1px solid color-mix(in srgb,var(--said) 25%,transparent);border-radius:13px}
.ask h2{margin:0 0 7px;font-size:14px;color:var(--said);letter-spacing:.02em}
.ask li{font-size:13.5px;color:var(--muted);margin-bottom:5px}
.ask b{color:var(--ink)}
.out{margin:12px 0 0;padding:12px 15px;background:var(--out-bg);border-radius:13px;font-size:13.5px;color:var(--out)}
.out b{color:var(--ink)}
.out span{color:var(--muted);font-weight:400}
/* 🔎 찾기 */
.find{position:sticky;top:0;z-index:5;margin:16px -13px 0;padding:10px 13px;background:var(--bg)}
.findbox{display:flex;align-items:center;gap:9px;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:9px 12px;box-shadow:var(--shadow)}
#q{flex:1;min-width:0;border:0;background:transparent;color:var(--ink);font:inherit;font-size:15px;outline:none}
.chips{display:flex;gap:6px;margin:8px 0 0;flex-wrap:wrap}
.chip{font-size:12.5px;font-weight:700;padding:5px 11px;border-radius:999px;border:1px solid var(--line);
  background:var(--surface);color:var(--muted);cursor:pointer}
.chip[aria-pressed="true"]{background:var(--ink);color:var(--bg);border-color:var(--ink)}
/* 레시피 카드 */
.rc{margin:14px 0 0;background:var(--surface);border:1px solid var(--line);border-radius:15px;padding:14px 15px;box-shadow:var(--shadow)}
.rc.fix{border-left:3px solid var(--fix)}
.rc header{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:9px}
.rc h3{margin:0;font-size:18px;letter-spacing:-.01em;flex:1;min-width:0}
.cat{font-size:11px;font-weight:700;padding:3px 8px;border-radius:7px;background:var(--sunk);color:var(--muted);white-space:nowrap}
.badge{font-size:11px;font-weight:800;padding:3px 9px;border-radius:7px;white-space:nowrap}
.b-fix{background:var(--fix-bg);color:var(--fix)} .b-ok{background:var(--ok-bg);color:var(--ok)}
.b-new{background:var(--new-bg);color:var(--new)}
.rc.n2{border-left:3px solid var(--new)}
.diff.new .said{background:var(--new-bg)} .diff.new .said .k{color:var(--new)}
.diff.new .did{background:var(--new-bg);opacity:.96} .diff.new .did .k{color:var(--new)}
.diff{display:grid;gap:8px;margin:0 0 12px}
@media(min-width:560px){.diff{grid-template-columns:1fr 1fr}}
.said,.did{border-radius:11px;padding:10px 12px;font-size:13.5px}
.said{background:var(--said-bg)} .did{background:var(--fix-bg)}
.said .k,.did .k{display:block;font-size:11px;font-weight:800;letter-spacing:.04em;margin-bottom:4px}
.said .k{color:var(--said)} .did .k{color:var(--fix)}
.said p{margin:0;color:var(--ink);white-space:pre-wrap}
.did ul{margin:0;padding-left:16px} .did li{margin-bottom:3px;color:var(--ink)}
.body{display:grid;gap:14px}
@media(min-width:560px){.body{grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr)}}
.col h4{margin:0 0 6px;font-size:12px;letter-spacing:.05em;color:var(--muted);display:flex;align-items:center;gap:6px}
.col h4 .n{background:var(--sunk);border-radius:6px;padding:1px 6px;font-variant-numeric:tabular-nums}
.ing,.stp{margin:0;font-size:14px}
.ing{padding:0;list-style:none} .ing li{padding:3px 0;border-top:1px dotted var(--line)}
.ing li:first-child{border-top:0}
.ing li.sec{font-weight:800;color:var(--muted);font-size:12.5px;padding-top:8px}
.stp{padding-left:19px} .stp li{padding:3px 0;margin-bottom:1px}
.memo{margin-top:10px;background:var(--sunk);border-radius:11px;padding:10px 12px;font-size:13.5px;color:var(--muted)}
.memo .k{display:block;font-size:11px;font-weight:800;letter-spacing:.04em;color:var(--ink);margin-bottom:4px}
.memo p{margin:0 0 5px} .memo p:last-child{margin:0}
.hi{background:var(--hi-bg);color:var(--hi);border-radius:4px;padding:0 3px;font-weight:800}
.sub{color:var(--muted);font-weight:400}
.rc.hide{display:none}
#cnt{margin:7px 2px 0;font-size:12.5px;color:var(--muted);min-height:19px}
#cnt b{color:var(--ink);font-variant-numeric:tabular-nums}
.foot{margin:30px 0 0;padding:15px;background:var(--sunk);border-radius:14px;font-size:13.5px;color:var(--muted);line-height:1.7}
.foot b{color:var(--ink)}
</style>
<div class="wrap">
  <div class="hero">
    <p class="kicker">한끼 · 레시피 정리 · 2판</p>
    <h1>오늘 아침 정정까지 넣었어</h1>
    <p class="lead">고친 편은 <b>「네가 말한 것 ↔ 내가 한 것」</b>을 나란히 뒀어.
      <b class="hi">🔁 오늘 아침</b> 표시가 붙은 게 방금 고친 거야.</p>
    <div class="sum">
      <div class="card a"><b>${고침수}</b><span>✏️ 고쳤어</span></div>
      <div class="card d"><b>${오늘수}</b><span>🔁 오늘 아침</span></div>
      <div class="card b"><b>${d.length - 고침수}</b><span>✅ 그대로</span></div>
    </div>
    <div class="allfix">
      <h2>🫒 편을 안 가리고 통째로 바꾼 것</h2>
      ${전수정정.map((x) => `<p class="q">“${esc(x)}”</p>`).join('')}
      <ul>${전수한것.map((x) => `<li>${칠(x)}</li>`).join('')}</ul>
    </div>
    <div class="out">⛔ <b>뺀 것</b> — ${뺀것.map(([t]) => t).join(' · ')} <span>(네가 「빼」라고 확정해준 것)</span></div>
    <div class="ask">
      <h2>❓ 이건 네가 한마디 해줘</h2>
      <ul>${물어볼것.map(([t, m]) => `<li><b>${esc(t)}</b> — ${m.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</li>`).join('')}</ul>
    </div>
  </div>

  <div class="find">
    <div class="findbox">
      <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="var(--muted)" stroke-width="1.9" stroke-linecap="round"><circle cx="8.5" cy="8.5" r="5.5"/><path d="M12.8 12.8 17 17"/></svg>
      <input id="q" type="search" placeholder="레시피 이름 찾기 (ㅁㅍㄷㅂ 도 돼)" autocomplete="off">
    </div>
    <div class="chips">
      <button class="chip" data-f="all" aria-pressed="true">전체 ${d.length}</button>
      <button class="chip" data-f="n2" aria-pressed="false">🔁 오늘 아침 ${오늘수}</button>
      <button class="chip" data-f="fix" aria-pressed="false">✏️ 고친 것 ${고침수}</button>
      <button class="chip" data-f="ok" aria-pressed="false">✅ 그대로 ${d.length - 고침수}</button>
    </div>
    <p id="cnt"></p>
  </div>

  ${cards}

  <div class="foot">
    ⭐ 고친 것을 갈래로 묶으면 거의 다 <b>「네 양념으로 바꾸기」</b>야 —
    참치액·멸치액젓·국간장·소금을 <b class="hi">초피액젓</b>으로, 원당·알룰로스·메이플시럽을
    <b class="hi">아우노슈가</b>·<b class="hi">올리고당</b>으로, 현미유·식용유를 <b class="hi">올리브유</b>로.<br><br>
    ⛔⛔ <b>여기 원래 이렇게 적혀 있었어</b> — <i>“네가 짚은 편의, 짚은 것만 고쳤어.
    「식용유」는 ✅그대로 판정 받은 편들에도 있는데 안 건드렸어.”</i><br>
    네가 그 줄을 보고 <b>“이거 다 올리브유로 바꿔줘”</b> 했지. 맞는 말이야 —
    📌 <b>「어느 편을 짚었나」가 아니라 「무엇을 바꾸라 했나」로 읽어야 했어.</b>
    양념을 바꾸는 지시는 편을 안 가리거든. 지금은 5편 7곳 다 바꿨어.<br><br>
    ✅ 그리고 <b>“튀김에는 식용유가 맞다”</b>는 말 듣고 되돌릴 곳을 다시 셌는데
    다섯 다 볶음·조림·밥이라 <b>되돌릴 게 0곳</b>이야. 36편에 튀기는 편은 없어(허니 간장 치킨도 에어프라이어).
  </div>
</div>
<script>
(function(){
  var CHO='\\u3131\\u3132\\u3134\\u3137\\u3138\\u3139\\u3141\\u3142\\u3143\\u3145\\u3146\\u3147\\u3148\\u3149\\u314A\\u314B\\u314C\\u314D\\u314E'
  function chos(s){var o='';for(var i=0;i<s.length;i++){var c=s.charCodeAt(i)
    o+=(c>=0xAC00&&c<=0xD7A3)?CHO.charAt(Math.floor((c-0xAC00)/588)):s.charAt(i)}return o}
  var q=document.getElementById('q'),cnt=document.getElementById('cnt')
  var its=[].slice.call(document.querySelectorAll('[data-it]'))
  its.forEach(function(el){var t=(el.getAttribute('data-q')||'').toLowerCase().replace(/\\s/g,'');el._t=t;el._c=chos(t)})
  var mode='all'
  function run(){
    var v=q.value.toLowerCase().replace(/\\s/g,''), onlyCho=/^[\\u3131-\\u314E]+$/.test(v), n=0
    its.forEach(function(el){
      var okF = mode==='all' ? true
              : mode==='n2'  ? el.classList.contains('n2')
              : (mode==='fix')===el.classList.contains('fix')
      var okQ = !v || (onlyCho?el._c.indexOf(v)>=0:el._t.indexOf(v)>=0)
      var show = okF && okQ
      el.classList.toggle('hide',!show); if(show)n++
    })
    cnt.innerHTML = (v||mode!=='all') ? ('<b>'+n+'</b>편 보임') : ''
  }
  q.addEventListener('input',run)
  document.querySelectorAll('.chip').forEach(function(c){
    c.addEventListener('click',function(){
      mode=c.getAttribute('data-f')
      document.querySelectorAll('.chip').forEach(function(x){x.setAttribute('aria-pressed', String(x===c))})
      run()
    })
  })
})()
</script>`
writeFileSync(`${DIR}/검수36.html`, html)
console.log('OK', Math.round(html.length / 1024), 'KB ·', d.length, '편 · 고침', 고침수)
