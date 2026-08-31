// 🔠🔠 [2026-08-21] 「글자 2단」을 «진짜 코드»에 넣는다 — 창업자 확정
//
// 📮 창업자 = *"쟤네는 큼직큼직하게 딱딱보여 **우리는 좀 다 작고 잘 안보이고**"*
//    → 시안 셋을 폰에서 보고 = *"아까 검수판은 **톤D 글자2**"* (2026-08-21 11:51 KST)
//
// ⭐ 「글자 2단」의 규칙 = **작은 글자일수록 «더» 키운다.**
//      v < 14  →  max(14, v + 2)      ← 바닥 14px (MD3 「최소 본문」 14sp)
//      v >= 14 →  v + 1               ← 큰 글자는 살짝만
//    ⛔ 전부 같은 배율로 곱하면 26px 제목이 32px 이 되어 «과해진다». 그래서 바닥을 두는 방식이다.
//
// ⛔⛔ **손으로 고치지 않는다** — 자리가 650곳이 넘는다(CSS 140 ＋ JSX 인라인 512).
//    손으로 하면 반드시 몇 개를 빠뜨리고, 빠뜨린 걸 «아무도 모른다».
//    ⭐ 그래서 ⑴기계로 바꾸고 ⑵**화면에 그려진 값으로 검증**한다(2026-08-17 문체통일과 같은 방식).
//
// ⛔ 안 건드리는 자리 — 이유가 «각각» 있다
//    ⓐ 꾸미기(레꾸·일꾸) = 창업자 확정 규격이다. 스티커 글자 크기는 이 판정과 무관하다
//    ⓑ 공유 카드(`ShareDrawCard`) = 1080×1350 고정 좌표계다. 글자를 키우면 판이 깨진다
//    ⓒ 온보딩 = 바깥 세션이 가입 흐름을 만지고 있다(세션 영역 분담)
//    ⓓ 요리 모드 글자(`.cook-steptext`) = **오늘 창업자가 크기를 콕 집어 정했다**(폰 28 · 패드 38).
//       여기에 ＋1 을 얹으면 «그 판정을 내가 뒤집는 것»이 된다
//
// 실행: cd /home/user/hankki/hankki && node scripts/_글자2적용-0821.mjs [--dry]
import { readFileSync, writeFileSync } from 'node:fs'
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const DRY = process.argv.includes('--dry')
const 글자2 = (v) => (v < 14 ? Math.max(14, v + 2) : v + 1)
const 다듬 = (n) => String(Math.round(n * 100) / 100)

// ⛔ 파일 통째로 건너뛰는 것 (위 ⓑⓒ ＋ 꾸미기 편집기)
const 건너뛸파일 = /(ShareDrawCard|DecorEditor|Onboarding)\.jsx$/
// ⛔ CSS 에서 건너뛸 «고르개» — 꾸미기·표지·스티커·요리 글자
const 건너뛸선택자 = /(decor|sticker|\.cover|memo-note|\.paper\b|cook-steptext|share-|draw-)/i

let 바뀐수 = 0
const 표 = []

// ── ① styles.css — 「지금 어느 고르개 안인가」를 따라가며 바꾼다 ──────────────
function CSS(경로) {
  const 원본 = readFileSync(경로, 'utf8')
  const 줄들 = 원본.split('\n')
  let 현재고르개 = ''
  const 나온줄 = 줄들.map((줄) => {
    // 고르개 줄 기억. ⛔⛔ 첫 판이 «`{` 로 끝나는 줄»만 봤는데, 우리 CSS 엔
    //    `.cook-steptext { font-size: 24px; … }` 처럼 **한 줄에 다 쓴 규칙**이 많다.
    //    그러면 고르개가 «앞 규칙» 이름으로 남아 건너뛸 목록에 안 걸린다 —
    //    미리보기(`--dry`) 를 눈으로 읽다 잡았다(절대원칙 21).
    const m = /^\s*([^{}]+)\{/.exec(줄)
    if (m && !m[1].trim().startsWith('@')) 현재고르개 = m[1].trim()
    if (!/font-size\s*:/.test(줄)) return 줄
    if (건너뛸선택자.test(현재고르개)) { 표.push(['⛔건너뜀', 현재고르개, 줄.trim()]); return 줄 }
    return 줄.replace(/font-size:\s*([0-9.]+)px/g, (전체, 숫자) => {
      const v = parseFloat(숫자)
      const n = 글자2(v)
      if (Math.abs(n - v) < 0.01) return 전체
      바뀐수++; 표.push(['✅', 현재고르개, `${v} → ${다듬(n)}px`])
      return `font-size: ${다듬(n)}px`
    })
  })
  const 나온글 = 나온줄.join('\n')
  if (!DRY && 나온글 !== 원본) writeFileSync(경로, 나온글)
  return 나온글 !== 원본
}

// ── ② JSX 인라인 `fontSize: 12` / `fontSize: 12.5` ─────────────────────────
function JSX(경로) {
  const 원본 = readFileSync(경로, 'utf8')
  const 나온글 = 원본.replace(/fontSize:\s*([0-9.]+)(?![0-9.]*\s*[a-zA-Z%])/g, (전체, 숫자) => {
    const v = parseFloat(숫자)
    const n = 글자2(v)
    if (Math.abs(n - v) < 0.01) return 전체
    바뀐수++; 표.push(['✅', 경로.split('/').pop(), `${v} → ${다듬(n)}`])
    return `fontSize: ${다듬(n)}`
  })
  if (!DRY && 나온글 !== 원본) writeFileSync(경로, 나온글)
  return 나온글 !== 원본
}

const 훑기 = (뿌리, 나온것 = []) => {
  for (const 이름 of readdirSync(뿌리)) {
    const p = join(뿌리, 이름)
    if (statSync(p).isDirectory()) 훑기(p, 나온것)
    else if (이름.endsWith('.jsx')) 나온것.push(p)
  }
  return 나온것
}

CSS('src/styles.css')
훑기('src').forEach((p) => {
  if (건너뛸파일.test(p)) { 표.push(['⛔건너뜀', p.split('/').pop(), '파일 통째로']); return }
  JSX(p)
})

const 건너뛴수 = 표.filter((r) => r[0] === '⛔건너뜀').length
console.log(`\n🔠 글자 2단 — 바꾼 자리 ${바뀐수}개 · 일부러 건너뛴 것 ${건너뛴수}개${DRY ? '  (미리보기 · 저장 안 함)' : ''}\n`)
표.filter((r) => r[0] === '⛔건너뜀').forEach((r) => console.log(`  ⛔ ${r[1]} — ${r[2]}`))
console.log('')
if (!바뀐수) { console.log('⛔ 한 자리도 안 바뀌었다 — 이미 넣었거나 찾는 모양이 틀렸다.'); process.exit(1) }
console.log('✅ 다음 = 화면에 «그려진» 값으로 검증한다 → node scripts/_repro-글자2-0821.mjs')
