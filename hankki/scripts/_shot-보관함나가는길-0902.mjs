// 📸 「임시보관함에서 나가는 길 셋」 눈으로 보기 — 2026-09-02 〔반영됨〕
//
// ⭐ 절대원칙 21 — 창업자에게 보여주기 «전»에 내가 열어서 본다.
//    숫자(게이트 31칸)는 전부 초록불이어도 «단추가 휴지통과 헷갈리는지»는 못 잰다.
//
// 찍는 것 셋 = ① 임시보관함(머리말·까닭·단추 둘) ② 편집 화면(「저장」) ③ 레시피 탭(졸업한 것)
// 실행: node scripts/_shot-보관함나가는길-0902.mjs
// 🏷 이름표 = 반영됨 (눈으로 보는 판 · smoke 아님)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = process.env.SHOT_DIR || '/tmp/shot-0902'
mkdirSync(OUT, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4472, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })

const p0 = await ctx.newPage()
await p0.goto('http://127.0.0.1:4472/hankki/', { waitUntil: 'networkidle' })
await p0.waitForTimeout(1200)
await p0.evaluate(() => {
  // 📸 진짜 폰 캡처 크기(1080×2340)로 «글자 사진»을 만든다 — 표지로 쓰면 안 되는 바로 그 그림
  const 캡처 = () => {
    const c = document.createElement('canvas'); c.width = 1080; c.height = 2340
    const x = c.getContext('2d')
    x.fillStyle = '#fff'; x.fillRect(0, 0, 1080, 2340)
    x.fillStyle = '#222'; x.font = '34px sans-serif'
    const 줄 = ['[재료]', '항정살 400g', '간장 3큰술', '설탕 1큰술', '', '[만드는 법]',
      '1. 항정살은 한입 크기로 썰어 핏물을 뺀다.', '2. 센 불에 겉면을 굽는다.', '3. 양념을 붓고 15분 조린다.']
    줄.forEach((t, k) => x.fillText(t, 70, 220 + k * 62))
    return c.toDataURL('image/jpeg', 0.9)
  }
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const 이제 = Date.now()
  s.recipes = [
    { id: 'zz-full', title: '항정살조림', status: 'unsorted', source: 'photo', savedAt: 이제, image: 캡처(),
      ingredients: ['항정살 400g', '간장 3큰술', '설탕 1큰술'], steps: ['핏물을 빼요', '양념에 조려요', '깨를 뿌려요'], favorite: false, cooked: 0 },
    { id: 'zz-half', title: '들기름 콩나물무침', status: 'unsorted', source: 'photo', savedAt: 이제 - 1000,
      ingredients: ['콩나물 300g', '들기름 1큰술'], steps: [], favorite: false, cooked: 0 },
    { id: 'zz-none', title: '사진만 담아둔 것', status: 'unsorted', source: 'photo', savedAt: 이제 - 2000,
      ingredients: [], steps: [], favorite: false, cooked: 0 },
    ...(s.recipes || []),
  ]
  delete s.inboxV   // 「이미 폰에 쌓인 것」 흉내 — 안 지우면 이사가 건너뛴다
  localStorage.setItem('hankki:v1', JSON.stringify(s))
})
await p0.close()

const p = await ctx.newPage()
p.on('pageerror', (e) => console.log('  ⚠️ pageerror:', e.message))
await p.goto('http://127.0.0.1:4472/hankki/', { waitUntil: 'networkidle' })
await p.waitForTimeout(3000)

// ① 임시보관함
await p.getByRole('button', { name: /임시보관함/ }).first().click()
await p.waitForTimeout(900)
await p.screenshot({ path: join(OUT, '1-임시보관함.png') })
const 줄 = await p.evaluate(() => [...document.querySelectorAll('.inbox-row')].map((e) => e.innerText.replace(/\n/g, ' / ')))
console.log('  임시보관함 줄 =', JSON.stringify(줄, null, 1))

// ② 편집 화면 — 「채우러 가기」를 눌러 들어간다
await p.evaluate(() => {
  const 줄 = [...document.querySelectorAll('.inbox-row')].find((e) => /들기름 콩나물무침/.test(e.innerText))
  const 칸 = 줄?.parentElement?.parentElement
  const 단추 = [...(칸?.querySelectorAll('button') || [])].find((b) => /채우러 가기/.test(b.innerText))
  단추?.click()
})
await p.waitForTimeout(1200)
await p.screenshot({ path: join(OUT, '2-편집-위.png') })
const 굴림 = await p.evaluate(() => {
  const 후보 = [...document.querySelectorAll('div,main,section')].filter((e) => e.scrollHeight > e.clientHeight + 40)
  const 고름 = 후보.sort((a, b) => (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight))[0]
  if (!고름) return { 없음: true }
  고름.scrollTop = 고름.scrollHeight
  return { 클래스: 고름.className, 높이: 고름.scrollHeight }
})
console.log('  굴림칸 =', JSON.stringify(굴림))
await p.waitForTimeout(600)
await p.screenshot({ path: join(OUT, '3-편집-아래.png') })

