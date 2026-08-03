import { isSeason, inCardWindow, seasonsNow } from '../season'
import { SEASON_CUTS } from '../data/cardSeasons'
import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { toPng, toJpeg } from 'html-to-image'
import Icon from './Icon'
// ⛔ UI엔 유니코드 이모지를 쓰지 않는다 — 우리 아이콘·스티커만(CLAUDE.md 핀).
//    v8.63에서 앱 전체를 정리할 때 이 시트는 '보류'로 빠져 🔄💌🖼🐻🐧가 남아 있었다(2026-07-29 정리).
import uiDuoHi from '../assets/stickers/photo/gp_duohi.png'

// 🎴 공유 "뽑기카드" — 레시피마다 스타일×곰펭 랜덤. 🔄로 다시뽑기(가챠), 공유는 Web Share.
// ⭐ 곰펭 풀 = src/assets/sharepool 폴더 전체를 glob → "폴더에 넣기만 하면 자동으로 다 쓰임"
//    (저장해두고 안 쓰는 문제를 코드가 구조적으로 차단. 새 포즈 추가 = 그냥 폴더에 넣으면 끝.)
const POOL = import.meta.glob('../assets/sharepool/*.png', { eager: true, query: '?url', import: 'default' })
const ENTRIES = Object.entries(POOL).map(([k, url]) => ({ name: k.split('/').pop(), url }))
// 🍳 **레시피 자랑 카드엔 음식·요리 컷만 쓴다.**
//    예전엔 포즈 컷(엄지·브이·인사)을 쓰고 요리 아이콘을 옆에 따로 붙였는데,
//    그게 허공에 뜬 것처럼 어색했다(창업자 "음식 빼, 카드 이상해져").
//    ⭐ 2026-07-29 풀 확장: sharepool 밖에 요리·음식 컷이 더 있었다
//       (창업자 "요리하는 거, 음식 먹고 들고 있고… 자산 많잖아" / "이거말고 더있잖아 찾아봐").
//       · `곰펭-에피소드-2507/낱개` → duo_cooking·cart·dessert / gom_shop·shop_walk / peng_shop
//       · `음식라이프-…/콤비장면` **2시트가 아예 안 잘려 있었다** → duo_cook·serve·eat·menu·tea·popcorn
//       · 여름 흰배경 컷(`sm_*`)은 앱엔 있었지만 카드 풀엔 없었다
//    ⚠️ duo_n_beer(맥주)는 전체이용가 때문에 제외.
const COOK = /^(gom_(carrot|dough|eat|heartplate|nyam|pan|pasta|pot|shop|shop_walk|surprise)|peng_(nyam|shop)|pn_(cake|drink|fruit|icecream)|duo_(cart|cook|cooking|dessert|eat|menu|popcorn|serve|tea|n_cheers|rest|shop))/
// 🏖 여름 스킨 전용 — 수박·냉면·빙수를 12월 카드에 올리면 이상하니까 여름 카드에서만 뽑는다.
const SUMMER = /^(sm_|duo_(bingsu|naengmyeon|watermelon))/
// 🎃 핼러윈 카드 배경 — 창업자 2026-08-03 *"아까 우리 펠트배경 하나 남은거 그거 자랑카드로 쓰면 어때"*
//   ⭐ 핼러윈 «팩» 배경으로는 밝아서 안 골랐던 판이다(빛 효과가 죽는다). 그런데 **카드는 정지 그림**이라
//      밝기가 흠이 아니고, 오히려 **펠트 질감이 우리 카드 6종엔 하나도 없는 결**이라 확 갈린다.
//   ⛔ 원본은 1254 정사각인데 카드는 1080×1350 이다 → **미리 4:5 로 잘라 파일로 굳혔다**
//      ( 로 맡기면 좌우 유령의집·무덤이 잘린다)
//   ⚠️ JPEG 다 — PNG(2.15MB)는 서비스워커 미리받기 한도 2MB를 넘어 **빌드가 막혔다.**
//      투명이 필요 없는 사진이라 JPEG 로 굽는다(품질 90 · 크로마 서브샘플링 끔 = 글자·선이 안 뭉갠다)
import HW_FELT from '../assets/cardbg/hw_felt.jpg'
// 🎃 펠트 소품 — 창업자 2026-08-03 *"필요하면 써 자랑카드꾸밀때"* (3×3 로 다시 뽑아준 시트)
//   ⭐ 배경과 **같은 펠트 소재**라 카드 위에서 결이 안 싸운다.
//   ⚠️ hwf_04(검은고양이)는 유료팩 `hs_04` 와 «소재»가 겹치지만 **그대로 쓴다** —
//      창업자 2026-08-03 *"똑같은 거 안주면 되지 **아이템까지 다 안겹치게 갈순없어**"*
//      ⭐ 기준은 «같은 그림인가»지 «같은 소재인가»가 아니다. 펠트 자수 ↔ PET 필름은 마감이 완전히 다르다.
//      📌 클로드가 과하게 뺐다가 되돌린 것 — 원칙을 넓게 적용하면 쓸 게 없어진다.
//   ⚠️ 배경 그림에 이미 호박·유령의집·거미줄·박쥐가 있다 → **세 개만** 얹는다. 더 붙이면 복잡해진다.
const HWF = Object.values(import.meta.glob('../assets/cardbg/hwf/*.png', { eager: true, query: '?url', import: 'default' }))
// 🎃 핼러윈 스킨엔 **핼러윈 애들만** 올린다 (창업자 *"거기에는 딱 할로윈애들만 넣을 수있게"*)
//   여름 스킨이 여름 컷만 쓰는 것과 같은 규칙 — 배경이 세니까 아무 컷이나 얹으면 결이 죽는다.
const HALLOWEEN = /^hw_/
// 🏮 추석 카드 배경 — 창업자 2026-08-03 *"이쁘게 만들어줘 카드 추석자랑카드에 조각보넣던가.."*
//   ⭐ 조각보는 **무료 드립 배경**이라 유료팩 누수 걱정이 없다(배경 README 배정표).
//      핼러윈이 펠트면 추석은 조각보 — 둘 다 «천 소재»라 계절 카드끼리 결이 맞는다.
//   가운데 얼룩 7.4(추석 팩 배경 14.2보다 깨끗) · 밝기 187.6 → 글자는 크림 판 위에 올린다.
import CS_JOGAKBO from '../assets/cardbg/cs_jogakbo.jpg'
const HANBOK = /^(cs_|hb)/   // 한복 = 추석 카드에서만
const pickPool = (re, withSummer) => {
  const ok = (n) => COOK.test(n) || (withSummer && SUMMER.test(n))
  const hit = ENTRIES.filter((e) => re.test(e.name) && ok(e.name))
  return hit.length ? hit : ENTRIES.filter((e) => re.test(e.name))   // 없으면 전체로 폴백
}
// 📸 씬 풀 — **배경이 통째로 그려진 컷**(주방·마트·캠핑·야시장·노을 피크닉).
//    배경만 지우면 그림이 부서지고, 그대로 큰 히어로로 쓰면 "카드 속 카드"처럼 겉돈다.
//    그래서 **폴라로이드 카드의 사진 자리에만** 쓴다 — 거긴 원래 네모 사진 자리라
//    배경이 있는 게 오히려 자연스럽다(빈 그라데이션이던 자리가 채워진다).
//    ⚠️ 흰 테두리 두른 띠부씰 버전은 꾸미기 스티커용으로 따로 있다(docs `낱개-씬-띠부씰`).
const SCENES = Object.entries(import.meta.glob('../assets/scenepool/*.png', { eager: true, query: '?url', import: 'default' }))
  .map(([k, url]) => ({ name: k.split('/').pop(), url, scene: true }))

const GOM = pickPool(/^gom_/)
const PENG = pickPool(/^(peng_|pn_)/)
const DUO = pickPool(/^duo_/)

// 🍂 계절·이벤트 캐릭터 컷 — **창이 열렸을 때만** 기본 스킨 풀에 얹는다.
//
// ⭐ 왜 이게 스킨보다 먼저인가 = **"카드는 그릇, 스티커가 내용"**
//    (`docs/시즌-업데이트-전략-2026-07-29.md` §8) — 카드는 캐릭터 풀에서 뽑아 채우므로
//    **스킨을 새로 안 만들어도 가을 컷이 들어오는 순간 카드가 새로워진다.**
//    그래서 계절마다 스킨은 1~2장이면 충분하고, 개수를 늘리면 오히려 뽑기 확률이 묽어진다.
//
// ⚠️ **꾸미기 서랍 자산(`stickers/photo`)을 그대로 재사용한다 — 파일을 두 벌 두지 않는다.**
//    처음엔 `sharepool/`에 `sc_*`로 57개를 복사했는데, **Vite가 내용이 같은 파일을 하나로 합쳐**
//    출력은 같았지만 저장소에 같은 PNG가 두 벌씩(≈20MB) 쌓였다. 그래서 목록으로만 가리킨다.
//    (그때 테스트가 "계절 컷 0종"이라고 나온 것도 이 합쳐짐 때문 — 코드가 아니라 이름 문제였다)
// 📦 **세트 목록은 `src/data/cardSeasons.js` 로 옮겼다** (2026-08-03).
//    안내 페이지(`data/whatsnew.js`)가 *"9/1 에 뭐가 열리나"* 를 말하려면 같은 목록을 읽어야 하는데,
//    이 파일은 곰펭 PNG 를 통째로 glob 하는 무거운 컴포넌트라 홈이 그걸 끌어오게 된다.
//    ⛔ 목록을 두 벌 적으면 반드시 어긋난다 → 데이터만 떼고 그림은 여기서 붙인다.
const DECOR = import.meta.glob('../assets/stickers/photo/*.png', { eager: true, query: '?url', import: 'default' })
const decorUrl = (k) => DECOR[`../assets/stickers/photo/${k}.png`]
// ⚠️ 함수로 둔다(상수 아님) — 모듈은 한 번만 읽히므로 상수로 굳히면 앱을 켜둔 채 날짜가
//    넘어갈 때 안 바뀐다. 뽑을 때마다 계산한다.
const seasonCuts = (kind) => SEASON_CUTS
  .filter((s) => inCardWindow(s))
  .flatMap((s) => s[kind].map((k) => ({ name: k + '.png', url: decorUrl(k) })))
  .filter((e) => e.url)
// 🎃 **코스튬(hw_)은 핼러윈 카드 밖으로 안 나간다** (창업자 2026-08-03
//   *"추석에는 한복, 할로윈은 코스튬복장애들만 붙게 만들어줘"*)
//   ⛔ 안 막으면 어떻게 되나 — **추석 창(9/1~10/15)과 핼러윈 창(10/1~11/2)이 15일 겹친다.**
//      그동안 한복 곰과 해골 펭펭이 «같은 뽑기 풀»에 들어가 warm·panel 같은 사철 카드에 뒤섞인다.
//   ⭐ 한복(cs_·hb)은 추석 창에만 열리니 저절로 「추석에는 한복」이 되고,
//      코스튬은 여기서 걸러 **펠트 배경 핼러윈 카드에서만** 나오게 한다.
// ⛔ 계절 «옷»(한복·코스튬)은 사철 카드로 안 나간다 — 각자 전용 카드에서만.
//   안 막으면 추석 창(9/1~10/15)과 핼러윈 창(10/1~11/2)이 15일 겹쳐 한복과 해골이 뒤섞인다.
const notHw = (a) => a.filter((e) => !HALLOWEEN.test(e.name) && !HANBOK.test(e.name))
const gomPool = () => [...GOM, ...notHw(seasonCuts('gom'))]
const pengPool = () => [...PENG, ...notHw(seasonCuts('peng'))]
const duoPool = () => [...DUO, ...notHw(seasonCuts('duo'))]
// 여름 스킨은 **여름 컷만** — 요리 컷이 섞이면 바다·물결 배경에 여름 느낌이 죽는다.
const summerOnly = (re) => {
  const hit = ENTRIES.filter((e) => re.test(e.name) && SUMMER.test(e.name))
  return hit.length ? hit : pickPool(re)
}
const S_GOM = summerOnly(/^(gom_|sm_gom_)/)
const S_PENG = summerOnly(/^(peng_|pn_|sm_peng_)/)
const S_DUO = summerOnly(/^(duo_|sm_duo_)/)
// 🎃 핼러윈 전용 풀 — `seasonCuts()` 가 창이 열렸을 때만 넣어주므로 그 안에서 hw_ 만 걸러낸다.
//   ⛔ 상수로 굳히지 말 것(창이 열리고 닫힌다) → 함수다.
const hwOnly = (kind) => seasonCuts(kind).filter((e) => HALLOWEEN.test(e.name))
// 🏮 추석 전용 풀 — 창업자 *"추석에는 한복, 할로윈은 코스튬복장애들만 붙게 만들어줘"*
const csOnly = (kind) => seasonCuts(kind).filter((e) => HANBOK.test(e.name))

