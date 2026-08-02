// 레시피 파서·영수증 인식 회귀 테스트 — 실제 들어오는 글 모양 그대로 넣고 결과를 확인한다.
// (창업자 2026-07-29 "AI 파서 잡기 + 영수증 인식")
// 여기서 잡은 버그는 전부 실제 재현으로 확인한 것이다:
//   · "① 양념장 재료를 모두 섞어둔다" → 헤더로 오인돼 **줄이 통째로 사라짐**
//   · "소고기 미역국 황금레시피" → 제목이 "…황금"으로 잘리거나 빈칸이 됨
//   · 분량 없는 재료("다진마늘", "대파") → 메모로 새서 장보기에서 빠짐
//   · 줄글형("면 200g, 홀토마토 1캔, …") → 재료 0개, 문단 하나가 순서 1개
import { parseRecipeText } from '../src/parseRecipe.js'
import { extractReceiptItems } from '../src/receipt.js'

let fail = 0
const chk = (ok, label, extra = '') => {
  if (!ok) fail++
  console.log(`${ok ? '  ok' : 'FAIL'}  ${label}${extra ? `\n        ${extra}` : ''}`)
}
const has = (arr, s) => arr.some((x) => x.includes(s))

console.log('── ① 유튜브 더보기 (섹션 헤더 있음) ──')
{
  const r = parseRecipeText(`소고기 미역국 황금레시피

[재료]
소고기 양지 200g
건미역 20g
국간장 2큰술
물 2L

[만드는 법]
1. 건미역은 찬물에 20분 불린 뒤 헹군다.
2. 냄비에 참기름을 두르고 소고기를 볶는다.
3. 물을 붓고 30분 끓인다.`)
  chk(r.title === '소고기 미역국', '제목에서 "황금레시피"만 떼어냄', `제목="${r.title}"`)
  chk(r.ingredients.length === 4, '재료 4개', r.ingredients.join(' / '))
  chk(r.steps.length === 3, '순서 3개', r.steps.join(' / '))
  chk(!r.steps.some((s) => s.startsWith('1.')), '순서에서 번호 떼어냄')
}

console.log('\n── ② 인스타 캡션 (분량 없는 재료 · 줄바꿈 잘림) ──')
{
  const r = parseRecipeText(`🍆 가지덮밥 만들기

가지 2개
양파 반개
간장 3큰술
다진마늘
대파

가지를 도톰하게 썰어 소금물에
10분 담가둡니다
밥 위에 올리면 완성!

#가지덮밥 #자취요리`)
  chk(r.title === '가지덮밥', '제목', `제목="${r.title}"`)
  chk(has(r.ingredients, '다진마늘') && has(r.ingredients, '대파'), '분량 없는 재료도 재료 칸에', r.ingredients.join(' / '))
  chk(!/다진마늘|대파/.test(r.memo || ''), '메모로 새지 않음', `메모="${r.memo}"`)
  chk(has(r.steps, '소금물에 10분'), '줄바꿈으로 잘린 문장 합쳐짐', r.steps.join(' / '))
  chk(!r.steps.some((s) => s.includes('#')), '해시태그 줄 버림')
}

console.log('\n── ③ 블로그 (번호 순서 + 양념 소제목) ──')
{
  const r = parseRecipeText(`매운 제육볶음

■ 재료
- 돼지고기 600g
- 양파 1개

■ 양념장
- 고추장 3큰술
- 간장 2큰술

■ 조리법
① 양념장 재료를 모두 섞어둔다
② 고기에 양념장을 넣고 30분 재운다
③ 센불에 고기를 볶는다`)
  chk(r.ingredients.length === 4, '재료 4개(양념장까지)', r.ingredients.join(' / '))
  chk(r.steps.length === 3, '순서 3개 — ①줄이 사라지지 않음', r.steps.join(' / '))
  chk(has(r.steps, '양념장 재료를 모두 섞어'), '"① 양념장 …" 이 순서로 살아있음')
}

console.log('\n── ④ 줄글형 (쉼표 재료 나열 + 한 문단 조리법) ──')
{
  const r = parseRecipeText(`토마토 파스타

스파게티면 200g, 토마토홀 1캔, 마늘 5알, 올리브유 3큰술, 소금 약간

끓는 물에 소금을 넣고 면을 8분 삶아주세요. 팬에 올리브유를 두르고 마늘을 볶다가 토마토홀을 넣고 5분 졸입니다. 삶은 면을 넣고 버무리면 끝이에요.`)
  chk(r.ingredients.length === 5, '쉼표로 나열한 재료를 5개로 나눔', r.ingredients.join(' / '))
  chk(has(r.ingredients, '스파게티면 200g') && has(r.ingredients, '소금 약간'), '처음·끝 재료 모두 들어감')
  chk(r.steps.length === 3, '한 문단을 문장 3개로 나눔', r.steps.join(' / '))
}

