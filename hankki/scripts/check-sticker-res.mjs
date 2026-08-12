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
  // 🐻🐧 레꾸 캐릭터 32컷 — 캡션이 붙어 있어 크게 붙는다(창업자 2026-08-12 *"글자가 너무 작아?"*)
  //   ⛔⛔ **2026-08-12 에 이 줄을 빠뜨려 게이트가 «거짓 초록불»을 냈다.** 0.22 로 재고 통과시켰다.
  //      DecorEditor 630줄을 고치면 **여기도 반드시** 고친다(값이 두 곳에 복사돼 있다).
  if (key.startsWith('rs_v') || key.startsWith('rs_k')) return 0.32
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
const 축섞임 = []
for (const key of registered) {
  const f = path.join(PHOTO_DIR, `${key}.png`)
  if (!fs.existsSync(f)) continue                      // SVG 스티커·프레임은 대상 아님
  const { w, h } = pngSize(f)
  const shown = Math.round(CANVAS * defaultScale(key))
  const long = Math.max(w, h)
  const zoom = shown / long
  if (zoom > 1.7) bad.push({ key, long, shown, zoom: zoom.toFixed(1) })
  // ⚠️⚠️ **이 검사는 축이 섞여 있다** (2026-08-12 발견 · 실측)
  //   `s` 는 **폭** 기준인데(`DecorLayer` 225줄 `width: ${it.s*100}%`) 위에서는
  //   «표시 폭 ÷ 소스 긴변»으로 나눈다 → **세로로 긴 컷을 실제보다 작게 잰다.**
  //   진짜 배율은 «표시 폭 ÷ 소스 폭» 이다.
  //   ⛔ 그런데 바로 고쳐 «실패»로 만들면 **프레임 23컷이 통째로 배포를 막는다** —
  //      전부 2026-07-30에 눈으로 보고 «멀쩡하다»고 판정한 것들이다
  //      (CLAUDE.md: *"프레임 1.4~1.6배 → 멀쩡 ✅ 굵은 단색 선이라 확대에 강하다"*).
  //      시끄러운 게이트는 죽은 게이트라, **경고로만** 띄우고 실패는 안 시킨다.
  //   ✅ 새로 넣는 컷은 «이 숫자»로 보고 s 를 정한다 — 2026-08-12 레꾸 캐릭터 32컷이 그랬다.
  //   ⏳ 프레임 23컷을 창업자가 판정하면 그때 이걸 실패로 승격한다.
  const 진짜 = shown / w
  if (진짜 > 1.7) 축섞임.push({ key, w, h, shown, 옛: zoom.toFixed(2), 진짜: 진짜.toFixed(2) })
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

if (축섞임.length) {
  축섞임.sort((a, b) => b.진짜 - a.진짜)
  console.log(`\n⚠️ 「폭으로 다시 재면」 1.7배를 넘는 컷 ${축섞임.length}개 (⛔실패 아님 — 위 주석 참조)`)
  console.log('   위 검사는 «표시 폭 ÷ 소스 긴변» 이라 세로로 긴 컷을 작게 잰다. 아래가 진짜 배율이다.')
  for (const b of 축섞임.slice(0, 8)) {
    console.log(`   ${b.key.padEnd(12)} 소스 ${String(b.w).padStart(4)}×${String(b.h).padStart(4)} → 표시 폭 ${b.shown}px   옛 ${b.옛}배 → 진짜 ${b.진짜}배`)
  }
  if (축섞임.length > 8) console.log(`   … 외 ${축섞임.length - 8}개`)
  console.log('   ⏳ 프레임(pf_)은 2026-07-30 에 눈으로 보고 멀쩡하다고 판정한 것들이다. 창업자 재판정 뒤 실패로 승격한다.')
}

// ── 📏 「키울 수 있는 여유」 — 위 검사가 못 잡는 것 (2026-07-31 추가) ─────────────
// ⚠️ 위 검사는 **기본 크기**만 잰다. 그런데 유저는 손잡이로 **키운다.**
//    창업자가 마늘·셰프모자를 크게 키운 화면에서 *"테두리가 지저분해"* 라고 잡아냈는데,
//    파일은 멀쩡했고 원인은 **확대**였다. 소스가 200px인 컷을 700px로 늘리면 당연히 뭉갠다.
// ✅ 앱 쪽은 `DecorLayer` 손잡이가 **소스 긴변 × 1.7배**까지만 커지게 막아 뒀다(뭉개짐 자체는 안 생긴다).
//    여기서는 **"얼마나 못 키우는지"** 를 보여준다 — 너무 작으면 유저가 답답하다 = 다시 뽑을 후보.
// ⛔ 실패시키지 않는다(경고만) — 시끄러운 게이트는 아무도 안 본다.
const CANVAS_HALF = 540                          // 표지의 절반쯤 = 사람들이 흔히 키우는 크기
const tight = []
for (const key of registered) {
  const f = path.join(PHOTO_DIR, `${key}.png`)
  if (!fs.existsSync(f)) continue
  const { w, h } = pngSize(f)
  const long = Math.max(w, h)
  const canGrowTo = Math.round(long * 1.7)       // 손잡이 상한과 같은 기준
  if (canGrowTo < CANVAS_HALF) tight.push({ key, long, canGrowTo })
}
if (tight.length) {
  tight.sort((a, b) => a.long - b.long)
  console.log(`\n📏 크게 못 키우는 컷 ${tight.length}개 — 표지 절반(${CANVAS_HALF}px)까지 못 간다`)
  console.log('   (지금 화질은 정상이다. 다음에 시트를 다시 뽑을 때 크게 받으면 좋은 목록)')
  for (const t of tight.slice(0, 12)) {
    console.log(`   ${t.key.padEnd(16)} 소스 ${String(t.long).padStart(4)}px → 최대 ${t.canGrowTo}px 까지`)
  }
  if (tight.length > 12) console.log(`   … 외 ${tight.length - 12}개`)
  console.log('   📐 다시 뽑을 때 = 시트 한 장에 4~9컷, 컷당 600px 이상\n')
}
