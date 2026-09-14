// 📅📋 **9/1 자동 공개 76컷 — 창업자 검수판 만들기**
//
// ⛔⛔ **자동 공개 전날 검수 = 절대원칙 28**(창업자 2026-08-01
//    *"자동으로 올라가기 전날에 꼭 검수하고 내보내자. **이건 절대원칙.**"*)
//    ⭐ 배포 통로가 둘인데 이쪽은 **내가 아무것도 안 해도 열린다** — 잊으면 그대로 유저 앞에 나간다.
//
// 📮 창업자 2026-08-29 = *"아 맞아 검수판부터 하자"*
//
// ⭐ **찍는 일은 `_shot-공개검수-0901.mjs` 가 한다.** 이 판은 그 결과를 «폰에서 볼 수 있게» 엮는다.
//    ⛔ 그림을 여기서 다시 만들지 않는다 — 두 곳에서 만들면 반드시 어긋난다.
//
// ☑️☑️ **절대원칙(창업자 2026-08-19) = 검수판은 «무조건» 체크 ＋ 복사가 된다.**
//    ⑴ 칸마다 고르기(좋다/다시/모르겠다) — localStorage 저장(새로고침해도 안 날아간다)
//    ⑵ 맨 아래 「복사하기」
//    ⑶ ⛔ `clipboard.writeText()` 는 성공으로 resolve 되고도 실제 복사가 안 되는 폰이 있다(v10.97 교훈)
//       → 실패하면 글자를 «골라 준다»(Range)
//
// 실행: SMOKE_CHROMIUM=… node scripts/_shot-공개검수-0901.mjs   (먼저 · 그림을 찍는다)
//       node scripts/_판-공개검수-0901.mjs                        (그다음 · 판을 엮는다)
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { gates } from './release-calendar.mjs'

const require_ = createRequire(import.meta.url)
const FF = require_('ffmpeg-static')
const SCRATCH = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const 그날 = process.env.ON || '2026-09-01'
const 방 = `${SCRATCH}/공개검수-${그날}`
if (!existsSync(방)) { console.error(`✗ ${방} 이 없다 — _shot-공개검수-0901.mjs 를 먼저 돌린다`); process.exit(1) }

// 🔢 개수는 «달력에서 직접» 센다 — ⛔손으로 적으면 반드시 낡는다(CLAUDE.md 의 「56컷」이 그렇게 낡았다)
const 문 = gates().filter((g) => g.date === 그날)
const 키전부 = new Set(문.flatMap((g) => g.keys))
const 서랍문 = 문.filter((g) => g.where.includes('서랍'))
const 카드문 = 문.filter((g) => !g.where.includes('서랍'))

// 🖼 그림은 «줄여서» 담는다 — 판이 무거우면 폰에서 안 열린다.
//    ⛔ 다만 **판정용 카드 시트는 크게** 둔다(작게 줄이면 흠이 안 보인다 · 절대원칙 13)
const 담기 = (파일, 폭) => {
  const 임시 = `/tmp/판-${Math.random().toString(36).slice(2)}.png`
  execFileSync(FF, ['-y', '-v', 'error', '-i', 파일, '-vf', `scale=${폭}:-1`, 임시])
  const b64 = readFileSync(임시).toString('base64')
  return `data:image/png;base64,${b64}`
}

const 칸들 = []
// ① 유저가 그날 «맨 처음» 보는 화면
if (existsSync(`${방}/0-첫화면-한끼소식.png`))
  칸들.push({ id: '팝업', 제목: '유저가 맨 처음 보는 화면', 설명: '9/1 에 앱을 열면 이 팝업이 먼저 뜬다', 그림: 담기(`${방}/0-첫화면-한끼소식.png`, 620) })

// ② 새로 열리는 그룹 — 앱 서랍 «실물»
for (const f of readdirSync(방).filter((f) => f.startsWith('신규-')).sort()) {
  const 이름 = f.replace(/^신규-/, '').replace(/\.png$/, '')
  const [탭, ...나머지] = 이름.split('-')
  칸들.push({ id: 이름, 제목: `${나머지.join('-')}`, 설명: `${탭} 탭 · 앱 서랍에서 실제로 보이는 모습`, 그림: 담기(join(방, f), 700) })
}

