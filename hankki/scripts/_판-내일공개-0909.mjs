// 🚨📅 **내일(2026-09-09) «저절로» 열리는 두 편 검수판** — 절대원칙 28
//
// 📮 창업자 = *"자동으로 올라가기 전날에 꼭 검수하고 내보내자. **이건 절대원칙.**"* (2026-08-01)
//    ＋ 2026-09-08 = *"내일 나갈것만 검수할게"*
//
// 🔢 오늘 옮긴 달력(BASICS_VERSION 115)으로 9/09 에 열리는 것은 **두 편**이다.
//    ⛔ 손으로 안 적는다 — `recipe.mjs` 에서 `from === '2026-09-09'` 인 것을 «앱과 같은 모듈»로 읽는다.
//    ⛔⛔ [2026-08-17 사고] basics.js 를 «글자로 파싱»했다가 politeSteps() 를 안 거친 원문이 나왔고
//       창업자가 **앱에 없는 문체 문제**를 세 편이나 짚느라 시간을 썼다. 여기서 다시 파싱하지 말 것.
//
// ☑️ 검수판 절대원칙(2026-08-18 창업자 *"무조건 복사되는 걸로 올려"*)
//    · localStorage 로 남긴다 (새로고침해도 안 날아간다)
//    · 「결과 복사」가 있다
//    · 복사 실패 폴백 — clipboard 는 «성공으로 resolve 되고도» 실패한다(v10.97 사고) → 글을 화면에도 띄운다
//
// 쓰는 법: node scripts/_판-내일공개-0909.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { 레시피들 } from './recipe.mjs'

const APP = new URL('..', import.meta.url).pathname
const OUT = '/tmp/claude-0/-home-user-hankki/a2a1e2e3-d972-556f-b791-6ad309c4df0c/scratchpad'
const 그날 = '2026-09-09'

const 편들 = 레시피들().filter((r) => r.from === 그날)
if (편들.length !== 2) throw new Error(`⛔ ${그날} 에 열리는 것이 ${편들.length}편이다 — 두 편이어야 한다(달력이 또 어긋났다)`)

