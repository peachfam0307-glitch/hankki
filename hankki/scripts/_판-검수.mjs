// 🍧 8/17 에 «저절로» 열린 다섯 편 검수판 — 창업자에게 보여줄 판
//
// ⛔ 손으로 안 쓴다. `src/data/basics.js` 에서 «그대로» 읽어 그린다.
//    베껴 적으면 앱과 어긋난 판을 보여주게 된다(그러면 검수가 헛것이 된다).
// ⛔ 저장소가 public 이라 판은 scratchpad 에서만 만든다.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const APP = new URL('..', import.meta.url).pathname
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'

// ── 레시피 = 앱이 «화면에 쓰는 바로 그 값» ────────────────────────
// ⛔⛔ [2026-08-17] 첫 판은 여기서 basics.js 를 «글자로 파싱»했다.
//    그래서 politeSteps() 를 안 거친 «원문»이 나왔고, 창업자가 **앱에 없는 문체 문제**를
//    세 편이나 짚느라 시간을 썼다 (창업자 *"여름꺼 3개 문체이상이야."*).
//    ⭐ 이제 recipe.mjs 를 부른다 — 흉내가 아니라 앱과 «같은 모듈»이라 어긋날 수가 없다.
//    ⛔ 여기서 다시 파싱하지 말 것.
import { 레시피들 } from './recipe.mjs'
const 편들 = new Map(레시피들().map((r) => [r.id, r]))

// ── 어느 날짜에 열리는 편을 뽑을까 — 날짜를 «인자»로 받는다 ─────────
//
// 📮 창업자 확정 2026-08-17 = *"앞으로 **한달치씩 미리 검수해두자.** 전날도 무조건 한번 확인하고 나가고"*
//
// ⛔ 옛 판(`_판-검수5편-0817.mjs`)은 8/17 다섯 편이 «손으로 박혀» 있었다.
//    그러면 다음 달에 또 새 파일을 만들게 되고, 그때마다 파서를 다시 짜다 사고가 난다(오늘 실제로 그랬다).
// ⭐ 이 판은 **날짜만 주면** 그날 열리는 편을 앱 데이터에서 뽑아 그린다.
//
// 쓰기:  node scripts/_판-검수.mjs 2026-08-24
//        node scripts/_판-검수.mjs 2026-09-07 2026-09-14 2026-09-21 2026-09-28   ← 한 달치
//        (열릴 날짜 목록은 `node scripts/release-calendar.mjs --month 2026-09`)
const 날짜들 = process.argv.slice(2).filter((a) => /^\d{4}-\d{2}-\d{2}$/.test(a)).sort()
if (!날짜들.length) {
  console.error('⛔ 날짜를 달라 —  node scripts/_판-검수.mjs 2026-08-24 [2026-08-31 …]')
  console.error('   그 달에 열리는 날짜 보기 =  node scripts/release-calendar.mjs --month 2026-09')
  process.exit(1)
}

// 🏷 줄 이름(「여름 시원한 것」·「우리집레시피」)은 **weekly.js 에서 온다** — 손으로 적지 않는다.
const { gates } = await import('./release-calendar.mjs')
const 줄이름 = new Map()
for (const g of gates()) {
  if (g.kind !== 'recipe') continue
  const 앞 = g.what.split(' — ')[0]
  for (const k of g.keys) 줄이름.set(k, { 날: g.date, 줄: 앞 })
}

const 목록 = 레시피들()
  .filter((r) => 날짜들.includes(r.from))
  .map((r) => ({
    id: r.id,
    줄: 줄이름.get(r.title)?.줄 || r.folder || '레시피',
    출처: `${r.from} · 그날 저절로 열려`,
    누가: r.review === '창업자' ? '네가 이미 본 것' : '⏳ 아직 검수 전',
    볼것: '재료·양 · 순서 · 시간·인분·난이도',
  }))
if (!목록.length) {
  console.error(`⛔ ${날짜들.join(' · ')} 에 열리는 레시피가 없다 — 날짜를 다시 볼 것`)
  process.exit(1)
}

