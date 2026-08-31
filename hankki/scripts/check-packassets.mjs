// 💰 «팔기로 한 컷이 앱 안에 진짜 있나» — 유료팩 자산 게이트
//
// ⛔⛔ **왜 만들었나 (2026-08-05)**
//   결제 붙일 준비를 하다 세어 보니 **팔기로 한 192컷 중 154컷(80%)이 앱에 아예 없었다.**
//   `paidPacks.js` 의 `packed` 명단엔 이름이 다 적혀 있는데 **그림 파일이 `src/assets` 에 없었다.**
//   그대로 서랍 자물쇠 UI 를 만들었으면 **빈 칸만 잔뜩** 나왔을 것이다.
//   할 일 목록(`docs/할일-전체정리-2026-08-05.md` 8단계)에도 이 단계가 통째로 빠져 있었다.
//
//   📌 배운 것 = **「명단에 적혀 있다」 ≠ 「앱에 들어와 있다」.**
//      명단(`paidPacks.js`)·파일(`src/assets`)·등록표(`PHOTO_RATIO`) **세 벌**이 다 맞아야 화면에 뜬다.
//      세 벌은 «반드시» 어긋난다 — 사람이 세 군데를 다 고치는 걸 잊기 때문이다. 그래서 기계가 센다.
//
// 재는 것 넷
//   Ⓐ 명단의 컷이 `src/assets/stickers/photo/` 에 **파일**로 있나
//   Ⓑ `PHOTO_RATIO` 에 **등록**됐나        ← 파일만 있고 등록이 없으면 서랍에 못 올린다
//   Ⓒ 등록된 ratio 가 **실제 그림 비율(가로÷세로)** 과 맞나  ← 뒤집히면 스티커가 찌그러진다
//   Ⓓ **투명(RGBA)** 인가                   ← 흰 네모가 통째로 붙는다
//
// ⚠️ `packed` 가 빈 팩(크리스마스·겨울)은 «아직 안 골랐다»는 뜻이라 그냥 넘어간다.
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PHOTO = join(ROOT, 'src/assets/stickers/photo')

const packSrc = readFileSync(join(ROOT, 'src/data/paidPacks.js'), 'utf8')
const stickerSrc = readFileSync(join(ROOT, 'src/components/Stickers.jsx'), 'utf8')

// ── PHOTO_RATIO 를 읽는다 (등록표)
const ri = stickerSrc.indexOf('const PHOTO_RATIO = {')
const rj = stickerSrc.indexOf('\n}', ri)
if (ri < 0 || rj < 0) { console.error('⛔ PHOTO_RATIO 를 못 찾았다'); process.exit(1) }
const RATIO = new Map()
for (const m of stickerSrc.slice(ri, rj).matchAll(/(\w+):\s*([\d.]+)/g)) RATIO.set(m[1], Number(m[2]))

// ── 팩별 packed 명단
const packs = [...packSrc.matchAll(/key: '([a-z]+)', label: '([^']+)'[\s\S]*?packed: \[([\s\S]*?)\n {4}\]/g)]
  .map((m) => ({ key: m[1], label: m[2], items: [...m[3].matchAll(/'([^']+)'/g)].map((x) => x[1]) }))
if (!packs.length) { console.error('⛔ paidPacks.js 에서 packed 를 하나도 못 읽었다'); process.exit(1) }

// ── PNG 헤더에서 가로·세로·색깔종류를 직접 읽는다 (라이브러리 없이)
//    IHDR = 8바이트 시그니처 뒤 [길이4][IHDR4][가로4][세로4][깊이1][색타입1]
//    색타입 6 = RGBA · 4 = 회색＋알파 · 3 = 팔레트(tRNS 가 있으면 투명)
const pngInfo = (p) => {
  const b = readFileSync(p)
  if (b.length < 33 || b.toString('ascii', 12, 16) !== 'IHDR') return null
  return {
    w: b.readUInt32BE(16),
    h: b.readUInt32BE(20),
    colorType: b[25],
    hasTRNS: b.includes(Buffer.from('tRNS', 'ascii')),
  }
}

const bad = { missing: [], unreg: [], ratio: [], opaque: [] }
let checked = 0

for (const p of packs) {
  if (!p.items.length) continue                    // ⏳ 아직 안 고른 팩
  for (const key of p.items) {
    const file = join(PHOTO, `${key}.png`)
    if (!existsSync(file)) { bad.missing.push(`${p.label} / ${key}`); continue }
    checked++
    if (!RATIO.has(key)) { bad.unreg.push(`${p.label} / ${key}`); continue }
    const info = pngInfo(file)
    if (!info) continue
    const real = info.w / info.h
    const got = RATIO.get(key)
    // 0.5% 넘게 어긋나면 잘못 적은 것 (뒤집힌 경우는 확실히 걸린다)
    if (Math.abs(real - got) / real > 0.005) bad.ratio.push(`${p.label} / ${key}  적힌 값 ${got} ≠ 실제 ${real.toFixed(4)}`)
    const clear = info.colorType === 6 || info.colorType === 4 || (info.colorType === 3 && info.hasTRNS)
    if (!clear) bad.opaque.push(`${p.label} / ${key}  colorType=${info.colorType}`)
  }
}

const show = (list, title, why) => {
  if (!list.length) return 0
  console.error(`\n⛔ ${title} — ${list.length}개`)
  console.error(`   ${why}`)
  for (const s of list.slice(0, 20)) console.error(`   · ${s}`)
  if (list.length > 20) console.error(`   … 외 ${list.length - 20}개`)
  return list.length
}

let n = 0
n += show(bad.missing, '앱에 그림 파일이 없다', 'src/assets/stickers/photo/<이름>.png 가 없다 → 서랍에 빈 칸이 뜬다')
n += show(bad.unreg, 'PHOTO_RATIO 에 등록이 안 됐다', '파일은 있는데 등록표에 없다 → 서랍에 «아예 안 나온다»')
n += show(bad.ratio, 'ratio 가 실제 그림과 다르다', 'ratio = 가로÷세로 다. 뒤집어 적으면 스티커가 찌그러진다')
n += show(bad.opaque, '투명 배경이 아니다', '흰 네모가 통째로 붙는다')

if (n) {
  console.error(`\n👉 고치는 법 — 원본은 docs/stickers/신규-2607-*유료팩/ 에 있다.`)
  console.error(`   ① src/assets/stickers/photo/ 로 복사 ② Stickers.jsx 의 PHOTO_RATIO 에 «가로÷세로» 로 등록`)
  process.exit(1)
}

const total = packs.filter((p) => p.items.length).map((p) => `${p.label} ${p.items.length}`).join(' · ')
const waiting = packs.filter((p) => !p.items.length).map((p) => p.label).join(' · ')
console.log(`✅ 유료팩 자산 ${checked}컷 — 파일·등록·비율·투명 전부 통과 (${total})`)
if (waiting) console.log(`   ⏳ 아직 컷을 안 고른 팩 = ${waiting}`)
