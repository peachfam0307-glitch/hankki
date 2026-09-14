// 🔑🏷 「AI 스캔 이용권」 이름 후보 10개 — 창업자 판정판 만들기 (2026-08-24) 〔판정 대기〕
//
// 📮 창업자 = *"레시피열쇠 꽤 괜찮아. 지금까지 나온 것 중에서는 상위권으로 두고 싶어."*
//    ＋ *"다만 바로 확정하기보다는 레시피열쇠와 «비슷한 결»의 이름을 10개 정도 더 찾아보고 결정하는 걸 추천해."*
//
// ⭐ 이 판이 하는 일 = `_판-열쇠이름-0824.mjs` 가 찍은 «실물 앱 화면» 열 장을 한 장으로 엮는다.
//    ⛔ 그림을 새로 그리지 않는다 — 창업자가 볼 것은 «그 이름이 앱에서 어떻게 보이나»다(절대원칙 30).
//
// ☑️ 절대원칙(창업자 2026-08-19) = **검수판은 무조건 체크 ＋ 복사**
//    ⑴ 칸마다 고르기(좋다/버린다/모르겠다) — `localStorage` 저장 ⑵ 맨 아래 복사 ⑶ 복사 실패하면 Range 로 골라 준다
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-열쇠이름-아티팩트-0824.mjs
//    → 결과 HTML 은 scratchpad 로 (⛔저장소가 public 이라 결과물은 안 담는다 · 생성기만 담는다)
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const 컷폴더 = '/tmp/열쇠이름'
const 낼곳 = process.argv[2] || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/열쇠이름-판정판.html'

// [키, 이름, 세는말, 이모지, 은유, 걸리는 것, 줄수]
// ⭐ 「줄수」는 짐작이 아니라 실물 캡처를 열어서 «눈으로» 센 값이다(절대원칙 21 · 2026-08-24)
const 후보 = [
  ['01', '레시피열쇠', '개', '🔑', '연다 — 잠긴 레시피를 열어 준다', '지금 안 · 5글자라 두 줄', 2],
  ['02', '레시피필름', '장', '🎞', '찍은 것을 현상한다 — 사진·영상 둘 다 맞는다', '필름을 안 써 본 유저에겐 흐리다', 2],
  ['03', '레시피국자', '개', '🥄', '퍼온다 — 한끼다움이 제일 강하다', '「가져오기」와 한 단계 멀다', 2],
  ['04', '레시피가위', '개', '✂️', '오려온다 — 스크랩하는 손맛', '앱에 「가위표(✕)」가 있어 뜻이 겹칠 수 있다', 2],
  ['05', '레시피티켓', '장', '🎫', '이용권 — 설명이 필요 없다', '흔하다 · 한끼다운 맛이 옅다', 2],
  ['06', '레시피등불', '개', '🔦', '비춰서 읽는다 — AI 가 읽어 주는 일과 맞는다', '「등불 1개」가 세는 말로 어색하다', 2],
  ['07', '레시피따개', '개', '🥫', '연다 — 캔따개', '낯설다 · 부엌 물건인 건 좋다', 2],
  ['08', '레시피종', '개', '🔔', '부르면 온다 — 주방 벨', '뜻이 흐리다 · ⭐다만 한 줄에 들어가는 유일한 이름', 1],
  ['09', '레시피지팡이', '개', '🪄', '마법 — AI 은유로 바로 읽힌다', 'AI 이름으로 너무 흔하다 · 6글자로 제일 길다', 2],
  ['10', '레시피자석', '개', '🧲', '끌어온다 — 흩어진 걸 모은다', '⚠️꾸미기의 「각도 자석」과 낱말이 겹친다', 2],
]

const b64 = (키) => readFileSync(join(컷폴더, `${키}.webp`)).toString('base64')

const 카드 = 후보.map(([키, 이름, 세는말, 이모지, 은유, 흠, 줄수]) => `
  <article class="cand" data-key="${키}" data-name="${이름}">
    <header class="cand-head">
      <span class="emoji" aria-hidden="true">${이모지}</span>
      <div class="naming">
        <h3>${이름}</h3>
        <p class="count">1${세는말} · 2${세는말} 로 센다${줄수 === 1 ? ' <span class="tag tag-good">한 줄</span>' : ''}</p>
      </div>
    </header>
    <figure>
      <img src="data:image/webp;base64,${b64(키)}" alt="${이름} 을 얹은 가져오기 화면" loading="lazy" width="585" height="307">
      <figcaption>가져오기 화면 · 유저가 이 이름을 제일 자주 보는 자리</figcaption>
    </figure>
    <dl class="why">
      <dt>은유</dt><dd>${은유}</dd>
      <dt>걸리는 것</dt><dd>${흠}</dd>
    </dl>
    <div class="pick" role="group" aria-label="${이름} 판정">
      <button type="button" data-v="좋다">좋다</button>
      <button type="button" data-v="모르겠다">모르겠다</button>
      <button type="button" data-v="버린다">버린다</button>
    </div>
  </article>`).join('')

