// 「모른다」고 적어놓고 «그 위에서 추천»한 문서를 잡는다.
//
// 왜 있나 (2026-08-03 새벽 사고):
//   제휴 프로그램 문서에 나는 정직하게 적었다 —
//     *"네이버 커넥트 약관 원문의 「금지 채널」 조항을 찾지 못했다. **앱 가능 여부는 미확인.**"*
//   그래놓고 같은 문서의 비교표엔 **✅ 심사 없음·즉시** 를 박고, 추천 순서 **②번**에 올렸다.
//   창업자가 실제 화면을 열어보고 *"네이버는 인플루언서여야 되던데"* → 통째로 틀렸다.
//
// ⭐⭐ 뿌리 = **한계를 「적는 것」과 그 한계 위에서 「추천하지 않는 것」은 다른 일이다.**
//    나는 앞엣것만 했다. 적어두면 정직한 줄 알았는데, 정작 창업자가 읽는 건 표와 추천이다.
//    📌 **미확인은 추천에 올리지 않는다. 「확인 필요」로만 둔다.**
//
// ⛔ 시끄러운 게이트는 죽은 게이트다 (v9.16 교훈) → 아주 좁게 본다:
//    ① 「미확인」류 표현이 있는 문서만
//    ② 그 문장에서 **대상 이름**을 뽑아
//    ③ 같은 문서의 **✅ 가 붙은 줄이나 「추천/순서」 절**에 그 이름이 있으면 경고
//    그래도 안 걸리는 게 훨씬 많다 — **이건 「다 잡는 그물」이 아니라 「오늘 그 모양」을 막는 못이다.**
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const DOCS = new URL('../docs/', import.meta.url).pathname

// 「모른다」를 뜻하는 말. ⚠️ 「확인 완료」·「확인했다」와 헷갈리면 안 되므로 좁게.
const UNSURE = /(미확인|확인 못|확인하지 못|못 읽었|못 열었|못 찾았|알 수 없|추측|불명확|명시가 없|명시 없)/
// 「밀고 있다」를 뜻하는 표시
const PUSHING = /(✅|추천|권장|먼저 하|①|②|③)/

