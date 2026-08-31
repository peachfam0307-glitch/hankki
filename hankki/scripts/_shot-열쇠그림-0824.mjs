// 📸 「레시피열쇠」 그림이 실제로 그려지나 — 남은 상태 ＋ 다 쓴 상태 (창업자 2026-08-24 *"열쇠컷도 적용해"*)
//    ⭐ 숫자만 보지 않는다(절대원칙 21) — 두 장을 열어서 눈으로 본다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { COACH } = await import('../src/coach.js')
const now = Date.now()
const state = { recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })), seedV: BASICS_VERSION }
const PORT = Number(process.env.PORT || 4399)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
process.on('exit', () => { try { srv.kill() } catch { /* noop */ } })
await new Promise((r) => setTimeout(r, 900))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })).newPage()
page.setDefaultTimeout(15000)
const url = `http://127.0.0.1:${PORT}/`
let 죽음 = 0
for (const [딱지, l] of [['남음', { welcome: 20, month: 5 }], ['다씀', { welcome: 0, month: 0 }]]) {
  await page.goto(url)
  await page.evaluate(({ s, keys, ll }) => {
    localStorage.setItem('hankki:v1', JSON.stringify(s))
    localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
    keys.forEach((k) => localStorage.setItem(k, '1'))
    localStorage.setItem('hankki:ocrLeft', JSON.stringify(ll))
  }, { s: state, keys: Object.values(COACH), ll: l })
  await page.goto(url); await page.waitForTimeout(1800)
  await page.locator('[data-coach="import"]').first().click().catch(() => page.getByText('가져오기', { exact: true }).last().click())
  await page.waitForTimeout(1500)
  const 그림 = await page.evaluate(() => {
    // ⛔ 「남았어요」 글자로 카드를 거슬러 찾으면 «홈에 남아 있던 곰 그림»을 집는다(첫 판이 그랬다).
    //    그림을 콕 집는다 — 이 판이 재는 건 «열쇠 그림이 그려졌나» 하나다.
    const i = document.querySelector('img[src*="key_"]')
    if (!i) return null
    const r = i.getBoundingClientRect()
    return { 파일: (i.currentSrc || i.src).split('/').pop(), 크기: `${Math.round(r.width)}x${Math.round(r.height)}`, 안깨졌나: i.naturalWidth > 0, 화면안: r.top > 0 && r.top < 844 }
  })
  console.log(`  ${딱지}: ${JSON.stringify(그림)}`)
  if (!그림 || !그림.안깨졌나 || !/key_/.test(그림.파일)) 죽음++
  await page.screenshot({ path: `/tmp/shot-key-${딱지}.png`, clip: { x: 0, y: 90, width: 390, height: 240 } })
}
console.log(죽음 ? `⛔ ${죽음}칸 실패` : '✅ 두 상태 다 열쇠 그림이 그려진다')
await b.close(); process.exit(죽음 ? 1 : 0)
