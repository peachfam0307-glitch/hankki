import { useState, useEffect, useRef } from 'react'
import Portal from './Portal'
import PromptSheet from './PromptSheet'
import Thumb from './Thumb'
import DecorLayer from './DecorLayer'
import { StickerArt, STICKER_GROUPS, KITCHEN_IDS, PHOTO_IDS, stickerRatio, MOTIONS, FX_KINDS, NOTE_COLORS, NOTE_PATTERNS, NOTE_SHAPES, notePatternStyle, noteRadius, noteClip, noteIsClip, TEXT_COLORS, TEXT_FONTS, DECOR_BACKGROUNDS, RECOLORABLE, STICKER_COLORS, TAPE_PATTERNS } from './Stickers'

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
// 마스킹테이프 굵기 — 비율(가로/세로)이 클수록 가늘다. 기본 3.4.
const TAPE_WIDTHS = [
  { key: 'thin', label: '가늘게', ratio: 5.2 },
  { key: 'mid', label: '보통', ratio: 3.4 },
  { key: 'thick', label: '굵게', ratio: 2.3 },
]

// ── 표지 꾸미기 에디터 ──
// 전체 화면 오버레이. 표지(정사각) 위에 스티커·포스트잇을 얹고
// 드래그로 이동, 우하단 핸들로 크기·회전, ×로 삭제. 저장하면 recipe.decor 로 영구 저장.
let seq = 0
const newDecorId = () => `d${Date.now().toString(36)}${(seq++ % 1296).toString(36)}`

// 🛟 자동저장 초안 — 꾸미는 중 계속 localStorage 에 저장, 앱이 죽거나 실수로 닫혀도 다시 열면 복구.
// (창업자 데이터 손실 방지. 저장 누르면 초안 비움.)
const draftKey = (id) => `hankki:decorDraft:${id}`
function loadDraft(id) {
  try { return JSON.parse(localStorage.getItem(draftKey(id)) || 'null') } catch { return null }
}

