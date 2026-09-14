// 📷📔 「표지 사진이 일기·달력에 안 간다」 재현판 (창업자 영상 제보 2026-08-24) 〔반영됨〕
//
// 📮 창업자 = *"레꾸화면에서 사진 넣은건 동그랗게 잘리지도, **일기나, 달력에 저장되지도 않아**"*
//    ⭐ 영상 두 개를 받아 프레임으로 확인했다 — 두 번째 영상이 «정확한 경로»였다:
//       레시피 상세 → 「🍱 아이콘 바꾸기」 → 「내 사진으로 하기」 → 갤러리 → 「만들었어요」
//
// ⛔⛔ 뿌리 = `RecipeDetailScreen.onCook()` 이 `photo: null` 로 박혀 있었다.
//    표지에 내 사진이 있어도 일기는 **늘 빈손으로** 시작했다.
//
// 🔎 **왜 v11.22 로 안 잡혔나** — 그 판은 「표지를 바꿀 때 «이미 있는» 일기에 넣을까」를 묻는다.
//    사진을 «먼저» 바꾸고 나중에 「만들었어요」를 누르면 그때는 일기가 없어 안 묻고,
//    뒤늦게 만들어진 일기는 표지를 안 쳐다본다. **창업자 영상이 정확히 그 순서였다.**
//    📌 «순서»가 다르면 같은 기능도 다른 길로 샌다.
//
// ⭐ 이 판의 심장 = **`localStorage` 에 진짜로 들어갔나**. ⛔소스 grep 도, 화면 글자도 아니다.
//    v11.00 에서 `addShopItem` 이 필드를 골라 새 객체를 만드는 바람에 넘기고도 말없이 버려졌고
//    그때 게이트 50개가 전부 초록불이었다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-일기사진-0824.mjs
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
await new Promise((r) => srv.listen(4415, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch { /* noop */ } })
const page = await ctx.newPage()
const 칸 = []
const 재기 = (이름, 참) => { 칸.push([이름, !!참]); console.log(`  ${참 ? '✅' : '⛔'} ${이름}`) }

await page.goto('http://127.0.0.1:4415/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(900)

// 🍳 레시피 탭 → 첫 레시피 상세
await page.evaluate(() => {
  const t = [...document.querySelectorAll('button, a')].find((e) => (e.getAttribute('aria-label') || e.textContent || '').trim().startsWith('레시피'))
  t?.click()
})
await page.waitForTimeout(900)
// ⛔ `.grid2 button` 은 «필터 칩»까지 잡는다 — 카드는 「제목 ＋ 날짜」가 한 버튼에 든 것이다.
//    (2026-08-24 실측 = 그 셀렉터로는 목록에 그대로 남아 있었다)
await page.evaluate(() => {
  const 카드 = [...document.querySelectorAll('button')]
    .find((x) => /\d{4}\.\d{2}\.\d{2}/.test(x.innerText || ''))
  카드?.click()
})
await page.waitForTimeout(1100)
재기('레시피 상세를 열었다', await page.evaluate(() => /요리 시작|만들었어요/.test(document.body.innerText || '')))

// 🧹 오늘 일기를 비운다 — 「오늘은 이미 한끼 일기에 있어요」로 빠지면 아무것도 안 재게 된다
await page.evaluate(() => {
  const K = 'hankki:v1'
  const s = JSON.parse(localStorage.getItem(K) || '{}')
  const 오늘 = new Date().toDateString()
  s.diary = (s.diary || []).filter((d) => new Date(d.at).toDateString() !== 오늘)
  localStorage.setItem(K, JSON.stringify(s))
})
// ⛔ `reload` 하면 «상세에서 튕겨 나온다» — 다시 들어가야 한다(2026-08-24 실측으로 잡았다)
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
await page.evaluate(() => {
  const t = [...document.querySelectorAll('button, a')].find((e) => (e.getAttribute('aria-label') || e.textContent || '').trim().startsWith('레시피'))
  t?.click()
})
await page.waitForTimeout(900)
await page.evaluate(() => {
  const 카드 = [...document.querySelectorAll('button')].find((x) => /\d{4}\.\d{2}\.\d{2}/.test(x.innerText || ''))
  카드?.click()
})
await page.waitForTimeout(1100)

// 📷 ① 「아이콘 바꾸기」 → 「내 사진으로 하기」 — 창업자 영상의 그 경로
await page.evaluate(() => {
  const t = [...document.querySelectorAll('button')].find((x) => /아이콘 바꾸기/.test(x.innerText || ''))
  t?.click()
})
await page.waitForTimeout(800)
재기('「아이콘 바꾸기」 시트가 열렸다', await page.evaluate(() => /아이콘 선택|내 사진으로/.test(document.body.innerText || '')))

const 큰PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAPAAAADwCAYAAAA+VemSAAAAt0lEQVR42u3RAQ0AAAjDMO5fNCCDkC5w' +
  '0lXPBQwoUKBAgQIFChQoUKBAgQIFChQoUKBAgQIFChQoUKBAgQIFChQoUKBAgQIFChQoUKBAgQIFChQo' +
  'UKBAgQIFChQoUKBAgQIFChQoUKBAgQIFChQoUKBAgQIFChQoUKBAgQIFChQoUKBAgQIFChQoUKBAgQIF' +
  'ChQoUKBAgQIFChQoUKBAgQIFChQoUKBAgQIFChQoUKBAgQIFChQoUKBAgQIF6qUFyi0GAWZM+kkAAAAA' +
  'SUVORK5CYII=',
  'base64',
)
const fc = page.waitForEvent('filechooser')
await page.evaluate(() => {
  const t = [...document.querySelectorAll('button')].find((x) => /내 사진으로/.test(x.innerText || ''))
  t?.click()
})
;(await fc).setFiles({ name: 'cover.png', mimeType: 'image/png', buffer: 큰PNG })
await page.waitForTimeout(1500)

