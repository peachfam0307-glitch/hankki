import { useState, useEffect, useRef } from 'react'
import Portal from './Portal'
import Icon from './Icon'
import PromptSheet from './PromptSheet'
import Thumb from './Thumb'
import DecorLayer from './DecorLayer'
import { PaperBox } from './PaperSheet'
import { PAPER_RULES, PAPER_SKINS, PAPER_ARTS, paperStyle } from '../data/papers'
import { seasonRank, isReleased } from '../season'
import GiftPackSheet from './GiftPackSheet'
import PackBuySheet from './PackBuySheet'
import { needsGiftPack } from '../nudges'
import { cropSquare } from '../utils'
import { StickerArt, STICKER_GROUPS, drawerGroups, ownedPacks, recentStickers, pushRecentSticker, KITCHEN_IDS, FRIEND_IDS, PHOTO_IDS, pickableMotions, pickableFx, NOTE_COLORS, NOTE_PATTERNS, NOTE_SHAPES, notePatternStyle, noteRadius, noteClip, noteIsClip, TEXT_COLORS, TEXT_FONTS, TEXT_WEIGHTS, DECOR_BACKGROUNDS, bgAnim, RECOLORABLE, STICKER_COLORS, TAPE_PATTERNS, FRAMES } from './Stickers'

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

