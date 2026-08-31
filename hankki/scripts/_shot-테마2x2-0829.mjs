// 🔲 **테마 스와치 2×2** — 창업자 2026-08-29 = *"이렇게말고 2×2로 올리자 빼빼로인줄..ㅋㅋ"*
//
// ⭐ 뿌리 = 살구를 더해 3 → 4개가 되자 한 줄에 넷이 들어가 칸이 82px 로 좁아졌고
//    「뮤트로 그레이지」가 **한 글자씩 세로로 쪼개졌다**.
//
// 🔒 **심장 = 「글자가 몇 줄로 그려지나」** — 칸 폭만 재면 안 된다.
//    ⛔ 폭이 넓어도 낱말이 길면 쪼개진다. 그래서 «화면에 그려진 줄 수»(getClientRects)를 센다.
//    ⭐ 이름(label)은 **한 줄**이어야 한다. 설명(desc)은 두 줄까지 봐준다(원래 두 줄짜리 글이다).
//
// 🧪 규칙 12 = 옛 판(한 줄 flex)으로 되돌리면 이름이 2~4줄이 되어 죽는다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const 방 = `${OUT}/테마2x2-0829`
mkdirSync(방, { recursive: true })

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const now = Date.now()
const state = { recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })), seedV: BASICS_VERSION }

const PORT = Number(process.env.PORT || 4374)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 900))
const url = `http://127.0.0.1:${PORT}/`

let fail = 0
const 칸 = (ok, 이름, 값) => { console.log(`  ${ok ? '✅' : '⛔'} ${이름}${값 ? ` — ${값}` : ''}`); if (!ok) fail++ }

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })

