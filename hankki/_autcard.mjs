// 🍂 가을 카드 스킨 — 실제 앱에서 렌더해 **눈으로** 확인 (검수 원칙 ⑤)
//
// 확인할 것: ①7월엔 가을 스킨이 안 나온다 ②10월엔 나온다 ③가을 컷(au_*)만 쓴다
//            ④12월 첫 2주(전환기)엔 스킨은 뜨는데 가을 창이 닫혀 **폴백**이 도는지
//            ⑤글자가 칸을 안 넘는지 ⑥pageerror 0
// ⚠️ `?card=autumn` 은 코드에 이미 있는 강제 지정 파라미터(drawState) — 스킨만 고정하고 캐릭터는 랜덤.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const BASE = 'http://127.0.0.1:4211/'
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4211', '--strictPort'], { stdio: 'ignore' })
for (let i = 0; i < 90; i++) { try { const r = await fetch(BASE); if (r.status < 500) break } catch { /* 대기 */ } await new Promise((r) => setTimeout(r, 400)) }
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })

const open = async (iso, card) => {
  const ctx = await b.newContext({ viewport: { width: 1180, height: 2500 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(`(() => {
    const FAKE = new Date(${JSON.stringify(iso)}).getTime()
    const R = Date
    Date = class extends R { constructor(...a) { super(...(a.length ? a : [FAKE])) } static now() { return FAKE } }
    Date.parse = R.parse; Date.UTC = R.UTC
    ;['hankki:onboarded', 'hankki:coach:home2', 'hankki:coach:brag', 'hankki:coach:detail']
      .forEach((k) => { try { localStorage.setItem(k, '1') } catch { /* noop */ } })
  })()`)
  const p = await ctx.newPage(); const errs = []
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(BASE + (card ? `?card=${card}` : ''), { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800)
  await p.getByRole('button', { name: '레꾸자랑' }).last().click(); await p.waitForTimeout(700)
  await p.locator('[data-coach="brag-list"] button').first().click(); await p.waitForTimeout(600)
  await p.getByRole('button', { name: /랜덤 카드로 뽑기/ }).click(); await p.waitForTimeout(1500)
  return { ctx, p, errs }
}
// 히어로에 쓰인 컷 이름 (그리드 썸네일 제외)
const heroNames = (p) => p.evaluate(() => [...document.images]
  .filter((x) => x.getBoundingClientRect().width >= 120)
  .map((x) => x.currentSrc.split('/').pop().replace(/-[A-Za-z0-9_-]{8}\.png$/, '.png')))

// ── ① 10월: 가을 스킨을 강제 지정해 **눈으로 볼 스크린샷** 3장 ──
{
  const { ctx, p, errs } = await open('2026-10-05T12:00:00', 'autumn')
  for (let i = 0; i < 3; i++) {
    const el = p.locator('div[style*="width: 1080px"]').first()
    await el.screenshot({ path: `/tmp/aut-card-${i + 1}.png` })
    const n = await heroNames(p)
    console.log(`  #${i + 1} 히어로 = ${n.filter((x) => !/^(hankki|icon)/.test(x)).join(', ')}`)
    if (i < 2) { await p.getByRole('button', { name: '다시 뽑기' }).click(); await p.waitForTimeout(700) }
  }
  console.log(`  pageerror ${errs.length}`)
  await ctx.close()
}

// ── ② 날짜별로 가을 스킨이 뽑기 풀에 있나 (강제 지정 없이 40번) ──
const poolAt = async (iso, label) => {
  const { ctx, p, errs } = await open(iso, null)
  const seen = { autumn: 0, summer: 0, other: 0 }
  const cuts = new Set()
  for (let i = 0; i < 40; i++) {
    // 가을 스킨의 지문 = "가을 한정" 뱃지 / 여름 = "여름 한정"
    const txt = await p.evaluate(() => document.body.innerText)
    if (txt.includes('가을 한정')) seen.autumn++
    else if (txt.includes('여름 한정')) seen.summer++
    else seen.other++
    ;(await heroNames(p)).forEach((n) => /^(au_|cs_|hw_|xm_|sm_)/.test(n) && cuts.add(n))
    if (i < 39) { await p.getByRole('button', { name: '다시 뽑기' }).click(); await p.waitForTimeout(190) }
  }
  await ctx.close()
  return { label, ...seen, err: errs.length, cuts: [...cuts] }
}
console.log('\n날짜별 뽑기 40번 — 어떤 스킨이 나오나')
const rows = []
for (const [iso, label] of [['2026-07-30T12:00:00', '오늘(7/30)'], ['2026-09-05T12:00:00', '9/5 전환기'],
  ['2026-10-05T12:00:00', '10/5 가을'], ['2026-12-05T12:00:00', '12/5 겨울전환기'], ['2027-02-05T12:00:00', '2/5 겨울']]) {
  rows.push(await poolAt(iso, label))
}
for (const r of rows) console.log(`  ${r.label.padEnd(16)} 가을 ${String(r.autumn).padStart(2)} · 여름 ${String(r.summer).padStart(2)} · 그외 ${String(r.other).padStart(2)}   계절컷 ${r.cuts.length}종  err ${r.err}`)

let bad = 0
// ⚠️ 7/30 은 **여름**이라 여름 스킨이 나오는 게 정상이다(처음에 [0,0]으로 잘못 적어 헛다리 실패가 났다).
const want = { '오늘(7/30)': [0, 1], '9/5 전환기': [1, 1], '10/5 가을': [1, 0], '12/5 겨울전환기': [1, 0], '2/5 겨울': [0, 0] }
for (const r of rows) {
  const [wantAut, wantSum] = want[r.label]
  if (wantAut ? r.autumn === 0 : r.autumn > 0) { console.log(`✗ ${r.label} — 가을 스킨 ${r.autumn}회 (원하는 값: ${wantAut ? '1회 이상' : '0회'})`); bad++ }
  if (wantSum ? r.summer === 0 : r.summer > 0) { console.log(`✗ ${r.label} — 여름 스킨 ${r.summer}회 (원하는 값: ${wantSum ? '1회 이상' : '0회'})`); bad++ }
  if (r.err) { console.log(`✗ ${r.label} — pageerror ${r.err}`); bad++ }
}
console.log(bad ? `\n❌ ${bad}건 실패` : '\n✅ 가을 스킨 — 제철에만 나온다 · pageerror 0')
await b.close(); srv.kill()
process.exit(bad ? 1 : 0)
