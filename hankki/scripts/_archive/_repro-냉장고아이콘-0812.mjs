// 🔬 창업자 제보 재현 — 「냉장고 재료에 «요리 사진»이 붙는다」
//
// 📮 창업자 2026-08-12
//   *"9번 내가 잘못썼는데 냉장고 재료얘기였어. **재료 하나만 담아도 큰 이미지가 생겨서 재료가 안보였어.**"*
//
// ⛔⛔ 원인 = `PantryView` 가 `guessFoodIcon(p.name)` 을 썼다. 그건 «요리 제목»용이라
//    「애호박」이 「애호박새우젓볶음」 규칙에 걸려 **완성 접시 사진(fe_224)** 이 붙었다.
//    대파(greenOnion)·두부(tofu)는 재료 SVG 가 있어 멀쩡했고 **그림이 없는 재료만** 사진을 뒤집어썼다.
//
// ⭐ 판정 방법 = `FoodIcon` 은 사진이면 `<img>`, 재료 SVG 면 `<svg>` 를 그린다(FoodIcon.jsx:1375).
//    → **한 줄 안에 `<img>` 가 있으면 요리 사진이다.**
//
// ⛔⛔ **`page.reload()` 로 「남나」를 재지 않는다** — `addInitScript` 가 저장값을 시드로 덮어써
//    앱이 멀쩡한데 실패로 나온다(`check-mistakes.mjs` ⑧).
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = 4193
const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT)], { stdio: 'ignore' })
await new Promise(r => setTimeout(r, 3500))

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const ctx = await b.newContext({ viewport: { width: 360, height: 800 }, timezoneId: 'Asia/Seoul' })
const 결과 = []
const 재 = (이름, 통과, 말) => { 결과.push([통과, 이름, 말]); console.log(`${통과 ? '✅' : '⛔'} ${이름} — ${말}`) }

// 📦 시드 — **창업자 폰과 같은 상태**를 만든다.
//   ⭐⭐ 여기가 핵심이다(규칙 18 ⓙ) — 냉장고는 담을 때 `icon` 이 **굳어서 저장된다.**
//      그래서 「새로 담는 길」만 고치면 **이미 담아둔 애호박은 그대로 접시**다.
//      시드에 `icon: 'fe_224'` 를 박아 «이미 깔린 폰»에서 출발한다.
const 시드 = () => {
  localStorage.setItem('hankki:onboarded', '1')
  const 원래 = Storage.prototype.getItem
  Storage.prototype.getItem = function (k) { return k.startsWith('hankki:coach:') ? '1' : 원래.call(this, k) }
  const raw = localStorage.getItem('hankki:v1')
  const s = raw ? JSON.parse(raw) : {}
  // ⛔⛔ **`recipes` 배열이 없으면 앱이 저장값을 통째로 버린다** (`store.jsx:78`
  //    `if (!data || !Array.isArray(data.recipes)) return null`) → pantry 를 심어도 «빈 냉장고»가 뜬다.
  //    📌 규칙 18 — 첫 판이 「줄 0개」였는데 그건 **앱이 지운 게 아니라 내 시드가 반쪽**이었다.
  s.recipes = s.recipes || []
  s.pantry = [
    { id: 'p1', name: '애호박', icon: 'fe_224', addedAt: Date.now() },      // ⛔ 이미 요리 사진이 굳어 있다
    { id: 'p2', name: '대파', icon: 'greenOnion', addedAt: Date.now() },     // ✅ 재료 SVG (회귀 감시)
    { id: 'p3', name: '두부', icon: 'tofu', addedAt: Date.now() },           // ✅ 재료 SVG (회귀 감시)
    { id: 'p4', name: '감자', icon: 'fe_243', iconPicked: true, addedAt: Date.now() }, // ⭐ 직접 고른 것 = 지키기
  ]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
}

const p = await ctx.newPage()
p.on('pageerror', e => console.log('⛔ pageerror', String(e).slice(0, 120)))
await p.addInitScript(시드)
await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(500)

// 냉장고로 — ⚠️ 「냉장고」는 «하단 탭»이 아니라 **장보기 화면 안의 토글**이다(ShopScreen:92).
//   ⛔ 첫 판은 `getByRole('button', {name:/냉장고/})` 로 잡아 «못 찾고 조용히 넘어갔다** → 줄 0개.
//      📌 규칙 18 — 「재료가 안 뜬다」가 아니라 **내가 그 화면에 못 갔던 것**이다.
await p.locator('.bottom-nav button', { hasText: '장보기' }).first().click()
await p.waitForTimeout(400)
const 냉장고 = p.locator('button.seg', { hasText: '냉장고' })
if (!(await 냉장고.count())) { console.log('⛔ 「냉장고」 토글을 못 찾았다 — 화면 구조가 바뀌었나'); }
await 냉장고.first().click()
await p.waitForTimeout(500)

