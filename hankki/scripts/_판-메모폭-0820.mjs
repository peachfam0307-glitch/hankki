// 📐 상세에서 메모지가 «작다» — 폭 갈래 셋을 실제 화면에 그려 견준다 (2026-08-20)
//
// 📮 창업자 = *"상세레시피에서는 사이즈가 좀 작네?"*
//
// 🔢 실측이 그 말을 뒷받침했다 — 메모지가 **어느 화면에서든 238px 고정**이다:
//    | 화면 | 메모지 | 옆 재료줄 |
//    |---|---:|---:|
//    | 폰 (390) | 238px | 350px |
//    | 패드 세로 (820) | 238px | 429px |
//    | 패드 가로 (1180) | 238px | 652px |
//
// 🔎 왜 = 상세는 메모지를 `display:flex; justify-content:center` 안에 넣는다.
//    flex 자식은 «글자 길이만큼»만 차지한다 → 자리가 넓어도 안 늘어난다.
//    ⭐ 요리 모드는 자리가 `maxWidth:460` 인 블록이라 폭을 받아서 339px 로 나온다.
//
// ⛔ 이건 시안 문제가 «아니라» 앱 코드 문제다 — 어느 종이를 골라도 상세에선 작게 나온다.
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
await new Promise((r) => srv.listen(4400, r))

