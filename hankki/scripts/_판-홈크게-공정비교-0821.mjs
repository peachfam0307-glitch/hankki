// ⚖️ [2026-08-21] 「3칸 ↔ 2칸」을 «공정하게» 나란히 — 같은 크기로 잘라 한 장에
//
// ⛔⛔ 왜 이 도구가 생겼나 — 내가 캡처를 «불공정하게» 보여줬다.
//    📮 창업자 = *"더 커진거 맞아? **왜 3칸이 더 커보이지?**"*
//    🔢 원인 = 두 캡처가 **폭은 같은데(966px) 세로가 달랐다** — 3칸 375px · 2칸 1113px.
//       채팅·화면은 «세로가 긴 그림을 더 많이 줄여» 맞춘다 → **2칸 카드가 3배 더 작게 그려졌다.**
//    📌 규칙 18 그대로 — 「무엇이 더 큰가」가 아니라 «내가 어떻게 보여줬나»가 범인이었다.
//       그리고 규칙 21(열어보고 보낸다)을 지켰는데도 못 잡았다 —
//       **한 장씩 따로 열어보면 안 드러난다. 나란히 놔야 드러난다.**
//
// ✅ 그래서 이 판은 **두 갈래를 «같은 화면 크기»로 잘라 한 장에 담는다.**
//    같은 캔버스 · 같은 배율 · 같은 자리 → 줄어드는 정도가 같아서 «진짜 크기»가 비교된다.
//    ＋ 카드 폭을 px 자로 찍어 눈이 아니라 «숫자»로도 확인되게 한다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-홈크게-공정비교-0821.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홈크게'
mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4413, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// ⭐ 레꾸를 심는다 — 창업자가 짚은 *"레꾸화면이 더 잘보이겠다"* 를 같이 보려면 꾸며져 있어야 한다
const 꾸미기심기 = () => {
  const st = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const 제목들 = [...document.querySelectorAll('.weekly-row .mini-card .name')].map((n) => n.textContent.trim().replace(/…$/, ''))
  st.recipes = (st.recipes || []).map((r) => (제목들.some((t) => t && r.title.startsWith(t)) ? {
    ...r,
    decor: [
      { id: 'a', type: 'sticker', key: 'gp_gomhi', x: 0.24, y: 0.26, s: 0.30, r: -8 },
      { id: 'b', type: 'sticker', key: 'gp_pengv', x: 0.78, y: 0.30, s: 0.24, r: 7 },
      { id: 'c', type: 'note', key: 'yellow', text: '오늘 성공!', x: 0.5, y: 0.80, s: 0.52, r: -3 },
    ],
  } : r))
  localStorage.setItem('hankki:v1', JSON.stringify(st))
}

// 한 갈래를 «주간 상자 맨 위 기준»으로 같은 높이만큼 잘라 온다
const 찍기 = async (css, 꾸밈) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 3 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })

  if (꾸밈) {
    const p0 = await ctx.newPage()
    await p0.goto('http://127.0.0.1:4413/hankki/', { waitUntil: 'networkidle' })
    await p0.waitForTimeout(700)
    await p0.evaluate(꾸미기심기)
    await p0.close()
  }

  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4413/hankki/', { waitUntil: 'networkidle' })
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(800)
  if (css) { await p.addStyleTag({ content: css }); await p.waitForTimeout(400) }

  // 주간 상자가 화면 맨 위에 오게 굴린다 → 두 갈래의 «자리»가 같아진다
  await p.evaluate(() => {
    const box = document.querySelector('.weekly-box')
    if (box) box.scrollIntoView({ block: 'start' })
  })
  await p.waitForTimeout(300)

  const 잰값 = await p.evaluate(() => {
    const card = document.querySelector('.weekly-row .mini-card')
    const 상자 = card?.querySelector('div[style*="position"]')
    return { 상자: 상자 ? Math.round(상자.getBoundingClientRect().width) : 0 }
  })
  const buf = await p.screenshot({ clip: { x: 0, y: 0, width: 390, height: 620 } })
  await ctx.close()
  return { buf, ...잰값 }
}

console.log('\n⚖️ 3칸 ↔ 2칸 — «같은 크기»로 잘라 나란히 (390×620 · 3배)\n')

const 두칸CSS = `.weekly-row { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)) !important; }`
const 셋 = await 찍기('', true)
const 둘 = await 찍기(두칸CSS, true)

// 한 장으로 잇는다 — 같은 캔버스·같은 배율이라 «줄어드는 정도»가 같다
const page = await (await b.newContext({ viewport: { width: 900, height: 760 }, deviceScaleFactor: 2 })).newPage()
const d = (buf) => `data:image/png;base64,${buf.toString('base64')}`
await page.setContent(`
<style>
  body{margin:0;background:#f6f3ec;font-family:-apple-system,'Apple SD Gothic Neo',sans-serif;
       display:flex;gap:24px;padding:22px;box-sizing:border-box}
  .col{flex:1;min-width:0;text-align:center}
  .lab{font-size:17px;font-weight:800;color:#2a2622;margin:0 0 3px;letter-spacing:-.02em}
  .px{font-size:14px;color:#3f6ea8;font-weight:700;margin:0 0 10px;font-variant-numeric:tabular-nums}
  img{width:100%;height:auto;display:block;border-radius:12px;border:1px solid #e3dccf;background:#fff}
</style>
<div class="col"><p class="lab">가 · 지금 (3칸)</p><p class="px">카드 ${셋.상자}px</p><img src="${d(셋.buf)}"></div>
<div class="col"><p class="lab">나 · 2칸</p><p class="px">카드 ${둘.상자}px &nbsp;→&nbsp; ${(둘.상자 / 셋.상자).toFixed(2)}배</p><img src="${d(둘.buf)}"></div>
`)
await page.waitForTimeout(500)
await page.screenshot({ path: join(OUT, '⭐공정비교-3칸vs2칸.png'), fullPage: true })
await b.close(); srv.close()

console.log(`  가 · 3칸  카드 ${셋.상자}px`)
console.log(`  나 · 2칸  카드 ${둘.상자}px  = ${(둘.상자 / 셋.상자).toFixed(2)}배`)
console.log(`\n🖼 ${join(OUT, '⭐공정비교-3칸vs2칸.png')}`)
console.log('   ⭐ 같은 캔버스·같은 배율·같은 자리라 «줄어드는 정도»가 같다 = 진짜 크기가 비교된다\n')
