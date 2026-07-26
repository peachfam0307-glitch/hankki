import { useRef, useState } from 'react'
import { useStore, newId } from '../store'
import { useNav } from '../App'
import { ocrImage } from '../ocr'
import { extractReceiptItems } from '../receipt'
import Icon from './Icon'
import Thumb from './Thumb'
import FoodIcon, { guessFoodIcon } from './FoodIcon'
import FoodIconPicker from './FoodIconPicker'
import EmojiPicker from './EmojiPicker'
import CropSheet from './CropSheet'
import Portal from './Portal'
import { useLayerBack } from '../useBackHandler'
import { guessEmoji } from '../emoji'

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
  const [form, setForm] = useState(null) // null | {} (새로 담기) | item (편집)
  const [scanPct, setScanPct] = useState(null) // null | 0~100 — 영수증 읽는 중
  const [found, setFound] = useState(null) // null | [{name, on}] — 영수증에서 찾은 재료 확인
  const [receiptCrop, setReceiptCrop] = useState(null) // 자르기 단계(품목 부분만)
  // 열린 팝업(영수증 확인·담기 폼) — 뒤로가기로 닫기(크롭은 자체 처리)
  useLayerBack(!!found, () => setFound(null))
  useLayerBack(!!form, () => setForm(null))
  const receiptRef = useRef(null) // 앨범·캡처(저장된 사진)
  const receiptCamRef = useRef(null) // 바로 촬영(카메라)

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
      </div>
      {/* 영수증 스캔 — 베타. 영수증마다 인식이 달라 기대치를 낮춰두고(라벨) 안내한다. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
        <span style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--text)' }}>영수증 스캔</span>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: '#fff', background: '#c79553', borderRadius: 999, padding: '3px 11px', letterSpacing: '0.02em' }}>베타</span>
      </div>
      <div style={{ fontSize: 12.8, color: 'var(--text-sub)', lineHeight: 1.55, marginBottom: 11 }}>
        영수증에 따라 인식률이 다를 수 있어요. 안 되면 아래 <b style={{ color: 'var(--brown)' }}>＋재료</b>로 직접 담아도 돼요.
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button
          className="press"
          onClick={() => receiptCamRef.current?.click()}
          style={{
            flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '13px 14px', borderRadius: 'var(--r-md)',
            background: 'var(--brown)', color: '#fff', fontSize: 15, fontWeight: 700,
            boxShadow: '0 3px 10px rgba(90,70,45,0.18)',
          }}
        >
          <span style={{ fontSize: 18 }}>📷</span> 영수증 촬영
        </button>
        <button
          className="press"
          onClick={() => setForm({})}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            padding: '13px 16px', borderRadius: 'var(--r-md)',
            background: 'var(--cream)', color: 'var(--brown)', fontSize: 14.5, fontWeight: 700,
          }}
        >
          <Icon name="plus" size={17} color="var(--brown)" stroke={2.4} /> 재료
        </button>
      </div>
      <button
        className="press"
        onClick={() => receiptRef.current?.click()}
        style={{ display: 'block', margin: '0 auto 14px', padding: '4px 8px', color: 'var(--text-sub)', fontSize: 12.5, fontWeight: 600 }}
      >
        🖼 저장된 영수증·주문내역 사진에서
      </button>

      <input ref={receiptCamRef} type="file" accept="image/*" capture="environment" onChange={onReceipt} style={{ display: 'none' }} />
      <input ref={receiptRef} type="file" accept="image/*" onChange={onReceipt} style={{ display: 'none' }} />

      {receiptCrop && (
        <CropSheet
          image={receiptCrop}
          title="영수증에서 품목만 남기기"
          hint={
            <>
              위·아래 매장 정보·합계는 빼고 <b style={{ color: '#f0ede7' }}>상품명·가격이 적힌 부분만</b> 남겨주세요.
              <br />
              <span style={{ color: '#8f8b83', fontSize: 11.5 }}>딱 맞게 자를수록 · 반듯하고 밝을수록 정확해요 ✨</span>
            </>
          }
          onDone={scanReceipt}
          onSkip={() => scanReceipt(receiptCrop)}
          onCancel={() => setReceiptCrop(null)}
        />
      )}

      {form && <PantryForm item={form} onClose={() => setForm(null)} />}

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

      {pantry.length === 0 && !form && (
        <div className="empty" style={{ padding: '30px 24px' }}>
          {'집에 있는 재료를 넣어두세요.\n유통기한도 챙겨주고, 그 재료로 만들 요리도 추천해줘요.'}
        </div>
      )}

      {sorted.map((p) => {
        const chip = expiryChip(daysLeft(p.expiry))
        const sub = [p.expiry ? `유통기한 ${p.expiry.replace(/-/g, '.')}` : '', p.memo].filter(Boolean).join(' · ')
        return (
          <div key={p.id} className="wish-row">
            {/* 재료를 탭하면 편집(수량·유통기한·이모지·메모) */}
            <button className="press" onClick={() => setForm(p)} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div className="emoji-tile" style={{ width: 46, height: 46, flex: '0 0 auto', fontSize: 26 }}>
                {p.thumb === 'emoji' && p.emoji ? p.emoji : <FoodIcon name={p.icon || guessFoodIcon(p.name)} size={28} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name}{p.qty ? <span style={{ color: 'var(--text-sub)', fontWeight: 500 }}> · {p.qty}</span> : null}
                </div>
                {sub && <div className="t-sub" style={{ marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>}
              </div>
            </button>
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

// 냉장고 재료 담기·편집 — 아이콘/이모지(식재료만) · 이름 · 수량 · 유통기한 · 메모.
// item 에 id 가 있으면 편집, 없으면 새로 담기.
const FOOD_EMOJI_GROUPS = ['밥·면', '고기·해산물', '채소', '유제품·빵', '양념', '과일', '음료', '디저트']

function PantryForm({ item, onClose }) {
  const { addPantry, updatePantry, removePantry } = useStore()
  const nav = useNav()
  const editing = !!item.id
  const [name, setName] = useState(item.name || '')
  const [thumb, setThumb] = useState(item.thumb || 'icon') // 'icon' | 'emoji'
  const [icon, setIcon] = useState(item.icon || 'default')
  const [emoji, setEmoji] = useState(item.emoji || '🥬')
  const [iconPicked, setIconPicked] = useState(!!item.icon)
  const [qty, setQty] = useState(item.qty || '')
  const [expiry, setExpiry] = useState(item.expiry || '')
  const [memo, setMemo] = useState(item.memo || '')

  const setNm = (v) => {
    setName(v)
    if (!iconPicked) { setIcon(guessFoodIcon(v)); setEmoji(guessEmoji(v)) }
  }
  const quick = (days) => { const d = new Date(); d.setDate(d.getDate() + days); setExpiry(toYMD(d)) }

  const save = () => {
    const nm = name.trim()
    if (!nm) return
    const data = {
      name: nm,
      thumb,
      icon: iconPicked ? icon : guessFoodIcon(nm),
      emoji: thumb === 'emoji' ? emoji : (item.emoji || null),
      qty: qty.trim(),
      expiry: expiry || null,
      memo: memo.trim(),
    }
    if (editing) { updatePantry(item.id, data); nav.showToast('재료를 수정했어요 ✨') }
    else { addPantry({ id: newId(), addedAt: Date.now(), ...data }); nav.showToast('냉장고에 넣었어요 🧊') }
    onClose()
  }

  return (
   <Portal>
    <div className="sheet-mask" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 0 }}>
        <div className="emoji-sheet-head">
          <span>{editing ? '재료 편집' : '재료 담기'}</span>
          <button className="press" onClick={onClose} style={{ color: 'var(--text-sub)', fontSize: 14, fontWeight: 600 }}>닫기</button>
        </div>
        <div style={{ padding: '2px 16px 0' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
            {thumb === 'emoji' ? (
              <EmojiPicker value={emoji} size={64} only={FOOD_EMOJI_GROUPS} onChange={(e) => { setEmoji(e); setIconPicked(true) }} />
            ) : (
              <FoodIconPicker value={icon} size={64} onChange={(k) => { setIcon(k); setIconPicked(true) }} />
            )}
            <div style={{ flex: 1 }}>
              <input className="wa-inp" value={name} onChange={(e) => setNm(e.target.value)} placeholder="재료 이름 (예: 두부)" autoFocus={!editing} />
              <input className="wa-inp" style={{ marginTop: 8 }} value={qty} onChange={(e) => setQty(e.target.value)} placeholder="수량 (예: 2팩, 500g) · 선택" />
            </div>
          </div>

          {/* 썸네일 방식 — 아이콘(재료 그림) / 이모지(식재료만) */}
          <div className="segment" style={{ margin: '0 0 10px' }}>
            <button type="button" className={`seg ${thumb === 'icon' ? 'on' : ''}`} style={{ flex: 1, padding: 8, fontSize: 12.5 }} onClick={() => setThumb('icon')}>아이콘</button>
            <button type="button" className={`seg ${thumb === 'emoji' ? 'on' : ''}`} style={{ flex: 1, padding: 8, fontSize: 12.5 }} onClick={() => setThumb('emoji')}>이모지</button>
          </div>

          <div className="t-sub" style={{ fontSize: 12, marginBottom: 6 }}>유통기한</div>
          <input className="wa-inp" style={{ color: expiry ? 'var(--text)' : 'var(--text-sub)' }} type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          <div style={{ display: 'flex', gap: 6, margin: '8px 0 10px' }}>
            {[['+3일', 3], ['+7일', 7], ['+2주', 14]].map(([label, d]) => (
              <button key={label} className="chip-quick press" onClick={() => quick(d)}>{label}</button>
            ))}
            <button className="chip-quick press" onClick={() => setExpiry('')}>없음</button>
          </div>

          <input className="wa-inp" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="메모 (예: 냉동실 · 개봉함) · 선택" />
        </div>
        <div style={{ position: 'sticky', bottom: 0, background: 'var(--surface)', display: 'flex', gap: 8, padding: '10px 16px calc(6px + var(--safe-bottom))' }}>
          {editing && (
            <button className="press" onClick={() => { removePantry(item.id); nav.showToast('냉장고에서 뺐어요'); onClose() }} style={{ padding: '13px 15px', borderRadius: 12, background: 'var(--cream)', color: 'var(--danger)', fontWeight: 600, fontSize: 14 }}>삭제</button>
          )}
          <button className="press" onClick={onClose} style={{ flex: 1, padding: 13, borderRadius: 12, background: 'var(--cream)', color: 'var(--text-sub)', fontWeight: 600, fontSize: 14 }}>취소</button>
          <button className="press" onClick={save} style={{ flex: 1.4, padding: 13, borderRadius: 12, background: 'var(--brown)', color: '#fff', fontWeight: 700, fontSize: 14.5 }}>{editing ? '저장' : '넣기'}</button>
        </div>
      </div>
    </div>
   </Portal>
  )
}
