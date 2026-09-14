// 🛒🆕 「주부의 장바구니 — 아직 «안 올라간» 것」 검수판 (2026-08-28)
//
// 📮 창업자 = *"장바구니는 **새거 올리기로 했잖아. 있는거 돌려막기말고.** 내가 100개넘게 준거 같은데."*
//
// ⛔⛔ **창업자 말이 맞았다.** 내가 먼저 만든 판(`_판-장바구니한달-0828`)은
//    **이미 앱에 있는 42개를 주차로 돌린 것**이라 정확히 「돌려막기」였다.
//    🔢 실측 = 창업자가 2026-08-09 에 준 **100개** 중 앱에 들어간 것은 **5개**뿐.
//       (원본 = `docs/장바구니-창업자자료-2026-08-09.md` — ⛔한 글자도 안 고친 보존 문서)
//    📌 뿌리 = 「나가는 순서」만 물었다고 읽고 **「나갈 것이 있나」를 안 봤다.**
//       회전은 잘 도는데 **돌 것이 42개뿐**이었다.
//
// ⭐ 이 판이 하는 일 = **안 올라간 것을 갈래별로 다 펼치고, 창업자가 설명을 적게 한다.**
//    · 🌿자연드림 10 · 🌱한살림 8 = **창업자가 이미 설명을 다 써 줬다** → 「그대로 올릴까」만 물으면 된다
//    · 💜컬리 23 · 🚀쿠팡 40 · 🛍그 외 7 = **이름만** → 창업자가 적어야 앱에 올릴 수 있다
//      📮 창업자 원문(그 문서 머리) = *"다 적기 힘들어서.. 올라가기전에 검수할때 내용없는건 적어줄게."*
//
// ⛔ **설명 없이 올리지 않는다** — 우리가 파는 건 제품이 아니라 「18년차 주부의 손」이다.
//    이름만 있는 카드는 그냥 광고가 된다.
//
// 🌱 ＋ 한살림은 **「사러가기」를 안 단다**(창업자 확정 2026-08-17) — 판에 그 표시를 미리 박아 둔다.
//
// 실행: node /home/user/hankki/hankki/scripts/_판-장바구니새것-0828.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { todayKST } from '../src/today.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/판'
mkdirSync(OUT, { recursive: true })
const 오늘 = todayKST()

// ── 창업자 원본 읽기 ───────────────────────────────────────────────
const doc = readFileSync(join(HERE, '../docs/장바구니-창업자자료-2026-08-09.md'), 'utf8')
const cur = readFileSync(join(HERE, '../src/data/curation.js'), 'utf8')

