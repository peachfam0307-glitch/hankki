// 📏 「고정된 캡처 창이 읽을 만한가」 — 창업자 2026-09-02 *"창이 저렇게 작은데 어떻게 읽어???????"*
// ⛔ 판정하지 않는다. «숫자만» 잰다 — 창 높이 · 사진이 줄어드는 비율 · 원문 글자가 화면에서 몇 px 이 되나.
// 실행: node scripts/_probe-캡처창크기-0902.mjs
// 🏷 이름표 = 판정대기
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const OUT = '/tmp/shot-0902'; mkdirSync(OUT, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4475, r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
const p0 = await ctx.newPage()
await p0.goto('http://127.0.0.1:4475/hankki/', { waitUntil: 'networkidle' }); await p0.waitForTimeout(1500)
// 진짜 폰 캡처 크기 1080×2340 · 인스타 본문 글자 = 원본 34px (흔한 크기)
const 원본글자 = await p0.evaluate(() => {
  const W = 1080, H = 2340, FS = 34
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const x = c.getContext('2d')
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H)
  x.fillStyle = '#222'; x.font = FS + 'px sans-serif'
  const 줄 = ['[재료]', '항정살 400g', '간장 3큰술', '설탕 1큰술', '다진마늘 1큰술', '대파 1대', '',
    '[만드는 법]', '1. 항정살은 한입 크기로 썰어 핏물을 뺀다.', '2. 팬에 기름을 두르고 센 불에 겉면을 굽는다.',
    '3. 양념을 붓고 중불에서 15분간 조린다.', '4. 대파를 넣고 2분 더 조린 뒤 깨를 뿌린다.']
  줄.forEach((t, k) => x.fillText(t, 70, 220 + k * Math.round(FS * 1.8)))
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  s.recipes = [{ id: 'zz-real', title: '진짜 캡처 크기', status: 'unsorted', source: 'photo',
    image: c.toDataURL('image/jpeg', 0.9), savedAt: Date.now() + 9000,
    ingredients: ['항정살 400g'], steps: [], favorite: false, cooked: 0 }, ...(s.recipes || [])]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  return { W, H, FS }
})
await p0.close()
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4475/hankki/', { waitUntil: 'networkidle' }); await p.waitForTimeout(3000)
await p.getByRole('button', { name: /임시보관함/ }).first().click(); await p.waitForTimeout(900)
await p.evaluate(() => {
  const 줄 = [...document.querySelectorAll('.inbox-row')].find((e) => /진짜 캡처 크기/.test(e.innerText))
  const 칸 = 줄?.parentElement?.parentElement
  ;[...(칸?.querySelectorAll('button') || [])].find((x) => /채우러 가기/.test(x.innerText))?.click()
})
await p.waitForTimeout(1600)
await p.screenshot({ path: join(OUT, '6-진짜캡처크기.png') })
const 잰값 = await p.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')].filter((e) => /^data:image/.test(e.src))
  // 고정 창 안의 사진 = 제일 넓게 그려진 것
  const img = imgs.sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0]
  if (!img) return { 없음: true }
  const r = img.getBoundingClientRect()
  const 상자 = img.closest('div')?.getBoundingClientRect()
  return {
    사진_그려진폭: Math.round(r.width), 사진_그려진키: Math.round(r.height),
    원본폭: img.naturalWidth, 원본키: img.naturalHeight,
    줄인비율: +(r.width / img.naturalWidth).toFixed(3),
    창_보이는키: 상자 ? Math.round(상자.height) : null,
    화면키: window.innerHeight,
  }
})
console.log('\n📏 잰 값')
console.log('  원본 캡처 =', 원본글자.W + '×' + 원본글자.H, '· 원문 글자 =', 원본글자.FS + 'px')
console.log(' ', JSON.stringify(잰값, null, 1))
if (!잰값.없음) {
  console.log('  → 화면에서 글자 =', (원본글자.FS * 잰값.줄인비율).toFixed(1) + 'px  (앱 최소 글자 14px)')
  console.log('  → 창에 한 번에 보이는 원본 =', Math.round(잰값.창_보이는키 / 잰값.줄인비율) + 'px / ' + 원본글자.H + 'px',
    '=', Math.round(잰값.창_보이는키 / 잰값.줄인비율 / 원본글자.H * 100) + '%')
}
// ✕ 닫기를 누르면 «옆 작은 그림»(썸네일 = 원래 음식 아이콘 자리)까지 사라지나
const 전 = await p.evaluate(() => {
  const 썸 = [...document.querySelectorAll('img')].filter((e) => /^data:image/.test(e.src))
    .map((e) => Math.round(e.getBoundingClientRect().width)).sort((a, b) => a - b)
  return { 그림폭들: 썸, 고정창: !!document.querySelector('button[aria-label="캡처 사진 접기"]') }
})
await p.evaluate(() => document.querySelector('button[aria-label="캡처 사진 닫기"]')?.click())
await p.waitForTimeout(800)
await p.screenshot({ path: join(OUT, '7-닫기누른뒤.png') })
const 후 = await p.evaluate(() => {
  const 썸 = [...document.querySelectorAll('img')].filter((e) => /^data:image/.test(e.src))
    .map((e) => Math.round(e.getBoundingClientRect().width)).sort((a, b) => a - b)
  const 저장 = JSON.parse(localStorage.getItem('hankki:v1') || '{}').recipes.find((r) => r.id === 'zz-real')
  return {
    그림폭들: 썸, 고정창: !!document.querySelector('button[aria-label="캡처 사진 접기"]'),
    썸네일칩: [...document.querySelectorAll('button')].filter((b) => /^(아이콘|글자|사진|없음)$/.test(b.innerText.trim()))
      .map((b) => b.innerText.trim() + (getComputedStyle(b).backgroundColor === 'rgba(0, 0, 0, 0)' ? '' : '←고름')),
    저장된사진있나: !!저장?.image,
    다시열기단추: [...document.querySelectorAll('button')].some((b) => /보면서 쓰기|캡쳐 보면서/.test(b.innerText)),
  }
})
console.log('\n✕ 닫기 «전» =', JSON.stringify(전))
console.log('✕ 닫기 «후» =', JSON.stringify(후, null, 1))

