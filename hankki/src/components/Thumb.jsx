import { useState } from 'react'
import FoodIcon, { guessFoodIcon } from './FoodIcon'
import DecorLayer from './DecorLayer'
import { bgStyle, bgIsDark, bgAnim } from './Stickers'
import { graphemes } from '../utils'

// 카드 썸네일. recipe.thumb 로 표시 방식을 고른다:
//   'icon'  — 브랜드 커스텀 아이콘(이름 자동매칭 or 직접 선택)  ← 기본
//   'emoji' — 이모지
//   'label' — 글자 타일
//   'photo' — 사진 (있을 때만)
// 예전 레시피(thumb 없음)는 이미지가 있으면 사진, 없으면 아이콘으로 자연스럽게 보인다.
// 레시피 사진(썸네일) 배경은 '하얀색' — 사진·꾸미기가 깨끗하게 얹히도록.
// 색·개성은 꾸미기(사용자 배경/스티커)가 담당한다. (여기 색 넣으면 꾸미기 의미가 죽음)
// 테마별로 화이트 톤이 달라야 함(크림=웜/블루=쿨/다크=톤다운) → CSS 토큰 --thumb 사용.

export default function Thumb({ recipe, radius = 16, ratio, style, emojiSize = '2rem', iconSize = '56%', showDecor = false }) {
  const [failed, setFailed] = useState(false)
  const thumb = recipe.thumb || (recipe.image ? 'photo' : 'icon') // 예전 레시피 호환
  const showImg = thumb === 'photo' && recipe.image && !failed
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
  // ⚠️ `isolation:isolate` = 「여기부터 층을 따로 센다」. 이게 있어야 아래 스포트 원의 zIndex:-1 이
  //    «아이콘 뒤 · 배경 앞» 자리에 앉는다. 없으면 배경보다도 뒤로 가서 아예 안 보인다.
  const center = { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', isolation: 'isolate' }

  let inner
  if (showImg) {
    inner = (
      <img
        src={recipe.image}
        alt={recipe.title}
        loading="lazy"
        onError={() => setFailed(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
      />
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
        {/* 딥 배경에선 컬러 아이콘이 묻히니 은은한 밝은 원(스포트)을 뒤에 깔아 또렷하게 */}
        {/* ⛔⛔ 2026-08-05 창업자 제보 「어두운 배경에서 음식아이콘이 하얗게 변함」 — 이 원이 «위»에 깔려 있었다.
            📌 CSS 는 «자리를 잡은(position≠static) 것»을 «흐름 속 그림»보다 «나중에» 칠한다.
               FoodIcon 은 그냥 <img> 라 자리를 안 잡아서, 뒤에 두려고 쓴 원이 92% 흰 장막이 되어 아이콘을 덮었다.
               (실측 — 같은 아이콘이 밝은 판에선 채도 52%인데 딥플럼 위에선 8%까지 죽었다)
            ✅ 아이콘도 자리를 잡게 하고 층(zIndex)을 못 박는다. ⛔둘 중 하나만 고치면 또 뒤집힌다. */}
        {dark && <span aria-hidden="true" style={{ position: 'absolute', inset: '17%', zIndex: -1, borderRadius: '50%', background: 'radial-gradient(circle, rgba(248,243,235,.92) 58%, rgba(248,243,235,0) 100%)' }} />}
        <FoodIcon name={recipe.icon || guessFoodIcon(recipe.title)} size={iconSize} />
      </div>
    )
  }

  // 꾸민 표지를 목록 썸네일에도 보여준다(showDecor). 꾸민 레시피만 — 안 꾸민 건 깔끔한 아이콘 유지.
  // DecorLayer는 위치를 비율로 잡아 어느 크기 박스든 그대로 축소된다.
  const decorated = showDecor && recipe.decor?.length > 0

  return (
    <div className={anim} style={base}>
      {inner}
      {decorated && <DecorLayer items={recipe.decor} />}
    </div>
  )
}
