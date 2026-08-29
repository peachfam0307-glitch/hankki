// 🛒🗓 **주부의 장바구니 「1주에 3개씩」 검수판** — 창업자가 폰에서 판정한다.
//
//   📮 창업자 확정 2026-08-29 = *"그럼 1주에 3개씩 올리자"* ＋ *"레시피랑 마찬가지로 **장바구니도 선 검수하고 나갈거야.**"*
//      → 그래서 이 판은 «순서»만 묻지 않는다. **제품 설명 글도 같이 읽게** 펼친다(규칙 13 확장).
//
//   ⭐⭐ **값은 여기서 «다시 뜯지» 않는다** — `release-calendar.mjs` 의 `cartItems()` 를 부른다(절대원칙 30).
//      ⛔ 판이 앱을 «흉내»내면 조용히 어긋난다(2026-08-17 문체 사고 · 2026-08-24 잔량표시 판).
//
//   ☑️ 절대원칙(2026-08-19) = **검수판은 무조건 «체크 ＋ 복사»** — 폰에서 판정하고 그대로 붙여넣게.
//      ⛔ `clipboard.writeText()` 는 성공으로 resolve 되고도 실제 복사가 안 되는 폰이 있다(v10.97)
//         → 실패하면 글자를 «골라 준다»(Range).
//
// 쓰는 법
//   node scripts/_판-장바구니드립-0829.mjs [낼파일]      (기본 = scratchpad 아래)
import { writeFileSync } from 'node:fs'
import { cartItems, todayKST } from './release-calendar.mjs'

const 오늘 = todayKST()
const 전부 = cartItems()
const 열림 = 전부.filter((i) => !i.from)
const 대기 = 전부.filter((i) => i.from)

// ── 주차로 묶기 ────────────────────────────────────────────────
const 주 = new Map()
for (const it of 대기) {
  if (!주.has(it.from)) 주.set(it.from, [])
  주.get(it.from).push(it)
}
const 주차 = [...주.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([날, 목록], i) => ({
  날, 번호: i + 1, 목록,
  dday: Math.round((Date.parse(날) - Date.parse(오늘)) / 86400000),
  갈래겹침: new Set(목록.map((x) => x.cat)).size < 목록.length,
  몰겹침: new Set(목록.map((x) => x.mall || 'naver')).size < 목록.length,
}))

// ⛔ 몰이 비면 앱이 «네이버 통합검색으로 폴백»한다(`curation.js` 523줄) — 판에도 그렇게 적는다
// ⛔⛔ `hansalim` 은 «몰»이 아니라 **표식**이다 — v11.00 확정 = 조합원이 아니면 어디로 보내도 못 사니
//    사러가기를 «아예» 안 단다. 검수판에서 이걸 「hansalim」이라고 날것으로 보여주면 안 된다.
const 몰이름 = {
  coupang: '쿠팡', kurly: '컬리', icoop: '자연드림', oasis: '오아시스', naver: '네이버',
  hansalim: '한살림 · 조합원 전용', 직접: '직접 링크', '': '네이버(기본)',
}

const 데이터 = {
  오늘,
  주차: 주차.map((w) => ({
    d: w.날, n: w.번호, dd: w.dday, cx: w.갈래겹침, mx: w.몰겹침,
    it: w.목록.map((x) => ({ n: x.name, b: x.brand, c: x.cat, m: 몰이름[x.mall] ?? x.mall, t: x.benefit, h: x.mall === 'hansalim' })),
  })),
  열림: 열림.map((x) => ({ n: x.name, b: x.brand, c: x.cat, m: 몰이름[x.mall] ?? x.mall, t: x.benefit, h: x.mall === 'hansalim' })),
}

const 갈래겹친주 = 주차.filter((w) => w.갈래겹침).length
const 몰겹친주 = 주차.filter((w) => w.몰겹침).length

