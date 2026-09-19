import { createContext, useContext, useEffect, useReducer, useCallback, useRef } from 'react'
import { seedRecipes, 열린때 } from './data/seed'
import { basicRecipes, allBasicRecipes, BASICS_VERSION } from './data/basics'
// 🥬 재료 이름 → 파트너스 링크 (2026-09-12 창업자 *"장보기에 들어가는 것도 다 붙이자"*)
//   ⭐ **담는 길이 여기 하나로 모인다** — 레시피 「재료 담기」·장보기 자유 입력·어디서 담든
//      이 자리를 지나므로, 링크를 여기서 붙이면 화면마다 따로 손댈 곳이 없다.
import { ingLink, 담을만한가 } from './data/ingLinks'
import { todayKST } from './today'
import { makeSampleDiary, SAMPLE_DIARY_ID, SAMPLE_READY } from './data/sampleDiary'
// ⛔ `FOOD_ICON_GROUPS` 를 빠뜨리면 v96 패스가 ReferenceError 로 죽고
//    **그 앞의 v13·v34·v38·v88 마이그레이션까지 통째로 안 돈다**(같은 함수 안이라서).
//    ⚠️ 빌드는 «통과한다» — 런타임 에러라서. 2026-08-29 에 실제로 그랬고 스모크가 잡았다.
import { guessFoodIcon, FOOD_ICON_GROUPS } from './components/FoodIcon'
import { cleanMemo, mergeQtyOnlyIngredients } from './parseRecipe'
import { politeSteps, politeFormalSteps } from './polish'
import { pickPaper } from './memoPaper'
// 🗄 사진은 「큰 창고」로 — 서랍(localStorage 5MB)엔 글자만 남긴다
import { 나누기, 여럿넣기, 지우기 as 창고에서지우기, 쪽지열쇠모으기, 열쇠들 as 창고열쇠들 } from './photoStore'
// 🪞🍎 아이폰 «앱» 안에서만 — 저장될 때마다 폰 문서 폴더에 거울을 예약한다(앱 밖이면 0 비용 · 2026-09-08 큰 틀 5)
import { 거울예약 } from './mirror'

const KEY = 'hankki:v1'
// 💾💾 **「저장이 진짜로 됐나」 — 화면이 물어볼 수 있게 밖으로 낸다** (창업자 확정 2026-09-02)
//   📮 창업자 = *"방금 하나 저장한거 흔적도 없이 증발함"* · *"채우고 있다고 했는데 레시피는 없어"*
//   ⛔⛔ 뿌리 = 아래 `catch` 가 저장 실패를 «삼켰다». 메모리엔 그대로라 화면은 「저장됐다」고 말하고,
//      다시 그리는 순간 사라진다. ＋ 60초 침묵 때문에 두 번째부터는 **안내조차 없었다.**
//   ⭐ 그래서 값을 «두 개» 둔다 — 마지막으로 저장이 «성공/실패»한 시각.
//      화면(편집 저장 등)이 저장 뒤에 이걸 보고 «성공이라 말할지»를 정한다.
export let 마지막저장실패 = 0
export let 마지막저장성공 = 0

// 📊📊 **서랍 계기판** — 「지금 얼마나 찼나」를 «쓰기 직전»에 재서 여기 남긴다 (2026-09-02)
//   🔢 창업자 폰 2026-09-02 = **4.56MB / 5MB = 91%** 였고, 그날 아침 레시피 하나를 잃었다.
//   ⛔⛔ **`navigator.storage.estimate()` 로는 이 벽을 «못 잰다»** — localStorage 를 안 센다
//      (실측 `_probe-계기판-0902`: 1MB 를 넣어도 0KB). 그걸로 재면 **터지는 순간에도 「3%」**라고 말한다.
//   ⭐ 그래서 벽이 «둘»이고 계기판도 «둘»이다 — ①서랍 = 여기(글자 수) ②창고 = `estimate()`
export const 서랍한도 = 5 * 1024 * 1024   // 브라우저마다 다르지만 제일 좁은 쪽(iOS ~5MB)에 맞춘다
export let 서랍글자수 = 0
let 마지막경고 = 0
/** 서랍이 몇 % 찼나 (0~1). 화면이 이걸로 「저장 공간」 줄을 그린다. */
export function 서랍찬비율 () { return Math.min(1, 서랍글자수 / 서랍한도) }
/** 서랍을 «지금» 다시 잰다.
 *  ⛔ 앱을 켜고 아직 한 번도 «쓰지» 않았으면 `서랍글자수` 가 0 이라 화면이 **「0%」라고 거짓말**을 한다.
 *     설정 화면처럼 «보여주기 전»에 이걸 한 번 부른다. */
export function 서랍다시재기 () {
  try { 서랍글자수 = (localStorage.getItem(KEY) || '').length } catch { /* 못 읽으면 마지막에 쓴 값을 그대로 쓴다 */ }
  return 서랍글자수
}
// ⛔ 「방금 저장이 됐나」 — 기준 시각 «뒤»에 성공이 찍혔는지 본다.
//    ⚠️ 실패가 안 찍혔다고 «성공»이라 하지 않는다(아직 안 돌았을 수도 있다 · 규칙 18 ⓘ).
export function 방금저장됐나(기준) {
  if (마지막저장실패 >= 기준) return false
  return 마지막저장성공 >= 기준
}
const PROFILE_DEFAULT = { name: '한끼러버', bio: '맛있는 한 끼로 행복한 하루 :)' }

// 장보기 쇼핑몰 바로가기 기본 목록. url = 홈, search = 재료 검색(‘{q}’에 재료명 치환).
// 나중에 제휴(어필리에이트) 태그를 이 url/search에 붙이면 그대로 수수료 링크가 됨.
// iconType: 'emoji' | 'label'(글자 타일). 재료 아이콘과 동일한 방식.
// 🏪🏪 식비 「가서 보고 와서 적기」 기본 목록 (창업자 확정 2026-09-17 = *"쿠팡 컬리 네이버쇼핑, 롯데마트 이마트, 쿠팡츠 배민 요기요 정도면 될까"*)
//   ⭐ 유저가 «편집으로 더하고 지운다» — 자주 쓰는 곳은 «누른 순서»로 저절로 앞에 온다(손으로 끌어 옮기지 않아도 된다).
//   🛒 쿠팡은 **파트너스 링크가 아니라 그냥 주소**다 — 누르면 24시간 개인 구매가 실적에 섞이기 때문(절대원칙 2026-09-15).
//      ⏳ 유저에게 열 때 파트너스 링크로 바꾼다(창업자 *"유저들은 링크로. 그래야 우리도 수익이 나지"*) — 단축코드는 창업자가 만든다.
//   ⚠️ 주소는 2026-09-17 에 찾아 적었다. 이 환경은 사람이 보는 웹을 못 열어 «눌러보진 못했다» — 틀리면 편집으로 고친다.
const 기본식비가게 = [
  // 🛒 [창업자가 준 단축코드 2026-09-18] 쿠팡 홈 파트너스 링크 — 유저가 누르면 «우리 수익»이 된다.
  //    ⛔ 창업자 폰에서는 `파트너스문()` 이 그냥 쿠팡 주소로 바꿔 보낸다(24시간 규칙에 안 걸리게).
  //    ⛔ 링크는 코드가 못 만든다 — 규칙 없는 단축코드라 «받아서» 박는다(`ingLinks.js` 와 같다).
  { id: 'cs_coupang', name: '쿠팡', url: 'https://link.coupang.com/a/g8XUHyeW96', k: 'shop' },
  { id: 'cs_kurly', name: '마켓컬리', url: 'https://www.kurly.com', k: 'shop' },
  { id: 'cs_naver', name: '네이버쇼핑', url: 'https://shopping.naver.com', k: 'shop' },
  { id: 'cs_lottemart', name: '롯데마트', url: 'https://lottemartzetta.com', k: 'shop' },
  { id: 'cs_emart', name: '이마트몰', url: 'https://emart.ssg.com', k: 'shop' },
  // 🌱 [창업자 2026-09-18] 자연드림 — ⛔대표(icoop.or.kr)가 아니라 «장보기몰» 주소다.
  //    📮 창업자 = *"자연드림은 장보기링크를 따로 따야해 지금은 대표로 들어사져"* → 그 자리에서 주소를 받았다.
  { id: 'cs_icoop', name: '자연드림', url: 'https://icoop.or.kr/coopmall/shopMain.phtm', k: 'shop' },
  { id: 'cs_eats', name: '쿠팡이츠', url: 'https://www.coupangeats.com', k: 'out' },
  { id: 'cs_baemin', name: '배달의민족', url: 'https://baemin.com', k: 'out' },
  { id: 'cs_yogiyo', name: '요기요', url: 'https://www.yogiyo.co.kr/mobile/', k: 'out' },
]

const DEFAULT_SHOPS = [
  { id: 'coupang', name: '쿠팡', icon: 'box', iconType: 'icon', url: 'https://www.coupang.com', search: 'https://www.coupang.com/np/search?q={q}' },
  { id: 'kurly', name: '마켓컬리', icon: 'bag', iconType: 'icon', url: 'https://www.kurly.com', search: 'https://www.kurly.com/search?sword={q}' },
  { id: 'ssg', name: '이마트몰', icon: 'cart', iconType: 'icon', url: 'https://emart.ssg.com', search: 'https://emart.ssg.com/search.ssg?query={q}' },
  { id: 'naver', name: '네이버쇼핑', icon: 'store', iconType: 'icon', url: 'https://shopping.naver.com', search: 'https://search.shopping.naver.com/search/all?query={q}' },
  { id: 'oasis', name: '오아시스', icon: 'basket', iconType: 'icon', url: 'https://www.oasis.co.kr', search: 'https://www.oasis.co.kr/product/search?keyword={q}' },
  // ⚠️ 한살림 온라인 장보기는 **조합원만** 산다 — 가입비 3천원 ＋ 출자금 3만원(탈퇴 때 돌려받음).
  //    비조합원은 «매장에서만» 살 수 있고 값이 10% 비싸다. (한살림 공식 안내 · 2026-08-03 확인)
  { id: 'hansalim', name: '한살림', icon: 'sprout', iconType: 'icon', note: '조합원 전용', url: 'https://shop.hansalim.or.kr/shopping/spMain.do', search: 'https://shop.hansalim.or.kr/shopping/spMain.do' },
  // ⭐ 자연드림(아이쿱)은 **조합원이 아니어도 온라인에서 산다**(일반가). 조합원이면 할인가.
  //    창업자 2026-08-03: *"자연드림은 일반소비자도 가능하다고 적어주고."*
  { id: 'naturedream', name: '자연드림', icon: 'basket', iconType: 'icon', url: 'https://www.icoop.or.kr', search: 'https://www.icoop.or.kr' },
]

function migrateShopping() {
  try {
    return JSON.parse(localStorage.getItem('hankki:shopping')) || []
  } catch {
    return []
  }
}

// 위시(사고 싶은 재료)를 장보기 리스트로 흡수 — 두 리스트가 사실상 같은 '살 것' 목록이라
// 하나로 합친다(1회성). 이름·사러가기 링크·완료여부는 보존, 이름 중복은 건너뛴다.
function foldWishIntoShopping(wishlist = [], shoppingList = []) {
  if (!Array.isArray(wishlist) || wishlist.length === 0) return shoppingList
  const names = new Set(shoppingList.map((i) => i.name))
  const folded = wishlist
    .filter((w) => w && w.name && !names.has(w.name))
    .map((w) => ({ id: w.id || newId(), name: w.name, done: !!w.bought, url: w.url || undefined }))
  return [...folded, ...shoppingList]
}

// 기존 사용자의 기본 쇼핑몰(예전 알록달록 이모지)을 새 커스텀 아이콘으로 업그레이드.
// 예전 데이터는 iconType 필드가 아예 없고 emoji 만 있었다({id,name,emoji}). 그래서
// iconType 이 없거나('emoji' 이하) 인 경우 모두 아이콘으로 올린다. 사용자가 직접
// '아이콘'/'글자'로 바꾼 것(iconType==='icon'|'label')은 존중해 건드리지 않는다.
const SHOP_ICON_UPGRADE = { coupang: 'box', kurly: 'bag', ssg: 'cart', naver: 'store', oasis: 'basket' }
function migrateShops(shops) {
  if (!Array.isArray(shops) || shops.length === 0) return DEFAULT_SHOPS
  const up = shops.map((s) =>
    SHOP_ICON_UPGRADE[s.id] && s.iconType !== 'icon' && s.iconType !== 'label'
      ? { ...s, iconType: 'icon', icon: SHOP_ICON_UPGRADE[s.id] }
      : s
  )
  // ⭐ 「자연드림」을 «한 번만» 뒤에 붙인다 (2026-08-03 신설).
  //    ⚠️ 기존 유저는 자기 목록이 저장돼 있어서 `DEFAULT_SHOPS` 를 안 읽는다 — 안 붙이면 **새 유저만** 본다.
  //    ⛔ 유저가 지웠으면 다시 안 붙인다 → 그래서 「붙인 적 있음」 표시를 남긴다(한 번만 시도).
  const ADDED = 'hankki:shops:naturedream'
  try {
    if (!up.some((s) => s.id === 'naturedream') && !localStorage.getItem(ADDED)) {
      localStorage.setItem(ADDED, '1')
      return [...up, DEFAULT_SHOPS.find((s) => s.id === 'naturedream')]
    }
  } catch { /* 저장 못 하면 그냥 넘어간다 — 다음에 또 시도해도 해롭지 않다 */ }
  return up
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || !Array.isArray(data.recipes)) return null
    return data
  } catch {
    return null
  }
}