// 📌 계절 캐릭터 컷은 `seasonCuts()` 가 **창이 열렸을 때만** 넣어주므로 스킨별로 따로 거를 필요가 없다.
//    (아치 스킨은 이제 가을 전용이 아니라 **사철 뼈대**다 — 옷만 계절마다 갈아입는다)

const APP_URL = 'https://peachfam0307-glitch.github.io/hankki/'
const rnd = (a) => a[Math.floor(Math.random() * a.length)]
const titleFont = (t) => { const n = String(t).replace(/\s/g, '').length; return n <= 5 ? 104 : n <= 7 ? 88 : n <= 9 ? 74 : 62 }

// 레시피 태그: 실제 데이터(카테고리·태그)에서. 없으면 담백한 기본.
function tagsOf(recipe) {
  const t = [...(recipe?.tags || [])]
  if (recipe?.category && !t.includes(recipe.category)) t.unshift(recipe.category)
  return (t.length ? t : ['오늘의 한끼']).slice(0, 2)
}

// 스타일별 카테고리 규칙(적재적소): 콤비는 넓은 스타일(홀로·팝·여름)에만.
function drawState() {
  // ⚠️ 스티커는 철이 지나도 순서만 밀리지만, **카드 스킨은 뽑기 풀에서 아예 빠진다**(한정 수집감).
  //    그래서 전환기 겹침이 여기서 특히 크다 — 9월 첫 2주까지는 여름 스킨이 계속 나온다.
  //    (`src/season.js` — 창업자 2026-07-30 "여름에 준비한 아이템들은 며칠 못하고…")
  // ⭐ **뼈대 6종은 항상 같고, 옷만 계절마다 갈아입는다**(위 옷장 주석 참고).
  //    그래서 "기본 카드 / 계절 카드" 구분이 없다 — 9월엔 6장이 전부 가을 옷이다.
  //    카드 수가 안 늘어 뽑기 확률도 안 묽어진다(6장 = 각 17%).
  // 🏖 `summer`(해·바다·물결)만 예외 — 물결·수평선이 여름 전용 구조물이라 옷만 갈아입힐 수가 없다.
  //    → **여름에만 한 장 더 얹는 이벤트 카드**로 둔다(여름엔 7장).
  // 🎃 핼러윈도 여름과 같은 «한정 한 장» — 창이 열린 동안만 뽑기 풀에 얹는다.
  //    창은 `cardSeasons.js` 의 hw(10-01~11-02)를 그대로 쓴다 ⛔날짜를 여기 또 적지 말 것(어긋난다)
  const seasonOpen = (k) => SEASON_CUTS.some((s) => s.key === k && inCardWindow(s))
  const hwOpen = seasonOpen('hw'), csOpen = seasonOpen('cs')
  const pool = ['warm', 'panel', 'pola', 'mag', 'arch', 'night',
    ...(isSeason('summer') ? ['summer'] : []),
    ...(hwOpen ? ['halloween'] : []), ...(csOpen ? ['chuseok'] : [])]
  const key = (() => {
    try { const v = new URLSearchParams(location.search).get('card'); if (v && SKINS[v]) return v } catch { /* noop */ }
    return rnd(pool)
  })()
  // 옷은 **뽑을 때** 정한다(상수로 굳히면 앱을 켜둔 채 계절이 넘어갈 때 안 바뀐다)
  const skin = { ...SKINS[key], W: wearOf(key) }
  // 밤·여름은 콤비도 잘 어울리고, 나머지는 솔로 위주(캐릭터가 크게 들어가서)
  // 여름 스킨만 여름 컷(수박·빙수·바비큐)까지 포함한 풀에서 뽑는다.
  const r = Math.random()
  const [g, p, d] = key === 'summer' ? [S_GOM, S_PENG, S_DUO]
    : key === 'halloween' ? [hwOnly('gom'), hwOnly('peng'), hwOnly('duo')]
      : key === 'chuseok' ? [csOnly('gom'), csOnly('peng'), csOnly('duo')]
      : [gomPool(), pengPool(), duoPool()]
  const cat = key === 'pola' && SCENES.length && r < 0.65 ? SCENES     // 폴라로이드는 씬 사진 위주
    : (key === 'night' || key === 'summer' || key === 'arch')
      ? (r < 0.5 ? g : r < 0.78 ? p : (d.length ? d : g))
      : (key === 'halloween' || key === 'chuseok')
        // 곰·펭·콤비 골고루 — ⚠️ **콤비가 없으면 그 몫을 곰에게 몰지 말고 반반으로 나눈다.**
        //   안 그러면 곰 65% · 펭 35% 가 된다(추석은 콤비가 없어서 실제로 5판 중 4판이 곰이었다).
        //   📌 「명단이 2:2니까 반반이겠지」는 «명단»이지 «확률»이 아니다. 뽑아 보고 세야 안다.
        ? (d.length ? (r < 0.4 ? g : r < 0.75 ? p : d) : (r < 0.5 ? g : p))
      : (r < 0.68 ? g : (p.length ? p : g))
  return { skin, char: rnd(cat.length ? cat : ENTRIES), no: 2 + Math.floor(Math.random() * 46) }
}

const DIE = 'drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff) drop-shadow(0 16px 22px rgba(60,40,25,.26))'
// 🎴 뼈대 6종 + 여름 1 — **색이 아니라 구조가 다르다**(창업자 "다 똑같이 할 거야?" 2026-07-29).
//    warm=좌상단 볼드타이포+blob · panel=위 컬러패널+센터제목 · pola=폴라로이드+마테
//    mag=매거진(EST·바코드) · arch=아치 창틀+아래 왼쪽정렬 · night=수집카드 넘버링+홀로 창
//    summer=해·바다·물결 (여름에만 얹는 한 장)
const SKINS = {
  warm: { key: 'warm' }, panel: { key: 'panel' }, pola: { key: 'pola' },
  mag: { key: 'mag' }, arch: { key: 'arch' }, night: { key: 'night' },
  summer: { key: 'summer' },
  halloween: { key: 'halloween' },   // 🎃 10/01~11/02 에만 얹는 한 장 (펠트 배경 ＋ 핼러윈 애들만)
  chuseok: { key: 'chuseok' },       // 🏮 09/01~10/15 에만 얹는 한 장 (조각보 배경 ＋ 한복만)
}

// ── 1080×1350 카드 (캡처 대상) ──
//
// 📐 2026-07-19 시안(`docs/카드-시안-2507/`)의 문법. 규칙 = docs/카드-디자인시스템-정리-2026-07-29.md
//
//    ⭐ 이 시스템의 심장 = **아주 큰 타이포 + 큰 색면**. 제목 **120~150px**.
//       (예전 내 카드는 62~88px 이었고 그게 밋밋함의 주범이었다. 줄이지 말 것.)
//
//    ⚠️ 시안엔 레이아웃이 **3계열**이었다. 색만 바꾼 6장은 "다 똑같다"는 판정을 받았다
//       (창업자 2026-07-29). 그래서 6장은 **구조가 서로 다르다**:
//         ① 웜 blob(A)  ② 컬러 패널(B)  ③ 폴꾸(C)  ④ 매거진(C)  ⑤ 여름  ⑥ 홀로그램 밤
//
//    ⚠️ 요리 아이콘은 **넣지 않는다**(창업자 "음식 빼, 카드 이상해져").
//       시안은 캐릭터 그림 자체에 음식이 들어 있었지 따로 합성한 게 아니었다.

const PAD = 64
const GRAIN = 'radial-gradient(rgba(150,120,80,.06) 1px,transparent 1px)'
const STAR_D = 'M50 3 L61 13 L75 9 L79 24 L93 30 L88 45 L96 58 L84 66 L85 81 L70 82 L61 94 L50 86 L39 94 L30 82 L15 81 L16 66 L4 58 L12 45 L7 30 L21 24 L25 9 L39 13 Z'
// 🍂 낙엽 — 가을 카드 배경 장식. ⛔별(STAR_D)과 헷갈리지 않게 **잎맥이 있는 잎사귀 실루엣**으로 그린다.
//    ⚠️ 개수를 늘리지 말 것 — "소품을 많이 붙여 채우려 한 게 실수였다"(카드 디자인시스템 §0).
//    밤 카드의 별처럼 **배경 텍스처**로만 쓴다(작게·연하게·4개).
const LEAF_D = 'M50 6 C74 24 86 50 77 70 C70 86 59 94 50 94 C41 94 30 86 23 70 C14 50 26 24 50 6 Z'
const LEAF_VEIN = 'M50 92 L50 32 M50 56 L31 42 M50 56 L69 42 M50 74 L35 62 M50 74 L65 62'
// (체크는 아래 `TEX.plaid` 로 옮겼다 — 질감이 6종으로 늘면서 한곳에 모았다)

// 제목 2줄 나누기 — 이 시스템은 2줄 볼드 타이포가 기본
// ⛔ **낱말 중간은 절대 자르지 않는다.** 예전엔 띄어쓰기가 없으면 글자 수를 반으로 잘랐는데,
//    창업자가 추가한 "교촌허니콤보"가 **"교촌허 / 니콤보"** 로 나왔다(2026-07-29 폰 제보).
//    한글은 어디가 낱말 경계인지 코드가 알 수 없다 → **띄어쓰기가 없으면 한 줄로 두고**,
//    대신 `headSize`가 칸 너비에 맞춰 글자를 줄인다.
function splitTitle(t) {
  const s = String(t || '오늘의 한 끼').trim()
  const sp = [...s.matchAll(/\s/g)].map((m) => m.index)
  if (!sp.length) return [s, '']                    // 띄어쓰기 없음 → 안 쪼갠다
  const mid = s.length / 2                          // 있으면 가장 균형 잡힌 곳에서
  const at = sp.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a))
  return [s.slice(0, at), s.slice(at + 1)]
}
// `lines` = **실제로 렌더되는 줄들.** 2줄 레이아웃은 `[l1, l2]`, 한 줄 레이아웃은 `['l1 l2']` 를 넘긴다.
// `avail` = 그 칸에서 쓸 수 있는 가로 px. 큰 타이포가 이 시스템의 심장이라 기본은 크게 두되,
//           **칸을 넘기면 그만큼 줄인다**(Jua 한글은 글자폭 ≈ 글자크기, letterSpacing -3 보정).
const headSize = (lines, base = 150, avail = 1080 - PAD * 2) => {
  const n = Math.max(1, ...lines.map((x) => String(x || '').length))
  const f = n <= 4 ? 1 : n <= 5 ? 0.92 : n <= 6 ? 0.8 : n <= 7 ? 0.7 : n <= 9 ? 0.59 : 0.5
  return Math.min(Math.round(base * f), Math.floor(avail / n) + 3)
}
function metaOf(recipe, tags) {
  const c = []
  if (recipe?.time) c.push(`${recipe.time}분`)
  if (recipe?.servings) c.push(`${recipe.servings}인분`)
  tags.forEach((t) => c.length < 3 && c.push(t))
  return c.slice(0, 3)
}
const die8 = (c) => `drop-shadow(3px 0 0 ${c}) drop-shadow(-3px 0 0 ${c}) drop-shadow(0 3px 0 ${c}) drop-shadow(0 -3px 0 ${c}) drop-shadow(3px 3px 0 ${c}) drop-shadow(-3px 3px 0 ${c}) drop-shadow(3px -3px 0 ${c}) drop-shadow(-3px -3px 0 ${c}) drop-shadow(0 22px 20px rgba(60,40,25,.34))`

