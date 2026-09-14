/**
 * 🔍 레시피에 «박힌» icon 이 규칙이 가리키는 컷과 다른 곳 — 전수 (2026-08-27)
 *
 * 📮 창업자 = *"아직 레시피 김치찌개 아래있는 음식아이콘 안바뀌었어.."*
 *    → 실물로 보니 **`fh_k13`(제육볶음)이 옛 카와이 일러스트**였다. 규칙은 `gr_387`(새 실사)을 가리킨다.
 *
 * ⛔⛔ **v10.76 · v11.33 과 «같은 자리»다** — `Thumb.jsx` = `recipe.icon || guessFoodIcon(제목)`
 *    라서 **박힌 값이 있으면 규칙을 아예 안 본다.** 규칙을 새 컷으로 다 고쳐놔도 안 바뀐다.
 *
 * ⭐ 그래서 «하나만» 고치지 않는다 — 박힌 것 전부를 규칙과 대조한다.
 *
 * ⛔ 「다르다 = 틀렸다」가 아니다 — v90 처럼 **일부러 박은 것**도 있다(해장파스타·해물오일파스타).
 *    그래서 이 판은 **고르지 않는다.** 목록만 내고 판정은 눈·창업자가 한다(규칙 11).
 *
 * 쓰기: cd /home/user/hankki/hankki && node scripts/_probe-박힌아이콘-0827.mjs [--판]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 사진 = path.join(ROOT, 'src/assets/stickers/photo')

// ⭐ 레시피는 앱과 «같은 모듈»에서 읽는다(절대원칙 30)
const { allBasicRecipes } = await import('../src/data/basics.js')

// ⛔ `FoodIcon.jsx` 는 node 가 직접 못 읽는다(.jsx) → 규칙만 «파일 순서 그대로» 뽑는다.
//    ⚠️ 이건 흉내다. 그래서 **아래에서 알려진 답으로 검증하고, 어긋나면 죽는다**(규칙 18 ⓘ).
const SRC = readFileSync(path.join(ROOT, 'src/components/FoodIcon.jsx'), 'utf8')
const 시작 = SRC.indexOf('const ICON_RULES = [')
if (시작 < 0) { console.error('⛔ ICON_RULES 를 못 찾았다 — 모양이 바뀌었나?'); process.exit(1) }
const 몸통 = SRC.slice(시작, SRC.indexOf('\n]', 시작))
const RULES = [...몸통.matchAll(/\[\[([^\]]*)\]\s*,\s*'([a-z]+_[A-Za-z0-9_]+)'\s*\]/g)]
  .map((m) => [m[1].split(',').map((x) => x.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean), m[2]])
// ⛔ 상한을 «어림»으로 잡지 말 것 — 처음에 500 으로 잡았다가 「파서가 깨졌다」고 잘못 말했다.
//    실측 = 472줄(2026-08-27). 파서가 진짜 깨지면 수십 개로 떨어진다.
if (RULES.length < 400) { console.error(`⛔ 규칙을 ${RULES.length}개밖에 못 읽었다 — 파서가 깨졌다`); process.exit(1) }
// ⭐ `guessFoodIcon` 과 «같은 세 줄» — 위에서부터 첫 매칭(구체어 먼저)
const guessFoodIcon = (name = '') => {
  const s = String(name)
  for (const [keys, key] of RULES) if (keys.some((k) => s.includes(k))) return key
  return 'default'
}
// 이름표 = 규칙 첫 낱말 ＋ EXTRA_NAMES 보조 (`FOOD_NAMES` 와 같은 순서)
const FOOD_NAMES = {}
const ex = SRC.match(/const EXTRA_NAMES = \{([\s\S]*?)\n\}/)
if (ex) for (const m of ex[1].matchAll(/'?([A-Za-z0-9_]+)'?\s*:\s*'([^']+)'/g)) FOOD_NAMES[m[1]] = m[2]
for (const [keys, key] of RULES) FOOD_NAMES[key] = keys[0]

// 🔒 흉내가 앱과 어긋나지 않았나 — 아는 답으로 대조한다. 하나라도 틀리면 «죽는다»
// ⛔ 처음에 「돼지고기 김치찌개 → gr_356」 을 기대값으로 넣었다가 이 검증이 «나를» 잡았다.
//    `gr_356` 은 「돼지고기김치«찜»」이고 찌개는 `fh_k02` 다 — **키 이름이 비슷해서 내가 헷갈렸다.**
//    ⭐ 그리고 `fh_k02` 는 옛 «키»지만 그 PNG 는 이미 새 실사로 갈려 있다(눈으로 확인).
//       📌 **접두어가 옛것이라고 그림이 옛것인 건 아니다** — v11.32 가 「키는 두고 PNG 만」 갈았다.
for (const [제목, 기대] of [['제육볶음', 'gr_387'], ['돼지고기 김치찌개', 'fh_k02'], ['된장찌개', 'fe_133']]) {
  const 난것 = guessFoodIcon(제목)
  if (난것 !== 기대) {
    console.error(`⛔ 규칙 흉내가 어긋났다 — 「${제목}」 = ${난것} (기대 ${기대}). 파서를 고치기 전엔 «판정하지 않는다»`)
    process.exit(1)
  }
}

// ⛔ `allBasicRecipes` 는 «함수가 아니라 배열»이다(실측) — `recipe.mjs` 도 그렇게 쓴다
const 레시피 = Array.isArray(allBasicRecipes) ? allBasicRecipes : allBasicRecipes()
const 박힘 = 레시피.filter((r) => r.icon)
console.log(`🍳 기본 레시피 ${레시피.length}편 · 그중 icon 이 «박힌» 것 ${박힘.length}편\n`)

const 다름 = []
for (const r of 박힘) {
  const 규칙 = guessFoodIcon(r.title)
  if (규칙 === r.icon) continue
  다름.push({ 제목: r.title, 박힌: r.icon, 규칙, 박힌이름: FOOD_NAMES[r.icon] || '?', 규칙이름: FOOD_NAMES[규칙] || '?' })
}

// 🎨 세대 = 접두어로 «거칠게» 가른다. ⛔이걸로 판정하지 않는다 — 어디를 볼지만 정한다(규칙 18 ⓘ)
//    `gr_` = 2026-08-26 새 세대 · `fe_5xx` = 그 직전 · `fh_/fb_/fy_/fj_/fi_` = 옛 세대
const 옛세대 = (k) => /^(fh|fb|fy|fj|fi)_/.test(k)
const 새쪽으로 = 다름.filter((x) => 옛세대(x.박힌) && !옛세대(x.규칙))
const 나머지 = 다름.filter((x) => !(옛세대(x.박힌) && !옛세대(x.규칙)))

console.log(`⛔ 박힌 게 «옛 세대»고 규칙은 «새 세대»를 가리킨다 — ${새쪽으로.length}편`)
console.log('   (v10.76·v11.33 과 같은 자리 — 이 편들은 규칙을 고쳐도 화면이 안 바뀐다)\n')
for (const x of 새쪽으로) {
  const 있나 = existsSync(path.join(사진, `${x.규칙}.png`)) ? '' : '  ⛔그림 없음'
  console.log(`   ${x.제목.padEnd(22)} 박힌 ${x.박힌.padEnd(9)}(${x.박힌이름})  →  규칙 ${x.규칙.padEnd(9)}(${x.규칙이름})${있나}`)
}

console.log(`\n⚠️ 그 밖에 «다른» 것 ${나머지.length}편 — ⛔일부러 박은 것이 섞여 있다(v90 해장파스타 등). 눈으로 볼 것`)
for (const x of 나머지.slice(0, 20)) {
  console.log(`   ${x.제목.padEnd(22)} 박힌 ${x.박힌.padEnd(9)}(${x.박힌이름})  ↔  규칙 ${x.규칙.padEnd(9)}(${x.규칙이름})`)
}
if (나머지.length > 20) console.log(`   … ＋${나머지.length - 20}편`)

// 📤 그림을 «재려면» 목록이 필요하다 — python 이 읽게 JSON 으로 뱉는다
// ⛔ node 출력을 python 이 «글자로 파싱»하지 않는다 — 그렇게 짰다가 IndexError 로 죽었다.
//    📌 값을 넘길 땐 «사람이 읽는 줄»이 아니라 «기계가 읽는 파일»로.
if (process.argv.includes('--json')) {
  const OUT = process.argv[process.argv.indexOf('--json') + 1] || '/tmp/박힌아이콘.json'
  writeFileSync(OUT, JSON.stringify({
    사진폴더: 사진,
    편: 박힘.map((r) => ({
      제목: r.title, 박힌: r.icon, 규칙: guessFoodIcon(r.title),
      박힌이름: FOOD_NAMES[r.icon] || '?', 규칙이름: FOOD_NAMES[guessFoodIcon(r.title)] || '?',
      from: r.from || null, review: r.review || null,
    })),
  }, null, 1))
  console.log(`\n📤 ${OUT}  (${박힘.length}편)`)
}

// 📋 판 — 두 그림을 나란히 놓고 눈으로 판정한다
if (process.argv.includes('--판')) {
  const b64 = (k) => {
    const p = path.join(사진, `${k}.png`)
    return existsSync(p) ? 'data:image/png;base64,' + readFileSync(p).toString('base64') : null
  }
  const 칸 = (x, i) => {
    const a = b64(x.박힌); const c = b64(x.규칙)
    return `<article data-i="${i}" data-t="${x.제목}">
      <h2>${x.제목}</h2>
      <div class="pair">
        <label class="p"><input type="radio" name="r${i}" value="박힌">
          ${a ? `<img src="${a}">` : '<div class="miss">그림 없음</div>'}
          <s>${x.박힌}</s><u>${x.박힌이름}</u><span class="tag old">지금 박힌 것</span></label>
        <label class="p"><input type="radio" name="r${i}" value="규칙">
          ${c ? `<img src="${c}">` : '<div class="miss">그림 없음</div>'}
          <s>${x.규칙}</s><u>${x.규칙이름}</u><span class="tag">규칙이 가리키는 것</span></label>
      </div></article>`
  }
  const 목록 = [...새쪽으로, ...나머지]
  const HTML = `<title>박힌 아이콘 대조</title>
<style>
:root{--bg:#faf8f4;--ink:#2b2118;--sub:#8a7a68;--line:#e4dccf;--new:#c2703a;--card:#fff;--hit:#ffe9d8}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#1b1713;--ink:#f0e8dc;--sub:#a89684;--line:#3a3229;--card:#241f19;--hit:#3a2416}}
:root[data-theme="dark"]{--bg:#1b1713;--ink:#f0e8dc;--sub:#a89684;--line:#3a3229;--card:#241f19;--hit:#3a2416}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.6 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;padding:16px 12px 96px}
h1{font-size:20px;margin:0 0 6px}.lead{color:var(--sub);font-size:13.5px;margin:0 0 20px}
article{background:var(--card);border:1.5px solid var(--line);border-radius:12px;padding:12px;margin:0 0 14px}
h2{font-size:16.5px;margin:0 0 10px}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.p{border:2px solid var(--line);border-radius:10px;padding:8px 6px;text-align:center;position:relative;display:block;cursor:pointer}
.p img{width:100%;aspect-ratio:1;object-fit:contain;display:block}
.p s{display:block;text-decoration:none;font-size:11.5px;color:var(--sub);margin-top:4px}
.p u{display:block;text-decoration:none;font-size:12.5px;font-weight:600;margin-top:1px}
.p .tag{display:inline-block;font-size:10.5px;margin-top:5px;padding:2px 7px;border-radius:999px;background:var(--new);color:#fff}
.p .tag.old{background:var(--sub)}
.p input{position:absolute;top:6px;left:6px;width:20px;height:20px;accent-color:var(--new);margin:0}
.p:has(input:checked){background:var(--hit);border-color:var(--new)}
.miss{padding:40px 0;color:var(--sub);font-size:13px}
.bar{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1.5px solid var(--line);padding:10px 12px;display:flex;gap:8px;align-items:center}
.bar span{font-size:13.5px;color:var(--sub);flex:1}
button{font:600 14px/1 inherit;padding:11px 16px;border-radius:9px;border:1.5px solid var(--new);background:var(--new);color:#fff;cursor:pointer}
button.ghost{background:transparent;color:var(--new)}
#out{position:fixed;inset:12px;background:var(--card);border:1.5px solid var(--line);border-radius:12px;padding:14px;display:none;z-index:9;flex-direction:column;gap:10px}
#out textarea{flex:1;width:100%;border:1px solid var(--line);border-radius:8px;padding:10px;font:13px/1.5 ui-monospace,monospace;background:var(--bg);color:var(--ink);resize:none}
</style>
<h1>🍳 레시피에 «박힌» 그림 ↔ 규칙이 가리키는 그림</h1>
<p class="lead">왼쪽 = 지금 화면에 뜨는 것 · 오른쪽 = 규칙이 가리키는 것.<br>
<b>남길 쪽을 누르면</b> 그대로 맞춘다. ⛔ 다른 게 다 틀린 건 아니다 — <b>일부러 박은 것</b>도 있다.</p>
${목록.map(칸).join('')}
<div class="bar"><span id="n">0/${목록.length} 정했다</span>
<button class="ghost" onclick="처음부터()">처음부터</button>
<button onclick="복사()">복사하기</button></div>
<div id="out"><textarea id="t" readonly></textarea><button onclick="document.getElementById('out').style.display='none'">닫기</button></div>
<script>
const KEY='hankki:판:박힌아이콘-0827'
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
    r.push(a.dataset.t+' : '+(c.value==='박힌'?'그대로 ('+p[0].textContent+')':'바꾼다 → '+p[1].textContent))})
  return r.length?r.join('\\n'):'(고른 것 없음)'}
async function 복사(){const t=글()
  try{await navigator.clipboard.writeText(t);alert('복사했어요')}
  catch(e){const o=document.getElementById('out');document.getElementById('t').value=t
    o.style.display='flex';const ta=document.getElementById('t');ta.focus();ta.select()}}
</script>`
  const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/박힌아이콘.html'
  writeFileSync(OUT, HTML)
  console.log(`\n✅ 판 = ${OUT}  (${목록.length}편 · ${(HTML.length / 1024 / 1024).toFixed(1)}MB)`)
}
