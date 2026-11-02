// 👁️ 오류 보내기를 붙인 뒤 «홈»과 «오류 울타리 화면»을 실제로 띄워 본다 (2026-11-02)
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const PORT = 4479, OUT = process.env.OUT || '/tmp/claude-0'
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 800))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const c = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await c.addInitScript(SEED_COACH_SEEN)
await c.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
const 보냄 = []; c.on('request', (r) => { if (r.url().includes('/error')) 보냄.push(r.url()) })
const p = await c.newPage(); const 에러 = []; p.on('pageerror', (e) => 에러.push(e.message))
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500)
await p.screenshot({ path: `${OUT}/눈-홈.png` })
// 일부러 오류를 던져 본다 — 켜짐=false 라 «아무것도 안 나가야» 한다
await p.evaluate(() => { setTimeout(() => { throw new Error('눈검사 일부러') }, 0); Promise.reject(new Error('눈검사 약속')) })
await p.waitForTimeout(800)
console.log(`pageerror ${에러.length}개(일부러 던진 것 포함) · /error 로 나간 요청 ${보냄.length}개 (꺼짐이면 0)`)
await b.close(); srv.kill()
process.exit(보냄.length ? 1 : 0)