export default function DecorEditor({ recipe, onSave, onClose }) {
  const savedThumb = recipe.thumb || (recipe.image ? 'photo' : 'icon')
  // 저장된 표지 상태로 시작하되, 자동저장 초안이 있으면 그걸로 복구(꾸미던 중 날아간 것 되살림).
  const draft = loadDraft(recipe.id)
  const [items, setItems] = useState(() => (draft?.items || recipe.decor || []).map((d) => ({ ...d })))
  const [sel, setSel] = useState(null)
  const [noteEdit, setNoteEdit] = useState(null) // 글 수정 중인 포스트잇 item
  const [textFont, setTextFont] = useState('gaegu') // 글자 스티커 글씨체 기본 = 귀염체(손글씨 톤)
  const [bg, setBg] = useState(draft?.bg ?? recipe.decorBg ?? 'none') // 표지 배경(배경지)
  // 되돌리기용 실제 표지 — 저장값이 'none'이어도 아이콘/사진으로 되살릴 수 있게
  const origThumb = savedThumb !== 'none' ? savedThumb : (recipe.image ? 'photo' : 'icon')
  const [thumb, setThumb] = useState(draft?.thumb ?? savedThumb) // 'none'이면 표지 그림 비움 → 깨끗한 배경에 꾸미기
  const [exitAsk, setExitAsk] = useState(false) // 취소 시 "저장 안 함?" 확인
  const restoredRef = useRef(!!draft) // 초안에서 복구했는지(안내 토스트용)
  const [cat, setCat] = useState('bgtape') // 서랍 탭(배경부터 시작 — 배경·글자·친구들·음식·데코·라이프)
  const [foodChip, setFoodChip] = useState('f_han') // 음식 탭 요리별 서브칩(한식 기본)

  // 선택하면 맨 앞으로(배열 끝으로) — 겹칠 때 자연스럽게 위로 올라온다
  const select = (id) => {
    setSel(id)
    if (id) setItems((arr) => { const i = arr.findIndex((x) => x.id === id); return i < 0 ? arr : [...arr.slice(0, i), ...arr.slice(i + 1), arr[i]] })
  }
  const patch = (id, p) => setItems((arr) => arr.map((x) => (x.id === id ? { ...x, ...p } : x)))
  const remove = (id) => { setItems((arr) => arr.filter((x) => x.id !== id)); setSel(null) }

  // 🛟 자동저장 — 편집할 때마다 초안을 localStorage 에 저장(디바운스). 앱이 죽거나 실수로 닫혀도 안 날아감.
  const exitedRef = useRef(false) // 저장/나가기 후엔 초안 재생성 안 되게(대기중 디바운스 무효화)
  useEffect(() => {
    if (exitedRef.current) return
    const t = setTimeout(() => {
      try { localStorage.setItem(draftKey(recipe.id), JSON.stringify({ items, bg, thumb, at: Date.now() })) } catch { /* 용량 초과 등 무시 */ }
    }, 350)
    return () => clearTimeout(t)
  }, [items, bg, thumb, recipe.id])
  const clearDraft = () => { exitedRef.current = true; try { localStorage.removeItem(draftKey(recipe.id)) } catch { /* noop */ } }
  // 저장 안 한 변경이 있나(취소 시 확인용)
  const isDirty = () => JSON.stringify(items) !== JSON.stringify(recipe.decor || []) ||
    (bg || 'none') !== (recipe.decorBg || 'none') || thumb !== savedThumb
  const doSave = () => { clearDraft(); onSave(items, bg, thumb) }
  const doExit = () => { clearDraft(); onClose() }
  const handleCancel = () => { if (isDirty()) setExitAsk(true); else doExit() }

  const selItem = items.find((x) => x.id === sel)
  const selNoteColor = NOTE_COLORS.find((n) => n.key === selItem?.key) || NOTE_COLORS[0]

  // 선택한 아이템 편집용 '고정 컨텍스트 바' 스타일 — 캔버스 바로 아래 항상 보임(스크롤 왔다갔다 없앰)
  const ctxLabel = { fontSize: 11.5, fontWeight: 800, color: 'var(--brown)', flex: '0 0 auto', minWidth: 34 }
  const ctxScroll = { display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2, flex: 1 }
  const ctxRow = { display: 'flex', alignItems: 'center', gap: 9 }
  const ctxDot = { width: 30, height: 30, borderRadius: '50%', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }
  const ctxChip = { flex: '0 0 auto', padding: 4, borderRadius: 10, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }
  const selOn = '2.5px solid var(--brown)'
  const selOff = '1.5px solid var(--line)'
  const selIsKitchen = selItem?.type === 'sticker' && KITCHEN_IDS.has(selItem.key)
  const selIsGompeng = selItem?.type === 'sticker' && selItem.key?.startsWith('gp_') // 곰펭도 모션·효과 컨텍스트바
  const hasCtx = selItem && (selItem.type === 'note' || selItem.type === 'text' || selItem.type === 'tape' || selIsKitchen || selIsGompeng || (selItem.type === 'sticker' && RECOLORABLE.has(selItem.key)))

  // 서랍 탭 — 배경부터 시작(꾸미는 순서: 배경→글자→친구들→음식·데코·라이프). 음식만 요리별 서브칩(2단계).
  const CATS = [
    { key: 'bgtape', label: '🎨 배경' },
    { key: 'notetext', label: '🗒️ 글자' },
    { key: 'buddies', label: '🐻 친구들' },
    { key: 'food', label: '🍱 음식' },
    { key: 'deco', label: '✨ 데코' },
    { key: 'life', label: '💪 라이프' },
  ]
  const groupsByTab = (t) => STICKER_GROUPS.filter((g) => g.tab === t)
  const foodGroups = groupsByTab('food') // 각 그룹 = 요리별 서브칩(한식·양식·중식·일식·분식·디저트·재료)
  const foodGroup = foodGroups.find((g) => g.key === foodChip) || foodGroups[0]

  // 포스트잇을 선택하면 서랍을 맨 위로 올려 '무늬·모양 꾸미기'가 바로 보이게 한다.
  const drawerRef = useRef(null)
  useEffect(() => {
    const it = items.find((x) => x.id === sel)
    if (it?.type === 'note' && drawerRef.current) drawerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel])

  const addSticker = (key) => {
    const n = items.length
    const isKf = KITCHEN_IDS.has(key)
    const it = {
      id: newDecorId(), type: 'sticker', key,
      x: 0.5 + ((n % 3) - 1) * 0.06, y: 0.42 + ((n % 4) - 1.5) * 0.05,
      s: key === 'yum' ? 0.34 : isKf ? 0.28 : key.startsWith('gp_duo') ? 0.34 : key.startsWith('gp_') ? 0.26 : PHOTO_IDS.has(key) ? ((key.startsWith('dc_') || key.startsWith('ch_')) ? 0.15 : 0.22) : FACE_KEYS.has(key) ? 0.11 : 0.2, r: ((n % 5) - 2) * 4,
      ...(isKf || key.startsWith('gp_') ? { motion: 'tongtong', fx: 'none' } : {}),
    }
    setItems((arr) => [...arr, it])
    setSel(it.id)
  }
  const addNote = (colorKey) => {
    const n = items.length
    const it = { id: newDecorId(), type: 'note', key: colorKey, text: '', font: 'gaegu', x: 0.62 + ((n % 2) - 0.5) * 0.06, y: 0.68, s: 0.34, r: ((n % 5) - 2) * 3 }
    setItems((arr) => [...arr, it])
    setSel(it.id)
    setNoteEdit(it) // 붙이면 바로 글씨 쓰기 시트 열기(무늬·모양은 상단 컨텍스트 바에서)
  }
  const addTape = (key) => {
    const n = items.length
    const it = { id: newDecorId(), type: 'tape', key, x: 0.5, y: 0.28 + (n % 3) * 0.14, s: 0.62, r: ((n % 5) - 2) * 3 }
    setItems((arr) => [...arr, it])
    setSel(it.id)
  }
  const addText = (colorKey) => {
    const n = items.length
    const it = { id: newDecorId(), type: 'text', color: colorKey, font: textFont, text: '', x: 0.5, y: 0.5 + ((n % 3) - 1) * 0.08, s: 0.5, r: 0 }
    setItems((arr) => [...arr, it])
    setSel(it.id)
    setNoteEdit(it)
  }

  // 스티커 셀 한 칸 — 종류별 크기(부엌식구들 세로길쭉 / 음식·데코 사진은 제 비율 / SVG 정사각)
  const renderCell = (key) => {
    const isKf = KITCHEN_IDS.has(key)
    const isPhoto = PHOTO_IDS.has(key)
    const isDeco = key.startsWith('dc_') // 데코 조각(하트·별·리본…)은 위 SVG 색바꾸기 줄과 같은 크기로 작게
    const colorable = RECOLORABLE.has(key)
    // 사진 스티커는 '정사각 박스에 contain' → 넓적·길쭉이 다 같은 크기로 보인다(크기 통일). 음식·라이프는 조금 작게.
    return (
      <button key={key} className="press decor-cell" onClick={() => addSticker(key)} aria-label={colorable ? `${key} · 색 바꾸기 가능` : key} style={{ position: 'relative' }}>
        <span style={{ display: 'block', width: key === 'yum' ? '92%' : isKf ? '62%' : isDeco ? '56%' : key.startsWith('gp_') ? '82%' : isPhoto ? '70%' : '78%', aspectRatio: key === 'yum' ? '74/46' : isKf ? '0.75' : isPhoto ? '1' : '1' }}>
          <StickerArt id={key} />
        </span>
        {/* 🎨 '색 바꿀 수 있음' 표시 — 스티커에 박아 발견성↑. 뮤트 미니 팔레트 점. */}
        {colorable && (
          <span aria-hidden="true" style={{ position: 'absolute', top: 3, right: 3, width: 15, height: 15, borderRadius: '50%', background: 'conic-gradient(from 210deg, #d68f88, #ccaa6d, #94a37e, #93aabd, #b2a3c1, #d68f88)', border: '1.6px solid var(--surface)', boxShadow: '0 1px 2.5px rgba(70,60,45,.35)' }} />
        )}
      </button>
    )
  }
  // 스티커 그룹 한 덩어리(소제목 + 그리드)
  const renderStickerGroup = (g) => (
    <div className="decor-sec" key={g.key}>
      {g.label && <div className="decor-sec-label">{g.label}</div>}
      <div className="decor-grid">{g.items.map(renderCell)}</div>
    </div>
  )

  return (
    <Portal>
      <div className="decor-editor">
        {/* 상단 바 */}
        <div className="decor-top">
          <button className="press" onClick={handleCancel} style={{ color: 'var(--text-sub)', fontSize: 15, fontWeight: 600 }}>취소</button>
          <div style={{ fontSize: 16, fontWeight: 800 }}>레시피 꾸미기</div>
          <button className="press" onClick={doSave} style={{ color: 'var(--brown)', fontSize: 15, fontWeight: 800 }}>저장</button>
        </div>
        {restoredRef.current && (
          <div style={{ flex: '0 0 auto', background: '#eef3e8', color: '#4f5a44', fontSize: 12.5, fontWeight: 700, textAlign: 'center', padding: '6px 10px' }}>
            🛟 저장 안 하고 나갔던 꾸미기를 이어서 불러왔어요
          </div>
        )}

        {/* 표지 캔버스 */}
        <div className="decor-stage">
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: 18, overflow: 'hidden' }}>
            <Thumb recipe={{ ...recipe, decorBg: bg, thumb }} ratio="1/1" radius={0} emojiSize="4.5rem" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />
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
            {hasCtx ? '탭한 걸 여기서 바로 꾸며요 · 드래그로 이동 · ⟳ 크기/회전' : '아래에서 골라 붙이고 · 드래그로 이동 · ⟳ 손잡이로 크기/회전'}
          </div>
        </div>

        {/* 고정 컨텍스트 바 — 선택한 아이템의 색·무늬·모양을 캔버스 바로 아래에서 바로 바꾼다(스크롤 이동 없음) */}
        {hasCtx && (
          <div style={{ flex: '0 0 auto', borderTop: '1px solid var(--line)', background: 'var(--cream)', padding: '9px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {(selIsKitchen || selIsGompeng) && (
              <>
                <div style={ctxRow}>
                  <span style={ctxLabel}>✨ 움직임</span>
                  <div style={ctxScroll}>
                    {MOTIONS.filter((m) => m.base).map((m) => {
                      const on = (selItem.motion || 'tongtong') === m.key
                      return (
                        <button key={m.key} className="press" onClick={() => patch(sel, { motion: m.key })}
                          style={{ padding: '5px 13px', borderRadius: 999, fontSize: 13, fontWeight: 700, flex: '0 0 auto', whiteSpace: 'nowrap', background: on ? 'var(--brown)' : 'var(--surface)', color: on ? '#fff' : 'var(--text-sub)', border: on ? 'none' : '1px solid var(--line)' }}>{m.label}</button>
                      )
                    })}
                  </div>
                </div>
                <div style={ctxRow}>
                  <span style={ctxLabel}>💫 효과</span>
                  <div style={ctxScroll}>
                    {FX_KINDS.filter((f) => f.base).map((f) => {
                      const on = (selItem.fx || 'none') === f.key
                      return (
                        <button key={f.key} className="press" onClick={() => patch(sel, { fx: f.key })}
                          style={{ padding: '5px 13px', borderRadius: 999, fontSize: 13, fontWeight: 700, flex: '0 0 auto', whiteSpace: 'nowrap', background: on ? 'var(--brown)' : 'var(--surface)', color: on ? '#fff' : 'var(--text-sub)', border: on ? 'none' : '1px solid var(--line)' }}>{f.label}</button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
            {selItem.type === 'sticker' && RECOLORABLE.has(selItem.key) && (
              <div style={ctxRow}>
                <span style={ctxLabel}>🎨 색</span>
                <div style={ctxScroll}>
                  <button className="press" onClick={() => patch(sel, { color: null })} aria-label="기본색"
                    style={{ ...ctxDot, border: !selItem.color ? selOn : selOff, fontSize: 10, fontWeight: 800, color: 'var(--text-sub)', background: 'var(--surface)' }}>기본</button>
                  {STICKER_COLORS.map((c) => (
                    <button key={c.key} className="press" onClick={() => patch(sel, { color: c.color })} aria-label={`색 ${c.key}`}
                      style={{ ...ctxDot, background: c.color, border: selItem.color === c.color ? selOn : '1.5px solid rgba(0,0,0,.1)', boxShadow: selItem.color === c.color ? '0 0 0 2px var(--surface) inset' : 'none' }} />
                  ))}
                </div>
              </div>
            )}
            {selItem.type === 'tape' && (
              <>
                <div style={ctxRow}>
                  <span style={ctxLabel}>🎀 무늬</span>
                  <div style={ctxScroll}>
                    {TAPE_PATTERNS.map((t) => (
                      <button key={t.key} className="press" onClick={() => patch(sel, { key: t.key })} aria-label={`테이프 ${t.label}`}
                        style={{ width: 46, height: 22, borderRadius: 3, ...t.style, flex: '0 0 auto', border: selItem.key === t.key ? selOn : '1px solid rgba(0,0,0,.08)' }} />
                    ))}
                  </div>
                </div>
                <div style={ctxRow}>
                  <span style={ctxLabel}>📏 굵기</span>
                  <div style={ctxScroll}>
                    {TAPE_WIDTHS.map((w) => {
                      const on = (selItem.ratio || 3.4) === w.ratio
                      return (
                        <button key={w.key} className="press" onClick={() => patch(sel, { ratio: w.ratio })}
                          style={{ padding: '5px 15px', borderRadius: 999, fontSize: 13, fontWeight: 700, flex: '0 0 auto', background: on ? 'var(--brown)' : 'var(--surface)', color: on ? '#fff' : 'var(--text-sub)', border: on ? 'none' : '1px solid var(--line)' }}>{w.label}</button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
            {selItem.type === 'text' && (
              <div style={ctxRow}>
                <span style={ctxLabel}>✍️ 글씨</span>
                <div style={ctxScroll}>
                  {TEXT_FONTS.map((f) => (
                    <button key={f.key} className="press" onClick={() => patch(sel, { font: f.key })}
                      style={{ padding: '4px 12px', borderRadius: 999, fontSize: 13.5, fontWeight: 700, flex: '0 0 auto', fontFamily: f.family, background: selItem.font === f.key ? 'var(--brown)' : 'var(--surface)', color: selItem.font === f.key ? '#fff' : 'var(--text-sub)' }}>{f.label}</button>
                  ))}
                </div>
              </div>
            )}
            {selItem.type === 'note' && (
              <>
                <div style={ctxRow}>
                  <span style={ctxLabel}>✍️ 글씨</span>
                  <div style={ctxScroll}>
                    {TEXT_FONTS.map((f) => (
                      <button key={f.key} className="press" onClick={() => patch(sel, { font: f.key })}
                        style={{ padding: '4px 12px', borderRadius: 999, fontSize: 13.5, fontWeight: 700, flex: '0 0 auto', fontFamily: f.family, background: (selItem.font || 'gaegu') === f.key ? 'var(--brown)' : 'var(--surface)', color: (selItem.font || 'gaegu') === f.key ? '#fff' : 'var(--text-sub)' }}>{f.label}</button>
                    ))}
                  </div>
                </div>
                <div style={ctxRow}>
                  <span style={ctxLabel}>무늬</span>
                  <div style={ctxScroll}>
                    {NOTE_PATTERNS.map((p) => (
                      <button key={p.key} className="press" onClick={() => patch(sel, { pattern: p.key })}
                        style={{ ...ctxChip, border: (selItem.pattern || 'plain') === p.key ? selOn : selOff }}>
                        <MiniNote color={selNoteColor} pattern={p.key} shape="round" size={22} />
                      </button>
                    ))}
                  </div>
                </div>
                <div style={ctxRow}>
                  <span style={ctxLabel}>모양</span>
                  <div style={ctxScroll}>
                    {NOTE_SHAPES.map((s) => (
                      <button key={s.key} className="press" onClick={() => patch(sel, { shape: s.key })}
                        style={{ ...ctxChip, border: (selItem.shape || 'fold') === s.key ? selOn : selOff }}>
                        <MiniNote color={selNoteColor} pattern="plain" shape={s.key} size={22} />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 서랍 — 새로 붙이기 전용(배경·스티커·테이프·글자·포스트잇). 선택 아이템 편집은 위 컨텍스트 바에서. */}
        <div className="decor-drawer">
          <div className="decor-grab" />
          {/* 카테고리 칩 — 가로로 골라 그 카테고리만(세로 스크롤 최소화) */}
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', padding: '2px 2px 10px', flex: '0 0 auto' }}>
            {CATS.map((c) => {
              const on = cat === c.key
              return (
                <button key={c.key} className="press" onClick={() => setCat(c.key)}
                  style={{ flex: '0 0 auto', padding: '7px 13px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', background: on ? 'var(--brown)' : 'var(--cream)', color: on ? '#fff' : 'var(--text-sub)' }}>
                  {c.label}
                </button>
              )
            })}
          </div>
          <div className="decor-scroll" ref={drawerRef}>
            {/* 🎨 배경·테이프 */}
            {cat === 'bgtape' && (
              <>
                <div className="decor-sec">
                  <div className="decor-sec-label">표지 그림</div>
                  <button className="press" onClick={() => setThumb(thumb === 'none' ? origThumb : 'none')}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '11px 14px', borderRadius: 12, background: thumb === 'none' ? 'var(--brown)' : 'var(--cream)', color: thumb === 'none' ? '#fff' : 'var(--text)', fontWeight: 800, fontSize: 13.5, textAlign: 'left' }}>
                    <span style={{ fontSize: 17 }}>{thumb === 'none' ? '🖼️' : '🧽'}</span>
                    {thumb === 'none' ? '표지 그림 되돌리기' : '표지 그림 지우기 (아이콘·이모지·사진)'}
                  </button>
                  <div style={{ fontSize: 11.5, color: 'var(--text-sub)', marginTop: 6, lineHeight: 1.5 }}>깨끗한 배경에 꾸미고 싶을 때. 원래 그림은 언제든 되돌려요.</div>
                </div>
                <div className="decor-sec">
                  <div className="decor-sec-label">배경지</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {DECOR_BACKGROUNDS.map((b) => {
                      const on = bg === b.key
                      const sw = b.style || { background: 'linear-gradient(135deg,#eef0ec,#e1e5de)' }
                      return (
                        <button key={b.key} className="press" onClick={() => setBg(b.key)} aria-label={`배경 ${b.label}`}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 42, height: 42, borderRadius: 10, ...sw, border: on ? '2.5px solid var(--brown)' : '1.5px solid var(--line)', boxShadow: on ? '0 0 0 2px var(--surface) inset' : 'none' }} />
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: on ? 'var(--brown)' : 'var(--text-sub)' }}>{b.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="decor-sec">
                  <div className="decor-sec-label">마스킹테이프</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {TAPE_PATTERNS.map((t) => (
                      <button key={t.key} className="press" onClick={() => addTape(t.key)} aria-label={`테이프 ${t.label}`}
                        style={{ width: 74, height: 24, borderRadius: 3, ...t.style, boxShadow: '0 1px 3px rgba(70,60,45,.2)', transform: 'rotate(-3deg)' }} />
                    ))}
                  </div>
                </div>
              </>
            )}
            {/* 🗒️ 메모·글자 */}
            {cat === 'notetext' && (
              <>
                <div className="decor-sec">
                  <div className="decor-sec-label">포스트잇</div>
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
                <div className="decor-sec">
                  <div className="decor-sec-label">글자</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '0 0 10px' }}>
                    {TEXT_FONTS.map((f) => (
                      <button key={f.key} className="press" onClick={() => setTextFont(f.key)}
                        style={{ padding: '5px 12px', borderRadius: 999, fontSize: 13, fontWeight: 700, fontFamily: f.family, background: textFont === f.key ? 'var(--brown)' : 'var(--cream)', color: textFont === f.key ? '#fff' : 'var(--text-sub)' }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div className="decor-grid">
                    {TEXT_COLORS.map((c) => (
                      <button key={c.key} className="press decor-cell" onClick={() => addText(c.key)} aria-label={`${c.key} 글자`}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', aspectRatio: '1', fontFamily: (TEXT_FONTS.find((f) => f.key === textFont) || TEXT_FONTS[0]).family, fontWeight: 800, fontSize: 24, color: c.color, WebkitTextStroke: `1px ${c.stroke}`, textShadow: '0 1px 2px rgba(0,0,0,.28)', borderRadius: 12, background: c.key === 'white' || c.key === 'mustard' ? '#8a8479' : 'transparent' }}>
                          가
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            {/* 🐻 친구들 */}
            {cat === 'buddies' && groupsByTab('buddies').map(renderStickerGroup)}
            {/* 🍱 음식 — 요리별 서브칩 + 고른 칩만 (2단계, 안 늘어지게) */}
            {cat === 'food' && (
              <>
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 2px 10px', flex: '0 0 auto' }}>
                  {foodGroups.map((g) => {
                    const on = foodChip === g.key
                    return (
                      <button key={g.key} className="press" onClick={() => setFoodChip(g.key)}
                        style={{ flex: '0 0 auto', padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', background: on ? 'var(--brown)' : 'var(--cream)', color: on ? '#fff' : 'var(--text-sub)' }}>
                        {g.chip}
                      </button>
                    )
                  })}
                </div>
                {foodGroup && <div className="decor-grid">{foodGroup.items.map(renderCell)}</div>}
              </>
            )}
            {/* ✨ 데코 (색 바꾸는 심볼 + 데코 + 응원) */}
            {cat === 'deco' && groupsByTab('deco').map(renderStickerGroup)}
            {/* 💪 라이프 */}
            {cat === 'life' && groupsByTab('life').map(renderStickerGroup)}
          </div>
        </div>

        {noteEdit && (
          <PromptSheet
            compact
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

        {/* 취소 확인 — 저장 안 한 변경이 있을 때만(실수로 날아가는 것 방지) */}
        {exitAsk && (
          <div onClick={() => setExitAsk(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(40,34,28,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 18, padding: '22px 20px 16px', width: '100%', maxWidth: 320, boxShadow: '0 8px 30px rgba(0,0,0,.3)', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>저장하지 않고 나갈까요?</div>
              <div style={{ fontSize: 13.5, color: 'var(--text-sub)', lineHeight: 1.5, marginBottom: 18 }}>지금까지 꾸민 게 사라져요.<br />저장하면 그대로 남아요.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="press" onClick={() => { setExitAsk(false); doSave() }} style={{ padding: '12px', borderRadius: 12, background: 'var(--brown)', color: '#fff', fontSize: 14.5, fontWeight: 800, border: 'none' }}>저장하고 나가기</button>
                <button className="press" onClick={() => { setExitAsk(false); doExit() }} style={{ padding: '11px', borderRadius: 12, background: 'transparent', color: '#c0574a', fontSize: 14, fontWeight: 700, border: 'none' }}>저장 안 하고 나가기</button>
                <button className="press" onClick={() => setExitAsk(false)} style={{ padding: '9px', borderRadius: 12, background: 'transparent', color: 'var(--text-sub)', fontSize: 13.5, fontWeight: 600, border: 'none' }}>계속 꾸미기</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Portal>
  )
}
