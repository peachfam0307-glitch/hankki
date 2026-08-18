// 📮 창업자 레시피 «전체 한 장» — 무엇이 들어갔고 무엇이 남았나
//
// ⭐⭐ 왜 (창업자 2026-08-18)
//   📮 *"앞으로 넣을 수 있는 내 레시피가 총 몇편이야"* → **답을 못 했다.**
//   📮 *"그니까 그때그때 이름붙여서 저장을 하고 분류를해야지"*
//   📮 *"제대로 정리해서 검수판 만들고 반영한거는 반영했다고 표시해."*
//
// ⛔ 「앱에 들어갔나」를 **재료로 더듬지 않는다** — `basics.js` 의 `origin: '창업자'` 이름표로 본다.
//    재료로 견줬더니 「달래장 ↔ 제육볶음」이 같은 요리로 묶였고 셀 때마다 숫자가 달라졌다.
//
// ⛔ 백업 파일은 **저장소에 안 둔다**(공개 저장소). scratchpad 에서만 읽고, 판도 거기 만든다.
//
// 쓰기:  node scripts/_판-내레시피.mjs
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'

// ⭐⭐ [2026-08-18] 백업을 **저장소에 둔다** — `docs/_내레시피-백업/`
//   📮 창업자 = *"들어가도 돼.."* · *"제발 같은일 반복하게만 하지마"*
//   ⛔⛔ 그 전엔 scratchpad 에만 뒀다. 세션이 끝나면 날아가서 **다음에 또 백업을 달라고 하게 된다.**
//      2026-08-12 에 34편을 넣고 아무 기록도 안 남겨 2026-08-18 에 처음부터 다시 셌다 —
//      창업자 = *"이거 저번에도 한 것 같은데..ㅠ"*. **한 일을 안 적으면 그 일을 또 한다.**
//   ✅ 사진은 뺐다(용량) — 레시피 «글»은 그대로다.
//   🔎 새 백업을 받으면 그 폴더에 `YYYY-MM-DD.json` 으로 넣기만 하면 이 도구가 «저절로» 최신을 고른다.
const 창고 = new URL('../docs/_내레시피-백업/', import.meta.url)
const 있는것 = existsSync(창고)
  ? readdirSync(창고).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort()
  : []
if (있는것.length < 1) {
  console.error('⛔ 백업이 없다 — hankki/docs/_내레시피-백업/YYYY-MM-DD.json')
  console.error('   창업자에게 백업 파일을 받아 그 폴더에 날짜 이름으로 넣고 다시 돌린다.')
  process.exit(1)
}
const 신 = new URL(있는것[있는것.length - 1], 창고)          // 제일 새 백업
const 구 = 있는것.length > 1 ? new URL(있는것[있는것.length - 2], 창고) : null   // 그 앞 백업
console.log(`📂 백업 ${있는것.length}개 — 새것 ${있는것[있는것.length - 1]}${구 ? ` · 견줄 것 ${있는것[있는것.length - 2]}` : ''}`)
const J = (p) => JSON.parse(readFileSync(p, 'utf8'))
const 내것 = (d) => d.recipes.filter((r) => !String(r.id || '').startsWith('basic-'))
const 신것 = 내것(J(신))
const 구제목 = 구 ? new Set(내것(J(구)).map((r) => (r.title || '').trim())) : null

const 줄 = (a) => (a || []).map(String).filter((x) => x.trim())
const 순서 = (r) => 줄(r.steps).length
const 재료 = (r) => 줄(r.ingredients).filter((x) => !x.startsWith('[')).length

