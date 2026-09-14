// 🔎 「사진에서 가져온 보쌈 무김치」 — 제목이 왜 「사진 레시피」로 남았나 (2026-09-02) 〔조사판〕
//
// 📮 창업자 = *"제목은 잘 못읽고 아까랑 똑같이 나왔고"* → *"보쌈무김치야 새로 담은거야"* → 원문 캡처
// ⭐ 잣대 = 앱이 진짜 쓰는 `parseRecipeText`(절대원칙 30). 흉내 파서를 두지 않는다.
// ⛔ 이건 «조사판»이다 — 원인이 잡히면 재현판(게이트)으로 옮긴다.
//
// 실행: node scripts/_판-보쌈무김치-0902.mjs
// 🏷 이름표 = 조사중
import { parseRecipeText } from '../src/parseRecipe.js'

// 창업자 캡처를 «화면 순서 그대로». OCR 은 화면 글자를 위에서 아래로 읽는다.
const 원문 = `KT 1:45
1,675 148 647
kim_seoul_638 보쌈 무김치인데,,
이렇게 한번 해보세요
족발집에서 파는 수준으로 맛있습니다
무는 1.5kg고
꼬독한 식감을 위해서 조금 두께감있게 썰어주세요
소금 2스푼, 180ml 종이컵으로 물엿 1컵을 넣고
2시간을 절여줍니다
2시간 뒤에, 절인 무를 물에 헹구지말고, 물기만 빼주세요
고춧가루 7스푼, 설탕 1스푼, 물엿 2스푼, 매실액 2스푼,
까나리액젓 4스푼, 마늘 2스푼넣고 버무려주면 끝입니다
보쌈무김치는 이걸로 정착해도 될 정도로 맛있으니까
믿고 해보셔도 좋을 것 같습니다 간단히 보기
6월 18일
along_recipe
세종시`

const r = parseRecipeText(원문, { fromOcr: true })
console.log('제목 =', JSON.stringify(r.title))
console.log('재료', r.ingredients.length, '줄')
r.ingredients.forEach((s, i) => console.log(`  ${i + 1}. ${s}`))
console.log('걸음', r.steps.length, '개')
r.steps.forEach((s, i) => console.log(`  ${i + 1}. ${s}`))
console.log('메모 =', JSON.stringify(r.memo))
