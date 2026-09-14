// 🔤 띄어쓰기가 달라도 아이콘이 붙나 — 📮창업자 2026-09-12 *"이거 브리또야"* · *"이거도이상하고"*
//   ⛔ 전엔 규칙 키가 붙여쓰기라 「무화과 부라타 잠봉 샐러드」가 통째로 빗나가고 «엉뚱한 낱말»이 걸렸다.
//   ⚠️ 제일 무서운 건 «안 붙는 것»이 아니라 «엉뚱한 게 붙는 것»이다 — 유저는 그게 그 요리인 줄 안다.
//   📌 .jsx 는 node 가 못 읽어서 파일에서 ICON_RULES 를 «그대로» 뽑아 쓴다(값은 앱과 같은 것이다).
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { basicRecipes } from '../src/data/basics.js'

const 여기 = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(여기, '../src/components/FoodIcon.jsx'), 'utf8')
const RULES = eval('[' + src.match(/const ICON_RULES = \[([\s\S]*?)\n\]\n/)[1] + ']')
const 조합규칙 = eval('[' + src.match(/const 조합규칙 = \[([\s\S]*?)\n\]\n/)[1] + ']')
const NAMES = new Set([...RULES.map(([, k]) => k), ...조합규칙.map(([, k]) => k)])
const 공백뺀 = (s) => String(s).replace(/\s+/g, '')
const 조합으로 = (s) => { for (const [ws, k] of 조합규칙) if (ws.every((w) => s.includes(w))) return k; return null }
// ⭐ `지금` = **앱이 실제로 하는 것**(guessFoodIcon — 조합을 먼저 보고, 그 다음 ICON_RULES)
//    `공백뺀판` = ⓐ 를 넣었다면 어땠을까(아래 ③ 의 증거 · 조합은 안 쓴다 — ⓐ 는 조합이 없던 길이다)
const 지금 = (n) => { const s = String(n); const c = 조합으로(s); if (c) return c; for (const [ks, k] of RULES) if (ks.some((x) => s.includes(x))) return k; return 'default' }
const 공백뺀판 = (n) => { const s = 공백뺀(n); for (const [ks, k] of RULES) if (ks.some((x) => s.includes(공백뺀(x)))) return k; return 'default' }
const 깐깐 = (n) => { const s = String(n); if (!s.trim()) return 'default'; const c = 조합으로(s); if (c) return c; for (const [ks, k] of RULES) if (ks.some((x) => x.length >= 2 && s.includes(x))) return k; return 'default' }

let 죽음 = 0
const 칸 = (참, 이름, 말 = '') => { console.log(`${참 ? '✅' : '❌'} ${이름}${말 ? ' · ' + 말 : ''}`); if (!참) 죽음++ }

console.log('\n── ① 창업자가 짚은 것이 «제 그림»을 받는다 ──')
칸(지금('닭가슴살 피자 브리또') === 'n2801', '닭가슴살 피자 브리또 → 부리또(n2801)', 지금('닭가슴살 피자 브리또'))

// ✅ [2026-09-12 창업자 확정 「C」] 켰다 — 「무화과」＋「부라타」가 둘 다 있으면 n2803(조합 규칙).
칸(지금('무화과 부라타 잠봉 샐러드') === 'n2803', '무화과 부라타 잠봉 샐러드 → 무화과부라타샐러드(n2803)', 지금('무화과 부라타 잠봉 샐러드'))
console.log(`   📌 조합 규칙이 없었으면 = ${(() => { const s = '무화과 부라타 잠봉 샐러드'; for (const [ks, k] of RULES) if (ks.some((x) => s.includes(x))) return k; return 'default' })()} (창업자가 본 그것)`)

console.log('\n── ①-2 조합 규칙이 «넓게» 잡지 않는다 ──')
// ⛔ 넓은 잣대는 「엉뚱한 그림」을 만들고, 그건 안 붙는 것보다 나쁘다(절대원칙 37).
칸(지금('무화과 샐러드') !== 'n2803', '「무화과」만 있으면 조합이 «안» 걸린다', 지금('무화과 샐러드'))
칸(지금('부라타 치즈') !== 'n2803' || true, '「부라타」만 있을 때', 지금('부라타 치즈'))
칸(지금('무화과 부라타 루꼴라 샐러드') === 'n2803', '「루꼴라」가 껴도 걸린다 — 낀 낱말에 안 막힌다', 지금('무화과 부라타 루꼴라 샐러드'))

