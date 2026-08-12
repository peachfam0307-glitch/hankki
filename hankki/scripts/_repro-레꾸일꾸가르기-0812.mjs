// 🔬 레꾸 ↔ 일꾸 가르기 재현 (2026-08-12)
//   창업자 *"맛평가부터 … 건강태그까지는 일꾸로 보내는데 좋을 것 같아"* ·
//          *"레꾸 그 자리를 오늘뽑은 꼬르곰이 채워주면 좋을 것 같아"* ·
//          *"일꾸에 탭을 하나 만들어서 거기에 다 넣자"*
//
// ⛔ 「그룹 개수」로만 재면 안 된다 — v10.22 에 숫자는 전부 초록불인데 화면이 깨져 있었다.
//    여기선 **화면에 실제로 그려진 라벨과 칸**을 센다.
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const 셈 = { ok: 0, ng: 0 }
const 봄 = (조건, 말) => { console.log(`   ${조건 ? '✅' : '⛔'} ${말}`); 조건 ? 셈.ok++ : 셈.ng++ }

const srv = spawn('python3', ['-m', 'http.server', '4177', '-d', 'dist'], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 900))

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const pg = await b.newPage({ viewport: { width: 411, height: 891 }, timezoneId: 'Asia/Seoul' })
pg.on('pageerror', (e) => { console.log('   ⛔ pageerror', e.message); 셈.ng++ })

// ⚠️ 온보딩·코치가 화면을 덮으면 아무것도 못 누른다(2026-08-11에 세 번 헛돌았다)
await pg.addInitScript(() => {
  localStorage.setItem('hankki:onboarded', '1')
  for (const k of ['home3', 'detail', 'shop', 'profile', 'myrecipes', 'brag', 'diary'])
    localStorage.setItem(`hankki:coach:${k}`, '1')
  localStorage.setItem('hankki:giftSeen', '1')
})
await pg.goto('http://localhost:4177/', { waitUntil: 'networkidle' })

// ⛔⛔ 셀렉터는 «짐작하지 말고 실물에서» 가져왔다 (2026-08-12 · 규칙 18).
//   `.segment`·`.decor-tabs`·`.decor-layer` 는 **이 앱에 없는 이름**이었다 —
//   그걸로 재니 「탭 0개」·「붙인 스티커 못 찾음」이 나왔다. 앱은 멀쩡했고 내 잣대가 틀렸다.
//   진짜 = 탭은 `.decor-drawer` 안 button 앞머리 · 붙인 것은 `.decor-stage img`.
const 탭이름 = ['배경', '프레임', '마테', '데코', '글자', '기록', '친구들', '재료']
const 서랍읽기 = async () => await pg.evaluate((탭이름) => {
  const 탭 = [...document.querySelectorAll('.decor-drawer button')]
    .map((e) => e.textContent.trim()).filter((t) => 탭이름.includes(t))
  const 그룹 = [...document.querySelectorAll('.decor-sec')].map((s) => ({
    라벨: (s.querySelector('.decor-sec-label, .t-sub, b')?.textContent || '').trim(),
    칸: s.querySelectorAll('.decor-cell').length,
  })).filter((g) => g.칸 > 0)
  return { 탭, 그룹, 총칸: 그룹.reduce((a, g) => a + g.칸, 0) }
}, 탭이름)

// ══ ① 레꾸(레시피 표지 꾸미기) ══
console.log('\n① 레꾸 — 레시피 표지 꾸미기')
await pg.locator('.grid-card').first().click()
await pg.waitForTimeout(500)
await pg.getByRole('button', { name: /꾸미기/ }).first().click()
await pg.waitForTimeout(900)
// 🎁 서랍을 처음 열면 «출시기념 팩 안내»(`.sheet-mask`)가 먼저 뜬다 — 안 닫으면 탭 클릭을 통째로 먹는다.
//   ⛔⛔ CLAUDE.md 에 적혀 있는 함정인데 2026-08-12 에 «또» 밟았다(그 전에도 두 번).
//      `smoke.mjs` 151줄과 «같은 방식»으로 닫는다 — 유저와 같은 순서다.
await pg.getByRole('button', { name: '나중에' }).first().click({ timeout: 2500 }).catch(() => {})
await pg.waitForTimeout(400)
await pg.getByRole('button', { name: '글자', exact: true }).click()
await pg.waitForTimeout(400)
const 레꾸 = await 서랍읽기()
console.log('   탭:', 레꾸.탭.join(' · '))
console.log('   글자 탭 그룹:', 레꾸.그룹.map((g) => `${g.라벨}(${g.칸})`).join(' · '))
봄(!레꾸.탭.includes('기록'), '레꾸엔 「기록」 탭이 없다')
봄(!레꾸.그룹.some((g) => ['맛 평가', '반응 평가', '조리법', '요리 상황', '식사 상황', '미리 준비', '보관', '건강 태그'].includes(g.라벨)),
   '레꾸 글자 탭에서 옛 99컷 8그룹이 빠졌다')
봄(레꾸.그룹.some((g) => g.라벨 === '반응 · 별점' && g.칸 === 16), '레꾸에 「반응 · 별점」 16컷이 있다')
봄(레꾸.그룹.some((g) => g.라벨 === '조리법 · 기록' && g.칸 === 16), '레꾸에 「조리법 · 기록」 16컷이 있다')
console.log(`   → 레꾸 글자 탭 총 ${레꾸.총칸}칸`)

