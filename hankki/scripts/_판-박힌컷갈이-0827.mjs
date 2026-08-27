/**
 * 🖼 레시피에 «박힌» 컷이 픽커에서 내려간 것 — 지금 뜨는 그림 ↔ 규칙이 가리키는 그림 (2026-08-27)
 *
 * 📮 창업자 = *"아직 레시피 김치찌개 아래있는 음식아이콘 안바뀌었어.."*
 *
 * ⭐⭐ **잣대 = 「픽커에 아직 있나」** — 이게 제일 정직하다.
 *    어제(v11.48) 옛 컷 133개를 픽커에서 내렸는데, `Thumb.jsx` 는 `recipe.icon || guessFoodIcon(제목)` 이라
 *    **레시피에 박힌 값은 픽커와 무관하게 그대로 뜬다.** → 「내렸는데 아직 뜨는 것」이 정확히 이 목록이다.
 *
 * ⛔ 안 되는 잣대들 (전부 오늘 돌려보고 버렸다)
 *    · **접두어** — `fh_k02`(김치찌개)는 옛 키인데 새 실사다(v11.32 가 키는 두고 PNG 만 갈았다)
 *    · **색 수(top20·uniq)** — 옛 카와이 `fh_k13` 이 새 실사 `gr_387` «보다» 색이 많았다.
 *      옛 컷도 AI 그림이라 음영이 잔뜩 있다. **「벡터라 평평하다」는 내 가정이 틀렸다**(규칙 18 ⓘ)
 *
 * ⛔⛔ **자동으로 갈아끼우면 안 된다** — 이름이 비슷해도 «다른 요리»가 섞인다.
 *    고등어김치찜 → 돼지고기김치찜 · 갈치국 → 갈치구이 · 해물오일파스타 → 알리오올리오(v11.34 사고 자리).
 *    그래서 이 판은 **고르지 않는다.** 나란히 놓기만 하고 판정은 창업자가 한다(규칙 11·13).
 *
 * 쓰기: node scripts/_판-박힌컷갈이-0827.mjs <박힌아이콘.json> <낼폴더>
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 사진 = path.join(ROOT, 'src/assets/stickers/photo')

const JSONP = process.argv[2]
const 낼곳 = process.argv[3] || '.'
if (!JSONP) { console.error('쓰기: node scripts/_판-박힌컷갈이-0827.mjs <박힌아이콘.json> <낼폴더>'); process.exit(1) }
mkdirSync(낼곳, { recursive: true })

// 픽커에 실린 키
const SRC = readFileSync(path.join(ROOT, 'src/components/FoodIcon.jsx'), 'utf8')
const gi = SRC.indexOf('const FOOD_ICON_GROUPS')
if (gi < 0) { console.error('⛔ FOOD_ICON_GROUPS 를 못 찾았다'); process.exit(1) }
const ge = SRC.indexOf('\nexport', gi)
const 픽커 = new Set([...SRC.slice(gi, ge > 0 ? ge : SRC.length)
  .matchAll(/'((?:fe|fh|fy|fj|fi|fb|gr|ig)_[A-Za-z0-9_]+)'/g)].map((m) => m[1]))
// ⛔ 상한을 어림으로 잡지 않는다 — 실측 644(2026-08-27). 파서가 깨지면 수십 개로 떨어진다
if (픽커.size < 400) { console.error(`⛔ 픽커를 ${픽커.size}개밖에 못 읽었다 — 파서가 깨졌다`); process.exit(1) }

// 창업자가 2026-08-27 에 «카와이»로 판정해 뺀 컷
const 카와이 = new Set(JSON.parse(readFileSync(path.join(ROOT, 'docs/stickers/카와이-뺄컷-2026-08-27.json'), 'utf8')).뺄것_카와이)

const 자료 = JSON.parse(readFileSync(JSONP, 'utf8'))
const 목록 = 자료.편.filter((p) => !픽커.has(p.박힌))

const 갈래 = (p) => {
  if (p.규칙 === 'default') return '없음'
  if (p.규칙 === p.박힌) return '없음'
  if (!픽커.has(p.규칙)) return '규칙컷도내려감'
  return '있음'
}

// 🗜 판은 **16MB 상한**이라 원본을 그대로 실으면 못 올린다(40편 = 26.7MB).
//    `_줄이기-판용컷-0827.py` 가 만든 작은 판이 있으면 그것을 쓴다.
const 작게 = path.join(낼곳, 'mini')
const b64 = (k) => {
  const j = path.join(작게, `${k}.jpg`)
  if (existsSync(j)) return 'data:image/jpeg;base64,' + readFileSync(j).toString('base64')
  const p = path.join(사진, `${k}.png`)
  return existsSync(p) ? 'data:image/png;base64,' + readFileSync(p).toString('base64') : null
}

const 칸 = (x, i) => {
  const a = b64(x.박힌); const c = x.규칙 === 'default' ? null : b64(x.규칙)
  const 경고 = 갈래(x) === '없음'
    ? '<p class="warn">⛔ 바꿀 그림이 없다 — 바꾸면 «도형»이 뜬다. 새 컷이 필요하다</p>'
    : (갈래(x) === '규칙컷도내려감' ? '<p class="warn">⚠️ 규칙이 가리키는 컷도 픽커에서 내려간 것이다</p>' : '')
  return `<article data-i="${i}" data-t="${x.제목}">
    <h2>${x.제목}${카와이.has(x.박힌) ? ' <em>★창업자가 뺀 카와이</em>' : ''}</h2>${경고}
    <div class="pair">
      <label class="p"><input type="radio" name="r${i}" value="그대로">
        ${a ? `<img src="${a}">` : '<div class="miss">그림 없음</div>'}
        <s>${x.박힌}</s><u>${x.박힌이름}</u><span class="tag old">지금 뜨는 것</span></label>
      <label class="p"><input type="radio" name="r${i}" value="바꾼다">
        ${c ? `<img src="${c}">` : '<div class="miss">그림 없음<br>(도형이 뜬다)</div>'}
        <s>${x.규칙}</s><u>${x.규칙이름}</u><span class="tag">바꾸면 이것</span></label>
    </div></article>`
}

const 순 = { 있음: 0, 규칙컷도내려감: 1, 없음: 2 }
목록.sort((a, b) => 순[갈래(a)] - 순[갈래(b)] || a.제목.localeCompare(b.제목))

const HTML = `<title>옛 그림 남은 ${목록.length}편</title>
<style>
:root{--bg:#faf8f4;--ink:#2b2118;--sub:#8a7a68;--line:#e4dccf;--new:#c2703a;--card:#fff;--hit:#ffe9d8;--red:#b8402c}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#1b1713;--ink:#f0e8dc;--sub:#a89684;--line:#3a3229;--card:#241f19;--hit:#3a2416;--red:#e08a72}}
:root[data-theme="dark"]{--bg:#1b1713;--ink:#f0e8dc;--sub:#a89684;--line:#3a3229;--card:#241f19;--hit:#3a2416;--red:#e08a72}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;padding:16px 12px 96px;word-break:keep-all}
h1{font-size:20px;margin:0 0 6px}.lead{color:var(--sub);font-size:13.5px;margin:0 0 20px}
article{background:var(--card);border:1.5px solid var(--line);border-radius:12px;padding:12px;margin:0 0 14px}
h2{font-size:16.5px;margin:0 0 8px}h2 em{font-style:normal;font-size:11.5px;color:var(--new)}
.warn{margin:0 0 8px;font-size:12.5px;color:var(--red)}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.p{border:2px solid var(--line);border-radius:10px;padding:8px 6px;text-align:center;position:relative;display:block;cursor:pointer}
.p img{width:100%;aspect-ratio:1;object-fit:contain;display:block}
.p s{display:block;text-decoration:none;font-size:11.5px;color:var(--sub);margin-top:4px}
.p u{display:block;text-decoration:none;font-size:12.5px;font-weight:600;margin-top:1px}
.p .tag{display:inline-block;font-size:10.5px;margin-top:5px;padding:2px 7px;border-radius:999px;background:var(--new);color:#fff}
.p .tag.old{background:var(--sub)}
.p input{position:absolute;top:6px;left:6px;width:20px;height:20px;accent-color:var(--new);margin:0}
.p:has(input:checked){background:var(--hit);border-color:var(--new)}
.miss{padding:34px 0;color:var(--sub);font-size:12.5px;line-height:1.4}
.bar{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1.5px solid var(--line);padding:10px 12px;display:flex;gap:8px;align-items:center}
.bar span{font-size:13.5px;color:var(--sub);flex:1}
button{font:600 14px/1 inherit;padding:11px 16px;border-radius:9px;border:1.5px solid var(--new);background:var(--new);color:#fff;cursor:pointer}
button.ghost{background:transparent;color:var(--new)}
#out{position:fixed;inset:12px;background:var(--card);border:1.5px solid var(--line);border-radius:12px;padding:14px;display:none;z-index:9;flex-direction:column;gap:10px}
#out textarea{flex:1;width:100%;border:1px solid var(--line);border-radius:8px;padding:10px;font:13px/1.5 ui-monospace,monospace;background:var(--bg);color:var(--ink);resize:none}
</style>
<h1>🍱 아직 «옛 그림»이 뜨는 ${목록.length}편</h1>
<p class="lead">「김치찌개 아래 제육볶음」 제보로 <b>전수로 쟀다.</b> 40편이 나왔고 <b>28편은 이미 갈아끼웠다</b>(v11.51 배포).<br>
여기 남은 건 <b>내가 못 정하는 것</b>이다 — 갈치국→갈치«구이»처럼 «다른 요리»로 가거나,
해장파스타처럼 <b>일부러 박아둔 것</b>이거나, 바꿀 그림이 아예 없다.<br>
왼쪽 = <b>지금 폰에 뜨는 것</b> · 오른쪽 = 바꾸면 이렇게 된다. <b>남길 쪽</b>을 누르면 돼요.</p>
${목록.map(칸).join('')}
<div class="bar"><span id="n">0/${목록.length} 정했다</span>
<button class="ghost" onclick="처음부터()">처음부터</button>
<button onclick="복사()">복사하기</button></div>
<div id="out"><textarea id="t" readonly></textarea><button onclick="document.getElementById('out').style.display='none'">닫기</button></div>
<script>
const KEY='hankki:판:박힌컷갈이-0827'
const 저장=()=>{const o={};document.querySelectorAll('input:checked').forEach(i=>o[i.name]=i.value)
  try{localStorage.setItem(KEY,JSON.stringify(o))}catch(e){}}
const 되살리기=()=>{let o={};try{o=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return}
  for(const n in o){const e=document.querySelector('input[name="'+n+'"][value="'+o[n]+'"]');if(e)e.checked=true}}
const 처음부터=()=>{document.querySelectorAll('input:checked').forEach(i=>i.checked=0)
  try{localStorage.removeItem(KEY)}catch(e){};세기()}
const 세기=()=>{document.getElementById('n').textContent=
  document.querySelectorAll('input:checked').length+'/${목록.length} 정했다'}
document.addEventListener('change',()=>{저장();세기()})
되살리기();세기()
function 글(){const r=[]
  document.querySelectorAll('article').forEach(a=>{const c=a.querySelector('input:checked')
    if(!c)return
    const p=a.querySelectorAll('.p s')
    r.push(a.dataset.t+' : '+(c.value==='그대로'?'그대로 ('+p[0].textContent+')':'바꾼다 → '+p[1].textContent))})
  return r.length?r.join('\\n'):'(고른 것 없음)'}
async function 복사(){const t=글()
  try{await navigator.clipboard.writeText(t);alert('복사했어요')}
  catch(e){const o=document.getElementById('out');document.getElementById('t').value=t
    o.style.display='flex';const ta=document.getElementById('t');ta.focus();ta.select()}}
</script>`

const OUT = path.join(낼곳, '박힌컷갈이.html')
writeFileSync(OUT, HTML)
const 셈 = { 있음: 0, 규칙컷도내려감: 0, 없음: 0 }
for (const p of 목록) 셈[갈래(p)]++
console.log(`✅ ${OUT}  (${목록.length}편 · ${(HTML.length / 1024 / 1024).toFixed(1)}MB)`)
console.log(`   대체 있음 ${셈.있음} · 규칙컷도 내려감 ${셈.규칙컷도내려감} · ⛔대체 없음 ${셈.없음}`)

// 📄 내가 «눈으로» 볼 대조표도 같이 — 판을 보내기 «전»에 열어본다(규칙 21)
writeFileSync(path.join(낼곳, '박힌컷갈이.json'), JSON.stringify(
  목록.map((p) => ({ ...p, 갈래: 갈래(p), 카와이: 카와이.has(p.박힌) })), null, 1))
