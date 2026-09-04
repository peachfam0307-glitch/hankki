import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore, 다읽었나 } from './store'
import { consumeSharedIntake, detectSource, firstUrl, captionFrom, firstLine } from './shareIntake'
import { makeInboxRecipe } from './screens/ImportScreen'
import { ocrImage, getOcrLeft, 밀린열쇠보내기, 밀린기본보내기, KEY_NAME, KEY_UNIT } from './ocr'
import { parseRecipeText, keepRaw, 자리표제목 } from './parseRecipe'
import { tidyRecipe, mergeTidy, tidyTail, tidyFounder, AI다듬는중 } from './tidy'
// ⏳ `fetchLinkRecipe` import 는 뺐다 — 「⏳⏳ 서버 되면 되살릴 것 ④」 참조(2026-08-27 · 창업자 확정 "1번").
//    ⛔ `src/linkReader.js` 파일은 «안 지웠다» — 되살릴 때 그대로 쓴다(v11.19 와 같은 방식).
import { guessCategory, fitImage, imageSize } from './utils'
// 🍱 [2026-08-28] 공유로 담으면 아이콘이 빈 접시로 굳던 것 — 뿌리·막이 설명은 `shareIcon.js` 주석에.
import { 공유아이콘 } from './shareIcon'
// 🎴 축소 루프가 «자랑카드 표지»를 건드리지 않게 — 잣대는 화면·클라우드와 «같은 한 곳»(2026-09-02)
import { 카드표지인가 } from './cardCover'
import { guessFoodIconStrict } from './components/FoodIcon'
import BottomNav from './components/BottomNav'
import TabSwipe from './components/TabSwipe'
import TimerBar from './components/TimerBar'
import Icon from './components/Icon'
import { useTimer } from './timer'
import Onboarding, { needsOnboarding } from './components/Onboarding'
import CloudGate from './components/CloudGate'
import ConfirmSheet from './components/ConfirmSheet'
import { askOpenBackup, needsCloudGate, askOpenCloud, 클라우드보임, 자동받기켤까, shouldAskReview, shouldAskReviewNow, myRecipeCount, 문머리글 } from './nudges'
import ReviewAskSheet from './components/ReviewAskSheet'
import HomeScreen from './screens/HomeScreen'
import SearchScreen from './screens/SearchScreen'
import MyRecipesScreen from './screens/MyRecipesScreen'
import ShopScreen from './screens/ShopScreen'
import ProfileScreen from './screens/ProfileScreen'
import BragScreen from './screens/BragScreen'
import ImportScreen from './screens/ImportScreen'
import RecipeDetailScreen from './screens/RecipeDetailScreen'
import EditorScreen from './screens/EditorScreen'
import InboxScreen from './screens/InboxScreen'
import FavoritesScreen from './screens/FavoritesScreen'
import CookedScreen from './screens/CookedScreen'
import CookScreen from './screens/CookScreen'
import DiaryScreen from './screens/DiaryScreen'

// '일지'는 레시피 탭의 '요리 기록' 세그먼트로 합쳐졌다.
// 📔 「일기」 탭 = 레시피 화면을 «한끼 일기»부터 연다 (창업자 2026-08-07
//    *"맨 아래 바에 한끼일기도 넣자. 일기쓰려면 레시피에서 한끼일기 또 들어가야 하니까"*)
//    ⭐ 새 화면을 안 만든다 — 달력·목록이 이미 그 화면에 있다. «어디서 시작하나»만 다르다.
//    ⚠️ 아래 렌더에 key={tab} 이 있어 탭이 바뀌면 다시 마운트된다 → initView 가 그대로 먹는다.
const DiaryLogScreen = () => <MyRecipesScreen initView="log" />
const TABS = { home: HomeScreen, search: SearchScreen, myrecipes: MyRecipesScreen, log: DiaryLogScreen, shop: ShopScreen, brag: BragScreen, profile: ProfileScreen }

// 홈에서 뒤로가기를 두 번 눌러 나가는 창(ms). 안드로이드 앱들이 쓰는 그 방식.
const EXIT_WINDOW_MS = 2000

// --- 아주 가벼운 내비게이션 스택 + 토스트 ---
const NavCtx = createContext(null)
export const useNav = () => useContext(NavCtx)

// 🔓 운영자(창업자) 무제한 모드 진입 — 주소창에 ?founder=<비밀키> 로 한 번 열면 이 기기에 저장.
// 이후 OCR이 무제한(월 5회 제한 우회). 저장 뒤엔 주소에서 파라미터를 지워 비밀키가 새지 않게 한다.
try {
  const _p = new URLSearchParams(location.search)
  const _f = _p.get('founder')
  if (_f) {
    localStorage.setItem('hankki:founder', _f)
    _p.delete('founder')
    const _q = _p.toString()
    history.replaceState(null, '', location.pathname + (_q ? '?' + _q : '') + location.hash)
  }
} catch {
  /* noop */
}

