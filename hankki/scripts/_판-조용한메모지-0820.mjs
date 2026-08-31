// 🤍 앱에 «이미 있는» 조용한 메모지 — 장식 많은 라벨이 안 어울린다면 (2026-08-20)
//
// 📮 창업자 = *"하..생각보다 **디자인이 많이 들어간 라벨이 썩 잘어울리진 않네**"*
//
// ⭐⭐ 그 말이 맞는 근거 셋(내가 컷을 열어보고 잰 것)
//    ① **글이 진다** — 메모는 한 줄인데 꽃·숟가락·리본이 글자보다 크다
//    ② **키울수록 심해진다** — 240px 에선 장식이 작아 덜 보이는데 353px 이면 확 커진다
//    ③ **상세 화면엔 이만큼 장식적인 게 없다** — 크림 카드와 회색 칩뿐이라 메모지만 혼자 튄다
//
// ⭐⭐⭐ 그런데 **새로 뽑을 것도 없이 앱에 이미 있다.**
//    `Stickers.jsx` 의 `box_memo`(5) ＋ `box_dma`(5) = 10컷.
//    ⛔ 이건 아무거나 고른 게 아니라 **「글 상자」용으로 이미 걸러진 목록**이다 —
//       주석에 *"도장(dc_dma16)은 뺐다 — 손잡이가 커서 «글 자리가 거의 안 나온다»"* 라고 적혀 있다.
//       즉 **「글 쓸 자리가 나오는 종이」**만 남은 목록이고, 우리가 찾는 조건이 바로 그것이다.
//
// ⛔ 폭은 여기서 «안» 본다 — 353px(요리 모드와 같게)로 고정한다.
//    종이를 견주려면 커야 보이고, 폭은 따로 판이 있다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const 앱컷 = join(ROOT, 'src/assets/stickers/photo')
const 시안컷 = join(OUT, '표준컷')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4403, r))

// ✅ 앱에 이미 있는 것 — 「글 자리가 나오는」 걸로 이미 걸러진 목록
const 종이들 = [
  ['dgn02', '앱', '일기 메모지'],
  ['dgn05', '앱', '일기 메모지'],
  ['dgn08', '앱', '일기 메모지'],
  ['dgn10', '앱', '일기 메모지'],
  ['dgn12', '앱', '일기 메모지'],
  ['dc_dma01', '앱', '메모·라벨 (지금 기본값)'],
  ['dc_dma05', '앱', '메모·라벨'],
  ['dc_dma06', '앱', '메모·라벨'],
  ['dc_dma11', '앱', '메모·라벨'],
  ['dc_dma14', '앱', '메모·라벨'],
  // 🔍 견줄 바탕 — 창업자가 「안 어울린다」고 한 그것
  ['s3_5_01', '시안', '네 시안 · 파란 자수 (견줄 바탕)'],
]
const 글씨 = ["'Poor Story','Gowun Dodum',sans-serif", 400] // 연필체
// 📐 폭 = **자리 꽉** (창업자 판정 2026-08-20)
//    📮 *"레시피상세에 넣을때 **자리보다 작으니까 이상한것 같아. 자리크기에 딱 맞게** 들어가는게 더 좋을 듯해"*
//    ⛔⛔ 내가 이 갈래를 «내 판단으로» 뺐었다 — *"패드 가로 652px 은 메모 한 줄에 너무 크다"*.
//       그건 미감 판단이고 **정할 사람은 창업자다**(규칙 11). 되살렸다.
const 폭 = null // null = 자리를 꽉 (폰에서 350px)

const 곳찾기 = (k) => {
  const a = join(앱컷, `${k}.png`)
  if (existsSync(a)) return a
  const b = join(시안컷, `${k}.png`)
  if (existsSync(b)) return b
  throw new Error(`컷을 못 찾았다: ${k}`)
}
const 재기 = (k) => {
  const buf = readFileSync(곳찾기(k))
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
}
const 데이터 = (k) => 'data:image/png;base64,' + readFileSync(곳찾기(k)).toString('base64')

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, timezoneId: 'Asia/Seoul', deviceScaleFactor: 2 })

