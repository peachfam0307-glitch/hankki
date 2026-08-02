// 캡처 자르기 게이트 — 「손가락으로 잡은 만큼」 잘리는지 픽셀로 잰다.
//
// 왜 만드나 (2026-08-02)
//   창업자 폰 제보: *"가져오기에서 캡쳐 사진 자르기 할 때 내가 자른 것보다 더 작게 잘려."*
//   원인 = 비율을 재는 «박스»와 실제로 그려진 «이미지»가 서로 다른 크기였다.
//   이미지엔 maxHeight: calc(100vh - 200px) 라는 «어림잡은» 값이 박혀 있었고
//   박스엔 maxHeight: 100% 를 줘서, 실측 390×844 에서 27px 이 어긋났다.
//   폰은 안전영역(노치·상태표시줄) 때문에 100px 넘게 벌어진다.
//   → 손가락이 짚은 자리가 원본에선 «더 아래»로 옮겨져, 위쪽이 잘려 나갔다.
//
// ⭐ 눈으로는 절대 못 잡는다 — 몇 %씩 밀리는 거라 화면만 보면 멀쩡해 보인다.
//    그래서 원본 네 귀퉁이에 색 표식을 찍어 두고 «잘린 결과의 픽셀»을 직접 읽는다.
//
// 로컬:  SMOKE_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/test-crop.mjs
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = Number(process.env.CROP_PORT || 4191)
const BASE = `http://127.0.0.1:${PORT}/`
const CHROMIUM = process.env.SMOKE_CHROMIUM || undefined
const SAFE_TOP = 44 // 폰 상태표시줄 흉내 — 헤드리스는 env(safe-area-inset-top)=0 이라 안 드러난다
const NAT = { w: 1080, h: 2340 } // 요즘 폰 캡처. 세로로 아주 길어야 어긋남이 드러난다

const fails = []
const ok = (m) => console.log('[crop] ✓', m)
const bad = (m) => { fails.push(m); console.log('[crop] ✗', m) }

