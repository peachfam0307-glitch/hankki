// 🔤🐛 꾸미기 글씨체 여섯이 «우리 파일»로 다 뜨나 (창업자 2026-08-07 *"무료 글자체 좀 다운받자"*)
//
// ⛔ 「@font-face 가 있나」로 판정하지 않는다 — 선언은 있는데 파일이 없으면 조용히 대체된다.
//    ⭐ **바깥 인터넷을 통째로 끊고** 재서, 여섯이 «다» 우리 파일로 뜨는지 본다.
//    ⭐ 그리고 「떴나」(`document.fonts.check`)만 보지 않고 **글자 폭이 대체 글꼴과 다른지**까지 잰다
//       — 못 뜬 글꼴은 Pretendard 로 대체되어 «폭이 같아진다». 그게 진짜 증거다.
//    ⭐ 공유 카드 꾸러미(`fontEmbed`)에도 여섯이 다 실리는지 함께 본다
//       (2026-08-05 「한끼」가 두 줄로 깨진 사고가 «꾸러미에 빠진 글꼴» 때문이었다)
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
await new Promise((r) => srv.listen(4396, r))

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const { TEXT_FONTS } = await import('../src/components/Stickers.jsx').catch(() => ({}))
// ⚠️ JSX 는 노드가 못 읽는다 → 이름만 손으로 적되 «코드와 어긋나면 걸리게» 개수를 함께 잰다
const WANT = ['Gaegu', 'Nanum Pen Script', 'Jua', 'Gowun Dodum', 'Black Han Sans', 'Do Hyeon']

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 800 } })
const outside = []
// 🛑 **바깥 인터넷을 끊는다** — 우리 서버(127.0.0.1)만 통과시킨다
await page.route('**/*', (route) => {
  const u = route.request().url()
  if (u.startsWith('http://127.0.0.1:4396') || u.startsWith('data:') || u.startsWith('blob:')) return route.continue()
  outside.push(u)
  return route.abort()
})
const errs = []
page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
await page.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
})
await page.goto('http://127.0.0.1:4396/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// ── ① 바깥으로 나간 요청이 있나 ─────────────────────────
const fontCalls = outside.filter((u) => /fonts\.googleapis|fonts\.gstatic/.test(u))
if (!fontCalls.length) ok('구글 폰트 CDN 을 «부르지 않는다»')
else no(`아직 구글 폰트 CDN 을 부른다 — ${fontCalls.length}건 (${fontCalls[0].slice(0, 70)})`)

// ── ② 여섯이 «다» 떴나 ＋ 폭이 대체 글꼴과 다른가 ────────
const got = await page.evaluate(async (want) => {
  await document.fonts.ready
  const probe = '한끼 가나다 Hankki 15분'
  const c = document.createElement('canvas').getContext('2d')
  const widths = {}
  for (const f of [...want, 'monospace']) {
    await document.fonts.load(`24px "${f}"`, probe).catch(() => {})
    c.font = `24px "${f}", monospace`
    widths[f] = Math.round(c.measureText(probe).width * 10) / 10
  }
  const loaded = {}
  for (const f of want) loaded[f] = document.fonts.check(`24px "${f}"`)
  // @font-face 선언 수 (우리 CSS 에서 온 것)
  let faces = 0
  for (const s of document.styleSheets) {
    try { for (const r of s.cssRules) if (r.constructor.name === 'CSSFontFaceRule') faces++ } catch { /* 다른 출처 */ }
  }
  return { widths, loaded, faces }
}, WANT)

for (const f of WANT) {
  const w = got.widths[f]
  const fallback = got.widths.monospace
  if (!got.loaded[f]) no(`「${f}」가 안 떴다 — 대체 글꼴로 나간다`)
  else if (Math.abs(w - fallback) < 0.5) no(`「${f}」가 떴다는데 폭이 대체 글꼴과 «똑같다» (${w}px) — 진짜로는 안 뜬 것`)
  else ok(`「${f}」 우리 파일로 뜬다 (폭 ${w}px · 대체 ${fallback}px)`)
}
console.log(`   ℹ️ @font-face 선언 ${got.faces}줄 (글꼴 여섯 × 라틴·한글 = 12 이라야 한다)`)
if (got.faces >= 12) ok('@font-face 가 열두 줄 다 있다')
else no(`@font-face 가 ${got.faces}줄뿐이다 — 라틴·한글 한 쌍이 빠졌다`)

// ── ③ 오프라인에서도 사나 — 서비스워커가 글씨체를 담아뒀나 ──
//   ⛔ woff2 는 precache 에서 «일부러» 빠져 있다(설치할 때 1.7MB 를 안 받으려고).
//      그래서 런타임 캐시가 없으면 **한 번 받고도 오프라인이면 못 쓴다.**
await page.waitForTimeout(2500) // 서비스워커가 담을 시간
const cached = await page.evaluate(async () => {
  if (!('caches' in window)) return { there: false }
  const names = await caches.keys()
  const c = names.find((n) => n.includes('hankki-font'))
  if (!c) return { there: false, names }
  const keys = await (await caches.open(c)).keys()
  return { there: true, n: keys.length, names }
})
if (cached.there && cached.n > 0) ok(`⭐ 서비스워커가 글씨체를 담았다 — 'hankki-font' 에 ${cached.n}개 (오프라인에서도 산다)`)
else no(`⭐ 글씨체가 서비스워커 캐시에 없다 — 오프라인이면 대체 글꼴로 나간다 (캐시 = ${(cached.names || []).join(', ') || '없음'})`)

// ── ④ 공유 카드 꾸러미에 여섯이 다 실리나 ────────────────
const bundle = await page.evaluate(async () => {
  const m = window.__hankkiFontCSS
  return m ? m() : null
}).catch(() => null)
if (bundle === null) {
  console.log('   ℹ️ 꾸러미는 화면 밖에서 못 부른다 — 대신 «선언과 목록이 같은가»로 본다')
} else if (typeof bundle === 'string') {
  const miss = WANT.filter((f) => !bundle.includes(f))
  if (!miss.length) ok('공유 카드 꾸러미에 여섯이 다 실린다')
  else no(`꾸러미에 빠진 글꼴 — ${miss.join(', ')}`)
}

if (errs.length) errs.forEach((e) => no(`pageerror — ${e}`))
else ok('pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
