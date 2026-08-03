// 📤📤 제출물 관문 — 「밖으로 나가는 글」은 콘솔 실물을 «먼저 받고» 쓴다.
//
// 왜 있나 (2026-08-03 · 창업자 *"만들어 진짜 이건 절대원칙이야"*):
//   창업자: *"너는 이걸 왜 이제야 파악해? 미리 이런 걸 나한테 캡처하라고 해서
//            **신청서 쓸 때 알려줘야 하는 거 아냐?**"* — **맞는 말이다.**
//
//   7/31 프로덕션 신청서를 쓸 때 나는 저장소에 있는 것만으로 답을 만들었다.
//   콘솔은 「내가 못 보는 곳」이라 **아예 안 물었다.** 그래서
//     · 릴리즈가 «일곱 판»인 걸 몰랐고 (문서엔 「하나뿐」이라 적혀 있었다 — 짐작이었다)
//     · 활성 기기가 「몰아서 며칠」 모양인 걸 몰랐고
//     · 답할 수 있었던 칸을 **「모른다」로 비워서 냈다**
//   → 2026-08-02 반려. **2주를 잃었다.**
//
// ⭐⭐ 근거 관문(`evidence.mjs`)과 무엇이 다른가 — **작동 시점이 다르다.**
//   · `evidence.mjs` = 내가 **말하려 할 때** 막는다 (틀린 말을 막는다)
//   · 이 관문      = 내가 **글을 쓰기 전에** 막는다 (**물어봤어야 하는데 안 물은 것**을 막는다)
//   8/02 사고는 «틀린 말»이 아니라 «안 물어본 것»이라 근거 관문으로는 못 잡는다.
//
// 📌 규칙 = **목록의 칸마다 「그 화면에서 읽은 값」을 적어야 한다.**
//    「받았다」·「확인함」 같은 말은 안 통한다 — 값이 없으면 안 본 것이다.
//
// 쓰는 법
//   node hankki/scripts/submission-gate.mjs --종류 재신청            # 뭘 받아야 하나 (목록)
//   node hankki/scripts/submission-gate.mjs --종류 재신청 \
//     --값 "활성기기30일=7/22 16 · 7/24 18 · 7/25 15 · 이후 0~2" \
//     --값 "출시내역=1,2,3,5,7,9,10 (일곱 판)" …
import { argv } from 'node:process'

// ── 제출물마다 «반드시 실물로 봐야 하는» 칸 ──
//    ⚠️ 칸을 늘릴 땐 «그 화면이 없으면 답을 못 쓰는가»로 판단한다. 있으면 좋은 건 넣지 않는다.
const NEED = {
  재신청: {
    what: '프로덕션 액세스 재신청 9문항',
    fields: {
      활성기기30일: '통계 → 활성 기기 30일 그래프 — 날짜별 숫자',
      출시내역: '비공개 테스트 → 출시 내역 — 버전 코드와 날짜 전부',
      참여테스터수: '프로덕션 액세스 화면 — 「참여를 선택한 테스터 N명」',
      재사용자비율: '통계 → 재사용자 수',
      사전출시보고서: '사전 출시 보고서 — 있으면 결과, 없으면 「없음」',
      의견응답수: '구글 폼 응답 탭 — 건수',
    },
  },
  스토어등록: {
    what: '스토어 등록정보(이름·설명·스크린샷)',
    fields: {
      현재등록정보: '스토어 등록정보 화면 — 지금 올라가 있는 이름·짧은 설명',
      현재스크린샷: '스크린샷 칸 — 지금 올라가 있는 장수와 내용',
      게시상태: '게시 개요 — 대기 중인 변경이 있나',
    },
  },
  설문: {
    what: '구글 폼(설문·의견·오류)',
    fields: {
      현재문항: '폼 편집 화면 — 지금 들어 있는 문항',
      응답수: '응답 탭 — 건수',
    },
  },
  데이터보안: {
    what: 'Play 데이터 보안 신고',
    fields: {
      현재신고: '데이터 보안 화면 — 지금 신고돼 있는 내용',
    },
  },
}

const args = argv.slice(2)
const get = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null }
const all = (k) => args.map((a, i) => (a === k ? args[i + 1] : null)).filter(Boolean)

const kind = get('--종류')
const spec = NEED[kind]

if (!spec) {
  console.error(`\n⛔ --종류 를 골라라: ${Object.keys(NEED).join(' | ')}\n`)
  process.exit(1)
}

const given = {}
for (const v of all('--값')) {
  const at = v.indexOf('=')
  if (at > 0) given[v.slice(0, at).trim()] = v.slice(at + 1).trim()
}

const keys = Object.keys(spec.fields)
const missing = keys.filter((k) => !given[k] || given[k].length < 2)
// 「확인함」·「받았음」 같은 빈 말은 값이 아니다 — 화면에서 읽은 «내용»이라야 한다
const EMPTY = /^(확인|확인함|받음|받았음|봤음|ok|o|예|네|있음|정상)$/i
const hollow = keys.filter((k) => given[k] && EMPTY.test(given[k].trim()))

if (missing.length || hollow.length) {
  console.error(`\n⛔ 「${spec.what}」 — 실물을 먼저 받아야 한다.\n`)
  if (missing.length) {
    console.error('   📸 창업자에게 이 화면들을 요청한다:\n')
    for (const k of missing) console.error(`      · ${k}\n          ${spec.fields[k]}`)
  }
  if (hollow.length) {
    console.error(`\n   ⚠️ 값이 «빈 말»이다 — 화면에서 «읽은 내용»을 적어야 한다: ${hollow.join(' · ')}`)
    console.error('      (「확인함」은 값이 아니다. 「7/22 16 · 7/24 18」처럼 숫자·글자를 적는다)')
  }
  console.error(`\n   ⛔ 이게 채워지기 전엔 초안을 «쓰지 않는다».`)
  console.error(`   📌 2026-08-02 반려가 정확히 이 칸이었다 — 콘솔을 안 물어보고 「모른다」로 냈다.\n`)
  process.exit(1)
}

console.log(`\n✅ 제출물 관문 통과 — 「${spec.what}」\n`)
for (const k of keys) console.log(`   📸 ${k} — ${given[k]}`)
console.log(`\n   이제 초안을 쓴다. ⚠️ 위 값이 «그대로» 답변에 들어가야 한다 — 다시 짐작하지 말 것.\n`)
