// 📺 영상에서 «보고» 우리 문장으로 적은 첫 세 편 — 창업자 검수판 (2026-09-03)
//
// ⛔ 손으로 안 쓴다. `recipe.mjs` 의 `레시피들()` 을 불러 «앱이 화면에 쓰는 바로 그 값»을 그린다.
//    (2026-08-17 사고 = basics.js 를 글자로 파싱해 원문을 보여줬고, 창업자가 «앱에 없는 문제»를 짚었다 · 규칙 30)
// ⛔ 결과 HTML 은 scratchpad 에만 만든다 — 저장소가 public 이라서.
// ☑️ 절대원칙(2026-08-19) = 검수판은 «무조건» 체크 ＋ 복사 ＋ 새로고침해도 남기 ＋ 복사 실패 폴백.
//
// 쓰기: node scripts/_판-영상레시피3-0903.mjs <낼 HTML 경로>
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { 레시피들 } from './recipe.mjs'

const APP = new URL('..', import.meta.url).pathname
const 낼곳 = process.argv[2]
if (!낼곳) { console.error('쓰기: node scripts/_판-영상레시피3-0903.mjs <낼 HTML>'); process.exit(1) }

const 편들 = new Map(레시피들().map((r) => [r.id, r]))

// ── 세 편 · 어디서 왔나 · 무엇을 봐줘야 하나 ────────────────────────────
const 목록 = [
  {
    id: 'basic-kkwari-myeolchi-bokkeum',
    창구: '유튜브',
    확정: [
      '창업자가 «원출처 채널에서 직접» 가져왔다 — 옮긴 계정을 안 거쳐서 출처가 한 겹이다',
      '2인분',
    ],
    볼것: [
      { 무엇: '제목 = 「꽈리고추 멸치볶음」', 왜: '⛔ 사람 이름을 제목에 «안» 넣었다 — 출처로 밝히는 건 되지만 이름으로 파는 건 다른 문제다(퍼블리시티권). 채널명은 출처 칸에 그대로 뜬다' },
      { 무엇: '시간 15분', 왜: '⏳ 원본에 시간이 «없다» — 내가 제안한 값이다' },
      { 무엇: '「물 100ml」를 양념 칸에 뒀다', 왜: '원본이 «볶음 양념»에 같이 적어놔서 그대로 뒀다. 재료 쪽으로 뺄까?' },
    ],
  },
  {
    id: 'basic-gyeran-hurai-jorim',
    창구: '유튜브',
    확정: [
      '식용유 2큰술 — 재료엔 없었는데 순서에 두 번 나와서 물었고, 창업자가 맞다고 했다',
      '밥은 맨 마지막에 얹어 먹는 것',
      '후추 = 약간',
      '시간 15분',
    ],
    볼것: [
      { 무엇: '그림', 왜: '⏳ 임시로 「계란장」을 붙였다 — 창업자가 새로 뽑아주면 갈아끼운다. 「계란후라이」 그림이 우리에게 없다' },
      { 무엇: '걸음 3 (양념장 미리)', 왜: '원본은 계란 굽는 «중간»에 양념장을 만든다. 팬 앞에서 손이 안 바쁘게 앞으로 뺐다' },
    ],
  },
  {
    id: 'basic-gwangeo-kkaennip-muchim',
    창구: '인스타',
    확정: ['2인분'],
    볼것: [
      { 무엇: '시간 15분', 왜: '⏳ 원본에 시간이 «없다» — 내가 제안한 값이다' },
      { 무엇: '광어회·묵은지·조미김 분량', 왜: '원본에 없어서 「(2인분)」·「적당량」으로 뒀다. ⛔지어내지 않았다' },
      { 무엇: '두 편으로 갈랐다', 왜: '원본은 한 게시물에 「광어깻잎무침 ＋ 소금김밥」이 같이 있다. 우리 앱은 한 편 = 한 요리라 나누고 메모로 이어놨다' },
    ],
  },
  {
    id: 'basic-sogeum-gimbap',
    창구: '인스타',
    확정: ['2인분'],
    볼것: [
      { 무엇: '시간 10분', 왜: '⏳ 원본에 시간이 «없다» — 내가 제안한 값이다' },
      { 무엇: '김밥김 분량', 왜: '원본에 없어서 「적당량」으로 뒀다' },
    ],
  },
]

