import { PAPER_LINE_H } from '../data/papers'

// 📝📝 종이 «위»에 바로 쓴다.
//
// ⛔⛔ 2026-08-06 에 클로드가 **종이 밖에 입력칸을 두고 종이엔 반영만** 되게 만들었다.
//    창업자 *"줄 노트에 저렇게 쓰게 하면 불편해서 안써. 줄노트 자체에 바로 써지게 해야지."*
//    **맞는 말이다.** 다이어리인데 종이가 아니라 폼에 쓰는 건 다이어리가 아니다.
//
// ⭐ 그래서 여기 있는 건 «투명한 글상자»다 — 배경도 테두리도 없고, 종이의 줄 위에 바로 얹힌다.
//    글씨체는 손글씨(귀염체), 줄 간격은 `PAPER_LINE_H` 하나로 CSS 줄과 «묶여» 있다.
//
// 📐 단위가 왜 `cqw` 인가 — 이 판은 세 군데에서 크기가 다르다(다이어리 320 · 꾸미기 328 · 나중 캡처 1080).
//    px 로 박으면 판이 커질 때 **글씨만 혼자 작아지고 줄에서 어긋난다.**
//    `cqw` 는 «종이 폭 기준»이라 어디서든 같은 비율이다. (여름 물결 배경이 세로 %를 못 써서
//    안 움직이던 그 함정의 반대 경우다 — 여기선 반드시 상대값이라야 한다)
//    ⚠️ 컨테이너는 **종이 자신이 아니라 바깥 자**다. 제 폭은 제가 못 잰다 → `PaperBox` 가 감싼다.

const HAND = "'Gaegu','Gowun Dodum','Pretendard',sans-serif"
const INK = '#5b4436' // 우리 진갈색 — 속지 선(#e2d8c6)보다 진해 크라프트 위에서도 읽힌다

// 줄·모눈·도트를 «쓰는 칸 안에만» 그릴 때 쓰는 배경. `.paper.lined` 등과 같은 그림이다.
const ruleBg = (cls) => {
  const g = 'var(--rule-gap)'
  if (cls === 'lined') return `repeating-linear-gradient(to bottom, transparent 0, transparent calc(${g} - 1px), var(--rule) calc(${g} - 1px), var(--rule) ${g})`
  if (cls === 'grid') return `repeating-linear-gradient(to bottom, transparent 0, transparent calc(${g} - 1px), var(--rule) calc(${g} - 1px), var(--rule) ${g}), repeating-linear-gradient(to right, transparent 0, transparent calc(${g} - 1px), var(--rule) calc(${g} - 1px), var(--rule) ${g})`
  if (cls === 'dots') return 'radial-gradient(circle, var(--rule) 1.2px, transparent 1.4px)'
  return null
}

const box = (f) => ({
  position: 'absolute',
  left: `${f.left}%`,
  right: `${f.right}%`,
  ...(f.top !== undefined ? { top: `${f.top}%` } : {}),
  ...(f.bottom !== undefined ? { bottom: `${f.bottom}%` } : {}),
})

const hand = {
  fontFamily: HAND, fontWeight: 700, color: INK,
  fontSize: `${PAPER_LINE_H * 0.79}cqw`,
  lineHeight: `${PAPER_LINE_H}cqw`,
  letterSpacing: '0.01em',
}

/**
 * 종이 위의 «쓰는 칸» 전부. `onChange` 가 없으면 읽기 전용(꾸미기 판·미리보기).
 * `value` = { note: 본문, line: 오늘의 한 줄 }
 */