// 기존 사용자에게 기본 제공 레시피를 '한 번만' 넣어준다.
// seedV(버전)와 removedSeedIds(지운 것 기록) 덕분에, 사용자가 지운 기본 레시피는
// 앞으로 버전이 올라가도 절대 되살아나지 않는다.
// 기본 레시피에 새로 생긴 표지 사진(id → image URL)
const BASIC_PHOTOS = Object.fromEntries(
  basicRecipes.filter((r) => r.thumb === 'photo' && r.image).map((r) => [r.id, r.image])
)
function migrateBasics(saved) {
  const v = saved.seedV || 0
  const have = new Set(saved.recipes.map((r) => r.id))
  // 🏷🏷 제목 중복 막기 — **「우리가 깐 것」끼리만** 본다. (창업자 확정 2026-08-15 「둘 다 놓기」)
  //
  // 📮 창업자 *"나 레시피가 저장되어있는데(재료만 넣었잖아) **우리 레시피 하나씩 올라올때 내꺼도
  //    반영되게 못해?** 테스트를 해봐야 하는데 이미 레시피있어서 내레시피는 예전꺼니까 테스트를 할 수가 없어"*
  //
  // ⛔⛔ 전엔 **저장된 «모든» 레시피의 제목**을 모았다. 그래서 —
  //    유저가 「감바스」를 **재료만 적어** 자기 레시피로 저장해 두면,
  //    나중에 우리가 「감바스」를 정식으로 올려도 **제목이 같아서 «영영» 안 들어왔다.**
  //    → 유저는 계속 «재료만 있는 자기 메모»를 보고, 우리가 쓴 만드는 법·시간·메모를 **볼 수가 없다.**
  //    📌 창업자가 자기 레시피 100여 편을 문서로 줘서 그걸로 주간 레시피를 썼기 때문에
  //       **창업자 폰에서 이 일이 가장 크게 났다.**
  //
  // ⭐ 이 줄의 «원래» 뜻은 「예전 예시의 김치볶음밥 등과 중복 방지」 = **옛 시드 ↔ 새 시드**다.
  //    `basic-` 만 보면 그 뜻은 그대로 지켜지고, **유저가 쓴 것은 우리 판을 안 막는다.**
  //
  // ✅ 그래서 같은 제목이어도 **둘 다 놓는다** — 배지로 갈린다(「내 레시피」 ↔ 「한끼」).
  //    ⭐⭐ **유저가 쓴 것은 한 글자도 안 건드린다.** 확인하고 본인이 지우면 된다.
  //    ⛔ 「우리 판으로 덮기」는 안 한다 — 유저가 적어둔 게 사라지는 건 되돌릴 수 없다.
  const haveTitles = new Set(
    saved.recipes
      .filter((r) => r && String(r.id).startsWith('basic-'))
      .map((r) => (r.title || '').trim())
  )
  const dead = new Set(saved.removedSeedIds || [])
  // 📅📅 «날짜가 돼서 새로 열린» 주간 레시피는 seedV 가 최신이어도 들어와야 한다.
  //   `basics.js` 가 `from` 이 지난 것만 내주므로, 그 주가 오면 여기 목록이 늘어난다.
  //   ⛔ 이 줄이 없으면 8/10 이 돼도 깻잎 세 편이 «영영» 안 들어온다 —
  //      아래 early return 이 그 전에 걸리기 때문이다. (2026-08-03 주차 잠금 넣으며 잡은 함정)
  const opened = basicRecipes.filter((r) => !have.has(r.id) && !dead.has(r.id) && !haveTitles.has(r.title))
  if (v >= BASICS_VERSION) {
    return opened.length
      ? { recipes: [...saved.recipes, ...opened.map((r, i) => ({ ...r, savedAt: 열린때(r, i) }))], seedV: v }
      : { recipes: saved.recipes, seedV: v }
  }
  const add = basicRecipes
    // 같은 제목의 레시피가 이미 있으면 넣지 않는다 (예전 예시의 김치볶음밥 등과 중복 방지)
    .filter((r) => !have.has(r.id) && !dead.has(r.id) && !haveTitles.has(r.title))
    .map((r, i) => ({ ...r, savedAt: 열린때(r, i) }))
  // 🕘🕘 [창업자 제보 2026-09-10] 「최신 레시피가 제일 아래야」 — **이미 깔린 폰도 고친다**(규칙 18ⓙ).
  //   ⛔ 새로 까는 사람만 고치면 «지금 쓰는 사람»은 영영 거꾸로 본다. 옛 savedAt 이 폰에 이미 저장돼 있다.
  //   ✅ 기본 레시피(basic-*)의 savedAt 만 「열린 날짜」로 다시 찍는다.
  //   ⛔⛔ 유저가 «직접 저장한» 레시피는 한 개도 안 건드린다 — 그 savedAt 은 진짜 저장 시각이다.
  //   ⭐ 내용은 한 글자도 안 바뀐다(줄 세우는 값만 고친다) — 유저가 고쳐 둔 기본 레시피도 안전하다.
  const 자리 = new Map(basicRecipes.map((r, i) => [r.id, i]))
  const 시각고침 = saved.recipes.map((r) =>
    r && String(r.id).startsWith('basic-') && 자리.has(r.id)
      ? { ...r, savedAt: 열린때(r, 자리.get(r.id)) }
      : r
  )
  // 기존 기본 레시피에 새 표지 사진 입히기 — 아직 사진이 없는(기본 아이콘) 것만.
  // (사용자가 직접 넣은 사진/커스텀은 건드리지 않는다)
  const withPhotos = 시각고침.map((r) =>
    r && BASIC_PHOTOS[r.id] && r.thumb !== 'photo' && r.thumb !== 'none' && !r.image
      ? { ...r, thumb: 'photo', image: BASIC_PHOTOS[r.id] }
      : r
  )
  // v7: 기본 레시피 만드는 법 문체를 '~요'체로 통일(사용자 수정 내용은 어미만 다듬어져 보존)
  const polished = withPhotos.map((r) =>
    r && String(r.id).startsWith('basic-') && Array.isArray(r.steps)
      ? { ...r, steps: politeSteps(r.steps) }
      : r
  )
  // v10: '윤남노 스파게티'를 '알리오 올리오'로 이름 변경하고,
  // 겹치는 예전 기본 알리오올리오는 사용자가 안 건드린 경우에만 정리한다.
  let fixed = polished.map((r) =>
    r && r.id === 'basic-yunnamno-spaghetti' && (r.title || '').trim() === '윤남노 스파게티'
      ? { ...r, title: '알리오 올리오' }
      : r
  )
  const hasAlioReplacement = fixed.some((r) => r && r.id === 'basic-yunnamno-spaghetti')
  if (hasAlioReplacement) {
    fixed = fixed.filter(
      (r) => !(r && r.id === 'basic-aglioolio' && r.source === 'hankki' && !r.favorite && !(r.cooked > 0))
    )
  }
  // v11: 팟타이를 '아시안' 카테고리로 이동 (사용자가 안 바꾼 경우에만)
  fixed = fixed.map((r) =>
    r && r.id === 'basic-padthai' && r.category === '양식'
      ? { ...r, category: '아시안', folder: r.folder === '양식' ? '아시안' : r.folder }
      : r
  )
  // v12: 기본 레시피의 '한 그릇'/'한그릇' 태그 정리 + 로제파스타 표지사진을 아이콘으로 되돌리기
  fixed = fixed.map((r) => {
    if (!r || !String(r.id).startsWith('basic-')) return r
    let nr = r
    if (Array.isArray(r.tags) && r.tags.some((t) => t === '한 그릇' || t === '한그릇')) {
      nr = { ...nr, tags: r.tags.filter((t) => t !== '한 그릇' && t !== '한그릇') }
    }
    // 사용자가 직접 넣은 사진이 아니라, 우리가 깔아둔 로제파스타 표지사진만 제거
    if (r.id === 'basic-rosepasta' && r.thumb === 'photo' && String(r.image || '').includes('rosepasta')) {
      nr = { ...nr, thumb: 'icon', image: null }
    }
    return nr
  })
  // v13: 기본 제공 레시피의 '내용'(제목·재료·순서·메모·태그·아이콘·카테고리·표지 등)을
  // 최신 큐레이션으로 다시 맞춘다. 단, 사용자가 직접 편집한 레시피(touched)와
  // 개인 상태(즐겨찾기·요리횟수·꾸미기·직접 넣은 표지사진)는 그대로 보존한다.
  // 🚨🚨 [2026-09-16 · 창업자 폰 캡처가 잡았다] **여기가 `basicRecipes` 였다 — 그게 뿌리다.**
  //   📮 창업자 = 두부참치찌개를 열었더니 **옛 판**(물 450ml · 올리고당 · 참기름 · 깨)이 떠 있었다.
  //      오늘 재료도 만드는 법도 통째로 갈아엎고 BASICS_VERSION 을 160까지 올렸는데 **한 글자도 안 바뀌었다.**
  //   🌲 **`basicRecipes` 는 「`from` 이 지난 편」만 내준다**(99편). 전체는 `allBasicRecipes`(203편)다.
  //      두부참치찌개는 `from: '2026-10-12'` 라 **아직 씨앗 목록에 없다.**
  //      → 아래 표들이 전부 `seedById.has(r.id)` 로 걸러내니 **그 편은 아무도 못 고친다. 영영.**
  //   ⭐⭐ **「폰엔 있는데 씨앗엔 없는 편」이 생긴다** — 한 번 열렸다가 여는 날짜를 뒤로 민 편이 그렇다.
  //      (두부참치찌개가 정확히 그 경우다 — 예전에 열렸고, 오늘 고치며 10/12 자리로 되돌렸다)
  //      ⛔ 그런 편은 **유저 폰에 남아 계속 보이는데** 갱신만 안 닿는다. 제일 나쁜 모양이다.
  //   ✅ 그래서 **고칠 때는 전체를 본다**(`allBasicRecipes`).
  //      ⛔ **「새로 넣는 것」은 그대로 `basicRecipes` 다**(위 `add`·`opened`) — 안 열린 편을 당겨 열지 않는다.
  //         📌 **「고치기」와 「열기」는 다른 일이다.** 이 줄은 «고치기»에만 쓴다.
  const seedById = new Map(allBasicRecipes.map((s) => [s.id, s]))
  fixed = fixed.map((r) => {
    if (!r || r.touched || !seedById.has(r.id)) return r
    const s = seedById.get(r.id)
    // 사용자가 직접 넣은 표지사진(우리 recipe-photos 폴더가 아닌 것)은 유지
    const userPhoto = r.thumb === 'photo' && r.image && !String(r.image).includes('/recipe-photos/')
    // 사용자가 꾸민 표지(배경 지우고 꾸미기 얹은 것)는 시드로 되돌리지 않는다.
    // 안 그러면 BASICS_VERSION 올릴 때마다 꾸민 표지가 날아가고 시드 아이콘이 다시 나타난다.
    // (공심채볶음 등 — 창업자 2026-07-25 제보)
    //
    // 🐛🐛 2026-08-04 두 번째 — **`thumb:'none'` 하나만으로 「꾸몄다」고 보면 안 된다.**
    //   v9.59 가 폰에 «thumb:'none' ＋ 꾸미기 없음» 을 저장해버렸는데, v9.60 이 그걸 보고
    //   **「유저가 직접 꾸민 것」으로 오해**해서 시드 꾸미기를 또 안 넣었다 → 표지가 계속 빈 칸.
    //   📌 창업자 *"콩국물은 바뀌었어"* 가 결정적 단서였다 — 재료는 갱신됐는데 표지만 안 됐다면
    //      **캐시가 아니라 이 판정이 범인**이다.
    //   ✅ 「실제로 꾸민 게 있나」로 본다. `thumb:'none'` 만 있는 건
    //      ⒜배경만 지운 유저이거나 ⒝우리가 남긴 빈 껍데기인데, **시드가 꾸미기를 들고 오면 ⒝**다.
    const userHasDecor =
      (Array.isArray(r.decor) && r.decor.length > 0) || (r.decorBg && r.decorBg !== 'none')
    const seedHasDecor =
      (Array.isArray(s.decor) && s.decor.length > 0) || (s.decorBg && s.decorBg !== 'none')
    const decorated = userHasDecor || (r.thumb === 'none' && !seedHasDecor)
    const merged = {
      ...s,
      favorite: r.favorite,
      // 🔖 [2026-09-08] 핀의 «종»도 유저 것이다 — 안 실으면 시드가 갱신될 때마다 하트가 모자로 되돌아간다.
      //    ⚠️ `favorite` 바로 옆에 둔다 — 둘은 «한 쌍»이라 떨어지면 한쪽만 실리는 사고가 난다.
      favPin: r.favPin,
      cooked: r.cooked,
      cookedAt: r.cookedAt,
      savedAt: r.savedAt,
      // 🗂🗂 [2026-09-14] **유저가 옮겨 둔 폴더는 유저 것이다.**
      //   ⛔⛔ 그 전엔 이 줄이 없어서 `{ ...s }` 가 씨앗 폴더로 통째로 덮었다 →
      //      **BASICS_VERSION 을 올릴 때마다 「내가 옮겨 둔 자리」가 날아갔다.**
      //      📌 재현판(_repro-나라와종류-0914 ⑦)이 잡았다. 처음엔 씨앗과 «같은» 값을 심어 재는 바람에
      //         덮여도 티가 안 나 «가짜 초록불»이 났었다 — 다른 값을 심으니 그제서야 드러났다.
      //   ⭐ 갈래(category)는 «우리»가 정한다(검수 확인사항 ④) → 씨앗이 이긴다.
      //      폴더(folder)는 «유저»가 옮기는 자리 → 유저가 이긴다. **둘은 주인이 다르다.**
      //   ⛔ 유저가 아무 데도 안 옮겼으면(빈 값) 씨앗 것을 그대로 쓴다 —
      //      「보존」과 「덮어쓰기」는 다르다, 없는 값으로 덮으면 그건 지우는 것이다(2026-08-04 교훈).
      folder: r.folder || s.folder,
      // 🐛🐛 2026-08-04 — 여기서 «빈 표지» 사고가 났다 (창업자 폰 캡처).
      //   예전엔 `decor: r.decor` 로 **무조건** 유저 값을 얹었다. 유저가 안 꾸민 레시피는
      //   `r.decor` 가 없으니 시드가 들고 온 꾸미기가 **덮여서 사라지고**,
      //   `thumb` 은 시드의 `'none'`(표지 안 그림)이 그대로 남아 **아무것도 없는 칸**이 됐다.
      //   → 레꾸 샘플을 콩국수로 옮긴 v9.59 에서 기존 사용자 전원이 빈 표지를 봤다.
      //   ✅ 유저가 «꾸민 흔적이 있을 때만» 유저 것을 지킨다. 없으면 시드가 들고 온 걸 그대로 쓴다.
      //   ⛔ 「보존」과 「덮어쓰기」는 다르다 — 없는 값으로 덮으면 그건 지우는 것이다.
      decor: decorated ? r.decor : s.decor,
      decorBg: decorated ? r.decorBg : s.decorBg,
      status: r.status || s.status,
    }
    if (userPhoto) { merged.thumb = r.thumb; merged.image = r.image }
    if (decorated && !userPhoto) { merged.thumb = r.thumb }
    return merged
  })
  // v14: '마늘종' → '마늘쫑' 순수 철자 수정 — 사용자가 편집한(touched) 레시피까지 모두 고친다.
  const fixTypo = (str) => (typeof str === 'string' ? str.replace(/마늘종/g, '마늘쫑') : str)
  fixed = fixed.map((r) => {
    if (!r) return r
    const changed =
      fixTypo(r.title) !== r.title ||
      (Array.isArray(r.ingredients) && r.ingredients.some((x) => fixTypo(x) !== x)) ||
      (Array.isArray(r.steps) && r.steps.some((x) => fixTypo(x) !== x)) ||
      fixTypo(r.memo) !== r.memo
    if (!changed) return r
    return {
      ...r,
      title: fixTypo(r.title),
      ingredients: Array.isArray(r.ingredients) ? r.ingredients.map(fixTypo) : r.ingredients,
      steps: Array.isArray(r.steps) ? r.steps.map(fixTypo) : r.steps,
      memo: fixTypo(r.memo),
    }
  })
  // v31: 편집(touched)한 '기본 레시피'도 양념 표기 재정리(제품명→일반명 + 내 제품은 메모)만큼은
  //      최신 시드에 맞춘다. 재료·메모만 교체(제목·순서·꾸미기·개인상태는 그대로) → 픽카드도 정상 작동.
  //      ※ 재료·메모를 직접 고친 경우엔 그 편집이 시드본으로 덮이지만, 전역 양념 표기 통일을 우선한다.
  fixed = fixed.map((r) => {
    if (!r || !r.touched || !seedById.has(r.id)) return r
    const s = seedById.get(r.id)
    return { ...r, ingredients: s.ingredients, memo: s.memo }
  })
  // 🍲🍲 v161 (2026-09-16) — **v31 이 「재료」만 덮고 «만드는 법»을 안 덮었다.**
  //   📮 창업자 폰 캡처 = 두부참치찌개가 **옛 판**(물 450ml · 올리고당 · 참기름 · 깨)으로 떠 있었다.
  //   ⛔⛔ 뿌리 = 위 v31 은 손댄 편(`touched`)에 대해 `ingredients` 와 `memo` «둘만» 갈아끼운다.
  //      그런데 오늘 고친 넷(두부참치찌개·볶음밥·꼬치전·잡채)은 **만드는 법을 통째로 갈아엎은 편**들이다.
  //      → 재료만 새것이 되고 걸음은 옛것으로 남으면 **둘이 어긋난 「섞인 판」**이 된다.
  //         (재료엔 해물가루육수가 있는데 걸음엔 없고, 걸음은 450ml를 끓이라고 한다)
  //   📌 9/12 가지 사고와 **같은 자리**다 — 「재료만 바꾸면 만드는 법이 거짓말이 된다」.
  //      그때는 내가 손으로 안 고쳐서 났고, 이번엔 **코드가 절반만 고쳐서** 났다.
  //   ✅ 그래서 시드가 **만드는 법·시간·인분·난이도**까지 들고 오게 한다.
  //      ⛔ 개인 것은 하나도 안 건드린다 — 즐겨찾기·요리횟수·꾸미기·표지·폴더·저장시각은 여기 없다.
  //      ⛔ `touched` 딱지도 그대로 둔다 — 「유저가 손댄 편」이라는 사실은 지워지지 않는다.
  //      ⛔ 제목은 «일부러» 뺐다 — 유저가 이름을 바꿔 부르는 건 그 사람 것이다(v10 알리오 올리오 자리와 같다).
  fixed = fixed.map((r) => {
    if (!r || !r.touched || !seedById.has(r.id)) return r
    const s = seedById.get(r.id)
    return {
      ...r,
      steps: s.steps,
      time: s.time,
      servings: s.servings,
      difficulty: s.difficulty,
    }
  })
  // v34: 사용자가 직접 만든 레시피(시드 아님)의 아이콘을 새 완성요리 PNG로 업그레이드.
  //      제목에 딱 맞는 PNG가 생긴 경우에만 교체(없으면 기존 아이콘 유지 → 회귀 없음).
  //      사진·이모지·글자 표지, 이미 PNG로 고른 것, 시드(위 v13에서 큐레이션됨)는 건드리지 않는다.
  const isFoodPng = (k) => /^(fh_k|fy_y|fj_c|fi_j|fb_b|fe_)/.test(k || '')
  fixed = fixed.map((r) => {
    if (!r || seedById.has(r.id)) return r
    if (r.thumb && r.thumb !== 'icon') return r
    if (r.image && r.thumb !== 'icon') return r
    if (isFoodPng(r.icon)) return r
    const g = guessFoodIcon(r.title || '')
    return isFoodPng(g) ? { ...r, icon: g } : r
  })
  // v38: 예시 요리 4종을 전용 아이콘으로 '강제' 반영 — 제목으로 매칭, 시드/내레시피/편집(touched) 무관.
  //      (v37에서 basics.js 아이콘을 바꿨지만, 편집했거나 이미 다른 PNG였던 레시피는
  //       위 v13/v34 패스가 건너뛰어 반영이 안 됐다. 표지가 '아이콘'일 때만 교체 — 사진 표지는 보존.)
  // (v39 추가: 로제파스타·치즈샌드위치·새우크림파스타도 전용 아이콘으로. 예전 fy_ 양식 아이콘에서 교체.)
  const ICON_FORCE_V38 = {
    // 🍜🍜 [2026-08-31 · 뿌리를 뽑았다] **이 표가 카와이를 «다시 박고» 있었다.**
    //   📮 창업자 = *"어제 내가 찾아서 바꾼건 크림파스타, 애호박덮밥, 김치볶음밥에 아직도 붙어있었어"*
    //   ⭐⭐ 이 표는 **제목으로 강제**한다 — 씨앗이든, 편집(`touched`)했든, **유저가 직접 고른 아이콘이든 덮는다.**
    //      그래서 창업자가 어제 손으로 바꿔도 **오늘 다시 붙었다.**
    //   ⛔ 원래 주석이 *"v41: **얼굴 있는** 새 파스타 아이콘"* 이었다 —
    //      8월 초엔 「얼굴」이 «좋은 것»이었고, 방향이 뒤집힌 지금도 이 표가 그대로 돌고 있었다.
    //      📌 **표를 만든 «이유»가 낡으면 표도 낡는다.** 도착지를 실물로 다시 봐야 한다.
    //   ✅ 실물로 갈랐다(절대원칙 21) — 열한 자리 중 **여섯이 카와이**라 뺐고, 다섯은 사진풍이라 남긴다.
    //      뺀 여섯(fe_20·fe_24·fe_26·fe_27·fe_52·fe_53)은 이제 아래 `카와이_V96` 이 «제목으로» 맡는다.
    //      🔢 규칙이 이미 새 컷을 갖고 있다 — 김치볶음밥 gr_337 · 로제 gr_277 · 치즈샌드위치 gr_294 ·
    //         새우크림 gr_276 · 베이컨크림 gr_297 · 묵은지들기름 gr_296
    '요거트 아이스크림': 'fe_19', '크루키': 'fe_17', '불닭냉면': 'fe_18',
    '대구뭉티기': 'fe_22', // v41: 기존 레시피였는데 아이콘 교체를 놓쳐 사시미(fi_j09)로 떠 있던 것
    // 🍲 v42 (2026-08-18) — 창업자 폰 제보에서 나왔다. *"누룽지 삼계탕에 이모지같은게 들어있어"*
    //    ⛔ 「누룽지삼계탕」이 규칙에서 «누룽지»(fe_114 오징어누룽지)에 먼저 먹혀 엉뚱한 그림이 붙었다.
    //    ⭐ 규칙(`FoodIcon.ICON_RULES`)은 고쳤지만 **그것만으론 창업자 폰이 안 고쳐진다** —
    //       아이콘은 만들 때 레시피에 «박혀» 저장되기 때문이다(규칙 18 ⓙ · v10.76 에서 같은 자리를 겪었다).
    //    ⚠️ 띄어쓰기를 모르니 네 가지를 다 적는다(이 표는 «제목이 정확히 같을 때»만 맞는다).
    '누룽지삼계탕': 'fh_k06', '누룽지 삼계탕': 'fh_k06',
    '누룽지백숙': 'fh_k06', '누룽지 백숙': 'fh_k06',
  }
  fixed = fixed.map((r) => {
    if (!r) return r
    const want = ICON_FORCE_V38[(r.title || '').trim()]
    if (!want) return r
    if (r.thumb && r.thumb !== 'icon') return r // 직접 넣은 사진/글자 표지는 안 건드림
    if (r.image && r.thumb !== 'icon') return r
    return r.icon === want ? r : { ...r, icon: want }
  })
  // 🍽🍽 v88 (2026-08-25) — 「106컷 갈아끼우기」가 **이미 저장된 레시피엔 하나도 안 닿았다.**
  //   📮 창업자 = *"배포됐다는데 내 폰에서는 전혀안보여."* → 설정 버전은 v11.32 인데 그림은 전부 옛것
  //   ⛔⛔ 뿌리 = v11.32 에서 `ICON_RULES` 의 «키»만 새 컷으로 갈았다.
  //      그런데 아이콘은 레시피를 만들 때 `recipe.icon` 으로 **박혀서 굳는다**
  //      (`Thumb.jsx` = `recipe.icon || guessFoodIcon(제목)` — 박힌 값이 규칙을 덮는다).
  //      → **앞으로 «새로» 만드는 레시피만** 새 그림을 받고 이미 있는 건 영영 옛 그림이다.
  //      🔢 실측 = 열린 기본 레시피 57편 중 새 컷을 쓰는 건 9편뿐 · 창업자 본인 레시피는 0편.
  //   📌 규칙 18 ⓙ 를 또 밟았다 — 「새로 까는 사람」만 보고 «이미 깔린 폰»을 안 봤다(v10.76 과 같은 자리).
  //   ✅ 그래서 «옛 키 → 새 키» 대응표로 저장된 값을 직접 갈아끼운다. 90쌍 = v11.32 커밋 diff 에서 뽑았다.
  //   ⛔ 다섯을 «일부러» 뺐다 — 옛 키를 **다른 요리가 아직 쓰고 있어서** 통째로 갈면 그 요리가 엉뚱해진다
  //      (`fe_86` 브런치 · `fe_87` 피자 · `fh_k25` 냉면 · `fj_c03` 필라프 · `fy_y05` 샐러드).
  //      → 그 다섯은 바로 아래 «제목» 표로 콕 집어 잡는다.
  const ICON_SWAP_V88 = {
    fe_08: 'fe_414', fe_21: 'fe_480', fe_24: 'fe_430', fe_25: 'fe_420',
    fe_26: 'fe_450', fe_27: 'fe_431', fe_43: 'fe_451', fe_52: 'fe_452',
    fe_53: 'fe_453', fe_72: 'fe_433', fe_73: 'fe_454', fe_78: 'fe_406',
    fe_88: 'fe_445', fe_95: 'fe_404', fe_96: 'fe_405', fe_98: 'fe_493',
    fe_101: 'fe_389', fe_117: 'fe_415', fe_118: 'fe_416', fe_127: 'fe_429',
    fe_140: 'fe_422', fe_151: 'fe_470', fe_152: 'fe_471', fe_155: 'fe_400',
    fe_158: 'fe_426', fe_163: 'fe_390', fe_166: 'fe_468', fe_167: 'fe_487',
    fe_169: 'fe_488', fe_170: 'fe_489', fe_176: 'fe_490', fe_183: 'fe_472',
    fe_187: 'fe_469', fe_189: 'fe_491', fe_204: 'fe_397', fe_210: 'fe_482',
    fe_211: 'fe_483', fe_214: 'fe_485', fe_216: 'fe_475', fe_218: 'fe_398',
    fe_219: 'fe_399', fe_221: 'fe_477', fe_222: 'fe_411', fe_225: 'fe_412',
    fe_226: 'fe_421', fe_228: 'fe_413', fe_234: 'fe_478', fe_235: 'fe_423',
    fe_236: 'fe_424', fe_237: 'fe_425', fe_246: 'fe_486', fe_250: 'fe_393',
    fe_266: 'fe_437', fe_267: 'fe_438', fe_272: 'fe_409', fe_273: 'fe_410',
    fe_275: 'fe_427', fe_277: 'fe_396', fe_284: 'fe_481', fe_296: 'fe_408',
    fe_320: 'fe_401', fe_321: 'fe_435', fe_327: 'fe_436', fh_k09: 'fe_473',
    fh_k12: 'fe_419', fh_k20: 'fe_391', fh_k21: 'fe_392', fi_j01: 'fe_494',
    fj_c02: 'fe_492', fj_c04: 'fe_463', fj_c05: 'fe_464', fj_c06: 'fe_465',
    fj_c07: 'fe_466', fj_c08: 'fe_467', fj_c09: 'fe_457', fj_c11: 'fe_458',
    fj_c12: 'fe_459', fj_c13: 'fe_460', fj_c14: 'fe_461', fy_y02: 'fe_443',
    fy_y04: 'fe_447', fy_y06: 'fe_448', fy_y07: 'fe_449',
    fy_y10: 'fe_439', fy_y11: 'fe_440', fy_y12: 'fe_441', fy_y14: 'fe_442',
    noodle: 'fe_395', spicybowl: 'fe_484',
  }
  // ⛔ 위에서 뺀 다섯은 «제목이 정확히 같을 때»만 갈아끼운다 (띄어쓰기를 모르니 다 적는다).
  const ICON_FORCE_V88 = {
    // 🍜 [2026-08-31] `fe_455`(브런치)도 창업자 전수 판정에서 **카와이**로 잡혔다 → 규칙이 가진 새 컷으로.
    '브런치': 'gr_299', '브런치플레이트': 'gr_299', '브런치 플레이트': 'gr_299', '아침플레이트': 'gr_299',
    '피자': 'fe_456', '화덕피자': 'fe_456', '화덕 피자': 'fe_456', '페퍼로니피자': 'fe_456', '페퍼로니 피자': 'fe_456',
    '물냉면': 'fe_394', '물 냉면': 'fe_394',
    '볶음밥': 'fe_462', '계란볶음밥': 'fe_462', '계란 볶음밥': 'fe_462', '새우볶음밥': 'fe_462', '새우 볶음밥': 'fe_462',
    '토마토샐러드': 'fe_444', '토마토 샐러드': 'fe_444', '카프레제': 'fe_444',
    // 🚑 v11.35 (2026-08-25) — **v11.34 가 덮어버린 것을 되돌린다.**
    //   📮 창업자 = *"해장파스타에 크림파스타그림이 올라갔어"*
    //   ⛔⛔ 내가 v11.34 에 넣은 「제목을 규칙에 다시 물어본다」가
    //      `basics.js` 에 **일부러 박아둔** `fe_443`(스파게티)을 넓은 「파스타」 규칙(`fe_446` 크림파스타)으로 덮었다.
    //   ⭐⭐ 배운 것 = **`recipe.icon` 이 «박혀 있는 이유»가 바로 「규칙이 틀려서」다.**
    //      규칙을 다시 물어보는 건 그 뜻을 정면으로 뒤집는 짓이었다. 그 패스는 통째로 뺐다.
    //   ⛔ 코드를 되돌리는 것만으론 안 고쳐진다 — 이미 폰에 **틀린 값이 저장됐다**(규칙 18 ⓙ).
    //      그래서 제목으로 콕 집어 되돌린다.
    '해장 파스타': 'fe_436', '해장파스타': 'fe_436',   // 📮창업자 = *"해장파스타는 그림이 뚝배기파스타면좋겠어"*
    // 📮 창업자 = *"새우해장파스타->크림파스타"*
    //   ⛔ v11.33 대응표의 `fy_y03`(**범용** 파스타) → `fe_446`(크림파스타) 가 틀렸다.
    //      **범용 그림을 «특정 요리»로 보내면 안 된다** — 그 자리를 뺐다.
    //   ⭐ `basics.js` 가 적어둔 값(`fy_y03`)으로 되돌린다. ⛔내가 딴 그림을 고르지 않는다(규칙 11).
    // 🍜 [2026-08-31] 그 `fy_y03` 이 창업자 전수 판정에서 **카와이**로 잡혔다 →
    //    규칙이 「새우 해장 파스타」에 주는 값(`gr_446` 해장파스타)으로. `basics.js` 도 같이 고쳤다.
    '새우 해장 파스타': 'gr_446', '새우해장파스타': 'gr_446',
    // 🏷 v11.35 — 「이름표 ↔ 그림」이 어긋난 자리. ⛔내 사고가 아니라 «원래 박혀 있던 값»이다.
    //   📮 창업자 = *"해물오일파스타에 알리오올리오가.. 이름표가 잘못붙은것같은데"*
    //   ⭐ 셋 다 «같은 요리를 그린 새 컷이 이미 있는데» 옛 컷·딴 요리 컷을 붙들고 있었다.
    //      `basics.js` 만 고치면 이미 저장된 폰은 안 바뀐다(규칙 18 ⓙ) → 제목으로도 되돌린다.
    // ⛔ [2026-09-14] 여기 있던 fe_451 은 «알리오 올리오»였다(새우도 조개도 없다 · 눈으로 봤다).
    //    📮 창업자 = *"해물오일파스타는 새우들어간오일파스타"* — 고친다고 해놓고 새우 없는 컷을 넣었던 자리다.
    //    ✅ 아래에서 창업자가 뽑아 준 새 컷(n3028)으로 준다. ⛔같은 표에 두 번 적으면 «위엣것»이 이긴다.
    // ⛔⛔ [2026-09-14 · 창업자 «간장인데 고추장들어가고» → «간장제육안들어감»] fe_418 «도» 빨간 고추장 제육이었다.
    //   🌲 그림을 바꾸는 자리가 «셋»이다 — ①이름표 규칙(FoodIcon) ②레시피의 icon ③여기(제목으로 강제).
    //      **셋 중 여기가 제일 세다.** 나는 ①만 고쳤다가(v13.35) 안 됐고, ②까지 고쳤는데도(v13.37)
    //      여기가 다시 덮어서 화면이 그대로였다. 창업자가 두 번 헛걸음했다.
    //   📌 **다음에 기본 레시피 그림을 바꿀 땐 이 표부터 본다** — 재현판 _repro-그림갱신-0914 가 이 자리를 잰다.
    //   ⭐ 창업자가 캡처로 고른 간장색 컷으로 셋을 «같은 값»으로 맞춘다.
    '간장 제육볶음': 'gr_257', '간장제육볶음': 'gr_257',
    // 🌶 [2026-09-14] 매운 소갈비찜 — 창업자가 새 컷을 뽑아 줬다(«매운소갈비도 고춧가루가없네»).
    //   ⛔ 여기까지 적어야 «이미 깔린 폰»이 받는다. 간장 제육에서 이 자리를 빠뜨려 두 번 헛걸음했다.
    // 🍆 [2026-09-14] 가지무침이 «만두»로 바뀌어 있었다(ICON_SWAP_GR 의 fe_92 → gr_066 짝이 틀렸다).
    //   ⛔ 그 짝을 빼는 것만으론 **이미 폰에 gr_066 이 저장된 사람**은 영영 만두를 본다(규칙 18 ⓙ).
    //      그래서 제목으로 콕 집어 되돌린다 — 이 표가 있는 이유가 바로 이것이다.
    '쫄깃한 가지무침': 'fe_92', '가지무침': 'fe_92',
    // 🎨 [2026-09-14] 창업자가 뽑아 준 여섯 — 이름과 그림이 어긋난 자리(검수판 1·2·3·4·12·13).
    //   ⛔ 여기까지 적어야 «이미 깔린 폰»이 받는다. 간장 제육에서 이 자리를 빠뜨려 두 번 헛걸음했다.
    '계란후라이조림': 'n3024',
    '버섯전': 'n3025',
    '새우튀김': 'n3026',
    '고등어구이': 'n3027',
    '해물오일파스타': 'n3028', '해물 오일 파스타': 'n3028', '해물오일 파스타': 'n3028',
    '마늘 간장 닭날개조림': 'n3029', '마늘간장닭날개조림': 'n3029',
    '매운 소갈비찜': 'n3023', '매운소갈비찜': 'n3023',
    '샤브샤브': 'fe_471', '초간단 샤브샤브': 'fe_471',                                       // fh_k26 = 이름표가 「칼국수」였다
  }
  fixed = fixed.map((r) => {
    if (!r) return r
    // ⛔ 직접 넣은 사진·카드·글자 표지는 절대 안 건드린다 (위 v38 패스와 같은 잣대)
    if (r.thumb && r.thumb !== 'icon') return r
    if (r.image && r.thumb !== 'icon') return r
    const want = ICON_FORCE_V88[(r.title || '').trim()] || ICON_SWAP_V88[r.icon]
    return want && r.icon !== want ? { ...r, icon: want } : r
  })
  // 🍽🍽 v11.36 (2026-08-26) — 창업자 「그릇」 컷 108개(접두어 gr_) 로 갈아끼운다.
  //   📮 창업자 = *"새로 자른것이랑 옛날게 섞여있는데??"* · *"이번에갈아끼는건 이름표새로붙여 식별되게"*
  //   ⭐ 새 세대는 «접두어»가 다르다 — 키만 봐도 세대를 안다(fe_389~494 를 이어 붙인 게 화근이었다).
  //   ⛔ 이 표가 없으면 «이미 저장된» 레시피는 영영 옛 컷을 부른다(규칙 18 ⓙ).
  const ICON_SWAP_GR = {
    fe_74: 'gr_001', fe_132: 'gr_002', fe_294: 'gr_004', fe_192: 'gr_005', fe_197: 'gr_006',
    fe_196: 'gr_007', fy_y13: 'gr_009', fe_49: 'gr_010', fe_50: 'gr_011', fe_40: 'gr_012',
    fe_41: 'gr_013', fe_93: 'gr_014', fe_94: 'gr_015', fb_b05: 'gr_021', fe_55: 'gr_025',
    fe_57: 'gr_026', fe_58: 'gr_027', fe_59: 'gr_028', fe_106: 'gr_031', fe_45: 'gr_032',
    fe_278: 'gr_033', fe_190: 'gr_035', fe_09: 'gr_036', fe_256: 'gr_038', fe_257: 'gr_039',
    fe_230: 'gr_042', fe_232: 'gr_043', fe_233: 'gr_044', fe_238: 'gr_045', fe_243: 'gr_047',
    fh_k01: 'gr_048', fe_138: 'gr_051', fe_139: 'gr_052', fe_308: 'gr_053', fe_309: 'gr_054',
    fe_61: 'gr_061', fe_62: 'gr_062', fe_202: 'gr_063', fh_k31: 'gr_064', fh_k37: 'gr_065',
    // ⛔⛔ [2026-09-14] 여기  이 있었다 — **가지무침을 «만두»로 바꾸고 있었다.**
    //    📮 창업자 = *«가지무침이 만두로 바뀐거 실화야???????????»* · *«절대 이런일이 있으면 안돼»*
    //    🌲 2026-08-26 에 그릇 컷 108개를 갈아끼우며 짝을 잘못 맺었다. fe_92 = 가지무침 · gr_066 = 만두다.
    //       📌 **틀린 줄은 배포 때가 아니라 «그 편이 열리는 날» 드러난다** — 이 편은 2026-09-14 에 처음 열렸다.
    //    ✅ 그래서 짝을 «뺐다». fe_92(가지무침)에 맞는 그릇 세대 컷이 없으므로 그대로 두는 게 맞다.
    //    🔒 다시는 못 새게 게이트를 만들었다 = 
    //       네 자리(레시피 icon · SWAP_GR · SWAP_V88 · FORCE_V88)를 다 거친 «최종 그림»을 이름표와 대조한다.
    fb_b01: 'gr_067', fb_b04: 'gr_068', fb_b07: 'gr_070', fe_311: 'gr_072',
    fe_199: 'gr_073', fe_206: 'gr_075', fe_209: 'gr_076', fe_247: 'gr_077', fe_249: 'gr_078',
    fe_120: 'gr_079', fe_124: 'gr_080', fh_k32: 'gr_081', fe_23: 'gr_082', fj_c10: 'gr_083',
    fe_312: 'gr_085', fe_269: 'gr_087', fe_244: 'gr_088', fe_245: 'gr_089', fe_186: 'gr_090',
    fe_313: 'gr_091', fe_268: 'gr_092', fe_205: 'gr_093', fe_223: 'gr_094', fe_112: 'gr_095',
    fe_113: 'gr_096', fe_131: 'gr_097', fe_69: 'gr_098', fe_157: 'gr_099', fe_173: 'gr_100',
    fe_180: 'gr_101', fe_198: 'gr_102', fh_k16: 'gr_104', fe_317: 'gr_107', fe_310: 'gr_108',
    fe_422: 'gr_055',
  }
  fixed = fixed.map((r) => {
    if (!r) return r
    // ⛔ 직접 넣은 사진·카드·글자 표지는 절대 안 건드린다
    if (r.thumb && r.thumb !== 'icon') return r
    if (r.image && r.thumb !== 'icon') return r
    const want = ICON_SWAP_GR[r.icon]
    return want ? { ...r, icon: want } : r
  })

  // 🍱🍱 v11.50 (2026-08-27) — 픽커에서 «내린» 옛 컷을 아직 박고 있던 것들.
  //   📮 창업자 = *"아직 레시피 김치찌개 아래있는 음식아이콘 안바뀌었어.."* (제육볶음 fh_k13 = 옛 카와이)
  //   ⛔⛔ 여기엔 «그 요리 전용» 컷만 넣는다 — 범용 컷은 절대 넣지 않는다.
  //      fe_71(무침) · fe_63(덮밥) · fe_128(소스) · fe_04(솥밥) · fe_10 은 뺐다.
  //      그 키로 «딴 요리»를 저장한 사람의 그림까지 바뀐다(규칙 18 ⓙ 의 반대편 함정).
  //      기본 레시피는 위 BASICS_VERSION 재동기화가 «제목»으로 정확히 고친다.
  const ICON_SWAP_0827 = {
    fh_k13: 'gr_387', fe_103: 'gr_413', fe_137: 'gr_402', fe_178: 'gr_340',
    fe_193: 'gr_382', fe_194: 'gr_380', fe_263: 'gr_419', fe_271: 'gr_391',
    fe_282: 'gr_003', fe_288: 'gr_416', fe_289: 'gr_341', fe_290: 'gr_344',
    fe_295: 'gr_397', fe_307: 'gr_338', fe_315: 'gr_342', fe_34: 'gr_386',
    fe_05: 'gr_427', fy_y08: 'gr_399',
    gr_247: 'gr_048', gr_248: 'gr_001', gr_250: 'gr_439', gr_268: 'gr_053',
    // ⭐ 2차 — 창업자가 잡아줬다. 내가 「대체 컷이 없다」고 한 셋이 **다 있었다**(이름이 달랐다).
    //    ⛔「없다」가 아니라 «내가 못 찾았다» 였다 — 규칙 17 그대로.
    fe_102: 'fe_500',  // 달래장     ← 컷 이름은 「달래양념장」
    fe_287: 'fe_285',  // 고구마크룽지 ← 컷 이름은 「고구마누룽지」
    fh_k04: 'gr_442',  // 두부참치찌개 ← 컷 이름은 「두부참치전골」
    // ⭐ 3차 — 창업자가 «대신 쓸 컷»을 짚어 줬다(어제 「대체 컷 없는 넷」이 여기서 풀렸다)
    //    📮 *"필라프는 볶음밥으로 튀김은 모듬튀김있으니까. 냉면은 물냉면있어."*
    fi_j03: 'fe_503',  // 튀김·새우튀김 → 모듬튀김
    fh_k25: 'gr_225',  // 냉면         → 물냉면
    fj_c03: 'gr_306',  // 필라프       → 볶음밥
    fe_125: 'gr_441',  // 수육         → 돼지고기수육 (창업자 *"수육은 돼지고기수육(새컷)하면 될 것 같아"*)
  }
  fixed = fixed.map((r) => {
    if (!r) return r
    // ⛔ 직접 넣은 사진·카드·글자 표지는 절대 안 건드린다
    if (r.thumb && r.thumb !== 'icon') return r
    if (r.image && r.thumb !== 'icon') return r
    const want = ICON_SWAP_0827[r.icon]
    return want ? { ...r, icon: want } : r
  })
  // 🍜🍜 v96 (2026-08-29) — 「이미 내린 옛 카와이」가 박힌 레시피를 «제목으로 다시 판정»한다.
  //   📮 창업자 = *"레시피 기본인식했는데 남편폰. 또 카와이 아이콘이 자동인식됐어. **카와이 다 내린거 맞아?**"*
  //      → v11.95 로 규칙을 고쳤는데 *"**차돌볶음 그대로야..**"* → *"**짬뽕도 카와이컷 남아있더라..**"*
  //      → 방향 확정 = *"**그리고 카와이 컷을 아예 폐기해버리자.**"*
  //   ⭐⭐ 뿌리 = 위 v88·0827 표와 «같은 자리»인데, **손으로 적은 대응표는 매번 몇 개씩 빠진다.**
  //      🔢 실측 = 옛 컷 파일 650장 중 **픽커에서 내린 것이 478장**이고, 표본 75장을 눈으로 보니
  //         90% 넘게 얼굴이 달려 있었다. 478쌍을 손으로 적을 수는 없다 → **잣대로 잡는다.**
  //   🔑 잣대 = **「픽커(FOOD_ICON_GROUPS)에 없는 옛 접두어 컷」 = 앞선 판들에서 내린 옛 카와이**
  //      실측으로 셋 다 걸리는 것을 확인했다 —
  //      `fe_64`(차돌볶음이 부르던 것) · `fj_jsk01`(짬뽕) · `fh_k13`(제육 · v100 제보).
  //   ⛔⛔ **v11.34 사고를 되풀이하지 않는다** — 그때 「제목을 규칙에 다시 물어본다」가
  //      `basics.js` 에 **일부러 박아둔** 값까지 덮었다(창업자 *"해장파스타에 크림파스타그림이 올라갔어"*).
  //      📌 그 사고의 뿌리 = 「모든 레시피」에 물어본 것. 여기는 **「내려간 컷을 쓰는 것」만** 묻는다.
  //      ✅ ＋ 안전장치 = **시드(`basicRecipes`)가 쓰는 아이콘 값은 통째로 보호한다.** 그건 우리가
  //         «일부러» 정한 값이다. 🔢 실측으로 보호되는 편 6개 =
  //         해장 파스타·뚝배기 파스타(`fe_436`) · 새우 해장 파스타(`fy_y03`) ·
  //         해물오일파스타(`fe_451`) · 버섯 솥밥(`fe_04`) · 순두부조림(`fe_35`).
  //   ⛔ 결과가 «픽커에 있는 컷»일 때만 갈아끼운다 — 규칙이 못 찾으면 도형(빈 접시)으로 떨어져 더 나빠진다.
  //   ⛔ 파일은 **안 지운다** — 이 패스가 실제로 다 잡는 것을 본 뒤에 지운다(순서를 뒤집으면 그림이 빈칸이 된다).
  //
  //   ⛔⛔⛔ **첫 판이 너무 넓었고 «게이트가 잡았다»**(`_repro-아이콘갈아끼우기-0825` 10/21 · 2026-08-29)
  //      「픽커에 없는 옛 컷」만으로 잡으니 **위 표들이 «일부러 보낸 도착지»까지 다시 덮었다** —
  //      베이컨크림파스타 `fe_453` → gr_297 · 해물오일파스타 `fe_451` → gr_295 · 샤브샤브 `fe_471` → gr_314 …
  //      📌 v11.35 주석이 경고한 그 사고를 **잣대만 바꿔서 똑같이** 되풀이할 뻔했다.
  //   ✅ 그래서 **위 표들에 «이름이 오르는 키»는 전부 보호한다**(출발지·도착지 둘 다).
  //      그건 우리가 이미 «판정해서 정해 둔» 자리다. v96 은 **아무 표에도 없는 컷**만 맡는다.
  //      ⭐ `fe_64`(차돌볶음) · `fj_jsk01`(짬뽕) 은 어느 표에도 없다 → v96 이 잡는다.
  const 픽커키_V96 = new Set()
  for (const g of FOOD_ICON_GROUPS) for (const k of (g.items || [])) 픽커키_V96.add(k)
  const 시드아이콘_V96 = new Set()
  for (const s of basicRecipes) if (s && s.icon) 시드아이콘_V96.add(s.icon)
  // ⭐ 앞선 표에 이름이 오른 키 전부 — 출발지도 도착지도 「우리가 정한 자리」다
  const 표에있음_V96 = new Set([
    ...Object.values(ICON_FORCE_V38), ...Object.keys(ICON_SWAP_V88), ...Object.values(ICON_SWAP_V88),
    ...Object.values(ICON_FORCE_V88), ...Object.keys(ICON_SWAP_GR), ...Object.values(ICON_SWAP_GR),
    ...Object.keys(ICON_SWAP_0827), ...Object.values(ICON_SWAP_0827),
  ])
  // ⛔⛔ **둘째 판도 아직 넓었다 — 게이트가 또 잡았다(18/21).**
  //    「픽커에 없다」를 카와이의 증거로 삼았는데, 픽커에서 내려간 이유가 «카와이만은 아니다» —
  //    `fy_y05`(샐러드) · `fe_168`(뚝배기파스타) 은 **범용이라, 중복이라** 내린 것이고 얼굴이 없다.
  //    📌 실측 근거가 표본이었다 = 픽커 밖 478장 중 «75장만» 보고 「90% 카와이」라고 넓혔다.
  // ✅ 그래서 **「카와이라고 «확인된» 키」만** 맡는다. 목록에 없으면 손대지 않는다.
  //    ⑴ 창업자 전수 판정 36장 (2026-08-29 · 175장을 직접 보고 고름)
  //    ⑵ 창업자 폰에서 실물로 확인된 둘 — `fe_64`(차돌박이 볶음) · `fj_jsk01`(짬뽕)
  //    ⏳ 픽커 밖 나머지는 **전수 검사를 마친 뒤 여기에 더한다**(⛔짐작으로 넓히지 않는다).
  // 🍜🍜 **[2026-08-31] 창업자 «전수» 판정 431장으로 갈아끼웠다 — 뿌리를 뽑는다.**
  //   📮 창업자 = *"카와이 아직도 들어있는게 있었어.이거 다 빼야해. 빼고 완전 삭제."* ·
  //      *"카와이는 영구삭제해줘"* · *"카와이 아닌 것도 있엉.."* · *"**다 보여줘도 돼 뿌리를 뽑자**"*
  //   ⭐⭐ 위 목록은 **36장짜리 표본**이었다. 그래서 매번 몇 개씩 샜다(v88 표 · 0827 표 · v96 첫 판).
  //      이번엔 **옛 세대 컷 650장을 한 판에 올려** 창업자가 직접 골랐다 — 431장.
  //      📄 판정 원본 = `docs/stickers/카와이-전수판정-2026-08-31.json`
  //      🔖 판 = https://claude.ai/code/artifact/cc49623d-fb35-4f95-b655-58e1d8505940
  //   ⛔ 손으로 적지 않았다 — 판이 내놓은 목록을 그대로 옮겼다(30자 넘는 목록을 손으로 옮기면 반드시 샌다).
  //   ⚠️ 「카와이가 아닌 옛 컷」 219장은 **그대로 둔다** — 창업자가 아니라고 골랐다(규칙 11).
  const 카와이_V96 = new Set([
    'fb_b01', 'fb_b03', 'fb_b04', 'fb_b05', 'fb_b06', 'fb_b07', 'fb_b08', 'fb_bun02',
    'fb_bun03', 'fb_bun04', 'fb_bun05', 'fb_bun08', 'fb_bun11', 'fe_04', 'fe_05', 'fe_06',
    'fe_08', 'fe_09', 'fe_10', 'fe_100', 'fe_101', 'fe_102', 'fe_103', 'fe_106',
    'fe_109', 'fe_110', 'fe_112', 'fe_113', 'fe_117', 'fe_118', 'fe_119', 'fe_12',
    'fe_120', 'fe_122', 'fe_123', 'fe_124', 'fe_125', 'fe_126', 'fe_127', 'fe_128',
    'fe_129', 'fe_13', 'fe_130', 'fe_131', 'fe_132', 'fe_137', 'fe_138', 'fe_139',
    'fe_140', 'fe_141', 'fe_142', 'fe_144', 'fe_145', 'fe_147', 'fe_148', 'fe_149',
    'fe_15', 'fe_150', 'fe_151', 'fe_152', 'fe_153', 'fe_154', 'fe_155', 'fe_157',
    'fe_158', 'fe_159', 'fe_16', 'fe_160', 'fe_163', 'fe_164', 'fe_166', 'fe_167',
    'fe_168', 'fe_169', 'fe_170', 'fe_171', 'fe_172', 'fe_173', 'fe_174', 'fe_175',
    'fe_176', 'fe_177', 'fe_178', 'fe_180', 'fe_181', 'fe_183', 'fe_184', 'fe_185',
    'fe_186', 'fe_187', 'fe_189', 'fe_190', 'fe_191', 'fe_192', 'fe_193', 'fe_194',
    'fe_196', 'fe_197', 'fe_198', 'fe_199', 'fe_20', 'fe_201', 'fe_202', 'fe_203',
    'fe_204', 'fe_205', 'fe_206', 'fe_209', 'fe_21', 'fe_210', 'fe_211', 'fe_212',
    'fe_213', 'fe_214', 'fe_215', 'fe_216', 'fe_217', 'fe_218', 'fe_219', 'fe_220',
    'fe_221', 'fe_222', 'fe_223', 'fe_225', 'fe_226', 'fe_227', 'fe_228', 'fe_229',
    'fe_23', 'fe_230', 'fe_231', 'fe_232', 'fe_233', 'fe_234', 'fe_235', 'fe_236',
    'fe_237', 'fe_238', 'fe_239', 'fe_24', 'fe_240', 'fe_241', 'fe_242', 'fe_243',
    'fe_244', 'fe_245', 'fe_246', 'fe_247', 'fe_249', 'fe_25', 'fe_250', 'fe_251',
    'fe_252', 'fe_253', 'fe_254', 'fe_255', 'fe_256', 'fe_257', 'fe_259', 'fe_26',
    'fe_260', 'fe_261', 'fe_263', 'fe_264', 'fe_265', 'fe_266', 'fe_267', 'fe_268',
    'fe_269', 'fe_27', 'fe_271', 'fe_272', 'fe_273', 'fe_275', 'fe_276', 'fe_277',
    'fe_278', 'fe_279', 'fe_28', 'fe_280', 'fe_281', 'fe_282', 'fe_284', 'fe_287',
    'fe_288', 'fe_289', 'fe_29', 'fe_290', 'fe_292', 'fe_293', 'fe_294', 'fe_295',
    'fe_296', 'fe_297', 'fe_298', 'fe_299', 'fe_30', 'fe_300', 'fe_301', 'fe_302',
    'fe_303', 'fe_307', 'fe_308', 'fe_309', 'fe_31', 'fe_310', 'fe_311', 'fe_312',
    'fe_313', 'fe_315', 'fe_317', 'fe_32', 'fe_320', 'fe_321', 'fe_327', 'fe_329',
    'fe_33', 'fe_330', 'fe_331', 'fe_332', 'fe_333', 'fe_334', 'fe_335', 'fe_336',
    'fe_337', 'fe_338', 'fe_339', 'fe_34', 'fe_340', 'fe_341', 'fe_342', 'fe_343',
    'fe_344', 'fe_345', 'fe_346', 'fe_347', 'fe_348', 'fe_349', 'fe_35', 'fe_350',
    'fe_351', 'fe_352', 'fe_353', 'fe_354', 'fe_355', 'fe_356', 'fe_357', 'fe_358',
    'fe_359', 'fe_36', 'fe_360', 'fe_361', 'fe_362', 'fe_363', 'fe_364', 'fe_365',
    'fe_366', 'fe_367', 'fe_368', 'fe_369', 'fe_37', 'fe_370', 'fe_371', 'fe_372',
    'fe_373', 'fe_374', 'fe_375', 'fe_376', 'fe_377', 'fe_378', 'fe_379', 'fe_380',
    'fe_381', 'fe_382', 'fe_383', 'fe_384', 'fe_385', 'fe_386', 'fe_387', 'fe_388',
    'fe_39', 'fe_40', 'fe_41', 'fe_42', 'fe_43', 'fe_44', 'fe_45', 'fe_455',
    'fe_46', 'fe_47', 'fe_48', 'fe_49', 'fe_497', 'fe_50', 'fe_51', 'fe_52',
    'fe_53', 'fe_54', 'fe_55', 'fe_56', 'fe_57', 'fe_58', 'fe_59', 'fe_60',
    'fe_61', 'fe_62', 'fe_63', 'fe_64', 'fe_66', 'fe_67', 'fe_68', 'fe_69',
    'fe_70', 'fe_71', 'fe_72', 'fe_73', 'fe_74', 'fe_78', 'fe_79', 'fe_80',
    'fe_81', 'fe_82', 'fe_83', 'fe_84', 'fe_86', 'fe_87', 'fe_88', 'fe_89',
    'fe_90', 'fe_92', 'fe_93', 'fe_94', 'fe_95', 'fe_96', 'fe_97', 'fe_98',
    'fe_99', 'fh_hnb01', 'fh_hnb08', 'fh_hnc01', 'fh_hnc03', 'fh_hnc04', 'fh_hnc06', 'fh_hnc10',
    'fh_htj01', 'fh_htj05', 'fh_htj13', 'fh_k01', 'fh_k03', 'fh_k04', 'fh_k05', 'fh_k09',
    'fh_k12', 'fh_k13', 'fh_k15', 'fh_k16', 'fh_k17', 'fh_k20', 'fh_k21', 'fh_k23',
    'fh_k24', 'fh_k25', 'fh_k27', 'fh_k28', 'fh_k30', 'fh_k31', 'fh_k32', 'fh_k33',
    'fh_k35', 'fh_k36', 'fh_k37', 'fi_isk02', 'fi_isk03', 'fi_isk05', 'fi_isk06', 'fi_isk07',
    'fi_isk13', 'fi_j01', 'fi_j02', 'fi_j03', 'fi_j04', 'fi_j05', 'fi_j06', 'fi_j07',
    'fi_j08', 'fi_j09', 'fi_j10', 'fi_j11', 'fi_j12', 'fi_j13', 'fi_j14', 'fj_c01',
    'fj_c02', 'fj_c03', 'fj_c04', 'fj_c05', 'fj_c06', 'fj_c07', 'fj_c08', 'fj_c09',
    'fj_c10', 'fj_c11', 'fj_c12', 'fj_c13', 'fj_c14', 'fj_jsk01', 'fj_jsk02', 'fj_jsk03',
    'fj_jsk04', 'fj_jsk05', 'fj_jsk15', 'fy_y01', 'fy_y02', 'fy_y03', 'fy_y04', 'fy_y05',
    'fy_y06', 'fy_y07', 'fy_y08', 'fy_y09', 'fy_y10', 'fy_y11', 'fy_y12', 'fy_y13',
    'fy_y14', 'fy_yng01', 'fy_yng02', 'fy_yng05', 'fy_yng07', 'fy_yng09', 'fy_yng12',
  ])
  const 옛접두_V96 = /^(fh_|fy_|fj_|fi_|fb_|fe_)/
  fixed = fixed.map((r) => {
    if (!r || !r.icon) return r
    // ⛔ 직접 넣은 사진·카드·글자 표지는 절대 안 건드린다 (위 패스들과 같은 잣대)
    if (r.thumb && r.thumb !== 'icon') return r
    if (r.image && r.thumb !== 'icon') return r
    if (!옛접두_V96.test(r.icon)) return r        // 새 세대 컷(gr_·n…)이면 그대로
    if (!카와이_V96.has(r.icon)) return r         // ⭐ 카와이라고 «확인된» 것만
    if (픽커키_V96.has(r.icon)) return r          // 아직 고를 수 있는 컷 = 안 내려간 것
    if (시드아이콘_V96.has(r.icon)) return r      // ⭐ 우리가 «일부러» 박은 값
    if (표에있음_V96.has(r.icon)) return r        // ⭐ 앞선 표가 이미 판정한 자리
    const g = guessFoodIcon(r.title || '')
    return g && g !== r.icon && 픽커키_V96.has(g) ? { ...r, icon: g } : r
  })

  return { recipes: [...fixed, ...add], seedV: BASICS_VERSION }
}

