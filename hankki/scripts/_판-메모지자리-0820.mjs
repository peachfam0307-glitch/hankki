// 📸 메모지를 «어디에» 띄우나 — 재료 준비만 vs 조리 단계까지 (2026-08-20)
//
// 📮 창업자 물음 = *"요리모드에서 포스트잇을 **계속 띄울건지 재료에만 띄울건지**도 결정을 해야하거든.
//    **계속띄운다면 꼬르곰이랑 어울려야해.**"*
//
// 🔢 실물로 확인한 요리 모드 구조 (`src/screens/CookScreen.jsx`)
//    · `i=0`  재료 준비 — 계량·손질 → **메모지(지금 여기)** → 재료 체크 → 안내   ⛔꼬르곰 «없다»
//    · `i>=1` 조리 단계 — **꼬르곰 104px** → STEP N → 단계 글 → 타이머            ✅꼬르곰 있다
//    ⭐ 그래서 창업자 말이 구조를 정확히 짚었다 —
//       계속 띄우면 **꼬르곰과 한 화면에** 놓이고, 재료에만 띄우면 «한 번도 안 만난다».
//
// ✅ 창업자 2차 판정 = 종이 둘로 좁혀졌다
//    · `cout01`  노랑 프릴 ＋ 파란 장미  = ⚡**확 튄다**   (*"진짜 튀는데 나쁘지 않고"*)
//    · `s3_5_01` 파란 홈질 ＋ 나무 숟가락 = 🌿**무난하다** (*"우리앱이랑 잘 어울려"*)
//
// ⛔ 글씨체는 여기서 «안» 본다 — 아직 못 정했고(창업자 *"글씨체는 못정함"*),
//    자리와 글씨를 한 판에서 같이 물으면 둘 다 흐려진다. 연필체로 고정한다.
//
// ⭐ 꼬르곰 종류는 «내가 고르지 않는다» — 단계를 넘겨보며 앱이 실제로 그린 그림을 읽어
//    서로 다른 것이 나오는 단계를 고른다(규칙 30 · 흉내가 아니라 그 값).
//
// ⛔ 판을 만들면 «열어서 눌러본다» — 2026-08-19 에 세미콜론 하나로 체크가 통째로 안 눌렸다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, basename } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const 컷폴더 = join(OUT, '표준컷')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4401, r))

const 종이들 = [
  ['cout01', '노랑 프릴 ＋ 파란 장미', '확 튄다'],
  ['s3_5_01', '파란 홈질 ＋ 나무 숟가락', '무난하다'],
]
const 글씨 = ["'Poor Story','Gowun Dodum',sans-serif", 400] // 연필체 고정

const 재기 = (k) => {
  const buf = readFileSync(join(컷폴더, `${k}.png`))
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
}
const 데이터 = (k) => 'data:image/png;base64,' + readFileSync(join(컷폴더, `${k}.png`)).toString('base64')

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 860 }, timezoneId: 'Asia/Seoul', deviceScaleFactor: 2 })

// 준비 — 어제 만들고 한 줄을 써 둔 상태
const p0 = await ctx.newPage()
await p0.addInitScript(SEED_COACH_SEEN)
await p0.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1') })
await p0.goto('http://127.0.0.1:4401/', { waitUntil: 'networkidle' })
await p0.waitForFunction(() => !!localStorage.getItem('hankki:v1'), null, { timeout: 15000 })
const 준비 = await p0.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1'))
  const r = s.recipes[0]
  r.cooked = 1; r.cookedAt = Date.now() - 864e5
  s.diary = [{ id: 'd1', recipeId: r.id, title: r.title, source: r.source, at: Date.now() - 864e5, rating: 4, note: '간장 반만 · 마지막에 참기름', photo: null }]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  return { 제목: r.title, 단계수: (r.steps || []).length, 단계글: r.steps || [] }
})
await p0.close()

