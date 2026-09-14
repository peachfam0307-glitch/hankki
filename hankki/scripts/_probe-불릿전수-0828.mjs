// 🔬 [일회 · 2026-08-28] 한국 인스타 캡션에 흔한 «장식 문자» 전수 — 어느 것이 섹션 헤더를 죽이나
import { __dbgMerge, __dbgMark } from './_dbg-parse-0828.js'
const 장식 = ['■','□','◆','◇','▶','▷','◈','▣','◎','★','☆','※','▪','●','○','•','·','‣','◦','-','*','✔','☑','✅','🔸','🔹','📌','🍲','[',  '【']
const 깨짐 = []
for (const b of 장식) {
  const 글 = `남편이 오늘도 또 해먹자고\n\n${b} 재료 (2-3인분 기준)\n파스타면 340g`
  const m = __dbgMerge(__dbgMark(글.split('\n')))
  const 붙었나 = m.some((l) => /해먹자고.*재료/.test(l))
  if (붙었나) 깨짐.push(b)
  console.log(`${붙었나 ? '⛔' : '✅'}  ${JSON.stringify(b)}  U+${b.codePointAt(0).toString(16).toUpperCase().padStart(4,'0')}`)
}
console.log(`\n⛔ 헤더가 죽는 장식 ${깨짐.length}개 = ${깨짐.map((x)=>JSON.stringify(x)).join(' ')}`)
