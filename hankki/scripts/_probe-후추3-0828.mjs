// 🔬 [일회 · 2026-08-28] 가설: 인사말이 «걸음 1»이 되면서 sawStep 이 일찍 켜지고
//    그 뒤 짧고 애매한 줄(「후추」)이 재료로 못 가고 버려진다.
import { parseRecipeText } from '../src/parseRecipe.js'
const 인사말 = `차돌 느끼함도 싹 잡아줘서 더 맛있어요

간단한데 진짜 맛있으니
저장하셨다가 꼭! 해드셔보세요
남편이 오늘도 또 해먹자고

`
const 몸통 = `■ 재료 (2-3인분 기준)
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
후추`
for (const [이름, 글] of [['⛔ 인사말 «있음»(실물 그대로)', 인사말 + 몸통], ['✅ 인사말 «없음»', 몸통]]) {
  const r = parseRecipeText(글, { fromOcr: true })
  console.log(`${이름}`)
  console.log(`   제목 = ${JSON.stringify(r.title)}`)
  console.log(`   재료 = ${r.ingredients.join(' / ')}`)
  console.log(`   걸음 = ${r.steps.join(' / ') || '(없음)'}`)
  console.log(`   메모 = ${r.memo || '(없음)'}\n`)
}
