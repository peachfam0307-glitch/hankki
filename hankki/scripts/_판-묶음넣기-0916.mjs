// 🏷🏷 **창업자가 고른 「재료 묶음」을 basics.js 에 넣는다** (2026-09-16)
//
// 📮 창업자가 `_판-재료묶음-0916.mjs` 검수판에서 **69편**을 직접 골라 줬다.
// 📮 *"진짜 조심해서 한걸음한걸음 눈으로 확인하면서 옮겨"* · *"바뀌면 난리난다 진짜"*
//
// ⛔⛔ **레시피 글은 한 글자도 안 고친다** — 「[양념]」 같은 **소제목 줄을 «끼워 넣기»만** 한다.
//    ⭐ 꼴은 «이미 있는 94편»과 같게 = 대괄호만 있는 줄 하나(`'[양념]',`).
//       화면(`isIngHeader`)·요리모드·장보기가 그 꼴을 이미 안다.
//
// 🔒 안전 장치 넷
//    ① 편을 **제목으로 정확히** 찾는다(못 찾으면 건너뛰고 끝에 알린다)
//    ② 바꿀 블록을 «통째로» 만들어 치환 도구로 넣는다 — 못 찾으면 «죽어서» 알려준다
//    ③ 줄 수가 「옛 줄 수 ＋ 넣은 소제목 수」와 다르면 그 편을 건너뛴다
//    ④⭐ **재료 글자가 한 자라도 바뀌면 «통째로» 멈춘다** — 대괄호 줄을 뺀 나머지를 옛것과 그대로 대조
//
// 쓰기:  node scripts/_판-묶음넣기-0916.mjs           # 👀 보여만 준다
//        node scripts/_판-묶음넣기-0916.mjs --넣음    # ✂️ 실제로 넣는다
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const APP = join(dirname(fileURLToPath(import.meta.url)), '..')
const 치환기 = join(APP, '..', 'tools', 'subst.py')   // ⛔ 뿌리가 둘이다 — 앱이 아니라 «git 뿌리»에 있다
const BAS = join(APP, 'src/data/basics.js')
const 넣음 = process.argv.includes('--넣음')

const 입력 = readFileSync(process.env.IN || '/tmp/묶음/입력.txt', 'utf8').trim().split('\n')
const 할것 = 입력.map((줄) => {
  const [이름, 나머지] = 줄.split(' : ')
  const 자리 = [...나머지.matchAll(/(\d+)번째 줄부터 \[([^\]]+)\]/g)]
    .map((m) => ({ i: Number(m[1]), 이름: m[2] }))
    .sort((a, b) => b.i - a.i)   // ⛔ «뒤에서부터» 넣어야 앞 인덱스가 안 밀린다
  return { 이름: 이름.trim(), 자리 }
})

let src = readFileSync(BAS, 'utf8')
let 된것 = 0
const 안된것 = []
const 헤더줄 = (s) => /^\s*'\[[^\]]+\]',?\s*$/.test(s)

for (const 편 of 할것) {
  const 제목자리 = src.indexOf(`title: '${편.이름}'`)
  if (제목자리 < 0) { 안된것.push(`${편.이름} — 제목을 못 찾았다`); continue }
  const 다음 = src.indexOf("title: '", 제목자리 + 10)
  const 덩어리 = src.slice(제목자리, 다음 > 0 ? 다음 : src.length)
  const m = /ingredients: \[\n([\s\S]*?)\n(\s*)\]/.exec(덩어리)
  if (!m) { 안된것.push(`${편.이름} — 재료 칸을 못 찾았다`); continue }

  const 옛블록 = m[0]
  // ⛔⛔ **「줄」이 아니라 «재료 항목» 단위로 센다** — 한 줄에 여러 개 적힌 편이 있다(어남선생 셋·족발).
  //    📌 검수판도 항목 단위로 셌으니 잣대를 맞춰야 «몇 번째»가 어긋나지 않는다.
  const 항목들 = [...m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((x) => x[1])
  if (항목들.some((s) => /^\[[^\]]+\]$/.test(s.trim()))) { 안된것.push(`${편.이름} — 이미 묶음이 있다(건너뜀)`); continue }

  const 들여 = (m[1].match(/^\s*/) || ['      '])[0]
  const 새항목 = [...항목들]
  let 탈 = null
  for (const 자 of 편.자리) {
    if (자.i > 새항목.length) { 탈 = `${자.i}번째가 없다(재료 ${항목들.length}개)`; break }
    새항목.splice(자.i, 0, `[${자.이름}]`)
  }
  if (탈) { 안된것.push(`${편.이름} — ${탈}`); continue }

  // ④⭐ 재료 글자가 한 자라도 바뀌었나 — 하나라도 다르면 «통째로» 멈춘다
  const 뺀것 = 새항목.filter((s) => !/^\[[^\]]+\]$/.test(s.trim()))
  if (뺀것.length !== 항목들.length || 뺀것.some((s, i) => s !== 항목들[i])) {
    console.log(`\n⛔⛔ ${편.이름} — **재료 글자가 바뀌었다.** 아무것도 안 하고 멈춘다.`)
    뺀것.forEach((s, i) => { if (s !== 항목들[i]) console.log(`   옛: ${항목들[i]}\n   새: ${s}`) })
    process.exit(1)
  }

  // 📐 한 항목에 한 줄로 다시 적는다 — 글자는 그대로, 보기만 가지런해진다
  const 새블록 = `ingredients: [\n${새항목.map((s) => `${들여}'${s}',`).join('\n')}\n${m[2]}]`
  if (!넣음) {
    console.log(`\n● ${편.이름}  (${항목들.length} → ${새항목.length}개)`)
    새항목.forEach((s) => console.log('   ' + s))
    된것 += 1
    continue
  }
  writeFileSync('/tmp/묶음/_o.txt', 옛블록)
  writeFileSync('/tmp/묶음/_n.txt', 새블록)
  execFileSync('python3', [치환기, BAS, '--count', '1', '--old-file', '/tmp/묶음/_o.txt', '--new-file', '/tmp/묶음/_n.txt'], { stdio: 'pipe' })
  src = readFileSync(BAS, 'utf8')
  된것 += 1
}

console.log(`\n${넣음 ? '✅ 넣었다' : '👀 보여만 줬다'} — ${된것}편`)
if (안된것.length) { console.log(`\n⛔ 못 한 것 ${안된것.length}편`); 안된것.forEach((s) => console.log('   · ' + s)) }
if (!넣음) console.log('\n👉 실제로 넣으려면 → node scripts/_판-묶음넣기-0916.mjs --넣음')
