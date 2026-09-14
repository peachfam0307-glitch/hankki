// 📏 글씨체마다 «보이는 크기»가 다르다 — 얼마나 다른지 재서 보정값을 뽑는다
//
// 창업자 2026-08-07 *"글씨크기를 다 비슷하게 조정해서 보통으로 두고 작게 보통 크게로 올려줄수는 없어?"*
//
// ⛔ 같은 `font-size` 를 줘도 글씨체마다 **글자가 실제로 차지하는 높이**가 다르다.
//    (납작체 Dongle 은 대놓고 납작하고, 임팩트는 꽉 찬다) → 같은 크기로 놓으면 어떤 건 작아 보인다.
// ⭐ 재는 것 = **한글 글자의 «잉크» 높이** — 캔버스에 그려서 위아래로 실제 칠해진 픽셀을 찾는다.
//    ⛔ `measureText` 의 `fontBoundingBox` 는 글꼴이 «선언한» 값이라 실제 그림과 다르다.
//       우리가 맞추려는 건 «눈에 보이는 크기»니까 픽셀을 본다.
// 🔒 재기 전에 「진짜 떴나」부터 — 안 떴는데 재면 대체 글꼴을 재고도 숫자는 그럴듯하게 나온다
//    (2026-08-07 에 CORS 로 실제 그랬다).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const FONTS = join(ROOT, 'src/assets/fonts')

// 📖 목록은 코드에서 읽는다 — 손으로 적으면 낡는다
const SRC = readFileSync(join(ROOT, 'src/components/Stickers.jsx'), 'utf8')
const TBL = SRC.slice(SRC.indexOf('export const TEXT_FONTS = ['))
const ROWS = [...TBL.slice(0, TBL.indexOf('\n]')).matchAll(/key: '([\w]+)', label: '([^']+)', family: "'([^']+)'[^}]*?weight: (\d+)/g)]
  .map((m) => ({ key: m[1], label: m[2], fam: m[3], weight: +m[4] }))
if (ROWS.length < 6) { console.log(`⛔ TEXT_FONTS 를 못 읽었다 (${ROWS.length}개)`); process.exit(1) }

// 🔗 글꼴 이름 → 파일 앞머리 (styles.css 에서 읽는다)
const CSS = readFileSync(join(ROOT, 'src/styles.css'), 'utf8')
const fileOf = {}
for (const m of CSS.matchAll(/font-family: '([^']+)';\s*src: url\('\.\/assets\/fonts\/([\w-]+)-(korean|latin|chip)-\d+\.woff2'/g)) {
  if (m[3] === 'korean') fileOf[m[1]] = m[2]
}

let PAGE = ''
const srv = createServer((q, s) => {
  const p = decodeURIComponent(q.url.split('?')[0])
  if (p === '/' || p.endsWith('.html')) { s.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); s.end(PAGE); return }
  let body = null
  try { body = readFileSync(join(FONTS, p.slice(1))) } catch { /* 404 */ }
  if (!body) { s.writeHead(404); s.end(''); return }
  s.writeHead(200, { 'content-type': 'font/woff2' }); s.end(body)
})
await new Promise((r) => srv.listen(4405, r))

const faces = ROWS.map((r) => `@font-face{font-family:'${r.fam}';src:url('/${fileOf[r.fam]}-korean-400.woff2') format('woff2');font-display:block}`).join('\n')
PAGE = `<meta charset="utf-8"><style>${faces}
span{position:fixed;left:-9999px;font-size:80px}</style>
${ROWS.map((r) => `<span style="font-family:'${r.fam}'">한끼 맛있겠다 오늘도</span>`).join('')}`

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await (await b.newContext()).newPage()
await page.goto('http://127.0.0.1:4405/m.html', { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1500)

const dead = await page.evaluate((list) => {
  const m = document.createElement('span')
  m.style.cssText = 'position:fixed;left:-9999px;font-size:80px;white-space:pre'; m.textContent = '맛있겠다'
  document.body.appendChild(m)
  m.style.fontFamily = 'serif'; const base = m.getBoundingClientRect().width
  const bad = []
  for (const f of list) { m.style.fontFamily = `'${f}', serif`; if (m.getBoundingClientRect().width === base) bad.push(f) }
  m.remove(); return bad
}, ROWS.map((r) => r.fam))
if (dead.length) { console.log(`⛔ 안 뜬 글씨체 — ${dead.join(', ')}`); await b.close(); srv.close(); process.exit(1) }
console.log(`✅ ${ROWS.length}개 전부 진짜로 떴다\n`)

// 📏 «잉크» 높이 — 캔버스에 그려 실제 칠해진 위아래를 찾는다
const inkH = (fam, weight) => page.evaluate(([fam, weight]) => {
  const PX = 200, W = 1600, H = 500
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const x = c.getContext('2d')
  x.fillStyle = '#fff'; x.fillRect(0, 0, W, H)
  x.font = `${weight} ${PX}px '${fam}'`
  x.textBaseline = 'alphabetic'; x.fillStyle = '#000'
  x.fillText('한끼 맛있겠다', 20, 350)
  const d = x.getImageData(0, 0, W, H).data
  let top = -1, bot = -1
  for (let y = 0; y < H; y++) {
    let hit = false
    for (let px = 0; px < W; px++) if (d[(y * W + px) * 4] < 128) { hit = true; break }
    if (hit) { if (top < 0) top = y; bot = y }
  }
  return top < 0 ? 0 : (bot - top + 1) / PX
}, [fam, weight])

console.log('📏 같은 크기(200px)로 그렸을 때 «글자가 차지하는 높이»')
const out = []
for (const r of ROWS) {
  const h = await inkH(r.fam, r.weight)
  out.push({ ...r, h })
}
// ⭐ 기준 = 「귀염체」 — 지금까지 본문이 쓰던 글씨체다. 그걸 1 로 두면 «지금 모습»이 안 바뀐다.
const base = out.find((o) => o.key === 'gaegu')?.h || out[0].h
console.log(`   (기준 = 귀염체 ${base.toFixed(3)} → 보정 1.00)\n`)
for (const o of out) {
  const fix = base / o.h
  // 지나친 보정은 오히려 이상하다 — 0.8~1.35 로 묶는다
  const cl = Math.min(1.35, Math.max(0.8, fix))
  o.sz = Math.round(cl * 100) / 100
  // ⚠️ 첫 판은 «반올림 전» 값과 «반올림 후» 값을 견줘서 **전부 「묶임」으로 찍혔다**(또 무엇을 보는지 문제).
  //    묶인 건 진짜로 상한·하한에 닿은 것만이다.
  const flag = (fix > 1.35 || fix < 0.8) ? ` ⚠️묶임(잰 값 ${fix.toFixed(2)})` : ''
  console.log(`   ${o.label.padEnd(4)} 높이 ${o.h.toFixed(3)}  →  보정 ${o.sz.toFixed(2)}${flag}`)
}
console.log('\n📋 그대로 `TEXT_FONTS` 에 넣을 값 (sz):')
console.log('   ' + out.map((o) => `${o.key}: ${o.sz}`).join(' · '))
await b.close(); srv.close()
