// 🍳✍️ **요리모드 = 귀염체로 «가되, 두께 사다리»** — 폰·패드 따로 고른다 (창업자 확정 방향 2026-09-01)
//
// 📮 창업자 = *"난 **귀염체가 우리앱이랑 결이 맞는다**고 생각하는데. **패드에서는 두께를 좀 더 키워야** 할 것 같아.
//    **폰은 키운게 10이면 12정도? 패드는 더 올려야 하고..** 시안다시볼게. 다양한 크기로."*
//
// ⭐⭐ **창업자 감이 숫자와 맞았다** — 같은 0.4px 을 덧그렸는데 **폰 10.0 · 패드 9.3** 이 나왔다.
//    패드는 글자가 38px 이라 «획이 상대적으로 가늘어» 보인다(0.4px 이 차지하는 몫이 작다).
//    👉 그래서 **폰과 패드에 다른 값**을 준다. 이 판은 그걸 고르라고 만든 사다리다.
//
// ⛔⛔ **글자 «크기»(28/38px)는 여전히 안 건드린다** — 창업자가 964걸음을 전수로 재서 정한 값이다.
//    바꾸는 것은 **획 두께 하나**뿐이라 자리·줄바꿈이 하나도 안 움직인다.
//    ⚠️ 만약 «글자 크기»도 같이 보고 싶으면 한 줄만 주면 그 사다리도 바로 뽑는다(⛔짐작으로 안 건드린다).
//
// 실행: node /home/user/hankki/hankki/scripts/_판-귀염체두께-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/두께'
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

// ── 사다리 ────────────────────────────────────────────────
// ⭐ 0 = 귀염체 그대로(7.8) · 0.4 = 어제 보여드린 판(10.0) · 그 위로 올려 간다
//    폰 목표 「12쯤」이 어디인지 «재서» 알려주려고 촘촘히 뒀다.
// ⛔⛔ **첫 판은 폰·패드에 «같은» 사다리를 줬는데 패드가 1px 에서도 11.1 이라 목표(12)에 못 닿았다.**
//    ⭐ 창업자가 *"패드는 더 올려야 하고.."* 라고 한 그대로였다 → **기기마다 다른 사다리**로.
const 사다리표 = {
  phone: ['0', '0.4', '0.7', '0.85', '1', '1.2'],      // 폰: 0.85~1 에서 12 가 나온다
  pad: ['0', '0.7', '1', '1.3', '1.6', '1.9'],          // 패드: 1 에서 11.1 이라 위로 더 벌린다
  padland: ['0', '0.7', '1', '1.3', '1.6', '1.9'],
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
  for (let i = 0; i < 3; i++) {
    if (!(await p.locator('.sheet-mask').count())) break
    await p.keyboard.press('Escape'); await p.waitForTimeout(400)
  }
  await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click().catch(() => {})
  await p.waitForTimeout(1000)
  const 카드 = p.locator('.screen button, .screen [role="button"], .screen a').filter({ hasText: /[가-힣]/ })
  const n = Math.min(await 카드.count(), 14)
  for (let i = 0; i < n; i++) {
    await 카드.nth(i).click().catch(() => {})
    await p.waitForTimeout(800)
    if (await p.locator('[data-coach="cook"]').count()) break
    await p.goBack().catch(() => {}); await p.waitForTimeout(600)
  }
  if (!(await p.locator('[data-coach="cook"]').count())) return { ctx, p, 됐나: false }
  await p.locator('[data-coach="cook"]').first().click()
  await p.waitForTimeout(1200)
  for (let i = 0; i < 4; i++) {
    if (await p.locator('.cook-steptext').count()) break
    await p.locator('button, [role="button"]').filter({ hasText: /다음|시작/ }).last().click().catch(() => {})
    await p.waitForTimeout(700)
  }
  return { ctx, p, 됐나: await p.locator('.cook-steptext').count() > 0 }
}

