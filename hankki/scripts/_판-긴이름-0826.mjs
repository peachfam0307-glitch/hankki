// 🏷🏷 「설명처럼 긴 이름」 판정판 만들기 — 창업자 2026-08-26
//   📮 창업자 = *"다른 것도 설명 길게 적어놓은건 찾아주면 내가 알려줄게"*
//   ⭐ 창업자가 뽑을 때 GPT 에게 준 «설명»(맑은·매운·뼈없는·(소금양념)…)이 그대로 이름표가 된 것을 찾는다.
//   ⛔ 소스를 글자로 파싱하지만 «판정 함수는 앱과 같은 순서»(ICON_RULES 위→아래 첫 매칭)로 돌린다 — 절대원칙 30.
//   ⭐ 떼면 «어느 키로 흘러가나»를 미리 재서 같이 보여준다 → 창업자가 한 번에 판정한다.
//   실행 = node scripts/_판-긴이름-0826.mjs [낼파일.html]
//   🏷 이름표 = 판정대기 (2026-08-26)
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 앱 = path.join(여기, '..')
const 낼파일 = process.argv[2] || path.join(앱, '..', '_판-긴이름-0826.html')

const src = fs.readFileSync(path.join(앱, 'src/components/FoodIcon.jsx'), 'utf8')

// ① ICON_RULES — 순서 그대로(첫 매칭이 이긴다)
const 규칙 = []
const 룰본문 = src.slice(src.indexOf('const ICON_RULES = ['))
for (const m of 룰본문.matchAll(/\[\s*\[([^\]]*)\]\s*,\s*'([^']+)'\s*\]/g)) {
  const keys = [...m[1].matchAll(/'([^']*)'/g)].map((x) => x[1])
  if (keys.length) 규칙.push({ keys, 키: m[2] })
}
// ② EXTRA_NAMES — 규칙 없는 컷의 이름표
const extra = {}
const ex본문 = src.slice(src.indexOf('const EXTRA_NAMES = {'))
for (const m of ex본문.slice(0, ex본문.indexOf('\n}')).matchAll(/(\w+)\s*:\s*'([^']*)'/g)) extra[m[1]] = m[2]

// ③ 픽커 갈래 (⛔ kind:'ing' 재료 갈래는 뺀다 — 요리 이름이 아니다)
const 그룹본문 = src.slice(src.indexOf('FOOD_ICON_GROUPS'), src.indexOf('const ICON_RULES'))
const 픽커 = []
for (const m of 그룹본문.matchAll(/\{\s*label:\s*'([^']*)'[^}]*?items:\s*\[([^\]]*)\]/g)) {
  픽커.push({
    갈래: m[1],
    재료: /kind:\s*'ing'/.test(m[0]),
    keys: [...m[2].matchAll(/'([^']*)'/g)].map((x) => x[1]),
  })
}

// ④ 이름표 = FOOD_NAMES 와 같은 우선순위 ({...EXTRA_NAMES, ...규칙} → 규칙이 이긴다)
const 이름표 = {}
for (const r of 규칙) if (!(r.키 in 이름표)) 이름표[r.키] = r.keys[0]
for (const [k, v] of Object.entries(extra)) if (!(k in 이름표)) 이름표[k] = v

// ⑤ guessFoodIcon 과 같은 판정
const 맞히기 = (s) => {
  for (const r of 규칙) if (r.keys.some((k) => s.includes(k))) return r.키
  return 'default'
}

const 맛 = ['맑은', '매운', '얼큰', '매콤', '빨간', '하얀']
// ⛔ 「간장·양념·고추장」은 «설명»이 아니라 진짜 요리 이름이라 일부러 뺐다
//    (간장게장 ↔ 양념게장 처럼 «둘이 다른 요리»다). 넣으면 뻔한 「둔다」가 18개 늘어 판이 시끄러워진다.
//    ＋「묵은지」도 뺐다 — 묵은지볶음·묵은지파스타는 «재료가 곧 요리 이름»이다.
const 방식 = ['뼈없는', '들기름', '대파듬뿍', '훈제오리', '뚝딱', '원팬', '범용', '초간단', '냉이듬뿍']

