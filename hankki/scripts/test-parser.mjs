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

console.log('\n── ⑧ 📸 창업자 실물 (2026-08-05 08:42~43 캡처) — 합쇼체 + 반 토막 문장 ──')
{
  // 궁채 들깨볶음 — 「1시간」/「동안 …」 으로 잘렸고 온 줄이 「~니다」였다
  const r = parseRecipeText(`궁채 들깨볶음
[만드는 법]
기호에 따라 간을 조절해주세요.
궁채는 흐르는 물에 2~3번 씻은 뒤, 물에 담가 1시간
동안 불려줍니다.
양파는 얇게 썰어 전자레인지용 그릇에 담고 3분간 돌려 단맛을 끌어냅니다.
마무리로 통 들깨를 뿌려 완성합니다.`)
  chk(r.steps.length === 4, `「1시간 / 동안」 이 한 줄로 붙는다 (${r.steps.length}단계)`, r.steps.join(' / '))
  chk(has(r.steps, '1시간 동안 불려줘요'), '「불려줍니다」 → 「불려줘요」', r.steps.join(' / '))
  chk(has(r.steps, '끌어내요'), '「끌어냅니다」 → 「끌어내요」', r.steps.join(' / '))
  chk(has(r.steps, '완성해요'), '「완성합니다」 → 「완성해요」', r.steps.join(' / '))
  chk(r.steps.every((s) => /요[.!~)\]]*$/.test(s.trim())), '⭐ 모든 줄이 해요체로 나간다', r.steps.join(' / '))
}
{
  // 굴 배추국 — 괄호가 두 줄에 걸쳤고, 「…OK!)」 가 문장 끝인 «척» 했다
  const r = parseRecipeText(`굴 배추국
[만드는 법]
웍에 올리브오일 둘러 채썰어둔 파,양파 로 기름 내어줍니다
끓어 오르면 알배추, 다진마늘 (매운 고추 넣으셔도 OK!)
넣고 맛소금과 설탕, 순후추로 간을 합니다
(간장을 넣으시면 국물이 탁해지니 맛소금만 넣고 간을 해 보세요!
굴 국물이 베이스라 간장을 넣지 않아도 깔끔하고 맛있어요!)
마지막으로 불려둔 당면 넣어주세요!`)
  chk(r.steps.length === 4, `반 토막 둘이 붙는다 (${r.steps.length}단계)`, r.steps.join(' / '))
  chk(has(r.steps, '기름 내어줘요'), '「내어줍니다」 → 「내어줘요」', r.steps.join(' / '))
  chk(has(r.steps, '순후추로 간을 해요'), '「간을 합니다」 → 「간을 해요」 · 괄호 뒤 문장이 이어붙는다', r.steps.join(' / '))
  chk(r.steps.some((s) => /맛있어요!\)$/.test(s.trim())), '두 줄에 걸친 괄호가 한 줄로 닫힌다', r.steps.join(' / '))
}
{
  // ⛔ 멀쩡히 끝난 문장엔 아무것도 안 붙어야 한다 (25자 완화의 안전선)
  const r = parseRecipeText(`간단 계란찜
[만드는 법]
계란 세 개를 곱게 풀어요.
소금 한 꼬집을 넣어요.
중불에서 8분 쪄요.`)
  chk(r.steps.length === 3, `끝난 문장끼리는 안 붙는다 (${r.steps.length}단계)`, r.steps.join(' / '))
}

