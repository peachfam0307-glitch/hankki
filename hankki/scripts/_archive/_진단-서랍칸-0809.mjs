// 🔎 서랍 — 창업자 *"1칸만보여 (스티커같은게) 나머지는 다 고르는 버튼이고"* (2026-08-09)
//    ⛔ 「좁다」를 눈으로 고치지 않는다. **서랍 안에서 무엇이 몇 px 을 먹는지** 하나씩 잰다.
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R = '/home/user/hankki/hankki/', D = join(R, 'dist')
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = M[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(D, p)) } catch { b = readFileSync(join(D, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise((r) => srv.listen(4395, r))
const { BASICS_VERSION } = await import(R + 'src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })

const 잰다 = () => {
  const dr = document.querySelector('.decor-drawer')
  if (!dr) return null
  const 줄 = []
  for (const e of dr.children) {
    const r = e.getBoundingClientRect()
    if (r.height < 1) continue
    줄.push({ 뭐: (e.className || e.tagName).toString().slice(0, 40), 높이: Math.round(r.height), 굴러가나: e.scrollHeight - e.clientHeight > 4 })
  }
  const 칸 = dr.querySelector('.decor-scroll, .decor-body') || [...dr.children].find((e) => e.scrollHeight - e.clientHeight > 4)
  const 첫칸 = dr.querySelector('.decor-grid')
  return {
    서랍높이: Math.round(dr.getBoundingClientRect().height),
    줄,
    굴릴칸: 칸 ? Math.round(칸.getBoundingClientRect().height) : null,
    스티커한칸: 첫칸 ? Math.round(첫칸.getBoundingClientRect().height / Math.max(1, Math.round(첫칸.getBoundingClientRect().height / 60))) : null,
    도구바: (() => { const t = document.querySelector('.decor-tools'); return t ? Math.round(t.getBoundingClientRect().height) : 0 })(),
  }
}

for (const [n, w, h] of [['크롬눕힘', 891, 322], ['앱눕힘', 891, 411]]) {
  const page = await b.newPage({ viewport: { width: w, height: h }, timezoneId: 'Asia/Seoul', locale: 'ko-KR', deviceScaleFactor: 2 })
  await page.addInitScript((s) => {
    const d = new Date(); d.setHours(12, 0, 0, 0); s.diary.forEach((x) => { x.at = d.getTime() })
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
    const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
  }, { recipes: [], diary: [{ id: 'd1', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' }], seedV: BASICS_VERSION })
  await page.goto('http://127.0.0.1:4395/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(900)
  await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(600)
  await page.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1100)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1000)
  const t = page.getByRole('button', { name: '일꾸', exact: true }).last()
  if (await t.count().catch(() => 0)) { await t.click().catch(() => {}); await page.waitForTimeout(600) }
  console.log(`\n▣ ${n} (${w}×${h}) — 아무것도 안 골랐을 때`)
  console.log(JSON.stringify(await page.evaluate(잰다), null, 1))
  const 컷 = page.locator('.decor-drawer img').first()
  if (await 컷.count().catch(() => 0)) { await 컷.click().catch(() => {}); await page.waitForTimeout(800) }
  console.log(`▣ ${n} — 스티커를 골랐을 때 (창업자가 본 화면)`)
  console.log(JSON.stringify(await page.evaluate(잰다), null, 1))
  await page.close()
}
await b.close(); srv.close()
