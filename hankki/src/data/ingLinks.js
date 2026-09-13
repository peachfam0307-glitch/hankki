// 🥬🥬 재료 이름 → 쿠팡 파트너스 링크 표 — ⭐⭐ **이 프로젝트에 «하나뿐»이다.**
//
// 📮 창업자 2026-09-12 = *"레시피에서 장보기를 누르면 장보기에 담아지잖아.
//    거의 쿠팡에서 살수있던데 이렇게 사는 것도 우리 수수료받아?"* → **안 받고 있었다.**
//    🔬 뿌리 = `RecipeDetailScreen` 의 「재료 담기」가 **이름만** 담는다(url 없음).
//       그러면 장보기의 `buyUrlFor()` 가 쿠팡 «일반 검색»(`coupang.com/np/search`)으로 보낸다 —
//       파트너스 링크가 아니라 **수수료 0원**이다.
//    📮 그래서 = *"다 붙여야지.. 그리고 장보기에 들어가는 것도 다 붙이자"*
//
// 🔢 실측(2026-09-12) = 재료 줄 1,328개 중
//    · 안 사는 것(물·소금·후추) 125 · 큐레이션 제품과 겹쳐 «이미» 붙는 것 255
//    · ⛔ **링크 없는 생재료 948줄 · 고유 이름 347개** ← 이 표가 메우는 자리
//    ⭐ 자주 나오는 것에 몰려 있다 — 상위 20개면 46.6% · 50개면 62% · 120개면 76%.
//
// ⛔⛔ **링크는 코드가 못 만든다.** `link.coupang.com/a/gRYUv7E6gf` 는 규칙 없는 단축코드다.
//    자동 생성은 파트너스 **deeplink API** 로만 되고, 그건 「최종 승인 = 누적 판매 15만원」이 열어준다
//    (`docs/쿠팡파트너스-API와-고지-2026-09-08.md` · 2026-09-10 실적 = 832원).
//    👉 그때까지는 **창업자가 파트너스 「링크 생성」에서 재료 이름으로 검색해 🔗 를 만든다.**
//
// ⭐⭐ **짝이 밀리지 않는 모양으로 받는다** — 2026-09-08 에 61개를 «순서»로 받다가
//    하나가 빠져 뒤가 통째로 밀렸고(이진탐색 6번), 그러고도 둘이 뒤바뀐 걸 **전수검사 61번**으로 잡았다.
//    이 표는 **이름이 열쇠**라 순서가 섞여도·빠져도 짝이 틀릴 수가 없다. 전수검사가 필요 없다.
//
// 📌 창업자가 고를 때 (창업자 확정 2026-09-12)
//    · *"야채같은거는 다 가장최소단위로 로켓프레시나 로켓배송으로"*
//    · *"밥면수이런건 말고"* → 안 파는 것은 `안파는것` 에 적어 목록에서 아예 뺀다.
//
// ✍️ 넣는 법 — 아래 표에 `'재료이름': '주소',` 한 줄씩. **비어 있어도 앱은 지금과 똑같이 돈다.**
//    👉 채울 목록은 `node scripts/_판-재료링크목록.mjs` 가 «빈도순»으로 뽑아준다.
import { picksForIngredients, productLink } from './curation'

