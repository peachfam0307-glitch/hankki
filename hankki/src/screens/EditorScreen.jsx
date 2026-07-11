import { useRef, useState } from 'react'
import { useStore, newId } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import Thumb from '../components/Thumb'
import { CATEGORIES, colors } from '../theme'
import { TAG_LIST } from '../data/seed'
import { guessCategory } from '../utils'

const DIFFS = ['쉬움', '보통', '어려움']

export default function EditorScreen({ id }) {
  const { recipes, folders, addRecipe, updateRecipe, addFolder } = useStore()
  const nav = useNav()
  const editing = recipes.find((r) => r.id === id)
  const fileRef = useRef(null)

  const [f, setF] = useState(() => ({
    title: editing?.title && editing.title !== '새 레시피' ? editing.title : editing?.title || '',
    image: editing?.image || null,
    emoji: editing?.emoji || '🍽️',
    category: editing?.category && editing.category !== '전체' ? editing.category : guessCategory(editing?.title || ''),
    time: editing?.time || '',
    servings: editing?.servings || '',
    difficulty: editing?.difficulty || '쉬움',
    ingredients: (editing?.ingredients || []).join('\n'),
    steps: (editing?.steps || []).join('\n'),
    tags: editing?.tags || [],
    folder: editing?.folder || editing?.category || '한식',
    memo: editing?.memo || '',
    sourceUrl: editing?.sourceUrl || '',
    source: editing?.source || 'manual',
  }))

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const toggleTag = (t) => set('tags', f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t])

  const onPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set('image', reader.result)
    reader.readAsDataURL(file)
  }

  const canSave = f.title.trim().length > 0

  const save = () => {
    if (!canSave) return
    const patch = {
      title: f.title.trim(),
      image: f.image,
      category: f.category,
      folder: f.folder || f.category,
      time: Number(f.time) || 0,
      servings: Number(f.servings) || 0,
      difficulty: f.difficulty,
      ingredients: splitLines(f.ingredients),
      steps: splitLines(f.steps),
      tags: f.tags,
      memo: f.memo.trim(),
      sourceUrl: f.sourceUrl.trim(),
      status: 'sorted',
    }
    if (editing) {
      updateRecipe(editing.id, patch)
      nav.pop()
      nav.showToast('레시피를 정리했어요 ✨')
    } else {
      const rec = { id: newId(), emoji: '🍽️', source: 'manual', favorite: false, cooked: 0, savedAt: Date.now(), ...patch }
      addRecipe(rec)
      nav.pop()
      nav.showToast('레시피를 저장했어요 ✨')
    }
  }

  return (
    <div className="screen fade">
      <div className="topbar-back">
        <button className="icon-btn press" onClick={() => nav.pop()} aria-label="닫기"><Icon name="x" size={24} /></button>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{editing ? '레시피 정리' : '직접 작성하기'}</div>
        <button className="press" onClick={save} disabled={!canSave} style={{ fontSize: 15, fontWeight: 700, color: canSave ? colors.brown : colors.sand }}>
          저장
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }} />

      <div className="pad" style={{ paddingBottom: 40 }}>
        {/* 사진 */}
        <button className="press" onClick={() => fileRef.current?.click()} style={{ width: '100%', marginTop: 6, marginBottom: 20, position: 'relative' }}>
          <Thumb recipe={{ image: f.image, emoji: f.emoji, title: f.title }} ratio="16/10" radius={16} emojiSize="2.6rem" />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: f.image ? '#fff' : 'var(--brown)', textShadow: f.image ? '0 1px 4px rgba(0,0,0,0.4)' : 'none' }}>
            <Icon name="camera" size={26} color={f.image ? '#fff' : 'var(--brown)'} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{f.image ? '사진 변경' : '사진 추가'}</span>
          </div>
        </button>

        <div className="field">
          <label>제목</label>
          <input value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="예) 명란 크림 파스타" autoFocus={!editing} />
        </div>

        <div className="field">
          <label>카테고리</label>
          <div className="hscroll" style={{ padding: 0, margin: 0 }}>
            {CATEGORIES.filter((c) => c !== '전체').map((c) => (
              <button key={c} className={`pill press ${f.category === c ? 'active' : ''}`} onClick={() => set('category', c)}>{c}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>조리시간 (분)</label>
            <input value={f.time} onChange={(e) => set('time', e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="20" />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>인분</label>
            <input value={f.servings} onChange={(e) => set('servings', e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="2" />
          </div>
        </div>

        <div className="field">
          <label>난이도</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {DIFFS.map((d) => (
              <button key={d} className={`pill press ${f.difficulty === d ? 'active' : ''}`} onClick={() => set('difficulty', d)}>{d}</button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>재료 (한 줄에 하나씩)</label>
          <textarea rows={5} value={f.ingredients} onChange={(e) => set('ingredients', e.target.value)} placeholder={'스파게티 면 160g\n명란 2큰술\n생크림 200ml'} />
        </div>

        <div className="field">
          <label>만드는 법 (한 줄에 한 단계)</label>
          <textarea rows={5} value={f.steps} onChange={(e) => set('steps', e.target.value)} placeholder={'면을 삶는다.\n소스를 만든다.\n면과 소스를 섞는다.'} />
        </div>

        <div className="field">
          <label>태그</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TAG_LIST.map((t) => (
              <button key={t} className={`pill press ${f.tags.includes(t) ? 'active' : ''}`} onClick={() => toggleTag(t)}># {t}</button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>폴더</label>
          <div className="hscroll" style={{ padding: 0, margin: 0 }}>
            {folders.map((c) => (
              <button key={c} className={`pill press ${f.folder === c ? 'active' : ''}`} onClick={() => set('folder', c)}>{c}</button>
            ))}
            <button
              className="pill press"
              onClick={() => {
                const name = window.prompt('새 폴더 이름')
                if (name && name.trim()) {
                  addFolder(name.trim())
                  set('folder', name.trim())
                }
              }}
            >
              + 새 폴더
            </button>
          </div>
        </div>

        <div className="field">
          <label>원본 링크 (선택)</label>
          <input value={f.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} placeholder="https://..." inputMode="url" />
        </div>

        <div className="field">
          <label>메모 (선택)</label>
          <textarea rows={3} value={f.memo} onChange={(e) => set('memo', e.target.value)} placeholder="나만의 팁이나 변형 아이디어" />
        </div>

        <button className="btn-primary press" onClick={save} disabled={!canSave} style={{ opacity: canSave ? 1 : 0.5 }}>
          {editing ? '정리 완료' : '레시피 저장'}
        </button>
      </div>
    </div>
  )
}

function splitLines(s) {
  return s.split('\n').map((l) => l.trim()).filter(Boolean)
}
