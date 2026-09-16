// 🫒 **조리용 기름을 «메인재료 아래»로 옮긴다** (2026-09-16)
//
// 📮 창업자 = *"보통 올리브유는 요리시작에 많이쓰니까 올리브유를 마지막에 뿌리는 샐러드만빼면 다 위로가는게맞아"*
//        ＋ *"올리브유가 아래쪽에 있는 건 메인쟤료 아래로 옮겨줘"*
//
// ⛔⛔ **글자를 한 자도 안 고친다 — «자리만» 옮긴다.**
// ⛔ 뺀 편 둘 (창업자 판정)
//    · 토마토샐러드 — 마지막에 뿌리는 드레싱이라 그 자리가 맞다
//    · 수육      — 「[오븐으로 할 때]」 묶음 «안»이 맞다(오븐에 바르는 기름). 창업자 물음에 실물로 확인했다
//
// 🔒 안전 장치 셋
//    ① 옮길 항목이 «딱 하나»가 아니면 그 편을 건너뛴다
//    ② 옮긴 뒤 **재료 «집합»이 옛것과 같은지** 본다(하나라도 늘거나 줄면 통째로 멈춘다)
//    ③ 치환 도구로 블록을 통째로 바꾼다 — 못 찾으면 죽는다
//
// 쓰기:  node scripts/_판-기름위로-0916.mjs          # 👀 보여만 준다
//        node scripts/_판-기름위로-0916.mjs --넣음   # ✂️ 실제로 옮긴다
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const APP = join(dirname(fileURLToPath(import.meta.url)), '..')
const 치환기 = join(APP, '..', 'tools', 'subst.py')
const BAS = join(APP, 'src/data/basics.js')
const 넣음 = process.argv.includes('--넣음')

const 할것 = ['팟타이', '전복죽', '해물오일파스타', '어남선생 두부조림', '어남선생 오징어볶음',
  '가지 소고기 덮밥', '파기름 간장국수', '닭목살 불고기', '들깨 궁채나물', '새우관자전', '가지 라자냐']
// 📍 닭목살 불고기만 «콕 집은» 자리가 있다 — 📮 *"올리브유는 목살 아래로 넣어줘"*
const 콕 = { '닭목살 불고기': 1 }

const 기름인가 = (s) => /^(올리브유|식용유|포도씨유|카놀라유)/.test(String(s).trim())
const 머리인가 = (s) => /^\[[^\]]+\]$/.test(String(s).trim())
const 셈 = (a) => a.slice().sort().join(' || ')

let src = readFileSync(BAS, 'utf8')
let 된것 = 0
const 안된것 = []

for (const 이름 of 할것) {
  const 제목자리 = src.indexOf(`title: '${이름}'`)
  if (제목자리 < 0) { 안된것.push(`${이름} — 제목을 못 찾았다`); continue }
  const 다음 = src.indexOf("title: '", 제목자리 + 10)
  const 덩어리 = src.slice(제목자리, 다음 > 0 ? 다음 : src.length)
  const m = /ingredients: \[\n([\s\S]*?)\n(\s*)\]/.exec(덩어리)
  if (!m) { 안된것.push(`${이름} — 재료 칸을 못 찾았다`); continue }

  const 옛블록 = m[0]
  const 항목 = [...m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((x) => x[1])
  const 들여 = (m[1].match(/^\s*/) || ['      '])[0]
  const 첫머리 = 항목.findIndex(머리인가)
  if (첫머리 < 0) { 안된것.push(`${이름} — 묶음이 없다`); continue }

  const 기름자리 = 항목.map((a, i) => ({ a, i })).filter(({ a, i }) => i > 첫머리 && 기름인가(a))
  if (기름자리.length !== 1) { 안된것.push(`${이름} — 옮길 기름이 ${기름자리.length}개다(건너뜀)`); continue }

  const 기름 = 기름자리[0].a
  const 남은것 = 항목.filter((_, i) => i !== 기름자리[0].i)
  const 놓을곳 = 콕[이름] != null ? 콕[이름] : 남은것.findIndex(머리인가)
  const 새항목 = [...남은것.slice(0, 놓을곳), 기름, ...남은것.slice(놓을곳)]

  if (셈(새항목) !== 셈(항목)) {
    console.log(`\n⛔⛔ ${이름} — **재료가 늘거나 줄었다.** 아무것도 안 하고 멈춘다.`)
    process.exit(1)
  }

  const 새블록 = `ingredients: [\n${새항목.map((s) => `${들여}'${s}',`).join('\n')}\n${m[2]}]`
  if (!넣음) {
    console.log(`\n● ${이름}   (「${기름}」을 ${기름자리[0].i}번째 → ${놓을곳}번째로)`)
    새항목.forEach((s) => console.log(`   ${s === 기름 ? '⭐' : '  '} ${s}`))
    된것 += 1
    continue
  }
  writeFileSync('/tmp/묶음/_o2.txt', 옛블록)
  writeFileSync('/tmp/묶음/_n2.txt', 새블록)
  execFileSync('python3', [치환기, BAS, '--count', '1', '--old-file', '/tmp/묶음/_o2.txt', '--new-file', '/tmp/묶음/_n2.txt'], { stdio: 'pipe' })
  src = readFileSync(BAS, 'utf8')
  된것 += 1
}

console.log(`\n${넣음 ? '✅ 옮겼다' : '👀 보여만 줬다'} — ${된것}편`)
if (안된것.length) { console.log(`\n⛔ 못 한 것 ${안된것.length}편`); 안된것.forEach((s) => console.log('   · ' + s)) }
if (!넣음) console.log('\n👉 실제로 옮기려면 → node scripts/_판-기름위로-0916.mjs --넣음')
