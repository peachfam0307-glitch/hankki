// 📷↔📔 「표지 사진 ↔ 일기 사진」 재현판 — 창업자 확정 2026-08-23
//
// 📮 창업자 = *"레꾸 화면에서 유저가 내가 만든 음식사진으로 바꾸잖아. **그때! 팝업으로, 일기에도 적용할건가 물으면.
//    다 해결되지 않아?**"* → *"근데 레꾸이미지에서 **다시 예전 아이콘으로 바꾸면 일기에는 반영이 안돼.**"*
//    → *"**되돌리기도 가능해야할듯.**"*
//
// ⭐⭐ **이 판의 심장 = 「기록은 남고 «사진만» 오간다」.**
//    별점·메모·날짜가 하나라도 사라지면 이 기능은 «지우개»가 된다 — 그건 다른 것이다.
//
// ⛔ 그리고 **안 묻는 자리**를 «먼저» 잰다 — 팝업이 아무 때나 뜨면 그게 마찰이다.
//    ⑴ 일기가 «없는» 레시피 → 안 묻는다(넣을 데가 없다)
//    ⑵ 일기에 이미 사진이 «있으면» → 안 묻는다(유저가 넣어둔 걸 말없이 덮지 않는다)
//
// ⛔ 소스 grep 아님 — **화면에 그려진 것 ＋ localStorage 에 저장된 값**으로 잰다(절대원칙 18 ⓘ · 30).
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-표지일기연동-0823.mjs
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
await new Promise((r) => srv.listen(4413, r))

const 빨강PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAHUlEQVQoU2P8z8Dwn4GBgYERxsAmAFOEISjLBAAj8gX9Ol5b0AAAAABJRU5ErkJggg==',
  'base64',
)

let 통과 = 0, 실패 = 0
const chk = (이름, 값, 기대) => {
  const ok = 기대 === undefined ? !!값 : String(값) === String(기대)
  console.log(`  ${ok ? '✅' : '⛔'} ${이름}${ok ? '' : `   ← 나온 값: ${값}`}`)
  ok ? 통과++ : 실패++
}

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })

// ⛔ page.reload() 금지 — 저장값이 시드로 덮인다(`check-mistakes` ⑧). 새 탭으로 연다.
const 새탭 = async () => {
  const page = await ctx.newPage()
  page.on('pageerror', (e) => { console.log('  ⚠️ pageerror:', String(e.message || e).split('\n')[0]); 실패++ })
  await page.goto('http://127.0.0.1:4413/hankki/', { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(700)
  return page
}
const 저장값 = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('hankki:v1') || '{}'))

// 📔 그 레시피에 일기 한 장을 심는다 — 사진·별점·메모를 골라 넣는다
const 일기심기 = async (page, 제목, { photo = null, rating = 4, note = '간장 반만' } = {}) => {
  await page.evaluate(({ T, photo, rating, note }) => {
    const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    const r = (s.recipes || []).find((x) => (x.title || '').startsWith(T))
    if (!r) return false
    s.diary = [{ id: 'dz1', recipeId: r.id, title: r.title, source: r.source, at: Date.now() - 86400000, rating, note, photo }, ...(s.diary || [])]
    localStorage.setItem('hankki:v1', JSON.stringify(s))
    return true
  }, { T: 제목, photo, rating, note })
}

// 🍱 레시피 상세를 연다
const 상세열기 = async (page, 제목) => {
  await page.evaluate(() => {
    const bs = [...document.querySelectorAll('nav button, .tabbar button, [class*="tab"] button, footer button')]
    bs.find((x) => (x.innerText || '').replace(/\s+/g, '').includes('레시피'))?.click()
  })
  await page.waitForTimeout(600)
  const ok = await page.evaluate((T) => {
    const t = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim().startsWith(T))
    if (!t) return false; t.click(); return true
  }, 제목)
  await page.waitForTimeout(800)
  return ok
}

// 📷 표지 → 「내 사진으로 하기」 → 파일 고르기
const 표지사진넣기 = async (page) => {
  await page.evaluate(() => document.querySelector('[data-coach="thumb"], .detail-thumb, .rd-thumb')?.click())
  await page.waitForTimeout(400)
  // ⛔ 표지 여는 방법이 화면마다 다를 수 있다 — 「내 사진으로 하기」가 뜰 때까지 표지 후보를 눌러본다
  let 열림 = await page.evaluate(() => [...document.querySelectorAll('button')].some((x) => (x.innerText || '').includes('내 사진으로 하기')))
  if (!열림) {
    await page.evaluate(() => {
      const t = [...document.querySelectorAll('button, [role="button"]')].find((x) => /표지|아이콘/.test(x.getAttribute('aria-label') || ''))
      t?.click()
    })
    await page.waitForTimeout(400)
    열림 = await page.evaluate(() => [...document.querySelectorAll('button')].some((x) => (x.innerText || '').includes('내 사진으로 하기')))
  }
  if (!열림) return { ok: false, why: '「내 사진으로 하기」를 못 찾았다' }
  const fc = page.waitForEvent('filechooser')
  await page.evaluate(() => [...document.querySelectorAll('button')].find((x) => (x.innerText || '').includes('내 사진으로 하기'))?.click())
  ;(await fc).setFiles({ name: 'shot.png', mimeType: 'image/png', buffer: 빨강PNG })
  await page.waitForTimeout(1400)
  return { ok: true }
}

