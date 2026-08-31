// 📸 「좋다」 종이 넷 × 손글씨 여섯 — 실제 요리 모드 화면에 붙여서 찍는다 (2026-08-20)
//
// 📮 창업자 판정(2026-08-20) = 좋다 4 · 모르겠다 4 · 버린다 3
//    ⭐ 좋다 넷 = cout01(쿠튀르 노랑 프릴) · s3_1(구름) · s3_4(초록 깅엄) · s3_5(파란 홈질＋숟가락)
//    ⭐ 넷 다 노랑·파랑·초록 계열 — 우리 앱 색과 같은 자리다.
//
// ⭐⭐ 왜 글씨체를 이제 보나 = 지금까지 판은 **기본 고딕**이라 「메모」 느낌이 반밖에 안 났다.
//    포스트잇에 고딕이면 「시스템 알림」으로 읽히고, 손글씨라야 「내가 쓴 것」으로 읽힌다.
//
// 🔤 손글씨 여섯 = 귀염체·삐뚤체·연필체·몽글체·가는체·펜글씨 (`Stickers.jsx` TEXT_FONTS)
//    ⛔ 또렷한 활자(통통체·동글체·라운드…)는 뺐다 — 「손으로 썼다」가 안 나온다.
//
// ⛔ 판을 만들면 «열어서 눌러본다» — 2026-08-19 에 세미콜론 하나로 체크가 통째로 안 눌렸다.
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
await new Promise((r) => srv.listen(4399, r))

// ✅ 창업자가 「좋다」 한 넷만
const 종이들 = [
  ['cout01', '쿠튀르 · 노랑 프릴 ＋ 파란 장미'],
  ['s3_1_01', '자수 · 구름 ＋ 파란 단추'],
  ['s3_4_01', '자수 · 초록 깅엄 ＋ 꽃'],
  ['s3_5_01', '자수 · 파란 홈질 ＋ 나무 숟가락'],
]
// 🔤 손글씨만 — 활자체는 「손으로 썼다」가 안 나온다
const 글씨들 = [
  ['gaegu', '귀염체', "'Gaegu','Gowun Dodum',sans-serif", 700],
  ['gamja', '삐뚤체', "'Gamja Flower','Gowun Dodum',sans-serif", 400],
  ['poorstory', '연필체', "'Poor Story','Gowun Dodum',sans-serif", 400],
  ['himelody', '몽글체', "'Hi Melody','Gowun Dodum',sans-serif", 400],
  ['singleday', '가는체', "'Single Day','Gowun Dodum',sans-serif", 400],
  ['nanumpen', '펜글씨', "'Nanum Pen Script','Gowun Dodum',sans-serif", 400],
]

const 재기 = (k) => {
  const buf = readFileSync(join(컷폴더, `${k}.png`))
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
}
const 데이터 = (k) => 'data:image/png;base64,' + readFileSync(join(컷폴더, `${k}.png`)).toString('base64')

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 1400 }, timezoneId: 'Asia/Seoul', deviceScaleFactor: 2 })

// 준비 — 어제 만들고 한 줄을 써 둔 상태
const p0 = await ctx.newPage()
await p0.addInitScript(SEED_COACH_SEEN)
await p0.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1') })
await p0.goto('http://127.0.0.1:4399/', { waitUntil: 'networkidle' })
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

// 📐 창업자 = *"레시피상세를 좀 더 보여주고, **앱에 들어가는 비율로** 보여줄래"*
//    🔢 실측 = 앱에서 메모지는 **상세 238px · 요리모드 339px** (390 폭 폰)
//       ⛔ 지금까지 판은 화면 폭을 꽉 채워 보여줘서 «실제보다 훨씬 컸다» — 판정이 어긋난다.
//    ✅ 이제 앱이 그리는 크기 그대로 두고, 화면을 넓게 잘라 «주변과 함께» 보여준다.
const 자리 = async (p, 위여유, 아래여유) => {
  const r = await p.evaluate(() => {
    const els = [...document.querySelectorAll('.memo-note')]
    const el = els[els.length - 1]
    if (!el) return null
    const b = el.getBoundingClientRect()
    return { top: b.top, height: b.height, 화면: window.innerHeight }
  })
  if (!r) return undefined
  const 위 = Math.max(0, Math.round(r.top - 위여유))
  const 높이 = Math.min(Math.round(r.height + 위여유 + 아래여유), Math.round(r.화면 - 위))
  return { x: 0, y: 위, width: 390, height: 높이 }
}

