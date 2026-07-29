// 🔍 스티커 해상도 게이트 — **캔버스에 올렸을 때 확대돼서 뭉개지는 스티커**를 빌드 전에 잡는다.
//
// 왜 생겼나(2026-07-29):
//   여름다꾸·미니아이콘·파스텔 172종을 넣었는데 창업자 폰에서 "다 깨져" 제보를 받았다.
//   원본 시트 한 장(1254px)에 아이템이 90~100개라 하나당 긴변이 85~141px뿐인데,
//   캔버스엔 1080 × s(0.15~0.22) = 162~238px 로 올라간다 → **2~3배 확대 = 뭉갬.**
//   그날 검수는 '잘림·투명'만 봤고 **해상도를 안 봤다.** 서랍(피커)은 56px로 작게 보여 멀쩡해 보였다.
//   → 눈으로 놓칠 수 있는 것이므로 숫자로 막는다.
//
// 기준(추측 아니라 실측으로 정함 — 같은 배율로 렌더해 눈으로 비교):
//   · 여름다꾸 2.8배 → 꽃잎 가장자리 번짐        ❌
//   · 미니      2.5배 → 외곽선 뭉툭              ❌
//   · 파스텔    1.7배 → 얇은 리본선 부옇게        △
//   · 프레임    1.4~1.6배 → 멀쩡                 ✅  (굵은 단색 선이라 확대에 강하다)
//   → **1.7배 초과면 실패.** 갈린 건 배율보다 '선이 굵은가'였지만,
//     규칙은 단순해야 실수를 막으므로 배율 하나로 자른다.
//   ⚠️ 1.7배 이하도 완벽하진 않다 — 선이 얇고 디테일 많은 그림은 이 안에서도 번진다.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PHOTO_DIR = path.join(root, 'src/assets/stickers/photo')
const CANVAS = 1080

// DecorEditor.addSticker 의 기본 s 값과 맞춰둔다. 바뀌면 여기도 같이 고칠 것.
const defaultScale = (key) => {
  if (key.startsWith('pf_')) return 0.58              // 프레임(밑판)
  if (key.startsWith('gp_duo')) return 0.34
  if (key.startsWith('gp_')) return 0.26
  if (key.startsWith('dc_') || key.startsWith('ch_')) return 0.15
  return 0.22                                          // 그 밖의 사진 스티커
}

// PNG 헤더에서 크기만 읽는다(의존성 없이).
const pngSize = (file) => {
  const b = fs.readFileSync(file, { start: 0, end: 32 })
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }
}

const src = fs.readFileSync(path.join(root, 'src/components/Stickers.jsx'), 'utf8')
const registered = new Set()
for (const m of src.matchAll(/items:\s*\[([^\]]*)\]/g)) {
  for (const raw of m[1].split(',')) {
    const k = raw.trim().replace(/^'|'$/g, '')
    if (/^[a-z][\w]*$/i.test(k)) registered.add(k)
  }
}

const bad = []
for (const key of registered) {
  const f = path.join(PHOTO_DIR, `${key}.png`)
  if (!fs.existsSync(f)) continue                      // SVG 스티커·프레임은 대상 아님
  const { w, h } = pngSize(f)
  const shown = Math.round(CANVAS * defaultScale(key))
  const long = Math.max(w, h)
  const zoom = shown / long
  if (zoom > 1.7) bad.push({ key, long, shown, zoom: zoom.toFixed(1) })
}

if (bad.length) {
  bad.sort((a, b) => b.zoom - a.zoom)
  console.error(`\n❌ 캔버스에서 확대돼 뭉개지는 스티커 ${bad.length}개`)
  console.error('   (표시 크기 ÷ 소스 긴변 > 1.7배 — 확대는 화질을 못 살린다)')
  for (const b of bad.slice(0, 20)) {
    console.error(`   ${b.key.padEnd(14)} 소스 ${String(b.long).padStart(4)}px → 표시 ${b.shown}px  (${b.zoom}배 확대)`)
  }
  if (bad.length > 20) console.error(`   … 외 ${bad.length - 20}개`)
  console.error('\n   고치는 법: 시트를 **25컷 격자 이하**로 다시 뽑아 컷당 200~300px 확보')
  console.error('   (docs/자랑공유-캐릭터리뉴얼.md 화질 규칙)\n')
  process.exit(1)
}
console.log(`✅ 스티커 해상도 OK — 등록된 사진 스티커 ${registered.size}개 중 1.7배 넘게 확대되는 것 없음`)
