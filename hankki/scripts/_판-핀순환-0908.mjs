// 🔁 핀 순환 시안 — **실제 앱을 눌러서** 네 상태를 찍는다 (2026-09-08)
//
// 📮 창업자 = *"이따가 한번 볼게 시안 돌아가는거"*
// ⭐ 도는 차례 = 비어 있음(연한 모자) → 요리사모자 → 하트 → 비어 있음
//
// ⛔ 그려서 흉내내지 않는다 — **진짜 `dist` 를 띄우고 진짜 단추를 누른다**(절대원칙 30).
//    그래야 크기·자리·그림이 앱과 «같은 값»이다.
// ⛔ 카드 하나만 잘라 찍는다 — 판이 크면 창이 찬다(오늘 세 번 터졌다).
//
// 실행: SMOKE_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/_판-핀순환-0908.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad'
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
await new Promise((r) => srv.listen(4390, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
const 요리 = ['들깨나물무침', '콩나물국', '제육볶음']
const 아이콘 = ['fe_143', 'fh_k02', 'fe_18']
const state = {
  recipes: 요리.map((t, i) => ({
    id: 'x'.repeat(i + 1), title: t, category: '한식', time: 15, thumb: 'icon', icon: 아이콘[i],
    ingredients: ['재료 1'], steps: ['끓여요.'], tags: [], savedAt: now - i * 1000,
    source: 'user', status: 'sorted', favorite: false, cooked: 0,
  })),
  diary: [], seedV: BASICS_VERSION,
}

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 3 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1'); localStorage.setItem('hankki:gridSize', 'small')
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, state)
await page.goto('http://127.0.0.1:4390/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1400)
await page.getByText('레시피', { exact: true }).last().click()
await page.waitForTimeout(1100)

// 첫 카드 하나만 남긴다 — 판이 작아야 창이 안 찬다
await page.evaluate(() => {
  const cards = [...document.querySelectorAll('.grid-card')]
  cards.slice(1).forEach((c) => { const w = c.closest('div'); (w || c).style.visibility = 'hidden' })
})

// 📮 창업자 = *"칩도 시안이 안보여"* — 카드만 잘랐더니 두 줄 칩이 통째로 빠졌다.
//   ⭐ 이제 **칩 줄 맨 위부터 첫 카드 아래까지** 자른다. 최애 칩이 서는지도 여기서 눈으로 본다.
const 자리 = await page.evaluate(() => {
  const 단추 = document.querySelector('.fav-dot')
  if (!단추) return null
  const 칸 = 단추.parentElement.getBoundingClientRect()
  const 칩줄 = [...document.querySelectorAll('.hscroll')].filter((e) => e.getBoundingClientRect().top < 칸.top)
  const 위 = 칩줄.length ? Math.min(...칩줄.map((e) => e.getBoundingClientRect().top)) : 칸.top - 22
  return {
    x: 0,
    y: Math.max(0, 위 + window.scrollY - 6),
    width: 360,
    height: Math.round(칸.bottom - 위 + 18),
  }
})
if (!자리) throw new Error('⛔ 핀 단추(.fav-dot)를 못 찾았다 — 「0개」로 넘어가지 말 것')

const 칸들 = []
for (const 이름 of ['①비어있음', '②모자(해볼 것)', '③하트(최애)', '④다시 비어있음']) {
  const 판 = join(OUT, `핀-${이름}.png`)
  await page.screenshot({ path: 판, clip: 자리 })
  // 읽어주는 이름표도 같이 남긴다 — 눈으로 못 보는 사람에게 이게 전부다
  const 라벨 = await page.evaluate(() => document.querySelector('.fav-dot')?.getAttribute('aria-label') || '')
  칸들.push({ 이름, 판, 라벨 })
  await page.locator('.fav-dot').first().click()
  await page.waitForTimeout(450)
}
await b.close(); srv.close()

// 네 칸을 한 장으로 — Read 한 번이면 되게
const { execFileSync } = await import('node:child_process')
const py = `
from PIL import Image, ImageDraw
import sys
paths = sys.argv[1::2]; names = sys.argv[2::2]
ims = [Image.open(p).convert('RGB') for p in paths]
w = max(i.width for i in ims); h = max(i.height for i in ims)
S = 0.5
cw, ch = int(w*S), int(h*S)
out = Image.new('RGB', (cw*len(ims), ch+26), (231,235,224))
d = ImageDraw.Draw(out)
for k,(im,n) in enumerate(zip(ims,names)):
    out.paste(im.resize((cw,ch), Image.LANCZOS), (k*cw, 26))
    d.text((k*cw+6, 8), n, fill=(40,40,40))
out.save('${join(OUT, '핀-순환.png')}')
print(out.size)
`
execFileSync('python3', ['-c', py, ...칸들.flatMap((c) => [c.판, c.이름])], { stdio: 'inherit' })

console.log('\n🔁 읽어주는 이름표(그 상태에서 «누르면 무엇이 되는지»)')
for (const c of 칸들) console.log(`   ${c.이름.padEnd(16)} → "${c.라벨}"`)
if (errors.length) { console.log('\n⛔ 화면 오류'); errors.forEach((e) => console.log('   ' + e)); process.exit(1) }
console.log('\n✅ 오류 0')
