// 📋 「AI 스캔 = 돈」 안내 판정판 HTML 을 만든다 (2026-08-21)
//   ⛔ [절대원칙 30] 판 «생성기»는 저장소에 둔다 — scratchpad 에 두면 세션과 함께 날아가고
//      다음에 또 파서를 새로 짠다. 결과 HTML 만 scratchpad 로(저장소가 public 이라서).
//   ☑️ [절대원칙] 검수판은 «무조건» 체크 ＋ 복사 (창업자 2026-08-19)
//      clipboard 가 성공으로 resolve 되고도 실제 복사가 안 되는 폰이 있다 → Range 폴백까지.
// 실행: cd /home/user/hankki/hankki && node scripts/_판만들기-스캔안내-0821.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const SRC = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/스캔안내'
const OUT = join(SRC, '판.html')
const b64 = (f) => (existsSync(join(SRC, f)) ? `data:image/png;base64,${readFileSync(join(SRC, f)).toString('base64')}` : '')

const 갈래 = [
  {
    키: 'a', 이름: 'ⓐ 지금 그대로',
    설명: '비교용이야. 값(「1장에 1장」)이 문장 <b>뒤</b>에 있고, 아래 두 줄과 색·굵기가 같아.',
    문구: ['긴 레시피는 <em>여러 장을 한꺼번에 골라도 돼요</em> — 사진 1장에 AI 스캔 1장씩 써요.'],
    비고: '남편이 「20장」을 못 알아챈 상태가 이거야.',
  },
  {
    키: 'b', 이름: 'ⓑ 순서만 뒤집기 ＋ 빨강',
    설명: '값을 <b>맨 앞</b>으로 옮기고 빨강. 제일 작은 손질이야.',
    문구: [
      '띠 → <r>사진 1장 읽을 때마다 1장씩 써요</r>',
      '안내 → <r>사진 1장에 AI 스캔 1장</r>을 써요 — 긴 레시피는 여러 장 골라도 돼요.',
    ],
    비고: '',
  },
  {
    키: 'c', 이름: 'ⓒ ＋ 예시 한 줄',
    설명: '네가 말한 <b>예시</b>를 숫자로 넣었어.',
    문구: [
      '띠 → <r>사진 1장 읽을 때마다 1장씩 써요</r>',
      '안내 → <r>사진 1장에 AI 스캔 1장</r>을 써요 — <b>캡처 3장으로 만들면 3장.</b>',
    ],
    비고: '',
  },
  {
    키: 'd', 이름: 'ⓓ ＋ 공짜 길까지 알려주기',
    설명: '<b>제일 세</b>. 「글자·링크는 공짜」를 같이 말해서 초록 카드의 오해를 여기서 풀어.',
    문구: [
      '띠 → <r>사진 1장 읽을 때마다 1장씩 써요 · 글자·링크로 넣으면 안 써요</r>',
      '안내 → <r>사진 1장에 AI 스캔 1장</r>을 써요 — <b>캡처 3장으로 만들면 3장.</b>',
      '초록 카드 → 「AI 자동 정리 〔이미 돼요〕」를 <b>「자동으로 채워주기 — 사진은 AI 스캔을 쓰고, 글자·링크는 안 써요」</b>로',
    ],
    비고: '「이미 돼요」 배지를 뗐어 — 그게 「공짜」로 읽히던 자리라서.',
  },
]

