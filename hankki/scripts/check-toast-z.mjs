// 🔔 토스트가 «모든 층 위»에 있나 — 안 보이는 토스트는 없는 것과 같다.
//
// 🔢 2026-08-13 실측 사고
//   창업자 *"나 방금 2장 올렸는데 암것도 안떴어"* — 토스트는 «떴는데»
//   자르기 화면(CropSheet, zIndex 400)이 덮었다. 토스트 z-index 가 100 이었다.
//   ⛔ 그날 만든 안내(*"사진 2장이라 AI 스캔 2장을 써요"*)가 통째로 유저에게 안 닿고 있었다.
//
// 그래서 이 검사가 지킨다 = **토스트 z-index > 앱의 모든 z-index.**
//   새 시트·오버레이를 만들 때 토스트보다 높게 두면 여기서 막힌다.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SRC = new URL('../src/', import.meta.url).pathname
const CSS = join(SRC, 'styles.css')

// 토스트 z 읽기
const css = readFileSync(CSS, 'utf8')
const block = css.slice(css.indexOf('\n.toast {'))
const toastZ = parseInt(/z-index:\s*(\d+)/.exec(block)?.[1] || '0', 10)

// src 전체에서 z-index / zIndex 를 긁는다 (.toast 자신은 뺀다)
const walk = (dir) => {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      if (name === 'assets') continue // 그림 폴더는 건너뛴다
      out.push(...walk(p))
    } else if (/\.(jsx?|css)$/.test(name)) out.push(p)
  }
  return out
}

const 최고 = []
for (const f of walk(SRC)) {
  const t = readFileSync(f, 'utf8')
  for (const m of t.matchAll(/z-?[Ii]ndex:\s*'?(\d+)'?/g)) {
    const z = parseInt(m[1], 10)
    // .toast 블록 자신은 제외
    if (f === CSS && block.includes(m[0]) && z === toastZ) continue
    최고.push({ z, file: f.replace(SRC, 'src/') })
  }
}
최고.sort((a, b) => b.z - a.z)

let ng = 0
console.log('\n🔔 토스트 층 검사\n')
console.log(`   토스트 z-index = ${toastZ}`)

if (!toastZ) {
  console.log('   ⛔ .toast 의 z-index 를 못 찾았다')
  ng++
} else {
  const 위 = 최고.filter((x) => x.z >= toastZ)
  if (위.length) {
    console.log(`   ⛔ 토스트보다 높거나 같은 층이 ${위.length}곳 있다 — 그 화면에선 토스트가 «안 보인다»`)
    for (const x of 위.slice(0, 6)) console.log(`        z:${x.z}  ${x.file}`)
    ng++
  } else {
    console.log(`   ✅ 토스트가 맨 위다 (다음으로 높은 층 = ${최고[0]?.z ?? 0} · ${최고[0]?.file ?? '-'})`)
  }
}

console.log(ng ? '\n   ⛔ 어긋남 — 토스트를 더 위로 올리거나 새 층을 낮출 것\n' : '\n   ── 통과 ──\n')
process.exit(ng ? 1 : 0)
