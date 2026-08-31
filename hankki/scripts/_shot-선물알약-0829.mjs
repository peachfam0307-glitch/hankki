// 🎁🎨 **선물 알약을 오렌지로** — 창업자 2026-08-29 = *"알약색은 안바꿩?"*
//
// ⭐ **왜 이 판이 필요한가** — 색은 «화면에 칠해진 값»으로만 판정할 수 있다.
//    소스에 `var(--gift)` 라고 적혀 있어도 토큰이 없으면 **투명으로 떨어져 조용히 사라진다**.
//    그래서 소스를 안 보고 **`getComputedStyle` 로 진짜 칠해진 색**을 읽는다(절대원칙 30).
//
// ⭐⭐ **세 테마를 «다» 본다** — 색을 새로 박아 다크에서 글자가 죽은 사고가 있었다(v11.17).
//    ⛔ 한 테마에서 예쁘다고 통과시키지 않는다.
//
// 🕐 날짜를 9/1 로 속인다 — 「가을의 정원 세트」가 `from: '2026-09-01'` 이라 그날이라야 열린다.
//
// 🔒 **잣대 셋** ⑴알약이 오렌지로 칠해졌나(파랑이면 토큰이 안 걸린 것)
//    ⑵흰 글자 대비가 4.5 를 넘나 ⑶알약이 카드 바탕과 3.0 이상 벌어져 안 묻히나
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const 방 = `${OUT}/선물알약-0829`
mkdirSync(방, { recursive: true })
const 그날 = process.env.ON || '2026-09-01'

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const now = Date.now()
const state = { recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })), seedV: BASICS_VERSION }

const PORT = Number(process.env.PORT || 4372)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 900))
const url = `http://127.0.0.1:${PORT}/`

let fail = 0
const 칸 = (ok, 이름, 값) => { console.log(`  ${ok ? '✅' : '⛔'} ${이름}${값 ? ` — ${값}` : ''}`); if (!ok) fail++ }

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })

