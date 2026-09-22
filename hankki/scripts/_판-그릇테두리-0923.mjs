// 📋 v14.04 검수판 — 창업자가 배포 «전»에 눈으로 볼 다섯 가지
//    📮 창업자 2026-09-23 00:44 = *"오류나 버그생길수있으니까 천천히 확인해가면서 해."* → *"다섯개 다 찍어서 보여줘"*
//
//    ① 갈래별 테두리 그릇 넷이 «맞게» 깔리나        (냄비·볼·접시·손잡이)
//    ② 사진이 창 밖으로 «안» 삐져나오나             (새 그릇은 창 크기가 옛것과 다르다)
//    ③ 옛 pb_ 키로 저장해 둔 꾸미기가 «안 깨지나»   (⛓절대원칙 18ⓙ — 이미 깔린 폰을 본다)
//    ④ 어묵당면볶음에 «새» 아이콘이 뜨나
//    ⑤ 영상 문구가 «유튜브 편 전부»에 바뀌어 뜨나   (창업자 *"어남선생뿐 아니라 모든 sns 레시피"*)
//
// ⛔ 이 판은 «앱이 화면에 쓰는 그 값»을 찍는다 — basics.js 를 글자로 파싱하지 않는다(절대원칙 30).
// 실행: OUT=<폴더> SMOKE_CHROMIUM=… node scripts/_판-그릇테두리-0923.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { readFileSync, mkdirSync } from 'node:fs'
const OUT = process.env.OUT || '/tmp'
mkdirSync(`${OUT}/판0923`, { recursive: true })
const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { COACH } = await import('../src/coach.js')
const 사진 = readFileSync(new URL('file://' + OUT + '/내사진.txt'), 'utf8').trim()
const now = Date.now()

// 🍽 갈래별 «네 바구니»를 한 편씩 — 실제 레시피다(실측으로 고른 것)
const 넷 = {
  '돼지고기 김치찌개': '① 냄비  (국·탕·찌개)',
  '콩국수': '② 볼  (면)',
  '베이컨 크림 파스타': '③ 접시  (양식 = 기본값)',
  '연어 포케볼': '④ 손잡이  (포케·샐러드)',
}
// ③ 옛 키로 저장해 둔 폰 — 옛 흰 그릇(pb_x03)을 꾸미기로 얹어 둔 편
const 옛키편 = '된장찌개'

const state = {
  recipes: basicRecipes.map((r, i) => {
    const 담기 = { status: 'sorted', savedAt: now + 20000 - i, thumb: 'photo', image: 사진, imageZoom: 1.35, touched: true }
    if (넷[r.title]) return { ...r, ...담기 }
    if (r.title === 옛키편) return { ...r, ...담기, decor: [{ id: 'old1', type: 'sticker', key: 'pb_x03', x: 0.5, y: 0.5, s: 0.58, r: 0 }] }
    return { ...r, status: 'sorted', savedAt: now - i * 60000 }
  }),
  seedV: BASICS_VERSION,
}
const PORT = 4542
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
process.on('exit', () => { try { srv.kill() } catch {} })
await new Promise((r) => setTimeout(r, 900))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true })
const p = await ctx.newPage()
const url = `http://127.0.0.1:${PORT}/`
await p.goto(url)
await p.evaluate(({ s, keys }) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.removeItem('hankki:열쇠:그릇'); localStorage.removeItem('hankki:열쇠:할로윈')   // 🔑 유저와 «같은» 폰으로 본다
  localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')
  localStorage.setItem('hankki:cloudgate', '1'); localStorage.setItem('hankki:nudge:cloudgate', '1'); localStorage.setItem('hankki:nudge:giftpack', '1')
  keys.forEach((k) => localStorage.setItem(k, '1'))
}, { s: state, keys: Object.values(COACH) })
await p.goto(url); await p.waitForTimeout(2200)

