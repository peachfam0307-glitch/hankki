import { useState } from 'react'
import { COACH } from '../coach'
import { useStore, newId } from '../store'
import { pantryExpiryCount } from '../pantryExpiry'
import { 사러나감, 장보기담음 } from '../stats'
import { useNav } from '../App'
import { useLayerBack } from '../useBackHandler'
import Icon from '../components/Icon'
import uiGomShop from '../assets/ui/gom_shop.png' // 🐻 장보기 꼬르곰(주부의 장바구니 헤더)
// 🐧 장보기 상단 펭펭 — 창업자 2026-08-13 *"장보기는 펭펭장보는거 있지않아?"*
//    ⛔ 처음엔 `sm_peng_shop`(여름 원피스＋아이스크림)을 썼는데 **여름 컷이라 11월엔 어색하다.**
//    ✅ `pn_shop` = 트렌치코트에 쇼핑백 — **계절을 안 탄다.** 그래서 계절 분기 자체가 필요 없어졌다.
//    ✅ 창업자가 «장보는 펭펭» 4컷을 새로 뽑아 줬다(2026-08-13) → 그중 **메모지 보며 바구니** 컷.
//       ⭐ 넷 중 이걸 고른 이유 = 이 화면이 «장보기 리스트»라 그림이 화면 뜻과 같다.
//         (시장 컷은 배경 진열대가 붙어 38px 에선 뭉치고, 카트 컷은 가로로 길어 상단바에 안 맞는다)
import uiPengShop from '../assets/ui/wave/pn_shoplist.png'
import uiGomThumb from '../assets/ui/wave/gom_thumbsup.png' // 👍 「이번 주 픽」 소제목 (창업자 2026-08-17)
// ⭐ 「이번 주 픽」 «칩»에 붙는 별 (창업자 2026-08-31 *"픽 위에 별이나 뭐 ... 서랍에서 딱 보이게."*)
//   ⛔ 유니코드 이모지(★)를 쓰지 않는다 — 앱 화면 글자는 우리 스티커다(CLAUDE.md).
//   ✅ 후보 셋을 실제 칩에 얹어 찍어 보고 창업자가 골랐다 = `ta_star`(크림 별).
//      「얼굴 있는 별」·「반짝이」보다 **크림톤 칩·배경에 제일 잘 붙는다.**
import uiPickStar from '../assets/stickers/photo/ta_star.png'
import CoachMarks, { needsCoach } from '../components/CoachMarks'

// 장보기 탭 첫 방문 코치마크 — 숨은 기능 안내(창업자 딸 아이디어 ⭐)
const SHOP_COACH_KEY = COACH.shop
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
import TabTalk from '../components/TabTalk'
import ConfirmSheet from '../components/ConfirmSheet'
import { openExternal, matchKo } from '../utils'
import { CURATION, curIcon, weeklyPicks, isHansalim, productLink, productMall } from '../data/curation'
import { weeklyNow, todayKST } from '../data/weekly'
import SeasonHeadCut from '../components/SeasonHeadCut.jsx'

// 외부 쇼핑몰 열기 — 정식 새 탭(설치된 앱 있으면 App Link 로 앱)으로 연다.
// (features 문자열을 주면 팝업 창으로 열려 모바일에서 세로로 깨지고 두 번 열린 듯 보였음)
const openUrl = openExternal
function shopSearchUrl(shop, q) {
  if (q && shop.search) return shop.search.replace('{q}', encodeURIComponent(q))
  return shop.url
}

// 🛒 장보기 리스트 한 줄에서 「사러가기」를 눌렀을 때 갈 곳.
//   ⭐ 담을 때 주소가 붙어 있으면(주부의 장바구니·레시피 재료 담기) 그 제품으로 바로 간다.
//      직접 손으로 쓴 재료는 주소가 없으니 «쇼핑몰에서 이름으로 찾아» 준다 — 유저에겐 둘 다 「사러 가는 것」이다.
//   ⛔⛔ 예전엔 이 둘을 「사러가기」와 「검색」 두 이름으로 갈라 놨는데,
//      **테스터가 «둘이 뭐가 다르냐»고 물었다** (창업자 전달 2026-08-10).
//      같은 자리·같은 모양인데 이름만 다르면 «다른 기능인 줄» 안다. 게다가 「검색」은
//      우리 앱에서 이미 «앱 안에서 찾기»(레시피 탭·장보기·레꾸자랑)로 쓰는 낱말이라 뜻이 둘이 됐다.
//      → 이름은 **「사러가기」 하나**로. 어디로 가는지는 눌러서 알면 되는 것이고, 목적은 같다.
//      (근거 = CLAUDE.md 「같은 기능은 같은 이름」 · 창업자 2026-07-30 *"데코랑 이름 같아야지"*)
//   ⚠️ 몰 고르기는 «검색이 되는» 첫 몰로 — 한살림·자연드림은 `search` 가 검색이 아니라 «홈 주소»라
//      맨 앞에 두면 찾던 재료가 아니라 홈이 열렸다(찾아보고 알았다).
//   ⚠️ 쇼핑몰을 다 지운 사람도 있다 → 그때는 네이버쇼핑 통합검색. 안 그러면 «아무 데도 안 가는» 죽은 버튼이 된다.
// 🌱 이 줄에 「사러가기」를 안 그리나 — **두 겹**으로 본다.
//   ⑴ `noBuy` = 오늘부터 담는 것에 붙는 표식
//   ⑵ ⭐⭐ url 에 `hansalim` — **이미 담아둔 사람**을 위한 것이다(규칙 18 ⓙ).
//      8/17 «전»에 담은 한살림 줄은 옛 앱 링크(`intent:…kr.or.hansalim.shop…`)를 그대로 들고 있고
//      `noBuy` 가 없다. ⑴만 보면 그 사람들은 영영 옛 동작 그대로다.
//      📌 **고칠 땐 「고친 뒤 상태」가 아니라 「이미 나가 있는 상태」에서 출발한다.**
const noBuyRow = (item) => !!item?.noBuy || String(item?.url || '').includes('hansalim')

function buyUrlFor(item, shops) {
  if (item.url) return item.url
  const s = (shops || []).find((x) => x.search && x.search.includes('{q}'))
  if (s) return shopSearchUrl(s, item.name)
  return `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(item.name)}`
}

// 섹션 헤더의 '편집 / 접기·펼치기' 버튼 — 손가락으로 누르기 쉽게 살짝 키운 알약 버튼.
const secBtnStyle = { fontSize: 16.5, fontWeight: 700, color: 'var(--brown)', background: 'var(--cream)', padding: '7px 14px', borderRadius: 999 }

