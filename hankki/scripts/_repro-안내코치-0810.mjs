// 🧭 재현 — 안내코치 (창업자 폰 제보 2026-08-10 세 줄)
//    *"안내코치 레꾸자랑 이렇게돼"*(금색 테두리만 화면을 통째로 감싸고 말풍선이 없다)
//    *"한끼일기는 눌러도안내코치가 없네"*
//    *"레꾸자랑은 누르면 계속이래 안내코치 끝나도"*
//
// ⭐ 재는 것 = ①링이 화면보다 크지 않다 ②말풍선이 화면 «안»에 있다 ③어두운 배경이 실제로 덮는다
//    ④탭하면 끝난다 ⑤끝나면 탭을 옮겼다 와도 «다시 안 뜬다» ⑥일기 탭에도 코치가 있다 ⑦크래시 0
//
// ⛔ ①②③이 한 뿌리다 — 코치가 가리키는 것이 **레시피 격자 통째**(`[data-coach="brag-list"]`)라
//    높이가 수천 px 이다. 그러면 ⒜구멍 뚫는 그림자(`0 0 0 9999px`)가 화면 «밖»으로 밀려 안 어두워지고
//    ⒝말풍선을 위에 두는 계산(`bottom: innerHeight - rect.top …`)이 화면 위로 밀어낸다.
//    📌 규칙 18 — 「코치가 이상하다」가 아니라 **「가리키는 것이 화면보다 크다」**였다.
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
const state = {
  recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })),
  diary: [{ id: 'd1', kind: 'diary', at: now, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' }],
  seedV: BASICS_VERSION,
}

const PORT = Number(process.env.PORT || 4339)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
const stop = () => { try { srv.kill() } catch { /* noop */ } }
process.on('exit', stop)
await new Promise((r) => setTimeout(r, 900))

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await browser.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul' })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push(String(e)))

const url = `http://127.0.0.1:${PORT}/`
await page.goto(url)
// ⛔ 코치를 «본 적 없는» 상태라야 한다 — SEED_COACH_SEEN 을 쓰면 애초에 안 뜬다
await page.evaluate((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:onboarded', '1')
}, state)
await page.goto(url)
await page.waitForTimeout(1500)

let fail = 0
const 칸 = (ok, 이름, 값) => { console.log(`${ok ? '✅' : '⛔'} ${이름}${값 ? ` — ${값}` : ''}`); if (!ok) fail++ }
const 탭가기 = async (이름) => { await page.getByRole('button', { name: 이름, exact: true }).first().click(); await page.waitForTimeout(900) }
// 코치가 떠 있나 · 링과 말풍선의 실제 자리
const 코치 = () => page.evaluate(() => {
  const ring = document.querySelector('.coach-ring')
  if (!ring) return null
  const r = ring.getBoundingClientRect()
  const bub = [...document.querySelectorAll('div')].find((d) => d.style.maxWidth === '360px' && d.textContent)
  const b = bub?.getBoundingClientRect()
  return {
    ring: [Math.round(r.top), Math.round(r.height)],
    bubble: b ? [Math.round(b.top), Math.round(b.bottom)] : null,
    vh: window.innerHeight,
  }
})

// ⚠️ 홈 코치가 먼저 떠서 화면을 덮는다 — 탭을 누르려면 그것부터 끝내야 한다.
const 코치끝내기 = async () => {
  for (let i = 0; i < 10 && (await 코치()); i++) { await page.mouse.click(205, 700); await page.waitForTimeout(400) }
}
await 코치끝내기()

console.log('\n── 레꾸자랑 코치 ─────────────────────────')
await 탭가기('레꾸자랑')
await page.waitForTimeout(900)
const c = await 코치()
칸(!!c, '레꾸자랑에 안내코치가 뜬다', c ? `링 top ${c.ring[0]} · 높이 ${c.ring[1]} · 화면 ${c.vh}` : '안 뜸')
if (c) {
  칸(c.ring[1] <= c.vh, '① 링이 화면보다 크지 않다', `링 높이 ${c.ring[1]} vs 화면 ${c.vh}`)
  칸(!!c.bubble && c.bubble[0] >= 0 && c.bubble[1] <= c.vh, '② 말풍선이 화면 «안»에 있다', c.bubble ? `y ${c.bubble[0]}~${c.bubble[1]}` : '말풍선 없음')
  // ③ 어두운 배경이 진짜 덮나 — 링 «밖» 한 점을 찍어 본다(구멍이 화면을 다 먹으면 안 어둡다)
  const 어두움 = await page.evaluate(() => {
    const el = document.elementFromPoint(6, 6)
    return !!el?.closest('[role="button"][aria-label="다음 안내 보기"]')
  })
  칸(어두움, '③ 코치가 화면을 덮고 있다(구석을 눌러도 코치가 받는다)')
}
await page.screenshot({ path: `${OUT}/코치-레꾸자랑.png` })

console.log('\n── ④⑤ 끝내고 다시 오기 ───────────────────')
for (let i = 0; i < 6 && (await 코치()); i++) {
  await page.mouse.click(205, 700)
  await page.waitForTimeout(450)
}
칸(!(await 코치()), '④ 탭하면 코치가 끝난다')
await 탭가기('홈')
await 탭가기('레꾸자랑')
await page.waitForTimeout(900)
칸(!(await 코치()), '⑤ 끝난 코치가 «다시 안 뜬다»', (await 코치()) ? '또 떴다' : '')

console.log('\n── ⑥ 일기 탭 ─────────────────────────────')
// ⛔⛔ **창업자 폰과 «같은 순서»로 가야 한다** — 레시피 탭을 «먼저» 본 뒤 일기 탭에 간다.
//    둘이 코치 키를 같이 쓰면 여기서 안내가 영영 안 뜬다(그게 제보였다).
await 탭가기('레시피')
await 코치끝내기()
await 탭가기('일기')
await page.waitForTimeout(1000)
const d = await 코치()
칸(!!d, '⑥ 레시피 탭을 먼저 봐도 일기 탭에 코치가 뜬다', d ? `링 높이 ${d.ring[1]}` : '코치 없음')
if (d) {
  const 글 = await page.evaluate(() => [...document.querySelectorAll('div')].find((x) => x.style.maxWidth === '360px')?.innerText || '')
  칸(/달력|일기/.test(글), '   일기 코치 내용이 «일기 것»이다', 글.split('\n')[0])
}
if (d) 칸(d.ring[1] <= d.vh && !!d.bubble && d.bubble[0] >= 0 && d.bubble[1] <= d.vh, '   일기 코치도 링·말풍선이 화면 안', `링 ${d.ring[1]} · 말풍선 ${JSON.stringify(d.bubble)}`)
await page.screenshot({ path: `${OUT}/코치-일기.png` })

console.log('\n── ⑦ 크래시 ──────────────────────────────')
칸(errs.length === 0, '런타임 크래시 0', errs.slice(0, 2).join(' / '))

await browser.close()
stop()
console.log(fail ? `\n⛔ ${fail}칸 어긋남` : '\n✅ 안내코치 검사 통과')
process.exit(fail ? 1 : 0)
