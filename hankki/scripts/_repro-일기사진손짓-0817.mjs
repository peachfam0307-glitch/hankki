// 🫳 일기 속지 사진 「끌어서 옮기기」가 살아 있나 — 안전망 (2026-08-17)
//
// ⛔⛔ **이 판이 «없어서» 위험했다.** 2026-08-17 에 손짓 코드를 `src/photoPan.js` 로 옮겼는데
//    (창업자 *"확대 축소도 가능하게"* — 표지 사진에도 같은 손짓이 필요해졌다),
//    일기 쪽이 깨져도 **아무도 모르는 상태**였다. smoke 어디에도 이 손짓을 재는 판이 없었다.
//    ⭐ 그래서 옮기기 «직후»에 만들었다 — 다음에 이 코드를 또 건드릴 때 이 판이 잡는다.
//
// ⚠️ 두 손가락(핀치)은 이 판에서 못 흉내낸다(Playwright 단일 포인터) — **한 손가락 끌기**로 «손짓이 붙었나»를 잰다.
//    배율 계산은 `photoPan.js` 안에서 끌기와 «같은 상태»를 공유하므로, 끌기가 살아 있으면 배선은 붙어 있다.
//
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_repro-일기사진손짓-0817.mjs
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
await new Promise((r) => srv.listen(4368, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
// 🖼 저장소에 이미 있는 PNG 를 dataURL 로 — ⛔테스트용 그림을 새로 만들지 않는다.
const dataUrl = 'data:image/png;base64,' + readFileSync(join(ROOT, 'src/assets/gom-header.png')).toString('base64')
const now = Date.now()
const state = {
  recipes: [],
  // 📔 「사진일기」 속지(`art: 'photo'`) — 사진칸 키가 'photo' 다(`data/papers.js:85·98`)
  diary: [{ id: 'j1', kind: 'diary', at: now, paper: { rule: 'plain', skin: 'ivory', art: 'photo' }, photo: dataUrl, decor: [], note: '' }],
  seedV: BASICS_VERSION,
}

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 2 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, state)
await page.goto('http://127.0.0.1:4368/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(1000)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1200)

// ① 사진이 그려졌나 (속지가 안 깨졌나)
const 사진 = page.locator('.paper img').first()
if (await 사진.count() > 0) ok('사진일기 속지에 사진이 그려진다')
else no('속지에 사진이 안 보인다 — 손짓을 옮기며 깨졌다')
await page.screenshot({ path: join(OUT, '일기사진-1.png') })

// ②⭐ **손짓이 붙어 있나** — 이게 이 판의 심장
const 칸 = page.locator('[aria-label^="사진 —"]').first()
if (await 칸.count() === 0) no('사진칸에 손짓이 안 붙었다 (aria-label 없음)')
else {
  ok('사진칸에 손짓이 붙어 있다')
  const box = await 칸.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 30, { steps: 8 })
  await page.mouse.up()
  await page.waitForTimeout(700)
  const 자리 = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
    const j = (s.diary || []).find((x) => x.id === 'j1') || {}
    return j.photoPos || '(없음)'
  })
  if (자리 !== '(없음)' && 자리 !== '50% 50%') ok(`끌면 자리가 저장된다 — photoPos = ${자리}`)
  else no(`끌었는데 자리가 안 바뀐다 — ${자리}`)
}

if (errors.length) errors.forEach((e) => no(`pageerror — ${e}`))
else ok('pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
