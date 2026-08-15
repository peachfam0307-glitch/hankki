// 🖼 패드 가로 탭 실물 — 창업자 2026-08-09 *"레시피화면도(레꾸자랑 홈이랑) 패드"*
//    ⭐ v10.20 이 배포된 «지금 그대로». 카드 열 수를 고친 결과를 눈으로 본다.
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R = '/home/user/hankki/hankki/', D = join(R, 'dist')
const OUT = join(R, 'docs/검수-2026-08-09-가로2단')
mkdirSync(OUT, { recursive: true })
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = M[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(D, p)) } catch { b = readFileSync(join(D, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise(r => srv.listen(4429, r))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 1600, height: 900 }, timezoneId: 'Asia/Seoul', locale: 'ko-KR', deviceScaleFactor: 2 })
page.on('pageerror', e => console.log('   ⛔ pageerror', e.message))
await page.addInitScript(() => { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1'); const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) } })
await page.goto('http://127.0.0.1:4429/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1300)
const 재기 = () => {
  const g = document.querySelector('.grid2, .grid3')
  if (!g) return { 열: 0 }
  const 열 = getComputedStyle(g).gridTemplateColumns.split(' ').filter(Boolean).length
  const c = g.children[0]
  const 보임 = [...g.children].filter((x) => { const r = x.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight }).length
  return { 열, 칸: c ? Math.round(c.getBoundingClientRect().width) : 0, 화면에보임: 보임, 전체: g.children.length }
}
for (const [이름, 가기] of [
  ['패드탭-홈', async () => {}],
  ['패드탭-레시피', async () => { await page.getByText('레시피', { exact: true }).last().click() }],
  ['패드탭-레꾸자랑', async () => { await page.getByText('레꾸자랑', { exact: true }).last().click() }],
]) {
  await 가기(); await page.waitForTimeout(1300)
  console.log(`   ${이름} ${JSON.stringify(await page.evaluate(재기))}`)
  await page.screenshot({ path: join(OUT, `${이름}.png`) })
}
await page.close(); await b.close(); srv.close()
console.log(`\n✅ 패드 탭 세 장 → ${OUT}`)
