// ✂️✨ 창업자 폰 화면 녹화(한끼 공유 → 인스타 DM) 편집 — 개인정보 흐림 ＋ 누르는 곳 반짝이 ＋ 단계 글자 (2026-10-04)
// 📮 창업자 = *"내가 찍어줄게 네가 잘라서 편집할래?"* · *"눌러야하는 항목에 반짝이 효과 넣어서 강조하고"*
//          ＋ *"개인정보들 다 모자이크처리하거나 블러처리해줘"* · *"다른 아이디나 앱들"*
// ⛔ 원본 영상은 저장소에 «안» 넣는다(다른 사람 아이디·얼굴이 그대로 있다) — PHONE 환경변수로 받는다.
// 흐림 자리(원본 1080×2340 기준 · 2026-10-04 격자로 잰 값)
//   · 상태줄 0~110 (늘)
//   · 공유창 3.3~7.0초 = 연락처 줄 1630~1850 · 앱 줄 1960~2200 에서 «Instagram 빼고»
//   · 인스타 보내기 목록 7.0초~ = 내 사진 110~270 · juvxntxs 줄 600~750 · annyeong_hankki «아래 전부» 915~2340
// 쓰는 법: PHONE=/path/녹화.mp4 SMOKE_CHROMIUM=… node scripts/_shot-공유녹화편집-1004.mjs
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const 앱 = dirname(dirname(fileURLToPath(import.meta.url)))
const FF = join(앱, 'node_modules/ffmpeg-static/ffmpeg')
const 원본 = process.env.PHONE
if (!원본) { console.error('⛔ PHONE=<폰 녹화 mp4> 를 달라'); process.exit(1) }
const 밖 = process.env.OUT || '/tmp/claude-0/공유녹화편집'
const 낼파일 = join(앱, 'design/promo/인스타-2610/공유-인스타DM-편집.mp4')
rmSync(밖, { recursive: true, force: true }); mkdirSync(join(밖, 'fx'), { recursive: true })

const 끝초 = 9.8, 빨리 = 1.2, 길이 = 끝초 / 빨리
// 흐림 상자 [x, y, w, h, 시작, 끝] — 원본 좌표
const 상자 = [
  [0, 0, 1080, 110, 0, 끝초],
  [0, 1630, 1080, 220, 3.3, 5.2],
  // 인스타 고르기 창(Messages·Feed…)이 뜬 5.2~6.55 = 연락처 줄에서 그 창(x 675~1012)만 빼고
  [0, 1630, 670, 220, 5.2, 6.55], [1015, 1630, 65, 220, 5.2, 6.55],
  [0, 1960, 700, 240, 3.3, 6.55], [870, 1960, 210, 240, 3.3, 6.55],
  // 인스타 화면은 6.55 부터 넘어온다(6.6 프레임에 내 사진·로그인 아이디가 보였다)
  [0, 110, 1080, 160, 6.55, 끝초], [0, 600, 1080, 150, 6.55, 끝초], [0, 915, 1080, 1145, 6.55, 끝초], [0, 2200, 1080, 140, 6.55, 끝초],   // 「완료」 단추(2060~2200)만 남긴다
  [0, 2060, 1080, 140, 6.55, 8.4],   // 완료가 뜨는 8.4 전엔 그 자리에 남의 아이디 줄이 보인다
]
let f = `[0:v]trim=0:${끝초},setpts=PTS-STARTPTS,fps=30,format=yuv420p[v0]`
상자.forEach(([x, y, w, h, s, e], i) => {
  f += `;[v${i}]split[m${i}][c${i}];[c${i}]crop=${w}:${h}:${x}:${y},boxblur=lr=20:lp=5:cr=8:cp=5[b${i}];[m${i}][b${i}]overlay=${x}:${y}:enable='between(t,${s},${e})'[v${i + 1}]`
})
const 끝 = 상자.length
// 1080×2340 → 높이 1920 에 맞춰 줄이고(886 폭) 양옆을 밤색으로 — 공유창 아래 앱 줄이 잘리지 않게
const 배 = 1920 / 2340, X0 = Math.round((1080 - 1080 * 배) / 2)
f += `;[v${끝}]setpts=PTS/${빨리},scale=-2:1920,pad=1080:1920:(ow-iw)/2:0:color=0x2b123d,format=yuva420p[base]`
f += `;[1:v]format=rgba[fx];[base][fx]overlay=0:0,format=yuv420p[v]`

