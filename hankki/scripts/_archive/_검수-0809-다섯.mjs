// 🔍 검수판 — 창업자 지시 다섯을 «실물»로 찍는다 (2026-08-09 · 규칙 13)
//    ⛔ 숫자만으론 예쁜지 모른다. 창업자가 눈으로 보고 「ㄱㄱ」를 줘야 배포한다.
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
await new Promise((r) => srv.listen(4384, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const SEED = { recipes: [], diary: [{ id: 'd1', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' }], seedV: BASICS_VERSION }
let bad = 0
const ok = (m) => console.log('   ✅', m)
const no = (m) => { bad++; console.log('   ⛔', m) }

async function 새판(w, h) {
  const page = await b.newPage({ viewport: { width: w, height: h }, timezoneId: 'Asia/Seoul', locale: 'ko-KR', deviceScaleFactor: 2 })
  page.on('pageerror', (e) => no(`크래시 ${String(e.message).split('\n')[0].slice(0, 60)}`))
  await page.addInitScript((s) => {
    const d = new Date(); d.setHours(12, 0, 0, 0)
    s.diary.forEach((x) => { x.at = d.getTime() })
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1')
    const g = Storage.prototype.getItem
    Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
  }, SEED)
  await page.goto('http://127.0.0.1:4384/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1100)
  return page
}
const 꾸미기 = async (page) => {
  await page.locator('.grid-card').first().click(); await page.waitForTimeout(1000)
  await page.getByRole('button', { name: /레시피 꾸미기|꾸미기/ }).first().click(); await page.waitForTimeout(1300)
}

console.log('\n🔍 검수 — 창업자 지시 다섯 (2026-08-09)\n')

// ① 세로 — 버튼 38 통일 ＋ 종이 344
{
  const page = await 새판(360, 780); await 꾸미기(page)
  await page.getByRole('button', { name: '데코', exact: true }).last().click(); await page.waitForTimeout(800)
  const m = await page.evaluate(() => {
    const f = (t) => [...document.querySelectorAll('button')].find((b) => (b.innerText || '').includes(t))
    const H = (t) => { const e = f(t); return e ? Math.round(e.getBoundingClientRect().height) : null }
    const p = document.querySelector('.decor-stage > div')
    return { 선물: H('선물 네 가지'), 사진: H('사진 스티커'), 배경: H('배경 음식 아이콘'),
      종이: p ? Math.round(p.getBoundingClientRect().width) : null,
      안내: (document.body.innerText.match(/(아래|오른쪽)에서 골라 붙이고/) || [])[0] || null }
  })
  console.log('① 세로 (360×780)', JSON.stringify(m))
  ;(m.선물 === 38 && m.사진 === 38 && m.배경 === 38) ? ok('버튼 셋 다 38px') : no(`버튼이 안 맞다 ${m.선물}/${m.사진}/${m.배경}`)
  m.종이 >= 340 ? ok(`종이 ${m.종이}px (전 328)`) : no(`종이가 안 컸다 ${m.종이}`)
  m.안내 === '아래에서 골라 붙이고' ? ok('세로 안내문 = 「아래에서」') : no(`세로 안내문 ${m.안내}`)
  await page.screenshot({ path: `${OUT}/1-세로.png` }); await page.close()
}

// ② 가로 — 좌우 배치 ＋ 안내문 「오른쪽에서」
for (const [이름, w, h] of [['2-가로-폰눕힘', 780, 360], ['3-가로-폴드', 1104, 690]]) {
  const page = await 새판(w, h); await 꾸미기(page)
  await page.getByRole('button', { name: '데코', exact: true }).last().click(); await page.waitForTimeout(800)
  const m = await page.evaluate(() => {
    const d = document.querySelector('.decor-drawer'), st = document.querySelector('.decor-stage')
    const p = st ? st.querySelector(':scope > div') : null
    const r = (e) => (e ? e.getBoundingClientRect() : null)
    const dr = r(d), pr = r(p)
    return { 종이: pr ? `${Math.round(pr.width)}×${Math.round(pr.height)}` : null,
      종이비율: pr ? +(pr.width / pr.height).toFixed(2) : null,
      서랍높이: dr ? Math.round(dr.height) : null,
      서랍이오른쪽: dr && pr ? dr.left > pr.right - 1 : null,
      화면넘침: dr ? Math.max(0, Math.round(dr.bottom - window.innerHeight)) : null,
      안내: (document.body.innerText.match(/(아래|오른쪽)에서 골라 붙이고/) || [])[0] || null }
  })
  console.log(`${이름} (${w}×${h})`, JSON.stringify(m))
  m.서랍이오른쪽 ? ok('서랍이 종이 «오른쪽»에 있다') : no('서랍이 오른쪽이 아니다')
  Math.abs(m.종이비율 - 1) < 0.02 ? ok(`종이 비율 정상 ${m.종이}`) : no(`종이 비율이 깨졌다 ${m.종이}`)
  m.화면넘침 === 0 ? ok('서랍이 화면을 안 넘는다') : no(`서랍이 ${m.화면넘침}px 넘친다`)
  m.안내 === '오른쪽에서 골라 붙이고' ? ok('가로 안내문 = 「오른쪽에서」') : no(`가로 안내문 ${m.안내}`)
  await page.screenshot({ path: `${OUT}/${이름}.png` }); await page.close()
}

// ③ 구분선이 마테 탭에 ＋ 글자 탭엔 없다
{
  const page = await 새판(360, 780); await 꾸미기(page)
  const 있나 = async (tab) => {
    await page.getByRole('button', { name: tab, exact: true }).last().click(); await page.waitForTimeout(800)
    return page.evaluate(() => /화살표 · 구분선/.test(document.querySelector('.decor-scroll')?.innerText || ''))
  }
  const 마테 = await 있나('마테'); const 글자 = await 있나('글자')
  console.log('④ 구분선 — 마테:', 마테, '· 글자:', 글자)
  마테 ? ok('「화살표 · 구분선」이 마테 탭에 있다') : no('마테 탭에 없다')
  !글자 ? ok('글자 탭에선 빠졌다') : no('글자 탭에 아직 남아 있다')
  await page.close()
}

// ④ 요리 준비 체크박스
{
  const page = await 새판(360, 780)
  await page.locator('.grid-card').first().click(); await page.waitForTimeout(1000)
  await page.getByRole('button', { name: /요리 시작/ }).first().click(); await page.waitForTimeout(1200)
  const 줄 = page.locator('.cook-body button[aria-pressed]')
  const n = await 줄.count()
  n > 0 ? ok(`재료 줄이 체크 가능하다 (${n}줄)`) : no('체크 가능한 재료 줄이 없다')
  if (n > 0) {
    await 줄.first().click(); await page.waitForTimeout(400)
    const on = await 줄.first().getAttribute('aria-pressed')
    on === 'true' ? ok('누르면 체크된다') : no(`안 눌린다 (aria-pressed=${on})`)
    const 취소선 = await page.evaluate(() => {
      const b = document.querySelector('.cook-body button[aria-pressed="true"]')
      const s = b && b.querySelector('.ing')
      return s ? getComputedStyle(s).textDecorationLine : null
    })
    // ⛔ 줄 첫 글자가 `/` 면 앞 줄과 이어져 «나눗셈»으로 읽힌다(세미콜론 자동삽입 함정) → 앞에 `;`
    ;/line-through/.test(취소선 || '') ? ok('체크한 줄에 취소선') : no(`취소선이 없다 (${취소선})`)
  }
  await page.screenshot({ path: `${OUT}/4-요리체크.png` }); await page.close()
}

await b.close(); srv.close()
console.log(bad ? `\n⛔ ${bad}건 어긋남\n` : '\n✅ 검수 통과 — 다섯 다 들어갔다\n')
console.log('📸 ' + OUT + '\n')
process.exit(bad ? 1 : 0)
