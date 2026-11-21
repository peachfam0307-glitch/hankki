// 🔍 SNS 편 «원본 대조» 관문 — 창업자 검수 대신 «기계 대조»로 낸다
//   📮 창업자 2026-11-21 = "네가 검수한 건 다시 원본이랑 비교해서, 맞으면 그대로 내. 내 레시피가 아니라 내가 검수하는 게 의미가 없어"
//                        + "레시피는 네가 진짜 꼼꼼하게 검수해야 해. 도구를 만들어서 제대로 검사해"
//   ⭐ 대상 = basics.js 에서 `review: '원본대조'` 인 편만 (창업자 검수 편은 대상 밖)
//   ⭐ 원문 = docs/원본설명/<영상id>.txt (받은 날 스냅샷 — 영상이 고쳐지거나 지워져도 근거가 남는다)
//   ✅ 보는 것 넷
//      ① 원문 스냅샷이 있나 · sourceUrl 이 그 영상인가
//      ② 재료 줄마다 — 재료 이름이 원문에 있나 · 숫자(양)가 원문에 있나
//      ③ 만드는 법 줄마다 — 숫자(시간·양·온도)가 원문에 있나
//      ④ 거꾸로 — 원문 «재료 칸»의 재료가 레시피에서 빠지지 않았나
//   ⛔ 표기만 다른 것(고추가루↔고춧가루 · 2-3↔2~3 · 스푼↔큰술)은 `같은말` 로 맞춘다 — 새 표기는 여기에 «이유와 함께» 더한다
//   ⛔ 하나라도 틀리면 exit 1 (배포가 막힌다) — 틀린 채 나가는 것보다 막히는 게 낫다(절대원칙 34)
//   🧪 규칙 12 = 일부러 수량·재료·순서 숫자를 틀리게 바꿔 exit 1 확인(아래 --시험)
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(new URL('..', import.meta.url).pathname)
const src = readFileSync(join(ROOT, 'src/data/basics.js'), 'utf8')

// 표기만 다른 말 — 양쪽을 같은 꼴로 바꾼 뒤 비교한다
const 같은말 = [
  [/고추가루/g, '고춧가루'],   // 맞춤법(창업자 2026-11-21 대조 때 확인)
  [/(\d)\s*-\s*(\d)/g, '$1~$2'], // 2-3분 ↔ 2~3분
  [/스푼|숟갈|숟가락|T(?![a-z])/g, '큰술'],
  [/작은스푼|t(?![a-z])/g, '작은술'],
  [/쳉궈|헹궈/g, '헹궈'],
  [/(\d)\s*cc/g, '$1ml'], [/mL/g, 'ml'], // 300cc = 300ml
  [/작은술\s*1\s*큰술/g, '1작은술'], // 10분 홍합 미역국 원문 「국간장 작은술 1큰술(5ml)」 = 1작은술(5ml) — 원문이 그렇게 썼다
  [/한\s?(톨|줌|바퀴|꼬집|개|장|마리|대|모|쪽)/g, '1$1'],   // 생강 한톨 = 1톨
]
const 꼴 = (s) => {
  let x = String(s)
  for (const [a, b] of 같은말) x = x.replace(a, b)
  return x.replace(/[\s·,()（）\[\]{}【】~]/g, '')
}
// ⛔ 숫자는 띄어쓰기를 살린 채 뽑는다 — 꼴()은 빈칸을 지워서 「1.5리터 2…」가 「1.5리터2」로 붙어 «12»가 생긴다(규칙 12 시험에서 실제로 놓쳤다)
const 숫자들 = (s) => { let x = String(s); for (const [a, b] of 같은말) x = x.replace(a, b); return x.match(/\d+(?:[./]\d+)*/g) || [] }

