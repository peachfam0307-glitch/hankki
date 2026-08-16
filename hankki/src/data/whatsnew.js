// 📣 «방금 열린 것» · «곧 열릴 것» — 안내 페이지(`PreviewSheet`)가 읽는 곳.
//
// ⭐⭐ 왜 만들었나 (창업자 2026-08-03 *"새로 열릴때 꼭 안내페이지에 올라오도록 해"*)
//   우리 업데이트는 **날짜가 저절로 연다**(주간 레시피 `from` · 꾸미기 `from` · 카드 `from`).
//   푸시도 배포도 없다 — **그래서 유저는 뭐가 새로 생겼는지 아무 데서도 못 듣는다.**
//   9/1 에 45컷이 열려도 앱은 한마디도 안 한다.
//
// ⛔⛔ 그렇다고 안내 문구를 «손으로» 적어두면 안 된다.
//   `PreviewSheet` 의 `UPCOMING` 이 딱 그 모양이었다 — *"새 꾸미기팩 · 준비 중"* 한 줄이
//   몇 달째 그대로였고, 뭐가 언제 오는지 아무것도 안 알려줬다.
//   📌 **손으로 적은 목록은 반드시 낡는다** (이 저장소에서 이미 여러 번 데었다:
//      스토어 스샷 · 릴리즈 판수 · 자동 검사 개수 · 자산 현황 …).
//
// ✅ 그래서 **날짜 게이트가 보는 «바로 그 데이터»를 읽는다.**
//   · 주간 레시피 → `WEEKLY` (`data/weekly.js`)
//   · 꾸미기 서랍 → `STICKER_GROUPS[].from` (`components/Stickers.jsx`)
//   · 레꾸자랑 카드 → `SEASON_CUTS[].from` (`data/cardSeasons.js`)
//   ⭐ 그러면 **안내와 실제가 어긋날 수가 없다.** 새 팩을 넣으면 안내에 저절로 뜬다.
//
// ⛔ 재고가 없으면 «빈 절»을 그리지 않는다 — 배열이 비면 화면에서 그 칸이 통째로 사라진다
//   (`LAB_*_URL` 이 비면 그 칸을 안 그리는 것과 같은 방식 · 죽은 안내 방지).
import { WEEKLY, HOMEMADE } from './weekly'
import { STICKER_GROUPS, PHOTO_IDS } from '../components/Stickers'
import { SEASON_CUTS } from './cardSeasons'

// ⏰ 오늘(KST). ⚠️ **함수로 둔다** — 모듈 상수로 굳히면 앱을 켜둔 채 자정을 넘길 때 안 바뀐다
//    (`ShareDrawCard` 의 `seasonCuts` 가 상수 아닌 함수인 것과 같은 이유).
// ⛔⛔ [2026-08-17] 옛 공식은 **한국 폰에서만** 하루 어긋났다 — `getTimezoneOffset()` 을 더하면
//    KST 폰(−540)에서 +9시간이 «상쇄»돼 UTC 가 나온다. 0시~9시 사이엔 어제가 된다.
//    `Date.now()` 는 이미 UTC 기준이고 `toISOString()` 도 UTC 로 찍으니 **그냥 +9시간**이면 된다.
//    📌 `weekly.js`·`basics.js` 에도 같은 공식이 있었다 — 셋 다 고쳤다(창업자 폰 캡처로 잡음).
export const todayKST = () =>
  new Date(Date.now() + 9 * 60 * 60000).toISOString().slice(0, 10)

const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000)

// 「방금」의 길이 = 3주. 매달 1일에 열리므로 3주면 **한 번은 반드시 본다**(월 1회 여는 주기보다 짧으면 놓친다).
const FRESH_DAYS = 21

// 🗂 날짜가 여는 문 전부 — 꾸미기 서랍 ＋ 레꾸자랑 카드.
//   ⚠️ `from` 이 없는 그룹(사철 기본)은 «열리는 사건»이 아니라 처음부터 있던 것 → 뺀다.
// 🖼 미리보기 컷 수 — ⭐**글자만 있으면 광고가 안 된다** (창업자 2026-08-03 *"가을 이모지팩도 광고해야하지 않아?"*).
//    5컷이면 한 줄에 들어가고, 더 넣으면 작아져서 뭐가 뭔지 안 보인다.
const PEEK = 5

