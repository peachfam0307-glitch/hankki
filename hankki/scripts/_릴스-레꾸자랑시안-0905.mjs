// 🎬 레꾸자랑 릴스 «시안» 둘 (2026-09-05) — 0901 목업 영상을 잘라 16초로
//
// 📮 창업자 = "영상 시안도 내가 말한대로 1개, 네가 다른방향으로 1개 제작해줘. 16초정도로.."
//    A = 창업자 안: 카톡(결과)부터 → 2초 훅 자막 → 앱 흐름 자막 5줄 → 「오늘도 한끼하세요」 (리와인드 없음)
//    B = 내 안: «카드»부터 — 랜덤카드가 팡팡 바뀌는 2초 훅 → 뽑기 → 카톡 도착 → 한 줄 정리
//
// ⛔ 재료 = design/promo/인스타-2509/레꾸자랑-목업-원본-0901.mp4 (돌솥비빔밥 · 25.5초 · 무음)
//    미역국 카톡을 새로 찍으면 같은 자막·같은 초로 갈아끼운다 — 이 파일의 «구간 표»만 바꾸면 된다.
// ⛔ ffmpeg = 저장소 것(playwright 빌드)은 mp4 를 못 연다 → FF 환경변수로 ffmpeg-static 경로를 준다.
//    그 빌드엔 drawtext 가 없다 → 자막은 여기서 Playwright 로 «투명 PNG»를 만들어 overlay 한다.
//    글꼴 = design/promo/fonts-embed.css (Jua · 나눔펜 · 고운돋움 · 개구) — 앱·스토어 스샷과 같은 글꼴.
//
// 쓰는 법:  FF=<ffmpeg> node hankki/scripts/_릴스-레꾸자랑시안-0905.mjs [A|B|둘]
// 결과   :  design/promo/인스타-2509/시안-레꾸자랑-A.mp4 · 시안-레꾸자랑-B.mp4 (1080×1920 · 30fps · 16.0초)
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const APP = resolve(new URL('..', import.meta.url).pathname)
const OUT = join(APP, 'design/promo/인스타-2509')
const SRC = join(OUT, '레꾸자랑-목업-원본-0901.mp4')
const ICON = join(APP, 'public/icons/icon-512-v7.png')
const FF = process.env.FF
if (!FF || !existsSync(FF)) { console.error('⛔ FF=<ffmpeg-static 경로> 가 필요하다 (저장소 ffmpeg 는 mp4 를 못 연다)'); process.exit(1) }
const CHROMIUM = process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium'
const TMP = join(process.env.SCRATCH || '/tmp', '릴스시안-0905'); mkdirSync(TMP, { recursive: true })
const W = 1080, H = 1920, FPS = 30

// ── 자막 PNG ─────────────────────────────────────────────────────────
// 투명 배경 · 가운데 정렬 · 크림 알약 위에 진갈색 글자(앱 표장 색 #5d3410) · 큰 훅은 글자만 크게
const CSS = readFileSync(join(APP, 'design/promo/fonts-embed.css'), 'utf8')
const 자막HTML = ({ text, size = 64, kind = 'pill' }) => `<!doctype html><meta charset="utf-8"><style>${CSS}
html,body{margin:0;background:transparent}
.wrap{width:${W}px;padding:0 60px;box-sizing:border-box;display:flex;justify-content:center}
.pill{display:inline-block;background:rgba(251,245,232,.94);color:#5d3410;font-family:'Jua',sans-serif;font-size:${size}px;line-height:1.25;
  padding:22px 44px;border-radius:44px;text-align:center;word-break:keep-all;box-shadow:0 8px 24px rgba(60,35,10,.18);border:3px solid rgba(93,52,16,.15)}
.hook{display:inline-block;color:#fff;font-family:'Jua',sans-serif;font-size:${size}px;line-height:1.2;text-align:center;word-break:keep-all;
  -webkit-text-stroke:2px #5d3410;paint-order:stroke fill;text-shadow:0 6px 18px rgba(0,0,0,.35)}
.pen{display:inline-block;color:#5d3410;font-family:'Nanum Pen Script','NanumPen',cursive;font-size:${size}px;line-height:1.2;text-align:center;word-break:keep-all}
</style><body><div class="wrap"><div class="${kind}">${text}</div></div>`

