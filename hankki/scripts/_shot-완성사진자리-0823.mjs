// 📷🔍 「완성 사진 남기기」가 «어디에 있고 눈에 띄나» — 실물로 찍고 잰다 (2026-08-23)
//
// 📮 창업자 = *"요리모드에 완성사진남기기가 뭐야?"*
//    ⭐⭐ **만든 사람이 모른다 = 유저는 더 모른다.** 그게 이 판을 만든 이유다.
//    (기능은 2026-08-21 `b437fff6` 로 «이미 배포»됐고 창업자 폰에 있다)
//
// ⛔ 소스 grep 아님 — **화면에 그려진 자리**로 잰다(절대원칙 18 ⓘ · 21 · 30).
//    ⑴ 마지막 걸음에서 스크롤 0 일 때 «보이나»
//    ⑵ 안 보이면 몇 px 내려야 나오나
//    ⑶ 눌러서 사진을 넣은 뒤 화면(「레시피 표지로도 쓰기」 체크)
//
// 🍳 걸음이 «짧은 편»과 «긴 편»을 둘 다 잰다 — 글이 길면 단추가 화면 밖으로 밀린다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_shot-완성사진자리-0823.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = process.env.SHOT_OUT || '/tmp/완성사진자리'
mkdirSync(OUT, { recursive: true })

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4409, r))

const 빨강PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAHUlEQVQoU2P8z8Dwn4GBgYERxsAmAFOEISjLBAAj8gX9Ol5b0AAAAABJRU5ErkJggg==',
  'base64',
)

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })

const 새탭 = async () => {
  const page = await ctx.newPage()
  await page.goto('http://127.0.0.1:4409/hankki/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(700)
  return page
}

// 🍳 요리 모드를 «마지막 단계»까지 — 재현판(`_repro-완성사진-0821`)과 같은 길
const 요리끝까지 = async (page, 제목) => {
  await page.evaluate(() => {
    const bs = [...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')]
    bs.find((x) => (x.innerText || '').replace(/\s+/g, '').includes('레시피'))?.click()
  })
  await page.waitForTimeout(600)
  const 열림 = await page.evaluate((T) => {
    const t = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim().startsWith(T))
    if (!t) return false; t.click(); return true
  }, 제목)
  if (!열림) return { ok: false, why: '카드를 못 눌렀다' }
  await page.waitForTimeout(700)
  const 시작 = await page.evaluate(() => {
    const t = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').includes('요리 시작'))
    if (!t) return false; t.click(); return true
  })
  if (!시작) return { ok: false, why: '「요리 시작」을 못 찾았다' }
  await page.waitForTimeout(600)
  let 걸음 = 0
  for (let n = 0; n < 40; n++) {
    const 다음 = await page.evaluate(() => {
      const bs = [...document.querySelectorAll('.cook-navbtn')]
      const t = bs.find((x) => /시작 →|다음 →/.test(x.innerText || ''))
      if (!t) return false; t.click(); return true
    })
    if (!다음) break
    걸음++
    await page.waitForTimeout(180)
  }
  const 끝 = await page.evaluate(() => /다 만들었어요/.test(document.querySelector('.cook-nav')?.innerText || ''))
  return { ok: 끝, 걸음 }
}

// 📏 그 단추가 «지금 화면 안»에 있나 — 화면에 그려진 상자로 잰다
const 재기 = (page) => page.evaluate(() => {
  const vh = window.innerHeight
  const b = document.querySelector('.cook-shot-add')
  const nav = document.querySelector('.cook-nav')
  const sc = document.querySelector('.cook-body') || document.scrollingElement
  const r = b ? b.getBoundingClientRect() : null
  const nr = nav ? nav.getBoundingClientRect() : null
  return {
    화면높이: vh,
    단추있나: !!b,
    단추글: b ? (b.innerText || '').replace(/\s+/g, ' ').trim() : '',
    단추_위: r ? Math.round(r.top) : null,
    단추_아래: r ? Math.round(r.bottom) : null,
    // ⭐ 「보인다」의 정의 = 상자 «전체»가 화면 안에 · 그리고 무언가에 안 덮였다
    보이나: r ? (r.top >= 0 && r.bottom <= vh) : false,
    덮은것: r ? (() => {
      const el = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2))
      if (!el) return '화면 밖'
      return el.closest('.cook-shot-add') ? '' : (el.className || el.tagName)
    })() : '',
    만들었어요_위: nr ? Math.round(nr.top) : null,
    스크롤가능: sc ? Math.max(0, sc.scrollHeight - sc.clientHeight) : 0,
    지금스크롤: sc ? Math.round(sc.scrollTop) : 0,
  }
})

