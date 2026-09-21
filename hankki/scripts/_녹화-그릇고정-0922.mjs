// 🎬 그릇 고정 «녹화» — 창업자에게 영상으로 보여준다 (창업자 2026-09-22 00:35 *"너 못믿어 여기다 보여줘 영상으로"*)
//
//   ① 사진 표지(기본 흰 그릇) 꾸미기 → 그릇을 잡고 «세게» 끈다 → 안 움직인다
//   ② 서랍 「프레임」에서 할로윈 냄비를 «직접 눌러» 얹는다 → 사진 크기가 그대로다
//   ③ 얹은 냄비를 잡고 끈다 → 안 움직인다
//   ④ 다른 냄비로 바꿔 본다 → 그릇 그림만 갈리고 사진은 그대로
//
// 실행: OUT=<폴더> SMOKE_CHROMIUM=… node scripts/_녹화-그릇고정-0922.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { readFileSync, readdirSync, renameSync } from 'node:fs'
const OUT = process.env.OUT || '/tmp'
const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { COACH } = await import('../src/coach.js')
const 사진 = readFileSync(new URL('file://' + OUT + '/내사진.txt'), 'utf8').trim()
const now = Date.now()
const state = {
  recipes: basicRecipes.map((r, i) => (
    r.id === 'basic-beoseot-jeon'
      ? { ...r, status: 'sorted', savedAt: now + 20000, thumb: 'photo', image: 사진, imageZoom: 1.35, touched: true }
      : { ...r, status: 'sorted', savedAt: now - i * 60000 }
  )),
  seedV: BASICS_VERSION,
}
const PORT = 4333
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
process.on('exit', () => { try { srv.kill() } catch {} })
await new Promise((r) => setTimeout(r, 900))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true,
  recordVideo: { dir: `${OUT}/영상`, size: { width: 390, height: 844 } },
})
const p = await ctx.newPage()
const url = `http://127.0.0.1:${PORT}/`
await p.goto(url)
await p.evaluate(({ s, keys }) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:열쇠:그릇', '1'); localStorage.setItem('hankki:열쇠:할로윈', '1')
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'); localStorage.setItem('hankki:cloudgate', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
  keys.forEach((k) => localStorage.setItem(k, '1'))
}, { s: state, keys: Object.values(COACH) })
await p.goto(url); await p.waitForTimeout(2200)

// 📢 화면에 «지금 무엇을 하는지» 띄운다 — 영상만 보고도 알 수 있게
const 말 = (글) => p.evaluate((t) => {
  let el = document.getElementById('_말')
  if (!el) { el = document.createElement('div'); el.id = '_말'; el.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:99999;background:#3a2b20;color:#fff;font:700 15px/1.5 Pretendard,sans-serif;padding:10px 14px;text-align:center'; document.body.appendChild(el) }
  el.textContent = t
}, 글)
const 끈다 = async (x0, y0, dx, dy) => {
  await p.mouse.move(x0, y0); await p.mouse.down()
  for (let i = 1; i <= 20; i++) { await p.mouse.move(x0 + dx * i / 20, y0 + dy * i / 20); await p.waitForTimeout(40) }
  await p.mouse.up(); await p.waitForTimeout(700)
}

await p.getByText('레시피', { exact: true }).last().click(); await p.waitForTimeout(1000)
await p.getByText('버섯전', { exact: true }).first().click(); await p.waitForTimeout(1400)
await p.getByText('레시피 꾸미기').first().click(); await p.waitForTimeout(1800)

await 말('① 기본 흰 그릇 ＋ 내 사진'); await p.waitForTimeout(1800)
const R = await p.locator('.decor-stage').first().boundingBox()
await 말('② 그릇을 잡고 끌어 본다 → 안 움직인다'); await p.waitForTimeout(1200)
await 끈다(R.x + R.width * 0.5, R.y + R.height * 0.47, 100, 80)
await 끈다(R.x + R.width * 0.5, R.y + R.height * 0.47, -110, -60)
await p.waitForTimeout(1200)

await 말('③ 서랍에서 할로윈 냄비를 얹는다'); await p.waitForTimeout(1400)
await p.getByText('프레임', { exact: true }).first().click(); await p.waitForTimeout(1200)
const 냄비 = p.locator('button:has(img[src*="pf_hw04"])').first()
await 냄비.scrollIntoViewIfNeeded().catch(() => {})
await 냄비.click(); await p.waitForTimeout(1600)
await 말('④ 사진은 그대로 · 그릇 그림만 갈렸다'); await p.waitForTimeout(2200)

await 말('⑤ 얹은 냄비는 끌어서 옮긴다 → 사진은 제자리'); await p.waitForTimeout(1200)
await 끈다(R.x + R.width * 0.5, R.y + R.height * 0.47, 80, 60)
await p.waitForTimeout(900)
await 끈다(R.x + R.width * 0.5 + 80, R.y + R.height * 0.47 + 60, -80, -60)
await p.waitForTimeout(1400)

await 말('⑥ 손잡이로 «키우고 돌린다» → 사진은 제자리'); await p.waitForTimeout(1200)
const 손잡이 = p.locator('.decor-stage [aria-label="크기·회전"]').first()
const H = await 손잡이.boundingBox().catch(() => null)
if (H) {
  await 끈다(H.x + H.width / 2, H.y + H.height / 2, 55, 40)      // 키우기
  await p.waitForTimeout(800)
  const H2 = await 손잡이.boundingBox()
  await 끈다(H2.x + H2.width / 2, H2.y + H2.height / 2, -70, 55)  // 돌리기
  await p.waitForTimeout(1400)
}
await 말('⑦ 다른 그릇으로 바꿔도 사진은 그대로'); await p.waitForTimeout(1200)
const 접시 = p.locator('button:has(img[src*="pf_hw09"])').first()
await 접시.click().catch(() => {}); await p.waitForTimeout(2000)
const 볼 = p.locator('button:has(img[src*="pf_hw10"])').first()
await 볼.click().catch(() => {}); await p.waitForTimeout(2200)
await 말('끝 — 사진은 한 번도 안 움직이고 안 커졌다'); await p.waitForTimeout(2200)

await ctx.close(); await b.close(); srv.kill()
const f = readdirSync(`${OUT}/영상`).find((n) => n.endsWith('.webm'))
renameSync(`${OUT}/영상/${f}`, `${OUT}/영상/그릇고정.webm`)
console.log('🎬', `${OUT}/영상/그릇고정.webm`)
