import { useMemo, useState } from 'react'
import { useStore, 다읽었나 } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import Thumb from '../components/Thumb'
import SourceBadge from '../components/SourceBadge'
import ConfirmSheet from '../components/ConfirmSheet'
import { timeAgo } from '../utils'
import { getOcrLeft, KEY_NAME, KEY_UNIT } from '../ocr'
import { tidyRecipe } from '../tidy'
import { 만회값 } from '../retidy'
import uiKeyOne from '../assets/ui/key_one.png'
import uiKeyHole from '../assets/ui/key_hole.png'

// 🔎🔎 **「왜 아직 여기 있나」를 «줄마다» 말해준다** (창업자 확정 2026-09-02)
//
//   📮 창업자 = *"자동으로 보내기가 되면 결국 남아있는건 제대로 못읽은 레시피라는거잖아.
//      **이걸 우리는 아는데 유저들은 모르고, 얘는 왜 자동으로 안가고 여기있지? 할 것 같은데**"*
//
//   ⭐⭐ 정확한 지적이다 — 저절로 졸업시키는 순간 이 화면은 **「덜 읽힌 것만 남는 곳」**이 되는데
//      화면이 그 이유를 **한 마디도 안 했다.** 그러면 남은 줄이 «고장»으로 읽힌다.
//   ⭐ 이유는 **저장된 값만 세면 나온다** — AI 를 다시 부르지 않는다(⛔열쇠 0개).
//   ⛔ 잣대는 `store.js` 의 `다읽었나()` 와 «같은 말»이라야 한다 —
//      「왜 남았나」가 「왜 졸업 못 했나」와 갈리면 그게 더 나쁜 거짓말이다.
function 남은까닭(r) {
  const 재료 = Array.isArray(r?.ingredients) ? r.ingredients.length : 0
  const 걸음 = Array.isArray(r?.steps) ? r.steps.length : 0
  if (재료 < 2 && 걸음 < 2) return '재료·순서를 덜 읽었어요'
  if (재료 < 2) return '재료를 덜 읽었어요'
  if (걸음 < 2) return '순서를 덜 읽었어요'
  // 둘 다 넉넉한데 남아 있다 = 유저가 일부러 뒀거나 손으로 지운 것. 「고장」이 아니라고 말해준다.
  return '저장만 하면 돼요'
}

