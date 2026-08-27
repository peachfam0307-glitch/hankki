// 🖼 [2026-08-22] 줄바꿈 시안판 만들기 — 장바구니 윗글 5 ＋ 상세 광고 4
//
// 📮 창업자 = *"장바구니 2줄도 예쁘게 정리해야할 것 같아."* ＋ *"레시피상세에서 광고도 줄바꿈 손보고"*
//    → *"시안보여줄래"*
//
// ⭐ 「바뀌는 자리」만 잘라 찍는다 — 전체 화면을 나란히 놓으면 «어디가 다른지» 안 보인다.
//    (2026-08-21 에 같은 크기로 안 잘라 보여줬다가 창업자가 *"더 커진거 맞아?"* 로 잡았다)
// ☑️ 검수판 절대원칙(2026-08-19) = **체크 ＋ 복사**
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판만들기-줄바꿈-0822.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/줄바꿈시안.html'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4443, r))

// ── 손보기 조각 (판 두 개에서 쓰던 것을 한곳에) ──
const 심기 = () => {
  window.__고지 = () => [...document.querySelectorAll('.t-sub')].find((e) => /수수료를 받지 않아요/.test(e.innerText || ''))
  window.__소개 = () => [...document.querySelectorAll('.t-sub')].find((e) => /계속 올라와요/.test(e.innerText || ''))
  window.__광고줄 = () => {
    const 후보 = [...document.querySelectorAll('*')].filter((e) => /주부의 장바구니에서 고른 재료/.test(e.innerText || '') && e.children.length <= 4)
    const 제목 = 후보[후보.length - 1]
    if (!제목 || !제목.parentElement) return []
    return [...제목.parentElement.children].filter((el) => {
      const cs = getComputedStyle(el)
      return cs.display === 'flex' && el.querySelector('img') && /사러가기|매장에서/.test(el.innerText || '')
    })
  }
}
const 조각 = {
  고지작게: () => { const e = window.__고지(); if (!e) return 0; e.style.fontSize = '13.5px'; e.style.opacity = '.72'; e.style.marginTop = '2px'; return 1 },
  소개갈라: () => { const e = window.__소개(); if (!e) return 0; e.innerHTML = e.innerHTML.replace(/\s·\s/g, '<br>'); return 1 },
  설명두줄: () => { let n = 0; for (const e of document.querySelectorAll('.t-sub')) if (getComputedStyle(e).webkitLineClamp === '1') { e.style.webkitLineClamp = '2'; n++ } return n },
  배지아래로: () => { let n = 0; for (const el of window.__광고줄()) { const g = [...el.children].find((c) => c.tagName === 'DIV'); if (!g) continue; const 이름 = g.children[0], 배지 = g.children[1]; if (!이름) continue; 이름.style.display = 'block'; if (배지) { 배지.style.display = 'inline-block'; 배지.style.marginLeft = '0'; 배지.style.marginTop = '3px' } n++ } return n },
  단추아래로: () => { let n = 0; for (const el of window.__광고줄()) { el.style.flexWrap = 'wrap'; const 끝 = el.lastElementChild; if (끝) { 끝.style.marginLeft = '40px'; 끝.style.marginTop = '4px' } const g = [...el.children].find((c) => c.tagName === 'DIV'); if (g) g.style.flexBasis = 'calc(100% - 40px)'; n++ } return n },
  단추작게: () => { let n = 0; for (const el of window.__광고줄()) { const 끝 = el.lastElementChild; if (!끝) continue; 끝.style.fontSize = '14px'; 끝.style.padding = '5px 9px'; n++ } return n },
}