export default function PaperSheet({ fields, value = {}, onChange, dateLabel = '', rule = '' }) {
  const ro = !onChange
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value })
  const bg = ruleBg(rule)

  return (
    <>
      {/* 📅 날짜 — 그림의 날짜 칸에 «값만» 얹는다(사진일기엔 달력 아이콘·밑줄이 이미 인쇄돼 있다) */}
      {fields.date && dateLabel && (
        <div style={{ ...box(fields.date), ...hand, fontSize: `${PAPER_LINE_H * (fields.date.fit || 0.68)}cqw`, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          {dateLabel}
        </div>
      )}

      {/* ☀️ 날씨 — 그림에 «이미 인쇄된» 아이콘 위에 투명 버튼을 얹는다.
          고르면 손으로 친 듯한 동그라미. 같은 걸 다시 누르면 지워진다.
          ⛔ 아이콘을 새로 그리지 않는다 — 종이에 있는 그림이 그대로 보여야 한다. */}
      {fields.weather && fields.weather.items.map((w) => {
        const on = value.weather === w.key
        const ring = (
          <span
            aria-hidden
            style={{
              position: 'absolute', left: '50%', top: '50%', width: `${fields.weather.size}cqw`, height: `${fields.weather.size}cqw`,
              // 살짝 기울인 타원 = 손으로 그린 동그라미. 정원은 «인쇄»처럼 보인다
              transform: 'translate(-50%,-50%) rotate(-7deg) scaleX(1.08)',
              border: `${fields.weather.size * 0.045}cqw solid ${INK}`, borderRadius: '50%', opacity: 0.62,
            }}
          />
        )
        const pos = {
          position: 'absolute', left: `${w.x}%`, top: `${fields.weather.y}%`,
          width: `${fields.weather.size * 1.28}cqw`, height: `${fields.weather.size * 1.28}cqw`,
          transform: 'translate(-50%,-50%)',
        }
        if (ro) return <span key={w.key} style={pos}>{on && ring}</span>
        return (
          <button
            key={w.key}
            type="button"
            className="press"
            aria-label={`날씨 ${w.label}`}
            aria-pressed={on}
            onClick={() => onChange({ ...value, weather: on ? '' : w.key })}
            style={{ ...pos, background: 'none', border: 'none', padding: 0 }}
          >
            {on && ring}
          </button>
        )
      })}

      {/* ✍️ 본문 — 종이의 줄 위에 바로. 배경·테두리 0 */}
      {fields.write && (
        <div style={{ ...box(fields.write), ...(bg ? { backgroundImage: bg, backgroundSize: rule === 'dots' ? 'var(--rule-gap) var(--rule-gap)' : undefined } : {}) }}>
          {ro ? (
            <div style={{ ...hand, whiteSpace: 'pre-wrap', wordBreak: 'break-word', height: '100%', overflow: 'hidden' }}>{value.note || ''}</div>
          ) : (
            <textarea
              value={value.note || ''}
              onChange={set('note')}
              aria-label="다이어리 본문"
              placeholder="여기에 써요"
              style={{
                ...hand, width: '100%', height: '100%', display: 'block',
                background: 'none', border: 'none', outline: 'none', resize: 'none', padding: 0, margin: 0,
              }}
            />
          )}
        </div>
      )}

      {/* 📝 오늘의 한 줄 — 밑줄 하나 ＋ 라벨. 「레시피 기록」 속지의 맨 아래 칸이다
          (창업자 확정: *"평가빼고 오늘의 한 줄 정도로?"* → 별 다섯을 뺀 자리) */}
      {fields.line && (
        <div style={{ ...box(fields.line) }}>
          {/* 라벨은 «인쇄된 글자»처럼 — 손글씨보다 작고 연하게. 내가 쓴 글과 안 헷갈리게 */}
          <div style={{ fontFamily: HAND, fontWeight: 700, fontSize: `${PAPER_LINE_H * 0.54}cqw`, color: INK, opacity: 0.42, letterSpacing: '0.04em', lineHeight: 1.25, marginBottom: '0.6cqw' }}>
            {fields.line.label}
          </div>
          <div style={{ borderBottom: '1px solid var(--rule)' }}>
            {ro ? (
              <div style={{ ...hand, minHeight: `${PAPER_LINE_H}cqw`, whiteSpace: 'nowrap', overflow: 'hidden' }}>{value.line || ''}</div>
            ) : (
              <input
                value={value.line || ''}
                onChange={set('line')}
                aria-label="오늘의 한 줄"
                maxLength={30}
                style={{
                  ...hand, width: '100%', height: `${PAPER_LINE_H}cqw`, display: 'block',
                  background: 'none', border: 'none', outline: 'none', padding: 0, margin: 0, borderRadius: 0,
                }}
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}

/**
 * 종이 한 장 = 「자(container) → 종이」 두 겹.
 * ⚠️ 자를 따로 두는 이유 = **제 폭은 제가 못 잰다.** `cqw` 는 «조상» 컨테이너를 본다.
 *    종이 자신에 `container-type` 을 걸면 종이 안의 `cqw` 가 종이를 못 보고 더 바깥을 본다.
 */
export function PaperBox({ skin, ratio = '3/4', children, style, className = '', ...rest }) {
  return (
    <div style={{ containerType: 'inline-size', width: '100%' }}>
      <div
        className={`${skin.className} ${className}`.trim()}
        style={{
          position: 'relative', width: '100%', aspectRatio: ratio, overflow: 'hidden',
          // 줄 간격도 «폭 기준» — 글줄과 CSS 줄이 한 값에 묶인다
          '--rule-gap': `${PAPER_LINE_H}cqw`,
          ...(skin.style || {}),
          ...style,
        }}
        {...rest}
      >
        {children}
      </div>
    </div>
  )
}
