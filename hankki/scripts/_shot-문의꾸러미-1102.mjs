// 👁️ 「도움말 및 문의」 메일 본문에 꾸러미가 붙나 + 그림 못 불러옴·저장 실패가 «꺼짐» 동안 안 나가나 (2026-11-02)
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const PORT = 4481
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 800))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const c = await b.newContext({ viewport: { width: 390, height: 844 } })
await c.addInitScript(SEED_COACH_SEEN)
await c.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
  window.__메일 = []; const 원 = HTMLAnchorElement.prototype.click
  HTMLAnchorElement.prototype.click = function () { if (this.href.startsWith('mailto:')) { window.__메일.push(this.href); return } return 원.call(this) }
})
const 보냄 = []; c.on('request', (r) => { if (r.url().includes('/error')) 보냄.push(r.url()) })
const p = await c.newPage()
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200)
await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click(); await p.waitForTimeout(600)
await p.goto(`http://127.0.0.1:${PORT}/#profile`).catch(() => {})
await p.getByRole('button', { name: /설정|프로필/ }).first().click().catch(() => {}); await p.waitForTimeout(800)
await p.getByText('도움말 및 문의').first().click(); await p.waitForTimeout(400)
const 메일 = await p.evaluate(() => window.__메일)
const 본문 = 메일[0] ? decodeURIComponent(메일[0].split('body=')[1] || '') : ''
console.log('── 메일 본문 ──\n' + 본문)
// 그림 못 불러옴 · 저장 실패 신호 — 꺼짐이라 안 나가야 한다
await p.evaluate(() => { const i = new Image(); i.src = './assets/없는그림.png'; document.body.appendChild(i); window.dispatchEvent(new CustomEvent('hankki:storagefull')) })
await p.waitForTimeout(800)
const ok = 본문.includes('판 v') && 본문.includes('직전:') && 보냄.length === 0
console.log(`/error 요청 ${보냄.length}개(꺼짐이면 0) · ${ok ? '✅' : '⛔'}`)
await b.close(); srv.kill(); process.exit(ok ? 0 : 1)
