// 🖼🖼 프레임의 «창»이 어디인가 — 알파를 읽어서 «실측»한다 (2026-08-06)
//
// ⭐ 왜 만드나 = 창업자 *"프레임 꾸미기에 넣어서 프레임잡으려면 사진 넣을수(스티커처럼) 있으면 좋겠어"*
//    프레임 안에 사진을 끼우려면 **창이 어디고 얼마나 큰지**를 알아야 한다.
//    ⛔ 「대충 70%」로 박으면 프레임마다 어긋난다 — 폴라로이드는 아래 여백이 넓고 아치는 위가 둥글다.
//    📌 우리 규칙 = **숫자를 짐작하지 말고 픽셀을 잰다**(메모칸 좌표 3번 고친 그 교훈).
//
// 🕳 창 = 그림 «안쪽»의 투명한 덩어리. 바깥 투명(배경)과 이어지지 않은 것만 창이다.
//    ⛔ 그냥 「알파 0」을 다 세면 프레임 «바깥»까지 창으로 잡는다.
//    → 가장자리에서 물을 부어(flood fill) 바깥 투명을 먼저 지우고, 남은 투명 덩어리 중 제일 큰 것.
//
// 📤 결과 = `src/data/frameWindows.js` — 프레임 폭·높이를 1 로 봤을 때의 비율 { cx, cy, w, h }
//    ⚠️ 손으로 고치지 말 것. 프레임을 새로 넣거나 다시 자르면 **이걸 다시 돌린다.**
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import zlib from 'node:zlib'

const ROOT = new URL('..', import.meta.url).pathname
const DIR = join(ROOT, 'src/assets/stickers/photo')

// PNG 알파만 뽑는다 — `node:zlib` 만으로(외부 꾸러미 없이). `check-cutouts.mjs` 와 같은 방식.
function pngAlpha(buf) {
  let p = 8, w = 0, h = 0, bit = 0, ct = 0, idat = []
  while (p < buf.length) {
    const len = buf.readUInt32BE(p); const typ = buf.toString('ascii', p + 4, p + 8)
    if (typ === 'IHDR') { w = buf.readUInt32BE(p + 8); h = buf.readUInt32BE(p + 12); bit = buf[p + 16]; ct = buf[p + 17] }
    else if (typ === 'IDAT') idat.push(buf.subarray(p + 8, p + 8 + len))
    else if (typ === 'IEND') break
    p += 12 + len
  }
  if (ct !== 6 || bit !== 8) return null // 알파 있는 8비트 RGBA 만 본다
  const raw = zlib.inflateSync(Buffer.concat(idat))
  const bpp = 4, stride = w * bpp
  const out = Buffer.alloc(h * stride)
  let o = 0
  for (let y = 0; y < h; y++) {
    const f = raw[o++]; const line = raw.subarray(o, o + stride); o += stride
    const cur = out.subarray(y * stride, (y + 1) * stride)
    const prev = y ? out.subarray((y - 1) * stride, y * stride) : null
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0
      const b = prev ? prev[x] : 0
      const c = (prev && x >= bpp) ? prev[x - bpp] : 0
      let v = line[x]
      if (f === 1) v += a
      else if (f === 2) v += b
      else if (f === 3) v += (a + b) >> 1
      else if (f === 4) { const q = a + b - c; const pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c) }
      cur[x] = v & 255
    }
  }
  const al = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) al[i] = out[i * 4 + 3]
  return { w, h, al }
}

const CLEAR = 40 // 이 아래면 「투명」

// 가장자리에서 물을 부어 «바깥» 투명을 지운다 → 남은 투명이 「창」 후보
function innerHoles({ w, h, al }) {
  const seen = new Uint8Array(w * h)
  const st = []
  const push = (i) => { if (!seen[i] && al[i] < CLEAR) { seen[i] = 1; st.push(i) } }
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x) }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1) }
  while (st.length) {
    const i = st.pop(); const x = i % w, y = (i / w) | 0
    if (x > 0) push(i - 1); if (x < w - 1) push(i + 1)
    if (y > 0) push(i - w); if (y < h - 1) push(i + w)
  }
  // 남은 투명 = 안쪽 구멍. 덩어리별로 묶는다.
  const lab = new Uint8Array(w * h)
  let best = null
  for (let i0 = 0; i0 < w * h; i0++) {
    if (lab[i0] || seen[i0] || al[i0] >= CLEAR) continue
    const q = [i0]; lab[i0] = 1
    let n = 0, x0 = w, x1 = -1, y0 = h, y1 = -1
    while (q.length) {
      const i = q.pop(); const x = i % w, y = (i / w) | 0
      n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
      const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]
      for (const j of nb) if (j >= 0 && !lab[j] && !seen[j] && al[j] < CLEAR) { lab[j] = 1; q.push(j) }
    }
    if (!best || n > best.n) best = { n, x0, x1, y0, y1, lab: null }
  }
  if (!best) return null
  // 🔁 제일 큰 덩어리를 «다시» 칠해서 마스크로 남긴다 (아래 «안에 들어가는 네모» 계산에 쓴다)
  const mask = new Uint8Array(w * h)
  {
    const cx = ((best.x0 + best.x1) >> 1), cy = ((best.y0 + best.y1) >> 1)
    let seed = cy * w + cx
    if (seen[seed] || al[seed] >= CLEAR) { // 가운데가 그림이면 덩어리 안의 아무 점이나 찾는다
      seed = -1
      for (let y = best.y0; y <= best.y1 && seed < 0; y++) for (let x = best.x0; x <= best.x1; x++) {
        const i = y * w + x; if (!seen[i] && al[i] < CLEAR) { seed = i; break }
      }
    }
    if (seed >= 0) {
      const q = [seed]; mask[seed] = 1
      while (q.length) {
        const i = q.pop(); const x = i % w, y = (i / w) | 0
        const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]
        for (const j of nb) if (j >= 0 && !mask[j] && !seen[j] && al[j] < CLEAR) { mask[j] = 1; q.push(j) }
      }
    }
  }
  best.mask = mask
  return best
}

