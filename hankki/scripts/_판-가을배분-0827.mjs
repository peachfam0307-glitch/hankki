/**
 * 🍂 가을 배분 · 유료팩 판정판 (2026-08-27)  ⏳창업자 판정 대기
 *
 * 📮 창업자 = *"우리 가을팩, 유료팩? 정하는거 마무리하자."*
 *
 * ⭐ 왜 판이 필요한가 = 창업자는 «폰»에서 판정한다. 컷을 눈으로 봐야 「이건 빼자」가 나온다.
 *    절대원칙(2026-08-19) = **검수판은 무조건 체크 ＋ 복사 ＋ 저장(localStorage)**.
 *
 * ⛔ 컷 그림은 «앱 자산 그대로» 쓴다(절대원칙 30) — 흉내내 그리지 않는다.
 *    `_판-가을배분-0827-모으기.mjs` 가 `src/assets/stickers/` 에서 찾아 132px jpg 로 줄인다.
 *
 * 쓰기:
 *   node scripts/_판-가을배분-0827-모으기.mjs scripts/_판-가을배분-0827-안.json /tmp/컷.json
 *   node scripts/_판-가을배분-0827.mjs /tmp/컷.json /tmp/가을판.html
 *
 * 🔖 판 = https://claude.ai/code/artifact/071b4205-554d-4fac-bd26-3a35b36b2f5e
 */

import { readFileSync, writeFileSync } from 'node:fs'
const D = JSON.parse(readFileSync(process.argv[2],'utf8'))
const esc = (s)=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

const 달색 = {
  '9월 — 「가을이 왔어요」':      { c:'#8a7318', t:'이른 가을', now:62, after:37, why:'처음 오는 사람이 «바로 꾸밀 재료»' },
  '10월 — 「추석·수확 ＋ 카롱 데뷔」': { c:'#a8512a', t:'한가운데', now:44, after:33, why:'한 달 써본 사람에게 «돌아올 이유»' },
  '11월 — 「늦가을 ＋ 다꾸 재료」':  { c:'#7a3550', t:'늦가을',   now:43, after:36, why:'겨울로 넘어가기 전 «차분한 재료»' },
}

const 달HTML = Object.entries(D).filter(([k])=>!k.startsWith('⏳')).map(([달, 묶음들], mi)=>{
  const m = 달색[달]
  const 합 = 묶음들.reduce((a,b)=>a+b.items.length,0) + (mi<2?1:0)
  const 묶음 = 묶음들.map(g=>`
    <div class="grp">
      <div class="grp-h"><span class="grp-n">${g.items.length}</span><span>${esc(g.lab)}</span>${g.새것?'<span class="tag-new">재고에서 찾음</span>':''}</div>
      <div class="cuts">${g.items.map(it=>`<img src="${it.d}" alt="${it.k}" loading="lazy">`).join('')}</div>
    </div>`).join('')
  const 배경 = mi===0 ? '<div class="grp"><div class="grp-h"><span class="grp-n">1</span><span>🧵 조각보 배경</span><span class="tag-make">새로 만든다</span></div><div class="bgchip" style="background:repeating-linear-gradient(45deg,#c9a227 0 14px,#a8512a 14px 28px,#7a3550 28px 42px,#5d7c4a 42px 56px);"></div></div>'
             : mi===1 ? '<div class="grp"><div class="grp-h"><span class="grp-n">1</span><span>📜 한지창살 배경</span><span class="tag-make">새로 만든다</span></div><div class="bgchip" style="background:#f3ead6;background-image:linear-gradient(#d9c9a8 1.5px,transparent 1.5px),linear-gradient(90deg,#d9c9a8 1.5px,transparent 1.5px);background-size:26px 26px;"></div></div>' : ''
  return `
  <section class="month" style="--mc:${m.c}">
    <header class="m-h">
      <div>
        <div class="m-eyebrow">${esc(m.t)}</div>
        <h2>${esc(달)}</h2>
        <p class="m-why">${esc(m.why)}</p>
      </div>
      <div class="m-num">
        <div class="bar"><span class="was" style="width:${m.now/62*100}%">${m.now}</span></div>
        <div class="bar"><span class="now" style="width:${m.after/62*100}%">${합}</span></div>
        <div class="m-cap">지금 코드 <b>${m.now}</b> → 이 안 <b>${합}</b></div>
      </div>
    </header>
    ${묶음}${배경}
    <div class="pick" data-q="${esc(달)}">
      <button class="p" data-v="이대로">이대로 좋아</button>
      <button class="p" data-v="바꿀래">바꿀 데 있어</button>
      <textarea placeholder="바꿀 데가 있으면 여기 적어줘 (묶음 이름만 짚어도 돼)"></textarea>
    </div>
  </section>`
}).join('')

