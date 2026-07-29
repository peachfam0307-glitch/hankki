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
      ['즐겨찾기', '레시피를 열고 북마크를 누르면 즐겨찾기에 담겨요.'],
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