// ── 그림을 판에 «박아» 넣는다 (밖에서 못 불러오니 통째로) ──────────
const 그림 = (key) => {
  const p = join(APP, 'src/assets/stickers/photo', `${key}.png`)
  if (!existsSync(p)) return null
  // 작게 줄여 넣는다 — 폰에서 여는 판이라 무거우면 안 열린다
  const 작은 = join(OUT, `_thumb-${key}.png`)
  try {
    execFileSync('python3', ['-c', [
      'import sys',
      'from PIL import Image',
      'im = Image.open(sys.argv[1]).convert("RGBA")',
      // 📐 화면 표시는 78px 이라 220px 이면 2.8배 — 넉넉하다.
      //    ⛔ 320px 로 두면 24편 판이 4.4MB 가 돼 폰에서 무겁다(5편일 땐 858KB 였다).
      'im.thumbnail((220, 220), Image.LANCZOS)',
      'im.save(sys.argv[2])',
    ].join('\n'), p, 작은])
    return `data:image/png;base64,${readFileSync(작은).toString('base64')}`
  } catch {
    return `data:image/png;base64,${readFileSync(p).toString('base64')}`
  }
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// 재료 줄에서 「[소스]」 같은 묶음 머리를 갈라낸다
const 재료줄 = (t) => {
  const h = t.match(/^\[(.+)\]$/)
  if (h) return `<li class="ig-h">${esc(h[1])}</li>`
  // 「제품이름 (대체품)」의 괄호는 흐리게
  const html = esc(t).replace(/\(([^)]*)\)/g, '<span class="sub">($1)</span>')
  return `<li>${html}</li>`
}

const 카드 = (r, meta, i) => {
  const 색 = /우리집/.test(meta.줄) ? 'home' : 'cool'
  const img = 그림(r.icon)
  return `
<article class="card ${색}" id="r${i + 1}">
  <header class="card-h">
    ${img ? `<img class="thumb" src="${img}" alt="">` : '<div class="thumb none">그림 없음</div>'}
    <div class="card-t">
      <p class="eyebrow">${esc(meta.줄)}</p>
      <h2>${esc(r.title)}</h2>
      <ul class="meta">
        <li>${esc(r.time)}분</li>
        <li>${esc(r.servings)}인분</li>
        <li>${esc(r.difficulty)}</li>
        <li class="cat">${esc(r.folder || r.category)}</li>
      </ul>
    </div>
  </header>

  <div class="from">
    <p><b>언제 열려</b> ${esc(meta.출처)}</p>
    <p><b>누가 쓴 값</b> <span class="who ${meta.누가.startsWith('네') ? 'yours' : 'mine'}">${esc(meta.누가)}</span></p>
    <p><b>봐줄 것</b> ${esc(meta.볼것)}</p>
    ${meta.고침 ? `<p class="fixed"><b>고쳤어</b> ${esc(meta.고침)}</p>` : ''}
  </div>

  <section>
    <h3>재료 <span class="n">${r.ingredients.filter((x) => !/^\[/.test(x)).length}줄</span></h3>
    <ul class="ig">${r.ingredients.map(재료줄).join('')}</ul>
  </section>

  <section>
    <h3>만드는 법 <span class="n">${r.steps.length}걸음</span></h3>
    <ol class="st">${r.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
  </section>

  ${r.memo ? `<section><h3>메모</h3><div class="memo">${r.memo.split('\n').filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join('')}</div></section>` : ''}

  <!-- ✍️✍️ [2026-08-18 창업자] **판에서 바로 체크·입력한다.**
       📮 창업자 = *"검수판에 내가 바로 체크하거나 입력할수있게 해줄래?"*
       ⭐⭐ 여기가 «공유 문서»다(artifact-sync 영역) — 창업자가 체크하거나 적으면
          그 DOM 변화가 그대로 저장되고 **내가 읽는다.** 채팅으로 옮겨 적을 필요가 없다.
       ⛔ 규칙 셋(런타임 계약 0.2.4) —
          ⑴ 마크업을 **HTML 로 페이지에 쓴다.** 브라우저에서 JS 로 렌더하면 저장이 «꺼진다».
          ⑵ **textarea 는 값이 캡처 안 된다** → 반드시 input.
          ⑶ 손짓(클릭·타이핑) 중의 변화만 저장된다 — 타이머·load 때 바꾼 건 안 남는다.
       ⛔ ＋ 이 주석을 고칠 때 «백틱»을 쓰지 말 것 — 이 카드 전체가 템플릿 리터럴이라 문자열이 끊긴다
          (2026-08-18 에 실제로 그래서 빌드가 죽었다. CLAUDE.md 에 박힌 함정인데 또 밟았다). -->
  <artifact-sync>
    <div class="judge">
      <label class="ok"><input type="checkbox" class="ck"> <span>봤어 · 괜찮아</span></label>
      <label class="bad"><input type="checkbox" class="ck"> <span>이상해</span></label>
      <input class="note" type="text" placeholder="어디가 이상한지 한 줄 (고치는 건 내가 할게)">
    </div>
  </artifact-sync>
</article>`
}

