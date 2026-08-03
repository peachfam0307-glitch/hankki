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
import { WEEKLY } from './weekly'
import { STICKER_GROUPS } from '../components/Stickers'
import { SEASON_CUTS } from './cardSeasons'

// ⏰ 오늘(KST). ⚠️ **함수로 둔다** — 모듈 상수로 굳히면 앱을 켜둔 채 자정을 넘길 때 안 바뀐다
//    (`ShareDrawCard` 의 `seasonCuts` 가 상수 아닌 함수인 것과 같은 이유).
export const todayKST = () =>
  new Date(Date.now() + (9 * 60 + new Date().getTimezoneOffset()) * 60000).toISOString().slice(0, 10)

const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000)

// 「방금」의 길이 = 3주. 매달 1일에 열리므로 3주면 **한 번은 반드시 본다**(월 1회 여는 주기보다 짧으면 놓친다).
const FRESH_DAYS = 21

// 🗂 날짜가 여는 문 전부 — 꾸미기 서랍 ＋ 레꾸자랑 카드.
//   ⚠️ `from` 이 없는 그룹(사철 기본)은 «열리는 사건»이 아니라 처음부터 있던 것 → 뺀다.
function gates() {
  const drawer = STICKER_GROUPS
    .filter((g) => g.from && g.items?.length)
    .map((g) => ({ when: g.from, kind: '꾸미기', title: g.label, count: g.items.length }))
  const cards = SEASON_CUTS
    .filter((s) => s.from)
    .map((s) => {
      const n = [...(s.gom || []), ...(s.peng || []), ...(s.duo || [])].length
      return { when: s.from, kind: '레꾸자랑 카드', title: `${s.label} 카드`, count: n }
    })
    .filter((c) => c.count > 0)
  return [...drawer, ...cards].sort((a, b) => a.when.localeCompare(b.when))
}

// 🍳 이번 주 레시피 = 오늘 이하 중 «가장 최근» 한 줄 (weeklyNow 와 같은 규칙).
function weekOpen(today) {
  const past = WEEKLY.filter((w) => w.from <= today).sort((a, b) => a.from.localeCompare(b.from))
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
  const w = weekOpen(today)
  if (w && days(w.from, today) <= 6) {
    opened.unshift({ when: w.from, kind: '이번 주 레시피', title: w.title, count: w.ids.length, why: w.why })
  }

  const nextDate = all.filter((g) => g.when > today).map((g) => g.when).sort()[0] || null
  const nextWeek = WEEKLY.filter((x) => x.from > today).sort((a, b) => a.from.localeCompare(b.from))[0] || null

  let upcoming = []
  let when = null
  // 다음 «문»과 다음 «주» 중 **먼저 오는 날짜**를 고른다.
  const cand = [nextDate, nextWeek?.from].filter(Boolean).sort()
  if (cand.length) {
    when = cand[0]
    upcoming = all.filter((g) => g.when === when)
    if (nextWeek && nextWeek.from === when) {
      upcoming = [{ when, kind: '이번 주 레시피', title: nextWeek.title, count: nextWeek.ids.length }, ...upcoming]
    }
  }

  return {
    today,
    opened,
    upcoming: upcoming.length ? { when, dday: days(today, when), items: upcoming } : null,
  }
}
