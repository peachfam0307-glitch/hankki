import { useRef, useState, useEffect } from 'react'

// 새 레시피 작성 중 내용을 자동 임시저장하는 키 — 앱이 껐다 켜져도(인스타 링크 따러 갔다 오는 등)
// 쓰던 내용이 날아가지 않게 한다. 저장 완료하면 지운다.
const DRAFT_KEY = 'hankki:editorDraft'
import { useStore, newId } from '../store'
import { useNav } from '../App'
import { useLayerBack } from '../useBackHandler'
import Icon from '../components/Icon'
import FoodIconPicker from '../components/FoodIconPicker'
import TextTile from '../components/TextTile'
import CropSheet from '../components/CropSheet'
import Portal from '../components/Portal'
import PromptSheet from '../components/PromptSheet'
import { guessFoodIcon } from '../components/FoodIcon'
import { CATEGORIES } from '../theme'
import { TAG_LIST } from '../data/seed'
import { guessCategory, cropSquare, clampGraphemes, openExternal } from '../utils'
import { ocrImage } from '../ocr'
import { parseRecipeText, cleanMemo, isGibberish, stripLeadingOcrJunk } from '../parseRecipe'
import { normalizeNumerals } from '../ocrCorrect'
import { embedUrl } from '../embed'

// 특정 칸(재료/만드는 법)에 넣을 때는 분류하지 않고, 읽은 줄을 그대로 정리만 한다.
// 사용자가 "이 사진은 재료다/만드는 법이다"라고 이미 지정했으니 다시 쪼개지 않는다.
function cleanOcrLines(text) {
  return normalizeNumerals(String(text))
    .split('\n')
    .map((l) => l.replace(/^\s*[-*•·▪◦‣●○]\s*/, '').replace(/^\d{1,2}\s*[.)]\s*/, '').trim())
    .map((l) => stripLeadingOcrJunk(l, true)) // 맨앞 아이콘 오독(삐·뽀·0·\·AINE…) 제거 — 자동분류 경로와 동일하게
    .filter((l) => l.length > 1 && !isGibberish(l))
}

const DIFFS = ['쉬움', '보통', '어려움']
// 재료·만드는 법 칸의 '📷 사진에서 채우기' 버튼 — 채워질 칸 바로 옆이 제일 직관적이라 크고 진하게
const fieldOcrBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 14px', borderRadius: 999, background: 'var(--brown)',
  color: '#fff', fontSize: 13, fontWeight: 700,
  boxShadow: '0 2px 8px rgba(90,70,45,0.18)',
}
const THUMB_TYPES = [
  { key: 'icon', label: '아이콘' },
  { key: 'label', label: '글자' },
  { key: 'photo', label: '사진' },
  { key: 'none', label: '없음' },
]