// 🍱 표지 → 아이콘 아무거나 고르기 (되돌리기)
const 표지아이콘으로 = async (page) => {
  // ⛔ ①(`표지사진넣기`)과 «같은 길»로 연다 — 한쪽만 폴백을 갖고 있어 ②가 헛돌았다
  const 시트열렸나 = () => page.evaluate(() => [...document.querySelectorAll('button')].some((x) => (x.innerText || '').includes('내 사진으로 하기')))
  let 열림 = await 시트열렸나()
  if (!열림) {
    await page.evaluate(() => document.querySelector('[data-coach="thumb"], .detail-thumb, .rd-thumb')?.click())
    await page.waitForTimeout(400)
    열림 = await 시트열렸나()
  }
  if (!열림) {
    await page.evaluate(() => {
      const t = [...document.querySelectorAll('button, [role="button"]')].find((x) => /표지|아이콘/.test(x.getAttribute('aria-label') || ''))
      t?.click()
    })
    await page.waitForTimeout(400)
    열림 = await 시트열렸나()
  }
  if (!열림) return { ok: false, why: '아이콘 시트를 못 열었다' }
  // 격자에서 아이콘 하나 — ⛔「그림(img)이 든 단추」로 찾으면 못 잡는다(cell 이 svg 일 수 있다).
  //    **격자를 콕 집는다**(`.ficon-grid`) — 잣대는 「이 화면의 그 단추」여야 한다(규칙 18 ⓘ).
  const 골랐다 = await page.evaluate(() => {
    const t = document.querySelector('.ficon-grid button')
    if (!t) return false; t.click(); return true
  })
  await page.waitForTimeout(900)
  return { ok: 골랐다, why: 골랐다 ? '' : '아이콘 격자를 못 눌렀다' }
}

const 팝업글 = (page) => page.evaluate(() => {
  const s = [...document.querySelectorAll('.sheet')].find((x) => /일기에도 넣을까요|일기 사진도 뺄까요/.test(x.innerText || ''))
  return s ? (s.innerText || '').replace(/\s+/g, ' ').trim() : ''
})
const 팝업확인 = async (page, 글) => {
  await page.evaluate((L) => [...document.querySelectorAll('.sheet button')].find((x) => (x.innerText || '').trim() === L)?.click(), 글)
  await page.waitForTimeout(900)
}

console.log('\n📷↔📔 표지 사진 ↔ 일기 사진 (390×844)\n')

// ───────────────────────────────────────────────────────────
console.log('① ⭐ 표지를 내 사진으로 → 「일기에도 넣을까요?」')
{
  const page = await 새탭()
  await 일기심기(page, '콩국수', { photo: null })
  const p2 = await 새탭() // 심은 값을 읽게 새 탭
  chk('  레시피 상세를 열었다', await 상세열기(p2, '콩국수'))
  const r = await 표지사진넣기(p2)
  chk('  표지에 사진을 넣었다', r.ok, 'true')
  if (r.ok) {
    const 글 = await 팝업글(p2)
    if (process.env.SHOT_OUT) await p2.screenshot({ path: `${process.env.SHOT_OUT}/1-일기에도넣을까요.png` })
    chk('  ⭐⭐ 「일기에도 넣을까요?」 팝업이 떴다', /일기에도 넣을까요/.test(글))
    chk('  ⭐ 무엇이 바뀌는지 말한다 (달력·앨범)', /달력|앨범/.test(글))
    await 팝업확인(p2, '일기에도 넣기')
    const s = await 저장값(p2)
    const d = (s.diary || []).find((x) => x.id === 'dz1')
    chk('  ⭐⭐ 일기에 사진이 담겼다', !!d?.photo)
    chk('  ⭐⭐ 별점이 그대로다 (지우개가 아니다)', d?.rating, 4)
    chk('  ⭐⭐ 메모가 그대로다', d?.note, '간장 반만')
    const rec = (s.recipes || []).find((x) => x.id === d?.recipeId)
    chk('  표지도 사진이다', rec?.thumb, 'photo')
  }
  await page.close(); await p2.close()
}