// ── 그림을 판에 «박아» 넣는다 (밖에서 못 불러오니 통째로) ────────────────
const 그림 = (key) => {
  const p = join(APP, 'src/assets/stickers/photo', `${key}.png`)
  if (!existsSync(p)) return null
  const 작은 = `/tmp/_thumb-${key}.png`
  try {
    execFileSync('python3', ['-c', [
      'import sys',
      'from PIL import Image',
      'im = Image.open(sys.argv[1]).convert("RGBA")',
      'im.thumbnail((280, 280), Image.LANCZOS)',
      'im.save(sys.argv[2])',
    ].join('\n'), p, 작은])
    return `data:image/png;base64,${readFileSync(작은).toString('base64')}`
  } catch {
    return `data:image/png;base64,${readFileSync(p).toString('base64')}`
  }
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const 재료줄 = (t) => {
  const h = t.match(/^\[(.+)\]$/)
  if (h) return `<li class="ig-h">${esc(h[1])}</li>`
  return `<li>${esc(t).replace(/\(([^)]*)\)/g, '<span class="sub">($1)</span>')}</li>`
}

const 카드 = (m) => {
  const r = 편들.get(m.id)
  if (!r) throw new Error(`⛔ ${m.id} 를 basics.js 에서 못 찾았다 — 판이 앱과 어긋난다`)
  if (!r.sourceName) throw new Error(`⛔ ${r.title} 에 원작자(sourceName)가 없다 — 출처는 무조건 붙는다(창업자 확정)`)
  const img = 그림(r.icon)
  const k = r.title
  return `
<article class="card" id="${r.id}">
  <header class="hd">
    ${img ? `<img class="th" src="${img}" alt="">` : '<div class="th none">그림<br>없음</div>'}
    <div class="hdt">
      <p class="eb"><span class="tag ${m.창구 === '유튜브' ? 'yt' : 'ig'}">${m.창구}</span> ${esc(r.sourceName)}</p>
      <h2>${esc(r.title)}</h2>
      <ul class="meta">
        <li>${esc(r.time)}분</li><li>${esc(r.servings)}인분</li>
        <li>${esc(r.difficulty)}</li><li class="cat">${esc(r.folder || r.category)}</li>
      </ul>
    </div>
  </header>

  <p class="src">앱에서는 <b>${esc(r.sourceName)}</b> 를 눌러 원본으로 나가요<br><span class="url">${esc(r.sourceUrl)}</span></p>

  <div class="cols">
    <section>
      <h3>재료 <span class="n">${r.ingredients.filter((x) => !/^\[/.test(x)).length}줄</span></h3>
      <ul class="ig">${r.ingredients.map(재료줄).join('')}</ul>
    </section>
    <section>
      <h3>만드는 법 <span class="n">${r.steps.length}걸음</span></h3>
      <ol class="st">${r.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    </section>
  </div>

  ${r.memo ? `<section class="memo-box"><h3>메모</h3>${r.memo.split('\n').filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join('')}</section>` : ''}

  ${m.확정.length ? `<div class="ok-list"><h4>창업자가 이미 정해준 것</h4><ul>${m.확정.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}

  <div class="ask">
    <h4>봐줘야 하는 것 ${m.볼것.length}</h4>
    ${m.볼것.map((v) => `<p><b>${esc(v.무엇)}</b><span>${esc(v.왜)}</span></p>`).join('')}
  </div>

  <div class="pick" data-k="${esc(k)}">
    <label><input type="radio" name="p-${esc(k)}" value="좋다"><span>좋다</span></label>
    <label><input type="radio" name="p-${esc(k)}" value="고칠 것"><span>고칠 것</span></label>
    <label><input type="radio" name="p-${esc(k)}" value="나중에"><span>나중에</span></label>
  </div>
  <textarea class="memo" data-k="${esc(k)}" placeholder="고칠 것 · 열릴 날짜 · 하고 싶은 말 (여기 적으면 그대로 복사돼)"></textarea>
</article>`
}

const 카드들 = 목록.map(카드).join('\n')

const HTML = `<title>영상에서 온 네 편</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=Gowun+Batang:wght@700&display=swap">
<style>
:root{
  --paper:#F6F1E7; --card:#FFFDF9; --ink:#2C1B0D; --dim:#6E5B45; --faint:#9A8770;
  --line:#E4D8C4; --brand:#5D3410; --leaf:#4E6B3D; --plum:#8C3A52;
  --chip:#EFE6D6;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --paper:#191410; --card:#221B15; --ink:#F2E9DC; --dim:#BFAE97; --faint:#93826D;
    --line:#3A2E24; --brand:#E0BB8E; --leaf:#9CC182; --plum:#E39CB0; --chip:#2E251C;
  }
}
:root[data-theme="dark"]{
  --paper:#191410; --card:#221B15; --ink:#F2E9DC; --dim:#BFAE97; --faint:#93826D;
  --line:#3A2E24; --brand:#E0BB8E; --plum:#E39CB0; --leaf:#9CC182; --chip:#2E251C;
}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);
  font-family:'Gowun Dodum','Apple SD Gothic Neo','Noto Sans KR',system-ui,sans-serif;
  font-size:16px;line-height:1.65;padding:0 0 120px}
