// 🔬 창업자 폰 제보 셋 (2026-08-07 밤 · v9.97 쓰면서)
//   ⑴ 「갈래·칩 줄이 아래 일꾸/레꾸 탭보다 너무 낮아 시선이 안 가고, 둘이 구분이 안 된다」 → 높이를 «잰다»
//   ⑵ 「스티커 붙이면 글자 바로 쓰기 안 된다 · 여긴 색깔 정하는 것도 없다」
//   ⑶ 「일꾸 눌러서 스티커 정해서 누르면 반응 없어. 옆에 속지를 눌러야 글씨가 나와」
//   ⛔ 짐작 금지 — 화면에서 잰 값·실제 클릭 결과만 찍는다.
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
await new Promise((r) => srv.listen(4441, r))
const { BASICS_VERSION } = await import('/home/user/hankki/hankki/src/data/basics.js')

let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad += 1; console.log('   ⛔', m) }

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
const page = await (await b.newContext({ viewport: { width: 360, height: 780 }, deviceScaleFactor: 2 })).newPage()
page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  const _g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : _g.call(this, k) }
}, { recipes: [], seedV: BASICS_VERSION, diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor: [] }] })

await page.goto('http://127.0.0.1:4441/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1400)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1400)
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(700)

// ── ⑵ 데코 탭에서 «그냥 스티커» 하나 붙인다 ─────────────────
console.log('\n── ⑵⑶ 데코 탭 스티커: 붙이고 → 탭하면 반응하나 ──')
await page.getByRole('button', { name: '데코', exact: true }).last().click(); await page.waitForTimeout(700)
const chip = page.locator('.decor-scroll button').filter({ has: page.locator('img') }).first()
if (await chip.count() === 0) { no('데코 서랍에 스티커가 없다'); }
else {
  await chip.click(); await page.waitForTimeout(900)
  const put = await page.locator('.decor-stage [style*="rotate"]').count()
  if (put > 0) ok(`스티커가 붙었다 (${put}개)`) ; else no('스티커가 안 붙었다')

  // 붙인 «직후» 상태 — 갈래가 뜨나 · 커서가 들어갔나
  const after = await page.evaluate(() => ({
    갈래: [...document.querySelectorAll('button[data-ctxtab]')].map((x) => x.textContent.trim()),
    타이핑: !!document.querySelector('.decor-stage textarea'),
  }))
  console.log('   ℹ️ 붙인 직후 갈래 =', JSON.stringify(after.갈래), '· 글칸 커서 =', after.타이핑 ? '있다' : '없다')

  // 판 밖을 눌러 고르기를 풀고 → 다시 스티커를 «탭» 한다 (창업자가 말한 그 동작)
  await page.mouse.click(8, 300); await page.waitForTimeout(400)
  const before = await page.evaluate(() => !!document.querySelector('button[data-ctxtab]'))
  await page.locator('.decor-stage [style*="rotate"]').first().click(); await page.waitForTimeout(600)
  const now = await page.evaluate(() => ({
    갈래: [...document.querySelectorAll('button[data-ctxtab]')].map((x) => x.textContent.trim()),
    손잡이: document.querySelectorAll('.decor-stage svg').length,
  }))
  if (!before && now.갈래.length) ok(`스티커를 탭하니 반응한다 — 갈래 ${JSON.stringify(now.갈래)}`)
  else no(`스티커를 탭해도 반응이 없다 (탭 전 갈래 ${before} · 탭 후 ${JSON.stringify(now.갈래)})`)

  if (now.갈래.includes('글씨')) ok('데코 스티커에도 「글씨」 갈래가 있다')
  else no('⑵ 데코 스티커엔 「글씨」 갈래가 없다 — 글을 못 얹는다')
  if (now.갈래.includes('색')) ok('데코 스티커에 「색」 갈래가 있다')
  else no('⑵ 이 스티커엔 「색」 갈래가 없다 (색 바꾸기 목록에 없는 컷이면 정상)')
}

// ── ⑶ 「글자」 탭 글 상자는 붙이면 바로 쳐지나 ────────────────
console.log('\n── ⑶ 글자 탭 글 상자: 붙이면 그 자리에서 쳐지나 ──')
await page.getByRole('button', { name: '글자', exact: true }).last().click(); await page.waitForTimeout(700)
const box = page.locator('.decor-scroll button[aria-label^="글 상자"]').first()
if (await box.count() === 0) no('글 상자 단추를 못 찾았다')
else {
  await box.click(); await page.waitForTimeout(900)
  const t = await page.evaluate(() => {
    const ta = document.querySelector('.decor-stage textarea')
    return { 있다: !!ta, 포커스: ta ? document.activeElement === ta : false }
  })
  if (t.있다 && t.포커스) ok('글 상자는 붙이면 그 자리에 커서가 들어간다')
  else no(`글 상자에 커서가 안 들어갔다 (textarea ${t.있다} · focus ${t.포커스})`)
}

// ── ⑴ 높이 재기 ──────────────────────────────────────────
console.log('\n── ⑴ 줄마다 높이가 얼마나 다른가 ──')
await page.mouse.click(8, 300); await page.waitForTimeout(300)
await page.locator('.decor-stage [style*="rotate"]').first().click(); await page.waitForTimeout(600)
const h = await page.evaluate(() => {
  const R = (e) => (e ? Math.round(e.getBoundingClientRect().height) : 0)
  const ctx = document.querySelector('.decor-ctx')
  const tabRow = ctx?.children[0]
  const chipRow = ctx?.children[1]
  const 갈래칩 = tabRow?.querySelector('button[data-ctxtab]')
  const 칩 = chipRow?.querySelector('button')
  // 큰 칸 = 속지·글쓰기·일꾸·레꾸
  const big = [...document.querySelectorAll('.decor-drawer button')].find((x) => x.textContent.trim() === '일꾸')
  // 서랍 안쪽 탭 = 마테·데코·글자
  const sub = [...document.querySelectorAll('.decor-drawer button')].find((x) => x.textContent.trim() === '데코')
  return {
    갈래칩: R(갈래칩), 칩: R(칩),
    갈래줄: R(tabRow), 칩줄: R(chipRow), 컨텍스트바: R(ctx),
    큰칸_일꾸: R(big), 서랍탭_데코: R(sub),
  }
})
console.log('   📐', JSON.stringify(h, null, 1))
const 손가락 = 44   // 손이 닿는 최소 크기(접근성 기준) — CLAUDE.md v9.47 에서 이미 쓴 값
for (const [k, v] of [['갈래 칩', h.갈래칩], ['칩', h.칩], ['서랍 탭(데코)', h.서랍탭_데코], ['큰 칸(일꾸)', h.큰칸_일꾸]]) {
  console.log(`   ${v >= 손가락 ? '✅' : '⛔'} ${k} ${v}px ${v >= 손가락 ? '' : `— 손가락 최소 ${손가락}px 보다 ${손가락 - v}px 작다`}`)
}
console.log(`   📏 큰 칸 ${h.큰칸_일꾸}px vs 갈래 칩 ${h.갈래칩}px = ${(h.큰칸_일꾸 / (h.갈래칩 || 1)).toFixed(2)}배 차이`)

console.log(errs.length ? `\n⛔ pageerror ${errs.length}건 — ${errs[0]}` : '\n✅ pageerror 0')
await b.close(); srv.close()
console.log(bad ? `\n⛔⛔ ${bad}건 어긋남\n` : '\n✅✅ 전부 통과\n')
