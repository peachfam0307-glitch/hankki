// 📌 메모지 마무리 판 — 흰 테 · 크기 · 글씨체 (2026-08-20)
//
// 📮 창업자가 하루에 넷을 짚었고 **넷 다 맞았다**
//    ⑴ *"빨간색 마테 위에 가로로 긴 흰색선이생겼잖아."* · *"16장이 다그래 똑같은 위치에 흰줄이있어"*
//    ⑵ *"음영, 그라데이션생기는것도 꼼꼼하게 확인해줘."*
//    ⑶ *"302는 투명이네 글자쓰는 내부가."*
//    ⑷ *"포스트잇크기도 줄이고키우고 가능한지 답변요망."* ＋ *"글씨체도 정하자."*
//
// 🔢 실측으로 닫은 것 (판에 안 싣는다 — 이미 답이 났다)
//    ⑵ **컷엔 음영이 없다** — 16컷 바깥 그림자 **0px** · 반투명 띠 1.1~1.4%(자른 가장자리라 정상).
//       창업자가 본 음영은 **내가 넣었던 CSS `drop-shadow`** 였고 이미 뺐다.
//    ⑶ **`pn302` 하나만** 안쪽 99.9% 투명 → `tools/자른뒤-다듬기.py --fill` 로 되살렸다.
//
// ⛔⛔ ⑴ **흰 테를 「빼는」 갈래는 판에 없다 — 실제로 못 하기 때문이다.**
//    `--diecut 0` 으로 자르면 자르기 게이트가 죽인다:
//      🚫 절대원칙 위반 — 진갈색 외곽선을 파먹었다.  12935px → 10849px (83.9%)
//    **흰 테는 장식이 아니라 「외곽선 보호막」**이다(창업자 절대원칙 ⓪ · 2026-08-13).
//    `--diecut 2` 도 규칙 하한(0.35%) 밖이라 한 컷도 안 나온다. **지금 3~4px 이 이미 최소다.**
//    ✅ 그래서 갈래는 **「두께」가 아니라 「색」**이다 — 흰 테를 그 종이의 색으로.
//
// ⭐ 규칙 30 — 판은 «앱이 화면에 쓰는 바로 그 값»이라야 한다.
//    그래서 흉내내지 않고 **진짜 앱을 띄워** 메모지에 종이를 갈아끼우며 찍는다.
// ☑️ 절대원칙(2026-08-19) — 검수판은 «무조건» 체크 ＋ 복사.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
// 🩹 두 벌 = `tools/자른뒤-다듬기.py` 가 만든 것 (①흰 테 ②종이색 테 · 둘 다 pn302 고침)
const 벌 = { 종이색: '/tmp/판A' }   // ⭐ pn302 속만 되살린 벌 (흰 테는 그대로 둔다)
for (const [이름, 길] of Object.entries(벌)) {
  if (!existsSync(길)) { console.error(`⛔ ${이름} 벌이 없다 — tools/자른뒤-다듬기.py 를 먼저 돌린다: ${길}`); process.exit(1) }
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4408, r))

const 컷들 = readdirSync(벌.종이색).filter((f) => f.endsWith('.png')).sort()
const 재기 = (폴더, f) => { const b = readFileSync(join(폴더, f)); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) } }
const 데이터 = (폴더, f) => 'data:image/png;base64,' + readFileSync(join(폴더, f)).toString('base64')
console.log(`🖼 ${컷들.length}컷 × 두 벌`)

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, timezoneId: 'Asia/Seoul', deviceScaleFactor: 2 })

// 🌱 메모를 심는다 — ⛔ `localStorage` 는 context 에 붙는다(reload 로는 못 되살린다 · 함정 사전 ①)
const 대상 = '닭곰탕'
const p0 = await ctx.newPage()
await p0.addInitScript(SEED_COACH_SEEN)
await p0.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
await p0.goto('http://127.0.0.1:4408/', { waitUntil: 'networkidle' })
await p0.waitForFunction(() => !!localStorage.getItem('hankki:v1'), null, { timeout: 15000 })
const 심은것 = await p0.evaluate((이름) => {
  const s = JSON.parse(localStorage.getItem('hankki:v1'))
  const r = s.recipes.find((x) => x.title === 이름) || s.recipes[0]
  r.cooked = 2; r.cookedAt = Date.now() - 864e5
  s.diary = [{ id: 'd0', recipeId: r.id, title: r.title, at: Date.now() - 864e5, rating: 4, note: '물 조금 더 · 대파 듬뿍', photo: null }]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  return r.title
}, 대상)
await p0.close()
console.log(`🍲 메모 심음 = ${심은것}`)

