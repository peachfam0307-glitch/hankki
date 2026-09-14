// 🎥 「폰 안에서 영상 프레임을 뽑을 수 있나」를 «실제로» 잰다 (2026-08-19)
//
// 📮 창업자 = *"우리는 인스타내용뽑아 정리못해줘?"* ＋ 알보(Albo) 소개 릴스 화면녹화본
//
// ⭐ 물음 셋 중 «둘»만 여기서 잰다 —
//    ① 서버 없이 «폰 안에서» 영상을 열고 프레임을 뽑을 수 있나?        → ✅ **된다**
//    ② 그중 «레시피 글자가 있는» 프레임을 자동으로 골라낼 수 있나?      → ⛔ **이 방법으론 안 된다**
//    ③ 그 프레임에서 글자를 읽는 것                                    → 안 잰다(우리 OCR 이 이미 한다)
//
// 🔢 2026-08-19 실측 (창업자 릴스 녹화본 · 540×1170 · 17.35초 · 3.1MB)
//    · 영상 여는 데 **46ms** · 프레임 **35/35장** · 전체 **3,831ms** · 한 장 평균 **108ms** · pageerror **0**
//    · ⛔ 글자스러움 벌어짐이 **1.5배**뿐이고, 정작 «레시피 목록 화면(15초)»이 **제일 낮게(9.19%)** 나왔다.
//      📌 흰 바탕에 얇은 검은 글자라 가장자리가 적다. 이 가늠자는 «글자»가 아니라 **«복잡한 화면»**을 고른다.
//      → 자동 고르기는 접고, **유저가 화면을 톡 고르는 쪽**이 맞다(＋우리 앱 철학과도 맞는다).
//
// ⛔⛔ 이 컨테이너에서 «세 번» 막혔다 — 전부 «환경» 문제지 «앱» 문제가 아니다. 다음 사람이 또 밟지 말라고 적는다:
//   ⑴ **H.264(MP4)를 못 읽는다** — Playwright 크로미움은 오픈소스 빌드라 독점 코덱이 빠졌다.
//      실측 = `canPlayType('video/mp4; codecs="avc1.42E01E"')` → **""**  ／  vp8·vp9 → **"probably"**
//      📌 **폰의 크롬은 하드웨어 디코더로 H.264 를 읽는다.** 그래서 잴 땐 WebM 으로 바꾼다:
//         ffmpeg -i <mp4> -vf scale=540:-2 -c:v libvpx -b:v 900k -an <webm>
//   ⑵ **로컬 http 서버로 흘리면 안 열린다** — 프록시가 127.0.0.1 까지 가로챈다.
//      ⭐ 그런데 이 실패는 오히려 잘된 것이다 — **앱은 애초에 서버를 안 거친다.**
//   ⑶ **`page.setInputFiles()` 가 파일을 안 물린다** — `files.length` 가 **0**
//      (accept 유무·파일 크기와 무관하게 4/4 실패). 그래서 페이지 «안»에서 `new File()` 로 만든다.
//      ⭐ 이게 앱 실제 흐름과 같다 — `<input type=file>` 이 준 File 을 `URL.createObjectURL()` 로 바로 쓴다.
//
// 쓰기:  SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_재본다-영상프레임-0819.mjs <영상> [낼json]
// ⛔ chromium 경로를 코드에 박지 않는다 — 이 컨테이너에만 있는 길이라 CI 가 죽는다(v10.90 사고).
import { chromium } from 'playwright'
import { readFileSync, writeFileSync, statSync } from 'node:fs'
import { extname, basename } from 'node:path'

