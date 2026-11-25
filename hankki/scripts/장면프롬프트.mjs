// 🎨 캐릭터 «장면» 그림 프롬프트 «고정» 틀 — 창업자 2026-11-25 「앞으로 첫 장면같은 그림책 풍으로 뽑아줘. 프롬프트에 넣어줘.」
// 기준 그림 = 테마 릴스 첫 장(냉장고 앞 꼬르곰 · job a3b51940 · 창업자 「훨씬좋아」) = 인스타/테마-릴스-세이지-1125.mp4 첫 컷
// ⛔ 이 문장은 창업자 확정본이다. 내 판단으로 고치지 않는다(바꿀 땐 1장 시험 → 창업자 OK → 여기 고침).
// ⭐ 캐릭터는 «정본 그림을 참고 이미지로 꼭 넣는다» (꼬르곰 = src/assets/sharepool/gom_*.png · ui/wave/gom_*.png)
//    AI 혼자 그리면 「AI 같다」(창업자 2026-11-25 첫장 꼬르곰)
// 쓰는 법: node hankki/scripts/장면프롬프트.mjs "<장면 영어 설명>" [--곰] [--뾰미] [--펭펭]
const 그림체 = 'ART STYLE: a warm cozy children\'s picture-book illustration. A fully painted scene with a real background (a cozy room or place with simple furniture and props), soft hand-painted texture, gentle warm lighting with soft glows and light shadows, thin warm-brown outlines, a calm warm cream, beige and soft sage-green palette. Cute and gentle, never 3D, never glossy, never plastic or plush-toy looking, never a flat sticker on an empty background.'
const 캐릭터 = {
  곰: 'Use the bear in the reference images as the exact same character (꼬르곰): fluffy curly-textured honey-orange fur drawn with soft wavy strokes, round head, small round ears with pink inner ears, small black dot eyes, small dark brown oval nose, cream muzzle, rosy cheek blush, white chef hat, cream striped apron with a fried-egg pocket and a white bow at the back, big head with a short chubby body. Do not redesign or restyle it.',
  뾰미: 'Use the fennec fox girl in the reference images as the exact same character (뾰미): keep her face, ears, outfit and colors identical to the references. Do not redesign or restyle her.',
  펭펭: 'Use the penguin in the reference images as the exact same character (펭펭): keep its face, hair, outfit and colors identical to the references. Do not redesign or restyle it.',
}
const 끝 = 'COMPOSITION: vertical, characters large and clearly readable, generous calm empty space at the top for a headline. No text, no letters, no logos, no watermark.'
export function 장면프롬프트(장면, 누구 = []) {
  return [그림체, ...누구.map((k) => 캐릭터[k]).filter(Boolean), 'SCENE: ' + 장면.replace(/\.$/, '') + '.', 끝].join('\n\n')
}
if (process.argv[1]?.endsWith('장면프롬프트.mjs')) {
  const 인자 = process.argv.slice(2), 장면 = 인자.find((x) => !x.startsWith('--'))
  if (!장면) { console.error('쓰는 법: node hankki/scripts/장면프롬프트.mjs "<장면 영어 설명>" [--곰] [--뾰미] [--펭펭]'); process.exit(1) }
  console.log(장면프롬프트(장면, ['곰', '뾰미', '펭펭'].filter((k) => 인자.includes('--' + k))))
}
