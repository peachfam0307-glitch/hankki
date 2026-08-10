// 🗓 이번 주 레시피 — «미리 채워두고 날짜가 열게 한다».
//
// 왜 이 모양인가 (창업자 2026-08-01):
//   *"이 기능은 매주 올라가야 하는데 **니가 나한테 물어보면 절대 안 되는 거야.**
//     **레시피는 우리 핵심 서비스**잖아"*
//   ⭐ 「매주 올라간다」와 「매주 안 묻는다」를 동시에 만족시키는 방법은 하나뿐이다 —
//      **미리 채워두고 달력이 열게 한다.** 사람이 매주 개입하는 구조는 둘 중 하나를 반드시 깬다.
//   (스티커 계절 `from` · 카드 시즌 `win` 과 **같은 장치**다. 새로 발명하지 않는다.)
//
// 🐛 왜 뒤늦게 만들었나 (2026-08-03):
//   8/2 새벽에 레시피 12편을 `basics.js` 에 그냥 부었다. 주차도 안내도 없이.
//   창업자: *"어제 레시피 한번에 다 올려버린거야? 뭐라도 안내를 하고 올려야지 않나?
//            올린 이유를? 제철이라 ○○이 맛있다던가 매주마다 레시피 하나씩 올리는데 이번주는 이거라던가."*
//   → **맞는 지적이다.** 「본문 쓰기」만 하고 「날짜 장치」와 「홈 한 줄」을 건너뛰어서
//      유저 눈엔 «주간 레시피»가 아니라 그냥 «레시피 12개 추가»였다.
//
// ⚠️ 규칙
//   · **월요일에 바뀐다** (창업자 확정 2026-08-03). 주 시작 = 그 주 월요일 00:00 KST.
//   · ⛔ **재고가 떨어지면 그 줄을 아예 안 그린다** — 빈 「이번 주」 자리를 남기지 않는다
//     (`LAB_SURVEY_URL` 이 비면 그 칸을 안 그리는 것과 같은 방식 · 죽은 카드 방지).
//   · ⛔ **지난 주 것을 숨기지 않는다** — 레시피는 계속 목록에 있다.
//     「이번 주」는 **추천이지 잠금이 아니다.** *한 번 준 것은 빼앗지 않는다.*
//   · 📅 명절은 음력이라 해마다 밀린다 → **그 해 달력을 보고 날짜를 넣는다. ⛔추측해 박지 말 것.**
//
// 📄 바닥 = `docs/52주-제철표-2026-08-01.md` · 설계 = `docs/주간레시피-설계-2026-08-01.md`

