// ✏️ **요리 33편 검수 «고칠 것 여섯»을 반영한다** (2026-09-03)
//
// 📮 창업자 검수 원문 = `docs/_대기/요리33-창업자검수-2026-09-03.md`
//    판 = https://claude.ai/code/artifact/255a9a86-ca2a-4d31-8c81-938aac923b62
//
// ⭐ 왜 도구로 만드나 = 손으로 고치면 **무엇을 고쳤는지 다음 세션이 모른다.**
//    2026-08-10 에 창업자 검수 38편을 저장 안 해서 다음 날 창업자가 다시 줘야 했다(규칙 20).
//    ⭐ 도구면 «창업자 말 ↔ 내가 한 것»이 코드에 나란히 남고, 다시 돌릴 수 있다.
//
// ⛔⛔ **창업자가 «말한 것»만 고친다. 말의 범위를 넓히지 않는다.**
//    · 들깨궁채나물 걸음1 「기호에 따라 간을 조절해주세요.」 = 팁처럼 보이지만 **말 안 했다 → 그대로 둔다**
//    · 항정살조림 걸음1 「마스터셰프코리아 우승자…로 만들어 진짜 맛있는」 = 잘린 문장이지만 **말 안 했다 → 그대로**
//    📌 v11.17 교훈 — 창업자 말을 넓혀 읽었다가 「일기 사진 칸」을 없앨 뻔했다.
//
// ⛔ 재료 이름·양을 조용히 바꾸지 않는다(절대원칙 30).
//
// 쓰기:  node scripts/_고침-요리33검수-0903.mjs <넣을백업.json> <낼백업.json>
import { readFileSync, writeFileSync } from 'node:fs'

const [입력, 출력] = process.argv.slice(2)
if (!입력 || !출력) { console.error('⛔ node scripts/_고침-요리33검수-0903.mjs <넣을.json> <낼.json>'); process.exit(1) }

// ── 창업자가 적은 것 ↔ 내가 하는 것 ─────────────────────────────
const 고침 = [
  {
    편: '들깨궁채나물', 창업자: '2,3합치자',
    // 「…물에 담가 1시간」 ＋ 「동안 불려줘요.」 → 한 문장. 옛 파서가 쪼갠 자리다.
    한다: (r) => { r.steps.splice(1, 2, `${r.steps[1].trim()} ${r.steps[2].trim()}`) },
    확인: (r) => r.steps[1] === '궁채는 흐르는 물에 2~3번 씻은 뒤, 물에 담가 1시간 동안 불려줘요.',
  },
  {
    편: '급식대가 대패삼겹살 제육볶음', 창업자: '1번은 양념을 넣어 섞어줘요.',
    // ⭐ 걸음1 이 양념 «재료 나열»이었다. 재료 칸에 열두 가지가 «이미 다 있어» 지워도 안 잃는다(열어서 확인했다).
    한다: (r) => { r.steps[0] = '양념을 넣어 섞어줘요.' },
    확인: (r) => r.steps[0] === '양념을 넣어 섞어줘요.',
  },
  {
    편: '급식대가제육볶음', 창업자: '제목은 고춧가루제육볶음',
    한다: (r) => { r.title = '고춧가루제육볶음' },
    확인: (r) => r.title === '고춧가루제육볶음',
  },
  {
    편: '셰프 부대찌개', 창업자: '3.4.합치기',
    // 「…다진마늘 1숟갈, 진간장」 ＋ 「2숟갈, 맛술…」 → 양념 목록이 가운데서 잘려 있었다.
    한다: (r) => { r.steps.splice(2, 2, `${r.steps[2].trim()} ${r.steps[3].trim()}`) },
    확인: (r) => /진간장 2숟갈, 맛술 2숟갈/.test(r.steps[2]),
  },
  {
    편: '김치비빔국수', 창업자: '4.통깨를 뿌려 완성해요  ／  (재료 통깨) "통깨 넣어줘"',
    // 걸음4 가 「통께」 넉 자로 끊겨 있었다(오타 ＋ 미완성).
    // ⭐ 걸음이 「통깨」를 부르는데 **재료 칸엔 없었다** → 창업자에게 물었고 *"통깨 넣어줘"* 를 받았다.
    //    ⛔ **양을 지어내지 않는다** — 창업자가 양을 안 말했고, 이 편의 「참기름」도 양 없이 적혀 있다.
    //       같은 결로 「통깨」만 적는다(절대원칙 30 · 규칙 15).
    한다: (r) => {
      r.steps[3] = '통깨를 뿌려 완성해요'
      if (!r.ingredients.some((x) => String(x).includes('통깨'))) r.ingredients.push('통깨')
    },
    확인: (r) => r.steps[3] === '통깨를 뿌려 완성해요' && r.ingredients.filter((x) => String(x).includes('통깨')).length === 1,
  },
  {
    편: '항정살조림', 창업자: '3.4번 지워',
    // 걸음3 「gg4477 kimggoidol 요즘 냉동제품으로…」 = SNS 아이디 · 걸음4 「모두 보기」 = 캡처에 딸려온 «화면 글자»
    한다: (r) => { r.steps.splice(2, 2) },
    확인: (r) => r.steps.length === 2 && !r.steps.some((s) => /모두 보기|gg4477/.test(s)),
  },
]

