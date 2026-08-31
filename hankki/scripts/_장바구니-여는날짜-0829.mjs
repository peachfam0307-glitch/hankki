// 🗓🗓 주부의 장바구니 — 새로 들어온 제품에 «여는 날짜(`from`)»를 박는다.
//
//   📮 창업자 확정 2026-08-29 = **"그럼 1주에 3개씩 올리자"**
//      (2026-08-09 원문 = *"2주마다 2개씩 올리자… 많아지면 1주로 바꾸거나 하면 되니까"* → 재고가 많아져 3개로)
//   📮 ＋ *"많이 쓰는 제품들이니까 소개하는게 좋지."* · *"장바구니는 영원히 업뎃할필요는 없잖아"*
//
//   ⛔⛔ **왜 필요한가** — 2026-08-28 v11.78 이 **한 번에 82개**를 열었다(42 → 124).
//      운영 방침(2026-07-15) = *"원칙: 양보다 엄선 … 아무거나 잔뜩 = 신뢰 희석"* ＋ *"주 1~2개씩 드립 = 재방문 이유"*
//
//   ⭐ **이 판은 «한 번만» 돌린다** — 날짜를 박고 나면 데이터가 스스로 돈다. 매주 손댈 일이 없다.
//   ⛔ **다시 돌리면 날짜가 바뀐다** — 이미 열린 제품이 도로 닫힐 수 있다. `--확인` 으로 먼저 본다.
//
// 쓰는 법
//   node scripts/_장바구니-여는날짜-0829.mjs --확인    ← 뭘 어떻게 박을지 «보기만» 한다(파일 안 건드림)
//   node scripts/_장바구니-여는날짜-0829.mjs --박기    ← 실제로 박는다
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const APP = join(dirname(fileURLToPath(import.meta.url)), '..')
const 파일 = join(APP, 'src/data/curation.js')

// ⛔ 「옛 제품」 기준 = v11.78 «직전» 커밋(47bcec25 · v11.67). 그때 있던 것은 이미 유저가 봤다 → 안 건드린다.
const 옛커밋 = '47bcec25'
const 첫주 = '2026-08-29' // 오늘 — 창업자가 «방금» 문구를 써 준 것들이 여기 선다
const 주당 = 3

const 원문 = readFileSync(파일, 'utf8')