// 한 줄씩 읽는다 — 이름 ＋ 그림 종류(img=요리사진 / svg=재료그림) ＋ 타일 크기 ＋ 이름 잘림
const 줄 = await p.evaluate(() => {
  return [...document.querySelectorAll('.wish-row')].map(row => {
    const 타일 = row.querySelector('.emoji-tile')
    const 이름칸 = row.querySelector('div[style*="min-width"] > div')
    return {
      이름: (이름칸?.textContent || '').trim(),
      사진: !!타일?.querySelector('img'),
      그림: !!타일?.querySelector('svg'),
      타일폭: taWidth(타일),
      잘림: 이름칸 ? 이름칸.scrollWidth > 이름칸.clientWidth + 1 : false,
    }
    function taWidth(el) { return el ? Math.round(el.getBoundingClientRect().width) : 0 }
  })
})
console.log('  담긴 줄:', 줄.map(r => `${r.이름}/${r.사진 ? 'img⛔' : 'svg'}`).join(' · '))

const 찾 = (n) => 줄.find(r => r.이름.startsWith(n))
const 애 = 찾('애호박'); const 대 = 찾('대파'); const 두 = 찾('두부'); const 감 = 찾('감자')

재('① 냉장고 줄이 다 떴나', 줄.length === 4, `줄 ${줄.length}개 (4이라야 한다)`)

// ⭐⭐ 제일 중요한 칸 — «이미 담아둔» 재료가 고쳐지나
재('② 이미 담긴 애호박에 요리 사진이 «안» 붙나', !!애 && !애.사진 && 애.그림,
  애 ? (애.사진 ? '⛔ 아직 요리 접시 사진이다' : '재료 그림(svg)') : '못 찾음')

재('③ 대파는 재료 그림 그대로인가(회귀)', !!대 && !대.사진 && 대.그림,
  대 ? (대.사진 ? '⛔ 사진이 됐다' : '재료 그림 유지') : '못 찾음')
재('④ 두부는 재료 그림 그대로인가(회귀)', !!두 && !두.사진 && 두.그림,
  두 ? (두.사진 ? '⛔ 사진이 됐다' : '재료 그림 유지') : '못 찾음')

// ⭐ 직접 고른 건 «빼앗지 않는다» — 픽커에서 일부러 골랐으면 그게 맞다
재('⑤ 직접 고른 그림은 그대로 남나', !!감 && 감.사진,
  감 ? (감.사진 ? '고른 사진 유지' : '⛔ 골라둔 그림이 지워졌다') : '못 찾음')

// 창업자 제보의 나머지 절반 — 「큰 이미지가 생겨서 재료가 안 보였어」
// ⛔ `every` 는 **빈 배열에서 참**이다 — 줄을 못 찾으면 «늘 통과하는 칸»이 된다(실패할 줄 모르는 검사).
//    그래서 「줄이 있는가」를 조건에 같이 건다.
재('⑥ 타일이 38px 인가(옛 값 46)', 줄.length > 0 && 줄.every(r => r.타일폭 === 38),
  줄.length ? `타일 ${[...new Set(줄.map(r => r.타일폭))].join('·')}px` : '⛔ 잴 줄이 없다')
재('⑦ 재료 이름이 안 잘리나', 줄.length > 0 && 줄.every(r => !r.잘림),
  줄.length ? (줄.filter(r => r.잘림).map(r => r.이름).join(',') || '잘림 0') : '⛔ 잴 줄이 없다')

// 새로 담는 길도 같은가 — 「재료 담기」로 애호박을 다시 담아 본다
const 새이름 = '애호박'
const 담기 = await p.evaluate((nm) => {
  // 앱 규칙을 그대로 쓴다(흉내 아님) — 화면에 이미 그려진 결과로 판정하므로 여기선 저장값만 본다
  const s = JSON.parse(localStorage.getItem('hankki:v1') || '{}')
  return (s.pantry || []).find(x => x.name === nm)?.icon || null
}, 새이름)
재('⑧ 저장값은 «안 건드린다»(되돌릴 수 있게)', 담기 === 'fe_224', `저장된 icon = ${담기}`)

console.log('\n' + '─'.repeat(50))
const 통과 = 결과.filter(r => r[0]).length
console.log(`통과 ${통과} / ${결과.length}`)

await b.close(); srv.kill(); process.exit(통과 === 결과.length ? 0 : 1)
