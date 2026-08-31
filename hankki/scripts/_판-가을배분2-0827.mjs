/**
 * 🍂 가을 배분 «2판» — 컷마다 «번호»를 박는다 (2026-08-27)  ⏳창업자 판정 대기
 *
 * ⭐⭐ **1판을 다시 만든 이유 = 번호가 없었다.**
 *    창업자는 「스티커 3,4,8,10,12 빼」처럼 **세어서** 말하는데 1판엔 번호가 없어
 *    **내가 어느 컷인지 확정할 수 없었다.** 짐작해서 빼면 엉뚱한 컷이 사라진다(규칙 25).
 *
 * ⛔ **뺀 컷을 «지우지 않는다»** — 흐리게 남겨 번호를 유지한다.
 *    지우면 뒤 번호가 당겨져서 **다음 판정 때 또 어긋난다.**
 *
 * 🔖 판 = https://claude.ai/code/artifact/3151edf3-0362-42e8-8d46-37e0244179cd
 *
 * 쓰기:
 *   node scripts/_판-가을배분2-0827-모으기.mjs scripts/_판-가을배분2-0827-안.json /tmp/컷.json
 *   node scripts/_판-가을배분2-0827.mjs /tmp/컷.json /tmp/가을판2.html
 */
import { readFileSync, writeFileSync } from 'node:fs'
const D = JSON.parse(readFileSync(process.argv[2],'utf8'))
const esc = (s)=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
const 달색 = { '9월':'#8a7318', '10월':'#a8512a', '11월':'#7a3550' }
const 달설명 = {
  '9월':'창업자가 짚은 것 — 프레임 3개만 · 스티커 3·4·8·10·12 빼기 · 마테 1·2 빼기 · 어제 준 것 넣기 · 캐릭터 둘 빼기',
  '10월':'「마테는」 하고 말이 끊겼어 — 그것만 알려주면 10월은 끝나',
  '11월':'「5번 다 뺌」이 어느 묶음인지만 알려줘 — 필름 2·3은 이미 뺐어',
}

const 달HTML = Object.entries(D).map(([달, 묶음들])=>{
  const c = 달색[달]
  const 산 = 묶음들.reduce((a,g)=>a + g.items.filter(i=>!i.뺌).length, 0)
  const 묶음 = 묶음들.map(g=>`
    <div class="grp${g.묻기?' ask':''}">
      <div class="grp-h">
        <span class="grp-n">${g.items.filter(i=>!i.뺌).length}</span>
        <span class="grp-l">${esc(g.lab)}</span>
        ${g.반영?`<span class="tag ok">✅ ${esc(g.반영)}</span>`:''}
        ${g.묻기?`<span class="tag ask">❓ 물어볼 것</span>`:''}
      </div>
      ${g.묻기?`<p class="qline">${esc(g.묻기)}</p>`:''}
      <div class="cuts">${g.items.map((it,i)=>`
        <figure class="cut${it.뺌?' out':''}${it.새?' new':''}">
          <span class="num">${i+1}</span>
          <img src="${it.d}" alt="${it.k}" loading="lazy">
          ${it.뺌?'<span class="x">뺐어</span>':''}
        </figure>`).join('')}</div>
      ${g.묻기?`<input class="ans" data-q="${esc(g.id)}" placeholder="번호로 적어줘 — 예: 2, 5, 9  /  다 넣어  /  다 빼">`:''}
    </div>`).join('')
  return `
  <section class="month" style="--mc:${c}">
    <header class="m-h">
      <h2>${esc(달)} <span class="cnt">${산}컷</span></h2>
      <p class="m-why">${esc(달설명[달])}</p>
    </header>
    ${묶음}
  </section>`
}).join('')

