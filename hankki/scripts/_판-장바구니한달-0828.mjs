// 🛒🛒 「주부의 장바구니 · 이번 주 픽」 한 달치 검수판 (2026-08-28)
//
// 📮 창업자 = *"주부의 장바구니는 아마 나가는 순서는 네가 짜뒀을거야. **한달치 내가 적을게 검수판 만들어줘.**"*
// 📮 ＋ *"이번주제철, 우리집레시피, 장바구니 **나가는 요일 달력에 박자.**"*
//
// ⭐⭐ 「순서를 짜뒀다」가 맞다 — 다만 **손으로 적은 목록이 아니라 «날짜가 돌린다».**
//    `weeklypick.js` 의 `pickRotate` 가 ①새로 올린 것(4주) → ②이번 주 레시피가 쓰는 것 → ③회전 으로 고른다.
//    그래서 **미리 뽑아 보여줄 수 있고, 그게 앱에 진짜로 나갈 값이다.**
//
// ⛔⛔ **흉내 내지 않는다** — 앱이 쓰는 바로 그 모듈을 부른다(절대원칙 30).
//    · 도는 규칙 = `src/data/weeklypick.js` 의 `pickRotate` (그대로 import)
//    · 그 주 레시피 = `src/data/weekly.js` 의 `weeklyNow` ＋ `src/data/basics.js`
//    · 제품 목록만 «글자로» 읽는다 — `curation.js` 는 `import.meta.glob`(Vite 전용)이라 노드가 못 연다.
//      (배포 게이트 `check-weeklypick.mjs` 가 쓰는 것과 같은 처방)
//    ⚠️ 그래서 「재료에 붙는 판정(matched)」만 이 판이 «같은 규칙으로 다시 구현»한다 —
//       `picksForIngredients`(curation.js:285)의 두 갈래(풀네임 · matches 낱말 시작)를 그대로 옮겼다.
//       ⛔ 그 함수가 바뀌면 여기도 같이 고쳐야 한다. 판 맨 위에 그렇게 적어 둔다.
//
// 🗓 **나가는 요일 — 실측(코드에서 잰 값)**
//    · 🌾 이번 주 제철   = **월요일** (`weekly.js` 의 `from` 19개가 전부 월요일)
//    · 🍚 우리집 레시피 = **월요일** (`HOMEMADE` 의 `from` 도 전부 월요일 — 제철과 한 짝이다)
//    · 🛒 장바구니 이번 주 픽 = **목요일** (`weekNo` = 에폭 주차라 목요일 00:00 KST 에 넘어간다)
//    ⚠️⚠️ **셋이 안 맞는다** — 픽은 「이번 주 레시피가 쓰는 것」을 앞에 세우는데
//       레시피는 월요일에 바뀌고 회전은 목요일에 바뀐다. 그래서 픽이 **한 주에 두 번** 움직인다.
//       ⛔ 이건 고장이 아니라 «설계가 그렇게 된 것»이다. 고칠지는 창업자 판정(규칙 11) → 판 맨 위에 물어 둔다.
//
// 실행: node /home/user/hankki/hankki/scripts/_판-장바구니한달-0828.mjs [시작날짜]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { pickRotate } from '../src/data/weeklypick.js'
import { weeklyNow, homemadeNow, todayKST } from '../src/data/weekly.js'
import { allBasicRecipes } from '../src/data/basics.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/판'
mkdirSync(OUT, { recursive: true })

// ── 제품 읽기 (글자로) ─────────────────────────────────────────────
const src = readFileSync(join(HERE, '../src/data/curation.js'), 'utf8')
const 딴것 = (s, k) => { const m = s.match(new RegExp(`${k}:\\s*'((?:[^'\\\\]|\\\\.)*)'`)); return m ? m[1].replace(/\\'/g, "'") : '' }
const PRODUCTS = []
let 지금갈래 = ''
for (const 줄 of src.split('\n')) {
  const c = 줄.match(/^\s*cat:\s*'([^']+)'/)
  if (c) 지금갈래 = c[1]
  const t = 줄.trim()
  if (!t.startsWith('{ name:')) continue
  const matches = (줄.match(/matches:\s*\[([^\]]*)\]/) || [, ''])[1]
    .split(',').map((s) => s.trim().replace(/^'|'$/g, '')).filter(Boolean)
  PRODUCTS.push({
    cat: 지금갈래,
    name: 딴것(줄, 'name'),
    brand: 딴것(줄, 'brand'),
    tag: 딴것(줄, 'tag'),
    benefit: 딴것(줄, 'benefit'),
    since: 딴것(줄, 'since'),
    mall: 딴것(줄, 'mall'),
    matches,
  })
}
// 🔒 글자로 읽는 방식이 깨졌으면 «죽는다» — 조용히 반쪽 목록으로 판을 내면 창업자가 헛검수한다
if (PRODUCTS.length < 30) { console.error(`⛔ 제품을 ${PRODUCTS.length}개밖에 못 읽었다 — curation.js 형식이 바뀌었나`); process.exit(1) }
const 설명없음 = PRODUCTS.filter((p) => !p.benefit).length
console.log(`📦 제품 ${PRODUCTS.length}개 · ${new Set(PRODUCTS.map((p) => p.cat)).size}갈래 · 설명 빈 것 ${설명없음}개`)

