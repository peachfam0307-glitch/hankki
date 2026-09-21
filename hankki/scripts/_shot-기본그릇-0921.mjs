// 📸 [2026-09-21] 「내 사진」 표지가 «그릇에 담겨» 보이나 — 실물(빌드된 앱)로 찍는다 (절대원칙 21·30)
//    ㉡ 프레임 없음 → 갈래별 기본 그릇(찌개=냄비 · 볶음밥=둥근볼 · 전=넓은접시 · 소스=한손잡이팬)
//    ㉠ 할로윈 접시(pf_hw07)를 얹은 편 → 사진이 «그 창»에 들어가나
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
const OUT = process.env.OUT || '/tmp'
const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { COACH } = await import('../src/coach.js')
const 사진 = readFileSync(new URL('file://' + OUT + '/내사진.txt'), 'utf8').trim()
const 골 = { 'basic-doenjangjjigae': null, 'basic-kimchibokkeumbap': null, 'basic-beoseot-jeon': null, 'basic-gomadare-sauce': null, 'basic-kimchijjigae': null }   // 창업자 «할로윈 그릇 빼봐» — 기본 그릇으로
const now = Date.now()
const state = {
  recipes: basicRecipes.map((r, i) => {
    const g = 골[r.id]
    if (g === undefined) return { ...r, status: 'sorted', savedAt: now - i * 60000 }
    const base = { ...r, status: 'sorted', savedAt: now + 1000 * (10 - Object.keys(골).indexOf(r.id)), thumb: 'photo', image: 사진, imageZoom: 1.35, touched: true }   // 시험 사진에 흰 접시가 섞여 있어 조금 당겨 본다(유저가 두 손가락으로 하는 것과 같다)
    if (g === 'hw') base.decor = [{ id: 'd1', type: 'sticker', key: 'pf_hw07', x: 0.5, y: 0.5, s: 0.62, r: 0 }]
    return base
  }),
  seedV: BASICS_VERSION,
}
const PORT = 4331
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
process.on('exit', () => { try { srv.kill() } catch {} })
await new Promise((r) => setTimeout(r, 900))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const p = await ctx.newPage()
const url = `http://127.0.0.1:${PORT}/`
await p.goto(url)
await p.evaluate(({ s, keys }) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:열쇠:그릇', '1')   // 🔑 창업자 열쇠 흉내
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'); localStorage.setItem('hankki:cloudgate', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
  keys.forEach((k) => localStorage.setItem(k, '1'))
}, { s: state, keys: Object.values(COACH) })
await p.goto(url); await p.waitForTimeout(2200)
await p.getByText('레시피', { exact: true }).last().click(); await p.waitForTimeout(900)
await p.screenshot({ path: `${OUT}/기본그릇-목록.png` })
// 🔒 자기 점검 — 표지 5장에 «그릇 그림(pb_/pf_)»이 실제로 그려졌나
const 잰것 = await p.evaluate(() => [...document.querySelectorAll('.grid-card img')].map((i) => i.getAttribute('src') || '').filter((s) => /p[bf]_/.test(s)).map((s) => s.match(/(p[bf]_[a-z0-9]+)/)?.[1]))
console.log('목록에 그려진 그릇 =', JSON.stringify(잰것))
if (!잰것.length) throw new Error('⛔ 그릇이 하나도 안 그려졌다')
for (const [이름, 글] of [['찌개', '된장찌개'], ['전', '버섯전'], ['할로윈', '돼지고기 김치찌개']]) {
  await p.getByText(글, { exact: true }).first().click(); await p.waitForTimeout(1200)
  await p.screenshot({ path: `${OUT}/기본그릇-상세-${이름}.png`, clip: { x: 0, y: 0, width: 390, height: 560 } })
  await p.locator('[aria-label="뒤로"]').first().click(); await p.waitForTimeout(700)
}
await b.close(); srv.kill(); console.log('✅ 찍음 →', OUT)
