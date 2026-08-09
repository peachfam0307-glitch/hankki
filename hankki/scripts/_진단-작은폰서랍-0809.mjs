// 🔎 작은 폰(360×640) 세로에서 «누가 자리를 먹는지» 한 겹씩 잰다.
//    창업자 *"세로모드 -꾸미기탭 1칸도 채 안보임. 나머지는 고르기버튼이 다 잡아먹음."*
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R = '/home/user/hankki/hankki/', D = join(R, 'dist')
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = M[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(D, p)) } catch { b = readFileSync(join(D, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise(r => srv.listen(4415, r))
const { BASICS_VERSION } = await import(R + 'src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })
for (const [n, w, h] of [['작은 폰 360×640', 360, 640], ['보통 폰 411×891', 411, 891]]) {
  const page = await b.newPage({ viewport: { width: w, height: h }, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
  await page.addInitScript((s) => {
    const d = new Date(); d.setHours(12, 0, 0, 0); s.diary.forEach(x => { x.at = d.getTime() })
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
    const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
  }, { recipes: [], diary: [{ id: 'd1', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' }], seedV: BASICS_VERSION })
  await page.goto('http://127.0.0.1:4415/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(900)
  await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(600)
  await page.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1100)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1000)
  await page.locator('.seg', { hasText: /^일꾸$/ }).first().click(); await page.waitForTimeout(700)
  await page.evaluate(() => { const b2 = [...document.querySelectorAll('.decor-grid button')]; if (b2[0]) b2[0].click() })
  await page.waitForTimeout(900)
  const r = await page.evaluate(() => {
    const H = (el) => (el ? Math.round(el.getBoundingClientRect().height) : 0)
    const ed = document.querySelector('.decor-editor')
    const top = document.querySelector('.decor-top'), st = document.querySelector('.decor-stage')
    const dw = document.querySelector('.decor-drawer'), tl = document.querySelector('.decor-tools')
    const sc = dw.querySelector('.decor-scroll') || dw.lastElementChild
    const 서랍겹 = [...dw.children].map((c) => `${c.className || c.tagName}:${H(c)}`)
    const 도구겹 = tl ? [...tl.children].map((c) => `${c.className || c.tagName}:${H(c)}`) : []
    const grid = dw.querySelector('.decor-grid'), cell = grid ? grid.firstElementChild : null
    return {
      화면: innerHeight, 판: H(ed), 위바: H(top), 종이칸: H(st), 서랍: H(dw), 도구바: H(tl),
      굴칸: H(sc), 한칸: H(cell), 줄: cell ? +(H(sc) / H(cell)).toFixed(2) : null,
      서랍겹, 도구겹,
    }
  })
  console.log(`\n▣ ${n}`)
  console.log(`   화면 ${r.화면} = 위바 ${r.위바} ＋ 종이칸 ${r.종이칸} ＋ 서랍 ${r.서랍} ＋ 도구바 ${r.도구바}  (합 ${r.위바 + r.종이칸 + r.서랍 + r.도구바})`)
  console.log(`   서랍 안: ${r.서랍겹.join(' · ')}`)
  console.log(`   도구바 안: ${r.도구겹.join(' · ')}`)
  console.log(`   굴러가는 칸 ${r.굴칸}px · 한 칸 ${r.한칸}px → ${r.줄}줄`)
  await page.close()
}
await b.close(); srv.close()
