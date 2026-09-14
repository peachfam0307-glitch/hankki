// 한끼 앱 아이콘 생성기 — 외부 라이브러리 없이 순수 Node 로 PNG 를 그린다.
// 크림톤 배경 + 브라운 그릇 + 새싹, 시안의 로고와 같은 무드.
import { writeFileSync, mkdirSync } from 'node:fs'
import { deflateSync } from 'node:zlib'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'icons')
mkdirSync(OUT, { recursive: true })

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const CREAM = hex('#F3ECE2')
const CREAM2 = hex('#EBDCC6')
const BROWN = hex('#6B4F3A')
const GREEN = hex('#8AA07A')

function draw(N) {
  const buf = new Uint8Array(N * N * 4)
  const set = (x, y, [r, g, b], a = 255) => {
    if (x < 0 || y < 0 || x >= N || y >= N) return
    const i = (y * N + x) * 4
    const ia = a / 255
    buf[i] = buf[i] * (1 - ia) + r * ia
    buf[i + 1] = buf[i + 1] * (1 - ia) + g * ia
    buf[i + 2] = buf[i + 2] * (1 - ia) + b * ia
    buf[i + 3] = 255
  }

  // 배경: 은은한 세로 그라데이션 (크림 → 진한 크림)
  for (let y = 0; y < N; y++) {
    const t = y / N
    const c = [
      CREAM[0] * (1 - t) + CREAM2[0] * t,
      CREAM[1] * (1 - t) + CREAM2[1] * t,
      CREAM[2] * (1 - t) + CREAM2[2] * t,
    ]
    for (let x = 0; x < N; x++) set(x, y, c)
  }

  const cx = N / 2
  const cy = N * 0.6

  // 부드러운 그림자
  fillEllipse(set, cx, cy + N * 0.14, N * 0.3, N * 0.05, [0, 0, 0], N, 26)

  // 그릇 윗면(수프 표면) — 넓은 타원
  fillEllipse(set, cx, cy - N * 0.11, N * 0.28, N * 0.07, BROWN, N)
  // 그릇 몸통 — 타원의 아랫 절반
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const dx = (x - cx) / (N * 0.28)
      const dy = (y - (cy - N * 0.11)) / (N * 0.2)
      if (dx * dx + dy * dy <= 1 && y >= cy - N * 0.11) set(x, y, BROWN)
    }
  }
  // 수프 안쪽 크림 하이라이트
  fillEllipse(set, cx, cy - N * 0.11, N * 0.2, N * 0.045, CREAM, N, 235)

  // 새싹 — 줄기 + 잎 두 장
  const stemX = cx
  const stemTop = cy - N * 0.34
  for (let y = stemTop; y < cy - N * 0.13; y++) {
    const w = Math.max(1, N * 0.008)
    for (let x = stemX - w; x <= stemX + w; x++) set(Math.round(x), Math.round(y), GREEN)
  }
  fillEllipseRot(set, stemX - N * 0.06, stemTop + N * 0.02, N * 0.07, N * 0.032, -0.6, GREEN, N)
  fillEllipseRot(set, stemX + N * 0.06, stemTop + N * 0.02, N * 0.07, N * 0.032, 0.6, GREEN, N)

  return buf
}

function fillEllipse(set, cx, cy, rx, ry, color, N, a = 255) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx
      const dy = (y - cy) / ry
      if (dx * dx + dy * dy <= 1) set(x, y, color, a)
    }
  }
}

function fillEllipseRot(set, cx, cy, rx, ry, ang, color, N) {
  const cos = Math.cos(ang)
  const sin = Math.sin(ang)
  const R = Math.max(rx, ry)
  for (let y = Math.floor(cy - R); y <= Math.ceil(cy + R); y++) {
    for (let x = Math.floor(cx - R); x <= Math.ceil(cx + R); x++) {
      const ox = x - cx
      const oy = y - cy
      const px = (ox * cos + oy * sin) / rx
      const py = (-ox * sin + oy * cos) / ry
      if (px * px + py * py <= 1) set(x, y, color)
    }
  }
}

// --- 최소 PNG 인코더 (RGBA, filter 0) ---
function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([t, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}
function encodePNG(N, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(N, 0)
  ihdr.writeUInt32BE(N, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const raw = Buffer.alloc(N * (N * 4 + 1))
  for (let y = 0; y < N; y++) {
    raw[y * (N * 4 + 1)] = 0
    rgba.subarray(y * N * 4, (y + 1) * N * 4).forEach((v, i) => {
      raw[y * (N * 4 + 1) + 1 + i] = v
    })
  }
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

for (const N of [192, 512]) {
  writeFileSync(join(OUT, `icon-${N}.png`), encodePNG(N, Buffer.from(draw(N))))
}
// maskable — 동일 디자인(콘텐츠가 중앙 안전영역에 있음)
writeFileSync(join(OUT, 'icon-maskable-512.png'), encodePNG(512, Buffer.from(draw(512))))
console.log('icons written to', OUT)
