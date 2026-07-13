import { useRef, useState } from 'react'
import { useStore, newId } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import FoodIconPicker from '../components/FoodIconPicker'
import EmojiPicker from '../components/EmojiPicker'
import TextTile from '../components/TextTile'
import CropSheet from '../components/CropSheet'
import Portal from '../components/Portal'
import PromptSheet from '../components/PromptSheet'
import { guessFoodIcon } from '../components/FoodIcon'
import { CATEGORIES } from '../theme'
import { TAG_LIST } from '../data/seed'
import { guessCategory, cropSquare, clampGraphemes } from '../utils'
import { ocrImage } from '../ocr'
import { parseRecipeText, cleanMemo } from '../parseRecipe'
import { embedUrl } from '../embed'

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
  const [cropImg, setCropImg] = useState(null) // 글자 읽기 전 '자르기' 단계
  // 위에 고정해 두고 보면서 쓰기 — 'video'(유튜브·인스타) | 'photo'(캡처 원본) | null
  // 저장된 레시피를 다시 편집할 때도 사진이 있으면 참고용으로 띄울 수 있게 한다.
  const [refs, setRefs] = useState(() => {
    if (prefill?.refImages?.length) return prefill.refImages
    if (editing?.image) return [editing.image]
    return []
  })
  const [pin, setPin] = useState(prefill?.watch ? 'video' : prefill?.refImages?.length ? 'photo' : null)
  const [zoom, setZoom] = useState(false) // 캡처 원본 전체화면으로 크게 보기
  const [newFolder, setNewFolder] = useState(false)

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
      sourceUrl: e?.sourceUrl || p.sourceUrl || '',
      source: e?.source || p.source || 'manual',
    }
  })

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const toggleTag = (t) => set('tags', f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t])
  const embed = embedUrl(f.sourceUrl) // 유튜브·인스타 링크면 '보면서 쓰기' 가능

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

  // 글자 읽기용 사진 — 자르기(광고·그림 제외)를 거쳐 재료·순서만 채운다. 썸네일은 그대로.
  const onOcrFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCropImg(reader.result)
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
      // 메모는 직접 입력 전용 — 사진에서 읽은 내용을 자동으로 붙이지 않는다.
      memo: prev.memo,
      category:
        prev.category && prev.category !== '한식'
          ? prev.category
          : guessCategory((prev.title || r.title || '') + ' ' + r.memo),
    }))
    nav.showToast('사진에서 글자를 읽어 채웠어요 ✨')
  }

  const canSave = f.title.trim().length > 0

  const save = () => {
    if (!canSave) return
    const title = f.title.trim()
    const ings = splitLines(f.ingredients)
    const stps = splitLines(f.steps)
    const patch = {
      title,
      thumb: f.thumb,
      icon: f.icon || guessFoodIcon(title), // 비워두면 제목으로 자동 추천된 아이콘 저장
      emoji: f.emoji || '🍽️',
      label: clampGraphemes(f.label.trim(), 6),
      image: f.image,
      category: f.category,
      folder: f.folder || f.category,
      time: Number(f.time) || 0,
      servings: Number(f.servings) || 0,
      difficulty: f.difficulty,
      ingredients: ings,
      steps: stps,
      tags: f.tags,
      // 어느 경로로 들어왔든, 재료·순서와 겹치는 메모 줄은 저장 직전에 걸러낸다.
      memo: cleanMemo(f.memo.trim(), ings, stps),
      sourceUrl: f.sourceUrl.trim(),
      source: f.source || 'manual', // 가져온 경로(사진·유튜브 등) 배지를 잃지 않게 저장
      status: 'sorted',
    }
    if (editing) {
      updateRecipe(editing.id, patch)
      nav.pop()
      nav.showToast('레시피를 정리했어요 ✨')
    } else {
      const rec = { id: newId(), favorite: false, cooked: 0, savedAt: Date.now(), ...patch }
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
        <button className="press" onClick={save} disabled={!canSave} style={{ fontSize: 15, fontWeight: 700, color: canSave ? 'var(--brown)' : 'var(--sand)' }}>
          저장
        </button>
      </div>

      <input ref={photoRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }} />
      <input ref={ocrRef} type="file" accept="image/*" onChange={onOcrFile} style={{ display: 'none' }} />

      {/* 보면서 쓰기 — 영상(유튜브·인스타)이나 캡처 원본을 위에 고정하고 아래에서 적는다 */}
      {(embed || refs.length > 0) && pin === null && (
        <div style={{ display: 'flex', gap: 8, margin: '6px 16px 0' }}>
          {embed && (
            <button className="press" onClick={() => setPin('video')} style={{ flex: 1, padding: 12, borderRadius: 'var(--r-md)', background: 'var(--cream)', color: 'var(--brown)', fontSize: 14, fontWeight: 700 }}>
              {embed.type === 'youtube' ? '📺 영상 보면서 쓰기' : '📷 인스타 미리보기'}
            </button>
          )}
          {refs.length > 0 && (
            <button className="press" onClick={() => setPin('photo')} style={{ flex: 1, padding: 12, borderRadius: 'var(--r-md)', background: 'var(--cream)', color: 'var(--brown)', fontSize: 14, fontWeight: 700 }}>
              📷 캡쳐 보면서 쓰기
            </button>
          )}
        </div>
      )}
      {pin === 'video' && embed && (
        <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#141311' }}>
          <iframe
            src={embed.src}
            title="원본 영상"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            /* allow-top-navigation·allow-popups 를 모두 빼서, 임베드 안을 눌러도 앱(한끼)이
               인스타·유튜브 앱으로 튕겨 나가지 않게 막는다. (유튜브 인라인 재생엔 영향 없음) */
            sandbox="allow-scripts allow-same-origin allow-presentation"
            style={
              embed.type === 'youtube'
                ? { display: 'block', width: '100%', aspectRatio: '16/9', border: 0 }
                : { display: 'block', width: '100%', height: '48vh', border: 0, background: '#fff' }
            }
          />
          {embed.type === 'instagram' && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '7px 12px', background: 'rgba(20,19,17,0.78)', color: 'rgba(255,255,255,0.92)', fontSize: 11.5, fontWeight: 600, textAlign: 'center' }}>
              인스타 영상은 정책상 앱 안에서 재생되지 않아요 · 캡션·썸네일만 참고할 수 있어요
            </div>
          )}
          <button
            className="press"
            onClick={() => setPin(null)}
            aria-label="영상 닫기"
            style={{ position: 'absolute', top: 8, right: 8, padding: '6px 12px', borderRadius: 10, background: 'rgba(20,19,17,0.72)', color: '#fff', fontSize: 12.5, fontWeight: 700 }}
          >
            ✕ 닫기
          </button>
        </div>
      )}
      {pin === 'photo' && refs.length > 0 && (
        <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#141311' }}>
          {/* 캡처 원본 — 인식이 100%가 아니니 보면서 고친다.
              화면 너비에 꽉 채워 글씨가 크게 보이도록 하고, 길면 세로로 스크롤한다. */}
          <div style={{ maxHeight: '56vh', overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
            {refs.map((img, k) => (
              <img
                key={k}
                src={img}
                alt={`캡처 ${k + 1}`}
                onClick={() => setZoom(k)}
                style={{ display: 'block', width: '100%', height: 'auto', cursor: 'zoom-in' }}
              />
            ))}
          </div>
          <button
            className="press"
            onClick={() => setZoom(0)}
            aria-label="캡처 크게 보기"
            style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', padding: '7px 16px', borderRadius: 999, background: 'rgba(20,19,17,0.78)', color: '#fff', fontSize: 12.5, fontWeight: 700 }}
          >
            🔍 크게 보기{refs.length > 1 ? ` · ${refs.length}장` : ''}
          </button>
          <button
            className="press"
            onClick={() => setPin(null)}
            aria-label="캡처 닫기"
            style={{ position: 'absolute', top: 8, right: 8, padding: '6px 12px', borderRadius: 10, background: 'rgba(20,19,17,0.72)', color: '#fff', fontSize: 12.5, fontWeight: 700 }}
          >
            ✕ 닫기
          </button>
        </div>
      )}

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
              {/* maxLength 금지 — 한글 조합·이모지 입력이 끊긴다(UTF-16 단위로 세기 때문). 저장할 때 잘라낸다. */}
              <input value={f.label} onChange={(e) => set('label', e.target.value)} placeholder={f.title || '표시할 글자'} style={{ flex: 1 }} />
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
          {/* autoFocus 금지 — 화면에 들어오자마자 키보드가 아래 내용을 다 가려버린다. */}
          <input value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="예) 명란 크림 파스타" />
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
            <button className="pill press" onClick={() => setNewFolder(true)}>
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

      {newFolder && (
        <PromptSheet
          title="새 폴더"
          fields={[{ key: 'name', label: '폴더 이름', placeholder: '예) 자주 만드는' }]}
          onSubmit={({ name }) => {
            const nm = name.trim()
            if (nm) { addFolder(nm); set('folder', nm) }
          }}
          onClose={() => setNewFolder(false)}
        />
      )}

      {cropImg && (
        <CropSheet
          image={cropImg}
          onDone={(img) => { setCropImg(null); setRefs((p) => [...p, img]); setPin('photo'); runOcr(img) }}
          onSkip={() => { const img = cropImg; setCropImg(null); setRefs((p) => [...p, img]); setPin('photo'); runOcr(img) }}
          onCancel={() => setCropImg(null)}
        />
      )}

      {/* 캡처 원본 전체화면 — 손가락으로 확대해 자세히 본다. 아래 편집은 그대로 유지된다. */}
      {zoom !== false && refs.length > 0 && (
        <Portal>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(10,9,8,0.96)', overflowY: 'auto', overscrollBehavior: 'contain', touchAction: 'pinch-zoom', WebkitOverflowScrolling: 'touch' }}
            onClick={() => setZoom(false)}
          >
            <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10, padding: '56px 0' }}>
              {refs.map((img, k) => (
                <img key={k} src={img} alt={`캡처 ${k + 1}`} style={{ display: 'block', width: '100%', height: 'auto' }} />
              ))}
            </div>
            <button
              className="press"
              onClick={(e) => { e.stopPropagation(); setZoom(false) }}
              aria-label="닫기"
              style={{ position: 'fixed', top: 'calc(10px + var(--safe-top))', right: 12, padding: '8px 15px', borderRadius: 999, background: 'rgba(255,255,255,0.16)', color: '#fff', fontSize: 13.5, fontWeight: 700, backdropFilter: 'blur(4px)' }}
            >
              ✕ 닫기
            </button>
            <div style={{ position: 'fixed', bottom: 'calc(14px + var(--safe-bottom))', left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600 }}>
              손가락으로 확대·축소 · 위아래로 넘겨 보기
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}

function splitLines(s) {
  return s.split('\n').map((l) => l.trim()).filter(Boolean)
}
