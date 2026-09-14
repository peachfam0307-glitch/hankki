// 🕘 레시피 목록이 «최신순»으로 서는가 — 📮창업자 2026-09-10 「최신 레시피가 제일 아래야」
//   ⛔ 옛 공식(Date.now() - i*60000)은 basics.js 뒤에 쌓은 새 편일수록 «더 옛날»로 찍었다.
import { seedRecipes, 열린때, 맨위고정 } from '../src/data/seed.js'
import { basicRecipes } from '../src/data/basics.js'

let 죽음 = 0
const 칸 = (참, 이름, 말 = '') => { console.log(`${참 ? '✅' : '❌'} ${이름}${말 ? ' · ' + 말 : ''}`); if (!참) 죽음++ }

// 화면이 세우는 그대로 (MyRecipesScreen.jsx = b.savedAt - a.savedAt)
const 세운것 = [...seedRecipes].sort((a, b) => b.savedAt - a.savedAt)

console.log('\n── ① 샘플이 «맨 위»에 고정돼 있다 (창업자 확정 2026-09-10) ──')
{
  칸(세운것[0].id === 맨위고정, '맨 위 = 고정한 샘플', `${세운것[0].title} (id ${세운것[0].id})`)
  칸(basicRecipes.some((r) => r.id === 맨위고정), '고정한 id 가 basics.js 에 «실제로» 있다 — 오타면 조용히 안 먹힌다')
}

console.log('\n── ①-2 그 «다음»부터는 최신순이다 ──')
{
  const 늦은날 = basicRecipes.filter((r) => r.from).map((r) => r.from).sort().pop()
  const 둘째 = 세운것.find((r) => r.id !== 맨위고정)
  칸(둘째.from === 늦은날, '고정석 빼면 맨 위 = 가장 최근에 열린 편', `${둘째.title}(${둘째.from}) · 가장 늦은 날짜 ${늦은날}`)
}

console.log('\n── ② 창업자가 본 그 증상이 «사라졌나» ──')
{
  const 콩 = 세운것.findIndex((r) => r.title === '콩국수') + 1
  const 꽃 = 세운것.findIndex((r) => r.title === '꽃게탕') + 1
  칸(꽃 < 콩, '꽃게탕(2026-09-07)이 콩국수(처음부터)보다 «위»', `꽃게탕 ${꽃}등 · 콩국수 ${콩}등`)
  console.log(`   📌 옛 공식이었으면 = 콩국수 1등 · 꽃게탕 60등 (창업자가 본 그것)`)
}

console.log('\n── ③ 줄이 «내림차순»으로 안 깨진다 ──')
{
  const 깨진곳 = 세운것.findIndex((r, i) => i > 0 && 세운것[i - 1].savedAt < r.savedAt)
  칸(깨진곳 === -1, '위에서 아래로 계속 옛날이 된다')
}

console.log('\n── ④ 같은 날 열린 것끼리도 «순서가 흔들리지 않는다» ──')
{
  const a = [...seedRecipes].sort((x, y) => y.savedAt - x.savedAt).map((r) => r.title).join('|')
  const b = [...seedRecipes].reverse().sort((x, y) => y.savedAt - x.savedAt).map((r) => r.title).join('|')
  칸(a === b, '들어온 차례가 달라도 결과가 같다')
}

console.log('\n── ⑤ from 이 «깨져도» 목록이 안 무너진다 (2차 사고) ──')
{
  const 값 = 열린때({ from: '엉터리' }, 3)
  칸(Number.isFinite(값), '깨진 날짜는 바닥으로 — NaN 이 안 샌다', `값 ${값}`)
  칸(값 < 열린때({ from: '2026-09-07' }, 0), '깨진 것은 진짜 날짜보다 아래')
}

console.log('\n── ⑥ from 없는 42편은 «바닥»에 모인다 ──')
{
  const from있는것 = 세운것.filter((r) => r.from).length
  const 위쪽 = 세운것.slice(0, from있는것).every((r) => r.from)
  칸(위쪽, 'from 있는 편이 전부 위에 있다', `from 있는 편 ${from있는것} · 없는 편 ${세운것.length - from있는것}`)
}

