// 🔁🔁 「옛 그린 컷 → 새 사진 컷」 전수 판 — 창업자 2026-08-26 (갈래 ⓑ)
//   📮 창업자 = *"근데 여기 옛음식이모지도 있는데??"* → 갈래 셋 중 **"B로하자"**(전수)
//
// ⭐ 「옛/새」를 «자동으로» 못 가른다 — 색 가짓수·결을 재봤는데 둘이 안 갈렸다(둘 다 AI 그림이라서).
//    그래서 두 가지를 같이 썼다:
//      ⑴ **출처** — 픽커 컷을 `docs/stickers` 전체와 «파일 해시»로 대조해 어느 시트에서 왔는지 되짚었다
//         (2026-08-24·25·26 시트 = 새 사진 · 그 밖 = 옛 후보)
//      ⑵ **눈** — 옛 후보 146컷을 컨택트시트 6장으로 «전부 열어서» 봤다(절대원칙 21).
//         해시가 안 맞아 옛으로 잘못 잡힌 10컷을 그때 걸러냈다.
//    ⛔ 표식 = **얼굴(눈·볼) 달린 그릇** · 납작한 벡터 채색 → 옛. 흰 접시 사실 묘사 → 새.
//
// ⭐ 「짝」은 이름으로 찾는다 — 씻은 이름이 같거나 한쪽이 다른 쪽을 품으면 짝(감자탕 ↔ 매운감자탕).
//    ⛔ 짝이 5개 넘게 붙는 컷은 **범용 그림**(「볶음」·「조림」·「소스」처럼 아무 데나 걸리는 바닥 컷)이라
//       갈아끼울 대상이 아니다 — 따로 갈랐다.
//
// 실행 = node scripts/_판-옛그림갈아끼우기-0826.mjs [낼파일.html]
// 🏷 이름표 = 판정대기 (2026-08-26)
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const 앱 = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const 낼파일 = process.argv[2] || path.join(앱, '..', '_판-옛그림-0826.html')
const PHOTO = path.join(앱, 'src/assets/stickers/photo')
const src = fs.readFileSync(path.join(앱, 'src/components/FoodIcon.jsx'), 'utf8')

// ── 이름표·별칭·픽커 (앱 FOOD_NAMES 와 같은 우선순위) ──
const 규칙첫 = {}
const 별칭 = {}
const rB = src.slice(src.indexOf('const ICON_RULES = ['))
for (const m of rB.matchAll(/\[\s*\[([^\]]*)\]\s*,\s*'([^']+)'\s*\]/g)) {
  const keys = [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1])
  if (!keys.length) continue
  if (!(m[2] in 규칙첫)) 규칙첫[m[2]] = keys[0]
  ;(별칭[m[2]] ||= []).push(...keys)
}
const extra = {}
const eS = src.indexOf('EXTRA_NAMES = {')
for (const m of src.slice(eS, src.indexOf('\n}', eS)).matchAll(/([\w]+)\s*:\s*'([^']+)'/g)) extra[m[1]] = m[2]
const 이름 = (k) => 규칙첫[k] || extra[k] || ''

const gBody = src.slice(src.indexOf('FOOD_ICON_GROUPS'), src.indexOf('const ICON_RULES'))
const 갈래 = {}
const 픽커 = []
const 갈래순 = []
for (const m of gBody.matchAll(/\{\s*label:\s*'([^']*)'([^}]*?)items:\s*\[([^\]]*)\]/g)) {
  if (/kind:\s*'ing'/.test(m[0])) continue
  갈래순.push(m[1])
  for (const x of m[3].matchAll(/'([^']*)'/g)) { 픽커.push(x[1]); 갈래[x[1]] = m[1] }
}
const 사진키 = /^(fe|fh|fy|fj|fi|fb|gr)_/

// ── ⑴ 출처로 「새 시트에서 온 것」 가리기 ──
const h = (f) => crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex')
const 출처 = {}
;(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else if (e.name.endsWith('.png')) { try { const k = h(p); if (!출처[k]) 출처[k] = p } catch (_) {} }
  }
})(path.join(앱, 'docs/stickers'))
const 새시트 = /음식-창업자-2026-08-2[456]|창업자-2026-08-24/

