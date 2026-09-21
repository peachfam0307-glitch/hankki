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
잰다(!b0.흰그릇, '②-0 냄비를 얹으면 흰 그릇은 «없다»', JSON.stringify(b0))
잰다(!!b0.냄비 && !!b0.사진, '②-1 냄비와 사진이 있다', '')
const R2 = await 스테이지().boundingBox()
await 끈다(R2.x + R2.width * b0.냄비.cx, R2.y + R2.height * b0.냄비.cy, -70, -50)
await p.screenshot({ path: `${OUT}/그릇고정-②후.png`, clip: { x: 0, y: 0, width: 390, height: 560 } })
const b1 = await 자리()
// ⛔ [창업자 2026-09-22 00:28] 얹은 프레임도 «고정»이다 — 흰 그릇 자리에 그림만 바뀐다(*"흰도자기 기본값하고 프레임만 위에 얹으라고"*)
잰다(b1.냄비 && Math.abs(b1.냄비.cx - b0.냄비.cx) < 0.01 && Math.abs(b1.냄비.cy - b0.냄비.cy) < 0.01, '②-2 냄비를 끌어도 «안 움직인다»', `${b0.냄비.cx}→${b1.냄비.cx}`)
잰다(b1.사진 && Math.abs(b1.사진.cx - b0.사진.cx) < 0.01, '②-3 사진도 «안 움직인다»', `사진 ${b0.사진.cx}→${b1.사진.cx}`)
잰다(Math.abs(b0.냄비.w - a0.흰그릇.w) < 0.03, '②-5 냄비 폭 = 흰 그릇 폭 (프레임 씌워도 크기가 안 변한다)', `냄비 ${b0.냄비.w} · 흰그릇 ${a0.흰그릇.w}`)
잰다(Math.abs(b0.사진.w - a0.사진.w) < 0.03, '②-6 사진 폭도 «그대로» — 프레임 씌워도 사진이 안 작아진다', `냄비때 ${b0.사진.w} · 흰그릇때 ${a0.사진.w}`)
잰다(!b1.흰그릇, '②-4 끈 뒤에도 흰 그릇은 없다', JSON.stringify(b1.흰그릇))

console.log(`\n  ${통과}/${통과 + 실패.length}\n`)
await b.close(); srv.kill()
process.exit(실패.length ? 1 : 0)
