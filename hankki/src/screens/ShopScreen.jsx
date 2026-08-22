import { useState } from 'react'
import { COACH } from '../coach'
import { useStore, newId } from '../store'
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
import { CURATION, curIcon, weeklyPicks, isHansalim } from '../data/curation'
import { weeklyNow, todayKST } from '../data/weekly'

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
          <img src={uiPengShop} alt="" draggable={false} width={34} height={45} className="hk-m-tongtong"
            style={{ display: 'block', objectFit: 'contain', margin: '-6px 0' }} />
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
          <button type="button" className={`seg ${view === 'pantry' ? 'on' : ''}`} data-coach="pantry" onClick={() => setView('pantry')}>냉장고</button>
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
                <button className="press mini-buy" onClick={() => openUrl(buyUrlFor(it, shops))}>
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
          <div className="t-sub" style={{ fontSize: 16.5, marginTop: 9, lineHeight: 1.55 }}>
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

  // '사러가기' 연결: url 이 있으면 그 직접 링크로, mall 이 있으면 그 쇼핑몰 검색으로,
  // 없으면 무엇이든 잘 찾는 네이버쇼핑 통합검색으로.
  const MALL_SEARCH = {
    coupang: 'https://www.coupang.com/np/search?q={q}',
    oasis: 'https://www.oasis.co.kr/product/search?keyword={q}',
    naver: 'https://search.shopping.naver.com/search/all?query={q}',
  }
  // 쇼핑몰 검색으로 연결. (설치 PWA 안에서 외부 '앱' 강제 열기는 브라우저 제어라 불안정 →
  //  쿠팡 앱 직접 열기는 정식 TWA 출시 때 다시. 지금은 웹 검색이 안정적.)
  // ⛔ 한살림은 **빈 문자열** = 「사러가기를 안 그린다」 (창업자 2026-08-17 *"링크안달면되고"*)
  //   ⚠️ 폴백을 타면 한살림 제품을 네이버에서 찾게 되므로 «맨 먼저» 걸러 낸다.
  const linkFor = (it) =>
    isHansalim(it) ? '' : it.url || (MALL_SEARCH[it.mall] || MALL_SEARCH.naver).replace('{q}', encodeURIComponent(it.q))
  const buy = (it) => openUrl(linkFor(it))
  const add = (it) => {
    // ⭐ 담는 건 그대로 된다 — 매장에 갈 때 «적어두는 것»은 여전히 쓸모가 있다.
    //   다만 `noBuy` 를 같이 담아 **리스트에서도** 사러가기를 안 그린다.
    //   ⛔ 이게 없으면 `buyUrlFor()` 가 url 없는 줄을 쿠팡·네이버 검색으로 보낸다(＝링크 뺀 게 헛일).
    store.addShopItem({ name: it.name, url: linkFor(it), ...(isHansalim(it) ? { noBuy: true } : {}) })
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
    //   🌱 2026-08-17 부터 **사러가기를 아예 안 단다** → 그래서 「조합원만」이 아니라 «전용»이라고 못 박는다.
    //      ⛔ 판정을 `url` 로 하면 안 된다 — url 을 뺐으니 영영 안 걸린다(`mall` 표식으로).
    if (isHansalim(it)) return '한살림 · 조합원 전용'
    if (u.includes('sanjitalk')) return '산지톡'
    if (u.includes('smartstore.naver')) return '네이버'
    return ''
  }
  // 🏷 [2026-08-22 창업자] *"브랜드 딱지는 따로 달자 · 제목에서 빼고"* — 셋을 색으로 가른다:
  //    브랜드(회색) · 분류tag(모래) · 쇼핑몰mall(크림). ⛔같은 색이면 무엇을 말하는 딱지인지 모른다.
  const brandStyle = { fontSize: 15.5, fontWeight: 700, color: 'var(--text-sub)', background: 'var(--line)', borderRadius: 6, padding: '2px 7px', flex: '0 0 auto' }
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
      <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
        <div className="emoji-tile" style={{ width: 58, height: 58, fontSize: 31, flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {curIcon(it.icon) ? <img src={curIcon(it.icon)} alt="" draggable={false} style={{ width: 53, height: 53, objectFit: 'contain' }} /> : it.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {it.brand && it.brand !== mallLabel(it) && <span style={brandStyle}>{it.brand}</span>}
            <span style={{ fontSize: 19, fontWeight: 800, color: 'var(--text)' }}>{it.name}</span>
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
            <span
              className="t-sub"
              style={{
                display: openCard[it.name] ? 'block' : '-webkit-box',
                WebkitLineClamp: openCard[it.name] ? 'none' : 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                fontSize: 17.5,
                lineHeight: 1.58,
              }}
            >
              {it.benefit}
            </span>
            {/* 🔽🔼 [2026-08-12] 창업자 *"주부의 장바구니(접기버튼 잘보이게)"*
                ⛔ 옛 코드는 `!openCard[...]` 라 **펼친 뒤엔 「접기」가 아예 안 그려졌다.**
                   접으려면 설명 글 자체를 다시 눌러야 하는데 그걸 알려주는 표시가 없었다.
                   → 「펼치기는 보이는데 접기가 안 보인다」가 정확히 이것이다.
                ✅ 펼쳐도 «같은 자리에» 「접기」를 그린다 ＋ 화살표를 붙여 눌리는 곳임을 보인다. */}
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--brown)', display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
              {openCard[it.name] ? '접기' : '더보기'}
              <Icon name={openCard[it.name] ? 'chevron-up' : 'chevron-down'} size={12} />
            </span>
          </button>
      </div>
      <div className="cur-buy" style={{ display: 'flex', gap: 8, marginTop: 11 }}>
        <button className="press" onClick={() => add(it)} style={{ flex: 1, padding: '9px 0', borderRadius: 11, background: 'var(--brown)', color: '#fff', fontWeight: 800, fontSize: 16.5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><Icon name="cart" size={14} />담기</button>
        {/* ⛔ 한살림은 「사러가기」를 안 그린다 (창업자 2026-08-17). 대신 «왜 없는지»를 그 자리에 적는다 —
            버튼만 사라지면 「고장인가?」가 되고, 배지는 카드 위쪽이라 여기까지 안 따라온다. */}
        {linkFor(it)
          ? <button className="press" onClick={() => buy(it)} style={{ flex: 1, padding: '9px 0', borderRadius: 11, background: 'var(--cream)', color: 'var(--brown)', fontWeight: 800, fontSize: 16.5 }}>사러가기</button>
          : <div style={{ flex: 1, padding: '9px 0', borderRadius: 11, background: 'var(--cream)', color: 'var(--text-sub)', fontWeight: 700, fontSize: 15, textAlign: 'center', lineHeight: 1.3 }}>매장에서 만나요<br /><span style={{ fontSize: 15 }}>온라인은 조합원만</span></div>}
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
      <div className="t-sub" style={{ fontSize: 16.5, marginTop: -2, marginBottom: 6 }}>
        써보고 좋은 건 나누고 싶은 <b style={{ color: 'var(--brown)' }}>18년차 주부의 추천 아이템</b> · 계속 올라와요
      </div>
      {/* 💰 제휴(대가성) 고지 — **박스를 빼고 한 줄로 줄였다** (2026-08-03, 창업자 지시 두 번)
          ⒜ *"아래위로 좀 지저분해보여"* → 크림 박스를 없앴다
          ⒝ *"근데 쿠팡 그거는 붙이는게 좋을 것 같아. **사람들이 오해할 수있어. 고지없이 수수료받는 줄..**"*
             → ⭐**맞는 판단이다.** 쿠팡 링크가 34개나 보이는데 아무 말이 없으면
                「안 받는다」가 아니라 **「말 안 하고 받는다」로 읽힌다.** 없는 게 오히려 의심을 산다.
          ⛔ 이 줄을 지우지 말 것. 지우면 `scripts/check-affiliate.mjs` 가 배포를 막는다(제휴 링크가 있을 때).
          ⚠️ 제휴를 «시작하면» 이 문장을 사실에 맞게 고쳐야 한다 — 「받지 않아요」가 그대로면 거짓이 된다. */}
      <div className="t-sub" style={{ fontSize: 16.5, marginTop: -2, marginBottom: 8, lineHeight: 1.5 }}>
        ‘사러가기’는 외부 쇼핑몰로 이어져요 · 나중에 <b style={{ color: 'var(--brown)' }}>제휴가 연결되면 한끼가 수수료를 받아요</b> · 사는 값은 늘 정가 그대로예요
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
          <div className="hscroll cur-chips" style={{ paddingBottom: 4, marginBottom: 4, display: curQuery ? 'none' : undefined }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 15.5, fontWeight: 800, color: 'var(--brown)', margin: '2px 2px 8px' }}>
                  <img src={uiGomThumb} alt="" draggable={false} style={{ width: 26, height: 26, objectFit: 'contain' }} />
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
