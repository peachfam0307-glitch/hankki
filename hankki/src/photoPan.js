// 📐📐 사진 「끌어서 옮기기 ＋ 두 손가락 확대」 — **규칙을 한 곳에만 둔다.**
//
// ⭐⭐ 왜 갈라 냈나 (2026-08-17) — 창업자가 표지 사진에도 *"확대 축소도 가능하게 해줘"* 라고 했다.
//    이 손짓은 **일기 속지 사진**(`PaperSheet`)에 이미 있었고, 거기서 사고를 여럿 잡으며 다듬은 코드다:
//      · 배율을 걸면 끌리는 양이 달라진다(`overX` 에 `z` 를 곱한다)
//      · `transformOrigin` 을 `objectPosition` 과 «같은 값»으로 안 주면 확대할 때 사진이 옆으로 튄다
//      · 1 밑으로 줄이면 사진이 «왼쪽 벽에 붙던» 것 → 그땐 가운데 고정
//      · 두 손가락 뒤엔 click 이 «안 와서» 표시가 안 지워지고 다음 한 번을 잡아먹던 것 → 시각으로 둔다
//      · 둘 중 하나만 떼면 기준을 다시 잡아야 «툭» 안 튄다
//    ⛔ 이걸 표지에 «복사»하면 한쪽을 고칠 때 다른 쪽이 낡는다. 오늘까지 우리가 제일 자주 낸 사고가 그것이다.
//    ⚠️ 그래서 «옮겨서» 양쪽이 부르게 했다 — 흉내가 아니라 같은 코드다.
//
// ⛔ 여기에 화면(JSX)을 넣지 않는다. 이 파일은 «계산과 손짓»만 안다.

export const PHOTO_ZOOM_MAX = 3
// 🔍 1 밑 = 「사진 전체가 보이게」(창업자 확정 2026-08-12) — `cover` 가 잘라내던 위아래가 다 들어온다.
export const PHOTO_ZOOM_MIN = 0.5

export const clampZoom = (raw) => {
  const n = Number(raw)
  return Math.min(PHOTO_ZOOM_MAX, Math.max(PHOTO_ZOOM_MIN, Number.isFinite(n) && n > 0 ? n : 1))
}

// 🖼 사진에 얹을 스타일 — 자리(`pos`)와 배율(`zoom`)을 화면에 옮긴다.
//   ⚠️ 1 밑에선 **가운데 고정**이라야 한다. 저장값(`pos`)은 안 건드리므로 다시 키우면 끌어둔 자리가 돌아온다.
export const photoImgStyle = (pos = '50% 50%', zoom = 1) => {
  const z = clampZoom(zoom)
  const 전체보기 = z < 1
  const posEff = 전체보기 ? '50% 50%' : (pos || '50% 50%')
  return {
    width: '100%', height: '100%', display: 'block',
    objectFit: 전체보기 ? 'contain' : 'cover',
    objectPosition: posEff,
    ...(z !== 1 ? { transform: `scale(${z})`, transformOrigin: posEff } : null),
  }
}

