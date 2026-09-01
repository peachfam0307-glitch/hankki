// 🧑‍🤝‍🧑🔢 **「소품과 캐릭터를 «갈라» 세나 · 큰 숫자를 «안» 세우나」 재현판** (smoke · 2026-09-02)
//
// 📮 창업자 원문 셋 — 이 셋이 이 판의 전부다
//   ⑴ *"너무 많은 것 같긴한데.. **캐릭터랑 합쳐져서 더 많아보이는 듯**"* → *"그니까 **갈라서 세워야** 할 것 같아."*
//   ⑵ *"**큰 숫자는 넣지말자 계속 그렇게 줘야할 것 같아서**"*
//   ⑶ *"**가을의 정원은 한정선물이잖아. 오해할 듯해. 매달주는걸로**"*
//
// ⭐⭐ **심장 = 「합계가 화면에 뜨지 «않나»」** — ⛔「27 이 뜨나」가 아니다.
//    숫자를 박아 두면 컷이 하나 늘 때마다 판이 낡아 **고쳐놓고도 빨간불**이 된다.
//    그래서 «갈래별 숫자를 화면에서 읽어» 그 합이 어디에도 안 뜨는지 본다.
//    📌 규칙 18 ⓘ — 판이 «무엇을 보는지».
//
// ⛔ 왜 필요한가 = 이 셋은 **되돌리기가 너무 쉽다.**
//    `packKind()` 한 줄만 지우면 51 로 돌아가고, 큰 숫자는 「예쁘니까」로 되살아나기 쉽다.
//    화면은 멀쩡해 보이고 아무도 안 터진다 — 그래서 판이 필요하다.
//
// 🧪 규칙 12 = `packKind` 를 지우면 ②③이, 큰 숫자를 되살리면 ④가, 선물 글자를 되돌리면 ⑤가 죽는다.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const 그날 = '2026-09-01'   // 카롱 데뷔 ＋ 가을 소품이 «같은 날» 열린 날 = 갈라 셀 이유가 생긴 날
const PORT = 4419
let bad = 0
const 적기 = (ok, m) => { console.log(`  ${ok ? 'ok ' : '✗'} ${m}`); if (!ok) bad++ }

const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 900))

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const now = Date.now()
const state = { recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })), seedV: BASICS_VERSION }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
await ctx.addInitScript({ content: SEED_COACH_SEEN })
await ctx.addInitScript(`{
  const 그날 = new Date('${그날}T09:00:00+09:00').getTime()
  const O = Date
  class F extends O { constructor(...a){ return a.length ? new O(...a) : new O(그날) } static now(){ return 그날 } }
  Date = F
}`)
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${PORT}/`)
await p.evaluate((s) => { localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1') }, state)
await p.goto(`http://127.0.0.1:${PORT}/`)
await p.waitForTimeout(1800)

console.log('\n── 갈라 세기 (2026-09-01) ──')

// ① 팝업이 떴나 — ⛔안 떴는데 뒤 칸을 초록불로 만들지 않는다(2026-08-24 교훈)
const 팝업 = p.locator('.sheet-mask, [role="dialog"]').first()
적기(await 팝업.count() > 0, '9/1 첫 화면에 새 소식 팝업이 떴다')
const 팝글 = (await 팝업.innerText().catch(() => '')) || ''

// ② 갈래별 숫자가 «둘 다» 화면에 있다
const 꾸 = 팝글.match(/꾸미기\s*(\d+)\s*종/)
const 친 = 팝글.match(/친구들\s*(\d+)\s*종/)
적기(!!꾸 && !!친, `팝업에 갈래가 둘 — 꾸미기 ${꾸?.[1] ?? '?'}종 · 친구들 ${친?.[1] ?? '?'}종`)

// ③ ⭐심장 — 그 «합계»가 어디에도 안 뜬다
if (꾸 && 친) {
  const 합 = Number(꾸[1]) + Number(친[1])
  적기(!new RegExp(`(^|[^0-9])${합}\\s*종`).test(팝글), `합계 ${합}종이 팝업에 «없다» (합쳐 세지 않는다)`)
}

