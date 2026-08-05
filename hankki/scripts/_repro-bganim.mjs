// 🔬 「진짜로 움직이나」를 재는 자 — 창업자 *"있잖아 하나도 안움직여"* (2026-08-05)
//
// ⭐⭐ 왜 만들었나
//   배경 연출 20종을 만들어 보여줬는데 창업자가 «하나도 안 움직인다» 고 했다.
//   ⛔ **눈으로는 「안 움직인다」와 「너무 옅어서 못 알아본다」가 구별이 안 된다.**
//   그래서 잰다 — ⒜애니메이션이 붙었나 ⒝실제로 «픽셀이 바뀌나».
//
// 📌 그날 나온 답 = **애니메이션은 돌고 있었다.** 주기 7~20초·불투명도 0.05~0.34 라
//   1.4초 봐서는 아무 일도 안 일어나 보였다. → 판정 판은 **3배 세게** 만들어야 한다.
//   ⚠️ 같은 실수 전례 = v9.16 빙글·두리번 (*"안보여서 못봤어"*).
//   **가끔만/옅게만 움직이는 것은 「안 움직이는 것」과 구별되지 않는다.**
//
// 쓰는 법
//   SMOKE_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
//     node scripts/_repro-bganim.mjs <html파일> [카드셀렉터]
//
// ⚠️ 「animation-name 이 none」이 몇 개 나오는 건 정상일 수 있다 —
//    `::before`/`::after` 가 대신 움직이는 효과(구름빛·노을)는 부모에 애니메이션이 없다.
//    그래서 ⒝(픽셀 비교)가 진짜 판정이다.

import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const file = process.argv[2]
const sel = process.argv[3] || '.cover'
if (!file) {
  console.error('쓰는 법: node scripts/_repro-bganim.mjs <html파일> [카드셀렉터]')
  process.exit(1)
}

const html = readFileSync(file, 'utf8')
const browser = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const page = await browser.newPage()
const errs = []
page.on('pageerror', (e) => errs.push(String(e)))

await page.setContent(`<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`)
await page.waitForTimeout(400)

// ⒜ 애니메이션이 실제로 붙었나
const info = await page.evaluate(() => {
  const out = []
  document.querySelectorAll('.fx').forEach((el, i) => {
    const cs = getComputedStyle(el)
    out.push({ i, cls: el.className, name: cs.animationName, dur: cs.animationDuration, play: cs.animationPlayState })
  })
  return out
})
console.log('효과 레이어', info.length, '개')
const none = info.filter((x) => x.name === 'none')
console.log('animation-name 이 none:', none.length, none.length ? '(::before/::after 로 움직이는 것일 수 있다)' : '')
const slow = info.filter((x) => parseFloat(x.dur) > 8)
if (slow.length) console.log('⚠️ 주기 8초 초과', slow.length, '개 — 판정 판에선 못 알아본다:', slow.map((x) => x.cls.replace('fx ', '')).join(' '))
console.log(info.slice(0, 4).map((x) => `  ${x.cls} → ${x.name} / ${x.dur} / ${x.play}`).join('\n'))

// ⒝ ⭐ 진짜 판정 — 같은 칸을 1.4초 간격으로 두 번 찍어 픽셀을 센다
const el = await page.$(sel)
if (!el) { console.error(`⛔ ${sel} 를 못 찾았다`); await browser.close(); process.exit(1) }
const a = await el.screenshot()
await page.waitForTimeout(1400)
const b = await el.screenshot()
let diff = 0
for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) diff++
console.log(`${sel} 1.4초 차이:`, diff, 'byte', diff > 200 ? '→ ✅ 움직인다' : '→ ⛔ 안 움직인다')
console.log('pageerror', errs.length, errs.slice(0, 2).join(' | '))

await browser.close()
process.exit(diff > 200 && errs.length === 0 ? 0 : 1)
