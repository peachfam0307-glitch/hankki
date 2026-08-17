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

// ── 다섯 편 · 어디서 왔나 (git 으로 확인한 값 · 짐작 아님) ──────────
const 목록 = [
  { id: 'basic-seulleoshi', 줄: '여름',
    출처: '2026-08-02 「8월 주간 레시피 12편」 묶음',
    누가: '내가 씀', 볼것: '재료·양·순서 전부',
    고침: '만드는 법을 해요체로 (앱 화면은 원래 해요체였어 — 내 판이 원문을 보여줘서 이상해 보였던 거야)' },
  { id: 'basic-avocado-banana-smoothie', 줄: '여름',
    출처: '2026-07-14 「인기 메뉴 큐레이션 11종」 묶음 — 제일 오래된 것',
    누가: '내가 씀', 볼것: '재료·양·순서 전부',
    고침: '코코넛 워터를 메인으로 (없으면 우유·플레인 요거트) ＋ 해요체' },
  { id: 'basic-siwon-mukchae', 줄: '여름',
    출처: '파운더 시그니처 — 네가 준 레시피',
    누가: '네 것', 볼것: '옮기며 틀린 데가 없나',
    고침: '1번에서 「찬물에」 뺐어 ＋ 해요체' },
  { id: 'basic-deulgireum-makguksu', 줄: '우리집',
    출처: '2026-08-12 「우리집레시피 34편」 — 네 확정본을 그대로',
    누가: '네 것 ＋ 시간·인분·난이도는 내가 씀', 볼것: '시간 20분 · 1인분 · 쉬움',
    고침: '차돌박이 「없어도 괜찮아요」 ＋ 1번에서 지퍼백 빼고 「물기를 꼭 짜서」로' },
  { id: 'basic-broccoli-gui', 줄: '우리집',
    출처: '2026-08-12 「우리집레시피 34편」 — 네 확정본을 그대로',
    누가: '네 것 ＋ 시간·인분·난이도는 내가 씀', 볼것: '시간 20분 · 2인분 · 쉬움',
    고침: '옛 2번(줄기 필러) 뺐고 · 3번에 「너무 두껍지 않게」 · 6번 볶아요→구워요 · 7번 「치즈 올려 뚜껑 닫아」 ＋ 메모 중복 줄 뺌' },
]

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
      'im.thumbnail((320, 320), Image.LANCZOS)',
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
  const 색 = meta.줄 === '여름' ? 'cool' : 'home'
  const img = 그림(r.icon)
  return `
<article class="card ${색}" id="r${i + 1}">
  <header class="card-h">
    ${img ? `<img class="thumb" src="${img}" alt="">` : '<div class="thumb none">그림 없음</div>'}
    <div class="card-t">
      <p class="eyebrow">${meta.줄 === '여름' ? '여름 시원한 것' : '우리집레시피'}</p>
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
    <p><b>어디서 왔나</b> ${esc(meta.출처)}</p>
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
</article>`
}

const 그린것 = 목록.map((m, i) => {
  const r = 편들.get(m.id)
  if (!r) throw new Error(`⛔ ${m.id} 를 basics.js 에서 못 찾았다 — 판이 앱과 어긋난다`)
  if (r.from !== '2026-08-17') throw new Error(`⛔ ${r.title} 의 from 이 ${r.from} 이다 — 다섯 편이 아니다`)
  return { 줄: m.줄, html: 카드(r, m, i) }
})
const 여름 = 그린것.filter((x) => x.줄 === '여름').map((x) => x.html).join('\n')
const 우리집 = 그린것.filter((x) => x.줄 === '우리집').map((x) => x.html).join('\n')

const html = `<title>오늘 열린 다섯 편</title>
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
    <p class="date">2026 · 08 · 17</p>
    <h1>오늘 열린 다섯 편</h1>
    <p class="lead">날짜가 차서 <b>저절로</b> 열린 레시피야. 내가 지어낸 값이 섞여 있어서 네가 봐야 앱에 남길 수 있어.</p>
  </div>

  <div class="ask">
    <h2>이렇게만 봐 주면 돼</h2>
    <ol>
      <li>재료와 양이 <b>네가 아는 것과 다른가</b></li>
      <li>순서에 <b>빠지거나 이상한 걸음</b>이 있나</li>
      <li>시간·인분·난이도가 <b>말이 되나</b></li>
    </ol>
    <p class="no">고쳐 쓰지 말고 <b>요리 이름이랑 어디가 이상한지만</b> 짚어줘 — 고치는 건 내가 할게.</p>
  </div>

  <div class="grp cool"><b>여름 시원한 것</b><span>3편</span></div>
  ${여름}

  <div class="grp home"><b>우리집레시피</b><span>2편 · 네 레시피</span></div>
  ${우리집}

  <div class="tail">
    <h2>통과하면 이렇게 돼</h2>
    <p>다섯 편에 <code>review: '창업자'</code> 를 붙이고 바로 배포할게. 그 표시는 <b>네가 봤을 때만</b> 붙일 수 있어서 내 맘대로 못 달아.</p>
    <p>이상한 게 있으면 그 편만 고쳐서 다시 판을 뽑아 보여줄게.</p>
  </div>

  <p class="sig">이 판은 손으로 안 썼어 — <b>앱이 화면에 쓰는 바로 그 값</b>(<code>allBasicRecipes</code>)을 그대로 그렸어.<br>지난 판은 «원문»을 그려서 문체가 달라 보였던 거야 — 그건 내 잘못이고 이제 어긋날 수가 없어.</p>
</div>
`

writeFileSync(join(OUT, '검수5편-0817.html'), html)
console.log(`✅ 판 완성 — ${(html.length / 1024).toFixed(0)}KB`)
for (const m of 목록) {
  const r = 편들.get(m.id)
  console.log(`   · ${r.title.padEnd(14)} 재료 ${String(r.ingredients.length).padStart(2)}줄 · 순서 ${r.steps.length}걸음 · ${r.time}분 · 그림 ${r.icon}`)
}
