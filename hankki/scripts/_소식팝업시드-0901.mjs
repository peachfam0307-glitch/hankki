// 📰 재현판 전부에 「소식 팝업 끄기」 표식을 심는다 (2026-09-01)
//
// ⛔⛔ 왜 만들었나 — **2026-09-01 00:09 에 배포가 통째로 막혔다**(run #1975).
//    같은 커밋(28df3e38)으로 **8/31 23시에 돈 #1974 는 통과**했다. 코드가 아니라 «날짜»가 갈랐다.
//
//    🔢 실측 = 홈에 `sheet-mask`(z=300)가 화면을 다 덮고 클릭을 전부 먹었다:
//       「NEW · 꾸미기에 가을이 왔어요 · 51종 · 전부 무료」
//    ⭐ 조건은 날짜가 아니라 «열린 것»이다 —
//       `worthPopup = (news) => (news?.openedAlert||[]).some(o => o.kind==='꾸미기' || o.kind==='레꾸자랑 카드')`
//       9/1 에 꾸미기 51종이 «저절로» 열리면서 그게 참이 됐다.
//
//    📌 **그래서 매달 1일마다 되풀이될 구조다.** 판 하나만 고치면 다음 달에 또 샌다.
//
// ⛔ 내가 헛짚은 것 둘 — 적어 둔다(다음에 또 이 길로 가지 말라고)
//    ⑴ `hankki:nudge:cloudgate` (로그인 첫 화면 끄기) → **심어도 그대로 실패**.
//       CloudGate 는 `needsOnboarding()` 이 참일 때만 뜨는데 판들이 이미 온보딩을 심어 꺼져 있었다.
//    ⑵ `hankki:news:seen = <시각>` → 실패. 그 열쇠는 시각이 아니라 **소식 «지문»**을 담는다
//       (`NewsPopup.jsx` 의 `newsSignature`). 값이 안 맞으면 «안 본 것»이 된다.
//    ✅ 통하는 것 = **`hankki:news:off = '1'`**(「앞으로 열지 않기」) — `isNewsPopupOff()` 가 곧장 막는다.
//
// ⭐ 앱은 안 고친다 — 팝업이 클릭을 막는 건 «정상 동작»이고 유저는 닫으면 된다.
//    고칠 자리는 **판이 그걸 안 닫는 것**이다.
//
// 🧭 심는 자리 = 판이 이미 「온보딩 건너뛰기」를 심는 바로 그 줄.
//    뜻이 같다 — 「첫 안내는 건너뛰고 본 화면을 보겠다」.
//
// 쓰는 법:  node scripts/_소식팝업시드-0901.mjs [--확인]
//           --확인 = 바꾸지 않고 몇 군데인지만 센다
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const DIR = path.join(new URL('.', import.meta.url).pathname)
const 확인만 = process.argv.includes('--확인')

// ⛔ 모양이 둘뿐인 것을 «세어서» 확인했다(178 + 39). 새 모양이 생기면 아래 표에 더한다.
const 짝 = [
  ["localStorage.setItem('hankki:onboarded', '1')",
   "localStorage.setItem('hankki:onboarded', '1'); localStorage.setItem('hankki:news:off', '1')"],
  ["localStorage.setItem('hankki:onboarded','1')",
   "localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1')"],
]

let 파일수 = 0, 자리수 = 0
for (const 이름 of readdirSync(DIR)) {
  if (!이름.endsWith('.mjs')) continue
  if (이름 === '_소식팝업시드-0901.mjs') continue
  const 길 = path.join(DIR, 이름)
  let 글 = readFileSync(길, 'utf8')
  if (글.includes("hankki:news:off")) continue   // 이미 심어져 있다
  const 처음 = 글
  let 이번 = 0
  for (const [옛, 새] of 짝) {
    const 조각 = 글.split(옛)
    if (조각.length > 1) { 이번 += 조각.length - 1; 글 = 조각.join(새) }
  }
  if (글 === 처음) continue
  파일수++; 자리수 += 이번
  if (!확인만) writeFileSync(길, 글)
}
console.log(`${확인만 ? '🔎 셈만' : '✅ 바꿨다'} — 파일 ${파일수}개 · 자리 ${자리수}군데`)