// 종이 ＋ 글씨를 한 번에 갈아끼운다
const 얹기 = async (p, 종이키, 글씨) => {
  const { w, h } = 재기(종이키)
  await p.evaluate(({ url, w, h, fam, weight }) => {
    const els = [...document.querySelectorAll('.memo-note')]
    const el = els[els.length - 1]
    if (!el) return
    el.classList.add('paper')
    el.style.setProperty('background-image', `url(${url})`, 'important')
    el.style.setProperty('background-size', '100% 100%', 'important')
    el.style.setProperty('background-repeat', 'no-repeat', 'important')
    // ⛔⛔ 크기를 «강제하지 않는다** — 창업자 = *"앱에 들어가는 비율로 보여줄래"*
    //    앱이 정한 폭(상세 238px · 요리모드 339px)을 그대로 두고 «비율»만 종이에 맞춘다.
    //    📌 전엔 width:100% 로 늘려 보여줘서 실제보다 훨씬 커 보였다 — 그러면 판정이 어긋난다.
    el.style.aspectRatio = `${w}/${h}`
    el.style.display = 'flex'
    el.style.alignItems = 'center'
    el.style.justifyContent = 'center'
    let inner = el.querySelector('.memo-inner')
    if (!inner) {
      inner = document.createElement('div')
      inner.className = 'memo-inner'
      // ⛔⛔ 글씨가 «종이 밖으로 넘쳤다» — 손글씨는 고딕보다 넓어서 같은 폭에 안 들어간다.
      //    ⑴ 안전지대를 72% → 62% 로 좁힌다(장식이 있는 가장자리를 더 피한다)
      //    ⑵ 머리줄이 두 줄로 감겨 장미 위로 올라갔다 → 한 줄로 묶고 넘치면 자른다
      inner.style.cssText = 'width:62%;text-align:center;overflow:hidden'
      while (el.firstChild) inner.appendChild(el.firstChild)
      el.appendChild(inner)
    }
    // 🔤 글씨체는 «본문 줄»에만 — 머리줄(지난번에 내가 남긴 것)은 그대로 둔다
    const head = inner.querySelector('.memo-note-head')
    if (head) {
      head.style.fontSize = '9.5px'
      head.style.whiteSpace = 'nowrap'   // ⛔감기면 장식 위로 올라간다
      head.style.justifyContent = 'center'
    }
    const body = inner.querySelector('.memo-note-body')
    if (body) {
      body.style.fontFamily = fam
      body.style.fontWeight = String(weight)
      body.style.fontSize = '1.06em'   // 손글씨는 넓다 — 키우면 바로 넘친다
      body.style.lineHeight = '1.22'
      body.style.marginTop = '1px'
    }
  }, { url: 데이터(종이키), w, h, fam: 글씨[2], weight: 글씨[3] })
  await p.waitForTimeout(320) // 글꼴이 붙을 시간
}