export const ING_LINKS = {
  // '대파': 'https://link.coupang.com/a/…',
  '마늘': 'https://link.coupang.com/a/gYWf0VtWnc', // ⛇묶음: 마늘 / 통마늘
  '다진 마늘': 'https://link.coupang.com/a/gYVvIKX79w', // ⛇묶음: 다진 마늘 / 다진마늘
  '대파': 'https://link.coupang.com/a/gYRLijw0cu', // ⛇묶음: 대파 / 다진 파
  '참기름': 'https://link.coupang.com/a/gYVFT4O92y',
  '양파': 'https://link.coupang.com/a/gYRGqOjirk',

  '간장': 'https://link.coupang.com/a/gYVIGOABGK',

  '고추장': 'https://link.coupang.com/a/gYVRIoS4Bw',
  '식초': 'https://link.coupang.com/a/gYV0BkLPxY',
  '청양고추': 'https://link.coupang.com/a/gYV2eyMkXQ',
  '설탕': 'https://link.coupang.com/a/gYV3lE9m5Q',
  '계란': 'https://link.coupang.com/a/gYV90CzEQK', // ⛇묶음: 계란 / 달걀
  '들기름': 'https://link.coupang.com/a/gYWd7pmtlA',
  '당근': 'https://link.coupang.com/a/gYVszSzOA8',
  '감자': 'https://link.coupang.com/a/gYVgHur6wS',
  '두부': 'https://link.coupang.com/a/gYWkYqls5c',
  '쪽파': 'https://link.coupang.com/a/gYWxwokRlB',
  '버터': 'https://link.coupang.com/a/gYWBqCXJZI',
  '오이': 'https://link.coupang.com/a/gYRC2wiCOa',
  '달걀': 'https://link.coupang.com/a/gYV90CzEQK', // ⛇묶음: 계란 / 달걀
  '매실청': 'https://link.coupang.com/a/gYWt5fgkay',
  '애호박': 'https://link.coupang.com/a/gYRELHzOWy',
  '오징어': 'https://link.coupang.com/a/gYW3CYixoG',
  '마요네즈': 'https://link.coupang.com/a/gYWyr3PwR3',
  '새우': 'https://link.coupang.com/a/gYWZR1WOYu',
  '깻잎': 'https://link.coupang.com/a/gYRJiYfMUm',
  '레몬': 'https://link.coupang.com/a/gYWCAAhdlI',

  '생강가루': 'https://link.coupang.com/a/gYWLh2oac0',
  '표고버섯': 'https://link.coupang.com/a/gYW5mQxvmC',
  '다진 파': 'https://link.coupang.com/a/gYRLijw0cu', // ⛇묶음: 대파 / 다진 파
  '감자전분': 'https://link.coupang.com/a/gYWQr9gXIa', // ⛇묶음: 감자전분 / 전분가루

  '통후추': 'https://link.coupang.com/a/gYXtDrToZM',
  '토마토소스': 'https://link.coupang.com/a/gYXJohuE2K',
  '통마늘': 'https://link.coupang.com/a/gYWf0VtWnc', // ⛇묶음: 마늘 / 통마늘
  '전분가루': 'https://link.coupang.com/a/gYWQr9gXIa', // ⛇묶음: 감자전분 / 전분가루
  '가지': 'https://link.coupang.com/a/gYW53RCvwO',
  '레몬즙': 'https://link.coupang.com/a/gYXlG1Kdci',
  '방울토마토': 'https://link.coupang.com/a/gYXnuPqFzM',
  '새송이버섯': 'https://link.coupang.com/a/gYXpRCdI9Q',
  '부침가루': 'https://link.coupang.com/a/gYXA5qmDDg',
  '홍고추': 'https://link.coupang.com/a/gYXMGqQRNY',

  '들깨가루': 'https://link.coupang.com/a/gYXwwN8geG',
  // 🍯 「물엿」·「원당」은 2026-09-12 에 레시피에서 **이름이 바뀌었다**(물엿→올리고당 · 원당→아우노슈가)
  //    → 표에 두면 아무 줄도 안 덮는 «죽은 링크»가 된다.  ⑥ 가 잡아 줬다.
  //    ⭐ 올리고당·아우노슈가는 「주부의 장바구니」 제품이라 **큐레이션이 알아서 덮는다**(창업자 손 0).
  '스리라차': 'https://link.coupang.com/a/gYXCUg3eNw',
  '파프리카': 'https://link.coupang.com/a/gYXLWLldD2',
  '다진마늘': 'https://link.coupang.com/a/gYVvIKX79w', // ⛇묶음: 다진 마늘 / 다진마늘
  '생강': 'https://link.coupang.com/a/gYWRWEezHE', // ⛇묶음: 생강 / 다진 생강
  '다진 생강': 'https://link.coupang.com/a/gYWRWEezHE', // ⛇묶음: 생강 / 다진 생강
  '통깨': 'https://link.coupang.com/a/gYVL6ohhKe', // ⛇묶음: 통깨 / 깨소금 / 깨 / 갈아 둔 깨
  '깨소금': 'https://link.coupang.com/a/gYVL6ohhKe', // ⛇묶음: 통깨 / 깨소금 / 깨 / 갈아 둔 깨
  '고춧가루': 'https://link.coupang.com/a/gYVKs7LhaC', // ⛇묶음: 고춧가루 / 복이네먹거리 고춧가루
  '복이네먹거리 고춧가루': 'https://link.coupang.com/a/gYVKs7LhaC', // ⛇묶음: 고춧가루 / 복이네먹거리 고춧가루
  '묵은지': 'https://link.coupang.com/a/gYWFeBBQQu', // ⛇묶음: 묵은지 / 신김치
  '신김치': 'https://link.coupang.com/a/gYWFeBBQQu', // ⛇묶음: 묵은지 / 신김치
  '후추': 'https://link.coupang.com/a/gZhOsYoxBQ', // ⛇묶음: 후추 / 후춧가루
  '무': 'https://link.coupang.com/a/gZf2aXbvtk',
  '깨': 'https://link.coupang.com/a/gYVL6ohhKe', // ⛇묶음: 통깨 / 깨소금 / 깨 / 갈아 둔 깨
  '후춧가루': 'https://link.coupang.com/a/gZhOsYoxBQ', // ⛇묶음: 후추 / 후춧가루
  '양배추': 'https://link.coupang.com/a/gZgdptpwey',
  '부추': 'https://link.coupang.com/a/gZhfNOwn2i',
  '꽈리고추': 'https://link.coupang.com/a/gZgl15nJYq',
  '느타리버섯': 'https://link.coupang.com/a/gZgnN6PuG4',
  '생크림': 'https://link.coupang.com/a/gZgyrKUbQH',
  '파스타면': 'https://link.coupang.com/a/gZgElvHnVc', // ⛇묶음: 파스타면 / 스파게티 면 / 스파게티면
  '미림': 'https://link.coupang.com/a/gZg7lG8oYS',
  '고추기름': 'https://link.coupang.com/a/gZgN3nzK32',
  '매실액': 'https://link.coupang.com/a/gZg6uVtfgG',
  '밀가루': 'https://link.coupang.com/a/gZhbtOlBPE',
  '배즙': 'https://link.coupang.com/a/gZheSMmxgW', // ⛇묶음: 배즙 / 갈아만든배
  '알배추': 'https://link.coupang.com/a/gZhmfjCjnM',
  '연근': 'https://link.coupang.com/a/gZhm3LXtUO',
  '와사비': 'https://link.coupang.com/a/gZho03X3Ke',
  '갈아 둔 깨': 'https://link.coupang.com/a/gYVL6ohhKe', // ⛇묶음: 통깨 / 깨소금 / 깨 / 갈아 둔 깨
  '갈아만든배': 'https://link.coupang.com/a/gZheSMmxgW', // ⛇묶음: 배즙 / 갈아만든배
  '건고추': 'https://link.coupang.com/a/gZhybNEQI8',
  // ⭐ 아래 셋은 재료 줄에 «분량이 붙은 모양»으로만 있다(「닭다리살 700g」·「스파게티 면 180g」).
  //    넣기 도구가 «이름 그대로»를 못 찾아 건너뛰었지만, 앱의  는 분량을 떼고 찾으므로 붙는다.
  '닭다리살': 'https://link.coupang.com/a/gZgVXN4cpg',
  '스파게티 면': 'https://link.coupang.com/a/gZgElvHnVc', // ⛇묶음: 파스타면 / 스파게티 면 / 스파게티면
  '스파게티면': 'https://link.coupang.com/a/gZgElvHnVc', // ⛇묶음: 파스타면 / 스파게티 면 / 스파게티면
  '떡국떡': 'https://link.coupang.com/a/gZgZbTXfqK',
  // 🍖 [창업자 2026-09-12] 둘을 줬는데 재료 줄 이름은 하나다 → **찌개용**으로 (찌개·국 3편 · 볶음 2편)
  //    ⛔ 불고기·제육용(gZgrUsWnlc)은 안 쓴다 — 한 이름에 하나만 붙는다.
  '돼지고기 앞다리살': 'https://link.coupang.com/a/gZgtXRkfyC',
  // ⭐ 아래 넷은 재료 줄에 «분량이 붙은 모양»으로만 있어 넣기 도구가 건너뛴다 — 앱은 분량을 떼고 찾으므로 붙는다.
  '대패삼겹': 'https://link.coupang.com/a/gZjUYZsdkO', // ⛇묶음: 대패삼겹 / 돼지고기 목살
  '돼지고기 다짐육': 'https://link.coupang.com/a/gZjXCOQfRs',
  '모둠버섯': 'https://link.coupang.com/a/gZj3j9D4iO',
  '소고기 다짐육': 'https://link.coupang.com/a/gZkspeX9Oe',
  // 🍡 떡은 «이름이 이미 갈려» 있어 따로 붙는다 — 떡국떡 / 떡볶이 떡 · 가래떡(누들떡)
  '떡볶이 떡': 'https://link.coupang.com/a/gZg4AihgOW', // ⛇묶음: 떡볶이 떡 / 가래떡
  '가래떡': 'https://link.coupang.com/a/gZg4AihgOW', // ⛇묶음: 떡볶이 떡 / 가래떡
  '김가루': 'https://www.oasis.co.kr/product/detail/95589',
  '고등어': 'https://smartstore.naver.com/jejugalchi/products/4772215785',
  '쌀': 'https://smartstore.naver.com/eeem/products/6764610456',
  '화이트발사믹': 'https://www.kurly.com/goods/5053689',
  '갈치': 'https://brand.naver.com/fallinlovefish/category/435f21f6b43246a1ad7c12760e3c5078',
  '국간장': 'https://smartstore.naver.com/thebat/products/5108613448',
  '소금': 'https://www.oasis.co.kr/product/detail/1557', // ⛇묶음: 소금 / 굵은소금
  '올리브유': 'https://www.costco.co.kr/Foods/Processed-Food/Oils/KS-Siurana-Extra-Virgin-Olive-Oil-1L/p/892188', // ⛇묶음: 올리브유 / 식용유
  '식용유': 'https://www.costco.co.kr/Foods/Processed-Food/Oils/KS-Siurana-Extra-Virgin-Olive-Oil-1L/p/892188', // ⛇묶음: 올리브유 / 식용유
  '굵은소금': 'https://www.oasis.co.kr/product/detail/1557', // ⛇묶음: 소금 / 굵은소금
  '고구마': 'https://link.coupang.com/a/gZi9xnoWgm',
  '다시마': 'https://link.coupang.com/a/gZjMgmol2W',
  '그릭요거트': 'https://emart.ssg.com/item/itemView.ssg?itemId=1000419163155&siteNo=6001&salestrNo=2037',
  '닭가슴살': 'https://link.coupang.com/a/gZjNJKt7VQ',
  '닭볶음탕용 닭': 'https://link.coupang.com/a/gZjQd9T2T6',
  '돼지고기 목살': 'https://link.coupang.com/a/gZjUYZsdkO', // ⛇묶음: 대패삼겹 / 돼지고기 목살
  '루꼴라': 'https://link.coupang.com/a/gZj0w4G25A',
  '모차렐라 치즈': 'https://link.coupang.com/a/gZj6blHyHB',
  '사과': 'https://link.coupang.com/a/gZkbGOntU4',
  '숙주': 'https://link.coupang.com/a/gZktVgPObQ',
  '시금치': 'https://link.coupang.com/a/gZkvaQIHg4',
  '아보카도': 'https://link.coupang.com/a/gZkyjmhF6q',
  '양송이버섯': 'https://link.coupang.com/a/gZkBeXvDS8',
  '완숙 토마토': 'https://link.coupang.com/a/gZkCFDgWku',
  '다시마초': 'https://smartstore.naver.com/cnmi/products/7222887351',
}