async function 자막들(목록) {
  const b = await chromium.launch({ executablePath: CHROMIUM })
  const p = await b.newPage({ viewport: { width: W, height: 400 }, deviceScaleFactor: 1 })
  const out = {}
  for (const [key, spec] of Object.entries(목록)) {
    await p.setContent(자막HTML(spec), { waitUntil: 'load' })
    await p.evaluate(() => document.fonts.ready)
    const el = await p.$('.wrap')
    const file = join(TMP, key + '.png')
    await el.screenshot({ path: file, omitBackground: true })
    out[key] = file
  }
  await b.close(); return out
}

// ── 장면 표 ──────────────────────────────────────────────────────────
// src=[시작,끝] 원본 초 · dur=시안에서 차지하는 초 (src 길이와 다르면 배속) · zoom=채팅 확대(1.3) · cap=자막 key · capY=자막 y
const 확대 = (z) => z ? `crop=${Math.round(W / z)}:${Math.round(H / z)}:${Math.round((W - W / z) / 2)}:${Math.round((H - H / z) * 0.42)},scale=${W}:${H},setsar=1` : `scale=${W}:${H},setsar=1`

const 판A = {
  자막: {
    hook: { text: '친구가 「레시피 좀!」 하면…<br>이렇게 보냄', size: 84, kind: 'hook' },
    s1: { text: '어떻게 보냈냐면 —<br>레꾸자랑 탭에서 레시피 고르고', size: 54 },
    s2: { text: '둘 중에 선택!', size: 64 },
    s3: { text: '오늘은? 랜덤카드!<br>눌러눌러 골라골라', size: 56 },
    s4: { text: '친구한테 보내기 · 참 쉽죠?', size: 56 },
    s5: { text: '레시피는 한 장 더 따라가요', size: 52 },
    end: { text: '오늘도 한끼하세요', size: 128, kind: 'pen' },
    store: { text: 'Play스토어에서 「한끼」 검색', size: 48 },
  },
  장면: [
    // ⛔ 자막은 «전부 위쪽»(y 200~250) — 아래쪽은 말풍선·「다시 뽑기」 단추가 사는 자리라 가린다(첫 판에서 눈으로 잡았다)
    // ⛔ 채팅 컷은 24.2 를 넘기지 않는다 — 24.25 부터 탭 화면으로 돌아가 한 프레임이 섞였다
    // ⛔ 뽑기 구간은 7.8~13.8 — 그 앞(4.5~7.8)은 «옛 펭펭» 카드가 뜬다(9/5 에 내린 컷)
    { src: [16.4, 18.4], dur: 2.0, zoom: 1.3, cap: 'hook', capY: 250 },
    { src: [18.4, 20.4], dur: 2.0, zoom: 1.3, cap: 'hook', capY: 250 },
    { src: [0.8, 2.6], dur: 1.8, cap: 's1', capY: 200, flash: true },
    { src: [3.5, 4.7], dur: 1.2, cap: 's2', capY: 200 },
    { src: [11.0, 14.0], dur: 3.0, cap: 's3', capY: 200 },   // 9.6~10.1 에 옛 펭펭이 스쳐 11.0 부터
    { src: [15.0, 16.2], dur: 1.2, cap: 's4', capY: 200 },
    { src: [21.8, 24.2], dur: 2.4, zoom: 1.3, cap: 's5', capY: 250 },
    { end: true, dur: 2.4, cap: 'end' },
  ],
}
const 판B = {
  자막: {
    hook: { text: '레시피를 «카드»로<br>보내는 앱이 있다?', size: 84, kind: 'hook' },
    b1: { text: '다시 뽑기 누를수록 다른 카드', size: 56 },
    b2: { text: '카톡으로 보내면', size: 60 },
    b3: { text: '카드 먼저, 레시피는 한 장 더', size: 56 },
    b4: { text: '「한끼에서 보내면 같이 가」', size: 56 },
    b5: { text: '레꾸자랑 탭 · 지금 있는 레시피면 바로', size: 50 },
    end: { text: '오늘도 한끼하세요', size: 128, kind: 'pen' },
    store: { text: 'Play스토어에서 「한끼」 검색', size: 48 },
  },
  장면: [
    // 훅 = 카드 넷이 0.5초씩 «팡팡» — 각각 다른 카드가 뜬 순간(실측 프레임)
    // ⛔ 0901 영상의 랜덤 풀엔 «옛 펭펭» 카드가 섞여 있다(9/5 에 내린 컷) → 훅은 꼬르곰 카드가 뜬 순간만 쓴다
    { src: [8.0, 8.5], dur: 0.5, zoom: 1.15, cap: 'hook', capY: 250 },
    { src: [11.4, 11.9], dur: 0.5, zoom: 1.15, cap: 'hook', capY: 250 },
    { src: [12.6, 13.1], dur: 0.5, zoom: 1.15, cap: 'hook', capY: 250 },
    { src: [13.4, 13.9], dur: 0.5, zoom: 1.15, cap: 'hook', capY: 250 },
    { src: [11.0, 14.4], dur: 3.0, cap: 'b1', capY: 200 },
    { src: [15.0, 16.2], dur: 1.2, cap: 'b2', capY: 200 },
    { src: [16.4, 20.4], dur: 4.0, zoom: 1.3, cap: 'b3', capY: 250 },
    { src: [21.2, 24.2], dur: 3.0, zoom: 1.3, cap: 'b4', capY: 250 },
    { src: [0.0, 1.0], dur: 1.0, cap: 'b5', capY: 200 },
    { end: true, dur: 1.8, cap: 'end' },
  ],
}