// 예전 버전(OCR 필터 이전)에 저장된 레시피의 '외계어 메모'를 한 번만 청소한다.
// 재료·순서와 겹치는 줄 + 잡음 줄을 걷어낸다. (사용자가 쓴 짧은 메모는 건드리지 않음)
const MEMO_CLEAN_V = 1
function migrateMemos(recipes, saved) {
  if ((saved.memoCleanV || 0) >= MEMO_CLEAN_V) return { recipes, memoCleanV: saved.memoCleanV }
  const cleaned = recipes.map((r) => {
    if (!r || !r.memo) return r
    let memo = cleanMemo(r.memo, r.ingredients || [], r.steps || [])
    // 사진·인스타에서 온 레시피의 메모는 OCR 잡음일 가능성이 높다 —
    // 온전한 한글 단어도, 소문자 영어 단어("overcook")도, 이모지도 없는 줄
    // ("Ta mg TERCERA" 같은 대문자 조각)은 지운다.
    if (r.source === 'photo' || r.source === 'instagram') {
      memo = memo
        .split('\n')
        .filter(
          (l) =>
            !l.trim() ||
            /[가-힣]{2,}/.test(l) ||
            /[a-z]{4,}/.test(l) ||
            /[☀-➿⭐❤\u{1F000}-\u{1FAFF}]/u.test(l) ||
            l.replace(/\s/g, '').length < 4
        )
        .join('\n')
        .trim()
    }
    return memo === r.memo ? r : { ...r, memo }
  })
  return { recipes: cleaned, memoCleanV: MEMO_CLEAN_V }
}

