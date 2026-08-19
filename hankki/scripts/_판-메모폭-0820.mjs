// 📐 상세 화면에서 메모지가 «작다» — 폭 갈래 셋 (2026-08-20)
//
// 📮 창업자 = *"상세레시피에서는 사이즈가 좀 작네?"*
//
// ⭐⭐ 원인 = 시안이 아니라 «앱 코드»다. `RecipeDetailScreen.jsx:498` 이
//    `display:flex; justify-content:center` 라 **메모지가 flex 자식이 되어 「글자 길이만큼」만 차지한다.**
//    → 자리가 아무리 넓어도 안 늘어난다.
//
// 🔢 실측 (손대기 전)
//    | 화면        | 메모지 | 담긴 칸 |
//    |-------------|-------:|--------:|
//    | 폰 390      |  238px |   350px |
//    | 패드 세로   |  238px |   429px |
//    | 패드 가로   |  238px |   652px |
//    ⭐ 어느 화면에서든 **238px 고정.** 반면 요리 모드는 `maxWidth:460` 블록이라 339px 이 나온다.
//    📌 즉 **같은 메모지가 화면마다 다른 크기다.** 그게 진짜 문제다.
//
// ⛔ 종이는 하나로 고정한다 — 여기선 «폭»만 본다.
//    (창업자가 2026-08-20 에 *"내가 시안을 좀더 뽑는 중이거든"* 이라 종이 판정은 그때 따로 한다)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

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
await new Promise((r) => srv.listen(4402, r))

const 종이 = 's3_5_01'                                     // 폭만 보는 판이라 하나로 고정
const 글씨 = ["'Poor Story','Gowun Dodum',sans-serif", 400] // 연필체

// 📐 폭 갈래 셋
//   ⛔ 「자리 꽉(100%)」을 뺐다 — 패드 가로에선 652px 이라 메모 한 줄에 너무 크다.
//      대신 «요리 모드와 같게»(maxWidth 460)를 넣는다. 그러면 두 화면의 메모지가 같은 크기가 된다.
const 갈래들 = [
  ['지금', null, '지금 그대로', '글자 길이만큼 — 어느 화면에서든 238px'],
  ['중간', 0.85, '자리의 85%', '조금 키운다'],
  ['요리와같게', 460, '요리 모드와 같게', '자리를 쓰되 460px 까지'],
]

const 화면들 = [
  ['폰', 390, 844, '갤럭시 폰'],
  ['패드가로', 1180, 820, '패드 가로'],
]

const 재기 = (k) => {
  const buf = readFileSync(join(컷폴더, `${k}.png`))
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
}
const 데이터 = (k) => 'data:image/png;base64,' + readFileSync(join(컷폴더, `${k}.png`)).toString('base64')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

// 🌱 어제 만들고 한 줄을 써 둔 상태로 만든다
//    ⛔⛔ localStorage 는 «context»에 붙는다 — 화면 크기마다 context 를 새로 만들면
//       온보딩이 «다시» 떠서 클릭을 가로챈다(2026-08-20 실제로 30초 타임아웃).
//       그래서 context 마다 이 준비를 한 번씩 한다.
//    ⛔ reload 로 되살리지 않는다 — `addInitScript` 가 다시 돌아 저장값을 시드로 덮는다(함정 사전 ①).
//       같은 context 안에서 «새 페이지»를 열면 저장값이 그대로 산다.
const 씨뿌리기 = async (ctx) => {
  const p = await ctx.newPage()
  await p.addInitScript(SEED_COACH_SEEN)
  await p.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1') })
  await p.goto('http://127.0.0.1:4402/', { waitUntil: 'networkidle' })
  await p.waitForFunction(() => !!localStorage.getItem('hankki:v1'), null, { timeout: 15000 })
  const 제목 = await p.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('hankki:v1'))
    const r = s.recipes[0]
    r.cooked = 1; r.cookedAt = Date.now() - 864e5
    s.diary = [{ id: 'd1', recipeId: r.id, title: r.title, source: r.source, at: Date.now() - 864e5, rating: 4, note: '간장 반만 · 마지막에 참기름', photo: null }]
    localStorage.setItem('hankki:v1', JSON.stringify(s))
    return r.title
  })
  await p.close()
  return 제목
}

