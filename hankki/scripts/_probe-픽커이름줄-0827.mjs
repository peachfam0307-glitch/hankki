/**
 * 🔠 픽커 이름표가 «어떻게 줄바꿈되나» — 실측 (2026-08-27)
 *
 * 📮 창업자 = *"우리가 글자크기 키우면서 아이콘 글자도 커졌나봐. 글자가 줄이 이상해.
 *    (특히 긴 이름들은 두줄로 이상하게 잘리거든?) 확인해줘 같이"*
 *
 * ⭐⭐ **재는 것 = 「글자가 «어디서» 끊기나」다. 「몇 px 인가」가 아니다.**
 *    `Range` 로 한 글자씩 자리를 읽어 **줄마다 실제로 그려진 글자**를 뽑는다.
 *    그래야 「두 줄로 이상하게 잘린다」가 무슨 뜻인지 눈이 아니라 값으로 나온다.
 *
 * ⛔ 소스를 읽지 않는다 — **앱을 띄워 화면에 그려진 것**을 잰다(절대원칙 30).
 *
 * 🔢 갈래 넷으로 나눠 센다
 *    ⑴ 한 줄에 들어간다              = 멀쩡
 *    ⑵ 두 줄인데 «띄어쓰기»에서 끊김 = 멀쩡
 *    ⑶ 두 줄인데 «낱말 가운데»서 끊김 = ⚠️ 「이상하게 잘린다」
 *    ⑷ 세 줄 이상 → line-clamp 2 에 «잘려서 안 보인다» / 가로로 넘쳐 잘린다 = ⛔
 *
 * 실행: cd /home/user/hankki/hankki && node scripts/_probe-픽커이름줄-0827.mjs
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
const PORT = Number(process.env.PORT || 4419)
await new Promise((r) => srv.listen(PORT, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

const 폭들 = (process.env.W || '390,360,320').split(',').map(Number)
const 결과 = {}

for (const W of 폭들) {
  const ctx = await b.newContext({ viewport: { width: W, height: 844 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch { /* noop */ } })
  const page = await ctx.newPage()
  await page.goto(`http://127.0.0.1:${PORT}/hankki/`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(700)

  // 레시피 탭 → 첫 편 → 표지 눌러 아이콘 시트
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
  const 시트열렸나 = () => page.evaluate(() => !!document.querySelector('.ficon-grid'))
  if (!await 시트열렸나()) {
    await page.evaluate(() => document.querySelector('[data-coach="thumb"], .detail-thumb, .rd-thumb')?.click())
    await page.waitForTimeout(500)
  }
  if (!await 시트열렸나()) {
    await page.evaluate(() => {
      const t = [...document.querySelectorAll('button, [role="button"]')].find((x) => /표지|아이콘/.test(x.getAttribute('aria-label') || ''))
      t?.click()
    })
    await page.waitForTimeout(500)
  }
  if (!await 시트열렸나()) { console.log(`⛔ ${W}px — 아이콘 시트를 못 열었다`); await ctx.close(); continue }

  // ⛔ 격자는 lazy 가 아니라 «다 그려져» 있다 — 그래도 굴려서 한 번 더 확인한다(규칙 18)
  await page.evaluate(async () => {
    const sc = document.querySelector('.emoji-sheet') || document.scrollingElement
    for (let y = 0; y < sc.scrollHeight; y += 600) { sc.scrollTop = y; await new Promise((r) => setTimeout(r, 30)) }
    sc.scrollTop = 0
  })
  await page.waitForTimeout(400)

  결과[W] = await page.evaluate(() => {
    const out = []
    for (const el of document.querySelectorAll('.ficon-name')) {
      const tn = el.firstChild
      if (!tn || tn.nodeType !== 3 || !tn.data) continue
      const cs = getComputedStyle(el)
      const box = el.getBoundingClientRect()
      const r = document.createRange()
      const 줄 = []
      let cur = null
      for (let i = 0; i < tn.data.length; i++) {
        r.setStart(tn, i); r.setEnd(tn, i + 1)
        const rect = r.getClientRects()[0]
        if (!rect) continue
        const top = Math.round(rect.top)
        if (!cur || Math.abs(cur.top - top) > 2) { cur = { top, s: '', l: rect.left, rt: rect.right }; 줄.push(cur) }
        cur.s += tn.data[i]
        cur.rt = Math.max(cur.rt, rect.right)
        cur.l = Math.min(cur.l, rect.left)
      }
      out.push({
        글: tn.data,
        크기: parseFloat(cs.fontSize),
        줄높이: parseFloat(cs.lineHeight),
        칸폭: Math.round(box.width),
        보이는키: Math.round(el.clientHeight),
        속키: Math.round(el.scrollHeight),
        가로넘침: Math.round(el.scrollWidth - el.clientWidth),
        줄들: 줄.map((x) => ({ s: x.s, w: Math.round(x.rt - x.l) })),
      })
    }
    return out
  })
  await ctx.close()
}
await b.close(); srv.close()

