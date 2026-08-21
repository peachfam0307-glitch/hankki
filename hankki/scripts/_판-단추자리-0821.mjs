// 🔘📸 「단추 자리」 갈래 둘을 «나란히» 찍는다 — 창업자 판정용 (2026-08-21)
//
// 📮 창업자 = 다른 앱 로그인 창 캡처(*"다른사이트로그인창"*) → 그 앱은 **단추가 화면 아래**에 붙어 있다
//    → 내가 말로 «가운데 vs 아래»를 물었더니 *"단추자리??"* · *"B는 안보이는데"*
//    ⛔⛔ **말로 물은 게 잘못이다** — 자리는 «보여야» 고른다(절대원칙 21 · 「직관은 설명이 아니라 모양으로」).
//
// ⛔ 소스를 고쳐서 찍지 않는다 — 아직 «고르기 전»이다. 브라우저에서 자리만 바꿔 찍는다.
import { chromium } from 'playwright'
import http from 'node:http'
import { readFileSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { SEED_COACH_SEEN } from '../src/coach.js'

const ROOT = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json' }
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p.startsWith('/hankki/')) p = p.slice(7)
  const f = join(ROOT, p === '/' ? 'index.html' : p)
  try { statSync(f); res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)) }
  catch { res.writeHead(404); res.end('nope') }
})
await new Promise((r) => srv.listen(4607, r))
const b = await chromium.launch()

async function 찍기 (아래로, 낼곳) {
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await ctx.route('**/*.googleapis.com/**', (r) => r.abort())
  await ctx.route('**/*.gstatic.com/**', (r) => r.abort())
  const pg = await ctx.newPage()
  await pg.addInitScript(SEED_COACH_SEEN)
  await pg.goto('http://localhost:4607/hankki/', { waitUntil: 'domcontentloaded' })
  await pg.waitForTimeout(1600)
  if (아래로) {
    // ⭐ 첫 화면 상자를 «아래로 몰고» 곰펭을 키운다 — 창업자가 준 앱과 같은 짜임
    await pg.evaluate(() => {
      const box = [...document.querySelectorAll('div')].find((d) => d.style && d.style.zIndex === '210')
      if (!box) throw new Error('첫 화면을 못 찾았다')
      box.style.setProperty('justify-content', 'flex-end', 'important')
      const img = box.querySelector('img')
      if (img) { img.style.setProperty('width', '210px', 'important'); img.style.setProperty('margin', 'auto auto 34px', 'important') }
    })
    await pg.waitForTimeout(250)
  }
  await pg.screenshot({ path: 낼곳 })
  await ctx.close()
}

await 찍기(false, '/tmp/자리A-가운데.png')
await 찍기(true, '/tmp/자리B-아래.png')

// 🖼 둘을 «한 장»으로 — 폰에서 갈아 보지 말고 «한눈에» 대게 한다
{
  const ctx = await b.newContext({ viewport: { width: 900, height: 1080 }, deviceScaleFactor: 2 })
  const pg = await ctx.newPage()
  const b64 = (p) => 'data:image/png;base64,' + readFileSync(p).toString('base64')
  await pg.setContent(`<html><body style="margin:0;background:#f2efe9;font-family:sans-serif">
    <div style="display:flex;gap:26px;padding:22px">
      ${[['ⓐ 지금 — 가운데', '자리A-가운데'], ['ⓑ 아래 — 네가 준 앱처럼', '자리B-아래']].map(([t, f]) => `
        <div style="flex:1">
          <div style="font-size:21px;font-weight:800;color:#3b3733;margin:0 0 12px 2px">${t}</div>
          <img src="${b64('/tmp/' + f + '.png')}" style="width:100%;display:block;border-radius:14px;border:1px solid #d8d2c8">
        </div>`).join('')}
    </div></body></html>`)
  await pg.waitForTimeout(400)
  await pg.screenshot({ path: '/tmp/단추자리-둘.png', fullPage: true })
  await ctx.close()
}

console.log('✅ 단추 자리 둘 — /tmp/단추자리-둘.png')
await b.close(); srv.close()
