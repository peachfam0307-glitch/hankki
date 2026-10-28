// 🎬💰 식비 «소개» 릴스 26초 (1080×1920 · 30fps) — 2026-09-19
//
// 📮 창업자 = *"레시피->장보기->식비->냉장고로 가는 흐름을 내일 릴스에 녹이자. 식비탭을 구체적으로 소개하고."*
//   · *"훅은 2초만 보여줘"*  · *"큼직큼직하게 잘 보이게 소개하는 부분만 크롭해서 크게 보여줘"*
//   · *"배경이랑 그런 것도 다르게 해줘 계속 우리 비슷한 느낌으로 릴스 만들었어서.."* → 남색 ＋ 격자(진한 노트) ⓕ
//   · *"우리 예산도 정해서 살 수 있잖아."* · *"주 달 예산을 적고 확인하면서 식비 아끼기해봐요 등"*
//   · *"남은재료가 아니라 장보기에 담은 재료아니야?"* → ④는 «체크한» 재료가 냉장고로 간다(ShopScreen.jsx:214)
//
// ⭐ 훅 = 한끼 «연구소»에 온 익명 제안. 익명이라 동의 문제가 없다(창업자 확인 2026-09-18).
//   ⛔ 화면엔 짧게 자른 한 줄만 — 2초에 26자는 못 읽는다. «전문은 캡션»에 넣는다.
//
// ⭐⭐ 어제 예고(밝은 크림 노트)와 «한 쌍»이 되게 했다 — 같은 격자, 낮과 밤.
//   ⛔ 폰 목업을 쓰지 않는다 — 글씨가 작아 폰에서 안 읽힌다. 잘라낸 화면을 «카드»로 크게 얹는다.
//
// 흐름 (26.0초) — 번호 ①②③④ 로 걸음을 박는다
//   0.0~2.0   훅   「식비도 기록할 수 있으면 좋겠어요」 — 한끼 연구소에 온 제안
//   2.0~3.5   답   「그래서 만들었어요」
//   3.5~6.0   ①   레시피에서
//   6.0~8.0   ①   재료를 고르고
//   8.0~10.0  ②   장보기에 쏙
//   10.0~12.5 ②   금액만 적으면
//   12.5~14.5 ③   식비에 넣기
//   14.5~17.0 ③   장 본 것도, 배달도
//   17.0~19.0 ③   주·달 예산을 정해두면
//   19.0~21.0 ③   얼마 남았는지 바로 보여요
//   21.0~22.5 ③   주별·달별로 한눈에
//   22.5~24.0 ④   체크하면 냉장고로
//   24.0~26.0 ④   그 재료로 만들 요리까지  ＋ 두 스토어 알약
//
// ⛔ 화면은 «앱이 그린 그것»이라야 한다 → 먼저 `_shot-흐름릴스-0919.mjs` 를 돌린다(규칙 30).
// ⛔ 이 파일 안에서 백틱을 «글자로» 쓰지 않는다.
//
// 쓰는 법: SMOKE_CHROMIUM=… node scripts/_릴스-식비소개-0919.mjs
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const R = dirname(dirname(fileURLToPath(import.meta.url)))
const 화면곳 = process.env.SHOTS || '/tmp/claude-0/흐름릴스-0919'
const 임시 = process.env.SCRATCH || '/tmp/claude-0/릴스-식비소개-프레임'
const 낼곳 = join(R, 'design/promo/인스타-2509')
const 낼파일 = join(낼곳, '릴스-식비소개-2026-09-19.mp4')
const FF = join(R, 'node_modules/ffmpeg-static/ffmpeg')
if (!existsSync(FF)) { console.error('⛔ ffmpeg-static 이 없다'); process.exit(1) }
rmSync(임시, { recursive: true, force: true }); mkdirSync(임시, { recursive: true }); mkdirSync(낼곳, { recursive: true })

const W = 1080, H = 1920, FPS = 30, 길이 = 26.0
const 짐 = (p) => 'data:image/png;base64,' + readFileSync(p).toString('base64')
const 컷 = (f) => { const p = join(화면곳, f); if (!existsSync(p)) throw new Error('⛔ 화면이 없다 → ' + p + ' (먼저 _shot-흐름릴스-0919.mjs)'); return 짐(p) }
const 앱아이콘 = 짐(join(R, 'public/icons/icon-512-v7.png'))
const 씬 = (k) => 짐(join(R, 'docs/stickers/콤비-씬-정본-2026-09-05/낱개-씬/' + k + '.png'))
const 폰트 = readFileSync(join(R, 'src/assets/fonts/gowun-dodum-korean-400.woff2')).toString('base64')
const 폰트L = readFileSync(join(R, 'src/assets/fonts/gowun-dodum-latin-400.woff2')).toString('base64')

