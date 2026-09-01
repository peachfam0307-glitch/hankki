import { useRef, useState, useEffect } from 'react'
import Icon from './Icon'
import { StickerArt, StickerFx, motionClass, stickerRatio, NOTE_COLORS, NOTE_FAT, NOTE_HAND_FAT, BOX_PAD, TEXT_COLORS, TEXT_FONTS, TEXT_WEIGHTS, textSizeV, notePatternStyle, noteRadius, noteClip, noteIsClip, NoteShapeDefs, tapeStyle, hlColor } from './Stickers'

// ── 꾸미기 레이어 ──
// 레시피 표지 위에 스티커·포스트잇을 얹는다.
// item: { id, type:'sticker'|'note', key(스티커 아트 id | 포스트잇 색 key), text, x, y, s, r }
//   x,y — 중심 위치(컨테이너 비율 0~1) / s — 폭(컨테이너 폭 비율) / r — 회전(도)
// editable=false 면 순수 표시(포인터 이벤트 없음), true 면 드래그·핸들·삭제 제공.

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// 🎯🎯 `onTapItem` = **꾸미기 탭이 아니어도 스티커를 탭하면 바로 고치러 간다** (창업자 폰 제보 2026-08-07
//   *"일꾸아이템은 일꾸탭을 눌러야 수정, 글쓰기는 글쓰기 탭을 눌러야 수정. 아직도 안바뀌었어."*)
//   ⛔ 전엔 `editable` 하나로 층 전체를 껐다 → 속지·글쓰기 탭에선 스티커를 **아예 못 만졌다.**
//      고치려면 매번 「일꾸」 탭을 먼저 눌러야 했다.
//   ⭐ 답 = **층은 통과시키고 «아이템만» 받는다.** 빈 자리는 글칸·축이 그대로 받고,
//      스티커 위를 누르면 그 스티커가 받아서 꾸미기로 넘어간다. 손가락이 누른 것이 답이 된다.
// ⌨️⌨️ `typingId` = **지금 «그 자리에서» 글을 치고 있는 아이템** (창업자 2026-08-07
//   *"3번은 지금 처럼 붙이기는 너무 불편해(이건 레꾸에서도 너무 불편했었어)"*)
//   ⛔ 전엔 붙이면 «시트»가 열리고 거기 쳐서 「붙이기」를 눌러야 했다 — 두 단계다.
//   ⭐ 방법 = **투명 textarea 를 글자 자리에 «겹친다».** contentEditable 이 아니다 —
//      React 가 값을 내려보내도 **커서가 안 튄다.** v9.93 「어디서든 글씨 수정」이 쓰는 것과 같은 문법.
//   ⚠️ 글꼴·크기·정렬·여백을 글자와 «똑같이» 줘야 치는 중과 친 뒤의 자리가 안 튄다.
//   ⛔⛔⛔ **그 투명 textarea 가 «스티커를 못 끌게» 막고 있었다** (창업자 2026-08-09
//      📮 *"스티커 붙이고 바로 움직이면 안움직여짐. 자판바를 없애고 움직여야 움직여짐."* — 정확한 제보였다)
//      뿌리 = 세 곳(`TextDeco`·`Note`·`ArtBox`)의 textarea 가 전부 `onPointerDown` 에서 `stopPropagation()` 했다.
//      textarea 는 아이템을 통째로 덮고(`inset: 0`) 있어서, 붙이자마자 커서가 들어간 «그 상태»에선
//      손가락이 아이템의 `onItemDown` 에 **한 번도 안 닿았다.** 자판을 내려야(＝textarea 가 사라져야) 끌렸다.
//   ✅ 그 `stopPropagation` 을 뺐다 — 이제 pointerdown 이 textarea 를 지나 아이템까지 «올라간다».
//      · textarea 는 제 일(커서 자리 잡기)을 그대로 하고
//      · 아이템은 끌기 준비를 한다 → 움직이면 이동, 안 움직이면 커서 그대로.
//   ⛔ `.decor-stage` 까지는 안 올라간다 — 아이템의 `onItemDown` 이 거기서 `stopPropagation()` 한다.
//      (안 그러면 「빈 데 눌렀다」로 읽혀 커서가 바로 풀린다 — 그건 그대로 살아 있다.)
export default function DecorLayer({ items = [], editable = false, selectedId, onSelect, onChange, onRemove, onEditNote, onEmptyTap, onTapItem, typingId, onText, pinching = false }) {
  const boxRef = useRef(null)
  // 커버 실제 폭(px) — 글자 상자를 글자에 딱 맞추면서(max-content) 글자 크기는 '커버 폭 기준'으로 px 계산하려고.
  const [coverW, setCoverW] = useState(0)
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const update = () => setCoverW(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 🧲🧲 손잡이가 «종이 밖으로 잘리는» 것을 막는다 (창업자 폰 제보 2026-08-07
  //   *"일꾸에서 사진을 넣었잖아. 삭제하는 버튼이 없어(넣은 사진)"*)
  //   ⛔ 원인 = 지우기·크기 단추가 상자 «바깥»(-17·-19px)에 붙어 있는데
  //      이 판은 `overflow:hidden` 이다 → 아이템을 가장자리로 끌면 단추가 통째로 잘린다.
  //      재현 실측(`_repro-사진손잡이`) = 사진을 위로 끄니 지우기 단추가 **판 기준 y −60**.
  //   ⭐ 답 = 「못 나가게 막기」가 아니라 **「종이 «안»으로 끌어들이기」**.
  //      막으면 창업자가 사진을 위쪽에 두고 싶을 때 못 둔다 — 자유는 그대로 두고 단추만 옮긴다.
  //   ⛔⛔ **처음엔 「틀 안쪽으로 뒤집기」(top:-17 → 5)로 고쳤는데 그걸론 모자랐다.**
  //      사진이 종이보다 커서 **손잡이 틀 «자체»가 종이 위로 올라가 있다** → 틀 안쪽(5px)도 여전히 종이 밖이다.
  //      재현이 −60 → −38 로 «줄기만» 하고 안 고쳐져서 드러났다. 📌**부호가 아니라 「무엇을 기준으로 재나」가 틀렸다.**
  //   ✅ 그래서 참·거짓이 아니라 **「몇 px 밀어야 종이 안으로 들어오나」를 재서** 그 값을 쓴다.
  //   📌 사진만의 문제가 아니다 — 어떤 스티커든 가장자리에 가면 같다. 사진이 커서 자주 걸릴 뿐.
  const frameRef = useRef(null)
  const [edge, setEdge] = useState(null)
  const selIt = items.find((i) => i.id === selectedId)
  useEffect(() => {
    const el = frameRef.current, box = boxRef.current
    if (!el || !box) { setEdge((p) => (p ? null : p)); return }
    const r = el.getBoundingClientRect(), s = box.getBoundingClientRect()
    const M = 5 // 종이 가장자리에서 이만큼은 띄운다
    // 🎯 「틀 모서리」를 0 으로 본 좌표. 값이 클수록 «틀 안쪽»으로 들어온다.
    const next = {
      t: Math.round((s.top + M) - r.top),
      l: Math.round((s.left + M) - r.left),
      r: Math.round(r.right - (s.right - M)),
      b: Math.round(r.bottom - (s.bottom - M)),
    }
    setEdge((p) => (p && p.t === next.t && p.l === next.l && p.r === next.r && p.b === next.b ? p : next))
  }, [selectedId, selIt?.x, selIt?.y, selIt?.s, selIt?.r, selIt?.flip, selIt?.flipY, coverW])

  // 드래그(이동) — 아이템 몸통
  const dragRef = useRef(null)
  const onItemDown = (it) => (e) => {
    if (!editable) {
      // 🎯 꾸미기 탭이 아닐 때 — 이 스티커를 탭했다는 것만 알린다(꾸미기로 넘어가며 고른다)
      if (onTapItem) { e.stopPropagation(); onTapItem(it.id) }
      return
    }
    e.stopPropagation()
    const wasSel = selectedId === it.id
    onSelect?.(it.id)
    const rect = boxRef.current.getBoundingClientRect()
    dragRef.current = { id: it.id, x0: it.x, y0: it.y, px: e.clientX, py: e.clientY, rect, moved: false, wasSel, it, marked: false }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onItemMove = (e) => {
    const d = dragRef.current
    if (!d) return
    // 🤏 두 손가락으로 벌리는 중이면 «끌기를 그만둔다» — 확대하려던 손에 스티커가 딸려 가면 안 된다.
    if (pinching) { dragRef.current = null; return }
    if (Math.abs(e.clientX - d.px) > 8 || Math.abs(e.clientY - d.py) > 8) d.moved = true
    const nx = clamp(d.x0 + (e.clientX - d.px) / d.rect.width, 0.02, 0.98)
    const ny = clamp(d.y0 + (e.clientY - d.py) / d.rect.height, 0.02, 0.98)
    // ↩ **드래그 한 번 = 되돌리기 한 칸.** 손가락이 움직일 때마다 값이 바뀌는데
    //   그걸 다 기록하면 「실행 취소」를 백 번 눌러야 제자리로 온다.
    //   → **맨 처음 한 번만** 세 번째 인자 true(=여기서 기록해라)를 보내고 그 뒤론 안 보낸다.
    if (!d.marked) { d.marked = true; onChange?.(d.id, { x: nx, y: ny }, true) }
    else onChange?.(d.id, { x: nx, y: ny })
  }
  const onItemUp = () => {
    const d = dragRef.current
    // 탭 = 선택(꾸미기 바로), 이미 선택된 걸 다시 탭 = 글씨 쓰기 — '두 번 탭' 방식(창업자 선택 2026-07-18).
    // 새로 붙일 땐 어차피 쓰기창이 자동으로 뜨므로, 탭은 꾸미기(선택)에 주는 게 전체적으로 편하다.
    // (드래그면 이동만. 쓰기는 다시 탭 또는 연필 버튼.)
    if (d && !d.moved && d.wasSel && (d.it.type === 'note' || d.it.type === 'text')) onEditNote?.(d.it)
    dragRef.current = null
  }

  // 핸들(크기+회전) — 선택된 아이템 우하단 손잡이
  const hRef = useRef(null)
  // ↩ 크기·회전 손잡이도 같다 — 끄는 동안 한 칸만 기록한다
  const onHandleDown = (it) => (e) => {
    e.stopPropagation()
    const rect = boxRef.current.getBoundingClientRect()
    const cx = rect.left + it.x * rect.width
    const cy = rect.top + it.y * rect.height
    const dx = e.clientX - cx
    const dy = e.clientY - cy
    // 🔍 이 스티커를 얼마나 키울 수 있나 = **그림 원본이 몇 px인가**로 정한다.
    //   ⚠️ 2026-07-31 창업자 폰 제보(마늘·셰프모자를 크게 키운 화면) — *"어두운색 테두리 있는 애들이 거의 이래"*
    //   재보니 **파일은 멀쩡했다.** 원인은 찌꺼기가 아니라 **확대**였다:
    //   재료·도구 39컷 소스가 171~250px인데 손잡이 상한이 0.9(=972px)라 **최대 4~5배**까지 늘어난다.
    //   확대하면 없던 정보가 생기는 게 아니라 가장자리가 뭉개져서 **테두리가 지저분해 보인다.**
    //   ⭐ `check-sticker-res.mjs` 게이트가 못 잡은 이유 = 그건 **기본 크기**만 재는데 **유저는 키운다.**
    //   → 스티커마다 **소스 긴변 × 1.7배**(게이트와 같은 기준)까지만 커지게 막는다.
    //     0.22 밑으로는 안 내린다 — 기본 크기까지는 어떤 컷이든 쓸 수 있어야 한다.
    //   📌 막는 게 참는 것보다 낫다: 못 키우면 아쉬울 뿐이지만, 키워서 뭉개지면 **앱이 싸구려로 보인다.**
    const img = e.currentTarget.parentElement?.querySelector('img')
    const srcPx = img && img.naturalWidth ? Math.max(img.naturalWidth, img.naturalHeight) : 0
    const maxS = srcPx ? clamp((srcPx * 1.7) / 1080, 0.22, 0.9) : 0.9
    hRef.current = { id: it.id, cx, cy, d0: Math.hypot(dx, dy) || 1, a0: (Math.atan2(dy, dx) * 180) / Math.PI, s0: it.s, r0: it.r || 0, isText: it.type === 'text', maxS, marked: false }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onHandleMove = (e) => {
    const h = hRef.current
    if (!h) return
    const dx = e.clientX - h.cx
    const dy = e.clientY - h.cy
    // 글자는 커버를 꽉 채울 만큼 더 크게 · 그림은 원본 해상도가 허락하는 만큼만(h.maxS)
    const s = clamp(h.s0 * (Math.hypot(dx, dy) / h.d0), 0.07, h.isText ? 1.6 : (h.maxS || 0.9))
    let r = h.r0 + (Math.atan2(dy, dx) * 180) / Math.PI - h.a0
    // 🧲🧲 **돌리기 문턱 ＋ 각도 자석** (창업자 2026-08-07 확정 — *"돌리고 키우는거 잘안되서 불편"* →
    //   자석 안 승인: *"맘대로 삐딱하게도 정확하게도 붙일수있다는거지"* — 맞다, 그게 이 코드다)
    //   실측(_repro-손잡이): 손잡이를 «똑바로» 바깥으로 끌어도 각도가 3.9° 딸려 돈다 —
    //   크기만 키우려는데 스티커가 삐뚤어지는 「불편」의 정체.
    //   ① **문턱 6°** — 끌기 시작 후 6° 안은 «안 돌린 것»으로 본다(iOS 마크업 문법).
    //      크기만 키우는 손은 각을 안 넘기니 **각도가 1도도 안 흔들린다.**
    //      ⛔ 문턱 없이 자석만 걸면, 크기 끄는 중 각이 흘러 자석 안에 들어간 순간 «툭» 돌아버린다.
    //   ② **자석 ±5°** — 0·90·180·270° 근처면 그 각에 딱 붙는다. 5° 를 넘겨 돌리면 완전 자유 —
    //      다꾸는 «일부러» 삐딱하게 붙이는 일이라 자석은 네 곳에만 건다(캔바·인스타 스토리 문법).
    //   ⚠️ 저장값(r)을 스냅한다 — 화면과 저장이 어긋나면 캡처(공유 카드)에서 딴 각도가 찍힌다.
    if (!h.turned && Math.abs(r - h.r0) < 6) r = h.r0
    else {
      h.turned = true
      const rn = ((r % 360) + 360) % 360
      const near = [0, 90, 180, 270, 360].find((a) => Math.abs(rn - a) <= 5)
      if (near !== undefined) r = r + ((near % 360) - rn)
    }
    if (!h.marked) { h.marked = true; onChange?.(h.id, { s, r }, true) }
    else onChange?.(h.id, { s, r })
  }
  const onHandleUp = () => { hRef.current = null }

  // 📍 빈 종이를 탭했을 때 «어디를» 탭했는지 비율로 알려준다 (2026-08-06)
  //    창업자 *"속지 화면 줄 클릭하면 글쓰고"* — 글칸을 탭하면 글쓰기로 넘어가려고.
  //    ⚠️ `currentTarget === target` 이라야 «빈 종이»다 — 스티커를 탭한 건 여기로 안 온다.
  //    ⛔ 주석을 태그 «안»에 두지 않는다 — 표현식 자리에서 죽는다(2026-08-04 빌드 사고).
  const onBoxDown = (e) => {
    onSelect?.(null)
    if (!onEmptyTap || e.currentTarget !== e.target) return
    const b = e.currentTarget.getBoundingClientRect()
    if (b.width && b.height) onEmptyTap(((e.clientX - b.left) / b.width) * 100, ((e.clientY - b.top) / b.height) * 100)
  }

  return (
    <div
      ref={boxRef}
      // 🎯 층 자체는 «늘» 통과시킨다 — 손가락이 닿은 것이 답이 된다(스티커면 스티커, 빈 자리면 글칸).
      //   ⛔ 전엔 꾸미기 탭에서 `auto` 라 **빈 종이를 눌러도 층이 먹어** 글이 안 써졌다.
      //   ⚠️ 그래서 「빈 자리 탭 = 고르기 풀기」는 여기가 아니라 `.decor-stage` 의 `onPointerDown` 이 한다.
      //   ⛔⛔ `zIndex:2` 가 «없으면» 스티커를 글칸 위로 못 끈다 — 재현이 잡았다.
      //      속지의 글칸이 `zIndex:1`(PaperSheet 의 `overSticker` — 「글은 가려지면 안 된다」)이라
      //      그게 위에 깔려 손가락을 먼저 먹었다. **무지 속지는 글칸이 종이 거의 전체라 사실상 아무 데도 못 놓는다.**
      //   ⭐ 층을 올려도 «층은 통과»라 빈 자리는 그대로 글칸이 받는다 —
      //      올라가는 건 **스티커 하나하나뿐**이다(= 스티커 위는 스티커, 빈 자리는 글칸).
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', touchAction: 'auto', zIndex: 2 }}
    >
      {(editable || items.some((it) => it.type === 'note' && noteIsClip(it.shape))) && <NoteShapeDefs />}
      {items.map((it) => {
        const on = editable && selectedId === it.id
        // 🧲 손잡이 자리 — 종이 밖으로 나갈 만큼만 «안쪽»으로 민다(위 `edge` 주석 참고)
        //   기본은 틀 «바깥»(−17·−19). 종이를 넘으면 넘은 만큼 키워서 종이 안으로 들어오게 한다.
        //   ⚠️ 오른쪽이 막히면 지우기(위)와 크기(아래)가 «같은 세로줄»에 겹친다 → 크기를 왼쪽 아래로 보낸다.
        //      손잡이 계산은 «가운데에서의 거리»(`onHandleDown`)라 어느 구석에 있어도 그대로 돈다.
        const e = edge || { t: -99, l: -99, r: -99, b: -99 }
        const px = (base, over) => Math.max(base, over)
        const rSquish = e.r > -17
        const hPos = {
          x: { top: px(-17, e.t), right: px(-17, e.r) },
          pen: { top: px(-17, e.t), left: px(-17, e.l) },
          res: (rSquish && e.l <= -19)
            ? { bottom: px(-19, e.b), left: 5 }
            : { bottom: px(-19, e.b), right: px(-19, e.r) },
        }
        const isText = it.type === 'text'
        // 🏷 글 상자 = 포스트잇(`note`)에 «배경 그림»(`art`)을 깐 것 (2026-08-07)
        //   ⭐ 비율은 그 그림의 실제 비율을 쓴다 — 벡터 포스트잇의 1.06 을 쓰면 라벨이 찌그러진다.
        const ratio = it.type === 'photo' ? (it.ratio || 1) : (it.type === 'tape' || it.type === 'hl') ? (it.ratio || (it.type === 'hl' ? 6 : 3.4)) : it.type === 'note' ? (it.art ? stickerRatio(it.art) : it.shape === 'oval' ? 1.5 : it.shape === 'cloud' ? 1.35 : it.shape === 'circle' ? 1 : 1.06) : stickerRatio(it.key)
        const base = {
          position: 'absolute',
          left: `${it.x * 100}%`,
          top: `${it.y * 100}%`,
          // 글자: 상자를 글자에 딱 맞게(max-content) — 점선칸이 글자 폭만큼만. 크기는 TextDeco가 커버폭 px로.
          // 나머지(스티커·테이프·포스트잇): 폭=it.s + 종횡비 고정.
          ...(isText
            ? { width: 'max-content', maxWidth: '150%' }
            // 📏📏 **상자는 그대로 · 글자만 커진다** (창업자 2026-08-12
            //   *"글자가 커지면서 상자가 커지면 그게 무슨의미가 있어.. 스티커는 그대로고 글자크기만 커져야지."*)
            //   ⛔⛔ 앞 판에서 내가 배율을 «상자»에 걸었다 — 그러면 그림째 커져서 「크기」 갈래가
            //      손잡이로 키우는 것과 똑같아진다. 창업자 말이 맞다, 그럼 있을 이유가 없다.
            //   ⭐ 그래서 상자는 손 안 대고, 배율은 **글자가 커질 수 있는 「한도」**에 건다(`autoCqw` 의 `max`).
            //      `autoCqw` 는 «넘치지 않는 가장 큰 값»을 찾는 함수라, 한도만 올리면
            //      **짧은 글은 그만큼 커지고 긴 글은 알아서 안 넘는다.** 잘림이 구조적으로 안 생긴다.
            //   ⛔ 저장값 `s` 는 안 건드린다 — 「보통」으로 되돌리면 원래대로 온다.
            : { width: `${it.s * 100}%`, aspectRatio: `${ratio}` }),
          // ↔ **좌우 뒤집기**(창업자 2026-08-06 *"캐릭터좌우반전돼?"* → 된다).
          //   ⭐ `rotate` «뒤»에 `scaleX` 를 둔다 — 순서를 바꾸면 뒤집은 뒤 회전이라
          //      기울기가 반대로 돌아 손잡이가 엉뚱하게 움직인다.
          //   ⛔ 손잡이·지우기 단추는 이 상자 «안»에 있어서 같이 뒤집힌다 → 아래에서 되돌린다.
          // ↕ `flipY` = 상하 뒤집기 (창업자 2026-08-07 *"이런거 상하좌우반전 넣어줄수있어?"*)
          //   ⭐ 왜 필요한가 = 코너 장식은 **왼쪽 위 모양 하나뿐**이다. 좌우만 있으면 «위쪽 두 귀퉁이»뿐이고
          //      아래 두 곳은 손으로 180° 돌려야 하는데, 돌리면 **✕ 도 같이 돌아** 스티커를 잡으려다 지워진다
          //      (창업자 *"돌려서 오른쪽에 붙이면 삭제버튼이 오른쪽위에오니까 자꾸 지워져"* — 돌리기 자체는 잘 된다).
          //   📌 좌우＋상하를 같이 켜면 180° 회전과 같은 그림이라 **네 귀퉁이가 다 나온다**(6컷 → 24가지).
          transform: `translate(-50%,-50%) rotate(${it.r || 0}deg)${it.flip ? ' scaleX(-1)' : ''}${it.flipY ? ' scaleY(-1)' : ''}`,
          touchAction: 'none',
          cursor: editable ? 'grab' : 'default',
          // 🎯🎯 **층은 늘 통과시키고 «아이템만» 손가락을 받는다** → 빈 자리는 언제나 글칸·축이 받는다
          //   ⛔ 전엔 `!editable` 일 때만 이걸 줬다. 그래서 **일꾸·레꾸 탭에선 층이 통째로 먹어**
          //      빈 종이를 눌러도 글칸에 안 닿았다 → 글을 고치려면 「글쓰기」 탭으로 옮겨야 했다.
          //   ⭐ 창업자 2026-08-07 *"속지든 글쓰기등 일꾸레꾸 **어디서든 글씨수정가능하게** 만들어줘. 이게가장 중요"*
          //      *"탭을 옮겨다니면서 수정해야하면 **안쓰게돼**"*
          //   📌 v9.89 에 「층은 통과·아이템만」을 이미 썼는데 **꾸미기 탭엔 안 적용했다** — 반쪽이었다.
          pointerEvents: 'auto',
          // 🔼 **고른 «사진»만 잠깐 위로.** 프레임에 끼운 사진은 일부러 프레임 «뒤»에 깔리는데,
          //    그러면 프레임 그림이 손잡이·지우기 단추를 덮어 눌리지 않는다(재현으로 확인).
          //    ⛔ 배열 순서는 안 건드린다 — 고르기를 풀면 도로 프레임 뒤로 간다.
          //    ⛔ 프레임·마테·포스트잇 같은 «밑판»엔 이걸 주지 않는다. 올리면 그 위에 꾸민
          //       작은 스티커가 통째로 숨는다(2026-07-26 창업자 제보로 고친 그 문제가 되살아난다).
          ...(on && it.type === 'photo' ? { zIndex: 3 } : null),
        }
        return (
          <div
            key={it.id}
            style={base}
            onPointerDown={onItemDown(it)}
            onPointerMove={onItemMove}
            onPointerUp={onItemUp}
            onPointerCancel={onItemUp}
          >
            {it.type === 'hl' ? (
              // 🖍 형광펜 — ⭐`multiply` 라 **밑에 있는 글자가 그대로 비친다**(덮는 게 아니라 칠하는 것).
              //   ⛔ 그림자를 넣지 않는다 — 형광펜은 종이에 «스민» 것이지 «얹은» 것이 아니다.
              //   ⭐ 끝을 조금씩 다르게 굴린다 — 자로 잰 네모가 아니라 손으로 그은 자국이라야 한다.
              // 🔖 `data-hl` = 검사가 «이것이 형광펜이다»를 정확히 짚는 표식.
              //    ⛔ 계산된 CSS(mixBlendMode)로 찾으면 속지의 「고른 표시」까지 같이 잡힌다(그것도 multiply 다).
              <div data-hl={it.key} style={{
                position: 'absolute', inset: 0,
                background: hlColor(it.key), opacity: it.o ?? 0.5, mixBlendMode: 'multiply',
                // 📐 가로 반지름은 «폭의 %», 세로는 «높이의 %» — 띠가 6:1 이라 가로를 크게 주면
                //    렌즈처럼 뾰족해진다. 끝만 살짝 굴리려면 가로 8% 안팎(≈ 높이의 절반)이라야 한다.
                borderRadius: '8% 10% 9% 7%/46% 54% 50% 50%',
              }} />
            ) : it.type === 'tape' ? (
              <div style={{ position: 'absolute', inset: 0, ...tapeStyle(it.key), boxShadow: '0 1px 3px rgba(70,60,45,.18)' }} />
            ) : it.type === 'note' ? (
              // 🎬✨ 포스트잇·글 상자에도 모션·효과 (창업자 폰 제보 2026-08-07 — 두 단추를 못 찾았다)
              //   ⚠️ 모션 클래스는 **감싼 span** 에 준다 — 바깥 상자에 주면 `rotate`·`scaleX` 가 덮여
              //      기울기와 뒤집기가 날아간다(v9.03 에서 이미 밟은 함정).
              <>
                <span className={motionClass(it.motion)} style={{ position: 'absolute', inset: 0 }}>
                  <Note it={it} editable={editable} typing={typingId === it.id} onText={onText} />
                </span>
                <StickerFx kind={it.fx} />
              </>
            ) : it.type === 'text' ? (
              // ✍️✨ **글자에도 모션·효과** (창업자 2026-08-07 *"글자에도 모션이나 효과가 들어가면 더 좋고"*)
              //   ⭐ 새로 만든 게 없다 — 모션은 `hk-m-*` CSS 클래스라 그림이든 글자든 똑같이 얹히고,
              //      효과는 위에 겹쳐 그리는 파티클이라 밑이 무엇이든 상관없다.
              //   ⚠️ 모션 클래스를 «감싼 span» 에 준다 — `TextDeco` 안 글자에 직접 주면
              //      글자 크기 계산(`coverW`)과 transform 이 섞인다.
              <>
                {/* ⛔⛔ **감싸는 것을 `position:absolute` 로 두면 안 된다** (창업자 폰 제보 2026-08-07 —
                    *"글자효과는 되는데 영역이 잘못표시됨, 효과가 글자 한개(제일 앞머리랑 겹치게 위에만 붙음)"*)
                    글자 아이템의 상자는 `width:'max-content'` = **자식이 폭을 정한다.**
                    그런데 자식을 전부 absolute 로 만들면 **폭을 정할 것이 사라져 상자가 쪼그라든다** →
                    점선 테두리·손잡이·효과가 전부 «맨 앞 한 글자» 자리에만 떴다.
                    ✅ 모션 span 은 **흐름 안(`display:inline-block`)** 에 둬서 글자가 폭을 정하게 하고,
                       효과(StickerFx)만 absolute 로 얹는다(그건 원래 absolute 라 폭에 안 낀다). */}
                <span className={motionClass(it.motion)} style={{ display: 'inline-block' }}>
                  <TextDeco it={it} editable={editable} coverW={coverW} typing={typingId === it.id} onText={onText} />
                </span>
                {/* ⬆️ lift = 효과를 «글자 위»에서 내보낸다 — 글자 상자는 납작해서 그냥 두면 글자 속에서 나온다
                    (창업자 2026-08-07 *"하트효과가 글자 윗부분부터 시작해야하지 않아?"*) */}
                <StickerFx kind={it.fx} lift />
              </>
            ) : it.type === 'photo' ? (
              // 📷 내 사진 — 종이 «종류와 상관없이» 붙는다 (창업자 2026-08-06
              //    *"무지나 도트도 사진 넣고싶을수있지않아? 그럼 어떻게 사진넣어?"*)
              //    ⭐ 틀의 사진칸은 「창에 끼우는 것」이고, 이건 「사진을 붙이는 것」이다 — 둘 다 있어야 한다.
              //    흰 테 ＋ 그림자 = 인화한 사진을 얹은 느낌(다꾸의 기본 문법).
              <>
                <span className={motionClass(it.motion)} style={{ position: 'absolute', inset: 0, borderRadius: '2%', overflow: 'hidden', background: '#fff', padding: '3.5%', boxShadow: '0 3px 7px rgba(60,50,35,.28)' }}>
                  <img src={it.src} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </span>
                <StickerFx kind={it.fx} />
              </>
            ) : (
              <span style={{ position: 'absolute', inset: 0, filter: 'drop-shadow(0 3px 4px rgba(60,50,35,.22))' }}>
                <StickerArt id={it.key} color={it.color} motion={it.motion} />
                {/* 🐻🐧 효과는 **친구들 탭 전부**에 붙는다 — 전엔 `gp_` 접두어만 봐서
                    여름 곰펭(`sm_`)·가을 곰펭(`au_b`)은 효과를 골라도 화면에 안 나왔다.
                    ⛔⛔ 2026-08-07 — `FRIEND_IDS` 로 좁힌 것 «자체»가 창업자 제보의 뿌리였다.
                       일기 서랍엔 **친구들 탭이 없다**(마테·데코·글자 셋뿐) → 일꾸에선 효과가 통째로 안 떴다.
                       ⭐ 효과는 위에 겹쳐 그리는 파티클이라 **밑이 무엇이든 상관없다** → 스티커 전부에 준다.
                       (`StickerFx` 는 `kind` 가 없거나 'none' 이면 `null` 이라 안 고른 스티커엔 아무것도 안 그린다) */}
                <StickerFx kind={it.fx} />
              </span>
            )}

            {on && (
              // 핸들 프레임 — 최소 58px(작은 스티커여도 핸들이 몸통 바깥에 놓이게). 프레임은 클릭 통과(pointerEvents none),
              // 핸들 버튼만 auto → 작은 별도 몸통 중앙은 그대로 드래그, 삭제/확대가 잘못 안 눌림.
              // ↔↕ 뒤집힌 아이템이면 «손잡이 판만» 다시 뒤집어 되돌린다 — 안 그러면
              //   지우기 단추가 왼쪽(또는 아래)으로 가고 ⟳ 아이콘이 거울이 된다(조작이 헷갈린다).
              //   ⚠️ 좌우·상하를 «둘 다» 되돌려야 한다 — 하나만 되돌리면 나머지 축에서 또 어긋난다.
              <div ref={frameRef} style={{ position: 'absolute', left: '50%', top: '50%', width: 'max(100%, 64px)', height: 'max(100%, 64px)', transform: `translate(-50%,-50%)${it.flip ? ' scaleX(-1)' : ''}${it.flipY ? ' scaleY(-1)' : ''}`, pointerEvents: 'none' }}>
                {/* 선택 테두리 */}
                <span style={{ position: 'absolute', inset: -6, border: '1.6px dashed rgba(255,255,255,.9)', borderRadius: 10, boxShadow: '0 0 0 1px rgba(0,0,0,.25)', pointerEvents: 'none' }} />
                {/* 삭제 */}
                <button
                  className="press"
                  aria-label="스티커 삭제"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onRemove?.(it.id) }}
                  style={{ position: 'absolute', ...hPos.x, width: 31, height: 31, borderRadius: '50%', background: '#3f382e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.3)', pointerEvents: 'auto' }}
                >
                  <Icon name="x" size={15} color="#fff" stroke={2.6} />
                </button>
                {/* 포스트잇·글자 수정 */}
                {(it.type === 'note' || it.type === 'text') && (
                  <button
                    className="press"
                    aria-label="글 수정"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onEditNote?.(it) }}
                    style={{ position: 'absolute', ...hPos.pen, width: 31, height: 31, borderRadius: '50%', background: 'var(--brown)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.3)', pointerEvents: 'auto' }}
                  >
                    <Icon name="pen" size={15} color="#fff" />
                  </button>
                )}
                {/* 크기·회전 핸들 */}
                <span
                  aria-label="크기·회전"
                  onPointerDown={onHandleDown(it)}
                  onPointerMove={onHandleMove}
                  onPointerUp={onHandleUp}
                  onPointerCancel={onHandleUp}
                  style={{ position: 'absolute', ...hPos.res, width: 38, height: 38, borderRadius: '50%', background: '#fff', border: '1.5px solid rgba(0,0,0,.15)', boxShadow: '0 2px 7px rgba(0,0,0,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none', cursor: 'nwse-resize', pointerEvents: 'auto' }}
                >
                  {/* ↻ **돌리기 화살표** (창업자 2026-08-07 *"스티커 돌리는 부분 아이콘 화살표로 바꿔줘
                      지금 꺼는 꼬챙이같고 뭔지 잘모르겠어"*)
                      ⛔ 옛 아이콘 = 호 ＋ 갈고리(`M4 12a8 8 0 0 0 8-8M12 4h4v4`) — **화살촉이 없어서**
                         「돌린다」로 안 읽혔다. 창업자 말대로 꼬챙이로 보인다.
                      ⭐ 이제 «거의 한 바퀴 도는 원» ＋ **채운 삼각 화살촉**. 19px 에서도 방향이 보인다. */}
                  <svg viewBox="0 0 20 20" width="19" height="19">
                    <path d="M10 4a6 6 0 1 1-4.9 2.6" fill="none" stroke="#5a5244" strokeWidth="2" strokeLinecap="round" />
                    <path d="M9.4 1.4 13.3 4 9.4 6.6z" fill="#5a5244" />
                  </svg>
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// 글자 크기 = it.s × 커버 폭(px). 길이와 무관하게 '한 글자 크기'가 일정 → 상자는 글자에 딱 맞음(max-content).
// 줄바꿈은 사용자가 엔터로 직접(자동 분할 안 함 — "돼지고기가지볶음"처럼 붙은 글자가 이상하게 안 잘리게).
function TextDeco({ it, editable, coverW = 0, typing, onText }) {
  const c = TEXT_COLORS.find((t) => t.key === it.color) || TEXT_COLORS[0]
  const f = TEXT_FONTS.find((t) => t.key === it.font) || TEXT_FONTS[0]
  const text = it.text || (editable ? '글자' : '')
  // it.s(사용자 조절)만으로 크기 결정 → 크기/회전 핸들 로직 그대로, 상자만 글자에 맞게 줄어듦.
  const cw = coverW || 320
  // 📏 「크기」 갈래(작게·보통·크게·아주 크게) — 글 상자와 «같은 배율표»를 쓴다.
  //   ⭐ 글자 스티커는 상자가 글자에 맞춰지므로 결과적으로 상자도 같이 커진다(그게 맞다).
  //   ⚠️ 손잡이(`it.s`)는 그대로 산다 — 갈래는 «누르면 되는 길»을 더한 것이지 대체가 아니다.
  const fontPx = Math.max(8, Math.min(220, it.s * 0.15 * cw * textSizeV(it.tz)))
  // ✒️ 굵기 = 외곽선 두께로 낸다(글씨체가 400 한 종류뿐이라 font-weight 로는 안 굵어진다).
  //    `paintOrder: stroke fill` 이라 선이 글자 뒤에 깔려 **획을 안 갉고 바깥으로만** 두꺼워진다.
  const wt = TEXT_WEIGHTS.find((t) => t.key === it.w) || TEXT_WEIGHTS[1]
  // 살(굵기) = 글자와 **같은 색**으로 두르기 → 진짜로 굵어 보인다. 글씨체별 원래 굵기로 보정.
  const fatPx = fontPx * wt.fat * (f.fw ?? 1)
  // 가독용 대비 테두리는 그림자로 따로 — 굵기를 바꿔도 이건 일정하게(글자만 굵어지게)
  const outPx = Math.max(0.8, fontPx * 0.028)
  return (
    <div
      style={{
        fontFamily: f.family,
        fontWeight: f.weight,
        fontSize: `${fontPx}px`,
        // 굵게 하면 글자끼리 닿는다 → 살이 붙는 만큼 자간도 벌린다(펜글씨가 특히 심했다)
        letterSpacing: `calc(${f.ls || '0em'} + ${(wt.fat * 1.6).toFixed(3)}em)`,
        lineHeight: 1.22,
        color: c.color,
        textAlign: 'center',
        whiteSpace: 'pre', // \n만 줄바꿈, 자동 줄바꿈 없음
        // 사진 위에서도 읽히게 반대 톤 외곽선 + 그림자
        WebkitTextStroke: fatPx > 0.2 ? `${fatPx}px ${c.color}` : undefined,
        paintOrder: 'stroke fill',
        // 사방 대비선(외곽선 역할) + 살짝 그림자 — 사진 위에서도 읽히게
        textShadow: [`${outPx}px 0 0 ${c.stroke}`, `-${outPx}px 0 0 ${c.stroke}`, `0 ${outPx}px 0 ${c.stroke}`, `0 -${outPx}px 0 ${c.stroke}`,
          `${outPx * 0.7}px ${outPx * 0.7}px 0 ${c.stroke}`, `-${outPx * 0.7}px ${outPx * 0.7}px 0 ${c.stroke}`,
          `${outPx * 0.7}px -${outPx * 0.7}px 0 ${c.stroke}`, `-${outPx * 0.7}px -${outPx * 0.7}px 0 ${c.stroke}`,
          '0 1px 3px rgba(0,0,0,.35)'].join(','),
        userSelect: 'none',
        ...(typing ? { visibility: 'hidden' } : null),
        // ⌨️ 치는 칸을 «이 상자 안»에 겹치려고 기준을 잡는다. 폭은 그대로 글자가 정한다.
        position: 'relative',
      }}
    >
      {text}
      {/* ⌨️⌨️ **글자 스티커도 그 자리에서 친다** (창업자 2026-08-07
          *"그럼 예전방식은 없어진거지? 따로창떠서 쓰고 붙이기하던거"* → 셋 다 없앴다)
          ⛔⛔ 여기 치는 칸을 «안 만들고» prop 만 넘겼다가 재현이 잡았다 —
             「글자 넣기」만 시트도 없고 칠 곳도 없는 상태가 될 뻔했다.
          ⭐ 겉 상자가 `width:max-content` 라 **폭은 글자가 정한다.** 글자를 `visibility:hidden` 으로
             두면 폭이 살아 있어서, 치는 칸이 그 폭을 그대로 쓴다(글자가 늘면 상자도 늘어난다).
          ⚠️ 외곽선·그림자는 치는 칸에 안 준다 — 커서까지 두꺼워져 지저분하다. */}
      {typing && (
        <textarea
          autoFocus
          data-boxtext="1"
          value={it.text || ''}
          onChange={(e) => onText?.(it.id, e.target.value)}
          style={{
            position: 'absolute', inset: 0, visibility: 'visible',
            resize: 'none', border: 'none', outline: 'none', background: 'transparent',
            padding: 0, margin: 0, overflow: 'hidden', WebkitAppearance: 'none',
            fontFamily: f.family, fontWeight: f.weight, fontSize: `${fontPx}px`,
            letterSpacing: `calc(${f.ls || '0em'} + ${(wt.fat * 1.6).toFixed(3)}em)`,
            lineHeight: 1.22, color: c.color, caretColor: c.color,
            // ⌨️⌨️ **세로 가운데 정렬** — 창업자 2026-08-09
            //    📮 *"스티커 붙이고 글쓰면 글자가 위에 붙거든? 다쓰고 움직이면 중간으로 내려와. 버그야 의도한거야?"*
            //    ⛔ 버그다. 「친 뒤」를 보여주는 겹은 `align-items: center` 인데 `textarea` 는 «위에서부터» 쌓인다.
            //       🔢 실측 — 짧은 글에서 **8px**, 두 줄 글에서 **4px** 튀었다.
            //    ⛔⛔ 바로 위 주석에 *"세로 가운데 정렬이 textarea 엔 없어서 `paddingTop` 으로 맞춘다"* 라고
            //       **적혀 있는데 코드엔 `padding: 0` 뿐이었다.** 주석이 「했다」고 하고 코드는 안 했다(규칙 18).
            //    ⭐ `align-content` 는 이제 블록 컨테이너에도 먹는다 — 한 줄로 끝난다.
            //       안 먹는 옛 브라우저에선 «지금까지와 똑같다»(위 정렬) — 더 나빠질 게 없다.
            alignContent: 'center',
            textAlign: 'center', textAlignLast: 'center', whiteSpace: 'pre',
          }}
        />
      )}
    </div>
  )
}

// ✍️✍️ 포스트잇·글 상자 글자 «외곽선 굵기» — 두 곳(Note·ArtBox)이 «같은 함수»를 쓴다.
//
// 📮 창업자 2026-08-31 = *"글씨 두께도 너무 얇아서 레꾸해놓으면 제목이 잘 안보여."*
//    → 실물 후보를 보고 *"5번은 뭉게져 보여."* → **④(0.105em)가 「굵게」 상한**
//    → *"글자는 다 저렇게 되게 해줘.."* → **기본을 「보통」으로 올린다**
//
// ⛔⛔ **기본이 「얇게」면 이 일을 한 값이 없다** — 유저가 굵기 갈래를 «찾아 눌러야» 굵어지는데,
//    창업자 불만은 *"레꾸해놓으면 안 보인다"* 였다. 안 누른 사람이 대부분이다.
//    ⚠️ 그래서 **이미 꾸며둔 레꾸의 글자도 같이 굵어진다.** 창업자가 「다 저렇게」라고 한 그대로다.
//       (글자 스티커도 기본이 `mid` 라 결이 맞는다 — 포스트잇만 예외였다)
//
// ⛔ 값은 `NOTE_FAT` 에 있다(글자 스티커가 쓰는 `TEXT_WEIGHTS` 와 «따로» — 그쪽을 건드리면
//    이미 만든 글자 스티커까지 얇아진다). 근거·실측은 그 상수 주석에.
// ⛔⛔ **글씨체마다 `fw` 를 곱한다 — 안 곱했다가 실물에서 «펜글씨·임팩트»가 뭉갰다.**
//    🔢 `fw` = 펜글씨 **0.5**(획 간격이 좁다) · 임팩트 **0.45**(원래 굵다) · 나머지 0.8~1.0
//    📌 `TEXT_FONTS` 주석에 이 함정이 **이미 적혀 있었다** —
//       *"펜글씨는 얇아서 bw 를 2로 줬는데 획이 서로 붙어 초록 덩어리가 됐다.
//         얇다고 살을 많이 붙이면 안 된다. 획 간격이 좁은 글씨는 오히려 «적게» 붙여야 한다."*
//    ⭐ 글자 스티커 쪽은 이미 `fatPx = fontPx * wt.fat * (f.fw ?? 1)` 로 곱하고 있었다.
//       **같은 파일 안에 답이 있었는데 안 따랐다.**
const noteStroke = (it, color) => {
  const f = TEXT_FONTS.find((t) => t.key === it.font) || TEXT_FONTS[0]
  const 손글씨 = it.font === 'gaegu' || it.font === 'nanumpen'
  const 두께 = ((손글씨 ? NOTE_HAND_FAT : 0) + (NOTE_FAT[it.w || 'mid'] ?? NOTE_FAT.mid)) * (f.fw ?? 1)
  if (!(두께 > 0)) return null
  return { WebkitTextStroke: `${두께.toFixed(3)}em ${color}`, paintOrder: 'stroke fill' }
}

function Note({ it, editable, typing, onText }) {
  const c = NOTE_COLORS.find((n) => n.key === it.key) || NOTE_COLORS[0]
  // 🏷 **글 상자** = 배경이 벡터 색판이 아니라 «우리 그림»인 포스트잇 (창업자 2026-08-07)
  //   *"포스트잇은 디자인이나 색상이 넘 별루라서.."* · *"우리 예쁜 라벨이나 글상자로 쓸 수 있는 스티커들 있지 않나?"*
  //   ⭐ 있었다 — 라벨지 `dlb` 12 · 찢은 종이 `dtp` 5 · 일기 메모지 `dgn` 12 · 메모라벨 `dc_dma` 10.
  //   ⭐ 새 타입을 안 만들었다. `art` 한 칸이면 글·크기·글씨체·이동·되돌리기가 그대로 따라온다.
  if (it.art) return <ArtBox it={it} editable={editable} typing={typing} onText={onText} />
  const shape = it.shape || 'fold'
  const pattern = it.pattern || 'plain'
  const pat = notePatternStyle(pattern, c.line || c.fold)
  const clip = noteClip(shape)
  const isClip = noteIsClip(shape)
  const radius = noteRadius(shape)
  // 플레이스홀더는 편집 중에만 — 저장된 표지에선 빈 포스트잇은 빈 종이로 보인다.
  const text = it.text || '' // 빈 포스트잇 = 글자 없이 노트만(안내문구 없이 그대로 빈 채로). 편집은 탭·연필로.
  // 글씨체 — 글자 도구와 같은 목록에서 고른다(컨텍스트 바). 없으면 귀염체가 기본.
  const nf = TEXT_FONTS.find((t) => t.key === it.font) || TEXT_FONTS[0]

  // 종이 판(색 + 무늬 + 모양). clip 모양은 그림자를 filter 로(clip 이 box-shadow 를 잘라내므로).
  const paper = {
    position: 'absolute', inset: 0, background: c.bg, overflow: 'hidden',
    ...(isClip
      ? { clipPath: clip, WebkitClipPath: clip, filter: 'drop-shadow(1.5px 3px 5px rgba(70,60,45,.3))' }
      : { borderRadius: radius, boxShadow: '1.5px 4px 10px rgba(70,60,45,.25)' }),
  }
  // 하트·별·곰 등은 글자가 실루엣 밖으로 안 나가게 안쪽 여백을 넉넉히.
  const textPad = isClip ? '22% 18%' : '9% 10%'
  // 📐 글 길이에 맞춰 저절로 줄어든다 (위 `autoCqw` 주석 참고)
  //   ⚠️ CSS 의 `padding: %` 는 **위아래도 «폭» 기준**이다 — 높이 기준으로 계산하면 세로가 어긋난다.
  //   ⚠️ 포스트잇 상자 비율은 1.06 이라 «폭 대비 높이» = 100/1.06.
  const pp = isClip ? [22, 18] : [9, 10]   // [위아래, 좌우] %
  // 📏 **상자는 그대로 · 글자만** 커진다 (창업자 2026-08-12 *"스티커는 그대로고 글자크기만 커져야지"*)
  //   ⭐ 배율을 「글자가 커질 수 있는 «한도»」에 건다 — `autoCqw` 가 «넘치지 않는 가장 큰 값»을 찾으므로
  //      짧은 글은 한도까지 커지고, 긴 글은 그 안에서 알아서 줄어든다. **잘림이 안 생긴다.**
  //   ⛔ 결과값에 곱하면 안 된다 — 그건 이미 «딱 맞는 최대»라 곱하는 순간 무조건 넘친다(앞 판의 실수).
  // 📏 **「보통」 크기를 먼저 구하고, 거기에 배율을 «곱한다».**
  //   ⛔⛔ 앞 판은 배율을 «한도»(max)에 넣었다 — 창업자가 정확히 잡았다:
  //      *"보통보다 크게가 살짝 더 작아져"* . autoCqw 는 0.25 씩 내려가며 맞는 값을 찾는데
  //      **시작점이 바뀌면 «다른 계단»에 걸려** 큰 한도에서 내려온 값이 오히려 더 작아질 수 있다.
  //      (한 줄에 들어갈 글자 수 per = floor(폭/r) 이 계단식으로 뚝뚝 떨어져서다)
  //   ⭐ 그래서 계산은 «보통»으로 한 번만 하고 결과에 배율을 곱한다 — 순서가 뒤집힐 수 없다.
  //   ⭐ 넘치면 «안 자른다»(아래 overflow) — 창업자가 싫다 한 건 「잘림」이지 「넘침」이 아니다.
  const noteCqw = autoCqw(text, 14, 100 - pp[1] * 2, 100 / 1.06 - pp[0] * 2, 1.4) * textSizeV(it.tz)

  return (
    <div style={{ position: 'absolute', inset: 0, containerType: 'size', color: c.text }}>
      {/* 종이 + 무늬 */}
      <div style={paper}>
        {pat && <span style={{ position: 'absolute', inset: 0, ...pat }} />}
        {shape === 'fold' && (
          <span style={{ position: 'absolute', right: 0, bottom: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: '0 0 16cqw 16cqw', borderColor: `transparent transparent ${c.fold} transparent` }} />
        )}
      </div>

      {/* 글자 (마스크 밖 — 실루엣 위에 얹힘) */}
      <div
        style={{
          position: 'absolute', inset: 0, boxSizing: 'border-box', padding: textPad,
          // 포스트잇 글자 = 웜브라운 본연의 부드러움(밝은 종이라 외곽선 없어도 잘 읽힘).
          // 단, 얇은 손글씨(귀염체·펜글씨)만 동색 얇은 외곽선(0.4px)으로 살짝 두껍게(창업자 요청). 색은 그대로.
          fontFamily: nf.family, fontWeight: nf.weight, letterSpacing: nf.ls || 'normal',
          // ✍️ 굵기 — 그림 글 상자(ArtBox)와 «같은 함수»를 쓴다. 두 곳이 갈리면 하나가 낡는다.
          ...(noteStroke(it, c.text) || {}),
          // 📏 **14cqw** — 「여섯 자가 한 줄에 들어가게」 (창업자 2026-08-07 *"예쁜크기 네가 정해줘"*)
          //   ⭐ 눈대중이 아니라 **글씨체 열둘 전부로 재서** 골랐다(scripts/_measure-포스트잇글씨-0807.mjs).
          //      15cqw = 귀염체·몽글체·또박체가 「오늘 김치찌개」에서 쪼개진다 · 14.5 = 또박체만 쪼개짐
          //      **14 = 열둘 전부 한 줄** ← 여기가 「한 줄이 되는 가장 큰 값」이라 제일 안 작아 보인다.
          //   ⛔ 더 낮추지 말 것 — 14 에서 이미 요구가 충족돼 그 아래는 글씨만 작아진다.
          // ⬆️ 72 → 200 (창업자 2026-08-31 *"포스잇 키워도 글자크기는 변함이 없어"* · 위 ArtBox 주석에 실측)
          fontSize: `clamp(6px, ${noteCqw}cqw, 200px)`, lineHeight: 1.4,
          // ⭐ 「크게」 이상이면 «안 자른다» — 창업자가 싫다 한 건 「잘림」이고, 넘치는 건 다 보인다.
          overflow: textSizeV(it.tz) > 1 ? 'visible' : 'hidden', whiteSpace: 'pre-wrap', wordBreak: 'keep-all', overflowWrap: 'break-word',
          // ⌨️ `safe` — 글이 칸보다 커지면 치는 칸과 같은 「위 정렬」이 되어 글자가 안 튄다(위 ArtBox 주석 참조)
          display: 'flex', alignItems: 'safe center', justifyContent: 'safe center', textAlign: 'center',
          ...(typing ? { visibility: 'hidden' } : null),
        }}
      >
        {text}
      </div>
      {/* ⌨️ 포스트잇도 «그 자리에서» 친다 — 글 상자와 같은 방식 */}
      {typing && (
        <textarea
          autoFocus
          data-boxtext="1"
          value={text}
          onChange={(e) => onText?.(it.id, e.target.value)}
          style={{
            position: 'absolute', inset: 0, boxSizing: 'border-box', padding: textPad,
            resize: 'none', border: 'none', outline: 'none', background: 'transparent',
            margin: 0, overflow: 'hidden', color: c.text, caretColor: c.text, WebkitAppearance: 'none',
            fontFamily: nf.family, fontWeight: nf.weight, letterSpacing: nf.ls || 'normal',
            fontSize: `clamp(6px, ${noteCqw}cqw, 72px)`, lineHeight: 1.4,   // ⚠️ 위 글자 칸과 «같은 값»이어야 치는 중과 친 뒤가 안 튄다
            whiteSpace: 'pre-wrap', wordBreak: 'keep-all', overflowWrap: 'break-word',
            // ⌨️ 세로 가운데 정렬 — 보이는 겹(`align-items:center`)과 자리를 맞춘다(위 TextDeco 주석 참조)
            alignContent: 'center',
            textAlign: 'center', textAlignLast: 'center',
          }}
        />
      )}

      {/* 테이프 — 위쪽 가운데 반투명 마스킹테이프 */}
      {shape === 'tape' && (
        <span style={{ position: 'absolute', top: '-6cqw', left: '50%', width: '46%', height: '15cqw', transform: 'translateX(-50%) rotate(-3deg)', background: 'rgba(255,255,255,.5)', border: '0.5px solid rgba(120,110,90,.18)', boxShadow: '0 1px 3px rgba(70,60,45,.14)' }} />
      )}
      {/* 핀 — 위쪽 가운데 압정 */}
      {shape === 'pin' && (
        <span style={{ position: 'absolute', top: '-7cqw', left: '50%', width: '15cqw', height: '15cqw', transform: 'translateX(-50%)', borderRadius: '50%', background: 'radial-gradient(circle at 38% 34%, #e08a7a, #c4614f)', boxShadow: '0 1.5px 3px rgba(60,30,25,.35)' }}>
          <span style={{ position: 'absolute', top: '22%', left: '26%', width: '26%', height: '26%', borderRadius: '50%', background: 'rgba(255,255,255,.65)' }} />
        </span>
      )}
    </div>
  )
}

// 🏷🏷 **글 상자** — 우리 라벨지·메모지 그림 위에 글이 얹힌다 (2026-08-07)
//   창업자 *"글자올릴수있는 스티커들을 다같이 배치해서 쓰자. 포스트잇이랑 여러가지 라벨들."*
//
//   ⭐ 왜 포스트잇(`note`)에 얹었나 = **글·크기·글씨체·이동·되돌리기가 이미 다 된다.**
//      새 타입을 만들면 그 넷을 전부 다시 만들어야 하고, 저장된 표지도 못 읽는다.
//   ⭐ 그림은 `StickerArt` 를 그대로 쓴다 — 새 로더를 안 만든다.
//
//   📐 안쪽 여백은 `BOX_PAD` 에서 온다 — 그림마다 테두리·장식 자리가 달라 하나로 못 준다.
//      `tools/measure-inner.py` 로 **재서** 뽑았고(그 도구를 네 번 고쳤다), 구석 장식 넷은 눈으로 잡았다.
//      ⚠️ 값이 없는 그림은 **12% 한 바퀴**로 둔다 — 없다고 안 그리면 새 라벨을 넣을 때마다 깨진다.
//
//   ⛔ 글자색은 `it.tc`(고른 색)가 있으면 그것, 없으면 **진갈색**이다.
//      라벨 바탕이 크라프트·주황·파랑까지 있어 «흰 글자»를 기본으로 두면 안 읽히는 컷이 생긴다.
// 📐📐 **글이 길면 글씨를 저절로 줄인다** (창업자 2026-08-07 *"긴글이 잘리는 건 자동으로 줄여야 할 것 같아"*)
//   ⛔ 왜 필요했나 = 재현(`_repro-긴글-0807`)으로 확인 — 넉 줄짜리 글이 **열한 줄로 늘어나 63px 넘쳐 잘렸다.**
//      ⭐ **엔터는 멀쩡히 먹고 있었다.** 「엔터가 안 된다」로 보인 것도 사실은 이 잘림이었다 —
//         줄이 늘면 상자 밖으로 밀려 안 보이니 「줄이 안 바뀐다」로 읽힌다. 원인이 하나였다.
//   ⭐ **재지 않고 «계산»한다.** 그려 보고 재서 다시 그리면 ⑴한 프레임 깜빡이고
//      ⑵캡처(`html-to-image`)가 조정 «전» 상태를 찍을 수 있다. 계산은 언제나 같은 값이다.
//   📏 바탕이 되는 실측 = `scripts/_measure-포스트잇글씨-0807.mjs` — **14cqw 에서 한글 여섯 자가 딱 한 줄.**
//      → 한 줄에 들어가는 글자 수 ≈ (가로 여백 뺀 %) ÷ cqw.  (cqw = 상자 «폭»의 1%)
//   ⚠️ 세로도 «폭 기준»으로 환산해야 맞다 — cqw 가 폭이라서. 그래서 `hPct` 는 폭 대비 높이다.
//   ⚠️ 한글 한 자 ≈ 1em 으로 본다. 영문·숫자는 좁아 더 들어가니 «넉넉한» 쪽으로 틀린다(안전).
//   ⛔⛔ **`Math.max(1, …)` 하나가 「글씨가 상자를 넘는」 뿌리였다** (창업자 2026-08-09
//      📮 *"스티커 붙이고 글쓰면 글자가 위에 붙거든? 다쓰고 움직이면 중간으로 내려와."*)
//      세로로 들어갈 줄 수를 `max(1, …)` 로 감싸서 **한 줄도 안 들어가는 얕은 상자도 「한 줄은 된다」**로 쳤다.
//      🔢 실측(라벨지) — 글칸 높이 **20px 에 글 덩어리 35px**. 넘치니까 「친 뒤」 겹은 위아래로 똑같이 밀어내고
//      「치는 중」 `textarea` 는 위에서부터 쌓여 **8px 어긋났다.** 창업자가 본 「튐」의 정체가 이것이다.
//   ✅ 한 줄도 안 들어가면 «넘어가지 말고 더 줄인다». 바닥도 5 → 2 로 내린다(그 아래는 `clamp(6px…)` 가 지킨다).
//   ⚠️ 잘 되던 상자(줄이 하나라도 들어가는 경우)는 값이 «하나도 안 바뀐다» — `cap ≥ 1` 이면 예전 식과 같다.
// 📐 `room` = 세로를 얼마나 봐줄까(1 = 딱 맞게 · 1.25 = 25% 넘쳐도 됨)
//   ⭐ 「크기」 갈래로 글자를 키울 때 쓴다 — **납작한 상자**(라벨지·배너)는 세로 여유가 거의 없어서
//      딱 맞게만 재면 아무리 한도를 올려도 «한 줄도 안 들어간다»며 도로 작아진다.
//      실측 = 「아주 크게」를 눌러도 14.9 → 15.0px(0.1px). 창업자가 두 번 말한 그 자리다.
//   ⛔ 넘침은 «잘림»이 아니다 — 글 상자는 `overflow` 를 안 잘라서 살짝 나가도 글자는 다 보인다.
//   ⛔ 「보통」일 땐 room = 1 이라 **값이 한 톨도 안 바뀐다**(이미 쓴 일기가 안 흔들린다).
function autoCqw(text, max, wPct, hPct, lh, room = 1) {
  const lines = String(text || '').split('\n')
  for (let r = max; r > 2; r -= 0.25) {
    const per = Math.max(1, Math.floor(wPct / r))    // 한 줄에 들어갈 글자 수
    const cap = Math.floor((hPct * room) / (lh * r)) // 세로로 들어갈 줄 수 — 0 이면 한 줄도 못 들어간다
    if (cap < 1) continue
    const need = lines.reduce((s, l) => s + Math.max(1, Math.ceil(l.length / per)), 0)
    if (need <= cap) return r
  }
  return 2
}

function ArtBox({ it, editable, typing, onText }) {
  const pad = BOX_PAD[it.art] || [12, 12, 12, 12]
  const nf = TEXT_FONTS.find((t) => t.key === it.font) || TEXT_FONTS[0]
  const ink = it.tc || '#4a4038'
  const text = it.text || ''
  // ⌨️ 치는 칸과 보이는 글자는 **같은 글꼴·크기·정렬·여백**이라야 자리가 안 튄다
  const inner = {
    position: 'absolute',
    top: `${pad[0]}%`, right: `${pad[1]}%`, bottom: `${pad[2]}%`, left: `${pad[3]}%`,
    boxSizing: 'border-box', color: ink,
    fontFamily: nf.family, fontWeight: nf.weight, letterSpacing: nf.ls || 'normal',
    // 📐 글 길이에 맞춰 저절로 줄어든다 — 상자 «폭» 대비 가로 여백·세로 여백을 그대로 넘긴다
    // 📏📏 **그림은 그대로 · 글자만** 「크기」 갈래로 (창업자 2026-08-12
    //   *"글에 비해 글자상자가 너무 작아(스티커-돌밥돌밥쓴거) 스티커를 줄이면 글자가 너무 작아져"*)
    //   ⛔⛔ 처음엔 `Note` 쪽만 고치고 여기를 빠뜨려 **재현이 「글자가 안 커졌다」로 잡았다.**
    //      창업자가 쓴 말풍선은 `it.art` 가 있어 **`ArtBox`(여기)** 로 온다 — 두 함수를 «같이» 고쳐야 한다.
    // 📏 배율은 「커질 수 있는 한도」에 건다 — 그림(상자)은 그대로, 글자만 커진다.
    // ⛔⛔ **상한이 64px 이라 큰 종이에서 「크게」와 「아주 크게」가 «같아졌다»** (창업자 2026-08-31)
    //   📮 *"포스잇 키워도 글자크기는 변함이 없어. 이게 너무 불편하거든."*
    //   🔢 실측(`scripts/_probe-글자크기-0831.mjs`) — 종이 420px 에서
    //      크게 64.0px · 아주 크게 64.0px → **둘 다 상한에 걸려 갈래를 눌러도 아무 일이 안 난다.**
    //      (종이 300px 까지는 49.9 / 62.4 로 제대로 갈린다)
    //   ⚠️ 옛 값의 «이유»가 주석 어디에도 없었다 — 안전장치로 둔 값으로 보인다.
    //   ✅ 200px 로 올린다. 글자는 `cqw`(종이 폭 대비)라 종이 밖으로 나갈 수 없고,
    //      패드에서 종이를 가득(800px) 키워도 아주 크게가 166px 이라 안 걸린다.
    fontSize: `clamp(6px, ${autoCqw(text, 13, 100 - pad[1] - pad[3], (100 - pad[0] - pad[2]) / (stickerRatio(it.art) || 1), 1.35) * textSizeV(it.tz)}cqw, 200px)`,
    lineHeight: 1.35,
    whiteSpace: 'pre-wrap', wordBreak: 'keep-all', overflowWrap: 'break-word',
    textAlign: 'center',
  }
  return (
    <div style={{ position: 'absolute', inset: 0, containerType: 'size' }}>
      {/* 종이 = 우리 그림. ⛔ 그림자를 box-shadow 로 주면 «네모»가 생긴다(라벨은 네모가 아니다) → drop-shadow */}
      <span style={{ position: 'absolute', inset: 0, filter: 'drop-shadow(1.5px 3px 5px rgba(70,60,45,.28))' }}>
        <StickerArt id={it.art} motion={null} />
      </span>
      {/* 글자 — 잰 여백 «안»에만. 그림 위라 층을 안 줘도 나중에 칠해진다 */}
      <div
        style={{
          // ⭐ 「크게」 이상이면 «안 자른다»(위 Note 와 같은 규칙)
          ...inner, overflow: textSizeV(it.tz) > 1 ? 'visible' : 'hidden',
          // 얇은 손글씨만 동색 얇은 외곽선 — 포스트잇과 같은 규칙(창업자 요청)
          // ✍️ 굵기 (창업자 2026-08-31) — 값과 근거는 `Stickers.jsx` 의 `NOTE_FAT` 주석에
          ...(noteStroke(it, ink) || {}),
          // ⌨️ `safe` 가 핵심 — **글이 칸보다 크면** 그냥 `center` 는 위아래로 똑같이 밀어내는데
          //    치는 칸(`textarea`)은 «위에서부터» 쌓인다 → 다 치고 커서를 빼는 순간 글자가 툭 내려앉는다.
          //    🔢 실측(라벨지 · 칸 20px 에 글 35px) — **8px 튀었다.** `safe` 면 넘칠 때 둘 다 위 정렬이라 0px.
          //    ⚠️ 안 넘칠 땐 지금처럼 가운데 그대로다(포스트잇 실측 0px 유지).
          display: 'flex', alignItems: 'safe center', justifyContent: 'safe center',
          // ⌨️ 치는 동안은 «치는 칸»이 글자를 보여준다 — 두 겹으로 보이면 안 된다
          ...(typing ? { visibility: 'hidden' } : null),
        }}
      >
        {text}
      </div>
      {/* ⌨️⌨️ **그 자리에서 바로 친다** — 시트가 안 열린다 (창업자 2026-08-07)
          ⭐ `textarea` 를 쓴다(contentEditable ❌) — React 가 값을 내려보내도 **커서가 안 튄다.**
          ⚠️ 세로 가운데 정렬이 textarea 엔 없어서 `paddingTop` 으로 맞춘다 —
             안 맞추면 글이 «위로 뛰어» 치는 중과 친 뒤가 어긋난다. */}
      {typing && (
        <textarea
          autoFocus
          // 🏷 표식 — 이 칸이 «글 상자의 것»임을 표시한다.
          //   ⛔ 무지 속지에도 글칸(textarea)이 있어서 "판 안의 textarea" 만으로는 둘이 안 갈린다.
          //      재현이 이걸로 세 번 거짓 실패했다(글이 속지에 들어가고, 커서를 딴 칸에서 찾았다).
          //   ⭐ 캡처할 때 빼기도 쉬워진다.
          data-boxtext="1"
          value={text}
          onChange={(e) => onText?.(it.id, e.target.value)}
          style={{
            ...inner, resize: 'none', border: 'none', outline: 'none', background: 'transparent',
            padding: 0, margin: 0, overflow: 'hidden', caretColor: ink, WebkitAppearance: 'none',
            // ⌨️ 세로 가운데 정렬 — 보이는 겹(`align-items:center`)과 자리를 맞춘다(위 TextDeco 주석 참조)
            display: 'block', alignContent: 'center', textAlignLast: 'center',
          }}
        />
      )}
    </div>
  )
}
