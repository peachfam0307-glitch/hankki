import { chromium } from 'playwright'
const F = 'file:///tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/검수판-2026-10-05.html'
const b = await chromium.launch()
const p = await b.newPage()
const errs = []
p.on('pageerror', e => errs.push(String(e)))
await p.goto(F)
const boxes = await p.locator('.judge input.ck').count()
const notes = await p.locator('.judge input.note').count()
console.log(`  체크칸 ${boxes} · 적는 칸 ${notes}`)

// ① 첫 편 「이상해」 체크 + 메모
await p.locator('article').first().locator('.judge input.ck').nth(1).check()
await p.locator('article').first().locator('.judge input.note').fill('크루아상 4개는 많아')
// ② 둘째 편 「괜찮아」
await p.locator('article').nth(1).locator('.judge input.ck').nth(0).check()
console.log('  안내 =', (await p.locator('#cnt').textContent()).trim())

// ③ 새로고침 — 남아 있나
await p.reload()
const a = await p.locator('article').first().locator('.judge input.ck').nth(1).isChecked()
const m = await p.locator('article').first().locator('.judge input.note').inputValue()
const c = await p.locator('article').nth(1).locator('.judge input.ck').nth(0).isChecked()
console.log(`  ▶ 새로고침 뒤 — 이상해 ${a?'✅남음':'⛔날아감'} · 메모 "${m}" ${m?'✅':'⛔'} · 둘째 괜찮아 ${c?'✅':'⛔'}`)
console.log('  안내 =', (await p.locator('#cnt').textContent()).trim())

// ④ 복사 버튼
await p.locator('#copy').click()
const shown = await p.locator('#fallback').isVisible()
const out = await p.locator('#out').inputValue()
console.log(`  ▶ 복사 버튼 — 글 상자 ${shown?'✅뜸':'⛔안뜸'}`)
console.log('  ── 만들어진 글 ──')
console.log(out.split('\n').map(l=>'    '+l).join('\n'))
console.log('  pageerror =', errs.length ? errs : '없음')
await b.close()
