// 🎨 포스트잇 색 여섯 — 창업자 *"포스트잇은 색상이 넘 별로인데..."* (2026-08-07)
//   ⛔ 규칙 15 — 내가 「파스텔이라 그렇다」로 «이유»를 정하지 않는다. **먼저 실물을 찍어 보여준다.**
//   ⭐ 같이 보여줄 것 = 우리가 이미 가진 «종이색» 다섯(PAPER_SKINS: 아이보리·하늘·분홍·세이지·크라프트).
//      「글 상자」는 속지 위에 얹는 «종이»라 포스트잇 파스텔이 아니라 종이색이 맞을 수 있다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/포스트잇색'
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
await new Promise((r) => srv.listen(4417, r))
const { BASICS_VERSION } = await import('../src/data/basics.js')
const { NOTE_COLORS } = await import('../src/components/Stickers.jsx').catch(() => ({ NOTE_COLORS: null }))

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const errs = []
const cuts = {}
const page = await (await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 3 })).newPage()
page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, { recipes: [], seedV: BASICS_VERSION, diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor: [] }] })

const cut = async (name, sel, pad = 0) => {
  const box = await page.locator(sel).first().boundingBox()
  if (!box) { console.log('   ⛔ 못 찾음 —', name); return }
  cuts[name] = (await page.screenshot({ clip: {
    x: Math.max(0, Math.round(box.x - pad)), y: Math.max(0, Math.round(box.y - pad)),
    width: Math.round(box.width + pad * 2), height: Math.round(box.height + pad * 2) } })).toString('base64')
  console.log('  📸', name, `${Math.round(box.width)}×${Math.round(box.height)}px`)
}

await page.goto('http://127.0.0.1:4417/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1300)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1200)
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)
await page.getByRole('button', { name: '글자', exact: true }).last().click(); await page.waitForTimeout(700)

// ⛔ 서랍 칸을 통째로 찍으려다 «화면 밖»이라 죽었다(스크롤 칸이라 clip 이 뷰포트를 벗어난다).
//    📌 판정에 필요한 건 「서랍에서 어떻게 보이나」가 아니라 «종이 위에 얹힌 실물»이라 그것만 찍는다.

// ⛔⛔ 첫 판이 「색 칩을 못 찾았다」로 죽었다 — **검사가 틀린 게 아니라 그런 칩이 «없다».**
//    📌 포스트잇은 **서랍에서 색을 골라 붙이고, 붙인 뒤엔 색을 못 바꾼다.**
//       (2026-07-30 에 「직접 쓴 글자」엔 색 줄을 붙였는데 포스트잇엔 안 붙였다 —
//        창업자 원문이 *"이렇게 색깔고르는게 되게 불편하네... 한개씩 눌러서 아니면 지우고.."* 였는데
//        고친 건 글자뿐이었다. 포스트잇은 아직 «지우고 다시 붙여야» 색이 바뀐다.)
//    ✅ 그래서 서랍에서 **여섯 색을 하나씩 붙여** 한 판에 늘어놓고 찍는다.
const names = ['크림', '피치', '세이지', '하늘', '라벤더', '클레이']
const cells = page.locator('.decor-drawer button[aria-label*="포스트잇"]')
const n = await cells.count()
if (n < 6) { console.log(`⛔ 포스트잇 칸이 ${n}개뿐이다 — 검사 방식부터 볼 것`); await b.close(); srv.close(); process.exit(1) }
for (let i = 0; i < 6; i++) {
  await cells.nth(i).click(); await page.waitForTimeout(800)
  const ta = page.locator('.hk-sheet textarea, .sheet textarea, .hk-sheet input, .sheet input').first()
  if (await ta.count()) { await ta.fill(names[i]); await page.waitForTimeout(250) }
  const save = page.locator('.hk-sheet button, .sheet button').filter({ hasText: /저장|확인|넣기|완료|붙이기/ }).first()
  if (await save.count()) { await save.click(); await page.waitForTimeout(700) }
  // 격자로 늘어놓는다 — 겹치면 색을 못 견준다
  await page.evaluate(([k]) => {
    const el = [...document.querySelectorAll('.decor-stage [style*="rotate"]')].pop()
    if (!el) return
    el.style.left = `${22 + (k % 3) * 28}%`
    el.style.top = `${26 + Math.floor(k / 3) * 34}%`
    el.style.width = '26%'; el.style.height = '25%'
    el.style.transform = 'translate(-50%,-50%) rotate(0deg)'
  }, [i])
  await page.waitForTimeout(250)
}
// 고른 표시(점선·손잡이)가 판을 가리지 않게 종이 밖을 눌러 푼다
await page.mouse.click(8, 300); await page.waitForTimeout(500)
await cut('포스트잇-여섯색', '.decor-stage', 4)

console.log(errs.length ? `\n⛔ pageerror ${errs.length}건 — ${errs[0]}` : '\n✅ pageerror 0')
writeFileSync(join(OUT, 'cuts.json'), JSON.stringify(cuts))
if (NOTE_COLORS) writeFileSync(join(OUT, '색값.json'), JSON.stringify(NOTE_COLORS))
await b.close(); srv.close()
console.log('📁', OUT, `· 컷 ${Object.keys(cuts).length}장`)
