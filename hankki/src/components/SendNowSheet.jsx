import Portal from './Portal'
import Icon from './Icon'
import { sharePendingNow, saveShareFiles, 모든파일 } from '../shareCover'
import { useLayerBack } from '../useBackHandler'
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
//   🗣🗣 **[2026-08-28] `onShared` 를 붙였다 — 여기가 「리뷰가 안 뜬다」의 «네 번째» 구멍이었다.**
//      📮 창업자 = *"리뷰 안떠..ㅠㅠ"* (v11.74 로 `sendCover` 를 고친 «뒤»에도)
//      ⛔ 그날 낮에 고친 건 `sendCover` 가 «바로» 공유에 성공하는 길뿐이었다.
//         그런데 창업자 폰은 캡처가 십수 초 걸려 **허가가 끊기는 쪽**으로 간다 —
//         그게 이 시트다(창업자가 08-03·08-04·08-05 세 번 제보한 그 증상).
//         → 「지금 보내기」로 **공유는 진짜로 성공하는데** `sendCover` 의 `finally` 는 벌써 지나가서
//           `자랑보냄` 이 false 로 되돌려진 뒤였다. **보냈는데 아무도 안 물어본다.**
//      📌 어제 내가 이 파일 옆에 *"「한 곳만 감쌌다」는 말이 맞으려면 그 한 곳을 «모든 길»이 지나가야 한다"*
//         라고 적어놓고 **이 길을 안 셌다.** `ShareDrawCard` 는 「지금 보내기」까지 `go()` 를 지나가서 멀쩡한데,
//         `sendCover` 쪽은 이 시트가 `sharePendingNow` 를 «직접» 불러서 빠져나갔다.
//      ⛔ 취소(AbortError)·「사진으로 저장」은 «안» 부른다 — 안 보낸 사람에게는 안 청한다.
//   📱📱 **[2026-08-28 · ⓑ] 이 시트가 «두 가지 일»을 한다 — `pending.이어보내기` 로 갈린다.**
//      ⑴ (없으면) **허가가 끊겼다** → 「표지가 다 됐어요 · 지금 보내기」  ← 원래 하던 일
//      ⑵ (있으면) **표지는 나갔고 레시피가 한 장 남았다** → 「표지를 보냈어요 · 레시피도 보내기」
//      📮 창업자 = *"폰처럼 한장씩 따로따로는 못들어가?"* → **"ㄴ으로 하자"**(＝한 장 보내고 한 번 더 청한다)
//      ⭐ **새 시트를 안 만든다** — 이 시트가 이미 ⓐPortal ⓑ뒤로가기 층(`useLayerBack`) ⓒz-index 320 을
//         갖고 있고, 두 화면에 이미 붙어 있다. 새로 만들면 그 셋을 또 맞춰야 하고 **한쪽이 낡는다.**
//      ⛔ 「레시피도 보내기」는 **반드시 새 터치**라야 한다 — 앞 공유가 끝나자마자 코드로 또 부르면
//         허가(user activation)가 없어 폰이 거절한다. 그래서 «버튼»이지 자동이 아니다.
export default function SendNowSheet({ pending, onClose, onShared }) {
  // ⛔ 랜덤 카드와 «같은 구멍» — 뒤로가기 층에 없어서 뒤로 누르면 홈으로 샌다
  //    (창업자 2026-08-23 *"뒤로가기할때야. 닫기누르면 그대로있어"*).
  // ⭐ 이 시트는 «늘 붙어 있고» `pending` 이 없을 때 null 을 돌려준다 → 마운트 ≠ 열림.
  //    그래서 `useModalBack`(마운트=열림)이 아니라 `useLayerBack`(열릴 때만)이 맞다.
  // ⛔ 훅은 조건부 `return` «앞»에 둔다 — 뒤에 두면 열릴 때 훅 개수가 달라져 앱이 죽는다
  //    (2026-08-20 메모지에서 실제로 겪었다).
  useLayerBack(!!pending, onClose)
  if (!pending) return null
  const 이어 = !!pending.이어보내기 // 📱 ⑵ 표지는 나갔고 레시피 한 장이 남은 자리
  const send = () => {
    const t = sharePendingNow(pending)
    // ⭐ 보내고 나서 «남은 한 장»을 호출부에 넘긴다 — 호출부가 그걸로 이 시트를 한 번 더 띄운다.
    //    ⛔ 여기서 내가 직접 다시 띄우지 않는다 — `pending` 은 호출부 상태다(두 곳에서 관리하면 어긋난다).
    if (t) { t.then(() => { onShared?.(); onClose(pending.다음 || null) }).catch((e) => { if (e && e.name === 'AbortError') onClose() }); return }
    saveShareFiles(모든파일(pending)) // 이 폰은 파일 공유 자체가 안 된다
    onClose()
  }
  return (
    <Portal>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'fixed', inset: 0, zIndex: 320, background: 'rgba(30,26,22,.62)', backdropFilter: 'blur(2px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 }}
      >
        <img src={uiDuoHi} alt="" draggable={false} style={{ width: 64, height: 64, objectFit: 'contain' }} />
        <div style={{ color: '#fff', fontSize: 18.5, fontWeight: 800 }}>{이어 ? '표지를 보냈어요' : '표지가 다 됐어요'}</div>
        <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 15.5, textAlign: 'center', lineHeight: 1.55 }}>
          {이어
            ? <>재료·만드는 법도 한 장 더 있어요.<br />따로 보내야 크게 보여요.</>
            : <>그리는 데 시간이 걸려서 한 번 더 눌러야 해요.<br />아래를 누르면 바로 보내집니다.</>}
        </div>
        <button className="press" onClick={send}
          style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, padding: '15px 34px', borderRadius: 999, background: '#fffdf8', color: '#5d3410', fontWeight: 800, fontSize: 18, border: 'none' }}>
          <Icon name="share" size={18} stroke={2.2} />{이어 ? '레시피도 보내기' : '지금 보내기'}
        </button>
        {/* ⛔ 「이어」 자리엔 «사진으로 저장»을 안 붙였다 — 방금 보낸 사람에게 셋째 갈래를 주면
            고를 게 늘어난다. 여기서 물어보는 건 «한 장 더 보낼까»뿐이다. */}
        <button className="press" onClick={() => { if (!이어) saveShareFiles(모든파일(pending)); onClose() }}
          style={{ padding: '9px 18px', background: 'transparent', color: 'rgba(255,255,255,.85)', fontSize: 16.5, fontWeight: 700, border: 'none' }}>
          {이어 ? '괜찮아요' : '사진으로 저장할게요'}
        </button>
      </div>
    </Portal>
  )
}
