// 🍂🎴 **「11월에 뼈대 둘이 더 오나 · 여름 씬이 안 나오나」 재현판** (smoke · 2026-09-02)
//
// 📮 창업자 원문 둘 — 이 판의 전부다
//   ⑴ *"**11월은 둘가추가하자.**"*  (엽서 ＋ 티켓 = 11월엔 8장)
//   ⑵ *"**여름씬은 이제 빼도 될 것 같아.**"*  (폴라로이드 씬 풀)
//
// ⭐⭐ **심장 = 「날짜에 따라 «달라지나»」** — ⛔「지금 나오나」가 아니다.
//    그래서 **여름·초가을·늦가을 세 날**을 같은 방식으로 돌려 **서로 다른지**를 본다.
//    한 날만 보면 「원래 그런 것」과 구분이 안 된다.
//
// ⛔ 왜 필요한가 = 이 둘은 **조용히 되돌아간다.**
//    `pool` 에서 두 낱말을 지우거나 `scenesNow` 를 `SCENES` 로 되돌리면
//    **화면은 멀쩡하고 아무도 안 터진다.** 11월이 와야 드러나는데 그땐 늦다.
//    📌 2026-08-04 *"자랑카드 여름가을같이돌아감"* 이 정확히 그렇게 새어 나왔다.
//
// 🧪 규칙 12 = `pool` 에서 post·ticket 을 빼면 ③이, `scenesNow` 를 되돌리면 ④가 죽는다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = Number(process.env.PORT || 4449)
let bad = 0
const 적기 = (ok, m) => { console.log(`  ${ok ? 'ok ' : '✗'} ${m}`); if (!ok) bad++ }

const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 900))

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const now = Date.now()
const state = { recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })), seedV: BASICS_VERSION }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })

// ⏱⏱ **[2026-09-02] 이 판이 «스모크에서만» 죽고 있었다 — 혼자 돌리면 11/11 초록불이었다.**
//   🔢 원인 = **느려서다.** `smoke-par.mjs:118` 이 한 단계에 **300초** 를 주는데(`timeout: 300000`)
//      혼자 돌면 171초라 통과하고, 130개가 «동시에» 돌며 CPU 를 나눠 쓰면 300초를 넘겨
//      노드가 SIGTERM 을 맞고 → 브라우저가 닫히고 → `Target page … has been closed` 로 터졌다.
//   ✅ **일을 줄였다** — 뽑는 왕복을 넷에서 하나로(아래 `뽑고읽기`) · 안 쓰는 것은 안 읽고 · 11월 뽑기는 둘 다 보이면 그만(40 → 12번).
//   ⛔⛔ **그런데 그것만으로는 안 닫혔다 — 「빠르게 고쳤다」고 말할 뻔했다.**
//      혼자 돌린 실측이 **79 · 128 · 151 · 158 · 192 · 257초**로 흔들렸다. **한 일은 똑같은데 세 배다**(공용 CPU).
//      📌 그 흔들림이 300초를 넘나드니 **코드가 멀쩡한 날에도 빨간불이 떴다** — 그럼 빨간불을 믿을 수 없게 된다.
//      → 그래서 `smoke-par.mjs` 의 한 단계 상한을 **480초**로 올리고, **180초 넘는 단계는 이름을 부르게** 했다.
//         (상한의 «이유»는 「멈춘 판 잡기」다. 480초로도 그건 그대로 잡히고, 빠른 단계는 그대로 빠르다)
//   ⛔ **A·B 를 비교할 땐 이 기계의 흔들림을 먼저 재라** — 나는 79초 ↔ 152초를 보고
//      「겹쳐 돌리면 두 배 느리다」고 «결론»부터 냈다. 두 번 더 재보니 그 차이는 대부분 «그날의 운»이었다.
//   📌 「혼자서는 통과한다」를 「괜찮다」로 읽지 말 것 — 게이트는 «스모크 안에서» 통과해야 게이트다.