// ⛔⛔ `querySelectorAll(...)` 은 «첫째»를 잡는다 — 화면을 쌓으면 이전 화면이 DOM 에 남는다 → `.pop()`
const 갈아끼우기 = async (p, 폴더, 파일) => {
  const { w, h } = 재기(폴더, 파일)
  await p.evaluate(({ url, w, h }) => {
    const el = [...document.querySelectorAll('.memo-note')].pop()
    if (!el) return
    el.style.setProperty('background-image', `url(${url})`, 'important')
    el.style.aspectRatio = String(w / h)
  }, { url: 데이터(폴더, 파일), w, h })
  await p.waitForTimeout(240)
}
const 폭주기 = async (p, 퍼센트) => {
  await p.evaluate((v) => {
    const el = [...document.querySelectorAll('.memo-note')].pop()
    if (el) el.style.setProperty('width', v + '%', 'important')
  }, 퍼센트)
  await p.waitForTimeout(240)
}
const 글씨주기 = async (p, family) => {
  await p.evaluate((f) => {
    const el = [...document.querySelectorAll('.memo-note')].pop()
    if (el) el.style.setProperty('font-family', f, 'important')
  }, family)
  await p.waitForTimeout(320)
}
const 열기 = async () => {
  const p = await ctx.newPage()
  await p.addInitScript(SEED_COACH_SEEN)
  await p.goto('http://127.0.0.1:4408/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(700)
  await p.click(`text=${심은것}`)
  await p.waitForSelector('.memo-note', { timeout: 10000 })
  // ⛔ 하단 고정 버튼이 메모지를 덮는다 → 가운데로 굴린다
  await p.evaluate(() => { const el = [...document.querySelectorAll('.memo-note')].pop(); if (el) el.scrollIntoView({ block: 'center' }) })
  await p.waitForTimeout(400)
  return p
}
// 🔎 메모지 «둘레만» 따로 — 앱 크기(157px)에선 흰 테가 1px 대라 판에서 안 보인다.
//    ⛔ 그렇다고 원본 100% 를 보여주면 «앱에 없는 크기»로 판정하게 된다(규칙 30).
//    ✅ 그래서 «앱 화면 그대로» 잘라 판에서 키운다 — 보는 건 앱이 그린 픽셀이다.
const 메모지만 = async (p, 곳) => {
  const clip = await p.evaluate(() => {
    const r = [...document.querySelectorAll('.memo-note')].pop().getBoundingClientRect()
    return { x: Math.max(0, r.left - 6), y: Math.max(0, r.top - 6), width: Math.min(390, r.width + 12), height: Math.round(r.height * 0.46) }
  })
  await p.screenshot({ path: 곳, clip })
}
const 찍기 = async (p, 곳, 아래 = 150) => {
  const clip = await p.evaluate((아래) => {
    const el = [...document.querySelectorAll('.memo-note')].pop()
    const r = el.getBoundingClientRect()
    const 위 = Math.max(0, Math.round(r.top - 20))
    const 끝 = Math.min(window.innerHeight, Math.round(r.bottom + 아래))
    return { x: 0, y: 위, width: 390, height: Math.max(120, 끝 - 위) }
  }, 아래)
  await p.screenshot({ path: 곳, clip })
}

// ⛔⛔ ① 흰 테 갈래는 «없앴다» — 2026-08-20 에 원인이 컷이 아니라 CSS 로 드러났다.
//    `.paper` (일기 종이) 스타일이 메모지에 딸려와 「네모난 흰 상자 ＋ 위 흰 줄 ＋ 아래 음영」을 만들었다.
//    창업자는 내내 *"프레임 자른거에는 문제가 없다니까??"* 라고 말했고 **맞았다.**
//    → 컷은 그대로 둔다. 이 판은 **크기 · 글씨체**만 묻는다.
const 테컷 = []

// ── ② 크기 ────────────────────────────────────────
//    🔢 지금 = 44%(157px · `styles.css` `.memo-note.stick`). 줄이고 키우는 게 되는지 실물로.
const 크기갈래 = [[34, '작게'], [44, '지금'], [56, '크게'], [68, '아주 크게']]
const 크기컷 = []
{
  const p = await 열기()
  await 갈아끼우기(p, 벌.종이색, 'pn404.png')
  for (const [v, 이름] of 크기갈래) {
    await 폭주기(p, v)
    const 곳 = `${OUT}/마무리-크기-${v}.png`
    await 찍기(p, 곳, 230)
    const px = await p.evaluate(() => Math.round([...document.querySelectorAll('.memo-note')].pop().getBoundingClientRect().width))
    크기컷.push({ v, 이름, px, 곳 })
  }
  await p.close()
}
console.log(`📐 크기 ${크기컷.map((c) => `${c.이름} ${c.px}px`).join(' · ')}`)

// ── ③ 글씨체 — 앱에 «이미 있는» 손글씨 여섯 ──────────────
//    ⛔ `import('..Stickers.jsx')` 는 안 된다 — node 가 JSX 를 못 읽는다(2026-08-20 에 0종이 나왔다).
//    ✅ 그래서 «그 파일에서 직접» 읽는다 — 손으로 베끼면 앱과 갈라진다(규칙 30).
const 손글씨키 = ['gaegu', 'gamja', 'poorstory', 'himelody', 'singleday', 'nanumpen']
const 소스 = readFileSync(join(ROOT, 'src/components/Stickers.jsx'), 'utf8')
const 손글씨 = 손글씨키.map((k) => {
  const m =소스.match(new RegExp(`\\{\\s*key:\\s*'${k}'[^\\n]*`))
  if (!m) return null
  const label = (m[0].match(/label:\s*'([^']+)'/) || [])[1]
  const family = (m[0].match(/family:\s*"([^"]+)"/) || [])[1]
  return label && family ? { key: k, label, family } : null
}).filter(Boolean)
if (손글씨.length !== 손글씨키.length) { console.error(`⛔ 글씨체를 ${손글씨.length}/${손글씨키.length} 만 읽었다 — Stickers.jsx 의 TEXT_FONTS 모양이 바뀌었다`); process.exit(1) }
const 글씨컷 = []
{
  const p = await 열기()
  await 갈아끼우기(p, 벌.종이색, 'pn203.png')
  for (const f of 손글씨) {
    await 글씨주기(p, f.family)
    const 곳 = `${OUT}/마무리-글씨-${f.key}.png`
    await 찍기(p, 곳, 40)
    글씨컷.push({ ...f, 곳 })
  }
  await p.close()
}
console.log(`✍️ 글씨체 ${글씨컷.length}종`)

await ctx.close(); await b.close(); srv.close()

// ── 판 ────────────────────────────────────────────
const 파일 = (f) => 'data:image/png;base64,' + readFileSync(f).toString('base64')
const 고르기 = (id, 값들) => 값들.map((v) => `<button class="opt" data-q="${id}" data-v="${v}">${v}</button>`).join('')

const 테HTML = 테컷.map((c) => `
  <div class="pair" id="테-${c.키}">
    <div class="pairhead"><b>${c.키}</b></div>
    <div class="two">
      <figure><img src="${파일(c.흰테)}" alt=""><figcaption>ⓐ 지금 — 흰 테</figcaption></figure>
      <figure><img src="${파일(c.종이색)}" alt=""><figcaption>ⓑ 종이색 테</figcaption></figure>
    </div>
    <div class="two zoomrow">
      <figure><img src="${파일(c.돋흰테)}" alt=""><figcaption>ⓐ 위쪽 크게</figcaption></figure>
      <figure><img src="${파일(c.돋종이색)}" alt=""><figcaption>ⓑ 위쪽 크게</figcaption></figure>
    </div>
    <div class="opts">${고르기('테-' + c.키, ['ⓐ 흰 테', 'ⓑ 종이색', '모르겠다'])}</div>
  </div>`).join('')

// ⭐ 크기·글씨체는 «하나만» 고르는 것이라 블록도 하나다 —
//    갈래마다 블록을 나누면 「넷 다 골라야 하는 것」처럼 읽히고, 검수판 게이트의 셈도 어긋난다.
const 크기HTML = `
  <div class="pair">
    <div class="grid">${크기컷.map((c) => `
      <figure><img src="${파일(c.곳)}" alt=""><figcaption><b>${c.이름}</b> · ${c.v}% <span class="px">(${c.px}px)</span></figcaption></figure>`).join('')}
    </div>
    <div class="opts">${고르기('크기', 크기컷.map((c) => `${c.이름} ${c.v}%`))}</div>
  </div>`

const 글씨HTML = `
  <div class="pair">
    <div class="grid">${글씨컷.map((c) => `
      <figure><img src="${파일(c.곳)}" alt=""><figcaption><b>${c.label}</b></figcaption></figure>`).join('')}
    </div>
    <div class="opts">${고르기('글씨', 글씨컷.map((c) => c.label))}</div>
  </div>`

const html = `<title>메모지 마무리</title>
<style>
  :root{ --ink:#3a2c20; --sub:#7b6a58; --bg:#faf7f2; --card:#fffdf9; --line:#e6ddd0; --pin:#b6543f; --pop:#d9a520; --ok:#5d8a5f; }
  @media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
    --ink:#f0e7dc; --sub:#b3a595; --bg:#1c1815; --card:#262019; --line:#3d342b; --pin:#e08a72; --pop:#e8c25a; --ok:#8fbf91; } }
  :root[data-theme="dark"]{ --ink:#f0e7dc; --sub:#b3a595; --bg:#1c1815; --card:#262019; --line:#3d342b; --pin:#e08a72; --pop:#e8c25a; --ok:#8fbf91; }
  *{box-sizing:border-box}
  body{background:var(--bg);color:var(--ink);font-family:'Gowun Dodum','Apple SD Gothic Neo',sans-serif;
       margin:0;padding:20px 14px 120px;line-height:1.6;-webkit-text-size-adjust:100%}
  .wrap{max-width:920px;margin:0 auto}
  h1{font-size:24px;margin:0 0 4px;letter-spacing:-.4px;text-wrap:balance}
  .sub{color:var(--sub);font-size:14px;margin:0 0 18px}
  h2{font-size:18px;margin:34px 0 4px;padding-top:14px;border-top:2px solid var(--line)}
  .note{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin:10px 0 16px;font-size:14px}
  .note b{color:var(--pin)}
  .pair{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px 10px 12px;margin:0 0 14px}
  .pairhead{font-size:14.5px;margin:0 0 8px;padding-left:2px}
  .px{color:var(--sub);font-size:13px}
  .two{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
  .zoomrow{margin-top:7px}
  .zoomrow img{image-rendering:auto;border:1px solid var(--line)}
  figure{margin:0}
  figure img{width:100%;height:auto;display:block;border-radius:8px;background:#fff}
  figcaption{font-size:12.5px;color:var(--sub);text-align:center;margin-top:4px}
  .opts{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
  .opt{font:inherit;font-size:13.5px;padding:7px 13px;border-radius:999px;cursor:pointer;
        border:1.5px solid var(--line);background:transparent;color:var(--ink)}
  .opt:focus-visible{outline:2px solid var(--pop);outline-offset:2px}
  .opt[aria-pressed="true"]{background:var(--ok);border-color:var(--ok);color:#fff;font-weight:700}
  .bar{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:2px solid var(--line);
       padding:10px 14px calc(10px + env(safe-area-inset-bottom));display:flex;gap:10px;align-items:center}
  .bar .cnt{font-size:14px;color:var(--sub);flex:1}
  .bar button{font:inherit;font-size:15px;font-weight:700;padding:11px 18px;border-radius:11px;border:none;
              background:var(--pin);color:#fff;cursor:pointer}
  #out{width:100%;margin-top:10px;font:inherit;font-size:13.5px;padding:10px;border-radius:10px;
       border:1.5px solid var(--line);background:var(--bg);color:var(--ink);display:none;min-height:120px}
</style>
<div class="wrap">
<h1>메모지 마무리</h1>
<p class="sub">크기 · 글씨체 — 2026-08-20 · 전부 <b>진짜 앱 화면</b>을 찍은 것</p>

<div class="note">
  <b>흰 줄은 고쳤어 — 네 말이 맞았어.</b><br>
  종이 그림 잘못이 아니었어. 앱이 메모지 뒤에 <b>흰 종이를 한 장 더 깔고</b> 있었어.
  그게 <b>위쪽 흰 줄 · 아래쪽 어두움 · 네모 상자</b> 셋을 다 만들었어. 치웠고, 아래 사진은 <b>치운 뒤 화면</b>이야.<br>
  · <b>302 속 비어 있던 것</b>도 고쳤어(16장 중 그거 하나였어).
</div>

<h2>① 크기 — 하나만 골라줘</h2>
<div class="note">
  줄이고 키우는 거 <b>돼.</b> 종이 비율도 글씨도 같이 따라와.
</div>
${크기HTML}

<h2>② 글씨체 — 하나만 골라줘</h2>
<div class="note">새로 받을 필요 없이 <b>지금 앱에 들어 있는</b> 것들이야. <b>하나만 골라줘.</b></div>
${글씨HTML}
<textarea id="out" readonly></textarea>
</div>
<div class="bar">
  <span class="cnt" id="done"></span>
  <button id="copy">복사하기</button>
</div>
<script>
// ☑️ 고른 것을 기억한다 — 새로고침해도 안 날아간다
var KEY='hankki:판-메모지마무리-0820';
var saved={}; try{ saved=JSON.parse(localStorage.getItem(KEY)||'{}') }catch(e){ saved={} }
var btns=[].slice.call(document.querySelectorAll('.opt'));
function 그리기(){
  btns.forEach(function(b){ b.setAttribute('aria-pressed', saved[b.dataset.q]===b.dataset.v ? 'true':'false') });
  var qs={}; btns.forEach(function(b){ qs[b.dataset.q]=1 });
  var 총=Object.keys(qs).length, 한것=Object.keys(saved).filter(function(k){return saved[k]}).length;
  document.getElementById('done').textContent='고른 것 '+한것+' / '+총;
}
btns.forEach(function(b){ b.addEventListener('click', function(){
  var q=b.dataset.q, v=b.dataset.v;
  if(saved[q]===v){ delete saved[q] } else { saved[q]=v }   // 다시 누르면 풀린다
  localStorage.setItem(KEY, JSON.stringify(saved)); 그리기();
}) });
그리기();
function 글만들기(){
  var L=['메모지 마무리 판정 (2026-08-20)',''];
  L.push('[① 크기] '+(saved['크기']||'(안 고름)'));
  L.push('[② 글씨체] '+(saved['글씨']||'(안 고름)'));
  return L.join('\\n');
}
document.getElementById('copy').addEventListener('click', function(){
  var t=글만들기(), ta=document.getElementById('out');
  ta.value=t; ta.textContent=t; ta.style.display='block';
  function 손으로(){
    ta.removeAttribute('readonly'); ta.focus(); ta.setSelectionRange(0,t.length);
    // ⛔ clipboard 가 «성공으로 resolve 되고도» 실제 복사가 안 되는 폰이 있다(v10.97) → 글자를 골라 준다
    document.getElementById('copy').textContent='길게 눌러 복사해줘';
  }
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(t).then(function(){
      document.getElementById('copy').textContent='복사됐어';
      setTimeout(function(){ document.getElementById('copy').textContent='복사하기' },1800);
    }).catch(손으로);
  } else { 손으로() }
});
</script>`
const 판 = `${OUT}/메모지마무리.html`
writeFileSync(판, html)
console.log(`\n✅ ${판}`)