// '만든 횟수(cooked)'는 '만들었어요'가 diary 기록과 항상 짝으로 올린다 → 정상 상태에서 cooked == 그 레시피의 diary 수.
// 예전 버전에서 기록을 지워도 cooked가 안 줄던 버그로 둘이 어긋난 데이터가 남을 수 있어, 로드할 때 diary 수 기준으로 맞춘다.
function reconcileCooked(recipes, diary) {
  const counts = {}
  ;(diary || []).forEach((d) => { if (d && d.recipeId) counts[d.recipeId] = (counts[d.recipeId] || 0) + 1 })
  return recipes.map((r) => {
    const n = counts[r.id] || 0
    return (r.cooked || 0) === n ? r : { ...r, cooked: n }
  })
}

// 🗣 **이미 저장된 「가져온 레시피」의 말끝을 한 번만 해요체로 다듬는다.** (창업자 결정 2026-08-05)
//   ⛔⛔ 뿌리 = 우리는 «가져오는 순간»에만 다듬었다. 그래서 어제 저장한 세 편이
//      「~줍니다 · ~합니다 · ~냅니다」 로 그대로 남았다(창업자 캡처 3장 · 08:42~43).
//      ⭐ 어제 「이미 깔린 폰을 안 봤다」로 세 번 터진 것과 **같은 모양**이다.
//   ⚠️ **직접 타이핑한 레시피(`manual`)와 기본 레시피(`hankki`)는 건드리지 않는다** —
//      창업자 지시: *"가져온 것만 다듬기"*. 내가 쓴 말투는 내 것이다.
//   ⚠️ `source` 가 없는 옛 레시피도 그대로 둔다 — 어디서 왔는지 모르면 손대지 않는다.
// v2 ⛔ v1 은 `source !== 'manual'` 로 「가져온 것」을 골랐는데 **그게 틀린 신호였다** —
//    `EditorScreen:136` 이 출처를 모르면 `manual` 을 넣는다(= 기본값). 창업자의 세 편이 통째로
//    건너뛰어졌다(*"3개다 해요체로 안바뀌었어"*). → 이제 **말투로 가른다**(`politeFormalSteps`):
//    「~니다」만 고치고 「~다」는 그대로 둔다. 그래서 `source` 를 아예 안 본다.
const POLITE_V = 2
function migratePolite(recipes, saved) {
  if ((saved.politeV || 0) >= POLITE_V) return { recipes, politeV: saved.politeV }
  const out = recipes.map((r) => {
    if (!r || !Array.isArray(r.steps) || !r.steps.length) return r
    const steps = politeFormalSteps(r.steps)
    return steps.some((s, i) => s !== r.steps[i]) ? { ...r, steps } : r
  })
  return { recipes: out, politeV: POLITE_V }
}

