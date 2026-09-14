#!/usr/bin/env node
// 🖼🔒 배포 게이트 — 「나가는 그림이 WebP 로 줄었나」 (2026-09-07 · 큰 틀 2)
//
// ⭐ 왜 = `vite-webp.js` 는 «한 장을 못 바꾸면 그 장만 PNG 로 둔다»(빌드를 안 죽인다). 그래서 «조용히»
//    전부 PNG 로 돌아갈 수 있다(sharp 가 안 깔렸거나 훅이 안 불리거나). 그러면 아이폰 앱이 도로 448MB 다.
//    규칙 18 ⓘ = 「초록불이 무엇을 보는지」 — 이 검사는 dist/assets 를 «실제로 세어» 본다.
//
// 잣대 (실측 2026-09-07 기준)
//   · dist/assets 의 PNG 합계가 **20MB** 를 넘으면 ⛔ (전엔 451MB · WebP 뒤엔 «못 바꾼 장»과 작은 조각만 남는다)
//   · WebP 가 «한 장도 없으면» ⛔ (플러그인이 아예 안 돈 것)
//   ⛔ 숫자를 올려서 통과시키지 말 것 — 넘으면 «왜 PNG 가 남았나»를 본다(`npm run build` 로그의 🖼 줄).
import { readdirSync, statSync, existsSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.join(new URL('..', import.meta.url).pathname)
const dir = path.join(ROOT, 'dist', 'assets')
if (!existsSync(dir)) { console.error('⛔ dist/assets 가 없다 — 먼저 npm run build'); process.exit(1) }

let png = 0, pngN = 0, webp = 0, webpN = 0
const 큰png = []
for (const f of readdirSync(dir)) {
  const p = path.join(dir, f); const s = statSync(p).size
  if (/\.png$/i.test(f)) { png += s; pngN++; if (s > 300 * 1024) 큰png.push(`${f} ${Math.round(s / 1024)}KB`) }
  else if (/\.webp$/i.test(f)) { webp += s; webpN++ }
}
const MB = (n) => (n / 1e6).toFixed(1) + 'MB'
console.log(`🖼 dist/assets = PNG ${pngN}장 ${MB(png)} · WebP ${webpN}장 ${MB(webp)}`)

let 나쁨 = 0
if (!webpN) { console.error('⛔ WebP 가 한 장도 없다 — vite-webp 플러그인이 안 돌았다(sharp? vite.config?)'); 나쁨++ }
if (png > 20e6) {
  console.error(`⛔ PNG 가 ${MB(png)} 남았다(상한 20MB) — 못 바꾼 장이 있다. 큰 것: ${큰png.slice(0, 5).join(' · ')}`)
  나쁨++
}
if (나쁨) process.exit(1)
console.log('✅ 그림이 WebP 로 나간다')
