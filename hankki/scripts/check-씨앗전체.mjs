// 🍲 «폰엔 있는데 씨앗엔 없는 편»이 갱신을 못 받는 것을 막는 게이트 (2026-09-16 신설)
//
// 📮 창업자 폰 캡처 = 두부참치찌개가 옛 판(물 450ml · 올리고당 · 참기름 · 깨)으로 떠 있었다.
//    재료도 만드는 법도 통째로 갈고 BASICS_VERSION 을 160까지 올렸는데 **한 글자도 안 바뀌었다.**
//
// 🌲 뿌리 = `store.jsx` 의 `seedById` 가 `basicRecipes`(＝`from` 이 지난 편만 · 99편)로 만들어져 있었다.
//    두부참치찌개는 `from: '2026-10-12'` 라 그 목록에 없어서 **갱신 표들이 전부 건너뛰었다.**
//    ⭐ 「한 번 열렸다가 여는 날짜를 뒤로 민 편」은 폰에 남아 계속 보이는데 **갱신만 안 닿는다.**
//
// ⭐⭐ 왜 «게이트»인가 — 오늘 고쳐도 다음 사람이 `basicRecipes` 로 되돌리면 똑같이 터진다.
//    그리고 그때도 **아무 검사도 안 걸린다**(오늘 실제로 그랬다). 규칙 19 그대로 — 알리지 말고 «막는다».
//
// ⛔ 「고치기」와 「열기」는 다른 일이다
//    · 새로 «넣는» 것(`add`·`opened`)은 `basicRecipes` 가 맞다 — 안 열린 편을 당겨 열면 안 된다
//    · 이미 있는 것을 «고치는» 것(`seedById`)은 `allBasicRecipes` 라야 한다
import { readFileSync } from 'node:fs'

const store = readFileSync(new URL('../src/store.jsx', import.meta.url), 'utf8')
const bad = []

// ① 고치는 표의 뿌리 — seedById 는 반드시 전체 목록으로
const m = store.match(/const\s+seedById\s*=\s*new Map\(\s*(\w+)\.map/)
if (!m) {
  bad.push('store.jsx 에서 `seedById` 를 못 찾았다 — 이름이 바뀌었으면 이 게이트도 같이 고칠 것')
} else if (m[1] !== 'allBasicRecipes') {
  bad.push(
    `store.jsx — \`seedById\` 가 \`${m[1]}\` 로 만들어져 있다.\n` +
    '   ⛔ `basicRecipes` 는 「`from` 이 지난 편」만 들고 있다 → **아직 안 열린 편은 영영 갱신을 못 받는다.**\n' +
    '      (폰에 남아 계속 보이는데 고침만 안 닿는다 — 2026-09-16 두부참치찌개가 그랬다)\n' +
    '   ✅ `const seedById = new Map(allBasicRecipes.map((s) => [s.id, s]))'
  )
}

// ② 그 목록을 실제로 import 하고 있나
if (!/import\s*\{[^}]*\ballBasicRecipes\b[^}]*\}\s*from\s*'\.\/data\/basics'/.test(store)) {
  bad.push("store.jsx — `allBasicRecipes` 를 `./data/basics` 에서 import 하지 않는다")
}

// ③ 손댄 편(touched)도 «만드는 법»까지 맞춰지나
//    ⛔ 재료만 갈고 걸음을 안 갈면 「해물가루육수를 넣으라면서 450ml 를 끓이라는」 섞인 판이 된다.
//       📌 2026-09-12 가지 사고와 같은 자리다 — 재료만 바꾸면 만드는 법이 거짓말이 된다.
const touched갱신 = store.split(/\n/).join('\n').match(/!r\.touched[\s\S]{0,700}?\n\s*\}\)/g) || []
if (!touched갱신.some((블록) => /steps:\s*s\.steps/.test(블록))) {
  bad.push(
    'store.jsx — 손댄 편(`touched`)을 시드에 맞추는 자리에서 **`steps` 를 안 갈아끼운다.**\n' +
    '   ⛔ 재료만 새것이 되고 만드는 법이 옛것이면 둘이 어긋난 「섞인 판」이 된다.'
  )
}

if (bad.length) {
  console.error(`\n⛔ 이미 깔린 폰이 갱신을 못 받을 수 있다 — ${bad.length}건\n`)
  bad.forEach((b) => console.error('  · ' + b + '\n'))
  process.exit(1)
}
console.log('✅ 씨앗 갱신 — 안 열린 편도 · 손댄 편의 만드는 법도 닿는다')