const 컷들 = []
for (const [종이키, 종이설명] of 종이들) {
  for (const 글씨 of 글씨들) {
    const p = await ctx.newPage()
    await p.addInitScript(SEED_COACH_SEEN)
    await p.goto('http://127.0.0.1:4399/', { waitUntil: 'networkidle' })
    await p.waitForTimeout(700)
    await p.click(`text=${제목}`)
    await p.waitForSelector('.memo-note', { timeout: 10000 })

    // ① 레시피 상세 — 창업자 = *"레시피상세를 좀 더 보여주고"*
    //    ⭐ 위로 표지·제목·시간칩까지 · 아래로 재료 목록까지
    await 얹기(p, 종이키, 글씨)
    const 상세곳 = `${OUT}/글씨상세-${종이키}-${글씨[0]}.png`
    await p.screenshot({ path: 상세곳, clip: await 자리(p, 380, 300) })

    // ② 요리 모드 재료 준비
    await p.click('text=요리 시작')
    await p.waitForSelector('.memo-note', { timeout: 10000 })
    await 얹기(p, 종이키, 글씨)
    const 요리곳 = `${OUT}/글씨요리-${종이키}-${글씨[0]}.png`
    await p.screenshot({ path: 요리곳, clip: await 자리(p, 120, 300) })

    컷들.push({ 종이키, 종이설명, 글씨키: 글씨[0], 글씨이름: 글씨[1], 상세: 상세곳, 요리: 요리곳 })
    await p.close()
  }
}

await ctx.close(); await b.close(); srv.close()

// ── 판 만들기 ────────────────────────────────────
const b64 = (p) => 'data:image/png;base64,' + readFileSync(p).toString('base64')
const 묶음 = 종이들.map(([종이키, 종이설명]) => {
  const 줄 = 컷들.filter((c) => c.종이키 === 종이키).map((c) => `
    <div class="cell" data-k="${c.종이키}__${c.글씨키}">
      <div class="two">
        <figure><img src="${b64(c.상세)}" alt="상세"><figcaption>레시피 상세</figcaption></figure>
        <figure><img src="${b64(c.요리)}" alt="요리모드"><figcaption>요리 모드</figcaption></figure>
      </div>
      <div class="cap"><b>${c.글씨이름}</b></div>
      <div class="pick">
        <button data-v="좋다">좋다</button>
        <button data-v="모르겠다">모르겠다</button>
        <button data-v="버린다">버린다</button>
      </div>
    </div>`).join('')
  return `<h2>${종이설명}</h2>\n<p class="h2sub">글씨체 여섯을 나란히 — 같은 종이, 같은 문장이야.</p>\n${줄}`
}).join('\n')

