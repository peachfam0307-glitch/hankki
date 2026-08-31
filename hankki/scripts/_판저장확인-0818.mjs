// 🧪 검수판 저장 검사 — 「고른 것이 «제 자리»에 남나」
//
// ⛔⛔ [2026-08-18 사고] 저장을 «순서 번호»로 해서 창업자 검수가 통째로 밀렸다.
//    판을 33편 → 21편으로 다시 뽑자 번호가 밀려, 고등어조림 메모가 «연근사과샐러드»에 붙었다.
//    📮 창업자 = "이거 뭐가 밀렸는데 … 샐러드에 가루육수들어가고 양념게장에 가루육수들어가고 이상해졌어"
// ⭐ 그래서 이 검사의 심장 = **「같은 열쇠로 «다른 판»을 열어도 안 밀리나」**.
//    「저장되나」만 보면 옛 판도 통과한다(실제로 그랬다).
//
// ⛔⛔ **첫 판은 «밀림을 재현하지 못했다»** — 규칙 12 로 되돌려 보고서야 알았다(옛 판도 통과).
//    까닭 = 큰판·작판의 **제목이 달라서**(「~ 2026-12-07」 vs 「2026-10-05」) 옛 열쇠로도 안 부딪혔다.
//    ⭐ 진짜 사고는 **제목이 «같고» 편 수만 다른 두 판**(33편 → 21편)에서 났다.
//    ✅ 그래서 이 검사는 그 상황을 «손으로 만든다» — 같은 제목, 다른 편 수.
import { chromium } from 'playwright'
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const 큰판 = `file://${OUT}/검수판-2026-10-05-외5.html`
const 작판 = `file://${OUT}/검수판-2026-10-05.html`
let 실패 = 0
const 봐 = (조건, 말) => { console.log(`  ${조건 ? '✅' : '⛔'} ${말}`); if (!조건) 실패++ }

const b = await chromium.launch()
const ctx = await b.newContext()          // ⭐ 한 브라우저 = localStorage 를 공유한다(진짜 상황)
const p = await ctx.newPage()
const errs = []
p.on('pageerror', (e) => errs.push(String(e)))

await p.goto(큰판)
const 첫제목 = (t) => t.locator('article').first().locator('h2').textContent()
const 이름 = await 첫제목(p)
await p.locator('article').first().locator('.judge input.ck').nth(1).check()
await p.locator('article').first().locator('.judge input.note').fill('여기에 적은 것')
봐((await p.locator('#cnt').textContent()).includes('저장'), '고르면 저장됐다고 뜬다')

await p.reload()
봐(await p.locator('article').first().locator('.judge input.ck').nth(1).isChecked(), '새로고침해도 남는다')
봐((await p.locator('article').first().locator('.judge input.note').inputValue()) === '여기에 적은 것', '적은 글도 남는다')

// ⭐⭐ 진짜 검사 — **제목이 «같고» 편 수만 다른 판**을 같은 브라우저에서 연다(33편 → 21편 그 상황)
import { readFileSync as _r, writeFileSync as _w } from 'node:fs'
{
  const 큰 = _r(`${OUT}/검수판-2026-10-05-외5.html`, 'utf8')
  const i = 큰.indexOf('<article'), j = 큰.indexOf('</article>') + 10
  // 첫 카드를 통째로 들어내 «편 수만» 줄인다 — 제목은 그대로 둔다
  _w(`${OUT}/_밀림시험.html`, 큰.slice(0, i) + 큰.slice(j))
}
await p.goto(`file://${OUT}/_밀림시험.html`)
const 샌 = []
for (const art of await p.locator('article').all()) {
  const t = (await art.locator('h2').textContent()).trim()
  const v = await art.locator('.judge input.note').inputValue()
  const c = await art.locator('.judge input.ck').nth(1).isChecked()
  if ((v || c) && t !== 이름.trim()) 샌.push(`${t} ← "${v}"${c ? ' ＋체크' : ''}`)
}
봐(샌.length === 0, `다른 판을 열어도 «엉뚱한 편»에 안 붙는다${샌.length ? ' — 샜다: ' + 샌.join(' / ') : ''}`)

// 복사 버튼
await p.goto(큰판)
await p.locator('#copy').click()
const 글 = await p.locator('#out').inputValue()
봐(글.includes(이름.trim()) && 글.includes('여기에 적은 것'), '「결과 복사」가 그 편 이름과 글을 담는다')
봐(errs.length === 0, `pageerror 0${errs.length ? ' — ' + errs.join(' / ') : ''}`)

await b.close()
console.log(실패 ? `\n⛔ ${실패}칸 실패` : '\n✅ 검수판 저장 검사 통과 — 판이 바뀌어도 «제 자리»에 남는다')
process.exit(실패 ? 1 : 0)
