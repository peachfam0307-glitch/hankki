// 🥕 시안판 — 검색 「재료로 찾기」 판정 둘 (창업자 할일 4번 · 2026-08-23)
//
// 📮 창업자 = *"확정전에 시안줘 다고치고"* → *"ㄱㄱ"*
//
// ⭐ 심장 = 「6칸은 고쳤고 «2칸이 남았다»」를 창업자가 «눈으로» 판정하게 한다.
//   ⛔ 글로 「김치·닭고기가 안 붙어요」라고 적으면 «어떤 그림이 붙을 수 있는지»를 모른다.
//      → **후보 컷을 나란히** 놓고 고르게 한다.
//   ⭐⭐ ＋ **앱이 실제로 그리는 34px 을 «같이»** 보여준다 —
//      크게만 보고 고르면 작게 줄었을 때 판정이 뒤집힌다(검수 절대원칙 ③·⑤).
//
// ⛔⛔ 절대원칙(창업자 2026-08-19) = **검수판은 무조건 체크 ＋ 복사**
//   ⑴ 칸마다 고르기 → localStorage (새로고침해도 안 날아간다)
//   ⑵ 맨 아래 「복사하기」
//   ⑶ clipboard 가 «성공으로 resolve 되고도» 실제 복사가 안 되는 폰이 있다(v10.97)
//      → 실패하면 Range 로 글자를 골라 준다
//
// ⭐ 그림은 **data URI 로 박는다** — 아티팩트는 바깥 주소를 못 부른다(CSP).
// ⭐ 판은 «폰»에서 본다 → 한 칸 560px · 판정 둘을 «맨 위»로(이 판의 일이 그것이다)
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-검색재료아이콘-시안-0823.mjs
//   → docs/시안/검색재료아이콘-0823/시안.html        (컴퓨터에서 바로 열어보는 판)
//   → docs/시안/검색재료아이콘-0823/아티팩트.html    (Artifact 로 올리는 «몸통만» 판)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const ING = join(ROOT, 'src/assets/stickers/ing')
const OUT = join(ROOT, 'docs/시안/검색재료아이콘-0823')
mkdirSync(OUT, { recursive: true })

const 그림 = (키) => `data:image/png;base64,${readFileSync(join(ING, `${키}.png`)).toString('base64')}`

// ── 지금 붙는 것 — 재현판이 «실제로 읽은» 값 (2026-08-23)
const 고친것 = [
  { 이름: '계란', 키: 'ig_s9_01' },
  { 이름: '두부', 키: 'ig_s9_02' },
  { 이름: '양파', 키: 'ig_s3_07' },
  { 이름: '대파', 키: 'ig_s3_01' },
  { 이름: '소고기', 키: 'ig_s6_09' },
  { 이름: '돼지고기', 키: 'ig_s6_08' },
]

// ── 아직 옛 SVG 도형인 둘 — 재료표(ingIcons.js)에 그 이름이 «없다»
const 판정 = [
  {
    이름: '닭고기',
    왜: '재료표에 「닭고기」가 없다. 「닭다리」·「영계」는 있다.',
    후보: [
      { 키: 'ig_s6_11', 라벨: '영계 (통닭)', 추천: true, 말: '「닭고기」라는 넓은 말에 제일 가깝다' },
      { 키: 'ig_s6_10', 라벨: '닭다리', 추천: false, 말: '부위 하나라 「닭고기」보다 좁다' },
    ],
    고르기: ['영계 (통닭) 로 붙인다', '닭다리 로 붙인다', '지금 도형이 괜찮다 (안 바꾼다)'],
  },
  {
    이름: '김치',
    왜: '재료표에 김치 그림이 «한 컷도 없다». 김치는 재료가 아니라 반찬이라 시트에서 빠졌다.',
    후보: [
      { 키: 'ig_s3_04', 라벨: '배추', 추천: false, 말: '배추는 김치 «재료»지 김치가 아니다' },
    ],
    고르기: ['배추 로 붙인다', '새로 뽑아 줄게 (그때까지 지금 그대로)', '지금 도형이 괜찮다 (안 바꾼다)'],
  },
]

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

