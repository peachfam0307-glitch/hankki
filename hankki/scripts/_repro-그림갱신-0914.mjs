// 🖼 기본 레시피 «그림을 바꿨는데 폰에서 안 바뀐다» — 재현판 (2026-09-14)
//
// 📮 창업자 = *"간장제육안들어감"* → (그림 바꿔 v13.37 배포 · deploy success) → *"13.37이야"*
//    ＋ 캡처 = **여전히 빨간 제육**
//
// ⭐⭐ **무엇을 재나** — 옛 저장본(앞 버전 ＋ 옛 그림)을 «폰처럼» 심고 앱을 켜서
//    그림이 새것으로 갈아끼워지나를 본다. 「배포됐나」가 아니라 «폰이 받나»다.
//    📌 배포는 이미 success 였다 — 그런데도 화면이 그대로였다. 그 사이 어딘가가 막고 있다.
//
// ⛔ 소스 grep 으로 재지 않는다 — 이건 «저장본이 갈아끼워지나»라 실제로 켜 봐야 안다(절대원칙 18 ⓘ·30).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-그림갱신-0914.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, '')
  if (p === '/' || p === '') p = '/index.html'
  let b, t = MIME[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4493, r))

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const 씨 = basicRecipes.find((r) => r.id === 'basic-ganjang-jeyuk')

let 통과 = 0, 실패 = 0
const 실패목록 = []
const chk = (이름, 값, 기대) => {
  const ok = String(값) === String(기대)
  console.log(`  ${ok ? '✅' : '⛔'} ${이름}${ok ? '' : `\n       나온 값 = ${값}  ·  기대 = ${기대}`}`)
  ok ? 통과++ : (실패++, 실패목록.push(이름))
}

console.log('\n🖼 그림을 바꾸면 «이미 깔린 폰»도 받나\n')

console.log('① 저장소 쪽 — 씨앗이 새 그림을 들고 있나')
chk('씨앗 icon 이 새 그림이다', 씨 && 씨.icon, 'gr_257')
chk('BASICS_VERSION 이 140 이상이다', BASICS_VERSION >= 140, 'true')

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// 🧪 폰을 흉내 낸다 — 앞 버전(seedV) ＋ 옛 그림(gr_254)이 저장돼 있다
const 켜보기 = async (손댔나) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
  await ctx.addInitScript(SEED_COACH_SEEN)
  const 심을것 = { ...씨, icon: 'gr_254', ...(손댔나 ? { touched: 1 } : {}) }
  await ctx.addInitScript(([편, 앞버전]) => {
    try {
      localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
      localStorage.setItem('hankki:v1', JSON.stringify({ recipes: [편], diary: [], seedV: 앞버전 }))
    } catch { /* noop */ }
  }, [심을것, BASICS_VERSION - 1])
  const p = await ctx.newPage()
  await p.goto('http://127.0.0.1:4493/hankki/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(1800)
  const 뒤 = await p.evaluate(() => {
    try {
      const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
      const r = (s.recipes || []).find((x) => x.id === 'basic-ganjang-jeyuk')
      return { icon: r ? r.icon : '(그 편이 없다)', seedV: s.seedV }
    } catch (e) { return { icon: 'X' + e.message, seedV: 0 } }
  })
  await ctx.close()
  return 뒤
}

console.log('\n② ⭐이미 깔린 폰(앞 버전 · 옛 그림) — 앱을 켜면 갈아끼워지나')
const 안손댐 = await 켜보기(false)
chk('⭐ 그림이 새것으로 갈아끼워진다', 안손댐.icon, 'gr_257')
chk('   버전도 최신으로 올라간다', 안손댐.seedV, String(BASICS_VERSION))

// ───────── ③ 「손댄 편」도 고쳐지나 ─────────
//   ⭐ 씨앗 다시 맞추기는 `r.touched` 면 그 편을 건너뛴다(유저가 고친 것을 지킨다).
//      ⛔ 그것만 있으면 손댄 편은 무엇을 배포해도 그림이 영영 안 바뀐다.
//   ✅ 그래서 «제목으로 강제로 갈아끼우는 표»가 따로 있고, 그건 touched 와 상관없이 돈다.
//      📌 그 표가 있는 이유 = 「이미 폰에 틀린 값이 저장됐다」를 되돌리려고(규칙 18 ⓙ).
//      ⛔ 그래서 그 표가 곧 «제일 센 자리»다 — 그림을 바꿀 땐 여기부터 맞춘다.
console.log('\n③ 「손댄 편」도 고쳐진다 (제목으로 강제하는 표는 touched 와 상관없이 돈다)')
const 손댐 = await 켜보기(true)
chk('⭐ 손댄 편도 새 그림을 받는다', 손댐.icon, 'gr_257')

await b.close(); srv.close()
console.log(`\n${실패 ? '⛔' : '✅'} ${통과}/${통과 + 실패}`)
if (실패) console.log('   ' + 실패목록.join('\n   '))
console.log()
process.exit(실패 ? 1 : 0)
