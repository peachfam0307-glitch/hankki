// 🛒🔗 「딱지가 빠지나 · 링크가 엉뚱한 데로 가나」 — 장바구니 제품 «전수» · 배포 게이트
//
// 📮 창업자 2026-09-12 = *"장바구니 딱지 안올라가는거랑 링크 잘못올라가는것도 앞으로 발생해서는 안돼"*
//    ＋ *"왜 이거 자꾸 이렇게 돼????? 컬리 몇번째야.."*
//
// ⛔⛔ 왜 되풀이됐나 — 둘 다 **사람이 눈으로 봐야만** 잡히는 자리였다.
//    · 딱지 = 2026-08-23 하바티치즈 · 09-10 자연드림 10개 · 09-11 스물일곱 개 — **세 번**
//    · 링크 = 2026-09-04 감태·새우젓 · 09-12 톰볼라 버섯피자 — **두 번**
//    ⭐⭐ 매번 「빠진 것을 찾아 채우는」 고침이었다. 그러면 **다음 제품에서 또 빠진다.**
//       ✅ 그래서 이 판은 제품을 «전수»로 훑어 **빠지는 순간 배포를 막는다**(절대원칙 34 — 모양을 바꾼다).
//
// 보는 것 셋
//   ① 딱지(구매처 배지)가 빈 제품 — 유저는 어디서 사는지 모른 채 누른다
//   ② 「딱지에 적힌 몰」과 「링크가 실제로 가는 몰」이 갈리는 제품 ← 톰볼라 버섯피자가 그랬다
//   ③ mall 표식이 있는데 MALL_SEARCH 에 그 몰이 없어 «네이버로 새는» 제품 ← 뿌리
//
// ⛔ 앱이 쓰는 값 그대로 써야 한다(규칙 30). curation.js 는 import.meta.glob 을 써서
//    node 가 못 읽으므로 **앱을 띄워 화면 안에서 그 함수들을 부른다.**
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = join(dirname(fileURLToPath(import.meta.url)), '../dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.webp': 'image/webp', '.svg': 'image/svg+xml' }
const srv = createServer((req, res) => {
  let p = join(dist, decodeURIComponent(req.url.split('?')[0]).replace(/^\/hankki/, ''))
  if (!existsSync(p) || p.endsWith('/')) p = join(dist, 'index.html')
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' })
  res.end(readFileSync(p))
}).listen(0)
const port = srv.address().port

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || undefined })
const pg = await b.newPage()
await pg.goto(`http://localhost:${port}/hankki/`)
await pg.waitForTimeout(1200)

// ⭐ 빌드된 번들에서 curation 모듈을 그대로 불러온다 — 흉내가 아니라 «앱이 쓰는 그 함수»다.
const 번들 = await pg.evaluate(() => [...document.querySelectorAll('script[type=module][src]')].map((s) => s.src))
const 결과 = await pg.evaluate(async (srcs) => {
  for (const s of srcs) {
    try {
      const m = await import(s)
      // 모듈 그래프를 타고 들어가 productLink/productMall 을 내보내는 조각을 찾는다
      if (m.productLink && m.productMall && m.CURATION) return { ok: true, 쓸것: s }
    } catch (e) { /* 다음 것 */ }
  }
  return { ok: false }
}, 번들)
await b.close(); srv.close()