const 카드 = 갈래.map((g) => `
  <section class="opt" id="opt-${g.키}">
    <div class="opt-head">
      <h2>${g.이름}</h2>
      <p class="lede">${g.설명}</p>
    </div>
    <ul class="phrases">${g.문구.map((f) => `<li>${f}</li>`).join('')}</ul>
    ${g.비고 ? `<p class="note">${g.비고}</p>` : ''}
    <div class="shots">
      <figure><figcaption>가져오기 화면</figcaption><img src="${b64(`greige-${g.키}-가져오기.png`)}" alt="${g.이름} 가져오기 화면"></figure>
      <figure><figcaption>편집 화면(캡처 안내)</figcaption><img src="${b64(`greige-${g.키}-편집.png`)}" alt="${g.이름} 편집 화면"></figure>
      ${g.키 !== 'a' ? `<figure class="dark"><figcaption>다크 테마</figcaption><img src="${b64(`dark-${g.키}-가져오기.png`)}" alt="${g.이름} 다크"></figure>` : ''}
    </div>
    <div class="pick" data-key="${g.키}">
      ${[['good', '이걸로'], ['maybe', '고민'], ['no', '아니야']].map(([v, t]) => `
        <label><input type="radio" name="p-${g.키}" value="${v}"><span>${t}</span></label>`).join('')}
    </div>
  </section>`).join('')

