// 📌 메모지를 «재료 옆»에 — 자리 갈래 (2026-08-20)
//
// 📮 창업자 = *"아니면 아예 **재료옆에다 붙이던가**"*
//    ＋ *"위에 직사각형 자리 아니고(**재료 위 만들었어요? 기록하는 자리빼고**)"*
//    ＋ *"**대신 자리는 재료옆이어야해.**"*
//    ⭐ 즉 **지금 자리(재료 «위»의 가로 직사각형)가 아니라 재료 목록 «오른쪽».**
//       그 위 자리는 「만들었어요·기록」 칸이라 그대로 둔다.
//
// ⭐⭐ 왜 이 순서가 맞나 = 종이가 **정사각(포스트잇)**이 되면 가로를 다 안 쓴다.
//    그러면 「자리 꽉」이 어색해지고, 남는 옆자리로 재료가 흐르는 게 자연스럽다.
//    📌 진짜 포스트잇을 종이에 붙이면 글이 그 옆으로 밀리는 것과 같은 그림이다.
//
// 🔢 실측 (폰 390) — 재료 목록 폭 350px · 재료줄 `.ing`
//    정사각 포스트잇을 44% 로 두면 **154px** — 장식이 거의 안 보이는 크기다.
//    ⭐ 그래서 **자리를 정해야 「종이를 얼마나 단순하게 그릴지」가 정해진다.**
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const 앱컷 = join(ROOT, 'src/assets/stickers/photo')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4404, r))

const 종이 = 'dgn02'   // 정사각 포스트잇(가로÷세로 1.00) — 자리를 보는 판이라 하나로 고정
const 글씨 = ["'Poor Story','Gowun Dodum',sans-serif", 400]

// 📐 자리 갈래
//   'now'   = 지금(재료 «위» · 자리 꽉)  ← 견줄 바탕
//   'f44'   = 재료 목록 오른쪽에 붙이고 재료가 그 옆으로 흐른다 (44%)
//   'f52'   = 같은 방식인데 조금 크게 (52%)
//   'col'   = 재료와 «2단»으로 나란히 (재료 58% · 메모지 42%)
//   'f44t'  = 44% ＋ **살짝 비뚤게 붙인다**(진짜 포스트잇처럼)
const 갈래들 = [
  ['now', '지금 — 재료 위', '가로로 길게 · 자리 꽉'],
  ['f44', '재료 옆 · 반듯하게', '폭 44% · 재료가 옆으로 흐른다'],
  ['f44t', '재료 옆 · 비뚤게 붙임', '폭 44% ＋ 살짝 기울여 붙인 느낌'],
  ['f52', '재료 옆 · 조금 크게', '폭 52% · 비뚤게'],
  ['col', '재료와 2단', '왼쪽 재료 · 오른쪽 메모지 (계속 나란히)'],
]

const 재기 = (k) => {
  const buf = readFileSync(join(앱컷, `${k}.png`))
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
}
const 데이터 = (k) => 'data:image/png;base64,' + readFileSync(join(앱컷, `${k}.png`)).toString('base64')

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, timezoneId: 'Asia/Seoul', deviceScaleFactor: 2 })

// 🍲 레시피 둘 — 재료 길이가 다르면 두 갈래의 «차이»가 드러나는 정도가 다르다
//    📮 창업자 = *"재료와 2단이랑 재료옆이랑 **다른점이뭐야?**"*
//    ⛔ 콩국수(첫 레시피)로는 안 보인다 — 메모지 «아래» 재료가 「오이 1/2개」처럼 짧아서
//       전체 폭을 써도 티가 안 난다. **재료가 긴 편이라야 차이가 눈에 보인다.**
//    🔢 실측으로 고른 것 = **닭곰탕**(재료 10줄 · 18자 넘는 줄 7개 · 평균 21자)
const 긴편 = '닭곰탕'

const p0 = await ctx.newPage()
await p0.addInitScript(SEED_COACH_SEEN)
await p0.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
await p0.goto('http://127.0.0.1:4404/', { waitUntil: 'networkidle' })
await p0.waitForFunction(() => !!localStorage.getItem('hankki:v1'), null, { timeout: 15000 })
const 준비 = await p0.evaluate((긴편) => {
  const s = JSON.parse(localStorage.getItem('hankki:v1'))
  const 메모 = (r) => ({ id: 'd_' + r.id, recipeId: r.id, title: r.title, source: r.source, at: Date.now() - 864e5, rating: 4, note: '간장 반만 · 마지막에 참기름', photo: null })
  const 첫 = s.recipes[0]
  const 긴 = s.recipes.find((r) => r.title === 긴편)
  s.diary = []
  for (const r of [첫, 긴]) {
    if (!r) continue
    r.cooked = 1; r.cookedAt = Date.now() - 864e5
    s.diary.push(메모(r))
  }
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  return { 짧은: 첫.title, 긴: 긴 ? 긴.title : null }
}, 긴편)
const 제목 = 준비.짧은
if (!준비.긴) { console.log(`⚠️ 「${긴편}」을 못 찾았다 — 짧은 편만 찍는다`) }
await p0.close()