// ⚡ **한 번 뽑고 «같은 왕복»에서 읽는다** — 누르기·기다리기·읽기를 브라우저 «안»에서 한 번에.
//   ⛔ 손잡이(`getByRole(...)`)를 미리 잡아 두지 않는다 — 리액트가 다시 그리며 손잡이를 떼어 버려
//      `click()` 이 기본 30초를 꽉 채우고 실패한다(2026-09-02 에 다른 판에서도 같은 자리를 밟았다).
//   ⚡ ＋ **정해진 시간을 「기다리지」 않는다 — 화면이 «바뀐 그 순간» 읽는다**(보통 한두 프레임).
//      ⛔ 그래도 상한은 둔다. 같은 카드가 또 나오면 아무것도 안 바뀌어 영영 못 빠져나온다.
//      ⛔ 지문은 `innerText` 가 아니라 **`src` 목록**으로 본다 — innerText 는 프레임마다 레이아웃을 강제한다.
//   ⚡ ＋ **필요한 것만 읽는다** — 씬을 세는 판은 글자가 필요 없고, 뼈대를 세는 판은 씬이 필요 없다.
//      ⛔ 하나로 합쳐 «둘 다» 읽으면 뽑기 160번마다 안 쓰는 일을 160번 한다.
const 뽑고읽기 = (p, { 쉼 = 190, 글 = false, 씬 = false } = {}) => p.evaluate(async (o) => {
  const 지문 = () => [...document.querySelectorAll('img')].map((i) => i.getAttribute('src') || '').join('|')
  const 전 = 지문()
  const 단추 = [...document.querySelectorAll('button')].find((x) => /랜덤|뽑기/.test(x.textContent || ''))
  if (단추) {
    단추.click()
    // ⛔⛔ **`Date.now()` 를 쓰면 «영영 안 끝난다»** — 이 판은 시계를 그날로 «얼려» 두었다
    //    (`static now(){ return D }`). 얼린 시계로 상한을 재면 상한이 오지 않는다.
    //    ✅ `performance.now()` 는 안 얼렸다.
    const 끝 = performance.now() + o.쉼
    while (performance.now() < 끝 && 지문() === 전) await new Promise((r) => setTimeout(r, 16))
    await new Promise((r) => setTimeout(r, 16))   // 바뀐 뒤 한 틈 더 — 그려질 시간
  }
  return {
    눌림: !!단추,
    // ⚡⚡ **`innerText` 가 아니라 `textContent`** — innerText 는 «화면 배치를 다시 계산»시킨다.
    //    레꾸자랑 화면은 뒤에 레시피 격자가 깔려 있어 그게 뽑기 한 번을 크게 늘렸다.
    //    ⚠️ textContent 는 «안 보이는 글자»까지 담는다 — 여기서 찾는 말(ADMIT ONE·11 · NOV·HOLO RARE·
    //       TODAY'S ISSUE·늦가을 한정)은 **카드 안에만** 그려지니 안전하다(딴 화면엔 0건 · 실측).
    //       ⛔ 「보이나」를 재는 판에는 이 방법을 쓰지 말 것.
    글: o.글 ? (document.body.textContent || '') : '',
    씬: o.씬 ? [...document.querySelectorAll('img')]
      .map((i) => (i.getAttribute('src') || '').split('/').pop())
      .filter((n) => /^scene_/.test(n))
      .map((n) => n.replace(/-[A-Za-z0-9_-]+\.png$/, '')) : [],
  }
}, { 쉼, 글, 씬 })

