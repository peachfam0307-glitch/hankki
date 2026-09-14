// 🧊 냉장고 「가진 재료로 만들 수 있어요」 = 가로 한 줄로 넘긴다 — 창업자 2026-08-12
//
// 📮 창업자 *"냉장고-가진재료로 만들기(지금은 2개 추천 여러개 추천되면 옆으로 넘기게)"*
//
// ⭐ 규칙 12 — 이 판을 고치기 «전» 코드(`grid2` ＋ 2/4장 제한)로 돌리면 ①②③⑤가 ⛔ 난다.
//    ④는 「실패할 줄 아는 칸」이라야 해서 **재료를 6개 담는다** — 옛 코드는 그때 4장(2행)을
//    세로로 쌓아 재료 줄을 아래로 밀어낸다(2026-08-12 두부 사고와 같은 꼴).
//
// ⛔ 냉장고 줄 선택자 = `.wish-row` (`.pantry-item` 은 «없는 이름»이다)
// ⛔ 「냉장고」는 하단 탭이 아니라 장보기 화면 «안»의 `button.seg`
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = 4197
const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT)], { stdio: 'ignore' })
await new Promise((r) => setTimeout(r, 3500))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
// 📐 창업자 폰과 비슷한 «작은» 화면 — 큰 화면에서 재면 밀려남이 안 보인다
const ctx = await b.newContext({ viewport: { width: 368, height: 818 }, timezoneId: 'Asia/Seoul' })

const 결과 = []
const 재 = (이름, 통과, 말) => { 결과.push([통과, 이름, 말]); console.log(`${통과 ? '✅' : '⛔'} ${이름} — ${말}`) }

// 📦 시드 — ⛔ `s.recipes` 배열이 «반드시» 있어야 한다(store.jsx:78 이 없으면 저장값을 통째로 버린다)
const 담을것 = ['양파', '돼지고기', '두부', '애호박', '김치', '대파']
const p = await ctx.newPage()
p.on('pageerror', (e) => console.log('⛔ pageerror', String(e).slice(0, 140)))
await p.addInitScript((names) => {
  localStorage.setItem('hankki:onboarded', '1')
  const o = Storage.prototype.getItem
  Storage.prototype.getItem = function (k) { return k.startsWith('hankki:coach:') ? '1' : o.call(this, k) }
  const raw = localStorage.getItem('hankki:v1')
  const s = raw ? JSON.parse(raw) : {}
  s.recipes = s.recipes || []
  s.pantry = names.map((n, i) => ({ id: `p${i}`, name: n, at: Date.now() }))
  localStorage.setItem('hankki:v1', JSON.stringify(s))
}, 담을것)
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(500)
await p.locator('.bottom-nav button', { hasText: '장보기' }).first().click()
await p.waitForTimeout(400)
await p.locator('button.seg', { hasText: '냉장고' }).first().click()
await p.waitForTimeout(800)

// 🔢 「가진 재료로 만들 수 있어요」 줄을 «화면에서» 잰다 — 코드가 아니라 그려진 것을 본다
const 잰값 = await p.evaluate(() => {
  const heads = [...document.querySelectorAll('.h-section')]
  const h = heads.find((x) => (x.textContent || '').includes('가진 재료로 만들 수 있어요'))
  if (!h) return { 없음: true, 제목들: heads.map((x) => x.textContent.trim()) }
  // 제목 «다음» 형제가 카드 줄이다
  let row = h.closest('.sec-head')?.nextElementSibling
  const cards = row ? [...row.querySelectorAll('button')] : []
  const rect = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } }
  const 줄 = [...document.querySelectorAll('.wish-row')].filter((x) => (x.innerText || '').trim())
  return {
    클래스: row?.className || null,
    카드수: cards.length,
    카드: cards.map(rect),
    넘침: row ? { scroll: row.scrollWidth, client: row.clientWidth } : null,
    줄박스: row ? rect(row) : null,
    화면: { w: innerWidth, h: innerHeight },
    첫재료: 줄[0] ? { 글: (줄[0].innerText || '').split('\n')[0].trim(), ...rect(줄[0]) } : null,
    재료수: 줄.length,
    막대: [...document.querySelectorAll('[data-hstrip], .scroll-hint, .hint-bar')].length,
  }
})