// ── 판정 ─────────────────────────────────────────────────────────────
const 자름 = (v) => v.줄들.length > 2 || v.속키 > v.보이는키 + 1
const 가로 = (v) => v.가로넘침 > 1 || v.줄들.some((l) => l.w > v.칸폭 + 1)
// 낱말 가운데서 끊겼나 = 앞줄이 띄어쓰기로 안 끝났다
const 가운데 = (v) => v.줄들.length >= 2 && v.줄들.slice(0, -1).some((l) => !/\s$/.test(l.s))

for (const W of Object.keys(결과)) {
  const v = 결과[W]
  if (!v?.length) continue
  const 한줄 = v.filter((x) => x.줄들.length === 1 && !가로(x))
  const 두줄띄 = v.filter((x) => x.줄들.length === 2 && !가운데(x) && !자름(x) && !가로(x))
  const 두줄가운데 = v.filter((x) => x.줄들.length === 2 && 가운데(x) && !자름(x) && !가로(x))
  const 잘림 = v.filter((x) => 자름(x))
  const 넘침 = v.filter((x) => 가로(x) && !자름(x))
  const 크기 = [...new Set(v.map((x) => x.크기))].join('·')
  const 칸 = [...new Set(v.map((x) => x.칸폭))].sort((a, b) => a - b)
  console.log(`\n📐 ${W}px — 이름표 ${v.length}개 · 글자 ${크기}px · 줄높이 ${v[0].줄높이}px · 칸 폭 ${칸[0]}~${칸[칸.length - 1]}px`)
  console.log(`   ⑴ 한 줄            ${String(한줄.length).padStart(4)}개`)
  console.log(`   ⑵ 두 줄(띄어쓰기)   ${String(두줄띄.length).padStart(4)}개`)
  console.log(`   ⑶ 두 줄(낱말 가운데) ${String(두줄가운데.length).padStart(4)}개  ⚠️`)
  console.log(`   ⑷ 세 줄 이상(잘림)  ${String(잘림.length).padStart(4)}개  ⛔`)
  console.log(`   ⑸ 가로로 넘침       ${String(넘침.length).padStart(4)}개  ⛔`)
  const 보이기 = (t, arr, n = 12) => {
    if (!arr.length) return
    console.log(`   ${t}`)
    for (const x of arr.slice(0, n)) console.log(`      ${x.글}  →  ${x.줄들.map((l) => `「${l.s}」`).join(' / ')}`)
    if (arr.length > n) console.log(`      … ＋${arr.length - n}개`)
  }
  보이기('⛔ 잘려서 «안 보이는» 것', 잘림, 20)
  보이기('⛔ 가로로 넘쳐 잘린 것', 넘침, 20)
  보이기('⚠️ 낱말 가운데서 끊긴 것', 두줄가운데, 12)
}