const 장 = [
  { key: '장ㄱ', 이름: '지금 그대로', 설명: '소개 2줄 ＋ 고지 2줄 = 넉 줄 · 제품 설명은 한 줄만', 손: [] },
  { key: '장ㄴ', 이름: '고지를 작고 연하게', 설명: '소개가 앞에 서고, 고지는 한 발 물러선다', 손: ['고지작게'] },
  { key: '장ㄷ', 이름: '＋ 소개를 세 줄로 갈라', 설명: '가운뎃점 → 줄바꿈. 세 가지 말이 각자 한 줄', 손: ['고지작게', '소개갈라'] },
  { key: '장ㄹ', 이름: '＋ 제품 설명 두 줄', 설명: '⭐지금은 한 줄이라 「…어울려요.…」로 점이 넷처럼 보인다', 손: ['고지작게', '설명두줄'] },
  { key: '장ㅁ', 이름: '소개도 갈라 ＋ 설명 두 줄', 설명: '위 셋을 다 합친 것', 손: ['고지작게', '소개갈라', '설명두줄'] },
]
const 광 = [
  { key: '광ㄱ', 이름: '지금 그대로', 설명: '이름이 두 줄로 갈라지고 배지가 둘째 줄 «끝»에 매달린다', 손: [] },
  { key: '광ㄴ', 이름: '배지를 이름 아래로', 설명: '⭐이름이 온전히 서고 배지가 자기 줄을 갖는다', 손: ['배지아래로'] },
  { key: '광ㄷ', 이름: '「사러가기」를 아래 줄로', 설명: '이름이 폭을 다 쓴다 · ⚠️칸이 세로로 길어진다(59 → 94px)', 손: ['단추아래로'] },
  { key: '광ㄹ', 이름: '배지 아래 ＋ 단추 작게', 설명: '이름 폭을 최대로', 손: ['단추작게', '배지아래로'] },
]

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const 그림 = {}

const 새판 = async () => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4443/hankki/', { waitUntil: 'networkidle' })
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(800)
  return { ctx, p }
}