// ═══════════════════ 🧵 질감(텍스처) ═══════════════════
//
// ⭐⭐ **은은하면 실패다.** 창업자 2026-07-30: *"질감은 특성을 명확히 반영해줘.
//    홀로그램이면 진짜 뭐가 반짝이거나 홀로그램 무지개빛이 확 돌게 화려하거나."*
//    처음 만든 체크가 알파 .07이라 거의 안 보였다 → 전부 **확 보이는 세기**로 올렸다.
// ⚠️ 천은 **한 겹으로 안 된다.** 굵은 결 + 가는 결 + (있으면) 하이라이트가 겹쳐야 천으로 읽힌다.
//    한 방향 줄무늬 하나만 깔면 그냥 '줄'이지 '직물'이 아니다.
// ⚠️ CSS mask·filter 는 캡처(html-to-image)에서 불안정 → **gradient 만** 쓴다.
const TEX = {
  // 🧶 플란넬 체크 — 굵은 띠 격자 + 그 위에 가는 선 격자(타탄의 문법)
  plaid: (c) => ({ backgroundImage: [
    `repeating-linear-gradient(90deg,rgba(${c},.17) 0 30px,transparent 30px 66px)`,
    `repeating-linear-gradient(0deg,rgba(${c},.17) 0 30px,transparent 30px 66px)`,
    `repeating-linear-gradient(90deg,rgba(${c},.12) 0 7px,transparent 7px 66px)`,
    `repeating-linear-gradient(0deg,rgba(${c},.12) 0 7px,transparent 7px 66px)`].join(',') }),
  // 🧵 코듀로이 — 세로 골. **그림자와 마루 하이라이트가 나란히** 있어야 도톰해 보인다
  cord: (c) => ({ backgroundImage:
    `repeating-linear-gradient(90deg,rgba(${c},.26) 0 5px,rgba(255,255,255,.16) 5px 9px,rgba(${c},.08) 9px 21px)` }),
  // 📜 한지 — 가로 결 + 비스듬한 섬유 + 뭉친 섬유 점. 규칙적이면 종이가 아니라 벽지가 된다
  hanji: (c) => ({ backgroundImage: [
    `repeating-linear-gradient(0deg,rgba(${c},.13) 0 1px,transparent 1px 5px)`,
    `repeating-linear-gradient(74deg,rgba(255,255,255,.13) 0 2px,transparent 2px 23px)`,
    `radial-gradient(rgba(${c},.16) 1.6px,transparent 2.2px)`].join(','), backgroundSize: 'auto,auto,19px 19px' }),
  // 📦 크라프트지 — 거친 종이. 굵은 점·잔 점·비스듬한 결
  kraft: (c) => ({ backgroundImage: [
    `radial-gradient(rgba(${c},.2) 1.2px,transparent 1.8px)`,
    `radial-gradient(rgba(${c},.13) 1.8px,transparent 2.6px)`,
    `repeating-linear-gradient(46deg,rgba(${c},.07) 0 1px,transparent 1px 9px)`].join(','),
  backgroundSize: '9px 9px,23px 23px,auto' }),
  // 🪡 리넨 — 성긴 평직. 가로실·세로실이 번갈아 지나가고 사이에 빛이 든다
  linen: (c) => ({ backgroundImage: [
    `repeating-linear-gradient(90deg,rgba(${c},.15) 0 2px,transparent 2px 6px)`,
    `repeating-linear-gradient(0deg,rgba(${c},.15) 0 2px,transparent 2px 6px)`,
    `repeating-linear-gradient(0deg,rgba(255,255,255,.09) 0 3px,transparent 3px 6px)`].join(',') }),
  // 🌈 홀로그램 — ⭐**화려해야 한다.** 무지개 층 + 비스듬한 광택 띠가 같이 돌아야 필름처럼 보인다
  holo: () => ({ backgroundImage: [
    `repeating-linear-gradient(114deg,rgba(255,255,255,.22) 0 11px,transparent 11px 30px)`,
    `linear-gradient(96deg,rgba(255,120,170,.38),rgba(255,214,120,.38) 17%,rgba(150,240,190,.38) 35%,rgba(120,200,255,.38) 53%,rgba(200,140,255,.38) 71%,rgba(255,130,200,.38) 89%)`].join(',') }),
}
const Tex = ({ k, c = '90,50,25', r, z = 3, o = 1 }) => {
  const t = TEX[k]?.(c)
  return t ? <div style={{ position: 'absolute', inset: 0, borderRadius: r, pointerEvents: 'none', zIndex: z, opacity: o, ...t }} /> : null
}

// ═══════════════════ 🍂 계절 옷장 ═══════════════════
//
// ⭐⭐ **뼈대(레이아웃)와 옷(색·질감)을 나눈다.** 창업자 2026-07-30:
//    *"가을되면 레꾸카드도 다 바뀌는게 아니야? 우리 기본카드가 따로 있어??"* — 맞는 지적이었다.
//    처음 내 안은 "사철 기본 4장 + 계절 2장"이라 **9월에 뽑아도 3분의 2는 평소 카드**였다.
//    → 이제 **뼈대 6종은 그대로 두고 계절마다 6장이 통째로 갈아입는다.** 카드 수는 안 늘고
//      (뽑기 확률이 안 묽어진다) "계절이 왔다"는 확실해진다.
// ⚠️⚠️ **함정 = 6장을 다 같은 계절색으로 칠하면 "다 똑같다"가 된다**(2026-07-29에 실제로 받은 판정).
//    그래서 **한 계절 안에서 6가지 다른 색**을 쓴다. 가을은 색이 풍부해서 가능하다 —
//    단풍주황 · 와인 · 올리브 · 머스터드 · 밤색 · 플럼. 거기에 **질감도 뼈대마다 하나씩**.
// 📌 여기 없는 계절은 `BASE_WEAR`(지금까지 쓰던 색)를 그대로 입는다.
const BASE_WEAR = {
  warm: { blob: '#f2a074,#e6875a 55%,#d9724a', arc: '#efd9b0', pt: '#d9724a', ink: '#3a3128', kick: '오늘도, 한 끼', sub: '#c47a58', brand: '#7a5a3f', chipRing: 'rgba(216,150,110,.25)', chipInk: '#8a5f3c', footWm: '#7a5a3f', footUrl: '#a8916f', bg: '#f4f0e8' },
  panel: { blob: '#8fd3b6,#5cbb94 58%,#48a17c', pt: '#48a17c', ink: '#2f4a3f', kick: '따뜻한 집밥 한 그릇', sub: '#4f9b7c', brand: '#3f7a63', metaInk: '#5f7d70', metaDot: '#a8c8b8', footWm: '#3f7a63', footUrl: '#93ab9f', bg: '#f6f1e6' },
  pola: { pt: '#c4708a', ink: '#4a3038', sub: '#9a5468', brand: '#9a5468', tape1: 'rgba(226,196,168,.72)', tape2: 'rgba(232,182,190,.7)', metaInk: '#8a6270', metaDot: '#dcb6c0', footWm: '#9a5468', footUrl: '#bb96a2', bg: '#f8eef0', grid: 'rgba(190,150,160,.12)', cap: '#9a5468', photoBg: 'radial-gradient(circle at 50% 38%,#fdf7f4,#f2e6e6)' },
  mag: { blob: '#cfe0c4,#b6cfa8 58%,#a3c194', pt: '#6f9a58', ink: '#2c3a27', brand: '#33422e', sub: '#7e8b74', metaInk: '#67775e', footWm: '#4d5c45', footUrl: '#8b9a82', bg: '#eef1ea', side: '#5d6b55', sideB: '#33422e' },
  arch: { blob: '#e0a24e,#c2632f 48%,#8f3a26', pt: '#b8532c', ink: '#3b2a1f', kick: '바람 불면, 가을 한 끼', sub: '#a8532c', brand: '#7a4326', badge: '#e0913f,#c2632f', chipRing: 'rgba(200,130,80,.3)', chipInk: '#8c4a24', footWm: '#7a4326', footUrl: '#ad8b6c', bg: 'linear-gradient(170deg,#fbf5e6,#f3e6cc 58%,#ecdab9)', tex: 'plaid', texC: '150,74,40', leaf: ['#c2632f', '#b8823a'] },
  night: { pt: '#ffd98a', ink: '#f0e4d0', kick: '오늘 밤은, 이걸로', sub: '#ffcf8a', brand: '#f0e4d0', metaInk: '#cbbfa8', footWm: '#e8dcc9', footUrl: '#a99d88', bg: 'radial-gradient(circle at 26% 16%,#343c52,#262b3b 60%,#1c2029)' },
}
const WARDROBE = {
  autumn: {
    badge: '가을 한정',
    warm: { blob: '#c4705f,#9c3f38 55%,#6f2429', arc: '#e6c9a4', pt: '#9c3f38', ink: '#382622', kick: '바스락, 가을 한 끼', sub: '#a85448', chipRing: 'rgba(190,110,90,.28)', chipInk: '#8a4034', footWm: '#7a3f34', footUrl: '#ab8a7c', bg: '#f7efe2', tex: 'cord', texC: '80,26,20' },
    panel: { blob: '#b4bd8c,#8a9760 58%,#68743f', pt: '#68743f', ink: '#333b22', kick: '들녘이 익어가는 계절', sub: '#7b8a4e', brand: '#5a6638', metaInk: '#6b7350', metaDot: '#bcc4a0', footWm: '#5a6638', footUrl: '#9ba286', bg: '#f4f1e0', tex: 'hanji', texC: '70,80,40' },
    // ⚠️ `photoBg`(폴라로이드 사진 칸)도 같이 갈아입혀야 한다 — 안 하면 머스터드 배경에
    //    연분홍 사진칸이 남아 혼자 다른 계절이 된다(첫 렌더에서 실제로 그랬다).
    pola: { pt: '#b3812a', ink: '#413320', sub: '#8a6a1e', brand: '#8a6a1e', tape1: 'rgba(214,186,140,.76)', tape2: 'rgba(206,164,96,.72)', metaInk: '#7d6a45', metaDot: '#d6c193', footWm: '#8a6a1e', footUrl: '#ad9a72', bg: '#f9f1dd', grid: 'rgba(180,150,100,.14)', cap: '#8a6a1e', tex: 'kraft', texC: '120,86,36', photoBg: 'radial-gradient(circle at 50% 38%,#fbf4e2,#efe0c4)' },
    // ⚠️ 첫 렌더에서 이 카드만 눈에 안 띄었다 — 배경도 원판도 연한 베이지라 대비가 없었다.
    //    창업자 *"배경이나 포인트를 명확하게. 그래야 뽑는 맛이 나"* → 원판을 확 진한 밤색으로 내렸다.
    mag: { blob: '#b98f63,#96703f 55%,#6d4c26', pt: '#8a5a2a', ink: '#2e2418', brand: '#3d3227', sub: '#8a7558', metaInk: '#6d5e49', footWm: '#544738', footUrl: '#988975', bg: '#f0e7d3', side: '#665849', sideB: '#3d3227', tex: 'linen', texC: '116,88,52' },
    night: { pt: '#ffcf8a', ink: '#f4e6dc', kick: '깊어가는 가을밤', sub: '#f0b0d0', brand: '#f4e6dc', metaInk: '#d5c2b8', footWm: '#eedcd0', footUrl: '#ab9a92', bg: 'radial-gradient(circle at 26% 16%,#4a3050,#33223c 60%,#231825)', tex: 'holo' },
  },
}
// 뼈대 하나가 지금 입을 옷. 계절 옷이 없으면 기본 옷 그대로.
const wearOf = (k, now) => ({ ...BASE_WEAR[k], ...(WARDROBE[seasonsNow(now)[0]]?.[k] || {}), badge: WARDROBE[seasonsNow(now)[0]]?.badge })

