// 🍳✍️ **귀염체 획 두께 — 「작은 화면(24px)」 칸을 채운다** (2026-09-01)
//
// 📮 창업자 판정 = *"· 📱 폰 획 **0.85px** = 이게 좋다 · 🖥 패드 가로 획 **1.6px** = 이게 좋다"*
//
// ⛔⛔ **그런데 요리모드 글자 크기는 «세 단»이다**(styles.css:2231·2237·2247) —
//    **24px**(320×568·360×640·**폰 가로**) · **28px**(폰 세로) · **38px**(패드).
//    창업자가 판정한 건 **28 과 38** 이다. **24px 칸이 비어 있다.**
//    ⛔ 거기에 0.85px 을 그대로 주면 «상대적으로 더 굵다» — 글자가 작을수록 같은 획이 더 크게 먹는다.
//
// ✅ **그래서 짐작하지 않고 «재서» 채운다** — 창업자가 고른 폰의 두께(28px＋0.85px)와
//    **같은 두께 값**이 나오는 획을 24px 에서 찾는다.
//    잣대 = **글자 하나가 먹는 잉크** = 잉크픽셀 ÷ 글자수 ÷ (글자크기×2)²  (상자·줄수와 무관)
//
// 실행: node /home/user/hankki/hankki/scripts/_probe-귀염체작은화면-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/두께24'
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

// 🔢 글자 하나가 먹는 잉크 (PNG 를 손으로 푼다 · Playwright 요소 캡처는 RGB(ctype 2)다)
function 잉크(file) {
  const buf = readFileSync(file)
  let w = 0, h = 0, depth = 0, ctype = 0
  const idat = []
  for (let o = 8; o + 8 <= buf.length;) {
    const len = buf.readUInt32BE(o)
    const type = buf.toString('latin1', o + 4, o + 8)
    const data = buf.subarray(o + 8, o + 8 + len)
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; ctype = data[9] }
    else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    o += 12 + len
  }
  if ((ctype !== 6 && ctype !== 2) || depth !== 8 || !w || !h) return null
  let raw; try { raw = inflateSync(Buffer.concat(idat)) } catch { return null }
  const BPP = ctype === 6 ? 4 : 3, stride = w * BPP
  const cur = Buffer.alloc(stride), prev = Buffer.alloc(stride)
  let 칸수 = 0
  for (let y = 0; y < h; y += 1) {
    const off = y * (stride + 1)
    if (off + stride >= raw.length + 1) break
    const filter = raw[off]
    raw.copy(cur, 0, off + 1, off + 1 + stride)
    for (let i = 0; i < stride; i += 1) {
      const a = i >= BPP ? cur[i - BPP] : 0, bb = prev[i], c = i >= BPP ? prev[i - BPP] : 0
      if (filter === 1) cur[i] = (cur[i] + a) & 255
      else if (filter === 2) cur[i] = (cur[i] + bb) & 255
      else if (filter === 3) cur[i] = (cur[i] + ((a + bb) >> 1)) & 255
      else if (filter === 4) {
        const pp = a + bb - c, pa = Math.abs(pp - a), pb = Math.abs(pp - bb), pc = Math.abs(pp - c)
        cur[i] = (cur[i] + (pa <= pb && pa <= pc ? a : pb <= pc ? bb : c)) & 255
      }
    }
    for (let x = 0; x < w; x += 1) {
      const r = cur[x * BPP], g = cur[x * BPP + 1], bl = cur[x * BPP + 2]
      if ((r * 299 + g * 587 + bl * 114) / 1000 < 150) 칸수 += 1
    }
    cur.copy(prev)
  }
  return 칸수
}

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

