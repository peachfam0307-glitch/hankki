// 🎨 레시피 상세를 덜 심심하게 — 시안 셋 (2026-08-08 · ⏳창업자 판정 대기)
//
// 📮 테스터 제보(2026-08-08): *"요리 레시피가 재료부터 만드는 법까지 **다 글밖에 없다.**
//    귀여운 스티커나 움직이는 거 붙여주면 좋겠다 — **그걸 보면서 요리하는 사람들도 많다.** 심심해 보이니까"*
//
// 🔢 실물로 세어 확인했다(손대기 전) — 재료 7줄 ＋ 만드는 법 7단계 안에
//    **그림 0장 · 아이콘 0개 · 글자 208자.** 테스터 말 그대로였다.
//    ⭐ 게다가 «표지는 화려한데 그 밑이 흑백»이라 낙차가 크다.
//
// ⛔ 새로 그린 그림은 하나도 없다 — 전부 이미 가진 컷이다(규칙 8: 노가다도 새 자산 요청도 안 만든다).
//
// ⚠️ 이 파일은 «시안»이다. 창업자가 하나를 고르면 나머지 갈래와 `mode` 를 지운다.
import { useMemo } from 'react'
import { StickerFx } from './Stickers'
import gomPot from '../assets/sharepool/gom_pot.png'
import gomPan from '../assets/sharepool/gom_pan.png'
import gomDough from '../assets/sharepool/gom_dough.png'
import gomPasta from '../assets/sharepool/gom_pasta.png'
import gomCarrot from '../assets/sharepool/gom_carrot.png'
import duoCooking from '../assets/sharepool/duo_cooking.png'
import gomShop from '../assets/ui/gom_shop.png'
import gomClap from '../assets/ui/gom_clap.png'
import avGom from '../assets/avatars/av_gom.png'

const ing = import.meta.glob('../assets/stickers/photo/{ig,kt,rs}_*.png', { eager: true, import: 'default' })
const pic = (k) => ing[`../assets/stickers/photo/${k}.png`]

// ── ⓐ 단계 → 꼬르곰 컷 ─────────────────────────────────────────────
// ⭐ **이 판정은 이미 있었다** — `CookBuddy.jsx` 가 요리 모드에서 쓰던 것을 그대로 가져왔다.
//    거기 적힌 함정도 그대로 산다: ⛔한 글자 낱말 금지(「면」이 *"끓어오르**면**"* 에 걸린다),
//    순서가 곧 우선순위(면 > 볶기 > 반죽 > 끓이기 > 손질).
const STEP_CUTS = [
  { re: /파스타|스파게티|국수|우동|라면|소면|당면|면발|면을 |면이 |면 삶/, img: gomPasta },
  { re: /볶|튀기|굽|부치|지지|구워|노릇/, img: gomPan },
  { re: /반죽|섞|버무리|치대|무치|주무르/, img: gomDough },
  { re: /끓|삶|데치|우려|졸이|고아내/, img: gomPot },
  { re: /썰|다지|손질|채썰|깎|씻|다듬/, img: gomCarrot },
]
// ⛔⛔ **괄호 안 「곁말」은 빼고 본다.**
//    제육볶음 2단계 *"재워요. (시간 없으면 바로 **볶아도** OK)"* 의 곁말에 「볶기」가 걸렸고,
//    그 바람에 **정작 진짜 볶는 3단계가 «같은 그림»이라며 생략**됐다(첫 판에서 실제로 그랬다).
//    📌 괄호 안은 «이렇게도 된다»는 덧말이지 그 단계의 «하는 일»이 아니다.
const core = (s) => String(s).replace(/\([^)]*\)/g, ' ')

// ⛔ 안 걸리면 «안 그린다» — `CookBuddy` 는 화면에 하나뿐이라 기본컷(duo)이 맞지만,
//    여기선 단계마다 붙어서 「냉장고에 차게 둬요」·「얼음을 띄워요」에까지 요리 듀오가 떴다(첫 판).
//    **안 맞는 그림은 없는 것만 못하다.**
export function stepCut(text) {
  const s = core(text)
  return (STEP_CUTS.find((k) => k.re.test(s)) || {}).img || null
}

