// 🎨 레시피 상세를 덜 심심하게 — 절 머리 꼬르곰 ＋ 맨 끝 완성 칸 (2026-08-08 · v10.03)
//
// 📮 테스터 제보: *"요리 레시피가 재료부터 만드는 법까지 **다 글밖에 없다.**
//    귀여운 스티커나 **움직이는 거** 붙여주면 좋겠다 — **그걸 보면서 요리하는 사람들도 많다.** 심심해 보이니까"*
//
// 🔢 손대기 전 실측 — 재료 7줄 ＋ 만드는 법 7단계 안에 **그림 0장 · 아이콘 0개 · 글자 208자.**
//    테스터 말 그대로였다. ⭐게다가 «표지는 화려한데 그 밑이 흑백»이라 낙차가 컸다.
//
// ⛔ 새로 그린 그림은 하나도 없다 — 전부 이미 가진 컷이다(규칙 8).
//
// 🗂 창업자가 갈래 일곱을 실물로 보고 고른 것 = **D(절 머리가 움직인다) ＋ G(맨 끝에 완성 칸)**.
//    안 고른 갈래(단계마다 꼬르곰 · 재료 줄 아이콘 · 번호가 얼굴 · 조리법 스티커)는 지웠다.
//    ⛔ 되살릴 일이 있으면 `hold/상세꾸미기-시안-0808` 브랜치에 다 있다.
import { StickerFx } from './Stickers'
import duoCooking from '../assets/sharepool/duo_cooking.png'
import gomShop from '../assets/ui/gom_shop.png'
import gomClap from '../assets/ui/gom_clap.png'

// 절 머리에 붙는 컷 — 「재료」엔 장보기 꼬르곰, 「만드는 법」엔 함께 요리하는 듀오
const SECTION_CUTS = { 재료: gomShop, 만드는법: duoCooking }

// ── 움직임 ────────────────────────────────────────────────────────
// ✅ 창업자 확정 — 절 머리 **냠냠** · 완성 칸 **쿵착지**(창업자 제안 *"맨 마지막에 쿵착지는?? G"*)
// ⭐ 자리마다 다른 움직임을 쓴다 — **자리의 성격이 다르다.**
//    절 머리는 «계속 보이는» 자리라 은은해야 하고, 완성 칸은 «다 읽고 도착하는 끝»이라 착지가 맞다.
//    같은 움직임을 두 곳에 쓰면 둘 다 심심해진다.
// ⛔⛔ **어느 유료팩에도 «안 걸린» 모션만 쓴다.** 아장아장(추석)·빙글(핼러윈)·부르르(크리스마스)·
//    콩닥(봄)·펄럭(심플)은 **팔 물건**이라 UI 장식으로 공짜로 쓰면 팩 값어치가 깎인다.
//    냠냠·쿵착지는 「위아래」 축이 통통과 겹쳐 팩에서 빠진 예비다 — 여기선 겹칠 일이 없다.
const HEAD_MOTION = 'hk-m-nyam'
const DONE_MOTION = 'hk-m-drop'

// ── 효과 ──────────────────────────────────────────────────────────
// ⛔⛔ 「김모락」을 내가 1순위로 밀었다가 **창업자가 잡았다** — *"김모락은 연한배경이 안보일 것 같아"*.
//    맞다. `styles.css` 주석에 **「하얀 김(어두운 배경서 잘 보임)」** 이라고 «적혀 있는데» 그걸 읽고도 추천했다.
//    📌 **효과를 고를 땐 「어디에 놓이는지」를 같이 본다** — 그림만 보고 고르면 배경에서 사라진다.
const DONE_FX = 'food'

// 📏📏 완성 칸 꼬르곰의 «진짜» 크기 — `styles.css` 의 `.done-strip img { height: 46px }` 와 같은 값이다.
//   ⛔⛔ **이 한 줄이 빠져서 창업자 폰에서 조각이 단계 글자를 덮었다.**
//      효과 조각의 이동 거리는 `Stickers.jsx` 의 `rel()` 이 계산하는데, 거기엔 **「스티커 = 238px」이
//      못 박혀 있다**(꾸미기 캔버스 기준). 우리 곰은 46px 이라 거리가 **5.2배**로 튀어
//      조각이 칸 밖 **128px** 까지 날아갔다(실측 · `_repro-완성칸조각-0808.mjs`).
//   ⭐ 창업자는 *"위로 올라가는 거라 어쩔 수 없긴한데.."* 라고 했는데 **어쩔 수 없는 게 아니었다.**
//   ⚠️ `styles.css` 의 46px 을 바꾸면 **이 숫자도 같이** 바꿀 것.
const GOM_PX = 46

// 📐 조각 한 장의 크기. 기본값 32px 은 «238px 스티커에 얹는 것」을 전제로 정해졌고,
//    46px 곰에 그대로 쓰면 조각이 곰의 70% 라 덩어리처럼 보이고 칸 아래에서 잘렸다.
//    22px ＝ 곰의 절반쯤. ⛔ 더 줄이면 «음식»인지 알아볼 수 없다.
const FX_PX = 22

/**
 * where = 'head-재료' | 'head-만드는법' | 'done'
 * text  = 완성 칸에 쓸 레시피 제목
 */
export default function DetailDecor({ where, text }) {
  // 🏁 완성 칸 — 그림 하나가 아니라 «한 칸»이라 따로 그린다
  if (where === 'done') {
    return (
      <div className="done-strip">
        {/* 효과 조각이 곰 둘레에서 나야 해서 «곰을 감싼 칸»에 얹는다(칸 전체에 뿌리면 글자 위로 지나간다).
            ⛔ 그래도 조각이 「다 됐어요」 글자를 스쳤다(창업자가 잡았다).
            ⛔ lift 로 판을 위로 올려도 봤는데 그땐 조각이 칸 밖으로 나가 «안 보였다».
            ✅ 그래서 조각은 그대로 두고 **글자를 조각보다 앞에** 놓는다(`.done-strip > div` 의 z-index).
               효과는 배경 장식이니 글자 뒤로 지나가는 게 자연스럽다. */}
        <span className="done-gom">
          {/* 🪟 효과 판을 «아래로» 내린다 — 조각의 출발 y 가 원래 상자 «위쪽 바깥»(-26%)이라
              거리를 아무리 줄여도 칸을 넘는다. 판을 내리면 곰 손 언저리에서 떠오른다. */}
          <span className="done-fx"><StickerFx kind={DONE_FX} px={GOM_PX} size={FX_PX} /></span>
          <img src={gomClap} alt="" aria-hidden="true" draggable={false} className={DONE_MOTION} />
        </span>
        <div>
          <b>다 됐어요</b>
          <span>{text ? `${text} 완성!` : '완성!'}</span>
        </div>
      </div>
    )
  }

  const img = where?.startsWith('head-') ? SECTION_CUTS[where.slice(5)] : null
  if (!img) return null
  return (
    <img
      src={img}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={HEAD_MOTION}
      style={{ height: 34, width: 'auto', objectFit: 'contain', flex: '0 0 auto', display: 'block' }}
    />
  )
}
