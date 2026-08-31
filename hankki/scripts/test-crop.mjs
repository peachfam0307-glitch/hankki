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
// ⛔⛔ 이 게이트는 «CI 체인에 넣지 않는다» (2026-08-02)
//    붙인 첫날 CI 스모크 단계가 18분·27분을 넘겨 배포가 두 번 통째로 막혔다.
//    비교값 = v9.41 때 같은 단계가 «40초». 즉 이것 하나가 체인을 죽였다.
//    180초 워치독을 달았는데도 CI 에선 안 끊겼다 — 원인은 CI 안이라 여기서 못 본다.
//    📌 «모든 배포를 막는 게이트»는 «없는 게이트»보다 나쁘다. 그래서 로컬 명령으로 뺀다.
//    ✅ 배포 전에 손으로 돌린다:  npm run test:crop
//    🔜 CI 로 다시 넣으려면 먼저 «CI 에서 왜 안 끝나는지»를 로그로 확인할 것.
//       (preview 서버를 두 개 띄우는 구조가 제일 의심된다 — smoke.mjs 와 합치는 쪽이 낫다)
//
// 로컬:  SMOKE_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npm run test:crop
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

// ⏱⏱ 하드 워치독 — ⛔«매달리는 게이트»는 없는 게이트보다 나쁘다.
//    2026-08-02: 이 게이트를 CI 에 붙인 첫날, 스모크 단계가 27분을 넘겨 배포가 통째로 막혔다.
//    로컬에선 60~90초에 끝난다. 원인이 무엇이든 «시간 안에 안 끝나면 끊는다».
const LIMIT = Number(process.env.CROP_TIMEOUT || 180000)
let mark = '시작 전'
const at = (m) => { mark = m }
const watchdog = setTimeout(() => {
  console.error(`\n⛔ 캡처 자르기 게이트가 ${LIMIT / 1000}초를 넘겼다 — 「${mark}」에서 멈춰 있다.`)
  console.error('   로컬에선 60~90초면 끝난다. 매달리느니 끊는다.')
  process.exit(1)
}, LIMIT)

