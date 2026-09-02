// 📸 창업자 제보 넷 — 고친 자리를 «찍어서» 본다 (2026-08-23)
//
// 📮 창업자 =
//   ① *"자주해먹는요리 요리이모지들어간 그림 크기 다른칸이비해 작음. 조금만더크게수정."*
//   ② *"주부의장바구니 설명 계속올라와요.외부쇼핑몰로이어져요 나시 줄간줄이기."*
//      → 재판정 *"설명크기 좀 작게하자 기존크기대로 줄여도될듯"*
//   ③ *"쇼핑몰바로가기 크기키우기"*
//   ④ *"냉장고재료 유통기한 메모 한눈에보이게수정"*
//
// ⛔ 숫자만 보고 보내지 않는다(절대원칙 21) — 2026-08-11 에 숫자가 전부 초록불인데
//    보낸 시안 3장이 «온보딩 화면»이었다. 그래서 찍고 «열어본다».
//
// 실행: cd /home/user/hankki/hankki && node scripts/_shot-창업자넷-0823.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = join(ROOT, 'docs/시안/창업자넷-0823')
mkdirSync(OUT, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4393, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
await page.goto('http://127.0.0.1:4393/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(900)

// 🧊 ④ 의 자리 = «유통기한 ＋ 긴 메모»가 든 재료.
//   ⛔ `addInitScript` 로 심으면 앱이 뜨며 자기 초기값으로 덮는다(실측 = pantry 0개).
//   ✅ 앱이 한 번 뜬 «뒤»에 심고 다시 부른다.
await page.evaluate(() => {
  const k = 'hankki:v1'
  const db = JSON.parse(localStorage.getItem(k) || '{}')
  db.pantry = [
    { id: 'zz1', name: '김', icon: null, expiry: '2026-09-06', memo: '냉동실 문쪽 · 봉지 열었음', addedAt: Date.now() },
    { id: 'zz2', name: '두부', icon: null, expiry: '2026-08-28', memo: '개봉 후 물 갈아주기', addedAt: Date.now() },
    { id: 'zz3', name: '오징어', icon: null, expiry: null, memo: '', addedAt: Date.now() },
  ]
  localStorage.setItem(k, JSON.stringify(db))
})
// ⛔ 이 `reload` 는 **일부러**다 — 함정(「addInitScript 가 reload 때 저장값을 시드로 덮는다」)에 안 걸린다.
//    우리 `addInitScript` 둘은 «코치 봤음·온보딩 끝»만 심고 `hankki:v1` 은 건드리지 않는다.
//    그래서 위에서 심은 pantry 는 reload 를 타고 그대로 살아 온다(실측 = 세 줄이 다 뜬다).
//    ⭐ 여긴 「저장이 남나」를 재는 판이 아니라 «그려진 것을 찍는» 판이라 애초에 그 함정의 자리가 아니다.
await page.reload({ waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(1000)

const 덮였나 = () => page.evaluate(() => {
  const e = document.elementFromPoint(195, 420)
  return e ? (e.closest('.coach-mask, .onboard, .sheet-mask') ? '⛔덮임' : '✅안 덮임') : '?'
})

const 탭으로 = async (글자) => {
  await page.locator('.bottom-nav .nav-item').filter({ hasText: 글자 }).first().click()
  await page.waitForTimeout(800)
}
// ⛔ 머리글에 아이콘 «자식»이 있어 `children.length === 0` 으로는 못 찾았다(실측 = 후보 0개).
//    ✅ 글자를 «품은» 가장 안쪽 요소를 찾는다. 그래도 없으면 픽셀로 민다.
const 굴리기 = async (글자) => {
  const 됐나 = await page.evaluate((t) => {
    const 후보 = [...document.querySelectorAll('h1,h2,h3,div,span,p')].filter((e) => e.textContent.trim() === t)
    const h = 후보[후보.length - 1]
    if (!h) return false
    h.scrollIntoView({ block: 'center' })
    return true
  }, 글자)
  if (!됐나) await page.evaluate(() => { document.querySelector('.screen')?.scrollBy(0, 900) })
  await page.waitForTimeout(600)
  return 됐나
}

const 찍기 = async (이름) => {
  await page.screenshot({ path: join(OUT, `${이름}.png`), fullPage: false })
  return 이름
}

// ① 홈 — 자주 해먹는 요리
await 탭으로('홈')
await 굴리기('자주 해먹는 요리')
console.log('① 자주 해먹는 요리 ·', await 덮였나(), '→', await 찍기('1-자주해먹는'))

// ②③ 장보기 — 주부의 장바구니 설명 ＋ 쇼핑몰 바로가기
await 탭으로('장보기')
console.log('② 주부의 장바구니 설명 ·', await 덮였나(), '→', await 찍기('2-장바구니설명'))
await 굴리기('쇼핑몰 바로가기')
console.log('③ 쇼핑몰 바로가기 ·', await 덮였나(), '→', await 찍기('3-쇼핑몰바로가기'))

// ④ 냉장고
const 냉장고 = page.getByText('냉장고', { exact: true }).first()
if (await 냉장고.count()) { await 냉장고.click(); await page.waitForTimeout(900) }
// ⛔⛔ 첫 판이 «화면 맨 위»를 찍어서 정작 «재료 줄»이 한 개도 안 담겼다 (2026-08-23).
//    숫자(잘렸나)는 DOM 을 읽으니 초록불인데 **사진엔 볼 게 없었다** — 하마터면 그대로 보낼 뻔했다.
//    📌 절대원칙 21 = 「찍었다」가 아니라 «찍힌 것을 봤나». 재료 줄을 화면 가운데로 끌어온다.
await page.evaluate(() => { document.querySelector('.wish-row')?.scrollIntoView({ block: 'center' }) })
await page.waitForTimeout(500)
console.log('④ 냉장고 ·', await 덮였나(), '→', await 찍기('4-냉장고'))

// 🔢 잰 값도 같이 — 「보인다」를 눈과 숫자 둘로
// ⛔⛔ 잣대가 한 번 낡아서 «틀린 초록불»을 냈다 (2026-08-23) — 줄마다 `.t-sub` 를 **하나만** 읽었는데
//    ④ 를 고치며 「날짜 줄 ＋ 메모 줄」 **둘**로 갈랐다. 그래서 «날짜만» 재고 메모는 안 보고 ✅를 찍었다.
//    📌 규칙 18 ⓘ 그대로 — 「통과했나」가 아니라 «무엇을 보고 통과했나». 줄 안의 «전부»를 잰다.
const 잰것 = await page.evaluate(() => {
  return [...document.querySelectorAll('.wish-row')].slice(0, 3).map((r) => {
    const subs = [...r.querySelectorAll('.t-sub')]
    if (!subs.length) return null
    return subs.map((s) => ({
      글: s.innerText.trim().replace(/\n/g, ' ⏎ '),
      잘렸나: s.scrollHeight > s.clientHeight + 1 || s.scrollWidth > s.clientWidth + 1,
    }))
  }).filter(Boolean).flat()
})
console.log('\n🧊 냉장고 줄 — 잘렸나')
for (const r of 잰것) console.log(`   ${r.잘렸나 ? '⛔' : '✅'} ${r.글}`)
console.log(`\n📁 ${OUT}\n`)

await b.close(); srv.close()