const html = `<title>주부의 장바구니 드립 순서</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap">
<style>
:root{
  --ground:#faf6ef; --surface:#fff; --sunk:#f4ede2;
  --line:#e6dccd; --line-soft:#f0e9dd;
  --ink:#2e2117; --ink2:#6f6154; --ink3:#9c8d7e;
  --accent:#8a4a26; --accent-soft:#f7eae0;
  --open:#3f6b45; --open-soft:#e9f0e7;
  --warn:#9a6a1e; --warn-soft:#f8efdc;
  --shadow:0 1px 2px rgba(70,48,30,.06), 0 6px 18px rgba(70,48,30,.05);
  --serif:"Gowun Batang", "Nanum Myeongjo", Georgia, serif;
  --sans:-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", system-ui, sans-serif;
}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
  --ground:#1b1714; --surface:#241f1a; --sunk:#2d2620;
  --line:#3c332b; --line-soft:#302921;
  --ink:#f2e9dd; --ink2:#bcae9e; --ink3:#8a7d6f;
  --accent:#e0a578; --accent-soft:#3a2a1e;
  --open:#96c49d; --open-soft:#24332a;
  --warn:#d6ac62; --warn-soft:#352a17;
  --shadow:0 1px 2px rgba(0,0,0,.3), 0 6px 18px rgba(0,0,0,.25);
}}
:root[data-theme="dark"]{
  --ground:#1b1714; --surface:#241f1a; --sunk:#2d2620;
  --line:#3c332b; --line-soft:#302921;
  --ink:#f2e9dd; --ink2:#bcae9e; --ink3:#8a7d6f;
  --accent:#e0a578; --accent-soft:#3a2a1e;
  --open:#96c49d; --open-soft:#24332a;
  --warn:#d6ac62; --warn-soft:#352a17;
  --shadow:0 1px 2px rgba(0,0,0,.3), 0 6px 18px rgba(0,0,0,.25);
}
*{box-sizing:border-box}
body{background:var(--ground); color:var(--ink); font-family:var(--sans); font-size:15px; line-height:1.6;
  -webkit-text-size-adjust:100%; padding-bottom:96px}
.wrap{max-width:720px; margin:0 auto; padding:0 16px}
h1,h2,h3{font-family:var(--serif); font-weight:700; text-wrap:balance; margin:0}
a{color:var(--accent)}

/* ── 머리 ── */
header{padding:34px 0 18px}
.eyebrow{font-size:12px; letter-spacing:.07em; color:var(--accent); font-weight:700}
h1{font-size:30px; line-height:1.25; margin:10px 0 8px}
.lede{color:var(--ink2); font-size:15px; max-width:60ch}
.quote{margin:18px 0 0; padding:12px 16px; background:var(--accent-soft); border-radius:12px;
  font-family:var(--serif); font-size:15px; color:var(--ink)}
.quote b{font-weight:700}

/* ── 요약 ── */
.stats{display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:10px; margin:20px 0 0}
.stat{background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:12px 14px; box-shadow:var(--shadow)}
.stat .k{font-size:11.5px; letter-spacing:.06em; color:var(--ink3); font-weight:700}
.stat .v{font-family:var(--serif); font-size:25px; font-weight:700; line-height:1.2; font-variant-numeric:tabular-nums; margin-top:2px}
.stat .s{font-size:12px; color:var(--ink2)}
.stat .s.tight{font-size:11.5px; letter-spacing:-.01em; font-variant-numeric:tabular-nums}
.note{margin:14px 0 0; padding:13px 15px; border:1px dashed var(--line); border-radius:12px;
  background:var(--surface); font-size:13.5px; color:var(--ink2)}
.note b{color:var(--ink)}

/* ── 조작 ── */
.bar{position:sticky; top:0; z-index:20; background:color-mix(in srgb, var(--ground) 92%, transparent);
  backdrop-filter:blur(10px); border-bottom:1px solid var(--line); margin-top:22px}
.bar .in{max-width:720px; margin:0 auto; padding:10px 16px; display:flex; gap:8px; align-items:center; flex-wrap:wrap}
.chips{display:flex; gap:6px; flex-wrap:wrap}
.chip{appearance:none; border:1px solid var(--line); background:var(--surface); color:var(--ink2);
  font:inherit; font-size:13px; padding:7px 12px; border-radius:999px; cursor:pointer}
.chip[aria-pressed="true"]{background:var(--ink); color:var(--ground); border-color:var(--ink)}
.chip:focus-visible,.seg button:focus-visible,input:focus-visible,.copy:focus-visible{outline:2px solid var(--accent); outline-offset:2px}
input[type=search]{flex:1; min-width:130px; font:inherit; font-size:14px; padding:7px 12px; color:var(--ink);
  background:var(--surface); border:1px solid var(--line); border-radius:999px}
.done{font-size:12.5px; color:var(--ink3); font-variant-numeric:tabular-nums; white-space:nowrap}

/* ── 달 구분 ── */
/* ⛔ 붙박이 조작줄이 칸 머리를 덮는다 — 스크롤해 가면 날짜가 안 보였다(2026-08-29 실물로 잡았다).
   ⛔ 값을 손으로 박으면 «안 맞는다» — 390px 에선 칩이 두 줄로 접혀 줄이 104px, 넓은 화면에선 한 줄이다.
      → 아래 JS 가 실제 높이를 재서 「--barh」 에 넣는다.
   ⛔ 이 주석 안에서 백틱을 쓰지 말 것 — 이 파일 전체가 «템플릿 리터럴»이라 백틱 하나가 문자열을 끊는다
      (2026-08-29 실제로 여기서 죽었다 · v10.86~88 「백틱 지뢰」와 같은 자리). 낫표「」로 쓴다. */
.week,.month{scroll-margin-top:calc(var(--barh, 104px) + 10px)}
.month{display:flex; align-items:center; gap:12px; margin:30px 0 12px}
.month span{font-family:var(--serif); font-size:14px; font-weight:700; color:var(--ink3); letter-spacing:.04em; white-space:nowrap}
.month i{flex:1; height:1px; background:var(--line)}

/* ── 주차 칸 ── */
.week{background:var(--surface); border:1px solid var(--line); border-radius:16px; margin:10px 0;
  box-shadow:var(--shadow); overflow:hidden}
.week.now{border-color:var(--open); box-shadow:0 0 0 1px var(--open), var(--shadow)}
.whead{display:flex; align-items:baseline; gap:10px; padding:13px 16px 9px; border-bottom:1px solid var(--line-soft); flex-wrap:wrap}
.wdate{font-family:var(--serif); font-size:19px; font-weight:700; font-variant-numeric:tabular-nums}
.wno{font-size:11.5px; font-weight:700; letter-spacing:.06em; color:var(--ink3)}
.wdd{margin-left:auto; font-size:12.5px; font-variant-numeric:tabular-nums; color:var(--ink3); white-space:nowrap}
.badge{font-size:11.5px; font-weight:700; padding:3px 8px; border-radius:999px; white-space:nowrap}
.b-now{background:var(--open-soft); color:var(--open)}
.b-dup{background:var(--warn-soft); color:var(--warn)}

.items{list-style:none; margin:0; padding:4px 0}
.item{padding:10px 16px; border-top:1px solid var(--line-soft)}
.item:first-child{border-top:0}
.iname{font-weight:700; font-size:15.5px; line-height:1.4}
.iname .br{color:var(--accent); font-weight:700}
.tags{display:flex; gap:6px; flex-wrap:wrap; margin:5px 0 0}
.tag{font-size:11.5px; padding:2.5px 8px; border-radius:6px; background:var(--sunk); color:var(--ink2); white-space:nowrap}
.tag.cat{color:var(--ink); font-weight:700}
.tag.hs{background:var(--warn-soft); color:var(--warn); font-weight:700}
.ibene{margin:7px 0 0; font-size:13.5px; color:var(--ink2); line-height:1.62}

.judge{display:flex; gap:8px; align-items:center; padding:11px 16px; background:var(--sunk); flex-wrap:wrap}
.seg{display:flex; gap:4px; background:var(--surface); border:1px solid var(--line); border-radius:10px; padding:3px}
.seg button{appearance:none; border:0; background:transparent; color:var(--ink2); font:inherit; font-size:13px;
  font-weight:700; padding:7px 11px; border-radius:7px; cursor:pointer; min-height:34px}
.seg button[aria-pressed="true"]{background:var(--ink); color:var(--ground)}
.seg button[data-v="좋아"][aria-pressed="true"]{background:var(--open); color:#fff}
.seg button[data-v="바꾸자"][aria-pressed="true"]{background:var(--accent); color:#fff}
.judge input[type=text]{flex:1; min-width:150px; font:inherit; font-size:13.5px; padding:8px 11px; color:var(--ink);
  background:var(--surface); border:1px solid var(--line); border-radius:9px}

/* ── 이미 열린 것 ── */
details{margin:34px 0 0; background:var(--surface); border:1px solid var(--line); border-radius:16px; box-shadow:var(--shadow)}
summary{cursor:pointer; padding:14px 16px; font-family:var(--serif); font-size:16px; font-weight:700}
summary::marker{color:var(--ink3)}
details .items{padding:0 0 6px}
details .item{border-top:1px solid var(--line-soft)}

/* ── 복사 ── */
.foot{margin:30px 0 0}
.copy{width:100%; appearance:none; border:0; background:var(--ink); color:var(--ground); font:inherit;
  font-weight:700; font-size:15px; padding:15px; border-radius:14px; cursor:pointer; min-height:52px}
.copy:active{transform:translateY(1px)}
.out{margin:12px 0 0; white-space:pre-wrap; font-size:13px; line-height:1.7; color:var(--ink2);
  background:var(--surface); border:1px solid var(--line); border-radius:12px; padding:14px; overflow-x:auto}
.hint{font-size:12.5px; color:var(--ink3); margin:8px 0 0}
footer{margin:40px 0 0; padding:18px 0 0; border-top:1px solid var(--line); font-size:12.5px; color:var(--ink3)}
</style>

<div class="wrap">
<header>
  <div class="eyebrow">주부의 장바구니 · 선 검수</div>
  <h1>85개를 29주에 걸쳐<br>1주에 3개씩 엽니다</h1>
  <p class="lede">아래 순서대로 «저절로» 열립니다. 제가 푸시를 안 해도 그날이 되면 유저 앞에 나타나요.
     그래서 <b>나가기 전에 창업자가 다 보는 자리</b>가 이 판입니다.</p>
  <p class="quote">📮 <b>“1주에 2개씩 넣기로 하지 않았어??”</b> → <b>“그럼 1주에 3개씩 올리자”</b><br>
     📮 <b>“레시피랑 마찬가지로 장바구니도 선 검수하고 나갈거야.”</b></p>

  <div class="stats">
    <div class="stat"><div class="k">이미 열려 있는 것</div><div class="v">${열림.length}</div><div class="s">안 건드렸어요</div></div>
    <div class="stat"><div class="k">새로 여는 것</div><div class="v">${대기.length}</div><div class="s">1주에 3개씩</div></div>
    <div class="stat"><div class="k">걸리는 기간</div><div class="v">${주차.length}<span style="font-size:15px">주</span></div><div class="s tight">${주차[0].날} → ${주차[주차.length - 1].날}</div></div>
    <div class="stat"><div class="k">다 돌면</div><div class="v">${전부.length}</div><div class="s">${열림.length}개 → ${전부.length}개</div></div>
  </div>

  <p class="note">⛔ <b>왜 고쳤나</b> — 어제(8/28) 한 판에 <b>82개가 한꺼번에</b> 열렸어요(42 → 124).
     운영 방침이 <b>“양보다 엄선 · 아무거나 잔뜩 = 신뢰 희석”</b>이라 그 반대로 간 거예요.</p>
  <p class="note">🔀 <b>섞임</b> — 한 주에 같은 갈래나 같은 몰이 몰리지 않게 두 축을 동시에 폈어요.
     갈래가 겹친 주 <b>${갈래겹친주}/${주차.length}</b> · 몰이 겹친 주 <b>${몰겹친주}/${주차.length}</b>. 겹친 주엔 <span class="badge b-dup">겹침</span> 표를 달아 뒀어요.</p>
  <p class="note">🌱 <b>한살림 ${대기.filter((i) => i.mall === 'hansalim').length}개</b>는 <span class="badge b-dup">한살림 · 조합원 전용</span> 으로 표시돼요 —
     조합원이 아니면 어디로 보내도 못 사서 <b>사러가기를 아예 안 답니다</b>(v11.00 확정). 대신 “매장에서 만나요”가 떠요.</p>
  <p class="note">✍️ <b>어제 창업자가 써 준 넷</b> — 성가정 우리콩 진간장은 <b>이미 열려 있는 제품</b>이라 문구만 바뀌어 바로 나가요.
     샘표 우리콩 양조간장 <b>8/29</b> · 설성목장 한우 사골 곰탕 스틱 <b>9/5</b> · 마야항아리 기버터 <b>9/12</b>.</p>
</header>
</div>

<div class="bar"><div class="in">
  <div class="chips">
    <button class="chip" data-f="전체" aria-pressed="true">전체</button>
    <button class="chip" data-f="안정함" aria-pressed="false">아직 안 정함</button>
    <button class="chip" data-f="바꾸자" aria-pressed="false">바꾸자</button>
    <button class="chip" data-f="겹침" aria-pressed="false">겹친 주</button>
  </div>
  <input type="search" id="q" placeholder="제품 이름·갈래 찾기" aria-label="제품 이름이나 갈래로 찾기">
  <span class="done" id="done"></span>
</div></div>

<div class="wrap">
  <div id="list"></div>

  <details>
    <summary>이미 열려 있는 ${열림.length}개 — 이번에 안 건드렸어요</summary>
    <ul class="items" id="openlist"></ul>
  </details>

  <div class="foot">
    <button class="copy" id="copy">판정 복사하기</button>
    <p class="hint">복사가 안 되면 아래 글자가 «골라진 채»로 나와요. 길게 눌러서 복사하면 됩니다.</p>
    <div class="out" id="out" hidden></div>
  </div>

  <footer>
    값은 <code>curation.js</code> 를 앱과 «같은 곳»에서 읽어 그렸어요 —
    판이 앱을 흉내내지 않습니다. 오늘 = ${오늘} (KST).<br>
    고른 것은 이 폰 안에만 저장돼요(새로고침해도 안 날아갑니다).
  </footer>
</div>

<script>
const DATA = ${JSON.stringify(데이터)};
const KEY = 'hankki:장바구니드립:0829';
let 고름 = {}, 메모 = {};
try { const r = JSON.parse(localStorage.getItem(KEY) || '{}'); 고름 = r.고름 || {}; 메모 = r.메모 || {}; } catch (e) {}
const 저장 = () => { try { localStorage.setItem(KEY, JSON.stringify({ 고름, 메모 })); } catch (e) {} };

const el = (t, c, x) => { const n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; };
const 달 = (d) => d.slice(0, 4) + '년 ' + Number(d.slice(5, 7)) + '월';
const 날 = (d) => Number(d.slice(5, 7)) + '월 ' + Number(d.slice(8, 10)) + '일';

function 제품칸(it) {
  const li = el('li', 'item');
  const nm = el('div', 'iname');
  if (it.b) { const b = el('span', 'br', it.b); nm.append(b, document.createTextNode(' ')); }
  nm.append(document.createTextNode(it.n));
  li.append(nm);
  const tg = el('div', 'tags');
  // ⛔ 한살림은 «사러가기가 없는» 제품이다(v11.00) — 눈에 띄게 갈라 준다
  tg.append(el('span', 'tag cat', it.c), el('span', 'tag' + (it.h ? ' hs' : ''), it.m));
  li.append(tg);
  if (it.t) li.append(el('p', 'ibene', it.t));
  return li;
}

function 주차칸(w) {
  const sec = el('section', 'week' + (w.dd <= 0 ? ' now' : ''));
  sec.dataset.d = w.d;
  const h = el('div', 'whead');
  h.append(el('span', 'wdate', 날(w.d)), el('span', 'wno', w.n + '주차'));
  if (w.dd <= 0) h.append(el('span', 'badge b-now', '오늘 열려요'));
  if (w.cx || w.mx) h.append(el('span', 'badge b-dup', (w.cx ? '갈래' : '몰') + ' 겹침'));
  h.append(el('span', 'wdd', w.dd <= 0 ? '지금' : 'D-' + w.dd));
  sec.append(h);

  const ul = el('ul', 'items');
  w.it.forEach((it) => ul.append(제품칸(it)));
  sec.append(ul);

  const j = el('div', 'judge');
  const seg = el('div', 'seg');
  ['좋아', '바꾸자', '모르겠어'].forEach((v) => {
    const b = el('button', null, v);
    b.type = 'button'; b.dataset.v = v;
    b.setAttribute('aria-pressed', String(고름[w.d] === v));
    b.onclick = () => {
      고름[w.d] = 고름[w.d] === v ? undefined : v;
      if (!고름[w.d]) delete 고름[w.d];
      저장(); 그리기();
    };
    seg.append(b);
  });
  const memo = el('input');
  memo.type = 'text'; memo.placeholder = '바꿀 게 있으면 여기에 (예: 기버터를 앞으로)';
  memo.value = 메모[w.d] || '';
  memo.setAttribute('aria-label', 날(w.d) + ' 메모');
  memo.oninput = () => { 메모[w.d] = memo.value; 저장(); 셈(); };
  j.append(seg, memo);
  sec.append(j);
  return sec;
}

let 거르기 = '전체', 찾기 = '';
function 보이나(w) {
  if (거르기 === '안정함' && 고름[w.d]) return false;
  if (거르기 === '바꾸자' && 고름[w.d] !== '바꾸자') return false;
  if (거르기 === '겹침' && !(w.cx || w.mx)) return false;
  if (찾기) {
    const hay = (w.d + ' ' + w.it.map((i) => [i.n, i.b, i.c, i.m, i.t].join(' ')).join(' ')).toLowerCase();
    if (!hay.includes(찾기)) return false;
  }
  return true;
}

function 셈() {
  const n = DATA.주차.filter((w) => 고름[w.d]).length;
  const c = DATA.주차.filter((w) => 고름[w.d] === '바꾸자').length;
  document.getElementById('done').textContent = n + '/' + DATA.주차.length + ' 판정' + (c ? ' · 바꾸자 ' + c : '');
}

function 그리기() {
  const list = document.getElementById('list');
  list.textContent = '';
  let 이전달 = '';
  const 보임 = DATA.주차.filter(보이나);
  if (!보임.length) { list.append(el('p', 'note', '찾는 게 없어요.')); 셈(); return; }
  보임.forEach((w) => {
    if (달(w.d) !== 이전달) {
      이전달 = 달(w.d);
      const m = el('div', 'month');
      m.append(el('span', null, 이전달), el('i'));
      list.append(m);
    }
    list.append(주차칸(w));
  });
  셈();
}

document.querySelectorAll('.chip').forEach((c) => {
  c.onclick = () => {
    거르기 = c.dataset.f;
    document.querySelectorAll('.chip').forEach((o) => o.setAttribute('aria-pressed', String(o === c)));
    그리기();
  };
});
document.getElementById('q').oninput = (e) => { 찾기 = e.target.value.trim().toLowerCase(); 그리기(); };

// ⛔ 붙박이 조작줄 높이를 «재서» 넣는다 — 칩이 접히면 높이가 달라진다(위 CSS 주석 참조)
const bar = document.querySelector('.bar');
const 줄높이 = () => document.documentElement.style.setProperty('--barh', bar.offsetHeight + 'px');
줄높이();
if (window.ResizeObserver) new ResizeObserver(줄높이).observe(bar);
else addEventListener('resize', 줄높이);

const ol = document.getElementById('openlist');
DATA.열림.forEach((it) => ol.append(제품칸(it)));
그리기();

document.getElementById('copy').onclick = async () => {
  const 줄 = ['주부의 장바구니 드립 순서 — 창업자 판정 (' + DATA.오늘 + ')'];
  let n = 0;
  DATA.주차.forEach((w) => {
    const g = 고름[w.d], m = (메모[w.d] || '').trim();
    if (!g && !m) return;
    n++;
    줄.push('');
    줄.push('· ' + w.d + ' (' + w.n + '주차) — ' + (g || '(고름 없음)'));
    줄.push('  ' + w.it.map((i) => (i.b ? i.b + ' ' : '') + i.n).join(' / '));
    if (m) 줄.push('  ✍️ ' + m);
  });
  if (!n) 줄.push('', '(아직 아무것도 안 골랐어요)');
  const 글 = 줄.join('\\n');
  const out = document.getElementById('out');
  out.textContent = 글;
  out.hidden = false;
  const btn = document.getElementById('copy');
  try {
    await navigator.clipboard.writeText(글);
    btn.textContent = '복사했어요 ✓';
  } catch (e) {
    btn.textContent = '아래 글자를 길게 눌러 복사해 주세요';
    const r = document.createRange();
    r.selectNodeContents(out);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    out.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  setTimeout(() => { btn.textContent = '판정 복사하기'; }, 3000);
};
</script>
`

const 낼곳 = process.argv[2] || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/장바구니드립-0829.html'
writeFileSync(낼곳, html)
console.log(`✅ ${낼곳}`)
console.log(`   주차 ${주차.length} · 새로 여는 것 ${대기.length} · 이미 열린 것 ${열림.length}`)
console.log(`   갈래 겹친 주 ${갈래겹친주}/${주차.length} · 몰 겹친 주 ${몰겹친주}/${주차.length}`)
console.log(`   ${(html.length / 1024).toFixed(0)}KB`)
