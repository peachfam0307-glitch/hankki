// 📐 「패드에서 쓸 수 있나 · 패드에 맞춰져 있나」 (창업자 2026-08-07
//    *"요리할때 패드 많이 켜놓던데.. 그럼 다이어리나 이런것도 패드로 꾸밀거아냐"*)
//   ⛔ 기억으로 답하지 않는다 — 실제 패드 크기로 띄워서 «재고 찍는다»(규칙 15).
//   📱 실제 기기 CSS 픽셀:
//      · 아이패드 10.9 세로 820×1180 · 가로 1180×820
//      · 갤탭 S9 세로 800×1280 · 가로 1280×800
//      · (견주기용) 창업자 폰 360×780
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/패드'
mkdirSync(OUT, { recursive: true })
const DIST = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4440, r))
const { BASICS_VERSION } = await import('/home/user/hankki/hankki/src/data/basics.js')

const 기기 = [
  { k: '폰-360x780', w: 360, h: 780 },
  { k: '아이패드-세로-820x1180', w: 820, h: 1180 },
  { k: '아이패드-가로-1180x820', w: 1180, h: 820 },
  { k: '갤탭-세로-800x1280', w: 800, h: 1280 },
]
const decor = [{ id: 'n1', type: 'note', key: 'kraft', text: '맛있는\n김치찌개', font: 'tongtong', shape: 'star', pattern: 'line', x: 0.5, y: 0.5, s: 0.42, r: 4 }]

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
for (const d of 기기) {
  const page = await (await b.newContext({ viewport: { width: d.w, height: d.h }, deviceScaleFactor: 2 })).newPage()
  page.on('pageerror', (e) => errs.push(`${d.k} — ${String(e.message || e).split('\n')[0]}`))
  await page.addInitScript((s) => {
    localStorage.clear()
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1')
    for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
  }, { recipes: [], seedV: BASICS_VERSION, diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor }] })
  await page.goto('http://127.0.0.1:4440/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1500)

  // ① 홈 — 앱이 화면 «어디»를 쓰나
  const m1 = await page.evaluate(() => {
    const f = document.querySelector('.app-frame')
    const r = f?.getBoundingClientRect()
    return {
      화면: `${window.innerWidth}×${window.innerHeight}`,
      앱틀: r ? `${Math.round(r.width)}×${Math.round(r.height)}` : '없음',
      좌우여백: r ? Math.round(window.innerWidth - r.width) : 0,
      쓰는비율: r ? Math.round(r.width / window.innerWidth * 100) : 0,
    }
  })
  writeFileSync(join(OUT, `${d.k}-1홈.png`), await page.screenshot())
  console.log(`\n📐 ${d.k}`)
  console.log('   화면', m1.화면, '· 앱 틀', m1.앱틀, `· 좌우 빈칸 ${m1.좌우여백}px · 화면의 ${m1.쓰는비율}% 만 씀`)

  // ② 꾸미기 화면 — 다꾸는 여기서 한다
  await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(600)
  await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(600)
  await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1000)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1500)
  await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)
  const m2 = await page.evaluate(() => {
    const ed = document.querySelector('.decor-editor'), st = document.querySelector('.decor-stage')
    const sc = document.querySelector('.decor-scroll')
    const R = (e) => (e ? e.getBoundingClientRect() : null)
    const e = R(ed), s = R(st), c = R(sc)
    return {
      꾸미기틀: e ? `${Math.round(e.width)}px` : '없음',
      종이: s ? `${Math.round(s.width)}×${Math.round(s.height)}` : '없음',
      서랍스크롤: c ? Math.round(c.height) : 0,
      좌우여백: e ? Math.round(window.innerWidth - e.width) : 0,
    }
  })
  writeFileSync(join(OUT, `${d.k}-2꾸미기.png`), await page.screenshot())
  console.log('   꾸미기 틀', m2.꾸미기틀, '· 종이', m2.종이, '· 서랍 스크롤', m2.서랍스크롤 + 'px', '· 좌우 빈칸', m2.좌우여백 + 'px')
  await page.context().close()
}
console.log(errs.length ? `\n⛔ pageerror ${errs.length}건 — ${errs[0]}` : '\n✅ pageerror 0')
await b.close(); srv.close()
console.log('📁', OUT)