// 🎨 종이 얹기 ＋ 폭 갈아끼우기
const 꾸미기 = async (p, 값) => {
  const { w, h } = 재기(종이)
  // 📏 종이를 얹기 «전»에 앱이 그린 폭을 잰다
  //    ⛔⛔ 「지금」 갈래에서 이걸 안 하면 컷이 무너진다(2026-08-20 실제로 238px → 71px).
  //       종이는 비율(aspectRatio)이 있고 안쪽을 62% 로 좁히므로, flex 자식의 폭이
  //       «글자 길이»가 아니라 «좁힌 글자 길이»로 다시 계산돼 통째로 쪼그라든다.
  //    ⭐ 바탕이 틀리면 견줄 수가 없다 — 「지금」은 앱이 그린 그 폭 그대로여야 한다.
  const 원래폭 = await p.evaluate(() => {
    const el = [...document.querySelectorAll('.memo-note')].pop()
    return el ? Math.round(el.getBoundingClientRect().width) : 0
  })
  await p.evaluate(({ url, w, h, fam, weight, 값, 원래폭 }) => {
    // ⛔⛔ querySelector 는 «첫째»를 잡는다 — 쌓인 화면의 «화면 밖» 것을 잡지 않도록 마지막을 쓴다
    const el = [...document.querySelectorAll('.memo-note')].pop()
    if (!el) return
    const 통 = el.parentElement

    // ── 폭 갈래 ──
    if (값 === null) {
      // 지금 그대로 — 앱이 그린 폭을 «그대로 못 박는다»
      el.style.width = `${원래폭}px`
      el.style.flex = '0 0 auto'
    } else {
      // 지금은 통이 flex 라 자식이 글자만큼만 찬다 → 블록으로 돌리고 폭을 준다
      통.style.display = 'block'
      통.style.margin = '18px auto 0'
      if (값 <= 1) {
        통.style.width = `${값 * 100}%`
      } else {
        통.style.width = '100%'
        통.style.maxWidth = `${값}px`
      }
      el.style.width = '100%'
    }

    el.classList.add('paper')
    el.style.setProperty('background-image', `url(${url})`, 'important')
    el.style.setProperty('background-size', '100% 100%', 'important')
    el.style.setProperty('background-repeat', 'no-repeat', 'important')
    el.style.aspectRatio = `${w}/${h}`
    el.style.display = 'flex'
    el.style.alignItems = 'center'
    el.style.justifyContent = 'center'
    // ⭐ 종이 폭을 기준으로 글씨를 키우려면 컨테이너 질의 단위가 필요하다
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
      // ⭐ 종이가 커지면 글씨도 같이 커져야 «같은 메모»로 보인다 — 종이 폭에 매단다
      body.style.fontSize = 'clamp(13px, 4.6cqw, 21px)'
      body.style.lineHeight = '1.24'
      body.style.marginTop = '1px'
    }
  }, { url: 데이터(종이), w, h, fam: 글씨[0], weight: 글씨[1], 값, 원래폭 })
  await p.waitForTimeout(340)
}

// 📏 앱이 실제로 그린 폭을 «잰다» — 내가 계산하지 않는다(규칙 30)
const 잰다 = async (p) => await p.evaluate(() => {
  const el = [...document.querySelectorAll('.memo-note')].pop()
  if (!el) return null
  const 재료줄 = [...document.querySelectorAll('.ing')].pop()
  return {
    메모: Math.round(el.getBoundingClientRect().width),
    자리: Math.round(el.parentElement.parentElement.getBoundingClientRect().width),
    재료: 재료줄 ? Math.round(재료줄.getBoundingClientRect().width) : null,
  }
})

