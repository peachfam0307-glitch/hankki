// 📐 가로모드 · 서랍 실측 — 창업자 2026-08-09 질문 넷을 «재서» 답한다
//
// 📮 창업자 — *"핸드폰 가로모드로 돌리면 지금은 어떻게 돼? 내 핸드폰은 안돌아가고,
//    폴드는 돌아가긴 하는데 스크롤이 안올라간데."* · *"레꾸 서랍도 높이가 좀 더 높았으면 좋겠어."*
//
// ⛔ 짐작으로 답하지 않는다(규칙 15). **네 판을 실제로 띄워 픽셀을 잰다.**
//   ① 레꾸(레시피 꾸미기) 세로   ② 일꾸(일기 꾸미기) 세로
//   ③ 레꾸 가로               ④ 폴드 펼침 가로
//
// ⚠️ 「스크롤이 안 올라간다」 = **굴릴 칸이 손가락보다 작다**는 뜻일 수 있다(2026-08-07 전례:
//    53px 칸에서 1,832px 을 굴리라는 상태였다). 그래서 «굴릴 칸 높이»와 «넘치는 양»을 같이 잰다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4381, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })

// 📏 화면 안에서 재는 것 — 서랍 굴릴 칸 · 넘치는 양 · 종이 크기 · 판 밖으로 나갔나
const MEASURE = () => {
  const pick = (sel) => document.querySelector(sel)
  const r = (el) => (el ? el.getBoundingClientRect() : null)
  const drawer = pick('.decor-drawer')
  const scroll = [...document.querySelectorAll('.decor-scroll')][0]
    || [...document.querySelectorAll('div')]
      .filter((d) => d.scrollHeight > d.clientHeight + 8 && d.clientHeight > 40 && d.getBoundingClientRect().top > 120)
      .sort((a, b) => b.clientHeight - a.clientHeight)[0]
  const stage = pick('.decor-stage')
  const paper = stage ? stage.querySelector(':scope > div') : null
  const dr = r(drawer), sr = r(scroll), pr = r(paper)
  return {
    화면: `${window.innerWidth}×${window.innerHeight}`,
    종이: pr ? `${Math.round(pr.width)}×${Math.round(pr.height)}` : null,
    서랍높이: dr ? Math.round(dr.height) : null,
    굴릴칸: sr ? Math.round(sr.clientHeight) : null,
    // ⭐ 「스크롤이 안 올라간다」의 정체를 가르는 값 — 넘치는 양이 0이면 굴릴 게 없는 것이고,
    //    넘치는데 칸이 작으면 «손가락이 안 닿는» 것이다. 처방이 정반대다.
    넘치는양: sr ? Math.max(0, sr.scrollHeight - sr.clientHeight) : null,
    // 판이 화면 밖으로 나갔나 (가로에서 흔한 사고)
    종이잘림: pr ? (pr.bottom > window.innerHeight + 1 || pr.top < -1) : null,
    서랍보임: dr ? (dr.top < window.innerHeight - 20) : false,
    세로넘침: Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
  }
}

// 🚪 꾸미기 화면까지 들어가는 길 — 레꾸(레시피) / 일꾸(일기)
async function open(page, kind) {
  await page.goto('http://127.0.0.1:4381/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1100)
  if (kind === 'diary') {
    await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(700)
    await page.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1200)
    await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1100)
  } else {
    await page.locator('.grid-card').first().click(); await page.waitForTimeout(1000)
    await page.getByRole('button', { name: /레시피 꾸미기|꾸미기/ }).first().click(); await page.waitForTimeout(1300)
  }
  // ⛔⛔ **갈래를 눌러야 서랍에 스티커가 뜬다** — 안 누르면 굴릴 게 없어서
  //    「굴릴 칸 없음」이 나오고, 그걸 「서랍이 없다」로 잘못 읽는다(첫 판에서 실제로 그랬다 · 규칙 18).
  for (const name of ['데코', '마테', '일꾸']) {
    const t = page.getByRole('button', { name, exact: true }).last()
    if (await t.count().catch(() => 0)) { await t.click({ timeout: 2000 }).catch(() => {}); await page.waitForTimeout(700); break }
  }
  await page.waitForTimeout(500)
}

const SEED = { recipes: [], diary: [{ id: 'd1', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' }], seedV: BASICS_VERSION }

const 판 = [
  { 이름: '① 레꾸 세로 (흔한 폰)', w: 360, h: 780, kind: 'recipe' },
  { 이름: '② 일꾸 세로 (흔한 폰)', w: 360, h: 780, kind: 'diary' },
  { 이름: '③ 레꾸 가로 (같은 폰을 눕힘)', w: 780, h: 360, kind: 'recipe' },
  { 이름: '④ 일꾸 가로 (같은 폰을 눕힘)', w: 780, h: 360, kind: 'diary' },
  { 이름: '⑤ 폴드 펼침 가로', w: 1104, h: 690, kind: 'recipe' },
]

console.log('\n📐 가로모드 · 서랍 실측 (2026-08-09)\n')
for (const v of 판) {
  const page = await b.newPage({ viewport: { width: v.w, height: v.h }, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e.message || e).split('\n')[0]))
  await page.addInitScript((s) => {
    const d = new Date(); d.setHours(12, 0, 0, 0)
    s.diary.forEach((x) => { x.at = d.getTime() })
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1')
    const g = Storage.prototype.getItem
    Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
  }, SEED)
  let m = null
  try { await open(page, v.kind); m = await page.evaluate(MEASURE) } catch (e) { m = { 못열었다: String(e.message).split('\n')[0].slice(0, 70) } }
  console.log(`${v.이름}  (${v.w}×${v.h})`)
  console.log('   ' + JSON.stringify(m, null, 0).replace(/","/g, '", "'))
  if (errs.length) console.log('   ⛔ 크래시:', [...new Set(errs)][0])
  await page.screenshot({ path: `${OUT}/가로-${v.이름.slice(0, 2)}.png` })
  await page.close()
}

await b.close(); srv.close()
console.log('\n📸 캡처 = ' + OUT + '/가로-*.png\n')
