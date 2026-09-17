import Portal from './Portal'
import Icon from './Icon'
import { useModalBack } from '../useBackHandler'

// 🛒 주부의 장바구니 — 제품 «상세 시트» (창업자 2026-09-17 *"원재료가 중요한거야"*)
//
//   ⭐ 카드는 그대로 두고(132장이 늘어나면 스크롤이 3배) **탭하면 여기서** 추천 글 전문 ＋ 원재료명 ＋ 알레르기를 본다.
//   ⛔ 사진은 안 싣는다 — 쿠팡 판매자 사진은 저작권(퍼플렉시티 답 2026-09-17 · docs/장바구니-원재료-저작권답).
//      글자도 «우리 모양»으로만 — 쿠팡 상세의 표·아이콘·배열을 흉내내지 않는다(편집저작물).
//   ⛔ 효능 말은 0 — 원재료명·알레르기·영양 «수치»만. 「좋다·건강하다」는 식품표시광고법 자리다.
//   ⭐ 확인일(`checked`) ＋ 「제품 포장의 표시가 우선이에요」 ＋ 「잘못됐어요 알려주기」 — 답 3)이 «포장 우선 문구만으론 부족하다»고 했다.
//   ⛔ 값이 없는 칸은 «안 그린다» — 옛 132개는 원재료가 없으니 추천 글만 뜬다. 빈 칸·「준비 중」을 그리지 않는다.
export default function CurationDetailSheet({ it, iconSrc, title, mallLabel, canBuy, onAdd, onBuy, onReport, onClose }) {
  useModalBack(onClose)
  const 확인일 = it.checked ? `${Number(it.checked.slice(5, 7))}/${Number(it.checked.slice(8, 10))} 확인` : ''
  const 원재료있음 = !!(it.ingredients || it.allergen || it.nutrition)
  return (
    <Portal>
      <div className="sheet-mask" onClick={onClose}>
        <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'calc(18px + var(--safe-bottom))', maxHeight: 'calc(100dvh - 40px)' }}>
          <div className="emoji-sheet-head">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
              {iconSrc && <img src={iconSrc} alt="" draggable={false} style={{ width: 30, height: 30, objectFit: 'contain', flex: '0 0 auto' }} />}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
            </span>
            <button className="press" onClick={onClose} style={{ color: 'var(--text-sub)', fontSize: 16, fontWeight: 600, flex: '0 0 auto' }}>닫기</button>
          </div>
          <div style={{ padding: '2px 16px 0' }}>
            {mallLabel && <div className="t-sub" style={{ fontSize: 14, marginBottom: 8 }}>{mallLabel}에서 사요</div>}

            {/* 추천 글 전문 — 카드에선 2줄로 접혀 있던 것 */}
            <div style={{ background: 'var(--cream)', borderRadius: 14, padding: '11px 13px', fontSize: 16.5, lineHeight: 1.7 }}>{it.benefit}</div>

            {원재료있음 && (
              <div style={{ marginTop: 12, background: 'var(--cream)', borderRadius: 14, padding: '11px 13px', display: 'grid', gap: 9 }}>
                {it.ingredients && (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--brown)', marginBottom: 3 }}>원재료명</div>
                    <div style={{ fontSize: 15.5, lineHeight: 1.6 }}>{it.ingredients}</div>
                  </div>
                )}
                {it.allergen && (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--brown)', marginBottom: 3 }}>알레르기 유발물질</div>
                    <div style={{ fontSize: 15.5, lineHeight: 1.6, fontWeight: 700 }}>{it.allergen}</div>
                  </div>
                )}
                {it.nutrition && (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--brown)', marginBottom: 3 }}>영양정보</div>
                    <div style={{ fontSize: 15.5, lineHeight: 1.6 }}>{it.nutrition}</div>
                  </div>
                )}
                {/* ⚖️ 두 번째 답(2026-09-17)이 권한 꼴 그대로 — 확인일 · 출처 · 리뉴얼로 바뀔 수 있음 · 실제 포장 우선 · 오류 신고.
                    「포장 우선」 문구만으론 부족하고 «확인일 ＋ 신고 길»이 있어야 주의의무를 다한 것으로 본다. */}
                <div className="t-sub" style={{ fontSize: 13.5, lineHeight: 1.5 }}>
                  제품 포장 표시를 옮겨 적었어요{확인일 ? ` · ${확인일}` : ''} · 제조사 리뉴얼로 바뀔 수 있으니 실제 제품 포장 표시가 우선이에요
                  {onReport && <> · <button className="press" onClick={onReport} style={{ color: 'var(--brown)', fontWeight: 700, fontSize: 13.5 }}>잘못됐어요 알려주기</button></>}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="press" onClick={onAdd} style={{ flex: 1, padding: '10px 0', borderRadius: 11, background: 'var(--brown)', color: '#fff', fontWeight: 800, fontSize: 16.5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><Icon name="cart" size={14} />담기</button>
              {canBuy && <button className="press" onClick={onBuy} style={{ flex: 1, padding: '10px 0', borderRadius: 11, background: 'var(--cream)', color: 'var(--brown)', fontWeight: 800, fontSize: 16.5 }}>사러가기</button>}
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}