// 🚚🚚 **이미 저장된 레시피의 «분량만 있는 줄»을 앞 재료에 붙인다** (창업자 2026-08-16)
//   📮 *"황태장아찌 요리시작 누르면 1/2컵이 줄바뀜으로 혼자 뜨는거"*
//      → *"그 레시피는 **테스터가 캡쳐해준거야.** 근데도 고칠 수가 없다고?"*
//   ⭐⭐ **파서만 고치면 «앞으로 가져올 것»만 고쳐진다** — 이미 폰에 든 건 그대로다.
//      테스터 폰·창업자 폰에 저장된 그 레시피는 앱을 켜는 순간 여기서 고쳐진다.
//   📌 규칙 18 ⓙ 그대로 — 「새로 까는 사람」만 보지 말고 **«이미 깔린 폰»을 본다.**
//   ⚠️ 한 번만 돈다(`qtyOnlyV`) — 유저가 일부러 그렇게 적었다면 두 번 손대지 않는다.
//   ⚠️ 규칙은 파서와 «똑같다»(`mergeQtyOnlyIngredients`) — 두 자리가 갈라지면 그때부터 어긋난다.
const QTY_ONLY_V = 1
function migrateQtyOnly(recipes, saved) {
  if ((saved.qtyOnlyV || 0) >= QTY_ONLY_V) return { recipes, qtyOnlyV: saved.qtyOnlyV }
  const out = recipes.map((r) => {
    if (!r || !Array.isArray(r.ingredients) || r.ingredients.length < 2) return r
    const ingredients = mergeQtyOnlyIngredients(r.ingredients)
    return ingredients === r.ingredients ? r : { ...r, ingredients }
  })
  return { recipes: out, qtyOnlyV: QTY_ONLY_V }
}

// 🗃🗃 **이미 임시보관함에 쌓인 것 중 «다 읽은 것»을 레시피 탭으로 옮긴다** (창업자 2026-09-01)
//
//   📮 창업자 = *"최근저장에는 뜨는데 레시피탭에 가면 안보여."*
//             · *"ai다 다 읽었으면 끝난거잖아. 그럼 수동으로 옮겨야해?"*
//
//   ⛔⛔ **앞으로 담는 것만 고치면 «이미 폰에 쌓인 것»은 영영 안 보인다**(규칙 18 ⓙ).
//      창업자가 본 삼치간장조림·투움바파스타가 바로 그 «이미 담긴» 것들이다.
//      화면(`MyRecipesScreen`)은 `status === 'sorted'` 만 보여주고, 홈 「최근 저장」은
//      status 를 «안» 가려서 — 두 화면이 서로 다른 말을 하고 있었다.
//
//   ⭐ 잣대는 `App.jsx` 공유받기와 **똑같다** — 재료·순서가 «둘 다» 2줄 이상.
//      ⛔ 두 자리가 갈라지면 그때부터 「담을 땐 되는데 이미 담긴 건 안 되는」 상태가 된다.
//   ⚠️ 한 번만 돈다(`inboxV`) — 유저가 일부러 임시보관함으로 되돌렸다면 두 번 손대지 않는다.
//   ⭐ 잃는 게 0이다 — 레시피가 «보이는 자리»만 바뀌고 내용은 한 글자도 안 건드린다.
// 📏📏 **「다 읽었나」 잣대 — ⭐이 저장소에서 «여기 한 곳»뿐이다** (2026-09-02)
//
//   ⛔⛔ 그 전엔 «똑같은 잣대»가 **두 곳에 복사**돼 있었다 —
//      아래 `migrateInboxSorted` ＋ `App.jsx` 공유받기 저장.
//      2026-09-02 에 `App.jsx` 의 `채우기()` 에도 같은 판정이 필요해져 **셋이 될 뻔했다.**
//   ⭐ 셋이 갈리면 그때부터 **「담을 땐 되는데 AI 가 채우면 안 되는」** 상태가 된다 —
//      바로 창업자가 겪은 그 모양이다(*"최근저장에는 뜨는데 레시피탭에 가면 안보여."*).
//   📌 그래서 잣대를 **바깥으로 내보내** 부르는 쪽이 셋이어도 «말이 하나»가 되게 한다.
//
//   ⚠️ 이 값을 고치면 **세 자리가 한꺼번에** 바뀐다 — 그게 목적이다. 한 곳만 바꾸지 말 것.
export function 다읽었나(r) {
  const 재료 = Array.isArray(r?.ingredients) ? r.ingredients.length : 0
  const 걸음 = Array.isArray(r?.steps) ? r.steps.length : 0
  return 재료 >= 2 && 걸음 >= 2
}

// 🖼🖼 **「표지에 뭘 그릴까」 잣대 — ⭐이 저장소에서 «여기 한 곳»뿐이다** (2026-09-02)
//   📮 창업자 = *"저 자리는 음식아이콘이 들어가야하는데 편집끝나도 사진으로 남는거야?"* → 판정 = **캡처는 표지 안 쓴다**
//   ⛔⛔ 그 전엔 «똑같은 잣대»가 **세 곳에 복사**돼 있었다 —
//      `Thumb.jsx:40` ＋ `DecorEditor.jsx:210` ＋ `EditorScreen.jsx:184`.
//   ⛔ 뿌리 = `image` 만 있으면 무조건 `'photo'` 였다. 그런데 공유받기가 **캡처를 `image` 에 그대로 담아서**
//      «글자 사진»이 레시피 카드 표지가 됐다 — 콩국수·김치찌개 사이에서 혼자 논다.
//   ⭐ 사진을 «지우는 게 아니다» — `image` 는 그대로 남아 「보면서 쓰기」에 쓰이고,
//      유저가 「사진」 칩을 누르면 그때 `thumb: 'photo'` 가 박혀 표지가 된다.
//   ⚠️ 대신 진짜 «음식 사진»을 공유받아도 아이콘이 된다 — 창업자가 알고 고른 값이다.
export function 기본표지(r) {
  if (r?.thumb) return r.thumb                       // 유저가 고른 게 있으면 그게 이긴다
  if (r?.image && r?.source !== 'photo') return 'photo'
  return 'icon'
}

// 🔢 `INBOX_V` — 올리면 **이미 폰에 쌓인 것**을 한 번 더 훑는다.
//   · 1 (2026-09-01) = 처음. 그때 임시보관함에 있던 것 중 다 읽은 것을 옮겼다.
//   · 2 (2026-09-02) = ⭐**창업자 판정** *"응, 한 번 더 훑는다"* —
//        1 이 돈 «뒤»에 AI 가 채운 것들(창업자 폰의 **항정살조림**)이 그대로 갇혀 있었다.
//        `채우기()` 고침은 «앞으로»만 고치므로 이 번호를 올려야 이미 갇힌 게 나온다(규칙 18 ⓙ).
const INBOX_V = 2
function migrateInboxSorted(recipes, saved) {
  if ((saved.inboxV || 0) >= INBOX_V) return { recipes, inboxV: saved.inboxV }
  const out = recipes.map((r) => {
    if (!r || r.status !== 'unsorted') return r
    return 다읽었나(r) ? { ...r, status: 'sorted' } : r
  })
  return { recipes: out, inboxV: INBOX_V }
}

// 🖼🔢 `COVER_V` — 올리면 **이미 폰에 박힌 캡처 표지**를 한 번 더 훑는다.
//   ⛔ 왜 필요한가 = `기본표지()` 는 «고른 게 없을 때»만 일한다. 그런데 편집기가 저장할 때
//      `thumb: 'photo'` 를 **도장처럼 박아둬서** 이미 편집한 적 있는 편은 잣대가 못 건드린다.
//   ⭐ 그래서 **도장을 지운다** — `'icon'` 을 새로 쓰지 않는다. 지우면 `기본표지()` 하나가 다시 정한다
//      (나중에 잣대를 바꾸면 그 편들도 같이 따라온다).
//   ⛔ 건드리는 범위 = **`source: 'photo'`**(＝공유받기·가져오기로 «사진»에서 온 것)뿐이다.
//      기본 레시피는 `source: 'hankki'` 라 안 걸리고, 손으로 만든 편도 안 걸린다.
//   ⚠️ 창업자가 알고 고른 값 = *"그것도 같이 고친다"* — 유저가 «일부러» 캡처를 표지로 둔 편도 바뀐다.
//      ⭐ 사진은 안 지우니 「사진」 칩을 다시 누르면 그대로 돌아온다.
//   · 1 (2026-09-02) = 처음.
const COVER_V = 1
function migrateCoverThumb(recipes, saved) {
  if ((saved.coverV || 0) >= COVER_V) return { recipes, coverV: saved.coverV }
  const out = recipes.map((r) => {
    if (!r || r.source !== 'photo' || r.thumb !== 'photo') return r
    const { thumb, ...나머지 } = r
    return 나머지
  })
  return { recipes: out, coverV: COVER_V }
}