// ── 앱에 들어갔나 = 이름표(origin)로 본다 ──────────────────────────
const src = readFileSync(new URL('../src/data/basics.js', import.meta.url), 'utf8')
const 반영 = new Map()
for (const b of src.split('\n  {\n').slice(1)) {
  if (!/origin: *'창업자'/.test(b)) continue
  const t = (b.match(/title: '([^']+)'/) || [])[1]
  const 원 = (b.match(/원래 이름 「([^」]+)」/) || [])[1]
  const from = (b.match(/from: '([^']+)'/) || [])[1]
  if (t) 반영.set(원 || t, { 앱이름: t, from })
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const 갈래 = (r) => (순서(r) >= 3 ? 'A' : 순서(r) ? 'B' : 'C')

// ⛔⛔ [2026-08-18] 백업 안에 **같은 제목이 셋**(가지덮밥·닭볶음탕·스키야키가 각 2개).
//    제목을 저장 열쇠로 쓰면 **두 편이 한 칸을 나눠 써서 또 밀린다**(오늘 겪은 그 사고).
//    → 겹치는 이름에만 번호를 붙여 «열쇠»를 가른다. 화면에 보이는 이름은 그대로 둔다.
const 셈 = new Map()
const 편들 = 신것.map((r) => {
  const t = (r.title || '').trim()
  const n = (셈.get(t) || 0) + 1
  셈.set(t, n)
  return { r, t, 열쇠: n > 1 ? `${t} (${n})` : t, 들어감: 반영.get(t) || null, 새것: 구제목 ? !구제목.has(t) : false, k: 갈래(r) }
}).sort((a, b) => a.t.localeCompare(b.t, 'ko'))
// 겹친 이름은 첫 편에도 번호를 붙인다 — 안 그러면 「가지덮밥」과 「가지덮밥 (2)」로 갈려 헷갈린다
for (const x of 편들) if ((셈.get(x.t) || 0) > 1 && x.열쇠 === x.t) x.열쇠 = `${x.t} (1)`

const 칸 = (x) => {
  const { r, t, 열쇠, 들어감, 새것, k } = x
  const 표 = 들어감
    ? `<span class="tag in">✅ 앱에 넣었어${들어감.앱이름 !== t ? ` · 「${esc(들어감.앱이름)}」로` : ''}${들어감.from ? ` · ${들어감.from}` : ''}</span>`
    : `<span class="tag k${k}">${k === 'A' ? '바로 넣을 수 있어' : k === 'B' ? '순서가 짧아' : '만드는 법이 없어'}</span>`
  return `
<article class="row ${들어감 ? 'done' : 'k' + k}" data-key="${esc(열쇠)}">
  <div class="rt">
    <b>${esc(t)}</b>${새것 ? '<span class="new">8/10 뒤에 쓴 것</span>' : ''}
    <span class="num">재료 ${재료(r)}줄 · 순서 ${순서(r)}걸음</span>
  </div>
  <div class="rr">${표}</div>
  ${들어감 ? '' : `<div class="judge">
    <label class="ok"><input type="checkbox" class="ck"> <span>이건 넣자</span></label>
    <label class="bad"><input type="checkbox" class="ck"> <span>안 넣어</span></label>
    <input class="note" type="text" placeholder="언제·어디에 넣을지 한 줄 (없으면 비워둬)">
  </div>`}
</article>`
}

const 센다 = (f) => 편들.filter(f).length
const 묶음 = [
  { k: 'in', 제: '✅ 앱에 이미 넣은 것', 설: '이름을 바꿔 넣은 건 바뀐 이름도 같이 적었어.', f: (x) => x.들어감 },
  { k: 'A', 제: '🅰 바로 넣을 수 있어', 설: '만드는 법이 3걸음 넘게 있어서 <b>내가 지어낼 게 없어</b>.', f: (x) => !x.들어감 && x.k === 'A' },
  { k: 'B', 제: '🅱 순서가 1~2걸음', 설: '내가 풀어 써야 해. <b>내가 쓴 걸음은 네가 봐줘야 해.</b>', f: (x) => !x.들어감 && x.k === 'B' },
  { k: 'C', 제: '🅲 재료만 있어', 설: '<b>만드는 법은 네가 써야 해</b> — 내가 지어내면 네 요리가 아니야.', f: (x) => !x.들어감 && x.k === 'C' },
]

const html = `<title>내 레시피 ${편들.length}편</title>
<style>
  :root{ --paper:#FAF6EF; --card:#FFF; --ink:#2E1C0C; --dim:#7A6852; --faint:#9C8B76;
    --line:#E7DCCB; --brand:#5D3410; --in:#2F6B3C; --in-bg:#E8F2E9;
    --a:#0E6B72; --a-bg:#E6F1F1; --b:#8A4B2A; --b-bg:#F6EAE1; --c:#B4472F; --c-bg:#FBEAE5; }
  @media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
    --paper:#191410; --card:#221B15; --ink:#F2E9DC; --dim:#B6A692; --faint:#8D7E6C;
    --line:#3A2F26; --brand:#E8C9A4; --in:#93CFA0; --in-bg:#1C2E20;
    --a:#7FD3D8; --a-bg:#12312F; --b:#E3A87C; --b-bg:#33221A; --c:#F09A82; --c-bg:#3A211B; } }
  :root[data-theme="dark"]{ --paper:#191410; --card:#221B15; --ink:#F2E9DC; --dim:#B6A692; --faint:#8D7E6C;
    --line:#3A2F26; --brand:#E8C9A4; --in:#93CFA0; --in-bg:#1C2E20;
    --a:#7FD3D8; --a-bg:#12312F; --b:#E3A87C; --b-bg:#33221A; --c:#F09A82; --c-bg:#3A211B; }
  *{box-sizing:border-box}
  body{margin:0; background:var(--paper); color:var(--ink);
    font-family:'Pretendard',-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;
    line-height:1.65; -webkit-text-size-adjust:100%}
  .wrap{max-width:760px; margin:0 auto; padding:22px 16px 40px}
  h1{margin:0 0 4px; font-size:24px; font-weight:900; letter-spacing:-.02em}
  .sub{margin:0 0 18px; color:var(--dim); font-size:14px}
  .sum{display:flex; flex-wrap:wrap; gap:8px; margin:0 0 22px}
  .sum div{flex:1 1 150px; padding:12px 14px; border:1px solid var(--line); border-radius:13px; background:var(--card)}
  .sum b{display:block; font-size:22px; font-weight:900; font-variant-numeric:tabular-nums}
  .sum span{font-size:12.5px; color:var(--dim); font-weight:700}
  h2{margin:30px 0 4px; font-size:17px; font-weight:900}
  .gs{margin:0 0 12px; font-size:13.5px; color:var(--dim)}
  .row{display:flex; flex-wrap:wrap; gap:8px 12px; align-items:center;
    padding:11px 14px; margin:0 0 7px; border:1px solid var(--line); border-radius:12px; background:var(--card)}
  .row.done{opacity:.72}
  .rt{flex:1 1 260px; min-width:0}
  .rt b{font-size:15.5px; font-weight:800}
  .num{display:block; font-size:12.5px; color:var(--faint); font-variant-numeric:tabular-nums}
  .new{margin-left:7px; padding:1px 7px; border-radius:99px; font-size:11px; font-weight:800;
    background:var(--b-bg); color:var(--b)}
  .tag{padding:3px 10px; border-radius:99px; font-size:12.5px; font-weight:800; white-space:nowrap}
  .tag.in{background:var(--in-bg); color:var(--in)}
  .tag.kA{background:var(--a-bg); color:var(--a)}
  .tag.kB{background:var(--b-bg); color:var(--b)}
  .tag.kC{background:var(--c-bg); color:var(--c)}
  .judge{flex:1 1 100%; display:flex; flex-wrap:wrap; gap:8px 14px; align-items:center;
    margin-top:2px; padding-top:9px; border-top:1px dashed var(--line)}
  .judge label{display:flex; align-items:center; gap:6px; font-size:13.5px; font-weight:800; cursor:pointer}
  .judge input[type=checkbox]{width:19px; height:19px; accent-color:var(--brand)}
  .judge .note{flex:1 1 200px; min-width:0; font:inherit; font-size:13.5px; padding:7px 10px;
    border:1px solid var(--line); border-radius:9px; background:var(--paper); color:var(--ink)}
  .bar{position:sticky; bottom:0; z-index:20; display:flex; gap:10px; align-items:center;
    margin:22px 0 0; padding:12px 14px; border:1px solid var(--line); border-radius:14px;
    background:var(--card); box-shadow:0 -6px 18px rgba(0,0,0,.06)}
  .bar button{font:inherit; font-weight:800; font-size:15px; padding:11px 16px; border-radius:11px;
    border:0; background:var(--brand); color:var(--paper); cursor:pointer}
  .bar span{font-size:13px; color:var(--dim); font-weight:700}
  #fallback{margin:14px 0 0}
  #fallback p{font-size:14px; color:var(--c); font-weight:700; margin:0 0 8px}
  #fallback textarea{width:100%; font:inherit; font-size:14px; padding:12px;
    border:1px solid var(--line); border-radius:12px; background:var(--paper); color:var(--ink)}
</style>
<div class="wrap">
  <h1>내 레시피 ${편들.length}편</h1>
  <p class="sub">네가 앱에 «직접 쓴» 레시피 전부야. 무엇이 들어갔고 무엇이 남았는지 한 장에 담았어.</p>

  <div class="sum">
    <div><b>${센다((x) => x.들어감)}</b><span>앱에 넣었어</span></div>
    <div><b>${센다((x) => !x.들어감 && x.k === 'A')}</b><span>바로 넣을 수 있어</span></div>
    <div><b>${센다((x) => !x.들어감 && x.k === 'B')}</b><span>순서가 짧아</span></div>
    <div><b>${센다((x) => !x.들어감 && x.k === 'C')}</b><span>만드는 법이 없어</span></div>
  </div>

  ${묶음.map((g) => {
    const v = 편들.filter(g.f)
    if (!v.length) return ''
    return `<h2>${g.제} <span style="font-weight:700;color:var(--faint)">${v.length}편</span></h2>
    <p class="gs">${g.설}</p>
    ${v.map(칸).join('')}`
  }).join('')}

  <div class="bar" id="bar">
    <button id="copy" type="button">📋 결과 복사</button>
    <span id="cnt">아직 고른 게 없어</span>
  </div>
  <div id="fallback" hidden>
    <p>복사가 안 됐어 — <b>아래 글을 길게 눌러 전부 복사</b>해서 채팅에 붙여줘.</p>
    <textarea id="out" readonly rows="10"></textarea>
  </div>
</div>
<script>
/* 💾 저장은 «레시피 이름»으로 담는다 — 순서 번호로 담았다가 판이 바뀌며 통째로 밀린 적이 있다(2026-08-18). */
(function () {
  var KEY = 'hankki:내레시피판:' + document.querySelectorAll('article[data-key]').length
  var arts = [].slice.call(document.querySelectorAll('article[data-key]'))
  var cnt = document.getElementById('cnt')
  function 칸들(a) { return { c: a.querySelectorAll('.judge input.ck'), n: a.querySelector('.judge input.note') } }
  function 세기() {
    var n = 0
    arts.forEach(function (a) {
      var q = 칸들(a); if (!q.n && !q.c.length) return
      if ((q.c[0] && q.c[0].checked) || (q.c[1] && q.c[1].checked) || (q.n && q.n.value.trim())) n++
    })
    cnt.textContent = n ? ('고른 것 ' + n + '개 — 저장됐어') : '아직 고른 게 없어'
  }
  function 저장() {
    var out = {}
    arts.forEach(function (a) {
      var q = 칸들(a); if (!q.c.length) return
      var c0 = q.c[0] && q.c[0].checked, c1 = q.c[1] && q.c[1].checked, v = q.n ? q.n.value : ''
      if (c0 || c1 || (v && v.trim())) out[a.getAttribute('data-key')] = { a: c0 ? 1 : 0, b: c1 ? 1 : 0, n: v }
    })
    try { localStorage.setItem(KEY, JSON.stringify(out)) } catch (e) {}
    세기()
  }
  try {
    var s = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (s && typeof s === 'object' && !Array.isArray(s)) {
      arts.forEach(function (a) {
        var v = s[a.getAttribute('data-key')]; if (!v) return
        var q = 칸들(a)
        if (q.c[0]) q.c[0].checked = !!v.a
        if (q.c[1]) q.c[1].checked = !!v.b
        if (q.n) q.n.value = v.n || ''
      })
    }
  } catch (e) {}
  세기()
  arts.forEach(function (a) {
    var q = 칸들(a)
    ;[].forEach.call(q.c, function (b) { b.addEventListener('change', 저장) })
    if (q.n) q.n.addEventListener('input', 저장)
  })
  document.getElementById('copy').addEventListener('click', function () {
    var 줄 = []
    arts.forEach(function (a) {
      var q = 칸들(a); if (!q.c.length) return
      var 넣 = q.c[0] && q.c[0].checked, 말 = q.c[1] && q.c[1].checked
      var m = q.n ? q.n.value.trim() : ''
      if (!넣 && !말 && !m) return
      줄.push('· ' + a.getAttribute('data-key') + ' — ' + (말 ? '안 넣어' : (넣 ? '넣자' : '')) + (m ? ' : ' + m : ''))
    })
    var 글 = 줄.length ? ('[내 레시피 판정]\\n' + 줄.join('\\n')) : ''
    if (!글) { cnt.textContent = '아직 고른 게 없어'; return }
    var out = document.getElementById('out')
    out.value = 글
    document.getElementById('fallback').hidden = false
    out.focus(); out.select()
    try { if (navigator.clipboard) navigator.clipboard.writeText(글).catch(function () {}) } catch (e) {}
    try { document.execCommand('copy') } catch (e) {}
    cnt.textContent = '복사했어 — 안 됐으면 아래 글을 붙여줘'
  })
})()
</script>
`
writeFileSync(`${OUT}/내레시피판.html`, html)
console.log(`✅ 판 완성 — ${(html.length / 1024).toFixed(0)}KB · ${편들.length}편`)
console.log(`   앱에 넣음 ${센다((x) => x.들어감)} · A ${센다((x) => !x.들어감 && x.k === 'A')} · B ${센다((x) => !x.들어감 && x.k === 'B')} · C ${센다((x) => !x.들어감 && x.k === 'C')}`)
