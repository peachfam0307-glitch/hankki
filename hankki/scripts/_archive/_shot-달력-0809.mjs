// 🖼 달력 실물 — 창업자 2026-08-09 *"달력도 하나 찍어줘 (패드랑 폴드)"*
//    ⭐ v10.20 이 배포된 «지금 그대로»를 찍는다(고친 뒤 모습). 손대는 것 없음.
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R = '/home/user/hankki/hankki/', D = join(R, 'dist')
const OUT = join(R, 'docs/검수-2026-08-09-가로2단')
mkdirSync(OUT, { recursive: true })
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = M[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(D, p)) } catch { b = readFileSync(join(D, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise(r => srv.listen(4428, r))
const { BASICS_VERSION } = await import(R + 'src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
for (const [판, w, h] of [['달력-패드-1600x900', 1600, 900], ['달력-폴드-765x689', 765, 689]]) {
  const page = await b.newPage({ viewport: { width: w, height: h }, timezoneId: 'Asia/Seoul', locale: 'ko-KR', deviceScaleFactor: 2 })
  page.on('pageerror', e => console.log('   ⛔ pageerror', e.message))
  // ⭐ 달력이 «채워진» 모습을 보여준다 — 빈 달력은 판정이 안 된다(요리·일기 며칠씩)
  await page.addInitScript((s) => {
    const d = new Date(); d.setHours(12, 0, 0, 0)
    s.diary.forEach((x, i) => { x.at = d.getTime() - i * 86400000 })
    localStorage.setItem('hankki:v1', JSON.stringify(s))
    localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
    const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
  }, {
    recipes: [],
    diary: [
      { id: 'd1', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '오늘' },
      { id: 'c1', kind: 'cook', at: 0, title: '김치찌개', icon: '' },
      { id: 'c2', kind: 'cook', at: 0, title: '콩국수', icon: '' },
      { id: 'c3', kind: 'cook', at: 0, title: '제육볶음', icon: '' },
      { id: 'c4', kind: 'cook', at: 0, title: '된장찌개', icon: '' },
      { id: 'd2', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '어제' },
      { id: 'c5', kind: 'cook', at: 0, title: '미역국', icon: '' },
      { id: 'c6', kind: 'cook', at: 0, title: '김밥', icon: '' },
    ],
    seedV: BASICS_VERSION,
  })
  await page.goto('http://127.0.0.1:4428/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(1100)
  await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(1400)
  const 잰 = await page.evaluate(() => {
    const d = document.querySelector('.cal-day'), r = d ? d.getBoundingClientRect() : null
    const f = document.querySelector('.cal-food')
    const c = document.querySelector('.cal-card')
    const num = d ? d.querySelector('.cal-num') : null
    return {
      한칸: r ? `${Math.round(r.width)}×${Math.round(r.height)}` : null,
      달력폭: c ? Math.round(c.getBoundingClientRect().width) : 0,
      아이콘: f ? Math.round(f.getBoundingClientRect().width) : 0,
      숫자: num ? Math.round(parseFloat(getComputedStyle(num).fontSize)) : 0,
      선: d ? (getComputedStyle(d).boxShadow !== 'none' ? '있음' : '없음') : null,
    }
  })
  console.log(`   ${판} ${JSON.stringify(잰)}`)
  await page.screenshot({ path: join(OUT, `${판}.png`) })
  await page.close()
}
await b.close(); srv.close()
console.log(`\n✅ 달력 두 장 → ${OUT}`)