// 🌙 창업자 확정 ⓕ = 남색 ＋ 격자(진한 노트). 어제 예고(밝은 크림 노트)와 낮·밤 한 쌍.
const 바탕 = '#26354A', 줄 = '#2f4058', 진 = '#F3F7FC', 연 = '#9db0c8'

const 머리 = `<style>
  @font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트}) format('woff2');unicode-range:U+AC00-D7A3,U+1100-11FF,U+3130-318F}
  @font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트L}) format('woff2')}
  *{margin:0;padding:0;box-sizing:border-box;font-family:GD,sans-serif;-webkit-font-smoothing:antialiased}
  body{width:${W}px;height:${H}px;color:${진};overflow:hidden;position:relative;
    background-color:${바탕};
    background-image:repeating-linear-gradient(0deg,${줄} 0 4px,transparent 4px 120px),
                     repeating-linear-gradient(90deg,${줄} 0 4px,transparent 4px 120px)}
  .장{position:absolute;inset:0;opacity:0;animation:장뜸 var(--len) linear var(--at) both}
  @keyframes 장뜸{0%{opacity:0}6%{opacity:1}92%{opacity:1}100%{opacity:0}}
  .툭{animation:툭 .45s cubic-bezier(.2,1.4,.4,1) var(--at) both}
  @keyframes 툭{0%{opacity:0;transform:translateY(50px) scale(.96)}100%{opacity:1;transform:none}}
  .쑥{animation:쑥 .6s cubic-bezier(.2,1,.3,1) var(--at) both}
  @keyframes 쑥{0%{opacity:0;transform:translateY(160px) scale(.97)}100%{opacity:1;transform:none}}
  .팝{animation:팝 .5s cubic-bezier(.2,1.5,.4,1) var(--at) both}
  @keyframes 팝{0%{opacity:0;transform:scale(.7)}100%{opacity:1;transform:scale(1)}}
  /* 🃏 잘라낸 화면을 «카드»로 — 진한 배경 위라 흰 카드가 튀어나온다 */
  .카드{position:absolute;left:60px;width:960px;border-radius:26px;overflow:hidden;background:#fff;
    box-shadow:0 34px 70px rgba(0,0,0,.42)}
  /* 🛟 안전망 — 어떤 카드도 화면 밖으로 나가지 않게. ⛔2026-09-18 에 재료 목록이 넘쳐 창업자가 잡았다. */
  .카드{max-height:1080px}
  .카드 img{width:100%;display:block}
  .번호{position:absolute;left:0;right:0;text-align:center;font-size:58px;font-weight:700;color:${연}}
  .큰{position:absolute;left:0;right:0;text-align:center;font-size:88px;line-height:1.28;font-weight:700}
  .작{position:absolute;left:0;right:0;text-align:center;font-size:46px;color:${연}}
  /* ⛔ 진한 배경에선 연한 글씨가 안 읽힌다 — 알약은 흰 바탕에 진한 글씨로 */
  .알약{display:inline-flex;align-items:center;gap:14px;background:#fff;border-radius:999px;
    padding:24px 46px 24px 26px;font-size:42px;color:#5a6b80;text-align:left;line-height:1.35}
  .알약 img{width:86px;height:86px;border-radius:22px;display:block}
  .인용{position:absolute;left:90px;right:90px;text-align:center;font-size:64px;line-height:1.45;font-weight:700}
</style>`

const 장 = (시작, 길, 속) => `<div class="장" style="--at:${시작}s;--len:${길}s">${속}</div>`
const 번호 = (at, top, 글) => `<div class="번호 툭" style="--at:${at}s;top:${top}px">${글}</div>`
const 큰 = (at, top, 글) => `<div class="큰 툭" style="--at:${at}s;top:${top}px">${글}</div>`
const 작 = (at, top, 글) => `<div class="작 툭" style="--at:${at}s;top:${top}px">${글}</div>`
const 카드 = (at, top, 파일) => `<div class="카드 쑥" style="--at:${at}s;top:${top}px"><img src="${컷(파일)}"></div>`