// ④ 큰 숫자를 안 세운다 — 창업자 *"큰 숫자는 넣지말자"*
//    ⛔ 글자로는 못 잡는다(숫자는 어차히 있다) → **글자 크기를 잰다**
const 큰숫자 = await p.evaluate(() => {
  const 안 = document.querySelector('.sheet-mask, [role="dialog"]')
  if (!안) return -1
  let 최대 = 0
  for (const el of 안.querySelectorAll('span, div')) {
    if (!/^\s*\d+\s*종?\s*$/.test(el.textContent || '')) continue
    최대 = Math.max(최대, parseFloat(getComputedStyle(el).fontSize) || 0)
  }
  return 최대
})
적기(큰숫자 >= 0 && 큰숫자 < 30, `팝업에 «크게 세운 숫자»가 없다 (제일 큰 숫자 글자 = ${큰숫자}px · 30 미만이어야)`)

// ⑤ 선물이 «매달 오는 것»으로 안 읽힌다 (창업자 2026-09-02 *"매달주는거 아니라는 걸 잘 안내해줘"*)
적기(/매달[^.\n]*아니/.test(팝글), '선물 칸이 「매달 오는 게 아니다」를 말한다')
// ⭐⭐ 여기가 이 판에서 제일 값어치 있는 칸 — **「한정」은 우리 선물엔 «거짓말»이다.**
//    `isReleased`(season.js:64)엔 닫는 조건이 없어서 **겨울에 깔아도 받는다.**
//    ⛔ 누가 「한정」·「이번에만」을 적으면 «없어진다»고 약속하는 것이고,
//       그건 절대원칙(*"한 번 준 것은 빼앗지 않는다"*)과도 부딪친다.
적기(!/한정|이번에만|지금만/.test(팝글), '「한정」·「이번에만」 같은 «사라진다»는 말이 없다')
적기(!/출시기념 선물/.test(팝글), '옛 글자(「출시기념 선물」)가 «안» 남아 있다')

// ⑥ 소식 «페이지»도 같은 잣대 — ⛔한쪽만 고치면 소식과 팝업이 다른 숫자를 말한다
//    ⚠️ 팝업도 `.sheet-mask` 라 **닫히는 것을 먼저 기다린다** — 안 그러면 팝업 글자를 소식 글자로 읽는다.
//    ⛔ 그리고 **「도착했나」를 먼저 잰다** — 못 갔는데 「친구들 줄이 없다」로 나오면 그건 거짓 빨간불이다.
for (let i = 0; i < 5; i++) {
  if (!(await p.locator('.sheet-mask').count())) break
  const c = p.getByRole('button', { name: /^(닫기|확인|나중에|취소)$/ })
  if (await c.count()) await c.first().click({ timeout: 4000 }).catch(() => {})
  else await p.keyboard.press('Escape')
  await p.waitForTimeout(400)
}
await p.getByText('한끼 소식', { exact: false }).first().click().catch(() => {})
const 시트 = p.locator('.sheet-mask .sheet').first()
await 시트.waitFor({ state: 'visible', timeout: 6000 }).catch(() => {})
await p.waitForTimeout(600)
const 왔나 = await 시트.count() > 0
적기(왔나, '소식 페이지가 실제로 열렸다 (⛔못 열면 아래 칸은 아무것도 안 잰 것이다)')
if (왔나) {
  const 쪽글 = await 시트.innerText()
  적기(/꾸미기\s*\d+\s*종/.test(쪽글) && /친구들\s*\d+\s*종/.test(쪽글), '소식 페이지에도 꾸미기 줄과 친구들 줄이 «따로» 있다')
}

await b.close(); srv.kill()
console.log(bad ? `\n✗ ${bad}칸 실패` : '\n✅ 갈라 세기 통과')
process.exit(bad ? 1 : 0)