async function 만들기(이름, 판) {
  const png = await 자막들(판.자막)
  const inputs = ['-i', SRC, '-loop', '1', '-i', ICON]
  const fc = []; const labels = []
  let idx = 2
  for (const k of Object.keys(png)) { inputs.push('-loop', '1', '-i', png[k]); png[k] = idx++ }
  판.장면.forEach((s, i) => {
    let v
    if (s.end) {
      // 끝 카드 = 크림 바탕 ＋ 앱 아이콘 ＋ 손글씨
      fc.push(`color=c=0xfbf5e8:s=${W}x${H}:d=${s.dur}:r=${FPS},format=yuv420p,setsar=1[bg${i}]`)
      fc.push(`[1:v]scale=440:440[ic${i}]`)
      fc.push(`[bg${i}][ic${i}]overlay=(W-w)/2:560[e${i}]`)
      fc.push(`[e${i}][${png[s.cap]}:v]overlay=(W-w)/2:1080:shortest=1[g${i}]`)
      fc.push(`[g${i}][${png.store}:v]overlay=(W-w)/2:1300:shortest=1,trim=duration=${s.dur},setpts=PTS-STARTPTS[v${i}]`)
    } else {
      const len = s.src[1] - s.src[0]
      const speed = len / s.dur
      fc.push(`[0:v]trim=${s.src[0]}:${s.src[1]},setpts=(PTS-STARTPTS)/${speed.toFixed(4)},${확대(s.zoom)},fps=${FPS}${s.flash ? ',fade=t=in:st=0:d=0.25:color=white' : ''}[c${i}]`)
      v = `c${i}`
      if (s.cap) { fc.push(`[${v}][${png[s.cap]}:v]overlay=(W-w)/2:${s.capY}:shortest=1[d${i}]`); v = `d${i}` }
      if (s.cap2) { fc.push(`[${v}][${png[s.cap2]}:v]overlay=(W-w)/2:${s.cap2Y}:shortest=1[f${i}]`); v = `f${i}` }
      fc.push(`[${v}]trim=duration=${s.dur},setpts=PTS-STARTPTS[v${i}]`)
    }
    labels.push(`[v${i}]`)
  })
  fc.push(`${labels.join('')}concat=n=${labels.length}:v=1:a=0,format=yuv420p[out]`)
  const out = join(OUT, `시안-레꾸자랑-${이름}.mp4`)
  execFileSync(FF, ['-y', '-hide_banner', '-loglevel', 'error', ...inputs, '-filter_complex', fc.join(';'), '-map', '[out]', '-r', String(FPS), '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: 'inherit' })
  const 총 = 판.장면.reduce((a, s) => a + s.dur, 0)
  console.log(`✅ ${out}  (설계 ${총.toFixed(1)}초)`)
  return out
}

const which = process.argv[2] || '둘'
if (which === 'A' || which === '둘') await 만들기('A', 판A)
if (which === 'B' || which === '둘') await 만들기('B', 판B)
