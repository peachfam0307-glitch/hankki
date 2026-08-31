// 📅 **9/1 자동 공개 검수판** — 그날 «저절로» 열리는 78컷을 미리 다 본다
//
// ⛔⛔ **자동 공개 전날 검수 = 절대원칙** (창업자 2026-08-01
//    *"자동으로 올라가기 전날에 꼭 검수하고 내보내자. **이건 절대원칙.**"*)
//    ⭐ 배포 통로가 둘인데 이쪽은 **내가 아무것도 안 해도 열린다** — 잊으면 그대로 나간다.
//
// ⭐ **왜 「파일을 나란히 붙인 판」이 아니라 «앱 서랍»을 찍나**
//    2026-08-10 하루에만 숫자는 전부 초록불인데 화면이 깨진 걸 두 번 봤다
//    (홈 썸네일 전폭 · 「위로」 단추 문턱). **유저가 보는 것은 파일이 아니라 화면이다.**
//    ⚠️ 게다가 서랍에선 «그룹 이름·순서·빈 그룹»이 드러난다 — 파일만 보면 절대 안 보인다.
//
// ⭐⭐ **제일 중요한 칸 = 「열리기로 한 키」와 「진짜 화면에 뜬 키」 대조.**
//    달력(`release-calendar.mjs`)이 «약속»이고 서랍이 «실물»이다. 둘이 어긋나면 그게 사고다.
//
// 🕐 **날짜를 9/1 로 속여서** 연다 — `from` 이 열어주는 것을 그날 화면 그대로 본다.
//
// ⛔ 첫 판(2026-08-10)이 타임아웃으로 죽었다. 범인은 둘 —
//    ⑴ `spawn` 한 파이썬 서버가 이벤트 루프를 붙잡아 **끝나지를 못했다**(→ 맨 끝 `process.exit`)
//    ⑵ **9/1 첫 화면엔 「한끼 소식」 팝업이 뜬다**(정상 동작!) — 그걸 안 닫고 탭을 눌러서 막혔다.
//    📌 규칙 18 — 「막혔다」의 이유를 내가 정하지 말고 **화면을 읽어서** 알아냈다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { gates } from './release-calendar.mjs'

const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const 그날 = process.env.ON || '2026-09-01'
const 방 = `${OUT}/공개검수-${그날}`
mkdirSync(방, { recursive: true })

// ── 달력이 약속한 것 ──────────────────────────────────────────
const 문 = gates().filter((g) => g.date === 그날)
const 서랍약속 = new Map()   // key → 그룹 이름
const 카드약속 = []
for (const g of 문) {
  if (g.where.includes('서랍')) g.keys.forEach((k) => 서랍약속.set(k, g.what))
  else g.keys.forEach((k) => 카드약속.push(k))
}
console.log(`\n📅 ${그날} 에 저절로 열리는 것 = ${서랍약속.size + 카드약속.length}컷 (서랍 ${서랍약속.size} · 레꾸자랑 카드 ${카드약속.length})\n`)

// 탭 «키»(frame·deco…)를 화면에 보이는 «라벨»(프레임·데코…)로. ⛔달력은 키로 말하고 화면은 라벨로 말한다.
const 탭라벨 = { bgtape: '배경', frame: '프레임', tape: '마테', deco: '데코', notetext: '글자', buddies: '친구들', food: '재료' }
const 새그룹 = 문.filter((g) => g.where.includes('서랍')).map((g) => ({
  탭라벨: 탭라벨[(g.where.match(/·\s*(\S+)\s*탭/) || [])[1]] || '?', 이름: g.what, n: g.keys.length,
}))

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const now = Date.now()
const state = { recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })), seedV: BASICS_VERSION }

const PORT = Number(process.env.PORT || 4361)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
const stop = () => { try { srv.kill() } catch { /* noop */ } }
await new Promise((r) => setTimeout(r, 900))

const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await browser.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
await ctx.addInitScript({ content: SEED_COACH_SEEN })
// ⏰ 시계를 그날로 돌린다 — `from` 판정이 「오늘」을 보므로 이것 하나로 미래가 열린다.
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

