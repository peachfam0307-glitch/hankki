// 🔠🎨 「글자 크기 ＋ 톤」 시안판 — 창업자가 폰에서 고르는 판
//
// 📮 창업자 2026-08-21 = *"쟤네는 큼직큼직하게 딱딱보여 우리는 좀 다 작고 잘 안보이고"*
//    ＋ *"우리 화면도 지금 그레이지가 좀 칙칙하게느껴지거든? 톤을 올리면 좋겠어."*
//    ＋ *"일단 여러방향으로 시안을 뽑고"*
//
// ⛔⛔ **이 판은 「덮어씌운 시안」이다** — 진짜 CSS·JSX 로 옮기면 조금 달라질 수 있다.
//    v11.17 홈카드 때 실제로 그랬다(시안 통과 → 옮기니 폭이 어긋남). **판에도 그렇게 적는다.**
//
// ⭐ 축을 «따로» 본다 — 톤×글자를 다 곱하면 12장이 되어 아무도 못 고른다.
//    ① 톤 4갈래 (글자는 지금 그대로)
//    ② 글자 3단 (톤은 지금 그대로) — 홈 ＋ **일기**(14px 미만이 91% 로 제일 심했던 화면)
//
// 🔢 바탕이 된 실측 = `scripts/_probe-글자크기-0821.mjs`
//    홈 가운데값 12.5px · 일기 11px · MD3 최소 본문 14sp · Body Large 16sp
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-글자톤-0821.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/글자톤시안'
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
await new Promise((r) => srv.listen(4401, r))

// ── 🎨 톤 네 갈래 ────────────────────────────────────────────────
//
// ⛔⛔ **첫 판이 틀렸다 — 절대원칙 21(눈으로 열어 보기)이 잡았다.**
//    변수만 바꿔 찍었더니 톤A 와 톤D 가 «눈으로 구분이 안 됐다». 왜인지 재보고서야 알았다.
//
// 🔢 실측 (홈 첫 화면 · 색이 차지한 넓이 순)
//    --bg      #eeebe3  밝기 0.831   app-frame  329k
//    --cream   #e6e0d4  밝기 0.749   ⭐weekly-box 199k  ← **배경보다 «어둡다»(−0.083)**
//    --surface #f7f3ec  밝기 0.899   겨우 20k    ← 밝은데 «거의 안 쓰인다»
//
// ⭐⭐ **그래서 「칙칙함」의 정체 = 제일 큰 카드가 배경보다 «가라앉아» 있다.**
//    보통 카드는 배경보다 «밝아야» 떠 보이는데 우리는 반대다.
//    → `.weekly-box { background: var(--cream) }` (styles.css)
//
// ⛔ **`--cream` 자체를 밝히면 안 된다** — 버튼·칩·알약이 **110곳**(CSS 35 ＋ 인라인 75)에서 쓴다.
//    그것들은 배경과 «달라야» 눌리는 것으로 보인다. 그래서 **「큰 카드」만** 갈아끼운다.
const 큰카드밝게 = `.weekly-box{background:var(--surface)!important}`
const 톤들 = [
  { key: 'A', 이름: '지금 그대로 (그레이지)', 설명: '큰 카드가 배경보다 어둡다 — 밝기 0.749 vs 0.831', vars: {}, css: '' },
  { key: 'B', 이름: '크림 테마 (이미 앱에 있다)', 설명: '배경 #fdfbf7 · 거의 흰색. 기본이 아니라 아무도 안 본다', theme: 'cream', css: '' },
  {
    key: 'C', 이름: '그레이지 ＋ 큰 카드만 띄우기', 설명: '⭐제일 적게 바꾸는 갈래 — 배경은 그대로 두고 카드를 배경 «위»로',
    vars: { '--surface': '#fbf9f4' }, css: 큰카드밝게,
  },
  {
    key: 'D', 이름: '그레이지 한 단 밝게 ＋ 큰 카드 띄우기', 설명: '배경 #f4f1ea · 카드 #ffffff — 그레이지 결은 남기고 전체를 올린다',
    vars: {
      '--bg': '#f4f1ea', '--surface': '#ffffff', '--line': '#eae2d5', '--frame': '#ece5d8',
      '--nav-bg': 'rgba(244,241,234,0.92)', '--today-grad': 'linear-gradient(135deg,#f7f2e8,#efe7d9)',
      '--thumb': 'linear-gradient(160deg,#ffffff,#f5f1e9)',
    },
    css: 큰카드밝게,
  },
]

// ── 🔠 글자 세 단 ────────────────────────────────────────────────
// ⭐ **작은 글자일수록 더 키운다.** 전부 같은 배율로 곱하면 26px 제목이 32px 이 되어 과해진다.
//    바닥(min)을 두고, 큰 글자는 살짝만 올린다.
const 글자들 = [
  { key: '1', 이름: '지금 그대로', 설명: '홈 가운데값 12.5px · 일기 11px', f: null },
  { key: '2', 이름: '＋1단 — 바닥 14px', 설명: 'MD3 «최소 본문» 14sp 를 바닥으로. 큰 글자는 +1px', f: (v) => (v < 14 ? Math.max(14, v + 2) : v + 1) },
  { key: '3', 이름: '＋2단 — 바닥 15px', 설명: 'MD3 Body Large 16sp 쪽으로. 제목도 살짝 커진다', f: (v) => (v < 14 ? Math.max(15, v + 3) : v < 20 ? v + 2 : v + 1.5) },
]