// 📔📔 **샘플 일기 한 장** (창업자 2026-08-12 *"샘플레시피는 지울 수 있게도 해줘
//   자기 일기가 아니니까 지워도 되게(샘플이라고 적어주고)"*)
//
//   ⭐ **일기가 «한 장도 없는» 사람에게만** 놓는다 — 이미 쓰고 있는 사람의 목록에
//      갑자기 남의 일기가 끼어들면 그건 선물이 아니라 침입이다.
//      📌 규칙 18 ⓙ — 「새로 까는 사람」만 보지 말고 «이미 깔린 폰»을 본다. 여기선 **안 넣는 것**이 답이다.
//   ⭐ 한 번 지우면 `sampleGone` 이 남아 **영영 다시 안 생긴다.** 지웠는데 또 나오면 그건 고장이다.
//   ⚠️ 요리 기록(`kind` 없음)은 안 센다 — 「만들었어요」만 눌러 본 사람도 일기 샘플은 받아야 한다.
function withSample(saved) {
  const diary = saved.diary || []
  // ⏳ 창업자가 만든 진짜 샘플로 갈아끼우기 «전»엔 안 놓는다 — 까닭은 `sampleDiary.js` 맨 위에
  if (!SAMPLE_READY) return diary
  if (saved.sampleGone) return diary
  if (diary.some((d) => d.kind === 'diary')) return diary
  return [makeSampleDiary(), ...diary]
}

// 🚑🚑 **[2026-09-08 저녁] 두 종 핀 사고로 «빠진» 핀을 도로 꽂는다.**
//   📮 창업자 = *"하트누르니까 차례로 사라졌어"* — 실제로 지워진 건 레시피가 아니라 «핀»이다(전체 개수는 그대로).
//   🔎 표가 남아 있다 = `favPin === 'heart'` 는 **오늘 두 종이 나간 뒤에만** 붙을 수 있는 값이다.
//      그중 `favorite === false` 인 편 = 「모자 → 하트 → 빠짐」을 다 돈 것 ＝ 이 사고로 빠진 것.
//   ✅ 그래서 그 편만 도로 꽂는다. ⛔ 종(`favPin`)은 지우지 않는다 — 두 종을 다시 켜는 날 하트로 돌아온다.
//   ⚠️ 정직하게 = «일부러» 하트에서 뺀 사람도 도로 꽂힌다. 두 종이 나가 있던 시간이 반나절이라
//      그 수는 매우 적고, **잘못 꽂힌 건 한 번 눌러 빼면 되지만 잃은 핀은 스스로 못 찾는다**(절대원칙 34).
//   🔒 한 번만 돈다(`pinFixV`) — 그 뒤엔 유저가 뺀 것을 되살리지 않는다.
const PIN_FIX_V = 1
function migratePinLost(recipes, saved) {
  if ((saved.pinFixV || 0) >= PIN_FIX_V) return { recipes, pinFixV: saved.pinFixV }
  const out = recipes.map((r) =>
    r && r.favPin === 'heart' && !r.favorite ? { ...r, favorite: true } : r
  )
  return { recipes: out, pinFixV: PIN_FIX_V }
}

function initialState() {
  const saved = load()
  if (saved) {
    const mig = migrateBasics(saved)
    const memoMig = migrateMemos(mig.recipes, saved)
    const politeMig = migratePolite(memoMig.recipes, saved)
    const qtyMig = migrateQtyOnly(politeMig.recipes, saved)
    const inboxMig = migrateInboxSorted(qtyMig.recipes, saved)
    const coverMig = migrateCoverThumb(inboxMig.recipes, saved)
    const pinMig = migratePinLost(coverMig.recipes, saved)   // 🚑 두 종 사고로 빠진 핀 되살리기
    const diary = withSample(saved)
    return {
      recipes: reconcileCooked(pinMig.recipes, diary),
      seedV: mig.seedV,
      memoCleanV: memoMig.memoCleanV,
      politeV: politeMig.politeV,
      qtyOnlyV: qtyMig.qtyOnlyV,
      inboxV: inboxMig.inboxV,
      coverV: coverMig.coverV,
      pinFixV: pinMig.pinFixV,
      removedSeedIds: saved.removedSeedIds || [],
      // 🗂 기본 폴더가 «늘어날 때» — 이미 깔린 폰에도 넣어 준다.
      //    ⛔⛔ 기본값(아래 `folders: [...]`)만 고치면 «새로 까는 사람»만 받는다.
      //       이미 쓰던 사람은 `saved.folders` 를 그대로 쓰기 때문에 칩이 영영 안 생긴다
      //       (v10.76 사고와 같은 병 · 규칙 18 ⓙ = 「새로 까는 사람」 말고 «이미 깔린 폰»을 본다).
      //    ⭐ 「아시안」 때 이렇게 했고, 2026-09-03 「중식」도 같은 자리에 얹는다.
      //    ⛔ 유저가 «지운» 폴더까지 되살리는 셈이지만, 기본 폴더는 애초에 지울 수 없다
      //       (`DEFAULT_FOLDERS` = 삭제 불가). 그래서 되살아나는 일이 없다.
      folders: saved.folders
        // 🥄 [2026-09-14] 「소스」를 더했다 — 창업자 = "소스는 따로 넣자. 소스만 필요할때도 있거든"
        //    ⛔ 이 목록에 안 넣으면 «이미 쓰던 사람»은 소스 폴더가 영영 안 생긴다(위 경고 그대로).
        ? ['아시안', '중식', '소스'].reduce((목록, 새것) => (목록.includes(새것) ? 목록 : [...목록, 새것]), saved.folders)
        : defaultFolders(mig.recipes),
      profile: { ...PROFILE_DEFAULT, ...(saved.profile || {}) },
      shops: migrateShops(saved.shops),
      wishlist: [], // 위시는 장보기로 흡수됨 — 더 이상 별도 목록으로 쓰지 않는다
      shoppingList: foldWishIntoShopping(saved.wishlist, saved.shoppingList || migrateShopping()),
      pantry: saved.pantry || [],
      foodCost: Array.isArray(saved.foodCost) ? saved.foodCost : [],
      costShops: Array.isArray(saved.costShops) && saved.costShops.length ? saved.costShops : [...기본식비가게],
      foodBudget: { w: 0, m: 0, ...(saved.foodBudget || {}) },
      diary,
      sampleGone: saved.sampleGone || false,
    }
  }
  return {
    recipes: seedRecipes,
    seedV: BASICS_VERSION,
    memoCleanV: MEMO_CLEAN_V,
    politeV: POLITE_V,
    qtyOnlyV: QTY_ONLY_V, // 처음 켠 사람은 고칠 게 없다 — 이사를 «이미 한 것»으로 둔다
    inboxV: INBOX_V,      // 〃 (임시보관함에 쌓인 게 아예 없다)
    coverV: COVER_V,      // 〃 (캡처 표지가 박힌 게 아예 없다)
    removedSeedIds: [],
    folders: [...기본폴더],
    profile: PROFILE_DEFAULT,
    shops: DEFAULT_SHOPS,
    wishlist: [],
    shoppingList: [],
    pantry: [],
    foodCost: [],   // 💰 식비 줄(2026-09-17 시제품 · hold) — {id,d:'YYYY-MM-DD',k:'shop'|'out',won,memo?,items?:[{n,won}]}
    costShops: [...기본식비가게],   // 🏪 「가서 보고 와서 적기」 목록 — 유저가 더하고 지운다
    foodBudget: { w: 0, m: 0 },   // 💰 식비 예산 — w=한 주 · m=한 달. 0 이면 «안 세웠다»(막대를 안 그린다)
    // 📔 처음 켠 사람은 일기 탭이 텅 비어 「뭘 하는 곳인지」 안 보인다 → 샘플 한 장 놓아 둔다.
    //    ⏳ 스위치가 꺼져 있으면 빈 채로 둔다(까닭 = `sampleDiary.js` 맨 위)
    diary: SAMPLE_READY ? [makeSampleDiary()] : [],
    sampleGone: false,
  }
}

// 🗂🗂 **기본 폴더 = «여기 한 곳»에서만 적는다.** (2026-09-03 · 중식 넣으며 모았다)
//
// ⛔⛔ 그 전엔 같은 목록이 «네 곳»에 흩어져 있었다 —
//    ⑴ 처음 켠 사람 ⑵ 이미 쓰던 사람(마이그레이션) ⑶ 「초기화」 ⑷ 이 함수.
//    그래서 하나를 고치면 나머지가 낡았다. 실제로 ⑶은 «아시안»조차 빠져 있어서
//    **초기화를 누르면 폴더가 다섯에서 넷으로 줄었다.**
//    📌 「현행이 둘이면 하나는 반드시 틀린 값이 된다」(2026-08-13)와 같은 병이다.
//
// 🥟 순서 = 한식→중식→일식→양식→아시안→간식 (창업자 확정 2026-09-03 *"중식칩을 만들자."*)
//    ⭐ 가까운 나라끼리 붙여 눈이 덜 튄다. `theme.js` 의 `CATEGORIES` 와 «같은 순서»다.
// ⛔ 여기에 폴더를 더할 땐 위 마이그레이션의 목록에도 그 이름을 넣어야
//    **이미 깔린 폰**이 받는다(규칙 18 ⓙ).
// ⛔ 이 목록은 「유저가 지울 수 없는 폴더」를 정한다 — 레시피 탭 칩은 화면이 따로 정한다
//    (MyRecipesScreen 의 칩목록 = 나라들 ＋ 종류들 ＋ 유저가 만든 폴더).
export const 기본폴더 = ['한식', '중식', '일식', '양식', '아시안', '기타', '밥', '국', '면', '반찬', '간식', '샐러드', '소스']

