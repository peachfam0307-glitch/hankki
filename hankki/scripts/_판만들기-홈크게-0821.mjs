// 🏠 [판정대기 · 2026-08-21] 「홈 음식 그림 크게」 판 만들기 — 캡처를 판 하나로 엮는다
//
// ⛔ 캡처는 `_판-홈크게-0821.mjs` 가 «앱을 실제로 띄워» 찍은 것이다(흉내 아님 · 절대원칙 30).
// ☑️ 절대원칙(2026-08-19) = 검수판은 «무조건» 체크 ＋ 복사.
//    ⛔ `clipboard.writeText()` 는 성공으로 resolve 되고도 실제 복사가 안 되는 폰이 있다(v10.97)
//       → 실패하면 글자를 «골라 준다»(Range) — 길게 눌러 복사하게.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판만들기-홈크게-0821.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SHOT = process.env.SHOT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홈크게'
const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홈크게판.html'
const 잰값 = JSON.parse(readFileSync(join(SHOT, '잰값.json'), 'utf8'))

const b64 = (f) => `data:image/png;base64,${readFileSync(join(SHOT, f)).toString('base64')}`

const 갈래 = [
  {
    key: '가', 배지: '지금', 이름: '지금 그대로', 파일: '가-지금 그대로.png',
    한줄: '한 줄에 3칸',
    좋은것: ['이미 쓰던 그대로 — 바뀌는 게 없다'],
    걸리는것: ['그림이 56px — 창업자가 「작다」고 한 그 크기다', '이름표가 「아보카도 바나…」로 잘린다'],
  },
  {
    key: '나', 배지: '추천', 이름: '한 줄에 2칸', 파일: '나-한 줄에 2칸.png',
    한줄: '상자가 1.54배 — 제일 큼직해진다',
    좋은것: ['그림 56 → 87px', '이름표가 «안 잘린다» — 「아보카도 바나나 스무디」가 다 보인다', '꾸미기는 한 톨도 안 잃는다(같은 배수로 커진다)'],
    걸리는것: ['3편인 주는 2＋1 이 되어 셋째가 혼자 남는다 (19주 중 17주가 3편)'],
  },
  {
    key: '다', 배지: '', 이름: '3칸인데 여백만 줄이기', 파일: '다-3칸인데 여백을 줄여 크게.png',
    한줄: '칸 수는 그대로 · 사이 간격과 카드 여백만',
    좋은것: ['줄 모양이 «하나도» 안 바뀐다 — 2＋1 걱정이 없다'],
    걸리는것: ['그림 56 → 59px = 1.05배. 솔직히 «커진 게 눈에 안 띈다»', '이름표는 여전히 잘린다'],
  },
  {
    key: '라', 배지: '', 이름: '2칸 ＋ 여백도 줄이기', 파일: '라-2칸 ＋ 여백도 줄이기.png',
    한줄: '「나」와 「다」를 같이 — 제일 크다',
    좋은것: ['그림 56 → 90px (1.59배)', '「나」보다 조금 더 크다'],
    걸리는것: ['「나」와 3px 차이라 «눈으로는 거의 같다»', '카드가 화면 가장자리에 더 붙는다', '2＋1 문제는 「나」와 똑같다'],
  },
]

const 접은갈래 = {
  이름: '첫 장만 크게 ＋ 아래 둘 (잡지식)', 파일: '마-첫 장만 크게 ＋ 아래 둘.png',
  이유: '2＋1 을 없애려고 만들어 봤는데 — <b>우리 음식 그림이 정사각</b>이라 상자만 넓히면 <b>그림은 그대로고 여백만 는다</b>. 눕혀도 마찬가지였다. 그래서 내가 접었다(창업자가 되살리라 하면 언제든).',
}

const 값 = (k) => 잰값.find((x) => x.key === k) || {}

