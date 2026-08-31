// 📌 창업자 새 메모지 16컷 — 재료 옆에 붙여서 (2026-08-20)
//
// 📮 창업자가 조건대로 뽑아 줬다 — 정사각 1254 × 4장 = 16컷 · 컷당 572~592px · 비율 0.96~1.04
// 📮 ＋ *"귀여운게 많아서 **포스트잇을 랜덤으로 붙이는거 어때?**"*
//
// ⭐⭐ 「랜덤」은 두 가지로 갈린다 — 판에서 둘을 다 보여준다
//    ⛔ **볼 때마다 바뀜** = 같은 레시피를 열 때마다 종이가 달라진다 → 어수선하고 「고장인가」로 읽힌다
//    ✅ **레시피마다 고정** = 콩국수는 늘 A · 닭곰탕은 늘 B → 다양하면서 안 흔들린다
//       (`guessFoodIcon` 이 제목으로 그림을 정하는 것과 같은 결)
//
// ⭐ 빠르게 찍는다 — 페이지를 «한 번»만 열고 종이만 갈아끼우며 메모지 둘레를 잘라 찍는다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const 컷폴더 = join(ROOT, 'docs/stickers/메모지-창업자-2026-08-20/낱개')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4406, r))

const 컷들 = readdirSync(컷폴더).filter((f) => f.endsWith('.png')).sort()
const 재기 = (f) => {
  const buf = readFileSync(join(컷폴더, f))
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
}
const 데이터 = (f) => 'data:image/png;base64,' + readFileSync(join(컷폴더, f)).toString('base64')
console.log(`🖼 낱개 ${컷들.length}컷`)

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, timezoneId: 'Asia/Seoul', deviceScaleFactor: 2 })

// 🌱 레시피 넷에 메모를 심는다 — 「레시피마다 다른 종이」를 보여주려면 여럿이 필요하다
const 넷 = ['콩국수', '닭곰탕', '제육볶음', '갈치조림']
const p0 = await ctx.newPage()
await p0.addInitScript(SEED_COACH_SEEN)
await p0.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
await p0.goto('http://127.0.0.1:4406/', { waitUntil: 'networkidle' })
await p0.waitForFunction(() => !!localStorage.getItem('hankki:v1'), null, { timeout: 15000 })
const 심은것 = await p0.evaluate((넷) => {
  const s = JSON.parse(localStorage.getItem('hankki:v1'))
  const 글 = ['간장 반만 · 마지막에 참기름', '물 조금 더 · 대파 듬뿍', '고추장 한 술 줄이기', '무 먼저 깔고 조리기']
  s.diary = []
  const 산것 = []
  넷.forEach((이름, i) => {
    const r = s.recipes.find((x) => x.title === 이름) || (i === 0 ? s.recipes[0] : null)
    if (!r) return
    r.cooked = 2; r.cookedAt = Date.now() - 864e5
    s.diary.push({ id: 'd' + i, recipeId: r.id, title: r.title, at: Date.now() - 864e5 * (i + 1), rating: 4, note: 글[i], photo: null })
    산것.push(r.title)
  })
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  return 산것
}, 넷)
await p0.close()
console.log(`🍲 메모 심은 레시피 = ${심은것.join(' · ')}`)

// 📌 지금 화면의 메모지에 종이를 갈아끼운다 — 비율·안쪽여백까지 그 종이 것으로
const 갈아끼우기 = async (p, 파일) => {
  const { w, h } = 재기(파일)
  await p.evaluate(({ url, w, h }) => {
    // ⛔⛔ querySelector 는 «첫째»를 잡는다 — 쌓인 화면의 «화면 밖» 것을 잡지 않도록 마지막을 쓴다
    const el = [...document.querySelectorAll('.memo-note')].pop()
    if (!el) return
    el.style.setProperty('background-image', `url(${url})`, 'important')
    el.style.aspectRatio = String(w / h)
  }, { url: 데이터(파일), w, h })
  await p.waitForTimeout(260)
}

