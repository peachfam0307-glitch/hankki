// 📸 「완성 사진」 체크가 «어떻게 떠 있나» — 창업자에게 물어보려고 찍는다 (2026-08-23)
//
// 📮 창업자 = "asCover 기본값 = decor(레꾸)가 있으면 꺼짐 (67줄)
//    → 레꾸한 레시피는 체크가 처음부터 꺼져 있다. 이게 창업자가 본 증상의 원인일 수 있다.
//    ⛔ 짐작이다 — 창업자 폰에서 그 체크가 어떻게 떴는지 «먼저 물어볼 것»(규칙 25)."
//
// ⭐⭐ 그래서 이 판은 «고치려고» 만든 게 아니다. **물어볼 그림**을 만든다.
//    2026-08-21 에 「단추 자리」를 말로 물었다가 창업자가 *"단추자리??"* · *"B는 안보이는데"* 라고 했다.
//    📌 말로 묻지 말고 **실물을 보여주고** 묻는다.
//
// 찍는 것 넷
//    ① 꾸민 레시피  · 사진 넣기 «전»  — 「완성 사진 남기기」 단추만 있는 상태
//    ② 꾸민 레시피  · 사진 넣은 «뒤»  — ⭐체크가 «꺼져» 있는 모습 (창업자에게 물을 그 화면)
//    ③ 안 꾸민 레시피 · 사진 넣은 뒤  — 대조용. 체크가 «켜져» 있다
//    ④ 일기 달력    — 사진이 음식 아이콘 자리에 뜬 모습
//
// 실행: cd /home/user/hankki/hankki && node scripts/_shot-완성사진체크-0823.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = process.env.SHOT_DIR || '/tmp/shot-완성사진체크-0823'
mkdirSync(OUT, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4415, r))

const 빨강PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAHUlEQVQoU2P8z8Dwn4GBgYERxsAmAFOEISjLBAAj8gX9Ol5b0AAAAABJRU5ErkJggg==',
  'base64',
)

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })

const 새탭 = async () => {
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log('  ⚠️ pageerror:', String(e.message || e).split('\n')[0]))
  await page.goto('http://127.0.0.1:4415/hankki/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(700)
  return page
}
const 탭으로 = async (page, 이름) => {
  await page.evaluate((T) => {
    const bs = [...document.querySelectorAll('nav button')]
    bs.find((x) => (x.innerText || '').replace(/\s+/g, '').includes(T))?.click()
  }, 이름)
  await page.waitForTimeout(700)
}
const 요리끝까지 = async (page, 제목) => {
  await 탭으로(page, '레시피')
  await page.evaluate((T) => {
    const t = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim().startsWith(T))
    if (t) t.click()
  }, 제목)
  await page.waitForTimeout(700)
  await page.evaluate(() => {
    const t = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').includes('요리 시작'))
    if (t) t.click()
  })
  await page.waitForTimeout(600)
  for (let n = 0; n < 40; n++) {
    const 다음 = await page.evaluate(() => {
      const t = [...document.querySelectorAll('.cook-navbtn')].find((x) => /시작 →|다음 →/.test(x.innerText || ''))
      if (!t) return false; t.click(); return true
    })
    if (!다음) break
    await page.waitForTimeout(160)
  }
}

// ⛔ 찍기 «전»에 「화면 한가운데가 덮였나」를 본다 — 온보딩·코치마크가 덮으면 헛것을 찍는다(절대원칙 21)
const 덮였나 = (page) => page.evaluate(() => {
  const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2)
  const 덮개 = el?.closest('.sheet-mask, .coach, .onboard, [class*="onboard"], [class*="coach"]')
  return 덮개 ? (덮개.className || '덮개') : ''
})

