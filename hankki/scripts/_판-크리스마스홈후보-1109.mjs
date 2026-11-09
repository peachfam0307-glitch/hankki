// 🎄🍪 크리스마스 홈 「진저브레드 마을」 후보 판 — 창업자 2026-11-09 「1번 진저브레드 마을로 후보판 만들어줘」
// 재료 = 무료 캐릭터 67컷(docs/stickers/겨울크리스마스-캐릭터-2026-08-04/낱개 · 유료팩 접두어 아님)
// 묶음은 클로드가 «훑어보고» 나눈 것(판정 아님) · 창업자가 칸마다 좋다/버린다/모르겠다 → 맨 아래 복사
// 판(HTML)은 scratchpad 에만(저장소 public) · 실행: OUT=<폴더> node scripts/_판-크리스마스홈후보-1109.mjs
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
const ROOT = new URL('..', import.meta.url).pathname
const D = join(ROOT, 'docs/stickers/겨울크리스마스-캐릭터-2026-08-04/낱개')
const OUT = process.env.OUT || process.env.CLAUDE_SCRATCHPAD_DIR || '/tmp/claude-0'
const 묶음 = [
  ['🍪 진저브레드·쿠키 (테마 본체)', ['xc02_02', 'xn05_01', 'xn012_02', 'xc01_01', 'xc02_04', 'xc03_02', 'xc04_04', 'xw01_01', 'xw03_01']],
  ['🎄 트리 꾸미기', ['xc01_02', 'xc02_05', 'xc03_01', 'xc04_03', 'xn09_01', 'xn012_04']],
  ['🎅 예쁜 옷 (산타·루돌프)', ['xc02_01', 'xn05_02', 'xn09_03', 'xc02_03', 'xn05_05', 'xn012_03']],
  ['🎁 선물·파티', ['xc03_04', 'xc03_05', 'xc04_01', 'xc04_02', 'xn07_02', 'xn07_03', 'xn07_04', 'xn09_02', 'xn012_01']],
  ['🎀 소품 (리스·랜턴·종)', ['xc01_03', 'xc03_03', 'xn05_04', 'xn05_03', 'xn09_04']],
]
const 쓴 = new Set(묶음.flatMap(([, k]) => k))
const 전부 = readdirSync(D).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
묶음.push(['❄️ 그 밖 (눈·썰매·겨울 음식 등)', 전부.filter((k) => !쓴.has(k))])
// 폰에서 열 판이라 줄여 싣는다(원본 그대로면 39MB) — 판정은 크게 붙인 뒤에 다시 한다
import { execFileSync } from 'node:child_process'
const 그림 = (k) => `data:image/webp;base64,${execFileSync('ffmpeg', ['-loglevel', 'error', '-i', join(D, `${k}.png`), '-vf', 'scale=360:-1', '-c:v', 'libwebp', '-quality', '82', '-f', 'webp', 'pipe:1'], { maxBuffer: 2e7 }).toString('base64')}`
const 칸 = (k) => `<div class="칸" data-k="${k}"><img src="${그림(k)}"><b>${k}</b><div class="고름">${['좋다', '버린다', '모르겠다'].map((v) => `<button data-v="${v}">${v}</button>`).join('')}</div></div>`
const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>크리스마스 홈 후보</title>
<style>body{margin:0;padding:16px 16px 120px;background:#FBF4E6;font-family:system-ui,sans-serif;color:#3F1D12}h1{font-size:22px}h2{font-size:18px;margin:28px 0 8px}p{font-size:14px;line-height:1.5}
.판{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}.칸{background:#fff;border-radius:14px;padding:8px;text-align:center;border:3px solid transparent}
.칸 img{width:100%;aspect-ratio:1;object-fit:contain}.칸 b{font-size:12px;opacity:.6}.고름{display:flex;gap:4px;margin-top:6px}.고름 button{flex:1;font-size:12px;padding:6px 0;border-radius:8px;border:1px solid #ccc;background:#fafafa}
.칸[data-v="좋다"]{border-color:#3a9b4c}.칸[data-v="버린다"]{border-color:#c33;opacity:.5}.칸[data-v="모르겠다"]{border-color:#e0a800}button.on{background:#3F1D12;color:#fff}
.바닥{position:fixed;left:0;right:0;bottom:0;background:#fff;padding:12px 16px;box-shadow:0 -2px 10px rgba(0,0,0,.1);display:flex;gap:10px;align-items:center}.바닥 button{background:#7F0303;color:#fff;border:0;border-radius:10px;padding:12px 18px;font-size:16px}#남은{font-size:13px}
pre{white-space:pre-wrap;background:#fff;padding:10px;border-radius:10px;font-size:13px}</style>
<h1>🍪 진저브레드 마을 — 크리스마스 홈 후보</h1>
<p>무료 캐릭터 67컷 전부야(유료팩 컷 없음). 묶음은 내가 훑어보고 나눈 거라 틀릴 수 있어. 홈에 «넣고 싶은 것»에 좋다를 눌러줘.<br>⚠️ 눈 오는 바탕 그림·과자집은 아직 «없어» — 이 판엔 안 들어 있어.</p>
${묶음.map(([t, ks]) => `<h2>${t} · ${ks.length}</h2><div class="판">${ks.map(칸).join('')}</div>`).join('')}
<pre id="글" hidden></pre>
<div class="바닥"><button id="복사">📋 결과 복사</button><span id="남은"></span></div>
<script>
const 칸=s=>'hankki:판:크리스마스홈-1109';let 값={};try{값=JSON.parse(localStorage.getItem(칸())||'{}')}catch{}
const 그리기=()=>{document.querySelectorAll('.칸').forEach(c=>{const v=값[c.dataset.k];c.dataset.v=v||'';c.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===v))});const n=Object.keys(값).length;document.getElementById('남은').textContent=n+' / '+document.querySelectorAll('.칸').length+' 골랐어'}
document.addEventListener('click',e=>{const b=e.target.closest('.고름 button');if(!b)return;const k=b.closest('.칸').dataset.k;값[k]=값[k]===b.dataset.v?undefined:b.dataset.v;if(!값[k])delete 값[k];try{localStorage.setItem(칸(),JSON.stringify(값))}catch{}그리기()})
document.getElementById('복사').onclick=async()=>{const g={좋다:[],버린다:[],모르겠다:[]};for(const[k,v]of Object.entries(값))g[v].push(k);const t='[크리스마스 홈 후보]\\n'+Object.entries(g).map(([v,ks])=>'· '+v+' ('+ks.length+'): '+(ks.join(', ')||'-')).join('\\n');const pre=document.getElementById('글');pre.textContent=t;pre.hidden=false;
let ok=false;try{await navigator.clipboard.writeText(t);ok=true}catch{}const r=document.createRange();r.selectNodeContents(pre);const s=getSelection();s.removeAllRanges();s.addRange(r);document.getElementById('남은').textContent=ok?'복사했어 (안 붙여지면 위 글을 길게 눌러 복사)':'위 글을 길게 눌러 복사해줘'}
그리기()
</script>`
mkdirSync(OUT, { recursive: true })
const 파일 = join(OUT, '크리스마스홈-후보-2026-11-09.html'); writeFileSync(파일, html)
console.log(`✅ ${파일} · ${묶음.map(([t, k]) => `${t.split(' ')[0]}${k.length}`).join(' · ')} · ${(html.length / 1024 / 1024).toFixed(1)}MB`)
