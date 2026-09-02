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

// 그날 그 스킨을 «주소로» 열어 글자를 읽는다 — 뽑기 운에 안 맡긴다
async function 스킨글(그날, 스킨) {
  const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
  await ctx.addInitScript({ content: SEED_COACH_SEEN })
  await ctx.addInitScript(`{
    const D = new Date('${그날}T09:00:00+09:00').getTime()
    const O = Date
    class F extends O { constructor(...a){ return a.length ? new O(...a) : new O(D) } static now(){ return D } }
    Date = F
  }`)
  const p = await ctx.newPage()
  const url = `http://127.0.0.1:${PORT}/?card=${스킨}`
  await p.goto(url)
  await p.evaluate((s) => { localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') }, state)
  await p.goto(url); await p.waitForTimeout(1300)
  await p.getByText('레꾸자랑', { exact: true }).last().click().catch(() => {})
  await p.waitForTimeout(800)
  await p.locator('.grid-card button, .grid-card').first().click().catch(() => {})
  await p.waitForTimeout(1000)
  const 뽑 = p.getByRole('button', { name: /랜덤|뽑기/ })
  if (await 뽑.count()) { await 뽑.first().click().catch(() => {}); await p.waitForTimeout(1200) }
  const 글 = await p.evaluate(() => document.body.innerText || '')
  await ctx.close()
  return 글
}

// 여러 번 뽑아 «어떤 씬»이 나오는지 모은다
async function 씬모음(그날, 회 = 40) {
  const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
  await ctx.addInitScript({ content: SEED_COACH_SEEN })
  await ctx.addInitScript(`{
    const D = new Date('${그날}T09:00:00+09:00').getTime()
    const O = Date
    class F extends O { constructor(...a){ return a.length ? new O(...a) : new O(D) } static now(){ return D } }
    Date = F
  }`)
  const p = await ctx.newPage()
  const url = `http://127.0.0.1:${PORT}/?card=pola`
  await p.goto(url)
  await p.evaluate((s) => { localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') }, state)
  await p.goto(url); await p.waitForTimeout(1300)
  await p.getByText('레꾸자랑', { exact: true }).last().click().catch(() => {})
  await p.waitForTimeout(800)
  await p.locator('.grid-card button, .grid-card').first().click().catch(() => {})
  await p.waitForTimeout(1000)
  const 본 = new Set()
  for (let i = 0; i < 회; i++) {
    const 뽑 = p.getByRole('button', { name: /랜덤|뽑기/ })
    if (await 뽑.count()) { await 뽑.first().click().catch(() => {}); await p.waitForTimeout(190) }
    const s = await p.evaluate(() => [...document.querySelectorAll('img')]
      .map((i) => (i.getAttribute('src') || '').split('/').pop())
      .filter((n) => /^scene_/.test(n)))
    s.forEach((n) => 본.add(n.replace(/-[A-Za-z0-9_-]+\.png$/, '')))
  }
  await ctx.close()
  return 본
}

console.log('\n── 11월 카드 (2026-09-02 확정) ──')

// ① 뼈대 «자체»가 그려지나 — ⛔안 그려지는데 아래 칸을 초록불로 만들지 않는다
const 엽서11 = await 스킨글('2026-11-15', 'post')
const 티켓11 = await 스킨글('2026-11-15', 'ticket')
적기(/11\s*·\s*NOV/.test(엽서11), '엽서 뼈대가 그려진다 (소인의 「11 · NOV」)')
적기(/ADMIT ONE/.test(티켓11), '티켓 뼈대가 그려진다 (스텁의 「ADMIT ONE」)')

// ② 늦가을 옷을 입었나 — 옷과 뼈대가 «같은 날»에 와야 11월이 확 바뀐다
const 늦가을11 = await 스킨글('2026-11-15', 'arch')
const 초가을9 = await 스킨글('2026-09-15', 'arch')
적기(/늦가을 한정/.test(늦가을11), '11월엔 「늦가을 한정」 배지를 단다')
적기(/가을 한정/.test(초가을9) && !/늦가을 한정/.test(초가을9), '9월엔 「가을 한정」 그대로다 (초가을은 안 건드렸다)')

// ③ ⭐심장 — 11월에만 뼈대 둘이 «더» 온다
//    ⛔ 주소(`?card=`)는 풀과 무관하니 «뽑기 풀»을 따로 본다. 앱과 같은 모듈에서 읽는다.
const { default: _ } = { default: null }   // (자리 표시 — 아래 evaluate 로 앱 안에서 읽는다)
async function 풀(그날) {
  const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
  // ⛔⛔ [2026-09-02] 여기 `SEED_COACH_SEEN` 을 빠뜨려서 **안내 코치가 클릭을 가로챘다.**
  //    「다시 뽑기」가 한 번도 안 눌렸는데 첫 장만 보고 «0번 나왔다»로 빨간불이 떴다 —
  //    앱은 멀쩡했고 **판이 아무것도 안 재고 있었다**(규칙 18 ⓘ · 거짓 빨간불).
  //    ✅ 그래서 아래에 «몇 번 눌렸나»도 같이 세서, 안 눌렸으면 그걸 먼저 말한다.
  await ctx.addInitScript({ content: SEED_COACH_SEEN })
  await ctx.addInitScript(`{
    const D = new Date('${그날}T09:00:00+09:00').getTime()
    const O = Date
    class F extends O { constructor(...a){ return a.length ? new O(...a) : new O(D) } static now(){ return D } }
    Date = F
  }`)
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/`)
  await p.waitForTimeout(900)
  // 40번 뽑아 «어떤 뼈대»가 나오는지 글자로 센다 — 풀에 없으면 40번 안엔 거의 확실히 안 나온다
  await p.evaluate((s) => { localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') }, state)
  await p.goto(`http://127.0.0.1:${PORT}/`); await p.waitForTimeout(1300)
  await p.getByText('레꾸자랑', { exact: true }).last().click().catch(() => {})
  await p.waitForTimeout(800)
  await p.locator('.grid-card button, .grid-card').first().click().catch(() => {})
  await p.waitForTimeout(1000)
  let 엽서 = 0, 티켓 = 0, 눌림 = 0, 본것 = 0
  for (let i = 0; i < 40; i++) {
    const 뽑 = p.getByRole('button', { name: /랜덤|뽑기/ })
    if (await 뽑.count()) { await 뽑.first().click().catch(() => {}); 눌림++; await p.waitForTimeout(190) }
    const t = await p.evaluate(() => document.body.innerText || '')
    if (/HOLO RARE|TODAY'S ISSUE|가을 한정|11\s*·\s*NOV|ADMIT ONE/.test(t)) 본것++
    if (/11\s*·\s*NOV/.test(t)) 엽서++
    if (/ADMIT ONE/.test(t)) 티켓++
  }
  await ctx.close()
  return { 엽서, 티켓, 눌림, 본것 }
}
const 십일월 = await 풀('2026-11-15')
const 구월 = await 풀('2026-09-15')
// ⛔ **먼저 「진짜로 뽑았나」를 잰다** — 안 뽑혔는데 「0번 나왔다」로 판정하면 그건 거짓 빨간불이다
적기(십일월.눌림 >= 30 && 구월.눌림 >= 30, `뽑기 단추가 실제로 눌렸다 (11월 ${십일월.눌림}회 · 9월 ${구월.눌림}회)`)
적기(십일월.본것 > 0 && 구월.본것 > 0, `뼈대 글자를 실제로 읽었다 (11월 ${십일월.본것} · 9월 ${구월.본것})`)
적기(십일월.엽서 > 0 && 십일월.티켓 > 0, `11월 뽑기에 엽서·티켓이 «둘 다» 나온다 (40번 중 엽서 ${십일월.엽서} · 티켓 ${십일월.티켓})`)
적기(구월.엽서 === 0 && 구월.티켓 === 0, `9월 뽑기엔 «안» 나온다 (40번 중 엽서 ${구월.엽서} · 티켓 ${구월.티켓})`)

// ④ 여름 씬은 여름에만
const 여름씬 = await 씬모음('2026-07-15')
const 가을씬 = await 씬모음('2026-11-15')
const SUMMER = ['scene_pool', 'scene_sandcastle', 'scene_picnic', 'scene_night_market']
적기(SUMMER.some((s) => 여름씬.has(s)), `여름엔 여름 씬이 나온다 (${[...여름씬].filter((s) => SUMMER.includes(s)).join(', ') || '없음'})`)
적기(!SUMMER.some((s) => 가을씬.has(s)), `가을엔 여름 씬이 «안» 나온다 (${[...가을씬].sort().join(', ')})`)
// ⛔ 「하나도 안 나온다」로 통과시키면 안 된다 — 씬을 통째로 잃어도 초록불이 된다(규칙 18 ⓘ)
적기(가을씬.size >= 4, `가을에도 사철 씬은 그대로 나온다 (${가을씬.size}장)`)

await b.close(); srv.kill()
console.log(bad ? `\n✗ ${bad}칸 실패` : '\n✅ 11월 카드 통과')
process.exit(bad ? 1 : 0)
