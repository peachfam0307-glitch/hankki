// 📷 속지끼리 «사진 저장 자리»를 같이 쓰면 배포를 막는다
//
// ⛔⛔ 2026-08-08 창업자 폰 제보 — *"기록3칸에 올린 사진들이 스크랩사진첩에 똑같이 붙어."*
//    여섯 속지가 전부 `photo`/`photo2`/`photo3` **한 자리**를 같이 썼다.
//    (속지를 갈아입어도 사진이 안 날아가게 한 것인데, 칸 «모양»이 달라 엉뚱하게 붙어 보였다)
//    → 창업자가 **②속지마다 따로 담는다**를 골랐고, 속지마다 자기 키를 갖게 고쳤다.
//
// 📌 이 검사가 있는 이유 = **속지를 새로 넣을 때 키를 안 주면 기본값 `photo` 로 떨어진다.**
//    그 순간 옛 증상이 조용히 되살아난다 — 화면은 멀쩡해 보이고, 갈아입어야 드러난다.
//    ⭐ 「알려주는 것」과 「지켜주는 것」은 다르다(규칙 19) — 그래서 게이트로.
//
// ⚠️ 노드만으로 돈다 — `papers.js` 는 webp 를 import 해서 Node 가 못 읽는다(CI 도 마찬가지).
//    그래서 **글자를 읽어** 센다. 배포 게이트는 파이썬·이미지 도구에 기대면 안 된다(2026-08-07 사고).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const src = readFileSync(join(ROOT, 'src/data/papers.js'), 'utf8')

// PAPER_ARTS 안의 속지 블록마다 photo 필드의 key 들을 뽑는다
const arts = [...src.matchAll(/\n    key: '(\w+)', label: '([^']+)'/g)]
let bad = 0
const seen = new Map()          // 사진키 → 그 키를 쓰는 속지들
const rows = []
for (let i = 0; i < arts.length; i++) {
  const [m, key, label] = [arts[i], arts[i][1], arts[i][2]]
  const from = m.index + m[0].length
  const to = i + 1 < arts.length ? arts[i + 1].index : src.length
  const seg = src.slice(from, to)
  const pm = seg.match(/photo:\s*(\[[\s\S]*?\]|\{[\s\S]*?\})/)
  if (!pm) continue
  const body = pm[1]
  // 칸 수 = top: 이 나온 횟수 · 키는 각 칸의 key (없으면 기본값 'photo')
  const slots = (body.match(/top:/g) || []).length
  const keys = [...body.matchAll(/key: '(\w+)'/g)].map((x) => x[1])
  while (keys.length < slots) keys.splice(keys.length, 0, keys.length ? `photo${keys.length + 1}` : 'photo')
  rows.push([key, label, keys])
  for (const k of keys) {
    if (!seen.has(k)) seen.set(k, [])
    seen.get(k).push(key)
  }
}

console.log('\n📷 속지 사진 자리')
for (const [key, label, keys] of rows) console.log(`   · ${key.padEnd(9)} ${label.padEnd(12)} ${keys.join(', ')}`)

const shared = [...seen.entries()].filter(([, who]) => who.length > 1)
if (shared.length) {
  bad = shared.length
  for (const [k, who] of shared) {
    console.log(`   ⛔ 사진 자리 「${k}」 를 ${who.length}개 속지가 같이 쓴다 — ${who.join(' · ')}`)
    console.log('        → 속지를 갈아입으면 사진이 «딸려온다». 속지 정의의 photo 칸에 각자 key 를 줄 것')
  }
} else {
  console.log(`   ✅ 사진 자리 ${seen.size}개 — 속지끼리 겹침 0`)
}

// 🚚 이관 표가 살아 있나 — 옛 저장본(photo/photo2/photo3)을 옮기는 길이 없으면 사진이 날아간다
if (!/export function migratePhotoKeys/.test(src)) {
  bad++
  console.log('   ⛔ `migratePhotoKeys` 가 없다 — 옛 저장본 사진이 통째로 날아간다(이미 깔린 폰)')
} else {
  console.log('   ✅ 옛 저장본 이관 길이 있다 (migratePhotoKeys)')
}

console.log(bad ? `\n⛔ 속지 사진 자리 ${bad}건 — 고칠 것\n` : '\n✅ 속지 사진 자리 통과\n')
process.exit(bad ? 1 : 0)