const 컷들 = []
for (const [화면키, W, H, 화면이름] of 화면들) {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, timezoneId: 'Asia/Seoul', deviceScaleFactor: 2 })
  const 제목 = await 씨뿌리기(ctx)
  for (const [갈래키, 값, 갈래이름, 갈래설명] of 갈래들) {
    const p = await ctx.newPage()
    await p.addInitScript(SEED_COACH_SEEN)
    await p.goto('http://127.0.0.1:4402/', { waitUntil: 'networkidle' })
    await p.waitForTimeout(700)
    await p.click(`text=${제목}`)
    await p.waitForSelector('.memo-note', { timeout: 10000 })
    await 꾸미기(p, 값)
    const 잰값 = await 잰다(p)

    // 📜 메모지를 «화면 가운데»로 올린다
    //    ⛔ 안 하면 하단 버튼(요리 시작·만들었어요)이 메모지를 덮는다 — 2026-08-20 에 실제로 잘려 나왔다.
    //       그 버튼은 fixed 라 스크롤로만 피할 수 있다.
    await p.evaluate(() => {
      const el = [...document.querySelectorAll('.memo-note')].pop()
      if (el) el.scrollIntoView({ block: 'center' })
    })
    await p.waitForTimeout(420)

    // 메모지 둘레를 «주변과 함께» 자른다 — 위로 재료 제목, 아래로 재료줄까지
    const clip = await p.evaluate(() => {
      const el = [...document.querySelectorAll('.memo-note')].pop()
      const r = el.getBoundingClientRect()
      const 위 = Math.max(0, Math.round(r.top - 240))
      const 아래 = Math.min(window.innerHeight, Math.round(r.bottom + 240))
      return { x: 0, y: 위, width: window.innerWidth, height: Math.max(80, 아래 - 위) }
    })
    const 곳 = `${OUT}/폭-${화면키}-${갈래키}.png`
    await p.screenshot({ path: 곳, clip })
    컷들.push({ 화면키, 화면이름, 갈래키, 갈래이름, 갈래설명, 곳, ...잰값 })
    console.log(`  ${화면이름} · ${갈래이름} → 메모 ${잰값.메모}px (자리 ${잰값.자리} · 재료줄 ${잰값.재료})`)
    await p.close()
  }
  await ctx.close()
}
await b.close(); srv.close()

// ── 판 만들기 ────────────────────────────────────
const 파일 = (f) => 'data:image/png;base64,' + readFileSync(f).toString('base64')

const 묶음 = 화면들.map(([화면키, W, H, 화면이름]) => {
  const 줄 = 컷들.filter((c) => c.화면키 === 화면키).map((c) => `
    <figure class="shot${c.갈래키 === '지금' ? ' base' : ''}">
      <img src="${파일(c.곳)}" alt="">
      <figcaption><b>${c.갈래이름}</b> · 메모지 <b>${c.메모}px</b><br><span>${c.갈래설명}</span></figcaption>
    </figure>`).join('')
  return `<h2>${화면이름} <span class="wh">${W} × ${H}</span></h2>
    <p class="h2sub">맨 왼쪽 점선이 <b>지금</b>이야. 옆으로 밀어서 봐줘.</p>
    <div class="row">${줄}</div>`
}).join('')

const 표 = 컷들.map((c) => `<tr><td>${c.화면이름}</td><td>${c.갈래이름}</td><td class="n">${c.메모}</td><td class="n">${c.자리}</td><td class="n">${c.재료 ?? '-'}</td></tr>`).join('')

