// 🔎 9/1 검수판이 왜 멈추나 — «화면을 읽어서» 알아낸다
//
// ⛔⛔ 2026-08-10 첫 판이 4분 타임아웃으로 죽었다. 범인은 앱이 아니라 «이 파일»이었다 —
//    `spawn` 한 파이썬 서버가 노드 이벤트 루프를 붙잡고 있어 `browser.close()` 뒤에도 안 끝난다.
//    찍을 건 다 찍고 «끝나지를» 못한 것이다. 📌 규칙 18 그대로 — 「없다」의 이유를 내가 정하지 말 것.
//    ✅ 그래서 맨 끝에 `srv.kill()` ＋ `process.exit(0)` 을 못 박는다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const 그날 = process.env.ON || '2026-09-01'
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const now = Date.now()
const state = { recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })), seedV: BASICS_VERSION }

const PORT = Number(process.env.PORT || 4364)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
const stop = () => { try { srv.kill() } catch { /* noop */ } }
await new Promise((r) => setTimeout(r, 900))

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await browser.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
await ctx.addInitScript({ content: SEED_COACH_SEEN })
await ctx.addInitScript(`{
  const 그날 = new Date('${그날}T09:00:00+09:00').getTime()
  const OrigDate = Date
  class FakeDate extends OrigDate {
    constructor(...a) { return a.length ? new OrigDate(...a) : new OrigDate(그날) }
    static now() { return 그날 }
  }
  Date = FakeDate
}`)
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push(String(e)))

const url = `http://127.0.0.1:${PORT}/`
await page.goto(url)
await page.evaluate((s) => { localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1') }, state)
await page.goto(url)
await page.waitForTimeout(1800)

console.log(`\n앱이 보는 오늘 = ${await page.evaluate(() => new Date().toISOString().slice(0, 10))}`)

// 무엇이 화면을 덮고 있나 — 「떠 있다」가 아니라 «무슨 글자가 적혀 있나»를 읽는다
const 덮개 = await page.evaluate(() => [...document.querySelectorAll('.sheet-mask')].map((e) => {
  const r = e.getBoundingClientRect()
  return { 글: (e.innerText || '').slice(0, 120).replace(/\n+/g, ' / '), 크기: `${Math.round(r.width)}x${Math.round(r.height)}`, 보임: getComputedStyle(e).display }
}))
console.log(`덮개(.sheet-mask) ${덮개.length}개`)
덮개.forEach((s, i) => console.log(`  [${i}] ${s.크기} ${s.보임} — ${s.글}`))

// 코치마크·오버레이도 클릭을 막는다 — 같이 본다
const 위층 = await page.evaluate(() => {
  const out = []
  for (const e of document.body.querySelectorAll('*')) {
    const cs = getComputedStyle(e)
    if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') continue
    const r = e.getBoundingClientRect()
    if (r.width < innerWidth * 0.8 || r.height < innerHeight * 0.6) continue
    if (cs.pointerEvents === 'none') continue
    out.push({ cls: e.className?.toString?.().slice(0, 40) || e.tagName, z: cs.zIndex, 글: (e.innerText || '').slice(0, 60).replace(/\n+/g, ' / ') })
  }
  return out
})
console.log(`화면을 덮은 fixed 층 ${위층.length}개`)
위층.forEach((s) => console.log(`  · ${s.cls} (z=${s.z}) — ${s.글}`))

// 화면 한가운데를 실제로 «누가» 받나
const 받는놈 = await page.evaluate(() => {
  const e = document.elementFromPoint(innerWidth / 2, innerHeight / 2)
  return e ? `${e.tagName}.${e.className?.toString?.().slice(0, 50)}` : '(없음)'
})
console.log(`화면 한가운데를 받는 것 = ${받는놈}`)

console.log(`pageerror ${errs.length}${errs.length ? ` — ${errs[0]}` : ''}`)
await page.screenshot({ path: `${OUT}/diag-0901.png` })
console.log(`캡처 = ${OUT}/diag-0901.png\n`)

await browser.close()
stop()
process.exit(0)