// 🕘🕘 [2026-09-12 창업자 폰 제보] *"15개레시피 또 거꾸로들어가있어 역순으로"*
//   ⛔ 뿌리 = 15편에 `from` 을 «안» 달고 넣었다 → 통째로 바닥에 깔리고 배열 뒤가 위로 섰다(원본 차례의 정반대).
//   ⭐ 그래서 basics.js 의 15편 배열은 **역순(015 → 001)** 이다 — 「보기 좋게」 되돌리면 그 순간 또 거꾸로 선다.
// 🕘🕘 [2026-09-12 창업자] *"역순으로 올라가는거 고쳐"* — 15편만의 일이 아니었다.
//   ⛔ `열린때` 가 `+ i * 1000` 이던 때는 **같은 날 열린 묶음이 전부 거꾸로** 섰다
//      (8/17 묶음 = basics 차례 「스무디 → … → 브로콜리 구이」인데 화면엔 브로콜리가 맨 위).
//   ✅ 지금은 `- i * 1000` — **basics.js 에 적은 차례가 곧 화면 차례**다.
console.log('\n── ⑨ 같은 날 열린 묶음이 «basics.js 에 적은 차례»대로 선다 ──')
{
  const 묶음 = new Map()
  for (const r of basicRecipes) { const k = r.from || '(없음)'; if (!묶음.has(k)) 묶음.set(k, []); 묶음.get(k).push(r.title) }
  let 어긋난날 = []
  for (const [날, 적힌차례] of 묶음) {
    if (적힌차례.length < 2) continue
    const 선차례 = 세운것.filter((r) => (r.from || '(없음)') === 날 && r.id !== 맨위고정).map((r) => r.title)
    const 적힌것 = 적힌차례.filter((t) => 선차례.includes(t))
    if (JSON.stringify(적힌것) !== JSON.stringify(선차례)) 어긋난날.push(날)
  }
  칸(어긋난날.length === 0, '묶음 전부가 적힌 차례대로', 어긋난날.length ? `어긋난 날 ${어긋난날.join(', ')}` : `묶음 ${[...묶음.values()].filter((v) => v.length > 1).length}개`)
}

console.log('\n── ⑧ 창업자 저장 15편이 «창업자 원본 차례»대로 선다 ──')
{
  const 원본차례 = [
    '가지 소고기 덮밥', '닭가슴살 피자 브리또', '보쌈 무김치', '닭가슴살 오이 샐러드', '파기름 간장국수',
    '우삼겹 두부조림', '대파 소스 목살 덮밥', '닭목살 불고기', '달래 대패삼겹 덮밥', '새송이버섯 들깨무침',
    '들깨 궁채나물', '미나리 오징어무침', '간장 목살스테이크', '육회 깻잎무침', '구움찰떡',
  ]
  const 선것 = 세운것.filter((r) => String(r.id).startsWith('basic-own-')).map((r) => r.title)
  칸(선것.length === 15, '15편이 다 있다', `${선것.length}편`)
  칸(JSON.stringify(선것) === JSON.stringify(원본차례), '위에서 아래로 원본 1번 → 15번', `맨 위 ${선것[0]} · 맨 아래 ${선것[14]}`)
  칸(세운것.filter((r) => String(r.id).startsWith('basic-own-')).every((r) => r.from), '15편에 from 이 다 달려 있다 — 없으면 바닥으로 깔린다')
}

console.log('\n── ⑦ 맨 위 다섯 (창업자가 눈으로 볼 것) ──')
세운것.slice(0, 5).forEach((r, i) => console.log(`   ${i + 1}. ${r.title} (${r.from || '처음부터'})`))

console.log(죽음 ? `\n❌ ${죽음}칸 실패` : '\n✅ 전부 통과')
process.exit(죽음 ? 1 : 0)
