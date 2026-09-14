// 🔎 도구바를 「서랍 밑」으로 옮겼다 — 칸이 44% 로 좁아져도 안 깨지나?
//    ⚠️ 세로에선 도구바가 화면 폭(360) 전체를 썼다. 여기선 343~392 라 비슷하지만 «비슷»은 근거가 아니다.
//    📌 재는 것 = ⑴도구바 폭·높이 ⑵칸 밖으로 넘쳤나 ⑶종이 칸 높이가 «고르기 전후로 안 변하나»
import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R = '/home/user/hankki/hankki/', D = join(R, 'dist')
const M = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'; let b, t = M[extname(p)] || 'application/octet-stream'; try { b = readFileSync(join(D, p)) } catch { b = readFileSync(join(D, 'index.html')); t = 'text/html' } s.writeHead(200, { 'content-type': t }); s.end(b) })
await new Promise((r) => srv.listen(4392, r))
const { BASICS_VERSION } = await import(R + 'src/data/basics.js')
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium' })

const 잰다 = () => {
  const r = (s) => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null }
  const st = r('.decor-stage'), tl = r('.decor-tools'), dr = r('.decor-drawer')
  let 넘친것 = 0
  const 누가 = []
  // ⛔ .hscroll 은 «일부러» 옆으로 굴러가게 만든 줄이다 — 넘치는 게 정상. 그 자손도 뺀다.
  if (tl) for (const e of document.querySelectorAll('.decor-tools *')) {
    if (e.closest('.hscroll')) continue
    const q = e.getBoundingClientRect()
    if (q.width && q.right > tl.right + 1) { 넘친것 = Math.max(넘친것, Math.round(q.right - tl.right)); 누가.push(e.className + '|' + Math.round(q.right - tl.right)) }
  }

  return {
    종이칸높이: st ? Math.round(st.height) : null,
    도구바: tl ? `${Math.round(tl.width)}×${Math.round(tl.height)}` : null,
    서랍높이: dr ? Math.round(dr.height) : null,
    도구바가칸밖으로: 넘친것, 넘친것들: 누가.slice(0, 5),
    화면넘침: Math.max(0, Math.round((tl ? tl.bottom : 0) - window.innerHeight)),
  }
}

for (const [n, w, h] of [['크롬눕힘', 891, 322], ['폰눕힘', 780, 360], ['좁은눕힘', 667, 375]]) {
  const page = await b.newPage({ viewport: { width: w, height: h }, timezoneId: 'Asia/Seoul', locale: 'ko-KR', deviceScaleFactor: 2 })
  await page.addInitScript((s) => {
    const d = new Date(); d.setHours(12, 0, 0, 0); s.diary.forEach((x) => { x.at = d.getTime() })
    localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
    const g = Storage.prototype.getItem; Storage.prototype.getItem = function (k) { return (typeof k === 'string' && k.startsWith('hankki:coach:')) ? '1' : g.call(this, k) }
  }, { recipes: [], diary: [{ id: 'd1', kind: 'diary', at: 0, paper: { rule: 'plain', skin: 'ivory', art: 'none' }, decor: [], note: '' }], seedV: BASICS_VERSION })
  await page.goto('http://127.0.0.1:4392/hankki/', { waitUntil: 'networkidle' }); await page.waitForTimeout(900)
  await page.getByText('일기', { exact: true }).last().click(); await page.waitForTimeout(600)
  await page.getByRole('button', { name: /오늘 일기 (쓰기|보기)/ }).first().click(); await page.waitForTimeout(1100)
  await page.getByRole('button', { name: '꾸미기 열기' }).first().click(); await page.waitForTimeout(1000)
  const 전 = await page.evaluate(잰다)
  // 레꾸 탭으로 가서 스티커를 하나 붙이고 고른 상태를 만든다
  const 레꾸 = page.getByRole('button', { name: '레꾸', exact: true }).last()
  if (await 레꾸.count().catch(() => 0)) { await 레꾸.click().catch(() => {}); await page.waitForTimeout(600) }
  const 친구 = page.getByRole('button', { name: '친구들', exact: true }).last()
  if (await 친구.count().catch(() => 0)) { await 친구.click().catch(() => {}); await page.waitForTimeout(700) }
  const 컷 = page.locator('.decor-drawer img').first()
  if (await 컷.count().catch(() => 0)) { await 컷.click().catch(() => {}); await page.waitForTimeout(800) }
  const 후 = await page.evaluate(잰다)
  console.log(`\n▣ ${n} (${w}×${h})`)
  console.log('  고르기 전', JSON.stringify(전))
  console.log('  고른 뒤  ', JSON.stringify(후))
  console.log('  종이칸이 안 변했나 →', 전.종이칸높이 === 후.종이칸높이 ? '✅' : `⛔ ${전.종이칸높이} → ${후.종이칸높이}`)
  await page.screenshot({ path: `/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/검수/도구바-${n}.png` })
  await page.close()
}
await b.close(); srv.close()
