// 🍂 제철·전환기 테스트
//
// 왜 생겼나(2026-07-30): 창업자 — *"8월중순이면 여름에 준비한 아이템들은 정말 며칠 못하고
// 내년을 기약해야겠다..ㅠ"*. 8/31 자정에 여름이 뚝 끊기던 걸 **새 계절 첫 2주는 지난 계절도
// 함께 제철**로 바꿨다. 달력 경계는 눈으로 못 보고 지나가는 버그가 나는 자리라 값을 박아둔다.
//
// ⚠️ 특히 12월↔1월 넘어가는 자리(겨울이 두 해에 걸침)와 **2월→3월**(겨울 뒤 봄) 을 꼭 본다.
import { SEASON_AT, seasonsNow, isSeason, seasonRank, OVERLAP_DAYS, isReleased, inWindow, inCardWindow } from '../src/season.js'

let bad = 0
const D = (y, m, d) => new Date(y, m - 1, d)
const eq = (label, got, want) => {
  const g = JSON.stringify(got); const w = JSON.stringify(want)
  if (g === w) { console.log(`  ok  ${label} → ${g}`) } else { console.log(`  ✗   ${label} → ${g}  (원하는 값 ${w})`); bad++ }
}

console.log('── 월 → 계절 ──')
;[[1, 'winter'], [2, 'winter'], [3, 'spring'], [5, 'spring'], [6, 'summer'], [8, 'summer'],
  [9, 'autumn'], [11, 'autumn'], [12, 'winter']].forEach(([m, s]) => eq(`${m}월`, SEASON_AT(m), s))

console.log('\n── 계절 한복판 = 그 계절만 ──')
eq('7/15 (여름 한복판)', seasonsNow(D(2026, 7, 15)), ['summer'])
eq('8/31 (여름 마지막 날)', seasonsNow(D(2026, 8, 31)), ['summer'])
eq('10/1 (가을 둘째 달 1일 — 전환기 아님)', seasonsNow(D(2026, 10, 1)), ['autumn'])
eq('7/1 (여름 둘째 달 1일 — 전환기 아님)', seasonsNow(D(2026, 7, 1)), ['summer'])

console.log('\n── ⭐ 전환기 = 새 계절 첫 2주엔 지난 계절도 ──')
eq('9/1  (여름→가을 첫날)', seasonsNow(D(2026, 9, 1)), ['autumn', 'summer'])
eq(`9/${OVERLAP_DAYS} (전환기 마지막 날)`, seasonsNow(D(2026, 9, OVERLAP_DAYS)), ['autumn', 'summer'])
eq(`9/${OVERLAP_DAYS + 1} (전환기 끝난 다음 날)`, seasonsNow(D(2026, 9, OVERLAP_DAYS + 1)), ['autumn'])
eq('12/5 (가을→겨울)', seasonsNow(D(2026, 12, 5)), ['winter', 'autumn'])
eq('3/5  (겨울→봄)', seasonsNow(D(2027, 3, 5)), ['spring', 'winter'])
eq('6/5  (봄→여름)', seasonsNow(D(2027, 6, 5)), ['summer', 'spring'])

console.log('\n── 해를 넘기는 겨울(12↔1) — 1월은 12월과 같은 겨울이라 전환기가 아니어야 한다 ──')
eq('1/5  (겨울 계속)', seasonsNow(D(2027, 1, 5)), ['winter'])
eq('2/5  (겨울 계속)', seasonsNow(D(2027, 2, 5)), ['winter'])

console.log('\n── 여름 카드 스킨이 실제로 며칠 살아있나 (뽑기 풀에서 빠지는 판정) ──')
;[[8, 20, true], [8, 31, true], [9, 1, true], [9, 14, true], [9, 15, false], [10, 1, false]]
  .forEach(([m, d, want]) => eq(`${m}/${d} 여름 스킨`, isSeason('summer', D(2026, m, d)), want))

console.log('\n── 서랍 정렬 순위 (낮을수록 위) ──')
eq('9/5 가을', seasonRank('autumn', D(2026, 9, 5)), 0)
eq('9/5 여름', seasonRank('summer', D(2026, 9, 5)), 1)
eq('9/5 겨울', seasonRank('winter', D(2026, 9, 5)), 2)
eq('9/5 계절없음', seasonRank(undefined, D(2026, 9, 5)), 2)
eq('9/20 여름 (전환기 끝 — 계절없음과 같은 뒤쪽)', seasonRank('summer', D(2026, 9, 20)), 1)

