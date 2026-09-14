// 📋📱 **스토어 출시 노트 — 폰에서 «한 번 눌러» 복사하는 판** (2026-09-03)
//
// 📮 창업자 = *"창업자가 할 것 = Play Console 출시 노트에서 그 한 줄만 갈아끼우기.- **올려줘**"*
//    ⛔ **콘솔은 내가 못 연다** — 이 환경엔 웹 페이지를 여는 통로가 아예 없다(규칙 15).
//    ✅ 그래서 «내가 할 수 있는 것»을 한다 = **폰에서 한 번 눌러 복사**되게 만들어 준다.
//       창업자는 붙여넣기만 하면 된다(규칙 8 — 손으로 옮겨 적게 하지 않는다).
//
// ⭐⭐ **글을 여기서 «지어내지» 않는다 — 저장소 문서에서 읽어온다.**
//    이번 사고의 뿌리가 정확히 그것이었다: 콘솔에 바로 쓴 글이라 저장소에 없었고,
//    그래서 게이트가 한 줄도 못 봤고 **거짓이 나간 뒤에야** 창업자가 폰에서 읽고 잡았다.
//    → 이제 «저장소가 원본»이고 판은 그걸 비출 뿐이다. 글을 고치려면 문서를 고친다.
//
// ✅ 검수판 절대원칙(창업자 2026-08-19) = **복사**가 된다.
//    ⛔ `clipboard.writeText` 는 «성공으로 resolve 되고도» 실패한다(v10.97) → 글을 화면에도 띄운다.
//
// 쓰기:  node scripts/_판-출시노트복사-0903.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const 원본 = new URL('../docs/출시노트-스토어현행-2026-09-03.md', import.meta.url)
const 글 = readFileSync(원본, 'utf8')

// 문서의 «붙여넣을 글» 덩이 = 첫 번째 ``` 블록
const m = 글.match(/```\n([\s\S]*?)\n```/)
if (!m) { console.error('⛔ 문서에서 붙여넣을 글 덩이를 못 찾았다 — 문서가 바뀌었나 본다'); process.exit(1) }
const 노트 = m[1]
const 글자수 = [...노트].length
if (글자수 > 500) { console.error(`⛔ ${글자수}자 — Play 상한 500자를 넘는다. 저장하지 않는다`); process.exit(1) }

