// 🤖🔐 AI 다듬기 «허락» 시트 — `aiConsent.js` 가 묻는 순간 뜬다. (2026-09-08 · 큰 틀 6-② ⓑ)
//
// 애플 5.1.2(i) 반려 사례(포럼 816140)가 짚은 셋을 «그대로» 담는다 = ①무엇을 보내나 ②어디로 ③왜.
//   ＋ 보관(우리 서버는 결과를 최대 1시간 임시 보관 — `worker-tidy.js:144` 선반) · 거절해도 되는 것(규칙 정리만) · 바꾸는 곳(설정).
// ⛔ 모델 이름은 안 적는다 — 바뀐다. 공급자(Cloudflare Workers AI)와 종류(언어·이미지 모델)까지만.
// ⛔ 「학습에 안 쓴다」 같은 남의 약속은 원문 없이 적지 않는다 — 방침 링크로 넘긴다.
// 뒤로가기·배경 = 「답 없음」(저장 안 함 · 이번엔 안 보냄 · 다음에 다시 묻는다).

import { useEffect, useState } from 'react'
import Portal from './Portal'
import Icon from './Icon'
import { useModalBack } from '../useBackHandler'
import { 동의이벤트 } from '../aiConsent'

export default function AIConsentSheet () {
  const [답하기, set답하기] = useState(null)   // 시트가 떠 있으면 답 함수

  useEffect(() => {
    const 받기 = (e) => {
      const d = e?.detail
      if (!d || typeof d.답 !== 'function') return
      d.받았다?.()
      set답하기(() => d.답)
    }
    window.addEventListener(동의이벤트, 받기)
    return () => window.removeEventListener(동의이벤트, 받기)
  }, [])

  if (!답하기) return null
  return <시트 답={(v) => { const f = 답하기; set답하기(null); f(v) }} />
}

function 시트 ({ 답 }) {
  const 닫기 = () => 답(null)
  useModalBack(닫기)
  const 방침 = () => { try { const a = document.createElement('a'); a.href = (import.meta.env.BASE_URL || './') + 'privacy.html#ai'; a.target = '_blank'; a.rel = 'noopener'; a.click() } catch { /* noop */ } }
  return (
    <Portal>
      <div className="sheet-mask" onClick={닫기} style={{ zIndex: 1300 }}>
        <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 22 }}>
          <div className="emoji-sheet-head">
            <span>AI로 다듬기 전에</span>
            <button className="press" onClick={닫기} style={{ color: 'var(--text-sub)', fontSize: 15, fontWeight: 600 }}>닫기</button>
          </div>
          <div style={{ padding: '2px 16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Icon name="sparkle" size={20} color="var(--brown)" stroke={2} />
              <div style={{ fontSize: 15.5, fontWeight: 700 }}>레시피를 AI가 정리하려면 서버로 보내야 해요</div>
            </div>
            <div style={{ background: 'var(--cream)', borderRadius: 12, padding: '13px 15px', fontSize: 14.5, lineHeight: 1.85, whiteSpace: 'pre-line' }}>
              · <b>무엇을</b> — 지금 정리하는 레시피의 글자, 그리고 사진이 있으면 그 사진 한 장{'\n'}
              · <b>어디로</b> — 한끼 중계 서버를 거쳐 <b>Cloudflare Workers AI</b>(미국 · 언어·이미지 모델){'\n'}
              · <b>왜</b> — 재료·순서·분량을 알아보기 쉽게 다듬으려고{'\n'}
              · <b>보관</b> — 한끼 서버는 정리 결과를 <b>최대 1시간</b> 임시로 두었다가 지워요 · 사진은 저장하지 않아요
            </div>
            <div className="t-sub" style={{ fontSize: 13.5, lineHeight: 1.6, margin: '10px 2px 14px' }}>
              「사용 안 함」을 골라도 레시피는 그대로 저장되고, 앱 안의 규칙 정리만 써요. 언제든 <b>설정 → AI 다듬기 사용</b>에서 바꿀 수 있어요.
            </div>
            <button className="btn-primary press" style={{ width: '100%' }} onClick={() => 답('yes')}>사용할게요</button>
            <button className="press" style={{ width: '100%', marginTop: 10, color: 'var(--text-sub)', fontSize: 15.5, fontWeight: 600, padding: '8px 0' }} onClick={() => 답('no')}>사용 안 함</button>
            <button className="press" onClick={방침} style={{ display: 'flex', alignItems: 'center', gap: 5, width: '100%', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)', color: 'var(--text-sub)', fontSize: 13.5, textAlign: 'left' }}>
              <span>개인정보처리방침에서 <b>자세히</b></span>
              <Icon name="chevron-right" size={14} color="var(--sand)" />
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
