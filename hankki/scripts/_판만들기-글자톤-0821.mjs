// 🔠🎨 「글자 ＋ 톤」 판 만들기 — `_판-글자톤-0821.mjs` 가 찍은 컷을 한 장의 판으로 엮는다
//
// ⛔ 판 생성기는 «저장소»에 둔다 — scratchpad 에 두면 세션과 함께 날아가고 다음에 또 새로 짠다(절대원칙 30).
//    결과물(HTML)만 scratchpad 로 (저장소가 public 이라서).
//
// ☑️ 절대원칙(창업자 2026-08-19) = **검수판은 무조건 「체크 ＋ 복사」**
//    ⑴ 고른 것이 `localStorage` 에 남는다(새로고침해도 안 날아감)
//    ⑵ 맨 아래 「복사하기」
//    ⑶ ⛔ `clipboard.writeText()` 는 성공으로 resolve 되고도 실제 복사가 안 되는 폰이 있다(v10.97)
//       → 실패하면 **글자를 골라 준다**(Range)
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판만들기-글자톤-0821.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/글자톤시안'
const { 컷, 톤들, 글자들 } = JSON.parse(readFileSync(join(OUT, '컷.json'), 'utf8'))
const 찾기 = (n) => 컷.find((c) => c.이름 === n)
const img = (n) => { const c = 찾기(n); return c ? `data:image/jpeg;base64,${c.b64}` : '' }
const 잰 = (n) => { const c = 찾기(n); return c ? c.잰값 : null }
const 퍼센트 = (v) => (v ? Math.round((v.미만14 / v.덩이) * 100) : 0)

const 톤칸 = 톤들.map((t) => `
  <label class="pick" data-axis="tone" data-val="${t.key}">
    <input type="radio" name="tone" value="${t.key}">
    <div class="shot"><img src="${img('톤' + t.key)}" alt="톤 ${t.key}" loading="lazy"></div>
    <div class="meta">
      <div class="tag">톤 ${t.key}</div>
      <div class="nm">${t.이름}</div>
      <div class="sub">${t.설명}</div>
    </div>
    <span class="mark" aria-hidden="true"></span>
  </label>`).join('')

const 글자칸 = (탭) => 글자들.map((g) => {
  const v = 잰(`${탭}-글자${g.key}`)
  return `
  <label class="pick" data-axis="size" data-val="${g.key}">
    <input type="radio" name="size" value="${g.key}">
    <div class="shot"><img src="${img(탭 + '-글자' + g.key)}" alt="글자 ${g.key}" loading="lazy"></div>
    <div class="meta">
      <div class="tag">글자 ${g.key}</div>
      <div class="nm">${g.이름}</div>
      <div class="sub">${g.설명}</div>
      ${v ? `<div class="num">가운데 <b>${v.가운데}px</b> · 14px 미만 <b>${퍼센트(v)}%</b></div>` : ''}
    </div>
    <span class="mark" aria-hidden="true"></span>
  </label>`
}).join('')

