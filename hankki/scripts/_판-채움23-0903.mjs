// 📋✍️ **검수판 — 「내가 채운 23편」** (2026-09-03)
//
// 📮 창업자 = *"악.. 오늘은 레시피데이구나... **b40편 채우기 시작해**"*
//
// ⭐⭐ **채운 목록을 여기서 «다시 적지 않는다»** — `_채움1`·`_채움2` 에서 그대로 불러온다.
//    ⛔ 판이 목록을 베껴 적으면 둘이 갈리고, **현행이 둘이면 하나는 반드시 틀린 값이 된다**(2026-08-13).
//    📌 그래서 저 둘은 «인자 없이 불러오면 굴리지 않게» 고쳤다.
//
// ⭐ 「밑감이 0이라 못 채운 편」도 손으로 적지 않는다 — **백업을 재서** 뽑는다(절대원칙 30의 결).
//
// ✅ 검수판 절대원칙(창업자 2026-08-19) = **체크 ＋ 복사**가 된다.
//    ⛔ `clipboard.writeText` 는 «성공으로 resolve 되고도» 실패한다(v10.97) → Range 폴백을 둔다.
//
// 쓰기:  node scripts/_판-채움23-0903.mjs <채운백업.json> [낼곳.html]
import { readFileSync, writeFileSync } from 'node:fs'
import { 갈래, 상태, 재료수, 걸음수, 앱에든것 } from './_갈래-요리와양념-0902.mjs'
import { 채움 as 채움1, 안채움 } from './_채움1-걸음과재료-0903.mjs'
import { 채움 as 채움2 } from './_채움2-메모가른것-0903.mjs'

const 백업경로 = process.argv[2]
if (!백업경로) { console.error('⛔ 채운 백업 경로를 준다'); process.exit(1) }
const 낼곳 = process.argv[3] || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/채움23-0903.html'

const d = JSON.parse(readFileSync(백업경로, 'utf8'))
const 찾기 = (t) => d.recipes.find((r) => (r.title || '').trim() === t)

// ── 채운 것을 «백업 실물»과 맞춰 본다 (판이 옛 값을 그리지 않게 · 규칙 12) ──
const 전부 = [...채움1.map((c) => ({ ...c, 차: 1 })), ...채움2.map((c) => ({ ...c, 차: 2, 근거: c.근거 || '' }))]
const 어긋남 = []
for (const c of 전부) {
  const r = 찾기(c.편)
  if (!r) { 어긋남.push(`${c.편} — 백업에 없다`); continue }
  if (JSON.stringify(r.steps) !== JSON.stringify(c.걸음)) 어긋남.push(`${c.편} — 걸음이 백업과 다르다(백업에 안 넣은 판인가)`)
}
if (어긋남.length) {
  console.error('⛔ 판을 그리지 않는다 — 백업과 안 맞는다:')
  for (const x of 어긋남) console.error('   · ' + x)
  process.exit(1)
}

// ── 아직 «밑감이 없어» 못 채운 편 — 백업을 재서 뽑는다 ────────────
const 나간것 = 앱에든것(new URL('../src/data/basics.js', import.meta.url).pathname)
const 채운제목 = new Set(전부.map((c) => c.편))
const 안채움제목 = new Set(안채움.map((x) => x.편))
const 못채운 = d.recipes
  .filter((r) => !String(r.id || '').startsWith('basic-'))
  .filter((r) => 갈래(r) === '요리' && 상태(r) === '🅱' && !나간것.has((r.title || '').trim()))
  .filter((r) => !채운제목.has((r.title || '').trim()) && !안채움제목.has((r.title || '').trim()))
  .map((r) => ({
    편: (r.title || '').trim(), 재: 재료수(r), 걸: 걸음수(r),
    밑감: (String(r.memo || '') + String(r.rawText || '')).replace(/^내가 적어둔 그대로\n?/, '').trim().length,
  }))
  .sort((a, b) => b.밑감 - a.밑감 || b.재 - a.재)

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const 셋택 = (k) => `
  <div class="pick" role="radiogroup" aria-label="${esc(k)} 판정">
    <label><input type="radio" name="p-${esc(k)}" value="좋다" data-k="${esc(k)}">✅ 이대로</label>
    <label><input type="radio" name="p-${esc(k)}" value="고칠것" data-k="${esc(k)}">✏️ 고칠 것</label>
    <label><input type="radio" name="p-${esc(k)}" value="나중에" data-k="${esc(k)}">⏸ 나중에</label>
  </div>
  <label class="say"><span>고칠 것·답이 있으면 여기에</span>
    <textarea class="note" data-k="${esc(k)}" rows="2" placeholder="예) 설탕 2/3는 큰술 맞아"></textarea></label>`

