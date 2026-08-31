// 🍳 주간 레시피 11주 33편 «검수판» 만들기 (2026-08-13)
//
// ⭐ 창업자가 볼 것은 셋뿐이다 — ①내가 쓰는 재료로 바꿀 것 ②양·시간 ③이상한 것.
//   그래서 **브랜드가 박힌 재료 줄을 눈에 띄게** 칠하고, 나머지는 조용히 둔다.
// ⛔ 33편을 한 화면에 펼치면 못 읽는다 → **주 단위로 접어** 두고 탭해서 편다.
// 📌 손으로 33편을 옮겨 적지 않는다(규칙 8) — `weekly.js`·`basics.js` 에서 «뽑아서» 그린다.
import { readFileSync, writeFileSync } from 'node:fs'

const 주들 = JSON.parse(readFileSync('/tmp/11주.json', 'utf8'))

// 우리만 쓰는 양념 — 이게 「다른 레시피」를 만드는 층이다(2026-08-01 창업자와 가른 「층①」)
const BRAND = ['초피액젓', '백간장', '아우노슈가', '성가정', '복이네', '쌀누룩', '홍영의', '해물가루육수', '연두', '치킨스톡']
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
const 칠 = (s) => {
  let t = esc(s)
  for (const b of BRAND) if (t.includes(b)) return `<span class="brand">${t}</span>`
  return t
}
const 브랜드편 = (r) => r.ing.some((i) => BRAND.some((b) => i.includes(b)))

