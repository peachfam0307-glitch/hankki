/**
 * 👯 같은 이름이 픽커에 «두 번» 뜨는 쌍 — 어느 쪽을 남길지 고른다 (2026-08-27)
 *
 * 📮 창업자 = *"어제 음식 올린거 아이콘에 밥에 국들어가고 다 섞였어"*
 *
 * ⭐⭐ **찾은 것 = 같은 요리가 픽커에 두 번 뜬다.**
 *    왼쪽이 전부 어제(v11.48) 넣은 새 키(`gr_44x`·`gr_35x`·`gr_37x`)다 —
 *    119컷을 갈아끼울 때 **짝을 못 찾아 «새 줄»로 들어간 것들**이라
 *    옛 컷이 안 내려가고 **둘 다 픽커에 남았다.**
 *    ＋ 두 쌍은 **갈래까지 갈라져 있다**(돼지고기김치찜 국↔반찬 · 모둠튀김 구이튀김↔분식).
 *
 * ⛔⛔ **작게 보면 틀린다 — 오늘 두 번 밟았다.**
 *    「콩나물국밥」을 「콩나물밥」으로, 「딤섬」을 「떡국」으로 읽었다.
 *    CLAUDE.md 에 *"글자 박힌 컷은 3배로 키워 읽는다"* 가 있는데 같은 함정이다.
 *    ✅ 그래서 이 판은 **256px 로 큼직하게** 나란히 깐다.
 *
 * ⛔ 파일은 «지우지 않는다» — 픽커에서 내리기만 한다(그 열쇠로 저장한 레시피가 깨진다).
 * ☑️ 절대원칙(창업자 2026-08-19) = 검수판은 «무조건» 체크 ＋ 복사.
 *
 * 쓰기: node scripts/_판-같은이름쌍-0827.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BIG = process.env.BIG || '/tmp/big'
const SRC = readFileSync(path.join(ROOT, 'src/components/FoodIcon.jsx'), 'utf8')

const 이름 = {}
for (const m of SRC.matchAll(/\[\[([^\]]*)\]\s*,\s*'([a-z]+_[A-Za-z0-9_]+)'\s*\]/g)) {
  const 첫 = m[1].split(',')[0].trim().replace(/^['"]|['"]$/g, '')
  if (!이름[m[2]]) 이름[m[2]] = 첫
}
const ex = SRC.match(/const EXTRA_NAMES = \{([\s\S]*?)\n\}/)
if (ex) for (const m of ex[1].matchAll(/'?([A-Za-z0-9_]+)'?\s*:\s*'([^']+)'/g)) 이름[m[1]] ||= m[2]

const 갈래키 = {}
for (const m of SRC.matchAll(/\{\s*label:\s*'([^']+)'\s*(?:,\s*kind:\s*'(\w+)'\s*)?,\s*items:\s*\[([^\]]*)\]/g)) {
  if (m[2]) continue
  m[3].split(',').map((x) => x.trim().replace(/'/g, '')).filter(Boolean).forEach((k) => (갈래키[k] = m[1]))
}

const 어제 = new Set()
try {
  const d = execSync('git show 35ef1c5c -- src/components/FoodIcon.jsx', { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString()
  for (const m of d.matchAll(/^\+.*?'(gr_\d+)'/gm)) 어제.add(m[1])
} catch { /* noop */ }

const 묶음 = {}
for (const k of Object.keys(갈래키)) { const n = 이름[k]; if (n) (묶음[n] = 묶음[n] || []).push(k) }
const 쌍 = Object.entries(묶음).filter(([, ks]) => ks.length > 1)

const 그림 = (k) => {
  const p = path.join(BIG, `${k}.png`)
  return existsSync(p) ? 'data:image/png;base64,' + readFileSync(p).toString('base64') : null
}

const 줄 = 쌍.map(([나, ks], i) => {
  const 칸 = ks.map((k) => {
    const s = 그림(k)
    const 갈 = 갈래키[k]
    return `<label class="p${어제.has(k) ? ' new' : ''}">
      <input type="radio" name="r${i}" value="${k}">
      ${s ? `<img src="${s}" alt="">` : '<div class="miss">그림 없음</div>'}
      <s>${k}</s><u>${갈}</u>
      ${어제.has(k) ? '<span class="tag">어제 넣음</span>' : '<span class="tag old">전부터 있던 것</span>'}
    </label>`
  }).join('')
  const 갈갈림 = new Set(ks.map((k) => 갈래키[k])).size > 1
  return `<article data-i="${i}" data-n="${나}">
    <h2>${나}${갈갈림 ? '<em>갈래도 갈라져 있다</em>' : ''}</h2>
    <div class="pair">${칸}</div>
    <div class="both"><label><input type="radio" name="r${i}" value="__both">둘 다 남긴다</label></div>
  </article>`
}).join('')

