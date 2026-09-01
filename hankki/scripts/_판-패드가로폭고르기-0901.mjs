// 🖥📏 **패드 가로 «글줄 폭» 고르기 판** — 창업자 판정용 (2026-09-01)
//
// 📮 창업자 = *"패드 가로 요리모드에서 글자가 너무 한줄로 길어. 이건 **적당하게 두 줄로** 할 순 없어?"*
//
// ⭐ **지금 앱에 «580px» 로 넣어 뒀다.** 이 판은 「그게 적당한가」를 눈으로 고르라고 만든 것이다.
//    ⛔ 소스를 안 고친다 — 살아 있는 화면에 **`max-width` 한 줄만** 얹어 찍는다(절대원칙 30).
//       글씨체·크기·획은 «지금 앱 그대로»라 창업자가 보는 게 곧 나갈 화면이다.
//
// ＋ 따로 물을 것 하나 = **STEP 줄도 손글씨로 갈까** (지금은 원래 글씨체 — 귀염체로 가면 60.4% 얇아진다)
//
// ☑️ 절대원칙 = 검수판은 **체크 ＋ 복사**가 된다
//
// 실행: node /home/user/hankki/hankki/scripts/_판-패드가로폭고르기-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { 레시피들 } from './recipe.mjs'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/폭고르기'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

// 🍳 앱과 «같은 모듈»에서 걸음을 꺼낸다 — 짧은 것 / 가운데 것 / 긴 것
const 걸음들 = []
for (const r of 레시피들()) for (const s of (r.steps || [])) {
  const t = String(s).split('\n')[0].trim(); if (t) 걸음들.push(t)
}
const 정렬 = [...걸음들].sort((a, b) => a.length - b.length)
const 표본 = [
  { id: 'short', 이름: '짧은 걸음', 글: 정렬[Math.floor(정렬.length * 0.2)] },
  { id: 'mid', 이름: '가운데 걸음(제일 흔하다)', 글: 정렬[Math.floor(정렬.length * 0.5)] },
  { id: 'long', 이름: '긴 걸음(위에서 10%)', 글: 정렬[Math.floor(정렬.length * 0.9)] },
]
const 후보들 = [
  { w: 0, 이름: '지금 그대로(1128px)', 설명: '한 줄 80.7% · 평균 1.19줄' },
  { w: 760, 이름: '760px', 설명: '한 줄 50.6% · 평균 1.56줄 — 패드 «세로»와 같아지는 자리' },
  { w: 700, 이름: '700px', 설명: '한 줄 45.2% · 평균 1.65줄' },
  { w: 640, 이름: '640px', 설명: '한 줄 39.5% · 평균 1.76줄' },
  { w: 580, 이름: '580px ⭐지금 넣어 둔 값', 설명: '한 줄 29.3% · **2줄 50.0%** · 평균 1.95줄' },
  { w: 520, 이름: '520px', 설명: '한 줄 21.9% · 2줄 50.0% · 평균 2.14줄' },
]

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(1200)
for (let i = 0; i < 3; i++) { if (!(await p.locator('.sheet-mask').count())) break; await p.keyboard.press('Escape'); await p.waitForTimeout(400) }
await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click().catch(() => {})
await p.waitForTimeout(1000)
const 카드 = p.locator('.screen button, .screen [role="button"], .screen a').filter({ hasText: /[가-힣]/ })
const n = Math.min(await 카드.count(), 14)
for (let i = 0; i < n; i++) {
  await 카드.nth(i).click().catch(() => {}); await p.waitForTimeout(800)
  if (await p.locator('[data-coach="cook"]').count()) break
  await p.goBack().catch(() => {}); await p.waitForTimeout(600)
}
await p.locator('[data-coach="cook"]').first().click(); await p.waitForTimeout(1200)
for (let i = 0; i < 4; i++) {
  if (await p.locator('.cook-steptext').count()) break
  await p.locator('button, [role="button"]').filter({ hasText: /다음|시작/ }).last().click().catch(() => {}); await p.waitForTimeout(700)
}
if (!(await p.locator('.cook-steptext').count())) { console.error('⛔ 요리모드를 못 열었다 — 아무것도 못 찍는다'); await b.close(); srv.close(); process.exit(1) }
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400)