const 갈래이름 = {
  A: { 제목: '괄호로 설명을 붙인 것', 설명: '괄호 안이 「어떤 맛인지·무슨 고기인지」를 적어둔 자리다.' },
  B: { 제목: '맛을 앞에 붙인 것', 설명: '「맑은·매운·얼큰」은 GPT 에게 준 말이지 요리 이름이 아니다 — 이미 여섯 개는 뗐다.' },
  C: { 제목: '재료·만드는 법을 앞에 붙인 것', 설명: '「뼈없는·들기름·대파듬뿍」처럼 만드는 법이 이름에 붙었다.' },
  D: { 제목: '모둠 그림 — ⛔손대지 않는다', 설명: '괄호 안이 설명이 아니라 «몇 개가 그려졌나»다. 3개판·4개판 둘 다 살아 있는 게 창업자 확정(2026-08-19)이라 고를 것이 없다.' },
}

const 결과 = []
const 본것 = new Set()
for (const g of 픽커) {
  if (g.재료) continue
  for (const 키 of g.keys) {
    if (본것.has(키)) continue
    const 이름 = 이름표[키]
    if (!이름) continue
    const 괄호 = /[()]/.test(이름)
    const 모둠 = /모둠\s*\(\d가지\)/.test(이름)   // ⛔「모둠초밥·모둠튀김」은 진짜 요리 이름이라 뺀다
    const 맛앞 = 맛.find((w) => 이름.startsWith(w))
    const 방앞 = 방식.find((w) => 이름.startsWith(w))
    let 갈 = null
    if (모둠) 갈 = 'D'
    else if (괄호) 갈 = 'A'
    else if (맛앞) 갈 = 'B'
    else if (방앞) 갈 = 'C'
    if (!갈) continue
    본것.add(키)
    let 짧게 = 이름.replace(/\([^)]*\)/g, '').replace(/\s+/g, '').trim()
    if (갈 === 'B') 짧게 = 이름.slice(맛앞.length)
    if (갈 === 'C') 짧게 = 이름.slice(방앞.length)
    let 겹침 = ''
    let 겹키 = ''
    if (짧게 && 짧게 !== 이름) {
      const 간다 = 맞히기(짧게)
      if (간다 !== 키) {
        겹키 = 간다
        겹침 = 이름표[간다] || 간다
      }
    }
    결과.push({ 갈, 갈래: g.갈래, 키, 이름, 짧게: 짧게 === 이름 ? '' : 짧게, 겹침, 겹키 })
  }
}

// ⑥ 「같은 이름·다른 그림」 — 픽커에 같은 이름이 두 컷 이상 실린 것 (⛔어느 쪽을 쓸지는 창업자가 정한다 · 규칙 11)
//    ⛔ 사진 컷끼리만 본다 — 선 그림 도형(`donburi`·`soup` 같은 범용 아이콘)은 «일부러» 같은 이름이다.
const 사진키 = /^(fe|fh|fy|fj|fi|fb|gr)_/
const 픽커키 = new Set(픽커.filter((g) => !g.재료).flatMap((g) => g.keys))
const 이름별 = new Map()
for (const 키 of 픽커키) {
  if (!사진키.test(키)) continue
  const n = 이름표[키]
  if (!n || /모둠\s*\(\d가지\)/.test(n)) continue
  if (!이름별.has(n)) 이름별.set(n, [])
  이름별.get(n).push(키)
}
const 겹친이름 = [...이름별].filter(([, ks]) => ks.length > 1)