// ⑵ 눈으로 걸러낸 것 — 해시가 안 맞아 옛으로 잡혔지만 «사실 묘사»였다
const 눈으로새 = new Set(['fe_474', 'fe_476', 'fe_283', 'fe_319', 'fe_328', 'fe_507', 'fe_134', 'fe_420', 'fh_k11', 'fe_446'])

const 옛 = []
const 새 = []
for (const k of 픽커) {
  if (!사진키.test(k)) continue
  const f = path.join(PHOTO, `${k}.png`)
  if (!fs.existsSync(f)) continue
  const o = 출처[h(f)]
  const 새것 = (o && 새시트.test(o)) || 눈으로새.has(k)
  ;(새것 ? 새 : 옛).push(k)
}

// ── 짝 찾기 ──
const 씻기 = (s) => s.replace(/\([^)]*\)/g, '').replace(/[\s·]/g, '')
const 새이름 = new Map()
for (const k of 새) { const n = 씻기(이름(k)); if (n) (새이름.get(n) || 새이름.set(n, []).get(n)).push(k) }

const 짝있음 = []
const 범용 = []
const 짝없음 = []
for (const k of 옛) {
  const n = 이름(k)
  const c = 씻기(n)
  let 짝 = [...(새이름.get(c) || [])]
  if (!짝.length) for (const a of (별칭[k] || []).map(씻기)) if (새이름.has(a)) { 짝 = [...새이름.get(a)]; break }
  // ⛔⛔⛔ [2026-08-26] 「품으면 짝」 매칭을 **통째로 뺐다.**
  //    📮 창업자가 «네 번» 잡았다 = 김치볶음밥→볶음밥(gr_306) · 유부초밥→초밥 ·
  //       버섯볶음밥→볶음밥 · 굴떡국→떡국 · 냉이된장찌개→된장찌개
  //       → *"어떻게해야해 나 진짜. **이름다 붙여줬는데**"*
  //    ⭐⭐ 뿌리 = **창업자가 시트에 이름을 다 붙여줬는데 내가 «이름을 다시 지어내» 짝을 찾았다.**
  //       짧은 범용 이름(볶음밥·초밥·떡국·된장찌개)이 긴 구체 이름을 삼킨다.
  //       방향만 막아도 「굴떡국 ↔ 떡국」은 못 잡는다 — **짐작이 뿌리라 짐작을 없앤다.**
  //    ✅ **이름이 «똑같을 때»만 짝이다.** 못 찾으면 「새로 뽑을 것」으로 보낸다 —
  //       틀린 짝을 보여주는 것보다 「없다」가 낫다(창업자가 걸러내는 일을 하게 된다).
  짝 = [...new Set(짝)]
  const 줄 = { 키: k, 이름: n, 갈래: 갈래[k], 짝 }
  if (!짝.length) 짝없음.push(줄)
  else if (짝.length > 4) { 줄.짝 = 짝.slice(0, 4); 줄.더 = 짝.length - 4; 범용.push(줄) }
  else 짝있음.push(줄)
}
const 갈래키 = (r) => 갈래순.indexOf(r.갈래)
for (const a of [짝있음, 범용, 짝없음]) a.sort((x, y) => 갈래키(x) - 갈래키(y) || x.이름.localeCompare(y.이름, 'ko'))

// ── 그림을 작게 심는다 ──
const 필요 = [...new Set([...짝있음, ...범용, ...짝없음].flatMap((r) => [r.키, ...(r.짝 || [])]))]
  .filter((k) => fs.existsSync(path.join(PHOTO, `${k}.png`)))
const py = `
import base64, io, sys
from PIL import Image
for k in sys.argv[1:]:
    im = Image.open("${PHOTO}/%s.png" % k).convert("RGBA")
    im.thumbnail((140, 140), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "WEBP", quality=76)
    print(k + "\\t" + base64.b64encode(b.getvalue()).decode())
`
const 그림 = {}
for (const 줄 of execFileSync('python3', ['-c', py, ...필요], { maxBuffer: 1 << 28 }).toString().trim().split('\n')) {
  const [k, b] = 줄.split('\t')
  그림[k] = `data:image/webp;base64,${b}`
}

// ── 판 그리기 ──
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const 컷 = (k, 작게) => `<figure class="cut${작게 ? ' sm' : ''}">${그림[k] ? `<img src="${그림[k]}" alt="">` : '<span class="no">없음</span>'}<figcaption><code>${k}</code></figcaption></figure>`