// ✨ 반짝이 — 누르는 순간(원본 초)과 자리(원본 좌표)
// [초, x, y, 폭, 높이] — 폭·높이 = 알약 둘레(눈으로 잰 원본 좌표)
// 6번째 = 테두리가 누르기 몇 초 전부터 뜨나(편집본 초) — 보내기는 인스타 화면이 뜬 뒤라야 해서 짧게
const 톡 = [[1.0, 930, 168, 250, 110, 1.0], [2.7, 540, 2150, 1000, 200, 1.0], [4.4, 780, 2050, 200, 200, 1.0], [6.45, 842, 1372, 260, 120, 1.0], [7.8, 899, 838, 230, 120, 0.6], [9.3, 540, 2128, 1000, 150, 0.7]]
const 폰 = (n) => readFileSync(join(앱, 'src/assets/fonts', n)).toString('base64')
const 별들 = 톡.map(([t, x, y, w, h, 리드], i) => { const X = X0 + x * 배, Y = y * 배, W = w * 배, H = h * 배, at = (t / 빨리 - 0.25).toFixed(2)
  const 앞 = Math.max(0, t / 빨리 - 리드).toFixed(2), 길 = (t / 빨리 + 0.15 - 앞).toFixed(2)
  return `<div class="테" style="left:${X - W / 2}px;top:${Y - H / 2}px;width:${W}px;height:${H}px;--from:${앞}s;--dur:${길}s"></div><div class="링" style="left:${X - 70}px;top:${Y - 70}px;--at:${at}s"></div>` + [0, 1, 2, 3, 4, 5].map((k) => `<div class="별" style="left:${X - 22}px;top:${Y - 22}px;--at:${at}s;--a:${k * 60 + i * 17}deg">✦</div>`).join('') }).join('')
const html = `<!doctype html><html><head><style>@font-face{font-family:BH;src:url(data:font/woff2;base64,${폰('blackhansans-korean-400.woff2')})}@font-face{font-family:BH;src:url(data:font/woff2;base64,${폰('blackhansans-latin-400.woff2')})}
*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;position:relative;overflow:hidden;background:transparent}
.띠{animation:띠 .3s ease-out 1.0s both;position:absolute;left:40px;right:40px;top:70px;background:rgba(43,18,61,.94);color:#fff;border-radius:36px;padding:24px 16px;text-align:center;font-family:BH;font-size:50px;line-height:1.25;box-shadow:0 10px 30px rgba(0,0,0,.4)}.띠 b{color:#ffb347}
@keyframes 띠{from{opacity:0;transform:translateY(-30px)}to{opacity:1;transform:none}}
.테{position:absolute;border-radius:999px;border:9px solid #ffd36b;box-shadow:0 0 0 6px rgba(255,140,40,.55),0 0 40px 10px #ffb347;opacity:0;animation:테 var(--dur) linear var(--from) both}
@keyframes 테{0%{opacity:0;transform:scale(1.3)}12%{opacity:1;transform:scale(1)}30%{transform:scale(1.08)}48%{transform:scale(1)}66%{transform:scale(1.08)}84%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1)}}
.링{position:absolute;width:140px;height:140px;border-radius:50%;border:8px solid #ffd36b;box-shadow:0 0 30px #ffb347,inset 0 0 20px #ffd36b;animation:링 .9s ease-out var(--at) both}
@keyframes 링{0%{opacity:0;transform:scale(.3)}25%{opacity:1}100%{opacity:0;transform:scale(1.5)}}
.별{position:absolute;width:44px;height:44px;color:#fff3c4;font-size:44px;line-height:44px;text-align:center;text-shadow:0 0 16px #ffd36b;animation:별 .9s ease-out var(--at) both}
@keyframes 별{0%{opacity:0;transform:rotate(var(--a)) translateY(0) scale(.4)}30%{opacity:1}100%{opacity:0;transform:rotate(var(--a)) translateY(-120px) scale(1)}}</style></head>
<body><div class="띠"><b>②</b> 한끼 앱에서 공유 → 인스타 → DM</div>${별들}</body></html>`
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const pg = await (await b.newContext({ viewport: { width: 1080, height: 1920 } })).newPage()
await pg.setContent(html); await pg.waitForTimeout(500); await pg.evaluate(() => document.getAnimations().forEach((a) => a.pause()))
for (let i = 0; i < Math.round(길이 * 30); i++) { await pg.evaluate((t) => document.getAnimations().forEach((a) => { a.currentTime = t }), (i / 30) * 1000); await pg.screenshot({ path: join(밖, 'fx', 'f' + String(i).padStart(4, '0') + '.png'), omitBackground: true }) }
await b.close()
execFileSync(FF, ['-y', '-i', 원본, '-framerate', '30', '-i', join(밖, 'fx', 'f%04d.png'), '-filter_complex', f, '-map', '[v]', '-an',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', 낼파일], { stdio: 'inherit' })
console.log('✅', 낼파일, 길이.toFixed(2) + '초')