// ───────────────────────────────────────────────────────────
console.log('\n② ⭐⭐ 표지를 «아이콘으로 되돌리면» → 「일기 사진도 뺄까요?」 (창업자가 찾은 구멍)')
{
  const page = await 새탭()
  await 일기심기(page, '콩국수', { photo: 'data:image/png;base64,iVBORw0KGgo=' })
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    const d = (s.diary || []).find((x) => x.id === 'dz1')
    const r = (s.recipes || []).find((x) => x.id === d?.recipeId)
    if (r) { r.thumb = 'photo'; r.image = 'data:image/png;base64,iVBORw0KGgo='; r.touched = true }
    localStorage.setItem('hankki:v1', JSON.stringify(s))
  })
  const p2 = await 새탭()
  chk('  레시피 상세를 열었다', await 상세열기(p2, '콩국수'))
  const r = await 표지아이콘으로(p2)
  chk(`  표지를 아이콘으로 바꿨다${r.ok ? '' : ` (${r.why})`}`, r.ok, 'true')
  if (r.ok) {
    const 글 = await 팝업글(p2)
    if (process.env.SHOT_OUT) await p2.screenshot({ path: `${process.env.SHOT_OUT}/2-일기사진도뺄까요.png` })
    chk('  ⭐⭐ 「일기 사진도 뺄까요?」 팝업이 떴다', /일기 사진도 뺄까요/.test(글))
    chk('  ⭐⭐ 「별점·메모는 그대로」를 말한다', /별점|메모/.test(글))
    await 팝업확인(p2, '사진 빼기')
    const s = await 저장값(p2)
    const d = (s.diary || []).find((x) => x.id === 'dz1')
    chk('  ⭐⭐ 일기 사진이 빠졌다', !d?.photo)
    chk('  ⭐⭐ 기록은 «남아 있다» (통째 삭제가 아니다)', !!d)
    chk('  ⭐⭐ 별점이 그대로다', d?.rating, 4)
    chk('  ⭐⭐ 메모가 그대로다', d?.note, '간장 반만')
  }
  await page.close(); await p2.close()
}

// ───────────────────────────────────────────────────────────
console.log('\n③ ⛔ 안 묻는 자리 — 팝업이 아무 때나 뜨면 그게 마찰이다')
{
  // ⑴ 일기가 «없는» 레시피
  //    ⛔ 앞 칸들과 «같은 브라우저»라 심어둔 일기가 남는다 — 비우고 시작한다(안 그러면 앱이 아니라 판이 틀린다)
  const 비움 = await 새탭()
  await 비움.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    s.diary = []
    ;(s.recipes || []).forEach((r) => { if ((r.title || '').startsWith('콩국수')) { r.thumb = 'icon'; r.image = '' } })
    localStorage.setItem('hankki:v1', JSON.stringify(s))
  })
  await 비움.close()
  const page = await 새탭()
  chk('  레시피 상세를 열었다 (일기 0장)', await 상세열기(page, '콩국수'))
  const r = await 표지사진넣기(page)
  if (r.ok) {
    chk('  ⭐ 일기가 없으면 «안 묻는다»', (await 팝업글(page)) === '')
    const s = await 저장값(page)
    const rec = (s.recipes || []).find((x) => (x.title || '').startsWith('콩국수'))
    chk('  ⭐ 그래도 표지는 바뀌었다', rec?.thumb, 'photo')
  } else { chk(`  표지에 사진을 넣었다 (${r.why})`, false) }
  await page.close()

  // ⑵ 일기에 이미 사진이 «있으면»
  const p3 = await 새탭()
  await 일기심기(p3, '콩국수', { photo: 'data:image/png;base64,iVBORw0KGgo=' })
  const p4 = await 새탭()
  await 상세열기(p4, '콩국수')
  const r2 = await 표지사진넣기(p4)
  if (r2.ok) {
    chk('  ⭐ 일기에 이미 사진이 있으면 «안 묻는다» (말없이 안 덮는다)', (await 팝업글(p4)) === '')
    const s = await 저장값(p4)
    const d = (s.diary || []).find((x) => x.id === 'dz1')
    chk('  ⭐ 유저가 넣어둔 사진이 그대로다', d?.photo, 'data:image/png;base64,iVBORw0KGgo=')
  } else { chk(`  표지에 사진을 넣었다 (${r2.why})`, false) }
  await p3.close(); await p4.close()
}

console.log(`\n${실패 ? '⛔' : '✅'} ${통과}/${통과 + 실패}\n`)
await b.close(); srv.close()
process.exit(실패 ? 1 : 0)
