// 🛒 「빈손일 때 장보기 첫 화면」 세 갈래 시안 — 창업자 판정용 (2026-09-13)
//
// 🔢 왜 = GA4 28일 실측 `shop` 19번 열림 · **평균 5초**(모든 화면 중 제일 짧다).
//    재현판으로 재니 빈손일 때 「장보기 리스트」가 **위에서 1,522px**(첫 화면 891px 밖)에 있었다.
//
// ⛔⛔ **앱 소스를 고치지 않는다** — CSS 만 «임시로 주입»해서 찍는다.
//    ⭐ 그래야 창업자가 고르기 «전»에 코드가 안 바뀐다(절대원칙 35 — 만든 것은 밀고 싶어진다).
//
// 🖨  SMOKE_CHROMIUM=… node scripts/_판-장보기시안-0913.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a2a1e2e3-d972-556f-b791-6ad309c4df0c/scratchpad'
const 방 = `${OUT}/장보기시안`
mkdirSync(방, { recursive: true })

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const now = Date.now()
const 레시피들 = basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 }))

const PORT = 4385
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 900))

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })

// 🎨 시안마다 «임시 CSS» 만 다르다 — DOM 도 소스도 안 건드린다
const 시안들 = [
  { 이름: 'A-지금', 설명: '지금 그대로 — 주부의 장바구니가 먼저', css: '' },
  {
    이름: 'B-리스트먼저',
    설명: '빈손이어도 장보기 리스트가 먼저',
    css: `.shop-pair .shop-cur { order: 2; margin-top: 26px; } .shop-pair .shop-list { order: 1; }`,
  },
  {
    이름: 'C-절충',
    설명: '장보기 리스트를 «작게» 위에 — 안내문을 한 줄로 줄인다',
    css: `.shop-pair .shop-cur { order: 2; margin-top: 22px; } .shop-pair .shop-list { order: 1; }
          .shop-list .empty { padding: 10px 4px !important; font-size: 14px; opacity: .8; }
          .shop-list .sec-head { margin-top: 6px !important; }`,
    // 📝 안내문도 줄여 본다 — 두 줄짜리가 자리를 제일 많이 먹는다
    글바꾸기: ['필요한 재료를 담아보세요.\n위 주부의 장바구니나 레시피 상세 “재료 담기”로도 담을 수 있어요.', '살 재료를 적어보세요 · 레시피에서 「재료 담기」로도 담겨요'],
  },
]

async function 찍는다(시안) {
  const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
  await ctx.addInitScript({ content: SEED_COACH_SEEN })
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/`)
  await p.evaluate((s) => {
    localStorage.setItem('hankki:v1', JSON.stringify(s))
    localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:nudge:cloudgate', '1')
    localStorage.setItem('hankki:news:off', '1')
  }, { recipes: 레시피들, seedV: BASICS_VERSION })
  await p.goto(`http://127.0.0.1:${PORT}/`)
  await p.waitForTimeout(1500)
  for (let i = 0; i < 4; i++) {
    if (!(await p.locator('.sheet-mask').count())) break
    await p.keyboard.press('Escape'); await p.waitForTimeout(300)
  }
  const 탭 = p.getByRole('button', { name: /장보기/ }).first()
  if (await 탭.count()) await 탭.click().catch(() => {})
  await p.waitForTimeout(1200)
  if (시안.css) await p.addStyleTag({ content: 시안.css })
  if (시안.글바꾸기) {
    await p.evaluate(([옛, 새]) => {
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      let n
      while ((n = w.nextNode())) if (n.nodeValue.trim() === 옛.trim()) n.nodeValue = 새
    }, 시안.글바꾸기)
  }
  await p.waitForTimeout(400)
  await p.screenshot({ path: `${방}/${시안.이름}.png` })
  const 자리 = await p.evaluate(() => {
    const 후보 = [...document.querySelectorAll('h1,h2,h3,h4,div,span,section')]
      .filter((e) => (e.textContent || '').trim().startsWith('장보기 리스트'))
    const 찾 = 후보.sort((a, b) => (a.textContent || '').length - (b.textContent || '').length)[0]
    if (!찾) return null
    const r = 찾.getBoundingClientRect()
    return Math.round(r.top + window.scrollY)
  })
  await ctx.close()
  return 자리
}

console.log('\n🛒 장보기 첫 화면 — 세 갈래 (빈손인 사람이 보는 것)\n')
for (const 시안 of 시안들) {
  const 자리 = await 찍는다(시안)
  const 밖 = 자리 > 891
  console.log(`  ${시안.이름.padEnd(14)} ${시안.설명}`)
  console.log(`  ${''.padEnd(14)} 📏 「장보기 리스트」 = 위에서 ${자리}px → ${밖 ? '⛔ 첫 화면 밖' : '✅ 첫 화면 안'}\n`)
}
await b.close(); srv.kill()
console.log(`📸 ${방}`)