export default function App() {
  // 새로고침(앱 업데이트·실수로 당겨서 새로고침 등)이 나도 보던 탭으로 돌아오도록 기억해 둔다.
  const [tab, setTab] = useState(() => {
    try {
      const t = sessionStorage.getItem('hankki:tab') || 'home'
      if (t === 'diary') return 'myrecipes' // 일지 탭 통합 이전에 저장된 값 호환
      return TABS[t] ? t : 'home'
    } catch { return 'home' }
  })
  const [stack, setStack] = useState([]) // 위로 쌓이는 화면들
  const [toast, setToast] = useState(null)
  // 홈에서 뒤로가기 → '한 번 더 누르면 나가요'. 이 시각(ms)까지가 두 번째를 기다리는 창.
  // ⚠️ 예전엔 팝업 + window.close() 였는데 설치형 앱에선 브라우저가 close 를 막아 아무 일도
  // 안 일어났다("그냥 홈 버튼으로 끄세요" 안내만 떴다). 자바스크립트로 앱을 닫는 방법은 없고,
  // TWA 는 '히스토리가 다 떨어진 상태에서 시스템 뒤로가기'라야 종료된다 → 아래 exitArm 참고.
  const exitArm = useRef(0)
  const [onboard, setOnboard] = useState(() => needsOnboarding()) // 첫 실행 앱 소개
  // ☁️ 클라우드 첫 화면 — 소개보다 «앞». 아직 안 본 사람 ＋ 아직 앱을 안 써본 사람에게만.
  //   ⛔ 이미 쓰고 있던 사람에겐 안 띄운다 — 잘 쓰던 앱이 갑자기 로그인 화면으로 시작하면 그건 «벽»으로 읽힌다.
  //      그 사람들은 홈 한 줄에서 만난다(규칙 18 ⓙ — 이미 깔린 폰).
  //   🔀 ＋ 공개 스위치(`클라우드보임`) — 켜는 날까지 창업자 폰에서만. 근거는 `nudges.js` 머리주석.
  const [cloudGate, setCloudGate] = useState(() => 클라우드보임() && needsCloudGate() && needsOnboarding())
  // 🙏 한마디 청하기 — 「레시피를 저장한 직후」 (창업자 확정 2026-09-03 · 내 레시피 2개부터)
  //   ⛔⛔ **왜 «화면»이 아니라 여기서 띄우나** — `EditorScreen` 은 저장에 성공하면 `nav.popAll()` 로
  //      스스로 사라진다. 거기서 시트를 그리면 같은 틱에 언마운트돼 **아무것도 안 뜬다.**
  //   ⛔ **판정도 여기서 한다** — 편집 화면이 들고 있는 `recipes` 는 «저장 전» 값이라
  //      거기서 세면 방금 담은 한 편이 빠진다. 여기는 store 를 구독하니 늘 최신이다.
  //      📌 「+1 해서 센다」로 때우지 않는다 — 그러면 세는 자가 둘이 된다(절대원칙 34).
  const [리뷰청하기, set리뷰청하기] = useState(null) // 머리글 글자(null = 안 뜸)
  // 🚪🚪 [창업자 확정 2026-09-03] 문을 «여러 갈래»로 — 어느 하나만 해도 뜬다(OR).
  //   📮 창업자 = *"각각 다르게 레시피 2번 저장해보거나 레꾸자랑을 해보거나 등등...
  //      **각각 뭐라도 쓰면 리뷰쓰는 페이지가 나오게**"* · *"**리뷰가 되게 크다...ㅠ**"*
  //   ⛔ 문턱 숫자를 더 낮추는 게 아니다(절대원칙 34) — **문의 «개수»를 늘린다.**
  //   ⭐⭐ 「뭘 하든 «한 번»만」 (창업자 물음 = *"제일 먼저한걸루"*) —
  //      모든 문이 `shouldAskReviewNow()` 를 «함께» 보고, 시트가 뜨는 순간
  //      `markReviewAsked()` 가 날짜를 박아 **나머지 문이 전부 같이 닫힌다.**
  //      ⛔ 문마다 따로 세는 표식을 만들지 않는다 — 그러면 「한 번」이 「문 개수만큼」이 된다.
  //   ⚠️ 정확히는 「평생 1회」가 아니라 **「30일에 1회」**다(창업자 확정 2026-08-28).
  const [리뷰신호, set리뷰신호] = useState(null)     // { 씨: 신호마다 +1, 까닭: 어느 문인가 }
  const backHandlers = useRef([]) // 화면들이 등록한 '뒤로가기 먼저 처리' 핸들러(비모달 상태·필터용)
  const modalLayers = useRef([]) // 열려 있는 모달·오버레이(각자 진짜 히스토리 칸 1개 소유)
  const pendingBack = useRef(0) // 같은 틱에 버튼으로 동시에 닫힌 모달 칸 수(한 번에 go(-n))
  const backScheduled = useRef(false)
  const suppressPop = useRef(0) // popAll·모달버튼닫기 가 만든 popstate 무시용
  const toastTimer = useRef(null)
  // 🔽 닫히는 «동안»에도 글자가 남아 있어야 띠가 스르르 접힌다(비면 그 자리에서 툭 사라진다)
  const 지난토스트 = useRef('')
  const showToastRef = useRef(null) // 뒤로가기 핸들러(위에서 만들어짐)가 아래 showToast 를 쓰기 위한 통로
  const tabRef = useRef(tab)
  const stackRef = useRef(stack)
  const onboardRef = useRef(onboard)
  tabRef.current = tab
  stackRef.current = stack
  onboardRef.current = onboard

  useEffect(() => {
    try { sessionStorage.setItem('hankki:tab', tab) } catch { /* noop */ }
  }, [tab])

  // 🔁 못 보낸 «행동 열쇠»를 앱을 열 때 조용히 다시 보낸다(🕳6 — 오프라인·비행기모드).
  //   ⛔ 결과를 화면에 안 띄운다 — 유저는 이미 그 행동을 잊었다. 숫자만 조용히 맞춘다.
  //   ⭐ 서버가 멱등이라 몇 번을 보내도 안전하다.
  // 🔁 못 보낸 신호를 앱 열 때 조용히 다시 보낸다 — 행동 열쇠 ＋ 「기본 인식으로 읽었다」 둘 다.
  //   ⛔ 화면에 아무것도 안 띄운다. 숫자만 맞춘다.
  useEffect(() => { 밀린열쇠보내기(); 밀린기본보내기() }, [])

  // 🔤 카드·표지를 사진으로 뽑을 때 쓰는 «글꼴 꾸러미»를 앱이 한가할 때 미리 만들어 둔다.
  //   ⛔⛔ 안 데워두면 유저가 「공유하기」를 누른 «뒤에» 글꼴 8개·1.7MB 를 만들기 시작해
  //      십수 초가 걸리고, 그 사이 폰의 공유 허가가 만료돼 저장으로 밀리거나 아예 먹통이 됐다
  //      (2026-08-03·08-05 「자랑카드 먹통」). 실측 = 글꼴 포함 15.3초 vs 빼면 1.4초.
  //   ⭐ 홈이 다 그려진 «뒤» 한가한 틈에만 한다 — 첫 화면 뜨는 속도는 건드리지 않는다.
  useEffect(() => {
    const go = () => { /* 지금은 안 데운다 — 미리 만든 글꼴 꾸러미는 일부만 실려 카드를 깨뜨렸다 */ }
    const idle = window.requestIdleCallback
    const t = setTimeout(() => (idle ? idle(go, { timeout: 4000 }) : go()), 2500)
    return () => clearTimeout(t)
  }, [])

  // 화면을 열 때마다 브라우저 히스토리에도 한 칸 쌓는다 → 제스처(스와이프) 뒤로가기가
  // 트랩 한 칸을 넘어 '앱 종료'로 새는 걸 막는다. (버튼·스와이프 모두 popstate 한 곳에서 처리)
  const push = useCallback((screen) => {
    setStack((s) => [...s, screen])
    try { history.pushState({ hankki: 1 }, '') } catch { /* noop */ }
  }, [])
  // 🔁🔁 **같은 자리에서 «갈아끼우기»** — 히스토리 칸을 «안» 쌓는다. (2026-08-28 일기 넘겨보기)
  //
  // 📮 창업자 = *"일기를 넘겨가며 볼수있으면 좋겠어(**지금은 날짜하나하나 눌러야함**)"*
  //
  // ⛔⛔ 넘길 때마다 `push` 를 쓰면 **뒤로가기가 지옥이 된다** — 일기 열 장을 넘겨 보고 나서
  //    뒤로가기를 누르면 열 번을 눌러야 달력으로 돌아온다. 유저는 「앱이 고장났다」로 읽는다.
  // ⭐ 넘기기는 «새 화면을 여는 것»이 아니라 «보던 화면의 내용이 바뀌는 것»이다.
  //    그래서 스택 맨 위 한 칸만 갈아끼우고 히스토리는 건드리지 않는다 → 뒤로가기 한 번에 달력.
  // ⛔ 스택이 비었으면(＝탭 화면) 아무 일도 안 한다 — 갈아끼울 칸이 없다.
  const replace = useCallback((screen) => {
    setStack((s) => (s.length ? [...s.slice(0, -1), screen] : s))
  }, [])
  // 화면 안 화살표(뒤로) 버튼도 브라우저 뒤로가기로 통일 → 버튼/스와이프 동작 일치.
  const pop = useCallback(() => {
    try { history.back() } catch { setStack((s) => s.slice(0, -1)) }
  }, [])
  // 스택 전체 닫기: 쌓아둔 히스토리 칸 수만큼 한 번에 되돌린다(그 popstate 들은 무시).
  const popAll = useCallback(() => {
    // 열려 있던 모달도 함께 정리(각자 히스토리 칸 소유) — 정리자가 back() 을 또 부르지 않게 표시.
    const modals = modalLayers.current
    modals.forEach((l) => { l.consumed = true })
    const n = stackRef.current.length + modals.length
    modalLayers.current = []
    setStack([])
    // history.go(-n) 은 여러 칸을 한 번에 되돌려도 popstate 를 '딱 한 번'만 쏜다 → 항상 1만 억제.
    if (n > 0) { suppressPop.current += 1; try { history.go(-n) } catch { /* noop */ } }
  }, [])
  // 화면이 '뒤로가기'를 먼저 가로채도록 등록. 최근 등록(=가장 위 레이어)만 물어본다.
  const registerBack = useCallback((fn, opts) => {
    // tabLevel 핸들러(탭 화면의 내부 상태)는 위에 스택 화면이 있으면 잠재운다 — 아래 onPop 참고.
    const entry = { fn, tab: !!(opts && opts.tabLevel) }
    backHandlers.current.push(entry)
    return () => { backHandlers.current = backHandlers.current.filter((h) => h !== entry) }
  }, [])
  // 모달·오버레이 전용: 열 때(사용자 터치 시점) 진짜 히스토리 칸을 쌓는다 → gesture-backed 라
  // 크롬의 history intervention(터치 없이 만든 pushState 칸을 뒤로가기 때 건너뜀)에 안 걸린다.
  // 뒤로가기(popstate)는 이 칸을 소비만 하고 '다시 채우지 않는' 게 핵심(재종료 버그 근본 해결).
  const openModal = useCallback((close) => {
    const layer = { close, consumed: false }
    try { history.pushState({ hankki: 1 }, '') } catch { /* noop */ }
    modalLayers.current.push(layer)
    return () => {
      const i = modalLayers.current.indexOf(layer)
      if (i >= 0) modalLayers.current.splice(i, 1)
      // 뒤로가기가 아니라 닫기 버튼·선택으로 닫혔으면, 쌓아둔 히스토리 칸을 되돌려 소비.
      // 겹친 모달이 같은 틱에 여러 개 닫히면(예: 아바타 시트 안 픽커 선택 → 둘 다 닫힘)
      // history.back() 을 동기로 여러 번 부르면 어긋나므로, 한 틱에 모아 go(-n) 한 번으로 처리.
      if (!layer.consumed) {
        pendingBack.current += 1
        if (!backScheduled.current) {
          backScheduled.current = true
          queueMicrotask(() => {
            const n = pendingBack.current
            pendingBack.current = 0
            backScheduled.current = false
            if (n > 0) { suppressPop.current += 1; try { history.go(-n) } catch { /* noop */ } }
          })
        }
      }
    }
  }, [])
  const go = useCallback((t) => {
    setStack([])
    setTab(t)
  }, [])

  // 안드로이드 '뒤로가기'가 앱을 바로 종료시키지 않도록: 열린 화면을 닫고,
  // 탭이면 홈으로. (히스토리 트랩을 유지해 갑작스런 종료 방지)
  useEffect(() => {
    const hasTrap = () => !!(history.state && history.state.hankki)
    const trap = () => { try { history.pushState({ hankki: 1 }, '') } catch { /* noop */ } }
    if (!hasTrap()) trap() // index.html 이 이미 깔았으면 중복 안 함
    const onPop = () => {
      // 0) popAll·모달버튼닫기 가 history.go/back 으로 만든 이벤트는 무시(화면은 이미 닫힘)
      if (suppressPop.current > 0) { suppressPop.current -= 1; return }
      // 1) 온보딩(첫 실행 소개)이 떠 있으면 뒤로가기로 종료팝업이 뜨지 않게 가둔다.
      if (onboardRef.current) { trap(); return }
      // 1.5) 모달·오버레이(꾸미기·미리보기·시트·픽커 등)가 열려 있으면 최상위 하나만 닫는다.
      //      이 칸은 열 때 gesture-backed 로 쌓였고 방금 popstate 로 소비됐으니 '다시 채우지 않는다'.
      //      (popstate 안 gesture-less pushState 가 사라져 크롬 intervention 재종료 버그를 근본 제거)
      // ⛔⛔ **꾸미기 뒤로가기 먹통** (창업자 2026-08-12 *"뒤로가기 안됨(꾸미기 닫힘안돼)"*)
      //    🔢 뿌리 = 여기서 층을 «무조건» 빼버렸다. 그런데 꾸미기의 닫기는 곧장 안 닫고
      //       **「저장하지 않고 나갈까요?」를 먼저 묻는다** → 판은 그대로인데 층과 히스토리 칸이 사라진다.
      //       → 다음 뒤로가기가 갈 곳을 잃어 «먹통»이 되거나, 판보다 아래 칸을 먹어 **꾸민 게 날아간다.**
      //    ⭐ 답 = 닫기가 `false` 를 돌려주면 «아직 안 닫았다»로 보고 **층을 남기고 칸을 되채운다.**
      //       (2번·4번 경로가 이미 같은 문법으로 `trap()` 을 쓴다 — 새 발명이 아니다.
      //        ⛔`trap()` 금지는 5번 「홈에서 나가기」 자리에만 해당한다)
      if (modalLayers.current.length > 0) {
        const layer = modalLayers.current[modalLayers.current.length - 1]
        layer.consumed = true
        let 아직안닫힘 = false
        try { 아직안닫힘 = layer.close() === false } catch { /* noop */ }
        if (아직안닫힘) { layer.consumed = false; trap(); return }
        modalLayers.current.pop()
        return
      }
      // 2) 그 밖의 화면 내부 상태(필터·세그먼트 등)를 위에서부터 처리한다.
      //    하나라도 소비하면 버퍼를 다시 채워 다음 뒤로가기가 종료로 새지 않게.
      //    (겹친 시트·픽커가 각자 핸들러를 등록해도 순서대로 조합되도록 전체를 훑는다)
      const hs = backHandlers.current
      const underStack = stackRef.current.length > 0
      for (let k = hs.length - 1; k >= 0; k -= 1) {
        // 탭 화면 핸들러는 위에 스택 화면(상세·요리 등)이 있으면 건너뛴다.
        // (그 뒤로가기는 스택 화면 것 → 안 그러면 밑에 깔린 탭이 back 을 가로채 상세가 안 닫힘)
        if (hs[k].tab && underStack) continue
        try { if (hs[k].fn()) { trap(); return } } catch { /* noop */ }
      }
      // 3) 열린 스택 화면 닫기. (그 화면이 쌓아둔 gesture-backed 칸을 방금 소비함)
      if (stackRef.current.length > 0) { setStack((s) => s.slice(0, -1)); return }
      // 4) 다른 탭이면 홈으로. 이때 보호 칸을 다시 깔아야 한다 —
      //    안 깔면 히스토리가 이미 바닥이라 '탭 → 뒤로(홈) → 뒤로' 가 안내도 없이 앱을 꺼버린다.
      //    (2번 경로도 같은 이유로 trap() 한다. 다음 터치의 ensureGuard 만 믿으면 그 사이가 뚫린다)
      if (tabRef.current !== 'home') { setTab('home'); trap(); return }
      // 5) 홈에서 뒤로 → '한 번 더 누르면 나가요'.
      //    ⭐ 여기서 히스토리를 남김없이 비워야 다음 뒤로가기가 진짜로 앱을 닫는다.
      //    (TWA 는 히스토리가 떨어져야 액티비티를 종료한다. JS 로는 못 닫는다.)
      //    우리가 심어둔 칸(state.hankki)이 아직 남아 있으면 하나 되돌려 맨 처음 칸으로 간다.
      //    ⚠️ 여기서 pushState 로 다시 채우면 안 된다 — 크롬 intervention 재종료 버그의 원인.
      if (history.state && history.state.hankki) {
        suppressPop.current += 1
        try { history.go(-1) } catch { /* noop */ }
      }
      exitArm.current = Date.now() + EXIT_WINDOW_MS // 이 동안은 가드를 다시 안 심는다
      showToastRef.current?.('한 번 더 누르면 나가요', EXIT_WINDOW_MS)
    }
    // 앱으로 되돌아왔을 때(다른 앱 갔다 오기 등) 트랩이 사라졌으면 다시 깐다
    // (나가기 대기 중이면 안 깐다 — 깔면 두 번째 뒤로가기가 또 막혀서 영영 못 나간다)
    const onShow = () => {
      if (Date.now() < exitArm.current) return
      if (stackRef.current.length === 0 && !hasTrap()) trap()
    }
    // ⭐ 핵심: 루트(홈/탭, 열린 화면·모달 없음)에서 사용자가 화면을 터치할 때마다
    // '가드' 히스토리 칸을 하나 유지한다. 터치와 함께 만들어져 gesture-backed 라,
    // 깐깐한 크롬(intervention)도 이 칸을 건너뛰지 않는다 → 홈 뒤로가기가 앱을 바로
    // 종료시키지 않고 종료 확인/홈 이동으로 이어진다. (터치 없이 심는 트랩의 한계 극복)
    const ensureGuard = () => {
      // '한 번 더 누르면 나가요' 대기 중엔 심지 않는다 — 심으면 두 번째 뒤로가기가 이 칸을
      // 먹어버려서 앱이 안 닫힌다. (창이 지나면 다음 터치에서 자동으로 다시 깔린다 = 취소)
      if (Date.now() < exitArm.current) return
      if (stackRef.current.length === 0 && modalLayers.current.length === 0 &&
          !(history.state && history.state.guard)) {
        try { history.pushState({ hankki: 1, guard: 1 }, '') } catch { /* noop */ }
      }
    }
    window.addEventListener('popstate', onPop)
    window.addEventListener('pageshow', onShow)
    // 터치 기기는 '터치가 끝나는 순간(pointerup)'부터 사용자 제스처로 인정된다(pointerdown 은
    // 아직 아님 → 일부 폰에서 가드가 무시됨). 그래서 pointerup·click·keydown 에 심는다.
    // (이미 가드가 있으면 안 심으니 중복 없음)
    window.addEventListener('pointerup', ensureGuard, true)
    window.addEventListener('click', ensureGuard, true)
    window.addEventListener('keydown', ensureGuard, true)
    return () => {
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('pageshow', onShow)
      window.removeEventListener('pointerup', ensureGuard, true)
      window.removeEventListener('click', ensureGuard, true)
      window.removeEventListener('keydown', ensureGuard, true)
    }
  }, [])

  // 새 버전으로 업데이트돼 새로고침된 직후 — 최신임을 한 번 알려준다(캐시 혼란 방지).
  useEffect(() => {
    try {
      if (sessionStorage.getItem('hankki:updated')) {
        sessionStorage.removeItem('hankki:updated')
        setTimeout(() => showToast('최신 버전으로 업데이트됐어요'), 600)
      }
    } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ⏱⏱ **안내가 떠 있는 시간 — 글자 길이에 맞춘다** (창업자 2026-08-29 *"이것도 눈깜짝할사이에 사라져;; 겨우찍음"*)
  //
  // ⛔⛔ **v11.84 에서 창업자 지시 「시간도 늘리자」를 «반쪽만» 지켰다.**
  //   편집 화면 캡처 쪽엔 6500 을 줬는데 **공유받기·갤러리(＝창업자가 실제로 쓰는 문)는 기본값 1900 그대로**였다.
  //   그 문은 안내가 제일 긴데(잔량 ＋ AI 꼬리 = 다섯 줄) 시간은 제일 짧았다.
  //   📌 2026-08-29 아침 AI 다듬기 사고와 «똑같은 모양»이다 — 문이 셋인데 한 곳만 고쳤다.
  //
  // ⭐⭐ **그래서 「부르는 쪽마다 숫자를 준다」를 그만둔다** — 그러면 새 안내가 생길 때마다 또 빠뜨린다.
  //   **기본값이 글자 수를 보고 스스로 늘어난다.** 짧은 안내는 지금처럼 빨리 사라지고 긴 것만 오래 남는다.
  //   🔢 2200ms(눈이 가는 데 걸리는 시간) ＋ 글자당 70ms · 최대 4800ms
  //      · 「링크를 담았어요」 8자 → 2.8초   · AI 다듬기 안내 38자 → 4.8초
  //   ⛔ 상한을 둔다 — 안내가 오래 떠 있으면 그건 안내가 아니라 «가리는 것»이다.
  //   ⛔⛔ **[2026-08-31 · 창업자 제보] 8000 → 4800 으로 내렸다** — *"길게 떠있어"*.
  //      🔢 옛 셈으로는 AI 다듬기 안내(운영자 화면 70자)가 9080ms 로 나와 **상한 8초를 꽉 채웠다.**
  //      ⭐ 같은 날 «글자»도 줄였다(`tidy.js` 짧은모델 · 44자→10자) — 둘이 곱해져서 8.0초 → 4.8초가 된다.
  //   ⛔ 부르는 쪽이 `ms` 를 «직접» 주면 그 값이 이긴다(나가기 안내처럼 시간이 뜻을 가진 자리).
  const toastMs = (msg) => Math.min(4800, 2200 + String(msg || '').length * 70)

  const showToast = useCallback((msg, ms) => {
    const 뜰시간 = typeof ms === 'number' ? ms : toastMs(msg)
    if (msg) 지난토스트.current = msg
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 뜰시간)
  }, [])
  showToastRef.current = showToast

  // ✋✋ **길게 눌러도 「이미지 메뉴」가 안 뜨게** (창업자 폰 캡처 2026-08-09 밤 — *"길게누르면 이렇게돼"*)
  //    스티커를 길게 누르니 크롬 메뉴(새 탭에서 열기·이미지 복사·이미지 다운로드·이미지 공유)가 떴다.
  //    ⛔⛔ **v9.92 에 고친 것과 «다른» 것이다** — 그건 「글자 선택」(끌면 복사·웹 검색 막대)이고 이건 「이미지 메뉴」다.
  //    ⛔⛔ 그때 넣은 `-webkit-touch-callout: none`(styles.css)은 **iOS Safari 전용**이라
  //       **안드로이드 크롬엔 처음부터 안 먹고 있었다.** 넣어놓고 고쳤다고 여긴 자리다.
  //       (그 줄은 그대로 둔다 — 아이폰에선 그게 일한다.)
  //    ⭐ 안드로이드 크롬에서 막는 길은 **`contextmenu` 를 취소하는 것** 하나다.
  //    ⭐ 앱 전체에 건다 — 롱프레스가 우리 조작 방식이다(홈 카드 길게 눌러 삭제·스티커 크기·회전 손잡이).
  //       화면 하나만 막으면 다음 화면에서 또 뜬다.
  //    ⚠️ 글 쓰는 칸은 «반드시» 예외 — 거기선 「붙여넣기·전체 선택」이 나와야 한다.
  useEffect(() => {
    const onMenu = (e) => {
      const t = e.target
      if (t && t.closest && t.closest('input, textarea, [contenteditable="true"]')) return
      e.preventDefault()
    }
    document.addEventListener('contextmenu', onMenu)
    return () => document.removeEventListener('contextmenu', onMenu)
  }, [])

  // 저장 공간이 가득 차서 저장이 실패하면(특히 iOS ~5MB) 조용히 사라지지 않게 알린다.
  useEffect(() => {
    const onFull = () => showToast('저장 공간이 가득 찼어요 · 설정에서 백업 후 오래된 사진을 정리해 주세요', 5000)
    // 📊📊 **차기 «전»에 말한다** (2026-09-02 · 창업자 폰이 4.56MB/5MB = 91% 였다)
    //   ⛔⛔ 그 전엔 **100% 에서, 그것도 «잃고 나서»** 알았다. 그게 오늘 아침 사고다.
    //   ⭐ 80% 를 넘으면 미리 알린다 — 자랑카드 한 장이 0.5~0.9MB 라 **한 방에** 넘어갈 수 있다.
    //   ⏰ 5분에 한 번만(`store.jsx` 가 조절) — 매 저장마다 뜨면 잔소리가 되어 아무도 안 본다.
    const onWarn = (e) => {
      const 퍼센트 = Math.round(((e?.detail?.쓴것 || 0) / (e?.detail?.한도 || 1)) * 100)
      showToast(`저장 공간이 ${퍼센트}% 찼어요 · 설정에서 백업해 두는 게 좋아요`, 6000)
    }
    window.addEventListener('hankki:storagefull', onFull)
    window.addEventListener('hankki:storagewarn', onWarn)
    return () => {
      window.removeEventListener('hankki:storagefull', onFull)
      window.removeEventListener('hankki:storagewarn', onWarn)
    }
  }, [showToast])

  // '공유받기' — 인스타/갤러리에서 한끼로 공유된 링크·사진을 앱 시작 시 받아 Inbox 로.
  const store = useStore()
  // ⭐ 아래 「저절로 올리기」가 «한 번만» 도는데 그 안에서 최신 store 를 봐야 한다 — 그래서 ref 로 들고 있는다.
  const storeRef = useRef(store)
  storeRef.current = store

  // 🙏 저장 신호가 올라오면 «최신 레시피 수»로 판정한다 (위 `리뷰신호` 주석 참고).
  //   ⛔ 소개 화면·클라우드 첫 화면이 떠 있으면 안 띄운다 — 시트가 겹치면 둘 다 못 읽는다.
  //      (갓 깐 사람은 내 레시피가 0이라 어차피 안 걸리지만, 겹침은 «없게» 막아 둔다)
  useEffect(() => {
    if (!리뷰신호) return
    const 까닭 = 리뷰신호.까닭
    set리뷰신호(null)
    if (onboard || cloudGate) return
    // ⭐ 여기가 「한 번」을 지키는 자리 — 문이 몇이든 이 한 줄을 «다 같이» 지난다
    if (!shouldAskReviewNow()) return
    // 🍱 레시피 문만 문턱이 있다(창업자 확정 = 2개). 나머지 문은 한 번이면 된다.
    // ⛔ 이미 떠 있으면 «덮어쓰지 않는다» — 시트 위에 시트 금지(2026-08-27 에 지킨 것).
    //    함수꼴로 넣는 이유 = 이 effect 는 `리뷰신호` 만 보고 돌아서
    //    `리뷰청하기` 를 그냥 읽으면 «낡은 값»을 본다.
    if (까닭 === '레시피') {
      if (!shouldAskReview(store.recipes)) return
      const 글 = `내 레시피 ${myRecipeCount(store.recipes)}개가 됐어요`
      set리뷰청하기((앞) => 앞 || 글)
      return
    }
    // 🏷 머리글은 «그 자리에서 참인 말»이어야 한다(v11.61 에 정한 것) —
    //    자랑 안 하고 꾸미기만 한 사람에게 「자랑 보냈어요」가 뜨면 거짓말이 된다.
    // ⛔ 「대단해요」·「축하합니다」 금지 — 우리 톤은 조용한 위로다(리텐션 설계원칙).
    set리뷰청하기((앞) => 앞 || 문머리글[까닭] || '한끼를 쓰고 계시네요')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [리뷰신호])

  // ☁️🔄 저절로 저장하기 — 앱을 켤 때 «한 번». (창업자 확정 2026-08-21 = ⓒ)
  //   📮 창업자 = *"좋아 그럼 C지."* · *"그래 좋아 나도 폰 패드 같이쓰거든."* · *"2번도 기변하는 사람들 많으니까"*
  //   ⭐ 왜 자동인가 = 로그인만 하고 「올리기」를 안 누르면 클라우드에 아무것도 안 간다.
  //      유저는 「로그인했으니 안전하겠지」 하고 넘어가고, 폰을 바꾸면 아무것도 없다.
  //   ⛔⛔ 첫 화면이 뜨는 길목이다 — **여기서 절대 멈추거나 던지면 안 된다.**
  //      `저절로올리기` 는 스스로 try 로 감싸 «항상» 값을 돌려준다(던지지 않는다).
  //   ⏳ 홈이 다 그려진 «뒤» 한가할 때만 — 첫 화면 속도를 안 건드린다(글꼴 데우기와 같은 방식).
  //   🛡 안전장치 둘은 `cloud.js` 안에 있다 — ①다른 기기가 마지막이면 안 올린다 ②안 가져왔으면 안 올린다.
  //      여기서는 ①이 걸렸을 때 «물어보는 것»만 한다(⛔자동으로 합치지 않는다 — 창업자 확정).
  const [덮을까, set덮을까] = useState(null) // { 언제, 레시피, 일기 } — 다른 기기가 먼저 올렸다
  useEffect(() => {
    let 죽었나 = false
    const 해보기 = async () => {
      try {
        const { 저절로올리기, 저절로받기, 새판알림글, 사진안내봤나, 사진안내봤다 } = await import('./cloud')
        const { 백업만들기 } = await import('./backupData')
        const 백업 = () => 백업만들기(storeRef.current)
        // 🔁🔁 **[2026-09-04 · 순서를 하나로 바꿨다] 받기 → 얹기 → 올리기.**
        //   📮 창업자 = *"하루종일 이게 뭐야"* · *"땜빵질하지말라니까"* — 맞는 말이었다.
        //   ⛔⛔ 그 전엔 **「올리기 먼저, 막히면 그때만 받기」**였다. 받기가 «곁가지»였던 것이다.
        //      그래서 **올릴 게 없는 기기는 받지도 못했다** — 창업자 패드가 정확히 그 자리였다
        //      (패드 260 = 클라우드 260 → 「바뀐 것 없음」으로 끝 → 받기 길에 닿지도 못함).
        //   ⭐ 이제 곁가지가 없다. 켤 때마다 «같은 한 순서»로만 돈다.
        //   🧪 지키는 판 = `_repro-폰패드왕복-0904.mjs` (창업자 두 기기를 그대로 세워놓고 잰다)
        if (자동받기켤까()) {
          const 받 = await 저절로받기(백업)
          if (죽었나) return
          let 얹은판 = null
          if (받?.했나 && 받.판) {
            // 🕳🕳 **[2026-09-04] 「받는 사이에 담은 것」이 사라지던 창을 닫는다.**
            //   📮 창업자 = *"폰에서도 가져오기하면 보관함에서 금방사라져버리면서 최근저장에도 안보여"*
            //             ＋ *"앱을 껐다가 켜면 그때보이고 뭔가 불안정해"*
            //   ⛔⛔ `받.판` 은 «네트워크를 타기 전»에 뜬 판으로 합쳐진 것이다.
            //      그 사이(몇 초)에 담은 편은 그 판에 «없다» → 그대로 얹으면 화면에서 지워진다.
            //      저장은 돼 있으니 껐다 켜면 다시 보인다 — 창업자가 본 그대로다.
            //   ✅ 얹기 «직전»에 «지금 화면»과 한 번 더 합친다. 합치기는 «더하기»뿐이라 잃을 게 없다.
            //   🧪 이 창을 재는 칸 = `_repro-폰패드왕복-0904` ⑤ (처음엔 헛돌아서 초록불이었다 — 고쳐서 잡았다)
            const { 합치기 } = await import('./syncMerge')
            얹은판 = 합치기({ 내것: 백업(), 받은것: 받.판 })
            store.importAll(얹은판)
            if (!사진안내봤나()) { 사진안내봤다() }
          }
          // ⭐⭐ 「방금 클라우드를 확인했나」 — 확인했을 때만 올린다.
          //   ⛔ 못 받았는데(인터넷 끊김 등) 올리면 그게 «덮어쓰기»다. 그때는 올리지 않는다.
          const 확인함 = !!(받?.했나 || 받?.왜 === '내가마지막' || 받?.왜 === '클라우드비었음')
          if (확인함) {
            // ⛔⛔ 방금 얹었으면 **그 «합친 판»을 올린다** — `storeRef` 는 리액트라 아직 옛 값일 수 있고,
            //    옛 값을 올리면 «클라우드에만 있던 편»을 지워 버린다(올리기는 없는 것을 지운다).
            const 올릴것 = 얹은판 ? async () => 얹은판 : 백업
            await 저절로올리기(올릴것, { 확인함: true })
          }
          return
        }

        // 🔒 창업자 기기가 아니면 «예전 그대로» — 올리기만 하고, 막히면 물어본다(9/1 이전과 같다)
        const r = await 저절로올리기(백업)
        if (죽었나) return
        // ☁️🔔 글은 «그 자리에서» 만든다 — `cloud.js` 를 맨 위에서 import 하면
        //    로그인 안 한 사람의 첫 화면에도 딸려 들어간다(늦게 부르기가 무의미해진다).
        if (!r.했나 && r.왜 === '다른기기') {
          // ⬇️⚡ **다른 기기가 먼저 올렸다 → 이제는 «저절로 받아온다»** (창업자 확정 2026-09-01 = ⓐ)
          //   📮 창업자 = *"자동동기화는 꼭 필요해."* — 그 전엔 여기서 물어보기만 했고,
          //      눌러도 설정 화면으로 데려갈 뿐이라 거기서 **한 번 더** 눌러야 왔다.
          //   ⛔ 받아도 «안전할 때»만 한다 — 이 기기에 안 올린 변경이 있으면 `저절로받기` 가
          //      스스로 «양쪽이바뀜»으로 물러난다. 그때는 아래처럼 «물어본다»(사람이 고른다).
          //   ⭐ 사진은 `저절로받기` 안에서 «폰 것을 그 자리에 되돌려» 지킨다(용량 0).
          // 🚨🚨 **[2026-09-01 23:51 · 즉시 껐다] 자동 받기가 «방금 담은 레시피»를 덮었다.**
          //   📮 창업자 실물 = 항정살조림을 담아 열쇠가 5→4 로 깎였는데, 잠시 뒤 **레시피가 사라졌다.**
          //      검색해도 안 나온다(전체 255 그대로 · 담았으면 256 이라야 한다).
          //   ⛔⛔ **열쇠는 썼는데 물건이 없다 — 제일 나쁜 모양이다.** 원인을 파기 «전에» 먼저 막는다.
          //   ⭐ `저절로받기` 는 `cloud.js` 에 그대로 살아 있다(재현판 30/30 도 그대로 돈다).
          //      여기서 **부르지만 않는다** — 원인이 확정되면 안전장치를 고쳐서 다시 켠다.
          //   ❓ 아직 «확정 못 한» 것 = 어느 길로 덮였나.
          //      안전장치(`안올린변경있나`)가 있는데도 뚫렸다 = 지문이 «담긴 직후» 맞춰지는 창이 있다는 뜻.
          //   ⛔ 원인이 확정되기 전엔 이 줄을 되살리지 말 것.
          // 🔓🔓 **[2026-09-04] 잠금을 «푼다» — 다만 「덮어쓰기」를 «합치기»로 바꾼 뒤에.**
          //   📮 창업자 = *"ⓑ로 가자. 설계부터 제대로 해줘"* → 다섯 번 흔들고 구멍 스무 개를 적었다
          //             ＋ *"이건 네가 우리앱을 책임지는거야. 이거 잘못되면 답이 없어"*
          //   ⭐⭐ 위 9/1 사고의 «원인»은 **여전히 확정 못 했다.** 그래서 원인을 쫓는 대신
          //      **원인이 무엇이든 «잃을 수 없는» 모양**으로 바꿨다(절대원칙 34):
          //      · 받기가 «덮지» 않는다 — 합친다. 지우는 일은 «무덤»이 시킬 때만(`syncMerge`·`syncGrave`)
          //      · 얹기 «전»에 **되돌릴 벌**을 뜬다. **못 뜨면 아예 안 얹는다**(`syncUndo`)
          //      · 무엇이 오갔는지 **남긴다**(`syncLog`) — 9/1 에 기록이 0이라 원인을 못 찾았다
          //      · 읽기·쓰기를 **센다**(`syncMeter`) — 유저 200명에서 무료치가 터지는 걸 미리 본다
          //   🧪 지키는 판 여덟이 전부 초록불이라야 이 줄이 산다 —
          //      합치기10 · 되돌리기11 · 기록9 · 무덤13 · 바뀐것만12 · 붙이기10 ＋ 옛 판 둘(0821·0831)
          //   ⛔ 이 줄을 다시 잠글 일이 생기면 **왜 잠그는지를 여기 적을 것.** 그냥 `if (false)` 로 돌리지 말 것.
          // 🔒🔒 **[2026-09-04] 아직 «창업자 기기에서만» 돈다** (창업자 확정 = ⓐ)
          //   ⛔ 유저는 이 줄을 못 지나간다 — 아래 «물어보기»로 내려간다(9/1 이전과 «똑같은» 동작).
          //   📮 왜 = ⑴TWA 라 되돌릴 창이 없다(스토어 심사 하루)
          //           ⑵「바뀐 것만 읽기」를 아직 안 붙여서 유저 200명이면 무료 읽기치가 터진다
          //           ⑶ 클라우드 로그인도 «똑같이» 이렇게 폈다(`클라우드보임`)
          //   🔓 푸는 순서·조건은 `nudges.js` 의 `자동받기_전체공개` 머리주석에 적어뒀다.
          const 받았나결과 = null   // ⛔ 위 «한 순서» 길이 이미 받았다. 여기는 유저 기기 전용 길이다.
          if (죽었나) return
          if (받았나결과?.했나 && 받았나결과.판) {
            // ⭐ **한 번에** 얹는다 — 반만 들어가는 창을 만들지 않는다(구멍 ⑦).
            // ⛔ 얹는 길은 «이미 있는 것»을 쓴다 — 백업 불러오기·클라우드 내려받기가 쓰는 그 함수다.
            //    🧪 [2026-09-04] 처음에 `replaceAll` 이라고 «지어냈다». 없는 이름이라
            //       그대로 뒀으면 «조용히 아무 일도 안 나고» 자동 받기가 죽은 채로 돌 뻔했다.
            //       📌 부르기 전에 «그 함수가 진짜 있나»부터 본다(규칙 18 — 확인 방식부터 의심).
            store.importAll(받았나결과.판)
            if (!사진안내봤나()) { 사진안내봤다() }
            return
          }
          // ⛔ 못 받았으면(되돌릴 자리 없음·인터넷 등) **지금까지처럼 물어본다** — 조용히 넘어가지 않는다.
          const s = storeRef.current
          set덮을까({ ...r, 글: 새판알림글({ 클라우드: r, 폰: { 레시피: s.recipes.length, 일기: (s.diary || []).length } }) })
        }
      } catch { /* 조용히 — 다음에 켤 때 또 해 본다 */ }
    }
    const idle = window.requestIdleCallback
    const t = setTimeout(() => (idle ? idle(해보기, { timeout: 6000 }) : 해보기()), 3000)
    return () => { 죽었나 = true; clearTimeout(t) }
  }, [])
  useEffect(() => {
    let cancelled = false
    consumeSharedIntake().then(async (data) => {
      if (cancelled || !data) return
      const link = firstUrl(data.url, data.text)
      const caption = captionFrom(data.text)
      // 공유된 텍스트(캡션)에 레시피 내용이 있으면 파싱해 재료·순서까지 채운다.
      const parsed = caption && caption.replace(/\s/g, '').length > 15 ? parseRecipeText(caption) : null
      const source = data.imageDataUrl ? 'photo' : detectSource(link, data.text)
      const title =
        (data.title || '').trim() ||
        (parsed && parsed.title) ||
        firstLine(caption) ||
        (data.imageDataUrl ? '사진 레시피' : '공유된 레시피')
      // 📦📦 [2026-08-28 · 창업자 폰 「저장 공간이 가득 찼어요」] **저장할 사진은 «줄여서» 담는다.**
      //
      // ⛔⛔ 여기가 우리 앱에서 **사진을 «원본 그대로» 저장하던 마지막 자리**였다.
      //    사진이 들어오는 문이 열 곳인데 아홉은 이미 줄이고 있었다 —
      //    일기 `fitImage(1200)` · 표지 `fitImage(1200)` · 편집 `cropSquare(800)` ·
      //    아바타 `cropSquare(256)` · 꾸미기 `cropRatio(700)` · 자르기 시트 `2400` 제한.
      //    **공유받기만 `blobToDataUrl` 결과를 그대로 넣었다**(`shareIntake.js:17`).
      //
      // 🔢 창업자 폰 실측 = 캡처 504KB → base64 **672KB** → **미정리 6장에 4MB** →
      //    localStorage 한도(5MB)를 넘겨 **저장이 통째로 막혔다**(`store.jsx:830` 이 throw).
      //    ⭐ 「248편이나 있는데 6개에 꽉 찼다」의 답 = **사진 1장 ≈ 레시피 글 400편**.
      //
      // ⭐⭐ **OCR 은 «원본»으로 돌린다** — 아래 `ocrImage(data.imageDataUrl)` 는 안 건드렸다.
      //    글자를 읽는 정확도는 원본이 제일 좋고, 그 원본은 **메모리에만 잠깐 있다가 버려진다.**
      //    📌 줄인 걸로 읽게 만들면 용량은 줄지만 «레시피가 덜 읽힌다» — 그건 바꿔 먹을 게 아니다.
      //
      // ⛔ `fitImage` 는 **작은 사진은 안 건드린다**(`Math.min(1, max/…)`) ＋ 실패하면 **원본을 돌려준다**.
      //    그래서 이 한 줄이 사진을 «잃게» 만들 길이 없다.
      // ⚠️ 이미 담긴 사진은 안 줄어든다 — 앞으로 담는 것만이다(규칙 18 ⓙ).
      // 📦 [2026-09-02 창업자 확정] **1600 → 900px** — *"둘 다 — 작게 먼저, 이사는 다음"*
      //   🔢 실측(폰 캡처 1080×2340) = 원본 397KB · 1600px **202KB** · **900px 78KB** · 700px 52KB
      //      → 5MB 한도에 **25장 → 65장**. 창업자 폰이 «캡처 스물몇 장»으로 4.88MB 가 찼다.
      //   ⭐ 「캡쳐 보면서 쓰기」는 그대로 산다 — 900px 면 34vh 창(≈390px 폭)의 2.3배라 글자가 안 뭉갠다.
      //   ⛔ 이건 «임시 방편»이다. 정석은 사진을 IndexedDB 로 옮기는 것(창업자 확정 = 다음 판).
      const shrunk = data.imageDataUrl ? await fitImage(data.imageDataUrl, 900, 0.75) : null
      // 메모는 직접 입력 전용 — 캡션 찌꺼기를 자동으로 붙이지 않는다
      const rec = makeInboxRecipe({
        source,
        title,
        sourceUrl: link,
        image: shrunk,
      })
      if (parsed && (parsed.ingredients.length || parsed.steps.length)) {
        rec.ingredients = parsed.ingredients
        rec.steps = parsed.steps
        // 🗃🗃 **다 읽었으면 「정리 끝」이다 — 임시보관함에 가두지 않는다** (창업자 2026-09-01)
        //   📮 창업자 = *"최근저장에는 뜨는데 레시피탭에 가면 안보여."*
        //             · *"ai다 다 읽었으면 끝난거잖아. 그럼 수동으로 옮겨야해?"*
        //   ⛔⛔ 그 전엔 **AI 가 재료·순서를 다 뽑아와도** `makeInboxRecipe` 가 박은
        //      `status:'unsorted'` 를 그대로 두어 **레시피 탭에서 안 보였다**
        //      (`MyRecipesScreen.jsx` = `status === 'sorted'` 만 보여준다).
        //      그런데 홈 「최근 저장」은 status 를 «안» 가려서(`HomeScreen.jsx`) 거기엔 떴다 —
        //      **두 화면이 서로 다른 말을 해서** 「저장했는데 없다」로 읽혔다.
        //   ⭐ 잣대 = **재료·순서가 «둘 다» 2줄 이상**. 하나만 있거나 한 줄뿐이면 반쪽이라
        //      그건 여전히 임시보관함에 남는다(＝거기가 원래 그런 곳이다).
        //      ⚠️ 이 숫자는 «내 판단»이다 — 창업자에게 밝혔다.
        //   📏 [2026-09-02] 잣대를 `store.js` 의 `다읽었나()` **한 곳**으로 옮겼다 —
        //      같은 판정을 여기 ＋ 마이그레이션 ＋ 아래 `채우기()` **셋**이 쓰기 때문이다.
        if (다읽었나(parsed)) rec.status = 'sorted'
        // 📥 파서에 넣은 원문도 같이 — 파서를 고친 날 다시 읽을 재료(→ parseRecipe.js `keepRaw`)
        const raw = keepRaw(caption)
        if (raw) rec.rawText = raw
      }
      store.addRecipe(rec)
      // ⛔ 정리가 끝난 것을 임시보관함으로 보내면 «거기 없다» — 그 화면은 미정리만 보여준다.
      //    그래서 정리된 것은 «그 레시피»를 바로 연다(방금 담은 걸 눈으로 확인하게).
      setStack([rec.status === 'sorted' ? { name: 'detail', id: rec.id } : { name: 'inbox' }])
      // inbox 레이어에 해당하는 히스토리 칸(트랩)을 보충 — 없으면 뒤로가기가 base 트랩을 대신
      // 소비해 다음 back 이 앱 종료로 샜다. (공유로 앱을 처음 열었을 때 경로)
      try { history.pushState({ hankki: 1 }, '') } catch { /* noop */ }
      // 📄 [2026-08-28] «몇 장»을 받았는지 말한다 — 두 장짜리 레시피가 반쪽만 담기던 걸 고치며 넣었다.
      //    ⭐ 유저 안내이자 «진단»이다 — 안드로이드가 몇 장을 보내는지 이 문구가 그 자리에서 알려준다.
      const 장수 = (data.imageDataUrls && data.imageDataUrls.length) || (data.imageDataUrl ? 1 : 0)
      showToast(
        장수 > 1
          ? `사진 ${장수}장을 담았어요 · 글자 읽는 중…`
          : 장수 === 1
            ? '사진을 담았어요 · 글자 읽는 중…'
            : '공유한 레시피를 임시보관함에 담았어요'
      )
      if (typeof history !== 'undefined' && location.search) {
        history.replaceState({ hankki: 1 }, '', location.pathname) // URL 만 정리, 트랩 표식은 유지
      }
      // 공유된 사진이면 글자를 읽어 재료·순서를 자동으로 채운다.
      // ⛔⛔ **여기는 `shrunk` 가 아니라 «원본»이다. 바꾸지 말 것.**
      //    저장은 줄여서 하고(위 `shrunk`) **읽기는 원본으로** 한다 — 글자 크기가 곧 인식률이다.
      //    원본은 이 줄이 끝나면 아무 데도 안 남는다(메모리에만 있었다).
      if (data.imageDataUrl) {
        // 📄📄 [2026-08-28] **여러 장을 «순서대로» 읽어 «이어붙인다».**
        //   📮 창업자 실물 = 두 장짜리 레시피를 한 번에 공유했는데 둘째 장만 담겼다.
        //   ⭐ 이어붙이는 방식은 «이미 있던 것»을 그대로 쓴다 — 레시피 편집 화면의 캡처 단추가
        //      `EditorScreen.jsx` 에서 여러 장을 `lines.join('\n')` 으로 잇는다. 같은 규칙이라야
        //      「공유로 담은 것」과 「앱에서 고른 것」이 같은 결과를 낸다.
        //   ⛔ 한 장이 안 읽혀도 나머지는 살린다 — 통째로 버리면 유저는 「고장」으로 읽는다.
        //   💰 열쇠는 장수만큼 쓴다(`ocrImage` 를 장수만큼 부른다) — 편집 화면과 같다.
        const 장들 = (data.imageDataUrls && data.imageDataUrls.length ? data.imageDataUrls : [data.imageDataUrl])
        const 읽은글 = []
        for (const 장 of 장들) {
          const t = await ocrImage(장)
          if (cancelled) return
          if (t && t.trim()) 읽은글.push(t.trim())
        }
        const text = 읽은글.join('\n')
        if (cancelled || !text.trim()) return
        // 🤖🤖 [2026-08-29] **AI 다듬기 — ⭐여기가 창업자가 실제로 쓰는 문이다.**
        //   ⛔⛔ 8/29 아침에 AI 를 `EditorScreen`(편집 화면 캡처 단추) «한 곳»에만 붙여서
        //      「가져오기 → 사진」·공유받기로 담은 것은 **워커를 한 번도 안 불렀다**
        //      (Cloudflare Invocations 0 · 창업자 대시보드 실측). 그날 재현판 16칸은 전부 초록불이었다.
        //   📌 `ocrImage()` 를 부르는 곳은 셋 — 편집 캡처 · **여기** · 냉장고 영수증.
        //      레시피인 앞의 둘에만 붙인다(영수증은 재료 목록이라 AI 지시가 안 맞는다).
        //   ⭐ 규칙 파서를 «먼저» 돌려놓는다 — AI 가 안 되든 느리든 이 `기본` 이 그대로 쓰인다.
        const 기본 = parseRecipeText(text, { fromOcr: true })

        // ⏱⏱⏱ **[2026-08-29 오후 · 창업자 갈래 ⓒ] 「AI 를 기다리지 않는다」**
        //   📮 창업자 폰 실측 13:44 = `기본 정리예요(timeout)` — **30초를 세워두고 아무것도 못 줬다.**
        //   ⛔⛔ 뿌리는 숫자가 아니라 **차례**였다. `await tidyRecipe()` 가 앞을 막고 있어서
        //      **이미 손에 쥔 규칙 파서 결과를 AI 가 끝날 때까지 화면에 안 내놨다.**
        //      12초든 30초든 60초든 «기다리는 구조»인 한 유저는 늘 그만큼 빈 화면을 본다.
        //   ⭐⭐ 그래서 두 판으로 나눈다 — **①규칙 파서로 «즉시» 채우고 ②AI 가 오면 조용히 갈아끼운다.**
        //      · 유저가 기다리는 시간 = **0초**  · AI 가 죽어도 잃는 게 없다(①이 이미 화면에 있다)
        //      · 그래서 `tidy.js` 의 기다림을 60초까지 «늘릴 수 있게» 됐다(아무도 안 기다리니까)
        //   ⛔ `await` 를 되살리지 말 것 — 되살리는 순간 위 사고가 그대로 돌아온다.
        //      🔒 `scripts/_repro-AI다듬기-0829.mjs` 가 이 자리를 잰다.

        // 🧷 지금 화면에 들어가 있는 값 — 두 판이 같은 자리를 만지므로 «내가 뭘 넣었는지»를 들고 간다.
        //   ⛔ `rec` 는 담을 때의 «옛 값»이라 두 번째 판에서 그대로 쓰면 첫 판이 넣은 것을 모른다.
        const 현재 = { title: rec.title, icon: rec.icon, iconPicked: rec.iconPicked }

        // 🏷🏷 [2026-09-01 · 창업자 실물] **AI 제목이 «버려지고» 있었다.**
        //   📮 창업자 폰 = 사진까지 읽은 판(gemma4 · 📷실음 768k)이 돌았는데 제목은 「결로은요」 그대로.
        //   ⛔⛔ 뿌리 = 아래 `현재.title = 새제목`(두 판이 상태를 주고받는 줄).
        //      ①규칙 파서가 「결로은요」를 넣으면서 `현재.title` 이 그 값으로 «굳고»,
        //      ②AI 판이 올 때 「사진 레시피가 아니네」로 읽혀 **AI 제목을 아예 안 본다.**
        //      → ⓒ 는 제대로 일했는데 그 답이 화면에 못 왔다. 재료·걸음만 갈아끼워졌다.
        //   ✅ 그래서 «담을 때 정해진 제목»을 따로 붙잡아 둔다 —
        //      · 유저가 공유하며 «준» 제목(캡션 첫 줄·공유 제목) = 지킨다 ⛔우리가 안 덮는다
        //      · 우리가 «몰라서» 붙인 자리표(`사진 레시피`) = ①이 채우고 ②가 덮어도 된다
        //   ⭐ 잣대를 «자동인가»로 한 번만 정하고 안 흔든다 — 이게 어제 사고의 모양이었다.
        const 처음제목 = String(rec.title || '')
        // 🏷 [2026-09-03] 자리표 판정을 «파서 한 곳»에서 가져온다 — 「제목없음」이 새 자리표로 들어왔다.
        //    ⛔ 여기에 문자열을 박아 두면 자리표가 늘 때 이 줄만 낡는다(그러면 그 제목이 영영 안 고쳐진다).
        const 자동제목인가 = 자리표제목(처음제목)

        // 채우는 일은 «한 곳»에 — 규칙 파서 판과 AI 판이 갈리면 결과가 두 가지가 된다.
        const 채우기 = (r) => {
          const 새제목 = 자동제목인가 ? (r.title || 현재.title) : 처음제목
          // 🍱🍱 [2026-08-28 · 창업자 제보] **이름이 여기서 처음 정해지니, 아이콘도 여기서 다시 찾는다.**
          //   📮 창업자 = *"sns나 갤러리는 자동으로 안붙어. 이거 자동으로 붙게할 수있어?"*
          //   ⭐ 뿌리 = `makeInboxRecipe` 가 «글자를 읽기 전»에 `icon` 을 굳혀서, 나중에 제목이
          //      「골쫄면」이 돼도 아이콘은 빈 접시(`default`) 그대로였다. 화면은 `icon` 이 있으면
          //      자동찾기를 안 돌리므로(Thumb.jsx) 영영 안 바뀐다.
          //   ⛔ 창업자가 «직접 고른» 아이콘은 안 덮는다 — 판정과 두 겹 막이는 `shareIcon.js` 에 있다.
          const 새아이콘 = 공유아이콘(현재, 새제목, guessFoodIconStrict)
          store.updateRecipe(rec.id, {
            title: 새제목,
            ingredients: r.ingredients,
            steps: r.steps, // 메모는 건드리지 않는다 — 직접 입력 전용
            category: guessCategory((r.title || '') + ' ' + r.memo),
            // ⭐ 자동으로 추천한 것이니 `iconPicked: false` 로 «자동» 표를 남긴다 —
            //    EditorScreen 이 쓰는 규칙과 «같은 말»이라야 한쪽만 낡지 않는다(v9.77 · check-thumb.mjs).
            ...(새아이콘 ? { icon: 새아이콘, iconPicked: false } : {}),
            // 📥 원문도 — 있을 때만 넣는다(빈 값으로 덮으면 지우는 것이다)
            ...(keepRaw(text) ? { rawText: keepRaw(text) } : {}),
            // 🗃🗃 [2026-09-02 · 창업자 제보] **다 채웠으면 임시보관함에서 «졸업»시킨다.**
            //   📮 창업자 = *"최근저장에는 뜨는데 레시피탭에 가면 안보여."*
            //   ⛔⛔ 뿌리 = 이 함수가 제목·재료·순서·아이콘은 다 갱신하면서 **`status` 만 안 건드렸다.**
            //      담을 때(위 `if (다읽었나(parsed))`)는 졸업시키는데, **AI 가 «나중에» 채운 건 갇혔다.**
            //      화면은 `status === 'sorted'` 만 그리므로(`MyRecipesScreen`) 영영 안 보인다.
            //      🔢 창업자 폰의 **항정살조림**이 그 상태였다(이미 갇힌 것은 `INBOX_V` 2 가 꺼낸다).
            //   ⛔ **올리기만 한다 — 절대 내리지 않는다.** 이 함수는 규칙 파서 판·AI 판으로
            //      **두 번** 불린다. 둘째 판이 첫째의 졸업을 깎으면 레시피가 도로 사라진다.
            //   ⭐ 잣대는 `store.js` 의 `다읽었나()` 하나 — 담을 때와 «같은 말»이라야 안 갈린다.
            ...(다읽었나(r) ? { status: 'sorted' } : {}),
          })
          현재.title = 새제목
          if (새아이콘) { 현재.icon = 새아이콘; 현재.iconPicked = false }
          return 새제목
        }

        // ① 규칙 파서 — «즉시»
        채우기(기본)
        // 💰💰 [2026-08-21] 여기도 «조용히 깎이던» 자리다 — 공유로 들어온 사진도 위 353줄에서 AI 스캔을 쓴다.
        //    ⛔⛔ 그런데 유저는 «가져오기를 누른 적이 없다» — 카톡에서 공유만 했는데 장수가 준다.
        //       세 자리(캡처·영수증·공유받기) 중 **여기가 제일 안 보이는 자리**다.
        //    ⭐ 그래서 잔량을 «그 자리에서» 알린다. 미리 못 막는 대신 «썼다는 사실»은 알아야 한다.
        //    ⛔ `unknown` 이면 숫자를 안 적는다 — 서버가 아직 답한 적이 없다는 뜻이라
        //       그때 숫자를 적으면 «안 써 봤을 때의 기본값 20»을 사실처럼 말하게 된다(규칙 15).
        const left = getOcrLeft()
        // 📢📢 ⭐**여기가 «첫인상»이다** — 인스타 공유가 「제일 많이 써요」 길이다.
        //   「AI 가 더 다듬는 중」을 **같은 줄에** 붙인다(문구는 `tidy.js` 한 곳).
        //   ⛔ 따로 띄우면 이 안내(열쇠 잔량)를 즉시 덮어 «정보를 잃는다».
        //   ⏱ 20초 — 다 되면 아래 결과 토스트가 덮고, 실패하면 조용히 사라진다.
        showToast(
          // 🔓 [2026-09-02] 운영자에겐 숫자를 안 붙인다 — 서버가 «실제로 쓴 만큼» 깎인 0 을 주는데
          //    한도는 안 걸리므로 「0개 남았어요」가 거짓말이 된다(창업자 폰 실물).
          //    잣대는 `getOcrLeft().무제한` 하나 — 설정 알약·임시보관함도 같은 것을 본다.
          (left.unknown || left.무제한
            ? '사진에서 글자를 읽어 채웠어요'
            : `사진에서 글자를 읽어 채웠어요 · 무료 ${KEY_NAME} ${left.total}${KEY_UNIT} 남았어요`)
            + AI다듬는중,
          20000,
        )

        // ② AI — «뒤에서». 오면 갈아끼우고, 안 오면 아무 일도 안 난다.
        //   👁 [창업자 판정 2026-09-01 = ⓒ] 글자와 «함께 사진»을 준다.
        //   ⭐⭐ **여기가 창업자가 1순위로 꼽은 길이다** — ImportScreen 「제일 많이 써요」 = SNS 공유.
        //      그러니 ⓒ 를 여기에 안 붙이면 «제일 많이 쓰는 길»만 옛 정확도로 남는다.
        //   ⛔ 첫 장만 준다 — 여러 장이면 뉴런이 장 수만큼 나간다(실측 82.5/장).
        // 💀💀 **[2026-09-04 · 창업자 영상 두 편] 시작 «전»에 「아직 못 다듬음」을 남긴다.**
        //   📮 창업자 = *"뒤로가기해서 홈으로 가려고 하면 «앱을 열지 못했어요» 하면서 앱이 꺼져"*
        //   🔢 실측 = 다른 앱을 켜둔 채면 안드로이드가 앱을 «정리»한다(1차 영상). 다 닫으면 멀쩡(2차 영상).
        //      ⭐ 즉 **폰 탓이 아니라 어느 폰에서든 난다** — 앱을 많이 켜두는 유저면 똑같이 겪는다.
        //   ⛔⛔ 그때 잃는 건 레시피가 아니라 **AI 다듬기**다(레시피는 이미 폰에 저장돼 있다).
        //      그런데 **열쇠는 이미 나갔다** — 창업자 확정(2026-08-29) *"열쇠는 무조건 둘다 잘되어야해 돈이니까"*.
        //      ＝ 돈은 내고 값의 절반만 받는 모양이었다.
        //   ✅ 그래서 **표시를 «시작할 때» 남긴다.** 앱이 정리돼도 표시는 폰에 남아,
        //      그 레시피를 열면 `RecipeDetailScreen` 이 **저절로 만회**한다(이미 있는 길 · 열쇠 0).
        //   ⭐ 새 장치를 안 만들었다 — 실패의 «모양»만 바꿨다(절대원칙 34):
        //      「날아감」 → 「다음에 열면 저절로 채워짐」.
        //   🧪 판 = `_repro-앱이정리됨-0904.mjs`
        store.updateRecipe(rec.id, { tidyFail: 1 })
        tidyRecipe(text, 장들[0]).then((ai) => {
          if (cancelled) return
          if (ai) {
            채우기(mergeTidy(기본, ai))
            // ✅ 다 됐으니 「아직 못 다듬음」 표시를 «지운다» — 안 지우면 다음에 열 때 또 다듬는다(뉴런 낭비).
            store.updateRecipe(rec.id, { tidyFail: 0 })
            showToast('AI가 레시피를 더 다듬었어요' + tidyTail())
            return
          }
          // ⛔ 실패는 «유저에게 안 알린다» — 이미 채워져 있어 유저가 할 일이 0이다.
          //    알리면 멀쩡한 결과를 두고 「고장났나」로 읽게 만든다.
          //    ⭐ 창업자(운영자)만 이유를 본다 — 이 한 줄이 8/29 아침에 30분을 5초로 줄였다.
          // 🔁🔁 **[2026-09-02 · 창업자 「불안정하다」] 실패를 «기억»해 둔다 — 나중에 만회한다.**
          //   📮 창업자 = *"불안정하다.. ai가 읽을때가 있고 못읽을때가 있고.. 열쇠는 차감안된거지?"*
          //   ⭐⭐ 창업자가 열쇠를 물은 게 핵심이다 — **OCR 몫 열쇠는 이미 나갔다.**
          //      그러니 「이번엔 안 됐다」로 끝내면 **돈은 내고 값의 절반만 받는다**
          //      (창업자 확정 2026-08-29 = *"열쇠는 무조건 둘다 잘되어야해 돈이니까"*).
          //   ⛔ 지금 다시 걸지 않는다 — 방금 실패한 조건 그대로라 또 실패할 확률이 높고,
          //      그러면 무료 통만 두 배로 먹는다. **표만 남기고 «다음에» 만회한다.**
          //   📌 표를 지우는 것도 여기서 안 한다 — 만회한 쪽(상세 화면)이 지운다.
          store.updateRecipe(rec.id, { tidyFail: 1 })
          if (tidyFounder()) showToast('AI 다듬기는 못 했어요' + tidyTail())
        })
        return
      }

      // ⏳⏳ 서버 되면 되살릴 것 ④ — 공유로 들어온 링크의 «본문 자동 읽기»
      //
      // 📮 창업자 확정 2026-08-27 = *"1번으로 하자"* (갈래 셋 중 「그 기능을 끈다」)
      //
      // ⛔⛔ 왜 껐나 = 유저가 공유한 «주소»가 우리와 계약이 «0»인 회사 셋으로 나가고 있었다 —
      //    `r.jina.ai` · `api.allorigins.win` · `noembed.com`
      //    구글 공식 = *"'공유'란 앱에서 수집한 사용자 데이터를 «서드 파티에 전송»하는 것"* ＋
      //    «서버 간» 전송도 공유에 포함. → Play 데이터 보안에 「공유됨」을 켜야 할 수 있었다.
      //    ⛔ 우리가 2026-08-05 에 붙였던 「WebView 예외」는 «여기 안 맞는다» — 유저가 웹을 탐색하는 게
      //       아니라 «앱 코드가 URL 을 골라 외부 API 로 보내는» 것이다(AI 둘이 같은 결론).
      //
      // ⭐⭐ 그런데 «잃는 게 거의 없다» — 우리 문서 실측이 이미 그렇게 적어뒀다:
      //    *"창업자 폰에서 «거의 언제나 실패»했다"* (`docs/링크읽기-서버되면-2026-08-21.md`)
      //    ＋ 유튜브·인스타는 바로 아랫줄에서 «원래부터» 시도조차 안 했다.
      //
      // ✅ 그대로 사는 것 = 링크 저장 · 캡션(공유 문구) 파싱 · 사진 OCR — 하나도 안 건드렸다.
      // ⭐ 덤 = 최대 25초 기다리던 것이 사라져 «공유받기가 빨라진다».
      //
      // 🔖 되살릴 때 = `src/linkReader.js` 는 «안 지웠다». 우리 Worker 에 본문 읽기 길을 내고
      //    아래 세 줄을 되돌리면 된다(⏳①②③ 은 `ImportScreen.jsx` 에 있다):
      //      const read = await Promise.race([ fetchLinkRecipe(link).catch(() => null), 25초 ])
      //      read.title → patch.title · read.full && read.text → parseRecipeText → 재료·순서
      //      ＋ 맨 위 `import { fetchLinkRecipe } from './linkReader'`
      //
      // ⛔ 문구도 같이 고쳤다 — 옛 실패 문구(「내용은 자동으로 읽지 못했어요」)는 이제 «항상» 뜬다.
      //    안 하기로 한 일을 매번 사과하면 「고장」으로 읽힌다. 「담았어요」까지만 말한다.
      //    📌 v11.19 「링크 주소만 담아두기」와 같은 말이 된다 — 가져오기 화면과 말이 맞는다.
      if (!link) return
      showToast('링크를 담았어요')
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 🧹🧹 [창업자 확정 2026-08-28 = ②] **이미 담긴 «큰» 사진도 «한 번» 줄인다.**
  //
  // 📮 창업자 폰이 지금 「저장 공간이 가득 찼어요」로 **저장이 막혀 있다**(미정리 6장 = 4MB).
  //    ⛔ v11.64 의 고침은 «앞으로 담는 것»만 줄인다 — **이미 담긴 6장은 그대로**다(규칙 18 ⓙ).
  //       그래서 이 한 번이 필요하다. 이게 돌면 창업자 폰에서 **약 4MB 가 그 자리에서 빈다.**
  //
  // ⛔⛔ **창업자 걱정 = *"2번을 하면 앱에서 사진이 뿌옇게 보이는거 아냐?"* — 실측으로 답이 나왔다.**
  //    🔢 이미 1200px 로 줄여 담긴 일기 사진을 «또» 구우면 —
  //       크기 554×1200 그대로 · 용량 **95KB → 95KB(안 준다)** · 화질만 RMSE 0.36 깎인다.
  //       **얻는 게 0이고 잃기만 한다.**
  //    ✅ 그래서 **큰 것만 고른다.** 문턱을 넘는 것만 건드리니 «뿌예질 일이 구조적으로 없다».
  //
  // ⭐ 문턱을 «dataURL 글자 수»로 먼저 거른다 — 문자열 길이는 즉시 알 수 있어 248편을 훑어도 순식간이다.
  //    ⛔ 사진을 다 열어 픽셀을 재면 느리고 배터리를 먹는다. 열어보는 건 «걸린 것»만.
  //    🔢 자릿값 근거(실물 캡처 실측) — 원본 1172KB / 줄인 것 197KB / 일기 127KB / 편집 표지 150KB
  //       → 260,000자(≈254KB)면 **원본만** 걸리고 나머지는 다 빠져나간다.
  // ⛔⛔ [2026-09-02] **260,000 → 100,000 으로 내렸다** — 그 값은 «1600px 판»을 통과시켰다.
  //    창업자 폰 4.88MB 의 정체가 바로 그 통과한 것들이다(1600px ≈ 202KB ≈ 207,000자).
  //    ⭐ 900px 결과는 ≈78KB(≈80,000자)라 문턱 아래 → **다시 굽지 않는다**(게이트가 그걸 잰다).
  //    ⚠️ 대신 일기·표지 사진(≈127~150KB)도 걸려 900px 로 줄어든다.
  //       표지는 화면에서 374px 로 그려지니 900px 은 2.4배 — 눈으로는 차이가 안 난다.
  const SHRINK_OVER = 100000
  useEffect(() => {
    let cancelled = false
    // ⛔ 첫 화면이 다 그려진 뒤에 시작한다 — 앱을 여는 순간 캔버스를 돌리면 «느린 앱»이 된다.
    const t = setTimeout(async () => {
      // 🎴🎴 **자랑카드 표지는 «건드리지 않는다»** (2026-09-02 · 전수 조사로 찾음)
      //   ⛔⛔ 이 루프가 카드까지 900px 로 다시 구우면 **두 가지가 동시에 망가진다** —
      //      ⑴ 카드가 뭉개진다(카드는 «판 전체가 그림»이라 사진과 다르다)
      //      ⑵ ⭐**옛 카드는 «카드인 줄 모르게 된다»** — 8/18 «전»에 저장한 표지엔 `imageFit:'whole'`
      //         표시가 없어서 **세로 1600px 로만** 알아본다(`cardCover.js` ②). 900 으로 줄이면 그 잣대를 못 넘어
      //         **⒜ 표지가 동그랗게 그려지고**(창업자 2026-08-18 *"자랑카드전체가 표지여야하는데 동그랗게됐다고"*)
      //         **⒝ 클라우드가 사진으로 알고 털어버린다**(창업자 2026-08-31 *"레꾸자랑에서 뽑은카드로 레꾸한거는 사라졌어."*)
      //      즉 이 줄이 없으면 **이미 고친 사고 둘이 되살아난다.**
      //   ⭐ 잣대는 `cardCover.js` 의 `카드표지인가()` 하나 — 화면·클라우드와 «같은 값»을 쓴다.
      //
      // 🕳🕳 **`store` 가 아니라 `storeRef.current` 를 읽는다** (2026-09-02 · 사진 창고 이사와 한 몸)
      //   ⛔⛔ 이 `useEffect` 는 `[]` 라 **첫 렌더 클로저**를 평생 들고 있다. 그런데 사진이
      //      창고(IndexedDB)로 옮겨간 뒤로 첫 렌더의 `r.image` 는 **쪽지**(`idb://…`)일 수 있다.
      //      쪽지는 서른 글자쯤이라 문턱(100,000)을 절대 못 넘는다 →
      //      **`큰것.length === 0` → 곧바로 return → 공간 회수 장치가 «조용히 죽는다».**
      //   ⭐ `storeRef` 는 렌더마다 갱신되니(377줄) 2.5초 뒤엔 «지금 값»을 본다.
      //      저장(`updateRecipe`)도 같은 곳에서 꺼낸다 — 옛 클로저에 쓰면 낡은 판 위에 덮어쓴다.
      const 지금store = storeRef.current
      const 큰것 = 지금store.recipes.filter(
        (r) => typeof r.image === 'string' && r.image.length > SHRINK_OVER && !카드표지인가(r)
      )
      if (!큰것.length) return // ⭐ 없으면 아무 일도 안 한다 → 다음 실행부터 비용 0
      let 줄인수 = 0
      let 아낀양 = 0
      for (const r of 큰것) {
        if (cancelled) return
        // 📐📐 **「치수」로 거른다 — 글자 수로만 보면 «화질만 깎는» 짓을 한다** (2026-09-02)
        //   ⛔ 문턱을 내리니 스모크가 잡았다 = 「작은 사진은 한 글자도 안 바뀌었다」가 죽었다.
        //      360×640 사진은 900px 안에 이미 들어가는데, 다시 구우면 **크기만 줄고 화질이 깎인다.**
        //   ⭐ 그러니 **긴 변이 900 을 넘을 때만** 손댄다. 치수가 작으면 «건드리지 않는다».
        const 치수 = await imageSize(r.image)
        if (cancelled) return
        if (!치수 || Math.max(치수.w, 치수.h) <= 900) continue
        const 작게 = await fitImage(r.image, 900, 0.75)
        // ⛔ **진짜로 작아진 것만 저장한다.** `fitImage` 는 실패하면 원본을 그대로 돌려주는데,
        //    그걸 그냥 덮으면 «아무것도 안 하고 저장만» 하게 된다(무의미한 쓰기 = 용량이 또 찬다).
        if (cancelled || !작게 || 작게.length >= r.image.length) continue
        아낀양 += r.image.length - 작게.length
        줄인수++
        지금store.updateRecipe(r.id, { image: 작게 })
        // ⛔ 한 장씩 넘기며 숨을 쉰다 — 6장을 한 번에 구우면 화면이 얼어붙는다
        await new Promise((res) => setTimeout(res, 60))
      }
      if (cancelled || !줄인수) return
      showToast(`사진 ${줄인수}장을 정리해 ${Math.round(아낀양 / 1024 / 1024 * 10) / 10}MB 를 비웠어요`, 5000)
    }, 2500)
    return () => { cancelled = true; clearTimeout(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showOnboarding = useCallback(() => setOnboard(true), [])
  // 🙏 레시피를 «저장에 성공한» 화면이 부른다 — 판정·띄우기는 위 effect 가 한다(최신 값으로).
  const askReviewSoon = useCallback((까닭 = '레시피') => set리뷰신호((v) => ({ 씨: (v ? v.씨 : 0) + 1, 까닭 })), [])
  const nav = { push, replace, pop, popAll, go, showToast, tab, setTab, registerBack, openModal, showOnboarding, askReviewSoon }

  const TabScreen = TABS[tab]
  const top = stack[stack.length - 1]

  return (
    <NavCtx.Provider value={nav}>
      <div className={'app-frame' + (toast ? ' toast-on' : '')}>
        {/* 📢📢 **안내 띠 — 「떠 있는 상자」가 아니라 «비워둔 자리»다** (창업자 확정 2026-08-31)
            🐛 제보 = *"레시피를 너무가리고 박스크기도 크고 길게 떠있어"* → 자리를 옮겨봐도
               `position: fixed` 인 이상 **무엇을 덮든 상관하지 않는다**. 그래서 흐름 안으로 들여왔다.
            ⛔ 상단바에 «붙일» 수도 없었다 — `.topbar-back` 은 `.screen`(스크롤 통) 안이라
               목록과 같이 밀려 올라간다. 붙여두면 스크롤한 순간 상자만 허공에 남는다.
            ⭐ `.app-frame` 이 이미 세로 flex 라 여기 칸을 하나 두면 화면이 그만큼 «내려간다» —
               겹침이 «구조적으로» 0 이 된다. 창업자 말 *"상자를 고정해놓고 거기 띄운다"* 가 이것이다.
            ⛔ 화면 파일은 하나도 안 건드렸다. 이 한 칸이 전 화면에 같이 듣는다. */}
        <div className="toast-slot" aria-live="polite">
          <div className="toast-clip">
            <div className="toast">{toast || 지난토스트.current}</div>
          </div>
        </div>

        {/* ⛔⛔ **이 `.frame-body` 를 지우지 말 것 — 띠를 넣자마자 난 실물 버그의 해결책이다.**
            🐛 2026-08-31 첫 판: 띠는 잘 떴는데 **임시보관함 상단바(뒤로·제목)가 통째로 사라졌다.**
               `StackLayer`(아래)는 `absolute; inset:0` 인데 그 기준이 `.app-frame` 이라
               **띠를 «따라 내려오지 않고» 띠 밑에 깔렸다.** 띠는 z-index 3500 이라 제목을 덮었다.
            🔢 그때 잰 값은 「가린 초안 0줄」로 **통과**였다 — 목록은 정말 안 가렸으니까.
               ⭐ 숫자는 통과인데 화면은 망가진 것이다. 절대원칙 21(뽑아서 «열어본다»)이 잡았다.
            ⭐ 그래서 담는 칸을 하나 둔다 — 여기가 `position: relative` 라
               쌓인 화면의 `inset:0` 이 **띠 «아래»부터** 시작한다. */}
        <div className="frame-body">
        <div key={tab} className="screen fade">
          <TabScreen />
        </div>

        {stack.map((s, i) => (
          <StackLayer key={i}>{renderScreen(s)}</StackLayer>
        ))}

        {/* ⚠️ 하단바·토스트 «앞»에 둔다 — 셋 다 fixed 라 뒤엣것이 위에 온다.
            막대가 하단바를 뚫고 나오면 안 된다. */}
        <ScrollHint dep={`${tab}:${stack.length}`} />
        <ToTop dep={`${tab}:${stack.length}`} hasNav={!top} />

        {/* 👉👈 하단 탭을 «좌우로 밀어» 넘긴다 (창업자 2026-08-15). 쌓인 화면·모달·온보딩에선 꺼진다. */}
        {/* ⛔  는 여기 «없는» 변수다(121줄 콜백 안의 지역변수). ref 를 직접 본다.
            📌 빌드는 통과하고 «화면에서만» 죽는다 — 2026-08-15 에 쓰자마자 잡았다. */}
        <TabSwipe tab={tab} go={go} enabled={!top && modalLayers.current.length === 0 && !onboard} />
        {!top && <BottomNav active={tab} onChange={go} onImport={() => push({ name: 'import' })} />}
        <TimerBar bottom={top ? 'calc(84px + var(--safe-bottom))' : 'calc(66px + var(--safe-bottom))'} />
        {/* 📢 안내 띠는 **맨 위 칸**으로 옮겼다(2026-08-31) — 여기 `fixed` 로 두면 목록을 덮는다. */}
        </div>

        {/* 🔁 「이미 다른 기기에서 쓰고 있었어요」 = 설정으로 보내며 «백업 시트를 열라는 쪽지»를 남긴다.
            (`go(tab)` 은 인자를 못 받아서 `nudges.js` 의 쪽지로 넘긴다 — 홈 백업 유도 줄과 같은 길) */}
        {/* ☁️ 클라우드 첫 화면 — 소개보다 «앞»에 선다.
            📮 창업자 2026-08-21 = *"새유저는 그냥 첫화면에 로그인하고시작 «왜냐면 온보드는 그냥 건너뛰기할수도있어»"*
            ⛔ 소개 «마지막 장»에 두려던 내 안을 창업자가 잡았다 — 「건너뛰기」가 매 장 오른쪽 위에 있어 첫 장에서 통째로 넘어간다. */}
        {cloudGate && <CloudGate onDone={() => setCloudGate(false)} />}

        {/* 🙏 한마디 청하기 — 레시피를 저장한 직후(내 레시피 2개부터 · 30일에 한 번).
            ⛔ 자리는 «여기»라야 한다 — 편집 화면은 저장에 성공하면 popAll 로 스스로 사라진다. */}
        {리뷰청하기 && <ReviewAskSheet title={리뷰청하기} onClose={() => set리뷰청하기(null)} />}

        {/* ☁️⚖️ 다른 기기가 먼저 올렸다 — ⛔자동으로 합치지 않는다. **고르는 화면으로 데려간다**(창업자 확정).
            📮 창업자 2026-08-21 = *"나도 폰 패드 같이쓰거든."* ← 이게 바로 그 자리다.
            ⛔ 여기서 「덮기」 단추를 주지 않는다 — 두 판을 «나란히 보지 않고» 고르면 그건 고른 게 아니다.
               설정의 클라우드 화면이 두 판(📱 이 폰 / ☁️ 클라우드)을 보여주고 거기서 고른다.
            ⭐ 「나중에」로 닫으면 이번엔 안 올린다. 다음에 켜면 또 물어본다
               — 잊고 지나가면 데이터가 갈린 채로 굳는다. */}
        {덮을까 && (
          <ConfirmSheet
            title="클라우드에 새 판이 있어요"
            message={덮을까.글}
            confirmLabel="고르러 가기"
            onConfirm={() => { set덮을까(null); askOpenCloud(); go('profile') }}
            onClose={() => set덮을까(null)}
          />
        )}

        {onboard && (
          <Onboarding
            onDone={() => setOnboard(false)}
            onRestore={() => { setOnboard(false); askOpenBackup(); go('profile') }}
          />
        )}
      </div>
    </NavCtx.Provider>
  )
}

// 📜📜 ScrollHint — 세로로 «넘치는 화면»에 얇은 막대를 **우리가 그려서** 항상 보여준다.
//   (창업자 2026-08-09 밤 — 세 번 말했다:
//    *"스크롤이 되는데 우리는 되는지 알지만 보통은 모르니까"* ·
//    *"지금 우리 일꾸나 레꾸 앱 전반적으로 스크롤이 표시가 안되어있지 않아??"* ·
//    *"자리가 부족하니까 얇게라도 표시해줘야 할 것 같아"*
//    폴드 테스터가 달력 밑 「오늘 일기 쓰기」를 못 찾고 **먹통인 줄 알았다**)
//   ⛔ CSS 로는 안 된다 — `.screen::-webkit-scrollbar { width: 0 }` 로 꺼둔 것도 있지만,
//      켜도 **안드로이드 크롬은 오버레이 막대**라 «긁는 동안만» 뜬다. 멈추면 사라져서
//      「여기서 끝」으로 읽힌다. `scrollbar-width: thin` 도 모바일에선 상시 표시가 안 된다.
//   ⭐ 그래서 v9.99 의 `HStrip`(가로)과 «같은 문법»으로 세로를 그린다 — 새 발명이 아니다.
//   ⭐ **왜 화면마다 안 붙이고 여기 하나인가** = `.screen` 이 열 곳에 흩어져 있다(탭 5 + 쌓이는 화면들).
//      한 곳만 붙이면 다음 화면에서 또 없다 → **맨 위 `.screen` 을 찾아** 한 막대가 따라다닌다.
//   ⭐ 안 넘치면 아예 안 그린다 — 짧은 화면엔 아무 티도 안 난다.
//   ⚠️ 꾸미기 판은 Portal 이라 `.app-frame` 밖 → 여기 안 걸린다(서랍 막대는 `DecorEditor` 가 따로 그린다).
//   ⚠️ 표식 `data-vhint` = 재현 검사가 «실제로 그려졌나»를 집는 자리.
function ScrollHint({ dep }) {
  // 📜📜 [2026-08-14 테스터] *"화면에서 스크롤 할때 회색 막대기? 같은게 «살짝 부자연스럽게 따라와여»"*
  //   🔢 실측(`scripts/_repro-막대따라옴-0814.mjs`) — 굴린 «순간» 막대가 **63~110px 어긋나** 있었고
  //      **1프레임 뒤에도 그대로**, **2프레임 뒤에야** 0 이 됐다. 늦는 게 «느낌»이 아니라 사실이었다.
  //   ⛔ 지연이 두 겹이었다 —
  //      ⑴ `scroll` → `requestAnimationFrame(measure)` = 한 프레임
  //      ⑵ `measure()` → `setState` → React 리렌더/커밋 = 또 한 프레임
  //      게다가 `top`/`left` 를 바꾸니 그때마다 **레이아웃＋페인트**가 다시 돌았다.
  //      그동안 화면 자체는 브라우저가 컴포지터에서 «즉시» 굴린다 → 막대만 뒤처진다.
  //   ✅ 그래서 «무거운 것»과 «가벼운 것»을 갈랐다:
  //      · `measure()` = 무엇을 그릴까(어느 화면·가로 줄 몇 개) — 여전히 rAF·MutationObserver 로 «가끔»
  //      · `paint()`   = 어디에 그릴까(scrollTop → 자리) — **스크롤마다 즉시 · DOM 에 직접 · transform**
  //      state 는 **개수만** 들고 있는다. 자리를 state 로 옮기면 리렌더 한 겹이 다시 끼어든다.
  //   ⛔ 막대를 없애지 않는다 — 창업자 2026-08-08 *"스크롤바가 처음부터 안보여서 글자체 저게다처럼보임"*
  //      안드로이드 크롬의 오버레이 막대는 «긁는 동안만» 떠서 「여기서 끝」으로 읽힌다.
  const [n, setN] = useState({ v: false, h: 0 }) // ⭐ 자리가 아니라 «개수»만
  // ➡️ 가로 막대는 «그 줄의 부모» 안에 그린다(Portal) → 세로로 굴려도 브라우저가 함께 옮긴다.
  //    그래서 «어느 줄인가»를 state 로 들고 있어야 한다(개수만으론 어디에 붙일지 모른다).
  const [붙일곳, set붙일곳] = useState([])
  const vRef = useRef(null)
  const hRefs = useRef([])
  const 화면 = useRef(null)   // 지금 굴러가는 화면
  const 가로줄 = useRef([])   // 가로로 넘치는 줄들(요소 그대로 — 자리는 그때그때 다시 잰다)
  const paintRef = useRef(() => {})
  // 📜📜 [2026-08-14 창업자] *"스크롤하면 덜덜거리자나 회색막대기가"*
  //   ⛔ 「늦게 따라온다」(v10.68)와 **다른 증상**이다. 늦음 = 한 박자 뒤 · 떨림 = 박자가 안 맞음.
  //   🔎 안드로이드에선 **화면은 컴포지터가** 굴리고 **막대는 메인 스레드가** 옮긴다 →
  //      메인이 조금만 바빠도 프레임을 놓쳐 막대만 멈췄다 튄다. **JS 로는 못 이긴다.**
  //   ✅ 브라우저에게 「스크롤 그 자체를 시계로 삼아」 옮기라고 넘긴다(CSS `scroll-timeline`).
  //      그러면 컴포지터에서 돌아 메인 스레드와 «무관»해진다 — 원리적으로 떨림이 없어진다.
  //   ⚠️ 되는 브라우저에서만. 안 되면 지금까지처럼 `paint()` 가 옮긴다(눈에 보이는 건 똑같다).
  //
  // ⛔⛔⛔ [2026-08-14 · 창업자 영상이 뒤집었다] **그 시계가 창업자 폰에서 «안 돌았다».**
  //   📮 창업자 *"해결안됐어 찍어줘?"* → 12.4초 화면 녹화(1080×2340·114fps)를 프레임마다 쟀다
  //      (`scripts/_영상-흔들-0814.mjs`).
  //   🔢 레시피 화면 3.8~7.5초 — **내용은 2,272px 굴렀는데 막대는 y 96~133 안에서 떨기만 했다.**
  //      즉 막대가 스크롤을 «따라가지 않고» 맨 위(`--hk-vy0`)에 붙박여 제자리 진동만 했다.
  //      ⭐ 그게 창업자가 본 「덜덜」이다. 창업자 말 *"걔는 고정이어야하는데"* 가 정확했다 —
  //         **막대는 붙박여 있었고 «떨림»만 남았다.**
  //   ⛔ **그런데 나는 시계를 믿고 `paint()` 를 꺼버렸다** → 얼어붙은 막대를 되살릴 길이 없었다.
  //   ⛔⛔ **검사가 왜 못 잡았나 = 「기능이 있나」만 물었다.**
  //      `CSS.supports('animation-timeline','scroll()')` 은 «익명 시계»를 묻는데
  //      우리가 실제로 쓰는 건 **`timeline-scope` 로 이름 붙인 시계**다 — «다른 기능»이다.
  //      게다가 헤드리스 크로미움(141)에선 돌아서 재현판이 초록불이었다.
  //      📌 **「되나」를 물어야 할 자리에서 「있나」를 물었다.** (규칙 18 ⓘ 그대로)
  //   ✅ **그래서 시계를 뺐다. 다시 `paint()` 가 옮긴다.**
  //      ⭐ 대신 **rAF 고리**로 옮긴다 — 스크롤 이벤트는 안드로이드에서 «몰려서» 오므로
  //         이벤트마다 그리면 계단이 진다(그게 v10.68 의 떨림이었다).
  //         화면이 그려지는 «매 프레임» `scrollTop` 을 새로 읽어 그리면 JS 가 낼 수 있는 최선이 된다.
  //   ⛔ 다시 시계로 돌아가려면 **「폰에서 진짜로 도는지」를 먼저 확인**할 것.
  //      기능 검사로는 절대 판정하지 말 것 — 오늘 그걸로 하루를 썼다.
  const 시계로옮긴다 = useRef(false)
  const 표시한화면 = useRef(null) // `hk-tl` 을 붙여 둔 화면(다른 데로 옮길 때 떼야 한다)

  useEffect(() => {
    let raf = 0
    // ⛔ 시계는 «끈다» — 창업자 폰에서 안 돌았다(위 주석의 영상 실측). 기능 검사로 켜지 말 것.
    시계로옮긴다.current = false
    // ➡️➡️ **가로로 넘치는 줄에도 막대를 그린다** (전수 재현판이 잡았다 — 2026-08-09 밤)
    //    🔢 실측 = 레시피 탭 「전체 41 · 아시안 2 · ＋ 폴더」 · 장보기 탭 「고기·해산물 … 자연드림」이
    //       화면 밖으로 나가 있었다. 옆으로 밀면 나오는데 **밀 수 있다는 표시가 없다.**
    //    ⛔ v9.99 의 `HStrip` 은 «꾸미기 서랍의 칩 줄»에만 붙였다 — 나머지 화면엔 없었다.
    //       창업자 *"앱 전반적으로 스크롤이 표시가 안되어있지 않아??"* 의 **나머지 절반**이 여기다.
    //    ⭐ 화면마다 손으로 붙이면 다음 화면에서 또 빠진다 → **넘치는 줄을 찾아** 한 곳에서 그린다.
    //    ⚠️ `data-hstrip`(이미 우리가 그린 줄)은 건너뛴다 — 두 겹으로 그리면 안 된다.
    const 가로찾기 = (root) => {
      const out = []
      for (const el of root.querySelectorAll('div, ul, nav')) {
        if (el.scrollWidth <= el.clientWidth + 8) continue
        if (el.hasAttribute('data-hstrip')) continue
        if (!/auto|scroll/.test(getComputedStyle(el).overflowX)) continue
        const r = el.getBoundingClientRect()
        if (r.width < 60 || r.bottom < 4 || r.top > innerHeight - 4) continue
        out.push(el)
      }
      return out
    }

    // 📐📐 [2026-08-14 창업자 ②] *"아직도 좀 덜덜하긴해 … 걔는 고정이어야하는데 스크롤하면 움직이니까."*
    //   ⛔⛔ **v10.69(시계로 옮기기)로도 안 끝났다. 내가 «막대»만 보고 «바닥»을 안 봤다.**
    //   🔎 뿌리 = `src/main.jsx` 가 `visualViewport` 의 **scroll·resize 마다** `--app-height` 를 다시 쓴다.
    //      안드로이드 크롬은 굴리는 «동안» 주소창을 접었다 폈다 하므로 그때마다
    //      `.app-frame { height: var(--app-height) }` 가 다시 레이아웃된다 → 화면(.screen)도 같이 움직인다.
    //      그런데 막대는 `position: fixed` = **뷰포트**에 붙어 있었다.
    //      📌 **내용은 프레임 기준, 막대는 뷰포트 기준** — 바닥이 흔들리면 둘이 갈라진다. 그게 「덜덜」이다.
    //   🔢 실측(`scripts/_probe-바닥흔들-0814.mjs`) — 주소창만큼(56·64px) 앱 높이를 바꾸니 **최대 10px 어긋났다.**
    //      ⚠️ 이 컨테이너엔 주소창이 «없어서» 있는 그대로는 0 이 나온다 —
    //         「덜덜이 없다」가 아니라 **「이 판에선 못 잡는다」**라 흉내를 내서 쟀다(규칙 18).
    //   ✅ 고침 = 세로 막대를 **`.app-frame` 안에 `absolute`** 로 붙인다(프레임이 `position: relative`).
    //      그러면 막대와 내용이 **같은 상자**에 들어가 프레임이 커지든 작아지든 «같이» 움직인다.
    //      좌표도 프레임 기준이라 `r.top - fr.top` = 0 → 주소창이 움직여도 **값이 낡지 않는다.**
    //   ⛔ 가로 막대는 그대로 `fixed` 로 둔다 — ⑴스크롤마다 rect 를 다시 읽어 낡을 틈이 없고
    //      ⑵꾸미기 판은 Portal 이라 `.app-frame` «밖»이다. 프레임 기준으로 바꾸면 판 위 막대가 잘린다.
    const 프레임자리 = () => {
      const f = vRef.current && vRef.current.offsetParent
      return f ? f.getBoundingClientRect() : { left: 0, top: 0 }
    }

    // 🖌 가벼운 칠하기 — **스크롤마다 즉시.** rAF 도 state 도 안 거친다.
    //    ⭐ `transform` 만 만진다(컴포지터가 처리 → 레이아웃·페인트가 안 돈다).
    //    ⚠️ 그래서 막대 자체는 `top:0; left:0` 에 두고 **전부 translate 로** 옮긴다.
    const paint = () => {
      const s = 화면.current
      const v = vRef.current
      // ⭐ 시계로 옮기는 브라우저면 세로 막대는 **손대지 않는다** — 브라우저가 컴포지터에서 옮긴다.
      //    여기서 또 `transform` 을 쓰면 애니메이션과 싸워 오히려 튄다.
      if (s && v && s.isConnected && !시계로옮긴다.current) {
        const { scrollHeight: sh, clientHeight: ch, scrollTop: st } = s
        if (sh > ch + 8) {
          const r = s.getBoundingClientRect()
          const fr = 프레임자리() // ⭐ 세로 막대는 프레임 기준(absolute) — 뷰포트가 흔들려도 안 갈라진다
          const h = Math.max(28, (ch / sh) * r.height)
          const y = r.top - fr.top + (st / (sh - ch)) * (r.height - h)
          v.style.height = `${h}px`
          v.style.transform = `translate3d(${r.right - fr.left - 5}px, ${y}px, 0)`
        }
      }
      // ➡️➡️ [2026-08-14 창업자 ③] *"아니 막대가 «가로»라니까 세로막대아니고"*
      //   ⛔⛔ 오늘 하루(v10.68·69·70·71)를 **세로 막대만** 보고 고쳤다. 창업자가 말한 건 «가로» 막대였다.
      //   ⭐ 그러면 *"걔는 고정이어야하는데 스크롤하면 움직이니까"* 가 그대로 읽힌다 —
      //      **가로 막대는 «자기 줄»에 딱 붙어 있어야 한다.** 세로로 굴릴 때 줄에서 떨어지면 안 된다.
      //   🔢 실측(`scripts/_repro-가로막대-0814.mjs`) — 굴린 «그 순간» 막대가 자기 줄에서
      //      **레시피 최대 80px · 장보기 최대 896px** 떨어져 있었다. 줄은 컴포지터가 즉시 굴리는데
      //      막대는 `fixed` 라 JS 가 «쫓아다녔기» 때문이다.
      //   ✅ **막대를 그 줄의 부모 안으로 넣었다**(Portal ＋ `absolute`) → 세로로 굴리면
      //      브라우저가 줄과 **함께** 옮긴다. **세로 스크롤에 JS 가 0이다** — 늦을 수가 없다.
      //   ⭐ 그래서 여기선 **가로 자리만** 정한다. 세로(`top`)는 붙일 때 한 번 잡고 안 건드린다.
      for (let i = 0; i < 가로줄.current.length; i++) {
        const el = 가로줄.current[i]
        const b = hRefs.current[i]
        if (!b || !el || !el.isConnected) continue
        const w = Math.max(24, (el.clientWidth / el.scrollWidth) * el.clientWidth)
        // 부모 기준 좌표 — `offsetLeft/Top` 은 «굴려도 안 변한다»(그게 이 고침의 전부다)
        const x = el.offsetLeft + (el.scrollLeft / (el.scrollWidth - el.clientWidth)) * (el.clientWidth - w)
        b.style.width = `${w}px`
        b.style.transform = `translate3d(${x}px, ${el.offsetTop + el.offsetHeight - 3}px, 0)`
      }
    }
    // 📜 시계 달기 — 「어느 화면이 시계인가」와 「막대가 어디서 어디까지 가나」를 정해 준다.
    //   ⭐ 이건 «화면이 바뀔 때»만 돈다. 스크롤 중엔 브라우저가 알아서 그 사이를 채운다.
    //   ⚠️ `.screen` 이 여러 개인데 이름이 겹치면 시계가 통째로 죽는다 → **맨 위 하나에만** 붙인다.
    const 시계달기 = (el) => {
      const v = vRef.current
      if (!시계로옮긴다.current || !v) return
      if (표시한화면.current && 표시한화면.current !== el) 표시한화면.current.classList.remove('hk-tl')
      if (!el) { 표시한화면.current = null; v.classList.remove('hk-anim'); return }
      el.classList.add('hk-tl')
      표시한화면.current = el
      const { scrollHeight: sh, clientHeight: ch } = el
      const r = el.getBoundingClientRect()
      const fr = 프레임자리() // ⭐ 프레임 기준 — 주소창이 접혀도 `r.top - fr.top` 은 그대로다(= 값이 안 낡는다)
      const h = Math.max(28, (ch / sh) * r.height)
      v.style.height = `${h}px`
      v.style.setProperty('--hk-vx', `${Math.round(r.right - fr.left - 5)}px`)
      v.style.setProperty('--hk-vy0', `${Math.round(r.top - fr.top)}px`)
      v.style.setProperty('--hk-vy1', `${Math.round(r.top - fr.top + (r.height - h))}px`)
      v.classList.add('hk-anim')
    }
    // ⭐ 막대는 «렌더 뒤»에 생긴다 — 그때 시계를 다시 달고 자리를 잡아야 첫 프레임부터 제자리다.
    paintRef.current = () => { 시계달기(화면.current); paint() }

    // 📐 무거운 재기 — «무엇을» 그릴지만 정한다. 개수가 안 바뀌면 state 도 안 건드린다(리렌더 0).
    const 세팅 = (v, h) => setN((p) => (p.v === v && p.h === h ? p : { v, h }))
    // ➡️ 막대를 «어느 상자»에 그릴지 — 줄의 부모다.
    //    ⭐ 부모에 「position: relative」 를 준다(없으면 「absolute」 가 엉뚱한 조상 기준이 된다).
    //    ⚠️ 이 줄은 낫표다 — 여기 백틱을 쓰면 bash 로 넣을 때 «실행»돼 내용이 사라진다(오늘 또 당했다).
    //       ⚠️ 이미 자리를 가진 부모는 «안 건드린다» — 남의 배치를 망가뜨리면 안 된다.
    const 붙이기 = (줄들) => {
      const 곳 = []
      for (const e of 줄들) {
        const p = e.parentElement
        if (!p) continue
        if (getComputedStyle(p).position === 'static') p.style.position = 'relative'
        곳.push(p)
      }
      set붙일곳((옛) => (옛.length === 곳.length && 옛.every((x, i) => x === 곳[i]) ? 옛 : 곳))
    }
    const measure = () => {
      // ⛔ 꾸미기 판은 Portal 이라 `.app-frame` 밖에서 화면을 통째로 덮는다 —
      //    그때 «뒤 화면» 막대를 그리면 판 위에 떠 보인다(재현판이 잡았다: 판을 열었는데 막대 1개).
      //    꾸미기 판은 자기 서랍 막대를 따로 그린다(`DecorEditor` 의 `VHint`).
      const 판 = document.querySelector('.decor-editor')
      if (판) { 화면.current = null; 시계달기(null); 가로줄.current = 가로찾기(판); 붙이기(가로줄.current); 세팅(false, 가로줄.current.length); paint(); return }
      const list = document.querySelectorAll('.app-frame .screen')
      const el = list[list.length - 1] // 맨 위 화면 = DOM 에서 마지막
      if (!el) { 화면.current = null; 시계달기(null); 가로줄.current = []; 붙이기([]); 세팅(false, 0); return }
      // ⭐ 가로 막대도 «맨 위 화면 안»에서만 찾는다 — `.app-frame` 을 통째로 훑으면
      //    쌓인 화면 «뒤»에 깔린 줄까지 잡아 남의 화면에 막대가 뜬다(세로 막대와 같은 기준).
      화면.current = el
      가로줄.current = 가로찾기(el)
      붙이기(가로줄.current)
      세팅(el.scrollHeight > el.clientHeight + 8, 가로줄.current.length)
      시계달기(el.scrollHeight > el.clientHeight + 8 ? el : null)
      paint()
    }
    // ⚠️ `scroll` 은 bubble 을 안 한다 → **capture** 로 잡아야 어느 화면이 굴러도 걸린다.
    // ⭐ 스크롤에선 **칠하기만** 한다(가볍다). 무거운 재기는 rAF 로 따로 묶는다 —
    //    안 그러면 `querySelectorAll('div,ul,nav')` 가 스크롤마다 돌아 이번엔 «버벅임»이 된다.
    // 🎞🎞 **매 프레임 그린다** — 스크롤 이벤트마다가 «아니다».
    //   ⛔ 안드로이드는 굴리는 동안 `scroll` 이벤트를 **몰아서** 준다(한 프레임에 여러 번 오거나 건너뛴다).
    //      이벤트마다 그리면 막대가 «계단»으로 움직인다 — 그게 v10.68 에서 창업자가 본 떨림이다.
    //   ✅ 화면이 그려지는 «그 프레임»마다 `scrollTop` 을 새로 읽어 그린다. JS 가 낼 수 있는 최선이다.
    //   ⭐ 굴림이 멎으면 고리도 멎는다(300ms) — 가만있는데 rAF 를 돌리면 배터리만 먹는다.
    let 그리기고리 = 0
    let 마지막굴림 = 0
    const 한바퀴 = () => {
      paint()
      if (performance.now() - 마지막굴림 < 300) 그리기고리 = requestAnimationFrame(한바퀴)
      else 그리기고리 = 0
    }
    const onScroll = () => {
      마지막굴림 = performance.now()
      if (!그리기고리) 그리기고리 = requestAnimationFrame(한바퀴)
      paint() // 첫 프레임을 기다리지 않게 즉시 한 번
      cancelAnimationFrame(raf); raf = requestAnimationFrame(measure)
    }
    document.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    // ⛔⛔ **여기가 「덜덜」의 나머지 절반이었다** (2026-08-14 · 프로브가 잡았다)
    //   막대를 프레임 기준(absolute)으로 바꿔도 어긋남이 10px 그대로였다. 왜냐면 —
    //   `--app-height` 가 바뀌어 화면 높이가 달라져도 **다시 잴 신호가 «하나도» 없었다.**
    //   📌 우리는 `window.resize` 만 듣는데, 안드로이드 주소창 접힘은 **`visualViewport` 의 resize**를 쏜다.
    //      **둘은 다른 사건이다** — 레이아웃 뷰포트는 그대로고 «보이는» 뷰포트만 바뀌기 때문이다.
    //   ✅ 그래서 시계 값(`--hk-vy0/1`)이 옛 높이로 남아 내용과 갈라졌다.
    //   ⭐ 여기선 **무거운 `measure()` 를 부르지 않는다** — 화면이 바뀐 게 아니라 «크기»만 바뀐 것이라
    //      시계 다시 달기 ＋ 칠하기(`paintRef`)면 충분하다. 스크롤 길에 무게를 얹지 않는 게 이 판의 전부다.
    const vv = window.visualViewport
    const onVV = () => { paintRef.current() }
    if (vv) { vv.addEventListener('resize', onVV); vv.addEventListener('scroll', onVV) }
    // ⚠️ 꾸미기 판·온보딩은 Portal 이라 body 직계로 붙는다 — 뜨고 지는 걸 여기서 잡아야
    //    막대가 판 위에 남지 않는다(`dep` 은 탭·스택만 보므로 이건 못 잡는다).
    const mo = new MutationObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure) })
    mo.observe(document.body, { childList: true })
    // ⛔⛔ **「모아보기 ↔ 한끼 일기」·「장보기 ↔ 냉장고」는 «한 화면 안»에서 갈린다** —
    //    탭도 스택도 안 바뀌고(`dep` 그대로) `body` 직계 자식도 안 바뀐다.
    //    그래서 다시 잴 신호가 «하나도» 없었고, 마지막에 잰 막대가 `fixed` 로 그대로 남아
    //    **다른 화면을 가로질렀다**(창업자 2026-08-10 *"모아보기 바가 다른데도 침범중야"*).
    //    📌 규칙 18 — 「막대가 틀린 자리에 있다」가 아니라 **「다시 잰 적이 없다」**였다.
    const frame = document.querySelector('.app-frame')
    if (frame) mo.observe(frame, { childList: true, subtree: true })
    // ⚠️ 화면을 열자마자 재면 내용이 아직 없어 «안 넘침»으로 나온다 → 몇 번 더 잰다.
    const timers = [0, 140, 420, 900].map((ms) => setTimeout(measure, ms))
    return () => {
      document.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
      if (vv) { vv.removeEventListener('resize', onVV); vv.removeEventListener('scroll', onVV) }
      mo.disconnect()
      timers.forEach(clearTimeout)
      cancelAnimationFrame(raf)
      cancelAnimationFrame(그리기고리)
      // ⚠️ 시계 표식을 떼고 나간다 — 두 화면에 같은 이름이 남으면 시계가 통째로 죽는다.
      if (표시한화면.current) { 표시한화면.current.classList.remove('hk-tl'); 표시한화면.current = null }
    }
  }, [dep])

  // ⭐ 새로 생긴 막대는 «첫 프레임부터» 제자리여야 한다 — 안 그러면 왼쪽 위(0,0)에 한 번 번쩍인다.
  //    그래서 `useEffect` 가 아니라 `useLayoutEffect` — 브라우저가 그리기 «전»에 자리를 잡는다.
  useLayoutEffect(() => { paintRef.current() })

  if (!n.v && !붙일곳.length) return null
  // ⚠️ 표식 `data-vhint`·`data-hhint` = 재현 검사가 «실제로 그려졌나»를 집는 자리.
  const 공통 = {
    top: 0, left: 0, borderRadius: 999,
    background: 'var(--text-sub)', pointerEvents: 'none', willChange: 'transform',
  }
  return (
    <>
      {n.v && (
        // ⭐ 세로 막대만 `absolute` = **프레임 기준**(위 `프레임자리()` 주석 참고).
        //    ⛔ `fixed`(뷰포트 기준)로 두면 주소창이 접힐 때 내용과 갈라져 «덜덜»거린다.
        <div ref={vRef} data-vhint="1" aria-hidden="true"
          style={{ ...공통, position: 'absolute', width: 3, height: 28, opacity: 0.38 }} />
      )}
      {/* ➡️➡️ 가로 막대는 «그 줄의 부모 안»에 그린다 (창업자 2026-08-14
          *"레시피 전체 자주 한식 양식 거기아래있는 가로바. 장바구니 이번주 픽 아래있는 가로바.
            그게 아래로 스크롤내리면 떨린다고"* · *"세로막대는 처음부터 문제없었어"*)
          ⛔ 전엔 `fixed` 라 JS 가 매 프레임 쫓아다녔다 → 줄은 컴포지터가 즉시 굴리는데
             막대는 뒤에 남았다가 따라붙어 **줄에서 떨어졌다 붙었다** 했다(레시피 80px · 장보기 896px 실측).
          ✅ 같은 상자에 넣으면 브라우저가 줄과 **함께** 옮긴다 — **세로 스크롤에 JS 가 0이다.**
          ⚠️ 부모가 없거나 사라졌으면 그냥 안 그린다(억지로 붙이지 않는다). */}
      {붙일곳.map((부모, i) => (부모 && 부모.isConnected ? createPortal(
        <div ref={(el) => { hRefs.current[i] = el }} data-hhint="1" aria-hidden="true"
          style={{ ...공통, position: 'absolute', height: 3, width: 24, opacity: 0.34 }} />,
        부모, `hh${i}`) : null))}
    </>
  )
}

// ⬆️⬆️ ToTop — 한참 굴러 내려오면 오른쪽 아래에 「위로」 단추가 뜬다.
//   (창업자 2026-08-10 *"레시피(전체, 모아보기)에 스크롤이 기니까 위로 바로가는 버튼? 하나 만들면 좋겠어."*)
//   ⭐ **왜 화면마다 안 붙이고 여기 하나인가** = 바로 위 `ScrollHint` 와 같은 이유다.
//      `.screen` 이 열 곳에 흩어져 있어 한 곳만 붙이면 다음 화면에서 또 없다.
//      **맨 위 `.screen` 을 찾아** 한 단추가 따라다닌다 → 레시피·레꾸자랑·장보기·홈이 다 같이 된다.
//      ⛔ 레시피 탭에만 넣으면 목록이 긴 다른 탭에서 「여긴 왜 안 돼?」가 된다.
//   ⭐ 안 넘치면 아예 안 그린다 · 조금 굴린 정도로도 안 뜬다(화면 하나 넘게 내려와야).
//     짧은 화면엔 아무 티도 안 나고, 단추가 내용을 가리는 시간도 짧다.
//   ⚠️ 꾸미기 판이 열렸으면 안 그린다 — 판은 Portal 이라 화면을 통째로 덮는다(`ScrollHint` 와 같은 함정).
//   ⚠️ 타이머 바가 떠 있으면 그 위로 비켜 앉는다(`.timer-bar` 는 좌우 12px 전폭이라 그냥 두면 겹친다).
//   ⚠️ 표식 `data-totop` = 재현 검사가 «실제로 그려졌나»를 집는 자리.
function ToTop({ dep, hasNav }) {
  const [el, setEl] = useState(null) // 지금 굴러갈 화면 · null = 안 보임
  const { timer } = useTimer()
  useEffect(() => {
    let raf = 0
    const measure = () => {
      if (document.querySelector('.decor-editor')) { setEl(null); return }
      const list = document.querySelectorAll('.app-frame .screen')
      const s = list[list.length - 1] // 맨 위 화면 = DOM 에서 마지막
      if (!s) { setEl(null); return }
      // 「반 화면쯤 내려왔나」로 가른다 — 조금 굴렸을 뿐인데 뜨면 방해만 된다.
      // ⛔⛔ 2026-08-10 창업자 폰 제보 *"아 한참내려야 보이네"* — 처음엔 `0.9` 였다.
      //    폰 세로(891)에서 문턱이 **802px** 이라 카드 두 줄을 지나야 겨우 떴다.
      //    ⭐ 「돌아가고 싶다」는 훨씬 일찍 생긴다 → **0.45**(폰 401px · 카드 한 줄 반).
      //    ⚠️ 더 낮추면 조금만 굴려도 떠서 내용을 가린다 — 재현판 ②(200px 에선 안 뜸)가 그 선을 지킨다.
      const 문턱 = Math.max(240, s.clientHeight * 0.45)
      setEl(s.scrollHeight > s.clientHeight + 8 && s.scrollTop > 문턱 ? s : null)
    }
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure) }
    // ⚠️ `scroll` 은 bubble 을 안 한다 → **capture** 로 잡아야 어느 화면이 굴러도 걸린다.
    document.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    const mo = new MutationObserver(onScroll) // 꾸미기 판·온보딩은 body 직계로 뜬다
    mo.observe(document.body, { childList: true })
    // ⭐ `ScrollHint` 와 같은 구멍 — 「모아보기 ↔ 한끼 일기」처럼 «한 화면 안»에서 갈리면
    //    긴 화면에서 뜬 단추가 짧은 화면으로 옮겨도 그대로 남는다. 화면 속까지 본다.
    const frame = document.querySelector('.app-frame')
    if (frame) mo.observe(frame, { childList: true, subtree: true })
    const timers = [0, 140, 420].map((ms) => setTimeout(measure, ms))
    return () => {
      document.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
      mo.disconnect()
      timers.forEach(clearTimeout)
      cancelAnimationFrame(raf)
    }
  }, [dep])
  if (!el) return null
  // 타이머 바와 같은 바닥값(App 이 TimerBar 에 주는 값) ＋ 타이머가 떠 있으면 그 높이만큼 더
  // ⚠️ 타이머 바가 쓰는 66/84 를 그대로 쓰면 하단바까지 **2px** 밖에 안 남았다(실측).
  //    바는 하단바에 붙는 게 자연스럽지만 «동그란 단추»는 띄워야 떠 있는 것으로 읽힌다 → ＋8px.
  const 바닥 = (hasNav ? 74 : 92) + (timer ? 70 : 0)
  return (
    <button
      data-totop="1"
      className="press"
      aria-label="맨 위로"
      onClick={() => {
        // ♿ 「움직임 줄이기」를 켠 사람에겐 부드럽게 흐르지 않고 바로 올라간다
        const 부드럽게 = !matchMedia('(prefers-reduced-motion: reduce)').matches
        el.scrollTo({ top: 0, behavior: 부드럽게 ? 'smooth' : 'auto' })
      }}
      style={{
        position: 'fixed', right: 16, bottom: `calc(${바닥}px + var(--safe-bottom))`,
        width: 44, height: 44, borderRadius: 999, zIndex: 45,
        // 🎨 색 = 창업자 확정 2026-08-10 (갈래 넷을 테마 셋에 얹어 찍어 고름 · `_shot-위로단추색-0810.mjs`)
        //   ⭐ 고른 이유는 «대비»가 아니라 «위계»다 — 우리 앱에서 파랑은 「누르는 것」이라는 뜻인데,
        //      하단바 「가져오기」는 파랑 «채움»(주 동작)이고 이건 파랑 «테두리»(거들어주는 것)다.
        //      같은 색인데 무게가 달라 한 화면에 둘이 있어도 안 싸운다.
        //   ⛔ 통째로 채우면(갈래 B) 가져오기 단추와 «똑같은 파란 원»이 둘이 된다.
        //   ⛔ 진한 잉크로 채우면(갈래 C) 배경 대비 9.5:1 이라 화면에서 제일 진한 물체가 된다 —
        //      「위로 가기」가 레시피 사진보다 눈에 띄면 안 된다.
        background: 'var(--surface)', border: '1px solid var(--brown)',
        boxShadow: '0 6px 18px rgba(60, 45, 30, 0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeUp 0.18s ease both',
      }}
    >
      <Icon name="chevron-up" size={21} color="var(--brown)" stroke={2.4} />
    </button>
  )
}

function StackLayer({ children }) {
  return (
    <div
      className="stack-layer"
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--bg)',
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideIn 0.26s cubic-bezier(0.22,0.61,0.36,1) both',
      }}
    >
      {children}
    </div>
  )
}

function renderScreen(s) {
  switch (s.name) {
    case 'import':
      return <ImportScreen />
    case 'detail':
      return <RecipeDetailScreen id={s.id} />
    case 'editor':
      return <EditorScreen id={s.id} prefill={s.prefill} />
    case 'inbox':
      return <InboxScreen />
    case 'favorites':
      return <FavoritesScreen />
    case 'cooked':
      return <CookedScreen />
    case 'cook':
      return <CookScreen id={s.id} />
    // 📔 다이어리 = 레시피가 아니라 «날짜»에 묶인다 (창업자 2026-08-06)
    case 'diary':
      return <DiaryScreen day={s.day} />
    default:
      return null
  }
}