// ⚠️ 스스로 검사 — 지금 앱이 «정말» 귀염체 38px 획 1.6px 인가(아니면 딴 화면을 찍는 것이다)
const 지금 = await p.evaluate(() => {
  const cs = getComputedStyle(document.querySelector('.cook-steptext'))
  return { 글씨체: cs.fontFamily.split(',')[0].replace(/['"]/g, ''), 크기: cs.fontSize, 획: cs.webkitTextStrokeWidth, 폭최대: cs.maxWidth }
})
console.log(`🧪 지금 앱 = ${지금.글씨체} ${지금.크기} · 획 ${지금.획} · max-width ${지금.폭최대}`)
if (지금.글씨체 !== 'Gaegu' || 지금.크기 !== '38px' || 지금.획 !== '1.6px') {
  console.error('⛔ 앱이 바라던 값이 아니다 — 이 판으로 판정하면 안 된다'); await b.close(); srv.close(); process.exit(1)
}

const 컷 = []
for (const c of 후보들) for (const t of 표본) {
  await p.evaluate(({ w, 글 }) => {
    const el = document.querySelector('.cook-steptext')
    el.style.maxWidth = w ? `${w}px` : 'none'
    el.textContent = 글
  }, { w: c.w, 글: t.글 })
  await p.waitForTimeout(250)
  const 줄 = await p.evaluate(() => {
    const el = document.querySelector('.cook-steptext')
    const r = document.createRange(); r.selectNodeContents(el)
    return [...r.getClientRects()].filter((x) => x.width > 0.5 && x.height > 1).length
  })
  const 파일 = `w${c.w || 'now'}-${t.id}.png`
  await p.locator('.cook-body').screenshot({ path: join(OUT, 파일) })
  컷.push({ 폭: c.w, 표본: t.id, 파일, 줄 })
  console.log(`  · ${String(c.w || '지금').padStart(4)}px · ${t.이름.padEnd(20)} → ${줄}줄`)
}

// ＋ STEP 줄 A/B (따로 묻는 것)
const step컷 = []
for (const [id, css] of [['keep', ''], ['gaegu', `.cook-stepno { font-family: 'Gaegu', sans-serif !important; font-weight: 700 !important; }`]]) {
  await p.evaluate(({ css, 글 }) => {
    document.getElementById('_sn')?.remove()
    if (css) { const el = document.createElement('style'); el.id = '_sn'; el.textContent = css; document.head.appendChild(el) }
    const e = document.querySelector('.cook-steptext'); e.style.maxWidth = '580px'; e.textContent = 글
  }, { css, 글: 표본[1].글 })
  await p.waitForTimeout(400)
  const 파일 = `step-${id}.png`
  await p.locator('.cook-body').screenshot({ path: join(OUT, 파일) })
  step컷.push({ id, 파일 })
}

await ctx.close(); await b.close(); srv.close()

// ── 판 만들기 ──────────────────────────────────────────────
const b64 = (f) => `data:image/png;base64,${readFileSync(join(OUT, f)).toString('base64')}`
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

const 후보칸 = 후보들.map((c) => {
  const 셋 = 표본.map((t) => {
    const v = 컷.find((x) => x.폭 === c.w && x.표본 === t.id)
    return `<figure><figcaption><span>${esc(t.이름)}</span> <b>${v.줄}줄</b></figcaption><img src="${b64(v.파일)}" alt="${esc(t.이름)} — ${v.줄}줄"></figure>`
  }).join('')
  return `<section class="cand${c.w === 580 ? ' here' : ''}">
    <h3>${esc(c.이름.replace(' ⭐지금 넣어 둔 값', ''))}${c.w === 580 ? '<span class="tag">지금 넣어 둔 값</span>' : ''}</h3>
    <p class="sub">${esc(c.설명).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</p>
    <div class="shots">${셋}</div>
    <div class="pick" data-q="폭">
      <button data-v="${esc(c.이름)}|좋다">이게 좋다</button>
      <button data-v="${esc(c.이름)}|아니다">아니다</button>
    </div>
  </section>`
}).join('')

const html = `<title>패드 가로 글줄 폭 고르기</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gaegu:wght@700&family=Gowun+Dodum&display=swap">
<style>
/* 🎨 색·글씨체를 «앱에서 그대로» 가져왔다 — 판이 앱을 흉내 내면 조용히 어긋난다(절대원칙 30).
   크림 바탕·따뜻한 먹색·「다음」 단추의 파랑, 그리고 지금 판정 중인 그 손글씨(귀염체)를 제목에 쓴다. */
:root{
  --bg:#f2efe8; --card:#fffdf9; --ink:#332c22; --muted:#8b7f6e;
  --line:#e3dccf; --accent:#5d7fa8; --accent-ink:#fffdf9; --star:#b8763a;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --bg:#1c1a17; --card:#252220; --ink:#efe9df; --muted:#a1958a;
  --line:#3a352e; --accent:#93b3d8; --accent-ink:#1c1a17; --star:#dda26a;
}}
:root[data-theme="dark"]{
  --bg:#1c1a17; --card:#252220; --ink:#efe9df; --muted:#a1958a;
  --line:#3a352e; --accent:#93b3d8; --accent-ink:#1c1a17; --star:#dda26a;
}
*{box-sizing:border-box}
body{background:var(--bg);color:var(--ink);
  font:16px/1.7 "Gowun Dodum","Apple SD Gothic Neo","Malgun Gothic",sans-serif;
  padding:22px 16px 64px;max-width:760px;margin:0 auto}
h1{font-family:Gaegu,"Gowun Dodum",sans-serif;font-size:34px;line-height:1.25;margin:0 0 4px;text-wrap:balance;letter-spacing:.01em}
h2{font-family:Gaegu,"Gowun Dodum",sans-serif;font-size:26px;margin:38px 0 8px;padding-top:18px;border-top:1px solid var(--line);text-wrap:balance}
h3{font-size:17px;font-weight:700;margin:0}
.lede{color:var(--muted);font-size:14.5px;margin:0 0 18px}
.q{background:var(--card);border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:4px 13px 13px 4px;padding:14px 16px;margin:16px 0}
.q i{font-style:normal;color:var(--ink)}
.sub{color:var(--muted);font-size:14px;margin:2px 0 12px}
.shots{display:flex;gap:10px;overflow-x:auto;padding-bottom:6px;scroll-snap-type:x proximity}
figure{margin:0;flex:0 0 auto;width:250px;scroll-snap-align:start}
figure img{width:100%;border:1px solid var(--line);border-radius:9px;display:block;background:var(--bg)}
figcaption{font-size:12.5px;color:var(--muted);margin-bottom:6px;display:flex;justify-content:space-between;gap:8px}
figcaption b{color:var(--ink);font-variant-numeric:tabular-nums}
.cand{background:var(--card);border:1px solid var(--line);border-radius:13px;padding:15px;margin:14px 0}
.cand.here{border-color:var(--accent)}
.tag{display:inline-block;font-size:11.5px;letter-spacing:.06em;color:var(--accent-ink);background:var(--accent);padding:2px 8px;border-radius:999px;vertical-align:2px;margin-left:6px}
.pick{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.pick button{flex:1;min-width:112px;padding:11px 8px;border:1.5px solid var(--line);border-radius:10px;background:transparent;color:var(--ink);font:inherit;font-size:15px;cursor:pointer}
.pick button:hover{border-color:var(--accent)}
.pick button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.pick button.on{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.ab{display:flex;gap:10px;overflow-x:auto;padding-bottom:6px}
.scroller{overflow-x:auto}
table{border-collapse:collapse;width:100%;min-width:430px;font-size:14px;margin:10px 0;font-variant-numeric:tabular-nums}
th,td{border-bottom:1px solid var(--line);padding:7px 9px;text-align:right}
th:first-child,td:first-child{text-align:left}
th{color:var(--muted);font-weight:600;font-size:12.5px;letter-spacing:.04em}
tr.here td{color:var(--star);font-weight:700}
#copy{position:sticky;bottom:12px;width:100%;padding:15px;border:none;border-radius:12px;background:var(--accent);color:var(--accent-ink);font:inherit;font-size:17px;cursor:pointer;margin-top:24px}
#copy:focus-visible{outline:2px solid var(--star);outline-offset:2px}
#out{width:100%;min-height:118px;margin-top:10px;font:13px/1.6 ui-monospace,SFMono-Regular,monospace;border:1px solid var(--line);border-radius:10px;padding:11px;background:var(--card);color:var(--ink)}
.note{font-size:14px;color:var(--muted)}
</style>
<h1>패드 가로, 글줄을 어디서 꺾을까</h1>
<p class="lede">아래 그림은 <b>지금 앱 그대로</b>다 — 귀염체 38px · 획 1.6px. 글줄이 꺾이는 폭만 갈아끼워 찍었다.</p>

<div class="q">
  <i>“패드 가로 요리모드에서 글자가 너무 한줄로 길어. 이건 적당하게 두 줄로 할 순 없어?”</i>
  <p class="note" style="margin:8px 0 0">964걸음을 전수로 재니 <b>80.7%가 한 줄</b>이었다. 말이 맞다.<br>
  지금 <b>580px</b> 로 넣어 뒀다 — 다른 게 나으면 골라 주면 한 줄만 고친다.</p>
</div>

<div class="scroller">
<table>
<thead><tr><th>글줄 폭</th><th>1줄</th><th>2줄</th><th>3줄</th><th>4줄+</th><th>평균</th><th>스크롤</th></tr></thead>
<tbody>
<tr><td>지금 1128</td><td>80.7%</td><td>19.2%</td><td>0.1%</td><td>0%</td><td>1.19줄</td><td>0</td></tr>
<tr><td>760</td><td>50.6%</td><td>43.3%</td><td>6.0%</td><td>0.1%</td><td>1.56줄</td><td>0</td></tr>
<tr><td>700</td><td>45.2%</td><td>45.3%</td><td>9.0%</td><td>0.4%</td><td>1.65줄</td><td>0</td></tr>
<tr><td>640</td><td>39.5%</td><td>45.7%</td><td>13.7%</td><td>1.0%</td><td>1.76줄</td><td>0</td></tr>
<tr class="here"><td>580</td><td>29.3%</td><td>50.0%</td><td>17.5%</td><td>3.2%</td><td>1.95줄</td><td>0</td></tr>
<tr><td>520</td><td>21.9%</td><td>50.0%</td><td>20.9%</td><td>7.3%</td><td>2.14줄</td><td>0</td></tr>
</tbody>
</table>
</div>
<p class="note">어느 값에서도 <b>스크롤 0 · 가로 넘침 0</b> — 제일 긴 걸음(78자)도 580px 에서 다 들어간다.<br>
＋ 둘째 줄이 「비벼요.」 하나만 남는 <b>외톨이는 224 → 0개</b>로 없앴다(줄을 고르게 나눈다).</p>

<h2>① 어느 폭이 좋아?</h2>
${후보칸}

<h2>② STEP 줄도 손글씨로 갈까?</h2>
<p class="sub">두께 판에서는 이 줄까지 손글씨로 찍어 보여줬는데, 넣고 열어 보니 <b>이 줄만 유난히 흐렸다</b>.
재보니 <b>60.4% 얇아진다</b>(잉크 19.2 → 7.6). 획을 더해도 −38%라 못 되돌려서 <b>원래 글씨체로 되돌려 뒀다</b>.</p>
<div class="ab">
  <figure><figcaption><span>지금 — 원래 글씨체</span> <b>넣어 둔 것</b></figcaption><img src="${b64(step컷[0].파일)}" alt="STEP 줄이 원래 글씨체인 화면"></figure>
  <figure><figcaption><span>손글씨로 바꾸면</span> <b>−60.4%</b></figcaption><img src="${b64(step컷[1].파일)}" alt="STEP 줄이 손글씨인 화면"></figure>
</div>
<div class="pick" data-q="STEP">
  <button data-v="지금 그대로">지금 그대로</button>
  <button data-v="손글씨로">손글씨로</button>
</div>

<button id="copy">📋 고른 것 복사하기</button>
<textarea id="out" readonly placeholder="고르면 여기에 글자가 나와요. 복사가 안 되면 여기 글자를 길게 눌러 복사하세요."></textarea>
<script>
var KEY='hankki:판:패드가로폭:0901'
function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}}
function save(s){try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}}
var state=load()
document.querySelectorAll('.pick').forEach(function(row){
  var q=row.dataset.q
  row.querySelectorAll('button').forEach(function(btn){
    var v=btn.dataset.v, key=q+'::'+(q==='폭'?v.split('|')[0]:'')
    if(q==='폭'){ if(state[v.split('|')[0]]===v.split('|')[1]) btn.classList.add('on') }
    else if(state[q]===v) btn.classList.add('on')
    btn.onclick=function(){
      if(q==='폭'){var name=v.split('|')[0],val=v.split('|')[1]
        row.querySelectorAll('button').forEach(function(x){x.classList.remove('on')})
        btn.classList.add('on'); state[name]=val}
      else{row.querySelectorAll('button').forEach(function(x){x.classList.remove('on')})
        btn.classList.add('on'); state[q]=v}
      save(state); render()
    }
  })
})
function render(){
  var L=['🖥 패드 가로 글줄 폭 판정 (2026-09-01)','']
  var 고른=[]
  Object.keys(state).forEach(function(k){ if(k!=='STEP'&&state[k]==='좋다') 고른.push(k) })
  L.push('· 폭 = '+(고른.length?고른.join(' / '):'(아직 안 골랐다)'))
  var 아니다=Object.keys(state).filter(function(k){return k!=='STEP'&&state[k]==='아니다'})
  if(아니다.length) L.push('· 아니다 = '+아니다.join(' / '))
  L.push('· STEP 줄 = '+(state.STEP||'(아직 안 골랐다)'))
  document.getElementById('out').value=L.join('\\n')
}
render()
document.getElementById('copy').onclick=function(){
  var ta=document.getElementById('out')
  var ok=false
  try{ navigator.clipboard.writeText(ta.value); ok=true }catch(e){}
  // ⛔ clipboard 는 «성공으로 resolve 되고도» 실제 복사가 안 되는 폰이 있다(v10.97) → 글자를 골라 준다
  ta.focus(); ta.select()
  try{ var r=document.createRange(); r.selectNodeContents(ta); var s=getSelection(); s.removeAllRanges(); s.addRange(r) }catch(e){}
  this.textContent = ok ? '✅ 복사했어요 (안 됐으면 아래 글자를 길게 눌러 복사)' : '아래 글자를 길게 눌러 복사하세요'
}
</script>`

const 판 = join(OUT, '판.html')
writeFileSync(판, html)
console.log(`\n📄 ${판}`)