// ── 「재료에 붙나」 — curation.js:285 `picksForIngredients` 와 «같은 규칙» ──
const 붙는것 = (재료들 = []) => {
  const 글 = 재료들.join('  ')
  const 토막 = 재료들.flatMap((i) => String(i).split(/[\s,()·/]+/)).filter(Boolean)
  const 앞으로맞나 = (w) => 토막.some((t) => t.startsWith(w))
  const direct = [], byWord = []
  for (const p of PRODUCTS) {
    if (p.name && 글.includes(p.name)) direct.push(p)
    else if ((p.matches || []).some((w) => w && 앞으로맞나(w))) byWord.push(p)
  }
  return [...direct, ...byWord]
}

// ── 날짜 ───────────────────────────────────────────────────────────
const 요일 = ['일', '월', '화', '수', '목', '금', '토']
const 낮 = (ymd) => new Date(`${ymd}T03:00:00Z`)                  // 12:00 KST — todayKST 가 그날로 읽는다
const 더하기 = (ymd, n) => { const d = new Date(`${ymd}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const 요일글 = (ymd) => 요일[new Date(`${ymd}T00:00:00Z`).getUTCDay()]

const 오늘 = process.argv[2] || todayKST()
// 이번 주 목요일(장바구니가 바뀌는 날)부터 — 지난 목요일이 이번 주의 시작이다
let 목 = 오늘
while (요일글(목) !== '목') 목 = 더하기(목, -1)

const R = allBasicRecipes
const 주들 = []
for (let i = 0; i < 5; i++) {                                      // 한 달치 = 다섯 주
  const 시작 = 더하기(목, i * 7)
  const 끝 = 더하기(시작, 6)
  const d = 낮(시작)
  const wk = weeklyNow(R, d)
  const hm = homemadeNow(R, d)
  const 재료 = [wk, hm].filter(Boolean).flatMap((x) => (x.items || []).flatMap((r) => [...(r.ingredients || []), r.memo || '']))
  const matched = 붙는것(재료)
  const 픽 = pickRotate({ products: PRODUCTS, matched, today: 시작, n: 4 })
  // 🌾🍚 그 주에 «월요일»에 열리는 것도 같이 보여준다 — 창업자가 요일을 달력에 박자고 했다
  주들.push({
    시작, 끝,
    월: (() => { let m = 시작; while (요일글(m) !== '월') m = 더하기(m, 1); return m })(),
    제철: wk ? wk.title : '(없음)',
    제철편: wk ? (wk.items || []).map((r) => r.title) : [],
    우리집: hm ? (hm.items || []).map((r) => r.title) : [],
    픽,
    붙은수: matched.length,
  })
}

// ── 판 그리기 ──────────────────────────────────────────────────────
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
let n = 0
const 주칸 = 주들.map((w, wi) => {
  const 카드 = w.픽.map((p) => {
    n++
    const 새것 = p.since ? ' <span class="new">새로 올린 것</span>' : ''
    const 한살림 = p.mall === 'hansalim' ? ' <span class="hs">한살림 · 조합원 전용</span>' : ''
    return `<div class="card" data-q="${n}">
      <div class="hd"><b>${esc(p.name)}</b>${p.brand ? `<span class="br">${esc(p.brand)}</span>` : ''}${p.tag ? `<span class="tg">${esc(p.tag)}</span>` : ''}${새것}${한살림}</div>
      <div class="cat">${esc(p.cat)}</div>
      <div class="ben">${p.benefit ? esc(p.benefit) : '<i class="none">설명이 비어 있어요 — 여기에 적어주세요</i>'}</div>
      <div class="judge">
        <label class="ok"><input type="checkbox" class="ck"> <span>이대로 좋아</span></label>
        <label class="bad"><input type="checkbox" class="ck"> <span>고칠래</span></label>
      </div>
      <textarea class="memo" rows="2" placeholder="고칠 말 · 새로 쓸 설명"></textarea>
    </div>`
  }).join('')
  return `<section class="wk">
    <h2>${wi === 0 ? '이번 주' : `${wi}주 뒤`} <span class="dt">${w.시작} (목) ~ ${w.끝}</span></h2>
    <div class="week-meta">
      <div><span class="k mon">월 ${w.월}</span> 🌾 이번 주 제철 <b>${esc(w.제철)}</b>${w.제철편.length ? ` · ${esc(w.제철편.join(' · '))}` : ''}</div>
      <div><span class="k mon">월 ${w.월}</span> 🍚 우리집 레시피 <b>${w.우리집.length ? esc(w.우리집.join(' · ')) : '(없음)'}</b></div>
      <div><span class="k thu">목 ${w.시작}</span> 🛒 장바구니 픽 4개 <span class="sub">(이번 주 레시피에 붙은 제품 ${w.붙은수}개)</span></div>
    </div>
    <div class="cards">${카드}</div>
  </section>`
}).join('')

const HTML = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>주부의 장바구니 한 달치</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=Jua&display=swap">
<style>
:root{--bg:#faf7f2;--card:#fff;--line:#e6ddcf;--text:#3b2b1a;--sub:#8b7a63;--brown:#5d3410;
      --ok:#2f6b4f;--okbg:#e8f3ec;--bad:#b23b3b;--badbg:#fbeaea;--thu:#2a5b8c;--mon:#7a5a2a}
*{box-sizing:border-box}
body{margin:0;padding:0 0 96px;background:var(--bg);color:var(--text);
     font-family:'Gowun Dodum',system-ui,-apple-system,sans-serif;line-height:1.6}
header{padding:22px 16px 14px;background:var(--brown);color:#fffdf8}
header h1{margin:0 0 6px;font-family:'Jua',system-ui,sans-serif;font-size:23px;letter-spacing:-.02em}
header p{margin:0;font-size:13.5px;opacity:.9}
.days{display:flex;gap:8px;flex-wrap:wrap;margin:12px 16px 0}
.day{flex:1 1 150px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:10px 12px}
.day b{display:block;font-size:15px}
.day span{font-size:12.5px;color:var(--sub)}
.note{margin:12px 16px;padding:12px 14px;background:#fff6e8;border:1px solid #f0dcb8;border-radius:12px;font-size:13.5px}
.wk{margin:18px 16px 0;background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden}
.wk h2{margin:0;padding:13px 15px;background:#f3ece1;font-family:'Jua',system-ui,sans-serif;font-size:17px}
.wk h2 .dt{font-family:'Gowun Dodum',sans-serif;font-size:12.5px;color:var(--sub);margin-left:6px}
.week-meta{padding:11px 15px;border-bottom:1px solid var(--line);font-size:13.5px;display:grid;gap:5px}
.k{display:inline-block;min-width:96px;padding:1px 8px;border-radius:999px;font-size:11.5px;margin-right:6px}
.k.mon{background:#f6ecd9;color:var(--mon)}
.k.thu{background:#e6effa;color:var(--thu)}
.sub{color:var(--sub);font-size:12.5px}
.cards{padding:12px 15px 16px;display:grid;gap:12px}
.card{border:1px solid var(--line);border-radius:13px;padding:12px 13px;background:#fffdf9}
.hd{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.hd b{font-size:16px}
.br{font-size:11.5px;color:var(--sub);background:#f2ece2;padding:1px 7px;border-radius:999px}
.tg{font-size:11.5px;color:var(--thu);background:#e6effa;padding:1px 7px;border-radius:999px}
.new{font-size:11.5px;color:#8a5a00;background:#fdf0d5;padding:1px 7px;border-radius:999px}
.hs{font-size:11.5px;color:var(--bad);background:var(--badbg);padding:1px 7px;border-radius:999px}
.cat{font-size:12px;color:var(--sub);margin:2px 0 6px}
.ben{font-size:14px;margin-bottom:9px}
.ben .none{color:var(--bad)}
.judge{display:flex;gap:8px;margin-bottom:8px}
.judge label{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;
  padding:9px 6px;border:1.5px solid var(--line);border-radius:10px;font-size:13.5px;cursor:pointer;background:#fff}
.judge .ck{width:17px;height:17px;accent-color:currentColor}
.judge label.ok:has(.ck:checked){border-color:var(--ok);background:var(--okbg);color:var(--ok)}
.judge label.bad:has(.ck:checked){border-color:var(--bad);background:var(--badbg);color:var(--bad)}
textarea.memo{width:100%;border:1px solid var(--line);border-radius:10px;padding:8px 10px;
  font-family:inherit;font-size:13.5px;background:#fff;resize:vertical}
#bar{position:fixed;left:0;right:0;bottom:0;background:#fffdf8;border-top:1px solid var(--line);
  padding:10px 14px;display:flex;gap:10px;align-items:center}
#bar #cnt{flex:1;font-size:13px;color:var(--sub)}
#bar button{background:var(--brown);color:#fffdf8;border:0;border-radius:10px;padding:11px 16px;font-family:inherit;font-size:14.5px}
#out{margin:14px 16px;padding:12px;border:1px solid var(--line);border-radius:12px;background:#fff;display:none}
#out textarea{width:100%;height:190px;font-size:12.5px;font-family:ui-monospace,monospace}
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]){--bg:#1c1a17;--card:#25221e;--line:#3b352d;--text:#f0e8dc;--sub:#a99a86;
    --okbg:#1e3328;--badbg:#3a2222}
  :root:not([data-theme="light"]) .card,
  :root:not([data-theme="light"]) .wk,
  :root:not([data-theme="light"]) .day,
  :root:not([data-theme="light"]) #out,
  :root:not([data-theme="light"]) textarea.memo,
  :root:not([data-theme="light"]) .judge label{background:#25221e;color:var(--text)}
  :root:not([data-theme="light"]) .wk h2{background:#2f2b25}
  :root:not([data-theme="light"]) .note{background:#302818;border-color:#4a3d28}
}
</style></head><body>
<header>
  <h1>🛒 주부의 장바구니 — 한 달치</h1>
  <p>${오늘} 기준 · 다섯 주 · 제품 ${PRODUCTS.length}개 중 매주 4개가 나간다</p>
</header>

<div class="days">
  <div class="day"><b>🌾 이번 주 제철</b><span>월요일에 바뀐다</span></div>
  <div class="day"><b>🍚 우리집 레시피</b><span>월요일에 바뀐다</span></div>
  <div class="day"><b>🛒 장바구니 픽</b><span>목요일에 바뀐다</span></div>
</div>

<div class="note">
  ⚠️ <b>요일이 안 맞아.</b> 장바구니 픽은 「이번 주 레시피가 쓰는 제품」을 앞에 세우는데,
  <b>레시피는 월요일</b>에 바뀌고 <b>회전은 목요일</b>에 바뀌어서 <b>한 주에 두 번</b> 움직여.
  월~수 사흘은 새 레시피 ＋ 지난 회전이 섞인 상태야.
  <br>👉 <b>장바구니도 월요일로 맞출까?</b> (셋이 한 날에 같이 바뀐다) — 아래 맨 끝에서 골라줘.
</div>

${주칸}

<section class="wk">
  <h2>🗓 요일 판정</h2>
  <div class="cards">
    <div class="card" data-q="0">
      <div class="hd"><b>장바구니 픽 나가는 요일</b></div>
      <div class="ben">지금은 <b>목요일</b>이고, 제철·우리집 레시피는 <b>월요일</b>이야.</div>
      <div class="judge">
        <label class="ok"><input type="checkbox" class="ck"> <span>월요일로 맞추자</span></label>
        <label class="bad"><input type="checkbox" class="ck"> <span>목요일 그대로</span></label>
      </div>
      <textarea class="memo" rows="2" placeholder="다른 생각이 있으면 적어줘"></textarea>
    </div>
  </div>
</section>

<div id="out"><p>복사가 안 됐어 — <b>아래 글을 길게 눌러 전부 복사</b>해서 채팅에 붙여줘.</p><textarea readonly></textarea></div>
<div id="bar"><span id="cnt">고른 것 0개</span><button id="copy" type="button">📋 결과 복사</button></div>

<script>
/* 💾 저장 = localStorage (아티팩트에서 확실히 돈다) ＋ 📋 복사 (그 폰 안에만 남으니 «반드시» 같이 있어야 한다)
   ⛔ clipboard.writeText() 는 «성공으로 resolve 되고도» 실제 복사가 실패한다(v10.97 사고) → 폴백을 둔다 */
var KEY = 'hankki:장바구니한달:${오늘}'
var cards = [].slice.call(document.querySelectorAll('.card'))
var cnt = document.getElementById('cnt')
function 모으기(){
  var out = []
  cards.forEach(function(c){
    var ck = c.querySelectorAll('.ck')
    var 이름 = c.querySelector('.hd b').textContent
    var 좋아 = ck[0] && ck[0].checked, 고칠 = ck[1] && ck[1].checked
    var 메모 = (c.querySelector('.memo') || {}).value || ''
    if (좋아 || 고칠 || 메모.trim()) out.push({ q: c.dataset.q, n: 이름, a: !!좋아, b: !!고칠, m: 메모 })
  })
  return out
}
function 저장(){
  var out = 모으기()
  try { localStorage.setItem(KEY, JSON.stringify(out)) } catch (e) {}
  cnt.textContent = '고른 것 ' + out.length + '개'
}
function 되살리기(){
  var s = null
  try { s = JSON.parse(localStorage.getItem(KEY) || 'null') } catch (e) {}
  if (!s) return
  s.forEach(function(v){
    var c = cards.filter(function(x){ return x.dataset.q === v.q })[0]
    if (!c) return
    var ck = c.querySelectorAll('.ck')
    if (ck[0]) ck[0].checked = !!v.a
    if (ck[1]) ck[1].checked = !!v.b
    var m = c.querySelector('.memo'); if (m) m.value = v.m || ''
  })
  저장()
}
document.addEventListener('change', 저장)
document.addEventListener('input', 저장)
되살리기()

document.getElementById('copy').addEventListener('click', function(){
  var 줄 = ['🛒 주부의 장바구니 한 달치 검수 — ${오늘}', '']
  cards.forEach(function(c){
    var ck = c.querySelectorAll('.ck')
    var 이름 = c.querySelector('.hd b').textContent
    var 좋아 = ck[0] && ck[0].checked, 고칠 = ck[1] && ck[1].checked
    var 메모 = ((c.querySelector('.memo') || {}).value || '').trim()
    if (!좋아 && !고칠 && !메모) return
    줄.push((좋아 ? '✅ ' : 고칠 ? '✏️ ' : '· ') + 이름 + (메모 ? ' — ' + 메모 : ''))
  })
  if (줄.length === 2) 줄.push('(아직 고른 게 없어)')
  var 글 = 줄.join('\\n')
  var box = document.getElementById('out')
  box.style.display = 'block'
  box.querySelector('textarea').value = 글
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(글)
  } catch (e) {}
  cnt.textContent = '복사했어 — 안 됐으면 아래 글을 붙여줘'
  box.scrollIntoView({ behavior: 'smooth', block: 'center' })
})
</script>
</body></html>`

const 길 = join(OUT, '장바구니-한달-검수판.html')
writeFileSync(길, HTML)
// 📤 아티팩트용 — `<!doctype>`·`<html>`·`<head>`·`<body>` 는 올릴 때 «자동으로 씌워진다».
//    그대로 올리면 태그가 두 겹이 되니 알맹이만 뽑는다. `<title>`·`<style>` 은 맨 앞에 남긴다.
const 알맹이 = HTML
  .replace(/^[\s\S]*?<meta name="viewport"[^>]*>\s*/, '')
  .replace(/<\/body><\/html>\s*$/, '')
const 아티 = join(OUT, '장바구니-한달-아티팩트.html')
writeFileSync(아티, 알맹이)
console.log('')
for (const w of 주들) {
  console.log(`🗓 ${w.시작}(목) ~ ${w.끝}   월 ${w.월} · 🌾${w.제철} · 🍚${w.우리집.join('·') || '없음'}`)
  console.log(`   🛒 ${w.픽.map((p) => p.name).join(' · ')}   (레시피에 붙은 것 ${w.붙은수}개)`)
}
// 🔒 스스로 검사 — 「매주 다른 게 나오나」. 다 같으면 판을 낼 이유가 없다
const 첫주 = 주들[0].픽.map((p) => p.name).join('|')
const 다같나 = 주들.every((w) => w.픽.map((p) => p.name).join('|') === 첫주)
if (다같나) { console.error('\n⛔ 다섯 주가 «전부 같다» — 회전이 안 돈다'); process.exit(1) }
console.log(`\n📄 ${길}`)
