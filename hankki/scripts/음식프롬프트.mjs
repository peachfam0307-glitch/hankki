// 🍳 음식 그림 프롬프트 «고정» 틀 — 창업자 2026-11-23 「매번 바꾸지말고」 · 「크레딧 너무 아까워」
// ⛔ 이 파일의 문장은 창업자 확정본이다(11/23 죽 6장 「오 조아」). 내 판단으로 고치지 않는다.
//    바꿀 일이 생기면 1장만 시험 → 창업자 OK → 그때 여기를 고친다.
// 쓰는 법: node hankki/scripts/음식프롬프트.mjs "<음식 영어 설명>" --레시피 <이름조각> [--밥] [--죽] [--다짐] [--국] [--데침]
//   ⭐ --레시피 를 «늘» 붙인다 = 뽑기 전에 레시피를 열어 보이고, 데치·삶 → --데침 · 국/탕/찌개 → --국 을 저절로 켠다
//   ⚠️ --밥 = 밥알이 보이는 음식(김밥·볶음밥)만 · 밥 없는 음식에 밥 문장을 넣으면 밥을 그려 넣는다(11/23 마녀스프에 밥알 생김)
//   ⭐ 음식 설명은 recipe.mjs 로 레시피를 열어 «재료 모양 그대로» 쓴다
const 앞 = 'Real food photograph, 3/4 angle, soft natural daylight, plain pure white background (#FFFFFF), isolated: '
const 몸 = 'Looks exactly like real food in a real photo, natural textures, nothing stylized or patterned. It looks like a casual smartphone photo of real homemade food, slightly uneven and imperfect, never like a plastic food model, a display replica or an illustration.'   // ➕ 창업자 2026-11-25 「실제그림처럼. 모형같지않게」 · 오믈렛·김국수 다시 뽑아 「좋아」
const 밥 = 'Rice grains look soft, irregular and naturally clumped, never like uniform beads, dots or a repeating pattern. Rice never clumps into flower, petal or snowflake shapes, and grains are never individually drawn or outlined; it looks like plain real cooked rice.'   // ➕ 창업자 2026-11-26 「밥알 꽃모양으로 뭉치는 것 금지. 밥알 모양인위적으로 그리는 것도 금지」
const 죽 = 'The porridge is silky and smooth, rice fully softened and melted into the porridge so individual grains are barely visible, not lumpy, not clumped, never like uniform beads, dots or a repeating pattern.'
const 다짐 = 'The minced meat is in tiny loose flecks, no meatballs, no round lumps, not crumbly clusters.'
const 데침 = 'The blanched or boiled vegetables are soft, limp and wilted, gently curving and bending naturally, never stiff or straight like sticks.'   // ➕ 창업자 2026-11-26 「나물류중에 데쳐서 무치는 종류는 부드럽게 그리면 더 좋을 듯해」 → --데침
const 국 ='Green onion is cut on a long diagonal bias into slanted oval slices (Korean eoseut-sseolgi), never round rings.'   // ➕ 창업자 2026-11-26 「파를 어슷썰면 더 좋겠다- 다음에 탕이나 국 뽑을때」 → --국
// ➕ 창업자 2026-11-26 「실제음식처럼 뽑는거 제일 중요. 면이나, 나물류 격자배치금지(손으로 담은 것 처럼) 고기표면에 징그러운(동그란)무늬 금지」
const 끝 = 'Noodles, strands and greens are simply scooped in loose natural clumps, no stacking, no lattice or crisscross, no repeating texture. Noodles and namul look picked up by hand and dropped onto the plate in a soft relaxed mound, strands curving and lying in different directions, never arranged in a grid, never piled into a net, mesh or woven stack. No disturbing surface patterns on meat, no round spots, dots or circular bumps on the meat surface. No sesame seeds, no text. The whole dish is fully visible and centered, small in the frame with wide empty white margin on every side.'

export function 음식프롬프트(음식, { 죽임 = false, 다짐임 = false, 밥임 = false, 국임 = false, 데침임 = false } = {}) {
  return [앞 + 음식.replace(/\.$/, '') + '.', 몸, 죽임 ? 죽 : 밥임 ? 밥 : '', 다짐임 ? 다짐 : '', 국임 ? 국 : '', 데침임 ? 데침 : '', 끝].filter(Boolean).join(' ')
}

if (process.argv[1]?.endsWith('음식프롬프트.mjs')) {
  const 인자 = process.argv.slice(2)
  // ➕ 창업자 2026-11-26 「뽑기전에 레시피 확인하고, 데치거나 삶는 나물을 부드럽게 휘게 그려줘」
  //    --레시피 <이름조각> = 레시피를 «열어» 재료·만드는 법을 찍고, 데치·삶 이 있으면 --데침 · 국/탕/찌개면 --국 을 «저절로» 켠다
  const 레i = 인자.indexOf('--레시피')
  if (레i >= 0) {
    const 이름 = 인자.splice(레i, 2)[1]
    const { 레시피들 } = await import('./recipe.mjs')
    const r = 레시피들().find((x) => x.title.includes(이름))
    if (!r) { console.error(`⛔ 레시피 «${이름}» 를 못 찾았다 — 확인하고 뽑는다`); process.exit(1) }
    const 걸음 = (r.steps || []).map((s) => (typeof s === 'string' ? s : s.text || '')).join(' ')
    console.error(`🍳 ${r.title} · ${r.category || ''}\n   재료: ${(r.ingredients || []).map((i) => (typeof i === 'string' ? i : i.name || '')).join(', ')}\n   만드는 법: ${걸음}`)
    if (/데치|데쳐|삶/.test(걸음) && !인자.includes('--데침')) { 인자.push('--데침'); console.error('   ➕ 데치·삶 있음 → --데침 켬') }
    if (/(국|탕|찌개)$/.test(r.title) && !인자.includes('--국')) { 인자.push('--국'); console.error('   ➕ 국물 요리 → --국 켬') }
  }
  const 음식 = 인자.find((x) => !x.startsWith('--'))
  if (!음식) { console.error('쓰는 법: node hankki/scripts/음식프롬프트.mjs "<음식 영어 설명>" [--죽] [--다짐]'); process.exit(1) }
  console.log(음식프롬프트(음식, { 죽임: 인자.includes('--죽'), 다짐임: 인자.includes('--다짐'), 밥임: 인자.includes('--밥'), 국임: 인자.includes('--국'), 데침임: 인자.includes('--데침') }))
}
