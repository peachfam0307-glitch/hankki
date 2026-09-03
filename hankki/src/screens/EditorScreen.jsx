import { useRef, useState, useEffect } from 'react'

// 새 레시피 작성 중 내용을 자동 임시저장하는 키 — 앱이 껐다 켜져도(인스타 링크 따러 갔다 오는 등)
// 쓰던 내용이 날아가지 않게 한다. 저장 완료하면 지운다.
const DRAFT_KEY = 'hankki:editorDraft'
import { useStore, newId, 기본표지, 방금저장됐나 } from '../store'
import { useNav } from '../App'
import { useLayerBack } from '../useBackHandler'
import Icon from '../components/Icon'
import FoodIconPicker from '../components/FoodIconPicker'
import TextTile from '../components/TextTile'
import CropSheet from '../components/CropSheet'
import Portal from '../components/Portal'
import PromptSheet from '../components/PromptSheet'
import ConfirmSheet from '../components/ConfirmSheet'
import { guessFoodIcon } from '../components/FoodIcon'
import { CATEGORIES } from '../theme'
import { TAG_LIST } from '../data/seed'
import { guessCategory, cropSquare, clampGraphemes, openExternal } from '../utils'
import { ocrImage, getOcrNote, getOcrLeft, KEY_NAME, KEY_SHORT, KEY_UNIT, keyCount } from '../ocr'
import { parseRecipeText, cleanMemo, isGibberish, stripLeadingOcrJunk, keepRaw } from '../parseRecipe'
import { tidyRecipe, mergeTidy, tidyTail, tidyFounder, AI다듬는중 } from '../tidy'
import { normalizeNumerals } from '../ocrCorrect'
import { embedUrl } from '../embed'
// 🗄 저장된 사진은 「큰 창고」(IndexedDB)에 있고 상태엔 쪽지만 남는다 — 편집기는 열 때 꺼내 온다
import { 창고에있나, 창고표시, 꺼내기, 그릴수있나 } from '../photoStore'
// 🐻 읽는 중 — 기다리는 자리엔 «움직이는» 애가 있어야 안 끈다.
//    ⛔ `ui/gom_clap` 은 **옛 매끈 곰**이라 안 쓴다(창업자 2026-08-13 *"쟤 옛날 곰이야"*) → 물결 정본.
//    ⭐ 냄비 젓는 컷 — 「멈춰 있지 않고 뭔가 «하고 있다»」가 그림으로 보인다(동그라미 하나보다 세다).
import uiGomPot from '../assets/ui/wave/gom_pot.png'

// 특정 칸(재료/만드는 법)에 넣을 때는 분류하지 않고, 읽은 줄을 그대로 정리만 한다.
// 사용자가 "이 사진은 재료다/만드는 법이다"라고 이미 지정했으니 다시 쪼개지 않는다.
function cleanOcrLines(text) {
  return normalizeNumerals(String(text))
    .split('\n')
    .map((l) => l.replace(/^\s*[-*•·▪◦‣●○]\s*/, '').replace(/^\d{1,2}\s*[.)]\s*/, '').trim())
    .map((l) => stripLeadingOcrJunk(l, true)) // 맨앞 아이콘 오독(삐·뽀·0·\·AINE…) 제거 — 자동분류 경로와 동일하게
    .filter((l) => l.length > 1 && !isGibberish(l))
}

const DIFFS = ['쉬움', '보통', '어려움']
// 재료·만드는 법 칸의 '📷 사진에서 채우기' 버튼 — 채워질 칸 바로 옆이 제일 직관적이라 크고 진하게
const fieldOcrBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 14px', borderRadius: 999, background: 'var(--brown)',
  color: '#fff', fontSize: 16, fontWeight: 700,
  boxShadow: '0 2px 8px rgba(90,70,45,0.18)',
}
const THUMB_TYPES = [
  { key: 'icon', label: '아이콘' },
  { key: 'label', label: '글자' },
  { key: 'photo', label: '사진' },
  { key: 'none', label: '없음' },
]

