// ✍️🛒 **창업자 판정을 장바구니 여는 날짜에 반영한다** — 2026-08-29 1차 검수.
//
//   📮 창업자 판정 원문(검수판 복사본 그대로)
//      · 1주차 「바꾸자」 = *"미소된장이랑 바다숲 뿌려먹는 감태랑 해물이랑 바꾸자,"*
//        ⭐ 「바다숲 뿌려먹는 감태랑 해물이랑」 이 **제품 «이름» 통째**다(랑…랑이 이름에 들어 있다).
//           처음 읽을 때 「감태」와 「해물」 둘로 잘못 읽을 뻔했다 — 이름을 실물로 확인하고 풀었다.
//      · 2주차 「바꾸자」 = *"밍글은 지금 품절이라 몇달 뒤로 보내자,"*
//        → 뒤이어 창업자가 콕 집었다 = *"**밍글이랑 베이비브로콜리바꾸면 되겠다.**"*
//      · 9주차 = *"그라도스커피 콜롬비아 디카페인 원두 이랑 기리쉬케이크랑 바꾸자.,"*
//
//   ⭐ **「A랑 B랑 바꾸자」 = 두 제품의 «여는 날짜»를 맞바꾼다.** 주마다 3개라는 리듬이 안 깨진다.
//      ⛔ 한쪽만 옮기면 어느 주는 2개, 어느 주는 4개가 된다.
//
//   🔒 **안전장치 셋** — 하나라도 어긋나면 «저장하지 않고» 죽는다
//      ① 이름이 정확히 한 줄에만 있나(0개·2개면 실패)
//      ② 둘 다 여는 날짜가 박혀 있나(이미 열린 제품과는 못 바꾼다)
//      ③ 바꾼 뒤 다시 읽어 «진짜로» 자리가 바뀌었나
//
// 쓰는 법
//   node scripts/_판정반영-장바구니-0829.mjs --확인    보기만 한다
//   node scripts/_판정반영-장바구니-0829.mjs --박기    실제로 바꾼다
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const APP = join(dirname(fileURLToPath(import.meta.url)), '..')
const 파일 = join(APP, 'src/data/curation.js')

// [왼쪽 이름조각, 오른쪽 이름조각] — 이 둘의 여는 날짜를 맞바꾼다
const 맞바꿈 = [
  ['미소된장', '뿌려먹는 감태랑 해물이랑'],
  ['바비큐시즈닝', '베이비 브로콜리'],
  ['기리쉬케이크', '콜롬비아 디카페인 원두'],
]

let 줄들 = readFileSync(파일, 'utf8').split('\n')
const 찾기 = (조각) => {
  const 후보 = []
  줄들.forEach((l, i) => {
    const m = l.match(/^\s*\{\s*name:\s*'([^']+)'/)
    if (m && l.includes(조각) && !/^\s*(\/\/|\*)/.test(l)) 후보.push({ i, 이름: m[1] })
  })
  if (후보.length !== 1) {
    console.error(`⛔ 「${조각}」 이 ${후보.length}줄에 걸린다 — 이름조각을 더 좁혀라`)
    process.exit(1)
  }
  const 날 = (줄들[후보[0].i].match(/from:\s*'([^']+)'/) || [])[1]
  if (!날) {
    console.error(`⛔ 「${후보[0].이름}」 엔 여는 날짜가 없다 — 이미 열린 제품과는 못 바꾼다`)
    process.exit(1)
  }
  return { ...후보[0], 날 }
}

const 할일 = 맞바꿈.map(([a, b]) => ({ a: 찾기(a), b: 찾기(b) }))
console.log('\n🔁 맞바꿀 짝')
for (const { a, b } of 할일) {
  console.log(`  ${a.날}  ${a.이름}`)
  console.log(`  ${b.날}  ${b.이름}`)
  console.log(`     ↓`)
  console.log(`  ${b.날}  ${a.이름}   ·   ${a.날}  ${b.이름}\n`)
}

if (!process.argv.includes('--박기')) {
  console.log('👀 «보기만» 했다. 진짜로 바꾸려면 --박기')
  process.exit(0)
}

for (const { a, b } of 할일) {
  줄들[a.i] = 줄들[a.i].replace(/from:\s*'[^']*'/, `from: '${b.날}'`)
  줄들[b.i] = 줄들[b.i].replace(/from:\s*'[^']*'/, `from: '${a.날}'`)
}
const 새문 = 줄들.join('\n')

// 🔒 ③ 진짜로 바뀌었나 — 저장 «전»에 새 글에서 다시 읽어 본다
줄들 = 새문.split('\n')
for (const { a, b } of 할일) {
  const 새a = (줄들[a.i].match(/from:\s*'([^']+)'/) || [])[1]
  const 새b = (줄들[b.i].match(/from:\s*'([^']+)'/) || [])[1]
  if (새a !== b.날 || 새b !== a.날) {
    console.error(`⛔ 「${a.이름}」↔「${b.이름}」 이 안 바뀌었다 — 저장하지 않는다`)
    process.exit(1)
  }
}
writeFileSync(파일, 새문)
console.log(`✅ ${할일.length}쌍을 맞바꿨다.`)
