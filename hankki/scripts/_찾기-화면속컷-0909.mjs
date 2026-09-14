// 🔎 「창업자 화면에 보이는 컷이 어느 파일인가」를 그림으로 대조해 찾는다 (2026-09-09 신설)
//
// 📮 왜 = 창업자가 앱 「아이콘 바꾸기」로 컷을 골라 주는데, 화면엔 id 가 안 뜬다.
//    그러면 내가 코드(basics.js)의 icon 을 못 바꾼다 → 다른 유저에겐 옛 컷이 그대로 나간다.
// ⛔ 넘겨짚지 않는다 — 픽셀로 잰다. 브라우저 캔버스로 16x16 로 줄여 색 거리로 겨룬다.
//    (이 환경엔 PIL·sharp 가 없다. ffmpeg 는 코덱이 꺼져 있다.)
//
// 쓰는 법  node scripts/_찾기-화면속컷-0909.mjs <화면캡처> <잘라낼칸 x,y,w,h> [몇등까지=8]
import { readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
const APP = resolve(new URL('..', import.meta.url).pathname)
const [캡처, 칸, 등수 = '8'] = process.argv.slice(2)
const [cx, cy, cw, ch] = 칸.split(',').map(Number)
const 폴더 = join(APP, 'src/assets/stickers/photo')
const 파일 = readdirSync(폴더).filter((f) => f.endsWith('.png'))
// ⛔ 이 깃발이 없으면 file:// 그림이 캔버스를 «오염»시켜 getImageData 가 막힌다(SecurityError).
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files'] })
const page = await b.newPage()
await page.goto('file://' + APP)          // file:// 뿌리여야 아래 그림들을 읽을 수 있다
const 결과 = await page.evaluate(async ({ 캡처, cx, cy, cw, ch, 폴더, 파일 }) => {
  const N = 16
  const 특징 = async (src, crop) => {
    const img = new Image(); img.src = src
    try { await img.decode() } catch { return null }
    const c = document.createElement('canvas'); c.width = N; c.height = N
    const g = c.getContext('2d', { willReadFrequently: true })
    g.fillStyle = '#fff'; g.fillRect(0, 0, N, N)          // ⭐ 투명 png 를 «흰 접시»로 깔아야 캡처와 견줄 수 있다
    if (crop) g.drawImage(img, crop[0], crop[1], crop[2], crop[3], 0, 0, N, N)
    else g.drawImage(img, 0, 0, N, N)
    return [...g.getImageData(0, 0, N, N).data]
  }
  const 답 = await 특징('file://' + 캡처, [cx, cy, cw, ch])
  if (!답) return { 오류: '캡처를 못 열었다' }
  const 점수 = []
  for (const f of 파일) {
    const v = await 특징('file://' + 폴더 + '/' + f, null)
    if (!v) continue
    let d = 0
    for (let i = 0; i < v.length; i += 4) d += (v[i] - 답[i]) ** 2 + (v[i + 1] - 답[i + 1]) ** 2 + (v[i + 2] - 답[i + 2]) ** 2
    점수.push([f.replace('.png', ''), Math.round(Math.sqrt(d / (N * N)))])
  }
  점수.sort((a, b) => a[1] - b[1])
  return { 점수 }
}, { 캡처, cx, cy, cw, ch, 폴더, 파일 })
await b.close()
if (결과.오류) { console.error('⛔', 결과.오류); process.exit(1) }
console.log(결과.점수.slice(0, Number(등수)).map(([id, d], i) => `${i + 1}. ${id}  거리 ${d}`).join('\n'))
