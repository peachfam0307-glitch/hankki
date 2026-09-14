/**
 * 📸 픽커 분류판을 «내가 먼저 열어 본다» (2026-08-27)
 *
 * ⛔ 절대원칙 21 = **창업자에게 보여주기 «전»에 내가 실물을 열어서 본다.**
 *    숫자만 보고 보내면 안 된다 — 2026-08-11 에 시안 3장을 보냈는데 전부 «온보딩 화면»이었고
 *    그때도 숫자는 «전부 초록불»이었다. 가려진 것을 숫자는 모른다.
 *
 * ⭐ 여기서 재는 것 = **그림이 «진짜로» 떴나**(`naturalWidth > 0`).
 *    `src` 만 있고 안 뜨는 것을 가려낸다 — data URI 가 깨지면 이 값이 0 이 된다.
 *
 * 쓰기: node scripts/_shot-픽커판-0827.mjs
 */
import { chromium } from 'playwright'

const 판 = process.env.PAN || '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/픽커전수.html'
const OUT = process.env.OUT || '/tmp/판샷'
const { mkdirSync } = await import('node:fs')
mkdirSync(OUT, { recursive: true })

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const p = await b.newPage({ viewport: { width: 430, height: 1500 }, deviceScaleFactor: 2 })
await p.goto('file://' + 판)
await p.waitForTimeout(3000)

const r = await p.evaluate(() => {
  const im = [...document.querySelectorAll('img')]
  return {
    그림: im.length,
    뜬것: im.filter((i) => i.naturalWidth > 0).length,
    갈래: document.querySelectorAll('section').length,
    섞임: document.querySelectorAll('.c.bad').length,
    어제: document.querySelectorAll('.c.new').length,
    이름표없음: [...document.querySelectorAll('.c b')].filter((b) => b.textContent.includes('이름표 없음')).length,
  }
})
console.log(JSON.stringify(r, null, 1))
// ⛔⛔ 여기서 «내 도구가 거짓말을 했다» — 처음엔 안 뜬 것을 「data URI 가 깨졌다」고 찍었다.
//    진짜 이유는 `loading="lazy"` 다. 화면 밖 그림은 «아직 안 부른 것»이지 «깨진 것»이 아니다.
//    📌 규칙 18 — 「없다」의 «이유»를 내가 정하지 말 것. 처방이 정반대다(고치기 vs 스크롤하기).
//    ✅ 그래서 «다 굴려서» 다시 잰다 — 그러고도 안 뜨면 그건 진짜 깨진 것이다.
await p.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 800) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)) }
  window.scrollTo(0, 0)
})
await p.waitForTimeout(1500)
const 뒤 = await p.evaluate(() => [...document.querySelectorAll('img')].filter((i) => i.naturalWidth > 0).length)
console.log(`굴린 뒤 뜬 그림 ${뒤}/${r.그림}`)
if (뒤 !== r.그림) console.log(`⛔ 다 굴렸는데도 ${r.그림 - 뒤}개가 «안 뜬다» — 이건 진짜 깨진 것이다`)
else console.log('✅ 다 굴리니 전부 떴다 — 처음 숫자가 작았던 건 lazy 때문이다')

// ① 첫 화면
await p.screenshot({ path: `${OUT}/00-첫화면.png` })

// ② 「섞임」(도형 갈래에 사진) 자리
const bad = await p.locator('.c.bad').count()
if (bad) {
  await p.locator('.c.bad').first().scrollIntoViewIfNeeded()
  await p.waitForTimeout(500)
  await p.screenshot({ path: `${OUT}/01-섞임.png` })
}

// ③ 갈래마다 한 장 — 내가 훑을 판
const 갈래 = await p.locator('section').count()
for (let i = 0; i < 갈래; i++) {
  const s = p.locator('section').nth(i)
  const 이름 = (await s.getAttribute('data-g')) || String(i)
  await s.scrollIntoViewIfNeeded()
  await p.waitForTimeout(350)
  await s.screenshot({ path: `${OUT}/g${String(i + 1).padStart(2, '0')}-${이름.replace(/[·\/]/g, '_')}.png` })
}
console.log(`✅ ${OUT} 에 ${갈래 + 1 + (bad ? 1 : 0)}장`)
await b.close()