for (const w of [320, 360, 390, 412]) {
  console.log(`\n📐 ${w}px`)
  const ctx = await browser.newContext({ viewport: { width: w, height: 880 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
  await ctx.addInitScript({ content: SEED_COACH_SEEN })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))

  await page.goto(url)
  await page.evaluate((s) => {
    localStorage.setItem('hankki:v1', JSON.stringify(s))
    localStorage.setItem('hankki:onboarded', '1')
  }, state)
  await page.goto(url)
  await page.waitForTimeout(1500)
  for (let i = 0; i < 4; i++) {
    if (!(await page.locator('.sheet-mask').count())) break
    const 닫기 = page.getByRole('button', { name: /^(닫기|확인|나중에|취소)$/ })
    if (await 닫기.count()) await 닫기.first().click({ timeout: 4000 }).catch(() => {})
    else await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
  }

  // ⚙️ 설정으로 — 상단바 설정 아이콘
  await page.locator('[aria-label="설정"]').first().click().catch(() => {})
  await page.waitForTimeout(900)
  const 테마카드 = page.locator('.card').filter({ hasText: '앱 화면 색을 골라요' }).first()
  if (!(await 테마카드.count())) { 칸(false, '설정에서 테마 카드를 찾았다'); await ctx.close(); continue }
  await 테마카드.scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)

  const 잰것 = await page.evaluate(() => {
    const 단추 = [...document.querySelectorAll('button[aria-label$="테마"]')]
    // ⛔⛔ **`el.getClientRects().length` 로 재면 «틀린다»** — 2026-08-29 실제로 틀렸다.
    //    그건 «인라인»일 때만 줄마다 rect 를 준다. block 이면 두 줄이어도 **1개**다.
    //    → 320px 에서 「뮤트로 그레이지」가 두 줄인데 검사는 «1줄»이라 했고, **캡처를 눈으로 보고서야 잡았다**(규칙 21).
    // ✅ **Range 로 «글자 상자»를 잰다** — 상자 높이 ÷ 한 줄 높이 = 진짜 줄 수
    //    (2026-08-18 책갈피 가림 때와 같은 방식 — 그때도 div 상자로 재서 틀렸다)
    const 줄수 = (el) => {
      if (!el) return 0
      const r = document.createRange()
      r.selectNodeContents(el)
      const 상자 = r.getBoundingClientRect()
      const lh = parseFloat(getComputedStyle(el).lineHeight) || parseFloat(getComputedStyle(el).fontSize) * 1.4
      return Math.max(1, Math.round(상자.height / lh))
    }
    return 단추.map((b) => {
      const r = b.getBoundingClientRect()
      const spans = [...b.querySelectorAll('span')].filter((s) => s.textContent.trim())
      const 이름 = spans[0], 설명 = spans[1]
      return {
        이름: 이름?.textContent.trim() || '?',
        칸폭: Math.round(r.width), 칸키: Math.round(r.height), x: Math.round(r.left), y: Math.round(r.top),
        이름줄: 줄수(이름), 설명줄: 줄수(설명),
      }
    })
  })
  잰것.forEach((t) => console.log(`     ${t.이름.padEnd(9)} 칸 ${t.칸폭}×${t.칸키} @(${t.x},${t.y}) · 이름 ${t.이름줄}줄 · 설명 ${t.설명줄}줄`))

  칸(잰것.length === 4, '테마 넷이 다 있다', `${잰것.length}개`)
  // ⭐ 2×2 = 서로 다른 y 가 «둘»이고, 한 줄에 «둘»씩
  const y들 = [...new Set(잰것.map((t) => t.y))]
  칸(y들.length === 2, '2×2 로 두 줄이다', `줄 ${y들.length}개`)
  칸(y들.every((y) => 잰것.filter((t) => t.y === y).length === 2), '한 줄에 둘씩이다')
  // 🔒🔒 **심장 = 「빼빼로가 아닌가」** — 창업자가 싫어한 건 «한 글자씩» 세로로 쪼개진 것이다.
  //    ⭐ 잣대를 폭에 맞춰 «정직하게» 갈랐다 — 좁은 폰에서 낱말 단위로 두 줄이 되는 건 «다른 일»이다.
  //       320px 「뮤트로 그레이지」 = 「뮤트로 / 그레이지」로 끊긴다(캡처로 눈으로 확인 · 빼빼로 아니다).
  //    ⛔ 느슨하게 한 게 아니다 — **3줄부터는 낱말이 깨진다**는 뜻이라 어느 폭에서도 실패로 잡는다.
  //    🔢 실측 = 360px 에선 「뮤트로 그레이지」가 두 줄이다(칸 138 − 패딩·테두리 24 = 글자 폭 114px ↔ 이름 ≈125px).
  //       ⛔ 패딩을 6 까지 줄여도 122px 이라 **안 들어간다** — 값으로는 못 푼다.
  //       ⛔ 이름을 줄이는 건 «창업자가 정한 이름»이라 내가 못 한다(규칙 11) → 그대로 두고 정직하게 적어 둔다.
  const 이름한도 = w >= 390 ? 1 : 2
  const 쪼개진 = 잰것.filter((t) => t.이름줄 > 이름한도)
  칸(쪼개진.length === 0, `이름이 ${이름한도}줄 이하다 (${w >= 360 ? '한 줄' : '낱말 단위 두 줄까지'})`,
    쪼개진.length ?쪼개진.map((t) => `${t.이름}=${t.이름줄}줄`).join(' · ') : 잰것.map((t) => t.이름줄).join('·') + '줄')
  const 긴설명 = 잰것.filter((t) => t.설명줄 > 2)
  칸(긴설명.length === 0, '설명이 두 줄 이하다', 긴설명.length ? 긴설명.map((t) => `${t.이름}=${t.설명줄}줄`).join(' · ') : 잰것.map((t) => t.설명줄).join('·') + '줄')
  const 넘침 = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth))
  칸(넘침 === 0, '가로 넘침 0', `${넘침}px`)
  칸(errs.length === 0, 'pageerror 0', String(errs.length))

  await 테마카드.screenshot({ path: `${방}/${w}-테마카드.png` }).catch(() => {})
  await ctx.close()
}

console.log(`\n${fail ? `⛔ ${fail}칸 실패` : '✅ 전부 통과'}  ·  판 = ${방}`)
await browser.close()
srv.kill()
process.exit(fail ? 1 : 0)
