// 온보딩 슬라이드 렌더 확인 — 이모지 뺀 자리가 실제로 어떻게 보이는지
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const BASE = 'http://127.0.0.1:4196/'
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4196', '--strictPort'], { stdio: 'ignore' })
for (let i = 0; i < 90; i++) { try { const r = await fetch(BASE); if (r.status < 500) break } catch { /* 대기 */ } await new Promise((r) => setTimeout(r, 400)) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 430, height: 940 }, deviceScaleFactor: 2 })
const p = await ctx.newPage()
const errs = []
p.on('pageerror', (e) => errs.push(String(e)))
await p.goto(BASE, { waitUntil: 'domcontentloaded' })   // onboarded 키를 안 심어야 온보딩이 뜬다
await p.waitForTimeout(2600)
for (let i = 1; i <= 8; i++) {
  await p.screenshot({ path: `../../_ob${i}.png` })
  const next = p.getByRole('button', { name: /다음|시작/ }).first()
  if (!(await next.count())) break
  await next.click(); await p.waitForTimeout(900)
}
// 유니코드 이모지가 화면 글자에 남아 있는지 최종 확인
const leftover = await p.evaluate(() => {
  const re = /[\u{1F000}-\u{1FAFF}]/u
  return [...document.querySelectorAll('*')].filter((n) => [...n.childNodes]
    .some((c) => c.nodeType === 3 && re.test(c.textContent))).map((n) => n.textContent.slice(0, 40)).slice(0, 8)
})
console.log('화면에 남은 이모지:', leftover.length ? leftover : '없음')
console.log('pageerror:', errs.length, errs.slice(0, 3))
await b.close(); srv.kill()
