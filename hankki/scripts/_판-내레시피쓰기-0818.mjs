// ✍️ 「내 레시피 만드는 법 쓰기」 판 — 창업자가 «판에서 직접 적는» 판
//
// 📮 창업자 2026-08-18 = *"이걸 하루에 다 할 순 없고, 우리 12월까지 내 레시피 나갈거 있으니까
//    적당히 나눠서 하면 될 것같아. 그리고 난 지금 이게 어느정도로 써있고, 내가 뭘 써야할지 모르니까.
//    이것도 네가 판을 따로 만들어서(덮어쓰지말고-덮어쓰면 또 섞이잖아) 내가 적을 수 있게 해줘."*
//
// ⭐⭐ 그래서 이 판이 답해야 하는 것은 둘이다 —
//    ⑴ **지금 어느 정도로 써 있나** → 백업 원문(memo·재료·순서)을 «그대로» 보여준다
//    ⑵ **내가 뭘 써야 하나**       → 모자란 것을 카드마다 콕 집어 준다
//
// ⛔⛔ **덮어쓰지 않는다** — 묶음마다 «다른 파일 이름 · 다른 저장 열쇠».
//    창업자 원문 = *"덮어쓰면 또 섞이잖아"*. 실제로 2026-08-18 에 33편 판과 21편 판이
//    같은 열쇠를 써서 검수 메모가 통째로 밀렸다(고등어조림 메모가 연근사과샐러드에 붙었다).
//
// ⛔ 저장소가 public 이라 판(HTML)은 scratchpad 에서만 만든다.
// ⛔ 이 파일 전체가 템플릿 리터럴 범벅이다 — **주석에 백틱을 쓰지 말 것.** 문자열이 끊긴다.
//
// 쓰기:  node scripts/_판-내레시피쓰기-0818.mjs 1
//        node scripts/_판-내레시피쓰기-0818.mjs --목록      (묶음이 뭐뭐 있나)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const 창고 = new URL('../docs/_내레시피-백업/', import.meta.url)

// ── 원본 = 창업자 백업 «제일 새 판» ────────────────────────────────
// ⛔ 손으로 베끼지 않는다. 베끼면 창업자가 쓴 글과 어긋난 판을 보여주게 된다(규칙 30).
const 있는것 = readdirSync(창고).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort()
const 백업날 = 있는것[있는것.length - 1].replace('.json', '')
const d = JSON.parse(readFileSync(new URL(`${백업날}.json`, 창고), 'utf8'))
const 내것 = d.recipes.filter((r) => !String(r.id || '').startsWith('basic-'))

// 같은 제목이 여럿이면 (1)(2) — 「넣자」 목록과 같은 열쇠 규칙이다
const 셈 = new Map()
for (const r of 내것) { const t = (r.title || '').trim(); 셈.set(t, (셈.get(t) || 0) + 1) }
const 본 = new Map()
const 백 = new Map()
for (const r of 내것) {
  const t = (r.title || '').trim()
  const n = (본.get(t) || 0) + 1; 본.set(t, n)
  백.set((셈.get(t) || 0) > 1 ? `${t} (${n})` : t, r)
}

// ── 묶음 = «이름»으로 박는다 ───────────────────────────────────────
// ⛔ 순서 번호로 담지 않는다 — 목록이 하나만 바뀌어도 전부 밀린다(2026-08-18 사고).
// ⭐ 여기 있는 것은 전부 «만드는 법이 아예 없는(재료만)» 편이다 = 창업자가 써야 하는 것.
//    📮 창업자 = *"만드는법은 내가 써야해."*
const 묶음 = {
  1: {
    이름: '소스·양념',
    한줄: '재료는 이미 다 적혀 있어 — 섞는 순서만 알려주면 끝나는 것들이야',
    편: ['달래장', '막국수 양념', '비빔밥 소스', '쯔유국수 소스', '참깨 소스', '초무침 소스',
      '파절이 소스', '비냉 양념장', '마요간장 (웨지감자/샐러드 소스)', '마늘간장 계란장',
      '차돌된장', '장조림'],
  },
  2: {
    이름: '밥·국·면',
    한줄: '한 그릇 요리들 — 불 세기랑 끓이는 시간이 제일 궁금해',
    편: ['갈비탕', '국물 닭볶음탕', '순두부찌개', '해물누룽지탕', '전복죽', '약밥',
      '김치비빔국수', '봉골레 파스타', '오이샌드위치', '스키야키 (1)', '테리야끼 장어덮밥'],
  },
  3: {
    이름: '반찬·고기',
    한줄: '손질하고 굽고 무치는 것들',
    편: ['김치전', '깻잎찜', '꼬막무침', '늑어 픽타이담', '닭갈비', '마늘 소고기구이 (400g)',
      '목살돼지갈비구이', '생선조림', '소세지떡볶음', '오징어조림 (작은 것 3마리)', '편육냉채'],
  },
}

