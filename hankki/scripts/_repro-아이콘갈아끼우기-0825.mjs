// 🍽🍽 「106컷 갈아끼우기」가 «이미 저장된 레시피»에도 닿나 — 창업자 폰 상태를 그대로 만들어 본다
//    ✅ 반영됨 (v11.33)
//
// 📮 창업자 2026-08-25 = *"배포됐다는데 내 폰에서는 전혀안보여."*
//    설정 버전은 v11.32 인데 음식 그림은 «전부» 옛것이었다.
//
// ⛔⛔ 뿌리 = v11.32 가 `ICON_RULES` 의 «키»만 갈았다.
//    아이콘은 레시피를 만들 때 `recipe.icon` 으로 **박혀서 굳는다**
//    (`Thumb.jsx` = `recipe.icon || guessFoodIcon(제목)` — 박힌 값이 규칙을 «덮는다»).
//    → 앞으로 «새로» 만드는 레시피만 새 그림을 받고, 이미 저장된 건 영영 옛 그림이다.
//    📌 규칙 18 ⓙ — 「새로 까는 사람」이 아니라 «이미 깔린 폰»을 봐야 한다(v10.76 과 같은 자리).
//
// ⭐⭐ 이 판의 «심장» = 「저장된 값이 진짜로 바뀌었나」다. ⛔「규칙이 새 키를 내놓나」가 아니다.
//    규칙은 v11.32 에서도 멀쩡했고, 그런데도 창업자 폰은 안 바뀌었다.
//    그래서 소스를 안 보고 **localStorage 에 실제로 뭐가 들어 있나**를 읽는다.
//
// 🧪 규칙 12 = `store.jsx` 의 v88 패스를 지우거나 `BASICS_VERSION` 을 87 로 되돌리면 ①②④가 죽는다.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const { BASICS_VERSION } = await import('../src/data/basics.js')
const { COACH } = await import('../src/coach.js')

// 창업자 폰을 흉내낸다 — 옛 판에서 저장돼 «옛 키가 박힌» 레시피들 ＋ seedV 는 87(v11.32 까지 받은 상태)
const 옛판 = [
  // ① 내 레시피 — 옛 키가 박혀 있다. 이게 창업자가 본 그 상태다
  { id: 'my-1', title: '베이컨 크림 파스타', icon: 'fe_53', thumb: 'icon', ingredients: [], steps: [] },
  { id: 'my-2', title: '감바스 알 아히요', icon: 'fe_08', thumb: 'icon', ingredients: [], steps: [] },
  { id: 'my-3', title: '볶음우동', icon: 'fe_155', thumb: 'icon', ingredients: [], steps: [] },
  { id: 'my-4', title: '꽃게찜', icon: 'fe_284', thumb: 'icon', ingredients: [], steps: [] },
  // ② 사진 표지 — ⛔절대 안 건드려야 한다
  { id: 'my-5', title: '로제 파스타', icon: 'fe_27', thumb: 'photo', image: 'data:image/png;base64,iVBORw0KGgo=', ingredients: [], steps: [] },
  // ③ 카드 표지 — ⛔절대 안 건드려야 한다
  { id: 'my-6', title: '치즈 샌드위치', icon: 'fe_26', thumb: 'card', image: 'data:image/png;base64,iVBORw0KGgo=', ingredients: [], steps: [] },
  // ④ 제목으로 잡는 것 — 옛 키(fy_y05)를 「샐러드」가 아직 쓰므로 «키»로는 못 간다
  { id: 'my-7', title: '토마토샐러드', icon: 'fy_y05', thumb: 'icon', ingredients: [], steps: [] },
  // ⑤ 같은 옛 키인데 제목이 「샐러드」 — ⛔이건 안 바뀌어야 한다(범용 샐러드 그림이 맞다)
  { id: 'my-8', title: '샐러드', icon: 'fy_y05', thumb: 'icon', ingredients: [], steps: [] },
  // ⑥⑥ [2026-08-25 · v11.34] 대응표가 «놓친» 자리 — 31곳을 실측으로 찾았다
  //   ⛔ 뿌리 = 대응표를 커밋 diff(키가 «바뀐» 규칙)에서 뽑았는데,
  //      새 규칙 상당수는 **키를 바꾼 게 아니라 옛 규칙 «위»에 새로 얹은 것**이라 diff 에 안 잡혔다.
  //   ⭐ 그래서 표를 늘리는 대신 「제목을 지금 규칙에 다시 물어본다」를 넣었다. 아래가 그 표본이다.
  { id: 'my-9', title: '파스타', icon: 'pasta', thumb: 'icon', ingredients: [], steps: [] },
  { id: 'my-10', title: '초밥', icon: 'sushi', thumb: 'icon', ingredients: [], steps: [] },
  { id: 'my-11', title: '리조또', icon: 'fe_42', thumb: 'icon', ingredients: [], steps: [] },
  { id: 'my-12', title: '두루치기', icon: 'fe_129', thumb: 'icon', ingredients: [], steps: [] },
  { id: 'my-13', title: '뚝배기파스타', icon: 'fe_168', thumb: 'icon', ingredients: [], steps: [] },
  // ⑦ ⛔ 새 컷이 «없는» 요리는 그대로여야 한다 — 아무 때나 덮으면 유저가 고른 그림을 뺏는다
  { id: 'my-14', title: '김치찌개', icon: 'fh_k02', thumb: 'icon', ingredients: [], steps: [] },
]