for (const 테마 of ['greige', 'apricot', 'dark']) {
  console.log(`\n🎨 [${테마}]`)
  const ctx = await browser.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
  await ctx.addInitScript({ content: SEED_COACH_SEEN })
  await ctx.addInitScript(`{
    const 그날 = new Date('${그날}T09:00:00+09:00').getTime()
    const OrigDate = Date
    class FakeDate extends OrigDate {
      constructor(...a) { return a.length ? new OrigDate(...a) : new OrigDate(그날) }
      static now() { return 그날 }
    }
    Date = FakeDate
  }`)
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e)))

  await page.goto(url)
  await page.evaluate(([s, t]) => {
    localStorage.setItem('hankki:v1', JSON.stringify(s))
    localStorage.setItem('hankki:onboarded', '1')
    localStorage.setItem('hankki-theme', t)
  }, [state, 테마])
  await page.goto(url)
  await page.waitForTimeout(1600)
  // 🧹 그날은 「한끼 소식」 팝업이 뜬다(정상). 읽지 않고 치우기만 — 이 판의 일이 아니다.
  for (let i = 0; i < 4; i++) {
    if (!(await page.locator('.sheet-mask').count())) break
    const 닫기 = page.getByRole('button', { name: /^(닫기|확인|나중에|취소)$/ })
    if (await 닫기.count()) await 닫기.first().click({ timeout: 4000 }).catch(() => {})
    else await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
  }
  칸((await page.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 테마, `테마가 ${테마} 로 걸렸다`)

  // 레시피 → 상세 → 꾸미기 판
  await page.getByText('레시피', { exact: true }).last().click()
  await page.waitForTimeout(900)
  await page.locator('.grid-card button').first().click()
  await page.waitForTimeout(1000)
  await page.getByText('레시피 꾸미기').first().click()
  await page.waitForTimeout(1500)
  for (let i = 0; i < 3; i++) {
    if (!(await page.locator('.sheet-mask').count())) break
    const 닫기 = page.getByRole('button', { name: /^(닫기|확인|나중에|취소)$/ })
    if (await 닫기.count()) await 닫기.first().click({ timeout: 4000 }).catch(() => {})
    else await page.locator('.sheet-mask').first().click({ position: { x: 8, y: 8 }, timeout: 4000 }).catch(() => {})
    await page.waitForTimeout(500)
  }
  칸((await page.locator('.decor-editor').count()) > 0, '꾸미기 판이 열렸다')

  await page.locator('.decor-cats button', { hasText: /^프레임$/ }).first().click()
  await page.waitForTimeout(700)

  // 📏 화면에 «칠해진» 값을 읽는다 — 소스가 아니라 결과다
  const 잰것 = await page.evaluate(() => {
    const 토큰 = getComputedStyle(document.documentElement).getPropertyValue('--gift').trim()
    const 숫자 = (s) => (String(s).match(/[\d.]+/g) || []).map(Number)
    const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
    const L = (rgb) => { const [r, g, b] = 숫자(rgb).slice(0, 3).map((v) => lin(v / 255)); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
    const CR = (a, b) => { const l1 = L(a), l2 = L(b); const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]; return (hi + 0.05) / (lo + 0.05) }
    // 알약 «뒤에» 실제로 깔린 색 — 투명한 조상은 건너뛴다(그라데는 backgroundColor 가 투명이라 부모를 읽게 된다)
    const 뒷색 = (el) => {
      for (let p = el.parentElement; p; p = p.parentElement) {
        const s = getComputedStyle(p)
        if (s.backgroundImage && s.backgroundImage !== 'none') return null // 그라데 위 = 숫자로 못 잰다
        const a = 숫자(s.backgroundColor)
        if (a.length < 4 || a[3] > 0.9) return s.backgroundColor
      }
      return getComputedStyle(document.body).backgroundColor
    }
    const 택들 = [...document.querySelectorAll('.decor-sec .decor-gift-tag')].map((t) => {
      const s = getComputedStyle(t)
      const 뒤 = 뒷색(t)
      const 이름 = t.closest('.decor-sec')?.querySelector('.decor-sec-label')?.cloneNode(true)
      이름?.querySelectorAll('.decor-gift-tag, .decor-sec-n').forEach((x) => x.remove())
      return {
        그룹: 이름?.textContent.trim() || '?',
        글자: t.textContent.trim(),
        배경: s.backgroundColor,
        글자색: s.color,
        글자대비: +CR(s.backgroundColor, s.color).toFixed(2),
        뒤, 뒤대비: 뒤 ? +CR(s.backgroundColor, 뒤).toFixed(2) : null,
      }
    })
    const 안내 = [...document.querySelectorAll('.decor-sec-hint')].map((h) => h.textContent.trim())
    return { 토큰, 택들, 안내 }
  })

  console.log(`     --gift = ${잰것.토큰 || '(없다!)'}`)
  칸(!!잰것.토큰, '`--gift` 토큰이 이 테마에서 값을 갖는다', 잰것.토큰)
  칸(잰것.택들.length > 0, '프레임 탭에 선물 택이 있다', `${잰것.택들.length}개`)
  for (const t of 잰것.택들) {
    console.log(`     🎁 「${t.그룹}」 택「${t.글자}」 배경 ${t.배경} · 뒤 ${t.뒤} `)
    // ⑴ 오렌지인가 = 빨강이 파랑보다 확실히 크다. ⛔더스티 블루(#5878a0)는 파랑이 제일 크다
    const [r, g, b] = (t.배경.match(/[\d.]+/g) || []).map(Number)
    칸(r > b + 60, `「${t.그룹}」 알약이 오렌지다(파랑 아님)`, `R${r} G${g} B${b}`)
    칸(t.글자대비 >= 4.5, `「${t.그룹}」 흰 글자 대비 4.5↑`, `${t.글자대비}`)
    if (t.뒤대비 != null) 칸(t.뒤대비 >= 3.0, `「${t.그룹}」 알약이 바탕에 안 묻힌다(3.0↑)`, `${t.뒤대비}`)
  }
  console.log(`     💬 한 줄 안내 = ${잰것.안내.join(' ／ ') || '(없다)'}`)
  칸(잰것.안내.some((h) => h.includes('직접 찍은 음식 사진을 접시에 담아보세요')), '안내 문구가 창업자 문구다')

  // 📸 창업자가 눈으로 볼 것 — 선물 택이 붙은 자리를 크게
  await page.screenshot({ path: `${방}/${테마}-프레임탭.png` })
  const 첫택 = page.locator('.decor-sec').filter({ hasText: '가을의 정원 세트' }).first()
  if (await 첫택.count()) await 첫택.screenshot({ path: `${방}/${테마}-가을의정원세트.png` }).catch(() => {})

  칸(errs.length === 0, 'pageerror 0', String(errs.length))
  await ctx.close()
}

console.log(`\n${fail ? `⛔ ${fail}칸 실패` : '✅ 전부 통과'}  ·  판 = ${방}`)
await browser.close()
srv.kill()
process.exit(fail ? 1 : 0)
