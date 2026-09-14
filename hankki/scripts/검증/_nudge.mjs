// 넛지 2종 재현 검증 — 백업 유도(홈 5개 문턱·닫기·백업하면 안 뜸) + 리뷰 요청(3번째·한 번만)
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const BASE = 'http://127.0.0.1:4201/'
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4201', '--strictPort'], { stdio: 'ignore' })
for (let i = 0; i < 90; i++) { try { const r = await fetch(BASE); if (r.status < 500) break } catch { /* 대기 */ } await new Promise((r) => setTimeout(r, 400)) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const errs = []
const newPage = async (seed) => {
  const ctx = await b.newContext({ viewport: { width: 430, height: 940 }, deviceScaleFactor: 1 })
  await ctx.addInitScript(([s]) => {
    ;['hankki:onboarded', 'hankki:coach:home2', 'hankki:coach:detail', 'hankki:coach:myrecipes',
      'hankki:coach:profile', 'hankki:coach:brag', 'hankki:coach:shop', 'hankki:coach:editor', 'hankki:coach:decor']
      .forEach((k) => { try { localStorage.setItem(k, '1') } catch { /* noop */ } })
    Object.entries(s || {}).forEach(([k, v]) => { try { localStorage.setItem(k, v) } catch { /* noop */ } })
  }, [seed || {}])
  const p = await ctx.newPage()
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(BASE, { waitUntil: 'domcontentloaded' })
  await p.waitForTimeout(1800)
  return p
}
const seeNudge = (p) => p.getByText('레시피').filter({ hasText: '개가 쌓였어요' }).first().isVisible().catch(() => false)

console.log('── ① 백업 유도 ──')
let p = await newPage()
const n = await p.evaluate(() => { try { return (JSON.parse(localStorage.getItem('hankki:v1') || '{}').recipes || []).length } catch { return -1 } })
console.log(`  기본 레시피 ${n}개 (5개 문턱을 넘어야 뜬다)`)
console.log(`  안내 보임 = ${await seeNudge(p)}`)
await p.getByLabel('닫기').first().click().catch(() => {})
await p.waitForTimeout(400)
console.log(`  닫은 직후 사라짐 = ${!(await seeNudge(p))}`)
const flag = await p.evaluate(() => localStorage.getItem('hankki:nudge:backup'))
console.log(`  기억된 문턱 = ${flag}`)
await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1500)
console.log(`  새로고침해도 안 뜸 = ${!(await seeNudge(p))}`)
await p.context().close()

console.log('\n── ② 이미 백업한 사람에겐 안 뜬다 ──')
p = await newPage({ 'hankki:nudge:backup': '15' })
console.log(`  안내 보임 = ${await seeNudge(p)} (false 여야 정상)`)
await p.context().close()

console.log('\n── ③ 안내 누르면 설정 백업 시트가 바로 열린다 ──')
p = await newPage()
await p.getByText('개가 쌓였어요').first().click()
await p.waitForTimeout(1200)
console.log(`  백업 시트 열림 = ${await p.getByText('백업 · 내보내기').first().isVisible().catch(() => false)}`)
console.log(`  쪽지 지워짐 = ${(await p.evaluate(() => localStorage.getItem('hankki:nudge:openBackup'))) === null}`)
await p.context().close()

console.log('\n── ④ 리뷰 요청: 요리 기록 3번째에 한 번만 ──')
p = await newPage()
for (let k = 1; k <= 4; k++) {
  // 기록을 하루씩 앞으로 밀어 넣어 '오늘 이미 기록' 합치기를 피한다
  await p.evaluate((i) => {
    const S = 'hankki:v1'
    const d = JSON.parse(localStorage.getItem(S) || '{}')
    d.diary = d.diary || []
    d.diary.unshift({ id: 'sim' + i, recipeId: (d.recipes || [])[0]?.id, title: '테스트', source: 'hankki', at: Date.now() - i * 864e5, rating: 0, note: '', photo: null })
    localStorage.setItem(S, JSON.stringify(d))
  }, k)
}
await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1500)
const diaryN = await p.evaluate(() => { try { return (JSON.parse(localStorage.getItem('hankki:v1') || '{}').diary || []).length } catch { return -1 } })
console.log(`  기록 ${diaryN}개 심음 → 3번째는 이미 지났으니 안 떠야 한다`)
const askedFlag0 = await p.evaluate(() => localStorage.getItem('hankki:nudge:review'))
console.log(`  '물어봤음' 기억 = ${askedFlag0} (null 이어야 아직 안 물음)`)
await p.context().close()

// 기록 2개 상태에서 실제로 '만들었어요'를 눌러 3번째를 만든다
// ⚠️ 상세 진입은 스모크와 같은 길로 — 홈의 최근저장 카드(.grid-card)를 누른다.
//    레시피 탭에서 열려고 하면 팁 문구("레시피에서 '만들었어요'를 누르면…")가 버튼으로 잡혀 헛클릭이 난다.
console.log('\n── ⑤ 기록 2개 → 실제로 만들었어요 → 3번째에 뜬다 ──')
p = await newPage()
await p.evaluate(() => {
  const S = 'hankki:v1'
  const d = JSON.parse(localStorage.getItem(S) || '{}')
  const rid = (d.recipes || [])[0]?.id
  d.diary = [1, 2].map((i) => ({ id: 'seed' + i, recipeId: rid, title: '테스트', source: 'hankki', at: Date.now() - i * 864e5, rating: 0, note: '', photo: null }))
  localStorage.setItem(S, JSON.stringify(d))
})
await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1600)
await p.locator('.grid-card button, .grid2 button').first().click()
await p.waitForTimeout(1100)
const cookBtn = p.getByRole('button', { name: '만들었어요', exact: true }).first()
console.log(`  상세 진입·'만들었어요' 보임 = ${await cookBtn.isVisible().catch(() => false)}`)
await cookBtn.click()
await p.waitForTimeout(1200)
const grew = await p.evaluate(() => (JSON.parse(localStorage.getItem('hankki:v1') || '{}').diary || []).length)
console.log(`  기록 2 → ${grew}개 (3이어야 정상)`)
// 기록 시트가 먼저 뜬다 → 그 시트를 닫으면 리뷰 요청
await p.locator('.sheet button', { hasText: '닫기' }).first().click().catch(() => {})
await p.waitForTimeout(900)
console.log(`  리뷰 요청 뜸 = ${(await p.evaluate(() => document.body.innerText)).includes('한끼가 도움이 됐다면')}`)
await p.locator('.sheet button', { hasText: '나중에' }).first().click().catch(() => {})
await p.waitForTimeout(500)
console.log(`  '물어봤음' 기억 = ${await p.evaluate(() => localStorage.getItem('hankki:nudge:review'))} ('1' 이어야 다시 안 물음)`)
await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1400)
console.log(`  새로고침 후에도 안 뜸 = ${!(await p.evaluate(() => document.body.innerText)).includes('한끼가 도움이 됐다면')}`)
await p.context().close()

console.log(`\npageerror = ${errs.length}`, errs.slice(0, 3))
await b.close(); srv.kill()