const html = `<title>AI 스캔 안내 고르기</title>
<style>
  :root{
    --ink:#3d3a34; --sub:#7d7568; --paper:#eeebe3; --card:#fbf9f5;
    --line:#ddd6c9; --red:#bd5a44; --green:#4a7a45; --shadow:0 1px 3px rgba(90,72,48,.09);
  }
  @media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
    --ink:#e8e4dc; --sub:#a49c8f; --paper:#17171b; --card:#22222a;
    --line:#34343d; --red:#e0946a; --green:#8fb37f; --shadow:0 1px 3px rgba(0,0,0,.4);
  }}
  :root[data-theme="dark"]{
    --ink:#e8e4dc; --sub:#a49c8f; --paper:#17171b; --card:#22222a;
    --line:#34343d; --red:#e0946a; --green:#8fb37f; --shadow:0 1px 3px rgba(0,0,0,.4);
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--paper);color:var(--ink);
    font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif;
    line-height:1.6;font-size:15px;-webkit-text-size-adjust:100%}
  .wrap{max-width:560px;margin:0 auto;padding:22px 16px 70px}
  h1{font-size:22px;line-height:1.35;margin:0 0 6px;letter-spacing:-.4px;text-wrap:balance}
  .sub{color:var(--sub);font-size:13.5px;margin:0 0 22px}
  r,em{font-style:normal;color:var(--red);font-weight:800}
  .why{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:15px 16px;margin-bottom:22px;box-shadow:var(--shadow)}
  .why h3{margin:0 0 9px;font-size:14.5px}
  .why p{margin:0 0 8px;font-size:13.6px}
  .why p:last-child{margin-bottom:0}
  .quote{color:var(--sub);font-size:13px;border-left:2.5px solid var(--line);padding-left:10px;margin:9px 0}
  table{width:100%;border-collapse:collapse;font-size:13.4px;margin:10px 0 2px}
  th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line)}
  th{color:var(--sub);font-weight:700;font-size:12.5px}
  td.pay{color:var(--red);font-weight:800}
  td.free{color:var(--green);font-weight:800}
  .opt{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px;margin-bottom:18px;box-shadow:var(--shadow)}
  .opt h2{font-size:17px;margin:0 0 5px;letter-spacing:-.3px}
  .lede{margin:0 0 11px;font-size:13.6px;color:var(--sub)}
  .phrases{margin:0 0 10px;padding:0 0 0 17px;font-size:13.6px}
  .phrases li{margin-bottom:5px}
  .note{margin:0 0 12px;font-size:12.8px;color:var(--sub)}
  .shots{display:flex;flex-direction:column;gap:13px;margin-bottom:14px}
  figure{margin:0}
  figcaption{font-size:11.8px;color:var(--sub);margin-bottom:5px;font-weight:700}
  img{width:100%;height:auto;display:block;border-radius:11px;border:1px solid var(--line)}
  .pick{display:flex;gap:8px}
  .pick label{flex:1;display:flex;align-items:center;justify-content:center;gap:5px;
    padding:11px 6px;border:1.5px solid var(--line);border-radius:11px;cursor:pointer;
    font-size:13.5px;font-weight:700;background:transparent;transition:.12s}
  .pick input{position:absolute;opacity:0;pointer-events:none}
  .pick label:has(input:checked){border-color:var(--red);color:var(--red);
    background:color-mix(in srgb,var(--red) 9%,transparent)}
  .left{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:15px 16px;margin:22px 0 18px}
  .left h3{margin:0 0 8px;font-size:14.5px}
  .left ul{margin:0;padding-left:18px;font-size:13.4px;color:var(--sub)}
  .left li{margin-bottom:5px}
  .bar{position:sticky;bottom:0;background:var(--paper);padding:12px 0 0;margin-top:8px}
  button{width:100%;padding:15px;border:none;border-radius:13px;background:var(--red);color:#fff;
    font-size:15.5px;font-weight:800;cursor:pointer;font-family:inherit}
  #out{width:100%;margin-top:10px;padding:12px;border:1px solid var(--line);border-radius:11px;
    background:var(--card);color:var(--ink);font-size:13px;font-family:inherit;line-height:1.55;
    min-height:88px;display:none;white-space:pre-wrap}
  @media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>

<div class="wrap">
  <h1>「AI 스캔 = 돈」을 처음 보는 사람도 알게</h1>
  <p class="sub">2026-08-21 · 갈래 넷 · 전부 <b>실물 앱</b>에 글자·색만 갈아끼워 찍었어</p>

  <div class="why">
    <h3>왜 고쳐야 하나</h3>
    <p class="quote">남편(운영자 아닌 첫 유저) — <b>“20번의 AI 기능을 이용할 수 있는 거냐”</b></p>
    <p>우리는 <b>사진 20장</b>인데 「기능 20번」으로 읽혔어. 네 말대로 <b>장수가 곧 돈인 걸 알면 알아서 아껴</b> — 그런데 그 「알면」이 지금 안 지켜지고 있어.</p>
    <h3 style="margin-top:13px">지금 화면의 문제 셋</h3>
    <p>① 편집 안내가 <b>권유 먼저, 값 나중</b> — 「여러 장 골라도 돼요」가 먼저 읽혀</p>
    <p>② 가져오기 화면이 두 말을 동시에 — 위는 「AI 스캔 <b>20장</b>」, 아래는 「AI 자동 정리 <b>〔이미 돼요〕</b>」. 둘 다 초록이고 둘 다 AI야</p>
    <p>③ 그 초록 카드가 <b>돈 드는 길과 공짜 길을 한 줄로</b> 묶었어 — 「<r>캡처</r>·<span style="color:var(--green);font-weight:800">링크</span> 올리면 자동으로 채워요」</p>
    <table>
      <tr><th>가져오기 방법</th><th>AI 스캔</th><th>잘 되나</th></tr>
      <tr><td>사진 · 직접 작성하기</td><td class="pay">1장당 1장</td><td>✅</td></tr>
      <tr><td>Instagram (캡처)</td><td class="pay">1장당 1장</td><td>✅</td></tr>
      <tr><td>YouTube (캡처)</td><td class="pay">1장당 1장</td><td>✅</td></tr>
      <tr><td>텍스트 붙여넣기</td><td class="free">안 씀</td><td>✅</td></tr>
      <tr><td>링크 붙여넣기</td><td class="free">안 씀</td><td class="pay">⚠️ 잘 안 읽힘</td></tr>
      <tr><td>YouTube <b>링크</b></td><td class="free">안 씀</td><td class="pay">⛔ 아예 안 읽음</td></tr>
    </table>
    <p style="font-size:12.6px;color:var(--sub);margin-top:8px">
      ⛔ <b>「안 씀」을 「공짜」라고 쓰면 안 돼</b> — 「공짜」는 «되는데 돈만 안 든다»로 읽혀.
      링크는 <b>잘 안 읽히고</b>(창업자 <b>“우리 링크는 넣어도 못읽잖아”</b>),
      유튜브 링크는 <code>linkReader.js:120</code> 이 <b>아예 시도조차 안 해</b>
      (창업자 옛 제보 “영어로 이상한 말만 복사됨” 때문에 그렇게 막아둔 것).
    </p>
  </div>

  ${카드}

  <div class="left">
    <h3>⚠️ 이 넷으로도 아직 안 풀리는 것</h3>
    <ul>
      <li>가운데 <b>다섯 갈래 목록</b>엔 여전히 「돈 드나」 표시가 없어 — 유저가 실제로 고르는 자리인데.</li>
      <li><b>안내 카드 둘째 줄</b> — 「재료·순서가 섞이면 각 칸의 사진에서 채우기로…」.
        창업자가 <b>“이게 무슨말이지?”</b> 라고 물었어. 앱 만든 사람이 못 읽는 문장을
        처음 보는 사람이 읽을 리가 없으니 <b>이 줄도 다시 써야 해.</b>
        (원래 뜻 = 캡처 한 장에 재료와 만드는 법이 같이 있으면 AI가 뒤섞어 넣으니,
        재료 칸·순서 칸에 각각 있는 「사진에서 채우기」로 그 칸만 따로 읽으라는 말)</li>
      <li><b>링크 갈래 설명</b> — 「블로그 글 읽어오기」라고 적혀 있는데 잘 안 읽혀.
        유저가 넣었다가 안 되면 「고장난 앱」으로 읽어.</li>
    </ul>
  </div>

  <div class="bar">
    <button id="copy">고른 것 복사하기</button>
    <textarea id="out" readonly></textarea>
  </div>
</div>

<script>
  var KEY = 'hankki-scan-guide-0821';
  var keys = ['a','b','c','d'];
  var names = { a:'ⓐ 지금 그대로', b:'ⓑ 순서 뒤집기＋빨강', c:'ⓒ ＋예시 한 줄', d:'ⓓ ＋공짜 길까지' };
  var labels = { good:'이걸로', maybe:'고민', no:'아니야' };

  function load(){
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || '{}');
      keys.forEach(function(k){
        if (!s[k]) return;
        var el = document.querySelector('input[name="p-'+k+'"][value="'+s[k]+'"]');
        if (el) el.checked = true;
      });
    } catch (e) {}
  }
  function save(){
    var s = {};
    keys.forEach(function(k){
      var el = document.querySelector('input[name="p-'+k+'"]:checked');
      if (el) s[k] = el.value;
    });
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }
  document.addEventListener('change', function(e){ if (e.target.type === 'radio') save(); });
  load();

  document.getElementById('copy').addEventListener('click', function(){
    var lines = ['【AI 스캔 안내 — 고른 것 · 2026-08-21】'];
    var any = false;
    keys.forEach(function(k){
      var el = document.querySelector('input[name="p-'+k+'"]:checked');
      if (el) { any = true; lines.push('· ' + names[k] + ' → ' + labels[el.value]); }
    });
    if (!any) lines.push('(아직 아무것도 안 골랐어)');
    var text = lines.join('\\n');
    var out = document.getElementById('out');
    out.value = text;
    out.style.display = 'block';
    // ⛔ clipboard 는 성공으로 resolve 되고도 실제 복사가 안 되는 폰이 있다(v10.97) → 글자를 골라 주는 폴백
    try {
      navigator.clipboard.writeText(text).then(function(){
        document.getElementById('copy').textContent = '복사했어 ✓';
        setTimeout(function(){ document.getElementById('copy').textContent = '고른 것 복사하기'; }, 1800);
      }).catch(pick);
    } catch (e) { pick(); }
    function pick(){
      out.focus(); out.select();
      try { out.setSelectionRange(0, 99999); } catch (e2) {}
      document.getElementById('copy').textContent = '길게 눌러 복사해줘 ↓';
    }
  });
</script>`

writeFileSync(OUT, html)
console.log(`✅ ${OUT}`)
console.log(`   크기 ${(html.length / 1024 / 1024).toFixed(2)} MB`)