const html = `<title>레시피열쇠 이름 후보</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap">
<style>
  :root {
    --ground: #F2EFE7;
    --card: #FFFFFF;
    --ink: #3A2C1C;
    --ink-sub: #7E7263;
    --line: #E2DCCE;
    --accent: #3D6B39;
    --accent-soft: #EAF0E4;
    --warn: #A86A2E;
    --shadow: 0 1px 2px rgba(58,44,28,.06), 0 6px 18px rgba(58,44,28,.05);
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --ground: #1D1B17;
      --card: #262320;
      --ink: #EFE8DC;
      --ink-sub: #A69B8A;
      --line: #3A352E;
      --accent: #9CC08F;
      --accent-soft: #2C332A;
      --warn: #D9A96A;
      --shadow: 0 1px 2px rgba(0,0,0,.3), 0 6px 18px rgba(0,0,0,.25);
    }
  }
  :root[data-theme="dark"] {
    --ground: #1D1B17;
    --card: #262320;
    --ink: #EFE8DC;
    --ink-sub: #A69B8A;
    --line: #3A352E;
    --accent: #9CC08F;
    --accent-soft: #2C332A;
    --warn: #D9A96A;
    --shadow: 0 1px 2px rgba(0,0,0,.3), 0 6px 18px rgba(0,0,0,.25);
  }

  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--ground);
    color: var(--ink);
    font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard", "Malgun Gothic", "Noto Sans KR", sans-serif;
    font-size: 16px;
    line-height: 1.65;
    word-break: keep-all;
    -webkit-text-size-adjust: 100%;
  }
  .wrap { max-width: 620px; margin: 0 auto; padding: 28px 18px 140px; }

  header.top { margin-bottom: 26px; }
  .eyebrow {
    font-size: 13px; letter-spacing: .14em; text-transform: uppercase;
    color: var(--accent); font-weight: 700; margin: 0 0 8px;
  }
  h1 {
    font-family: "Gowun Batang", "Apple SD Gothic Neo", serif;
    font-size: clamp(28px, 7vw, 38px); font-weight: 700;
    margin: 0 0 12px; line-height: 1.3; text-wrap: balance;
  }
  .lede { margin: 0; color: var(--ink-sub); font-size: 15.5px; }

  .brief {
    background: var(--card); border: 1px solid var(--line); border-radius: 16px;
    padding: 18px 18px 14px; margin: 22px 0 30px; box-shadow: var(--shadow);
  }
  .brief h2 {
    font-family: "Gowun Batang", serif; font-size: 18px; margin: 0 0 10px; font-weight: 700;
  }
  .brief ul { margin: 0; padding-left: 18px; }
  .brief li { margin-bottom: 6px; font-size: 15px; }
  .brief li:last-child { margin-bottom: 0; }
  .quote {
    margin: 0 0 14px; padding: 10px 14px; border-left: 3px solid var(--accent);
    background: var(--accent-soft); border-radius: 0 10px 10px 0;
    font-size: 14.5px; color: var(--ink);
  }
  .brief .note { font-size: 14px; color: var(--ink-sub); margin: 12px 0 0; }

  .cands { display: flex; flex-direction: column; gap: 20px; }
  .cand {
    background: var(--card); border: 1px solid var(--line); border-radius: 18px;
    padding: 18px; box-shadow: var(--shadow);
    transition: border-color .15s ease;
  }
  .cand[data-picked="좋다"] { border-color: var(--accent); border-width: 2px; padding: 17px; }
  .cand[data-picked="버린다"] { opacity: .5; }

  .cand-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
  .emoji { font-size: 30px; line-height: 1; flex: 0 0 auto; }
  .naming h3 {
    font-family: "Gowun Batang", serif; font-size: 23px; font-weight: 700;
    margin: 0; line-height: 1.25;
  }
  .count { margin: 2px 0 0; font-size: 13.5px; color: var(--ink-sub); font-variant-numeric: tabular-nums; }
  .tag {
    display: inline-block; font-size: 12px; font-weight: 700; padding: 1px 7px;
    border-radius: 999px; vertical-align: 1px;
  }
  .tag-good { background: var(--accent-soft); color: var(--accent); }

  figure { margin: 0 0 14px; }
  figure img {
    display: block; width: 100%; height: auto; max-width: 100%;
    border: 1px solid var(--line); border-radius: 12px; background: #F2EFE7;
  }
  figcaption { margin-top: 7px; font-size: 12.5px; color: var(--ink-sub); }

  .why { margin: 0 0 16px; display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; }
  .why dt {
    font-size: 12px; font-weight: 700; color: var(--ink-sub);
    letter-spacing: .04em; padding-top: 3px; white-space: nowrap;
  }
  .why dd { margin: 0; font-size: 14.5px; }

  .pick { display: flex; gap: 8px; }
  .pick button {
    flex: 1; min-height: 46px; border: 1px solid var(--line); border-radius: 12px;
    background: transparent; color: var(--ink); font: inherit; font-size: 15px; font-weight: 600;
    cursor: pointer; transition: background .12s ease, border-color .12s ease, color .12s ease;
  }
  .pick button:hover { background: var(--accent-soft); }
  .pick button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .pick button[aria-pressed="true"] {
    background: var(--accent); border-color: var(--accent); color: #fff; font-weight: 700;
  }
  :root[data-theme="dark"] .pick button[aria-pressed="true"],
  :root:not([data-theme="light"]) .pick button[aria-pressed="true"] { color: #1D1B17; }
  @media (prefers-color-scheme: light) {
    :root:not([data-theme="dark"]) .pick button[aria-pressed="true"] { color: #fff; }
  }

  .memo { margin: 30px 0 0; }
  .memo label { display: block; font-size: 14px; font-weight: 700; margin-bottom: 8px; }
  .memo textarea {
    width: 100%; min-height: 96px; padding: 12px 14px; font: inherit; font-size: 15px;
    background: var(--card); color: var(--ink);
    border: 1px solid var(--line); border-radius: 14px; resize: vertical;
  }
  .memo textarea:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }

  .result {
    margin-top: 26px; background: var(--card); border: 1px solid var(--line);
    border-radius: 16px; padding: 18px; box-shadow: var(--shadow);
  }
  .result h2 { font-family: "Gowun Batang", serif; font-size: 18px; margin: 0 0 10px; }
  #out {
    margin: 0 0 14px; padding: 12px 14px; background: var(--ground);
    border-radius: 12px; font-size: 14.5px; white-space: pre-wrap;
    font-variant-numeric: tabular-nums; user-select: text; -webkit-user-select: text;
  }
  #copy {
    width: 100%; min-height: 50px; border: none; border-radius: 12px;
    background: var(--accent); color: #fff; font: inherit; font-size: 16px; font-weight: 700;
    cursor: pointer;
  }
  :root[data-theme="dark"] #copy, :root:not([data-theme="light"]) #copy { color: #1D1B17; }
  @media (prefers-color-scheme: light) { :root:not([data-theme="dark"]) #copy { color: #fff; } }
  #copy:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }
  .hint { margin: 10px 0 0; font-size: 13px; color: var(--ink-sub); }

  footer.foot { margin-top: 34px; font-size: 13px; color: var(--ink-sub); }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style>

<div class="wrap">
  <header class="top">
    <p class="eyebrow">판정 대기</p>
    <h1>레시피열쇠 이름 후보</h1>
    <p class="lede">「AI 스캔」을 대신할 이름 열 개를 <strong>진짜 앱 화면</strong>에 얹어 찍었어요. 그림은 흉내가 아니라 지금 앱 그대로예요.</p>
  </header>

  <section class="brief">
    <h2>고르는 잣대</h2>
    <p class="quote">「콩·별·방울」 같은 귀여운 재화보다는, AI가 무언가를 해주는 기능을 은유하면서 실제 물건이라 1개·2개로 셀 수 있는 이름 쪽.</p>
    <ul>
      <li><strong>앱이 이미 쓰는 말은 뺐어요</strong> — 돋보기·바구니는 화면에 이미 있어서 후보에서 제외</li>
      <li><strong>자석만 겹쳐요</strong> — 꾸미기의 「각도 자석」과 낱말이 같아요</li>
      <li><strong>이름이 길면 두 줄로 넘어가요</strong> — 「레시피종」만 한 줄에 들어가요</li>
    </ul>
    <p class="note">이름 뒤에 붙는 세는 말도 같이 바뀌어요. 열쇠·국자·가위는 「개」, 필름·티켓은 「장」.</p>
  </section>

  <div class="cands">${카드}
  </div>

  <div class="memo">
    <label for="note">따로 하고 싶은 말 (다른 이름이 떠올라도 여기에)</label>
    <textarea id="note" placeholder="예: 열쇠가 제일 낫다. 다만 「레꾸열쇠」로 줄이면 어떨까"></textarea>
  </div>

  <section class="result">
    <h2>고른 것</h2>
    <div id="out">아직 아무것도 안 골랐어요.</div>
    <button id="copy" type="button">복사하기</button>
    <p class="hint">복사가 안 되면 위 글자가 저절로 선택돼요 — 길게 눌러 복사하면 돼요.</p>
  </section>

  <footer class="foot">
    <p>화면은 2026-08-24 앱(v11.29) 가져오기 화면 · 고른 것은 이 폰에만 저장돼요.</p>
  </footer>
</div>

<script>
  var KEY = 'hankki:열쇠이름:0824'
  var state = {}
  try { state = JSON.parse(localStorage.getItem(KEY) || '{}') } catch (e) { state = {} }
  if (!state || typeof state !== 'object') state = {}

  var cands = Array.prototype.slice.call(document.querySelectorAll('.cand'))
  var out = document.getElementById('out')
  var note = document.getElementById('note')

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch (e) { /* 사파리 비공개 등 — 화면은 그대로 돈다 */ }
  }

  function text() {
    var good = [], mid = [], bad = []
    cands.forEach(function (c) {
      var n = c.getAttribute('data-name'), v = state[c.getAttribute('data-key')]
      if (v === '좋다') good.push(n)
      else if (v === '모르겠다') mid.push(n)
      else if (v === '버린다') bad.push(n)
    })
    if (!good.length && !mid.length && !bad.length && !(state.note || '').trim()) return ''
    var s = '한끼 이름 판정 (2026-08-24)\\n'
    s += '좋다: ' + (good.length ? good.join(', ') : '-') + '\\n'
    s += '모르겠다: ' + (mid.length ? mid.join(', ') : '-') + '\\n'
    s += '버린다: ' + (bad.length ? bad.join(', ') : '-')
    var m = (state.note || '').trim()
    if (m) s += '\\n메모: ' + m
    return s
  }

  function draw() {
    cands.forEach(function (c) {
      var v = state[c.getAttribute('data-key')]
      if (v) c.setAttribute('data-picked', v); else c.removeAttribute('data-picked')
      Array.prototype.forEach.call(c.querySelectorAll('.pick button'), function (b) {
        b.setAttribute('aria-pressed', b.getAttribute('data-v') === v ? 'true' : 'false')
      })
    })
    var t = text()
    out.textContent = t || '아직 아무것도 안 골랐어요.'
  }

  cands.forEach(function (c) {
    c.querySelector('.pick').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return
      var k = c.getAttribute('data-key'), v = b.getAttribute('data-v')
      if (state[k] === v) delete state[k]; else state[k] = v
      save(); draw()
    })
  })

  note.value = state.note || ''
  note.addEventListener('input', function () { state.note = note.value; save(); draw() })

  document.getElementById('copy').addEventListener('click', function () {
    var t = text()
    if (!t) { alert('먼저 하나라도 골라 주세요.'); return }
    var btn = this
    function 골라주기() {
      // ⛔ clipboard.writeText() 는 «성공으로 resolve 되고도» 실제 복사가 안 되는 폰이 있다(v10.97 교훈)
      //    → 그때는 글자를 «골라 준다». 길게 눌러 복사하면 된다.
      try {
        var r = document.createRange(); r.selectNodeContents(out)
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r)
        out.scrollIntoView({ block: 'center' })
        btn.textContent = '글자를 골라 뒀어요 · 길게 눌러 복사'
      } catch (e) { btn.textContent = '복사가 안 돼요 · 위 글자를 직접 복사해 주세요' }
      setTimeout(function () { btn.textContent = '복사하기' }, 3200)
    }
    try {
      navigator.clipboard.writeText(t).then(function () {
        btn.textContent = '복사했어요'
        setTimeout(function () { btn.textContent = '복사하기' }, 1800)
      }).catch(골라주기)
    } catch (e) { 골라주기() }
  })

  draw()
</script>
`

writeFileSync(낼곳, html)
console.log(`✅ ${낼곳}`)
console.log(`   후보 ${후보.length}개 · ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)}MB`)
