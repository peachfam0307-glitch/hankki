// 🍚📋 **「우리집레시피 요리 33편」 검수판** — 바로 낼 수 있는 것부터 (2026-09-03)
//
// 📮 창업자 = *"양념장들말고 요리는 없어? 우리집레시피에 나갈 요리들 되게 많지않아??"*
//    → 세어 보니 **요리 161편 · 그중 아직 안 나간 것 93편**. 창업자 말이 맞았다.
// 📮 그리고 = *"내가 내일 검수판으로 보면서 찾을까.. 노가다로라도.."* → ⛔규칙 8. 판은 내가 만든다.
// 📮 판 크기 = *"33판"* (한 판에 33편 · 쪼개지 않는다)
//
// ⭐ 왜 이 33편인가 = **재료도 있고 만드는 법도 3걸음 이상 있는 것**만 골랐다.
//    창업자가 «읽고 판정만» 하면 그대로 앱에 넣을 수 있는 편이다. 나머지 60편(🅱40·🅲20)은 다음 판.
//
// ⛔⛔ **판정 규칙은 내가 다시 짜지 않는다** — `_갈래-요리와양념-0902.mjs` 한 곳에서 부른다.
//    각자 판정하면 「판은 33편인데 세기는 34편」이 되고, 창업자가 «없는 문제»를 짚느라 시간을 쓴다.
//
// ⛔⛔ **레시피 «내용»은 저장소에 안 남는다** — 이 저장소는 공개(public)다.
//    백업은 scratchpad 에서 읽고, 만든 HTML 도 scratchpad 에만 쓴다. 여기 남는 건 «만드는 법»뿐이다.
//
// ✅ 검수판 절대원칙(창업자 2026-08-19) = **체크 ＋ 복사**. 게이트 둘이 이걸 강제한다
//    (`check-panmemo.mjs` 기억하나 · `check-pancopy.mjs` 복사되나).
//    ⛔ `clipboard.writeText` 는 «성공으로 resolve 되고도» 실패한다(v10.97) → 글을 화면에도 띄운다.
//
// 쓰기:  node scripts/_판-요리33-0903.mjs <백업.json>
import { readFileSync, writeFileSync } from 'node:fs'
import { 재료줄, 줄, 재료수, 걸음수, 갈래, 상태, 앱에든것, 내가넣은편 } from './_갈래-요리와양념-0902.mjs'

const 백업 = process.argv[2]
if (!백업) { console.error('⛔ 백업 파일 경로를 준다'); process.exit(1) }
const 낼곳 = process.argv[3]
  || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/요리33-0903.html'

const 앱에 = 앱에든것(new URL('../src/data/basics.js', import.meta.url))
const d = JSON.parse(readFileSync(백업, 'utf8'))

const 고른것 = 내가넣은편(d)
  .filter((r) => 갈래(r) === '요리')
  .filter((r) => !앱에.has((r.title || '').trim()))
  .filter((r) => 상태(r) === '🅰')
  .sort((a, b) => 걸음수(b) - 걸음수(a) || 재료수(b) - 재료수(a))

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// ⚠️ **한 문장이 두 걸음으로 쪼개진 자리** — 옛 파서가 남긴 흔적이다
//    (「물에 담가 1시간」 ＋ 「동안 불려줘요」 · 「…진간장」 ＋ 「2숟갈, 맛술…」)
//    ⭐ 창업자가 «읽다가 걸리기 전에» 표시해 준다 — 판정할 때 같이 고치면 된다.
//    ⛔⛔ **잣대를 느슨하게 잡지 않는다.** 첫 판은 「끝맺음이 없으면 쪼개진 것」으로 봐서 **24곳**이 걸렸는데,
//       그 대부분이 창업자의 «짧게 끊어 쓰는 말투»였다(「배추 손질하고」·「…썰어두고,」).
//       두 번째 판(다음 걸음이 숫자로 시작)도 「2시간 뒤에,」·「15분 정도」 같은 «멀쩡한 문장»을 잡았다.
//       📌 시끄러운 표시는 아무도 안 본다 — 게이트와 같은 원리다.
//    ✅ 지금 잣대 = ⑴다음이 «문장을 시작할 수 없는 말»(동안·만큼·씩)로 시작하거나
//                  ⑵앞이 끝맺음 없이 끊겼는데 다음이 «수량»으로 시작한다(목록이 잘린 것)
const 쪼개짐 = (걸, i) => {
  const 이 = String(걸[i] || '').trim(), 다 = String(걸[i + 1] || '').trim()
  if (!다) return false
  if (/^(동안|만큼|씩)/.test(다)) return true
  return !/([.!?…,]|[요다죠자])$/.test(이) && /^\d+\s*(숟갈|큰술|작은술|컵|g|ml|개|장)/.test(다)
}