// ⛔⛔ **그림이 «실제로 있는» 키만 미리보기로 쓴다.**
//   `StickerArt` 는 모르는 키를 받으면 조용히 아무것도 안 그린다 → 빈 네모가 뚫린다.
//   2026-08-03 실제로 그랬다: 카드 세트 키 하나가 서랍 자산이 아니라 **넷째 칸이 뻥 비었다.**
//   ⚠️ 개수(`count`)는 줄이지 않는다 — 그건 «몇 컷 열리나»라 그림 유무와 상관없다.
const drawable = (keys = []) => keys.filter((k) => PHOTO_IDS.has(k))

function gates() {
  const drawer = STICKER_GROUPS
    .filter((g) => g.from && g.items?.length)
    .map((g) => ({ when: g.from, kind: '꾸미기', title: g.label, count: g.items.length, peek: drawable(g.items).slice(0, PEEK), tab: g.tab, season: g.season }))
  const cards = SEASON_CUTS
    .filter((s) => s.from)
    .map((s) => {
      const all = [...(s.gom || []), ...(s.peng || []), ...(s.duo || [])]
      return { when: s.from, kind: '레꾸자랑 카드', title: `${s.label} 카드`, count: all.length, peek: drawable(all).slice(0, PEEK) }
    })
    .filter((c) => c.count > 0)
  return [...drawer, ...cards].sort((a, b) => a.when.localeCompare(b.when))
}

