// 🥕 창업자 아이콘 발주판 만들기 — 데이터는 `_재료조사-0812.json` 에서 «읽어 온다»
//   ⛔ 손으로 옮기지 않는다(규칙 8 · 옮기면 틀린다)
//   ⚠️ 판 파일은 scratchpad 에 낸다 — 저장소는 공개라 창업자 개인 레시피 원문을 안 올린다.
import fs from 'node:fs'
import path from 'node:path'
const 뿌리 = path.resolve(import.meta.dirname, '..')
const d = JSON.parse(fs.readFileSync(path.join(뿌리, 'scripts/_재료조사-0812.json'), 'utf8'))

// ⭐ 시트는 «결»로 묶는다 — 한 장을 한 번에 뽑으니 갈래가 섞이면 그림체가 흔들린다
//    (2026-08-01 한복곰 11컷 중 2컷만 흰 테가 있어 짝짝이가 된 사고와 같은 뿌리)
const 시트 = [
  { 이름: '채소·나물·버섯', 갈래: ['🥬 채소·나물·버섯'], 결: '흙에서 나는 것. 초록·주황 위주라 한 장에 모으면 색이 산다.' },
  { 이름: '양념·장·기름', 갈래: ['🧂 양념·장·기름'], 결: '병·봉지·가루. 거의 다 «담긴 것»이라 모양이 비슷해 한 장이 편하다.' },
  { 이름: '곡물·면·빵·묵', 갈래: ['🍚 곡물·면·두부·묵', '🥛 유제품·과일·음료'], 결: '흰색·베이지가 많아 서로 안 싸운다.' },
  { 이름: '고기·해산물', 갈래: ['🥩 고기·계란', '🐟 해산물·건어물', '🧺 그 밖'], 결: '붉은색·은색. 채소와 섞으면 한쪽이 죽는다.' },
]
// 🤔 내 의견일 뿐 — 판정은 창업자가 한다(규칙 11). 점선 밑줄로만 표시한다.
const 안뽑아도 = new Set(['면수', '얼음', '육수', '산적', '그래놀라나 시리얼', '시판 쿠키 반죽'])

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const 칩 = (r) => `<label class="chip${안뽑아도.has(r.이름) ? ' maybe' : ''}${r.n >= 3 ? ' hot' : ''}">` +
  `<input type="checkbox" data-k="${esc(r.이름)}"><span class="nm">${esc(r.이름)}</span>` +
  `${r.n >= 2 ? `<span class="n">${r.n}</span>` : ''}</label>`

let 카드 = ''; let 총 = 0
시트.forEach((s, i) => {
  const 것 = d.필요.filter((r) => s.갈래.includes(r.갈래)).sort((a, b) => b.n - a.n || a.이름.localeCompare(b.이름, 'ko'))
  총 += 것.length
  카드 += `
    <section class="sheet">
      <header class="sh">
        <span class="idx">시트 ${'ABCD'[i]}</span>
        <h2>${esc(s.이름)}</h2>
        <span class="cnt"><b>${것.length}</b>컷</span>
      </header>
      <p class="why">${esc(s.결)}</p>
      <div class="chips">${것.map(칩).join('')}</div>
    </section>`
})

const 있음 = Object.entries(d.지금그림).map(([k, v]) =>
  `<div class="hasrow"><span class="hk">${esc(k)}</span><span class="hv">${v.map(esc).join(' · ')}</span></div>`).join('')
const 있음수 = Object.values(d.지금그림).reduce((a, b) => a + b.length, 0)

