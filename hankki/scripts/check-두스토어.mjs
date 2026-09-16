// 🏪🏪 [절대원칙 · 창업자 2026-09-16] **홍보물에는 애플·구글 «둘 다» 넣는다**
//
// 📮 창업자 = *"앞으로 만드는 모든 캐러셀 릴스는 애플 구글 둘다 넣어줘. 저장 절대원칙"*
//    ＋ 그 뿌리(2026-09-13) = *"승인되면 우리가 만드는 모든 캐러셀과 릴스에 구글스토어+애플스토어 다 넣어줘야해"*
//
// ⛔⛔ **왜 장치인가** — 창업자 2026-07-31 = *"규칙만 만들면 뭐해 안지키는데."*
//    🔢 실측(2026-09-16) = 그날 홍보물 생성기 일곱을 훑으니 **셋이 구글만** 적고 있었다
//       (추석 캐러셀 · 핀 릴스 · 홍보카드 3곳). 아이폰이 나온 지 하루가 지났는데도 그랬다.
//    📌 「앞으로 넣자」는 말로는 «이미 있는 파일»이 안 고쳐진다. 그래서 «셋» 뒤에 이 검사를 붙였다.
//
// 🔤 **표기는 영어로** — 애플 공식(한국어 지침 · 2026-09-16 열람):
//    *"서비스 상표 **App Store 는 항상 영어로 표시됩니다. App Store 를 번역하거나** 배지를 현지화하지 마십시오."*
//    🔗 developer.apple.com/app-store/marketing/guidelines/kr
//    ⛔ 그래서 「앱스토어」·「앱 스토어」 둘 다 지침 위반이다.
//    ⚠️ 구글은 같은 문장을 «못 찾았다»(확인 못 함) — 나란히 보이게 「Google Play」로 통일한 것이다.
//
// ⭐⭐ **무엇을 대상으로 보나 — 「스토어를 이미 말하고 있는 홍보물 생성기」**
//    ⛔ 목록을 손으로 적지 않는다(규칙 22 — 손으로 적은 목록은 반드시 낡는다).
//    ✅ 파일이 스스로 말한다: **스토어 이름을 한 번이라도 쓰면 그 파일은 대상**이다.
//       → 한쪽만 쓰면 잡힌다. 아예 안 쓰는 판(검수판·시안)은 조용하다.
//    ⛔ 주석 줄은 세지 않는다 — 「// 🍎 App Store 규격」 같은 설명이 값으로 잡히면 헛방이다.
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const 여기 = dirname(fileURLToPath(import.meta.url))
const 한글표기 = /앱\s?스토어|구글\s?플레이|플레이\s?스토어/

// 📄 주석을 뺀 «진짜 화면에 나가는 글»만 본다
const 알맹이 = (원문) => 원문.split('\n')
  .filter((줄) => !/^\s*(\/\/|\*|\/\*)/.test(줄))
  .join('\n')

const 잡힘 = []
for (const 이름 of readdirSync(여기).sort()) {
  if (!/^(_판-|_릴스-).*\.mjs$/.test(이름)) continue
  const 본문 = 알맹이(readFileSync(join(여기, 이름), 'utf8'))

  const 한글 = 한글표기.exec(본문)
  const 애플 = 본문.includes('App Store')
  const 구글 = 본문.includes('Google Play')

  if (한글) 잡힘.push({ 이름, 왜: `한글 표기 「${한글[0]}」 — 애플 지침상 영어로` })
  else if (애플 && !구글) 잡힘.push({ 이름, 왜: 'App Store 만 있다 — Google Play 도 나란히' })
  else if (구글 && !애플) 잡힘.push({ 이름, 왜: 'Google Play 만 있다 — App Store 도 나란히' })
}

if (잡힘.length) {
  console.error('\n🏪 **두 스토어 게이트 — 홍보물에 한쪽만 적혀 있다**\n')
  for (const x of 잡힘) console.error(`   ⛔ ${x.이름}\n      ${x.왜}`)
  console.error('\n   📮 창업자 2026-09-16 = "앞으로 만드는 모든 캐러셀 릴스는 애플 구글 둘다 넣어줘. 저장 절대원칙"')
  console.error('   ✅ 쓰는 꼴 = `App Store · Google Play 에서 한끼 레시피북 검색`')
  console.error('   ⛔ 「앱스토어」·「구글 플레이」로 번역하지 않는다 (애플 공식 지침)\n')
  process.exit(1)
}
console.log('✅ 두 스토어 — 홍보물이 애플·구글을 나란히 적고 있다')
