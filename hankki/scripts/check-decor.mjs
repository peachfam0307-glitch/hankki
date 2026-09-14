// 🎀 꾸민 표지가 «어느 화면에서나» 보이나 — 빠뜨림 잡는 그물
//
// 🐛 2026-08-05 창업자 제보: *"레시피탭에서 검색하면 꾸미기 하얗게뜸"*
//    원인 = `Thumb` 의 `showDecor` 기본값이 꺼짐인데 검색 화면이 그걸 안 넘겼다.
//    ⭐ 표지 비우기(`thumb:'none'`)가 생기면서 이게 «완전 빈 칸»이 됐다 —
//       예전엔 아이콘이라도 나와서 티가 안 났다. 화면이 늘 때마다 또 빠뜨린다.
//
// 판정 = `<Thumb …>` 를 쓰는 곳은 둘 중 하나여야 한다
//   ⓐ `showDecor` 를 넘긴다                       (Thumb 가 꾸미기를 그린다)
//   ⓑ 그 파일이 `DecorLayer` 를 직접 겹쳐 그린다   (상세·자랑·꾸미기편집 = 크게 그리는 화면)
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC = new URL('../src/', import.meta.url).pathname

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.jsx') ? [p] : []
  })

const bad = []
let seen = 0
for (const file of walk(SRC)) {
  const src = readFileSync(file, 'utf8')
  if (!src.includes('<Thumb')) continue
  // 이 파일이 꾸미기를 직접 겹쳐 그리나 (상세·자랑·꾸미기편집)
  const drawsOwn = /<DecorLayer/.test(src)
  const lines = src.split('\n')
  for (const m of src.matchAll(/<Thumb\b[\s\S]*?\/>/g)) {
    seen++
    if (drawsOwn || /\bshowDecor\b/.test(m[0])) continue
    const no = src.slice(0, m.index).split('\n').length
    bad.push({ file: file.replace(SRC, 'src/'), no, line: lines[no - 1].trim() })
  }
}

if (bad.length) {
  console.error(`\n⛔ 꾸민 표지가 안 그려지는 자리 ${bad.length}군데 — \`showDecor\` 가 빠졌다\n`)
  for (const b of bad) console.error(`   ${b.file}:${b.no}\n      ${b.line}`)
  console.error(`\n   👉 고치는 법 = 그 <Thumb …> 에 \`showDecor\` 한 낱말을 붙인다.`)
  console.error(`      (꾸민 것만 나온다 — 안 꾸민 레시피는 그대로 아이콘이다)\n`)
  process.exit(1)
}
console.log(`✅ 꾸민 표지 — \`<Thumb>\` ${seen}자리 모두 꾸미기를 그린다`)