export default function InboxScreen() {
  const { recipes, removeRecipe, updateRecipe } = useStore()
  const nav = useNav()
  // 미정리함은 "버릴 것"이 쌓이는 곳 — 상세까지 안 들어가고 여기서 바로 지운다(창업자 요청).
  const [delAsk, setDelAsk] = useState(null)
  // 🤖🗃 **[2026-09-05 · 창업자 「보관함에 「AI로 다듬기」 단추 ㄱㄱ」]** 줄마다 AI 를 «다시» 부른다.
  //   ⭐ 왜 여기인가 = 보관함에 남은 이유가 «AI 실패»다(2026-09-05 부터 AI 가 성공했을 때만 졸업한다).
  //      그 자리에서 한 번 더 → 성공하면 «저절로» 레시피 탭으로 — 창업자가 말한 「다듬고 다시 나가는」 흐름.
  //   💰 열쇠 0개 — 글자 읽기는 이미 끝났고 그것만 열쇠를 센다(`ocr.js` 한 곳). `tidyRecipe` 는 안 깎는다.
  //   ⭐ 얹는 규칙은 `retidy.js` 의 `만회값()` «한 곳» — 상세 화면의 자동 만회와 «같은 말»이라야 안 갈린다.
  //   ⛔ 원문(`rawText`)이 없는 편(8/22 이전에 담은 것)엔 단추를 안 그린다 — 없는 걸 있는 척하지 않는다.
  const [다듬는중, set다듬는중] = useState('')   // 지금 AI 가 도는 줄의 id (한 번에 하나)
  const 다듬기 = async (r) => {
    const 원문 = String(r.rawText || '')
    if (다듬는중 || 원문.length < 40) return
    set다듬는중(r.id)
    nav.showToast('AI가 다듬는 중이에요 · 20~60초 걸려요', 6000)
    // 👁 사진도 같이(ⓒ) — 저장된 캡처가 dataURL 이면 그것(`tidy.js` 가 한 번 더 거른다)
    const 사진 = typeof r.image === 'string' && r.image.startsWith('data:image/') ? r.image : ''
    const ai = await tidyRecipe(원문, 사진)
    set다듬는중('')
    if (!ai) {
      // ⛔ 유저가 «직접 눌렀으니» 실패도 말한다(공유받기 때 조용한 것과 다르다)
      updateRecipe(r.id, { tidyFail: 2 })
      // ⛔ `tidyFounder`·`tidyTail` 을 여기서 직접 부르지 않는다 — 운영자 판정 잣대는 `getOcrLeft().무제한` 한 곳(_repro-운영자무제한-0902)
      nav.showToast('AI 다듬기는 못 했어요 · 한 번 더 눌러 보세요', 6000)
      return
    }
    const { 바꿀것 } = 만회값(r, 원문, ai)
    updateRecipe(r.id, 바꿀것)
    // ⭐ «어디로 갔는지»를 말한다 — 졸업했으면 목록에서 사라지는데, 안 말하면 「지워졌다」로 읽힌다
    // ⛔ 여기엔 `tidyTail()` 을 안 붙인다 — 「옮겼어요 · AI가 정리했어요」처럼 같은 말이 두 번 된다(9/05 캡처)
    nav.showToast(바꿀것.status === 'sorted' ? 'AI가 다듬어서 「레시피」 탭으로 옮겼어요' : 'AI가 다듬었어요 · 아직 반쪽이라 여기 둘게요', 5200)
  }
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
          aria-label={ocrLeft.무제한
            ? `운영자 모드 · ${KEY_NAME} 무제한`
            : `무료 ${KEY_NAME} ${ocrLeft.total}${KEY_UNIT} 남았어요`}
        >
          {/* 🔓 [2026-09-02] 운영자면 「∞」 — 전엔 여기가 «서버가 준 0»을 그대로 그려서
              한도는 안 걸리는데 화면만 0 이었다(창업자 폰 실물). 잣대는 `getOcrLeft().무제한` 하나다. */}
          <img
            src={ocrLeft.무제한 || ocrLeft.total > 0 ? uiKeyOne : uiKeyHole}
            alt="" aria-hidden="true" draggable={false}
            style={{ height: 22, width: 'auto', flexShrink: 0 }}
          />
          <span style={{
            fontSize: 16, fontWeight: 800, letterSpacing: '-.3px',
            color: ocrLeft.무제한 || ocrLeft.total > 0 ? '#3d6b38' : '#b4442f',
          }}>
            {ocrLeft.무제한 ? '∞' : ocrLeft.total}
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
        {/* 🪧🪧 **「왜 이것들만 남았나」를 «맨 위에서» 한 번 말한다** (창업자 확정 2026-09-02)
            📮 창업자 = *"얘는 왜 자동으로 안가고 여기있지? 할 것 같은데"*
            ⭐ 줄마다 붙는 까닭(`남은까닭`)은 «이 줄» 얘기고, 이 한 줄은 «이 화면 전체»가 무슨 곳인지를 말한다.
               둘이 층이 달라서 겹치지 않는다.
            ⛔ 목록이 비었을 땐 안 띄운다 — 빈 화면엔 이미 제 안내가 있다(바로 위). */}
        {list.length > 0 && (
          <div className="t-sub" style={{ padding: '2px 4px 12px', lineHeight: 1.5 }}>
            다 읽은 레시피는 「레시피」 탭으로 갔어요 · 여기 있는 건 덜 읽힌 거예요
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className="t-sub">{timeAgo(r.savedAt)}</span>
                    {/* 🔎 왜 아직 여기 있나 — 저장된 값만 세서 만든다(⛔AI 안 부른다 · 열쇠 0개) */}
                    <span className="t-sub" style={{ color: 'var(--brown)' }}>· {남은까닭(r)}</span>
                  </div>
                </div>
              </button>
              <button className="icon-btn press" aria-label={`${r.title} 삭제`} onClick={() => setDelAsk(r)} style={{ flex: '0 0 auto' }}>
                <Icon name="trash" size={18} color="var(--text-sub)" />
              </button>
            </div>
            {/* 🚪🚪 **나가는 길 둘 — 여기서 «바로»** (창업자 확정 2026-09-02)
                📮 창업자 = *"임시보관함 자체에 선택해서 저장하는 기능을 넣어야해"* ·
                   *"레시피를 내가 편집하지 않는이상 큰 정리완료 단추는 못찾고"* · *"그럼 유저가 그걸 어떻게 고쳐??"*
                ⛔ 그 전엔 나가는 길이 **편집기 안에만** 있었다 — 줄 누르기 → 상세 → 「아직 정리 전이에요」 → 편집 → 저장.
                   **세 화면**을 지나야 했고, 그 끝의 단추엔 「저장」이란 말도 없었다(「정리 완료」).
                ⭐ 그래서 둘로 갈랐다 — **고칠 사람**은 곧장 편집기로, **이대로 쓸 사람**은 여기서 끝낸다.
                ⛔ 「채우러 가기」는 **열쇠를 안 쓴다** — `prefill.ocrImages` 가 없으면 편집기는 OCR 을 안 돈다
                   (`EditorScreen.jsx` 딸려온사진Ref). 이미 저장된 캡처·원문을 «보여줄» 뿐이다.
                ⛔ 「그대로 저장」을 **다 읽힌 것에만 띄우지 않는다** — 반쪽만 읽혀도
                   *"난 이대로 쓸래"* 하는 사람이 있다. 고를 자유를 뺏지 않는다.
                ⛔ 휴지통과 헷갈리면 안 된다 — 이 줄은 **글자 단추**라 아이콘(🗑)과 모양부터 다르다. */}
            <div style={{ display: 'flex', gap: 8, padding: '0 4px 10px 70px' }}>
              {/* 🤖 AI로 다듬기 — 원문이 있는 줄에만 · 열쇠 0개 · 성공하면 저절로 졸업(창업자 2026-09-05) */}
              {String(r.rawText || '').length >= 40 && (
                <button
                  className="press"
                  onClick={() => 다듬기(r)}
                  disabled={!!다듬는중}
                  style={{
                    flex: 1, padding: '9px 10px', borderRadius: 'var(--r-md)', border: 'none',
                    background: 다듬는중 === r.id ? 'var(--cream)' : 'var(--blue, #5b7aa8)',
                    color: 다듬는중 === r.id ? 'var(--text-sub)' : '#fff', fontSize: 15.5, fontWeight: 700,
                  }}
                >
                  {다듬는중 === r.id ? '다듬는 중…' : 'AI로 다듬기'}
                </button>
              )}
              {!다읽었나(r) && (
                <button
                  className="press"
                  onClick={() => nav.push({ name: 'editor', id: r.id })}
                  style={{
                    flex: 1, padding: '9px 10px', borderRadius: 'var(--r-md)', border: 'none',
                    background: 'var(--cream)', color: 'var(--brown)', fontSize: 15.5, fontWeight: 700,
                  }}
                >
                  채우러 가기
                </button>
              )}
              <button
                className="press"
                onClick={() => {
                  updateRecipe(r.id, { status: 'sorted' })
                  // ⭐ «어디로 갔는지»를 말한다 — 안 말하면 목록에서 사라진 게 「지워졌다」로 읽힌다.
                  nav.showToast('「레시피」 탭으로 옮겼어요')
                }}
                style={{
                  flex: 1, padding: '9px 10px', borderRadius: 'var(--r-md)', border: 'none',
                  background: 'var(--brown)', color: '#fff', fontSize: 15.5, fontWeight: 700,
                }}
              >
                {다읽었나(r) ? '레시피로 저장' : '그대로 저장'}
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