export default function EditorScreen({ id, prefill }) {
  const { recipes, folders, addRecipe, updateRecipe, addFolder } = useStore()
  const nav = useNav()
  const editing = recipes.find((r) => r.id === id)
  const photoRef = useRef(null) // 썸네일용 사진
  const ocrRef = useRef(null) // 글자 읽기용(썸네일과 별개)
  const [ocr, setOcr] = useState({ busy: false, pct: 0, page: 1, total: 1 })
  const [cropImg, setCropImg] = useState(null) // 글자 읽기 전 '자르기' 단계
  const ocrTargetRef = useRef('all') // 'all' | 'ingredients' | 'steps' — 어느 칸에 채울지
  // ⏳⏳⏳ **[2026-08-16] 「자르기」와 「읽기」를 떼어놓았다** — 창업자 *"레시피 2장 안내시 로딩 오래걸리는거"*
  //   🔬 실측(`scripts/_measure-스캔시간-0816.mjs`) = **2장째 자르기 화면은 1장째 «읽기가 끝나야» 떴다.**
  //      그래서 유저는 1장째 읽는 내내 **아무것도 못 하고 막대만 본다.** 서버가 3초면 3초를 통째로 버린다.
  //   ⭐⭐ 고침 = **자를 건 바로 이어서 자르게 하고, 읽기는 뒤에서 한 장씩 돌린다.**
  //      2장째를 자르는 «사람 시간»(대개 3~10초) 동안 1장째가 읽히니 기다림이 한 장치 사라진다.
  //   ⛔ 읽기 자체는 여전히 **한 번에 한 장**이다 — tesseract 워커가 «하나»라 겹쳐 돌리면 서로 망가진다.
  const ocrQueue = useRef([]) // 아직 «자르지» 않은 이미지들
  const ocrJobs = useRef([]) // 잘렸고 «읽기»를 기다리는 것들 — [{ img, idx }]
  const ocrParts = useRef([]) // 읽은 글자를 «고른 순서대로» 담는다(끝나는 순서가 아니라)
  const ocrCropped = useRef(0) // 지금까지 자른 장 수 = 다음 장의 자리(idx)
  const ocrCropOpen = useRef(false) // 자르기 화면이 지금 떠 있나 — 마무리를 미룰지 판단
  const ocrAccum = useRef('') // 'all' 자동분류용 — 여러 장의 인식 텍스트를 모아 한 번에 파싱
  // 👁👁 [창업자 판정 2026-09-01 = ⓒ] AI 에게 «글자와 함께 사진»을 준다.
  //   ⛔ 그 전엔 사진을 읽고 «버렸다» — 그래서 AI 가 「생가즈 조그」를 짐작으로 고쳤고
  //      멀쩡한 말까지 바꿨다(2026-08-31 사고 · 「끼얹어」→「끓여」).
  //   ⭐ 첫 장 «한 장»만 들고 있는다 — 레시피 캡처는 첫 장에 제목·재료가 있고,
  //      여러 장을 보내면 뉴런이 장 수만큼 나간다.
  //   ⛔⛔ **`localStorage` 에 넣지 않는다** — 좁아서 저장이 통째로 막힌다(store.jsx:698).
  //      화면에 머무는 «동안»만 `useRef` 로 들고 있다가 정리가 끝나면 버린다.
  const shotAccum = useRef('')
  const ocrBusy = useRef(false) // 지금 읽는 중인가 — 화면 표시는 ocr.busy, «판단»은 이 ref 로
  const ocrTotal = useRef(1) // 이번에 고른 장 수 — 「2장 중 1장째」를 알려주려고(창업자: "시간은 좀 걸림")
  // 🔢🔢 «한 묶음 = 1장» — 이 편집 화면 한 번(=레시피 하나)이 한 묶음이다.
  //   ⭐ 그래서 재료 칸에 한 번, 만드는 법 칸에 한 번, 잘못 잘라 다시 한 번 읽어도 **장수는 1장**만 빠진다.
  //   (창업자 확정 2026-08-13 — *"2장 썼는데 4장 나오면 문제"*)
  //   ⚠️ `useRef(초기값)` 이라 화면을 새로 열 때마다 새 묶음이 된다 = 레시피마다 따로 센다.
  const ocrBatch = useRef(
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36)
    ).replace(/-/g, '').slice(0, 32),
  )
  // 🆓🆓 [창업자 확정 2026-08-29] **이 화면이 「무료로 읽기」로 열렸나** — 열쇠를 안 쓴다.
  //   ⭐ 가져오기의 「그냥 읽기」 단추가 `prefill.noVision` 을 실어 보낸다(`ImportScreen.jsx`).
  //   ⚠️ `useRef` 라 화면을 여는 «그 순간»에 굳는다 — 읽는 도중에 바뀌지 않는다.
  //      ⛔ state 로 두면 다시 그려질 때마다 흔들려서, 여러 장을 읽는 «중간»에 갈래가 바뀔 수 있다.
  //   ⛔ 편집 화면 «안»의 캡처 단추는 이걸 안 탄다(`prefill` 이 없다) — 거긴 지금처럼 열쇠를 쓴다.
  //      창업자 확정 = 열쇠 쓰는 길과 공짜 길이 «둘 다» 살아 있어야 한다.
  const ocrNoVision = useRef(!!prefill?.noVision)
  const ingRef = useRef(null) // 재료 입력칸
  const stepRef = useRef(null) // 만드는 법 입력칸
  const titleRef = useRef(null) // 제목 입력칸 — 제목 없이 저장 누르면 여기로 데려간다
  // 🖐 이 아이콘을 «사람이 직접 골랐나» — 골랐으면 제목이 바뀌어도 지킨다.
  //   ⛔ 2026-08-05 창업자 제보: 「새로운 음식으로 직접 바꾸고 저장하면 안 바뀜.
  //      다시 들어가서 또 누르면 바뀜」 → 제목까지 손보는 날엔 직접 고른 게 통째로 버려졌다.
  //      (v8.58 의 「제목 바꾸면 아이콘 재추천」이 «직접 고른 것»까지 덮고 있었다.
  //       두 번째엔 제목이 이미 고쳐져 있어 그대로 남는다 — 그래서 「한 번엔 안 바뀐다」로 보였다.)
  //   📌 자동 추천분만 다시 추천하고, 손으로 고른 것은 안 건드린다.
  const [iconPicked, setIconPicked] = useState(() => !!editing?.iconPicked)
  // 해당 칸 커서 위치에 단위/수량을 넣는다. 영어 키보드 전환 없이 g·t·T 를 톡 넣기 위함.
  const insertUnit = (u, ref, field) => {
    const el = ref.current
    const v = f[field]
    const start = el ? el.selectionStart : v.length
    const end = el ? el.selectionEnd : start
    set(field, v.slice(0, start) + u + v.slice(end))
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      const pos = start + u.length
      try { el.setSelectionRange(pos, pos) } catch { /* noop */ }
    })
  }
  // 🥄 [창업자 확정 2026-09-03] *"큰술로 통일하자. 스푼 다 빼고"*
  //   ⛔⛔ 전엔 「T」와 「큰술」이 **둘 다** 있었다 — 같은 뜻인데 «고를 답이 둘»이라 갈릴 수밖에 없었다.
  //      📮 창업자 = *"어떤건 T고 어떤건 큰술이고 헷갈려"* — 뿌리가 이 줄이다.
  //   ⭐ 「스푼」은 원래 여기 «없었다» — 그런데 레시피 글엔 21편이 쓰고 있었다(붙여넣기로 들어온 것).
  //      그건 `parseRecipe.js` 의 `단위통일()` 이 담길 때 큰술로 고른다.
  const UNITS = ['g', 'ml', '큰술', '작은술', '컵', '개', '약간']
  // (계량 버튼 바는 return 하단에서 Portal 로 body 에 직접 렌더한다 — transform 부모 밖이라 위치가 안정적)
  // 위에 고정해 두고 보면서 쓰기 — 'video'(유튜브·인스타) | 'photo'(캡처 원본) | null
  // 저장된 레시피를 다시 편집할 때도 사진이 있으면 참고용으로 띄울 수 있게 한다.
  const [refs, setRefs] = useState(() => {
    if (prefill?.refImages?.length) return prefill.refImages
    if (editing?.image) return [editing.image]
    return []
  })
  // 📌📌 **덜 정리된 레시피를 열면 캡처를 «이미 고정된 채로» 띄운다** (창업자 2026-09-02)
  //   📮 창업자 = *"그 원본은 맨 아래에 있잖아. **그걸 스크롤하면서 보고 채워??**"*
  //   ⛔ 그 전엔 `pin` 이 `null` 이라 **「보면서 쓰기」를 «눌러야»** 사진이 떴다.
  //      덜 읽힌 걸 채우러 온 사람은 **원본을 볼 게 확실한데** 한 번 더 누르게 하고 있었다.
  //   ⭐ 조건 = 「아직 정리 전(`unsorted`) ＋ 사진이 있다」 — 그 둘이면 «보러 온 것»이 확실하다.
  //      임시보관함 「채우러 가기」로 오든 상세 편집으로 오든 같으므로 **길을 안 나눈다.**
  //   ⛔ 정리 끝난 레시피는 안 띄운다 — 그건 «고치러» 온 게 아니라 손보러 온 것이라 화면을 뺏으면 안 된다.
  //   ⏳ 사진이 «없는» 편(붙여넣기)은 글자 원문이 아직 맨 아래에 있다 — 별건으로 남긴다.
  const [pin, setPin] = useState(
    prefill?.watch ? 'video'
      : prefill?.refImages?.length ? 'photo'
        : (editing?.status === 'unsorted' && editing?.image) ? 'photo'
          : null
  )
  const [zoom, setZoom] = useState(false) // 캡처 원본 전체화면으로 크게 보기
  const [photoFold, setPhotoFold] = useState(false) // 사진만 접기 — 손잡이 줄은 남는다(가려진 입력칸 보기)
  // ⭐ 여러 장일 때 «몇 번째 장을 보고 있나». 예전엔 두 장을 세로로 쌓아놨는데,
  //    폰 캡처는 2340px 이라 34vh(≈290px) 창에서 둘째 장은 850px 아래 = 사실상 못 찾는다.
  //    창업자 2026-08-02: *"2장 중에 보고 쓸 때는 1장만 보여."* — 없어진 게 아니라 «못 가는» 것이었다.
  const [shot, setShot] = useState(0)
  const shotIdx = Math.min(shot, Math.max(0, refs.length - 1))
  // 핀 고정 캡처가 34vh 안에서 세로 스크롤되는데 신호가 없어 '잘림/고정'으로 오해 → 더 볼 게 있으면 하단 fade
  const [photoMore, setPhotoMore] = useState(false)
  const photoBoxRef = useRef(null)
  const checkPhotoScroll = () => {
    const el = photoBoxRef.current
    if (el) setPhotoMore(el.scrollHeight - el.scrollTop - el.clientHeight > 6)
  }
  useEffect(() => { const id = setTimeout(checkPhotoScroll, 80); return () => clearTimeout(id) }, [pin, refs.length, photoFold])
  const [newFolder, setNewFolder] = useState(false)
  const [discardAsk, setDiscardAsk] = useState(false) // 작성 중 나가기 = 버릴지 물어본다
  const [rawOpen, setRawOpen] = useState(false) // 📥 「사진에서 읽은 원문」 접힘/펼침
  // 🚨 저장이 «실패»했다 — 화면에 빨간 띠로 남긴다(토스트는 지나가면 못 본다)
  const [saveFailed, setSaveFailed] = useState(false)
  const [다듬는중, set다듬는중] = useState(false) // 🤖 「AI로 다시 다듬기」가 도는 동안
  // 📥 [2026-08-22] 파서에 넣은 «원문» — 화면엔 안 보이고 저장만 된다.
  //    파서를 고친 날 「다시 읽기」로 되살릴 재료다(→ `parseRecipe.js` 의 `keepRaw` 주석).
  //    ⛔ 편집으로 들어왔는데 원문이 없으면 «빈 값으로 덮지» 않는다 — 없는 값으로 덮는 건 지우는 것이다(규칙 18 ⓙ).
  const [rawText, setRawText] = useState(() => editing?.rawText || prefill?.rawText || '')

  const [f, setF] = useState(() => {
    const e = editing
    const p = !editing && prefill ? prefill : {}
    const ing = e?.ingredients ?? p.ingredients ?? []
    const stp = e?.steps ?? p.steps ?? []
    const title = e ? (e.title && e.title !== '새 레시피' ? e.title : e.title || '') : p.title || ''
    const built = {
      title,
      // 썸네일 표시 방식: 기본은 아이콘(사진은 '글자 읽기'용으로 분리).
      // 예전 레시피는 이미지가 있으면 사진 유지.
      // ⭐ 잣대는 `store.js` 의 `기본표지()` 하나 — 캡처(source: 'photo')는 표지로 안 쓴다
      thumb: 기본표지(e || {}),
      icon: e?.icon || '',
      label: e?.label || '',
      image: e?.image ?? p.image ?? null,
      emoji: e?.emoji || '🍽️',
      category:
        e?.category && e.category !== '전체'
          ? e.category
          : guessCategory((title || '') + ' ' + (p.memo || '')),
      time: e?.time || '',
      servings: e?.servings || '',
      difficulty: e?.difficulty || '쉬움',
      ingredients: ing.join('\n'),
      steps: stp.join('\n'),
      tags: e?.tags || [],
      folder: e?.folder || e?.category || '한식',
      memo: e?.memo ?? p.memo ?? '',
      sourceUrl: e?.sourceUrl || p.sourceUrl || '',
      source: e?.source || p.source || 'manual',
    }
    // 새 레시피 작성 중이었다면(편집·prefill 아님) 최근 임시저장분을 복구한다.
    if (!editing && !prefill) {
      try {
        const raw = localStorage.getItem(DRAFT_KEY)
        if (raw) {
          const d = JSON.parse(raw)
          // 초안 복구는 '작성 중이던 글(제목·재료·순서·메모)'만 되살린다. 출처·링크는 물려주지 않음
          // — 예전에 인스타 링크 넣고 나간 초안이 새 사진 레시피에 'Instagram에서 가져옴'으로 새던 버그 방지.
          if (d && d.ts && Date.now() - d.ts < 2 * 3600 * 1000 && d.f) return { ...d.f, sourceUrl: '', source: 'manual' }
        }
      } catch { /* noop */ }
    }
    return built
  })

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))

  // 🗄🗄 **편집기는 사진을 «펼쳐서» 다룬다 — 열 때 창고에서 꺼내 온다** (2026-09-02)
  //
  //   ⛔⛔ 앱을 껐다 켜면 `editing.image` 는 **쪽지**(`idb://…`)다. 그대로 두면 이 화면에서 셋이 깨진다 —
  //      ⑴ 74px 표지 칸이 빈 칸 ⑵ **「캡처 보면서 쓰기」가 아무것도 안 보여준다**(refs)
  //      ⑶ 「AI 로 다시 다듬기」가 사진을 못 보낸다(`data:` 가 아니라 안 보낸다)
  //   ⭐ 여긴 목록이 아니라 **한 편만 여는 화면**이라 «한 장»만 꺼내면 된다 — 값이 싸다.
  //   ⭐ 꺼낸 뒤 그대로 저장해도 안전하다 — 저장할 때 `store.jsx` 가 **같은 열쇠**로 다시 창고에 넣는다.
  useEffect(() => {
    const 쪽지 = 창고에있나(f.image) ? f.image : null
    if (!쪽지) return
    let 살아있나 = true
    ;(async () => {
      try {
        const 진짜 = await 꺼내기(쪽지.slice(창고표시.length))
        if (!살아있나 || !진짜) return
        setF((p) => (p.image === 쪽지 ? { ...p, image: 진짜 } : p))
        // 👁 보면서 쓰기 창도 같은 쪽지를 들고 있으면 같이 갈아 끼운다
        setRefs((전) => 전.map((v) => (v === 쪽지 ? 진짜 : v)))
      } catch { /* 못 꺼내면 지금까지처럼 «사진 없이» 편집한다 — 글자는 그대로 산다 */ }
    })()
    return () => { 살아있나 = false }
  }, [f.image])

  const [focusField, setFocusField] = useState(null) // 'ingredients'|'steps' — 계량 바를 띄울 대상
  // 지금 포커스된 요소가 재료/순서 칸일 때만 계량 바를 띄운다.
  // focusin/out 으로만 판단 → 깜빡임(리마운트·blur 타이머) 없이 안정적.
  useEffect(() => {
    const sync = () => {
      const el = document.activeElement
      setFocusField(el === ingRef.current ? 'ingredients' : el === stepRef.current ? 'steps' : null)
    }
    const onOut = () => requestAnimationFrame(sync) // 포커스가 빠질 때 다음 프레임에 재확인
    document.addEventListener('focusin', sync)
    document.addEventListener('focusout', onOut)
    return () => { document.removeEventListener('focusin', sync); document.removeEventListener('focusout', onOut) }
  }, [])
  // 전체보기(zoom) 오버레이 — 뒤로가기로 닫기. (크롭 시트는 CropSheet 가 자체 처리)
  useLayerBack(zoom !== false, () => setZoom(false))

  // 쓰던 내용이 있나 — 자동 임시저장과 '버릴까요?' 확인이 같은 기준을 쓰게 한 곳에서 판단한다.
  const hasDraftContent = !!(f.title.trim() || f.ingredients.trim() || f.steps.trim() || f.memo.trim() || f.sourceUrl.trim())

  // 작성 중 자동 임시저장 — 텍스트만(사진은 무겁고 텍스트가 핵심). 편집 모드는 제외.
  useEffect(() => {
    if (editing) return
    try {
      // 📝📝 **주석대로 «글자만» 담는다** (2026-09-02 · 코드를 주석에 맞췄다)
      //   ⛔⛔ 그 전엔 `f` 를 통째로 담아서 **`f.image`(사진 data URL)가 같이 들어갔다.**
      //      바로 윗줄 주석은 *"텍스트만(사진은 무겁고 텍스트가 핵심)"* 인데 **코드가 딴짓을 하고 있었다.**
      //      ⚠️ 게다가 **글자 한 자 칠 때마다** 통째로 다시 쓴다 — 사진이 있으면 그만큼 매번 쓴다.
      //   ⭐ 사진은 원래 초안으로 지킬 값이 아니다(다시 고르면 된다). 글자가 핵심이다.
      const { image: _사진뺌, ...글자만 } = f
      if (hasDraftContent) localStorage.setItem(DRAFT_KEY, JSON.stringify({ ts: Date.now(), f: 글자만 }))
      else localStorage.removeItem(DRAFT_KEY)
    } catch { /* noop */ }
  }, [f, editing, hasDraftContent])
  const toggleTag = (t) => set('tags', f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t])
  const embed = embedUrl(f.sourceUrl) // 유튜브·인스타 링크면 '보면서 쓰기' 가능

  // 썸네일용 사진 — 아이콘 크기에 맞춰 정사각으로 예쁘게 잘라 저장한다. (OCR 안 함)
  const onPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const cropped = await cropSquare(reader.result, 800)
      set('image', cropped)
      set('thumb', 'photo')
      nav.showToast('사진을 아이콘 크기로 다듬었어요')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // 글자 읽기용 사진 — 자르기(광고·그림 제외)를 거쳐 채운다. 썸네일은 그대로.
  // target: 'all'(재료·순서 자동 분류) | 'ingredients'(재료만) | 'steps'(만드는 법만)
  const pickOcr = (target) => {
    ocrTargetRef.current = target
    ocrRef.current?.click()
  }
  // 📥📥 고른 사진들로 «읽기 흐름»을 시작한다 — 자르기 → 인식 → 합치기.
  //   ⭐ 파일 고르기와 갈라 뒀다 — 「가져오기」 화면에서 «먼저» 고른 사진도 같은 길로 들어와야 하는데
  //      (창업자 ③ 「여기서 사진 고르기」), 흐름을 두 번 적으면 한쪽만 고치는 사고가 난다.
  // 🔢🔢 [창업자 확정 2026-08-29] **여러 장은 되게 두고, 많으면 «확인»을 받는다.**
  //   📮 창업자 = *"여러장 할 수 있지만 열쇠가 소모된다는걸 적어주면 좋지않을까?
  //      아니면 5장 올리면 팝업으로 열쇠다섯개가 사용된다고 확인받는건?"*
  //   ⭐ 상한으로 «막지» 않는다 — 긴 레시피는 진짜로 여러 장이 필요하다(2~3컷이 흔하다).
  //   ⛔⛔ 지금까지는 고른 «뒤» 토스트뿐이라 **되돌릴 길이 없었다.** 20장을 고르면 20개가 그냥 깎인다.
  //      팝업은 그 «되돌릴 자리»를 만든다.
  //   ⭐ 2~4장은 지금처럼 토스트로 가볍게 — 매번 물으면 그게 잔소리가 된다(창업자 잣대: ⛔재촉·잔소리 금지).
  const 확인문턱 = 5
  const [manyAsk, setManyAsk] = useState(null) // { urls } — 확인 기다리는 중
  const startOcr = (urls) => {
    if (!urls || !urls.length) return
    if (urls.length >= 확인문턱 && !ocrNoVision.current) { setManyAsk({ urls }); return }
    시작하기(urls)
  }
  const 시작하기 = (urls) => {
      ocrAccum.current = ''
      // 👁 [ⓒ] 새로 고르면 «앞 판의 사진»을 버린다 — 안 버리면 옛 사진과 새 글자를 짝지어 준다.
      //   ⛔ 그게 제일 나쁜 종류다: AI 가 「사진과 다르다」며 멀쩡한 글자를 고쳐 버린다.
      shotAccum.current = ''
      ocrTotal.current = urls.length
      ocrQueue.current = urls.slice(1) // 첫 장은 지금 자르고, 나머지는 자르기 대기열
      ocrJobs.current = []
      ocrParts.current = []
      ocrCropped.current = 0
      // 📢 «고른 직후» 몇 장 쓰는지 알린다 — 창업자 *"한번에 2장 넣으면 2장소진된다는 것도 알려야겠네"*
      //   ⛔⛔ **지금은 사진 «한 장마다» 1장씩 빠진다.** 「한 묶음 = 1장」 코드는 다 만들어 뒀지만
      //      **worker 를 아직 서버에 안 올렸다**(창업자 2026-08-13 *"리스크를 감수하고싶진않은데"*
      //      → *"2장레시피 잘없기도하고 있어도 50원이야"*). 8/16 재신청 사흘 앞이라 서버를 안 건드린다.
      //      ⭐ 그러니 이 문구가 «지금 서버»와 맞다. 서버를 올리는 날 「1장만 써요」로 바꾼다.
      //   ⚠️ 안내 없이 깎으면 「여러 장을 한꺼번에 골라도 돼요」로 권해놓고 «몰래» 깎는 꼴이 된다.
      //   ⚠️ 한 장일 땐 안 띄운다 — 잔소리가 된다(⛔재촉 금지).
      if (urls.length > 1) {
        const left = getOcrLeft().total
        nav.showToast(
          left >= urls.length
            ? `사진 ${urls.length}장이라 ${keyCount(urls.length)}를 써요`
            : `${KEY_SHORT}가 ${left}${KEY_UNIT} 남아서 ${left}장만 AI로 읽어요`,
          5200,
        )
      }
      ocrCropOpen.current = true
      setCropImg(urls[0])
  }

  // 여러 장 선택 지원 — 긴 레시피(2~3컷)를 한꺼번에 골라 한 장씩 크롭→인식→합쳐서 정리.
  const onOcrFile = (e) => {
    const files = [...(e.target.files || [])]
    if (!files.length) return
    e.target.value = ''
    Promise.all(
      files.map((f) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f) })),
    ).then(startOcr)
  }

  // 📷 「가져오기 → 여기서 사진 고르기」로 들어온 경우 — 이미 고른 사진이 딸려 온다.
  //   ⭐ 창업자 ③ = *"한끼앱에 가져오기에서 사진 가져오기"*. 고르기는 그 화면에서 «손짓»으로 끝냈고
  //      여기서는 읽기만 이어받는다.
  //   ⛔ 딱 한 번만 — `ocrTargetRef` 를 'all' 로 두고 시작한다(재료·만드는 법 자동 분류).
  const 딸려온사진Ref = useRef(false)
  useEffect(() => {
    if (딸려온사진Ref.current) return
    const urls = prefill?.ocrImages
    if (!urls || !urls.length) return
    딸려온사진Ref.current = true
    ocrTargetRef.current = 'all'
    startOcr(urls)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 한 칸에만 이어붙이기 — 이미 내용이 있으면 아래에 덧붙인다(2단·긴 레시피 대응).
  const appendLines = (prevText, lines) => {
    const base = prevText.trim()
    const add = lines.join('\n').trim()
    if (!add) return prevText
    return base ? base + '\n' + add : add
  }

  // ✂️ 한 장을 «다 잘랐다» — 읽기는 뒤에 맡기고, 자를 게 남았으면 **바로** 다음 자르기를 띄운다.
  //   ⭐⭐ 여기가 이번 고침의 핵심이다. 예전엔 이 자리에서 `await` 로 읽기를 끝까지 기다렸다.
  const onCropped = (img) => {
    if (!img) return
    // 👁 [ⓒ] **잘라낸 «첫 장»을 들고 있는다** — 이따 AI 에게 글자와 «같이» 준다.
    //   ⭐ 자른 뒤라서 화면 글자(통신사·시계·댓글)가 이미 빠져 있다 = 모델이 볼 것이 깨끗하다.
    //   ⛔ 첫 장만이다 — 여러 장을 보내면 뉴런이 장 수만큼 나간다(실측 82.5/장).
    if (!shotAccum.current && typeof img === 'string') shotAccum.current = img
    ocrJobs.current.push({ img, idx: ocrCropped.current })
    ocrCropped.current += 1
    if (ocrQueue.current.length) {
      ocrCropOpen.current = true
      setCropImg(ocrQueue.current.shift()) // 👉 사람은 다음 장을 자른다 · 앞 장은 뒤에서 읽힌다
    } else {
      ocrCropOpen.current = false
    }
    pumpOcr()
  }

  // 🔁 읽기 펌프 — 잘린 것을 **한 번에 한 장씩** 읽는다.
  //   ⛔ 겹쳐 돌리지 않는다 — 기본 인식(tesseract) 워커가 «하나»라 동시에 시키면 서로 설정을 덮어쓴다.
  const pumpOcr = async () => {
    if (ocrBusy.current) return // 이미 돌고 있으면 그 펌프가 이어서 다 처리한다
    const target = ocrTargetRef.current || 'all'
    const total = ocrTotal.current
    ocrBusy.current = true
    // ⛔ `try/finally` 로 감싼다 — 여기서 무엇이 터져도 `ocrBusy` 가 true 로 «굳으면»
    //    남은 장이 영영 안 들어오고 단추도 계속 흐린 채로 남는다(옛 판에서 실제로 났던 사고).
    try {
      while (ocrJobs.current.length) {
        const { img, idx } = ocrJobs.current.shift()
        // 「2장 중 1장째」 — 얼마나 남았는지 모르면 기다림이 두 배로 길게 느껴진다
        const page = Math.min(total, idx + 1)
        setOcr({ busy: true, pct: 0, page, total })
        let text = ''
        try {
          // 🆓 `noVision` 이면 구글 AI 를 건너뛰고 기본 인식으로만 읽는다 = 열쇠가 안 깎인다
          text = await ocrImage(img, (pct) => setOcr({ busy: true, pct, page, total }), { batch: ocrBatch.current, noVision: ocrNoVision.current })
        } catch {
          // ⛔ 한 장이 실패해도 «남은 장은 계속 간다».
          text = ''
        }
        if (target === 'ingredients' || target === 'steps') {
          // 지정한 칸에만 — 읽은 줄을 정리해 이어붙인다(여러 장이면 계속 쌓인다).
          const lines = cleanOcrLines(text)
          if (lines.length) setF((prev) => ({ ...prev, [target]: appendLines(prev[target], lines) }))
        } else {
          // ⭐ 자동 분류는 «고른 순서»로 담는다 — 끝나는 순서로 이어붙이면 재료·순서가 뒤바뀔 수 있다.
          ocrParts.current[idx] = text
        }
      }
    } finally {
      ocrBusy.current = false
      setOcr({ busy: false, pct: 0, page: total, total })
    }
    // 아직 자를 게 남았으면 마무리하지 않는다 — 다 자르고 다 읽은 뒤에 한 번만 정리한다.
    if (ocrCropOpen.current || ocrQueue.current.length) return
    finishOcr()
  }

  // 🏁 다 읽었다 — 모아둔 글자를 칸에 넣고 안내한다.
  // ⚠️ 2026-08-29 부터 async — 안에서 🤖AI 다듬기를 기다린다(실패하면 규칙 파서 그대로).
  //   ⭐ 부르는 두 곳(337줄·1025줄) 다 결과를 안 쓰므로 await 를 안 붙여도 된다.
  const finishOcr = async () => {
    const target = ocrTargetRef.current || 'all'
    ocrAccum.current = ocrParts.current.filter((t) => t && t.trim()).join('\n').trim()

    // 🆓🆓 [창업자 확정 2026-08-29] **「그냥 읽기」로 들어왔으면 «열쇠 얘기를 아예 안 한다».**
    //   📮 창업자 = *"3번은 열쇠다썼지만 무료로 쓰고싶은 사용자들이 거의 쓰겠네 **안내도 잘해줘야 할 듯.**"*
    //
    //   ⛔⛔ 이 줄이 없으면 **안 썼는데 잔량 얘기가 뜬다.** 프록시를 안 불렀으니
    //      `getOcrNote()` 는 null 이고 `getOcrLeft()` 는 «남은 장수 그대로»라
    //      「무료 레시피열쇠 1개 남았어요」가 붙는다 → 유저는 **「어? 열쇠 썼나?」** 로 읽는다.
    //      📌 공짜라고 해놓고 돈 얘기를 꺼내는 게 제일 나쁘다(분쟁 1순위 = *"샀는데 어디 갔지"*).
    //
    //   ⭐ 대신 창업자가 콕 집은 «두 가지»를 말한다 —
    //      ⑴ **열쇠를 안 썼다**(고른 대로 됐다는 확인) ⑵ **덜 읽힐 수 있다**(인식률 차이)
    //      📮 어제 창업자 = *"기본인식이라 **인식률의 차이가 잇으니까 이부분을 집어줘야해**
    //         그래야 무료유저도 안떠나"*
    //   ⭐ 「사진 보며 고쳐 주세요」로 닫는 게 핵심이다 — 이 길은 사진이 **저절로 떠 있어서**
    //      바로 고칠 수 있다. 「덜 읽혔다」만 말하고 끝내면 그건 그냥 나쁜 소식이다.
    const freeTail = ocrNoVision.current ? ' · 열쇠 안 쓰고 읽어서 덜 정확해요' : ''

    // (마지막 장) 프록시 한도 안내 — 무료 소진 등이면 "기본 인식으로 진행됐어요" 꼬리를 붙인다.
    //   ⛔ `noVision` 이면 프록시를 «안 불렀으므로» 이 값들은 이번 읽기와 무관하다 → 통째로 죽인다.
    const note = ocrNoVision.current ? null : getOcrNote() // 'user_quota' | 'global_quota' | 'rate_limited' | null
    const quotaTail =
      note === 'user_quota'
        ? ` · 무료 ${KEY_NAME}를 다 써서 기본 인식이에요`
        : note === 'global_quota' || note === 'rate_limited'
          ? ' · 지금 이용이 많아 기본 인식이에요'
          : ''

    // 📢 남은 장수 알림 — 창업자 *"20장을 다쓰면 다썼다고 알려줘야해 무료서비스로 변경된다고"*
    //   ⭐ 「막힌 다음」이 아니라 «마지막 장을 쓴 그 순간» 알린다. 그래야 한 박자 늦지 않다.
    //   ⭐⭐ 미리 알림은 «1장 남았을 때 한 번만** (창업자 *"어차피 유저도 알잖아 쓰면서 몇장남았는지"*)
    //      ⛔ 3장·1장 두 번은 안 한다 — 가져오기 화면 뱃지가 이미 잔량을 보여줘서 잔소리가 된다.
    const leftNow = getOcrLeft()
    const leftTail = quotaTail || ocrNoVision.current // 🆓 안 썼으면 잔량 얘기를 꺼내지 않는다
      ? ''
      : leftNow.total === 0
        ? ` · 무료 ${KEY_NAME}를 다 썼어요 · 이제 기본 인식으로 계속 돼요`
        : leftNow.total === 1
          ? ` · 무료 ${KEY_NAME} 1${KEY_UNIT} 남았어요`
          : ''

    // 마지막 장 — 결과 반영
    if (target === 'ingredients' || target === 'steps') {
      const base = target === 'ingredients' ? '재료 초안을 담았어요' : '만드는 법 초안을 담았어요'
      nav.showToast(base + (freeTail || quotaTail || leftTail || ' · 다듬어 주세요'), freeTail || quotaTail || leftTail ? 6500 : 4800)
      return
    }
    const combined = ocrAccum.current
    // 🆓 freeTail = 「그냥 읽기」로 왔다(열쇠를 안 썼다) — 열쇠 얘기보다 «먼저» 말한다
    if (!combined.trim()) { nav.showToast('사진에서 글자를 찾지 못했어요' + (freeTail || quotaTail), freeTail || quotaTail ? 6000 : 3200); return }
    // 🤖 AI 다듬기 — ⭐**규칙 파서를 «먼저» 돌려놓는다.**
    //   AI 가 안 되든 느리든 이상하든 이 `r` 이 그대로 쓰인다(3층 구조 1층 · 앱은 절대 안 죽는다).
    //   ⛔ 순서를 뒤집지 말 것 — AI 를 먼저 기다렸다가 실패하면 그때 파싱하면, 실패한 만큼 유저가 더 기다린다.
    let r = parseRecipeText(combined, { fromOcr: true })
    // ⛔ 열쇠는 여기서 «안» 깎는다 — 위에서 `ocrImage` 가 이미 깎았다(카운트는 한 곳에서만).
    setRawText(keepRaw(combined) || '') // 📥 읽어들인 글자 그대로 — 파서를 고친 날 다시 읽을 재료

    // ⏱⏱⏱ **[2026-08-29 오후 · 창업자 갈래 ⓒ] 「AI 를 기다리지 않는다」**
    //   ⛔⛔ 전엔 `await tidyRecipe()` 가 여기를 막아서, **이미 손에 쥔 규칙 파서 결과를**
    //      AI 가 끝날 때까지 화면에 안 내놨다(창업자 폰 실측 = 30초를 세워두고 `timeout`).
    //   ⭐⭐ 이제 ①규칙 파서로 «즉시» 채우고 ②AI 가 오면 조용히 갈아끼운다.
    //   ⭐ **유저가 그 사이에 손으로 고친 칸은 안 건드린다** — ②는 「①이 넣은 값 그대로인 칸」만 바꾼다.
    //      (빈 칸을 안 덮는 규칙 `prev.x || r.x` 만으로는 ②가 영영 못 들어온다 — ①이 이미 채웠으니까)
    //   ⛔ `await` 를 되살리지 말 것 · 🔒 `scripts/_repro-AI다듬기-0829.mjs` 가 이 자리를 잰다.
    let 내가넣은 = null
    const 채우기 = (r2) => {
      setF((prev) => {
        const 안건드린 = (키, 값) => !prev[키].trim() || (내가넣은 && prev[키] === 내가넣은[키]) ? 값 : prev[키]
        const next = {
          ...prev,
          title: 안건드린('title', r2.title || prev.title),
          ingredients: 안건드린('ingredients', r2.ingredients.join('\n')),
          steps: 안건드린('steps', r2.steps.join('\n')),
          // 메모는 직접 입력 전용 — 사진에서 읽은 내용을 자동으로 붙이지 않는다.
          memo: prev.memo,
          category:
            prev.category && prev.category !== '한식' && !(내가넣은 && prev.category === 내가넣은.category)
              ? prev.category
              : guessCategory((prev.title || r2.title || '') + ' ' + r2.memo),
        }
        내가넣은 = { title: next.title, ingredients: next.ingredients, steps: next.steps, category: next.category }
        return next
      })
    }

    // ① 규칙 파서 — «즉시»
    채우기(r)
    // 🤖 「AI 가 정리했나」를 «보이게» 붙인다 — 문구는 `tidy.js` 의 `tidyTail()` 한 곳에서 정한다
    //   (여기와 App.jsx 공유받기가 «같은 말»이라야 유저가 두 경로를 같은 기능으로 읽는다)
    nav.showToast(
      // 🆓 freeTail 이 맨 앞이다 — 「그냥 읽기」로 온 사람에게 열쇠 얘기를 하면 안 된다
      // 📢📢 「AI 가 더 다듬는 중」을 **같은 줄에** 붙인다 (창업자 2026-09-01)
      //   ⛔ 따로 띄우면 이 안내(열쇠 잔량)를 «즉시» 덮어 못 보게 된다 — 그래서 꼬리로 «더한다».
      //   ⏱ 그래서 길이(ms)를 «준다» — 20초. 다 되면 아래 결과 토스트가 덮는다.
      (freeTail
        ? '초안을 채웠어요' + freeTail + ' · 사진 보며 고쳐 주세요'
        : quotaTail
          ? '초안을 채웠어요' + quotaTail + ' · 결과를 더 다듬어 주세요'
          : leftTail
            ? '초안을 채웠어요' + leftTail
            : '초안을 채웠어요 · 사진 보며 다듬어 주세요') + AI다듬는중,
      20000,
    )

    // ② AI — «뒤에서». ⭐ 얹는 규칙은 `mergeTidy` 한 곳에 있다(여기와 `App.jsx` 가 «같은 말»)
    //   👁 [ⓒ] 글자와 «함께 사진»을 준다. ⛔사진이 없으면(붙여넣기·직접 작성) 지금과 똑같이 돈다.
    tidyRecipe(combined, shotAccum.current).then((ai) => {
      if (ai) {
        채우기(mergeTidy(r, ai))
        nav.showToast('AI가 레시피를 더 다듬었어요' + tidyTail())
        return
      }
      // ⛔ 실패는 «유저에게 안 알린다» — 이미 채워져 있어 할 일이 0이다. 창업자(운영자)만 이유를 본다.
      if (tidyFounder()) nav.showToast('AI 다듬기는 못 했어요' + tidyTail())
    })
  }

  // 🤖🤖 [2026-09-01] **AI 로 «다시» 다듬기** — 원문(rawText)을 그대로 다시 보낸다.
  //   ⭐ 왜 이 자리인가 = 원문은 2026-08-22 부터 이미 저장되고 있었고(`keepRaw`),
  //      「꺼낼 입구가 없다」가 로드맵에 남아 있던 그 자리다. 원문 «옆»이 제일 자연스럽다.
  //   💰 열쇠 0개 — 사진에서 글자 읽기(`ocr.js`)만 열쇠를 센다. 여긴 글자를 다시 보내기만 한다.
  //   ⛔ 두 번 눌러 두 판이 겹치지 않게 `다듬는중` 으로 막는다(뉴런이 두 배로 나간다).
  const 다시다듬기 = async () => {
    if (다듬는중 || !rawText) return
    set다듬는중(true)
    nav.showToast('AI가 다시 다듬는 중이에요 · 20~60초 걸려요', 6000)
    // ⭐ 규칙 파서를 «먼저» 돌려둔다 — AI 가 분량을 떼먹으면 이걸로 되살린다(`mergeTidy`).
    const 기본 = parseRecipeText(rawText, { fromOcr: true })
    // 👁 사진도 같이(ⓒ) — 방금 자른 캡처가 있으면 그것, 없으면 저장된 표지.
    //   ⛔ dataURL 이 아니면 안 보낸다(`tidy.js` 가 또 한 번 거른다).
    const 표지 = typeof editing?.image === 'string' ? editing.image : ''
    const 사진 = shotAccum.current || (표지.startsWith('data:image/') ? 표지 : '')
    const ai = await tidyRecipe(rawText, 사진)
    set다듬는중(false)
    if (!ai) {
      // ⛔ 여기선 실패를 «유저에게도» 알린다 — 유저가 «직접 눌렀으니» 결과를 알 권리가 있다.
      //    (공유받기 때 조용한 것과 다르다. 거긴 유저가 부른 적이 없다)
      nav.showToast('AI 다듬기는 못 했어요 · 한 번 더 눌러 보세요' + (tidyFounder() ? tidyTail() : ''), 6000)
      return
    }
    const m = mergeTidy(기본, ai)
    setF((prev) => ({
      ...prev,
      title: m.title || prev.title,
      ingredients: m.ingredients.join('\n'),
      steps: m.steps.join('\n'),
      memo: prev.memo,   // ⛔ 메모는 직접 입력 전용 — 여기서도 안 건드린다
      category: guessCategory((m.title || '') + ' ' + m.memo),
    }))
    nav.showToast('AI가 다시 다듬었어요' + tidyTail(), 5200)
  }

  const canSave = f.title.trim().length > 0

  const save = () => {
    // 제목이 없으면 그냥 무시하지 않는다 — 예전엔 버튼을 disabled로 막아서
    // "눌러도 아무 반응 없음 = 저장 먹통"으로 보였다(창업자 제보).
    // 이제는 왜 안 되는지 말해주고 제목 칸으로 직접 데려간다.
    if (!canSave) {
      nav.showToast('제목을 먼저 적어주세요')
      const el = titleRef.current
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => el.focus(), 300) }
      return
    }
    const title = f.title.trim()
    const ings = splitLines(f.ingredients)
    const stps = splitLines(f.steps)
    // 아이콘을 그대로 둘 것인가 = 직접 골랐거나 · 제목이 그대로거나
    const keepIcon = !!f.icon && (iconPicked || title === (editing?.title || ''))
    const patch = {
      title,
      thumb: f.thumb,
      // 아이콘: 제목이 바뀌면 새 제목으로 다시 자동 추천(창업자 제보 — "제목 육회로 바꿔도 아이콘 안 바뀜").
      // ⭐ 단 «직접 고른 것»은 제목이 바뀌어도 지킨다(iconPicked · 창업자 제보 2026-08-05).
      //    자동 추천분만 다시 추천한다 — 그래야 위 두 제보가 둘 다 산다.
      icon: keepIcon ? f.icon : guessFoodIcon(title),
      iconPicked: keepIcon ? iconPicked : false, // 다시 추천된 것은 「자동」으로 되돌린다
      emoji: f.emoji || '🍽️',
      label: clampGraphemes(f.label.trim(), 6),
      image: f.image,
      category: f.category,
      folder: f.folder || f.category,
      time: Number(f.time) || 0,
      servings: Number(f.servings) || 0,
      difficulty: f.difficulty,
      ingredients: ings,
      steps: stps,
      tags: f.tags,
      // 어느 경로로 들어왔든, 재료·순서와 겹치는 메모 줄은 저장 직전에 걸러낸다.
      memo: cleanMemo(f.memo.trim(), ings, stps),
      sourceUrl: f.sourceUrl.trim(),
      source: f.source || 'manual', // 가져온 경로(사진·유튜브 등) 배지를 잃지 않게 저장
      status: 'sorted',
    }
    // 📥 원문은 «있을 때만» 넣는다 — 빈 값을 넣으면 편집할 때마다 옛 원문이 지워진다(규칙 18 ⓙ)
    if (rawText) patch.rawText = rawText
    // 💾💾 **저장이 «진짜로» 됐는지 보고 나서 성공이라 말한다** (창업자 확정 2026-09-02)
    //   📮 창업자 = *"방금 하나 저장한거 흔적도 없이 증발함"* → 판정 = *"저장 안 됐다고 분명히"*
    //   ⛔⛔ 그 전엔 `nav.pop()` ＋ 「저장했어요」를 **바로** 했다. 그런데 저장 공간이 꽉 차면
    //      `store.jsx` 의 쓰기가 실패하고 **메모리에만 남는다** → 화면은 성공이라 말하고 데이터는 사라진다.
    //   ⭐ 그래서 «쓰기가 돌 때까지» 몇 번 물어보고, 성공했을 때만 나간다.
    //      ⛔ 실패면 **화면에 그대로 머문다** — 나가버리면 적던 내용까지 같이 잃는다.
    const 기준 = Date.now()
    const 나갈까 = (성공했을때) => {
      let 남은판 = 12   // 약 480ms — React 가 그리고 저장 effect 가 돌 시간
      const 물어본다 = () => {
        if (방금저장됐나(기준)) { 성공했을때(); return }
        if (--남은판 > 0) { setTimeout(물어본다, 40); return }
        // ⛔ 여기까지 왔으면 «저장이 안 된 것»이다 — 성공이라 말하지 않는다
        setSaveFailed(true)
        nav.showToast('저장 공간이 가득 차서 «저장되지 않았어요» · 설정에서 백업한 뒤 사진을 정리해 주세요', 8000)
      }
      setTimeout(물어본다, 40)
    }
    if (editing) {
      // touched: 사용자가 직접 편집한 레시피 — 이후 기본 레시피 자동 갱신에서 덮어쓰지 않게 표시
      const 임시보관함이었나 = editing.status !== 'sorted'
      updateRecipe(editing.id, { ...patch, touched: true })
      나갈까(() => {
        nav.pop()
        nav.showToast('레시피를 정리했어요')
        // 🙏 «임시보관함에서 막 꺼낸 것»만 한마디를 청한다 — 그게 「담기를 끝낸」 순간이다.
        //   ⛔ 이미 정리된 편을 고칠 때는 안 청한다 — 오타 하나 고쳤는데 리뷰를 물으면 조르는 앱이 된다.
        if (임시보관함이었나) nav.askReviewSoon?.()
      })
    } else {
      const rec = { id: newId(), favorite: false, cooked: 0, savedAt: Date.now(), ...patch }
      addRecipe(rec)
      나갈까(() => {
        // ⛔ 임시저장은 «성공한 뒤»에만 지운다 — 실패했는데 지우면 적던 것까지 잃는다
        try { localStorage.removeItem(DRAFT_KEY) } catch { /* noop */ }
        // 새 레시피 저장 후엔 열려있던 화면(가져오기 등)을 모두 닫고 홈/현재 탭으로.
        // (뒤로가기로 작성 중이던 빈 편집기가 다시 나오지 않게)
        nav.popAll()
        nav.showToast('레시피를 저장했어요')
        // 🙏 한마디 청하기 — 「내 레시피 2개」부터 (창업자 확정 2026-09-03)
        //   ⛔ 여기서 «판정하지 않는다» — 이 화면이 든 `recipes` 는 저장 «전» 값이다.
        //      신호만 올리고 App 이 최신 store 로 센다(App.jsx 「리뷰신호」).
        //   ⭐ 왜 이 자리인가 = 담기는 우리 앱의 첫 걸음이고, 저장이 «성공한» 순간이
        //      「해냈다」가 되는 자리다. 실패하면 이 콜백 자체가 안 불린다.
        nav.askReviewSoon?.()
      })
    }
  }

  return (
    <div className="screen fade">
      {focusField && (
        <Portal>
          <div style={{ position: 'fixed', left: 0, right: 0, bottom: 'var(--kb-inset, 0px)', zIndex: 3000, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
            <div onMouseDown={(e) => e.preventDefault()} style={{ pointerEvents: 'auto', width: '100%', maxWidth: 480, background: 'var(--surface)', borderTop: '2px solid var(--brown)', boxShadow: '0 -3px 12px rgba(0,0,0,.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', padding: '8px 12px' }}>
              {/* 왼쪽 고정 안내 — 키보드와 색이 비슷해 놓치기 쉬워, "이 버튼으로 단위 넣는다"를 못박는다 */}
              <span style={{ flex: '0 0 auto', position: 'sticky', left: 0, zIndex: 1, alignSelf: 'stretch', display: 'flex', alignItems: 'center', gap: 5, paddingRight: 9, background: 'var(--surface)', color: 'var(--brown)', fontSize: 16, fontWeight: 800, whiteSpace: 'nowrap', borderRight: '1px solid var(--line)' }}>
                <Icon name="chevron-right" size={14} stroke={2.6} color="var(--brown)" />단위 톡
              </span>
              {UNITS.map((u) => (
                <button key={u} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertUnit(u, focusField === 'steps' ? stepRef : ingRef, focusField)}
                  style={{ flex: '0 0 auto', padding: '8px 14px', borderRadius: 999, background: 'var(--cream)', color: 'var(--brown)', border: '1px solid var(--line)', fontSize: 16, fontWeight: 700, fontFamily: /[a-zA-Z]/.test(u) ? 'var(--mono, monospace)' : 'inherit' }}>
                  {u}
                </button>
              ))}
            </div>
            {/* 🥄🥄 [창업자 확정 2026-09-03] *"그 계량 안내 넣어줘"* — 「1큰술=15ml · 1작은술=5ml」
                ⛔⛔ **옛 「T=큰술·t=작은술」 안내와 «같은 자리»에 두지 않았다.**
                   그건 칩들 «맨 뒤»에 있었는데 이 바는 `overflowX: auto` 라 **옆으로 굴려야 보인다.**
                   🔢 창업자 폰 실물(2026-09-03 10:30 캡처)에서 오른쪽 끝이 「작은…」에서 잘려 있었다
                      → 그 안내는 **화면 밖**이었다. 있으나 마나였던 것이다.
                ✅ 그래서 **바 «아래» 한 줄**로 내렸다 — 가로로 안 밀리니 늘 보인다.
                ⭐ 값은 지어낸 게 아니다 = `src/data/kitchenGuide.js` 의 MEASURE 와 «같은 값»이고,
                   창업자 본인도 레시피 세 편에 「1T 15ml, 1t 5ml」 기준 줄을 손으로 적어 뒀다.
                ⛔ 글자 14px — 앱 최소치다(그 아래로 내리지 말 것). */}
            <div style={{ padding: '0 12px 7px', fontSize: 14, color: 'var(--text-sub)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              1큰술 = 15ml · 1작은술 = 5ml
            </div>
            </div>
          </div>
        </Portal>
      )}
      {/* 🚨🚨 **저장이 실패했다** — 토스트는 지나가면 못 보니 화면에 «남겨» 둔다 (창업자 확정 2026-09-02)
          ⛔ 화면을 안 닫았으니 적던 내용은 그대로 있다. 자리를 비운 뒤 다시 「저장」을 누르면 된다. */}
      {saveFailed && (
        <div style={{ position: 'sticky', top: 0, zIndex: 30, padding: '10px 14px', background: '#b3261e', color: '#fff', fontSize: 15.5, fontWeight: 700, lineHeight: 1.45 }}>
          저장되지 않았어요 — 폰 저장 공간이 가득 찼어요.
          <div style={{ fontWeight: 500, marginTop: 3 }}>적은 내용은 그대로 있어요 · 설정에서 백업한 뒤 자리를 비우고 다시 「저장」을 눌러 주세요.</div>
        </div>
      )}
      {/* 📌📌 **상단바를 화면에 붙여둔다 — 「저장」이 스크롤에 떠내려가던 것** (창업자 2026-09-02)
          📮 창업자 = *"작은 정리는 아직도 어디있는지 모름"*
          ⛔⛔ 뿌리 = `.topbar-back` 에 `position: sticky` 가 **없었다**(코드로 확인).
             편집 화면은 «재료·순서를 채우려고 아래로 내려가는» 화면인데, 내려가는 순간
             위 「저장」이 화면 밖으로 나가고 바닥엔 다른 이름의 단추가 있었다
             → **둘이 동시에 보이는 순간이 아예 없었다.** 못 찾은 게 당연하다.
          ⛔ `.topbar-back` 은 화면 다섯이 같이 쓴다(임시보관함·상세·가져오기·TopBar) →
             **여기서만** 붙는 클래스를 따로 준다. 남의 화면을 안 건드린다. */}
      <div className="topbar-back topbar-stick">
        {/* 닫기 — 새로 쓰던 내용이 있으면 "이어쓸지 버릴지" 물어본다.
            예전엔 확인 없이 그냥 닫혀서, 버리려면 초안이 계속 되살아나 답답했다(창업자 "작성중 삭제 불편"). */}
        <button className="icon-btn press" onClick={() => (!editing && hasDraftContent ? setDiscardAsk(true) : nav.pop())} aria-label="닫기"><Icon name="x" size={24} /></button>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{editing ? '레시피 정리' : '직접 작성하기'}</div>
        {/* disabled 금지 — 눌러도 무반응이면 "먹통"으로 보인다. 색만 흐리게 두고, 누르면 save()가 안내한다. */}
        {/* ⛔ 못 누르는 상태(제목 없음)라도 «읽히는» 색으로 둔다 —
            옛 `--sand`(#cdbfa8)는 크림 배경 위에서 거의 묻혀 **단추가 없는 것처럼** 보였다.
            📌 무반응도 안 되고(먹통으로 읽힌다) 안 보이는 것도 안 된다 — 보이되 «흐리게». */}
        <button className="press" onClick={save} style={{ fontSize: 17, fontWeight: 700, color: canSave ? 'var(--brown)' : 'var(--text-sub)' }}>
          저장
        </button>
      </div>

      <input ref={photoRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }} />
      <input ref={ocrRef} type="file" accept="image/*" multiple onChange={onOcrFile} style={{ display: 'none' }} />

      {/* 보면서 쓰기 — 영상(유튜브·인스타)이나 캡처 원본을 위에 고정하고 아래에서 적는다.
          ⭐ sticky 로 둔다 — 예전엔 그냥 흘러가서, 사진을 닫고 아래로 내려가면
             다시 켜려고 «맨 위까지» 올라와야 했다(막다른 길). */}
      {(embed || refs.length > 0) && pin === null && (
        <div style={{ position: 'sticky', top: 0, zIndex: 19, background: 'var(--bg)', display: 'flex', gap: 8, padding: '6px 16px 6px' }}>
          {embed && (
            <button className="press" onClick={() => setPin('video')} style={{ flex: 1, padding: 12, borderRadius: 'var(--r-md)', background: 'var(--cream)', color: 'var(--brown)', fontSize: 16, fontWeight: 700 }}>
              {embed.type === 'youtube' ? '영상 보면서 쓰기' : '인스타 미리보기'}
            </button>
          )}
          {refs.length > 0 && (
            <button className="press" onClick={() => setPin('photo')} style={{ flex: 1, padding: 12, borderRadius: 'var(--r-md)', background: 'var(--cream)', color: 'var(--brown)', fontSize: 16, fontWeight: 700 }}>
              캡쳐 보면서 쓰기
            </button>
          )}
        </div>
      )}
      {pin === 'video' && embed && (
        <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#141311' }}>
          <iframe
            src={embed.src}
            title="원본 영상"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            /* allow-top-navigation·allow-popups 를 모두 빼서, 임베드 안을 눌러도 앱(한끼)이
               인스타·유튜브 앱으로 튕겨 나가지 않게 막는다. (유튜브 인라인 재생엔 영향 없음) */
            sandbox="allow-scripts allow-same-origin allow-presentation"
            style={
              embed.type === 'youtube'
                ? { display: 'block', width: '100%', aspectRatio: '16/9', border: 0 }
                : { display: 'block', width: '100%', height: '48vh', border: 0, background: '#fff' }
            }
          />
          {embed.type === 'instagram' && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '7px 12px', background: 'rgba(20,19,17,0.78)', color: 'rgba(255,255,255,0.92)', fontSize: 15, fontWeight: 600, textAlign: 'center' }}>
              인스타 영상은 정책상 앱 안에서 재생되지 않아요 · 캡션·썸네일만 참고할 수 있어요
            </div>
          )}
          <button
            className="press"
            onClick={() => setPin(null)}
            aria-label="영상 닫기"
            /* 캡처 닫기와 같은 이유로 안전영역만큼 내린다(sticky top:0 = 상태표시줄 자리) */
            style={{ position: 'absolute', top: 'calc(8px + var(--safe-top, 0px))', right: 8, padding: '6px 12px', borderRadius: 10, background: 'rgba(20,19,17,0.72)', color: '#fff', fontSize: 15.5, fontWeight: 700 }}
          >
            ✕ 닫기
          </button>
        </div>
      )}
      {pin === 'photo' && refs.length > 0 && (
        <div style={{ position: 'sticky', top: 0, zIndex: 20, background: '#141311' }}>
          {/* ⭐⭐ 손잡이 바 — 사진을 접었다 폈다 하는 곳. «접어도 이 줄은 남는다.»
              창업자 2026-08-02: *"캡쳐한거 보면서 비교할 때 사진 닫기가 고정되어 있으니
              레시피가 안 보일 때 방법이 없단 뜻이었어."* → 맞는 지적이고 내가 처음에 잘못 읽었다.
              사진은 화면 위 34vh 를 «고정»으로 차지하는데, 그 밑에 가려진 입력칸을 보려면
              사진을 통째로 닫는 수밖에 없었다. 그리고 한 번 닫으면 다시 켜려고 맨 위까지 올라와야 했다.
              → 한 번 톡 = 사진만 접히고 «줄은 남는다» → 레시피가 다 보이고, 다시 톡 하면 그 자리에서 돌아온다. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', paddingTop: 'calc(7px + var(--safe-top, 0px))' }}>
            <button
              className="press"
              onClick={() => setPhotoFold((v) => !v)}
              aria-label={photoFold ? '캡처 사진 펼치기' : '캡처 사진 접기'}
              style={{ padding: '7px 14px', borderRadius: 999, background: photoFold ? '#ee7f4b' : 'rgba(255,255,255,0.16)', color: '#fff', fontSize: 16.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5 }}
            >
              {photoFold ? '사진 펼치기 ▼' : '사진 접기 ▲'}
            </button>
            {/* 장 고르기 — 두 장 이상이면 «번호»로 넘긴다. 세로로 쌓아두면 둘째 장을 못 찾는다. */}
            {!photoFold && refs.length > 1 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 5, overflowX: 'auto' }}>
                {refs.map((_, k) => (
                  <button
                    key={k}
                    className="press"
                    onClick={() => { setShot(k); if (photoBoxRef.current) photoBoxRef.current.scrollTop = 0 }}
                    aria-label={`${k + 1}번째 캡처 보기`}
                    /* 지금 보는 장 = 주황. 흰색은 «흰 종이 캡처» 위에서 통째로 묻힌다(창업자 폰 2026-08-02) */
                    style={{ flex: '0 0 auto', minWidth: 32, padding: '5px 10px', borderRadius: 999, background: k === shotIdx ? '#ee7f4b' : 'rgba(255,255,255,0.16)', color: '#fff', fontSize: 15.5, fontWeight: 800, border: k === shotIdx ? '1.5px solid rgba(255,255,255,0.9)' : '1px solid rgba(255,255,255,0.28)' }}
                  >
                    {k + 1}
                  </button>
                ))}
                <span style={{ flex: '0 0 auto', color: 'rgba(255,255,255,0.55)', fontSize: 15, fontWeight: 600, marginLeft: 2 }}>번째 장</span>
              </div>
            ) : (
              <span style={{ flex: 1, color: 'rgba(255,255,255,0.62)', fontSize: 15, fontWeight: 600 }}>
                {photoFold ? '가려진 부분을 보고 있어요' : `캡처 ${refs.length}장`}
              </span>
            )}
            <button
              className="press"
              onClick={() => setPin(null)}
              aria-label="캡처 사진 닫기"
              style={{ padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.16)', color: '#fff', fontSize: 16, fontWeight: 700 }}
            >
              ✕ 닫기
            </button>
          </div>
          {/* 캡처 원본 — 인식이 100%가 아니니 보면서 고친다. 적는 칸이 더 중요하므로
              높이를 줄여(34vh) 입력칸을 넉넉히 남기고, 사진이 길면 안에서 세로 스크롤한다. */}
          <div ref={photoBoxRef} onScroll={checkPhotoScroll} style={{ maxHeight: photoFold ? 0 : '34vh', overflowY: photoFold ? 'hidden' : 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
            {/* 한 번에 «한 장»만 — 쌓아두면 둘째 장이 850px 아래로 밀려 못 찾는다(위 shot 주석) */}
            {/* 🖼🖼 [2026-09-02 · 창업자 제보] **쪽지를 «날것»으로 `<img>` 에 넣지 않는다.**
                📮 창업자 = *"채우러가기 눌렀는데 이래"* — 사진 자리에 «깨진 이미지 아이콘»만 있었다.
                ⛔ 창고에서 못 꺼내면 `refs` 에 `idb://…` 가 그대로 남는데, 그걸 그리면 브라우저가
                   깨진 아이콘을 그린다. 유저는 그걸 **「앱이 고장났다」**로 읽는다.
                ⭐ 못 그릴 값이면 «조용히 말로» 알린다 — 글자는 그대로 살아 있으니 편집은 계속된다. */}
            {그릴수있나(refs[shotIdx]) ? (
              <img
                key={shotIdx}
                src={refs[shotIdx]}
                alt={`캡처 ${shotIdx + 1}`}
                onClick={() => setZoom(shotIdx)}
                onLoad={checkPhotoScroll}
                style={{ display: 'block', width: '100%', height: 'auto', cursor: 'zoom-in' }}
              />
            ) : (
              <div className="t-sub" style={{ padding: '18px 4px', textAlign: 'center', fontSize: 13.5 }}>
                사진을 못 불러왔어요 · 글자는 그대로 있어요
              </div>
            )}
          </div>
          {/* 더 스크롤할 게 있을 때만 하단 fade + 안내 — '잘림/고정' 오해 방지 */}
          {!photoFold && photoMore && (
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 64, pointerEvents: 'none', background: 'linear-gradient(to bottom, rgba(20,19,17,0), rgba(20,19,17,0.72))' }} />
          )}
          {!photoFold && (
            <button
              className="press"
              onClick={() => setZoom(shotIdx)}
              aria-label="캡처 크게 보기"
              style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', padding: '7px 16px', borderRadius: 999, background: 'rgba(20,19,17,0.78)', color: '#fff', fontSize: 15.5, fontWeight: 700 }}
            >
              크게 보기{refs.length > 1 ? ` · ${shotIdx + 1}/${refs.length}장` : ''}
            </button>
          )}
          {!photoFold && photoMore && (
            <span style={{ position: 'absolute', bottom: 13, right: 12, color: 'rgba(255,255,255,0.92)', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3, pointerEvents: 'none' }}>
              아래 더 있어요 <span style={{ fontSize: 16, lineHeight: 1 }}>↓</span>
            </span>
          )}
        </div>
      )}

      <div className="pad" style={{ paddingBottom: 40 }}>
        {/* 썸네일 — 카드에 보이는 아이콘. 기본은 브랜드 아이콘(통일감), 원하면 글자·사진. */}
        <div className="field">
          <label>썸네일 <span style={{ fontWeight: 400, color: 'var(--text-sub)', fontSize: 15 }}>· 목록 카드에 보여요</span></label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {THUMB_TYPES.map((t) => (
              <button key={t.key} className={`pill press ${f.thumb === t.key ? 'active' : ''}`} onClick={() => set('thumb', t.key)}>{t.label}</button>
            ))}
          </div>

          {f.thumb === 'icon' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* ⭐ 「직접 골랐다」를 같이 남긴다 — 이게 없으면 제목을 손보는 순간 고른 게 버려진다 */}
              <FoodIconPicker value={f.icon || guessFoodIcon(f.title)} onChange={(k) => { set('icon', k); setIconPicked(true) }} size={74} />
              <div style={{ fontSize: 16, color: 'var(--text-sub)', lineHeight: 1.55 }}>탭해서 아이콘을 골라요.<br />제목에 맞춰 자동 추천돼요.</div>
            </div>
          )}
          {f.thumb === 'none' && (
            <div style={{ fontSize: 16, color: 'var(--text-sub)', lineHeight: 1.55 }}>표지를 비웠어요. 아이콘 없이 <b>꾸미기</b>로 배경·스티커만 얹어 깔끔하게 만들 수 있어요</div>
          )}
          {f.thumb === 'label' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <TextTile text={f.label || f.title || '한끼'} size={74} radius={16} />
              {/* maxLength 금지 — 한글 조합·이모지 입력이 끊긴다(UTF-16 단위로 세기 때문). 저장할 때 잘라낸다. */}
              <input value={f.label} onChange={(e) => set('label', e.target.value)} placeholder={f.title || '표시할 글자'} style={{ flex: 1 }} />
            </div>
          )}
          {f.thumb === 'photo' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                className="press"
                onClick={() => photoRef.current?.click()}
                aria-label={f.image ? '사진 변경' : '사진 추가'}
                style={{
                  width: 74,
                  height: 74,
                  flex: '0 0 auto',
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: 'var(--cream)',
                  border: f.image ? 'none' : '1.5px dashed var(--sand)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {f.image ? (
                  <img src={f.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Icon name="camera" size={26} color="var(--brown)" />
                )}
              </button>
              <div style={{ fontSize: 16, color: 'var(--text-sub)', lineHeight: 1.55 }}>
                {f.image ? '탭해서 사진을 바꿔요.' : '탭해서 음식 사진을 골라요.'}<br />
                음식이 가운데 오도록 정사각으로 예쁘게 다듬어져요.
              </div>
            </div>
          )}
        </div>

        {/* 캡처 한 장으로 재료+만드는 법 한 번에 — 사진 두 번 올리는 번거로움 없이(요청 반영).
            잘못 섞이면 아래 각 칸의 📷로 따로 채워 보정한다(안전망 유지). */}
        <button className="press" onClick={() => pickOcr('all')} disabled={ocr.busy}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '15px', marginBottom: 7, borderRadius: 'var(--r-md)', background: 'var(--brown)', color: '#fff', fontSize: 17, fontWeight: 800, boxShadow: 'var(--shadow-soft)', opacity: ocr.busy ? 0.5 : 1 }}>
          <Icon name="camera" size={18} color="#fff" /> 캡처 사진으로 재료·만드는 법 채우기
        </button>
        {/* 캡처 안내는 여기 한 곳에만 — 잘 보이게(흩어진 안내 통합) */}
        <div style={{ marginBottom: 14, padding: '13px 16px', borderRadius: 'var(--r-md)', background: 'var(--cream)', border: '1px solid var(--line)' }}>
          <div style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--brown)', marginBottom: 8 }}>캡처는 이렇게 채워요</div>

          {/* 💰 [2026-08-21] 값 한 줄. ⛔더 안 붙인다.
              📮 창업자 = *"AI스캔 1장 뭔말인지 하나도 모르겠어."* · *"다 구구절절이야 헷갈린다고"*
                 ＋ *"안내는 명확하고 심플하게 · 통상적으로 앱들에서 헷갈리지않게 안내하는 수준으로"*
              ⛔⛔ **내가 세 가지를 한꺼번에 틀렸다.**
                 ⑴ **「AI 스캔 1장」이 아무 말도 안 했다** — 「스캔」도 「장」도 우리끼리 쓰는 말이라
                    «줄어든다»는 뜻이 어디에도 없었다. 창업자 본인이 못 읽었으면 유저는 당연히 못 읽는다.
                    ✅✅ **창업자가 문구를 직접 줬다 — *"무료이용이 1장 소모가 된다던지"*.** 그 말을 그대로 쓴다.
                       ⭐ 핵심 낱말이 **「소모」**다. 「써요」는 «한다»는 말이고 「소모돼요」는 «줄어든다»는 말이다.
                          유저가 알아야 하는 건 후자다. ⛔내 말로 다듬지 않는다 — 창업자 말이 곧 통하는 말이다.
                 ⑵ **미리 다 설명했다** — 「기본 인식으로 계속」은 «다 썼을 때» 할 말이고
                    「재료 칸에 만드는 법이 섞여 들어왔다면」은 «잘못 읽혔을 때» 할 말이다.
                    쓰기도 전에 깔아 두니 셋을 한 번에 읽어야 했다.
                    ⭐ 둘 다 «그때» 이미 말하고 있다 — 소진은 340~360줄 꼬리가, 고치기는 각 칸의 📷 단추가.
                 ⑶ 예시(「3장 고르면 3장」)까지 붙여 두 줄이 됐다. 규칙이 한 줄이면 예시가 필요 없다.
              📌 한 줄 = **지금 이 화면에서 필요한 것만.** */}
          <div style={{
            paddingLeft: 10, marginBottom: 10,
            borderLeft: '3px solid var(--danger)', wordBreak: 'keep-all',
            fontSize: 16.4, fontWeight: 900, color: 'var(--danger)', letterSpacing: '-.3px',
          }}>
            사진 1장에 {keyCount(1)}를 써요
          </div>

          {[
            // ⛔ 「재료 칸에 만드는 법이 섞여 들어왔다면…」을 뺐다(창업자 *"이 안내도 정신이 없어"*).
            //    «잘못 읽혔을 때»의 안내인데 그 일이 나기도 전에 읽게 했다.
            //    ⭐ 각 칸에 📷「사진에서 채우기」 단추가 이미 있다 — 필요하면 그때 누른다.
            ['읽은 글은 ', '초안', '이에요 — 사진 보며 다듬어 주세요.'],
          ].map(([a, b, c], k) => (
            // ⛔ `keep-all` — 한글은 기본이 «글자» 단위로 끊어서 낱말 가운데가 잘린다.
            //    실물을 열어보고 잡았다(규칙 21) — 「그 칸의 사 / 진에서 채우기」로 갈라져 있었다.
            //    📌 v11.19 의 「안 담겨/요」와 «같은 병»이다. 새 문장을 넣을 때마다 다시 난다.
            <div key={k} style={{ display: 'flex', gap: 8, fontSize: 16, color: 'var(--text)', lineHeight: 1.5, marginTop: k ? 5 : 0, wordBreak: 'keep-all' }}>
              <span style={{ flex: '0 0 auto', width: 5, height: 5, borderRadius: 9, background: 'var(--brown)', marginTop: 7 }} />
              <span>{a}<b style={{ color: 'var(--brown)', fontWeight: 700 }}>{b}</b>{c}</span>
            </div>
          ))}
        </div>

        {/* 사진 읽는 중 — 칸 채우기 진행 표시
            ⏳⏳ [2026-08-13 창업자 제보] *"레시피 2장 올릴때 로딩이 좀 걸려. **못기다리고 이상하다 하고 끌수도 있을 듯.**"*
            ⛔ 옛 판 = 동그라미 하나 돌고 「…40%」 한 줄. **한 장을 다 읽으면 40% 가 0% 로 돌아간다** —
               숫자가 뒤로 가니 «멈췄다/고장났다»로 읽힌다. 그게 끄고 싶어지는 순간이다.
            ✅ 셋을 고쳤다 —
               ① **막대가 앞으로만 간다**(장 수를 반영한 «전체» 진척률 — 1장째 40% 면 2장 중 20%)
               ② **얼마나 걸리는지 미리 말한다**(여러 장이면 「조금 걸려요」 · 「그대로 두면 돼요」)
               ③ **꼬르곰이 통통 뛴다** — 그림이 움직이면 «살아 있다»가 보인다(동그라미보다 세다) */}
        {ocr.busy && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', borderRadius: 'var(--r-md)', background: 'var(--cream)', color: 'var(--brown)', marginBottom: 12 }}>
            <img src={uiGomPot} alt="" aria-hidden="true" draggable={false} className="hk-m-tongtong"
              width={33} height={47} style={{ flex: '0 0 auto', objectFit: 'contain', margin: '-6px 0' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16.5, fontWeight: 700 }}>
                사진에서 글자 읽는 중… {ocr.total > 1 ? `${ocr.total}장 중 ${ocr.page}장째` : `${ocr.pct}%`}
              </div>
              {/* 📊 전체 진척률 — 여러 장이면 「앞 장들은 다 끝났다」까지 세어야 막대가 뒤로 안 간다 */}
              <div style={{ height: 6, borderRadius: 99, background: 'rgba(122,90,58,.16)', overflow: 'hidden', margin: '6px 0 0' }}>
                <div style={{
                  height: '100%', borderRadius: 99, background: 'var(--brown)',
                  width: `${Math.min(100, Math.round(((ocr.page - 1) * 100 + ocr.pct) / Math.max(1, ocr.total)))}%`,
                  transition: 'width .35s ease',
                }} />
              </div>
              {/* ⏱ 「오래 걸린다」를 «먼저» 말해 준다 — 예고된 기다림은 고장으로 안 읽힌다 */}
              <div className="t-sub" style={{ fontSize: 15, marginTop: 5, lineHeight: 1.4 }}>
                {ocr.total > 1
                  ? <>사진이 {ocr.total}장이라 조금 걸려요 · <b style={{ fontWeight: 800, color: 'var(--brown)' }}>이 화면 그대로 두면 돼요</b></>
                  : '잠깐만요, 다 읽으면 칸을 채워 드려요'}
              </div>
            </div>
          </div>
        )}

        {/* 사진으로 채우기는 재료·만드는 법 각 칸 옆의 📷 버튼으로 — 썸네일 사진과 헷갈리지 않게 여기엔 두지 않는다 */}
        <div className="field">
          <label>제목</label>
          {/* autoFocus 금지 — 화면에 들어오자마자 키보드가 아래 내용을 다 가려버린다. */}
          <input ref={titleRef} value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="예) 명란 크림 파스타" />
        </div>

        {/* 🍚🍚 [2026-08-19 창업자] 카테고리·조리시간·인분을 «제목 바로 아래»로 올렸다.
            📮 *"자동으로 한식 양식 종류 저장해주면 좋겠어. 솔직히 **맨날 까먹어 맨 아래 있어서
               거기까지 잘 안보게돼**.."* → *"유저가 직접입력하게끔 **칸만 잘보이게** 두면좋겠어
               (**2인분 시간도 위로 올리고**)"*
            ⛔ 전엔 재료(7줄)·만드는 법(7줄) «아래»라 스크롤을 한참 내려야 나왔다.
               옛 주석은 *"캡처는 제목+재료+만드는 법이 붙어 있어 … 아래로 뺐다"* 였고 **이유도 있었다.**
               ⭐ 그런데 «쓰는 사람»이 「거기까지 안 가게 된다」고 했다 — **의도가 좋아도 결과가 그러면 진 것이다.**
            ⭐ 여기가 맞는 자리인 이유 = 이 셋은 「이 레시피가 뭔가」라서 **제목과 한 묶음**이다.
               캡처 버튼은 여전히 재료 칸 바로 위에 있어 «채우는 흐름»은 안 깨진다.
            ⛔⛔ **자동 분류는 «안» 한다**(창업자가 스스로 접었다) — 「구체어 먼저」 위반이 65곳이라
               자동으로 채우면 엉뚱한 값이 유저 레시피에 박히고, `category` 실측값이 열 가지인데
               고를 수 있는 칩은 다섯뿐이라 **고를 수 없는 값**이 들어갈 수도 있었다.
            🔒 자리 검사 = `scripts/_probe-부가정보자리-0819.mjs` (되돌리면 exit 1) */}
        <div className="field">
          <label>카테고리</label>
          <div className="hscroll" style={{ padding: 0, margin: 0 }}>
            {CATEGORIES.filter((c) => c !== '전체').map((c) => (
              <button key={c} className={`pill press ${f.category === c ? 'active' : ''}`} onClick={() => set('category', c)}>{c}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>조리시간 (분)</label>
            <input value={f.time} onChange={(e) => set('time', e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="예: 20" />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>인분</label>
            <input value={f.servings} onChange={(e) => set('servings', e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="예: 2" />
          </div>
        </div>

        <div className="field">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ margin: 0 }}>재료 (한 줄에 하나씩)</label>
            <button className="press" onClick={() => pickOcr('ingredients')} disabled={ocr.busy} style={fieldOcrBtn}>
              <Icon name="camera" size={15} color="#fff" /> 사진에서 채우기
            </button>
          </div>
          <textarea ref={ingRef} rows={7} value={f.ingredients} onChange={(e) => set('ingredients', e.target.value)} style={{ scrollMarginTop: pin === 'photo' && photoFold ? 64 : pin ? '38vh' : undefined }} placeholder={'재료를 한 줄에 하나씩 적어주세요.\n계량은 키보드 위 버튼으로.'} />
        </div>

        <div className="field">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ margin: 0 }}>만드는 법 (한 줄에 한 단계)</label>
            <button className="press" onClick={() => pickOcr('steps')} disabled={ocr.busy} style={fieldOcrBtn}>
              <Icon name="camera" size={15} color="#fff" /> 사진에서 채우기
            </button>
          </div>
          <textarea ref={stepRef} rows={7} value={f.steps} onChange={(e) => set('steps', e.target.value)} style={{ scrollMarginTop: pin === 'photo' && photoFold ? 64 : pin ? '38vh' : undefined }} placeholder={'조리 순서를 한 줄에 하나씩 적어주세요'} />
        </div>

        {/* 부가 정보 — 난이도부터는 여기 남긴다(자주 안 건드린다) */}
        <div className="field">
          <label>난이도</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {DIFFS.map((d) => (
              <button key={d} className={`pill press ${f.difficulty === d ? 'active' : ''}`} onClick={() => set('difficulty', d)}>{d}</button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>태그</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TAG_LIST.map((t) => (
              <button key={t} className={`pill press ${f.tags.includes(t) ? 'active' : ''}`} onClick={() => toggleTag(t)}># {t}</button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>폴더</label>
          <div className="hscroll" style={{ padding: 0, margin: 0 }}>
            {folders.map((c) => (
              <button key={c} className={`pill press ${f.folder === c ? 'active' : ''}`} onClick={() => set('folder', c)}>{c}</button>
            ))}
            <button className="pill press" onClick={() => setNewFolder(true)}>
              + 새 폴더
            </button>
          </div>
        </div>

        <div className="field">
          <label>원본 링크 (선택)</label>
          <input value={f.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} placeholder="https://..." inputMode="url" />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" className="press" onClick={() => openExternal('https://www.instagram.com/')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 999, background: 'var(--cream)', color: 'var(--brown)', fontSize: 16, fontWeight: 700 }}>
              <Icon name="instagram" size={16} color="var(--brown)" /> 인스타 열기
            </button>
            <button type="button" className="press" onClick={() => openExternal('https://www.youtube.com/')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 999, background: 'var(--cream)', color: 'var(--brown)', fontSize: 16, fontWeight: 700 }}>
              <Icon name="youtube" size={16} color="var(--brown)" /> 유튜브 열기
            </button>
          </div>
          <div style={{ fontSize: 15, color: 'var(--text-sub)', marginTop: 6, lineHeight: 1.5 }}>
            새 탭으로 열려요 — 링크 복사 후 이 화면으로 돌아오면 쓰던 내용 그대로 있어요.
          </div>
        </div>

        <div className="field">
          <label>메모 (선택)</label>
          <textarea rows={3} value={f.memo} onChange={(e) => set('memo', e.target.value)} placeholder="나만의 팁이나 변형 아이디어" />
        </div>

        {/* 📥📥 [2026-08-28 · 창업자 「A가자 테스트를 해봐야하니까」] **사진에서 읽은 원문**
            📮 창업자 = *"근데 그럼 나머지는 어떻게 잡아? 다른 케이스 테스트해서 계속 보내?"*
            ⭐ 스크린샷만 보내면 나는 OCR 이 «뭐라고 읽었을지»를 추측해서 다시 쳐야 한다.
               추측이 빗나가면 못 고친다(콩나물 걸음 1 「jangnamcook 21시간 작성자」가 그랬다).
               원문 글자를 그대로 받으면 추측이 0이 된다.
            ⭐ 원문은 2026-08-22 부터 «이미 저장되고 있었다»(parseRecipe.js `keepRaw` · 상한 4,000자).
               꺼낼 입구가 없었을 뿐이다 — 로드맵 7순위 「다시 읽기 단추(자리는 창업자 판정)」가 이것이다.
            ⭐ 용량은 한 글자도 안 는다 — 저장은 이미 하고 있고 여기선 «보여주기»만 한다.
            ⛔ 원문이 없는 레시피(8/22 이전에 담은 것)엔 아예 안 그린다 — 없는 걸 있는 척하지 않는다. */}
        {rawText && (
          <div className="field">
            <button
              type="button"
              className="press"
              onClick={() => setRawOpen((v) => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '12px 14px', borderRadius: 'var(--r-md)', background: 'var(--cream)', color: 'var(--brown)', fontSize: 16, fontWeight: 700, textAlign: 'left' }}
            >
              <Icon name={rawOpen ? 'chevron-down' : 'chevron-right'} size={16} color="var(--brown)" />
              사진에서 읽은 원문
              <span style={{ marginLeft: 'auto', fontSize: 15, fontWeight: 600, color: 'var(--text-sub)' }}>{rawText.length}자</span>
            </button>
            {rawOpen && (
              <>
                {/* ⛔⛔ 글자를 «화면에 그대로» 띄운다 — 복사가 막힌 기기에서도 손으로 긁을 수 있게.
                    2026-08-16 사고 = `clipboard.writeText()` 가 «성공으로 resolve 되고도» 실제 복사는 실패했다.
                    그때 배운 것 = **확인할 수 없는 것을 성공이라고 말하지 않는다.** 여기선 눈에 보이는 길을 같이 둔다. */}
                <textarea
                  data-raw="1"
                  readOnly
                  rows={8}
                  value={rawText}
                  onFocus={(e) => e.target.select()}
                  style={{ marginTop: 8, fontSize: 15, lineHeight: 1.55, fontFamily: 'var(--mono, monospace)' }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    type="button"
                    className="press"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(rawText)
                        // ⛔ 「복사했어요」로 끝내지 않는다 — 됐는지 확인할 방법이 없다(2026-08-16).
                        nav.showToast('원문을 복사했어요 붙여넣어 «들어갔는지» 꼭 확인하세요', 5200)
                      } catch {
                        nav.showToast('복사가 막힌 기기예요 위 글자를 길게 눌러 «전체 선택»으로 복사하세요', 6000)
                      }
                    }}
                    style={{ padding: '10px 16px', borderRadius: 999, background: 'var(--brown)', color: '#fff', fontSize: 16, fontWeight: 700 }}
                  >
                    복사
                  </button>
                  {/* 🤖🤖 [2026-09-01 · 창업자 「되다 안 되다」] **AI 로 «다시» 다듬기**
                      📮 창업자 = *"지금 너무 편차가 크잖아. ai가 되다 안되다.."* → *"1.2 둘다하자"*
                      ⭐⭐ 실패를 «없애는» 대신 **되돌릴 수 있게** 만든다 —
                         지금은 AI 가 한 번 실패하면 그 레시피는 영영 규칙 파서 결과로 남는다.
                         이 단추 하나로 「되다 안 되다」가 **「안 되면 한 번 더」**가 된다.
                      💰 **열쇠 0개** — 사진에서 글자 읽기는 이미 끝났고 그것만 열쇠를 센다(`ocr.js` 한 곳).
                      ⭐ 사진도 같이 준다(ⓒ) — 방금 자른 캡처가 있으면 그것, 없으면 저장된 표지.
                         ⛔ 없으면 글자만으로 돈다(그래도 규칙 파서보단 낫다).
                      ⛔ 이 단추는 «누른 사람이 원해서» 칸을 갈아끼운다 — 손으로 고친 것도 덮인다.
                         그래서 아래에 그렇게 적어 둔다(모르고 눌러 잃는 일이 없게). */}
                  <button
                    type="button"
                    className="press"
                    onClick={다시다듬기}
                    style={{ padding: '10px 16px', borderRadius: 999, background: 다듬는중 ? 'var(--cream)' : 'var(--blue, #5b7aa8)', color: 다듬는중 ? 'var(--text-sub)' : '#fff', fontSize: 16, fontWeight: 700 }}
                  >
                    {다듬는중 ? 'AI가 다듬는 중…' : 'AI로 다시 다듬기'}
                  </button>
                </div>
                <div style={{ fontSize: 15, color: 'var(--text-sub)', marginTop: 6, lineHeight: 1.5 }}>
                  레시피가 이상하게 담겼을 때 이 글자를 그대로 보내주시면 원인을 찾을 수 있어요.
                  <br />다시 다듬기는 <b>열쇠를 안 써요</b> · 20~60초 걸리고 <b>제목·재료·만드는 법이 AI 결과로 바뀌어요</b>.
                </div>
              </>
            )}
          </div>
        )}

        {/* disabled 금지 — 위 상단 저장 버튼과 같은 이유(무반응=먹통으로 보임). 누르면 save()가 안내한다. */}
        {/* 🏷🏷 **이름은 「저장」 하나** (창업자 확정 2026-09-02)
            📮 창업자 = *"저장 못찾았어. 그냥 저장. 자동저장이아니라 ㅋ"* → 갈래 셋 중 **「저장」 하나로**
            ⛔⛔ 그 전엔 **편집 중일 때만** 「정리 완료」였다 — 같은 단추가 상황에 따라 이름을 갈았다.
               창업자는 이 큰 단추를 보고도 **저장인 줄 몰랐다.** 위 상단바엔 「저장」이라 적혀 있는데
               둘이 다른 말이라 «같은 기능인 줄» 알 수가 없었다.
            📌 v11.02 「책갈피」와 **같은 자리** — *"모양(말)이 같아야 누르고 싶다."*
               CLAUDE.md 에도 이미 있다: **「같은 기능은 탭이 달라도 같은 이름」**.
            ⛔ 「정리 완료」가 담던 뜻(＝임시보관함에서 나간다)은 **버리는 게 아니다** —
               같은 날 만든 임시보관함 「그대로 저장」·「채우러 가기」가 그 말을 대신 한다. */}
        <button className="btn-primary press" onClick={save} style={{ opacity: canSave ? 1 : 0.5 }}>
          저장
        </button>
      </div>

      {/* 🔢🔢 [창업자 확정 2026-08-29] **많이 골랐을 때 «확인»** — ⛔막는 게 아니다.
          📮 창업자 = *"여러장 할 수 있지만 열쇠가 소모된다는걸 적어주면 좋지않을까?
             아니면 5장 올리면 팝업으로 열쇠다섯개가 사용된다고 확인받는건?"*
             → *"웅 10장이든 20장이든 유저가 선택하면 되니깐"*
          ⭐ 상한이 «없다» — 긴 레시피는 진짜로 여러 장이 필요하다. 대신 **되돌릴 자리**를 만든다.
             지금까지는 고른 «뒤» 토스트뿐이라 20장이면 열쇠 20개가 그냥 깎였다.
          ⭐ 잔량이 모자라면 그 사실을 «먼저» 말한다 — 「5장인데 3개뿐」을 모르고 누르면 그게 분쟁이다. */}
      {manyAsk && (
        <ConfirmSheet
          title={`사진 ${manyAsk.urls.length}장을 골랐어요`}
          message={(() => {
            const n = manyAsk.urls.length
            const left = getOcrLeft()
            if (left.unknown || left.total >= n) return `${KEY_NAME} ${n}${KEY_UNIT}를 써요.\n사진 1장에 1${KEY_UNIT}씩 들어요.`
            return `${KEY_NAME}가 ${left.total}${KEY_UNIT} 남아서 ${left.total}장만 AI로 읽어요.\n나머지 ${n - left.total}장은 기본 인식으로 읽어 드려요.`
          })()}
          confirmLabel={`${manyAsk.urls.length}장 읽기`}
          onConfirm={() => { const u = manyAsk.urls; setManyAsk(null); 시작하기(u) }}
          onClose={() => setManyAsk(null)}
        />
      )}

      {/* 작성 중 나가기 — 이어쓰기(그냥 닫기) vs 버리기(임시저장까지 삭제) */}
      {discardAsk && (
        <ConfirmSheet
          title="쓰던 내용, 어떻게 할까요?"
          message={'그냥 닫으면 다음에 이어서 쓸 수 있어요.\n버리면 지금 쓴 내용이 사라져요.'}
          confirmLabel="버리기"
          danger
          onConfirm={() => {
            try { localStorage.removeItem(DRAFT_KEY) } catch { /* noop */ }
            nav.pop()
            nav.showToast('쓰던 내용을 버렸어요')
          }}
          secondaryLabel="그냥 닫기 (이어서 쓸래요)"
          onSecondary={() => nav.pop()}
          onClose={() => setDiscardAsk(false)}
        />
      )}

      {newFolder && (
        <PromptSheet
          title="새 폴더"
          fields={[{ key: 'name', label: '폴더 이름', placeholder: '예) 자주 만드는' }]}
          onSubmit={({ name }) => {
            const nm = name.trim()
            if (nm) { addFolder(nm); set('folder', nm) }
          }}
          onClose={() => setNewFolder(false)}
        />
      )}

      {cropImg && (
        <CropSheet
          image={cropImg}
          // ⏳ 자르는 동안 뒤에서 앞 장을 읽고 있으면 그걸 «이 화면 위»에 보여준다.
          //    ⛔ 안 보이면 유저는 「아무 일도 안 난다」고 여기고 앱을 끈다(창업자 2026-08-16).
          reading={ocr.busy ? { page: ocr.page, total: ocr.total, pct: ocr.pct } : null}
          // 🔢 「2장 중 2장째를 자르는 중」 — CropSheet 이 원래 받던 값인데 안 넘기고 있었다.
          //    ⭐ 읽는 중 안내(위)와 자르는 장(제목)이 다른 숫자라 둘 다 있어야 헷갈리지 않는다.
          index={ocrCropped.current}
          total={ocrTotal.current}
          title={
            ocrTargetRef.current === 'ingredients' ? '재료 사진 자르기'
              : ocrTargetRef.current === 'steps' ? '만드는 법 사진 자르기'
                : '글자 부분만 남기기'
          }
          hint={
            ocrTargetRef.current === 'ingredients' ? (
              <>이 사진의 글자는 <b style={{ color: '#f0ede7' }}>재료 칸에만</b> 담겨요. 재료 부분만 남겨주세요.</>
            ) : ocrTargetRef.current === 'steps' ? (
              <>이 사진의 글자는 <b style={{ color: '#f0ede7' }}>만드는 법 칸에만</b> 담겨요. 순서 부분만 남겨주세요.</>
            ) : undefined
          }
          onDone={(img) => { setCropImg(null); setRefs((p) => [...p, img]); setPin('photo'); onCropped(img) }}
          onSkip={() => { const img = cropImg; setCropImg(null); setRefs((p) => [...p, img]); setPin('photo'); onCropped(img) }}
          onCancel={() => {
            // ⛔⛔ 그만두면 «남은 자르기»를 비운다 — 안 그러면 마무리가 영영 안 와서
            //    **이미 읽은 앞 장의 글자가 통째로 버려졌다**(옛 판의 조용한 버그).
            //    읽는 중이면 그 펌프가 끝나면서 마무리한다. 놀고 있으면 여기서 바로 마무리한다.
            setCropImg(null)
            ocrQueue.current = []
            ocrCropOpen.current = false
            if (!ocrBusy.current && !ocrJobs.current.length) finishOcr()
          }}
        />
      )}

      {/* 캡처 원본 전체화면 — 손가락으로 확대해 자세히 본다. 아래 편집은 그대로 유지된다. */}
      {zoom !== false && refs.length > 0 && (
        <Portal>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(10,9,8,0.96)', overflowY: 'auto', overscrollBehavior: 'contain', touchAction: 'pinch-zoom', WebkitOverflowScrolling: 'touch' }}
            onClick={() => setZoom(false)}
          >
            <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10, padding: '56px 0' }}>
              {/* 🖼 위 「보면서 쓰기」와 «같은 잣대» — 못 그릴 값이면 깨진 아이콘 대신 말로 알린다 */}
              {그릴수있나(refs[Math.min(zoom, refs.length - 1)]) ? (
                <img src={refs[Math.min(zoom, refs.length - 1)]} alt={`캡처 ${Math.min(zoom, refs.length - 1) + 1}`} style={{ display: 'block', width: '100%', height: 'auto' }} />
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#e8e2d8', fontSize: 14, lineHeight: 1.6 }}>
                  사진을 못 불러왔어요<br />글자는 그대로 있어요
                </div>
              )}
            </div>
            <button
              className="press"
              onClick={(e) => { e.stopPropagation(); setZoom(false) }}
              aria-label="닫기"
              /* 캡처가 «흰 종이»면 반투명 흰 버튼은 안 보인다 → 어두운 알약으로 */
              style={{ position: 'fixed', top: 'calc(10px + var(--safe-top))', right: 12, padding: '8px 15px', borderRadius: 999, background: 'rgba(18,17,16,0.82)', color: '#fff', fontSize: 16.5, fontWeight: 700, backdropFilter: 'blur(4px)' }}
            >
              ✕ 닫기
            </button>
            {/* ⭐ 바닥 조작줄엔 «자기 배경»이 있어야 한다 (창업자 폰 2026-08-02)
                예전엔 배경 없이 글자·번호만 띄웠는데, 레시피 캡처는 대개 «흰 종이»라
                흰 번호(지금 보는 장)는 통째로 안 보이고 검은 번호만 «글 속에 떠 있는 2»처럼 보였다.
                뒤에 무엇이 오든 읽히게 어두운 띠를 깐다. */}
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '12px 12px calc(14px + var(--safe-bottom))', background: 'linear-gradient(to bottom, rgba(16,15,14,0), rgba(16,15,14,0.9) 34%, rgba(16,15,14,0.95))', backdropFilter: 'blur(6px)' }}>
              {refs.length > 1 && (
                <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                  {refs.map((_, k) => {
                    const on = k === Math.min(zoom, refs.length - 1)
                    return (
                      <button
                        key={k}
                        className="press"
                        onClick={(e) => { e.stopPropagation(); setZoom(k) }}
                        aria-label={`${k + 1}번째 캡처 크게 보기`}
                        style={{ minWidth: 46, padding: '9px 14px', borderRadius: 999, background: on ? '#ee7f4b' : 'rgba(255,255,255,0.18)', color: '#fff', fontSize: 16, fontWeight: 800, border: on ? '2px solid rgba(255,255,255,0.92)' : '1px solid rgba(255,255,255,0.3)', boxShadow: on ? '0 2px 12px rgba(238,127,75,0.55)' : 'none' }}
                      >
                        {k + 1}
                      </button>
                    )
                  })}
                </div>
              )}
              <span style={{ color: 'rgba(255,255,255,0.78)', fontSize: 15, fontWeight: 600 }}>
                {refs.length > 1
                  ? `${Math.min(zoom, refs.length - 1) + 1} / ${refs.length}장 · 번호를 눌러 다른 장`
                  : '손가락으로 확대·축소'}
              </span>
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}

function splitLines(s) {
  return s.split('\n').map((l) => l.trim()).filter(Boolean)
}
