import Icon from './Icon'
import { TEXT_FONTS } from './Stickers'
import { PAPER_LINE_H } from '../data/papers'

// 📝📝 종이 «위»에 바로 쓴다.
//
// ⛔⛔ 2026-08-06 에 클로드가 **종이 밖에 입력칸을 두고 종이엔 반영만** 되게 만들었다.
//    창업자 *"줄 노트에 저렇게 쓰게 하면 불편해서 안써. 줄노트 자체에 바로 써지게 해야지."*
//    **맞는 말이다.** 다이어리인데 종이가 아니라 폼에 쓰는 건 다이어리가 아니다.
//
// ⭐ 그래서 여기 있는 건 «투명한 글상자»다 — 배경도 테두리도 없고, 종이의 줄 위에 바로 얹힌다.
//    글씨체는 손글씨(귀염체), 줄 간격은 `PAPER_LINE_H` 하나로 CSS 줄과 «묶여» 있다.
//
// 📐 단위가 왜 `cqw` 인가 — 이 판은 세 군데에서 크기가 다르다(다이어리 320 · 꾸미기 328 · 나중 캡처 1080).
//    px 로 박으면 판이 커질 때 **글씨만 혼자 작아지고 줄에서 어긋난다.**
//    `cqw` 는 «종이 폭 기준»이라 어디서든 같은 비율이다. (여름 물결 배경이 세로 %를 못 써서
//    안 움직이던 그 함정의 반대 경우다 — 여기선 반드시 상대값이라야 한다)
//    ⚠️ 컨테이너는 **종이 자신이 아니라 바깥 자**다. 제 폭은 제가 못 잰다 → `PaperBox` 가 감싼다.

// ✍️✍️ **본문 글씨체는 «고를 수 있다»** (창업자 2026-08-07
//   *"글쓰기할때 글자선택하는게 있었음 좋겠어. 글자가일꾸에 있어서 불편"*
//    → *"내 말은 «글쓰기 글자체»도 추가했으면 좋겠다는 뜻이었는데 스티커 글자체만 추가 되었단 뜻."*)
//   ⛔ 오늘 넣은 글씨체 열둘은 **글자 «스티커»에만** 붙었다. 종이에 바로 쓰는 본문은
//      여기 상수 하나로 «귀염체 고정»이었다 — 일기의 주인공인 글이 정작 못 고르는 상태.
//   ⭐ `TEXT_FONTS` 를 그대로 쓴다 — 목록이 하나라 스티커와 본문이 «같은 글씨체»로 맞는다.
//   ⚠️ 못 받으면 예전 그대로(귀염체) — 이미 쓴 일기가 안 바뀐다.
const HAND = "'Gaegu','Gowun Dodum','Pretendard',sans-serif"
const INK = '#5b4436' // 우리 진갈색 — 속지 선(#e2d8c6)보다 진해 크라프트 위에서도 읽힌다

// 🔍 사진칸 확대 상한·하한·손짓은 **`src/photoPan.js` 한 곳**에 있다 (2026-08-17 에 옮겼다).
//    ⭐ 레시피 표지 사진도 «같은 손짓»이라야 해서 갈라 냈다 — 복사하면 한쪽이 반드시 낡는다.
//    (상한 3 = 폰 사진이라도 그 위로 가면 뭉갠다 · 하한 0.5 = 1 밑은 「전체 보기」)
import { clampZoom, photoImgStyle, photoPanStart } from '../photoPan'
// 🖼 사진칸 값이 「큰 창고」 쪽지(`idb://…`)일 수 있다 — `photoView.jsx` 가 꺼내서 그린다
import StoredImg from '../photoView'

// 줄·모눈·도트를 «쓰는 칸 안에만» 그릴 때 쓰는 배경. `.paper.lined` 등과 같은 그림이다.
const ruleBg = (cls) => {
  const g = 'var(--rule-gap)'
  if (cls === 'lined') return `repeating-linear-gradient(to bottom, transparent 0, transparent calc(${g} - 1px), var(--rule) calc(${g} - 1px), var(--rule) ${g})`
  if (cls === 'grid') return `repeating-linear-gradient(to bottom, transparent 0, transparent calc(${g} - 1px), var(--rule) calc(${g} - 1px), var(--rule) ${g}), repeating-linear-gradient(to right, transparent 0, transparent calc(${g} - 1px), var(--rule) calc(${g} - 1px), var(--rule) ${g})`
  if (cls === 'dots') return 'radial-gradient(circle, var(--rule) 1.2px, transparent 1.4px)'
  return null
}

