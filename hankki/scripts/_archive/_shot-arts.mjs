// 📄 속지 네 틀을 «한 장씩» 찍는다 — 줄 층을 바꿨을 때 나머지가 안 깨졌나 보려고 (2026-08-06)
//   ⛔ 검사가 초록불이어도 «무엇을 보는지»를 봐야 한다(규칙 18 ⓘ) — 여긴 눈으로 볼 판을 만드는 게 일이다.
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
await new Promise((r) => srv.listen(4351, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
const NOTE = '들기름 조금 더 넣으니 훨씬 고소했다. 다음엔 두부를 반 모 더.'
// ⭐ 틀마다 「어떤 선을 골랐나」를 달리 준다 — 줄·모눈·도트가 다 제자리에 그어지는지 본다
const ARTS = [
  ['photo', 'lined', '사진일기'],
  ['card', 'lined', '레시피기록'],
  ['today', 'lined', '오늘의한끼-줄'],
  ['today', 'grid', '오늘의한끼-모눈'],
  ['today', 'dots', '오늘의한끼-도트'],
  ['none', 'lined', '틀없음'],
]

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
let bad = 0
for (const [art, rule, name] of ARTS) {
  const state = {
    recipes: [],
    diary: [{
      id: 'dd', kind: 'diary', at: now,
      paper: { rule, skin: 'ivory', art }, decor: [],
      title: '엄마 김치찌개', note: NOTE, line: '오늘도 한 끼 해냈다',
      weather: 'partly', picks: { who: 'on', sky: 'on', score: '4' },
    }],
    seedV: BASICS_VERSION,
  }
  const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 3 })
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
  await page.addInitScript((s) => {
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1')
    for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
  }, state)
  await page.goto('http://127.0.0.1:4351/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
  await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
  await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
  const box = await page.locator('.paper').first().boundingBox()
  await page.screenshot({ path: join(OUT, `art-${name}.png`), clip: box })
  if (errors.length) { bad++; errors.forEach((e) => console.log('   ⛔', name, e)) }
  else console.log('   ✅', name)
  await page.close()
}
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건\n` : '\n✅✅ 여섯 판 다 찍었다 — 이제 눈으로 본다\n')
process.exit(bad ? 1 : 0)
