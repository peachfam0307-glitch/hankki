#!/usr/bin/env node
// 🔒🔒 **그림 표를 고쳤으면 BASICS_VERSION 도 «반드시» 올린다 — 게이트** (2026-09-14 신설)
//
// 📮 창업자 = *"13.39 인데 만두 아직 그대로야"* → *"진짜 이거 너무심하다.. 어제부터 지금까지 12시간동안 이러고있네"*
//
// 🌲🌲 **뿌리 — 그림 표는 「번호가 오를 때만」 돈다.**
//    `store.jsx` 의 `migrateBasics` 는 맨 앞에서 이렇게 빠져나간다:
//        if (v >= BASICS_VERSION) { ...새로 열린 편만 더하고... return }
//    ⛔ **그 아래에 그림 고치는 표가 넷이나 있다**(ICON_FORCE_V38 · SWAP_V88/FORCE_V88 · SWAP_GR · SWAP_0827).
//       → 번호가 같으면 표를 고쳐도 **폰에서 하나도 안 돈다.**
//
// 🔢 실제로 일어난 일 (2026-09-14 · 창업자를 세 번 헛걸음시켰다)
//    · v13.35 — 이름표 규칙만 고침        → 안 바뀜(레시피에 icon 이 박혀 있어서)
//    · v13.37 — 레시피 icon 까지 고침      → 안 바뀜(제목 강제표가 다시 덮어서)
//    · v13.39 — 표를 고쳤으나 «번호를 안 올림» → 안 바뀜(**이 게이트가 막는 바로 그것**)
//
// ⭐ 그래서 잰다 = 「`store.jsx` 의 그림 표가 바뀌었는데 `BASICS_VERSION` 이 그대로면 죽는다」.
//    ⛔ 「내가 기억해서 올리겠다」는 답이 아니다 — 12시간이 그 답의 값이었다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/check-iconforce.mjs
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const 읽기 = (p) => { try { return readFileSync(path.join(root, p), 'utf8') } catch { return '' } }

// 📌 그림 표만 떼어 낸다 — 표 «안»이 바뀌었는지만 본다(딴 곳이 바뀐 건 상관없다)
const 표뽑기 = (src) => {
  const 덩이 = []
  for (const m of src.matchAll(/const (ICON_(?:FORCE|SWAP)[A-Z0-9_]*) = \{/g)) {
    const i = m.index
    덩이.push(m[1] + src.slice(i, src.indexOf('\n  }', i)).replace(/\/\/[^\n]*/g, '').replace(/\s+/g, ''))
  }
  return 덩이.sort().join('\n')
}
const 번호뽑기 = (src) => { const m = src.match(/BASICS_VERSION = (\d+)/); return m ? Number(m[1]) : null }

// 🔎 「무엇과 견주나」 = 원격 배포 갈래(＝지금 유저 폰에 깔린 판)
//   ⛔ 마지막 커밋과 견주면 «이번 커밋에서 둘 다 안 고쳤다»만 보게 된다 —
//      정작 문제는 «앞 판에서 표만 고치고 번호를 안 올린 것»이라 그걸 못 잡는다.
const 갈래 = 'origin/claude/chatgpt-conversation-link-kvn5ph'
let 옛store = '', 옛basics = ''
try {
  옛store = execSync(`git show ${갈래}:hankki/src/store.jsx`, { cwd: path.join(root, '..'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  옛basics = execSync(`git show ${갈래}:hankki/src/data/basics.js`, { cwd: path.join(root, '..'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
} catch {
  console.log('[iconforce] ⏭ 원격 갈래를 못 읽었다(오프라인 등) — 견줄 것이 없어 넘어간다')
  process.exit(0)
}

const 지금표 = 표뽑기(읽기('src/store.jsx'))
const 옛표 = 표뽑기(옛store)
const 지금번호 = 번호뽑기(읽기('src/data/basics.js'))
const 옛번호 = 번호뽑기(옛basics)

if (!지금표 || !지금번호) {
  console.error('[iconforce] ❌ 표나 번호를 못 읽었다 — 파일 모양이 바뀌었다. 이 도구를 그 모양에 맞춰라.')
  console.error('   ⛔ 「못 읽어서 통과」가 되면 안 된다 — 그래서 여기서 죽는다.')
  process.exit(1)
}

if (지금표 === 옛표) {
  console.log(`[iconforce] ✅ 그림 표가 안 바뀌었다 (BASICS_VERSION ${지금번호})`)
  process.exit(0)
}
if (지금번호 > 옛번호) {
  console.log(`[iconforce] ✅ 그림 표가 바뀌었고 번호도 올랐다 (v${옛번호} → v${지금번호}) — 폰에 닿는다`)
  process.exit(0)
}

console.error(`\n[iconforce] ❌❌ **그림 표를 고쳤는데 BASICS_VERSION 이 그대로다** (v${지금번호})\n`)
console.error('   ⛔ 이대로 내보내면 **이미 깔린 폰에서는 아무 일도 안 일어난다.**')
console.error('      store.jsx 의 씨앗 맞추기가 「번호가 같네」 하고 맨 앞에서 빠져나가는데,')
console.error('      그림 고치는 표 넷이 전부 그 «아래»에 있기 때문이다.')
console.error('')
console.error('   🔢 2026-09-14 에 이걸로 창업자를 세 번 헛걸음시켰다 — 12시간이 그 값이었다.')
console.error('')
console.error('   👉 `src/data/basics.js` 맨 위 BASICS_VERSION 을 «＋1» 하고 무엇을 바꿨는지 적을 것.')
process.exit(1)