// ── ⓑ 재료 → 아이콘 ────────────────────────────────────────────────
// ⚠️⚠️ **붙는 줄이 44.6% 뿐이다**(기본 레시피 471줄 중 210줄 · 실측).
//    안 붙는 것 = 참기름·고춧가루·물·식초·맛술·통깨·굴소스… **거의 다 양념**이라
//    「양념은 양념병 한 컷으로」 묶어 메운다. ⛔그러면 같은 그림이 자주 반복된다 — 그게 이 안의 값이다.
// ⛔ 순서가 곧 우선순위 — 구체적인 것을 위에.
const ING_RULES = [
  [/적양파/, 'ig_jcb19'], [/양파/, 'ig_jae06'],
  [/방울토마토|토마토/, 'ig_jae07'], [/마늘/, 'ig_jae08'], [/브로콜리/, 'ig_jae09'],
  [/당근/, 'ig_jae10'], [/치즈/, 'ig_jae12'], [/버섯/, 'ig_jae20'],
  [/대파|쪽파|실파|부추/, 'ig_jae19'], [/계란|달걀/, 'ig_jae03'],
  [/새우/, 'ig_hsm01'], [/삼겹|목살|돼지/, 'ig_ggi03'], [/갈비/, 'ig_ggi16'],
  [/소고기|쇠고기|스테이크|한우/, 'ig_jae16'],
  [/수박/, 'ig_frb04'], [/포도/, 'ig_frb02'], [/복숭아/, 'ig_frb03'],
  [/파인애플|망고/, 'ig_frb08'], [/키위/, 'ig_frb13'],
  [/고추장/, 'kt_31'], [/된장|쌈장/, 'kt_30'], [/소금/, 'kt_29'],
  [/설탕|슈가|올리고당|물엿|꿀/, 'kt_11'],
  // 🥄 나머지 «액체» 양념은 병 하나로 묶는다 — 이게 없으면 절반이 빈 줄이 된다
  //   ⛔ 가루·씨앗(통깨·고춧가루·후추)은 넣지 않는다 — 첫 판에서 **「통깨 1큰술」에 간장병**이 붙었다.
  //      묶음은 「비슷해 보이는 것」까지만이다. 안 비슷하면 차라리 안 붙이는 게 낫다.
  [/간장|액젓|식초|맛술|참기름|들기름|올리브유|식용유|굴소스|피시소스|미림|청주/, 'kt_28'],
]
export function ingCut(text) {
  const m = ING_RULES.find(([re]) => re.test(String(text)))
  return m ? pic(m[1]) : null
}

// ── ⓒ 절 머리에 큰 컷 하나 ────────────────────────────────────────
export const SECTION_CUTS = { 재료: gomShop, 만드는법: duoCooking }

// ── ⓓ 움직이는 절 머리 ────────────────────────────────────────────
// ⭐⭐ **테스터가 「움직이는 거」라고 했는데 A·B·C 는 전부 정지 그림이었다.** 그래서 뒤늦게 넣는다.
// ✅✅ **창업자 확정 2026-08-08 = 「D 냠냠」** — 두 절 머리 다 냠냠.
// ⛔ 어느 유료팩에도 «안 걸린» 모션만 쓴다 — 아장아장(추석)·빙글(핼러윈)·부르르(크리스마스)·
//    콩닥(봄)·펄럭(심플)은 **팔 물건**이라 UI 장식으로 공짜로 쓰면 팩 값어치가 깎인다.
//    냠냠은 「위아래」 축이 통통과 겹쳐 팩에서 빠진 예비다 — 여기선 겹칠 일이 없다.
export const HEAD_MOTION = { 재료: 'hk-m-nyam', 만드는법: 'hk-m-nyam' }

// ── ⓖ 완성 칸의 움직임·효과 ───────────────────────────────────────
// ✅ **창업자 확정** — 모션 「쿵착지」(창업자 제안 *"맨 마지막에 쿵착지는?? G"*) ＋ 효과 「맛있는것들」
// ⭐ 왜 절 머리와 다른 걸 쓰나 = **자리의 성격이 다르다.**
//    절 머리는 «계속 보이는» 자리라 은은해야 하고(냠냠), 완성 칸은 «다 읽고 도착하는 끝»이라
//    도착 느낌이 맞다(쿵착지). 같은 움직임을 두 곳에 쓰면 둘 다 심심해진다.
// ⛔⛔ 효과 「김모락」을 내가 1순위로 밀었다가 **창업자가 잡았다** — *"김모락은 연한배경이 안보일 것 같아"*.
//    맞다. `styles.css` 주석에 **「하얀 김(어두운 배경서 잘 보임)」** 이라고 «적혀 있는데»
//    그걸 읽고도 추천했다. 상세 배경은 `--bg: #fdfbf7` = 거의 흰색이다.
//    📌 **효과를 고를 땐 「어디에 놓이는지」를 같이 본다** — 그림만 보고 고르면 배경에서 사라진다.
export const DONE_MOTION = 'hk-m-drop'
export const DONE_FX = 'food'

// ── ⓔ 단계 번호를 꼬르곰 얼굴로 ───────────────────────────────────
// ⭐ 줄 폭을 «하나도» 안 먹는다 — 이미 있는 번호 동그라미 자리를 그대로 쓴다.
//    (A 는 오른쪽에 자리를 만들어서 글줄이 밀렸다)
export { avGom }