function Card({ char, no, title, tags, cover, recipe, skin }) {
  const K = skin
  // 👗 이 뼈대가 지금 입은 옷(색·질감·손글씨). 계절 옷이 없으면 기본 옷.
  const W = skin?.W || BASE_WEAR[skin?.key] || {}
  const [l1, l2] = splitTitle(title)
  const meta = metaOf(recipe, tags)
  const grain = <div style={{ position: 'absolute', inset: 0, backgroundImage: GRAIN, backgroundSize: '7px 7px', pointerEvents: 'none', zIndex: 2 }} />
  const brand = (col, extra) => <div style={{ position: 'absolute', top: PAD - 4, left: PAD, fontFamily: 'Jua, sans-serif', fontSize: 34, color: col, letterSpacing: 1, zIndex: 8, ...extra }}>한끼</div>
  const stamp = (col, top, bottom, extra) => (
    <div style={{ position: 'absolute', top: 70, right: PAD, width: 138, height: 138, transform: 'rotate(11deg)', zIndex: 9, ...extra }}>
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0 }}><path d={STAR_D} fill="none" stroke={col} strokeWidth="3.2" /></svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Jua, sans-serif', color: col, lineHeight: 1.05, textAlign: 'center' }}>
        <b style={{ fontSize: 30 }}>{top}</b><span style={{ fontSize: 18, letterSpacing: 3, marginTop: 3 }}>{bottom}</span>
      </div>
    </div>
  )
  const metabar = (col, sep) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'GowunDodum, sans-serif', fontSize: 30, color: col }}>
      {meta.map((m, i) => (<span key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>{i > 0 && <span style={{ width: 6, height: 6, borderRadius: 3, background: sep }} />}{m}</span>))}
    </div>
  )
  const chips = (ring, text) => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {meta.map((c, i) => <span key={i} style={{ padding: '11px 24px', borderRadius: 999, background: '#fffdf8', boxShadow: `0 8px 20px -12px rgba(120,80,50,.5), inset 0 0 0 2px ${ring}`, fontFamily: 'Jua, sans-serif', fontSize: 28, color: text }}>{c}</span>)}
    </div>
  )
  const foot = (wm, url) => (
    <div style={{ position: 'absolute', left: PAD, bottom: 52, zIndex: 8 }}>
      <div style={{ fontFamily: 'Jua, sans-serif', fontSize: 26, color: wm }}>한끼</div>
      <div style={{ marginTop: 6, fontSize: 19, color: url, fontFamily: 'GowunDodum, sans-serif' }}>Play스토어 ‘한끼’ 검색</div>
    </div>
  )
  const more = (col, sub) => !cover && (
    <div style={{ position: 'absolute', left: PAD, bottom: 148, zIndex: 8, fontFamily: 'Jua, sans-serif', fontSize: 34, color: col }}>
      레시피 보러가기
      <span style={{ display: 'block', fontFamily: 'GowunDodum, sans-serif', fontSize: 24, color: sub, fontWeight: 700, marginTop: 8 }}>한끼 앱에서 →</span>
    </div>
  )
  // 🩹 사진 배경 카드(핼러윈·추석) 전용 — 아래쪽에 «위로 사라지는» 크림 베일을 깐다.
  //    ⛔ 안 깔면 `more`·`foot` 글자가 배경 그림에 통째로 묻힌다(핼러윈 보라 언덕·추석 조각보).
  //       실제로 렌더해 보니 「Play스토어 '한끼' 검색」이 거의 안 읽혔다 — 이건 설치 유도 글자라 제일 아깝다.
  //    ⭐ 판을 덮지 않고 «그라데이션»인 이유 = 배경 그림(호박·고양이·조각보 결)이 비쳐 보여야 계절감이 산다.
  //    ⚠️ zIndex 5 = 크림 판(6)·캐릭터(7)·소품(8)보다 뒤. 캐릭터가 베일 위에 선 것처럼 보인다.
  const veil = (rgb) => (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 360, zIndex: 5, pointerEvents: 'none', background: `linear-gradient(180deg, rgba(${rgb},0) 0%, rgba(${rgb},.62) 38%, rgba(${rgb},.93) 78%, rgba(${rgb},.97) 100%)` }} />
  )
  const hero = (st) => <img src={char.url} alt="" crossOrigin="anonymous" style={{ position: 'absolute', maxWidth: 'none', objectFit: 'contain', zIndex: 7, ...st }} />
  const shell = (bg, kids) => <div style={{ width: 1080, height: 1350, fontFamily: 'GowunDodum, sans-serif', position: 'relative', overflow: 'hidden', background: bg }}>{kids}</div>

  // ═══ ① 웜 blob — 좌상단 볼드 타이포 + 우하단 색 덩어리가 화면 밖으로 ═══
  if (K.key === 'warm') {
    const hs = headSize([l1, l2], 150, 1080 - PAD - 340)   // 좌상단 2줄(우측 340은 도장·blob 자리)
    return shell(W.bg, <>
      <Tex k={W.tex} c={W.texC} z={0} />
      {grain}
      <div style={{ position: 'absolute', left: -150, top: -150, width: 360, height: 360, borderRadius: '50%', border: `26px solid ${W.arc}`, opacity: 0.62 }} />
      <div style={{ position: 'absolute', right: -160, bottom: -160, width: 920, height: 920, borderRadius: '50%', background: `radial-gradient(120% 120% at 34% 30%,${W.blob})`, boxShadow: '0 30px 60px -30px rgba(160,80,50,.5)' }}>
        {/* 큰 색면 위에도 같은 질감을 얹는다 — 배경에만 깔면 색면이 '플라스틱'처럼 떠 보인다 */}
        <Tex k={W.tex} c={W.texC} r="50%" z={1} o={0.85} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundImage: 'radial-gradient(rgba(255,255,255,.14) 5px,transparent 6px)', backgroundSize: '60px 60px' }} />
      </div>
      {brand(W.brand)}{stamp(W.sub, '오늘의', '한 끼')}
      <div style={{ position: 'absolute', left: PAD, top: 150, right: 340, zIndex: 5 }}>
        <div style={{ fontFamily: 'Gaegu, sans-serif', fontWeight: 700, fontSize: 42, color: W.sub }}>{W.kick}</div>
        <div style={{ marginTop: 2, fontFamily: 'Jua, sans-serif', fontSize: hs, lineHeight: 0.98, letterSpacing: -3, color: W.ink, wordBreak: 'keep-all' }}>
          {l1}{l2 && <><br /><span style={{ position: 'relative', display: 'inline-block', color: W.pt }}>
            <span style={{ position: 'absolute', left: -4, right: -4, bottom: 6, height: 20, background: W.pt, opacity: 0.24, borderRadius: 6 }} />
            <span style={{ position: 'relative' }}>{l2}</span></span></>}
        </div>
        <div style={{ marginTop: 30 }}>{chips(W.chipRing, W.chipInk)}</div>
      </div>
      {hero({ right: 2, bottom: 146, height: 600, filter: die8('#fffdf8') })}
      {more(W.ink, W.sub)}{foot(W.footWm, W.footUrl)}
    </>)
  }

  // ═══ ② 컬러 패널 — 위 둥근 패널 안에 캐릭터, 아래는 가운데 정렬 ═══
  if (K.key === 'panel') {
    const hs = headSize([`${l1} ${l2}`.trim()], 128)   // 한 줄로 렌더된다
    return shell(W.bg, <>
      <Tex k={W.tex} c={W.texC} z={0} />
      {grain}
      <div style={{ position: 'absolute', left: PAD, top: 132, right: PAD, height: 660, borderRadius: 72, background: `radial-gradient(120% 130% at 30% 22%,${W.blob})`, boxShadow: '0 34px 64px -28px rgba(40,110,85,.5)', overflow: 'hidden' }}>
        <Tex k={W.tex} c={W.texC} z={1} o={0.85} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.16) 6px,transparent 7px)', backgroundSize: '72px 72px' }} />
        <div style={{ position: 'absolute', left: '50%', top: '-30%', width: 700, height: 700, marginLeft: -350, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,255,255,.3),transparent 62%)' }} />
      </div>
      {brand(W.brand)}
      {stamp('#ffffff', '오늘의', '한 끼', { top: 176, right: 104 })}
      {hero({ left: '50%', transform: 'translateX(-50%)', top: 214, height: 596, filter: die8('#fffdf8') })}
      <div style={{ position: 'absolute', left: PAD, right: PAD, top: 838, textAlign: 'center', zIndex: 8 }}>
        <div style={{ fontFamily: 'Gaegu, sans-serif', fontWeight: 700, fontSize: 40, color: W.sub }}>{W.kick}</div>
        <div style={{ marginTop: 6, fontFamily: 'Jua, sans-serif', fontSize: hs, lineHeight: 1.0, letterSpacing: -2, color: W.ink, wordBreak: 'keep-all' }}>
          {l1} {l2 && <span style={{ color: W.pt }}>{l2}</span>}
        </div>
        <div style={{ marginTop: 26 }}>{metabar(W.metaInk, W.metaDot)}</div>
      </div>
      {more(W.ink, W.sub)}{foot(W.footWm, W.footUrl)}
    </>)
  }

  // ═══ ③ 폴꾸 — 폴라로이드를 마테로 벽에 붙이고 손글씨 캡션 ═══
  if (K.key === 'pola') {
    const hs = headSize([`${l1} ${l2}`.trim()], 112)   // 한 줄
    const tape = (st) => <div style={{ position: 'absolute', width: 190, height: 52, background: W.tape1, boxShadow: '0 5px 12px rgba(90,55,70,.16)', zIndex: 9, ...st }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(255,255,255,.34),transparent 45%)' }} />
    </div>
    return shell(W.bg, <>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${W.grid} 1.5px,transparent 1.5px),linear-gradient(90deg,${W.grid} 1.5px,transparent 1.5px)`, backgroundSize: '58px 58px' }} />
      <Tex k={W.tex} c={W.texC} z={0} />
      {grain}
      {brand(W.brand)}
      {/* 폴라로이드 종이 자체에 질감을 얹는다 — 이 카드에서 '종이'가 주인공이라 */}
      <div style={{ position: 'absolute', left: 150, top: 150, width: 780, background: '#fffdf9', borderRadius: 10, padding: '34px 34px 0', boxShadow: '0 30px 56px -20px rgba(120,80,95,.4)', transform: 'rotate(-2deg)', zIndex: 6 }}>
        <Tex k={W.tex} c={W.texC} r={10} z={9} o={0.9} />
        <div style={{ width: '100%', height: 620, borderRadius: 4, background: W.photoBg, position: 'relative', overflow: 'hidden' }}>
          {/* 씬 컷은 사진처럼 칸을 꽉 채우고(cover), 다이컷 캐릭터는 바닥에 세운다. */}
          <img src={char.url} alt="" crossOrigin="anonymous" style={char.scene
            ? { position: 'absolute', inset: 0, width: '100%', height: '100%', maxWidth: 'none', objectFit: 'cover' }
            : { position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)', height: '96%', maxWidth: 'none', objectFit: 'contain' }} />
        </div>
        {/* 캡션은 짧은 손글씨로 고정 — 아래 큰 제목과 같은 말이 두 번 나오면 지저분하다. */}
        <div style={{ position: 'relative', zIndex: 10, fontFamily: 'Gaegu, sans-serif', fontWeight: 700, fontSize: 46, color: W.cap, textAlign: 'center', padding: '20px 0 26px', transform: 'rotate(-.8deg)', whiteSpace: 'nowrap' }}>오늘도 한 끼, 해냈다</div>
      </div>
      {tape({ left: 214, top: 128, transform: 'rotate(-9deg)' })}
      {tape({ right: 176, top: 136, transform: 'rotate(7deg)', background: W.tape2 })}
      <div style={{ position: 'absolute', left: PAD, right: PAD, top: 990, textAlign: 'center', zIndex: 8 }}>
        <div style={{ fontFamily: 'Jua, sans-serif', fontSize: hs, lineHeight: 1.0, letterSpacing: -2, color: W.ink, wordBreak: 'keep-all' }}>
          {l1} {l2 && <span style={{ color: W.pt }}>{l2}</span>}
        </div>
        <div style={{ marginTop: 20 }}>{metabar(W.metaInk, W.metaDot)}</div>
      </div>
      {more(W.ink, W.sub)}{foot(W.footWm, W.footUrl)}
    </>)
  }

  // ═══ ④ 매거진 — EST 2026 · MARKET ISSUE · 바코드 ═══
  if (K.key === 'mag') {
    const hs = headSize([`${l1} ${l2}`.trim()], 116)   // 한 줄
    return shell(W.bg, <>
      <Tex k={W.tex} c={W.texC} z={0} />
      {grain}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 78, textAlign: 'center', zIndex: 6 }}>
        <div style={{ fontSize: 24, letterSpacing: 6, color: W.sub }}>EST. 2026 · 오늘도 한 끼</div>
        <div style={{ fontFamily: 'Jua, sans-serif', fontSize: 132, letterSpacing: 8, color: W.brand, lineHeight: 1.02, marginTop: 4 }}>한끼</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 10, fontSize: 21, letterSpacing: 3, color: W.metaInk }}>
          <span>TODAY’S ISSUE</span><span style={{ width: 42, height: 1, background: W.sub }} /><span>vol.{String(no).padStart(2, '0')}</span><span style={{ width: 42, height: 1, background: W.sub }} /><span>오늘의 한 끼</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: '50%', top: 386, width: 640, height: 640, marginLeft: -320, borderRadius: '50%', background: `radial-gradient(120% 120% at 32% 26%,${W.blob})`, boxShadow: '0 30px 60px -30px rgba(70,100,55,.45)' }}>
        <Tex k={W.tex} c={W.texC} r="50%" z={1} o={0.85} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundImage: 'radial-gradient(rgba(255,255,255,.18) 5px,transparent 6px)', backgroundSize: '58px 58px' }} />
      </div>
      <div style={{ position: 'absolute', left: PAD, top: 470, width: 210, fontSize: 25, lineHeight: 1.5, color: W.side, zIndex: 8 }}>제철 재료<b style={{ display: 'block', fontFamily: 'Jua, sans-serif', fontSize: 33, color: W.sideB }}>200% 활용법</b></div>
      <div style={{ position: 'absolute', right: PAD, top: 470, width: 210, textAlign: 'right', fontSize: 25, lineHeight: 1.5, color: W.side, zIndex: 8 }}>냉장고 털어<b style={{ display: 'block', fontFamily: 'Jua, sans-serif', fontSize: 33, color: W.sideB }}>15분 집밥</b></div>
      {hero({ left: '50%', transform: 'translateX(-50%)', top: 428, height: 560, filter: die8('#fffdf8') })}
      <div style={{ position: 'absolute', left: PAD, right: PAD, top: 1020, textAlign: 'center', zIndex: 8 }}>
        <div style={{ fontFamily: 'Jua, sans-serif', fontSize: hs, lineHeight: 1.0, letterSpacing: -2, color: W.ink, wordBreak: 'keep-all' }}>
          {l1} {l2 && <span style={{ color: W.pt }}>{l2}</span>}
        </div>
        <div style={{ marginTop: 16, fontSize: 26, color: W.metaInk }}>{meta.join('   ·   ')}</div>
      </div>
      <div style={{ position: 'absolute', right: PAD, bottom: 56, textAlign: 'right', zIndex: 8 }}>
        <div style={{ display: 'flex', gap: 3, justifyContent: 'flex-end' }}>
          {[3, 1, 2, 1, 4, 1, 2, 3, 1, 2, 1, 4, 2, 1, 3].map((w, i) => <span key={i} style={{ width: w, height: 46, background: W.sideB }} />)}
        </div>
        <div style={{ marginTop: 8, fontSize: 19, letterSpacing: 2, color: W.sub }}>한끼 no.{String(no).padStart(2, '0')}</div>
      </div>
      {foot(W.footWm, W.footUrl)}
    </>)
  }

  // ═══ ⑤ 여름 한정 — 해·바다·물결. 6~8월에만 등장 ═══
  if (K.key === 'summer') {
    const hs = headSize([l1, l2], 138, 1080 - PAD - 330)   // 좌상단 2줄
    return shell('linear-gradient(168deg,#e8f5f6,#cfeaf1 56%,#dcf0e9)', <>
      <div style={{ position: 'absolute', right: -78, top: -86, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle at 50% 50%,rgba(255,246,196,.98),rgba(255,232,148,.5) 44%,transparent 70%)' }} />
      {/* 물결은 캐릭터 발밑에서 끝나야 한다 — 높으면 캐릭터가 물에 잠긴 것처럼 보인다. */}
      <svg viewBox="0 0 1080 460" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: 390, zIndex: 1 }}>
        <path d="M0 190 C170 140 280 230 440 208 C620 184 720 112 920 156 C1000 174 1046 184 1080 176 L1080 460 L0 460Z" fill="#8ad8de" opacity=".45" />
        <path d="M0 262 C190 216 310 296 490 278 C690 258 790 202 990 236 C1036 246 1062 250 1080 246 L1080 460 L0 460Z" fill="#4fb6cb" opacity=".55" />
        <path d="M0 340 C210 306 330 368 530 354 C730 340 830 306 1080 332 L1080 460 L0 460Z" fill="#ffffff" opacity=".5" />
      </svg>
      {grain}
      {brand('#2b7f8c')}
      <div style={{ position: 'absolute', top: 74, right: PAD, transform: 'rotate(8deg)', fontFamily: 'Jua, sans-serif', fontSize: 31, color: '#fff', background: 'linear-gradient(180deg,#ff9fae,#ff7f92)', padding: '13px 28px', borderRadius: 18, boxShadow: '0 10px 18px -6px rgba(220,90,110,.6), inset 0 2px 0 rgba(255,255,255,.4)', zIndex: 9 }}>여름 한정</div>
      <div style={{ position: 'absolute', left: PAD, top: 176, right: 330, zIndex: 6 }}>
        <div style={{ fontFamily: 'Gaegu, sans-serif', fontWeight: 700, fontSize: 44, color: '#2f96a6' }}>시원하게, 여름 한 끼</div>
        <div style={{ marginTop: 4, fontFamily: 'Jua, sans-serif', fontSize: hs, lineHeight: 0.99, letterSpacing: -3, color: '#12404d', wordBreak: 'keep-all' }}>
          {l1}{l2 && <><br /><span style={{ position: 'relative', display: 'inline-block', color: '#2f96a6' }}>
            <span style={{ position: 'absolute', left: -4, right: -4, bottom: 6, height: 18, background: 'rgba(47,150,166,.2)', borderRadius: 6 }} />
            <span style={{ position: 'relative' }}>{l2}</span></span></>}
        </div>
        <div style={{ marginTop: 28 }}>{chips('rgba(110,190,205,.32)', '#2b7f8c')}</div>
      </div>
      {hero({ right: 20, bottom: 232, height: 560, filter: die8('#ffffff') })}
      {more('#12404d', '#2f96a6')}{foot('#1d6472', '#2b7f8c')}
    </>)
  }

  // ═══ ⑥ 핼러윈 한정 — 펠트 배경 사진 한 장. 10/01~11/02 에만 등장 ═══
  //
  // ⭐ **다른 여섯 장과 근본이 다르다** — 나머지는 CSS 로 그린 색면이고 이건 «사진»이다.
  //    창업자가 핼러윈 팩 배경 두 판 중 안 고른 한 장을 여기로 돌렸다(*"자랑카드로 쓰면 어때"*).
  //    펠트 질감은 우리 카드에 하나도 없던 결이라 나란히 놓으면 이 한 장만 튄다.
  // ⚠️ 배경이 세니까 **글자는 크림 판 위에** 올린다 — 펠트 위에 바로 얹으면 안 읽힌다.
  //    (배경 그림의 가운데가 비어 있어서 그 자리를 쓴다)
  if (K.key === 'halloween') {
    const hs = headSize([l1, l2], 132, 1080 - PAD * 2 - 40)
    return shell('#f3ede1', <>
      <img src={HW_FELT} alt="" crossOrigin="anonymous" style={{ position: 'absolute', inset: 0, width: 1080, height: 1350, objectFit: 'cover' }} />
      {brand('#4a3568', { textShadow: '0 2px 10px rgba(255,253,248,.95), 0 0 24px rgba(255,253,248,.8)' })}
      <div style={{ position: 'absolute', top: 84, right: PAD, transform: 'rotate(-7deg)', fontFamily: 'Jua, sans-serif', fontSize: 31, color: '#fff', background: 'linear-gradient(180deg,#8d6bb0,#6e4e94)', padding: '13px 28px', borderRadius: 18, boxShadow: '0 10px 18px -6px rgba(80,50,120,.55), inset 0 2px 0 rgba(255,255,255,.35)', zIndex: 9 }}>핼러윈 한정</div>
      {/* 가운데 크림 판 — 배경이 복잡해 글자를 여기 올린다 */}
      <div style={{ position: 'absolute', left: PAD - 6, right: PAD - 6, top: 300, padding: '34px 38px 40px', borderRadius: 34, background: 'rgba(253,250,244,.93)', boxShadow: '0 18px 40px -18px rgba(70,45,100,.45)', zIndex: 6 }}>
        <div style={{ fontFamily: 'Gaegu, sans-serif', fontWeight: 700, fontSize: 44, color: '#7a5a9e' }}>오늘 밤은, 이 한 끼</div>
        <div style={{ marginTop: 4, fontFamily: 'Jua, sans-serif', fontSize: hs, lineHeight: 0.99, letterSpacing: -3, color: '#33254a', wordBreak: 'keep-all' }}>
          {l1}{l2 && <><br />{l2}</>}
        </div>
        <div style={{ marginTop: 26 }}>{chips('rgba(140,110,180,.3)', '#6e4e94')}</div>
        {/* 🎃 펠트 소품 둘 — 크림 판 «바깥» 모서리에 붙인 것처럼 걸친다(스티커 느낌).
            ⭐⭐ **판의 자식으로 둔다** — 화면 좌표로 박아두면 제목이 두 줄이 되는 순간 판이 길어져
               소품이 「15분」 칩을 물어버린다(실제로 그랬다). 판에 붙여두면 판이 자라도 같이 내려간다.
            ⚠️ 뽑을 때마다 다른 둘이 오게 셔플한다 — 같은 소품이 늘 같은 자리면 카드가 똑같아 보인다.
            ⛔ **셋에서 둘로 줄였다** — 배경 그림에 이미 달·별·가랜드·집·나무·호박이 잔뜩 들어 있어
               셋은 지저분했고, 왼쪽 «위» 자리는 판 안쪽 글자를 가렸다(「오늘 밤은」의 앞 두 글자).
               📌 판 위쪽엔 글자가 붙어 있다 — 걸치려면 «아래쪽·오른쪽» 모서리라야 안전하다.
            ⚠️ 아래 왼쪽 바닥은 이제 CTA(`more`·`foot`) 자리라 비워 둔다. */}
        {(() => {
          const pick = [...HWF].sort(() => Math.random() - 0.5).slice(0, 2)
          const spot = [
            { left: -64, bottom: -54, size: 150, rot: -14 },   // 판 왼쪽 «아래» 모서리 밖
            { right: -40, top: -50, size: 128, rot: 12 },      // 판 오른쪽 «위» 모서리 밖
          ]
          return pick.map((u, i) => {
            const s = spot[i]
            return <img key={i} src={u} alt="" crossOrigin="anonymous" style={{ position: 'absolute', ...s, width: s.size, height: s.size, objectFit: 'contain', transform: 'rotate(' + s.rot + 'deg)', filter: 'drop-shadow(0 10px 14px rgba(60,40,90,.3))' }} />
          })
        })()}
      </div>
      {hero({ right: 24, bottom: 210, height: 540, filter: die8('#ffffff') })}
      {veil('250,246,238')}
      {more('#33254a', '#6e4e94')}{foot('#4a3568', '#6e4e94')}
    </>)
  }

  // ═══ ⑦ 추석 한정 — 조각보 배경 사진 한 장. 9/1~10/15 에만 등장 ═══
  //
  // ⭐ 핼러윈 카드와 «짝»이다 — 둘 다 천 소재 사진 배경에 계절 옷 입은 애들만 올린다.
  //    조각보는 **무료 드립 배경**이라 유료팩 누수 걱정이 없다(배경 README 배정표).
  // ⚠️ 배경이 알록달록해서 글자는 크림 판 위에. 판 색은 조각보의 «가장 옅은 결」에 맞춘 미색.
  if (K.key === 'chuseok') {
    const hs = headSize([l1, l2], 132, 1080 - PAD * 2 - 40)
    return shell('#f6efe2', <>
      <img src={CS_JOGAKBO} alt="" crossOrigin="anonymous" style={{ position: 'absolute', inset: 0, width: 1080, height: 1350, objectFit: 'cover' }} />
      {brand('#8a5a3c', { textShadow: '0 2px 10px rgba(255,253,244,.95), 0 0 24px rgba(255,253,244,.8)' })}
      <div style={{ position: 'absolute', top: 84, right: PAD, transform: 'rotate(-6deg)', fontFamily: 'Jua, sans-serif', fontSize: 31, color: '#fff', background: 'linear-gradient(180deg,#d98a52,#b9633a)', padding: '13px 28px', borderRadius: 18, boxShadow: '0 10px 18px -6px rgba(150,80,45,.55), inset 0 2px 0 rgba(255,255,255,.35)', zIndex: 9 }}>추석 한정</div>
      <div style={{ position: 'absolute', left: PAD - 6, right: PAD - 6, top: 300, padding: '34px 38px 40px', borderRadius: 34, background: 'rgba(253,249,240,.94)', boxShadow: '0 18px 40px -18px rgba(120,80,45,.45)', zIndex: 6 }}>
        <div style={{ fontFamily: 'Gaegu, sans-serif', fontWeight: 700, fontSize: 44, color: '#b9633a' }}>둥근 달 아래, 한 끼</div>
        <div style={{ marginTop: 4, fontFamily: 'Jua, sans-serif', fontSize: hs, lineHeight: 0.99, letterSpacing: -3, color: '#3d2a1c', wordBreak: 'keep-all' }}>
          {l1}{l2 && <><br />{l2}</>}
        </div>
        <div style={{ marginTop: 26 }}>{chips('rgba(190,130,80,.3)', '#a15a33')}</div>
      </div>
      {/* ⚠️ 핼러윈(540)보다 크게 잡는다 — 추석 컷엔 복주머니·족자처럼 «캐릭터 위에 매달린 장식»이
          한 그림으로 들어 있어서, 같은 높이로 두면 정작 애가 절반만 차지해 아래가 텅 빈다(실제로 그랬다). */}
      {hero({ right: 10, bottom: 196, height: 648, filter: die8('#ffffff') })}
      {veil('250,244,232')}
      {more('#3d2a1c', '#a15a33')}{foot('#6b4326', '#a15a33')}
    </>)
  }

  // ═══ ⑧ 가을 한정 — 아치 창틀 + 아래 왼쪽정렬 타이포. 9~11월에만 등장 ═══
  //
  // ⭐ **구조로 차별화한다**(색만 바꾼 6장이 "다 똑같다" 판정을 받은 이력 — 2026-07-29).
  //    · 다른 카드의 큰 색면은 전부 **원**(warm blob·mag 원판·night 홀로판)이거나 **둥근 사각**(panel).
  //      가을만 **아치**(위는 반원, 아래는 각진 창틀) → 실루엣이 한눈에 다르다.
  //    · 캐릭터가 아치 **바닥선 아래로 삐져나온다** → 창밖에서 이쪽으로 넘어오는 입체감.
  //    · 제목은 **아래 + 왼쪽 정렬.** panel·mag·pola·night은 전부 가운데 정렬이라 여기서 갈린다.
  // ⚠️ warm 도 웜오렌지 계열이라 색이 겹칠 뻔했다 → 가을은 **더 깊은 적갈(단풍 끝물)** 로 내렸다.
  //    warm blob `#f2a074→#d9724a` vs 가을 아치 `#d98b4a→#8c3520`.
  if (K.key === 'arch') {
    const hs = headSize([l1, l2], 140)   // 아래 2줄 — 이 시스템의 심장(120~150px). 줄이지 말 것
    const leaf = (i, x, y, s, rot, op, col) => (
      <svg key={i} viewBox="0 0 100 100" style={{ position: 'absolute', left: x, top: y, width: s, height: s, transform: `rotate(${rot}deg)`, opacity: op, zIndex: 1 }}>
        <path d={LEAF_D} fill={col} />
        <path d={LEAF_VEIN} stroke="rgba(255,253,248,.55)" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      </svg>
    )
    // ⭐ **이 카드가 맡은 질감은 「체크」 하나다.** (창업자 2026-07-30)
    //    창업자가 체크·레이스·부드러운 천을 한 번에 말했길래 다 넣었다가 지적받았다 —
    //    *"여기에 다 넣으라는 게 아니야"* / *"이거 그대로 하나 하고 다음 거에 그런 느낌 하나씩 하자고"*.
    //    → **질감 하나 = 카드 하나.** 레이스·니트·코듀로이는 다음 스킨들이 하나씩 가져간다.
    //    (재고 목록 = `docs/시즌-업데이트-전략-2026-07-29.md` §8 「질감 아이디어」)
    // 🗑 뺀 것: 아치 바닥 레이스 띠 — 캐릭터가 바닥선에 서 있어 가운데가 가려지고
    //    **좌우에 흰 동그라미 부스러기만** 남았다(렌더로 확인). 레이스를 쓸 땐 테두리를 따라 둘러야 한다.
    const AW = 620
    return shell(W.bg, <>
      {/* 🧶 배경에 먼저 질감을 깔고, 아치(큰 색면)에 한 번 더 얹는다.
          색면에 질감이 없으면 그 면만 '플라스틱'처럼 떠 보인다. */}
      <Tex k={W.tex} c={W.texC} z={0} />
      {/* 잎은 아치(x 230~850 · y 92~644)와 제목(y 694~)을 피해 좌우 바깥에만. 질감이 깔려 있어 2개면 충분 */}
      {(W.leaf || []).length === 2 && [[92, 232, 62, -18, 0.34, W.leaf[0]], [948, 566, 56, 26, 0.3, W.leaf[1]]].map((v, i) => leaf(i, ...v))}
      {/* 아치 = 창틀. overflow 를 막지 않는다 — 캐릭터가 바닥선 아래로 나와야 한다.
          inset 그림자로 가장자리를 눌러 **도톰한 천**처럼 보이게 한다(평평한 색면 → 패브릭). */}
      <div style={{ position: 'absolute', left: '50%', marginLeft: -AW / 2, top: 92, width: AW, height: 552, borderRadius: '310px 310px 36px 36px', background: `radial-gradient(120% 120% at 34% 24%,${W.blob})`, boxShadow: '0 34px 64px -30px rgba(120,50,30,.55), inset 0 -22px 40px -20px rgba(80,26,12,.55), inset 0 14px 26px -14px rgba(255,226,180,.5)', zIndex: 2 }}>
        <Tex k={W.tex} c={W.texC} r="310px 310px 36px 36px" z={1} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', backgroundImage: 'radial-gradient(rgba(255,255,255,.13) 5px,transparent 6px)', backgroundSize: '62px 62px' }} />
        <div style={{ position: 'absolute', left: '50%', top: '-16%', width: 540, height: 540, marginLeft: -270, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,240,210,.28),transparent 62%)' }} />
      </div>
      {grain}
      {brand(W.brand)}
      {W.badge && <div style={{ position: 'absolute', top: 74, right: PAD, transform: 'rotate(8deg)', fontFamily: 'Jua, sans-serif', fontSize: 31, color: '#fffdf8', background: `linear-gradient(180deg,${W.badgeBg || '#e0913f,#c2632f'})`, padding: '13px 28px', borderRadius: 18, boxShadow: '0 10px 18px -6px rgba(150,70,30,.6), inset 0 2px 0 rgba(255,255,255,.35)', zIndex: 9 }}>{W.badge}</div>}
      {hero({ left: '50%', transform: 'translateX(-50%)', top: 152, height: 524, filter: die8('#fffdf8') })}
      <div style={{ position: 'absolute', left: PAD, right: 330, top: 694, zIndex: 8 }}>
        <div style={{ fontFamily: 'Gaegu, sans-serif', fontWeight: 700, fontSize: 42, color: W.sub }}>{W.kick}</div>
        <div style={{ marginTop: 2, fontFamily: 'Jua, sans-serif', fontSize: hs, lineHeight: 0.98, letterSpacing: -3, color: W.ink, wordBreak: 'keep-all' }}>
          {l1}{l2 && <><br /><span style={{ color: W.pt }}>{l2}</span></>}
        </div>
        <div style={{ marginTop: 28 }}>{chips(W.chipRing, W.chipInk)}</div>
      </div>
      {/* ⚠️ `more` 를 **오른쪽**에 둔다(다른 카드는 전부 왼쪽) — 이 레이아웃만 캐릭터가 위쪽 아치에 있어서
          왼쪽 아래가 통째로 글자 칸이 된다. 공용 `more` 를 그대로 쓰니 kick·제목·칩·CTA·워터마크가
          **왼쪽에 5단으로 쌓여** 답답했다(첫 렌더에서 확인). 좌=제목 / 우=CTA 로 갈라 균형을 잡는다. */}
      {!cover && (
        <div style={{ position: 'absolute', right: PAD, bottom: 150, zIndex: 8, textAlign: 'right', fontFamily: 'Jua, sans-serif', fontSize: 34, color: W.ink }}>
          레시피 보러가기
          <span style={{ display: 'block', fontFamily: 'GowunDodum, sans-serif', fontSize: 24, color: W.sub, fontWeight: 700, marginTop: 8 }}>한끼 앱에서 →</span>
        </div>
      )}
      {foot(W.footWm, W.footUrl)}
    </>)
  }

  // ═══ ⑥ 홀로그램 밤 — 수집카드. 큰 넘버링 + 홀로 창 ═══
  const hs = headSize([`${l1} ${l2}`.trim()], 124)   // 한 줄
  return shell(W.bg, <>
    {/* 🌈 홀로그램 — ⭐창업자 *"진짜 뭐가 반짝이거나 홀로그램 무지개빛이 확 돌게 화려하게"*.
        카드 **전면**에 무지개 필름을 덮는다(원판 안에만 두면 은은해서 안 보인다). */}
    <Tex k={W.tex} z={1} o={0.5} />
    <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
      {[[120, 236, 5], [306, 172, 3], [872, 202, 4], [718, 116, 3], [176, 452, 3], [986, 372, 4], [430, 288, 3], [92, 640, 3], [960, 700, 4]].map((s, i) => (
        <div key={i} style={{ position: 'absolute', left: s[0], top: s[1], width: s[2] * 2, height: s[2] * 2, borderRadius: '50%', background: '#fff6d8', opacity: 0.9, boxShadow: `0 0 ${s[2] * 6}px rgba(255,240,190,.95)` }} />
      ))}
      {/* ✨ 네 갈래 별 반짝임 — 동그란 점만으론 '별'이 안 된다. 홀로그램엔 뾰족한 빛이 있어야 화려하다 */}
      {[[210, 150, 40], [900, 520, 32], [140, 880, 28], [960, 900, 36], [520, 96, 26]].map(([x, y, s], i) => (
        <svg key={i} viewBox="0 0 100 100" style={{ position: 'absolute', left: x, top: y, width: s, height: s, opacity: 0.92 }}>
          <path d="M50 0 C54 34 66 46 100 50 C66 54 54 66 50 100 C46 66 34 54 0 50 C34 46 46 34 50 0 Z" fill="#fff8e2" />
        </svg>
      ))}
    </div>
    <div style={{ position: 'absolute', inset: 14, borderRadius: 34, border: '2px solid rgba(255,222,150,.42)', zIndex: 3, pointerEvents: 'none' }} />
    {brand(W.brand)}
    <div style={{ position: 'absolute', top: 62, right: PAD, textAlign: 'right', zIndex: 9 }}>
      <div style={{ fontFamily: 'Jua, sans-serif', fontSize: 74, lineHeight: 0.9, color: W.pt, letterSpacing: -2 }}>No.{String(no).padStart(2, '0')}</div>
      <div style={{ fontSize: 20, letterSpacing: 6, color: 'rgba(255,222,150,.8)', marginTop: 4 }}>HOLO RARE</div>
    </div>
    {/* ⚠️ 홀로 원판은 캐릭터보다 커야 한다 — 작으면 발이 테두리를 밟아 어색하다(2026-07-29 수정). */}
    <div style={{ position: 'absolute', left: '50%', top: 238, width: 664, height: 664, marginLeft: -332, borderRadius: '50%', background: 'conic-gradient(from 20deg,#ff9aa2,#ffdac1,#e2f0cb,#b5ead7,#c7ceea,#f7c6ff,#ffabe0,#ff9aa2)', opacity: 0.62, filter: 'blur(4px)', zIndex: 2 }} />
    <div style={{ position: 'absolute', left: '50%', top: 274, width: 592, height: 592, marginLeft: -296, borderRadius: '50%', background: 'radial-gradient(circle at 40% 34%,rgba(255,252,240,.14),rgba(24,28,38,.6) 72%)', border: '4px solid rgba(255,226,160,.7)', boxShadow: 'inset 0 4px 0 rgba(255,255,255,.14)', zIndex: 3 }} />
    {hero({ left: '50%', transform: 'translateX(-50%)', top: 336, height: 496, filter: die8('#fffdf8') })}
    <div style={{ position: 'absolute', left: PAD, right: PAD, top: 918, textAlign: 'center', zIndex: 8 }}>
      <div style={{ fontFamily: 'Gaegu, sans-serif', fontWeight: 700, fontSize: 38, color: W.sub }}>{W.kick}</div>
      <div style={{ marginTop: 4, fontFamily: 'Jua, sans-serif', fontSize: hs, lineHeight: 1.0, letterSpacing: -2, wordBreak: 'keep-all', background: 'linear-gradient(90deg,#ffd98a,#ffb0c4,#c7b3f0)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
        {l1} {l2}
      </div>
      <div style={{ marginTop: 22 }}>{metabar(W.metaInk, 'rgba(255,222,150,.55)')}</div>
    </div>
    {more(W.ink, W.sub)}{foot(W.footWm, W.footUrl)}
  </>)
}

// ── 2장째: 실제 레시피카드 (재료·만드는 법) — 친구가 진짜 해먹을 수 있게 ──
// export: 꾸민 표지 공유(shareDecoratedCover)에서도 이 레시피카드를 2장째로 함께 보낸다.
export function RecipeCard({ recipe }) {
  const title = recipe?.title || '오늘의 한 끼'
  const ings = (recipe?.ingredients || []).filter(Boolean)
  const steps = (recipe?.steps || []).filter(Boolean)
  // ⛔ 시계 이모지를 붙이지 않는다 — '분'이 이미 시간이라는 뜻이고, 이 글자는 **공유 이미지에 그대로 박힌다.**
  const meta = [recipe?.time && `${recipe.time}분`, recipe?.servings && `${recipe.servings}인분`, recipe?.difficulty].filter(Boolean)
  const isHead = (s) => /^\[.*\]$/.test(String(s).trim())
  const half = Math.ceil(ings.length / 2)
  const cols = [ings.slice(0, half), ings.slice(half)]
  const ingFont = ings.length > 16 ? 25 : ings.length > 11 ? 27 : 30
  const stepFont = steps.length > 7 ? 26 : steps.join('').length > 380 ? 27 : 30
  const shown = steps.slice(0, 7)
  const renderIng = (arr) => arr.map((x, i) => isHead(x)
    ? <div key={i} style={{ fontWeight: 800, color: '#c2703f', marginTop: 8, fontSize: ingFont }}>{String(x).replace(/[[\]]/g, '')}</div>
    : <div key={i} style={{ fontSize: ingFont, color: '#4a4136', lineHeight: 1.48, display: 'flex', gap: 7 }}><span style={{ color: '#d2a97f' }}>·</span><span>{x}</span></div>)
  return (
    <div style={{ width: 1080, height: 1350, fontFamily: 'Jua, sans-serif', position: 'relative', overflow: 'hidden', background: '#fbf6ec' }}>
      <div style={{ padding: '64px 70px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 30, color: '#c2703f', letterSpacing: 2 }}>🍳 오늘의 레시피</div>
        <div style={{ fontSize: title.length > 9 ? 60 : 72, color: '#3d3830', marginTop: 6, lineHeight: 1.1, wordBreak: 'keep-all' }}>{title}</div>
        {meta.length > 0 && <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 10 }}>{meta.map((m, i) => <span key={i} style={{ fontSize: 26, color: '#8a7d68', background: '#f0e7d8', padding: '7px 20px', borderRadius: 999 }}>{m}</span>)}</div>}
      </div>
      <div style={{ margin: '34px 58px 0', background: '#fffdf8', borderRadius: 24, padding: '24px 32px', boxShadow: '0 6px 16px rgba(120,90,50,.1)' }}>
        <div style={{ fontSize: 33, color: '#c2703f', marginBottom: 12 }}>🥕 재료</div>
        <div style={{ display: 'flex', gap: 28 }}>{cols.map((c, i) => <div key={i} style={{ flex: 1 }}>{renderIng(c)}</div>)}</div>
      </div>
      <div style={{ margin: '22px 58px 0' }}>
        <div style={{ fontSize: 33, color: '#c2703f', marginBottom: 10, paddingLeft: 6 }}>👩‍🍳 만드는 법</div>
        {shown.map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 13, marginBottom: 11, alignItems: 'flex-start' }}>
            <span style={{ flex: '0 0 auto', width: 40, height: 40, borderRadius: '50%', background: '#e8916a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 23 }}>{i + 1}</span>
            <span style={{ fontSize: stepFont, color: '#4a4136', lineHeight: 1.42, paddingTop: 4 }}>{s}</span>
          </div>
        ))}
        {steps.length > 7 && <div style={{ fontSize: 26, color: '#a8987e', paddingLeft: 53, marginTop: 2 }}>… 전체 {steps.length}단계는 한끼 앱에서 →</div>}
      </div>
      <div style={{ position: 'absolute', bottom: 60, left: 0, right: 0, textAlign: 'center' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '18px 42px', borderRadius: 999, background: '#5d3410', color: '#fffdf8', fontSize: 38, fontWeight: 800 }}>🔍 Play스토어 ‘한끼’ 검색</span>
      </div>
    </div>
  )
}