export default function EditorScreen({ id, prefill }) {
  const { recipes, folders, addRecipe, updateRecipe, addFolder } = useStore()
  const nav = useNav()
  const editing = recipes.find((r) => r.id === id)
  const photoRef = useRef(null) // 썸네일용 사진
  const ocrRef = useRef(null) // 글자 읽기용(썸네일과 별개)
  const [ocr, setOcr] = useState({ busy: false, pct: 0 })
  const [cropImg, setCropImg] = useState(null) // 글자 읽기 전 '자르기' 단계
  const ocrTargetRef = useRef('all') // 'all' | 'ingredients' | 'steps' — 어느 칸에 채울지
  const ocrQueue = useRef([]) // 여러 장 선택 시 남은 이미지들(한 장씩 크롭→인식)
  const ocrAccum = useRef('') // 'all' 자동분류용 — 여러 장의 인식 텍스트를 모아 한 번에 파싱
  const ingRef = useRef(null) // 재료 입력칸
  const stepRef = useRef(null) // 만드는 법 입력칸
  // 해당 칸 커서 위치에 단위/수량을 넣는다. 영어 키보드 전환 없이 g·t·T 를 톡 넣기 위함.
  const insertUnit = (u, ref, field) => {
    const el = ref.current
    const v = f[field]
    const start = el ? el.selectionStart : v.length
    const end = el ? el.selectionEnd : start
    set(field, v.slice(0, start) + u + v.slice(end))
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      const pos = start + u.length
      try { el.setSelectionRange(pos, pos) } catch { /* noop */ }
    })
  }
  const UNITS = ['g', 'ml', 'T', 't', '큰술', '작은술', '컵', '개', '약간']
  // (계량 버튼 바는 return 하단에서 Portal 로 body 에 직접 렌더한다 — transform 부모 밖이라 위치가 안정적)
  // 위에 고정해 두고 보면서 쓰기 — 'video'(유튜브·인스타) | 'photo'(캡처 원본) | null
  // 저장된 레시피를 다시 편집할 때도 사진이 있으면 참고용으로 띄울 수 있게 한다.
  const [refs, setRefs] = useState(() => {
    if (prefill?.refImages?.length) return prefill.refImages
    if (editing?.image) return [editing.image]
    return []
  })
  const [pin, setPin] = useState(prefill?.watch ? 'video' : prefill?.refImages?.length ? 'photo' : null)
  const [zoom, setZoom] = useState(false) // 캡처 원본 전체화면으로 크게 보기
  // 핀 고정 캡처가 34vh 안에서 세로 스크롤되는데 신호가 없어 '잘림/고정'으로 오해 → 더 볼 게 있으면 하단 fade
  const [photoMore, setPhotoMore] = useState(false)
  const photoBoxRef = useRef(null)
  const checkPhotoScroll = () => {
    const el = photoBoxRef.current
    if (el) setPhotoMore(el.scrollHeight - el.scrollTop - el.clientHeight > 6)
  }
  useEffect(() => { const id = setTimeout(checkPhotoScroll, 80); return () => clearTimeout(id) }, [pin, refs.length])
  const [newFolder, setNewFolder] = useState(false)

  const [f, setF] = useState(() => {
    const e = editing
    const p = !editing && prefill ? prefill : {}
    const ing = e?.ingredients ?? p.ingredients ?? []
    const stp = e?.steps ?? p.steps ?? []
    const title = e ? (e.title && e.title !== '새 레시피' ? e.title : e.title || '') : p.title || ''
    const built = {
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
    // 새 레시피 작성 중이었다면(편집·prefill 아님) 최근 임시저장분을 복구한다.
    if (!editing && !prefill) {
      try {
        const raw = localStorage.getItem(DRAFT_KEY)
        if (raw) {
          const d = JSON.parse(raw)
          if (d && d.ts && Date.now() - d.ts < 2 * 3600 * 1000 && d.f) return d.f
        }
      } catch { /* noop */ }
    }
    return built
  })

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const [focusField, setFocusField] = useState(null) // 'ingredients'|'steps' — 계량 바를 띄울 대상
  // 지금 포커스된 요소가 재료/순서 칸일 때만 계량 바를 띄운다.
  // focusin/out 으로만 판단 → 깜빡임(리마운트·blur 타이머) 없이 안정적.
  useEffect(() => {
    const sync = () => {
      const el = document.activeElement
      setFocusField(el === ingRef.current ? 'ingredients' : el === stepRef.current ? 'steps' : null)
    }
    const onOut = () => requestAnimationFrame(sync) // 포커스가 빠질 때 다음 프레임에 재확인
    document.addEventListener('focusin', sync)
    document.addEventListener('focusout', onOut)
    return () => { document.removeEventListener('focusin', sync); document.removeEventListener('focusout', onOut) }
  }, [])
  // 전체보기(zoom) 오버레이 — 뒤로가기로 닫기. (크롭 시트는 CropSheet 가 자체 처리)
  useLayerBack(zoom !== false, () => setZoom(false))

  // 작성 중 자동 임시저장 — 텍스트만(사진은 무겁고 텍스트가 핵심). 편집 모드는 제외.
  useEffect(() => {
    if (editing) return
    try {
      const has = f.title.trim() || f.ingredients.trim() || f.steps.trim() || f.memo.trim() || f.sourceUrl.trim()
      if (has) localStorage.setItem(DRAFT_KEY, JSON.stringify({ ts: Date.now(), f }))
      else localStorage.removeItem(DRAFT_KEY)
    } catch { /* noop */ }
  }, [f, editing])
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

  // 글자 읽기용 사진 — 자르기(광고·그림 제외)를 거쳐 채운다. 썸네일은 그대로.
  // target: 'all'(재료·순서 자동 분류) | 'ingredients'(재료만) | 'steps'(만드는 법만)
  const pickOcr = (target) => {
    ocrTargetRef.current = target
    ocrRef.current?.click()
  }
  // 여러 장 선택 지원 — 긴 레시피(2~3컷)를 한꺼번에 골라 한 장씩 크롭→인식→합쳐서 정리.
  const onOcrFile = (e) => {
    const files = [...(e.target.files || [])]
    if (!files.length) return
    e.target.value = ''
    Promise.all(
      files.map((f) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f) })),
    ).then((urls) => {
      ocrAccum.current = ''
      ocrQueue.current = urls.slice(1) // 첫 장은 지금 크롭, 나머지는 대기열
      setCropImg(urls[0])
    })
  }

  // 한 칸에만 이어붙이기 — 이미 내용이 있으면 아래에 덧붙인다(2단·긴 레시피 대응).
  const appendLines = (prevText, lines) => {
    const base = prevText.trim()
    const add = lines.join('\n').trim()
    if (!add) return prevText
    return base ? base + '\n' + add : add
  }

  // 사진 속 글자를 읽어 칸을 채운다. (썸네일과 별개)
  const runOcr = async (img) => {
    if (!img || ocr.busy) return
    const target = ocrTargetRef.current || 'all'
    setOcr({ busy: true, pct: 0 })
    const text = await ocrImage(img, (pct) => setOcr({ busy: true, pct }))
    setOcr({ busy: false, pct: 0 })

    if (target === 'ingredients' || target === 'steps') {
      // 지정한 칸에만 — 읽은 줄을 정리해 이어붙인다(여러 장이면 계속 쌓인다).
      const lines = cleanOcrLines(text)
      if (lines.length) setF((prev) => ({ ...prev, [target]: appendLines(prev[target], lines) }))
    } else {
      // 자동 분류 — 여러 장이면 텍스트를 모았다가 마지막에 한 번에 파싱(분류가 더 정확).
      if (text.trim()) ocrAccum.current = (ocrAccum.current + '\n' + text).trim()
    }

    // 대기열에 다음 장이 있으면 이어서 크롭 → 인식
    if (ocrQueue.current.length) { setCropImg(ocrQueue.current.shift()); return }

    // 마지막 장 — 결과 반영
    if (target === 'ingredients' || target === 'steps') {
      nav.showToast(target === 'ingredients' ? '재료 초안을 담았어요 · 다듬어 주세요 ✍️' : '만드는 법 초안을 담았어요 · 다듬어 주세요 ✍️', 4800)
      return
    }
    const combined = ocrAccum.current
    if (!combined.trim()) { nav.showToast('사진에서 글자를 찾지 못했어요'); return }
    const r = parseRecipeText(combined, { fromOcr: true })
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
    nav.showToast('초안을 채웠어요 · 사진 보며 다듬어 주세요 ✍️', 4800)
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
      // touched: 사용자가 직접 편집한 레시피 — 이후 기본 레시피 자동 갱신에서 덮어쓰지 않게 표시
      updateRecipe(editing.id, { ...patch, touched: true })
      nav.pop()
      nav.showToast('레시피를 정리했어요 ✨')
    } else {
      const rec = { id: newId(), favorite: false, cooked: 0, savedAt: Date.now(), ...patch }
      addRecipe(rec)
      try { localStorage.removeItem(DRAFT_KEY) } catch { /* noop */ } // 저장 완료 → 임시저장 삭제
      // 새 레시피 저장 후엔 열려있던 화면(가져오기 등)을 모두 닫고 홈/현재 탭으로.
      // (뒤로가기로 작성 중이던 빈 편집기가 다시 나오지 않게)
      nav.popAll()
      nav.showToast('레시피를 저장했어요 ✨')
    }
  }

  return (
    <div className="screen fade">
      {focusField && (
        <Portal>
          <div style={{ position: 'fixed', left: 0, right: 0, bottom: 'var(--kb-inset, 0px)', zIndex: 3000, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
            <div onMouseDown={(e) => e.preventDefault()} style={{ pointerEvents: 'auto', width: '100%', maxWidth: 480, display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', padding: '8px 12px', background: 'var(--surface)', borderTop: '2px solid var(--brown)', boxShadow: '0 -3px 12px rgba(0,0,0,.12)' }}>
              {/* 왼쪽 고정 안내 — 키보드와 색이 비슷해 놓치기 쉬워, "이 버튼으로 단위 넣는다"를 못박는다 */}
              <span style={{ flex: '0 0 auto', position: 'sticky', left: 0, zIndex: 1, alignSelf: 'stretch', display: 'flex', alignItems: 'center', gap: 5, paddingRight: 9, background: 'var(--surface)', color: 'var(--brown)', fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', borderRight: '1px solid var(--line)' }}>
                <Icon name="chevron-right" size={14} stroke={2.6} color="var(--brown)" />단위 톡
              </span>
              {UNITS.map((u) => (
                <button key={u} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertUnit(u, focusField === 'steps' ? stepRef : ingRef, focusField)}
                  style={{ flex: '0 0 auto', padding: '8px 14px', borderRadius: 999, background: 'var(--cream)', color: 'var(--brown)', border: '1px solid var(--line)', fontSize: 14, fontWeight: 700, fontFamily: /[a-zA-Z]/.test(u) ? 'var(--mono, monospace)' : 'inherit' }}>
                  {u}
                </button>
              ))}
              <span style={{ flex: '0 0 auto', alignSelf: 'center', fontSize: 11, color: 'var(--text-sub)', paddingRight: 4, whiteSpace: 'nowrap' }}>T=큰술·t=작은술</span>
            </div>
          </div>
        </Portal>
      )}
      <div className="topbar-back">
        <button className="icon-btn press" onClick={() => nav.pop()} aria-label="닫기"><Icon name="x" size={24} /></button>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{editing ? '레시피 정리' : '직접 작성하기'}</div>
        <button className="press" onClick={save} disabled={!canSave} style={{ fontSize: 15, fontWeight: 700, color: canSave ? 'var(--brown)' : 'var(--sand)' }}>
          저장
        </button>
      </div>

      <input ref={photoRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }} />
      <input ref={ocrRef} type="file" accept="image/*" multiple onChange={onOcrFile} style={{ display: 'none' }} />

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
          {/* 캡처 원본 — 인식이 100%가 아니니 보면서 고친다. 적는 칸이 더 중요하므로
              높이를 줄여(34vh) 입력칸을 넉넉히 남기고, 사진이 길면 안에서 세로 스크롤한다. */}
          <div ref={photoBoxRef} onScroll={checkPhotoScroll} style={{ maxHeight: '34vh', overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
            {refs.map((img, k) => (
              <img
                key={k}
                src={img}
                alt={`캡처 ${k + 1}`}
                onClick={() => setZoom(k)}
                onLoad={checkPhotoScroll}
                style={{ display: 'block', width: '100%', height: 'auto', cursor: 'zoom-in' }}
              />
            ))}
          </div>
          {/* 더 스크롤할 게 있을 때만 하단 fade + 안내 — '잘림/고정' 오해 방지 */}
          {photoMore && (
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 64, pointerEvents: 'none', background: 'linear-gradient(to bottom, rgba(20,19,17,0), rgba(20,19,17,0.72))' }} />
          )}
          <button
            className="press"
            onClick={() => setZoom(0)}
            aria-label="캡처 크게 보기"
            style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', padding: '7px 16px', borderRadius: 999, background: 'rgba(20,19,17,0.78)', color: '#fff', fontSize: 12.5, fontWeight: 700 }}
          >
            🔍 크게 보기{refs.length > 1 ? ` · ${refs.length}장` : ''}
          </button>
          {photoMore && (
            <span style={{ position: 'absolute', bottom: 13, right: 12, color: 'rgba(255,255,255,0.92)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3, pointerEvents: 'none' }}>
              아래 더 있어요 <span style={{ fontSize: 14, lineHeight: 1 }}>↓</span>
            </span>
          )}
          <button
            className="press"
            onClick={() => setPin(null)}
            aria-label="캡처 사진 닫기"
            style={{ position: 'absolute', top: 8, right: 8, padding: '9px 16px', borderRadius: 999, background: '#ee7f4b', color: '#fff', fontSize: 14, fontWeight: 800, boxShadow: '0 3px 12px rgba(0,0,0,0.5)', border: '2px solid rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: 5 }}
          >
            ✕ 다 썼으면 사진 닫기
          </button>
        </div>
      )}

      <div className="pad" style={{ paddingBottom: 40 }}>
        {/* 썸네일 — 카드에 보이는 아이콘. 기본은 브랜드 아이콘(통일감), 원하면 글자·사진. */}
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
          {f.thumb === 'none' && (
            <div style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.55 }}>표지를 비웠어요. 아이콘 없이 <b>꾸미기</b>로 배경·스티커만 얹어 깔끔하게 만들 수 있어요 🎨</div>
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

        {/* 사진으로 채우기는 재료·만드는 법 각 칸 옆의 📷 버튼으로 — 썸네일 사진과 헷갈리지 않게 여기엔 두지 않는다 */}
        <div className="field">
          <label>제목</label>
          {/* autoFocus 금지 — 화면에 들어오자마자 키보드가 아래 내용을 다 가려버린다. */}
          <input value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="예) 명란 크림 파스타" />
        </div>

        {/* 캡처 한 장으로 재료+만드는 법 한 번에 — 사진 두 번 올리는 번거로움 없이(요청 반영).
            잘못 섞이면 아래 각 칸의 📷로 따로 채워 보정한다(안전망 유지). */}
        <button className="press" onClick={() => pickOcr('all')} disabled={ocr.busy}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '15px', marginBottom: 7, borderRadius: 'var(--r-md)', background: 'var(--brown)', color: '#fff', fontSize: 15, fontWeight: 800, boxShadow: 'var(--shadow-soft)', opacity: ocr.busy ? 0.5 : 1 }}>
          <Icon name="camera" size={18} color="#fff" /> 캡처 사진으로 재료·만드는 법 채우기
        </button>
        {/* 캡처 안내는 여기 한 곳에만 — 잘 보이게(흩어진 안내 통합) */}
        <div style={{ marginBottom: 14, padding: '13px 16px', borderRadius: 'var(--r-md)', background: 'var(--cream)', border: '1px solid var(--line)' }}>
          <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--brown)', marginBottom: 8 }}>캡처는 이렇게 채워요</div>
          {[
            ['긴 레시피는 ', '여러 장을 한꺼번에', ' 골라도 돼요.'],
            ['재료·순서가 섞이면 각 칸의 ', '사진에서 채우기', '로 그 칸만 다시 채워요.'],
            ['읽은 내용은 ', '초안', '이니 사진 보며 다듬어 주세요.'],
          ].map(([a, b, c], k) => (
            <div key={k} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text)', lineHeight: 1.5, marginTop: k ? 5 : 0 }}>
              <span style={{ flex: '0 0 auto', width: 5, height: 5, borderRadius: 9, background: 'var(--brown)', marginTop: 7 }} />
              <span>{a}<b style={{ color: 'var(--brown)', fontWeight: 700 }}>{b}</b>{c}</span>
            </div>
          ))}
        </div>

        {/* 사진 읽는 중 — 칸 채우기 진행 표시 */}
        {ocr.busy && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 'var(--r-md)', background: 'var(--cream)', color: 'var(--brown)', fontSize: 13.5, fontWeight: 700, marginBottom: 12 }}>
            <div className="ocr-spin" style={{ width: 18, height: 18, borderWidth: 2.5, margin: 0 }} />
            사진에서 글자 읽는 중… {ocr.pct}%
          </div>
        )}

        <div className="field">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ margin: 0 }}>재료 (한 줄에 하나씩)</label>
            <button className="press" onClick={() => pickOcr('ingredients')} disabled={ocr.busy} style={fieldOcrBtn}>
              <Icon name="camera" size={15} color="#fff" /> 사진에서 채우기
            </button>
          </div>
          <textarea ref={ingRef} rows={7} value={f.ingredients} onChange={(e) => set('ingredients', e.target.value)} style={{ scrollMarginTop: pin ? '38vh' : undefined }} placeholder={'재료를 한 줄에 하나씩 적어주세요.\n계량은 키보드 위 버튼으로.'} />
        </div>

        <div className="field">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ margin: 0 }}>만드는 법 (한 줄에 한 단계)</label>
            <button className="press" onClick={() => pickOcr('steps')} disabled={ocr.busy} style={fieldOcrBtn}>
              <Icon name="camera" size={15} color="#fff" /> 사진에서 채우기
            </button>
          </div>
          <textarea ref={stepRef} rows={7} value={f.steps} onChange={(e) => set('steps', e.target.value)} style={{ scrollMarginTop: pin ? '38vh' : undefined }} placeholder={'조리 순서를 한 줄에 하나씩 적어주세요'} />
        </div>

        {/* 부가 정보 — 캡처는 보통 제목+재료+만드는 법이 붙어 있어, 그걸 먼저 적고 나서 채우게 아래로 뺐다 */}
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
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" className="press" onClick={() => openExternal('https://www.instagram.com/')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 999, background: 'var(--cream)', color: 'var(--brown)', fontSize: 13, fontWeight: 700 }}>
              <Icon name="instagram" size={16} color="var(--brown)" /> 인스타 열기
            </button>
            <button type="button" className="press" onClick={() => openExternal('https://www.youtube.com/')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 999, background: 'var(--cream)', color: 'var(--brown)', fontSize: 13, fontWeight: 700 }}>
              <Icon name="youtube" size={16} color="var(--brown)" /> 유튜브 열기
            </button>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-sub)', marginTop: 6, lineHeight: 1.5 }}>
            새 탭으로 열려요 — 링크 복사 후 이 화면으로 돌아오면 쓰던 내용 그대로 있어요.
          </div>
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
          title={
            ocrTargetRef.current === 'ingredients' ? '재료 사진 자르기'
              : ocrTargetRef.current === 'steps' ? '만드는 법 사진 자르기'
                : '글자 부분만 남기기'
          }
          hint={
            ocrTargetRef.current === 'ingredients' ? (
              <>이 사진의 글자는 <b style={{ color: '#f0ede7' }}>재료 칸에만</b> 담겨요. 재료 부분만 남겨주세요.</>
            ) : ocrTargetRef.current === 'steps' ? (
              <>이 사진의 글자는 <b style={{ color: '#f0ede7' }}>만드는 법 칸에만</b> 담겨요. 순서 부분만 남겨주세요.</>
            ) : undefined
          }
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