// 준비 — 어제 만들고 한 줄을 써 둔 상태
const p0 = await ctx.newPage()
await p0.addInitScript(SEED_COACH_SEEN)
await p0.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
await p0.goto('http://127.0.0.1:4403/', { waitUntil: 'networkidle' })
await p0.waitForFunction(() => !!localStorage.getItem('hankki:v1'), null, { timeout: 15000 })
const 제목 = await p0.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1'))
  const r = s.recipes[0]
  r.cooked = 1; r.cookedAt = Date.now() - 864e5
  s.diary = [{ id: 'd1', recipeId: r.id, title: r.title, source: r.source, at: Date.now() - 864e5, rating: 4, note: '간장 반만 · 마지막에 참기름', photo: null }]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  return r.title
})
await p0.close()

const 얹기 = async (p, 종이키) => {
  const { w, h } = 재기(종이키)
  await p.evaluate(({ url, w, h, fam, weight, 폭 }) => {
    // ⛔⛔ querySelector 는 «첫째»를 잡는다 — 쌓인 화면의 «화면 밖» 것을 잡지 않도록 마지막을 쓴다
    const el = [...document.querySelectorAll('.memo-note')].pop()
    if (!el) return
    const 통 = el.parentElement
    통.style.display = 'block'
    통.style.width = '100%'
    if (폭) 통.style.maxWidth = `${폭}px`   // 폭이 null 이면 자리를 꽉 쓴다
    통.style.margin = '18px auto 0'
    el.style.width = '100%'

    el.classList.add('paper')
    el.style.setProperty('background-image', `url(${url})`, 'important')
    el.style.setProperty('background-size', '100% 100%', 'important')
    el.style.setProperty('background-repeat', 'no-repeat', 'important')
    el.style.aspectRatio = `${w}/${h}`
    el.style.display = 'flex'
    el.style.alignItems = 'center'
    el.style.justifyContent = 'center'
    el.style.containerType = 'inline-size'
    let inner = el.querySelector('.memo-inner')
    if (!inner) {
      inner = document.createElement('div')
      inner.className = 'memo-inner'
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
      body.style.fontSize = 'clamp(13px, 4.6cqw, 21px)'
      body.style.lineHeight = '1.24'
      body.style.marginTop = '1px'
    }
  }, { url: 데이터(종이키), w, h, fam: 글씨[0], weight: 글씨[1], 폭 })
  await p.waitForTimeout(340)
}

