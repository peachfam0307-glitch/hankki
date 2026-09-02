// 🐧🎴 **펭펭 정본 4컷이 «진짜 카드»에서 어떻게 보이나** — 넣고 나서 눈으로 본다 (2026-09-02)
//
// 📮 창업자 = *"좋다고 한 것 중에서 선별해서 넣어줘."*
// ⛔ 절대원칙 21 = 창업자에게 보여주기 «전»에 내가 실물을 열어서 본다.
//    숫자(긴변·비율·게이트)는 전부 초록불이어도 **크게 띄웠을 때 어떤지는 눈으로만 안다.**
// ⛔ 절대원칙 30 = 흉내가 아니라 «진짜 앱»에서 찍는다 — 시계를 가을로 속이고 카드를 뽑는다.
//
// ⚠️ 뽑기는 운이라 원하는 컷이 안 나올 수 있다 → **`Math.random` 을 씨앗으로 고정**하고
//    「다시 뽑기」를 여러 번 눌러 **네 컷이 다 나올 때까지** 돈다. 나온 순간 카드를 찍는다.
// ⚠️ `SEED_COACH_SEEN` 을 빼면 안내 코치가 클릭을 가로채 「0번 뽑음」이 된다(2026-09-02 실제로 당했다).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const 방 = `${OUT}/펭펭정본카드-0902`
mkdirSync(방, { recursive: true })
const 그날 = process.env.ON || '2026-10-05'
const 찾을것 = (process.env.CUTS || 'pj_01,pj_02,pj_03,pj_04').split(',')
const 최대 = Number(process.env.TRY || 120)

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const now = Date.now()
const state = { recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })), seedV: BASICS_VERSION }

const PORT = 4391
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
  // 🎲 씨앗 고정 난수 = mulberry32.
  // ⛔⛔ 첫 판은 「s*1103515245+12345」 로 짰다가 **페이지가 통째로 멈췄다** —
  //    ⛔ 이 주석에 «백틱»을 쓰면 안 된다 — 이 블록 자체가 백틱 템플릿이라 거기서 «닫힌다».
  //       (2026-09-02 에 실제로 그렇게 죽었다. 낫표「」로 쓴다 · CLAUDE.md 백틱 함정과 같은 자리)
  //    곱이 2.4e18 이라 자바스크립트 안전 정수(9e15)를 넘어 정밀도가 깨지고
  //    수열이 한 값에 눌러앉는다 → 「앞이랑 다른 걸 뽑을 때까지」 도는 자리에서 무한 고리.
  //    📌 **씨앗 난수는 반드시 32비트 안에서 돈다(Math.imul)**.
  let s = 20260902 >>> 0
  Math.random = () => {
    s = (s + 0x6D2B79F5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}`)
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${PORT}/`)
await p.evaluate((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:news:off', '1')
}, state)

const 치우기 = async () => {
  for (let i = 0; i < 5; i += 1) {
    if (!(await p.locator('.sheet-mask').count())) break
    const c = p.getByRole('button', { name: /^(닫기|확인|나중에|취소)$/ })
    if (await c.count()) await c.first().click({ timeout: 4000 }).catch(() => {})
    else await p.keyboard.press('Escape')
    await p.waitForTimeout(300)
  }
}

// ⛔⛔ **클릭마다 timeout 을 «짧게» 준다** — `.catch(()=>{})` 만 붙이면 기본 30초를 꽉 기다린다.
//    2026-09-02 첫 판이 그래서 100초를 넘겨 죽었다(원인은 「막힌 것」이 아니라 «기다린 것»이었다).
const 눌러 = async (loc, 라벨) => {
  const ok = await loc.click({ timeout: 5000 }).then(() => true).catch(() => false)
  console.log(`  ${ok ? '·' : '⚠️'} ${라벨}${ok ? '' : ' — 못 눌렀다'}`)
  return ok
}

await p.goto(`http://127.0.0.1:${PORT}/`)
await p.waitForTimeout(1400)
await 치우기()
await 눌러(p.getByText('레꾸자랑', { exact: true }).last(), '레꾸자랑 탭')
await p.waitForTimeout(800)
await 치우기()
// ⛔⛔ **길이 «두 단»이다** — 레시피를 고르면 카드가 바로 뜨는 게 아니라 시트가 하나 더 뜬다:
//    「간장게장 자랑하기 · 어떻게 보낼까요?」 → ⑴내가 꾸민 표지 그대로 ⑵**랜덤 카드로 뽑기**
//    ⑵를 눌러야 카드가 나온다. (2026-09-02 에 이걸 몰라 「자랑할 레시피를 눌러주세요」에서 헛돌았다)
await 눌러(p.locator('.grid-card button, .grid-card').first(), '레시피 고르기')
await p.waitForTimeout(1000)
await 눌러(p.getByRole('button', { name: /랜덤 카드로 뽑기/ }).first(), '랜덤 카드로 뽑기')
await p.waitForTimeout(2200)

