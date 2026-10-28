// 📏 탭마다 «상단바의 캐릭터»와 «제목 글자»가 화면 어디에 있나 — 비율로 잰다.
// 📮 창업자 2026-09-09 = "글자가 너무 다닥다닥붙어있어서 스티커에서 좀 떼어줘. 내가 글자위에 그냥 붙였거든"
// ⛔ 짐작으로 밀면 또 틀린다 — 글자의 «왼쪽 끝»을 재서, 스티커 오른쪽 끝이 그보다 왼쪽에 오게 한다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = new URL('../dist', import.meta.url).pathname
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.ico': 'image/x-icon' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/' || !extname(p)) p = '/index.html'
  try { const b = readFileSync(join(DIST, p)); s.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' }); s.end(b) }
  catch { s.writeHead(404); s.end() }
})
await new Promise((r) => srv.listen(0, r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 540, height: 960 } })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p = await ctx.newPage()
await p.goto(`http://127.0.0.1:${srv.address().port}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(2200)
for (const [이름, 누를것, 안에서] of [['레시피','레시피'],['일기','일기'],['장보기','장보기'],['냉장고','장보기','냉장고'],['레꾸자랑','레꾸자랑']]) {
  await p.evaluate((n) => [...document.querySelectorAll('button,[role="button"],a')].find((x) => (x.innerText||'').trim() === n)?.click(), 누를것)
  await p.waitForTimeout(1400)
  if (안에서) { await p.evaluate((n) => [...document.querySelectorAll('button,[role="button"]')].find((x) => (x.innerText||'').trim() === n)?.click(), 안에서); await p.waitForTimeout(1000) }
  const r = await p.evaluate(() => {
    const W = innerWidth, H = innerHeight
    // 맨 위 120px 안에서 «그림»과 «제목 글자»를 찾는다
    const 안 = (e) => { const b = e.getBoundingClientRect(); return b.top < 120 && b.height > 8 && b.width > 8 }
    const 그림 = [...document.querySelectorAll('img')].filter(안)
      .map((e) => e.getBoundingClientRect()).sort((a, b) => a.left - b.left)[0]
    const 글 = [...document.querySelectorAll('h1,h2,span,div,p')].filter((e) =>
      안(e) && e.children.length === 0 && (e.textContent || '').trim().length > 0)
      .map((e) => ({ t: e.textContent.trim().slice(0, 12), b: e.getBoundingClientRect() }))
      .sort((a, b) => a.b.left - b.b.left)[0]
    const 비 = (v, 축) => +(v / (축 === 'x' ? W : H)).toFixed(4)
    return {
      그림: 그림 ? { 왼: 비(그림.left, 'x'), 오른: 비(그림.right, 'x'), 위: 비(그림.top, 'y'), 아래: 비(그림.bottom, 'y') } : null,
      글자: 글 ? { 글: 글.t, 왼: 비(글.b.left, 'x'), 오른: 비(글.b.right, 'x'), 위: 비(글.b.top, 'y'), 아래: 비(글.b.bottom, 'y') } : null,
    }
  })
  console.log(이름, JSON.stringify(r, null, 0))
}
await b.close(); srv.close()
