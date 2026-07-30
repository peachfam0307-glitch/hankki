// 온보딩 8장 렌더 검증 — 캐스트 소개 두 장(왜 만들었나 / 다섯 친구)이 제대로 뜨나
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const BASE = 'http://127.0.0.1:4207/'
const srv = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4207', '--strictPort'], { stdio: 'ignore' })
for (let i = 0; i < 90; i++) { try { const r = await fetch(BASE); if (r.status < 500) break } catch { /* 대기 */ } await new Promise((r) => setTimeout(r, 400)) }
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 430, height: 940 }, deviceScaleFactor: 3 })
const p = await ctx.newPage(); const errs = []
p.on('pageerror', (e) => errs.push(String(e)))
await p.goto(BASE, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2200)

const N = 8
// ⚠️ 캐러셀이 8장을 한 트랙에 다 렌더한다 — 화면 안에 든 것만 골라야 지금 장의 그림을 센다
const shots = { 5: '/tmp/ob_why.png', 6: '/tmp/ob_cast.png' }
for (let i = 0; i < N; i++) {
  const t = await p.evaluate(() => document.body.innerText.replace(/\n+/g, ' / ').slice(0, 78))
  console.log(`장${i + 1}: ${t}`)
  if (shots[i]) {
    const imgs = await p.evaluate(() => [...document.images]
      .filter((x) => { const r = x.getBoundingClientRect(); return r.width > 4 && r.left > -60 && r.left < window.innerWidth + 60 })
      .filter((x) => /lineup5|av_|gp_duoht/.test(x.currentSrc))
      .map((x) => ({
        n: x.currentSrc.split('/').pop().split('-')[0],
        src: `${x.naturalWidth}x${x.naturalHeight}`,
        shown: Math.round(x.getBoundingClientRect().height),
      })))
    imgs.forEach((c) => console.log(`      ${c.n} 소스 ${c.src} → 화면 ${c.shown}px (DPR3 → ${c.shown * 3} device px)`))
    await p.screenshot({ path: shots[i] })
  }
  const nx = p.getByRole('button', { name: /다음|시작하기/ }).first()
  if (!(await nx.isVisible().catch(() => false))) break
  if (i < N - 1) { await nx.click(); await p.waitForTimeout(800) }
}
// ⛔ UI 유니코드 이모지 금지 — 우리 스티커만 쓴다
const emo = await p.evaluate(() => {
  const re = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const bad = []; let n
  while ((n = w.nextNode())) if (re.test(n.nodeValue)) bad.push(n.nodeValue.trim())
  return bad
})
console.log('유니코드 이모지 =', emo.length ? emo : '0개 ✅')
console.log('pageerror =', errs.length, errs.slice(0, 2))
await b.close(); srv.kill()
