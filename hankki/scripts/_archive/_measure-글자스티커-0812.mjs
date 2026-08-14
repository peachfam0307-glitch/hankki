// 🔠 레꾸 「글자」 탭 스티커가 서랍에서 «얼마나 작은가» — 창업자 2026-08-12
//
// 📮 *"레꾸 글자에 한끼문구~건강태그까지 글자가 너무 작아서 (그림도) 잘 안보여. 방법을 찾아야 할 듯."*
//
// ⛔ 짐작으로 「칸이 52px 이라 작다」고 말하지 않는다 — **화면에서 그려진 값을 잰다**(규칙 18).
//    원본은 300×240 쯤인데 칸이 정사각 52px 이면 글자 높이가 몇 px 이 되는지가 진짜 값이다.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = 4199
const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT)], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 3500))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 3, timezoneId: 'Asia/Seoul' })
const p = await ctx.newPage()
p.on('pageerror', (e) => console.log('⛔ pageerror', String(e).slice(0, 140)))
await p.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1')
  const o = Storage.prototype.getItem
  Storage.prototype.getItem = function (k) { return k.startsWith('hankki:coach:') ? '1' : o.call(this, k) }
  const raw = localStorage.getItem('hankki:v1'); const s = raw ? JSON.parse(raw) : {}
  s.recipes = s.recipes || []
  localStorage.setItem('hankki:v1', JSON.stringify(s))
})
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(700)

// 홈 첫 카드 → 상세 → 레시피 꾸미기
// ⛔ 첫 판이 여기서 죽었다 — `.sheet-mask` 가 클릭을 가로챘다(무슨 시트인지 «화면 글자로» 확인한다).
const 시트치우기 = async (어디) => {
  const m = p.locator('.sheet-mask')
  if (await m.count()) {
    const 글 = (await p.locator('.sheet-mask').first().innerText().catch(() => '')).slice(0, 60).replace(/\n/g, ' / ')
    console.log(`   ⚠️ ${어디} 에서 시트가 떠 있다 → 「${글}」 · 닫는다`)
    await p.keyboard.press('Escape').catch(() => {})
    await p.waitForTimeout(400)
    if (await p.locator('.sheet-mask').count()) { await m.first().click({ position: { x: 5, y: 5 } }).catch(() => {}); await p.waitForTimeout(400) }
  }
}
await 시트치우기('홈')
await p.locator('.grid-card').first().click(); await p.waitForTimeout(700)
await 시트치우기('상세')
await p.getByRole('button', { name: /꾸미기/ }).first().click(); await p.waitForTimeout(1300)

// 「글자」 탭 (내부 키 notetext)
const 탭 = p.locator('.decor-drawer .seg, .decor-drawer button', { hasText: '글자' }).first()
if (await 탭.count()) { await 탭.click(); await p.waitForTimeout(700) }

const 잰값 = await p.evaluate(() => {
  const 그리드 = document.querySelector('.decor-grid')
  if (!그리드) return { 없음: true, 화면: document.body.innerText.slice(0, 180) }
  const cs = getComputedStyle(그리드)
  const cells = [...그리드.querySelectorAll('.decor-cell')]
  const 셀 = cells[0]?.getBoundingClientRect()
  // ⭐ 진짜 봐야 하는 값 = «그려진 그림»의 크기다(칸이 아니라)
  const 그림 = cells.map((c) => c.querySelector('img')).filter(Boolean).slice(0, 40).map((im) => {
    const r = im.getBoundingClientRect()
    return { src: im.getAttribute('src')?.split('/').pop()?.slice(0, 22), w: Math.round(r.width), h: Math.round(r.height), nw: im.naturalWidth, nh: im.naturalHeight }
  })
  const 라벨 = [...document.querySelectorAll('.decor-sec .h-mini, .decor-sec b, .decor-sec .t-sub')].map((x) => x.textContent.trim()).filter(Boolean).slice(0, 12)
  return {
    칸수: cs.gridTemplateColumns.split(' ').length,
    칸: 셀 ? { w: Math.round(셀.width), h: Math.round(셀.height) } : null,
    gap: cs.gap,
    그림: 그림.slice(0, 12),
    그룹라벨: 라벨,
    전체그림수: 그림.length,
  }
})

if (잰값.없음) { console.log('⛔ 서랍 격자를 못 찾음 —', 잰값.화면) }
else {
  console.log(`📐 서랍 한 줄 ${잰값.칸수}칸 · 칸 ${잰값.칸.w}×${잰값.칸.h} · gap ${잰값.gap}`)
  console.log(`🏷 보이는 그룹: ${잰값.그룹라벨.join(' · ')}`)
  console.log('\n🔢 그려진 그림 크기 (원본 → 화면)')
  for (const g of 잰값.그림) {
    const 배 = (g.w / g.nw)
    console.log(`   ${(g.src || '?').padEnd(24)} ${String(g.nw).padStart(3)}×${String(g.nh).padStart(3)} → ${String(g.w).padStart(2)}×${String(g.h).padStart(2)}  (${(배 * 100).toFixed(0)}%)`)
  }
  // ⭐ 글자가 읽히나 = 그림 안 «글자 줄»의 높이를 추정한다.
  //    이 컷들은 그림+캡션이 한 몸이고 캡션이 대략 아래 25% 를 차지한다(시트 실측).
  const 대표 = 잰값.그림[0]
  if (대표) console.log(`\n   ⚠️ 캡션이 그림 아래 ~25% 라면 화면 글자 높이 ≈ ${(대표.h * 0.25).toFixed(1)}px — 한글은 11px 밑으론 못 읽는다`)
}

await p.screenshot({ path: 'docs/_shot/글자탭-지금-0812.png' })
console.log('\n📸 docs/_shot/글자탭-지금-0812.png')
await b.close(); srv.kill(); process.exit(0)
