// 🛑🛑 「지금 보고 있는 게 «방금 고친 화면»인가」 — 재현판이 맨 먼저 부르는 관문
//
// ⛔⛔ 2026-08-06 실제 사고: `npm run build` 가 **exit 1** 로 죽었는데 그걸 못 보고
//    재현판 넷을 돌려 **전부 ✅** 를 받았다. 넷 다 **옛 `dist/`** 를 보고 있었다.
//    (2026-08-04 에도 같은 일이 있어 `smoke.mjs` 엔 이 검사를 박아뒀는데,
//     **재현판(`_repro-*`·`_shot-*`)엔 안 박아** 구멍이 그대로 남아 있었다.)
//
// 📌 재현판은 «고친 걸 확인하려고» 도는 것이다 — 옛 화면을 보고 통과하면 **거짓 통과**다.
//    거짓 통과는 「검사 없음」보다 나쁘다. 안 고쳐진 걸 고쳤다고 믿게 만든다.
//
// 🧪 쓰는 법 = 재현판 맨 위에 한 줄:  `import './_fresh.mjs'`
import { statSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.join(new URL('..', import.meta.url).pathname)

const newestMtime = (dir) => {
  let t = 0
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    if (f.name.startsWith('.')) continue
    const p = path.join(dir, f.name)
    t = Math.max(t, f.isDirectory() ? newestMtime(p) : statSync(p).mtimeMs)
  }
  return t
}

const idx = path.join(ROOT, 'dist/index.html')
if (!existsSync(idx)) {
  console.error('\n⛔ `dist/` 가 없다 — 재현판은 빌드 결과를 띄운다. 먼저 `npm run build`.\n')
  process.exit(1)
}
const dist = statSync(idx).mtimeMs
const src = newestMtime(path.join(ROOT, 'src'))
if (src > dist) {
  const min = Math.round((src - dist) / 60000)
  console.error(`\n⛔⛔ **dist 가 src 보다 ${min}분 낡았다 — 이 재현판은 «옛 화면»을 보고 있다.**`)
  console.error('   빌드가 깨져서 dist 가 안 바뀐 것일 수도 있다(2026-08-04·08-06 두 번 다 그랬다).')
  console.error('   👉 `npm run build` 를 «exit code 0» 으로 통과시킨 뒤 다시 돌릴 것.\n')
  process.exit(1)
}