const 카드HTML = 갈래.map((g) => {
  const v = 값(g.key)
  return `
  <article class="opt" data-key="${g.key}">
    <header class="opt-head">
      <div class="opt-id">${g.key}</div>
      <div class="opt-title">
        <h3>${g.이름}${g.배지 ? `<span class="badge ${g.배지 === '추천' ? 'rec' : 'now'}">${g.배지}</span>` : ''}</h3>
        <p>${g.한줄}</p>
      </div>
    </header>

    <figure><img src="${b64(g.파일)}" alt="${g.이름}" loading="lazy"></figure>

    <dl class="num">
      <div><dt>그림</dt><dd>${v.그림}<small>px</small></dd></div>
      <div><dt>상자</dt><dd>${v.상자}<small>px</small></dd></div>
      <div><dt>지금 대비</dt><dd class="${v.상자 / 값('가').상자 >= 1.4 ? 'hot' : ''}">${(v.상자 / 값('가').상자).toFixed(2)}<small>배</small></dd></div>
      <div><dt>이름표</dt><dd class="${v.잘림 ? 'warn' : 'ok'}">${v.잘림 ? '잘림' : '다 보임'}</dd></div>
    </dl>

    <ul class="pro">${g.좋은것.map((x) => `<li>${x}</li>`).join('')}</ul>
    <ul class="con">${g.걸리는것.map((x) => `<li>${x}</li>`).join('')}</ul>

    <div class="pick" role="group" aria-label="${g.이름} 판정">
      <button type="button" data-v="이걸로">이걸로</button>
      <button type="button" data-v="아니다">아니다</button>
      <button type="button" data-v="모르겠다">모르겠다</button>
    </div>
    <textarea class="memo" rows="1" placeholder="한마디 (안 써도 돼)"></textarea>
  </article>`
}).join('')