// 🎨 종이를 얹는다 — 앱이 정한 «폭»은 그대로 두고 비율만 종이에 맞춘다
const 얹기 = async (p, 종이키) => {
  const { w, h } = 재기(종이키)
  await p.evaluate(({ url, w, h, fam, weight }) => {
    // ⛔⛔ querySelector 는 «첫째»를 잡는다 — 화면을 쌓으면 이전 화면이 DOM 에 남아 «화면 밖» 것을 잡는다
    const els = [...document.querySelectorAll('.memo-note')]
    const el = els[els.length - 1]
    if (!el) return
    el.classList.add('paper')
    el.style.setProperty('background-image', `url(${url})`, 'important')
    el.style.setProperty('background-size', '100% 100%', 'important')
    el.style.setProperty('background-repeat', 'no-repeat', 'important')
    el.style.aspectRatio = `${w}/${h}`
    el.style.display = 'flex'
    el.style.alignItems = 'center'
    el.style.justifyContent = 'center'
    let inner = el.querySelector('.memo-inner')
    if (!inner) {
      inner = document.createElement('div')
      inner.className = 'memo-inner'
      // ⛔ 손글씨는 고딕보다 넓다 — 안전지대를 62% 로 좁히고 머리줄은 한 줄로 묶는다
      inner.style.cssText = 'width:62%;text-align:center;overflow:hidden'
      while (el.firstChild) inner.appendChild(el.firstChild)
      el.appendChild(inner)
    }
    const head = inner.querySelector('.memo-note-head')
    if (head) { head.style.fontSize = '9.5px'; head.style.whiteSpace = 'nowrap'; head.style.justifyContent = 'center' }
    const body = inner.querySelector('.memo-note-body')
    if (body) {
      body.style.fontFamily = fam
      body.style.fontWeight = String(weight)
      body.style.fontSize = '1.06em'
      body.style.lineHeight = '1.22'
      body.style.marginTop = '1px'
    }
  }, { url: 데이터(종이키), w, h, fam: 글씨[0], weight: 글씨[1] })
  await p.waitForTimeout(320)
}

// 📌 조리 단계에 메모지를 «심는다» — 앱엔 없는 기능이라 시안으로만 만들어 본다
const 심기 = async (p, html) => {
  await p.evaluate((h) => {
    const body = [...document.querySelectorAll('.cook-body')].pop()
    if (!body) return
    const old = body.querySelector('.memo-심음')
    if (old) old.remove()
    const d = document.createElement('div')
    d.className = 'memo-심음'
    d.style.cssText = 'width:100%;max-width:460px;margin:18px auto 0'
    d.innerHTML = h
    body.appendChild(d)
  }, html)
  await p.waitForTimeout(200)
}

