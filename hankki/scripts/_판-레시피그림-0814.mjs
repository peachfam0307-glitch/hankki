// 🖼🖼 «레시피 제목 ＋ 실제로 붙는 그림» 을 한 판에 늘어놓는다 — **눈으로 보는 전수조사**
//
//   📮 창업자 *"원본찾아서 레시피에 대조해서 맞는그림 들어갔는지 확인해"*
//
// ⛔⛔ **이름표 대조로는 못 잡는다 — 오늘 두 번 뒤집혔다**(규칙 18)
//   ⑴ 「같은 파일 이름이 있나」로 세니 전부 0개 → 앱은 이름을 바꿔 넣는다
//   ⑵ 픽셀＋창업자 라벨로 세니 「고마다래 소스 = 궁채나물」 → **창업자 원본의 라벨이 서로 뒤바뀌어 있었다**
//      (`08-05-소스.png` 안에 나물이, `08-06-궁채나물.png` 안에 소스가 들어 있다)
//   📌 **글자는 다 낡거나 틀릴 수 있다. 그림만 안 틀린다.** 그래서 판을 뽑아 눈으로 본다.
//
// 쓰는 법:  node scripts/_판-레시피그림-0814.mjs <나갈폴더>
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
// ⛔ `new URL(...).pathname` 은 한글을 %ED%8C%90 로 바꿔 놓는다 — 파일 이름이 한글이라 그대로 죽었다.
//    경로를 넘길 땐 반드시 fileURLToPath 를 거친다.
import { fileURLToPath } from 'node:url'

const 뿌리 = new URL('../', import.meta.url)
const R = (p) => readFileSync(new URL(p, 뿌리), 'utf8')
const 나갈곳 = process.argv[2]
if (!나갈곳) { console.error('⛔ 나갈 폴더를 달라'); process.exit(1) }
mkdirSync(나갈곳, { recursive: true })

const src = R('src/data/basics.js')
const 편 = []
for (const m of src.matchAll(/id:\s*'([^']+)',\s*\n?\s*title:\s*'([^']+)'([^\n]*)\n(?:[^\n]*\n){0,6}?\s*icon:\s*'([^']+)'/g))
  편.push({ id: m[1], 제목: m[2], 아이콘: m[4], 잠금: /from:/.test(m[3]) })
if (편.length < 100) { console.error(`⛔ ${편.length}편밖에 못 읽었다 — basics.js 모양이 바뀌었다`); process.exit(1) }

// 같은 그림을 여럿이 쓰면 판에 표시한다 — 「겹침」이 곧 「하나는 딴 요리」다
const 몇편 = new Map()
for (const r of 편) 몇편.set(r.아이콘, (몇편.get(r.아이콘) || 0) + 1)

const 쪽크기 = 24
const 쪽수 = Math.ceil(편.length / 쪽크기)
for (let p = 0; p < 쪽수; p++) {
  const 줄 = 편.slice(p * 쪽크기, (p + 1) * 쪽크기)
  const 인자 = []
  for (const r of 줄) {
    const 겹 = 몇편.get(r.아이콘) > 1 ? ` 🔁${몇편.get(r.아이콘)}` : ''
    const 파일 = ['src/assets/stickers/photo', 'src/assets/stickers/ing']
      .map((d) => `${d}/${r.아이콘}.png`)
      .find((f) => existsSync(new URL(f, 뿌리)))
    인자.push(`${파일 || 'MISSING'}::${r.제목}${겹} [${r.아이콘}]${r.잠금 ? ' 🔒' : ''}`)
  }
  execFileSync('python3', [fileURLToPath(new URL('scripts/_판-라벨붙여-0814.py', 뿌리)),
    `${나갈곳}/레시피그림-${p + 1}.png`, ...인자], { stdio: 'inherit', cwd: fileURLToPath(뿌리) })
}
console.log(`\n✅ ${쪽수}장 · 총 ${편.length}편  → ${나갈곳}`)