const box = (f) => ({
  position: 'absolute',
  left: `${f.left}%`,
  right: `${f.right}%`,
  ...(f.top !== undefined ? { top: `${f.top}%` } : {}),
  ...(f.bottom !== undefined ? { bottom: `${f.bottom}%` } : {}),
  // 📐 `rot` = 칸이 그림에서 «기울어져» 그려진 속지(스크랩 사진첩의 폴라로이드 -9~6°).
  //    칸을 같은 각도로 돌려야 사진·글이 창에 맞는다. 축정렬 칸(rot 없음)은 그대로.
  ...(f.rot ? { transform: `rotate(${f.rot}deg)` } : {}),
})

// ⚠️ 줄 간격(`lineHeight`)은 «글씨체가 바뀌어도» 그대로다 — 종이의 줄과 묶여 있어서 흔들면 글이 줄에서 어긋난다.
//    글자 «크기»만 글씨체를 따라간다. (납작한 글씨는 작아 보이는데 그게 그 글씨체의 성격이다)
const handOf = (f, k = 1) => ({
  fontFamily: f?.family || HAND,
  fontWeight: f?.weight || 700,
  color: INK,
  fontSize: `${PAPER_LINE_H * 0.79 * k}cqw`,
  lineHeight: `${PAPER_LINE_H}cqw`,
  letterSpacing: f?.ls || '0.01em',
})

// 📏 크기 3단 — **줄 «안»에서만 움직인다.**
//   ⛔ 줄 간격은 못 건드린다. `PAPER_LINE_H` 는 사진일기 그림에 «인쇄된 줄»과 맞춘 값이라
//      흔들면 그 틀에서 글이 인쇄된 줄에서 어긋난다.
//   ⭐ 그래서 «크게»도 줄 높이의 0.90 까지만 — 커진 게 보이면서 줄을 안 넘는다.
export const WRITE_SIZES = [
  { key: 'sm', label: '작게', k: 0.88 },
  { key: 'md', label: '보통', k: 1 },
  { key: 'lg', label: '크게', k: 1.14 },
]

/**
 * 종이 위의 «쓰는 칸» 전부. `onChange` 가 없으면 읽기 전용(꾸미기 판·미리보기).
 * `value` = { note: 본문, line: 오늘의 한 줄 }
 */