const 몸 = `
${장(0, 2.0, `
  <div class="인용 툭" style="--at:.12s;top:700px">&ldquo;식비도 기록할 수 있으면<br>좋겠어요&rdquo;</div>
  ${작(0.45, 1010, '— 한끼 연구소에 온 제안')}`)}

${장(2.0, 1.5, `
  ${큰(2.12, 820, '그래서 만들었어요')}`)}

${장(3.5, 2.5, `
  ${번호(3.6, 240, '①')}
  ${큰(3.7, 330, '레시피에서')}
  ${카드(3.85, 560, 'c1-재료체크.png')}`)}

${장(6.0, 2.0, `
  ${번호(6.1, 240, '①')}
  ${큰(6.2, 330, '재료를 고르고')}
  ${카드(6.35, 560, 'c1-재료체크.png')}`)}

${장(8.0, 2.0, `
  ${번호(8.1, 240, '②')}
  ${큰(8.2, 330, '장보기에 쏙')}
  ${카드(8.35, 600, 'c2-장보기목록.png')}`)}

${장(10.0, 2.5, `
  ${번호(10.1, 240, '②')}
  ${큰(10.2, 330, '금액만 적으면')}
  ${카드(10.35, 700, 'c3-금액적음.png')}
  ${작(10.9, 1100, '두부 1910 — 이렇게만')}`)}

${장(12.5, 2.0, `
  ${번호(12.6, 240, '③')}
  ${큰(12.7, 330, '식비에 넣기')}
  ${카드(12.85, 620, 'c4-식비에넣기.png')}`)}

${장(14.5, 2.5, `
  ${번호(14.6, 240, '③')}
  ${큰(14.7, 330, '장 본 것도, 배달도')}
  ${카드(14.85, 600, 'c7-목록.png')}`)}

${장(17.0, 2.0, `
  ${번호(17.1, 200, '③')}
  ${큰(17.2, 290, '주·달 예산을<br>정해두면')}
  ${카드(17.4, 700, 'c10-예산시트.png')}`)}

${장(19.0, 2.0, `
  ${번호(19.1, 240, '③')}
  ${큰(19.2, 330, '얼마 남았는지<br>바로 보여요')}
  ${카드(19.4, 720, 'c5-식비요약.png')}`)}

${장(21.0, 1.5, `
  ${번호(21.1, 280, '③')}
  ${큰(21.2, 370, '주별·달별로 한눈에')}
  ${카드(21.35, 640, 'c8-흐름막대.png')}`)}

${장(22.5, 1.5, `
  ${번호(22.6, 280, '④')}
  ${큰(22.7, 370, '체크하면 냉장고로')}
  ${카드(22.85, 640, 'c11-토스트.png')}`)}

${장(24.0, 2.0, `
  ${번호(24.1, 180, '④')}
  ${큰(24.2, 270, '그 재료로<br>만들 요리까지')}
  ${카드(24.4, 620, 'c12-가진재료로만들기.png')}
  <div class="툭" style="--at:24.7s;position:absolute;left:0;right:0;bottom:180px;text-align:center">
    <span class="알약"><img src="${앱아이콘}">
      <span>App Store · Google Play 에서<br><b style="color:#2b3a4d;font-size:54px;letter-spacing:-1px">한끼</b> 검색</span>
    </span></div>`)}
`

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const 배율 = Number(process.env.SS || 2)
const p = await (await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 배율 })).newPage()
await p.setContent('<!doctype html><html><head>' + 머리 + '</head><body>' + 몸 + '</body></html>')
await p.waitForTimeout(900)
await p.evaluate(() => { document.getAnimations().forEach((a) => a.pause()) })
const 총 = Math.round(길이 * FPS)
for (let i = 0; i < 총; i++) {
  await p.evaluate((t) => { document.getAnimations().forEach((a) => { try { a.currentTime = t } catch { /* noop */ } }) }, (i / FPS) * 1000)
  await p.screenshot({ path: join(임시, 'f' + String(i).padStart(4, '0') + '.png') })
  if (i % 120 === 0) console.log('  ' + i + '/' + 총)
}
await b.close()
console.log('🎞 프레임 다 찍었다 → 이어붙인다')
execFileSync(FF, ['-y', '-framerate', String(FPS), '-i', join(임시, 'f%04d.png'),
  '-vf', 'scale=' + W + ':' + H + ':flags=lanczos',
  '-c:v', 'libx264', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-crf', '15',
  '-maxrate', '12M', '-bufsize', '24M', '-movflags', '+faststart', 낼파일], { stdio: 'inherit' })
console.log('✅', 낼파일)
