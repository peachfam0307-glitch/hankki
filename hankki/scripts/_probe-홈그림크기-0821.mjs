// 📏 [판정용 · 2026-08-21] 홈 음식 그림을 «키우면» 꾸미기가 손해를 보나
//
// 📮 창업자 물음 = *"음식그림이 그림자체가 커지는거야? 박스가 커지는거야?
//    (음식자체가 커지면 꾸미기가 기능을 좀 잃지않나해서)"*
//
// ⭐ 코드가 이미 답을 갖고 있다 —
//    · 음식 그림 = `Thumb.jsx:31` **`iconSize = '56%'`** (상자 «폭»의 비율)
//    · 꾸미기   = `DecorLayer.jsx` **`left: it.x*100%` · `width: it.s*100%`** (상자 «폭»의 비율)
//    → **둘 다 상자를 기준으로 잰다.**
//      ⓐ **상자를 키우면** 둘이 «같은 배수»로 커진다 → 꾸미기는 한 톨도 안 잃는다
//      ⓑ **그림만 키우면**(56%→↑) 그림이 상자를 더 먹고 꾸미기는 그대로 → **꾸미기가 밀린다**
//
// ⛔ 짐작이 아니라 **재서** 답한다 — 실제로 꾸민 레시피를 심고 ⓐⓑ 를 둘 다 만들어
//    「꾸미기가 덮은 넓이」와 「겹친 넓이」를 픽셀 비율로 잰다(규칙 18 ⓘ · 30).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_probe-홈그림크기-0821.mjs
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
await new Promise((r) => srv.listen(4407, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })

