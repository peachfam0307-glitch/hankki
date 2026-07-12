import { useRef, useState } from 'react'
import { useStore, newId } from '../store'
import { useNav } from '../App'
import Icon from '../components/Icon'
import TextTile from '../components/TextTile'
import EmojiPicker from '../components/EmojiPicker'
import FoodIcon, { guessFoodIcon } from '../components/FoodIcon'
import FoodIconPicker from '../components/FoodIconPicker'
import PantryView from '../components/PantryView'
import TabTips from '../components/TabTips'
import { ocrImage } from '../ocr'
import { guessEmoji } from '../emoji'

// 재료 썸네일 — 사진 > 커스텀아이콘 > 이모지 > 글자 타일 순으로 표시
function WishThumb({ item, size = 46 }) {
  if (item.thumb === 'photo' && item.image) {
    return <img src={item.image} alt="" style={{ width: size, height: size, borderRadius: 12, objectFit: 'cover', flex: '0 0 auto' }} />
  }
  if (item.thumb === 'emoji' && item.emoji) {
    return <div className="emoji-tile" style={{ width: size, height: size, fontSize: size * 0.5 }}>{item.emoji}</div>
  }
  if (item.thumb === 'label') {
    return <TextTile text={item.name} size={size} />
  }
  // 기본: 이름으로 자동 매칭되는 커스텀 아이콘
  return (
    <div className="emoji-tile" style={{ width: size, height: size, flex: '0 0 auto' }}>
      <FoodIcon name={item.icon || guessFoodIcon(item.name)} size={size * 0.62} />
    </div>
  )
}

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
  const [shopForm, setShopForm] = useState(null) // null | {} (new) | shop (edit)
  const [adding, setAdding] = useState(false)
  const [view, setView] = useState('shop') // 'pantry' | 'shop'

  const doneCount = shoppingList.filter((i) => i.done).length

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div className="h-title">장보기</div>
          <TabTips tab="shop" />
        </div>
      </div>

      <div className="pad">
        <div className="segment" style={{ marginTop: 4 }}>
          <button type="button" className={`seg ${view === 'pantry' ? 'on' : ''}`} onClick={() => setView('pantry')}>🧊 냉장고</button>
          <button type="button" className={`seg ${view === 'shop' ? 'on' : ''}`} onClick={() => setView('shop')}>🛒 장보기</button>
        </div>

        {view === 'pantry' && <PantryView />}

        {view === 'shop' && (
        <>
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
                onClick={() => (editShops ? setShopForm(s) : openUrl(s.url))}
              >
                {s.iconType === 'label' ? (
                  <TextTile text={s.name} size={54} radius={14} />
                ) : s.iconType === 'icon' ? (
                  <>
                    <div className="emoji-tile" style={{ width: 54, height: 54 }}>
                      <FoodIcon name={s.icon || 'bag'} size={34} />
                    </div>
                    <span className="nm">{s.name}</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '1.7rem' }}>{s.emoji || '🛍️'}</span>
                    <span className="nm">{s.name}</span>
                  </>
                )}
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
            onClick={() => setShopForm({})}
          >
            <Icon name="plus" size={22} color="var(--text-sub)" />
            <span className="nm">추가</span>
          </button>
        </div>
        <div className="t-sub" style={{ fontSize: 12, marginTop: 6 }}>
          {editShops ? '아이콘을 눌러 이름·주소·아이콘을 바꿀 수 있어요.' : '한 번 로그인해두면 그 브라우저 세션이 유지돼 다시 로그인하지 않아도 돼요.'}
        </div>
        {shopForm && <ShopEdit shop={shopForm} onClose={() => setShopForm(null)} />}

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
            <WishThumb item={w} size={46} />
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
              <button className="check-box press" data-on={it.done} onClick={() => { const was = it.done; store.toggleShopItem(it.id); if (!was) nav.showToast('샀어요! 냉장고에 넣어뒀어요 🧊') }}>
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
        </>
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
  // thumb: 'icon'(커스텀 아이콘) | 'label'(글자) | 'emoji' | 'photo'
  const [f, setF] = useState({ name: '', url: '', memo: '', image: null, emoji: '🍽️', icon: 'default', thumb: 'icon', emojiPicked: false, iconPicked: false })
  const [busy, setBusy] = useState(false)

  const setName = (name) =>
    setF((p) => ({
      ...p,
      name,
      emoji: p.emojiPicked ? p.emoji : guessEmoji(name),
      icon: p.iconPicked ? p.icon : guessFoodIcon(name),
    }))

  const onPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      setF((p) => ({ ...p, image: reader.result, thumb: 'photo' }))
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
    addWish({
      id: newId(),
      name,
      url: f.url.trim(),
      memo: f.memo.trim(),
      thumb: f.thumb,
      image: f.thumb === 'photo' ? f.image : null,
      emoji: f.thumb === 'emoji' ? f.emoji : null,
      icon: f.thumb === 'icon' ? (f.iconPicked ? f.icon : guessFoodIcon(name)) : null,
      bought: false,
      savedAt: Date.now(),
    })
    nav.showToast('사고 싶은 재료에 담았어요')
    onClose()
  }

  const Mode = ({ id, label }) => (
    <button
      type="button"
      className={`seg ${f.thumb === id ? 'on' : ''}`}
      style={{ flex: 1, padding: 8, fontSize: 12.5 }}
      onClick={() => (id === 'photo' ? fileRef.current?.click() : setF((p) => ({ ...p, thumb: id })))}
    >
      {label}
    </button>
  )

  return (
    <div className="card" style={{ padding: 14, marginBottom: 12 }}>
      <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }} />
      <div style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
        {/* 썸네일 미리보기 */}
        {f.thumb === 'icon' ? (
          <FoodIconPicker value={f.icon} size={64} onChange={(k) => setF((p) => ({ ...p, icon: k, iconPicked: true }))} />
        ) : f.thumb === 'emoji' ? (
          <EmojiPicker value={f.emoji} size={64} onChange={(e) => setF((p) => ({ ...p, emoji: e, emojiPicked: true }))} />
        ) : f.thumb === 'photo' && f.image ? (
          <button className="press" onClick={() => fileRef.current?.click()} style={{ width: 64, height: 64, borderRadius: 14, overflow: 'hidden', flex: '0 0 auto' }}>
            <img src={f.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </button>
        ) : (
          <TextTile text={f.name} size={64} radius={14} />
        )}
        <div style={{ flex: 1 }}>
          <input className="wa-inp" value={f.name} onChange={(e) => setName(e.target.value)} placeholder={busy ? '사진에서 이름 읽는 중…' : '재료 이름 (예: 고추장)'} autoFocus />
          <input className="wa-inp" style={{ marginTop: 8 }} value={f.url} onChange={(e) => setF((p) => ({ ...p, url: e.target.value }))} placeholder="링크 (선택)" inputMode="url" />
        </div>
      </div>

      {/* 썸네일 방식 선택 */}
      <div className="segment" style={{ margin: '0 0 10px' }}>
        <Mode id="icon" label="아이콘" />
        <Mode id="label" label="글자" />
        <Mode id="emoji" label="이모지" />
        <Mode id="photo" label="사진" />
      </div>

      <input className="wa-inp" value={f.memo} onChange={(e) => setF((p) => ({ ...p, memo: e.target.value }))} placeholder="메모 (선택)" />
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button className="press" onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 12, background: 'var(--cream)', color: 'var(--text-sub)', fontWeight: 600, fontSize: 14 }}>취소</button>
        <button className="press" onClick={save} style={{ flex: 1, padding: 11, borderRadius: 12, background: 'var(--brown)', color: '#fff', fontWeight: 600, fontSize: 14 }}>담기</button>
      </div>
    </div>
  )
}

