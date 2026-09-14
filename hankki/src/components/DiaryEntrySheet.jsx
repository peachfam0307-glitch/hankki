import { useState } from 'react'
import { useStore } from '../store'
import Icon from './Icon'
import CropSheet from './CropSheet'
import Portal from './Portal'
import { useModalBack } from '../useBackHandler'
// 🖼 사진이 「큰 창고」에 있으면 쪽지(`idb://…`)라 그냥 그리면 빈 칸이 된다 → `photoView.jsx` 한 곳을 지난다
import StoredImg from '../photoView'

// 사진을 캔버스로 축소해 저장 공간을 아낀다.
// ⭐ `export` 인 이유 = 요리 모드의 「완성 사진」(`CookScreen`)이 «같은 함수»를 쓴다.
//    ⛔ 복사해 두면 한쪽만 고쳐져 저장 용량이 갈린다(`Stars` 를 내보낸 것과 같은 이유).
export function downscale(dataUrl, max = 900) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      c.getContext('2d').drawImage(img, 0, 0, w, h)
      try { resolve(c.toDataURL('image/jpeg', 0.82)) } catch { resolve(dataUrl) }
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

export function Stars({ value, onChange, size = 30 }) {
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" className="press" onClick={() => onChange(n === value ? 0 : n)} aria-label={`${n}점`}>
          <Icon name="star" size={size} color={n <= value ? '#e0a83a' : 'var(--cream-deep)'} style={{ fill: n <= value ? '#e0a83a' : 'var(--cream-deep)' }} />
        </button>
      ))}
    </div>
  )
}

export default function DiaryEntrySheet({ entry, onClose, onDelete, onOpenRecipe }) {
  useModalBack(onClose) // 뒤로가기 → 닫기
  const { updateDiary } = useStore()
  const [rating, setRating] = useState(entry.rating || 0)
  const [note, setNote] = useState(entry.note || '')
  const [photo, setPhoto] = useState(entry.photo || null)
  const [cropSrc, setCropSrc] = useState(null) // 사진 자르기 단계

  const onPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCropSrc(reader.result) // 자르기부터
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const save = () => {
    updateDiary(entry.id, { rating, note: note.trim(), photo })
    onClose()
  }

  return (
   <Portal>
    <div className="sheet-mask" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 0 }}>
        <div className="emoji-sheet-head">
          <span>요리 기록 남기기</span>
          <button className="press" onClick={onClose} style={{ color: 'var(--text-sub)', fontSize: 16, fontWeight: 600 }}>닫기</button>
        </div>
        <div style={{ padding: '2px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 17.5, fontWeight: 700, flex: 1, minWidth: 0 }}>{entry.title}</div>
            {onOpenRecipe && (
              <button className="press" onClick={onOpenRecipe} style={{ flex: '0 0 auto', padding: '6px 11px', borderRadius: 999, background: 'var(--cream)', color: 'var(--brown)', fontSize: 15.5, fontWeight: 700 }}>
                레시피 보기 →
              </button>
            )}
          </div>
          <div className="t-sub" style={{ fontSize: 15, marginBottom: 12 }}>{new Date(entry.at).toLocaleDateString('ko-KR')} 요리</div>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0 16px' }}>
            <Stars value={rating} onChange={setRating} />
          </div>

          <label className="diary-photo press">
            {photo ? (
              <StoredImg src={photo} alt="" />
            ) : (
              <div className="diary-photo-empty">
                <Icon name="camera" size={24} color="var(--sand)" />
                <span>내가 만든 사진 추가</span>
              </div>
            )}
            <input type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }} />
          </label>

          <textarea
            className="diary-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="나만의 팁 · 다음엔 이렇게! (예: 면 1분 덜 삶기, 간 약하게)"
            rows={3}
          />
        </div>

        {/* 저장 버튼은 항상 보이게 시트 하단에 고정 */}
        <div style={{ position: 'sticky', bottom: 0, background: 'var(--surface)', display: 'flex', gap: 8, padding: '10px 16px calc(6px + var(--safe-bottom))', boxShadow: '0 -6px 14px rgba(0,0,0,0.05)' }}>
          {onDelete && (
            <button className="press" onClick={onDelete} style={{ padding: '13px 14px', borderRadius: 12, background: 'var(--cream)', color: 'var(--danger)', fontWeight: 600, fontSize: 16 }}>삭제</button>
          )}
          <button className="press" onClick={onClose} style={{ flex: 1, padding: 13, borderRadius: 12, background: 'var(--cream)', color: 'var(--text-sub)', fontWeight: 600, fontSize: 16 }}>나중에</button>
          <button className="press" onClick={save} style={{ flex: 1.4, padding: 13, borderRadius: 12, background: 'var(--brown)', color: '#fff', fontWeight: 700, fontSize: 16.5 }}>저장하기</button>
        </div>
      </div>

      {cropSrc && (
        // 🏷 `doneLabel` 창업자 확정 2026-08-21 = *"일기도 담기로 바꾸고"*
        //    사진은 «읽는» 게 아니라 «담는» 것이다 (요리 모드 완성 사진과 같은 말)
        //    ⛔ 주석을 <CropSheet …> «속성 자리»에 넣으면 빌드가 깨진다 — 자식 자리에서만 된다
        <CropSheet
          image={cropSrc}
          title="사진 자르기"
          hint={
            <>
              모서리를 끌어 <b style={{ color: '#f0ede7' }}>남기고 싶은 부분만</b> 담아주세요.
            </>
          }
          doneLabel="이 부분만 담기"
          onDone={async (img) => { setCropSrc(null); setPhoto(await downscale(img)) }}
          onSkip={async () => { const s = cropSrc; setCropSrc(null); setPhoto(await downscale(s)) }}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </div>
   </Portal>
  )
}
