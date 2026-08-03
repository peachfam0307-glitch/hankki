import { useState } from 'react'
import { useStore, newId } from '../store'
import { useNav } from '../App'
import { useLayerBack } from '../useBackHandler'
import Icon from '../components/Icon'
import uiGomShop from '../assets/ui/gom_shop.png' // 🐻 장보기 꼬르곰(주부의 장바구니 헤더)
import CoachMarks, { needsCoach } from '../components/CoachMarks'

// 장보기 탭 첫 방문 코치마크 — 숨은 기능 안내(창업자 딸 아이디어 ⭐)
const SHOP_COACH_KEY = 'hankki:coach:shop'
const SHOP_COACH_STEPS = [
  { sel: '[data-coach="curation"]', label: '주부의 장바구니', desc: '18년차 주부가 엄선한 식재료 · 담고 바로 사러 가요' },
  { sel: '[data-coach="pantry"]', label: '냉장고', desc: '재료를 넣으면 유통기한 챙기고, 그 재료로 만들 요리도 추천해요' },
]
import TextTile from '../components/TextTile'
import EmojiPicker from '../components/EmojiPicker'
import FoodIcon from '../components/FoodIcon'
import FoodIconPicker from '../components/FoodIconPicker'
import PantryView from '../components/PantryView'
import TabTips from '../components/TabTips'
import ConfirmSheet from '../components/ConfirmSheet'
import { openExternal } from '../utils'
import { CURATION, curIcon } from '../data/curation'

// 외부 쇼핑몰 열기 — 정식 새 탭(설치된 앱 있으면 App Link 로 앱)으로 연다.
// (features 문자열을 주면 팝업 창으로 열려 모바일에서 세로로 깨지고 두 번 열린 듯 보였음)
const openUrl = openExternal
function shopSearchUrl(shop, q) {
  if (q && shop.search) return shop.search.replace('{q}', encodeURIComponent(q))
  return shop.url
}

// 섹션 헤더의 '편집 / 접기·펼치기' 버튼 — 손가락으로 누르기 쉽게 살짝 키운 알약 버튼.
const secBtnStyle = { fontSize: 13.5, fontWeight: 700, color: 'var(--brown)', background: 'var(--cream)', padding: '7px 14px', borderRadius: 999 }

