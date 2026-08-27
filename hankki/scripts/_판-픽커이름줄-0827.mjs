/**
 * 🔠 픽커 이름표 줄바꿈 — «고치는 갈래마다 몇 개가 나아지나»를 잰다 (2026-08-27)
 *
 * 📮 창업자 = *"우리가 글자크기 키우면서 아이콘 글자도 커졌나봐. 글자가 줄이 이상해.
 *    (특히 긴 이름들은 두줄로 이상하게 잘리거든?) 확인해줘 같이"*
 *
 * ⭐⭐ **창업자 말이 맞았다** — v11.21 「글자2」가 `.ficon-name` 을 **13 → 15px** 로 키웠다.
 *    이름표 폭이 73px 이라 한 줄에 15px 이면 **4.8자**, 13px 이면 5.6자다. 한 자 차이가 크다.
 *
 * ⛔ 갈래를 «소스를 고쳐서» 재지 않는다 — 앱을 띄운 «그대로» CSS 만 얹어 재고 원복한다(절대원칙 30).
 *    그래서 이 판은 지금 배포된 앱에도 그대로 얹힌다.
 *
 * 실행: cd /home/user/hankki/hankki && node scripts/_판-픽커이름줄-0827.mjs
 */
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
const PORT = Number(process.env.PORT || 4421)
await new Promise((r) => srv.listen(PORT, r))

// 갈래 — 이름은 창업자에게 그대로 보여줄 말로
const 갈래 = [
  ['지금 그대로 (15px · 4열)', ''],
  ['ⓐ 이름표만 13px 로 되돌린다', '.ficon-name{font-size:13px}'],
  ['ⓑ 이름표 14px (글자2 최소선)', '.ficon-name{font-size:14px}'],
  ['ⓒ 4열 → 3열 (칸을 넓힌다)', '.ficon-grid{grid-template-columns:repeat(3,minmax(0,1fr))}'],
  ['ⓓ 긴 이름만 작게 (5자↑ 13px · 8자↑ 12px)', ''],   // JS 로 글자수 보고 준다
  ['ⓔ 세 줄까지 보여준다 (자르지만 않는다)', '.ficon-name{-webkit-line-clamp:3}'],
  // ⭐ 3열로 간 뒤 «되물어야 하는 것» — 칸이 넓어졌는데도 긴 이름을 줄일 이유가 남아 있나
  ['ⓧ 긴 이름 축소를 «끈다» (전부 15px)', '.ficon-name.mid,.ficon-name.long{font-size:15px}'],
  ['ⓨ 축소 문턱을 늦춘다 (8자↑만 13px)', '.ficon-name.mid{font-size:15px}.ficon-name.long{font-size:13px}'],
  ['ⓓ＋ⓔ 같이', '.ficon-name{-webkit-line-clamp:3}'],
]

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const 폭들 = (process.env.W || '390,360').split(',').map(Number)

for (const W of 폭들) {
  const ctx = await b.newContext({ viewport: { width: W, height: 844 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch { /* noop */ } })
  const page = await ctx.newPage()
  await page.goto(`http://127.0.0.1:${PORT}/hankki/`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(700)
  await page.evaluate(() => {
    const bs = [...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')]
    bs.find((x) => (x.innerText || '').replace(/\s+/g, '').includes('레시피'))?.click()
  })
  await page.waitForTimeout(600)
  await page.evaluate(() => {
    const t = [...document.querySelectorAll('button')].find((x) => /\S/.test(x.innerText || '') && x.querySelector('img, svg'))
    t?.click()
  })
  await page.waitForTimeout(800)
  // ⛔ 표지 여는 길이 화면마다 다르다 — 셋을 다 눌러 본다(2026-08-23 재현판과 같은 길)
  if (!await page.evaluate(() => !!document.querySelector('.ficon-grid'))) {
    await page.evaluate(() => document.querySelector('[data-coach="thumb"], .detail-thumb, .rd-thumb')?.click())
    await page.waitForTimeout(500)
  }
  if (!await page.evaluate(() => !!document.querySelector('.ficon-grid'))) {
    await page.evaluate(() => {
      const t = [...document.querySelectorAll('button, [role="button"]')].find((x) => /표지|아이콘/.test(x.getAttribute('aria-label') || ''))
      t?.click()
    })
    await page.waitForTimeout(600)
  }
  if (!await page.evaluate(() => !!document.querySelector('.ficon-grid'))) { console.log(`⛔ ${W}px — 시트를 못 열었다`); await ctx.close(); continue }

  console.log(`\n📐 ${W}px  (이름표 ${await page.evaluate(() => document.querySelectorAll('.ficon-name').length)}개)`)
  console.log('   갈래                                    한 줄  두줄(띄)  두줄(가운데)  ⛔잘림   칸 키')

  for (const [이름, css] of 갈래) {
    await page.evaluate(({ css, 이름 }) => {
      document.getElementById('_시험')?.remove()
      for (const el of document.querySelectorAll('.ficon-name')) el.style.fontSize = ''
      if (css) { const s = document.createElement('style'); s.id = '_시험'; s.textContent = css; document.head.appendChild(s) }
      if (이름.startsWith('ⓓ')) {
        for (const el of document.querySelectorAll('.ficon-name')) {
          const n = (el.textContent || '').length
          el.style.fontSize = n >= 8 ? '12px' : n >= 5 ? '13px' : ''
        }
      }
    }, { css, 이름 })
    await page.waitForTimeout(160)
    const r = await page.evaluate(() => {
      let 한 = 0, 띄 = 0, 가운데 = 0, 잘림 = 0
      let 키 = 0
      for (const el of document.querySelectorAll('.ficon-name')) {
        const tn = el.firstChild
        if (!tn || tn.nodeType !== 3 || !tn.data) continue
        const rg = document.createRange()
        const 줄 = []
        let cur = null
        for (let i = 0; i < tn.data.length; i++) {
          rg.setStart(tn, i); rg.setEnd(tn, i + 1)
          const rect = rg.getClientRects()[0]
          if (!rect) continue
          const top = Math.round(rect.top)
          if (!cur || Math.abs(cur.top - top) > 2) { cur = { top, s: '' }; 줄.push(cur) }
          cur.s += tn.data[i]
        }
        const 넘침 = el.scrollHeight > el.clientHeight + 1
        if (넘침) 잘림++
        else if (줄.length === 1) 한++
        else if (줄.slice(0, -1).every((l) => /\s$/.test(l.s))) 띄++
        else 가운데++
      }
      const c = document.querySelector('.ficon-cell')
      키 = c ? Math.round(c.getBoundingClientRect().height) : 0
      return { 한, 띄, 가운데, 잘림, 키 }
    })
    console.log(`   ${이름.padEnd(38)}${String(r.한).padStart(5)}${String(r.띄).padStart(9)}${String(r.가운데).padStart(13)}${String(r.잘림).padStart(8)}${String(r.키 + 'px').padStart(8)}`)
  }
  await ctx.close()
}
await b.close(); srv.close()
console.log('\n⚠️ 「두 줄(가운데)」 = 「김치볶음/밥」처럼 낱말 한가운데서 끊긴 것 — 창업자가 말한 «이상하게»')
console.log('⛔ 「잘림」 = 두 줄에 안 들어가 «뒷글자가 통째로 안 보이는» 것. 이게 제일 나쁘다')