// ── ⓕ 오늘 넣은 「조리법」 스티커(rs_q 12컷) ──────────────────────
// 캡션이 그림에 «박혀» 있다 — 썰기·볶기·끓이기·굽기·찌기·튀기기·에어프라이어·오븐.
// ⚠️ 그래서 「볶아요」 옆에 「볶기」가 또 나온다 = 글자가 겹친다. 그게 이 갈래의 성격이다.
// ⛔ 순서가 곧 우선순위 — 구체적인 것을 위에(에어프라이어·오븐이 「굽기」보다 먼저).
const RSQ = [
  [/에어프라이어|에프|air/i, 'rs_q11'],
  [/오븐|예열/, 'rs_q12'],
  [/튀기|튀겨|기름에/, 'rs_q10'],
  [/찌기|쪄|찜기|김 오/, 'rs_q09'],
  [/볶|팬에|웍/, 'rs_q03'],
  [/굽|구워|노릇|부치|지지/, 'rs_q07'],
  [/끓|삶|데치|졸이|우려/, 'rs_q05'],
  [/썰|다지|채 썰|손질|깎/, 'rs_q01'],
]
export function methodCut(text) {
  const s = core(text)
  const m = RSQ.find(([re]) => re.test(s))
  return m ? pic(m[1]) : null
}

// ── ⓖ 맨 끝에 「완성」 컷 ─────────────────────────────────────────
// ⭐ 줄은 하나도 안 건드린다 — 마지막 단계 «뒤»에만 한 칸 붙는다.
//    요리를 다 읽은 자리에 보상을 준다(리텐션 설계원칙: 성취가 아니라 흔적).

// ── 렌더 ──────────────────────────────────────────────────────────
/**
 * mode = 'a' 단계마다 꼬르곰 · 'b' 재료 줄 아이콘 · 'c' 절 머리 한 컷
 *      · 'd' 움직이는 절 머리 · 'e' 번호가 꼬르곰 얼굴 · 'f' 조리법 스티커 · 'g' 맨 끝 완성 컷
 *      · 'off' 지금 그대로
 * where = 'step' | 'ing' | 'head-재료' | 'head-만드는법' | 'done'
 */
export default function DetailDecor({ mode, where, text, prev }) {
  const img = useMemo(() => {
    if (where === 'step' && (mode === 'a' || mode === 'f')) {
      const pickCut = mode === 'f' ? methodCut : stepCut
      const cut = pickCut(text)
      if (!cut) return null
      // ⭐ 같은 그림이 연달아 나오면 두 번째부터는 안 그린다 — 7단계에 꼬르곰 7마리는 시끄럽다
      return prev !== undefined && pickCut(prev) === cut ? null : cut
    }
    if (mode === 'b' && where === 'ing') return ingCut(text)
    if ((mode === 'c' || mode === 'd' || mode === 'final') && where?.startsWith('head-')) return SECTION_CUTS[where.slice(5)] || null
    return null
  }, [mode, where, text, prev])

  // ⓖ 완성 컷 — 그림 하나가 아니라 «한 칸»이라 따로 그린다
  if ((mode === 'g' || mode === 'final') && where === 'done') {
    return (
      <div className="done-strip">
        {/* 효과 조각이 곰 둘레에서 나야 해서 «곰을 감싼 칸»에 얹는다(칸 전체에 뿌리면 글자 위로 지나간다) */}
        <span className="done-gom">
          {/* ⛔ 조각이 곰 «옆»으로 퍼져 「다 됐어요」 글자를 스쳤다(창업자가 잡았다).
              ⛔ 처음엔 lift 로 판을 위로 올렸는데 이번엔 조각이 칸 밖으로 나가 «안 보였다».
              ✅ 그래서 조각은 그대로 두고 **글자를 조각보다 앞에** 놓는다(done-strip 의 z-index).
                 효과는 배경 장식이니 글자 뒤로 지나가는 게 자연스럽다. */}
          <StickerFx kind={DONE_FX} />
          <img src={gomClap} alt="" aria-hidden="true" draggable={false} className={DONE_MOTION} />
        </span>
        <div>
          <b>다 됐어요</b>
          <span>{text ? `${text} 완성!` : '완성!'}</span>
        </div>
      </div>
    )
  }

  if (!img) return null
  const size = mode === 'c' || mode === 'd' || mode === 'final' ? 34 : mode === 'f' ? 46 : mode === 'a' ? 42 : 22
  const cls = (mode === 'd' || mode === 'final') && where?.startsWith('head-') ? HEAD_MOTION[where.slice(5)] : undefined
  return (
    <img
      src={img}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={cls}
      style={{ height: size, width: 'auto', objectFit: 'contain', flex: '0 0 auto', display: 'block' }}
    />
  )
}