const 화면열기 = async () => {
  const p = await ctx.newPage()
  await p.addInitScript(SEED_COACH_SEEN)
  await p.goto('http://127.0.0.1:4401/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(700)
  await p.click(`text=${준비.제목}`)
  await p.waitForSelector('.memo-note', { timeout: 10000 })
  await p.click('text=요리 시작')
  await p.waitForSelector('.memo-note', { timeout: 10000 })
  return p
}

// ── ① 꼬르곰이 «실제로» 무엇을 그리는지 단계마다 읽는다 ──────────────
//    ⛔ 내가 정규식을 흉내내지 않는다 — 앱이 그린 값을 읽는다(규칙 30)
const 정탐 = await 화면열기()
const 곰지도 = []
for (let k = 1; k <= 준비.단계수; k++) {
  await 정탐.click(`.cp-seg[aria-label="${k}단계"]`)
  await 정탐.waitForTimeout(220)
  const src = await 정탐.evaluate(() => {
    const img = [...document.querySelectorAll('.buddy img')].pop()
    return img ? img.getAttribute('src') : null
  })
  if (src) 곰지도.push({ 단계: k, 곰: basename(src).replace(/-[a-zA-Z0-9]+\.png$/, '').replace(/\.png$/, '') })
}
await 정탐.close()

// 서로 «다른» 꼬르곰이 나오는 단계를 앞에서부터 최대 셋
const 본것 = new Set()
const 고른단계 = []
for (const g of 곰지도) {
  if (본것.has(g.곰)) continue
  본것.add(g.곰); 고른단계.push(g)
  if (고른단계.length >= 3) break
}
const 곰이름 = { gom_pot: '냄비 꼬르곰', gom_pan: '팬 꼬르곰', gom_dough: '반죽 꼬르곰', gom_pasta: '면 꼬르곰', gom_carrot: '당근 꼬르곰', duo_cooking: '꼬르곰＋펭펭' }
const 곰말 = (k) => 곰이름[k] || k
console.log('🐻 단계별 꼬르곰 =', 곰지도.map((g) => `${g.단계}:${g.곰}`).join(' '))
console.log('🐻 고른 단계 =', 고른단계.map((g) => `STEP${g.단계}(${g.곰})`).join(' · '))

// ── ② 재료 준비 화면 — 지금 자리 ─────────────────────────────
const 재료컷 = []
for (const [종이키, 설명, 성격] of 종이들) {
  const p = await 화면열기()
  await 얹기(p, 종이키)
  const 곳 = `${OUT}/자리-재료-${종이키}.png`
  await p.screenshot({ path: 곳, clip: { x: 0, y: 96, width: 390, height: 640 } })
  재료컷.push({ 종이키, 설명, 성격, 곳 })
  await p.close()
}

// ── ③ 조리 단계 화면 — 계속 띄우면 ────────────────────────────
const 단계컷 = []
// ⓐ 지금(메모 없음) — 견줄 바탕이 있어야 «달라진 것»이 보인다
{
  const p = await 화면열기()
  const g = 고른단계[0]
  await p.click(`.cp-seg[aria-label="${g.단계}단계"]`)
  await p.waitForTimeout(300)
  const 곳 = `${OUT}/자리-단계-없음.png`
  await p.screenshot({ path: 곳, clip: { x: 0, y: 96, width: 390, height: 640 } })
  단계컷.push({ 종이키: '없음', 설명: '지금 그대로 — 조리 단계엔 안 뜬다', 단계: g.단계, 곰: g.곰, 곳 })
  await p.close()
}
for (const [종이키, 설명, 성격] of 종이들) {
  for (const g of 고른단계) {
    const p = await 화면열기()
    await 얹기(p, 종이키)
    // 재료 준비 화면에서 «완성된» 메모지를 통째로 떠 온다
    const html = await p.evaluate(() => {
      const el = [...document.querySelectorAll('.memo-note')].pop()
      return el ? el.outerHTML : ''
    })
    await p.click(`.cp-seg[aria-label="${g.단계}단계"]`)
    await p.waitForTimeout(300)
    await 심기(p, html)
    const 곳 = `${OUT}/자리-단계-${종이키}-${g.단계}.png`
    await p.screenshot({ path: 곳, clip: { x: 0, y: 96, width: 390, height: 640 } })
    단계컷.push({ 종이키, 설명, 성격, 단계: g.단계, 곰: g.곰, 곳 })
    await p.close()
  }
}

await ctx.close(); await b.close(); srv.close()

// ── 판 만들기 ────────────────────────────────────
const 파일 = (f) => 'data:image/png;base64,' + readFileSync(f).toString('base64')

const 재료줄 = 재료컷.map((c) => `
  <figure class="shot">
    <img src="${파일(c.곳)}" alt="">
    <figcaption><b>${c.성격}</b> · ${c.설명}</figcaption>
  </figure>`).join('')

const 단계줄 = 단계컷.map((c) => `
  <figure class="shot${c.종이키 === '없음' ? ' base' : ''}">
    <img src="${파일(c.곳)}" alt="">
    <figcaption>${c.종이키 === '없음' ? '<b>지금</b> · 조리 단계엔 안 뜬다' : `<b>${c.성격}</b> · STEP ${c.단계} · ${곰말(c.곰)}`}</figcaption>
  </figure>`).join('')

const html = `<title>메모지를 어디에 띄울까</title>
<style>
  :root{
    --ink:#3a2c20; --sub:#7b6a58; --bg:#faf7f2; --card:#fffdf9;
    --line:#e6ddd0; --pin:#b6543f; --calm:#5b7f8f; --pop:#d9a520;
  }
  @media (prefers-color-scheme: dark){
    :root:not([data-theme="light"]){
      --ink:#f0e7dc; --sub:#b3a595; --bg:#1c1815; --card:#262019;
      --line:#3d342b; --pin:#e08a72; --calm:#8fb6c6; --pop:#e8c25a;
    }
  }
  :root[data-theme="dark"]{
    --ink:#f0e7dc; --sub:#b3a595; --bg:#1c1815; --card:#262019;
    --line:#3d342b; --pin:#e08a72; --calm:#8fb6c6; --pop:#e8c25a;
  }
  body{background:var(--bg);color:var(--ink);font-family:'Gowun Dodum','Apple SD Gothic Neo',sans-serif;
       margin:0;padding:22px 16px 90px;line-height:1.62;-webkit-text-size-adjust:100%}
  .wrap{max-width:900px;margin:0 auto}
  h1{font-size:25px;margin:0 0 6px;letter-spacing:-.4px;text-wrap:balance}
  .sub{color:var(--sub);font-size:14.5px;margin:0 0 22px}
  h2{font-size:19px;margin:34px 0 4px;padding-top:16px;border-top:2px solid var(--line);text-wrap:balance}
  .h2sub{color:var(--sub);font-size:13.5px;margin:0 0 14px}
  .say{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--pin);
       border-radius:0 12px 12px 0;padding:12px 14px;margin:0 0 20px;font-size:14px}
  .say b{color:var(--pin)}
  .row{display:flex;gap:14px;overflow-x:auto;padding:4px 0 10px;scroll-padding-left:20px}
  .shot{margin:0;flex:0 0 auto;width:262px;background:var(--card);border:1px solid var(--line);
        border-radius:14px;overflow:hidden}
  .shot.base{border-style:dashed;opacity:.9}
  .shot img{width:100%;display:block}
  .shot figcaption{font-size:12.5px;color:var(--sub);padding:9px 11px;border-top:1px solid var(--line)}
  .shot figcaption b{color:var(--ink)}
  .ask{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px 16px 6px;margin:22px 0}
  .ask h3{margin:0 0 3px;font-size:16px}
  .ask p{margin:0 0 12px;color:var(--sub);font-size:13.5px}
  .opts{display:flex;flex-wrap:wrap;gap:9px;margin-bottom:14px}
  .opt{border:2px solid var(--line);background:transparent;color:var(--ink);border-radius:999px;
       padding:9px 15px;font-size:14px;font-family:inherit;cursor:pointer;transition:.14s}
  .opt:hover{border-color:var(--sub)}
  .opt[aria-pressed="true"]{border-color:var(--pin);background:var(--pin);color:#fff;font-weight:700}
  .opt:focus-visible{outline:3px solid var(--pop);outline-offset:2px}
  .note{font-size:13px;color:var(--sub);background:var(--card);border:1px dashed var(--line);
        border-radius:11px;padding:11px 13px;margin:16px 0}
  .bar{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1px solid var(--line);
       padding:11px 16px;display:flex;gap:11px;align-items:center;justify-content:center}
  .copy{background:var(--pin);color:#fff;border:none;border-radius:999px;padding:12px 24px;
        font-size:15px;font-weight:700;font-family:inherit;cursor:pointer}
  .copy:focus-visible{outline:3px solid var(--pop);outline-offset:2px}
  .done{font-size:13.5px;color:var(--sub)}
  #out{white-space:pre-wrap;font-size:13px;background:var(--card);border:1px solid var(--line);
       border-radius:11px;padding:12px;margin-top:12px;display:none}
  @media (max-width:520px){ .shot{width:230px} h1{font-size:22px} }
</style>
<div class="wrap">
<h1>메모지를 어디에 띄울까</h1>
<p class="sub">종이는 네가 고른 둘로 좁혔어. 이제 <b>어디에 띄울지</b>부터 정하면 종이도 같이 정해져.</p>

<div class="say">
  📮 네가 한 말 — <b>“요리모드에서 포스트잇을 계속 띄울건지 재료에만 띄울건지도 결정을 해야하거든.
  계속띄운다면 꼬르곰이랑 어울려야해.”</b>
</div>

<div class="note">
  🔢 <b>요리 모드는 화면이 둘이야</b> (앱 코드를 열어서 확인했어)<br>
  · <b>재료 준비</b> — 계량·손질 → <b>메모지(지금 여기)</b> → 재료 체크 → 안내 &nbsp;·&nbsp; 꼬르곰 <b>없음</b><br>
  · <b>조리 단계</b> — <b>꼬르곰</b> → STEP N → 단계 글 → 타이머 &nbsp;·&nbsp; 꼬르곰 <b>있음</b><br>
  ⭐ 그래서 네 말이 정확했어 — <b>계속 띄우면 꼬르곰과 한 화면에 놓이고, 재료에만 띄우면 한 번도 안 만나.</b>
</div>

<h2>① 재료 준비 화면 — 지금 자리</h2>
<p class="h2sub">여기는 꼬르곰이 없어. 재료를 꺼내기 <b>직전</b>에 한 번 보여주는 자리야.</p>
<div class="row">${재료줄}</div>

<h2>② 조리 단계 화면 — 계속 띄우면</h2>
<p class="h2sub">단계마다 꼬르곰 아래에 붙어. 맨 왼쪽 점선이 <b>지금(안 띄움)</b>이고, 그 옆이 띄웠을 때야.</p>
<div class="row">${단계줄}</div>

<div class="ask">
  <h3>1. 어디에 띄울까?</h3>
  <p>계속 띄우면 안 놓치는 대신 단계마다 같은 종이가 되풀이돼.</p>
  <div class="opts" data-q="자리">
    <button class="opt" type="button" data-v="재료에만 (지금 그대로)">재료에만 (지금 그대로)</button>
    <button class="opt" type="button" data-v="조리 단계까지 계속">조리 단계까지 계속</button>
    <button class="opt" type="button" data-v="모르겠다">모르겠다</button>
  </div>

  <h3>2. 종이는 어느 쪽?</h3>
  <p>자주 뜨는 자리면 무난한 게 낫고, 한 번만 뜨면 튀어도 돼.</p>
  <div class="opts" data-q="종이">
    <button class="opt" type="button" data-v="노랑 (확 튄다)">노랑 (확 튄다)</button>
    <button class="opt" type="button" data-v="파랑 자수 (무난하다)">파랑 자수 (무난하다)</button>
    <button class="opt" type="button" data-v="모르겠다">모르겠다</button>
  </div>

  <h3>3. 꼬르곰이랑 어울려?</h3>
  <p>②번 사진들만 보고 답해줘. 어울리면 계속 띄워도 되는 거야.</p>
  <div class="opts" data-q="꼬르곰">
    <button class="opt" type="button" data-v="노랑이 어울린다">노랑이 어울린다</button>
    <button class="opt" type="button" data-v="파랑이 어울린다">파랑이 어울린다</button>
    <button class="opt" type="button" data-v="둘 다 별로다">둘 다 별로다</button>
  </div>
</div>

<div class="note">
  ✍️ <b>글씨체는 여기서 안 물어봐</b> — 아직 못 정했다고 했으니 연필체로 고정해뒀어.
  자리랑 글씨를 한꺼번에 물으면 둘 다 흐려져서, 자리가 정해지면 그때 글씨만 따로 볼게.
</div>
</div>

<div class="bar">
  <span class="done" id="done">고른 것 0 / 3</span>
  <button class="copy" type="button" id="copy">복사하기</button>
</div>
<pre id="out"></pre>

<script>
(function(){
  var KEY = 'hankki:메모지자리-0820';
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { saved = {}; }

  var groups = [].slice.call(document.querySelectorAll('.opts'));

  function paint(){
    var n = 0;
    groups.forEach(function(g){
      var q = g.getAttribute('data-q');
      [].slice.call(g.querySelectorAll('.opt')).forEach(function(btn){
        var on = saved[q] === btn.getAttribute('data-v');
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (saved[q]) n++;
    });
    document.getElementById('done').textContent = '고른 것 ' + n + ' / ' + groups.length;
  }

  groups.forEach(function(g){
    var q = g.getAttribute('data-q');
    [].slice.call(g.querySelectorAll('.opt')).forEach(function(btn){
      btn.addEventListener('click', function(){
        var v = btn.getAttribute('data-v');
        if (saved[q] === v) { delete saved[q]; } else { saved[q] = v; }
        try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {}
        paint();
      });
    });
  });
  paint();

  document.getElementById('copy').addEventListener('click', function(){
    var lines = ['메모지 자리 판정 (2026-08-20)'];
    var label = { 자리: '어디에 띄울까', 종이: '종이', 꼬르곰: '꼬르곰과 어울림' };
    groups.forEach(function(g){
      var q = g.getAttribute('data-q');
      lines.push('- ' + label[q] + ' : ' + (saved[q] || '(안 고름)'));
    });
    var text = lines.join('\\n');
    var out = document.getElementById('out');
    out.textContent = text;
    out.style.display = 'block';
    // ⛔ clipboard 는 «성공으로 resolve 되고도» 실제 복사가 안 되는 폰이 있다(v10.97 교훈)
    //    → 실패하든 성공하든 글자를 골라 준다. 길게 눌러 복사하면 된다.
    try {
      var r = document.createRange();
      r.selectNodeContents(out);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
    } catch (e) {}
    var say = document.getElementById('done');
    // ⭐ 기본은 «길게 눌러» — 진짜로 복사됐을 때만 바꾼다.
    //    ⛔ writeText 는 Promise 라 동기 try/catch 로는 못 잡는다. 그대로 두면
    //       ⑴실패해도 「복사했어」라고 거짓말하고 ⑵콘솔에 잡히지 않은 오류가 남는다.
    say.textContent = '아래 글자를 길게 눌러 복사해줘';
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function(){
          say.textContent = '복사했어 (안 되면 아래 글자를 길게 눌러)';
        }).catch(function(){});
      }
    } catch (e) {}
  });
})();
</script>`

const 낼판 = join(OUT, '메모지자리.html')
writeFileSync(낼판, html)
const mb = (Buffer.byteLength(html) / 1048576).toFixed(2)
console.log(`\n📸 재료 ${재료컷.length}컷 · 단계 ${단계컷.length}컷`)
console.log(`📄 ${낼판}  (${mb} MB)`)
