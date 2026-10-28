// 📸 설정 상단이 지저분하다(창업자 10/4) → 상점 자리 두 갈래 비교
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const OUT = '/tmp/claude-0/-home-user-hankki/80070571-2b0b-555b-9e75-fec80b60b45e/scratchpad'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body) })
await new Promise((r) => srv.listen(4394, r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const SVG = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5V19a1.5 1.5 0 001.5 1.5h13A1.5 1.5 0 0020 19V9.5"/><path d="M3 9.5l1.6-5h14.8l1.6 5"/><path d="M3 9.5a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0"/><path d="M10 20.5v-5h4v5"/></svg>`
for (const 갈래 of ['1-목록한줄', '2-열쇠누르면상점']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Seoul', deviceScaleFactor: 2 })
  const p = await ctx.newPage()
  await p.addInitScript(SEED_COACH_SEEN)
  await p.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') })
  await p.goto('http://127.0.0.1:4394/hankki/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1200)
  await p.click('button[aria-label="설정"]'); await p.waitForTimeout(1200)
  await p.evaluate(([g, svg]) => {
    if (g.startsWith('1')) {
      // 「자주 여는 것」 첫 줄로 — 상단은 그대로
      const h = [...document.querySelectorAll('*')].find((e) => e.childElementCount === 0 && e.textContent.trim() === '내 것 지키기')
      h?.insertAdjacentHTML('beforebegin', `<div style="display:flex;align-items:center;gap:12px;background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:14px 16px;margin:0 0 18px">
        <span style="width:40px;height:40px;border-radius:12px;background:var(--cream);color:var(--brown);display:flex;align-items:center;justify-content:center">${svg}</span>
        <div style="flex:1"><div style="font-weight:800;font-size:16.5px">한끼상점</div><div style="color:var(--text-sub);font-size:13.5px;margin-top:2px">레시피열쇠 · 레꾸팩</div></div>
        <span style="color:var(--text-sub);font-size:20px">›</span></div>`)
    } else {
      // 열쇠 배지 자체를 누르면 상점 — 숫자 밑에 아주 작은 「상점 ›」
      const k = document.querySelector('.imp-key-now'); k?.insertAdjacentHTML('afterend', `<div style="text-align:center;font-size:12.5px;font-weight:800;color:var(--brown);margin-top:2px">한끼상점 ›</div>`)
    }
  }, [갈래, SVG])
  await p.screenshot({ path: join(OUT, '상점자리-' + 갈래 + '.png'), clip: { x: 0, y: 0, width: 390, height: 520 } })
  await ctx.close()
}
await b.close(); srv.close()
