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
const 종이들 = [
  ['mp1_1', '쿠튀르 · 노랑 프릴 ＋ 파란 장미'],
  ['mp1_2', '쿠튀르 · 트위드 ＋ 살구 리본'],
  ['mp1_3', '쿠튀르 · 퀼트 ＋ 하트 단추'],
  ['mp1_4', '쿠튀르 · 세이지 리본 ＋ 체리'],
  ['mp1_5', '쿠튀르 · 진주 ＋ 파란 리본'],
  ['mp1_6', '쿠튀르 · 파랑노랑 뜨개 ＋ 꽃'],
  ['mp2_1', '스티커 · 나무 숟가락 ＋ 노랑 물결 (창업자가 유일하게 남긴 것)'],
  ['mp3_1', '자수 · 구름 ＋ 파란 단추'],
  ['mp3_2', '자수 · 파랑 가죽 ＋ 리본'],
  ['mp3_3', '자수 · 갈색 깅엄 프릴 ＋ 하트'],
  ['mp3_4', '자수 · 초록 깅엄 ＋ 꽃'],
  ['mp3_5', '자수 · 파란 홈질 ＋ 나무 숟가락'],
  ['mp3_6', '자수 · 세이지 ＋ 들꽃'],
]
// ⭐ 그림 크기는 PNG 헤더에서 «직접» 읽는다 — 손으로 적으면 그림을 갈 때 낡는다
// ⛔ 아직 앱 자산이 «아니다» — 창업자가 방금 준 시안이라 scratchpad 에서 읽는다.
//    고른 뒤에 큰 판으로 다시 받아  로 들어간다.
const 컷폴더 = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/종이컷'
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
  // ⛔ 처음엔 «메모 둘레만» 잘라 찍었는데 메모지가 통째로 빠진 판이 나왔다.
  //    🔎 원인 = 화면을 쌓으면 이전 화면이 DOM 에 남아 `querySelector('.memo-note')` 가
  //       «상세 화면의» 메모지(화면 밖)를 잡았다 → 좌표가 엉뚱했다.
  //    ✅ 화면을 통째로 찍는다. 자리 계산이 안 끼어들고, 「어울리나」는 주변과 함께라야 보인다.
  const 낼곳 = `${OUT}/붙여-상세-${k}.png`
  await p.screenshot({ path: 낼곳 })
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
  await p.screenshot({ path: 낼곳 })
  요리컷.push([k, 설명, 낼곳])
  await p.close()
}

await ctx.close(); await b.close(); srv.close()

// ── 판 만들기 (아티팩트용 · 문서 껍데기 없이) ───────
const b64 = (p) => 'data:image/png;base64,' + readFileSync(p).toString('base64')
const 줄 = (컷들) => 컷들.map(([k, 설명, 파일]) => `
  <div class="cell">
    <img src="${b64(파일)}" alt="${k}">
    <div class="cap"><b>${k}</b> · ${설명}</div>
  </div>`).join('')

const html = `<title>레시피에 붙여본 메모지</title>
<style>
:root{--bg:#f3f2ef;--card:#fff;--ink:#3d3830;--sub:#6f6a62;--line:#e6e4df}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#1e1c19;--card:#2a2724;--ink:#ece7df;--sub:#a9a49b;--line:#3b3733}}
:root[data-theme="dark"]{--bg:#1e1c19;--card:#2a2724;--ink:#ece7df;--sub:#a9a49b;--line:#3b3733}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);line-height:1.6;
  font-family:-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif}
.wrap{max-width:460px;margin:0 auto;padding:20px 14px 60px}
h1{font-size:21px;margin:0 0 4px}
.sub{color:var(--sub);font-size:14px;margin:0 0 4px}
h2{font-size:16px;margin:26px 0 2px}
.h2sub{color:var(--sub);font-size:12.5px;margin:0 0 12px}
.cell{margin:0 0 20px}
.cell img{width:100%;display:block;border:1px solid var(--line);border-radius:12px}
.cap{font-size:12.5px;color:var(--sub);margin-top:7px}
.cap b{color:var(--ink)}
.note{background:var(--card);border:1px solid var(--line);border-radius:13px;padding:13px;font-size:13px;color:var(--sub);margin-top:20px}
</style><div class="wrap">
<h1>레시피에 붙여본 메모지</h1>
<p class="sub">종이 일곱을 «실제 앱 화면»에 붙여서 찍었어. 글씨체는 연필체 고정.</p>

<h2>① 레시피 상세 — 재료 위</h2>
<p class="h2sub">레시피를 «볼 때» 보이는 자리야.</p>
${줄(상세컷)}

<h2>② 요리 모드 — 재료 준비</h2>
<p class="h2sub">실제로 «만들 때» 재료를 꺼내며 보는 자리야. 여기가 더 중요해.</p>
${줄(요리컷)}

<div class="note">⭐ 볼 것 셋 — ⑴주변(재료 목록·표지)과 톤이 맞나 ⑵글씨가 장식에 안 가리나 ⑶세로를 얼마나 먹나<br>
⛔ 세로를 많이 먹으면 재료 목록이 아래로 밀려. 폰에선 그게 제일 아까워.</div>
</div>`

const 낼판 = join(OUT, '종이붙여보기.html')
writeFileSync(낼판, html)
console.log(`\n📸 상세 ${상세컷.length}컷 · 요리모드 ${요리컷.length}컷`)
console.log('판 →', 낼판, `(${Math.round(html.length / 1024)}KB)`)
