import { useState, useEffect, useRef } from 'react'
import Portal from './Portal'
import Icon from './Icon'
import Thumb from './Thumb'
import DecorLayer from './DecorLayer'
import { PaperBox, WRITE_SIZES } from './PaperSheet'
import { PAPER_RULES, PAPER_SKINS, PAPER_ARTS, paperStyle } from '../data/papers'
import { seasonRank, isReleased } from '../season'
import GiftPackSheet from './GiftPackSheet'
import PackBuySheet from './PackBuySheet'
import { needsGiftPack } from '../nudges'
import { cropRatio, imageRatio } from '../utils'
import { FRAME_WINDOW } from '../data/frameWindows'
import { StickerArt, stickerRatio, BOX_GROUPS, BOX_PAD, STICKER_GROUPS, drawerGroups, ownedPacks, recentStickers, pushRecentSticker, KITCHEN_IDS, FRIEND_IDS, PHOTO_IDS, pickableMotions, pickableFx, NOTE_COLORS, NOTE_PATTERNS, NOTE_SHAPES, notePatternStyle, noteRadius, noteClip, noteIsClip, TEXT_COLORS, TEXT_FONTS, chipFamily, TEXT_WEIGHTS, TEXT_SIZES, DECOR_BACKGROUNDS, bgAnim, RECOLORABLE, STICKER_COLORS, TAPE_PATTERNS, HL_COLORS, FRAMES } from './Stickers'

// 📜📜 HStrip — 가로로 «넘치는 칩 줄»에 막대를 **우리가 그려서** 항상 보여준다.
//   (창업자 2026-08-08 *"스크롤바가 처음부터 안보여서 글자체 저게다처럼보임"* —
//    글씨체 12개 중 5개만 보이는데 표시가 없으니 「저게 다」로 읽힌다)
//   ⛔ CSS 로는 안 된다 — 두 번 밟았다: ⑴`::-webkit-scrollbar` 꾸밈은 **안드로이드 크롬이 통째로
//      무시한다**(항상 오버레이 = 긁는 동안만 나타남 · 헤드리스 실측에서도 안 그려졌다)
//      ⑵`scrollbar-width`(표준)를 같이 주면 크롬이 웹킷 꾸밈마저 끈다.
//   ⭐ 안 넘치면 트랙째 안 그린다 — 짧은 줄엔 아무 티도 안 난다.
//   ⚠️ 표식 `data-hstrip`(긁는 칸)·`data-hthumb`(막대) = 재현 검사가 «실제로 그려졌나»를 집는 자리.
function HStrip({ style, children }) {
  const ref = useRef(null)
  const [bar, setBar] = useState(null) // [막대 왼쪽 %, 막대 폭 %] · null = 안 넘침
  const measure = () => {
    const el = ref.current
    if (!el) return
    const { scrollWidth: sw, clientWidth: cw, scrollLeft: sl } = el
    if (sw <= cw + 8) { setBar(null); return }
    const w = Math.max(14, (cw / sw) * 100)
    const l = (sl / (sw - cw)) * (100 - w)
    setBar((b) => (b && Math.abs(b[0] - l) < 0.5 && Math.abs(b[1] - w) < 0.5) ? b : [l, w])
  }
  useEffect(() => {
    measure()
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div style={{ flex: '1 1 auto', minWidth: 0 }}>
      <div ref={ref} data-hstrip="1" onScroll={measure} style={style}>{children}</div>
      {/* 트랙 3px — 칩 줄 «바로 밑»에 붙이지 않는다(글자에 줄 그은 것처럼 보인 v9.96 제보) → 칩 쪽 paddingBottom 으로 띄운다 */}
      {bar && (
        <div style={{ height: 3, borderRadius: 999, background: 'var(--line)', position: 'relative', margin: '0 2px' }}>
          <span data-hthumb="1" style={{ position: 'absolute', left: `${bar[0]}%`, width: `${bar[1]}%`, top: 0, bottom: 0, borderRadius: 999, background: 'var(--text-sub)', opacity: 0.55 }} />
        </div>
      )}
    </div>
  )
}

// 📜 VHint — 세로로 넘치는 칸(서랍)에 얇은 막대를 우리가 그린다. `HStrip` 의 세로 짝.
//   (창업자 2026-08-09 *"자리가 부족하니까 얇게라도 표시해줘야 할 것 같아"*)
//   ⭐ 서랍은 내용이 «자주» 바뀐다(탭·갈래를 옮길 때마다 높이가 통째로 달라진다) →
//      `ResizeObserver` 로는 모자란다(그건 «칸» 크기만 본다. 칸은 그대로고 «안»이 바뀐다).
//      → `MutationObserver` 로 내용이 바뀔 때마다 다시 잰다.
//   ⚠️ `position: fixed` ＋ `getBoundingClientRect()` 라 **DOM 어디에 놓아도 자리가 맞는다** —
//      서랍 여는 태그 앞에 둔 이유(닫는 자리가 400줄 아래다).
function VHint({ boxRef }) {
  const [bar, setBar] = useState(null) // [화면 y, 높이, 오른쪽 x] · null = 안 넘침
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    let raf = 0
    const measure = () => {
      const { scrollHeight: sh, clientHeight: ch, scrollTop: st } = el
      if (sh <= ch + 8) { setBar(null); return }
      const r = el.getBoundingClientRect()
      const h = Math.max(24, (ch / sh) * r.height)
      const y = r.top + (st / (sh - ch)) * (r.height - h)
      setBar((b) => (b && Math.abs(b[0] - y) < 0.5 && Math.abs(b[1] - h) < 0.5 && b[2] === r.right) ? b : [y, h, r.right])
    }
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure) }
    el.addEventListener('scroll', onScroll)
    window.addEventListener('resize', onScroll)
    const mo = new MutationObserver(onScroll)
    mo.observe(el, { childList: true, subtree: true })
    const ro = new ResizeObserver(onScroll)
    ro.observe(el)
    const t = setTimeout(measure, 60)
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      mo.disconnect(); ro.disconnect(); clearTimeout(t); cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  if (!bar) return null
  return (
    <div
      data-vhint="1"
      aria-hidden="true"
      style={{
        position: 'fixed', top: bar[0], height: bar[1], left: bar[2] - 5,
        width: 3, borderRadius: 999, background: 'var(--text-sub)', opacity: 0.38,
        pointerEvents: 'none', zIndex: 6,
      }}
    />
  )
}

// 무늬·모양 칩용 미니 포스트잇 미리보기 (실루엣은 clip-path — defs 는 스테이지 DecorLayer 가 심는다)
function MiniNote({ color, pattern = 'plain', shape = 'fold', size = 30 }) {
  const pat = notePatternStyle(pattern, color.line || color.fold)
  const isClip = noteIsClip(shape)
  const clip = noteClip(shape)
  const rad = noteRadius(shape)
  const paper = isClip
    ? { clipPath: clip, WebkitClipPath: clip, filter: 'drop-shadow(0 1px 1.5px rgba(70,60,45,.3))' }
    : { borderRadius: rad, boxShadow: '0 1px 2px rgba(70,60,45,.2)' }
  const w = shape === 'oval' ? size * 1.4 : shape === 'cloud' ? size * 1.3 : size
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: w, height: size }}>
      <span style={{ position: 'absolute', inset: 0, background: color.bg, overflow: 'hidden', ...paper }}>
        {pat && <span style={{ position: 'absolute', inset: 0, ...pat }} />}
        {shape === 'fold' && <span style={{ position: 'absolute', right: 0, bottom: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: `0 0 ${size * 0.3}px ${size * 0.3}px`, borderColor: `transparent transparent ${color.fold} transparent` }} />}
      </span>
      {shape === 'tape' && <span style={{ position: 'absolute', top: -3, left: '50%', width: '52%', height: 6, transform: 'translateX(-50%) rotate(-4deg)', background: 'rgba(255,255,255,.55)', border: '0.5px solid rgba(120,110,90,.2)' }} />}
      {shape === 'pin' && <span style={{ position: 'absolute', top: -4, left: '50%', width: 9, height: 9, transform: 'translateX(-50%)', borderRadius: '50%', background: 'radial-gradient(circle at 38% 34%, #e08a7a, #c4614f)', boxShadow: '0 1px 2px rgba(60,30,25,.3)' }} />}
    </span>
  )
}

// 표정 스티커는 포인트로 얹는 용도라 기본 크기를 작게 시작한다
const FACE_KEYS = new Set(STICKER_GROUPS.find((g) => g.key === 'faces')?.items || [])
// 마스킹테이프 굵기 — 비율(가로/세로)이 클수록 가늘다. 기본 3.4.
const TAPE_WIDTHS = [
  { key: 'thin', label: '가늘게', ratio: 5.2 },
  { key: 'mid', label: '보통', ratio: 3.4 },
  { key: 'thick', label: '굵게', ratio: 2.3 },
]
// 🖍 형광펜 굵기 — 마테보다 «한 벌 가늘다». 글 한 줄 위에 긋는 것이라 기본이 6:1.
//   ⛔ 마테 값을 그대로 쓰지 않는다 — 3.4 는 글줄에 얹기엔 너무 두껍다(줄 두 개를 먹는다).
const HL_WIDTHS = [
  { key: 'thin', label: '가늘게', ratio: 9 },
  { key: 'mid', label: '보통', ratio: 6 },
  { key: 'thick', label: '굵게', ratio: 4 },
]
// 📷📷 사진을 처음 붙일 때의 크기 — ⭐**「폭」이 아니라 「높이」로 잡는다** (창업자 폰 제보 2026-08-07)
//   ⛔ 전엔 `ar >= 1 ? 0.5 : 0.38` 이었다. 0.38 은 «3:4 사진 하나»에만 맞춘 값이라
//      1:3 처럼 긴 사진이 오면 높이가 폭의 세 배(1.14)가 되어 **종이를 통째로 덮었다.**
//   ⭐ `s` 는 «폭»이고 화면에 보이는 높이는 `s ÷ 비율` 이다 — 그러니 높이를 0.5 로 맞추려면
//      가로 사진은 `s = 0.5`(높이가 저절로 작아진다), 세로 사진은 `s = 0.5 × 비율`.
//      3:4(0.75) → 0.375 라 예전 0.38 과 거의 같다 = 흔한 사진은 하나도 안 달라진다.
//   ⚠️ 바닥값 0.26 = 파노라마처럼 아주 긴 사진이 «실오라기»가 되는 걸 막는다.
export const photoScale = (ar) => (ar >= 1 ? 0.5 : Math.max(0.26, 0.5 * ar))
// 🖍 진하기 — 진짜 형광펜은 «두 번 그으면 진해진다». `multiply` 라 겹칠수록 색이 쌓인다.
const HL_OPACITIES = [
  { key: 'light', label: '연하게', o: 0.32 },
  { key: 'mid', label: '보통', o: 0.5 },
  { key: 'deep', label: '진하게', o: 0.72 },
]

// 📔 다이어리 속지 세 층(선·종이·틀) — 「틀 고르기」가 화면에 따로 있던 것을 **서랍 안으로 들였다**.
//   창업자 2026-08-06 *"지금 꾸미기 틀이랑 꾸미기로 나눠져있는게 조금 불편해"*
//   ⭐ 값은 `data/papers.js` 그대로 쓴다 — 여기서 목록을 다시 만들면 두 곳이 어긋난다.
// ⭐⭐ **「틀」이 맨 위다** (창업자 2026-08-06 *"틀 다 어디갔어??"* — 실제로는 있었는데 **못 찾았다**)
//   ⛔ 처음엔 선 → 종이 → 틀 순서였다. 「틀」이 셋째라 **스크롤해야 나왔고, 그건 없는 것과 같다.**
//   ⭐ 그리고 순서가 뜻으로도 맞다 — **틀이 종이의 «모양»을 정한다**(사진칸·날짜칸·글칸이 다 틀에서 나온다).
//      선·종이는 그 위에 얹는 결이다. 큰 것부터 고른다.
const PAPER_AXES = [
  { key: 'art', label: '틀', list: PAPER_ARTS },
  { key: 'skin', label: '종이', list: PAPER_SKINS },
  { key: 'rule', label: '선', list: PAPER_RULES },
]

// 🕗 「최근 쓴 것」을 띄우는 탭 — 스티커를 «고르는» 탭만.
//   ⛔ `notetext`(글자) 제외 = 맨 위가 「직접 쓰기」여야 한다는 창업자 확정 순서(2026-07-30)를 안 흔든다.
//   ⛔ `paper`(속지) 제외 = 열두 장뿐이라 찾을 게 없다.
const RECENT_TABS = new Set(['bgtape', 'frame', 'tape', 'deco', 'buddies', 'food'])

// ── 표지 꾸미기 에디터 ──
// 전체 화면 오버레이. 표지(정사각) 위에 스티커·포스트잇을 얹고
// 드래그로 이동, 우하단 핸들로 크기·회전, ×로 삭제. 저장하면 recipe.decor 로 영구 저장.
let seq = 0
const newDecorId = () => `d${Date.now().toString(36)}${(seq++ % 1296).toString(36)}`

// 🛟 자동저장 초안 — 꾸미는 중 계속 localStorage 에 저장, 앱이 죽거나 실수로 닫혀도 다시 열면 복구.
// (창업자 데이터 손실 방지. 저장 누르면 초안 비움.)
const draftKey = (id) => `hankki:decorDraft:${id}`
function loadDraft(id) {
  try { return JSON.parse(localStorage.getItem(draftKey(id)) || 'null') } catch { return null }
}

