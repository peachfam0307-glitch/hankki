// 🛒 **릴스에 쓸 「주부의 장바구니」 앱 카드를 실물 그대로 뽑는다** (2026-09-11)
//
// 📮 창업자 = *"아니..우리ui를 넣어야징.."* ＋ *"내가 설명한 것들도 보여주고.."*
// ⛔ 1판은 제품 그림만 놓고 글을 내가 다시 썼다 — **앱이 한 번도 안 나왔다.**
//    릴스는 앱을 알리는 것이다. 그리고 창업자가 쓴 설명은 «앱 카드 안에 이미» 다 있다.
//
// ⭐ 그래서 **앱을 띄워 카드를 «펼친 채로» 잘라낸다** — 글을 옮겨 적지 않는다(옮기면 어긋난다).
// 🗓 시계를 2026-09-12(토)로 옮겨 찍는다 — 그날 열리는 셋이 「이번 주 픽」에 뜬다.
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = '/home/user/hankki/hankki'
const DIST = join(ROOT, 'dist')
const 낼곳 = process.env.CARD_DIR || '/tmp/큐레카드'
mkdirSync(낼곳, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4425, r))

const { SEED_COACH_SEEN } = await import(join(ROOT, 'src/coach.js'))
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
// 📐 3배로 찍는다 — 릴스 폭 1080 에 카드를 900px 로 쓰니 **줄여서** 쓰는 셈이라 선명하다
//    ⛔ 키워 쓰면 뭉갠다(2026-09-03 *"너무 지저분해보여"*)
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Seoul', deviceScaleFactor: 3 })
const p = await ctx.newPage()
await p.addInitScript(SEED_COACH_SEEN)
await p.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
  // 🗓 «내일»로 옮긴 시계 — ⛔앱 코드는 안 건드린다. 브라우저 쪽에서만 속인다.
  const 진짜 = Date
  const 옮김 = new 진짜('2026-09-12T10:00:00+09:00').getTime() - 진짜.now()
  window.Date = class extends 진짜 {
    constructor(...a) { if (a.length === 0) super(진짜.now() + 옮김); else super(...a) }
    static now() { return 진짜.now() + 옮김 }
  }
})
await p.goto('http://127.0.0.1:4425/', { waitUntil: 'networkidle' })
await p.click('text=장보기'); await p.waitForTimeout(1000)

// 📖 「더보기」를 다 펼친다 — ⛔접힌 채로 찍으면 «창업자가 쓴 설명»이 잘린다(그게 이 릴스의 전부다)
for (let i = 0; i < 14; i++) {
  const 더 = p.locator('text=더보기').first()
  if (!(await 더.count())) break
  try { await 더.click({ timeout: 1200 }) } catch { break }
  await p.waitForTimeout(150)
}
await p.waitForTimeout(500)

let 나쁨 = 0
const 말 = (ok, s, 덤 = '') => { if (!ok) 나쁨++; console.log(`${ok ? '✅' : '⛔'} ${s}${덤 ? ' — ' + 덤 : ''}`) }

// 🎯 이번 주 셋 — `curation.js` 의 from:'2026-09-12' 그대로
// 📮 창업자 확정 2026-09-11 = *"김치콩비지 기버터 피자 넣자. 이번주"*
//    ⭐ 1:1 로 자리를 바꿨다(들기름막국수·낫또는 뒤로) — 한 주도 비지 않는다.
// 📮 ＋ 창업자가 콕 집은 것 = *"초피액젓, 진간장, 맛간장, 고추장 … 어묵. 햄 이런 것도"*
//    ⛔ 고추장은 큐레이션에 한 개도 없다(실측) → 창업자 = *"고추장은 우선 패스하자"*
//    🔒 조합원 전용(한살림)·올리브오일은 뺀다 — *"일반인들이 쉽게 살수있는 것 위주로"* · *"오일이런거 빼고"*
const 목록 = {
  // 🚨 내일(2026-09-12 토) 열리는 셋 — «전수 검수» 대상
  ghee: '기버터', kimchibiji: '김치콩비지찌개', pizza: '버섯피자',
  // 🛒 릴스에 같이 보여줄 것 (이미 열려 있다)
  jinganjang: '우리콩 진간장', matganjang: '맛간장', chopi: '초피액젓',
  eomuk: '바른어묵', ham: '슬라이스햄', bienna: '문어 비엔나',
  daepa: '대파소금', ori: '자연누리 훈제오리', gochu: '고춧가루',
  makguksu: '들기름막국수', natto: '낫또',
}
const 찾을것 = (process.env.CARDS || 'ghee,kimchibiji,pizza').split(',')
  .map((k) => (목록[k.trim()] ? { 키: k.trim(), 말머리: 목록[k.trim()] } : null)).filter(Boolean)

for (const { 키, 말머리 } of 찾을것) {
  const 카드 = p.locator('.cur-card', { hasText: 말머리 }).first()
  말(await 카드.count() > 0, `「${말머리}」 카드를 찾았다`)
  if (!(await 카드.count())) continue
  // ⬆️ **화면 «가운데»로 올리고 찍는다** — ⛔`scrollIntoViewIfNeeded` 는 «보이기만 하면» 안 움직인다.
  //    그래서 카드가 화면 맨 아래에 걸린 채로 찍혀 **「담기·사러가기」가 탭바에 잘렸다**(1판 실측).
  await 카드.evaluate((el) => el.scrollIntoView({ block: 'center' }))
  await p.waitForTimeout(400)
  // ⛔ 접혀 있으면 찍지 않는다 — 「접기」가 보여야 펼쳐진 것이다
  const 펼침 = await 카드.locator('text=접기').count()
  말(펼침 > 0, `「${말머리}」 설명이 펼쳐져 있다`, 펼침 ? '' : '아직 「더보기」 상태다')
  await 카드.screenshot({ path: join(낼곳, `${키}.png`) })
  const 글 = (await 카드.innerText()).replace(/\n+/g, ' ').slice(0, 90)
  console.log(`   📸 ${키}.png — ${글}…`)
}

// 🏷 훅에 쓸 «앱 머리» — 「주부의 장바구니 · 18년차 주부의 추천 아이템」이 실제로 앱에 있다
const 머리 = p.locator('.shop-cur').first()
if (await 머리.count()) {
  await 머리.scrollIntoViewIfNeeded(); await p.waitForTimeout(300)
  await 머리.screenshot({ path: join(낼곳, '머리.png') })
  console.log(`   📸 머리.png — ${(await 머리.innerText()).replace(/\n+/g, ' ').slice(0, 60)}…`)
}
말(true, '앱 머리(주부의 장바구니)도 뽑았다')

await b.close(); srv.close()
console.log(나쁨 ? `\n⛔ ${나쁨}칸 빨간불` : '\n✅ 전부 초록불')
process.exit(나쁨 ? 1 : 0)
