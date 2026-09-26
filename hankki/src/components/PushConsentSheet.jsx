// 🔔🔐 폰 알림 «허락» 시트 — `pushConsent.js` 가 묻는 순간 뜬다. (2026-09-19)
//
// 📮 창업자 = *"장바구니담을때랑 냉장고재료넣을떄 좋아"* — 담기가 «끝난 직후» 여기가 뜬다.
//
// ⛔⛔ **이 시트가 곧 「화살을 아끼는 장치」다.** 브라우저 권한창은 한 번 「차단」당하면 끝이라,
//    여기서 「예」 한 사람에게만 진짜 권한창을 띄운다. 여기서 「아니요」는 손해가 0 이다.
// ⛔ 그래서 문구는 «무엇을 언제 보내는지»를 먼저 말한다 — 놀라서 차단을 누르지 않게.
// 🍎 아이폰(WKWebView)에는 애초에 안 뜬다 — `pushConsent.물어도되나()` 가 막는다.
//
// ⭐ 꼴은 `AIConsentSheet.jsx` 와 «같다» — 새 장치를 만들지 않는다(절대원칙 35).
// 뒤로가기·배경·닫기 = 「답 없음」(아무것도 저장 안 함 · 다음에 다시 묻는다).

import { useEffect, useState } from 'react'
import Portal from './Portal'
import Icon from './Icon'
import { useModalBack } from '../useBackHandler'
import { 알림이벤트, 기존유저한번물을까, 기존물음칸 } from '../pushConsent'
import { 구독맞추기, 알림켜기 } from '../pushSubscribe'
import { ONBOARD_KEY } from './Onboarding'
import { 알림시트봄, 알림허락, 알림거절 } from '../stats'   // 🚪 [2026-09-21] 관문 — 2026-09-20 에 나갔는데 계측이 0줄이었다

export default function PushConsentSheet () {
  const [답하기, set답하기] = useState(null)

  useEffect(() => {
    const 받기 = (e) => {
      const d = e?.detail
      if (!d || typeof d.답 !== 'function') return
      d.받았다?.()
      set답하기(() => d.답)
    }
    window.addEventListener(알림이벤트, 받기)
    // 🔁 앱을 켤 때 한 번 — 이미 켠 폰의 구독이 워커에 «있게» 맞춘다(서비스워커가 바뀌어도 살아남는다). 실패해도 조용하다.
    구독맞추기()
    // 🙋‍♀️ [창업자 2026-09-26] 기존 유저에게만 «한 번» — 켜고 4초 뒤(첫 화면이 자리 잡은 뒤) 시트를 띄운다. 판정 = pushConsent.기존유저한번물을까
    let 타이머 = null
    try {
      const 저장소 = { get: (k) => localStorage.getItem(k), set: (k, v) => localStorage.setItem(k, v) }
      if (기존유저한번물을까(저장소, localStorage.getItem(ONBOARD_KEY) === '1')) {
        타이머 = setTimeout(() => {
          try { localStorage.setItem(기존물음칸, '1') } catch { /* noop */ }
          알림켜기().catch(() => {})
        }, 4000)
      }
    } catch { /* 못 읽으면 안 묻는다 — 담기 자리가 그대로 있다 */ }
    return () => { window.removeEventListener(알림이벤트, 받기); if (타이머) clearTimeout(타이머) }
  }, [])

  if (!답하기) return null
  return <시트 답={(v) => { const f = 답하기; set답하기(null); f(v) }} />
}

function 시트 ({ 답: 원답 }) {
  // 🚪 push_seen / push_ok / push_no — 알림은 «돈 안 들이고 다시 부르는 유일한 길»이라 이 셋이 제일 아깝다.
  //    ⛔ 「닫기」·바깥 탭(답(null))도 «안 허락한 것»이라 push_no 로 센다 — 허락은 'yes' 하나뿐이다.
  useEffect(() => { try { 알림시트봄() } catch { /* 통계가 죽어도 시트는 뜬다 */ } }, [])
  const 답 = (v) => { try { (v === 'yes' ? 알림허락 : 알림거절)() } catch { /* noop */ } 원답(v) }
  const 닫기 = () => 답(null)
  useModalBack(닫기)
  return (
    <Portal>
      <div className="sheet-mask" onClick={닫기} style={{ zIndex: 1300 }}>
        <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 22 }}>
          <div className="emoji-sheet-head">
            <span>알림 받을까요?</span>
            <button className="press" onClick={닫기} style={{ color: 'var(--text-sub)', fontSize: 15, fontWeight: 600 }}>닫기</button>
          </div>
          <div style={{ padding: '2px 16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Icon name="clock" size={20} color="var(--brown)" stroke={2} />
              <div style={{ fontSize: 15.5, fontWeight: 700 }}>새 레시피가 열리면 알려드릴게요</div>
            </div>
            <div style={{ background: 'var(--cream)', borderRadius: 12, padding: '13px 15px', fontSize: 14.5, lineHeight: 1.85, whiteSpace: 'pre-line' }}>
              {/* ✂️ [2026-09-20 20:45 창업자 「알림 내용이 너무 길다는거야」 → 20:46 「마지막꺼」] 줄표를 떼고 네 줄 다 짧게.
                  📮 창업자가 손수 쓴 문구 = 「유통기한 D-2 재료. 한번만」 — 「한 번만」이 «자주 오는 것 아니냐»는 걱정을 미리 누른다.
                  ⭐ D-2 표기는 낯설지 않다 — 냉장고 화면이 이미 「가까우면 D-3 표시」를 쓴다(PantryView). */}
              · <b>새 레시피</b>가 열리는 날{'\n'}
              · <b>토요일 아침</b> 장바구니{'\n'}
              · <b>유통기한 D-2 재료</b> (한 번만){'\n'}
              · <b>가끔</b> 새 꾸미기
            </div>
            <div className="t-sub" style={{ fontSize: 13.5, lineHeight: 1.6, margin: '10px 2px 14px' }}>
              <b>하루에 한 번</b>만 보내요. 언제든 <b>설정</b>에서 끌 수 있어요.
            </div>
            <button className="btn-primary press" style={{ width: '100%' }} onClick={() => 답('yes')}>알림 받을게요</button>
            <button className="press" style={{ width: '100%', marginTop: 10, color: 'var(--text-sub)', fontSize: 15.5, fontWeight: 600, padding: '8px 0' }} onClick={() => 답('no')}>괜찮아요</button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
