// 🍳 음식 그림 프롬프트 «고정» 틀 — 창업자 2026-11-23 「매번 바꾸지말고」 · 「크레딧 너무 아까워」
// ⛔ 이 파일의 문장은 창업자 확정본이다(11/23 죽 6장 「오 조아」). 내 판단으로 고치지 않는다.
//    바꿀 일이 생기면 1장만 시험 → 창업자 OK → 그때 여기를 고친다.
// 쓰는 법: node hankki/scripts/음식프롬프트.mjs "<음식 영어 설명>" [--밥] [--죽] [--다짐]
//   ⚠️ --밥 = 밥알이 보이는 음식(김밥·볶음밥)만 · 밥 없는 음식에 밥 문장을 넣으면 밥을 그려 넣는다(11/23 마녀스프에 밥알 생김)
//   ⭐ 음식 설명은 recipe.mjs 로 레시피를 열어 «재료 모양 그대로» 쓴다
const 앞 = 'Real food photograph, 3/4 angle, soft natural daylight, plain pure white background (#FFFFFF), isolated: '
const 몸 = 'Looks exactly like real food in a real photo, natural textures, nothing stylized or patterned.'
const 밥 = 'Rice grains look soft, irregular and naturally clumped, never like uniform beads, dots or a repeating pattern.'
const 죽 = 'The porridge is silky and smooth, rice fully softened and melted into the porridge so individual grains are barely visible, not lumpy, not clumped, never like uniform beads, dots or a repeating pattern.'
const 다짐 = 'The minced meat is in tiny loose flecks, no meatballs, no round lumps, not crumbly clusters.'
const 끝 = 'Noodles, strands and greens are simply scooped in loose natural clumps, no stacking, no lattice or crisscross, no repeating texture. No disturbing surface patterns on meat. No sesame seeds, no text. The whole dish is fully visible and centered, small in the frame with wide empty white margin on every side.'

export function 음식프롬프트(음식, { 죽임 = false, 다짐임 = false, 밥임 = false } = {}) {
  return [앞 + 음식.replace(/\.$/, '') + '.', 몸, 죽임 ? 죽 : 밥임 ? 밥 : '', 다짐임 ? 다짐 : '', 끝].filter(Boolean).join(' ')
}

if (process.argv[1]?.endsWith('음식프롬프트.mjs')) {
  const 인자 = process.argv.slice(2)
  const 음식 = 인자.find((x) => !x.startsWith('--'))
  if (!음식) { console.error('쓰는 법: node hankki/scripts/음식프롬프트.mjs "<음식 영어 설명>" [--죽] [--다짐]'); process.exit(1) }
  console.log(음식프롬프트(음식, { 죽임: 인자.includes('--죽'), 다짐임: 인자.includes('--다짐'), 밥임: 인자.includes('--밥') }))
}
