// 🛒📅 주부의 장바구니 «원재료 확인일»이 오래됐나 — 180일 지나면 세션 브리핑에 띄운다 (2026-09-17)
//
// 📮 왜 = 저작권·표시법 답 둘(docs/장바구니-원재료-저작권답-2026-09-17.md) 3) =
//    「포장 우선」 문구만으론 부족하다 · **확인일 저장 ＋ 주기 재확인 ＋ 오류 신고**가 있어야 주의의무를 다한 것.
//    옛 정보 방치 = 위험도 «높음». 확인일(`checked`)은 데이터에 있는데 «다시 보라»고 아무도 안 말하면 그대로 낡는다.
//
// ⭐ 배포는 «안» 막는다 — 재확인은 창업자가 포장을 다시 봐야 하는 일이라, 밤에 배포를 막아 급히 시키면 규칙 8 위반이다.
//    대신 세션 시작 브리핑(latest-hook.mjs · SessionStart)에 «먼저» 뜬다 → 몰아서 한 번에 다시 본다.
//    넘은 것이 없으면 한 줄도 안 찍는다(시끄러운 게이트는 죽은 게이트).
// ⚠️ `curation.js` 는 `import.meta.glob`(Vite 전용)이라 소스 글자를 읽는다(check-benefitwho 와 같은 방식).
//    덩이는 `{ name: … }` 하나로 자르고 그 «안»에서만 checked 를 찾는다 — 다음 덩이의 checked 를 끌어오지 않게.
//
// 실행: node hankki/scripts/check-원재료확인일.mjs            # 전부(확인일 있는 편 · 남은 날)
//       node hankki/scripts/check-원재료확인일.mjs --brief    # 오래된 것이 있을 때만 몇 줄 (브리핑용 · 없으면 조용)
//       DAYS=0 node …                                          # 문턱을 바꿔 «진짜 걸리나» 시험(규칙 12)
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { todayKST } from '../src/today.js'

export const 문턱일 = process.env.DAYS !== undefined ? Number(process.env.DAYS) : 180

const 일수 = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000)

export function 확인일들() {
  const cur = readFileSync(new URL('../src/data/curation.js', import.meta.url), 'utf8')
  // 덩이 = `{ name: '…' … }` — 중괄호가 «안 겹치는» 제품 객체 하나. 그 안에 checked 가 있을 때만 센다.
  return [...cur.matchAll(/\{\s*name:\s*'([^']+)'[^{}]*\}/g)]
    .map((m) => ({ name: m[1], checked: (m[0].match(/\bchecked:\s*'(\d{4}-\d{2}-\d{2})'/) || [])[1] }))
    .filter((x) => x.checked)
}

export function 오래된편(오늘 = todayKST(), 문턱 = 문턱일) {
  return 확인일들().map((x) => ({ ...x, 지남: 일수(x.checked, 오늘) })).filter((x) => x.지남 >= 문턱)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const brief = process.argv.includes('--brief')
  const 오늘 = todayKST()
  const 낡음 = 오래된편(오늘)
  if (brief) {
    if (낡음.length) {
      console.log(`\n🛒📅 장바구니 원재료 확인일이 ${문턱일}일 넘은 편 ${낡음.length}개 — 포장을 다시 보고 \`checked\` 를 갱신한다(몰아서 · 배포는 안 막는다)`)
      낡음.slice(0, 3).forEach((x) => console.log(`   · ${x.name}  (${x.checked} 확인 · ${x.지남}일 지남)`))
      if (낡음.length > 3) console.log(`   · … 외 ${낡음.length - 3}개`)
      console.log('   전체 = `node hankki/scripts/check-원재료확인일.mjs`')
    }
    process.exit(0)
  }
  const 전부 = 확인일들()
  console.log(`🛒📅 원재료 확인일 — 오늘 ${오늘} · 문턱 ${문턱일}일 · 확인일 있는 편 ${전부.length}개`)
  for (const x of 전부) {
    const 지남 = 일수(x.checked, 오늘)
    console.log(`  ${지남 >= 문턱일 ? '⚠️' : '✅'} ${x.name} — ${x.checked} 확인 · ${지남}일 지남${지남 >= 문턱일 ? ' → 다시 본다' : ` (${문턱일 - 지남}일 남음)`}`)
  }
  if (낡음.length) console.log(`\n⚠️ ${낡음.length}개가 문턱을 넘었다 — 배포는 막지 않는다. 몰아서 포장을 다시 보고 checked 를 갱신한다.`)
}
