// 📔 샘플 일기 실물 캡처 (2026-08-13 · #88)
//   ⭐ 규칙 21 — **창업자에게 보여주기 «전»에 내가 열어서 본다.** 숫자만 보고 보내지 않는다.
//      (2026-08-11 에 「우리집레시피 시안」 3장을 보냈는데 셋 다 온보딩 화면이었다. 숫자는 전부 초록불이었다)
//   ⛔ 온보딩·코치가 화면을 덮으면 아무것도 안 보인다 → 미리 끈다.
//   ⛔ 저장소를 «비운 채» 열어야 샘플이 놓인다(일기가 한 장이라도 있으면 안 놓는 게 설계다).
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const srv = spawn('python3', ['-m', 'http.server', '4191', '-d', 'dist'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 900))

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const pg = await b.newPage({ viewport: { width: 411, height: 891 }, timezoneId: 'Asia/Seoul' })
const 오류 = []
pg.on('pageerror', (e) => 오류.push(e.message))

await pg.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1')
  for (const k of ['home3', 'detail', 'shop', 'profile', 'myrecipes', 'brag', 'diary'])
    localStorage.setItem(`hankki:coach:${k}`, '1')
  localStorage.setItem('hankki:giftSeen', '1')
})
await pg.goto('http://localhost:4191/', { waitUntil: 'networkidle' })

// 📔 일기 탭으로
await pg.getByRole('button', { name: /일기/ }).first().click()
await pg.waitForTimeout(900)
await pg.screenshot({ path: 'scripts/_shot-샘플일기-①목록.png' })

// 샘플 한 장을 연다 — 달력 밑 목록의 첫 칸
const 칸 = pg.locator('.grid-card, .cal-diary, .mini-card').first()
if (await 칸.count()) { await 칸.click().catch(() => {}); await pg.waitForTimeout(1200) }
await pg.screenshot({ path: 'scripts/_shot-샘플일기-②펼침.png' })

// 🔢 화면에 «실제로» 그려진 것을 센다 — 「있다」와 「보인다」는 다른 말이다
const 잰값 = await pg.evaluate(() => {
  // ⛔⛔ 첫 판이 「제목 없음·본문 없음·스티커 0」을 뱉었는데 **앱은 멀쩡했다**(캡처를 열어 보고 알았다).
  //   ⑴ 제목·본문은 `<textarea>` 의 **value** 라 `innerText` 에 «안 잡힌다»
  //   ⑵ 스티커는 `.decor-layer img` 가 아니라 종이 안 `img` 전체로 세야 한다
  //   📌 규칙 18 — 「없다」가 아니라 «내가 보는 것»이 틀렸다. 규칙 21 이 없었으면 「안 나온다」고 보고할 뻔했다.
  // ⚠️ 제목은 `<input>`, 본문은 `<textarea>` 다 — 둘 다 봐야 한다(하나만 보고 「제목이 없다」고 두 번 나왔다).
  const 글칸 = [...document.querySelectorAll('textarea, input')].map((t) => t.value).join('\n')
  const 글 = document.body.innerText
  const 종이 = document.querySelector('.paper, .paper-box, .decor-stage')
  const r = 종이?.getBoundingClientRect()
  const 그림 = [...(종이?.querySelectorAll('img') || [])]
  return {
    제목있나: 글칸.includes('방학언제끝나냐'),
    본문있나: 글칸.includes('불고기있으면'),
    포스트잇: 글칸.includes('돌밥돌밥') || 글.includes('돌밥돌밥'),
    샘플표시: 글.includes('샘플'),
    사진: 그림.filter((i) => /diary-bulgogi/.test(i.src)).map((i) => `${i.naturalWidth}×${i.naturalHeight}`),
    종이안그림: 그림.length,          // 사진 1 ＋ 스티커 5 ＋ 포스트잇 바탕 1 = 7 쯤
    깨진그림: [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0).length,
    종이: r ? `${Math.round(r.width)}×${Math.round(r.height)}` : '못 찾음',
  }
})
console.log(JSON.stringify(잰값, null, 1))
console.log('pageerror:', 오류.length, 오류.slice(0, 3))

await b.close(); srv.kill()
process.exit(0)
