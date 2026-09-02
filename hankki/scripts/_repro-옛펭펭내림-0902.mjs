// 🐧🧥 **「옛 펭펭이 카드에 한 번도 안 나오나」** — 진짜 앱에서 뽑아 세어 본다 (2026-09-02)
//
// 📮 창업자 = *"연한베이지트렌치랑 트렌치에 벨트없는거."*
//    *"그건 얼굴도 펭펭이 조금 이상해 다 빼야해"* · *"부족한거 다시뽑아줄게 그펭펭은 다 빼자"*
//
// ⭐⭐ **심장 = 「목록에서 지웠나」가 아니라 「화면에 안 나오나」다.**
//    `ShareDrawCard` 엔 폴백이 «둘» 있었고 둘 다 «폴더 전체»로 새어서,
//    목록만 지우면 내린 컷이 **뒷문으로 되살아난다**:
//      ⑴ `pickPool` = 걸린 게 없으면 그 접두어 전체로 폴백
//      ⑵ `rnd(cat.length ? cat : ENTRIES)` = 풀이 비면 **폴더 전체**
//    📌 규칙 18 ⓘ — 「목록을 지웠다」와 「화면에 안 뜬다」는 다른 말이다.
//
// ⛔ `SEED_COACH_SEEN` 을 빼면 코치마크가 클릭을 가로채 「0번 뽑음」이 된다(2026-09-02 실제로 당했다).
// ⛔ 「다시 뽑기」는 **브라우저 안에서** 누른다 — 뽑을 때마다 리액트가 단추를 새로 그려
//    플레이라이트 손잡이가 중간에 떨어져 나간다(`force: true` 로도 안 된다).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

// ⛔ 카드에 한 번도 나오면 안 되는 것
//   ⛔⛔ **`duo_` 를 여기 늦게 넣었다**(2026-09-02 저녁 · 창업자 = *"둘이 장보는 컷에 펭펭이 옛컷이네.."*).
//      낮엔 «솔로» 펭펭만 잣대에 넣어서, **같은 옛 펭펭이 들어 있는 콤비 12컷은 통과시켰다.**
//      📌 잣대를 「그 파일 이름」이 아니라 **「그 그림이 나오나」**로 세웠어야 했다.
//      ✅ `au_b15`·`au_b16`(가을 콤비)은 정본이라 여기 «안» 넣는다 — 열어서 확인했다.
const 옛펭펭 = /^(peng_|pn_|duo_)/
const 정본펭펭 = /^(pj_|pjs_|duos_|au_b08)/   // ✅ 나와야 하는 것(가을 창에서)
const 뽑기수 = Number(process.env.N || 90)

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const now = Date.now()
const state = { recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })), seedV: BASICS_VERSION }

const PORT = 4399
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 900))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })

let 실패 = 0
const 칸 = (ok, 글) => { console.log(`  ${ok ? '✅' : '❌'} ${글}`); if (!ok) 실패 += 1 }