// 🎯 사진 줄(.cook-shot) «만» 잘라 찍는다 — 창업자가 볼 것은 그 칸이다
const 사진줄찍기 = async (page, 파일, 설명) => {
  const 덮 = await 덮였나(page)
  if (덮) { console.log(`   ⚠️ ${파일} — 화면이 덮였다(${덮}). 안 찍는다`); return null }
  const el = await page.$('.cook-shot')
  if (!el) { console.log(`   ⚠️ ${파일} — .cook-shot 을 못 찾았다`); return null }
  const box = await el.boundingBox()
  // 아래 「다 만들었어요」 줄까지 같이 담는다 — 창업자가 「그 위」라고 말한 자리라서
  await page.screenshot({
    path: join(OUT, 파일),
    clip: { x: 0, y: Math.max(0, box.y - 12), width: 390, height: Math.min(844 - Math.max(0, box.y - 12), box.height + 120) },
  })
  // ⭐ 그림과 «같이» 글자·상태를 찍는다 — 그림과 숫자가 어긋나면 바로 드러난다
  const 상태 = await page.evaluate(() => ({
    글: (document.querySelector('.cook-shot')?.innerText || '').replace(/\s+/g, ' ').trim(),
    체크: document.querySelector('.cook-shot-cover')?.getAttribute('aria-pressed') ?? '(칸 없음)',
  }))
  console.log(`   📸 ${파일}  — ${설명}`)
  console.log(`      글자「${상태.글}」`)
  console.log(`      체크 aria-pressed = ${상태.체크}`)
  return 상태
}

const 사진넣기 = async (page) => {
  await page.setInputFiles('.cook-shot input[type=file]', { name: '완성.png', mimeType: 'image/png', buffer: 빨강PNG })
  await page.waitForTimeout(700)
  await page.evaluate(() => {
    const t = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim() === '전체 사용')
    if (t) t.click()
  })
  await page.waitForTimeout(900)
}

console.log('\n📸 「완성 사진」 체크가 어떻게 떠 있나 — 창업자에게 물어볼 그림\n')

// ── 꾸민 레시피를 하나 만든다
const p0 = await 새탭()
const 꾸민것 = await p0.evaluate(() => {
  const st = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const r = (st.recipes || []).find((x) => (x.steps || []).length >= 2)
  st.recipes = st.recipes.map((x) => (x.id === r.id ? { ...x, decor: [{ k: 'gp_gomhi', x: 0.5, y: 0.42, s: 0.34 }] } : x))
  st.diary = []
  localStorage.setItem('hankki:v1', JSON.stringify(st))
  return { id: r.id, title: r.title }
})
await p0.close()
console.log('① ② 꾸민 레시피 =', 꾸민것.title)

const p1 = await 새탭()
await 요리끝까지(p1, 꾸민것.title)
await 사진줄찍기(p1, '1-꾸민-사진넣기전.png', '꾸민 레시피 · 사진 넣기 전')
await 사진넣기(p1)
const s2 = await 사진줄찍기(p1, '2-꾸민-체크꺼짐.png', '⭐꾸민 레시피 · 사진 넣은 뒤 — 체크가 어떻게 떠 있나')
await p1.evaluate(() => [...document.querySelectorAll('.cook-navbtn')].find((x) => /다 만들었어요/.test(x.innerText))?.click())
await p1.waitForTimeout(900)
await p1.close()

// ── 안 꾸민 레시피 (대조)
const p2 = await 새탭()
const 안꾸민것 = await p2.evaluate((ID) => {
  const st = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const r = (st.recipes || []).find((x) => (x.steps || []).length >= 2 && x.id !== ID && !(x.decor?.length > 0) && x.thumb !== 'photo')
  return r ? { id: r.id, title: r.title } : null
}, 꾸민것.id)
console.log('③ 안 꾸민 레시피 =', 안꾸민것?.title)
await 요리끝까지(p2, 안꾸민것.title)
await 사진넣기(p2)
const s3 = await 사진줄찍기(p2, '3-안꾸민-체크켜짐.png', '대조 · 안 꾸민 레시피 — 체크가 켜져 있다')
await p2.close()

// ── 일기 달력
const p3 = await 새탭()
await 탭으로(p3, '일기')
const 덮 = await 덮였나(p3)
if (덮) console.log('   ⚠️ 일기 화면이 덮였다:', 덮)
const cal = await p3.$('.cal-card')
if (cal) { await cal.screenshot({ path: join(OUT, '4-일기달력-사진뜸.png') }); console.log('   📸 4-일기달력-사진뜸.png — 달력 칸에 사진이 뜬 모습') }
else console.log('   ⚠️ .cal-card 를 못 찾았다')
await p3.close()

console.log('\n🔢 한 줄 요약')
console.log('   꾸민 레시피  체크 =', s2?.체크, '  (꺼짐이면 false)')
console.log('   안 꾸민 것   체크 =', s3?.체크, '  (켜짐이면 true)')
console.log('   📁', OUT, '\n')

await b.close(); srv.close()