// 🍂 한 날짜에 열리는 것들을 «한 마디»로 — 팝업 제목에 쓴다.
//   ⛔ 「업데이트 안내」 같은 말은 아무 느낌이 없다. **무엇이 왔는지**를 말한다.
//   ⭐ 계절 이름은 지어내지 않고 `STICKER_GROUPS.season` 에서 읽는다.
const SEASON_KO = { spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' }
// 🐻🐧 주인공(꼬르곰·펭펭) 말고 «처음 나오는» 친구 — 데뷔는 한 번밖에 못 쓰는 카드다.
//    ⚠️ 풀네임으로만 쓴다(CLAUDE.md 핀). 라벨에 이름이 들어 있으면 그게 데뷔다.
const NEW_FRIENDS = ['카롱', '뾰미', '꼬비']

export function headline(items = []) {
  const n = items.reduce((s, i) => s + i.count, 0)
  const onlyWeek = items.every((i) => i.kind === '이번 주 레시피')
  if (onlyWeek) return { title: '이번 주 레시피가 올라왔어요', sub: items[0]?.title || '' }

  const seasons = [...new Set(items.map((i) => i.season).filter(Boolean))]
  const ko = seasons.length === 1 ? SEASON_KO[seasons[0]] : null
  const debut = NEW_FRIENDS.find((f) => items.some((i) => (i.title || '').includes(f))) || null

  return {
    title: ko ? `꾸미기에 ${ko}이 왔어요` : '새 꾸미기가 열렸어요',
    sub: `${n}컷 · 전부 무료예요`,
    debut,
  }
}

// 🎨 미리보기는 «골고루» 뽑는다 — ⛔한 그룹에서 다 뽑으면 정작 캐릭터가 하나도 안 보인다.
//    (2026-08-03 처음 만들었을 때 다섯 컷이 전부 낙엽이었다. 광고인데 주인공이 없었다.)
//    ⭐ 친구들(캐릭터) 탭을 «먼저» 돌려서 앞자리를 캐릭터가 차지하게 한다.
export function spread(items = [], max = 6) {
  const rows = [...items].sort((a, b) => (b.tab === 'buddies') - (a.tab === 'buddies')).map((i) => i.peek || [])
  const out = []
  for (let i = 0; out.length < max; i++) {
    let added = false
    for (const r of rows) { if (r[i] && out.length < max) { out.push(r[i]); added = true } }
    if (!added) break
  }
  return out
}

// 🍳 이번 주 레시피 = 오늘 이하 중 «가장 최근» 한 줄 (weeklyNow 와 같은 규칙).
//   ⛔ LIST 를 받는다 — 제철(`WEEKLY`)과 우리집(`HOMEMADE`)이 «같은 규칙»으로 열리기 때문이다.
//      규칙을 두 번 적으면 한쪽만 고쳐져 어긋난다(`weekly.js` 의 `열린줄()` 과 같은 생각).
function weekOpen(today, LIST = WEEKLY) {
  const past = LIST.filter((w) => w.from <= today).sort((a, b) => a.from.localeCompare(b.from))
  return past.length ? past[past.length - 1] : null
}

/**
 * 안내 페이지에 나갈 것.
 *   opened   = 최근 3주 안에 «열린» 것 (새로운 순)
 *   upcoming = 다음에 열릴 «한 날짜»의 것 전부 ＋ 며칠 남았는지
 *
 * ⭐ 앞으로 열릴 걸 «전부» 보여주지 않고 «다음 한 날짜»만 보여준다 —
 *    3개월치를 한꺼번에 늘어놓으면 기대가 아니라 «목록»이 되고, 김이 샌다.
 */
export function whatsNew(today = todayKST()) {
  const all = gates()

  const opened = all
    .filter((g) => g.when <= today && days(g.when, today) <= FRESH_DAYS)
    .sort((a, b) => b.when.localeCompare(a.when))

  // 🍳 이번 주 레시피도 «방금 열린 것»이다 — 이번 주에 시작했을 때만(지난주 것을 새것이라 하지 않는다).
  // 🏠 [2026-08-12] **우리집레시피도 같이 센다.**
  //   ⛔⛔ 여기가 `WEEKLY` 만 보고 있었다 — 우리집레시피는 **매주 2편이 저절로 열리는데
  //      소식이 한 마디도 안 했다.** 어제까진 그 박스가 아예 안 떠서 티가 안 났을 뿐이다.
  //   📮 창업자 2026-08-03 *"새로 열릴때 꼭 안내페이지에 올라오도록 해."* — 이 지시가 여기에도 걸린다.
  //      「매주 올라간다」는 «열리는 것»과 «알리는 것»이 짝이라야 완성된다.
  //   ⭐ 제철을 먼저 넣고 우리집을 그 앞에 unshift 한다 → 화면엔 **우리집이 위**로 온다.
  //      우리집레시피가 «우리만 가진 것»이라 먼저 말한다.
  for (const [LIST, 이름] of [[WEEKLY, '이번 주 레시피'], [HOMEMADE, '우리집레시피']]) {
    const w = weekOpen(today, LIST)
    if (w && days(w.from, today) <= 6) {
      opened.unshift({ when: w.from, kind: 이름, title: w.title, count: w.ids.length, why: w.why })
    }
  }

  const nextDate = all.filter((g) => g.when > today).map((g) => g.when).sort()[0] || null
  const 다음줄 = (LIST) => LIST.filter((x) => x.from > today).sort((a, b) => a.from.localeCompare(b.from))[0] || null
  const nextWeek = 다음줄(WEEKLY)
  const nextHome = 다음줄(HOMEMADE)   // 🏠 우리집레시피도 «곧 열릴 것»에 나와야 한다

  let upcoming = []
  let when = null
  // 다음 «문»과 다음 «주» 중 **먼저 오는 날짜**를 고른다.
  const cand = [nextDate, nextWeek?.from, nextHome?.from].filter(Boolean).sort()
  if (cand.length) {
    when = cand[0]
    upcoming = all.filter((g) => g.when === when)
    if (nextWeek && nextWeek.from === when) {
      upcoming = [{ when, kind: '이번 주 레시피', title: nextWeek.title, count: nextWeek.ids.length }, ...upcoming]
    }
    // ⭐ 우리집을 «맨 앞»에 — 열린 것과 같은 차례로 보이게 한다
    if (nextHome && nextHome.from === when) {
      upcoming = [{ when, kind: '우리집레시피', title: nextHome.title, count: nextHome.ids.length }, ...upcoming]
    }
  }

  return {
    today,
    opened,
    upcoming: upcoming.length ? { when, dday: days(today, when), items: upcoming } : null,
  }
}

// 🔖 «이 소식 묶음»을 가리키는 짧은 글자 — 팝업이 «봤나 안 봤나»를 이걸로 기억한다.
//   ⭐ 날짜＋제목으로 만든다 → 같은 소식이면 절대 두 번 안 뜨고,
//      새 소식이 열리면 값이 달라져 «그때 한 번» 뜬다.
//   ⛔ 날짜만 쓰면 안 된다 — 같은 날 두 가지가 열릴 때 하나만 보고 넘어간다.
export const newsSignature = (news) =>
  (news?.opened || []).map((o) => `${o.when}:${o.title}`).join('|')