// ③ 레시피 탭 — 저절로 졸업한 항정살조림이 있나
await p.evaluate(() => {
  const 닫기 = [...document.querySelectorAll('button')].find((b) => /닫기/.test(b.getAttribute('aria-label') || ''))
  닫기?.click()
})
await p.waitForTimeout(900)
// 「그대로 저장」을 눌러 밀어낸다
await p.evaluate(() => {
  const 줄 = [...document.querySelectorAll('.inbox-row')].find((e) => /콩나물무침/.test(e.innerText))
  const 칸 = 줄?.parentElement?.parentElement
  ;[...(칸?.querySelectorAll('button') || [])].find((b) => /그대로 저장/.test(b.innerText))?.click()
})
await p.waitForTimeout(900)
await p.screenshot({ path: join(OUT, '4a-밀어낸직후.png') })
// ⛔ 편집 화면 위에서 탭을 누르면 «가려진 앞 화면»을 누르게 된다 → 새 탭으로 깨끗하게 본다
const p4 = await ctx.newPage()
await p4.goto('http://127.0.0.1:4472/hankki/', { waitUntil: 'networkidle' })
await p4.waitForTimeout(2500)
await p4.evaluate(() => {
  const 바 = document.querySelector('.bottom-nav') || document.querySelector('nav')
  const 탭 = [...(바?.querySelectorAll('button') || [])].find((b) => (b.innerText || '').trim() === '레시피')
  탭?.click()
})
await p4.waitForTimeout(1200)
await p4.screenshot({ path: join(OUT, '4-레시피탭.png') })
const 상태 = await p4.evaluate(() => JSON.parse(localStorage.getItem('hankki:v1')).recipes.filter((r) => /^zz-/.test(r.id)).map((r) => r.id + '=' + r.status))
console.log('  씨앗 상태 =', 상태.join(' · '))

// ⑤⑤ ⭐ 창업자가 콕 집은 자리 — 「사진 있는 덜 읽힌 것」을 열면 캡처가 «이미 펼쳐져» 있나
const p5 = await ctx.newPage()
await p5.goto('http://127.0.0.1:4472/hankki/', { waitUntil: 'networkidle' })
await p5.waitForTimeout(1500)
await p5.evaluate(() => {
  const 그리기 = (w, h) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h
    const x = c.getContext('2d')
    x.fillStyle = '#101014'; x.fillRect(0, 0, w, h)
    x.fillStyle = '#1c1c22'; x.fillRect(16, 60, w - 32, h - 120)
    x.fillStyle = '#e8e8ee'; x.font = 'bold ' + Math.round(w / 18) + 'px sans-serif'
    const 줄 = ['항정살 400g', '간장 3큰술', '설탕 1큰술', '', '1 핏물을 뺀다', '2 양념에 조린다', '3 깨를 뿌린다']
    줄.forEach((t, k) => x.fillText(t, 34, 140 + k * Math.round(h / 10)))
    return c.toDataURL('image/jpeg', 0.9)
  }
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  s.recipes = [{ id: 'zz-shot', title: '사진 있는 덜 읽힌 것', status: 'unsorted', source: 'photo',
    image: 그리기(760, 1400), savedAt: Date.now() + 5000, ingredients: ['항정살 400g'], steps: [], favorite: false, cooked: 0 },
    ...(s.recipes || [])]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
})
await p5.close()
const p6 = await ctx.newPage()
await p6.goto('http://127.0.0.1:4472/hankki/', { waitUntil: 'networkidle' })
await p6.waitForTimeout(3000)
await p6.getByRole('button', { name: /임시보관함/ }).first().click()
await p6.waitForTimeout(900)
await p6.evaluate(() => {
  const 줄 = [...document.querySelectorAll('.inbox-row')].find((e) => /사진 있는 덜 읽힌 것/.test(e.innerText))
  const 칸 = 줄?.parentElement?.parentElement
  ;[...(칸?.querySelectorAll('button') || [])].find((b) => /채우러 가기/.test(b.innerText))?.click()
})
await p6.waitForTimeout(1500)
await p6.screenshot({ path: join(OUT, '5-사진있는것-편집.png') })
const 사진칸 = await p6.evaluate(() => {
  const img = [...document.querySelectorAll('img')].find((e) => /^data:image/.test(e.src) && e.getBoundingClientRect().height > 80)
  const r = img?.getBoundingClientRect()
  return { 사진뜸: !!img, 위: r ? Math.round(r.top) : null, 키: r ? Math.round(r.height) : null }
})
console.log('  펼쳐진 캡처 =', JSON.stringify(사진칸))

await b.close(); srv.close()
console.log('\n📸 찍었다 →', OUT)