const 제품들 = []
let 갈래 = null
for (const 줄 of doc.split('\n')) {
  const h = 줄.match(/^##\s+(.+)$/)
  if (h) { 갈래 = h[1].replace(/\s*\(.*$/, '').trim(); continue }
  const b = 줄.match(/^\*\*(.+?)\*\*\s*$/)
  if (b) { 제품들.push({ 갈래, 이름: b[1].trim(), 설명: '' }); continue }
  const l = 줄.match(/^-\s+(.+?)\s*$/)
  if (l && 갈래) { 제품들.push({ 갈래, 이름: l[1].trim(), 설명: '' }); continue }
  const 끝 = 제품들[제품들.length - 1]
  if (끝 && !끝.설명 && 줄.trim() && !/^[#\->|⛔⭐📊⚠️]|^---/.test(줄.trim())) 끝.설명 = 줄.trim()
}
// ⛔ 갈래 표시가 «장바구니 제품»인 절만 — 문서엔 방법·계획 절도 있다
const 쓸갈래 = (g) => g && /^[🌿🌱💜🚀🛍]/.test(g)

// 앱에 이미 있나 (이름·브랜드를 붙여 «글자만» 남기고 견준다)
const 있는것 = [...cur.matchAll(/\{\s*name:\s*'([^']+)'(?:,\s*brand:\s*'([^']+)')?/g)]
  .map((m) => (m[1] + (m[2] || '')).replace(/[^가-힣A-Za-z0-9]/g, ''))
const 있나 = (이름) => {
  const a = 이름.replace(/[^가-힣A-Za-z0-9]/g, '')
  return 있는것.some((h) => a.length >= 2 && (a.includes(h) || h.includes(a)))
}

const 안올라감 = 제품들.filter((p) => 쓸갈래(p.갈래) && !있나(p.이름))
if (안올라감.length < 50) { console.error(`⛔ ${안올라감.length}개밖에 못 읽었다 — 원본 문서 형식이 바뀌었나`); process.exit(1) }

const 갈래별 = {}
for (const p of 안올라감) (갈래별[p.갈래] ||= []).push(p)
const 순서 = ['🌿 자연드림', '🌱 한살림', '💜 컬리', '🚀 쿠팡', '🛍 그 외'].filter((g) => 갈래별[g])
const 설명있음 = 안올라감.filter((p) => p.설명).length

console.log(`📄 창업자가 준 것 중 «안 올라간 것» = ${안올라감.length}개 (설명 있음 ${설명있음} · 이름만 ${안올라감.length - 설명있음})`)
for (const g of 순서) console.log(`   ${String(갈래별[g].length).padStart(3)}개  ${g}`)

// ── 판 ─────────────────────────────────────────────────────────────
const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
let n = 0
const 절 = 순서.map((g) => {
  const 한살림 = g.includes('한살림')
  const 다적힘 = 갈래별[g].every((p) => p.설명)
  const 카드 = 갈래별[g].map((p) => {
    n++
    return `<div class="card${p.설명 ? ' done' : ''}" data-q="${n}">
      <div class="hd"><b>${esc(p.이름)}</b>${한살림 ? '<span class="hs">사러가기 없음 · 조합원 전용</span>' : ''}</div>
      ${p.설명
        ? `<div class="ben">${esc(p.설명)}</div>
           <div class="judge">
             <label class="ok"><input type="checkbox" class="ck"> <span>이대로 올려</span></label>
             <label class="bad"><input type="checkbox" class="ck"> <span>고칠래</span></label>
           </div>
           <textarea class="memo" rows="2" placeholder="고칠 말"></textarea>`
        : `<div class="judge one">
             <label class="skip"><input type="checkbox" class="ck"> <span>이건 빼자</span></label>
           </div>
           <textarea class="memo" rows="3" placeholder="여기에 설명을 적어줘 — 왜 좋은지 · 어떻게 쓰는지"></textarea>`}
    </div>`
  }).join('')
  return `<section class="grp">
    <h2>${esc(g)} <span class="cnt">${갈래별[g].length}개</span>${다적힘 ? '<span class="tag-done">설명 다 있음</span>' : '<span class="tag-need">설명 적어야 함</span>'}</h2>
    <div class="cards">${카드}</div>
  </section>`
}).join('')

const HTML = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>장바구니 새로 올릴 것</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=Jua&display=swap">
<style>
:root{--bg:#faf7f2;--line:#e6ddcf;--text:#3b2b1a;--sub:#8b7a63;--brown:#5d3410;
      --ok:#2f6b4f;--okbg:#e8f3ec;--bad:#b23b3b;--badbg:#fbeaea;--acc:#2a5b8c;--paper:#fff}
*{box-sizing:border-box}
body{margin:0;padding:0 0 96px;background:var(--bg);color:var(--text);
     font-family:'Gowun Dodum',system-ui,-apple-system,sans-serif;line-height:1.6}
header{padding:22px 16px 15px;background:var(--brown);color:#fffdf8}
header h1{margin:0 0 6px;font-family:'Jua',system-ui,sans-serif;font-size:23px;letter-spacing:-.02em}
header p{margin:0;font-size:13.5px;opacity:.92}
.note{margin:12px 16px;padding:12px 14px;background:#fff6e8;border:1px solid #f0dcb8;border-radius:12px;font-size:13.5px}
.grp{margin:18px 16px 0;background:var(--paper);border:1px solid var(--line);border-radius:16px;overflow:hidden}
.grp h2{margin:0;padding:13px 15px;background:#f3ece1;font-family:'Jua',system-ui,sans-serif;font-size:17px;
  display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.cnt{font-family:'Gowun Dodum',sans-serif;font-size:12.5px;color:var(--sub)}
.tag-done{font-family:'Gowun Dodum',sans-serif;font-size:11.5px;color:var(--ok);background:var(--okbg);padding:2px 9px;border-radius:999px}
.tag-need{font-family:'Gowun Dodum',sans-serif;font-size:11.5px;color:var(--bad);background:var(--badbg);padding:2px 9px;border-radius:999px}
.cards{padding:12px 15px 16px;display:grid;gap:11px}
.card{border:1px solid var(--line);border-radius:13px;padding:12px 13px;background:#fffdf9}
.card.done{background:#f7fbf8}
.hd{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:6px}
.hd b{font-size:15.5px}
.hs{font-size:11.5px;color:var(--bad);background:var(--badbg);padding:1px 7px;border-radius:999px}
.ben{font-size:14px;margin-bottom:9px}
.judge{display:flex;gap:8px;margin-bottom:8px}
.judge.one{max-width:200px}
.judge label{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;
  padding:9px 6px;border:1.5px solid var(--line);border-radius:10px;font-size:13.5px;cursor:pointer;background:#fff}
.judge .ck{width:17px;height:17px;accent-color:currentColor}
.judge label.ok:has(.ck:checked){border-color:var(--ok);background:var(--okbg);color:var(--ok)}
.judge label.bad:has(.ck:checked),.judge label.skip:has(.ck:checked){border-color:var(--bad);background:var(--badbg);color:var(--bad)}
textarea.memo{width:100%;border:1px solid var(--line);border-radius:10px;padding:8px 10px;
  font-family:inherit;font-size:13.5px;background:#fff;resize:vertical}
#bar{position:fixed;left:0;right:0;bottom:0;background:#fffdf8;border-top:1px solid var(--line);
  padding:10px 14px;display:flex;gap:10px;align-items:center}
#bar #cnt{flex:1;font-size:13px;color:var(--sub)}
#bar button{background:var(--brown);color:#fffdf8;border:0;border-radius:10px;padding:11px 16px;font-family:inherit;font-size:14.5px}
#out{margin:14px 16px;padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--paper);display:none}
#out textarea{width:100%;height:200px;font-size:12.5px;font-family:ui-monospace,monospace}
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]){--bg:#1c1a17;--paper:#25221e;--line:#3b352d;--text:#f0e8dc;--sub:#a99a86;
    --okbg:#1e3328;--badbg:#3a2222}
  :root:not([data-theme="light"]) .card{background:#25221e}
  :root:not([data-theme="light"]) .card.done{background:#20291f}
  :root:not([data-theme="light"]) .grp h2{background:#2f2b25}
  :root:not([data-theme="light"]) .judge label,
  :root:not([data-theme="light"]) textarea.memo{background:#2b2722;color:var(--text)}
  :root:not([data-theme="light"]) .note{background:#302818;border-color:#4a3d28}
}
</style></head><body>
<header>
  <h1>🛒 장바구니 — 새로 올릴 것</h1>
  <p>${오늘} · 창업자가 준 것 중 <b>아직 안 올라간 ${안올라감.length}개</b> · 앱엔 지금 ${있는것.length}개만 있다</p>
</header>

<div class="note">
  📮 원본 = <b>2026-08-09에 창업자가 준 목록</b>. 그때 <i>"다 적기 힘들어서.. 올라가기전에 검수할때 내용없는건 적어줄게"</i> 라고 했어.<br>
  🌿자연드림·🌱한살림 <b>${설명있음}개는 설명이 이미 있어</b> → <b>「이대로 올려」만 눌러주면</b> 내가 바로 올릴게.<br>
  나머지는 <b>이름만</b> 있어. <b>설명 없이는 안 올려</b> — 그러면 그냥 광고가 되니까.
  적고 싶은 만큼만 적어줘, 적힌 것부터 올릴게.
</div>

${절}

<div id="out"><p>복사가 안 됐어 — <b>아래 글을 길게 눌러 전부 복사</b>해서 채팅에 붙여줘.</p><textarea readonly></textarea></div>
<div id="bar"><span id="cnt">적은 것 0개</span><button id="copy" type="button">📋 결과 복사</button></div>

<script>
var KEY = 'hankki:장바구니새것:${오늘}'
var cards = [].slice.call(document.querySelectorAll('.card'))
var cnt = document.getElementById('cnt')
function 모으기(){
  var out = []
  cards.forEach(function(c){
    var ck = c.querySelectorAll('.ck')
    var a = ck[0] && ck[0].checked, b = ck[1] && ck[1].checked
    var m = ((c.querySelector('.memo') || {}).value || '')
    if (a || b || m.trim()) out.push({ q: c.dataset.q, a: !!a, b: !!b, m: m })
  })
  return out
}
function 저장(){
  var out = 모으기()
  try { localStorage.setItem(KEY, JSON.stringify(out)) } catch (e) {}
  cnt.textContent = '적은 것 ' + out.length + '개'
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
  var 줄 = ['🛒 장바구니 새로 올릴 것 — ${오늘}', '']
  var 갈래 = ''
  cards.forEach(function(c){
    var g = c.closest('.grp').querySelector('h2').firstChild.textContent.trim()
    var ck = c.querySelectorAll('.ck')
    var a = ck[0] && ck[0].checked, b = ck[1] && ck[1].checked
    var m = ((c.querySelector('.memo') || {}).value || '').trim()
    if (!a && !b && !m) return
    if (g !== 갈래) { 줄.push(''); 줄.push('[' + g + ']'); 갈래 = g }
    var 이름 = c.querySelector('.hd b').textContent
    var 표 = c.classList.contains('done') ? (a ? '✅ 올려' : b ? '✏️ 고칠래' : '·') : (a ? '⛔ 빼자' : '✍️')
    줄.push(표 + ' ' + 이름 + (m ? ' — ' + m : ''))
  })
  if (줄.length === 2) 줄.push('(아직 적은 게 없어)')
  var 글 = 줄.join('\\n')
  var box = document.getElementById('out')
  box.style.display = 'block'
  box.querySelector('textarea').value = 글
  try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(글) } catch (e) {}
  cnt.textContent = '복사했어 — 안 됐으면 아래 글을 붙여줘'
  box.scrollIntoView({ behavior: 'smooth', block: 'center' })
})
</script>
</body></html>`

writeFileSync(join(OUT, '장바구니-새것-검수판.html'), HTML)
const 알맹이 = HTML.replace(/^[\s\S]*?<meta name="viewport"[^>]*>\s*/, '').replace(/<\/body><\/html>\s*$/, '')
writeFileSync(join(OUT, '장바구니-새것-아티팩트.html'), 알맹이)
console.log(`\n📄 ${join(OUT, '장바구니-새것-검수판.html')}`)
