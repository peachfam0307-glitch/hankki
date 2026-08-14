// 📸 냉장고 가로 줄 — 실물 캡처 ＋ 여백 실측 (규칙 21: 보여주기 «전»에 내가 열어서 본다)
//
// ⚠️ 재현판이 「첫 카드 x=0」을 뱉었다 — 숫자로는 통과지만 **화면 왼쪽 끝에 딱 붙는다**는 뜻이다.
//    창업자가 v10.21 에 *"왼쪽이 잘린 것 같아"* 로 정확히 이 모양을 잡은 적이 있다.
//    → 왜 0 인지 computed 값으로 재고, 캡처를 떠서 눈으로 본다.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = 4198
const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT)], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 3500))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 368, height: 818 }, deviceScaleFactor: 3, timezoneId: 'Asia/Seoul' })
const p = await ctx.newPage()
p.on('pageerror', (e) => console.log('⛔ pageerror', String(e).slice(0, 140)))
await p.addInitScript((names) => {
  localStorage.setItem('hankki:onboarded', '1')
  const o = Storage.prototype.getItem
  Storage.prototype.getItem = function (k) { return k.startsWith('hankki:coach:') ? '1' : o.call(this, k) }
  const raw = localStorage.getItem('hankki:v1')
  const s = raw ? JSON.parse(raw) : {}
  s.recipes = s.recipes || []
  s.pantry = names.map((n, i) => ({ id: `p${i}`, name: n, at: Date.now() }))
  localStorage.setItem('hankki:v1', JSON.stringify(s))
}, ['양파', '돼지고기', '두부', '애호박', '김치', '대파'])
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(500)
await p.locator('.bottom-nav button', { hasText: '장보기' }).first().click()
await p.waitForTimeout(400)
await p.locator('button.seg', { hasText: '냉장고' }).first().click()
await p.waitForTimeout(900)

const 잰값 = await p.evaluate(() => {
  const row = document.querySelector('.hscroll')
  if (!row) return { 없음: true }
  const cs = getComputedStyle(row)
  const par = row.parentElement
  const pcs = getComputedStyle(par)
  const 제목 = [...document.querySelectorAll('.h-section')].find((x) => x.textContent.includes('가진 재료'))
  const 재료 = document.querySelector('.wish-row')
  const L = (el) => (el ? Math.round(el.getBoundingClientRect().x) : null)
  return {
    줄: { padL: cs.paddingLeft, marL: cs.marginLeft, x: Math.round(row.getBoundingClientRect().x), w: Math.round(row.getBoundingClientRect().width) },
    // ⚠️ 첫 판에 부모 «x» 를 안 재서 「왜 첫 카드가 0 인가」를 못 풀었다(규칙 18 — 빠진 값이 원인이었다)
    부모: { tag: par.tagName + '.' + par.className, padL: pcs.paddingLeft, x: Math.round(par.getBoundingClientRect().x) },
    첫카드x: L(row.querySelector('button')),
    제목x: L(제목),
    재료줄x: L(재료),
    화면: innerWidth,
  }
})
console.log(JSON.stringify(잰값, null, 2))
if (!잰값.없음) {
  const { 제목x, 첫카드x } = 잰값
  console.log(`\n📐 왼쪽 줄맞춤 — 제목 x=${제목x} · 첫 카드 x=${첫카드x} · 재료 줄 x=${잰값.재료줄x}`)
  console.log(제목x === 첫카드x ? '✅ 제목과 카드 왼쪽이 맞는다' : `⛔ ${Math.abs(제목x - 첫카드x)}px 어긋난다 — 카드가 ${첫카드x < 제목x ? '왼쪽으로 튀어나왔다' : '안쪽으로 들어갔다'}`)
}

await p.screenshot({ path: 'docs/_shot/냉장고가로-0812.png' })
// 옆으로 민 뒤에도 성한가
await p.evaluate(() => { const r = document.querySelector('.hscroll'); if (r) r.scrollLeft = 300 })
await p.waitForTimeout(400)
await p.screenshot({ path: 'docs/_shot/냉장고가로-민뒤-0812.png' })
console.log('\n📸 docs/_shot/냉장고가로-0812.png · 냉장고가로-민뒤-0812.png')
await b.close(); srv.kill(); process.exit(0)
