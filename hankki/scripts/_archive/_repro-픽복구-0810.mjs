// 🛒 레시피 상세의 「주부의 장바구니 픽」이 되살아났는지 실물로 확인한다.
//   ⛔ 2026-08-03 에 이 자리를 통째로 없앴다가 2026-08-10 창업자 정정으로 되살렸다.
//      창업자 원문은 「한살림 제품만」이었는데 내가 「픽 자리 통째로」로 넓게 읽었다.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { SEED_COACH_SEEN } from '../src/coach.js'
const PORT = 4185
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '-d', 'dist'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 900))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const p = await (await b.newContext({ viewport: { width: 411, height: 891 }, timezoneId: 'Asia/Seoul' })).newPage()
const 결과 = []
const 칸 = (이름, ok, 값 = '') => { 결과.push(`${ok ? '✅' : '⛔'} ${이름}${값 ? `  ${값}` : ''}`); return ok }
// ⭐ 코치 오버레이가 클릭을 가로챈다 → 접두어로 통째로 「본 것」 처리(이름을 심으면 키 올릴 때 낡는다)
await p.addInitScript(SEED_COACH_SEEN)
// 🧪 «유저가 직접 쓴» 레시피도 붙는지 본다 — 브랜드명 없이 재료 이름만 적었다
await p.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1')
})
await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' })
await p.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  raw.recipes = [{
    id: 'my-test-pick', title: '내가 쓴 두부조림', source: 'manual', createdAt: Date.now(),
    ingredients: ['두부 1모', '순두부 1팩', '진간장 2큰술', '맛술 1큰술', '굴소스 1큰술', '고춧가루 1큰술'],
    steps: ['두부를 굽는다.', '양념을 넣고 조린다.', '대파를 올린다.'],
  }, ...(raw.recipes || [])]
  localStorage.setItem('hankki:v1', JSON.stringify(raw))
})
await p.reload({ waitUntil: 'networkidle' })

// 검색으로 깻잎전을 연다 (창업자가 지목한 레시피)
// ⭐ 홈 「이번 주 제철」에 깻잎전이 그대로 있다 — 탭을 옮길 필요가 없다.
//   ⛔ 첫 판은 「레시피」 탭에서 `.grid-card` 로 찾다 «못 찾음»으로 나왔다. 앱이 아니라 «검사»가 틀렸다(규칙 18).
const card = p.getByText('깻잎전', { exact: true }).first()
칸('① 깻잎전을 찾았나', await card.count() > 0)
if (await card.count()) {
  await card.click(); await p.waitForTimeout(700)
  const pick = p.locator('[data-coach="pantry"]')
  const 있나 = await pick.count() > 0
  칸('② 픽 카드가 뜨나', 있나)
  if (있나) {
    const names = await pick.locator('div > span:first-child').allInnerTexts()
    const 사러 = await pick.getByRole('button', { name: '사러가기' }).count()
    const 다담기 = await pick.getByRole('button', { name: /다 담기/ }).count()
    칸('③ 제품이 붙었나', 사러 >= 1, `사러가기 ${사러}개 · ${names.slice(0, 4).join(' / ')}`)
    칸('④ 「이 재료 다 담기」가 있나', 다담기 === 1)
    const txt = await pick.innerText()
    칸('⑤ 유니코드 이모지가 없나', !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(txt))
    await p.screenshot({ path: '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/픽-깻잎전.png', fullPage: false })
  }
}
// 한살림 제품(순두부)이 붙는 레시피에서 「조합원만」 배지가 뜨나
await p.goBack(); await p.waitForTimeout(400)
const 순 = p.locator('.grid-card', { hasText: '순두부' }).first()
if (await 순.count()) {
  await 순.click(); await p.waitForTimeout(700)
  const t = await p.locator('[data-coach="pantry"]').innerText().catch(() => '')
  칸('⑥ 한살림엔 「조합원만」 배지', /조합원만/.test(t), t.split('\n').slice(0, 3).join(' / '))
}
// ⭐⭐ 창업자 물음 2026-08-10 — *"모든레시피(우리기본)+유저가 추가한 것 다 되는거지?"*
//   기본은 재료에 브랜드명이 «그대로» 있어 direct 로 붙고,
//   유저 레시피는 브랜드를 안 적어도 `matches`(진간장·맛술·굴소스·고춧가루…)로 붙어야 한다.
await p.goBack(); await p.waitForTimeout(400)
const 내것 = p.getByText('내가 쓴 두부조림', { exact: true }).first()
if (await 내것.count()) {
  await 내것.click(); await p.waitForTimeout(700)
  const t = await p.locator('[data-coach="pantry"]').innerText().catch(() => '')
  칸('⑦ 유저가 쓴 레시피에도 붙나', /사러가기/.test(t), t.split('\n').filter((x) => x && x !== '사러가기').slice(0, 5).join(' / '))
} else 칸('⑦ 유저 레시피를 못 찾음', false)

const err = []
p.on('pageerror', (e) => err.push(String(e)))
칸('⑧ pageerror 0', err.length === 0)
console.log('\n' + 결과.join('\n'))
console.log(`\n${결과.filter((x) => x.startsWith('✅')).length}/${결과.length} 통과`)
await b.close(); srv.kill(); process.exit(결과.some((x) => x.startsWith('⛔')) ? 1 : 0)
