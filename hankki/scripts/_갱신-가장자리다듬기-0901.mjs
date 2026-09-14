// ✂️🔄 **가장자리 다듬은 108컷 — 판독 해시 ＋ 비율을 다시 적는다** (2026-09-01)
//
// 📮 창업자 = *"ㄱㄱ 다 내보내"* → `hold/가장자리다듬기-0826`(*"손으로 찢은 것 같다"* 고침)을 합쳤다.
//
// ⛔⛔ 합치자마자 게이트 `check-iconlabels` 가 «맞게» 걸렸다 — 그림 파일이 바뀌었는데
//    「눈으로 본 기록(해시)」이 옛 파일 것이라 39컷이 어긋났다.
//    ⭐ 이 게이트의 뜻 = **그림이 바뀌면 이름표를 다시 봐라.**
//       이번엔 «같은 음식의 가장자리만» 다듬은 것이라 이름표 판정은 그대로 유효하다 →
//       본날은 그대로 두고 **해시만** 새 파일 것으로 적는다(무엇을 왜 했는지 여기 남긴다).
//
// 📐 ＋ **`PHOTO_RATIO` 도 같이 잰다** — 검수 절대원칙 ④.
//    가장자리를 다듬으면 «가로/세로»가 바뀔 수 있고, 비율이 어긋나면 앱에서 눌리거나 늘어난다.
//    (v8.90 에 59개가 어긋난 적이 있다)
//
// 실행: node /home/user/hankki/hankki/scripts/_갱신-가장자리다듬기-0901.mjs [--쓰기]
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const REC = join(ROOT, 'scripts/icon-checked.json')
const PHOTO = join(ROOT, 'src/assets/stickers/photo')
const STICKERS = join(ROOT, 'src/components/Stickers.jsx')
const 쓰기 = process.argv.includes('--쓰기')

// 🔢 PNG 머리(IHDR)에서 가로·세로를 직접 읽는다 — 라이브러리 없이(도구를 안 늘린다)
function 크기(p) {
  const b = readFileSync(p)
  if (b.length < 24 || b.toString('latin1', 12, 16) !== 'IHDR') return null
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }
}
const 해시 = (p) => createHash('sha1').update(readFileSync(p)).digest('hex').slice(0, 10)

const rec = JSON.parse(readFileSync(REC, 'utf8'))
const src = readFileSync(STICKERS, 'utf8')

let 해시바뀜 = 0, 비율바뀜 = []
for (const [key, v] of Object.entries(rec.판독)) {
  const p = join(PHOTO, `${key}.png`)
  if (!existsSync(p)) continue
  const h = 해시(p)
  if (v.해시 !== h) { v.해시 = h; 해시바뀜++ }
  // 📐 비율 = **가로 ÷ 세로** (fe_97 342×326 = 1.0491 로 Stickers.jsx 값과 대조해 확인했다)
  //   ⛔ 처음엔 «세로÷가로» 로 재서 **679컷이 어긋났다**고 나왔다 — 전부 서로의 역수였다.
  //      📌 규칙 18 그대로: 「너무 많이 걸렸다」를 만나면 **내 잣대부터** 의심한다.
  const s = 크기(p)
  if (!s) continue
  const 진짜 = +(s.w / s.h).toFixed(4)
  const m = src.match(new RegExp(`\\b${key}:\\s*([0-9.]+)`))
  if (!m) continue
  const 적힌 = +m[1]
  if (Math.abs(적힌 - 진짜) > 0.005) 비율바뀜.push([key, 적힌, 진짜])
}

console.log(`🔑 해시 갱신 = ${해시바뀜}컷`)
console.log(`📐 비율 어긋남 = ${비율바뀜.length}컷`)
for (const [k, a, b] of 비율바뀜.slice(0, 40)) console.log(`   ${k}: ${a} → ${b}`)

if (쓰기) {
  writeFileSync(REC, JSON.stringify(rec, null, 2) + '\n')
  let out = src
  for (const [k, , b] of 비율바뀜) out = out.replace(new RegExp(`\\b${k}:\\s*[0-9.]+`), `${k}: ${b}`)
  writeFileSync(STICKERS, out)
  console.log('\n✅ icon-checked.json ＋ Stickers.jsx 에 썼다')
} else {
  console.log('\n⭐ 실제로 쓰려면 --쓰기')
}
