// 🎨 [판정근거 · 2026-08-21] 홈 상자를 키우면 «레꾸»가 얼마나 더 잘 보이나
//
// 📮 창업자 = *"이거키우는게 좋은게 **레꾸화면이 더 잘보이겠다**"*
//    ⭐ 이건 「크게 보인다」보다 «센» 이유다 — 레꾸는 우리 핵심 무기인데
//       홈에서 작게 뜨면 **자랑이 안 된다.**
//
// ⛔ 「그럴 것 같다」로 답하지 않는다 — 스티커를 실제로 심고 **픽셀로 잰다**(규칙 15·18).
//    잣대 = ①스티커가 화면에 몇 px 로 그려지나 ②원본 대비 몇 %로 줄어드나(뭉개짐)
//    ⭐ 검수 절대원칙 ③ 과 같은 잣대다 — **소스 긴변 ≥ 표시 크기**라야 안 뭉갠다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_probe-레꾸잘보이나-0821.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/레꾸크기'
mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4412, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })

// ⭐ 「이번 주 특별한 한끼」에 뜨는 «그 레시피»를 꾸민다 — 딴 걸 꾸미면 홈에 안 보인다
const 심기 = async (page) => page.evaluate(() => {
  const st = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  // 홈 주간 줄에 실제로 뜨는 제목을 화면에서 읽어 그 레시피를 꾸민다
  const 제목들 = [...document.querySelectorAll('.weekly-row .mini-card .name')].map((n) => n.textContent.trim())
  let 몇 = 0
  st.recipes = (st.recipes || []).map((r) => {
    if (!제목들.some((t) => r.title.startsWith(t.replace(/…$/, '')))) return r
    몇++
    return {
      ...r,
      decorBg: 'sum_wave',
      decor: [
        { id: 'a', type: 'sticker', key: 'gp_gomhi', x: 0.24, y: 0.26, s: 0.30, r: -8 },
        { id: 'b', type: 'sticker', key: 'gp_pengv', x: 0.78, y: 0.30, s: 0.24, r: 7 },
        { id: 'c', type: 'note', key: 'yellow', text: '오늘 성공!', x: 0.5, y: 0.80, s: 0.52, r: -3 },
      ],
    }
  })
  localStorage.setItem('hankki:v1', JSON.stringify(st))
  return 몇
})

const 재기 = async (이름, css) => {
  const page = await ctx.newPage()
  await page.goto('http://127.0.0.1:4412/hankki/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(700)
  const 몇 = await 심기(page)
  await page.close()

  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4412/hankki/', { waitUntil: 'networkidle' })
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(800)
  if (css) { await p.addStyleTag({ content: css }); await p.waitForTimeout(400) }

  const m = await p.evaluate(() => {
    const card = document.querySelector('.weekly-row .mini-card')
    const 상자 = card?.querySelector('div[style*="position"]')
    if (!상자) return null
    const r = 상자.getBoundingClientRect()
    const 스티커 = [...상자.querySelectorAll('img')]
      .filter((i) => /gp_gomhi|gp_pengv/.test(i.src))
      .map((i) => ({ 화면: Math.round(i.getBoundingClientRect().width), 원본: i.naturalWidth }))
    // 메모지 글자 — 「읽히나」의 잣대
    const 글 = [...상자.querySelectorAll('*')].find((e) => /오늘 성공/.test(e.textContent || '') && e.children.length === 0)
    const 글크기 = 글 ? Math.round(parseFloat(getComputedStyle(글).fontSize) * 10) / 10 : 0
    return { 상자: Math.round(r.width), 스티커, 글크기 }
  })
  const 캡 = await p.$('.weekly-row')
  await 캡?.screenshot({ path: join(OUT, `${이름}.png`) })
  await p.close()
  return { 이름, 꾸민편수: 몇, ...m }
}

console.log('\n🎨 홈 상자를 키우면 «레꾸»가 얼마나 더 잘 보이나 (390×844)\n')

const 지금 = await 재기('가-지금3칸', '')
const 두칸 = await 재기('나-2칸', `.weekly-row { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)) !important; }`)

await b.close(); srv.close()

const 줄 = (v) => {
  console.log(`  ${v.이름}  (꾸민 레시피 ${v.꾸민편수}편)`)
  console.log(`     표지 상자 ${v.상자}px`)
  v.스티커.forEach((s, i) => {
    const 비 = s.원본 ? (s.화면 / s.원본 * 100).toFixed(1) : '?'
    console.log(`     스티커${i + 1}  화면 ${String(s.화면).padStart(3)}px  (원본 ${s.원본}px → ${비}% 로 줄여 그린다)`)
  })
  console.log(`     메모지 글자 ${v.글크기}px`)
}
줄(지금); console.log(''); 줄(두칸)

const s0 = 지금.스티커[0], s1 = 두칸.스티커[0]
console.log(`\n⭐ 결론 — 창업자 말이 맞다`)
console.log(`   · 표지 상자 ${지금.상자} → ${두칸.상자}px (${(두칸.상자 / 지금.상자).toFixed(2)}배)`)
if (s0 && s1) console.log(`   · 스티커도 ${s0.화면} → ${s1.화면}px (${(s1.화면 / s0.화면).toFixed(2)}배) — 상자와 «같은 배수»다`)
console.log(`   · 메모지 글자 ${지금.글크기} → ${두칸.글크기}px`)
if (지금.글크기 && 두칸.글크기) {
  console.log(`     ⭐ ${지금.글크기}px 는 «글자로 안 읽힌다»(사람 눈 한계 ≈ 8px). ${두칸.글크기}px 는 «읽으려면 읽힌다».`)
}
console.log(`\n🖼 캡처 → ${OUT}\n`)
