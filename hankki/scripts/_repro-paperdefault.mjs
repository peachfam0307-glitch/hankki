// 📔 「처음 일기 쓰기를 누르면 뭐가 골라져 있나」 — 창업자 2026-08-06 제보 재현판
//   창업자 원문 = *"처음에 일기쓰기 클릭하면 다 왼쪽껄로 고르게 해줘. 없음이랑 아이보리..
//     지금은 도트랑 막 중구난방으로 골라져있어."*
//   ⛔ 「고쳤다」고 말하기 전에 **무엇이 골라져 있는지부터** 눈이 아니라 코드로 읽는다.
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
await new Promise((r) => srv.listen(4354, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
// ⭐ **일기가 하나도 없는 폰** — 「처음」이라는 말 그대로
const state = { recipes: [], diary: [], seedV: BASICS_VERSION }

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const page = await b.newPage({ viewport: { width: 360, height: 880 }, deviceScaleFactor: 3 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, state)
await page.goto('http://127.0.0.1:4354/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(600)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1000)
await page.getByRole('button', { name: /꾸미기/ }).first().click(); await page.waitForTimeout(1000)
// 「속지 고르기」 칸으로
await page.locator('.decor-editor .segment .seg').first().click(); await page.waitForTimeout(700)

// 📐 절마다 «골라진 칸이 몇 번째인가» — 이름이 아니라 «자리»로 읽는다(라벨은 바뀔 수 있다)
const picked = await page.evaluate(() => {
  const out = []
  for (const sec of document.querySelectorAll('.decor-editor .decor-sec')) {
    const label = sec.querySelector('.decor-sec-label')?.textContent?.trim() || '?'
    const cells = [...sec.querySelectorAll('button')]
    if (!cells.length) continue
    // 고른 칸 = 스와치에 포인트색 테두리(`box-shadow 0 0 0 2.5px`)가 둘린 것
    // ⛔ `border-width` 로 찾으면 «못 찾고» idx -1 이 나온다 — 실제로 처음에 그렇게 틀렸다(규칙 18)
    const idx = cells.findIndex((c) => {
      const sw = c.querySelector('div')
      return sw && /2\.5px/.test(getComputedStyle(sw).boxShadow || '')
    })
    out.push({ label, idx, n: cells.length, name: (cells[idx]?.textContent || '').trim() })
  }
  return out
})
console.log('   📐 절마다 고른 자리:', JSON.stringify(picked, null, 0))
for (const s of picked) {
  if (s.idx === 0) ok(`「${s.label}」 = 맨 왼쪽 (${s.name || s.idx + 1}번째)`)
  else no(`「${s.label}」 이 ${s.idx + 1}번째로 골라져 있다 (${s.name}) — 맨 왼쪽이라야 한다`)
}

await page.screenshot({ path: join(OUT, 'paperdefault-서랍.png') })
if (errors.length) errors.forEach((e) => no(`pageerror — ${e}`))
else ok('pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
process.exit(bad ? 1 : 0)
