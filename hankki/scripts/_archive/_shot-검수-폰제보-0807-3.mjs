// 🖼 검수판 — 창업자 폰 제보 넷을 고친 뒤 (2026-08-07 · 규칙 13)
//   📱 창업자 폰 그대로 = 1080×2340 · DPR 3 → CSS 360×780
//   ⛔ 줄이지 말 것 — 줄이면 「좁아진 게 보이나」를 판정할 수 없다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/검수-폰제보3'
mkdirSync(OUT, { recursive: true })
const DIST = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4439, r))
const { BASICS_VERSION } = await import('/home/user/hankki/hankki/src/data/basics.js')

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const decor = [
  { id: 'n1', type: 'note', key: 'kraft', text: '맛있는\n돼지고기\n김치찌개', font: 'tongtong', shape: 'star', pattern: 'line', x: 0.5, y: 0.5, s: 0.42, r: 4 },
]
const page = await (await b.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 3 })).newPage()
page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, { recipes: [], seedV: BASICS_VERSION, diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor }] })

await page.goto('http://127.0.0.1:4439/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1300)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1400)
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)

const shot = async (name) => {
  writeFileSync(join(OUT, `${name}.png`), await page.screenshot())
  console.log('  📸', name)
}
const tab = async (k) => { const t = page.locator(`button[data-ctxtab="${k}"]`); if (await t.count()) { await t.first().click(); await page.waitForTimeout(400) } }

// ① 포스트잇 고른 화면 — 창업자 사진 1과 «같은 자리»
await page.locator('.decor-stage [style*="rotate"]').first().click(); await page.waitForTimeout(600)
await shot('1-포스트잇-갈래줄')

// ② 「움직임」 갈래 — 제보 ⑴ 이 여기 있다
await tab('motion'); await shot('2-움직임-갈래')

// ③ 「효과」 갈래
await tab('fx'); await shot('3-효과-갈래')

// ④ 「모양」 갈래 — 옛날엔 다섯 줄이 한꺼번에 쌓여 있던 것
await tab('shape'); await shot('4-모양-갈래')

// ⑤ 접은 화면 — 창업자가 말한 「잠깐 숨기기」
await page.getByRole('button', { name: '설정 접기' }).click(); await page.waitForTimeout(400)
await shot('5-접은-화면')
await page.getByRole('button', { name: '설정 펴기' }).click(); await page.waitForTimeout(400)

// ⑥ 데코 스티커 — 친구가 아니어도 움직임·효과가 뜬다
await page.getByRole('button', { name: '데코', exact: true }).last().click(); await page.waitForTimeout(700)
const deco = page.locator('.decor-scroll button').filter({ has: page.locator('img') }).first()
if (await deco.count()) { await deco.click(); await page.waitForTimeout(900) }
await shot('6-데코스티커-움직임효과')

// ⑦ 글 상자 — 죽은 단추(무늬·모양·색)가 사라졌다
await page.getByRole('button', { name: '글자', exact: true }).last().click(); await page.waitForTimeout(700)
const boxBtn = page.locator('.decor-scroll button[aria-label^="글 상자"]').first()
if (await boxBtn.count()) { await boxBtn.click(); await page.waitForTimeout(900) }
await page.locator('.decor-stage').click({ position: { x: 14, y: 14 } }); await page.waitForTimeout(300)
const boxItem = page.locator('.decor-stage [style*="rotate"]').last()
if (await boxItem.count()) { await boxItem.click(); await page.waitForTimeout(600) }
await shot('7-글상자-죽은단추없음')

console.log(errs.length ? `\n⛔ pageerror ${errs.length}건 — ${errs[0]}` : '\n✅ pageerror 0')
await b.close(); srv.close()
console.log('📁', OUT)