// 🔎 카드 상자 찾기 — `.draw-card` 같은 열쇠가 «없다». 히어로 그림에서 위로 올라가며 찾는다.
//    ⛔ 화면 전체를 찍으면 뒤에 깔린 레시피 격자까지 들어와 판정이 흐려진다.
const 카드정보 = () => p.evaluate(() => {
  const 큰것 = [...document.querySelectorAll('img')]
    .map((i) => ({ i, r: i.getBoundingClientRect() }))
    .filter((x) => x.r.width > 120 && x.r.height > 120)
    .sort((a, b) => b.r.width * b.r.height - a.r.width * a.r.height)[0]
  if (!큰것) return null
  let el = 큰것.i
  while (el.parentElement) {
    const r = el.parentElement.getBoundingClientRect()
    if (r.width >= 300 && r.height >= 400) { el = el.parentElement; break }
    el = el.parentElement
  }
  const r = el.getBoundingClientRect()
  el.setAttribute('data-shot', '1')
  return {
    그림: [...el.querySelectorAll('img')].map((i) => (i.currentSrc || i.src || '').split('/').pop()),
    폭: Math.round(r.width), 키: Math.round(r.height),
    히어로: Math.round(큰것.r.width) + 'x' + Math.round(큰것.r.height),
  }
})

const 뽑기 = p.getByRole('button', { name: /다시 뽑기/ })
const 찾음 = new Map()
let 눌렀다 = 0
for (let i = 0; i < 최대 && 찾음.size < 찾을것.length; i += 1) {
  const 정보 = await 카드정보()
  const imgs = 정보 ? 정보.그림 : []
  if (i === 0) console.log(`  카드 상자 = ${정보 ? `${정보.폭}x${정보.키} · 히어로 ${정보.히어로}` : '못 찾음'}`)
  for (const k of 찾을것) {
    if (찾음.has(k)) continue
    if (imgs.some((f) => f.startsWith(`${k}-`) || f === `${k}.png`)) {
      await p.locator('[data-shot="1"]').first().screenshot({ path: `${방}/${k}.png` }).catch(() => {})
      찾음.set(k, 정보)
      console.log(`  ✅ ${k}  ${i}번째 뽑기 · 카드 ${정보.폭}x${정보.키} · 히어로 ${정보.히어로}`)
    }
  }
  if (찾음.size >= 찾을것.length) break
  if (!(await 뽑기.count())) { console.log('  ⛔ 「다시 뽑기」 단추를 못 찾았다'); break }
  // ⛔ 뽑고 나서 카드가 다시 그려지는 «동안»엔 단추가 안 눌린다 → 한 번 실패하면 쉬었다 다시.
  let 됐다 = await 뽑기.first().click({ timeout: 3000 }).then(() => true).catch(() => false)
  if (!됐다) { await p.waitForTimeout(1200); 됐다 = await 뽑기.first().click({ timeout: 5000 }).then(() => true).catch(() => false) }
  if (!됐다) {
    await p.screenshot({ path: `${방}/막힌화면.png` })
    console.log(`  ⛔ ${i}번째에서 뽑기 단추가 두 번 다 안 눌린다 — 막힌화면.png 를 볼 것`)
    console.log('     본문 =', (await p.evaluate(() => (document.body.innerText || '').replace(/\n+/g, ' / ').slice(0, 160))))
    break
  }
  눌렀다 += 1
  await p.waitForTimeout(650)
}

console.log(`\n🔁 뽑기 ${눌렀다}번 · 찾은 컷 ${찾음.size}/${찾을것.length}`)
for (const k of 찾을것) if (!찾음.has(k)) console.log(`  ⚠️ ${k} 는 ${눌렀다}번 안에 안 나왔다(뽑기 운 — 풀엔 들어 있다)`)
console.log(`📸 ${방}`)
await b.close(); srv.kill(); process.exit(찾음.size === 찾을것.length ? 0 : 1)