// 🚱 사는 물건이 아닌 재료 — 목록에도 안 올리고, 링크도 안 붙인다 (창업자 *"밥면수이런건 말고"*)
//   ⛔ 「물」처럼 «한 글자»가 많아서 부분일치로 거르면 「물냉면」까지 걸린다 → **완전일치로만** 본다.
export const 안파는것 = new Set([
  '물', '뜨거운 물', '따뜻한 물', '찬물', '얼음', '얼음물', '끓는 물',
  '밥', '따뜻한 밥', '찬밥', '식은 밥', '면수', '육수', '삶은 물',
])
// ⛔⛔ [2026-09-12] **소금·후추를 여기서 뺐다 — 창업자 = *"후추를 왜 안사?"* · *"소금후추는 필수템이야."***
//   📮 창업자가 정한 것은 *"밥면수이런건 말고"* «뿐»이었다. 소금·후추는 **내가 얹었다** — 정한 적 없다.
//   ⭐ 필수템이라 오히려 링크가 붙어야 한다. 떨어지면 사는 것이다.

// 🚱🚱 **[창업자 확정 2026-09-12] 장보기에 «담기지도» 않는 것 — 물류.**
//   📮 창업자 = *"레시피 상세에서 담기 누르면 물500ml이런것도 담겨"*
//   ⛔ 뿌리가 «둘»이었다 —
//     ① 「물 500ml」의 분량이 안 떨어진다. `ingredientName` 이 `ml·g·망·팩` 같은 **파는 단위**를
//        일부러 남기기 때문이다(「돼지고기 600g」은 그 숫자가 살 때 필요한 정보라서). 물은 아닌데.
//     ② 분량이 떨어져 「물」이 돼도 여전히 담긴다. 살 일이 없는데.
//   ⭐ 그래서 «담기 전»에 이 목록으로 거른다 — 이름 그대로도, 분량을 뗀 말로도 본다.
//   ☑️ 창업자 판정 = **물류만.** 소금·후추·육수는 떨어지면 사니까 그대로 담긴다.
export const 안담는것 = new Set([
  '물', '뜨거운 물', '따뜻한 물', '찬물', '얼음', '얼음물', '끓는 물',
  '밥', '따뜻한 밥', '찬밥', '식은 밥', '면수', '삶은 물',
])

