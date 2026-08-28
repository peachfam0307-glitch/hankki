// 🐻🐧 레꾸 서랍 「친구들」 탭 — 꼬르곰·펭펭 칸이 «글자 픽커만큼» 커졌나 (2026-08-28)
//
// 📮 창업자 = *"레꾸에서 친구들에 꼬르곰 펭펭을 글자에 있는 꼬르곰 펭펭만큼 크기를 키웠으면 좋겠어. **잘 안보여.**"*
//    → *"글자픽커에있는 꼬르곰 펭펭크기만큼 키우면 될 것 같아"*
//
// ⭐ 재는 것 = **칸의 실제 폭**(px) — 「bigCell 을 달았다」가 아니라 «화면에서 커졌나».
//    ⛔ 소스에 플래그가 있는지 grep 하는 걸로는 아무것도 못 잰다(절대원칙 18 ⓘ).
//       CSS 우선순위가 어긋나면 플래그가 있어도 칸은 그대로다 —
//       `.decor-grid` 를 잡는 미디어쿼리가 둘이나 있어서 실제로 위험한 자리다(styles.css 3791줄 경고).
//
// 🔒 통과 조건 = 친구들 탭 꼬르곰·펭펭 칸 폭 ≈ 글자 탭 칸 폭 (10% 안)
//
// 실행: node /home/user/hankki/hankki/scripts/_shot-곰펭칸-0828.mjs
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
await new Promise((r) => srv.listen(4393, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
// ⛔ 창업자 폰 폭(390)으로 잰다 — 칸 수가 폭에 따라 갈려서 넓은 화면으로 재면 딴 결과가 나온다
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })

const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4393/', { waitUntil: 'networkidle' })
await p.waitForTimeout(1000)

// 레시피 → 첫 편 → 레꾸(꾸미기)
await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click()
await p.waitForTimeout(1200)
await p.locator('.name').first().click()
await p.waitForTimeout(1200)
// ⛔ 단추 글자는 「레시피 꾸미기」다 — 「레꾸」로 찾으면 «못 찾고도» 조용히 지나간다.
//    첫 판이 그래서 상세 화면에 선 채로 「잴 것을 못 찾았다」로 죽었다(그건 게이트가 «맞게» 걸린 것이다).
const 레꾸 = p.locator('button', { hasText: '레시피 꾸미기' }).first()
await 레꾸.waitFor({ state: 'visible', timeout: 8000 })
await 레꾸.click()
await p.waitForTimeout(1600)

const 재기 = async () => p.evaluate(() => {
  const 답 = {}
  for (const sec of document.querySelectorAll('.decor-sec, [class*="decor"]')) {
    const 제목 = sec.querySelector('button')?.textContent?.trim()
    const 격자 = sec.querySelector('.decor-grid')
    if (!제목 || !격자) continue
    const 칸 = 격자.querySelector('.decor-cell')
    if (!칸) continue
    답[제목] = { 칸폭: Math.round(칸.getBoundingClientRect().width), wordy: 격자.classList.contains('wordy') }
  }
  return 답
})

// 🚪 레꾸에 들어오면 «사용법 시트»가 화면을 덮는다 — 그대로 두면 탭을 눌러도 시트가 클릭을 가로챈다.
//    ⛔ 이걸 안 치우면 「탭을 눌렀다」고 생각하는데 실제로는 아무 데도 안 간다(절대원칙 18 ⓘ).
for (let i = 0; i < 4; i++) {
  if (!(await p.locator('.sheet-mask').count())) break
  await p.keyboard.press('Escape')
  await p.waitForTimeout(400)
  if (await p.locator('.sheet-mask').count()) { await p.mouse.click(195, 60); await p.waitForTimeout(400) }
}
if (await p.locator('.sheet-mask').count()) { console.error('⛔ 덮은 시트를 못 치웠다 — 탭을 못 누른다'); process.exit(1) }

// 친구들 탭
const 탭 = async (이름) => {
  const t = p.locator('button', { hasText: 이름 })
  for (let i = 0; i < await t.count(); i++) {
    const el = t.nth(i)
    if ((await el.textContent())?.trim() === 이름) { await el.click(); await p.waitForTimeout(900); return true }
  }
  return false
}

await 탭('친구들')
const 친구들 = await 재기()
// 👀 창업자가 볼 자리는 «꼬르곰·펭펭 묶음» 이다 — 서랍 맨 위(출시 축하)만 찍으면 정작 그걸 못 본다
await p.evaluate(() => {
  const 제목 = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === '꼬르곰·펭펭')
  제목?.scrollIntoView({ block: 'start' })
})
await p.waitForTimeout(700)
await p.screenshot({ path: join(OUT, '30-서랍-친구들.png') })

await 탭('글자')
const 글자 = await 재기()
await p.screenshot({ path: join(OUT, '31-서랍-글자.png') })

await b.close()
srv.close()

console.log('\n🐻🐧 친구들 탭'); for (const [k, v] of Object.entries(친구들)) console.log(`   ${String(v.칸폭).padStart(4)}px  ${v.wordy ? '큰칸' : '작은칸'}  ${k}`)
console.log('\n✏️ 글자 탭');    for (const [k, v] of Object.entries(글자))   console.log(`   ${String(v.칸폭).padStart(4)}px  ${v.wordy ? '큰칸' : '작은칸'}  ${k}`)

const 곰펭 = Object.entries(친구들).find(([k]) => k.includes('꼬르곰') && k.includes('펭펭'))
const 기준 = Object.values(글자).find((v) => v.wordy)
if (!곰펭 || !기준) { console.error('⛔ 잴 것을 못 찾았다 — 화면 경로가 바뀌었을 수 있다'); process.exit(1) }
const 차 = Math.abs(곰펭[1].칸폭 - 기준.칸폭) / 기준.칸폭
console.log(`\n🔎 꼬르곰·펭펭 ${곰펭[1].칸폭}px  ↔  글자 픽커 ${기준.칸폭}px  (차이 ${(차 * 100).toFixed(1)}%)`)
if (차 > 0.1) { console.error('⛔ 아직 칸이 안 커졌다 — 창업자가 말한 「글자 픽커만큼」이 안 됐다'); process.exit(1) }
console.log('✅ 글자 픽커와 같은 칸이다')