const html = `<title>종이 넷 × 손글씨 여섯</title>
<style>
:root{--bg:#f3f2ef;--card:#fff;--ink:#3d3830;--sub:#6f6a62;--line:#e6e4df;--brown:#6b4f3a}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#1e1c19;--card:#2a2724;--ink:#ece7df;--sub:#a9a49b;--line:#3b3733;--brown:#d3b394}}
:root[data-theme="dark"]{--bg:#1e1c19;--card:#2a2724;--ink:#ece7df;--sub:#a9a49b;--line:#3b3733;--brown:#d3b394}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);line-height:1.6;
  font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif}
.wrap{max-width:620px;margin:0 auto;padding:20px 12px 90px}
h1{font-size:21px;margin:0 0 4px}
.sub{color:var(--sub);font-size:14px;margin:0 0 6px}
h2{font-size:17px;margin:30px 0 2px;padding-top:12px;border-top:2px solid var(--line)}
.h2sub{color:var(--sub);font-size:12.5px;margin:0 0 12px}
.cell{margin:0 0 20px}
/* 📐 상세·요리모드를 나란히 — 「어울리나」는 두 자리에서 다르게 보인다 */
.two{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.two figure{margin:0}
.two img{width:100%;display:block;border:1px solid var(--line);border-radius:10px}
.two figcaption{font-size:11px;color:var(--sub);margin-top:4px;text-align:center}
.cap{font-size:13.5px;color:var(--sub);margin-top:6px}
.cap b{color:var(--ink);font-size:15px}
.pick{display:flex;gap:6px;margin-top:7px}
.pick button{flex:1;padding:9px 4px;border:1.5px solid var(--line);border-radius:9px;
  background:var(--card);color:var(--sub);font:inherit;font-size:13px;font-weight:700;cursor:pointer}
.pick button[aria-pressed="true"]{background:var(--brown);color:var(--card);border-color:var(--brown)}
.cell.done img{outline:3px solid var(--brown);outline-offset:2px}
.bar{position:sticky;bottom:0;background:var(--card);border-top:1px solid var(--line);
  margin:22px -12px -90px;padding:12px 14px calc(14px + env(safe-area-inset-bottom))}
#cnt{font-size:13px;color:var(--sub);font-weight:700}
#out{font-size:12.5px;white-space:pre-wrap;background:var(--bg);border-radius:10px;padding:10px;margin:8px 0 0;
  font-family:ui-monospace,Menlo,monospace;max-height:150px;overflow:auto}
#copy{width:100%;margin-top:8px;padding:12px;border:0;border-radius:11px;background:var(--brown);
  color:var(--card);font:inherit;font-size:14.5px;font-weight:800;cursor:pointer}
</style><div class="wrap">
<h1>종이 넷 × 손글씨 여섯</h1>
<p class="sub">네가 「좋다」 한 종이 넷에 손글씨 여섯을 얹었어. 전부 <b>실제 요리 모드 화면</b>이야.<br>
⭐ 종이는 그대로 두고 <b>글씨만</b> 바뀌어 — 어느 짝이 제일 「내가 쓴 메모」 같은지 봐줘.</p>
${묶음}
<div class="bar">
  <div id="cnt">아직 안 골랐어</div>
  <div id="out">아직 아무것도 안 골랐어</div>
  <button id="copy">복사하기</button>
</div>
</div>
<script>
(function(){
  var KEY='hankki:종이글씨-0820';
  var saved={};
  try{ saved=JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ saved={}; }
  var cells=[].slice.call(document.querySelectorAll('.cell'));
  function 그리기(){
    var n=0, lines=[];
    cells.forEach(function(c){
      var k=c.getAttribute('data-k'), v=saved[k];
      c.classList.toggle('done', !!v);
      [].slice.call(c.querySelectorAll('.pick button')).forEach(function(b){
        b.setAttribute('aria-pressed', b.getAttribute('data-v')===v ? 'true':'false');
      });
      if(v){ n++; lines.push(k.replace('__',' + ')+' — '+v); }
    });
    document.getElementById('cnt').textContent = n ? (n+' / '+cells.length+' 골랐어') : '아직 안 골랐어';
    document.getElementById('out').textContent = lines.length ? lines.join('\\n') : '아직 아무것도 안 골랐어';
  }
  cells.forEach(function(c){
    c.querySelector('.pick').addEventListener('click', function(e){
      var b=e.target.closest('button'); if(!b) return;
      var k=c.getAttribute('data-k'), v=b.getAttribute('data-v');
      if(saved[k]===v){ delete saved[k]; } else { saved[k]=v; }
      try{ localStorage.setItem(KEY, JSON.stringify(saved)); }catch(e){}
      그리기();
    });
  });
  document.getElementById('copy').addEventListener('click', function(){
    var t=document.getElementById('out').textContent, btn=this;
    function 골라주기(){
      var r=document.createRange(); r.selectNodeContents(document.getElementById('out'));
      var s=window.getSelection(); s.removeAllRanges(); s.addRange(r);
      btn.textContent='글자가 골라졌어 — 길게 눌러 복사해줘';
    }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(t).then(function(){
        btn.textContent='복사했어';
        setTimeout(function(){ btn.textContent='복사하기'; }, 2000);
      }, 골라주기);
    } else { 골라주기(); }
  });
  그리기();
})();
</script>`

const 낼판 = join(OUT, '종이글씨.html')
writeFileSync(낼판, html)
console.log(`\n📸 ${컷들.length}컷 (종이 ${종이들.length} × 글씨 ${글씨들.length})`)
console.log('판 →', 낼판, `(${Math.round(html.length / 1024)}KB)`)