const 그린것 = 목록.map((m, i) => {
  const r = 편들.get(m.id)
  if (!r) throw new Error(`⛔ ${m.id} 를 basics.js 에서 못 찾았다 — 판이 앱과 어긋난다`)
  if (!날짜들.includes(r.from)) throw new Error(`⛔ ${r.title} 의 from 이 ${r.from} 이다 — 고른 날짜가 아니다`)
  return { 날: r.from, 줄: m.줄, html: 카드(r, m, i) }
})
// 📅 날짜별로 묶는다 — 한 달치를 뽑으면 주차마다 칸이 생긴다
const 날짜별 = 날짜들.map((d) => ({
  날: d,
  줄들: [...new Set(그린것.filter((x) => x.날 === d).map((x) => x.줄))],
  html: 그린것.filter((x) => x.날 === d).map((x) => x.html).join('\n'),
  수: 그린것.filter((x) => x.날 === d).length,
})).filter((g) => g.수)
const 몸통 = 날짜별.map((g) => `
  <div class="grp ${g.줄들.some((s) => /우리집/.test(s)) && g.줄들.length === 1 ? 'home' : 'cool'}">
    <b>${g.날}</b><span>${g.수}편 · ${g.줄들.join(' · ')}</span>
  </div>
  ${g.html}`).join('\n')
const 총 = 그린것.length

