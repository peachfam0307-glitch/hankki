// 🔬 지난달 일기를 «진짜 날짜»로 — 10월 어느 날 글을 써서 저장 → 다시 열기 → 꾸미기·글쓰기 탭에 글이 남나 (2026-11-02)
//   시계를 옮기지 않는다(옮기면 착시일 수 있다). 이번 달 날짜로도 똑같이 해서 «견줘» 본다.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const PORT = 4483
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 800))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const 한판 = async (지난달, 날) => {
  const c = await b.newContext({ viewport: { width: 390, height: 844 } })
  await c.addInitScript(SEED_COACH_SEEN)
  await c.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
  const p = await c.newPage(); p.setDefaultTimeout(6000)
  const 닫기 = async () => { for (const g of ['나중에 볼게요', '닫기']) { const t = p.getByRole('button', { name: g }).first(); if (await t.count()) await t.click().catch(() => {}) } }
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1000); await 닫기()
  const 그날열기 = async () => {
    await p.locator('.bottom-nav .nav-item').filter({ hasText: '일기' }).first().click(); await p.waitForTimeout(900)
    if (지난달) { await p.getByRole('button', { name: '이전 달' }).first().click(); await p.waitForTimeout(500) }
    await p.locator('button.cal-day').filter({ has: p.locator('.cal-num', { hasText: new RegExp(`^${날}$`) }) }).first().click(); await p.waitForTimeout(1000)
  }
  await 그날열기()
  const 첫화면 = `/tmp/claude-0/일기-${지난달 ? '지난달' : '이번달'}-1.png`; await p.screenshot({ path: 첫화면 })
  // 꾸미기 → 글쓰기 → 종이에 쓰기 → 저장
  await p.getByRole('button', { name: /꾸미기/ }).first().click(); await p.waitForTimeout(1200); await 닫기()
  const 글탭 = p.locator('.seg').filter({ hasText: /^글쓰기$/ }).first(); if (await 글탭.count()) { await 글탭.click(); await p.waitForTimeout(500) }
  await p.mouse.click(195, 330); await p.waitForTimeout(500)   // 종이를 눌러야 글칸이 열린다
  const 칸 = p.locator('textarea:visible').first()
  const 칸있나 = await 칸.count()
  await p.screenshot({ path: `/tmp/claude-0/일기-${지난달 ? '지난달' : '이번달'}-글쓰기.png` })
  if (칸있나) { await 칸.click(); await 칸.fill('시험글-다시열기') }
  await p.getByRole('button', { name: /^저장$/ }).first().click().catch(() => {}); await p.waitForTimeout(1200); await 닫기()
  // 다시 열기
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' }); await p.waitForTimeout(900); await 닫기()
  await 그날열기()
  const 날짜화면글 = await p.getByText('시험글-다시열기').count()
  await p.getByRole('button', { name: /꾸미기/ }).first().click(); await p.waitForTimeout(1200); await 닫기()
  if (await 글탭.count()) { await 글탭.click(); await p.waitForTimeout(500) }
  const 에디터글 = await p.evaluate(() => [...document.querySelectorAll('textarea')].some((t) => t.value.includes('시험글-다시열기')))
  await p.screenshot({ path: `/tmp/claude-0/일기-${지난달 ? '지난달' : '이번달'}-2.png` })
  await p.getByRole('button', { name: /^취소$/ }).first().click().catch(() => {})
  console.log(`${지난달 ? '지난달' : '이번달'} ${날}일 — 글칸 ${칸있나} · 다시 연 날짜 화면에 글 ${날짜화면글} · 꾸미기/글쓰기 칸에 글 ${에디터글}`)
  await c.close()
  return 에디터글
}
const 이번 = await 한판(false, 1)
const 지난 = await 한판(true, 15)
await b.close(); srv.kill()
process.exit(이번 && 지난 ? 0 : 1)