const HTML = `<title>가을 배분 2판</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap">
<style>
:root{--paper:#faf6ee;--ink:#2e2419;--ink2:#6b5c4a;--line:#e2d8c6;--card:#fffdf8;--brand:#5d3410;--ok:#4a7c3f;--warn:#a8512a}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--paper:#191510;--ink:#f0e8da;--ink2:#a89a86;--line:#3a3128;--card:#221c15;--brand:#d9a86c;--ok:#8fc07f;--warn:#e08a5f}}
:root[data-theme="dark"]{--paper:#191510;--ink:#f0e8da;--ink2:#a89a86;--line:#3a3128;--card:#221c15;--brand:#d9a86c;--ok:#8fc07f;--warn:#e08a5f}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:'IBM Plex Sans KR',system-ui,sans-serif;line-height:1.65;-webkit-text-size-adjust:100%}
.wrap{max-width:820px;margin:0 auto;padding:26px 16px 100px}
h1,h2{font-family:'Gowun Batang',serif;margin:0;text-wrap:balance}
h1{font-size:clamp(24px,5.6vw,34px);letter-spacing:-.02em}
.sub{color:var(--ink2);font-size:14.5px;margin:10px 0 0}
.fix{margin:20px 0 0;background:var(--card);border:1px solid var(--line);border-left:5px solid var(--ok);border-radius:12px;padding:14px 16px}
.fix h3{margin:0 0 8px;font-size:14.5px;font-family:inherit}
.fix ul{margin:0;padding-left:18px;font-size:14px;color:var(--ink2)}
.fix li{margin:3px 0}
.fix b{color:var(--ink)}
.oops{margin:14px 0 0;background:var(--card);border:1px solid var(--line);border-left:5px solid var(--warn);border-radius:12px;padding:14px 16px;font-size:14px;color:var(--ink2)}
.oops b{color:var(--ink)}
.month{margin:30px 0 0;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px 16px;border-top:4px solid var(--mc)}
.m-h{padding-bottom:12px;border-bottom:1px solid var(--line);margin-bottom:14px}
.m-h h2{font-size:22px;color:var(--mc)}
.cnt{font-family:'IBM Plex Sans KR';font-size:14px;color:var(--ink2);font-weight:600;font-variant-numeric:tabular-nums}
.m-why{margin:6px 0 0;font-size:13.5px;color:var(--ink2)}
.grp{margin:18px 0 0;padding:12px;border-radius:12px;border:1px solid transparent}
.grp.ask{border-color:var(--warn);background:color-mix(in srgb,var(--warn) 6%,transparent)}
.grp-h{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px}
.grp-n{background:var(--mc);color:#fff;border-radius:999px;min-width:28px;text-align:center;font-size:12.5px;font-weight:700;padding:2px 9px;font-variant-numeric:tabular-nums}
.grp-l{font-size:15px;font-weight:600}
.tag{font-size:11px;font-weight:600;border-radius:999px;padding:2px 8px;border:1px solid}
.tag.ok{color:var(--ok);border-color:var(--ok)}
.tag.ask{color:var(--warn);border-color:var(--warn)}
.qline{margin:0 0 10px;font-size:14px;color:var(--ink);font-weight:500}
.cuts{display:flex;flex-wrap:wrap;gap:8px}
.cut{margin:0;position:relative;width:72px}
.cut img{width:72px;height:72px;object-fit:contain;background:#f8f6f1;border:1px solid var(--line);border-radius:9px;padding:3px;display:block}
.cut .num{position:absolute;top:-5px;left:-5px;z-index:2;background:var(--ink);color:var(--paper);font-size:12px;font-weight:700;min-width:21px;height:21px;line-height:21px;text-align:center;border-radius:999px;font-variant-numeric:tabular-nums;box-shadow:0 1px 3px rgba(0,0,0,.3)}
.cut.new .num{background:var(--ok)}
.cut.out img{opacity:.22;filter:grayscale(1)}
.cut.out .num{background:var(--ink2)}
.cut .x{position:absolute;inset:auto 0 4px 0;text-align:center;font-size:10.5px;font-weight:700;color:var(--warn)}
.ans{display:block;width:100%;margin-top:12px;font:inherit;font-size:15px;padding:11px 13px;border-radius:10px;border:1.5px solid var(--warn);background:var(--paper);color:var(--ink)}
.copybar{position:sticky;bottom:0;margin:30px -16px -100px;padding:13px 16px 22px;background:color-mix(in srgb,var(--paper) 93%,transparent);backdrop-filter:blur(8px);border-top:1px solid var(--line)}
.copybar button{font:inherit;font-size:15px;font-weight:700;width:100%;padding:14px;border-radius:12px;border:0;background:var(--brand);color:var(--paper)}
.out{width:100%;margin-top:10px;font:inherit;font-size:13px;height:0;padding:0;border:0;opacity:0}
.out.on{height:170px;padding:10px 12px;opacity:1;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink)}
.note{font-size:13px;color:var(--ink2);margin:8px 0 0}
</style>

<div class="wrap">
<h1>가을 배분 — 번호 붙여 다시</h1>
<p class="sub">지난 판엔 번호가 없어서 「3·4·8·10·12」가 어느 컷인지 내가 못 읽었어. <b>이제 컷마다 번호가 붙어 있어.</b></p>

<div class="fix">
  <h3>✅ 말해준 대로 이미 반영한 것</h3>
  <ul>
    <li>9월 스티커 <b>3·4·8·10·12</b> 뺐어 (흐린 게 뺀 것)</li>
    <li>9월 마테 <b>1·2</b> 뺐어</li>
    <li>11월 필름 프레임 <b>2·3</b> 뺐어</li>
    <li>어제 준 <b>가을 소품 8컷</b> 찾아서 9월에 올렸어 — 초록 번호가 그거야</li>
    <li>💰 <b>유료 꾸미기팩 = 안 올린다</b> (유저 모이면 그때 · 가격도 그때 정하는 걸로)</li>
  </ul>
</div>

<div class="oops">
  ⛔ <b>내가 틀린 것 둘</b> —
  ① <b>조각보 배경은 이미 있어</b>(<code>배경-창업자-2026-07-31/원본/조각보.png</code>). 지난 판에 「새로 만든다」고 잘못 적었어. 한지창살도 있어. <b>둘 다 앱에 «등록»만 하면 돼.</b><br>
  ② 어제 같이 준 <b>「가을프레임」 4컷은 이미 naf 안에 들어 있어</b> — 아래 프레임의 <b>4·6·8·11번</b>이 그거야.
</div>

${달HTML}

<div class="copybar">
  <button id="copy">답한 것 복사하기</button>
  <textarea class="out" id="out" readonly></textarea>
  <p class="note" id="hint">적으면 저절로 저장돼. 폰 껐다 켜도 남아 있어.</p>
</div>
</div>

<script>
const KEY='hankki:가을판2:0827'
let 답={}
try{ 답=JSON.parse(localStorage.getItem(KEY)||'{}') }catch(e){ 답={} }
document.querySelectorAll('.ans').forEach(el=>{
  const q=el.dataset.q
  if(답[q]) el.value=답[q]
  el.addEventListener('input',()=>{ 답[q]=el.value; try{localStorage.setItem(KEY,JSON.stringify(답))}catch(e){} })
})
function 글자(){
  const L=['🍂 가을 배분 2판 답 (2026-08-27)','']
  const 이름={'9프레임':'9월 프레임(3개만)','9새컷':'9월 어제 준 소품','9캐릭터':'9월 캐릭터','10마테':'10월 마테','11격자':'11월'}
  document.querySelectorAll('.ans').forEach(el=>{
    if(!el.value.trim()) return
    L.push('· '+(이름[el.dataset.q]||el.dataset.q)+' → '+el.value.trim())
  })
  if(L.length===2) L.push('(아직 아무것도 안 적었어)')
  return L.join('\\n')
}
document.getElementById('copy').addEventListener('click',async()=>{
  const s=글자(), out=document.getElementById('out'), hint=document.getElementById('hint')
  out.value=s; out.classList.add('on')
  try{ await navigator.clipboard.writeText(s); hint.textContent='✅ 복사됐어 — 그대로 붙여넣으면 돼.' }
  catch(e){
    out.focus(); out.select()
    try{ const r=document.createRange(); r.selectNodeContents(out); const sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(r) }catch(e2){}
    hint.textContent='⚠️ 자동 복사가 막혔어 — 아래 글자를 길게 눌러서 복사해줘.'
  }
})
</script>`
writeFileSync(process.argv[3], HTML)
console.log('✅', (HTML.length/1024/1024).toFixed(2), 'MB')