// ⭐⭐ 대상 이름은 «문서 제목(헤딩)»에서 뽑는다.
//   ⛔ 처음엔 볼드(**…**)·낫표 안에서 뽑게 짰는데 **오늘 사고를 못 잡았다** —
//      정작 「네이버 커넥트」는 맨 글자로 적혀 있었다.
//      📌 규칙 12 교훈 그대로: **만들면 옛 값으로 돌려봐야 내 가정이 틀린 걸 안다.**
//   헤딩은 그 문서가 «무엇을 다루는지»의 목록이라 이름이 거기 다 있다.
const HEAD_JUNK = /[#*_`~]|[\u{1F000}-\u{1FAFF}]|[\u{2190}-\u{27BF}]|[0-9️⃣]/gu
// 어느 문서에나 나오는 말 — 이름이 아니다
const STOP = new Set(('확인 순서 비교표 요약 출처 한계 규칙 폴더 참고 프로그램 제휴 쇼핑 가입 수수료 코드 정리 ' +
  '문서 내용 방법 기록 결정 사고 원인 해법 장치 검사 대상 조건 기준 정산 사업자 링크 채널 앱에 ' +
  // ⚠️ 우리 문서에 «늘» 나오는 말 — 이름이 아니다(52건 오탐의 절반이 이것들이었다)
  '창업자 클로드 구글 스토어 테스트 콘솔 저장소 레시피 스티커 아이콘 프레임 캐릭터 배포 버전').split(' '))
// 서술어·부사는 이름이 아니다 (이미·있다·않는·아직·다시 …)
const NOT_NAME = /(다|는|은|을|를|에|도|만|서|고|며|면|야|지|께|나)$/

const nameCandidates = (src) => {
  const words = new Set()
  for (const l of src.split('\n')) {
    if (!/^#{1,3}\s/.test(l)) continue
    const head = l.replace(HEAD_JUNK, ' ')
    const [front, ...rest] = head.split(/[—–]/)
    const back = rest.join(' ')
    // ⭐ 제목의 «본체»(— 앞) 하나 + 「·」로 나열된 목록(— 뒤에 ·가 있을 때만)
    //    ⛔ 낱말을 다 쪼갰더니 「이미」·「다시」·「필요」까지 이름이 돼 108개 문서에서 18건이 떴다.
    //       제목 본체만 보면 그런 부사가 애초에 안 들어온다.
    const cands = [front]
    if (/·/.test(back)) cands.push(...back.split(/[·,／/]/))
    for (const c of cands) {
      const n = c.trim().replace(/\s+/g, ' ').replace(/^[\s:：]+|[\s:：]+$/g, '')
      if (n.length < 2 || n.length > 12 || STOP.has(n)) continue
      if (/^[a-zA-Z]{1,2}$/.test(n)) continue
      if (/^[가-힣]{2,3}$/.test(n) && NOT_NAME.test(n)) continue
      words.add(n)
      // 「네이버 쇼핑 커넥트」처럼 여러 낱말이면 «첫 낱말»도 후보 —
      // 본문에선 「네이버 커넥트」처럼 줄여 쓰는 일이 흔하다(오늘 사고가 정확히 그랬다).
      const first = n.split(' ')[0]
      if (first.length >= 2 && first !== n && !STOP.has(first)) words.add(first)
    }
  }
  // ⭐ 고유명사는 «본문에서 되풀이된다». 제목에만 한 번 나온 말은 이름으로 안 친다.
  return [...words].filter((n) => src.split(n).length - 1 >= 3)
}

const only = process.argv.slice(2).filter((a) => !a.startsWith('-'))
const files = only.length
  ? only
  : readdirSync(DOCS).filter((f) => f.endsWith('.md')).map((f) => join(DOCS, f))

const warns = []
for (const f of files) {
  let src
  try { src = readFileSync(f, 'utf8') } catch { continue }
  const lines = src.split('\n')
  const names = nameCandidates(src)
  if (!names.length) continue

  // ① 「모른다」 줄에 그 이름이 «주어 자리»(앞머리)에 있으면 = 이건 아직 모르는 것
  //    ⭐ 앞자리로 좁히는 게 핵심이다 — 흔한 낱말이 문장 «중간»에 우연히 섞인 것을 걷어낸다.
  //       (안 좁혔을 때 108개 문서에서 52건이 떴다 = 시끄러워서 아무도 안 보는 게이트)
  const HEAD_N = 30
  const unsure = new Map()   // 이름 → 그렇게 적은 줄번호
  for (const [i, l] of lines.entries()) {
    if (!UNSURE.test(l)) continue
    const head = l.replace(/^[\s\-*>|#]+/, '').slice(0, HEAD_N)
    for (const n of names) if (head.includes(n) && !unsure.has(n)) unsure.set(n, i + 1)
  }
  if (!unsure.size) continue

  // ② 같은 문서에서 그 이름을 «밀고 있는» 줄 찾기
  for (const [i, l] of lines.entries()) {
    if (!PUSHING.test(l) || UNSURE.test(l)) continue
    for (const [n, at] of unsure) {
      if (Math.abs(i + 1 - at) < 3) continue      // 바로 옆줄이면 같은 문단 — 경고 아님
      if (!l.includes(n)) continue
      warns.push({ f, name: n, unsureAt: at, pushAt: i + 1, push: l.trim() })
    }
  }
}

if (!warns.length) {
  console.log(`✅ 「모른다 해놓고 추천」 없음 — 문서 ${files.length}개`)
  process.exit(0)
}

// ⚠️ 실패가 아니라 «경고» 다 — 이 검사는 글을 읽고 판단하는 일이라 오탐이 있을 수밖에 없다.
//    배포를 막으면 시끄러워서 곧 꺼버리게 된다. **눈에 띄게만** 한다.
console.log(`\n⚠️  「모른다」고 적어놓고 «그 위에서 밀고 있는» 곳 ${warns.length}군데\n`)
const seen = new Set()
for (const w of warns) {
  const key = w.f + w.name
  if (seen.has(key)) continue
  seen.add(key)
  console.log(`   ${w.f.replace(DOCS, 'docs/')}`)
  console.log(`     「${w.name}」 — ${w.unsureAt}줄에서 «모른다» 해놓고 ${w.pushAt}줄에서 밀고 있다`)
  console.log(`     ${w.push.slice(0, 120)}`)
}
console.log(`\n👉 둘 중 하나를 한다:`)
console.log(`   ① 확인한다 (원문·실물을 본다 — 블로그 요약은 확인이 아니다)`)
console.log(`   ② 추천에서 내리고 「확인 필요」로만 둔다`)
console.log(`   ⛔ 한계를 적어두는 건 면죄부가 아니다 — 창업자가 읽는 건 표와 추천이다.\n`)