const 카드 = (c, i) => `
<section class="card" data-k="${esc(c.편)}">
  <header><span class="no">${String(i + 1).padStart(2, '0')}</span><h3>${esc(c.편)}</h3></header>
  <p class="meta">재료 <b>${c.재료.filter((x) => !x.startsWith('[')).length}줄</b> · 만드는 법 <b>${c.걸음.length}걸음</b> · ${c.차}차</p>
  ${c.근거 ? `<details class="memo"><summary>내가 왜 이렇게 채웠나</summary><p>${esc(c.근거)}</p></details>` : ''}
  <div class="two">
    <div><h4>재료</h4><ul class="ing">${c.재료.map((x) => (x.startsWith('[') ? `<li class="grp">${esc(x)}</li>` : `<li>${esc(x)}</li>`)).join('')}</ul></div>
    <div><h4>만드는 법</h4><ol class="step">${c.걸음.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></div>
  </div>
  ${c.확인.length ? `<div class="ask"><h4>❓ 물어볼 것</h4><ul>${c.확인.map((q) => `<li>${esc(q)}</li>`).join('')}</ul></div>` : ''}
  ${셋택(c.편)}
</section>`

const 안채움카드 = (x, i) => `
<section class="card swap" data-k="${esc(x.편)}">
  <header><span class="no">${String(전부.length + i + 1).padStart(2, '0')}</span><h3>${esc(x.편)}</h3><span class="tag">${esc(x.처방)}</span></header>
  <p class="why">${esc(x.말)}</p>
  <div class="pick" role="radiogroup" aria-label="${esc(x.편)} 판정">
    <label><input type="radio" name="p-${esc(x.편)}" value="좋다" data-k="${esc(x.편)}">✅ 그렇게 해</label>
    <label><input type="radio" name="p-${esc(x.편)}" value="고칠것" data-k="${esc(x.편)}">✏️ 아니야</label>
    <label><input type="radio" name="p-${esc(x.편)}" value="나중에" data-k="${esc(x.편)}">⏸ 나중에</label>
  </div>
  <label class="say"><span>아니면 어떻게 할까</span>
    <textarea class="note" data-k="${esc(x.편)}" rows="2" placeholder=""></textarea></label>
</section>`

const 물음수 = 전부.reduce((n, c) => n + c.확인.length, 0)

