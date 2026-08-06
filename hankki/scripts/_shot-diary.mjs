// 📔 다이어리 화면 실물 — 창업자 판정용 (2026-08-06)
//   ⓐ 요리 기록 탭에서 「다이어리 쓰기」 누르기
//   ⓑ 다이어리 화면 (종이 3:4 ＋ 선·종이·틀 고르기 ＋ 그날 만든 요리)
//   ⓒ 속지를 갈아끼운 모습
//   ⓓ 꾸미기(같은 에디터, 판만 3:4)
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
await new Promise((r) => srv.listen(4346, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now(), day = 86400000
const state = {
  recipes: [{ id: 'u1', title: '들깨나물무침', category: '한식', time: 15, thumb: 'icon', icon: 'fe_143',
    ingredients: ['시래기 200g'], steps: ['볶는다.'], tags: [], savedAt: now, source: 'user' }],
  diary: [
    { id: 'd1', recipeId: 'u1', title: '들깨나물무침', at: now, rating: 5, note: '', photo: null },
    { id: 'd2', recipeId: 'u1', title: '들깨나물무침', at: now - day * 2, rating: 4, note: '', photo: null },
  ],
  seedV: BASICS_VERSION,
}

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
await page.goto('http://127.0.0.1:4346/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(700)
await page.locator('.seg', { hasText: '요리 기록' }).first().click(); await page.waitForTimeout(700)
await page.screenshot({ path: join(OUT, 'diary-a-입구.png') })
const btn = page.getByRole('button', { name: /다이어리 쓰기/ }).first()
if (await btn.isVisible().catch(() => false)) ok('요리 기록 탭에 「다이어리 쓰기」가 있다')
else no('「다이어리 쓰기」 버튼이 없다')

await btn.click(); await page.waitForTimeout(900)
await page.screenshot({ path: join(OUT, 'diary-b-화면.png') })
const paper = await page.locator('.paper').first().boundingBox()
if (!paper) no('종이가 없다')
else {
  const want = paper.width * 4 / 3
  if (Math.abs(paper.height - want) <= 2) ok(`종이 ${Math.round(paper.width)}x${Math.round(paper.height)} = 3:4`)
  else no(`종이가 3:4 가 아니다 (${Math.round(paper.width)}x${Math.round(paper.height)} · 기대 ${Math.round(want)})`)
}
if (await page.getByText('이 날 만든 요리').first().isVisible().catch(() => false)) ok('그날 만든 요리가 아래에 뜬다')
else no('그날 만든 요리가 안 뜬다')

// ⓒ 속지 갈아끼우기 — 「종이」 탭에서 크라프트, 「틀」 탭에서 사진일기
await page.locator('.seg', { hasText: '종이' }).first().click(); await page.waitForTimeout(400)
await page.getByRole('button', { name: '크라프트' }).first().click(); await page.waitForTimeout(400)
await page.locator('.seg', { hasText: '틀' }).first().click(); await page.waitForTimeout(400)
await page.getByRole('button', { name: '사진일기' }).first().click(); await page.waitForTimeout(600)
await page.screenshot({ path: join(OUT, 'diary-c-속지.png') })
const cls = await page.locator('.paper').first().getAttribute('class')
if (cls.includes('kraft') && cls.includes('art')) ok(`속지가 바뀐다 (${cls})`)
else no(`속지가 안 바뀐다 (${cls})`)

// ⓓ 꾸미기 — 판만 3:4 인 같은 에디터
await page.locator('[aria-label="다이어리 꾸미기"]').first().click(); await page.waitForTimeout(1400)
await page.getByRole('button', { name: '나중에' }).first().click({ timeout: 1500 }).catch(() => {})
await page.waitForTimeout(500)
await page.screenshot({ path: join(OUT, 'diary-d-꾸미기.png') })
const stage = await page.locator('.decor-stage > div').first().boundingBox()
if (stage && Math.abs(stage.height - stage.width * 4 / 3) <= 2) ok(`꾸미기 판도 3:4 (${Math.round(stage.width)}x${Math.round(stage.height)})`)
else no(`꾸미기 판이 3:4 가 아니다 (${stage ? Math.round(stage.width) + 'x' + Math.round(stage.height) : '없음'})`)

// ⓔ 📔 **표지 전용 UI 가 다이어리에 딸려오면 안 된다** (2026-08-06)
//   다이어리 캔버스는 `Thumb` 을 아예 안 그린다 → 「표지 그림 되돌리기」·「배경지」는 눌러도 아무 일이 없다.
//   ⛔ 아무 일도 안 하는 버튼은 고장으로 읽힌다.
const gone = async (name, re) => {
  const n = await page.getByText(re).count()
  if (n === 0) ok(`다이어리 꾸미기에 「${name}」 없음`)
  else no(`다이어리 꾸미기에 「${name}」이 그대로 딸려왔다 (${n}곳)`)
}
await gone('배경 탭', /^배경$/)
await gone('표지 그림', /표지 그림/)
await gone('배경지', /^배경지$/)

// ⭐ 반대쪽도 본다 — **표지 꾸미기엔 그대로 있어야 한다.**
//   (규칙 18 ⓘ = 「있으면 안 되는 것」만 보면, 셋 다 통째로 사라져도 통과한다)
await page.getByRole('button', { name: '취소' }).first().click(); await page.waitForTimeout(600)
await page.locator('.bar-btn[aria-label="뒤로"]').first().click(); await page.waitForTimeout(600)
await page.getByText('홈', { exact: true }).last().click(); await page.waitForTimeout(700)
await page.getByText('들깨나물무침', { exact: true }).first().click(); await page.waitForTimeout(800)
await page.locator('[aria-label="레시피 꾸미기"]').first().click(); await page.waitForTimeout(1400)
await page.getByRole('button', { name: '나중에' }).first().click({ timeout: 1500 }).catch(() => {})
await page.waitForTimeout(500)
for (const [name, re] of [['배경 탭', /^배경$/], ['표지 그림', /표지 그림/], ['배경지', /^배경지$/]]) {
  if (await page.getByText(re).count() > 0) ok(`표지 꾸미기엔 「${name}」 그대로 있다`)
  else no(`표지 꾸미기에서 「${name}」이 사라졌다 — 표지 쪽을 깨뜨렸다`)
}
await page.screenshot({ path: join(OUT, 'diary-e-표지꾸미기.png') })

if (errors.length) errors.forEach((e) => no(`pageerror — ${e}`))
else ok('pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
