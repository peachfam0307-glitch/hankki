// 🐛 재현 — 「올리브오일 250ml짜리가 목록에서 사라졌어」 (창업자 2026-08-05)
//   ⛔ 사라진 게 아니라 **v9.71 이 잘라놓고 「더보기」를 안 달아서 꺼낼 길이 없었다.**
//      자를 땐 반드시 «꺼낼 길»을 같이 단다 — 이 스크립트가 그걸 못 박는다.
//   판정 = ①큰 칸을 골랐을 때 250ml 가 «보이거나 더보기를 누르면» 나온다 ②세로 길이가 안 늘었다
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다 (2026-08-06)
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = Number(process.env.PORT || 4390)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
process.on('exit', () => { try { srv.kill() } catch { /* noop */ } })
await new Promise((r) => setTimeout(r, 900))

const TARGET = '이리아다 칼라마타 엑스트라버진 실버틴 250ml'
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

const VIEW = 844 - 150
const len = async () => page.evaluate(() => {
  const cards = [...document.querySelectorAll('.card')].filter((c) => c.querySelector('button'))
  return { n: cards.length, total: cards.reduce((s, c) => s + Math.round(c.getBoundingClientRect().height), 0) }
})
const say = async (label) => {
  const r = await len()
  console.log(`  ${label.padEnd(16)} 카드 ${String(r.n).padStart(2)}장 · 합계 ${String(r.total).padStart(5)}px = 화면 ${(r.total / VIEW).toFixed(1)}배`)
  return r
}

let bad = 0
console.log(`\n📏 보이는 높이 ${VIEW}px 기준\n`)

await page.getByRole('button', { name: '전체', exact: true }).first().click()
await page.waitForTimeout(700)
await say('전체')
const moreN = await page.getByText(/개 더보기$/).count()
console.log(`  「더보기」 버튼 ${moreN}개`)
if (!moreN) { console.log('  ⛔ 전체 탭에 더보기가 없다 — 자른 것을 꺼낼 길이 없다'); bad++ }

console.log('\n🫒 큰 칸 「기름·육수」 를 고르면 250ml 를 꺼낼 수 있나')
const chip = page.getByRole('button', { name: /기름·육수/ }).first()
if (!(await chip.count())) { console.log('  ⛔ 칩을 못 찾았다'); bad++ }
else {
  await chip.click()
  await page.waitForTimeout(700)
  await say('기름·육수')
  let seen = await page.getByText(TARGET, { exact: true }).count()
  console.log(`  펼치기 전 250ml 보임 = ${seen ? '✅' : '아직 안 보임(더보기 눌러본다)'}`)
  if (!seen) {
    const btns = page.getByText(/개 더보기$/)
    const n = await btns.count()
    console.log(`  소칸 더보기 ${n}개 — 전부 눌러본다`)
    for (let i = 0; i < n; i++) { const b = page.getByText(/개 더보기$/).first(); if (await b.count()) { await b.click(); await page.waitForTimeout(250) } }
    seen = await page.getByText(TARGET, { exact: true }).count()
  }
  console.log(seen ? '  ✅ 250ml 를 꺼낼 수 있다' : '  ⛔⛔ 250ml 가 끝내 안 나온다 — 여전히 사라진 상태')
  if (!seen) bad++
}

// 🧾 창업자 *"양념류가 9줄이야. 3개정도만 보이고 아래 더보기"* — «줄(소칸)» 개수에도 상한이 있나
console.log('\n🧾 큰 칸 「양념」 — 줄(소칸)이 몇 개 보이나')
const CATS = ['간장', '된장', '맛술', '굴소스', '액젓', '소금', '설탕', '소스', '고춧가루']
const rows = () => page.evaluate((cats) => {
  // 소칸 이름표만 센다 — 제품 이름에 같은 글자가 있어도 안 걸리게 «머리글 칸»만 본다
  const heads = [...document.querySelectorAll('div')].filter((d) => {
    const t = (d.textContent || '').trim()
    return d.children.length <= 1 && cats.includes(t)
  })
  return [...new Set(heads.map((d) => d.textContent.trim()))]
}, CATS)
const chip2 = page.getByRole('button', { name: /^양념$/ }).first()
if (!(await chip2.count())) { console.log('  ⛔ 양념 칩을 못 찾았다'); bad++ }
else {
  await chip2.click()
  await page.waitForTimeout(700)
  const before = await rows()
  console.log(`  펼치기 전 줄 = ${before.length}개 — ${before.join(' · ')}`)
  if (before.length > 3) { console.log('  ⛔ 3줄을 넘는다'); bad++ }
  const gMore = page.getByText(/^양념 \d+개 더보기$/)
  if (!(await gMore.count())) { console.log('  ⛔ 「양념 N개 더보기」가 없다 — 나머지를 꺼낼 길이 없다'); bad++ }
  else {
    await gMore.first().click()
    await page.waitForTimeout(500)
    const after = await rows()
    console.log(`  더보기 누른 뒤 줄 = ${after.length}개`)
    if (after.length !== CATS.length) { console.log(`  ⛔ 9줄이 다 안 나온다`); bad++ }
    else console.log('  ✅ 3줄 → 더보기 → 9줄 다 나온다')
  }
}

await page.screenshot({ path: '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/shop-hidden.png', fullPage: true })
await browser.close()
console.log(bad ? `\n⛔ 통과 못 함 (${bad}건)` : '\n✅ 통과 — 자른 것에 꺼낼 길이 다 있다')
process.exit(bad ? 1 : 0)