const html = `<title>재료 그림 발주판</title>
<style>
:root{
  --ground:#efece4; --paper:#faf8f3; --ink:#33302b; --dim:#7d766c; --line:#dcd6ca;
  --pt:#5878a0; --pt-soft:#e3eaf3; --hot:#a8552f; --ok:#5f7f5c;
}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
  --ground:#1c1b19; --paper:#26241f; --ink:#ece7dd; --dim:#9a9287; --line:#3c3830;
  --pt:#8fb0d8; --pt-soft:#2a3442; --hot:#dd9163; --ok:#8fb08b;
}}
:root[data-theme="dark"]{
  --ground:#1c1b19; --paper:#26241f; --ink:#ece7dd; --dim:#9a9287; --line:#3c3830;
  --pt:#8fb0d8; --pt-soft:#2a3442; --hot:#dd9163; --ok:#8fb08b;
}
*{box-sizing:border-box}
body{
  margin:0; background:var(--ground); color:var(--ink);
  font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif;
  line-height:1.62; -webkit-text-size-adjust:100%;
}
.wrap{max-width:760px; margin:0 auto; padding:28px 18px 72px; display:flex; flex-direction:column; gap:22px}
.top h1{font-size:26px; line-height:1.25; margin:0 0 6px; letter-spacing:-.02em; text-wrap:balance}
.top .sub{color:var(--dim); font-size:14.5px; margin:0}
.top .sub b{color:var(--ink)}
.quote{
  margin:14px 0 0; padding:11px 14px; background:var(--pt-soft); border-radius:10px;
  font-size:14px; border-left:3px solid var(--pt);
}
.nums{display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:16px}
.num{background:var(--paper); border:1px solid var(--line); border-radius:12px; padding:12px 10px; text-align:center}
.num b{display:block; font-size:26px; line-height:1.1; font-variant-numeric:tabular-nums; color:var(--pt)}
.num span{font-size:12px; color:var(--dim)}
.legend{display:flex; gap:8px 15px; flex-wrap:wrap; font-size:12.5px; color:var(--dim); margin-top:12px}
.legend i{font-style:normal; display:inline-flex; align-items:center; gap:5px}
.dot{width:9px; height:9px; border-radius:3px; display:inline-block; flex:0 0 auto}
.sheet{background:var(--paper); border:1px solid var(--line); border-radius:14px; padding:16px 15px 17px}
.sh{display:flex; align-items:baseline; gap:9px; flex-wrap:wrap}
.sh h2{font-size:17.5px; margin:0; letter-spacing:-.01em; flex:1}
.idx{font-size:11px; font-weight:700; letter-spacing:.08em; color:var(--pt); background:var(--pt-soft); padding:3px 8px; border-radius:999px}
.cnt{font-size:13px; color:var(--dim); font-variant-numeric:tabular-nums}
.cnt b{color:var(--ink); font-size:15px}
.why{margin:7px 0 12px; font-size:13px; color:var(--dim)}
.chips{display:flex; flex-wrap:wrap; gap:7px}
.chip{
  display:inline-flex; align-items:center; gap:5px; cursor:pointer;
  padding:6px 11px; border:1px solid var(--line); border-radius:999px;
  background:var(--ground); font-size:14px; user-select:none;
}
.chip input{position:absolute; opacity:0; width:0; height:0}
.chip .n{font-size:11px; color:var(--pt); font-variant-numeric:tabular-nums; font-weight:700}
.chip.hot{border-color:var(--pt)}
.chip.maybe .nm{color:var(--dim); text-decoration:underline dotted}
.chip:has(input:checked){background:var(--ok); border-color:var(--ok)}
.chip:has(input:checked) .nm{text-decoration:line-through; color:#fff}
.chip:has(input:checked) .n{color:#fff}
.chip:focus-within{outline:2px solid var(--pt); outline-offset:2px}
details{background:var(--paper); border:1px solid var(--line); border-radius:14px; padding:14px 15px}
summary{cursor:pointer; font-size:15px; font-weight:700; letter-spacing:-.01em}
summary::marker{color:var(--pt)}
.hasrow{display:flex; gap:10px; padding:9px 0; border-top:1px solid var(--line); font-size:13.5px}
.hasrow:first-of-type{border-top:0}
.hk{flex:0 0 92px; color:var(--pt); font-weight:700; font-size:12.5px}
.hv{flex:1; color:var(--dim)}
.spec{background:var(--paper); border:1px solid var(--line); border-radius:14px; padding:16px 15px}
.spec h3{margin:0 0 10px; font-size:16px}
.spec ul{margin:0; padding-left:19px; font-size:14px}
.spec li{margin:6px 0}
.spec b{color:var(--pt)}
.warn{color:var(--hot); font-weight:700}
.note{font-size:12.5px; color:var(--dim); text-align:center; padding-top:4px}
@media (prefers-reduced-motion:no-preference){ .chip{transition:background .12s, border-color .12s} }
</style>

<div class="wrap">
  <div class="top">
    <h1>재료 그림, 이만큼 필요해</h1>
    <p class="sub">우리 레시피 <b>${d.기본편수}편 ＋ 창업자 36편</b>을 통째로 훑어서 뽑았어. 이름이 달라도 <b>그림이 하나면 하나로</b> 세었어 — 후추·후춧가루는 한 컷이야.</p>
    <p class="quote">“냉장고 재료 아이콘 필요하면 다 뽑아줄게. 알려줘 뭐뭐 필요한지”</p>
    <div class="nums">
      <div class="num"><b>${총}</b><span>없는 것</span></div>
      <div class="num"><b>${있음수}</b><span>이미 있는 것</span></div>
      <div class="num"><b>4</b><span>시트 장수</span></div>
    </div>
    <div class="legend">
      <i><span class="dot" style="background:var(--pt)"></span>파란 테두리 = 세 편 넘게 나오는 것</i>
      <i><span class="dot" style="background:var(--ok)"></span>누르면 «뽑았다» 표시</i>
      <i><span class="dot" style="background:var(--dim)"></span>점선 밑줄 = 안 뽑아도 될 듯(내 의견)</i>
    </div>
  </div>
${카드}
  <div class="spec">
    <h3>뽑을 때 지킬 것</h3>
    <ul>
      <li><b>한 장에 25컷까지.</b> 더 넣으면 컷 하나가 작아져서 앱에서 뭉갠다 — 172종을 한 번 되돌린 적이 있어.</li>
      <li><b>배경은 순백(#FFFFFF).</b> <span class="warn">‘transparent background’라고 쓰면 AI가 회색 격자를 그려버려.</span> 투명인 줄 알고 넘어갔다가 앱에서 격자가 그대로 보인 적이 있어.</li>
      <li><b>서로 안 닿게.</b> 붙어 있으면 자를 때 옆 그림이 딸려 와.</li>
      <li><b>한 시트 = 한 결.</b> 두 장에 나눠 그리면 그림체가 흔들려. 그래서 갈래로 묶었어.</li>
      <li>이름표(글자)는 <b>안 넣어도 돼.</b> 넣으면 오타를 한 자씩 확대해서 봐야 해 — ‘추섴’ 사고가 있었어.</li>
    </ul>
  </div>
  <details>
    <summary>이미 그림이 있는 재료 ${있음수}개 — 겹쳐 뽑지 않게</summary>
    <div style="margin-top:10px">${있음}</div>
  </details>
  <p class="note">체크한 건 이 폰에 저장돼. 새로고침해도 남아.</p>
</div>
<script>
const KEY = 'hankki:ing-order-0812'
const saved = new Set(JSON.parse(localStorage.getItem(KEY) || '[]'))
document.querySelectorAll('.chip input').forEach((el) => {
  if (saved.has(el.dataset.k)) el.checked = true
  el.addEventListener('change', () => {
    el.checked ? saved.add(el.dataset.k) : saved.delete(el.dataset.k)
    localStorage.setItem(KEY, JSON.stringify([...saved]))
  })
})
</script>`

const 낼곳 = process.argv[2] || '/tmp/재료발주-0812.html'
fs.writeFileSync(낼곳, html, 'utf8')
console.log('✅', 낼곳, '·', 총, '컷 · 이미 있음', 있음수)