const HTML = `<title>내가 채운 레시피 ${전부.length}편</title>
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
  h2{margin:30px 0 0;font-size:15px;letter-spacing:-.01em;color:var(--brand)}
  h2 + .sub{margin:3px 0 0;font-size:13px;color:var(--faint);line-height:1.7}
  .card{margin:14px 0 0;padding:15px;background:var(--card);border:1px solid var(--line);border-radius:14px}
  .card.ok{border-color:var(--ok);background:var(--okbg)}
  .card.fix{border-color:var(--warn);background:var(--warnbg)}
  .card.hold{border-color:var(--hold);background:var(--holdbg)}
  .card header{display:flex;align-items:baseline;gap:9px;margin:0 0 3px;flex-wrap:wrap}
  .no{flex:none;font-size:12px;font-weight:800;color:var(--faint);font-variant-numeric:tabular-nums;min-width:20px}
  .card h3{margin:0;font-size:18px;letter-spacing:-.01em;line-height:1.35}
  .tag{font-size:11.5px;font-weight:800;letter-spacing:.05em;color:var(--paper);background:var(--brand);border-radius:99px;padding:2px 9px}
  .meta{margin:0 0 11px 29px;font-size:12.5px;color:var(--faint);font-variant-numeric:tabular-nums}
  .meta b{color:var(--dim)}
  .why{margin:6px 0 0;font-size:14px;color:var(--dim);line-height:1.75}
  .two{display:grid;gap:14px}
  @media (min-width:560px){.two{grid-template-columns:minmax(0,1fr) minmax(0,1.35fr);gap:18px}}
  .two h4{margin:0 0 5px;font-size:11.5px;font-weight:800;letter-spacing:.07em;color:var(--brand)}
  .ing{margin:0;padding:0;list-style:none;font-size:14px;color:var(--dim)}
  .ing li{padding:2px 0;border-bottom:1px dashed var(--line)}
  .ing li:last-child{border-bottom:0}
  .ing li.grp{border-bottom:0;padding-top:8px;font-size:11.5px;font-weight:800;letter-spacing:.06em;color:var(--brand)}
  .step{margin:0;padding:0 0 0 20px;font-size:14.5px}
  .step li{margin:0 0 6px;padding-left:2px}
  .step li::marker{color:var(--brand);font-weight:800;font-size:13px}
  .ask{margin:13px 0 0;padding:11px 13px;background:var(--warnbg);border:1px solid var(--warn);border-radius:11px}
  .ask h4{margin:0 0 5px;font-size:11.5px;font-weight:800;letter-spacing:.06em;color:var(--warn)}
  .ask ul{margin:0;padding:0 0 0 17px;font-size:13.5px;line-height:1.75}
  .ask li{margin:0 0 3px}
  .memo{margin:9px 0 0;font-size:13.5px;color:var(--dim)}
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
  .later{margin:14px 0 0;padding:14px 15px;background:var(--card);border:1px solid var(--line);border-radius:14px}
  .later ul{margin:0;padding:0;list-style:none;font-size:14px}
  .later li{display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-bottom:1px dashed var(--line)}
  .later li:last-child{border-bottom:0}
  .later li b{font-weight:700}
  .later li em{font-style:normal;font-size:12.5px;color:var(--faint);font-variant-numeric:tabular-nums;flex:none}
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
  <h1>내가 채운 레시피 ${전부.length}편</h1>
  <p class="lead">순서가 모자라던 편들이야. <b>새로 지어내지 않고</b> 네 메모·원문에 있는 것만 갈라서 세웠어.<br>
     바로 낼 수 있는 게 <b>32편 → ${32 + 21}편</b>이 됐어.</p>
</header>

<div class="how">
  <b>하면 되는 것</b><br>
  읽고 <b>［이대로］</b>만 누르면 돼. 빨간 <b>［❓물어볼 것］</b>이 붙은 건 <b>답을 아래 칸에 적어</b>줘 — 거의 다 <b>단위</b>야(큰술인지 작은술인지).<br>
  중간에 멈춰도 돼 — <b>고른 건 저장돼</b>. 다 보면 맨 아래 <b>［결과 복사］</b> 눌러서 보내줘.
</div>

<h2>✍️ 내가 채운 ${전부.length}편</h2>
<p class="sub">❓물어볼 것 ${물음수}개가 붙어 있어. 그중 🚨두 개는 <b>네 메모와 재료칸이 서로 다른</b> 자리라 내가 못 골랐어.</p>
${전부.map(카드).join('')}

<h2>🔄 채우지 않은 ${안채움.length}편 — 이미 있거나 겹쳐</h2>
<p class="sub">새로 쓰면 있는 걸 또 만드는 거라 손대지 않았어.</p>
${안채움.map(안채움카드).join('')}

<h2>📥 아직 못 채운 ${못채운.length}편</h2>
<p class="sub"><b>지어낼 수가 없어서</b> 손 안 댔어. 까닭이 둘이야 —
  <b>✂️원문이 잘린 것</b> ${못채운.filter((x) => x.밑감 > 0).length}편(인스타 캡처가 중간까지만 찍혔어) ·
  <b>🈳밑감이 아예 없는 것</b> ${못채운.filter((x) => x.밑감 === 0).length}편.<br>
  불러주면 그때 채울게 — 그냥 둬도 돼.</p>
<div class="later"><ul>
  ${못채운.map((x) => `<li><b>${x.밑감 > 0 ? '✂️ ' : '🈳 '}${esc(x.편)}</b><em>${x.밑감 > 0 ? `원문 ${x.밑감}자 · 걸음 ${x.걸}에서 끊김` : `재료 ${x.재} · 걸음 ${x.걸}`}</em></li>`).join('')}
</ul>
<label class="say"><span>이 중에 지금 불러줄 게 있으면 여기에</span>
  <textarea class="note" data-k="못채운편" rows="3" placeholder="예) 옥수수삶기 — 물에 소금 조금 넣고 30분"></textarea></label>
</div>
</div>

<div id="fb" role="status" aria-live="polite"></div>
<div class="bar"><div class="in">
  <div class="count" id="cnt"></div>
  <button id="copy" type="button">결과 복사</button>
</div></div>
<textarea id="out" readonly aria-hidden="true" tabindex="-1"></textarea>

<script>
(function(){
  var KEY = 'hankki-채움23-0903'
  var picks = [].slice.call(document.querySelectorAll('.pick input'))
  var notes = [].slice.call(document.querySelectorAll('.note'))
  var cards = [].slice.call(document.querySelectorAll('.card'))
  var cnt = document.getElementById('cnt')
  var fb = document.getElementById('fb')

  /* 새로고침해도 남게 — 창업자는 폰에서 나눠 본다. 스크롤하다 전화가 오면 처음부터 다시 고르게 된다. */
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
    var 줄 = ['[내가 채운 레시피 ' + cards.length + '편 — 검수 결과]', '']
    var 표 = { '좋다':'✅ 이대로', '고칠것':'✏️ 고칠 것', '나중에':'⏸ 나중에' }
    cards.forEach(function(c){
      var k = c.dataset.k
      var v = o['p:'+k]
      var t = c.querySelector('.note')
      var m = t ? t.value.trim() : ''
      줄.push((v ? 표[v] : '⬜ 아직') + '  ' + k + (m ? '  → ' + m : ''))
    })
    var 못 = o['n:못채운편']
    if (못 && 못.trim()) { 줄.push('', '[못 채운 편에 대해]', 못.trim()) }
    var text = 줄.join('\\n')

    /* 복사 실패 폴백 — clipboard.writeText 는 «성공으로 resolve 되고도» 실패한다(v10.97 사고). */
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
console.log(`✅ 검수판 — 채운 ${전부.length}편 ＋ 채우지 않은 ${안채움.length}편 ＋ 못 채운 ${못채운.length}편`)
console.log(`   ❓물어볼 것 ${물음수}개 · 판정 칸 ${전부.length + 안채움.length}개`)
console.log(`💾 ${낼곳}`)
