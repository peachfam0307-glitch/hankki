import Portal from './Portal'
import duoHi from '../assets/sharepool/duo_hi.png'

// 🧺🧺 「AI가 다듬는 중」 창 — ⭐**끝날 때까지 화면에 «남아 있는다».**
//
// 📮 창업자 2026-09-08 = *"끝날때까지는 창을 띄워주던가 해야할 듯."*
//    ＋ 그 앞 = *"ai다듬기 화면이 나오고 ai가 끝날때까지는 화면이 떠있어야 하는데 **사라지고
//       오래걸리니까 뒤로가기하거나 앱을 나가거나 할수있을 것 같아**"*
//
// ⛔⛔ **그 전엔 토스트뿐이었다** — 6초 뒤 사라진다. 그런데 AI 는 20~60초 걸린다.
//    → 유저는 **아무 일도 안 일어나는 화면**을 30초 넘게 본다. 그게 「먹통」으로 읽힌다.
//    📌 실제로 창업자가 그 자리에서 뒤로가기를 눌렀고, 그래서 결과를 잃었다.
//
// ⭐ 그래서 이 창이 하는 일은 «막는 것»이 아니라 **「지금 무슨 일이 벌어지는지 계속 말해주는 것」**이다.
//    ⛔ 그래서 **닫는 단추를 둔다** — 갇히면 그게 더 나쁘다.
//       ⭐ 닫아도 «일은 계속된다»(워커가 맡아서 하고, 다 되면 레시피에 저절로 올라간다).
//          그 사실을 글자로 말해 준다 — 안 말하면 닫는 것이 «취소»로 읽힌다.
//
// 📍📍 **[창업자 확정 2026-09-08 10:5x = ⓐ] 이 창은 «두 자리»에만 뜬다. ⛔재론 금지**
//   ✅ 뜨는 곳 = ①임시보관함 「AI로 다듬기」 ②레시피 상세 「다시 하기」
//      → 둘 다 **유저가 «일부러 기다리려고» 누른 자리**다. 그래서 창이 맞다.
//   ⛔ 안 뜨는 곳 = **처음 담을 때**(가져오기·편집기). 창업자 물음 = *"그 애들안내는 레시피마다 뜨는거지?"*
//      → **일부러 안 띄운다.** 그 길은 규칙 파서 결과를 «먼저» 보여주고 AI 는 뒤에서 돈다
//         (App.jsx:794 · EditorScreen.jsx:568 = await 로 앞을 막지 않는다).
//         기다릴 필요가 없는데 창을 띄우면 **안 가둬도 될 사람을 20~60초 가두는 것**이 된다.
//   ⭐ 갈래 셋을 폈고(ⓐ지금대로 · ⓑ처음에도 창 · ⓒ레시피 안 한 줄) 창업자가 **ⓐ**를 골랐다.
//
// ⛔ 유니코드 이모지 금지 — 첫 화면과 같은 곰펭 그림(절대원칙).
export default function TidyWaiting({ onClose, 자동, 남은말, 끝 }) {
  // 🔚 «끝»이 오면 창이 사라지는 게 아니라 «끝말»로 바뀐다 [창업자 2026-09-09]
  //    📮 창업자 = "당황스럽잖아 이게 됐는지 안됐는지 모르니까. 안내를 해줘야 할 거 아냐. 어떻게 하라고"
  //    ⛔ 말은 여기서 «짓지 않는다» — tidy.js 의 까닭말·다듬기끝말 한 곳에서 온다.
  if (끝) {
    return (
      <Portal>
        <div className="sheet-mask">
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'calc(18px + var(--safe-bottom))' }}>
            {/* ⛔ keep-all — 한글은 기본이 «글자» 단위라 낱말 «가운데»가 잘린다(「열쇠는 그대 / 로예요」).
              ⭐ 칸마다 붙이지 않고 여기 «한 번»만 — 안쪽 글자들이 물려받는다 [2026-09-09] */}
          <div style={{ padding: '6px 22px 0', textAlign: 'center', fontFamily: "'Jua', sans-serif", wordBreak: 'keep-all' }}>
              <img src={duoHi} alt="" aria-hidden draggable={false} style={{ width: 96, maxWidth: '30%', display: 'block', margin: '0 auto' }} />
              <div style={{ fontSize: 22, fontWeight: 400, lineHeight: 1.35, marginTop: 10 }}>{끝.머리}</div>
              <div className="t-sub" style={{ fontSize: 16, lineHeight: 1.7, marginTop: 12, wordBreak: 'keep-all' }}>{끝.몸}</div>
              {끝.열쇠말 ? (
                <div style={{ fontSize: 16, marginTop: 10, color: 'var(--brown)' }}>{끝.열쇠말}</div>
              ) : null}
            </div>
            <div style={{ padding: '18px 18px 0' }}>
              <button
                className="press" onClick={onClose}
                style={{ width: '100%', color: 'var(--text-sub)', fontSize: 16.5, fontWeight: 400, padding: '8px 0', fontFamily: "'Jua', sans-serif" }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </Portal>
    )
  }


  return (
    <Portal>
      <div className="sheet-mask">
        <div
          className="sheet"
          onClick={(e) => e.stopPropagation()}
          style={{ paddingBottom: 'calc(18px + var(--safe-bottom))' }}
        >
          {/* ⛔ keep-all — 한글은 기본이 «글자» 단위라 낱말 «가운데»가 잘린다(「열쇠는 그대 / 로예요」).
              ⭐ 칸마다 붙이지 않고 여기 «한 번»만 — 안쪽 글자들이 물려받는다 [2026-09-09] */}
          <div style={{ padding: '6px 22px 0', textAlign: 'center', fontFamily: "'Jua', sans-serif", wordBreak: 'keep-all' }}>
            {/* 📮 [2026-09-09] 창업자 = "안내는 다르게 해야겠지"
                ⛔ 두 길은 «온 까닭»이 다르다 —
                   직접 누른 사람 = 「기다리려고」 왔다  →  얼마나 걸리나·다 되면 어디로 가나
                   저절로 도는 길 = 「기다릴 생각이 없었다」 →  안 기다려도 된다는 말이 «먼저»다 */}
            <div style={{ fontSize: 22, fontWeight: 400, lineHeight: 1.35, marginTop: 10 }}>
              {자동 ? 'AI가 더 다듬는 중이에요' : 'AI가 레시피를 다듬고 있어요'}
            </div>
            {/* ⭐ 창업자가 콕 집은 두 마디 = 「언제 되나」 ＋ 「다 되면 어떻게 되나」 */}
            <div className="t-sub" style={{ fontSize: 16, lineHeight: 1.7, marginTop: 12 }}>
              {자동 ? (
                <>글자는 이미 채웠어요 · 안 기다려도 돼요
                  <br />더 다듬어지면 <span style={{ color: 'var(--brown)' }}>저절로 바뀌어요</span></>
              ) : (
                <>보통 20~60초 걸려요
                  <br />다 되면 <span style={{ color: 'var(--brown)' }}>레시피에 저절로 올라가요</span></>
              )}
            </div>
            {/* 🔑 열쇠 잔량 — 옛 판은 파란 띠가 들고 있었다. 둘이 위아래로 뜨면 둘 다 안 읽힌다. */}
            {남은말 ? (
              <div style={{ fontSize: 16, marginTop: 12, color: 'var(--brown)' }}>{남은말}</div>
            ) : null}
            <div className="t-sub" style={{ fontSize: 14, lineHeight: 1.6, marginTop: 10 }}>
              앱을 닫아도 계속 다듬어요
            </div>
          </div>
          <div style={{ padding: '18px 18px 0' }}>
            <button
              className="press" onClick={onClose}
              style={{ width: '100%', color: 'var(--text-sub)', fontSize: 16.5, fontWeight: 400, padding: '8px 0', fontFamily: "'Jua', sans-serif" }}
            >
              {/* ⭐ [창업자 2026-09-09] 「알겠어요」·「닫고 다른 일 하기」 → «닫기» 하나로. 단추는 하는 일을 말한다 */}
              닫기
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
