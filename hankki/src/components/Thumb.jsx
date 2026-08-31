import { useState } from 'react'
import FoodIcon, { guessFoodIcon } from './FoodIcon'
import DecorLayer from './DecorLayer'
import { bgStyle, bgIsDark, bgAnim } from './Stickers'
import { graphemes } from '../utils'
// 🔍 사진 자리·배율 규칙 = 일기 속지 사진과 «같은 곳»에서 온다 (src/photoPan.js)
import { clampZoom, photoImgStyle } from '../photoPan'
// 🎴 「이 그림은 자랑카드다」의 문턱 = 화면과 클라우드가 **한 곳**을 쓴다 (2026-08-31)
//   ⛔ 값을 두 곳에 적으면 «화면은 카드로 그리는데 클라우드는 사진으로 털어버리는» 일이 난다.
import { 카드높이문턱 } from '../cardCover'

// 카드 썸네일. recipe.thumb 로 표시 방식을 고른다:
//   'icon'  — 브랜드 커스텀 아이콘(이름 자동매칭 or 직접 선택)  ← 기본
//   'emoji' — 이모지
//   'label' — 글자 타일
//   'photo' — 사진 (있을 때만)
// 예전 레시피(thumb 없음)는 이미지가 있으면 사진, 없으면 아이콘으로 자연스럽게 보인다.
// 레시피 사진(썸네일) 배경은 '하얀색' — 사진·꾸미기가 깨끗하게 얹히도록.
// 색·개성은 꾸미기(사용자 배경/스티커)가 담당한다. (여기 색 넣으면 꾸미기 의미가 죽음)
// 테마별로 화이트 톤이 달라야 함(크림=웜/블루=쿨/다크=톤다운) → CSS 토큰 --thumb 사용.

// 🎴 **`imageFit` 이 없던 시절에 저장한 자랑카드 표지를 되살리는 문턱** (2026-08-18)
//   ⛔ 「이미 깔린 폰」을 안 보면 반쪽이다(규칙 18 ⓙ) — 자랑카드→표지는 v8.50부터 있던 기능이라
//      **8/17 «전»에 저장한 사람들도 지금 전부 동그랗게 깨져 있다.** 그 사람들에겐 표시가 없다.
//   ⭐ 짐작이 아니라 **코드에 적힌 두 값의 차이**다 —
//      · 자랑카드 = 1080×1350 을 `pixelRatio 1.5` 로 캡처 → **1620×2025** (`ShareDrawCard.jsx` `shell`·`saveCover`)
//      · 내 사진  = `cropSquare(800)` · `fitImage(1200)` → **긴 변이 1200 을 넘을 수 없다** (`utils.js`)
//      실측으로도 확인했다(재현판이 원본을 `1620×2025` 로 찍었다).
//   ⚠️ 틀려도 안전한 쪽이다 — 어쩌다 걸리면 «8/17 이전 모습»(네모 꽉 참)이 될 뿐이다.
// ⭐ 문턱 값은 `src/cardCover.js` 에 있다 — 클라우드도 «같은 값»을 쓴다(창업자 확정 2026-08-31 ⓑ)