async function 요리모드로(폭, 높이) {
  const ctx = await b.newContext({ viewport: { width: 폭, height: 높이 }, deviceScaleFactor: 2 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1200)
  for (let i = 0; i < 3; i++) { if (!(await p.locator('.sheet-mask').count())) break; await p.keyboard.press('Escape'); await p.waitForTimeout(400) }
  await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click().catch(() => {})
  await p.waitForTimeout(1000)
  const 카드 = p.locator('.screen button, .screen [role="button"], .screen a').filter({ hasText: /[가-힣]/ })
  const n = Math.min(await 카드.count(), 14)
  for (let i = 0; i < n; i++) {
    await 카드.nth(i).click().catch(() => {}); await p.waitForTimeout(800)
    if (await p.locator('[data-coach="cook"]').count()) break
    await p.goBack().catch(() => {}); await p.waitForTimeout(600)
  }
  if (!(await p.locator('[data-coach="cook"]').count())) return { ctx, p, 됐나: false }
  await p.locator('[data-coach="cook"]').first().click(); await p.waitForTimeout(1200)
  for (let i = 0; i < 4; i++) {
    if (await p.locator('.cook-steptext').count()) break
    await p.locator('button, [role="button"]').filter({ hasText: /다음|시작/ }).last().click().catch(() => {}); await p.waitForTimeout(700)
  }
  return { ctx, p, 됐나: await p.locator('.cook-steptext').count() > 0 }
}

const 기기 = [
  { id: 'small', 이름: '작은 폰 360×640 (24px 칸)', 폭: 360, 높이: 640, 사다리: ['0', '0.4', '0.55', '0.7', '0.85', '1'] },
  { id: 'phone', 이름: '폰 390×844 (28px 칸 · ⭐창업자가 0.85 로 판정)', 폭: 390, 높이: 844, 사다리: ['0.85'] },
  { id: 'padland', 이름: '패드 가로 1180×820 (38px 칸 · ⭐창업자가 1.6 으로 판정)', 폭: 1180, 높이: 820, 사다리: ['1.6'] },
  { id: 'pad', 이름: '패드 세로 820×1180 (38px 칸 · 판정 없음 — 같은 38px 이라 같은 값을 준다)', 폭: 820, 높이: 1180, 사다리: ['1.6'] },
]

const 잰값 = []
for (const g of 기기) {
  const { ctx, p, 됐나 } = await 요리모드로(g.폭, g.높이)
  if (!됐나) { console.error(`✗ ${g.이름} — 요리모드 글자를 못 찾았다`); await ctx.close(); continue }
  console.log(`\n── ${g.이름} ──`)
  for (const st of g.사다리) {
    await p.evaluate((s) => {
      document.getElementById('_ff')?.remove()
      const el = document.createElement('style'); el.id = '_ff'
      el.textContent = `.cook-steptext, .cook-stepno { font-family: 'Gaegu', 'Pretendard', sans-serif !important; }`
        + (s === '0' ? '' : `\n.cook-steptext { -webkit-text-stroke: ${s}px currentColor; }`)
      document.head.appendChild(el)
    }, st)
    await p.waitForTimeout(450)
    await p.evaluate(() => document.fonts.ready)
    await p.waitForTimeout(200)
    const m = await p.evaluate(() => {
      const e = document.querySelector('.cook-steptext'); if (!e) return null
      return { 크기: getComputedStyle(e).fontSize, 글자수: (e.innerText || '').length }
    })
    const 잘린 = `${g.id}-${st.replace('.', '_')}.png`
    await p.locator('.cook-steptext').first().screenshot({ path: join(OUT, 잘린) }).catch(() => {})
    const px = 잉크(join(OUT, 잘린))
    const 두께 = px && m?.글자수 ? Math.round(px / m.글자수 / ((parseFloat(m.크기) * 2) ** 2) * 1000) / 10 : null
    잰값.push({ 기기: g.id, 이름: g.이름, 획: st, 크기: m?.크기, 두께 })
    console.log(`  · 글자 ${String(m?.크기).padStart(4)} · 획 ${String(st).padStart(4)}px → 두께 ${두께}`)
  }
  await ctx.close()
}
await b.close(); srv.close()

// 🎯 창업자가 고른 폰 두께와 «같은 값»이 나오는 24px 획을 고른다
const 폰 = 잰값.find((v) => v.기기 === 'phone')
const 작은 = 잰값.filter((v) => v.기기 === 'small' && v.두께 != null)
if (폰?.두께 && 작은.length) {
  const 고름 = 작은.reduce((a, v) => (Math.abs(v.두께 - 폰.두께) < Math.abs(a.두께 - 폰.두께) ? v : a))
  console.log(`\n🎯 창업자가 고른 폰(28px·0.85px) 두께 = **${폰.두께}**`)
  console.log(`   → 24px 칸에서 제일 가까운 획 = **${고름.획}px** (두께 ${고름.두께} · 차이 ${Math.round(Math.abs(고름.두께 - 폰.두께) * 10) / 10})`)
  console.log(`   후보들 = ${작은.map((v) => `${v.획}px:${v.두께}`).join(' · ')}`)
}
const 패드 = 잰값.filter((v) => v.기기.startsWith('pad'))
if (패드.length === 2) {
  console.log(`\n🖥 패드 두 방향이 같은 값인가 → 가로 ${패드.find(v=>v.기기==='padland')?.두께} · 세로 ${패드.find(v=>v.기기==='pad')?.두께}`)
}
console.log(`\n📁 ${OUT}`)