// 각 줄 = 한 주. `from` = 그 주 **월요일**(KST). 오늘 이하 중 «가장 최근» 한 줄이 열린다.
//   why  = ⭐ 창업자가 요구한 「올린 이유」. *"제철이라 ○○이 맛있다"* 를 한 문장으로.
//   ids  = `basics.js` 의 레시피 id. **없는 id 는 조용히 걸러진다**(레시피를 지워도 안 깨진다).
export const WEEKLY = [
  {
    from: '2026-08-03', title: '오징어',
    why: '여름 오징어가 제일 통통할 때예요. 볶고 데치고 무치는 세 가지로 한 주를 나요.',
    ids: ['basic-ojingeo-bokkeum', 'basic-ojingeo-sukhoe', 'basic-chungmu-ojingeo-muchim'],
  },
  {
    from: '2026-08-10', title: '깻잎',
    why: '깻잎이 가장 향 좋은 철이에요. 밥반찬으로 오래 두고 먹을 것부터 5분 볶음까지.',
    ids: ['basic-kkaennip-jangajji', 'basic-kkaennip-jeon', 'basic-hunje-ori-kkaennip'],
  },
  {
    // ⭐ 한때 34↔35 를 바꿨다가 «되돌렸다» — 창업자가 *"34주 아보카도스무디랑 묵채하자.
    //    우리있는거중에"* 로 **이미 있는 레시피**를 붙여줘서 세 편이 찼기 때문이다.
    //    📌 새로 쓰는 것보다 **있는 걸 제 자리에 놓는 게** 먼저다 — 나는 「두 편 더 쓰자」부터 떠올렸다.
    from: '2026-08-17', title: '여름 시원한 것',
    why: '늦더위가 제일 지치는 때예요. 불 안 켜고 만드는 것들로 골랐어요.',
    ids: ['basic-seulleoshi', 'basic-avocado-banana-smoothie', 'basic-siwon-mukchae'],
  },
  {
    from: '2026-08-24', title: '토마토',
    why: '노지 토마토가 제철이라 이때가 제일 달아요. 볶고 무치고 끓이는 세 가지로.',
    ids: ['basic-tomato-gyeran-bokkeum', 'basic-tomato-salad', 'basic-haejang-pasta'],
  },
  // ═══════════════════════════════════════════════════════════════
  // 🍂 36~40주 (2026-08-31 ~ 09-28) — 가을 첫 다섯 주
  //    ⚠️⚠️ 39주 「추석 남은 음식」을 «40주 자리»에 놓았다.
  //       2026 추석 = **9/25(금)** · 연휴 9/24~26 (서치로 확인 · ⛔음력이라 매년 밀린다).
  //       9/21 주엔 연휴가 «아직 안 끝나서» 남은 음식이 없다 — 냉장고에 전이 쌓이는 건 **9/28 월요일**이다.
  //       그래서 40주 버섯과 자리를 맞바꿨다. 표(`docs/52주-제철표`)에선 39주 자리를 그대로 둔다.
  //    📌 내년에 다시 붙일 땐 **그 해 추석 날짜를 먼저 확인**할 것 — 추측해서 박지 말 것.
  // ═══════════════════════════════════════════════════════════════
  // ⭐⭐ 이 주는 «창업자가 직접 쓴 레시피» 둘이 들어간다 (2026-08-10 · 설계 §3.7 「간판」)
  //    ⛔ 내가 쓴 초안(햅쌀 솥밥·누룽지탕)은 창업자 지시로 뺐다 — 실제로 해먹어 본 것이 이긴다.
  {
    from: '2026-08-31', title: '솥밥',
    why: '햅쌀이 나오는 때예요. 갓 지은 밥이 주인공인 세 가지예요.',
    ids: ['basic-beoseot-butter-bap', 'basic-sogogi-sotbap', 'basic-dolsot-bibimbap'],
  },
  {
    from: '2026-09-07', title: '꽃게',
    why: '가을 꽃게는 암게라 알이 꽉 차요. 담그고 끓이고 찌는 세 가지로.',
    ids: ['basic-ganjang-gejang', 'basic-kkotge-tang', 'basic-kkotge-jjim'],
  },
  {
    from: '2026-09-14', title: '갈치',
    why: '가을 갈치는 기름이 올라 제일 고소해요. 조림·구이·맑은국이에요.',
    ids: ['basic-galchi-jorim', 'basic-galchi-gui', 'basic-galchi-guk'],
  },
  {
    from: '2026-09-21', title: '버섯',
    why: '버섯이 가장 좋을 때예요. 밥·전골·볶음으로 골고루 담았어요.',
    ids: ['basic-beoseot-sotbap', 'basic-dubu-deulkkae-jeongol', 'basic-beoseot-bokkeum'],
  },
  {
    from: '2026-09-28', title: '추석 남은 음식',
    why: '연휴가 끝나면 전이랑 나물이 남죠. 데우기만 하면 물리니까 새 음식으로 바꿔요.',
    ids: ['basic-jeon-jjigae', 'basic-namul-bibimbap', 'basic-namul-japchae'],
  },
  // ⏳ 41주(10/05~) 부터는 아직 비어 있다 → **그 주가 오면 홈에 줄이 안 그려진다.**
  //    ⛔ 빈 자리를 남기지 않는 게 규칙이라 그게 맞는 동작이지만,
  //       ⭐ 「매주 온다」는 약속이 끊기는 것이므로 **9/28 전에 10~11월치를 채워야 한다.**
  //    📋 다음 = 41 고구마 · 42 대하 · 43 고등어 · 44 배추(김장) · 45 무 · 46 가리비 · 47 연근·우엉
]

const KST = 9 * 60 // 분

// 오늘(KST) 을 'YYYY-MM-DD' 로. ⚠️ 컨테이너는 UTC 라 그냥 `toISOString()` 하면 하루 어긋난다.
export const todayKST = (now = new Date()) =>
  new Date(now.getTime() + (KST + now.getTimezoneOffset()) * 60000).toISOString().slice(0, 10)

// 이번 주 한 줄. 없으면 `null` → **홈에서 줄을 아예 안 그린다.**
export const weeklyNow = (recipes = [], now = new Date()) => {
  const t = todayKST(now)
  // `from` 이 오늘 이하인 것 중 가장 늦은 것. (배열 순서에 기대지 않는다)
  let pick = null
  for (const w of WEEKLY) if (w.from <= t && (!pick || w.from > pick.from)) pick = w
  if (!pick) return null

  // ⭐ 실제로 있는 레시피만 남긴다 — 레시피를 지우거나 id 를 바꿔도 앱이 안 깨진다.
  const byId = new Map(recipes.map((r) => [r.id, r]))
  const items = pick.ids.map((id) => byId.get(id)).filter(Boolean)
  if (!items.length) return null // ⛔ 하나도 없으면 그 줄은 없는 것으로 친다

  return { ...pick, items }
}

// 몇 주치 남았나 — 재고가 마르기 전에 알아채려고. (`npm run weekly`)
export const weeksLeft = (now = new Date()) => {
  const t = todayKST(now)
  return WEEKLY.filter((w) => w.from > t).length
}