const 바꿈칸 = (r) => `
<li class="row" data-key="${r.키}" data-name="${esc(r.이름)} (${r.키} → ${r.짝.join(',')})">
  <p class="nm">${esc(r.이름)} <em>${esc(r.갈래)}</em></p>
  <div class="pair">
    <div class="side old"><span class="tagline">지금 (옛 그림)</span>${컷(r.키)}</div>
    <span class="arrow">→</span>
    <div class="side new"><span class="tagline">새 사진</span>${r.짝.map((k) => 컷(k, r.짝.length > 1)).join('')}${r.더 ? `<span class="more">＋${r.더}</span>` : ''}</div>
  </div>
  <div class="pick">
    <label><input type="radio" name="p_${r.키}" value="갈아끼운다"><span>새 걸로 갈아끼운다</span></label>
    <label><input type="radio" name="p_${r.키}" value="둔다"><span>옛 그림 그대로 둔다</span></label>
    <label><input type="radio" name="p_${r.키}" value="둘다"><span>둘 다 둔다</span></label>
  </div>
</li>`

const 목록칸 = (r) => `<li class="lite"><span class="lnm">${esc(r.이름)}</span> <code>${r.키}</code> <em>${esc(r.갈래)}</em></li>`

const html = `<title>옛 그림 갈아끼우기</title>
<style>
:root{--bg:#faf7f2;--card:#fff;--ink:#2e2620;--dim:#7d7167;--line:#e6ddd2;--accent:#b4541f;--soft:#fbeee5;--old:#a8342b;--new:#3f6b46;--tag:#5d3410}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#191512;--card:#231d19;--ink:#efe6dc;--dim:#a6968a;--line:#3a302a;--accent:#e8863f;--soft:#33241a;--old:#e2726a;--new:#84b78d;--tag:#e8c9a4}}
:root[data-theme="dark"]{--bg:#191512;--card:#231d19;--ink:#efe6dc;--dim:#a6968a;--line:#3a302a;--accent:#e8863f;--soft:#33241a;--old:#e2726a;--new:#84b78d;--tag:#e8c9a4}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:"Pretendard","Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif;line-height:1.6;word-break:keep-all;-webkit-text-size-adjust:100%}
.wrap{max-width:760px;margin:0 auto;padding:26px 16px 130px}
h1{font-size:26px;margin:0 0 6px;letter-spacing:-.02em;text-wrap:balance}
.sub{color:var(--dim);font-size:15px;margin:0 0 16px}
.quote{background:var(--soft);border-left:4px solid var(--accent);padding:12px 14px;border-radius:0 10px 10px 0;font-size:15px;margin:0 0 16px}
.quote b{color:var(--accent)}
.how{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin:0 0 24px;font-size:14.5px}
.how ul{margin:7px 0 0;padding-left:19px}
.sec{margin:0 0 32px}
.sec h2{font-size:20px;margin:0 0 4px;display:flex;align-items:center;gap:9px;letter-spacing:-.01em}
.sec h2 em{font-style:normal;font-size:14px;color:var(--dim);font-weight:500}
.tag{background:var(--tag);color:var(--bg);min-width:26px;height:26px;padding:0 6px;border-radius:8px;display:grid;place-items:center;font-size:14px;font-weight:700}
.lead{color:var(--dim);font-size:14.5px;margin:0 0 13px}
ul.list{list-style:none;margin:0;padding:0;display:grid;gap:11px}
.row{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:13px}
.row.done{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent) inset}
.nm{margin:0 0 9px;font-size:17px;font-weight:700}
.nm em{font-style:normal;font-size:12.5px;color:var(--dim);font-weight:500;margin-left:6px}
.pair{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.side{display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:8px 10px;border-radius:12px;background:var(--bg);border:1px solid var(--line);position:relative;padding-top:22px}
.tagline{position:absolute;top:4px;left:10px;font-size:11px;letter-spacing:.02em}
.side.old .tagline{color:var(--old)}
.side.new .tagline{color:var(--new)}
.arrow{color:var(--accent);font-size:20px;font-weight:700}
.cut{margin:0;text-align:center}
.cut img{width:74px;height:74px;object-fit:contain;display:block}
.cut.sm img{width:56px;height:56px}
.cut figcaption{margin-top:2px}
.no{font-size:11px;color:var(--dim)}
code{font-family:ui-monospace,Menlo,monospace;font-size:11.5px;color:var(--dim)}
.more{font-size:12px;color:var(--dim);align-self:center}
.pick{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}
.pick label{display:inline-flex;align-items:center;gap:5px;font-size:14px;border:1px solid var(--line);border-radius:999px;padding:6px 12px;cursor:pointer;background:var(--bg)}
.pick input{accent-color:var(--accent);margin:0}
.pick label:has(input:checked){border-color:var(--accent);background:var(--soft);color:var(--accent);font-weight:600}
ul.lites{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:6px}
.lite{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:7px 10px;font-size:14px;display:flex;align-items:baseline;gap:6px;flex-wrap:wrap}
.lnm{font-weight:600}
.lite em{font-style:normal;font-size:11.5px;color:var(--dim);margin-left:auto}
.bar{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1px solid var(--line);padding:11px 16px calc(11px + env(safe-area-inset-bottom));display:flex;gap:10px;align-items:center;z-index:9}
.cnt{font-size:14px;color:var(--dim);flex:1;min-width:0}
button{font:inherit;font-weight:700;border:0;border-radius:11px;padding:11px 16px;cursor:pointer;background:var(--accent);color:#fff}
button.ghost{background:var(--bg);color:var(--ink);border:1px solid var(--line);font-weight:600}
button.mini{padding:7px 12px;font-size:13.5px;border-radius:9px}
#out{position:fixed;inset:auto 12px 78px 12px;max-height:44vh;overflow:auto;background:var(--card);border:1px solid var(--accent);border-radius:12px;padding:12px;white-space:pre-wrap;font-family:ui-monospace,Menlo,monospace;font-size:13px;display:none;z-index:10;box-shadow:0 10px 30px rgba(0,0,0,.18)}
#out.on{display:block}
</style>

<div class="wrap">
<h1>옛 그림 갈아끼우기</h1>
<p class="sub">픽커에 아직 남은 «옛 그린 컷» ${옛.length}개를 전수로 훑었다 — 새 사진이 있는 것 ${짝있음.length} · 범용 바닥 컷 ${범용.length} · 새로 뽑아야 하는 것 ${짝없음.length}</p>
<div class="quote">📮 창업자 = <b>“근데 여기 옛음식이모지도 있는데??”</b> → <b>“B로하자”</b>(전수)</div>
<div class="how">
  <b>어떻게 갈랐나</b>
  <ul>
    <li>픽커 컷을 원본 시트와 <b>파일 해시</b>로 대조해 «어느 시트에서 왔는지» 되짚었다 — 8/24·25·26 시트 = 새 사진</li>
    <li>해시가 안 맞는 것은 <b>컨택트시트 6장으로 전부 열어서</b> 눈으로 봤다 (얼굴 달린 그릇·납작한 채색 = 옛)</li>
    <li>「짝」은 이름으로 찾았다 — <b>감자탕 ↔ 매운감자탕</b>처럼 한쪽이 다른 쪽을 품으면 짝</li>
  </ul>
  ⓐ 절만 골라 주면 돼. 다 고르면 맨 아래 <b>복사하기</b>.
</div>

<section class="sec">
  <h2><span class="tag">ⓐ</span> 새 사진이 이미 있다 <em>${짝있음.length}개</em></h2>
  <p class="lead">왼쪽이 지금 픽커에 뜨는 옛 그림, 오른쪽이 갈아끼울 새 사진. ⛔갈아끼워도 <b>파일은 안 지운다</b> — 그 컷으로 저장한 레시피가 깨져. 픽커에서만 내린다.</p>
  <div style="margin:0 0 12px"><button class="ghost mini" id="all-swap">ⓐ 전부 「갈아끼운다」로</button></div>
  <ul class="list">${짝있음.map(바꿈칸).join('')}</ul>
</section>

<section class="sec">
  <h2><span class="tag">ⓑ</span> 범용 바닥 컷 <em>${범용.length}개</em></h2>
  <p class="lead">「볶음」·「조림」·「소스」처럼 <b>이름이 안 잡힐 때 깔리는 바닥 그림</b>이라 짝이 수십 개 붙는다. 갈아끼울 대상이 아니고, 새로 뽑는다면 <b>같은 자리에 그대로</b> 넣으면 된다.</p>
  <ul class="list">${범용.map(바꿈칸).join('')}</ul>
</section>

<section class="sec">
  <h2><span class="tag">ⓒ</span> 새로 뽑아야 한다 <em>${짝없음.length}개</em></h2>
  <p class="lead">새 사진이 아예 없는 것들. 고를 건 없고 <b>다시 뽑을 목록</b>이야 — 아래 단추로 이름만 복사돼.</p>
  <div style="margin:0 0 12px"><button class="ghost mini" id="copy-todo">이 ${짝없음.length}개 이름만 복사</button></div>
  <ul class="lites">${짝없음.map(목록칸).join('')}</ul>
</section>
</div>

<div class="bar">
  <span class="cnt" id="cnt">…</span>
  <button class="ghost" id="reset">지우기</button>
  <button id="copy">복사하기</button>
</div>
<pre id="out"></pre>

<script>
const KEY = 'hankki-옛그림-0826'
const rows = [...document.querySelectorAll('.row[data-key]')]
let saved = {}
try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') } catch (e) { saved = {} }
function paint () {
  let n = 0
  for (const row of rows) {
    const v = saved[row.dataset.key]
    for (const i of row.querySelectorAll('input')) i.checked = i.value === v
    row.classList.toggle('done', !!v)
    if (v) n++
  }
  document.getElementById('cnt').textContent = n + ' / ' + rows.length
}
function save () { try { localStorage.setItem(KEY, JSON.stringify(saved)) } catch (e) {} }
document.addEventListener('change', (e) => {
  const row = e.target.closest('.row'); if (!row) return
  saved[row.dataset.key] = e.target.value; save(); paint()
})
document.getElementById('reset').addEventListener('click', () => { saved = {}; save(); paint(); out.classList.remove('on') })
document.getElementById('all-swap').addEventListener('click', () => {
  for (const row of document.querySelectorAll('.sec:nth-of-type(1) .row[data-key]')) saved[row.dataset.key] = '갈아끼운다'
  save(); paint()
})
const out = document.getElementById('out')
// ⛔ clipboard.writeText 는 «성공으로 resolve 되고도» 실제 복사가 안 되는 폰이 있다(v10.97 사고)
//    → 세 겹: ①clipboard ②숨은 textarea + execCommand ③글자를 골라 준다(길게 눌러 복사)
async function 복사(txt) {
  let 됐나 = false
  try { await navigator.clipboard.writeText(txt); 됐나 = true } catch (e) { 됐나 = false }
  if (!됐나) {
    try {
      const ta = document.createElement('textarea')
      ta.value = txt; ta.setAttribute('readonly', '')
      ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0'
      document.body.appendChild(ta)
      ta.select(); ta.setSelectionRange(0, txt.length)
      됐나 = document.execCommand('copy'); ta.remove()
    } catch (e) { 됐나 = false }
  }
  out.classList.add('on')
  if (됐나) { out.textContent = '✅ 복사했어요 — 채팅에 붙여넣으면 돼요\\n\\n' + txt }
  else {
    out.textContent = '⚠️ 자동 복사가 안 됐어요 — 아래 글자를 길게 눌러 복사해 주세요\\n\\n' + txt
    const r = document.createRange(); r.selectNodeContents(out)
    const s = getSelection(); s.removeAllRanges(); s.addRange(r)
  }
  out.scrollIntoView({ block: 'nearest' })
}
document.getElementById('copy').addEventListener('click', () => {
  const 통 = new Map()
  for (const row of rows) {
    const v = saved[row.dataset.key]; if (!v) continue
    if (!통.has(v)) 통.set(v, [])
    통.get(v).push(row.dataset.name)
  }
  const 차례 = ['갈아끼운다', '둘다', '둔다']
  const 키들 = [...통.keys()].sort((a, b) => (차례.indexOf(a) + 1 || 9) - (차례.indexOf(b) + 1 || 9))
  복사(키들.flatMap((k) => ['[' + k + ' ' + 통.get(k).length + ']', ...통.get(k), '']).join('\\n').trim())
})
document.getElementById('copy-todo').addEventListener('click', () => {
  복사('[새로 뽑을 것 ${짝없음.length}]\\n' + ${JSON.stringify(짝없음.map((r) => r.이름))}.join('\\n'))
})
paint()
</script>`

fs.writeFileSync(낼파일, html)
console.log(`✅ ${낼파일}  (${(html.length / 1024 / 1024).toFixed(2)}MB)`)
console.log(`옛 ${옛.length} · 새 ${새.length} — 짝있음 ${짝있음.length} · 범용 ${범용.length} · 짝없음 ${짝없음.length}`)