// 고칠 한 줄이 «진짜로» 고쳐진 판인가 (규칙 12 — 옛 값이면 죽는다)
if (/실제 요리 사진/.test(노트)) { console.error('⛔ 아직 「실제 요리 사진」이 남아 있다 — 옛 글이다'); process.exit(1) }
if (!/실제 요리처럼 새로 그려/.test(노트)) { console.error('⛔ 고친 문장이 안 보인다'); process.exit(1) }

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const HTML = `<title>출시 노트 고칠 것</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  /* 🎨 한끼 판 «집 스타일» 그대로 — 창업자가 여러 판에서 봐 온 색·글자다 */
  :root{--paper:#FAF6EF;--card:#fff;--ink:#2E1C0C;--dim:#7A6852;--faint:#9C8B76;--line:#E7DCCB;--brand:#5D3410;--bg2:#F3E7D8;--ok:#1E7A5A;--okbg:#E9F4EF;--warn:#B4472F;--warnbg:#FBEAE5}
  @media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--paper:#191410;--card:#221B15;--ink:#F2E9DC;--dim:#B6A692;--faint:#8D7E6C;--line:#3A2F26;--brand:#E8C9A4;--bg2:#31261D;--ok:#6FD3AB;--okbg:#1B2E26;--warn:#F09A82;--warnbg:#3A211B}}
  :root[data-theme="dark"]{--paper:#191410;--card:#221B15;--ink:#F2E9DC;--dim:#B6A692;--faint:#8D7E6C;--line:#3A2F26;--brand:#E8C9A4;--bg2:#31261D;--ok:#6FD3AB;--okbg:#1B2E26;--warn:#F09A82;--warnbg:#3A211B}
  *{box-sizing:border-box}
  body{margin:0;padding:0 14px 110px;background:var(--paper);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",system-ui,sans-serif;line-height:1.6;word-break:keep-all;-webkit-text-size-adjust:100%}
  .wrap{max-width:660px;margin:0 auto}
  header.top{padding:24px 0 6px}
  .kicker{margin:0;font-size:12.5px;font-weight:800;letter-spacing:.08em;color:var(--brand)}
  h1{margin:6px 0 8px;font-size:24px;line-height:1.3;letter-spacing:-.02em;text-wrap:balance}
  .lead{margin:0;font-size:14.5px;color:var(--dim)}
  h2{margin:26px 0 8px;font-size:16px;letter-spacing:-.01em}
  .diff{display:grid;gap:9px;margin:0 0 4px}
  .row{padding:12px 14px;border-radius:12px;font-size:14.5px;line-height:1.65}
  .row em{display:block;font-style:normal;font-size:11.5px;font-weight:800;letter-spacing:.06em;margin:0 0 4px}
  .bad{background:var(--warnbg);border:1px solid var(--warn)}
  .bad em{color:var(--warn)}
  .good{background:var(--okbg);border:1px solid var(--ok)}
  .good em{color:var(--ok)}
  .row b{font-weight:800}
  .why{margin:14px 0 0;padding:13px 15px;background:var(--bg2);border-radius:13px;font-size:13.5px;line-height:1.75}
  .why b{color:var(--brand)}
  .note{margin:10px 0 0;padding:14px 15px;background:var(--card);border:1px solid var(--line);border-radius:13px;
        font-size:14px;line-height:1.75;white-space:pre-wrap}
  .cnt{margin:7px 0 0;font-size:12.5px;color:var(--faint);font-variant-numeric:tabular-nums}
  ol.how{margin:8px 0 0;padding:0 0 0 20px;font-size:14.5px}
  ol.how li{margin:0 0 7px}
  ol.how li::marker{color:var(--brand);font-weight:800}
  .warn{margin:12px 0 0;font-size:13px;color:var(--warn);line-height:1.7}
  .bar{position:fixed;left:0;right:0;bottom:0;padding:11px 14px calc(11px + env(safe-area-inset-bottom));background:var(--card);border-top:1px solid var(--line)}
  .bar .in{max-width:660px;margin:0 auto;display:flex;gap:9px;align-items:center}
  .bar .t{flex:1;font-size:13.5px;color:var(--dim)}
  .bar button{font:inherit;font-size:15px;font-weight:800;padding:12px 18px;border:0;border-radius:11px;background:var(--brand);color:var(--paper);cursor:pointer}
  .bar button:active{opacity:.85}
  #fb{position:fixed;left:14px;right:14px;bottom:78px;max-width:632px;margin:0 auto;padding:11px 14px;border-radius:11px;background:var(--ok);color:var(--paper);font-size:14px;text-align:center;opacity:0;transition:opacity .2s;pointer-events:none}
  #fb.on{opacity:1}
  #out{position:fixed;left:-9999px;top:0;width:10px;height:10px}
  @media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
<div class="wrap">
<header class="top">
  <p class="kicker">스토어 새로운 기능 · 2026-09-03</p>
  <h1>한 줄만 갈아끼우면 돼</h1>
  <p class="lead">창업자가 잡은 그 줄이야 — 그건 사진이 아니라 <b>그림</b>이니까.</p>
</header>

<div class="diff">
  <div class="row bad"><em>지금 나가 있는 것</em>· 음식 그림을 <b>실제 요리 사진</b>으로 갈아끼웠어요</div>
  <div class="row good"><em>이걸로 바꾼다</em>· 음식 그림을 <b>실제 요리처럼 새로 그려</b> 갈아끼웠어요</div>
</div>

<div class="why">
  <b>왜</b> — 마스터프롬프트에 「음식은 실제 음식 <b>사진처럼</b> 사실적이고」라고 적혀 있어.
  <b>「사진처럼 그려라」는 주문</b>이었지 사진이 아니야.<br>
  ⭐ 우리가 원래 쓰던 말은 맞았어 — AAB18 노트 = 「<b>새로 그린 것으로</b>… 실제 요리처럼 <b>보이고</b>」.
  <b>「보인다」와 「이다」</b> 사이 한 칸이 콘솔에 옮겨 적히면서 무너진 거야.
</div>

<h2>붙여넣을 글 (전체)</h2>
<div class="note" id="note">${esc(노트)}</div>
<p class="cnt">${글자수}자 / 500자 — 나머지 여덟 줄은 전수로 다시 재서 <b>전부 사실</b>이었어</p>

<h2>어디서 바꾸나</h2>
<ol class="how">
  <li>Play Console → <b>출시 → 프로덕션</b></li>
  <li>지금 나가 있는 버전을 열고 <b>［수정］</b> (버전 수정 / Edit release)</li>
  <li><b>출시 노트</b> 칸에서 <code>&lt;ko-KR&gt;</code> 안쪽 글을 통째로 지우고 위 글을 붙여넣기</li>
  <li>저장 → 검토 후 게시</li>
</ol>
<p class="warn">⚠️ 메뉴 이름은 구글이 자주 바꿔 — <b>화면에 보이는 글자</b>로 찾아줘. 위 순서와 다르면 그 화면을 캡처해서 보내주면 내가 다시 맞출게.<br>
⛔ <code>&lt;ko-KR&gt;</code> 태그는 지우지 말 것 — 그 <b>안쪽</b>만 갈아끼워.</p>
</div>

<div id="fb" role="status" aria-live="polite"></div>
<div class="bar"><div class="in">
  <div class="t">눌러서 복사 → 콘솔에 붙여넣기</div>
  <button id="copy" type="button">전체 복사</button>
</div></div>
<textarea id="out" readonly aria-hidden="true" tabindex="-1"></textarea>

<script>
(function(){
  var fb = document.getElementById('fb')
  function 말하기(s){ fb.textContent = s; fb.classList.add('on'); setTimeout(function(){ fb.classList.remove('on') }, 2400) }

  document.getElementById('copy').addEventListener('click', function(){
    var text = document.getElementById('note').textContent

    /* 복사 실패 폴백 — clipboard.writeText 는 «성공으로 resolve 되고도» 실패한다(v10.97 사고).
       그때는 글을 화면에 띄워 길게 눌러 복사하게 한다. */
    var out = document.getElementById('out')
    out.value = text
    function 폴백(){
      out.style.left = '14px'; out.style.top = '12%'; out.style.width = 'calc(100% - 28px)'; out.style.height = '46vh'
      out.removeAttribute('aria-hidden'); out.removeAttribute('readonly'); out.focus(); out.select()
      try { document.execCommand('copy'); 말하기('복사했어 · 안 되면 화면의 글을 길게 눌러 복사해') }
      catch(e){ 말하기('길게 눌러서 복사해줘') }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function(){ 말하기('복사했어 · 콘솔 출시 노트에 붙여넣기') }, 폴백)
    } else 폴백()
  })
})()
</script>`

const 낼곳 = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/출시노트고침-0903.html'
writeFileSync(낼곳, HTML)
console.log(`✅ 출시 노트 복사판 — ${글자수}자 / 500`)
console.log(`   원본 = docs/출시노트-스토어현행-2026-09-03.md (글은 여기서 읽어온다)`)
console.log(`💾 ${낼곳}`)
