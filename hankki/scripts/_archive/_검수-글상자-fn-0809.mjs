// 🔍 실물 검수 — `fn_*` 셋이 「글 써지는 판」이 됐는지, 둘은 데코로 갔는지 (2026-08-09)
//   창업자 *"말풍선 격자(레꾸)에 왜 프레임에 들어가있어?"* → *"2번은 글자써지는 판으로"*
//   ⛔ 시안(HTML)으로만 보지 않는다 — 앱이 실제로 그 자리에 글을 넣는지는 앱에서 봐야 안다(규칙 13).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/검수'
mkdirSync(OUT, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4386, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

const SEED = { recipes: [], diary: [{ id: 'd1', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' }], seedV: BASICS_VERSION }
const page = await b.newPage({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Seoul', locale: 'ko-KR', deviceScaleFactor: 3 })
page.on('pageerror', (e) => no(`크래시 ${String(e.message).split('\n')[0].slice(0, 70)}`))
await page.addInitScript((s) => {
  const d = new Date(); d.setHours(12, 0, 0, 0)
  s.diary.forEach((x) => { x.at = d.getTime() })
  localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
  localStorage.setItem('hankki:nudge:giftpack', '1')
  const g = Storage.prototype.getItem
  Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
}, SEED)
await page.goto('http://127.0.0.1:4386/hankki/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1100)
await page.locator('.grid-card').first().click(); await page.waitForTimeout(900)
await page.getByRole('button', { name: /레시피 꾸미기|꾸미기/ }).first().click(); await page.waitForTimeout(1200)

console.log('\n🔍 fn_* — 프레임 탭에서 나갔나 / 글이 써지나 (2026-08-09)\n')

// ① 프레임 탭엔 없어야 한다
await page.getByRole('button', { name: '프레임', exact: true }).last().click(); await page.waitForTimeout(700)
const 프레임글 = await page.evaluate(() => document.querySelector('.decor-scroll')?.innerText || '')
!/말풍선/.test(프레임글) ? ok('프레임 탭에 「말풍선」이 없다') : no('프레임 탭에 아직 말풍선 그룹이 있다')

// ② 데코 탭엔 「말풍선 판」(fn_daisy·fn_night) 이 있어야 한다
await page.getByRole('button', { name: '데코', exact: true }).last().click(); await page.waitForTimeout(700)
const 데코 = await page.evaluate(() => {
  const s = document.querySelector('.decor-scroll')
  return { 글: s?.innerText || '', 꽃: !!s?.querySelector('[aria-label*="fn_daisy"], img[src*="fn_daisy"]'), 밤: !!s?.querySelector('img[src*="fn_night"]') }
})
// ⛔ 줄 첫 글자가 `/` 면 앞 줄과 이어져 «나눗셈»으로 읽힌다(세미콜론 자동삽입 함정) → 앞에 `;`
;/말풍선 판/.test(데코.글) ? ok('데코 탭에 「말풍선 판」이 있다') : no(`데코 탭에 없다`)
데코.꽃 && 데코.밤 ? ok('데이지·밤하늘 둘 다 데코에 남았다') : no(`데코에 빠진 컷이 있다 (꽃 ${데코.꽃} · 밤 ${데코.밤})`)

// ③ 글자 탭 — 「말풍선 · 판」 셋을 붙여서 글을 친다
const 글 = { fn_speech: '오늘도\n한 끼 해냈다', fn_bow: '엄마표\n김치볶음밥', fn_gingham: '장 볼 것\n두부 계란 파' }
for (const [k, t] of Object.entries(글)) {
  await page.getByRole('button', { name: '글자', exact: true }).last().click(); await page.waitForTimeout(700)
  const 칸 = page.locator(`button[aria-label="글 상자 ${k}"]`)
  if (!(await 칸.count())) { no(`글자 탭에 「글 상자 ${k}」 칸이 없다`); continue }
  await 칸.first().click(); await page.waitForTimeout(700)
  const ta = page.locator('.decor-stage textarea')
  if (!(await ta.count())) { no(`${k} — 붙였는데 «그 자리»에 커서가 안 온다`); continue }
  await ta.first().fill(t); await page.waitForTimeout(400)
  await page.locator('.decor-stage').click({ position: { x: 8, y: 8 } }); await page.waitForTimeout(500)
  // 📐 글자가 그림 «안»에 있나 — 넘치면 잘려서 안 보인다
  const m = await page.evaluate((key) => {
    const img = [...document.querySelectorAll('.decor-stage img')].find((i) => (i.currentSrc || i.src).includes(key))
    if (!img) return null
    const box = img.closest('div[style*="container-type"]') || img.parentElement?.parentElement
    const ink = box?.querySelector('div[style*="overflow: hidden"], div[style*="overflow:hidden"]')
    const ir = img.getBoundingClientRect()
    const tr = ink?.getBoundingClientRect()
    return { 그림: [Math.round(ir.width), Math.round(ir.height)], 글자: tr ? [Math.round(tr.width), Math.round(tr.height)] : null,
      글: (ink?.innerText || '').replace(/\n/g, ' '),
      안쪽: tr ? (tr.left >= ir.left - 1 && tr.right <= ir.right + 1 && tr.top >= ir.top - 1 && tr.bottom <= ir.bottom + 1) : null,
      넘침: ink ? Math.max(0, ink.scrollHeight - ink.clientHeight) : null }
  }, k)
  if (!m) { no(`${k} — 종이에 그림이 안 붙었다`); continue }
  console.log(`   · ${k}`, JSON.stringify(m))
  m.글.replace(/\s/g, '') === t.replace(/\s/g, '') ? ok(`${k} — 친 글이 그대로 들어갔다`) : no(`${k} — 글이 다르다 「${m.글}」`)
  m.안쪽 ? ok(`${k} — 글 자리가 그림 안에 있다`) : no(`${k} — 글 자리가 그림 밖으로 나갔다`)
  m.넘침 === 0 ? ok(`${k} — 글이 안 넘친다`) : no(`${k} — 글이 ${m.넘침}px 넘쳐 잘린다`)
  await page.screenshot({ path: `${OUT}/글상자-${k}.png` })
  // 다음 컷을 위해 지운다
  const del = page.locator('.decor-stage button[aria-label*="지우기"], .decor-stage button[aria-label*="삭제"]')
  if (await del.count()) { await del.first().click(); await page.waitForTimeout(400) }
}

await page.screenshot({ path: `${OUT}/글상자-종합.png`, fullPage: false })
await b.close(); srv.close()
console.log(bad ? `\n⛔ ${bad}건 어긋남\n` : '\n✅ 통과 — 셋은 글 상자로, 둘은 데코로 갔다\n')
console.log('📸 ' + OUT + '\n')
process.exit(bad ? 1 : 0)