// 📐 `ratio` = 꾸미는 판의 «모양». 표지는 정사각(1/1), 다이어리는 세로 종이(3/4).
//   ⭐ 같은 에디터를 둘 다 쓴다 — 서랍·모션·효과·컨텍스트바가 통째로 재사용된다.
//   ✅ 되는 근거 = 스티커 좌표가 **%** 라 판 모양이 바뀌어도 그대로 따라온다.
//      (레꾸자랑에서 화면 밖 아무 크기로 렌더해 캡처해도 정상이던 그 성질)
//   ⛔ px 로 박으면 안 된다 — 여름 물결 배경이 세로 %를 못 써서 안 움직이던 것과 같은 함정.
// 📔 `paper` = 다이어리 속지({className, style}). 주면 표지(Thumb) 대신 «종이»를 깐다.
//   ⭐ 표지 꾸미기와 다이어리 꾸미기가 **같은 에디터**를 쓴다 — 서랍 394컷·모션·효과가 통째로 재사용된다.
// 🏷 `title` = 에디터 머리글. ⛔박아두면 안 된다 — 다이어리를 꾸미는데 「레시피 꾸미기」라고 떴다
//   (창업자 2026-08-06 *"레시피꾸미기 아니고 요리다이어리 나 다른이름하자"*).
//   📌 우리 원칙 = 「같은 기능은 같은 이름」이지 「다른 것에 같은 이름」이 아니다.
// ✍️ `paperOverlay` = 다이어리에 쓴 글·날짜를 그대로 그린 조각(읽기 전용 `PaperSheet`).
//   ⭐ **여기가 글의 내용을 몰라야 한다** — 다이어리 화면이 만들어서 통째로 넘긴다.
//      같은 글을 두 곳에서 그리면 자리가 반드시 어긋난다.
// 📔 `paperPick`·`onPaperPick` = 다이어리 속지 고르기를 **이 서랍 안에서** 하게 하는 두 짝.
//   ⭐ 값은 부모(다이어리 화면)가 쥔다 — 고르는 순간 부모의 `paper`·`paperOverlay` 가 다시 내려와
//      **위 판이 그 자리에서 바뀐다.** 여기서 따로 들고 있으면 판과 글자 자리가 어긋난다.
// ✍️ `writeFont`·`onWriteFont` = **본문 글씨체** 두 짝. 값은 부모(다이어리 화면)가 쥔다 —
//   여기서 들고 있으면 종이에 그려지는 글씨와 서랍이 어긋난다(속지 고르기와 같은 이유).
export default function DecorEditor({ recipe, onSave, onClose, closeRef, ratio = '1/1', paper = null, paperOverlay = null, paperEdit = null, title = '레시피 꾸미기', paperPick = null, onPaperPick = null, writeFont = '', onWriteFont = null, writeSize = '', onWriteSize = null }) {
  const savedThumb = recipe.thumb || (recipe.image ? 'photo' : 'icon')
  // 저장된 표지 상태로 시작하되, 자동저장 초안이 있으면 그걸로 복구(꾸미던 중 날아간 것 되살림).
  const draft = loadDraft(recipe.id)
  const [items, setItemsRaw] = useState(() => (draft?.items || recipe.decor || []).map((d) => ({ ...d })))
  // ↩↩ **실행 취소** (창업자 2026-08-06 — 남들이 «무료 기본»에 두는 것)
  //   ⭐ 왜 필요한가 = 창업자 *"x버튼 있지 않아? 그거랑 다른건가?"* → **다르다.**
  //      X = 그 스티커를 «없앤다»(되살릴 길 0). 실행 취소 = 방금 한 짓을 «무른다».
  //      · 옮기다 손이 미끄러졌다 → X 로는 지워질 뿐 제자리로 안 온다
  //      · 실수로 X 를 눌렀다 → 서랍에서 다시 찾아 크기·각도를 처음부터 맞춰야 한다
  //      · 너무 키웠다 → 원래 크기를 기억 못 한다
  //      📌 꾸미기는 «막 해보다 아니면 무르는» 놀이다. 무를 수 없으면 조심하게 되고 재미가 없다.
  //   ⚠️ **드래그는 한 칸으로 묶는다** — 손가락이 움직일 때마다 기록하면 백 번 눌러야 제자리다.
  //      DecorLayer 가 «끌기 시작할 때 한 번만» 세 번째 인자로 true 를 준다.
  //   ⚠️ 30칸까지만 쌓는다 — 무한히 쌓으면 사진 스티커 때문에 메모리가 는다.
  const [past, setPast] = useState([])
  const setItems = (fn) => setItemsRaw((arr) => (typeof fn === 'function' ? fn(arr) : fn))
  // 되돌릴 «자리»를 찍는다. 값을 바꾸기 «전»에 부른다.
  const mark = () => setItemsRaw((arr) => { setPast((p) => [...p.slice(-29), arr]); return arr })
  const undo = () => {
    setPast((p) => {
      if (!p.length) return p
      setItemsRaw(p[p.length - 1])
      setSel(null)
      return p.slice(0, -1)
    })
  }
  const [sel, setSel] = useState(null)
  // ⛔ 옛 「따로 창 떠서 쓰고 붙이기」 시트 상태(noteEdit)는 지웠다 — 이제 어디서도 안 연다.
  // ⌨️⌨️ **그 자리에서 바로 치기** (창업자 2026-08-07 *"지금 처럼 붙이기는 너무 불편해"*)
  //   붙이면 시트가 «안» 열리고 그 상자에 커서가 바로 들어간다. 종이 밖을 누르면 끝난다.
  //   ⚠️ 연필 단추도 «시트가 아니라» 그 자리 치기를 켠다 — 길이 하나뿐이라야 헷갈리지 않는다.
  const [typingId, setTypingId] = useState(null)
  // 🔀 움직임 ／ 효과 = «두 단추로 갈라» 한 쪽 칩만 그린다 (창업자 2026-08-07 판정 ②)
  // 🔀 컨텍스트 바 갈래 — 「순서·색·글씨·무늬·모양·움직임·효과」를 «한 번에 한 줄만» 그린다.
  //   ⛔ 전엔 해당하는 줄을 «전부» 세로로 쌓았다 → 포스트잇 하나 고르면 다섯 줄 200px.
  //      실측(창업자 폰 360×780): 서랍 343 → 164 · **스크롤 칸 231 → 53px** = 손가락보다 얇다.
  //   ⭐ 갈래 문법은 새로 만든 게 아니다 — 2026-08-07 에 「움직임/효과」로 이미 쓴 것을 통째로 넓혔다
  //      (창업자 판정 *"효과단추는 네가 아이디어낸게 좋은 것 같아"*).
  const [ctxTab, setCtxTab] = useState('order')
  // 🙈 잠깐 숨기기 (창업자 폰 제보 2026-08-07 *"위에 설정(색, 무늬 모양)부분이 너무 길어
  //    이거 접는거나 잠깐 숨기기나 그런게 필요햐"*) — 접으면 갈래 줄만 남고 칩 줄이 사라진다.
  const [ctxOpen, setCtxOpen] = useState(true)
  const [textFont, setTextFont] = useState('gaegu') // 글자 스티커 글씨체 기본 = 귀염체(손글씨 톤)
  const [bg, setBg] = useState(draft?.bg ?? recipe.decorBg ?? 'none') // 표지 배경(배경지)
  // 되돌리기용 실제 표지 — 저장값이 'none'이어도 아이콘/사진으로 되살릴 수 있게
  const origThumb = savedThumb !== 'none' ? savedThumb : (recipe.image ? 'photo' : 'icon')
  const [thumb, setThumb] = useState(draft?.thumb ?? savedThumb) // 'none'이면 표지 그림 비움 → 깨끗한 배경에 꾸미기
  const [exitAsk, setExitAsk] = useState(false) // 취소 시 "저장 안 함?" 확인
  // ⛔⛔ **이 안내 띠가 «가로에서 판을 통째로 밀어내고 있었다»** (창업자 폰 제보 2026-08-09 밤
  //    📮 *"오늘의한끼누르면 쪼그라들어"* — 캡처 둘 다 이 띠가 격자 «밖»으로 튀어나와 있었다)
  //    가로에선 `.decor-editor` 가 **격자(grid)** 인데 이 띠엔 `grid-area` 가 없다 →
  //    브라우저가 **암묵 행을 새로 만들어** 종이 칸을 위로 밀고, 자판까지 뜨면 종이가 통째로 쪼그라든다.
  //    ⭐ 고치는 법 둘을 같이 쓴다 — ⑴가로에선 «띄운다»(CSS `position: fixed`, 격자를 안 건드림)
  //       ⑵**6초 뒤 저절로 사라진다.** 한 번 알려주면 되는 말인데 꾸미는 내내 자리를 먹고 있었다.
  //    ⛔ `useRef` 로는 사라지게 못 한다(리렌더를 안 부른다) → `useState`.
  const [restored, setRestored] = useState(!!draft) // 초안에서 복구했는지(안내 띠)
  useEffect(() => {
    if (!restored) return
    const t = setTimeout(() => setRestored(false), 6000)
    return () => clearTimeout(t)
  }, [restored])
  // 📔 여기가 다이어리인가 = `paper` 를 받았나. 아래 「어느 판에서 보이나」를 가르는 기준.
  //   ⭐ 새 값을 안 만든다 — 판을 종이로 바꾸는 그 인자가 곧 「다이어리다」라는 뜻이다.
  const isDiary = !!paper
  // 📔 속지 탭을 띄울 수 있나 = 다이어리이면서 부모가 「고르는 길」을 줬나.
  const canPickPaper = isDiary && !!paperPick && !!onPaperPick
  // 📷 지금 고른 «틀»에 사진칸이 있나 — 없으면 속지 화면에서 한 줄로 알려준다.
  //    ⛔ 라벨(「없음」)로 판단하지 않는다. 그 틀에 사진칸(fields.photo)이 «있느냐»로 본다(분류 원칙).
  const paperArtHasPhoto = !!PAPER_ARTS.find((a) => a.key === (paperPick?.art ?? 'none'))?.fields?.photo
  // 서랍 탭 — 표지는 배경부터, 다이어리는 프레임부터(다이어리엔 배경 탭 자체가 없다. 아래 CATS 참고)
  const [cat, setCat] = useState(isDiary ? 'frame' : 'bgtape')
  // 📔📔 **일기를 꾸밀 땐 선반이 둘 — 「일기 아이템」 / 「레시피 꾸미기」**
  //   창업자 2026-08-06 *"다이어리 쓰기 버튼을 누르면 버튼이 2개 나오게 한다는거야. 하나는 다이어리용 꾸미기창.
  //   오른쪽은 레시피꾸미기아이템창 **두가지를 다쓰되, 각각 탭에서 쓸수있는거지**"*
  //   ⛔ **막는 게 아니라 나누는 것이다** — 오른쪽 칸에 전부 그대로 있다(「한 번 준 건 안 빼앗는다」).
  //   ⭐ 왜 나누나 = 창업자 *"각각의 아이템이 너무 많아 정신이 없다"*. 데코 탭 하나에 27그룹이 쏟아졌다.
  //      일기 선반은 지금 5그룹 24컷이지만 **9/1·10/1·11/1 에 「다이어리 꾸미기」 80컷이 얹혀 23그룹 104컷**이 된다.
  //   ⛔ 라벨 글자로 가르지 말 것 — 그룹의 `diary` 필드로만 판단한다(CLAUDE.md 「분류 원칙」·v9.07 사고).
  //   ⭐⭐ **줄을 새로 만들지 않는다 — 맨 위 「꾸미기」 한 칸을 두 칸으로 쪼갠다.**
  //      창업자 *"**두번에 걸쳐서 들어가게 하는게 아니라 버튼한번만 눌러서** 되게끔"* ·
  //      *"다이어리 쓰기 버튼을 누르면 **버튼이 2개** 나오게"*
  //      → 「속지 · 글쓰기 · **일기 꾸미기** · **레꾸 꾸미기**」 = 어느 칸이든 **한 번만 누르면** 간다.
  //      ⛔ 선반 고르는 줄을 따로 얹으면 서랍 26vh 에 조작 줄이 셋이 되고, 무엇보다 **탭이 두 겹**이 된다.
  //   ⭐ 기본은 **「일기 꾸미기」** — 일기 쓰러 들어왔으니 일기 세트부터 보인다(고르는 단계가 안 생긴다).
  //   ⛔ 표지 꾸미기(`isDiary === false`)엔 안 쪼갠다 — 거긴 선반이 하나(「꾸미기」 한 칸).
  const [shelf, setShelf] = useState('diary')
  // 🧭🧭 **서랍을 큰 두 칸으로 가른다 — 「속지 고르기」와 「꾸미기」**
  //   창업자 2026-08-06 *"꾸미기를 반으로 갈라서 왼쪽은 속지 고르기 오른쪽은 꾸미기로 나누자"*
  //   ⛔ 처음엔 속지를 탭 «일곱 중 하나»로 넣었는데, 그러면 **종이 고르는 일이 스티커 고르는 일과 같은 급**이 된다.
  //      실제로는 순서가 있는 두 단계다 — 종이를 깔고, 그 위에 꾸민다.
  //   ⭐ 빈 다이어리를 처음 열면 「속지 고르기」부터. 이미 꾸며둔 걸 다시 열면 「꾸미기」로 간다.
  //   ✍️ **셋째 칸 = 「글쓰기」** (창업자 2026-08-06 *"속지고르고 꾸미고 저장해야 글을 쓸수있어서 불편한데.."*)
  //      ⛔ 전엔 «저장하고 나가야» 글이 써졌다 — 속지를 고른 채로 한 줄 쓰려면 매번 나갔다 들어와야 했다.
  //      ⭐ 종이는 그대로 두고 **누가 그 종이를 만지나**만 바꾼다:
  //         · 꾸미기·속지 = 스티커 층이 손가락을 먹는다(글칸은 `pointerEvents:none`)
  //         · 글쓰기     = 스티커 층을 «통과»시키고 글칸이 받는다(`editable={false}` → `pointerEvents:none`)
  //      ⚠️ 그래서 새 화면을 안 만들었다. 같은 판에서 «층 하나»가 바뀔 뿐이다.
  const [mode, setMode] = useState(canPickPaper && items.length === 0 ? 'paper' : 'decor')
  const writing = mode === 'write' && !!paperEdit
  // ⌨️⌨️ **글을 쓰기 시작하면 글씨 도구가 «따라온다»** (창업자 2026-08-07
  //    *"유저가 여기저기 탭 안누르고 글쓸때 편하게 사용한다는 의미야 (한번에 쓸수있게는)"*)
  //   ⛔ 글은 어느 탭에서든 써지게 고쳤는데, **글씨체·크기를 바꾸려면 여전히 「글쓰기」 탭으로 가야 했다.**
  //      쓰다가 → 탭 옮겨 글씨체 고르고 → 다시 돌아와 쓰는 왕복이 남아 있었다.
  //   ⭐ 인스타 스토리·캔바가 쓰는 문법 = **글을 치는 «동안»에만 그 도구가 나온다.**
  //      우리도 「어느 탭인가」가 아니라 **「지금 글을 치고 있나」**로 띄운다.
  //   ⚠️ 칩을 누르면 글칸이 포커스를 잃어 줄이 사라진다 → 칩에서 `onPointerDown` 을 막아 포커스를 지킨다.
  const [typing, setTyping] = useState(false)
  // 🔍 종이 확대 배율 — ⭐**세로·가로 둘 다** 쓴다(2026-08-09 창업자 *"손가락으로 확대해서 쓸 수 있는 것"*).
  //    ⛔ 저장 안 한다 — 「이번에 꾸미는 동안」만. 다음에 열었을 때 확대된 채로 뜨면 놀란다.
  const ZOOM_MIN = 1, ZOOM_MAX = 2.6
  const [zoom, setZoom] = useState(1)
  const 배율 = (v) => setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(v * 20) / 20)))
  // 🤏🤏 **두 손가락으로 벌려서 확대** (창업자 2026-08-09
  //    📮 *"내가 원한건 자판으로 글쓰다 안보이면 **손가락으로 확대해서** 쓸 수 있는 것이었음"*)
  //    ⭐ ＋ 단추는 «자판을 가리는 위바»까지 손이 올라가야 한다. 글을 치는 손은 화면 가운데 있다 —
  //       거기서 바로 벌리면 된다. 그게 사진 앱·지도에서 몸에 밴 동작이다.
  //    ⛔ 손가락이 «둘일 때만» 동작한다 — 하나면 스티커 끌기·글칸 누르기 그대로다.
  //    ⛔ 벌리는 동안엔 스티커 끌기를 멈춘다(`pinching`) — 안 그러면 첫 손가락에 스티커가 딸려 간다.
  const pinchRef = useRef(null)
  const ptsRef = useRef(new Map())
  const [pinching, setPinching] = useState(false)
  const 두점거리 = () => {
    const p = [...ptsRef.current.values()]
    return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y)
  }
  const pinchDown = (e) => {
    ptsRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (ptsRef.current.size === 2) {
      pinchRef.current = { d0: 두점거리() || 1, z0: zoom }
      setPinching(true)
    }
  }
  const pinchMove = (e) => {
    if (!ptsRef.current.has(e.pointerId)) return
    ptsRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const p = pinchRef.current
    if (!p || ptsRef.current.size < 2) return
    e.preventDefault?.()
    배율(p.z0 * (두점거리() / p.d0))
  }
  const pinchUp = (e) => {
    ptsRef.current.delete(e.pointerId)
    if (ptsRef.current.size < 2 && pinchRef.current) { pinchRef.current = null; setPinching(false) }
  }
  // 🐛🐛 **이 줄은 «속지 본문»의 글씨체·크기다 — 글자 «스티커»를 칠 땐 뜨면 안 된다.** (2026-08-07 전수검사에서 잡음)
  //   ⛔ `typing` 은 `.decor-stage` 안 아무 `textarea` 에나 켜져서, 글 상자·포스트잇을 칠 때도 같이 떴다.
  //      그러면 ⑴도구 바엔 «그 스티커»의 「글씨」 갈래가, 서랍엔 «종이 본문»의 글씨 줄이 **둘 다** 뜨고
  //           ⑵서랍 줄을 누르면 스티커가 아니라 **종이 본문**이 바뀐다 → 유저 눈엔 「안 먹는다」.
  //   📏 게다가 두 줄이 서랍을 94px 먹어 창업자 폰에서 **스크롤 칸이 34px**(손가락보다 얇다)이 됐다.
  //   ⭐ `typingId` = 「어느 «아이템»의 글칸에 커서가 있나」. 종이 본문을 칠 땐 늘 `null` 이다
  //      (스테이지를 누르는 순간 `setTypingId(null)`). 그래서 이 한 조건으로 둘이 갈린다.
  const showWriteTools = writing || (typing && !typingId)
  // ⌨️⌨️ **가로에서 종이 글칸에 커서가 들어가면 「큰 글칸」으로 바꾼다** (창업자 확정 2026-08-09)
  //    📮 *"글자쓰면 위로 올라가 붙음"* · *"1칸만보여"* — 자판이 뜨면 앱에 **160px 밖에 안 남는다**(실측).
  //    ⛔ 그 안에 종이·서랍·도구바를 다 넣을 방법은 없다 — **덜 줄이는 문제가 아니라 자리가 없는 문제**다.
  //    ⭐ 그래서 쓰는 «동안»엔 서랍·도구바를 접고 종이를 화면 폭으로 넓힌다(CSS 가 가로에서만 한다).
  //    ⛔⛔ **처음엔 스티커 글 상자(`typingId`)를 뺐는데 그게 틀렸다** (창업자 폰 캡처 2026-08-09 17:36).
  //       스티커에 글을 칠 때도 «자판은 똑같이 뜬다» — 160px 안에서 종이·서랍·도구바가 그대로 뭉갠다.
  //       📌 가른 기준이 「상자가 작냐」였는데, 진짜 기준은 **「자판이 떴냐」**다. 상자 크기는 상관이 없었다.
  //    ⭐ 그래서 «종이가 쪼그라들지 않게» 하는 건 둘 다 해준다 — `.decor-stage.typing` 바닥값(CSS).
  //    ⛔⛔ 다만 **큰 글칸(620px)까지 스티커에 주면 오히려 나빴다** (창업자 캡처 17:45 · 재현으로 확인)
  //       스티커는 종이 «위 한 점»이라, 종이를 620 으로 키우면 그 점을 찾아 한참 굴려야 한다.
  //       창업자 화면이 정확히 그 모습이었다 — 스티커만 덩그러니 크고 종이 맥락이 사라졌다.
  //    ✅ 그래서 큰 글칸은 «종이 글칸»에만. 스티커 글 상자는 바닥값(230px)으로 안 쪼그라들기만 한다.
  // ⛔⛔⛔ **큰 글칸을 통째로 뺐다** (창업자 캡처 2026-08-09 18:13 · *"확대하면 이렇게 크게 되고 먹통"*)
  //    무슨 일이었나 = 글칸에 커서가 들어가면 종이를 화면 폭으로 넓히고 서랍·도구바를 접었다.
  //    창업자에겐 그게 **「확대되고 먹통」**으로 보였다 — 스티커만 거대해지고 고를 데가 사라지니까.
  //    ⛔ `typingId` 로 스티커를 가르려 했는데 **그 값이 스티커 글 상자에선 안 잡힌다.**
  //       📌 내 재현에도 `큰글칸: true` 로 «찍혀 있었는데** 「재현이 경로를 못 밟았나 보다」 하고 넘겼다.
  //          재현이 맞았고 앱이 그랬다. **규칙 18을 내가 어겼다 — 검사 결과를 내 가설로 덮었다.**
  //    ✅ 남기는 것 = `.decor-stage.typing` **바닥값(230px)** 하나. 자판이 떠도 종이가 안 쪼그라들되
  //       **화면 구성은 안 바뀐다.** 갑자기 바뀌는 화면이 작은 종이보다 훨씬 나쁘다.
  const bigWrite = false
  // ⌨️⌨️ 탭을 옮기면 종이 커서를 «내려놓는다» (창업자 2026-08-08 캡처 — 일꾸 탭인데 글씨·크기 줄이
  //   서랍을 먹고 고르는 칸이 한 줄뿐이었다). 폰은 「뒤로가기」로 키보드만 닫혀 **커서가 남는다**
  //   (blur 가 안 온다) → typing 이 계속 참이라 위 줄이 유령처럼 떠 있었다.
  //   ⭐ 탭 이동 = 「지금은 글 쓰는 중이 아니다」라는 신호이니 커서를 명시적으로 푼다.
  //   ⛔ 「글쓰기」 탭엔 안 건다 — 거긴 글 쓰러 가는 자리다.
  const dropCaret = () => { const el = document.activeElement; if (el && el.tagName === 'TEXTAREA') el.blur() }
  // ⌨️⌨️ **자판이 내려가면 «저절로» 원래 판으로 돌아온다** (창업자 2026-08-09 *"다썼어요 가로모드 아직도 있어"*)
  //    ⛔ 처음엔 「다 썼어요」 단추로 나가게 했는데 창업자가 두 번 말했다 — *"왜 저기떠있는지 모르겠다"*.
  //       **모르는 단추는 없는 것만 못하다.** 나가는 길은 «눌러야 아는 것»이 아니라 저절로여야 한다.
  //    ⭐ 안드로이드는 뒤로가기로 «자판만» 닫혀 blur 가 안 온다(v9.99) — 그래서 blur 대신 **판 높이**를 본다.
  //       index.html 의 viewport 가 interactive-widget=resizes-content 라, 자판이 뜨고 내릴 때 판 높이가 실제로 오르내린다.
  //    📌 «가장 낮았던 높이»를 기억해 두고 거기서 100px 넘게 올라오면 = 자판이 내려간 것.
  //       ⛔ 「처음 높이」와 견주면 안 된다 — 커서가 들어간 직후는 아직 자판이 안 떠서 그게 최고값이다.
  useEffect(() => {
    if (!typing) return
    let 바닥 = window.innerHeight
    const 봄 = () => {
      const h = window.innerHeight
      if (h < 바닥) 바닥 = h
      else if (h > 바닥 + 100) dropCaret()
    }
    window.addEventListener('resize', 봄)
    return () => window.removeEventListener('resize', 봄)
  }, [typing])
  // 🎁 출시기념 팩 안내 — 서랍을 처음 열 때 한 번만. **선물은 받는 자리에서 알려줘야 바로 써본다.**
  //    (`useState` 초기값으로 한 번만 읽는다 — 렌더마다 localStorage 를 두드리지 않게)
  const [gift, setGift] = useState(() => needsGiftPack())
  // 🕗 최근 쓴 것 — **서랍을 여는 «순간» 값으로 고정한다.**
  //    ⛔ 붙일 때마다 다시 읽으면 맨 윗줄이 방금 붙인 것으로 계속 흔들려 «자리»가 안 생긴다.
  //    (음식 아이콘 픽커 v8.81 이 같은 이유로 시트 여는 순간 값으로 굳혔다)
  const [recent] = useState(() => recentStickers())
  // 💰 자물쇠를 누르면 열리는 「사기」 시트. null 이면 안 떠 있다.
  //    ⛔ sellable 이 false 인 동안엔 자물쇠 자체가 안 나오므로 이 값은 영영 null 이다.
  const [buyPack, setBuyPack] = useState(null)

  // 🧷 배경격(액자 프레임·포스트잇·메모라벨) = 그 위에 스티커·글자를 얹는 밑판. 이건 탭해도 맨 앞으로 안 올린다(안 그러면 눌렀을 때 애써 꾸민 작은 스티커·글자가 다 뒤로 숨어버림 — 창업자 제보 2026-07-26).
  // 🧷 '밑판'격 아이템 — 탭해도 맨 앞으로 올리지 않는다(올리면 위에 붙인 작은 스티커·글자가 다 숨는다).
  //    `pf_` = PNG 손그림 프레임(2026-07-29 추가). 벡터 `FRAMES`와 똑같이 밑판으로 다뤄야 한다.
  //    `sf_` = 여름 프레임. 이것도 프레임인데 밑판 목록에서 빠져 있어서, 탭하면 맨 앞으로
  //    올라와 안에 꾸며둔 작은 스티커를 다 덮었다(v8.59에서 고친 문제가 여기서 재발).
  //    `hl` = 형광펜. 마테와 «같은 성질»이다 — 넓게 깔리는 띠라, 탭했다고 맨 앞으로 올라오면
  //    그 밑에 붙여둔 스티커에 죄다 색이 입혀진다(multiply 라 비치긴 해도 색은 얹힌다).
  const isBacking = (it) => !!it && (!!FRAMES[it.key] || it.type === 'note' || it.type === 'tape' || it.type === 'hl' || (it.type === 'sticker' && typeof it.key === 'string' && (it.key.startsWith('dc_dma') || it.key.startsWith('pf_') || it.key.startsWith('sf_'))))
  // 선택하면 맨 앞으로(배열 끝으로) — 겹칠 때 자연스럽게 위로. 단 배경격은 제자리 유지.
  // ⌨️⌨️ **아이템을 만지면 «종이 본문» 커서를 내려놓는다** (창업자 폰 캡처 2026-08-12 · 재현으로 확정)
  //   ⛔⛔ 폰은 뒤로가기로 «자판만» 닫혀 blur 가 안 온다 → 본문 커서가 남고 `typing` 이 참인 채다.
  //      그 상태로 글 상자를 고르면 `showWriteTools` 가 켜져 있어 세 가지가 한꺼번에 어긋난다:
  //        ⑴서랍의 「글씨」를 누르면 글 상자가 아니라 **«본문»이 바뀐다**(＝「글씨체가 바뀐 것 같아」)
  //        ⑵본문용 「글씨·크기」 두 줄이 자리를 먹어 **스티커 굴칸 207 → 156px**(＝「갑자기 칸 작아짐」)
  //        ⑶글 상자 컨텍스트 갈래가 **하나도 안 뜬다**(＝「글씨 크게 하는 게 없다」)
  //   📌 셋이 다른 버그가 아니라 **하나였다.**
  //   ⛔ v10.18 은 「탭을 옮길 때」만 내려놨다 — **「아이템을 만질 때」가 빠져 있었다.**
  //   ⚠️ `typingId` 가 있으면(＝«그 아이템»의 글칸에 커서) 안 건드린다 — 글 쓰는 중에 커서를 뺏으면 안 된다.
  const dropBodyCaret = () => { if (!typingId) dropCaret() }
  const select = (id) => {
    if (id) dropBodyCaret()
    setSel(id)
    if (id) setItems((arr) => {
      const i = arr.findIndex((x) => x.id === id)
      if (i < 0 || isBacking(arr[i])) return arr
      return [...arr.slice(0, i), ...arr.slice(i + 1), arr[i]]
    })
  }
  // 순서 수동 조절 — 다 꺼내 다시 배열 안 해도 되게. 맨 뒤=배열 앞, 맨 앞=배열 끝.
  // ↩ 아래 넷은 «값을 바꾸기 전»에 mark() 로 자리를 찍는다. 하나라도 빠지면 그 동작만 안 무러진다.
  const sendToBack = (id) => { mark(); setItems((arr) => { const i = arr.findIndex((x) => x.id === id); return i <= 0 ? arr : [arr[i], ...arr.slice(0, i), ...arr.slice(i + 1)] }) }
  const bringToFront = (id) => { mark(); setItems((arr) => { const i = arr.findIndex((x) => x.id === id); return (i < 0 || i === arr.length - 1) ? arr : [...arr.slice(0, i), ...arr.slice(i + 1), arr[i]] }) }
  // ⚠️ `rec` = 드래그가 «시작될 때만» true. 안 그러면 손가락 움직임마다 한 칸씩 쌓인다.
  const patch = (id, p, rec) => { if (rec) mark(); setItems((arr) => arr.map((x) => (x.id === id ? { ...x, ...p } : x))) }
  // 버튼(색·무늬·모양·글씨체·모션·효과·뒤집기)에서 부를 때는 «항상» 기록한다
  const patchRec = (id, p) => patch(id, p, true)
  // ↔↔ **좌우 뒤집어도 되는 것인가** (창업자 2026-08-06 *"캐릭터좌우반전돼?"*)
  //   ✅ 캐릭터·프레임·코너·소품·음식 = 뒤집어도 자연스럽다(실물로 뒤집어 확인했다).
  //      ⭐ 특히 **코너 장식은 왼쪽 위 모양 하나뿐**이라 뒤집기가 곧 «새 컷»이다(6 → 24).
  //   ⛔ **글자가 «그려진» 스티커는 거울 글자가 된다** — 한끼 문구·문구·요일 라벨 = 42컷.
  //   ⛔ 직접 쓴 글자(type 'text')·포스트잇도 막는다 — 유저가 친 글씨가 뒤집힌다.
  //   ⭐ 화살표(ta_)는 안 막는다 — 뒤집으면 → 가 ← 가 되어 오히려 쓸모가 는다.
  //   📌 **접두어로 판단한다.** 라벨로 가르면 라벨을 다듬는 순간 깨진다(v9.07 사고).
  const NO_FLIP = ['tw_', 'tn_']   // 글자가 그려진 컷 (tw_ 문구 · tn_ 요일·라벨)
  //   ⛔ 형광펜(hl)도 막는다 — 좌우 대칭이라 뒤집어도 «아무 일도 안 일어난다».
  //      아무 일도 안 일어나는 단추는 고장으로 읽힌다(죽은 버튼 금지).
  const canFlip = (it) => !!it && it.type !== 'text' && it.type !== 'note' && it.type !== 'hl'
    && !(typeof it.key === 'string' && NO_FLIP.some((p) => it.key.startsWith(p)))
  // ↩ **X 로 지운 것도 되살아난다** — 창업자가 물었던 「X 버튼이랑 뭐가 다르냐」의 답이 여기다.
  const remove = (id) => { mark(); setItems((arr) => arr.filter((x) => x.id !== id)); setSel(null) }

  // 🛟 자동저장 — 편집할 때마다 초안을 localStorage 에 저장(디바운스). 앱이 죽거나 실수로 닫혀도 안 날아감.
  const exitedRef = useRef(false) // 저장/나가기 후엔 초안 재생성 안 되게(대기중 디바운스 무효화)
  useEffect(() => {
    if (exitedRef.current) return
    const t = setTimeout(() => {
      try { localStorage.setItem(draftKey(recipe.id), JSON.stringify({ items, bg, thumb, at: Date.now() })) } catch { /* 용량 초과 등 무시 */ }
    }, 350)
    return () => clearTimeout(t)
  }, [items, bg, thumb, recipe.id])
  const clearDraft = () => { exitedRef.current = true; try { localStorage.removeItem(draftKey(recipe.id)) } catch { /* noop */ } }
  // 저장 안 한 변경이 있나(취소 시 확인용)
  const isDirty = () => JSON.stringify(items) !== JSON.stringify(recipe.decor || []) ||
    (bg || 'none') !== (recipe.decorBg || 'none') || thumb !== savedThumb
  const doSave = () => { clearDraft(); onSave(items, bg, thumb) }
  const doExit = () => { clearDraft(); onClose() }
  const handleCancel = () => { if (isDirty()) setExitAsk(true); else doExit() }
  // 🔙 안드로이드 뒤로가기도 **취소 버튼과 똑같이** 동작하게 — 부모(상세화면)가 이걸 부른다.
  //    (뒤로가기가 곧장 닫아버려서 "저장하지 않고 나갈까요?" 를 건너뛰던 것 수정)
  if (closeRef) closeRef.current = handleCancel

  const selItem = items.find((x) => x.id === sel)
  const selNoteColor = NOTE_COLORS.find((n) => n.key === selItem?.key) || NOTE_COLORS[0]

  // 선택한 아이템 편집용 '고정 컨텍스트 바' 스타일 — 캔버스 바로 아래 항상 보임(스크롤 왔다갔다 없앰)
  const ctxScroll = { display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2, flex: 1 }
  const ctxRow = { display: 'flex', alignItems: 'center', gap: 9 }
  // 🎨 색 동그라미 — 30 → 36px.
  //   ⚠️ 44px 까지 못 올린다: 색이 15개라 44px 면 한 줄에 여섯뿐이라 «세 줄»이 되고 150px 를 먹는다.
  //      색 고르기는 «많은 것을 나란히 견주는» 일이라 그 판을 쪼개면 고르기가 더 어려워진다.
  //      (색 팔레트는 접근성 기준에서도 흔히 예외로 다루는 자리다 — ⛔단 나머지 칸은 전부 44px 이상)
  const ctxDot = { width: 36, height: 36, borderRadius: '50%', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }
  const ctxChip = { flex: '0 0 auto', padding: 4, borderRadius: 10, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }
  const selOn = '2.5px solid var(--brown)'
  const selOff = '1.5px solid var(--line)'
  // 🐻🐧 모션·효과 바를 띄울 대상 = **친구들 탭 스티커 전부**(부엌 식구들 포함).
  //   ⚠️ 전엔 `KITCHEN_IDS` 와 `gp_` 접두어 둘로 판정했는데, 여름 곰펭(`sm_`)·가을 곰펭(`au_b`)이
  //      어느 쪽에도 안 걸려 **모션·효과 바가 아예 안 떴다**(창업자 2026-07-30 제보).
  //      이름 규칙 대신 이미 있는 분류(친구들 탭)를 쓴다 → 새 계절 곰펭도 자동으로 된다.
  //   ✍️ **직접 쓴 글자에도 붙인다** (창업자 2026-08-07 *"글자에도 모션이나 효과가 들어가면 더 좋고"*)
  //      ⭐ 모션·효과는 `transform`·파티클이라 그림이든 글자든 똑같이 얹힌다 — 새로 만들 게 없다.
  //      ⛔ 형광펜(`hl`)·마테(`tape`)엔 안 붙인다 — 글자에 겹쳐 두는 띠라 움직이면 밑줄이 어긋난다.
  //   ⛔⛔ **「친구들 스티커만」이 창업자 제보의 뿌리였다** (2026-08-07 폰 제보 *"5번은 없어(어딨는지 못찾음)"*)
  //      일기 서랍 탭 = **마테·데코·글자 셋뿐**(실측) — **친구들 탭이 «아예 없다».**
  //      그래서 일꾸에선 「직접 쓴 글자」 말고는 두 단추를 띄울 길이 자체가 없었다.
  //      ⭐ 모션은 `hk-m-*` CSS 클래스이고 효과는 위에 겹치는 파티클이라 **밑이 무엇이든 그냥 얹힌다** →
  //         데코 스티커·포스트잇·글 상자·사진 전부 된다. 막고 있던 건 코드지 그림이 아니었다.
  const selCanAnim = !!selItem && ['sticker', 'text', 'note', 'photo'].includes(selItem.type)
  // 🎬 기본값 — 친구들 스티커만 «가만 두면 통통»이고 나머지는 «가만히»다(`StickerArt` 926줄과 같은 규칙).
  //   ⛔ 예전 코드는 `selItem.motion || 'tongtong'` 이라 글자도 「통통」이 켜진 것처럼 보였는데
  //      `motionClass(undefined)` 는 '' 라 **실제로는 안 움직였다**(칩과 화면이 어긋나 있었다).
  const selMotion = selItem ? (selItem.motion ?? (selItem.type === 'sticker' && FRIEND_IDS.has(selItem.key) ? 'tongtong' : 'none')) : 'none'
  const selFx = selItem?.fx || 'none'
  // 🏷 글 상자(`art`)는 배경이 «우리 그림»이라 포스트잇 색·무늬·모양이 아무 일도 안 한다
  //    (`DecorLayer` 424줄이 `it.art` 면 `ArtBox` 로 통째로 빠진다) → 죽은 단추라 아예 안 띄운다.
  //    ⭐ 창업자 폰 제보 2026-08-07 *"소프트잇아니고 스티커에도 포스트잇(줄눈,그런선택지가 나와)"* 가 이것.
  const selPlainNote = selItem?.type === 'note' && !selItem.art
  // 뭐든 선택하면 컨텍스트 바를 띄운다 — 최소한 '순서(맨 뒤/맨 앞)'는 항상 조절 가능하게(창업자 레이어 제보). 색·움직임 등은 그 아래 종류별로.
  const hasCtx = !!selItem
  // 📏 손가락 최소 44px — Apple 44pt · Material 48dp · WCAG 44px (2026-08-07 조사)
  //   ⛔ 2026-08-07 실측에서 꾸미기 화면의 «누르는 칸 20개가 전부» 미달이었다(19~40px).
  //      v9.47 에 「터치 영역 44px」를 했는데 이 화면만 빠져 있었다.
  const layerBtn = { minHeight: 44, padding: '0 16px', borderRadius: 999, fontSize: 13, fontWeight: 700, flex: '0 0 auto', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', background: 'var(--surface)', color: 'var(--text-sub)', border: '1px solid var(--line)' }

  // 서랍 탭 — 배경 → **프레임** → 데코 → 글자 → 친구들 → 음식 → 라이프. 음식만 요리별 서브칩(2단계).
  // 🖼 **프레임을 독립 탭으로 뺐다** (창업자 2026-07-30 *"프레임은 프레임만 모아놓는 탭을 만들어야겠어"*)
  //   왜 = 프레임이 **61컷**(사철 49 + 여름 12)인데 데코 탭에 섞여 있어서, 데코 탭 하나가 201컷이 됐다.
  //   프레임 하나 찾으려고 소품·마테·메모를 다 지나쳐야 했다. 프레임은 **맨 밑에 까는 판**이라
  //   쓰는 순서도 제일 먼저다 → 배경 바로 다음이 제자리.
  //   (배경 옆에 두는 건 2026-07-26 결정 그대로 — 꼬르곰·펭펭 넣는 큰 프레임은 배경색과 맞춰봐야 한다)
  // 🧹 **탭 재편 (2026-07-30)** — 창업자 *"꾸미기탭도 정리가 필요해. 배경, 포스트잇, 글자(직접쓰는거)
  //    글자(스티커) 마테, 프레임, 데코, 친구들, 음식, 라이프 다 섞여있어. 거기에 리컬러도."*
  //    ⚠️ 실제로 **마테가 세 군데**에 흩어져 있었다(배경 탭의 CSS 마테 · 데코 탭의 스티커 마테 · 여름 마테).
  //    → **한 종류는 한 탭에.** 배경엔 배경만, 마테는 마테 탭으로.
  //    ⚠️ **요리도구가 운동용품과 같은 탭('라이프')에 있었다** — 요리 앱인데 아령 옆에 냄비가 있었다.
  //    → 요리도구를 **재료 탭**으로 옮기고 라이프 탭은 없앴다(운동 8컷은 데코로).
  //    ⚠️ **음식 = 레시피마다 사진이 이미 붙는데 같은 음식 이모지를 또 고를 이유가 없다**(창업자).
  //    → 요리 음식 33컷(한식·분식·양식·중식·일식)을 빼고 **재료 위주**로. 탭 이름도 `재료`.
  //       ⭐ 이건 **꾸미기 서랍만**이다 — 레시피 표지 아이콘은 `FoodIcon.jsx`가 따로 218종을 계속 준다.
  // 📔📔 **배경 탭은 다이어리에 안 뜬다** (2026-08-06)
  //   그 탭에 든 둘이 다이어리에선 **아무 일도 안 한다** — 위 캔버스가 `paper` 면
  //   `Thumb` 를 아예 안 그리므로 ⑴「표지 그림 되돌리기」가 되돌릴 표지가 없고
  //   ⑵「배경지」를 골라도 그릴 자리가 없다(속지가 그 자리다).
  //   ⛔ 눌러도 아무 변화가 없는 버튼은 **고장으로 읽힌다.**
  //   ⚠️ 창업자가 같은 종류를 방금 잡아냈다 — *"레시피꾸미기 아니고 요리다이어리"*.
  //      **표지용 UI 가 다이어리에 그대로 딸려온 것**이 뿌리다(제목도, 이 탭도).
  // 📔 속지는 여기 없다 — **큰 두 칸(「속지 고르기」/「꾸미기」) 중 왼쪽**으로 올라갔다(위 `mode` 참고).
  //   전엔 다이어리 화면에 「선·종이·틀」 줄이 따로 있고 꾸미기는 또 다른 버튼이었다 —
  //   **한 장을 만드는데 손이 두 군데**였다(창업자 *"나눠져있는게 조금 불편해"*).
  const CATS = [
    ...(isDiary ? [] : [{ key: 'bgtape', label: '배경' }]),
    { key: 'frame', label: '프레임' },
    { key: 'tape', label: '마테' },
    { key: 'deco', label: '데코' },
    { key: 'notetext', label: '글자' },
    // 📔📔 **「기록」 = 일꾸 전용 탭** (창업자 2026-08-12 *"일꾸에 탭을 하나 만들어서 거기에 다 넣자"*)
    //   ⭐ 왜 «글자» 탭에 안 넣나 = 창업자 원문 그대로다 —
    //      *"레꾸에 글자가 너무 많아서 스크롤하려면 좀 불편했어. 일꾸는 상대적으로 스티커가 너무 적었고"*
    //      99컷을 일꾸 «글자» 탭에 그냥 옮기면 **이번엔 일꾸 글자 탭이 길어진다.** 문제가 자리만 옮긴다.
    //   ⭐ 여기 들어가는 것 = 맛 평가·반응 평가·조리법·요리 상황·식사 상황·미리 준비·보관·건강 태그
    //      여덟 다 «요리를 기록할 때 붙이는 라벨»이라 한 탭으로 묶이는 게 자연스럽다.
    //   ⚠️ 레꾸에선 이 탭이 저절로 사라진다 — 그룹이 전부 `only: 'diary'` 라 0개가 되고,
    //      591줄 「빈 탭은 안 그린다」가 걷어낸다. `isDiary` 조건은 «혹시»를 막는 이중 안전장치다.
    ...(isDiary ? [{ key: 'record', label: '기록' }] : []),
    { key: 'buddies', label: '친구들' },
    { key: 'food', label: '재료' },
  ]
  // 🏖 제철 그룹은 맨 위로 — 여름(6~8월)엔 여름 아이템이 먼저 보인다(창업자 2026-07-29
  //    "시즌별로 아이템을 많이 넣음 좋겠어"). 철이 지나도 **숨기지는 않는다** — 쓰던 걸
  //    못 찾게 되는 게 더 나쁘다. 순서만 뒤로 밀린다.
  // ⭐ 달력 계산은 `src/season.js` 한 곳에서 한다(예전엔 여기와 ShareDrawCard 에 따로 있었다).
  //    새 계절 첫 2주는 **지난 계절도 함께 제철** — 9/1에 여름이 뚝 끊기지 않는다.
  // ⚠️ sort 는 안정 정렬(ES2019+)이라 같은 순위끼리는 원래 순서가 유지된다.
  // ⏳ 아직 공개일이 안 된 세트는 목록에서 아예 뺀다(핼러윈·산타가 7월 서랍에 보이면 이상하다).
  //    한 번 공개된 뒤엔 계속 남는다 — 그 뒤론 순서만 밀린다.
  // ⭐ **그룹 배치 순서 = 한정판(제철) → 리컬러 → 사철** (창업자 확정 2026-07-30
  //    *"순서는 한정판이 젤 위 그다음 리컬러 그다음 4계절용 순이어야해"* ·
  //    *"각 탭별로 리컬러는 한정판 아래 배치하라는 뜻이야"*).
  //    → 귀한 것부터 보인다: 한정판은 지금 아니면 못 쓰고, 리컬러는 색을 맞출 수 있어 활용도가 높다.
  //    ⚠️ sort 는 안정 정렬이라 같은 순위끼리는 배열에 적은 순서가 그대로 유지된다.
  // 🎁 **선물(`gift`)은 무조건 맨 위** — 창업자 2026-08-03 *"친구들 제일 아래있어 잘 모름"*.
  //    한정판보다도 위다: 한정판은 「지금 아니면 못 쓴다」이고 선물은 **「있는 줄도 모른다」**라
  //    못 찾는 쪽이 더 나쁘다. (축하 3컷은 친구들 탭 맨 아래라 아무도 못 봤다)
  // 🔒 **유료팩(자물쇠)은 선물 바로 다음** — 광고라서 눈에 띄어야 팔린다.
  //    한정판(제철)보다 위인 이유 = 한정판은 「지금 아니면 못 쓴다」이고
  //    자물쇠는 **「이런 게 있는 줄도 모른다」**라 못 보는 쪽이 더 나쁘다(선물과 같은 이유).
  //    ⛔ 산 뒤엔 자물쇠가 아니라 «내 것»이므로 이 새치기를 안 한다(locked 일 때만).
  //    ⚠️ `STICKER_GROUPS` 가 아니라 `drawerGroups()` 를 쓴다 — 직접 쓰면 유료팩이 조용히 빠진다.
  // 📔 `only` = 그 그룹이 **어느 판에서만** 보이나. `'diary'` 면 다이어리에만, `'cover'` 면 표지에만.
  //   ⛔ 지금 `only` 가 붙은 그룹은 **하나도 없다** — 전부 둘 다에서 쓴다(서랍 394컷이 통째로 재사용된다).
  //   ⭐ 가르고 싶어지면 `STICKER_GROUPS` 에 `only: 'diary'` **한 줄**만 붙이면 된다.
  //      (창업자 질문 2026-08-06 *"다이어리 전용틀,속지,꾸미기는 레꾸에서 사용안되게 할 수 있어??"* → 된다)
  // 📔 **선반 가르기** — 일기를 꾸밀 때만. 왼쪽 칸이면 `diary` 붙은 것만, 오른쪽 칸이면 나머지 전부.
  //    표지 꾸미기(`isDiary === false`)는 선반이 하나라 **아무것도 안 거른다**(일기 세트도 그대로 보인다).
  const where = isDiary ? 'diary' : 'cover'
  const onShelf = (x) => !isDiary || (shelf === 'diary' ? !!x.diary : !x.diary)
  const groupsByTab = (t) => drawerGroups()
    .filter((x) => x.tab === t && isReleased(x.from) && (!x.only || x.only === where) && onShelf(x))
    .sort((a, b) => ((b.gift ? 1 : 0) - (a.gift ? 1 : 0))
      || ((b.locked ? 1 : 0) - (a.locked ? 1 : 0))
      || (seasonRank(a.season) - seasonRank(b.season))
      || ((b.recolor ? 1 : 0) - (a.recolor ? 1 : 0)))

  // 🧭 **빈 탭은 안 그린다** — 일기 선반엔 「글자·친구들·재료」가 없다(그 세트엔 그런 컷이 없다).
  //    ⛔ 빈 탭을 남겨두면 눌러보고 아무것도 없어서 «고장 난 줄» 안다.
  //    ⚠️ `CATS` 는 위에서 만들어지고 `groupsByTab` 은 여기 있다 — 순서 때문에 «여기서» 거른다.
  // ⭐⭐ **「글자」 탭은 스티커 그룹이 0개여도 띄운다** (창업자 2026-08-06 *"일꾸 레꾸다되는거지?"*)
  //   ⛔ 탭은 「그 탭에 스티커 그룹이 있나」로 띄우는데, 일기 세트는 데코 22·프레임 3·마테 5 뿐이라
  //      **일꾸에선 「글자」 탭이 통째로 사라졌다.** 그런데 그 탭 안엔 그룹 말고
  //      **글자 넣기 · 형광펜 · 포스트잇**이 «하드코딩»으로 들어 있다 → 일꾸에서 셋 다 못 썼다.
  //   ⭐ **일기는 글 쓰는 화면**이다. 거기에 글자 도구가 없는 건 앞뒤가 안 맞는다.
  //   📌 이건 형광펜이 만든 문제가 아니라 **원래 있던 구멍**이다 — 형광펜 덕에 드러났다.
  //   ⭐ `bgtape`(배경·마테) 를 늘 띄우는 것과 «같은 이유»다: 그룹이 없어도 내용이 있는 탭.
  //   ⚠️ 탭 «안»의 스티커 그룹은 일꾸/레꾸 규칙 그대로다 — 도구 셋만 양쪽에 뜬다.
  const visCats = CATS.filter((c) => c.key === 'bgtape' || c.key === 'notetext' || groupsByTab(c.key).length > 0
    || (c.key === 'tape' && (!isDiary || shelf === 'all')))
  // 고른 탭이 이 선반엔 없으면 첫 탭으로 옮긴다(안 그러면 빈 화면이 뜬다)
  useEffect(() => {
    if (visCats.length && !visCats.some((c) => c.key === cat)) setCat(visCats[0].key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shelf])

  // 포스트잇을 선택하면 서랍을 맨 위로 올려 '무늬·모양 꾸미기'가 바로 보이게 한다.
  const drawerRef = useRef(null)
  useEffect(() => {
    const it = items.find((x) => x.id === sel)
    if (it?.type === 'note' && drawerRef.current) drawerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel])

  const addSticker = (key) => {
    // 🏷🏷 글 자리를 재둔 그림(메모지·라벨지·찢은 종이·메모라벨)은 **어느 탭에서 붙여도 글 상자**로.
    //   같은 그림이 데코에선 «안 써지는 그림», 글자 갈래에선 «글 상자»로 붙는 두 갈래였다 —
    //   창업자 2026-08-08 *"글자안써짐 아래탭에 글자색고르기없음"* (v9.88 「사진 두 길」과 같은 뿌리).
    //   ⛔ 프레임(pf_·벡터)은 밑판이라 제외 — 「글쓰기 프레임」은 글자 갈래에서 붙일 때만 글 상자다.
    if (BOX_PAD[key] && !FRAMES[key] && !key.startsWith('pf_')) return addBox(key)
    const n = items.length
    const isKf = KITCHEN_IDS.has(key)
    const isFrame = !!FRAMES[key] || (typeof key === 'string' && key.startsWith('pf_'))   // 벡터·PNG 프레임 둘 다
    const it = {
      id: newDecorId(), type: 'sticker', key,
      x: isFrame ? 0.5 : 0.5 + ((n % 3) - 1) * 0.06, y: isFrame ? 0.46 : 0.42 + ((n % 4) - 1.5) * 0.05,
      // 📏📏 **`rs_v`·`rs_k`(레꾸 캐릭터 32컷)만 0.32** — 창업자 *"근데 글자가 너무 작아?"* (2026-08-12)
      //   ⭐⭐ **`s` 는 «폭» 기준이다**(`DecorLayer` 225줄 `width: ${it.s * 100}%`).
      //      ⛔ 나는 처음에 «긴변» 기준으로 계산해 창업자에게 **11.7px 이라고 잘못 말했다.**
      //         이 컷들은 세로로 길어서(비율 0.54~1.01) 폭을 맞추면 긴변은 더 커진다.
      //      🔢 실측으로 다시 (종이 344px · 캡션 글자가 폰에서 몇 px):
      //         s 0.22(기본) **9.5px** / **s 0.32 → 14.0px** / (기존 99컷 `rs_g01` = 11.8px)
      //   ⛔⛔ **0.32 가 상한이다 — 0.34 는 못 쓴다.** 제일 좁은 컷 `rs_v06`(폭 204px)이
      //      0.34 면 **1.80배**로 확대돼 해상도 한계(1.7배)를 넘는다. 0.32 면 **1.69배**.
      //      → 0.32 는 0.34 보다 6% 작을 뿐인데 뭉개짐을 확실히 피한다.
      //   📌 더 키우려면 «시트를 뽑을 때 글자를 크게» 하는 수밖에 없다 — 확대는 화질을 못 살린다.
      //   ⚠️ 여기 값을 고치면 `scripts/check-sticker-res.mjs` 의 `defaultScale()` «도» 고칠 것(복사본이다).
      s: isFrame ? 0.58 : key === 'yum' ? 0.34 : isKf ? 0.28 : key.startsWith('gp_duo') ? 0.34 : key.startsWith('gp_') ? 0.26 : (key.startsWith('rs_v') || key.startsWith('rs_k')) ? 0.32 : PHOTO_IDS.has(key) ? ((key.startsWith('dc_') || key.startsWith('ch_')) ? 0.15 : 0.22) : FACE_KEYS.has(key) ? 0.11 : 0.2,
      r: isFrame ? 0 : ((n % 5) - 2) * 4,
      // 🐻🐧 친구들(캐릭터)은 붙자마자 통통 움직인다 — 소품·음식은 가만히.
      //    ⚠️ 여기도 `gp_` 접두어로 골랐었다 → 여름·가을 곰펭은 붙여도 모션이 안 박혔다.
      ...(FRIEND_IDS.has(key) ? { motion: 'tongtong', fx: 'none' } : {}),
    }
    // 🖼 프레임(액자)은 밑판이라 맨 뒤(배열 앞)로 — 이미 꾸며둔 스티커·글자가 프레임 위로 자연스럽게 얹힌다. 나머지는 맨 앞(위).
    mark()
    setItems((arr) => isFrame ? [it, ...arr] : [...arr, it])
    setSel(it.id)
    pushRecentSticker(key) // 🕗 다음에 열 때 맨 위에 놓아 준다(이번 서랍은 안 흔든다)
  }
  const addNote = (colorKey) => {
    const n = items.length
    const it = { id: newDecorId(), type: 'note', key: colorKey, text: '', font: 'gaegu', x: 0.62 + ((n % 2) - 0.5) * 0.06, y: 0.68, s: 0.34, r: ((n % 5) - 2) * 3 }
    mark(); setItems((arr) => [...arr, it])
    dropBodyCaret() // ⌨️ 본문 커서가 남아 있으면 내려놓는다 — 안 그러면 본문용 줄이 서랍을 먹는다
    setSel(it.id)
    setTypingId(it.id) // ⌨️ 붙이면 «그 자리»에 커서 (전엔 시트가 열렸다 — 창업자 *"너무 불편해"*)
  }
  // 🏷🏷 **글 상자** — 우리 라벨지·메모지 그림에 글을 얹는다 (창업자 2026-08-07)
  //   *"글자올릴수있는 스티커들을 다같이 배치해서 쓰자. 포스트잇이랑 여러가지 라벨들."*
  //   ⭐ `addNote` 와 «같은 길»이다 — `art` 한 칸만 더 준다. 그래야 글·크기·글씨체·되돌리기가 그대로 따라온다.
  //   ⭐ 크기는 그림 «가로세로»를 보고 정한다 — 리본 배너(3.25:1)에 정사각 크기를 주면 종이를 통째로 덮는다.
  //      납작할수록 넓게(폭 0.72), 네모날수록 좁게(0.44). 붙자마자 「이 정도면 쓰겠다」가 되는 크기.
  const addBox = (artKey) => {
    const n = items.length
    const ratio = stickerRatio(artKey) || 1
    //   ⛔ 세로로 긴 것(태그·책갈피)은 더 작게 — 폭 0.44 를 주면 «높이»가 종이의 63% 가 된다.
    //      실물 판에서 태그가 종이 절반을 먹는 걸 보고 알았다(숫자로는 안 보였다).
    const s = ratio >= 2.4 ? 0.72 : ratio >= 1.6 ? 0.6 : ratio >= 1.1 ? 0.5 : ratio >= 0.9 ? 0.44 : 0.32
    const it = { id: newDecorId(), type: 'note', art: artKey, text: '', font: 'gaegu', x: 0.5, y: 0.5 + ((n % 3) - 1) * 0.09, s, r: 0 }
    mark(); setItems((arr) => [...arr, it])
    dropBodyCaret() // ⌨️ 위와 같은 이유 — 본문 커서를 남겨두면 글 상자 갈래가 아예 안 뜬다
    setSel(it.id)
    setTypingId(it.id)   // ⌨️ 시트 대신 «그 자리»에 커서
    pushRecentSticker(artKey)
  }
  // 📷 내 사진을 «스티커»로 붙인다 (창업자 2026-08-06 *"무지나 도트도 사진 넣고싶을수있지않아?"*)
  //   ⭐ 틀의 사진칸은 「창에 끼우는 것」이라 창이 그려진 속지에서만 된다.
  //      이건 「사진을 얹는 것」이라 **무지·도트·표지 어디서든** 되고, 여러 장도 된다.
  //   ⭐ 그리고 이건 다이어리만의 것이 아니다 — 같은 에디터라 **레꾸(표지 꾸미기)에도 그대로 생긴다.**
  //   ⚠️ 700px·q0.8 로 줄인다 — 한 장이 100KB 넘으면 localStorage(≈5MB)가 금방 찬다.
  //      표지 사진(900)보다 작게 두는 이유 = 스티커는 **여러 장** 붙는다.
  const photoRef = useRef(null)
  // 🖼🖼 **프레임을 고른 채로 누르면 그 «창»에 딱 맞게 끼운다** (창업자 2026-08-06
  //    *"프레임 꾸미기에 넣어서 프레임잡으려면 사진 넣을수(스티커처럼) 있으면 좋겠어"*)
  //    ⭐ 사진은 프레임 «뒤»로 들어간다 — 프레임 그림엔 창이 뚫려 있어서 뒤에 깔아야
  //       창으로 사진이 비치고 테두리가 위에 얹힌다. 앞에 두면 **사진이 프레임을 덮는다.**
  //    📐 창 위치·크기는 짐작이 아니라 «실측표»(FRAME_WINDOW)를 쓴다.
  //       다시 뽑기 = scripts/frame-windows.mjs · 실측 = 프레임 75개 중 창을 찾은 것 54개
  //       창을 못 잰 프레임(테두리가 열려 있어 바깥과 이어진 것)은 평균값으로 넣고 손잡이로 맞추게 한다.
  const frameOf = (it) => (it && it.type === 'sticker' && (FRAMES[it.key] || (typeof it.key === 'string' && it.key.startsWith('pf_'))) ? it : null)
  const selFrame = frameOf(items.find((x) => x.id === sel))
  // 🔗🔗 **프레임 ↔ 속 사진 오가기** (창업자 폰 제보 2026-08-07 *"프레임에 넣은 사진을 줄이는 도구도 없고"*)
  //   ⛔ 사진은 프레임 «뒤»에 깔린다 → 창 안을 탭해도 «프레임»이 잡힌다(재현으로 확인).
  //      프레임 그림은 가운데가 투명이어도 `<img>` 는 네모 전체가 잡히기 때문이다.
  //   ⭐ 그래서 「탭으로 어떻게든 되게」 하지 않고 **길을 하나 낸다** — 컨텍스트 바에서 서로 오간다.
  //      한 번 고르면 지우기·크기·회전이 다 사진 것이 된다.
  const photoOfFrame = (f) => {
    if (!f) return null
    const tagged = items.find((x) => x.type === 'photo' && x.of === f.id)
    if (tagged) return tagged
    // ⚠️ 옛 저장본엔 `of` 표시가 없다 — 그땐 프레임 «바로 앞»(화면에선 바로 뒤)에 꽂았으니 그걸로 찾는다
    const i = items.findIndex((x) => x.id === f.id)
    const prev = i > 0 ? items[i - 1] : null
    return prev && prev.type === 'photo' ? prev : null
  }
  const selFramePhoto = photoOfFrame(selFrame)
  const selPhotoFrame = (selItem?.type === 'photo' && selItem.of) ? items.find((x) => x.id === selItem.of) : null

  // 🔀 컨텍스트 바 갈래 목록 — 종류마다 「있는 것만」. 여기 한 줄만 늘리면 갈래가 생긴다.
  //   ⚠️ `selFramePhoto`·`selPhotoFrame` 이 바로 위에서 정해지므로 **이 자리보다 앞에 두면 안 된다**
  //      (const 는 정의 전에 못 읽는다 — 위로 올렸다가 실제로 터졌다).
  //   🔪 안 D — 갈래는 «아이콘»이다(글자 알약 X). `ic` = `Icon` 이름.
  const ctxTabs = !selItem ? [] : [
    ...((selFramePhoto || selPhotoFrame) ? [{ k: 'photo', label: '사진', ic: 'photo' }] : []),
    { k: 'order', label: '순서', ic: 'layers' },
    ...(selItem.type === 'sticker' && RECOLORABLE.has(selItem.key) ? [{ k: 'color', label: '색', ic: 'palette' }] : []),
    ...(selItem.type === 'hl' ? [{ k: 'color', label: '색', ic: 'palette' }, { k: 'width', label: '굵기', ic: 'weight' }, { k: 'opacity', label: '진하기', ic: 'opacity' }] : []),
    ...(selItem.type === 'tape' ? [{ k: 'pattern', label: '무늬', ic: 'grid4' }, { k: 'width', label: '굵기', ic: 'weight' }] : []),
    // 📏 「크기」 = 글자 크기 (창업자 2026-08-12 *"일꾸 글자는 크기 조절이 없어"* · *"레꾸도 마찬가지"*)
    ...(selItem.type === 'text' ? [{ k: 'color', label: '색', ic: 'palette' }, { k: 'size', label: '크기', ic: 'textSize' }, { k: 'width', label: '굵기', ic: 'weight' }, { k: 'font', label: '글씨', ic: 'textA' }] : []),
    ...(selItem.type === 'note' ? [
      // 🎨 색 = 포스트잇이면 «종이색», 그림 글 상자면 «글자색» (창업자 2026-08-08 *"글자색고르기없음"*)
      { k: 'color', label: '색', ic: 'palette' },
      // 📏 여기가 창업자 제보의 자리 — 글 상자는 손잡이로 키우면 «그림까지» 커졌다.
      { k: 'size', label: '크기', ic: 'textSize' },
      { k: 'font', label: '글씨', ic: 'textA' },
      ...(selPlainNote ? [{ k: 'pattern', label: '무늬', ic: 'grid4' }, { k: 'shape', label: '모양', ic: 'shape' }] : []),
    ] : []),
    ...(selCanAnim ? [
      { k: 'motion', label: '움직임', ic: 'wave', lit: selMotion !== 'none' },
      { k: 'fx', label: '효과', ic: 'sparkle', lit: selFx !== 'none' },
    ] : []),
  ]
  // 고른 아이템이 바뀌면 그 갈래가 사라질 수 있다 → 없으면 첫 갈래로 «계산해서» 떨어뜨린다.
  //   ⛔ `useEffect` 로 고치면 한 프레임 동안 빈 줄이 그려진다(깜빡임).
  const ctxCur = ctxTabs.some((t) => t.k === ctxTab) ? ctxTab : (ctxTabs[0]?.k || 'order')

  const onPhotoFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const src = await new Promise((res) => {
      const r = new FileReader()
      r.onload = () => res(r.result)
      r.onerror = () => res(null)
      r.readAsDataURL(file)
    })
    if (!src) return
    const f = selFrame
    if (f) {
      const win = FRAME_WINDOW[f.key] || { cx: 0.5, cy: 0.5, w: 0.76, h: 0.74 } // 평균 = 실측 54개
      const fr = stickerRatio(f.key) || 1                       // 프레임 자체의 가로÷세로
      const box = (() => { const [a, b] = String(ratio).split('/').map(Number); return (a > 0 && b > 0) ? a / b : 1 })()
      const pw = f.s * win.w                                    // 사진 폭 = 판 폭의 몇 %
      const par = (win.w / win.h) * fr                           // 창의 가로÷세로 = 사진을 자를 모양
      // 창 «가운데»가 프레임 가운데에서 얼마나 떨어졌나 → 판 좌표로 옮긴다
      //   가로는 판 «폭», 세로는 판 «높이» 기준이라 (판의 가로÷세로)를 곱해 단위를 맞춘다
      const dx = (win.cx - 0.5) * f.s
      const dy = (win.cy - 0.5) * (f.s / fr) * box
      const shot = await cropRatio(src, par, 700, 0.8)
      // 🔗 `of` = **이 사진의 주인 프레임.** 사진이 프레임 «뒤»에 깔려 있어서 탭으로는 못 고른다
      //    (창업자 폰 제보 2026-08-07 *"프레임에 넣은 사진을 줄이는 도구도 없고"* — 재현으로 확인).
      //    → 프레임을 고르면 컨텍스트 바에 「속 사진 고르기」가 뜨고, 그때 이 표시로 찾아간다.
      //    ⚠️ 배열 순서로 찾으면 순서를 바꾸는 순간 깨진다 — 그래서 «누구 것인지»를 값으로 남긴다.
      const it = { id: newDecorId(), type: 'photo', src: shot, ratio: par, x: f.x + dx, y: f.y + dy, s: pw, r: f.r || 0, of: f.id }
      // ⭐ 프레임 «바로 앞»에 꽂는다(배열에서 프레임보다 앞 = 화면에선 뒤).
    mark()
      setItems((arr) => { const i = arr.findIndex((x) => x.id === f.id); return i < 0 ? [it, ...arr] : [...arr.slice(0, i), it, ...arr.slice(i)] })
      setSel(it.id)
      // ⛔ 토스트는 안 띄운다 — 이 화면엔 토스트 장치가 없고, 버튼 이름이
      //    「이 프레임에 사진 넣기」라 무슨 일이 일어날지 «누르기 전에» 이미 안다.
      return
    }
    // 📷📷 **자르지 않고 «통째로»** 붙인다 (창업자 폰 제보 2026-08-07 *"무지 내사진넣기에서 크롭기능있으면"*)
    //   ⛔ 전엔 `cropSquare` 라 **무조건 정사각**이었다 — 세로로 찍은 사진은 위아래가 잘려 나갔고,
    //      잘린 부분은 **되찾을 길이 없었다**(원본을 안 남긴다).
    //   ⭐ 원본 비율 그대로 붙이면 **아무것도 안 잘린다.** 크기·각도는 손잡이로 맞추면 되고,
    //      정사각으로 쓰고 싶으면 프레임에 끼우면 된다(그건 창 모양대로 자른다).
    //   📌 「크롭 기능」의 반은 이걸로 풀린다 — 사람들이 크롭을 찾는 이유가 대개 **「잘리는 게 싫어서」**다.
    //      ⏳ 「내가 고른 부분만 보이게」(끌어서 맞추기)는 다음 판에.
    //   ⚠️ 긴 변 기준 700px — 세로 사진이 «폭» 700 이면 높이가 1200 을 넘어 무거워진다.
    const ar = await imageRatio(src)
    const small = await cropRatio(src, ar, 700, 0.8)
    const n = items.length
    const it = { id: newDecorId(), type: 'photo', src: small, ratio: ar, x: 0.5, y: 0.44, s: photoScale(ar), r: ((n % 5) - 2) * 3 }
    mark(); setItems((arr) => [...arr, it])
    setSel(it.id)
  }
  const addTape = (key) => {
    const n = items.length
    const it = { id: newDecorId(), type: 'tape', key, x: 0.5, y: 0.28 + (n % 3) * 0.14, s: 0.62, r: ((n % 5) - 2) * 3 }
    mark(); setItems((arr) => [...arr, it])
    setSel(it.id)
  }
  // 🖍 형광펜 — 마스킹테이프와 «같은 문법»이라 붙이는 코드도 같다(비율만 6:1 로 더 길쭉).
  //   ⭐ 기울기를 안 준다(`r: 0`) — 글 위에 겹치려고 붙이는 것이라 삐뚤면 손으로 다시 맞춰야 한다.
  //      마테는 장식이라 기울여 붙이지만 형광펜은 «줄을 따라» 가는 도구다.
  const addHl = (key) => {
    const n = items.length
    const it = { id: newDecorId(), type: 'hl', key, x: 0.5, y: 0.34 + (n % 4) * 0.12, s: 0.56, r: 0 }
    mark(); setItems((arr) => [...arr, it])
    setSel(it.id)
  }
  const addText = (colorKey) => {
    const n = items.length
    const it = { id: newDecorId(), type: 'text', color: colorKey, font: textFont, text: '', x: 0.5, y: 0.5 + ((n % 3) - 1) * 0.08, s: 0.5, r: 0 }
    mark(); setItems((arr) => [...arr, it])
    setSel(it.id)
    setTypingId(it.id) // ⌨️ 「글자 넣기」도 그 자리에서 바로 (전엔 시트가 열렸다)
  }

  // 스티커 셀 한 칸 — 종류별 크기(부엌식구들 세로길쭉 / 음식·데코 사진은 제 비율 / SVG 정사각)
  const renderCell = (key) => {
    const isKf = KITCHEN_IDS.has(key)
    const isPhoto = PHOTO_IDS.has(key)
    const isDeco = key.startsWith('dc_') // 데코 조각(하트·별·리본…)은 위 SVG 색바꾸기 줄과 같은 크기로 작게
    const colorable = RECOLORABLE.has(key)
    // 사진 스티커는 '정사각 박스에 contain' → 넓적·길쭉이 다 같은 크기로 보인다(크기 통일). 음식·라이프는 조금 작게.
    return (
      <button key={key} className="press decor-cell" onClick={() => addSticker(key)} aria-label={colorable ? `${key} · 색 바꾸기 가능` : key} style={{ position: 'relative' }}>
        <span style={{ display: 'block', width: key === 'yum' ? '92%' : isKf ? '62%' : isDeco ? '56%' : key.startsWith('gp_') ? '82%' : isPhoto ? '70%' : '78%', aspectRatio: key === 'yum' ? '74/46' : isKf ? '0.75' : isPhoto ? '1' : '1' }}>
          <StickerArt id={key} />
        </span>
        {/* 🎨 '색 바꿀 수 있음' 표시 — 스티커에 박아 발견성↑. 뮤트 미니 팔레트 점. */}
        {colorable && (
          <span aria-hidden="true" style={{ position: 'absolute', top: 3, right: 3, width: 15, height: 15, borderRadius: '50%', background: 'conic-gradient(from 210deg, #d68f88, #ccaa6d, #94a37e, #93aabd, #b2a3c1, #d68f88)', border: '1.6px solid var(--surface)', boxShadow: '0 1px 2.5px rgba(70,60,45,.35)' }} />
        )}
      </button>
    )
  }
  // 🎁 「선물」 택 — 출시기념으로 준 것에 붙는다. ⛔유니코드 이모지 금지라 글자＋색으로만.
  //    ⚠️ 「한정」이라고 쓰지 않는다 — 빼앗을 계획이 없다(*"한 번 준 것은 빼앗지 않는다"*).
  const GiftTag = () => (
    <span style={{
      marginLeft: 6, padding: '1.5px 7px', borderRadius: 999, fontSize: 11, fontWeight: 800,
      background: 'var(--brown)', color: '#fff', letterSpacing: '-0.01em', verticalAlign: '1px',
    }}>선물</span>
  )
  // 🔒 자물쇠 — ⛔유니코드 이모지 금지라 SVG 로 그린다
  const LockIcon = ({ size = 13 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" style={{ verticalAlign: '-1.5px' }}>
      <path d="M7.5 10.5V7a4.5 4.5 0 019 0v3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="4.6" y="10" width="14.8" height="10.8" rx="3.1" fill="currentColor" />
    </svg>
  )
  // 스티커 그룹 한 덩어리(소제목 + 그리드)
  //
  // 🔒 **잠긴 유료팩은 「팩 전체를 펼쳐」 보여준다** (창업자 2026-08-03
  //    *"결제붙는날 전체를 다 보여줘야지. 이런게 있으니 사라고 배경부터 싹 다"*)
  //    ⚠️ 몇 컷만 맛보기로 보여주지 않는다 — 그러면 «있는 줄»을 모른다.
  //    ⚠️ 흐리게만 하고 **그림은 다 보인다.** 못 쓰게 막는 것이지 감추는 게 아니다.
  const renderStickerGroup = (g) => {
    // 🔒 **잠긴 팩은 서랍에 「한 줄」로만 둔다 — 격자는 안 편다** (창업자 2026-08-05
    //    *"이런 방식말고 따로 안내팝업이나 창을 만들어서 보여주면 안돼?"*)
    //
    //   ⛔ 처음엔 서랍에 62컷을 통째로 폈다. 실물을 찍어 보니 **데코 탭에 192컷**(추석62＋핼러윈64＋가을66)이
    //      쌓여 «무료 스티커를 쓰려면 192칸을 지나 내려가야» 했다. 서랍은 작업하는 자리인데 광고가 그걸 밀었다.
    //   ✅ 그래서 서랍엔 **배너 한 줄**만 두고, 팩 전체는 **따로 열리는 창**에서 보여준다.
    //      *"전체를 다 보여줘야지"* 는 그 창이 지킨다 — 서랍이 아니라 창에서.
    //   ⭐ 배너 모양은 위 「선물」 배너와 같게 맞춘다. 같은 자리·같은 문법이라 배울 게 없다.
    if (g.locked) {
      return (
        <button
          key={g.key} className="press" onClick={() => setBuyPack(g)}
          style={{
            display: 'flex', alignItems: 'center', gap: 9, width: '100%', minHeight: 44, padding: '3px 12px', marginBottom: 3,
            borderRadius: 12, background: 'var(--cream)', border: '1px solid var(--line)', textAlign: 'left',
          }}
        >
          <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 800, background: '#b5714a', color: '#fff', flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <LockIcon size={11} />{g.price.toLocaleString()}원
          </span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
            {g.label} 꾸미기 팩 · {g.items.length}컷
          </span>
          <span aria-hidden style={{ color: 'var(--text-sub)', fontSize: 17, flex: '0 0 auto' }}>›</span>
        </button>
      )
    }
    return (
      <div className="decor-sec" key={g.key}>
        {g.label && <div className="decor-sec-label">{g.label}{g.gift && <GiftTag />}</div>}
        {/* 🔠 `wordy` = **그림 안에 글자(캡션)가 그려진 그룹.** 칸을 크게 준다.
            📮 창업자 2026-08-12 *"좀작네 글자가."* · 앞서 *"글자가 너무 작아서 (그림도) 잘 안보여"*
            🔢 재서 정했다 — 컷 긴변 348px 에 캡션 글자 35px 이라 칸이 W 면 화면 글자 = 35×W÷348:
               52px(지금) **5.2px 못 읽는다** / 80px 8.0 / 92px 9.3 / **110px → 11.1px 읽힌다**
            ⭐⭐ 110px 이 «공짜»인 이유 = 폰 411px 에서 92px 도 110px 도 **똑같이 3칸**이라
               줄 수가 안 늘어난다(둘 다 39줄). 같은 값에 글자만 커진다.
            ⛔ 130px 은 2칸이 되어 줄이 58줄로 늘어난다 — 거기서 끊었다.
            ⛔ 접두어(`rs_`·`tw_`)로 가르지 않는다 — 표시용 이름·키로 분류하면 언젠가 어긋난다
               (v9.07 에 라벨로 분류했다가 자산 도구가 깨졌다). 데이터에 표시를 단다. */}
        <div className={g.wordy ? 'decor-grid wordy' : 'decor-grid'}>{g.items.map(renderCell)}</div>
      </div>
    )
  }

  return (
    <Portal>
      <div className={`decor-editor${bigWrite ? ' bigwrite' : ''}`}>
        {/* 상단 바 */}
        <div className="decor-top">
          <button className="press" onClick={handleCancel} style={{ minHeight: 44, padding: '0 4px', color: 'var(--text-sub)', fontSize: 15, fontWeight: 600 }}>취소</button>
          <div className="decor-title" style={{ fontSize: 16, fontWeight: 800 }}>{title}</div>
          {/* 🔍🔍 **종이 확대** (창업자 2026-08-09 *"일꾸판 확대되야돼. 스티커 붙이고 글쓰기가 너무 불편해."*)
              ⛔ 눕힌 화면은 높이가 322px 뿐이라 종이를 아무리 키워도 그 높이에 갇힌다 —
                 「더 키우기」로는 답이 안 나온다. **키우고 «칸 안에서 밀어 보는»** 게 답이다.
              ⭐ 끌기·손잡이 계산은 전부 `getBoundingClientRect()`(＝화면에 그려진 실제 크기)를 재서 하므로
                 확대해도 스티커가 엉뚱한 데로 가지 않는다. 코드로 확인하고 넣었다.
              ⛔ 세로에선 안 보인다 — 세로는 종이가 이미 화면 폭을 다 쓴다(CSS 가 감춘다). */}
          {/* 🚪 나가는 길은 «단추»가 아니라 «저절로» — 창업자가 두 번 말했다 *"왜 저기떠있는지 모르겠다"*
              → 「다 썼어요」 단추를 없앴다. 자판이 내려가면 위 `useEffect` 가 커서를 내려놓는다. */}
          {/* ⌨️ `onPointerDown` 을 막는다 — ⛔안 막으면 **＋ 를 누르는 순간 글칸이 포커스를 잃는다.**
              🔢 실측(고치기 전) 커서 `TEXTAREA` → ＋ 누르면 `BUTTON` · 종이가 «오히려 작아졌다»
                 (커서가 풀리며 자판용 바닥값이 사라져서). 글씨를 쓰다 확대하는 게 이 단추의 «본래 일»인데
                 누르면 글쓰기가 끝나 버렸다. 글씨체 칩에서 이미 쓰던 문법이다. */}
          <div className="decor-zoom">
            <button className="press" aria-label="종이 작게" disabled={zoom <= ZOOM_MIN}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => 배율(zoom - 0.4)}>－</button>
            <span aria-live="polite">{Math.round(zoom * 100)}%</span>
            <button className="press" aria-label="종이 크게" disabled={zoom >= ZOOM_MAX}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => 배율(zoom + 0.4)}>＋</button>
          </div>
          {/* 💾 **글자가 아니라 «누를 것»으로 보이게** (창업자 2026-08-06
              *"어떻게 꾸미기 탭을 닫아야 글씨를 쓸 수 있는지 모르겠어"*).
              ⛔ 파란 글자 하나는 「제목 옆에 적힌 말」로 읽힌다 — 닫는 길이 안 보였다. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* ↩↩ **되돌리기 = 상단바** (2026-08-07 안 D)
                ⛔⛔ 처음엔 도구 바의 «빈 상태»에만 뒀다가 회귀를 냈다 — 아이템을 고르면 사라져서
                   방금 한 짓을 무를 수가 없었다(`_repro-hl`·`_repro-undo` 가 둘 다 잡았다).
                📌 이 파일에 이미 경고가 있었다: *"골라야만 보이는 자리에 두면 «지운 뒤»엔 못 누른다"*.
                   나는 그 경고를 읽고 **반대 방향으로 같은 실수**를 했다.
                ⭐ 상단바는 **무엇을 고르든·아무것도 안 고르든 늘 같은 자리**다. 여기가 제자리다.
                ⛔ 되돌릴 게 없으면 안 그린다 — 빈 버튼은 죽은 버튼이다. */}
            {past.length > 0 && (
              <button className="press" onClick={undo} aria-label="되돌리기"
                style={{ minWidth: 44, minHeight: 44, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', border: '1px solid var(--line)' }}>
                <Icon name="undo" size={18} color="var(--brown)" />
              </button>
            )}
            <button className="press" onClick={doSave}
              style={{ background: 'var(--brown)', color: '#fff', fontSize: 14, fontWeight: 800, minHeight: 44, padding: '0 18px', borderRadius: 999, border: 'none' }}>저장</button>
          </div>
        </div>
        {restored && (
          <div className="decor-restored" style={{ flex: '0 0 auto', background: '#eef3e8', color: '#4f5a44', fontSize: 12.5, fontWeight: 700, textAlign: 'center', padding: '6px 10px' }}>
            저장 안 하고 나갔던 꾸미기를 이어서 불러왔어요
          </div>
        )}

        {/* 꾸미는 판 — 표지면 정사각, 다이어리면 세로 종이 */}
        {/* 🐛 **종이 «바깥»을 눌러도 편집 표시창이 사라져야 한다** (창업자 폰 제보 2026-08-07
            *"스티커붙이고 편집 표시창 안 없어짐"*)
            ⛔ 전엔 해제를 `DecorLayer`(＝종이 판) «안»에서만 처리해서, 종이 둘레 여백을 누르면
               아무도 안 듣고 X·손잡이가 그대로 떠 있었다. 재현 = 종이 안 0 / 바깥 **1**.
            ⭐ 스티커·손잡이·X·연필은 넷 다 `stopPropagation` 을 하므로 여기까지 안 올라온다
               → 여기서 받은 것은 «빈 데를 누른 것»이 확실하다. */}
        <div className={`decor-stage${writing ? ' writing' : ''}${typing ? ' typing' : ''}${zoom > 1 ? ' zoomed' : ''}`} style={{ '--zoom': zoom }}
          onPointerDown={(e) => { pinchDown(e); setSel(null); setTypingId(null) }}
          onPointerMove={pinchMove} onPointerUp={pinchUp} onPointerCancel={pinchUp}
          // ⌨️ 종이의 글칸에 커서가 가면 「글씨·크기」 줄을 띄운다(어느 탭이든).
          //    `…Capture` 로 받는 이유 = focus/blur 는 «올라오지 않는»(bubble 안 하는) 이벤트다.
          onFocusCapture={(e) => {
            if (e.target.tagName !== 'TEXTAREA') return
            setTyping(true)
            // 👁 **커서가 들어간 칸이 «보이게» 굴려 준다** (창업자 2026-08-09
            //    *"속지 선택하고 바로 글쓰면 젤 위칸에 글쓰는데 안보임(자판은 눌러짐)"*)
            //    🔢 실측(가로 891×411 · 자판) — 첫 글칸 128~211 인데 보이는 칸은 0~160 = **아래 51px 이 잘렸다.**
            //    ⛔ 브라우저가 알아서 해줄 거라 여겼는데 «판이 줄어드는»(resizes-content) 방식이라 안 해준다.
            //    ⚠️ 자판이 올라오며 판이 줄어드는 데 시간이 걸린다 → 다음 프레임 두 번 뒤에 잰다.
            const t = e.target
            setTimeout(() => { try { t.scrollIntoView({ block: 'center', inline: 'nearest' }) } catch { /* 옛 브라우저 */ } }, 350)
          }}
          onBlurCapture={(e) => { if (e.target.tagName === 'TEXTAREA') setTyping(false) }}>
          {(() => {
            const layer = (
              <DecorLayer
                items={items}
                // ✍️ 글쓰기 모드에선 스티커 층이 **손가락을 통과시킨다**(`editable=false` → `pointerEvents:none`).
                //    그래야 아래 글칸이 탭을 받는다. 스티커는 그대로 보이고 못 움직일 뿐이다.
                //
                // 🐛🐛 **「속지」 모드도 통과시켜야 한다** (창업자 폰 제보 2026-08-07)
                //   ⛔ 전엔 `!writing` 이라 «속지» 모드에서 스티커 층이 살아 있었고,
                //      종이를 통째로 덮은 그 층이 **속지에 인쇄된 고르기 칸을 전부 가로챘다.**
                //      → 「오늘의 한끼」의 함께·장소·날씨·기분·시간·만족도가 **하나도 안 눌렸다.**
                //   ⭐ 창업자 제보는 *"트래커에 색5개까지 표시하도록-지금은1개"* 였는데,
                //      재보니 **1개가 칠해지는 게 아니라 «아예 못 고른다»** 였다.
                //      캡처에서 초록으로 보인 점은 **속지 그림에 인쇄된 색**이다.
                //   📌 **만든 날부터 한 번도 안 눌린 기능이다** — 그날 나는 「찍어서 보기」만 하고
                //      «눌러보는» 검사를 안 만들었다(규칙 18 ⓘ — 검사가 무엇을 보는지).
                //   ⭐ 속지 모드에서 스티커를 만질 일은 없다 — 그 모드는 «종이를 고르는» 자리다.
                editable={mode === 'decor'}
                // 🎯 속지·글쓰기 탭에서도 «스티커를 탭하면» 바로 꾸미기로 넘어가며 그걸 고른다
                //    (창업자 2026-08-07 *"일꾸탭을 눌러야 수정 … 아직도 안바뀌었어"*)
                //    ⛔ 빈 자리는 그대로 통과 — 글칸을 누르면 글쓰기, 축을 누르면 축이 눌린다.
                onTapItem={(id) => { setMode('decor'); select(id) }}
                selectedId={sel}
                onSelect={select}
                onChange={patch}
                onRemove={remove}
                // 🤏 두 손가락으로 벌리는 «동안»엔 스티커를 끌지 않는다 — 첫 손가락이 스티커 위에 있으면
                //    확대하려다 스티커가 딸려 움직인다.
                pinching={pinching}
                // ⌨️ 이미 붙은 것을 다시 탭 = «그 자리에서» 이어 쓴다. 글자 스티커만 시트로(상자가 없다).
                onEditNote={(it) => setTypingId(it.id)}
                typingId={typingId}
                onText={(id, t) => patch(id, { text: t })}
                // ⛔⛔ **`onEmptyTap` 을 뺐다** (창업자 폰 제보 2026-08-07
                //    *"스티커 하나 붙이면 바로 글쓰기로 넘어가. 다른거 붙이려면 다시 일꾸 눌러야함."*)
                //   📌 뿌리 = **이 문이 «열려야 할 곳»에선 안 열리고 «닫혀야 할 곳»에서만 열렸다.**
                //      이 층은 `pointerEvents: editable ? 'auto' : 'none'` 이라 **꾸미기 모드에서만** 탭을 받는다.
                //      그래서 「속지 탭에서 글칸을 누르면 글쓰기로」를 하려고 만든 것이 정작 속지 탭에선
                //      한 번도 안 불렸고, **일꾸에서 고른 걸 풀려고 빈 종이를 누를 때마다** 글쓰기로 튀었다.
                //      「없음」 틀은 쓰는 칸이 종이 «거의 전체»라 어디를 눌러도 걸린다 — 창업자가 본 그대로.
                //   ⭐ 꾸미기에서 빈 자리 탭은 **「고른 것 풀기」** 하나만 한다. 탭을 옮기는 건 탭 줄이 한다.
                //   🔬 `_repro-일꾸탭.mjs` 가 이걸 재현하고, 고친 뒤 안 넘어가는 것까지 잰다.
              />
            )
            // 📔 다이어리 — 종이 ＋ 쓴 글이 «화면과 똑같이» 보여야 한다.
            //    `PaperBox` 로 감싸야 글자·줄이 폭 기준(cqw)으로 제자리에 앉는다.
            if (paper) {
              return (
                // 📐 **종이 높이를 42vh 로 묶는다** (창업자 2026-08-06 *"꾸미기눌렀을때 창이너무 작음"*)
                //   ⭐ 다이어리 종이는 3:4 세로라 폭을 꽉 채우면 **화면의 절반을 먹고** 서랍이 한 줄로 눌린다
                //      (표지는 1:1 이라 이 문제가 없었다 — 판 모양이 바뀌었는데 자리는 안 바꿨다).
                //   📏 3:4 이므로 폭을 31.5vh 로 묶으면 높이가 42vh 다. 나머지는 서랍이 가져간다.
                //   ⚠️ 폭이 줄어도 글자·줄은 `cqw` 라 «비율 그대로» 따라 줄어든다.
                //   ✍️ **글쓰기 땐 종이를 키운다** — 서랍이 한 줄로 접히니 그만큼 종이가 가져간다.
                //      42vh 는 손글씨 칸이 너무 작아 「쓰는 판」으로 안 읽힌다.
                // ✍️🐛 **글쓰기 땐 `vh` 를 쓰지 않는다** (창업자 폰 제보 2026-08-07
                //    *"여러개 글쓸때 속지가 넘작음 글자잘안보여..스크롤이라도"*)
                //   ⛔ `vh` 는 «지금 보이는 화면» 기준이라 **키보드가 뜨면 같이 줄어든다.**
                //      실측 = 키보드 전 437px → 후 **224px (51%)**. 손글씨가 반으로 작아진다.
                //   ⭐ 폭 기준으로 잡으면 키보드와 무관하게 **크기가 그대로**고, 세로로 넘치는 만큼은
                //      `.decor-stage.writing` 의 `overflow-y:auto` 가 스크롤을 준다.
                //      (창업자가 말한 *"스크롤이라도"* 가 바로 이것 — 스크롤은 «이미 있었고»
                //       종이가 줄어드느라 **스크롤할 게 없었을 뿐**이다)
                //   ⚠️ 상한 420px 은 큰 화면에서 종이만 커지는 것을 막는다.
                //   ⛔⛔ 이 자리에 `{/* */}` 를 쓰면 **빌드가 죽는다** — `return (` 바로 뒤라
                //      JSX 가 아직 안 열렸고 `{…}` 가 객체 리터럴로 읽힌다(2026-08-04·08-05·08-07 세 번 밟았다).
                // 📐📐 스티커를 고르면 **판이 조금 작아진다** (창업자 폰 제보 2026-08-07
                //    *"꾸미기탭에 다른스티커 보려고했는데 스크롤이 안움직여"*)
                //   ⛔ 실측(360×800) = 판 360 ＋ 컨텍스트 바 166 ＋ 서랍 218 = 화면이 «꽉 찬다».
                //      창업자 폰엔 「이어서 불러왔어요」 띠까지 있어서 서랍 스크롤 칸이 한 줄 반밖에 안 남았다.
                //      그 좁은 띠에선 손가락이 탭 줄·선물 줄에 닿아 **스크롤이 안 되는 것처럼 느껴진다.**
                //   ⭐ 컨텍스트 바가 들어온 만큼 판이 물러난다 — 도구가 나오면 종이가 자리를 내주는 게 자연스럽다.
                //      0.18s 로 미끄러지게 해서 «툭» 튀지 않는다. 고르기를 풀면 판이 도로 커진다.
                //   ⛔⛔ 위 경고를 «읽고도» 여기에 `{/* */}` 를 넣어 빌드를 깼다(2026-08-07 · 네 번째).
                // 📐 2026-08-07 안 D — 꾸미기 때 종이를 31.5vh → 27vh 로 줄인다.
                //   ⛔ 왜 = 손가락 44px 를 지키려니 줄이 두꺼워져(큰칸 35→46 · 서랍탭 31→44 · 도구 80→107)
                //      **서랍 스크롤 칸이 246 → 194px 로 오히려 줄었다.** 그 자리를 종이에서 되찾는다.
                //   ⭐ 종이는 «미리보기»이고 실제로 고르는 일은 서랍에서 한다 — 서랍이 커야 덜 헤맨다.
                //   ⚠️ 이 값은 **창업자 판정 대상**이다(종이 크기 = 미감).
                //   ✅ 고른 순간에 크기가 «안 바뀐다» — 도구 바가 꾸미기 모드면 늘 떠 있기 때문이다.
                //   ⛔⛔ 여기에 `{/* */}` 를 쓰면 빌드가 죽는다 — `return (` 바로 뒤라 JSX 가 아직 안 열렸다.
                //      **바로 위에 이 경고가 적혀 있는데 2026-08-07 에 또 밟았다(여섯 번째).**
                // 🔍 세로에서도 확대가 먹게 «폭에 배율을 곱한다». 배율 1 이면 값이 그대로라 지금과 똑같다.
                //    ⛔ 가로는 이 줄을 안 쓴다 — CSS 가 `width: 100% !important` 로 덮고 `max-width` 에 배율을 건다.
                // 📐 종이 높이 몫을 CSS 변수로 뺀다 — **작은 폰에서만** 조금 줄이려고(styles.css 의 max-height 700 블록).
                //    ⛔ 값을 여기 숫자로 박으면 화면 크기에 따라 못 바꾼다.
                <div style={{ width: writing ? 'calc(min(100%, 420px) * var(--zoom, 1))' : 'calc(min(100%, var(--paper-vh, 31vh)) * var(--zoom, 1))', margin: '0 auto' }}>
                  <PaperBox skin={paper} ratio={ratio} style={{ borderRadius: 18 }}>
                    {/* ⚠️ 사진이 «먼저» — 그래야 스티커를 사진 위에 붙일 수 있다(글자는 zIndex 1)
                        ✍️ 글쓰기 땐 «쓸 수 있는 판»으로 갈아끼운다 — 자리는 똑같고 손이 닿을 뿐이다 */}
                    {/* ✍️✍️ **어느 탭에서든 글이 써진다** (창업자 2026-08-07
                        *"속지든 글쓰기등 일꾸레꾸 어디서든 글씨수정가능하게 만들어줘. **이게가장 중요**"*
                        *"어느 탭이든 글자를 누르면 글자가 수정되고 이미지를 누르면 이미지가 수정되어야 하는데
                          탭을 옮겨다니면서 수정해야하면 **안쓰게돼**"*)
                        ⛔ 전엔 `writing ? paperEdit : paperOverlay` 라 **「글쓰기」 탭에서만** 글칸이 살아 있었다.
                           일꾸·레꾸·속지에선 쓰는 칸이 «아예 없었다»(재현으로 확인 — textarea 0개).
                        📌 v9.89 에 고친 건 «스티커 층»이었고 **종이 자체가 읽기 전용으로 갈리는 건 안 고쳤다.**
                        ⭐ 둘은 «같은 `PaperSheet`»에 `onChange` 만 다른 조각이라 늘 `paperEdit` 를 써도 자리가 안 어긋난다.
                        ⚠️ 대신 글칸이 포인터를 먹는다 → 스티커를 글칸 «위»로 끌 수 있는지 재현으로 확인했다
                           (`_repro-0807-5.mjs` ⓑ — 드래그는 스티커에서 시작해 포인터가 잡히므로 그대로 끌린다). */}
                    {paperEdit || paperOverlay}
                    {layer}
                  </PaperBox>
                </div>
              )
            }
            // 📐 레시피 표지도 스티커를 고르면 조금 물러난다 — 위 「일기」 판과 같은 이유다.
            //   ⛔ 여긴 `width:'100%'` 라 컨텍스트 바가 나와도 안 줄어들어서 **서랍이 통째로 눌렸다**
            //      (창업자 캡처가 바로 이 화면 — 「레시피 꾸미기」다). 실측 = 판 360 ＋ 바 130 ＋ 서랍 254.
            //   ⛔⛔ 이 자리에 `{/* */}` 금지 — `return (` 앞이라 빌드가 죽는다(오늘 네 번째로 밟았다).
            return (
              <div style={{ position: 'relative', width: '100%', aspectRatio: ratio, borderRadius: 18, overflow: 'hidden' }}>
                <Thumb recipe={{ ...recipe, decorBg: bg, thumb }} ratio={ratio} radius={0} emojiSize="4.5rem" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />
                {layer}
              </div>
            )
          })()}
          {/* 🚪 **나가는 길을 여기서 말해 준다** (창업자 2026-08-06 *"어떻게 꾸미기 탭을 닫아야
              글씨를 쓸 수 있는지 모르겠어"*). ⛔ 「골라 붙이고 드래그」만 알려주면 «들어온 뒤»만 안내한 것이다.
              ⭐ 다이어리는 **닫아야 글을 쓴다** — 그 사실을 여기서 한 줄로 말한다. */}
          {/* ⚠️ `keep-all` — 한국어는 낱말 중간에서 끊으면 「저 / 장」처럼 읽힌다(실물 캡처로 잡음) */}
          <div className="t-sub" style={{ fontSize: 12, textAlign: 'center', marginTop: 10, lineHeight: 1.5, wordBreak: 'keep-all' }}>
            {writing
              // 🔄 가로에선 서랍이 «오른쪽»에 선다 — 레꾸 안내문과 같은 방식(CSS 가 낱말 하나만 보여준다)
              ? <>종이에 바로 써요 · 꾸미려면 <span className="only-portrait">아래</span><span className="only-landscape">오른쪽</span> 「일꾸」</>
              : selFrame
                // 🖼 프레임을 고른 순간 «사진을 끼울 수 있다»는 걸 그 자리에서 말한다.
                //    ⛔ 「내 사진 넣기」가 서랍 맨 위에 있어도 프레임이랑 이어질 줄은 아무도 모른다.
                ? '이 프레임에 사진을 끼울 수 있어요 · 서랍 맨 위'
                : hasCtx
                  ? '누른 걸 여기서 바로 꾸며요 · 끌어서 옮기고 · ⟳ 크기/돌리기'
                  : (isDiary && mode === 'paper' && !paperArtHasPhoto)
                    // 📷 틀에 사진칸이 «없는» 속지(없음·도트) — 사진을 못 넣는 게 아니라 «아무 데나» 넣는다.
                    //    창업자 2026-08-06 *"무지에는 사진 넣는거 없어??"* → 있는데 «있는 줄을 몰랐다».
                    ? '이 틀엔 사진칸이 없어요 · 사진은 꾸미기에서 아무 데나'
                    : isDiary
                  ? (shelf === 'diary'
                    // 🔤 「일꾸」는 «우리가 만든 말»이라 처음 보면 갸웃한다 → 그 자리에서 한 줄로 푼다.
                    //    (「레꾸」는 이미 「레꾸자랑」 탭에 있어 유저가 안다 — 그래서 안 푼다.)
                      ? '일꾸 = 일기 꾸미기 · 더 많은 아이템은 「레꾸」에'
                      : '레꾸 = 레시피 꾸미기 · 일기에도 그대로 붙어요')
                    // 🔄 가로에선 서랍이 «오른쪽»에 선다 — 창업자 2026-08-09
                    //    *"레꾸화면 (가로모드)에사 아래에서 골라붙이고도 바꿔야해 돌리면 오른쪽이 되니까."*
                    //    ⭐ JS 상태(matchMedia)를 안 늘린다 — 낱말 둘을 다 그려두고 **CSS 가 하나만 보여준다.**
                    //       리렌더가 없고, 화면을 돌리는 «순간» 바로 맞는 말이 된다.
                    : <><span className="only-portrait">아래</span><span className="only-landscape">오른쪽</span>에서 골라 붙이고 · 끌어서 옮기고 · ⟳ 손잡이로 크기/돌리기</>}
          </div>
        </div>

        {/* 고정 컨텍스트 바 — 선택한 아이템의 색·무늬·모양을 캔버스 바로 아래에서 바로 바꾼다(스크롤 이동 없음) */}
        {/* 🔪🔪🔪 **도구 바 — 화면 «맨 아래» 고정** (창업자 2026-08-07 안 D 확정)
            ⛔ 예전엔 종이와 서랍 «사이»에 있었다. 그게 세 가지를 한꺼번에 망가뜨렸다 —
               ⑴ 서랍을 눌러 스크롤 칸이 53px(손가락보다 얇다) ⑵ 자판이 떠도 80px 로 종이를 계속 누른다
               ⑶ 갈래·칩·서랍탭·큰칸이 전부 비슷한 알약(29·31·35px)이라 층이 안 읽힌다.
            ⭐ 왜 맨 아래인가 — 시안 넷을 재서 골랐다(`scripts/_measure-시안-0807.mjs`):
               · 도구가 먹는 높이 314 → **126px** (서랍이 188px 더 커진다 = 404컷 보기에 제일 좋다)
               · 자주 하는 일 다섯 터치 = 13번 (겹치기 안은 19번 — 다꾸는 «연달아» 붙이는 일이라 치명적)
               · 자판이 뜨면 **자판 바로 위**에 붙는다 = 아이폰 글자 툴바·카톡과 같은 자리.
                 지금은 글씨체 줄이 서랍 «안»에 있어 자판이 뜨면 **18px 틈**에 갇혔다.
            ⭐ **자리가 절대 안 움직인다** — 고른 게 있으면 「그것 꾸미기」, 없으면 「되돌리기」.
               그래서 지금 혼자 한 줄 먹던 되돌리기도 여기로 회수된다. */}
        {/* ⛔ 「고른 게 있을 때만」 띄우면 고를 때마다 화면이 «툭» 튄다 → 꾸미기 모드면 «항상» 띄운다. */}
        {(mode === 'decor' || hasCtx) && (
          <div className="decor-tools" style={{ flex: '0 0 auto', borderTop: '1px solid var(--line)', background: 'var(--cream)', padding: '2px 8px calc(2px + var(--safe-bottom))', display: 'flex', flexDirection: 'column' }}>
            {!hasCtx ? (
              // 🈳 빈 상태 — 자리를 비우지 않는다(비우면 고를 때마다 화면이 «툭» 튄다).
              //   📐 52 → 46 (창업자 2026-08-08 *"아래탭이 너무커서 고르는부분이 안보임"*)
              //      안내 글자라 손가락 최소(44)와 무관하지만, 갈래 아이콘 칸과 «같은 키»라야 안 튄다 → 둘 다 46.
              // 📱 가로에선 이 줄을 낮춘다(CSS) — 창업자 2026-08-09 *"아래 꾸며요 탭이 너무 커서 종이랑 꾸미기를 다 가려."*
              //    ⭐ 이건 «누르는 것»이 아니라 안내 글자라 손가락 최소(44)를 안 지켜도 된다.
              //    ⛔ 세로는 그대로 44 — 갈래 아이콘 칸과 같은 키라야 골랐다 풀 때 화면이 안 튄다.
              <div className="decor-tools-empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, minHeight: 44, color: 'var(--text-sub)', fontSize: 12 }}>
                <Icon name="palette" size={15} color="var(--text-sub)" />
                붙인 걸 누르면 여기서 꾸며요
              </div>
            ) : (<>
            {/* 🔀 갈래 = **아이콘 칸**(46px). 아래 칩은 알약 — 생김새가 달라 층이 갈린다.
                ⭐ 점(●) = 그 갈래에 뭔가 걸려 있다는 표시. 귀퉁이에 둬서 켜도 칸 폭이 안 변한다. */}
            {/* 📐 한 칸 46px × 일곱 = 322 ＋ 칸 344 → **한 줄에 다 들어간다**(밀림 0).
                ⛔ 52px 로 뒀더니 합이 376 이라 **32px 밀려 「효과」가 잘렸다** — 창업자가 지적했던 바로 그 증상이 재발했다.
                ⭐ 46 은 손가락 최소(44)보다 크다. 세로도 52 → **46** (창업자 2026-08-08 *"아래탭이 너무커"* —
                   빈 안내 바와 «같은 키»로 맞춰야 골랐다 풀 때 화면이 안 튄다).
                🛟 그래도 넘치면 잘리는 대신 **두 줄이 되게**(`wrap`) — 새 갈래가 늘어도 안 잘린다. */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0, rowGap: 0 }}>
              {ctxTabs.map((t) => {
                const on = ctxCur === t.k && ctxOpen
                return (
                  // 🔖 `data-ctxtab` = 재현 검사가 갈래를 «이름 아닌 키»로 집게 하는 표식.
                  //    ⛔ 라벨 글자로 찾으면 서랍에도 같은 글자(색·굵기)가 있어 엉뚱한 걸 누른다.
                  <button key={t.k} className="press" aria-pressed={on} aria-expanded={on} data-ctxtab={t.k}
                    aria-label={on ? `${t.label} 접기` : t.label}
                    onClick={() => { if (ctxCur === t.k && ctxOpen) setCtxOpen(false); else { setCtxTab(t.k); setCtxOpen(true) } }}
                    style={{ position: 'relative', flex: '0 0 auto', minWidth: 44, minHeight: 44, borderRadius: 13, display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap', background: on ? 'var(--cream-deep)' : 'transparent', color: on ? 'var(--brown)' : 'var(--text-sub)', border: 'none' }}>
                    <Icon name={t.ic} size={19} color={on ? 'var(--brown)' : 'var(--text-sub)'} />
                    {t.label}
                    {t.lit && <span style={{ position: 'absolute', top: 7, right: 10, width: 5, height: 5, borderRadius: 999, background: 'var(--brown)' }} />}
                  </button>
                )
              })}
            </div>
            {/* 🗜🗜 **접기 — 고른 갈래를 «한 번 더» 누르면 접힌다** (창업자 2026-08-07 *"위 설정이 너무 길다, 접기 필요"*)
                ⛔⛔ 대수술 첫 판에서 이 기능이 **통째로 사라졌다**(`ctxOpen` 이 선언만 남은 죽은 값이었다).
                   창업자가 «직접 요청»해서 v9.97 에 넣은 것인데 자리를 옮기며 같이 날렸다.
                📏 그리고 그 46px 이 **서랍 스크롤 칸에서 빠진 46px 과 같은 값**이었다 —
                   창업자 폰(360×780) 실측 스크롤 칸 v9.97 173 → 대수술 130px.
                ⭐ 별도 단추를 안 만든다 — 갈래가 일곱이라 한 줄이 이미 322/344px 이고,
                   여덟째를 넣으면 **밀려서 「효과」가 잘린다**(오늘 한 번 밟은 그 증상).
                   대신 «고른 것을 다시 누르면 접힘» = v9.97 이 쓰던 바로 그 동작이다. */}
            {ctxOpen && (
            <div style={ctxRow}>
            {/* 🔗 프레임 ↔ 속 사진 — 창 안을 탭하면 프레임이 잡혀서 사진에 손이 안 닿는다(위 `photoOfFrame` 주석) */}
            {ctxCur === 'photo' && (
              <div style={{ display: 'flex', gap: 7, flex: 1 }}>
                {selFramePhoto && (
                  <button className="press" onClick={() => setSel(selFramePhoto.id)} style={layerBtn}>속 사진 고르기</button>
                )}
                {selPhotoFrame && (
                  <button className="press" onClick={() => setSel(selPhotoFrame.id)} style={layerBtn}>프레임 고르기</button>
                )}
              </div>
            )}
            {/* 🧷 순서 — 어떤 아이템이든 맨 뒤/맨 앞으로. 프레임·포스트잇에 스티커가 가려도 다 꺼낼 필요 없이 여기서 정리.
                📐 뒤집기를 «같은 줄»에 둔다 — 둘 다 단추가 한둘뿐이라 줄을 따로 쓰면 서랍이 그만큼 눌린다
                   (2026-08-07 실측: 네 줄이 166px 를 먹어 서랍 스크롤 칸이 한 줄 반밖에 안 남았다). */}
            {ctxCur === 'order' && (
            <div className="decor-ctx-order" style={{ ...ctxScroll, alignItems: 'center' }}>
              <button className="press" onClick={() => sendToBack(sel)} style={layerBtn}>맨 뒤로</button>
              <button className="press" onClick={() => bringToFront(sel)} style={layerBtn}>맨 앞으로</button>
              {selItem && canFlip(selItem) && (
                <button className="press" onClick={() => patchRec(sel, { flip: !selItem.flip })}
                  style={{ ...layerBtn, background: selItem.flip ? 'var(--brown)' : undefined, color: selItem.flip ? '#fff' : undefined }}>
                  좌우 뒤집기
                </button>
              )}
              {/* ↕ **상하 뒤집기** (창업자 2026-08-07 *"이런거 상하좌우반전 넣어줄수있어?"*)
                  ⭐ 이유는 「돌리기가 어려워서」가 «아니다» — 창업자 원문 *"돌리는건 잘돼"*.
                     **돌리면 ✕ 가 같이 돌아** 오른쪽 위로 오고, 스티커를 잡으려다 지워진다.
                     상하 뒤집기가 있으면 **아래 귀퉁이에 놓을 때 돌릴 필요가 없다.**
                  📌 좌우와 «같은 조건»으로 판단한다(`canFlip`) — 거울 글자가 되는 컷엔 둘 다 안 뜬다. */}
              {selItem && canFlip(selItem) && (
                <button className="press" onClick={() => patchRec(sel, { flipY: !selItem.flipY })}
                  style={{ ...layerBtn, background: selItem.flipY ? 'var(--brown)' : undefined, color: selItem.flipY ? '#fff' : undefined }}>
                  상하 뒤집기
                </button>
              )}
            </div>
            )}
            {/* ↔↔ **좌우 뒤집기** (창업자 2026-08-06 *"캐릭터좌우반전돼?"*)
                ⭐ 왜 값어치가 큰가 = **코너 장식이 왼쪽 위 모양 하나뿐**이라 오른쪽엔 못 놨다.
                   뒤집기 하나면 **6컷이 24컷**이 된다 — 자산을 늘리는 가장 싼 방법.
                ⛔⛔ **글자가 «그려진» 스티커엔 안 보인다** — 뒤집으면 거울 글자가 된다.
                   (한끼 문구 16·문구 16·요일 라벨 10 = 42컷. 2026-08-01 에 「추섴」 오타 하나로
                    유료팩 컷을 뺀 적이 있다 — 거울 글자는 그보다 눈에 더 띈다.)
                ⭐ 화살표(ta_)는 오히려 뒤집는 게 쓸모 있어 막지 않는다(→ 가 ← 가 된다).
                ⛔ 「직접 쓴 글자」(type 'text')·포스트잇도 막는다 — 유저가 친 글씨가 거울이 된다.
                📌 판단은 **접두어**로 한다. 라벨로 가르지 않는다(CLAUDE.md 분류 원칙).
                📐 2026-08-07 — 이 단추는 «순서 줄»로 옮겼다(줄 하나를 아끼려고). 위 순서 줄을 볼 것. */}
            {/* 🎬✨ 움직임 ＋ 효과를 «한 줄»에 (창업자 폰 제보 2026-08-07 — 서랍이 눌려 스크롤이 안 됐다)
                ⛔ 줄마다 40px 이라 넷이면 166px 이다. 그만큼 서랍이 밀려 스크롤 칸이 한 줄 반밖에 안 남았다.
                ⛔⛔ **판(종이)을 줄여서 자리를 만들려 했는데 그건 틀린 처방이었다** —
                   탭한 «순간» 종이가 움직여서, 그 자리에서 이어 끄는 드래그가 옛 크기로 계산돼 어긋난다.
                   (`_repro-hl` 이 잡아줬다 — 형광펜을 글자 위로 끌었는데 엉뚱한 데로 갔다)
                ⭐ 그래서 판은 그대로 두고 **줄만 줄인다.** 둘 다 칩 줄이라 한 줄에 이어 붙여도 읽힌다.
                ⭐⭐ 2026-08-07 두 번째 손질 — **한 줄에 이어 붙이니 이번엔 «옆으로» 넘쳤다**(실측 밀림 254px).
                   줄을 아끼려다 칩을 화면 밖으로 밀어낸 셈이라 「효과」 칩은 끝까지 밀어야 보였다.
                   → **갈래 단추 둘로 갈라 한 쪽만 그린다.** 줄 수는 그대로 하나인데 밀림이 사라진다.
                ⭐⭐ 2026-08-07 세 번째 — 그 갈래 문법을 **컨텍스트 바 전체**로 넓혔다(위 갈래 줄).
                   이제 「움직임·효과」도 다른 설정과 «같은 갈래 단추»다. */}
            {(ctxCur === 'motion' || ctxCur === 'fx') && (
              <HStrip style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 5 }}>
                {/* 📜 움직임 15 · 효과 14 — 글씨체 줄과 같은 「넘치는 줄」이라 막대를 항상 보인다 */}
                {(ctxCur === 'motion' ? pickableMotions() : pickableFx()).map((o) => {
                  const on = (ctxCur === 'motion' ? selMotion : selFx) === o.key
                  return (
                    <button key={o.key} className="press" onClick={() => patchRec(sel, ctxCur === 'motion' ? { motion: o.key } : { fx: o.key })}
                      style={{ minHeight: 44, padding: '0 14px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', fontSize: 13, fontWeight: 700, flex: '0 0 auto', whiteSpace: 'nowrap', background: on ? 'var(--brown)' : 'var(--surface)', color: on ? '#fff' : 'var(--text-sub)', border: on ? 'none' : '1px solid var(--line)' }}>{o.label}</button>
                  )
                })}
              </HStrip>
            )}
            {ctxCur === 'color' && selItem.type === 'sticker' && (
              <div style={ctxScroll}>
                  <button className="press" onClick={() => patchRec(sel, { color: null })} aria-label="기본색"
                    style={{ ...ctxDot, border: !selItem.color ? selOn : selOff, fontSize: 10, fontWeight: 800, color: 'var(--text-sub)', background: 'var(--surface)' }}>기본</button>
                  {STICKER_COLORS.map((c) => (
                    <button key={c.key} className="press" onClick={() => patchRec(sel, { color: c.color })} aria-label={`색 ${c.key}`}
                      style={{ ...ctxDot, background: c.color, border: selItem.color === c.color ? selOn : '1.5px solid rgba(0,0,0,.1)', boxShadow: selItem.color === c.color ? '0 0 0 2px var(--surface) inset' : 'none' }} />
                  ))}
              </div>
            )}
            {ctxCur === 'color' && selItem.type === 'hl' && (
              <div style={ctxScroll}>
                {HL_COLORS.map((c) => (
                  <button key={c.key} className="press" onClick={() => patchRec(sel, { key: c.key })} aria-label={`형광펜 ${c.label}`}
                    style={{ ...ctxDot, background: c.color, border: selItem.key === c.key ? selOn : '1.5px solid rgba(0,0,0,.12)', boxShadow: selItem.key === c.key ? '0 0 0 2px var(--cream)' : 'none' }} />
                ))}
              </div>
            )}
            {ctxCur === 'width' && selItem.type === 'hl' && (
              <div style={ctxScroll}>
                {HL_WIDTHS.map((w) => {
                  const on = (selItem.ratio || 6) === w.ratio
                  return (
                    <button key={w.key} className="press" onClick={() => patchRec(sel, { ratio: w.ratio })}
                      style={{ minHeight: 44, padding: '0 16px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', fontSize: 13, fontWeight: 700, flex: '0 0 auto', background: on ? 'var(--brown)' : 'var(--surface)', color: on ? '#fff' : 'var(--text-sub)', border: on ? 'none' : '1px solid var(--line)' }}>{w.label}</button>
                  )
                })}
              </div>
            )}
            {/* 🖍 진하기 — 진짜 형광펜은 «두 번 그으면 진해진다». 그 감각을 그대로. */}
            {ctxCur === 'opacity' && (
              <div style={ctxScroll}>
                {HL_OPACITIES.map((o) => {
                  const on = (selItem.o ?? 0.5) === o.o
                  return (
                    <button key={o.key} className="press" onClick={() => patchRec(sel, { o: o.o })}
                      style={{ minHeight: 44, padding: '0 16px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', fontSize: 13, fontWeight: 700, flex: '0 0 auto', background: on ? 'var(--brown)' : 'var(--surface)', color: on ? '#fff' : 'var(--text-sub)', border: on ? 'none' : '1px solid var(--line)' }}>{o.label}</button>
                  )
                })}
              </div>
            )}
            {ctxCur === 'pattern' && selItem.type === 'tape' && (
              <div style={ctxScroll}>
                {TAPE_PATTERNS.map((t) => (
                  <button key={t.key} className="press" onClick={() => patchRec(sel, { key: t.key })} aria-label={`테이프 ${t.label}`}
                    style={{ width: 46, height: 22, borderRadius: 3, ...t.style, flex: '0 0 auto', border: selItem.key === t.key ? selOn : '1px solid rgba(0,0,0,.08)' }} />
                ))}
              </div>
            )}
            {ctxCur === 'width' && selItem.type === 'tape' && (
              <div style={ctxScroll}>
                {TAPE_WIDTHS.map((w) => {
                  const on = (selItem.ratio || 3.4) === w.ratio
                  return (
                    <button key={w.key} className="press" onClick={() => patchRec(sel, { ratio: w.ratio })}
                      style={{ minHeight: 44, padding: '0 16px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', fontSize: 13, fontWeight: 700, flex: '0 0 auto', background: on ? 'var(--brown)' : 'var(--surface)', color: on ? '#fff' : 'var(--text-sub)', border: on ? 'none' : '1px solid var(--line)' }}>{w.label}</button>
                  )
                })}
              </div>
            )}
            {/* 🎨 **놓은 뒤에도 색을 바꾼다.** 예전엔 색이 '추가할 때'만 있어서
                색을 바꾸려면 **지우고 다시 넣어야** 했다(창업자 2026-07-30
                *"글자 리컬러 안돼…"* · *"이렇게 색깔고르는게 되게 불편하네... 한개씩 눌러서 아니면 지우고.."*). */}
            {/* 🎨🎨 **두 줄로 접는다** (창업자 판정 2026-08-07 — 안 ⓐ)
                ⛔ 전엔 한 줄 가로 스크롤이라 **15색 중 8개만 보이고 7개가 255px 밀려** 있었다(실측).
                   밀 수 있다는 걸 아무도 모르니 「색이 4개뿐」으로 읽힌다 — 내가 실제로 그렇게 잘못 말했다.
                ⛔ 「칩을 작게」 안은 **찍어 보니 12개만 들어갔다**(3개 여전히 밀림) ＋ 비슷한 색끼리 구분이 안 됐다 → 탈락.
                ⭐ 두 줄이면 15개가 8＋7 로 다 보이고, **색을 나란히 견줄 수 있다** — 색 고르기는 원래 그런 일이다.
                📐 대가 = 세로 37px. 색 고르는 줄이라 그만한 값어치가 있다.
                ⭐ 갈래로 바뀌어도 이 줄만 두 줄인 건 그대로 — 이제 «색 갈래를 골랐을 때»만 그만큼 쓴다. */}
            {ctxCur === 'color' && selItem.type === 'text' && (
              <div style={{ ...ctxScroll, flexWrap: 'wrap', overflowX: 'visible', rowGap: 7 }}>
                {TEXT_COLORS.map((c) => (
                  <button key={c.key} className="press" onClick={() => patchRec(sel, { color: c.key })} aria-label={`글자색 ${c.key}`}
                    style={{ ...ctxDot, background: c.color, border: (selItem.color || 'white') === c.key ? selOn : '1.5px solid rgba(0,0,0,.14)', boxShadow: (selItem.color || 'white') === c.key ? '0 0 0 2px var(--cream)' : 'none' }} />
                ))}
              </div>
            )}
            {/* 📏 글자 크기 — 글자 스티커·글 상자가 «같은 표»를 쓴다(TEXT_SIZES).
                ⭐ 글 상자는 `tz` 가 **글자에만** 곱해져 그림 크기는 안 변한다 —
                   창업자 *"스티커를 줄이면 글자가 너무 작아져"* 가 바로 그 구조였다. */}
            {ctxCur === 'size' && (selItem.type === 'text' || selItem.type === 'note') && (
              <div style={ctxScroll}>
                {TEXT_SIZES.map((z) => (
                  <button key={z.key} className="press" onClick={() => patchRec(sel, { tz: z.key })}
                    style={{ minHeight: 44, padding: '0 16px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', fontSize: 13, fontWeight: 700, flex: '0 0 auto', background: (selItem.tz || 'md') === z.key ? 'var(--brown)' : 'var(--surface)', color: (selItem.tz || 'md') === z.key ? '#fff' : 'var(--text-sub)', border: 'none' }}>
                    {z.label}
                  </button>
                ))}
              </div>
            )}
            {ctxCur === 'width' && selItem.type === 'text' && (
              <div style={ctxScroll}>
                {TEXT_WEIGHTS.map((w) => (
                  <button key={w.key} className="press" onClick={() => patchRec(sel, { w: w.key })}
                    style={{ minHeight: 44, padding: '0 16px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', fontSize: 13, fontWeight: 700, flex: '0 0 auto', background: (selItem.w || 'mid') === w.key ? 'var(--brown)' : 'var(--surface)', color: (selItem.w || 'mid') === w.key ? '#fff' : 'var(--text-sub)', border: 'none' }}>
                    {w.label}
                  </button>
                ))}
              </div>
            )}
            {/* ✍️ 글씨체 — 「직접 쓴 글자」와 포스트잇·글 상자가 «같은 목록»을 쓴다.
                ⚠️ 기본값만 다르다: 글자는 없으면 첫 글씨체, 포스트잇은 귀염체(`gaegu`). */}
            {ctxCur === 'font' && (
              // 📜 글씨체 12개 = 넘치는 줄 — 막대를 항상 보인다(글쓰기 탭 글씨 줄과 같은 이유)
              <HStrip style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 5 }}>
                {TEXT_FONTS.map((f) => {
                  const now = selItem.type === 'note' ? (selItem.font || 'gaegu') : selItem.font
                  return (
                    <button key={f.key} className="press" onClick={() => patchRec(sel, { font: f.key })}
                      style={{ minHeight: 44, padding: '0 14px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', fontSize: 14, fontWeight: 700, flex: '0 0 auto', fontFamily: chipFamily(f), background: now === f.key ? 'var(--brown)' : 'var(--surface)', color: now === f.key ? '#fff' : 'var(--text-sub)' }}>{f.label}</button>
                  )
                })}
              </HStrip>
            )}
            {/* 🎨🎨 **붙인 뒤에도 색을 바꾼다** (2026-08-07 에 찾은 구멍)
                ⛔ 여태 포스트잇은 «서랍에서 색을 골라 붙이는 것»뿐이라, 색을 바꾸려면 **지우고 다시 붙여야** 했다.
                   창업자 원문이 이미 2026-07-30 에 *"이렇게 색깔고르는게 되게 불편하네... 한개씩 눌러서 아니면 지우고.."*
                   였는데 **그때 고친 건 「직접 쓴 글자」뿐이었다.** 포스트잇은 그대로 남아 있었다.
                📌 이게 창업자 *"포스트잇은 색상이 넘 별로"* 의 절반이다 — 별로인데 «바꿀 수도» 없었다.
                ⛔⛔ **글 상자(`art`)엔 색·무늬·모양 갈래가 아예 «안 생긴다»** — 위 `selPlainNote` 를 볼 것.
                   `DecorLayer` 424줄이 `it.art` 면 `ArtBox` 로 통째로 빠져서 **눌러도 아무 일이 안 났다.**
                   창업자 폰 제보 2026-08-07 *"소프트잇아니고 스티커에도 포스트잇(줄눈,그런선택지가 나와)"* 가 이것. */}
            {ctxCur === 'color' && selPlainNote && (
              <div style={ctxScroll}>
                {NOTE_COLORS.map((c) => (
                  <button key={c.key} className="press" onClick={() => patchRec(sel, { key: c.key })} aria-label={`포스트잇색 ${c.key}`}
                    style={{ ...ctxDot, background: c.bg, border: selItem.key === c.key ? selOn : '1.5px solid rgba(0,0,0,.12)', boxShadow: selItem.key === c.key ? '0 0 0 2px var(--surface) inset' : 'none' }} />
                ))}
              </div>
            )}
            {/* 🎨 그림 글 상자(메모지·라벨)의 색 = **글자색** — 배경이 우리 그림이라 바꿀 게 글자뿐이다.
                (창업자 2026-08-08 *"아래탭에 글자색고르기없음"* · `ArtBox` 는 `tc` 를 이미 그릴 줄 안다)
                직접 쓴 글자와 같은 15색 · 두 줄 접기(2026-08-07 창업자 판정 ⓐ)도 그대로. */}
            {ctxCur === 'color' && selItem.type === 'note' && !!selItem.art && (
              <div style={{ ...ctxScroll, flexWrap: 'wrap', overflowX: 'visible', rowGap: 7 }}>
                <button className="press" onClick={() => patchRec(sel, { tc: null })} aria-label="글자색 기본"
                  style={{ ...ctxDot, border: !selItem.tc ? selOn : selOff, fontSize: 10, fontWeight: 800, color: 'var(--text-sub)', background: 'var(--surface)' }}>기본</button>
                {TEXT_COLORS.map((c) => (
                  <button key={c.key} className="press" onClick={() => patchRec(sel, { tc: c.color })} aria-label={`글자색 ${c.key}`}
                    style={{ ...ctxDot, background: c.color, border: selItem.tc === c.color ? selOn : '1.5px solid rgba(0,0,0,.14)', boxShadow: selItem.tc === c.color ? '0 0 0 2px var(--cream)' : 'none' }} />
                ))}
              </div>
            )}
            {ctxCur === 'pattern' && selItem.type === 'note' && (
              <div style={ctxScroll}>
                {NOTE_PATTERNS.map((p) => (
                  <button key={p.key} className="press" onClick={() => patchRec(sel, { pattern: p.key })}
                    style={{ ...ctxChip, border: (selItem.pattern || 'plain') === p.key ? selOn : selOff }}>
                    <MiniNote color={selNoteColor} pattern={p.key} shape="round" size={22} />
                  </button>
                ))}
              </div>
            )}
            {ctxCur === 'shape' && (
              <div style={ctxScroll}>
                {NOTE_SHAPES.map((s) => (
                  <button key={s.key} className="press" onClick={() => patchRec(sel, { shape: s.key })}
                    style={{ ...ctxChip, border: (selItem.shape || 'fold') === s.key ? selOn : selOff }}>
                    <MiniNote color={selNoteColor} pattern="plain" shape={s.key} size={22} />
                  </button>
                ))}
              </div>
            )}
            </div>
            )}
            </>)}
          </div>
        )}

        {/* 서랍 — 새로 붙이기 전용(배경·스티커·테이프·글자·포스트잇). 선택 아이템 편집은 위 컨텍스트 바에서. */}
        <div className={`decor-drawer${writing ? ' writing' : ''}`}>
          <div className="decor-grab" />
          {/* 🧭 큰 칸들 — 「속지 고르기 · 글쓰기 · 꾸미기」 (창업자 2026-08-06)
              ⭐ 앱에 이미 있는 `.segment` 를 쓴다 — 「모아보기 / 요리 기록」과 같은 문법이라 배울 게 없다.
              ✍️ 「글쓰기」는 **한 장을 만드는 세 단계 그대로**다 — 종이를 깔고 · 쓰고 · 꾸민다.
                 ⛔ 예전엔 셋째 단계가 「저장하고 나가기」였다. 그게 창업자가 말한 불편이다. */}
          {(canPickPaper || paperEdit) && (
            <div className="segment" style={{ margin: '0 2px 6px' }}>
              {canPickPaper && <button className={`seg ${mode === 'paper' ? 'on' : ''}`} onClick={() => { dropCaret(); setMode('paper') }}>{isDiary ? '속지' : '속지 고르기'}</button>}
              {paperEdit && <button className={`seg ${writing ? 'on' : ''}`} onClick={() => setMode('write')}>글쓰기</button>}
              {isDiary ? (
                <>
                  <button className={`seg ${mode === 'decor' && shelf === 'diary' ? 'on' : ''}`}
                    onClick={() => { dropCaret(); setMode('decor'); setShelf('diary') }}>일꾸</button>
                  <button className={`seg ${mode === 'decor' && shelf === 'all' ? 'on' : ''}`}
                    onClick={() => { dropCaret(); setMode('decor'); setShelf('all') }}>레꾸</button>
                </>
              ) : (
                <button className={`seg ${mode === 'decor' ? 'on' : ''}`} onClick={() => { dropCaret(); setMode('decor') }}>꾸미기</button>
              )}
            </div>
          )}
          {/* ✍️✍️ **본문 글씨체** — 「글쓰기」 탭에만, 한 줄로 (창업자 2026-08-07
              *"글쓰기할때 글자선택하는게 있었음 좋겠어. 글자가일꾸에 있어서 불편"*
               → *"내 말은 «글쓰기 글자체»도 추가했으면 좋겠다는 뜻이었는데 스티커 글자체만 추가 되었단 뜻."*)
              ⛔ 오늘 넣은 글씨체 열둘이 **글자 «스티커»에만** 붙어 있었다. 종이에 바로 쓰는 본문은
                 귀염체 고정이라, 일기의 주인공인 글이 정작 못 고르는 상태였다.
              ⭐ 「글자」 탭(일꾸 안)까지 가지 않아도 된다 — 글 쓰는 자리에서 바로 고른다.
              ⚠️ **한 줄만** 둔다 — 서랍이 접혀야(`.decor-drawer.writing` 26vh) 종이가 커진다.
                 그 자리를 도로 먹으면 「글 쓰는데 서랍이 반을 먹는」 옛 문제로 돌아간다.
              ⚠️ 이름표는 «칩 글꼴»로 그린다 — 안 그러면 이 줄 하나에 4.45MB 를 부른다. */}
          {showWriteTools && onWriteFont && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 2px 8px', flex: '0 0 auto' }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-sub)', flex: '0 0 auto' }}>글씨</span>
              {/* 📐 스크롤 막대가 «칩 바로 밑»에 붙어 글씨를 그어놓은 것처럼 보였다
                  (창업자 2026-08-07 *"글씨 바로아래 스크롤이 붙어있어서.. 세로를 살짝 키우고 스크롤 위치를 내려야 할 듯"*)
                  → 스크롤 칸 아래에 여백을 줘 막대를 칩에서 떼어놓는다. */}
              {/* 📜 HStrip = 막대를 «항상» 보인다 (창업자 2026-08-08
                  *"스크롤바가 처음부터 안보여서 글자체 저게다처럼보임"* — 안드로이드 기본 막대는
                  긁는 동안만 나타나서, 처음 보는 사람은 12개 중 5개가 전부인 줄 안다). */}
              <HStrip style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 5 }}>
                {TEXT_FONTS.map((f) => {
                  const on = (writeFont || 'gaegu') === f.key
                  return (
                    // 📐 칩을 조금 높인다 (창업자 2026-08-07
                    //    *"무지속지에서 글자체 선택시 좀만 그 부분 키워줘(너무 지금은 낮아…)"*)
                    //    ⭐ 손가락이 닿는 칸이자 **글씨체를 «미리 보는» 칸**이라 낮으면 글자가 눌려 보인다.
                    //    ⛔ 줄 «개수»는 안 늘린다 — 서랍이 그만큼 눌린다(2026-08-07 스크롤 사고).
                    <button key={f.key} className="press" onClick={() => onWriteFont(f.key)}
                      onPointerDown={(e) => e.preventDefault()}
                      style={{ flex: '0 0 auto', padding: '9px 14px', borderRadius: 999, fontSize: 15, fontWeight: 700,
                        fontFamily: chipFamily(f), background: on ? 'var(--brown)' : 'var(--cream)', color: on ? '#fff' : 'var(--text-sub)', border: 'none' }}>
                      {f.label}
                    </button>
                  )
                })}
              </HStrip>
            </div>
          )}
          {/* 📏📏 **글자 크기 — 작게 · 보통 · 크게** (창업자 2026-08-07
              *"글씨크기를 다 비슷하게 조정해서 보통으로 두고 작게 보통 크게로 올려줄수는 없어?"*)
              ⭐ **「보통」에서 열둘이 비슷해 보인다** — 글씨체마다 «잉크 높이»를 재서 보정했다
                 (`Stickers.jsx` 의 `TEXT_FONTS` → `sz` · 또박체 0.975 ~ 납작체 0.650 으로 1.5배 차이였다).
              ⛔ 줄 간격은 «안» 건드린다 — 사진일기 그림에 인쇄된 줄과 맞춘 값이라 흔들면 어긋난다.
                 그래서 「크게」도 줄 높이의 0.90 까지. 커진 게 보이면서 줄을 안 넘는다. */}
          {showWriteTools && onWriteSize && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 2px 8px', flex: '0 0 auto' }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-sub)', flex: '0 0 auto' }}>크기</span>
              {WRITE_SIZES.map((z) => {
                const on = (writeSize || 'md') === z.key
                return (
                  <button key={z.key} className="press" onClick={() => onWriteSize(z.key)}
                    onPointerDown={(e) => e.preventDefault()}
                    style={{ flex: '0 0 auto', padding: '8px 15px', borderRadius: 999, fontSize: 12.5, fontWeight: 700,
                      background: on ? 'var(--brown)' : 'var(--cream)', color: on ? '#fff' : 'var(--text-sub)', border: 'none' }}>
                    {z.label}
                  </button>
                )
              })}
            </div>
          )}
          {/* ↩↩ **되돌리기** — 되돌릴 게 «있을 때만» 보인다(빈 버튼은 죽은 버튼이다).
              ⭐ 서랍 맨 위, 큰 칸 바로 밑 = 어느 탭에 있든 손이 닿는 자리.
              ⛔ 아이템을 골라야만 보이는 컨텍스트 바에 두면 «지운 뒤»엔 못 누른다
                 (지우면 선택이 풀리니까). 지운 걸 되살리는 게 이 버튼의 제일 큰 쓸모다. */}
          {/* 📌 2026-08-07 — 되돌리기는 **맨 아래 도구 바**로 옮겼다(안 D).
              ⭐ 여기 있을 땐 «혼자 한 줄»을 먹었고, 그 줄이 서랍 스크롤 칸을 그만큼 눌렀다.
              ⭐ 도구 바는 고른 게 없을 때 비어 있으므로 그 자리를 되돌리기가 채운다 — 줄 하나를 회수한 셈. */}
          {/* 카테고리 칩 — 가로로 골라 그 카테고리만(세로 스크롤 최소화) */}
          {mode === 'decor' && (
          <div className="decor-cats" style={{ display: 'flex', gap: 7, overflowX: 'auto', padding: '2px 2px 10px', flex: '0 0 auto' }}>
            {visCats.map((c) => {
              const on = cat === c.key
              return (
                <button key={c.key} className="press" onClick={() => setCat(c.key)}
                  style={{ flex: '0 0 auto', padding: '7px 13px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', background: on ? 'var(--brown)' : 'var(--cream)', color: on ? '#fff' : 'var(--text-sub)' }}>
                  {c.label}
                </button>
              )
            })}
          </div>
          )}
          <VHint boxRef={drawerRef} />
          {/* ⌨️⌨️⌨️ **서랍을 누르는 «동안»엔 종이 커서를 뺏지 않는다** (창업자 폰 제보 2026-08-12 · 실측으로 확정)
              ⛔⛔ 안 막으면 이런 일이 난다 — 손가락을 대는 «순간» 본문 커서가 풀리고,
                 그 바람에 본문용 「글씨」·「크기」 두 줄(실측 **97px**)이 사라지면서
                 **서랍 내용이 통째로 97px 위로 올라간다.** 손을 뗄 때 그 자리엔 딴 칸이 있다.
              🔢 실측 = 글 상자 칸 y **1049 → 952**. 그 칸이 받은 이벤트는 「본문 커서 풀림」 하나뿐 —
                 **pointerdown·click 이 한 번도 안 왔다.** 그래서 첫 탭이 통째로 사라진다.
                 (창업자가 겪은 「눌러도 안 붙는다」·「두 번 눌러야 된다」·「글씨 크게가 없다」가 전부 이것)
              ⭐ 고치는 법 = 바로 위 글씨체 «칩»이 이미 쓰던 그 방법이다(`onPointerDown` 기본동작 막기).
                 칩 한 줄에만 걸려 있던 것을 **서랍 전체**로 넓힌다.
              ⚠️ 단추일 때만 막는다 — 빈 자리는 그대로 둬야 손가락으로 굴릴 수 있다.
                 (`preventDefault` 는 굴리기를 안 막는다 — 그건 `touch-action` 이 정한다. 칩 줄에서 이미 확인된 방식)
              ⚠️ 붙인 «뒤»엔 `addBox`·`addNote` 가 커서를 내려놓는다 — 그때 줄이 사라져도 이미 붙은 뒤라 괜찮다. */}
          <div className="decor-scroll" ref={drawerRef}
            onPointerDown={(e) => { if (e.target.closest && e.target.closest('button')) e.preventDefault() }}>
            {/* ✍️ 글쓰기 — 서랍엔 **아무것도 안 둔다.** 칸이 비어야 서랍이 접히고 종이가 커진다.
                ⛔ 여기에 뭘 넣으면 「글 쓰는데 서랍이 반을 먹는」 지금 문제가 그대로 남는다.
                ⛔ 안내도 여기 두지 않는다 — 종이 밑에 이미 한 줄 있어서 **같은 말이 두 번** 나온다. */}
            {/* 📔 속지 쪽 — 이 안엔 종이 얘기만 둔다(사진·선물·스티커는 「꾸미기」 쪽) */}
            {mode === 'paper' && canPickPaper && PAPER_AXES.map((ax) => (
              <div className="decor-sec" key={ax.key}>
                <div className="decor-sec-label">{ax.label}</div>
                {/* ⚠️ 줄이 «인쇄된» 틀에선 선을 골라도 화면이 안 바뀐다 — 그냥 두면 고장으로 읽힌다.
                    ⛔ 칸을 숨기지는 않는다. 틀을 「없음」으로 바꾸면 바로 살아나는 값이라 감추면 못 찾는다. */}
                {ax.key === 'rule' && paperStyle(paperPick).ruleWhere === 'none' && (
                  <div style={{ fontSize: 11.5, color: 'var(--text-sub)', margin: '-2px 0 8px', lineHeight: 1.5 }}>
                    지금 고른 틀엔 줄이 이미 그려져 있어요 · 틀을 바꾸면 여기서 고른 선이 보여요
                  </div>
                )}
                {/* 📐 **개수가 늘어도 안 깨지게 «자동 배치»** — 폭을 60px 로 박았더니
                    종이색이 넷에서 다섯이 되자마자 다섯째가 다음 줄로 밀렸다(창업자 세이지 추가 2026-08-06).
                    ⭐ `auto-fill` 은 폭에 맞춰 칸 수를 정하고 남는 폭을 나눠 갖는다 —
                       다섯이면 한 줄, 더 늘면 알아서 두 줄. 다시 손댈 일이 없다. */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(54px, 1fr))', gap: 8 }}>
                  {ax.list.map((o) => {
                    // ⭐ 틀이 「이 선과 짝」이라고 말하면(`pickRule`) 선도 같이 바꿔 준다 —
                    //    도트 틀을 골랐는데 줄이 그어져 있으면 «내가 고른 그 종이»가 아니다.
                    const next = { ...paperPick, [ax.key]: o.key, ...(ax.key === 'art' && o.pickRule ? { rule: o.pickRule } : {}) }
                    const on = paperPick[ax.key] === o.key
                    // ⭐⭐ 미리보기는 **그 층만** 보여준다 — 틀 그림을 얹으면 그림이 선·종이색을 덮어
                    //    무지·줄·모눈·도트 넷이 «똑같아 보인다»(실물 캡처로 잡음 2026-08-06).
                    //    「틀」 절만 그림 그대로 — 거기선 그림 자체가 고르는 대상이다.
                    const mini = paperStyle(ax.key === 'art' ? next : { ...next, art: 'none' })
                    return (
                      <button key={o.key} className="press" onClick={() => onPaperPick(next)} aria-label={`속지 ${o.label}`}
                        style={{ border: 'none', background: 'none', padding: 0, width: '100%' }}>
                        {/* 📏 줄 간격 — CSS 기본값(28px)은 작은 스와치에 두 줄만 그어져 「줄노트」로 안 읽힌다 */}
                        <div className={mini.className}
                          style={{ width: '100%', aspectRatio: '3/4', borderRadius: 8, '--rule-gap': '8px', boxShadow: on ? '0 0 0 2.5px var(--brown)' : '0 1px 4px rgba(70,60,45,.18)', ...(mini.style || {}) }} />
                        <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 4, textAlign: 'center', color: on ? 'var(--brown)' : 'var(--text-sub)' }}>{o.label}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            {/* 🎨 꾸미기 쪽 — 사진·선물·최근·스티커. 속지 쪽엔 이게 하나도 안 보인다
                (종이 고르는 자리에 스티커 광고가 있으면 그게 곧 두 일이 섞인 것이다) */}
            {mode === 'decor' && (<>
            {/* 🎁🎁 **출시 기념 선물 — 상시 한 줄** (창업자 2026-08-03 *"꾸미기 상단에 넣기"*)
                ⛔ 전엔 안내가 **서랍 첫 방문에 딱 한 번 뜨는 시트**뿐이었다. 닫으면 끝이라
                   *"배경이랑 캐릭터, 프레임외에 뭐 더 주는지 모름"* 이 됐다 — 맞는 지적이다.
                ⭐ **몰라서 못 쓰는 선물은 안 준 것과 같다.** 그래서 늘 보이는 자리에 둔다.
                ⚠️ 탭을 바꿔도 계속 보인다 — 선물이 **네 탭에 흩어져 있어서**(프레임·친구들·배경·모션)
                   한 탭에만 두면 나머지 셋을 또 못 찾는다. */}
            {/* 📐📐 **순서 = 창업자 확정 2026-08-07** — *"선물(출시기념~)을 제일 위에 →
                그아래 표지그림 (표지그림지우기, 사진 스티커로 붙이기) 이렇게 배치해줘"*
                ⛔ 전엔 「사진 → 선물」이었고 **「표지 그림 지우기」는 배경 탭 «안»에 따로** 있었다
                   → 표지를 손보려면 탭을 옮겨야 했다(오늘 내내 잡은 「탭 왕복」과 같은 문제).
                ⭐ 표지를 다루는 둘을 **한 묶음**으로 모은다 — 지우고 나서 사진을 붙이는 게 한 흐름이다. */}
            {/* 📐📐 **선물 ＋ 사진을 «한 줄»에** (창업자 2026-08-07 *"표지그림이랑 선물을 좀 줄여도 될 듯(높이)"*)
                ⛔ 실물을 찍어 보니 «데코 탭인데 스티커가 한 장도 안 보였다» — 이 둘이 서랍 맨 위 200px 를 먹고
                   스티커를 도구 바 아래로 밀어냈다.
                ⛔ 44px 아래로는 못 내린다(손가락 최소) → **세로로 쌓지 말고 «가로로 나란히»** 둔다.
                📏 세로 쌓기 44＋6＋라벨 20＋44 = 114px → 가로 한 줄 **44px** = **70px 회수.**
                ⭐ 글자도 짧게 — 「출시 기념으로 네 가지를 넣어뒀어요」는 배너 하나를 통째로 먹던 말이다.
                   누르면 창이 열려 거기서 다 설명한다. */}
            {/* 📱 가로에선 이 줄을 낮춘다(CSS 「decor-quick」) — 창업자 2026-08-09 *"꾸미기가 배경한줄만 보이네.."*
                짧은 화면(322px)에선 이 두 줄이 굴릴 칸의 절반을 먹는다. 세로는 그대로 38. */}
            <div className="decor-quick" style={{ display: 'flex', gap: 7, marginBottom: 8 }}>
              {/* 📐 선물은 «제 몸만큼만» — 74px 이면 되는데 반을 가져가서 320px 폰에서 옆 칸 글자가 11px 잘렸다(실측).
                     사진 쪽이 글이 길다(114px) → 남는 자리를 사진이 다 갖는다. */}
              {/* 📏 높이 38 — 창업자 2026-08-09 *"선물 네가지랑 사진스티커로 꾸미기 높이를 배경음식아이콘되돌리기랑 같게하자"*
                     → *"줄이라는거야. 선물네가지버튼이 더 커서"*
                  ✅ **실측이 창업자 말과 맞았다** = 선물 44 · 사진 44 · **배경 음식 아이콘 38**.
                  ⚠️ 바로 위 주석에 *"44px 아래로는 못 내린다(손가락 최소)"* 라고 적어뒀는데,
                     **「배경 음식 아이콘」 버튼이 이미 38 로 돌고 있었다** — 그 기준은 이미 안 지켜지고 있었다.
                     세 버튼이 한 묶음으로 읽히려면 «같은 키»라야 한다(창업자 판정 · 규칙 11). */}
              <button className="press" onClick={() => setGift(true)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flex: '0 0 auto', minWidth: 0, minHeight: 38, padding: '0 10px',
                  borderRadius: 12, background: 'var(--cream)', border: '1px solid var(--line)' }}>
                <Icon name="gift" size={17} color="var(--brown)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>선물 네 가지</span>
              </button>
              <button className="press" onClick={() => photoRef.current?.click()}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flex: 1, minWidth: 0, minHeight: 38, padding: '0 8px',
                  borderRadius: 12, background: 'var(--cream)', border: '1px solid var(--line)' }}>
                <Icon name="photo" size={17} color="var(--brown)" />
                {/* 🔤🔤 **두 길은 «이름으로» 갈라야 한다** — v9.88 에서 창업자 제보로 고친 것이다
                    (「이 프레임에 사진 넣기」 ↔ 「사진 스티커로 붙이기」).
                    ⛔ 한 줄로 합치며 내가 「프레임에 사진」·「사진 붙이기」로 줄였는데, 그때 **「스티커로」가 빠졌다**
                       = 「끼우는 것」과 「자유로 붙이는 것」의 구분이 사라졌다(전수검사에서 잡음).
                    📏 그림(사진 아이콘)이 「사진」을 이미 말한다 → 글자는 «다른 점»만 남긴다.
                       ⭐ 글자를 한 호수(13→12) 줄여 **창업자가 승인한 이름 그대로** 넣는다 — 서랍 라벨이 이미 12px 다.
                    ⛔ 「사진」을 빼서 줄이면 «무엇을» 붙이는지가 그림에만 남는다(전수검사 두 번째 판에서 걸렀다). */}
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.02em' }}>{selFrame ? '프레임에 사진 넣기' : '사진 스티커로 붙이기'}</span>
              </button>
            </div>
            {/* 🖼 배경 음식 아이콘 — 레시피 표지에만 있다(일기는 종이가 곧 판이다).
                ⭐ 라벨 「표지 그림」을 없앴다 — 버튼 글자가 이미 무엇인지 말한다(줄 하나 회수).
                ⛔ `!isDiary` 를 **바깥**에 둔다 — 안에만 두면 일기에선 «빈 `.decor-sec` 9px»가 남는다.
                   서랍 스크롤 칸을 1px 이라도 되찾는 게 오늘 대수술의 이유다. */}
            {!isDiary && (
              <div className="decor-sec">
                <button className="press decor-quick-btn" onClick={() => setThumb(thumb === 'none' ? origThumb : 'none')}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '10px 13px', marginBottom: 8, borderRadius: 12, background: thumb === 'none' ? 'var(--brown)' : 'var(--cream)', color: thumb === 'none' ? '#fff' : 'var(--text)', border: thumb === 'none' ? 'none' : '1px solid var(--line)', fontWeight: 700, fontSize: 13, textAlign: 'left' }}>
                  {/* 🏷 아이콘 = 창업자 2026-08-07 *"배경음식아이콘지우기앞에도 이모지?아이콘 같은거 넣으면 좋겠어
                      (사진스티커로 붙이기 앞에 있는 이모지처럼)"* — 옆줄과 짝이 맞아야 한 묶음으로 읽힌다.
                      ⭐ 상태에 따라 그림이 바뀐다 — 지울 땐 ✕, 되돌릴 땐 ↻. **누르기 전에 무슨 일이 날지 보인다.**
                      ⛔ 유니코드 이모지는 안 쓴다(우리 아이콘만 · CLAUDE.md 핀). */}
                  <Icon name={thumb === 'none' ? 'refresh' : 'x'} size={17} color={thumb === 'none' ? '#fff' : 'var(--brown)'} />
                  {/* 🏷 이름 = 창업자 확정 2026-08-07 *"배경음식아이콘지우기로 변경하자. 단어통일하는게 낫겠저"*
                      ⭐ 처음엔 「표지 그림 지우기」였는데, 우리가 부르는 이름이 화면마다 달랐다.
                         유저가 보는 그림은 «표지 배경에 깔린 음식 아이콘»이니 그대로 부른다. */}
                  {thumb === 'none' ? '배경 음식 아이콘 되돌리기' : '배경 음식 아이콘 지우기'}
                </button>
                {/* 📌 「사진 붙이기」는 위 «한 줄»로 옮겼다 — 여기 두면 같은 버튼이 두 번 나온다. */}
              </div>
            )}
            <input ref={photoRef} type="file" accept="image/*" onChange={onPhotoFile} style={{ display: 'none' }} />
            {/* 🕗🕗 최근 쓴 것 — **그 탭에서** 최근에 붙인 것 여덟.
                ⭐ 서랍이 400컷을 넘었다. 늘 쓰는 예닐곱 개를 매번 찾아 내려가는 게 일이 됐다
                   (`docs/서랍-감당되나-2026-08-01.md` 추천 ① · 음식 아이콘에서 이미 통한 처방).
                ⛔ 탭을 섞지 않는다 — 마테 탭인데 캐릭터가 끼면 탭 뜻이 흐려진다.
                ⛔ 「글자」 탭엔 안 붙인다 — 거긴 맨 위가 「직접 쓰기」로 창업자가 정한 자리다(2026-07-30).
                ⭐ 자물쇠(광고)보다 위다 — *"서랍은 작업하는 자리인데 광고가 그걸 밀었다"*(2026-08-05). */}
            {RECENT_TABS.has(cat) && (() => {
              const vis = new Set(groupsByTab(cat).flatMap((g) => (g.locked ? [] : g.items)))
              const list = recent.filter((k) => vis.has(k)).slice(0, 8)
              // 한두 개뿐이면 줄만 차지한다 — 「최근」이 뜻을 가지려면 여러 개가 쌓여야 한다
              if (list.length < 3) return null
              return (
                <div className="decor-sec">
                  <div className="decor-sec-label">최근 쓴 것</div>
                  <div className="decor-grid">{list.map(renderCell)}</div>
                </div>
              )
            })()}
            {/* 🎨 배경·테이프 */}
            {cat === 'bgtape' && (
              <>
                {/* ⛔ 옛 「표지 그림」 섹션은 여기 있었다 — 2026-08-07 에 «맨 위 선물 아래»로 옮겼다
                    (창업자 배치 지시). 배경 탭에만 있으면 표지를 손보러 탭을 옮겨야 했다. */}
                <div className="decor-sec">
                  <div className="decor-sec-label">배경지</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {/* ⛔ hidden = 피커에만 안 뜬다(모눈·도트·스트라이프 — 마테와 겹쳐서 뺌).
    저장된 표지는 bgStyle() 이 계속 찾아 주므로 그대로 보인다. */}
                    {/* ⭐⭐ **움직이는 배경은 「표식」이 아니라 «여기서 진짜 움직여서» 알린다.** (창업자 2026-08-01)
    · 리컬러는 **정지 그림으로 색을 못 보여주니** 뱃지가 필요했다. 움직임은 **그 자리에서 보여줄 수 있다** —
      「움직여요」라고 써주는 것보다 정직하고, 유저가 고르기 전에 뭘 사는지 안다.
    · ⛔ **뱃지는 안 된다** — 스와치가 42px뿐이라 뭘 얹으면 **그림을 가린다.** 그림이 곧 상품이다.
    · 그리고 **맨 위로 모은다** — 배경이 23개라 흩어지면 못 찾는다(개수는 더 늘어난다).
    ⚠️ `hk-` 클래스라 **「움직임 줄이기」 설정에 같이 걸린다**(`prefers-reduced-motion`). */}
                    {/* ⛔⛔ **유료팩 배경은 «산 사람에게만»** — 2026-08-05 에 이 줄이 `hidden` 만 보고 있어서
                        「비 오는 창」(가을 유료팩 배경)이 **무료로 그대로 뜰 뻔했다.**
                        `pack` 을 붙여만 놓고 «거르는 곳»을 안 만든 것이다. AAB 굽기 직전에 잡았다.
                        📌 절대원칙 = *"파는건 공유카드로도 안내보내는게 맞지"* (창업자 2026-08-03)
                        📌 배운 것 = **꼬리표를 붙이는 것과 그 꼬리표를 «읽는 것»은 다른 일이다.** */}
                    {DECOR_BACKGROUNDS.filter((b) => !b.hidden && (!b.pack || ownedPacks().has(b.pack)))
                      .map((b, i) => ({ b, i }))
                      .sort((x, y) => (y.b.anim ? 1 : 0) - (x.b.anim ? 1 : 0) || x.i - y.i)   // 안정 정렬
                      .map(({ b }) => {
                      const on = bg === b.key
                      const sw = { ...(b.style || { background: 'linear-gradient(135deg,#eef0ec,#e1e5de)' }), ...(b.swatch || {}) }
                      return (
                        <button key={b.key} className="press" onClick={() => setBg(b.key)} aria-label={`배경 ${b.label}${b.anim ? ' (움직임)' : ''}`}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <span className={bgAnim(b.key)} style={{ width: 42, height: 42, borderRadius: 10, ...sw, border: on ? '2.5px solid var(--brown)' : '1.5px solid var(--line)', boxShadow: on ? '0 0 0 2px var(--surface) inset' : 'none' }} />
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: on ? 'var(--brown)' : 'var(--text-sub)' }}>{b.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
            {/* 🎗 마테 — **세 군데에 흩어져 있던 것을 한 탭으로** (창업자 2026-07-30).
                무늬 테이프(CSS)는 길이를 늘일 수 있어 먼저, 손그림 워시 스티커가 그다음. */}
            {cat === 'tape' && (
              <>
                {/* 🎗 CSS 띠는 «공용 기본»이라 일기 선반엔 안 그린다 — 거긴 일기 세트만 있어야 한다.
                    ⛔ 없애는 게 아니다. 「레꾸 꾸미기」 칸에 그대로 있다. */}
                {(!isDiary || shelf === 'all') && (
                <div className="decor-sec">
                  <div className="decor-sec-label">무늬 테이프 (길이 조절돼요)</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {TAPE_PATTERNS.map((t) => (
                      <button key={t.key} className="press" onClick={() => addTape(t.key)} aria-label={`테이프 ${t.label}`}
                        style={{ width: 74, height: 24, borderRadius: 3, ...t.style, boxShadow: '0 1px 3px rgba(70,60,45,.2)', transform: 'rotate(-3deg)' }} />
                    ))}
                  </div>
                </div>
                )}
                {groupsByTab('tape').map(renderStickerGroup)}
              </>
            )}
            {/* 🗒️ 메모·글자 */}
            {/* 🗒️ 글자 — **직접 쓰기 → 포스트잇 → 글자 스티커** 순서 (창업자 2026-07-30).
                글자를 넣으려고 들어오는 탭이라 **직접 쓰기가 맨 위**. 포스트잇은 글씨 받침이라 그다음. */}
            {cat === 'notetext' && (
              <>
                <div className="decor-sec">
                  <div className="decor-sec-label">글자</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '0 0 10px' }}>
                    {TEXT_FONTS.map((f) => (
                      <button key={f.key} className="press" onClick={() => setTextFont(f.key)}
                        style={{ padding: '5px 12px', borderRadius: 999, fontSize: 13, fontWeight: 700, fontFamily: chipFamily(f), background: textFont === f.key ? 'var(--brown)' : 'var(--cream)', color: textFont === f.key ? '#fff' : 'var(--text-sub)' }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                  {/* ⭐ 색 15칸을 다 늘어놓지 않는다 — 예전엔 색마다 칸이 있어서 **고른 색으로 바로 추가**됐고,
                      바꾸려면 지웠다 다시 넣어야 했다. 이제 **넣고 나서 편집 바에서 색·굵기**를 바꾼다. */}
                  <button className="press" onClick={() => addText('charcoal')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px 14px', borderRadius: 12, background: 'var(--brown)', color: '#fff', fontSize: 15, fontWeight: 800, border: 'none', fontFamily: chipFamily(TEXT_FONTS.find((f) => f.key === textFont) || TEXT_FONTS[0]) }}>
                    글자 넣기
                  </button>
                  <div style={{ fontSize: 11.5, color: 'var(--text-sub)', marginTop: 6, lineHeight: 1.5 }}>넣은 뒤 톡 하면 색·굵기·글씨체를 바꿀 수 있어요</div>
                </div>
                {/* 🖍 형광펜 — 글자 «바로 밑»에 둔다. 강조할 글이 있어야 쓰는 도구라 순서가 곧 쓰는 순서다. */}
                <div className="decor-sec">
                  <div className="decor-sec-label">형광펜</div>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    {HL_COLORS.map((c) => (
                      <button key={c.key} className="press" onClick={() => addHl(c.key)} aria-label={`형광펜 ${c.label}`}
                        style={{ flex: '1 1 28%', height: 30, borderRadius: '8% 10% 9% 7%/46% 54% 50% 50%', background: c.color, border: '1px solid rgba(0,0,0,.07)' }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-sub)', marginTop: 7, lineHeight: 1.5 }}>글자 위에 겹쳐 놓으면 글씨가 비쳐 보여요</div>
                </div>
                {/* 🏷🏷 **글 상자 — 글자 올릴 수 있는 것을 «한자리에»** (창업자 2026-08-07
                    *"글자올릴수있는 스티커들을 다같이 배치해서 쓰자. 포스트잇이랑 여러가지 라벨들."*)
                    ⛔ 전엔 포스트잇만 여기 있고, 예쁜 라벨지·메모지는 **데코 탭에 흩어져** 있었다.
                       게다가 그것들은 «그림»이라 글을 못 얹어서, 글자 스티커를 따로 얹어 손으로 맞춰야 했다.
                    ⛔⛔ 그리고 「한끼 일기 · 메모지」 12컷은 `only:'diary'` 라 **레꾸 서랍엔 아예 안 나왔다** —
                       레꾸엔 속지 글칸도 없어서 **글을 넣는 길이 포스트잇밖에 없었다.**
                       창업자 *"이건 레꾸에서도 너무 불편했었어"* 가 이것이다.
                    ⭐ 순서 = 우리 그림 먼저, 포스트잇은 맨 뒤. 창업자 판정 *"포스트잇은 디자인이나 색상이 넘 별루라서.."* */}
                {BOX_GROUPS.map((g) => (
                  <div className="decor-sec" key={g.key}>
                    <div className="decor-sec-label">{g.label}</div>
                    {/* ⛔⛔ 여기서 서랍이 «옆으로» 터졌다 — 검수판이 잡았다(2026-08-07).
                        칸 다섯이 60px 씩 나뉘어야 하는데 **86.7px 로 부풀어 다섯째가 화면 밖**으로 나갔다(밀림 133px).
                        범인 = 칸마다 «다른» `aspectRatio` 를 준 것. `1fr` 은 사실 `minmax(auto,1fr)` 이라
                        **auto 최소값이 그림 크기를 타고 컬럼을 밀어낸다.** 데코 탭은 비율이 다 1 이라 안 터졌다.
                        ✅ `minmax(0,1fr)` = 최소값을 0으로 못 박아 칸이 «정확히» 다섯으로 나뉜다.
                        📌 다른 탭은 안 건드린다 — 전역 CSS 가 아니라 이 묶음에만 준다. */}
                    <div className="decor-grid" style={{ gridTemplateColumns: 'repeat(5, minmax(0,1fr))' }}>
                      {g.items.map((k) => {
                        // 가로로 길면 폭에, 세로로 길면 «높이»에 맞춘다 — 안 그러면 세로로 긴 컷이 칸 밖으로 삐져나온다(87×125 였다)
                        const r = stickerRatio(k) || 1
                        return (
                          <button key={k} className="press decor-cell" onClick={() => addBox(k)} aria-label={`글 상자 ${k}`}>
                            <span style={{ display: 'block', aspectRatio: `${r}`, width: r >= 1 ? '86%' : 'auto', height: r >= 1 ? 'auto' : '86%' }}>
                              <StickerArt id={k} motion={null} />
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <div className="decor-sec">
                  <div className="decor-sec-label">포스트잇</div>
                  {/* 📏 고르는 칸 미리보기 **80% → 62%** (창업자 2026-08-07
                      *"일꾸안에 고르라고 들어가는게 너무 큰거 아닌가 하는 말이었어."*)
                      ⭐ 포스트잇은 «색면»이라 같은 크기라도 선 그림보다 훨씬 무겁게 보인다 —
                         실측하니 포스트잇만 80%(48px)고 데코는 56%·부엌 62%·기본 78% 였다.
                         62% 로 내리면 다른 칸들과 무게가 맞는다.
                      ⚠️ 접힘 삼각형도 «같이» 줄인다 — 12px 고정이라 상자가 작아지면 비율이 커진다
                         (48px 에선 25% 인데 37px 이면 32% 가 되어 삼각형만 커 보인다).
                      ⛔ 이 주석을 `.map((c) => (` **바로 뒤**로 옮기지 말 것 — 거기는 «표현식 여는 자리»라
                         JSX 주석이 객체 리터럴로 파싱돼 빌드가 깨진다(오늘 또 밟았다 · 다섯 번째). */}
                  <div className="decor-grid">
                    {NOTE_COLORS.map((c) => (
                      <button key={c.key} className="press decor-cell" onClick={() => addNote(c.key)} aria-label={`${c.key} 포스트잇`}>
                        <span style={{ display: 'block', width: '62%', aspectRatio: '1.02', background: c.bg, borderRadius: '3px 3px 3px 10px', boxShadow: '1px 3px 7px rgba(70,60,45,.22)', position: 'relative' }}>
                          <span style={{ position: 'absolute', right: 0, bottom: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: '0 0 9px 9px', borderColor: `transparent transparent ${c.fold} transparent` }} />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                {groupsByTab('notetext').map(renderStickerGroup)}
              </>
            )}
            {/* 🐻 친구들 */}
            {cat === 'buddies' && groupsByTab('buddies').map(renderStickerGroup)}
            {/* 🥕 재료 — 재료 + 요리도구. 요리 음식 33컷은 뺐다(레시피에 이미 사진이 붙는다). */}
            {cat === 'food' && groupsByTab('food').map(renderStickerGroup)}
            {/* ✨ 데코 (색 바꾸는 심볼 + 데코 + 응원) */}
            {cat === 'frame' && groupsByTab('frame').map(renderStickerGroup)}
            {cat === 'deco' && groupsByTab('deco').map(renderStickerGroup)}
            {/* 📔 기록 (일꾸 전용) — 맛 평가·반응·조리법·상황·준비·보관·건강 태그 99컷
                ⛔⛔ **탭을 CATS 에 넣는 것만으로는 «안 그려진다».** 서랍 본문이 여기서
                   `cat === '…'` 로 «손으로 나열»돼 있기 때문이다. 2026-08-12 에 이 한 줄을 빠뜨려
                   탭은 떴는데 **안이 텅 비었다**(숫자 검사는 「탭 있음」으로 통과시켰고, 화면을 찍어서 잡았다).
                📌 새 탭을 만들면 **CATS ＋ 여기 둘 다** 고친다. */}
            {cat === 'record' && groupsByTab('record').map(renderStickerGroup)}
            </>)}
          </div>
        </div>

        {/* ⌨️⌨️ **「따로 창 떠서 쓰고 붙이기」는 없앴다** (창업자 2026-08-07
            *"3번은 지금 처럼 붙이기는 너무 불편해(이건 레꾸에서도 너무 불편했었어)"*
             · *"그럼 예전방식은 없어진거지? 따로창떠서 쓰고 붙이기하던거"*)
            포스트잇 · 글 상자 · 글자 넣기 **셋 다** 이제 «그 자리에서» 쳐진다.
            ⛔ 그래서 이 시트(`PromptSheet`)를 여는 곳이 하나도 안 남아 죽은 코드가 됐다 → 지웠다.
            ⭐ 빈 글자 아이템을 지우던 일은 「종이 밖 누르기」가 대신한다(`stopTyping`). */}

        {/* 취소 확인 — 저장 안 한 변경이 있을 때만(실수로 날아가는 것 방지) */}
        {exitAsk && (
          <div onClick={() => setExitAsk(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(40,34,28,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--surface)', borderRadius: 18, padding: '22px 20px 16px', width: '100%', maxWidth: 320, boxShadow: '0 8px 30px rgba(0,0,0,.3)', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>저장하지 않고 나갈까요?</div>
              <div style={{ fontSize: 13.5, color: 'var(--text-sub)', lineHeight: 1.5, marginBottom: 18 }}>지금까지 꾸민 게 사라져요.<br />저장하면 그대로 남아요.</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="press" onClick={() => { setExitAsk(false); doSave() }} style={{ padding: '12px', borderRadius: 12, background: 'var(--brown)', color: '#fff', fontSize: 14.5, fontWeight: 800, border: 'none' }}>저장하고 나가기</button>
                <button className="press" onClick={() => { setExitAsk(false); doExit() }} style={{ padding: '11px', borderRadius: 12, background: 'transparent', color: '#c0574a', fontSize: 14, fontWeight: 700, border: 'none' }}>저장 안 하고 나가기</button>
                <button className="press" onClick={() => setExitAsk(false)} style={{ padding: '9px', borderRadius: 12, background: 'transparent', color: 'var(--text-sub)', fontSize: 13.5, fontWeight: 600, border: 'none' }}>계속 꾸미기</button>
              </div>
            </div>
          </div>
        )}

        {/* 🎁 출시기념 팩 안내 — 서랍을 처음 열 때 한 번. 「구경하기」는 프레임 탭으로 데려간다.
            📔 선물은 «레꾸 세트»(여름 프레임·축하 컷)라 «일기 칸엔 그 탭이 없다» →
               누르면 **레꾸 칸으로 옮겨서** 그 탭을 연다. ⛔ 안 그러면 빈 화면이 뜬다.
            ⛔⛔ 이 주석을 아래 `{gift && (` «안»에 넣지 말 것 — 표현식 자리라 빌드가 죽는다
               (2026-08-04·08-06 두 번 밟았다. CLAUDE.md 「JSX 주석」 함정). */}
        {gift && (
          <GiftPackSheet onClose={() => setGift(false)} onGo={(cat) => { setShelf('all'); setCat(cat || 'frame') }} />
        )}
        {/* 💰 꾸미기 팩 사기 — 서랍 자물쇠를 누르면 열린다.
            ⛔ sellable 이 false 인 동안엔 자물쇠가 아예 안 나오므로 이 시트도 안 뜬다. */}
        {buyPack && (
          <PackBuySheet pack={buyPack} onClose={() => setBuyPack(null)} onBought={() => { /* ⏳ 소유 반영은 다음 단계(앱 시작 때 ownedPackKeys 로 읽는다) */ }} />
        )}
      </div>
    </Portal>
  )
}
