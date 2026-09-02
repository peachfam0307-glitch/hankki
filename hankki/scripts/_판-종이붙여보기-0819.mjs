// 📸 종이 일곱을 «실제 레시피 화면»에 붙여서 찍는다 (2026-08-19)
//
// 📮 창업자 = *"실제로 우리레시피판에 붙여볼수있어? **뭐가잘어울리는지봐야하니까**"*
//    ⭐ 맞는 요구다 — 종이만 따로 보면 모른다. 레시피 화면에 «붙은 채»로 봐야 어울리는지 안다.
//       (절대원칙 30 = 보여주는 판은 앱이 화면에 쓰는 바로 그 값이라야 한다)
//
// ⭐ 두 자리를 다 찍는다 — 종이가 자리마다 다르게 보인다:
//    ① 레시피 상세(재료 위 · 크림 배경 · 옆에 표지·설명이 있다)
//    ② 요리 모드 재료 준비(가운데 정렬 · 넓은 여백)
//
// ⛔ page.reload() ＋ addInitScript 안 쓴다(시드가 덮는다) — 같은 컨텍스트에 «새 탭»
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
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
await new Promise((r) => srv.listen(4398, r))

// 🎨 창업자가 2026-08-19 밤에 새로 뽑아 준 13컷 — 세 갈래
//    ① 시트1 = 「프랑스 쿠튀르」(지피티 미감 · 리본·진주·퀼트)  ⑥컷
//    ② 시트2 = 스티커 결 — ⛔창업자 판정 *"숟가락 노랑색만 그나마 쓸만하고 나머지는 촌스러워서 버려줘"*  ①컷
//    ③ 시트3 = 창업자가 직접 쓴 프롬프트(자수·수채화)  ⑥컷
// 🎨 쿠튀르 6 ＋ 자수 5 = 11컷. 둘 다 `tools/cut.py`(표준 도구)로 잘랐다.
//    ⭐ 쿠튀르를 «먼저» 놓는다 — 창업자가 아직 못 본 새 갈래라 판정이 필요한 쪽이다.
//    ⛔ 자수 5컷은 이미 1차안이 있다(s3_1·s3_4·s3_5 좋다 / s3_2 모르겠다 / s3_3 버린다) — 견줌용으로만 둔다.
const 종이들 = [
  ['cout01', '쿠튀르 · 노랑 프릴 ＋ 파란 장미'],
  ['cout02', '쿠튀르 · 트위드 ＋ 살구 리본'],
  ['cout03', '쿠튀르 · 퀼트 ＋ 하트 단추'],
  ['cout04', '쿠튀르 · 세이지 리본 ＋ 체리'],
  ['cout05', '쿠튀르 · 진주 ＋ 파란 리본'],
  ['cout06', '쿠튀르 · 파랑노랑 뜨개 ＋ 꽃'],
  ['s3_1_01', '자수 · 구름 ＋ 파란 단추  〔1차안 = 좋다〕'],
  ['s3_2_01', '자수 · 파랑 가죽 ＋ 리본  〔1차안 = 모르겠다〕'],
  ['s3_3_01', '자수 · 갈색 깅엄 프릴 ＋ 하트  〔1차안 = 버린다〕'],
  ['s3_4_01', '자수 · 초록 깅엄 ＋ 꽃  〔1차안 = 좋다〕'],
  ['s3_5_01', '자수 · 파란 홈질 ＋ 나무 숟가락  〔1차안 = 좋다〕'],
]
// ⭐ 그림 크기는 PNG 헤더에서 «직접» 읽는다 — 손으로 적으면 그림을 갈 때 낡는다
// ⛔ 아직 앱 자산이 «아니다» — 창업자가 방금 준 시안이라 scratchpad 에서 읽는다.
//    고른 뒤에 큰 판으로 다시 받아  로 들어간다.
const 컷폴더 = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/표준컷'
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
await p0.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
await p0.goto('http://127.0.0.1:4398/', { waitUntil: 'networkidle' })
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

// 📐 메모지가 «지금 화면 어디»에 있나 — 잘라 찍을 네모를 돌려준다
//    ⛔ 고정 숫자로 자르면 컷마다 종이 높이가 달라 위가 잘린다(창업자가 잡았다).
//       ✅ 그때그때 «재서» 자른다.
//    ⛔⛔ ＋ 창업자 = *"이건 레시피상세가 안보이고 거의 라벨만 보여서 판단 어려워"*
//       → 종이만 크게 보여주면 «어울리나»를 못 본다. 위·아래로 «주변»을 넉넉히 남긴다.
//       ⭐ 위 = 표지·제목이 조금 보이게 · 아래 = 재료 목록이 서너 줄 보이게.
const 자리 = async (p, { 위여유 = 150, 아래여유 = 300 } = {}) => {
  const r = await p.evaluate(() => {
    const els = [...document.querySelectorAll('.memo-note')]
    const el = els[els.length - 1]
    if (!el) return null
    const b = el.getBoundingClientRect()
    return { top: b.top, height: b.height, 화면: window.innerHeight }
  })
  if (!r) return undefined
  const 위 = Math.max(0, Math.round(r.top - 위여유))
  // ⛔ 화면 밖을 자르면 Playwright 가 죽는다 — 남은 높이 안으로 묶는다
  const 높이 = Math.min(Math.round(r.height + 위여유 + 아래여유), Math.round(r.화면 - 위))
  return { x: 0, y: 위, width: 390, height: 높이 }
}