// 🔗 재료 이름 하나로 링크를 찾는다.
//   ⛔⛔ **완전일치로만 본다.** 낱말 시작(`startsWith`)으로 보면 안 된다 —
//      2026-08-03 에 `노두유`(중국 진간장)가 「두유」로 걸린 사고가 정확히 그 모양이다.
//      「간장게장」↔간장 · 「참치액」↔참치 · 「고추장아찌」↔고추장 — 얼마든지 있다.
//   ⭐ 다만 «파는 단위»가 붙어 남은 이름은 한 번 더 본다 —
//      `ingredientName()` 은 「버터 15g」·「양파 1망」을 **통째로** 돌려준다(살 때 필요한 정보라서).
//      그 줄도 재료는 버터·양파이므로 뒤의 분량만 떼고 다시 찾는다.
// 낱말을 가르는 글자 — 한국어는 조사가 «뒤»에 붙으므로 「참기름을」은 안 걸린다(그게 맞다).
//   재료 줄은 「참기름 한 바퀴」·「깨소금·참기름」처럼 띄어쓰기·가운뎃점으로 갈리니 그걸 본다.
const 낱말경계 = /[\s,()·/+—-]/

const 분량뗀것 = (s) =>
  String(s).replace(/\s+[0-9]+([./][0-9]+)?\s*[a-zA-Z가-힣]*$/, '').trim()

