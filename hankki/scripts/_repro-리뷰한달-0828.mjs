// 🗓 「리뷰는 한 달 뒤에 한 번 더」 — 창업자 확정 2026-08-28
//
// 📮 창업자 = *"1개월 뒤에 한 번 물어보기로하자(리뷰)"*
//
// ⛔⛔ **왜 바뀌었나 — 옛 규칙(평생 한 번)이 «창업자 기기 둘 다»를 영영 막고 있었다.**
//    `REVIEW_AT = 3` 이라 일기 3개만 넘으면 리뷰창이 뜨는데, 창업자는 폰·패드 둘 다 한참 전에 넘겼다.
//    → 몇 달 전에 한 번 뜬 뒤 「물어봤음」이 박혀서 **v11.74·v11.77 로 «길»을 고쳐도 안 떴다.**
//    📌 내가 그걸 «세 번» 놓쳤다 — 코드를 읽고도 「창업자가 못 봤다니까 표시는 없겠지」로 넘겼다.
//       그건 확인이 아니라 짐작이었다(규칙 29).
//
// ⭐⭐ 이 판의 심장 = **「옛 값 `'1'` 을 가진 사람에게 «다시» 뜨나」**(＝창업자 기기).
//    그게 안 되면 창업자는 앞으로도 영영 못 본다 — 다른 칸이 다 초록불이어도 소용없다.
//
// ⛔ 브라우저를 안 띄운다 — 이건 «날짜 셈»이라 순수 함수로 잰다(빠르고 안 흔들린다).
//    ⚠️ 대신 `localStorage` 가 없으면 `nudges.js` 가 못 도니 최소한만 흉내 낸다.
//
// 실행: cd /home/user/hankki/hankki && node scripts/_repro-리뷰한달-0828.mjs
globalThis.localStorage = {
  _s: {},
  getItem(k) { return this._s[k] ?? null },
  setItem(k, v) { this._s[k] = String(v) },
  removeItem(k) { delete this._s[k] },
}

const { shouldAskReviewNow, markReviewAsked, REVIEW_AGAIN_DAYS } = await import('../src/nudges.js')
const { todayKST } = await import('../src/today.js')

const 오늘 = todayKST()
const 며칠전 = (n) => new Date(Date.parse(`${오늘}T00:00:00Z`) - n * 86400000).toISOString().slice(0, 10)
const K = 'hankki:nudge:review'
const 심고재기 = (v) => { if (v === null) delete localStorage._s[K]; else localStorage._s[K] = v; return shouldAskReviewNow() }

let 통과 = 0, 실패 = 0
const chk = (이름, 값, 기대) => {
  const ok = 값 === 기대
  console.log(`  ${ok ? '✅' : '⛔'} ${이름.padEnd(34)} → ${값}${ok ? '' : `   (기대 ${기대})`}`)
  ok ? 통과++ : 실패++
}

console.log(`\n🗓 리뷰 다시 묻기 = ${REVIEW_AGAIN_DAYS}일\n`)
chk('한 번도 안 물었다 → 묻는다', 심고재기(null), true)
// ⭐⭐ 이 칸이 이 판의 이유다 — 창업자 폰·패드가 정확히 이 상태다
chk("옛 값 '1' → 다시 묻는다 ⭐", 심고재기('1'), true)
chk('오늘 물었다 → 안 묻는다', 심고재기(오늘), false)
chk(`${REVIEW_AGAIN_DAYS - 1}일 전 → 안 묻는다`, 심고재기(며칠전(REVIEW_AGAIN_DAYS - 1)), false)
chk(`${REVIEW_AGAIN_DAYS}일 전 → 다시 묻는다`, 심고재기(며칠전(REVIEW_AGAIN_DAYS)), true)
chk('100일 전 → 다시 묻는다', 심고재기(며칠전(100)), true)

// 🧪 물어본 «그 순간» 날짜가 박히나 — 옛 판은 '1' 을 박아서 언제인지 몰랐다
delete localStorage._s[K]
markReviewAsked()
chk('물어보면 «날짜»가 박힌다', localStorage._s[K], 오늘)
chk('그 직후엔 안 묻는다', shouldAskReviewNow(), false)

// ⛔ 이상한 값이 들어와도 앱이 안 죽고 «묻는 쪽»으로 떨어진다(못 읽으면 한 번 더 뜰 뿐)
chk('망가진 값 → 묻는다(안 죽는다)', 심고재기('어제쯤'), true)
chk('빈 문자열 → 묻는다', 심고재기(''), true)

console.log(`\n${실패 ? '⛔' : '✅'} ${통과}/${통과 + 실패}\n`)
process.exit(실패 ? 1 : 0)
