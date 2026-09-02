// 📋 **무료 배분 검수판 재료 찍기** — 2026-09-02 창업자 검수용 (규칙 13)
//
// 📮 창업자 = *"검수판 보여줘."*
//
// ⭐⭐ **흉내 판이 아니라 «진짜 앱»을 띄워 찍는다**(절대원칙 30) — FakeDate 로 그날로 속인다.
//    ⛔ 소스를 읽어 「이렇게 나올 것이다」로 그리지 않는다. 안내 글은 데이터에서 «만들어지는» 글이라
//       소스만 봐선 몇 종인지·무슨 제목인지 안 나온다.
//
// 🖨  ON=2026-09-01 TAG=후 node scripts/_shot-무료배분검수-0902.mjs
//     · `ON`  = 그날로 시계를 속인다(기본 2026-09-01)
//     · `TAG` = 파일 이름 꼬리(`전`/`후`) — 고치기 «전»과 «후»를 나란히 두려고
//
// 📸 찍는 것 셋
//    ① 새 소식 팝업        — 갈라 세기(꾸미기 N종 · 친구들 N종) ＋ 선물 칸 한 줄
//    ② 꾸미기 서랍 프레임 탭 — 🟠선물 알약이 «철 지난 것»에도 붙나
//    ③ 서랍 친구들 탭       — 「출시 축하」(계절 없는 선물)
//
// ⛔ 서랍으로 가는 길에서 두 번 틀렸다(규칙 18 ⓘ)
//    ⑴ 팝업의 「구경하기」는 **서랍이 아니라 소식 «페이지»**로 간다(`onOpenNews`)
//    ⑵ 「닫기」를 눌러 시트를 치우는 버릇 때문에 **방금 연 꾸미기 판을 도로 닫았다**
//    ✅ 그래서 레시피 → 상세 → 「레시피 꾸미기」로 가고, 거기선 «닫기를 안 누른다».
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const OUT = process.env.OUT || '/tmp/무료배분검수'
const 그날 = process.env.ON || '2026-09-01'
const 꼬리 = process.env.TAG || ''
const 방 = `${OUT}/${그날}${꼬리 ? `-${꼬리}` : ''}`
mkdirSync(방, { recursive: true })

const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const now = Date.now()
const state = { recipes: basicRecipes.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })), seedV: BASICS_VERSION }

const PORT = Number(process.env.PORT || 4431)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 900))

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 411, height: 891 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul', locale: 'ko-KR' })
await ctx.addInitScript({ content: SEED_COACH_SEEN })
await ctx.addInitScript(`{
  const D = new Date('${그날}T09:00:00+09:00').getTime()
  const O = Date
  class F extends O { constructor(...a){ return a.length ? new O(...a) : new O(D) } static now(){ return D } }
  Date = F
}`)
const p = await ctx.newPage()
const url = `http://127.0.0.1:${PORT}/`
const 씨 = async (팝업끄기) => {
  await p.goto(url)
  await p.evaluate(([s, off]) => {
    localStorage.setItem('hankki:v1', JSON.stringify(s))
    localStorage.setItem('hankki:onboarded', '1')
    // 🎁 「받은 선물」 시트가 «저절로» 뜨는 것만 막는다 — 안 막으면 서랍을 덮어서 알약을 못 본다.
    //    ⛔ 열쇠 이름을 짐작하지 말 것 — `nudges.js:154` 의 `K_GIFT` 를 그대로 쓴다(한 번 틀렸다).
    localStorage.setItem('hankki:nudge:giftpack', '1')
    if (off) localStorage.setItem('hankki:news:off', '1'); else localStorage.removeItem('hankki:news:off')
  }, [state, 팝업끄기])
  await p.goto(url)
  await p.waitForTimeout(1800)
}

// ① 새 소식 팝업
await 씨(false)
const 팝업 = p.locator('.sheet-mask, [role="dialog"]').first()
let 팝글 = ''
if (await 팝업.count()) {
  팝글 = (await 팝업.innerText()).trim()
  await p.screenshot({ path: `${방}/1-팝업.png` })
  console.log(`\n【① ${그날} 팝업】\n` + 팝글.split('\n').map((l) => '   ' + l).join('\n'))
} else {
  console.log(`\n⚠️ ${그날} — 팝업이 «안» 떴다`)
}

// ②③ 꾸미기 서랍 — ⛔여기선 「닫기」를 누르지 않는다(누르면 서랍이 닫힌다)
await 씨(true)
await p.getByText('레시피', { exact: true }).last().click().catch(() => {})
await p.waitForTimeout(1200)
await p.locator('.grid-card').first().click().catch(() => {})
await p.waitForTimeout(1400)
await p.getByText('레시피 꾸미기').first().click().catch(() => {})
await p.waitForTimeout(2200)

const 알약읽기 = () => p.evaluate(() => {
  const 택 = [...document.querySelectorAll('.decor-gift-tag')]
  return 택.map((el) => (el.closest('button')?.innerText || el.parentElement?.innerText || '').trim().replace(/\s+/g, ' '))
})
const 열린판 = await p.locator('.decor-sec').count()
console.log(`\n【② 꾸미기 서랍】 열렸나 = ${열린판 > 0 ? 'O' : '⛔X (아래 값은 아무것도 안 잰 것이다)'}`)
if (열린판 > 0) {
  for (const 탭 of ['프레임', '친구들']) {
    const t = p.getByText(탭, { exact: true })
    if (!(await t.count())) continue
    await t.last().click({ timeout: 4000 }).catch(() => {})
    await p.waitForTimeout(900)
    await p.screenshot({ path: `${방}/2-서랍-${탭}.png` })
    const 알약 = await 알약읽기()
    console.log(`   ${탭} 탭 — 🟠선물 알약 ${알약.length}개 ${알약.length ? JSON.stringify(알약) : ''}`)
    // 🌊 「출시기념 여름」은 굴려야 나온다 — 첫 화면만 찍으면 «알약이 붙었나»를 못 본다(규칙 18 ⓘ)
    if (탭 === '프레임') {
      const 여름 = p.getByText('출시기념 여름', { exact: false }).first()
      if (await 여름.count()) {
        await 여름.scrollIntoViewIfNeeded().catch(() => {})
        await p.waitForTimeout(700)
        await p.screenshot({ path: `${방}/3-서랍-여름.png` })
        const 붙었나 = await p.evaluate(() => {
          const el = [...document.querySelectorAll('button')].find((b) => /출시기념 여름/.test(b.innerText || ''))
          return el ? { 글: el.innerText.trim().replace(/\s+/g, ' '), 알약: !!el.querySelector('.decor-gift-tag') } : null
        })
        console.log(`   ↳ 「출시기념 여름」 줄 — ${붙었나 ? `알약 ${붙었나.알약 ? '🟠붙음' : '없음'} · 글 = ${붙었나.글}` : '⛔못 찾음'}`)
      }
    }
  }
}

console.log(`\n📸 ${방}`)
await b.close(); srv.kill(); process.exit(0)
