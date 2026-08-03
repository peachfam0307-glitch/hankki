// 🎴 자랑카드 컷이 «명단에만» 있고 앱에 안 들어왔는지 검사 — 어기면 배포 차단.
//
// ⛔⛔ 왜 (2026-08-03 사고)
//   창업자가 추석 카드 컷을 **네 개** 콕 집어 줬는데(`cs_b25`·`cs_b27`·`hb02`·`cs_b02`)
//   그중 **`hb02` 가 `src/assets/stickers/photo/` 에 없었다.** 낱개는 `docs/` 에만 있었다.
//   `ShareDrawCard` 의 `seasonCuts()` 는 이렇게 생겼다:
//       .map((k) => ({ name: k + '.png', url: decorUrl(k) }))
//       .filter((e) => e.url)          // ← 없으면 «조용히» 버린다
//   그래서 아무 에러도 안 나고, 추석 곰은 `cs_b25` 하나로만 계속 뽑혔다.
//   창업자가 카드를 보고 *"꼬르곰이 좀 아쉽네.. 눈이 좀 무서워"* 라고 한 게 실은 이 버그였다 —
//   무서운 컷이 나온 게 아니라 **그 컷밖에 없었다.**
//
// ⭐⭐ 배운 것 = 「명단에 적었다」와 「앱에 들어왔다」는 **다른 말이다.**
//   같은 뿌리의 전례가 이미 있다 — 문서엔 「대기」인데 파일은 이미 있던 것(`doc-guard --stale`),
//   그리고 「이름이 명단에 없다」를 「그림이 없다」로 읽은 것(`wc_` 사고).
//   📌 **명단은 사람이 적고, 파일은 사람이 옮긴다. 둘은 반드시 어긋난다 — 그래서 코드가 맞춘다.**
//
// ⚠️ 조용한 실패는 게이트가 없으면 «영원히» 안 드러난다. 화면이 안 깨지기 때문이다.
import { readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const APP = join(dirname(fileURLToPath(import.meta.url)), '..')
const PHOTO = join(APP, 'src/assets/stickers/photo')

const { SEASON_CUTS } = await import(join(APP, 'src/data/cardSeasons.js'))

let bad = 0
const fail = (m) => { console.log(`  ✗ ${m}`); bad++ }

console.log('\n── 자랑카드 컷이 앱에 실제로 있나 ──')

if (!existsSync(PHOTO)) { console.log('  ✗ ⛔ 사진 스티커 폴더를 못 찾았다'); process.exit(1) }
const have = new Set(readdirSync(PHOTO).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4)))

if (!SEASON_CUTS.length) fail('⛔ 계절 카드 목록이 비었다 — cardSeasons.js 를 확인할 것')

let total = 0
for (const s of SEASON_CUTS) {
  const keys = ['gom', 'peng', 'duo'].flatMap((k) => s[k] || [])
  total += keys.length
  const miss = keys.filter((k) => !have.has(k))
  if (miss.length) {
    fail(`⛔ **${s.label} 세트의 ${miss.length}컷이 앱에 없다** → ${miss.join(' · ')}`)
    console.log(`     👉 낱개 PNG 를 src/assets/stickers/photo/ 로 옮길 것.`)
    console.log(`        지금 상태로는 카드에서 «조용히» 빠져서 아무도 못 알아챈다.`)
  } else {
    console.log(`  ok  ${s.label} ${keys.length}컷 전부 앱에 있다`)
  }

  // 🎴 뽑기 자리가 통째로 비면 그 세트는 «있으나 마나»다 — 창이 열려도 아무것도 안 나온다.
  //    ⛔ 실패로는 안 만든다(일부러 비워 두는 때가 있다 — 자산이 아직 없을 때).
  if (!keys.length) console.log(`  ⚠️  ${s.label} 세트가 통째로 비었다 — 창이 열려도 카드가 안 나온다`)
  else if (keys.length < 3) console.log(`  ⚠️  ${s.label} 이 ${keys.length}컷뿐 — 뽑기가 금방 되풀이된다(3컷 이상 권장)`)
}

console.log(bad
  ? `\n❌ 카드 컷 검사 실패 — 명단에만 있고 앱엔 없는 컷이 있다`
  : `\n✅ 카드 컷 통과 — ${SEASON_CUTS.length}개 세트 ${total}컷 전부 앱에 있다`)
process.exit(bad ? 1 : 0)