const 표지 = await page.evaluate(() => {
  const K = 'hankki:v1'
  const s = JSON.parse(localStorage.getItem(K) || '{}')
  const r = (s.recipes || []).find((x) => x.thumb === 'photo' && x.image)
  return r ? { id: r.id, thumb: r.thumb, 길이: (r.image || '').length } : null
})
재기('표지가 내 사진으로 저장됐다', 표지 && 표지.길이 > 100)

// ⚠️ 이 순서에서는 일기가 «아직 없어» v11.22 팝업이 안 뜬다 — 그게 이 버그의 조건이다
재기('이 순간엔 「일기에도?」 팝업이 «안» 뜬다 (버그가 나는 조건)', await page.evaluate(() => !/일기에도/.test(document.body.innerText || '')))

// 🍳 ② 「만들었어요」 — 여기서 표지 사진을 가져가야 한다
await page.evaluate(() => {
  const t = [...document.querySelectorAll('button')].find((x) => /만들었어요/.test(x.innerText || ''))
  t?.click()
})
await page.waitForTimeout(1400)

// ⭐ 심장 — localStorage 의 일기에 사진이 «진짜로» 들어갔나
const 일기 = await page.evaluate(() => {
  const K = 'hankki:v1'
  const s = JSON.parse(localStorage.getItem(K) || '{}')
  const 오늘 = new Date().toDateString()
  const e = (s.diary || []).find((d) => new Date(d.at).toDateString() === 오늘)
  return e ? { 사진있나: !!e.photo, 길이: (e.photo || '').length, 제목: e.title } : null
})
재기('오늘 일기가 만들어졌다', !!일기)
재기(`일기에 표지 사진이 담겼다 (${일기?.길이 ?? 0}자)`, 일기 && 일기.사진있나 && 일기.길이 > 100)
재기('일기 사진 = 표지 사진과 같은 것', 일기 && 표지 && Math.abs(일기.길이 - 표지.길이) < 20)

// 🗓 ③ 달력 칸에 사진이 뜨나 — 일기에 photo 가 있으면 MyRecipesScreen 이 사진을 그린다
// ⛔ 상세 «안»에서는 하단바 탭이 안 먹는다 — 먼저 뒤로 나간다(2026-08-24 실측)
await page.goBack().catch(() => {})
await page.waitForTimeout(700)
await page.evaluate(() => {
  const t = [...document.querySelectorAll('button, a')]
    .find((e) => (e.getAttribute('aria-label') || e.textContent || '').trim() === '일기')
  t?.click()
})
await page.waitForTimeout(1400)
// ⛔⛔ `.cal-food img` 만 보면 «아무것도 안 잰다» — 음식 아이콘도 `<img>` 로 그려진다.
//    (2026-08-24 규칙 12 시험에서 잡았다: 고침을 되돌렸는데도 이 칸만 초록불이었다)
//    ✅ 내 사진은 **base64 data URL**, 우리 아이콘은 **assets 파일 주소**다. 거기서 갈린다.
const 달력 = await page.evaluate(() => {
  const 오늘칸 = document.querySelector('.cal-day.today')
  if (!오늘칸) return null
  const im = 오늘칸.querySelector('.cal-food img')
  const src = im ? (im.getAttribute('src') || '') : ''
  return { 사진: src.startsWith('data:'), 아이콘: /assets|\.png|\.webp/.test(src), src: src.slice(0, 24) }
})
재기('달력 오늘 칸에 «사진»이 뜬다', 달력 && 달력.사진)

await page.screenshot({ path: '/tmp/일기사진-0824.png' })
const 좋 = 칸.filter(([, v]) => v).length
console.log(`\n📷 /tmp/일기사진-0824.png`)
console.log(`${좋 === 칸.length ? '✅' : '⛔'} ${좋}/${칸.length}`)
await b.close(); srv.close()
process.exit(좋 === 칸.length ? 0 : 1)
