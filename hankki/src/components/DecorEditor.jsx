import { useState } from 'react'
import Portal from './Portal'
import PromptSheet from './PromptSheet'
import Thumb from './Thumb'
import DecorLayer from './DecorLayer'
import { StickerArt, STICKER_GROUPS, NOTE_COLORS, TEXT_COLORS } from './Stickers'

// ── 표지 꾸미기 에디터 ──
// 전체 화면 오버레이. 표지(정사각) 위에 스티커·포스트잇을 얹고
// 드래그로 이동, 우하단 핸들로 크기·회전, ×로 삭제. 저장하면 recipe.decor 로 영구 저장.
let seq = 0
const newDecorId = () => `d${Date.now().toString(36)}${(seq++ % 1296).toString(36)}`

export default function DecorEditor({ recipe, onSave, onClose }) {
  const [items, setItems] = useState(() => (recipe.decor || []).map((d) => ({ ...d })))
  const [sel, setSel] = useState(null)
  const [noteEdit, setNoteEdit] = useState(null) // 글 수정 중인 포스트잇 item

  // 선택하면 맨 앞으로(배열 끝으로) — 겹칠 때 자연스럽게 위로 올라온다
  const select = (id) => {
    setSel(id)
    if (id) setItems((arr) => { const i = arr.findIndex((x) => x.id === id); return i < 0 ? arr : [...arr.slice(0, i), ...arr.slice(i + 1), arr[i]] })
  }
  const patch = (id, p) => setItems((arr) => arr.map((x) => (x.id === id ? { ...x, ...p } : x)))
  const remove = (id) => { setItems((arr) => arr.filter((x) => x.id !== id)); setSel(null) }

  const addSticker = (key) => {
    const n = items.length
    const it = {
      id: newDecorId(), type: 'sticker', key,
      x: 0.5 + ((n % 3) - 1) * 0.06, y: 0.42 + ((n % 4) - 1.5) * 0.05,
      s: key === 'yum' ? 0.34 : 0.2, r: ((n % 5) - 2) * 4,
    }
    setItems((arr) => [...arr, it])
    setSel(it.id)
  }
  const addNote = (colorKey) => {
    const n = items.length
    const it = { id: newDecorId(), type: 'note', key: colorKey, text: '', x: 0.62 + ((n % 2) - 0.5) * 0.06, y: 0.68, s: 0.34, r: ((n % 5) - 2) * 3 }
    setItems((arr) => [...arr, it])
    setSel(it.id)
    setNoteEdit(it)
  }
  const addText = (colorKey) => {
    const n = items.length
    const it = { id: newDecorId(), type: 'text', color: colorKey, text: '', x: 0.5, y: 0.5 + ((n % 3) - 1) * 0.08, s: 0.5, r: 0 }
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
          <button className="press" onClick={() => onSave(items)} style={{ color: 'var(--brown)', fontSize: 15, fontWeight: 800 }}>저장</button>
        </div>

        {/* 표지 캔버스 */}
        <div className="decor-stage">
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', borderRadius: 18, overflow: 'hidden' }}>
            <Thumb recipe={recipe} ratio="1/1" radius={0} emojiSize="4.5rem" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />
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
          <div className="decor-scroll">
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
              <div className="decor-grid">
                {TEXT_COLORS.map((c) => (
                  <button key={c.key} className="press decor-cell" onClick={() => addText(c.key)} aria-label={`${c.key} 글자`}>
                    <span
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', aspectRatio: '1',
                        fontFamily: "'Gowun Dodum','Pretendard',sans-serif", fontWeight: 800, fontSize: 24,
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
