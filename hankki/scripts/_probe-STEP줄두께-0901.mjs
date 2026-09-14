// 🔬 **「STEP 1 / 6」 줄이 얇아지지 않았나** (2026-09-01)
//
// ⭐ 왜 재나 = 걸음 글자를 귀염체로 바꾸며 STEP 줄도 같이 바꿨는데(창업자가 판정한 판이 그랬다),
//    넣고 «열어 보니» 그 줄만 눈에 띄게 흐려 보였다(절대원칙 21).
//    ⛔ 「흐려 보인다」는 내 눈이다. **재서 판정한다.**
//
// 잣대 = 글자 하나가 먹는 잉크 ÷ (글자크기×2)²  — 걸음 글자에 쓴 그 잣대 그대로
// 견줄 것 셋 = ⓐ전(Pretendard 800) ⓑ지금(귀염체 700·획 0) ⓒ귀염체 700 ＋ 획 몇 px
//
// 실행: node /home/user/hankki/hankki/scripts/_probe-STEP줄두께-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/STEP줄'
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
    // ⚠️ STEP 줄은 «파란 글자»다 — 걸음 글자(검정)에 쓰던 밝기 문턱(<150)으로는 흐린 파랑을 놓친다.
    //    바탕(크림 ≈ 240)보다 «뚜렷이 어두운» 것을 잉크로 센다.
    for (let x = 0; x < w; x += 1) {
      const r = cur[x * BPP], g = cur[x * BPP + 1], bl = cur[x * BPP + 2]
      if ((r * 299 + g * 587 + bl * 114) / 1000 < 205) 칸수 += 1
    }
    cur.copy(prev)
  }
  return 칸수
}

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 })
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
await p.locator('[data-coach="cook"]').first().click(); await p.waitForTimeout(1200)
for (let i = 0; i < 4; i++) {
  if (await p.locator('.cook-steptext').count()) break
  await p.locator('button, [role="button"]').filter({ hasText: /다음|시작/ }).last().click().catch(() => {}); await p.waitForTimeout(700)
}
if (!(await p.locator('.cook-stepno').count())) { console.error('⛔ STEP 줄을 못 찾았다'); await b.close(); srv.close(); process.exit(1) }

const 판 = [
  { id: 'before', 이름: '전 (Pretendard 800 · 획 0)', css: `.cook-stepno { font-family: 'Pretendard', sans-serif !important; font-weight: 800 !important; -webkit-text-stroke: 0 !important; }` },
  { id: 'now', 이름: '지금 (귀염체 700 · 획 0)', css: `` },
  { id: 's030', 이름: '귀염체 700 ＋ 획 0.30px', css: `.cook-stepno { -webkit-text-stroke: 0.30px currentColor !important; }` },
  { id: 's045', 이름: '귀염체 700 ＋ 획 0.45px', css: `.cook-stepno { -webkit-text-stroke: 0.45px currentColor !important; }` },
  { id: 's060', 이름: '귀염체 700 ＋ 획 0.60px', css: `.cook-stepno { -webkit-text-stroke: 0.60px currentColor !important; }` },
]

const 잰값 = []
for (const v of 판) {
  await p.evaluate((css) => {
    document.getElementById('_sn')?.remove()
    if (!css) return
    const el = document.createElement('style'); el.id = '_sn'; el.textContent = css
    document.head.appendChild(el)
  }, v.css)
  await p.waitForTimeout(400)
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200)
  const m = await p.evaluate(() => {
    const e = document.querySelector('.cook-stepno')
    const cs = getComputedStyle(e)
    return { 크기: cs.fontSize, 글씨체: cs.fontFamily.split(',')[0].replace(/['"]/g, ''), 굵기: cs.fontWeight, 글자수: (e.innerText || '').replace(/\s/g, '').length }
  })
  const 파일 = `stepno-${v.id}.png`
  await p.locator('.cook-stepno').first().screenshot({ path: join(OUT, 파일) }).catch(() => {})
  const px = 잉크(join(OUT, 파일))
  const 두께 = px && m.글자수 ? Math.round(px / m.글자수 / ((parseFloat(m.크기) * 2) ** 2) * 1000) / 10 : null
  잰값.push({ ...v, 두께, ...m })
  console.log(`  · ${v.이름.padEnd(28)} → 두께 ${String(두께).padStart(5)} (${m.글씨체}/${m.굵기} ${m.크기} · 글자 ${m.글자수}자)`)
}
await ctx.close(); await b.close(); srv.close()

const 전 = 잰값.find((v) => v.id === 'before')
const 지금 = 잰값.find((v) => v.id === 'now')
if (전?.두께 && 지금?.두께) {
  const 떨어짐 = Math.round((1 - 지금.두께 / 전.두께) * 1000) / 10
  console.log(`\n📉 귀염체로 가며 STEP 줄이 **${떨어짐}%** 얇아졌다 (${전.두께} → ${지금.두께})`)
  const 후보 = 잰값.filter((v) => v.id.startsWith('s') && v.두께 != null)
  if (후보.length) {
    const 고름 = 후보.reduce((a, v) => (Math.abs(v.두께 - 전.두께) < Math.abs(a.두께 - 전.두께) ? v : a))
    console.log(`🎯 전과 제일 가까운 획 = **${고름.이름}** (두께 ${고름.두께} · 차이 ${Math.round(Math.abs(고름.두께 - 전.두께) * 10) / 10})`)
  }
}
console.log(`\n📁 ${OUT}`)
