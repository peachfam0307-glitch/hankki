// 📏 주부의 장바구니가 «세로로 얼마나 긴가» — 창업자 *"6-7개까지 아래로 쭉 늘어나는게 좀 불편"*
//   ⛔ 눈대중으로 「길다/짧다」 하지 않는다. 화면 몇 배인지 숫자로 잰다.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = Number(process.env.PORT || 4360)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
process.on('exit', () => { try { srv.kill() } catch { /* noop */ } })
await new Promise((r) => setTimeout(r, 900))

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
await page.goto(`http://127.0.0.1:${PORT}/`)
await page.evaluate(() => {
  localStorage.setItem('hankki:onboarded', '1')
  for (const k of ['hankki:coach:home2', 'hankki:coach:my', 'hankki:coach:search', 'hankki:coach:shop', 'hankki:coach:brag']) localStorage.setItem(k, '1')
})
await page.goto(`http://127.0.0.1:${PORT}/`)
await page.waitForTimeout(2000)
await page.getByText('장보기', { exact: true }).last().click()
await page.waitForTimeout(1200)

const VIEW = 844 - 150 // 상·하단 바를 뺀 «실제로 보이는» 높이
const measure = async (label) => {
  await page.waitForTimeout(600)
  const r = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.card')].filter((c) => c.querySelector('button'))
    const h = cards.map((c) => Math.round(c.getBoundingClientRect().height))
    const total = h.reduce((a, b) => a + b, 0)
    return { n: cards.length, one: h[0] || 0, total }
  })
  console.log(`  ${label.padEnd(12)} 카드 ${String(r.n).padStart(2)}장 · 한 장 ${r.one}px · 합계 ${r.total}px = 화면 ${(r.total / VIEW).toFixed(1)}배`)
  return r
}

console.log(`\n📏 보이는 높이 ${VIEW}px 기준\n`)
await measure('이번 주 픽')
for (const name of ['전체', '양념', '기름']) {
  const btn = page.getByRole('button', { name, exact: true })
  if (await btn.count()) { await btn.first().click(); await measure(name) }
  else console.log(`  ${name.padEnd(12)} (칩 없음)`)
}
await page.screenshot({ path: '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/shop-len.png', fullPage: true })
console.log('\n📂 전체 화면 = scratchpad/shop-len.png')
await browser.close()
