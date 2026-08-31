// 🖼 남은 25컷에 «같은 글»을 얹어 본다 — 창업자 2026-08-07 *"여기서 네가 더 뺄거 있으면 말해줘."*
//   ⛔ 그림만 보고 고르지 않는다. 글 상자는 «글이 얹힌 모습»이 전부다 —
//      글 자리가 좁거나 장식이 글을 방해하는 컷은 그림만 보면 안 보인다(규칙 15).
//   ⭐ 다섯 컷씩 다섯 판 — 한 판이 폰 폭을 다 쓰니 컷이 크게 보인다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/남은25'
mkdirSync(OUT, { recursive: true })
const DIST = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4435, r))
const { BASICS_VERSION } = await import('/home/user/hankki/hankki/src/data/basics.js')
const KEEP = JSON.parse(readFileSync('/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/keep.json', 'utf8')).keep

// 번호는 «남은 25컷» 기준으로 1~25 를 새로 매긴다(창업자가 다시 짚기 쉽게)
const SENT = '오늘 김치찌개\n국물이 진해'
const POS = [[0.27, 0.18], [0.73, 0.18], [0.27, 0.5], [0.73, 0.5], [0.5, 0.82]]

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
for (let p = 0; p < 5; p++) {
  const group = KEEP.slice(p * 5, p * 5 + 5)
  const decor = group.map((art, i) => ({
    id: `b${i}`, type: 'note', art, text: SENT, font: 'gaegu',
    x: POS[i][0], y: POS[i][1], s: 0.38, r: 0,
  }))
  const page = await (await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 3 })).newPage()
  page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
  await page.addInitScript((s) => {
    localStorage.clear()
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1')
    for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
  }, { recipes: [], seedV: BASICS_VERSION, diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor }] })
  await page.goto('http://127.0.0.1:4435/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1300)
  await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(450)
  await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(450)
  await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(800)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1400)
  await page.mouse.click(8, 300); await page.waitForTimeout(400)
  // 컷마다 «따로» 잘라 낸다 — 한 장에 다섯을 담으면 폰에서 또 작아진다
  for (let i = 0; i < group.length; i++) {
    const el = page.locator('.decor-stage [style*="rotate"]').nth(i)
    const box = await el.boundingBox()
    if (!box) { console.log('   ⛔ 못 찾음', group[i]); continue }
    const M = 6
    writeFileSync(join(OUT, `${String(p * 5 + i + 1).padStart(2, '0')}-${group[i]}.png`), await page.screenshot({
      clip: { x: Math.max(0, box.x - M), y: Math.max(0, box.y - M), width: box.width + M * 2, height: box.height + M * 2 },
    }))
  }
  console.log(`  📸 ${p + 1}판 — ${group.join(' ')}`)
  await page.context().close()
}
console.log(errs.length ? `\n⛔ pageerror ${errs.length}건 — ${errs[0]}` : '\n✅ pageerror 0')
await b.close(); srv.close()
console.log('📁', OUT)