function defaultFolders(recipes) {
  const set = new Set(기본폴더)
  recipes.forEach((r) => r.folder && set.add(r.folder))
  return [...set]
}

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      // 저장 날짜 자동 기록 — 상세 화면에 'N월 N일 저장'으로 표시된다.
      const rec = { savedAt: Date.now(), ...action.recipe }
      return { ...state, recipes: [rec, ...state.recipes] }
    }
    case 'update': {
      return {
        ...state,
        recipes: state.recipes.map((r) =>
          r.id === action.id ? { ...r, ...action.patch } : r
        ),
      }
    }
    case 'remove': {
      // 기본 제공 레시피를 지우면 기록해 둔다 — 이후 업데이트에서 되살아나지 않게.
      const removedSeedIds = String(action.id).startsWith('basic-')
        ? [...(state.removedSeedIds || []), action.id]
        : state.removedSeedIds || []
      return { ...state, removedSeedIds, recipes: state.recipes.filter((r) => r.id !== action.id) }
    }
    case 'toggleFav': {
      // 🔖 [2026-09-08] 종(`favPin`)은 «건드리지 않는다» — 뺐다가 다시 꽂아도 하트는 하트다.
      //    ⛔ 뺄 때 종을 지우면 유저가 잘못 눌러 뺀 뒤 다시 꽂았을 때 «모자로 되돌아간다».
      return {
        ...state,
        recipes: state.recipes.map((r) =>
          r.id === action.id ? { ...r, favorite: !r.favorite } : r
        ),
      }
    }
    // 🔖 종을 고른다 — 고르면 «꽂힌다». `pin` 이 `null` 이면 **뺀다**(종은 남겨 둔다).
    //   📮 창업자 2026-09-08 = *"요리사모자는 해볼것, 하트는 최애 두 종으로 가자"*
    //   ⭐ 「어느 종으로 갈 차례인가」는 여기서 정하지 않는다 — `favPin.js` 의 `nextPin()` 한 곳이 정한다.
    //      ⛔ 순서를 화면과 저장소 두 곳에 적으면 하나만 고쳤을 때 갈린다(favName·favPin 을 한 곳에 둔 이유와 같다).
    case 'setFavPin': {
      return {
        ...state,
        recipes: state.recipes.map((r) =>
          r.id === action.id
            ? (action.pin ? { ...r, favorite: true, favPin: action.pin } : { ...r, favorite: false })
            : r
        ),
      }
    }
    case 'cook': {
      return {
        ...state,
        recipes: state.recipes.map((r) =>
          r.id === action.id ? { ...r, cooked: (r.cooked || 0) + 1 } : r
        ),
      }
    }
    case 'addFolder': {
      if (!action.name || state.folders.includes(action.name)) return state
      return { ...state, folders: [...state.folders, action.name] }
    }
    case 'removeFolder': {
      // 폴더만 지운다 — 그 안에 있던 레시피는 카테고리 폴더로 되돌려 유지한다.
      return {
        ...state,
        folders: state.folders.filter((f) => f !== action.name),
        recipes: state.recipes.map((r) =>
          r.folder === action.name ? { ...r, folder: r.category || '' } : r
        ),
      }
    }
    case 'setProfile': {
      return { ...state, profile: { ...state.profile, ...action.patch } }
    }
    case 'clear': {
      // 기본 제공 포함 모든 레시피를 비우고 빈 아카이브로. (장보기·재료함은 유지)
      // 기본 레시피도 '지운 것'으로 기록해 이후 업데이트에서 되살아나지 않게 한다.
      const dead = new Set([...(state.removedSeedIds || []), ...basicRecipes.map((b) => b.id)])
      return { ...state, recipes: [], removedSeedIds: [...dead] }
    }
    case 'reset': {
      // 처음 상태로 — 기본 레시피를 다시 채우므로 삭제 기록도 초기화한다.
      // 👪 `action.전부` = 일기·재료함·장보기·가게까지 «다» 처음으로 (2026-09-10 · 다른 계정 「비우고 시작」 · 로그인-필수로 §10)
      //    ⛔ 설정의 「초기화」는 그대로(전부 없음) — 그 단추의 뜻(레시피만)을 안 바꾼다.
      const 전부 = action.전부 ? { diary: [], pantry: [], shoppingList: [], wishlist: [], shops: DEFAULT_SHOPS, sampleGone: false } : null
      return {
        ...state,
        ...전부,
        recipes: seedRecipes,
        seedV: BASICS_VERSION,
        removedSeedIds: [],
        // ⛔ 여기는 «아시안»조차 빠진 채 낡아 있었다 — 「초기화」를 누르면 폴더가 넷으로 줄었다.
        //    📌 같은 목록이 세 곳에 흩어져 있어서 하나를 고칠 때마다 나머지가 낡았다.
        //       그래서 `기본폴더` 한 곳으로 모았다(2026-09-03 · 중식 넣으며).
        folders: [...기본폴더],
        profile: PROFILE_DEFAULT,
      }
    }

    // 쇼핑몰 바로가기
    case 'addShop': {
      if (!action.shop?.name || !action.shop?.url) return state
      return { ...state, shops: [...state.shops, action.shop] }
    }
    case 'updateShop': {
      return {
        ...state,
        shops: state.shops.map((s) => (s.id === action.id ? { ...s, ...action.patch } : s)),
      }
    }
    case 'removeShop': {
      return { ...state, shops: state.shops.filter((s) => s.id !== action.id) }
    }

    // 사고 싶은 재료(위시리스트)
    case 'addWish': {
      return { ...state, wishlist: [action.item, ...state.wishlist] }
    }
    case 'updateWish': {
      return {
        ...state,
        wishlist: state.wishlist.map((w) => (w.id === action.id ? { ...w, ...action.patch } : w)),
      }
    }
    case 'toggleWishBought': {
      return {
        ...state,
        wishlist: state.wishlist.map((w) => (w.id === action.id ? { ...w, bought: !w.bought } : w)),
      }
    }
    case 'removeWish': {
      return { ...state, wishlist: state.wishlist.filter((w) => w.id !== action.id) }
    }

    // 장보기 체크리스트
    case 'addShopItems': {
      const existing = new Set(state.shoppingList.map((i) => i.name))
      const add = action.names
        .map((n) => n.trim())
        // 🚱 [2026-09-12] 물류는 아예 안 담는다 — 창업자 *"담기 누르면 물500ml이런것도 담겨"*
        .filter((n) => n && !existing.has(n) && 담을만한가(n))
        // 🔗 [2026-09-12] 아는 재료면 파트너스 링크를 «담을 때» 붙인다.
        //   ⛔ 옛 판은 이름만 담아서, 장보기의 `buyUrlFor()` 가 쿠팡 «일반 검색»으로 보냈다 = 수수료 0원.
        //   ⚠️ `url: undefined` 로 둔다(빈 문자열 아님) — `addShopItem` 과 같은 모양이라야
        //      장보기 줄을 읽는 쪽이 두 길을 다르게 보지 않는다.
        // 💰 [2026-09-18] 여기도 「두부 1910」을 가른다 — ⛔단수(addShopItem)만 고쳤다가 «직접 입력»이 안 먹었다.
        //    직접 입력 칸(ChecklistAdd)은 이 복수 길로 온다. 두 길을 같은 함수로 묶어 또 갈리지 않게 했다.
        .map((n) => {
          const { 이름, 값 } = 이름값가르기(n)
          return { id: newId(), name: 이름 || n, done: false, url: ingLink(이름 || n) || undefined, ...(값 ? { won: 값 } : {}) }
        })
      return { ...state, shoppingList: [...add, ...state.shoppingList] }
    }
    // 단건 담기 — 사러가기 링크(url)를 함께 저장(주부의 장바구니 '담기' 등). 이름 중복은 무시.
    //   🌱 `noBuy` = 「사러가기를 그리지 않는다」(한살림 = 조합원 전용 · 창업자 2026-08-17).
    //   ⛔⛔ 여기가 **필드를 골라서 새 객체를 만드는 자리**다 — 넘겨준 필드가 목록에 없으면
    //      **말없이 버려진다.** 실제로 `noBuy` 를 담는 코드를 써 놓고도 리스트엔 사러가기가 그대로 떴다
    //      (2026-08-17 · 게이트 50개가 전부 초록불이었고 «화면을 열어보고» 잡았다 — 규칙 21).
    case 'addShopItem': {
      // 💰💰 [2026-09-18 창업자 *"장보기에 두부를 적고 값을 눌러 또 금액을 적고 좀 번거로워"*]
      //   ⭐ 한 번에 친다 — 「두부 1910」 처럼 **이름 뒤에 숫자**를 붙이면 이름과 값으로 갈라 담는다.
      //   ⛔ 「돼지고기 600g」·「양파 1망」은 «사는 양»이라 값이 아니다 — 단위가 붙으면 안 센다(글자가 남으면 이름의 일부다).
      //   ⛔ 「양파 3」도 값이 아니다(3원짜리는 없다) — **세 자리(100원) 이상**만 값으로 본다.
      //   📌 값을 안 붙여도 그대로 담긴다 — 옛 방식이 그대로 산다.
      const { 이름: name, 값 } = 이름값가르기(action.item?.name || '')
      if (!name || state.shoppingList.some((i) => i.name === name)) return state
      if (!담을만한가(name)) return state   // 🚱 물류는 안 담는다 (창업자 2026-09-12)
      // 🔗 [2026-09-12] 주소를 «안 주고» 담는 자리(냉장고·직접 입력)도 아는 재료면 링크가 붙는다.
      //   ⛔ `noBuy`(한살림 = 조합원 전용)에는 절대 안 붙인다 — 사러가기를 «안 그리는» 줄이다.
      //      여기서 url 을 채우면 8/17 에 링크를 뺀 일이 통째로 헛일이 된다.
      const url = action.item.url || (action.item.noBuy ? '' : ingLink(name)) || undefined
      const item = { id: newId(), name, done: false, url, ...(값 ? { won: 값 } : {}), ...(action.item.noBuy ? { noBuy: true } : {}) }
      return { ...state, shoppingList: [item, ...state.shoppingList] }
    }
    case 'toggleShopItem': {
      // 체크(=샀어요)하면 냉장고 재료함에 자동으로 넣어준다. (중복 이름은 제외)
      const item = state.shoppingList.find((i) => i.id === action.id)
      const nowDone = item && !item.done
      let pantry = state.pantry
      if (nowDone && item && !pantry.some((p) => p.name === item.name)) {
        pantry = [{ id: newId(), name: item.name, icon: null, expiry: null, addedAt: Date.now() }, ...pantry]
      }
      return {
        ...state,
        shoppingList: state.shoppingList.map((i) =>
          i.id === action.id ? { ...i, done: !i.done } : i
        ),
        pantry,
      }
    }
    // ✏️ 장보기 줄 고치기 — 창업자 2026-08-16 *"근데 **사는 양은 유저가 맘대로 적을수 있어야지**"*
    //   ⭐ 레시피에서 담으면 「양파」로 들어오는데, 사람마다 사는 양이 다르다(1망·3개·600g).
    //      **담아주는 건 우리가 하고, 양은 유저가 적는다.**
    //   ⛔ 빈 이름으로는 안 바꾼다 — 지우려면 삭제(×)를 쓴다. 빈 줄이 남으면 그게 고장이다.
    case 'updateShopItem': {
      // ✏️💰 [2026-09-18] 고칠 때도 「두부 2500」을 가른다 — 담을 때와 «같은 함수»를 쓴다(두 벌이면 갈린다).
      //   ⛔ 숫자를 빼고 저장하면 값이 «지워진다» — 잘못 적은 값을 되돌리는 길이다(창업자 *"잘못 적었을때"*).
      const { 이름, 값 } = 이름값가르기(action.name || '')
      if (!이름) return state
      return {
        ...state,
        shoppingList: state.shoppingList.map((i) => {
          if (i.id !== action.id) return i
          const { won: _옛값, ...나머지 } = i
          return 값 ? { ...나머지, name: 이름, won: 값 } : { ...나머지, name: 이름 }
        }),
      }
    }
    case 'removeShopItem': {
      return { ...state, shoppingList: state.shoppingList.filter((i) => i.id !== action.id) }
    }
    case 'clearDoneShopItems': {
      // 🧹 「완료 지우기」 — 체크한 줄을 목록에서 뺀다. ⛔식비와 상관없다(그건 아래 'shopToFoodCost').
      return { ...state, shoppingList: state.shoppingList.filter((i) => !i.done) }
    }
    // 💰💰 [2026-09-17] 「값 적은 것 식비로 적기」
    //   ⛔⛔ 처음엔 «체크한 줄»만 봤다 — 그래서 창업자가 값만 적고 누르니 **0줄이 적혔는데 「식비에 적었어요」가 떴다**(거짓말).
    //      📮 창업자 = *"적었는데 장보기에 반영안됐아"* — 맞는 지적이다.
    //   ✅ 이제 «값이 적힌 줄»이면 체크와 상관없이 산 것으로 본다 — 값을 적었다는 건 이미 샀다는 뜻이다.
    //      그 줄들은 목록에서 빠지고 냉장고로 들어간다(체크했을 때와 같다).
    //   ⛔ 값이 하나도 없으면 «아무 일도 안 일어난다» — 화면이 「적었다」고 말하지 않게 0 을 돌려준다.
    case 'shopToFoodCost': {
      const 산것 = state.shoppingList.filter((i) => Number(i.won) > 0)
      if (!산것.length) return state
      const 이름들 = new Set(state.pantry.map((p) => p.name))
      const pantry = [
        ...산것.filter((i) => !이름들.has(i.name)).map((i) => ({ id: newId(), name: i.name, icon: null, expiry: null, addedAt: Date.now() })),
        ...state.pantry,
      ]
      const 줄 = {
        id: newId(), d: 오늘날짜(), k: 'shop',
        won: 산것.reduce((s, i) => s + Number(i.won), 0),
        items: 산것.map((i) => ({ n: i.name, won: Number(i.won) })),
      }
      return {
        ...state,
        foodCost: [줄, ...(state.foodCost || [])],
        shoppingList: state.shoppingList.filter((i) => !(Number(i.won) > 0)),
        pantry,
      }
    }
    // 💰 장보기 줄에 값 적기 — 안 적어도 된다. 0·빈칸이면 지운다. 최대 9,999,999.
    case 'setShopItemWon': {
      const won = Math.min(9999999, Math.max(0, Math.floor(Number(action.won) || 0)))
      return { ...state, shoppingList: state.shoppingList.map((i) => (i.id === action.id ? (won ? { ...i, won } : (({ won: _w, ...rest }) => rest)(i)) : i)) }
    }
    // 💰 식비 줄 직접 적기(외식·배달 · 또는 장보기 총액만) / 지우기
    case 'addFoodCost': {
      const won = Math.min(9999999, Math.max(0, Math.floor(Number(action.entry?.won) || 0)))
      if (!won) return state
      const e = { id: newId(), d: action.entry.d || 오늘날짜(), k: action.entry.k === 'out' ? 'out' : 'shop', won }
      if (action.entry.memo) e.memo = String(action.entry.memo).slice(0, 40)
      if (Array.isArray(action.entry.items) && action.entry.items.length) e.items = action.entry.items
      return { ...state, foodCost: [e, ...(state.foodCost || [])] }
    }
    // 🏪 식비 가게 — 더하기 · 지우기 · 「누른 때」 기억(자주 쓰는 곳이 앞으로 온다)
    case 'addCostShop': {
      const name = (action.shop?.name || '').trim()
      let url = (action.shop?.url || '').trim()
      if (!name || !url) return state
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url
      const 목록 = state.costShops || []
      if (목록.some((s) => s.url === url)) return state
      return { ...state, costShops: [...목록, { id: newId(), name: name.slice(0, 20), url, k: action.shop.k === 'out' ? 'out' : 'shop' }] }
    }
    case 'removeCostShop': {
      return { ...state, costShops: (state.costShops || []).filter((s) => s.id !== action.id) }
    }
    // 💰 예산 세우기 — 창업자 2026-09-18 *"이번주 식비를 20만원안에서 살기를 했어. 그럼 남은 돈 보는 것도?"*
    //   ⛔ 만 원 미만은 안 받는다 — 첫 기록에 바로 빨간 막대가 되어 조르는 꼴이 된다(설계 관문 2차).
    //   ⛔ 0 을 주면 «지운다» = 안 세운 상태로 돌아간다(막대가 사라진다).
    case 'setFoodBudget': {
      const 칸 = action.칸 === 'm' ? 'm' : 'w'
      const n = Math.min(99999999, Math.floor(Number(action.won) || 0))
      if (n && n < 10000) return state
      return { ...state, foodBudget: { ...(state.foodBudget || { w: 0, m: 0 }), [칸]: n } }
    }
    // 📅 달 «시작일» — 창업자 2026-09-20 *"나는 보통 9월 13일-10월 12일 이렇게 계산하거든"* (급여일 살림)
    //   ⭐ 시작일 하나면 끝날짜는 «다음 시작일 하루 전»으로 저절로 — 달 길이(28·30·31)와 무관하다.
    //   ⛔ 29~31 은 못 고른다 — 2월에 그 날이 없어 구간이 깨진다. 1 = 지금과 같음(1일~말일).
    case 'setFoodMonthStart': {
      const n = Math.floor(Number(action.day) || 1)
      if (n < 1 || n > 28) return state
      return { ...state, foodBudget: { ...(state.foodBudget || { w: 0, m: 0 }), start: n } }
    }
    // 📅 주 «시작 요일» — 창업자 2026-09-20 *"주도 달력에서 날짜 고를수있어??"* → 토요일 장 보는 집은 토~금
    //   값 = getUTCDay 와 같은 숫자(0=일 · 1=월 … 6=토) · 기본 1(월요일 · 2026-08-03 창업자 확정 그대로)
    case 'setFoodWeekStart': {
      const n = Math.floor(Number(action.day))
      if (!(n >= 0 && n <= 6)) return state
      return { ...state, foodBudget: { ...(state.foodBudget || { w: 0, m: 0 }), wstart: n } }
    }
    case 'usedCostShop': {
      // ⭐ 누를 때마다 시각을 적어 둔다 — 화면은 이 값으로 «최근 쓴 순»으로 줄을 세운다(손으로 끌어 옮길 필요가 없다)
      return { ...state, costShops: (state.costShops || []).map((s) => (s.id === action.id ? { ...s, at: Date.now() } : s)) }
    }
    // ✏️ 적은 줄 고치기 — 창업자 2026-09-18 «저기도 수정가능하게»
    //   ⛔ 지우고 새로 넣지 «않는다» — 그러면 목록 맨 위로 튀어올라 「어디 갔지」가 된다. 자리에 둔 채 값만 바꾼다.
    //   ⭐ 값을 0 으로 고치려 하면 아무 일도 안 한다(지우기는 X 가 맡는다 — 물어보고 지운다).
    case 'editFoodCost': {
      const won = Math.min(9999999, Math.max(0, Math.floor(Number(action.patch?.won) || 0)))
      if (!won) return state
      return {
        ...state,
        foodCost: (state.foodCost || []).map((e) => {
          if (e.id !== action.id) return e
          const 새것 = { ...e, won, d: action.patch.d || e.d, k: action.patch.k === 'out' ? 'out' : 'shop' }
          const memo = (action.patch.memo || '').trim()
          if (memo) 새것.memo = memo.slice(0, 40)
          else delete 새것.memo
          return 새것
        }),
      }
    }
    case 'removeFoodCost': {
      return { ...state, foodCost: (state.foodCost || []).filter((e) => e.id !== action.id) }
    }
    case 'clearShopItemsAll': {
      return { ...state, shoppingList: [] }
    }

    // 냉장고 재료함(재고)
    case 'addPantry': {
      return { ...state, pantry: [action.item, ...state.pantry] }
    }
    case 'updatePantry': {
      return {
        ...state,
        pantry: state.pantry.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)),
      }
    }
    case 'removePantry': {
      return { ...state, pantry: state.pantry.filter((p) => p.id !== action.id) }
    }

    // 요리 일지 — 저장한 레시피에 연결된 기록(별점·팁·사진). '만들었어요'가 항목을 만든다.
    case 'addDiary': {
      // 📌 메모지 종이를 «만들 때» 적어 둔다 (창업자 2026-08-20 「레시피마다 다르게」)
      //   ⛔ 안 적고 그때그때 계산하면, 종이를 «추가»하는 날 이미 쓴 메모의 종이가 전부 갈린다
      //      (해시 % 16 → % 20). 유저 눈엔 「내 메모지가 왜 바뀌었지」가 된다. → `src/memoPaper.js`
      const e = action.entry
      return { ...state, diary: [{ ...e, paper: e.paper || pickPaper(e.recipeId) }, ...state.diary] }
    }
    case 'updateDiary': {
      return {
        ...state,
        diary: state.diary.map((d) => (d.id === action.id ? { ...d, ...action.patch } : d)),
      }
    }
    case 'removeDiary': {
      // 기록을 지우면 그 레시피의 '만든 횟수'도 함께 1 줄인다.
      // (cooked는 '만들었어요'가 diary 항목과 항상 짝으로 올리므로, 지울 때도 짝으로 내려 어긋나지 않게 한다)
      // ⭐⭐ [2026-08-12] «1 빼기» 대신 **남은 기록으로 다시 센다**.
      //   📮 창업자 *"자주해먹는 요리는 지워도 계속 뜸."*
      //   ⛔ 옛 방식(`cooked - 1`)은 «어긋난 값을 물려받는다» — 한 번이라도 어긋나면
      //      `reconcileCooked`(293줄)가 **앱을 다시 켤 때까지** 안 고쳐준다.
      //      그래서 지웠는데도 `cooked > 0` 이 남아 「자주 해먹는 요리」(HomeScreen:156)에 계속 떴다.
      //   ✅ 지운 뒤 남은 diary 로 «전부 다시 세면» 어긋날 자리가 없다. 그 자리에서 맞는다.
      //   ⛔ 그래도 원인을 다 잡은 건 아니다 — 「레시피 삭제」(`case 'remove'`)는 여전히 diary 를
      //      안 건드린다. 지운 레시피의 기록이 달력·앨범에 남는 건 «창업자 판정»이 필요한 자리다.
      const 남은diary = state.diary.filter((d) => d.id !== action.id)
      // 📔 **샘플을 지우면 영영 다시 안 생긴다** (창업자 2026-08-12 *"지워도 되게"*)
      //   ⛔ 이 한 줄이 없으면 앱을 다시 켤 때 `withSample` 이 «일기 0장」을 보고 또 놓는다
      //      = 지웠는데 또 나온다 = 고장으로 읽힌다.
      if (action.id === SAMPLE_DIARY_ID) {
        return { ...state, diary: 남은diary, sampleGone: true, recipes: reconcileCooked(state.recipes, 남은diary) }
      }
      return {
        ...state,
        diary: 남은diary,
        recipes: reconcileCooked(state.recipes, 남은diary),
      }
    }

    // 백업 불러오기 — 저장된 데이터로 전체 교체(기본값과 병합해 누락 방지)
    //
    // 🔢🔢 **[2026-09-02] 「이사 도장」을 «같이» 넘긴다 — 안 넘기면 복원할 때마다 전부 다시 돈다.**
    //   ⛔⛔ 그 전엔 `politeV·qtyOnlyV·inboxV·coverV·sampleGone` 이 **하나도 안 넘어갔다.**
    //      그래서 백업을 되살리면 이사 다섯이 **처음부터 또** 돌았다 —
    //      · `inboxV` = 임시보관함에 «일부러» 남겨둔 것이 통째로 졸업한다
    //      · `coverV` = 유저가 「사진」 칩으로 도로 세운 표지 도장이 또 지워진다
    //      · `sampleGone` = **지운 샘플 일기가 되살아난다**(창업자 2026-08-12 *"지워도 되게"* 가 깨진다)
    //   ⭐ 값은 **큰 쪽으로** 고른다 — 옛 백업(도장 없음)을 되살려도 «지금 폰이 이미 한 이사»를 다시 하지 않는다.
    //   📌 규칙 18 ⓙ 의 짝이다 — 「새로 까는 사람」이 아니라 **「되살리는 사람」**을 본 것.
    case 'importAll': {
      const d = action.data || {}
      if (!Array.isArray(d.recipes)) return state
      return {
        seedV: Math.max(state.seedV || 0, d.seedV || 0, BASICS_VERSION),
        memoCleanV: Math.max(state.memoCleanV || 0, d.memoCleanV || 0),
        politeV: Math.max(state.politeV || 0, d.politeV || 0),
        qtyOnlyV: Math.max(state.qtyOnlyV || 0, d.qtyOnlyV || 0),
        inboxV: Math.max(state.inboxV || 0, d.inboxV || 0),
        coverV: Math.max(state.coverV || 0, d.coverV || 0),
        // 🧹 샘플은 «둘 중 하나라도» 지웠으면 지운 것이다(되살아나면 안 된다)
        sampleGone: !!(state.sampleGone || d.sampleGone),
        removedSeedIds: d.removedSeedIds || state.removedSeedIds || [],
        recipes: d.recipes,
        folders: d.folders || defaultFolders(d.recipes),
        profile: { ...PROFILE_DEFAULT, ...(d.profile || {}) },
        shops: d.shops || DEFAULT_SHOPS,
        wishlist: [], // 위시는 장보기로 흡수 — 백업 복원 시에도 합쳐서 불러온다
        shoppingList: foldWishIntoShopping(d.wishlist, d.shoppingList || []),
        pantry: d.pantry || [],
        foodCost: Array.isArray(d.foodCost) ? d.foodCost : (state.foodCost || []),   // 💰 백업에 식비가 없으면(옛 백업) 지금 폰 것을 지킨다
        costShops: Array.isArray(d.costShops) && d.costShops.length ? d.costShops : (state.costShops || [...기본식비가게]),
        foodBudget: { w: 0, m: 0, ...(state.foodBudget || {}), ...(d.foodBudget || {}) },   // 💰 옛 백업이면 지금 폰 예산을 지킨다
        diary: d.diary || [],
      }
    }

    default:
      return state
  }
}