// ── 후보 한 컷 = 「크게 보는 그림」 ＋ 「앱이 그리는 34px」을 나란히
const 후보칸 = (c) => `
      <figure class="cand${c.추천 ? ' rec' : ''}">
        ${c.추천 ? '<span class="rec-tag">추천</span>' : ''}
        <div class="cand-art"><img src="${그림(c.키)}" alt="${esc(c.라벨)}"></div>
        <figcaption>
          <b>${esc(c.라벨)}</b>
          <span class="why">${esc(c.말)}</span>
          <span class="real">
            <img src="${그림(c.키)}" alt="" width="34" height="34">
            <span>앱에서는 이 크기 <code>34px</code></span>
          </span>
          <code class="key">${c.키}.png</code>
        </figcaption>
      </figure>`

const 판정절 = (d, i) => `
  <section class="decide" data-name="${esc(d.이름)}">
    <header class="d-head">
      <span class="num">${i + 1}</span>
      <div>
        <h2>${esc(d.이름)}</h2>
        <p class="d-why">${esc(d.왜)}</p>
      </div>
    </header>

    <div class="now">
      <span class="now-chip">지금</span>
      <span class="now-txt">옛 SVG 도형이 붙는다 — 창업자가 뽑은 재료컷이 아니다</span>
    </div>

    <div class="cands${d.후보.length === 1 ? ' one' : ''}">${d.후보.map(후보칸).join('')}</div>

    <fieldset class="opts">
      <legend class="sr">${esc(d.이름)} 판정</legend>
      ${d.고르기.map((t, k) => `
      <label class="opt">
        <input type="radio" name="${esc(d.이름)}" value="${esc(t)}"${k === 0 && d.후보[0].추천 ? ' data-rec="1"' : ''}>
        <span class="dot" aria-hidden="true"></span>
        <span class="opt-t">${esc(t)}</span>
      </label>`).join('')}
    </fieldset>
  </section>`