export default function ShopScreen() {
  const store = useStore()
  const { shops, shoppingList } = store
  const nav = useNav()
  const [editShops, setEditShops] = useState(false)
  const [shopForm, setShopForm] = useState(null) // null | {} (new) | shop (edit)
  // 냉장고/장보기 하위 화면 선택은 기억해 둔다 — 냉장고에서 추천 레시피를 보고
  // 돌아왔을 때 장보기(영수증) 쪽으로 튕기지 않도록.
  const [view, setViewState] = useState(() => {
    try { return sessionStorage.getItem('hankki:shopView') || 'shop' } catch { return 'shop' }
  })
  const setView = (v) => {
    setViewState(v)
    try { sessionStorage.setItem('hankki:shopView', v) } catch { /* noop */ }
  }
  const [clearAsk, setClearAsk] = useState(false)
  // 인라인 시트(쇼핑몰 편집·추가/편집 폼) — 뒤로가기로 닫기(비우기 확인은 ConfirmSheet 자체 처리)
  useLayerBack(editShops, () => setEditShops(false))
  useLayerBack(!!shopForm, () => setShopForm(null))
  const [coach, setCoach] = useState(() => needsCoach(SHOP_COACH_KEY))

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
        {/* 장보기가 주(첫인상), 냉장고는 옆 토글(부). 냉장고 기능은 유지하되 앞으로 안 내세운다. */}
        <div className="segment" style={{ marginTop: 4 }}>
          <button type="button" className={`seg ${view === 'shop' ? 'on' : ''}`} onClick={() => setView('shop')}>장보기</button>
          <button type="button" className={`seg ${view === 'pantry' ? 'on' : ''}`} data-coach="pantry" onClick={() => setView('pantry')}>냉장고</button>
        </div>

        {view === 'pantry' && <PantryView />}

        {view === 'shop' && (
        <>
        {/* 1) 주부의 장바구니 — 담은 게 없을 땐 맨 위(발견용). 담은 게 있으면 아래로 내려가 장보기 리스트가 위로 온다(창업자 피드백: 긴 큐레이션에 리스트가 묻힘). */}
        {shoppingList.length === 0 && <div data-coach="curation"><Curation /></div>}

        {/* 2) 장보기 리스트 — 담은 것이 여기로. 큐레이션 바로 아래라 담기 동선이 자연스럽다. */}
        <div className="sec-head" style={{ marginTop: 20 }}>
          <div className="h-section" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="cart" size={18} color="var(--brown)" stroke={1.9} />장보기 리스트</div>
          <div style={{ display: 'flex', gap: 14 }}>
            {doneCount > 0 && (
              <button className="t-more press" onClick={() => store.clearDoneShopItems()}>
                완료 지우기
              </button>
            )}
            {shoppingList.length > 0 && (
              <button
                className="t-more press"
                onClick={() => setClearAsk(true)}
              >
                전체 비우기
              </button>
            )}
          </div>
        </div>
        <ChecklistAdd />
        {shoppingList.length === 0 ? (
          <div className="empty" style={{ padding: '24px' }}>{'필요한 재료를 담아보세요.\n위 주부의 장바구니나 레시피 상세 “재료 담기”로도 담을 수 있어요.'}</div>
        ) : (
          shoppingList.map((it) => (
            <div key={it.id} className="shop-row">
              <button className="check-box press" data-on={it.done} onClick={() => { const was = it.done; store.toggleShopItem(it.id); if (!was) nav.showToast('샀어요! 냉장고에 넣어뒀어요') }}>
                {it.done && <Icon name="check" size={15} color="#fff" stroke={2.4} />}
              </button>
              <span style={{ flex: 1, fontSize: 15, textDecoration: it.done ? 'line-through' : 'none', color: it.done ? 'var(--text-sub)' : 'var(--text)' }}>
                {it.name}
              </span>
              <button className="press mini-buy" onClick={() => (it.url ? openUrl(it.url) : openUrl(shopSearchUrl(shops[0] || { url: '' }, it.name)))}>
                {it.url ? '사러가기' : '검색'}
              </button>
              <button className="icon-btn press" onClick={() => store.removeShopItem(it.id)} aria-label="삭제">
                <Icon name="x" size={17} color="var(--sand)" />
              </button>
            </div>
          ))
        )}

        {/* 담은 게 있을 땐 큐레이션을 리스트 아래로 (리스트가 위로 올라와 잘 보이게) */}
        {shoppingList.length > 0 && (
          <div data-coach="curation" style={{ marginTop: 26 }}><Curation /></div>
        )}

        {/* 3) 쇼핑몰 바로가기 — 리스트 확인하고 바로 사러 가는 자리(리스트 바로 아래). */}
        <div className="sec-head" style={{ marginTop: 24 }}>
          <div className="h-section" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="tag" size={18} color="var(--brown)" stroke={1.9} />쇼핑몰 바로가기</div>
          <button className="press" style={secBtnStyle} onClick={() => setEditShops((v) => !v)}>
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
          {editShops ? '아이콘을 눌러 이름·주소·아이콘을 바꿀 수 있어요.' : '쇼핑몰 앱이 깔려 있고 로그인돼 있으면 바로 연결돼요. 한 번 로그인해두면 계속 유지돼 편해요.'}
        </div>
        {/* 🌱 생협 안내 — 창업자 2026-08-03 *"조합원이 아니면 온라인몰 이용어려우니까 그거 안내해야 할 것
            같은데. 자연드림은 일반소비자도 가능하다고 적어주고."*
            ⚠️ 밖으로 나가는 글이라 **공식 안내를 먼저 확인하고 썼다**(규칙 16):
              · 한살림 = *"온라인 물품구입은 조합원만 이용 가능"* · 가입비 3천원 ＋ 출자금 3만원(탈퇴 시 환불)
                        · 비조합원은 «매장»에서 10% 비싼 값으로만
              · 자연드림(아이쿱) = 일반가·조합원가가 따로 있다 = **비조합원도 온라인 구매 가능**
            ⛔ 값·조건은 바뀔 수 있다 — 고칠 땐 **그날 공식 페이지를 다시 보고** 고칠 것. */}
        {!editShops && shops.some((s) => s.id === 'hansalim' || s.id === 'naturedream') && (
          <div className="t-sub" style={{ fontSize: 11.5, marginTop: 5, lineHeight: 1.55 }}>
            <b style={{ color: 'var(--brown)' }}>한살림</b>은 온라인 장보기가 <b style={{ color: 'var(--brown)' }}>조합원만</b> 돼요(가입비 3천원＋출자금 3만원, 탈퇴하면 돌려받아요). 조합원이 아니면 매장에서 살 수 있어요.
            {' '}<b style={{ color: 'var(--brown)' }}>자연드림</b>은 조합원이 아니어도 온라인에서 살 수 있어요.
          </div>
        )}
        {shopForm && <ShopEdit shop={shopForm} onClose={() => setShopForm(null)} />}
        </>
        )}
      </div>

      {clearAsk && (
        <ConfirmSheet
          title="장보기 비우기"
          message="장보기 리스트를 모두 지울까요?"
          confirmLabel="모두 지우기"
          danger
          onConfirm={() => store.clearShopItemsAll()}
          onClose={() => setClearAsk(false)}
        />
      )}

      {/* 첫 방문 코치마크 — 화면 어두워지고 중요 기능이 반짝이며 안내 */}
      {coach && view === 'shop' && (
        <CoachMarks storageKey={SHOP_COACH_KEY} steps={SHOP_COACH_STEPS} onDone={() => setCoach(false)} />
      )}
    </>
  )
}