const Ctx = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)

  // 🧷🧷 **[2026-09-02 · 창업자 제보로 잡은 사고] 「지금 상태」를 참조로 들고 있는다.**
  //   ⛔⛔ 아래 「주인 없는 사진 청소」가 `[]` 로 걸려 있어 **8초 뒤에 도는 코드가
  //      «앱을 켠 순간»의 `state` 를 봤다**(stale closure). 그 사이에 담은 사진은
  //      「살아있는 열쇠」 명단에 없어 **주인 없는 것으로 잡혀 지워졌다.**
  //   🔢 실측(`_repro-청소가새사진지움-0902.mjs`) = 창고를 1초마다 찍으니
  //      0~3초 있다 ✅ → 4초 없다 ⛔ (페이지 연 지 ~8초). **들어갔다가 지워진다.**
  //   📮 창업자 = *"채우러가기 눌렀는데 이래"* — 캡처가 깨진 아이콘이었던 그 뿌리다.
  //   ⛔ 안전장치(`살아있는열쇠.size === 0`)는 **처음부터 사진이 하나도 없을 때만** 막아서
  //      창업자 폰(사진 11.8MB)엔 안 걸렸다.
  //   📌 오늘 아침 축소 루프에서 고친 것과 **똑같은 병**이다 — 같은 파일에 하나 더 있었다.
  const 지금state = useRef(state)
  지금state.current = state

  // 🗄🗄 **사진은 «큰 창고»(IndexedDB)에, 글자만 서랍에** (2026-09-02 · 창업자 폰 실물 확인 뒤)
  //
  //   🔢 창업자 폰 = **4.56MB / 5MB = 91%** · 창고 한도 **10,731MB**(2,000배)
  //   🚨 **순서가 목숨이다** — 창고에 «먼저» 넣고, **성공했을 때만** 서랍에서 뺀다.
  //      뒤집으면 「서랍에도 없고 창고에도 없는」 창이 생기고, 그때 서비스워커가 새로고침하면 사진을 잃는다.
  //   ⛔ 창고가 안 되면(못 열림·꽉 참) **사진을 안 뺀다** — 지금과 «같아질 뿐» 나빠지지 않는다.
  //   ⭐ 사진 자리엔 `null` 이 아니라 **쪽지**(`idb://…`)를 남긴다 —
  //      `null` 이면 「사진이 없다」와 구별이 안 돼서, 일기 연동·자랑카드 올리기가 조용히 깨진다.
  useEffect(() => {
    let 취소 = false
    ;(async () => {
      let 저장할판 = state
      try {
        const { 판, 사진들 } = 나누기(지금state.current)
        if (사진들.length) {
          // ⭐ 한 거래로 묶어 넣는다 — 100장에 8ms(한 장씩이면 183ms · 실측)
          const 됐나 = await 여럿넣기(사진들)
          if (취소) return
          if (됐나) 저장할판 = 판   // ✅ 창고에 «들어간 뒤에만» 서랍에서 뺀다
        } else {
          저장할판 = 판
        }
      } catch { /* 창고가 말썽이면 지금까지처럼 통째로 저장한다 */ }
      if (취소) return
      쓰기(저장할판)
    })()
    return () => { 취소 = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  // 🧹🧹 **주인 없는 사진을 쓸어담는다** — 레시피·일기·꾸미기를 지웠는데 창고에 사진만 남는 것 방지
  //
  //   ⛔⛔ **지우는 자리를 하나씩 고치면 «반드시» 빠뜨린다** — 레시피 삭제(`remove`)·전체 비우기(`clear`)·
  //      초기화(`reset`) 말고도 **꾸미기 스티커 하나 떼기 · 일기 한 장 지우기 · 표지 바꾸기**가 다 사진을 버린다.
  //      ⭐ 그래서 «지우는 곳»이 아니라 **«남아 있는 것»을 기준**으로 판단한다. 새 삭제 경로가 생겨도 저절로 걸린다.
  //   🔒 `public/delete-account.html` 이 「앱에서 직접 삭제」를 약속하고 있다 — 안 지우면 그 신고와 어긋난다.
  //
  //   🚨 **안전장치 = 「지금 상태가 쓸 열쇠」를 «둘 다» 센다.**
  //      아직 이사 전이라 사진이 `data:` 로 들어 있어도 `나누기()` 가 «쓰게 될 열쇠»를 알려준다.
  //      ⛔ 쪽지만 세면 이사 «직전»에 쓸어담아 **멀쩡한 사진을 통째로 지운다.**
  //   ⏰ 앱을 켜고 8초 뒤 «한 번만» — 첫 화면을 먼저 그리고, 매 저장마다 훑지 않는다(절대원칙 32).
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        // 🧷 «지금» 상태로 센다 — `state` 를 그대로 쓰면 켠 순간 값에 굳어 새 사진을 지운다(위 주석)
        const 살아있는열쇠지금 = () => {
          const { 판, 사진들 } = 나누기(지금state.current)
          return new Set([...사진들.map(([k]) => k), ...쪽지열쇠모으기(판)])
        }
        const 살아있는열쇠 = 살아있는열쇠지금()
        const 창고열쇠 = await 창고열쇠들()
        // ⏳⏳ **창고를 읽는 «동안»에도 사진이 들어온다** — 그 사이에 담긴 것을 지우면 같은 사고다.
        //   ⭐ 그래서 지우기 «직전»에 한 번 더 세고, **두 번 다 주인이 없는 것만** 지운다.
        //      한 번이라도 살아 있었으면 놔둔다 — 「살릴 쪽으로 기운다」(사진을 잃는 건 되돌릴 수 없다).
        const 살아있는열쇠2 = 살아있는열쇠지금()
        const 주인없는 = 창고열쇠.filter((k) => !살아있는열쇠.has(k) && !살아있는열쇠2.has(k))
        // ⛔ 「전부 주인이 없다」면 **뭔가 잘못 읽은 것**이다(상태가 아직 안 왔을 수 있다) — 그때는 손대지 않는다
        if (!주인없는.length || (창고열쇠.length && 주인없는.length === 창고열쇠.length && 살아있는열쇠2.size === 0)) return
        await 창고에서지우기(주인없는)
      } catch { /* 청소는 «있으면 좋은 것» — 실패해도 앱은 그대로 돈다 */ }
    }, 8000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function 쓰기 (저장할판) {
    try {
      const 글 = JSON.stringify(저장할판)
      // 📊📊 **서랍이 얼마나 찼나 — 「쓰기 «직전»」에 잰다** (2026-09-02)
      //   ⛔⛔ `navigator.storage.estimate()` 로는 **못 잰다** — 그건 localStorage 를 «안 센다»
      //      (실측: 1MB 를 넣어도 0KB · `scripts/_probe-계기판-0902.mjs`).
      //      그걸로 계기판을 만들면 **꽉 차서 터지는 순간에도 「3%」라고 말한다** — 지금보다 나쁘다.
      //   ⭐ 그래서 **우리가 쓰는 글자 수**를 직접 센다. 그게 진짜 벽에 닿는 값이다.
      //   ⏰ 재는 시점이 「설정 화면」이면 늦다 — 자랑카드 한 장에 **한 방에** 넘어간다.
      //      쓰기 직전에 재야 **차기 «전»에** 말할 수 있다.
      서랍글자수 = 글.length
      if (글.length > 서랍한도 * 0.8) {
        const 이제 = Date.now()
        if (이제 - 마지막경고 > 5 * 60 * 1000) {   // 5분에 한 번 — 매 저장마다 뜨면 잔소리가 된다
          마지막경고 = 이제
          try { window.dispatchEvent(new CustomEvent('hankki:storagewarn', { detail: { 쓴것: 글.length, 한도: 서랍한도 } })) } catch { /* noop */ }
        }
      }
      localStorage.setItem(KEY, 글)
      마지막저장성공 = Date.now()
      // 🪞 아이폰 앱이면 10초 뒤 문서 폴더에 한 벌 더(거울) — 웹·안드로이드에선 바로 false 로 끝난다
      try { 거울예약() } catch { /* 거울은 덤 — 본체 저장은 이미 끝났다 */ }
    } catch {
      // 저장 공간 초과(특히 iOS ~5MB) — 조용히 사라지면 안 된다(핵심 약속: 레시피 보관)
      마지막저장실패 = Date.now()
      // ⛔⛔ [2026-09-02] **60초 침묵을 없앴다.** 창업자가 8:41·8:42 에 잇달아 담았는데
      //    첫 번째가 경고를 써버려서 **두 번째는 완전히 조용히 사라졌다** — 그게 「흔적도 없이」의 정체다.
      //    📌 실패는 «매번» 말한다. 시끄러운 게 잃는 것보다 낫다.
      try { window.dispatchEvent(new CustomEvent('hankki:storagefull')) } catch { /* noop */ }
    }
  }

  const api = {
    ...state,
    addRecipe: useCallback((recipe) => dispatch({ type: 'add', recipe }), []),
    updateRecipe: useCallback((id, patch) => dispatch({ type: 'update', id, patch }), []),
    removeRecipe: useCallback((id) => dispatch({ type: 'remove', id }), []),
    toggleFavorite: useCallback((id) => dispatch({ type: 'toggleFav', id }), []),
    setFavPin: useCallback((id, pin) => dispatch({ type: 'setFavPin', id, pin }), []),
    cook: useCallback((id) => dispatch({ type: 'cook', id }), []),
    addFolder: useCallback((name) => dispatch({ type: 'addFolder', name }), []),
    removeFolder: useCallback((name) => dispatch({ type: 'removeFolder', name }), []),
    setProfile: useCallback((patch) => dispatch({ type: 'setProfile', patch }), []),
    clearAll: useCallback(() => dispatch({ type: 'clear' }), []),
    reset: useCallback((전부 = false) => dispatch({ type: 'reset', 전부: 전부 === true }), []),
    addShop: useCallback((shop) => dispatch({ type: 'addShop', shop }), []),
    updateShop: useCallback((id, patch) => dispatch({ type: 'updateShop', id, patch }), []),
    removeShop: useCallback((id) => dispatch({ type: 'removeShop', id }), []),
    addWish: useCallback((item) => dispatch({ type: 'addWish', item }), []),
    updateWish: useCallback((id, patch) => dispatch({ type: 'updateWish', id, patch }), []),
    toggleWishBought: useCallback((id) => dispatch({ type: 'toggleWishBought', id }), []),
    removeWish: useCallback((id) => dispatch({ type: 'removeWish', id }), []),
    addShopItems: useCallback((names) => dispatch({ type: 'addShopItems', names }), []),
    addShopItem: useCallback((item) => dispatch({ type: 'addShopItem', item }), []),
    toggleShopItem: useCallback((id) => dispatch({ type: 'toggleShopItem', id }), []),
    updateShopItem: useCallback((id, name) => dispatch({ type: 'updateShopItem', id, name }), []),
    removeShopItem: useCallback((id) => dispatch({ type: 'removeShopItem', id }), []),
    clearDoneShopItems: useCallback(() => dispatch({ type: 'clearDoneShopItems' }), []),
    setShopItemWon: useCallback((id, won) => dispatch({ type: 'setShopItemWon', id, won }), []),
    shopToFoodCost: useCallback(() => dispatch({ type: 'shopToFoodCost' }), []),
    addCostShop: useCallback((shop) => dispatch({ type: 'addCostShop', shop }), []),
    removeCostShop: useCallback((id) => dispatch({ type: 'removeCostShop', id }), []),
    usedCostShop: useCallback((id) => dispatch({ type: 'usedCostShop', id }), []),
    setFoodMonthStart: useCallback((day) => dispatch({ type: 'setFoodMonthStart', day }), []),
    setFoodWeekStart: useCallback((day) => dispatch({ type: 'setFoodWeekStart', day }), []),
    setFoodBudget: useCallback((칸, won) => dispatch({ type: 'setFoodBudget', 칸, won }), []),
    addFoodCost: useCallback((entry) => dispatch({ type: 'addFoodCost', entry }), []),
    editFoodCost: useCallback((id, patch) => dispatch({ type: 'editFoodCost', id, patch }), []),
    removeFoodCost: useCallback((id) => dispatch({ type: 'removeFoodCost', id }), []),
    clearShopItemsAll: useCallback(() => dispatch({ type: 'clearShopItemsAll' }), []),
    addPantry: useCallback((item) => dispatch({ type: 'addPantry', item }), []),
    updatePantry: useCallback((id, patch) => dispatch({ type: 'updatePantry', id, patch }), []),
    removePantry: useCallback((id) => dispatch({ type: 'removePantry', id }), []),
    addDiary: useCallback((entry) => dispatch({ type: 'addDiary', entry }), []),
    updateDiary: useCallback((id, patch) => dispatch({ type: 'updateDiary', id, patch }), []),
    removeDiary: useCallback((id) => dispatch({ type: 'removeDiary', id }), []),
    importAll: useCallback((data) => dispatch({ type: 'importAll', data }), []),
  }

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

// 새 레시피 id 생성 — Date.now 는 브라우저 런타임에서 사용 가능
// 💰 오늘 날짜 — ⛔여기서 만들지 않는다(절대원칙 27 · check-kst 게이트). src/today.js 한 곳뿐.
const 오늘날짜 = () => todayKST()

// 💰💰 [2026-09-18 창업자 *"두부를 적고 값을 눌러 또 금액을 적고 좀 번거로워"*]
//   「두부 1910」 → { 이름: '두부', 값: 1910 }. ⛔담는 길이 둘(단수·복수)이라 «한 함수»로 묶는다 — 따로 두면 반드시 갈린다.
//   ⛔ 「돼지고기 600g」·「양파 1망」은 «사는 양»이라 값이 아니다(숫자 뒤에 글자가 남는다).
//   ⛔ 「양파 3」도 값이 아니다 — 세 자리(100원) 이상만 값으로 본다.
//   ⭐⭐ [2026-09-18 창업자 *"1990뒤에 원이나 ₩ 이런걸 붙이면 좋겠고"*] 「원」·「₩」·쉼표를 «다» 받는다.
//      ⛔ 안내에 「1,910원」이라 써 놓고 파서가 숫자만 받으면 **안내가 함정이 된다** —
//         시킨 대로 「두부 1910원」이라 쳤는데 이름이 「두부 1910원」이 되고 금액은 0 이 된다.
//      ⭐ 그래서 «보여주는 꼴»과 «받는 꼴»을 같이 넓혔다. 받는 꼴 = 두부 1910 · 두부 1,910원 · 두부 ₩1910
export function 이름값가르기(글) {
  const t = String(글 || '').trim()
  const m = t.match(/^(.+?)\s+₩?\s*([0-9][0-9,]{2,})\s*원?$/)
  if (!m) return { 이름: t, 값: 0 }
  const n = Number(m[2].replace(/,/g, ''))
  if (!(n >= 100 && n <= 9999999)) return { 이름: t, 값: 0 }
  return { 이름: m[1].trim(), 값: n }
}

export function newId() {

  return 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}
