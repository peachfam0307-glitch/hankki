// 🐛🐛 재현판 — 「레꾸자랑에서 뒤로가면 홈으로 간다」 (창업자 할일 1번 · 2026-08-23)
//
// 📮 창업자 = *"레꾸자랑에서 고르고하고 뒤로가면 홈으로 감."*
//   → 그 뒤 **결정적인 한 마디** = *"레꾸자랑 갑자기 홈가는게 «뒤로가기»할때야. «닫기»누르면 그대로있어"*
//
// ⭐⭐ 그 한 마디가 층을 갈랐다 —
//    「닫기」는 `onClose` 를 «직접» 부르니 어느 층이든 멀쩡하다.
//    「뒤로가기」는 `App.jsx` 의 «층»(modalLayers)을 타는데, 거기 등록 안 된 창은
//    4번 갈래(「다른 탭이면 홈으로」)로 그냥 떨어진다.
//    👉 즉 **「닫기는 되는데 뒤로가기가 샌다」 = 그 창이 층에 없다**는 뜻이다.
//
// ⛔⛔ 레꾸자랑엔 그런 창이 «셋»이었다. v11.23 은 그중 하나만 고쳤다:
//    ① 선택 시트(꾸민 표지/랜덤 카드 고르기) — v11.23 에서 고침 … ⚠️그런데 그 판이 «껍데기»로 나갔다(아래)
//    ② 랜덤 카드 모달(ShareDrawCard)      — 손도 안 댔다 ← 창업자가 본 그것
//    ③ 「지금 보내기」(SendNowSheet)       — 손도 안 댔다
//
// ⛔⛔⛔ **＋ v11.23 은 «커밋 메시지만» v11.23 이었다.**
//    컨테이너가 되감기며 작업 파일이 쓸렸는데 그 상태로 커밋했다 —
//    `git show 5cbac353:…/BragScreen.jsx | grep -c useLayerBack` = **0**.
//    📌 CLAUDE.md 에 이미 적혀 있던 사고다(`ed35960b` — 「메시지만 새것이고 내용은 옛것」).
//    ✅ 그래서 이 판은 **고친 뒤 커밋 «내용»까지 확인**하고 올린다.
//
// ⭐ 재는 법 = 뒤로 누른 «뒤»에 **하단바에서 켜진 탭 이름**을 읽는다(절대원칙 30 — 앱이 쓰는 그 값).
//    ⛔ 「창이 닫혔나」만 보면 안 된다 — 홈으로 새면 탭이 통째로 갈려서 창도 «닫힌 것처럼» 보인다.
//       그래서 v11.23 재현판이 초록불이었어도 창업자 폰에선 홈으로 샜을 수 있다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-자랑뒤로-0823.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const srv = createServer((q, s) => {
  let p = decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/, ''); if (p === '/' || p === '') p = '/index.html'
  let body, type = MIME[extname(p)] || 'application/octet-stream'
  try { body = readFileSync(join(DIST, p)) } catch { body = readFileSync(join(DIST, 'index.html')); type = 'text/html' }
  s.writeHead(200, { 'content-type': type }); s.end(body)
})
await new Promise((r) => srv.listen(4389, r))

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const CHROMIUM = process.env.SMOKE_CHROMIUM
const b = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(() => { try { localStorage.setItem('hankki:onboarded', '1') } catch {} })
await page.goto('http://127.0.0.1:4389/hankki/', { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(900)

const 칸 = []
const 잰다 = (이름, 참, 실제) => { 칸.push({ 이름, 참, 실제 }) }
const 글 = (이름, 값) => { 칸.push({ 이름, 실제: 값, 글: true }) }

// 지금 켜진 탭 — 하단바에서 «켜진» 칸의 글자(앱이 쓰는 그 표시)
const 켜진탭 = () => page.evaluate(() => {
  const on = [...document.querySelectorAll('.bottom-nav .nav-item')]
    .find((e) => e.classList.contains('on') || e.getAttribute('aria-current') === 'page' || /\bactive\b/.test(e.className))
  return (on?.innerText || '').trim().split('\n')[0] || '(모름)'
})
const 탭으로 = async (글자) => {
  await page.locator('.bottom-nav .nav-item').filter({ hasText: 글자 }).first().click()
  await page.waitForTimeout(700)
}

await 탭으로('자랑')
잰다('① 자랑 탭이 켜졌다', true, (await 켜진탭()) !== '홈')

const 카드 = page.locator('[aria-label$="자랑하기"]')
const 카드수 = await 카드.count()
잰다('② 자랑할 레시피가 있다', true, 카드수 > 0)

// ─────────────────────────────────────────────────────────────
// ㉠ 선택 시트에서 뒤로가기
// ─────────────────────────────────────────────────────────────
if (카드수 > 0) {
  await 카드.first().click()
  await page.waitForTimeout(600)
  잰다('㉠-1 고르면 선택 시트가 뜬다', true, (await page.locator('.sheet-mask').count()) > 0)
  await page.goBack()
  await page.waitForTimeout(800)
  const 간곳 = await 켜진탭()
  잰다('㉠-2 ⭐선택 시트에서 뒤로 → «자랑»에 남는다', true, 간곳 !== '홈')
  글('   └ 실제로 간 곳', 간곳)
}

// ─────────────────────────────────────────────────────────────
// ㉡ ⭐ 랜덤 카드 모달에서 뒤로가기 — 창업자가 본 그것
// ─────────────────────────────────────────────────────────────
await 탭으로('자랑')
if (카드수 > 0) {
  await 카드.first().click()
  await page.waitForTimeout(500)
  const 랜덤 = page.getByText('랜덤 카드로 뽑기').first()
  잰다('㉡-1 「랜덤 카드로 뽑기」가 있다', true, (await 랜덤.count()) > 0)
  if (await 랜덤.count()) {
    await 랜덤.click()
    await page.waitForTimeout(1500)
    잰다('㉡-2 랜덤 카드가 뜬다', true, (await page.getByText('다시 뽑기').count()) > 0)

    await page.goBack()
    await page.waitForTimeout(900)
    const 남았나 = await page.getByText('다시 뽑기').count()
    const 간곳 = await 켜진탭()
    잰다('㉡-3 뒤로가면 카드가 닫힌다', true, 남았나 === 0)
    잰다('㉡-4 ⭐랜덤 카드에서 뒤로 → «자랑»에 남는다', true, 간곳 !== '홈')
    글('   └ 실제로 간 곳', 간곳)
  }
}

// ─────────────────────────────────────────────────────────────
// ㉢ 「닫기」로 닫으면 그대로 있나 (창업자가 «된다»고 한 쪽 — 안 깨졌는지 지킨다)
// ─────────────────────────────────────────────────────────────
await 탭으로('자랑')
if (카드수 > 0) {
  await 카드.first().click()
  await page.waitForTimeout(500)
  const 랜덤 = page.getByText('랜덤 카드로 뽑기').first()
  if (await 랜덤.count()) {
    await 랜덤.click()
    await page.waitForTimeout(1500)
    const 닫기 = page.getByText('닫기', { exact: true }).first()
    if (await 닫기.count()) {
      await 닫기.click()
      await page.waitForTimeout(700)
      const 간곳 = await 켜진탭()
      잰다('㉢ 「닫기」로 닫아도 «자랑»에 남는다', true, 간곳 !== '홈')
      글('   └ 실제로 간 곳', 간곳)
    }
  }
}

// ─────────────────────────────────────────────────────────────
const 통과 = 칸.filter((c) => !c.글 && c.참 === c.실제).length
const 전체 = 칸.filter((c) => !c.글).length
console.log('\n🐛 재현 — 레꾸자랑에서 뒤로가면 홈으로 가나\n')
for (const c of 칸) {
  if (c.글) { console.log(`      ${c.이름}  =  ${c.실제}`); continue }
  console.log(`${c.참 === c.실제 ? '  ✅' : '  ⛔'} ${c.이름}  기대 ${c.참} · 실제 ${c.실제}`)
}
console.log(`\n  ${통과 === 전체 ? '✅' : '⛔'} ${통과}/${전체}\n`)

await b.close(); srv.close()
process.exit(통과 === 전체 ? 0 : 1)
