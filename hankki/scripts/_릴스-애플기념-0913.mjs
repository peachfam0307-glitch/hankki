// 🎬 애플 출시기념 «릴스» 16초 (1080×1920 · 30fps) — 2026-09-13
//
// 📮 창업자 = *"릴스에 효과 팡팡 넣어줘."* · *"캐러셀보다는 릴스가 낫겠지??"*
//   ⭐ 릴스가 맞다 — 인스타는 «릴스만» 나를 모르는 사람에게 퍼뜨린다. 아이폰 출시는 «새 사람»이 목적이다.
//   ⛔⛔ 승인 나기 전엔 올리지 않는다(절대원칙 39).
//
// ⛔⛔ [창업자가 잡았다] *"블로그 글씨는 긁어서 붙여야하지않아?? 캡쳐는 인스타랑 유튜브 캡션만"*
//   🔢 실측(src/screens/ImportScreen.jsx) — 링크 갈래 = 「주소만 저장해요 · 재료·순서는 안 담겨요」.
//      링크 본문 자동 읽기는 「서버 되면 되살릴 것」으로 빠져 있다.
//   ✅ 그래서 말하는 건 둘뿐이다 — ⑴캡처해서 공유 ⑵글 붙여넣기(블로그는 이 길).
//
// 흐름 (16.0초)
//   0.0~3.4   훅   — 「아이폰 유저분들 많이 기다리셨죠?」 ＋ 폭죽 팡 ＋ 불꽃놀이 씬컷
//   3.4~6.0   홈   — 「이제 어느 폰이든 한끼」
//   6.0~8.8   담기 — 「인스타에서 본 레시피, 담아두면 안 사라져요」
//   8.8~11.2  꾸밈 — 「꾸며서 자랑해요」
//   11.2~13.6 로그인 — 「Apple로 로그인」  ⭐아이폰만의 화면
//   13.6~16.0 끝   — 「아이폰에서도, 오늘도 한끼하세요」 ＋ 두 스토어 ＋ 폭죽 한 번 더
//
// ⚙️ 만드는 법 = 한 장짜리 HTML 에 웹 애니메이션으로 다 그려 놓고,
//    프레임마다 getAnimations() 의 시계를 그 시각으로 «돌려» 찍는다.
//    ⭐ 그래서 프레임이 안 흔들린다(무작위도 씨앗을 고정해 늘 같은 자리 = 다시 뽑아도 같은 영상).
// ⛔ 저장소 ffmpeg 는 mp4 를 못 연다 → node_modules/ffmpeg-static/ffmpeg 를 쓴다.
// ⛔ 이 파일 안에서 백틱을 «글자로» 쓰지 않는다 — 템플릿 문자열이 그 자리에서 닫힌다(2026-09-13 실제로 당했다).
//
// 쓰는 법: SMOKE_CHROMIUM=… node scripts/_릴스-애플기념-0913.mjs
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const R = dirname(dirname(fileURLToPath(import.meta.url)))
const 화면곳 = process.env.SHOTS || '/tmp/claude-0/애플기념화면'
const 임시 = process.env.SCRATCH || '/tmp/claude-0/릴스-애플기념-프레임'
const 낼곳 = join(R, 'design/promo/인스타-2509')
const 낼파일 = join(낼곳, '릴스-애플출시-2026-09-13.mp4')
const FF = join(R, 'node_modules/ffmpeg-static/ffmpeg')
if (!existsSync(FF)) { console.error('⛔ ffmpeg-static 이 없다'); process.exit(1) }
rmSync(임시, { recursive: true, force: true }); mkdirSync(임시, { recursive: true }); mkdirSync(낼곳, { recursive: true })

const W = 1080, H = 1920, FPS = 30, 길이 = 16.0
const 짐 = (p) => 'data:image/png;base64,' + readFileSync(p).toString('base64')
const 화면 = (f) => { const p = join(화면곳, f); if (!existsSync(p)) throw new Error('⛔ 화면이 없다 → ' + p + ' (먼저 _shot-애플기념화면-0913.mjs)'); return 짐(p) }
const 씬 = (k) => 짐(join(R, 'docs/stickers/콤비-씬-정본-2026-09-05/낱개-씬/' + k + '.png'))
const 축하 = (n) => 짐(join(R, 'docs/stickers/여름-창업자-2507/낱개-콤비축하/' + n + '.png'))

