// 🎬🎑 **추석 장식 릴스 — 앱 실사 녹화** (살구 배경)
// 📮 창업자 2026-09-09 = *"살구배경으로 추석 배치한거 찍어서 인스타용만들어줘(릴스로) 올리게"*
//
// ⭐ 보여줄 것 = ① 홈에 보름달이 떴다 ② 스크롤하면 한복 곰펭이 나온다
//    ③ **탭마다 상단바 애들이 한복으로 갈아입었다** (사진 한 장으론 못 보여주는 것 = 릴스를 쓸 이유)
//
// ⛔ 녹화 크기 = viewport 그대로(390×844). `deviceScaleFactor` 를 곱하면 앱이 구석에 처박힌다
//    (2026-08-29 실측 — `_영상-타이머릴스-0829.mjs` 주석 참조).
// ⛔ 앱이 뜨는 동안은 «번쩍»거린다 — 잘라낼 지점을 찍어 편집판에 넘긴다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/추석릴스'
mkdirSync(OUT, { recursive: true })
const DIST = new URL('../dist', import.meta.url).pathname
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/' || !extname(p)) p = '/index.html'
  try { s.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' }); s.end(readFileSync(join(DIST, p))) }
  catch { s.writeHead(404); s.end() }
})
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
  recordVideo: { dir: OUT, size: { width: 390, height: 844 } },
})
await ctx.addInitScript(SEED_COACH_SEEN)
// 🍑 살구 배경 — 창업자 지정. 키는 `src/theme.js` 의 THEME_KEY.
await ctx.addInitScript(() => {
  try {
    localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:news:off', '1')
    localStorage.setItem('hankki-theme', 'apricot')
  } catch {}
})
const 녹화시작 = Date.now()
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(2200)
for (let i = 0; i < 5; i++) {
  const 닫았나 = await p.evaluate(() => {
    const b = [...document.querySelectorAll('button, [role="button"]')].filter((x) => x.getBoundingClientRect().height > 8)
      .find((x) => /^(나중에 볼게요|닫기)$/.test((x.innerText || '').trim()))
    if (!b) return false; b.click(); return true
  })
  if (닫았나) { await p.waitForTimeout(400); continue }
  if (!(await p.locator('.sheet-mask').count())) break
  await p.keyboard.press('Escape'); await p.waitForTimeout(300)
}

// 🍑 살구가 «진짜로» 걸렸나 — 화면으로 확인한다(규칙 18 ⓘ: 검사가 무엇을 보는지)
// ⛔ body 배경색으로 재면 안 된다 — 살구 토큰(#fdf1e8)과 실제 칠해지는 색이 다르다(그라데이션·겹칩).
//    테마는  로 걸리니 «그 속성»을 본다(theme.js 43줄).
const 바탕 = await p.evaluate(() => document.documentElement.getAttribute('data-theme'))
// ⛔ 장식은 «body 로 나가 있다»(.fade 의 transform 때문에 통 안에 두면 fixed 가 갇힌다).
//    그래서 .screen 안에서 찾으면 늘 0 이 나온다 — 2026-09-09 에 실제로 그렇게 헛발을 짚었다.
const 철 = await p.evaluate(() => document.querySelectorAll('body > div[aria-hidden] img[src*="season"], body > div[aria-hidden] img').length)
console.log('  · 배경 =', 바탕, '· 홈 장식 조각 =', 철)

await p.waitForTimeout(1200)
const 잘라낼초 = (Date.now() - 녹화시작) / 1000   // ✂️ 여기부터가 «진짜»다

// ── ① 홈 맨 위 (보름달) ──
await p.waitForTimeout(1600)

// ── ② 천천히 굴린다 — 한복 곰펭이 지나가고 맨 아래 인사까지 ──
// ⛔ 앱은 document 가 안 구른다. 제일 많이 구를 수 있는 «안쪽 통»을 찾는다.
const 굴리기 = async (초) => {
  await p.evaluate((ms) => new Promise((끝) => {
    const 통 = [...document.querySelectorAll('*')].map((e) => [e, e.scrollHeight - e.clientHeight])
      .filter(([e, d]) => d > 40 && e.clientHeight > 200).sort((a, b) => b[1] - a[1])[0]?.[0]
    if (!통) return 끝()
    const 끝점 = 통.scrollHeight - 통.clientHeight, 시작 = 통.scrollTop, t0 = performance.now()
    const 한걸음 = (t) => {
      const r = Math.min(1, (t - t0) / ms)
      통.scrollTop = 시작 + (끝점 - 시작) * (r < .5 ? 2 * r * r : 1 - 2 * (1 - r) ** 2)  // 부드럽게
      r < 1 ? requestAnimationFrame(한걸음) : 끝()
    }
    requestAnimationFrame(한걸음)
  }), 초 * 1000)
}
await 굴리기(6.0)
await p.waitForTimeout(1400)

// ── ③ 탭마다 상단바가 한복으로 갈아입었다 ──
const 탭으로 = async (이름) => {
  const t = p.locator('.bottom-nav .nav-item').filter({ hasText: 이름 }).first()
  if (!(await t.count())) return false
  await t.click().catch(() => {}); await p.waitForTimeout(1500); return true
}
for (const 이름 of ['레시피', '일기', '장보기']) await 탭으로(이름)
// 🧊 냉장고는 탭이 아니라 장보기 «안» 화면이다
await p.evaluate(() => [...document.querySelectorAll('button,[role="button"]')]
  .find((x) => (x.innerText || '').trim() === '냉장고')?.click())
await p.waitForTimeout(1500)
await 탭으로('레꾸자랑')
await p.waitForTimeout(1600)

const 영상 = await p.video()?.path()
await ctx.close(); await b.close(); srv.close()
if (영상) {
  const 새이름 = join(OUT, '추석장식-앱실사.webm')
  try { renameSync(영상, 새이름) } catch {}
  writeFileSync(join(OUT, '자를지점.json'), JSON.stringify({ 잘라낼초: Number(잘라낼초.toFixed(2)) }, null, 2))
  console.log(`🎥 ${새이름}\n✂️  앞 ${잘라낼초.toFixed(2)}초 = 로딩 구간`)
}
// ⛔ 살구가 아니거나 장식이 0개면 릴스의 알맹이가 안 찍힌 것이다 — 조용히 넘기지 않는다.
if (바탕 !== 'apricot') { console.error('⛔ 살구 배경이 안 걸렸다 —', 바탕); process.exit(1) }
if (철 < 2) { console.error('⛔ 홈 장식이 안 떴다 —', 철); process.exit(1) }
console.log('✅ 살구 배경 ＋ 추석 장식이 화면에 찍혔다')