const 기기 = [
  { id: 'phone', 이름: '폰 390×844', 폭: 390, 높이: 844 },
  { id: 'pad', 이름: '패드 세로 820×1180', 폭: 820, 높이: 1180 },
  { id: 'padland', 이름: '패드 가로 1180×820', 폭: 1180, 높이: 820 },
]

// 🔢 글자 하나가 먹는 잉크 — 상자·줄 수와 무관한 잣대(2026-09-01 에 이 잣대로 바꿨다)
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

const 잰값 = []
for (const g of 기기) {
  const { ctx, p, 됐나 } = await 요리모드로(g.폭, g.높이)
  if (!됐나) { console.error(`✗ ${g.이름} — 요리모드 걸음 글자를 못 찾았다(아무것도 못 잰다)`); await ctx.close(); continue }
  console.log(`\n── ${g.이름} ──`)
  for (const st of 사다리표[g.id]) {
    await p.evaluate((s) => {
      document.getElementById('_ff')?.remove()
      const el = document.createElement('style'); el.id = '_ff'
      el.textContent = `.cook-steptext, .cook-stepno { font-family: 'Gaegu', 'Pretendard', sans-serif !important; }`
        + (s === '0' ? '' : `\n.cook-steptext { -webkit-text-stroke: ${s}px currentColor; }`)
      document.head.appendChild(el)
    }, st)
    await p.waitForTimeout(500)
    await p.evaluate(() => document.fonts.ready)
    await p.waitForTimeout(200)
    const m = await p.evaluate(() => {
      const e = document.querySelector('.cook-steptext'); if (!e) return null
      const cs = getComputedStyle(e)
      return { 크기: cs.fontSize, 글자수: (e.innerText || '').length, 높이: Math.round(e.getBoundingClientRect().height) }
    })
    const 파일 = `${g.id}-${st.replace('.', '_')}.png`
    await p.screenshot({ path: join(OUT, 파일) })
    const 잘린 = `${g.id}-${st.replace('.', '_')}-글자.png`
    await p.locator('.cook-steptext').first().screenshot({ path: join(OUT, 잘린) }).catch(() => {})
    const px = 잉크(join(OUT, 잘린))
    const 두께 = px && m?.글자수 ? Math.round(px / m.글자수 / ((parseFloat(m.크기) * 2) ** 2) * 1000) / 10 : null
    잰값.push({ 기기: g.id, 기기이름: g.이름, 획: st, 두께, 크기: m?.크기, 상자높이: m?.높이, 파일 })
    console.log(`  · 획 ${String(st).padStart(4)}px → 두께 ${두께} ${st === '0' ? '(귀염체 그대로)' : ''}${st === '0.4' ? '(어제 보여드린 판)' : ''}`)
  }
  await ctx.close()
}
await b.close(); srv.close()

// ⚠️ 스스로 검사 — ①사다리가 «실제로» 굵어지나 ②크기는 안 움직였나
let 죽음 = 0
for (const g of 기기) {
  const 줄 = 잰값.filter((v) => v.기기 === g.id)
  if (!줄.length) continue
  const 오름 = 줄.every((v, i) => i === 0 || v.두께 >= 줄[i - 1].두께)
  if (!오름) { console.error(`⛔ ${g.이름} — 사다리가 안 굵어진다(잰 값이 뒤죽박죽이면 판정이 못 된다)`); 죽음++ }
  const 크기들 = [...new Set(줄.map((v) => v.크기))]
  if (크기들.length > 1) { console.error(`⛔ ${g.이름} — 글자 크기가 갈렸다(${크기들.join(' / ')}) · 획만 바꿔야 한다`); 죽음++ }
}
if (!죽음) console.log('\n✅ 사다리가 순서대로 굵어지고 · 글자 크기는 한 판도 안 움직였다')

writeFileSync(join(OUT, '잰값.json'), JSON.stringify(잰값, null, 2))
console.log(`\n📁 ${OUT}`)
