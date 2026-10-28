// 📸 냉장고 「재료 담기」 아이콘 픽커 — **요리가 하나도 없어야 한다** (2026-09-11)
//
// 📮 창업자 폰 제보 = *"냉장고재료아이콘에 음식이 있을필요없어 다빼고 재료만남기자"*
//    캡처에 「최근에 쓴 것」으로 가지볶음·치킨부리또·우엉조림·봉골레가 떠 있었다.
// ⛔ 규칙 21 = 창업자에게 보여주기 «전»에 내가 열어서 눈으로 본다.
//
// 막을 곳이 셋이다 — ①갈래 목록 ②최근에 쓴 것 ③검색 결과. 셋 다 찍어서 본다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const 낼곳 = process.env.SHOT_DIR || '/tmp/재료픽커'
mkdirSync(낼곳, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4419, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const { ING_ICON_KEYS } = await import('../src/components/FoodIcon.jsx').catch(() => ({}))
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, timezoneId: 'Asia/Seoul', deviceScaleFactor: 2 })

let 나쁨 = 0
const 말 = (ok, s, 덤 = '') => { if (!ok) 나쁨++; console.log(`${ok ? '✅' : '⛔'} ${s}${덤 ? ' — ' + 덤 : ''}`) }

// 📮 창업자 캡처 그대로 — 「최근에 쓴 것」에 요리 아이콘이 박혀 있는 상태를 심는다
const 심을최근 = ['gr_361', 'n2801', 'gr_263', 'gr_105', 'gr_360', 'gr_356', 'gr_230', 'gr_349']

const p = await ctx.newPage()
await p.addInitScript(SEED_COACH_SEEN)
await p.addInitScript((최근) => {
  localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:news:off', '1')
  localStorage.setItem('hankki:foodicon:recent', JSON.stringify(최근))
}, 심을최근)
await p.goto('http://127.0.0.1:4419/', { waitUntil: 'networkidle' })
await p.click('text=장보기'); await p.waitForTimeout(400)
await p.click('text=냉장고'); await p.waitForTimeout(700)
await p.click('text=재료 담기'); await p.waitForTimeout(500)
await p.click('.emoji-tile'); await p.waitForTimeout(600)

const 읽기 = () => p.evaluate(() => {
  const 절 = []
  for (const cat of document.querySelectorAll('.emoji-cat')) {
    const grid = cat.nextElementSibling
    const 이름들 = [...(grid?.querySelectorAll('.ficon-name') || [])].map((s) => s.textContent)
    절.push({ 제목: cat.textContent, 개수: 이름들.length, 앞: 이름들.slice(0, 6) })
  }
  return 절
})

console.log('\n【① 픽커를 연 첫 화면】')
const a = await 읽기()
a.forEach((s) => console.log(`   「${s.제목}」 ${s.개수}개 → ${s.앞.join(' / ')}`))
await p.screenshot({ path: join(낼곳, '1-첫화면.png') })
console.log(`   📸 ${join(낼곳, '1-첫화면.png')}`)

const 갈래들 = a.map((s) => s.제목)
const 재료갈래 = ['채소', '과일', '고기·해산물', '유제품', '양념·장', '밥·면·빵', '음료·기타']
말(갈래들.filter((t) => t !== '최근에 쓴 것').every((t) => 재료갈래.includes(t)), '갈래가 재료뿐이다', 갈래들.join(' · '))
말(!갈래들.some((t) => ['밥', '국·탕·찌개', '면', '반찬·나물·김치', '양식', '중식', '요리 아이콘'].includes(t)), '요리 갈래가 하나도 없다')

const 최근절 = a.find((s) => s.제목 === '최근에 쓴 것')
말(!최근절, '⭐ 「최근에 쓴 것」이 통째로 안 뜬다 — 심어둔 8개가 전부 요리였다', 최근절 ? `${최근절.개수}개 남음: ${최근절.앞.join('/')}` : '')

console.log('\n【② 「가지」로 검색 — 가지볶음·가지덮밥이 걸리면 안 된다】')
await p.fill('.ficon-search input', '가지'); await p.waitForTimeout(400)
const c = await 읽기()
c.forEach((s) => console.log(`   「${s.제목}」 ${s.개수}개 → ${s.앞.join(' / ')}`))
await p.screenshot({ path: join(낼곳, '2-가지검색.png') })
console.log(`   📸 ${join(낼곳, '2-가지검색.png')}`)
const 걸린것 = c[0]?.앞 || []
말(걸린것.length > 0, '가지가 걸린다', 걸린것.join(' / '))
말(!걸린것.some((n) => /볶음|덮밥|무침|구이|찜|전$/.test(n)), '⭐ 완성된 요리가 안 섞인다')

await p.close(); await b.close(); srv.close()
console.log(`\n${나쁨 ? '⛔ ' + 나쁨 + '칸 빨간불' : '✅ 전부 초록불'}`)
process.exit(나쁨 ? 1 : 0)
