// 🏷🥄🌶 「사진에서 가져온 짬뽕밥」 — 제목·계량 기준·반복 글자 (2026-09-02) 〔smoke〕
//
// 📮 창업자 폰 실물 = 제목 **「사진 레시피」** · 걸음 1번 **「계랑스푼 기준(1T:15ml, 1t:5ml)」** ·
//    재료에 **「후추추추추」** → *"제목이랑 후추추추추ㅋ"* · *"ai로 다시다듬기했는데 결과값은 같아"*
//
// ⭐⭐ **잣대는 「앱이 진짜 쓰는 모듈」이다**(절대원칙 30) — `parseRecipeText`·`mergeTidy` 를 그대로 부른다.
//    흉내 낸 파서를 두면 앱이 바뀌어도 이 판만 초록불로 남는다.
//
// ⛔ **AI 판까지 잰다** — 창업자가 겪은 건 규칙 파서가 아니라 «AI 가 덮은 뒤»의 화면이었다.
//    규칙 파서만 재면 **고쳤는데 폰에선 그대로**인 상태를 못 잡는다.
//
// 실행: node scripts/_repro-짬뽕밥제목-0902.mjs   (exit 0 = 통과)
// 🏷 이름표 = 반영됨
import assert from 'node:assert'
import { parseRecipeText, collapseRepeatedSyllables, KIJUN_LINE } from '../src/parseRecipe.js'
import { mergeTidy } from '../src/tidy.js'

let 통과 = 0
let 실패 = 0
const 칸 = (이름, 조건, 실물) => {
  if (조건) { 통과++; console.log(`  ✅ ${이름}`) } else { 실패++; console.log(`  ❌ ${이름}${실물 ? ` — 실물: ${실물}` : ''}`) }
}

// ⭐ 창업자가 준 «원문 그대로». 한 글자도 안 고친다 — 고치면 재는 게 달라진다.
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

console.log('① 규칙 파서')
const r = parseRecipeText(원문, { fromOcr: true })

// ⭐ 심장 — 「둘째 줄 해시태그」가 제목이 된다. 전엔 첫 줄만 봐서 이 줄이 통째로 버려졌다.
칸('제목이 「짬뽕밥」이다', r.title === '짬뽕밥', JSON.stringify(r.title))
// ⛔ 「계랑스푼 기준」이 제목을 채가지 않는다(그게 전에 일어난 일이다)
칸('제목이 「계랑스푼 기준」이 아니다', !KIJUN_LINE.test(String(r.title || '')), JSON.stringify(r.title))
// ⛔ 걸음에도 없어야 한다 — 창업자 폰은 이게 1번 걸음이었다
칸('걸음에 계량 기준 줄이 없다', !r.steps.some((s) => KIJUN_LINE.test(s)), r.steps[0])
// ⭐ 버리지 않고 «메모»로 옮겼나 — 「1T 가 15ml」는 진짜 필요한 정보다
칸('계량 기준이 메모에 살아 있다', KIJUN_LINE.test(String(r.memo || '')), JSON.stringify(String(r.memo || '').slice(0, 30)))
// 🌶 반복 글자
칸('재료에 「후추」가 있다', r.ingredients.includes('후추'), r.ingredients.join(' / '))
칸('재료에 「후추추추추」가 없다', !r.ingredients.some((x) => /추추추/.test(x)), r.ingredients.join(' / '))
// ⛔ 고치면서 «멀쩡하던 것»을 깨지 않았나 — 이게 없으면 제목만 맞고 나머지가 무너져도 초록불이다
칸('재료 9줄 그대로', r.ingredients.length === 9, String(r.ingredients.length))
칸('걸음 5개 그대로', r.steps.length === 5, String(r.steps.length))
칸('걸음 1번이 당면 불리기', /당면.*불려/.test(r.steps[0] || ''), r.steps[0])

console.log('② AI 판이 덮은 뒤 — 창업자가 실제로 본 화면')
// ⛔ AI 가 «제목을 안 주고» 계량 기준을 걸음 1번으로 주는 판 = 창업자 폰에서 실제로 나온 모양
const ai = {
  title: '',
  ingredients: ['우삼겹 300g', '당면 50g', '후추추추추'],
  steps: ['계랑스푼 기준(1T:15ml, 1t:5ml)', '당면은 미지근한 물에 불린다', '채소를 썬다'],
  memo: '',
}
const 합친 = mergeTidy(r, ai)
칸('AI 가 제목을 안 줘도 「짬뽕밥」이 남는다', 합친.title === '짬뽕밥', JSON.stringify(합친.title))
칸('AI 걸음에서도 계량 기준이 빠진다', !합친.steps.some((s) => KIJUN_LINE.test(s)), 합친.steps[0])
칸('그 줄이 메모에 남아 있다', KIJUN_LINE.test(String(합친.memo || '')), JSON.stringify(합친.memo))
칸('메모에 같은 줄이 두 번 안 들어간다',
  (String(합친.memo || '').match(/계랑스푼 기준/g) || []).length === 1,
  JSON.stringify(합친.memo))

console.log('③ 반복 글자 잣대 자체')
칸('후추추추추 → 후추', collapseRepeatedSyllables('후추추추추') === '후추')
칸('두 글자 되풀이는 안 건드린다(아주아주)', collapseRepeatedSyllables('아주아주') === '아주아주')
칸('두 번 반복은 안 건드린다(추추)', collapseRepeatedSyllables('후추추') === '후추추')
칸('자모(ㅋㅋㅋ)는 안 건드린다', collapseRepeatedSyllables('맛있다ㅋㅋㅋ') === '맛있다ㅋㅋㅋ')

console.log(`\n${통과}/${통과 + 실패} 통과`)
assert.equal(실패, 0, `${실패}칸 실패`)