const 영상 = process.argv[2]
const 낼곳 = process.argv[3]
if (!영상) {
  console.error('쓰기: node scripts/_재본다-영상프레임-0819.mjs <영상파일> [낼json]')
  console.error('⚠️  MP4 면 먼저 WebM 으로 — 이 컨테이너 크로미움은 H.264 를 못 읽는다(폰은 읽는다)')
  process.exit(1)
}
const MIME = { '.webm': 'video/webm', '.mp4': 'video/mp4', '.mov': 'video/quicktime' }
const mime = MIME[extname(영상).toLowerCase()] || 'video/mp4'
const 바이트 = statSync(영상).size
const b64 = readFileSync(영상).toString('base64')

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const p = await b.newPage()
const 오류 = []
p.on('pageerror', (e) => 오류.push(String(e)))
await p.goto('about:blank')

// ── 0. 이 브라우저가 무슨 형식을 읽나 (먼저 찍어 둔다 — 안 되면 여기서 이유가 드러난다)
const 코덱 = await p.evaluate(() => {
  const v = document.createElement('video')
  const 물음 = {
    'MP4 (H.264) — 폰 녹화·인스타 릴스': 'video/mp4; codecs="avc1.42E01E"',
    'MP4 (H.265/HEVC) — 요즘 아이폰': 'video/mp4; codecs="hvc1"',
    'WebM (VP8)': 'video/webm; codecs="vp8"',
    'WebM (VP9)': 'video/webm; codecs="vp9"',
  }
  return Object.fromEntries(Object.entries(물음).map(([k, t]) => [k, v.canPlayType(t) || '(못 함)']))
})

let 잰값
try {
  잰값 = await p.evaluate(async ({ b64, mime, 이름, 간격 }) => {
    const 시작 = performance.now()
    const bin = atob(b64)
    const arr = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)

    // ⭐ 이 두 줄이 앱에서 할 전부다 — 서버도 업로드도 없다.
    //    유저가 갤러리에서 고른 File 이 그대로 여기 들어온다.
    const file = new File([arr], 이름, { type: mime })
    const url = URL.createObjectURL(file)
    const v = document.createElement('video')
    v.src = url
    v.muted = true
    v.preload = 'auto'

    try {
      await new Promise((res, rej) => {
        v.onloadedmetadata = res
        v.onerror = () => rej(new Error(`못 연다 — code ${v.error?.code} ${v.error?.message || ''}`))
        setTimeout(() => rej(new Error('여는 데 시간초과(20초)')), 20000)
      })
    } catch (e) {
      return { 못연다: e.message }
    }
    const 연시각 = Math.round(performance.now() - 시작)

    // 뽑은 프레임은 긴변 480px 로 줄여 잰다 — OCR 에도 이 정도면 충분하고 폰이 안 힘들다
    const cv = document.createElement('canvas')
    const ctx = cv.getContext('2d', { willReadFrequently: true })
    const 배 = 480 / Math.max(v.videoWidth, v.videoHeight)
    cv.width = Math.round(v.videoWidth * 배)
    cv.height = Math.round(v.videoHeight * 배)

    // 「글자스러움」 = 옆 픽셀과 밝기가 확 다른 자리의 비율(가장자리 밀도).
    // ⛔ 2026-08-19 결론 = **이 가늠자는 못 쓴다.** 위 머리주석 ② 참조.
    //    그래도 남겨 둔다 — 다음에 다른 가늠자를 만들 때 «이건 아니었다»는 기준선이 된다.
    const 재기 = () => {
      ctx.drawImage(v, 0, 0, cv.width, cv.height)
      const d = ctx.getImageData(0, 0, cv.width, cv.height).data
      const W = cv.width
      let 모서리 = 0
      let 칸 = 0
      for (let y = 1; y < cv.height - 1; y += 2) {
        for (let x = 1; x < W - 1; x += 2) {
          const i = (y * W + x) * 4
          const g = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000
          const gx = (d[i + 4] * 299 + d[i + 5] * 587 + d[i + 6] * 114) / 1000
          const gy = (d[i + W * 4] * 299 + d[i + W * 4 + 1] * 587 + d[i + W * 4 + 2] * 114) / 1000
          if (Math.abs(g - gx) > 40 || Math.abs(g - gy) > 40) 모서리++
          칸++
        }
      }
      return +((모서리 / 칸) * 100).toFixed(2)
    }

    const 프레임들 = []
    for (let t = 0; t < v.duration; t += 간격) {
      const 잰때 = performance.now()
      const ok = await new Promise((res) => {
        v.onseeked = () => { v.onseeked = null; res(true) }
        v.currentTime = t
        setTimeout(() => res(false), 4000)
      })
      if (!ok) { 프레임들.push({ t: +t.toFixed(1), 실패: 'seek 시간초과' }); continue }
      프레임들.push({ t: +t.toFixed(1), 글자스러움: 재기(), ms: Math.round(performance.now() - 잰때) })
    }

    URL.revokeObjectURL(url)
    return {
      길이: v.duration, 폭: v.videoWidth, 높이: v.videoHeight,
      잰크기: [cv.width, cv.height], 연시각, 프레임들,
      걸린ms: Math.round(performance.now() - 시작),
    }
  }, { b64, mime, 이름: basename(영상), 간격: 0.5 })
} finally {
  await b.close()
}

