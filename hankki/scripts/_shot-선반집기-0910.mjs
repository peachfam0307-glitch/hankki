// 🧺 「나갔다 오면 선반에서 집어오나」를 «진짜 앱»으로 재현 — 2026-09-10
//   ⭐ 절대원칙 30 — dist 를 띄우고 바깥 세계(AI 워커)만 가로챈다.
//   ⭐ 어제 배운 것 = 글자 검사가 초록불이어도 앱은 죽어 있을 수 있다. 그래서 «켜서» 잰다.
// 실행: SMOKE_CHROMIUM=… node scripts/_shot-선반집기-0910.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { COACH } from '../src/coach.js'

const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const M = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (!p || p === '/') p = '/index.html'
  let b, t = M[extname(p)] || 'application/octet-stream'
  try { b = readFileSync(join(DIST, p)) } catch { b = readFileSync(join(DIST, 'index.html')); t = 'text/html' }
  s.writeHead(200, { 'content-type': t }); s.end(b)
})
await new Promise((r) => srv.listen(4495, r))
const URL0 = 'http://127.0.0.1:4495/hankki/'

let 틀림 = 0
const 잰다 = (ok, 이름, 덧 = '') => { if (!ok) 틀림++; console.log(`   ${ok ? '✅' : '❌'} ${이름}${덧 ? ' — ' + 덧 : ''}`) }

const 원문 = ['족발 2인분', '재료', '족발 1개', '대파 1대', '통마늘 10알', '만드는 법', '1. 물에 삶아요', '2. 얇게 썰어요', '3. 접시에 담아요'].join('\n')
const AI답 = { title: '족발', ingredients: ['족발 1개', '대파 1대', '통마늘 10알'], steps: ['물에 삶아요', '얇게 썰어요', '접시에 담아요'] }
const 씨앗 = () => JSON.stringify({
  recipes: [{ id: 'x1', title: '족발', status: 'unsorted', savedAt: Date.now(), source: 'photo',
    rawText: 원문, ingredients: ['족발 1개'], steps: ['물에 삶아요'],
    // 🧺 «어제 나갔다 온 사람» — 번호는 적혀 있고 답은 선반에 놓여 있다
    tidyFail: 1, tidyJob: 'J-시험-1', tidyJobAt: Date.now() - 60000 }],
  folders: [], profile: { name: '한끼러버', bio: '' }, shops: [], wishlist: [],
  shoppingList: [], pantry: [], diary: [], seedV: 999, memoCleanV: 9, politeV: 9, removedSeedIds: [],
})

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
console.log('\n🧺 선반 집기 — 진짜 앱으로\n')

async function 판(이름, 선반답, 기대) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
  await ctx.addInitScript((ks) => ks.forEach((k) => localStorage.setItem(k, '1')), Object.values(COACH))
  await ctx.addInitScript((s) => {
    localStorage.setItem('hankki:v1', s); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
  }, 씨앗())
  const p = await ctx.newPage()
  const 셈 = { 물음: 0, 새로건것: 0 }
  await p.route('**/hankki-tidy.annyeong-hankki.workers.dev/**', (route) => {
    const u = route.request().url()
    if (route.request().method() === 'GET' && u.includes('job=')) { 셈.물음++; return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(선반답) }) }
    셈.새로건것++   // ⛔ POST = AI 를 «새로» 부른 것 — 집어오기는 이걸 하면 안 된다
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(AI답) })
  })
  await p.goto(URL0, { waitUntil: 'load' })
  await p.waitForTimeout(3000)
  const r = await p.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    const x = (s.recipes || [])[0] || {}
    return { status: x.status, 걸음: (x.steps || []).length, 재료: (x.ingredients || []).length, job: x.tidyJob || '', tidyFail: x.tidyFail }
  })
  console.log(`  ${이름} — 물음 ${셈.물음} · 새로 건 것 ${셈.새로건것} · ${JSON.stringify(r)}`)
  잰다(셈.물음 >= 1, `${이름} 깨어나서 선반을 물어봤다`)
  잰다(셈.새로건것 === 0, `${이름} ⭐AI 를 «새로» 부르지 않았다(뉴런 0)`)
  기대(r)
  await ctx.close()
}

// Ⓐ 선반에 답이 «놓여 있다» → 집어와서 얹고 번호를 버린다
await 판('Ⓐ 답이 있다', { 상태: '됐음', 몸: AI답 }, (r) => {
  잰다(r.걸음 >= 3 && r.재료 >= 3, 'Ⓐ ⭐답을 얹었다(다시 누르지 않았는데 완성)')
  잰다(r.job === '', 'Ⓐ 번호를 버렸다')
  잰다(r.tidyFail === 0, 'Ⓐ 「안 됐어요」 표시가 사라졌다')
})

// Ⓑ 워커가 아직 일하는 중 → 아무것도 안 바꾼다(번호를 지키고 조용하다)
await 판('Ⓑ 아직 하는 중', { 상태: '하는중' }, (r) => {
  잰다(r.job === 'J-시험-1', 'Ⓑ ⭐번호를 «지킨다»(다음에 또 물어본다)')
  잰다(r.걸음 === 1, 'Ⓑ 값을 함부로 안 바꾼다')
})

// Ⓒ 선반이 비었다(1시간 지남) → 번호만 버리고 지금과 똑같이 「한 번 더」
await 판('Ⓒ 선반이 비었다', { 상태: '없음' }, (r) => {
  잰다(r.job === '', 'Ⓒ 번호를 버린다(영영 물어보지 않는다)')
  잰다(r.tidyFail === 1, 'Ⓒ ⛔나빠지지 않는다 — 지금처럼 「한 번 더」가 뜬다')
})

await b.close(); srv.close()
if (틀림) { console.log(`\n❌ ${틀림}개 틀렸다.\n`); process.exit(1) }
console.log('\n✅ 전부 통과 — 진짜 앱이 깨어나서 선반을 집어온다.\n')
