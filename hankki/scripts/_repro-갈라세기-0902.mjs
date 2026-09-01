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

// ⑥ 선물을 «두 번» 말하지 않는다 (창업자 2026-09-02 *"가을의 정원은 아래에 크게 안내하니까 윗줄에는 빼자"*)
//    ⛔ 이름을 판에 박지 «않는다» — 선물이 바뀌면 판만 낡는다.
//       선물 칸이 스스로 밝힌 이름을 «화면에서 읽어» 그 이름이 팝업에 몇 번 나오나 센다.
const 선물이름 = 팝글.match(/^(.+?)\s*\d+종을 넣어뒀어요/m)?.[1]
if (선물이름) {
  const 몇번 = 팝글.split(선물이름).length - 1
  적기(몇번 === 1, `선물 이름(「${선물이름}」)이 팝업에 «한 번»만 나온다 (지금 ${몇번}번 · 칩에 또 두지 않는다)`)
} else {
  적기(false, '선물 칸을 못 찾았다 — ⛔여기서 판정하지 말 것')
}

// ⑦ 소식 «페이지»도 같은 잣대 — ⛔한쪽만 고치면 소식과 팝업이 다른 숫자를 말한다
//    ⚠️ 팝업도 `.sheet-mask` 라 **닫히는 것을 먼저 기다린다** — 안 그러면 팝업 글자를 소식 글자로 읽는다.
//    ⛔ 그리고 **「도착했나」를 먼저 잰다** — 못 갔는데 「친구들 줄이 없다」로 나오면 그건 거짓 빨간불이다.
// ⛔⛔ [2026-09-02 고침] 「닫기」를 눌러 팝업을 치우려 했는데 **안 닫히는 날이 있었다.**
//    그러면 `getByText('한끼 소식')` 이 못 찾고(팝업엔 그 글자가 없다) 조용히 넘어가서
//    `.sheet-mask .sheet` 첫 번째 = **팝업**을 소식 페이지로 읽는다.
//    🚨 그때 「꾸미기 N종 · 친구들 N종」이 **팝업 머릿줄에도 있어서 초록불이 떴다** —
//       즉 **소식 페이지를 한 번도 안 보고 통과**하고 있었다(규칙 18 ⓘ · 거짓 초록불).
//    ✅ 그래서 누르는 대신 **팝업을 꺼서**(`news:off`) 다시 연다 — 눌림에 안 기댄다.
await p.evaluate(() => localStorage.setItem('hankki:news:off', '1'))
await p.reload()
await p.waitForTimeout(1600)
적기(await p.locator('.sheet-mask').count() === 0, '팝업을 껐다 (⛔안 꺼지면 아래는 팝업을 읽는 것이다)')
await p.getByText('한끼 소식', { exact: false }).first().click().catch(() => {})
const 시트 = p.locator('.sheet-mask .sheet').first()
await 시트.waitFor({ state: 'visible', timeout: 6000 }).catch(() => {})
await p.waitForTimeout(600)
// ⭐ 「열렸나」가 아니라 **「소식 페이지가 맞나」**를 잰다 — 팝업도 `.sheet-mask .sheet` 다.
const 첫줄 = ((await 시트.innerText().catch(() => '')) || '').split('\n')[0].trim()
const 왔나 = 첫줄 === '한끼 소식'
적기(왔나, `소식 페이지가 «맞다» (첫 줄 = ${첫줄 || '(빈칸)'} · ⛔팝업이면 아래 칸은 아무것도 안 잰 것이다)`)
if (왔나) {
  const 쪽글 = await 시트.innerText()
  if (process.env.DUMP) console.log('\n──── 소식 페이지 글 ────\n' + 쪽글 + '\n────────\n')
  적기(/꾸미기\s*\d+\s*종/.test(쪽글) && /친구들\s*\d+\s*종/.test(쪽글), '소식 페이지에도 꾸미기 줄과 친구들 줄이 «따로» 있다')

  // ⑧ 선물이 «제 줄»로 서 있다 (창업자 확정 2026-09-02 · 검수판 ⑥ *"23으로 줄이기"*)
  //    ⛔ 그전엔 `foldPacks` 가 선물을 「꾸미기 N종」 줄 «안»에 삼켜서
  //       소식 페이지에서 택도 「매달 아님」 한 줄도 **한 번도 안 그려지고 있었다**(실측).
  const 선물줄 = 쪽글.match(/(특별 선물|선물)\s*(\d+)\s*종/)
  // ⛔ 빨간불이 뜨면 «왜»를 같이 보여준다 — 「없다」만 찍으면 못 갔는지 안 그렸는지 모른다(규칙 18 ⓘ)
  const 선물근처 = 쪽글.split('\n').filter((l) => /선물/.test(l)).join(' ／ ') || '(「선물」이라는 글자가 한 줄도 없다)'
  적기(!!선물줄, `소식 페이지에 선물 줄이 «따로» 있다 ${선물줄 ? `(${선물줄[0]})` : `— ⛔못 찾았다. 「선물」 든 줄 = ${선물근처}`}`)
  적기(/매달[^.\n]*아니/.test(쪽글), '소식 페이지도 「매달 오는 게 아니다」를 말한다 (⛔팝업과 같은 잣대)')

  // ⑨ ⭐**팝업과 소식이 «같은 숫자»를 말하나** — 242줄 주석이 못 박은 그것
  //    ⛔ 한쪽만 고치면 조용히 갈린다. 숫자를 판에 박지 않고 «두 화면에서 읽어» 견준다.
  const 쪽꾸 = 쪽글.match(/꾸미기\s*(\d+)\s*종/)
  if (꾸 && 쪽꾸) 적기(꾸[1] === 쪽꾸[1], `팝업과 소식이 같은 꾸미기 종수를 말한다 (팝업 ${꾸[1]} · 소식 ${쪽꾸[1]})`)

  // ⑩ 그 꾸미기 종수에 **선물이 안 섞였다** — 선물 줄 숫자가 꾸미기 숫자에 들어가면 두 번 세는 것이다
  //    ⭐ 잣대 = 「꾸미기 줄에 적힌 수」 ＋ 「선물 줄에 적힌 수」가 **서로 다른 몫**인가.
  //       접혀 있던 옛 판에선 꾸미기 = 23＋4 = 27 이었다.
  if (쪽꾸 && 선물줄) {
    const 옛 = Number(쪽꾸[1]) + Number(선물줄[2])
    적기(!new RegExp(`꾸미기\\s*${옛}\\s*종`).test(쪽글), `꾸미기 종수에 선물 ${선물줄[2]}종이 «안» 섞였다 (섞였으면 ${옛}종이 된다)`)
  }
}

await b.close(); srv.kill()
console.log(bad ? `\n✗ ${bad}칸 실패` : '\n✅ 갈라 세기 통과')
process.exit(bad ? 1 : 0)
