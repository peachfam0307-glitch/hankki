import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useStore } from './store'
import { consumeSharedIntake, detectSource, firstUrl, captionFrom, firstLine } from './shareIntake'
import { makeInboxRecipe } from './screens/ImportScreen'
import { ocrImage } from './ocr'
import { parseRecipeText } from './parseRecipe'
import { fetchLinkRecipe } from './linkReader'
import { guessCategory } from './utils'
import BottomNav from './components/BottomNav'
import TimerBar from './components/TimerBar'
import Icon from './components/Icon'
import { useTimer } from './timer'
import Onboarding, { needsOnboarding } from './components/Onboarding'
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
  const backHandlers = useRef([]) // 화면들이 등록한 '뒤로가기 먼저 처리' 핸들러(비모달 상태·필터용)
  const modalLayers = useRef([]) // 열려 있는 모달·오버레이(각자 진짜 히스토리 칸 1개 소유)
  const pendingBack = useRef(0) // 같은 틱에 버튼으로 동시에 닫힌 모달 칸 수(한 번에 go(-n))
  const backScheduled = useRef(false)
  const suppressPop = useRef(0) // popAll·모달버튼닫기 가 만든 popstate 무시용
  const toastTimer = useRef(null)
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

  const showToast = useCallback((msg, ms = 1900) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), ms)
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
    window.addEventListener('hankki:storagefull', onFull)
    return () => window.removeEventListener('hankki:storagefull', onFull)
  }, [showToast])

  // '공유받기' — 인스타/갤러리에서 한끼로 공유된 링크·사진을 앱 시작 시 받아 Inbox 로.
  const store = useStore()
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
      // 메모는 직접 입력 전용 — 캡션 찌꺼기를 자동으로 붙이지 않는다
      const rec = makeInboxRecipe({
        source,
        title,
        sourceUrl: link,
        image: data.imageDataUrl || null,
      })
      if (parsed && (parsed.ingredients.length || parsed.steps.length)) {
        rec.ingredients = parsed.ingredients
        rec.steps = parsed.steps
      }
      store.addRecipe(rec)
      setStack([{ name: 'inbox' }])
      // inbox 레이어에 해당하는 히스토리 칸(트랩)을 보충 — 없으면 뒤로가기가 base 트랩을 대신
      // 소비해 다음 back 이 앱 종료로 샜다. (공유로 앱을 처음 열었을 때 경로)
      try { history.pushState({ hankki: 1 }, '') } catch { /* noop */ }
      showToast(
        data.imageDataUrl
          ? '사진을 담았어요 · 글자 읽는 중…'
          : link && source !== 'youtube' && source !== 'instagram'
            ? '공유한 링크를 담았어요 · 읽는 중…'
            : '공유한 레시피를 Inbox에 담았어요'
      )
      if (typeof history !== 'undefined' && location.search) {
        history.replaceState({ hankki: 1 }, '', location.pathname) // URL 만 정리, 트랩 표식은 유지
      }
      // 공유된 사진이면 글자를 읽어 재료·순서를 자동으로 채운다.
      if (data.imageDataUrl) {
        const text = await ocrImage(data.imageDataUrl)
        if (cancelled || !text.trim()) return
        const r = parseRecipeText(text, { fromOcr: true })
        store.updateRecipe(rec.id, {
          title: rec.title && rec.title !== '사진 레시피' ? rec.title : r.title || rec.title,
          ingredients: r.ingredients,
          steps: r.steps, // 메모는 건드리지 않는다 — 직접 입력 전용
          category: guessCategory((r.title || '') + ' ' + r.memo),
        })
        showToast('사진에서 글자를 읽어 채웠어요')
        return
      }

      // 공유로 들어온 링크는 예전엔 주소만 Inbox에 눕혀두고 끝이었다
      // (창업자 제보 "유튜브 → 링크공유 → 한끼, INBOX 저장만 됨").
      // 이제 붙여넣기 흐름과 똑같이 읽어서 제목·재료·순서까지 채운다.
      // 유튜브·인스타는 읽어봐야 안 되는 게 확실하니(로그인·동의 벽) 기다리게 하지 않는다 —
      // 링크는 바로가기로 담기고 끝. 자동 정리는 '준비 중'으로 안내한다.
      if (!link || source === 'youtube' || source === 'instagram') return
      if (parsed && (parsed.ingredients.length || parsed.steps.length)) return
      const read = await Promise.race([
        fetchLinkRecipe(link).catch(() => null),
        new Promise((res) => setTimeout(() => res(null), 25000)),
      ])
      if (cancelled || !read) {
        showToast('링크는 담았어요 · 내용은 자동으로 읽지 못했어요')
        return
      }
      const patch = {}
      // 읽어온 제목을 우선한다. 이 레코드는 방금 자동으로 만들어진 것이라 사용자가 앱 안에서
      // 적은 글자가 없다 — 임시 제목은 공유 문구 첫 줄("이거 봐봐" 같은 인사말)일 때가 많아서
      // 영상·글의 실제 제목이 훨씬 낫다. 쓰레기 제목은 linkReader 쪽에서 이미 걸러져 온다.
      if (read.title) patch.title = read.title
      if (read.full && read.text) {
        const p = parseRecipeText(read.text, { fromOcr: true })
        if (p.ingredients.length) patch.ingredients = p.ingredients
        if (p.steps.length) patch.steps = p.steps
        if (!patch.title && p.title) patch.title = p.title
      }
      if (patch.title === title) delete patch.title
      if (!Object.keys(patch).length) return
      store.updateRecipe(rec.id, patch)
      showToast(
        patch.ingredients || patch.steps
          ? '링크에서 레시피를 읽어 채웠어요'
          : '영상 제목을 채웠어요 · 설명은 붙여넣어 주세요'
      )
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showOnboarding = useCallback(() => setOnboard(true), [])
  const nav = { push, pop, popAll, go, showToast, tab, setTab, registerBack, openModal, showOnboarding }

  const TabScreen = TABS[tab]
  const top = stack[stack.length - 1]

  return (
    <NavCtx.Provider value={nav}>
      <div className="app-frame">
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

        {!top && <BottomNav active={tab} onChange={go} onImport={() => push({ name: 'import' })} />}
        <TimerBar bottom={top ? 'calc(84px + var(--safe-bottom))' : 'calc(66px + var(--safe-bottom))'} />
        {toast && <div className="toast">{toast}</div>}

        {onboard && <Onboarding onDone={() => setOnboard(false)} />}
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
  const 시계로옮긴다 = useRef(false)
  const 표시한화면 = useRef(null) // `hk-tl` 을 붙여 둔 화면(다른 데로 옮길 때 떼야 한다)

  useEffect(() => {
    let raf = 0
    // 🔎 이 브라우저가 「스크롤을 시계로」 쓸 수 있나 — 한 번만 묻는다.
    //    ⚠️ 「기능이 있다」와 「우리 DOM 에서 된다」는 다른 말이라 실제 화면으로도 확인했다
    //       (`scripts/_probe-타임라인-0814.mjs` — 굴린 곳 다섯 군데 전부 차이 0~1px).
    try { 시계로옮긴다.current = CSS.supports('animation-timeline', 'scroll()') } catch { 시계로옮긴다.current = false }
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
      for (let i = 0; i < 가로줄.current.length; i++) {
        const el = 가로줄.current[i]
        const b = hRefs.current[i]
        if (!b || !el || !el.isConnected) continue
        const r = el.getBoundingClientRect()
        const w = Math.max(24, (el.clientWidth / el.scrollWidth) * r.width)
        const x = r.left + (el.scrollLeft / (el.scrollWidth - el.clientWidth)) * (r.width - w)
        b.style.width = `${w}px`
        b.style.transform = `translate3d(${x}px, ${r.bottom - 3}px, 0)`
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
    const measure = () => {
      // ⛔ 꾸미기 판은 Portal 이라 `.app-frame` 밖에서 화면을 통째로 덮는다 —
      //    그때 «뒤 화면» 막대를 그리면 판 위에 떠 보인다(재현판이 잡았다: 판을 열었는데 막대 1개).
      //    꾸미기 판은 자기 서랍 막대를 따로 그린다(`DecorEditor` 의 `VHint`).
      const 판 = document.querySelector('.decor-editor')
      if (판) { 화면.current = null; 시계달기(null); 가로줄.current = 가로찾기(판); 세팅(false, 가로줄.current.length); paint(); return }
      const list = document.querySelectorAll('.app-frame .screen')
      const el = list[list.length - 1] // 맨 위 화면 = DOM 에서 마지막
      if (!el) { 화면.current = null; 시계달기(null); 가로줄.current = []; 세팅(false, 0); return }
      // ⭐ 가로 막대도 «맨 위 화면 안»에서만 찾는다 — `.app-frame` 을 통째로 훑으면
      //    쌓인 화면 «뒤»에 깔린 줄까지 잡아 남의 화면에 막대가 뜬다(세로 막대와 같은 기준).
      화면.current = el
      가로줄.current = 가로찾기(el)
      세팅(el.scrollHeight > el.clientHeight + 8, 가로줄.current.length)
      시계달기(el.scrollHeight > el.clientHeight + 8 ? el : null)
      paint()
    }
    // ⚠️ `scroll` 은 bubble 을 안 한다 → **capture** 로 잡아야 어느 화면이 굴러도 걸린다.
    // ⭐ 스크롤에선 **칠하기만** 한다(가볍다). 무거운 재기는 rAF 로 따로 묶는다 —
    //    안 그러면 `querySelectorAll('div,ul,nav')` 가 스크롤마다 돌아 이번엔 «버벅임»이 된다.
    const onScroll = () => { paint(); cancelAnimationFrame(raf); raf = requestAnimationFrame(measure) }
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
      // ⚠️ 시계 표식을 떼고 나간다 — 두 화면에 같은 이름이 남으면 시계가 통째로 죽는다.
      if (표시한화면.current) { 표시한화면.current.classList.remove('hk-tl'); 표시한화면.current = null }
    }
  }, [dep])

  // ⭐ 새로 생긴 막대는 «첫 프레임부터» 제자리여야 한다 — 안 그러면 왼쪽 위(0,0)에 한 번 번쩍인다.
  //    그래서 `useEffect` 가 아니라 `useLayoutEffect` — 브라우저가 그리기 «전»에 자리를 잡는다.
  useLayoutEffect(() => { paintRef.current() })

  if (!n.v && !n.h) return null
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
      {Array.from({ length: n.h }, (_, i) => (
        // ⛔ 가로 막대는 `fixed` 그대로 — 꾸미기 판(Portal)은 `.app-frame` «밖»이라
        //    프레임 기준으로 바꾸면 판 위 막대가 잘린다. 얘는 스크롤마다 rect 를 다시 읽어 낡을 틈도 없다.
        <div key={i} ref={(el) => { hRefs.current[i] = el }} data-hhint="1" aria-hidden="true"
          style={{ ...공통, position: 'fixed', height: 3, width: 24, opacity: 0.34 }} />
      ))}
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