// 📐 창 «안에 들어가는» 네모를 찾는다.
//   ⛔ 바깥테두리(bounding box)를 그대로 쓰면 **물결·아치 창에서 모서리가 삐져나온다**
//      (2026-08-06 실물 캡처로 잡았다 — 사진 모서리가 프레임 밖으로 나왔다).
//   ⭐ 방법 = 바깥테두리와 «같은 모양»을 유지한 채 가운데에서 조금씩 줄여 가며
//      네 변이 전부 창 «안»에 들어오는 제일 큰 크기를 찾는다(이분 탐색).
function insideRect(mask, w, h, b) {
  const cx = (b.x0 + b.x1 + 1) / 2, cy = (b.y0 + b.y1 + 1) / 2
  const bw = b.x1 - b.x0 + 1, bh = b.y1 - b.y0 + 1
  // ⚠️⚠️ **「한 점도 안 물리게」로 재면 안 된다** — 물결 창은 끄트머리 하나 때문에
  //    `fit` 이 0.52 까지 떨어져 **사진이 반쪽**이 된다(2026-08-06 실측으로 확인).
  //    ⭐ 종이 액자도 사진 모서리가 물결 뒤로 조금 들어간다 — 그게 «정상»이다.
  //    → 둘레의 `TOL` 까지는 물려도 통과. 그리고 아무리 깎여도 `MIN` 아래로는 안 내려간다.
  const TOL = 0.06 // 둘레의 6% 까지는 프레임 뒤로 물려도 된다
  const MIN = 0.86 // 이보다 더 줄이면 「액자에 낀 사진」이 아니라 「가운데 작은 사진」이 된다
  const fits = (k) => {
    const hw = (bw * k) / 2, hh = (bh * k) / 2
    const x0 = Math.round(cx - hw), x1 = Math.round(cx + hw) - 1
    const y0 = Math.round(cy - hh), y1 = Math.round(cy + hh) - 1
    if (x0 < 0 || y0 < 0 || x1 >= w || y1 >= h || x1 <= x0 || y1 <= y0) return false
    // 네 변만 훑으면 된다 — 창은 «한 덩어리»라 변이 다 안에 있으면 속도 안이다
    let out = 0, tot = 0
    for (let x = x0; x <= x1; x++) { tot += 2; if (!mask[y0 * w + x]) out++; if (!mask[y1 * w + x]) out++ }
    for (let y = y0; y <= y1; y++) { tot += 2; if (!mask[y * w + x0]) out++; if (!mask[y * w + x1]) out++ }
    return out <= tot * TOL
  }
  if (fits(1)) return 1
  let lo = MIN, hi = 1
  for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (fits(m)) lo = m; else hi = m }
  return lo
}

const files = readdirSync(DIR).filter((f) => /^pf_.*\.png$/.test(f)).sort()
const out = {}
let none = []
for (const f of files) {
  const key = f.replace('.png', '')
  const im = pngAlpha(readFileSync(join(DIR, f)))
  if (!im) { none.push(`${key}(RGBA 아님)`); continue }
  const b = innerHoles(im)
  // 🚫 너무 작은 구멍은 창이 아니다(리본 매듭 사이 틈 같은 것). 그림 넓이의 8% 미만이면 버린다.
  if (!b || b.n < im.w * im.h * 0.08) { none.push(key); continue }
  const k = insideRect(b.mask, im.w, im.h, b)   // 창 «안에» 들어가는 비율
  const wf = ((b.x1 - b.x0 + 1) / im.w) * k
  const hf = ((b.y1 - b.y0 + 1) / im.h) * k
  out[key] = {
    cx: +(((b.x0 + b.x1 + 1) / 2) / im.w).toFixed(4), // 프레임 폭을 1 로 본 창 «가운데»
    cy: +(((b.y0 + b.y1 + 1) / 2) / im.h).toFixed(4),
    w: +wf.toFixed(4), h: +hf.toFixed(4),
    fit: +k.toFixed(3), // 1 = 창이 네모 · 낮을수록 물결·아치라 안쪽으로 더 줄였다
  }
}

const body = `// 🖼 프레임의 «창» — 알파를 실측해서 뽑은 표. ⛔ 손으로 고치지 말 것.
//   다시 뽑기 = \`node scripts/frame-windows.mjs\`
//   값 = 프레임 폭·높이를 1 로 봤을 때 { cx, cy = 창 가운데 · w, h = 창 크기 }
//   ⚠️ 창이 없는 프레임(${none.length}개)은 여기 «없다» — 사진을 끼울 수 없다는 뜻이고, 그건 정상이다.
export const FRAME_WINDOW = ${JSON.stringify(out, null, 2)}
`
writeFileSync(join(ROOT, 'src/data/frameWindows.js'), body)
console.log(`🖼 프레임 ${files.length}개 중 창을 찾은 것 ${Object.keys(out).length}개 · 창 없는 것 ${none.length}개`)
if (none.length) console.log('   창 없음:', none.join(' '))
const ws = Object.values(out)
if (ws.length) {
  const avg = (k) => (ws.reduce((s, v) => s + v[k], 0) / ws.length).toFixed(3)
  console.log(`   창 크기 평균 = 폭 ${avg('w')} · 높이 ${avg('h')} (프레임을 1 로 봤을 때)`)
}
