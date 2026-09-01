// 🔬 **줄 «머리»에 가운뎃점(·)이 오나** — 패드 가로 글줄 폭을 줄이면 늘어나는지 본다
//
// ⭐ 왜 재나 = 580px 판 캡처에서 「맛술 / **·소금·올리고당·후추를**」처럼 **줄이 점으로 시작**했다.
//    ⛔ 그런데 이게 «내가 만든 것»인지 «원래 있던 것»인지 모르면 고칠지 말지를 못 정한다.
//    👉 **폰(지금 그대로)에서도 나는지**를 같이 재서 가른다.
//
// 🔤 글자 = U+00B7 MIDDLE DOT · 걸음 글에 **171개**. UAX#14 에서 «앞뒤 어디서나 끊기는» 갈래라
//    keep-all 로도 안 묶인다.
//
// 실행: node /home/user/hankki/hankki/scripts/_probe-가운뎃점줄머리-0901.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
import { 레시피들 } from './recipe.mjs'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(0, r))
const PORT = srv.address().port

const 걸음들 = []
for (const r of 레시피들()) for (const s of (r.steps || [])) {
  const t = String(s).split('\n')[0].trim(); if (t) 걸음들.push(t)
}
const 점든걸음 = 걸음들.filter((t) => t.includes('·'))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})

async function 요리모드(폭, 높이) {
  const ctx = await b.newContext({ viewport: { width: 폭, height: 높이 }, deviceScaleFactor: 1 })
  await ctx.addInitScript(SEED_COACH_SEEN)
  await ctx.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') } catch {} })
  const p = await ctx.newPage()
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(1200)
  for (let i = 0; i < 3; i++) { if (!(await p.locator('.sheet-mask').count())) break; await p.keyboard.press('Escape'); await p.waitForTimeout(400) }
  await p.locator('.bottom-nav .nav-item').filter({ hasText: '레시피' }).first().click().catch(() => {})
  await p.waitForTimeout(1000)
  const 카드 = p.locator('.screen button, .screen [role="button"], .screen a').filter({ hasText: /[가-힣]/ })
  const n = Math.min(await 카드.count(), 14)
  for (let i = 0; i < n; i++) {
    await 카드.nth(i).click().catch(() => {}); await p.waitForTimeout(800)
    if (await p.locator('[data-coach="cook"]').count()) break
    await p.goBack().catch(() => {}); await p.waitForTimeout(600)
  }
  await p.locator('[data-coach="cook"]').first().click(); await p.waitForTimeout(1200)
  for (let i = 0; i < 4; i++) {
    if (await p.locator('.cook-steptext').count()) break
    await p.locator('button, [role="button"]').filter({ hasText: /다음|시작/ }).last().click().catch(() => {}); await p.waitForTimeout(700)
  }
  return { ctx, p, 됐나: await p.locator('.cook-steptext').count() > 0 }
}

// 줄마다 «첫 글자»를 캐릭터 단위 Range 로 알아낸다 — 각 글자의 y 가 바뀌는 자리가 줄머리다
const 세기 = ({ 글들, 폭, bal, strict }) => {
  const el = document.querySelector('.cook-steptext')
  const 원래 = { html: el.innerHTML, w: el.style.maxWidth, wrap: el.style.textWrap, lb: el.style.lineBreak }
  el.style.maxWidth = 폭 ? `${폭}px` : ''
  el.style.textWrap = bal ? 'balance' : ''
  el.style.lineBreak = strict ? 'strict' : ''
  let 걸린걸음 = 0, 줄머리점 = 0
  for (const t of 글들) {
    el.textContent = t
    const node = el.firstChild
    const r = document.createRange()
    let 앞y = null, 이번 = 0
    for (let i = 0; i < t.length; i++) {
      r.setStart(node, i); r.setEnd(node, i + 1)
      const rc = r.getBoundingClientRect()
      if (rc.width === 0 && rc.height === 0) continue
      const y = Math.round(rc.top)
      if (앞y === null) { 앞y = y; continue }          // 첫 줄의 첫 글자는 «줄바꿈으로 온 것»이 아니다
      if (y > 앞y + 4) { if (t[i] === '·') 이번 += 1; 앞y = y }
    }
    if (이번) { 걸린걸음 += 1; 줄머리점 += 이번 }
  }
  el.style.maxWidth = 원래.w; el.style.textWrap = 원래.wrap; el.style.lineBreak = 원래.lb; el.innerHTML = 원래.html
  return { 걸린걸음, 줄머리점 }
}

console.log(`🔤 가운뎃점(·)이 든 걸음 = ${점든걸음.length}개 / 전체 ${걸음들.length}개\n`)

// ① 폰 — 지금 그대로. 여기서도 나면 «원래 있던 것»이다
{
  const { ctx, p, 됐나 } = await 요리모드(390, 844)
  if (!됐나) console.error('✗ 폰 — 요리모드를 못 열었다')
  else {
    const r = await p.evaluate(세기, { 글들: 점든걸음, 폭: 0, bal: false, strict: false })
    console.log(`📱 폰 390×844 «지금 그대로»        → 줄머리 · 가 있는 걸음 ${r.걸린걸음}개 (점 ${r.줄머리점}번)`)
  }
  await ctx.close()
}

// ② 패드 가로 — 지금 / 후보들 × balance / ＋line-break: strict 가 듣나
{
  const { ctx, p, 됐나 } = await 요리모드(1180, 820)
  if (!됐나) console.error('✗ 패드 가로 — 요리모드를 못 열었다')
  else {
    for (const [폭, bal, strict] of [
      [0, false, false], [0, true, false],
      [700, true, false], [640, true, false], [580, true, false], [520, true, false],
      [580, true, true],
    ]) {
      const r = await p.evaluate(세기, { 글들: 점든걸음, 폭, bal, strict })
      console.log(`🖥 패드 가로 폭 ${String(폭 || '지금').padStart(4)}px · balance ${bal ? '켬' : '끔'} · strict ${strict ? '켬' : '끔'} → 걸음 ${String(r.걸린걸음).padStart(3)}개 (점 ${r.줄머리점}번)`)
    }
  }
  await ctx.close()
}

await b.close(); srv.close()
