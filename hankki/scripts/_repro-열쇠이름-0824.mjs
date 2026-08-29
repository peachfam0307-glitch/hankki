// 🔑 「레시피열쇠」 이름이 «세 화면 전부»에 들어갔나 (창업자 확정 2026-08-24) 〔반영됨〕
//
// 📮 창업자 = 후보 10개를 실물 화면에 얹어 본 뒤 *"열쇠나 국자..가 젤 나은것같아"* → 근거를 보고 **"가"**
//
// ⭐⭐ 이 판의 심장 = **화면에 그려진 글자에 옛 이름이 «한 글자도» 안 남았나.**
//    ⛔ 소스를 grep 하면 «주석에 적어둔 옛 문구»까지 걸려 고쳐놓고도 실패로 나온다(규칙 18 ⓘ ·
//       v11.19 링크정직 판에서 실제로 그랬다). 그래서 `innerText` 만 본다.
//
// ⛔⛔ **왜 세 화면을 다 보나** — 이름이 뜨는 곳이 「가져오기」 하나가 아니다(실측):
//    ⑴ 가져오기 = 잔량 카드 ＋ 방법 카드 다섯의 꼬리 ⑵ 레시피 편집 = 캡처 소모 안내 ⑶ 냉장고 영수증
//    📌 이게 「국자」를 접은 근거이기도 하다 — 「퍼온다」가 영수증 읽기에선 뜻이 안 맞았다.
//    한 화면만 고치면 v11.02 「책갈피」 때처럼 **말이 갈라진다**(그땐 일곱 곳이었다).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-열쇠이름-0824.mjs
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
await new Promise((r) => srv.listen(4419, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch { /* noop */ } })
const page = await ctx.newPage()
const 칸 = []
const 재기 = (이름, 참) => { 칸.push([이름, !!참]); console.log(`  ${참 ? '✅' : '⛔'} ${이름}`) }

// ⛔ 옛 이름 = 「AI 스캔」 ＋ 「N회」 ＋ 「소모」. 셋 다 화면에서 사라져야 한다.
const 옛말 = (t) => {
  const 걸린것 = []
  if (/AI\s*스캔/.test(t)) 걸린것.push('AI 스캔')
  if (/\d\s*회(?!\s*차)/.test(t)) 걸린것.push('N회')
  if (/소모/.test(t)) 걸린것.push('소모')
  return 걸린것
}
const 탭가기 = async (이름) => {
  await page.evaluate((n) => {
    const t = [...document.querySelectorAll('button, a')].find((e) => (e.getAttribute('aria-label') || e.textContent || '').trim().startsWith(n))
    t?.click()
  }, 이름)
  await page.waitForTimeout(1100)
}

