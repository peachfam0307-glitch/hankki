import { parseRecipeText } from '../src/parseRecipe.js'
const r = parseRecipeText(`오늘은 진짜 간단한 반찬 하나 해봤어요

■ 재료
애호박 1개
소금
후추

기름 두르고 애호박을 노릇하게 구워주세요
소금 후추로 간해주면 끝이에요`, { fromOcr: true })
console.log(`제목=${JSON.stringify(r.title)}`)
console.log(`재료=${JSON.stringify(r.ingredients)}`)
console.log(`걸음=${JSON.stringify(r.steps)}`)
console.log(`메모=${JSON.stringify(r.memo)}`)