// 원본 promise 는 timeout 이 없다 — img.onload 가 안 오면 영영 기다린다. 그래서 감싼다.
const within = (p, ms, what) => Promise.race([
  p,
  new Promise((_, rej) => setTimeout(() => rej(new Error(`${what} 가 ${ms / 1000}초를 넘겼다`)), ms)),
])

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
  browser = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  page.setDefaultTimeout(30000)
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

  at('앱 열기')
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(900)
  await page.getByRole('button', { name: '가져오기' }).first().click()
  await page.waitForTimeout(700)
  await page.getByText('직접 작성', { exact: false }).first().click()
  await page.waitForTimeout(900)

  at('캡처 두 장 넣기')
  // 캡처 «두 장» — ①은 네 귀퉁이 색 표식(자르기 정확도용) · ②는 한가운데 청록 판(2장째 확인용)
  await page.evaluate(async (nat) => {
    const make = async (second) => {
      const c = document.createElement('canvas')
      c.width = nat.w; c.height = nat.h
      const g = c.getContext('2d')
      g.fillStyle = '#fff'; g.fillRect(0, 0, nat.w, nat.h)
      if (second) { g.fillStyle = '#00b8b8'; g.fillRect(0, 0, nat.w, nat.h) } // 2장째는 통째로 청록
      else {
        g.fillStyle = '#ff0000'; g.fillRect(0, 0, 120, 120)
        g.fillStyle = '#00a000'; g.fillRect(nat.w - 120, 0, 120, 120)
        g.fillStyle = '#0000ff'; g.fillRect(0, nat.h - 120, 120, 120)
        g.fillStyle = '#ff00ff'; g.fillRect(nat.w - 120, nat.h - 120, 120, 120)
      }
      return new Promise((r) => { setTimeout(() => r(null), 15000); c.toBlob(r, 'image/png') })
    }
    const dt = new DataTransfer()
    dt.items.add(new File([await make(false)], 'cap1.png', { type: 'image/png' }))
    dt.items.add(new File([await make(true)], 'cap2.png', { type: 'image/png' }))
    const inp = document.querySelector('input[type=file][multiple]')
    inp.files = dt.files
    inp.dispatchEvent(new Event('change', { bubbles: true }))
  }, NAT)
  await page.waitForTimeout(1400)

  if (!(await page.getByText('이 부분만 읽기').isVisible().catch(() => false))) throw new Error('자르기 화면이 안 열림')

  at('박스 크기 재기')
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
  const at2 = (fx, fy) => ({ x: g.x + fx * g.w, y: g.y + fy * g.h })
  const drag = async (from, to) => {
    await page.mouse.move(from.x, from.y); await page.mouse.down()
    await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 6 })
    await page.mouse.move(to.x, to.y, { steps: 6 }); await page.mouse.up()
    await page.waitForTimeout(120)
  }
  await drag(at2(0.03, 0.03), at2(0.25, 0.25))
  await drag(at2(0.97, 0.97), at2(0.75, 0.75))
  await page.getByText('이 부분만 읽기').click()
  await page.waitForTimeout(2500)

  // 2장째 자르기 화면 — 여기서 안 뜨면 두 번째 장이 통째로 사라진 것이다
  if (await page.getByText('이 부분만 읽기').isVisible().catch(() => false)) {
    ok('2장째 자르기 화면이 떴다')
    await page.getByText('전체 사용').click()
    await page.waitForTimeout(2500)
  } else bad('2장째 자르기 화면이 안 떴다 — 두 번째 캡처가 사라진다')

  at('잘린 사진 픽셀 읽기')
  const cut = await within(page.evaluate(() => new Promise((res) => {
    const im = [...document.querySelectorAll('img')].find((i) => i.alt === '캡처 1')
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
    setTimeout(() => res(null), 15000) // 안 뜨면 포기 — 매달리지 않는다
    t.src = im.src
  })), 25000, '잘린 사진 읽기').catch((e) => { bad(String(e.message)); return null })
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

  at('사진 닫기 확인')
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

  at('접기 확인')
  // ── ④ 「사진 접기」로 가려진 입력칸이 드러나야 한다 ──
  //    창업자: *"캡쳐 보면서 비교할 때 사진이 고정되어 있으니 레시피가 안 보일 때 방법이 없다"*
  //    사진이 화면 위를 차지한 채 고정이라, 그 밑에 깔린 칸을 보려면 통째로 닫는 수밖에 없었다.
  const panelH = () => page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((x) => x.getAttribute('aria-label') === '캡처 사진 닫기')
    const panel = btn?.closest('div[style*="sticky"]')
    return panel ? +panel.getBoundingClientRect().height.toFixed(0) : null
  })
  const before = await panelH()
  const fold = page.getByRole('button', { name: '캡처 사진 접기' })
  if (!(await fold.isVisible().catch(() => false))) bad('「사진 접기」가 없다 — 가려진 칸을 볼 방법이 없다')
  else {
    await fold.click(); await page.waitForTimeout(400)
    const after = await panelH()
    // 접으면 손잡이 줄만 남아야 한다(대략 안전영역＋한 줄)
    if (after !== null && before !== null && after <= SAFE_TOP + 60 && after < before / 2) ok(`접으면 ${before}px → ${after}px 로 줄어 레시피가 드러난다`)
    else bad(`접었는데 안 줄었다 — ${before}px → ${after}px`)
    const back = page.getByRole('button', { name: '캡처 사진 펼치기' })
    if (!(await back.isVisible().catch(() => false))) bad('펼치기 버튼이 없다 — 접으면 사진을 다시 못 켠다')
    else {
      await back.click(); await page.waitForTimeout(400)
      const again = await panelH()
      if (again !== null && before !== null && Math.abs(again - before) <= 8) ok(`다시 펼치면 그 자리에서 ${again}px 로 돌아온다`)
      else bad(`펼쳤는데 안 돌아왔다 — ${before}px 였는데 ${again}px`)
    }
  }

  at('2장째 확인')
  // ── ⑤ 두 장 넣었으면 «둘째 장으로 갈 수 있어야» 한다 ──
  //     창업자 2026-08-02: *"2장 중에 보고 쓸 때는 1장만 보여."*
  //     예전엔 세로로 쌓아둬서, 2340px 짜리 1장째를 다 넘겨야 2장째가 나왔다(사실상 못 감).
  const pick2 = page.getByRole('button', { name: '2번째 캡처 보기' })
  if (!(await pick2.isVisible().catch(() => false))) bad('「2번째 장」으로 가는 버튼이 없다 — 둘째 캡처를 못 본다')
  else {
    await pick2.click(); await page.waitForTimeout(500)
    at('2장째 픽셀 읽기')
    const shown = await within(page.evaluate(() => new Promise((res) => {
      const im = [...document.querySelectorAll('img')].find((i) => i.alt?.startsWith('캡처'))
      if (!im) return res(null)
      const t = new Image()
      t.onload = () => {
        const c = document.createElement('canvas'); c.width = 8; c.height = 8
        const x = c.getContext('2d'); x.drawImage(t, 0, 0, 8, 8)
        const d = x.getImageData(4, 4, 1, 1).data
        res({ alt: im.alt, rgb: [d[0], d[1], d[2]] })
      }
      t.onerror = () => res(null)
      setTimeout(() => res(null), 15000)
      t.src = im.src
    })), 25000, '2장째 읽기').catch((e) => { bad(String(e.message)); return null })
    // 2장째는 통째로 청록(#00b8b8) — 1장째(흰 바탕)와 확실히 갈린다
    const teal = shown && shown.rgb[0] < 90 && shown.rgb[1] > 140 && shown.rgb[2] > 140
    if (teal) ok(`2번째 장을 눌러 실제로 그 사진이 보인다 (${shown.alt})`)
    else bad(`2번째 장을 눌렀는데 다른 사진이 보인다 — ${JSON.stringify(shown)}`)
  }

  if (errs.length) bad(`런타임 에러 ${errs.length}건 — ${errs[0]}`)
} catch (e) {
  bad(String(e.message || e))
} finally {
  try { if (browser) await browser.close() } catch { /* noop */ }
  try { if (server && !server.killed) server.kill('SIGTERM') } catch { /* noop */ }
}

clearTimeout(watchdog)

if (fails.length) {
  console.error('\n⛔ 캡처 자르기 게이트 실패\n' + fails.map((f) => '  · ' + f).join('\n'))
  process.exit(1)
}
console.log('\n✅ 캡처 자르기 통과 — 손가락대로 잘리고, 사진 닫기가 손에 닿는다')
