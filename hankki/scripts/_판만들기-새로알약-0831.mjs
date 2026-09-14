// 🧾 「새로 알약」 판정판 만들기 — `_판-새로알약-0831.mjs` 가 찍은 컷을 한 장으로 엮는다
//
// ⭐ 판 생성기는 «저장소»에 둔다(규칙 30) — scratchpad 에 두면 세션과 함께 날아가고
//    다음에 또 처음부터 짠다. 결과물(HTML)만 scratchpad 로 낸다(저장소가 공개라서).
// ☑️ 절대원칙 = **무조건 체크 ＋ 복사** (clipboard 가 «성공으로 resolve 되고도» 실패하는 폰이 있다 → Range 폴백)
//
// 실행: node /home/user/hankki/hankki/scripts/_판만들기-새로알약-0831.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const DIR = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/새로알약'
mkdirSync(DIR, { recursive: true })
const 컷 = (이름) => `data:image/png;base64,${readFileSync(join(DIR, `${이름}.png`)).toString('base64')}`

const 갈래 = [
  {
    키: '㉠', 이름: '지금 그대로',
    한줄: '파란 「새로」 — 아래 「아직 안 해봤어요」와 같은 색이고, 읽어도 안 꺼진다.',
    왜: '고칠 게 없다고 보면 이것. 다만 실측한 두 가지가 그대로 남는다.',
    밝: 'greige-㉠지금', 어: 'dark-㉠지금',
  },
  {
    키: '㉡', 이름: '색만 다르게',
    한줄: '「새로」를 선물 주황으로. 아래 파란 알약과 확실히 갈린다.',
    왜: '새 색을 만드는 게 아니라 <b>소식 팝업이 이미 쓰는 색</b>을 그대로 쓴다 — 앱 포인트가 전부 파랑이라 주황 하나만 튄다. 대비도 재둔 값이다(흰 글자 4.84).',
    밝: 'greige-㉡색만', 어: 'dark-㉡색만',
  },
  {
    키: '㉢', 이름: '읽으면 꺼진다',
    한줄: '색은 지금 그대로. 소식을 열어 보면 알약이 사라지고, 새것이 오면 다시 뜬다.',
    왜: '아래 그림은 <b>읽고 난 뒤</b> 모습이다. 지금은 8/29~9/8 이 <b>전부 켜져</b> 있어서 「새로」가 새것을 뜻하지 못한다.',
    밝: 'greige-㉢읽으면꺼짐', 어: 'dark-㉢읽으면꺼짐',
  },
  {
    키: '㉣', 이름: '둘 다', 추천: true,
    한줄: '주황이고, 읽으면 꺼진다. (아래는 아직 안 읽었을 때 모습)',
    왜: '창업자가 말한 두 가지가 <b>서로 다른 문제</b>라서 하나만 고치면 반쪽이 된다 — 색은 「눈에 띄나」, 꺼짐은 「진짜 새것인가」.',
    밝: 'greige-㉣둘다', 어: 'dark-㉣둘다',
  },
]

const 카드 = 갈래.map((g) => `
  <label class="opt" for="o${g.키}">
    <input type="radio" name="pick" id="o${g.키}" value="${g.키} ${g.이름}">
    <div class="body">
      <div class="head">
        <span class="key">${g.키}</span>
        <span class="nm">${g.이름}</span>
        ${g.추천 ? '<span class="rec">추천</span>' : ''}
        <span class="tick" aria-hidden="true">✓</span>
      </div>
      <p class="one">${g.한줄}</p>
      <p class="why">${g.왜}</p>
      <figure><img src="${컷(g.밝)}" alt="${g.이름} — 기본 테마"><figcaption>기본</figcaption></figure>
      <figure><img src="${컷(g.어)}" alt="${g.이름} — 다크 테마"><figcaption>다크</figcaption></figure>
    </div>
  </label>`).join('')