function ShopEdit({ shop, onClose }) {
  const store = useStore()
  const isNew = !shop.id
  const [f, setF] = useState({
    name: shop.name || '',
    url: shop.url || '',
    emoji: shop.emoji || '🛍️',
    icon: shop.icon || 'bag',
    iconType: shop.iconType || 'emoji',
  })

  const save = () => {
    if (!f.name.trim() || !f.url.trim()) return
    const data = { name: f.name.trim(), url: f.url.trim(), emoji: f.emoji, icon: f.icon, iconType: f.iconType }
    if (isNew) store.addShop({ id: newId(), search: '', ...data })
    else store.updateShop(shop.id, data)
    onClose()
  }

  return (
    <div className="card" style={{ padding: 14, marginTop: 4, marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
        {f.iconType === 'label' ? (
          <TextTile text={f.name || '쇼핑몰'} size={64} radius={14} />
        ) : f.iconType === 'icon' ? (
          <FoodIconPicker value={f.icon} size={64} onChange={(k) => setF((p) => ({ ...p, icon: k }))} />
        ) : (
          <EmojiPicker value={f.emoji} size={64} onChange={(e) => setF((p) => ({ ...p, emoji: e }))} />
        )}
        <div style={{ flex: 1 }}>
          <input className="wa-inp" value={f.name} onChange={(e) => setF((p) => ({ ...p, name: e.target.value }))} placeholder="쇼핑몰 이름 (예: 마켓컬리)" autoFocus />
          <input className="wa-inp" style={{ marginTop: 8 }} value={f.url} onChange={(e) => setF((p) => ({ ...p, url: e.target.value }))} placeholder="주소 (예: https://www.kurly.com)" inputMode="url" />
        </div>
      </div>
      <div className="segment" style={{ margin: '0 0 10px' }}>
        <button type="button" className={`seg ${f.iconType === 'icon' ? 'on' : ''}`} style={{ flex: 1, padding: 8, fontSize: 12.5 }} onClick={() => setF((p) => ({ ...p, iconType: 'icon' }))}>아이콘</button>
        <button type="button" className={`seg ${f.iconType === 'emoji' ? 'on' : ''}`} style={{ flex: 1, padding: 8, fontSize: 12.5 }} onClick={() => setF((p) => ({ ...p, iconType: 'emoji' }))}>이모지</button>
        <button type="button" className={`seg ${f.iconType === 'label' ? 'on' : ''}`} style={{ flex: 1, padding: 8, fontSize: 12.5 }} onClick={() => setF((p) => ({ ...p, iconType: 'label' }))}>글자</button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {!isNew && (
          <button className="press" onClick={() => { store.removeShop(shop.id); onClose() }} style={{ padding: '11px 14px', borderRadius: 12, background: 'var(--cream)', color: 'var(--danger)', fontWeight: 600, fontSize: 14 }}>삭제</button>
        )}
        <button className="press" onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 12, background: 'var(--cream)', color: 'var(--text-sub)', fontWeight: 600, fontSize: 14 }}>취소</button>
        <button className="press" onClick={save} style={{ flex: 1, padding: 11, borderRadius: 12, background: 'var(--brown)', color: '#fff', fontWeight: 600, fontSize: 14 }}>{isNew ? '추가' : '저장'}</button>
      </div>
    </div>
  )
}