{
  // 🔁 겹친 캡처 — 창업자 2026-08-13 제보 *"인식이 구려"*
  //   캡처 «2장»으로 삼계탕을 담았더니 12단계였는데 5·6·7 이 8·9·10 에 통째로 다시 나왔다.
  //   두 캡처가 겹치는 부분(첫 장 끝 = 둘째 장 시작)이 그대로 두 번 들어간 것이다.
  //   ⭐ 인식은 정확했다. 「정리」가 문제였다.
  const r = parseRecipeText(
    `삼계탕
재료
-닭다리 한팩 500g
-대추 6개

레시피
1. 30분전에 찹쌀을 깨끗하게 씻어 미리 물에 불려주세요.
2. 찹쌀 위에 차곡차곡 깔고 소금을 듬뿍 뿌린 뒤 대추 6개를 덮어주세요.
3. 물 600ml를 붓고 중강불에서 먼저 끓여줍니다.
4. 찹쌀 위에 차곡차곡 깔고 소금을 듬뿍 뿌린 뒤 대추 6개를 덮어주세요.
5. 물 600ml를 붓고 중강불에서 먼저 끓여줍니다.
6. 향신재료 걷어내고 닭고기 그릇에 옮긴 뒤`,
    { fromOcr: true },
  )
  chk(r.steps.length === 4, `겹쳐 들어온 단계가 한 번만 남는다 (${r.steps.length}단계)`, r.steps.join(' / '))
  const 찹쌀 = r.steps.filter((s) => s.includes('차곡차곡')).length
  chk(찹쌀 === 1, `같은 문장이 두 번 안 남는다 (${찹쌀}번)`, r.steps.join(' / '))
}
{
  // ⚠️ 짧은 줄은 «진짜로» 반복될 수 있다 — 지우면 안 된다
  const r = parseRecipeText(`계란찜
[만드는 법]
계란을 곱게 풀어 소금 한 꼬집을 넣고 잘 저어 주세요.
약불로 줄여요.
5분 뒤 다시 저어 주세요.
약불로 줄여요.`)
  const 약불 = r.steps.filter((s) => s.includes('약불')).length
  chk(약불 === 2, `짧은 줄(「약불로 줄여요」)은 반복돼도 남는다 (${약불}번)`, r.steps.join(' / '))
}

{
  // 💬 후기·감상과 떨어진 괄호 — 창업자 2026-08-13 캡처 실측
  //   ⛔ 「저희집 남편이랑…」이 «4번 단계»로 들어가 있었고,
  //      「(인덕션 8사용)」은 앞 문장에서 떨어져 «다음» 단계 앞에 붙어 있었다.
  //   ⭐ 둘 다 «앞 단계 뒤에» 붙인다 — 지우지 않는다(잘못 지우면 진짜 단계가 사라진다).
  const r = parseRecipeText(
    `삼계탕
[만드는 법]
웍에 불려둔 찹쌀을 깔고 닭다리 한팩을 키친타월로 꼼꼼하게 닦아주세요.
저희집 남편이랑 애들은 퍽퍽살을 싫어해서 요렇게 만들어 주니깐 너무 잘먹고 맛있더라구요.
물 600ml를 붓고 중강불에서 먼저 끓여줍니다.
(인덕션 8사용)
물이 끓어오르면 중불로 낮추고 40분간 폭 끓여주시면 끝이에요.`,
    { fromOcr: true },
  )
  chk(r.steps.length === 3, `후기·괄호가 앞 단계에 붙어 3단계가 된다 (${r.steps.length}단계)`, r.steps.join(' / '))
  chk(has(r.steps, '맛있더라구요'), '후기가 «사라지지 않고» 앞 단계에 남는다', r.steps.join(' / '))
  chk(
    r.steps.some((s) => s.includes('물 600ml') && s.includes('인덕션 8사용')),
    '떨어진 괄호가 «앞» 문장에 붙는다(다음 단계 앞이 아니다)',
    r.steps.join(' / '),
  )
}
{
  // ⛔ 후기처럼 보여도 «첫 줄»이면 삼킬 앞 단계가 없다 — 그대로 남아야 한다
  const r = parseRecipeText(`김치찌개
[만드는 법]
저희집은 신김치를 써요.
돼지고기를 볶아요.`)
  chk(r.steps.length === 2, `첫 줄은 안 삼킨다 (${r.steps.length}단계)`, r.steps.join(' / '))
}

console.log(fail ? `\n❌ 실패 ${fail}건` : '\n✅ 전부 통과')
process.exit(fail ? 1 : 0)
