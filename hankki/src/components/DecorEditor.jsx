import { useState, useEffect, useRef } from 'react'
import Portal from './Portal'
import PromptSheet from './PromptSheet'
import Thumb from './Thumb'
import DecorLayer from './DecorLayer'
import { StickerArt, STICKER_GROUPS, NOTE_COLORS, NOTE_PATTERNS, NOTE_SHAPES, notePatternStyle, noteRadius, noteClip, noteIsClip, TEXT_COLORS, TEXT_FONTS, DECOR_BACKGROUNDS, bgStyle, RECOLORABLE, STICKER_COLORS } from './Stickers'

// 무늬·모양 칩용 미니 포스트잇 미리보기 (실루엣은 clip-path — defs 는 스테이지 DecorLayer 가 심는다)
function MiniNote({ color, pattern = 'plain', shape = 'fold', size = 30 }) {
  const pat = notePatternStyle(pattern, color.line || color.fold)
  const isClip = noteIsClip(shape)
  const clip = noteClip(shape)
  const rad = noteRadius(shape)
  const paper = isClip
    ? { clipPath: clip, WebkitClipPath: clip, filter: 'drop-shadow(0 1px 1.5px rgba(70,60,45,.3))' }
    : { borderRadius: rad, boxShadow: '0 1px 2px rgba(70,60,45,.2)' }
  const w = shape === 'oval' ? size * 1.4 : shape === 'cloud' ? size * 1.3 : size
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: w, height: size }}>
      <span style={{ position: 'absolute', inset: 0, background: color.bg, overflow: 'hidden', ...paper }}>
        {pat && <span style={{ position: 'absolute', inset: 0, ...pat }} />}
        {shape === 'fold' && <span style={{ position: 'absolute', right: 0, bottom: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: `0 0 ${size * 0.3}px ${size * 0.3}px`, borderColor: `transparent transparent ${color.fold} transparent` }} />}
      </span>
      {shape === 'tape' && <span style={{ position: 'absolute', top: -3, left: '50%', width: '52%', height: 6, transform: 'translateX(-50%) rotate(-4deg)', background: 'rgba(255,255,255,.55)', border: '0.5px solid rgba(120,110,90,.2)' }} />}
      {shape === 'pin' && <span style={{ position: 'absolute', top: -4, left: '50%', width: 9, height: 9, transform: 'translateX(-50%)', borderRadius: '50%', background: 'radial-gradient(circle at 38% 34%, #e08a7a, #c4614f)', boxShadow: '0 1px 2px rgba(60,30,25,.3)' }} />}
    </span>
  )
}

// 표정 스티커는 포인트로 얹는 용도라 기본 크기를 작게 시작한다
const FACE_KEYS = new Set(STICKER_GROUPS.find((g) => g.key === 'faces')?.items || [])

// ── 표지 꾸미기 에디터 ──
// 전체 화면 오버레이. 표지(정사각) 위에 스티커·포스트잇을 얹고
// 드래그로 이동, 우하단 핸들로 크기·회전, ×로 삭제. 저장하면 recipe.decor 로 영구 저장.
let seq = 0
const newDecorId = () => `d${Date.now().toString(36)}${(seq++ % 1296).toString(36)}`

