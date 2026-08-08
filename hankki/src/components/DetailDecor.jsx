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
import gomPot from '../assets/sharepool/gom_pot.png'
import gomPan from '../assets/sharepool/gom_pan.png'
import gomDough from '../assets/sharepool/gom_dough.png'
import gomPasta from '../assets/sharepool/gom_pasta.png'
import gomCarrot from '../assets/sharepool/gom_carrot.png'
import duoCooking from '../assets/sharepool/duo_cooking.png'
import gomShop from '../assets/ui/gom_shop.png'

const ing = import.meta.glob('../assets/stickers/photo/{ig,kt}_*.png', { eager: true, import: 'default' })
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
// ⛔ 안 걸리면 «안 그린다» — `CookBuddy` 는 화면에 하나뿐이라 기본컷(duo)이 맞지만,
//    여기선 단계마다 붙어서 「냉장고에 차게 둬요」·「얼음을 띄워요」에까지 요리 듀오가 떴다(첫 판).
//    **안 맞는 그림은 없는 것만 못하다.**
export function stepCut(text) {
  return (STEP_CUTS.find((k) => k.re.test(String(text))) || {}).img || null
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

// ── 렌더 ──────────────────────────────────────────────────────────
/**
 * mode = 'a' 단계마다 꼬르곰 · 'b' 재료 줄 아이콘 · 'c' 절 머리 한 컷 · 'off' 지금 그대로
 * where = 'step' | 'ing' | 'head-재료' | 'head-만드는법'
 */
export default function DetailDecor({ mode, where, text, prev }) {
  const img = useMemo(() => {
    if (mode === 'a' && where === 'step') {
      const cut = stepCut(text)
      if (!cut) return null
      // ⭐ 같은 그림이 연달아 나오면 두 번째부터는 안 그린다 — 7단계에 꼬르곰 7마리는 시끄럽다
      return prev !== undefined && stepCut(prev) === cut ? null : cut
    }
    if (mode === 'b' && where === 'ing') return ingCut(text)
    if (mode === 'c' && where?.startsWith('head-')) return SECTION_CUTS[where.slice(5)] || null
    return null
  }, [mode, where, text, prev])

  if (!img) return null
  const size = mode === 'c' ? 34 : mode === 'a' ? 42 : 22
  return (
    <img
      src={img}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={{ height: size, width: 'auto', objectFit: 'contain', flex: '0 0 auto', display: 'block' }}
    />
  )
}