const 미룸 = D['⏳ 2027-01 로 미룸 — 계절과 무관한 다꾸 재료']
const 미룸HTML = `
<section class="later">
  <header class="m-h"><div><div class="m-eyebrow">안 없앤다 · 자리만 옮긴다</div><h2>⏳ 2027-01 로 미루는 것 — ${미룸.reduce((a,b)=>a+b.items.length,0)}컷</h2>
  <p class="m-why">계절과 상관없는 다꾸 재료다. 가을에 안 나와도 아쉽지 않고, <b>1월에 새 게 나올 이유</b>가 된다.</p></div></header>
  ${미룸.map(g=>`<div class="grp sm"><div class="grp-h"><span class="grp-n">${g.items.length}</span><span>${esc(g.lab)}</span></div>
    <div class="cuts">${g.items.map(it=>`<img src="${it.d}" alt="${it.k}" loading="lazy">`).join('')}</div></div>`).join('')}
  <div class="pick" data-q="미룸">
    <button class="p" data-v="이대로">미뤄도 돼</button>
    <button class="p" data-v="빼자">이 중에 가을에 넣고 싶은 게 있어</button>
    <textarea placeholder="넣고 싶은 게 있으면 이름만 적어줘"></textarea>
  </div>
</section>`

const HTML = `<title>가을 배분과 유료팩</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap">
<style>
:root{
  --paper:#faf6ee; --ink:#2e2419; --ink2:#6b5c4a; --line:#e2d8c6; --card:#fffdf8;
  --brand:#5d3410; --ok:#4a7c3f; --warn:#a8512a;
}
:root:not([data-theme="light"]){}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){
  --paper:#191510; --ink:#f0e8da; --ink2:#a89a86; --line:#3a3128; --card:#221c15;
  --brand:#d9a86c; --ok:#8fc07f; --warn:#e08a5f;
}}
:root[data-theme="dark"]{
  --paper:#191510; --ink:#f0e8da; --ink2:#a89a86; --line:#3a3128; --card:#221c15;
  --brand:#d9a86c; --ok:#8fc07f; --warn:#e08a5f;
}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);
  font-family:'IBM Plex Sans KR',system-ui,-apple-system,sans-serif;line-height:1.65;
  -webkit-text-size-adjust:100%}
.wrap{max-width:820px;margin:0 auto;padding:28px 18px 90px}
h1,h2,h3{font-family:'Gowun Batang','IBM Plex Sans KR',serif;text-wrap:balance;margin:0}
.top h1{font-size:clamp(26px,6vw,38px);letter-spacing:-.02em;line-height:1.25}
.top .sub{color:var(--ink2);font-size:15px;margin:10px 0 0}
.quote{border-left:3px solid var(--brand);padding:8px 0 8px 14px;margin:18px 0 0;
  color:var(--ink2);font-size:14.5px}
.quote b{color:var(--ink)}
.alarm{margin:22px 0 0;background:var(--card);border:1px solid var(--line);
  border-left:5px solid var(--warn);border-radius:12px;padding:16px 18px}
.alarm .n{font-family:'Gowun Batang',serif;font-size:30px;color:var(--warn);font-weight:700;
  font-variant-numeric:tabular-nums}
.alarm p{margin:6px 0 0;font-size:14.5px;color:var(--ink2)}
.fixed{margin:20px 0 0;display:grid;gap:8px}
.fixed .row{display:flex;gap:10px;align-items:baseline;font-size:14.5px;
  background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 14px}
.fixed .k{color:var(--ok);font-weight:600;white-space:nowrap}
.fixed .v{color:var(--ink2)}
.month,.later{margin:34px 0 0;background:var(--card);border:1px solid var(--line);
  border-radius:16px;padding:20px 18px;border-top:4px solid var(--mc,var(--brand))}
.m-h{display:flex;gap:18px;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;
  padding-bottom:14px;border-bottom:1px solid var(--line);margin-bottom:16px}
.m-eyebrow{font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;
  color:var(--mc,var(--brand));font-weight:600}
.m-h h2{font-size:clamp(19px,4.4vw,24px);margin:4px 0 0}
.m-why{margin:6px 0 0;font-size:14px;color:var(--ink2)}
.m-num{min-width:180px;flex:0 0 auto}
.bar{height:22px;background:color-mix(in srgb,var(--line) 60%,transparent);border-radius:5px;
  margin-bottom:5px;overflow:hidden}
.bar span{display:block;height:100%;border-radius:5px;color:#fff;font-size:12px;font-weight:600;
  text-align:right;padding:1px 7px 0;font-variant-numeric:tabular-nums}
.bar .was{background:color-mix(in srgb,var(--ink2) 55%,transparent)}
.bar .now{background:var(--mc,var(--brand))}
.m-cap{font-size:12px;color:var(--ink2);margin-top:2px}
.m-cap b{color:var(--ink);font-variant-numeric:tabular-nums}
.grp{margin:16px 0 0}
.grp-h{display:flex;gap:8px;align-items:center;font-size:14.5px;font-weight:600;margin-bottom:8px;flex-wrap:wrap}
.grp-n{background:var(--mc,var(--brand));color:#fff;border-radius:999px;min-width:26px;
  text-align:center;font-size:12.5px;padding:1px 8px;font-variant-numeric:tabular-nums}
.tag-new{font-size:11px;font-weight:500;color:var(--ok);border:1px solid var(--ok);
  border-radius:999px;padding:1px 8px}
.tag-make{font-size:11px;font-weight:500;color:var(--warn);border:1px solid var(--warn);
  border-radius:999px;padding:1px 8px}
.cuts{display:flex;flex-wrap:wrap;gap:6px}
.cuts img{width:64px;height:64px;object-fit:contain;background:#f8f6f1;border:1px solid var(--line);
  border-radius:8px;padding:3px}
.grp.sm .cuts img{width:46px;height:46px}
.bgchip{height:56px;border-radius:10px;border:1px solid var(--line)}
.pick{margin:20px 0 0;padding-top:16px;border-top:1px dashed var(--line);display:flex;
  gap:8px;flex-wrap:wrap}
.pick .p{font:inherit;font-size:14px;font-weight:600;padding:9px 16px;border-radius:999px;
  border:1.5px solid var(--line);background:transparent;color:var(--ink);cursor:pointer}
.pick .p:hover{border-color:var(--mc,var(--brand))}
.pick .p[aria-pressed="true"]{background:var(--mc,var(--brand));border-color:var(--mc,var(--brand));color:#fff}
.pick textarea{flex:1 1 100%;font:inherit;font-size:14px;min-height:52px;padding:10px 12px;
  border-radius:10px;border:1px solid var(--line);background:var(--paper);color:var(--ink);resize:vertical}
.paid{margin:34px 0 0;background:var(--card);border:1px solid var(--line);border-radius:16px;
  padding:20px 18px;border-top:4px solid var(--brand)}
.opts{display:grid;gap:10px;margin:14px 0 0}
.opt{border:1.5px solid var(--line);border-radius:12px;padding:14px 16px;cursor:pointer;
  display:block;background:transparent}
.opt[aria-pressed="true"]{border-color:var(--brand);background:color-mix(in srgb,var(--brand) 9%,transparent)}
.opt .price{font-family:'Gowun Batang',serif;font-size:22px;font-weight:700;
  font-variant-numeric:tabular-nums}
.opt .meta{font-size:13.5px;color:var(--ink2);margin-top:4px}
table{width:100%;border-collapse:collapse;font-size:13.5px;margin:14px 0 0}
th,td{padding:8px 10px;border-bottom:1px solid var(--line);text-align:left}
th{color:var(--ink2);font-weight:600;font-size:12.5px}
td.num{text-align:right;font-variant-numeric:tabular-nums}
.tw{overflow-x:auto}
.copybar{position:sticky;bottom:0;margin:34px -18px -90px;padding:14px 18px 20px;
  background:color-mix(in srgb,var(--paper) 92%,transparent);backdrop-filter:blur(8px);
  border-top:1px solid var(--line)}
.copybar button{font:inherit;font-size:15px;font-weight:700;width:100%;padding:14px;
  border-radius:12px;border:0;background:var(--brand);color:var(--paper);cursor:pointer}
.out{width:100%;margin-top:10px;font:inherit;font-size:13px;min-height:0;height:0;padding:0;
  border:0;opacity:0;transition:height .2s}
.out.on{height:150px;padding:10px 12px;opacity:1;border:1px solid var(--line);border-radius:10px;
  background:var(--card);color:var(--ink)}
.note{font-size:13px;color:var(--ink2);margin:8px 0 0}
</style>

<div class="wrap">
<div class="top">
  <h1>가을에 뭘 열고, 유료팩은 얼마로</h1>
  <p class="sub">무료로 매달 여는 것 ＋ 유료 가을팩 — 남은 판정을 한 장에 모았다.</p>
  <div class="quote">📮 창업자 = <b>"무료팩도 너무 많이주거나 하면 유료팩 안사니까 갯수 다시 생각해보자고 했엉"</b><br>
    → <b>"우리 가을팩, 유료팩? 정하는거 마무리하자."</b></div>

  <div class="alarm">
    <div class="n">9월 1일 · D-5</div>
    <p><b>지금 코드 그대로면 그날 62컷이 한꺼번에 열린다.</b> 창업자가 정한 「한 달 35~40장 이내」의 <b>1.6배</b>다.
       10월 44 · 11월 43 · <b>12월은 0컷</b>(겨울 자산 119장이 있는데 날짜가 안 박혀 있다).</p>
  </div>

  <div class="fixed">
    <div class="row"><span class="k">✅ 이미 정한 것</span><span class="v">한 달에 <b>35~40장 이내</b> · 종류는 <b>골고루일 필요 없다</b> · 프레임은 <b>매달 안 줘도 된다</b></span></div>
    <div class="row"><span class="k">✅ 이미 정한 것</span><span class="v">유료 가을팩 = <b>다꾸＋수채 통합 66컷</b> · 팩 하나 ≤ 70컷 · 시트 한 장 ≤ 25컷</span></div>
    <div class="row"><span class="k">✅ 창업자가 눈으로 잡은 것</span><span class="v">9월 프레임 4개 별로 · 마테 2개 섞임 · 10월 겹치는 곰 · 11월 겹치는 종이 — <b>넷 다 이 안에 반영했다</b></span></div>
  </div>
</div>

${달HTML}
${미룸HTML}

<section class="paid">
  <header class="m-h"><div><div class="m-eyebrow">남은 판정 둘</div><h2>💰 유료 꾸미기팩은 얼마로</h2>
  <p class="m-why">AI 레시피열쇠 990원은 <b>확정(재확인)</b>이다 — 소모품이라 싸야 재구매가 돈다.<br>
  꾸미기팩은 성격이 정반대다: <b>한 번 사면 영구 · 원가 0 · 재구매 압력 없음</b>. 창업자가 마음에 둔 범위는 1,300~1,500원.</p></div></header>

  <div class="tw"><table>
    <tr><th>가격</th><th class="num">한 팩 실수령<br>(구글 15%)</th><th class="num">연 2,000만원까지<br>하루 몇 팩</th><th>느낌</th></tr>
    <tr><td>990원</td><td class="num">841원</td><td class="num">65팩</td><td>지금 코드에 박힌 값</td></tr>
    <tr><td>1,300원</td><td class="num">1,105원</td><td class="num">50팩</td><td>창업자 범위 아래쪽</td></tr>
    <tr><td>1,500원</td><td class="num">1,275원</td><td class="num">43팩</td><td>창업자 범위 위쪽 · 클로드 추천</td></tr>
  </table></div>

  <div class="opts" data-q="가격">
    <button class="opt" data-v="990원 유지"><div class="price">990원</div>
      <div class="meta">AI 열쇠와 같은 값. 싸다는 인상은 확실하지만 <b>66컷 팩의 값어치가 깎인다</b>.</div></button>
    <button class="opt" data-v="1300원"><div class="price">1,300원</div>
      <div class="meta">천원대 첫 칸. 990에서 올린 티가 나면서 부담은 거의 같다.</div></button>
    <button class="opt" data-v="1500원"><div class="price">1,500원 <span style="font-size:12px;color:var(--ok);font-weight:600">클로드 추천</span></div>
      <div class="meta">66컷이면 <b>컷당 23원</b>이다. 매달 무료 컷이 열려 「사도 앱이 없어지나」 걱정을 스스로 지운다 —
      인디의 약점은 <b>가격을 깎아서가 아니라 신뢰로</b> 갚는 게 맞다.</div></button>
  </div>

  <div class="quote" style="margin-top:18px">⏰ <b>지금이 마지막으로 자유로운 순간이다</b> — 아직 아무도 안 샀다(<code>sellable</code> 전부 false).
    가격은 <b>내리긴 쉽고 올리긴 어렵다</b>(리뷰에 "올랐네"가 박힌다).</div>

  <div class="pick" data-q="언제팔까" style="margin-top:20px">
    <div style="flex:1 1 100%;font-weight:600;font-size:14.5px;margin-bottom:2px">🗓 결제 스위치는 언제 켤까</div>
    <button class="p" data-v="9월에 켠다">9월에 켠다</button>
    <button class="p" data-v="10월 이후">10월 이후로 미룬다</button>
    <button class="p" data-v="아직 모르겠다">아직 모르겠다</button>
    <p class="note" style="flex:1 1 100%">⛔ 어느 쪽이든 <b>명의 이전(8/28~)이 먼저</b>다 — 오늘 정한 그대로.
      그리고 켜는 날 <b>넷을 같이</b> 맞춰야 한다(콘텐츠 등급 · 데이터 보안 · 처리방침 · Play 인앱구매 표시).</p>
  </div>
</section>

<div class="copybar">
  <button id="copy">고른 것 복사하기</button>
  <textarea class="out" id="out" readonly></textarea>
  <p class="note" id="hint">고르면 저절로 저장돼. 폰을 껐다 켜도 남아 있어.</p>
</div>
</div>

<script>
const KEY='hankki:가을판:0827'
let 답={}
try{ 답 = JSON.parse(localStorage.getItem(KEY)||'{}') }catch(e){ 답={} }
function 저장(){ try{ localStorage.setItem(KEY, JSON.stringify(답)) }catch(e){} }
function 그리기(){
  document.querySelectorAll('[data-q]').forEach(box=>{
    const q = box.dataset.q
    box.querySelectorAll('button[data-v]').forEach(b=>{
      b.setAttribute('aria-pressed', String(답[q]?.v === b.dataset.v))
    })
    const t = box.querySelector('textarea')
    if (t && 답[q]?.memo != null && t.value !== 답[q].memo) t.value = 답[q].memo
  })
}
document.querySelectorAll('[data-q]').forEach(box=>{
  const q = box.dataset.q
  box.querySelectorAll('button[data-v]').forEach(b=>{
    b.addEventListener('click', ()=>{
      답[q] = { ...(답[q]||{}), v: 답[q]?.v === b.dataset.v ? null : b.dataset.v }
      저장(); 그리기()
    })
  })
  const t = box.querySelector('textarea')
  if (t) t.addEventListener('input', ()=>{ 답[q] = { ...(답[q]||{}), memo: t.value }; 저장() })
})
그리기()

function 글자(){
  const 줄 = ['🍂 가을 배분 · 유료팩 판정 (2026-08-27)','']
  for (const [q, a] of Object.entries(답)){
    if (!a || (!a.v && !a.memo)) continue
    줄.push('· ' + q + ' → ' + (a.v || '(안 고름)') + (a.memo ? '   ✏️ ' + a.memo : ''))
  }
  if (줄.length === 2) 줄.push('(아직 아무것도 안 골랐어)')
  return 줄.join('\\n')
}
document.getElementById('copy').addEventListener('click', async ()=>{
  const s = 글자(), out = document.getElementById('out'), hint = document.getElementById('hint')
  out.value = s; out.classList.add('on')
  try{
    await navigator.clipboard.writeText(s)
    hint.textContent = '✅ 복사됐어 — 그대로 붙여넣으면 돼.'
  }catch(e){
    out.focus(); out.select()
    try{
      const r = document.createRange(); r.selectNodeContents(out)
      const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r)
    }catch(e2){}
    hint.textContent = '⚠️ 자동 복사가 막혔어 — 아래 글자를 길게 눌러서 복사해줘.'
  }
})
</script>`
writeFileSync(process.argv[3], HTML)
console.log('✅', (HTML.length/1024/1024).toFixed(2), 'MB')
