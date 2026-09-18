// 🎬💰 식비 «예고» 릴스 9초 (1080×1920 · 30fps) — 2026-09-18
//
// 📮 창업자 = *"예고하는거야 2일걸린다고 생각하고"* · *"예고릴스니까 짧고 핵심만"*
//            · *"출시되면 제대로 소개하는 걸로"* · *"릴스랑 캐러셀은 다른 스타일로 만들자"*
//   ⭐ 그래서 «핵심 하나»만 남긴다 = 「장보기에 적으면 식비가 된다」.
//   ⛔ 공감 서사(가계부 3일 쓰다 말죠)는 넣지 않는다 — 그건 출시일 캐러셀이 할 일이다.
//   ⛔ 날짜를 박지 않는다 — 애플 심사가 늘어날 수 있다. 「곧 나와요」로 둔다.
//
// 📮 창업자 = *"식비탭에 장본거랑 외식 배달 쌓인 화면도 보여줘"*
//   ⭐ 안 보여주면 「장보기 가계부」로만 읽힌다. 3번 장이 그걸 한 컷에 뒤집는다.
//
// 흐름 (9.0초)
//   0.0~2.5  적기 — 「장보기에 그냥 적으면」   ＋ 두부 1910 타자 화면
//   2.5~5.0  쌓임 — 「식비가 돼요」            ＋ 장보기·외식이 번갈아 쌓인 목록
//   5.0~7.0  갈림 — 「배달까지 같이」          ＋ 장보기 / 외식·배달 갈린 막대
//   7.0~9.0  끝   — 「곧 나와요」              ＋ 두 스토어 알약
//
// ⚙️ 만드는 법·주의 = `_릴스-애플기념-0913.mjs` 와 같다.
//   ⛔ 이 파일 안에서 백틱을 «글자로» 쓰지 않는다 — 템플릿 문자열이 그 자리에서 닫힌다.
//   ⛔ 화면은 «앱이 그린 그것»이라야 한다 → 먼저 `_shot-식비화면-0918.mjs` 를 돌린다(규칙 30).
//
// 쓰는 법: SMOKE_CHROMIUM=… node scripts/_릴스-식비예고-0918.mjs
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const R = dirname(dirname(fileURLToPath(import.meta.url)))
const 화면곳 = process.env.SHOTS || '/tmp'
const 임시 = process.env.SCRATCH || '/tmp/claude-0/릴스-식비예고-프레임'
const 낼곳 = join(R, 'design/promo/인스타-2509')
const 낼파일 = join(낼곳, '릴스-식비예고-2026-09-18.mp4')
const FF = join(R, 'node_modules/ffmpeg-static/ffmpeg')
if (!existsSync(FF)) { console.error('⛔ ffmpeg-static 이 없다'); process.exit(1) }
rmSync(임시, { recursive: true, force: true }); mkdirSync(임시, { recursive: true }); mkdirSync(낼곳, { recursive: true })

const W = 1080, H = 1920, FPS = 30, 길이 = 9.0
const 짐 = (p) => 'data:image/png;base64,' + readFileSync(p).toString('base64')
const 화면 = (f) => { const p = join(화면곳, f); if (!existsSync(p)) throw new Error('⛔ 화면이 없다 → ' + p + ' (먼저 _shot-식비화면-0918.mjs)'); return 짐(p) }
const 앱아이콘 = 짐(join(R, 'public/icons/icon-512-v7.png'))
// 🍿 예고편 결 — 꼬르곰·펭펭이 팝콘 들고 «곧 시작하는 것»을 기다리는 컷(sn_05)
const 씬 = (k) => 짐(join(R, 'docs/stickers/콤비-씬-정본-2026-09-05/낱개-씬/' + k + '.png'))
const 폰트 = readFileSync(join(R, 'src/assets/fonts/gowun-dodum-korean-400.woff2')).toString('base64')
const 폰트L = readFileSync(join(R, 'src/assets/fonts/gowun-dodum-latin-400.woff2')).toString('base64')
const 진 = '#5d3410'

const 머리 = `<style>
  @font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트}) format('woff2');unicode-range:U+AC00-D7A3,U+1100-11FF,U+3130-318F}
  @font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트L}) format('woff2')}
  *{margin:0;padding:0;box-sizing:border-box;font-family:GD,sans-serif;-webkit-font-smoothing:antialiased}
  body{width:${W}px;height:${H}px;background:#FFFDF7;color:${진};overflow:hidden;position:relative}
  .장{position:absolute;inset:0;opacity:0;animation:장뜸 var(--len) linear var(--at) both}
  @keyframes 장뜸{0%{opacity:0}5%{opacity:1}92%{opacity:1}100%{opacity:0}}
  .툭{animation:툭 .5s cubic-bezier(.2,1.4,.4,1) var(--at) both}
  @keyframes 툭{0%{opacity:0;transform:translateY(60px) scale(.95)}100%{opacity:1;transform:none}}
  .쑥{animation:쑥 .65s cubic-bezier(.2,1,.3,1) var(--at) both}
  @keyframes 쑥{0%{opacity:0;transform:translateY(260px) scale(.96)}100%{opacity:1;transform:none}}
  .팝{animation:팝 .55s cubic-bezier(.2,1.5,.4,1) var(--at) both}
  @keyframes 팝{0%{opacity:0;transform:scale(.6)}100%{opacity:1;transform:scale(1)}}
  .폰틀{position:absolute;border:14px solid #3a2a1c;border-radius:62px;overflow:hidden;background:#fff;
    box-shadow:0 40px 80px rgba(93,52,16,.24)}
  .폰틀 img{width:100%;height:100%;object-fit:contain;object-position:center}
  .알약 img{width:86px;height:86px;border-radius:22px;display:block}
  .알약{display:inline-flex;align-items:center;gap:12px;background:#fff;border:3px solid #efe2cf;border-radius:999px;padding:20px 42px;font-size:44px;color:#7a5a3a}
</style>`