const HTML = `<title>같은 이름 두 컷</title>
<style>
:root{--bg:#faf8f4;--ink:#2b2118;--sub:#8a7a68;--line:#e4dccf;--new:#c2703a;--card:#fff;--hit:#ffe9d8;--warn:#b06a1f}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#1b1713;--ink:#f0e8dc;--sub:#a89684;--line:#3a3229;--card:#241f19;--hit:#3a2416;--warn:#d69a4e}}
:root[data-theme="dark"]{--bg:#1b1713;--ink:#f0e8dc;--sub:#a89684;--line:#3a3229;--card:#241f19;--hit:#3a2416;--warn:#d69a4e}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;padding:16px 12px 96px}
h1{font-size:20px;margin:0 0 6px}
.lead{color:var(--sub);font-size:13.5px;margin:0 0 20px}
article{background:var(--card);border:1.5px solid var(--line);border-radius:12px;padding:12px;margin:0 0 14px}
h2{font-size:16.5px;margin:0 0 10px;display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}
h2 em{font-style:normal;font-size:12px;color:var(--warn);border:1px solid var(--warn);border-radius:999px;padding:1px 7px}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.p{border:2px solid var(--line);border-radius:10px;padding:8px 6px;text-align:center;position:relative;display:block;cursor:pointer}
.p.new{border-color:var(--new)}
.p img{width:100%;aspect-ratio:1;object-fit:contain;display:block}
.p s{display:block;text-decoration:none;font-size:11.5px;color:var(--sub);margin-top:4px;font-variant-numeric:tabular-nums}
.p u{display:block;text-decoration:none;font-size:12px;font-weight:600;margin-top:1px}
.p .tag{display:inline-block;font-size:10.5px;margin-top:5px;padding:2px 7px;border-radius:999px;background:var(--new);color:#fff}
.p .tag.old{background:var(--sub)}
.p input{position:absolute;top:6px;left:6px;width:20px;height:20px;accent-color:var(--new);margin:0}
.p:has(input:checked){background:var(--hit);border-color:var(--new)}
.both{margin-top:9px;font-size:13px;color:var(--sub)}
.both label{display:inline-flex;gap:6px;align-items:center;cursor:pointer}
.both input{width:17px;height:17px;accent-color:var(--sub);margin:0}
.bar{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1.5px solid var(--line);padding:10px 12px;display:flex;gap:8px;align-items:center}
.bar span{font-size:13.5px;color:var(--sub);flex:1}
button{font:600 14px/1 inherit;padding:11px 16px;border-radius:9px;border:1.5px solid var(--new);background:var(--new);color:#fff;cursor:pointer}
button.ghost{background:transparent;color:var(--new)}
#out{position:fixed;inset:12px;background:var(--card);border:1.5px solid var(--line);border-radius:12px;padding:14px;display:none;z-index:9;flex-direction:column;gap:10px}
#out textarea{flex:1;width:100%;border:1px solid var(--line);border-radius:8px;padding:10px;font:13px/1.5 ui-monospace,monospace;background:var(--bg);color:var(--ink);resize:none}
.p:focus-within{outline:2px solid var(--new);outline-offset:2px}
</style>
<h1>👯 같은 이름이 두 번 뜬다</h1>
<p class="lead">같은 요리가 픽커에 <b>두 컷</b> 있다. <b>남길 쪽을 누르면</b> 나머지는 픽커에서 내린다.<br>
주황 = 어제(v11.48) 커밋에 나온 키 · 회색 = 그 전부터 있던 것.
<b>어느 쪽이 새 것인지는 참고일 뿐</b> — 그림을 보고 나은 쪽을 고르면 된다.<br>
⛔ 파일은 안 지운다 — 픽커에서만 내린다(그 열쇠로 저장한 레시피가 깨지니까).</p>
${줄}
<div class="bar"><span id="n">0/${쌍.length} 정했다</span>
<button class="ghost" onclick="document.querySelectorAll('input:checked').forEach(i=>i.checked=0);세기()">지우기</button>
<button onclick="복사()">복사하기</button></div>
<div id="out"><textarea id="t" readonly></textarea><button onclick="document.getElementById('out').style.display='none'">닫기</button></div>
<script>
const 세기=()=>{document.getElementById('n').textContent=
  document.querySelectorAll('input:checked').length+'/${쌍.length} 정했다'}
document.addEventListener('change',세기)
function 글(){const r=[]
  document.querySelectorAll('article').forEach(a=>{
    const c=a.querySelector('input:checked')
    if(!c){r.push(a.dataset.n+' : (안 정함)');return}
    r.push(a.dataset.n+' : '+(c.value==='__both'?'둘 다 남긴다':('남길 것 = '+c.value)))})
  return r.join('\\n')}
async function 복사(){const t=글()
  try{await navigator.clipboard.writeText(t);alert('복사했어요')}
  catch(e){const o=document.getElementById('out');document.getElementById('t').value=t
    o.style.display='flex';const ta=document.getElementById('t');ta.focus();ta.select()}}
</script>`

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/같은이름쌍.html'
writeFileSync(OUT, HTML)
console.log(`✅ ${OUT}`)
console.log(`   쌍 ${쌍.length} · 컷 ${쌍.flatMap(([, k]) => k).length} · ${(HTML.length / 1024 / 1024).toFixed(1)}MB`)
쌍.forEach(([n, ks]) => console.log(`   ${n} — ${ks.map((k) => `${k}(${갈래키[k]}${어제.has(k) ? '·어제' : ''})`).join(' ↔ ')}`))
