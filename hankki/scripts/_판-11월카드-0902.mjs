// 🎴📋 **11월 레꾸자랑 카드 8장 — 창업자 검수판 만들기** (2026-09-02)
//
// 📮 창업자 확정(2026-09-02) = *"ㅇㅇ 카드 뼈대 하자"* → *"**11월은 둘가추가하자**"*
//    · *"1번은 색이 노랑계열로 … 아래가 살짝 휑하네"*  → 엽서(`post`)
//    · *"2번은 가을 느낌 딱 나고"*                      → 티켓(`ticket`)
//    · *"3번은 예쁜데 겨울느낌나"*                      → 첫눈(`snow`)은 **12월로 미뤘다**(여기 없음)
//
// ⭐ **찍는 일은 `_shot-자랑카드-0901.mjs` 가 한다** — 이 판은 그 결과를 폰에서 볼 수 있게 엮는다.
//    ⛔ 그림을 여기서 다시 만들지 않는다(두 곳에서 만들면 반드시 어긋난다 · 절대원칙 30).
//
// ☑️☑️ **절대원칙(창업자 2026-08-19) = 검수판은 «무조건» 체크 ＋ 복사.**
//    ⑶ `clipboard.writeText()` 는 성공으로 resolve 되고도 복사가 안 되는 폰이 있다(v10.97)
//       → 실패하면 글자를 «골라 준다»(Range)
//
// 실행:
//   ON=2026-11-15 KEYS=post,ticket,warm,panel,pola,mag,arch,night \
//     SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_shot-자랑카드-0901.mjs
//   node scripts/_판-11월카드-0902.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require_ = createRequire(import.meta.url)
const FF = require_('ffmpeg-static')
const SCRATCH = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const 방 = `${SCRATCH}/자랑카드-0901`
if (!existsSync(방)) { console.error(`✗ ${방} 이 없다 — _shot-자랑카드-0901.mjs 를 먼저 돌린다`); process.exit(1) }

// 🖼 판이 무거우면 폰에서 안 열린다 → 줄여 담는다.
//    ⛔ 다만 **판정용이라 너무 줄이지 않는다**(작게 줄이면 흠이 안 보인다 · 절대원칙 13).
//    ⭐ **WebP 로 굽는다** — 같은 폭에서 PNG 는 7.6MB, WebP(q90)는 1MB 안쪽이다.
//       판이 무거우면 폰에서 «안 열리는» 게 아니라 «느리게» 열려서 창업자가 기다린다.
const 담기 = (파일, 폭) => {
  const 임시 = `/tmp/판11-${Math.random().toString(36).slice(2)}.webp`
  execFileSync(FF, ['-y', '-v', 'error', '-i', 파일, '-vf', `scale=${폭}:-1`, '-quality', '90', 임시])
  return `data:image/webp;base64,${readFileSync(임시).toString('base64')}`
}

const 칸정의 = [
  { id: 'post', 제목: '🆕 엽서 (post)', 새것: true,
    설명: '창업자 판정 = <b>"1번은 색이 노랑계열로"</b> · <b>"아래가 살짝 휑하네"</b> → 노랑·은행잎으로 바꾸고 <b>주소 줄</b>을 넣었다. 우표 톱니 ＋ 소인(HANKKI 늦가을 11·NOV).' },
  { id: 'ticket', 제목: '🆕 티켓 (ticket)', 새것: true,
    설명: '창업자 판정 = <b>"2번은 가을 느낌 딱 나고"</b> → 그대로. 김장 붉은 스텁 ＋ 절취선 ＋ 좌우 펀치 홈 ＋ No.○○ ADMIT ONE.' },
  { id: 'warm', 제목: '따뜻한 판 (warm)', 설명: '사철 뼈대 · <b>늦가을 옷</b>을 입었다' },
  { id: 'panel', 제목: '패널 (panel)', 설명: '사철 뼈대 · 늦가을 옷' },
  { id: 'pola', 제목: '폴라로이드 (pola)', 설명: '사철 뼈대 · 늦가을 옷 · 씬 사진이 섞인다(여름 씬은 9/1에 뺐다)' },
  { id: 'mag', 제목: '매거진 (mag)', 설명: '사철 뼈대 · 늦가을 옷' },
  { id: 'arch', 제목: '아치 (arch)', 설명: '사철 뼈대 · 늦가을 옷 · 「늦가을 한정」 알약이 붙는다' },
  { id: 'night', 제목: '밤 (night)', 설명: '사철 뼈대 · 늦가을은 밝기 대신 <b>색조 +47°</b>로 갈랐다(이미 어두워서 더 낮추면 까매진다)' },
]

