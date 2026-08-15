// 📸 우리집레시피 Ⓒ — 홈 실물 캡처 (규칙 21 · 보여주기 «전»에 내가 열어서 본다)
//
// ⛔⛔ 2026-08-11 에 이 자리에서 사고가 났다 — 시안 3장을 보냈는데 **전부 «온보딩 화면»** 이었다.
//    숫자는 «전부 초록불»이었다(박스 2개·y·폭·이름표·넘침 0). **가려진 것을 숫자는 모른다.**
//    → ①온보딩 끄기 ②코치마크 끄기 ③가운데를 덮은 게 있나 를 찍기 «전»에 본다.
//
// ⭐ ＋ 시계를 속여 «다음 주»도 열어본다 — 매주 2편이 진짜로 도는지는 그래야 보인다
//    (`_shot-공개검수-0901` 이 쓰는 방법 그대로 · 새로 발명하지 않는다).
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = 4196
const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT)], { stdio: 'ignore' })
await new Promise(r => setTimeout(r, 3500))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })

const 열기 = async (그날) => {
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul' })
  const p = await ctx.newPage()
  p.on('pageerror', e => console.log('⛔ pageerror', String(e).slice(0, 140)))
  await p.addInitScript((iso) => {
    localStorage.setItem('hankki:onboarded', '1')
    const o = Storage.prototype.getItem
    Storage.prototype.getItem = function (k) { return k.startsWith('hankki:coach:') ? '1' : o.call(this, k) }
    if (!iso) return
    // 🕰 시계 바꿔치기 — `from` 판정이 「그날」을 보게 한다
    const 진짜 = Date
    const 고정 = new 진짜(iso).getTime()
    // eslint-disable-next-line no-global-assign
    Date = class extends 진짜 {
      constructor(...a) { super(...(a.length ? a : [고정])) }
      static now() { return 고정 }
    }
  }, 그날)
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(900)
  return p
}

const 재기 = async (p) => p.evaluate(() => {
  const 박스 = [...document.querySelectorAll('.weekly-box')]
  const 덮개 = (() => { const el = document.elementFromPoint(206, 400); return el?.closest('.coach-overlay, .onboarding') ? '덮임' : null })()
  return {
    덮개,
    박스: 박스.map((x) => ({
      작은: x.querySelector('.weekly-kicker')?.textContent?.trim(),
      큰: x.querySelector('.weekly-title')?.textContent?.trim(),
      설명: x.querySelector('.weekly-why')?.textContent?.trim()?.slice(0, 28),
      편: [...x.querySelectorAll('.mini-card .name')].map((n) => n.textContent.trim()),
    })),
    가로넘침: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }
})

for (const [이름, 그날] of [['이번주', null], ['다음주', '2026-08-18T12:00:00+09:00'], ['3주뒤', '2026-08-25T12:00:00+09:00']]) {
  const p = await 열기(그날)
  const r = await 재기(p)
  console.log(`\n📅 ${이름}${그날 ? ` (${그날.slice(0, 10)})` : ''}${r.덮개 ? `  ⛔ ${r.덮개}` : ''}`)
  r.박스.forEach((x) => console.log(`   [${x.작은}] ${x.큰}  → ${x.편.join(' · ')}`))
  if (r.가로넘침) console.log('   ⛔ 가로로 넘친다')
  if (그날 === null) await p.screenshot({ path: '/tmp/우리집-홈.png', fullPage: false })
  await p.context().close()
}
console.log('\n📸 /tmp/우리집-홈.png')
await b.close(); srv.kill(); process.exit(0)
