// 🍂 가을·추석·핼러윈·크리스마스 세트 — **날짜를 갈아끼워** 실제 앱에서 확인
//
// 검수 원칙 ⑤(실제 앱 렌더) = `docs/스티커-검수-절대원칙.md`.
// 확인할 것: ①7월엔 가을이 안 보인다 ②9/1·10/1·11/1에 세 파로 나뉘어 뜬다 ③뜰 땐 맨 위(제철)
//            ④⛔추석·핼러윈·크리스마스는 **언제든 안 보인다**(유료 팩 후보라 등록 안 함)
//            ⑤서랍 이미지 깨짐 0 ⑥pageerror 0
//
// ⚠️ 날짜는 `Date`를 통째로 갈아끼워 흉내낸다(브라우저 시계를 못 바꾸니).
//    `new Date()` 도, `Date.now()` 도 다 잡아야 한다 — 하나만 바꾸면 코드에 따라 새는 곳이 생긴다.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const BASE = 'http://127.0.0.1:4209/'
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4209', '--strictPort'], { stdio: 'ignore' })
for (let i = 0; i < 90; i++) { try { const r = await fetch(BASE); if (r.status < 500) break } catch { /* 대기 */ } await new Promise((r) => setTimeout(r, 400)) }
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })

const SETS = ['가을', '추석', '핼러윈', '크리스마스']   // 뒤 셋은 '안 보여야' 하는 것
const run = async (iso, label) => {
  const ctx = await b.newContext({ viewport: { width: 430, height: 940 }, deviceScaleFactor: 1 })
  await ctx.addInitScript(`(() => {
    const FAKE = new Date(${JSON.stringify(iso)}).getTime()
    const R = Date
    // eslint-disable-next-line no-global-assign
    Date = class extends R { constructor(...a) { super(...(a.length ? a : [FAKE])) } static now() { return FAKE } }
    Date.parse = R.parse; Date.UTC = R.UTC
    ;['hankki:onboarded', 'hankki:coach:home2', 'hankki:coach:detail', 'hankki:coach:decor',
      'hankki:coach:myrecipes', 'hankki:coach:editor'].forEach((k) => { try { localStorage.setItem(k, '1') } catch { /* noop */ } })
  })()`)
  const p = await ctx.newPage(); const errs = []
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(BASE, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1900)

  await p.getByRole('button', { name: '레시피', exact: true }).click(); await p.waitForTimeout(700)
  await p.locator('[data-coach="myrecipes-grid"] button, .grid2 button').first().click(); await p.waitForTimeout(700)
  await p.getByRole('button', { name: /꾸미기/ }).first().click(); await p.waitForTimeout(1100)

  const out = { label, iso }
  for (const tab of ['친구들', '데코']) {
    await p.getByRole('button', { name: tab, exact: true }).click(); await p.waitForTimeout(600)
    const labels = await p.locator('.decor-sec-label').allInnerTexts()
    out[tab] = SETS.filter((s) => labels.some((l) => l.includes(s)))
    out[tab + '_가을그룹'] = labels.filter((l) => /가을/.test(l)).length
    // 뜬 세트가 맨 위 쪽인지 (제철 정렬 확인) + 이미지 깨짐
    out[tab + '_첫3'] = labels.slice(0, 3).map((x) => x.trim())
    const broken = await p.evaluate(() => [...document.querySelectorAll('.decor-drawer img, .decor-sec img')]
      .filter((i) => i.complete && i.naturalWidth === 0).length)
    out[tab + '_깨짐'] = broken
  }
  out.err = errs.length
  await ctx.close()
  return out
}

const rows = []
for (const [iso, label] of [['2026-07-30T12:00:00', '오늘(7/30)'], ['2026-09-05T12:00:00', '9/5'],
  ['2026-10-05T12:00:00', '10/5'], ['2026-12-05T12:00:00', '12/5']]) {
  rows.push(await run(iso, label))
}
console.log('날짜별로 서랍에 뜨는 세트 (친구들 탭 / 데코 탭)')
for (const r of rows) {
  console.log(`\n── ${r.label} ──`)
  console.log(`  친구들: ${r['친구들'].join(', ') || '(없음)'}  가을그룹 ${r['친구들_가을그룹']}개  맨위3=${JSON.stringify(r['친구들_첫3'])}  깨짐 ${r['친구들_깨짐']}`)
  console.log(`  데코  : ${r['데코'].join(', ') || '(없음)'}  가을그룹 ${r['데코_가을그룹']}개  맨위3=${JSON.stringify(r['데코_첫3'])}  깨짐 ${r['데코_깨짐']}`)
  console.log(`  pageerror ${r.err}`)
}

// 판정
let bad = 0
// 가을만 보인다(3파로 나뉘어). 이벤트 세트는 유료 팩 후보라 언제든 0.
const want = { '오늘(7/30)': [], '9/5': ['가을'], '10/5': ['가을'], '12/5': ['가을'] }
for (const r of rows) {
  const seen = [...new Set([...r['친구들'], ...r['데코']])].sort()
  const w = want[r.label].slice().sort()
  const ok = JSON.stringify(seen) === JSON.stringify(w)
  if (!ok) { console.log(`\n✗ ${r.label} — 보인 세트 ${JSON.stringify(seen)} / 원하는 값 ${JSON.stringify(w)}`); bad++ }
  if (r['친구들_깨짐'] || r['데코_깨짐'] || r.err) { console.log(`\n✗ ${r.label} — 깨짐·에러 있음`); bad++ }
}
console.log(bad ? `\n❌ ${bad}건 실패` : '\n✅ 날짜별 공개·정렬·렌더 전부 통과')
await b.close(); srv.kill()
process.exit(bad ? 1 : 0)