const 이름 = 날짜들.length === 1 ? 날짜들[0] : `${날짜들[0]} ~ ${날짜들[날짜들.length - 1]}`
const html = `<title>레시피 검수판 ${이름}</title>
<style>
  :root{
    --paper:#FAF6EF; --card:#FFFFFF; --ink:#2E1C0C; --dim:#7A6852; --faint:#9C8B76;
    --line:#E7DCCB; --brand:#5D3410;
    --cool:#0E6B72; --cool-bg:#E6F1F1;
    --home:#8A4B2A; --home-bg:#F6EAE1;
    --mine:#B4472F; --mine-bg:#FBEAE5;
    --yours:#2F6B3C; --yours-bg:#E8F2E9;
  }
  @media (prefers-color-scheme: dark){
    :root:not([data-theme="light"]){
      --paper:#191410; --card:#221B15; --ink:#F2E9DC; --dim:#B6A692; --faint:#8D7E6C;
      --line:#3A2F26; --brand:#E8C9A4;
      --cool:#7FD3D8; --cool-bg:#12312F;
      --home:#E3A87C; --home-bg:#33221A;
      --mine:#F09A82; --mine-bg:#3A211B;
      --yours:#93CFA0; --yours-bg:#1C2E20;
    }
  }
  :root[data-theme="dark"]{
    --paper:#191410; --card:#221B15; --ink:#F2E9DC; --dim:#B6A692; --faint:#8D7E6C;
    --line:#3A2F26; --brand:#E8C9A4;
    --cool:#7FD3D8; --cool-bg:#12312F;
    --home:#E3A87C; --home-bg:#33221A;
    --mine:#F09A82; --mine-bg:#3A211B;
    --yours:#93CFA0; --yours-bg:#1C2E20;
  }

  *{box-sizing:border-box}
  body{
    margin:0; background:var(--paper); color:var(--ink);
    font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic","맑은 고딕",system-ui,sans-serif;
    font-size:16px; line-height:1.72; letter-spacing:-.01em;
    -webkit-text-size-adjust:100%;
  }
  .wrap{max-width:640px; margin:0 auto; padding:28px 18px 72px}

  /* ── 머리 ─────────────────────────────── */
  .hero{padding:8px 0 26px; border-bottom:2px solid var(--ink)}
  .date{font-size:13px; font-weight:700; letter-spacing:.14em; color:var(--faint); margin:0 0 10px}
  h1{margin:0; font-size:clamp(30px,8.4vw,42px); line-height:1.18; font-weight:800; letter-spacing:-.035em; text-wrap:balance}
  .lead{margin:14px 0 0; color:var(--dim); font-size:15px}

  .ask{
    margin:22px 0 0; padding:16px 18px; background:var(--card);
    border:1px solid var(--line); border-radius:14px;
  }
  .ask h2{margin:0 0 10px; font-size:14px; font-weight:800; letter-spacing:.02em}
  .ask ol{margin:0; padding-left:20px}
  .ask li{margin:5px 0; font-size:15px}
  .ask .no{margin:12px 0 0; padding-top:12px; border-top:1px dashed var(--line); font-size:14px; color:var(--dim)}

  /* ── 줄 머리 ──────────────────────────── */
  .grp{margin:40px 0 16px; display:flex; align-items:baseline; gap:10px}
  .grp b{font-size:19px; font-weight:800; letter-spacing:-.02em}
  .grp span{font-size:13px; color:var(--faint); font-variant-numeric:tabular-nums}
  .grp.cool b{color:var(--cool)}
  .grp.home b{color:var(--home)}

  /* ── 카드 ─────────────────────────────── */
  .card{
    background:var(--card); border:1px solid var(--line); border-radius:16px;
    padding:18px; margin:0 0 18px; overflow:hidden;
  }
  .card.cool{border-top:4px solid var(--cool)}
  .card.home{border-top:4px solid var(--home)}

  .card-h{display:flex; gap:14px; align-items:flex-start}
  .thumb{width:78px; height:78px; object-fit:contain; flex:none; border-radius:12px; background:var(--paper)}
  .thumb.none{display:flex; align-items:center; justify-content:center; font-size:11px; color:var(--faint); text-align:center}
  .card-t{min-width:0; flex:1}
  .eyebrow{margin:0 0 2px; font-size:12px; font-weight:700; letter-spacing:.08em}
  .cool .eyebrow{color:var(--cool)}
  .home .eyebrow{color:var(--home)}
  .card-t h2{margin:0; font-size:24px; font-weight:800; letter-spacing:-.03em; line-height:1.25}
  ul.meta{display:flex; flex-wrap:wrap; gap:6px; list-style:none; margin:9px 0 0; padding:0}
  ul.meta li{
    font-size:12.5px; font-weight:600; color:var(--dim);
    background:var(--paper); border:1px solid var(--line); border-radius:999px; padding:2px 9px;
    font-variant-numeric:tabular-nums;
  }
  .cool ul.meta li.cat{color:var(--cool); background:var(--cool-bg); border-color:transparent}
  .home ul.meta li.cat{color:var(--home); background:var(--home-bg); border-color:transparent}

  .from{margin:15px 0 0; padding:12px 14px; background:var(--paper); border-radius:11px; font-size:13.5px}
  .from p{margin:0; padding:3px 0; color:var(--dim); display:flex; gap:10px; align-items:baseline}
  .from b{flex:none; width:60px; color:var(--faint); font-weight:700; font-size:11.5px; letter-spacing:-.02em}
  .who{font-weight:800; border-radius:999px; padding:1px 8px}
  .who.mine{color:var(--mine); background:var(--mine-bg)}
  .who.yours{color:var(--yours); background:var(--yours-bg)}
  .from p.fixed{margin-top:7px; padding-top:8px; border-top:1px dashed var(--line); color:var(--yours)}
  .from p.fixed b{color:var(--yours)}

  .card section{margin:20px 0 0}
  .card h3{
    margin:0 0 9px; font-size:12px; font-weight:800; letter-spacing:.12em; color:var(--faint);
    display:flex; align-items:baseline; gap:8px;
  }
  .card h3 .n{font-size:11px; font-weight:600; letter-spacing:0; font-variant-numeric:tabular-nums}

  ul.ig{list-style:none; margin:0; padding:0}
  ul.ig li{padding:5px 0 5px 14px; border-bottom:1px solid var(--line); position:relative; font-size:15px}
  ul.ig li:last-child{border-bottom:0}
  ul.ig li::before{content:""; position:absolute; left:2px; top:14px; width:4px; height:4px; border-radius:50%; background:var(--faint)}
  ul.ig li.ig-h{
    padding-left:0; margin-top:10px; font-size:12px; font-weight:800; letter-spacing:.1em;
    color:var(--faint); border-bottom:0;
  }
  ul.ig li.ig-h::before{display:none}
  ul.ig li:first-child.ig-h{margin-top:0}
  .sub{color:var(--faint); font-size:13.5px}

  ol.st{margin:0; padding:0; list-style:none; counter-reset:s}
  ol.st li{
    counter-increment:s; position:relative; padding:0 0 14px 34px; font-size:15px;
  }
  ol.st li:last-child{padding-bottom:0}
  ol.st li::before{
    content:counter(s); position:absolute; left:0; top:1px;
    width:23px; height:23px; border-radius:50%; display:flex; align-items:center; justify-content:center;
    font-size:12px; font-weight:800; font-variant-numeric:tabular-nums;
  }
  .cool ol.st li::before{background:var(--cool-bg); color:var(--cool)}
  .home ol.st li::before{background:var(--home-bg); color:var(--home)}

  .memo{font-size:14.5px; color:var(--dim)}

  /* ✍️ 판정 칸 — 창업자가 여기서 바로 체크·입력한다(공유 문서라 내가 읽는다) */
  .judge{
    margin:16px -18px -16px; padding:14px 18px 16px;
    border-top:1px solid var(--line); background:var(--paper);
    border-radius:0 0 15px 15px;
    display:flex; flex-wrap:wrap; gap:10px 14px; align-items:center;
  }
  .judge label{
    display:inline-flex; align-items:center; gap:7px; cursor:pointer;
    padding:8px 14px; border-radius:999px; border:1px solid var(--line);
    background:var(--card); font-size:14.5px; font-weight:700; color:var(--dim);
    user-select:none;
  }
  /* 손가락으로 누르는 판이라 체크박스를 키운다 */
  .judge input.ck{width:19px; height:19px; margin:0; accent-color:var(--brand)}
  .judge label.ok:has(.ck:checked){border-color:var(--yours); background:var(--yours-bg); color:var(--yours)}
  .judge label.bad:has(.ck:checked){border-color:var(--mine); background:var(--mine-bg); color:var(--mine)}
  .judge .note{
    flex:1 1 100%; min-width:0; padding:11px 14px; font:inherit; font-size:14.5px;
    color:var(--ink); background:var(--card);
    border:1px solid var(--line); border-radius:12px;
  }
  .judge .note::placeholder{color:var(--faint)}
  .judge .note:focus{outline:2px solid var(--brand); outline-offset:1px; border-color:transparent}
  /* ⛔⛔ [2026-08-18] artifact-sync 는 이 판에서 «안 돈다»(LIVE DOCS ONLY) — 저장은 localStorage 가 한다.
     그래서 이 「저장 안 됨」 경고를 «안 띄운다». 띄우면 멀쩡히 저장되는데도 창업자가 헛걱정한다. */
  /* 📋 결과 복사 막대 — 늘 화면 아래에 붙어 있다 */
  .bar{
    position:sticky; bottom:0; z-index:20; display:flex; gap:10px; align-items:center;
    margin:22px 0 0; padding:12px 14px; border:1px solid var(--line); border-radius:14px;
    background:var(--card); box-shadow:0 -6px 18px rgba(0,0,0,.06);
  }
  .bar button{
    font:inherit; font-weight:800; font-size:15px; padding:11px 16px; border-radius:11px;
    border:0; background:var(--brand); color:var(--paper); cursor:pointer;
  }
  .bar span{font-size:13px; color:var(--dim); font-weight:700}
  #fallback{margin:14px 0 0}
  #fallback p{font-size:14px; color:var(--mine); font-weight:700; margin:0 0 8px}
  #fallback textarea{
    width:100%; box-sizing:border-box; font:inherit; font-size:14px; line-height:1.6;
    padding:12px; border:1px solid var(--line); border-radius:12px;
    background:var(--paper); color:var(--ink);
  }
  .memo p{margin:0 0 8px}
  .memo p:last-child{margin:0}

  /* ── 꼬리 ─────────────────────────────── */
  .tail{margin:44px 0 0; padding:18px; border:1px solid var(--line); border-radius:14px; background:var(--card)}
  .tail h2{margin:0 0 8px; font-size:15px; font-weight:800}
  .tail p{margin:6px 0; font-size:14px; color:var(--dim)}
  .tail code{
    font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12.5px;
    background:var(--paper); border:1px solid var(--line); border-radius:5px; padding:1px 5px;
  }
  .sig{margin:28px 0 0; text-align:center; font-size:12px; color:var(--faint)}
</style>

<div class="wrap">
  <div class="hero">
    <p class="date">${이름.replace(/-/g, " · ")}</p>
    <h1>${날짜들.length === 1 ? '이날 열리는 레시피' : '앞으로 열리는 레시피'}</h1>
    <p class="lead">그날이 오면 <b>저절로</b> 열려. 내가 지어낸 값이 섞여 있어서 네가 봐야 앱에 남길 수 있어.<br><b>${총}편</b>이야.</p>
  </div>

  <div class="ask">
    <h2>이렇게만 봐 주면 돼</h2>
    <ol>
      <li>재료와 양이 <b>네가 아는 것과 다른가</b></li>
      <li>순서에 <b>빠지거나 이상한 걸음</b>이 있나</li>
      <li>시간·인분·난이도가 <b>말이 되나</b></li>
    </ol>
    <p class="no">고쳐 쓰지 말고 <b>요리 이름이랑 어디가 이상한지만</b> 짚어줘 — 고치는 건 내가 할게.</p>
    <p class="no"><b>편마다 아래에 체크칸이 있어.</b> 거기 체크하거나 한 줄 적으면 <b>내가 바로 봐</b> — 채팅에 다시 안 옮겨도 돼.</p>
  </div>

  ${몸통}

  <div class="tail">
    <h2>통과하면 이렇게 돼</h2>
    <p>다섯 편에 <code>review: '창업자'</code> 를 붙이고 바로 배포할게. 그 표시는 <b>네가 봤을 때만</b> 붙일 수 있어서 내 맘대로 못 달아.</p>
    <p>이상한 게 있으면 그 편만 고쳐서 다시 판을 뽑아 보여줄게.</p>
  </div>

  <p class="sig">이 판은 손으로 안 썼어 — <b>앱이 화면에 쓰는 바로 그 값</b>(<code>allBasicRecipes</code>)을 그대로 그렸어.<br>지난 판은 «원문»을 그려서 문체가 달라 보였던 거야 — 그건 내 잘못이고 이제 어긋날 수가 없어.</p>
</div>

<div class="bar" id="bar">
  <button id="copy" type="button">📋 결과 복사</button>
  <span id="cnt">아직 고른 게 없어</span>
</div>
<div id="fallback" hidden>
  <p>복사가 안 됐어 — <b>아래 글을 길게 눌러 전부 복사</b>해서 채팅에 붙여줘.</p>
  <textarea id="out" readonly rows="10"></textarea>
</div>

<script>
/* 💾💾 [2026-08-18] «저장»을 localStorage 로 바꿨다 — artifact-sync 는 이 판에서 «안 돈다».
   ⛔⛔ 창업자 = "이판은 저장이 안된다고 되어있어 아직도!! 제발 확인좀해"
   📌 원인 = 런타임 계약 문서에 **"LIVE DOCS ONLY — sync regions"** 라고 박혀 있다.
      artifact-sync 태그는 «라이브 문서»로 만든 아티팩트에서만 돌고, 보통 아티팩트에선
      region 이 artifact-sync-state="off" 로 꺼진다. 우리 판은 보통 아티팩트다.
      ⛔ 나는 태그가 있는 것만 보고 「이제 저장된다」고 말했다. 문서를 안 읽었다.
   ✅ localStorage 는 보통 아티팩트에서도 확실히 돈다 — 새로고침·다시 열기에도 남는다.
   ⛔ 다만 그건 «창업자 폰 안»에만 남는다 → 그래서 「결과 복사」 버튼이 «반드시» 같이 있어야 한다.
      ⚠️ clipboard.writeText() 는 «성공으로 resolve 되고도» 실제 복사가 실패한다(v10.97 사고).
         그래서 성공 여부와 무관하게 실패하면 글을 화면에 띄우는 폴백을 둔다. */
(function () {
  var KEY = 'hankki:검수판:' + (document.title || 'x')
  var boxes = [].slice.call(document.querySelectorAll('.judge input.ck'))
  var notes = [].slice.call(document.querySelectorAll('.judge input.note'))
  var cnt = document.getElementById('cnt')

  function 제목(el) {
    var art = el.closest('article')
    var h = art && art.querySelector('h2, .title, h3')
    return h ? h.textContent.trim() : '(제목 없음)'
  }
  function 세기() {
    var n = boxes.filter(function (b) { return b.checked }).length
      + notes.filter(function (t) { return t.value.trim() }).length
    cnt.textContent = n ? ('고른 것 ' + n + '개 — 저장됐어') : '아직 고른 게 없어'
  }
  function 저장() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        c: boxes.map(function (b) { return b.checked ? 1 : 0 }),
        n: notes.map(function (t) { return t.value })
      }))
    } catch (e) {}
    세기()
  }
  try {
    var s = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (s) {
      if (s.c) boxes.forEach(function (b, i) { b.checked = !!s.c[i] })
      if (s.n) notes.forEach(function (t, i) { t.value = s.n[i] || '' })
    }
  } catch (e) {}
  세기()
  boxes.forEach(function (b) { b.addEventListener('change', 저장) })
  notes.forEach(function (t) { t.addEventListener('input', 저장) })

  function 글만들기() {
    var 줄 = []
    document.querySelectorAll('article').forEach(function (art) {
      var t = art.querySelector('h2, .title, h3')
      var ck = art.querySelectorAll('.judge input.ck')
      var nt = art.querySelector('.judge input.note')
      var 괜 = ck[0] && ck[0].checked, 이상 = ck[1] && ck[1].checked
      var 메모 = nt ? nt.value.trim() : ''
      if (!괜 && !이상 && !메모) return
      줄.push('· ' + (t ? t.textContent.trim() : '?') + ' — '
        + (이상 ? '이상해' : (괜 ? '괜찮아' : '')) + (메모 ? ' : ' + 메모 : ''))
    })
    return 줄.length ? ('[검수 결과]\\n' + 줄.join('\\n')) : ''
  }
  document.getElementById('copy').addEventListener('click', function () {
    var 글 = 글만들기()
    if (!글) { cnt.textContent = '아직 고른 게 없어'; return }
    var fb = document.getElementById('fallback')
    var out = document.getElementById('out')
    /* ⛔ writeText 는 «성공했다고 해놓고» 실패한다 → 결과와 무관하게 글도 같이 띄운다 */
    out.value = 글
    fb.hidden = false
    out.focus(); out.select()
    /* ⛔ 거부되면 «약속이 깨진다» — 안 잡으면 pageerror 로 뜬다(헤드리스에서 실제로 그랬다) */
    try { if (navigator.clipboard) navigator.clipboard.writeText(글).catch(function () {}) } catch (e) {}
    try { document.execCommand('copy') } catch (e) {}
    cnt.textContent = '복사했어 — 안 됐으면 아래 글을 붙여줘'
  })
})()
</script>
`

const 파일 = `검수판-${날짜들[0]}${날짜들.length > 1 ? `-외${날짜들.length - 1}` : ''}.html`
writeFileSync(join(OUT, 파일), html)
console.log(`✅ 판 완성 — ${(html.length / 1024).toFixed(0)}KB`)
for (const m of 목록) {
  const r = 편들.get(m.id)
  console.log(`   · ${r.title.padEnd(14)} 재료 ${String(r.ingredients.length).padStart(2)}줄 · 순서 ${r.steps.length}걸음 · ${r.time}분 · 그림 ${r.icon}`)
}
