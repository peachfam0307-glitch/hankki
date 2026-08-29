import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import Thumb from '../components/Thumb'
import SourceBadge from '../components/SourceBadge'
import ConfirmSheet from '../components/ConfirmSheet'
import { timeAgo } from '../utils'
import { getOcrLeft, KEY_NAME, KEY_UNIT } from '../ocr'
import uiKeyOne from '../assets/ui/key_one.png'
import uiKeyHole from '../assets/ui/key_hole.png'

export default function InboxScreen() {
  const { recipes, removeRecipe } = useStore()
  const nav = useNav()
  // 미정리함은 "버릴 것"이 쌓이는 곳 — 상세까지 안 들어가고 여기서 바로 지운다(창업자 요청).
  const [delAsk, setDelAsk] = useState(null)
  const ocrLeft = getOcrLeft()   // 🔑 상단바 오른쪽 잔량 — 화면을 열 때마다 새로 읽는다

  // 🗃🗃 [창업자 확정 2026-08-28 = ㉠] **정리 끝난 레시피는 여기 «안» 보인다.**
  //
  // 📮 창업자 = *"보관함에 있는 반영된 레시피는 따로 보관해야지.
  //    **유저들이 모르고 지울 수도 있을 것 같아. 미정리랑 같이있으니까..**"*
  //
  // ⛔⛔ **맞는 걱정이었고 실물이 그랬다** — 전엔 `[...recipes]` 를 «필터 없이» 그대로 썼다.
  //    창업자 폰 = 「전체 248 · 미정리 6 · **정리됨 242**」 인데 그 242 는
  //    **「내 레시피」 탭이 보여주는 바로 그 목록이다**(`MyRecipesScreen.jsx` = `status === 'sorted'`).
  //    ⭐ 같은 것을 두 곳에서 보고 있었고, **여기엔 줄마다 휴지통이 있다.**
  //       미정리인 줄 알고 누르면 `removeRecipe` 가 `recipes` 에서 통째로 빼서
  //       **「내 레시피」에서도 사라진다**(`store.jsx` `case 'remove'`). 기본 레시피까지 지워진다.
  //
  // ⭐ 그래서 「전체 비우기」를 «만들지 않았다» — 만들었으면 그게 사고였다.
  //    이름이 **「임시」**보관함이니 **임시인 것만** 둔다. 정리가 끝나면 「내 레시피」로 졸업한다.
  // ⛔ 잃는 것 0 — 정리된 레시피는 「내 레시피」 탭에 그대로 있다(지우는 게 아니라 «안 보이게» 한다).
  // ⛔ 칩 셋(전체/미정리/정리됨)도 같이 뺐다 — 목록이 한 갈래뿐이라 고를 게 없다.
  //    「정리됨」 개수는 설정 통계와 「내 레시피」가 이미 보여준다.
  const list = useMemo(
    () => recipes.filter((r) => r.status === 'unsorted').sort((a, b) => b.savedAt - a.savedAt),
    [recipes]
  )

  return (
    <div className="screen fade">
      <div className="topbar-back">
        <button className="icon-btn press" onClick={() => nav.pop()} aria-label="뒤로">
          <Icon name="chevron-left" size={24} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 19, fontWeight: 700 }}>
          {/* 🏷 [2026-08-21] 「Inbox」 → 「임시보관함」. 창업자 = *"**INBOX나도 어딨는지 모르는데**"*
              ⭐ 못 찾은 이유가 둘이었다 — ⑴입구가 조건부라 사라졌다(홈에서 고쳤다) ⑵**이름이 영어**라
                 홈에서 찾아도 화면 제목이 Inbox 라 같은 곳인지 알 수 없었다.
              ⛔ 처음엔 「보관함」으로 했는데 창업자가 물렸다 — *"**임시보관함으로 바꾸던가.. 그냥 보관함은 애매**"*
              ⭐⭐ 맞는 지적이다. 「보관함」은 **오래 두는 곳**으로 읽혀서 «레시피 탭»과 뜻이 겹친다.
                 여기는 **「담아만 두고 나중에 정리할 곳」**이라 「임시」가 그 성격을 그대로 말한다.
              ⛔ 화면에 보이는 영어 낱말을 늘리지 않는다(v11.02 「my pick」을 접은 것과 같은 이유). */}
          <Icon name="inbox" size={20} /> 임시보관함
        </div>
        {/* 🔑🔑 [2026-08-29 · 창업자 지시] *"임시보관함 위에 열쇠랑 숫자표시도 해줘야 할 듯"*
            ⭐⭐ **여기가 열쇠를 «쓴 결과»가 쌓이는 곳이다** — 사진으로 담은 것이 전부 이 목록으로 온다.
               가져오기 화면엔 큰 잔량 띠가 있는데(v11.30), 담고 «나온 뒤»엔 잔량을 볼 자리가 없었다.
               창업자가 그날 토스트로만 「0개 남았어요」를 보고 놀란 자리가 정확히 여기다.
            ⭐ 자리 = 상단바 오른쪽. 원래 `width: 40` 짜리 **빈 칸**이라 새로 밀어낼 것이 0이다.
            ⛔ 큰 띠를 그대로 옮기지 않았다 — 여기는 «목록»이라 위가 두꺼우면 정작 레시피가 밀린다.
            ⛔ 이름·단위는 `ocr.js` 한 곳에서 읽는다(v11.30 — 이름이 또 바뀌어도 여기가 안 낡는다). */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 40, justifyContent: 'flex-end' }}
          aria-label={`무료 ${KEY_NAME} ${ocrLeft.total}${KEY_UNIT} 남았어요`}
        >
          <img
            src={ocrLeft.total > 0 ? uiKeyOne : uiKeyHole}
            alt="" aria-hidden="true" draggable={false}
            style={{ height: 22, width: 'auto', flexShrink: 0 }}
          />
          <span style={{
            fontSize: 16, fontWeight: 800, letterSpacing: '-.3px',
            color: ocrLeft.total > 0 ? '#3d6b38' : '#b4442f',
          }}>
            {ocrLeft.total}
          </span>
        </div>
      </div>

      <div className="pad">
        {list.length === 0 && (
          // ⭐ 「정리 끝난 건 여기 없다」를 «빈 화면»에서 알려준다 — 정리하고 나서
          //    「내가 담은 게 어디 갔지」가 되지 않게. ⛔놀라게 하지 않는 게 이 줄의 일이다.
          <div className="empty">
            {'정리할 레시피가 없어요. 깔끔하네요!\n정리 끝난 레시피는 「레시피」 탭에 있어요.'}
          </div>
        )}
        {list.map((r, i) => (
          <div key={r.id}>
            {/* 행 전체=열기, 오른쪽 휴지통=바로 삭제(상세 ⋯메뉴까지 안 가게) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button className="inbox-row press" style={{ flex: 1, minWidth: 0, textAlign: 'left' }} onClick={() => nav.push({ name: 'detail', id: r.id })}>
                <Thumb recipe={r} style={{ width: 60, height: 60, flex: '0 0 auto' }} radius={14} emojiSize="1.5rem" showDecor />
                <div className="meta" style={{ flex: 1, minWidth: 0 }}>
                  <SourceBadge source={r.source} />
                  <div className="name" style={{ fontSize: 17, fontWeight: 600, margin: '3px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.title}
                  </div>
                  {/* ⛔ 「미정리」 배지를 뺐다 — 이제 이 화면엔 «미정리만» 있어서
                      줄마다 같은 배지가 뜨면 그냥 노이즈다(창업자가 여러 번 짚은 「정신없다」).
                      ⭐ 배지는 «갈릴 때» 뜻이 있다. 다 같으면 아무것도 안 알려준다. */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="t-sub">{timeAgo(r.savedAt)}</span>
                  </div>
                </div>
              </button>
              <button className="icon-btn press" aria-label={`${r.title} 삭제`} onClick={() => setDelAsk(r)} style={{ flex: '0 0 auto' }}>
                <Icon name="trash" size={18} color="var(--text-sub)" />
              </button>
            </div>
            {i < list.length - 1 && <hr className="divider" />}
          </div>
        ))}
      </div>

      {delAsk && (
        <ConfirmSheet
          title="레시피 삭제"
          message={`『${delAsk.title}』 레시피를 삭제할까요?\n삭제하면 되돌릴 수 없어요.`}
          confirmLabel="삭제하기"
          danger
          onConfirm={() => { removeRecipe(delAsk.id); nav.showToast('레시피를 삭제했어요') }}
          onClose={() => setDelAsk(null)}
        />
      )}
    </div>
  )
}
