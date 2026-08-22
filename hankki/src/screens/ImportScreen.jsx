import { useState } from 'react'
import { useStore, newId } from '../store'
import { useNav } from '../App'
import { useBackHandler, useLayerBack } from '../useBackHandler'
import { guessCategory, openExternal } from '../utils'
import { parseRecipeText } from '../parseRecipe'
// ⏳ `fetchLinkRecipe` import 는 뺐다 — 「⏳ 서버 되면 되살릴 것 ①」 참조.
//    ⛔ `src/linkReader.js` 파일은 «안 지웠다» — 공유받기가 쓰고, 되살릴 때 그대로 쓴다.
import { guessFoodIcon } from '../components/FoodIcon'
import { getOcrLeft } from '../ocr'
import Icon from '../components/Icon'
import Portal from '../components/Portal'
// 🐻 [2026-08-13 창업자] *"가져오기에 무료스캔 알림에 캐릭터 하나 넣자(오른쪽 비어있는 칸에)"* · *"귀여운 걸로 해줘. 움직이게"*
//    남았을 땐 꼬르곰 브이(응원) · 다 썼을 땐 둘이 하트(괜찮아요) — 「막혔다」로 읽히면 안 되는 자리라 표정이 갈린다.
//    ⛔ 첫 판은 `ui/gom_thumbsup`·`ui/gom_heart` 였는데 **옛 매끈 그림체**다(창업자 *"쟤 옛날 곰이야"*) → 물결 정본으로.
//    ⭐ 남음 = **펭펭이 돋보기로 들여다보는 컷** — 이 기능이 하는 일(글자를 찾아 읽어준다)이 그림에 그대로 있다.
import uiPengSearch from '../assets/ui/wave/pn_search.png'
import uiDuoHeart from '../assets/ui/wave/duo_hearthand.png'

// '사진으로 가져오기'와 '직접 작성하기'는 결국 같은 작성 화면 — 하나로 합쳤다.
// 캡처는 작성 화면에서 재료/만드는 법 칸별로 읽어 채운다(인식이 훨씬 정확).
// 🔗🔗 [2026-08-21 창업자 확정 = ⓑ] 링크는 「되는 척」을 걷어내고 «이름이 하는 일과 같게» 바꿨다.
//   📮 창업자 = *"우리 링크는 아예 안돼 원래"* → *"AI가져오기처럼 링크 넣으면 자동으로 레시피가 작성되는게
//      아니라 그냥 보관함에 담기고 직접입력해야하잖아. **그건 내가 말한 저장이 아니야 그걸 누가써**"*
//   ⛔ 옛 설명 = 「블로그 글 읽어오기」 — **안 되는 걸 약속했다.** 그래서 눌러 본 사람에겐 «고장»으로 읽혔다.
//      실제로 되는 건 「주소를 담아두는 것」 하나뿐인데 그 말이 뒤에 작게 붙어 있었다.
//   ⏳ 「읽어오기」는 죽은 게 아니라 «미뤄둔» 것 — 창업자 *"C는 되면 좋으니까 **서버되면 꼭 하자**"*.
//      지금은 남의 서버(jina·allorigins) 에 얹혀 있어 우리가 못 고친다. 우리 서버가 서면 되살린다.
//      🔖 되살릴 자리 = 이 파일의 「⏳ 서버 되면 되살릴 것」 주석 셋 ＋ `src/linkReader.js`(그대로 살아 있다)
// 💰💰 [2026-08-21 창업자 확정] *"어 다 안내해"* — **다섯 줄 «전부»에 장수를 붙인다.**
//    ⛔ 처음엔 사진·텍스트 둘에만 붙였는데, 그러면 나머지 셋이 «빈칸»이라
//       「얘넨 공짜인가?」로 읽힌다. 빈칸은 «0장»으로 읽히지 «모름»으로 안 읽힌다.
//    ⭐ `costText` 를 «데이터»로 둔다 — 히어로 카드도 이 값을 읽는다.
//       손으로 두 곳에 적으면 반드시 한쪽이 낡는다(우리가 여러 번 겪은 것).
//    ⭐ `paid` 가 색을 정한다 — 빨강은 «깎인다»를 말하는 색이다. 안 깎이는 길에 빨강을 쓰면
//       색이 뜻을 잃고, 그러면 정작 깎이는 줄도 안 보인다.
//    🔢 실측 = 돈 드는 `ocrImage()` 를 부르는 곳은 셋뿐(EditorScreen·PantryView·App.jsx).
//       ImportScreen 은 `getOcrLeft`(읽기)만 가져온다 → 텍스트·링크가 «0장»인 것은 짐작이 아니다.
//    ⚠️ 인스타·유튜브는 «조건부»다 — 흐름 안에서 캡처를 고르면 1장, 붙여넣기를 고르면 0장.
//       그래서 「캡처는」을 앞에 붙여 조건을 밝힌다. ⛔그냥 「1장」이라 적으면 붙여넣기도 깎이는 줄 안다.
//       ＋ 흐름 화면의 단추 «셋»에도 각각 정확한 값을 적는다(아래 `방법들`).
const OPTIONS = [
  // 제일 많이 쓰는 방법이라 맨 위
  { key: 'write', icon: 'photo', title: '사진 · 직접 작성하기', desc: '캡처는 재료·만드는 법 칸별로 읽어 채워요', color: '#8AA07A', costText: 'AI 스캔 1회 소모', paid: true },
  { key: 'instagram', icon: 'instagram', title: 'Instagram', desc: '캡처해서 담기 (제일 정확)', color: '#C13584', costText: '캡처하면 1회 소모', paid: true },
  { key: 'youtube', icon: 'youtube', title: 'YouTube', desc: '캡처·설명 붙여넣기로 담기', color: '#E33', costText: '캡처하면 1회 소모', paid: true },
  // ⭐ 링크가 못 하는 일을 «이 줄이» 한다 — 그래서 설명을 키웠다(창업자 ⓐ안의 「텍스트 안내를 키운다」를 여기서 살렸다)
  { key: 'text', icon: 'edit', title: '텍스트 붙여넣기', desc: '레시피 글을 붙여넣으면 재료·순서까지 자동 정리', color: '#B0895E', costText: '소모 없음', paid: false },
  { key: 'link', icon: 'link', title: '링크 주소만 담아두기', desc: '주소만 저장해요 · 재료·순서는 안 담겨요', color: '#9B8B79', costText: '소모 없음', paid: false },
]

