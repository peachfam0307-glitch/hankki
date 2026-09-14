// 🖼 「전용 그림이 없는 편」을 «세서» 뽑는다 — 창업자가 시트를 뽑을 목록
//
// 📮 창업자 2026-08-18 = *"내가 더 뽑아야할 음식사진 다시 적어줘"*
//
// ⛔ 손으로 세지 않는다. 셋을 코드가 판정한다:
//   ⑴ **범용 도형** — 음식 사진(`photo/<키>.png`)이 아예 없는 것
//   ⑵ **겹침** — 같은 그림을 여러 편이 쓰는 것(한 주에 같은 그림 셋이면 카드가 이상하다)
//   ⑶ **넓은 낱말** — 「조림」·「볶음」처럼 요리 이름이 아닌 말에 걸린 것
//
// 쓰기:  node scripts/_그림없는편-0818.mjs            (앞으로 열릴 편 전부)
//        node scripts/_그림없는편-0818.mjs 2026-11    (그 달만)
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { 레시피들 } from './recipe.mjs'

const APP = new URL('..', import.meta.url).pathname
const 사진칸 = join(APP, 'src/assets/stickers/photo')

// 🏷 그림 이름표 — 창업자가 준 컷이 «무슨 그림인지». 없으면 키만 찍는다.
let 이름표 = {}
try {
  이름표 = JSON.parse(readFileSync(join(APP, 'docs/stickers/아이콘-이름표-창업자.json'), 'utf8'))
} catch { /* 없어도 돈다 */ }
const 그림이름 = (k) => (이름표[k]?.이름 || 이름표[k] || '')

// 「넓은 낱말」 = 요리 이름이 아니라 «조리법»이라 아무 데나 붙는다
const 넓음 = /^(조림|볶음|구이|찜|무침|전|국|탕|찌개|파스타|덮밥|밥|면)$/

const 달 = process.argv[2]
const 전부 = 레시피들()
const 볼것 = 전부.filter((r) => {
  if (!r.from) return false
  if (달) return r.from.startsWith(달)
  return r.from > '2026-08-18'
})

// 같은 그림을 «전체 레시피 중» 몇 편이 쓰나
const 셈 = new Map()
for (const r of 전부) { if (r.icon) 셈.set(r.icon, (셈.get(r.icon) || 0) + 1) }

const 없음 = [], 겹침 = [], 넓은 = []
for (const r of 볼것) {
  const k = r.icon || ''
  const 있나 = k && existsSync(join(사진칸, `${k}.png`))
  if (!있나) { 없음.push({ r, k }); continue }
  const n = 셈.get(k) || 0
  if (n > 1) {
    const 같이 = 전부.filter((x) => x.icon === k && x !== r).map((x) => x.title)
    겹침.push({ r, k, 같이 })
    continue
  }
  const nm = 그림이름(k)
  if (nm && 넓음.test(nm.trim())) 넓은.push({ r, k, nm })
}

const 줄 = (r, 꼬리) => `   · ${r.from}  ${r.title.padEnd(20)} ${r.icon || '(없음)'}${꼬리 ? '  ' + 꼬리 : ''}`

console.log(`\n🖼 ${달 || '2026-08-18 뒤'} 에 열릴 ${볼것.length}편 중 «전용 그림이 없는» 편\n`)
console.log(`⛔ 음식 사진이 아예 없다 (범용 도형이 뜬다) — ${없음.length}편`)
없음.forEach(({ r }) => console.log(줄(r)))
console.log(`\n🔁 같은 그림을 여러 편이 쓴다 — ${겹침.length}편`)
겹침.forEach(({ r, 같이 }) => console.log(줄(r, `↔ ${같이.join(' · ')}`)))
console.log(`\n🕸 요리 이름이 아닌 «넓은 낱말»에 걸렸다 — ${넓은.length}편`)
넓은.forEach(({ r, nm }) => console.log(줄(r, `= 「${nm}」`)))
console.log(`\n📋 새로 뽑을 컷 = ${없음.length + 겹침.length + 넓은.length}개`)
