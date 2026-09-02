// 📐 폰 «눕힘»에서 무엇이 얼마를 먹나 — 창업자 제보 셋을 숫자로 (2026-08-09)
//   📮 *"비율도 이상하고 스크롤 안되지만"* · *"아래 꾸며요 탭이 너무 커서 종이랑 꾸미기를 다 가려."*
//   ⭐ 창업자 화면은 «크롬»이라 주소창이 높이를 먹는다 — 앱(전체화면)보다 훨씬 짧다.
//      그래서 두 판을 다 잰다. 고정 숫자(`100dvh − 152px`)가 짧은 화면에서 얼마나 남기는지 본다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4388, r))

const { BASICS_VERSION } = await import('../src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
const SEED = { recipes: [], diary: [{ id: 'd1', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' }], seedV: BASICS_VERSION }

// 창업자 폰 = 2340×1080 물리 · DPR 2.625 → CSS 891×411.
//   크롬은 주소창·상태바가 «약 89px» 을 먹는다(캡처에서 잰 비율) → 볼 수 있는 높이 322.
const 판 = [
  ['크롬(창업자가 본 것)', 891, 322],
  ['앱 전체화면', 891, 411],
  ['좁은 폰 눕힘', 780, 360],
]

console.log('\n📐 폰 눕힘 — 무엇이 얼마를 먹나 (2026-08-09)\n')
for (const [이름, w, h] of 판) {
  const page = await b.newPage({ viewport: { width: w, height: h }, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
  await page.addInitScript((s) => {
    const d = new Date(); d.setHours(12, 0, 0, 0)
    s.diary.forEach((x) => { x.at = d.getTime() })
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki:nudge:giftpack', '1')
    const g = Storage.prototype.getItem
    Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
  }, SEED)
  await page.goto('http://127.0.0.1:4388/hankki/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(900)
  await page.locator('.grid-card').first().click(); await page.waitForTimeout(800)
  await page.getByRole('button', { name: /레시피 꾸미기|꾸미기/ }).first().click(); await page.waitForTimeout(1100)

  const m = await page.evaluate(() => {
    const R = (s) => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null }
    const 종이 = document.querySelector('.decor-stage > div')
    const pr = 종이 ? 종이.getBoundingClientRect() : null
    const 굴릴칸 = document.querySelector('.decor-scroll')
    const dr = R('.decor-drawer'), tr = R('.decor-tools'), topr = R('.decor-top'), sr = R('.decor-stage')
    return {
      화면: [window.innerWidth, window.innerHeight],
      위바: topr ? Math.round(topr.height) : null,
      도구바: tr ? Math.round(tr.height) : null,
      칸: sr ? Math.round(sr.height) : null,
      종이: pr ? `${Math.round(pr.width)}×${Math.round(pr.height)}` : null,
      서랍: dr ? Math.round(dr.height) : null,
      굴릴칸높이: 굴릴칸 ? Math.round(굴릴칸.clientHeight) : null,
      굴릴수있나: 굴릴칸 ? (굴릴칸.scrollHeight - 굴릴칸.clientHeight) : null,
      // 🚨 아래 도구 바가 종이·서랍을 «덮나» — 창업자 제보
      도구바가덮나: (tr && dr) ? Math.max(0, Math.round(dr.bottom - tr.top)) : null,
      화면넘침: dr ? Math.max(0, Math.round(dr.bottom - window.innerHeight)) : null,
    }
  })
  console.log(`【${이름}】 ${w}×${h}`)
  for (const [k, v] of Object.entries(m)) console.log(`   ${k.padEnd(7)} ${JSON.stringify(v)}`)
  console.log()
  await page.close()
}
await b.close(); srv.close()