const 열기 = async (제목) => {
  const p = await ctx.newPage()
  await p.addInitScript(SEED_COACH_SEEN)
  await p.goto('http://127.0.0.1:4406/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(700)
  await p.click(`text=${제목}`)
  await p.waitForSelector('.memo-note', { timeout: 10000 })
  await p.evaluate(() => {
    const el = [...document.querySelectorAll('.memo-note')].pop()
    if (el) el.scrollIntoView({ block: 'center' })
  })
  await p.waitForTimeout(400)
  return p
}
const 찍기 = async (p, 곳) => {
  const clip = await p.evaluate(() => {
    const el = [...document.querySelectorAll('.memo-note')].pop()
    const r = el.getBoundingClientRect()
    const 위 = Math.max(0, Math.round(r.top - 24))
    const 아래 = Math.min(window.innerHeight, Math.round(r.bottom + 150))
    return { x: 0, y: 위, width: 390, height: Math.max(120, 아래 - 위) }
  })
  await p.screenshot({ path: 곳, clip })
}

// ── ① 16컷 전부 — 같은 레시피에 갈아끼우며 ────────────────
const 낱개컷 = []
{
  const p = await 열기(심은것[0])
  for (const f of 컷들) {
    await 갈아끼우기(p, f)
    const 키 = f.replace('.png', '')
    const 곳 = `${OUT}/새메모-${키}.png`
    await 찍기(p, 곳)
    낱개컷.push({ 키, 곳 })
  }
  await p.close()
}
console.log(`📸 낱개 얹기 ${낱개컷.length}컷`)

// ── ①-b 머리줄 갈래 — 창업자 *"내가남긴 것 멘트가 별로인데.."* ────────
//    ⛔ 내가 고르지 않는다(규칙 11) — 넷을 나란히 놓고 판정을 받는다.
const 머리갈래 = [
  ['now', '지난번에 내가 남긴 것', '지금 그대로'],
  ['short', '지난번', '짧게'],
  ['none', '', '아예 뺀다 — 연필과 별만'],
  ['date', '8월 19일', '날짜로'],
]
const 머리컷 = []
{
  const p = await 열기(심은것[0])
  await 갈아끼우기(p, 컷들[0])
  for (const [키, 글, 설명] of 머리갈래) {
    await p.evaluate((글) => {
      const el = [...document.querySelectorAll('.memo-note')].pop()
      const 줄 = el.querySelector('.memo-note-head span')
      if (줄) { 줄.textContent = 글; 줄.style.display = 글 ? '' : 'none' }
    }, 글)
    await p.waitForTimeout(220)
    const 곳 = `${OUT}/새메모-머리-${키}.png`
    await 찍기(p, 곳)
    머리컷.push({ 키, 글, 설명, 곳 })
  }
  await p.close()
}
console.log(`✍️ 머리줄 ${머리컷.length}컷`)

// ── ② 「레시피마다 다른 종이」 — 랜덤이 어떤 그림인지 ──────────
//    ⭐ 레시피 id 로 정해지는 방식이라 «같은 레시피는 늘 같은 종이»다
const 랜덤컷 = []
for (let i = 0; i < 심은것.length; i++) {
  const p = await 열기(심은것[i])
  await 갈아끼우기(p, 컷들[(i * 5) % 컷들.length])   // 서로 다른 종이가 붙은 그림
  const 곳 = `${OUT}/새메모-랜덤-${i}.png`
  await 찍기(p, 곳)
  랜덤컷.push({ 제목: 심은것[i], 종이: 컷들[(i * 5) % 컷들.length].replace('.png', ''), 곳 })
  await p.close()
}
await ctx.close(); await b.close(); srv.close()

// ── 판 ────────────────────────────────────
const 파일 = (f) => 'data:image/png;base64,' + readFileSync(f).toString('base64')
const 낱개줄 = 낱개컷.map((c) => `
  <figure class="shot">
    <img src="${파일(c.곳)}" alt="">
    <figcaption><b>${c.키}</b></figcaption>
  </figure>`).join('')
const 랜덤줄 = 랜덤컷.map((c) => `
  <figure class="shot">
    <img src="${파일(c.곳)}" alt="">
    <figcaption><b>${c.제목}</b> · ${c.종이}</figcaption>
  </figure>`).join('')
const 머리줄HTML = 머리컷.map((c) => `
  <figure class="shot${c.키 === 'now' ? ' base' : ''}">
    <img src="${파일(c.곳)}" alt="">
    <figcaption><b>${c.설명}</b><br><span>${c.글 ? `「${c.글}」` : '머리글 없음'}</span></figcaption>
  </figure>`).join('')

const html = `<title>새 메모지 열여섯</title>
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
  .wrap{max-width:1000px;margin:0 auto}
  h1{font-size:25px;margin:0 0 6px;letter-spacing:-.4px;text-wrap:balance}
  .sub{color:var(--sub);font-size:14.5px;margin:0 0 22px}
  h2{font-size:19px;margin:34px 0 4px;padding-top:16px;border-top:2px solid var(--line)}
  .h2sub{color:var(--sub);font-size:13.5px;margin:0 0 14px}
  .say{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--pin);
       border-radius:0 12px 12px 0;padding:12px 14px;margin:0 0 18px;font-size:14px}
  .say b{color:var(--pin)}
  .note{font-size:13.5px;color:var(--sub);background:var(--card);border:1px dashed var(--line);
        border-radius:11px;padding:11px 13px;margin:16px 0}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
  .row{display:flex;gap:14px;overflow-x:auto;padding:4px 0 10px;scroll-padding-left:20px}
  .row .shot{flex:0 0 auto;width:270px}
  .shot{margin:0;background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden}
  .shot img{width:100%;display:block}
  .shot figcaption{font-size:12.5px;color:var(--sub);padding:8px 10px;border-top:1px solid var(--line)}
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
  .bar{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1px solid var(--line);
       padding:11px 16px;display:flex;gap:11px;align-items:center;justify-content:center}
  .copy{background:var(--pin);color:#fff;border:none;border-radius:999px;padding:12px 24px;
        font-size:15px;font-weight:700;font-family:inherit;cursor:pointer}
  .copy:focus-visible{outline:3px solid var(--pop);outline-offset:2px}
  .done{font-size:13.5px;color:var(--sub)}
  #out{white-space:pre-wrap;font-size:13px;background:var(--card);border:1px solid var(--line);
       border-radius:11px;padding:12px;margin-top:12px;display:none}
  @media (max-width:520px){ h1{font-size:22px} .grid{grid-template-columns:repeat(auto-fill,minmax(190px,1fr))} }
</style>
<div class="wrap">
<h1>새 메모지 열여섯</h1>
<p class="sub">네가 뽑은 16컷을 <b>실제 앱 화면</b>의 재료 옆에 붙여봤어. 자리·크기·기울기는 네가 정한 그대로야.</p>

<div class="say">
  📮 네가 한 말 — <b>“귀여운게 많아서 포스트잇을 랜덤으로 붙이는거 어때?”</b>
</div>

<div class="note">
  ✅ <b>시안이 조건에 다 맞아</b> — 정사각(비율 0.96~1.04) · 컷당 572~592px ·
  가운데 비었고 장식은 모서리에 작게 · 마스킹테이프까지.<br>
  ⭐ 표준 도구로 잘랐고 <b>잘림·잔재 0</b>이야.
</div>

<h2>① 열여섯 컷 — 재료 옆에 붙였을 때</h2>
<p class="h2sub">전부 같은 레시피(콩국수)에 갈아끼운 거야. 마음에 드는 것/버릴 것을 봐줘.</p>
<div class="grid">${낱개줄}</div>

<h2>②「지난번에 내가 남긴 것」을 어떻게 할까</h2>
<p class="h2sub">네가 <b>“내가남긴 것 멘트가 별로인데..”</b> 라고 해서 넷을 만들었어.
맨 왼쪽 점선이 지금이야.</p>
<div class="row">${머리줄HTML}</div>

<h2>③ 「랜덤」은 이런 그림이야</h2>
<p class="h2sub">레시피마다 다른 종이가 붙어. 옆으로 밀어서 봐줘.</p>

<div class="note">
  ⭐⭐ <b>「랜덤」을 두 가지로 갈라야 해.</b><br>
  ⛔ <b>볼 때마다 바뀜</b> — 같은 레시피를 열 때마다 종이가 달라져. <b>어수선하고 「고장인가?」로 읽혀.</b><br>
  ✅ <b>레시피마다 고정</b> — 콩국수는 늘 A, 닭곰탕은 늘 B. <b>레시피마다 달라서 다양한데, 같은 레시피는 안 흔들려.</b>
  음식 그림을 제목으로 정하는 것과 같은 방식이야.
</div>
<div class="row">${랜덤줄}</div>

<div class="ask">
  <h3>1. 랜덤으로 할까?</h3>
  <p>고정하면 한 장만 쓰고 나머지 15컷은 꾸미기 서랍으로 가.</p>
  <div class="opts" data-q="랜덤">
    <button class="opt" type="button" data-v="레시피마다 다르게 (고정 랜덤)">레시피마다 다르게</button>
    <button class="opt" type="button" data-v="한 장으로 통일">한 장으로 통일</button>
    <button class="opt" type="button" data-v="모르겠다">모르겠다</button>
  </div>

  <h3>2. 버릴 컷이 있어?</h3>
  <p>랜덤으로 가도 <b>안 어울리는 건 빼야</b> 해. 없으면 「없다」로.</p>
  <div class="opts" data-q="버릴것">
    <button class="opt" type="button" data-v="없다 · 다 써도 된다">없다 · 다 써도 된다</button>
    <button class="opt" type="button" data-v="있다 (아래에 적을게)">있다 (따로 알려줄게)</button>
  </div>

  <h3>3. 머리글은?</h3>
  <p>②번에서 본 넷 중에 골라줘.</p>
  <div class="opts" data-q="머리글">
    <button class="opt" type="button" data-v="지난번에 내가 남긴 것 (지금)">지금 그대로</button>
    <button class="opt" type="button" data-v="지난번 (짧게)">「지난번」</button>
    <button class="opt" type="button" data-v="아예 뺀다">아예 뺀다</button>
    <button class="opt" type="button" data-v="날짜로">날짜로</button>
  </div>

  <h3>4. 「한 장으로 통일」이면 어느 것?</h3>
  <p>1번에서 통일을 골랐을 때만 답해줘.</p>
  <div class="opts" data-q="한장">
    ${컷들.map((f) => `<button class="opt" type="button" data-v="${f.replace('.png', '')}">${f.replace('.png', '')}</button>`).join('\n    ')}
  </div>
</div>
</div>

<div class="bar">
  <span class="done" id="done">고른 것 0 / 4</span>
  <button class="copy" type="button" id="copy">복사하기</button>
</div>
<pre id="out"></pre>

<script>
(function(){
  var KEY = 'hankki:새메모지16-0820';
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
    var label = { 랜덤: '랜덤 여부', 버릴것: '버릴 컷', 머리글: '머리글', 한장: '통일할 때 고른 것' };
    var lines = ['새 메모지 16컷 판정 (2026-08-20)'];
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

const 낼판 = join(OUT, '새메모지16.html')
writeFileSync(낼판, html)
console.log(`\n📌 낱개 ${낱개컷.length} ＋ 랜덤 ${랜덤컷.length}컷`)
console.log(`📄 ${낼판}  (${(Buffer.byteLength(html) / 1048576).toFixed(2)} MB)`)