// ⑦ 그림을 작게 줄여 데이터로 심는다 (판이 스스로 서게 — 바깥 주소를 못 부른다)
const 그림 = {}
const 원본폴더 = path.join(앱, 'src/assets/stickers/photo')
const 필요 = [...new Set([...결과.flatMap((r) => [r.키, r.겹키]), ...겹친이름.flatMap(([, ks]) => ks)].filter(Boolean))]
const 있는것 = 필요.filter((k) => fs.existsSync(path.join(원본폴더, `${k}.png`)))
const py = `
import base64, io, sys
from PIL import Image
for k in sys.argv[1:]:
    im = Image.open("${원본폴더}/%s.png" % k).convert("RGBA")
    im.thumbnail((150, 150), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, "WEBP", quality=78)
    print(k + "\\t" + base64.b64encode(b.getvalue()).decode())
`
const out = execFileSync('python3', ['-c', py, ...있는것], { maxBuffer: 1 << 28 }).toString()
for (const 줄 of out.trim().split('\n')) {
  const [k, b] = 줄.split('\t')
  그림[k] = `data:image/webp;base64,${b}`
}
const 없는것 = 필요.filter((k) => !그림[k])
if (없는것.length) console.log(`⚠️ 그림 못 찾은 키 ${없는것.length}개 =`, 없는것.join(', '))

// ⑦ 판 그리기
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const 그림칸 = (k) => `<div class="pic">${그림[k] ? `<img src="${그림[k]}" alt="">` : '<span class="no">그림 없음</span>'}</div>`

const 칸 = (r) => `
<li class="row${r.갈 === 'D' ? ' flat' : ''}" ${r.갈 === 'D' ? '' : `data-key="${r.키}" data-name="${esc(r.이름)}"`}>
  ${그림칸(r.키)}
  <div class="info">
    <p class="nm">${esc(r.이름)}</p>
    <p class="meta"><code>${r.키}</code> · ${esc(r.갈래)}</p>
    ${r.갈 === 'D' ? '' : r.짧게 ? `<p class="strip">떼면 → <b>${esc(r.짧게)}</b></p>` : ''}
    ${r.갈 === 'D' ? '' : r.겹침 ? `<p class="clash">⛔ <b>${esc(r.겹침)}</b>(<code>${r.겹키}</code>) 와 이름이 겹친다</p>` : r.짧게 ? '<p class="safe">✅ 겹치는 이름 없음 — 그냥 뗄 수 있다</p>' : ''}
    ${r.갈 === 'D' ? '' : `<div class="pick">
      <label><input type="radio" name="p_${r.키}" value="뗀다"><span>설명이다 · 뗀다</span></label>
      <label><input type="radio" name="p_${r.키}" value="둔다"><span>요리 이름이다 · 둔다</span></label>
      <label><input type="radio" name="p_${r.키}" value="모름"><span>모르겠다</span></label>
    </div>`}
  </div>
</li>`

const 절 = 'ABCD'
  .split('')
  .map((g) => {
    const rs = 결과.filter((r) => r.갈 === g)
    if (!rs.length) return ''
    return `
<section class="sec" id="sec-${g}">
  <h2><span class="tag">${g}</span> ${esc(갈래이름[g].제목)} <em>${rs.length}개</em></h2>
  <p class="lead">${esc(갈래이름[g].설명)}</p>
  <ul class="list">${rs.map(칸).join('')}</ul>
</section>`
  })
  .join('')

