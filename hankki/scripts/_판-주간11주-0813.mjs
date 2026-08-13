// 🍲 11주 주간 레시피 검수판 만들기 (2026-08-13)
//
// ⭐ 손으로 안 쓴다 — `basics.js` · `weekly.js` 를 «직접 읽어» 그린다.
//    그래서 창업자 지시를 반영하고 이걸 다시 돌리면 판이 저절로 최신이 된다.
//    ⛔ 중간에 JSON 을 거치지 않는다 — 2026-08-13 에 /tmp 에 뽑아뒀다가
//       레시피를 고친 뒤 그 낡은 JSON 으로 판을 그릴 뻔했다.
//
// 쓰기 = node scripts/_판-주간11주-0813.mjs <낼 파일>
//
// 📌 판 성격 = 창업자가 «폰에서» 읽고 판정하는 것. 저장소 .md 는 폰에서 못 본다.
import { allBasicRecipes } from '../src/data/basics.js'
import { WEEKLY } from '../src/data/weekly.js'
import { writeFileSync } from 'node:fs'

const OUT = process.argv[2]
if (!OUT) { console.error('낼 파일을 달라 — node scripts/_판-주간11주-0813.mjs <파일>'); process.exit(1) }

const FROM = '2026-11-02'   // 11주 = 이 주부터
const TO   = '2027-01-18'   // 마지막 주(초간단 반찬)

// 🏷 우리 양념 = 「맛이 바뀌는 재료」 ＋ 브랜드. 칠해서 창업자 눈에 먼저 들어오게.
//    ⛔ 늘리기 전에 basics.js 를 볼 것 — 여기 없는 이름은 안 칠해진다.
const BRAND = ['초피액젓', '백간장', '아우노슈가', '성가정', '복이네', '쌀누룩',
  '홍영의', '해물가루육수', '연두', '치킨스톡', '자연드림', '올바른가', '와촌식품']

