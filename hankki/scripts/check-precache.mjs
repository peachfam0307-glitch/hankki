// 📦 «앱을 처음 켤 때 얼마를 받나» — precache 몸무게 게이트
//
// ⛔⛔ **왜 만들었나 (2026-08-05)**
//   `dist/sw.js` 를 뜯어 세어 보니 서비스워커가 **1444개 · 215MB** 를 미리 받고 있었다.
//   그중 **스티커 PNG 가 1418개 · 212MB(98.6%)** — 앱 코드는 1MB 뿐이었다.
//   ⇒ **앱을 깔면 쓰지도 않을 그림 212MB 를 먼저 내려받고 있었다.**
//      데이터 요금·저장공간·첫 실행 대기 — 셋 다 나쁘다.
//      ⚠️ 재심사 반려 사유 ①이 「테스터가 참여하지 않았습니다」였는데 이게 원인일 수 있다.
//
//   📌 **아무도 몰랐던 이유** = 빌드 로그에 `precache 1444 entries (190568.84 KiB)` 라고
//      «분명히 찍히고 있었다». 사람은 그 줄을 안 읽는다. 그래서 기계가 읽고 «막는다».
//
// 고친 방법 = `vite.config.js` 의 globIgnores 로 그림을 빼고,
//   `src/sw.js` 에서 CacheFirst 런타임 캐시로 «쓸 때» 받는다. → 215MB → 4.1MB
//
// ⚠️ 이 검사는 **크기만** 본다. 「그림이 진짜 뜨나」는 `scripts/test-swart.mjs` 가 본다.
//    둘 다 있어야 한다 — 크기만 보면 «아무것도 안 받게» 만들어 놓고 통과할 수 있다.
import { readFileSync, existsSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SW = join(ROOT, 'dist/sw.js')

// 상한 = 8MB. 지금 4.1MB 라 두 배 여유가 있다.
//   ⛔ 넘겼다고 이 숫자를 올려서 통과시키지 말 것 — 「왜 늘었나」를 먼저 본다.
const LIMIT_MB = 8

if (!existsSync(SW)) {
  console.log('⏭  precache 검사 건너뜀 — dist/sw.js 가 없다 (먼저 `npm run build`)')
  process.exit(0)
}

const sw = readFileSync(SW, 'utf8')
const urls = [...sw.matchAll(/"url":"([^"]+)"/g)].map((m) => m[1])
if (!urls.length) {
  console.error('⛔ dist/sw.js 안에서 precache 목록을 못 읽었다 — 형식이 바뀌었을 수 있다')
  process.exit(1)
}

const byDir = new Map()
let bytes = 0
for (const u of urls) {
  const rel = u.replace(/^\.\//, '')
  let size = 0
  try { size = statSync(join(ROOT, 'dist', rel)).size } catch { /* 없으면 0 */ }
  const dir = (rel.match(/^([^/]+)\//) || [, '(루트)'])[1]
  const cur = byDir.get(dir) || { n: 0, b: 0 }
  byDir.set(dir, { n: cur.n + 1, b: cur.b + size })
  bytes += size
}
const mb = bytes / 1024 / 1024

const rows = [...byDir.entries()].sort((a, b) => b[1].b - a[1].b)
console.log(`📦 precache — ${urls.length}개 · ${mb.toFixed(1)}MB  (상한 ${LIMIT_MB}MB)`)
for (const [d, v] of rows) console.log(`   ${d.padEnd(16)} ${String(v.n).padStart(4)}개 ${(v.b / 1024 / 1024).toFixed(2).padStart(7)}MB`)

if (mb > LIMIT_MB) {
  console.error(`\n⛔⛔ **앱을 처음 켤 때 ${mb.toFixed(1)}MB 를 받는다 — 상한 ${LIMIT_MB}MB 를 넘었다.**`)
  console.error('   앱을 깐 사람이 «쓰지도 않을 것»까지 먼저 받게 된다. 데이터·저장공간·대기 셋 다 나빠진다.')
  console.error('\n👉 대개 원인은 «그림이 precache 에 들어간 것»이다.')
  console.error('   `vite.config.js` 의 injectManifest.globIgnores 를 볼 것 —')
  console.error("   지금은 ['assets/**/*.png', 'assets/**/*.webp'] 로 스티커를 빼 두었다.")
  console.error('   그림은 `src/sw.js` 의 CacheFirst 라우트가 «쓸 때» 받는다.')
  process.exit(1)
}
console.log('✅ 통과 — 처음 켤 때 받는 양이 상한 안이다')

// 📏📏 [창업자 2026-11-10 「설계를 다시해봐 이런일안생기게」] «한 파일» 계기판 — docs/앱본체-크기벽-설계-2026-11-10.md
//   ⛔ 뿌리 = vite-plugin-pwa 0.21 은 미리받기 파일 하나가 2MiB 를 넘으면 «빌드를 죽인다»(throwMaximumFileSizeToCacheInBytes).
//      11/10 본체가 99.3% 였는데 아무도 몰랐다 → 크리스마스 4단계에서 배포가 통째로 멈췄다.
//   ✅ 그래서 «다 차기 전에» 막는다 — 본체(index-*.js) 80% · 나머지 조각 60%. 넘으면 그 판에서 화면을 하나 더 떼어 낸다.
//   ⭐ 숫자를 넓혀서 풀지 말 것(절대원칙 34) — 떼어 내는 게 답이다.
const 한도 = 2 * 1024 * 1024, 본체예산 = 0.80, 조각예산 = 0.60, 하루증가 = 1600   // 하루증가 = 10/28→11/10 실측 +21KB/13일
const js = urls.map((u) => u.replace(/^\.\//, '')).filter((r) => r.endsWith('.js') && r.startsWith('assets/'))
let 넘음 = 0
console.log('\n📏 파일 하나 계기판 (한도 2MiB · 본체 80% · 조각 60%)')
for (const r of js.map((r) => ({ r, b: statSync(join(ROOT, 'dist', r)).size })).sort((a, b) => b.b - a.b).slice(0, 8)) {
  const 본체 = /^assets\/index-/.test(r.r), 예산 = (본체 ? 본체예산 : 조각예산) * 한도, p = r.b / 한도 * 100
  const 남은날 = Math.floor((예산 - r.b) / 하루증가)
  console.log(`   ${r.r.padEnd(34)} ${(r.b / 1024).toFixed(0).padStart(6)}KB  ${p.toFixed(1).padStart(5)}%  ${본체 ? '본체' : '조각'}${r.b > 예산 ? '  ⛔ 예산 넘음' : 본체 ? `  (예산까지 약 ${남은날}일)` : ''}`)
  if (r.b > 예산) 넘음++
}
if (넘음) {
  console.error(`\n⛔⛔ **파일 ${넘음}개가 예산을 넘었다** — 아직 한도 전이지만 «여유가 있을 때» 막는다.`)
  console.error('   👉 본체면: 첫 화면에 안 쓰는 화면을 App.jsx 에서 lazy 로 떼어 낸다.')
  console.error('   👉 조각이면: 그 조각 안의 큰 모듈을 또 나눈다. ⛔ 한도·예산 숫자를 올리지 않는다.')
  process.exit(1)
}
console.log('✅ 파일 하나 예산 안')
