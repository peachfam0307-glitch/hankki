// 🎴🐧 랜덤 카드 — «펭펭 비치체어»(sm_peng_beach) 가 나올 때까지 뽑는다 (2026-08-20)
//
// 📮 창업자 = *"랜덤카드하나 펭펭 수영복입고 의자에 앉아있는거 하자"*
//    · *"선글라스쓰고 의자에 앉아있는거 있어 ㅋ"* · *"3번"* · *"내 최애야"*
//
// 🔎 실물로 찾은 컷 = **`sm_peng_beach`** — 분홍 선글라스 ＋ 파라솔 아래 비치체어 ＋ 수박
//
// ⭐⭐ 확률에 맡기지 않는다 — 코드에 «지정하는 길»이 이미 있었다:
//    `ShareDrawCard.jsx:150` = URL 의 `?card=` 로 **스킨을 콕 집는다.**
//    `?card=summer` 면 풀이 `[S_GOM, S_PENG, S_DUO]` 로 바뀌고,
//    `S_PENG = summerOnly(/^(peng_|pn_|sm_peng_)/)` 라 **펭펭 여름 컷 셋**만 남는다.
//    → 사철 101개에서 1% 를 기다리는 대신 **셋 중 하나**를 기다린다.
//
// ⛔ 시트가 열려 있으면 `.sheet-mask` 가 클릭을 가로챈다 → DOM 에서 직접 `.click()`
//
// 실행: cd /home/user/hankki/hankki && node scripts/_shot-랜덤카드-펭펭비치-0820.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홍보/앱화면'
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
await new Promise((r) => srv.listen(4387, r))

const 원하는컷 = 'sm_peng_beach'
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
page.on('pageerror', (e) => console.log('  ⚠️', String(e.message || e).split('\n')[0]))

// ⭐ `?card=summer` — 여름 스킨을 지정한다
await page.goto('http://127.0.0.1:4387/hankki/?card=summer', { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(1000)

const 글자로눌러 = async (글자, 기다림 = 1500) => {
  const 됐나 = await page.evaluate((t) => {
    const 것들 = [...document.querySelectorAll('button, [role="button"], .press')]
    const 맞는것 = 것들.find((e) => (e.textContent || '').replace(/\s+/g, ' ').trim().includes(t))
    if (!맞는것) return false
    맞는것.click(); return true
  }, 글자)
  if (됐나) await page.waitForTimeout(기다림)
  return 됐나
}
// 🔎 지금 카드에 그 컷이 떠 있나 — «화면의 실제 img src» 로 본다(짐작 금지)
const 지금컷 = async () => page.evaluate(() => [...document.querySelectorAll('img')]
  .map((i) => (i.getAttribute('src') || '').split('/').pop().split('?')[0])
  .filter((n) => /^(sm_|gom_|peng_|pn_|duo_|gp_|gn_)/.test(n)))

await page.locator('.bottom-nav .nav-item').filter({ hasText: '레꾸자랑' }).first().click()
await page.waitForTimeout(1400)
const 콩국수 = page.locator('.grid-card, .album-tile').filter({ hasText: '콩국수' }).first()
const 고를것 = (await 콩국수.count()) ? 콩국수 : page.locator('.grid-card, .album-tile').first()
await 고를것.click(); await page.waitForTimeout(1800)
if (!(await 글자로눌러('랜덤 카드로 뽑기', 2800))) { console.log('  ⛔ 「랜덤 카드로 뽑기」를 못 눌렀다'); await b.close(); srv.close(); process.exit(1) }

let 찾음 = false
let 본것 = new Set()
for (let i = 0; i < 60; i++) {
  const 컷들 = await 지금컷()
  컷들.forEach((n) => 본것.add(n))
  if (컷들.some((n) => n.startsWith(원하는컷))) {
    await page.screenshot({ path: join(OUT, '09b-레꾸자랑-랜덤카드.png') })
    console.log(`  ✅ ${i + 1}번째에 「${원하는컷}」 나왔다`)
    찾음 = true
    break
  }
  if (!(await 글자로눌러('다시', 1600))) { console.log('  ⛔ 「다시 뽑기」를 못 눌렀다'); break }
}

await b.close(); srv.close()
if (!찾음) {
  console.log(`  ⛔ 60번 뽑았는데 「${원하는컷}」이 안 나왔다`)
  console.log('  🔎 그동안 나온 컷:', [...본것].join(' · '))
  process.exit(1)
}
console.log(`  📸 → ${join(OUT, '09b-레꾸자랑-랜덤카드.png')}`)
