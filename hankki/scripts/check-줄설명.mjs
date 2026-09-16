// 🍆🍆 [창업자가 잡았다 2026-09-16] **주간 줄의 «설명»과 «실제 편»이 어긋나면 배포를 막는다**
//
// 📮 창업자 = *"무침과볶음ㅠㅠ 덮밥x"*
//
// ⛔⛔ **무슨 일이 났나** — 2026-09-12 에 창업자가 *"가지덮밥빼고 무침"* 이라 해서 `ids` 를 바꿨는데
//    **`why`(설명 문구)를 안 고쳤다.** 그래서 나흘 동안 홈에 이렇게 떴다:
//       글 = 「가을 가지는 살이 차고 달아요. **덮밥**과 볶음 두 가지로.」
//       편 = **쫄깃한 가지무침** · 가지볶음
//    📌 **글이 유저에게 거짓말을 하고 있었다.** 그리고 아무 검사도 안 막고 있었다.
//
// 🌲 **뿌리 = `ids` 와 `why` 가 «따로» 산다.** 한 줄에 나란히 있지만 서로를 모른다.
//    하나만 고치면 «조용히» 어긋나고, 사람 눈으로는 매번 대조해야 안다(＝반드시 놓친다).
//
// ⭐⭐ **잣대 = 설명에 «요리 이름 낱말»이 나오면 그 낱말이 실제 편 제목에도 있어야 한다.**
//    ⛔ 「밥반찬」의 「밥」·「국물」의 「국」처럼 **더 긴 낱말의 일부면 안 센다** —
//       안 그러면 오탐이 나고, 시끄러운 게이트는 죽은 게이트다(실제로 처음 판이 둘을 헛잡았다).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const 여기 = dirname(fileURLToPath(import.meta.url))
const { allBasicRecipes } = await import(join(여기, '../src/data/basics.js'))
const 제목 = new Map(allBasicRecipes.map((r) => [r.id, r.title || '']))

// 🍳 설명에 나오면 「그 요리가 있다」는 뜻이 되는 낱말들
const 요리말 = ['덮밥', '무침', '볶음', '전골', '조림', '찜', '구이', '찌개', '샐러드', '국수', '장아찌', '탕']
// ⛔ 이 말 «안»에 들어 있으면 요리 이름이 아니다 — 「밥반찬」의 밥, 「국물」의 국
const 딴뜻 = ['밥반찬', '국물', '볶음밥용', '찜기']

const 본문 = readFileSync(join(여기, '../src/data/weekly.js'), 'utf8')
const 잡힘 = []
for (const m of 본문.matchAll(/why:\s*'([^']*)'[\s\S]{0,500}?ids:\s*\[([^\]]*)\]/g)) {
  const why = m[1]
  const ids = (m[2].match(/'([^']+)'/g) || []).map((s) => s.replace(/'/g, ''))
  if (!ids.length) continue
  const 이름들 = ids.map((i) => 제목.get(i) || '').join(' ')
  if (!이름들.trim()) continue          // 제목을 못 찾으면 판정하지 않는다(다른 게이트 몫)

  // 딴 뜻으로 쓰인 자리는 지우고 본다
  let 볼글 = why
  for (const d of 딴뜻) 볼글 = 볼글.split(d).join('')

  for (const 말 of 요리말) {
    if (볼글.includes(말) && !이름들.includes(말)) {
      잡힘.push({ why, 이름들, 말 })
      break
    }
  }
}

if (잡힘.length) {
  console.error('\n🍆 **줄 설명 게이트 — 글과 실제 편이 어긋난다**\n')
  for (const x of 잡힘) {
    console.error(`   ⛔ 글  = ${x.why}`)
    console.error(`      편  = ${x.이름들}`)
    console.error(`      ⤷ 글에 「${x.말}」이 있는데 편 제목엔 없다\n`)
  }
  console.error('   📮 창업자 2026-09-16 = "무침과볶음ㅠㅠ 덮밥x"')
  console.error('   ⛔ `ids` 를 고치면 `why` 도 같이 고친다 — 둘은 한 몸이다.\n')
  process.exit(1)
}
console.log('✅ 줄 설명 — 글과 실제 편이 맞는다')
