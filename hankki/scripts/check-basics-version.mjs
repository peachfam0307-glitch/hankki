// 🔢🔢 «레시피 본문을 고쳤는데 BASICS_VERSION 을 안 올렸나» — 배포 게이트
//
// ⛔⛔ **2026-08-14 하루에 두 번 밟았다.**
//   · 낮 = 아이콘 17편을 고치며 60 → 61 로 올렸다 (이건 지켰다)
//   · 밤 = v10.75 에서 **감바스를 통째로 고치고도 안 올렸다** → 창업자 폰에 하나도 안 갔다.
//     📮 창업자 *"나는 수정한게 안보여. **이미 들어가있어서**"* — 원인을 창업자가 짚었다.
//
// ⭐ 왜 이게 조용히 새는가 = **새로 까는 사람에겐 «멀쩡히» 보인다.**
//    빌드도 스모크도 통과하고, 내 화면에서도 잘 나온다. 오직 «이미 깔린 폰»에서만 안 바뀐다.
//    그래서 눈으로도 검사로도 안 잡혔고, 창업자가 폰을 열어봐야만 드러난다.
//    📌 CLAUDE.md 규칙 18 ⓙ 가 정확히 이것인데 **규칙으로 적어둬도 샜다** → 장치로 만든다(규칙 19).
//
// 무엇을 보나 = 배포 브랜치의 원격판과 견줘 **레시피 «내용»이 바뀌었는데 번호가 그대로**면 막는다.
//   ⚠️ 주석·`BASICS_VERSION` 줄 자체가 바뀐 것은 «내용 변경»으로 안 센다 — 그것까지 세면 시끄러워서 죽는다.
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const 뿌리 = new URL('../', import.meta.url)
const 배포 = 'origin/claude/chatgpt-conversation-link-kvn5ph'
const 길 = 'hankki/src/data/basics.js'

const 번호 = (s) => Number((s.match(/BASICS_VERSION = (\d+)/) || [])[1])
// 레시피 «내용»만 남긴다 — 줄 앞뒤 공백·주석 줄·버전 줄을 턴다
const 알맹이 = (s) => s.split('\n')
  .filter((l) => !/^\s*\/\//.test(l) && !/BASICS_VERSION/.test(l))
  .map((l) => l.trim()).join('\n')

let 옛
try {
  옛 = execSync(`git show ${배포}:${길}`, { cwd: new URL('../..', import.meta.url).pathname, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
} catch {
  console.log('🔢 basics 버전 게이트 — 원격판을 못 읽었다(네트워크?). 건너뛴다.')
  process.exit(0)
}
const 새 = readFileSync(new URL('src/data/basics.js', 뿌리), 'utf8')

if (알맹이(옛) === 알맹이(새)) {
  console.log('🔢 basics 버전 게이트 — 레시피 내용 변경 없음 ✅')
  process.exit(0)
}
const a = 번호(옛), b = 번호(새)
if (!a || !b) {
  console.error('⛔ BASICS_VERSION 을 못 읽었다 — 검사가 죽은 것이니 고칠 것')
  process.exit(1)
}
if (b > a) {
  console.log(`🔢 basics 버전 게이트 — 레시피가 바뀌었고 번호도 올랐다 (v${a} → v${b}) ✅`)
  process.exit(0)
}
console.error(`\n⛔⛔ 레시피 본문이 바뀌었는데 BASICS_VERSION 이 그대로다 (v${b}).`)
console.error('   👉 `src/data/basics.js` 맨 위 `BASICS_VERSION` 을 «＋1» 하고 무엇을 바꿨는지 적을 것.')
console.error('   ⛔ 이 번호를 안 올리면 **새로 까는 사람만 고쳐지고 이미 깔린 폰은 옛 값을 그대로 쓴다.**')
console.error('      2026-08-14 밤 감바스가 정확히 그랬다 — 창업자 *"나는 수정한게 안보여. 이미 들어가있어서"*')
process.exit(1)