.wrap{max-width:760px;margin:0 auto;padding:0 16px}
header.top{padding:34px 0 18px}
header.top h1{font-family:'Gowun Batang','Apple SD Gothic Neo',serif;font-size:30px;line-height:1.3;
  margin:0 0 10px;color:var(--brand);text-wrap:balance}
header.top p{margin:0 0 8px;color:var(--dim);font-size:15.5px}
.how{background:var(--chip);border-left:3px solid var(--brand);border-radius:0 10px 10px 0;
  padding:13px 15px;margin:16px 0 8px;font-size:15px;color:var(--dim)}
.how b{color:var(--ink)}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;margin:22px 0}
.card.done{border-color:var(--leaf);box-shadow:inset 3px 0 0 var(--leaf)}
.hd{display:flex;gap:14px;align-items:flex-start}
.th{width:76px;height:76px;object-fit:contain;flex:0 0 auto;background:var(--chip);border-radius:11px}
.th.none{display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--faint);text-align:center}
.hdt{flex:1;min-width:0}
.eb{margin:2px 0 3px;font-size:13px;color:var(--dim);letter-spacing:.02em}
.tag{display:inline-block;padding:1px 7px;border-radius:5px;font-size:11.5px;font-weight:700;
  letter-spacing:.04em;vertical-align:1px;margin-right:5px}
.tag.yt{background:var(--plum);color:var(--card)}
.tag.ig{background:var(--leaf);color:var(--card)}
.hdt h2{font-family:'Gowun Batang',serif;font-size:23px;margin:0 0 6px;color:var(--ink)}
.meta{list-style:none;display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0}
.meta li{font-size:12.5px;color:var(--dim);background:var(--chip);padding:2px 8px;border-radius:20px;
  font-variant-numeric:tabular-nums}
.meta .cat{background:transparent;border:1px solid var(--line)}
.src{margin:14px 0 4px;padding:10px 12px;border:1px dashed var(--line);border-radius:10px;
  font-size:14px;color:var(--dim)}