const 몸통 = `
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=IBM+Plex+Sans+KR:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
  :root{
    --ground:#faf7f0; --surface:#fffdf8; --sunk:#f3eee3;
    --ink:#3b2a18; --soft:#7d6d5b; --line:#e6ddcd;
    --accent:#4e7d40; --wash:#eaf1e4; --stop:#a8503a; --on-accent:#fffdf8;
    --shadow:0 1px 2px rgba(59,42,24,.05), 0 8px 24px -16px rgba(59,42,24,.28);
    --serif:"Gowun Batang", ui-serif, Georgia, serif;
    --sans:"IBM Plex Sans KR", system-ui, -apple-system, "Apple SD Gothic Neo", sans-serif;
    --mono:"IBM Plex Mono", ui-monospace, SFMono-Regular, monospace;
  }
  @media (prefers-color-scheme: dark){
    :root:not([data-theme="light"]){
      --ground:#1b1815; --surface:#262220; --sunk:#201d1a;
      --ink:#efe7dc; --soft:#a49685; --line:#3a332d;
      --accent:#93c67e; --wash:#293323; --stop:#d98a70; --on-accent:#17210f;
      --shadow:0 1px 2px rgba(0,0,0,.4), 0 8px 24px -16px rgba(0,0,0,.8);
    }
  }
  :root[data-theme="dark"]{
    --ground:#1b1815; --surface:#262220; --sunk:#201d1a;
    --ink:#efe7dc; --soft:#a49685; --line:#3a332d;
    --accent:#93c67e; --wash:#293323; --stop:#d98a70; --on-accent:#17210f;
    --shadow:0 1px 2px rgba(0,0,0,.4), 0 8px 24px -16px rgba(0,0,0,.8);
  }

  *,*::before,*::after{ box-sizing:border-box; }
  body{
    margin:0; background:var(--ground); color:var(--ink);
    font-family:var(--sans); font-size:16px; line-height:1.65;
    -webkit-text-size-adjust:100%; word-break:keep-all; overflow-wrap:break-word;
  }
  .wrap{ max-width:560px; margin:0 auto; padding:28px 18px 64px; display:flex; flex-direction:column; gap:22px; }
  h1,h2,h3{ font-family:var(--serif); font-weight:700; text-wrap:balance; margin:0; letter-spacing:-.01em; }
  code{ font-family:var(--mono); font-size:.82em; }
  .sr{ position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); }

  /* ── 머리 */
  .top h1{ font-size:27px; line-height:1.35; }
  .top .sub{ margin:8px 0 0; color:var(--soft); font-size:15px; }
  .top .quote{
    margin:14px 0 0; padding:11px 14px; background:var(--surface);
    border-left:3px solid var(--accent); border-radius:0 10px 10px 0;
    font-size:15px; color:var(--ink); box-shadow:var(--shadow);
  }
  .ask{
    margin:16px 0 0; padding:13px 15px; background:var(--wash);
    border-radius:12px; font-size:15px; font-weight:500; color:var(--ink);
  }
  .ask b{ color:var(--accent); }

  /* ── 판정 카드 */
  .decide{
    background:var(--surface); border:1px solid var(--line); border-left:4px solid var(--accent);
    border-radius:14px; padding:20px 18px; box-shadow:var(--shadow);
    display:flex; flex-direction:column; gap:16px;
  }
  .decide.done{ border-left-color:var(--line); }
  .decide.done .num{ background:var(--accent); color:var(--on-accent); }
  .d-head{ display:flex; gap:13px; align-items:flex-start; }
  .num{
    flex:none; width:29px; height:29px; border-radius:50%;
    background:var(--wash); color:var(--accent);
    font-family:var(--mono); font-weight:500; font-size:15px;
    display:grid; place-items:center; margin-top:3px;
    font-variant-numeric:tabular-nums;
  }
  .d-head h2{ font-size:23px; }
  .d-why{ margin:5px 0 0; font-size:14.5px; color:var(--soft); line-height:1.6; }

  .now{ display:flex; gap:9px; align-items:baseline; font-size:14px; color:var(--soft); }
  .now-chip{
    flex:none; font-family:var(--mono); font-size:12px; letter-spacing:.04em;
    color:var(--stop); border:1px solid currentColor; border-radius:5px; padding:1px 6px;
  }

  /* ── 후보 */
  .cands{ display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:12px; }
  .cands.one{ grid-template-columns:minmax(0,1fr); }
  .cand{
    margin:0; padding:13px; background:var(--sunk); border:1px solid var(--line);
    border-radius:12px; position:relative; display:flex; flex-direction:column; gap:9px;
  }
  .cand.rec{ border-color:var(--accent); background:var(--wash); }
  .rec-tag{
    position:absolute; top:-9px; left:12px; background:var(--accent); color:var(--on-accent);
    font-size:11.5px; font-weight:700; letter-spacing:.03em; padding:2px 8px; border-radius:999px;
  }
  .cand-art{ display:grid; place-items:center; min-height:96px; }
  .cand-art img{ max-width:100%; max-height:108px; display:block; }
  .cand figcaption{ display:flex; flex-direction:column; gap:6px; text-align:center; }
  .cand b{ font-size:16px; }
  .why{ font-size:13.5px; color:var(--soft); line-height:1.55; }
  .real{
    display:flex; align-items:center; justify-content:center; gap:7px;
    padding-top:8px; border-top:1px dashed var(--line);
    font-size:12.5px; color:var(--soft);
  }
  .real img{ width:34px; height:34px; object-fit:contain; flex:none; }
  .key{ color:var(--soft); font-size:11.5px; }

  /* ── 고르기 */
  .opts{ border:0; margin:0; padding:0; display:flex; flex-direction:column; gap:8px; }
  .opt{
    display:flex; align-items:center; gap:11px; min-height:48px;
    padding:9px 14px; border:1px solid var(--line); border-radius:11px;
    background:var(--ground); cursor:pointer; font-size:15.5px;
    transition:border-color .12s, background .12s;
  }
  .opt input{ position:absolute; opacity:0; width:0; height:0; }
  .dot{
    flex:none; width:19px; height:19px; border-radius:50%;
    border:2px solid var(--line); background:var(--surface); transition:border-color .12s;
  }
  .opt:hover{ border-color:var(--accent); }
  .opt:has(input:focus-visible){ outline:2px solid var(--accent); outline-offset:2px; }
  .opt:has(input:checked){ border-color:var(--accent); background:var(--wash); }
  .opt:has(input:checked) .dot{ border-color:var(--accent); border-width:6px; }
  .opt:has(input:checked) .opt-t{ font-weight:700; }

  /* ── 확인용 */
  .check{
    background:var(--surface); border:1px solid var(--line); border-radius:14px;
    padding:20px 18px; box-shadow:var(--shadow);
  }
  .eyebrow{
    font-family:var(--mono); font-size:12px; letter-spacing:.06em; color:var(--accent);
    display:block; margin-bottom:7px;
  }
  .check h2{ font-size:20px; }
  .check .lead{ margin:7px 0 16px; font-size:14.5px; color:var(--soft); }
  .fixed{ display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:14px 10px; margin:0; padding:0; list-style:none; }
  .fixed li{ display:flex; flex-direction:column; align-items:center; gap:5px; text-align:center; }
  .fixed img{ width:56px; height:56px; object-fit:contain; }
  .fixed b{ font-size:14.5px; font-weight:500; }
  .fixed code{ font-size:10.5px; color:var(--soft); }
  .root{
    margin:16px 0 0; padding:13px 15px; background:var(--sunk);
    border-radius:11px; font-size:14px; color:var(--soft); line-height:1.7;
  }
  .root b{ color:var(--ink); }

  /* ── 이미 나간 것 */
  .shipped{
    background:var(--surface); border:1px solid var(--line); border-radius:14px;
    padding:18px; box-shadow:var(--shadow); font-size:14.5px; color:var(--soft); line-height:1.7;
  }
  .shipped h2{ font-size:18px; color:var(--ink); margin-bottom:7px; }
  .ship-tag{
    display:inline-block; background:var(--wash); color:var(--accent);
    font-family:var(--mono); font-size:12px; padding:2px 9px; border-radius:999px; margin-bottom:9px;
  }
  .shipped b{ color:var(--ink); }

  /* ── 복사 */
  .copy{
    background:var(--surface); border:1px solid var(--line); border-radius:14px;
    padding:20px 18px; box-shadow:var(--shadow); display:flex; flex-direction:column; gap:12px;
  }
  .copy h2{ font-size:20px; }
  textarea{
    width:100%; min-height:104px; resize:vertical; padding:12px 14px;
    border:1px solid var(--line); border-radius:11px; background:var(--ground);
    color:var(--ink); font-family:var(--mono); font-size:13.5px; line-height:1.7;
  }
  textarea:focus-visible{ outline:2px solid var(--accent); outline-offset:1px; }
  button{
    min-height:52px; border:0; border-radius:12px; background:var(--accent); color:var(--on-accent);
    font-family:var(--sans); font-size:16.5px; font-weight:700; cursor:pointer;
    transition:filter .12s;
  }
  button:hover{ filter:brightness(1.08); }
  button:focus-visible{ outline:2px solid var(--ink); outline-offset:2px; }
  .said{ font-size:14px; color:var(--accent); font-weight:500; min-height:1.5em; text-align:center; }

  @media (prefers-reduced-motion: reduce){ *{ transition:none !important; } }
  @media (max-width:380px){ .fixed{ grid-template-columns:repeat(2, minmax(0,1fr)); } }
</style>

<div class="wrap">
  <header class="top">
    <h1>재료로 찾기 — 남은 판정 둘</h1>
    <p class="sub">홈 → 검색 → 맨 아래 「재료로 찾기」. 8칸 중 <b>6칸은 재료 그림으로 바뀌었고 2칸이 남았다.</b></p>
    <p class="quote">📮 “홈에서 검색하면 아래 음식아이콘 옛날꺼.”</p>
    <p class="ask"><b>여기서 고를 것 = 두 개.</b> 아래 두 칸에서 하나씩 고르고 맨 아래 「복사하기」를 눌러 보내 주면 돼.</p>
  </header>

  ${판정.map(판정절).join('')}

  <section class="check">
    <span class="eyebrow">확인용 · 손댈 것 없음</span>
    <h2>이미 고쳐진 6칸</h2>
    <p class="lead">창업자가 뽑은 재료컷이 제대로 붙는다.</p>
    <ul class="fixed">
      ${고친것.map((f) => `<li><img src="${그림(f.키)}" alt="${esc(f.이름)}"><b>${esc(f.이름)}</b><code>${f.키}</code></li>`).join('')}
    </ul>
    <p class="root">
      <b>뿌리</b> = 재료 칸인데 <b>「요리」 규칙</b>을 부르고 있었다.
      「계란」·「두부」를 요리 이름으로 판정하니 재료컷이 붙을 리가 없었다.
      <b>「재료」 규칙을 먼저 보게</b> 바꿨다.<br>
      ⛔ 같은 뿌리를 <b>세 번째</b> 겪는다 — v10.96 냉장고 픽커 · 8/20 재료찾기 판 · 이번.
      이번엔 고치고 <b>그 문장을 코드 옆에 박는다.</b>
    </p>
  </section>

  <section class="shipped">
    <span class="ship-tag">✅ 이미 나갔다 · v11.23</span>
    <h2>레꾸자랑 뒤로가기가 홈으로 새던 것</h2>
    뿌리 = 레시피를 고르면 뜨는 <b>선택 시트</b>가 <b>뒤로가기 층에 아예 없었다.</b>
    그래서 뒤로가기가 시트를 못 보고 「다른 탭이면 홈으로」 갈래로 떨어졌다.
    새는 자리가 <b>셋</b>이었다 — 선택 시트 · 랜덤 카드 · 지금 보내기.<br>
    👉 <b>판정할 게 없다.</b> 이미 폰에 있으니 눌러 보면 그대로 「레꾸자랑」에 남는다.
  </section>

  <section class="copy">
    <h2>고른 것 복사하기</h2>
    <textarea id="out" readonly placeholder="위에서 고르면 여기에 정리돼요"></textarea>
    <button id="btn" type="button">복사하기</button>
    <p class="said" id="said" role="status"></p>
  </section>
</div>

<script>
(function(){
  var KEY = 'hankki:재료아이콘판정:0823';
  var out = document.getElementById('out');
  var said = document.getElementById('said');
  var radios = [].slice.call(document.querySelectorAll('input[type=radio]'));

  function 읽기(){ try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch(e){ return {}; } }
  function 쓰기(o){ try { localStorage.setItem(KEY, JSON.stringify(o)); } catch(e){} }

  function 그리기(){
    var o = 읽기(), 줄 = [];
    document.querySelectorAll('.decide').forEach(function(s){
      var n = s.dataset.name;
      if (o[n]) { 줄.push('· ' + n + ' → ' + o[n]); s.classList.add('done'); }
      else s.classList.remove('done');
    });
    out.value = 줄.length ? '[재료로 찾기 판정 · 2026-08-23]\\n' + 줄.join('\\n') : '';
  }

  var 저장된 = 읽기();
  radios.forEach(function(r){
    if (저장된[r.name] === r.value) r.checked = true;
    r.addEventListener('change', function(){
      var o = 읽기(); o[r.name] = r.value; 쓰기(o); 그리기();
    });
  });
  그리기();

  document.getElementById('btn').addEventListener('click', function(){
    if (!out.value) { said.textContent = '아직 고른 게 없어요'; return; }
    // ⛔ clipboard 가 «성공으로 resolve 되고도» 실제 복사가 안 되는 폰이 있다(v10.97)
    //    → 그래서 성공 문구만 믿지 않고, 실패하면 글자를 골라 준다
    function 골라주기(){
      out.removeAttribute('readonly'); out.focus(); out.select();
      try { out.setSelectionRange(0, out.value.length); } catch(e){}
      said.textContent = '글자를 골라뒀어요 — 길게 눌러 「복사」를 누르면 돼요';
    }
    try {
      navigator.clipboard.writeText(out.value).then(function(){
        said.textContent = '복사했어요 ✅ 붙여넣어 보내 주세요';
      }, 골라주기);
    } catch(e){ 골라주기(); }
  });
})();
</script>`

// ⭐ 아티팩트는 «몸통만» 받는다 — doctype·html·head·body 를 우리가 쓰지 않는다
writeFileSync(join(OUT, '아티팩트.html'), `<title>재료로 찾기 판정</title>\n${몸통}`)
// 컴퓨터에서 그냥 열어보는 판(같은 몸통에 껍데기만 씌운다 — 두 벌이 갈리지 않는다)
writeFileSync(join(OUT, '시안.html'), `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>재료로 찾기 판정</title></head><body>${몸통}</body></html>`)

const kb = (f) => Math.round(readFileSync(join(OUT, f)).length / 1024)
console.log(`🥕 아티팩트 → ${join(OUT, '아티팩트.html')}  (${kb('아티팩트.html')}KB)`)
console.log(`🖥 열어보는 판 → ${join(OUT, '시안.html')}  (${kb('시안.html')}KB)`)
