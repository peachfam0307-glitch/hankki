// 📣 **9/1 「한끼 소식」 안내 — 그날 유저가 «실제로 보는 글»을 찍는다** (2026-08-30)
//
// 📮 창업자 = *"9월1일에 무료 나가는 전체 안내 있잖아 그거 바꿨어? 우리 구성이 달라졌으니까"*
//
// ⭐⭐ 답을 «기억»으로 하지 않는다 — 날짜를 9/1 로 속여 진짜 앱을 열고 그 글자를 읽는다(절대원칙 29·30).
//    ⛔ 소스를 읽어 「이렇게 나올 것이다」라고 말하지 않는다. `whatsnew.js` 는 데이터에서 «만들어지는» 글이라
//       소스만 봐선 몇 컷인지·무슨 제목인지 안 나온다.
//
// 🕐 9/1 첫 화면엔 **「한끼 소식」 팝업**이 뜬다(정상) — ⑴팝업을 먼저 찍고 ⑵닫은 뒤 ⑶소식 페이지를 연다.
//
// 🖨  ON=2026-09-01 node scripts/_shot-9월안내-0830.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const 그날 = process.env.ON || '2026-09-01'
const 방 = `${OUT}/9월안내-${그날}`
mkdirSync(방, { recursive: true })

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const now = Date.now()
const state = { recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })), seedV: BASICS_VERSION }

const PORT = 4381
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 900))

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
await ctx.addInitScript({ content: SEED_COACH_SEEN })
await ctx.addInitScript(`{
  const 그날 = new Date('${그날}T09:00:00+09:00').getTime()
  const O = Date
  class F extends O { constructor(...a){ return a.length ? new O(...a) : new O(그날) } static now(){ return 그날 } }
  Date = F
}`)
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${PORT}/`)
// ⛔⛔ [2026-09-02 고침] `hankki:news:off` 를 여기서 켜면 **팝업이 영영 안 뜬다.**
//   이 판의 ①번 칸이 「9/1 첫 화면 팝업」인데 그걸 «끄고» 찍고 있었다 —
//   그래서 `1-팝업.png` 가 8/30 판인 채로 남아 며칠 낡은 그림을 보고 있었다.
//   ⭐ 아래 ②에서 팝업을 «닫으므로» 끌 필요가 없다. 규칙 18 ⓘ — 판이 «무엇을 보는지».
await p.evaluate((s) => { localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1') }, state)
await p.goto(`http://127.0.0.1:${PORT}/`)
await p.waitForTimeout(1800)

const 글 = async (sel) => (await p.locator(sel).first().innerText().catch(() => '')).trim()

// ① 새 소식 팝업 — 9/1 에 «저절로» 뜬다
const 팝업 = p.locator('.sheet-mask, [role="dialog"]').first()
if (await 팝업.count()) {
  await p.screenshot({ path: `${방}/1-팝업.png` })
  console.log('\n【① 9/1 첫 화면 팝업】\n' + (await 글('.sheet-mask, [role="dialog"]')).split('\n').map((l) => '   ' + l).join('\n'))
} else {
  console.log('\n⚠️ 팝업이 «안» 떴다 — 소식이 비었거나 이미 본 것으로 잡혔다')
}

// ② 팝업 닫고 홈
for (let i = 0; i < 5; i++) {
  if (!(await p.locator('.sheet-mask').count())) break
  const c = p.getByRole('button', { name: /^(닫기|확인|나중에|취소)$/ })
  if (await c.count()) await c.first().click({ timeout: 4000 }).catch(() => {})
  else await p.keyboard.press('Escape')
  await p.waitForTimeout(400)
}
await p.screenshot({ path: `${방}/2-홈.png` })

// ③ 홈 「한끼 소식」 카드 → 안내 페이지 전체
//    ⛔ 첫 판은 카드를 누른 «뒤»에 `.screen` 을 읽어서 **홈 글자를 그대로 찍었다**(시트가 안 열렸는데
//       초록불처럼 보였다 · 규칙 18 ⓘ). → 「시트가 실제로 떴나」를 먼저 기다린다.
const 소식 = p.getByText('한끼 소식', { exact: false }).first()
if (await 소식.count()) {
  await 소식.click().catch(() => {})
  const 시트 = p.locator('.sheet-mask .sheet').first()
  await 시트.waitFor({ state: 'visible', timeout: 6000 }).catch(() => {})
  if (await 시트.count()) {
    await p.waitForTimeout(600)
    await p.screenshot({ path: `${방}/3-소식페이지.png`, fullPage: true })
    console.log('\n【③ 「한끼 소식」 안내 페이지 — 유저가 읽는 글 전부】\n' +
      (await 시트.innerText()).trim().split('\n').map((l) => '   ' + l).join('\n'))
  } else {
    console.log('\n⛔ 「한끼 소식」을 눌렀는데 시트가 «안» 열렸다 — 여기서 판정하지 말 것')
  }
} else {
  console.log('\n⚠️ 홈에서 「한끼 소식」 카드를 못 찾았다')
}

console.log(`\n📸 ${방}`)
await b.close(); srv.kill(); process.exit(0)
