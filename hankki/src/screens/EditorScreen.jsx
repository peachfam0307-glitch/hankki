import { useEffect, useRef, useState } from 'react'
import { useStore, newId } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import FoodIconPicker from '../components/FoodIconPicker'
import EmojiPicker from '../components/EmojiPicker'
import TextTile from '../components/TextTile'
import { guessFoodIcon } from '../components/FoodIcon'
import { CATEGORIES, colors } from '../theme'
import { TAG_LIST } from '../data/seed'
import { guessCategory, cropSquare } from '../utils'
import { ocrImage } from '../ocr'
import { parseRecipeText } from '../parseRecipe'

const DIFFS = ['쉬움', '보통', '어려움']
const THUMB_TYPES = [
  { key: 'icon', label: '아이콘' },
  { key: 'emoji', label: '이모지' },
  { key: 'label', label: '글자' },
  { key: 'photo', label: '사진' },
]

export default function EditorScreen({ id, prefill }) {
  const { recipes, folders, addRecipe, updateRecipe, addFolder } = useStore()
  const nav = useNav()
  const editing = recipes.find((r) => r.id === id)
  const photoRef = useRef(null) // 썸네일용 사진
  const ocrRef = useRef(null) // 글자 읽기용(썸네일과 별개)
  const [ocr, setOcr] = useState({ busy: false, pct: 0 })

  const [f, setF] = useState(() => {
    const e = editing
    const p = !editing && prefill ? prefill : {}
    const ing = e?.ingredients ?? p.ingredients ?? []
    const stp = e?.steps ?? p.steps ?? []
    const title = e ? (e.title && e.title !== '새 레시피' ? e.title : e.title || '') : p.title || ''
    return {
      title,
      // 썸네일 표시 방식: 기본은 아이콘(사진은 '글자 읽기'용으로 분리).
      // 예전 레시피는 이미지가 있으면 사진 유지.
      thumb: e?.thumb || (e?.image ? 'photo' : 'icon'),
      icon: e?.icon || '',
      label: e?.label || '',
      image: e?.image ?? p.image ?? null,
      emoji: e?.emoji || '🍽️',
      category:
        e?.category && e.category !== '전체'
          ? e.category
          : guessCategory((title || '') + ' ' + (p.memo || '')),
      time: e?.time || '',
      servings: e?.servings || '',
      difficulty: e?.difficulty || '쉬움',
      ingredients: ing.join('\n'),
      steps: stp.join('\n'),
      tags: e?.tags || [],
      folder: e?.folder || e?.category || '한식',
      memo: e?.memo ?? p.memo ?? '',
      sourceUrl: e?.sourceUrl || '',
      source: e?.source || p.source || 'manual',
    }
  })

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const toggleTag = (t) => set('tags', f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t])

  // 썸네일용 사진 — 아이콘 크기에 맞춰 정사각으로 예쁘게 잘라 저장한다. (OCR 안 함)
  const onPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const cropped = await cropSquare(reader.result, 800)
      set('image', cropped)
      set('thumb', 'photo')
      nav.showToast('사진을 아이콘 크기로 다듬었어요 ✨')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // 글자 읽기용 사진 — 재료·순서만 채우고, 썸네일은 건드리지 않는다.
  const onOcrFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => runOcr(reader.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // 사진 속 글자를 읽어 빈 칸을 자동으로 채운다. (썸네일과 별개)
  const runOcr = async (img) => {
    if (!img || ocr.busy) return
    setOcr({ busy: true, pct: 0 })
    const text = await ocrImage(img, (pct) => setOcr({ busy: true, pct }))
    setOcr({ busy: false, pct: 0 })
    if (!text.trim()) {
      nav.showToast('사진에서 글자를 찾지 못했어요')
      return
    }
    const r = parseRecipeText(text, { fromOcr: true })
    setF((prev) => ({
      ...prev,
      title: prev.title.trim() || r.title,
      ingredients: prev.ingredients.trim() || r.ingredients.join('\n'),
      steps: prev.steps.trim() || r.steps.join('\n'),
      memo: prev.memo.trim() || r.memo,
      category:
        prev.category && prev.category !== '한식'
          ? prev.category
          : guessCategory((prev.title || r.title || '') + ' ' + r.memo),
    }))
    nav.showToast('사진에서 글자를 읽어 채웠어요 ✨')
  }

  // 사진으로 가져오기·공유로 들어온 경우: 열자마자 글자만 자동 인식(썸네일은 아이콘 유지)
  useEffect(() => {
    if (!editing && prefill?.autoOcr && prefill.image) runOcr(prefill.image)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const canSave = f.title.trim().length > 0

  const save = () => {
    if (!canSave) return
    const title = f.title.trim()
    const patch = {
      title,
      thumb: f.thumb,
      icon: f.icon || guessFoodIcon(title), // 비워두면 제목으로 자동 추천된 아이콘 저장
      emoji: f.emoji || '🍽️',
      label: f.label.trim(),
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
      const rec = { id: newId(), source: 'manual', favorite: false, cooked: 0, savedAt: Date.now(), ...patch }
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

      <input ref={photoRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }} />
      <input ref={ocrRef} type="file" accept="image/*" onChange={onOcrFile} style={{ display: 'none' }} />

      <div className="pad" style={{ paddingBottom: 40 }}>
        {/* 썸네일 — 카드에 보이는 아이콘. 기본은 브랜드 아이콘(통일감), 원하면 이모지·글자·사진. */}
        <div className="field">
          <label>썸네일 <span style={{ fontWeight: 400, color: 'var(--text-sub)', fontSize: 12 }}>· 목록 카드에 보여요</span></label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {THUMB_TYPES.map((t) => (
              <button key={t.key} className={`pill press ${f.thumb === t.key ? 'active' : ''}`} onClick={() => set('thumb', t.key)}>{t.label}</button>
            ))}
          </div>

          {f.thumb === 'icon' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <FoodIconPicker value={f.icon || guessFoodIcon(f.title)} onChange={(k) => set('icon', k)} size={74} />
              <div style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.55 }}>탭해서 아이콘을 골라요.<br />제목에 맞춰 자동 추천돼요.</div>
            </div>
          )}
          {f.thumb === 'emoji' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <EmojiPicker value={f.emoji} onChange={(v) => set('emoji', v)} size={74} />
              <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>탭해서 이모지를 골라요.</div>
            </div>
          )}
          {f.thumb === 'label' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <TextTile text={f.label || f.title || '한끼'} size={74} radius={16} />
              <input value={f.label} onChange={(e) => set('label', e.target.value)} placeholder={f.title || '표시할 글자'} maxLength={6} style={{ flex: 1 }} />
            </div>
          )}
          {f.thumb === 'photo' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                className="press"
                onClick={() => photoRef.current?.click()}
                aria-label={f.image ? '사진 변경' : '사진 추가'}
                style={{
                  width: 74,
                  height: 74,
                  flex: '0 0 auto',
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: 'var(--cream)',
                  border: f.image ? 'none' : '1.5px dashed var(--sand)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {f.image ? (
                  <img src={f.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Icon name="camera" size={26} color="var(--brown)" />
                )}
              </button>
              <div style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.55 }}>
                {f.image ? '탭해서 사진을 바꿔요.' : '탭해서 음식 사진을 골라요.'}<br />
                음식이 가운데 오도록 정사각으로 예쁘게 다듬어져요.
              </div>
            </div>
          )}
        </div>

        {/* 사진에서 글자 읽기 — 썸네일과 별개. 레시피가 적힌 사진을 골라 재료·순서를 자동으로 채운다. */}
        <button
          className="press"
          onClick={() => ocrRef.current?.click()}
          disabled={ocr.busy}
          style={{
            width: '100%',
            marginBottom: 8,
            padding: 13,
            borderRadius: 'var(--r-md)',
            background: 'var(--cream)',
            color: 'var(--brown)',
            fontSize: 14,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: ocr.busy ? 0.85 : 1,
          }}
        >
          {ocr.busy ? <>사진에서 글자 읽는 중… {ocr.pct}%</> : <><Icon name="camera" size={18} color="var(--brown)" /> 사진에서 글자 가져오기</>}
        </button>
        <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 18, lineHeight: 1.5 }}>
          레시피가 적힌 사진(캡처)을 고르면 재료·순서를 자동으로 채워요. 썸네일은 바뀌지 않아요.
        </div>

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
            <input value={f.time} onChange={(e) => set('time', e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="예: 20" />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>인분</label>
            <input value={f.servings} onChange={(e) => set('servings', e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="예: 2" />
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
          <textarea rows={5} value={f.ingredients} onChange={(e) => set('ingredients', e.target.value)} placeholder={'재료를 한 줄에 하나씩 적어주세요'} />
        </div>

        <div className="field">
          <label>만드는 법 (한 줄에 한 단계)</label>
          <textarea rows={5} value={f.steps} onChange={(e) => set('steps', e.target.value)} placeholder={'조리 순서를 한 줄에 하나씩 적어주세요'} />
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
