import { useRef, useState, useEffect } from 'react'
import Icon from './Icon'
import { StickerArt, StickerFx, FRIEND_IDS, stickerRatio, NOTE_COLORS, TEXT_COLORS, TEXT_FONTS, TEXT_WEIGHTS, notePatternStyle, noteRadius, noteClip, noteIsClip, NoteShapeDefs, tapeStyle } from './Stickers'

// ── 꾸미기 레이어 ──
// 레시피 표지 위에 스티커·포스트잇을 얹는다.
// item: { id, type:'sticker'|'note', key(스티커 아트 id | 포스트잇 색 key), text, x, y, s, r }
//   x,y — 중심 위치(컨테이너 비율 0~1) / s — 폭(컨테이너 폭 비율) / r — 회전(도)
// editable=false 면 순수 표시(포인터 이벤트 없음), true 면 드래그·핸들·삭제 제공.

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

export default function DecorLayer({ items = [], editable = false, selectedId, onSelect, onChange, onRemove, onEditNote, onEmptyTap }) {
  const boxRef = useRef(null)
  // 커버 실제 폭(px) — 글자 상자를 글자에 딱 맞추면서(max-content) 글자 크기는 '커버 폭 기준'으로 px 계산하려고.
  const [coverW, setCoverW] = useState(0)
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const update = () => setCoverW(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 드래그(이동) — 아이템 몸통
  const dragRef = useRef(null)
  const onItemDown = (it) => (e) => {
    if (!editable) return
    e.stopPropagation()
    const wasSel = selectedId === it.id
    onSelect?.(it.id)
    const rect = boxRef.current.getBoundingClientRect()
    dragRef.current = { id: it.id, x0: it.x, y0: it.y, px: e.clientX, py: e.clientY, rect, moved: false, wasSel, it }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onItemMove = (e) => {
    const d = dragRef.current
    if (!d) return
    if (Math.abs(e.clientX - d.px) > 8 || Math.abs(e.clientY - d.py) > 8) d.moved = true
    const nx = clamp(d.x0 + (e.clientX - d.px) / d.rect.width, 0.02, 0.98)
    const ny = clamp(d.y0 + (e.clientY - d.py) / d.rect.height, 0.02, 0.98)
    onChange?.(d.id, { x: nx, y: ny })
  }
  const onItemUp = () => {
    const d = dragRef.current
    // 탭 = 선택(꾸미기 바로), 이미 선택된 걸 다시 탭 = 글씨 쓰기 — '두 번 탭' 방식(창업자 선택 2026-07-18).
    // 새로 붙일 땐 어차피 쓰기창이 자동으로 뜨므로, 탭은 꾸미기(선택)에 주는 게 전체적으로 편하다.
    // (드래그면 이동만. 쓰기는 다시 탭 또는 연필 버튼.)
    if (d && !d.moved && d.wasSel && (d.it.type === 'note' || d.it.type === 'text')) onEditNote?.(d.it)
    dragRef.current = null
  }

  // 핸들(크기+회전) — 선택된 아이템 우하단 손잡이
  const hRef = useRef(null)
  const onHandleDown = (it) => (e) => {
    e.stopPropagation()
    const rect = boxRef.current.getBoundingClientRect()
    const cx = rect.left + it.x * rect.width
    const cy = rect.top + it.y * rect.height
    const dx = e.clientX - cx
    const dy = e.clientY - cy
    // 🔍 이 스티커를 얼마나 키울 수 있나 = **그림 원본이 몇 px인가**로 정한다.
    //   ⚠️ 2026-07-31 창업자 폰 제보(마늘·셰프모자를 크게 키운 화면) — *"어두운색 테두리 있는 애들이 거의 이래"*
    //   재보니 **파일은 멀쩡했다.** 원인은 찌꺼기가 아니라 **확대**였다:
    //   재료·도구 39컷 소스가 171~250px인데 손잡이 상한이 0.9(=972px)라 **최대 4~5배**까지 늘어난다.
    //   확대하면 없던 정보가 생기는 게 아니라 가장자리가 뭉개져서 **테두리가 지저분해 보인다.**
    //   ⭐ `check-sticker-res.mjs` 게이트가 못 잡은 이유 = 그건 **기본 크기**만 재는데 **유저는 키운다.**
    //   → 스티커마다 **소스 긴변 × 1.7배**(게이트와 같은 기준)까지만 커지게 막는다.
    //     0.22 밑으로는 안 내린다 — 기본 크기까지는 어떤 컷이든 쓸 수 있어야 한다.
    //   📌 막는 게 참는 것보다 낫다: 못 키우면 아쉬울 뿐이지만, 키워서 뭉개지면 **앱이 싸구려로 보인다.**
    const img = e.currentTarget.parentElement?.querySelector('img')
    const srcPx = img && img.naturalWidth ? Math.max(img.naturalWidth, img.naturalHeight) : 0
    const maxS = srcPx ? clamp((srcPx * 1.7) / 1080, 0.22, 0.9) : 0.9
    hRef.current = { id: it.id, cx, cy, d0: Math.hypot(dx, dy) || 1, a0: (Math.atan2(dy, dx) * 180) / Math.PI, s0: it.s, r0: it.r || 0, isText: it.type === 'text', maxS }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onHandleMove = (e) => {
    const h = hRef.current
    if (!h) return
    const dx = e.clientX - h.cx
    const dy = e.clientY - h.cy
    // 글자는 커버를 꽉 채울 만큼 더 크게 · 그림은 원본 해상도가 허락하는 만큼만(h.maxS)
    const s = clamp(h.s0 * (Math.hypot(dx, dy) / h.d0), 0.07, h.isText ? 1.6 : (h.maxS || 0.9))
    const r = h.r0 + (Math.atan2(dy, dx) * 180) / Math.PI - h.a0
    onChange?.(h.id, { s, r })
  }
  const onHandleUp = () => { hRef.current = null }

  // 📍 빈 종이를 탭했을 때 «어디를» 탭했는지 비율로 알려준다 (2026-08-06)
  //    창업자 *"속지 화면 줄 클릭하면 글쓰고"* — 글칸을 탭하면 글쓰기로 넘어가려고.
  //    ⚠️ `currentTarget === target` 이라야 «빈 종이»다 — 스티커를 탭한 건 여기로 안 온다.
  //    ⛔ 주석을 태그 «안»에 두지 않는다 — 표현식 자리에서 죽는다(2026-08-04 빌드 사고).
  const onBoxDown = (e) => {
    onSelect?.(null)
    if (!onEmptyTap || e.currentTarget !== e.target) return
    const b = e.currentTarget.getBoundingClientRect()
    if (b.width && b.height) onEmptyTap(((e.clientX - b.left) / b.width) * 100, ((e.clientY - b.top) / b.height) * 100)
  }

  return (
    <div
      ref={boxRef}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: editable ? 'auto' : 'none', touchAction: editable ? 'none' : 'auto' }}
      onPointerDown={editable ? onBoxDown : undefined}
    >
      {(editable || items.some((it) => it.type === 'note' && noteIsClip(it.shape))) && <NoteShapeDefs />}
      {items.map((it) => {
        const on = editable && selectedId === it.id
        const isText = it.type === 'text'
        const ratio = it.type === 'photo' ? (it.ratio || 1) : it.type === 'tape' ? (it.ratio || 3.4) : it.type === 'note' ? (it.shape === 'oval' ? 1.5 : it.shape === 'cloud' ? 1.35 : it.shape === 'circle' ? 1 : 1.06) : stickerRatio(it.key)
        const base = {
          position: 'absolute',
          left: `${it.x * 100}%`,
          top: `${it.y * 100}%`,
          // 글자: 상자를 글자에 딱 맞게(max-content) — 점선칸이 글자 폭만큼만. 크기는 TextDeco가 커버폭 px로.
          // 나머지(스티커·테이프·포스트잇): 폭=it.s + 종횡비 고정.
          ...(isText
            ? { width: 'max-content', maxWidth: '150%' }
            : { width: `${it.s * 100}%`, aspectRatio: `${ratio}` }),
          transform: `translate(-50%,-50%) rotate(${it.r || 0}deg)`,
          touchAction: 'none',
          cursor: editable ? 'grab' : 'default',
        }
        return (
          <div
            key={it.id}
            style={base}
            onPointerDown={onItemDown(it)}
            onPointerMove={onItemMove}
            onPointerUp={onItemUp}
            onPointerCancel={onItemUp}
          >
            {it.type === 'tape' ? (
              <div style={{ position: 'absolute', inset: 0, ...tapeStyle(it.key), boxShadow: '0 1px 3px rgba(70,60,45,.18)' }} />
            ) : it.type === 'note' ? (
              <Note it={it} editable={editable} />
            ) : it.type === 'text' ? (
              <TextDeco it={it} editable={editable} coverW={coverW} />
            ) : it.type === 'photo' ? (
              // 📷 내 사진 — 종이 «종류와 상관없이» 붙는다 (창업자 2026-08-06
              //    *"무지나 도트도 사진 넣고싶을수있지않아? 그럼 어떻게 사진넣어?"*)
              //    ⭐ 틀의 사진칸은 「창에 끼우는 것」이고, 이건 「사진을 붙이는 것」이다 — 둘 다 있어야 한다.
              //    흰 테 ＋ 그림자 = 인화한 사진을 얹은 느낌(다꾸의 기본 문법).
              <span style={{ position: 'absolute', inset: 0, borderRadius: '2%', overflow: 'hidden', background: '#fff', padding: '3.5%', boxShadow: '0 3px 7px rgba(60,50,35,.28)' }}>
                <img src={it.src} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </span>
            ) : (
              <span style={{ position: 'absolute', inset: 0, filter: 'drop-shadow(0 3px 4px rgba(60,50,35,.22))' }}>
                <StickerArt id={it.key} color={it.color} motion={it.motion} />
                {/* 🐻🐧 효과는 **친구들 탭 전부**에 붙는다 — 전엔 `gp_` 접두어만 봐서
                    여름 곰펭(`sm_`)·가을 곰펭(`au_b`)은 효과를 골라도 화면에 안 나왔다. */}
                {FRIEND_IDS.has(it.key) && <StickerFx kind={it.fx} />}
              </span>
            )}

            {on && (
              // 핸들 프레임 — 최소 58px(작은 스티커여도 핸들이 몸통 바깥에 놓이게). 프레임은 클릭 통과(pointerEvents none),
              // 핸들 버튼만 auto → 작은 별도 몸통 중앙은 그대로 드래그, 삭제/확대가 잘못 안 눌림.
              <div style={{ position: 'absolute', left: '50%', top: '50%', width: 'max(100%, 64px)', height: 'max(100%, 64px)', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
                {/* 선택 테두리 */}
                <span style={{ position: 'absolute', inset: -6, border: '1.6px dashed rgba(255,255,255,.9)', borderRadius: 10, boxShadow: '0 0 0 1px rgba(0,0,0,.25)', pointerEvents: 'none' }} />
                {/* 삭제 */}
                <button
                  className="press"
                  aria-label="스티커 삭제"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onRemove?.(it.id) }}
                  style={{ position: 'absolute', top: -17, right: -17, width: 31, height: 31, borderRadius: '50%', background: '#3f382e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.3)', pointerEvents: 'auto' }}
                >
                  <Icon name="x" size={15} color="#fff" stroke={2.6} />
                </button>
                {/* 포스트잇·글자 수정 */}
                {(it.type === 'note' || it.type === 'text') && (
                  <button
                    className="press"
                    aria-label="글 수정"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onEditNote?.(it) }}
                    style={{ position: 'absolute', top: -17, left: -17, width: 31, height: 31, borderRadius: '50%', background: 'var(--brown)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.3)', pointerEvents: 'auto' }}
                  >
                    <Icon name="pen" size={15} color="#fff" />
                  </button>
                )}
                {/* 크기·회전 핸들 */}
                <span
                  aria-label="크기·회전"
                  onPointerDown={onHandleDown(it)}
                  onPointerMove={onHandleMove}
                  onPointerUp={onHandleUp}
                  onPointerCancel={onHandleUp}
                  style={{ position: 'absolute', bottom: -19, right: -19, width: 38, height: 38, borderRadius: '50%', background: '#fff', border: '1.5px solid rgba(0,0,0,.15)', boxShadow: '0 2px 7px rgba(0,0,0,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none', cursor: 'nwse-resize', pointerEvents: 'auto' }}
                >
                  <svg viewBox="0 0 20 20" width="19" height="19"><path d="M4 12a8 8 0 0 0 8-8M12 4h4v4" fill="none" stroke="#5a5244" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// 글자 크기 = it.s × 커버 폭(px). 길이와 무관하게 '한 글자 크기'가 일정 → 상자는 글자에 딱 맞음(max-content).
// 줄바꿈은 사용자가 엔터로 직접(자동 분할 안 함 — "돼지고기가지볶음"처럼 붙은 글자가 이상하게 안 잘리게).
function TextDeco({ it, editable, coverW = 0 }) {
  const c = TEXT_COLORS.find((t) => t.key === it.color) || TEXT_COLORS[0]
  const f = TEXT_FONTS.find((t) => t.key === it.font) || TEXT_FONTS[0]
  const text = it.text || (editable ? '글자' : '')
  // it.s(사용자 조절)만으로 크기 결정 → 크기/회전 핸들 로직 그대로, 상자만 글자에 맞게 줄어듦.
  const cw = coverW || 320
  const fontPx = Math.max(8, Math.min(220, it.s * 0.15 * cw))
  // ✒️ 굵기 = 외곽선 두께로 낸다(글씨체가 400 한 종류뿐이라 font-weight 로는 안 굵어진다).
  //    `paintOrder: stroke fill` 이라 선이 글자 뒤에 깔려 **획을 안 갉고 바깥으로만** 두꺼워진다.
  const wt = TEXT_WEIGHTS.find((t) => t.key === it.w) || TEXT_WEIGHTS[1]
  // 살(굵기) = 글자와 **같은 색**으로 두르기 → 진짜로 굵어 보인다. 글씨체별 원래 굵기로 보정.
  const fatPx = fontPx * wt.fat * (f.fw ?? 1)
  // 가독용 대비 테두리는 그림자로 따로 — 굵기를 바꿔도 이건 일정하게(글자만 굵어지게)
  const outPx = Math.max(0.8, fontPx * 0.028)
  return (
    <div
      style={{
        fontFamily: f.family,
        fontWeight: f.weight,
        fontSize: `${fontPx}px`,
        // 굵게 하면 글자끼리 닿는다 → 살이 붙는 만큼 자간도 벌린다(펜글씨가 특히 심했다)
        letterSpacing: `calc(${f.ls || '0em'} + ${(wt.fat * 1.6).toFixed(3)}em)`,
        lineHeight: 1.22,
        color: c.color,
        textAlign: 'center',
        whiteSpace: 'pre', // \n만 줄바꿈, 자동 줄바꿈 없음
        // 사진 위에서도 읽히게 반대 톤 외곽선 + 그림자
        WebkitTextStroke: fatPx > 0.2 ? `${fatPx}px ${c.color}` : undefined,
        paintOrder: 'stroke fill',
        // 사방 대비선(외곽선 역할) + 살짝 그림자 — 사진 위에서도 읽히게
        textShadow: [`${outPx}px 0 0 ${c.stroke}`, `-${outPx}px 0 0 ${c.stroke}`, `0 ${outPx}px 0 ${c.stroke}`, `0 -${outPx}px 0 ${c.stroke}`,
          `${outPx * 0.7}px ${outPx * 0.7}px 0 ${c.stroke}`, `-${outPx * 0.7}px ${outPx * 0.7}px 0 ${c.stroke}`,
          `${outPx * 0.7}px -${outPx * 0.7}px 0 ${c.stroke}`, `-${outPx * 0.7}px -${outPx * 0.7}px 0 ${c.stroke}`,
          '0 1px 3px rgba(0,0,0,.35)'].join(','),
        userSelect: 'none',
      }}
    >
      {text}
    </div>
  )
}

function Note({ it, editable }) {
  const c = NOTE_COLORS.find((n) => n.key === it.key) || NOTE_COLORS[0]
  const shape = it.shape || 'fold'
  const pattern = it.pattern || 'plain'
  const pat = notePatternStyle(pattern, c.line || c.fold)
  const clip = noteClip(shape)
  const isClip = noteIsClip(shape)
  const radius = noteRadius(shape)
  // 플레이스홀더는 편집 중에만 — 저장된 표지에선 빈 포스트잇은 빈 종이로 보인다.
  const text = it.text || '' // 빈 포스트잇 = 글자 없이 노트만(안내문구 없이 그대로 빈 채로). 편집은 탭·연필로.
  // 글씨체 — 글자 도구와 같은 목록에서 고른다(컨텍스트 바). 없으면 귀염체가 기본.
  const nf = TEXT_FONTS.find((t) => t.key === it.font) || TEXT_FONTS[0]

  // 종이 판(색 + 무늬 + 모양). clip 모양은 그림자를 filter 로(clip 이 box-shadow 를 잘라내므로).
  const paper = {
    position: 'absolute', inset: 0, background: c.bg, overflow: 'hidden',
    ...(isClip
      ? { clipPath: clip, WebkitClipPath: clip, filter: 'drop-shadow(1.5px 3px 5px rgba(70,60,45,.3))' }
      : { borderRadius: radius, boxShadow: '1.5px 4px 10px rgba(70,60,45,.25)' }),
  }
  // 하트·별·곰 등은 글자가 실루엣 밖으로 안 나가게 안쪽 여백을 넉넉히.
  const textPad = isClip ? '22% 18%' : '9% 10%'

  return (
    <div style={{ position: 'absolute', inset: 0, containerType: 'size', color: c.text }}>
      {/* 종이 + 무늬 */}
      <div style={paper}>
        {pat && <span style={{ position: 'absolute', inset: 0, ...pat }} />}
        {shape === 'fold' && (
          <span style={{ position: 'absolute', right: 0, bottom: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: '0 0 16cqw 16cqw', borderColor: `transparent transparent ${c.fold} transparent` }} />
        )}
      </div>

      {/* 글자 (마스크 밖 — 실루엣 위에 얹힘) */}
      <div
        style={{
          position: 'absolute', inset: 0, boxSizing: 'border-box', padding: textPad,
          // 포스트잇 글자 = 웜브라운 본연의 부드러움(밝은 종이라 외곽선 없어도 잘 읽힘).
          // 단, 얇은 손글씨(귀염체·펜글씨)만 동색 얇은 외곽선(0.4px)으로 살짝 두껍게(창업자 요청). 색은 그대로.
          fontFamily: nf.family, fontWeight: nf.weight, letterSpacing: nf.ls || 'normal',
          ...((it.font === 'gaegu' || it.font === 'nanumpen') ? { WebkitTextStroke: `0.4px ${c.text}`, paintOrder: 'stroke fill' } : {}),
          fontSize: 'clamp(7px, 15cqw, 72px)', lineHeight: 1.4,
          overflow: 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'keep-all', overflowWrap: 'break-word',
          display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        }}
      >
        {text}
      </div>

      {/* 테이프 — 위쪽 가운데 반투명 마스킹테이프 */}
      {shape === 'tape' && (
        <span style={{ position: 'absolute', top: '-6cqw', left: '50%', width: '46%', height: '15cqw', transform: 'translateX(-50%) rotate(-3deg)', background: 'rgba(255,255,255,.5)', border: '0.5px solid rgba(120,110,90,.18)', boxShadow: '0 1px 3px rgba(70,60,45,.14)' }} />
      )}
      {/* 핀 — 위쪽 가운데 압정 */}
      {shape === 'pin' && (
        <span style={{ position: 'absolute', top: '-7cqw', left: '50%', width: '15cqw', height: '15cqw', transform: 'translateX(-50%)', borderRadius: '50%', background: 'radial-gradient(circle at 38% 34%, #e08a7a, #c4614f)', boxShadow: '0 1.5px 3px rgba(60,30,25,.35)' }}>
          <span style={{ position: 'absolute', top: '22%', left: '26%', width: '26%', height: '26%', borderRadius: '50%', background: 'rgba(255,255,255,.65)' }} />
        </span>
      )}
    </div>
  )
}
