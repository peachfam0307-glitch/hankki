import Portal from './Portal'
import Icon from './Icon'
import { useModalBack } from '../useBackHandler'
import { openExternal } from '../utils'
import { APP_VERSION, FEEDBACK_URL, LAB_SURVEY_URL, LAB_BUG_URL } from '../version'
import { SURVEY, FIXED } from '../data/lab'
// 🔍 돋보기 든 펭펭 — 연구소 자리에 딱 맞는 우리 컷(창업자 제공 시트).
//    소스 333×462 → 표시 62px = 7배 축소라 선명하다.
import pengSearch from '../assets/sharepool/pn_search.png'

// 🔬 한끼연구소 — 의견·설문·오류를 받는 방. 설정에서 연다.
//
// ⭐ 창업자 아이디어 2026-07-30: *"한끼연구소 만들어서 의견(아이디어), 설문(아이디어낼 것들), 버그·오류 받자"*
//    창구는 셋으로 나눴다(창업자 *"나누자"*) → 폼 3개. 주소는 `src/version.js`.
//
// ⚠️⚠️ 법무: **앱은 아무것도 수집·전송하지 않는다.** 전송은 전부 구글 폼이 한다.
//    `public/privacy.html` 이 *"어떤 서버로도 전송되지 않습니다"* 라고 약속했고 Play 데이터 보안 신고도
//    '수집 안 함' 으로 이미 제출됐다 → 앱에서 직접 받으면 방침·신고를 둘 다 갱신해야 하고
//    안 맞으면 정책 위반(앱 삭제 위험). 그래서 **입력칸을 절대 만들지 않는다.**
//
// ⛔ 유치해지지 않게 (`docs/리텐션-설계원칙-2026-07-30.md`)
//    · 연구원 레벨·포인트·기여도 랭킹 없음 · 보상 낚시("참여하면 스티커") 없음
//    · 캐릭터는 한 마디만 · 답장은 약속하지 않는다("읽고 있어요" 까지만)
export default function LabSheet({ onClose }) {
  useModalBack(onClose) // 뒤로가기 → 닫기

  // 오류 폼 주소에 `__VER__` 가 있으면 앱 버전으로 바꿔서 연다(구글 폼 '미리 채워진 링크')
  const bugUrl = LAB_BUG_URL ? LAB_BUG_URL.replace('__VER__', encodeURIComponent(APP_VERSION)) : ''

  // 주소가 빈 칸은 아예 그리지 않는다 — 눌러도 아무 일 없는 버튼을 두지 않기 위해
  const rows = [
    LAB_SURVEY_URL && {
      icon: 'chat', badge: '설문', title: SURVEY.title, desc: SURVEY.desc,
      chips: SURVEY.items, url: LAB_SURVEY_URL,
    },
    FEEDBACK_URL && {
      icon: 'edit', badge: '익명', title: '의견 남기기', desc: '좋았던 것도, 아쉬운 것도 한 줄이면 돼요.',
      url: FEEDBACK_URL,
    },
    bugUrl && {
      icon: 'alert', title: '안 되는 것 알려주기', desc: `어디서 어떻게 안 됐는지만요 · 지금 ${APP_VERSION}`,
      url: bugUrl,
    },
  ].filter(Boolean)

  return (
    <Portal>
      <div className="sheet-mask" onClick={onClose}>
        <div
          className="sheet"
          onClick={(e) => e.stopPropagation()}
          style={{ paddingBottom: 'calc(20px + var(--safe-bottom))', maxHeight: '86vh', display: 'flex', flexDirection: 'column' }}
        >
          <div className="emoji-sheet-head">
            <span>한끼연구소</span>
            <button className="press" onClick={onClose} style={{ color: 'var(--text-sub)', fontSize: 16, fontWeight: 600 }}>닫기</button>
          </div>

          <div style={{ overflowY: 'auto', padding: '2px 16px 0' }}>
            {/* 펭펭 한 마디 — 답장은 약속하지 않는다 */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
              <img
                src={pengSearch} alt="" aria-hidden="true"
                width={62} height={62}
                style={{ width: 62, height: 62, objectFit: 'contain', flex: '0 0 auto' }}
              />
              <div className="t-sub" style={{ fontSize: 16.5, lineHeight: 1.65 }}>
                한끼는 아직 만들어지는 중이에요.<br />
                보내주신 건 하나도 안 빼고 읽어요.
              </div>
            </div>

            {rows.map((r) => (
              <button
                key={r.title}
                className="card press"
                onClick={() => { openExternal(r.url); onClose() }}
                style={{ width: '100%', textAlign: 'left', padding: '13px 14px', marginBottom: 8, display: 'block' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Icon name={r.icon} size={19} color="var(--brown)" stroke={1.8} />
                  <div style={{ flex: 1, fontSize: 16.5, fontWeight: 700, color: 'var(--text)' }}>{r.title}</div>
                  {r.badge && <span className="badge badge-sorted">{r.badge}</span>}
                  <Icon name="chevron-right" size={17} color="var(--sand)" />
                </div>
                <div className="t-sub" style={{ fontSize: 15.6, lineHeight: 1.5, marginTop: 5, paddingLeft: 28 }}>{r.desc}</div>
                {/* 설문은 뭘 묻는지 미리 보여준다 — 모르고 들어가면 안 누른다 */}
                {r.chips && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8, paddingLeft: 28 }}>
                    {r.chips.map((c) => (
                      <span
                        key={c}
                        style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-sub)', background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 999, padding: '3px 9px' }}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}

            {/* 고친 것 — 말하면 진짜 고쳐진다는 증거. 서버 없이 코드로만 쌓인다. */}
            <div className="h-section" style={{ fontSize: 16, margin: '18px 0 4px' }}>이렇게 고쳐가고 있어요</div>
            <div className="t-sub" style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 9 }}>
              알려주신 게 있으면 여기에 하나씩 쌓아요.
            </div>
            <div className="card" style={{ padding: '4px 14px', background: 'var(--cream)', border: 'none' }}>
              {FIXED.map((t, i) => (
                <div
                  key={t}
                  style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '10px 0', borderTop: i ? '1px solid var(--line)' : 'none' }}
                >
                  <Icon name="check" size={15} color="var(--brown)" stroke={2.1} />
                  <span className="t-sub" style={{ fontSize: 15.8, lineHeight: 1.5, flex: 1 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}
