// 📋📋 «검수판은 무조건 «복사»가 돼야 한다» — 배포 게이트
//
// ⭐⭐ 왜 (창업자 2026-08-18)
//   📮 *"검수판 확실히 저장되지?"* → *"이판은 저장이 안된다고 되어있어 아직도!! 제발 확인좀해"*
//   📮 → *"저장하고 앞으로 검수판 올릴때 **무조건 복사되는 걸로** 올려"*
//
// ⛔⛔ **그날 사고** — 판에 artifact-sync 태그를 넣고 「이제 저장된다」고 말했다. **안 됐다.**
//    런타임 계약 문서에 **"LIVE DOCS ONLY — sync regions"** 라고 박혀 있다:
//    그 태그는 «라이브 문서»로 만든 아티팩트에서만 돌고, 보통 아티팩트에선
//    region 이 artifact-sync-state="off" 로 꺼진다. **우리 판은 보통 아티팩트다.**
//    📌 나는 «태그가 있는 것»만 보고 «도는지»를 안 봤다 — 반복 실수 패턴 🅰 그대로.
//
// ✅ 그래서 판정 잣대를 바꾼다 — 「저장 장치가 있나」가 아니라 **「창업자가 «나에게 보낼» 길이 있나」**.
//    · localStorage        = 새로고침해도 안 날아간다 (창업자가 겪은 삽질)
//    · 「결과 복사」 버튼    = 고른 것을 글로 만들어 채팅에 붙일 수 있다  ← ⭐이게 없으면 헛수고다
//    · 복사 실패 폴백       = clipboard.writeText 는 «성공으로 resolve 되고도» 실패한다(v10.97 사고).
//                            그래서 글을 화면에도 띄워야 한다.
//
// ⛔ 시끄러우면 죽는다 → **고를 것이 있는 판만** 본다(체크·라디오가 있는 판).
//    보여주기만 하는 판은 복사할 게 없다.
//
// 쓰기:  node hankki/scripts/check-pancopy.mjs
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const APP = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIR = join(APP, 'scripts')

const files = readdirSync(DIR).filter((f) => /^_판-.*\.m?js$/.test(f))

// 판이 «만들어내는» HTML 덩어리만 본다 — 파일 전체를 보면 playwright 시드 코드까지 세어 거짓 통과가 난다
const htmlBlocks = (t) =>
  (t.match(/`[^`]{200,}`/gs) || []).filter((b) => /<(div|html|body|label|input|button)/i.test(b))

const 고를것 = /<input[^>]*type=["']?(radio|checkbox)/i
const 복사 = /결과 복사|clipboard|execCommand\(\s*['"]copy/i
const 남기기 = /localStorage|sessionStorage|indexedDB/i
// ⚠️ [2026-08-31] `Range` + `getSelection()` 도 «진짜» 폴백이다 — 글을 골라 줘서 길게 눌러 복사한다.
//    카와이 전수 판정판이 그 방식인데 이 잣대가 몰라서 걸렸다. **폴백이 없던 게 아니라 패턴이 모자랐다.**
//    ⛔ 그렇다고 넓히기만 하면 이빨이 빠진다 → `selectNodeContents` 처럼 «콕 집는» 말만 더한다.
const 폴백 = /fallback|textarea|out\.value|select\(\)|selectNodeContents/i

// ⛔⛔ **첫 판은 «아무것도 안 재는 게이트»였다 — 규칙 12 로 바로 잡혔다.**
//    파일 «전체»로 판정했더니 **내가 주석에 적어둔 "clipboard.writeText"·"localStorage"** 에 걸려
//    복사 코드를 통째로 지운 «옛 판»까지 exit 0 으로 통과시켰다.
//    📌 안 돌려봤으면 「게이트를 걸었다」고 창업자에게 보고할 뻔했다. 오늘만 세 번째 같은 모양이다.
// ✅ 그래서 ⑴**주석을 걷어내고** ⑵**판이 «만들어내는» HTML 덩어리 안에서만** 찾는다.
//    우리 <script> 는 그 템플릿 리터럴 «안»에 있으므로 정상 판은 잡히고, 빠지면 안 잡힌다.
const 주석뺀것 = (t) => t.replace(/^\s*\/\/.*$/gm, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ')

const bad = []
for (const f of files) {
  const t = 주석뺀것(readFileSync(join(DIR, f), 'utf8'))
  const html = htmlBlocks(t).join('\n')
  if (!고를것.test(html)) continue          // 고를 게 없는 판 = 대상 아님
  const 없는것 = []
  if (!복사.test(html)) 없는것.push('「결과 복사」')
  if (!남기기.test(html)) 없는것.push('새로고침 뒤에도 남기기')
  if (!폴백.test(html)) 없는것.push('복사 실패 폴백')
  if (없는것.length) bad.push({ f, 없는것 })
}

if (bad.length) {
  console.error(`📋 ❌ 검수판인데 «복사»가 안 되는 도구 ${bad.length}개`)
  for (const b of bad) console.error(`   ${b.f} — 없다: ${b.없는것.join(' · ')}`)
  console.error('')
  console.error('   📮 창업자 2026-08-18 = "앞으로 검수판 올릴때 무조건 복사되는 걸로 올려"')
  console.error('   ⛔ artifact-sync 태그로는 안 된다 — 그건 «라이브 문서»에서만 돈다(LIVE DOCS ONLY).')
  console.error('   ✅ localStorage 로 남기고, 「결과 복사」 버튼으로 글을 만들고,')
  console.error('      복사가 실패해도 글을 화면에 띄운다(clipboard 는 성공했다고 해놓고 실패한다).')
  console.error('   👉 본보기 = scripts/_판-검수.mjs 맨 아래 <script>')
  process.exit(1)
}
console.log(`📋 ✅ 검수판 복사 검사 — 고를 것이 있는 판 전부 «복사·저장·폴백» 갖춤`)
