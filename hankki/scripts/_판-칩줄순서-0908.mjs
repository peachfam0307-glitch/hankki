// 🔀 칩 두 줄의 «순서» 두 안 — 진짜 앱을 띄워 찍는다 (2026-09-08)
// 📮 창업자 = *"해볼것 최애 자주 sns를 아랫줄로할까?"*
// ⛔ 그려서 흉내내지 않는다(절대원칙 30). ⛔ 소스는 안 고친다 — 화면에서 두 줄을 «바꿔 끼워» 견준다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad'
mkdirSync(OUT, { recursive: true })
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4391, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const now = Date.now()
// 꽂힌 것이 있어야 칩이 선다 — 해볼 것 1 · 최애 1
const 요리 = [['들깨나물무침','fe_143','한식','chef'], ['콩나물국','fh_k02','한식','heart'], ['제육볶음','fe_18','한식',null], ['카레','fe_18','일식',null]]
const state = {
  recipes: 요리.map(([t, ic, cat, pin], i) => ({
    id: 'x'.repeat(i + 1), title: t, category: cat, time: 15, thumb: 'icon', icon: ic,
    ingredients: ['재료 1'], steps: ['끓여요.'], tags: [], savedAt: now - i * 1000,
    source: 'user', status: 'sorted', favorite: !!pin, favPin: pin || undefined, cooked: i === 2 ? 5 : 0,
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
await page.goto('http://127.0.0.1:4391/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1400)
await page.getByText('레시피', { exact: true }).last().click()
await page.waitForTimeout(1100)

const 자리 = await page.evaluate(() => {
  const 줄 = [...document.querySelectorAll('.hscroll')].slice(-2)
  const a = 줄[0].getBoundingClientRect(), b = 줄[1].getBoundingClientRect()
  const 카드 = document.querySelector('.grid-card')?.getBoundingClientRect()
  return { x: 0, y: Math.max(0, a.top - 6), width: 360, height: Math.round((카드 ? 카드.bottom : b.bottom) - a.top + 14) }
})
const 판 = []
판.push(join(OUT, '칩-ㄱ-지금.png'))
await page.screenshot({ path: 판[0], clip: 자리 })
// ㄴ안 = 두 줄을 바꿔 끼운다
await page.evaluate(() => {
  const 줄 = [...document.querySelectorAll('.hscroll')].slice(-2)
  줄[0].parentElement.insertBefore(줄[1], 줄[0])
})
await page.waitForTimeout(300)
판.push(join(OUT, '칩-ㄴ-바꾼안.png'))
await page.screenshot({ path: 판[1], clip: 자리 })
await b.close(); srv.close()

const { execFileSync } = await import('node:child_process')
execFileSync('python3', ['-c', `
from PIL import Image, ImageDraw
import sys
ims=[Image.open(p).convert('RGB') for p in sys.argv[1:]]
S=0.34
cw,ch=int(ims[0].width*S),int(ims[0].height*S)
out=Image.new('RGB',(cw*2+12,ch+24),(255,255,255)); d=ImageDraw.Draw(out)
for k,(im,n) in enumerate(zip(ims,['ㄱ 지금(특별칩이 위)','ㄴ 바꾼안(폴더가 위)'])):
    out.paste(im.resize((cw,ch),Image.LANCZOS),(k*(cw+12),24)); d.text((k*(cw+12)+4,7),n,fill=(30,30,30))
out.save('${join(OUT, '칩줄순서.jpg')}',quality=88)
print(out.size)`, ...판], { stdio: 'inherit' })
if (errors.length) { console.log('⛔ 화면 오류'); errors.forEach((e) => console.log('  ' + e)); process.exit(1) }
console.log('✅ 오류 0')