async function waitHttp(url, t = 45000) {
  const s = Date.now()
  while (Date.now() - s < t) {
    try { const r = await fetch(url); if (r.status < 500) return } catch { /* 아직 */ }
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error('preview 준비 안 됨')
}

let server, browser
try {
  server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], { cwd: process.cwd(), env: process.env })
  await waitHttp(BASE)
  browser = await chromium.launch({ executablePath: CHROMIUM, args: ['--no-sandbox'] })
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e.message || e)))

  // OCR 은 이 검사의 관심사가 아니다 — 곧바로 빈 글을 돌려줘 흐름만 흘려보낸다.
  await page.route('**/hankki-ocr.annyeong-hankki.workers.dev/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ text: '재료\n가지 5개' }) }))

  await page.addInitScript((safe) => {
    localStorage.setItem('hankki:onboarded', '1')
    for (const k of ['hankki:coach:home', 'hankki:coach:home2', 'hankki:coach:myrecipes', 'hankki:coach:editor', 'hankki:coach:shop', 'hankki:coach:brag']) localStorage.setItem(k, '1')
    addEventListener('DOMContentLoaded', () => document.documentElement.style.setProperty('--safe-top', safe + 'px'))
  }, SAFE_TOP)

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(900)
  await page.getByRole('button', { name: '가져오기' }).first().click()
  await page.waitForTimeout(700)
  await page.getByText('직접 작성', { exact: false }).first().click()
  await page.waitForTimeout(900)

  // 네 귀퉁이에 색 표식을 찍은 세로 캡처 한 장을 만들어 넣는다
  await page.evaluate(async (nat) => {
    const c = document.createElement('canvas')
    c.width = nat.w; c.height = nat.h
    const g = c.getContext('2d')
    g.fillStyle = '#fff'; g.fillRect(0, 0, nat.w, nat.h)
    g.fillStyle = '#ff0000'; g.fillRect(0, 0, 120, 120)
    g.fillStyle = '#00a000'; g.fillRect(nat.w - 120, 0, 120, 120)
    g.fillStyle = '#0000ff'; g.fillRect(0, nat.h - 120, 120, 120)
    g.fillStyle = '#ff00ff'; g.fillRect(nat.w - 120, nat.h - 120, 120, 120)
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'))
    const dt = new DataTransfer()
    dt.items.add(new File([blob], 'capture.png', { type: 'image/png' }))
    const inp = document.querySelector('input[type=file][multiple]')
    inp.files = dt.files
    inp.dispatchEvent(new Event('change', { bubbles: true }))
  }, NAT)
  await page.waitForTimeout(1400)

  if (!(await page.getByText('이 부분만 읽기').isVisible().catch(() => false))) throw new Error('자르기 화면이 안 열림')

  // ── ① 박스 = 실제로 그려진 이미지여야 한다 (여기가 어긋나면 아래가 다 어긋난다) ──
  const geom = await page.evaluate(() => {
    const img = [...document.querySelectorAll('img')].find((i) => {
      const p = i.parentElement
      return p && getComputedStyle(p).touchAction === 'none' && i.naturalHeight > 1000
    })
    if (!img) return null
    const b = img.parentElement.getBoundingClientRect(), i = img.getBoundingClientRect()
    return { box: { w: b.width, h: b.height }, img: { w: i.width, h: i.height, x: i.x, y: i.y } }
  })
  if (!geom) throw new Error('자르기 이미지를 못 찾음')
  const dw = Math.abs(geom.box.w - geom.img.w), dh = Math.abs(geom.box.h - geom.img.h)
  if (dw <= 1 && dh <= 1) ok(`박스 = 그려진 이미지 (${geom.img.w.toFixed(0)}×${geom.img.h.toFixed(0)})`)
  else bad(`박스와 이미지가 어긋남 — 가로 ${dw.toFixed(1)}px · 세로 ${dh.toFixed(1)}px (여기가 벌어지면 자른 자리가 밀린다)`)

  // ── ② 손잡이를 25%~75% 로 끌면 원본의 «딱 절반»이 잘려야 한다 ──
  const g = geom.img
  const at = (fx, fy) => ({ x: g.x + fx * g.w, y: g.y + fy * g.h })
  const drag = async (from, to) => {
    await page.mouse.move(from.x, from.y); await page.mouse.down()
    await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 6 })
    await page.mouse.move(to.x, to.y, { steps: 6 }); await page.mouse.up()
    await page.waitForTimeout(120)
  }
  await drag(at(0.03, 0.03), at(0.25, 0.25))
  await drag(at(0.97, 0.97), at(0.75, 0.75))
  await page.getByText('이 부분만 읽기').click()
  await page.waitForTimeout(2500)

  const cut = await page.evaluate(() => new Promise((res) => {
    const im = [...document.querySelectorAll('img')].find((i) => i.alt?.startsWith('캡처'))
    if (!im) return res(null)
    const t = new Image()
    t.onload = () => {
      const c = document.createElement('canvas')
      c.width = t.naturalWidth; c.height = t.naturalHeight
      const x = c.getContext('2d'); x.drawImage(t, 0, 0)
      const px = (a, b) => { const d = x.getImageData(a, b, 1, 1).data; return [d[0], d[1], d[2]] }
      res({
        w: t.naturalWidth, h: t.naturalHeight,
        corners: [px(2, 2), px(t.naturalWidth - 3, 2), px(2, t.naturalHeight - 3), px(t.naturalWidth - 3, t.naturalHeight - 3)],
      })
    }
    t.onerror = () => res(null)
    t.src = im.src
  }))
  if (!cut) bad('잘린 사진을 못 읽음')
  else {
    const ew = Math.round(NAT.w * 0.5), eh = Math.round(NAT.h * 0.5)
    // 손잡이 픽셀 반올림 오차 — 화면 1px 이 원본 4px 이라 넉넉히 잡아도 «몇 %씩 밀리는» 버그는 못 빠져나간다
    const tolW = Math.round(NAT.w * 0.025), tolH = Math.round(NAT.h * 0.025)
    if (Math.abs(cut.w - ew) <= tolW && Math.abs(cut.h - eh) <= tolH) ok(`손가락대로 잘림 — 기대 ${ew}×${eh} · 실제 ${cut.w}×${cut.h}`)
    else bad(`자른 크기가 어긋남 — 기대 ${ew}×${eh} 인데 ${cut.w}×${cut.h} (손가락이 짚은 자리와 실제로 자른 자리가 다르다)`)
    // 가운데만 잘랐으니 귀퉁이 색 표식은 «하나도» 남으면 안 된다
    const stain = cut.corners.filter(([r, gg, b]) => !(r > 235 && gg > 235 && b > 235))
    if (!stain.length) ok('가운데만 잘렸다 — 귀퉁이 표식 0개')
    else bad(`자른 자리가 밀렸다 — 귀퉁이에 원본 표식이 ${stain.length}개 남음 ${JSON.stringify(stain)}`)
  }

  // ── ③ 「사진 닫기」가 상태표시줄 밑에 깔리면 안 된다 ──
  //     이 패널은 sticky top:0 이라 스크롤하면 화면 맨 위 = 상태표시줄 자리에 붙는다.
  await page.evaluate(() => { document.querySelectorAll('textarea')[0]?.scrollIntoView({ block: 'center' }) })
  await page.waitForTimeout(500)
  const btn = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => x.getAttribute('aria-label') === '캡처 사진 닫기')
    if (!b) return null
    const r = b.getBoundingClientRect()
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
    return { top: r.y, canTap: !!hit && (hit === b || b.contains(hit)) }
  })
  if (!btn) bad('「사진 닫기」 버튼이 없다 — 사진을 치울 방법이 사라진다')
  else if (btn.top >= SAFE_TOP && btn.canTap) ok(`「사진 닫기」가 상태표시줄(${SAFE_TOP}px) 아래에 있고 눌린다 — top ${btn.top.toFixed(0)}px`)
  else bad(`「사진 닫기」를 못 누른다 — top ${btn.top.toFixed(0)}px (상태표시줄 ${SAFE_TOP}px) · 눌림 ${btn.canTap}`)

  if (errs.length) bad(`런타임 에러 ${errs.length}건 — ${errs[0]}`)
} catch (e) {
  bad(String(e.message || e))
} finally {
  try { if (browser) await browser.close() } catch { /* noop */ }
  try { if (server && !server.killed) server.kill('SIGTERM') } catch { /* noop */ }
}

if (fails.length) {
  console.error('\n⛔ 캡처 자르기 게이트 실패\n' + fails.map((f) => '  · ' + f).join('\n'))
  process.exit(1)
}
console.log('\n✅ 캡처 자르기 통과 — 손가락대로 잘리고, 사진 닫기가 손에 닿는다')
