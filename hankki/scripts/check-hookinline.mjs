// 🧨 훅 안의 «인라인 코드 블록» 지뢰 검사 — 배포 게이트
//
// 📮📮 창업자 2026-08-15 *"**왜 자꾸 백틱을 밟아?** 이거 다하고 이것도 해결해"*
//
// ⭐⭐ 뿌리 = **훅 안에 python3 -c 로 코드를 «큰따옴표에 싸서» 넣는 구조 자체가 지뢰밭이다.**
//    bash 는 큰따옴표 «안»을 그대로 먹는다 —
//      · 백틱          → **명령으로 실행된다**
//      · 큰따옴표      → **그 자리에서 블록이 닫힌다**
//      · $( … ) · $변수 → 치환된다
//    ⛔ 그래서 **주석 한 줄만 잘못 써도 python 이 통째로 깨지고, 훅은 «조용히 통과»한다.**
//       「가뒀다」고 말해 놓고 안 가둬지는 것 — 그게 제일 나쁘다.
//
// ⛔⛔ 2026-08-15 에 실제로 난 사고 (하루에 세 번 밟았다)
//    ⑴ archive-guard.sh 주석에 백틱을 썼다 → python 이 깨지고 **훅이 조용히 통과**
//    ⑵ 고치면서 주석에 큰따옴표를 썼다 → **블록이 그 자리에서 닫혀** 또 깨짐
//    ⑶ 그 상태로 「보관소를 가뒀다」고 창업자에게 보고할 뻔했다
//
// ✅ 그래서 「조심한다」가 아니라 **구조를 바꿨다** — 판정 코드를 **별도 .py 파일**로 뺐다.
//    파일로 빼면 bash 가 그 안을 **아예 안 본다.** 지뢰가 사라진다.
//    ⭐ 이 검사는 그 구조가 되돌아오는 걸 막는다.
//
// ⚖️ **무엇을 막고 무엇을 봐주나 — 시끄러우면 죽은 게이트가 된다**
//    ⛔ **큰따옴표로 연 블록** = 무조건 막는다. 지금 내용이 깨끗해도 «다음 한 줄»에 터진다.
//    ✅ **홑따옴표 한 줄짜리** = 봐준다. 홑따옴표 «안»에서는 백틱·$( 가 **글자일 뿐**이고,
//       홑따옴표를 또 쓰면 그 자리에서 **시끄럽게 깨진다**(조용히 통과하지 않는다).
//       📌 우리가 겪은 사고는 전부 **조용히 통과한 쪽**이었다.
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const 훅폴더 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.claude/hooks')

let bad = 0
let 본것 = 0
let 홑 = 0
for (const 이름 of readdirSync(훅폴더).filter((f) => f.endsWith('.sh')).sort()) {
  const s = readFileSync(path.join(훅폴더, 이름), 'utf8')
  본것++
  // python3 -c  또는  node -e  뒤에 오는 따옴표가 «어느 쪽인지» 본다
  const re = /(python3?|node)\s+-[ce]\s+(["'])/g
  let m
  while ((m = re.exec(s))) {
    const 줄 = s.slice(0, m.index).split('\n').length
    if (m[2] === "'") { 홑++; continue }

    // ── 큰따옴표로 열었다 = 구조 자체가 지뢰 ──
    bad++
    const 시작 = m.index + m[0].length
    // 블록의 끝 = 「줄 맨 앞에 오는 큰따옴표」 — 사람이 «닫으려고» 둔 자리.
    // ⚠️ bash 는 사실 «맨 처음 나오는» 큰따옴표에서 닫는다. 그게 바로 이 검사가 잡는 사고다.
    const 닫는줄 = /\n[ \t]*"/.exec(s.slice(시작))
    const 블록 = s.slice(시작, 닫는줄 ? 시작 + 닫는줄.index : s.length)
    const 지뢰 = []
    if (블록.includes('`')) 지뢰.push('백틱이 «이미» 들어 있다 — 명령으로 실행된다')
    if (블록.includes('"')) 지뢰.push('큰따옴표가 «이미» 들어 있다 — 블록이 거기서 닫힌다')
    if (/\$\(/.test(블록)) 지뢰.push('$( 가 «이미» 들어 있다 — 치환된다')

    console.error(`  ⛔ ${이름}:${줄} — ${m[1]} 블록을 «큰따옴표»로 열었다 (${블록.split('\n').length}줄)`)
    if (지뢰.length) for (const z of 지뢰) console.error(`       · ${z}`)
    else console.error('       · 지금은 깨끗하다 — 그래도 막는다. «다음에 쓸 한 줄»이 터뜨린다')
  }
}

if (bad) {
  console.error(`\n⛔ 훅 인라인 블록에 지뢰 ${bad}곳`)
  console.error('   👉 그 코드를 **별도 파일로 빼고** 훅에서 불러라 —')
  console.error("      TARGETS=$(printf '%s' \"$INPUT\" | python3 \"$HERE/_그이름.py\")")
  console.error('   ⭐ 파일로 빼면 bash 가 그 안을 «아예 안 본다». 조심하는 게 아니라 지뢰를 없애는 것이다.')
  console.error('   📌 2026-08-15 에 이걸로 archive-guard 가 두 번 깨졌고, 훅이 «조용히 통과»했다.\n')
  process.exit(1)
}
console.log(`✅ 훅 인라인 블록 — 훅 ${본것}개에 큰따옴표 블록 0 (홑따옴표 한 줄 ${홑}곳은 통과)`)
