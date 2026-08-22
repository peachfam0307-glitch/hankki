import Portal from './Portal'
import Icon from './Icon'
import { sharePendingNow, saveShareFiles } from '../shareCover'
import uiDuoHi from '../assets/stickers/photo/gp_duohi.png'

// 📮📮 **「지금 보내기」 — 다 만들었는데 «공유 허가»가 끊겼을 때 띄운다.**
//
//   ⛔ 폰의 Web Share 는 사용자가 누른 «직후»에만 열린다(user activation).
//      그런데 표지·카드를 사진으로 뜨는 데 십수 초가 걸려, 다 만들어 놓고도
//      허가가 만료돼 «다운로드»로 밀려났다 — 창업자가 세 번 제보한 그 증상이다
//      (2026-08-03 「먹통」 · 08-04 「다운로드」 · 08-05 *"내가만든표지는안돼"*).
//
//   ⭐ 이 버튼을 누르는 건 «새 터치»라 허가가 살아 있다 → 공유창이 반드시 열린다.
//      기다림을 없애는 대신 **한 번 더 누르게** 한다. 저장은 이제 «밀려나는 것»이 아니라 «고르는 것».
//
//   📌 랜덤 카드(`ShareDrawCard`)에도 같은 장치가 있다. **두 곳을 같이 고쳐야 한다** —
//      한쪽만 고쳐서 오래 남았던 적이 있다(카드 푸터 주소 · v8.41→08-04).
export default function SendNowSheet({ pending, onClose }) {
  if (!pending) return null
  const send = () => {
    const t = sharePendingNow(pending)
    if (t) { t.then(onClose).catch((e) => { if (e && e.name === 'AbortError') onClose() }); return }
    saveShareFiles(pending.files) // 이 폰은 파일 공유 자체가 안 된다
    onClose()
  }
  return (
    <Portal>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'fixed', inset: 0, zIndex: 320, background: 'rgba(30,26,22,.62)', backdropFilter: 'blur(2px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 }}
      >
        <img src={uiDuoHi} alt="" draggable={false} style={{ width: 64, height: 64, objectFit: 'contain' }} />
        <div style={{ color: '#fff', fontSize: 18.5, fontWeight: 800 }}>표지가 다 됐어요</div>
        <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 15.5, textAlign: 'center', lineHeight: 1.55 }}>
          그리는 데 시간이 걸려서 한 번 더 눌러야 해요.<br />아래를 누르면 바로 보내집니다.
        </div>
        <button className="press" onClick={send}
          style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, padding: '15px 34px', borderRadius: 999, background: '#fffdf8', color: '#5d3410', fontWeight: 800, fontSize: 18, border: 'none' }}>
          <Icon name="share" size={18} stroke={2.2} />지금 보내기
        </button>
        <button className="press" onClick={() => { saveShareFiles(pending.files); onClose() }}
          style={{ padding: '9px 18px', background: 'transparent', color: 'rgba(255,255,255,.85)', fontSize: 16.5, fontWeight: 700, border: 'none' }}>
          사진으로 저장할게요
        </button>
      </div>
    </Portal>
  )
}
