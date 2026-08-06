// 🔎 폰 제보 재현 — 창업자 2026-08-07 아침
//   ⛔ 짐작으로 고치지 않는다. 「진짜 그런가」를 먼저 화면에서 확인한다(규칙 7).
//
//   ③ 스티커 붙이고 다른 데를 눌러도 «편집 표시창»이 안 없어진다
//   ① 만족도 트래커가 «하나»만 칠해진다 (별점처럼 1~N 이 다 차야 한다)
//   ② 글쓰기 중 키보드가 뜨면 속지가 «반토막» 난다
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
mkdirSync(OUT, { recursive: true })
const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4381, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
// 📄 창업자가 쓴 속지 = 「오늘의 한끼」(today) · 스티커 하나 얹어 둔다
const state = {
  recipes: [],
  diary: [{
    id: 'dd', kind: 'diary', at: Date.now(),
    paper: { rule: 'write', skin: 'ivory', art: 'today' }, note: '',
    decor: [{ id: 'b1', type: 'sticker', key: 'gp_gomhi', x: 0.5, y: 0.5, s: 0.26, r: 0 }],
  }],
  seedV: BASICS_VERSION,
}

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, state)
await page.goto('http://127.0.0.1:4381/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(600)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1000)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1000)
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(600)

const stage = await page.locator('.decor-stage').first().boundingBox()
// 「편집 표시창」이 떠 있나 = 지우기 단추가 판 위에 있나
const editUi = () => page.locator('.decor-stage button[aria-label="스티커 삭제"]').count()

console.log('\n════ ③ 스티커 고른 뒤 「다른 데」를 누르면 편집 표시창이 사라지나 ════')
const bear = page.locator('.decor-stage img[src*="gp_gomhi"]').first()
const bb = await bear.boundingBox()
await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.waitForTimeout(500)
console.log('   고른 직후 편집 표시창 =', await editUi(), '(1이라야 정상)')

// ⓐ 종이 «위쪽 빈 곳»(사진칸 언저리)을 눌러본다 — 창업자가 실제로 하는 행동
await page.mouse.click(stage.x + stage.width * 0.5, stage.y + stage.height * 0.18); await page.waitForTimeout(500)
console.log('   종이 위쪽을 누른 뒤   =', await editUi(), '(0이라야 사라진 것)')
await page.screenshot({ path: join(OUT, '제보3-종이위쪽.png') })

// ⓑ 종이 «바깥»(회색 여백)을 눌러본다
await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.waitForTimeout(400)
await page.mouse.click(stage.x + stage.width * 0.04, stage.y + stage.height * 0.5); await page.waitForTimeout(500)
console.log('   종이 «바깥»을 누른 뒤 =', await editUi(), '(0이라야 사라진 것)')

console.log('\n════ ① 만족도를 3으로 고르면 몇 개가 칠해지나 ════')
await page.getByRole('button', { name: '속지', exact: true }).first().click(); await page.waitForTimeout(900)
const three = page.getByRole('button', { name: '만족도 3' })
if (await three.count() === 0) console.log('   ⛔ 「만족도 3」 단추를 못 찾았다')
else {
  const blocker = await page.evaluate(() => {
    const b = [...document.querySelectorAll('[aria-label="만족도 3"]')][0]
    const r = b.getBoundingClientRect()
    const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
    return { btn: Math.round(r.width) + 'x' + Math.round(r.height), top: top ? (top.tagName + '.' + (top.className || '(무)') + ' ' + (top.getAttribute('aria-label') || '')) : '없음' }
  })
  console.log('   단추 크기 =', blocker.btn, '· 그 자리 «맨 위» 요소 =', blocker.top)
  await three.first().click({ force: true }); await page.waitForTimeout(600)
  const lit = await page.evaluate(() => [...document.querySelectorAll('[aria-label^="만족도 "]')]
    .filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.getAttribute('aria-label')))
  console.log('   3을 눌렀을 때 칠해진 것 =', lit.length, '개 →', lit.join(' · '))
  console.log('   (창업자가 원하는 것 = 3개 — 1·2·3 이 다 차는 별점 문법)')
}

console.log('\n════ ② 글쓰기 중 키보드가 뜨면 속지가 얼마나 작아지나 ════')
await page.getByRole('button', { name: '글쓰기', exact: true }).first().click(); await page.waitForTimeout(900)
const paperBox = async () => {
  const el = page.locator('.decor-stage .paper-sheet, .decor-stage [class*="paper"]').first()
  return (await el.count()) ? await el.boundingBox() : await page.locator('.decor-stage').first().boundingBox()
}
const before = await paperBox()
console.log('   키보드 «전» 속지 높이 =', Math.round(before.height), 'px')
// 📱 폰에서 키보드가 뜨면 «보이는 화면»이 줄어든다 — 뷰포트를 줄여 흉내낸다
await page.setViewportSize({ width: 360, height: 420 }); await page.waitForTimeout(700)
const after = await paperBox()
console.log('   키보드 «후» 속지 높이 =', Math.round(after.height), 'px',
  `→ ${Math.round((after.height / before.height) * 100)}% 로 줄었다`)
await page.screenshot({ path: join(OUT, '제보2-키보드올라온뒤.png') })

await b.close(); srv.close()