if (잰값.없음) {
  console.log('⛔ 「가진 재료로 만들 수 있어요」 칸을 못 찾았다 — 화면 제목들:', 잰값.제목들)
  재('① 추천 칸이 떴나', false, '칸 자체가 없다')
} else {
  const ys = 잰값.카드.map((c) => c.y)
  const 한줄 = ys.length > 0 && Math.max(...ys) - Math.min(...ys) <= 2
  재('① 추천이 2장보다 많이 뜨나', 잰값.카드수 > 2, `${잰값.카드수}장 (옛 코드는 재료가 많아도 4장에서 잘랐다)`)
  재('② 가로 «한 줄»인가', 한줄, `카드 y = ${[...new Set(ys)].join(', ')} · 클래스 ${잰값.클래스}`)
  재('③ 옆으로 넘길 수 있나', !!잰값.넘침 && 잰값.넘침.scroll > 잰값.넘침.client + 4,
    잰값.넘침 ? `넘침 ${잰값.넘침.scroll} > 칸 ${잰값.넘침.client}` : '측정 실패')
  // ⭐ 이 칸이 이 판의 «목적»이다 — 추천이 늘어도 담은 재료가 화면 안에 남아야 한다
  재('④ 담은 재료가 «화면 안»에 보이나', !!잰값.첫재료 && 잰값.첫재료.y < 잰값.화면.h,
    잰값.첫재료 ? `${잰값.첫재료.글} y=${잰값.첫재료.y} (화면 ${잰값.화면.h}) · 재료 ${잰값.재료수}줄` : '재료 줄을 못 찾음')
  // ⛔⛔ 첫 판에서 「카드가 화면 밖에 있다」로 10장을 실패시켰는데 **내 검사가 틀렸다.**
  //    가로로 미는 줄은 **밖에 있는 게 정상**이다 — 옆으로 넘겨서 보는 것이니까.
  //    📌 CLAUDE.md v10.20 에 «똑같은» 함정이 적혀 있는데 또 밟았다(규칙 18).
  //    ✅ 진짜로 봐야 하는 것 = ⒜첫 카드가 «왼쪽으로 잘렸나»(`.hscroll` 의 margin:0 -20px 가
  //       화면 padding 과 안 맞으면 잘린다) ⒝줄 «자체»가 화면 폭을 안 넘나
  const 첫 = 잰값.카드[0]
  const 줄 = 잰값.줄박스
  const 성함 = !!첫 && 첫.x >= 0 && !!줄 && 줄.x >= 0 && 줄.x + 줄.w <= 잰값.화면.w + 1
  재('⑤ 첫 카드·줄이 «화면 안»에 성하게 있나', 성함,
    첫 ? `첫 카드 x=${첫.x} 폭 ${첫.w} · 줄 x=${줄?.x} 폭 ${줄?.w} (화면 ${잰값.화면.w}) · 한 화면에 ${(잰값.화면.w / (첫.w + 12)).toFixed(1)}장 보인다` : '카드 없음')
  // ⭐ 「더 있다」가 글자 없이 전해지려면 다음 카드가 «살짝 걸쳐» 보여야 한다.
  // ⛔⛔ 첫 판은 `화면폭 / (카드폭+gap)` 으로 「2.18장」을 내고 ✅ 를 찍었는데 **캡처엔 두 장뿐이었다.**
  //    화면(368)이 아니라 «칸»(328)으로 재야 했고, 애초에 나눗셈이 아니라 **몇 px 걸치나**를 봐야 한다.
  //    📌 규칙 18 ⓘ — 검사가 초록불이어도 «무엇을 재는지»를 봐야 한다. 캡처가 아니었으면 그대로 나갔다.
  const 칸끝 = 줄 ? 줄.x + 줄.w : 0
  const 걸친것 = 잰값.카드.find((c) => c.x < 칸끝 && c.x + c.w > 칸끝)   // 칸 경계에 «걸친» 카드
  const 걸침px = 걸친것 ? Math.round(칸끝 - 걸친것.x) : 0
  const 온전 = 잰값.카드.filter((c) => c.x + c.w <= 칸끝 + 1).length
  재('⑥ 다음 카드가 «살짝 걸쳐» 보이나', 걸침px >= 20 && 걸침px <= 80,
    `${걸침px}px 걸친다 (20~80px 이라야 「더 있다」가 보인다 · 온전히 보이는 카드 ${온전}장)`)
}

console.log('\n' + '─'.repeat(50))
const 통과 = 결과.filter((r) => r[0]).length
console.log(`통과 ${통과} / ${결과.length}`)
await b.close(); srv.kill(); process.exit(통과 === 결과.length ? 0 : 1)