const HTML = `<title>새로 알약 판정</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@400;600;800&display=swap">
<style>
:root{
  --ink:#2c2a26; --ink-2:#6b665e; --line:#e0dbd1;
  --ground:#f5f2ec; --card:#fffdf9;
  --blue:#5878a0; --gift:#a85f2e;
  --pick:#a85f2e; --pick-soft:#fbf1e8;
}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
  --ink:#ece8e1; --ink-2:#a8a29a; --line:#3a3630;
  --ground:#1b1a18; --card:#232120;
  --blue:#7093c0; --gift:#c9834f;
  --pick:#c9834f; --pick-soft:#2e2620;
}}
:root[data-theme="dark"]{
  --ink:#ece8e1; --ink-2:#a8a29a; --line:#3a3630;
  --ground:#1b1a18; --card:#232120;
  --blue:#7093c0; --gift:#c9834f;
  --pick:#c9834f; --pick-soft:#2e2620;
}
*{box-sizing:border-box}
body{background:var(--ground);color:var(--ink);
  font-family:"Gothic A1","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;
  line-height:1.62;padding:20px 16px 56px;max-width:660px;margin:0 auto}
h1{font-size:25px;font-weight:800;margin:0 0 6px;letter-spacing:-.01em;text-wrap:balance}
.said{font-size:15px;color:var(--ink-2);margin:0 0 20px}
.said b{color:var(--ink);font-weight:600}

.found{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 15px;margin:0 0 22px}
.found h2{font-size:13px;font-weight:800;letter-spacing:.06em;color:var(--ink-2);margin:0 0 10px;text-transform:uppercase}
.found ul{margin:0;padding-left:0;list-style:none;display:flex;flex-direction:column;gap:10px}
.found li{font-size:15px;display:flex;gap:9px}
.found li::before{content:"";flex:0 0 auto;width:7px;height:7px;border-radius:999px;background:var(--gift);margin-top:8px}
.found b{font-weight:800}
.num{font-variant-numeric:tabular-nums;font-weight:800;color:var(--gift)}

.opt{display:block;background:var(--card);border:1px solid var(--line);border-radius:16px;
  padding:15px 16px 13px;margin:0 0 12px;cursor:pointer;transition:border-color .12s,background .12s}
.opt input{position:absolute;opacity:0;width:0;height:0}
.opt:has(input:checked){border-color:var(--pick);background:var(--pick-soft)}
.opt:has(input:focus-visible){outline:2px solid var(--pick);outline-offset:2px}
.head{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.key{font-size:19px;font-weight:800;color:var(--pick)}
.nm{font-size:18px;font-weight:800}
.rec{font-size:12px;font-weight:800;color:#fff;background:var(--gift);border-radius:999px;padding:2px 8px}
.tick{margin-left:auto;font-size:16px;font-weight:800;color:var(--pick);opacity:0;transition:opacity .12s}
.opt:has(input:checked) .tick{opacity:1}
.one{font-size:15.5px;margin:7px 0 0}
.why{font-size:14px;color:var(--ink-2);margin:5px 0 12px}
.why b{color:var(--ink);font-weight:600}
figure{margin:0 0 9px}
figure img{width:100%;display:block;border-radius:11px;border:1px solid var(--line)}
figcaption{font-size:12px;color:var(--ink-2);margin-top:4px;letter-spacing:.04em}

.foot{margin-top:26px;display:flex;flex-direction:column;gap:10px}
button{font:inherit;font-weight:800;font-size:16px;color:#fff;background:var(--pick);
  border:0;border-radius:12px;padding:14px;cursor:pointer}
button:active{transform:translateY(1px)}
#out{font-size:15px;background:var(--card);border:1px solid var(--line);border-radius:12px;
  padding:12px 13px;min-height:46px;white-space:pre-wrap;word-break:break-word}
.note{font-size:13px;color:var(--ink-2);margin:0}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>

<h1>「새로」 알약, 어떻게 할까</h1>
<p class="said">창업자 = <b>“한끼소식에 알약은 색을 다르게 하거나, 새로 올라온게 있으면 표시가 있으면 좋겠어.”</b><br>
자리 = 홈 화면 「한끼 소식」 카드의 <b>「새로」</b> 알약.</p>

<section class="found">
  <h2>재보니 둘 다 맞는 말이었다</h2>
  <ul>
    <li><span><b>색</b> — 「새로」와 바로 아래 「아직 안 해봤어요」가 <b>똑같은 파랑 ＋ 흰 글자</b>다. 알림이 아니라 이름표로 읽힌다.</span></li>
    <li><span><b>표시</b> — 8/29 ~ 9/8 <span class="num">일곱 날 전부</span> 켜져 있었다. 우리집레시피가 주마다 열려서 늘 차 있다. 늘 켜져 있으면 「새로」가 아니다.</span></li>
  </ul>
</section>

${카드}

<div class="foot">
  <button id="copy" type="button">고른 것 복사하기</button>
  <div id="out">아직 안 골랐어요.</div>
  <p class="note">고른 것은 이 폰에 저장돼요 — 다시 열어도 그대로예요.</p>
</div>

<script>
var KEY='hankki:판:새로알약:0831';
var outEl=document.getElementById('out');
function 글(){
  var r=document.querySelector('input[name=pick]:checked');
  return r?('「새로」 알약 = '+r.value):'아직 안 골랐어요.';
}
function 그리기(){ outEl.textContent=글(); }
try{
  var v=localStorage.getItem(KEY);
  if(v){ var el=document.querySelector('input[value="'+v+'"]'); if(el) el.checked=true; }
}catch(e){/* 저장 못 해도 판은 돈다 */}
그리기();
document.querySelectorAll('input[name=pick]').forEach(function(r){
  r.addEventListener('change',function(){
    try{ localStorage.setItem(KEY,r.value); }catch(e){/* 저장 못 해도 고르기는 된다 */}
    그리기();
  });
});
document.getElementById('copy').addEventListener('click',function(){
  var t=글();
  // ⛔ clipboard.writeText 는 «성공으로 resolve 되고도» 실제 복사가 안 되는 폰이 있다(v10.97).
  //    그래서 실패하면 글자를 «골라» 준다 — 길게 눌러 복사하면 된다.
  function 폴백(){
    var r=document.createRange(); r.selectNodeContents(outEl);
    var s=window.getSelection(); s.removeAllRanges(); s.addRange(r);
    outEl.textContent=t+'\\n\\n(복사가 안 되면 위 글자를 길게 눌러 복사해 주세요)';
  }
  try{
    navigator.clipboard.writeText(t).then(function(){
      outEl.textContent=t+'\\n\\n복사했어요 ✓';
    },폴백);
  }catch(e){ 폴백(); }
});
</script>
`

const 낼곳 = join(DIR, '새로알약-판정.html')
writeFileSync(낼곳, HTML)
console.log(`📄 ${낼곳}  (${(HTML.length / 1024).toFixed(0)} KB)`)
