// 🔬 진짜 날짜 그대로 — 샘플 일기(11/1·사진·글 있음)를 «10월 15일»로 한 장 복사해 넣고 다시 연다 → 날짜 화면 · 꾸미기 글쓰기 탭 (2026-11-02)
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const PORT = 4485
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 800))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const c = await b.newContext({ viewport: { width: 390, height: 844 } })
await c.addInitScript(SEED_COACH_SEEN)
await c.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
const p = await c.newPage(); p.setDefaultTimeout(6000)
const 닫기 = async () => { for (const g of ['나중에 볼게요', '닫기']) { const t = p.getByRole('button', { name: g }).first(); if (await t.count()) await t.click().catch(() => {}) } }
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500); await 닫기()
const 넣음 = await p.evaluate(() => {
  const st = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const 샘 = (st.diary || []).find((d) => d.kind === 'diary')
  if (!샘) return '샘플 일기 없음'
  const at = new Date(2026, 9, 15, 12).getTime()
  st.diary.push({ ...샘, id: 'probe-oct15', at, sample: undefined })
  localStorage.setItem('hankki:v1', JSON.stringify(st))
  return `넣음 · 칸 ${Object.keys(샘).filter((k) => /^ph_|title|note/.test(k)).join(',')}`
})
console.log(넣음)
await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(1200); await 닫기()
await p.locator('.bottom-nav .nav-item').filter({ hasText: '일기' }).first().click(); await p.waitForTimeout(900)
await p.getByRole('button', { name: '이전 달' }).first().click(); await p.waitForTimeout(500)
await p.locator('button.cal-day').filter({ has: p.locator('.cal-num', { hasText: /^15$/ }) }).first().click(); await p.waitForTimeout(1000)
await p.screenshot({ path: '/tmp/claude-0/10월15-날짜.png' })
await p.getByRole('button', { name: /꾸미기/ }).first().click(); await p.waitForTimeout(1200); await 닫기()
const 글탭 = p.locator('.seg').filter({ hasText: /^글쓰기$/ }).first(); if (await 글탭.count()) { await 글탭.click(); await p.waitForTimeout(600) }
await p.screenshot({ path: '/tmp/claude-0/10월15-글쓰기.png' })
console.log('글쓰기 탭 사진 ✕', await p.getByRole('button', { name: '사진 지우기' }).count())
await p.getByRole('button', { name: /^취소$/ }).first().click().catch(() => {})
await b.close(); srv.kill()