// 💰 장수 꼬리표 — 다섯 줄·히어로·흐름 단추가 «같은 함수»로 그린다.
//    ⛔ 자리마다 따로 적으면 말이 갈라진다(같은 기능은 같은 이름 원칙).
function 장수꼬리(costText, paid) {
  return (
    // ⛔ `nowrap` — 실물에서 「캡처는 AI / 스캔 1장」으로 갈렸다(규칙 21).
    //    낱말 잘림은 아니지만 «값»이 두 줄로 흩어지면 한눈에 안 읽힌다. 값은 한 덩어리로 넘어가야 한다.
    //    🔢 제일 긴 꼬리(「받아적으면 AI 스캔 0장」)도 12.3px 에서 ~150px — 칸 226px 안이라 안 넘친다.
    <> · <b style={{ fontWeight: 800, color: paid ? 'var(--danger)' : 'var(--text-sub)', whiteSpace: 'nowrap' }}>{costText}</b></>
  )
}

export default function ImportScreen() {
  const { addRecipe } = useStore()
  const nav = useNav()
  const [flow, setFlow] = useState(null) // instagram | youtube | link | text
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [help, setHelp] = useState(false)
  const [aiPreview, setAiPreview] = useState(false) // AI 자동정리 '이렇게 돼요' 안내 시트
  // 📢 AI 스캔 남은 장수 — localStorage 를 읽을 뿐이라 가볍다. 화면에 들어올 때마다 최신값이 나온다.
  const ocrLeft = getOcrLeft()
  const [linkOpen, setLinkOpen] = useState(false) // '링크만 저장'은 접어둔다(화면을 조용하게)

  // 시트(AI 미리보기·도움말)는 히스토리 칸을 쌓아 뒤로가기로 닫는다.
  useLayerBack(aiPreview, () => setAiPreview(false))
  useLayerBack(help, () => setHelp(false))
  // 하위 흐름(링크·사진 등 선택 단계)은 모달이 아니라 화면 내 단계라 상태만 되돌린다.
  useBackHandler(() => {
    if (flow) { setFlow(null); return true }
    return false
  })

  const saveText = () => {
    const t = text.trim()
    if (!t) return
    const r = parseRecipeText(t)
    // pop 하지 않고 push → 뒤로가기 시 '가져오기'로 복귀. (저장하면 편집기가 popAll로 홈)
    // 메모는 직접 입력 전용 — 분류 안 된 찌꺼기를 메모에 붙이지 않는다
    nav.push({ name: 'editor', prefill: { source: 'manual', title: r.title, ingredients: r.ingredients, steps: r.steps } })
  }

  const choose = (key) => {
    if (key === 'write') {
      // 사진·직접 작성 — 작성 화면에서 재료/만드는 법 칸별 📷 로 채운다.
      // pop 하지 않고 그대로 push → 뒤로가기 시 '가져오기' 초기 화면으로 돌아온다.
      nav.push({ name: 'editor' })
    } else {
      setFlow(key)
      setUrl('')
      setTitle('')
      setLinkOpen(false)
    }
  }

  const saveLink = () => {
    const t = title.trim() || `${flowMeta?.title || '새'} 레시피`
    addRecipe(makeInboxRecipe({ source: flow, title: t, sourceUrl: url.trim() }))
    nav.pop()
    nav.push({ name: 'inbox' })
    nav.showToast('임시보관함에 담았어요 · 나중에 정리해요')
  }

  // ⏳ 서버 되면 되살릴 것 ① — 여기 `readLink()`(링크 본문 자동 읽기)가 있었다.
  //    ⛔ 지금 뺀 이유 = 남의 서버 두 곳(`r.jina.ai`·`api.allorigins.win`)에 얹혀 있어서
  //       **되고 안 되고가 우리 손 밖**이고, 창업자 폰에선 «아예» 안 됐다.
  //    ✅ 되살리는 법 = ⑴우리 Worker 에 본문 읽기 길을 낸다 ⑵`fetchLinkRecipe` 를 그 길로 바꾼다
  //       ⑶이 함수와 버튼(②)·기다림 화면(③)을 되돌린다. **`src/linkReader.js` 는 안 지웠다** —
  //       공유받기(`App.jsx`)가 아직 쓰고 있고, 그쪽은 «백그라운드»라 실패해도 유저를 안 붙잡는다.

  const flowMeta = OPTIONS.find((o) => o.key === flow)

  return (
    <div className="screen fade" style={{ paddingBottom: 24 }}>
      <div className="topbar-back">
        <button className="icon-btn press" onClick={() => (flow ? setFlow(null) : nav.pop())} aria-label="닫기">
          <Icon name={flow ? 'chevron-left' : 'x'} size={24} />
        </button>
        <div style={{ fontSize: 18, fontWeight: 700 }} />
        <div style={{ width: 40 }} />
      </div>

      {/* ⏳ 서버 되면 되살릴 것 ③ — 여기 「링크에서 내용을 읽는 중…」 기다림 화면이 있었다.
          위 ②를 뺐으니 이 화면을 띄울 사람이 없어져서 같이 뺐다. */}

      {!flow ? (
        <div className="pad">
          <div className="h-title" style={{ marginTop: 6 }}>가져오기</div>
          <div className="t-sub" style={{ marginTop: 8, marginBottom: 14, fontSize: 16 }}>
            레시피를 가져오는 방법을 선택해 주세요.
          </div>

          {/* 📢📢 남은 장수 — 창업자 *"유저가 몇장남았는지 스스로 알아야해"* · *"되게 잘 보이게"*
              ⭐⭐ 자리 = 제목 «바로 아래·맨 위» (창업자 2026-08-13 판정 *"너무 안보여. 가져오기 바로 아래넣어야지"*)
                 ⛔ 처음엔 아래쪽 「AI 자동 정리」 카드 «안»에 넣었는데 창업자가 «안 보인다»고 물렸다.
                    스크롤해야 나오는 자리는 「잘 보이게」가 아니다.
              ⛔ 「사세요」는 안 붙인다 — 이건 «정보»고 재촉이 아니다(⛔재촉 금지 원칙). */}
          <div style={{
            // ⚠️ 아이콘은 «위쪽» 정렬 — 아래 줄이 두 줄이 되면 가운데 정렬은 별이 붕 뜬다
            display: 'flex', alignItems: 'flex-start', gap: 9,
            marginBottom: 18, padding: '13px 15px', borderRadius: 15,
            background: ocrLeft.total > 0
              ? 'linear-gradient(135deg, #eef7e7, #e2eed7)'
              : 'linear-gradient(135deg, #faf3e6, #f3e9d6)',
            border: `1px solid ${ocrLeft.total > 0 ? '#cfe3c4' : '#e6d6bd'}`,
          }}>
            <Icon name="sparkle" size={20} color={ocrLeft.total > 0 ? '#6e9459' : '#b08a52'} stroke={1.7} />
            {/* ✏️ 말투 = 앱 전체와 같은 「~해요」체 (창업자 2026-08-13 *"남았어요나 완곡한표현으로 바꾸자"*)
                ⛔ 「남음」 같은 명사형은 여기서만 튄다. */}
            {ocrLeft.total > 0 ? (
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 16.5, fontWeight: 800, color: '#3d6b38', letterSpacing: '-.3px' }}>
                  무료 AI 스캔 <span style={{ fontSize: 20.5 }}>{ocrLeft.total}회</span> 남았어요
                </div>
                {/* ⭐⭐ 작은 줄은 «상태마다 다르다» — 여기서 오해가 나면 곧장 분쟁이 된다.
                    ① 웰컴 중 = 창업자 *"매달 20장씩 주는 줄 알지도 몰라"* → **처음 한 번**이라고 못박는다.
                       ⛔ 「20장 남았어요」만 두면 매달 20장으로 읽힌다. 나중에 5장이 되면 「속았다」가 된다.
                    ② 웰컴을 다 쓴 뒤 = 매달 채워진다는 걸 알려준다(끊긴 게 아니다).
                    ③ 3장 이하 = 창업자 *"다쓰면 무료인식되는건 어디서 안내받아?"* → «다 쓰기 전»에 안심시킨다.
                       ⛔ 여태 «다 쓴 뒤»에야 알 수 있었다. 그 불안이 곧 결제 압박이 된다. */}
                {ocrLeft.welcome > 0 ? (
                  // ⭐⭐ 창업자 *"이게 제일 중요하니까 잘보이게 넣어줘"* — 웰컴만 알약으로 띄워 도드라지게.
                  //     나머지 상태는 조용한 회색 한 줄로 둔다(다 크면 아무것도 안 보인다).
                  <div style={{
                    display: 'inline-block', marginTop: 5, padding: '4.5px 10px',
                    borderRadius: 9, background: '#fff', border: '1px solid #cfe3c4',
                    fontSize: 15.6, fontWeight: 700, color: '#4f7d48', lineHeight: 1.4, letterSpacing: '-.2px',
                    // ⛔ 한글 낱말이 잘리면 안 된다 — 첫 판이 「다 쓰면 매 / 달 5장」으로 잘렸다
                    wordBreak: 'keep-all',
                  }}>
                    {/* ⛔⛔ 「익월부터」·「다음 달부터」라고 못박지 «않는다» — 실제로 사람마다 시점이 다르다.
                        · 8월에 20장을 다 쓴 사람 → 8월 카운터가 20이라 그 달은 끝 → 9월부터 5장 (맞다)
                        · 8월에 17장만 쓴 사람 → 웰컴 3장이 9월로 이월 → 9월에 그 3장을 쓰고 «그 9월에 2장 더» 쓴다
                          (worker: 웰컴을 다 쓴 뒤 `userC(3) < PER_USER_MONTHLY(5)` 라 통과)
                        ⭐ 그래서 「다 쓰면(조건) · 매달(주기)」로만 적는다 — 두 경우 다 맞는 유일한 표현. */}
                    <b style={{ fontWeight: 900, color: '#356131' }}>처음 한 번만</b> 드리는 20회예요<br />
                    다 쓰면 <b style={{ fontWeight: 900, color: '#356131' }}>매달 무료 5회</b>
                  </div>
                ) : (
                  <div style={{ fontSize: 15.3, color: 'var(--text-sub)', marginTop: 2 }}>
                    {ocrLeft.total <= 3 ? '다 써도 기본 인식으로 계속 읽어 드려요' : '매달 5장씩 채워져요'}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#8a6a3a', letterSpacing: '-.3px' }}>이번 달 무료 AI 스캔을 다 썼어요</div>
                {/* ⭐ 「못 쓴다」가 아니라 「계속 되는데 품질이 바뀐다」 ＋ 언제·«몇 장» 돌아오는지까지.
                    ⛔ 「다시 채워져요」만 두면 몇 장인지 모른다 → 창업자 *"다음달에 무료5장채워져요"* */}
                <div style={{ fontSize: 15.3, color: 'var(--text-sub)', marginTop: 2, lineHeight: 1.45 }}>
                  기본 인식으로 계속 읽어 드려요<br />다음 달에 <b style={{ fontWeight: 800, color: '#8a6a3a' }}>무료 5회</b> 채워져요
                </div>
              </div>
            )}
            {/* 🐻 오른쪽 빈 칸 — 창업자 *"캐릭터 하나 넣자(오른쪽 비어있는 칸에)"* · *"귀여운 걸로 해줘. 움직이게"*
                ⭐ 통통 튀게(`hk-m-tongtong`) — 이 띠는 «돈이 걸린 안내»라 딱딱해지기 쉬운데, 움직이는 애가 하나 있으면
                   같은 문장도 재촉이 아니라 알림으로 읽힌다.
                ⚠️ 「움직임 끄기」를 켠 사람에겐 저절로 멈춘다(`hk-m-` 접두어가 그 스위치에 걸려 있다).
                ⛔ `alt` 는 비운다 — 옆 글자가 이미 다 말하고 있어서 읽어주기가 같은 말을 두 번 하게 된다. */}
            <img
              src={ocrLeft.total > 0 ? uiPengSearch : uiDuoHeart}
              alt="" aria-hidden="true" draggable={false}
              className="hk-m-tongtong"
              width={ocrLeft.total > 0 ? 38 : 59} height={ocrLeft.total > 0 ? 53 : 53}
              style={{ flex: '0 0 auto', alignSelf: 'center', objectFit: 'contain', margin: '-6px -2px -6px 0' }}
            />
          </div>

          {/* 제일 많이 쓰는 방법 — 히어로(진짜 동작). 첫 유저가 큰 걸 눌러도 바로 되는 기능. */}
          <button
            className="press"
            onClick={() => choose('write')}
            style={{
              width: '100%', textAlign: 'left', marginBottom: 16, padding: '15px 16px',
              borderRadius: 18, border: '1px solid #ecdccb',
              background: 'linear-gradient(135deg, #fbf3e9, #f6ead8)',
              display: 'flex', alignItems: 'center', gap: 13,
            }}
          >
            <div style={{
              width: 46, height: 46, borderRadius: 14, flexShrink: 0,
              background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(150,110,70,.16)',
            }}><Icon name="photo" size={25} color="#8a5a37" stroke={1.7} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 16.5, fontWeight: 800, color: '#8a5a37', whiteSpace: 'nowrap' }}>사진 · 직접 작성하기</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#8a5a37', background: '#f0dcc7', borderRadius: 999, padding: '2px 7px', flexShrink: 0, whiteSpace: 'nowrap' }}>제일 많이 써요</span>
              </div>
              {/* 💰 [2026-08-21] 값을 «고르는 그 줄»에 붙인다 — 창업자가 결제에 대해 정한 원칙과 같다:
                     *"구매 탭은 안 만든다 — 「쓰려는 순간」 그 자리에서"*. 알리는 것도 같은 자리다.
                  ⭐ 여기가 **제일 많이 눌리는 길**이고(「제일 많이 써요」) 동시에 **돈이 드는 길**이다.
                     맨 위 잔량 띠는 「몇 장 남았나」를 말하고, 이 줄은 「이 길이 몇 장을 쓰나」를 말한다 — 다른 말이다.
                  ⛔ `keep-all` — 이 줄은 `.opt-row .t .b` 가 «아니라» 인라인 style 이라
                     v11.19 에 넣은 그 규칙이 안 걸렸다. 실물에서 「읽어 채워 / 요」로 잘려 있었다(규칙 21).
                     📌 같은 병을 한 화면에서 두 번 고쳤다 — 클래스로 고친 것은 «클래스를 쓰는 줄»만 낫는다. */}
              <div style={{ fontSize: 15.3, lineHeight: 1.5, color: 'var(--text-sub)', wordBreak: 'keep-all' }}>
                {OPTIONS[0].desc}{장수꼬리(OPTIONS[0].costText, OPTIONS[0].paid)}
              </div>
            </div>
            <Icon name="chevron-right" size={18} color="#c0a986" />
          </button>

          <div className="card" style={{ overflow: 'hidden' }}>
            {OPTIONS.filter((o) => o.key !== 'write').map((o, i, arr) => (
              <div key={o.key}>
                <button className="opt-row press" onClick={() => choose(o.key)}>
                  <div className="opt-ico">
                    <Icon name={o.icon} size={24} color={o.color} stroke={1.7} />
                  </div>
                  <div className="t">
                    <div className="a">{o.title}</div>
                    <div className="b">{o.desc}{장수꼬리(o.costText, o.paid)}</div>
                  </div>
                  <Icon name="chevron-right" size={18} color="var(--sand)" />
                </button>
                {i < arr.length - 1 && <hr className="divider" style={{ marginLeft: 74 }} />}
              </div>
            ))}
          </div>

          {/* AI 자동정리 — 이미 되는 기능(캡처 OCR·링크 읽기·텍스트). '이렇게 돼요' 안내로. */}
          <button
            className="press"
            onClick={() => setAiPreview(true)}
            style={{
              width: '100%', textAlign: 'left', marginTop: 14, padding: '11px 13px',
              borderRadius: 14, border: '1px solid #d6e5cd',
              background: 'linear-gradient(135deg, #f2f8ed, #e8f1df)',
              display: 'flex', alignItems: 'center', gap: 11,
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(90,120,70,.16)',
            }}><Icon name="sparkle" size={19} color="#7fa06a" stroke={1.6} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 15.5, fontWeight: 800, color: '#4a7a45' }}>AI 자동 정리</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', background: '#7fa06a', borderRadius: 999, padding: '2px 7px', flexShrink: 0 }}>이미 돼요</span>
              </div>
              {/* ⛔ 「캡처·링크 올리면」이었다 — **링크는 자동으로 안 채워진다.**
                     돈 드는 길(사진)과 안 되는 길(링크)이 한 줄에 묶여 있었다(창업자 확정 ⓑ · 2026-08-21).
                  ⛔⛔ 그걸 「캡처·글」로 고쳤는데 **아직 반쪽이었다** — 이번엔 «돈 드는 길»과 «공짜 길»이 묶였다.
                     🔢 코드로 갈랐다 = `ocrImage()`(돈 드는 AI 스캔)를 부르는 곳은 **셋뿐**이다 —
                        캡처(EditorScreen) · 영수증(PantryView) · 공유받기(App.jsx).
                        **글 붙여넣기·링크 담기는 `ocr.js` 를 아예 import 하지 않는다**(ImportScreen 은 `getOcrLeft` 만 읽는다).
                     ⭐ 그래서 「0장」은 짐작이 아니라 실측이다.
                  ⭐ 값을 «숫자 대 숫자»로 놓는다 — 「공짜」라고 쓰면 「되는데 돈만 안 든다」로 읽혀
                     정작 무엇이 깎이는지가 안 보인다. 1 ↔ 0 이 제일 빠르게 읽힌다. */}
              <div style={{ fontSize: 15, lineHeight: 1.45, color: 'var(--text-sub)', marginTop: 2, wordBreak: 'keep-all' }}>
                캡처는 <b style={{ fontWeight: 800, color: 'var(--danger)' }}>1회 소모</b> · 글 붙여넣기는 <b style={{ fontWeight: 800, color: '#4a7a45' }}>소모 없음</b>
              </div>
              {/* ⛔ 남은 장수는 여기 «두지 않는다» — 창업자 *"너무 안보여"* (2026-08-13).
                  스크롤해야 나오는 자리라 「잘 보이게」가 안 된다. → 화면 «맨 위»로 올렸다. */}
            </div>
            <Icon name="chevron-right" size={16} color="#8aa07a" />
          </button>

          <button
            className="card press"
            style={{ width: '100%', textAlign: 'left', marginTop: 20, padding: 16, display: 'flex', alignItems: 'center', gap: 12, background: 'var(--cream)', border: 'none' }}
            onClick={() => setHelp(true)}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>가져오기가 어렵다면?</div>
              <div className="t-sub" style={{ marginTop: 3 }}>인스타·유튜브 레시피를 한끼로 옮기는 법 보기</div>
            </div>
            <div className="opt-ico" style={{ background: '#fff' }}>
              <Icon name="help" size={22} color="var(--sand)" />
            </div>
          </button>
        </div>
      ) : flow === 'text' ? (
        <div className="pad fade">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 4 }}>
            <div className="opt-ico"><Icon name="edit" size={24} color="#B0895E" stroke={1.7} /></div>
            <div className="h-title" style={{ fontSize: 23 }}>텍스트 붙여넣기</div>
          </div>
          <div className="t-sub" style={{ marginTop: 6, marginBottom: 16, fontSize: 16 }}>
            인스타 캡션·블로그·메모의 레시피 글을 그대로 붙여넣으면 제목·재료·순서로 자동 정리해요.
          </div>
          <textarea
            className="diary-note"
            style={{ minHeight: 220 }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'여기에 레시피 글을 붙여넣어 주세요.\n\n예)\n된장크림파스타\n스파게티 200g\n된장 1큰술\n생크림 200ml\n1. 면을 삶는다\n2. 팬에 된장을 풀고 생크림을 넣는다'}
            autoFocus
          />
          <button className="btn-primary press" style={{ marginTop: 18 }} onClick={saveText}>
            자동 정리하기 →
          </button>
        </div>
      ) : flow === 'instagram' || flow === 'youtube' ? (
        <div className="pad fade">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 4 }}>
            <div className="opt-ico"><Icon name={flowMeta.icon} size={24} color={flowMeta.color} stroke={1.7} /></div>
            <div className="h-title" style={{ fontSize: 23 }}>{flowMeta.title}</div>
          </div>
          <div className="t-sub" style={{ marginTop: 6, marginBottom: 16, fontSize: 16.5 }}>
            {flow === 'instagram' ? '인스타 레시피를 한끼로 옮기는 방법이에요.' : '영상 레시피를 한끼로 옮기는 방법이에요.'}
          </div>

          {/* 방법을 카드 몇 장으로 길게 설명하던 걸 '한 줄짜리 선택지'로 바꿨다.
              (창업자 2026-07-29 "설명이 너무 복잡하고 정신없어") 고를 것만 보이게 한다. */}
          {/* 💰💰 [2026-08-21 창업자 *"어 다 안내해"*] 여기가 «진짜 갈림길»이다 —
                 목록 줄은 「캡처는 1장」이라고 조건만 말하고, 셋 중 무엇을 고르는지는 이 화면에서 정해진다.
              ⭐ 그래서 단추마다 «정확한» 값을 적는다. 목록에만 적으면 유저는 여기서 다시 모른다.
              ⚠️ 「보면서 적기」는 «받아적으면» 0장이다 — 그 화면(editor)에서 캡처를 누르면 1장을 쓴다.
                 그래서 그냥 「0장」이라 안 적고 조건을 밝힌다. ⛔안 밝히면 캡처를 누른 사람이 «속았다»고 느낀다. */}
          {(flow === 'youtube'
            ? [
                ['camera', '캡처해서 올리기', '캡처만 하면 재료·순서 자동으로', true, () => nav.push({ name: 'editor', prefill: { source: flow, sourceUrl: url.trim() } }), '1회 소모', true],
                ['pen', '설명(더보기) 붙여넣기', '글 복사해 오면 알아서 정리해요', false, () => { setFlow('text'); setText('') }, '소모 없음', false],
                ['play', '영상 보면서 적기', '영상 띄워두고 아래에 받아적기', false, () => nav.push({ name: 'editor', prefill: { source: flow, sourceUrl: url.trim(), watch: true } }), '받아적으면 소모 없음', false],
              ]
            : [
                ['camera', '캡처해서 올리기', '인스타는 글자 복사가 안 돼요', true, () => nav.push({ name: 'editor', prefill: { source: flow, sourceUrl: url.trim() } }), '1회 소모', true],
                ['pen', '글을 복사했다면 붙여넣기', '복사한 글을 넣으면 알아서 정리해요', false, () => { setFlow('text'); setText('') }, '소모 없음', false],
                ['photo', '미리보기 띄우고 적기', '게시물 띄워두고 아래에 받아적기', false, () => nav.push({ name: 'editor', prefill: { source: flow, sourceUrl: url.trim(), watch: true } }), '받아적으면 소모 없음', false],
              ]
          ).map(([ic, t, d, best, go, costText, paid]) => (
            <button key={t} className="card press" onClick={go}
              style={{ width: '100%', textAlign: 'left', padding: '14px 15px', marginBottom: 10, border: 'none', background: best ? 'var(--cream)' : 'var(--surface)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="opt-ico" style={{ flexShrink: 0, background: best ? '#fff' : 'var(--cream)' }}>
                <Icon name={ic} size={21} color="var(--brown)" stroke={1.8} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16.5, fontWeight: 800 }}>{t}</span>
                  {best && <span style={{ fontSize: 15, fontWeight: 800, color: '#8a5a37', background: '#f0dcc7', borderRadius: 999, padding: '2px 7px' }}>추천</span>}
                </span>
                {/* ⛔ `keep-all` — 꼬리가 붙어 두 줄이 되면 한글 낱말이 가운데서 잘린다(오늘 두 번 겪었다) */}
                <span className="t-sub" style={{ display: 'block', fontSize: 15.3, lineHeight: 1.45, marginTop: 3, wordBreak: 'keep-all' }}>{d}{장수꼬리(costText, paid)}</span>
              </span>
              <Icon name="chevron-right" size={17} color="var(--sand)" />
            </button>
          ))}

          {/* 링크는 '바로가기 저장'뿐이라 접어둔다 — 펼쳐야 보이게. */}
          <button className="press" onClick={() => setLinkOpen((v) => !v)}
            style={{ width: '100%', marginTop: 6, padding: '11px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 16, fontWeight: 700, color: 'var(--text-sub)', background: 'transparent', border: 'none' }}>
            <Icon name="link" size={15} color="var(--text-sub)" stroke={1.8} /> 링크만 저장해두기
            {/* 위/아래 화살표 아이콘이 없어서 오른쪽 꺾쇠를 돌려 쓴다 */}
            <Icon name="chevron-right" size={15} color="var(--sand)" style={{ transform: linkOpen ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform .15s' }} />
          </button>
          {linkOpen && (
            <div className="card fade" style={{ padding: 14, border: 'none' }}>
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={placeholderFor(flow)} inputMode="url" style={{ width: '100%', marginBottom: 10 }} />
              <button className="btn-ghost press" style={{ width: '100%' }} onClick={saveLink} disabled={!url.trim()}>
                바로가기로 저장
              </button>
              <div className="t-sub" style={{ fontSize: 15, marginTop: 9, lineHeight: 1.55 }}>
                링크에서 <b>재료·순서를 자동으로 가져오는 기능은 준비 중</b>이에요. 지금은 주소만 담아둬요.
              </div>
            </div>
          )}

          <button className="press" onClick={() => openExternal(flow === 'instagram' ? 'https://www.instagram.com/' : 'https://www.youtube.com/')}
            style={{ width: '100%', marginTop: 14, padding: '10px 4px', fontSize: 16, fontWeight: 700, color: flowMeta.color, background: 'transparent', border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon name={flowMeta.icon} size={16} color={flowMeta.color} stroke={2} /> {flowMeta.title} 열러 가기 ↗
          </button>
        </div>
      ) : (
        <div className="pad fade">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 4 }}>
            <div className="opt-ico"><Icon name={flowMeta.icon} size={24} color={flowMeta.color} stroke={1.7} /></div>
            <div className="h-title" style={{ fontSize: 23 }}>{flowMeta.title}</div>
          </div>
          {/* ⭐ 제일 먼저 «안 되는 것»을 말한다 — 옛 문장은 「바로가기로 저장하는 기능」이라 맞는 말이었지만
                 「그래서 내용은 안 담긴다」를 유저가 스스로 알아채야 했다. 그 한 걸음이 오해를 만든다. */}
          <div className="t-sub" style={{ marginTop: 6, marginBottom: 12, fontSize: 16, lineHeight: 1.6 }}>
            <b style={{ color: 'var(--brown)' }}>주소만 담아둬요.</b> 재료·만드는 법은 <b>안 담겨요.</b><br />
            내용까지 옮기고 싶다면 아래 방법이 확실해요.
          </div>

          {/* 블로그 정직 안내 — 사진이 많아 캡처가 번거로우니 '글 복사 → 텍스트 붙여넣기'를 권한다 */}
          <button
            className="press"
            onClick={() => { setFlow('text'); setText('') }}
            style={{ width: '100%', textAlign: 'left', marginBottom: 16, padding: '13px 15px', borderRadius: 'var(--r-md)', background: 'var(--cream)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 11 }}
          >
            <div className="opt-ico" style={{ background: '#fff', flexShrink: 0 }}><Icon name="edit" size={20} color="var(--brown)" /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16.5, fontWeight: 700, color: 'var(--brown)', marginBottom: 2 }}>블로그는 글 복사 → 텍스트 붙여넣기 추천</div>
              <div className="t-sub" style={{ fontSize: 15, lineHeight: 1.5 }}>블로그는 사진이 많아 캡처가 번거로워요. 레시피 글을 <b>복사</b>해서 붙여넣으면 제일 깔끔해요.</div>
            </div>
            <Icon name="chevron-right" size={18} color="var(--sand)" />
          </button>

          <div className="field">
            <label>링크 주소</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={placeholderFor(flow)} inputMode="url" autoFocus />
          </div>
          <div className="field">
            <label>제목 (선택)</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예) 이모네 갈비찜" />
          </div>

          <button className="btn-primary press" style={{ marginBottom: 10, opacity: url.trim() ? 1 : 0.5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={saveLink} disabled={!url.trim()}>
            <Icon name="link" size={16} color="#fff" /> 주소만 담아두기
          </button>
          {/* ⏳ 서버 되면 되살릴 것 ② — 여기 「본문 자동 읽기 시도 (베타)」 버튼이 있었다.
              ⛔ 뺀 이유 = **거의 언제나 실패했다.** 눌러서 25초를 기다린 끝에 못 읽었다는 말을 듣는 건
                 「안 되는 기능」이 아니라 «고장난 앱»으로 읽힌다. 그 사이 유저는 아무것도 못 한다.
              ✅ 되살리는 법 = 우리 서버(Worker)에 본문 읽기 길을 낸 뒤 이 자리에 버튼을 되돌리고
                 `readLink()`(git 히스토리 · 이 커밋의 부모에 있다)와 `fetchLinkRecipe` import 를 되살린다. */}
          <div className="card" style={{ padding: 14, background: 'var(--cream)', border: 'none', display: 'flex', gap: 10 }}>
            <Icon name="inbox" size={20} color="var(--brown)" />
            <div className="t-sub" style={{ fontSize: 15.5, lineHeight: 1.5, color: 'var(--brown)' }}>
              담아두면 <b>임시보관함</b>에 들어가요. 나중에 열어 <b>캡처</b>나 <b>텍스트 붙여넣기</b>로 내용을 채워 주세요.
            </div>
          </div>
        </div>
      )}

      {aiPreview && (
       <Portal>
        <div className="sheet-mask" onClick={() => setAiPreview(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 26 }}>
            <div className="emoji-sheet-head">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="sparkle" size={18} color="var(--brown)" /> AI 자동정리</span>
              <button className="press" onClick={() => setAiPreview(false)} style={{ color: 'var(--text-sub)', fontSize: 16, fontWeight: 600 }}>닫기</button>
            </div>
            <div style={{ padding: '4px 18px 0' }}>
              {/* 이미 되는 기능 · 헤드라인 */}
              <div style={{ textAlign: 'center', padding: '8px 0 18px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 12, padding: '4px 12px', borderRadius: 999, background: '#eef5ea', color: '#4a7a45', fontSize: 15, fontWeight: 800 }}>이미 돼요 <Icon name="sparkle" size={12} color="#4a7a45" /></span>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--brown)', lineHeight: 1.3, letterSpacing: '-0.02em' }}>사진 찍으면<br />레시피가 돼요</div>
                <div className="t-sub" style={{ fontSize: 16, marginTop: 9, lineHeight: 1.6 }}>캡처만 올리면 재료·순서를<br />칸칸이 알아서 정리해드려요.</div>
              </div>

              {/* 장점 */}
              <div className="card" style={{ padding: '4px 2px', background: 'var(--cream)', border: 'none' }}>
                {[
                  ['camera', '캡처 사진 인식', '레시피 화면을 캡처만 하면 재료·순서를 칸칸이 자동으로 채워요.'],
                  // ⛔ 「블로그 링크 (베타)」였다 — **여기가 제일 세게 약속하던 자리**다(창업자 확정 ⓑ · 2026-08-21).
                  //    ⏳ 서버 되면 이 줄을 되살린다.
                  ['pen', '글 붙여넣기', '블로그·유튜브 설명 글을 복사해 붙여넣으면 재료·순서로 정리해요.'],
                  ['clock', '옮겨적기 끝', '손으로 하나하나 타이핑할 필요 없이 몇 초면 완성.'],
                  ['pen', '언제든 손보기', 'AI가 정리한 결과는 마음대로 고치고 다듬을 수 있어요.'],
                ].map(([ic, t, b]) => (
                  <div key={t} style={{ display: 'flex', gap: 11, padding: '11px 13px', alignItems: 'flex-start' }}>
                    <span style={{ flexShrink: 0, width: 24, display: 'inline-flex', justifyContent: 'center', paddingTop: 1 }}>
                      <Icon name={ic} size={19} color="var(--brown)" stroke={1.7} />
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16.5, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{t}</div>
                      <div className="t-sub" style={{ fontSize: 15.3, lineHeight: 1.5 }}>{b}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="t-sub" style={{ fontSize: 15, lineHeight: 1.65, marginTop: 16, textAlign: 'center', color: 'var(--brown)' }}>
                지금 바로 돼요 — <b>캡처</b>와 <b>붙여넣은 글</b>에서<br />재료·순서를 채워 드려요.
              </div>
              <button
                className="btn-primary press"
                onClick={() => { setAiPreview(false); choose('write') }}
                style={{ width: '100%', marginTop: 15, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Icon name="camera" size={17} color="#fff" /> 사진으로 시작하기
              </button>
            </div>
          </div>
        </div>
       </Portal>
      )}

      {help && (
       <Portal>
        <div className="sheet-mask" onClick={() => setHelp(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 24 }}>
            <div className="emoji-sheet-head">
              <span>레시피 가져오는 법</span>
              <button className="press" onClick={() => setHelp(false)} style={{ color: 'var(--text-sub)', fontSize: 16, fontWeight: 600 }}>닫기</button>
            </div>
            <div style={{ padding: '2px 16px 0' }}>
              <div className="imp-tip">
                <div className="imp-tip-h" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="camera" size={16} color="var(--brown)" stroke={1.8} /> 인스타그램 — 캡처해서 올리기 (제일 정확)</div>
                <div className="imp-tip-b">
                  인스타는 캡션 글자를 복사할 수 없어요.<br />
                  1. 레시피가 보이는 화면을 <b>캡처(스크린샷)</b><br />
                  2. 한끼 → 가져오기 → <b>사진·직접 작성하기</b><br />
                  → 작성 화면에서 <b>재료 사진·만드는 법 사진</b>을 각각 올리면 정확하게 채워져요. <span className="t-sub" style={{ fontSize: 15 }}>길면 2~3장 나눠서 이어 붙여도 돼요!</span>
                </div>
              </div>
              <div className="imp-tip">
                <div className="imp-tip-h" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="pen" size={16} color="var(--brown)" stroke={1.8} /> 유튜브·블로그 — 글자 복사되면 붙여넣기</div>
                <div className="imp-tip-b">
                  유튜브 <b>설명(더보기)</b>이나 블로그 글은 대개 복사돼요.<br />
                  복사 → 가져오기 → <b>텍스트 붙여넣기</b> → 자동 정리! <span className="t-sub" style={{ fontSize: 15 }}>복사가 안 되면 캡처해서 사진으로.</span>
                </div>
              </div>
              <div className="imp-tip">
                <div className="imp-tip-h" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="share" size={16} color="var(--brown)" stroke={1.8} /> 앱 설치하면 — 공유로 바로 담기</div>
                <div className="imp-tip-b">
                  앱을 설치하면 인스타·유튜브 <b>공유(↗)</b> 목록에 <b>‘한끼’</b>가 떠요.<br />
                  <span className="t-sub" style={{ fontSize: 15 }}>단, 인스타 공유는 ‘링크’만 보내져요(캡션은 안 와요). 내용까지 담으려면 캡처가 확실해요.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
       </Portal>
      )}
    </div>
  )
}

function placeholderFor(flow) {
  if (flow === 'instagram') return 'https://instagram.com/p/...'
  if (flow === 'youtube') return 'https://youtube.com/watch?v=...'
  return 'https://...'
}

export function makeInboxRecipe({ source, title, sourceUrl = '', image = null, category, memo = '' }) {
  return {
    id: newId(),
    title,
    // 가져온 레시피도 기본 썸네일은 브랜드 아이콘(통일감). 사진은 원하면 편집에서 고른다.
    thumb: 'icon',
    icon: guessFoodIcon(title),
    emoji: '🍽️',
    image,
    source,
    category: category || guessCategory(title + ' ' + memo),
    tags: [],
    time: 0,
    servings: 0,
    difficulty: '',
    ingredients: [],
    steps: [],
    memo,
    sourceUrl,
    status: 'unsorted',
    folder: null,
    favorite: false,
    cooked: 0,
    savedAt: Date.now(),
  }
}
