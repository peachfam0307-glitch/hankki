// 📔 홍보용 «틀 올린 일기» ＋ 🎴 «랜덤 카드» 샘플 (2026-08-20)
//
// 📮 창업자 = *"일기는 너무 휑해~ㅠ"* · *"틀을 올려서 적어줘."* · *"이거 지피티줄거라서"*
//    · *"꾸미는건 걔가해도되니까 틀에 일기 한줄 예쁘게 적어서줘"*
//    · *"레꾸자랑은 랜덤카드로..."*
//
// ⭐ 그래서 여기서 하는 건 **틀 ＋ 글**까지다. 스티커 꾸미기는 «지피티 몫»이라 안 한다.
//
// ⛔⛔ 시트가 열려 있으면 `.sheet-mask` 가 클릭을 통째로 가로챈다(2026-08-20 실측 —
//    「랜덤 카드로 뽑기」·「꾸미기」를 세 번 시도해 전부 TimeoutError).
//    ✅ 그래서 **DOM 에서 직접 `.click()`** 을 부른다 — 마스크는 «포인터»만 막지 이벤트는 안 막는다.
//
// 🔢 속지 층이 셋이다(`src/data/papers.js`) — ⑴선(무지·줄·모눈·도트) ⑵스킨(색) ⑶**틀**(그림)
//    창업자가 말한 「틀」 = ⑶. 스토어 스샷 05번과 같은 결 = **「사진 기록」(snap)**
//
// 실행: cd /home/user/hankki/hankki && node scripts/_shot-홍보샘플-일기틀-0820.mjs
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
await new Promise((r) => srv.listen(4386, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const 새페이지 = async () => {
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
  await page.addInitScript(SEED_COACH_SEEN)
  await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
  await page.goto('http://127.0.0.1:4386/hankki/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(900)
  return page
}
const 탭으로 = async (page, 글자) => {
  const t = page.locator('.bottom-nav .nav-item').filter({ hasText: 글자 }).first()
  if (!(await t.count())) return false
  await t.click(); await page.waitForTimeout(1300); return true
}

// ⭐ 마스크를 넘어 «DOM 에서 직접» 누른다 — 글자가 정확히 맞는 것 하나를 고른다
const 글자로눌러 = async (page, 글자, 기다림 = 1500) => {
  const 됐나 = await page.evaluate((t) => {
    const 것들 = [...document.querySelectorAll('button, [role="button"], .press')]
    const 맞는것 = 것들.find((e) => (e.textContent || '').replace(/\s+/g, ' ').trim().includes(t))
    if (!맞는것) return false
    맞는것.click(); return true
  }, 글자)
  if (됐나) await page.waitForTimeout(기다림)
  return 됐나
}

const 결과 = []

// ── ① 레꾸자랑 «랜덤 카드» ───────────────────────────────────
const p = await 새페이지()
p.on('pageerror', (e) => console.log('  ⚠️', String(e.message || e).split('\n')[0]))
if (await 탭으로(p, '레꾸자랑')) {
  const 콩국수 = p.locator('.grid-card, .album-tile').filter({ hasText: '콩국수' }).first()
  const 고를것 = (await 콩국수.count()) ? 콩국수 : p.locator('.grid-card, .album-tile').first()
  if (await 고를것.count()) {
    await 고를것.click(); await p.waitForTimeout(1800)
    if (await 글자로눌러(p, '랜덤 카드로 뽑기', 3000)) {
      await p.screenshot({ path: join(OUT, '09b-레꾸자랑-랜덤카드.png') })
      결과.push('09b-레꾸자랑-랜덤카드.png')
      console.log('  ✅ 랜덤 카드')
      // ⭐ 랜덤이라 판이 여럿이다 — 「다시 뽑기」로 한 장 더
      if (await 글자로눌러(p, '다시', 2600)) {
        await p.screenshot({ path: join(OUT, '09c-레꾸자랑-랜덤카드2.png') })
        결과.push('09c-레꾸자랑-랜덤카드2.png')
      }
    } else console.log('  ⛔ 「랜덤 카드로 뽑기」를 못 눌렀다')
  }
}
await p.close()

// ── ② 일기 — «틀» 올리고 한 줄 ───────────────────────────────
const p2 = await 새페이지()
p2.on('pageerror', (e) => console.log('  ⚠️', String(e.message || e).split('\n')[0]))
if (await 탭으로(p2, '일기')) {
  if (await 글자로눌러(p2, '오늘 일기 쓰기', 1800)) {
    // ✍️ 글부터 — 꾸미기 서랍이 열려 있으면 제목칸이 본문 textarea 에 가로막힌다(2026-08-20 실측)
    //    ⛔ 처음엔 「틀부터」로 짰는데 그건 내 짐작이었다. 실물이 순서를 정했다.
    const 제목칸0 = p2.locator('input[placeholder="제목"]').first()
    if (await 제목칸0.count()) { await 제목칸0.click(); await 제목칸0.fill('비빔국수'); await p2.waitForTimeout(600) }
    const 본문칸0 = p2.locator('textarea[placeholder="여기에 써요"]').first()
    if (await 본문칸0.count()) { await 본문칸0.click(); await 본문칸0.fill('더위에 지쳐도 한 끼는 챙겼다'); await p2.waitForTimeout(900) }

    if (await 글자로눌러(p2, '꾸미기', 2200)) {
      await p2.screenshot({ path: join(OUT, '_일기-꾸미기서랍.png') })
      // 속지 탭으로 — 「속지」·「종이」·「틀」 중 있는 것
      for (const 탭 of ['속지', '종이', '틀']) {
        if (await 글자로눌러(p2, 탭, 1400)) break
      }
      await p2.screenshot({ path: join(OUT, '_일기-속지탭.png') })
      // 틀 고르기 — 스토어 스샷과 같은 결
      for (const 틀 of ['사진 기록', '사진일기', '레시피 기록']) {
        if (await 글자로눌러(p2, 틀, 1800)) { console.log(`  ✅ 틀 「${틀}」`); break }
      }
      // 📷 사진 자리를 채운다 — 비어 있으면 「휑하다」가 그대로 남는다
      //    ⭐ 실제 음식 «사진»은 없으니 우리 음식 그림(fe_298 비빔국수)을 넣는다
      // ⛔ input[type=file] 에 «미리» setInputFiles 하면 안 먹는다(2026-08-20 실측 — 칸이 그대로 비었다).
      //    그 칸은 «누를 때» 파일 고르기가 뜨는 구조라, filechooser 를 «기다렸다가» 준다.
      p2.once('filechooser', (fc) => fc.setFiles(join(ROOT, 'src/assets/stickers/photo/fe_298.png')).catch(() => {}))
      await p2.evaluate(() => {
        const 것들 = [...document.querySelectorAll('*')]
        const 칸 = 것들.find((e) => (e.textContent || '').trim() === '사진 넣기')
        if (칸) (칸.closest('button') || 칸).click()
      })
      await p2.waitForTimeout(2600)
      // 서랍을 닫아 종이가 다 보이게 — 상단 「저장」이 편집을 끝낸다
      await p2.evaluate(() => {
        const 것들 = [...document.querySelectorAll('button')]
        const 저장 = 것들.find((e) => (e.textContent || '').trim() === '저장')
        if (저장) 저장.click()
      })
      await p2.waitForTimeout(2200)
    } else console.log('  ⛔ 「꾸미기」를 못 눌렀다')

    await p2.waitForTimeout(900)
    // 키보드를 내려 종이가 다 보이게
    await p2.keyboard.press('Escape').catch(() => {})
    await p2.locator('body').click({ position: { x: 10, y: 10 } }).catch(() => {})
    await p2.waitForTimeout(1200)

    await p2.screenshot({ path: join(OUT, '10-일기-틀올린판.png') })
    결과.push('10-일기-틀올린판.png')
    console.log('  ✅ 일기 (틀 ＋ 한 줄)')
  } else console.log('  ⛔ 「오늘 일기 쓰기」를 못 눌렀다')
}
await b.close(); srv.close()

console.log(`\n📸 ${결과.length}장 → ${OUT}`)
for (const f of 결과) console.log('   ·', f)