export default function ShopScreen() {
  const store = useStore()
  const { shops, shoppingList, pantry } = store
  const expN = pantryExpiryCount(pantry)
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
  // ✏️ 지금 «고치는 중인» 장보기 줄 — { id, text } · null 이면 아무 줄도 편집 중이 아니다
  const [편집, set편집] = useState(null)
  // 인라인 시트(쇼핑몰 편집·추가/편집 폼) — 뒤로가기로 닫기(비우기 확인은 ConfirmSheet 자체 처리)
  useLayerBack(editShops, () => setEditShops(false))
  useLayerBack(!!shopForm, () => setShopForm(null))
  const [coach, setCoach] = useState(() => needsCoach(SHOP_COACH_KEY))

  const doneCount = shoppingList.filter((i) => i.done).length

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {/* 🐧 [2026-08-13 창업자 제보] *"장보기 레꾸자랑에는 없어…(글씨옆에)"* ＋ *"펭펭이든 친구들이든 우리애들"*
              ⭐ 여기만 펭펭인 이유 = 이 화면 «아래» 「주부의 장바구니」에 이미 장바구니 든 꼬르곰이 있다.
                 상단바까지 꼬르곰이면 한 화면에 같은 애가 둘 → 펭펭을 올려 둘 다 나오게 했다.
              🧍‍♀️ [2026-08-14 확정] 캐릭터는 **글자 «왼쪽»** — 창업자 *"캐릭터는 같은방향에넣자.왼쪽으로"* */}
          {/* 🎑🎃 명절엔 명절 컷으로 바뀐다. ⭐장보기와 냉장고는 «다른 컷»이다(같은 화면이지만 보는 게 다르다). */}
          <SeasonHeadCut 탭={view === 'pantry' ? 'fridge' : 'shop'} 기본={uiPengShop}
            폭={34} 높이={45} 여백={-6} 모션="hk-m-tongtong" />
          <div className="h-title">장보기</div>
          <TabTips tab="shop" />
        </div>
      </div>

      {/* 💬 꼬리가 왼쪽 위 = 펭펭(`pn_shoplist`) 쪽. 이 탭 캐릭터는 «펭펭»이다 */}
      <TabTalk tab="shop" />

      <div className="pad">
        {/* 장보기가 주(첫인상), 냉장고는 옆 토글(부). 냉장고 기능은 유지하되 앞으로 안 내세운다. */}
        <div className="segment" style={{ marginTop: 4 }}>
          <button type="button" className={`seg ${view === 'shop' ? 'on' : ''}`} onClick={() => setView('shop')}>장보기</button>
          {/* 🔴 「냉장고 ②」 — 임박·지난 재료 개수. 탭바 점과 같은 셈(`pantryExpiry.js`). 0 이면 숫자가 없다. (창업자 확정 2026-09-06) */}
          <button type="button" className={`seg ${view === 'pantry' ? 'on' : ''}`} data-coach="pantry" onClick={() => setView('pantry')}>
            냉장고{expN > 0 && <span className="seg-count" data-testid="pantry-exp-count">{expN}</span>}
          </button>
        </div>

        {view === 'pantry' && <PantryView />}

        {view === 'shop' && (
        /* 📐📐 [2026-08-13 창업자 지시 *"장보기를 오른쪽에 장바구니를 왼쪽에"*]
           패드에선 좌우 2단 — **왼쪽 = 주부의 장바구니 · 오른쪽 = 장보기 리스트**.
           ⛔ 그 전엔 한 줄에 하나라 카드가 화면 폭을 다 써서
              「담기·사러가기 버튼이 너무 크고 설명은 왼쪽에 쏠린다」가 됐다(창업자 제보).
           ⭐ 폰(1열)에선 **지금 순서를 그대로 지킨다** — 담은 게 있으면 리스트가 위로 온다
              (긴 큐레이션에 리스트가 묻힌다는 옛 피드백). CSS `order` 로만 바꾸고 DOM 은 안 건드린다. */
        <div className={`shop-pair${shoppingList.length > 0 ? ' has-items' : ''}`}>
        <div className="shop-cur" data-coach="curation"><Curation /></div>

        <div className="shop-list">
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
              {/* ✏️✏️ **누르면 그 자리에서 고친다** — 창업자 2026-08-16
                    *"근데 **사는 양은 유저가 맘대로 적을수 있어야지**"*
                  ⭐ 레시피에서 담으면 「양파」로 들어온다(분량은 뗀다 · `utils.ingredientName`).
                     사는 양은 사람마다 달라서(1망·3개·600g) **우리가 정하면 안 되는 자리**다.
                  ⛔ 늘 `<input>` 으로 두지 않는다 — 목록을 훑다가 손가락이 스치면 글이 바뀐다.
                     ✅ **누른 줄만** 편집으로 바뀐다. Enter·다른 곳 누르면 저장, Esc 면 되돌린다. */}
              {편집?.id === it.id ? (
                <input
                  autoFocus
                  value={편집.text}
                  onChange={(e) => set편집({ id: it.id, text: e.target.value })}
                  onBlur={() => { store.updateShopItem(it.id, 편집.text); set편집(null) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') set편집(null) }}
                  style={{
                    flex: 1, minWidth: 0, fontSize: 17, fontFamily: 'inherit', color: 'var(--text)',
                    background: 'var(--cream)', border: '1.5px solid var(--brown)', borderRadius: 9,
                    padding: '5px 9px', outline: 'none',
                  }}
                />
              ) : (
                <button
                  className="press"
                  onClick={() => set편집({ id: it.id, text: it.name })}
                  aria-label={`${it.name} 고치기`}
                  style={{
                    flex: 1, minWidth: 0, textAlign: 'left', fontSize: 17, fontFamily: 'inherit',
                    background: 'none', border: 'none', padding: '5px 0', cursor: 'pointer',
                    textDecoration: it.done ? 'line-through' : 'none',
                    color: it.done ? 'var(--text-sub)' : 'var(--text)',
                  }}
                >
                  {it.name}
                </button>
              )}
              {/* ⛔ `noBuy`(한살림) 는 사러가기를 안 그린다 — 담을 때 붙여 둔 표식이다.
                  ⚠️ 이 줄이 없으면 `buyUrlFor()` 가 url 없는 줄을 **쿠팡·네이버 검색으로 보내서**
                     큐레이션에서 링크를 뺀 게 통째로 헛일이 된다(담은 뒤에 새는 구멍). */}
              {!noBuyRow(it) && (
                <button className="press mini-buy" onClick={() => { 사러나감('cart'); openUrl(buyUrlFor(it, shops), it.name) }}>
                  사러가기
                </button>
              )}
              <button className="icon-btn press" onClick={() => store.removeShopItem(it.id)} aria-label="삭제">
                <Icon name="x" size={17} color="var(--sand)" />
              </button>
            </div>
          ))
        )}
        {/* 💡 **고칠 수 있다는 걸 알려준다** — 누를 수 있어도 «누를 수 있는 줄 모르면» 없는 기능이다.
              ⭐ 예를 «창업자가 말한 그대로» 적는다 — *"양파 1망 돼지고기 600g은 맞지."* */}
        {shoppingList.length > 0 && (
          <div className="t-sub" style={{ fontSize: 16.5, marginTop: 18, lineHeight: 1.85 }}>
            재료를 누르면 <b style={{ color: 'var(--brown)' }}>사는 양</b>을 적을 수 있어요 · 「양파 1망」 「돼지고기 600g」 처럼요.
          </div>
        )}

        {/* ⛔ 큐레이션을 여기 한 번 «더» 그리던 것을 지웠다 — 위로 올려 하나만 둔다.
            담은 게 있을 때 리스트를 위로 올리는 건 이제 CSS `order` 가 한다(`.shop-pair.has-items`). */}

        {/* 3) 쇼핑몰 바로가기 — 리스트 확인하고 바로 사러 가는 자리(리스트 바로 아래). */}
        <div className="sec-head" style={{ marginTop: 24 }}>
          <div className="h-section" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="tag" size={18} color="var(--brown)" stroke={1.9} />쇼핑몰 바로가기</div>
          <button className="press" style={secBtnStyle} onClick={() => setEditShops((v) => !v)}>
            {editShops ? '완료' : '편집'}
          </button>
        </div>
        {/* 🏷 [2026-08-17] `mall-row` 는 «이 줄만» 잡으려고 붙인 이름이다 (창업자 *"줄바꿈으로 하자"*).
            ⛔ `.hscroll` 을 통째로 고치면 홈 최근저장·레시피 줄까지 다 바뀐다 — 지목한 곳만 건드린다. */}
        <div className="hscroll mall-row" style={{ paddingBottom: 4 }}>
          {shops.map((s) => (
            <div key={s.id} style={{ position: 'relative' }}>
              <button
                className="shop-chip press"
                onClick={() => (editShops ? setShopForm(s) : openUrl(s.url))}
              >
                {s.iconType === 'label' ? (
                  <TextTile text={s.name} size={64} radius={16} />
                ) : s.iconType === 'icon' ? (
                  <>
                    {/* 🛍 [2026-08-23 창업자] *"쇼핑몰 바로가기 크기키우기"* — 칩(88×96)에 맞춰 같이 키운다 */}
                    <div className="emoji-tile" style={{ width: 64, height: 64 }}>
                      <FoodIcon name={s.icon || 'bag'} size={40} />
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
        <div className="t-sub" style={{ fontSize: 15, marginTop: 6 }}>
          {editShops ? '아이콘을 눌러 이름·주소·아이콘을 바꿀 수 있어요.' : '쇼핑몰 앱이 깔려 있고 로그인돼 있으면 바로 연결돼요. 한 번 로그인해두면 계속 유지돼 편해요.'}
        </div>
        {/* 🌱 생협 안내 — **긴 안내문을 뺐다.** 창업자 2026-08-03 *"너무 복잡한가..."*
            ⭐ 대신 「사러가기」 배지에 넣었다 → `mallLabel()` 의 **「한살림 · 조합원 전용」**.
               🌱 2026-08-17 부터 **한살림은 사러가기 자체를 안 단다** (창업자 *"링크안달면되고"*).
               누른 «뒤»에 알리는 것보다 누르기 «전»에 보이는 게 낫다 — 헛걸음이 아예 없고
               시트·기억·버튼 같은 새 장치가 하나도 안 생긴다.
            📌 확인한 사실(공식 안내 · 2026-08-03) — 고칠 땐 그날 공식 페이지를 다시 볼 것:
              · 한살림 = *"온라인 물품구입은 조합원만 이용 가능"* · 가입비 3천원 ＋ 출자금 3만원(탈퇴 시 환불)
                        · 비조합원은 «매장»에서 10% 비싼 값으로만
              · 자연드림(아이쿱) = 일반가·조합원가가 따로 있다 = **비조합원도 온라인 구매 가능**
                        → 그래서 자연드림엔 아무 표시도 안 붙인다(그게 기본이다). */}
        {shopForm && <ShopEdit shop={shopForm} onClose={() => setShopForm(null)} />}
        </div>
        </div>
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
  const { shops, recipes } = store // `recipes` = 「이번 주 픽」이 이번 주 레시피를 보려고 쓴다
  const nav = useNav()
  const [open, setOpen] = useState(true)
  // 큐레이션이 맨 위로 오면서, 26장 벽 대신 '이번 주 픽'을 기본으로 보여주고
  // 카테고리 칩으로 필요한 것만 펼친다. 'pick'(기본) | 카테고리명 | '전체'
  const [curCat, setCurCat] = useState('pick')

  // 카테고리·이모지를 각 아이템에 붙여 평탄화(칩 필터·픽 렌더용)
  const flat = CURATION.flatMap((g) => g.items.map((it) => ({ ...it, cat: g.cat, group: g.group, emoji: g.emoji, icon: it.icon || g.icon })))
  // 🔍 찾기 — 창업자가 미리 짚어 둔 다음 단계(*"또 많아지면 검색이나 그런걸 추가하자"*).
  //   ⭐ 칩을 6칸으로 줄이고 「전체」를 3개씩 접어도 **제품이 늘면 결국 또 길어진다** —
  //      찾기는 개수가 아무리 늘어도 «길이가 안 늘어나는» 유일한 길이다.
  //   ⚠️ 초성으로도 찾는다(「ㄱㅈ」→간장) — 폰에서 다 치는 것보다 빠르다. → utils.matchKo
  const [curQ, setCurQ] = useState('')
  const curQuery = curQ.trim()
  const found = curQuery
    ? flat.filter((it) => matchKo(it.name, curQuery) || matchKo(it.cat, curQuery) || matchKo(it.group, curQuery))
    : []
  // 🗓 「이번 주 픽」 — 날짜가 돌린다 (창업자 2026-08-10 *"주부장바구니픽도 매주 꼭 바꿔줘"*)
  //   ⛔ 예전엔 `it.pick` 이 박힌 «둘»을 그대로 보여줘 **영영 안 바뀌었다**(창업자 *"예시야 된장."*).
  //   ⭐ 1순위 = 이번 주 레시피가 쓰는 제품 → 홈의 「이번 주 제철」과 **한 이야기**가 된다.
  //      모자라면 주차 번호로 돌려 채운다(어느 주에도 안 빈다). 자세한 건 `curation.js` 의 `weeklyPicks`.
  const picks = weeklyPicks(weeklyNow(recipes), todayKST())
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
  // ⛔⛔ 2026-08-05 — 3 → **2**. 창업자 *"전체탭에서는 2개씩만 보여주고 더보기 넣고,
  //   간장, 된장 등등 2개씩만 넣고 더보기 넣자."*
  const FOLD = 2
  // 🧾 큰 칸을 골랐을 때 «소칸(줄)» 몇 개까지 — 창업자 *"양념류가 9줄이야. 3개정도만 보이고 아래 더보기"*
  const CATFOLD = 3
  const [openG, setOpenG] = useState({})   // 펼쳤나 — 열쇠는 `g:큰칸` · `c:소칸` (이름이 겹쳐도 안 섞이게)
  const [openCard, setOpenCard] = useState({}) // 카드별 «설명을 펼쳤나»
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

  // 🔗🔗 [2026-09-12] 「사러가기」 연결 = **`curation.js` 의 `productLink` 하나만 쓴다.**
  //
  // ⛔⛔⛔ **여기에 `MALL_SEARCH` 표와 `linkFor` 가 «통째로 베껴져» 있었다.** 창업자 = *"왜 이거 자꾸 이렇게 돼????? 컬리 몇번째야.."*
  //    🌲 **그게 뿌리였다.** 2026-08-29 에 컬리 검색 주소를 넣었는데 **`curation.js` 쪽에만** 넣었고,
  //       화면이 실제로 부르는 건 **여기 있던 베낀 표**라 컬리가 없었다.
  //       → 배지엔 「컬리」라고 뜨는데 누르면 **네이버 검색**으로 갔다. 자연드림(icoop)도 같은 이유로 빠져 있었다.
  //    📌 **「고쳤다」고 말한 게 거짓이 아니라, 고친 곳이 화면이 보는 곳이 아니었다.**
  //       두 벌이면 한 벌은 반드시 낡는다 — 「현행이 둘이면 하나는 틀린 값」(2026-08-13)과 같은 사고다.
  //    ⛔ 그래서 여기에 컬리 한 줄을 «더 넣지» 않았다 — 그러면 세 번째가 또 난다(절대원칙 34).
  //       **표를 하나로 만들었다.** 이제 몰을 늘릴 곳은 `curation.js` 의 `MALL_SEARCH` «한 곳»뿐이다.
  const linkFor = productLink
  // 🛒 [2026-09-10] 「주부의 장바구니」에서 «바로» 사러 나간 자리 — 레시피 상세의 픽과 «따로» 센다
  const buy = (it) => { 사러나감('pick_shop'); openUrl(linkFor(it), [it.brand, it.name].filter(Boolean).join(" ")) }
  const add = (it) => {
    // ⭐ 담는 건 그대로 된다 — 매장에 갈 때 «적어두는 것»은 여전히 쓸모가 있다.
    //   다만 `noBuy` 를 같이 담아 **리스트에서도** 사러가기를 안 그린다.
    //   ⛔ 이게 없으면 `buyUrlFor()` 가 url 없는 줄을 쿠팡·네이버 검색으로 보낸다(＝링크 뺀 게 헛일).
    store.addShopItem({ name: it.name, url: linkFor(it), ...(isHansalim(it) ? { noBuy: true } : {}) })
    장보기담음()   // 🛒 [2026-09-10] 담기까지 세야 「들어와서 담지도 않는가」가 갈린다
    nav.showToast('장보기 리스트에 담았어요')
  }

  // 🏬 **「파는 곳」 이름들** — `brand` 칸에 들어 있어도 이건 제조사가 아니라 «쇼핑몰»이다.
  // ⛔⛔ [2026-08-23 창업자] *"자연드림은 또 왜 바꾼거야"* · *"자연드림도 뒤에 붙어야지 딱지만들어서"*
  //    → 내가 `brand` 를 전부 «제조사»로 묶어 이름 앞에 붙였는데, **자연드림·한살림은 파는 곳**이다.
  //    🔢 실측 = brand 값 28가지 중 파는 곳은 **자연드림 1 · 한살림 2** 뿐이고 나머지는 전부 제조사다.
  //    📌 **한 칸(`brand`)에 두 가지가 섞여 있었다.** 그래서 「이름 앞이냐 딱지냐」를 이 목록으로 가른다.
  const 파는곳 = ['자연드림', '한살림', '쿠팡', '컬리', '마켓컬리', '오아시스', '네이버', '산지톡']
  // '사러가기' 버튼에 붙는 구매처 배지 라벨
  // 🏷 구매처 배지 = `curation.js` 의 `productMall` «하나»를 쓴다 (2026-09-12).
  //    ⛔ 여기에 있던 판정 60줄을 그쪽으로 «옮겼다» — 두 벌이면 한 벌은 반드시 낡는다.
  //       실제로 2026-09-10 에 한 번 갈려서 자연드림 배지 10개가 조용히 빠졌었다.
  const mallLabel = productMall
  // 🏷 딱지는 이제 **둘**이다 — 분류tag(모래) · 쇼핑몰mall(크림).
  // ⛔⛔ [2026-08-23] 「브랜드 딱지(회색)」를 **없앴다.** 2026-08-22 에 *"브랜드 딱지는 따로 달자"* 로
  //    만들었는데, 창업자가 말한 「브랜드」는 **쿠팡·컬리 같은 «파는 곳»**이었고 나는 «제조사»로 읽었다.
  //    → *"제조사는 딱지붙일필요가 없어."* · *"쇼핑몰 딱지만 붙이자."*
  //    📌 색으로 가른다고 적어놨지만 회색과 크림은 **둘 다 옅은 배경＋진한 글씨**라 실제로는 안 갈라졌다.
  //       ⭐ **「색을 달리했다」와 「구분된다」는 다른 말이다.** 눈으로 봤어야 알 수 있었다(규칙 21).
  const tagStyle = { fontSize: 16, fontWeight: 700, color: '#8a6a3e', background: 'var(--cream)', borderRadius: 6, padding: '2px 7px', flex: '0 0 auto' }
  const mallStyle = { fontSize: 16, fontWeight: 700, color: 'var(--brown)', background: 'var(--cream-deep)', borderRadius: 6, padding: '2px 7px', flex: '0 0 auto' }
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
    // 🔢 `cur-card`·`cur-buy` = 패드에서 폭을 잡으려고 붙인 이름(창업자 2026-08-13
    //    *"담기 사러가기버튼이 너무 크고, 제품설명은 다 왼쪽에 쏠려있어"*). 스타일은 styles.css 에.
    <div key={it.name} className="card cur-card" style={{ padding: '13px 13px 12px', marginBottom: 9 }}>
      {/* 🔠 [2026-08-22 창업자] *"아이콘이랑 제목을 같은 줄. 설명은 내려서 아이콘 아래로.
          그럼 글자가 더 많이 보이잖아. 아이콘은 좀 더 키우고"*
          ⭐ 설명이 아이콘 «옆」이 아니라 «아래»로 내려와 카드 폭을 다 쓴다 → 한 줄에 들어가는 글자가 늘어난다. */}
      <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
        <div className="emoji-tile" style={{ width: 58, height: 58, fontSize: 31, flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {curIcon(it.icon) ? <img src={curIcon(it.icon)} alt="" draggable={false} style={{ width: 53, height: 53, objectFit: 'contain' }} /> : it.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {/* ⛔⛔ [2026-08-23 창업자] *"장바구니 «브랜드»가 쿠팡, 컬리 이런거 말하는거야..
                «알라»는 치즈브랜드고..ㅠㅠ"* → 확정 = *"제조사는 딱지붙일필요가 없어."* · *"쇼핑몰 딱지만 붙이자."*
                ⭐ **딱지 하나가 두 가지를 말하고 있었다.** 딱지 자리 = 「어디서 사나」(쿠팡·오아시스·네이버·한살림)다.
                   제조사(알라·풀무원·오월햇살…)를 같은 자리·같은 모양으로 놓으니 «파는 곳»으로 읽힌다.
                   ⚠️ 색으로 갈라 놨었지만(회색 `--line` ↔ 크림 `--cream-deep`) **둘 다 옅은 배경＋진한 글씨**라 안 갈라졌다.
                ✅ 제조사는 **이름 앞 글자**로 — 같은 날 광고 화면에서 이미 그렇게 정했다
                   (창업자 *"레시피에 광고는 지금 좀 지저분해. 브랜드 버튼이"* → `RecipeDetailScreen.jsx:602`).
                📌 **같은 것은 같은 모양으로.** 두 화면이 브랜드를 다르게 그리면 유저는 둘을 다른 것으로 읽는다.
                ⛔ `curation.js` 의 `brand` 데이터는 **그대로 둔다** — 지우면 「이번 주 픽」 게이트가 다시 눈이 먼다
                   (v11.21 에서 이름에서 브랜드를 떼자 「자연누리 훈제오리」·「무무덕 훈제오리」가 같은 제품으로 보였다).
                   ⭐ 화면에서 «합쳐 보여주기만» 한다. */}
            <span style={{ fontSize: 21, fontWeight: 800, color: 'var(--text)' }}>
              {it.brand && !파는곳.includes(it.brand) ? `${it.brand} ${it.name}` : it.name}
            </span>
            {it.tag && <span style={tagStyle}>{it.tag}</span>}
            {mallLabel(it) && <span style={mallStyleFor(mallLabel(it))}>{mallLabel(it)}</span>}
          </div>
        </div>
      </div>
      {/* 📄 설명 — 아이콘 «아래», 카드 폭을 다 쓴다 */}
      <div style={{ marginTop: 8 }}>
          {/* 📏 설명은 «첫 줄만» 보이고 누르면 펼쳐진다 — 창업자 2026-08-05
              *"지금 6-7개까지 아래로 쭉 늘어나는게 좀 불편하지 않을까"*
              ⛔ 자르지 «않는다». 39개를 재보니 **가장 짧은 설명도 41자**(가운데 74 · 최장 127)라
                 한 줄에 들어가는 게 하나도 없고, 이 설명이 바로 큐레이션의 값어치다
                 (*"남편이 콩국수를 좋아해서…"*). 잘라내면 그냥 상품 목록이 된다.
              ⭐ 그래서 «접어만» 둔다 — 훑을 땐 짧고, 궁금하면 눌러서 한 글자도 안 빠진 전문을 본다. */}
          <button
            className="press"
            onClick={() => setOpenCard((s) => ({ ...s, [it.name]: !s[it.name] }))}
            style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: 0 }}
          >
            {/* ↩️ **[2026-08-23 창업자] *"올리고당설명줄바꿈되게"*** — 줄바꿈이 «뜻»을 갈랐다.
                🔢 실물 = 「어느 요리나 무난하게 잘 어울려요. **꽤**」 / 「오래 사용했던 템이에요」
                   → 「꽤」 한 글자만 첫 줄 끝에 매달렸다. 「꽤 오래」가 한 덩어리인데 쪼개진다.
                ⛔ 뿌리 = 브라우저 기본 줄바꿈은 **「한 줄에 최대한 채우고 넘기기」**라
                   뜻을 안 본다. ＋어제(8/22) `keep-all` 을 뿌리에 걸어 끊을 자리가 «띄어쓰기»뿐이라
                   매달림이 더 눈에 띈다.
                ✅ `text-wrap: balance` = 줄 길이를 **고르게** 나눈다 → 실측으로 문장 끝에서 끊긴다:
                   「어느 요리나 무난하게 잘 어울려요.」 / 「꽤 오래 사용했던 템이에요」
                ⛔ `pretty` 는 «마지막 줄»의 외톨이만 본다 — 여기 매달림은 첫 줄 끝이라 안 고쳐진다(실측).
                ⭐ 세 줄짜리 긴 설명(하바티치즈)은 balance 를 걸어도 «한 글자도 안 바뀐다» → 손해가 없다. */}
            <span
              className="t-sub"
              style={{
                display: openCard[it.name] ? 'block' : '-webkit-box',
                WebkitLineClamp: openCard[it.name] ? 'none' : 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                /* 🔠 [2026-08-29] 창업자 = *"장바구니 설명도 글자 1-2포인트만 작게해도 될 것 같고"*
                   → 19 → **17px**(2pt). v11.21 「글자2」가 470곳을 키울 때 여기도 같이 커졌는데,
                   설명 글은 «훑는» 글이라 제품 이름(16.5px)보다 커 보이면 무게가 뒤집힌다. */
                fontSize: 17,
                lineHeight: 1.75,
                /* ⛔⛔ [2026-09-11 창업자] *"더오담도 혼자 이상하게 줄바꿈이 되어있네. 쭉 적어줘"*
                   🔢 실물 = 「냉동실에 2개씩은 꼭 / 있어요. 아침대용으로도 / 좋고, 맛있어서 추천합니다」
                      — 폭이 남는데도 세 줄로 «고르게» 끊겼다. 옆 카드들은 꽉 차게 흐르는데 이것만 달랐다.
                   ⭐ 범인 = `textWrap: 'balance'`. 줄 길이를 맞추려고 **일부러 짧게 끊는다.**
                   ⚠️ 바로 위 주석이 *"긴 설명은 한 글자도 안 바뀐다 → 손해가 없다"* 라고 적어뒀는데
                      **짧은 설명에서는 바뀐다.** 「긴 것만 재보고 손해가 없다」고 적은 것이다 —
                      재본 범위를 결론의 범위로 삼으면 안 된다.
                   ✅ 그래서 뺐다. 이제 여느 글처럼 «쭉» 채운다. */
              }}
            >
              {it.benefit}
            </span>
            {/* 🔽🔼 [2026-08-12] 창업자 *"주부의 장바구니(접기버튼 잘보이게)"*
                ⛔ 옛 코드는 `!openCard[...]` 라 **펼친 뒤엔 「접기」가 아예 안 그려졌다.**
                   접으려면 설명 글 자체를 다시 눌러야 하는데 그걸 알려주는 표시가 없었다.
                   → 「펼치기는 보이는데 접기가 안 보인다」가 정확히 이것이다.
                ✅ 펼쳐도 «같은 자리에» 「접기」를 그린다 ＋ 화살표를 붙여 눌리는 곳임을 보인다. */}
            {/* 👆 [2026-08-29] 창업자 = *"그거랑 담기가 너무 붙어있어. 접기. 누르려다 담기를 누르게돼."*
                🔢 옛 실측 = 「더보기」 글자 아래끝 ↔ 「담기」 위끝이 **11px** 뿐이었다.
                ⭐⭐ 오터치를 막는 건 «완충 지대»다 — 아무 버튼도 아닌 «빈 공간»이라야
                   손가락이 빗나가도 아무 일이 안 난다(아래 `.cur-buy` marginTop 11 → 18).
                ⛔ 「더보기」 쪽만 키우면 안 된다 — 이 span 의 부모가 «설명 전체 버튼»이라
                   아래로 키울수록 **담기 바로 위까지 버튼 영역**이 되어 반대 사고(담기 누르려다 더보기)가 난다.
                ✅ 그래서 둘 다 조금씩 = 「더보기」는 눌리기 쉽게 살짝 키우고(paddingBottom 4),
                   그 «아래»는 빈 공간으로 벌린다 → 실제 간격 11 → **22px**. */}
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--brown)', display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 6, paddingBottom: 4 }}>
              {openCard[it.name] ? '접기' : '더보기'}
              <Icon name={openCard[it.name] ? 'chevron-up' : 'chevron-down'} size={12} />
            </span>
          </button>
      </div>
      <div className="cur-buy" style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <button className="press" onClick={() => add(it)} style={{ flex: 1, padding: '9px 0', borderRadius: 11, background: 'var(--brown)', color: '#fff', fontWeight: 800, fontSize: 16.5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><Icon name="cart" size={14} />담기</button>
        {/* ⛔ 한살림은 「사러가기」를 안 그린다 (창업자 2026-08-17). 대신 «왜 없는지»를 그 자리에 적는다 —
            버튼만 사라지면 「고장인가?」가 되고, 배지는 카드 위쪽이라 여기까지 안 따라온다. */}
        {linkFor(it)
          ? <button className="press" onClick={() => buy(it)} style={{ flex: 1, padding: '9px 0', borderRadius: 11, background: 'var(--cream)', color: 'var(--brown)', fontWeight: 800, fontSize: 16.5 }}>사러가기</button>
          : <div style={{ flex: 1, padding: '9px 0', borderRadius: 11, background: 'var(--cream)', color: 'var(--text-sub)', fontWeight: 700, fontSize: 15, textAlign: 'center', lineHeight: 1.3 }}>매장에서 만나요<br /><span style={{ fontSize: 15 }}>온라인은 조합원만</span></div>}
      </div>
    </div>
  )
  // ⭐ 「이번 주 픽」 칩에만 별을 얹는다 — 서랍(칩 줄)에서 «딱 보이게» (창업자 2026-08-31)
  //   ⛔⛔ 별이 칩 «위»로 삐져나가는데 칩 줄(`.hscroll`)이 `overflow-x: auto` 라 **잘린다.**
  //      (창업자가 첫 시안을 보고 *"잘려보이는데"* 라고 바로 잡아냈다)
  //      ✅ `styles.css` 의 `.hscroll.cur-chips` 에 **위 여백**을 주고 여기 `marginTop` 을 그만큼 줄였다
  //         → **자리는 그대로, 별만 산다.**
  //   ⛔ 별을 칩 «안»(인라인)으로 넣지 않았다 — 그러면 칩이 넓어져 다른 칩들이 밀린다.
  const chip = (key, label) => (
    <button
      key={key}
      className={`pill press ${curCat === key ? 'active' : ''}`}
      onClick={() => setCurCat(key)}
      style={key === 'pick' ? { position: 'relative', overflow: 'visible' } : undefined}
    >
      {key === 'pick' && (
        <img
          src={uiPickStar} alt="" draggable={false}
          style={{
            position: 'absolute', left: '50%', top: -16,
            transform: 'translateX(-50%) rotate(-12deg)',
            width: 34, height: 34, objectFit: 'contain',
            pointerEvents: 'none', // ⛔ 별이 칩 누르기를 가로채면 안 된다
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.18))',
          }}
        />
      )}
      {label}
    </button>
  )

  return (
    <>
      <div className="sec-head" style={{ marginTop: 6 }}>
        <div className="h-section" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><img src={uiGomShop} alt="" draggable={false} style={{ width: 28, height: 28, objectFit: 'contain', flex: '0 0 auto' }} />주부의 장바구니{/* 📅 「토」 = 매주 토요일 3개씩 새로 열린다(weeklypick.js 갓열린것 · 창업자 2026-09-07 「주부의 장바구니 토요일도 같이 달아줘」) · 홈 「이번 주」 상자의 월·수 배지와 같은 모양 */}<span className="weekly-day" aria-label="토요일마다 새로 와요">토</span></div>
        <button className="press" style={secBtnStyle} onClick={() => setOpen((v) => !v)}>{open ? '접기' : '펼치기'}</button>
      </div>
      {/* ⭐ 「계속 올라와요」를 여기로 올렸다 — 창업자 2026-08-03 *"주부의 장바구니옆에 계속 올라오다는
          문구 적어줘. (원래 지워지는 아래안내판에 있었음)"*. 아래 안내판을 빼면서 그 말만 살렸다.
          ⛔ 이 말은 지우지 말 것 — **재고가 계속 는다는 신호**라 다음에 또 들어올 이유가 된다. */}
      {/* 📏 [2026-08-23 창업자] *"주부의장바구니 설명 계속올라와요.외부쇼핑몰로이어져요 나시 줄간줄이기."*
          🔢 이 줄은 폰에서 두 줄로 흐르는데 줄간이 벌어져 «설명이 화면을 먹는다».
          ⛔ 글자 크기는 안 줄인다 — 8/21 에 「글자2」로 470곳을 키운 판정과 정면으로 부딪친다.
          ✅ 줄간(`lineHeight`)과 위아래 여백을 줄인다.
          ✅ ＋ 창업자 재판정 *"주부의장바구니 설명크기 좀 작게하자 기존크기대로 줄여도될듯"* —
             이 두 줄만 `17.5` 로 덮어쓰고 있었다. 덮어쓰기를 빼서 `.t-sub` 기본(**16px**)으로 되돌린다.
             ⭐ 새 숫자를 정하지 않는다 — 앱의 다른 설명 줄과 «같은 크기»가 곧 「기존 크기」다.
          ✅✅ ＋ **[창업자 확정 = ㄱ] *"장바구니 설명줄바꿈없이 크기작게"* → 시안 넷 중 «ㄱ».**
             🔢 재보니 **그 글 그대로는 한 줄이 안 나온다** — 칸 350px 인데 글이 507px 이라
                한 줄에 담으려면 글자를 **11px** 까지 줄여야 했다(앱 최소가 14px).
                그래서 «글자»가 아니라 **«글»을 줄이는 갈래**를 같이 뽑아 판정을 받았다.
             ✂️ 뺀 말 = 「써보고 좋은 건 나누고 싶은」 · (아래) 「외부 쇼핑몰로 이어져요 ·」
             ⛔ **「계속 올라와요」는 안 뺐다** — 위 줄에 「지우지 말 것」이라 박혀 있다(재고가 는다는 신호).
             ⛔ **「제휴」·「수수료」도 안 뺐다** — `check-affiliate.mjs` 가 그 두 낱말을 찾는다(빼면 배포가 막힌다).
             ⭐ 굵은 말에 `nowrap` — 좁은 폰에서 줄이 넘어가더라도 **덩어리는 안 갈린다**
                (실측 = 390px 은 한 줄 · 320px 은 두 줄이 되는데 그때도 「추천 아이템」이 안 쪼개진다). */}
      <div className="t-sub" style={{ fontSize: 15, marginTop: 8, marginBottom: 6, lineHeight: 1.45 }}>
        <b style={{ color: 'var(--brown)', whiteSpace: 'nowrap' }}>18년차 주부의 추천 아이템</b> · 계속 올라와요
      </div>
      {/* 💰 제휴(대가성) 고지 — **박스를 빼고 한 줄로 줄였다** (2026-08-03, 창업자 지시 두 번)
          ⒜ *"아래위로 좀 지저분해보여"* → 크림 박스를 없앴다
          ⒝ *"근데 쿠팡 그거는 붙이는게 좋을 것 같아. **사람들이 오해할 수있어. 고지없이 수수료받는 줄..**"*
             → ⭐**맞는 판단이다.** 쿠팡 링크가 34개나 보이는데 아무 말이 없으면
                「안 받는다」가 아니라 **「말 안 하고 받는다」로 읽힌다.** 없는 게 오히려 의심을 산다.
          ⛔ 이 줄을 지우지 말 것. 지우면 `scripts/check-affiliate.mjs` 가 배포를 막는다(제휴 링크가 있을 때).

          ⭐⭐ **[2026-09-08] 「받아도」 → 「받아요」로 갈았다 — 이제 «진짜로» 받기 때문이다.**
             📮 창업자 확정 문구 = *"쿠팡 파트너스 활동으로 일정액의 수수료를 받아요 · 값은 그대로예요"*
             🔎 왜 갈았나 = 공정위 「추천·보증 등에 관한 표시·광고 심사지침」(2023-12-01 시행 개정판)이
                **「지급받을 수 있음」 같은 조건부·불확정 표현을 «부적절 예시»로 콕 집었다.**
                「받아도」는 «가정»으로 읽혀 「지금 받는다」는 사실이 안 드러난다 → 확정형이라야 한다.
             📌 쿠팡 파트너스 «최종» 승인 심사도 **이 문구가 보이는 스크린샷**을 요구한다.
             ⛔ 여기서 「쿠팡 파트너스」·「수수료」·「받아요」를 빼지 말 것 —
                `check-affiliate.mjs` 가 그 셋을 찾고, 조건부 표현이 다시 들어오면 배포를 막는다. */}
      <div className="t-sub" style={{ fontSize: 15, marginTop: 0, marginBottom: 12, lineHeight: 1.45 }}>
        {/* ⭐ 굵은 말에 `nowrap` — 좁은 폰에서 줄이 넘어가도 「쿠팡 파트너스」 덩어리는 안 갈린다 */}
        <b style={{ color: 'var(--brown)', whiteSpace: 'nowrap' }}>쿠팡 파트너스 활동으로</b> 일정액의 수수료를 받아요 · 값은 그대로예요
      </div>
      {/* 💰💰 [2026-09-08] 쿠팡 파트너스 «표준 문구» — 📮창업자 = *"쿠팡은 파트너스링크야"*
          ⭐ 오늘 `link.coupang.com` 파트너스 링크가 앱에 «처음» 들어왔다(리오마레·퍼시피카나).
             그 전 69개는 파트너스가 아니라 맨 `coupang.com` 주소였다 — **성격이 다르다.**
          📄 문구는 내가 지어낸 게 아니다 — `docs/쿠팡-링크-전수-2026-09-05.md` 151줄에
             *「최종 승인 스샷 = ①고지 문구가 보이는 화면 ②link.coupang.com 이 보이는 화면
               → 우리 앱은 둘 다 없다」* 라고 적혀 있고, 오늘 ②가 생겼으니 ①을 채운다.
          ⛔ 윗줄(「값은 그대로예요」)을 지우지 않는다 — 그건 «유저를 안심시키는» 말이고
             이 줄은 «심사·공정위가 요구하는» 말이다. 하는 일이 서로 다르다.
          ⚠️ 한 줄이 늘어난다 — 창업자가 2026-08-03 에 *"아래위로 좀 지저분해보여"* 로 박스를 뺐던 자리라
             글자를 13px·연한 색으로 낮춰 «읽히되 안 튀게» 뒀다. 미감 판정은 창업자 몫이다. */}
      <div className="t-sub" style={{ fontSize: 13, marginTop: -6, marginBottom: 12, lineHeight: 1.4, opacity: 0.75 }}>
        한끼는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
      </div>

      {open && (
        <>
          {/* 🔍 찾기 — 제품이 늘어도 «길이가 안 느는» 유일한 길. 초성도 된다(ㄱㅈ→간장) */}
          <div className="searchbar" style={{ marginBottom: 10 }}>
            <Icon name="search" size={18} color="var(--text-sub)" />
            <input value={curQ} onChange={(e) => setCurQ(e.target.value)} placeholder="찾기 · 이름이나 초성(ㄱㅈ)" autoComplete="off" />
            {curQ && (
              <button className="press" onClick={() => setCurQ('')} aria-label="지우기">
                <Icon name="x" size={17} color="var(--text-sub)" />
              </button>
            )}
          </div>

          {/* 카테고리 칩 — 기본은 '이번 주 픽', 필요한 카테고리만 펼쳐 본다 (찾는 중엔 감춘다)
              🔢 `cur-chips` = 패드에서 «줄바꿈»으로 바꾸려고 붙인 이름 (창업자 2026-08-13 *"장보기 잘림"*).
                 좌우 2단이 되면서 왼쪽 칸이 좁아져 마지막 칩이 반쯤 잘려 보였다. 스타일은 styles.css 에. */}
          {/* ⭐ marginTop 16 → 0 — 「이번 주 픽」 별이 설 자리를 `.hscroll.cur-chips` 의 위 패딩(20px)이 만든다.
              둘을 맞바꾼 것이라 **칩 줄이 서는 자리는 그대로다**(16+2 ≈ 20). */}
          <div className="hscroll cur-chips" style={{ marginTop: 0, paddingBottom: 4, marginBottom: 4, display: curQuery ? 'none' : undefined }}>
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
          {curQuery ? (
            found.length ? (
              <>
                <div className="t-sub" style={{ fontSize: 15.5, margin: '0 2px 10px' }}>‘{curQuery}’ — {found.length}개</div>
                {found.map((it) => Card(it))}
              </>
            ) : (
              <div className="empty">{'찾는 재료가 없어요.\n이름이나 초성(ㄱㅈ)으로 찾아보세요.'}</div>
            )
          ) : curCat === 'pick'
            ? (
              <>
                {/* 🐻 [창업자 2026-08-17] *"스티커도 하나 달아주면 좋을 것 같아(이번주픽에)"*
                    ⭐ 픽엔 원래 «소제목이 없어» 카드만 나열됐다 → 다른 갈래와 «같은 문법»으로 소제목 줄을 만들고 거기 붙인다.
                    ⛔ `gom_shop` 은 이 화면 헤더(「주부의 장바구니」)에 이미 있다 — 한 화면에 같은 곰이 두 번이면 어색하다.
                    ✅ `gom_thumbsup`(엄지척) = 「이번 주 픽 ＝ 내가 고른 추천」이라는 뜻이 그대로 읽힌다. */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 17, fontWeight: 800, color: 'var(--brown)', margin: '16px 2px 14px' }}>
                  <img src={uiGomThumb} alt="" draggable={false} style={{ width: 30, height: 30, objectFit: 'contain' }} />
                  이번 주 픽
                </div>
                {picks.map((it) => Card(it))}
              </>
            )
            : byGroup.map((G) => {
                const total = G.cats.reduce((s, c) => s + c.items.length, 0)
                // ⛔⛔ 2026-08-05 — 예전엔 큰 칸을 «직접 고르면» 안 접었다(«보려고 고른 것»이라 봤다).
                //   창업자: *"근데 목록이 늘어나면 이것도 제일 좋은 방법은 아니야"* — 맞는 지적이다.
                //   ⭐ 칸에 제품이 13개면 **그 칸도 훑는 화면이다.** 안 접으면 제품을 올릴수록 영영 길어진다.
                //
                // ⛔⛔⛔ **그런데 내가 v9.71 에서 «자르기만 하고 더보기를 안 달았다».**
                //   창업자 2026-08-05: *"올리브오일 250ml짜리는 목록에서 사라졌어."* — 사라진 게 아니라
                //   큰 칸을 고른 화면에서 5개로 잘렸는데 **더보기 버튼이 「전체」에서만 그려져** 볼 길이 없었다.
                //   📌 **자르는 코드와 더보기 코드가 서로 다른 조건을 봤다.** 자를 땐 반드시 꺼낼 길을 같이 단다.
                //
                // ⭐ 이제 층을 나눈다 (창업자 *"전체탭에서는 2개씩 … 간장, 된장 등등 2개씩만 넣고 더보기"*)
                //   ·「전체」  = 훑는 화면 → **큰 칸 통째로 2개** ＋ 큰 칸 더보기
                //   · 큰 칸  = 고른 화면 → **소칸(간장·된장)마다 2개** ＋ 소칸마다 더보기
                //   두 화면에서 「2개」의 «단위»가 다르다 — 전체에서 소칸마다 2개면 23칸 × 2 = 오히려 길어진다.
                //
                // ⛔ 그래도 아직 길었다 — 창업자 *"양념류가 9줄이야. 양념류도 3개정도만 보이고 아래 더보기로
                //    정리(나머지 기름육수 고기등등..)다 이렇게 가자."* **9줄 = 소칸 9개**가 맞다
                //    (간장·된장·맛술·굴소스·액젓·소금·설탕·소스·고춧가루).
                //    📌 **제품을 줄여도 «칸 이름»이 줄줄이 남으면 화면은 그대로 길다.** 줄 단위로도 상한을 둔다.
                //    → 큰 칸을 골라도 **소칸 3개까지** ＋ 「양념 6개 더보기」.
                const whole = curCat === '전체'
                const gOn = openG[`g:${G.name}`]
                const cats = whole
                  ? (gOn || total <= FOLD ? G.cats : take(G.cats, FOLD))
                  : (gOn || G.cats.length <= CATFOLD ? G.cats : G.cats.slice(0, CATFOLD))
                const more = (label, n, key) => (
                  // ⭐ 「몇 개가 더 있는지」를 숫자로 적는다 — 「더보기」만 있으면 누를지 말지 못 정한다
                  <button
                    className="press"
                    onClick={() => setOpenG((s) => ({ ...s, [key]: !s[key] }))}
                    style={{ width: '100%', padding: '9px 0', marginBottom: 4, borderRadius: 11, background: 'var(--surface)', border: '1px solid var(--line)', color: 'var(--brown)', fontWeight: 800, fontSize: 16 }}>
                    {openG[key] ? `${label} 접기` : `${label} ${n}개 더보기`}
                  </button>
                )
                return (
                  <div key={G.name}>
                    {cats.map((g) => {
                      const cOn = openG[`c:${G.name}·${g.cat}`]
                      const items = whole || cOn ? g.items : g.items.slice(0, FOLD)
                      return (
                        <div key={g.cat}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 15.5, fontWeight: 800, color: 'var(--brown)', margin: '12px 2px 7px' }}>
                            {curIcon(g.icon) ? <img src={curIcon(g.icon)} alt="" draggable={false} style={{ width: 22, height: 22, objectFit: 'contain' }} /> : <span>{g.emoji}</span>}
                            {g.cat}
                          </div>
                          {items.map((it) => Card({ ...it, cat: g.cat, emoji: g.emoji, icon: it.icon || g.icon }))}
                          {!whole && g.items.length > FOLD && more(g.cat, g.items.length - FOLD, `c:${G.name}·${g.cat}`)}
                        </div>
                      )
                    })}
                    {whole
                      ? total > FOLD && more(G.name, total - FOLD, `g:${G.name}`)
                      : G.cats.length > CATFOLD && more(G.name, G.cats.length - CATFOLD, `g:${G.name}`)}
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
    // 📊 [2026-09-12] 담았다 — 직접 입력해서 담는 길도 «담기»다.
    장보기담음()
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
        <button type="button" className={`seg ${f.iconType === 'icon' ? 'on' : ''}`} style={{ flex: 1, padding: 8, fontSize: 15.5 }} onClick={() => setF((p) => ({ ...p, iconType: 'icon' }))}>아이콘</button>
        <button type="button" className={`seg ${f.iconType === 'emoji' ? 'on' : ''}`} style={{ flex: 1, padding: 8, fontSize: 15.5 }} onClick={() => setF((p) => ({ ...p, iconType: 'emoji' }))}>이모지</button>
        <button type="button" className={`seg ${f.iconType === 'label' ? 'on' : ''}`} style={{ flex: 1, padding: 8, fontSize: 15.5 }} onClick={() => setF((p) => ({ ...p, iconType: 'label' }))}>글자</button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {!isNew && (
          <button className="press" onClick={() => { store.removeShop(shop.id); onClose() }} style={{ padding: '11px 14px', borderRadius: 12, background: 'var(--cream)', color: 'var(--danger)', fontWeight: 600, fontSize: 16 }}>삭제</button>
        )}
        <button className="press" onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 12, background: 'var(--cream)', color: 'var(--text-sub)', fontWeight: 600, fontSize: 16 }}>취소</button>
        <button className="press" onClick={save} style={{ flex: 1, padding: 11, borderRadius: 12, background: 'var(--brown)', color: '#fff', fontWeight: 600, fontSize: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><Icon name="check" size={14} />{isNew ? '추가' : '저장'}</button>
      </div>
    </div>
  )
}
