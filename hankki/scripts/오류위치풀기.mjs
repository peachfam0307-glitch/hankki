// 🔎 오류 위치 풀기 (운영 2단계 · 2026-11-02) — 압축된 위치(index-xxxx.js:1:48211)를 «원래 파일·줄·함수»로
//   쓰는 법: node scripts/오류위치풀기.mjs <판> "<오류 로그의 위치 글>"
//     예) node scripts/오류위치풀기.mjs v14.71 "at Xe (https://…/assets/index-CprxnQG3.js:1:48211)"
//   지도 = .sourcemaps/<판>/  (로컬 빌드) · 없으면 = GitHub Actions 그 판 배포 run 의 아티팩트 「sourcemaps-<run 번호>」를 받아 .sourcemaps/ 에 푼다
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { SourceMap } from 'node:module'
const [판, ...글조각] = process.argv.slice(2)
if (!판 || !글조각.length) { console.error('쓰는 법: node scripts/오류위치풀기.mjs <판> "<위치 글>"'); process.exit(2) }
const 폴더 = join(new URL('..', import.meta.url).pathname, '.sourcemaps', 판)
if (!existsSync(폴더)) { console.error(`⛔ ${판} 지도가 없다 — 그 판을 올린 배포 run 의 Actions 아티팩트 sourcemaps-<run 번호> 를 받아 ${폴더} 에 푼다`); process.exit(1) }
const 지도들 = new Map()
let 푼수 = 0
for (const m of 글조각.join('\n').matchAll(/([\w.-]+\.js):(\d+):(\d+)/g)) {
  const [, 파일, 줄, 칸] = m
  const 지도길 = join(폴더, `${파일}.map`)
  if (!existsSync(지도길)) { console.log(`  ❓ ${파일}:${줄}:${칸} — 이 판 지도에 ${파일} 이 없다(다른 판의 오류일 수 있다)`); continue }
  if (!지도들.has(파일)) 지도들.set(파일, new SourceMap(JSON.parse(readFileSync(지도길, 'utf8'))))
  const e = 지도들.get(파일).findEntry(Number(줄) - 1, Number(칸) - 1)
  if (!e || !e.originalSource) { console.log(`  ❓ ${파일}:${줄}:${칸} — 지도에 짝이 없다`); continue }
  console.log(`  📍 ${e.originalSource.replace(/^.*?\/src\//, 'src/')}:${e.originalLine + 1}:${e.originalColumn + 1}${e.name ? `  (${e.name})` : ''}   ← ${파일}:${줄}:${칸}`)
  푼수++
}
process.exit(푼수 ? 0 : 1)