const 인자 = process.argv.slice(2)
if (인자.includes('--목록') || !인자.length) {
  console.log(`\n📚 백업 ${백업날} 기준 · 묶음\n`)
  for (const [k, v] of Object.entries(묶음)) {
    console.log(`  ${k}차  ${v.이름.padEnd(8)} ${String(v.편.length).padStart(2)}편 — ${v.한줄}`)
    console.log(`        ${v.편.join(' · ')}\n`)
  }
  console.log('  쓰기 =  node scripts/_판-내레시피쓰기-0818.mjs 1')
  process.exit(인자.length ? 0 : 1)
}
const 차 = 인자[0]
if (!묶음[차]) { console.error(`⛔ ${차}차 묶음이 없다 — --목록 으로 확인할 것`); process.exit(1) }
const 이번 = 묶음[차]

// ── 「지금 어느 정도로 써 있나」를 «재서» 말한다 ─────────────────────
const 줄 = (a) => (a || []).map((x) => String(x).trim()).filter(Boolean)
const 알맹 = (m) => String(m || '').replace(/^내가 적어둔 그대로\s*\n?/, '').trim()

const 살피기 = (r) => {
  const ing = 줄(r.ingredients)
  const st = 줄(r.steps)
  // ⚠️ 한 줄에 재료가 뭉쳐 있으면 앱에 넣을 때 줄로 갈라야 한다
  //    (2026-08-18 대조에서 19편이 이래서 겹침 판정을 못 했다)
  const 뭉침 = ing.length <= 2 && ing.join(' ').split(/\s+/).length >= 6
  return { ing, st, 뭉침 }
}

