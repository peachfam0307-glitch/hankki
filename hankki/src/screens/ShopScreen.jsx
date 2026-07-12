import { useRef, useState } from 'react'
import { useStore, newId } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import Thumb from '../components/Thumb'
import { ocrImage } from '../ocr'

// 외부 쇼핑몰 열기 — 설치된 앱에서도 브라우저(로그인 세션 유지)로 열린다.
function openUrl(url) {
  if (!url) return
  const u = /^https?:\/\//.test(url) ? url : 'https://' + url
  window.open(u, '_blank', 'noopener,noreferrer')
}
function shopSearchUrl(shop, q) {
  if (q && shop.search) return shop.search.replace('{q}', encodeURIComponent(q))
  return shop.url
}

export default function ShopScreen() {
  const store = useStore()
  const { shops, wishlist, shoppingList } = store
  const nav = useNav()
  const [editShops, setEditShops] = useState(false)
  const [adding, setAdding] = useState(false)

  const doneCount = shoppingList.filter((i) => i.done).length

  return (
    <>
      <div className="topbar">
        <div className="h-title">장보기</div>
      </div>

      <div className="pad">
        {/* 1) 쇼핑몰 바로가기 */}
        <div className="sec-head" style={{ marginTop: 6 }}>
          <div className="h-section">쇼핑몰 바로가기</div>
          <button className="t-more press" onClick={() => setEditShops((v) => !v)}>
            {editShops ? '완료' : '편집'}
          </button>
        </div>
        <div className="hscroll" style={{ paddingBottom: 4 }}>
          {shops.map((s) => (
            <div key={s.id} style={{ position: 'relative' }}>
              <button
                className="shop-chip press"
                onClick={() => (editShops ? null : openUrl(s.url))}
              >
                <span style={{ fontSize: '1.6rem' }}>{s.emoji || '🛍️'}</span>
                <span className="nm">{s.name}</span>
              </button>
              {editShops && (
                <button
                  className="chip-del press"
                  onClick={() => store.removeShop(s.id)}
                  aria-label="삭제"
                >
                  <Icon name="x" size={13} color="#fff" stroke={2.6} />
                </button>
              )}
            </div>
          ))}
          <button
            className="shop-chip press"
            style={{ borderStyle: 'dashed', color: 'var(--text-sub)' }}
            onClick={() => {
              const name = window.prompt('쇼핑몰 이름 (예: 컬리, 알리)')
              if (!name || !name.trim()) return
              const url = window.prompt('주소 (예: https://www.kurly.com)')
              if (!url || !url.trim()) return
              store.addShop({ id: newId(), name: name.trim(), url: url.trim(), emoji: '🛍️' })
            }}
          >
            <Icon name="plus" size={22} color="var(--text-sub)" />
            <span className="nm">추가</span>
          </button>
        </div>
        <div className="t-sub" style={{ fontSize: 12, marginTop: 6 }}>
          한 번 로그인해두면 그 브라우저 세션이 유지돼 다시 로그인하지 않아도 돼요.
        </div>

        {/* 2) 사고 싶은 재료 */}
        <div className="sec-head">
          <div className="h-section">사고 싶은 재료</div>
          <button className="t-more press" onClick={() => setAdding(true)}>
            + 담기
          </button>
        </div>
        {adding && <WishAdd onClose={() => setAdding(false)} />}
        {wishlist.length === 0 && !adding && (
          <div className="empty" style={{ padding: '28px 24px' }}>
            {'사고 싶은 재료를 모아두세요.\n(간장·고추장처럼 어디서 본 재료를 캡처·링크로)'}
          </div>
        )}
        {wishlist.map((w) => (
          <div key={w.id} className="wish-row">
            <button className="check-box press" data-on={w.bought} onClick={() => store.toggleWishBought(w.id)}>
              {w.bought && <Icon name="check" size={15} color="#fff" stroke={2.4} />}
            </button>
            {(w.image || w.emoji) && (
              <Thumb recipe={{ image: w.image, emoji: w.emoji || '🧺', title: w.name }} style={{ width: 46, height: 46, flex: '0 0 auto' }} radius={10} emojiSize="1.3rem" />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, textDecoration: w.bought ? 'line-through' : 'none', color: w.bought ? 'var(--text-sub)' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {w.name}
              </div>
              {w.memo && <div className="t-sub" style={{ marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.memo}</div>}
            </div>
            <button className="press mini-buy" onClick={() => (w.url ? openUrl(w.url) : openUrl(shopSearchUrl(shops[0] || { url: '' }, w.name)))}>
              사러가기
            </button>
            <button className="icon-btn press" onClick={() => store.removeWish(w.id)} aria-label="삭제">
              <Icon name="x" size={17} color="var(--sand)" />
            </button>
          </div>
        ))}

        {/* 3) 장보기 리스트 */}
        <div className="sec-head">
          <div className="h-section">장보기 리스트</div>
          {doneCount > 0 && (
            <button className="t-more press" onClick={() => store.clearDoneShopItems()}>
              완료 지우기
            </button>
          )}
        </div>
        <ChecklistAdd />
        {shoppingList.length === 0 ? (
          <div className="empty" style={{ padding: '24px' }}>{'필요한 재료를 담아보세요.\n레시피 상세에서 “재료 담기”로도 담을 수 있어요.'}</div>
        ) : (
          shoppingList.map((it) => (
            <div key={it.id} className="shop-row">
              <button className="check-box press" data-on={it.done} onClick={() => store.toggleShopItem(it.id)}>
                {it.done && <Icon name="check" size={15} color="#fff" stroke={2.4} />}
              </button>
              <span style={{ flex: 1, fontSize: 15, textDecoration: it.done ? 'line-through' : 'none', color: it.done ? 'var(--text-sub)' : 'var(--text)' }}>
                {it.name}
              </span>
              <button className="press mini-buy" onClick={() => openUrl(shopSearchUrl(shops[0] || { url: '' }, it.name))}>
                검색
              </button>
              <button className="icon-btn press" onClick={() => store.removeShopItem(it.id)} aria-label="삭제">
                <Icon name="x" size={17} color="var(--sand)" />
              </button>
            </div>
          ))
        )}
      </div>
    </>
  )
}

function ChecklistAdd() {
  const { addShopItems } = useStore()
  const [text, setText] = useState('')
  const add = () => {
    if (!text.trim()) return
    addShopItems([text])
    setText('')
  }
  return (
    <div className="searchbar" style={{ marginBottom: 12 }}>
      <Icon name="cart" size={19} color="var(--text-sub)" />
      <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="살 재료 입력하고 Enter" />
      {text && (
        <button className="press" onClick={add} aria-label="추가"><Icon name="plus" size={20} color="var(--brown)" /></button>
      )}
    </div>
  )
}

function WishAdd({ onClose }) {
  const { addWish } = useStore()
  const nav = useNav()
  const fileRef = useRef(null)
  const [f, setF] = useState({ name: '', url: '', memo: '', image: null })
  const [busy, setBusy] = useState(false)

  const onPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      setF((p) => ({ ...p, image: reader.result }))
      // 사진 속 글자에서 이름 자동 추출
      setBusy(true)
      const text = await ocrImage(reader.result)
      setBusy(false)
      const line = (text || '').split('\n').map((s) => s.trim()).find(Boolean)
      if (line) setF((p) => ({ ...p, name: p.name || line.slice(0, 24), memo: p.memo || (text || '').trim().slice(0, 200) }))
    }
    reader.readAsDataURL(file)
  }

  const save = () => {
    const name = f.name.trim() || '이름 없는 재료'
    addWish({ id: newId(), name, url: f.url.trim(), memo: f.memo.trim(), image: f.image, emoji: '🧺', bought: false, savedAt: Date.now() })
    nav.showToast('사고 싶은 재료에 담았어요')
    onClose()
  }

  return (
    <div className="card" style={{ padding: 14, marginBottom: 12 }}>
      <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }} />
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <button className="press" onClick={() => fileRef.current?.click()} style={{ width: 64, height: 64, borderRadius: 12, flex: '0 0 auto', overflow: 'hidden', position: 'relative', background: 'var(--cream)' }}>
          {f.image ? (
            <img src={f.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
              <Icon name="camera" size={20} color="var(--brown)" />
              <span style={{ fontSize: 10, color: 'var(--brown)' }}>캡처</span>
            </div>
          )}
        </button>
        <div style={{ flex: 1 }}>
          <input className="wa-inp" value={f.name} onChange={(e) => setF((p) => ({ ...p, name: e.target.value }))} placeholder={busy ? '사진에서 이름 읽는 중…' : '재료 이름 (예: 진간장)'} autoFocus />
          <input className="wa-inp" style={{ marginTop: 8 }} value={f.url} onChange={(e) => setF((p) => ({ ...p, url: e.target.value }))} placeholder="링크 (선택)" inputMode="url" />
        </div>
      </div>
      <input className="wa-inp" value={f.memo} onChange={(e) => setF((p) => ({ ...p, memo: e.target.value }))} placeholder="메모 (선택)" />
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button className="press" onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 12, background: 'var(--cream)', color: 'var(--text-sub)', fontWeight: 600, fontSize: 14 }}>취소</button>
        <button className="press" onClick={save} style={{ flex: 1, padding: 11, borderRadius: 12, background: 'var(--brown)', color: '#fff', fontWeight: 600, fontSize: 14 }}>담기</button>
      </div>
    </div>
  )
}
