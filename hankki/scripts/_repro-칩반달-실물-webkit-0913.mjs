// 🧪 칩 «흰 반달» — «진짜 앱 카드»를 사파리 엔진(WebKit)에서 구워 본다 (2026-09-13 · 2차)
//
// 1차(`_repro-칩반달-webkit-0913.mjs` · 간단판 칩 셋)는 맥 WebKit 에서 재현이 «안 됐다»(오른쪽 띠 0.011~0.014 · 크롬과 같음).
// → 실물(딸 아이폰14 · 빌드 12 · 추석 카드 문자 공유 · 12:12 캡처)과 다른 점 = 진짜 카드 부품 · Jua 글꼴 · pixelRatio 1.6 · toJpeg.
// 이 판은 dist 의 «진짜 앱»을 열어 `?card=chuseok` 카드를 뽑고, 앱과 같은 길(html-to-image toJpeg · 1.6 · 예열 두 번)로 굽는다.
// 결과 = ① 카드 전체 PNG(_out) ② 칩 줄만 잘라 base64 로 로그에 찍는다(러너 결과물을 이 컨테이너가 못 받아서 · 규칙 21 눈으로 본다)
// 사용(러너): node scripts/_repro-칩반달-실물-webkit-0913.mjs webkit   (dist 가 있어야 한다 · npm run build)
// ✅ 4차(12:5x) — 고침(ShareDrawCard chips: 사파리 엔진이면 그림자 대신 border) 넣은 뒤 다시 돈다 → 이제 A(그대로)가 C 처럼 깨끗해야 한다
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
// ⛔ 러너(맥)에선 python 이 늦게 떠서 0.9초 고정 대기로는 ERR_CONNECTION_TIMED_OUT(1차 실측) → 응답할 때까지 기다린다(최대 30초)
for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/`); if (r.ok) break } catch {} await new Promise((r) => setTimeout(r, 500)) }
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
// ⭐ 3차(12:45) — 맥 WebKit 에서 «재현됐다»(칩 오른쪽 절반이 어둡게/희게 갈라짐 · 딸 폰과 같은 모양).
//    같은 카드에서 고침 후보를 «칩 스타일만 바꿔» 차례로 굽고 한 장에 세로로 쌓는다(눈으로 고른다).
//   A = 지금 그대로(inline span · borderRadius 999 · 바깥 그림자 ＋ inset 테두리 그림자)
//   B = borderRadius 를 «값»으로(30px) — 999 가 WebKit 클론에서 이상하게 풀리는지
//   C = 그림자 둘 다 빼고 border 2px 만
//   D = B ＋ C(둥근값 ＋ border · 그림자 0)
//   E = 바깥 그림자만 빼기(inset 테두리 그림자는 유지)
const r = await p.evaluate(async () => {
  const 큰것 = [...document.querySelectorAll('img')].map((i) => ({ i, r: i.getBoundingClientRect() }))
    .filter((x) => x.r.width > 120 && x.r.height > 120).sort((a, b) => b.r.width * b.r.height - a.r.width * a.r.height)[0]
  if (!큰것) return { err: '카드 그림을 못 찾음' }
  let el = 큰것.i
  while (el.parentElement) { const rr = el.parentElement.getBoundingClientRect(); if (rr.width >= 300 && rr.height >= 400) { el = el.parentElement; break } el = el.parentElement }
  const 칩들 = [...el.querySelectorAll('span,div')].filter((s) => s.children.length === 0 && /^(\d+분|\d+인분|한식|중식|일식|양식|간식|쉬움|보통|어려움)$/.test((s.textContent || '').trim()))
  if (!칩들.length) return { err: '칩을 못 찾음' }
  const 원래 = 칩들.map((s) => s.getAttribute('style') || '')
  const 변형 = {
    A: (s) => {},
    B: (s) => { s.style.borderRadius = '30px' },
    C: (s) => { s.style.boxShadow = 'none'; s.style.border = '2px solid rgba(216,150,110,.25)' },
    D: (s) => { s.style.borderRadius = '30px'; s.style.boxShadow = 'none'; s.style.border = '2px solid rgba(216,150,110,.25)' },
    E: (s) => { s.style.boxShadow = 'inset 0 0 0 2px rgba(216,150,110,.25)' }
  }
  const opt = { pixelRatio: 1.6, quality: 0.92, backgroundColor: '#ffffff' }
  const R = el.getBoundingClientRect()
  const 칩 = 칩들.map((q) => q.getBoundingClientRect())
  const x0 = Math.max(0, Math.min(...칩.map((q) => q.left)) - R.left - 16), x1 = Math.max(...칩.map((q) => q.right)) - R.left + 70
  const y0 = Math.min(...칩.map((q) => q.top)) - R.top - 12, y1 = Math.max(...칩.map((q) => q.bottom)) - R.top + 12
  const 조각 = []
  for (const [k, f] of Object.entries(변형)) {
    칩들.forEach((s, i) => { s.setAttribute('style', 원래[i]); f(s) })
    await window.htmlToImage.toJpeg(el, opt)
    const url = await window.htmlToImage.toJpeg(el, opt)
    const im = new Image(); im.src = url; await im.decode()
    const kk = im.naturalWidth / R.width
    const 배 = Math.min(1, 560 / ((x1 - x0) * kk))
    const cc = document.createElement('canvas'); cc.width = Math.round((x1 - x0) * kk * 배); cc.height = Math.round((y1 - y0) * kk * 배)
    const cx = cc.getContext('2d'); cx.drawImage(im, x0 * kk, y0 * kk, (x1 - x0) * kk, (y1 - y0) * kk, 0, 0, cc.width, cc.height)
    cx.fillStyle = '#000'; cx.font = 'bold 22px sans-serif'; cx.fillText(k, 6, 26)
    조각.push(cc)
  }
  칩들.forEach((s, i) => s.setAttribute('style', 원래[i]))
  const W = Math.max(...조각.map((c) => c.width)), H = 조각.reduce((a, c) => a + c.height + 4, 0)
  const all = document.createElement('canvas'); all.width = W; all.height = H
  const ax = all.getContext('2d'); ax.fillStyle = '#888'; ax.fillRect(0, 0, W, H)
  let y = 0; for (const c of 조각) { ax.drawImage(c, 0, y); y += c.height + 4 }
  return { 칩수: 칩들.length, 판: Object.keys(변형).join(''), crop: all.toDataURL('image/jpeg', 0.8) }
})
if (r.crop) writeFileSync(path.join(OUT, `칩반달-실물-${ENGINE}-후보.jpg`), Buffer.from(r.crop.split(',')[1], 'base64'))
console.log(`[${ENGINE}] 칩 ${r.칩수 || 0}개 · 후보 ${r.판 || ''} ${r.err ? '· ⚠️ ' + r.err : ''}`)
if (errs.length) console.log('page errors:', errs.join(' | ').slice(0, 400))
if (r.crop) { const b64 = r.crop.split(',')[1]; console.log(`--- 후보 5장 JPEG base64 (${b64.length}자) ---`); for (let i = 0; i < b64.length; i += 4000) console.log('B64:' + b64.slice(i, i + 4000)); console.log('--- 끝 ---') }
await b.close(); srv.kill(); process.exit(0)
