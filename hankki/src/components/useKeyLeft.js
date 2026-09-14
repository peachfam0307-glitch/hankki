// 🔑 열쇠 값을 «살아 있게» 읽는 갈고리 — 알약(KeyBadge)과 가져오기 목록(EarnList)이 같이 쓴다.
//
// ⛔⛔ **왜 필요한가 (2026-09-01 실제 사고)**
//    워커를 고쳐 「어느 것을 받았나」를 주게 했는데 **화면에 줄이 안 그어졌다.**
//    원인이 «둘»이었다 —
//      ⑴ 앱이 서버에 «물어보는 길»이 없었다(열쇠를 쓸 때·행동할 때만 받았다) → `열쇠새로고침()`
//      ⑵ 부품이 `getOcrLeft()` 를 **한 번만** 읽어서, 답이 새로 와도 **다시 안 그렸다** → 이 파일
//    📌 「서버가 준다」 · 「앱이 받는다」 · 「화면이 그린다」 는 **셋 다 다른 말이다.**
//
// ⭐ 부품마다 따로 짜지 않고 한 곳에 둔다 — 복사해 두면 한쪽만 고쳐져 조용히 갈라진다
//    (KeyBadge 를 부품으로 뺀 것과 같은 이유).
import { useEffect, useState } from 'react'
import { getOcrLeft, LEFT_EVENT, 열쇠새로고침 } from '../ocr'

export default function useKeyLeft() {
  const [left, setLeft] = useState(getOcrLeft)
  useEffect(() => {
    const 다시 = () => setLeft(getOcrLeft())
    window.addEventListener(LEFT_EVENT, 다시)
    // 🔎 화면에 뜰 때 한 번 물어본다 — 아무것도 주지도 깎지도 않는다.
    //   ⛔ 실패해도 조용하다(폰에 있던 값을 그대로 쓴다 — 「모른다」로 덮지 않는다).
    열쇠새로고침()
    return () => window.removeEventListener(LEFT_EVENT, 다시)
  }, [])
  return left
}
