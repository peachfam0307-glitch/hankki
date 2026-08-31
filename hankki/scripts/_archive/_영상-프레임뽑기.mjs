// 🎞 창업자가 보낸 «화면 녹화»에서 프레임을 뽑는다 (2026-08-12 신설)
//
// ⛔⛔ **이 환경엔 `ffmpeg` 도 `cv2` 도 없다**(둘 다 확인함). 그런데 창업자는 화면 녹화를 보낸다
//    — 캡처 한 장으로 안 보이는 것(움직임·누르는 순서·먹통)이 거기 들어 있다.
// ⭐ 그래서 **Chromium 을 디코더로 쓴다** — `<video>` 에 물려 seek 하고 canvas 로 떠낸다.
//
// ⚠️⚠️ **base64 data URL 로 넣지 말 것 — 2분을 넘겨 죽는다.**
//    파일이 수십 MB 면 base64 가 1.3배로 부풀고, 그걸 `setContent` HTML 문자열에 통째로 실으면
//    브라우저가 파싱하다 멈춘다. 2026-08-12 에 실제로 타임아웃 났다.
//    ✅ **작은 http 서버로 «흘려서»** 준다(Range 요청 지원 — 안 그러면 seek 이 안 먹는다).
//
// 쓰는 법
//   node scripts/_영상-프레임뽑기.mjs <영상경로> [장수]
import './_fresh.mjs'
import { chromium } from 'playwright'
import { createReadStream, statSync, mkdirSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { basename } from 'node:path'

const 영상 = process.argv[2]
const 장수 = Number(process.argv[3] || 12)
if (!영상) { console.log('쓰는 법: node scripts/_영상-프레임뽑기.mjs <영상경로> [장수]'); process.exit(1) }

const OUT = `/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/vid-${basename(영상).slice(0, 12)}`
mkdirSync(OUT, { recursive: true })

const 크기 = statSync(영상).size
// ⚠️ **Range 를 꼭 받아야 한다** — 없으면 크롬이 `currentTime` 을 못 옮긴다(seek 이 조용히 무시된다)
const srv = createServer((q, s) => {
  const r = q.headers.range
  if (!r) {
    s.writeHead(200, { 'content-type': 'video/mp4', 'content-length': 크기, 'accept-ranges': 'bytes' })
    return createReadStream(영상).pipe(s)
  }
  const [a, b] = r.replace('bytes=', '').split('-')
  const start = parseInt(a, 10), end = b ? parseInt(b, 10) : 크기 - 1
  s.writeHead(206, {
    'content-type': 'video/mp4', 'accept-ranges': 'bytes',
    'content-range': `bytes ${start}-${end}/${크기}`, 'content-length': end - start + 1,
  })
  createReadStream(영상, { start, end }).pipe(s)
})
await new Promise((r) => srv.listen(4390, r))

const br = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM, args: ['--autoplay-policy=no-user-gesture-required'] })
const pg = await br.newPage({ viewport: { width: 800, height: 1000 } })
await pg.setContent('<body style="margin:0;background:#000"><video id=v src="http://127.0.0.1:4390/v.mp4" muted preload=auto></video></body>')
const info = await pg.evaluate(() => new Promise((r, j) => {
  const v = document.getElementById('v')
  const t = setTimeout(() => j(new Error('영상 메타데이터를 못 읽었다')), 30000)
  const ok = () => { clearTimeout(t); r({ d: v.duration, w: v.videoWidth, h: v.videoHeight }) }
  if (v.readyState >= 1) ok(); else v.onloadedmetadata = ok
}))
console.log(`🎞 ${info.d.toFixed(1)}초 · ${info.w}×${info.h} → ${장수}장`)

for (let i = 0; i < 장수; i += 1) {
  const t = (info.d * (i + 0.5)) / 장수
  await pg.evaluate((t) => new Promise((r) => {
    const v = document.getElementById('v')
    v.onseeked = () => r()
    v.currentTime = t
  }), t)
  await pg.waitForTimeout(120)
  const data = await pg.evaluate(() => {
    const v = document.getElementById('v')
    const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d').drawImage(v, 0, 0)
    return c.toDataURL('image/jpeg', 0.85)
  })
  writeFileSync(`${OUT}/v${String(i).padStart(2, '0')}.jpg`, Buffer.from(data.split(',')[1], 'base64'))
}
console.log(`🖼 ${OUT}`)
await br.close(); srv.close(); process.exit(0)