await page.goto('http://127.0.0.1:4419/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(900)

// ── ⑴ 가져오기 ────────────────────────────────────────────
await 탭가기('가져오기')
await page.screenshot({ path: '/tmp/열쇠-1가져오기.png', clip: { x: 0, y: 96, width: 390, height: 470 } })
const 가져오기 = await page.evaluate(() => document.body.innerText || '')
재기('가져오기 화면을 열었다', /레시피를 가져오는 방법/.test(가져오기))
재기('잔량 줄이 「무료 레시피열쇠 20개 남았어요」', /무료\s*레시피열쇠\s*20개\s*남았어요/.test(가져오기.replace(/\s+/g, ' ')))
재기('작은 줄도 「20개예요 · 매달 무료 5개」', /드리는\s*20개예요/.test(가져오기) && /매달\s*무료\s*5개/.test(가져오기))
재기('방법 카드 꼬리가 「열쇠 1개」', /열쇠\s*1개/.test(가져오기))
재기('안 드는 길은 「열쇠 0개」', /열쇠\s*0개/.test(가져오기))
{
  const 걸림 = 옛말(가져오기)
  재기(`가져오기에 옛 이름이 «없다» ${걸림.length ? `(${걸림.join('·')})` : ''}`, 걸림.length === 0)
}

// ── ⑵ 레시피 편집(캡처) ───────────────────────────────────
// ⛔ 「사진 · 직접 작성하기」 카드로 들어간다 — 이 화면이 캡처 소모 안내를 그린다
await page.evaluate(() => {
  const t = [...document.querySelectorAll('button')].find((x) => /사진\s*·\s*직접 작성하기/.test(x.innerText || ''))
  t?.click()
})
await page.waitForTimeout(1300)
await page.screenshot({ path: '/tmp/열쇠-2편집.png', clip: { x: 0, y: 0, width: 390, height: 430 } })
const 편집 = await page.evaluate(() => document.body.innerText || '')
재기('편집 화면을 열었다', /재료|만드는 법/.test(편집))
재기('편집 안내가 「사진 1장에 열쇠 1개를 써요」', /사진\s*1장에\s*열쇠\s*1개를\s*써요/.test(편집.replace(/\s+/g, ' ')))
{
  const 걸림 = 옛말(편집)
  재기(`편집 화면에 옛 이름이 «없다» ${걸림.length ? `(${걸림.join('·')})` : ''}`, 걸림.length === 0)
}

// ── ⑶ 냉장고 영수증 ───────────────────────────────────────
// ⛔⛔ **냉장고는 하단 탭이 «아니다» — 「장보기」 안에 있다**(실측 = 하단 탭 여섯 = 홈·가져오기·레시피·일기·장보기·레꾸자랑).
//    첫 판이 곧장 「냉장고」를 눌러 화면에 못 갔는데 **그 뒤 「옛 이름이 없다」가 ✅로 나왔다** —
//    ⭐ 안 간 화면엔 당연히 옛 이름도 없다. **통과했는데 아무것도 안 쟀다**(규칙 18 ⓘ).
//    ✅ 그래서 아래는 «도착했나»를 먼저 재고, 못 갔으면 그 뒤를 초록불로 만들지 않는다.
// ⛔ 「가져오기」는 «전체화면»이라 하단바가 없다(왼쪽 위 ✕ 하나뿐) — goBack 으로 돌아와도 탭을 못 누른다.
//    (2026-08-24 실측 · 화면을 찍어 보고서야 알았다 — 절대원칙 21)
//    ✅ 그래서 아예 처음부터 다시 연다. 홈에서 출발해야 하단바가 있다.
await page.goto('http://127.0.0.1:4419/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(900)
await 탭가기('장보기')
await 탭가기('냉장고')
// 「영수증 베타」를 눌러야 담기 화면이 열린다(실측 = 버튼 이름에 「베타」가 붙어 있다)
await page.evaluate(() => {
  const t = [...document.querySelectorAll('button')].find((x) => /영수증/.test(x.innerText || ''))
  t?.click()
})
await page.waitForTimeout(1200)
await page.screenshot({ path: '/tmp/열쇠-3영수증.png', clip: { x: 0, y: 230, width: 390, height: 340 } })
const 냉장고 = await page.evaluate(() => document.body.innerText || '')
const 도착 = /영수증/.test(냉장고) && /갤러리에서 영수증|영수증 1장에/.test(냉장고)
재기('영수증 화면을 열었다', 도착)
재기('영수증 안내가 「영수증 1장에 열쇠 1개를 써요」', /영수증\s*1장에\s*열쇠\s*1개를\s*써요/.test(냉장고.replace(/\s+/g, ' ')))
{
  const 걸림 = 옛말(냉장고)
  // ⭐ 못 갔으면 «판정하지 않는다» — 「없다」가 아니라 「내가 못 봤다」이기 때문(규칙 18)
  재기(`영수증 화면에 옛 이름이 «없다» ${도착 ? (걸림.length ? `(${걸림.join('·')})` : '') : '⛔화면에 못 가서 판정 안 함'}`, 도착 && 걸림.length === 0)
}

// ⭐ 이름을 «한 곳에서» 읽나 — 화면 코드에 글자로 박으면 다음에 또 갈라진다
const 박힌곳 = await page.evaluate(() => 0) // 소스 검사는 아래에서 파일로 한다
void 박힌곳
const 소스 = ['src/screens/ImportScreen.jsx', 'src/screens/EditorScreen.jsx', 'src/components/PantryView.jsx', 'src/App.jsx']
  .filter((f) => {
    const t = readFileSync(join(ROOT, f), 'utf8')
    // 주석 줄은 뺀다 — 경위를 적어 두는 건 정상이다
    return t.split('\n').some((l) => !/^\s*(\/\/|\*|\/\*)/.test(l) && /'[^']*레시피열쇠[^']*'|"[^"]*레시피열쇠[^"]*"/.test(l))
  })
재기(`이름을 화면 코드에 «글자로» 안 박았다 ${소스.length ? `(${소스.join(', ')})` : ''}`, 소스.length === 0)

await page.screenshot({ path: '/tmp/열쇠이름-반영.png' })
const 좋 = 칸.filter(([, v]) => v).length
console.log(`\n📷 /tmp/열쇠이름-반영.png`)
console.log(`${좋 === 칸.length ? '✅' : '⛔'} ${좋}/${칸.length}`)
await b.close(); srv.close()
process.exit(좋 === 칸.length ? 0 : 1)