for (const [날짜, 가을인가] of [['2026-10-05', true], ['2026-12-10', false], ['2026-08-10', false]]) {
  const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
  await ctx.addInitScript({ content: SEED_COACH_SEEN })
  await ctx.addInitScript(`{
    const D = new Date('${날짜}T09:00:00+09:00').getTime()
    const O = Date
    class F extends O { constructor(...a){ return a.length ? new O(...a) : new O(D) } static now(){ return D } }
    Date = F
  }`)
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/`)
  await p.evaluate((s) => {
    localStorage.setItem('hankki:v1', JSON.stringify(s))
    localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:news:off', '1')
  }, state)
  await p.goto(`http://127.0.0.1:${PORT}/`)
  await p.waitForTimeout(1400)
  for (let i = 0; i < 4; i += 1) {
    if (!(await p.locator('.sheet-mask').count())) break
    const c = p.getByRole('button', { name: /^(닫기|확인|나중에|취소)$/ })
    if (await c.count()) await c.first().click({ timeout: 3000 }).catch(() => {})
    else await p.keyboard.press('Escape')
    await p.waitForTimeout(300)
  }
  await p.getByText('레꾸자랑', { exact: true }).last().click({ timeout: 5000 }).catch(() => {})
  await p.waitForTimeout(900)
  await p.locator('.grid-card button').first().click({ timeout: 5000 }).catch(() => {})
  await p.waitForTimeout(900)
  await p.getByRole('button', { name: /랜덤 카드로 뽑기/ }).first().click({ timeout: 5000 }).catch(() => {})
  await p.waitForTimeout(1800)

  const 본것 = new Set()
  let 눌렀다 = 0
  for (let i = 0; i < 뽑기수; i += 1) {
    const 이름들 = await p.evaluate(() => {
      const 큰것 = [...document.querySelectorAll('img')]
        .map((x) => ({ x, r: x.getBoundingClientRect() }))
        .filter((o) => o.r.width > 120 && o.r.height > 120)
        .sort((a, c) => c.r.width * c.r.height - a.r.width * a.r.height)[0]
      if (!큰것) return []
      let el = 큰것.x
      while (el.parentElement) {
        const r = el.parentElement.getBoundingClientRect()
        if (r.width >= 300 && r.height >= 400) { el = el.parentElement; break }
        el = el.parentElement
      }
      return [...el.querySelectorAll('img')].map((x) => (x.currentSrc || x.src || '').split('/').pop())
    })
    // ⚠️ Vite 가 이름 뒤에 해시를 붙인다(`pj_02-BkUGsH1Z.png`) → 앞부분만 본다
    이름들.forEach((f) => 본것.add(String(f).replace(/-[A-Za-z0-9_]{6,}\.png$/, '').replace(/\.png$/, '')))
    if (i === 뽑기수 - 1) break
    const ok = await p.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').includes('다시 뽑기'))
      if (!btn) return false
      btn.click()
      return true
    })
    if (!ok) break
    눌렀다 += 1
    await p.waitForTimeout(340)
  }

  const 옛것 = [...본것].filter((n) => 옛펭펭.test(n))
  const 정본 = [...본것].filter((n) => 정본펭펭.test(n))
  console.log(`\n【${날짜}】 ${뽑기수}칸 중 ${눌렀다}번 뽑았다 · 본 컷 ${본것.size}종`)
  칸(눌렀다 >= 뽑기수 - 2, `뽑기가 끝까지 눌렸다 (${눌렀다}번)`)   // ⛔ 안 눌리면 아래가 «거짓 초록불»이 된다
  칸(옛것.length === 0, `옛 펭펭 0종${옛것.length ? ` — ⛔ ${옛것.join(' ')}` : ''}`)
  // ⛔⛔ **[2026-09-02 저녁] 여기가 «거짓 초록불»이었다** — 사철 날짜에 `칸(true, …)` 로 그냥 통과시켰다.
  //    그땐 맞는 말이었다(사철 펭펭이 진짜로 0이었으니까). 그런데 **창업자가 새 컷을 뽑아 준 순간 낡았다** —
  //    `pjs_`·`duos_` 16컷이 들어왔는데도 이 칸은 여전히 «아무것도 안 재고» 초록불을 냈다.
  //    📌 **「지금은 없는 게 맞다」는 검사는 그것이 생기는 날 반드시 거짓말이 된다.**
  //       ⭐ 그래서 잣대를 「날짜별로 다른 말」이 아니라 **「어느 날이든 정본이 나와야 한다」**로 바꾼다.
  //          가을이면 가을 컷이 얹혀 더 많이 나올 뿐이고, 사철이라고 «안» 나오면 그게 고장이다.
  칸(정본.length > 0, `${가을인가 ? '가을' : '사철'}에도 정본이 나온다 (${정본.join(' ') || '⛔ 없다'})`)
  await ctx.close()
}

console.log(실패 ? `\n❌ ${실패}칸 실패` : '\n✅ 전부 통과 — 옛 펭펭이 카드에 한 번도 안 나온다')
await b.close(); srv.kill(); process.exit(실패 ? 1 : 0)