const 놓기 = async (p, 갈래) => {
  const { w, h } = 재기(종이)
  return await p.evaluate(({ url, w, h, fam, weight, 갈래 }) => {
    // ⛔⛔ querySelector 는 «첫째»를 잡는다 — 쌓인 화면의 «화면 밖» 것을 잡지 않도록 마지막을 쓴다
    const el = [...document.querySelectorAll('.memo-note')].pop()
    if (!el) return null
    const 통 = el.parentElement

    // ── 종이 꾸미기 (갈래와 무관하게 같다) ──
    el.classList.add('paper')
    el.style.setProperty('background-image', `url(${url})`, 'important')
    el.style.setProperty('background-size', '100% 100%', 'important')
    el.style.setProperty('background-repeat', 'no-repeat', 'important')
    el.style.aspectRatio = `${w}/${h}`
    el.style.display = 'flex'
    el.style.alignItems = 'center'
    el.style.justifyContent = 'center'
    el.style.containerType = 'inline-size'
    el.style.width = '100%'
    let inner = el.querySelector('.memo-inner')
    if (!inner) {
      inner = document.createElement('div')
      inner.className = 'memo-inner'
      inner.style.cssText = 'width:70%;text-align:center;overflow:hidden'
      while (el.firstChild) inner.appendChild(el.firstChild)
      el.appendChild(inner)
    }
    const head = inner.querySelector('.memo-note-head')
    if (head) {
      // ⛔ 작은 자리(157px)에선 「지난번에 내가 남긴 것」 ＋ 별 다섯이 «한 줄에 안 들어간다».
      //    첫 판에서 「내가 남긴 것」으로 잘리고 별도 둘만 보였다.
      //    ✅ 글씨를 종이 폭에 매달고 감기게 둔다 — 자리가 작아지면 저절로 작아진다.
      head.style.fontSize = 'clamp(7.5px, 5.4cqw, 11px)'
      head.style.flexWrap = 'wrap'
      head.style.justifyContent = 'center'
      head.style.rowGap = '1px'
    }
    const body = inner.querySelector('.memo-note-body')
    if (body) {
      body.style.fontFamily = fam
      body.style.fontWeight = String(weight)
      // ⭐ 종이 폭에 매단다 — 작은 자리로 가면 글씨도 같이 작아져야 안 넘친다
      body.style.fontSize = 'clamp(11px, 8.4cqw, 20px)'
      body.style.lineHeight = '1.3'
      body.style.marginTop = '1px'
    }

    // ── 자리 갈래 ──
    if (갈래 === 'now') {
      // 지금 그대로 — 재료 «위», 자리 꽉
      통.style.display = 'block'
      통.style.width = '100%'
      통.style.margin = '18px auto 0'
      const r = el.getBoundingClientRect()
      return { 폭: Math.round(r.width), 높이: Math.round(r.height) }
    }

    // 재료 목록 상자를 찾는다 — `.ing` 들의 부모(⛔`.ing` 자체가 아니다)
    const 재료줄 = [...document.querySelectorAll('.ing')]
    const 재료통 = 재료줄.length ? 재료줄[0].parentElement : null
    if (!재료통) return null

    통.remove()   // 재료 «위» 자리를 비운다 (창업자 = 그 자리 말고)

    if (갈래 === 'col') {
      // 2단 — 왼쪽 재료 · 오른쪽 메모지
      const 겉 = document.createElement('div')
      겉.style.cssText = 'display:flex;gap:12px;align-items:flex-start;margin-top:6px'
      재료통.parentElement.insertBefore(겉, 재료통)
      const 왼 = document.createElement('div')
      왼.style.cssText = 'flex:1 1 58%;min-width:0'
      const 오 = document.createElement('div')
      오.style.cssText = 'flex:0 0 40%'
      겉.appendChild(왼); 겉.appendChild(오)
      왼.appendChild(재료통)
      오.appendChild(el)
    } else {
      // float — 재료가 그 옆으로 흐른다 (＝필기하다 포스트잇 붙인 그림)
      const 폭 = 갈래 === 'f52' ? '52%' : '44%'
      el.style.cssText += `;float:right;width:${폭};margin:2px 0 10px 14px`
      // 📮 창업자 = *"우리 보통 **필기하다가 포스트잇 붙이잖아. 그런느낌으로.**"*
      //    ⭐ 진짜로 붙인 포스트잇은 «반듯하지 않다» — 살짝 기울고 그림자가 진다.
      //    ⛔ 많이 기울이면 「떨어지려는 것」처럼 보인다. 2.2도면 눈엔 「손으로 붙였네」로만 읽힌다.
      if (갈래 !== 'f44') {
        el.style.transform = 'rotate(-2.2deg)'
        el.style.filter = 'drop-shadow(1px 3px 3px rgba(60,40,20,.16))'
      }
      재료통.insertBefore(el, 재료통.firstChild)
      // ⛔ float 를 쓰면 부모가 높이를 안 잡는다 — 뒤에 clear 를 둔다
      const 끝 = document.createElement('div')
      끝.style.cssText = 'clear:both'
      재료통.appendChild(끝)
    }
    const r = el.getBoundingClientRect()
    return { 폭: Math.round(r.width), 높이: Math.round(r.height) }
  }, { url: 데이터(종이), w, h, fam: 글씨[0], weight: 글씨[1], 갈래 })
}