.src b{color:var(--ink)}
.src .url{font-size:12px;color:var(--faint);word-break:break-all}
.cols{display:grid;grid-template-columns:1fr;gap:4px}
@media(min-width:620px){.cols{grid-template-columns:0.85fr 1.15fr;gap:24px}}
h3{font-size:14px;letter-spacing:.06em;color:var(--dim);margin:18px 0 7px;font-weight:700}
h3 .n{color:var(--faint);font-weight:400;margin-left:4px}
.ig,.st{margin:0;padding:0 0 0 1.1em;font-size:15.5px}
.ig{list-style:none;padding-left:0}
.ig li{padding:3px 0;border-bottom:1px solid var(--line)}
.ig li:last-child{border-bottom:0}
.ig .ig-h{font-size:12.5px;letter-spacing:.05em;color:var(--faint);border-bottom:0;padding-top:10px}
.ig .sub{color:var(--faint);font-size:13.5px}
.st li{padding:4px 0 4px 3px}
.memo-box{background:var(--chip);border-radius:10px;padding:2px 14px 12px;margin-top:16px}
.memo-box p{margin:6px 0;font-size:14.5px;color:var(--dim)}
.ok-list{margin-top:16px;font-size:14.5px}
.ok-list h4,.ask h4{font-size:13px;letter-spacing:.05em;margin:0 0 6px;color:var(--dim)}
.ok-list ul{margin:0;padding-left:1.15em;color:var(--dim)}
.ok-list li{padding:2px 0}
.ask{margin-top:16px;border-top:1px solid var(--line);padding-top:14px}
.ask p{margin:0 0 9px;font-size:14.5px}
.ask b{display:block;color:var(--ink)}
.ask span{color:var(--dim)}
.pick{display:flex;gap:8px;margin-top:14px}
.pick label{flex:1}
.pick input{position:absolute;opacity:0;pointer-events:none}
.pick span{display:block;text-align:center;padding:10px 4px;border:1px solid var(--line);
  border-radius:9px;font-size:14.5px;color:var(--dim);cursor:pointer}
.pick input:checked+span{background:var(--brand);border-color:var(--brand);color:var(--card);font-weight:700}
.pick input:focus-visible+span{outline:2px solid var(--plum);outline-offset:2px}
.memo{width:100%;margin-top:9px;min-height:52px;padding:10px 12px;border:1px solid var(--line);
  border-radius:9px;background:var(--paper);color:var(--ink);font:inherit;font-size:14.5px;resize:vertical}
.bar{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1px solid var(--line);
  padding:11px 16px calc(11px + env(safe-area-inset-bottom))}
.bar .in{max-width:760px;margin:0 auto;display:flex;align-items:center;gap:12px}
.count{flex:1;font-size:14.5px;color:var(--dim)}
.count b{color:var(--ink)}
#copy{padding:11px 20px;border:0;border-radius:9px;background:var(--brand);color:var(--card);
  font:inherit;font-size:15.5px;font-weight:700;cursor:pointer}
#out{position:fixed;left:-9999px;top:0;width:1px;height:1px;z-index:9;background:var(--card);
  color:var(--ink);border:1px solid var(--line);border-radius:9px;padding:10px;font:inherit;font-size:14px}
#fb{position:fixed;left:50%;bottom:78px;transform:translateX(-50%) translateY(8px);opacity:0;
  background:var(--ink);color:var(--paper);padding:9px 15px;border-radius:20px;font-size:14px;
  transition:.22s;pointer-events:none;z-index:10}