console.log('\n── ⏳ 공개 시작일 (그날 전엔 서랍에 아예 안 나온다) ──')
;[['가을·추석 9/1', '2026-09-01'], ['핼러윈 10/1', '2026-10-01'], ['크리스마스 12/1', '2026-12-01']]
  .forEach(([label, from]) => {
    eq(`${label} — 7/30 (아직)`, isReleased(from, D(2026, 7, 30)), false)
    eq(`${label} — 공개 당일`, isReleased(from, new Date(from + 'T00:00:00')), true)
  })
eq('공개일 없으면 항상 보임', isReleased(undefined, D(2026, 7, 30)), true)
console.log('  ⭐ 한 번 공개되면 영구히 — 해가 바뀌어도 안 숨는다')
eq('핼러윈 — 이듬해 3월', isReleased('2026-10-01', D(2027, 3, 5)), true)
eq('크리스마스 — 이듬해 1월', isReleased('2026-12-01', D(2027, 1, 5)), true)
eq('크리스마스 — 이듬해 7월', isReleased('2026-12-01', D(2027, 7, 5)), true)

console.log('\n── 🍂 가을 세트가 실제로 언제 뜨고 어디에 놓이나 ──')
const SETS = [{ n: '가을', from: '2026-09-01', s: 'autumn' }, { n: '추석', from: '2026-09-01', s: 'autumn' },
  { n: '핼러윈', from: '2026-10-01', s: 'autumn' }, { n: '크리스마스', from: '2026-12-01', s: 'winter' }]
;[[2026, 7, 30], [2026, 9, 5], [2026, 10, 5], [2026, 12, 5]].forEach(([y, m, dd]) => {
  const now = D(y, m, dd)
  const line = SETS.map((x) => `${x.n}=${!isReleased(x.from, now) ? '숨김' : '순위' + seasonRank(x.s, now)}`).join(' · ')
  console.log(`  ${m}/${dd}  ${line}   (제철 ${JSON.stringify(seasonsNow(now))})`)
})

console.log('\n── 🗓 되풀이 창 (해마다 같은 날짜에 다시 열린다) ──')
eq('가을창 09-01~11-30 · 2026-09-05', inWindow(['09-01', '11-30'], D(2026, 9, 5)), true)
eq('가을창 · 2026-08-31 (아직)', inWindow(['09-01', '11-30'], D(2026, 8, 31)), false)
eq('가을창 · 2026-12-01 (닫힘)', inWindow(['09-01', '11-30'], D(2026, 12, 1)), false)
eq('⭐가을창 · 2027-09-05 (이듬해에도 열림)', inWindow(['09-01', '11-30'], D(2027, 9, 5)), true)
eq('핼러윈창 10-01~11-02 · 10/31', inWindow(['10-01', '11-02'], D(2026, 10, 31)), true)
eq('핼러윈창 · 11/03 (닫힘)', inWindow(['10-01', '11-02'], D(2026, 11, 3)), false)
console.log('  연말을 넘는 창(설날처럼) 도 되나')
eq('12-15~01-10 · 12/20', inWindow(['12-15', '01-10'], D(2026, 12, 20)), true)
eq('12-15~01-10 · 1/5 (해 넘어서)', inWindow(['12-15', '01-10'], D(2027, 1, 5)), true)
eq('12-15~01-10 · 2/1 (닫힘)', inWindow(['12-15', '01-10'], D(2027, 2, 1)), false)

console.log('\n── 🎴 카드 풀에 계절 컷이 들어가는 시점 (첫 공개일 + 창 둘 다) ──')
const CARD = [{ n: '가을', from: '2026-09-01', win: ['09-01', '11-30'] },
  { n: '추석', from: '2026-09-01', win: ['09-01', '10-15'] },
  { n: '핼러윈', from: '2026-10-01', win: ['10-01', '11-02'] },
  { n: '크리스마스', from: '2026-12-01', win: ['12-01', '12-27'] }]
const onAt = (now) => CARD.filter((s) => inCardWindow(s, now)).map((s) => s.n)
eq('7/30 (출시 전)', onAt(D(2026, 7, 30)), [])
eq('9/5', onAt(D(2026, 9, 5)), ['가을', '추석'])
eq('10/5', onAt(D(2026, 10, 5)), ['가을', '추석', '핼러윈'])
eq('10/20 (추석창 닫힘)', onAt(D(2026, 10, 20)), ['가을', '핼러윈'])
eq('11/20 (가을만)', onAt(D(2026, 11, 20)), ['가을'])
eq('12/20', onAt(D(2026, 12, 20)), ['크리스마스'])
eq('1/5 (다 닫힘)', onAt(D(2027, 1, 5)), [])
eq('⭐2027-09-05 (이듬해에도 가을·추석 열림)', onAt(D(2027, 9, 5)), ['가을', '추석'])

if (bad) { console.log(`\n❌ ${bad}건 실패`); process.exit(1) }
console.log('\n✅ 제철·전환기 전부 통과')