// `className` = 크기를 «CSS 로» 정하고 싶을 때 쓴다 (넓은 화면에서 키우려면 인라인이면 못 이긴다).
// ⚠️ 안에서 쓰는 움직임 클래스(`anim`)와 «합쳐서» 넘긴다 — 덮어쓰면 움직이는 배경이 죽는다.
export default function Thumb({ recipe, radius = 16, ratio, style, className = '', emojiSize = '2rem', iconSize = '56%', showDecor = false, panProps }) {
  const [failed, setFailed] = useState(false)
  // 🎴🎴 「이 그림은 자랑카드다」 — `imageFit` 이 없던 시절에 저장한 표지를 되살리는 자리.
  //   ⭐ 값에 **그림 자체**를 담는다(참/거짓이 아니라) — 표지를 바꾸면 저절로 무효가 된다.
  //      (목록에서 카드 하나가 다른 레시피를 그리게 될 때 옛 판정이 남는 것을 막는다)
  const [카드였던그림, set카드였던그림] = useState(null)
  const thumb = recipe.thumb || (recipe.image ? 'photo' : 'icon') // 예전 레시피 호환
  const showImg = thumb === 'photo' && recipe.image && !failed
  // 🎴🎴 **「사진」과 「이미 완성된 표지 한 장(자랑카드)」은 다른 물건이다.** (창업자 2026-08-18)
  //   📮 *"레꾸자랑카드를 표지로바꾼거 이렇게돼"* → *"아니 **원래 자랑카드전체가 표지여야하는데** 동그랗게됐다고"*
  //      ＋ *"**사진넣기 기능 -일기에서 쓰던거 넣고 변했어**"* ← 창업자가 원인까지 짚었다(맞았다).
  //   ⛔ 2026-08-17 `5d1a5bb` 「표지 사진을 아이콘처럼 동그랗게」가 **자랑카드까지 같이 동그랗게** 만들었다.
  //      실측 = 표지 칸을 채우는 넓이 **24.5%** · 카드 원본이 살아남은 넓이 **62.8%**
  //      (`scripts/_repro-카드표지-0818.mjs` — 진짜로 저장해서 잰 값).
  //   ⭐ 8/17 결정(*"사진을 이모지랑 똑같이 동그랗게"*)은 **내 음식 사진**을 두고 한 말이다 —
  //      사진은 피사체가 가운데라 동그라미가 어울리지만, **카드는 판 전체가 그림**이라 자르면 안 된다.
  //   📌 이건 «그림만 봐서는» 못 가른다. 그래서 **저장할 때 표시**한다(`imageFit: 'whole'`).
  //   ⛔⛔ 한 번 더 갈렸다 — 내가 「원래」를 «네모로 꽉 채움(cover)»으로 읽고 고쳤더니
  //      창업자가 *"**위에잘렸어**"*. 4:5 카드를 1:1 칸에 채우면 위아래 20% 가 날아간다.
  //      ✅ 그래서 **자르지 않는다**(`contain`) — 좌우에 여백이 생겨도 카드가 다 보이는 게 먼저다.
  const 카드표지 = recipe.imageFit === 'whole' || 카드였던그림 === recipe.image
  // 표지 배경(배경지) — 정하면 기본 그라데이션 대신 그 배경으로. 패턴은 %라 어느 크기든 스케일된다.
  const bg = recipe.decorBg ? bgStyle(recipe.decorBg) : null
  const dark = recipe.decorBg ? bgIsDark(recipe.decorBg) : false // 딥 배경 = 글자·아이콘 밝게
  // 🌊 움직이는 배경(여름 물결). ⚠️`hk-` 접두어라 「움직임 줄이기」 설정에 같이 걸린다.
  //   ⭐ 저장 이미지는 걱정 없다 — 배경은 **위치만** 바뀌지 모양이 안 바뀐다
  //      (스티커 모션은 기울기가 바뀌어 «제일 기울어진 순간»이 찍힐 수 있는 것과 다르다).
  const anim = recipe.decorBg ? bgAnim(recipe.decorBg) : ''
  const base = {
    position: 'relative',
    width: '100%',
    borderRadius: radius,
    overflow: 'hidden',
    ...(bg || { background: 'var(--thumb)' }),
    ...(ratio ? { aspectRatio: ratio } : {}),
    ...style,
  }
  const center = { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }

  let inner
  if (showImg) {
    // 📷📷 [2026-08-17 창업자] *"저 사진을 **이모지랑 똑같이 동그랗게** 만들어주고, **확대 축소도** 가능하게"*
    //   ⛔ 그 전엔 `objectFit: cover` 로 **네모를 꽉 채웠다.** 그래서 아이콘 표지(가운데 그릇 그림 ＋ 여백)와
    //      «같은 자리인데 완전히 다른 모양»이 됐다 — 창업자가 표지를 사진으로 바꾸자마자 *"컥."*
    //   ⭐ 그래서 **아이콘과 «같은 크기»(`iconSize`)로 동그랗게** 놓는다. 값을 새로 정하지 않는다 —
    //      아이콘이 쓰는 그 값을 그대로 쓰면 **둘이 어긋날 수가 없다.**
    //   🔍 `imagePos`·`imageZoom` = 원 안에서 어디를 보여줄지. 일기 속지 사진이 쓰는 문법 그대로다
    //      (`PaperSheet` 의 `<키>Pos`·`<키>Zoom`) — 두 곳이 다른 규칙을 쓰면 한쪽을 고칠 때 다른 쪽이 낡는다.
    //   ⚠️ `transformOrigin` 을 `objectPosition` 과 **같은 값**으로 준다. 다르면 확대할 때 사진이 옆으로 튄다.
    const pos = recipe.imagePos || '50% 50%'
    const z = clampZoom(recipe.imageZoom)
    inner = (
      <div style={center}>
        {/* 🫳 `panProps` = 「끌어서 옮기고 두 손가락으로 확대」를 걸 자리 (창업자 2026-08-17).
            ⭐ **그림 담은 칸 자체**에 건다 — 손짓이 칸 크기(`getBoundingClientRect`)로 이동량을 계산해서,
               바깥 상자에 걸면 그 칸보다 큰 상자를 기준으로 재어 손가락보다 사진이 덜 움직인다.
            ⛔ 안 넘기면 아무 일도 안 한다 — 목록 카드는 «보기만» 하는 자리라 넘기지 않는다. */}
        <div
          {...panProps}
          style={{
            ...(카드표지
              ? { width: '100%', height: '100%', borderRadius: 0 }        // 카드 = 표지 칸을 통째로
              : { width: iconSize, aspectRatio: '1 / 1', borderRadius: '50%' }), // 사진 = 아이콘처럼 동그랗게
            overflow: 'hidden',
            flex: '0 0 auto',
            ...(panProps?.style || {}),
          }}
        >
          <img
            src={recipe.image}
            alt={recipe.title}
            loading="lazy"
            draggable={false}
            onError={() => setFailed(true)}
            onLoad={(e) => { if (e.currentTarget.naturalHeight >= 카드높이문턱) set카드였던그림(recipe.image) }}
            style={{
              ...photoImgStyle(pos, z),
              // 🎴 카드는 **한 군데도 안 자른다**(`contain`) — 좌우에 여백이 생겨도 다 보이는 게 먼저다.
              //    ⚠️ 유저가 두 손가락으로 «확대»했으면(zoom>1) 그 뜻이 우선이라 그때는 잘라 채운다.
              ...(카드표지 && clampZoom(recipe.imageZoom) <= 1 ? { objectFit: 'contain' } : null),
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    )
  } else if (thumb === 'emoji') {
    inner = <div style={center}><span style={{ fontSize: emojiSize, lineHeight: 1 }}>{recipe.emoji || '🍽️'}</span></div>
  } else if (thumb === 'label') {
    const txt = (recipe.label || recipe.title || '한끼').trim()
    const chars = graphemes(txt) // 이모지도 1글자로 — 중간에 잘리지 않게
    const shown = chars.length > 6 ? chars.slice(0, 5).join('') + '…' : txt
    const n = chars.length > 6 ? 6 : chars.length
    inner = (
      <div style={center}>
        {/* viewBox 안에 그려 컨테이너 크기에 맞춰 자동으로 커지고 작아진다. */}
        <svg viewBox="0 0 48 48" width="76%" height="76%" preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
          <text
            x="24"
            y="25"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="Pretendard, sans-serif"
            fontWeight="800"
            fill={dark ? '#f1e8d8' : '#5f5a50'}
            fontSize="18"
            letterSpacing="-1"
            textLength={Math.min(46, n * 11)}
            lengthAdjust="spacingAndGlyphs"
          >
            {shown}
          </text>
        </svg>
      </div>
    )
  } else if (thumb === 'none') {
    inner = null // 표지 비우기 — 아이콘·이모지 없이 배경/꾸미기만 보이게
  } else {
    inner = (
      <div style={center}>
        {/* ⛔⛔ 「어두운 배경엔 밝은 원(스포트)」은 «없다». 다시 넣지 말 것. (창업자 2026-08-05 *"어두운배경에만 원 생기는 거 별로야"* · *"빼서 만들어줘. 원래대로"*)
            v8.5(2026-07-22)에 내가 딥 배경 넣으며 같이 넣은 것이고 창업자 판정을 받은 적이 없었다.
            게다가 그 원이 «아이콘 위»에 칠해져 아이콘을 하얗게 덮고 있었다(창업자 폰 제보 2026-08-05).
            📌 배운 것 = CSS 는 «자리를 잡은(position≠static) 것»을 «흐름 속 그림»보다 «나중에» 칠한다.
               FoodIcon 은 그냥 <img> 라 자리를 안 잡아서, 「뒤에 깐다」고 쓴 원이 92% 흰 장막이 됐다
               (실측 — 같은 아이콘이 밝은 판에선 채도 52%인데 딥플럼 위에선 8%·밝기 244까지 죽었다).
               ⭐ 그래서 층을 고칠 게 아니라 **원 자체가 없는 게 답이었다.** 🔒 `check-thumb.mjs` 가 다시 들어오는 걸 막는다. */}
        <FoodIcon name={recipe.icon || guessFoodIcon(recipe.title)} size={iconSize} />
      </div>
    )
  }

  // 꾸민 표지를 목록 썸네일에도 보여준다(showDecor). 꾸민 레시피만 — 안 꾸민 건 깔끔한 아이콘 유지.
  // DecorLayer는 위치를 비율로 잡아 어느 크기 박스든 그대로 축소된다.
  const decorated = showDecor && recipe.decor?.length > 0

  return (
    <div className={[anim, className].filter(Boolean).join(' ')} style={base}>
      {inner}
      {decorated && <DecorLayer items={recipe.decor} />}
    </div>
  )
}