// 📐 폭 갈래 — 「담긴 칸」(폰 350 · 패드가로 652)을 얼마나 쓰나
const 갈래 = [
  ['지금', 0, '지금 그대로 — 글자 길이만큼 (238px 고정)'],
  ['70', 0.70, '자리의 70% — 폰 245px · 패드가로 456px'],
  ['85', 0.85, '자리의 85% — 폰 298px · 패드가로 554px'],
  ['100', 1.00, '자리를 꽉 — 폰 350px · 패드가로 652px (재료줄과 같은 폭)'],
]
// 창업자가 「좋다」 한 넷
const 종이들 = [
  ['cout01', '쿠튀르 · 노랑 프릴'],
  ['s3_1_01', '자수 · 구름'],
  ['s3_4_01', '자수 · 초록 깅엄'],
  ['s3_5_01', '자수 · 파란 홈질 ＋ 숟가락'],
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

const p0 = await ctx.newPage()
await p0.addInitScript(SEED_COACH_SEEN)
await p0.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1') })
await p0.goto('http://127.0.0.1:4400/', { waitUntil: 'networkidle' })
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

const 자리 = async (p) => {
  const r = await p.evaluate(() => {
    const el = [...document.querySelectorAll('.memo-note')].pop()
    if (!el) return null
    const b = el.getBoundingClientRect()
    return { top: b.top, height: b.height, 화면: window.innerHeight }
  })
  if (!r) return undefined
  const 위 = Math.max(0, Math.round(r.top - 150))
  return { x: 0, y: 위, width: 390, height: Math.min(Math.round(r.height + 150 + 260), Math.round(r.화면 - 위)) }
}

const 컷들 = []
for (const [종이키, 종이설명] of 종이들) {
  for (const [갈래키, 비율, 갈래설명] of 갈래) {
    const p = await ctx.newPage()
    await p.addInitScript(SEED_COACH_SEEN)
    await p.goto('http://127.0.0.1:4400/', { waitUntil: 'networkidle' })
    await p.waitForTimeout(700)
    await p.click(`text=${제목}`)
    await p.waitForSelector('.memo-note', { timeout: 10000 })
    const { w, h } = 재기(종이키)
    const 잰폭 = await p.evaluate(({ url, w, h, 비율 }) => {
      const el = [...document.querySelectorAll('.memo-note')].pop()
      if (!el) return 0
      el.classList.add('paper')
      el.style.setProperty('background-image', `url(${url})`, 'important')
      el.style.setProperty('background-size', '100% 100%', 'important')
      el.style.setProperty('background-repeat', 'no-repeat', 'important')
      el.style.aspectRatio = `${w}/${h}`
      // 📐 비율 0 = 지금 그대로(손 안 댐)
      if (비율 > 0) el.style.width = `${Math.round(el.parentElement.getBoundingClientRect().width * 비율)}px`
      el.style.display = 'flex'
      el.style.alignItems = 'center'
      el.style.justifyContent = 'center'
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
      // 🔤 연필체 고정 — 글씨체는 따로 고르는 중이라 여기선 «폭»만 본다
      if (body) {
        body.style.fontFamily = "'Poor Story','Gowun Dodum',sans-serif"
        body.style.fontSize = '1.06em'
        body.style.lineHeight = '1.22'
        body.style.marginTop = '1px'
      }
      return Math.round(el.getBoundingClientRect().width)
    }, { url: 데이터(종이키), w, h, 비율 })
    await p.waitForTimeout(320)
    const 낼곳 = `${OUT}/폭-${종이키}-${갈래키}.png`
    await p.screenshot({ path: 낼곳, clip: await 자리(p) })
    컷들.push({ 종이키, 종이설명, 갈래키, 갈래설명, 잰폭, 파일: 낼곳 })
    await p.close()
  }
}

await ctx.close(); await b.close(); srv.close()

const b64 = (p) => 'data:image/png;base64,' + readFileSync(p).toString('base64')
const 묶음 = 종이들.map(([종이키, 종이설명]) => {
  const 줄 = 컷들.filter((c) => c.종이키 === 종이키).map((c) => `
    <div class="cell" data-k="${c.종이키}__${c.갈래키}">
      <img src="${b64(c.파일)}" alt="${c.갈래키}">
      <div class="cap"><b>${c.갈래키 === '지금' ? '지금 그대로' : '자리의 ' + c.갈래키 + '%'}</b> · 폰에서 ${c.잰폭}px<br><span class="dim">${c.갈래설명}</span></div>
      <div class="pick">
        <button data-v="좋다">좋다</button>
        <button data-v="모르겠다">모르겠다</button>
        <button data-v="버린다">버린다</button>
      </div>
    </div>`).join('')
  return `<h2>${종이설명}</h2>\n${줄}`
}).join('\n')

const html = `<title>상세에서 메모지 폭</title>
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
h2{font-size:17px;margin:30px 0 12px;padding-top:12px;border-top:2px solid var(--line)}
.cell{margin:0 0 20px}
.cell img{width:100%;display:block;border:1px solid var(--line);border-radius:10px}
.cap{font-size:13px;color:var(--sub);margin-top:6px}
.cap b{color:var(--ink);font-size:14.5px}
.dim{font-size:11.5px;opacity:.8}
.pick{display:flex;gap:6px;margin-top:7px}
.pick button{flex:1;padding:9px 4px;border:1.5px solid var(--line);border-radius:9px;
  background:var(--card);color:var(--sub);font:inherit;font-size:13px;font-weight:700;cursor:pointer}
.pick button[aria-pressed="true"]{background:var(--brown);color:var(--card);border-color:var(--brown)}
.cell.done img{outline:3px solid var(--brown);outline-offset:2px}
.note{background:var(--card);border:1px solid var(--line);border-radius:13px;padding:13px;font-size:13px;color:var(--sub);margin:16px 0 0}
.bar{position:sticky;bottom:0;background:var(--card);border-top:1px solid var(--line);
  margin:22px -12px -90px;padding:12px 14px calc(14px + env(safe-area-inset-bottom))}
#cnt{font-size:13px;color:var(--sub);font-weight:700}
#out{font-size:12.5px;white-space:pre-wrap;background:var(--bg);border-radius:10px;padding:10px;margin:8px 0 0;
  font-family:ui-monospace,Menlo,monospace;max-height:150px;overflow:auto}
#copy{width:100%;margin-top:8px;padding:12px;border:0;border-radius:11px;background:var(--brown);
  color:var(--card);font:inherit;font-size:14.5px;font-weight:800;cursor:pointer}
</style><div class="wrap">
<h1>상세에서 메모지 폭</h1>
<p class="sub">창업자 = <b>"상세레시피에서는 사이즈가 좀 작네?"</b> — 맞아. 재서 확인했어.</p>
<div class="note">🔢 <b>메모지가 어느 화면에서든 238px 고정</b>이야 — 옆 재료줄은 폰 350px · 패드가로 652px 인데.<br>
🔎 상세가 메모지를 <b>가운데 정렬 상자</b>에 넣어서 «글자 길이만큼»만 차지하거든. 자리가 넓어도 안 늘어나.<br>
⛔ 이건 <b>시안 문제가 아니라 앱 코드 문제</b>야 — 어느 종이를 골라도 상세에선 작게 나와.<br>
⭐ 글씨체는 <b>연필체로 고정</b>했어. 여기선 «폭»만 봐줘.</div>
${묶음}
<div class="bar">
  <div id="cnt">아직 안 골랐어</div>
  <div id="out">아직 아무것도 안 골랐어</div>
  <button id="copy">복사하기</button>
</div>
</div>
<script>
(function(){
  var KEY='hankki:메모폭-0820';
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

const 낼판 = join(OUT, '메모폭.html')
writeFileSync(낼판, html)
console.log(`\n📸 ${컷들.length}컷 (종이 ${종이들.length} × 폭 ${갈래.length})`)
console.log('폭 실측:', 컷들.filter((c) => c.종이키 === 'cout01').map((c) => `${c.갈래키}=${c.잰폭}px`).join(' · '))
console.log('판 →', 낼판, `(${Math.round(html.length / 1024)}KB)`)
