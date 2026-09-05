// 🎬 레꾸자랑 릴스 «시안 A» — 미역국 녹화로 (2026-09-05 · 2판)
//
// 📮 창업자 14:40 = "일단 자막은 다 빼줘. 훅이 너무 빨리 지나가서 뭔지 모르겠어. 훅은 3초로.
//    카톡목업은 한번에 뜨게하지말고 대화-이미지-대화 이런식으로 띄워줘. a로 할게.
//    목업도 좀 더 눈에 확 들어오게(배경이라던지) 만들어줘." ＋ "예쁜 카드 잘라서 만들어줘. 겹치는 건 빼고"
//
// 흐름(16초 · 자막 0)
//   0.0~3.0  카톡 목업(우리가 그린다) — 「오늘 뭐 해먹었어?」 → 「소고기 미역국!」 → 카드 «툭» = 훅 3초
//   3.0~4.8  「헐 이거 맛있겠다 레시피 좀!」 → 레시피 장 «툭»
//   4.8~6.2  앱 = 레꾸자랑 탭 → 「내가 꾸민 표지 / 랜덤 카드」 (녹화 0.0~1.4)
//   6.2~12.5 랜덤카드 7장 (겹치는 것·옛 펭펭 뺀 것 · 0.9초씩 · 녹화 구간 그대로)
//   12.5~13.3 레시피 장 (녹화 26.6~27.4)
//   13.3~15.0 카톡 — 「오 레시피까지 같이 오네?」 → 「한끼에서 보내면 같이 가」
//   15.0~16.0 끝 카드 (아이콘 ＋ 「오늘도 한끼하세요」 손글씨 — 자막이 아니라 마무리 서명)
//
// 재료 = design/promo/인스타-2509/미역국-앱녹화-원본-2026-09-05.mp4 (1076×2156 · 30.7초 · 무음)
//        design/promo/인스타-2509/카드-미역국/card_01~07.png · recipe.png (녹화에서 잘라 둔 카드)
// ⛔ ffmpeg = FF 환경변수로 ffmpeg-static (저장소 ffmpeg 는 mp4 못 연다 · drawtext 도 없다 → 글자는 Playwright PNG)
//
// 쓰는 법:  FF=<ffmpeg> SCRATCH=<임시폴더> node hankki/scripts/_릴스-레꾸자랑시안-0905.mjs
// 결과   :  design/promo/인스타-2509/시안-레꾸자랑-A.mp4 (1080×1920 · 30fps · 16.0초)
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const APP = resolve(new URL('..', import.meta.url).pathname)
const OUT = join(APP, 'design/promo/인스타-2509')
const SRC = join(OUT, '미역국-앱녹화-원본-2026-09-05.mp4')
const CARDS = join(OUT, '카드-미역국')
const ICON = join(APP, 'public/icons/icon-512-v7.png')
const AVATAR = join(APP, 'src/assets/sharepool/pjs_01.png')   // 정본 펭펭(벨트 트렌치)
const FF = process.env.FF
if (!FF || !existsSync(FF)) { console.error('⛔ FF=<ffmpeg-static 경로> 가 필요하다'); process.exit(1) }
const CHROMIUM = process.env.SMOKE_CHROMIUM || '/opt/pw-browsers/chromium'
const TMP = join(process.env.SCRATCH || '/tmp', '릴스시안-0905'); mkdirSync(TMP, { recursive: true })
const W = 1080, H = 1920, FPS = 30
const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`

// ── 카톡 목업 (우리 톤) ──────────────────────────────────────────────
// 배경 = 크림(#fbf5e8)에 은은한 점무늬 ＋ 아래로 갈수록 살구빛 · 머리엔 정본 펭펭 아바타 · 말풍선 큼(46px)
// 내 말 = 표장색(#5d3410) 갈색 알약 · 상대 말 = 흰 알약 갈색 테두리 · 그림은 둥근 모서리 ＋ 그림자 ＋ 살짝 기울임
const CSS = readFileSync(join(APP, 'design/promo/fonts-embed.css'), 'utf8')
const 대화 = [
  { who: 'them', text: '오늘 뭐 해먹었어?' },
  { who: 'me', text: '소고기 미역국!' },
  { who: 'me', img: join(CARDS, 'card_05.png'), tilt: -2 },       // 폴라로이드 가을 곰펭 = 새 씬
  { who: 'them', text: '헐 이거 맛있겠다 레시피 좀!' },
  { who: 'me', img: join(CARDS, 'recipe.png'), tilt: 1.5 },
  { who: 'them', text: '오 레시피까지 같이 오네?' },
  { who: 'me', text: '한끼에서 보내면 같이 가' },
]
const 채팅HTML = (n) => `<!doctype html><meta charset="utf-8"><style>${CSS}
html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden}
body{font-family:'Jua',sans-serif;color:#5d3410;
  background:
    radial-gradient(circle at 1px 1px, rgba(93,52,16,.10) 1.5px, transparent 2px) 0 0/28px 28px,
    linear-gradient(180deg,#fbf5e8 0%,#f7e9d6 60%,#f3dcc4 100%)}
.top{height:150px;display:flex;align-items:center;gap:22px;padding:0 44px;box-sizing:border-box;
  background:rgba(255,255,255,.72);border-bottom:3px solid rgba(93,52,16,.12);backdrop-filter:blur(4px)}
.top .back{font-size:54px;opacity:.6}
.top img{width:96px;height:96px;border-radius:50%;object-fit:cover;background:#fff;border:3px solid rgba(93,52,16,.18)}
.top .name{font-size:46px}
.top .sub{font-size:28px;opacity:.55;margin-left:auto;font-family:'Gowun Dodum',sans-serif}
.list{position:absolute;left:0;right:0;bottom:170px;display:flex;flex-direction:column;gap:26px;padding:0 44px}
.row{display:flex;align-items:flex-end;gap:16px}
.row.me{justify-content:flex-end}
.bub{max-width:760px;font-size:46px;line-height:1.3;padding:24px 34px;border-radius:34px;word-break:keep-all;
  box-shadow:0 6px 18px rgba(93,52,16,.10)}
.them .bub{background:#fff;border:3px solid rgba(93,52,16,.22);border-bottom-left-radius:10px}
.me .bub{background:#5d3410;color:#fff;border-bottom-right-radius:10px}
.pic{width:700px;border-radius:30px;box-shadow:0 18px 40px rgba(60,35,10,.28);border:6px solid #fff;display:block}
.tm{font-size:24px;opacity:.5;font-family:'Gowun Dodum',sans-serif;margin:0 6px 8px}
.pop{animation:pop .28s cubic-bezier(.2,1.4,.4,1) both}
@keyframes pop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}
.input{position:absolute;left:44px;right:44px;bottom:48px;height:92px;border-radius:46px;background:#fff;
  border:3px solid rgba(93,52,16,.16);display:flex;align-items:center;padding:0 34px;font-size:30px;opacity:.55;font-family:'Gowun Dodum',sans-serif}
</style><body>
<div class="top"><span class="back">‹</span><img src="${b64(AVATAR)}"><span class="name">펭펭</span><span class="sub">오늘 저녁</span></div>
<div class="list">
${대화.slice(0, n).map((m, i) => `<div class="row ${m.who}">${m.who === 'me' ? '<span class="tm">오후 6:1' + (i + 2) + '</span>' : ''}
  ${m.img ? `<img class="pic ${i === n - 1 ? 'pop' : ''}" style="transform:rotate(${m.tilt}deg)" src="${b64(m.img)}">` : `<div class="bub ${i === n - 1 ? 'pop' : ''}">${m.text}</div>`}
  ${m.who === 'them' ? '<span class="tm">오후 6:1' + (i + 2) + '</span>' : ''}</div>`).join('\n')}
</div>
<div class="input">메시지 입력</div>
</body>`

async function 채팅장면들() {
  const b = await chromium.launch({ executablePath: CHROMIUM })
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
  const files = []
  for (let n = 1; n <= 대화.length; n++) {
    await p.setContent(채팅HTML(n), { waitUntil: 'load' })
    await p.evaluate(() => document.fonts.ready)
    await p.waitForTimeout(400)   // pop 애니메이션 끝난 뒤(정지 컷)
    const f = join(TMP, `chat_${n}.png`); await p.screenshot({ path: f }); files.push(f)
  }
  // 끝 카드
  await p.setContent(`<!doctype html><meta charset="utf-8"><style>${CSS}
    html,body{margin:0;width:${W}px;height:${H}px;background:#fbf5e8;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:70px;font-family:'NanumPen',cursive;color:#5d3410}
    img{width:440px;height:440px;border-radius:96px;box-shadow:0 18px 44px rgba(60,35,10,.22)} .t{font-size:150px;white-space:nowrap;margin-top:-10px} .cta{font-family:'GowunDodum',sans-serif;font-size:40px;opacity:.6;margin-top:-30px;letter-spacing:.02em}</style>
    <body><img src="${b64(ICON)}"><div class="t">오늘도 한끼하세요</div><div class="cta">Play 스토어에서 「한끼」 검색</div></body>`, { waitUntil: 'load' })
  await p.evaluate(() => document.fonts.ready)
  const end = join(TMP, 'end.png'); await p.screenshot({ path: end })
  await b.close(); return { files, end }
}

// ── 장면 표 ──────────────────────────────────────────────────────────
// 녹화(1076×2156)는 세로가 길어 위 150px 을 잘라 1080×1920 에 맞춘다(카드가 가운데 오도록)
const 앱 = 'crop=1076:1912:0:150,scale=1080:1920,setsar=1'
const 카드순간 = [4.4, 7.4, 8.8, 14.8, 24.6]   // 5장 — 카톡에 보낸 카드(12.2 폴라로이드)와 밋밋한 회색 포스터(2.6)는 뺐다
const 장면 = [
  { chat: 1, dur: 0.9 }, { chat: 2, dur: 0.9 }, { chat: 3, dur: 1.2 },      // 훅 3.0초
  { chat: 4, dur: 0.9 }, { chat: 5, dur: 0.9 },
  { src: [0.0, 1.4], dur: 1.4 },
  ...카드순간.map((t) => ({ src: [t, t + 1.5], dur: 1.5 })),   // 📮 창업자 "카드넘긴 1.5초로 가자" (2026-09-05 15:03) → 1.5초 × 5장
  { src: [26.6, 27.4], dur: 0.8 },
  { chat: 6, dur: 0.8 }, { chat: 7, dur: 0.9 },
  { end: true, dur: 1.0 },
]

const { files, end } = await 채팅장면들()
const inputs = ['-i', SRC]
let nIn = 0   // 입력 0 = 녹화 · 그 뒤 정지 그림들 (⛔inputs.length 로 세면 인자 수에 따라 틀린다)
const still = (f) => { inputs.push('-loop', '1', '-framerate', String(FPS), '-i', f); return ++nIn }
const chatIdx = files.map(still); const endIdx = still(end)
const fc = [], labels = []
장면.forEach((s, i) => {
  if (s.chat) fc.push(`[${chatIdx[s.chat - 1]}:v]trim=duration=${s.dur},setpts=PTS-STARTPTS,scale=${W}:${H},setsar=1,format=yuv420p[v${i}]`)
  else if (s.end) fc.push(`[${endIdx}:v]trim=duration=${s.dur},setpts=PTS-STARTPTS,scale=${W}:${H},setsar=1,fade=t=in:st=0:d=0.3:color=0xfbf5e8,format=yuv420p[v${i}]`)
  else fc.push(`[0:v]trim=${s.src[0]}:${s.src[1]},setpts=PTS-STARTPTS,${앱},fps=${FPS},tpad=stop_mode=clone:stop_duration=1,trim=duration=${s.dur},setpts=PTS-STARTPTS,format=yuv420p[v${i}]`)
  labels.push(`[v${i}]`)
})
fc.push(`${labels.join('')}concat=n=${labels.length}:v=1:a=0,format=yuv420p[out]`)
const out = join(OUT, '시안-레꾸자랑-A.mp4')
execFileSync(FF, ['-y', '-hide_banner', '-loglevel', 'error', ...inputs, '-filter_complex', fc.join(';'), '-map', '[out]', '-r', String(FPS), '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: 'inherit' })
console.log(`✅ ${out}  (설계 ${장면.reduce((a, s) => a + s.dur, 0).toFixed(1)}초)`)