console.log('\n🎞  이 브라우저가 읽는 영상 형식')
for (const [k, v] of Object.entries(코덱)) console.log(`   ${v === '(못 함)' ? '⛔' : '✅'} ${k} → ${v}`)

if (잰값.못연다) {
  console.log(`\n⛔ ${잰값.못연다}`)
  console.log('   📌 위 표에 ⛔ 가 있으면 «환경» 문제다 — 폰의 크롬은 H.264 를 읽는다.')
  console.log('   👉 ffmpeg -i <mp4> -vf scale=540:-2 -c:v libvpx -b:v 900k -an <webm>')
  process.exit(1)
}

const 성한것 = 잰값.프레임들.filter((f) => f.글자스러움 != null)
const 평균ms = Math.round(성한것.reduce((s, f) => s + f.ms, 0) / Math.max(1, 성한것.length))
console.log(`\n🎥 영상 = ${잰값.폭}×${잰값.높이} · ${잰값.길이.toFixed(2)}초 · ${(바이트 / 1048576).toFixed(1)}MB`)
console.log(`✅ 영상 여는 데 ${잰값.연시각}ms`)
console.log(`✅ 프레임 = ${성한것.length}/${잰값.프레임들.length}장 · 전체 ${잰값.걸린ms}ms · 한 장 평균 ${평균ms}ms`)
console.log(`⛔ pageerror = ${오류.length}건`)

const 정렬 = [...성한것].sort((a, b) => b.글자스러움 - a.글자스러움)
console.log('\n📊 글자스러움 «높은» 순')
정렬.slice(0, 6).forEach((f, i) => console.log(`   ${i + 1}. ${String(f.t).padStart(5)}초 — ${f.글자스러움}%`))
console.log('📊 «낮은» 순')
정렬.slice(-3).forEach((f) => console.log(`      ${String(f.t).padStart(5)}초 — ${f.글자스러움}%`))
if (정렬.length) {
  const 배수 = 정렬[0].글자스러움 / Math.max(0.01, 정렬.at(-1).글자스러움)
  console.log(`\n📏 벌어짐 ${정렬.at(-1).글자스러움}% ~ ${정렬[0].글자스러움}% = ${배수.toFixed(1)}배`)
  console.log(배수 < 2
    ? '   ⛔ 2배도 안 벌어진다 — 이 가늠자로는 「어느 프레임을 읽을지」를 못 고른다(2026-08-19 결론)'
    : '   ⭐ 벌어질수록 OCR 없이도 읽을 프레임을 고를 수 있다는 뜻')
}

if (낼곳) {
  writeFileSync(낼곳, JSON.stringify({ 영상, 바이트, 코덱, ...잰값, 오류 }, null, 2))
  console.log(`\n💾 ${낼곳}`)
}
