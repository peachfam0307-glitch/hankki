// 📏 「움직임 ／ 효과」 줄이 «옆으로» 얼마나 밀리나 — 두 단추로 가르기 전/후 대조
//   ⛔ 규칙 15 — 「좁아 보인다」로 정하지 않는다. **밀림(scrollWidth − clientWidth)을 잰다.**
//   ⭐ 판정 = 밀림 0 이면 칩이 전부 «한 화면 안»에 있다. 0 보다 크면 그만큼 손가락으로 밀어야 보인다.
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
await new Promise((r) => srv.listen(4421, r))
const { BASICS_VERSION } = await import('/home/user/hankki/hankki/src/data/basics.js')

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const errs = []
// 📱 폰 세 폭에서 잰다 — 320(제일 좁은 것)·360(제일 흔한 것)·412(큰 것)
const W = Number(process.argv[2] || 360)
const page = await (await b.newContext({ viewport: { width: W, height: 800 } })).newPage()
page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
await page.addInitScript((s) => {
  localStorage.clear()
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  for (const k of ['home', 'home2', 'detail', 'brag', 'shop', 'myrecipes', 'profile', 'decor']) localStorage.setItem(`hankki:coach:${k}`, '1')
}, { recipes: [], seedV: BASICS_VERSION, diary: [{ id: 'dd', kind: 'diary', at: Date.now(), paper: { rule: 'plain', skin: 'ivory', art: 'none' }, note: '', decor: [] }] })

await page.goto('http://127.0.0.1:4421/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1300)
await page.getByText('레시피', { exact: true }).last().click(); await page.waitForTimeout(500)
await page.locator('.segment .seg').nth(1).click(); await page.waitForTimeout(500)
await page.getByRole('button', { name: /일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(900)
await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1200)
await page.getByRole('button', { name: '일꾸', exact: true }).last().click(); await page.waitForTimeout(600)
await page.getByRole('button', { name: '글자', exact: true }).last().click(); await page.waitForTimeout(700)

// ⚠️ 일기 서랍엔 「친구들」 탭이 «없다»(속지·글쓰기·마테·데코·글자뿐) — 캐릭터로는 못 잰다.
//   ⭐ 대신 「직접 쓴 글자」로 잰다 — v9.93 부터 글자도 `selIsBuddy` 라 같은 줄이 뜬다.
//     (모션·효과는 transform·파티클이라 그림이든 글자든 «똑같은 줄»을 쓴다)
await page.getByRole('button', { name: '글자 넣기', exact: true }).click(); await page.waitForTimeout(700)
const ta = page.locator('.decor-stage textarea[data-boxtext]').first()
if (await ta.count()) { await ta.fill('오늘'); await page.waitForTimeout(300) }

// ⚠️ 컨텍스트 바엔 «클래스 이름이 없다»(전부 인라인 스타일) — 선택자로 못 집는다.
//   ⭐ 그래서 «칩 이름»으로 줄을 찾는다 — 옛 판(한 줄)과 새 판(두 단추) 둘 다에서 도는 방식이라
//      규칙 12 대로 「옛 값으로 진짜 걸리는지」를 같은 자로 잴 수 있다.
const measure = async (name) => {
  const m = await page.evaluate(() => {
    const CHIP = ['통통', '갸웃', '찰랑', '반짝이', '하트', '뽀글']
    const rows = [...document.querySelectorAll('div')].filter((d) => {
      const bs = [...d.querySelectorAll('button')]
      return bs.length >= 3 && bs.some((b) => CHIP.includes((b.textContent || '').trim()))
    })
    if (!rows.length) return null
    const row = rows.sort((a, z) => a.querySelectorAll('*').length - z.querySelectorAll('*').length)[0]
    // 스크롤 칸이 줄 자신인지 자식인지 모른다 → 실제로 밀리는 놈을 찾는다
    const over = [row, ...row.querySelectorAll('*')].reduce((mx, n) => Math.max(mx, n.scrollWidth - n.clientWidth), 0)
    const rr = row.getBoundingClientRect()
    // ⭐ 갈래 단추가 «화면 안»에 온전히 있나 — 밀려 나가면 무엇을 보고 있는지가 안 보인다
    // ⚠️ 찾은 줄이 «스크롤 칸»일 수 있다(칩만 든다) — 갈래 단추는 그 «부모»에 있다.
    //   ⛔ 첫 판이 이걸 놓쳐 새 판을 「갈래 단추 없음(옛 판)」이라고 잘못 찍었다.
    let scope = row
    const findTab = (n) => [...n.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === '움직임')
    let tab = findTab(scope)
    while (!tab && scope.parentElement && scope !== document.body) { scope = scope.parentElement; tab = findTab(scope) }
    // ⛔ 견주는 자리는 «스크롤 칸»이 아니라 갈래 단추를 «담고 있는 줄»이다 —
    //    스크롤 칸과 견주면 갈래 단추는 그 왼쪽에 있으니 언제나 「밀려남」이 된다(첫 판이 그랬다).
    let tabIn = null
    if (tab) { const r = tab.getBoundingClientRect(), sr = scope.getBoundingClientRect(); tabIn = r.left >= sr.left - 1 && r.right <= sr.right + 1 }
    return { over: Math.round(over), w: Math.round(rr.width), n: row.querySelectorAll('button').length, tabIn }
  })
  if (!m) { console.log(`  ⛔ ${name} — 줄을 못 찾았다`); return -1 }
  const tag = m.tabIn === null ? '갈래 단추 없음(옛 판)' : `갈래 단추 ${m.tabIn ? '고정 ✅' : '밀려남 ⛔'}`
  console.log(`  ${m.over === 0 ? '✅' : '⚠️'} ${name} — 밀림 ${m.over}px · 줄 폭 ${m.w}px · 단추 ${m.n}개 · ${tag}`)
  return m.over
}

console.log(`📏 ${W}px 폰`)
const a1 = await measure('움직임 쪽')
const fxTab = page.getByRole('button', { name: '효과', exact: true })
if (await fxTab.count()) { await fxTab.click(); await page.waitForTimeout(300); await measure('효과 쪽') }

console.log(errs.length ? `⛔ pageerror ${errs.length}건 — ${errs[0]}` : '✅ pageerror 0')
await b.close(); srv.close()
process.exit(errs.length === 0 ? 0 : 1)
