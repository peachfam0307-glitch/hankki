import { useState, useEffect } from 'react'
import { 창고에있나, 그릴수있나, 창고표시, 꺼내기 } from './photoStore'

// 🖼🖼 **창고에 든 사진을 «화면에 그리는» 한 곳** (2026-09-02)
//
//   ⛔⛔ 사진을 IndexedDB 로 옮긴 뒤, 앱을 껐다 켜면 상태에 남는 값은 **쪽지**(`idb://…`)다.
//      `<img src="idb://recipes/r1/image">` 는 브라우저가 못 읽는다 → **빈 칸**이 된다.
//      그러면 유저 눈엔 **「사진이 사라졌다」**로 보인다 — 오늘 아침 사고와 똑같은 얼굴이다.
//
//   ⭐ 그래서 «그리는 자리마다» 이 한 곳을 지난다. 갈래는 셋뿐이다 —
//      ① 이미 그릴 수 있는 값(`data:`·`blob:`·주소) → 그대로
//      ② 쪽지 → 창고에서 꺼내 온다(비동기)
//      ③ 없음 → 빈 값
//
//   ⛔ **「켤 때 전부 꺼내기」는 안 한다**(절대원칙 32) — 사진 수에 선형이라 오래 쓸수록 느려진다.
//      꺼내는 시점은 **그 그림이 진짜로 그려질 때**다.
//   ⚠️ 목록 안에서 칸이 재사용되므로 값이 바뀌면 **옛 그림을 먼저 버린다**(안 그러면 남의 사진이 잠깐 뜬다).

/** 그릴 수 있는 값으로 바꿔 준다. 아직 못 꺼냈으면 `''`. */
export function use창고그림 (값) {
  const 쪽지 = 창고에있나(값) ? 값 : null
  const [꺼낸것, set꺼낸것] = useState(null)
  useEffect(() => {
    set꺼낸것(null)
    if (!쪽지) return
    let 살아있나 = true
    ;(async () => {
      try {
        const v = await 꺼내기(쪽지.slice(창고표시.length))
        if (살아있나 && v) set꺼낸것(v)
      } catch { /* 창고가 말썽이면 그냥 «안 그린다» — 깨지지는 않는다 */ }
    })()
    return () => { 살아있나 = false }
  }, [쪽지])
  if (그릴수있나(값)) return 값
  if (쪽지) return 꺼낸것 || ''
  return 값 || ''
}

// ⭐ 1×1 투명 — 아직 못 꺼냈을 때 «자리»는 그대로 두되 깨진 그림 표시가 안 뜨게 한다.
//    ⛔ `src=""` 로 두면 브라우저가 «지금 페이지»를 다시 받으러 간다(빈 src 는 상대주소다).
const 투명 = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

/** 창고 쪽지를 알아보는 `<img>`. 나머지 속성은 그대로 넘어간다. */
export default function StoredImg ({ src, ...나머지 }) {
  const 그림 = use창고그림(src)
  return <img src={그림 || 투명} {...나머지} />
}