// 🔢 붙여서 «실제 크기»를 잰다 — 코드에 0.34 라고 써 있는 것과 화면에 그렇게 그려지는 건 다른 말이다.
//   ⚠️ 「첫 칸」을 누르면 안 된다 — 맨 위 그룹은 라벨지(글 상자)라 엉뚱한 걸 잰다.
//      「반응 · 별점」 절을 찾아 그 «안»의 첫 칸을 누른다.
const 전 = await pg.evaluate(() => document.querySelectorAll('.decor-stage img').length)
await pg.evaluate(() => {
  const 절 = [...document.querySelectorAll('.decor-sec')]
    .find((s) => (s.querySelector('.decor-sec-label, .t-sub, b')?.textContent || '').includes('반응'))
  절?.querySelector('.decor-cell')?.click()
})
await pg.waitForTimeout(400)
const 크기 = await pg.evaluate(() => {
  const st = document.querySelector('.decor-stage')
  const it = [...document.querySelectorAll('.decor-stage img')].pop()
  if (!st || !it) return null
  const a = st.getBoundingClientRect(), c = it.getBoundingClientRect()
  return { 종이: Math.round(Math.min(a.width, a.height)), 긴변: Math.round(Math.max(c.width, c.height)),
           수: document.querySelectorAll('.decor-stage img').length }
})
if (크기 && 크기.수 > 전) {
  const 비 = 크기.긴변 / 크기.종이
  console.log(`   붙인 스티커 긴변 ${크기.긴변}px · 종이 ${크기.종이}px → ${(비 * 100).toFixed(0)}%`)
  봄(비 > 0.28 && 비 < 0.42, '기본 크기가 0.34쯤으로 붙는다 (0.22면 22%라 걸린다)')
} else 봄(false, `스티커가 안 붙었다 (before ${전} / after ${크기?.수})`)

// ══ ② 일꾸(한끼 일기) ══
console.log('\n② 일꾸 — 한끼 일기 꾸미기')
await pg.goto('http://localhost:4177/', { waitUntil: 'networkidle' })
await pg.getByRole('button', { name: /일기/ }).first().click()
await pg.waitForTimeout(700)
// ⚠️ 일기 → 꾸미기 가는 길은 화면 글자가 정한다 — 짐작하지 말고 «보이는 것»을 눌러 나간다(규칙 18).
// ⚠️ 일기 → 꾸미기는 «세 걸음»이다 — ①오늘 일기 쓰기 ②(속지 화면) ③꾸미기.
//   ⛔ 한 번에 가려다 2026-08-12 에 달력 화면에 그대로 서 있었다. 보이는 것을 순서대로 누른다.
for (const 말 of [/오늘 일기|일기 쓰기/, /속지|꾸미기/, /꾸미기/]) {
  const b2 = pg.getByRole('button', { name: 말 }).first()
  if (await b2.count()) { await b2.click().catch(() => {}); await pg.waitForTimeout(900) }
}
await pg.getByRole('button', { name: '나중에' }).first().click({ timeout: 2500 }).catch(() => {})
await pg.waitForTimeout(400)
// 📔 일기 서랍은 선반이 둘 — 「일꾸」(일기 전용 세트) / 「레꾸」(공용). 기록 8그룹은 «일꾸» 쪽이다.
await pg.getByRole('button', { name: '일꾸', exact: true }).first().click().catch(() => {})
await pg.waitForTimeout(600)
const 기록탭 = pg.getByRole('button', { name: '기록', exact: true })
if (!(await 기록탭.count())) {
  console.log('   … 지금 화면 단추:', (await pg.evaluate(() =>
    [...document.querySelectorAll('button')].map((b) => b.textContent.trim()).filter(Boolean).slice(0, 22).join(' | '))))
}
봄(await 기록탭.count() > 0, '일꾸에 「기록」 탭이 생겼다')
if (await 기록탭.count()) {
  await 기록탭.click()
  await pg.waitForTimeout(400)
  const 일꾸 = await 서랍읽기()
  console.log('   탭:', 일꾸.탭.join(' · '))
  console.log('   기록 탭 그룹:', 일꾸.그룹.map((g) => `${g.라벨}(${g.칸})`).join(' · '))
  봄(일꾸.그룹.length === 8, `기록 탭에 8그룹 (지금 ${일꾸.그룹.length})`)
  봄(일꾸.총칸 === 99, `기록 탭에 99컷 (지금 ${일꾸.총칸})`)
  // ⚠️ 탭이 늘면 탭 줄이 넘칠 수 있다 — 「몇 개」가 아니라 «넘치나»를 잰다
  const 넘침 = await pg.evaluate(() => {
    const s = document.querySelector('.decor-drawer .segment')
    return s ? Math.max(0, s.scrollWidth - s.clientWidth) : -1
  })
  봄(넘침 <= 0, `탭 줄이 화면 안에 다 들어간다 (넘침 ${넘침}px)`)
}

await b.close(); srv.kill()
console.log(`\n${셈.ng ? '⛔' : '✅'} ${셈.ok}칸 통과 · ${셈.ng}칸 실패`)
process.exit(셈.ng ? 1 : 0)
