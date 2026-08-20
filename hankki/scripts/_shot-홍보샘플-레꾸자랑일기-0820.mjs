// 🎴📔 홍보용 «레꾸자랑 카드» ＋ «꾸민 일기» 샘플 (2026-08-20)
//
// 📮 창업자 = *"우리 레꾸자랑 샘플 컷이랑 일기샘플컷 줄래??"*
//
// ⛔ 갓 깐 앱은 **일기가 비어 있다**("아직 기록이 없어요") — 홍보물엔 못 쓴다.
//    그래서 일기를 «만들어서» 찍는다. 냉장고 채운판과 같은 생각.
// ⭐ UI 로 만든다 — localStorage 를 직접 만지면 앱이 실제로 쓰는 모양과 어긋날 수 있다
//    (v11.00 의 addShopItem 이 «모르는 필드를 말없이 버린» 사고와 같은 뿌리).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_shot-홍보샘플-레꾸자랑일기-0820.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홍보/앱화면'
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
await new Promise((r) => srv.listen(4384, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const 새페이지 = async () => {
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
  await page.addInitScript(SEED_COACH_SEEN)
  await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
  await page.goto('http://127.0.0.1:4384/hankki/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(900)
  return page
}
const 탭으로 = async (page, 글자) => {
  const t = page.locator('.bottom-nav .nav-item').filter({ hasText: 글자 }).first()
  if (!(await t.count())) return false
  await t.click(); await page.waitForTimeout(1300); return true
}
const 눌러 = async (page, 이름, 기다림 = 1200) => {
  const btn = page.getByRole('button', { name: 이름 }).first()
  if (!(await btn.count())) return false
  await btn.scrollIntoViewIfNeeded().catch(() => {})
  await btn.click(); await page.waitForTimeout(기다림); return true
}

const 결과 = []

// ── ① 레꾸자랑 — 꾸민 표지를 자랑하는 카드 ───────────────────
const p = await 새페이지()
p.on('pageerror', (e) => console.log('  ⚠️', String(e.message || e).split('\n')[0]))
if (await 탭으로(p, '레꾸자랑')) {
  // 꾸민 표지가 있는 편(콩국수)을 고른다 — 자랑 카드는 «꾸민 것»이 주인공이다
  const 콩국수 = p.locator('.grid-card, .album-tile').filter({ hasText: '콩국수' }).first()
  const 고를것 = (await 콩국수.count()) ? 콩국수 : p.locator('.grid-card, .album-tile').first()
  if (await 고를것.count()) {
    await 고를것.click(); await p.waitForTimeout(1800)
    await p.screenshot({ path: join(OUT, '09-레꾸자랑-고르기.png') })
    결과.push('09-레꾸자랑-고르기.png')
    // ⛔ 「내가 꾸민 표지 그대로」는 «공유»로 바로 나가서 화면에 안 남는다(2026-08-20 실측 —
    //    눌렀더니 시트가 닫히고 목록으로 돌아왔다). 카드를 «보려면» 랜덤 카드 쪽이다.
    // ⛔ 시트가 열려 있으면  가 클릭을 가로챈다 → 시트 «안»에서 찾는다
    const 랜덤 = p.locator('.sheet, [class*="sheet"]').getByText('랜덤 카드로 뽑기', { exact: false }).first()
    if (await 랜덤.count()) {
      await 랜덤.click({ force: true }); await p.waitForTimeout(2800)
      await p.screenshot({ path: join(OUT, '09b-레꾸자랑-랜덤카드.png') })
      결과.push('09b-레꾸자랑-랜덤카드.png')
    }
    console.log('  ✅ 레꾸자랑')
  } else console.log('  ⛔ 자랑할 레시피를 못 찾았다')
}
await p.close()

// ── ② 일기 — 만들어서 찍는다 ─────────────────────────────────
const p2 = await 새페이지()
p2.on('pageerror', (e) => console.log('  ⚠️', String(e.message || e).split('\n')[0]))
if (await 탭으로(p2, '일기')) {
  if (await 눌러(p2, /오늘 일기 쓰기/, 1600)) {
    // 글을 적는다 — 홍보물에 나가니 우리 말투(해요체)로
    // 🔢 실측한 글칸 = INPUT[제목] · TEXTAREA[여기에 써요]  (scripts/_probe-일기쓰기-0820.mjs)
    // ⭐ 문장은 스토어 스샷 05번과 «같은 것»을 쓴다 — 홍보물끼리 말이 갈리면 안 된다
    const 제목칸 = p2.locator('input[placeholder="제목"]').first()
    if (await 제목칸.count()) { await 제목칸.click(); await 제목칸.fill('비빔국수'); await p2.waitForTimeout(500) }
    const 본문칸 = p2.locator('textarea[placeholder="여기에 써요"]').first()
    if (await 본문칸.count()) {
      await 본문칸.click()
      await 본문칸.fill('더위에 지쳐도 한 끼는 챙겼다')
      await p2.waitForTimeout(900)
    } else console.log('  ⚠️ 일기 쓰는 칸을 못 찾았다')
    await p2.screenshot({ path: join(OUT, '10-일기-쓰는중.png') })
    결과.push('10-일기-쓰는중.png')
    // ⭐ 민무늬 종이는 홍보에 심심하다 — 「꾸미기」에서 속지를 고른다
    const 꾸미기단추 = p2.getByText('꾸미기', { exact: true }).first()
    if ((await 꾸미기단추.count()) && (await 꾸미기단추.click().then(() => p2.waitForTimeout(2200)).then(() => true).catch(() => false))) {
      await p2.screenshot({ path: join(OUT, '10b-일기-꾸미기.png') })
      결과.push('10b-일기-꾸미기.png')
    }
    // 저장하면 목록으로 — 쌓인 모습이 홍보엔 더 좋다
    if (await 눌러(p2, /^저장$|저장하기|완료/, 1800)) {
      await p2.screenshot({ path: join(OUT, '11-일기-저장뒤.png') })
      결과.push('11-일기-저장뒤.png')
      console.log('  ✅ 일기 (쓰는 중 ＋ 저장 뒤)')
    } else {
      console.log('  ⚠️ 저장 단추를 못 찾았다 — 쓰는 중 화면만 찍었다')
    }
  } else console.log('  ⛔ 「오늘 일기 쓰기」를 못 찾았다')
}
await b.close(); srv.close()

console.log(`\n📸 ${결과.length}장 → ${OUT}`)
for (const f of 결과) console.log('   ·', f)
