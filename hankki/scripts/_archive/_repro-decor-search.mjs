// 🐛 재현 — 「레시피탭에서 검색하면 꾸미기 하얗게뜸」 (창업자 제보 2026-08-05)
//
// ⭐ 진짜 앱을 띄운다 — `dist` 를 정적 서빙하고 폰 상태(localStorage)를 심은 뒤
//    ①홈 ②검색결과 ③즐겨찾기 를 각각 찍어 «같은 레시피»가 어디선 꾸며지고 어디선 빈 칸인지 본다.
// 판정 = 카드 썸네일(.grid-card > div) 안에 꾸미기 레이어(DecorLayer div)가 붙어 있나.
//   ⛔ 눈으로만 보지 않는다 — DOM 으로도 센다(캡처가 실패해도 판정은 남게).
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다 (2026-08-06)
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })

// 콩국수 시드의 꾸미기를 그대로 빌려 쓴다 — 창업자가 실제로 보는 그 꾸미기
const { basicRecipes } = await import('../src/data/basics.js')
const kong = basicRecipes.find((r) => r.title === '콩국수')
if (!kong) { console.error('⛔ 콩국수 시드를 못 찾았다'); process.exit(2) }

const now = Date.now()
// 창업자 폰 상태 재현 — 캡처에 나온 세 가지 모양
const mine = [
  // ① 나시고랭 = 배경 있음 + 스티커 있음 + 표지 비움 (옛 시드 v42 꾸미기가 남은 폰)
  { id: 'u-nasi', title: '나시고랭', category: '아시안', time: 20, thumb: 'none',
    decorBg: 'sea', decor: kong.decor, ingredients: ['밥 1공기', '새우젓 조금'], steps: ['볶아요.'],
    tags: ['한그릇'], savedAt: now, source: 'user' },
  // ② 교촌허니콤보 = 배경 없음 + 스티커 있음 + 표지 비움 → 캡처의 「완전 빈 칸」
  { id: 'u-kyochon', title: '교촌허니콤보', category: '한식', time: 30, thumb: 'none',
    decor: kong.decor, ingredients: ['닭 1마리', '간장소스'], steps: ['튀겨요.'],
    tags: ['야식'], savedAt: now - 60000, source: 'user' },
  // ③ 새우해장파스타 = 같은 모양
  { id: 'u-shrimp', title: '새우해장파스타', category: '양식', time: 25, thumb: 'none',
    decor: kong.decor, ingredients: ['새우 10마리', '파스타면'], steps: ['삶아요.'],
    tags: ['해장'], savedAt: now - 120000, source: 'user' },
]
// seedV 를 최신으로 둬서 시드 이관이 끼어들지 않게 — 이 버그만 본다
const { BASICS_VERSION } = await import('../src/data/basics.js')
const state = { recipes: [...mine, ...basicRecipes.map((r, i) => ({ ...r, savedAt: now - (i + 10) * 60000 }))], seedV: BASICS_VERSION }

// ── 정적 서버 ──
const PORT = 4318
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
const stop = () => { try { srv.kill() } catch { /* noop */ } }
process.on('exit', stop)
await new Promise((r) => setTimeout(r, 900))

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push(String(e)))
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })

const url = `http://127.0.0.1:${PORT}/`
await page.goto(url)
await page.evaluate((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:onboarded', '1')       // 온보딩 건너뛰기
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, state)
await page.goto(url)
await page.waitForTimeout(1500)

// 화면 안 카드들의 「꾸미기 레이어가 붙었나」를 센다.
const countDecor = () =>
  page.evaluate(() => {
    const out = []
    for (const card of document.querySelectorAll('.grid-card')) {
      const name = card.querySelector('.name')?.textContent || '?'
      // Thumb 루트 = 카드의 첫 div (position:relative, overflow:hidden)
      const box = card.querySelector('div')
      if (!box) continue
      // DecorLayer = inset:0 + pointerEvents:none 인 절대배치 div
      const layer = [...box.children].find(
        (c) => c.tagName === 'DIV' && getComputedStyle(c).position === 'absolute' && getComputedStyle(c).pointerEvents === 'none'
      )
      out.push({ name, decorItems: layer ? layer.children.length : 0 })
    }
    return out
  })

const shot = async (label, file) => {
  await page.screenshot({ path: `${OUT}/${file}` })
  const c = await countDecor()
  console.log(`\n📱 ${label}  (카드 ${c.length}개)`)
  for (const x of c.slice(0, 8)) console.log(`   ${x.decorItems > 0 ? '🎀' : '⬜'} ${x.name} — 꾸미기 ${x.decorItems}컷`)
  return c
}

const home = await shot('홈', 'decor-home.png')

// ── 검색 화면 ──
await page.evaluate(() => sessionStorage.setItem('hankki:searchQ', '해장'))
// 홈 상단 검색창을 눌러 검색 화면으로
const bar = page.locator('.searchbar, [class*=search]').first()
await bar.click().catch(() => {})
await page.waitForTimeout(700)
// 검색어 입력
const input = page.locator('input[placeholder="검색어를 입력하세요"]')
if (await input.count()) {
  await input.fill('파스타')
  await page.waitForTimeout(800)
  await shot('검색 결과 「파스타」', 'decor-search.png')
} else {
  console.log('\n⚠️ 검색 입력칸을 못 찾았다 — 화면 이동 실패')
}

console.log(errs.length ? `\n⛔ 콘솔 오류 ${errs.length}건: ${errs.slice(0, 3).join(' / ')}` : '\n✅ 콘솔 오류 없음')
console.log(`\n📂 캡처 → ${OUT}/decor-home.png · ${OUT}/decor-search.png`)
await browser.close()
stop()