console.log('\n🖼 줄바꿈 시안판 만들기\n')
// ── 🛒 장보기 ──
for (const g of 장) {
  const { ctx, p } = await 새판()
  await p.evaluate(() => { const bs = [...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')]; bs.find((x) => (x.innerText || '').replace(/\s+/g, '').includes('장보기'))?.click() })
  await p.waitForTimeout(800)
  await p.evaluate(심기)
  for (const 이름 of g.손) await p.evaluate(조각[이름])
  await p.waitForTimeout(250)
  // 「주부의 장바구니」 제목부터 첫 제품 카드 끝까지만 자른다
  const 상자 = await p.evaluate(() => {
    const 후보 = [...document.querySelectorAll('.sec-head')].find((e) => /주부의 장바구니/.test(e.innerText || ''))
    if (!후보) return null
    // ⛔ 첫 판이 «제품 카드»를 못 찾아 자른 자리가 짧았다 → 「설명 두 줄」 시안이 그림에 «안 보였다».
    //    ✅ 「담기」와 「사러가기」를 «둘 다» 가진 상자를 찾는다 — 그게 제품 카드다(클래스 이름에 안 매인다).
    const 카드 = [...document.querySelectorAll('div')].find((e) => /담기/.test(e.innerText || '') && /사러가기/.test(e.innerText || '') && e.getBoundingClientRect().height > 90 && e.getBoundingClientRect().height < 400)
    const a = 후보.getBoundingClientRect()
    const b2 = 카드 ? 카드.getBoundingClientRect() : null
    return { x: 8, y: Math.max(0, a.top - 6), w: 374, h: Math.min(760, (b2 ? b2.bottom : a.bottom + 300) - a.top + 12) }
  })
  const buf = await p.screenshot({ clip: { x: 상자.x, y: 상자.y, width: 상자.w, height: 상자.h } })
  그림[g.key] = buf.toString('base64')
  console.log(`  ${g.key} ${g.이름}  (${Math.round(buf.length / 1024)}KB)`)
  await ctx.close()
}
// ── 🍳 레시피 상세 광고 ──
for (const g of 광) {
  const { ctx, p } = await 새판()
  await p.getByRole('button', { name: /^레시피/ }).last().click()
  await p.waitForTimeout(800)
  await p.locator('.app-frame .screen .grid-card, .app-frame .screen .mini-card').first().click()
  await p.waitForTimeout(900)
  await p.evaluate(심기)
  for (const 이름 of g.손) await p.evaluate(조각[이름])
  await p.mouse.move(195, 500); await p.mouse.wheel(0, 900); await p.waitForTimeout(600)
  const 상자 = await p.evaluate(() => {
    const 후보 = [...document.querySelectorAll('*')].filter((e) => /주부의 장바구니에서 고른 재료/.test(e.innerText || '') && e.children.length <= 4)
    const 제목 = 후보[후보.length - 1]
    if (!제목) return null
    const 칸 = 제목.parentElement.getBoundingClientRect()
    return { x: Math.max(0, 칸.left - 6), y: Math.max(0, 칸.top - 6), w: Math.min(378, 칸.width + 12), h: Math.min(430, 칸.height + 12) }
  })
  if (!상자) { console.log(`  ${g.key} ⛔ 못 찾음`); await ctx.close(); continue }
  // ⛔ screenshot 은 「w·h」가 아니라 「width·height」를 받는다 — 이름이 달라 죽었다
  const buf = await p.screenshot({ clip: { x: 상자.x, y: 상자.y, width: 상자.w, height: 상자.h } })
  그림[g.key] = buf.toString('base64')
  console.log(`  ${g.key} ${g.이름}  (${Math.round(buf.length / 1024)}KB)`)
  await ctx.close()
}
await b.close(); srv.close()

// ───────── HTML ─────────
// 📮 [2026-08-22 · 창업자] *"어려운데ㅠ 일단생각해볼게"* — **판이 어려웠던 게 내 잘못이다.**
//    ⛔ 첫 판은 **아홉 칸을 세로로 쌓아** 놓고 칸마다 고르라고 했다.
//       그러면 창업자는 다섯째 칸을 보면서 «둘째 칸이 어땠는지»를 기억해야 한다. 그건 판정이 아니라 암기다.
//    ✅ 그래서 **자리마다 「지금 ↔ 추천」 «둘만» 나란히** 놓고 A/B 하나로 만든다 — 판정이 아홉 → 둘.
//       나머지 안은 **접어서** 아래에 둔다(지우지 않는다 · 더 보고 싶으면 펴면 된다).
//    📌 규칙 8 — 소모적·시행착오 판단을 창업자에게 넘기지 않는다.
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const 맞대기 = (자리, 지금, 추천, 왜) => `
  <article class="ab" data-k="${esc(자리)}">
    <div class="two">
      <figure><figcaption class="now">지금</figcaption>${그림[지금.key] ? `<img src="data:image/png;base64,${그림[지금.key]}" alt="지금">` : '<p class="no">못 찍었다</p>'}</figure>
      <figure><figcaption class="rec">이렇게 바꾸면</figcaption>${그림[추천.key] ? `<img src="data:image/png;base64,${그림[추천.key]}" alt="바꾼 뒤">` : '<p class="no">못 찍었다</p>'}</figure>
    </div>
    <p class="why">${왜}</p>
    <div class="pick big">
      <button type="button" data-v="바꿔">이걸로 바꿔</button>
      <button type="button" data-v="지금이나아">지금이 나아</button>
      <button type="button" data-v="모르겠어">모르겠어</button>
    </div>
  </article>`
const 칸 = (g) => `
  <article class="c" data-k="${esc(g.key)}">
    <header><span class="tag">${esc(g.key)}</span><div><h3>${esc(g.이름)}</h3><p>${esc(g.설명)}</p></div></header>
    ${그림[g.key] ? `<img src="data:image/png;base64,${그림[g.key]}" alt="${esc(g.이름)}">` : '<p class="no">그림을 못 찍었다</p>'}
    <div class="pick">
      <button type="button" data-v="이걸로">이걸로</button>
      <button type="button" data-v="아니야">아니야</button>
      <button type="button" data-v="모르겠어">모르겠어</button>
    </div>
  </article>`

const html = `<title>줄바꿈 시안</title>
<style>
  :root{--bg:#f6f3ec;--card:#fff;--ink:#2f2a24;--sub:#7c7266;--line:#e6ddcd;--pt:#5878a0;--ok:#3f7d5a}
  :root:not([data-theme="light"]){}
  @media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#1a1916;--card:#242220;--ink:#f0ebe2;--sub:#a79c8d;--line:#3a352e;--pt:#8fb0d6;--ok:#7fbf9a}}
  :root[data-theme="dark"]{--bg:#1a1916;--card:#242220;--ink:#f0ebe2;--sub:#a79c8d;--line:#3a352e;--pt:#8fb0d6;--ok:#7fbf9a}
  body{background:var(--bg);color:var(--ink);margin:0;padding:18px 14px 90px;font-family:-apple-system,'Apple SD Gothic Neo','Pretendard',system-ui,sans-serif;word-break:keep-all;line-height:1.6}
  h1{font-size:21px;margin:0 0 4px}
  .lead{color:var(--sub);font-size:14px;margin:0 0 18px}
  h2{font-size:17px;margin:26px 0 4px;padding-top:14px;border-top:2px solid var(--line)}
  .h2sub{color:var(--sub);font-size:13.5px;margin:0 0 12px}
  .c{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;margin:0 0 14px}
  .c header{display:flex;gap:9px;align-items:flex-start;margin-bottom:9px}
  .tag{flex:0 0 auto;background:var(--pt);color:#fff;font-weight:800;font-size:12.5px;border-radius:7px;padding:3px 8px}
  .c h3{font-size:15.5px;margin:0}
  .c header p{margin:2px 0 0;color:var(--sub);font-size:13.5px}
  .c img{width:100%;height:auto;display:block;border-radius:10px;border:1px solid var(--line)}
  .pick{display:flex;gap:7px;margin-top:10px}
  .pick button{flex:1;padding:9px 0;border-radius:9px;border:1px solid var(--line);background:transparent;color:var(--ink);font-size:14px;font-weight:700;font-family:inherit;cursor:pointer}
  .pick button[aria-pressed="true"]{background:var(--ok);border-color:var(--ok);color:#fff}
  .bar{position:fixed;left:0;right:0;bottom:0;background:var(--card);border-top:1px solid var(--line);padding:10px 14px calc(10px + env(safe-area-inset-bottom));display:flex;gap:8px;align-items:center}
  .bar button{flex:1;padding:12px 0;border-radius:10px;border:none;background:var(--pt);color:#fff;font-size:15px;font-weight:800;font-family:inherit;cursor:pointer}
  .bar span{color:var(--sub);font-size:13px}
  #out{position:fixed;left:14px;right:14px;bottom:70px;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px;font-size:13.5px;white-space:pre-wrap;display:none;max-height:38vh;overflow:auto}
  /* 맞대보기 — 「지금」과 「바꾼 뒤」를 «나란히» 둔다. 눈이 두 그림 사이만 오가면 되게. */
  .ab{background:var(--card);border:2px solid var(--pt);border-radius:14px;padding:12px;margin:0 0 10px}
  .two{display:grid;grid-template-columns:1fr 1fr;gap:9px}
  .two figure{margin:0}
  .two figcaption{font-size:13px;font-weight:800;text-align:center;padding:4px 0 6px;border-radius:7px;margin-bottom:6px}
  .two .now{background:var(--line);color:var(--sub)}
  .two .rec{background:var(--ok);color:#fff}
  .two img{width:100%;height:auto;display:block;border-radius:9px;border:1px solid var(--line)}
  .why{font-size:14px;margin:11px 2px 0;line-height:1.65}
  .mini{color:var(--sub);font-size:13px}
  .pick.big button{padding:12px 0;font-size:14.5px}
  details{margin:0 0 6px}
  summary{cursor:pointer;color:var(--sub);font-size:14px;padding:9px 2px;font-weight:700}
  details[open] summary{margin-bottom:10px}
  .no{color:var(--sub);font-size:13px;text-align:center;padding:20px 0}
</style>
<h1>줄바꿈 시안</h1>
<p class="lead">글자를 키우면서 줄바꿈이 어색해진 두 자리예요. <b>두 번만</b> 골라 주면 돼요 — 「지금」과 「바꾼 뒤」를 나란히 놨어요.</p>

<h2>🛒 장보기 — 「주부의 장바구니」 윗글</h2>
<p class="h2sub">지금은 제품 설명이 <b>한 줄</b>로 잘려서 「…어울려요.…」처럼 <b>점이 넷</b>으로 보여요.</p>
${맞대기('장', 장[0], 장[3], '설명을 <b>두 줄</b>로 풀고, 수수료 고지는 <b>작고 연하게</b> 한 발 물러서게 했어요.<br><span class="mini">⛔ 고지 문장 자체는 지울 수 없어요 — 없으면 「말 안 하고 받는다」로 읽혀요.</span>')}
<details><summary>다른 안 셋도 볼래요?</summary>${[장[1], 장[2], 장[4]].map(칸).join('')}</details>

<h2>🍳 레시피 상세 — 광고(「고른 재료」)</h2>
<p class="h2sub">제품 이름이 두 줄로 갈라지고 「쿠팡」 배지가 <b>둘째 줄 끝에 혼자 매달려요</b>.</p>
${맞대기('광', 광[0], 광[1], '배지를 <b>이름 아래</b>로 내렸어요. 이름이 갈리던 칸 <b>셋 → 하나</b>.<br><span class="mini">📏 대신 칸이 <b>30px 길어져요</b>(59 → 83·62·62). 「사러가기」를 아래로 내리는 안은 103px 길어져서 접었어요.<br>⛔ 제품 이름은 안 잘라요 — 이름이 안 보이면 살 수가 없으니까요.</span>')}
<details><summary>다른 안 둘도 볼래요?</summary>${[광[2], 광[3]].map(칸).join('')}</details>

<div id="out"></div>
<div class="bar"><span id="n">0개 고름</span><button id="copy">고른 것 복사하기</button></div>
<script>
  var KEY = 'hankki-줄바꿈시안-0822'
  var 고름 = {}
  try { 고름 = JSON.parse(localStorage.getItem(KEY) || '{}') } catch (e) { 고름 = {} }
  function 그리기(){
    document.querySelectorAll('.c, .ab').forEach(function(c){
      var k = c.dataset.k
      c.querySelectorAll('.pick button').forEach(function(b){
        b.setAttribute('aria-pressed', 고름[k] === b.dataset.v ? 'true' : 'false')
      })
    })
    document.getElementById('n').textContent = Object.keys(고름).length + '개 고름'
  }
  document.querySelectorAll('.pick button').forEach(function(b){
    b.addEventListener('click', function(){
      var k = b.closest('.c, .ab').dataset.k
      고름[k] = 고름[k] === b.dataset.v ? undefined : b.dataset.v
      if (!고름[k]) delete 고름[k]
      try { localStorage.setItem(KEY, JSON.stringify(고름)) } catch (e) {}
      그리기()
    })
  })
  그리기()
  document.getElementById('copy').addEventListener('click', function(){
    var 줄 = ['[줄바꿈 시안 · 2026-08-22]']
    document.querySelectorAll('.ab, .c').forEach(function(c){
      var k = c.dataset.k
      var h3 = c.querySelector('h3')
      if (고름[k]) 줄.push(k + (h3 ? ' ' + h3.textContent : '') + ' — ' + 고름[k])
    })
    var t = 줄.join('\\n')
    var out = document.getElementById('out')
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(function(){
        out.style.display = 'block'; out.textContent = '복사했어요 ↓\\n\\n' + t
      }).catch(function(){ 골라주기(t) })
    } else 골라주기(t)
    function 골라주기(t2){
      out.style.display = 'block'; out.textContent = t2
      var r = document.createRange(); r.selectNodeContents(out)
      var s = getSelection(); s.removeAllRanges(); s.addRange(r)
    }
  })
</script>`

writeFileSync(OUT, html)
console.log(`\n✅ ${OUT}  (${Math.round(html.length / 1024)}KB)`)