console.log('\n── ⑤ 조리 문장의 쉼표는 재료로 쪼개지 않아야 함 (오작동 방지) ──')
{
  const r = parseRecipeText(`콩나물무침

콩나물 300g
소금 약간

콩나물을 씻어, 끓는 물에 데치고, 찬물에 헹군 뒤, 양념에 무친다.`)
  chk(r.ingredients.length === 2, '재료는 2개 그대로', r.ingredients.join(' / '))
  chk(has(r.steps, '콩나물을 씻어'), '조리 문장은 순서에 남음', r.steps.join(' / '))
}

console.log('\n── ⑥ 섹션 헤더 인식이 안 깨졌는지 (조리 순서·조리법) ──')
{
  for (const head of ['조리 순서', '조리법', '만드는 법']) {
    const r = parseRecipeText(`김치찌개\n\n재료\n김치 300g\n두부 1모\n\n${head}\n냄비에 김치를 볶는다\n물을 붓고 끓인다`)
    chk(r.ingredients.length === 2 && r.steps.length === 2, `"${head}" 헤더로 재료·순서 분리`, `재료=${r.ingredients.length} 순서=${r.steps.length}`)
  }
}

console.log('\n── ⑦ 영수증에서 식재료 뽑기 ──')
{
  const items = extractReceiptItems(`영수증
행복마트 강남점
사업자번호 123-45-67890
2026-07-29 14:22

1. 무항생제란 10구      4,980
2. 하림 닭가슴살        7,900
3. 대파 1단            2,480
4. 서울우유 1L         3,150
5. 종량제봉투 20L      1,200
합    계             19,710
카드결제             19,710`)
  chk(items.length > 0, `식재료 ${items.length}개 뽑음`, items.join(' / '))
  chk(items.some((x) => x.includes('대파')), '대파 인식')
  chk(items.some((x) => x.includes('우유')), '우유 인식')
  chk(!items.some((x) => x.includes('종량제') || x.includes('봉투')), '종량제봉투는 식재료 아님 — 제외', items.join(' / '))
  chk(!items.some((x) => /합\s*계|카드|사업자|영수증/.test(x)), '합계·카드·사업자번호 줄 제외')
}

console.log('\n── ⑧ 영수증 오독 교정 ──')
{
  const items = extractReceiptItems(`1. 고주장 500g      5,900\n2. 애호빅 1개        1,280`)
  chk(items.some((x) => x.includes('고추장')), '"고주장" → 고추장으로 되돌림', items.join(' / '))
}

console.log('\n── ⑨ 인스타 캡션 통짜 (2026-08-02 창업자 폰 사고) ──')
{
  // 실제로 앱에 저장된 결과가 «재료 칸에 「.」 하나 · 만드는 법에 재료 14줄» 이었다.
  // 뿌리 = `✨레시피 (3-4인분 기준)✨` 가 SEC_STEP(「레시피」로 시작)에 걸려
  //        그 줄부터 «순서 구역»이 열렸고 그 뒤 재료가 전부 순서로 갔다.
  const r = parseRecipeText(`emily.at_home 📌시아버지가 전수해준 홍콩식 가지 볶음

✨레시피 (3-4인분 기준)✨
🇮🇹티리난지 피렌체 웍 최저가 공구중! (영상 속 웍은 24cm)

가지 적당히 큰걸로 5개
돼지고기 다짐육 250g
물 100ml
다진마늘 2큰술
두반장 2큰술
식초 1큰술

돼지고기 양념 재료:

간장 1작은술
후추 약간

1. 가지 3등분 후 다시 6등분 해서 커팅해 주고
2. 다진 돼지고기에 양념 모두 넣고 잠시 재워두세요.`, { fromOcr: true })
  chk(r.ingredients.length >= 6, `재료가 살아 있다 (${r.ingredients.length}줄)`, r.ingredients.slice(0, 4).join(' / '))
  chk(r.ingredients.some((x) => x.includes('간장')), '「돼지고기 양념 재료:」 뒤 줄도 재료로', r.ingredients.join(' / '))
  chk(!r.steps.some((x) => /공구|최저가/.test(x)), '광고 줄(공구중·최저가)은 순서에 안 들어간다')
  chk(!r.steps.some((x) => /^레시피\s*[(（]/.test(x)), '「레시피 (3-4인분 기준)」은 순서가 아니다')
  chk(!r.steps.some((x) => /emily/i.test(x)), '인스타 아이디는 떨어져 나간다')
  chk(/가지/.test(r.title || ''), `제목을 잡는다 — 「${r.title}」`)
  chk(r.steps.length <= 4, `순서엔 진짜 조리 단계만 (${r.steps.length}줄)`, r.steps.join(' / '))
}

console.log(fail ? `\n❌ 실패 ${fail}건` : '\n✅ 전부 통과')
process.exit(fail ? 1 : 0)
