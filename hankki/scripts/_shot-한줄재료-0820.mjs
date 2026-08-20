// 📸 홍보 카드 재료 — 「어제 만든 것」 카드 ＋ 「한 줄 남기기」 입력창 (2026-08-20)
//
// 📮 창업자가 바깥(지피티)에 넘길 원본으로 요청 = *"B안 제작 전까지 어제 만든 것 카드와 한 줄 남기기 입력창 캡처"*
//
// ⭐ 왜 시드를 «심어야» 하나 = 「어제 만든 것」은 갈래 ①(한줄)이라
//    **어제~사흘 전에 만들었고 한 줄을 «안 쓴» 일기**가 있어야만 뜬다(`src/nextUp.js`).
//    기본 시드는 `cooked` 가 0 이라 갈래 ②(「아직 안 해봤어요」)가 나온다.
//
// ⛔ `page.reload()` 로 되살리지 않는다 — 저장값이 시드로 덮여 「안 남는다」로 보인다
//    (CLAUDE.md 규칙 19 · `check-mistakes` ⑧ 옛 함정 사전). **새 탭**으로 연다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_shot-한줄재료-0820.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홍보/앱캡처'
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
await new Promise((r) => srv.listen(4393, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })

// ── ① 앱을 한 번 띄워 시드 레시피를 채운다 ────────────────────────────
const p0 = await ctx.newPage()
await p0.goto('http://127.0.0.1:4393/hankki/', { waitUntil: 'networkidle' })
await p0.waitForTimeout(1200)

// ── ② 「어제 만든 것」이 되도록 일기 한 장을 심는다 ────────────────────
const 심은것 = await p0.evaluate(() => {
  const KEY = 'hankki:v1'
  const st = JSON.parse(localStorage.getItem(KEY) || '{}')
  const 살아있는 = (st.recipes || []).filter((r) => r && r.status !== 'unsorted')
  if (!살아있는.length) return { ok: false, 왜: '레시피가 0편' }
  // ⭐ 제목이 짧고 그림이 있는 편을 고른다 — 카드에 이름이 한 줄로 예쁘게 들어간다
  const r = 살아있는.find((x) => (x.title || '').length <= 7) || 살아있는[0]
  const 어제 = new Date(); 어제.setDate(어제.getDate() - 1); 어제.setHours(19, 20, 0, 0)
  st.diary = [{ id: 'promo1', recipeId: r.id, title: r.title, at: 어제.getTime(), rating: 0, note: '', photo: null }, ...(st.diary || [])]
  // 「만들었어요」를 누른 상태와 같게 (안 맞추면 갈래 ②로 샐 수 있다)
  st.recipes = st.recipes.map((x) => (x.id === r.id ? { ...x, cooked: (x.cooked || 0) + 1, cookedAt: 어제.getTime() } : x))
  localStorage.setItem(KEY, JSON.stringify(st))
  return { ok: true, 제목: r.title }
})
console.log('  🌱 심은 일기:', JSON.stringify(심은것))
await p0.close()
if (!심은것.ok) { await b.close(); srv.close(); process.exit(1) }

// ── ③ 새 탭으로 열어 홈을 찍는다 (⛔reload 금지) ──────────────────────
const page = await ctx.newPage()
page.on('pageerror', (e) => console.log('  ⚠️', String(e.message || e).split('\n')[0]))
await page.goto('http://127.0.0.1:4393/hankki/', { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(1200)

// ⛔ 찍기 «전»에 화면 한가운데를 덮은 게 있나 본다 (절대원칙 21)
const 덮개 = await page.evaluate(() => {
  const 판정 = '[class*="onboard"],[class*="coach"],[class*="overlay"],[class*="backdrop"],[class*="modal"]'
  for (const y of [200, 420, 700]) {
    const el = document.elementFromPoint(195, y)
    const c = el?.closest(판정)
    if (c) return `y=${y} · ${c.className}`
  }
  return ''
})
if (덮개) { console.log('  ⛔ 덮개가 있다:', 덮개); await b.close(); srv.close(); process.exit(1) }

const 라벨 = await page.evaluate(() => document.querySelector('.next-label')?.textContent || '(없음)')
console.log('  🏷 카드 라벨 =', 라벨)

await page.screenshot({ path: join(OUT, '1-홈-전체.png') })
const 카드 = await page.$('.next-card')
if (카드) await 카드.screenshot({ path: join(OUT, '2-어제만든것-카드.png') })
const 줄 = await page.$('.next-row')
if (줄) await 줄.screenshot({ path: join(OUT, '3-어제만든것-줄.png') })

// ── ④ 「한 줄 남기기」를 눌러 입력창을 찍는다 ──────────────────────────
await page.getByRole('button', { name: '한 줄 남기기' }).first().click()
await page.waitForTimeout(900)
await page.screenshot({ path: join(OUT, '4-한줄남기기-빈칸.png') })

// 글자를 넣은 판도 — 홍보 카드엔 «쓰고 있는 모습»이 낫다
const 칸 = page.locator('textarea, input[type="text"]').first()
if (await 칸.count()) { await 칸.click(); await 칸.type('간장 반만 넣으니 딱 좋았다', { delay: 18 }) }
const 별 = page.locator('[aria-label="4점"]').first()
if (await 별.count()) await 별.click()
await page.waitForTimeout(500)
await page.screenshot({ path: join(OUT, '5-한줄남기기-쓰는중.png') })

const 시트 = await page.$('.sheet')
if (시트) await 시트.screenshot({ path: join(OUT, '6-한줄남기기-시트만.png') })

await b.close(); srv.close()
console.log(`\n📸 → ${OUT}`)
