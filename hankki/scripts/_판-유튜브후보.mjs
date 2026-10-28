// 🎥 유튜브 레시피 후보판 — 창업자가 폰에서 «체크 ＋ 복사»로 고른다
//
// 📮 창업자 2026-10-28 「검수도우미랑 유튜브후보판 순서대로 하자」
//    흐름 = ⭐후보판(조회수 순 · 재료+분량+순서 있는 것만 · 겹침 걸름) → 창업자 고르기 → 원문 초안 → 검수 도우미 → …
//    (docs/레시피-출처-규칙-2026-09-27.md 맨 아래)
//
// ⛔ 유튜브는 yt.mjs 로만 부른다(사용량 장부 · 💰 절대원칙) — 검색어 하나 = 검색 1 ＋ 그 밖 1단위
// ⛔ 판(HTML)은 scratchpad 에만 — 저장소가 public 이다
//
// 쓰기:
//   OUT=<scratchpad> node hankki/scripts/_판-유튜브후보.mjs --after 2026-04-28 "밑반찬 레시피" "겨울 국 레시피"
//   ＋ --갈래 hold/SNS13-1028  ← 그 갈래 레시피와도 겹침을 본다(여러 번 줄 수 있다)
import { execFileSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { todayKST } from '../src/today.js'

const OUT = process.env.OUT || process.env.CLAUDE_SCRATCHPAD_DIR || '/tmp/claude-0'
const 인자 = process.argv.slice(2)
const 검색어들 = []; let after = ''; const 갈래들 = []
for (let i = 0; i < 인자.length; i++) {
  if (인자[i] === '--after') after = 인자[++i]
  else if (인자[i] === '--갈래') 갈래들.push(인자[++i])
  else 검색어들.push(인자[i])
}
if (!검색어들.length) { console.error('쓰기: _판-유튜브후보.mjs [--after YYYY-MM-DD] [--갈래 <브랜치>] "<검색어>" …'); process.exit(1) }

// ── 이미 있는 편 이름(겹침 거르기) — 지금 갈래 ＋ 준 갈래들 ─────────
const 정규 = (s) => s.replace(/\s+/g, '').replace(/[^\p{L}\p{N}]/gu, '')
const 있는이름 = new Set((await import('./recipe.mjs')).레시피들().map((r) => 정규(r.title)))
for (const g of 갈래들) {
  const 글 = execFileSync('git', ['show', `${g}:hankki/src/data/basics.js`], { encoding: 'utf8', maxBuffer: 64 << 20 })
  for (const m of 글.matchAll(/title:\s*'([^']+)'/g)) 있는이름.add(정규(m[1]))
}
// 영상 제목에서 요리 이름 조각을 찾는다 — 우리 편 이름(3자 이상)이 영상 제목 안에 들어 있으면 겹침
const 겹친편 = (제목) => { const t = 정규(제목); return [...있는이름].find((n) => n.length >= 3 && t.includes(n)) }
// 「비슷한 우리 편」 — 이름이 통째로 같지 않아도 같은 요리·같은 재료면 보여 준다(⛔빼지는 않는다 · 창업자가 보고 고른다)
//   📮 2026-10-28 창업자 「우리레시피에 없는 것들이야?」 → 두부조림(3편 있음)·꽈리고추(2편)가 «통째 이름»만 보던 거르기를 통과했다
//   낱말 = 우리 편 제목의 낱말(2자 이상) · 3자 넘는 낱말은 앞 2자(깻잎장아찌→깻잎)도 본다 · 뜻 없는 말은 뺀다
const 원제목들 = []
원제목들.push(...(await import('./recipe.mjs')).레시피들().map((r) => ({ t: r.title, from: r.from })))
for (const g of 갈래들) { const 글 = execFileSync('git', ['show', `${g}:hankki/src/data/basics.js`], { encoding: 'utf8', maxBuffer: 64 << 20 }); for (const m of 글.matchAll(/title:\s*'([^']+)',\s*from:\s*'([^']+)'/g)) 원제목들.push({ t: m[1], from: m[2] }) }
const 뜻없음 = /^(반찬|레시피|초간단|간단|우리집|엄마표|만들기|황금|인생|대박|요리|한끼|셰프|선생)$/
function 비슷한편(제목) {
  // ⓐ 통째 낱말이 겹치면(「두부조림」) 그것만 · ⓑ 없으면 앞 2자를 영상 제목 «낱말 첫머리»에서만(「깻잎」김치 ○ · 만「들기」 ✕ · 깻잎「김치」 ✕)
  const t = 정규(제목); const 첫머리 = 제목.split(/[\s#!?"'.,]+/).map(정규).filter(Boolean)
  const 통째 = new Map(), 앞 = new Map()
  for (const { t: 우리, from } of 원제목들) for (const w of 우리.split(/[\s·,()]+/).map(정규).filter((w) => w.length >= 2 && !뜻없음.test(w))) {
    if (t.includes(w)) 통째.set(우리, from || '바로')
    // ⓒ 영상 낱말이 우리 낱말 안에 들어 있으면(「버섯」 ⊂ 「새송이버섯」·「두부조림」 ⊂ 「순두부조림」)
    else if (첫머리.some((x) => x.length >= 2 && !뜻없음.test(x) && w.includes(x))) 통째.set(우리, from || '바로')
    else if (w.length >= 3 && 첫머리.some((x) => x.startsWith(w.slice(0, 2)))) 앞.set(우리, from || '바로')
  }
  return [...new Map([...통째, ...앞])].map(([n, f]) => `${n}(${f})`)
}

// ── 검색 (yt.mjs) ──────────────────────────────────────────
const 영상 = new Map()
for (const q of 검색어들) {
  const 글 = execFileSync('node', [new URL('./yt.mjs', import.meta.url).pathname, 'search', q, '--n', '25', ...(after ? ['--after', after] : [])],
    { encoding: 'utf8', maxBuffer: 20e6, stdio: ['ignore', 'pipe', 'inherit'] })
  for (const v of JSON.parse(글)) if (!영상.has(v.id)) 영상.set(v.id, { ...v, 검색어: q })
}

const 전부 = [...영상.values()].sort((a, b) => b.조회수 - a.조회수)
const 통과 = [], 빠짐 = []
for (const v of 전부) {
  const 겹 = 겹친편(v.제목)
  const 왜 = [!v.분량있음 && '분량 없음', !v.순서있음 && '순서 없음', 겹 && `겹침(${겹})`].filter(Boolean)
  ;(왜.length ? 빠짐 : 통과).push({ ...v, 왜 })
}

// ── 판 ────────────────────────────────────────────────────
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const 만 = (n) => (n >= 10000 ? `${(n / 10000).toFixed(n >= 100000 ? 0 : 1)}만` : n.toLocaleString())
const 칸 = (v, i) => `
<div class="c" data-id="${v.id}">
  <div class="h"><b>${i + 1}. ${esc(v.제목)}</b></div>
  <div class="m">${esc(v.채널)} · 조회 ${만(v.조회수)} · ${v.올린날} · 검색 「${esc(v.검색어)}」</div>
  ${(() => { const s = 비슷한편(v.제목); return s.length ? `<div class="sim">⚠️ 비슷한 우리 편 ${s.length}: ${esc(s.slice(0, 6).join(' · '))}${s.length > 6 ? ' …' : ''}</div>` : '<div class="sim ok">비슷한 우리 편 없음</div>' })()}
  <a href="https://youtu.be/${v.id}" target="_blank">https://youtu.be/${v.id}</a>
  <details><summary>설명란 보기</summary><pre>${esc(v.설명란 || '')}</pre></details>
  <div class="p">${['고른다', '버린다', '모르겠다'].map((k) => `<label><input type="radio" name="${v.id}" value="${k}"> ${k}</label>`).join('')}</div>
</div>`

const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>유튜브 레시피 후보</title><style>
body{font:15px/1.5 system-ui,sans-serif;margin:0;padding:16px;background:#fbf7f0;color:#2a2420}
h1{font-size:19px;margin:0 0 4px} .s{color:#7a6e64;font-size:13px;margin-bottom:14px}
.c{background:#fff;border-radius:12px;padding:12px;margin:10px 0;box-shadow:0 1px 3px #0001}
.m{color:#7a6e64;font-size:13px} a{word-break:break-all;font-size:13px}
pre{white-space:pre-wrap;font-size:12px;background:#f5efe6;padding:8px;border-radius:8px;max-height:320px;overflow:auto}
.p{display:flex;gap:14px;margin-top:8px} .p label{display:flex;gap:4px;align-items:center}
.c.on{outline:2px solid #e08a3c} button{font-size:16px;padding:12px;width:100%;border:0;border-radius:10px;background:#e08a3c;color:#fff;margin-top:12px}
textarea{width:100%;height:140px;font-size:13px;margin-top:8px;box-sizing:border-box}
.x{color:#9a8e84;font-size:12px}
.sim{font-size:13px;color:#a4521f;background:#fbeee2;border-radius:8px;padding:4px 8px;margin:6px 0} .sim.ok{color:#3c7a4a;background:#e9f4ec}
</style></head><body>
<h1>유튜브 레시피 후보 ${통과.length}개</h1>
<div class="s">${todayKST()} · 조회수 순 · 재료 분량＋순서가 설명란에 있는 것만 · 이미 있는 편과 이름 겹치면 뺐다${after ? ` · ${after} 이후 영상` : ''}</div>
${통과.map(칸).join('')}
<button id="cp">고른 것 복사하기</button><textarea id="t" readonly></textarea>
<details><summary class="x">빠진 영상 ${빠짐.length}개 (왜 빠졌나)</summary><div class="x">${빠짐.map((v) => `${esc(v.제목)} — ${v.왜.join(' · ')}`).join('<br>')}</div></details>
<script>
const K='yt후보-${todayKST()}';let s={};try{s=JSON.parse(localStorage.getItem(K)||'{}')}catch{}
document.querySelectorAll('.c').forEach(c=>{const id=c.dataset.id;
 c.querySelectorAll('input').forEach(r=>{if(s[id]===r.value){r.checked=true;c.classList.add('on')}
  r.onchange=()=>{s[id]=r.value;c.classList.add('on');try{localStorage.setItem(K,JSON.stringify(s))}catch{}}})});
document.getElementById('cp').onclick=async()=>{
 const 줄=[...document.querySelectorAll('.c')].filter(c=>s[c.dataset.id]).map(c=>s[c.dataset.id]+' · '+c.querySelector('b').textContent+' · https://youtu.be/'+c.dataset.id);
 const t=document.getElementById('t');t.value=줄.join('\\n')||'(아직 고른 게 없어요)';
 try{await navigator.clipboard.writeText(t.value)}catch{}
 t.focus();t.select();const r=document.createRange();r.selectNodeContents(t);};
</script></body></html>`

const 파일 = join(OUT, `유튜브후보-${todayKST()}.html`)
writeFileSync(파일, html)
console.log(`✅ 판 = ${파일}\n   통과 ${통과.length} · 빠짐 ${빠짐.length}`)
for (const v of 통과.slice(0, 15)) console.log(`   ${만(v.조회수).padStart(6)} ${v.제목}`)
