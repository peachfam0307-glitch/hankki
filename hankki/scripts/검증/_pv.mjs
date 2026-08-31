// 미리보기 시트 실제 렌더 확인 — 항목 4개·태그·유니코드 이모지 0
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const BASE = 'http://127.0.0.1:4199/'
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4199', '--strictPort'], { stdio: 'ignore' })
for (let i = 0; i < 90; i++) { try { const r = await fetch(BASE); if (r.status < 500) break } catch { /* 대기 */ } await new Promise((r) => setTimeout(r, 400)) }
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 430, height: 940 }, deviceScaleFactor: 2 })
await ctx.addInitScript(() => { ['hankki:onboarded','hankki:coach:home2'].forEach((x)=>{ try{localStorage.setItem(x,'1')}catch{/* noop */} }) })
const p = await ctx.newPage()
const errs = []; p.on('pageerror', (e) => errs.push(String(e)))
await p.goto(BASE, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2000)
await p.getByText('곧 나올 기능 미리보기').click(); await p.waitForTimeout(800)
const rows = await p.evaluate(() => [...document.querySelectorAll('.sheet div')].map((d)=>d.innerText).filter((t)=>t && t.length<90))
const txt = await p.evaluate(() => document.querySelector('.sheet')?.innerText || '')
console.log('── 시트 내용 ──'); console.log(txt)
const emo = await p.evaluate(() => {
  const re = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{23E9}-\u{23FA}\u{1F000}-\u{1F0FF}]/u
  const w = document.createTreeWalker(document.querySelector('.sheet'), NodeFilter.SHOW_TEXT)
  const bad = []; let n
  while ((n = w.nextNode())) if (re.test(n.nodeValue)) bad.push(n.nodeValue.trim())
  return bad
})
console.log('유니코드 이모지:', emo.length ? emo : '0개 ✅')
console.log('빠진 말 확인 — 도장:', txt.includes('도장'), '· 컨페티:', txt.includes('컨페티'), '· 계절마다:', txt.includes('계절마다'))
console.log('pageerror =', errs.length, errs.slice(0,2))
await p.screenshot({ path: '/tmp/preview.png', clip: { x: 0, y: 300, width: 430, height: 620 } })
await b.close(); srv.kill()