// ── 옛 제품 이름 모으기 ────────────────────────────────────────────
const 옛소스 = execFileSync('git', ['show', `${옛커밋}:hankki/src/data/curation.js`], {
  cwd: join(APP, '..'),
  encoding: 'utf8',
  maxBuffer: 1 << 24,
})
const 옛이름 = new Set([...옛소스.matchAll(/^\s*\{\s*name:\s*'([^']+)'/gm)].map((m) => m[1]))

// ── 지금 제품 줄 모으기 (줄 번호까지) ──────────────────────────────
const 줄들 = 원문.split('\n')
let 갈래 = ''
const 제품 = []
줄들.forEach((l, i) => {
  const c = l.match(/^\s*cat:\s*'([^']+)'/)
  if (c)갈래 = c[1]
  const m = l.match(/^\s*\{\s*name:\s*'([^']+)'/)
  if (!m) return
  제품.push({
    줄: i,
    이름: m[1],
    갈래,
    몰: (l.match(/mall:\s*'([^']+)'/) || [])[1] || (/url:/.test(l) ? '직접' : '없음'),
    이미: (l.match(/from:\s*'([^']+)'/) || [])[1] || null,
    옛것: 옛이름.has(m[1]),
  })
})

const 새것 = 제품.filter((p) => !p.옛것)

// ── ⭐ 섞기 — 갈래도 몰도 한 주에 몰리지 않게 ──────────────────────
//   📮 창업자 = *"87개 다 넣어줘(섞어서)"*
//   ⛔ 그냥 순서대로 자르면 「간장 3개」·「전부 쿠팡」인 주가 나온다(v11.78 에서 두 번 실패한 그 자리).
//   ⭐ 두 축(갈래·몰)을 «동시에» 편다 — 각 주에서 아직 안 쓴 갈래·몰을 먼저 고른다.
const 섞기 = (목록) => {
  const 남은 = [...목록]
  const 결과 = []
  while (남은.length) {
    const 이번주 = []
    const 쓴갈래 = new Set()
    const 쓴몰 = new Set()
    for (let 겹침 = 0; 겹침 < 3 && 이번주.length < 주당; 겹침++) {
      // 겹침 0 = 갈래·몰 둘 다 새것 / 1 = 갈래만 새것 / 2 = 아무거나
      for (let i = 0; i < 남은.length && 이번주.length < 주당; i++) {
        const p = 남은[i]
        const 갈래새 = !쓴갈래.has(p.갈래)
        const 몰새 = !쓴몰.has(p.몰)
        const 통과 = 겹침 === 0 ? 갈래새 && 몰새 : 겹침 === 1 ? 갈래새 : true
        if (!통과) continue
        이번주.push(p)
        쓴갈래.add(p.갈래)
        쓴몰.add(p.몰)
        남은.splice(i, 1)
        i--
      }
    }
    결과.push(이번주)
  }
  return 결과
}

const 주차 = 섞기(새것)
const 날짜 = (n) => {
  const d = new Date(`${첫주}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n * 7)
  return d.toISOString().slice(0, 10)
}

// ── 보고 ───────────────────────────────────────────────────────────
const 확인만 = !process.argv.includes('--박기')
console.log(`\n🔢 옛 제품(안 건드림) ${제품.length - 새것.length}개 · 새 제품 ${새것.length}개`)
console.log(`🗓 1주에 ${주당}개 → ${주차.length}주 (${첫주} ~ ${날짜(주차.length - 1)})\n`)
주차.forEach((주, n) => {
  const 표 = 주.map((p) => `${p.이름}(${p.갈래}·${p.몰})`).join(' · ')
  console.log(`  ${날짜(n)}  ${표}`)
})
const 갈래겹침 = 주차.filter((주) => new Set(주.map((p) => p.갈래)).size < 주.length).length
const 몰겹침 = 주차.filter((주) => new Set(주.map((p) => p.몰)).size < 주.length).length
console.log(`\n🔍 섞임 — 갈래가 겹친 주 ${갈래겹침}/${주차.length} · 몰이 겹친 주 ${몰겹침}/${주차.length}`)

if (확인만) {
  console.log('\n👀 «보기만» 했다. 진짜로 박으려면 --박기')
  process.exit(0)
}

// ── 박기 ───────────────────────────────────────────────────────────
//   ⛔ 줄 끝의 ` }` 앞에 `, from: '…'` 를 끼운다. 이미 있으면 갈아끼운다.
주차.forEach((주, n) => {
  const d = 날짜(n)
  주.forEach((p) => {
    const l = 줄들[p.줄]
    줄들[p.줄] = /from:\s*'[^']*'/.test(l)
      ? l.replace(/from:\s*'[^']*'/, `from: '${d}'`)
      : l.replace(/\s*\},\s*$/, `, from: '${d}' },`)
  })
})
const 새문 = 줄들.join('\n')

// 🔒 박은 뒤 «진짜로 들어갔나» — 못 들어갔으면 저장하지 않고 죽는다
const 박힌수 = [...새문.matchAll(/^\s*\{\s*name:[^\n]*from:\s*'/gm)].length
if (박힌수 !== 새것.length) {
  console.error(`\n⛔ ${새것.length}개에 박아야 하는데 ${박힌수}개만 들어갔다 — 저장하지 않는다.`)
  process.exit(1)
}
writeFileSync(파일, 새문)
console.log(`\n✅ ${박힌수}개에 여는 날짜를 박았다.`)
