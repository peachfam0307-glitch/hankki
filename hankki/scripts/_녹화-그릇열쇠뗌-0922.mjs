// 🎬 «열쇠 없는 폰»(＝보통 유저) 녹화 — 흰 도자기는 나가고, 할로윈은 안 나간다
//    📮 창업자 2026-09-22 13:2x = *"할로윈 그릇은 안 보이더라도 도자기 위에 사진 들어가는 건 올려야지"*
//       ＋ *"그건 우리 기본 기능이잖아. 내 사진 넣어서 음식 아이콘 만드는 거"* → *"다시 영상 찍어서 보여줘"*
//
//    ⛔ 이 판은 열쇠를 «하나도 안 넣는다» — 창업자 열쇠(?그릇=1 · ?할로윈=1)를 안 켠 폰 그대로다.
//       그래야 「유저가 실제로 보는 것」이 찍힌다(절대원칙 30 — 앱이 쓰는 그 값이라야 한다).
//
// 실행: OUT=<폴더> SMOKE_CHROMIUM=… node scripts/_녹화-그릇열쇠뗌-0922.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { readFileSync, readdirSync, renameSync, mkdirSync } from 'node:fs'
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
mkdirSync(`${OUT}/영상`, { recursive: true })
const PORT = 4334
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
  // 🔑 ⛔ 열쇠를 «안» 넣는다. 혹시 남아 있으면 지운다 — 이 영상의 전부다.
  localStorage.removeItem('hankki:열쇠:그릇'); localStorage.removeItem('hankki:열쇠:할로윈')
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'); localStorage.setItem('hankki:cloudgate', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
  keys.forEach((k) => localStorage.setItem(k, '1'))
}, { s: state, keys: Object.values(COACH) })
await p.goto(url); await p.waitForTimeout(2200)

const 말 = (글) => p.evaluate((t) => {
  let el = document.getElementById('_말')
  if (!el) { el = document.createElement('div'); el.id = '_말'; el.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:99999;background:#3a2b20;color:#fff;font:700 15px/1.5 Pretendard,sans-serif;padding:10px 14px;text-align:center' ; document.body.appendChild(el) }
  el.textContent = t
}, 글)
const 끈다 = async (x0, y0, dx, dy) => {
  await p.mouse.move(x0, y0); await p.mouse.down()
  for (let i = 1; i <= 20; i++) { await p.mouse.move(x0 + dx * i / 20, y0 + dy * i / 20); await p.waitForTimeout(40) }
  await p.mouse.up(); await p.waitForTimeout(700)
}

await 말('🔑 열쇠를 «하나도 안 켠» 폰 — 보통 유저가 보는 화면'); await p.waitForTimeout(2600)

await p.getByText('레시피', { exact: true }).last().click(); await p.waitForTimeout(1200)
await 말('① 목록 — 내 사진이 «흰 도자기에 담겨» 보인다'); await p.waitForTimeout(2600)

await p.getByText('버섯전', { exact: true }).first().click(); await p.waitForTimeout(1500)
await 말('② 상세도 마찬가지'); await p.waitForTimeout(2200)

await p.getByText('레시피 꾸미기').first().click(); await p.waitForTimeout(1900)
await 말('③ 꾸미기 — 흰 도자기＋사진은 «고정»(끌어도 안 움직인다)'); await p.waitForTimeout(1600)
const R = await p.locator('.decor-stage').first().boundingBox()
await 끈다(R.x + R.width * 0.5, R.y + R.height * 0.47, 100, 80)
await 끈다(R.x + R.width * 0.5, R.y + R.height * 0.47, -110, -60)
await p.waitForTimeout(1200)

await 말('④ 서랍 「프레임」 — 「기본 그릇」 8컷이 열려 있다'); await p.waitForTimeout(1400)
await p.getByText('프레임', { exact: true }).first().click(); await p.waitForTimeout(1600)
await p.waitForTimeout(1800)

// ⛔⛔ [2026-09-22 13:3x · 내 실수] 앞 판은 `document.body.innerText` 로 셌다 — **내가 띄운 자막(#_말)이 같이 읽혀서**
//    서랍에 할로윈이 «보이는 것처럼» 나왔다. 창업자를 놀라게 했다. ✅ 자막을 잠깐 비우고 «서랍 글자»만 센다.
const 서랍센다 = () => p.evaluate(() => {
  const 띠 = document.getElementById('_말'); const 두었던 = 띠 ? 띠.textContent : ''
  if (띠) 띠.textContent = ''
  const t = document.body.innerText
  if (띠) 띠.textContent = 두었던
  return { 기본: t.includes('기본 그릇'), 할로윈: t.includes('할로윈 접시'), hw컷: document.querySelectorAll('img[src*="pf_hw"]').length }
})
await 말('⑤ 서랍을 끝까지 내려본다 — 할로윈 접시는 «없다»'); await p.waitForTimeout(1200)
const 있나 = await 서랍센다()
console.log('  서랍 —', JSON.stringify(있나))
await p.evaluate(() => { const el = document.querySelector('.decor-drawer, [class*="drawer"]'); if (el) el.scrollTop = el.scrollHeight })
await p.waitForTimeout(2600)

// 🍂 [창업자 2026-09-22 13:39 「가을의 정원으로」] 유저가 «실제로 쓰는» 그릇으로 보여준다 — 할로윈은 아직 안 나가니까.
await 말('⑥ 「가을의 정원 세트」 접시를 얹어 본다'); await p.waitForTimeout(1400)
for (const k of ['pf_ad01', 'pf_ad04', 'pf_ad08']) {
  const 칸 = p.locator(`button:has(img[src*="${k}"])`).first()
  await 칸.scrollIntoViewIfNeeded().catch(() => {})
  await 칸.click().catch(() => {}); await p.waitForTimeout(2100)
}
await 말('⑦ 접시를 끌어 옮기고 손잡이로 키운다 → 사진은 제자리'); await p.waitForTimeout(1200)
await 끈다(R.x + R.width * 0.5, R.y + R.height * 0.47, 80, 60)
await p.waitForTimeout(700)
await 끈다(R.x + R.width * 0.5 + 80, R.y + R.height * 0.47 + 60, -80, -60)
const 손잡이 = p.locator('.decor-stage [aria-label="크기·회전"]').first()
const H = await 손잡이.boundingBox().catch(() => null)
if (H) { await 끈다(H.x + H.width / 2, H.y + H.height / 2, 55, 40); await p.waitForTimeout(900) }
await p.waitForTimeout(1200)

await 말('끝 — 흰 도자기는 모두에게 · 할로윈은 아직 안 나간다'); await p.waitForTimeout(2600)

await ctx.close(); await b.close(); srv.kill()
const f = readdirSync(`${OUT}/영상`).filter((n) => n.endsWith('.webm')).sort().pop()
renameSync(`${OUT}/영상/${f}`, `${OUT}/영상/그릇-열쇠뗌.webm`)
console.log('🎬', `${OUT}/영상/그릇-열쇠뗌.webm`, JSON.stringify(있나))
if (!있나.기본 || 있나.할로윈) { console.log('⛔ 서랍 상태가 틀렸다'); process.exit(1) }
