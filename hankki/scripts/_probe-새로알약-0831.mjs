// 🔵 「홈 화면 한끼 소식의 «새로» 알약」 실측판
//
// 📮 창업자 2026-08-31 = *"한끼소식에 알약은 색을 다르게 하거나, 새로 올라온게 있으면 표시가 있으면 좋겠어."*
//    → 자리를 되물으니 = *"내가 말한건 **홈화면세 한끼소식 (새로)알약**"*
//
// ⛔⛔ 내가 처음엔 «소식 시트 안»의 알약(「꾸미기 27종」·「나중에」)을 재고 있었다. **자리가 틀렸다.**
//    📌 규칙 25 — 제보를 받으면 「어디의 무엇인지」부터. 물어봐서 한 번에 잡혔다.
//
// 🔢 이 판이 답할 것 셋
//    ① 그 알약이 **오늘 뜨나** · 어느 날 뜨고 어느 날 안 뜨나 (`openedAlert` 가 갈래를 걸러낸다)
//    ② 홈에 **같은 색 알약이 또 있나** (창업자 말 = *"색을 다르게"* → 무엇과 다르게인지 알아야 한다)
//    ③ 테마 넷에서 **글자가 읽히나** (대비)
//
// ⛔ 소스를 읽어 짐작하지 않는다 — **화면에 그려진 값**(computed style)을 읽는다(규칙 30·21).
//
// 실행: node /home/user/hankki/hankki/scripts/_probe-새로알약-0831.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/새로알약'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

// 밝기(상대휘도) → 대비율. 판정용이 아니라 «읽히나»를 숫자로 말하려고.
const 휘도 = (rgb) => {
  const [r, g, bb] = rgb.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * r + 0.7152 * g + 0.0722 * bb
}
const 대비 = (a, c) => { const [x, y] = [휘도(a), 휘도(c)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
const 뽑기 = (s) => (s.match(/\d+/g) || []).slice(0, 3).map(Number)

async function 열기(iso, theme) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript((t) => {
    try { localStorage.setItem('hankki:onboarded', '1') } catch { /* 화면은 돈다 */ }
    try { if (t) localStorage.setItem('hankki-theme', t) } catch { /* 기본 테마로 */ }
  }, theme)
  await ctx.clock.setFixedTime(new Date(iso))
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1200)
  // 새 소식 팝업이 홈을 덮는다 — 「닫기」로 치운다(⛔Escape 로는 안 닫힌다)
  if (await p.locator('.sheet-mask').count()) {
    await p.locator('.sheet-mask button', { hasText: /^닫기$/ }).last().click().catch(() => {})
    await p.waitForTimeout(500)
  }
  return { ctx, p }
}

// 홈에 그려진 «알약처럼 생긴 것»을 전부 줍는다 — 둥근 모서리 ＋ 채운 바탕 ＋ 짧은 글자.
const 알약줍기 = () => {
  const 잰다 = (el) => {
    const c = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return {
      글: el.innerText.trim().slice(0, 14),
      글자색: c.color, 바탕: c.backgroundColor, 선: c.borderTopWidth === '0px' ? '없음' : c.borderTopColor,
      크기: `${Math.round(r.width)}x${Math.round(r.height)}`, y: Math.round(r.top),
    }
  }
  const 나온다 = []
  for (const el of document.querySelectorAll('.screen span, .screen div')) {
    const c = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    if (r.width < 8 || r.height < 8 || r.height > 40 || r.width > 200) continue
    const 둥근 = parseFloat(c.borderRadius) >= 100 || parseFloat(c.borderRadius) >= r.height / 2
    const 채움 = c.backgroundColor !== 'rgba(0, 0, 0, 0)' && c.backgroundColor !== 'transparent'
    const 글 = el.innerText.trim()
    if (!둥근 || !채움 || !글 || 글.length > 14 || el.children.length > 1) continue
    나온다.push(잰다(el))
  }
  return 나온다
}

console.log('\n════ ① 「새로」가 어느 날 뜨나 ════')
const 날들 = ['2026-08-29', '2026-08-30', '2026-08-31', '2026-09-01', '2026-09-02', '2026-09-05', '2026-09-08']
for (const d of 날들) {
  const { ctx, p } = await 열기(`${d}T03:00:00Z`, null)   // 12:00 KST
  const v = await p.evaluate(() => {
    const card = document.querySelector('button.news-card')
    if (!card) return { 카드: false }
    const 새로 = [...card.querySelectorAll('span')].find((s) => s.innerText.trim() === '새로')
    const 부제 = card.querySelector('.news-sub')
    const cc = 새로 ? getComputedStyle(새로) : null
    return {
      카드: true, 새로: !!새로,
      글자색: cc?.color, 바탕: cc?.backgroundColor,
      부제: 부제 ? 부제.innerText.trim().slice(0, 40) : '',
    }
  })
  console.log(`  ${d}  새로=${v.새로 ? '✅ 뜬다' : '⛔ 안 뜬다'}  · 부제 "${v.부제}"`)
  if (v.새로) console.log(`             글자 ${v.글자색} / 바탕 ${v.바탕}`)
  await ctx.close()
}

console.log('\n════ ② 홈에 «같은 모양» 알약이 또 있나 (9/1) ════')
{
  const { ctx, p } = await 열기('2026-09-01T03:00:00Z', null)
  const 목록 = await p.evaluate(알약줍기)
  const 본 = new Set()
  for (const a of 목록.sort((x, y) => x.y - y.y)) {
    const 키 = a.글 + a.바탕
    if (본.has(키)) continue
    본.add(키)
    console.log(`  y=${String(a.y).padStart(4)}  「${a.글}」 ${a.크기}  바탕 ${a.바탕}  글자 ${a.글자색}`)
  }
  await p.screenshot({ path: join(OUT, '지금-홈.png') })
  await ctx.close()
}

console.log('\n════ ③ 테마 넷에서 읽히나 (9/1) ════')
for (const t of [null, 'cream', 'apricot', 'dark']) {
  const { ctx, p } = await 열기('2026-09-01T03:00:00Z', t)
  const v = await p.evaluate(() => {
    const card = document.querySelector('button.news-card')
    const 새로 = card && [...card.querySelectorAll('span')].find((s) => s.innerText.trim() === '새로')
    if (!새로) return null
    const cc = getComputedStyle(새로)
    return { 글자색: cc.color, 바탕: cc.backgroundColor, 카드바탕: getComputedStyle(card).backgroundColor, 화면: getComputedStyle(document.querySelector('.screen') || document.body).backgroundColor }
  })
  const 이름 = t || 'greige(기본)'
  if (!v) { console.log(`  ${이름}: ⛔ 알약 없음`); await ctx.close(); continue }
  console.log(`  ${이름.padEnd(13)} 글자↔바탕 ${대비(뽑기(v.글자색), 뽑기(v.바탕)).toFixed(2)}  ·  알약↔카드 ${대비(뽑기(v.바탕), 뽑기(v.카드바탕)).toFixed(2)}   (${v.바탕})`)
  await p.locator('button.news-card').screenshot({ path: join(OUT, `지금-${이름}.png`) })
  await ctx.close()
}

console.log(`\n📁 ${OUT}`)
await b.close(); srv.close()
