// 📮 재현 — 「내가 꾸민 표지」 공유가 허가 만료로 «다운로드»로 밀리던 것 (창업자 2026-08-05 *"내가만든표지는안돼"*)
//   판정 = 허가가 끊기면 **「지금 보내기」 버튼**이 뜨고, 그걸 누르면 공유창이 열린다.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = Number(process.env.PORT || 4350)
const THROTTLE = Number(process.env.THROTTLE || 4)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
process.on('exit', () => { try { srv.kill() } catch { /* noop */ } })
await new Promise((r) => setTimeout(r, 900))

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const kong = basicRecipes.find((r) => r.title === '콩국수') // 꾸며진 시드(배경·스티커) — 표지 공유 대상
const now = Date.now()
const state = {
  seedV: BASICS_VERSION, memoCleanV: 1, politeV: 2,
  recipes: [{ ...kong, status: 'sorted', savedAt: now }, ...basicRecipes.filter((r) => r.id !== kong.id).map((r, i) => ({ ...r, status: 'sorted', savedAt: now - (i + 1) * 60000 }))],
}

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
const cdp = await ctx.newCDPSession(page)
await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE })

await page.addInitScript(() => {
  window.__log = []
  let lastTap = 0
  addEventListener('pointerdown', () => { lastTap = performance.now() }, true)
  navigator.canShare = () => true
  navigator.share = (d) => {
    const age = Math.round(performance.now() - lastTap)
    if (age > 1500) { window.__log.push(`⛔ NotAllowedError · 누른 지 ${age}ms`); return Promise.reject(Object.assign(new Error('x'), { name: 'NotAllowedError' })) }
    window.__log.push(`✅ 공유창 열림 · 누른 지 ${age}ms · 파일 ${d.files.length}장`)
    window.__out = []
    for (const f of d.files) {
      const fr = new FileReader()
      fr.onload = () => window.__out.push({ name: f.name, url: fr.result })
      fr.readAsDataURL(f)
    }
    return Promise.resolve()
  }
  const oc = HTMLAnchorElement.prototype.click
  HTMLAnchorElement.prototype.click = function () {
    if (this.download) window.__log.push(`💾 다운로드: ${this.download}`)
    return oc.apply(this, arguments)
  }
})

const url = `http://127.0.0.1:${PORT}/`
await page.goto(url)
await page.evaluate((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:onboarded', '1')
  for (const k of ['hankki:coach:home2', 'hankki:coach:my', 'hankki:coach:search', 'hankki:coach:shop', 'hankki:coach:brag']) localStorage.setItem(k, '1')
}, state)
await page.goto(url)
await page.waitForTimeout(2500)

await page.getByText('레꾸자랑', { exact: true }).last().click()
await page.waitForTimeout(1500)
await page.locator('.grid-card button').first().click()   // 콩국수(꾸며진 것)
// ⏳ PAUSE = 선택 시트를 보고 «고르는 데 걸리는 시간». 이 동안 「미리 캡처」가 돈다.
//    PAUSE=0 이면 미리 캡처가 못 끝나 예전처럼 「지금 보내기」가 뜬다(옛 동작 재현).
const PAUSE = Number(process.env.PAUSE ?? 700)
console.log(`\n⏳ 선택 시트에서 ${PAUSE}ms 머문다(미리 캡처가 도는 시간)`)
await page.waitForTimeout(PAUSE)
const t0 = Date.now()
await page.getByText('내가 꾸민 표지 그대로').click()
console.log('🎨 「내가 꾸민 표지 그대로」 눌렀다 — 결말까지 기다린다\n')

let pressed = false
for (let i = 0; i < 120; i++) {
  await page.waitForTimeout(500)
  if (!pressed && (await page.getByText('지금 보내기').count())) {
    console.log('   📮 「지금 보내기」 버튼이 떴다 — 누른다')
    await page.getByText('지금 보내기').click()
    pressed = true
  }
  const log = await page.evaluate(() => window.__log)
  if (log.some((l) => l.startsWith('✅') || l.startsWith('💾'))) break
}
const log = await page.evaluate(() => window.__log)
console.log('\n📜 무슨 일이 있었나')
if (!log.length) console.log('   ⛔⛔ 아무 일도 안 일어났다')
for (const l of log) console.log('   ' + l)
console.log(`\n⏱ 「내가 꾸민 표지 그대로」 누른 뒤 결말까지 ${Date.now() - t0}ms`)
console.log(pressed ? '   📮 「지금 보내기」가 떴다 = 미리 캡처가 못 끝났다' : '   ⭐ 「지금 보내기」 없이 «바로» 공유창이 열렸다')
await page.waitForTimeout(1500)
const out = await page.evaluate(() => window.__out || [])
const { writeFileSync } = await import('node:fs')
for (const o of out) {
  const f = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/cover-' + o.name
  writeFileSync(f, Buffer.from(o.url.split(',')[1], 'base64'))
  console.log('   💾 ' + f)
}
await browser.close()
process.exit(log.some((l) => l.startsWith('✅')) ? 0 : 1)
