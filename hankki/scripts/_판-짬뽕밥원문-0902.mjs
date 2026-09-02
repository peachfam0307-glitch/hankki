// 🔎 창업자 「짬뽕밥」 OCR 원문을 **앱의 진짜 파서**에 넣어 본다 — 2026-09-02 〔조사판〕
//
// 📮 창업자가 폰에서 사진으로 가져온 결과를 캡처와 «원문»으로 같이 줬다.
//    화면 = 제목 「사진 레시피」 · 표지 빈 접시 · 1번 걸음이 「계랑스푼 기준(1T:15ml, 1t:5ml)」
//
// ⭐ 흉내내지 않는다(절대원칙 30) — `src/parseRecipe.js` 의 `parseRecipeText` 를 «그대로» 부른다.
// 실행: node scripts/_판-짬뽕밥원문-0902.mjs
// 🏷 이름표 = 조사판 (smoke 아님 · 판정 뒤 지우거나 재현판으로 옮긴다)
import { parseRecipeText } from '../src/parseRecipe.js'

const 원문 = `계랑스푼 기준(1T:15ml, 1t:5ml)
#짬뽕밥
재료
우삼겹 300g
당면 50g(불려서 준비)
알배추 1/2개, 청경채 2개
대파 1대, 양파 1/2개
다진마늘 1T, 액젓 1T
계란 1알
후추추추추
고춧가루 1T~1.5T
물 1.5L(+한우가루 3포)
= 어른꺼 물 1L, 아이들꺼 물 500ml 넣었어요
1 당면은 미지근한물에 불려서 준비하고
채소는 한입크기로 썰어 준비한다
2 기름두른 팬에 다진마늘을 볶다가 향이 올라오면
대파와 양파 넣어 볶아준다
3 파와 양파 겉면이 익으면 우삼겹을 넣고 볶다가
나오는 기름은 80% 닦아내고 간장을 넣어 불맛을 내준다
4 아이들꺼 덜고 고춧가루 한스푼 추가해서 고추기름
내주다가 물 1L, 한우가루 2포 넣어 5분 끓인다
(아이들껀 물 500ml에 한우가루 1포,
만약 어른꺼만 만든다면 물 1.5L에 한우가루 3포)
5 당면 추가해서 3분 끓이고
청경채와 계란물 풀어 넣어준 뒤 후추로 마무리`

const r = parseRecipeText(원문, { fromOcr: true })
console.log('제목 =', JSON.stringify(r.title))
console.log('\n재료', r.ingredients.length, '줄')
r.ingredients.forEach((x, i) => console.log(` ${String(i + 1).padStart(2)}. ${x}`))
console.log('\n걸음', r.steps.length, '개')
r.steps.forEach((x, i) => console.log(` ${String(i + 1).padStart(2)}. ${x}`))
if (r.memo) console.log('\n메모 =', JSON.stringify(r.memo))
