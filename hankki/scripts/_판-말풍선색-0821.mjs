// 【✅ 반영됨 · v11.18】 고른 색이 앱에 들어갔다.
// 💬🎨 말풍선이 «묻히나» — 배경 갈래 다섯을 실물 앱에서 나란히 찍는다 (2026-08-21)
//
// 📮 경위 = 앱에 넣고 열어보니(절대원칙 21) **말풍선 색이 바로 아래 세그먼트와 «똑같았다».**
//    🔢 짐작이 아니라 소스로 확인 = `.segment { background: var(--cream) }`(styles.css:517)
//       ↔ `.tab-talk-b { background: var(--cream) }` — **한 글자도 안 다르다.**
//    ⭐ 그래서 「말풍선 하나」가 아니라 「회색 칸이 둘 겹친 것」으로 읽힌다.
//
// ⛔⛔ [규칙 30] 시안은 **앱이 화면에 쓰는 바로 그 값**이라야 한다.
//    → 흉내를 그리지 않는다. **진짜 앱을 띄우고 «배경 한 줄만» 덮어씌워** 찍는다.
//      나머지(글자·꼬리 자리·캐릭터·아래 칸)는 전부 실물이다.
//
// 👀 탭을 둘 찍는 이유 = **아래에 깔린 게 다르다**
//    · 레시피 = 바로 아래가 **세그먼트**(크림 알약) → 지금 묻히는 그 자리
//    · 홈     = 바로 아래가 **검색바**(흰 알약)   → ⭐흰 말풍선을 고르면 «여기»가 같은 꼴이 된다
//    ⛔ 한 탭만 보고 고르면 다른 탭에서 같은 문제가 되풀이된다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-말풍선색-0821.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/말풍선색'
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
await new Promise((r) => srv.listen(4399, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// 🎨 갈래 다섯 — ⛔색을 «숫자로» 박지 않는다. 테마 변수만 쓴다(v11.17 교훈).
//    그래야 고른 값을 그대로 CSS 에 옮겨도 다크·웜에서 저절로 따라간다.
const 갈래 = [
  { 키: 'a', 이름: 'ⓐ 지금 그대로', 설명: '아래 회색 칸과 같은 색 — 튀지 않는 「분위기 글자」', css: '' },
  { 키: 'b', 이름: 'ⓑ 흰색', 설명: '밝게 띄운다 — 진짜 말풍선처럼', css: `
      .tab-talk-b { background: var(--surface) !important; }
      .tab-talk-t { border-bottom-color: var(--surface) !important; }` },
  { 키: 'c', 이름: 'ⓒ 진한 크림', 설명: '어둡게 띄운다 — 지금 색을 한 톤만 더', css: `
      .tab-talk-b { background: var(--cream-deep) !important; }
      .tab-talk-t { border-bottom-color: var(--cream-deep) !important; }` },
  // ⚠️ ⓓ 는 «색이 ⓐ와 같다» → 숫자가 ⓐ와 똑같이 나온다. 요점이 테두리라 «눈으로만» 갈린다.
  //    ⛔ 그 사실을 판에 안 적으면 창업자가 「ⓐ랑 뭐가 달라?」로 읽는다.
  { 키: 'd', 이름: 'ⓓ 지금 색 ＋ 옅은 테두리', 설명: '색은 그대로 두고 윤곽만 또렷하게 · 숫자는 ⓐ와 같아(색이 같으니까) — 눈으로 봐줘', css: `
      .tab-talk-b { border: 1px solid var(--sand) !important; }` },
  { 키: 'e', 이름: 'ⓔ 흰색 ＋ 살짝 그림자', 설명: '종이처럼 살짝 떠 보인다', css: `
      .tab-talk-b { background: var(--surface) !important; box-shadow: 0 1px 4px rgba(107,79,58,.13) !important; }
      .tab-talk-t { border-bottom-color: var(--surface) !important; }` },
]

const 탭들 = [
  { 키: '레시피', 하단: '레시피', 아래: '세그먼트(크림 알약)' },
  { 키: '홈', 하단: '홈', 아래: '검색바(흰 알약)' },
]

const 컷 = {}   // 컷['a-레시피'] = base64
const 잰값 = []

for (const 탭 of 탭들) {
  for (const g of 갈래) {
    // 🔍 dsf 2 — 아티팩트에 통째로 담을 거라 3배는 너무 무겁고, 2배면 폰에서 또렷하다
    const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
    await page.addInitScript(SEED_COACH_SEEN)
    await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
    await page.goto('http://127.0.0.1:4399/hankki/', { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(700)

    if (탭.하단 !== '홈') {
      await page.evaluate((이름) => {
        const 칸 = [...document.querySelectorAll('.bottom-nav .nav-item')]
          .find((e) => ([...e.querySelectorAll('span')].pop()?.textContent || '').trim() === 이름)
        if (칸) 칸.click()
      }, 탭.하단)
      await page.waitForTimeout(600)
    }

    if (g.css) { await page.addStyleTag({ content: g.css }); await page.waitForTimeout(200) }

    // 🔢 「진짜 떠 보이나」는 눈이 아니라 «말풍선 ↔ 뒷배경 대비»가 답한다.
    //    ⚠️ 1.0 = 완전히 같은 색이다(지금 상태). 갈래마다 이 값이 얼마나 오르나를 본다.
    const v = await page.evaluate(() => {
      const L = (c) => { const [r, g, bb] = c.match(/\d+/g).map(Number).map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * bb }
      const 비 = (p, q) => { const [x, y] = [L(p), L(q)].sort((m, n) => n - m); return +((x + 0.05) / (y + 0.05)).toFixed(3) }
      const 말 = document.querySelector('.tab-talk-b')
      if (!말) return null
      let 뒤 = null, e = 말.parentElement
      while (e && !뒤) { const c = getComputedStyle(e).backgroundColor; if (c && !/rgba\(0, 0, 0, 0\)/.test(c)) 뒤 = c; e = e.parentElement }
      const cs = getComputedStyle(말)
      // 아래에 깔린 칸(세그먼트 / 검색바)과도 견준다 — 「그것과 같아서 묻힌다」가 문제였으니까
      const 아래칸 = document.querySelector('.segment') || document.querySelector('.searchbar')
      return {
        말풍선색: cs.backgroundColor,
        배경과대비: 비(cs.backgroundColor, 뒤),
        아래칸과대비: 아래칸 ? 비(cs.backgroundColor, getComputedStyle(아래칸).backgroundColor) : null,
        글자대비: 비(cs.color, cs.backgroundColor),
      }
    })

    const 파일 = join(OUT, `${g.키}-${탭.키}.png`)
    await page.screenshot({ path: 파일, clip: { x: 0, y: 0, width: 390, height: 116 } })
    컷[`${g.키}-${탭.키}`] = readFileSync(파일).toString('base64')
    잰값.push({ 갈래: g.이름, 탭: 탭.키, ...v })
    await page.close()
  }
}

console.table(잰값)

// ☑️ [절대원칙 2026-08-19] 검수판은 «무조건» 체크 ＋ 복사
// 🔢 「아래 칸과 차이 = 1.000」 = 그 탭에서 **색이 완전히 똑같다**(＝묻힌다).
//    ⭐ 이 한 줄이 판의 심장이다 — 숫자만 늘어놓으면 창업자가 해석을 떠안는다.
const 값 = (키, 탭) => 잰값.find((v) => v.갈래 === 갈래.find((g) => g.키 === 키).이름 && v.탭 === 탭)
const 묻힘 = (n) => (n < 1.02 ? ' <s class="warn">똑같음</s>' : '')

const 행 = 갈래.map((g) => {
  const 레 = 값(g.키, '레시피'); const 홈 = 값(g.키, '홈')
  return `
  <label class="row" data-k="${g.키}">
    <input type="radio" name="pick" value="${g.키}">
    <div class="meta"><b>${g.이름}</b><span>${g.설명}</span></div>
    <div class="shots">
      <figure><img src="data:image/png;base64,${컷[`${g.키}-레시피`]}" alt="">
        <figcaption>레시피 — 아래 회색 칸과 <b>${레.아래칸과대비.toFixed(2)}</b>${묻힘(레.아래칸과대비)}</figcaption></figure>
      <figure><img src="data:image/png;base64,${컷[`${g.키}-홈`]}" alt="">
        <figcaption>홈 — 아래 검색바와 <b>${홈.아래칸과대비.toFixed(2)}</b>${묻힘(홈.아래칸과대비)}</figcaption></figure>
    </div>
    <em class="num">바탕과 차이 ${레.배경과대비.toFixed(2)} · 글자 읽힘 ${레.글자대비.toFixed(2)}</em>
  </label>`
}).join('')

writeFileSync(join(OUT, '판.html'), `<title>말풍선 색 고르기</title>
<style>
  :root { --bg:#faf8f4; --card:#fff; --text:#3d3830; --sub:#8f887b; --line:#e8e2d6; --point:#5878a0; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#17171b; --card:#212126; --text:#eceaf0; --sub:#9a97a2; --line:#33333c; --point:#7093c0; } }
  :root[data-theme="dark"] { --bg:#17171b; --card:#212126; --text:#eceaf0; --sub:#9a97a2; --line:#33333c; --point:#7093c0; }
  body { background:var(--bg); color:var(--text); font-family:-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif; margin:0; padding:20px 16px 120px; -webkit-text-size-adjust:100%; }
  h1 { font-size:19px; margin:0 0 4px; letter-spacing:-.02em; }
  .lead { color:var(--sub); font-size:13.5px; line-height:1.6; margin:0 0 18px; }
  .lead b { color:var(--text); }
  .row { display:block; background:var(--card); border:2px solid var(--line); border-radius:16px; padding:13px 13px 11px; margin-bottom:13px; cursor:pointer; }
  .row:has(input:checked) { border-color:var(--point); }
  .row input { position:absolute; opacity:0; }
  .meta { display:flex; flex-direction:column; gap:2px; margin-bottom:10px; }
  .meta b { font-size:15px; letter-spacing:-.02em; }
  .row:has(input:checked) .meta b::after { content:' ✓'; color:var(--point); }
  .meta span { font-size:12.8px; color:var(--sub); }
  .num { display:block; margin-top:8px; font-size:11.4px; color:var(--sub); font-style:normal; opacity:.7; font-variant-numeric:tabular-nums; }
  .shots { display:grid; grid-template-columns:1fr 1fr; gap:9px; }
  figure { margin:0; }
  figure img { width:100%; display:block; border-radius:9px; border:1px solid var(--line); }
  figcaption { font-size:11.2px; color:var(--sub); text-align:center; margin-top:5px; line-height:1.45; font-variant-numeric:tabular-nums; }
  figcaption b { color:var(--text); font-weight:700; }
  .warn { display:inline-block; margin-left:3px; padding:1px 5px; border-radius:5px; background:#c85a3f; color:#fff; font-size:10.4px; font-weight:700; text-decoration:none; }
  .bar { position:fixed; left:0; right:0; bottom:0; background:var(--card); border-top:1px solid var(--line); padding:12px 16px calc(12px + env(safe-area-inset-bottom)); display:flex; gap:9px; align-items:center; }
  .bar button { flex:1; background:var(--point); color:#fff; border:none; border-radius:12px; padding:13px; font-size:15px; font-weight:700; font-family:inherit; }
  .bar #out { flex:1; font-size:13px; color:var(--sub); }
  @media (min-width:640px) { body { max-width:620px; margin:0 auto; } }
</style>
<h1>💬 말풍선 색 — 어느 게 나아?</h1>
<p class="lead">앱에 넣고 열어보니 <b>말풍선이 바로 아래 회색 칸과 색이 똑같아</b> 좀 묻혀.
짐작이 아니라 소스로 확인했어 — 둘 다 같은 색 변수를 쓰고 있었어.<br><br>
<b>탭을 둘 다 놨어</b> — 아래에 깔린 게 다르거든. 레시피는 <b>세그먼트</b>(회색 알약), 홈은 <b>검색바</b>(밝은 알약).
그래서 <b>흰색으로 하면 레시피에선 뜨는데 홈에선 검색바랑 똑같아져</b>. 한 탭만 보고 고르면 같은 문제가 반복돼.<br><br>
숫자는 <b>1.00이면 완전히 같은 색</b>이라는 뜻이야. 클수록 또렷하게 갈려.</p>
${행}
<div class="bar"><span id="out">하나 골라줘</span><button id="copy">복사하기</button></div>
<script>
  var K='hankki-말풍선색-0821';
  try { var s=localStorage.getItem(K); if(s){ var r=document.querySelector('input[value="'+s+'"]'); if(r){ r.checked=true; } } } catch(e){}
  function 글(){ var r=document.querySelector('input[name=pick]:checked'); if(!r) return '';
    var b=r.closest('.row').querySelector('.meta b').textContent.trim(); return '말풍선 색 = '+b; }
  function 갱신(){ var t=글(); document.getElementById('out').textContent = t || '하나 골라줘'; }
  document.addEventListener('change', function(e){ if(e.target.name==='pick'){ try{ localStorage.setItem(K, e.target.value) }catch(err){} 갱신() } });
  갱신();
  document.getElementById('copy').addEventListener('click', function(){
    var t=글(); if(!t){ document.getElementById('out').textContent='먼저 하나 골라줘'; return }
    // ⛔ clipboard 는 «성공으로 resolve 되고도» 실제 복사가 안 되는 폰이 있다(v10.97 교훈)
    //    → 실패하면 글자를 골라 준다. 길게 눌러 복사하면 된다.
    function 폴백(){
      var p=document.createElement('p'); p.textContent=t; p.style.cssText='position:fixed;left:16px;right:16px;bottom:74px;background:var(--card);border:2px solid var(--point);border-radius:12px;padding:12px;font-size:14px;z-index:9';
      document.body.appendChild(p);
      var r=document.createRange(); r.selectNodeContents(p);
      var s=getSelection(); s.removeAllRanges(); s.addRange(r);
      document.getElementById('out').textContent='길게 눌러 복사해줘';
    }
    try { navigator.clipboard.writeText(t).then(function(){ document.getElementById('out').textContent='복사됐어 ✓' }, 폴백) } catch(e){ 폴백() }
  });
</script>`)

console.log(`\n📁 ${OUT}`)
await b.close(); srv.close()