// 🚱 담을 것인가 — 이름 그대로도 보고, 분량을 뗀 말로도 본다(「물 500ml」 → 「물」).
export const 담을만한가 = (name) => {
  const n = String(name || "").trim()
  if (!n) return false
  if (안담는것.has(n)) return false
  return !안담는것.has(분량뗀것(n))
}

export const ingLink = (name) => {
  const n = String(name || '').trim()
  if (!n || 안파는것.has(n)) return ''
  if (ING_LINKS[n]) return ING_LINKS[n]
  const 짧게 = 분량뗀것(n)
  if (짧게 !== n && !안파는것.has(짧게) && ING_LINKS[짧게]) return ING_LINKS[짧게]

  // ⭐⭐ **꼬리표가 붙은 변형을 «같은 링크»로 잇는다** — 창업자가 두 번 만들지 않게.
  //    📮 창업자 2026-09-12 = *"최대한 내가 두번일안하게 잘 설계해줄래"*
  //    🔢 실측 = 「참기름 한 바퀴」·「다진 마늘 크게」·「대파 200g」 같은 변형이 잔뜩이다.
  //       이걸 각각 만들게 하면 창업자가 같은 제품 링크를 몇 번씩 만든다.
  //       ⭐ 잇기를 켜면 **상위 20개만 만들어도 44.9% → 53.0%**(160줄이 공짜로 붙는다).
  //
  // ⛔⛔ **「낱말 «경계»에서 완전히 맞을 때만»** 잇는다 — `startsWith` 도 `includes` 도 아니다.
  //    2026-08-03 「노두유(老抽)」가 「두유」로 걸린 사고가 그 자리다. 같은 꼴이 얼마든지 있다.
  //    🧪 위험한 넷으로 재봤다 — 「노두유」·「간장게장」·「참치액」·「고추장아찌」 **전부 안 걸린다.**
  // ⭐ 여럿이 맞으면 **가장 «긴» 것**을 고른다 — 「무 절임용 아우노슈가」에서
  //    「무」가 아니라 「아우노슈가」가 이겨야 한다(짧은 쪽이 이기면 엉뚱한 걸 산다).
  let 최선 = ''
  for (const k of Object.keys(ING_LINKS)) {
    if (k.length <= 최선.length) continue
    let i = n.indexOf(k)
    while (i >= 0) {
      const 앞 = i === 0 || 낱말경계.test(n[i - 1])
      const 끝 = i + k.length
      if (앞 && (끝 === n.length || 낱말경계.test(n[끝]))) { 최선 = k; break }
      i = n.indexOf(k, i + 1)
    }
  }
  if (최선) return ING_LINKS[최선]

  // ⭐⭐ 표에 없으면 **「주부의 장바구니」 제품이 그 재료를 덮는지** 본다.
  //    🔢 실측(2026-09-12) = 재료 줄 1,328개 중 **214줄**이 여기서 붙는다 —
  //       창업자가 링크를 «하나도 안 만들어도» 붙는 몫이다(그 제품엔 이미 파트너스 링크가 있다).
  //    ⛔ 판정은 **`picksForIngredients()` «하나»를 부른다.** 규칙을 여기에 베끼지 않는다 —
  //       2026-09-12 에 `MALL_SEARCH`·`productMall` 이 두 벌이라 컬리 18개가 네이버로 샜다(같은 뿌리).
  //       그래서 「노두유↔두유」 같은 낱말 한가운데 사고도 그 함수의 규칙이 그대로 막아 준다.
  //    ⛔ 메모는 빈 문자열로 넘긴다 — 여기 들어오는 건 «재료 한 줄»이지 설명 글이 아니다.
  const [제품] = picksForIngredients([n], '')
  return 제품 ? productLink(제품) : ''
}