const 칸들 = 칸정의.filter((c) => existsSync(`${방}/${c.id}.png`))
  .map((c) => ({ ...c, 그림: 담기(`${방}/${c.id}.png`, 660) }))
const 없는것 = 칸정의.filter((c) => !existsSync(`${방}/${c.id}.png`)).map((c) => c.id)
if (없는것.length) console.log(`  ⚠️ 못 찾은 컷 = ${없는것.join(' ')} — 다시 찍을 것`)

// 👀 내가 눈으로 보고 걸린 것 (절대원칙 21 — 보여주기 전에 열어서 봤다)
const 눈에걸린것 = [
  '<b>티켓</b>의 붉은 스텁이 <b>아래 절반이 비어</b> 보인다 — 창업자가 엽서에 짚은 <b>"아래가 살짝 휑하네"</b>와 같은 결이다. 채울지 판정 필요',
  '카드에 나오는 <b>펭펭</b>은 오늘 정본 6컷으로 갈았다(옛 흰 트렌치 9컷은 내렸다). <b>12~8월엔 펭펭이 안 나온다</b> — 새 컷을 받으면 찬다',
]

// ⛔ 아티팩트로 올릴 것이라 `<!doctype>`·`<html>`·`<head>`·`<body>` 를 «쓰지 않는다».
const html = `<title>11월 레꾸자랑 카드</title>
<style>
  :root { --bg:#fdfbf7; --card:#fff; --line:#efe8dc; --text:#3d3830; --sub:#8f887b; --pt:#a4622f; }
  *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--text);
    font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;
    line-height:1.6;-webkit-text-size-adjust:100%}
  .wrap{max-width:820px;margin:0 auto;padding:18px 14px 120px}
  h1{font-size:22px;margin:6px 0 4px} .lead{color:var(--sub);font-size:14px;margin:0 0 16px}
  .warn{background:#fff6ec;border:1px solid #f0dcc2;border-radius:12px;padding:12px 14px;margin-bottom:18px;font-size:14px}
  .warn b{color:#b4541f}
  .item{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px;margin-bottom:16px}
  .item.new{border-color:var(--pt);border-width:2px}
  .item h2{font-size:17px;margin:0 0 2px} .item p{margin:0 0 10px;color:var(--sub);font-size:13px}
  .item img{width:100%;border-radius:10px;display:block;background:#f4f1ea}
  .pick{display:flex;gap:8px;margin-top:12px}
  .pick button{flex:1;padding:11px 6px;border-radius:11px;border:1.5px solid var(--line);
    background:#fff;color:var(--text);font-size:14px;font-family:inherit;cursor:pointer}
  .pick button[aria-pressed="true"]{background:var(--pt);border-color:var(--pt);color:#fff;font-weight:700}
  .memo{width:100%;box-sizing:border-box;margin-top:10px;padding:10px 11px;font:inherit;font-size:14px;
    line-height:1.5;color:var(--text);background:var(--bg);border:1.5px dashed var(--line);
    border-radius:11px;resize:vertical;min-height:44px}
  .memo:focus{outline:none;border-color:var(--pt);border-style:solid}
  .memo::placeholder{color:var(--sub)}
  .allmemo{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px;margin-bottom:16px}
  .allmemo h2{font-size:16px;margin:0 0 4px} .allmemo p{color:var(--sub);font-size:13px;margin:0}
  .bar{position:fixed;left:0;right:0;bottom:0;background:rgba(253,251,247,.97);
    border-top:1px solid var(--line);padding:12px 14px calc(12px + env(safe-area-inset-bottom))}
  .bar .in{max-width:820px;margin:0 auto;display:flex;gap:10px;align-items:center}
  .bar b{font-variant-numeric:tabular-nums}
  .bar button{flex:1;padding:13px;border-radius:12px;border:0;background:var(--pt);color:#fff;
    font-size:15px;font-weight:700;font-family:inherit;cursor:pointer}
  #out{white-space:pre-wrap;font-size:13px;background:#fff;border:1px solid var(--line);
    border-radius:10px;padding:10px;margin-top:10px;display:none}
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
    --bg:#17171b; --card:#202026; --line:rgba(255,255,255,.10); --text:#ecebf1; --sub:#9a97a2; --pt:#c78a52; } }
  :root[data-theme="dark"] { --bg:#17171b; --card:#202026; --line:rgba(255,255,255,.10);
    --text:#ecebf1; --sub:#9a97a2; --pt:#c78a52; }
</style>
<div class="wrap">
<h1>🎴 11월 레꾸자랑 카드 ${칸들.length}장</h1>
<p class="lead">2026-11-15 로 시계를 돌려 <b>진짜 앱에서</b> 뽑아 찍었다. 위 둘이 이번에 새로 만든 뼈대다.<br>
⛔ 아직 <b>배포 전</b>이야 — 「배포해」 하면 그때 나간다.</p>

<div class="warn"><b>눈에 걸린 것</b><br>${눈에걸린것.join('<br>')}</div>

${칸들.map((c) => `<div class="item${c.새것 ? ' new' : ''}" data-id="${c.id}">
  <h2>${c.제목}</h2><p>${c.설명}</p>
  <img src="${c.그림}" alt="${c.제목}">
  <div class="pick">
    <button data-v="좋다">좋다</button>
    <button data-v="고칠것">고칠 것 있다</button>
    <button data-v="모름">모르겠다</button>
  </div>
  <textarea class="memo" data-id="${c.id}" rows="1"
    placeholder="어디를 고칠까요? (안 적어도 돼요)"></textarea>
  </div>`).join('\n')}

<div class="allmemo">
  <h2>📝 통째로 하고 싶은 말</h2>
  <p>칸마다 적기 애매한 것 · 전체에 걸친 것</p>
  <textarea class="memo" data-id="__전체__" rows="3"
    placeholder="예) 티켓 스텁 아래에 소인 하나만 더 넣자"></textarea>
</div>

<div id="out"></div>
</div>
<div class="bar"><div class="in">
  <span>고른 것 <b id="cnt">0</b>/${칸들.length}</span>
  <button id="copy">결과 복사하기</button>
</div></div>
<script>
  var KEY='hankki-11월카드-0902';
  var saved={}; try{ saved=JSON.parse(localStorage.getItem(KEY)||'{}') }catch(e){}
  function cnt(){ document.getElementById('cnt').textContent=Object.keys(saved).length }
  document.querySelectorAll('.item').forEach(function(it){
    var id=it.dataset.id;
    it.querySelectorAll('.pick button').forEach(function(b){
      if(saved[id]===b.dataset.v) b.setAttribute('aria-pressed','true');
      b.onclick=function(){
        it.querySelectorAll('.pick button').forEach(function(x){x.setAttribute('aria-pressed','false')});
        b.setAttribute('aria-pressed','true'); saved[id]=b.dataset.v;
        try{ localStorage.setItem(KEY,JSON.stringify(saved)) }catch(e){}
        cnt();
      };
    });
  });
  cnt();

  var MKEY='hankki-11월카드메모-0902';
  var memo={}; try{ memo=JSON.parse(localStorage.getItem(MKEY)||'{}') }catch(e){}
  function grow(t){ t.style.height='auto'; t.style.height=(t.scrollHeight+2)+'px' }
  document.querySelectorAll('.memo').forEach(function(t){
    var id=t.dataset.id;
    if(memo[id]){ t.value=memo[id] }
    grow(t);
    t.oninput=function(){
      var v=t.value.trim();
      if(v){ memo[id]=v } else { delete memo[id] }
      try{ localStorage.setItem(MKEY,JSON.stringify(memo)) }catch(e){}
      grow(t);
    };
  });

  document.getElementById('copy').onclick=function(){
    var lines=['🎴 11월 레꾸자랑 카드 검수 — 2026-09-02'];
    document.querySelectorAll('.item').forEach(function(it){
      var id=it.dataset.id, t=it.querySelector('h2').textContent;
      lines.push('· '+t+' → '+(saved[id]||'(안 고름)'));
      if(memo[id]) lines.push('   ↳ '+memo[id]);
    });
    if(memo['__전체__']){ lines.push(''); lines.push('[통째로 하고 싶은 말]'); lines.push(memo['__전체__']) }
    var txt=lines.join('\\n'), out=document.getElementById('out');
    out.style.display='block'; out.textContent=txt;
    try{
      navigator.clipboard.writeText(txt).then(function(){
        document.getElementById('copy').textContent='복사했어요';
        setTimeout(function(){document.getElementById('copy').textContent='결과 복사하기'},1500);
      }).catch(sel);
    }catch(e){ sel() }
    function sel(){
      var r=document.createRange(); r.selectNodeContents(out);
      var s=window.getSelection(); s.removeAllRanges(); s.addRange(r);
      document.getElementById('copy').textContent='길게 눌러 복사하세요';
    }
  };
</script>`

const 낼곳 = `${SCRATCH}/11월카드-0902.html`
writeFileSync(낼곳, html)
console.log(`\n📋 검수판 = ${낼곳}`)
console.log(`   칸 ${칸들.length}개 · ${(html.length / 1024 / 1024).toFixed(2)}MB\n`)