// 「같은 이름·다른 그림」 절 — 어느 그림을 쓸지 고른다
const 겹친절 = !겹친이름.length
  ? ''
  : `
<section class="sec" id="sec-E">
  <h2><span class="tag">E</span> 같은 이름이 두 컷 <em>${겹친이름.length}쌍</em></h2>
  <p class="lead">픽커에서 이름이 똑같이 보인다 — 고를 때 어느 쪽인지 알 수가 없다. 쓸 그림을 하나 골라 주면 나머지는 픽커에서 내린다(⛔파일은 안 지운다).</p>
  <ul class="list">${겹친이름
    .map(
      ([n, ks]) => `
  <li class="row dup" data-key="dup_${esc(n)}" data-name="같은 이름: ${esc(n)}">
    <div class="info wide">
      <p class="nm">${esc(n)} <em class="cnt2">${ks.length}컷</em></p>
      <div class="pick pics">
        ${ks
          .map(
            (k) => `<label class="pickpic">
          <input type="radio" name="p_dup_${esc(n)}" value="${k} 쓴다">
          ${그림칸(k)}
          <span><code>${k}</code></span>
        </label>`,
          )
          .join('')}
        <label class="pickpic mini"><input type="radio" name="p_dup_${esc(n)}" value="둘 다 둔다"><span>둘 다 둔다</span></label>
      </div>
    </div>
  </li>`,
    )
    .join('')}</ul>
</section>`

