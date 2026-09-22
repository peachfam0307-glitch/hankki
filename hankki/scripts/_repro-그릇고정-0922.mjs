// 🍽 그릇 고정 재현 — 꾸미기 화면에서 «직접 끌어» 본다 (창업자 2026-09-22 00:22 *"아직도 그릇이 따라오잖아"* · *"왜 재현안해보고"*)
//
//   ① 사진 표지(기본 흰 그릇 pb_) 레시피 → 꾸미기 → 그릇 한가운데를 잡고 끈다 → **그릇·사진이 안 움직여야 한다**
//   ② 사진 표지 ＋ 할로윈 냄비(pf_hw04) 레시피 → 꾸미기 → 냄비를 끈다 → **냄비와 사진이 같이 가고, 흰 그릇은 없어야 한다**
//   화면마다 캡처를 남긴다 — 절대원칙 21(눈으로 본다).
//
// 실행: OUT=<폴더> SMOKE_CHROMIUM=… node scripts/_repro-그릇고정-0922.mjs   (OUT/내사진.txt 가 있어야 한다)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
const OUT = process.env.OUT || '/tmp'
const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { COACH } = await import('../src/coach.js')
const 사진 = readFileSync(new URL('file://' + OUT + '/내사진.txt'), 'utf8').trim()
const now = Date.now()
const state = {
  recipes: basicRecipes.map((r, i) => {
    if (r.id === 'basic-beoseot-jeon') return { ...r, status: 'sorted', savedAt: now + 20000, thumb: 'photo', image: 사진, imageZoom: 1.35, touched: true }
    if (r.id === 'basic-kimchijjigae') return { ...r, status: 'sorted', savedAt: now + 10000, thumb: 'photo', image: 사진, imageZoom: 1.35, touched: true, decor: [{ id: 'd1', type: 'sticker', key: 'pf_hw04', x: 0.5, y: 0.5, s: 0.58, r: 0 }] }
    return { ...r, status: 'sorted', savedAt: now - i * 60000 }
  }),
  seedV: BASICS_VERSION,
}
const PORT = 4332
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
process.on('exit', () => { try { srv.kill() } catch {} })
await new Promise((r) => setTimeout(r, 900))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true })
const p = await ctx.newPage()
const url = `http://127.0.0.1:${PORT}/`
await p.goto(url)
await p.evaluate(({ s, keys }) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:열쇠:그릇', '1'); localStorage.setItem('hankki:열쇠:할로윈', '1')
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'); localStorage.setItem('hankki:cloudgate', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
  keys.forEach((k) => localStorage.setItem(k, '1'))
}, { s: state, keys: Object.values(COACH) })
await p.goto(url); await p.waitForTimeout(2000)

let 통과 = 0; const 실패 = []
const 잰다 = (참, 이름, 본것) => { if (참) { 통과++; console.log('  ✅', 이름, 본것 ?? '') } else { 실패.push(이름); console.log('  ⛔', 이름, 본것 ?? '') } }
const 스테이지 = () => p.locator('.decor-stage').first()
// 그릇 그림(pb_/pf_)·사진 상자의 «화면 위 자리»를 잰다 — 소스가 아니라 실제 px (절대원칙 30)
const 자리 = () => p.evaluate(() => {
  const st = document.querySelector('.decor-stage'); const R = st.getBoundingClientRect()
  const pick = (sel) => { const el = st.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { cx: +((r.left + r.width / 2 - R.left) / R.width).toFixed(3), cy: +((r.top + r.height / 2 - R.top) / R.height).toFixed(3), w: +(r.width / R.width).toFixed(3) } }
  return { 흰그릇: pick('img[src*="pb_"]'), 냄비: pick('img[src*="pf_hw"]'), 사진: pick('img[src^="data:"], img[src^="blob:"]') }
})
const 끈다 = async (x0, y0, dx, dy) => {
  await p.mouse.move(x0, y0); await p.mouse.down()
  for (let i = 1; i <= 8; i++) { await p.mouse.move(x0 + dx * i / 8, y0 + dy * i / 8); await p.waitForTimeout(30) }
  await p.mouse.up(); await p.waitForTimeout(400)
}
const 열기 = async (글) => {
  await p.getByText('레시피', { exact: true }).last().click(); await p.waitForTimeout(900)
  await p.getByText(글, { exact: true }).first().click(); await p.waitForTimeout(1200)
  await p.getByText('레시피 꾸미기').first().click(); await p.waitForTimeout(1600)
}
const 닫기 = async () => {
  await p.getByText('취소', { exact: true }).first().click().catch(() => {}); await p.waitForTimeout(500)
  await p.getByText('저장 안 하고 나가기').first().click().catch(() => {}); await p.waitForTimeout(600)
  await p.locator('[aria-label="뒤로"]').first().click().catch(() => {}); await p.waitForTimeout(600)
}

console.log('\n🍽 그릇 고정 — 꾸미기에서 직접 끌어 본다 (390×844)\n')