const 바랄값 = {
  'my-1': 'fe_453', 'my-2': 'fe_414', 'my-3': 'fe_400', 'my-4': 'fe_481',
  'my-5': 'fe_27',  // 사진 표지 = 그대로
  'my-6': 'fe_26',  // 카드 표지 = 그대로
  'my-7': 'fe_444', // 제목으로 잡음
  'my-8': 'fy_y05', // 범용 샐러드 = 그대로
  'my-9': 'fe_446', 'my-10': 'fe_494', 'my-11': 'fe_432', 'my-12': 'fe_417', 'my-13': 'fe_436',
  'my-14': 'fh_k02', // 새 컷이 없다 = 그대로
}

const now = Date.now()
const state = {
  recipes: 옛판.map((r, i) => ({ ...r, status: 'sorted', savedAt: now - i * 60000 })),
  seedV: 88, // ⭐ v11.33 까지 받은 폰. 89 미만이라야 마이그레이션이 돈다
}

const PORT = Number(process.env.PORT || 4436)
const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', 'dist'], { stdio: 'ignore' })
process.on('exit', () => { try { srv.kill() } catch { /* noop */ } })
await new Promise((r) => setTimeout(r, 900))

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage()
page.setDefaultTimeout(20000)
const url = `http://127.0.0.1:${PORT}/`

await page.goto(url)
await page.evaluate(({ s, keys }) => {
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  localStorage.setItem('hankki:onboarded', '1')
  keys.forEach((k) => localStorage.setItem(k, '1'))
}, { s: state, keys: Object.values(COACH) })

// ⭐ 다시 열어야 마이그레이션이 돈다 (reload 가 아니라 goto — 규칙: addInitScript 함정 피하기)
await page.goto(url)
await page.waitForTimeout(2000)

const 읽음 = await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  const m = {}
  for (const r of s.recipes || []) if (String(r.id).startsWith('my-')) m[r.id] = { icon: r.icon, thumb: r.thumb }
  return { seedV: s.seedV, m }
})

let 통과 = 0, 죽음 = 0
const 칸 = (이름, ok, 말) => { if (ok) { 통과++; console.log(`  ✅ ${이름} — ${말}`) } else { 죽음++; console.log(`  ⛔ ${이름} — ${말}`) } }

console.log(`\n🍽 저장된 레시피의 «박힌 icon» 이 새 컷으로 갈렸나 (seedV ${state.seedV} → ${읽음.seedV} · 기대 ${BASICS_VERSION})\n`)
칸('seedV 올라감', 읽음.seedV === BASICS_VERSION, `${읽음.seedV}`)
for (const r of 옛판) {
  const got = 읽음.m[r.id]
  if (!got) { 칸(r.title, false, '레시피가 사라졌다') ; continue }
  const want = 바랄값[r.id]
  const 지킴 = ['my-5', 'my-6', 'my-8', 'my-14'].includes(r.id)
  칸(`${r.title}${지킴 ? ' (그대로여야 함)' : ''}`, got.icon === want, `${r.icon} → ${got.icon}  (기대 ${want})`)
}

// ⑥ 화면에 «진짜로» 새 그림 파일이 떠 있나 — 저장값만 보면 그림이 깨져도 모른다
await page.getByText('레시피', { exact: true }).last().click()
await page.waitForTimeout(1500)
const 그림 = await page.evaluate(() => {
  const out = { 깨짐: 0, 총: 0 }
  for (const img of document.querySelectorAll('img')) {
    if (!/photo|assets/.test(img.currentSrc || img.src)) continue
    out.총++
    if (!img.complete || img.naturalWidth === 0) out.깨짐++
  }
  return out
})
칸('화면 그림 안 깨짐', 그림.깨짐 === 0 && 그림.총 > 0, `${그림.총}장 중 깨진 것 ${그림.깨짐}`)

await b.close()
console.log(`\n${죽음 === 0 ? '✅' : '⛔'} ${통과}/${통과 + 죽음}\n`)
process.exit(죽음 === 0 ? 0 : 1)
