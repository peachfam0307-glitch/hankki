// 🍳 창업자 제보 2026-08-10 — *"내레시피중에 만드는법이 없으면 만들었어요도 없어.
//    예를들어 소스레시피만(만드는법 없음) 추가하면 꼬르곰(만들었어요) 버튼이 안뜨는거야."*
//  ⛔ 코드만 보면 버튼은 조건이 없다 — 말로 판단하지 말고 «만들어서» 본다(규칙 7).
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { SEED_COACH_SEEN } from '../src/coach.js'
const PORT = 4187
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '-d', 'dist'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 900))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const p = await (await b.newContext({ viewport: { width: 411, height: 891 }, timezoneId: 'Asia/Seoul' })).newPage()
const 결과 = []
const 칸 = (n, ok, v = '') => { 결과.push(`${ok ? '✅' : '⛔'} ${n}${v ? `  ${v}` : ''}`); return ok }
await p.addInitScript(SEED_COACH_SEEN)
await p.addInitScript(() => localStorage.setItem('hankki:onboarded', '1'))
await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' })
await p.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  raw.recipes = [
    // ⭐ 창업자가 말한 그것 — 소스 레시피, 만드는 법 «0줄»
    { id: 'my-sauce', title: '테스트 소스레시피', source: 'manual', createdAt: Date.now(),
      ingredients: ['진간장 3큰술', '식초 2큰술', '올리고당 1큰술'], steps: [] },
    // 견줄 것 — 만드는 법이 있는 레시피
    { id: 'my-full', title: '테스트 순서있음', source: 'manual', createdAt: Date.now() - 1000,
      ingredients: ['두부 1모', '진간장 2큰술'], steps: ['굽는다.', '조린다.', '올린다.'] },
    ...(raw.recipes || []),
  ]
  localStorage.setItem('hankki:v1', JSON.stringify(raw))
})
await p.reload({ waitUntil: 'networkidle' })
const 보기 = async (제목) => {
  await p.getByText(제목, { exact: true }).first().click()
  await p.waitForTimeout(600)
  const bar = p.locator('.action-bar')
  const 있나 = await bar.count() > 0
  const 글 = 있나 ? await bar.innerText() : '(액션바 자체가 없음)'
  const 만 = 있나 ? await bar.getByRole('button', { name: /만들었어요/ }).count() : 0
  const 요 = 있나 ? await bar.getByRole('button', { name: /요리 시작/ }).count() : 0
  await p.goBack(); await p.waitForTimeout(400)
  return { 있나, 글: 글.replace(/\n/g, ' · '), 만, 요 }
}
const a = await 보기('테스트 소스레시피')
const c = await 보기('테스트 순서있음')
칸('① 순서 있는 레시피 — 액션바', c.있나, c.글)
칸('② 순서 있는 레시피 — 「만들었어요」', c.만 === 1)
칸('③ 순서 «0줄» 레시피 — 액션바', a.있나, a.글)
칸('④ 순서 «0줄» 레시피 — 「만들었어요」', a.만 === 1, a.만 ? '' : '⛔ 창업자 제보 재현됨')
칸('⑤ 순서 0줄이면 「요리 시작」은 없어야', a.요 === 0)
console.log('\n' + 결과.join('\n'))
console.log(`\n${결과.filter((x) => x.startsWith('✅')).length}/${결과.length} 통과`)
await b.close(); srv.kill(); process.exit(결과.some((x) => x.startsWith('⛔')) ? 1 : 0)