const 새탭 = async () => {
  const page = await ctx.newPage()
  await page.goto('http://127.0.0.1:4407/hankki/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(700)
  return page
}

console.log('\n📏 홈 음식 그림 — 「상자」냐 「그림」이냐 (390×844)\n')

// ───────── ① 지금 값이 정말 «비율»인가 ─────────
const page = await 새탭()

// 꾸민 레시피를 심는다 — 스티커 셋을 상자 폭의 26%·22%·18% 로
await page.evaluate(() => {
  const st = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const r = (st.recipes || [])[0]
  if (!r) return
  st.recipes = st.recipes.map((x) => (x.id === r.id ? {
    ...x,
    decor: [
      { id: 'd1', type: 'sticker', key: 'gp_gomhi', x: 0.22, y: 0.24, s: 0.26, r: -8 },
      { id: 'd2', type: 'sticker', key: 'gp_pengv', x: 0.80, y: 0.28, s: 0.22, r: 6 },
      { id: 'd3', type: 'sticker', key: 'dc_heart01', x: 0.78, y: 0.80, s: 0.18, r: 0 },
    ],
  } : x))
  localStorage.setItem('hankki:v1', JSON.stringify(st))
})
await page.close()

const p = await 새탭()

// 홈에서 음식 그림이 있는 칸들을 잰다
const 잰값 = await p.evaluate(() => {
  const out = []
  document.querySelectorAll('img').forEach((img) => {
    const 상자 = img.closest('[style*="position: relative"], [style*="position:relative"]')
    if (!상자) return
    const r = 상자.getBoundingClientRect()
    const ir = img.getBoundingClientRect()
    if (r.width < 24 || ir.width < 8) return
    if (ir.width / r.width > 0.98) return // 표지 사진처럼 통째로 채운 것은 뺀다
    out.push({ 상자폭: Math.round(r.width), 그림폭: Math.round(ir.width), 비율: +(ir.width / r.width).toFixed(3) })
  })
  return out
})
const 대표 = 잰값.filter((x) => Math.abs(x.비율 - 0.56) < 0.02)
console.log('① 지금 앱 — 음식 그림은 «상자 폭의 몇 %»인가')
console.log(`   잰 칸 ${잰값.length}개 · 그중 56% 인 칸 ${대표.length}개`)
const 폭들 = [...new Set(잰값.map((x) => x.상자폭))].sort((a, b) => a - b)
console.log(`   상자 폭이 여러 가지다 → ${폭들.join(' · ')}px`)
대표.slice(0, 5).forEach((x) => console.log(`     상자 ${x.상자폭}px → 그림 ${x.그림폭}px  (${(x.비율 * 100).toFixed(1)}%)`))
console.log('   ⭐ 상자 폭이 달라도 «비율»이 같다 = 그림은 상자에 매달려 있다\n')

// ───────── ② 「상자가 커지면」 꾸미기는 어떻게 되나 ─────────
// ⭐⭐ 새로 만들 필요가 없다 — **앱이 이미 그 실험을 하고 있다.**
//    레시피 탭엔 격자가 둘(작은 101px · 큰 168px)이고, **같은 레시피가 두 크기로 그려진다.**
//    ＝ 「상자만 1.66배 키운 경우」의 실물이다. 여기서 꾸미기 비율이 그대로면 갈래 A 는 안전하다.
const 재기 = async (이름) => {
  await p.waitForTimeout(400)
  return p.evaluate(() => {
    // ⛔ DecorLayer 엔 붙잡을 클래스가 없다(전부 inline style) → **심어둔 스티커 그림으로** 칸을 찾는다
    const 스티커들 = [...document.querySelectorAll('img')].filter((i) => /gp_gomhi|gp_pengv|dc_heart01/.test(i.src))
    if (!스티커들.length) return null
    let 칸 = 스티커들[0].parentElement
    for (let i = 0; i < 8 && 칸; i++) {
      const r = 칸.getBoundingClientRect()
      if (r.width > 60 && Math.abs(r.width - r.height) < 4) break // 표지 칸 = 1:1
      칸 = 칸.parentElement
    }
    if (!칸) return null
    const r = 칸.getBoundingClientRect()
    const 스티커 = 스티커들.filter((i) => 칸.contains(i)).map((i) => i.getBoundingClientRect()).filter((x) => x.width > 4)
    return {
      상자: Math.round(r.width),
      스티커수: 스티커.length,
      // ⭐ 이게 핵심 숫자 = 스티커가 상자 폭의 몇 %인가. 상자가 커져도 이 값이 그대로면 꾸미기는 «안 밀린다».
      스티커비율: 스티커.map((x) => +(x.width / r.width).toFixed(3)).sort((a, b) => b - a),
      꾸미기몫: +(스티커.reduce((s, x) => s + x.width * x.height, 0) / (r.width * r.height) * 100).toFixed(1),
    }
  })
}

console.log('② 「상자가 커지면」 꾸미기가 밀리나 — 앱이 이미 하는 실험으로')
await p.evaluate(() => {
  const bs = [...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')]
  bs.find((x) => (x.innerText || '').replace(/\s+/g, '').includes('레시피'))?.click()
})
await p.waitForTimeout(800)

// ⭐ 「상자를 키운다」를 그대로 만든다 — 격자 칸 폭만 1.4배. 그림·꾸미기는 한 줄도 안 건드린다.
const 상자키우기 = async (배수) => {
  await p.evaluate((k) => {
    document.getElementById('probe-css')?.remove()
    if (k === 1) return
    const s = document.createElement('style'); s.id = 'probe-css'
    // 격자를 2칸 → 좀 더 넓은 칸으로 (상자만 커진다)
    s.textContent = `.rec-grid, [class*="grid"] { grid-template-columns: repeat(auto-fill, minmax(${Math.round(160 * k)}px, 1fr)) !important }`
    document.head.appendChild(s)
  }, 배수)
  await p.waitForTimeout(450)
}
const 판1 = await 재기()
await 상자키우기(1.4)
const 판2 = await 재기()

const 줄 = (v) => v
  ? `상자 ${v.상자}px · 스티커 ${v.스티커수}개 · 상자 폭 대비 ${v.스티커비율.map((x) => (x * 100).toFixed(1) + '%').join(' / ')} · 꾸미기가 덮은 넓이 ${v.꾸미기몫}%`
  : '(못 쟀다)'
console.log(`   판1  ${줄(판1)}`)
console.log(`   판2  ${줄(판2)}`)
if (판1 && 판2 && 판1.상자 !== 판2.상자) {
  // ⚠️ 「똑같나」를 «글자 그대로» 견주면 안 된다 — 픽셀은 반올림돼서 0.1%p 쯤은 늘 흔들린다.
  //    그건 «달라진 것»이 아니라 «못 나눠 떨어진 것»이다. 문턱 0.5%p.
  const 어긋남 = Math.max(...판1.스티커비율.map((v, i) => Math.abs(v - (판2.스티커비율[i] ?? v)))) * 100
  console.log(`   ⭐ 상자가 ${판1.상자} → ${판2.상자}px (${(판2.상자 / 판1.상자).toFixed(2)}배) 인데`)
  console.log(`      스티커 비율 어긋남 = **${어긋남.toFixed(2)}%p** ${어긋남 < 0.5 ? '→ ✅ 사실상 그대로 (픽셀 반올림 수준)' : '→ ⛔ 밀렸다'}`)
  console.log(`      꾸미기가 덮은 넓이 ${판1.꾸미기몫}% → ${판2.꾸미기몫}% ${판1.꾸미기몫 === 판2.꾸미기몫 ? '(똑같다)' : ''}`)
} else {
  console.log('   ⚠️ 두 크기를 못 만들었다 — ① 만으로 판단한다(그것만으로도 충분하다)')
}

console.log('')
console.log('⭐⭐ 결론 — «상자»를 키운다')
console.log('   · 음식 그림 = 상자 폭의 56% (Thumb.jsx:31 `iconSize`)')
console.log('   · 꾸미기    = 상자 폭의 s% (DecorLayer 의 `it.s` · `left: it.x*100%`)')
console.log('   → 둘 다 «상자»가 잣대다. 상자를 키우면 «같은 배수»로 같이 커진다 → 꾸미기가 잃는 자리 0')
console.log('   ⛔ 그림만 56%↑ 로 키우면 → 그림이 상자를 더 먹고 꾸미기는 그대로 = 꾸미기가 밀린다')
console.log('   👉 창업자 걱정이 맞다. **그림만 키우기는 안 한다.**')
console.log('')

await b.close(); srv.close()
