// 🖼 SNS 새 레시피 «아이콘» 판정판 (2026-09-25) — 창업자 「이제 아이콘 바꿀 것 볼게」
// ⭐ 앱과 같은 값: recipe.mjs 의 레시피들()에서 icon 을 읽고, 그림은 src/assets/stickers/photo/<icon>.png 그대로.
// ⭐ 검수판 절대원칙(2026-08-19) = 칸마다 고르기(localStorage) ＋ 맨 아래 복사하기(실패하면 글자 골라주기).
// 쓰기: OUT=<scratchpad> node scripts/_판-아이콘검수-0925.mjs "편1,편2,…"
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { 레시피들 } from './recipe.mjs'

const APP = new URL('..', import.meta.url).pathname
const OUT = process.env.OUT || process.env.CLAUDE_SCRATCHPAD_DIR || '/tmp/claude-0'
const 이름들 = (process.argv[2] || '').split(',').map((x) => x.trim()).filter(Boolean)
if (!이름들.length) { console.error('⛔ 편 이름을 달라'); process.exit(1) }
const 전부 = 레시피들()
const 줄 = 이름들.map((t) => {
  const r = 전부.find((x) => x.title === t)
  if (!r) { console.error('⛔ 못 찾음', t); process.exit(1) }
  const 파일 = join(APP, 'src/assets/stickers/photo', `${r.icon}.png`)
  const 그림 = existsSync(파일) ? `data:image/png;base64,${readFileSync(파일).toString('base64')}` : ''
  const 같이 = 전부.filter((x) => x.icon === r.icon && x.title !== t).map((x) => x.title)
  return { t, from: r.from, icon: r.icon, 그림, 같이 }
})
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const html = `<title>SNS 아이콘 판정</title>
<style>
:root{--bg:#f6f1ea;--card:#fffdf9;--ink:#3a2a1c;--sub:#8a7663;--line:#e6dccf;--acc:#b0642c;--ok:#3f7d4e;--new:#b0642c;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#1d1814;--card:#28211b;--ink:#f1e6d8;--sub:#b3a18c;--line:#3b3129;--acc:#e0935a;--ok:#7cc08c;--new:#e0935a;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#1d1814;--card:#28211b;--ink:#f1e6d8;--sub:#b3a18c;--line:#3b3129;--acc:#e0935a;--ok:#7cc08c;--new:#e0935a;color-scheme:dark}
body{background:var(--bg);color:var(--ink);font-family:"Pretendard","Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif;padding-inline:16px;padding-block:20px 40px}
main{max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:12px}
h1{font-size:20px;margin:0}
p.lead{color:var(--sub);margin:0 0 4px;line-height:1.5}
.row{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;display:grid;grid-template-columns:84px 1fr;gap:12px;align-items:center}
.row img{width:84px;height:84px;object-fit:contain}
.t{font-weight:800;font-size:16px}
.m{color:var(--sub);font-size:13px;margin-top:2px;line-height:1.45}
.btns{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
button{font:inherit;font-size:14px;border:1.5px solid var(--line);background:transparent;color:var(--ink);border-radius:999px;padding:6px 12px;cursor:pointer}
button:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
button[aria-pressed="true"].keep{background:var(--ok);border-color:var(--ok);color:#fff}
button[aria-pressed="true"].new{background:var(--new);border-color:var(--new);color:#fff}
.copy{background:var(--acc);border-color:var(--acc);color:#fff;font-weight:800;padding:10px 16px}
#out{white-space:pre-wrap;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px;font-size:14px}
</style>
<main>
<h1>SNS 새 레시피 아이콘</h1>
<p class="lead">지금 붙어 있는 그림은 비슷한 기존 그림을 빌린 거예요. 그대로 쓸지, 새 컷을 뽑을지 골라 주세요. 「같이 씀」은 같은 그림을 쓰는 다른 레시피예요.</p>
${줄.map((r, i) => `<div class="row" data-i="${i}">
<img src="${r.그림}" alt="${esc(r.t)} 지금 아이콘">
<div><div class="t">${esc(r.t)}</div>
<div class="m">${esc(r.from)} 열림 · ${esc(r.icon)}${r.같이.length ? ` · 같이 씀: ${esc(r.같이.join(', '))}` : ''}</div>
<div class="btns"><button class="keep" id="k${i}" aria-pressed="false">그대로</button><button class="new" id="n${i}" aria-pressed="false">새 컷</button></div></div></div>`).join('\n')}
<button class="copy" id="copy">복사하기</button>
<div id="out" hidden></div>
</main>
<script>
const 줄=${JSON.stringify(줄.map((r) => r.t))};const KEY='hankki:아이콘판정:0925';
let 고름={};try{고름=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
function 그리기(){줄.forEach((t,i)=>{document.getElementById('k'+i).setAttribute('aria-pressed',고름[t]==='그대로');document.getElementById('n'+i).setAttribute('aria-pressed',고름[t]==='새 컷')})}
줄.forEach((t,i)=>{for(const [id,v] of [['k'+i,'그대로'],['n'+i,'새 컷']])document.getElementById(id).onclick=()=>{고름[t]=고름[t]===v?undefined:v;try{localStorage.setItem(KEY,JSON.stringify(고름))}catch(e){}그리기()}})
그리기()
document.getElementById('copy').onclick=async()=>{const 글='[아이콘 판정]\\n'+줄.map(t=>'· '+t+' — '+(고름[t]||'안 고름')).join('\\n');const o=document.getElementById('out');o.textContent=글;o.hidden=false;try{await navigator.clipboard.writeText(글)}catch(e){}const r=document.createRange();r.selectNodeContents(o);const s=getSelection();s.removeAllRanges();s.addRange(r)}
</script>`
const 파일 = join(OUT, 'SNS아이콘판정.html')
writeFileSync(파일, html)
console.log('✅', 파일, Math.round(html.length / 1024) + 'KB')
