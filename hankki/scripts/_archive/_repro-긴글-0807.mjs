// 🔬 「긴 글이 잘린다」·「엔터를 치면 줄이 바뀌게」 — 창업자 2026-08-07
//   ⛔ 코드에 엔터를 가로채는 곳은 없다(grep). 그러면 «왜» 안 되는 것처럼 보이나?
//      → 짐작하지 말고 재현한다(규칙 7·18).
//   ⭐ 가설 = 엔터는 «먹는데» 줄이 늘어나 상자 밖으로 밀려 `overflow:hidden` 에 잘린다.
//      둘은 처방이 정반대라 반드시 갈라야 한다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const DIST = '/home/user/hankki/hankki/dist'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4431, r))
const { BASICS_VERSION } = await import('/home/user/hankki/hankki/src/data/basics.js')

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
let bad = 0
const page = await (await b.newContext({ viewport: { width: 360, height: 800 } })).newPage()
page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, { recipes: [], seedV: BASICS_VERSION, diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor: [] }] })
await page.goto('http://127.0.0.1:4431/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1300)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1200)
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: '글자', exact: true }).last().click(); await page.waitForTimeout(700)

// 글이 상자를 «넘치나» — 넘친 픽셀을 잰다
const over = () => page.evaluate(() => {
  // ⛔ find() 는 «첫 번째»를 잡는다 — 두 번째 포스트잇을 붙여도 앞엣것을 계속 봐서
  //    ⑵ 가 ⑴ 과 똑같은 값으로 «거짓 통과»했다(2026-08-07). 마지막에 붙인 것을 본다.
  const all = [...document.querySelectorAll('.decor-stage div')].filter((d) => getComputedStyle(d).whiteSpace === 'pre-wrap' && d.textContent)
  const t = all[all.length - 1]
  if (!t) return null
  const r = document.createRange(); r.selectNodeContents(t)
  const rows = [...r.getClientRects()]
  const box = t.getBoundingClientRect()
  const top = Math.min(...rows.map((x) => x.top)), bot = Math.max(...rows.map((x) => x.bottom))
  return {
    줄: new Set(rows.map((x) => Math.round(x.top))).size,
    넘침: Math.round(Math.max(0, box.top - top) + Math.max(0, bot - box.bottom)),
    글씨: getComputedStyle(t).fontSize,
    글: t.textContent.replace(/\n/g, '⏎'),
  }
})
const ok = (t, c, m) => { console.log(`   ${c ? '✅' : '⛔'} ${t}${m ? ' — ' + m : ''}`); if (!c) bad++ }

console.log('\n── ⑴ 엔터가 «먹는가» ──')
await page.locator('.decor-drawer button[aria-label*="포스트잇"]').first().click(); await page.waitForTimeout(700)
const ta = page.locator('.decor-stage textarea[data-boxtext]').first()
await ta.click()
await ta.type('첫줄'); await page.keyboard.press('Enter'); await ta.type('둘째줄'); await page.waitForTimeout(400)
const val = await ta.inputValue()
ok('엔터가 값에 줄바꿈을 넣는다', val.includes('\n'), JSON.stringify(val))
await page.mouse.click(8, 300); await page.waitForTimeout(400)
const m1 = await over()
console.log('     ', JSON.stringify(m1))
ok('두 줄이 «화면에» 그려진다', m1 && m1.줄 >= 2)
ok('상자 밖으로 안 넘친다', m1 && m1.넘침 === 0, m1 ? `넘침 ${m1.넘침}px` : '')

console.log('\n── ⑵ 긴 글이 잘리나 ──')
await page.locator('.decor-drawer button[aria-label*="포스트잇"]').nth(2).click(); await page.waitForTimeout(700)
const ta2 = page.locator('.decor-stage textarea[data-boxtext]').first()
await ta2.fill('오늘은 김치찌개를 끓였는데\n국물이 진하고 돼지고기가\n푹 익어서 아주 맛있었다\n다음에 또 해먹어야지')
await page.waitForTimeout(400)
await page.mouse.click(8, 300); await page.waitForTimeout(400)
const m2 = await over()
console.log('     ', JSON.stringify(m2))
ok('긴 글도 상자 «안»에 다 들어간다', m2 && m2.넘침 === 0, m2 ? `넘침 ${m2.넘침}px · ${m2.줄}줄 · 글씨 ${m2.글씨}` : '')

console.log(errs.length ? `\n⛔ pageerror ${errs.length}건 — ${errs[0]}` : '\n✅ pageerror 0')
await b.close(); srv.close()
console.log(bad === 0 ? '\n✅✅ 전부 통과' : `\n⛔ ${bad}건 어긋남`)
process.exit(bad === 0 && errs.length === 0 ? 0 : 1)
