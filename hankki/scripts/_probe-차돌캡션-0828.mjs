// 🔬 [일회 · 2026-08-28] 차돌 파스타 캡션 «전체»를 넣고 어디로 갔는지 본다 (메모까지)
import { parseRecipeText } from '../src/parseRecipe.js'
const 캡션 = `차돌 느끼함도 싹 잡아줘서 더 맛있어요

간단한데 진짜 맛있으니
저장하셨다가 꼭! 해드셔보세요
남편이 오늘도 또 해먹자고

■ 재료 (2-3인분 기준)
파스타면 340g (면사랑 2개)
차돌박이 300g
참나물 한줌
대파 1대
양배추 (생략가능)

소스
다진마늘 1T
면수 5T
간장 1T
참치액 2T
후추
*매운거 좋아하심 페퍼론치노 추가

■ 차돌 참나물양배추 파스타
1. 파스타면은 뜨거운 물에 담가주세요
2. 참나물 잎과 줄기를 나누고 줄기는 송송 썰어주세요
3. 팬에 대파 구워주고 차돌박이 볶아 기름 내주세요
4. 양배추, 다진마늘, 줄기 넣어 함께 볶아주세요
5. 파스타면 넣어 소스 넣어 볶아주세요
6. 마지막에 참나물 듬뿍 올려 숨 죽여주고
후추, 페퍼론치노 뿌려주면 완성

✔참나물은 맨 마지막에 넣어야 향긋해요
✔대파를 먼저 구우면 단맛과 풍미가 좋아요`
const r = parseRecipeText(캡션, { fromOcr: true })
console.log(`제목  = ${JSON.stringify(r.title)}`)
console.log(`\n재료 ${r.ingredients.length}개`); r.ingredients.forEach((x, i) => console.log(`  ${i + 1}. ${x}`))
console.log(`\n걸음 ${r.steps.length}개`); r.steps.forEach((x, i) => console.log(`  ${i + 1}. ${x}`))
console.log(`\n메모 = ${JSON.stringify(r.memo)}`)
