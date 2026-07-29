import Portal from './Portal'
import Icon from './Icon'
import { useModalBack } from '../useBackHandler'

// 업데이트 예고 — '준비 중인 기능'을 보여줘 기대감을 준다.
// 정직 원칙: 없는 걸 '됩니다'라 하지 않고 '준비 중/곧'으로만 안내.
// 아이콘은 이모지 대신 커스텀 라인아이콘(브랜드 통일).
// 'AI가 사진→레시피'는 이제 실제 동작(가져오기의 캡처 OCR·링크 읽기) → 예고 목록에서 뺐다.
// ⛔ 유저가 모르는 말을 쓰지 않는다 — 창업자가 "도장·컨페티·내 사진 프레임은 뭐야?"라고
//    물었다(2026-07-30). 만든 사람이 모르면 유저는 100% 모른다 → 기대감이 안 생긴다.
//    셋 다 코드·자산이 0인 아이디어였는데 '준비 중'을 달고 있어 과장이기도 했다.
//    → `docs/_아껴둠/`으로 옮기고 목록에서 뺐다.
// ⛔ 주기를 약속하지 않는다 — '계절마다'·'매달' 둘 다 한 번 못 지키면 신뢰가 깨진다.
//    '주부의 장바구니'와 같은 방식으로 "계속 늘어나요"만 말한다(태그 '계속'과 같은 톤).
//    실제 운영은 매달 드립(재고 300컷+) — 그건 로드맵 문서에만 적고 UI엔 약속하지 않는다.
const UPCOMING = [
  { icon: 'palette', title: '새 꾸미기팩', desc: '새 스티커·프레임·마테가 계속 늘어나요.', tag: '준비 중' },
  { icon: 'cart', title: '주부의 장바구니 확장', desc: '18년 안목의 살림템을 계속 채워가요.', tag: '계속' },
  { icon: 'book', title: '내 레시피북, PDF로 소장', desc: '꾸민 표지 그대로 예쁜 책 한 권.', tag: '나중에' },
  { icon: 'chat', title: '내 꾸민 레시피 자랑', desc: '취향 비슷한 사람들과 구경하고 나눠요.', tag: '나중에' },
]

export default function PreviewSheet({ onClose }) {
  useModalBack(onClose) // 뒤로가기 → 닫기
  return (
    <Portal>
      <div className="sheet-mask" onClick={onClose}>
        <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'calc(18px + var(--safe-bottom))', maxHeight: 'calc(100dvh - 40px)' }}>
          <div className="emoji-sheet-head">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}><Icon name="gift" size={19} color="var(--tease-ic)" stroke={1.7} /> 곧 만나요</span>
            <button className="press" onClick={onClose} style={{ color: 'var(--text-sub)', fontSize: 14, fontWeight: 600 }}>닫기</button>
          </div>
          <div style={{ padding: '2px 16px 0' }}>
            <p className="t-sub" style={{ fontSize: 13, margin: '0 0 14px', lineHeight: 1.55 }}>
              한끼가 이런 걸 준비하고 있어요.<br />준비되면 가장 먼저 보여드릴게요 :)
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {UPCOMING.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'var(--cream)', borderRadius: 14, padding: '12px 13px' }}>
                  <span style={{ flex: '0 0 auto', width: 26, display: 'inline-flex', justifyContent: 'center', paddingTop: 1 }}><Icon name={f.icon} size={22} color="var(--tease-ic)" stroke={1.7} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14.5, fontWeight: 800 }}>{f.title}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--brown)', background: 'var(--surface)', borderRadius: 999, padding: '2px 8px' }}>{f.tag}</span>
                    </div>
                    <div className="t-sub" style={{ fontSize: 12.5, marginTop: 3, lineHeight: 1.4 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="t-sub" style={{ fontSize: 11.5, textAlign: 'center', margin: '14px 0 2px', color: 'var(--sand)' }}>
              지금 쌓아둔 레시피는 새 기능이 나와도 그대로 이어져요.
            </p>
          </div>
        </div>
      </div>
    </Portal>
  )
}