// 📔 다이어리 속지 세 층(선·종이·틀) — 「틀 고르기」가 화면에 따로 있던 것을 **서랍 안으로 들였다**.
//   창업자 2026-08-06 *"지금 꾸미기 틀이랑 꾸미기로 나눠져있는게 조금 불편해"*
//   ⭐ 값은 `data/papers.js` 그대로 쓴다 — 여기서 목록을 다시 만들면 두 곳이 어긋난다.
const PAPER_AXES = [
  { key: 'rule', label: '선', list: PAPER_RULES },
  { key: 'skin', label: '종이', list: PAPER_SKINS },
  { key: 'art', label: '틀', list: PAPER_ARTS },
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
export default function DecorEditor({ recipe, onSave, onClose, closeRef, ratio = '1/1', paper = null, paperOverlay = null, title = '레시피 꾸미기', paperPick = null, onPaperPick = null }) {
  const savedThumb = recipe.thumb || (recipe.image ? 'photo' : 'icon')
  // 저장된 표지 상태로 시작하되, 자동저장 초안이 있으면 그걸로 복구(꾸미던 중 날아간 것 되살림).
  const draft = loadDraft(recipe.id)
  const [items, setItems] = useState(() => (draft?.items || recipe.decor || []).map((d) => ({ ...d })))
  const [sel, setSel] = useState(null)
  const [noteEdit, setNoteEdit] = useState(null) // 글 수정 중인 포스트잇 item
  const [textFont, setTextFont] = useState('gaegu') // 글자 스티커 글씨체 기본 = 귀염체(손글씨 톤)
  const [bg, setBg] = useState(draft?.bg ?? recipe.decorBg ?? 'none') // 표지 배경(배경지)
  // 되돌리기용 실제 표지 — 저장값이 'none'이어도 아이콘/사진으로 되살릴 수 있게
  const origThumb = savedThumb !== 'none' ? savedThumb : (recipe.image ? 'photo' : 'icon')
  const [thumb, setThumb] = useState(draft?.thumb ?? savedThumb) // 'none'이면 표지 그림 비움 → 깨끗한 배경에 꾸미기
  const [exitAsk, setExitAsk] = useState(false) // 취소 시 "저장 안 함?" 확인
  const restoredRef = useRef(!!draft) // 초안에서 복구했는지(안내 토스트용)
  // 📔 여기가 다이어리인가 = `paper` 를 받았나. 아래 「어느 판에서 보이나」를 가르는 기준.
  //   ⭐ 새 값을 안 만든다 — 판을 종이로 바꾸는 그 인자가 곧 「다이어리다」라는 뜻이다.
  const isDiary = !!paper
  // 📔 속지 탭을 띄울 수 있나 = 다이어리이면서 부모가 「고르는 길」을 줬나.
  const canPickPaper = isDiary && !!paperPick && !!onPaperPick
  // 서랍 탭 — 표지는 배경부터, 다이어리는 프레임부터(다이어리엔 배경 탭 자체가 없다. 아래 CATS 참고)
  // 📔 **빈 다이어리를 처음 열면 「속지」부터** — 종이를 고르고 꾸미는 게 순서다.
  //    ⭐ 이미 꾸며둔 걸 다시 열면 곧장 「프레임」으로 간다 — 종이는 이미 골랐고 이제 꾸미러 온 것이다.
  const [cat, setCat] = useState(canPickPaper && items.length === 0 ? 'paper' : isDiary ? 'frame' : 'bgtape')
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
  const isBacking = (it) => !!it && (!!FRAMES[it.key] || it.type === 'note' || it.type === 'tape' || (it.type === 'sticker' && typeof it.key === 'string' && (it.key.startsWith('dc_dma') || it.key.startsWith('pf_') || it.key.startsWith('sf_'))))
  // 선택하면 맨 앞으로(배열 끝으로) — 겹칠 때 자연스럽게 위로. 단 배경격은 제자리 유지.
  const select = (id) => {
    setSel(id)
    if (id) setItems((arr) => {
      const i = arr.findIndex((x) => x.id === id)
      if (i < 0 || isBacking(arr[i])) return arr
      return [...arr.slice(0, i), ...arr.slice(i + 1), arr[i]]
    })
  }
  // 순서 수동 조절 — 다 꺼내 다시 배열 안 해도 되게. 맨 뒤=배열 앞, 맨 앞=배열 끝.
  const sendToBack = (id) => setItems((arr) => { const i = arr.findIndex((x) => x.id === id); return i <= 0 ? arr : [arr[i], ...arr.slice(0, i), ...arr.slice(i + 1)] })
  const bringToFront = (id) => setItems((arr) => { const i = arr.findIndex((x) => x.id === id); return (i < 0 || i === arr.length - 1) ? arr : [...arr.slice(0, i), ...arr.slice(i + 1), arr[i]] })
  const patch = (id, p) => setItems((arr) => arr.map((x) => (x.id === id ? { ...x, ...p } : x)))
  const remove = (id) => { setItems((arr) => arr.filter((x) => x.id !== id)); setSel(null) }

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
  const ctxLabel = { fontSize: 11.5, fontWeight: 800, color: 'var(--brown)', flex: '0 0 auto', minWidth: 34 }
  const ctxScroll = { display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2, flex: 1 }
  const ctxRow = { display: 'flex', alignItems: 'center', gap: 9 }
  const ctxDot = { width: 30, height: 30, borderRadius: '50%', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }
  const ctxChip = { flex: '0 0 auto', padding: 4, borderRadius: 10, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }
  const selOn = '2.5px solid var(--brown)'
  const selOff = '1.5px solid var(--line)'
  // 🐻🐧 모션·효과 바를 띄울 대상 = **친구들 탭 스티커 전부**(부엌 식구들 포함).
  //   ⚠️ 전엔 `KITCHEN_IDS` 와 `gp_` 접두어 둘로 판정했는데, 여름 곰펭(`sm_`)·가을 곰펭(`au_b`)이
  //      어느 쪽에도 안 걸려 **모션·효과 바가 아예 안 떴다**(창업자 2026-07-30 제보).
  //      이름 규칙 대신 이미 있는 분류(친구들 탭)를 쓴다 → 새 계절 곰펭도 자동으로 된다.
  const selIsBuddy = selItem?.type === 'sticker' && FRIEND_IDS.has(selItem.key)
  // 뭐든 선택하면 컨텍스트 바를 띄운다 — 최소한 '순서(맨 뒤/맨 앞)'는 항상 조절 가능하게(창업자 레이어 제보). 색·움직임 등은 그 아래 종류별로.
  const hasCtx = !!selItem
  const layerBtn = { padding: '6px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, flex: '0 0 auto', whiteSpace: 'nowrap', background: 'var(--surface)', color: 'var(--text-sub)', border: '1px solid var(--line)' }

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
  // 📔📔 **「속지」가 맨 앞** (창업자 2026-08-06 *"지금 꾸미기 틀이랑 꾸미기로 나눠져있는게 조금 불편해"*)
  //   전엔 다이어리 화면에 「선·종이·틀」 줄이 따로 있고, 꾸미기는 또 다른 버튼이었다 —
  //   **한 장을 만드는데 손이 두 군데**였다. 종이를 고르는 건 «꾸미기의 첫 단계»지 딴 일이 아니다.
  //   ⭐ 자리는 표지의 「배경」과 같다 — 배경도 속지도 **맨 밑에 까는 판**이라 순서가 제일 먼저다.
  const CATS = [
    ...(canPickPaper ? [{ key: 'paper', label: '속지' }] : []),
    ...(isDiary ? [] : [{ key: 'bgtape', label: '배경' }]),
    { key: 'frame', label: '프레임' },
    { key: 'tape', label: '마테' },
    { key: 'deco', label: '데코' },
    { key: 'notetext', label: '글자' },
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
  const where = isDiary ? 'diary' : 'cover'
  const groupsByTab = (t) => drawerGroups()
    .filter((x) => x.tab === t && isReleased(x.from) && (!x.only || x.only === where))
    .sort((a, b) => ((b.gift ? 1 : 0) - (a.gift ? 1 : 0))
      || ((b.locked ? 1 : 0) - (a.locked ? 1 : 0))
      || (seasonRank(a.season) - seasonRank(b.season))
      || ((b.recolor ? 1 : 0) - (a.recolor ? 1 : 0)))

  // 포스트잇을 선택하면 서랍을 맨 위로 올려 '무늬·모양 꾸미기'가 바로 보이게 한다.
  const drawerRef = useRef(null)
  useEffect(() => {
    const it = items.find((x) => x.id === sel)
    if (it?.type === 'note' && drawerRef.current) drawerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel])

  const addSticker = (key) => {
    const n = items.length
    const isKf = KITCHEN_IDS.has(key)
    const isFrame = !!FRAMES[key] || (typeof key === 'string' && key.startsWith('pf_'))   // 벡터·PNG 프레임 둘 다
    const it = {
      id: newDecorId(), type: 'sticker', key,
      x: isFrame ? 0.5 : 0.5 + ((n % 3) - 1) * 0.06, y: isFrame ? 0.46 : 0.42 + ((n % 4) - 1.5) * 0.05,
      s: isFrame ? 0.58 : key === 'yum' ? 0.34 : isKf ? 0.28 : key.startsWith('gp_duo') ? 0.34 : key.startsWith('gp_') ? 0.26 : PHOTO_IDS.has(key) ? ((key.startsWith('dc_') || key.startsWith('ch_')) ? 0.15 : 0.22) : FACE_KEYS.has(key) ? 0.11 : 0.2,
      r: isFrame ? 0 : ((n % 5) - 2) * 4,
      // 🐻🐧 친구들(캐릭터)은 붙자마자 통통 움직인다 — 소품·음식은 가만히.
      //    ⚠️ 여기도 `gp_` 접두어로 골랐었다 → 여름·가을 곰펭은 붙여도 모션이 안 박혔다.
      ...(FRIEND_IDS.has(key) ? { motion: 'tongtong', fx: 'none' } : {}),
    }
    // 🖼 프레임(액자)은 밑판이라 맨 뒤(배열 앞)로 — 이미 꾸며둔 스티커·글자가 프레임 위로 자연스럽게 얹힌다. 나머지는 맨 앞(위).
    setItems((arr) => isFrame ? [it, ...arr] : [...arr, it])
    setSel(it.id)
    pushRecentSticker(key) // 🕗 다음에 열 때 맨 위에 놓아 준다(이번 서랍은 안 흔든다)
  }
  const addNote = (colorKey) => {
    const n = items.length
    const it = { id: newDecorId(), type: 'note', key: colorKey, text: '', font: 'gaegu', x: 0.62 + ((n % 2) - 0.5) * 0.06, y: 0.68, s: 0.34, r: ((n % 5) - 2) * 3 }
    setItems((arr) => [...arr, it])
    setSel(it.id)
    setNoteEdit(it) // 붙이면 바로 글씨 쓰기 시트 열기(무늬·모양은 상단 컨텍스트 바에서)
  }
  // 📷 내 사진을 «스티커»로 붙인다 (창업자 2026-08-06 *"무지나 도트도 사진 넣고싶을수있지않아?"*)
  //   ⭐ 틀의 사진칸은 「창에 끼우는 것」이라 창이 그려진 속지에서만 된다.
  //      이건 「사진을 얹는 것」이라 **무지·도트·표지 어디서든** 되고, 여러 장도 된다.
  //   ⭐ 그리고 이건 다이어리만의 것이 아니다 — 같은 에디터라 **레꾸(표지 꾸미기)에도 그대로 생긴다.**
  //   ⚠️ 700px·q0.8 로 줄인다 — 한 장이 100KB 넘으면 localStorage(≈5MB)가 금방 찬다.
  //      표지 사진(900)보다 작게 두는 이유 = 스티커는 **여러 장** 붙는다.
  const photoRef = useRef(null)
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
    const small = await cropSquare(src, 700, 0.8)
    const n = items.length
    const it = { id: newDecorId(), type: 'photo', src: small, x: 0.5, y: 0.44, s: 0.44, r: ((n % 5) - 2) * 3 }
    setItems((arr) => [...arr, it])
    setSel(it.id)
  }
  const addTape = (key) => {
    const n = items.length
    const it = { id: newDecorId(), type: 'tape', key, x: 0.5, y: 0.28 + (n % 3) * 0.14, s: 0.62, r: ((n % 5) - 2) * 3 }
    setItems((arr) => [...arr, it])
    setSel(it.id)
  }
  const addText = (colorKey) => {
    const n = items.length
    const it = { id: newDecorId(), type: 'text', color: colorKey, font: textFont, text: '', x: 0.5, y: 0.5 + ((n % 3) - 1) * 0.08, s: 0.5, r: 0 }
    setItems((arr) => [...arr, it])
    setSel(it.id)
    setNoteEdit(it)
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
            display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 12px', marginBottom: 10,
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
        <div className="decor-grid">{g.items.map(renderCell)}</div>
      </div>
    )
  }

  return (
    <Portal>
      <div className="decor-editor">
        {/* 상단 바 */}
        <div className="decor-top">
          <button className="press" onClick={handleCancel} style={{ color: 'var(--text-sub)', fontSize: 15, fontWeight: 600 }}>취소</button>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{title}</div>
          <button className="press" onClick={doSave} style={{ color: 'var(--brown)', fontSize: 15, fontWeight: 800 }}>저장</button>
        </div>
        {restoredRef.current && (
          <div style={{ flex: '0 0 auto', background: '#eef3e8', color: '#4f5a44', fontSize: 12.5, fontWeight: 700, textAlign: 'center', padding: '6px 10px' }}>
            저장 안 하고 나갔던 꾸미기를 이어서 불러왔어요
          </div>
        )}

        {/* 꾸미는 판 — 표지면 정사각, 다이어리면 세로 종이 */}
        <div className="decor-stage">
          {(() => {
            const layer = (
              <DecorLayer
                items={items}
                editable
                selectedId={sel}
                onSelect={select}
                onChange={patch}
                onRemove={remove}
                onEditNote={(it) => setNoteEdit(it)}
              />
            )
            // 📔 다이어리 — 종이 ＋ 쓴 글이 «화면과 똑같이» 보여야 한다.
            //    `PaperBox` 로 감싸야 글자·줄이 폭 기준(cqw)으로 제자리에 앉는다.
            if (paper) {
              return (
                <PaperBox skin={paper} ratio={ratio} style={{ borderRadius: 18 }}>
                  {/* ⚠️ 사진이 «먼저» — 그래야 스티커를 사진 위에 붙일 수 있다(글자는 zIndex 1) */}
                  {paperOverlay}
                  {layer}
                </PaperBox>
              )
            }
            return (
              <div style={{ position: 'relative', width: '100%', aspectRatio: ratio, borderRadius: 18, overflow: 'hidden' }}>
                <Thumb recipe={{ ...recipe, decorBg: bg, thumb }} ratio={ratio} radius={0} emojiSize="4.5rem" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />
                {layer}
              </div>
            )
          })()}
          <div className="t-sub" style={{ fontSize: 12, textAlign: 'center', marginTop: 10 }}>
            {hasCtx ? '탭한 걸 여기서 바로 꾸며요 · 드래그로 이동 · ⟳ 크기/회전' : '아래에서 골라 붙이고 · 드래그로 이동 · ⟳ 손잡이로 크기/회전'}
          </div>
        </div>

        {/* 고정 컨텍스트 바 — 선택한 아이템의 색·무늬·모양을 캔버스 바로 아래에서 바로 바꾼다(스크롤 이동 없음) */}
        {hasCtx && (
          <div style={{ flex: '0 0 auto', borderTop: '1px solid var(--line)', background: 'var(--cream)', padding: '9px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {/* 🧷 순서 — 어떤 아이템이든 맨 뒤/맨 앞으로. 프레임·포스트잇에 스티커가 가려도 다 꺼낼 필요 없이 여기서 정리. */}
            <div style={ctxRow}>
              <span style={ctxLabel}>순서</span>
              <div style={{ display: 'flex', gap: 7, flex: 1 }}>
                <button className="press" onClick={() => sendToBack(sel)} style={layerBtn}>맨 뒤로</button>
                <button className="press" onClick={() => bringToFront(sel)} style={layerBtn}>맨 앞으로</button>
              </div>
            </div>
            {selIsBuddy && (
              <>
                <div style={ctxRow}>
                  <span style={ctxLabel}>움직임</span>
                  <div style={ctxScroll}>
                    {pickableMotions().map((m) => {
                      const on = (selItem.motion || 'tongtong') === m.key
                      return (
                        <button key={m.key} className="press" onClick={() => patch(sel, { motion: m.key })}
                          style={{ padding: '5px 13px', borderRadius: 999, fontSize: 13, fontWeight: 700, flex: '0 0 auto', whiteSpace: 'nowrap', background: on ? 'var(--brown)' : 'var(--surface)', color: on ? '#fff' : 'var(--text-sub)', border: on ? 'none' : '1px solid var(--line)' }}>{m.label}</button>
                      )
                    })}
                  </div>
                </div>
                <div style={ctxRow}>
                  <span style={ctxLabel}>효과</span>
                  <div style={ctxScroll}>
                    {pickableFx().map((f) => {
                      const on = (selItem.fx || 'none') === f.key
                      return (
                        <button key={f.key} className="press" onClick={() => patch(sel, { fx: f.key })}
                          style={{ padding: '5px 13px', borderRadius: 999, fontSize: 13, fontWeight: 700, flex: '0 0 auto', whiteSpace: 'nowrap', background: on ? 'var(--brown)' : 'var(--surface)', color: on ? '#fff' : 'var(--text-sub)', border: on ? 'none' : '1px solid var(--line)' }}>{f.label}</button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
            {selItem.type === 'sticker' && RECOLORABLE.has(selItem.key) && (
              <div style={ctxRow}>
                <span style={ctxLabel}>색</span>
                <div style={ctxScroll}>
                  <button className="press" onClick={() => patch(sel, { color: null })} aria-label="기본색"
                    style={{ ...ctxDot, border: !selItem.color ? selOn : selOff, fontSize: 10, fontWeight: 800, color: 'var(--text-sub)', background: 'var(--surface)' }}>기본</button>
                  {STICKER_COLORS.map((c) => (
                    <button key={c.key} className="press" onClick={() => patch(sel, { color: c.color })} aria-label={`색 ${c.key}`}
                      style={{ ...ctxDot, background: c.color, border: selItem.color === c.color ? selOn : '1.5px solid rgba(0,0,0,.1)', boxShadow: selItem.color === c.color ? '0 0 0 2px var(--surface) inset' : 'none' }} />
                  ))}
                </div>
              </div>
            )}
            {selItem.type === 'tape' && (
              <>
                <div style={ctxRow}>
                  <span style={ctxLabel}>무늬</span>
                  <div style={ctxScroll}>
                    {TAPE_PATTERNS.map((t) => (
                      <button key={t.key} className="press" onClick={() => patch(sel, { key: t.key })} aria-label={`테이프 ${t.label}`}
                        style={{ width: 46, height: 22, borderRadius: 3, ...t.style, flex: '0 0 auto', border: selItem.key === t.key ? selOn : '1px solid rgba(0,0,0,.08)' }} />
                    ))}
                  </div>
                </div>
                <div style={ctxRow}>
                  <span style={ctxLabel}>굵기</span>
                  <div style={ctxScroll}>
                    {TAPE_WIDTHS.map((w) => {
                      const on = (selItem.ratio || 3.4) === w.ratio
                      return (
                        <button key={w.key} className="press" onClick={() => patch(sel, { ratio: w.ratio })}
                          style={{ padding: '5px 15px', borderRadius: 999, fontSize: 13, fontWeight: 700, flex: '0 0 auto', background: on ? 'var(--brown)' : 'var(--surface)', color: on ? '#fff' : 'var(--text-sub)', border: on ? 'none' : '1px solid var(--line)' }}>{w.label}</button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
            {selItem.type === 'text' && (
              <>
              {/* 🎨 **놓은 뒤에도 색을 바꾼다.** 예전엔 색이 '추가할 때'만 있어서
                  색을 바꾸려면 **지우고 다시 넣어야** 했다(창업자 2026-07-30
                  *"글자 리컬러 안돼…"* · *"이렇게 색깔고르는게 되게 불편하네... 한개씩 눌러서 아니면 지우고.."*). */}
              <div style={ctxRow}>
                <span style={ctxLabel}>색</span>
                <div style={ctxScroll}>
                  {TEXT_COLORS.map((c) => (
                    <button key={c.key} className="press" onClick={() => patch(sel, { color: c.key })} aria-label={`글자색 ${c.key}`}
                      style={{ ...ctxDot, background: c.color, border: (selItem.color || 'white') === c.key ? selOn : '1.5px solid rgba(0,0,0,.14)', boxShadow: (selItem.color || 'white') === c.key ? '0 0 0 2px var(--cream)' : 'none' }} />
                  ))}
                </div>
              </div>
              <div style={ctxRow}>
                <span style={ctxLabel}>굵기</span>
                <div style={ctxScroll}>
                  {TEXT_WEIGHTS.map((w) => (
                    <button key={w.key} className="press" onClick={() => patch(sel, { w: w.key })}
                      style={{ padding: '5px 15px', borderRadius: 999, fontSize: 13, fontWeight: 700, flex: '0 0 auto', background: (selItem.w || 'mid') === w.key ? 'var(--brown)' : 'var(--surface)', color: (selItem.w || 'mid') === w.key ? '#fff' : 'var(--text-sub)', border: 'none' }}>
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={ctxRow}>
                <span style={ctxLabel}>글씨</span>
                <div style={ctxScroll}>
                  {TEXT_FONTS.map((f) => (
                    <button key={f.key} className="press" onClick={() => patch(sel, { font: f.key })}
                      style={{ padding: '4px 12px', borderRadius: 999, fontSize: 13.5, fontWeight: 700, flex: '0 0 auto', fontFamily: f.family, background: selItem.font === f.key ? 'var(--brown)' : 'var(--surface)', color: selItem.font === f.key ? '#fff' : 'var(--text-sub)' }}>{f.label}</button>
                  ))}
                </div>
              </div>
              </>
            )}
            {selItem.type === 'note' && (
              <>
                <div style={ctxRow}>
                  <span style={ctxLabel}>글씨</span>
                  <div style={ctxScroll}>
                    {TEXT_FONTS.map((f) => (
                      <button key={f.key} className="press" onClick={() => patch(sel, { font: f.key })}
                        style={{ padding: '4px 12px', borderRadius: 999, fontSize: 13.5, fontWeight: 700, flex: '0 0 auto', fontFamily: f.family, background: (selItem.font || 'gaegu') === f.key ? 'var(--brown)' : 'var(--surface)', color: (selItem.font || 'gaegu') === f.key ? '#fff' : 'var(--text-sub)' }}>{f.label}</button>
                    ))}
                  </div>
                </div>
                <div style={ctxRow}>
                  <span style={ctxLabel}>무늬</span>
                  <div style={ctxScroll}>
                    {NOTE_PATTERNS.map((p) => (
                      <button key={p.key} className="press" onClick={() => patch(sel, { pattern: p.key })}
                        style={{ ...ctxChip, border: (selItem.pattern || 'plain') === p.key ? selOn : selOff }}>
                        <MiniNote color={selNoteColor} pattern={p.key} shape="round" size={22} />
                      </button>
                    ))}
                  </div>
                </div>
                <div style={ctxRow}>
                  <span style={ctxLabel}>모양</span>
                  <div style={ctxScroll}>
                    {NOTE_SHAPES.map((s) => (
                      <button key={s.key} className="press" onClick={() => patch(sel, { shape: s.key })}
                        style={{ ...ctxChip, border: (selItem.shape || 'fold') === s.key ? selOn : selOff }}>
                        <MiniNote color={selNoteColor} pattern="plain" shape={s.key} size={22} />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 서랍 — 새로 붙이기 전용(배경·스티커·테이프·글자·포스트잇). 선택 아이템 편집은 위 컨텍스트 바에서. */}
        <div className="decor-drawer">
          <div className="decor-grab" />
          {/* 카테고리 칩 — 가로로 골라 그 카테고리만(세로 스크롤 최소화) */}
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', padding: '2px 2px 10px', flex: '0 0 auto' }}>
            {CATS.map((c) => {
              const on = cat === c.key
              return (
                <button key={c.key} className="press" onClick={() => setCat(c.key)}
                  style={{ flex: '0 0 auto', padding: '7px 13px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', background: on ? 'var(--brown)' : 'var(--cream)', color: on ? '#fff' : 'var(--text-sub)' }}>
                  {c.label}
                </button>
              )
            })}
          </div>
          <div className="decor-scroll" ref={drawerRef}>
            {/* 🎁🎁 **출시 기념 선물 — 상시 한 줄** (창업자 2026-08-03 *"꾸미기 상단에 넣기"*)
                ⛔ 전엔 안내가 **서랍 첫 방문에 딱 한 번 뜨는 시트**뿐이었다. 닫으면 끝이라
                   *"배경이랑 캐릭터, 프레임외에 뭐 더 주는지 모름"* 이 됐다 — 맞는 지적이다.
                ⭐ **몰라서 못 쓰는 선물은 안 준 것과 같다.** 그래서 늘 보이는 자리에 둔다.
                ⚠️ 탭을 바꿔도 계속 보인다 — 선물이 **네 탭에 흩어져 있어서**(프레임·친구들·배경·모션)
                   한 탭에만 두면 나머지 셋을 또 못 찾는다. */}
            {/* 📷 내 사진 — **탭과 상관없이 늘 보인다.** 종이 종류를 안 가리고 붙는 유일한 길이라
                한 탭에 숨기면 못 찾는다(선물 줄과 같은 이유). */}
            <button className="press" onClick={() => photoRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 12px', marginBottom: 8,
                borderRadius: 12, background: 'var(--cream)', border: '1px solid var(--line)', textAlign: 'left' }}>
              <Icon name="photo" size={17} color="var(--brown)" />
              <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>내 사진 넣기</span>
              <span aria-hidden style={{ color: 'var(--text-sub)', fontSize: 17, flex: '0 0 auto' }}>›</span>
            </button>
            <input ref={photoRef} type="file" accept="image/*" onChange={onPhotoFile} style={{ display: 'none' }} />
            <button className="press" onClick={() => setGift(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 12px', marginBottom: 10,
                borderRadius: 12, background: 'var(--cream)', border: '1px solid var(--line)', textAlign: 'left' }}>
              <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 800, background: 'var(--brown)', color: '#fff', flex: '0 0 auto' }}>선물</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>출시 기념으로 네 가지를 넣어뒀어요</span>
              <span aria-hidden style={{ color: 'var(--text-sub)', fontSize: 17, flex: '0 0 auto' }}>›</span>
            </button>
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
            {/* 📔 속지 — 선·종이·틀 세 층. 「각각 혹은 같이」 고른다
                (창업자 2026-08-06 *"저렇게 각각 혹은 같이 사용하는거 아이디어야"*).
                ⚠️ 고르는 순간 «위 판»이 바뀐다 — 저장을 눌러야 보이는 게 아니다. */}
            {cat === 'paper' && canPickPaper && PAPER_AXES.map((ax) => (
              <div className="decor-sec" key={ax.key}>
                <div className="decor-sec-label">{ax.label}</div>
                {/* ⚠️ 줄이 «인쇄된» 틀에선 선을 골라도 화면이 안 바뀐다 — 그냥 두면 고장으로 읽힌다.
                    ⛔ 칸을 숨기지는 않는다. 틀을 「없음」으로 바꾸면 바로 살아나는 값이라 감추면 못 찾는다. */}
                {ax.key === 'rule' && paperStyle(paperPick).ruleWhere === 'none' && (
                  <div style={{ fontSize: 11.5, color: 'var(--text-sub)', margin: '-2px 0 8px', lineHeight: 1.5 }}>
                    지금 고른 틀엔 줄이 이미 그려져 있어요 · 틀을 바꾸면 여기서 고른 선이 보여요
                  </div>
                )}
                <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                  {ax.list.map((o) => {
                    const next = { ...paperPick, [ax.key]: o.key }
                    const on = paperPick[ax.key] === o.key
                    // ⭐⭐ 미리보기는 **그 층만** 보여준다 — 틀 그림을 얹으면 그림이 선·종이색을 덮어
                    //    무지·줄·모눈·도트 넷이 «똑같아 보인다»(실물 캡처로 잡음 2026-08-06).
                    //    「틀」 절만 그림 그대로 — 거기선 그림 자체가 고르는 대상이다.
                    const mini = paperStyle(ax.key === 'art' ? next : { ...next, art: 'none' })
                    return (
                      <button key={o.key} className="press" onClick={() => onPaperPick(next)} aria-label={`속지 ${o.label}`}
                        style={{ flex: '0 0 auto', border: 'none', background: 'none', padding: 0, width: 54 }}>
                        {/* 📏 줄 간격 — CSS 기본값(28px)은 54px 스와치에 두 줄만 그어져 「줄노트」로 안 읽힌다 */}
                        <div className={mini.className}
                          style={{ width: 54, aspectRatio: '3/4', borderRadius: 8, '--rule-gap': '8px', boxShadow: on ? '0 0 0 2.5px var(--brown)' : '0 1px 4px rgba(70,60,45,.18)', ...(mini.style || {}) }} />
                        <div style={{ fontSize: 10.5, fontWeight: 700, marginTop: 4, textAlign: 'center', color: on ? 'var(--brown)' : 'var(--text-sub)' }}>{o.label}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            {/* 🎨 배경·테이프 */}
            {cat === 'bgtape' && (
              <>
                <div className="decor-sec">
                  <div className="decor-sec-label">표지 그림</div>
                  <button className="press" onClick={() => setThumb(thumb === 'none' ? origThumb : 'none')}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '11px 14px', borderRadius: 12, background: thumb === 'none' ? 'var(--brown)' : 'var(--cream)', color: thumb === 'none' ? '#fff' : 'var(--text)', fontWeight: 800, fontSize: 13.5, textAlign: 'left' }}>
                    {thumb === 'none' ? '표지 그림 되돌리기' : '표지 그림 지우기 (아이콘·이모지·사진)'}
                  </button>
                  <div style={{ fontSize: 11.5, color: 'var(--text-sub)', marginTop: 6, lineHeight: 1.5 }}>깨끗한 배경에 꾸미고 싶을 때. 원래 그림은 언제든 되돌려요.</div>
                </div>
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
                <div className="decor-sec">
                  <div className="decor-sec-label">무늬 테이프 (길이 조절돼요)</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {TAPE_PATTERNS.map((t) => (
                      <button key={t.key} className="press" onClick={() => addTape(t.key)} aria-label={`테이프 ${t.label}`}
                        style={{ width: 74, height: 24, borderRadius: 3, ...t.style, boxShadow: '0 1px 3px rgba(70,60,45,.2)', transform: 'rotate(-3deg)' }} />
                    ))}
                  </div>
                </div>
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
                        style={{ padding: '5px 12px', borderRadius: 999, fontSize: 13, fontWeight: 700, fontFamily: f.family, background: textFont === f.key ? 'var(--brown)' : 'var(--cream)', color: textFont === f.key ? '#fff' : 'var(--text-sub)' }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                  {/* ⭐ 색 15칸을 다 늘어놓지 않는다 — 예전엔 색마다 칸이 있어서 **고른 색으로 바로 추가**됐고,
                      바꾸려면 지웠다 다시 넣어야 했다. 이제 **넣고 나서 편집 바에서 색·굵기**를 바꾼다. */}
                  <button className="press" onClick={() => addText('white')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px 14px', borderRadius: 12, background: 'var(--brown)', color: '#fff', fontSize: 15, fontWeight: 800, border: 'none', fontFamily: (TEXT_FONTS.find((f) => f.key === textFont) || TEXT_FONTS[0]).family }}>
                    글자 넣기
                  </button>
                  <div style={{ fontSize: 11.5, color: 'var(--text-sub)', marginTop: 6, lineHeight: 1.5 }}>넣은 뒤 톡 하면 색·굵기·글씨체를 바꿀 수 있어요</div>
                </div>
                <div className="decor-sec">
                  <div className="decor-sec-label">포스트잇</div>
                  <div className="decor-grid">
                    {NOTE_COLORS.map((c) => (
                      <button key={c.key} className="press decor-cell" onClick={() => addNote(c.key)} aria-label={`${c.key} 포스트잇`}>
                        <span style={{ display: 'block', width: '80%', aspectRatio: '1.02', background: c.bg, borderRadius: '3px 3px 3px 10px', boxShadow: '1px 3px 7px rgba(70,60,45,.22)', position: 'relative' }}>
                          <span style={{ position: 'absolute', right: 0, bottom: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: '0 0 12px 12px', borderColor: `transparent transparent ${c.fold} transparent` }} />
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
          </div>
        </div>

        {noteEdit && (
          <PromptSheet
            compact
            title={noteEdit.type === 'text' ? '글자' : '포스트잇'}
            fields={[{
              key: 'text',
              label: noteEdit.type === 'text' ? '표지에 쓸 글자' : '나만의 팁 · 메모',
              value: noteEdit.text || '',
              placeholder: noteEdit.type === 'text' ? '예) 우리집 최고 메뉴' : '예) 설탕 반만! 더 담백해',
              multiline: true,
            }]}
            submitLabel="붙이기"
            onSubmit={({ text }) => {
              const t = (text || '').trim()
              // 글자를 비우면 새로 넣은 빈 아이템은 제거(표지에 유령 글자 안 남게)
              if (noteEdit.type === 'text' && !t) remove(noteEdit.id)
              else patch(noteEdit.id, { text: t })
            }}
            onClose={() => setNoteEdit(null)}
          />
        )}

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

        {/* 🎁 출시기념 팩 안내 — 서랍을 처음 열 때 한 번. 「구경하기」는 프레임 탭으로 데려간다. */}
        {gift && (
          <GiftPackSheet onClose={() => setGift(false)} onGo={(cat) => setCat(cat || 'frame')} />
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