// 📱 찍은 화면은 1170x2532(3배) 이라 비율이 393/852 와 같다 — 폰 상자와 딱 맞는다
const 폰 = (파일, 높이, 자리, at) => {
  const 폭 = Math.round(높이 * 393 / 852)
  return `<div class="폰틀 쑥" style="--at:${at}s;${자리};width:${폭}px;height:${높이}px">
    <img src="${화면(파일)}"></div>`
}
const 장 = (시작, 길, 속) => `<div class="장" style="--at:${시작}s;--len:${길}s">${속}</div>`
const 큰글 = (at, top, 글) => `<div class="툭" style="--at:${at}s;position:absolute;left:0;right:0;top:${top}px;text-align:center;font-size:86px;line-height:1.25;font-weight:700">${글}</div>`
const 작은글 = (at, top, 글) => `<div class="툭" style="--at:${at}s;position:absolute;left:0;right:0;top:${top}px;text-align:center;font-size:46px;color:#a98a6b">${글}</div>`

const 몸 = `
${장(0, 2.5, `
  ${큰글(0.15, 200, '장보기에 그냥 적으면')}
  ${작은글(0.35, 350, '두부 1910 — 이렇게만')}
  ${폰('식비릴스-담김.png', 1400, 'left:217px;bottom:40px', 0.3)}`)}

${장(2.5, 2.5, `
  ${큰글(2.65, 200, '식비가 돼요')}
  ${작은글(2.85, 330, '장 본 것도, 시켜 먹은 것도')}
  ${폰('식비목록-0918.png', 1400, 'left:217px;bottom:40px', 2.8)}`)}

${장(5.0, 2.0, `
  ${큰글(5.15, 200, '배달까지 같이')}
  ${폰('식비화면-0918-전체.png', 1400, 'left:217px;bottom:40px', 5.3)}`)}

${장(7.0, 2.0, `
  ${큰글(7.15, 300, '곧 나와요')}
  ${작은글(7.35, 470, '식비 가계부가 생겨요')}
  <div class="팝" style="--at:7.5s;position:absolute;left:120px;top:640px;width:840px;height:840px;border-radius:70px;overflow:hidden;box-shadow:0 30px 70px rgba(93,52,16,.2)">
    <img src="${씬('sn_05')}" style="width:100%;height:100%;object-fit:cover"></div>
  <div class="툭" style="--at:7.6s;position:absolute;left:0;right:0;bottom:180px;text-align:center">
    <span class="알약" style="padding:24px 46px 24px 26px;font-size:44px;text-align:left;line-height:1.35">
      <img src="${앱아이콘}">
      <span>App Store · Google Play 에서<br><b style="color:${진};font-size:56px;letter-spacing:-1px">한끼 레시피북</b> 검색</span>
    </span></div>`)}
`

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
// 🔍 2배로 찍어 절반으로 줄인다(슈퍼샘플링) — 글자 가장자리가 매끈해진다
const 배율 = Number(process.env.SS || 2)
const p = await (await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 배율 })).newPage()
await p.setContent('<!doctype html><html><head>' + 머리 + '</head><body>' + 몸 + '</body></html>')
await p.waitForTimeout(700)
await p.evaluate(() => { document.getAnimations().forEach((a) => a.pause()) })
const 총 = Math.round(길이 * FPS)
for (let i = 0; i < 총; i++) {
  await p.evaluate((t) => { document.getAnimations().forEach((a) => { try { a.currentTime = t } catch { /* noop */ } }) }, (i / FPS) * 1000)
  await p.screenshot({ path: join(임시, 'f' + String(i).padStart(4, '0') + '.png') })
  if (i % 60 === 0) console.log('  ' + i + '/' + 총)
}
await b.close()
console.log('🎞 프레임 다 찍었다 → 이어붙인다')
execFileSync(FF, ['-y', '-framerate', String(FPS), '-i', join(임시, 'f%04d.png'),
  '-vf', 'scale=' + W + ':' + H + ':flags=lanczos',
  '-c:v', 'libx264', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-crf', '15',
  '-maxrate', '12M', '-bufsize', '24M', '-movflags', '+faststart', 낼파일], { stdio: 'inherit' })
console.log('✅', 낼파일)
