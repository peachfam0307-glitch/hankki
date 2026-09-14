import { useMemo, useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import Icon from './Icon'
import { PHOTO_FAMILY, BOX_PAD } from './Stickers'
import { pickPaper } from '../memoPaper'

// 🎨 종이 = 창업자 메모지 **16컷** 중 하나 (2026-08-20 확정)
//    ✅ 판정 = **레시피마다 다르게**(같은 레시피는 늘 같은 종이) · **버릴 컷 없다**
//    ⭐ 어느 종이인지는 «메모를 만들 때» 적어 둔다(`store.jsx` `addDiary`) — 그래야
//       나중에 컷을 «추가»해도 이미 쓴 메모의 종이가 안 갈린다. 없으면 해시로 폴백.
//    📄 목록·고르는 법 = `src/memoPaper.js` (store 와 여기가 «같은 함수»를 쓴다)
const 기본종이 = (recipeId) => pickPaper(recipeId)
const 종이URL = (k) => PHOTO_FAMILY[k]?.src || ''
// 📐 종이 «안쪽 여백» — `BOX_PAD` 는 그림마다 「글 쓸 수 있는 자리」를 **재서** 뽑아둔 값이다
//    (꾸미기 글상자가 이미 쓰고 있다 · `tools/measure-inner.py`).
//    ⭐⭐ 그래서 안전지대를 «짐작하지 않는다» — 새 시안이 와도 재기만 하면 그대로 맞는다.
//    ⛔ 없는 종이는 넉넉히 준다(글이 장식 위로 올라가는 것보다 낫다).
const 안여백 = (k) => BOX_PAD[k] || [18, 16, 16, 16]
// 📅 메모를 남긴 날 — 일기 화면과 «같은 형식»(`8월 19일`)
const 메모날짜 = (at) => { const d = new Date(at || Date.now()); return `${d.getMonth() + 1}월 ${d.getDate()}일` }

// 📌📌 「지난번 메모」 포스트잇 — 앱이 «자동으로» 붙여준다
//
// 📮 창업자 2026-08-19
//    · *"그 한줄도 **담에 만들때 바로 보여야 의미가 있는건데**"*
//    · *"레시피에 카드처럼 띄워주면 안돼?(**재료나 만들기옆에**)"*
//    · *"약간 **포스트잇 붙이듯이. 자동으로 붙여주면 유저는 편하겠지**"*
//    · *"**이걸쓰면 비로소 나만의 레시피가 되는거잖아**"*
//
// ⭐⭐ 자리 근거 = 「다음엔 간장 반만」은 **재료를 넣기 «전»에** 봐야 쓸모가 있다.
//    다 만들고 나서 보면 늦다. 그래서 —
//      ⑴ 요리 모드 **0단계(재료 준비)** — 재료를 꺼내는 바로 그 순간
//      ⑵ 레시피 상세 — **재료 바로 위**
//
// ⛔ 유저가 «손으로» 붙이는 꾸미기 포스트잇(레꾸)과 다른 것이다. 이건 앱이 붙인다.
//
// ⛔ 마크업을 두 곳에 적지 않는다 — 그러면 한쪽만 고치는 사고가 난다
//    (`WeekBox` 를 뺀 것과 같은 이유 · HomeScreen 주석 참고).
//
// ⛔ 없으면 «아무것도 안 그린다» — 빈 자리를 남기지 않는다(우리 규칙).
// ⏳ `종이`·`글씨` = 시안을 나란히 찍으려고 잠깐 받는 값 (창업자 판정 뒤 «진 쪽을 지운다»)
//    ⛔ 창업자 = *"포스트잇 넘 안예쁜데..ㅠ"* · *"글씨체두 별로고.."*
//       → 내가 만든 노란 네모 대신 **우리가 이미 가진 메모지 스티커**를 종이로 쓴다.
// 📌 `붙임` = **재료 목록 옆에 «붙인» 포스트잇**(창업자 확정 2026-08-20)
//    📮 *"우리 보통 **필기하다가 포스트잇 붙이잖아. 그런느낌으로.**"* · *"자리는 **재료옆**이어야해"*
//    ✅ 판정 = **재료 옆 · 비뚤게 · 44%**
export default function MemoNote({ recipeId, style, 종이, 글씨, onClick, 횟수, 붙임 }) {
  const { diary, profile, setProfile } = useStore()

  // 그 레시피의 메모만, 최근 것부터. ⛔빈 메모는 세지 않는다(「만들었어요」가 note:'' 로 만든다)
  const 메모들 = useMemo(() => {
    return (diary || [])
      .filter((d) => d && d.recipeId === recipeId && String(d.note || '').trim())
      .sort((a, b) => (b.at || 0) - (a.at || 0))
  }, [diary, recipeId])

  // 🤏🤏 **두 손가락으로 크기 바꾸기** (창업자 확정 2026-08-20 *"유저가 손가락으로 키우고 줄이게"*)
  //
  // ⭐ 크기는 **한 벌로 저장한다**(`profile.memoScale`) — 레시피마다 따로 두면
  //    레시피가 백 편일 때 백 번 조절해야 한다. 한 번 정하면 모든 메모지가 그 크기다.
  //    ⭐ `profile` 이라 **백업에 같이 담긴다**(폰을 바꿔도 따라온다).
  //
  // ⛔⛔ `touch-action` 을 `none` 으로 주면 **메모지 위에서 세로 스크롤이 죽는다** —
  //    유저는 「화면이 안 굴러간다」로 읽는다. `pan-y` 면 세로는 브라우저가 굴리고
  //    두 손가락은 우리가 받는다(브라우저가 «페이지 확대»로 안 가져간다).
  //
  // ⛔ 벌리는 동안 «누르기»가 같이 일어나면 안 된다 — 손을 떼는 순간 기록 편집 시트가 열린다.
  //    그래서 `집었나` 를 세우고 `onClick` 에서 막는다(꾸미기의 `pinching` 과 같은 생각).
  const 저장크기 = Number(profile?.memoScale) || 44
  const [크기, 크기바꾸기] = useState(저장크기)
  useEffect(() => { 크기바꾸기(저장크기) }, [저장크기])
  const 두손 = useRef(new Map())
  const 시작 = useRef(null)
  const 집었나 = useRef(false)
  const 거리 = () => {
    const p = [...두손.current.values()]
    return p.length < 2 ? 0 : Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y)
  }
  const 손내림 = (e) => {
    두손.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (두손.current.size === 2) {
      시작.current = { d: 거리() || 1, s: 크기 }
      집었나.current = true
      e.currentTarget.setPointerCapture?.(e.pointerId)
    }
  }
  const 손이동 = (e) => {
    if (!두손.current.has(e.pointerId)) return
    두손.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (두손.current.size < 2 || !시작.current) return
    e.preventDefault()
    // ⛔ 34~68% 밖으로는 안 간다 — 판에서 창업자가 본 그 범위다.
    //    더 작으면 글씨가 안 읽히고, 더 크면 재료 글이 한 줄에 두세 글자로 좁아진다.
    const v = 시작.current.s * (거리() / 시작.current.d)
    크기바꾸기(Math.round(Math.min(68, Math.max(34, v))))
  }
  const 손올림 = (e) => {
    두손.current.delete(e.pointerId)
    if (두손.current.size >= 2) return
    if (시작.current) {
      시작.current = null
      if (크기 !== 저장크기) setProfile({ memoScale: 크기 })
      // ⛔ 손을 뗀 «그 순간» 클릭이 온다 — 한 박자 뒤에 푼다
      setTimeout(() => { 집었나.current = false }, 60)
    }
  }


  if (!메모들.length) return null
  const 최근 = 메모들[0]

  // 🎨 종이 = 우리가 이미 가진 메모지 스티커. ⛔새로 그린 게 0장이다.
  //    ⭐ 「가운데는 조용해서 글씨가 읽히고 가장자리엔 장식이 있는 것」으로 골랐다 —
  //       창업자 = *"예뻐야해 ㅋㅋ 그리고 **너무 밋밋하면 눈에 안띄어**"*
  //    ⚠️ 종이 그림은 비율이 정해져 있다 → `background-size: 100% 100%` 로 늘린다.
  //       손그림이라 조금 늘어나도 티가 안 난다(모눈·점선은 예외라 시안에서 눈으로 확인).
  const 종이키 = 종이 || 최근.paper || 기본종이(recipeId)
  const 바탕 = 종이키 ? { backgroundImage: `url(${종이URL(종이키)})` } : null
  // 📌 붙인 포스트잇 = 종이 «그대로의 비율» ＋ 그 종이의 «안쪽 여백»
  //    ⛔ 여백을 하나로 못 준다 — 그림마다 장식 자리가 다르다(그래서 `BOX_PAD` 가 있다).
  //    ⭐ 글자 크기는 «종이 폭»에 매단다(`cqw`) — 자리가 작아지면 글씨도 같이 작아져 안 넘친다.
  //    ⛔⛔ **여백을 이 상자의 `padding: %` 로 주면 안 된다** — CSS 에서 padding 의 %는
  //       «자기 폭»이 아니라 **부모 폭** 기준이다. 2026-08-20 에 실제로 터졌다:
  //       메모지 160px · 부모 350px → 좌우 padding 이 **138px** 이 되어 안쪽이 **22px**,
  //       글씨가 **한 글자씩 세로로** 쏟아졌다.
  //    ✅ 그래서 «안쪽 상자»에 `width: %` 를 준다 — 그 %는 부모(＝메모지) 폭 기준이라 정확하다.
  const 붙임꼴 = 붙임 ? { aspectRatio: String(PHOTO_FAMILY[종이키]?.ratio || 1) } : null
  // 📏 글 자리 = 안전지대보다 조금 넓게 (창업자 2026-08-20 *"글자리는 조금씩 더 키워도 될 듯"*)
  //   ⭐ `BOX_PAD` 는 「장식을 확실히 피하는」 값이라 «보수적»이다 — 글이 두 줄로 갇혀 답답했다.
  //   ⭐ 여백을 **0.68배**로 줄여 글 자리를 넓힌다. 실물로 재보니 70% → 80% 안팎.
  //   ⛔ 더 줄이면 구석 장식(앞치마·냄비·오븐장갑)에 글이 걸린다 — 여백판을 눈으로 보고 정했다.
  //   ⛔ 세로(위·아래)는 안 건드린다 — 마테가 위에 있어 좁히면 글이 마테에 올라탄다.
  const 글자리 = 0.68

  const 안쪽꼴 = (() => {
    if (!붙임) return null
    const [, 오, , 왼] = 안여백(종이키)
    return { width: `${Math.min(88, Math.max(40, 100 - (오 + 왼) * 글자리))}%` }   // ⛔바닥과 천장을 둔다
  })()
  // 🖐 누를 수 있으면 button 으로 — 레시피 상세에선 눌러서 기록을 고친다
  const Tag = onClick ? 'button' : 'div'  // ⛔ JSX 는 «대문자»라야 컴포넌트로 읽는다(소문자면 HTML 태그로 본다)
  const 폭꼴 = 붙임 ? { width: `${크기}%` } : null

  return (
    <Tag className={`memo-note${종이키 ? ' memo-paper' : ''}${붙임 ? ' stick' : ''}${onClick ? ' press' : ''}`}
      {...(onClick ? { type: 'button', onClick: (e) => { if (집었나.current) return; onClick(e) } } : null)}
      {...(붙임 ? { onPointerDown: 손내림, onPointerMove: 손이동, onPointerUp: 손올림, onPointerCancel: 손올림 } : null)}
      style={{ ...바탕, ...붙임꼴, ...폭꼴, ...(글씨 ? { fontFamily: 글씨 } : null), ...style }}>
      {/* 📐 안쪽 상자 — 여백을 여기 «폭»으로 준다(위 주석 참고).
          ⛔ 붙임이 아니면 `안쪽꼴` 이 null 이라 폭이 100% — 지금까지와 똑같이 그려진다. */}
      <div className="memo-in" style={안쪽꼴}>
      <div className="memo-note-head">
        {/* ⛔ 색을 테마 변수로 주지 않는다 — 포스트잇은 «자기 바탕»을 들고 다닌다.
            `currentColor` 라야 종이 색이 바뀌어도 글자·아이콘이 같이 따라간다. */}
        <Icon name="pen" size={12} color="currentColor" />
        {/* 📅 머리글 = **날짜** (창업자 확정 2026-08-20)
            📮 창업자 = *"내가남긴 것 멘트가 별로인데.."* → 넷을 나란히 놓고 «날짜로» 골랐다
               (지금 그대로 / 짧게 「지난번」 / 아예 뺌 / **날짜로**)
            ⭐ 날짜가 나으면서 자리도 덜 먹는다 — 포스트잇이 작아서 머리줄이 길면 두 줄로 접힌다.
            ⛔ 형식은 일기 화면과 «같게»(`DiaryScreen` `8월 19일`) — 같은 기록인데 표기가 다르면
               유저는 다른 것으로 읽는다. ⚠️ 여기는 «지나간» 날짜를 그리는 자리라
               `todayKST`(규칙 27) 를 쓰지 않는다 — 그건 「오늘이 며칠인가」를 정하는 함수다. */}
        <span>{메모날짜(최근.at)}</span>
        {/* ⭐ 별점 = 창업자 판정 *"별점은 넣어도 괜찮겠다 **포스트잇에 보이면 되니까**"*
            ⛔ 안 매겼으면 «아무것도 안 그린다» — 빈 별을 띄우면 「매기라」는 재촉이 된다
               (2026-08-17 창업자가 정확히 그걸 잡았다 · `RecipeDetailScreen` 주석 참고) */}
        {최근.rating > 0 && (
          // ⛔ 유니코드 별(★)을 쓰지 않는다 — UI 이모지 금지(CLAUDE.md 핀). 우리 `Icon` 세트로.
          <span className="memo-note-stars" aria-label={`별 ${최근.rating}개`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Icon key={n} name="star" size={11}
                color={n <= 최근.rating ? '#e0a83a' : 'currentColor'}
                style={{ fill: n <= 최근.rating ? '#e0a83a' : 'transparent', opacity: n <= 최근.rating ? 1 : 0.3 }} />
            ))}
          </span>
        )}
      </div>
      <div className="memo-note-body">“{최근.note.trim()}”</div>
      {/* 📌 「몇 번 만들었나」 — 레시피 상세에선 이 줄이 옛 「내 요리 기록」 카드를 대신한다 */}
      {(횟수 > 1 || 메모들.length > 1) && (
        <div className="memo-note-more">
          {횟수 > 1 ? `${횟수}번 만들었어요` : `앞서 ${메모들.length - 1}번 더 남겼어요`}
        </div>
      )}
      </div>
    </Tag>
  )
}