// 🫳🤏 손가락 «하나»면 끌기, «둘»이면 확대.
//   ⚠️ 상태는 **DOM 노드에 얹는다**(`el._ph`) — 렌더마다 새로 만들어지는 함수의 클로저에 담으면 손짓 중에 끊긴다.
//   ⭐ `onCommit({ pos, zoom })` 은 **손을 다 뗀 뒤 한 번만** 부른다(끄는 동안 저장하면 매 프레임 localStorage 를 쓴다).
export const photoPanStart = (e, { pos = '50% 50%', zoom = 1, onCommit } = {}) => {
  const el = e.currentTarget
  const img = el.querySelector('img')
  if (!img || !img.naturalWidth) return
  const S = el._ph || (el._ph = { pts: new Map() })
  S.pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
  const 두점 = () => {
    const p = [...S.pts.values()]
    return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y)
  }
  const 그리기 = () => {
    // ⭐ 1 밑(전체 보기)이면 «가운데 고정» — `photoImgStyle` 과 같은 규칙이라야 손 뗄 때 안 튄다.
    //    ⛔ 여기만 빼먹으면 오므리는 «동안»은 왼쪽에 붙었다가 손 떼면 가운데로 툭 뛴다.
    const 작다 = S.cur.z < 1
    const px = 작다 ? 50 : S.cur.x, py = 작다 ? 50 : S.cur.y
    img.style.objectFit = 작다 ? 'contain' : 'cover'
    img.style.objectPosition = `${px}% ${py}%`
    img.style.transformOrigin = `${px}% ${py}%`
    img.style.transform = `scale(${S.cur.z})` // 끄는 동안은 화면만 — 저장은 손 다 뗄 때 한 번
  }
  if (S.pts.size === 1) {
    const rect = el.getBoundingClientRect()
    S.fit = Math.max(rect.width / img.naturalWidth, rect.height / img.naturalHeight)
    S.W = rect.width; S.H = rect.height
    const [px0, py0] = String(pos).split(' ').map((v) => parseFloat(v))
    S.cur = { x: Number.isFinite(px0) ? px0 : 50, y: Number.isFinite(py0) ? py0 : 50, z: clampZoom(zoom) }
    S.from = { ...S.cur }
    S.start = { x: e.clientX, y: e.clientY }
    S.moved = false
  }
  if (S.pts.size === 2) {
    // ⛔ 여기서 «끊는다» — 안 그러면 바깥의 두 손가락(꾸미기 판 확대)까지 같이 걸려 한꺼번에 커진다.
    //    손가락이 하나일 땐 그대로 흘려보낸다(바깥의 다른 손짓이 살아 있게).
    e.stopPropagation()
    S.d0 = 두점() || 1
    S.z0 = S.cur.z
    S.from = { ...S.cur }
    S.moved = true
  }
  if (S.on) return
  S.on = true
  const onMove = (ev) => {
    if (!S.pts.has(ev.pointerId)) return
    S.pts.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })
    if (S.pts.size >= 2) {
      S.cur.z = clampZoom(S.z0 * (두점() / S.d0))
      그리기()
      return
    }
    const dx = ev.clientX - S.start.x, dy = ev.clientY - S.start.y
    // 📌 «탭»과 갈라야 한다 → 6px 넘게 움직였을 때만 끌기로 친다.
    if (!S.moved && Math.hypot(dx, dy) < 6) return
    if (!S.moved) { S.moved = true; el.setPointerCapture?.(ev.pointerId) }
    // 📐 이동량 → % 환산: `cover` 는 사진을 칸보다 크게 그리므로 «넘치는 만큼»만 움직인다. 배율을 걸면 그만큼 더 넘친다.
    //    손가락을 아래로 끌면 사진이 아래로 따라와야 하니 `objectPosition` % 는 «줄어든다»(반대 부호).
    const overX = img.naturalWidth * S.fit * S.cur.z - S.W
    const overY = img.naturalHeight * S.fit * S.cur.z - S.H
    S.cur.x = overX > 0 ? Math.min(100, Math.max(0, S.from.x - (dx / overX) * 100)) : S.from.x
    S.cur.y = overY > 0 ? Math.min(100, Math.max(0, S.from.y - (dy / overY) * 100)) : S.from.y
    그리기()
  }
  const onUp = (ev) => {
    S.pts.delete(ev.pointerId)
    // ✋ 둘 중 하나만 뗐다 — 남은 손가락으로 «이어서 끌» 수 있게 기준을 다시 잡는다
    //    (안 잡으면 첫 손가락 자리를 기준으로 계산해 사진이 «툭» 튄다)
    if (S.pts.size === 1) {
      const [p] = [...S.pts.values()]
      S.start = { x: p.x, y: p.y }
      S.from = { ...S.cur }
      return
    }
    if (S.pts.size > 0) return
    el.removeEventListener('pointermove', onMove)
    el.removeEventListener('pointerup', onUp)
    el.removeEventListener('pointercancel', onUp)
    S.on = false
    if (!S.moved) return
    onCommit?.({
      pos: `${Math.round(S.cur.x)}% ${Math.round(S.cur.y)}%`,
      zoom: Math.round(S.cur.z * 100) / 100,
    })
    // ⏱ 손짓 «끝난 시각»을 적어 둔다 — 바로 뒤따라오는 click(탭 동작)을 삼키려고.
    //   ⛔⛔ 전엔 그냥 `'1'` 을 박고 click 핸들러가 지웠는데, **두 손가락 뒤엔 click 이 «안 온다».**
    //      그러면 표시가 안 지워진 채 남아서 **다음에 진짜로 누른 한 번을 잡아먹는다.**
    //   ⭐ 시각으로 두면 click 이 오든 안 오든 0.5초 뒤엔 저절로 풀린다.
    el.dataset.dragged = String(Date.now())
  }
  el.addEventListener('pointermove', onMove)
  el.addEventListener('pointerup', onUp)
  el.addEventListener('pointercancel', onUp)
}

// ⏱ 방금 끌었나 — 끌기 뒤에 따라오는 click 을 삼킬 때 쓴다(0.5초).
export const justDragged = (el) => {
  const t = Number(el?.dataset?.dragged || 0)
  return t > 0 && Date.now() - t < 500
}
