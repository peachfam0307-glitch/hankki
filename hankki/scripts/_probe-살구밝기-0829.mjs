// 🍑 살구 테마 — 화면에 «진짜로 칠해진» 값을 잰다 (규칙 18 = 계산이 아니라 실물)
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const now = Date.now()
const state = { recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })), seedV: BASICS_VERSION }
const P = 4402
const srv = spawn('python3', ['-m', 'http.server', String(P), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 900))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
await ctx.addInitScript({ content: SEED_COACH_SEEN })
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${P}/`)
await p.evaluate((s) => { localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1'); localStorage.setItem('hankki-theme', 'apricot') }, state)
await p.goto(`http://127.0.0.1:${P}/`)
await p.waitForTimeout(1600)
for (let i = 0; i < 3; i++) { const m = p.locator('.sheet-mask'); if (!(await m.count())) break
  const c = p.getByRole('button', { name: /^(닫기|확인|나중에)$/ }); if (await c.count()) await c.first().click().catch(() => {}); else await p.keyboard.press('Escape'); await p.waitForTimeout(500) }
const 잰값 = await p.evaluate(() => {
  const Y = (s) => { const m = s.match(/\d+/g); if (!m) return null
    const c = m.slice(0, 3).map((v) => v / 255).map((v) => (v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4))
    return +(0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]).toFixed(3) }
  // 실제로 칠해진 부모를 거슬러 올라가 «투명이 아닌» 첫 배경을 찾는다
  // ⛔⛔ `background: linear-gradient()` 은 backgroundColor 가 «투명»이다 — 색만 읽으면 부모를 읽는다.
  //    2026-08-29 에 이걸로 「today-card 가 배경과 똑같다」는 «거짓 경보»를 냈다(규칙 18 ⓘ).
  const 그라데최저 = (img) => { const m = img.match(/rgba?\([^)]+\)/g); if (!m) return null
    const ys = m.map(Y).filter((v) => v != null); return ys.length ? Math.min(...ys) : null }
  const 진짜배경 = (el) => { let n = el
    while (n && n !== document.documentElement) { const s = getComputedStyle(n)
      const gi = s.backgroundImage && s.backgroundImage !== 'none' ? 그라데최저(s.backgroundImage) : null
      if (gi != null) return { el: n.className || n.tagName, bg: '그라데이션(제일 어두운 쪽)', y: gi }
      const bg = s.backgroundColor
      if (bg && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) return { el: n.className || n.tagName, bg, y: Y(bg) }
      n = n.parentElement } return null }
  const 결과 = { theme: document.documentElement.getAttribute('data-theme') }
  결과.바탕 = 진짜배경(document.querySelector('.app-frame') || document.body)
  for (const sel of ['.news-card', '.today-card', '.weekly-box']) {
    const el = document.querySelector(sel); if (el) 결과[sel] = 진짜배경(el)
  }
  // 「아직 안 해봤어요」 줄 — 그 글자를 담은 상자를 «글자에서» 거슬러 찾는다
  const t = [...document.querySelectorAll('*')].find((x) => x.children.length === 0 && /아직 안 해봤어요/.test(x.textContent))
  // ⚠️ 이 줄은 «카드»가 아니라 그 안의 «파란 알약»을 잡는다(글자에서 제일 가까운 색이 알약이다).
  //    흰 글자 알약이라 어두운 게 «맞다» — 마이너스가 나와도 사고가 아니다.
  if (t) { let n = t; for (let i = 0; i < 5 && n; i++) { const bg = getComputedStyle(n).backgroundColor
      if (bg && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) { 결과['아직안해봤어요'] = { el: n.className, bg, y: Y(bg) }; break } n = n.parentElement } }
  return 결과
})
console.log('\n🍑 테마 =', 잰값.theme)
const base = 잰값.바탕?.y
console.log(`   바탕 ${잰값.바탕?.bg}  밝기 ${base}\n`)
for (const [k, v] of Object.entries(잰값)) {
  if (k === 'theme' || k === '바탕' || !v?.y) continue
  const d = (v.y - base)
  console.log(`   ${k.padEnd(16)} ${String(v.y).padEnd(6)} ${d >= 0 ? '＋' : '−'}${Math.abs(d).toFixed(3)} ${d > 0.012 ? '떠 보인다 ✅' : d < 0 ? '가라앉는다 ⛔' : '거의 같다 ⚠️'}`)
}
await b.close(); srv.kill(); process.exit(0)