// ① 기본 흰 그릇 ＋ 사진
await 열기('버섯전')
const R = await 스테이지().boundingBox()
await p.screenshot({ path: `${OUT}/그릇고정-①전.png`, clip: { x: 0, y: 0, width: 390, height: 560 } })
const a0 = await 자리()
잰다(!!a0.흰그릇 && !!a0.사진, '①-0 꾸미기에 흰 그릇과 사진이 있다', JSON.stringify(a0))
await 끈다(R.x + R.width * 0.5, R.y + R.height * 0.5, 90, 70)
await p.screenshot({ path: `${OUT}/그릇고정-①후.png`, clip: { x: 0, y: 0, width: 390, height: 560 } })
const a1 = await 자리()
잰다(a1.흰그릇 && Math.abs(a1.흰그릇.cx - a0.흰그릇.cx) < 0.01 && Math.abs(a1.흰그릇.cy - a0.흰그릇.cy) < 0.01, '①-1 흰 그릇을 끌어도 «안 움직인다»', JSON.stringify(a1.흰그릇))
잰다(a1.사진 && Math.abs(a1.사진.cx - a0.사진.cx) < 0.01 && Math.abs(a1.사진.cy - a0.사진.cy) < 0.01, '①-2 사진도 «안 움직인다»', JSON.stringify(a1.사진))
잰다(a1.흰그릇 && Math.abs(a1.흰그릇.cx - 0.5) < 0.02, '①-3 흰 그릇은 가로 한가운데다', JSON.stringify(a1.흰그릇))
await 닫기()

// ② 사진 ＋ 할로윈 냄비
await 열기('돼지고기 김치찌개')
await p.screenshot({ path: `${OUT}/그릇고정-②전.png`, clip: { x: 0, y: 0, width: 390, height: 560 } })
const b0 = await 자리()
// ⭐ [창업자 2026-09-22 01:0x · 원본 앱 녹화로 확정] 흰 도자기는 «절대 안 사라진다» — 서랍 그릇은 그 «위»에 얹는 꾸미기다.
//    ⛔ 그 전 잣대는 「냄비를 얹으면 흰 그릇이 없다」였다. 창업자 *"왜 기본 도자기가 사라지냐고"* 로 뒤집혔는데 잣대만 남아 있었다.
잰다(!!b0.흰그릇, '②-0 냄비를 얹어도 흰 도자기는 «그대로 있다»', JSON.stringify(b0))
잰다(!!b0.냄비 && !!b0.사진, '②-1 냄비와 사진이 있다', '')
const R2 = await 스테이지().boundingBox()
await 끈다(R2.x + R2.width * b0.냄비.cx, R2.y + R2.height * b0.냄비.cy, -70, -50)
await p.screenshot({ path: `${OUT}/그릇고정-②후.png`, clip: { x: 0, y: 0, width: 390, height: 560 } })
const b1 = await 자리()
// ⭐ [창업자 2026-09-22 01:0x 최종] 서랍 그릇은 «움직인다» — *"흰색 도자기는 안 커져. 절대. 그릇만 커졌다 작아졌다 하면서 … 그릇은 좌우회전 됨."*
잰다(b1.냄비 && Math.abs(b1.냄비.cx - b0.냄비.cx) > 0.05, '②-2 냄비는 끌면 «따라온다»(꾸미기 스티커다)', `${b0.냄비.cx}→${b1.냄비.cx}`)
잰다(b1.사진 && Math.abs(b1.사진.cx - b0.사진.cx) < 0.01, '②-3 사진도 «안 움직인다»', `사진 ${b0.사진.cx}→${b1.사진.cx}`)
잰다(Math.abs(b0.냄비.w - a0.흰그릇.w) < 0.03, '②-5 냄비 폭 = 흰 그릇 폭 (프레임 씌워도 크기가 안 변한다)', `냄비 ${b0.냄비.w} · 흰그릇 ${a0.흰그릇.w}`)
// ⛔ 앞 판은 여기서 «다른 두 레시피»의 사진을 견줬다(버섯전 = 넓은 접시 · 김치찌개 = 깊은 그릇).
//    그릇 갈래가 다르면 «입» 크기가 달라서 사진도 다르다 — 견줄 수 없는 두 값이었다.
//    ✅ 재야 할 것은 「냄비를 움직여도 «같은 레시피»의 사진이 안 변하나」다.
잰다(Math.abs(b1.사진.w - b0.사진.w) < 0.01, '②-6 냄비를 끌어도 사진 크기는 «그대로»', `${b0.사진.w}→${b1.사진.w}`)
잰다(!!b1.흰그릇 && Math.abs(b1.흰그릇.cx - b0.흰그릇.cx) < 0.01, '②-4 냄비를 끌어도 흰 도자기는 제자리에 «그대로»', JSON.stringify(b1.흰그릇))

// ③ 🔓 [창업자 2026-09-22 13:2x] **열쇠 없는 폰**(＝보통 유저)에서 — 흰 도자기는 보이고, 할로윈 접시는 «안» 보인다
//    📮 *"할로윈 그릇은 안 보이더라도 도자기 위에 사진 들어가는 건 올려야지"* · *"그건 우리 기본 기능이잖아"*
await 닫기()
await p.evaluate(() => { localStorage.removeItem('hankki:열쇠:그릇'); localStorage.removeItem('hankki:열쇠:할로윈') })
await p.goto(url); await p.waitForTimeout(1800)
await 열기('버섯전')
const c0 = await 자리()
잰다(!!c0.흰그릇 && !!c0.사진, '③-1 열쇠 없이도 흰 도자기에 사진이 담긴다', JSON.stringify(c0.흰그릇))
await p.getByText('프레임', { exact: true }).first().click().catch(() => {}); await p.waitForTimeout(800)
const 서랍 = await p.evaluate(() => document.body.innerText)
잰다(서랍.includes('기본 그릇'), '③-2 서랍에 「기본 그릇」 묶음이 열려 있다', '')
잰다(!서랍.includes('할로윈 접시'), '③-3 「할로윈 접시」는 «안» 보인다 (열쇠·10/16 뒤)', '')
await p.screenshot({ path: `${OUT}/그릇고정-③열쇠없이.png`, clip: { x: 0, y: 0, width: 390, height: 844 } })

console.log(`\n  ${통과}/${통과 + 실패.length}\n`)
await b.close(); srv.kill()
process.exit(실패.length ? 1 : 0)
