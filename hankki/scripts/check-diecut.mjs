// ✂️ 흰 테(띠부씰 다이컷) 게이트 — **테 없이 잘린 컷이 앱에 들어오면 배포를 막는다.**
//
// 왜 생겼나 (2026-08-12):
//   창업자가 폰에서 잡았다 — *"꼬르곰 펭펭 테두리가 잘렸어. 우리이거 띠부실스타일로 얇게 자르기로하지 않았어?"*
//   그날 32컷을 자르며 `--diecut` 단계를 **통째로 빠뜨렸다.**
//   ⛔ CLAUDE.md 핀에 **「자를 때 최우선 = --diecut」** 이라고 박혀 있는데도 빠뜨렸다.
//   그리고 고친 뒤 창업자가 또 물었다 — *"테두리 넣어서 자른거 맞지?"* → 넣긴 넣었는데
//   시트가 커지면서 **두께÷긴변이 0.61%→0.40% 로 반토막**이 나 있었다.
//   📮 창업자: *"저장해서 담에 꼭 반영해. (테두리 남기는거...)"*
//
// ⭐ 그래서 규칙이 아니라 **장치**로 만든다 — 규칙은 이미 있었고, 그런데도 하루에 두 번 어긋났다.
//
// 무엇을 재나:
//   흰 테는 «스타일»이 아니라 **보호막**이다. 흰 배경에서 자를 때 진갈색 외곽선이 파먹히는 걸 막는다.
//   그래서 없으면 증상이 **「테두리가 잘렸다」**로 나온다.
//   → 실루엣 «바깥 띠»에서 **흰 픽셀이 몇 %인가**를 센다.
//
// 기준 (짐작 아니라 실측 — 2026-08-12):
//   · 기존 99컷(제대로 잘린 것)  72~86%  (중앙 79%)
//   · 새 32컷(고친 뒤)           88%
//   · ⛔ 테 빼고 자른 컷           7~16%
//   → **40% 미만이면 실패.** 있는 것과 없는 것이 확실히 갈리는 자리다.
//
// ⚠️ 대상을 `rs_` 로 좁힌 이유 = **시끄러운 게이트는 죽은 게이트**(CLAUDE.md).
//    프레임·마테는 테가 없는 게 정상이라 다 보면 거짓 경보가 쏟아진다.
//    `rs_` 131컷은 **같은 서랍에 나란히 놓여 「같은 마감」이라야 하는** 묶음이고, 오늘 터진 자리다.
//    ⏳ 다른 묶음으로 넓힐 땐 그 묶음의 «지금 값»을 먼저 재고 문턱을 따로 정할 것.
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { inflateSync } from 'node:zlib'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIR = path.join(root, 'src/assets/stickers/photo')
const 문턱 = 40           // %
const 대상 = /^rs_/

// PNG 를 RGBA 로 읽는 최소 디코더 — ⛔파이썬·외부 라이브러리 금지(배포 게이트는 노드만으로 돌아야 한다)
function rgbaOf(file) {
  const buf = readFileSync(file)
  let w = 0, h = 0, depth = 0, ctype = 0
  const idat = []
  for (let o = 8; o + 8 <= buf.length;) {
    const len = buf.readUInt32BE(o)
    const type = buf.toString('latin1', o + 4, o + 8)
    const data = buf.subarray(o + 8, o + 8 + len)
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; ctype = data[9] }
    else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    o += 12 + len
  }
  if (ctype !== 6 || depth !== 8 || !w || !h) return null
  let raw
  try { raw = inflateSync(Buffer.concat(idat)) } catch { return null }
  const BPP = 4, stride = w * BPP
  const cur = Buffer.alloc(stride), prev = Buffer.alloc(stride)
  const px = new Uint8Array(w * h * 4)
  for (let y = 0; y < h; y += 1) {
    const off = y * (stride + 1)
    if (off + stride >= raw.length + 1) break
    const filter = raw[off]
    raw.copy(cur, 0, off + 1, off + 1 + stride)
    for (let i = 0; i < stride; i += 1) {
      const a = i >= BPP ? cur[i - BPP] : 0, b = prev[i], c = i >= BPP ? prev[i - BPP] : 0
      if (filter === 1) cur[i] = (cur[i] + a) & 255
      else if (filter === 2) cur[i] = (cur[i] + b) & 255
      else if (filter === 3) cur[i] = (cur[i] + ((a + b) >> 1)) & 255
      else if (filter === 4) {
        const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c)
        cur[i] = (cur[i] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255
      }
    }
    cur.copy(px.subarray ? Buffer.from(px.buffer, y * stride, stride) : cur, 0)
    for (let i = 0; i < stride; i += 1) px[y * stride + i] = cur[i]
    cur.copy(prev)
  }
  return { w, h, px }
}

