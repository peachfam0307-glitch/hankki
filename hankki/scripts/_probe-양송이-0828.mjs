import { parseRecipeText } from '../src/parseRecipe.js'
const r = parseRecipeText(`837 15 91 431
kim_seoul_638 강레오의 초간단 양송이버섯 볶음 레시피

양송이 250g을 4등분으로 썰어주세요

팬에 올리브유를 넣고 양송이랑, 소금, 후추를 넣고 센불에 볶아주세요

불이 약하면 버섯에서 물이나오니까 꼭 센불에 해주시구요

색이 노르스름해지면

버터 1조각, 다진양파 1/4개, 마늘 조금 넣고 양파가 익을때까지만 볶아줍니다

불끄고

엑스트라버진 올리브오일이랑 파슬리 뿌려서 버무려주면 완성입니다 간단히 보기
8월 18일

2na2jun_mom.official
BGM.Bon Petit jeuner`, { fromOcr: true })
console.log(`제목 = ${JSON.stringify(r.title)}`)
console.log(`재료(${r.ingredients.length}) = ${r.ingredients.join(' / ') || '(없음)'}`)
r.steps.forEach((s, i) => console.log(`걸음 ${i + 1}. ${s}`))
console.log(`메모 = ${JSON.stringify(r.memo)}`)