// 💾 저장하고 «레시피 탭 카드»에 뭐가 뜨나 — 음식 아이콘인가 캡처 사진인가
await p.evaluate(() => [...document.querySelectorAll('button.btn-primary')].find((b) => b.innerText.trim() === '저장')?.click())
await p.waitForTimeout(1400)
const p9 = await ctx.newPage()
await p9.goto('http://127.0.0.1:4475/hankki/', { waitUntil: 'networkidle' })
await p9.waitForTimeout(2500)
await p9.evaluate(() => {
  const 바 = document.querySelector('.bottom-nav') || document.querySelector('nav')
  ;[...(바?.querySelectorAll('button') || [])].find((b) => (b.innerText || '').trim() === '레시피')?.click()
})
await p9.waitForTimeout(1400)
await p9.screenshot({ path: join(OUT, '8-저장뒤-레시피카드.png') })
const 카드 = await p9.evaluate(() => {
  const r = JSON.parse(localStorage.getItem('hankki:v1') || '{}').recipes.find((x) => x.id === 'zz-real')
  return { thumb필드: r?.thumb ?? '(없음)', image있나: !!r?.image, icon필드: r?.icon ?? '(없음)',
    status: r?.status,
    카드가_사진인가: '`thumb || (image ? photo : icon)` → ' + ((r?.thumb) || (r?.image ? 'photo' : 'icon')) }
})
console.log('\n💾 저장 뒤 카드 =', JSON.stringify(카드, null, 1))

await b.close(); srv.close()
