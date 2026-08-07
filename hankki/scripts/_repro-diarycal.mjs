// 📔 요리 기록 ↔ 다이어리 «가르기» 재현판 (2026-08-06)
//
// ⛔ 둘 다 `diary` 배열에 살고 `kind` 로만 갈린다. 안 가르면 —
//    ①「이번 달 N번」에 다이어리가 세어진다(요리를 안 했는데 집밥 수가 는다)
//    ②앨범에 **제목 없는 빈 칸**으로 뜬다  ③최애 요리 집계가 오염된다
//    ④달력 음식 자리에 다이어리가 «엉뚱한 음식 아이콘»으로 앉는다(title 이 빈칸이라)
//
// ⭐ 「있으면 안 되는 것」만 보지 않는다 — **요리 쪽이 그대로인지도 같이 본다**(규칙 18 ⓘ).
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_repro-diarycal.mjs
import './_fresh.mjs' // 🛑 옛 dist 로 «거짓 통과» 하는 것을 막는다 (2026-08-06)
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4347, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now(), day = 86400000
// ⚠️ 며칠씩 거슬러 올라가면 달이 넘어가 「이번 달」 판정이 흔들린다 → 2·3일만.
const D = new Date(now)
const dk = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` }
const state = {
  recipes: [{ id: 'u1', title: '들깨나물무침', category: '한식', time: 15, thumb: 'icon', icon: 'fe_143',
    ingredients: ['시래기 200g'], steps: ['볶는다.'], tags: [], savedAt: now, source: 'user' }],
  diary: [
    // 요리 기록 둘
    { id: 'c1', recipeId: 'u1', title: '들깨나물무침', at: now, rating: 5, note: '', photo: null },
    { id: 'c2', recipeId: 'u1', title: '들깨나물무침', at: now - day * 2, rating: 4, note: '', photo: null },
    // 다이어리 둘 — 하나는 요리한 날(겹침), 하나는 요리를 «안» 한 날
    { id: 'j1', kind: 'diary', at: now, paper: { rule: 'lined', skin: 'ivory', art: 'none' }, decor: [], note: '' },
    { id: 'j2', kind: 'diary', at: now - day * 3, paper: { rule: 'plain', skin: 'kraft', art: 'none' }, decor: [], note: '' },
  ],
  seedV: BASICS_VERSION,
}
const soloDay = dk(now - day * 3) // 요리 없이 다이어리만 쓴 날
const soloD = new Date(now - day * 3).getDate()

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, state)
await page.goto('http://127.0.0.1:4347/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(700)
await page.locator('.seg', { hasText: '한끼 일기' }).first().click(); await page.waitForTimeout(800)
await page.screenshot({ path: join(OUT, 'diarycal-a.png') })

// ① 통계 띠 — 다이어리 둘이 「집밥」에 세어지면 안 된다
const strip = (await page.locator('.card').filter({ hasText: '이번 달' }).first().innerText().catch(() => '')).replace(/\s+/g, ' ')
if (/이번 달 2번/.test(strip)) ok(`이번 달 = 요리 2번만 (다이어리 2장 안 세어짐) · "${strip}"`)
else no(`「이번 달」에 다이어리가 섞였다 — "${strip}" (기대 = 이번 달 2번)`)
if (/총 2개/.test(strip)) ok('총 = 요리 2개만')
else no(`「총」에 다이어리가 섞였다 — "${strip}" (기대 = 총 2개)`)

// ② 앨범 — 다이어리는 안 뜬다(제목이 빈칸이라 빈 타일이 된다)
const tiles = await page.locator('.album-tile').count()
if (tiles === 2) ok('앨범에 요리 2개만')
else no(`앨범 타일이 ${tiles}개 — 다이어리가 섞였다(기대 2)`)

// ③ 달력 — 펜 표시 2개(요리한 날 겹침 1 + 요리 없는 날 1)
const pens = await page.locator('.cal-diary').count()
if (pens === 2) ok('달력에 다이어리 표시 2개')
else no(`달력 다이어리 표시가 ${pens}개 (기대 2)`)
// 요리한 날엔 음식 아이콘이 «그대로» 있어야 한다 — 펜이 그 자리를 뺏으면 안 된다
const foods = await page.locator('.cal-food').count()
if (foods === 2) ok('요리 아이콘 2개 그대로 (펜이 자리를 안 뺏었다)')
else no(`요리 아이콘이 ${foods}개 (기대 2)`)

// ④ 요리를 «안» 한 날도 눌러진다 → 그 날 다이어리로 가는 길이 생긴다
const solo = page.locator('.cal-day').filter({ hasText: new RegExp(`^${soloD}$`) }).first()
if (await solo.isDisabled()) no(`${soloD}일(다이어리만 쓴 날)이 눌러지지 않는다 — 들어갈 길이 없다`)
else {
  ok(`${soloD}일(다이어리만 쓴 날)도 눌러진다`)
  await solo.click(); await page.waitForTimeout(600)
  const label = await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().innerText()
  if (/일기 보기/.test(label)) ok(`이미 쓴 날 버튼 = "${label.trim()}"`)
  else no(`이미 쓴 날인데 "${label.trim()}" — 「쓰기」는 새로 쓴다는 뜻으로 읽힌다`)
  await page.screenshot({ path: join(OUT, 'diarycal-b-다이어리만쓴날.png') })
  // 실제로 그 날 다이어리로 들어가진다
  await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
  const cls = await page.locator('.paper').first().getAttribute('class').catch(() => null)
  if (cls && cls.includes('kraft')) ok(`그 날 저장해둔 속지가 그대로 열린다 (${cls})`)
  else no(`저장한 속지가 안 열린다 (${cls})`)
}

if (errors.length) errors.forEach((e) => no(`pageerror — ${e}`))
else ok('pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