const 갈아끼우기 = async (p, k) => {
  const { w, h } = 재기(k)
  await p.evaluate(({ url, w, h }) => {
    // ⛔⛔ `querySelector` 는 «첫째»를 잡는다 — 화면을 쌓으면 이전 화면(상세)이 DOM 에 남아
    //    요리 모드에서도 «상세의» 메모를 갈아끼웠다(그래서 13컷이 전부 같은 종이로 나왔다).
    //    ✅ 맨 «마지막» 것 = 지금 화면의 것.
    const els = [...document.querySelectorAll('.memo-note')]
    const el = els[els.length - 1]
    if (!el) return
    el.classList.add('paper')
    // ⛔ `MemoNote` 에 기본 종이가 박혀 있어(`기본종이`) 그냥 넣으면 안 이긴다 → priority 로 못 박는다
    el.style.setProperty('background-image', `url(${url})`, 'important')
    el.style.setProperty('background-size', '100% 100%', 'important')
    el.style.setProperty('background-repeat', 'no-repeat', 'important')
    el.style.width = '100%'
    el.style.aspectRatio = `${w}/${h}`
    el.style.display = 'flex'
    el.style.alignItems = 'center'
    el.style.justifyContent = 'center'
    el.style.margin = '0 auto'
    // 글자를 종이 «안전지대»(가운데 74%)에만 — 가장자리 장식을 피한다
    let inner = el.querySelector('.memo-inner')
    if (!inner) {
      inner = document.createElement('div')
      inner.className = 'memo-inner'
      inner.style.cssText = 'width:72%;text-align:center;font-size:0.92em;line-height:1.35'
      while (el.firstChild) inner.appendChild(el.firstChild)
      el.appendChild(inner)
    }
  }, { url: 데이터(k), w, h })
  await p.waitForTimeout(220)
}

