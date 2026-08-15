import { useRef, useState } from 'react'
import { useStore, newId } from '../store'
import { useNav } from '../App'
import { useBackHandler, useLayerBack } from '../useBackHandler'
import { guessCategory, openExternal } from '../utils'
import { parseRecipeText } from '../parseRecipe'
import { fetchLinkRecipe } from '../linkReader'
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
const OPTIONS = [
  // 제일 많이 쓰는 방법이라 맨 위
  { key: 'write', icon: 'photo', title: '사진 · 직접 작성하기', desc: '캡처는 재료·만드는 법 칸별로 읽어 채워요', color: '#8AA07A' },
  { key: 'instagram', icon: 'instagram', title: 'Instagram', desc: '캡처해서 담기 (제일 정확)', color: '#C13584' },
  { key: 'youtube', icon: 'youtube', title: 'YouTube', desc: '캡처·설명 붙여넣기로 담기', color: '#E33' },
  { key: 'text', icon: 'edit', title: '텍스트 붙여넣기', desc: '레시피 글을 붙여넣으면 자동 정리', color: '#B0895E' },
  { key: 'link', icon: 'link', title: '링크 붙여넣기', desc: '블로그 글 읽어오기 · 바로가기 저장', color: '#9B8B79' },
]

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
  const [linkBusy, setLinkBusy] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false) // '링크만 저장'은 접어둔다(화면을 조용하게)
  const linkCancel = useRef(false)

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
    nav.showToast('Inbox에 저장했어요 · 나중에 정리해요')
  }

  // 링크 자동 읽기(베타) — 공개된 블로그 본문을 읽어 재료·순서까지 채운다.
  // 유튜브·인스타는 읽지 않는다(로그인·동의 벽 → linkReader 에서 바로 null).
  // 아무리 오래 걸려도 25초 안에는 결과(또는 실패)를 돌려준다.
  const readLink = async () => {
    const u = url.trim()
    if (!u || linkBusy) return
    linkCancel.current = false
    setLinkBusy(true)
    const r = await Promise.race([
      fetchLinkRecipe(u).catch(() => null),
      new Promise((res) => setTimeout(() => res(null), 25000)),
    ])
    setLinkBusy(false)
    if (linkCancel.current) return
    if (r && r.full) {
      const parsed = parseRecipeText(r.text, { fromOcr: true })
      const hasContent = parsed.ingredients.length || parsed.steps.length
      nav.push({
        name: 'editor',
        prefill: {
          source: flow === 'youtube' ? 'youtube' : 'link',
          title: title.trim() || parsed.title || r.title || '',
          ingredients: parsed.ingredients,
          steps: parsed.steps,
          sourceUrl: u, // 메모는 직접 입력 전용 — 자동으로 채우지 않는다
        },
      })
      nav.showToast(hasContent ? '링크에서 레시피를 읽어왔어요' : '글을 읽어왔어요 · 내용을 확인해 주세요')
    } else if (r && r.title) {
      addRecipe(makeInboxRecipe({ source: flow || 'link', title: r.title, sourceUrl: u }))
      nav.pop()
      nav.push({ name: 'inbox' })
      nav.showToast('본문은 못 읽어서 제목만 채웠어요 · Inbox 저장')
    } else {
      nav.showToast('이 링크는 자동으로 읽지 못했어요 · 아래 "링크만 저장"을 이용해 주세요')
    }
  }

  const flowMeta = OPTIONS.find((o) => o.key === flow)

  return (
    <div className="screen fade" style={{ paddingBottom: 24 }}>
      <div className="topbar-back">
        <button className="icon-btn press" onClick={() => (flow ? setFlow(null) : nav.pop())} aria-label="닫기">
          <Icon name={flow ? 'chevron-left' : 'x'} size={24} />
        </button>
        <div style={{ fontSize: 16, fontWeight: 700 }} />
        <div style={{ width: 40 }} />
      </div>

      {linkBusy && (
        <div className="ocr-overlay">
          <div className="ocr-box">
            <div className="ocr-spin" />
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 14 }}>링크에서 내용을 읽는 중…</div>
            <div className="t-sub" style={{ marginTop: 5, fontSize: 13 }}>페이지에 따라 10~25초 걸려요</div>
            <button
              className="press"
              onClick={() => { linkCancel.current = true; setLinkBusy(false) }}
              style={{ marginTop: 16, padding: '9px 22px', borderRadius: 12, background: 'var(--cream)', color: 'var(--text-sub)', fontSize: 13.5, fontWeight: 600 }}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {!flow ? (
        <div className="pad">
          <div className="h-title" style={{ marginTop: 6 }}>가져오기</div>
          <div className="t-sub" style={{ marginTop: 8, marginBottom: 14, fontSize: 14 }}>
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
                <div style={{ fontSize: 14.5, fontWeight: 800, color: '#3d6b38', letterSpacing: '-.3px' }}>
                  무료 AI 스캔 <span style={{ fontSize: 18.5 }}>{ocrLeft.total}장</span> 남았어요
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
                    fontSize: 12.6, fontWeight: 700, color: '#4f7d48', lineHeight: 1.4, letterSpacing: '-.2px',
                    // ⛔ 한글 낱말이 잘리면 안 된다 — 첫 판이 「다 쓰면 매 / 달 5장」으로 잘렸다
                    wordBreak: 'keep-all',
                  }}>
                    {/* ⛔⛔ 「익월부터」·「다음 달부터」라고 못박지 «않는다» — 실제로 사람마다 시점이 다르다.
                        · 8월에 20장을 다 쓴 사람 → 8월 카운터가 20이라 그 달은 끝 → 9월부터 5장 (맞다)
                        · 8월에 17장만 쓴 사람 → 웰컴 3장이 9월로 이월 → 9월에 그 3장을 쓰고 «그 9월에 2장 더» 쓴다
                          (worker: 웰컴을 다 쓴 뒤 `userC(3) < PER_USER_MONTHLY(5)` 라 통과)
                        ⭐ 그래서 「다 쓰면(조건) · 매달(주기)」로만 적는다 — 두 경우 다 맞는 유일한 표현. */}
                    <b style={{ fontWeight: 900, color: '#356131' }}>처음 한 번만</b> 드리는 20장이에요<br />
                    다 쓰면 <b style={{ fontWeight: 900, color: '#356131' }}>매달 무료 5장</b>
                  </div>
                ) : (
                  <div style={{ fontSize: 12.3, color: 'var(--text-sub)', marginTop: 2 }}>
                    {ocrLeft.total <= 3 ? '다 써도 기본 인식으로 계속 읽어 드려요' : '매달 5장씩 채워져요'}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#8a6a3a', letterSpacing: '-.3px' }}>이번 달 무료 AI 스캔을 다 썼어요</div>
                {/* ⭐ 「못 쓴다」가 아니라 「계속 되는데 품질이 바뀐다」 ＋ 언제·«몇 장» 돌아오는지까지.
                    ⛔ 「다시 채워져요」만 두면 몇 장인지 모른다 → 창업자 *"다음달에 무료5장채워져요"* */}
                <div style={{ fontSize: 12.3, color: 'var(--text-sub)', marginTop: 2, lineHeight: 1.45 }}>
                  기본 인식으로 계속 읽어 드려요<br />다음 달에 <b style={{ fontWeight: 800, color: '#8a6a3a' }}>무료 5장</b> 채워져요
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
                <span style={{ fontSize: 14.5, fontWeight: 800, color: '#8a5a37', whiteSpace: 'nowrap' }}>사진 · 직접 작성하기</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#8a5a37', background: '#f0dcc7', borderRadius: 999, padding: '2px 7px', flexShrink: 0, whiteSpace: 'nowrap' }}>제일 많이 써요</span>
              </div>
              <div style={{ fontSize: 12.3, lineHeight: 1.5, color: 'var(--text-sub)' }}>
                캡처는 재료·만드는 법 칸별로 읽어 채워요
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
                    <div className="b">{o.desc}</div>
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
                <span style={{ fontSize: 12.5, fontWeight: 800, color: '#4a7a45' }}>AI 자동 정리</span>
                <span style={{ fontSize: 9.5, fontWeight: 800, color: '#fff', background: '#7fa06a', borderRadius: 999, padding: '2px 7px', flexShrink: 0 }}>이미 돼요</span>
              </div>
              <div style={{ fontSize: 11.6, lineHeight: 1.45, color: 'var(--text-sub)', marginTop: 2 }}>
                캡처·링크 올리면 재료·순서를 자동으로 채워요
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
              <div style={{ fontSize: 14, fontWeight: 600 }}>가져오기가 어렵다면?</div>
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
            <div className="h-title" style={{ fontSize: 22 }}>텍스트 붙여넣기</div>
          </div>
          <div className="t-sub" style={{ marginTop: 6, marginBottom: 16, fontSize: 14 }}>
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
            <div className="h-title" style={{ fontSize: 22 }}>{flowMeta.title}</div>
          </div>
          <div className="t-sub" style={{ marginTop: 6, marginBottom: 16, fontSize: 13.5 }}>
            {flow === 'instagram' ? '인스타 레시피를 한끼로 옮기는 방법이에요.' : '영상 레시피를 한끼로 옮기는 방법이에요.'}
          </div>

          {/* 방법을 카드 몇 장으로 길게 설명하던 걸 '한 줄짜리 선택지'로 바꿨다.
              (창업자 2026-07-29 "설명이 너무 복잡하고 정신없어") 고를 것만 보이게 한다. */}
          {(flow === 'youtube'
            ? [
                ['camera', '캡처해서 올리기', '캡처만 하면 재료·순서 자동으로', true, () => nav.push({ name: 'editor', prefill: { source: flow, sourceUrl: url.trim() } })],
                ['pen', '설명(더보기) 붙여넣기', '글 복사해 오면 알아서 정리해요', false, () => { setFlow('text'); setText('') }],
                ['play', '영상 보면서 적기', '영상 띄워두고 아래에 받아적기', false, () => nav.push({ name: 'editor', prefill: { source: flow, sourceUrl: url.trim(), watch: true } })],
              ]
            : [
                ['camera', '캡처해서 올리기', '인스타는 글자 복사가 안 돼요', true, () => nav.push({ name: 'editor', prefill: { source: flow, sourceUrl: url.trim() } })],
                ['pen', '글을 복사했다면 붙여넣기', '복사한 글을 넣으면 알아서 정리해요', false, () => { setFlow('text'); setText('') }],
                ['photo', '미리보기 띄우고 적기', '게시물 띄워두고 아래에 받아적기', false, () => nav.push({ name: 'editor', prefill: { source: flow, sourceUrl: url.trim(), watch: true } })],
              ]
          ).map(([ic, t, d, best, go]) => (
            <button key={t} className="card press" onClick={go}
              style={{ width: '100%', textAlign: 'left', padding: '14px 15px', marginBottom: 10, border: 'none', background: best ? 'var(--cream)' : 'var(--surface)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="opt-ico" style={{ flexShrink: 0, background: best ? '#fff' : 'var(--cream)' }}>
                <Icon name={ic} size={21} color="var(--brown)" stroke={1.8} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 800 }}>{t}</span>
                  {best && <span style={{ fontSize: 10, fontWeight: 800, color: '#8a5a37', background: '#f0dcc7', borderRadius: 999, padding: '2px 7px' }}>추천</span>}
                </span>
                <span className="t-sub" style={{ display: 'block', fontSize: 12.3, lineHeight: 1.45, marginTop: 3 }}>{d}</span>
              </span>
              <Icon name="chevron-right" size={17} color="var(--sand)" />
            </button>
          ))}

          {/* 링크는 '바로가기 저장'뿐이라 접어둔다 — 펼쳐야 보이게. */}
          <button className="press" onClick={() => setLinkOpen((v) => !v)}
            style={{ width: '100%', marginTop: 6, padding: '11px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--text-sub)', background: 'transparent', border: 'none' }}>
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
              <div className="t-sub" style={{ fontSize: 11.5, marginTop: 9, lineHeight: 1.55 }}>
                링크에서 <b>재료·순서를 자동으로 가져오는 기능은 준비 중</b>이에요. 지금은 주소만 담아둬요.
              </div>
            </div>
          )}

          <button className="press" onClick={() => openExternal(flow === 'instagram' ? 'https://www.instagram.com/' : 'https://www.youtube.com/')}
            style={{ width: '100%', marginTop: 14, padding: '10px 4px', fontSize: 13, fontWeight: 700, color: flowMeta.color, background: 'transparent', border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon name={flowMeta.icon} size={16} color={flowMeta.color} stroke={2} /> {flowMeta.title} 열러 가기 ↗
          </button>
        </div>
      ) : (
        <div className="pad fade">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 4 }}>
            <div className="opt-ico"><Icon name={flowMeta.icon} size={24} color={flowMeta.color} stroke={1.7} /></div>
            <div className="h-title" style={{ fontSize: 22 }}>{flowMeta.title}</div>
          </div>
          <div className="t-sub" style={{ marginTop: 6, marginBottom: 12, fontSize: 14 }}>
            링크는 <b>바로가기(북마크)</b>로 저장하는 기능이에요. 레시피 내용까지 담고 싶다면 아래 방법을 추천해요.
          </div>

          {/* 블로그 정직 안내 — 사진이 많아 캡처가 번거로우니 '글 복사 → 텍스트 붙여넣기'를 권한다 */}
          <button
            className="press"
            onClick={() => { setFlow('text'); setText('') }}
            style={{ width: '100%', textAlign: 'left', marginBottom: 16, padding: '13px 15px', borderRadius: 'var(--r-md)', background: 'var(--cream)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 11 }}
          >
            <div className="opt-ico" style={{ background: '#fff', flexShrink: 0 }}><Icon name="edit" size={20} color="var(--brown)" /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--brown)', marginBottom: 2 }}>블로그는 글 복사 → 텍스트 붙여넣기 추천</div>
              <div className="t-sub" style={{ fontSize: 12, lineHeight: 1.5 }}>블로그는 사진이 많아 캡처가 번거로워요. 레시피 글을 <b>복사</b>해서 붙여넣으면 제일 깔끔해요.</div>
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
            <Icon name="link" size={16} color="#fff" /> 링크를 Inbox에 저장 (바로가기)
          </button>
          <button className="btn-ghost press" style={{ width: '100%', marginBottom: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={readLink} disabled={!url.trim() || linkBusy}>
            {linkBusy ? '본문 읽는 중…' : <><Icon name="sparkle" size={16} /> 본문 자동 읽기 시도 (베타)</>}
          </button>

          <div className="card" style={{ padding: 14, background: 'var(--cream)', border: 'none', display: 'flex', gap: 10 }}>
            <Icon name="inbox" size={20} color="var(--brown)" />
            <div className="t-sub" style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--brown)' }}>
              자동 읽기는 블로그에 따라 되기도, 안 되기도 해요(로그인 필요 페이지는 불가).
              안 되면 링크만 저장해 두고 <b>캡쳐</b>나 <b>텍스트 붙여넣기</b>로 옮겨주세요.
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
              <button className="press" onClick={() => setAiPreview(false)} style={{ color: 'var(--text-sub)', fontSize: 14, fontWeight: 600 }}>닫기</button>
            </div>
            <div style={{ padding: '4px 18px 0' }}>
              {/* 이미 되는 기능 · 헤드라인 */}
              <div style={{ textAlign: 'center', padding: '8px 0 18px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 12, padding: '4px 12px', borderRadius: 999, background: '#eef5ea', color: '#4a7a45', fontSize: 12, fontWeight: 800 }}>이미 돼요 <Icon name="sparkle" size={12} color="#4a7a45" /></span>
                <div style={{ fontSize: 21, fontWeight: 900, color: 'var(--brown)', lineHeight: 1.3, letterSpacing: '-0.02em' }}>사진 찍으면<br />레시피가 돼요</div>
                <div className="t-sub" style={{ fontSize: 13, marginTop: 9, lineHeight: 1.6 }}>캡처만 올리면 재료·순서를<br />칸칸이 알아서 정리해드려요.</div>
              </div>

              {/* 장점 */}
              <div className="card" style={{ padding: '4px 2px', background: 'var(--cream)', border: 'none' }}>
                {[
                  ['camera', '캡처 사진 인식', '레시피 화면을 캡처만 하면 재료·순서를 칸칸이 자동으로 채워요.'],
                  ['link', '블로그 링크 (베타)', '공개된 블로그 글은 붙여넣으면 읽어서 정리해요. 유튜브·인스타는 준비 중이에요.'],
                  ['clock', '옮겨적기 끝', '손으로 하나하나 타이핑할 필요 없이 몇 초면 완성.'],
                  ['pen', '언제든 손보기', 'AI가 정리한 결과는 마음대로 고치고 다듬을 수 있어요.'],
                ].map(([ic, t, b]) => (
                  <div key={t} style={{ display: 'flex', gap: 11, padding: '11px 13px', alignItems: 'flex-start' }}>
                    <span style={{ flexShrink: 0, width: 24, display: 'inline-flex', justifyContent: 'center', paddingTop: 1 }}>
                      <Icon name={ic} size={19} color="var(--brown)" stroke={1.7} />
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{t}</div>
                      <div className="t-sub" style={{ fontSize: 12.3, lineHeight: 1.5 }}>{b}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="t-sub" style={{ fontSize: 12, lineHeight: 1.65, marginTop: 16, textAlign: 'center', color: 'var(--brown)' }}>
                지금 바로 돼요 — <b>캡처·텍스트</b>는 확실하게,<br /><b>링크</b>는 되는 페이지만(베타)이에요.
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
              <button className="press" onClick={() => setHelp(false)} style={{ color: 'var(--text-sub)', fontSize: 14, fontWeight: 600 }}>닫기</button>
            </div>
            <div style={{ padding: '2px 16px 0' }}>
              <div className="imp-tip">
                <div className="imp-tip-h" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="camera" size={16} color="var(--brown)" stroke={1.8} /> 인스타그램 — 캡처해서 올리기 (제일 정확)</div>
                <div className="imp-tip-b">
                  인스타는 캡션 글자를 복사할 수 없어요.<br />
                  1. 레시피가 보이는 화면을 <b>캡처(스크린샷)</b><br />
                  2. 한끼 → 가져오기 → <b>사진·직접 작성하기</b><br />
                  → 작성 화면에서 <b>재료 사진·만드는 법 사진</b>을 각각 올리면 정확하게 채워져요. <span className="t-sub" style={{ fontSize: 11.5 }}>길면 2~3장 나눠서 이어 붙여도 돼요!</span>
                </div>
              </div>
              <div className="imp-tip">
                <div className="imp-tip-h" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="pen" size={16} color="var(--brown)" stroke={1.8} /> 유튜브·블로그 — 글자 복사되면 붙여넣기</div>
                <div className="imp-tip-b">
                  유튜브 <b>설명(더보기)</b>이나 블로그 글은 대개 복사돼요.<br />
                  복사 → 가져오기 → <b>텍스트 붙여넣기</b> → 자동 정리! <span className="t-sub" style={{ fontSize: 11.5 }}>복사가 안 되면 캡처해서 사진으로.</span>
                </div>
              </div>
              <div className="imp-tip">
                <div className="imp-tip-h" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="share" size={16} color="var(--brown)" stroke={1.8} /> 앱 설치하면 — 공유로 바로 담기</div>
                <div className="imp-tip-b">
                  앱을 설치하면 인스타·유튜브 <b>공유(↗)</b> 목록에 <b>‘한끼’</b>가 떠요.<br />
                  <span className="t-sub" style={{ fontSize: 11.5 }}>단, 인스타 공유는 ‘링크’만 보내져요(캡션은 안 와요). 내용까지 담으려면 캡처가 확실해요.</span>
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