#fb.on{opacity:1;transform:translateX(-50%)}
@media (prefers-reduced-motion:reduce){#fb{transition:none}}
</style>

<div class="wrap">
<header class="top">
  <h1>영상에서 온 네 편</h1>
  <p>유튜브·인스타에서 <b>보고</b> 우리 문장으로 적은 첫 레시피들이야. 아직 <b>아무한테도 안 나갔어.</b></p>
  <div class="how">
    <b>보는 법</b> — 편마다 「좋다 / 고칠 것 / 나중에」를 누르고, 고칠 게 있으면 아래 칸에 적어줘.
    새로고침해도 안 날아가. 다 보면 맨 아래 <b>［결과 복사］</b> 눌러서 나한테 붙여넣어 줘.
  </div>
  <div class="how">
    <b>아직 안 정한 것</b> — ① <b>열릴 날짜</b>(셋 다 막아 뒀어 · 네가 정해줘) ② 계란후라이조림 <b>그림</b>(임시야)
    ③ <b>시간</b> — 인스타 두 편은 원본에 시간이 없어서 내가 낸 값이야.
  </div>
</header>

${카드들}
</div>

<div id="fb"></div>
<div class="bar"><div class="in">
  <div class="count" id="cnt"></div>
  <button id="copy" type="button">결과 복사</button>
</div></div>
<textarea id="out" readonly></textarea>

<script>
(function(){
  var KEY = 'hankki-영상레시피3-0903'
  var picks = [].slice.call(document.querySelectorAll('.pick input'))
  var memos = [].slice.call(document.querySelectorAll('.memo'))
  var cnt = document.getElementById('cnt')
  var fb = document.getElementById('fb')

  function 읽기(){ try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch(e){ return {} } }
  function 쓰기(o){ try { localStorage.setItem(KEY, JSON.stringify(o)) } catch(e){} }

  var 저장 = 읽기()
  picks.forEach(function(inp){
    var k = inp.closest('.pick').dataset.k
    if (저장['pick:'+k] === inp.value) inp.checked = true
    inp.addEventListener('change', function(){
      var o = 읽기(); o['pick:'+k] = inp.value; 쓰기(o); 칠하기(); 세기()
    })
  })
  memos.forEach(function(t){
    var k = t.dataset.k
    if (저장['memo:'+k]) t.value = 저장['memo:'+k]
    t.addEventListener('input', function(){
      var o = 읽기(); o['memo:'+k] = t.value; 쓰기(o); 세기()
    })
  })

  function 칠하기(){
    [].slice.call(document.querySelectorAll('.card')).forEach(function(c){
      var on = c.querySelector('.pick input:checked')
      c.classList.toggle('done', !!on && on.value === '좋다')
    })
  }
  function 세기(){
    var o = 읽기()
    var n = [].slice.call(document.querySelectorAll('.pick')).filter(function(p){ return o['pick:'+p.dataset.k] }).length
    var m = memos.filter(function(t){ return t.value.trim() }).length
    cnt.innerHTML = '고른 것 <b>' + n + '</b> / ' + memos.length + (m ? ' · 적은 것 <b>' + m + '</b>' : '')
  }
  칠하기(); 세기()

  function 말하기(s){ fb.textContent = s; fb.classList.add('on'); setTimeout(function(){ fb.classList.remove('on') }, 2400) }

  document.getElementById('copy').addEventListener('click', function(){
    var o = 읽기()
    var 줄 = ['[영상에서 온 네 편 — 검수 결과]', '']
    memos.forEach(function(t){
      var k = t.dataset.k
      var p = o['pick:'+k] || '아직'
      var mark = p === '좋다' ? '✅' : (p === '고칠 것' ? '✏️' : (p === '나중에' ? '⏸' : '⬜'))
      줄.push(mark + ' ' + k + ' — ' + p + (t.value.trim() ? '  → ' + t.value.trim() : ''))
    })
    줄.push('')
    줄.push('[아직 안 정한 것] 열릴 날짜 / 계란후라이조림 그림 / 인스타 두 편의 시간')
    var text = 줄.join('\\n')

    var out = document.getElementById('out')
    out.value = text
    function 폴백(){
      out.style.left = '14px'; out.style.top = '12%'; out.style.width = 'calc(100% - 28px)'; out.style.height = '46vh'
      out.select()
      try { document.execCommand('copy'); 말하기('복사했어 · 안 되면 화면의 글을 길게 눌러 복사해') }
      catch(e){ 말하기('길게 눌러서 복사해줘') }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function(){ 말하기('결과를 복사했어 · 클로드한테 붙여넣기') }, 폴백)
    } else 폴백()
  })
})()
</script>`

writeFileSync(낼곳, HTML)
console.log(`\n✅ 검수판 ${목록.length}편 → ${낼곳}`)
for (const m of 목록) console.log(`   · ${편들.get(m.id).title}  (${m.창구} · ${편들.get(m.id).sourceName})`)