// 주부의 장바구니 — 18년차 주부가 엄선한 건강 식재료. '사러가기'는 선호 쇼핑몰에서 자동검색.
function Curation() {
  const store = useStore()
  const { shops } = store
  const nav = useNav()
  const [open, setOpen] = useState(true)
  // 큐레이션이 맨 위로 오면서, 26장 벽 대신 '이번 주 픽'을 기본으로 보여주고
  // 카테고리 칩으로 필요한 것만 펼친다. 'pick'(기본) | 카테고리명 | '전체'
  const [curCat, setCurCat] = useState('pick')

  // 카테고리·이모지를 각 아이템에 붙여 평탄화(칩 필터·픽 렌더용)
  const flat = CURATION.flatMap((g) => g.items.map((it) => ({ ...it, cat: g.cat, emoji: g.emoji, icon: it.icon || g.icon })))
  const picks = flat.filter((it) => it.pick)
  const catList = CURATION.map((g) => ({ cat: g.cat, emoji: g.emoji, icon: g.icon }))
  const shownItems =
    curCat === 'pick' ? picks : curCat === '전체' ? flat : flat.filter((it) => it.cat === curCat)

  // '사러가기' 연결: url 이 있으면 그 직접 링크로, mall 이 있으면 그 쇼핑몰 검색으로,
  // 없으면 무엇이든 잘 찾는 네이버쇼핑 통합검색으로.
  const MALL_SEARCH = {
    coupang: 'https://www.coupang.com/np/search?q={q}',
    oasis: 'https://www.oasis.co.kr/product/search?keyword={q}',
    naver: 'https://search.shopping.naver.com/search/all?query={q}',
  }
  // 쇼핑몰 검색으로 연결. (설치 PWA 안에서 외부 '앱' 강제 열기는 브라우저 제어라 불안정 →
  //  쿠팡 앱 직접 열기는 정식 TWA 출시 때 다시. 지금은 웹 검색이 안정적.)
  const linkFor = (it) =>
    it.url || (MALL_SEARCH[it.mall] || MALL_SEARCH.naver).replace('{q}', encodeURIComponent(it.q))
  const buy = (it) => openUrl(linkFor(it))
  const add = (it) => {
    store.addShopItem({ name: it.name, url: linkFor(it) })
    nav.showToast('장보기 리스트에 담았어요')
  }

  // '사러가기' 버튼에 붙는 구매처 배지 라벨
  const mallLabel = (it) => {
    if (it.mall === 'coupang') return '쿠팡'
    if (it.mall === 'oasis') return '오아시스'
    const u = it.url || ''
    if (u.includes('hansalim')) return '한살림'
    if (u.includes('sanjitalk')) return '산지톡'
    if (u.includes('smartstore.naver')) return '네이버'
    return ''
  }
  const tagStyle = { fontSize: 11, fontWeight: 700, color: '#8a6a3e', background: 'var(--cream)', borderRadius: 6, padding: '2px 7px', flex: '0 0 auto' }
  const mallStyle = { fontSize: 11, fontWeight: 700, color: 'var(--brown)', background: 'var(--cream-deep)', borderRadius: 6, padding: '2px 7px', flex: '0 0 auto' }

  const Card = (it) => (
    <div key={it.name} className="card" style={{ padding: '13px 13px 12px', marginBottom: 9 }}>
      <div style={{ display: 'flex', gap: 11 }}>
        <div className="emoji-tile" style={{ width: 46, height: 46, fontSize: 24, flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {curIcon(it.icon) ? <img src={curIcon(it.icon)} alt="" draggable={false} style={{ width: 42, height: 42, objectFit: 'contain' }} /> : it.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{it.name}</span>
            {it.tag && <span style={tagStyle}>{it.tag}</span>}
            {mallLabel(it) && <span style={mallStyle}>{mallLabel(it)}</span>}
          </div>
          <div className="t-sub" style={{ fontSize: 13, lineHeight: 1.58 }}>{it.benefit}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 11 }}>
        <button className="press" onClick={() => add(it)} style={{ flex: 1, padding: '9px 0', borderRadius: 11, background: 'var(--brown)', color: '#fff', fontWeight: 800, fontSize: 13.5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><Icon name="cart" size={14} />담기</button>
        <button className="press" onClick={() => buy(it)} style={{ flex: 1, padding: '9px 0', borderRadius: 11, background: 'var(--cream)', color: 'var(--brown)', fontWeight: 800, fontSize: 13.5 }}>사러가기</button>
      </div>
    </div>
  )
  const chip = (key, label) => (
    <button
      key={key}
      className={`pill press ${curCat === key ? 'active' : ''}`}
      onClick={() => setCurCat(key)}
    >{label}</button>
  )

  return (
    <>
      <div className="sec-head" style={{ marginTop: 6 }}>
        <div className="h-section" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><img src={uiGomShop} alt="" draggable={false} style={{ width: 24, height: 24, objectFit: 'contain', flex: '0 0 auto' }} />주부의 장바구니</div>
        <button className="press" style={secBtnStyle} onClick={() => setOpen((v) => !v)}>{open ? '접기' : '펼치기'}</button>
      </div>
      {/* ⭐ 「계속 올라와요」를 여기로 올렸다 — 창업자 2026-08-03 *"주부의 장바구니옆에 계속 올라오다는
          문구 적어줘. (원래 지워지는 아래안내판에 있었음)"*. 아래 안내판을 빼면서 그 말만 살렸다.
          ⛔ 이 말은 지우지 말 것 — **재고가 계속 는다는 신호**라 다음에 또 들어올 이유가 된다. */}
      <div className="t-sub" style={{ fontSize: 12, marginTop: -2, marginBottom: 6 }}>
        써보고 좋은 건 꼭 나누는 18년차 주부의 · 첨가물 적은 건강 식재료 · <b style={{ color: 'var(--brown)' }}>앞으로도 하나씩 계속 올라와요</b>
      </div>
      {/* ⛔⛔ 제휴(대가성) 고지판을 «뺐다» — 창업자 2026-08-03 *"주부의 장바구니 아래 안내판은 없애도
          될 것같아 아래위로 좀 지저분해보여"*. 지금은 **제휴를 하나도 안 하고 있어서** 고지 의무가 없다.
          ⚠️⚠️ **쿠팡 파트너스에 가입하는 순간 다시 넣어야 한다** — 공정위 추천·보증 심사지침상 «법적 의무»고,
             쿠팡 심사가 그 문구가 보이는 스크린샷을 요구한다(`docs/제휴프로그램-확인-2026-08-03.md`).
          ⭐ 사람이 기억할 일로 두지 않았다 — `scripts/check-affiliate.mjs` 가 큐레이션 주소에서
             제휴 꼬리표(`link.coupang.com`·`lptag`·`subId` 등)를 찾으면 **이 고지가 없을 때 배포를 막는다.**
          📌 되살릴 문구는 그 검사 파일 맨 위에 통째로 적어뒀다(지워지지 않게). */}

      {open && (
        <>
          {/* 카테고리 칩 — 기본은 '이번 주 픽', 필요한 카테고리만 펼쳐 본다 */}
          <div className="hscroll" style={{ paddingBottom: 4, marginBottom: 4 }}>
            {chip('pick', '이번 주 픽')}
            {chip('전체', '전체')}
            {catList.map((c) => chip(c.cat, (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                {curIcon(c.icon) ? <img src={curIcon(c.icon)} alt="" draggable={false} style={{ width: 19, height: 19, objectFit: 'contain' }} /> : <span>{c.emoji}</span>}
                {c.cat}
              </span>
            )))}
          </div>

          {curCat === '전체'
            ? CURATION.map((g) => (
                <div key={g.cat}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 800, color: 'var(--brown)', margin: '12px 2px 7px' }}>
                    {curIcon(g.icon) ? <img src={curIcon(g.icon)} alt="" draggable={false} style={{ width: 22, height: 22, objectFit: 'contain' }} /> : <span>{g.emoji}</span>}
                    {g.cat}
                  </div>
                  {g.items.map((it) => Card({ ...it, cat: g.cat, emoji: g.emoji, icon: it.icon || g.icon }))}
                </div>
              ))
            : shownItems.map((it) => Card(it))}

          {/* ⛔ 아래 안내판을 뺐다 (창업자 2026-08-03 *"아래위로 좀 지저분해보여"*).
              「앞으로도 하나씩 계속 올라와요」는 **맨 위 부제로 옮겨 살렸다** — 창업자가 콕 집어 남기라 했다. */}
        </>
      )}
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

function ShopEdit({ shop, onClose }) {
  const store = useStore()
  const isNew = !shop.id
  const [f, setF] = useState({
    name: shop.name || '',
    url: shop.url || '',
    emoji: shop.emoji || '🛍️',
    icon: shop.icon || 'bag',
    iconType: shop.iconType || 'icon',
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
        <button className="press" onClick={save} style={{ flex: 1, padding: 11, borderRadius: 12, background: 'var(--brown)', color: '#fff', fontWeight: 600, fontSize: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><Icon name="check" size={14} />{isNew ? '추가' : '저장'}</button>
      </div>
    </div>
  )
}