const html = `<title>홈 음식 그림 크게</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=Gowun+Batang:wght@700&display=swap">
<style>
:root{
  --ink:#2a2622; --ink2:#6b6055; --line:#e3dccf; --ground:#f6f3ec; --card:#fffdf8;
  --accent:#3f6ea8; --accent-soft:#e7eef7; --hot:#b4622c; --ok:#2f7a52; --warn:#b4622c;
  --shadow:0 1px 2px rgba(60,50,35,.05), 0 8px 24px -12px rgba(60,50,35,.22);
}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
  --ink:#eae4da; --ink2:#a89e91; --line:#39332c; --ground:#1b1815; --card:#252017;
  --accent:#8fb6e0; --accent-soft:#22303f; --hot:#e29a68; --ok:#7fc79f; --warn:#e29a68;
  --shadow:0 1px 2px rgba(0,0,0,.3), 0 8px 24px -12px rgba(0,0,0,.6);
}}
:root[data-theme="dark"]{
  --ink:#eae4da; --ink2:#a89e91; --line:#39332c; --ground:#1b1815; --card:#252017;
  --accent:#8fb6e0; --accent-soft:#22303f; --hot:#e29a68; --ok:#7fc79f; --warn:#e29a68;
  --shadow:0 1px 2px rgba(0,0,0,.3), 0 8px 24px -12px rgba(0,0,0,.6);
}
*{box-sizing:border-box}
body{
  margin:0; background:var(--ground); color:var(--ink);
  font-family:'Gowun Dodum', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', sans-serif;
  font-size:16px; line-height:1.75; word-break:keep-all;
  padding:28px 18px 96px;
}
.wrap{max-width:560px; margin:0 auto}
h1{
  font-family:'Gowun Batang', serif; font-size:27px; line-height:1.35; margin:0 0 6px;
  letter-spacing:-.02em; text-wrap:balance;
}
.sub{color:var(--ink2); font-size:14.5px; margin:0 0 22px}
.quote{
  background:var(--accent-soft); border-radius:14px; padding:13px 15px; margin:0 0 26px;
  font-size:14.5px; line-height:1.7; color:var(--ink);
}
.quote b{font-weight:700}
.quote .who{display:block; font-size:12.5px; color:var(--ink2); margin-bottom:5px; letter-spacing:.04em}

.answer{
  border:1px solid var(--line); border-radius:14px; padding:14px 16px; margin:0 0 28px;
  background:var(--card); box-shadow:var(--shadow); font-size:14.5px; line-height:1.75;
}
.answer h2{font-size:15.5px; margin:0 0 8px; letter-spacing:-.01em}
.answer .big{color:var(--hot); font-weight:700}

.opt{
  background:var(--card); border:1px solid var(--line); border-radius:18px;
  padding:16px 16px 14px; margin:0 0 20px; box-shadow:var(--shadow);
}
.opt.done{border-color:var(--accent)}
.opt-head{display:flex; gap:12px; align-items:flex-start; margin-bottom:12px}
.opt-id{
  flex:0 0 auto; width:32px; height:32px; border-radius:10px;
  background:var(--accent); color:#fff; display:grid; place-items:center;
  font-weight:700; font-size:16px; font-family:'Gowun Batang', serif;
}
.opt-title{min-width:0}
.opt-title h3{margin:0; font-size:17px; letter-spacing:-.02em; line-height:1.4}
.opt-title p{margin:2px 0 0; font-size:13.5px; color:var(--ink2)}
.badge{
  display:inline-block; margin-left:7px; padding:2px 8px; border-radius:999px;
  font-size:11.5px; font-weight:700; vertical-align:2px; letter-spacing:.02em;
}
.badge.rec{background:var(--accent); color:#fff}
.badge.now{background:var(--line); color:var(--ink2)}

figure{margin:0 0 12px; border-radius:12px; overflow:hidden; border:1px solid var(--line); background:var(--ground)}
figure img{display:block; width:100%; height:auto}

.num{display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin:0 0 12px}
.num > div{background:var(--ground); border-radius:10px; padding:8px 4px; text-align:center}
.num dt{font-size:11px; color:var(--ink2); letter-spacing:.02em}
.num dd{margin:2px 0 0; font-size:16px; font-weight:700; font-variant-numeric:tabular-nums; letter-spacing:-.02em}
.num dd small{font-size:11px; font-weight:400; color:var(--ink2); margin-left:1px}
.num dd.hot{color:var(--hot)} .num dd.ok{color:var(--ok); font-size:13.5px} .num dd.warn{color:var(--warn); font-size:13.5px}

ul.pro, ul.con{margin:0 0 8px; padding:0; list-style:none; font-size:13.5px; line-height:1.7}
ul.pro li, ul.con li{padding-left:20px; position:relative; margin-bottom:3px}
ul.pro li::before{content:'✓'; position:absolute; left:2px; color:var(--ok); font-weight:700}
ul.con li::before{content:'·'; position:absolute; left:6px; color:var(--warn); font-weight:700; font-size:19px; line-height:1.1}
ul.con li{color:var(--ink2)}

.pick{display:grid; grid-template-columns:repeat(3,1fr); gap:7px; margin:12px 0 0}
.pick button{
  font:inherit; font-size:14px; padding:11px 4px; border-radius:11px; cursor:pointer;
  border:1px solid var(--line); background:var(--ground); color:var(--ink2);
  min-height:44px; transition:background .12s, color .12s, border-color .12s;
}
.pick button:hover{border-color:var(--accent)}
.pick button[aria-pressed="true"]{background:var(--accent); border-color:var(--accent); color:#fff; font-weight:700}
.pick button:focus-visible{outline:2px solid var(--accent); outline-offset:2px}
.memo{
  width:100%; margin-top:8px; font:inherit; font-size:14px; padding:9px 11px;
  border:1px solid var(--line); border-radius:10px; background:var(--ground); color:var(--ink);
  resize:vertical; min-height:42px;
}
.memo:focus-visible{outline:2px solid var(--accent); outline-offset:1px}

.folded{
  border:1px dashed var(--line); border-radius:14px; padding:14px 16px; margin:0 0 26px;
  background:transparent; font-size:13.5px; color:var(--ink2); line-height:1.75;
}
.folded h3{margin:0 0 6px; font-size:15px; color:var(--ink)}
.folded img{width:100%; height:auto; border-radius:10px; margin-top:10px; border:1px solid var(--line)}
.folded summary{cursor:pointer; color:var(--accent); font-size:13.5px; margin-top:8px}

.bar{
  position:sticky; bottom:0; margin:26px -18px -96px; padding:14px 18px calc(18px + env(safe-area-inset-bottom));
  background:color-mix(in srgb, var(--ground) 92%, transparent);
  backdrop-filter:blur(8px); border-top:1px solid var(--line);
}
.bar button{
  width:100%; font:inherit; font-size:16px; font-weight:700; padding:15px; border-radius:13px;
  border:none; background:var(--accent); color:#fff; cursor:pointer; min-height:52px;
}
.bar .cnt{text-align:center; font-size:12.5px; color:var(--ink2); margin-bottom:9px}
#out{
  width:100%; margin-top:11px; font:inherit; font-size:13.5px; padding:11px;
  border:1px solid var(--line); border-radius:11px; background:var(--card); color:var(--ink);
  white-space:pre-wrap; display:none; line-height:1.7;
}
#out.on{display:block}
</style>

<div class="wrap">
  <h1>홈 음식 그림 크게</h1>
  <p class="sub">2026-08-21 · 앱을 실제로 띄워 찍은 것 (390×844 · 3배 화질)</p>

  <div class="quote">
    <span class="who">창업자</span>
    “음식그림이 <b>그림자체가 커지는거야? 박스가 커지는거야?</b><br>(음식자체가 커지면 꾸미기가 기능을 좀 잃지않나해서)”
  </div>

  <div class="answer">
    <h2>먼저 그 답 — 재봤어. 걱정이 맞았다</h2>
    음식 그림도 꾸미기 스티커도 <b>둘 다 「상자 폭의 몇 %」로</b> 잰다.<br>
    · 상자를 키우면 → 둘이 <span class="big">같은 배수</span>로 커진다. <b>꾸미기가 잃는 자리 0</b><br>
    · 그림만 키우면 → 그림이 상자를 더 먹고 꾸미기는 그대로 = <b>꾸미기가 밀린다</b><br><br>
    실측 = 상자를 168 → 350px(2.08배)로 키웠더니 스티커 비율 어긋남 <b>0.10%p</b>(픽셀 반올림 수준).<br>
    👉 그래서 아래는 <b>전부 「상자」만</b> 바꾼 것이다. 그림·꾸미기 코드는 한 줄도 안 건드렸다.
  </div>

  <div class="answer">
    <h2>그리고 재보다 하나 더 알았다</h2>
    「우리집레시피」는 <b>2편이라 이미 156px 로 큼직하다.</b> 작은 건 <b>「이번 주 특별한 한끼」(3편)</b> 쪽이다.<br>
    ⛔ 그런데 <b>19주 중 17주가 3편</b>이라 — 2칸으로 가면 그 17주가 <b>2＋1</b> 이 된다. 거기가 판정할 자리다.
  </div>

  ${카드HTML}

  <div class="folded">
    <h3>내가 접은 갈래 하나 — ${접은갈래.이름}</h3>
    ${접은갈래.이유}
    <details><summary>어떻게 나왔는지 보기</summary>
      <img src="${b64(접은갈래.파일)}" alt="${접은갈래.이름}" loading="lazy">
    </details>
  </div>

  <div class="bar">
    <div class="cnt" id="cnt">아직 안 고름</div>
    <button type="button" id="copy">고른 것 복사하기</button>
    <div id="out"></div>
  </div>
</div>

<script>
const KEY = 'hankki:홈크게-0821'
const 저장 = () => { try { localStorage.setItem(KEY, JSON.stringify(상태)) } catch {} }
let 상태 = {}
try { 상태 = JSON.parse(localStorage.getItem(KEY) || '{}') } catch { 상태 = {} }

const 세기 = () => {
  const n = Object.values(상태).filter((x) => x && x.v).length
  document.getElementById('cnt').textContent = n ? \`\${n}개 골랐어\` : '아직 안 고름'
}

document.querySelectorAll('.opt').forEach((el) => {
  const k = el.dataset.key
  const memo = el.querySelector('.memo')
  const 그리기 = () => {
    const s = 상태[k] || {}
    el.querySelectorAll('.pick button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === s.v)))
    el.classList.toggle('done', !!s.v)
    if (memo.value !== (s.m || '')) memo.value = s.m || ''
  }
  el.querySelectorAll('.pick button').forEach((b) => {
    b.addEventListener('click', () => {
      const s = 상태[k] || {}
      상태[k] = { ...s, v: s.v === b.dataset.v ? '' : b.dataset.v }
      저장(); 그리기(); 세기()
    })
  })
  memo.addEventListener('input', () => { 상태[k] = { ...(상태[k] || {}), m: memo.value }; 저장() })
  그리기()
})
세기()

const 이름 = {}
document.querySelectorAll('.opt').forEach((el) => { 이름[el.dataset.key] = el.querySelector('h3').childNodes[0].textContent.trim() })

document.getElementById('copy').addEventListener('click', async () => {
  const 줄 = ['[홈 음식 그림 크게 · 2026-08-21]']
  Object.keys(이름).forEach((k) => {
    const s = 상태[k] || {}
    if (!s.v && !s.m) return
    줄.push(\`\${k}. \${이름[k]} — \${s.v || '(안 고름)'}\${s.m ? ' / ' + s.m : ''}\`)
  })
  if (줄.length === 1) 줄.push('(아직 아무것도 안 골랐어)')
  const 글 = 줄.join('\\n')
  const out = document.getElementById('out')
  out.textContent = 글
  out.classList.add('on')
  // ⛔ writeText 는 «성공으로 resolve 되고도» 실제 복사가 안 되는 폰이 있다(v10.97) → 눈으로 확인되게 글도 띄운다
  let 됨 = false
  try { await navigator.clipboard.writeText(글); 됨 = true } catch {}
  if (!됨) {
    try {
      const r = document.createRange(); r.selectNodeContents(out)
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r)
    } catch {}
  }
  document.getElementById('copy').textContent = 됨 ? '복사했어 ✓' : '아래 글자를 길게 눌러 복사해줘'
  setTimeout(() => { document.getElementById('copy').textContent = '고른 것 복사하기' }, 2600)
})
</script>`

writeFileSync(OUT, html)
console.log(`✅ ${OUT}  (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB)`)
