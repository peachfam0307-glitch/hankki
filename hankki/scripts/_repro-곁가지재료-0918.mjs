// 🍲🔬 「가진 재료」는 «본체»만 센다 — 곁가지 칸은 빼고 (2026-09-18)
//   📮 창업자 = *"그런 곁다리들은 빼자. 메인재료들이 나와야지"*
//   ⛔ 무엇이 잘못됐었나 = 샤브샤브가 5개였는데 그중 둘이 「깨소금」(찍어 먹는 소스)과
//      「계란」(다 먹고 «남은 국물»로 끓이는 죽)이었다. 그건 샤브샤브 재료가 아니다.
//   ⛔ 반대쪽 구멍도 같이 잰다 — `[양념]` 은 «꼭 드는 것»이라 계속 세야 한다(203편 중 164편이 갖고 있다).
//      넓게 잘랐으면 김치찌개·제육볶음이 통째로 깎였을 것이다.
import { allBasicRecipes } from '../src/data/basics.js'
import { countPantryHitsWeighted, 본체재료 } from '../src/pantryMatch.js'

let 통과 = 0; const 실패 = []
const 본다 = (이름, 참, 덧 = '') => { if (참) { 통과++; console.log('  ✓', 이름, 덧) } else { 실패.push(이름); console.log('  ✗', 이름, 덧) } }
const 편 = (조각) => allBasicRecipes.find((x) => x.title.replace(/\s/g, '').includes(조각.replace(/\s/g, '')))
const 냉장고 = ['느타리버섯', '두부', '대파', '청경채', '소고기', '돼지고기', '오징어', '새우', '해물모듬', '계란', '참깨', '김'].map((name) => ({ name }))
const 센다 = (제목) => countPantryHitsWeighted(편(제목), 냉장고, () => null)

// ① 곁가지가 빠진다 — 샤브샤브
{
  const { n, 칸 } = 센다('샤브샤브')
  const 이름들 = [...칸.keys()]
  본다('샤브샤브는 본체 셋만 센다', n === 3, 이름들.join(' · '))
  본다('⭐ 「참깨」(찍어 먹는 소스)가 안 세어진다', !이름들.includes('참깨'))
  본다('⭐ 「계란」(남은 국물로 끓이는 죽)이 안 세어진다', !이름들.includes('계란'))
  본다('진짜 재료는 남는다 (소고기·청경채·느타리버섯)', ['소고기', '청경채', '느타리버섯'].every((x) => 이름들.includes(x)))
}

// ② ⛔반대쪽 구멍 — `[양념]` 은 «계속» 센다. 넓게 자르면 여기가 깎인다.
{
  const { 칸 } = 센다('돼지고기 김치찌개')
  본다('⛔ `[양념]` 은 그대로 센다 — 김치찌개 돼지고기·두부·대파', ['돼지고기', '두부', '대파'].every((x) => [...칸.keys()].includes(x)), [...칸.keys()].join(' · '))
}
{
  const 원 = (편('제육볶음').ingredients || []).length
  본다('⛔ 제육볶음은 한 줄도 안 잘린다 (`[양념]` 뿐)', 본체재료(편('제육볶음').ingredients).length === 원, `${원}줄`)
}

// ②-b [창업자 2026-09-18 *"이런건 특별한 재료가 필요하지 않으니까 빼자"*] 찍먹 계열도 곁가지다
{
  const 남 = 본체재료(편('오징어 새우전').ingredients)
  본다('⭐ `[찍먹 간장]` 칸이 빠진다', !남.some((x) => /찍먹/.test(String(x))) && !남.includes('진간장 4큰술'), `${남.length}줄 남음`)
}
{
  const 남 = 본체재료(편('버섯전').ingredients)
  본다('⭐ `[초간장]` 칸이 빠진다', !남.some((x) => /초간장/.test(String(x))))
}
// ⛔ 「시럽」은 «뺐다가 되돌렸다» — 맛탕은 시럽에 버무리는 요리라 그게 본체다
{
  const 원 = (편('고구마맛탕').ingredients || []).length
  본다('⛔ 고구마맛탕 `[시럽]` 은 «안» 잘린다 (그게 본체다)', 본체재료(편('고구마맛탕').ingredients).length === 원, `${원}줄`)
}

// ③ 잘리는 편이 «적다» — 넓게 자르고 있지 않나
{
  const 바뀐 = allBasicRecipes.filter((r) => (r.ingredients || []).length !== 본체재료(r.ingredients).length)
  본다('잘리는 편이 열 편 아래다 (좁은 잣대)', 바뀐.length > 0 && 바뀐.length <= 10, `${바뀐.length}편 — ${바뀐.map((r) => r.title).join(' · ')}`)
}

// ④ 자르는 잣대가 «머리글의 말»이다 — 대괄호라고 다 자르지 않는다
{
  const 곁가지있는편 = allBasicRecipes.filter((r) => (r.ingredients || []).some((i) => /^\s*\[/.test(String(i))))
  const 안잘린 = 곁가지있는편.filter((r) => (r.ingredients || []).length === 본체재료(r.ingredients).length)
  본다('`[…]` 가 있어도 대부분은 안 잘린다', 안잘린.length > 150, `${안잘린.length}/${곁가지있는편.length}편 그대로`)
}

console.log(`\n${실패.length ? '⛔' : '✅'} ${통과}/${통과 + 실패.length}`)
if (실패.length) { console.log('실패:', 실패.join(' · ')); process.exit(1) }