// 찍을 목록 = 짧은 편(갈래 다섯) ＋ 긴 편(차이가 드러나는 둘만)
const 찍을것 = 갈래들.map(([키, 이름, 설명]) => ({ 편: '짧은', 제목: 준비.짧은, 키, 이름, 설명 }))
if (준비.긴) {
  for (const 키 of ['f44t', 'col']) {
    const [, 이름, 설명] = 갈래들.find((g) => g[0] === 키)
    찍을것.push({ 편: '긴', 제목: 준비.긴, 키, 이름, 설명 })
  }
}

const 컷들 = []
for (const { 편, 제목: 이번제목, 키, 이름, 설명 } of 찍을것) {
  const p = await ctx.newPage()
  await p.addInitScript(SEED_COACH_SEEN)
  await p.goto('http://127.0.0.1:4404/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(700)
  await p.click(`text=${이번제목}`)
  await p.waitForSelector('.memo-note', { timeout: 10000 })
  const 잰값 = await 놓기(p, 키)
  await p.waitForTimeout(420)

  // 📜 «메모지»를 화면 가운데로 굴린다 — 재료 제목 기준으로 잡았더니 포스트잇 위가 잘렸다
  await p.evaluate(() => {
    const el = [...document.querySelectorAll('.memo-note')].pop()
    if (el) el.scrollIntoView({ block: 'center' })
  })
  await p.waitForTimeout(420)
  // 메모지 둘레를 넉넉히 — 위로 재료 제목, 아래로 재료줄이 흐르는 것까지 보이게
  const clip = await p.evaluate(() => {
    const el = [...document.querySelectorAll('.memo-note')].pop()
    const r = el.getBoundingClientRect()
    const 위 = Math.max(0, Math.round(r.top - 190))
    const 아래 = Math.min(window.innerHeight, Math.round(r.bottom + 330))
    return { x: 0, y: 위, width: 390, height: Math.max(120, 아래 - 위) }
  })
  const 곳 = `${OUT}/재료옆-${편}-${키}.png`
  await p.screenshot({ path: 곳, clip })
  컷들.push({ 편, 제목: 이번제목, 키, 이름, 설명, 곳, ...(잰값 || {}) })
  console.log(`  [${편}] ${이번제목} · ${이름} → ${잰값 ? `${잰값.폭}×${잰값.높이}px` : '못 잼'}`)
  await p.close()
}
await ctx.close(); await b.close(); srv.close()

// ── 판 ────────────────────────────────────
const 파일 = (f) => 'data:image/png;base64,' + readFileSync(f).toString('base64')
const 줄만들기 = (편) => 컷들.filter((c) => c.편 === 편).map((c) => `
  <figure class="shot${c.키 === 'now' ? ' base' : ''}">
    <img src="${파일(c.곳)}" alt="">
    <figcaption><b>${c.이름}</b> · 메모지 <b>${c.폭 || '?'}px</b><br><span>${c.설명}</span></figcaption>
  </figure>`).join('')
const 줄 = 줄만들기('짧은')
const 긴줄 = 줄만들기('긴')
const 긴제목 = (컷들.find((c) => c.편 === '긴') || {}).제목 || ''

const html = `<title>메모지를 재료 옆으로</title>
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
  .shot{margin:0;flex:0 0 auto;width:286px;background:var(--card);border:1px solid var(--line);
        border-radius:14px;overflow:hidden}
  .shot.base{border-style:dashed;opacity:.93}
  .shot img{width:100%;display:block}
  .shot figcaption{font-size:12.5px;color:var(--sub);padding:9px 11px;border-top:1px solid var(--line);line-height:1.5}
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
  @media (max-width:520px){ .shot{width:248px} h1{font-size:22px} }
</style>
<div class="wrap">
<h1>메모지를 재료 옆으로</h1>
<p class="sub">종이는 정사각 포스트잇 하나로 고정했어 — 여기선 <b>자리만</b> 봐줘.</p>

<div class="say">
  📮 네가 한 말 — <b>“아니면 아예 재료옆에다 붙이던가”</b> ·
  <b>“위에 직사각형 자리 아니고(재료 위 만들었어요? 기록하는 자리빼고)”</b> ·
  <b>“대신 자리는 재료옆이어야해.”</b> ·
  <b>“우리 보통 필기하다가 포스트잇 붙이잖아. 그런느낌으로.”</b>
</div>

<div class="note">
  ⭐ <b>「필기하다 붙인 포스트잇」이 정확히 이 방식이야.</b> 재료 목록이 필기고,
  포스트잇을 오른쪽에 붙이면 <b>글이 그 옆으로 흐른다.</b><br>
  ⭐⭐ 그리고 진짜로 붙인 포스트잇은 <b>반듯하지 않아</b> — 살짝 기울고 그림자가 져.
  그래서 <b>「반듯하게」와 「비뚤게」를 나란히</b> 뒀어(2.2도만 기울였어 — 더 돌리면 떨어지려는 것처럼 보여).<br>
  ⛔ 맨 왼쪽 점선이 <b>지금</b>(재료 위)이야.
</div>

<h2>자리 갈래 다섯</h2>
<p class="h2sub">전부 폰(390) 화면이야. 옆으로 밀어서 봐줘.</p>
<div class="row">${줄}</div>

<h2>「재료 옆」과 「2단」의 차이 — ${긴제목}</h2>
<p class="h2sub">네가 물은 그거야. <b>콩국수로는 차이가 안 보여</b> — 메모지 아래 재료가
「오이 1/2개」처럼 짧아서 넓어져도 티가 안 나거든.
그래서 <b>재료가 긴 편(${긴제목})</b>으로 다시 찍었어.</p>

<div class="note">
  ⭐⭐ <b>차이는 「메모지 아래」에 있어.</b><br>
  · <b>재료 옆</b> — 메모지 옆으로 글이 흐르다가, <b>메모지가 끝나면 재료가 다시 화면 전체 폭</b>을 써.
    종이에 포스트잇 붙인 그대로야.<br>
  · <b>2단</b> — 재료가 <b>끝까지 좁아.</b> 메모지 아래 오른쪽이 계속 빈칸으로 남아.
</div>
<div class="row">${긴줄}</div>

<div class="ask">
  <h3>1. 어느 자리로 갈까?</h3>
  <p>「재료 옆」 셋은 크기만 다르고 방식은 같아. 2단은 재료가 계속 좁아져.</p>
  <div class="opts" data-q="자리">
    <button class="opt" type="button" data-v="재료 옆 · 반듯하게 (44%)">재료 옆 · 반듯하게</button>
    <button class="opt" type="button" data-v="재료 옆 · 비뚤게 (44%)">재료 옆 · 비뚤게</button>
    <button class="opt" type="button" data-v="재료 옆 · 조금 크게 (52%)">재료 옆 · 조금 크게</button>
    <button class="opt" type="button" data-v="재료와 2단">재료와 2단</button>
    <button class="opt" type="button" data-v="그래도 지금(재료 위)이 낫다">그래도 지금이 낫다</button>
  </div>

  <h3>2. 「만들었어요·기록」 칸은?</h3>
  <p>메모지가 옆으로 가면 재료 위 그 자리가 빈다. 어떻게 할까?</p>
  <div class="opts" data-q="위자리">
    <button class="opt" type="button" data-v="기록 카드를 그대로 둔다">기록 카드를 그대로 둔다</button>
    <button class="opt" type="button" data-v="그 자리는 아예 비운다">그 자리는 아예 비운다</button>
    <button class="opt" type="button" data-v="모르겠다">모르겠다</button>
  </div>
</div>

<div class="note">
  📐 <b>이게 정해지면 시안 조건을 정확히 줄게</b> — 자리가 44%면 종이가 <b>154px</b>,
  52%면 <b>182px</b>이야. 그 크기에선 꽃이나 숟가락 같은 장식이 거의 안 보이니까
  <b>「긴 변 몇 px로, 장식은 어디까지」</b>를 숫자로 정해서 넘길 수 있어.
</div>
</div>

<div class="bar">
  <span class="done" id="done">고른 것 0 / 2</span>
  <button class="copy" type="button" id="copy">복사하기</button>
</div>
<pre id="out"></pre>

<script>
(function(){
  var KEY = 'hankki:재료옆-0820';
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
    var label = { 자리: '메모지 자리', 위자리: '재료 위 빈 자리' };
    var lines = ['메모지 자리 판정 · 재료 옆 (2026-08-20)'];
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

const 낼판 = join(OUT, '재료옆.html')
writeFileSync(낼판, html)
console.log(`\n📌 ${컷들.length}컷`)
console.log(`📄 ${낼판}  (${(Buffer.byteLength(html) / 1048576).toFixed(2)} MB)`)