export default function DecorEditor({ recipe, onSave, onClose }) {
  const [items, setItems] = useState(() => (recipe.decor || []).map((d) => ({ ...d })))
  const [sel, setSel] = useState(null)
  const [noteEdit, setNoteEdit] = useState(null) // 글 수정 중인 포스트잇 item
  const [textFont, setTextFont] = useState('gowun') // 글자 스티커 글씨체 (또박/귀염)
  const [bg, setBg] = useState(recipe.decorBg || 'none') // 표지 배경(배경지)

  // 선택하면 맨 앞으로(배열 끝으로) — 겹칠 때 자연스럽게 위로 올라온다
  const select = (id) => {
    setSel(id)
    if (id) setItems((arr) => { const i = arr.findIndex((x) => x.id === id); return i < 0 ? arr : [...arr.slice(0, i), ...arr.slice(i + 1), arr[i]] })
  }
  const patch = (id, p) => setItems((arr) => arr.map((x) => (x.id === id ? { ...x, ...p } : x)))
  const remove = (id) => { setItems((arr) => arr.filter((x) => x.id !== id)); setSel(null) }

  const selItem = items.find((x) => x.id === sel)
  const selNoteColor = NOTE_COLORS.find((n) => n.key === selItem?.key) || NOTE_COLORS[0]

  // 포스트잇을 선택하면 서랍을 맨 위로 올려 '무늬·모양 꾸미기'가 바로 보이게 한다.
  const drawerRef = useRef(null)
  useEffect(() => {
    const it = items.find((x) => x.id === sel)
    if (it?.type === 'note' && drawerRef.current) drawerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel])

  const addSticker = (key) => {
    const n = items.length
    const it = {
      id: newDecorId(), type: 'sticker', key,
      x: 0.5 + ((n % 3) - 1) * 0.06, y: 0.42 + ((n % 4) - 1.5) * 0.05,
      s: key === 'yum' ? 0.34 : FACE_KEYS.has(key) ? 0.11 : 0.2, r: ((n % 5) - 2) * 4,
    }
    setItems((arr) => [...arr, it])
    setSel(it.id)
  }
  const addNote = (colorKey) => {
    const n = items.length
    const it = { id: newDecorId(), type: 'note', key: colorKey, text: '', x: 0.62 + ((n % 2) - 0.5) * 0.06, y: 0.68, s: 0.34, r: ((n % 5) - 2) * 3 }
    setItems((arr) => [...arr, it])
    setSel(it.id)
    // 텍스트 시트를 강제로 열지 않는다 — 붙이면 바로 무늬·모양 옵션이 보이도록.
    // 글씨는 캔버스의 포스트잇을 탭(연필 버튼)해서 추가한다.
  }
  const addText = (colorKey) => {
    const n = items.length
    const it = { id: newDecorId(), type: 'text', color: colorKey, font: textFont, text: '', x: 0.5, y: 0.5 + ((n % 3) - 1) * 0.08, s: 0.5, r: 0 }
    setItems((arr) => [...arr, it])
    setSel(it.id)
    setNoteEdit(it)
  }

  return (
    <Portal>
      <div className="decor-editor">
        {/* 상단 바 */}
        <div className="decor-top">
          <button className="press" onClick={onClose} style={{ color: 'var(--text-sub)', fontSize: 15, fontWeight: 600 }}>취소</button>
          <div style={{ fontSize: 16, fontWeight: 800 }}>표지 꾸미기</div>
          <button className="press" onClick={() => onSave(items, bg)} style={{ color: 'var(--brown)', fontSize: 15, fontWeight: 800 }}>저장</button>
        </div>

        {/* 표지 캔버스 */}
        <div className="decor-stage">
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: 18, overflow: 'hidden' }}>
            <Thumb recipe={{ ...recipe, decorBg: bg }} ratio="1/1" radius={0} emojiSize="4.5rem" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />
            <DecorLayer
              items={items}
              editable
              selectedId={sel}
              onSelect={select}
              onChange={patch}
              onRemove={remove}
              onEditNote={(it) => setNoteEdit(it)}
            />
          </div>
          <div className="t-sub" style={{ fontSize: 12, textAlign: 'center', marginTop: 10 }}>
            아래에서 골라 붙이고 · 드래그로 이동 · ⟳ 손잡이로 크기/회전
          </div>
        </div>

        {/* 서랍 — 세로 스크롤 그리드(가로 스크롤 제거). 카테고리별로 라벨과 함께 쌓아서 한눈에. */}
        <div className="decor-drawer">
          <div className="decor-grab" />
          <div className="decor-scroll" ref={drawerRef}>
            {/* 배경(배경지) — 표지 전체 톤을 바꾼다. 포스트잇 편집 중이 아닐 때만 노출. */}
            {!selItem || selItem.type !== 'note' ? (
              <div className="decor-sec">
                <div className="decor-sec-label">배경</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {DECOR_BACKGROUNDS.map((b) => {
                    const on = bg === b.key
                    const sw = b.style || { background: 'linear-gradient(135deg,#eef0ec,#e1e5de)' }
                    return (
                      <button key={b.key} className="press" onClick={() => setBg(b.key)} aria-label={`배경 ${b.label}`}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 38, height: 38, borderRadius: 10, ...sw, border: on ? '2.5px solid var(--brown)' : '1.5px solid var(--line)', boxShadow: on ? '0 0 0 2px var(--surface) inset' : 'none' }} />
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: on ? 'var(--brown)' : 'var(--text-sub)' }}>{b.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}
            {/* 포스트잇 선택 시 — 무늬·모양 바꾸기 (맨 위에 떠서 바로 보임) */}
            {selItem?.type === 'note' && (
              <div className="decor-sec" style={{ background: 'var(--cream)', borderRadius: 14, padding: '11px 12px 12px' }}>
                <div className="decor-sec-label" style={{ marginBottom: 9 }}>✏️ 선택한 포스트잇 꾸미기</div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-sub)', margin: '0 0 6px' }}>무늬</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {NOTE_PATTERNS.map((p) => {
                    const on = (selItem.pattern || 'plain') === p.key
                    return (
                      <button key={p.key} className="press" onClick={() => patch(sel, { pattern: p.key })}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '7px 9px', borderRadius: 12, background: on ? 'var(--surface)' : 'transparent', border: on ? '1.5px solid var(--brown)' : '1.5px solid var(--line)' }}>
                        <MiniNote color={selNoteColor} pattern={p.key} shape="round" />
                        <span style={{ fontSize: 11, fontWeight: 700, color: on ? 'var(--brown)' : 'var(--text-sub)' }}>{p.label}</span>
                      </button>
                    )
                  })}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-sub)', margin: '0 0 6px' }}>모양</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {NOTE_SHAPES.map((s) => {
                    const on = (selItem.shape || 'fold') === s.key
                    return (
                      <button key={s.key} className="press" onClick={() => patch(sel, { shape: s.key })}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '7px 9px', borderRadius: 12, background: on ? 'var(--surface)' : 'transparent', border: on ? '1.5px solid var(--brown)' : '1.5px solid var(--line)' }}>
                        <MiniNote color={selNoteColor} pattern="plain" shape={s.key} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: on ? 'var(--brown)' : 'var(--text-sub)' }}>{s.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            {/* 스티커 선택 시 — 색 바꾸기(리컬러 대상만) */}
            {selItem?.type === 'sticker' && RECOLORABLE.has(selItem.key) && (
              <div className="decor-sec" style={{ background: 'var(--cream)', borderRadius: 14, padding: '11px 12px 12px' }}>
                <div className="decor-sec-label" style={{ marginBottom: 9 }}>🎨 선택한 스티커 색</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="press" onClick={() => patch(sel, { color: null })} aria-label="기본색"
                    style={{ width: 34, height: 34, borderRadius: '50%', border: !selItem.color ? '2.5px solid var(--brown)' : '1.5px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'var(--text-sub)', background: 'var(--surface)' }}>기본</button>
                  {STICKER_COLORS.map((c) => {
                    const on = selItem.color === c.color
                    return (
                      <button key={c.key} className="press" onClick={() => patch(sel, { color: c.color })} aria-label={`색 ${c.key}`}
                        style={{ width: 34, height: 34, borderRadius: '50%', background: c.color, border: on ? '2.5px solid var(--brown)' : '1.5px solid rgba(0,0,0,.1)', boxShadow: on ? '0 0 0 2px var(--surface) inset' : 'none' }} />
                    )
                  })}
                </div>
              </div>
            )}
            {STICKER_GROUPS.map((g) => (
              <div key={g.key} className="decor-sec">
                <div className="decor-sec-label">{g.label}</div>
                <div className="decor-grid">
                  {g.items.map((key) => (
                    <button key={key} className="press decor-cell" onClick={() => addSticker(key)} aria-label={key}>
                      <span style={{ display: 'block', width: key === 'yum' ? '92%' : '78%', aspectRatio: key === 'yum' ? '74/46' : '1' }}>
                        <StickerArt id={key} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="decor-sec">
              <div className="decor-sec-label">글자 · 직접 쓰기</div>
              {/* 글씨체 선택 — 또박/귀염/펜글씨/임팩트/라운드 (여러 개라 아래 줄에 감싸서) */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '2px 0 10px' }}>
                {TEXT_FONTS.map((f) => (
                  <button
                    key={f.key}
                    className="press"
                    onClick={() => setTextFont(f.key)}
                    style={{
                      padding: '5px 12px', borderRadius: 999, fontSize: 13, fontWeight: 700,
                      fontFamily: f.family,
                      background: textFont === f.key ? 'var(--brown)' : 'var(--cream)',
                      color: textFont === f.key ? '#fff' : 'var(--text-sub)',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="decor-grid">
                {TEXT_COLORS.map((c) => (
                  <button key={c.key} className="press decor-cell" onClick={() => addText(c.key)} aria-label={`${c.key} 글자`}>
                    <span
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', aspectRatio: '1',
                        fontFamily: (TEXT_FONTS.find((f) => f.key === textFont) || TEXT_FONTS[0]).family,
                        fontWeight: 800, fontSize: 24,
                        color: c.color, WebkitTextStroke: `1px ${c.stroke}`, textShadow: '0 1px 2px rgba(0,0,0,.28)',
                        borderRadius: 12, background: c.key === 'white' || c.key === 'mustard' ? '#8a8479' : 'transparent',
                      }}
                    >
                      가
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="decor-sec">
              <div className="decor-sec-label">포스트잇 · 팁 메모</div>
              <div className="decor-grid">
                {NOTE_COLORS.map((c) => (
                  <button key={c.key} className="press decor-cell" onClick={() => addNote(c.key)} aria-label={`${c.key} 포스트잇`}>
                    <span style={{ display: 'block', width: '80%', aspectRatio: '1.02', background: c.bg, borderRadius: '3px 3px 3px 10px', boxShadow: '1px 3px 7px rgba(70,60,45,.22)', position: 'relative' }}>
                      <span style={{ position: 'absolute', right: 0, bottom: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: '0 0 12px 12px', borderColor: `transparent transparent ${c.fold} transparent` }} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {noteEdit && (
          <PromptSheet
            title={noteEdit.type === 'text' ? '글자' : '포스트잇'}
            fields={[{
              key: 'text',
              label: noteEdit.type === 'text' ? '표지에 쓸 글자' : '나만의 팁 · 메모',
              value: noteEdit.text || '',
              placeholder: noteEdit.type === 'text' ? '예) 우리집 최고 메뉴 ♡' : '예) 설탕 반만! 더 담백해',
              multiline: true,
            }]}
            submitLabel="붙이기"
            onSubmit={({ text }) => {
              const t = (text || '').trim()
              // 글자를 비우면 새로 넣은 빈 아이템은 제거(표지에 유령 글자 안 남게)
              if (noteEdit.type === 'text' && !t) remove(noteEdit.id)
              else patch(noteEdit.id, { text: t })
            }}
            onClose={() => setNoteEdit(null)}
          />
        )}
      </div>
    </Portal>
  )
}
