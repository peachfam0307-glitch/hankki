// 🎴 계절 카드 컷 — 날짜를 갈아끼워 **실제로 뽑아보고** 확인
//
// 확인할 것: ①7월엔 계절 컷(`sc_*`)이 한 번도 안 나온다 ②9·10·12월엔 나온다
//            ③여름 스킨엔 계절 컷이 안 섞인다(바다 배경에 한복 곰 금지) ④pageerror 0
// ⚠️ 뽑기는 랜덤이라 여러 번 돌려야 한다 — 30번 뽑아 히어로 이미지 이름을 모은다.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const BASE = 'http://127.0.0.1:4210/'
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4210', '--strictPort'], { stdio: 'ignore' })
for (let i = 0; i < 90; i++) { try { const r = await fetch(BASE); if (r.status < 500) break } catch { /* 대기 */ } await new Promise((r) => setTimeout(r, 400)) }
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })

const DRAWS = 30
const run = async (iso, label) => {
  const ctx = await b.newContext({ viewport: { width: 430, height: 940 }, deviceScaleFactor: 1 })
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
  await p.goto(BASE, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1800)
  await p.getByRole('button', { name: '레꾸자랑' }).last().click(); await p.waitForTimeout(700)
  await p.locator('[data-coach="brag-list"] button').first().click(); await p.waitForTimeout(600)
  await p.getByRole('button', { name: /랜덤 카드로 뽑기/ }).click(); await p.waitForTimeout(1400)

  const seen = new Set()
  for (let i = 0; i < DRAWS; i++) {
    // ⚠️ 카드는 `.sheet-mask` 밖(Portal)에 그려진다 → `document.images` 전체에서 골라야 한다.
    //    (처음엔 `.sheet-mask img` 로 찾다가 0종이 나왔다 — 코드가 아니라 선택자 문제였다)
    const names = await p.evaluate(() => [...document.images]
      .filter((x) => x.getBoundingClientRect().width >= 120)     // 그리드 썸네일(105px) 제외
      .map((x) => x.currentSrc.split('/').pop().replace(/-[A-Za-z0-9_-]{8}\.png$/, '.png'))
      .filter((n) => /^(au_b|cs_b|hw_|xm_|gom_|peng_|pn_|duo_|sm_|gn_)/.test(n)))
    names.forEach((n) => seen.add(n))
    if (i < DRAWS - 1) { await p.getByRole('button', { name: '다시 뽑기' }).click(); await p.waitForTimeout(320) }
  }
  await ctx.close()
  // 계절 컷은 **서랍 자산을 그대로 쓴다** → 이름이 `au_b*`·`cs_b*`·`hw_*`·`xm_*` 다
  //   (`sc_*` 로 복사해 두면 Vite 가 내용 같은 파일을 합쳐 이름이 바뀐다 → 그래서 목록 방식으로 갔다)
  const sc = [...seen].filter((n) => /^(au_b|cs_b|hw_|xm_)/.test(n))
  const sets = [...new Set(sc.map((n) => n.startsWith('au_b') ? 'au' : n.startsWith('cs_b') ? 'cs' : n.slice(0, 2)))].sort()
  return { label, iso, total: seen.size, sc: sc.length, sets, err: errs.length, sample: sc.slice(0, 4) }
}

const rows = []
for (const [iso, label] of [['2026-07-30T12:00:00', '오늘(7/30)'], ['2026-09-05T12:00:00', '9/5'],
  ['2026-10-05T12:00:00', '10/5'], ['2026-12-20T12:00:00', '12/20']]) rows.push(await run(iso, label))

console.log(`카드 ${DRAWS}번씩 뽑아 히어로에 나온 컷 모으기`)
for (const r of rows) {
  console.log(`\n── ${r.label} ──`)
  console.log(`  나온 캐릭터 컷 ${r.total}종 · 그중 계절 컷 ${r.sc}종  세트=${JSON.stringify(r.sets)}`)
  console.log(`  예: ${r.sample.join(', ') || '(없음)'}   pageerror ${r.err}`)
}
let bad = 0
const want = { '오늘(7/30)': [], '9/5': ['au', 'cs'], '10/5': ['au', 'cs', 'hw'], '12/20': ['xm'] }
for (const r of rows) {
  // 랜덤이라 '나올 수 있는 세트'의 부분집합이면 통과. 창 밖 세트가 하나라도 나오면 실패.
  const illegal = r.sets.filter((s) => !want[r.label].includes(s))
  if (illegal.length) { console.log(`\n✗ ${r.label} — 창 밖 세트가 나왔다: ${JSON.stringify(illegal)}`); bad++ }
  if (want[r.label].length && r.sc === 0) { console.log(`\n✗ ${r.label} — 계절 컷이 한 번도 안 나왔다(${DRAWS}번 뽑기)`); bad++ }
  if (r.err) { console.log(`\n✗ ${r.label} — pageerror ${r.err}`); bad++ }
}
console.log(bad ? `\n❌ ${bad}건 실패` : '\n✅ 계절 카드 컷 — 창 안에서만 나온다 · pageerror 0')
await b.close(); srv.kill()
process.exit(bad ? 1 : 0)