// 그날 그 방을 연다 — 시계를 속이고, 레꾸자랑에서 레시피를 골라 카드 시트까지 띄운다
//   ⭐ 저장값은 `addInitScript` 로 **미리 심는다** — 예전엔 `goto → localStorage → goto` 로 두 번 열었다.
//      ⛔ `page.reload()` 와 섞지 말 것(check-mistakes ⑧) — 여기선 한 번만 연다.
async function 방(그날, 스킨) {
  const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
  await ctx.addInitScript({ content: SEED_COACH_SEEN })
  await ctx.addInitScript((s) => {
    try {
      localStorage.setItem('hankki:v1', JSON.stringify(s))
      localStorage.setItem('hankki:onboarded', '1')
      localStorage.setItem('hankki:news:off', '1')
    } catch { /* 저장이 막힌 판이면 그냥 둔다 */ }
  }, state)
  // 🎲🎲 **뽑기를 «운»에 안 맡긴다** — 2026-09-04 CI 실측: 40번 뽑아 엽서가 0번 나왔다.
  //   🔢 8장 균등이면 (7/8)^40 = 0.5%. 드물지만 «푸시마다» 도니까 반드시 또 난다.
  //   ⛔ 40을 200으로 «넓히지» 않는다 — 그러면 다음엔 200번짜리 꼬리가 온다(절대원칙 34).
  //   ✅ 대신 **실패의 «모양»을 바꾼다**: 씨앗을 박아 뽑기를 늘 같게 만든다.
  //      바로 아래에서 날짜를 고정하는 것과 «같은 자리·같은 수법»이다.
  //   📌 앱은 안 건드린다. 이 판이 재는 것은 「11월 풀에 둘이 있나」이지 「운이 좋았나」가 아니다.
  await ctx.addInitScript(`{
    let s = 0x9e3779b9
    Math.random = () => {
      s = (s + 0x6D2B79F5) | 0
      let t = Math.imul(s ^ (s >>> 15), 1 | s)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }`)
  await ctx.addInitScript(`{
    const D = new Date('${그날}T09:00:00+09:00').getTime()
    const O = Date
    class F extends O { constructor(...a){ return a.length ? new O(...a) : new O(D) } static now(){ return D } }
    Date = F
  }`)
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/${스킨 ? `?card=${스킨}` : ''}`)
  await p.waitForTimeout(1300)
  await p.getByText('레꾸자랑', { exact: true }).last().click().catch(() => {})
  await p.waitForTimeout(800)
  await p.locator('.grid-card button, .grid-card').first().click().catch(() => {})
  await p.waitForTimeout(1000)
  return { ctx, p }
}

// 그날 그 스킨을 «주소로» 열어 글자를 읽는다 — 뽑기 운에 안 맡긴다
async function 스킨글(그날, 스킨) {
  const { ctx, p } = await 방(그날, 스킨)
  const { 글 } = await 뽑고읽기(p, { 쉼: 1200, 글: true })
  await ctx.close()
  return 글
}

// 여러 번 뽑아 «어떤 씬»이 나오는지 모은다
async function 씬모음(그날, 회 = 32) {
  const { ctx, p } = await 방(그날, 'pola')
  const 본 = new Set()
  for (let i = 0; i < 회; i++) {
    const { 씬 } = await 뽑고읽기(p, { 씬: true })
    씬.forEach((n) => 본.add(n))
  }
  await ctx.close()
  return 본
}

console.log('\n── 11월 카드 (2026-09-02 확정) ──')

// ⚠️ 여기를 `Promise.all` 로 «같이» 돌려 봤다 — **빨라지지 않았다**(2026-09-02).
//    이 판은 기다리는 게 아니라 **CPU 를 쓴다**(코어 넷 · 크로미움 넷이 서로 뺏는다).
//    ⛔ 다만 「두 배 느려진다」고까지는 «말 못 한다» — 이 기계는 같은 일도 세 배가 흔들린다(맨 위 참조).
//    ✅ 그래서 **더 단순한 쪽(하나씩)** 을 남겼다. 이득이 확실하지 않으면 복잡한 쪽을 고르지 않는다.
const 엽서11 = await 스킨글('2026-11-15', 'post')    // ① 뼈대 «자체»가 그려지나
const 티켓11 = await 스킨글('2026-11-15', 'ticket')
const 늦가을11 = await 스킨글('2026-11-15', 'arch')  // ② 늦가을 옷 — 옷과 뼈대가 «같은 날»에 와야 11월이 확 바뀐다
const 초가을9 = await 스킨글('2026-09-15', 'arch')
// ⛔ 뼈대가 안 그려지는데 아래 칸을 초록불로 만들지 않는다
적기(/11\s*·\s*NOV/.test(엽서11), '엽서 뼈대가 그려진다 (소인의 「11 · NOV」)')
적기(/ADMIT ONE/.test(티켓11), '티켓 뼈대가 그려진다 (스텁의 「ADMIT ONE」)')
적기(/늦가을 한정/.test(늦가을11), '11월엔 「늦가을 한정」 배지를 단다')
적기(/가을 한정/.test(초가을9) && !/늦가을 한정/.test(초가을9), '9월엔 「가을 한정」 그대로다 (초가을은 안 건드렸다)')

// ③ ⭐심장 — 11월에만 뼈대 둘이 «더» 온다
//    ⛔ 주소(`?card=`)는 풀과 무관하니 «뽑기 풀»을 따로 본다. 앱과 같은 모듈에서 읽는다.
// ⛔⛔ [2026-09-02] 예전엔 여기서 `SEED_COACH_SEEN` 을 빠뜨려 **안내 코치가 클릭을 가로챘다.**
//    「다시 뽑기」가 한 번도 안 눌렸는데 첫 장만 보고 «0번 나왔다»로 빨간불이 떴다 —
//    앱은 멀쩡했고 **판이 아무것도 안 재고 있었다**(규칙 18 ⓘ · 거짓 빨간불).
//    ✅ 그래서 «몇 번 눌렸나»도 같이 세서, 안 눌렸으면 그걸 «먼저» 말한다.
//    (지금은 `방()` 이 코치를 늘 꺼 주므로 한 곳만 고치면 된다)
//    ⭐ **「나온다」는 보이는 순간 끝나고, 「안 나온다」는 끝까지 뽑아야 한다** — 그래서 둘을 다르게 돌린다.
//       40번 뽑으면 8장 중 한 장을 못 볼 확률이 0.5% 다. 「안 나온다」쪽은 그 40번을 다 채운다.
async function 풀(그날, 둘다보면멈춤 = false) {
  const { ctx, p } = await 방(그날)
  let 엽서 = 0, 티켓 = 0, 눌림 = 0, 본것 = 0, 뽑은 = 0
  for (let i = 0; i < 40; i++) {
    const { 눌림: 됐나, 글 } = await 뽑고읽기(p, { 글: true })
    뽑은++
    if (됐나) 눌림++
    if (/HOLO RARE|TODAY'S ISSUE|가을 한정|11\s*·\s*NOV|ADMIT ONE/.test(글)) 본것++
    if (/11\s*·\s*NOV/.test(글)) 엽서++
    if (/ADMIT ONE/.test(글)) 티켓++
    if (둘다보면멈춤 && 엽서 && 티켓 && 뽑은 >= 12) break
  }
  await ctx.close()
  return { 엽서, 티켓, 눌림, 본것, 뽑은 }
}
// ⛔ 위와 같은 이유로 «하나씩» 돌린다 — 겹쳐 돌리면 오히려 느려진다
const 십일월 = await 풀('2026-11-15', true)   // 둘 다 보이면 그만 — 더 뽑아도 답이 안 바뀐다
const 구월 = await 풀('2026-09-15')            // ⛔「안 나온다」는 40번을 «다» 뽑아야 말할 수 있다
const 여름씬 = await 씬모음('2026-07-15')   // ④ 여름 씬은 여름에만
const 가을씬 = await 씬모음('2026-11-15')
// ⛔ **먼저 「진짜로 뽑았나」를 잰다** — 안 뽑혔는데 「0번 나왔다」로 판정하면 그건 거짓 빨간불이다
적기(십일월.눌림 === 십일월.뽑은 && 십일월.뽑은 >= 12 && 구월.눌림 === 40, `뽑기 단추가 «뽑은 만큼» 눌렸다 (11월 ${십일월.눌림}/${십일월.뽑은}회 · 9월 ${구월.눌림}/${구월.뽑은}회)`)
적기(십일월.본것 > 0 && 구월.본것 > 0, `뼈대 글자를 실제로 읽었다 (11월 ${십일월.본것} · 9월 ${구월.본것})`)
적기(십일월.엽서 > 0 && 십일월.티켓 > 0, `11월 뽑기에 엽서·티켓이 «둘 다» 나온다 (${십일월.뽑은}번 중 엽서 ${십일월.엽서} · 티켓 ${십일월.티켓})`)
적기(구월.엽서 === 0 && 구월.티켓 === 0, `9월 뽑기엔 «안» 나온다 (40번 중 엽서 ${구월.엽서} · 티켓 ${구월.티켓})`)

const SUMMER = ['scene_pool', 'scene_sandcastle', 'scene_picnic', 'scene_night_market']
적기(SUMMER.some((s) => 여름씬.has(s)), `여름엔 여름 씬이 나온다 (${[...여름씬].filter((s) => SUMMER.includes(s)).join(', ') || '없음'})`)
적기(!SUMMER.some((s) => 가을씬.has(s)), `가을엔 여름 씬이 «안» 나온다 (${[...가을씬].sort().join(', ')})`)
// ⛔ 「하나도 안 나온다」로 통과시키면 안 된다 — 씬을 통째로 잃어도 초록불이 된다(규칙 18 ⓘ)
적기(가을씬.size >= 4, `가을에도 사철 씬은 그대로 나온다 (${가을씬.size}장)`)

await b.close(); srv.kill()
console.log(bad ? `\n✗ ${bad}칸 실패` : '\n✅ 11월 카드 통과')
process.exit(bad ? 1 : 0)
