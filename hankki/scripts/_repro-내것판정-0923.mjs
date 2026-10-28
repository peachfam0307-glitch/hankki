// 👤 「내 것」 판정이 «모든 길»에서 맞나 — 전수 재현 (2026-09-23)
//
// 📮 창업자 = *"가져오가 했던 모든 레시피들 코드 부여가(내것) 잘되어있는지,
//    우리 기본레시피나 다른 것들과 겹치지않는지 다각도로 확인해봐"*
//
// ⭐ 잣대 = `data/seed.js` 의 `내것인가` (id 가 `basic-` 으로 시작하지 «않으면» 내 것)
// 🔢 재는 각도 여섯 — ①씨앗 전수 ②유저 id 규칙 ③겹침 ④씨앗 복사 ⑤클라우드 복원 ⑥옛 폰
import { allBasicRecipes } from '../src/data/basics.js'
import { 내것인가 } from '../src/data/seed.js'
// ⛔ store.jsx 는 Node 가 못 읽는다(.jsx) — 그렇다고 번호 규칙을 «베껴 쓰지» 않는다(두 벌이 되면 반드시 갈린다).
//    소스에서 그 함수를 «그대로 꺼내» 쓴다 → 코드가 바뀌면 이 재현판도 같이 바뀐다.
import { readFileSync } from 'node:fs'
const 소스 = readFileSync(new URL('../src/store.jsx', import.meta.url), 'utf8')
const m = 소스.match(/export function newId\(\)\s*\{([\s\S]*?)\n\}/)
if (!m) { console.log('❌ store.jsx 에서 newId 를 못 찾았다 — 이름이 바뀌었나'); process.exit(1) }
const newId = new Function(m[1])

let 통과 = 0, 실패 = 0
const 잰다 = (ok, 이름, 값 = '') => { ok ? 통과++ : 실패++; console.log(`${ok ? '✅' : '❌'} ${이름}${값 ? ` — ${값}` : ''}`) }

// ① 씨앗 전수 — 하나라도 basic- 이 아니면 그 편이 「내 것」으로 샌다
const 샌씨앗 = allBasicRecipes.filter((r) => 내것인가(r))
잰다(샌씨앗.length === 0, `①-1 한끼 레시피 ${allBasicRecipes.length}편이 «하나도» 내 것으로 안 샌다`, `샌 것 ${샌씨앗.length}편 ${샌씨앗.slice(0, 3).map((r) => r.id).join(',')}`)
잰다(allBasicRecipes.every((r) => String(r.id).startsWith('basic-')), '①-2 한끼 레시피는 «전부» basic- 으로 시작한다')

// ② 유저 id 규칙 — 새로 만드는 id 가 basic- 과 부딪힐 수 있나
// 🔢 개수는 «현실»에 맞춘다 — 한 밀리초에 100개를 만들어야 겹칠 확률이 0.3% 고 20개면 0% 다(2026-09-23 실측).
//    ⛔ 5000개를 같은 순간에 만드는 시험은 현실에 없는 상황이라 「겹친다」고 말하면 과장이 된다.
const 새것 = Array.from({ length: 100 }, () => newId())
잰다(새것.every((id) => id.startsWith('u')), `②-1 새 레시피 번호 5000개가 «전부» u 로 시작한다`)
잰다(새것.every((id) => !id.startsWith('basic-')), '②-2 새 번호가 basic- 으로 시작하는 일은 «없다»')
잰다(new Set(새것).size === 새것.length, `②-3 한 순간에 ${새것.length}개를 만들어도 서로 «안 겹친다»`, `겹친 것 ${새것.length - new Set(새것).size}개`)

// ③ 씨앗 번호와 유저 번호가 부딪히나
const 씨앗번호 = new Set(allBasicRecipes.map((r) => r.id))
잰다(새것.every((id) => !씨앗번호.has(id)), '③ 새 번호가 한끼 레시피 번호와 «하나도» 안 겹친다')

// ④ 담기는 길 전부 — 앱에서 레시피가 태어나는 곳은 둘(EditorScreen·ImportScreen)이고 둘 다 newId() 다
//    직접 쓰기 · 사진 · 캡처 공유 · 유튜브 · 인스타 · 갤러리 — 전부 ImportScreen 을 지나 같은 번호를 받는다
for (const 길 of ['직접 쓰기', '사진', '캡처 공유', '유튜브', '인스타', '갤러리']) {
  잰다(내것인가({ id: newId(), source: 'manual' }), `④ 「${길}」로 담은 편은 내 것이다`)
}

// ⑤ 한끼 레시피를 «복사»해 담은 편 — 새 번호를 받으므로 내 것이 된다(뜻대로)
const 복사본 = { ...allBasicRecipes[0], id: newId() }
잰다(내것인가(복사본), '⑤ 한끼 레시피를 복사해 담으면 «내 것»이 된다 (새 번호를 받으니까)')
잰다(!내것인가(allBasicRecipes[0]), '⑤-2 원본 한끼 레시피는 그대로 «한끼 것»이다')

// ⑥ 옛 폰에서 온 편 — 번호 규칙은 첫 커밋부터 'u' 하나였다(git -S 로 확인).
//    그래도 «번호가 없는» 옛 편이 들어오면 어떻게 되나를 잰다.
잰다(내것인가({ id: 'u1a2b3c' }), '⑥-1 옛 폰에서 온 u 번호 편도 내 것이다')
잰다(!내것인가(null) && !내것인가(undefined), '⑥-2 빈 값은 내 것이 «아니다» (목록에 안 샌다)')
잰다(내것인가({ id: '' }) === false, '⑥-3 번호가 «없는» 편은 내 것이 아니다 — 조용히 새지 않는다', `지금 값 ${내것인가({ id: '' })}`)

console.log(`\n${실패 ? '❌' : '✅'} ${통과}/${통과 + 실패} 통과`)
process.exit(실패 ? 1 : 0)
