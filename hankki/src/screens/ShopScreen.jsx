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
        {/* 🌱 생협 안내 — **긴 안내문을 뺐다.** 창업자 2026-08-03 *"너무 복잡한가..."*
            ⭐ 대신 「사러가기」 배지에 네 글자만 넣었다 → `mallLabel()` 의 **「한살림 · 조합원만」**.
               누른 «뒤»에 알리는 것보다 누르기 «전»에 보이는 게 낫다 — 헛걸음이 아예 없고
               시트·기억·버튼 같은 새 장치가 하나도 안 생긴다.
            📌 확인한 사실(공식 안내 · 2026-08-03) — 고칠 땐 그날 공식 페이지를 다시 볼 것:
              · 한살림 = *"온라인 물품구입은 조합원만 이용 가능"* · 가입비 3천원 ＋ 출자금 3만원(탈퇴 시 환불)
                        · 비조합원은 «매장»에서 10% 비싼 값으로만
              · 자연드림(아이쿱) = 일반가·조합원가가 따로 있다 = **비조합원도 온라인 구매 가능**
                        → 그래서 자연드림엔 아무 표시도 안 붙인다(그게 기본이다). */}
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
  // 🗂🗂 칩은 «큰 칸»만 보여준다 — 창업자 2026-08-03
  //   *"장바구니 종류탭이 너무 길어지네... 지금 종류가 더 늘텐데 옆으로 계속 길어지면 불편할 것 같아."*
  //   🔎 재보니 카테고리 23개 · 칩 줄 길이 ≈2,227px = **화면 폭의 5.7배**(다섯 번 넘게 밀어야 끝).
  //   ⭐ 뿌리는 「칩이 길다」가 아니라 **「칸이 너무 잘게 쪼개져 있다」** —
  //      23칸에 제품이 40개뿐이라 **칸당 1.7개**다(훈제오리·누룽지·콩국물처럼 제품 하나짜리 칸).
  //      제품 하나 올릴 때마다 칩이 하나 느는 구조라 **손대지 않으면 영원히 길어진다.**
  //   ✅ 그래서 **큰 칸 6개**로 묶었다(`curation.js` 의 `group`). 제품이 아무리 늘어도 칩은 그대로다.
  //      잘게 나눈 종류는 **없애지 않았다** — 큰 칸을 고르면 그 안에서 «소제목»으로 갈려 나온다.
  //   ⏳ 창업자 *"일단 이렇게 해두고 또 많아지면 검색이나 그런걸 추가하자."*
  //      → 다음 단계는 검색(초성 포함) · 근거 = `docs/서랍-감당되나-2026-08-01.md`(같은 모양의 문제)
  const groupList = [...new Set(CURATION.map((g) => g.group))]
    .map((name) => ({ name, icon: CURATION.find((g) => g.group === name)?.icon }))
  // 지금 칩으로 보여줄 «묶음 목록» — pick 이면 안 쓰고, 전체면 전부, 아니면 그 큰 칸만
  const shownGroups =
    curCat === '전체' ? CURATION : CURATION.filter((g) => g.group === curCat)

  // 📏📏 「전체」는 큰 칸마다 **3개까지만** 보이고 나머지는 「더보기」로 접는다 — 창업자 2026-08-03
  //   *"3개까지 보이고 그 아래는 더보기로 정리? 아래로 너무 김."*
  //   🔎 실제로 재보니 「전체」를 누르면 **카드 40장**이 세로로 쭉 늘어선다(양념만 13장).
  //   ⭐ 뿌리는 칸 개수가 아니라 **「전체」가 재고를 전부 펼친다**는 것 — 큐레이션은 계속 늘어나므로
  //      (창업자 *"앞으로 큐레이션 계속 올릴거니까"*) 손대지 않으면 **화면이 영영 길어진다.**
  //      3개씩 접으면 제품이 100개가 돼도 「전체」 길이는 그대로다(6칸 × 3 = 18장).
  //   ⛔ **큰 칸을 «직접 고른» 경우엔 접지 않는다** — 그건 「그걸 보려고」 고른 화면이다.
  //      「전체」= 훑는 화면 / 큰 칸 = 고른 화면. 목적이 다르므로 같이 다루지 않는다.
  const FOLD = 3
  const [openG, setOpenG] = useState({})   // 큰 칸별 «펼쳤나»
  // 큰 칸으로 다시 묶는다 — ⚠️ 소제목(작은 칸)은 그대로 살린다. 접히는 건 «개수»뿐이다.
  const byGroup = [...new Set(shownGroups.map((g) => g.group))].map((name) => ({
    name,
    cats: shownGroups.filter((g) => g.group === name),
  }))
  // 소제목 구조를 지키며 앞에서 n개만 — 첫 소칸이 3개면 그 소칸만, 1개면 다음 소칸까지 이어 센다
  const take = (cats, n) => {
    const out = []
    let left = n
    for (const c of cats) {
      if (left <= 0) break
      out.push({ ...c, items: c.items.slice(0, left) })
      left -= Math.min(left, c.items.length)
    }
    return out
  }

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
    // ⭐ 한살림만 「조합원만」을 덧붙인다 — 창업자 2026-08-03
    //   *"한살림템을 사러가기 누르면 안내해주는건 어때?"* → *"너무 복잡한가..."*
    //   ⭐ **누른 뒤 시트로 알리는 것보다 누르기 «전»에 배지로 보이는 게 낫다** — 헛걸음이 아예 없고
    //      시트·기억·버튼 같은 새 장치가 하나도 안 생긴다. 창업자 원래 걱정(*"조합원이 아니면
    //      온라인몰 이용어려우니까"*)은 이 네 글자로 다 해결된다.
    //   ⚠️ 한살림 온라인 장보기는 **조합원만**(가입비 3천원＋출자금 3만원·탈퇴 시 환불 · 공식 안내 확인)
    if (u.includes('hansalim')) return '한살림 · 조합원만'
    if (u.includes('sanjitalk')) return '산지톡'
    if (u.includes('smartstore.naver')) return '네이버'
    return ''
  }
  const tagStyle = { fontSize: 11, fontWeight: 700, color: '#8a6a3e', background: 'var(--cream)', borderRadius: 6, padding: '2px 7px', flex: '0 0 auto' }
  const mallStyle = { fontSize: 11, fontWeight: 700, color: 'var(--brown)', background: 'var(--cream-deep)', borderRadius: 6, padding: '2px 7px', flex: '0 0 auto' }
  // 🔴 「조합원만」은 **확 튀게** — 창업자 2026-08-03 *"색깔 확튀게 올려줘."*
  //   다른 배지(구매처)는 그냥 «어디서 사나»인데 이건 **못 살 수도 있다는 주의**라 무게가 다르다.
  //   ⚠️ 우리 톤은 뮤트라 형광색은 안 쓴다 → **진한 테라코타에 흰 글씨**(채운 배지)로 대비를 준다.
  //      옅은 배경＋갈색 글씨(다른 배지)와 나란히 놓으면 이것만 눈에 들어온다.
  const WARN = '#a8543a'
  const mallStyleFor = (label) =>
    label.includes('조합원')
      ? { ...mallStyle, color: '#fff', background: WARN, fontWeight: 800, letterSpacing: '-0.01em' }
      : mallStyle

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
            {mallLabel(it) && <span style={mallStyleFor(mallLabel(it))}>{mallLabel(it)}</span>}
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
      {/* 💰 제휴(대가성) 고지 — **박스를 빼고 한 줄로 줄였다** (2026-08-03, 창업자 지시 두 번)
          ⒜ *"아래위로 좀 지저분해보여"* → 크림 박스를 없앴다
          ⒝ *"근데 쿠팡 그거는 붙이는게 좋을 것 같아. **사람들이 오해할 수있어. 고지없이 수수료받는 줄..**"*
             → ⭐**맞는 판단이다.** 쿠팡 링크가 34개나 보이는데 아무 말이 없으면
                「안 받는다」가 아니라 **「말 안 하고 받는다」로 읽힌다.** 없는 게 오히려 의심을 산다.
          ⛔ 이 줄을 지우지 말 것. 지우면 `scripts/check-affiliate.mjs` 가 배포를 막는다(제휴 링크가 있을 때).
          ⚠️ 제휴를 «시작하면» 이 문장을 사실에 맞게 고쳐야 한다 — 「받지 않아요」가 그대로면 거짓이 된다. */}
      <div className="t-sub" style={{ fontSize: 11, marginTop: -2, marginBottom: 8, lineHeight: 1.5 }}>
        ‘사러가기’는 외부 쇼핑몰로 이어져요 · <b style={{ color: 'var(--brown)' }}>한끼는 수수료를 받지 않아요</b> (나중에 제휴가 생겨도 여러분은 늘 정가 그대로예요)
      </div>

      {open && (
        <>
          {/* 카테고리 칩 — 기본은 '이번 주 픽', 필요한 카테고리만 펼쳐 본다 */}
          <div className="hscroll" style={{ paddingBottom: 4, marginBottom: 4 }}>
            {chip('pick', '이번 주 픽')}
            {chip('전체', '전체')}
            {groupList.map((c) => chip(c.name, (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                {curIcon(c.icon) && <img src={curIcon(c.icon)} alt="" draggable={false} style={{ width: 19, height: 19, objectFit: 'contain' }} />}
                {c.name}
              </span>
            )))}
          </div>

          {/* ⭐ 잘게 나눈 종류는 «칩»에서 «소제목»으로 자리를 옮겼을 뿐 하나도 안 없어졌다.
              큰 칸을 고르면 그 안에서 간장·된장·맛술… 로 갈려 보인다. */}
          {curCat === 'pick'
            ? picks.map((it) => Card(it))
            : byGroup.map((G) => {
                const total = G.cats.reduce((s, c) => s + c.items.length, 0)
                // 큰 칸을 직접 고른 화면(`curCat !== '전체'`)은 접지 않는다 — 보려고 고른 것이다
                const on = curCat !== '전체' || openG[G.name] || total <= FOLD
                const cats = on ? G.cats : take(G.cats, FOLD)
                return (
                  <div key={G.name}>
                    {cats.map((g) => (
                      <div key={g.cat}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 800, color: 'var(--brown)', margin: '12px 2px 7px' }}>
                          {curIcon(g.icon) ? <img src={curIcon(g.icon)} alt="" draggable={false} style={{ width: 22, height: 22, objectFit: 'contain' }} /> : <span>{g.emoji}</span>}
                          {g.cat}
                        </div>
                        {g.items.map((it) => Card({ ...it, cat: g.cat, emoji: g.emoji, icon: it.icon || g.icon }))}
                      </div>
                    ))}
                    {/* ⭐ 「몇 개가 더 있는지」를 숫자로 적는다 — 「더보기」만 있으면 누를지 말지 못 정한다 */}
                    {curCat === '전체' && total > FOLD && (
                      <button
                        className="press"
                        onClick={() => setOpenG((s) => ({ ...s, [G.name]: !s[G.name] }))}
                        style={{ width: '100%', padding: '9px 0', marginBottom: 4, borderRadius: 11, background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--brown)', fontWeight: 800, fontSize: 13 }}>
                        {openG[G.name] ? `${G.name} 접기` : `${G.name} ${total - FOLD}개 더보기`}
                      </button>
                    )}
                  </div>
                )
              })}

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