const 모자란것 = (s) => {
  const 것 = []
  if (!s.st.length) 것.push('만드는 법이 <b>아예 없어</b> — 걸음마다 한 줄씩 적어줘')
  else if (s.st.length < 3) 것.push(`만드는 법이 <b>${s.st.length}걸음</b>뿐이야 — 빠진 걸음을 채워줘`)
  if (s.뭉침) 것.push('재료가 <b>한 줄에 뭉쳐</b> 있어 — 아래 재료 칸에서 줄로 갈라주면 좋아')
  if (!s.ing.length) 것.push('재료가 <b>없어</b> — 재료 칸에 적어줘')
  return 것
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// ── 카드 ──────────────────────────────────────────────────────────
const 카드 = (제목, r, i) => {
  const s = 살피기(r)
  const 메모 = 알맹(r.memo)
  const 모 = 모자란것(s)
  const 갈래 = r.folder || r.category || '레시피'
  return `
<article class="card" data-key="${esc(r.id)}" data-title="${esc(제목)}">
  <header class="ch">
    <span class="no">${i + 1}</span>
    <div class="ct">
      <h2>${esc(제목)}</h2>
      <ul class="meta">
        <li class="cat">${esc(갈래)}</li>
        <li>재료 ${s.ing.length}줄</li>
        <li>만드는 법 ${s.st.length}걸음</li>
      </ul>
    </div>
    <span class="done" aria-hidden="true">✓</span>
  </header>

  ${메모 ? `<section class="orig">
    <h3>📮 네가 적어둔 그대로</h3>
    <div class="memo">${메모.split('\n').filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join('')}</div>
  </section>` : ''}

  <section>
    <h3>🥕 지금 재료 ${s.뭉침 ? '<span class="warn">한 줄에 뭉쳐 있어</span>' : ''}</h3>
    ${s.ing.length ? `<ul class="ig">${s.ing.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`
    : '<p class="none">아직 없어</p>'}
  </section>

  ${s.st.length ? `<section>
    <h3>👣 지금 만드는 법</h3>
    <ol class="st">${s.st.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
  </section>` : ''}

  <div class="need">
    <b>✍️ 네가 채울 것</b>
    <ul>${모.map((t) => `<li>${t}</li>`).join('')}</ul>
  </div>

  <div class="write">
    <label class="wl" for="st${i}">만드는 법 — <span>한 걸음에 한 줄</span></label>
    <textarea id="st${i}" class="ta st-in" rows="6"
      placeholder="예)&#10;양념을 다 넣고 잘 섞는다&#10;고기를 넣고 30분 재운다&#10;센 불에 5분 볶는다"></textarea>

    <details class="more">
      <summary>재료도 고칠래 ${s.뭉침 ? '<b class="warn2">← 여긴 갈라주면 좋아</b>' : ''}</summary>
      <label class="wl" for="ig${i}">재료 — 한 줄에 하나씩</label>
      <textarea id="ig${i}" class="ta ig-in" rows="5"
        placeholder="비워두면 위에 있는 걸 그대로 쓸게">${s.뭉침 ? esc(s.ing.join('\n')) : ''}</textarea>
    </details>

    <div class="nums">
      <label>⏱ <input class="num t-in" type="number" min="0" inputmode="numeric" placeholder="분"> 분</label>
      <label>👥 <input class="num s-in" type="number" min="0" inputmode="numeric" placeholder="인분"> 인분</label>
      <label class="later"><input type="checkbox" class="skip"> 나중에 할래</label>
    </div>
  </div>
</article>`
}

const 카드들 = 이번.편.map((제목, i) => {
  const r = 백.get(제목)
  if (!r) throw new Error(`⛔ 백업 ${백업날} 에 「${제목}」이 없다 — 이름이 바뀌었는지 볼 것`)
  if (줄(r.steps).length) throw new Error(`⛔ 「${제목}」은 만드는 법이 이미 ${줄(r.steps).length}걸음 있다 — 이 판은 «없는 것»만 담는다`)
  return 카드(제목, r, i)
}).join('\n')

const 다른묶음 = Object.entries(묶음)
  .map(([k, v]) => `<li${k === 차 ? ' class="now"' : ''}><b>${k}차 ${esc(v.이름)}</b> ${v.편.length}편${k === 차 ? ' — 이번 판' : ''}</li>`)
  .join('')

const html = `<title>내 레시피 ${차}차 ${이번.이름}</title>
<style>
  :root{
    --paper:#FAF6EF; --card:#FFFFFF; --ink:#2E1C0C; --dim:#7A6852; --faint:#9C8B76;
    --line:#E7DCCB; --brand:#5D3410; --brand-bg:#F3E7D8;
    --need:#B4472F; --need-bg:#FBEAE5;
    --orig:#2F6B3C; --orig-bg:#EDF4EE;
    --ok:#1E7A5A;
  }
  @media (prefers-color-scheme: dark){
    :root:not([data-theme="light"]){
      --paper:#191410; --card:#221B15; --ink:#F2E9DC; --dim:#B6A692; --faint:#8D7E6C;
      --line:#3A2F26; --brand:#E8C9A4; --brand-bg:#31261D;
      --need:#F09A82; --need-bg:#3A211B;
      --orig:#93CFA0; --orig-bg:#1C2E20;
      --ok:#6FD3AB;
    }
  }
  :root[data-theme="dark"]{
    --paper:#191410; --card:#221B15; --ink:#F2E9DC; --dim:#B6A692; --faint:#8D7E6C;
    --line:#3A2F26; --brand:#E8C9A4; --brand-bg:#31261D;
    --need:#F09A82; --need-bg:#3A211B;
    --orig:#93CFA0; --orig-bg:#1C2E20;
    --ok:#6FD3AB;
  }
  *{box-sizing:border-box}
  body{
    margin:0; padding:0 14px 40px; background:var(--paper); color:var(--ink);
    font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",system-ui,sans-serif;
    line-height:1.62; -webkit-text-size-adjust:100%;
  }
  .wrap{max-width:680px; margin:0 auto}

  header.top{padding:26px 0 6px}
  .kicker{margin:0; font-size:12.5px; font-weight:800; letter-spacing:.08em; color:var(--brand)}
  h1{margin:6px 0 10px; font-size:26px; line-height:1.25; letter-spacing:-.02em}
  h1 .nb{white-space:nowrap; color:var(--brand)}
  .lead{margin:0 0 14px; font-size:15px; color:var(--dim)}
  .lead b{color:var(--ink)}

  .plan{margin:0 0 18px; padding:14px 16px; background:var(--card); border:1px solid var(--line); border-radius:14px}
  .plan h2{margin:0 0 8px; font-size:13px; letter-spacing:.04em; color:var(--dim)}
  .plan ul{margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:5px}
  .plan li{font-size:14px; color:var(--dim)}
  .plan li.now{color:var(--ink); font-weight:700}
  .plan li.now b{color:var(--brand)}
  .plan .after{margin:10px 0 0; padding-top:10px; border-top:1px dashed var(--line); font-size:13.5px; color:var(--faint)}

  .card{
    margin:0 0 22px; padding:16px; background:var(--card);
    border:1px solid var(--line); border-radius:16px;
  }
  .card.is-done{border-color:var(--ok)}
  .card.is-skip{opacity:.55}
  .ch{display:flex; gap:11px; align-items:flex-start}
  .no{
    flex:0 0 auto; width:27px; height:27px; margin-top:2px; border-radius:9px;
    background:var(--brand-bg); color:var(--brand);
    font-size:13px; font-weight:800; display:grid; place-items:center;
  }
  .ct{flex:1 1 auto; min-width:0}
  .ch h2{margin:0; font-size:20px; letter-spacing:-.01em}
  .done{
    flex:0 0 auto; width:26px; height:26px; margin-top:2px; border-radius:50%;
    background:var(--ok); color:#fff; font-size:15px; font-weight:800;
    display:grid; place-items:center; opacity:0; transition:opacity .15s;
  }
  .card.is-done .done{opacity:1}
  .meta{margin:5px 0 0; padding:0; list-style:none; display:flex; flex-wrap:wrap; gap:6px}
  .meta li{font-size:12px; color:var(--dim); background:var(--paper); border:1px solid var(--line); border-radius:999px; padding:2px 9px}
  .meta .cat{color:var(--brand); border-color:var(--brand-bg); background:var(--brand-bg); font-weight:700}

  .card section{margin:15px 0 0}
  .card h3{margin:0 0 7px; font-size:13.5px; color:var(--dim); font-weight:800; letter-spacing:.01em}
  .warn{margin-left:6px; font-size:11.5px; font-weight:700; color:var(--need); background:var(--need-bg); border-radius:999px; padding:2px 8px}
  .orig{padding:12px 14px; background:var(--orig-bg); border-radius:12px}
  .orig h3{color:var(--orig)}
  .memo p{margin:0 0 4px; font-size:15px; white-space:pre-wrap}
  .memo p:last-child{margin:0}
  .ig{margin:0; padding:0 0 0 18px}
  .ig li{font-size:15px; margin:0 0 2px}
  .st{margin:0; padding:0 0 0 20px}
  .st li{font-size:15px; margin:0 0 4px}
  .none{margin:0; font-size:14.5px; color:var(--faint)}

  .need{margin:15px 0 0; padding:11px 14px; background:var(--need-bg); border-radius:12px}
  .need b{font-size:13px; color:var(--need)}
  .need ul{margin:5px 0 0; padding:0 0 0 17px}
  .need li{font-size:14px; margin:0 0 3px}

  .write{margin:15px 0 0; padding:14px; background:var(--paper); border:1px solid var(--line); border-radius:13px}
  .wl{display:block; margin:0 0 6px; font-size:13.5px; font-weight:800}
  .wl span{font-weight:500; color:var(--faint)}
  .ta{
    display:block; width:100%; padding:12px 13px; font:inherit; font-size:16px; line-height:1.6;
    color:var(--ink); background:var(--card); border:1px solid var(--line); border-radius:11px; resize:vertical;
  }
  .ta::placeholder{color:var(--faint)}
  .ta:focus,.num:focus{outline:2px solid var(--brand); outline-offset:1px; border-color:transparent}
  .more{margin:11px 0 0}
  .more summary{font-size:13.5px; font-weight:700; color:var(--dim); cursor:pointer; padding:4px 0}
  .more .wl{margin-top:8px}
  .warn2{color:var(--need); font-weight:800}
  .nums{margin:12px 0 0; display:flex; flex-wrap:wrap; gap:12px; align-items:center}
  .nums label{font-size:14px; color:var(--dim); display:flex; align-items:center; gap:5px}
  .num{
    width:74px; padding:8px 10px; font:inherit; font-size:15px; text-align:center;
    color:var(--ink); background:var(--card); border:1px solid var(--line); border-radius:9px;
  }
  .later{margin-left:auto; font-weight:700}
  .later input,.judge input{width:19px; height:19px; accent-color:var(--brand)}

  .bar{
    position:sticky; bottom:0; z-index:20; display:flex; gap:10px; align-items:center; flex-wrap:wrap;
    margin:18px 0 0; padding:12px 14px; border:1px solid var(--line); border-radius:14px;
    background:var(--card); box-shadow:0 -6px 18px rgba(0,0,0,.08);
  }
  .bar button{
    font:inherit; font-weight:800; font-size:15px; padding:11px 16px; border-radius:11px;
    border:0; background:var(--brand); color:var(--paper); cursor:pointer;
  }
  .bar span{font-size:13px; color:var(--dim); font-weight:700}
  #fallback{margin:14px 0 0}
  #out{width:100%; padding:12px; font:inherit; font-size:14px; color:var(--ink);
    background:var(--card); border:1px solid var(--line); border-radius:11px}
  .sig{margin:22px 0 0; font-size:13px; color:var(--faint)}
</style>

<div class="wrap">
<header class="top">
  <p class="kicker">내 레시피 · ${차}차</p>
  <!-- 숫자와 단위가 갈리면 「12 / 편」으로 읽힌다 — 눈으로 보고 잡았다(규칙 21) -->
  <h1>${esc(이번.이름)} <span class="nb">${이번.편.length}편</span><br>만드는 법 쓰기</h1>
  <p class="lead">${esc(이번.한줄)}.<br>
    적으면 <b>바로 저장돼</b> — 껐다 켜도 남아. 다 하면 맨 아래 <b>결과 복사</b>를 눌러서 붙여줘.</p>
</header>

<div class="plan">
  <h2>전체 계획 — 네가 쓸 것은 34편이야</h2>
  <ul>${다른묶음}</ul>
  <p class="after">나머지 <b>69편</b>은 네 손 안 가도 돼 —
    만드는 법이 3걸음 넘게 적힌 36편은 내가 그대로 옮기고,
    1~2걸음만 적힌 33편은 내가 채워서 검수판으로 보여줄게.</p>
</div>

${카드들}

<div class="bar" id="bar">
  <button id="copy" type="button">📋 결과 복사</button>
  <span id="cnt"></span>
</div>
<div id="fallback" hidden>
  <p>복사가 안 됐어 — <b>아래 글을 길게 눌러 전부 복사</b>해서 채팅에 붙여줘.</p>
  <textarea id="out" readonly rows="12"></textarea>
</div>

<p class="sig">이 판은 손으로 안 썼어 — 네 백업 <b>${백업날}</b> 원문을 그대로 그렸어.
  ${차}차 판이라 <b>다른 묶음이랑 안 섞여</b>.</p>
</div>

<script>
/* 💾 저장 = localStorage. artifact-sync 는 이 판에서 «안 돈다»(LIVE DOCS ONLY).
   ⛔ 열쇠에 «묶음 번호»가 들어간다 — 창업자 말대로 덮어쓰면 또 섞인다.
   ⛔ 담는 모양은 «레시피 이름표(id)» 기준이다. 순서 번호로 담으면 판이 바뀔 때 통째로 밀린다
      (2026-08-18 사고: 고등어조림 메모가 연근사과샐러드에 붙었다). */
(function () {
  var KEY = 'hankki:내레시피쓰기:${차}차:v1'
  var arts = [].slice.call(document.querySelectorAll('article[data-key]'))
  var cnt = document.getElementById('cnt')

  function 칸(art) {
    return {
      st: art.querySelector('.st-in'),
      ig: art.querySelector('.ig-in'),
      t: art.querySelector('.t-in'),
      s: art.querySelector('.s-in'),
      skip: art.querySelector('.skip'),
    }
  }
  function 찼나(q) {
    return !!(q.st && q.st.value.trim())
  }
  function 칠하기() {
    var 쓴 = 0, 미룬 = 0
    arts.forEach(function (art) {
      var q = 칸(art)
      var w = 찼나(q), sk = q.skip && q.skip.checked
      art.classList.toggle('is-done', w && !sk)
      art.classList.toggle('is-skip', !!sk)
      if (w && !sk) 쓴++
      if (sk) 미룬++
    })
    cnt.textContent = 쓴 ? (쓴 + '/' + arts.length + '편 썼어 — 저장됐어' + (미룬 ? ' · 미룬 것 ' + 미룬 : ''))
      : '아직 안 썼어 — 하나만 적어도 저장돼'
  }
  function 저장() {
    var out = {}
    arts.forEach(function (art) {
      var k = art.getAttribute('data-key'); if (!k) return
      var q = 칸(art)
      var v = {
        st: q.st ? q.st.value : '',
        ig: q.ig ? q.ig.value : '',
        t: q.t ? q.t.value : '',
        s: q.s ? q.s.value : '',
        skip: q.skip && q.skip.checked ? 1 : 0,
      }
      if (v.st.trim() || v.ig.trim() || v.t || v.s || v.skip) out[k] = v
    })
    try { localStorage.setItem(KEY, JSON.stringify(out)) } catch (e) {}
    칠하기()
  }
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      arts.forEach(function (art) {
        var v = saved[art.getAttribute('data-key')]; if (!v) return
        var q = 칸(art)
        if (q.st && v.st) q.st.value = v.st
        if (q.ig && v.ig) q.ig.value = v.ig
        if (q.t && v.t) q.t.value = v.t
        if (q.s && v.s) q.s.value = v.s
        if (q.skip) q.skip.checked = !!v.skip
      })
    }
  } catch (e) {}
  칠하기()
  arts.forEach(function (art) {
    var q = 칸(art)
    ;[q.st, q.ig, q.t, q.s].forEach(function (el) { if (el) el.addEventListener('input', 저장) })
    if (q.skip) q.skip.addEventListener('change', 저장)
  })

  function 글만들기() {
    var 덩 = []
    arts.forEach(function (art) {
      var q = 칸(art)
      var 제목 = art.getAttribute('data-title') || '?'
      var st = q.st ? q.st.value.trim() : ''
      var ig = q.ig ? q.ig.value.trim() : ''
      var t = q.t ? q.t.value.trim() : ''
      var s = q.s ? q.s.value.trim() : ''
      var sk = q.skip && q.skip.checked
      if (sk) { 덩.push('■ ' + 제목 + ' — 나중에'); return }
      if (!st && !ig && !t && !s) return
      var 줄 = ['■ ' + 제목]
      if (st) 줄.push('[만드는 법]\\n' + st)
      if (ig) 줄.push('[재료]\\n' + ig)
      if (t || s) 줄.push('[' + (t ? t + '분' : '') + (t && s ? ' · ' : '') + (s ? s + '인분' : '') + ']')
      덩.push(줄.join('\\n'))
    })
    return 덩.length ? ('[내 레시피 ${차}차 · ${이번.이름}]\\n\\n' + 덩.join('\\n\\n')) : ''
  }
  document.getElementById('copy').addEventListener('click', function () {
    var 글 = 글만들기()
    if (!글) { cnt.textContent = '아직 아무것도 안 적었어'; return }
    var fb = document.getElementById('fallback')
    var out = document.getElementById('out')
    /* ⛔ writeText 는 «성공했다고 해놓고» 실패한다(v10.97) → 결과와 무관하게 글도 같이 띄운다 */
    out.value = 글
    fb.hidden = false
    out.focus(); out.select()
    try { if (navigator.clipboard) navigator.clipboard.writeText(글).catch(function () {}) } catch (e) {}
    try { document.execCommand('copy') } catch (e) {}
    cnt.textContent = '복사했어 — 안 됐으면 아래 글을 붙여줘'
  })
})()
</script>
`

const 파일 = `내레시피쓰기-${차}차-${이번.이름}.html`
writeFileSync(join(OUT, 파일), html)
console.log(`✅ ${차}차 「${이번.이름}」 ${이번.편.length}편 — ${(html.length / 1024).toFixed(0)}KB`)
console.log(`   ${join(OUT, 파일)}`)
for (const 제목 of 이번.편) {
  const r = 백.get(제목)
  const s = 살피기(r)
  console.log(`   · ${제목.padEnd(24)} 재료 ${String(s.ing.length).padStart(2)}줄${s.뭉침 ? ' ⚠️뭉침' : '     '}${알맹(r.memo) ? ' · 원문 있음' : ''}`)
}