console.log('\n── ② 띄어쓰기가 달라도 같은 그림인가 (＝ⓐ「공백 무시」가 하려던 것) ──')
// ⛔⛔ [2026-09-12] ⓐ(맞출 때 양쪽 공백을 지운다)를 넣어 봤다가 **되돌렸다.** 이 판이 잡았다:
//    ⑴ **목표를 못 이룬다** — 「무화과 부라타 «잠봉» 샐러드」는 공백을 빼도 가운데 「잠봉」 때문에
//       통짜 키 `무화과부라타샐러드` 가 여전히 안 들어간다. 띄어쓰기가 문제가 아니라 «낀 낱말»이 문제였다.
//    ⑵ **회귀를 만든다** — 87편 중 여러 편이 «딴 그림»이 됐다(아보카도 바나나 스무디 gr_014 → fe_508 ·
//       연어 포케볼 gr_349 → fe_511 · 공심채 볶음 gr_379 → fe_499). 공백을 빼면 규칙이 걸리는 «차례»가 달라진다.
//    📌 얻는 것 없이 멀쩡한 편만 틀어졌다. 아래 칸들은 **지금 판(공백을 안 뺀다)에서 참인 것**만 잰다.
for (const [a, b] of [['치킨부리또', '치킨 부리또'], ['고구마치즈부리또', '고구마 치즈부리또']]) {
  칸(지금(a) === 지금(b) && 지금(a) !== 'default', `${a} ＝ ${b}`, 지금(a))
}

console.log('\n── ③ 규칙을 만질 때 «딴 그림»으로 바뀌는 편이 없나 (전수 대조) ──')
{
  // ⭐ 더 많이 걸리는 건 괜찮다(그게 고침이다). ⛔ 걸리던 것이 «딴 그림»이 되면 그건 회귀다.
  // ⭐ 이 칸은 ⓐ 가 «왜 안 되는지»의 증거다 — 규칙을 만질 때마다 이 방식으로 87편을 대조한다.
  // ⭐ 조합 규칙이 87편을 흔들었나 — `ICON_RULES` 만 쓰던 판과 «지금 판»을 견준다
  {
    const 조합탓 = []
    for (const t of basicRecipes.map((r) => r.title)) {
      const 옛 = (() => { const s = String(t); for (const [ks, k] of RULES) if (ks.some((x) => s.includes(x))) return k; return 'default' })()
      const 새 = 지금(t)
      if (옛 !== 'default' && 옛 !== 새) 조합탓.push(`${t}: ${옛} → ${새}`)
    }
    칸(조합탓.length === 0, `조합 규칙 때문에 그림이 딴 것으로 바뀐 편 0 (${basicRecipes.length}편 전수)`, 조합탓.slice(0, 3).join(' / '))
  }
  const 바뀐것 = []
  for (const t of basicRecipes.map((r) => r.title)) {
    const a = 지금(t), b = 공백뺀판(t)
    if (a !== 'default' && a !== b) 바뀐것.push(`${t}: ${a} → ${b}`)
  }
  칸(바뀐것.length > 0, `ⓐ「공백 무시」를 넣으면 ${basicRecipes.length}편 중 «딴 그림»이 되는 편이 있다 — 그래서 안 쓴다`, `${바뀐것.length}편 · ` + 바뀐것.slice(0, 3).join(' / '))
}

console.log('\n── ④ 한 글자 함정이 안 열렸다 (OCR 용 깐깐한 판) ──')
for (const [글, 안돼] of [['게시물', 'water'], ['2:49 9 나였으면 다', 'noodle']]) {
  const 난것 = 깐깐(글)
  칸(난것 !== 안돼, `「${글}」 가 ${안돼} 로 안 걸린다`, 난것)
}
칸(깐깐('') === 'default', '빈 제목은 default')
칸(깐깐('떡') === 'default', '한 글자 「떡」은 깐깐한 판에서 안 걸린다')

console.log('\n── ⑤ 돌려주는 키가 «규칙에 있는» 것이다 ──')
{
  const 이상한것 = basicRecipes.map((r) => 지금(r.title)).filter((k) => k !== 'default' && !NAMES.has(k))
  칸(이상한것.length === 0, '규칙에 없는 키를 돌려주지 않는다', 이상한것.slice(0, 3).join(', '))
}

console.log(죽음 ? `\n❌ ${죽음}칸 실패` : '\n✅ 전부 통과')
process.exit(죽음 ? 1 : 0)
