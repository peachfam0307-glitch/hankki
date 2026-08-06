// 📝 「오늘의 한 줄」 — 다이어리 종이 «맨 아래»에 손글씨로 얹히는 한 줄.
//
// ⭐ 창업자 확정 2026-08-06 — *"평가빼고 오늘의 한 줄 정도로?"*
//    별점 다섯 개를 빼고 그 자리에 들어간다. 조사 흐름 4번(*"1~3분 안에 완성"*)과 같은 결이다.
//
// ⭐⭐ **꾸미기에 «안 들어가고도» 쓸 수 있어야 한다.** 글자 스티커는 이미 있지만
//    그건 서랍을 열고 · 글자 탭을 찾고 · 넣고 · 끌어다 놓아야 한다.
//    한 줄은 **열고 → 쓰고 → 끝**이라야 매일 쓴다. 그래서 다이어리 화면에 칸을 따로 둔다.
//
// 📐 글자 크기가 `cqw`(제 폭 기준) 라서 **어디에 얹어도 같은 비율**로 보인다 —
//    다이어리 화면(320px)에서도, 꾸미기 판(328px)에서도, 나중에 캡처(1080px)에서도.
//    ⛔ px 로 박으면 판 크기가 바뀔 때 글자만 혼자 작아진다(여름 물결 배경과 같은 함정).
//
// 🧷 `zIndex: 1` — 속지 «틀 그림»(`.paper.art::after`)과 스티커보다 위.
//    둘 다 z-index 가 없어서(auto) 이 한 줄이 항상 읽힌다. **글은 가려지면 안 된다.**
export default function PaperNote({ text }) {
  if (!text) return null
  return (
    <div style={{ position: 'absolute', inset: 0, containerType: 'inline-size', pointerEvents: 'none', zIndex: 1 }}>
      <div
        style={{
          // 📐 `bottom 13%` = 실물로 재서 정한 값이다. 5% 였을 때 **사진일기 틀의
          //    기분 동그라미와 글자가 겹쳤다**(캡처로 확인). 13% 면 그 위 줄에 얹힌다.
          //    좌우 10% = 네 모서리 잎사귀 장식을 피한다.
          position: 'absolute', left: '10%', right: '10%', bottom: '13%',
          fontFamily: "'Gaegu','Gowun Dodum','Pretendard',sans-serif",
          fontWeight: 700, fontSize: '5cqw', lineHeight: 1.35,
          color: '#5b4436', // 우리 진갈색 — 속지 선(#e2d8c6)보다 진해서 크라프트 위에서도 읽힌다
          textAlign: 'center', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}
      >
        {text}
      </div>
    </div>
  )
}
