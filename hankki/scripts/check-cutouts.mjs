// ✂️ 컷 검수 게이트 — **새 스티커는 이걸 통과해야만 앱에 들어온다.**
//
// 왜 만들었나 (창업자 2026-07-30):
//   *"온보드 꼬르곰펭펭 잘린면에 빨강선보여 큰일날뻔.. 스티커 자를때 꼼꼼히 검수하면 좋겠다."*
//   *"이거 구조적으로 처음부터 검수하는 코드나 규칙은 못만들어?"*
//   → **눈으로 하는 검수는 언젠가 놓친다.** 사람이 아니라 이 게이트가 본다.
//     `npm run smoke` 에 물려 있어서 **걸리면 배포가 막힌다.**
//
// 무엇을 보나 (등록된 사진 스티커 전부)
//   ① **잘림**   — 그림이 이미지 가장자리에 닿음 = 시트에서 자를 때 잘렸다
//   ② **잡조각** — 본체와 떨어진 작은 덩어리가 가장자리에 닿았거나 가늘고 김 = 옆 그림이 딸려옴
//   ③ **계단**   — 알파가 0/255 뿐 = 안티에일리어싱이 없어 테두리가 각짐
//
// ⚠️ **예외는 반드시 이유와 함께 적는다** (`scripts/cutout-allow.json`).
//    마스킹테이프는 양끝이 잘린 게 정상이고, 점선 프레임의 점은 잡조각이 아니다.
//    이유 없이 넣지 말 것 — 그러면 게이트가 무의미해진다.
//
// 쓰기:  node scripts/check-cutouts.mjs         (통과/실패)
//        node scripts/check-cutouts.mjs --list  (예외 후보를 json 형식으로 뽑아준다)
import { readFileSync, existsSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import { join } from 'node:path'

const ROOT = process.cwd()
const LIST = process.argv.includes('--list')
const PHOTO = join(ROOT, 'src/assets/stickers/photo')
const ALLOW_PATH = join(ROOT, 'scripts/cutout-allow.json')
const allow = existsSync(ALLOW_PATH) ? JSON.parse(readFileSync(ALLOW_PATH, 'utf8')) : {}

// ── PNG 알파만 읽는 최소 디코더 (의존성 없이 CI에서도 돌게) ──
function alphaOf(file) {
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
  const A = new Uint8Array(w * h)
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
    for (let x = 0; x < w; x += 1) A[y * w + x] = cur[x * BPP + 3]
    cur.copy(prev)
  }
  return { w, h, A }
}

// 덩어리 나누기 — 재귀 대신 스택(큰 이미지에서 스택 오버플로 안 나게)
function blobs(w, h, on) {
  const lab = new Int32Array(w * h).fill(-1)
  const out = []
  const st = []
  for (let s = 0; s < w * h; s += 1) {
    if (!on[s] || lab[s] >= 0) continue
    const id = out.length
    let n = 0, x0 = w, y0 = h, x1 = -1, y1 = -1
    lab[s] = id; st.push(s)
    while (st.length) {
      const p = st.pop(); const x = p % w, y = (p - x) / w
      n += 1
      if (x < x0) x0 = x; if (x > x1) x1 = x
      if (y < y0) y0 = y; if (y > y1) y1 = y
      if (x > 0 && on[p - 1] && lab[p - 1] < 0) { lab[p - 1] = id; st.push(p - 1) }
      if (x < w - 1 && on[p + 1] && lab[p + 1] < 0) { lab[p + 1] = id; st.push(p + 1) }
      if (y > 0 && on[p - w] && lab[p - w] < 0) { lab[p - w] = id; st.push(p - w) }
      if (y < h - 1 && on[p + w] && lab[p + w] < 0) { lab[p + w] = id; st.push(p + w) }
    }
    out.push({ n, x0, y0, x1, y1 })
  }
  return out
}

// 등록된 사진 스티커만 본다(재고까지 막으면 작업이 멈춘다)
const src = readFileSync(join(ROOT, 'src/components/Stickers.jsx'), 'utf8').replace(/\n\s*/g, ' ')
const ids = new Set()
for (const m of src.matchAll(/items: \[([^\]]*)\]/g)) {
  for (const raw of m[1].split(',')) {
    const k = raw.trim().replace(/^'|'$/g, '')
    if (/^[a-z][\w]*$/i.test(k)) ids.add(k)
  }
}

const bad = []
for (const id of [...ids].sort()) {
  const fp = join(PHOTO, `${id}.png`)
  if (!existsSync(fp)) continue
  const img = alphaOf(fp)
  if (!img) continue
  const { w, h, A } = img
  const on = new Uint8Array(w * h)
  let semi = 0
  for (let i = 0; i < A.length; i += 1) { if (A[i] > 40) on[i] = 1; if (A[i] > 15 && A[i] < 235) semi += 1 }
  const why = []

  // ③ 계단 테두리
  if (semi < A.length * 0.0008) why.push('계단 테두리(안티에일리어싱 없음)')

  const bs = blobs(w, h, on)
  if (bs.length) {
    let main = 0
    for (let i = 1; i < bs.length; i += 1) if (bs[i].n > bs[main].n) main = i
    const M = bs[main]
    const MIN_DIM = Math.max(4, Math.round(Math.min(w, h) * 0.03))

    // ① 잘림 — 본체가 가장자리에 닿음
    const edgeN = Math.max(2, Math.round(Math.min(w, h) * 0.02))
    let top = 0, bot = 0, lft = 0, rgt = 0
    for (let x = 0; x < w; x += 1) { if (on[x]) top += 1; if (on[(h - 1) * w + x]) bot += 1 }
    for (let y = 0; y < h; y += 1) { if (on[y * w]) lft += 1; if (on[y * w + w - 1]) rgt += 1 }
    const sides = [top >= edgeN && '위', bot >= edgeN && '아래', lft >= edgeN && '왼', rgt >= edgeN && '오른'].filter(Boolean)
    if (sides.length) why.push(`가장자리 닿음(${sides.join('·')})`)

    // ② 잡조각
    let frag = 0
    for (let i = 0; i < bs.length; i += 1) {
      if (i === main) continue
      const b = bs[i]
      if (b.n < 12 || b.n > M.n * 0.10) continue
      const touches = b.y0 === 0 || b.y1 === h - 1 || b.x0 === 0 || b.x1 === w - 1
      const thin = Math.min(b.x1 - b.x0, b.y1 - b.y0) + 1 <= MIN_DIM
      if (touches || thin) frag += 1
    }
    if (frag) why.push(`잡조각 ${frag}개`)
  }

  if (why.length && !allow[id]) bad.push({ id, why })
}

if (LIST) {
  console.log(JSON.stringify(Object.fromEntries(bad.map((b) => [b.id, b.why.join(' · ')])), null, 2))
  process.exit(0)
}
if (bad.length) {
  console.error(`\n❌ 컷 검수 실패 — ${bad.length}컷`)
  bad.forEach((b) => console.error(`   ✗ ${b.id} — ${b.why.join(' · ')}`))
  console.error('\n고치는 법: python3 tools/clean-cutouts.py --fix <파일>  ·  python3 tools/soften-edges.py')
  console.error('정상인데 걸렸다면 scripts/cutout-allow.json 에 **이유와 함께** 적을 것.')
  process.exit(1)
}
console.log(`✅ 컷 검수 통과 — 등록된 사진 스티커 ${ids.size}개 중 잘림·잡조각·계단 없음 (예외 ${Object.keys(allow).length}건)`)