const d = JSON.parse(readFileSync(입력, 'utf8'))
const 찾기 = (t) => d.recipes.find((r) => (r.title || '').trim() === t)

let 실패 = 0
console.log('✏️ 창업자 검수 «고칠 것 여섯» 반영\n')
for (const g of 고침) {
  const r = 찾기(g.편)
  if (!r) { console.log(`  ❌ ${g.편} — 못 찾았다`); 실패 += 1; continue }
  const 전 = { 제목: r.title, 걸음: (r.steps || []).length }
  g.한다(r)
  const ok = g.확인(r)
  if (!ok) 실패 += 1
  console.log(`  ${ok ? '✅' : '❌'} ${g.편}`)
  console.log(`     창업자 「${g.창업자}」`)
  console.log(`     걸음 ${전.걸음} → ${r.steps.length}${r.title !== 전.제목 ? ` · 제목 「${전.제목}」 → 「${r.title}」` : ''}`)
}

// ── 안전 검사 — 손댄 데 말고 «그 밖»이 안 바뀌었나 ────────────────
//    ⛔ 2026-09-02 에 이 검사가 「편 수 259 → 259」를 지켜 줬다. 백업은 창업자의 «진짜 데이터»다.
const 원 = JSON.parse(readFileSync(입력, 'utf8'))
if (원.recipes.length !== d.recipes.length) { console.log('\n❌ 편 수가 바뀌었다'); 실패 += 1 }
for (const k of ['folders', 'diary', 'shop', 'fridge', 'profile', 'removedSeedIds']) {
  if (JSON.stringify(원[k]) !== JSON.stringify(d[k])) { console.log(`\n❌ ${k} 가 바뀌었다`); 실패 += 1 }
}
const 손댄편 = new Set(고침.map((g) => g.편))
let 딴데 = 0
for (const a of 원.recipes) {
  if (손댄편.has((a.title || '').trim())) continue
  const b = d.recipes.find((x) => x.id === a.id)
  if (JSON.stringify(a) !== JSON.stringify(b)) 딴데 += 1
}
if (딴데) { console.log(`\n❌ 안 건드려야 할 편 ${딴데}개가 바뀌었다`); 실패 += 1 }

console.log(`\n편 수 ${원.recipes.length} → ${d.recipes.length} · 그 밖 바뀐 편 ${딴데}개`)
if (실패) { console.log(`\n❌ ${실패}곳 실패 — 저장하지 않는다`); process.exit(1) }

writeFileSync(출력, JSON.stringify(d))
console.log(`\n✅ 여섯 다 반영했다\n💾 ${출력}`)

// ⚠️ 창업자에게 알릴 것 — «내가 고치지 않은» 것들
console.log('\n⚠️ 말해야 할 것 (⛔내가 임의로 안 고쳤다)')
console.log('   · 김치비빔국수 — 걸음에 「통깨」가 생겼는데 «재료 칸엔 통깨가 없다»')
console.log('   · 급식대가 대패삼겹살 — 걸음이 「미림 3큰술」이었고 재료는 「미림 2큰술」이다.')
console.log('     걸음을 지웠으니 이제 «재료의 2큰술»이 남는다. 그게 맞나?')
