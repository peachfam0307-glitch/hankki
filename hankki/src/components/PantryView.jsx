import { useRef, useState } from 'react'
import { useStore, newId } from '../store'
import { useNav } from '../App'
import { ocrImage } from '../ocr'
import { extractReceiptItems } from '../receipt'
import Icon from './Icon'
import Thumb from './Thumb'
import FoodIcon, { guessFoodIcon } from './FoodIcon'
import FoodIconPicker from './FoodIconPicker'
import CropSheet from './CropSheet'
import Portal from './Portal'

function toYMD(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysLeft(expiry) {
  if (!expiry) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(expiry + 'T00:00:00'); d.setHours(0, 0, 0, 0)
  return Math.round((d - today) / 86400000)
}

function expiryChip(n) {
  if (n === null) return null
  if (n < 0) return { text: `${-n}일 지남`, cls: 'exp-over' }
  if (n === 0) return { text: '오늘까지', cls: 'exp-soon' }
  if (n <= 3) return { text: `D-${n}`, cls: 'exp-soon' }
  if (n <= 7) return { text: `D-${n}`, cls: 'exp-mid' }
  return { text: `D-${n}`, cls: 'exp-ok' }
}

export default function PantryView() {
  const store = useStore()
  const { pantry, recipes } = store
  const nav = useNav()
  const [adding, setAdding] = useState(false)
  const [scanPct, setScanPct] = useState(null) // null | 0~100 — 영수증 읽는 중
  const [found, setFound] = useState(null) // null | [{name, on}] — 영수증에서 찾은 재료 확인
  const [receiptCrop, setReceiptCrop] = useState(null) // 자르기 단계(품목 부분만)
  const receiptRef = useRef(null)

  // 영수증 캡처/사진 → 품목 부분만 잘라 → 식재료만 골라 확인 후 냉장고에 담기
  const onReceipt = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setReceiptCrop(reader.result)
    reader.readAsDataURL(file)
  }

  const scanReceipt = async (img) => {
    setReceiptCrop(null)
    setScanPct(0)
    // noCrop: 영수증은 폰 캡처가 아니니 상태바 자르기(위·아래 5%)를 하지 않는다
    // receipt: 신뢰도 필터로 품목 줄을 버리지 않게 원문을 쓴다(파서가 노이즈를 거른다)
    const text = await ocrImage(img, (pct) => setScanPct(pct), { noCrop: true, receipt: true })
    setScanPct(null)
    const items = extractReceiptItems(text)
    if (!items.length) {
      nav.showToast('영수증에서 식재료를 찾지 못했어요 · 품목 부분만 잘라서 다시 해보세요')
      return
    }
    setFound(items.map((name) => ({ name, on: true })))
  }

  const saveFound = () => {
    const names = [...new Set((found || []).filter((f) => f.on).map((f) => f.name.trim()).filter(Boolean))]
    let added = 0
    names.forEach((nm) => {
      if (!pantry.some((p) => p.name === nm)) {
        store.addPantry({ id: newId(), name: nm, icon: guessFoodIcon(nm), expiry: null, addedAt: Date.now() })
        added++
      }
    })
    setFound(null)
    nav.showToast(added ? `재료 ${added}개를 냉장고에 넣었어요 🧊` : '이미 냉장고에 다 있어요')
  }

  const sorted = [...pantry].sort((a, b) => {
    const da = daysLeft(a.expiry)
    const db = daysLeft(b.expiry)
    if (da === null && db === null) return 0
    if (da === null) return 1
    if (db === null) return -1
    return da - db
  })

  // 냉장고 파먹기 — 보유 재료가 들어가는 레시피를 매칭 개수 순으로.
  const matches = recipes
    .map((r) => {
      const ings = (r.ingredients || []).join(' ')
      const n = pantry.filter((p) => p.name && ings.includes(p.name)).length
      return { r, n }
    })
    .filter((m) => m.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 4)

  return (
    <div className="fade">
      <div className="sec-head" style={{ marginTop: 6 }}>
        <div className="h-section">냉장고 재료함</div>
        <div style={{ display: 'flex', gap: 14 }}>
          <button className="t-more press" onClick={() => receiptRef.current?.click()}>🧾 영수증</button>
          <button className="t-more press" onClick={() => setAdding(true)}>+ 재료</button>
        </div>
      </div>

      <input ref={receiptRef} type="file" accept="image/*" onChange={onReceipt} style={{ display: 'none' }} />

      {receiptCrop && (
        <CropSheet
          image={receiptCrop}
          onDone={scanReceipt}
          onSkip={() => scanReceipt(receiptCrop)}
          onCancel={() => setReceiptCrop(null)}
        />
      )}

      {adding && <PantryAdd onClose={() => setAdding(false)} />}

      {scanPct !== null && (
        <div className="card" style={{ padding: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="ocr-spin" style={{ width: 26, height: 26, borderWidth: 3, margin: 0 }} />
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>영수증에서 식재료 찾는 중… {scanPct}%</div>
        </div>
      )}

      {found && (
       <Portal>
        <div className="sheet-mask" onClick={() => setFound(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 22 }}>
            <div className="emoji-sheet-head">
              <span>🧾 영수증에서 찾은 재료</span>
              <button className="press" onClick={() => setFound(null)} style={{ color: 'var(--text-sub)', fontSize: 14, fontWeight: 600 }}>닫기</button>
            </div>
            <div style={{ padding: '2px 16px 0', maxHeight: '48vh', overflowY: 'auto' }}>
              <div className="t-sub" style={{ fontSize: 12.5, marginBottom: 10 }}>
                아닌 것은 체크를 풀고, 이름은 눌러서 고칠 수 있어요.
              </div>
              {found.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <button
                    className="press"
                    onClick={() => setFound(found.map((x, j) => (j === i ? { ...x, on: !x.on } : x)))}
                    aria-label="선택"
                    style={{
                      width: 26, height: 26, borderRadius: 8, flex: '0 0 auto',
                      background: f.on ? 'var(--brown)' : 'var(--cream)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {f.on && <Icon name="check" size={15} color="#fff" stroke={2.6} />}
                  </button>
                  <div className="emoji-tile" style={{ width: 38, height: 38, flex: '0 0 auto' }}>
                    <FoodIcon name={guessFoodIcon(f.name)} size={24} />
                  </div>
                  <input
                    className="wa-inp"
                    style={{ flex: 1, opacity: f.on ? 1 : 0.45 }}
                    value={f.name}
                    onChange={(e) => setFound(found.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                  />
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 16px 0' }}>
              <button className="btn-primary press" style={{ width: '100%' }} onClick={saveFound} disabled={!found.some((f) => f.on)}>
                선택한 {found.filter((f) => f.on).length}개 냉장고에 담기
              </button>
            </div>
          </div>
        </div>
       </Portal>
      )}

      {pantry.length === 0 && !adding && (
        <div className="empty" style={{ padding: '30px 24px' }}>
          {'집에 있는 재료를 넣어두세요.\n유통기한도 챙겨주고, 그 재료로 만들 요리도 추천해줘요.'}
        </div>
      )}

      {sorted.map((p) => {
        const chip = expiryChip(daysLeft(p.expiry))
        return (
          <div key={p.id} className="wish-row">
            <div className="emoji-tile" style={{ width: 46, height: 46, flex: '0 0 auto' }}>
              <FoodIcon name={p.icon || guessFoodIcon(p.name)} size={28} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
              {p.expiry && <div className="t-sub" style={{ marginTop: 2 }}>유통기한 {p.expiry.replace(/-/g, '.')}</div>}
            </div>
            {chip && <span className={`exp-chip ${chip.cls}`}>{chip.text}</span>}
            <button className="icon-btn press" onClick={() => store.removePantry(p.id)} aria-label="삭제">
              <Icon name="x" size={17} color="var(--sand)" />
            </button>
          </div>
        )
      })}

      {matches.length > 0 && (
        <>
          <div className="sec-head"><div className="h-section">냉장고 파먹기 🍳</div></div>
          <div className="t-sub" style={{ fontSize: 12.5, marginTop: -2, marginBottom: 12 }}>지금 가진 재료로 만들 수 있어요.</div>
          <div className="grid2">
            {matches.map(({ r, n }) => (
              <button key={r.id} className="grid-card press" style={{ textAlign: 'left' }} onClick={() => nav.push({ name: 'detail', id: r.id })}>
                <Thumb recipe={r} ratio="1/1" radius={16} />
                <div className="name">{r.title}</div>
                <div className="date">가진 재료 {n}개</div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* 내 레시피·기본 레시피에서 마땅한 게 없을 때 — 한끼가 추천 */}
      {pantry.length > 0 && matches.length === 0 && (
        <>
          <div className="sec-head"><div className="h-section">한끼 추천 ✨</div></div>
          <div className="t-sub" style={{ fontSize: 12.5, marginTop: -2, marginBottom: 12 }}>
            가진 재료로 딱 맞는 레시피가 없네요. 실패 없는 기본 메뉴는 어때요?
          </div>
          <div className="grid2">
            {recipes
              .filter((r) => String(r.id).startsWith('basic-'))
              .slice(0, 4)
              .map((r) => (
                <button key={r.id} className="grid-card press" style={{ textAlign: 'left' }} onClick={() => nav.push({ name: 'detail', id: r.id })}>
                  <Thumb recipe={r} ratio="1/1" radius={16} />
                  <div className="name">{r.title}</div>
                  <div className="date">기본 제공</div>
                </button>
              ))}
          </div>
        </>
      )}
    </div>
  )
}

function PantryAdd({ onClose }) {
  const { addPantry } = useStore()
  const nav = useNav()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('default')
  const [iconPicked, setIconPicked] = useState(false)
  const [expiry, setExpiry] = useState('')

  const setNm = (v) => { setName(v); if (!iconPicked) setIcon(guessFoodIcon(v)) }
  const quick = (days) => { const d = new Date(); d.setDate(d.getDate() + days); setExpiry(toYMD(d)) }

  const save = () => {
    const nm = name.trim()
    if (!nm) return
    addPantry({ id: newId(), name: nm, icon: iconPicked ? icon : guessFoodIcon(nm), expiry: expiry || null, addedAt: Date.now() })
    nav.showToast('냉장고에 넣었어요 🧊')
    onClose()
  }

  return (
    <div className="card" style={{ padding: 14, marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
        <FoodIconPicker value={icon} size={64} onChange={(k) => { setIcon(k); setIconPicked(true) }} />
        <div style={{ flex: 1 }}>
          <input className="wa-inp" value={name} onChange={(e) => setNm(e.target.value)} placeholder="재료 이름 (예: 두부)" autoFocus />
          <input className="wa-inp" style={{ marginTop: 8, color: expiry ? 'var(--text)' : 'var(--text-sub)' }} type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[['+3일', 3], ['+7일', 7], ['+2주', 14]].map(([label, d]) => (
          <button key={label} className="chip-quick press" onClick={() => quick(d)}>{label}</button>
        ))}
        <button className="chip-quick press" onClick={() => setExpiry('')}>없음</button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="press" onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 12, background: 'var(--cream)', color: 'var(--text-sub)', fontWeight: 600, fontSize: 14 }}>취소</button>
        <button className="press" onClick={save} style={{ flex: 1, padding: 11, borderRadius: 12, background: 'var(--brown)', color: '#fff', fontWeight: 600, fontSize: 14 }}>넣기</button>
      </div>
    </div>
  )
}
