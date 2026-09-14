// 🚨🚨 **재현·게이트: 「클립을 눌렀더니 목록에서 사라진다」** (2026-09-08 밤)
//
// 📮 창업자 = *"다 지워지잖아!!!!!!!!! 그래서 내가 제보했잖아"* ＋ *"하트누르니까 차례로 사라졌어"*
//    ＋ *"설계할때 제대로 하라 했자나. 사람들이 쓰는건데 … 인스타 릴스 만들지나 말던지"*
//
// 🔎 **뿌리** — 순환(빈→모자→하트→빈)은 «제대로» 돈다. 사라진 게 아니다.
//    「해볼 것」을 걸어놓고 누르면 그 편이 **최애로 옮겨가 보던 목록에서 즉시 빠진다.**
//    → 유저 눈엔 **「눌렀더니 없어졌다」**. 하나씩 누르면 하나씩 없어진다. 몇 달 모은 게 날아간 줄 안다.
//
// ✅ **고침 = 실패의 «모양»을 바꾼다**(절대원칙 34)
//    ⑴ 종을 바꾼 편은 **그 자리에 남긴다**(`방금바꾼` · 화면에만 사는 값 · 저장값 안 건드림)
//    ⑵ **무엇이 됐는지 말해준다**(토스트)
//    ⛔ 둘 중 하나만 하면 반쪽이다 — 남기기만 하면 왜 그림이 바뀌었는지 모르고,
//       말해주기만 하면 카드는 여전히 사라진다.
//
// ⛔ 이 판은 «지우지 않는다». 두 종을 다시 만질 때 이게 초록불이라야 한다.
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/_repro-핀사라짐-0908.mjs
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = '/home/user/hankki/hankki', DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const { BASICS_VERSION, allBasicRecipes } = await import('file://' + join(ROOT, 'src/data/basics.js'))
const { FAV_PINS, PIN_TWO_KINDS } = await import('file://' + join(ROOT, 'src/favPin.js'))

let 통과 = 0, 전체 = 0
const 칸 = (참, 말) => { 전체++; if (참) { 통과++; console.log('✅ ' + 말) } else console.log('⛔ ' + 말) }

// 옛 유저 = 몇 달 모은 핀(favorite:true · favPin 없음 = 모자). 기본 편은 빼고 이것만 본다.
const now = Date.now()
const state = {
  recipes: [0, 1, 2].map((i) => ({
    id: 'x' + i, title: '옛핀 ' + i, category: '한식', time: 10, thumb: 'icon', icon: 'fe_18',
    ingredients: ['a'], steps: ['해요.'], tags: [], savedAt: now - i * 1000,
    source: 'user', status: 'sorted', favorite: true, cooked: 0,
  })),
  diary: [], seedV: BASICS_VERSION, removedSeedIds: allBasicRecipes.map((r) => r.id),
}

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
const { SEED_COACH_SEEN } = await import('file://' + join(ROOT, 'src/coach.js'))
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:news:off', '1'); localStorage.setItem('hankki:gridSize', 'small')
}, state)
const p = await ctx.newPage()
const 오류 = []
p.on('pageerror', (e) => 오류.push(String(e.message || e).split('\n')[0]))
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(1200)
await p.getByText('레시피', { exact: true }).last().click()
await p.waitForTimeout(900)

const 이름들 = () => p.$$eval('.grid-card .name', (es) => es.map((e) => e.innerText.trim()))
const 칩들 = () => p.$$eval('.pill', (es) => es.map((e) => e.innerText.trim()))

console.log('── ⓐ 「해볼 것」을 걸고 클립을 누른다 (창업자가 겪은 그 자리) ──')
await p.getByRole('button', { name: /해볼 것/ }).first().click()
await p.waitForTimeout(600)
const 처음 = await 이름들()
칸(처음.length === 3, `① 「해볼 것」에 3편이 있다 (지금 ${처음.length})`)

await p.locator('.grid-card').filter({ hasText: '옛핀 0' }).locator('.fav-dot').first().click()
await p.waitForTimeout(700)
const 누른뒤 = await 이름들()

// ⭐⭐ 이 칸이 이 판의 전부다 — 눌러도 «그 자리에 남아야» 한다.
칸(누른뒤.includes('옛핀 0'), `② 눌러도 목록에서 «안 사라진다» (지금 = ${누른뒤.join('·') || '비어 있음'})`)
칸(누른뒤.length === 처음.length, `③ 목록 길이가 그대로다 (${처음.length} → ${누른뒤.length})`)

// 무엇이 됐는지 «말해줬나»
const 토스트 = await p.locator('.toast, [class*="toast"]').first().innerText().catch(() => '')
칸(/넣었어요|뺐어요/.test(토스트), `④ 무엇이 됐는지 말해준다 (토스트 = ${JSON.stringify(토스트)})`)

if (PIN_TWO_KINDS) {
  const 칩 = (await 칩들()).join(' ')
  칸(/최애\s*1/.test(칩), `⑤ 「최애」로 옮겨간 게 칩에도 보인다 (${칩.slice(0, 60)}…)`)
}

console.log('\n── ⓑ 저장값은 안 지워졌나 (제일 무서운 것) ──')
const 저장 = await p.evaluate(() => JSON.parse(localStorage.getItem('hankki:v1') || '{}').recipes.map((r) => [r.title, !!r.favorite, r.favPin || null]))
칸(저장.length === 3, `⑥ 레시피 수가 그대로다 (${저장.length}편)`)
칸(저장.every((r) => r[1] === true), `⑦ 세 편 다 «꽂힌 채»다 — 하나도 안 빠졌다 (${JSON.stringify(저장)})`)

console.log(`\n${통과}/${전체} 통과 · 종 ${FAV_PINS.length}개 · 화면 오류 ${오류.length ? 오류.join(' / ') : 0}`)
await b.close(); srv.close()
process.exit(통과 === 전체 && !오류.length ? 0 : 1)