// ③ ⭐ 레꾸자랑 카드 — **서랍에 안 뜬다.** 뽑기 풀이라 이 판이 «유일한» 검수 기회다
if (existsSync(`${방}/레꾸자랑카드-16컷-원본.png`))
  칸들.push({
    id: '카드16', 제목: '레꾸자랑 카드 (뽑기 전용)', 크게: true,
    설명: '⭐ 서랍엔 «안» 뜬다 — 카드를 뽑을 때만 나온다. 그래서 여기서 봐야 한다. 체커보드는 투명 확인용.',
    그림: 담기(`${방}/레꾸자랑카드-16컷-원본.png`, 1180),
  })

const 눈에걸린것 = [
  '<b>au_b13</b> 앞치마가 <b>하트</b>다 — 나머지 15컷은 전부 <b>계란후라이</b>(꼬르곰 시그니처). 이대로 둘지 판정 필요',
]

// ⛔ 아티팩트로 올릴 것이라 `<!doctype>`·`<html>`·`<head>`·`<body>` 를 «쓰지 않는다» —
//    올릴 때 그 껍데기가 저절로 씌워진다. 내가 또 쓰면 태그가 두 겹이 된다.
const html = `<title>가을 공개 검수 ${키전부.size}컷</title>
<style>
  :root { --bg:#fdfbf7; --card:#fff; --line:#efe8dc; --text:#3d3830; --sub:#8f887b; --pt:#5878a0; }
  *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--text);
    font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;
    line-height:1.6;-webkit-text-size-adjust:100%}
  .wrap{max-width:820px;margin:0 auto;padding:18px 14px 120px}
  h1{font-size:22px;margin:6px 0 4px} .lead{color:var(--sub);font-size:14px;margin:0 0 16px}
  .sum{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin-bottom:18px}
  .sum table{width:100%;border-collapse:collapse;font-size:14px}
  .sum td{padding:3px 0} .sum td:last-child{text-align:right;font-variant-numeric:tabular-nums;font-weight:700}
  .warn{background:#fff6ec;border:1px solid #f0dcc2;border-radius:12px;padding:12px 14px;margin-bottom:18px;font-size:14px}
  .warn b{color:#b4541f}
  .item{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px;margin-bottom:16px}
  .item h2{font-size:17px;margin:0 0 2px} .item p{margin:0 0 10px;color:var(--sub);font-size:13px}
  .item img{width:100%;border-radius:10px;display:block;background:#f4f1ea}
  .pick{display:flex;gap:8px;margin-top:12px}
  .pick button{flex:1;padding:11px 6px;border-radius:11px;border:1.5px solid var(--line);
    background:#fff;color:var(--text);font-size:14px;font-family:inherit;cursor:pointer}
  .pick button[aria-pressed="true"]{background:var(--pt);border-color:var(--pt);color:#fff;font-weight:700}
  /* 📝 창업자가 적을 자리 — 「뺄 것 · 고칠 것」(창업자 2026-08-29) */
  .memo{width:100%;box-sizing:border-box;margin-top:10px;padding:10px 11px;font:inherit;font-size:14px;
    line-height:1.5;color:var(--text);background:var(--bg);border:1.5px dashed var(--line);
    border-radius:11px;resize:vertical;min-height:44px}
  .memo:focus{outline:none;border-color:var(--pt);border-style:solid}
  .memo::placeholder{color:var(--sub)}
  .allmemo{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px;margin-bottom:16px}
  .allmemo h2{font-size:16px;margin:0 0 4px}
  .allmemo p{color:var(--sub);font-size:13px;margin:0}
  .bar{position:fixed;left:0;right:0;bottom:0;background:rgba(253,251,247,.97);
    border-top:1px solid var(--line);padding:12px 14px calc(12px + env(safe-area-inset-bottom))}
  .bar .in{max-width:820px;margin:0 auto;display:flex;gap:10px;align-items:center}
  .bar b{font-variant-numeric:tabular-nums}
  .bar button{flex:1;padding:13px;border-radius:12px;border:0;background:var(--pt);color:#fff;
    font-size:15px;font-weight:700;font-family:inherit;cursor:pointer}
  #out{white-space:pre-wrap;font-size:13px;background:#fff;border:1px solid var(--line);
    border-radius:10px;padding:10px;margin-top:10px;display:none}
  /* 🌙 다크에서도 읽히게 — 색은 전부 토큰으로만 쓴다 */
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
    --bg:#17171b; --card:#202026; --line:rgba(255,255,255,.10); --text:#ecebf1; --sub:#9a97a2; --pt:#7093c0; } }
  :root[data-theme="dark"] { --bg:#17171b; --card:#202026; --line:rgba(255,255,255,.10);
    --text:#ecebf1; --sub:#9a97a2; --pt:#7093c0; }
</style>
<div class="wrap">
<h1>📅 9월 1일에 «저절로» 열리는 것</h1>
<p class="lead">내가 아무것도 안 해도 그날 열린다. 여기서 막지 않으면 그대로 유저 앞에 나간다.</p>

<div class="sum"><table>
  <tr><td>🍂 가을 꾸미기</td><td>${문.filter((g) => /가을|단풍|꽃다발|도장|메모지|강조|무늬|폴라로이드/.test(g.what)).reduce((s, g) => s + g.keys.length, 0)}컷</td></tr>
  <tr><td>🦫 <b>카롱 데뷔</b></td><td>${문.filter((g) => g.what.includes('카롱')).reduce((s, g) => s + g.keys.length, 0)}컷</td></tr>
  <tr><td>🐻🐧 꼬르곰·펭펭의 가을</td><td>${문.filter((g) => g.what.includes('꼬르곰')).reduce((s, g) => s + g.keys.length, 0)}컷</td></tr>
  <tr><td>🎴 레꾸자랑 카드(뽑기)</td><td>${카드문.reduce((s, g) => s + g.keys.length, 0)}컷</td></tr>
  <tr><td style="border-top:1px solid var(--line);padding-top:8px">합계(중복 뺀 것)</td>
      <td style="border-top:1px solid var(--line);padding-top:8px">${키전부.size}컷</td></tr>
</table></div>

<div class="warn"><b>눈에 걸린 것</b><br>${눈에걸린것.join('<br>')}</div>

${칸들.map((c) => `<div class="item" data-id="${c.id}">
  <h2>${c.제목}</h2><p>${c.설명}</p>
  <img src="${c.그림}" alt="${c.제목}">
  <div class="pick">
    <button data-v="좋다">좋다</button>
    <button data-v="다시">다시 뽑자</button>
    <button data-v="모름">모르겠다</button>
  </div>
  <textarea class="memo" data-id="${c.id}" rows="1"
    placeholder="뺄 것 · 고칠 것을 적어주세요 (안 적어도 돼요)"></textarea>
  </div>`).join('\n')}

<div class="allmemo">
  <h2>📝 통째로 하고 싶은 말</h2>
  <p>칸마다 적기 애매한 것 · 전체에 걸친 것</p>
  <textarea class="memo" data-id="__전체__" rows="3"
    placeholder="예) 가을 컷은 다 좋은데 카롱은 한 주 미루자"></textarea>
</div>

<div id="out"></div>
</div>
<div class="bar"><div class="in">
  <span>고른 것 <b id="cnt">0</b>/${칸들.length}</span>
  <button id="copy">결과 복사하기</button>
</div></div>
<script>
  var KEY='hankki-검수-${그날}';
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

  // 📝 메모 — 고르기와 «따로» 저장한다(판정 없이 메모만 적을 수도 있어야 한다)
  var MKEY='hankki-검수메모-${그날}';
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
    var lines=['9/1 공개 검수 결과 (${키전부.size}컷)'];
    document.querySelectorAll('.item').forEach(function(it){
      var id=it.dataset.id, t=it.querySelector('h2').textContent;
      lines.push('· '+t+' → '+(saved[id]||'(안 고름)'));
      if(memo[id]) lines.push('   ↳ '+memo[id]);
    });
    if(memo['__전체__']){ lines.push(''); lines.push('[통째로 하고 싶은 말]'); lines.push(memo['__전체__']) }
    var txt=lines.join('\\n'), out=document.getElementById('out');
    out.style.display='block'; out.textContent=txt;
    // ⛔ writeText 는 «성공으로 resolve 되고도» 복사가 안 되는 폰이 있다 → 실패하면 글자를 골라 준다
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

const 낼곳 = `${SCRATCH}/공개검수-${그날}.html`
writeFileSync(낼곳, html)
console.log(`\n📋 검수판 = ${낼곳}`)
console.log(`   ${키전부.size}컷 · 칸 ${칸들.length}개 · ${(html.length / 1024 / 1024).toFixed(2)}MB`)
console.log(`   서랍 ${서랍문.reduce((s, g) => s + g.keys.length, 0)}컷 · 레꾸자랑 카드 ${카드문.reduce((s, g) => s + g.keys.length, 0)}컷\n`)