// 바깥 띠 = 실루엣에서 r 만큼 «벗긴 것»과의 차이. (침식을 직접 쓰지 않고 이웃만 본다 — 가볍다)
function 흰띠비율({ w, h, px }, r = 3) {
  const 보임 = (x, y) => (x >= 0 && y >= 0 && x < w && y < h) && px[(y * w + x) * 4 + 3] > 60
  let 띠 = 0, 흰 = 0
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (!보임(x, y)) continue
      let 가장자리 = false
      for (let dy = -r; dy <= r && !가장자리; dy += 1) {
        for (let dx = -r; dx <= r; dx += 1) {
          if (!보임(x + dx, y + dy)) { 가장자리 = true; break }
        }
      }
      if (!가장자리) continue
      띠 += 1
      const i = (y * w + x) * 4
      if (Math.min(px[i], px[i + 1], px[i + 2]) > 236) 흰 += 1
    }
  }
  return 띠 ? (흰 / 띠) * 100 : 0
}

if (!existsSync(DIR)) { console.log('✂️ 스티커 폴더가 없어 건너뜀'); process.exit(0) }
const 파일 = readdirSync(DIR).filter((f) => f.endsWith('.png') && 대상.test(f))
const 나쁨 = []
let 잰것 = 0, 합 = 0
for (const f of 파일) {
  const im = rgbaOf(path.join(DIR, f))
  if (!im) continue
  const v = 흰띠비율(im)
  잰것 += 1; 합 += v
  if (v < 문턱) 나쁨.push({ f, v })
}

if (나쁨.length) {
  나쁨.sort((a, b) => a.v - b.v)
  console.error(`\n❌ 흰 테(띠부씰 다이컷) 없이 잘린 컷 ${나쁨.length}개`)
  console.error(`   바깥 띠의 흰 비율이 ${문턱}% 미만이다. 제대로 잘린 컷은 72~88% 다.`)
  for (const b of 나쁨.slice(0, 12)) console.error(`   ${b.f.padEnd(14)} ${b.v.toFixed(0)}%`)
  if (나쁨.length > 12) console.error(`   … 외 ${나쁨.length - 12}개`)
  console.error('\n   ⭐ 흰 테는 「스타일」이 아니라 «보호막»이다 — 없으면 진갈색 외곽선이 파먹혀')
  console.error('      증상이 「테두리가 잘렸다」로 나온다 (창업자 2026-08-12 폰 제보).')
  console.error('   고치는 법: `tools/cut.py … --diecut auto` 또는 자체 스크립트에 diecut 단계를 넣고 다시 자른다.')
  console.error('   두께는 «고정 픽셀»로 두지 말 것 — 시트가 커지면 상대적으로 얇아진다 (긴변 × 0.008 로).\n')
  process.exit(1)
}
console.log(`✅ 흰 테 OK — rs_ ${잰것}컷 전부 다이컷 있음 (바깥 띠 흰 비율 평균 ${(합 / Math.max(1, 잰것)).toFixed(0)}%)`)
