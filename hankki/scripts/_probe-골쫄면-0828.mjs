// 🔬 [2026-08-28] 창업자 폰 실물(v11.63) — 골쫄면·된장삼겹살·콩나물무침이 다시 어긋난 자리
// ⚠️ 입력은 «앱이 뱉은 결과»로 되짚은 것이다(진짜 OCR 출력이 아니다 — 이 환경은 kor.traineddata 를 못 받는다)
import { parseRecipeText } from '../src/parseRecipe.js'

const 골쫄면 = `글 표해 소독에 씨워 넣어고 먹죠,
한 그릇만 먹어도 든든한 여름 면요리입니다(

/ 골쫄면

V 재료 (2인분)
• 쫄면 2인분
• 골뱅이 1캔
• 오이 1개
• 깻잎 10장
• 청양고추 5개

V 양념
• 물 250ml
• 진간장 50ml
• 분말육수 1포
• 알룰로스 1큰술
• 참기름 1큰술

@ 만드는 법

1. 쫄면은 삶아 찬물에 여러 번 헹군 뒤 물기를 충분히
빼주세요.
2. 물, 진간장, 분말육수, 알룰로스, 참기름을 섞어 양념을
만들어줍니다.
3. 넓은 그릇에 쫄면을 담고 채 썬 오이와 골뱅이를
올려주세요.
4. 청양고추를 듬뿍 올린 뒤 양념을 붓고 깻잎으로
마무리하면 완성입니다.

먹기 전에 바닥까지 골고루 비벼주면
오이는 아삭하고 골뱅이는 쫄깃해서
한입 먹을 때마다 식감이 정말 좋아요.

ㄴ 먹덕 비빔 골뱅이 맛고

L4D TVHHE THIN`

const r = parseRecipeText(골쫄면, { fromOcr: true })
console.log('제목 =', JSON.stringify(r.title))
console.log('재료 =')
r.ingredients.forEach((x, i) => console.log('  ', i + 1, x))
console.log('걸음 =')
r.steps.forEach((x, i) => console.log('  ', i + 1, x))
console.log('메모 =', JSON.stringify(r.other || r.memo || ''))

const 부대찌개 = `릴스 더 보기
다시 보기
레시피 출처: 정호영의 오늘도 요리 Kitchen Caden (유튜브)
998 11 70 589
ttaracook 김형석 부대찌개
재료: 햄과 소시지 500g, 사골곰탕 1팩(500ml), 김치,
양파, 대파, 두부, 청양고추
1. 냄비에 기름을 두르고 햄과 소시지를 노릇노릇하게 볶아
주세요.
2. 햄을 한쪽으로 몰아 놓고 양파 반 개, 두부 반 모, 대파,
청양고추, 김치를 담은 뒤 사골곰탕 1팩을 부어 주세요.
3. 고추장 1숟갈, 고춧가루 3숟갈, 다진마늘 1숟갈, 진간장
2숟갈, 맛술 2숟갈, 참치액 1숟갈, 설탕 반 숟갈, 후추를
넣어 양념해 주세요.
4. 뭉근하게 끓이시면 완성입니다~!(졸아서 간이 짜졌다면
물을 더 넣어 주세요) 간단히 보기
6일 전
ourraring
광고`

console.log('\n════ 부대찌개 ════')
const b = parseRecipeText(부대찌개, { fromOcr: true })
console.log('제목 =', JSON.stringify(b.title))
console.log('재료 ='); b.ingredients.forEach((x, i) => console.log('  ', i + 1, x))
console.log('걸음 ='); b.steps.forEach((x, i) => console.log('  ', i + 1, x))
