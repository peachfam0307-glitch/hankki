// 🔔🖼 «폰 설정»에서 알림 켜는 길 — 그림으로 보여준다. (2026-09-26)
//
// 📮 창업자 = *"이게 글만 있으면 까먹던데 앱 설정들어가서 어떻게 해야하는지"*
// ⭐ 폰이 알림을 «차단»해 둔 사람은 앱이 다시 못 묻는다(브라우저·애플 규칙) — 폰 설정에서만 풀린다.
//    그래서 그 길을 실물 캡처(창업자 갤럭시 · 딸 아이폰 · docs/알림안내-캡처-2026-09-26)로 한 장씩 보여준다.
// ⛔ 그림은 «누를 줄만» 잘랐다 — 캡처에 보이던 설치 앱 목록이 안 나가게(scripts/_그림-알림켜는길-0926.py).
import Portal from './Portal'
import { useModalBack } from '../useBackHandler'
import { 아이폰앱인가 } from '../pushConsent'
import g1 from '../assets/pushguide/g1.webp'
import g2 from '../assets/pushguide/g2.webp'
import g3 from '../assets/pushguide/g3.webp'
import g4 from '../assets/pushguide/g4.webp'
import g5 from '../assets/pushguide/g5.webp'
import i1 from '../assets/pushguide/i1.webp'
import i2 from '../assets/pushguide/i2.webp'
import i3 from '../assets/pushguide/i3.webp'
import i4 from '../assets/pushguide/i4.webp'
import i5 from '../assets/pushguide/i5.webp'

const 갤럭시 = [
  [g1, '폰의 「설정」 앱을 열어요'],
  [g2, '「애플리케이션」을 눌러요'],
  [g3, '아래로 내려 「한끼」를 찾아 눌러요'],
  [g4, '「알림」을 눌러요'],
  [g5, '「알림 허용」을 켜요'],
]
const 아이폰 = [
  [i1, '폰의 「설정」 앱을 열어요'],
  [i2, '맨 아래 「앱」을 눌러요'],
  [i3, '아래로 내려 「한끼」를 찾아 눌러요'],
  [i4, '「알림」을 눌러요'],
  [i5, '「알림 허용」을 켜요'],
]

export default function PushGuideSheet ({ onClose }) {
  useModalBack(onClose)
  const 단계 = 아이폰앱인가() ? 아이폰 : 갤럭시
  return (
    <Portal>
      <div className="sheet-mask" onClick={onClose} style={{ zIndex: 1300 }}>
        <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 22, maxHeight: '88vh', overflowY: 'auto' }}>
          <div className="emoji-sheet-head">
            <span>폰 설정에서 알림 켜기</span>
            <button className="press" onClick={onClose} style={{ color: 'var(--text-sub)', fontSize: 15, fontWeight: 600 }}>닫기</button>
          </div>
          <div style={{ padding: '2px 16px 0' }}>
            <div className="t-sub" style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>
              폰에서 한끼 알림이 꺼져 있어요. 아래 순서대로 켜 주세요.
            </div>
            {단계.map(([그림, 글], n) => (
              <div key={n} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 24, height: 24, borderRadius: 12, background: 'var(--brown)', color: '#fff', fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{n + 1}</span>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{글}</span>
                </div>
                <img src={그림} alt="" style={{ width: '100%', maxWidth: n === 0 ? 200 : 420, display: 'block', margin: n === 0 ? '0 auto' : 0, borderRadius: 12, border: '1px solid var(--line, #eee)' }} />
              </div>
            ))}
            <button className="btn-primary press" style={{ width: '100%', marginTop: 4 }} onClick={onClose}>알았어요</button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
