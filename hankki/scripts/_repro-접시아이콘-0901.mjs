// 🍽 홈 「자주 해먹는」 — 프레임을 얹은 레시피만 그림이 56% 인가 (창업자 확정 2026-09-01 = 갈래 「라」)
//
// 📮 창업자 = *"음식아이콘을 레꾸에서 정확하게 가을의 정원으로 딱 덮었는데 **홈에서는 아이콘이 더 크네**.."*
//    → 갈래 넷을 실물로 보여주고 판정 = **"라."**(프레임 얹은 것만 56% · 나머지는 70% 그대로)
//
// ⭐⭐ **이 검사의 심장 = 「화면에 그려진 px」이다.** 소스의 `iconSize` 문자열이 아니다(절대원칙 30).
//    ⛔ 소스를 grep 하면 주석에 적힌 「56%」·「70%」까지 걸려 **고쳐놓고도 통과·실패가 뒤집힌다**.
//
// 🧪 규칙 12 = 두 자리를 `iconSize="70%"` 로 되돌리면 ①이 죽는다 · `hasFrameDecor` 를 늘 false 로 만들어도 죽는다.
//    ＋ ②가 «같이» 있어야 한다 — ①만 있으면 「전부 56%」로 만들어도 통과해
//       2026-08-23 창업자 지시(*"조금만더크게수정"*)를 조용히 되돌릴 수 있다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-접시아이콘-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
const PORT = 4398
await new Promise((r) => srv.listen(PORT, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
// ⏰ 날짜는 «한 곳»에서만 만든다 (절대원칙 27) — 게이트 `check-kst` 가 이걸 막았다
const { todayKST } = await import('../src/today.js')
const TODAY = todayKST()
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const URL0 = `http://127.0.0.1:${PORT}/hankki/`
const 오류 = []
page.on('pageerror', (e) => 오류.push(String(e)))
await page.goto(URL0, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)

// 🍽 「자주 해먹는」 줄의 «첫 칸엔 접시를 얹고 · 둘째 칸은 맨판»으로 둔다 — 한 화면에서 둘을 나란히 잰다.
//   ⛔ 전부 씌우면 「늘 56%」로 만들어도 통과한다. **갈리는 걸 봐야 한다.**
const 씌움 = await page.evaluate((오늘) => {
  const raw = localStorage.getItem('hankki:v1'); if (!raw) return null
  const st = JSON.parse(raw); const rs = st.recipes || []
  if (rs.length < 2) return null
  for (const r of rs) { r.thumb = 'icon'; r.image = null; r.decor = [] }
  rs[0].decor = [{ id: 'repro-dish', type: 'sticker', key: 'pf_ad01', x: 0.5, y: 0.5, s: 0.62, r: 0 }]
  // ⭐ 홈 「자주 해먹는」은 «많이 만든 순»(`r.cooked`)이라 자리를 못 고른다 → 둘을 맨 앞으로 올린다.
  //   ⛔⛔ `r.cooked = 9` 만 심으면 «안 먹힌다» — 앱이 켜질 때 `reconcileCooked` 가
  //      **일기 수를 세서 덮어쓴다**(`store.jsx:602`). 그래서 일기를 «같이» 심는다.
  st.diary = [...(st.diary || [])]
  for (const r of [rs[0], rs[1]]) {
    r.cooked = 9
    for (let i = 0; i < 9; i++) st.diary.push({ id: `repro-${r.id}-${i}`, recipeId: r.id, date: 오늘, note: '' })
  }
  localStorage.setItem('hankki:v1', JSON.stringify(st))
  return { 프레임: rs[0].id, 맨판: rs[1].id }
}, TODAY)
if (!씌움) { console.log('⛔ 레시피를 못 심었다'); await b.close(); srv.close(); process.exit(1) }

await page.goto(URL0, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(1500)

const 잰것 = await page.evaluate(() => {
  const out = []
  for (const card of document.querySelectorAll('.mini-card')) {
    const imgs = [...card.querySelectorAll('img')]
    const 접시 = imgs.find((i) => (i.src || '').includes('pf_ad01'))
    // 판 = 그림·접시를 «둘 다» 품는 가장 작은 정사각 상자
    const 그림 = imgs.find((i) => i !== 접시 && Math.min(i.getBoundingClientRect().width, i.getBoundingClientRect().height) > 8)
    if (!그림) continue
    let el = 그림.parentElement, 판 = null
    while (el && el !== document.body) {
      const r = el.getBoundingClientRect()
      if (r.width > 20 && Math.abs(r.width / r.height - 1) < 0.02) { 판 = r; break }
      el = el.parentElement
    }
    if (!판) continue
    const F = 그림.getBoundingClientRect()
    out.push({
      이름: (card.querySelector('.name') || {}).textContent || '?',
      프레임: !!접시,
      비: +(Math.min(F.width, F.height) / 판.width).toFixed(3),
      접시대비: 접시 ? +(Math.min(F.width, F.height) / 접시.getBoundingClientRect().width).toFixed(3) : null,
    })
  }
  return out
})

const 프레임칸 = 잰것.filter((v) => v.프레임)
const 맨판칸 = 잰것.filter((v) => !v.프레임)
const 칸 = []
const 넣 = (ok, 말, 덧 = '') => { 칸.push(ok); console.log(`  ${ok ? '✅' : '⛔'} ${말}${덧 ? `  — ${덧}` : ''}`) }

console.log('\n🍽 홈 「자주 해먹는」 음식 그림 — 프레임 얹은 것만 56%인가 (390×844)\n')
넣(프레임칸.length > 0 && 맨판칸.length > 0, '프레임 칸과 맨판 칸이 한 화면에 둘 다 있다',
  `프레임 ${프레임칸.length}칸 · 맨판 ${맨판칸.length}칸`)
// ① 프레임을 얹은 칸 = 레꾸와 같은 56%
넣(프레임칸.length > 0 && 프레임칸.every((v) => Math.abs(v.비 - 0.56) < 0.02),
  '① 프레임 얹은 칸 = 그림÷판 0.56 (레꾸 캔버스와 같다)', 프레임칸.map((v) => `${v.이름} ${v.비}`).join(' · '))
// ①-b 접시 밖으로 안 나간다 — 창업자가 본 그 증상
넣(프레임칸.length > 0 && 프레임칸.every((v) => v.접시대비 != null && v.접시대비 <= 1),
  '①-b 그림이 접시 «안»에 담긴다 (밖으로 안 넘친다)', 프레임칸.map((v) => `그림÷접시 ${v.접시대비}`).join(' · '))
// ② 맨판 칸은 70% 그대로 — 2026-08-23 창업자 지시를 조용히 되돌리지 않는다
넣(맨판칸.length > 0 && 맨판칸.every((v) => Math.abs(v.비 - 0.70) < 0.02),
  '② 프레임 «없는» 칸 = 그림÷판 0.70 그대로 (2026-08-23 "조금만더크게수정")', 맨판칸.map((v) => `${v.이름} ${v.비}`).join(' · '))
넣(오류.length === 0, 'pageerror 0', 오류.join(' | '))

const 통과 = 칸.filter(Boolean).length
console.log(`\n  ${통과}/${칸.length}\n`)
await b.close(); srv.close()
process.exit(통과 === 칸.length ? 0 : 1)