const 편HTML = (r) => `
  <article class="rec${브랜드편(r) ? ' has-brand' : ''}">
    <div class="rhead">
      <h4>${esc(r.title)}</h4>
      <span class="meta">${r.time ? r.time + '분' : ''}${r.serves ? ' · ' + esc(r.serves) : ''}</span>
    </div>
    <div class="cols">
      <div>
        <div class="lbl">재료</div>
        <ul class="ing">${r.ing.map((i) => `<li>${칠(i)}</li>`).join('')}</ul>
      </div>
      <div>
        <div class="lbl">만드는 법</div>
        <ol class="steps">${r.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      </div>
    </div>
    ${r.memo ? `<div class="memo">${esc(r.memo).replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>')}</div>` : ''}
  </article>`

const 주HTML = (s, i) => `
  <details class="wk"${i === 0 ? ' open' : ''}>
    <summary>
      <span class="date">${s.from.slice(5).replace('-', '/')}</span>
      <span class="wt">${esc(s.title)}</span>
      <span class="cnt">${s.편.length}편</span>
    </summary>
    ${s.why ? `<p class="why">${esc(s.why)}</p>` : ''}
    ${s.편.map(편HTML).join('')}
  </details>`

const 총편 = 주들.reduce((a, s) => a + s.편.length, 0)
const 브랜드수 = 주들.reduce((a, s) => a + s.편.filter(브랜드편).length, 0)

const html = `<title>11주 주간 레시피 검수</title>
<style>
  /* 색 = 앱 팔레트(그레이지 ＋ 더스티블루). 브랜드 재료만 «따뜻한 호박»으로 따로 튄다 */
  :root{
    --ground:#F5F2EC; --card:#FFFFFF; --ink:#33291F; --muted:#857767;
    --accent:#5878a0; --accent-soft:#E7EDF4; --line:#E4DED3;
    --brand-bg:#F6EAD1; --brand-ink:#87652C;
  }
  @media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
    --ground:#17171b; --card:#212024; --ink:#E9E3DA; --muted:#9C9287;
    --accent:#7093c0; --accent-soft:#232C38; --line:#32302C;
    --brand-bg:#3A2F1C; --brand-ink:#E0BE7C;
  }}
  :root[data-theme="dark"]{
    --ground:#17171b; --card:#212024; --ink:#E9E3DA; --muted:#9C9287;
    --accent:#7093c0; --accent-soft:#232C38; --line:#32302C;
    --brand-bg:#3A2F1C; --brand-ink:#E0BE7C;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--ground);color:var(--ink);
    font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif;
    font-size:15px;line-height:1.62;-webkit-text-size-adjust:100%}
  .wrap{max-width:820px;margin:0 auto;padding:0 16px 64px}
  header{padding:34px 0 8px}
  .eyebrow{font-size:11.5px;letter-spacing:.14em;color:var(--muted);font-weight:700}
  h1{margin:8px 0 0;font-size:29px;font-weight:800;letter-spacing:-.02em;line-height:1.2;text-wrap:balance}
  .lede{margin:11px 0 0;color:var(--muted);font-size:14.5px}
  .ask{margin-top:16px;padding:14px 16px;border-radius:13px;background:var(--accent-soft);
    border:1px solid color-mix(in srgb,var(--accent) 22%,transparent);font-size:14px;line-height:1.62}
  .ask b{color:var(--accent)}
  .ask ol{margin:8px 0 0;padding-left:20px}
  .ask li{margin:3px 0}
  .now{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}
  .stat{flex:1 1 130px;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px 13px}
  .stat .k{font-size:11.5px;color:var(--muted);font-weight:700}
  .stat .v{font-size:17px;font-weight:800;margin-top:2px;font-variant-numeric:tabular-nums}
  .tools{position:sticky;top:0;z-index:5;background:var(--ground);padding:14px 0 10px;margin-top:12px;
    border-bottom:1px solid var(--line)}
  input[type=search]{width:100%;padding:11px 13px;border-radius:11px;border:1px solid var(--line);
    background:var(--card);color:var(--ink);font:inherit;font-size:15px}
  input[type=search]:focus-visible{outline:2.5px solid var(--accent);outline-offset:1px}
  .chips{display:flex;gap:7px;margin-top:9px;flex-wrap:wrap}
  .chip{padding:7px 13px;border-radius:999px;border:1px solid var(--line);background:var(--card);
    color:var(--muted);font-size:13px;font-weight:700;cursor:pointer;min-height:36px}
  .chip[aria-pressed=true]{background:var(--accent);border-color:var(--accent);color:#fff}
  details.wk{background:var(--card);border:1px solid var(--line);border-radius:14px;margin-top:11px;overflow:hidden}
  details.wk[hidden]{display:none}
  summary{list-style:none;cursor:pointer;padding:15px 16px;display:flex;align-items:center;gap:11px;min-height:56px}
  summary::-webkit-details-marker{display:none}
  .date{font-variant-numeric:tabular-nums;font-weight:800;color:var(--accent);font-size:14px;flex:none}
  .wt{font-weight:800;font-size:16.5px;letter-spacing:-.01em}
  .cnt{margin-left:auto;font-size:12px;color:var(--muted);font-weight:700;flex:none}
  .why{margin:0 16px 6px;color:var(--muted);font-size:13.5px}
  .rec{border-top:1px solid var(--line);padding:15px 16px}
  .rec[hidden]{display:none}
  .rhead{display:flex;align-items:baseline;gap:9px;margin-bottom:10px}
  h4{margin:0;font-size:16px;font-weight:800;letter-spacing:-.01em}
  .meta{font-size:12.5px;color:var(--muted);font-weight:700;font-variant-numeric:tabular-nums}
  .cols{display:grid;grid-template-columns:1fr;gap:14px}
  @media(min-width:640px){.cols{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:20px}}
  .lbl{font-size:11.5px;letter-spacing:.1em;color:var(--muted);font-weight:800;margin-bottom:5px}
  ul.ing{margin:0;padding-left:17px}
  ul.ing li{margin:2px 0;font-size:14.5px}
  ol.steps{margin:0;padding-left:19px}
  ol.steps li{margin:3px 0;font-size:14.5px}
  .brand{background:var(--brand-bg);color:var(--brand-ink);font-weight:700;border-radius:5px;padding:1px 4px}
  .memo{margin-top:12px;padding:11px 13px;border-radius:11px;background:var(--ground);
    border:1px solid var(--line);font-size:13.5px;color:var(--muted);line-height:1.66}
  footer{margin-top:36px;padding-top:18px;border-top:1px solid var(--line);color:var(--muted);font-size:13px}
</style>
<div class="wrap">
<header>
  <div class="eyebrow">2026년 8월 13일 · 검수 요청</div>
  <h1>11주 주간 레시피</h1>
  <p class="lede">11월 2일 ~ 1월 18일에 <b>저절로</b> 열릴 것들이에요. 아직 앱엔 안 넣었어요.</p>
  <div class="ask">
    👀 <b>세 가지만 봐주시면 돼요.</b>
    <ol>
      <li><b>내가 쓰는 재료로</b> — 초피액젓·백간장처럼 바꿀 것 (칠해둔 곳이 지금 우리 양념이에요)</li>
      <li><b>양이랑 시간</b> — 설탕·간장 줄여도 되는지, 시간이 맞는지</li>
      <li><b>이상한 것</b> — 순서가 뒤바뀌었거나 안 해먹는 요리</li>
    </ol>
    ⛔ 고쳐 쓰지 마시고 <b>주차랑 요리 이름만</b> 짚어주세요. 고치는 건 제가 해요.
  </div>
  <div class="now">
    <div class="stat"><div class="k">주</div><div class="v">11주</div></div>
    <div class="stat"><div class="k">레시피</div><div class="v">${총편}편</div></div>
    <div class="stat"><div class="k">우리 양념 쓴 편</div><div class="v">${브랜드수}편</div></div>
  </div>
</header>

<div class="tools">
  <input type="search" id="q" placeholder="찾기 — 굴, 매생이, 초피액젓…" autocomplete="off">
  <div class="chips">
    <button class="chip" data-f="all" aria-pressed="true">전체 ${총편}</button>
    <button class="chip" data-f="brand" aria-pressed="false">우리 양념 쓴 것 ${브랜드수}</button>
    <button class="chip" data-f="open" aria-pressed="false">모두 펴기</button>
  </div>
</div>

${주들.map(주HTML).join('')}

<footer>
  📌 이 판은 <b>앱 데이터에서 뽑아서</b> 그렸어요 — 손으로 옮겨 적지 않았으니 실제와 다를 일이 없어요.<br>
  ✅ 「ㄱㄱ」 하시면 앱에 넣어요. 그러면 11월부터 <b>매주 저절로</b> 올라가요.
</footer>
</div>
<script>
  const q = document.getElementById('q')
  const chips = [...document.querySelectorAll('.chip')]
  let mode = 'all'
  function apply(){
    const t = q.value.trim().toLowerCase()
    document.querySelectorAll('details.wk').forEach(wk => {
      let shown = 0
      wk.querySelectorAll('.rec').forEach(r => {
        const okBrand = mode !== 'brand' || r.classList.contains('has-brand')
        const okText = !t || r.textContent.toLowerCase().includes(t) || wk.querySelector('summary').textContent.toLowerCase().includes(t)
        const ok = okBrand && okText
        r.hidden = !ok
        if (ok) shown++
      })
      wk.hidden = shown === 0
      if ((t || mode === 'brand') && shown) wk.open = true
    })
  }
  q.addEventListener('input', apply)
  chips.forEach(c => c.addEventListener('click', () => {
    const f = c.dataset.f
    if (f === 'open'){ document.querySelectorAll('details.wk').forEach(w => w.open = true); return }
    mode = f
    chips.forEach(x => { if (x.dataset.f !== 'open') x.setAttribute('aria-pressed', String(x.dataset.f === f)) })
    apply()
  }))
</script>`

writeFileSync(process.argv[2] || '/tmp/11주-검수판.html', html)
console.log(`✅ 만들었다 — ${주들.length}주 · ${총편}편 · 우리 양념 쓴 편 ${브랜드수}`)
