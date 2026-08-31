// 🎴🎴 「이 그림은 «사진»이 아니라 자랑카드 표지다」 — 그 판정을 «한 곳»에 둔다.
//
// 📮 창업자 2026-08-31 = *"레꾸자랑에서 뽑은카드로 레꾸한거는 사라졌어."* (폰 → 클라우드 → 패드)
//   ⛔ 뿌리 = `cloud.js` 의 「사진털기」가 **`data:` 로 시작하는 그림을 «전부»** 턴다(창업자 확정 「글자부터」).
//      그런데 자랑카드 표지는 «찍은 사진»이 아니라 **앱이 그려서 만든 완성 표지 한 장**이라
//      같이 털리면 안 되는 것이었다. → 갈래 넷 중 **ⓑ**(카드 표지만 올린다) 확정.
//
// ⭐⭐ 잣대를 새로 만들지 않았다 — **이미 있던 것 둘**을 여기로 모았을 뿐이다:
//   ① `imageFit: 'whole'` — 2026-08-18 부터 `카드표지로()` 가 저장할 때 박는 표시
//   ② **세로 1600px 문턱** — `Thumb.jsx` 가 «그 표시가 없던 시절»의 카드를 되살릴 때 쓰는 값
//      · 자랑카드 = 1080×1350 을 `pixelRatio 1.5` 로 캡처 → **1620×2025**
//      · 내 사진  = `cropSquare(800)` · `fitImage(1200)` → **긴 변이 1200 을 못 넘는다**(`utils.js`)
//   📌 잣대가 둘로 갈리면 **화면은 카드로 그리는데 클라우드는 사진으로 털어버린다.** 그래서 한 곳이다.
//
// ⛔ ②가 «없으면 반쪽이다»(규칙 18 ⓙ — 이미 깔린 폰) — 자랑카드→표지는 v8.50 부터 있던 기능이라
//    8/18 «전»에 저장한 표지엔 ①이 아예 없다. 그 사람들 카드는 그대로 안 올라갔을 것이다.
//
// ⚠️ 틀려도 안전한 쪽이다 — 어쩌다 사진이 카드로 잡히면 «그 사진이 클라우드에 올라갈» 뿐이고,
//    카드가 사진으로 잡히면 «지금과 똑같이» 안 올라갈 뿐이다. 잃는 쪽으로는 안 기운다.

export const 카드높이문턱 = 1600

// 📏 **JPEG 의 «세로»를 그림을 풀지 않고 읽는다** — 머리말(SOF 표시)에 적혀 있다.
//   ⭐ 왜 이렇게 하나 = `cloud.js` 는 올릴 «글자»를 만드는 자리라 **기다릴 수가 없다**(동기).
//      `new Image()` 로 재려면 비동기라 그 흐름을 통째로 바꿔야 한다.
//   ⭐ 앞부분만 푼다 — 캔버스가 만든 JPEG 은 EXIF 가 없어 SOF 가 몇 백 바이트 안에 나온다.
//      (368KB 를 통째로 풀면 올릴 때마다 레시피 수만큼 헛일을 한다)
//   ⛔ 못 읽으면 **0** 을 준다 — 「크다」가 아니라 「모른다」다. 모르면 위 ① 표시로만 판정한다.
export function jpeg세로 (데이터주소) {
  try {
    if (typeof 데이터주소 !== 'string') return 0
    const 자리 = 데이터주소.indexOf(';base64,')
    if (자리 < 0) return 0
    const 앞 = 데이터주소.slice(자리 + 8, 자리 + 8 + 12000)
    const 글 = 앞.slice(0, Math.floor(앞.length / 4) * 4)   // base64 는 4글자 단위
    if (!글) return 0
    const bin = atob(글)
    if (bin.charCodeAt(0) !== 0xff || bin.charCodeAt(1) !== 0xd8) return 0   // JPEG 이 아니다
    let p = 2
    while (p + 9 < bin.length) {
      if (bin.charCodeAt(p) !== 0xff) { p++; continue }
      const 표시 = bin.charCodeAt(p + 1)
      if (표시 === 0xff) { p++; continue }                                    // 채움 바이트
      if (표시 === 0xd8 ||표시 === 0x01 || (표시 >= 0xd0 && 표시 <= 0xd7)) { p += 2; continue }
      const 길이 = (bin.charCodeAt(p + 2) << 8) | bin.charCodeAt(p + 3)
      // SOF0~SOF15 = 크기가 적힌 칸. ⛔ C4(허프만)·C8(예약)·CC(산술)는 SOF 가 아니다.
      const SOF = 표시 >= 0xc0 && 표시 <= 0xcf && 표시 !== 0xc4 && 표시 !== 0xc8 && 표시 !== 0xcc
      if (SOF) return (bin.charCodeAt(p + 5) << 8) | bin.charCodeAt(p + 6)
      if (길이 < 2) return 0
      p += 2 + 길이
    }
    return 0
  } catch { return 0 }
}

/** 이 레시피의 표지가 «자랑카드»인가 (＝사진이 아니라 완성된 표지 한 장인가) */
export function 카드표지인가 (레시피) {
  const r = 레시피
  if (!r || typeof r !== 'object') return false
  const 그림 = r.image
  if (typeof 그림 !== 'string' || !그림.startsWith('data:image/')) return false
  if (r.thumb && r.thumb !== 'photo') return false
  if (r.imageFit === 'whole') return true                 // ① 저장할 때 박은 표시
  return jpeg세로(그림) >= 카드높이문턱                    // ② 표시가 없던 시절의 카드
}
