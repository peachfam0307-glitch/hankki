/**
 * 🔍 음식 아이콘 픽커 «전수» 분류판 — 갈래마다 그림＋이름을 다 띄우고 «옮길 곳»을 고르게 한다 (2026-08-27)
 *
 * 📮 창업자 = *"어제 음식 올린거 아이콘에 밥에 국들어가고 다 섞였어 지금 이거부터하자."*
 *    → *"픽커 전체 다 봐야할 것 같아"* → *"네가 판만들면 내가 보고바로바로 분류해줄게"*
 *    → *"svg아이콘에 라면도 하나들어갔더라.."*
 *
 * ⛔⛔ **이름표 대조로는 못 잡는다** — 창업자가 픽커에서 보는 것은 «그림»이다.
 *    이름표가 「비빔밥」인데 그림이 국이면 그게 섞인 것이고, 글자만 맞대보면 통과한다.
 *    🔢 실제로 밥/국/면 갈래를 이름으로 기계 대조하니 **이상 0** 이 나왔다 —
 *       내 잣대가 창업자가 본 것을 «안 보고» 있었다(규칙 18 ⓘ).
 *
 * ✅ **기계로 잡힌 것 하나 = `fe_395`(라면)이 「요리 아이콘」(SVG 도형 18개) 갈래에 섞여 있다.**
 *    창업자 제보 그대로였고 **전수로 봐도 그 한 건뿐**이다(접두어로 갈리니 이건 기계가 잡는다).
 *    ⛔ 나머지 「밥에 국」류는 그림을 봐야 하므로 이 판이 필요하다.
 *
 * ⭐ 픽커가 실제로 부르는 PNG 를 **갈래 순서 그대로** 깐다(규칙 30) — 흉내가 아니다.
 * ⭐ 어제(v11.48) 들어간 컷은 **주황 테두리**. 도형 갈래에 섞인 사진 키는 **빨강**.
 * ☑️ 절대원칙(창업자 2026-08-19) = 검수판은 «무조건» 체크 ＋ 복사.
 *    ⭐ 여기선 한 걸음 더 — **옮길 갈래를 고르는 칸**을 붙였다(창업자 *"분류해줄게"*).
 *
 * ⚠️ 썸네일은 미리 만들어 둔다(원본을 그대로 담으면 144MB 라 아티팩트 한도 16MB 를 넘는다):
 *    python3 로 96px 썸네일 → /tmp/th  (아래 THUMB 상수)
 *
 * 쓰기: node scripts/_판-픽커전수-0827.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const THUMB = process.env.THUMB || '/tmp/th'
const SRC = readFileSync(path.join(ROOT, 'src/components/FoodIcon.jsx'), 'utf8')

/* ── ① 이름표 — `ICON_RULES` 의 «첫 낱말» ＋ `EXTRA_NAMES` */
const 이름 = {}
for (const m of SRC.matchAll(/\[\[([^\]]*)\]\s*,\s*'([a-z]+_[A-Za-z0-9_]+)'\s*\]/g)) {
  const 첫 = m[1].split(',')[0].trim().replace(/^['"]|['"]$/g, '')
  if (!이름[m[2]]) 이름[m[2]] = 첫
}
const ex = SRC.match(/const EXTRA_NAMES = \{([\s\S]*?)\n\}/)
if (ex) for (const m of ex[1].matchAll(/'?([A-Za-z0-9_]+)'?\s*:\s*'([^']+)'/g)) 이름[m[1]] ||= m[2]

/* ── ② 픽커 갈래 — 배열 «순서 그대로»(앱이 그리는 순서) · ⛔재료(ing) 갈래는 이번 대상이 아니다 */
const 갈래 = []
for (const m of SRC.matchAll(/\{\s*label:\s*'([^']+)'\s*(?:,\s*kind:\s*'(\w+)'\s*)?,\s*items:\s*\[([^\]]*)\]/g)) {
  if (m[2]) continue
  갈래.push({ 라벨: m[1], 키: m[3].split(',').map((x) => x.trim().replace(/'/g, '')).filter(Boolean) })
}

/* ── ③ 어제(v11.48) 들어간 키 */
const 어제 = new Set()
try {
  const d = execSync('git show 35ef1c5c -- src/components/FoodIcon.jsx', { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString()
  for (const m of d.matchAll(/^\+.*?'(gr_\d+)'/gm)) 어제.add(m[1])
} catch { /* git 이 없으면 표시만 못 한다 */ }

const 사진키 = /^(fe|fh|fy|fj|fi|fb|gr)_/
const 옮길곳 = [...갈래.map((g) => g.라벨), '픽커에서 내리기', '그림이 틀림 — 다시 뽑기']

let 총 = 0, 섞임 = 0
const 절 = []
for (const g of 갈래) {
  const 도형갈래 = g.키.filter((k) => !사진키.test(k)).length > g.키.length / 2
  const 칸 = []
  for (const k of g.키) {
    총++
    const p = path.join(THUMB, `${k}.png`)
    const src = existsSync(p) ? 'data:image/png;base64,' + readFileSync(p).toString('base64') : null
    const 이상 = 도형갈래 && 사진키.test(k)   // 도형 갈래에 사진이 섞였다
    if (이상) 섞임++
    칸.push(`<label class="c${어제.has(k) ? ' new' : ''}${이상 ? ' bad' : ''}">
      <input type="checkbox" data-k="${k}" data-n="${(이름[k] || '').replace(/"/g, '')}">
      ${src ? `<img src="${src}" alt="" loading="lazy">` : `<div class="shape">${k}</div>`}
      <b>${(이름[k] || '⚠️이름표 없음').replace(/</g, '&lt;')}</b><s>${k}</s>
      <select class="mv"><option value="">→ 옮길 곳</option>${옮길곳.filter((x) => x !== g.라벨).map((x) => `<option>${x}</option>`).join('')}</select>
    </label>`)
  }
  절.push(`<section id="g-${encodeURIComponent(g.라벨)}" data-g="${g.라벨}"><h2>${g.라벨} <em>${g.키.length}컷</em><u data-c="0"></u></h2><div class="grid">${칸.join('')}</div></section>`)
}

const HTML = `<title>픽커 전수 분류</title>
<style>
:root{--bg:#faf8f4;--ink:#2b2118;--sub:#8a7a68;--line:#e4dccf;--new:#c2703a;--bad:#c0392b;--card:#fff;--hit:#ffe9d8}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#1b1713;--ink:#f0e8dc;--sub:#a89684;--line:#3a3229;--card:#241f19;--hit:#3a2416}}
:root[data-theme="dark"]{--bg:#1b1713;--ink:#f0e8dc;--sub:#a89684;--line:#3a3229;--card:#241f19;--hit:#3a2416}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;padding:16px 12px 96px}
h1{font-size:20px;margin:0 0 4px}
.lead{color:var(--sub);font-size:13.5px;margin:0 0 8px}
.key{display:flex;gap:12px;flex-wrap:wrap;font-size:12.5px;color:var(--sub);margin:0 0 18px}
.key i{font-style:normal;display:inline-block;width:11px;height:11px;border-radius:3px;border:2px solid;vertical-align:-1px;margin-right:3px}
section{margin:0 0 26px}
h2{font-size:17px;margin:0 0 10px;padding:6px 0;border-bottom:2px solid var(--line);position:sticky;top:0;background:var(--bg);z-index:2}
h2 em{font-style:normal;color:var(--sub);font-size:13px;font-weight:400}
h2 u{float:right;text-decoration:none;font-size:12.5px;color:var(--new);font-weight:600}
h2 u[data-c="0"]{display:none}
h2 u::after{content:attr(data-c) "개 표시"}
.jump{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 20px}
.jump a{font-size:12.5px;text-decoration:none;color:var(--ink);background:var(--card);border:1.5px solid var(--line);border-radius:999px;padding:5px 10px;display:inline-flex;gap:5px;align-items:baseline}
.jump a em{font-style:normal;color:var(--sub);font-size:11px;font-variant-numeric:tabular-nums}
.jump a:focus-visible,.c:focus-within{outline:2px solid var(--new);outline-offset:2px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:8px}
.c{background:var(--card);border:1.5px solid var(--line);border-radius:10px;padding:6px 5px 6px;text-align:center;position:relative;display:block}
.c.new{border-color:var(--new)}
.c.bad{border-color:var(--bad);border-width:2.5px}
.c img{width:100%;aspect-ratio:1;object-fit:contain;display:block}
.shape{aspect-ratio:1;display:grid;place-items:center;font-size:9.5px;color:var(--sub);background:var(--bg);border-radius:6px;word-break:break-all;padding:2px}
.c b{display:block;font-size:11.5px;font-weight:600;line-height:1.25;margin-top:3px;word-break:keep-all}
.c s{display:block;font-size:9.5px;color:var(--sub);text-decoration:none;font-variant-numeric:tabular-nums}
.c input{position:absolute;top:4px;left:4px;width:19px;height:19px;accent-color:var(--new);margin:0}
.c:has(input:checked){background:var(--hit);border-color:var(--new)}
.mv{width:100%;margin-top:4px;font:11px/1 inherit;padding:4px 2px;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--ink);display:none}
.c:has(input:checked) .mv{display:block}
.bar{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1.5px solid var(--line);padding:10px 12px;display:flex;gap:8px;align-items:center}
.bar span{font-size:13.5px;color:var(--sub);flex:1}
button{font:600 14px/1 inherit;padding:11px 16px;border-radius:9px;border:1.5px solid var(--new);background:var(--new);color:#fff;cursor:pointer}
button.ghost{background:transparent;color:var(--new)}
#out{position:fixed;inset:12px;background:var(--card);border:1.5px solid var(--line);border-radius:12px;padding:14px;display:none;z-index:9;flex-direction:column;gap:10px}
#out textarea{flex:1;width:100%;border:1px solid var(--line);border-radius:8px;padding:10px;font:13px/1.5 ui-monospace,monospace;background:var(--bg);color:var(--ink);resize:none}
</style>
<h1>🔍 픽커 전수 분류</h1>
<p class="lead">픽커가 실제로 부르는 그림을 <b>갈래 순서 그대로</b> 깔았다 — 앱에서 보이는 것과 같다.<br>
갈래에 안 맞는 걸 <b>누르면</b> 아래에 <b>「옮길 곳」</b> 칸이 뜬다. 다 고르고 <b>복사하기</b>.</p>
<p class="key"><span><i style="border-color:var(--new)"></i>어제(v11.48) 들어간 컷</span>
<span><i style="border-color:var(--bad)"></i>도형 갈래에 사진이 섞였다 ${섞임}건</span>
<span>전체 ${총}컷 · ${갈래.length}갈래</span></p>
<nav class="jump">${갈래.map((g) => `<a href="#g-${encodeURIComponent(g.라벨)}">${g.라벨}<em>${g.키.length}</em></a>`).join('')}</nav>
${절.join('')}
<div class="bar"><span id="n">0개 골랐다</span>
<button class="ghost" onclick="document.querySelectorAll('input:checked').forEach(i=>i.checked=0);세기()">지우기</button>
<button onclick="복사()">복사하기</button></div>
<div id="out"><textarea id="t" readonly></textarea><button onclick="document.getElementById('out').style.display='none'">닫기</button></div>
<script>
const 세기=()=>{
  document.getElementById('n').textContent=document.querySelectorAll('input:checked').length+'개 골랐다'
  // 갈래마다 몇 개 표시했는지 — 어디까지 봤는지가 한눈에 보인다
  document.querySelectorAll('section').forEach(s=>{
    s.querySelector('h2 u').dataset.c=s.querySelectorAll('input:checked').length})}
document.addEventListener('change',세기)
function 글(){const r=[]
  document.querySelectorAll('section').forEach(s=>{
    const c=[...s.querySelectorAll('input:checked')]; if(!c.length)return
    r.push('['+s.dataset.g+']')
    c.forEach(i=>{const box=i.closest('.c'); const mv=box.querySelector('.mv').value
      r.push('  '+i.dataset.k+' '+i.dataset.n+(mv?('  →  '+mv):'  →  (안 정함)'))})})
  return r.length?r.join('\\n'):'(고른 것 없음)'}
async function 복사(){const t=글()
  try{await navigator.clipboard.writeText(t);alert('복사했어요')}
  catch(e){const o=document.getElementById('out');document.getElementById('t').value=t
    o.style.display='flex';const ta=document.getElementById('t');ta.focus();ta.select()}}
</script>`

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/픽커전수.html'
writeFileSync(OUT, HTML)
console.log(`✅ ${OUT}`)
console.log(`   갈래 ${갈래.length} · 컷 ${총} · 어제 ${어제.size} · 도형갈래에 섞인 사진 ${섞임} · ${(HTML.length / 1024 / 1024).toFixed(1)}MB`)