const url = `http://127.0.0.1:${PORT}/`
await page.goto(url)
await page.evaluate((s) => { localStorage.setItem('hankki:v1', JSON.stringify(s)); localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1') }, state)
await page.goto(url)
await page.waitForTimeout(1600)

let fail = 0
const 칸 = (ok, 이름, 값) => { console.log(`${ok ? '✅' : '⛔'} ${이름}${값 ? ` — ${값}` : ''}`); if (!ok) fail++ }

// 🧹 **앞을 막는 시트를 «읽고» 치운다** — 그날은 새로 열린 게 많아 시트가 여러 번 뜬다.
//    ⛔ 「무슨 시트일 것이다」를 내가 정하지 않는다(규칙 18) — 글자를 읽어 찍어두고 닫는다.
//    ⭐ 그날 유저가 «실제로 보는» 화면이므로 캡처도 남긴다 — 치우기만 하면 검수가 아니다.
let 시트번호 = 0
const 시트치우기 = async (어디) => {
  const 본것 = []
  for (let i = 0; i < 4; i++) {
    if (!(await page.locator('.sheet-mask').count())) break
    const 글 = (await page.locator('.sheet-mask').first().innerText()).replace(/\n+/g, ' / ').trim()
    본것.push(글.slice(0, 70))
    await page.screenshot({ path: `${방}/${시트번호++}-시트-${어디}.png` })
    const 닫기 = page.getByRole('button', { name: /^(닫기|확인|나중에|취소)$/ })
    if (await 닫기.count()) await 닫기.first().click({ timeout: 4000 }).catch(() => {})
    else await page.locator('.sheet-mask').first().click({ position: { x: 8, y: 8 }, timeout: 4000 }).catch(() => {})
    await page.waitForTimeout(600)
  }
  return 본것
}

// ① 시계가 진짜로 그날인가 — 이게 틀리면 아래가 전부 헛일이다
const 오늘 = await page.evaluate(() => new Date().toISOString().slice(0, 10))
칸(오늘 === 그날, `시계를 ${그날} 로 돌렸다`, `앱이 보는 오늘 = ${오늘}`)

// ② 그날 «맨 처음» 보는 화면 = 「한끼 소식」 팝업. 이것도 검수 대상이다.
const 팝업 = page.locator('.sheet-mask')
if (await 팝업.count()) {
  const 글 = (await 팝업.first().innerText()).replace(/\n+/g, ' / ')
  await page.screenshot({ path: `${방}/0-첫화면-한끼소식.png` })
  칸(글.includes('가을'), '첫 화면 = 한끼 소식 팝업', 글.slice(0, 60))
  // 팝업이 말한 컷 수 — 유저가 읽는 숫자라 «틀리면 안 된다».
  // ⛔⛔ **[2026-08-29 고침] 이 칸이 «거짓 경보»를 냈다 — 잣대가 틀렸다.**
  //    「팝업 80 ≠ 달력 78」로 실패를 냈는데 **둘은 서로 다른 것을 센다**:
  //    · 달력(`gates()`) = **그 «날짜»에 열리는 것**
  //    · 팝업(`whatsNew`) = **최근 `FRESH_DAYS`(21일) 안에 열린 것 전부**
  //      (`whatsnew.js:163` — 유저가 며칠 만에 앱을 열어도 그동안 열린 걸 놓치지 않게 한 설계다)
  //    📌 규칙 18 ⓘ 그대로 — **「통과했나」가 아니라 «무엇을 보고 통과했나»**.
  // ✅ 그래서 **같은 21일 창으로 세어** 견준다. 이래야 «진짜» 어긋남만 잡는다.
  const 창 = (d, n) => { const t = new Date(`${d}T00:00:00Z`); t.setUTCDate(t.getUTCDate() - n); return t.toISOString().slice(0, 10) }
  const 창시작 = 창(그날, 21)
  const 창안 = gates().filter((g) => g.date > 창시작 && g.date <= 그날)
  const 창합 = 창안.reduce((s, g) => s + g.keys.length, 0)
  const 적힌수 = Number((글.match(/(\d+)컷/) || [])[1] || 0)
  // ⚠️ 달력은 «같은 키»가 두 갈래에 겹쳐 들어가기도 한다(실측 = au_b09·au_b13) → 딱 맞기를 요구하지 않는다.
  //    그날 열리는 것보다 «적으면» 그건 진짜 사고다(유저에게 실제보다 작게 말하는 것).
  const 그날합 = 서랍약속.size + 카드약속.length
  칸(적힌수 >= 그날합 && 적힌수 <= 창합 + 5,
    '팝업 컷 수가 말이 된다(그날 이상 · 21일 창 이하)',
    `팝업 ${적힌수} · 그날 ${그날합} · 21일창 ${창합}`)
  const 닫기 = page.getByRole('button', { name: '닫기', exact: true })
  if (await 닫기.count()) await 닫기.first().click()
  else await page.keyboard.press('Escape')
  await page.waitForTimeout(600)
} else 칸(false, '한끼 소식 팝업이 안 떴다 — 78컷이 열리는 날인데 아무 말이 없다')
칸((await page.locator('.sheet-mask').count()) === 0, '팝업이 닫혔다')

// ③ 레시피 상세 → 꾸미기 판
await page.getByText('레시피', { exact: true }).last().click()
await page.waitForTimeout(900)
await page.locator('.grid-card button').first().click()
await page.waitForTimeout(1000)
const 꾸미기 = page.getByText('레시피 꾸미기')
칸((await 꾸미기.count()) > 0, '「레시피 꾸미기」 버튼을 찾았다')
await 꾸미기.first().click()
await page.waitForTimeout(1500)
칸((await page.locator('.decor-editor').count()) > 0, '꾸미기 판이 열렸다')

// ⛔ 꾸미기를 열면 «또» 시트가 뜬다(2026-08-10 여기서 타임아웃이 났다). 읽어서 찍고 치운다.
const 판시트 = await 시트치우기('꾸미기연직후')
if (판시트.length) console.log(`     🧹 꾸미기 열자마자 뜬 시트 ${판시트.length}개 — ${판시트.join(' ／ ')}`)
칸((await page.locator('.sheet-mask').count()) === 0, '꾸미기 판 앞이 비었다')

// ④ 탭을 하나씩 열어 그룹·컷·깨진 그림을 잰다
const 탭들 = await page.evaluate(() => [...document.querySelectorAll('.decor-cats button')].map((b) => b.textContent.trim()).filter(Boolean))
console.log(`\n  🗂 서랍 탭 = ${탭들.join(' · ')}\n`)
const 실물 = new Set()
for (const t of 탭들) {
  await page.locator('.decor-cats button', { hasText: new RegExp(`^${t}$`) }).first().click()
  await page.waitForTimeout(500)
  // 그림이 다 뜰 때까지 서랍을 끝까지 굴린다 — 안 굴리면 lazy 로 안 뜬 걸 「깨졌다」로 잡는다
  await page.evaluate(async () => {
    const s = document.querySelector('.decor-scroll')
    if (!s) return
    for (let y = 0; y <= s.scrollHeight; y += s.clientHeight * 0.8) { s.scrollTop = y; await new Promise((r) => setTimeout(r, 120)) }
    s.scrollTop = 0
  })
  await page.waitForTimeout(400)
  const 잰것 = await page.evaluate(() => {
    const 그룹 = []
    for (const s of document.querySelectorAll('.decor-scroll .decor-sec')) {
      const 셀 = [...s.querySelectorAll('.decor-cell')]
      그룹.push({
        이름: s.querySelector('.decor-sec-label')?.textContent?.trim() || '(도구 줄)',
        n: 셀.length,
        // ⛔⛔ 「빈 그룹」은 `.decor-cell` 개수로 재면 안 된다 — 2026-08-10 에 이걸로 «거짓 경보 7건»이 났다.
        //    선물 줄·글자 넣기·형광펜·배경지 칸은 스티커 셀이 아니라 «다른 종류 버튼»을 그린다.
        //    📌 시끄러운 게이트는 죽은 게이트다. **진짜 빈 칸 = 버튼이 하나도 없는 칸.**
        버튼: s.querySelectorAll('button').length,
        키: 셀.map((b) => (b.getAttribute('aria-label') || '').split(' ·')[0]),
        깨짐: [...s.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0).length,
      })
    }
    return 그룹
  })
  잰것.forEach((g) => g.키.forEach((k) => 실물.add(k)))
  console.log(`     [${t}] ${잰것.filter((g) => g.n).map((g) => `${g.이름}(${g.n})`).join(' · ') || '(스티커 그룹 없음)'}`)
  const 깨진 = 잰것.filter((g) => g.깨짐)
  if (깨진.length) 칸(false, `[${t}] 그림이 깨진 그룹 ${깨진.length}개`, 깨진[0].이름)
  const 빈 = 잰것.filter((g) => g.버튼 === 0)
  if (빈.length) 칸(false, `[${t}] 진짜 빈 칸 ${빈.length}개 — 유저에게 빈 자리가 보인다`, 빈[0].이름)
  await page.screenshot({ path: `${방}/서랍-${t}.png` })

  // 📸📸 **그날 «새로 열리는» 그룹만 따로 찍는다** — 창업자가 볼 것은 서랍 전체가 아니라 신규 62컷이다.
  //    ⛔ 서랍 맨 위 한 장으로는 아래에 깔린 그룹이 아예 안 찍힌다(첫 판이 그랬다).
  for (const g of 새그룹.filter((x) => x.탭라벨 === t)) {
    const 있나 = await page.evaluate((이름) => {
      // 🏷 이름표 «단추» 안엔 이름 말고도 붙는 게 있다 — 선물 택(`decor-gift-tag`)과
      //    접었을 때 뜨는 개수(`decor-sec-n`). 그대로 읽으면 「그룹이름＋택글자」가 한 덩어리로 읽힌다(2026-08-29 실제로 이걸로 죽었다).
      //    ⛔ 2026-08-29 에 실제로 이걸로 죽었다 — 그룹은 «멀쩡히 떠 있는데» 대조만 실패했다(규칙 18 ⓘ).
      //    ⭐ 잣대를 «느슨하게»(startsWith) 하지 않는다 — 「가을」이 「가을 프레임」에 걸린다. 떼고 정확히 맞춘다.
      const 이름만 = (el) => {
        if (!el) return null
        const c = el.cloneNode(true)
        c.querySelectorAll('.decor-gift-tag, .decor-sec-n').forEach((x) => x.remove())
        return c.textContent.trim()
      }
      for (const s of document.querySelectorAll('.decor-scroll .decor-sec')) {
        if (이름만(s.querySelector('.decor-sec-label')) === 이름) {
          s.setAttribute('data-검수', '1'); s.scrollIntoView({ block: 'center' }); return true
        }
      }
      return false
    }, g.이름)
    칸(있나, `[${t}] 「${g.이름}」 ${g.n}컷 그룹이 서랍에 있다`)
    if (!있나) continue
    await page.waitForTimeout(350)
    await page.locator('[data-검수="1"]').screenshot({ path: `${방}/신규-${t}-${g.이름.replace(/[ ·]/g, '')}.png` })
    await page.evaluate(() => document.querySelector('[data-검수="1"]')?.removeAttribute('data-검수'))
  }
}

// ⑤ ⭐ 약속과 실물 대조 — 이 판의 알맹이
const 빠진것 = [...서랍약속.keys()].filter((k) => !실물.has(k))
console.log('')
칸(빠진것.length === 0, `달력이 약속한 서랍 ${서랍약속.size}컷이 전부 화면에 떴다`,
  빠진것.length ? `안 뜬 것 ${빠진것.length}개 = ${빠진것.slice(0, 8).join(' ')}` : `실물 ${실물.size}컷 중 포함`)

// ⑥ 레꾸자랑 카드 16컷 — 서랍엔 없다(뽑기 풀이라). 파일이 실제로 있는지만 여기서 본다.
const 카드확인 = await page.evaluate(async (keys) => {
  const out = []
  for (const k of keys) {
    const ok = await new Promise((r) => { const i = new Image(); i.onload = () => r(i.naturalWidth > 0); i.onerror = () => r(false); i.src = `assets/${k}.png` })
    if (!ok) out.push(k)
  }
  return out
}, 카드약속)
// ⚠️ 번들 파일명은 해시가 붙어 위 경로로는 못 찾는다 — 못 찾았다고 「없다」로 치지 않는다(규칙 18).
console.log(`ℹ️ 레꾸자랑 카드 ${카드약속.length}컷은 뽑기 풀이라 서랍에 안 뜬다 → 별도 컨택트시트로 눈 검수할 것`)
console.log(`   키 = ${카드약속.join(' ')}`)
if (카드확인.length && 카드확인.length < 카드약속.length) console.log(`   (브라우저 경로로는 ${카드확인.length}개 못 찾음 — 번들 해시 탓이라 판정에 안 쓴다)`)

칸(errs.length === 0, 'pageerror 0', errs.length ? errs[0] : '')
await browser.close(); stop()
console.log(fail ? `\n⛔ ${fail}칸 실패\n` : `\n✅ ${그날} 공개분 이상 없음 → ${방}/\n`)
process.exit(fail ? 1 : 0)