// 그림을 판에 «박아» 넣는다 — 폰에서 여는 판이라 밖에서 못 불러온다
const 그림 = (key) => {
  const p = join(APP, 'src/assets/stickers/photo', `${key}.png`)
  if (!existsSync(p)) return null
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
const 재료줄 = (t) => {
  const h = t.match(/^\[(.+)\]$/)
  if (h) return `<li class="ig-h">${esc(h[1])}</li>`
  return `<li>${esc(t).replace(/\(([^)]*)\)/g, '<span class="sub">($1)</span>')}</li>`
}

// ⛔ 「봐줄 것」은 «내가 쓴 값»을 콕 집는다 — 네 것과 내 것을 갈라야 검수가 빨라진다
// ⛔⛔ [2026-09-08 창업자] *"유튜브 어딘지 안적혀있어. 찾아서 명시해."*
//    → 코드엔 `sourceName` 이 «있었다»(정호영의 오늘도 요리 Kitchen Caden). **판이 그걸 안 실었다.**
//    ⭐ 그래서 출처를 손으로 안 적는다 — `r.sourceName` 을 그대로 읽는다(손으로 적으면 반드시 낡는다).
//    ✅ 앱 화면은 원래 맞았다 — RecipeDetailScreen.jsx:848 이 「<채널> · 영상으로 보기」로 그린다.
const 메모 = {
  'basic-aehobak-gukbap': {
    누가: '영상에서 보고 우리 문장으로 (시간·인분·난이도는 내가 씀)',
    볼것: '30분 · 3인분 · 보통 — 그리고 「다시다 → 연두·백간장」 대체 문구',
  },
  'basic-eonam-dubu-jorim': {
    누가: '영상 설명란에 순서까지 있어 그대로 (시간·인분·난이도는 내가 씀)',
    볼것: '25분 · 3인분 · 쉬움 — 그리고 「후추 20바퀴」·「식용유 2바퀴」 같은 영상 말투를 남길지',
  },
}

const 카드 = (r, i) => {
  const m = 메모[r.id] || { 출처: '(모름)', 누가: '(모름)', 볼것: '전부' }
  const img = 그림(r.icon)
  return `
<article class="card" data-i="${i}">
  <header class="card-h">
    ${img ? `<img class="thumb" src="${img}" alt="">` : '<div class="thumb none">그림 없음</div>'}
    <div class="card-t">
      <p class="eyebrow">${esc(r.folder || r.category)} · 내일 자동 공개</p>
      <h2>${esc(r.title)}</h2>
      <ul class="meta"><li>${esc(r.time)}분</li><li>${esc(r.servings)}인분</li><li>${esc(r.difficulty)}</li></ul>
    </div>
  </header>
  <div class="from">
    <p><b>어디서 왔나</b> 📺 <b class="src">${esc(r.sourceName || '⛔ 채널 이름이 코드에 없다')}</b></p>
    <p class="url">${esc(r.sourceUrl || '⛔ 주소 없음')}</p>
    <p><b>누가 쓴 값</b> ${esc(m.누가)}</p>
    <p><b>봐줄 것</b> ${esc(m.볼것)}</p>
    ${r.sourceUrl ? `<p><a href="${esc(r.sourceUrl)}" target="_blank" rel="noopener">▶ 원본 영상 열기</a></p>` : ''}
  </div>
  <section>
    <h3>재료 <span class="n">${r.ingredients.filter((x) => !/^\[/.test(x)).length}줄</span></h3>
    <ul class="ig">${r.ingredients.map(재료줄).join('')}</ul>
    ${판정('ing', i)}
  </section>
  <section>
    <h3>만드는 법 <span class="n">${r.steps.length}걸음</span></h3>
    <ol class="st">${r.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    ${판정('step', i)}
  </section>
  ${r.memo ? `<section><h3>메모</h3><div class="memo">${r.memo.split('\n').filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join('')}</div>${판정('memo', i)}</section>` : ''}
  <section class="verdict">
    <h3>이 편, 내일 내보낼까?</h3>
    ${판정('all', i, ['내보내자', '고칠 데 있어'])}
    <textarea data-note="${i}" placeholder="고칠 데를 적어줘 (없으면 비워둬)"></textarea>
  </section>
</article>`
}
function 판정(key, i, 라벨 = ['좋아', '이상해']) {
  return `<div class="jd" data-k="${key}${i}">
    <label><input type="radio" name="${key}${i}" value="y"><span>✅ ${라벨[0]}</span></label>
    <label><input type="radio" name="${key}${i}" value="n"><span>⛔ ${라벨[1]}</span></label>
  </div>`
}

const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>내일 열리는 두 편</title>
<style>
 :root{--paper:#FAF6EF;--card:#fff;--ink:#2E1C0C;--dim:#7A6852;--faint:#9C8B76;--line:#E7DCCB;--brand:#5D3410;--ok:#2F6B3C;--ok-bg:#E8F2E9;--no:#B4472F;--no-bg:#FBEAE5}
 @media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--paper:#191410;--card:#221B15;--ink:#F2E9DC;--dim:#B6A692;--faint:#8D7E6C;--line:#3A2F26;--brand:#E8C9A4;--ok:#93CFA0;--ok-bg:#1C2E20;--no:#F09A82;--no-bg:#3A211B}}
 :root[data-theme="dark"]{--paper:#191410;--card:#221B15;--ink:#F2E9DC;--dim:#B6A692;--faint:#8D7E6C;--line:#3A2F26;--brand:#E8C9A4;--ok:#93CFA0;--ok-bg:#1C2E20;--no:#F09A82;--no-bg:#3A211B}
 *{box-sizing:border-box}
 body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.72 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif;letter-spacing:-.01em}
 .wrap{max-width:640px;margin:0 auto;padding:26px 16px 120px}
 .date{font-size:13px;font-weight:700;letter-spacing:.14em;color:var(--faint);margin:0 0 8px}
 h1{margin:0;font-size:clamp(27px,7.6vw,38px);line-height:1.2;font-weight:800;letter-spacing:-.035em}
 .lead{margin:12px 0 0;color:var(--dim);font-size:15px}
 .ask{margin:20px 0 0;padding:15px 17px;background:var(--card);border:1px solid var(--line);border-radius:14px;font-size:14.5px}
 .ask .h{display:block;margin-bottom:6px;font-weight:800}
 .card{background:var(--card);border:1px solid var(--line);border-top:4px solid var(--brand);border-radius:16px;padding:18px;margin:26px 0 0}
 .card-h{display:flex;gap:14px;align-items:flex-start}
 .thumb{width:78px;height:78px;object-fit:contain;flex:none;border-radius:12px;background:var(--paper)}
 .thumb.none{display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--faint)}
 .card-t{min-width:0;flex:1}
 .eyebrow{margin:0 0 2px;font-size:12px;font-weight:700;letter-spacing:.06em;color:var(--brand)}
 h2{margin:0;font-size:23px;font-weight:800;letter-spacing:-.03em}
 .meta{list-style:none;display:flex;gap:8px;margin:7px 0 0;padding:0;font-size:13px;color:var(--dim)}
 .meta li{background:var(--paper);border:1px solid var(--line);border-radius:99px;padding:1px 9px}
 .from{margin:15px 0 0;padding:12px 14px;background:var(--paper);border-radius:12px;font-size:14px}
 .from p{margin:3px 0}
 .from b{color:var(--brand);margin-right:6px}
 .from a{color:var(--brand)}
 .from .src{color:var(--ink);font-weight:800}
 .from .url{font:12.5px/1.5 ui-monospace,monospace;color:var(--faint);word-break:break-all;margin:1px 0 6px}
 h3{margin:22px 0 8px;font-size:15px;font-weight:800}
 h3 .n{font-weight:400;color:var(--faint);font-size:13px;margin-left:5px}
 .ig,.st{margin:0;padding-left:20px}
 .ig{list-style:none;padding-left:0}
 .ig li{padding:3px 0;border-bottom:1px dashed var(--line)}
 .ig .ig-h{font-weight:800;color:var(--brand);border:0;padding-top:12px}
 .ig .sub{color:var(--faint);font-size:14px}
 .st li{padding:5px 0}
 .memo p{margin:0 0 9px;color:var(--dim);font-size:15px}
 .jd{display:flex;gap:9px;margin:11px 0 0}
 .jd label{flex:1}
 .jd input{position:absolute;opacity:0;pointer-events:none}
 .jd span{display:block;text-align:center;padding:10px 0;border:1.5px solid var(--line);border-radius:11px;font-size:14.5px;font-weight:700;background:var(--card)}
 .jd input:checked+span{border-color:var(--ok);background:var(--ok-bg);color:var(--ok)}
 .jd input[value="n"]:checked+span{border-color:var(--no);background:var(--no-bg);color:var(--no)}
 .verdict{margin-top:24px;padding-top:18px;border-top:2px solid var(--line)}
 textarea{width:100%;margin-top:10px;padding:11px;border:1px solid var(--line);border-radius:11px;background:var(--paper);color:var(--ink);font:inherit;font-size:15px;min-height:62px;resize:vertical}
 .bar{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1px solid var(--line);padding:11px 14px;display:flex;gap:10px;align-items:center}
 .bar b{flex:1;font-size:14px;font-variant-numeric:tabular-nums}
 .bar button{background:var(--brand);color:var(--paper);border:0;padding:12px 20px;border-radius:11px;font-size:15px;font-weight:800}
 #out{white-space:pre-wrap;font:12.5px/1.6 ui-monospace,monospace;background:var(--card);border:1px solid var(--line);border-radius:11px;padding:13px;margin-top:16px;display:none}
</style>
<div class="wrap">
 <p class="date">2026-09-08 · 내일 검수</p>
 <h1>내일 저절로 열리는 두 편</h1>
 <p class="lead">9월 9일 수요일에 <b>아무도 안 눌러도</b> 유저 앞에 나가. 오늘 안 보면 그대로 나가.</p>
 <div class="ask"><span class="h">봐줄 것</span>
  ① 재료 양이 이상하지 않나 ② 순서가 실제로 되는 순서인가 ③ 시간·인분·난이도 (이건 <b>내가 쓴 값</b>이라 제일 틀리기 쉬워) ④ 문체가 앱의 다른 편과 같나
 </div>
 ${편들.map(카드).join('\n')}
</div>
<div id="out"></div>
<div class="bar"><b id="cnt">0 / ${편들.length * 4}</b><button id="cp">결과 복사</button></div>
<script>
var KEY='hankki:내일공개:0909'
var S={}; try{S=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
var TIT=${JSON.stringify(편들.map((r) => r.title))}
function restore(){
  document.querySelectorAll('.jd input').forEach(function(el){ if(S[el.name]===el.value)el.checked=true })
  document.querySelectorAll('textarea').forEach(function(t){ if(S['note'+t.dataset.note])t.value=S['note'+t.dataset.note] })
  cnt()
}
function cnt(){
  var n=Object.keys(S).filter(function(k){return k.indexOf('note')!==0}).length
  document.getElementById('cnt').textContent=n+' / '+${편들.length * 4}
}
document.addEventListener('change',function(e){
  if(e.target.matches('.jd input')){S[e.target.name]=e.target.value;save()}
})
document.addEventListener('input',function(e){
  if(e.target.matches('textarea')){S['note'+e.target.dataset.note]=e.target.value;save()}
})
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){} cnt()}
document.getElementById('cp').onclick=function(){
  var L=['내일(9/9) 공개 검수']
  TIT.forEach(function(t,i){
    var v=function(k){return S[k+i]==='y'?'✅':S[k+i]==='n'?'⛔':'—'}
    L.push('')
    L.push('■ '+t+'  → '+(S['all'+i]==='y'?'✅ 내보내자':S['all'+i]==='n'?'⛔ 고칠 데 있어':'— 아직'))
    L.push('  재료 '+v('ing')+' · 만드는 법 '+v('step')+' · 메모 '+v('memo'))
    if(S['note'+i])L.push('  ✍ '+S['note'+i])
  })
  var t=L.join('\\n')
  var o=document.getElementById('out'); o.style.display='block'; o.textContent=t
  try{navigator.clipboard&&navigator.clipboard.writeText(t)}catch(e){}
  var r=document.createRange(); r.selectNodeContents(o)
  var s=getSelection(); s.removeAllRanges(); s.addRange(r)
  o.scrollIntoView({behavior:'smooth',block:'center'})
}
restore()
</script>`

const 낼곳 = join(OUT, '내일공개-0909.html')
writeFileSync(낼곳, html)
console.log(`${그날} 에 열리는 ${편들.length}편 — ${편들.map((r) => r.title).join(' · ')}`)
console.log(낼곳)