const 찍다 = async (이름, h = 844) => { await p.screenshot({ path: `${OUT}/판0923/${이름}.png`, clip: { x: 0, y: 0, width: 390, height: h } }) }
const 상세로 = async (제목) => {
  await p.getByText('레시피', { exact: true }).last().click(); await p.waitForTimeout(900)
  await p.getByText(제목, { exact: true }).first().click(); await p.waitForTimeout(1400)
}
// ⛔ [2026-09-23 00:5x] 「뒤로」를 눌렀는데 안 돌아가서 넷을 «같은 화면»으로 쟀다(전부 pb_n02 로 찍혔다).
//    ✅ 그래서 돌아가는 대신 «홈부터 다시» 간다 — 확실하고, 다음에 또 안 속는다.
const 뒤로 = async () => { await p.goto(url); await p.waitForTimeout(1400) }

// ①② 갈래별 그릇 — 목록 한 장 ＋ 편마다 상세
await p.getByText('레시피', { exact: true }).last().click(); await p.waitForTimeout(1200)
await 찍다('①-목록-네갈래')
for (const [제목, 딱지] of Object.entries(넷)) {
  await 상세로(제목)
  const 잰값 = await p.evaluate(() => {
    const 그릇 = document.querySelector('img[src*="pb_n"]'); const 사진 = document.querySelector('img[src^="data:"]')
    if (!그릇 || !사진) return null
    const a = 그릇.getBoundingClientRect(), c = 사진.getBoundingClientRect()
    return { 그릇: 그릇.getAttribute('src').split('/').pop().split('-')[0],
      // 사진이 그릇 «밖»으로 나갔나 — 넘친 px (0 이하라야 담긴 것이다)
      넘침: { 왼: +(a.left - c.left).toFixed(1), 오: +(c.right - a.right).toFixed(1), 위: +(a.top - c.top).toFixed(1), 아래: +(c.bottom - a.bottom).toFixed(1) } }
  })
  console.log(`  ${딱지}  ${제목}`, JSON.stringify(잰값))
  await 찍다(`②-${딱지.slice(0, 2)}-${제목}`, 620)
  await 뒤로()
}

// ③ 옛 키로 저장해 둔 폰 — 안 깨지나
await 상세로(옛키편)
const 옛 = await p.evaluate(() => ({
  옛그릇: !!document.querySelector('img[src*="pb_x03"]'),
  새그릇: !!document.querySelector('img[src*="pb_n"]'),
  사진: !!document.querySelector('img[src^="data:"]'),
  오류: document.body.innerText.includes('문제가 생겼어요'),
}))
console.log('  ③ 옛 pb_x03 을 얹어 둔 폰 →', JSON.stringify(옛))
await 찍다('③-옛키-저장된폰', 620)
await 뒤로()

// ④ 어묵당면볶음 새 아이콘
await 상세로('어묵 당면볶음')
await 찍다('④-어묵당면볶음-새아이콘', 700)
await 뒤로()

// ⑤ 영상 문구 — 유튜브 편 «여럿»
const 유튜브편 = ['어남선생 오징어볶음', '매콤 닭다리살 볶음', '돼지고기 고추장찌개']
for (const 제목 of 유튜브편) {
  await 상세로(제목)
  // ⛔ .t-sub 는 화면에 여럿이다 — first() 로 잡으니 「한끼 기본 레시피」를 집었다(엉뚱한 줄).
  //    ✅ 영상 카드 «안»의 줄만 집는다 — 「영상으로 보기」가 적힌 카드를 먼저 찾고 그 안에서 고른다.
  const 카드 = p.locator('div').filter({ hasText: /영상으로 보기|릴스로 보기/ }).last()
  const 줄 = await 카드.locator('.t-sub').last().innerText().catch(() => '(못 찾음)')
  console.log(`  ⑤ ${제목} → ${줄}`)
  await 찍다(`⑤-영상문구-${제목}`, 760)
  await 뒤로()
}

await b.close(); srv.kill()
console.log(`\n📋 ${OUT}/판0923/`)
