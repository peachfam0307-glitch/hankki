import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useStore } from './store'
import { consumeSharedIntake, detectSource, firstUrl, captionFrom, firstLine } from './shareIntake'
import { makeInboxRecipe } from './screens/ImportScreen'
import { ocrImage } from './ocr'
import { parseRecipeText } from './parseRecipe'
import { fetchLinkRecipe } from './linkReader'
import { guessCategory } from './utils'
import BottomNav from './components/BottomNav'
import TimerBar from './components/TimerBar'
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
      if (modalLayers.current.length > 0) {
        const layer = modalLayers.current.pop()
        layer.consumed = true
        try { layer.close() } catch { /* noop */ }
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
  const [bar, setBar] = useState(null) // [화면 y, 높이, 오른쪽 x] · null = 안 넘침
  useEffect(() => {
    let raf = 0
    const measure = () => {
      // ⛔ 꾸미기 판은 Portal 이라 `.app-frame` 밖에서 화면을 통째로 덮는다 —
      //    그때 «뒤 화면» 막대를 그리면 판 위에 떠 보인다(재현판이 잡았다: 판을 열었는데 막대 1개).
      //    꾸미기 판은 자기 서랍 막대를 따로 그린다(`DecorEditor` 의 `VHint`).
      if (document.querySelector('.decor-editor')) { setBar(null); return }
      const list = document.querySelectorAll('.app-frame .screen')
      const el = list[list.length - 1] // 맨 위 화면 = DOM 에서 마지막
      if (!el) { setBar(null); return }
      const { scrollHeight: sh, clientHeight: ch, scrollTop: st } = el
      if (sh <= ch + 8) { setBar(null); return }
      const r = el.getBoundingClientRect()
      const h = Math.max(28, (ch / sh) * r.height)
      const y = r.top + (st / (sh - ch)) * (r.height - h)
      setBar((b) => (b && Math.abs(b[0] - y) < 0.5 && Math.abs(b[1] - h) < 0.5 && b[2] === r.right) ? b : [y, h, r.right])
    }
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure) }
    // ⚠️ `scroll` 은 bubble 을 안 한다 → **capture** 로 잡아야 어느 화면이 굴러도 걸린다.
    document.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    // ⚠️ 꾸미기 판·온보딩은 Portal 이라 body 직계로 붙는다 — 뜨고 지는 걸 여기서 잡아야
    //    막대가 판 위에 남지 않는다(`dep` 은 탭·스택만 보므로 이건 못 잡는다).
    const mo = new MutationObserver(onScroll)
    mo.observe(document.body, { childList: true })
    // ⚠️ 화면을 열자마자 재면 내용이 아직 없어 «안 넘침»으로 나온다 → 몇 번 더 잰다.
    const timers = [0, 140, 420, 900].map((ms) => setTimeout(measure, ms))
    return () => {
      document.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
      mo.disconnect()
      timers.forEach(clearTimeout)
      cancelAnimationFrame(raf)
    }
  }, [dep])
  if (!bar) return null
  return (
    <div
      data-vhint="1"
      aria-hidden="true"
      style={{
        position: 'fixed', top: bar[0], height: bar[1], left: bar[2] - 5,
        width: 3, borderRadius: 999, background: 'var(--text-sub)', opacity: 0.38,
        pointerEvents: 'none',
      }}
    />
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