const html = `<title>한끼 글자·톤 시안</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@400;500;700;800&display=swap">
<style>
  :root{
    --paper:#f4f1ea; --card:#ffffff; --ink:#33302a; --ink2:#7d7466;
    --blue:#4d6d95; --blue-soft:#e7edf5; --edge:#e6ded0; --warn:#bd5a44;
    --lift:0 1px 2px rgba(94,74,52,.05), 0 8px 24px rgba(94,74,52,.07);
  }
  @media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
    --paper:#17171b; --card:#212128; --ink:#eceaf0; --ink2:#9a9391;
    --blue:#87a9d6; --blue-soft:#26303d; --edge:#33333c; --warn:#e0946a;
    --lift:0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.35);
  }}
  :root[data-theme="dark"]{
    --paper:#17171b; --card:#212128; --ink:#eceaf0; --ink2:#9a9391;
    --blue:#87a9d6; --blue-soft:#26303d; --edge:#33333c; --warn:#e0946a;
    --lift:0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.35);
  }
  *{box-sizing:border-box}
  body{
    margin:0; background:var(--paper); color:var(--ink);
    font-family:'Gothic A1','Pretendard',-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;
    font-size:16px; line-height:1.62; word-break:keep-all; -webkit-text-size-adjust:100%;
  }
  .wrap{max-width:560px; margin:0 auto; padding:26px 18px 140px}

  header{margin-bottom:26px}
  .eyebrow{font-size:13px; font-weight:800; color:var(--blue); letter-spacing:.06em; margin-bottom:7px}
  h1{font-size:27px; font-weight:800; line-height:1.28; margin:0 0 10px; text-wrap:balance}
  .lede{font-size:15px; color:var(--ink2); margin:0}

  .why{
    margin:22px 0 0; padding:16px 17px; border-radius:15px;
    background:var(--card); box-shadow:var(--lift); border-left:4px solid var(--warn);
  }
  .why h2{font-size:15.5px; font-weight:800; margin:0 0 9px; color:var(--warn)}
  .why p{margin:0 0 9px; font-size:14.5px; color:var(--ink)}
  .why p:last-child{margin-bottom:0}
  .why b{font-weight:800}
  table.mini{width:100%; border-collapse:collapse; font-size:13.5px; margin:10px 0 4px;
    font-variant-numeric:tabular-nums}
  table.mini td{padding:5px 0; border-bottom:1px solid var(--edge)}
  table.mini tr:last-child td{border-bottom:0}
  table.mini td:last-child{text-align:right; font-weight:700}

  section{margin-top:38px}
  .shead{display:flex; align-items:baseline; gap:9px; margin-bottom:5px}
  .shead h2{font-size:20px; font-weight:800; margin:0}
  .shead .n{font-size:13px; font-weight:800; color:var(--blue)}
  .snote{font-size:14px; color:var(--ink2); margin:0 0 16px}

  .picks{display:grid; gap:15px}
  .pick{
    position:relative; display:block; background:var(--card); border-radius:17px;
    box-shadow:var(--lift); overflow:hidden; cursor:pointer;
    border:2.5px solid transparent; transition:border-color .14s ease, transform .1s ease;
  }
  .pick:active{transform:scale(.994)}
  .pick input{position:absolute; opacity:0; pointer-events:none}
  .pick:has(input:checked){border-color:var(--blue)}
  .pick:focus-within{outline:3px solid var(--blue); outline-offset:2px}
  .shot{background:var(--paper); display:block}
  .shot img{display:block; width:100%; height:auto}
  .meta{padding:13px 15px 15px}
  .tag{font-size:12px; font-weight:800; color:var(--blue); letter-spacing:.05em}
  .nm{font-size:16.5px; font-weight:800; margin-top:2px}
  .sub{font-size:14px; color:var(--ink2); margin-top:4px}
  .num{font-size:13px; color:var(--ink2); margin-top:7px; font-variant-numeric:tabular-nums}
  .num b{color:var(--ink); font-weight:800}
  .mark{
    position:absolute; top:11px; right:11px; width:29px; height:29px; border-radius:50%;
    background:rgba(255,255,255,.9); border:2px solid var(--edge); display:grid; place-items:center;
  }
  .pick:has(input:checked) .mark{background:var(--blue); border-color:var(--blue)}
  .pick:has(input:checked) .mark::after{content:'✓'; color:#fff; font-size:16px; font-weight:800; line-height:1}

  .note-wrap{margin-top:34px}
  .note-wrap label{display:block; font-size:15px; font-weight:800; margin-bottom:8px}
  textarea{
    width:100%; min-height:92px; padding:13px 14px; border-radius:14px; resize:vertical;
    border:2px solid var(--edge); background:var(--card); color:var(--ink);
    font-family:inherit; font-size:15px; line-height:1.6;
  }
  textarea:focus{outline:none; border-color:var(--blue)}

  .bar{
    position:fixed; left:0; right:0; bottom:0; padding:13px 18px calc(15px + env(safe-area-inset-bottom,0px));
    background:color-mix(in srgb, var(--paper) 92%, transparent);
    backdrop-filter:blur(12px); border-top:1px solid var(--edge);
  }
  .bar .inner{max-width:560px; margin:0 auto; display:flex; gap:11px; align-items:center}
  .state{flex:1; font-size:13.5px; color:var(--ink2); font-variant-numeric:tabular-nums}
  .state b{color:var(--ink); font-weight:800}
  button.copy{
    padding:14px 24px; border:0; border-radius:14px; background:var(--blue); color:#fff;
    font-family:inherit; font-size:15.5px; font-weight:800; cursor:pointer;
  }
  button.copy:active{transform:scale(.97)}
  #out{
    margin-top:12px; padding:13px 14px; border-radius:13px; background:var(--card);
    border:2px dashed var(--edge); font-size:14px; white-space:pre-wrap; display:none;
    user-select:all; -webkit-user-select:all;
  }
  #out.show{display:block}
  .foot{margin-top:34px; font-size:13px; color:var(--ink2); line-height:1.7}
  @media (prefers-reduced-motion: reduce){ *{transition:none!important} }
</style>

<div class="wrap">
  <header>
    <div class="eyebrow">2026-08-21 · 시안</div>
    <h1>글자를 키우고 톤을 올리면</h1>
    <p class="lede">네가 말한 두 가지 — <b>“다 작고 잘 안 보인다”</b> · <b>“그레이지가 칙칙하다”</b>. 재보니 둘 다 사실이었어. 아래에서 하나씩 골라줘.</p>
  </header>

  <div class="why">
    <h2>⚠️ 먼저 — 「칙칙함」의 정체를 찾았어</h2>
    <p>홈에서 <b>제일 큰 카드가 배경보다 «어두워»</b>. 보통 카드는 배경보다 밝아야 떠 보이는데 우리는 반대야.</p>
    <table class="mini">
      <tr><td>배경 <code>--bg</code> #eeebe3</td><td>밝기 0.831</td></tr>
      <tr><td>큰 카드 <code>--cream</code> #e6e0d4</td><td>0.749 ↓</td></tr>
      <tr><td>안 쓰이는 밝은 색 <code>--surface</code></td><td>0.899</td></tr>
    </table>
    <p>그래서 <b>배경을 바꾸기 «전»에 카드부터 띄우는 갈래</b>(톤 C)를 넣었어. 제일 적게 바꾸는 길이야.</p>
  </div>

  <section>
    <div class="shead"><h2>🎨 톤</h2><span class="n">넷 중 하나</span></div>
    <p class="snote">글자는 지금 그대로 두고 톤만 바꿔 찍었어. 홈 화면이야.</p>
    <div class="picks">${톤칸}</div>
  </section>

  <section>
    <div class="shead"><h2>🔠 글자 — 홈</h2><span class="n">셋 중 하나</span></div>
    <p class="snote">톤은 지금 그대로. 안드로이드 기준(Material Design 3)은 <b>최소 본문 14sp</b>인데 우리 홈은 <b>77%가 그 아래</b>야.</p>
    <div class="picks">${글자칸('홈')}</div>
  </section>

  <section>
    <div class="shead"><h2>🔠 글자 — 일기</h2><span class="n">위에서 고른 것과 같이 적용돼</span></div>
    <p class="snote">일기가 제일 심했어 — <b>14px 미만이 95%</b>. 같은 세 단을 일기에서 보면 이래.</p>
    <div class="picks">${글자칸('일기')}</div>
  </section>

  <section>
    <div class="shead"><h2>⭐ 합쳐 보면</h2><span class="n">톤 D ＋ 글자 2</span></div>
    <p class="snote">내 추천 조합이야. 참고만 해 — 고르는 건 위에서.</p>
    <div class="picks">
      <div class="pick" style="cursor:default">
        <div class="shot"><img src="${img('합-홈')}" alt="합친 홈" loading="lazy"></div>
        <div class="meta"><div class="tag">홈</div><div class="nm">톤 D ＋ 글자 2</div>
        <div class="sub">⚠️ 글자가 커지면 <b>「아보카도 바나...」</b>처럼 더 잘리는 데가 생겨. 그건 따로 손봐야 해.</div></div>
      </div>
      <div class="pick" style="cursor:default">
        <div class="shot"><img src="${img('합-일기')}" alt="합친 일기" loading="lazy"></div>
        <div class="meta"><div class="tag">일기</div><div class="nm">톤 D ＋ 글자 2</div>
        <div class="sub">달력이 흰 카드로 떠올랐어.</div></div>
      </div>
    </div>
  </section>

  <div class="note-wrap">
    <label for="note">✏️ 더 할 말 (안 써도 돼)</label>
    <textarea id="note" placeholder="예) 톤은 D인데 글자는 3이 좋아 / 검색창이 너무 하얘"></textarea>
  </div>

  <div id="out"></div>

  <p class="foot">
    ⛔ <b>이건 「덮어씌운 시안」이야.</b> 진짜 CSS로 옮기면 조금 달라질 수 있어 —
    v11.17 홈카드 때 실제로 그랬어(시안은 통과했는데 옮기니 폭이 어긋남). 옮긴 뒤에 다시 찍어서 보여줄게.<br><br>
    ⛔ 꾸미기(레꾸·일꾸) 글자는 <b>안 건드렸어</b> — 네가 확정한 규격이라서.<br>
    ⛔ 온보딩도 안 건드려 — 바깥 세션이 가입을 만드는 중이라 부딪혀.
  </p>
</div>

<div class="bar"><div class="inner">
  <div class="state" id="state">아직 안 골랐어</div>
  <button class="copy" id="copy" type="button">복사하기</button>
</div></div>

<script>
(function(){
  var KEY='hankki-글자톤-0821';
  var note=document.getElementById('note'), state=document.getElementById('state'), out=document.getElementById('out');

  function load(){
    try{
      var raw=localStorage.getItem(KEY); if(!raw) return;
      var d=JSON.parse(raw);
      if(d.tone){var a=document.querySelector('input[name=tone][value="'+d.tone+'"]'); if(a) a.checked=true;}
      if(d.size){var b=document.querySelector('input[name=size][value="'+d.size+'"]'); if(b) b.checked=true;}
      if(d.note) note.value=d.note;
    }catch(e){}
  }
  function got(){
    var t=document.querySelector('input[name=tone]:checked');
    var s=document.querySelector('input[name=size]:checked');
    return {tone:t?t.value:'', size:s?s.value:'', note:note.value};
  }
  function save(){
    var d=got();
    try{ localStorage.setItem(KEY, JSON.stringify(d)); }catch(e){}
    var p=[];
    if(d.tone) p.push('톤 '+d.tone);
    if(d.size) p.push('글자 '+d.size);
    state.innerHTML = p.length ? '고른 것 — <b>'+p.join(' · ')+'</b>' : '아직 안 골랐어';
  }
  function text(){
    var d=got();
    var L=['[한끼 글자·톤 시안 · 2026-08-21]'];
    L.push('톤 = '+(d.tone||'(안 고름)'));
    L.push('글자 = '+(d.size||'(안 고름)'));
    if(d.note.trim()) L.push('메모 = '+d.note.trim());
    return L.join('\\n');
  }

  document.addEventListener('change', save);
  note.addEventListener('input', save);

  document.getElementById('copy').addEventListener('click', function(){
    var s=text();
    // ⛔ writeText 는 «성공으로 resolve 되고도» 실제 복사가 안 되는 폰이 있다(v10.97 교훈).
    //    그래서 성공이든 실패든 글자를 화면에 띄우고, 실패하면 골라 준다.
    out.textContent=s; out.classList.add('show');
    var ok=function(){ state.innerHTML='<b>복사했어</b> — 채팅에 붙여넣어 줘'; };
    var no=function(){
      state.innerHTML='복사가 안 됐어 — <b>아래 글자를 길게 눌러</b> 복사해 줘';
      try{ var r=document.createRange(); r.selectNodeContents(out);
        var sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(r); }catch(e){}
    };
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(s).then(ok, no);
      } else { no(); }
    }catch(e){ no(); }
    out.scrollIntoView({behavior:'smooth', block:'center'});
  });

  load(); save();
})();
</script>
`

writeFileSync(join(OUT, '판.html'), html)
console.log(`📄 ${join(OUT, '판.html')}  (${Math.round(html.length / 1024)}KB)`)