export default function ShareDrawCard({ recipe, onClose, onSaveCover }) {
  const title = recipe?.title || '오늘의 한 끼'
  const tags = useMemo(() => tagsOf(recipe), [recipe])
  const [draw, setDraw] = useState(drawState)
  // busy = null 이거나 '지금 뭘 만들고 있는지' 한 줄. 문자열도 참이라 disabled·opacity 판정은 그대로 돈다.
  // ⚠️ 예전엔 버튼 글자만 '만드는 중…'으로 바뀌어서, 캡처가 오래 걸리면 먹통처럼 보였다
  //    (창업자 제보 2026-07-30 "레꾸자랑 공유하기 만들때 기다려달라는 멘트 안 떠").
  //    레꾸자랑의 '꾸민 표지' 경로엔 전체 오버레이가 있었는데 이 랜덤 카드 경로엔 없었다.
  const [busy, setBusy] = useState(null)
  const cardRef = useRef(null)
  const card2Ref = useRef(null)
  const coverRef = useRef(null) // 표지 저장용(CTA 없는 cover 카드)
  const [page, setPage] = useState(1)
  const [scale, setScale] = useState(0.3)
  // 레시피 내용(재료·단계)이 있어야 2장째(레시피카드)를 붙인다. 없으면 1장만.
  const hasRecipe = !!((recipe?.ingredients || []).length || (recipe?.steps || []).length)

  const redraw = useCallback(() => setDraw(drawState()), [])
  useEffect(() => {
    const fit = () => setScale(Math.min((window.innerWidth - 40) / 1080, (window.innerHeight * 0.6) / 1350))
    fit(); window.addEventListener('resize', fit); return () => window.removeEventListener('resize', fit)
  }, [])

  // 🖼 카드 한 장을 파일로.
  //   ⚠️ `pixelRatio` 는 **1.6** — 표지 공유(`shareCover.js`)와 맞춘다. 2 면 2160×2700 이라 너무 무겁다.
  //   ⛔⛔ **`cacheBust` 를 껐다.** 켜면 카드 안 그림마다 `?t=…` 를 붙여 **전부 다시 내려받는다** —
  //      우리 카드엔 배경·캐릭터·소품 PNG 가 여러 장이라 캡처가 몇 배로 느려진다.
  //      우리 그림은 전부 **같은 출처**라 캐시를 그대로 써도 안전하다(CORS 문제가 안 생긴다).
  const toFile = useCallback(async (el, name) => {
    const u = await toPng(el, { pixelRatio: 1.6 })
    const b = await (await fetch(u)).blob()
    return new File([b], name, { type: 'image/png' })
  }, [])

  // 🚀🚀 **미리 캡처** — 카드가 정해지면 «백그라운드로» 파일을 만들어 둔다.
  //   ⛔⛔ 이게 2026-08-03 「자랑카드 먹통」의 뿌리다. 창업자 *"로딩은 돌아가. 그다음이 안돼"*
  //      폰의 Web Share 는 **사용자가 누른 «직후»에만** 허용된다(user activation).
  //      그런데 우리는 누른 «뒤에» 캡처를 시작했고, 캡처가 몇 초 걸리는 사이 허가가 만료돼
  //      `navigator.share` 가 통째로 거절됐다. **로딩(캡처)은 정상이고 그 «다음»이 죽는다** — 증상 그대로.
  //   ✅ 미리 만들어 두면 누른 순간 «기다림 없이» 공유창이 뜬다. (`docs` v8.57 에 *"다음엔 미리 캡처"* 라고
  //      적어두고 미뤄뒀던 그 처방이다 — 오늘 그 값을 치렀다.)
  //   ⚠️ 「다시 뽑기」로 카드가 바뀌면 다시 만든다(`draw`·`page` 가 바뀌면 useEffect 가 다시 돈다).
  const readyRef = useRef(null)
  useEffect(() => {
    let alive = true
    readyRef.current = null
    const t = setTimeout(async () => {
      if (!cardRef.current) return
      try {
        // ⭐ 두 장을 «동시에» — 순차로 하면 대기가 두 배다
        const [f1, f2] = await Promise.all([
          toFile(cardRef.current, 'hankki-1.png'),
          hasRecipe && card2Ref.current ? toFile(card2Ref.current, 'hankki-2-recipe.png').catch(() => null) : null,
        ])
        if (alive) readyRef.current = f2 ? [f1, f2] : [f1]
      } catch { /* 실패하면 누를 때 만든다 */ }
    }, 500)   // 카드 그림·글꼴이 자리잡을 틈
    return () => { alive = false; clearTimeout(t) }
  }, [draw, page, hasRecipe, toFile])

  // 💾 공유가 안 될 때 «저장»으로 떨어뜨린다.
  //   ⛔⛔ 예전 코드는 `document.createElement('a')` 를 만들고 **DOM 에 붙이지 않은 채** `.click()` 했다.
  //      떠 있지 않은 `<a>` 의 click 은 브라우저가 무시한다 → **아무 일도 안 일어난다.**
  //      (표지 공유 쪽 `shareCover.js` 는 `appendChild` 를 해서 «다운로드 팝업»이 떴다 —
  //       같은 원인인데 증상이 갈린 이유가 이것이다.)
  const saveFile = (f) => {
    const u = URL.createObjectURL(f)
    const a = document.createElement('a')
    a.href = u; a.download = f.name
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(u), 1500)
  }

  const share = useCallback(async () => {
    if (!cardRef.current || busy) return
    const text = (n) => `『${title}』 오늘의 한 끼 🧡${n > 1 ? ' · 재료·레시피 같이!' : ''}\nPlay스토어에서 '한끼' 검색 🔍`
    // ⭐ 준비돼 있으면 **await 없이 곧바로** 공유창을 연다 — 사이에 기다림을 두면 허가가 깨진다.
    const go = (files) => {
      if (!(navigator.canShare && navigator.share)) return null
      if (navigator.canShare({ files })) return navigator.share({ files, title, text: text(files.length), url: APP_URL })
      if (files.length > 1 && navigator.canShare({ files: [files[0]] })) return navigator.share({ files: [files[0]], title, text: text(1), url: APP_URL })
      return null
    }
    const pre = readyRef.current
    if (pre) {
      const t = go(pre)
      if (t) { try { await t; return } catch (e) { if (e && e.name === 'AbortError') return } }
      // 여기까지 왔으면 이 폰은 파일 공유를 못 한다 → 저장으로
      pre.forEach((f, i) => setTimeout(() => saveFile(f), i * 400))
      setBusy('공유가 안 되는 폰이라 사진으로 저장했어요')
      setTimeout(() => setBusy(null), 2400)
      return
    }
    // 아직 준비 전(막 열자마자 누름) — 만들어서 시도한다. 이땐 허가가 만료될 수 있어 저장으로 갈 수 있다.
    setBusy(hasRecipe ? '카드 + 레시피 2장 준비 중이에요' : '카드를 그리고 있어요')
    try {
      // ⏱⏱ **12초 제한** — 캡처가 안 끝나면 «로딩만 도는» 상태가 되고, 그게 유저에겐 먹통이다.
      //   ⛔ 2026-08-03 창업자가 겪은 것이 정확히 이 모양이었다: *"로딩은 돌아가. 그다음이 안돼"*.
      //   ⭐ 끝나든 못 끝나든 **말은 한다.** 조용히 멈춰 있는 것보다 «안 됐다」고 말하는 게 낫다.
      const cap = Promise.all([
        toFile(cardRef.current, 'hankki-1.png'),
        hasRecipe && card2Ref.current ? toFile(card2Ref.current, 'hankki-2-recipe.png').catch(() => null) : null,
      ])
      const [a1, a2] = await Promise.race([
        cap,
        new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('capture timeout'), { name: 'TimeoutError' })), 12000)),
      ])
      const files = a2 ? [a1, a2] : [a1]
      readyRef.current = files
      const t = go(files)
      if (t) { await t; setBusy(null); return }
      files.forEach((f, i) => setTimeout(() => saveFile(f), i * 400))
      setBusy('공유가 안 되는 폰이라 사진으로 저장했어요')
      setTimeout(() => setBusy(null), 2400)
      return
    } catch (e) {
      if (e && e.name === 'AbortError') { setBusy(null); return }
      // ⛔ 여기서 조용히 끝내면 «먹통»이 된다. 준비된 게 있으면 저장이라도 해준다.
      const f = readyRef.current
      if (f) { f.forEach((x, i) => setTimeout(() => saveFile(x), i * 400)); setBusy('공유가 안 돼서 사진으로 저장했어요') }
      else if (e && e.name === 'TimeoutError') setBusy('카드 만들기가 오래 걸려요. 잠시 뒤 다시 눌러주세요')
      else setBusy('공유가 안 됐어요. 잠시 뒤 다시 눌러주세요')
      setTimeout(() => setBusy(null), 2800)
    }
  }, [busy, title, hasRecipe, toFile])

  // 🖼 이 카드를 레시피 표지로 저장 — CTA 없는 cover 카드를 이미지로 캡처해 부모(레시피 화면)에 넘긴다.
  const saveCover = useCallback(async () => {
    if (!coverRef.current || busy) return
    setBusy('레시피 표지로 저장하는 중이에요')
    try {
      const opt = { pixelRatio: 1.5, quality: 0.86, cacheBust: true, backgroundColor: '#ffffff' }
      // 폰트 임베드 단계에서 외부 stylesheet fetch가 막히면(드묾) skipFonts로 폴백 — 표지 저장이 끊기지 않게.
      let url
      try { url = await toJpeg(coverRef.current, opt) } catch { url = await toJpeg(coverRef.current, { ...opt, skipFonts: true }) }
      await onSaveCover?.(url)
      onClose?.()
    } catch (e) { /* noop */ }
    setBusy(null)
  }, [busy, onSaveCover, onClose])

  const layer = { position: 'absolute', top: 0, left: 0 }
  const tabBtn = (on) => ({ padding: '7px 18px', borderRadius: 999, fontSize: 13.5, fontWeight: 800, border: 'none', background: on ? '#fffdf8' : 'rgba(255,255,255,.22)', color: on ? '#5d3410' : '#fff' })

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(40,32,24,.72)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      {/* 만드는 중 로딩 오버레이 — 레꾸자랑 '꾸민 표지' 경로와 같은 모양·같은 문구 톤.
          캡처(카드+레시피 2장)에 몇 초 걸려도 먹통처럼 안 보이게. 이 모달 위(zIndex 310)에 덮는다. */}
      {busy && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'fixed', inset: 0, zIndex: 310, background: 'rgba(30,26,22,.62)', backdropFilter: 'blur(2px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}
        >
          <div className="ocr-spin" />
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>예쁜 카드 만드는 중…</div>
          <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 12.5 }}>{busy}</div>
          <div style={{ color: 'rgba(255,255,255,.55)', fontSize: 11.5 }}>잠깐만 기다려 주세요</div>
        </div>
      )}
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* 미리보기(스케일). 두 장 다 렌더(캡처용) — 안 보는 장은 opacity 0(랩퍼에만). 캡처 ref는 원본 카드에. */}
        <div style={{ width: 1080 * scale, height: 1350 * scale, position: 'relative', borderRadius: 18, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,.4)' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            <div style={{ ...layer, opacity: page === 1 ? 1 : 0 }}><div ref={cardRef}><Card {...draw} title={title} tags={tags} recipe={recipe} /></div></div>
            <div style={{ ...layer, opacity: page === 2 ? 1 : 0 }}><div ref={card2Ref}><RecipeCard recipe={recipe} /></div></div>
            {/* 표지 저장용 숨은 카드(CTA 없음). 화면엔 안 보이고 캡처만. */}
            <div style={{ ...layer, opacity: 0, pointerEvents: 'none' }}><div ref={coverRef}><Card {...draw} title={title} tags={tags} recipe={recipe} cover /></div></div>
          </div>
        </div>
        {/* 페이지 토글 (레시피 있을 때만 2장) */}
        {hasRecipe && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="press" onClick={() => setPage(1)} style={tabBtn(page === 1)}>① 카드</button>
            <button className="press" onClick={() => setPage(2)} style={tabBtn(page === 2)}>② 레시피</button>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 12.5, color: 'rgba(255,255,255,.82)', marginTop: 9 }}>
          {hasRecipe
            ? <>공유하면 2장(카드+레시피)이 함께 가요<img src={uiDuoHi} alt="" draggable={false} style={{ width: 24, height: 24, objectFit: 'contain' }} /></>
            : <><Icon name="refresh" size={14} stroke={2} />다시 뽑기로 마음에 들 때까지</>}
        </div>
        {/* 버튼 */}
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <button className="press" onClick={redraw} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '13px 22px', borderRadius: 999, background: '#fffdf8', color: '#5d3410', fontWeight: 800, fontSize: 15.5, border: 'none' }}><Icon name="refresh" size={17} stroke={2.2} />다시 뽑기</button>
          <button className="press" onClick={share} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '13px 26px', borderRadius: 999, background: '#5d3410', color: '#fffdf8', fontWeight: 800, fontSize: 15.5, border: 'none', opacity: busy ? 0.6 : 1 }}>{busy ? '만드는 중…' : <><Icon name="share" size={17} stroke={2.2} />공유하기</>}</button>
        </div>
        {onSaveCover && (
          <button className="press" onClick={saveCover} disabled={busy} style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 999, background: 'rgba(255,255,255,.14)', color: '#fffdf8', fontWeight: 700, fontSize: 13.5, border: '1px solid rgba(255,255,255,.34)', opacity: busy ? 0.6 : 1 }}><Icon name="photo" size={15} stroke={2} />이 카드를 내 레시피 표지로</button>
        )}
        <button className="press" onClick={onClose} style={{ marginTop: 12, padding: '8px 18px', background: 'transparent', color: 'rgba(255,255,255,.8)', fontSize: 14, fontWeight: 700, border: 'none' }}>닫기</button>
      </div>
    </div>
  )
}