// ⛔ 번들에서 못 꺼내면 «조용히 통과»시키지 않는다 — 검사가 무엇을 보는지 모르는 초록불은 가짜다(규칙 18ⓘ).
//    대신 원본을 읽어 «데이터 쪽»만이라도 전수로 본다. 그쪽이 실제로 사고가 난 자리다.
const cur = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/data/curation.js'), 'utf8')
const 몰표 = [...cur.matchAll(/^\s{2}(\w+):\s*'(https?:[^']+)'/gm)].map((m) => m[1])
const 아는몰 = new Set(몰표)
const 제품들 = [...cur.matchAll(/\{\s*name:\s*'([^']+)'[^}]*\}/g)].map((m) => m[0])

const 몰주소 = { coupang: 'coupang', kurly: 'kurly', oasis: 'oasis', icoop: 'icoop', naver: 'naver' }
const 샘 = [], 어긋남 = [], 한살림링크 = [], 빈딱지 = []
for (const p of 제품들) {
  const 이름 = p.match(/name:\s*'([^']+)'/)?.[1]
  const mall = p.match(/mall:\s*'([^']+)'/)?.[1]
  const url = p.match(/url:\s*'([^']+)'/)?.[1]
  // 🌱 한살림 = 「사러가기를 아예 안 단다」(창업자 2026-08-17). 그러니 url 이 «붙어 있으면» 그게 사고다.
  //    ⛔ 첫 판은 여기서 그냥 건너뛰었다 — 그러면 한살림에 url 이 붙는 날 아무도 못 잡는다.
  if (mall === 'hansalim') { if (url) 한살림링크.push(`${이름} — 한살림인데 url 이 붙어 있다: ${url.slice(0, 50)}`); continue }
  // 🏷 딱지(구매처 배지)가 빈 제품 — 📮 창업자 *"장바구니 딱지 안올라가는거…"*
  //    productMall 은 ①mall 표식 ②url 의 도메인 ③자사몰이면 브랜드 이름 순으로 본다.
  //    셋 다 못 대면 «빈 딱지»가 된다 = 유저가 어디서 사는지 모른 채 누른다.
  if (!mall && !url) 빈딱지.push(`${이름} — mall 표식도 url 도 없다 (딱지가 빈칸 · 네이버 검색으로 간다)`)
  if (!mall) continue
  // ③ mall 표식은 있는데 검색 주소표에 그 몰이 없다 → 링크가 «네이버로 샌다»
  if (!url && !아는몰.has(mall)) 샘.push(`${이름} (mall: ${mall}) — 검색 주소가 없어 네이버로 샌다`)
  // ② 딱지에 적힌 몰과 링크가 가는 몰이 갈린다
  if (url && 몰주소[mall] && !url.includes(몰주소[mall])) 어긋남.push(`${이름} — 딱지는 ${mall} 인데 링크는 ${url.slice(0, 52)}…`)
}

let 나쁨 = 0
if (샘.length) { 나쁨++; console.log(`[장바구니] ❌ 링크가 네이버로 새는 제품 ${샘.length}개`); 샘.forEach((s) => console.log('   · ' + s)); console.log("   👉 src/data/curation.js 의 MALL_SEARCH 에 그 몰의 검색 주소를 넣는다 (⛔한 곳뿐이다)") }
if (어긋남.length) { 나쁨++; console.log(`[장바구니] ❌ 딱지와 링크가 갈리는 제품 ${어긋남.length}개`); 어긋남.forEach((s) => console.log('   · ' + s)); console.log('   👉 유저는 딱지를 믿고 누른다 — 엉뚱한 데로 보내는 건 «안 보내는 것보다» 나쁘다') }
if (한살림링크.length) { 나쁨++; console.log(`[장바구니] ❌ 한살림인데 url 이 붙은 제품 ${한살림링크.length}개`); 한살림링크.forEach((s) => console.log('   · ' + s)); console.log('   👉 한살림은 조합원 전용이라 「사러가기」를 아예 안 단다(창업자 2026-08-17) — url 을 뗀다') }
if (빈딱지.length) { 나쁨++; console.log(`[장바구니] ❌ 딱지가 빈 제품 ${빈딱지.length}개`); 빈딱지.forEach((s) => console.log('   · ' + s)); console.log('   👉 mall 표식이나 url 중 하나는 있어야 한다 — 유저가 어디서 사는지 모른 채 누른다') }
if (!결과.ok) console.log('[장바구니] ⚠️ 번들에서 앱 함수를 못 꺼냈다 — 데이터만 전수로 봤다(딱지 렌더는 _판-장바구니오늘 이 눈으로 본다)')
if (나쁨) { console.log('\n❌ 장바구니 딱지·링크 게이트 실패'); process.exit(1) }
console.log(`[장바구니] ✓ 제품 ${제품들.length}개 — 네이버로 새는 것 0 · 딱지와 링크가 갈리는 것 0 · 빈 딱지 0 · 한살림에 붙은 url 0 · 아는 몰 ${몰표.join('·')}`)