const 컷들 = []
for (const [종이키, 갈래, 설명] of 종이들) {
  const p = await ctx.newPage()
  await p.addInitScript(SEED_COACH_SEEN)
  await p.goto('http://127.0.0.1:4403/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(700)
  await p.click(`text=${제목}`)
  await p.waitForSelector('.memo-note', { timeout: 10000 })
  await 얹기(p, 종이키)

  // 📜 메모지를 «화면 가운데»로 — 하단 버튼(fixed)이 덮지 않게
  await p.evaluate(() => {
    const el = [...document.querySelectorAll('.memo-note')].pop()
    if (el) el.scrollIntoView({ block: 'center' })
  })
  await p.waitForTimeout(400)
  const 잰값 = await p.evaluate(() => {
    const el = [...document.querySelectorAll('.memo-note')].pop()
    const r = el.getBoundingClientRect()
    return { 폭: Math.round(r.width), 높이: Math.round(r.height) }
  })
  const clip = await p.evaluate(() => {
    const el = [...document.querySelectorAll('.memo-note')].pop()
    const r = el.getBoundingClientRect()
    const 위 = Math.max(0, Math.round(r.top - 210))
    const 아래 = Math.min(window.innerHeight, Math.round(r.bottom + 210))
    return { x: 0, y: 위, width: window.innerWidth, height: Math.max(80, 아래 - 위) }
  })
  const 곳 = `${OUT}/조용-${종이키}.png`
  await p.screenshot({ path: 곳, clip })
  컷들.push({ 종이키, 갈래, 설명, 곳, ...잰값 })
  console.log(`  ${갈래} · ${종이키} → ${잰값.폭}×${잰값.높이}px`)
  await p.close()
}
await ctx.close(); await b.close(); srv.close()

// ── 판 만들기 ────────────────────────────────────
const 파일 = (f) => 'data:image/png;base64,' + readFileSync(f).toString('base64')
// 📐 포스트잇은 «정사각형에 가깝다» — 가로÷세로가 1 근처면 포스트잇, 1.8 넘으면 라벨·배너다
const 비율 = (c) => c.폭 / c.높이
const 꼴 = (r) => (r <= 1.35 ? ['포스트잇', 'ok'] : r <= 1.7 ? ['조금 길다', 'mid'] : ['길쭉 · 라벨 모양', 'bad'])
const 줄 = (갈래) => 컷들.filter((c) => c.갈래 === 갈래)
  .sort((a, x) => 비율(a) - 비율(x))
  .map((c) => {
    const r = 비율(c)
    const [말, 급] = 꼴(r)
    return `
  <figure class="shot${c.갈래 === '시안' ? ' base' : ''}">
    <img src="${파일(c.곳)}" alt="">
    <figcaption><b>${c.종이키}</b> <span class="tag ${급}">${말}</span><br>
      <span>가로÷세로 <b>${r.toFixed(2)}</b> · ${c.폭}×${c.높이}px · ${c.설명}</span></figcaption>
  </figure>`
  }).join('')

const html = `<title>조용한 메모지 고르기</title>
<style>
  :root{
    --ink:#3a2c20; --sub:#7b6a58; --bg:#faf7f2; --card:#fffdf9;
    --line:#e6ddd0; --pin:#b6543f; --pop:#d9a520;
  }
  @media (prefers-color-scheme: dark){
    :root:not([data-theme="light"]){
      --ink:#f0e7dc; --sub:#b3a595; --bg:#1c1815; --card:#262019;
      --line:#3d342b; --pin:#e08a72; --pop:#e8c25a;
    }
  }
  :root[data-theme="dark"]{
    --ink:#f0e7dc; --sub:#b3a595; --bg:#1c1815; --card:#262019;
    --line:#3d342b; --pin:#e08a72; --pop:#e8c25a;
  }
  body{background:var(--bg);color:var(--ink);font-family:'Gowun Dodum','Apple SD Gothic Neo',sans-serif;
       margin:0;padding:22px 16px 90px;line-height:1.62;-webkit-text-size-adjust:100%}
  .wrap{max-width:960px;margin:0 auto}
  h1{font-size:25px;margin:0 0 6px;letter-spacing:-.4px;text-wrap:balance}
  .sub{color:var(--sub);font-size:14.5px;margin:0 0 22px}
  h2{font-size:19px;margin:34px 0 4px;padding-top:16px;border-top:2px solid var(--line)}
  .h2sub{color:var(--sub);font-size:13.5px;margin:0 0 14px}
  .say{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--pin);
       border-radius:0 12px 12px 0;padding:12px 14px;margin:0 0 18px;font-size:14px}
  .say b{color:var(--pin)}
  .note{font-size:13.5px;color:var(--sub);background:var(--card);border:1px dashed var(--line);
        border-radius:11px;padding:11px 13px;margin:16px 0}
  .row{display:flex;gap:14px;overflow-x:auto;padding:4px 0 10px;scroll-padding-left:20px}
  .shot{margin:0;flex:0 0 auto;width:280px;background:var(--card);border:1px solid var(--line);
        border-radius:14px;overflow:hidden}
  .shot.base{border-style:dashed;opacity:.94}
  .shot img{width:100%;display:block}
  .shot figcaption{font-size:12.5px;color:var(--sub);padding:9px 11px;border-top:1px solid var(--line);line-height:1.5}
  .shot figcaption b{color:var(--ink)}
  .tag{display:inline-block;border-radius:999px;padding:1px 8px;font-size:11.5px;margin-left:4px}
  .tag.ok{background:#dfe9df;color:#33512f}
  .tag.mid{background:#efe5cf;color:#6a5424}
  .tag.bad{background:#f0dcd6;color:#7d3a2a}
  @media (prefers-color-scheme: dark){
    :root:not([data-theme="light"]) .tag.ok{background:#2c3d2a;color:#bcd6b6}
    :root:not([data-theme="light"]) .tag.mid{background:#413623;color:#e0c98d}
    :root:not([data-theme="light"]) .tag.bad{background:#432b24;color:#eab3a2}
  }
  :root[data-theme="dark"] .tag.ok{background:#2c3d2a;color:#bcd6b6}
  :root[data-theme="dark"] .tag.mid{background:#413623;color:#e0c98d}
  :root[data-theme="dark"] .tag.bad{background:#432b24;color:#eab3a2}
  .ask{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px 16px 6px;margin:22px 0}
  .ask h3{margin:0 0 3px;font-size:16px}
  .ask p{margin:0 0 12px;color:var(--sub);font-size:13.5px}
  .opts{display:flex;flex-wrap:wrap;gap:9px;margin-bottom:14px}
  .opt{border:2px solid var(--line);background:transparent;color:var(--ink);border-radius:999px;
       padding:9px 15px;font-size:14px;font-family:inherit;cursor:pointer;transition:.14s}
  .opt:hover{border-color:var(--sub)}
  .opt[aria-pressed="true"]{border-color:var(--pin);background:var(--pin);color:#fff;font-weight:700}
  .opt:focus-visible{outline:3px solid var(--pop);outline-offset:2px}
  .bar{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1px solid var(--line);
       padding:11px 16px;display:flex;gap:11px;align-items:center;justify-content:center}
  .copy{background:var(--pin);color:#fff;border:none;border-radius:999px;padding:12px 24px;
        font-size:15px;font-weight:700;font-family:inherit;cursor:pointer}
  .copy:focus-visible{outline:3px solid var(--pop);outline-offset:2px}
  .done{font-size:13.5px;color:var(--sub)}
  #out{white-space:pre-wrap;font-size:13px;background:var(--card);border:1px solid var(--line);
       border-radius:11px;padding:12px;margin-top:12px;display:none}
  @media (max-width:520px){ .shot{width:242px} h1{font-size:22px} }
</style>
<div class="wrap">
<h1>포스트잇 느낌 찾기</h1>
<p class="sub">전부 <b>폰 자리를 꽉 채운</b> 크기야(350px). 종이만 갈아끼웠어 — 정사각형에 가까운 순으로 놨어.</p>

<div class="say">
  📮 네가 한 말 — <b>“디자인이 많이 들어간 라벨이 썩 잘어울리진 않네”</b> ·
  <b>“가로가 너무 기니까 이상해보이는 것 같기도해”</b> · <b>“포스트잇 느낌을 살리면 좋겠는데..”</b>
</div>

<div class="note">
  ⭐⭐ <b>재보니 세 마디가 한 원인이었어 — 종이가 가로로 너무 길다.</b><br>
  포스트잇은 정사각형에 가까운데(가로÷세로 ≈ 1), 네 시안은 <b>2.04</b>라 <b>라벨·배너 모양</b>이야.
  가로로 길면 「포스트잇」이 아니라 「이름표」로 읽혀. 패드에서 더 늘리면 그게 두 배가 되니까
  <b>징그럽다고 느낀 것도 같은 원인</b>이고.<br>
  ⭐ 그리고 <b>앱에 이미 있는 메모지 열 장은 전부 0.97~1.51</b> — 원래 포스트잇 비율이야.
</div>

<h2>앱에 이미 있는 메모지 열 장</h2>
<p class="h2sub">새로 뽑을 것도 없어. 아무거나 고른 게 아니라 <b>「글 쓸 자리가 나오는 것」으로 이미 걸러진 목록</b>이야
 — 글 자리 안 나오는 도장 같은 건 예전에 이미 뺐더라.</p>
<div class="row">${줄('앱')}</div>

<h2>견줄 바탕 — 네 시안</h2>
<p class="h2sub">같은 크기·같은 자리에 얹은 거야. 위 열 장이랑 나란히 두고 봐줘.</p>
<div class="row">${줄('시안')}</div>

<div class="ask">
  <h3>1. 방향은?</h3>
  <p>「조용한 쪽」이면 새 시안을 안 뽑아도 돼. 「그래도 시안」이면 뽑던 걸 계속 봐줘.</p>
  <div class="opts" data-q="방향">
    <button class="opt" type="button" data-v="앱에 있는 조용한 걸로">앱에 있는 조용한 걸로</button>
    <button class="opt" type="button" data-v="그래도 새 시안으로">그래도 새 시안으로</button>
    <button class="opt" type="button" data-v="둘 다 아직">둘 다 아직</button>
  </div>

  <h3>2. 마음에 드는 게 있어?</h3>
  <p>위 열 장 중에 골라줘. 없으면 「없다」로.</p>
  <div class="opts" data-q="고른것">
    <button class="opt" type="button" data-v="dgn02">dgn02</button>
    <button class="opt" type="button" data-v="dgn05">dgn05</button>
    <button class="opt" type="button" data-v="dgn08">dgn08</button>
    <button class="opt" type="button" data-v="dgn10">dgn10</button>
    <button class="opt" type="button" data-v="dgn12">dgn12</button>
    <button class="opt" type="button" data-v="dc_dma01">dc_dma01</button>
    <button class="opt" type="button" data-v="dc_dma05">dc_dma05</button>
    <button class="opt" type="button" data-v="dc_dma06">dc_dma06</button>
    <button class="opt" type="button" data-v="dc_dma11">dc_dma11</button>
    <button class="opt" type="button" data-v="dc_dma14">dc_dma14</button>
    <button class="opt" type="button" data-v="없다">없다</button>
  </div>

  <h3>3. 패드에선 얼마나 크게?</h3>
  <p>패드는 자리가 692px이라 그대로 늘리면 폰의 두 배가 돼.</p>
  <div class="opts" data-q="패드">
    <button class="opt" type="button" data-v="폰이랑 같은 크기로 (안 늘림)">폰이랑 같은 크기로 (안 늘림)</button>
    <button class="opt" type="button" data-v="조금만 크게 (460까지)">조금만 크게 (460까지)</button>
    <button class="opt" type="button" data-v="패드도 자리 꽉">패드도 자리 꽉</button>
  </div>
</div>

<div class="note">
  📌 <b>여기 컷들은 아직 「재료 위」 자리야</b> — 종이를 견주려고 그대로 뒀어.<br>
  ⭐ 네가 말한 <b>「재료 옆」</b>(재료 위 직사각형 자리 말고, <b>재료 목록 오른쪽</b>)은 <b>바로 다음 판</b>에서 그려서 보여줄게.
  종이가 정사각형이 되면 가로를 다 안 쓰니까 그 옆으로 재료가 흐르는 배치가 되거든 —
  <b>종이를 먼저 정해야 그 자리를 제대로 그려볼 수 있어.</b>
</div>
</div>

<div class="bar">
  <span class="done" id="done">고른 것 0 / 3</span>
  <button class="copy" type="button" id="copy">복사하기</button>
</div>
<pre id="out"></pre>

<script>
(function(){
  var KEY = 'hankki:조용한메모지-0820';
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { saved = {}; }
  var groups = [].slice.call(document.querySelectorAll('.opts'));

  function paint(){
    var n = 0;
    groups.forEach(function(g){
      var q = g.getAttribute('data-q');
      [].slice.call(g.querySelectorAll('.opt')).forEach(function(btn){
        btn.setAttribute('aria-pressed', saved[q] === btn.getAttribute('data-v') ? 'true' : 'false');
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
    var label = { 방향: '방향', 고른것: '고른 메모지', 종이없이: '종이 없이 갈래' };
    var lines = ['조용한 메모지 판정 (2026-08-20)'];
    groups.forEach(function(g){
      var q = g.getAttribute('data-q');
      lines.push('- ' + label[q] + ' : ' + (saved[q] || '(안 고름)'));
    });
    var text = lines.join('\\n');
    var out = document.getElementById('out');
    out.textContent = text;
    out.style.display = 'block';
    try {
      var r = document.createRange();
      r.selectNodeContents(out);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
    } catch (e) {}
    var say = document.getElementById('done');
    // ⭐ 기본은 «길게 눌러» — 진짜로 복사됐을 때만 바꾼다(v10.97 교훈).
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

const 낼판 = join(OUT, '조용한메모지.html')
writeFileSync(낼판, html)
console.log(`\n🤍 ${컷들.length}컷`)
console.log(`📄 ${낼판}  (${(Buffer.byteLength(html) / 1048576).toFixed(2)} MB)`)