// 글자 배율은 computed 값을 읽어 «인라인으로» 덮는다.
// ⛔ html{font-size} 로는 안 된다 — 우리 앱은 px 하드코딩이 많아 rem 이 아니다.
const 글자덮기 = (page, fnSrc) => page.evaluate((src) => {
  // eslint-disable-next-line no-new-func
  const f = new Function('v', `return (${src})(v)`)
  for (const el of document.querySelectorAll('*')) {
    // 꾸미기(레꾸·일꾸) 글자는 «창업자 확정 규격»이라 건드리지 않는다
    if (el.closest('.decor-layer,.memo-note,.cover,[class*="decor"]')) continue
    const s = getComputedStyle(el)
    const v = parseFloat(s.fontSize)
    if (!v) continue
    const n = f(v)
    if (Math.abs(n - v) > 0.05) el.style.setProperty('font-size', n.toFixed(2) + 'px', 'important')
  }
}, fnSrc)

const 톤덮기 = (page, t) => page.evaluate((t) => {
  if (t.theme === 'cream') { document.documentElement.removeAttribute('data-theme'); return }
  document.documentElement.dataset.theme = 'greige'
  for (const [k, v] of Object.entries(t.vars || {})) document.documentElement.style.setProperty(k, v)
  if (t.css) { const s = document.createElement('style'); s.textContent = t.css; document.head.appendChild(s) }
}, t)

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

const 새탭 = async (ctx) => {
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log('  ⚠️ pageerror:', String(e.message || e).split('\n')[0]))
  await page.goto('http://127.0.0.1:4401/hankki/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(800)
  return page
}
const 탭이동 = async (page, L) => {
  const ok = await page.evaluate((L) => {
    const bs = [...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')]
    const t = bs.find((b) => (b.innerText || '').replace(/\s+/g, '').includes(L)); if (!t) return false; t.click(); return true
  }, L)
  if (ok) await page.waitForTimeout(700)
  return ok
}
// 📸 절대원칙 21 — 덮개가 있으면 찍은 판이 거짓이다
const 덮였나 = (page) => page.evaluate(() => {
  const 판정 = '[class*="onboard"],[class*="coach"],[class*="overlay"],[class*="backdrop"]'
  for (const y of [200, 420, 700]) { const c = document.elementFromPoint(195, y)?.closest(판정); if (c) return c.className }
  return ''
})

const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })

const 컷 = []
const 찍기 = async ({ 이름, 톤, 글자, 탭 }) => {
  const page = await 새탭(ctx)
  if (탭) { if (!(await 탭이동(page, 탭))) { console.log(`  ⚠️ ${이름} — 「${탭}」 탭 못 찾음`); await page.close(); return } }
  const d = await 덮였나(page)
  if (d) { console.log(`  ⛔ ${이름} — 덮개: ${d}`); await page.close(); return }
  if (톤) await 톤덮기(page, 톤)
  if (글자?.f) await 글자덮기(page, String(글자.f))
  await page.waitForTimeout(350)
  const buf = await page.screenshot({ type: 'jpeg', quality: 78 })
  // 잰 값도 같이 — 「진짜 그만큼 커졌나」를 판에 숫자로 적는다
  const 잰값 = await page.evaluate(() => {
    const v = []
    for (const el of document.querySelectorAll('*')) {
      for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) {
        const r = el.getBoundingClientRect(); if (r.width < 2 || r.top > innerHeight || r.bottom < 0) continue
        v.push(parseFloat(getComputedStyle(el).fontSize)); break
      }
    }
    v.sort((a, c) => a - c)
    return { 덩이: v.length, 가운데: v[Math.floor(v.length / 2)] || 0, 미만14: v.filter((x) => x < 14).length }
  })
  컷.push({ 이름, b64: buf.toString('base64'), 잰값 })
  console.log(`  ✅ ${이름}  가운데 ${잰값.가운데}px · 14px미만 ${Math.round(잰값.미만14 / 잰값.덩이 * 100)}%`)
  await page.close()
}

console.log('\n🎨 톤 네 갈래 (홈 · 글자는 지금 그대로)')
for (const t of 톤들) await 찍기({ 이름: `톤${t.key}`, 톤: t, 글자: null, 탭: null })

console.log('\n🔠 글자 세 단 — 홈')
for (const g of 글자들) await 찍기({ 이름: `홈-글자${g.key}`, 톤: null, 글자: g, 탭: null })

console.log('\n🔠 글자 세 단 — 일기 (14px 미만이 91% 로 제일 심했던 화면)')
for (const g of 글자들) await 찍기({ 이름: `일기-글자${g.key}`, 톤: null, 글자: g, 탭: '일기' })

console.log('\n⭐ 합친 판 — 내 추천(톤D ＋ 글자2)이 어떻게 보이나')
await 찍기({ 이름: '합-홈', 톤: 톤들[3], 글자: 글자들[1], 탭: null })
await 찍기({ 이름: '합-일기', 톤: 톤들[3], 글자: 글자들[1], 탭: '일기' })

await b.close(); srv.close()

writeFileSync(join(OUT, '컷.json'), JSON.stringify({ 컷, 톤들: 톤들.map(({ f, ...r }) => r), 글자들: 글자들.map(({ f, ...r }) => r) }))
console.log(`\n📦 컷 ${컷.length}장 → ${OUT}/컷.json`)