// 남은 것도 숫자로 알려준다 — 「이게 전부인가」를 창업자가 안 물어도 되게
const 남은요리 = 내가넣은편(d).filter((r) => 갈래(r) === '요리' && !앱에.has((r.title || '').trim()))
const 남은 = { B: 0, C: 0 }
for (const r of 남은요리) { const s = 상태(r); if (s === '🅱') 남은.B += 1; else if (s === '🅲') 남은.C += 1 }

const 카드 = (r, i) => {
  const 제목 = (r.title || '(제목 없음)').trim()
  const 재 = 재료줄(r)
  const 걸 = 줄(r.steps)
  const 메모 = String(r.memo || r.note || '').trim()
  const 곁 = [r.time ? `${esc(String(r.time))}분` : '', r.serves ? `${esc(String(r.serves))}인분` : '']
    .filter(Boolean).join(' · ')
  return `
    <article class="card" data-k="${esc(제목)}">
      <header>
        <span class="no">${i + 1}</span>
        <h3>${esc(제목)}</h3>
      </header>
      <p class="meta">재료 <b>${재.length}</b> · 만드는 법 <b>${걸.length}</b>걸음${곁 ? ` · ${곁}` : ''}</p>

      <div class="two">
        <section>
          <h4>재료</h4>
          <ul class="ing">${재.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        </section>
        <section>
          <h4>만드는 법</h4>
          <ol class="step">${걸.map((x, j) => `<li${쪼개짐(걸, j) ? ' class="cut"' : ''}>${esc(x)}${쪼개짐(걸, j) ? '<em>⚠️ 다음 걸음이랑 한 문장인 것 같아 — 합칠까?</em>' : ''}</li>`).join('')}</ol>
        </section>
      </div>
      ${메모 ? `<details class="memo"><summary>내가 적어둔 메모</summary><p>${esc(메모).replace(/\n/g, '<br>')}</p></details>` : ''}

      <div class="pick">
        <label><input type="radio" name="p${i}" value="좋다" data-k="${esc(제목)}"><span>이대로 좋다</span></label>
        <label><input type="radio" name="p${i}" value="고칠것" data-k="${esc(제목)}"><span>고칠 게 있다</span></label>
        <label><input type="radio" name="p${i}" value="나중에" data-k="${esc(제목)}"><span>나중에</span></label>
      </div>
      <label class="say">
        <span>고칠 게 있으면 여기 — 어디가 어떻게</span>
        <textarea class="note" data-k="${esc(제목)}" rows="2" placeholder="예) 간장 2큰술 말고 1.5큰술"></textarea>
      </label>
    </article>`
}