const html = `<title>설명이 이름이 된 컷</title>
<style>
:root{
  --bg:#faf7f2; --card:#ffffff; --ink:#2e2620; --dim:#7d7167; --line:#e6ddd2;
  --accent:#b4541f; --accent-soft:#fbeee5; --warn:#a8342b; --ok:#3f6b46; --tag:#5d3410;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){
  --bg:#191512; --card:#231d19; --ink:#efe6dc; --dim:#a6968a; --line:#3a302a;
  --accent:#e8863f; --accent-soft:#33241a; --warn:#e2726a; --ok:#84b78d; --tag:#e8c9a4;
}}
:root[data-theme="dark"]{
  --bg:#191512; --card:#231d19; --ink:#efe6dc; --dim:#a6968a; --line:#3a302a;
  --accent:#e8863f; --accent-soft:#33241a; --warn:#e2726a; --ok:#84b78d; --tag:#e8c9a4;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);
  font-family:"Pretendard","Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif;
  line-height:1.65;word-break:keep-all;-webkit-text-size-adjust:100%}
.wrap{max-width:760px;margin:0 auto;padding:28px 18px 140px}
header h1{font-size:27px;margin:0 0 6px;letter-spacing:-.02em;text-wrap:balance}
header .sub{color:var(--dim);font-size:15px;margin:0 0 18px}
.quote{background:var(--accent-soft);border-left:4px solid var(--accent);
  padding:13px 15px;border-radius:0 10px 10px 0;font-size:15px;margin:0 0 18px}
.quote b{color:var(--accent)}
.how{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:15px 17px;margin:0 0 26px;font-size:15px}
.how ol{margin:8px 0 0;padding-left:20px}
.how li{margin:4px 0}
.sec{margin:0 0 34px}
.sec h2{font-size:20px;margin:0 0 4px;display:flex;align-items:center;gap:9px;letter-spacing:-.01em}
.sec h2 em{font-style:normal;font-size:14px;color:var(--dim);font-weight:500}
.tag{background:var(--tag);color:var(--bg);width:26px;height:26px;border-radius:8px;
  display:grid;place-items:center;font-size:14px;font-weight:700;flex:0 0 auto}
.lead{color:var(--dim);font-size:14.5px;margin:0 0 14px}
.list{list-style:none;margin:0;padding:0;display:grid;gap:11px}
.row{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:13px;
  display:grid;grid-template-columns:88px minmax(0,1fr);gap:14px;align-items:start}
.row.done{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent) inset}
.pic{width:88px;height:88px;border-radius:11px;background:var(--bg);
  display:grid;place-items:center;overflow:hidden;border:1px solid var(--line)}
.pic img{width:100%;height:100%;object-fit:contain;display:block}
.no{font-size:12px;color:var(--dim)}
.info{min-width:0}
.nm{margin:0;font-size:18px;font-weight:700;letter-spacing:-.01em}
.meta{margin:2px 0 7px;font-size:13px;color:var(--dim)}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;
  background:var(--bg);border:1px solid var(--line);border-radius:5px;padding:1px 5px}
.strip{margin:0 0 3px;font-size:14.5px}
.strip b{color:var(--accent)}
.clash{margin:0 0 3px;font-size:14px;color:var(--warn)}
.safe{margin:0 0 3px;font-size:14px;color:var(--ok)}
.pick{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}
.pick label{display:inline-flex;align-items:center;gap:5px;font-size:14px;
  border:1px solid var(--line);border-radius:999px;padding:6px 12px;cursor:pointer;background:var(--bg)}
.pick input{accent-color:var(--accent);margin:0}
.pick label:has(input:checked){border-color:var(--accent);background:var(--accent-soft);color:var(--accent);font-weight:600}
.row.flat{opacity:.72}
.row.dup{grid-template-columns:minmax(0,1fr)}
.cnt2{font-style:normal;font-size:13px;color:var(--dim);font-weight:500}
.pics{align-items:flex-start}
.pickpic{flex-direction:column;gap:6px;padding:9px 10px;border-radius:12px}
.pickpic .pic{width:76px;height:76px}
.pickpic.mini{align-self:center;flex-direction:row}
.bar{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1px solid var(--line);
  padding:12px 18px calc(12px + env(safe-area-inset-bottom));display:flex;gap:11px;align-items:center;z-index:9}
.bar .cnt{font-size:14px;color:var(--dim);flex:1;min-width:0}
button{font:inherit;font-weight:700;border:0;border-radius:11px;padding:12px 18px;cursor:pointer;
  background:var(--accent);color:#fff}
button.ghost{background:var(--bg);color:var(--ink);border:1px solid var(--line);font-weight:600}
#out{position:fixed;inset:auto 12px 82px 12px;max-height:44vh;overflow:auto;background:var(--card);
  border:1px solid var(--accent);border-radius:12px;padding:13px;white-space:pre-wrap;
  font-family:ui-monospace,Menlo,monospace;font-size:13px;display:none;z-index:10;
  box-shadow:0 10px 30px rgba(0,0,0,.18)}
#out.on{display:block}
@media (max-width:430px){.row{grid-template-columns:70px minmax(0,1fr)}.pic{width:70px;height:70px}}
</style>

<div class="wrap">
<header>
  <h1>설명이 이름이 된 컷</h1>
  <p class="sub">픽커에 실린 컷 중 이름이 「요리 이름」이 아니라 「설명」으로 보이는 것 ${결과.filter((r) => r.갈 !== 'D').length}개 ${겹친이름.length ? `· 같은 이름이 두 컷 ${겹친이름.length}쌍` : ''}</p>
  <div class="quote">📮 창업자 = <b>“얼큰 매운도 다 떼도 돼. 설명으로 붙인거라”</b> · <b>“다른 것도 설명 길게 적어놓은건 찾아주면 내가 알려줄게”</b></div>
  <div class="how">
    <b>고르는 법</b>
    <ol>
      <li><b>설명이다 · 뗀다</b> — 요리 이름이 아니라 뽑을 때 준 말이다</li>
      <li><b>요리 이름이다 · 둔다</b> — 이름 자체가 그렇다(빨간·하얀 콩나물무침처럼 짝이 있는 것)</li>
      <li>⛔ 빨간 줄 = 떼면 <b>이미 있는 다른 컷</b>과 이름이 겹친다 — 그래도 떼려면 그 컷을 어떻게 할지 같이 알려주면 된다</li>
    </ol>
    다 고르면 맨 아래 <b>복사하기</b> → 채팅에 붙여넣기.
  </div>
</header>
${절}
${겹친절}
</div>

<div class="bar">
  <span class="cnt" id="cnt">…</span>
  <button class="ghost" id="reset">지우기</button>
  <button id="copy">복사하기</button>
</div>
<pre id="out"></pre>

<script>
const KEY = 'hankki-긴이름-0826'
const rows = [...document.querySelectorAll('.row[data-key]')]
let saved = {}
try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') } catch (e) { saved = {} }

function paint () {
  let n = 0
  for (const row of rows) {
    const k = row.dataset.key
    const v = saved[k]
    for (const input of row.querySelectorAll('input')) input.checked = input.value === v
    row.classList.toggle('done', !!v)
    if (v) n++
  }
  document.getElementById('cnt').textContent = n + ' / ' + rows.length
}
function save () { try { localStorage.setItem(KEY, JSON.stringify(saved)) } catch (e) {} }

document.addEventListener('change', (e) => {
  const row = e.target.closest('.row'); if (!row) return
  saved[row.dataset.key] = e.target.value
  save(); paint()
})
document.getElementById('reset').addEventListener('click', () => {
  saved = {}; save(); paint(); document.getElementById('out').classList.remove('on')
})
document.getElementById('copy').addEventListener('click', async () => {
  const 통 = new Map()
  for (const row of rows) {
    const v = saved[row.dataset.key]; if (!v) continue
    const 줄 = row.dataset.key.startsWith('dup_')
      ? row.dataset.name
      : row.dataset.name + ' (' + row.dataset.key + ')'
    if (!통.has(v)) 통.set(v, [])
    통.get(v).push(줄)
  }
  const 차례 = ['뗀다', '둔다', '모름']
  const 키들 = [...통.keys()].sort((a, b) => (차례.indexOf(a) + 1 || 9) - (차례.indexOf(b) + 1 || 9))
  const 이름 = { 뗀다: '설명이라 뗀다', 둔다: '요리 이름이라 둔다', 모름: '모르겠다' }
  const txt = 키들.flatMap((k) => ['[' + (이름[k] || k) + ' ' + 통.get(k).length + ']', ...통.get(k), '']).join('\\n').trim()
  const out = document.getElementById('out')
  out.textContent = txt; out.classList.add('on')
  // ⛔ clipboard.writeText 는 «성공으로 resolve 되고도» 실제 복사가 안 되는 폰이 있다(v10.97 사고)
  //    → 세 겹으로 간다: ①clipboard ②숨은 textarea + execCommand ③글자를 골라 준다(길게 눌러 복사)
  let 됐나 = false
  try { await navigator.clipboard.writeText(txt); 됐나 = true } catch (e) { 됐나 = false }
  if (!됐나) {
    try {
      const ta = document.createElement('textarea')
      ta.value = txt
      ta.setAttribute('readonly', '')
      ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0'
      document.body.appendChild(ta)
      ta.select(); ta.setSelectionRange(0, txt.length)
      됐나 = document.execCommand('copy')
      ta.remove()
    } catch (e) { 됐나 = false }
  }
  if (됐나) {
    out.textContent = '✅ 복사했어요 — 채팅에 붙여넣으면 돼요\\n\\n' + txt
  } else {
    const r = document.createRange(); r.selectNodeContents(out)
    const s = getSelection(); s.removeAllRanges(); s.addRange(r)
    out.textContent = '⚠️ 자동 복사가 안 됐어요 — 아래 글자를 길게 눌러 복사해 주세요\\n\\n' + txt
  }
  out.scrollIntoView({ block: 'nearest' })
})
paint()
</script>`

fs.writeFileSync(낼파일, html)
console.log(`✅ ${낼파일}`)
console.log(`후보 ${결과.length}개 · 그림 ${Object.keys(그림).length}장 · ${(html.length / 1024 / 1024).toFixed(2)}MB`)
for (const g of 'ABCD') {
  const rs = 결과.filter((r) => r.갈 === g)
  console.log(`\n== ${g} ${갈래이름[g].제목} (${rs.length})`)
  for (const r of rs) console.log(`   ${r.이름}\t${r.키}\t→${r.짧게 || '-'}\t${r.겹침 ? '⛔' + r.겹침 + '(' + r.겹키 + ')' : '안전'}`)
}
console.log(`\n== E 같은 이름이 두 컷 (${겹친이름.length}쌍)`)
for (const [n, ks] of 겹친이름) console.log(`   ${n}\t${ks.join(' · ')}`)
