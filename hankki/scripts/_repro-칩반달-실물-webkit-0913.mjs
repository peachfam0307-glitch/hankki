// 🧪 칩 «흰 반달» — «진짜 앱 카드»를 사파리 엔진(WebKit)에서 구워 본다 (2026-09-13 · 2차)
//
// 1차(`_repro-칩반달-webkit-0913.mjs` · 간단판 칩 셋)는 맥 WebKit 에서 재현이 «안 됐다»(오른쪽 띠 0.011~0.014 · 크롬과 같음).
// → 실물(딸 아이폰14 · 빌드 12 · 추석 카드 문자 공유 · 12:12 캡처)과 다른 점 = 진짜 카드 부품 · Jua 글꼴 · pixelRatio 1.6 · toJpeg.
// 이 판은 dist 의 «진짜 앱»을 열어 `?card=chuseok` 카드를 뽑고, 앱과 같은 길(html-to-image toJpeg · 1.6 · 예열 두 번)로 굽는다.
// 결과 = ① 카드 전체 PNG(_out) ② 칩 줄만 잘라 base64 로 로그에 찍는다(러너 결과물을 이 컨테이너가 못 받아서 · 규칙 21 눈으로 본다)
// 사용(러너): node scripts/_repro-칩반달-실물-webkit-0913.mjs webkit   (dist 가 있어야 한다 · npm run build)
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ENGINE = process.argv[2] || 'chromium'
const OUT = path.join(__dirname, '_out'); mkdirSync(OUT, { recursive: true })
const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const now = Date.now()
const state = { recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })), seedV: BASICS_VERSION }

const PORT = 4378
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 900))
const pw = await import('playwright')
const b = await pw[ENGINE].launch(ENGINE === 'chromium' && process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
await ctx.addInitScript({ content: SEED_COACH_SEEN })
const p = await ctx.newPage()
const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 120)))
await p.goto(`http://127.0.0.1:${PORT}/`)
await p.evaluate((s) => { localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') }, state)
const 치우기 = async () => {
  for (let i = 0; i < 5; i++) {
    if (!(await p.locator('.sheet-mask').count())) break
    const c = p.getByRole('button', { name: /^(닫기|확인|나중에|취소)$/ })
    if (await c.count()) await c.first().click({ timeout: 4000 }).catch(() => {})
    else await p.keyboard.press('Escape')
    await p.waitForTimeout(400)
  }
}
await p.goto(`http://127.0.0.1:${PORT}/?card=chuseok`)
await p.waitForTimeout(1500); await 치우기()
await p.getByText('레꾸자랑', { exact: true }).last().click().catch(() => {})
await p.waitForTimeout(900); await 치우기()
await p.locator('.grid-card button, .grid-card').first().click().catch(() => {})
await p.waitForTimeout(1200)
const 뽑기 = p.getByRole('button', { name: /랜덤|뽑/ })
if (await 뽑기.count()) { await 뽑기.first().click().catch(() => {}); await p.waitForTimeout(1800) }

// 앱이 쓰는 그 라이브러리(UMD)를 페이지에 얹는다 — 앱 번들 안 함수는 밖에서 못 부른다
await p.addScriptTag({ path: path.join(__dirname, '..', 'node_modules', 'html-to-image', 'dist', 'html-to-image.js') })
const r = await p.evaluate(async () => {
  const 큰것 = [...document.querySelectorAll('img')].map((i) => ({ i, r: i.getBoundingClientRect() }))
    .filter((x) => x.r.width > 120 && x.r.height > 120).sort((a, b) => b.r.width * b.r.height - a.r.width * a.r.height)[0]
  if (!큰것) return { err: '카드 그림을 못 찾음' }
  let el = 큰것.i
  while (el.parentElement) { const rr = el.parentElement.getBoundingClientRect(); if (rr.width >= 300 && rr.height >= 400) { el = el.parentElement; break } el = el.parentElement }
  const opt = { pixelRatio: 1.6, quality: 0.92, backgroundColor: '#ffffff' }
  await window.htmlToImage.toJpeg(el, opt)          // 예열(앱과 같다)
  const url = await window.htmlToImage.toJpeg(el, opt)
  const im = new Image(); im.src = url; await im.decode()
  const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight
  c.getContext('2d').drawImage(im, 0, 0)
  // 칩 = 카드 안에서 «N분»·«N인분» 글자를 가진 작은 상자
  const R = el.getBoundingClientRect()
  const 칩 = [...el.querySelectorAll('span,div')].filter((s) => s.children.length === 0 && /^(\d+분|\d+인분|한식|중식|일식|양식|간식|쉬움|보통|어려움)$/.test((s.textContent || '').trim()))
    .map((s) => s.getBoundingClientRect())
  if (!칩.length) return { err: '칩을 못 찾음', w: c.width, h: c.height, full: c.toDataURL('image/png') }
  const k = c.width / R.width
  const x0 = Math.max(0, Math.min(...칩.map((q) => q.left)) - R.left - 16), x1 = Math.max(...칩.map((q) => q.right)) - R.left + 70
  const y0 = Math.min(...칩.map((q) => q.top)) - R.top - 12, y1 = Math.max(...칩.map((q) => q.bottom)) - R.top + 12
  const 배 = Math.min(1, 640 / ((x1 - x0) * k))   // 로그에 실을 만큼만(≈640px 폭 · JPEG)
  const cc = document.createElement('canvas'); cc.width = Math.round((x1 - x0) * k * 배); cc.height = Math.round((y1 - y0) * k * 배)
  cc.getContext('2d').drawImage(c, x0 * k, y0 * k, (x1 - x0) * k, (y1 - y0) * k, 0, 0, cc.width, cc.height)
  // 숫자: 각 칩 오른쪽 바깥 띠(2~14px)에서 «거의 흰» 픽셀 비율 — 반달이 있으면 커진다
  const ctx = c.getContext('2d'); const 띠 = []
  for (const q of 칩) {
    const sx = Math.round((q.right - R.left + 2) * k), sy = Math.round((q.top - R.top) * k), sw = Math.round(12 * k), sh = Math.round(q.height * k)
    const d = ctx.getImageData(sx, sy, sw, sh).data; let n = 0, w = 0
    for (let i = 0; i < d.length; i += 4) { n++; if (d[i] > 240 && d[i + 1] > 240 && d[i + 2] > 235) w++ }
    띠.push(+(w / n).toFixed(3))
  }
  return { w: c.width, h: c.height, 칩수: 칩.length, 띠, crop: cc.toDataURL('image/jpeg', 0.82), full: c.toDataURL('image/png') }
})
if (r.full) writeFileSync(path.join(OUT, `칩반달-실물-${ENGINE}.png`), Buffer.from(r.full.split(',')[1], 'base64'))
if (r.crop) writeFileSync(path.join(OUT, `칩반달-실물-${ENGINE}-칩줄.jpg`), Buffer.from(r.crop.split(',')[1], 'base64'))
console.log(`[${ENGINE}] 카드 ${r.w}x${r.h} · 칩 ${r.칩수 || 0}개 · 오른쪽 띠 흰 비율 = ${JSON.stringify(r.띠 || null)} ${r.err ? '· ⚠️ ' + r.err : ''}`)
if (errs.length) console.log('page errors:', errs.join(' | ').slice(0, 400))
if (r.crop) { const b64 = r.crop.split(',')[1]; console.log(`--- 칩줄 JPEG base64 (${b64.length}자) ---`); for (let i = 0; i < b64.length; i += 4000) console.log('B64:' + b64.slice(i, i + 4000)); console.log('--- 끝 ---') }
await b.close(); srv.kill(); process.exit(0)
