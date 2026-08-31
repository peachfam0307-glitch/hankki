// 📏 가져오기 화면 «네모 박스 안» 글자의 줄간·크기를 잰다 (창업자 2026-08-24)
//    📮 *"페이지가 정신이 없게 느껴져. 줄간도 균일하게"* → *"네모박스안에 있는 글자 줄간 말한거야."*
//    ⛔ 눈으로 세지 않는다 — 상자마다 실제 computed 값을 읽는다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { COACH } = await import('../src/coach.js')
const now = Date.now()
const state = { recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })), seedV: BASICS_VERSION }
const PORT = Number(process.env.PORT || 4401)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
process.on('exit', () => { try { srv.kill() } catch { /* noop */ } })
await new Promise((r) => setTimeout(r, 900))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage()
page.setDefaultTimeout(15000)
const url = `http://127.0.0.1:${PORT}/`
await page.goto(url)
await page.evaluate(({ s, keys }) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
  keys.forEach((k) => localStorage.setItem(k, '1'))
  localStorage.setItem('hankki:ocrLeft', JSON.stringify({ welcome: 20, month: 5 }))
}, { s: state, keys: Object.values(COACH) })
await page.goto(url); await page.waitForTimeout(1800)
console.log('· 홈 떴다')
try { await page.locator('[data-coach="import"]').first().click({ timeout: 8000 }) }
catch { await page.getByText('가져오기', { exact: true }).last().click({ timeout: 8000 }) }
await page.waitForTimeout(1500)
console.log('· 가져오기 열었다')

const 줄 = await page.evaluate(() => {
  const 화면 = document.querySelectorAll('.screen')
  const 지금 = 화면[화면.length - 1]
  // 「네모 박스」 = 모서리가 둥글고 바탕이나 테두리가 있는 상자
  // ⛔ 화면 전체를 훑고 상자마다 또 훑으면 O(n²) 이라 멎는다(첫 판이 4분을 넘겨 죽었다).
  //    바깥 상자만 남긴다 — 상자 «안»의 상자는 부모가 이미 담고 있다.
  const 후보 = [...지금.querySelectorAll('.pad div, .pad button')].slice(0, 400)
  const 상자들 = 후보.filter((e) => {
    const c = getComputedStyle(e)
    const r = parseFloat(c.borderRadius) || 0
    const 바탕 = c.backgroundColor !== 'rgba(0, 0, 0, 0)' && c.backgroundColor !== 'transparent'
    const 테 = parseFloat(c.borderTopWidth) > 0
    const b = e.getBoundingClientRect()
    return r >= 8 && (바탕 || 테) && b.width > 120 && b.height > 30 && b.top > 0 && b.top < 900
  })
  const out = []
  상자들.forEach((상자, i) => {
    const bb = 상자.getBoundingClientRect()
    const 글들 = [...상자.querySelectorAll('div,span,b')].filter((e) => {
      const t = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join('')
      return t.length > 0
    })
    글들.forEach((e) => {
      const c = getComputedStyle(e)
      const fs = parseFloat(c.fontSize)
      const lh = c.lineHeight === 'normal' ? null : parseFloat(c.lineHeight)
      out.push({
        상자: i, 위: Math.round(bb.top),
        글: (e.textContent || '').trim().slice(0, 22),
        크기: +fs.toFixed(1),
        줄간: lh === null ? 'normal' : +(lh / fs).toFixed(2),
        줄간px: lh === null ? null : Math.round(lh),
        색: c.color,
      })
    })
  })
  return out
})
const 상자수 = new Set(줄.map((r) => r.상자)).size
console.log(`네모 박스 ${상자수}개 · 글줄 ${줄.length}개\n`)
console.log('상자 크기  줄간   줄간px  색                    글')
let 앞 = null
for (const r of 줄) {
  if (앞 !== null && r.상자 !== 앞) console.log('  ─────')
  앞 = r.상자
  console.log(`  ${String(r.상자).padStart(2)}  ${String(r.크기).padStart(4)}  ${String(r.줄간).padStart(5)}  ${String(r.줄간px ?? '-').padStart(5)}  ${r.색.padEnd(20)}  ${r.글}`)
}
const 값 = [...new Set(줄.map((r) => r.줄간))]
console.log(`\n⚠️ 지금 쓰이는 줄간 = ${값.length}가지 — ${JSON.stringify(값)}`)
await b.close()