const HTML = `<title>우리집레시피 요리 33편</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  /* 🎨 한끼 검수판 «집 스타일» 그대로 — 창업자가 여러 판에서 봐 온 색·글자다.
        ⛔ 판마다 다른 얼굴이면 「이게 그 판인가」를 매번 다시 익혀야 한다. */
  :root{--paper:#FAF6EF;--card:#fff;--ink:#2E1C0C;--dim:#7A6852;--faint:#9C8B76;--line:#E7DCCB;--brand:#5D3410;--bg2:#F3E7D8;--ok:#1E7A5A;--okbg:#E9F4EF;--warn:#B4472F;--warnbg:#FBEAE5;--hold:#8A6D3B;--holdbg:#F6EFE0}
  @media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--paper:#191410;--card:#221B15;--ink:#F2E9DC;--dim:#B6A692;--faint:#8D7E6C;--line:#3A2F26;--brand:#E8C9A4;--bg2:#31261D;--ok:#6FD3AB;--okbg:#1B2E26;--warn:#F09A82;--warnbg:#3A211B;--hold:#D8BC8A;--holdbg:#2C2419}}
  :root[data-theme="dark"]{--paper:#191410;--card:#221B15;--ink:#F2E9DC;--dim:#B6A692;--faint:#8D7E6C;--line:#3A2F26;--brand:#E8C9A4;--bg2:#31261D;--ok:#6FD3AB;--okbg:#1B2E26;--warn:#F09A82;--warnbg:#3A211B;--hold:#D8BC8A;--holdbg:#2C2419}
  *{box-sizing:border-box}
  body{margin:0;padding:0 14px 124px;background:var(--paper);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",system-ui,sans-serif;line-height:1.6;-webkit-text-size-adjust:100%;word-break:keep-all}
  .wrap{max-width:660px;margin:0 auto}
  header.top{padding:24px 0 6px}
  .kicker{margin:0;font-size:12.5px;font-weight:800;letter-spacing:.08em;color:var(--brand)}
  h1{margin:6px 0 8px;font-size:24px;line-height:1.3;letter-spacing:-.02em;text-wrap:balance}
  .lead{margin:0;font-size:14.5px;color:var(--dim)}
  .lead b{color:var(--ink)}
  .how{margin:14px 0 0;padding:13px 15px;background:var(--bg2);border-radius:13px;font-size:14px;line-height:1.7}
  .how b{color:var(--brand)}
  .rest{margin:10px 0 0;font-size:13px;color:var(--faint);line-height:1.7}
  .card{margin:14px 0 0;padding:15px;background:var(--card);border:1px solid var(--line);border-radius:14px}
  .card.ok{border-color:var(--ok);background:var(--okbg)}
  .card.fix{border-color:var(--warn);background:var(--warnbg)}
  .card.hold{border-color:var(--hold);background:var(--holdbg)}
  .card header{display:flex;align-items:baseline;gap:9px;margin:0 0 3px}
  .no{flex:none;font-size:12px;font-weight:800;color:var(--faint);font-variant-numeric:tabular-nums;min-width:20px}
  .card h3{margin:0;font-size:18px;letter-spacing:-.01em;line-height:1.35}
  .meta{margin:0 0 11px 29px;font-size:12.5px;color:var(--faint);font-variant-numeric:tabular-nums}
  .meta b{color:var(--dim)}
  .two{display:grid;gap:14px}
  @media (min-width:560px){.two{grid-template-columns:minmax(0,1fr) minmax(0,1.35fr);gap:18px}}
  .two h4{margin:0 0 5px;font-size:11.5px;font-weight:800;letter-spacing:.07em;color:var(--brand);text-transform:none}
  .ing{margin:0;padding:0;list-style:none;font-size:14px;color:var(--dim)}
  .ing li{padding:2px 0;border-bottom:1px dashed var(--line)}
  .ing li:last-child{border-bottom:0}
  .step{margin:0;padding:0 0 0 20px;font-size:14.5px}
  .step li{margin:0 0 6px;padding-left:2px}
  .step li::marker{color:var(--brand);font-weight:800;font-size:13px}
  .step li.cut{background:var(--warnbg);border-radius:8px;padding:4px 8px;margin-left:-8px}
  .step li.cut em{display:block;margin:2px 0 0;font-style:normal;font-size:12px;color:var(--warn);font-weight:700}
  .memo{margin:12px 0 0;font-size:13.5px;color:var(--dim)}
  .memo summary{cursor:pointer;color:var(--faint);font-size:12.5px}
  .memo p{margin:6px 0 0;padding:10px 12px;background:var(--bg2);border-radius:10px;line-height:1.7}
  .pick{display:flex;flex-wrap:wrap;gap:7px;margin:13px 0 0}
  .pick label{display:flex;align-items:center;gap:5px;padding:7px 11px;border:1px solid var(--line);border-radius:99px;background:var(--paper);font-size:13.5px;color:var(--dim);cursor:pointer;-webkit-tap-highlight-color:transparent}
  .pick input{width:16px;height:16px;accent-color:var(--brand);margin:0}
  .pick input:focus-visible{outline:2px solid var(--brand);outline-offset:2px}
  .pick label:has(input:checked){border-color:var(--brand);color:var(--ink);font-weight:700}
  .say{display:block;margin:11px 0 0}
  .say span{display:block;font-size:12px;color:var(--faint);margin:0 0 4px}
  .say textarea{width:100%;font:inherit;font-size:14px;color:var(--ink);background:var(--paper);border:1px solid var(--line);border-radius:9px;padding:8px 10px;resize:vertical}
  .bar{position:fixed;left:0;right:0;bottom:0;padding:11px 14px calc(11px + env(safe-area-inset-bottom));background:var(--card);border-top:1px solid var(--line)}
  .bar .in{max-width:660px;margin:0 auto;display:flex;gap:9px;align-items:center}
  .count{flex:1;font-size:13.5px;color:var(--dim);font-variant-numeric:tabular-nums}
  .count b{color:var(--brand)}
  .bar button{font:inherit;font-size:15px;font-weight:800;padding:12px 16px;border:0;border-radius:11px;background:var(--brand);color:var(--paper);cursor:pointer}
  .bar button:active{opacity:.85}
  #fb{position:fixed;left:14px;right:14px;bottom:78px;max-width:632px;margin:0 auto;padding:11px 14px;border-radius:11px;background:var(--ok);color:var(--paper);font-size:14px;text-align:center;opacity:0;transition:opacity .2s;pointer-events:none}
  #fb.on{opacity:1}
  #out{position:fixed;left:-9999px;top:0;width:10px;height:10px}
  @media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
<div class="wrap">
<header class="top">
  <p class="kicker">우리집레시피 · 2026-09-03</p>
  <h1>바로 낼 수 있는 요리 ${고른것.length}편</h1>
  <p class="lead">네가 쓴 <b>요리 161편</b> 중 아직 안 나간 게 <b>93편</b>이야.<br>그중 <b>재료도 만드는 법도 다 있는 것</b>만 골랐어.</p>
</header>

<div class="how">
  <b>하면 되는 것</b><br>
  읽고 <b>［이대로 좋다］</b>만 누르면 돼. 고칠 게 있으면 <b>아래 칸에 적어</b>줘.<br>
  중간에 멈춰도 돼 — <b>고른 건 저장돼</b>. 다 보면 맨 아래 <b>［결과 복사］</b> 눌러서 나한테 보내줘.
</div>
<p class="rest">여기 없는 나머지 60편은 아직 못 낸다 — 순서가 1~2걸음뿐인 게 ${남은.B}편, 재료만 있는 게 ${남은.C}편이야. 그건 내가 채워서 다음 판으로 낼게.</p>

${고른것.map(카드).join('')}
</div>

<div id="fb" role="status" aria-live="polite"></div>
<div class="bar"><div class="in">
  <div class="count" id="cnt"></div>
  <button id="copy" type="button">결과 복사</button>
</div></div>
<textarea id="out" readonly aria-hidden="true" tabindex="-1"></textarea>

<script>
(function(){
  var KEY = 'hankki-요리33-0903'
  var picks = [].slice.call(document.querySelectorAll('.pick input'))
  var notes = [].slice.call(document.querySelectorAll('.note'))
  var cards = [].slice.call(document.querySelectorAll('.card'))
  var cnt = document.getElementById('cnt')
  var fb = document.getElementById('fb')

  /* 새로고침해도 남게 — 창업자는 폰에서 나눠 본다. 스크롤하다 전화가 오면 처음부터 다시 고르게 된다.
     ⛔ 이게 없어서 두 번 삽질했다(2026-08-18 창업자 지적 · 그래서 게이트가 생겼다) */
  function 읽기(){ try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch(e){ return {} } }
  function 쓰기(o){ try { localStorage.setItem(KEY, JSON.stringify(o)) } catch(e){} }

  var 저장 = 읽기()
  picks.forEach(function(b){
    if (저장['p:'+b.dataset.k] === b.value) b.checked = true
    b.addEventListener('change', function(){
      var o = 읽기(); o['p:'+b.dataset.k] = b.value; 쓰기(o); 칠하기(); 세기()
    })
  })
  notes.forEach(function(t){
    if (저장['n:'+t.dataset.k]) t.value = 저장['n:'+t.dataset.k]
    t.addEventListener('input', function(){
      var o = 읽기(); o['n:'+t.dataset.k] = t.value; 쓰기(o); 세기()
    })
  })

  function 칠하기(){
    var o = 읽기()
    cards.forEach(function(c){
      var v = o['p:'+c.dataset.k]
      c.classList.toggle('ok', v === '좋다')
      c.classList.toggle('fix', v === '고칠것')
      c.classList.toggle('hold', v === '나중에')
    })
  }
  function 세기(){
    var o = 읽기()
    var n = cards.filter(function(c){ return o['p:'+c.dataset.k] }).length
    var m = notes.filter(function(t){ return t.value.trim() }).length
    cnt.innerHTML = '판정 <b>' + n + '</b> / ' + cards.length + (m ? ' · 적은 것 <b>' + m + '</b>' : '')
  }
  칠하기(); 세기()

  function 말하기(s){ fb.textContent = s; fb.classList.add('on'); setTimeout(function(){ fb.classList.remove('on') }, 2400) }

  document.getElementById('copy').addEventListener('click', function(){
    var o = 읽기()
    var 줄 = ['[우리집레시피 요리 ' + cards.length + '편 — 검수 결과]', '']
    var 표 = { '좋다':'✅ 이대로', '고칠것':'✏️ 고칠 것', '나중에':'⏸ 나중에' }
    cards.forEach(function(c){
      var k = c.dataset.k
      var v = o['p:'+k]
      var t = c.querySelector('.note')
      var m = t ? t.value.trim() : ''
      줄.push((v ? 표[v] : '⬜ 아직') + '  ' + k + (m ? '  → ' + m : ''))
    })
    var text = 줄.join('\\n')

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
      navigator.clipboard.writeText(text).then(function(){ 말하기('결과를 복사했어 · 클로드한테 붙여넣기') }, 폴백)
    } else 폴백()
  })
})()
</script>`

writeFileSync(낼곳, HTML)
console.log(`✅ 요리 검수판 — ${고른것.length}편`)
console.log(`   (아직 안 나간 요리 ${남은요리.length}편 중 🅰${고른것.length} · 🅱${남은.B} · 🅲${남은.C})`)
console.log(`💾 ${낼곳}`)