// 🖊 `onPick` = **「고르는 칸」만 살리는 문**(창업자 폰 제보 2026-08-07)
//   ⛔ 전엔 `ro = !onChange` 하나가 **전부**를 갈랐다 — 꾸미기 판(`paperOverlay`)은
//      `onChange` 를 안 받으므로 글칸뿐 아니라 **함께·장소·날씨·기분·시간·만족도까지 통째로 죽었다.**
//      → 서랍이 열려 있는 동안 그 칸들을 **하나도 못 골랐다**(만든 날부터 그랬다).
//   ⭐ 둘은 성격이 다르다 — 글칸은 누르면 **키보드가 떠서** 꾸미기를 방해하지만,
//      축은 **탭 한 번**이라 꾸미는 중에 눌러도 아무것도 안 가린다.
//   📌 그래서 「글칸은 읽기 전용, 축은 살아 있음」을 **한 칸으로** 만든다.
// 🗑 `photoClear` = 사진칸의 ✕(사진 지우기)를 «그릴지». 기본 false.
//    📮 창업자 폰 제보 2026-09-06 00:25 *"나갔다 들어와도 x가 보여"* ＋ 00:28 *"데코스티커를 추가하면 x표시 뜨는 바로 옆에 붙어
//       스티커를 움직이면 사진이 움직이거나 스티커가 사라져서 불편해"*
//    ⛔ 전엔 `canShot`(사진을 «넣을» 수 있나)이 ✕도 함께 갈랐다 — 일기 «날짜 화면»은 사진 넣기 길을 열어 두니
//       읽는 화면에도 ✕가 늘 떴고, 꾸미기 판의 스티커 탭에서도 사진 ✕와 스티커 ✕가 나란히 붙었다.
//    ⭐ 「넣기」와 「지우기」는 다른 일이다 — 지우기는 꾸미기 판의 «속지·글쓰기» 탭에서만(DecorEditor 가 탭을 보고 넘긴다).
export default function PaperSheet({ fields, value = {}, onChange, onPick, onPickPhoto, dateLabel = '', rule = '', font = '', size = '', photoClear = false }) {
  // ✍️ 본문 글씨체 — 못 찾으면 예전 그대로(귀염체). ⛔이미 쓴 일기가 바뀌면 안 된다
  const f = TEXT_FONTS.find((t) => t.key === font)
  // 📏 크기 = «글씨체 보정» × «작게/보통/크게». 둘 다 없으면 1 → 지금 모습 그대로
  const k = (f?.sz || 1) * (WRITE_SIZES.find((z) => z.key === size)?.k || 1)
  const hand = handOf(f, k)
  const ro = !onChange
  // ✅ 축을 고를 수 있나 — 쓰기 판(`onChange`)이거나, 고르기만 열어 준 판(`onPick`)이면 된다
  const write = onChange || onPick
  const canPick = !!write
  // 📷 **틀의 사진칸도 「탭 한 번」이다** (창업자 폰 제보 2026-08-07
  //    *"사진은 일꾸 글쓰기는 글쓰기 각탭에서 수정해야해서 번거로움"*)
  //   ⛔ 전엔 `!ro` 라 **글쓰기 탭에서만** 눌렸다 → 사진 넣으러 글쓰기로 갔다가
  //      꾸미러 일꾸로 돌아오는 «왕복»이 생겼다.
  //   ⭐ 사진 고르기는 글쓰기가 아니라 **고르는 일**이다(키보드가 안 뜬다) — 축과 같은 부류다.
  //      그래서 「속지」 탭에서도 눌리게 해서 **고르는 일을 한자리에** 모은다.
  //   ⚠️ 누를 «곳»(`onPickPhoto`)이 없으면 못 누른다 — 판마다 넘겨줘야 한다.
  const canShot = canPick && !!onPickPhoto
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value })
  const bg = ruleBg(rule)
  // ⛔ 읽기 전용(꾸미기 판)에선 아무것도 손가락을 먹으면 안 된다 — 그 위에서 스티커를 끌어야 한다
  const noTouch = ro ? { pointerEvents: 'none' } : {}
  // 🗒🗒 **쓰는 칸은 «여럿»일 수 있다** (창업자 폰 제보 2026-08-07
  //   *"일기인데 줄이 없어..가운데 뻥뚫려있음 줄도 안생기고. 이것도 줄 선택하게 해줌 좋겠어. 위에처럼"*)
  //   ⛔ 「레시피 기록」 틀은 쓰는 칸이 **사진 옆 좁은 칸 하나**뿐이었다.
  //      가운데 큰 자리는 아무 칸도 아니어서 **글도 못 쓰고 줄도 안 그려졌다**(그림을 재니 40.1~85.7% 가 통째로 빈칸).
  //   📌 처음엔 그 자리를 «꾸미기 자리»로 비워 뒀는데, 써 보니 **일기인데 뻥 뚫려** 보였다.
  //      → 칸을 하나 더 준다. 「선」을 무지로 두면 예전처럼 비어 있고, 줄·모눈·도트를 고르면 거기도 그어진다.
  //   ⚠️ 칸마다 «저장 자리»가 다르다(`key`) — 안 그러면 두 칸이 같은 글을 비춘다.
  const writes = fields.write ? (Array.isArray(fields.write) ? fields.write : [fields.write]) : []
  // 🧷 글자는 스티커·틀 그림보다 «위». 글은 가려지면 안 된다.
  //    ⚠️ 사진은 반대다 — 아래(`zIndex` 없음)라야 틀 선이 사진 위에 그려져 «창»이 된다.
  const overSticker = { zIndex: 1 }

  return (
    <>
      {/* 📷 사진 — 틀에 그려진 «창»에 끼운다 (창업자 2026-08-06 *"사진틀에 사진올리기가없어"*)
          ⭐ 일부러 층을 «아래»에 둔다 — 틀 그림(`.paper.art::after`)이 나중에 칠해져서
             사진 가장자리를 선이 덮는다. 그래야 붙인 게 아니라 «끼운» 것으로 보인다.
          🗂 사진칸도 «여럿»일 수 있다 (2026-08-08 「기록 3칸」 속지 = 구획마다 사진칸 하나씩 셋).
             write 배열과 같은 문법 — 칸마다 저장 자리(`key`)가 다르다(기본 'photo' = 옛 틀 그대로).
             ⚠️ `onPickPhoto(저장키)` 로 «어느 칸인지» 같이 넘긴다 — 안 넘기면 셋이 같은 사진을 비춘다. */}
      {(fields.photo ? (Array.isArray(fields.photo) ? fields.photo : [fields.photo]) : []).map((p, pi) => {
        const pk = p.key || 'photo'
        // 🫳🫳 **사진을 «끌어서» 보일 부분을 고른다** (창업자 폰 제보 2026-08-08 *"사진 위치조정이 안되네"*)
        //
        //   ⛔ 전엔 고를 때 가운데 정사각으로 «잘라 버리고»(cropSquare) 칸에서도 가운데만 보여줘서
        //      (`objectFit:cover` 기본값 = 50% 50%) 원하는 부분이 위·아래에 있으면 **볼 길이 없었다.**
        //   ⭐ 처방이 둘로 나뉜다 — ⑴자를 때 안 버린다(`fitImage`) ⑵볼 때 위치를 고른다(여기).
        //      두 번째만 고치면 이미 잘려 나간 사진은 못 살린다.
        //   ⭐ 손짓은 인스타 문법 그대로 — 프레임 안에서 사진이 손가락을 따라온다.
        //   ⚠️ 값이 없으면 «가운데»(50% 50%) — 이미 넣어 둔 사진이 그대로 보인다(규칙 18 ⓙ).
        const pos = value[`${pk}Pos`] || '50% 50%'
        // 🔍🔍 **두 손가락으로 벌려서 확대·축소** (창업자 폰 제보 2026-08-12
        //    *"사진 붙이면 위아래로 움직이는데 확대 축소는 안되더라. 수정가능해?"*)
        //
        //   ⛔ 끌기(위)만 있고 배율이 없어서, 사진이 칸보다 «조금만» 클 땐 아무리 끌어도
        //      보고 싶은 데가 안 왔다(끌 수 있는 양 = 넘치는 만큼뿐이라 0 에 가깝다).
        //   ⭐⭐ **`transform: scale(z)` ＋ `transformOrigin` 을 `objectPosition` 과 «같은 값»으로** 준다.
        //      배율을 어떤 점 둘레로 걸든, 그 점을 `objectPosition` 이 잡아둔 자리와 맞추면
        //      **자리 계산식이 하나도 안 바뀐다** — 넘치는 양만 `z` 배가 된다:
        //          overX' = z × (사진폭 × 맞춤배율) − 칸폭
        //      그래서 `z = 1` 이면 지금과 **픽셀 하나까지 똑같다**(이미 넣어 둔 사진이 안 움직인다).
        //   ⚠️ 배율은 1 밑으로 안 내려간다 — 1 이 「칸을 꽉 채운 상태」다. 더 줄이면 칸에 빈 데가 생긴다.
        //      ⭐ 그래서 **되돌리는 단추가 없어도 된다**(오므리면 1 에서 멈춘다).
        //   ⭐⭐ **1 밑 = 「사진 전체가 보이게」** (창업자 확정 2026-08-12)
        //      ⛔ 위 주석의 *"1 밑으론 안 내려간다"* 는 «지금까지»의 이야기다 — 창업자가 열라고 정했다.
        //      🔢 왜 잘려 보였나 =  는 칸을 꽉 채우려고 넘치는 쪽을 «잘라낸다». 세로로 긴 사진이면
        //         위아래가 통째로 안 보인다. 아무리 끌어도 «한 화면에 전부»는 못 본다.
        //      ✅ 그래서 1 밑으로 가면 **(전체가 들어오게)** 으로 바꾼다. 남는 자리엔 속지가 비친다
        //         — 창을 꽉 채운 게 아니라 «사진을 창 안에 테이프로 붙인» 모양이 된다.
        //      ⚠️ 1 에서 «한 번 툭» 바뀐다 — 자르기(cover)와 다 보이기(contain)는 성질이 다른 상태라
        //         중간이 없다. 그 경계가 바로 「전체가 보이기 시작하는 순간」이라 오히려 알기 쉽다.
        // 🔍 배율·자리 규칙은 `src/photoPan.js` **한 곳**에서 정한다 (2026-08-17)
        //    — 일기 속지 사진과 레시피 표지 사진이 «같은 코드»를 쓴다. 복사하면 한쪽이 반드시 낡는다.
        const pz = clampZoom(value[`${pk}Zoom`])
        const imgStyle = photoImgStyle(pos, pz)
        // 📌 «탭 = 사진 바꾸기»와 갈라야 한다 → 6px 넘게 움직였을 때만 드래그로 친다.
        //    드래그였으면 뒤따라오는 click 을 삼킨다(`dragged` 표시) — 안 그러면 끌 때마다 파일창이 뜬다.
        // 📐 이동량 → % 환산: `cover` 는 사진을 칸보다 크게 그리므로 «넘치는 만큼»(overX/overY)만 움직인다.
        //    손가락을 아래로 끌면 사진이 아래로 따라와야 하니 objectPosition % 는 «줄어든다»(반대 부호).
        // 🫳🤏 손가락 «하나»면 끌기, «둘»이면 확대. 상태는 버튼 노드에 얹는다
        //    (이 함수는 렌더마다 새로 만들어지므로 클로저에 담아 두면 손짓 중에 끊긴다).
        // 🫳🤏 손짓(끌기·두 손가락 확대)은 `src/photoPan.js` 로 «옮겼다» (2026-08-17)
        //   📮 창업자 *"확대, 축소가 자연스럽게 되게 부탁해(손가락으로할때)"* — 표지에도 같은 손짓이 필요해졌다.
        //   ⛔ 복사하지 않는다. 여기서 잡은 사고들(배율에 따라 끌리는 양이 달라짐 · `transformOrigin` 을
        //      `objectPosition` 과 같은 값으로 · 1 밑에선 가운데 고정 · 두 손가락 뒤엔 click 이 «안 온다»)이
        //      표지에서 다시 나면 안 된다.
        const dragStart = (e) => {
          if (!canShot) return
          photoPanStart(e, {
            pos,
            zoom: pz,
            onCommit: ({ pos: np, zoom: nz }) => write({ ...value, [`${pk}Pos`]: np, [`${pk}Zoom`]: nz }),
          })
        }
        return (
        <div key={`photo${pi}`} style={{ ...box(p), overflow: 'hidden' }}>
          {value[pk]
            ? (!canShot
              ? <StoredImg src={value[pk]} alt="" style={imgStyle} />
              : (
                <>
                  <button type="button" className="press" aria-label="사진 — 끌어서 위치 조정 · 두 손가락으로 확대·축소 · 누르면 바꾸기"
                    onPointerDown={dragStart}
                    onClick={(e) => {
                      const t = Number(e.currentTarget.dataset.dragged || 0)
                      delete e.currentTarget.dataset.dragged
                      if (t && Date.now() - t < 500) return // 방금 끌거나 벌린 뒤 따라온 click
                      onPickPhoto(pk)
                    }}
                    style={{ width: '100%', height: '100%', padding: 0, border: 'none', background: 'none', display: 'block', touchAction: 'none' }}>
                    <StoredImg src={value[pk]} alt="" draggable={false} style={{ ...imgStyle, pointerEvents: 'none' }} />
                  </button>
                  {/* 🗑🗑 **사진 지우기** (창업자 폰 제보 2026-08-07 *"하나추가 사진지우는게 없어."*)
                      ⛔ 이건 «사진 스티커»가 아니라 **틀의 사진칸**(`value.photo`)이라
                         `DecorLayer` 의 지우기 단추와 아무 상관이 없다 — 그래서 길이 «아예» 없었다.
                         「사진 바꾸기」로 다른 걸 끼울 수는 있어도 **비울 수는 없었다.**
                         한 번 넣으면 그 칸은 영영 사진 칸이 된다.
                      ⭐ **스티커 지우기와 «똑같이» 만든다** — 31px · `#3f382e` · 같은 ✕ 아이콘.
                         같은 화면에 둘이 나란히 뜨는데 모양이 다르면 «다른 기능»으로 읽힌다.
                         ⛔ 그래서 여기만 `cqw` 로 재지 않는다(이 파일의 나머지는 글자라 폭 기준이 맞다).
                            판은 320~330px 한 크기로만 그려지고, 캡처(1080)에선 `canShot` 이 false 라 안 뜬다.
                      ⚠️ 자리는 사진칸 «안»쪽 — 밖에 두면 `overflow:hidden` 이 잘라 먹는다
                         (오늘 손잡이에서 −60px 로 이미 겪었다).
                      ⛔ 읽기 전용(꾸미기 밖·미리보기)엔 안 뜬다 — `canShot` 이 그걸 가른다.
                      ⛔ [2026-09-06] ＋ `photoClear` 가 참일 때만 — 날짜 화면·스티커 탭엔 안 그린다(위 함수 머리 주석). */}
                  {photoClear && <button type="button" className="press" aria-label="사진 지우기"
                    onClick={(e) => { e.stopPropagation(); write({ ...value, [pk]: '' }) }}
                    style={{
                      position: 'absolute', top: 5, right: 5,
                      width: 31, height: 31, borderRadius: '50%',
                      background: '#3f382e', color: '#fff', border: 'none', padding: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,.3)',
                    }}>
                    <Icon name="x" size={15} color="#fff" stroke={2.6} />
                  </button>}
                </>
              ))
            : (canShot && (
              <button type="button" className="press" onClick={() => onPickPhoto(pk)} aria-label="사진 넣기"
                style={{
                  width: '100%', height: '100%', padding: 0, border: 'none', background: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.4cqw',
                  fontFamily: HAND, fontWeight: 700, fontSize: `${PAPER_LINE_H * 0.62}cqw`, color: INK, opacity: 0.4,
                }}>
                사진 넣기
              </button>
            ))}
        </div>
        )
      })}

      {/* 🏷 제목 — 틀마다 «장식을 피한 빈 자리»에 한 줄 (창업자 2026-08-06
          *"저 맨위에 (사진틀위에) 나뭇잎옆에 제목 쓸 칸 만들어주면 좋겠어. 요리일지랑 다른 속지틀에도"*)
          ⭐ 자리는 눈대중이 아니라 **그림을 픽셀로 재서** 잡았다(`papers.js` 의 `title` 주석에 근거).
          ⭐ 본문보다 조금 크고 가운데 정렬 — 한 줄만 쓰는 칸이라 «표제»로 읽혀야 한다. */}
      {fields.title && (
        <div style={{ ...box(fields.title), ...overSticker, ...noTouch }}>
          {ro ? (
            <div style={{ ...hand, fontSize: `${PAPER_LINE_H * 0.95 * k}cqw`, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden' }}>{value.title || ''}</div>
          ) : (
            <input
              value={value.title || ''}
              onChange={set('title')}
              aria-label="제목"
              placeholder="제목"
              maxLength={24}
              style={{
                ...hand, fontSize: `${PAPER_LINE_H * 0.95 * k}cqw`, textAlign: 'center',
                width: '100%', height: `${PAPER_LINE_H * 1.25}cqw`, display: 'block',
                background: 'none', border: 'none', outline: 'none', padding: 0, margin: 0, borderRadius: 0,
              }}
            />
          )}
        </div>
      )}

      {/* 📅 날짜 — 그림의 날짜 칸에 «값만» 얹는다(사진일기엔 달력 아이콘·밑줄이 이미 인쇄돼 있다) */}
      {fields.date && dateLabel && (
        <div style={{ ...box(fields.date), ...hand, ...overSticker, fontSize: `${PAPER_LINE_H * (fields.date.fit || 0.68) * k}cqw`, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
          {dateLabel}
        </div>
      )}

      {/* ☀️ 「인쇄된 아이콘 중 하나 고르기」 — 그림에 이미 있는 아이콘 위에 투명 버튼을 얹는다.
          고르면 형광펜으로 칠한 자국. 같은 걸 다시 누르면 지워진다.
          ⛔ 아이콘을 새로 그리지 않는다 — 종이에 있는 그림이 그대로 보여야 한다.

          🔀🔀 **한 줄이 아니라 «여러 줄»을 받는다** (2026-08-06)
            새 속지 「오늘의 한끼」가 **사람·장소·날씨·기분·낮·밤 여섯**을 한 줄에 요구한다.
            ⭐ 전부 같은 일이다 — 「인쇄된 것 중 하나 고르기」. 그래서 **한 코드로 전부** 된다.
            ⛔ 축마다 따로 만들면 속지가 늘 때마다 코드가 는다.
          ⚠️ 옛 `fields.weather` 는 그대로 받는다 — 이미 쓴 일기가 안 깨지게 «한 줄짜리 picks»로 바꿔 읽는다. */}
      {(fields.picks || (fields.weather ? [{ axis: 'weather', label: '날씨', ...fields.weather }] : [])).map((row) => row.items.map((w) => {
        // 🗃 값을 어디에 넣나 — 날씨는 **옛 자리(`value.weather`)** 에 그대로.
        //    ⛔ 새 자리로 옮기면 이미 쓴 일기의 날씨가 통째로 사라진다(규칙 18 ⓙ).
        const cur = row.axis === 'weather' ? (value.weather || '') : ((value.picks || {})[row.axis] || '')
        // ⭐ 쓰기 판이면 `onChange`, 꾸미기 판이면 `onPick` — 어느 쪽이든 «값을 돌려주는 곳»은 하나다
        const put = (v) => (row.axis === 'weather'
          ? write({ ...value, weather: v })
          : write({ ...value, picks: { ...(value.picks || {}), [row.axis]: v } }))
        // ⭐ `fill` 축(만족도)은 **별점처럼 차오른다** — 3을 고르면 1·2·3 이 다 칠해진다.
        //   ⛔ 다른 축은 「그것 하나」를 표시하는 것이라 고른 것만 칠한다.
        //   📌 자리(`items` 차례)로 견준다 — 키가 '1'~'5' 라고 가정하지 않는다(다른 속지는 다를 수 있다).
        const on = row.fill
          ? (cur !== '' && row.items.findIndex((x) => x.key === w.key) <= row.items.findIndex((x) => x.key === cur))
          : cur === w.key
        // 🖍🖍 **형광펜으로 칠한 표시** (창업자 확정 2026-08-06 — 후보 여섯을 실물로 찍어 골랐다)
        //
        // ⛔ 전엔 «갈색 동그라미»였는데 창업자 *"그 동그라미 너무 별로야"* · *"아이콘에 비해 너무 커"*.
        //    📐 재보니 **맞았다** — 동그라미가 `10.5cqw` 인데 그림의 아이콘은 폭 **4.0~4.6%**(papers.js 실측).
        //       **2.3배**라 아이콘이 원 안에 «갇힌» 것처럼 보였다.
        // ⭐ 형광펜이 이긴 이유 = **선이 아니라 «색»이라 그림의 선과 안 싸운다.**
        //    갈색 원은 아이콘 선(같은 갈색) 위에 또 선을 얹는 꼴이었다.
        // ⭐ `multiply` 라 아이콘이 **그대로 비쳐 보인다** — 덮는 게 아니라 칠하는 것이다.
        // ⭐⭐ 그리고 이 문법은 **날씨 말고도 그대로 쓴다** — 새 속지의 기분·장소·동행·시간대·만족도가
        //    다 「인쇄된 아이콘 중 하나 고르기」라 표시를 또 고민할 일이 없다.
        const ring = (
          <span
            aria-hidden
            style={{
              // 크기는 «버튼 기준 %» — 버튼이 아이콘에 맞춰져 있어 아이콘을 딱 감싼다
              // 🎯 `fill` 축(만족도)은 자국을 **점보다 크게** 한다 — 점 자체가 초록이라
              //    그 안만 칠하면 색이 묻힌다(실측 차이 17 → 진하기만 올려도 35). 자국이
              //    베이지 마테 위로 삐져나와야 「칠했다」가 한눈에 읽힌다. 종이에 그은 자국도 원래 그렇다.
              position: 'absolute', left: '50%', top: '52%',
              width: row.fill ? '96%' : '52%', height: row.fill ? '82%' : '46%',
              transform: 'translate(-50%,-50%) rotate(-4deg)',
              // 손으로 칠한 자국이라 정원이 아니다 — 네 모서리를 조금씩 다르게
              borderRadius: '48% 52% 50% 50%/50%',
              // 🎯 `fill` 축(만족도)은 **더 진하게** — 그 점들은 «초록 원 ＋ 베이지 마테» 위에 있어서
              //    0.5 로는 칠한 티가 안 난다(실측: 칠한 것 노랑기 51 vs 안 칠한 것 34 — 차이 17뿐).
              //    날씨·기분은 «흰 바탕»이라 0.5 로도 잘 보인다. 바탕이 다르면 값도 달라야 한다.
              background: '#f0d98a', opacity: row.fill ? 0.92 : 0.5, mixBlendMode: 'multiply',
            }}
          />
        )
        const pos = {
          position: 'absolute', left: `${w.x}%`, top: `${row.y}%`,
          width: `${row.size * 1.28}cqw`, height: `${row.size * 1.28}cqw`,
          // ⭐ 축은 «고를 수 있으면» 손가락을 받는다 — 글칸의 읽기 전용(ro)과 따로 논다
          transform: 'translate(-50%,-50%)', ...overSticker, ...(canPick ? {} : { pointerEvents: 'none' }),
        }
        const id = `${row.axis}-${w.key}`
        if (!canPick) return <span key={id} style={pos}>{on && ring}</span>
        return (
          <button
            key={id}
            type="button"
            className="press"
            // 🏷 이름표에 «축»을 붙인다 — 「날씨 맑음」·「기분 좋음」. 축이 여럿이라 이름이 겹치면 안 된다
            aria-label={`${row.label} ${w.label}`}
            aria-pressed={on}
            onClick={() => put(on ? '' : w.key)}
            style={{ ...pos, background: 'none', border: 'none', padding: 0 }}
          >
            {on && ring}
          </button>
        )
      }))}

      {/* 📏📏 줄·모눈·도트는 «틀 그림 아래»에 따로 깐다 — 글자와 같은 층에 두면 안 된다.
          ⛔ 처음엔 글상자 배경으로 줬는데(`zIndex:1`) 그러면 줄이 **틀 그림보다 위**에 그려져
             메모칸에 인쇄된 꽃·마테·도장 «위로 줄이 지나갔다»(캡처로 잡았다).
          ⭐ 층을 안 주면 `::after`(틀 그림)가 나중에 칠해진다 — pseudo 는 «마지막 자식»이라.
             그래서 줄은 빈 종이에서만 보이고 인쇄된 장식 뒤로는 숨는다. **종이가 원래 그렇다.** */}
      {bg && writes.map((w, i) => (
        <div
          key={`rule${i}`}
          aria-hidden
          style={{
            ...box(w), pointerEvents: 'none',
            backgroundImage: bg,
            backgroundSize: rule === 'dots' ? 'var(--rule-gap) var(--rule-gap)' : undefined,
          }}
        />
      ))}

      {/* ✍️ 본문 — 종이의 줄 위에 바로. 배경·테두리 0 */}
      {writes.map((w, i) => {
        const k = w.key || 'note'
        return (
          <div key={`write${i}`} style={{ ...box(w), ...overSticker, ...noTouch }}>
            {ro ? (
              <div style={{ ...hand, whiteSpace: 'pre-wrap', wordBreak: 'break-word', height: '100%', overflow: 'hidden' }}>{value[k] || ''}</div>
            ) : (
              <textarea
                value={value[k] || ''}
                onChange={set(k)}
                aria-label={w.label || '일기 본문'}
                placeholder="여기에 써요"
                /* 📍 「종이 본문」 표시 — 스티커 글 상자(`DecorLayer`)의 글칸과 갈라야 한다.
                   ⭐ `DecorEditor` 의 `dropCaret(true)` 가 **이 표시가 붙은 것만** 커서를 놓는다.
                      (서랍을 누르면 본문 커서는 놓되, 방금 붙인 글 상자 커서는 안 뺏는다) */
                data-paper-body="1"
                style={{
                  ...hand, width: '100%', height: '100%', display: 'block',
                  background: 'none', border: 'none', outline: 'none', resize: 'none', padding: 0, margin: 0,
                }}
              />
            )}
          </div>
        )
      })}

      {/* 📝 오늘의 한 줄 — 밑줄 하나 ＋ 라벨. 「레시피 기록」 속지의 맨 아래 칸이다
          (창업자 확정: *"평가빼고 오늘의 한 줄 정도로?"* → 별 다섯을 뺀 자리) */}
      {fields.line && (
        <div style={{ ...box(fields.line), ...overSticker, ...noTouch }}>
          {/* 라벨은 «인쇄된 글자»처럼 — 손글씨보다 작고 연하게. 내가 쓴 글과 안 헷갈리게 */}
          <div style={{ fontFamily: HAND, fontWeight: 700, fontSize: `${PAPER_LINE_H * 0.54}cqw`, color: INK, opacity: 0.42, letterSpacing: '0.04em', lineHeight: 1.25, marginBottom: '0.6cqw' }}>
            {fields.line.label}
          </div>
          <div style={{ borderBottom: '1px solid var(--rule)' }}>
            {ro ? (
              <div style={{ ...hand, minHeight: `${PAPER_LINE_H}cqw`, whiteSpace: 'nowrap', overflow: 'hidden' }}>{value.line || ''}</div>
            ) : (
              <input
                value={value.line || ''}
                onChange={set('line')}
                aria-label="오늘의 한 줄"
                maxLength={30}
                style={{
                  ...hand, width: '100%', height: `${PAPER_LINE_H}cqw`, display: 'block',
                  background: 'none', border: 'none', outline: 'none', padding: 0, margin: 0, borderRadius: 0,
                }}
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}

/**
 * 종이 한 장 = 「자(container) → 종이」 두 겹.
 * ⚠️ 자를 따로 두는 이유 = **제 폭은 제가 못 잰다.** `cqw` 는 «조상» 컨테이너를 본다.
 *    종이 자신에 `container-type` 을 걸면 종이 안의 `cqw` 가 종이를 못 보고 더 바깥을 본다.
 */
export function PaperBox({ skin, ratio = '3/4', children, style, className = '', ...rest }) {
  return (
    // 🖼 `paper-box` = **가로에서 종이 폭을 화면 «높이»에 맞추는 손잡이** (창업자 2026-08-09
    //    *"꾸미다가 취소하면 화면이 엄청커짐"* — 눕히면 앱이 폭을 다 쓰는데 3:4 종이는 폭이 곧 높이라
    //    851×1135 가 되어 화면 밖으로 나갔다). 세로에선 아무 일도 안 한다.
    <div className="paper-box" style={{ containerType: 'inline-size', width: '100%' }}>
      <div
        className={`${skin.className} ${className}`.trim()}
        style={{
          position: 'relative', width: '100%', aspectRatio: ratio, overflow: 'hidden',
          // 줄 간격도 «폭 기준» — 글줄과 CSS 줄이 한 값에 묶인다
          '--rule-gap': `${PAPER_LINE_H}cqw`,
          ...(skin.style || {}),
          ...style,
        }}
        {...rest}
      >
        {children}
      </div>
    </div>
  )
}