// 편 뽑기 — check-review.mjs 와 같은 잣대(`{ ...base, … }` 한 덩어리)
const 편들 = []
for (const m of src.matchAll(/\{\s*(?:\/\/[^\n]*\n\s*)*\.\.\.base,([\s\S]*?)\n  \},/g)) {
  const b = m[1]
  // 🔎 --전부 = 유튜브 원본이 있는 SNS 편 «모두» (창업자 2026-11-21 「다른 레시피들도 다시 검수해서 틀린 거 있나 찾아봐」) — 관문(배포 막기)은 여전히 '원본대조' 편만
  if (!process.argv.includes('--전부') && !/review:\s*'원본대조'/.test(b)) continue
  if (process.argv.includes('--전부') && !/sourceUrl:\s*'[^']*youtu/.test(b)) continue
  const 글 = (k) => { const r = b.match(new RegExp(`${k}:\\s*'([^']*)'`)); return r ? r[1] : '' }
  const 목록 = (k) => { const r = b.match(new RegExp(`${k}:\\s*\\[([\\s\\S]*?)\\n    \\]`)); return r ? [...r[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((x) => x[1]) : [] }
  편들.push({ title: 글('title'), url: 글('sourceUrl'), 재료: 목록('ingredients'), 순서: 목록('steps') })
}

let 문제 = 0
const 말 = (t, s) => { 문제++; console.log(`   ⛔ ${t} — ${s}`) }
for (const r of 편들) {
  const id = (r.url.match(/(?:youtu\.be\/|v=|shorts\/)([\w-]{11})/) || [])[1]
  const p = id && join(ROOT, 'docs/원본설명', `${id}.txt`)
  if (!p || !existsSync(p)) { 말(r.title, `원문 스냅샷 없음 (docs/원본설명/${id || '?'}.txt)`); continue }
  const 원문 = readFileSync(p, 'utf8')
  // 📭 설명란에 «분량 줄»이 둘도 없으면 = 레시피가 영상 안에만 있다 → 글자 대조가 안 된다(헛경보 수십 건 대신 한 줄로 알린다 · 영상 보고 대조할 몫)
  // ⛔ 줄이 아니라 «분량 개수»로 센다 — 재료를 한 줄에 쉼표로 늘어놓은 원문도 있다(부추 홍합전 · 줄로 셌다가 헛경보)
  const 분량줄 = (원문.match(/\d\s*(g|kg|ml|리터|L|큰술|작은술|스푼|숟갈|T|t|개|장|컵|cm|포|마리|줌|모|봉|알|쪽|대|송이)(?![a-zA-Z])/g) || []).length
  if (분량줄 < 2) { 말(r.title, `📭 설명란에 레시피가 없다(분량 줄 ${분량줄}) — 영상 보고 대조해야 한다`); continue }
  const 원 = 꼴(원문)
  const 원숫자 = new Set(숫자들(원문))
  for (const x of r.재료) {
    if (/^\[.*\]$/.test(x)) continue
    const 이름 = x.split(/[\s(]/)[0]
    if (이름 && !원.includes(꼴(이름))) 말(r.title, `재료 이름이 원문에 없다: 「${x}」`)
    for (const n of 숫자들(x)) if (!원숫자.has(n)) 말(r.title, `재료 양이 원문과 다르다: 「${x}」 (${n})`)
    // ⑵-2 «짝» 대조 — 그 재료 이름 «바로 뒤»(같은 줄·쉼표 전)에 그 양이 있나
    //   ⛔ 숫자만 원문 «어딘가»에 있으면 통과하던 구멍 — 견과류 멸치볶음 진간장 1큰술→1작은술 · 청주 4→2 를 놓쳤다(2026-11-21)
    const 양 = (꼴(x.replace(/\([^)]*\)/g, '')).match(/(\d+(?:[./]\d+)?)([가-힣a-zA-Z]+)/) || [])
    if (이름 && 양[1] && 원.includes(꼴(이름))) {
      const 창들 = []
      for (let i = 원.indexOf(꼴(이름)); i >= 0; i = 원.indexOf(꼴(이름), i + 1)) 창들.push(원.slice(i, i + 꼴(이름).length + 24))
      const 맞음 = 창들.some((w) => w.includes(양[1] + 양[2]) || w.includes(양[1] + 양[2].slice(0, 1)))
      if (!맞음) 말(r.title, `재료 양이 원문 그 재료 옆 양과 다르다: 「${x}」 ↔ 원문 「${(창들[0] || '').slice(0, 24)}」`)
    }
  }
  for (const s of r.순서) for (const n of 숫자들(s)) if (!원숫자.has(n)) 말(r.title, `만드는 법 숫자가 원문에 없다: 「${s.slice(0, 40)}…」 (${n})`)
  // ④ 거꾸로 — 원문의 «재료 칸»(재료 머리 ~ 만드는 법 머리 사이) 줄마다 첫 낱말이 레시피 재료에 있나
  const 칸 = 원문.split('\n')
  // 「재료」 머리가 없는 원문도 있다(굴 배춧국 = 제목 줄 다음 바로 재료) → 없으면 맨 위부터
  // ⛔ 머리 줄 = «짧은 줄»만 — 「벌써 11년째 정착중인 굴국 레시피!!!」 같은 소개 문장을 머리로 잡으면 재료 칸이 비어 «빠진 재료»를 못 본다(규칙 12 시험에서 대파를 놓쳤다)
  const 머리 = (l) => l.replace(/[^가-힣a-zA-Z]/g, '').length <= 8
  const 시작 = Math.max(0, 칸.findIndex((l) => /재료/.test(l) && 머리(l)))
  const 끝 = 칸.findIndex((l, i) => i > 시작 && 머리(l) && /(만드는|만들기|레시피|조리|순서|만드\s?는)/.test(l) && !/재료/.test(l))
  if (끝 > 시작) {
    const 레 = 꼴(r.재료.join(' '))
    for (const l of 칸.slice(시작 + 1, 끝)) {
      for (const 조각 of l.split(/[,，]/)) {
        // 재료 줄처럼 생긴 조각만(양이 붙어 있다) — 설명 문장(「굴을 체에…」)은 재료가 아니다
        if (!/\d\s*(g|kg|ml|리터|L|큰술|작은술|숟갈|스푼|T|t|개|장|컵|cm|포|마리|줌|모|봉|알|쪽|대|송이|단|근|팩|인분|공기)|약간|적당|한\s?줌|조금|취향|한\s?꼬집/.test(조각)) continue // ⛔ 「11년째」「15분」 같은 소개 문장 숫자는 재료가 아니다 — 재료 단위가 붙은 것만
        const w = 조각.replace(/^[\s\-•·※✔️▶①-⑳\d.)]+/, '').split(/[\s(:0-9]/)[0]
        if (w && w.length >= 2 && /^[가-힣]+$/.test(w) && !/양념|재료|기준|분량|계량|소스|주재료|선택|약간|적당/.test(w) && !레.includes(꼴(w))) 말(r.title, `원문 재료가 레시피에서 빠졌다: 「${w}」`)
      }
    }
  }
}
console.log(`🔍 원본 대조 관문 — review:'원본대조' ${편들.length}편 · 문제 ${문제}건`)
process.exit(문제 ? 1 : 0)