const html = `<title>메모지 폭 정하기</title>
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
  h2 .wh{font-size:13px;color:var(--sub);font-weight:400;margin-left:6px}
  .h2sub{color:var(--sub);font-size:13.5px;margin:0 0 14px}
  .say{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--pin);
       border-radius:0 12px 12px 0;padding:12px 14px;margin:0 0 18px;font-size:14px}
  .say b{color:var(--pin)}
  .note{font-size:13.5px;color:var(--sub);background:var(--card);border:1px dashed var(--line);
        border-radius:11px;padding:11px 13px;margin:16px 0}
  .row{display:flex;gap:14px;overflow-x:auto;padding:4px 0 10px;scroll-padding-left:20px}
  .shot{margin:0;flex:0 0 auto;width:290px;background:var(--card);border:1px solid var(--line);
        border-radius:14px;overflow:hidden}
  .shot.base{border-style:dashed;opacity:.92}
  .shot img{width:100%;display:block}
  .shot figcaption{font-size:12.5px;color:var(--sub);padding:9px 11px;border-top:1px solid var(--line)}
  .shot figcaption b{color:var(--ink)}
  table{border-collapse:collapse;width:100%;font-size:13.5px;margin-top:10px}
  th,td{border-bottom:1px solid var(--line);padding:7px 9px;text-align:left}
  th{color:var(--sub);font-weight:400}
  td.n{text-align:right;font-variant-numeric:tabular-nums}
  .tblwrap{overflow-x:auto}
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
  @media (max-width:520px){ .shot{width:246px} h1{font-size:22px} }
</style>
<div class="wrap">
<h1>메모지 폭 정하기</h1>
<p class="sub">상세 화면에서 메모지가 작았던 <b>이유와 고칠 갈래</b>야. 종이는 하나로 고정했어 — 여기선 <b>크기만</b> 봐줘.</p>

<div class="say">
  📮 네가 한 말 — <b>“상세레시피에서는 사이즈가 좀 작네?”</b>
</div>

<div class="note">
  🔎 <b>원인은 시안이 아니라 앱 코드야.</b> 상세 화면이 메모지를 「가운데 정렬」 상자에 넣어놔서
  <b>글자 길이만큼만</b> 차지해. 그래서 폰이든 패드든 <b>늘 238px</b>이야 — 자리가 넓어져도 안 늘어나.<br>
  ⭐ 반면 요리 모드는 폭을 줘서 <b>339px</b>이 나와. <b>같은 메모지가 화면마다 다른 크기인 게 진짜 문제야.</b>
</div>

${묶음}

<h2>잰 값</h2>
<p class="h2sub">앱이 실제로 그린 크기를 잰 거야. 내가 계산한 게 아니라 화면에서 읽었어.</p>
<div class="tblwrap">
<table>
  <thead><tr><th>화면</th><th>갈래</th><th class="n">메모지</th><th class="n">담긴 칸</th><th class="n">재료줄</th></tr></thead>
  <tbody>${표}</tbody>
</table>
</div>

<div class="ask">
  <h3>어느 크기로 갈까?</h3>
  <p>「요리 모드와 같게」로 하면 상세랑 요리 모드의 메모지가 <b>같은 크기</b>가 돼.</p>
  <div class="opts" data-q="폭">
    <button class="opt" type="button" data-v="지금 그대로 (238px)">지금 그대로 (238px)</button>
    <button class="opt" type="button" data-v="자리의 85%">자리의 85%</button>
    <button class="opt" type="button" data-v="요리 모드와 같게 (460 상한)">요리 모드와 같게 (460 상한)</button>
    <button class="opt" type="button" data-v="모르겠다">모르겠다</button>
  </div>
</div>
</div>

<div class="bar">
  <span class="done" id="done">고른 것 0 / 1</span>
  <button class="copy" type="button" id="copy">복사하기</button>
</div>
<pre id="out"></pre>

<script>
(function(){
  var KEY = 'hankki:메모폭-0820';
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
    var lines = ['메모지 폭 판정 (2026-08-20)'];
    groups.forEach(function(g){
      var q = g.getAttribute('data-q');
      lines.push('- 상세 화면 메모지 크기 : ' + (saved[q] || '(안 고름)'));
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
    // ⭐ 기본은 «길게 눌러» — 진짜로 복사됐을 때만 바꾼다.
    //    ⛔ writeText 는 Promise 라 동기 try/catch 로는 못 잡는다(v10.97 교훈).
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

const 낼판 = join(OUT, '메모폭.html')
writeFileSync(낼판, html)
console.log(`\n📐 ${컷들.length}컷 (화면 ${화면들.length} × 갈래 ${갈래들.length})`)
console.log(`📄 ${낼판}  (${(Buffer.byteLength(html) / 1048576).toFixed(2)} MB)`)
