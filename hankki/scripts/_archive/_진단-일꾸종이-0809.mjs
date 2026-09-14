// 🔎 일꾸 종이가 왜 그 크기인지 — 「무엇이 높이를 먹고 있나」를 한 줄씩 잰다.
//    📮 창업자 2026-08-09 *"레꾸는 괜찮은데 (크기가) 일꾸 종이가 좀 작아."*
//    ⛔ 눈으로 「작다」를 고치려 들면 또 고정 숫자를 넣게 된다 — 먼저 잰다.
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R = '/home/user/hankki/hankki/', D = join(R, 'dist')
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = M[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(D, p)) } catch { b = readFileSync(join(D, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise((r) => srv.listen(4391, r))
const { BASICS_VERSION } = await import(R + 'src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })

const 잰다 = () => {
  const st = document.querySelector('.decor-stage')
  const wrap = st ? st.querySelector(':scope > div:not(.t-sub)') : null
  const sub = st ? st.querySelector(':scope > .t-sub') : null
  const box = (e) => (e ? { w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height) } : null)
  const cs = st ? getComputedStyle(st) : null
  return {
    화면: `${window.innerWidth}×${window.innerHeight}`,
    칸: box(st),
    칸안쪽높이: st ? Math.round(st.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)) : null,
    칸위아래여백: cs ? `${cs.paddingTop}/${cs.paddingBottom}` : null,
    종이겹: box(wrap),
    종이겹상한: wrap ? getComputedStyle(wrap).maxWidth : null,
    안내문: box(sub),
    안내문여백위: sub ? getComputedStyle(sub).marginTop : null,
    위바: box(document.querySelector('.decor-top')),
    도구바: box(document.querySelector('.decor-tools')),
    서랍: box(document.querySelector('.decor-drawer')),
  }
}

for (const [n, w, h] of [['크롬눕힘', 891, 322], ['폰눕힘', 780, 360], ['폴드', 1104, 690]]) {
  const page = await b.newPage({ viewport: { width: w, height: h }, timezoneId: 'Asia/Seoul', locale: 'ko-KR', deviceScaleFactor: 2 })
  await page.addInitScript((s) => {
    const d = new Date(); d.setHours(12, 0, 0, 0); s.diary.forEach((x) => { x.at = d.getTime() })
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
    const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
  }, { recipes: [], diary: [{ id: 'd1', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' }], seedV: BASICS_VERSION })
  await page.goto('http://127.0.0.1:4391/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(900)
  await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(600)
  await page.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1100)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1000)
  const t = page.getByRole('button', { name: '일꾸', exact: true }).last()
  if (await t.count().catch(() => 0)) { await t.click().catch(() => {}); await page.waitForTimeout(600) }
  console.log(`\n▣ ${n}`, JSON.stringify(await page.evaluate(잰다), null, 1))
  await page.close()
}
await b.close(); srv.close()
