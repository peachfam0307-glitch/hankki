// 📐 가로에서 «다른 탭»은 멀쩡한가 — 창업자 2026-08-09
//    *"그럼 폴드나 패드에서 꾸미기만 가로모드 되는거고 다른 탭들은 안되는거지?"*
//
// ⛔ 오늘 고친 건 **꾸미기 화면 하나**다. 나머지는 «내가 안 봤다».
//    그런데 큰 화면(폴드·패드)에선 **이미 가로로 돌아간다** → 다른 탭도 지금 그대로 나온다.
// 🎯 그러니 「가로를 열어도 되나」의 답은 **여기서 나온다** — 다 멀쩡해야 열 수 있다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/가로탭'
mkdirSync(OUT, { recursive: true })
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4385, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const SEED = { recipes: [], diary: [{ id: 'd1', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' }], seedV: BASICS_VERSION }

// 🎯 재는 것 — 「깨졌다」의 정의를 못 박는다(눈대중 금지)
const 잰다 = () => {
  const de = document.documentElement
  const bar = document.querySelector('.bottomnav, nav, [class*="bottom"]')
  const r = (e) => (e ? e.getBoundingClientRect() : null)
  const br = r(bar)
  // 화면 밖으로 나간 «보이는» 요소 (가로에서 흔한 사고)
  let 넘친것 = 0, 제일큰넘침 = 0
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue
    const q = el.getBoundingClientRect()
    if (q.width < 8 || q.height < 8) continue
    const over = Math.max(q.right - window.innerWidth, -q.left)
    if (over > 2) { 넘친것++; 제일큰넘침 = Math.max(제일큰넘침, Math.round(over)) }
  }
  return {
    가로넘침: Math.max(0, Math.round(de.scrollWidth - window.innerWidth)),
    세로스크롤: Math.max(0, Math.round(de.scrollHeight - window.innerHeight)),
    // ⭐ 「스크롤이 안 올라간다」(창업자 폴드 제보)를 가르는 값 — 굴릴 게 있는데 못 굴리나
    본문굴림: (() => {
      const c = [...document.querySelectorAll('div,main,section')]
        .filter((d) => d.scrollHeight > d.clientHeight + 8 && d.clientHeight > 60)
        .sort((a, b) => b.clientHeight - a.clientHeight)[0]
      return c ? { 칸: Math.round(c.clientHeight), 넘치는양: Math.round(c.scrollHeight - c.clientHeight) } : null
    })(),
    하단바보임: br ? Math.round(br.bottom) <= window.innerHeight + 2 : null,
    하단바높이: br ? Math.round(br.height) : null,
    좌우로넘친요소: 넘친것, 제일큰넘침,
    // ⭐ 앱이 화면 폭을 얼마나 쓰나 — 폴드에서 660px 이 놀던 그 값
    앱폭: Math.round((document.querySelector('.app, #root > div, main') || de).getBoundingClientRect().width),
  }
}

const 탭 = [['홈', null], ['가져오기', '가져오기'], ['레시피', '레시피'], ['일기', '일기'], ['장보기', '장보기'], ['레꾸자랑', '레꾸자랑']]
const 판 = [['폰눕힘', 780, 360], ['폴드', 1104, 690]]

console.log('\n📐 가로에서 «다른 탭»은 멀쩡한가 (2026-08-09)\n')
let 나쁨 = 0
for (const [판이름, w, h] of 판) {
  console.log(`── ${판이름} (${w}×${h}) ──`)
  for (const [탭이름, 클릭] of 탭) {
    const page = await b.newPage({ viewport: { width: w, height: h }, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
    const errs = []
    page.on('pageerror', (e) => errs.push(String(e.message).split('\n')[0].slice(0, 50)))
    await page.addInitScript((s) => {
      const d = new Date(); d.setHours(12, 0, 0, 0)
      s.diary.forEach((x) => { x.at = d.getTime() })
      localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
      localStorage.setItem('hankki:nudge:giftpack', '1')
      const g = Storage.prototype.getItem
      Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
    }, SEED)
    await page.goto('http://127.0.0.1:4385/hankki/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
    if (클릭) {
      const t = page.getByText(클릭, { exact: true }).last()
      if (await t.count().catch(() => 0)) { await t.click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(900) }
    }
    const m = await page.evaluate(잰다)
    const 문제 = []
    if (m.가로넘침 > 2) 문제.push(`가로로 ${m.가로넘침}px 삐져나감`)
    if (m.하단바보임 === false) 문제.push('하단바가 화면 밖')
    if (m.좌우로넘친요소 > 0) 문제.push(`요소 ${m.좌우로넘친요소}개가 좌우로 넘침(최대 ${m.제일큰넘침}px)`)
    if (errs.length) 문제.push(`크래시 ${errs[0]}`)
    if (문제.length) 나쁨++
    console.log(`   ${탭이름.padEnd(6)} ${문제.length ? '⛔ ' + 문제.join(' · ') : '✅ 멀쩡'}   ${JSON.stringify(m)}`)
    await page.screenshot({ path: `${OUT}/${판이름}-${탭이름}.png` })
    await page.close()
  }
  console.log('')
}
await b.close(); srv.close()
console.log(나쁨 ? `⛔ ${나쁨}칸이 어긋난다 — 가로를 «열기 전에» 고쳐야 한다\n` : '✅ 다른 탭도 가로에서 멀쩡하다\n')
console.log('📸 ' + OUT + '\n')
