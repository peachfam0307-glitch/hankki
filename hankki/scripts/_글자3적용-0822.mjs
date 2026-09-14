// 🔠 [2026-08-22] 「글자 3단」 — 창업자가 «갈래를 나눠» 말했다
//
// 📮 창업자 = *"폰에 글자를 좀더 키울 수 있어? **특히 레시피상세부분 재료, 만드는법이 아직도 좀 작게 느껴져**"*
//    → *"**홈이랑 다른 탭은 조금만 더 크면 되고 상세는 좀 커져야 할 것 같아.**"*
//
// ⭐⭐ **두 가지 크기다 — 한 값으로 밀면 안 된다.**
//    ⓐ 탭 화면(홈·레시피·일기·장보기·레꾸자랑) = **＋1px** (「조금만 더」)
//    ⓑ 레시피 상세의 **재료·만드는 법** = 따로 «더» 올린다 (아래 `상세` 표 · 이 파일 밖에서 CSS 로)
//
// ⛔⛔ **큰 글자는 안 올린다** — 20px 이상은 그대로 둔다.
//    어제 글자2 로 제목이 26 → 27px 이 됐다. 여기서 또 밀면 「한끼」가 29px 이 되어 과해진다.
//    창업자가 말한 건 «본문이 작다»이지 «제목이 작다»가 아니다.
//
// ⛔ 안 건드리는 자리 — 어제와 «같다»(이유도 같다)
//    ⓐ 꾸미기(레꾸·일꾸) = 창업자 확정 규격  ⓑ 공유 카드 = 1080×1350 고정 좌표계
//    ⓒ 온보딩 = 바깥 세션  ⓓ 요리 모드 글자 = 창업자가 28/38px 로 콕 집어 정했다
//
// 실행: cd /home/user/hankki/hankki && node scripts/_글자3적용-0822.mjs [--dry]
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const DRY = process.argv.includes('--dry')
// ⭐ 「조금만 더」 = ＋1px · ⛔20px 이상은 그대로(제목이 부푸는 걸 막는다)
const 글자3 = (v) => (v < 20 ? v + 1 : v)
const 다듬 = (n) => String(Math.round(n * 100) / 100)

const 건너뛸파일 = /(ShareDrawCard|DecorEditor|Onboarding)\.jsx$/
const 건너뛸선택자 = /(decor|sticker|\.cover|memo-note|\.paper\b|cook-steptext|share-|draw-)/i

let 바꾼수 = 0
const 건너뜀 = []

function CSS(경로) {
  const 원본 = readFileSync(경로, 'utf8')
  let 현재고르개 = ''
  const 나온글 = 원본.split('\n').map((줄) => {
    // ⚠️ 한 줄에 다 쓴 규칙(`.x { font-size: 24px; … }`)도 잡아야 한다 — 어제 이걸 놓쳐
    //    `.cook-steptext` 가 건너뛸 목록에 «안» 걸렸다(미리보기를 눈으로 읽다 잡았다).
    const m = /^\s*([^{}]+)\{/.exec(줄)
    if (m && !m[1].trim().startsWith('@')) 현재고르개 = m[1].trim()
    if (!/font-size\s*:/.test(줄)) return 줄
    if (건너뛸선택자.test(현재고르개)) { 건너뜀.push(현재고르개); return 줄 }
    return 줄.replace(/font-size:\s*([0-9.]+)px/g, (전체, 숫자) => {
      const v = parseFloat(숫자); const n = 글자3(v)
      if (Math.abs(n - v) < 0.01) return 전체
      바꾼수++
      return `font-size: ${다듬(n)}px`
    })
  }).join('\n')
  if (!DRY && 나온글 !== 원본) writeFileSync(경로, 나온글)
}

function JSX(경로) {
  const 원본 = readFileSync(경로, 'utf8')
  const 나온글 = 원본.replace(/fontSize:\s*([0-9.]+)(?![0-9.]*\s*[a-zA-Z%])/g, (전체, 숫자) => {
    const v = parseFloat(숫자); const n = 글자3(v)
    if (Math.abs(n - v) < 0.01) return 전체
    바꾼수++
    return `fontSize: ${다듬(n)}`
  })
  if (!DRY && 나온글 !== 원본) writeFileSync(경로, 나온글)
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
훑기('src').forEach((p) => { if (건너뛸파일.test(p)) { 건너뜀.push(p.split('/').pop()); return } JSX(p) })

console.log(`\n🔠 글자 3단(＋1px · 20px 이상 제외) — 바꾼 자리 ${바꾼수}개 · 건너뛴 자리 ${[...new Set(건너뜀)].length}종${DRY ? '  (미리보기)' : ''}`)
console.log(`   건너뜀: ${[...new Set(건너뜀)].slice(0, 8).join(' · ')}${[...new Set(건너뜀)].length > 8 ? ' …' : ''}\n`)
if (!바꾼수) { console.log('⛔ 한 자리도 안 바뀌었다 — 이미 넣었거나 찾는 모양이 틀렸다.'); process.exit(1) }