// ── ① 레시피 상세 ────────────────────────────────
const 상세컷 = []
for (const [k, 설명] of 종이들) {
  const p = await ctx.newPage()
  await p.addInitScript(SEED_COACH_SEEN)
  await p.goto('http://127.0.0.1:4398/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(700)
  await p.click(`text=${제목}`)
  await p.waitForSelector('.memo-note', { timeout: 10000 })
  await 갈아끼우기(p, k)
  // 📐 메모지 둘레만 잘라 찍는다 — «크게 보여야» 색·모양이 판정된다
  //    ⛔ 첫 판은 메모지가 통째로 빠졌다. 뿌리 = `querySelector` 가 «첫째»(이전 화면)를 잡았다.
  //       그래서 화면을 통째로 찍는 쪽으로 도망갔는데, 그러면 메모지가 화면의 1/10 이라
  //       **줄여 담는 순간 색도 모양도 안 보인다**(창업자 = *"다 잘리고 색이랑 모양이 잘 안보여"*).
  //    ✅ 이제 좌표는 «마지막» 것으로 제대로 잡는다 → 잘라 찍어도 안 빗나간다.
  //    ⭐ 위아래로 주변을 조금 남긴다 — 「어울리나」는 주변과 함께라야 보인다.
  const 낼곳 = `${OUT}/붙여-상세-${k}.png`
  // ⭐ 상세는 «위»에 표지·제목·시간칩이 있다 → 위를 넉넉히 남겨야 「레시피 화면」으로 읽힌다
  await p.screenshot({ path: 낼곳, clip: await 자리(p, { 위여유: 330, 아래여유: 300 }) })
  상세컷.push([k, 설명, 낼곳])
  await p.close()
}

// ── ② 요리 모드 재료 준비 ─────────────────────────
const 요리컷 = []
for (const [k, 설명] of 종이들) {
  const p = await ctx.newPage()
  await p.addInitScript(SEED_COACH_SEEN)
  await p.goto('http://127.0.0.1:4398/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(700)
  await p.click(`text=${제목}`)
  await p.waitForTimeout(700)
  await p.click('text=요리 시작')
  await p.waitForSelector('.memo-note', { timeout: 10000 })
  await 갈아끼우기(p, k)
  const 낼곳 = `${OUT}/붙여-요리-${k}.png`
  await p.screenshot({ path: 낼곳, clip: await 자리(p) })
  요리컷.push([k, 설명, 낼곳])
  await p.close()
}

await ctx.close(); await b.close(); srv.close()

// ── 판 만들기 (아티팩트용 · 문서 껍데기 없이) ───────
// ☑️☑️ 창업자 절대원칙(2026-08-19) = **검수판은 무조건 체크 ＋ 복사가 된다.**
//    📮 *"체크표시하는거 만들어주면 체크할게. 복사되게(무조건 검수판은 체크+복사되게 만들어줘) 앞으로 모든 검수판에"*
//    ⭐ 창업자는 폰에서 판정한다 — 체크가 없으면 어디까지 봤는지 잃고, 복사가 없으면 손으로 다시 친다.
const b64 = (p) => 'data:image/png;base64,' + readFileSync(p).toString('base64')

// 두 자리를 «한 칸»에 나란히 — 같은 종이가 상세·요리모드에서 어떻게 보이나 한눈에
const 칸 = 종이들.map(([k, 설명]) => {
  const 상 = 상세컷.find((x) => x[0] === k)
  const 요 = 요리컷.find((x) => x[0] === k)
  return `
  <section class="cell" data-k="${k}">
    <div class="head"><b>${k}</b> · ${설명}</div>
    <div class="shots">
      ${요 ? `<figure><figcaption>요리 모드 — 만들 때</figcaption><img src="${b64(요[2])}" alt=""></figure>` : ''}
      ${상 ? `<figure><figcaption>레시피 상세 — 볼 때</figcaption><img src="${b64(상[2])}" alt=""></figure>` : ''}
    </div>
    <div class="pick" role="group" aria-label="${k} 판정">
      <button data-v="좋다">좋다</button>
      <button data-v="모르겠다">모르겠다</button>
      <button data-v="버린다">버린다</button>
    </div>
  </section>`
}).join('')

const html = `<title>메모지 검수 — 레시피에 붙여본 것</title>
<style>
:root{--bg:#f3f2ef;--card:#fff;--ink:#3d3830;--sub:#6f6a62;--line:#e6e4df;--brown:#6b4f3a;
  --ok:#4f7a4f;--okbg:#e8f0e8;--no:#a4564a;--nobg:#f7ece9;--may:#8a7a52;--maybg:#f4efe0}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#1e1c19;--card:#2a2724;--ink:#ece7df;--sub:#a9a49b;--line:#3b3733;--brown:#d3b394;
  --ok:#9dbd9d;--okbg:#2b3a2b;--no:#d99a8e;--nobg:#3b2b28;--may:#c9b782;--maybg:#3a352a}}
:root[data-theme="dark"]{--bg:#1e1c19;--card:#2a2724;--ink:#ece7df;--sub:#a9a49b;--line:#3b3733;--brown:#d3b394;
  --ok:#9dbd9d;--okbg:#2b3a2b;--no:#d99a8e;--nobg:#3b2b28;--may:#c9b782;--maybg:#3a352a}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);line-height:1.6;
  font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif}
.wrap{max-width:620px;margin:0 auto;padding:20px 12px 90px}
h1{font-size:21px;margin:0 0 4px}
.sub{color:var(--sub);font-size:13.5px;margin:0 0 18px}
.cell{background:var(--card);border:1px solid var(--line);border-radius:15px;padding:13px;margin:0 0 18px}
.cell.done{border-color:var(--brown)}
.head{font-size:13.5px;color:var(--sub);margin:0 0 10px}
.head b{color:var(--ink);font-size:14.5px}
.shots{display:flex;flex-direction:column;gap:10px}
figure{margin:0}
figcaption{font-size:11.5px;color:var(--sub);margin:0 0 4px}
.shots img{width:100%;display:block;border:1px solid var(--line);border-radius:10px}
.pick{display:flex;gap:7px;margin-top:11px}
.pick button{flex:1;padding:11px 6px;border:1.5px solid var(--line);border-radius:11px;
  background:transparent;color:var(--sub);font:inherit;font-size:13.5px;font-weight:700;cursor:pointer}
.pick button[aria-pressed="true"][data-v="좋다"]{background:var(--okbg);color:var(--ok);border-color:var(--ok)}
.pick button[aria-pressed="true"][data-v="버린다"]{background:var(--nobg);color:var(--no);border-color:var(--no)}
.pick button[aria-pressed="true"][data-v="모르겠다"]{background:var(--maybg);color:var(--may);border-color:var(--may)}
.bar{position:sticky;bottom:0;background:var(--bg);padding:10px 0 6px;margin-top:10px;border-top:1px solid var(--line)}
.count{font-size:12.5px;color:var(--sub);margin-bottom:7px}
#copy{width:100%;padding:14px;border:0;border-radius:13px;background:var(--brown);color:var(--card);
  font:inherit;font-size:15px;font-weight:800;cursor:pointer}
#out{white-space:pre-wrap;font-size:12.5px;background:var(--card);border:1px solid var(--line);
  border-radius:11px;padding:11px;margin-top:9px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.note{background:var(--card);border:1px solid var(--line);border-radius:13px;padding:13px;font-size:12.5px;color:var(--sub);margin:18px 0}
</style><div class="wrap">
<h1>메모지 검수</h1>
<p class="sub">표준 도구로 자른 <b>${종이들.length}컷</b>을 «실제 앱 화면»에 붙여 찍었어.<br>
칸마다 골라주면 맨 아래에서 <b>한 번에 복사</b>돼.</p>

<div class="note">⭐ 볼 것 셋 — ⑴아래 재료 목록과 톤이 맞나 ⑵글씨가 장식에 안 가리나 ⑶세로를 얼마나 먹나<br>
⚠️ 글씨체는 아직 기본 고딕이야. 종이를 고른 뒤 손글씨를 얹으면 느낌이 또 달라져.</div>

${칸}

<div class="bar">
  <div class="count" id="cnt"></div>
  <button id="copy">복사하기</button>
  <div id="out">아직 아무것도 안 골랐어</div>
</div>
</div>
<script>
(function(){
  var KEY='hankki:메모지검수-0819'
  var 고른것={}
  try{ 고른것=JSON.parse(localStorage.getItem(KEY)||'{}') }catch(e){}
  var cells=[].slice.call(document.querySelectorAll('.cell'))
  function 그리기(){
    cells.forEach(function(c){
      var k=c.dataset.k, v=고른것[k]
      c.classList.toggle('done', !!v);
      // ⛔⛔ 세미콜론이 «반드시» 있어야 한다 — 없으면 JS 가 다음 줄의 대괄호를 이어 붙여 읽어
      //    구문 오류로 **스크립트가 통째로 죽는다.**
      //    2026-08-19 실제 사고 = 체크가 하나도 안 눌렸다(창업자 = *"검수판에체크가 안눌려"*).
      //    📌 판을 만들면 «열어서 실제로 눌러본다» — 보이는 것과 도는 것은 다르다(절대원칙 21).
      //    ⛔ 이 주석에 백틱을 쓰면 «판 스크립트 자체»가 깨진다(여기는 템플릿 문자열 안이다).
      [].slice.call(c.querySelectorAll('.pick button')).forEach(function(b){
        b.setAttribute('aria-pressed', String(b.dataset.v===v))
      })
    })
    var n=Object.keys(고른것).length
    document.getElementById('cnt').textContent = n+' / '+cells.length+' 골랐어'
    var 줄=[]
    cells.forEach(function(c){
      var k=c.dataset.k, v=고른것[k]
      if(v) 줄.push(k+' — '+v)
    })
    document.getElementById('out').textContent = 줄.length ? 줄.join('\\n') : '아직 아무것도 안 골랐어'
  }
  cells.forEach(function(c){
    c.addEventListener('click', function(e){
      var b=e.target.closest('.pick button'); if(!b) return
      var k=c.dataset.k
      if(고른것[k]===b.dataset.v) delete 고른것[k]; else 고른것[k]=b.dataset.v
      try{ localStorage.setItem(KEY, JSON.stringify(고른것)) }catch(e){}
      그리기()
    })
  })
  // ⛔ clipboard 는 «성공으로 resolve 되고도» 실제 복사가 안 되는 폰이 있다(v10.97 교훈)
  //    → 실패하면 글자를 골라 준다. 길게 눌러 복사하면 된다.
  document.getElementById('copy').onclick=function(){
    var t=document.getElementById('out').textContent
    var 골라주기=function(){
      var r=document.createRange(); r.selectNodeContents(document.getElementById('out'))
      var s=window.getSelection(); s.removeAllRanges(); s.addRange(r)
      document.getElementById('copy').textContent='글자가 골라졌어 — 길게 눌러 복사해줘'
    }
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(t).then(function(){
        document.getElementById('copy').textContent='복사했어'
        setTimeout(function(){document.getElementById('copy').textContent='복사하기'},1800)
      }, 골라주기)
    } else 골라주기()
  }
  그리기()
})()
</script>`

const 낼판 = join(OUT, '종이붙여보기.html')
writeFileSync(낼판, html)
console.log(`\n📸 상세 ${상세컷.length}컷 · 요리모드 ${요리컷.length}컷`)
console.log('판 →', 낼판, `(${Math.round(html.length / 1024)}KB)`)