const 편들 = [
  { 제목: '콩국수', 파일: '01-짧은편' },
  { 제목: '제육볶음', 파일: '02-긴편' },
]

console.log('\n📷 「완성 사진 남기기」 — 어디에 있나 (390×844 · 폰 크기)\n')

for (const { 제목, 파일 } of 편들) {
  const page = await 새탭()
  const r = await 요리끝까지(page, 제목)
  if (!r.ok) { console.log(`  ⛔ ${제목} — ${r.why || '마지막 걸음까지 못 감'}`); await page.close(); continue }

  const 잰값 = await 재기(page)
  console.log(`  🍳 ${제목} (조리 ${r.걸음 - 1}걸음)`)
  console.log(`     단추 = ${잰값.단추있나 ? `「${잰값.단추글}」` : '⛔ 없다'}`)
  console.log(`     자리 = 위 ${잰값.단추_위}px · 아래 ${잰값.단추_아래}px (화면 ${잰값.화면높이}px)`)
  console.log(`     첫 화면에 보이나 = ${잰값.보이나 ? '✅ 보인다' : '⛔ 안 보인다 — 굴려야 나온다'}${잰값.덮은것 ? ` · 덮은 것 = ${잰값.덮은것}` : ''}`)
  console.log(`     「다 만들었어요」 = 위 ${잰값.만들었어요_위}px · 굴릴 수 있는 양 = ${잰값.스크롤가능}px`)

  await page.screenshot({ path: join(OUT, `${파일}-a-첫화면.png`) })

  // 굴려서 맨 아래까지
  await page.evaluate(() => {
    const sc = document.querySelector('.cook-body') || document.scrollingElement
    if (sc) sc.scrollTop = sc.scrollHeight
  })
  await page.waitForTimeout(300)
  const 굴린뒤 = await 재기(page)
  console.log(`     맨 아래까지 굴리면 = ${굴린뒤.보이나 ? '✅ 보인다' : '⛔ 그래도 안 보인다'} (위 ${굴린뒤.단추_위}px)`)
  await page.screenshot({ path: join(OUT, `${파일}-b-굴린뒤.png`) })

  // 📷 눌러서 사진을 넣은 뒤 — 「레시피 표지로도 쓰기」가 보이는 상태
  if (파일 === '01-짧은편') {
    const fc = page.waitForEvent('filechooser')
    await page.click('.cook-shot-add')
    ;(await fc).setFiles({ name: 'shot.png', mimeType: 'image/png', buffer: 빨강PNG })
    await page.waitForTimeout(900)
    // 자르기 시트가 뜨면 「담기」로 넘긴다
    const 담기 = await page.evaluate(() => {
      const t = [...document.querySelectorAll('button')].find((x) => /담기|확인|완료/.test(x.innerText || ''))
      if (!t) return false; t.click(); return true
    })
    await page.waitForTimeout(1200)
    const 뒤 = await page.evaluate(() => {
      const t = document.querySelector('.cook-shot-thumb')
      const c = document.querySelector('.cook-shot-cover')
      return {
        사진: !!t,
        체크글: c ? (c.innerText || '').replace(/\s+/g, ' ').trim() : '',
        체크켜짐: c ? c.getAttribute('aria-pressed') : null,
      }
    })
    console.log(`     📷 눌러서 넣은 뒤 = 사진 ${뒤.사진 ? '✅' : '⛔'} · 「${뒤.체크글}」 체크=${뒤.체크켜짐}${담기 ? ' (자르기 시트 거침)' : ''}`)
    await page.screenshot({ path: join(OUT, `${파일}-c-사진넣은뒤.png`) })
  }
  console.log('')
  await page.close()
}

console.log(`📁 캡처 = ${OUT}\n`)
await b.close(); srv.close()
