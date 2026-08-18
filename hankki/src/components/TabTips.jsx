import { useState } from 'react'
import { useLayerBack } from '../useBackHandler'
import Icon from './Icon'
import Portal from './Portal'

// 탭마다 '?' 를 눌러 보는 짧은 사용팁. (설정 도움말은 잘 안 보니 각 탭에 인라인으로)
const TIPS = {
  home: {
    title: '홈 사용법',
    items: [
      ['오늘 뭐 해먹지?', '냉장고에 있는 재료로 만들 수 있는 요리를 추천해요. ‘다른 추천’으로 넘겨봐요.'],
      ['자주 해먹는 요리', '레시피에서 ‘만들었어요’를 누르면 자동으로 여기 모여요.'],
      ['검색창', '레시피·재료·태그 아무거나 검색할 수 있어요.'],
      ['우측 상단 톱니', '설정·백업·내 통계를 열어요. 아직 정리 안 한 레시피도 여기서 봐요.'],
    ],
  },
  search: {
    title: '검색 사용법',
    items: [
      ['뭐든 검색', '제목·재료·태그 아무거나 쳐도 찾아줘요.'],
      ['재료로 찾기', '아래 재료 아이콘을 누르면 그 재료가 든 레시피만 모아줘요.'],
      ['태그·인기 검색어', '눌러서 바로 검색할 수 있어요.'],
    ],
  },
  myrecipes: {
    title: '내 레시피 사용법',
    items: [
      ['모아보기 / 요리 기록', '위 탭으로 저장한 레시피와 만든 요리 기록을 나눠 봐요.'],
      ['보기 바꾸기', '우측 상단 아이콘으로 크게 2줄 ↔ 촘촘히 3줄로 전환해요.'],
      ['여러 개 삭제', '카드를 꾹 누르면 선택 모드 · 여러 개 골라 한 번에 지워요. (‘편집’으로도 돼요)'],
      // 🔖 [2026-08-18] 「즐겨찾기」 → **「책갈피」**로 이름 통일 (창업자 확정 · 유저에게 보이는 자리 여섯 곳)
      //    ⛔⛔ ＋ 이 안내가 **낡아 있었다** — *"레시피를 열고 북마크를 누르면"*.
      //       2026-08-17 에 창업자 *"북마크를 밖으로 빼면 되겠다 레시피 속이 아니라"* 로
      //       **목록에서 바로 누르게 바꿨는데 안내는 옛 방식 그대로였다.**
      //       📌 기능을 옮기면 «그 기능을 설명하는 글»도 같이 옮겨야 한다.
      // ⭐⭐ [2026-08-18 창업자] **두 칩의 뜻을 창업자가 한 줄로 갈랐다** —
      //    📮 *"그럼 **자주는 자주 해먹은것, 인덱스는 해먹고싶은 것**하면 되겠네"*
      //    ⭐ 「자주」는 «행동 기록»(「만들었어요」를 누르면 저절로 쌓인다 · `cooked > 0`)이고
      //       「책갈피」는 «내 뜻»(내가 골라서 꽂는다)이다. **저절로 vs 내가**가 둘을 가른다.
      //    ⛔ 그 전 안내엔 **「어떻게 누르나」만 있고 「뭘 위한 건가」가 없었다** — 그래서 안 쓴다.
      ['자주', '‘만들었어요’를 누르면 저절로 모여요. 많이 만든 순서로 보여요.'],
      ['책갈피', '해먹고 싶은 걸 꽂아두세요. 카드 오른쪽 위를 누르면 표시되고, 위 ‘책갈피’ 칩으로 모아 봐요.'],
    ],
  },
  shop: {
    title: '장보기 · 냉장고 사용법',
    items: [
      ['냉장고', '재료를 넣으면 유통기한을 챙겨주고, 그 재료로 만들 요리를 ‘냉장고 파먹기’로 추천해요.'],
      ['장보기 → 냉장고 자동', '장보기 체크리스트에서 ‘샀어요’를 체크하면 냉장고에 자동으로 들어가요.'],
      ['쇼핑몰 바로가기', '한 번 로그인해두면 세션이 유지돼 바로 살 수 있어요.'],
      ['주부의 장바구니', '18년차 주부가 엄선한 건강 식재료 · 담고 바로 사러 가요.'],
    ],
  },
  profile: {
    title: '설정 사용법',
    items: [
      ['백업 · 내보내기', '데이터를 파일로 저장/복원해요. 폰 바꾸기 전에 꼭 내보내두세요.'],
      ['친구와 레시피 나누기', '레시피 상세 맨 위 공유 버튼 → 재료·만드는 법이 담긴 예쁜 카드를 카톡으로 보내요.'],
      ['예시 데이터 비우기', '기본 예시 레시피를 지우고 내 레시피만 남길 수 있어요.'],
    ],
  },
}

export default function TabTips({ tab }) {
  const [open, setOpen] = useState(false)
  useLayerBack(open, () => setOpen(false)) // 뒤로가기 → 닫기
  const tip = TIPS[tab]
  if (!tip) return null
  return (
    <>
      <button className="tip-btn press" onClick={() => setOpen(true)} aria-label="사용법">
        <Icon name="help" size={18} color="var(--text-sub)" />
      </button>
      {open && (
       <Portal>
        <div className="sheet-mask" onClick={() => setOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 24 }}>
            <div className="emoji-sheet-head">
              <span>{tip.title}</span>
              <button className="press" onClick={() => setOpen(false)} style={{ color: 'var(--text-sub)', fontSize: 14, fontWeight: 600 }}>닫기</button>
            </div>
            <div style={{ padding: '2px 16px 0' }}>
              {tip.items.map(([head, body], i) => (
                <div key={i} className="tip-row">
                  <div style={{ flex: 1 }}>
                    <div className="tip-head">{head}</div>
                    <div className="tip-body">{body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
       </Portal>
      )}
    </>
  )
}