// ✏️ 2026-08-13 창업자 지시로 «오늘 고친» 편 — 판에서 따로 짚어준다.
//    창업자가 볼 것은 「예쁜가」가 아니라 «내가 말한 대로 됐나» 라서다.
const 고침 = {
  'basic-baechu-kimchi': '참기름 빼고 · 마늘 듬뿍(기호에 따라) · 초피액젓 「간 보며 가감」',
  'basic-gimjang-suyuk': '창업자 원문 「초초 간단 버전」으로 통째 교체 — 된장·월계수잎·커피가루·소주 뺐다',
  'basic-baechu-jeon': '반죽에 해물가루육수 1큰술 (없으면 백간장 1/2큰술)',
  'basic-manduguk': '초피액젓 1큰술 ＋ 백간장 1큰술로 감칠맛 (간은 가감)',
  'basic-dongtae-jjigae': '해물가루육수 1봉 추가',
  'basic-altang': '해물가루육수 1봉 추가',
  'basic-mugeunji-bokkeum': '해물가루육수 1봉 ＋ 올리고당 빼고 아우노슈가 1큰술 (당도는 가감)',
  'basic-gambas': '백간장 1큰술 (소금 대신) ＋ 오징어 넣으면 깔라마리 알 아히요',
  'basic-paella': '해물가루육수 1/2봉',
  'basic-gul-jeon': '백간장 1작은술 (소금 대신 · 연두도 좋아요)',
  'basic-maesaengi-bajirak-guk': '해물가루육수 1봉 (기호에 따라)',
  'basic-maesaengi-kalguksu': '해물가루육수 2봉',
  'basic-maesaengi-jeon': '반죽에 해물가루육수 1큰술',
  'basic-kkodeul-danmuji-muchim': '⭐새로 씀 — 창업자 원문 그대로 (김치볶음밥 자리에 · 김치볶음밥은 나중에 한그릇요리로)',
  'basic-eomuk-bokkeum': '전처리 추가 — 10초 데치고 200도에 7분 ＋ 뒤집어 5분 노릇하게 굽기 (25분)',
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
// 브랜드 낱말이 있으면 그 «줄 전체»를 칠한다 — 낱말만 칠하면 분량이 잘려 읽기 나쁘다
const 칠 = line => BRAND.some(b => line.includes(b))
  ? `<span class="brand">${esc(line)}</span>` : esc(line)

const by = new Map(allBasicRecipes.map(r => [r.id, r]))
const 주 = WEEKLY.filter(w => w.from >= FROM && w.from <= TO)
if (!주.length) { console.error('⛔ 그 범위에 주가 없다 — 날짜를 확인할 것'); process.exit(1) }

// ⛔ 「고침」 id 를 오타내면 «조용히 안 뜬다» — 그러면 창업자가 고친 걸 못 본다.
//    실제로 2026-08-13 에 `mukeunji`(오타) 라 적어 묵은지볶음이 통째로 빠졌다. 그래서 죽인다.
const 주id = new Set(주.flatMap(w => w.ids))
const 없는것 = Object.keys(고침).filter(id => !주id.has(id))
if (없는것.length) {
  console.error('⛔ 「고침」에 적었는데 이 11주에 없는 id — 오타이거나 딴 주다:')
  없는것.forEach(id => console.error('   ·', id, by.has(id) ? '(레시피는 있는데 이 주가 아니다)' : '(그런 레시피가 없다)'))
  process.exit(1)
}

let 편수 = 0, 양념편 = 0, 고친편 = 0
const 몸통 = 주.map((w, wi) => {
  const 편 = w.ids.map(id => {
    const r = by.get(id)
    if (!r) { console.error(`⛔ ${w.from} 「${w.title}」 의 ${id} 가 basics.js 에 없다`); process.exit(1) }
    편수++
    const has = r.ingredients.some(칠 => BRAND.some(b => 칠.includes(b)))
    if (has) 양념편++
    const fix = 고침[id]
    if (fix) 고친편++
    return `
  <article class="rec${has ? ' has-brand' : ''}${fix ? ' has-fix' : ''}">
    <div class="rhead">
      <h4>${esc(r.title)}</h4>
      <span class="meta">${r.time}분 · ${r.servings}인분</span>
    </div>
    ${fix ? `<p class="fix"><b>오늘 고침</b> — ${esc(fix)}</p>` : ''}
    <div class="cols">
      <div>
        <div class="lbl">재료</div>
        <ul class="ing">${r.ingredients.map(i => `<li>${칠(i)}</li>`).join('')}</ul>
      </div>
      <div>
        <div class="lbl">만드는 법</div>
        <ol class="steps">${r.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      </div>
    </div>
    ${r.memo ? `<div class="memo">${r.memo.split('\n\n').map(p => `<p>${esc(p)}</p>`).join('')}</div>` : ''}
  </article>`
  }).join('')

  const [, m, d] = w.from.split('-')
  return `
  <details class="wk"${wi === 0 ? ' open' : ''}>
    <summary>
      <span class="date">${m}/${d}</span>
      <span class="wt">${esc(w.title)}</span>
      <span class="cnt">${w.ids.length}편</span>
    </summary>
    <p class="why">${esc(w.why)}</p>${편}
  </details>`
}).join('')

const html = `<title>11주 주간 레시피 검수</title>
<style>
  /* 색 = 앱 팔레트(그레이지 ＋ 더스티블루). 브랜드 재료만 «따뜻한 호박»으로 따로 튄다 */
  :root{
    --ground:#F5F2EC; --card:#FFFFFF; --ink:#33291F; --muted:#857767;
    --accent:#5878a0; --accent-soft:#E7EDF4; --line:#E4DED3;
    --brand-bg:#F6EAD1; --brand-ink:#87652C;
    --fix-bg:#EAF2E8; --fix-ink:#3F6B44; --fix-line:#BFD6C0;
  }
  @media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
    --ground:#17171b; --card:#212024; --ink:#E9E3DA; --muted:#9C9287;
    --accent:#7093c0; --accent-soft:#232C38; --line:#32302C;
    --brand-bg:#3A2F1C; --brand-ink:#E0BE7C;
    --fix-bg:#1E2A20; --fix-ink:#9FC9A5; --fix-line:#334636;
  }}
  :root[data-theme="dark"]{
    --ground:#17171b; --card:#212024; --ink:#E9E3DA; --muted:#9C9287;
    --accent:#7093c0; --accent-soft:#232C38; --line:#32302C;
    --brand-bg:#3A2F1C; --brand-ink:#E0BE7C;
    --fix-bg:#1E2A20; --fix-ink:#9FC9A5; --fix-line:#334636;
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
  .fix{margin:0 0 11px;padding:9px 12px;border-radius:10px;background:var(--fix-bg);color:var(--fix-ink);
    border:1px solid var(--fix-line);font-size:13.5px;line-height:1.6}
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
  .memo p{margin:0 0 8px}
  .memo p:last-child{margin:0}
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
    <div class="stat"><div class="k">주</div><div class="v">${주.length}주</div></div>
    <div class="stat"><div class="k">레시피</div><div class="v">${편수}편</div></div>
    <div class="stat"><div class="k">우리 양념 쓴 편</div><div class="v">${양념편}편</div></div>
    <div class="stat"><div class="k">오늘 고친 편</div><div class="v">${고친편}편</div></div>
  </div>
</header>

<div class="tools">
  <input type="search" id="q" placeholder="찾기 — 굴, 매생이, 초피액젓…" autocomplete="off">
  <div class="chips">
    <button class="chip" data-f="all" aria-pressed="true">전체 ${편수}</button>
    <button class="chip" data-f="fix" aria-pressed="false">오늘 고친 것 ${고친편}</button>
    <button class="chip" data-f="brand" aria-pressed="false">우리 양념 쓴 것 ${양념편}</button>
    <button class="chip" data-f="open" aria-pressed="false">모두 펴기</button>
  </div>
</div>
${몸통}
<footer>
  값은 <b>앱 데이터에서 직접 읽어</b> 그렸어요 — 손으로 옮겨 적지 않았습니다.<br>
  다시 뽑기 = <code>node scripts/_판-주간11주-0813.mjs &lt;파일&gt;</code>
</footer>
</div>
<script>
  const q = document.getElementById('q')
  const chips = [...document.querySelectorAll('.chip')]
  let 갈래 = 'all'

  function 그리기(){
    const 말 = q.value.trim().toLowerCase()
    for (const wk of document.querySelectorAll('details.wk')) {
      let 남음 = 0
      for (const rec of wk.querySelectorAll('.rec')) {
        const 글 = rec.textContent.toLowerCase()
        const 말맞음 = !말 || 글.includes(말) || wk.querySelector('.wt').textContent.toLowerCase().includes(말)
        const 갈래맞음 = 갈래 === 'brand' ? rec.classList.contains('has-brand')
                      : 갈래 === 'fix'   ? rec.classList.contains('has-fix')
                      : true
        const 보임 = 말맞음 && 갈래맞음
        rec.hidden = !보임
        if (보임) 남음++
      }
      wk.hidden = 남음 === 0
      wk.querySelector('.cnt').textContent = 남음 + '편'
      // 찾는 중이거나 갈래를 좁혔으면 저절로 펴준다 — 접혀 있으면 「없다」로 읽힌다
      if (말 || 갈래 !== 'all') wk.open = !wk.hidden
    }
  }

  q.addEventListener('input', 그리기)
  for (const c of chips) c.addEventListener('click', () => {
    const f = c.dataset.f
    if (f === 'open') {
      const 펼까 = c.getAttribute('aria-pressed') !== 'true'
      c.setAttribute('aria-pressed', String(펼까))
      for (const wk of document.querySelectorAll('details.wk')) if (!wk.hidden) wk.open = 펼까
      return
    }
    갈래 = f
    for (const o of chips) if (o.dataset.f !== 'open') o.setAttribute('aria-pressed', String(o.dataset.f === f))
    그리기()
  })
</script>
`

writeFileSync(OUT, html)
console.log(`✅ ${OUT} — ${주.length}주 · ${편수}편 (우리 양념 ${양념편} · 오늘 고침 ${고친편})`)