// 🐻 앱 아이콘(꼬르곰) — 카톡 배경·캐러셀과 «같은 꼴»
const 앱아이콘 = 짐(join(R, 'public/icons/icon-512-v7.png'))
const 폰트 = readFileSync(join(R, 'src/assets/fonts/gowun-dodum-korean-400.woff2')).toString('base64')
const 폰트L = readFileSync(join(R, 'src/assets/fonts/gowun-dodum-latin-400.woff2')).toString('base64')
const 진 = '#5d3410'

// 🎉 폭죽 — ⛔무작위를 그때그때 뽑으면 프레임마다 자리가 달라져 화면이 «떨린다».
//    ⭐ 씨앗 고정 난수로 «미리» 뽑아 박는다.
let 씨 = 20260913
const 랜 = () => (씨 = (씨 * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff
const 색 = ['#ffb84d', '#ff7a7a', '#6fc0ff', '#8fd98f', '#ffd93d', '#c79bff']
const 폭죽 = (개수, 늦기, 가운데Y) => Array.from({ length: 개수 }, () => {
  const 각 = 랜() * Math.PI * 2, 힘 = 260 + 랜() * 640
  const x = Math.cos(각) * 힘, y = Math.sin(각) * 힘 - 280 - 랜() * 240
  const c = 색[Math.floor(랜() * 색.length)]
  const w = 14 + 랜() * 16, h = 20 + 랜() * 26, 돌 = (랜() * 900 - 450) | 0
  const 뜸 = (늦기 + 랜() * 0.2).toFixed(2)
  return '<i style="--x:' + x.toFixed(0) + 'px;--y:' + y.toFixed(0) + 'px;--r:' + 돌 + 'deg;--d:' + 뜸 + 's;background:' + c
    + ';width:' + w.toFixed(0) + 'px;height:' + h.toFixed(0) + 'px;left:50%;top:' + 가운데Y + 'px"></i>'
}).join('')

const 머리 = `<style>
  @font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트}) format('woff2');unicode-range:U+AC00-D7A3,U+1100-11FF,U+3130-318F}
  @font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트L}) format('woff2')}
  *{margin:0;padding:0;box-sizing:border-box;font-family:GD,sans-serif;-webkit-font-smoothing:antialiased}
  body{width:${W}px;height:${H}px;background:#FFFDF7;color:${진};overflow:hidden;position:relative}
  .장{position:absolute;inset:0;opacity:0;animation:장뜸 var(--len) linear var(--at) both}
  @keyframes 장뜸{0%{opacity:0}4%{opacity:1}93%{opacity:1}100%{opacity:0}}
  .툭{animation:툭 .55s cubic-bezier(.2,1.4,.4,1) var(--at) both}
  @keyframes 툭{0%{opacity:0;transform:translateY(70px) scale(.94)}100%{opacity:1;transform:none}}
  .쑥{animation:쑥 .7s cubic-bezier(.2,1,.3,1) var(--at) both}
  @keyframes 쑥{0%{opacity:0;transform:translateY(300px) scale(.96)}100%{opacity:1;transform:none}}
  .팝{animation:팝 .6s cubic-bezier(.2,1.5,.4,1) var(--at) both}
  @keyframes 팝{0%{opacity:0;transform:scale(.6)}100%{opacity:1;transform:scale(1)}}
  .불{position:absolute;inset:0;pointer-events:none;overflow:hidden}
  .불 i{position:absolute;display:block;border-radius:4px;opacity:0;
    animation:팡 1.6s cubic-bezier(.12,.75,.3,1) var(--d) both}
  @keyframes 팡{
    0%{opacity:0;transform:translate(-50%,0) scale(.3) rotate(0)}
    10%{opacity:1}
    68%{opacity:1}
    100%{opacity:0;transform:translate(calc(-50% + var(--x)), calc(var(--y) + 560px)) scale(1) rotate(var(--r))}}
  .폰틀{position:absolute;border:14px solid #3a2a1c;border-radius:62px;overflow:hidden;background:#fff;
    box-shadow:0 40px 80px rgba(93,52,16,.24)}
  /* ⛔ [창업자 2026-09-15] "레꾸자랑에서 랜덤부붙 잘렸엉" ＋ "아이폰 화면을 위로 다 조금씩 올려줄래"
     cover + object-position:top 이라 폰 상자가 화면 «아래»를 잘랐다.
     ⭐ contain 이면 화면이 통째로 들어간다(스크린샷 2.168 ＝ 폰 상자 852/393 ＝ 2.168 로 거의 같다).
     ⛔ cover 로 되돌리지 말 것 — 되돌리면 또 잘린다. */
  .폰틀 img{width:100%;height:100%;object-fit:contain;object-position:center}
  /* 🐻 알약 앞 꼬르곰 = 앱 아이콘. ⛔유니코드 이모지 금지(절대원칙) */
  .알약 img{width:86px;height:86px;border-radius:22px;display:block}
  .알약{display:inline-flex;align-items:center;gap:12px;background:#fff;border:3px solid #efe2cf;border-radius:999px;padding:20px 42px;font-size:44px;color:#7a5a3a}
</style>`

const 폰 = (파일, 높이, 자리, at) => {
  const 폭 = Math.round(높이 * 393 / 852)
  return `<div class="폰틀 쑥" style="--at:${at}s;${자리};width:${폭}px;height:${높이}px">
    <img src="${화면(파일)}"></div>`
}
const 장 = (시작, 길, 속) => `<div class="장" style="--at:${시작}s;--len:${길}s">${속}</div>`

const 몸 = `
${장(0, 3.4, `
  <div class="툭" style="--at:.15s;position:absolute;left:0;right:0;top:250px;text-align:center;font-size:52px;color:#a98a6b">2026.09 · App Store 출시</div>
  <div class="툭" style="--at:.35s;position:absolute;left:0;right:0;top:360px;text-align:center;font-size:104px;line-height:1.32;font-weight:700">아이폰 유저분들<br>많이 기다리셨죠?</div>
  <div class="팝" style="--at:.7s;position:absolute;left:120px;top:800px;width:840px;height:840px;border-radius:70px;overflow:hidden;box-shadow:0 30px 70px rgba(93,52,16,.2)">
    <img src="${씬('sn_06')}" style="width:100%;height:100%;object-fit:cover"></div>
  <div class="툭" style="--at:1.15s;position:absolute;left:0;right:0;bottom:140px;text-align:center"><span class="알약">이제 아이폰에서도 한끼</span></div>
  <div class="불">${폭죽(70, 0.55, 900)}</div>`)}

${장(3.4, 2.6, `
  <div class="툭" style="--at:3.55s;position:absolute;left:0;right:0;top:200px;text-align:center;font-size:84px;line-height:1.3;font-weight:700">이제 어느 폰이든</div>
  <div class="툭" style="--at:3.7s;position:absolute;left:0;right:0;top:330px;text-align:center;font-size:44px;color:#a98a6b">흩어진 레시피를, 한곳에</div>
  ${폰('2-홈.png', 1230, 'left:257px;bottom:-40px', 3.6)}`)}

${장(6.0, 2.8, `
  <div class="툭" style="--at:6.15s;position:absolute;left:0;right:0;top:180px;text-align:center;font-size:64px;line-height:1.38;font-weight:700">인스타에서 본 레시피,<br>담아두면 안 사라져요</div>
  <div class="툭" style="--at:6.35s;position:absolute;left:0;right:0;top:400px;text-align:center;font-size:42px;color:#a98a6b">캡처해 두고 불러오면 재료·순서까지</div>
  ${폰('3a-레시피탭.png', 1230, 'left:257px;bottom:-40px', 6.25)}`)}

${장(8.8, 2.4, `
  <div style="position:absolute;inset:0;background:#f3e6d2"></div>
  <div class="툭" style="--at:8.95s;position:absolute;left:0;right:0;top:200px;text-align:center;font-size:80px;font-weight:700">꾸며서 자랑해요</div>
  <div class="툭" style="--at:9.1s;position:absolute;left:0;right:0;top:330px;text-align:center;font-size:42px;color:#a0805c">내가 꾸민 표지 그대로, 친구한테</div>
  ${폰('4b-꾸민표지-상세.png', 1230, 'left:257px;bottom:-40px', 9.0)}`)}

${장(11.2, 2.4, `
  <div class="툭" style="--at:11.35s;position:absolute;left:0;right:0;top:180px;text-align:center;font-size:74px;line-height:1.35;font-weight:700">폰이 바뀌어도<br>그대로 있어요</div>
  <div class="팝" style="--at:11.7s;position:absolute;left:0;right:0;top:400px;text-align:center">
    <span class="알약" style="background:#111;border-color:#111;color:#fff">Apple로 로그인</span></div>
  ${폰('5-로그인.png', 1230, 'left:257px;bottom:-40px', 11.45)}`)}

${장(13.6, 2.4, `
  <div class="툭" style="--at:13.75s;position:absolute;left:0;right:0;top:420px;text-align:center;font-size:88px;line-height:1.35;font-weight:700">아이폰에서도,<br>오늘도 한끼하세요</div>
  <img class="팝" style="--at:14.0s;position:absolute;left:240px;top:800px;height:600px;object-fit:contain" src="${축하('03')}">
  <!-- 🐻 [창업자 2026-09-16] 마지막 장에 우리 아이콘 — 카톡 배경·캐러셀과 «같은 꼴» -->
  <div class="툭" style="--at:14.25s;position:absolute;left:0;right:0;bottom:200px;text-align:center">
    <span class="알약" style="padding:24px 46px 24px 26px;font-size:44px;text-align:left;line-height:1.35">
      <img src="${앱아이콘}">
      <span>App Store · Google Play 에서<br><b style="color:${진};font-size:56px;letter-spacing:-1px">한끼 레시피북</b> 검색</span>
    </span></div>
  <div class="불">${폭죽(80, 13.85, 700)}</div>`)}
`

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
// 🔍🔍 [창업자 2026-09-16 = 릴스가 고화질이 아니야] **2배로 찍어서 절반으로 줄인다**(슈퍼샘플링).
//    ⛔ 1배로 찍으면 글자 가장자리가 그 해상도에서 «한 번만» 계산돼 거칠다.
//    ⭐ 2160x3840 으로 찍고 ffmpeg 가 1080x1920 으로 줄이면 픽셀 넷이 하나로 섞여 훨씬 매끈하다.
const 배율 = Number(process.env.SS || 2)
const p = await (await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 배율 })).newPage()
await p.setContent('<!doctype html><html><head>' + 머리 + '</head><body>' + 몸 + '</body></html>')
await p.waitForTimeout(700)
await p.evaluate(() => { document.getAnimations().forEach((a) => a.pause()) })
const 총 = Math.round(길이 * FPS)
for (let i = 0; i < 총; i++) {
  await p.evaluate((t) => { document.getAnimations().forEach((a) => { try { a.currentTime = t } catch { /* noop */ } }) }, (i / FPS) * 1000)
  await p.screenshot({ path: join(임시, 'f' + String(i).padStart(4, '0') + '.png') })
  if (i % 90 === 0) console.log('  ' + i + '/' + 총)
}
await b.close()
console.log('🎞 프레임 다 찍었다 → 이어붙인다')
execFileSync(FF, ['-y', '-framerate', String(FPS), '-i', join(임시, 'f%04d.png'),
  // ⭐ lanczos = 줄일 때 제일 또렷한 방식 · crf 15 = 더 적게 버린다(18 은 인스타 재압축 뒤 뭉갰다)
  //    maxrate/bufsize 로 바닥을 받쳐 준다 — 단색 화면이라 crf 만으로는 비트레이트가 너무 내려간다
  '-vf', 'scale=' + W + ':' + H + ':flags=lanczos',
  '-c:v', 'libx264', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-crf', '15',
  '-maxrate', '12M', '-bufsize', '24M', '-movflags', '+faststart', 낼파일], { stdio: 'inherit' })
console.log('✅', 낼파일)
