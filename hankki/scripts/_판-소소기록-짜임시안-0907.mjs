// 🎨 소소 기능 ③ 「기록·내 것」 — «짜임» 시안 셋 (2026-09-07)
//
// 📮 창업자 = *"3번역시 짜임 글자 완전히 다른 스타일로 부탁해."* ＋ *"리서치하고 와도돼 새로운 짜임이나.. 조사하러"*
//
// 🔎 리서치(2026-09-07 · WebSearch) — 2026 인스타 캐러셀에서 «지금» 먹히는 짜임 셋
//   ⒜ Seamless(파노라마) — 그림이 장과 장 «사이로 이어진다». 완주율이 보통 캐러셀보다 40% 높다
//   ⒝ Contrast(반반) — 두 상태를 한 화면에 갈라 놓는다(전 ↔ 후 · 남의 것 ↔ 내 것)
//   ⒞ Intentionally messy(스크랩북) — 캡처·손글씨 주석·삐뚤한 크롭. «만든 티»를 일부러 뺀다
//   📌 셋 다 ①(풀블리드·조각·대화)②(같은 짜임 · 색만 반대)와 «짜임이 통째로» 다르다
//
// 🔤 글꼴도 갈아탄다 — ①② = Jua ＋ GowunDodum → ③ = **Gaegu ＋ NanumPen**(손글씨)
//    ⭐ ③의 주제가 「기록·일기」라 손글씨가 내용과 맞는다(글꼴만 바꾼 게 아니다)
//
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/_판-소소기록-짜임시안-0907.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = new URL('..', import.meta.url).pathname
const OUT = process.env.OUT || '/tmp/소소3/짜임시안'
mkdirSync(OUT, { recursive: true })
const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`
const 폰트 = readFileSync(join(ROOT, 'design/promo/fonts-embed.css'), 'utf8')
// ⛔ 시안 첫 판은 «홈» 캡처를 임시로 썼다 — ③ 진짜 재료(기록/)로 갈아끼웠다(2026-09-07 · 창업자 「글로봐서는 잘 모르겠어」 → 실물로 판정)
const 앱 = (f) => b64(join(ROOT, `design/promo/소소기능-앱화면-2509/기록/${f}.png`))
const 스 = (k) => b64(join(ROOT, `src/assets/sharepool/${k}.png`))

// 🎨 ③ 팔레트 = «오래 쓴 노트» — 세이지 종이 · 먹빛 글자 · 팥죽색 포인트
//    ①=크림 밝음 · ②=남색 어두움 → ③은 «중간 톤 색»이라 피드에서 셋이 다 갈린다
const 종이 = '#e7ebe0', 먹 = '#38403a', 팥 = '#9c4a3c', 크림 = '#fbf9f3'

const 기본 = `${폰트}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;position:relative;font-family:'Gaegu','NanumPen',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.sp{position:absolute;filter:drop-shadow(0 12px 18px rgba(40,50,60,.22))}
.hh{font-family:'Gaegu';color:${먹};letter-spacing:-0.01em;font-weight:700}
.ss{font-family:'NanumPen';line-height:1.45;color:#5d675e}
.tape{position:absolute;background:rgba(190,180,150,.55);z-index:7}
.tag{position:absolute;left:60px;top:56px;z-index:9;font-family:'Gaegu';font-weight:700;font-size:34px;color:${크림};background:${팥};border-radius:6px;padding:6px 22px;transform:rotate(-2deg)}
`
// 공책 줄 — 손글씨 짜임의 바탕
const 줄무늬 = `background-image:repeating-linear-gradient(180deg,transparent 0 57px,rgba(90,105,95,.16) 57px 59px);`
const 모눈 = `background-image:linear-gradient(rgba(90,105,95,.11) 1px,transparent 1px),linear-gradient(90deg,rgba(90,105,95,.11) 1px,transparent 1px);background-size:54px 54px;`

// 앱 화면 조각 — 원본 1170px 기준으로 잘라 온다
const 조각 = ({ 파일, y, h, x = 40, w = 1090, 배율 = 0.6, 회전 = 0, left, top, z = 5, r = 10, 테 = true }) =>
  `<div style="position:absolute;z-index:${z};left:${left}px;top:${top}px;width:${Math.round(w * 배율)}px;height:${Math.round(h * 배율)}px;overflow:hidden;border-radius:${r}px;background:#fff;${테 ? 'border:10px solid #fff;' : ''}box-shadow:0 14px 30px rgba(50,60,52,.22);transform:rotate(${회전}deg)">
  <img src="${앱(파일)}" style="position:absolute;left:${-x * 배율}px;top:${-y * 배율}px;width:${Math.round(1170 * 배율)}px"></div>`

const 테이프 = (l, t, w = 170, r = -6) => `<div class="tape" style="left:${l}px;top:${t}px;width:${w}px;height:42px;transform:rotate(${r}deg)"></div>`

// ✏️ 손으로 그은 동그라미·화살표 (SVG · 삐뚤한 선)
const 손동그라미 = (l, t, w, h) => `<svg style="position:absolute;z-index:8;left:${l}px;top:${t}px" width="${w}" height="${h}"><ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2 - 8}" ry="${h / 2 - 8}" fill="none" stroke="${팥}" stroke-width="7" stroke-linecap="round" stroke-dasharray="1400 40" transform="rotate(-3 ${w / 2} ${h / 2})"/></svg>`
const 손화살표 = (l, t, w, h, 뒤집 = false) => `<svg style="position:absolute;z-index:8;left:${l}px;top:${t}px${뒤집 ? ';transform:scaleX(-1)' : ''}" width="${w}" height="${h}"><path d="M6 ${h - 10} C ${w * 0.3} ${h * 0.75}, ${w * 0.55} ${h * 0.5}, ${w - 22} 16" fill="none" stroke="${팥}" stroke-width="6" stroke-linecap="round"/><path d="M${w - 46} 20 L${w - 16} 12 L${w - 26} 44" fill="none" stroke="${팥}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`

const 시안 = {
  // ─────────────────────────────────────────────────────────
  // D 스크랩북 — 공책에 캡처를 «삐뚤게» 붙이고 손글씨로 주석. 2026 「intentionally messy」
  'D-스크랩북': () => `<style>${기본}
body{background:${종이};${줄무늬}}
.hh{position:absolute;left:64px;top:150px;font-size:96px;line-height:1.1;z-index:9;transform:rotate(-1.5deg)}
.memo{position:absolute;font-family:'NanumPen';font-size:44px;color:${팥};z-index:9}
.foot{position:absolute;left:64px;bottom:54px;font-family:'NanumPen';font-size:32px;color:#7d867e;z-index:9}</style>
<div class="tag">소소한 기능 ③ · 5</div>
<div class="hh">별 다섯 개 주고<br>한 줄 남겨요</div>
${조각({ 파일: '03-시트-기록-별넷', y: 1150, h: 700, 배율: 0.56, 회전: -3, left: 70, top: 430 })}
${테이프(120, 405)}${테이프(560, 745, 150, 7)}
${조각({ 파일: '06-일기-달력', y: 55, h: 300, x: 20, w: 1130, 배율: 0.52, 회전: 2.5, left: 470, top: 1010, z: 6 })}
${손동그라미(90, 455, 330, 130)}
<div class="memo" style="left:700px;top:430px;transform:rotate(4deg)">이만큼<br>해먹었네</div>
${손화살표(640, 500, 120, 130, true)}
<div class="memo" style="left:90px;top:1200px;transform:rotate(-2deg)">기록은 쌓일수록 예뻐져</div>
<img class="sp" src="${스('pjs_01')}" style="right:50px;top:1080px;width:200px;transform:rotate(5deg);z-index:9">
<div class="foot">한끼 · 레시피 → 만들었어요</div>`,

  // ─────────────────────────────────────────────────────────
  // E 이어지는 띠 — 굵은 색띠가 장 «오른쪽 끝»에서 잘려 다음 장으로 이어진다(seamless)
  'E-이어지는띠': () => `<style>${기본}
body{background:${크림}}
.band{position:absolute;left:-40px;top:330px;width:1200px;height:520px;background:${팥};transform:rotate(-6deg);z-index:2}
.band2{position:absolute;left:-40px;top:870px;width:1200px;height:26px;background:${종이};transform:rotate(-6deg);z-index:3}
.hh{position:absolute;left:70px;top:96px;font-size:92px;line-height:1.1;z-index:9}
.on{position:absolute;left:70px;top:420px;width:520px;font-size:70px;line-height:1.2;color:${크림};z-index:9;transform:rotate(-6deg)}
.ss{position:absolute;left:70px;top:960px;width:600px;font-size:44px;z-index:9}
.foot{position:absolute;left:70px;bottom:56px;font-family:'NanumPen';font-size:32px;color:#8a938b;z-index:9}
.next{position:absolute;right:44px;bottom:150px;font-family:'NanumPen';font-size:38px;color:${팥};z-index:9}</style>
<div class="tag">소소한 기능 ③ · 5</div>
<div class="band"></div><div class="band2"></div>
<div class="hh">별 다섯 개 주고<br>한 줄 남겨요</div>
<div class="on">해먹은 날<br>그 자리에서</div>
${조각({ 파일: '03-시트-기록-별넷', y: 1150, h: 700, 배율: 0.44, 회전: -6, left: 590, top: 400, z: 6, 테: false, r: 22 })}
<div class="ss">별점·한 줄·메모가 한 화면에<br>다음 장에서 달력으로 모여요 →</div>
<div class="next">넘겨 보세요 ⟶</div>
<img class="sp" src="${스('duos_03')}" style="right:60px;bottom:200px;width:200px;z-index:9">
<div class="foot">한끼 · 레시피 → 만들었어요</div>`,

  // ─────────────────────────────────────────────────────────
  // F 반반 대비 — 위 「그냥 두면」 ↔ 아래 「한끼에선」 (contrast)
  'F-반반대비': () => `<style>${기본}
body{background:${크림}}
.up{position:absolute;left:0;top:0;width:1080px;height:560px;background:#d8d4cb;overflow:hidden}
.dn{position:absolute;left:0;top:560px;width:1080px;height:790px;background:${종이};${모눈}overflow:hidden}
.cut{position:absolute;left:0;top:548px;width:1080px;height:26px;background:${팥};z-index:8}
.lab{position:absolute;font-family:'Gaegu';font-weight:700;font-size:40px;z-index:9;border-radius:6px;padding:6px 20px}
.hh{position:absolute;left:64px;top:640px;font-size:88px;line-height:1.12;z-index:9}
.ss{position:absolute;left:64px;top:880px;width:470px;font-size:42px;z-index:9}
.gray{position:absolute;left:64px;top:250px;font-family:'NanumPen';font-size:52px;color:#7b766c;z-index:9}
.foot{position:absolute;left:64px;bottom:48px;font-family:'NanumPen';font-size:32px;color:#7d867e;z-index:9}</style>
<div class="tag">소소한 기능 ③ · 5</div>
<div class="up"></div><div class="dn"></div><div class="cut"></div>
<div class="lab" style="right:56px;top:60px;background:#b9b3a7;color:#fff">그냥 두면</div>
<div class="lab" style="right:56px;top:610px;background:${팥};color:${크림}">한끼에선</div>
<div class="gray">"저번에 그거… 맛있었는데<br>뭐였더라"</div>
<div class="hh">별 다섯 개 주고<br>한 줄 남겨요</div>
<div class="ss">해먹은 날 그 자리에서<br>별점·한 줄·메모까지</div>
${조각({ 파일: '03-시트-기록-별넷', y: 1150, h: 700, 배율: 0.45, 회전: -2, left: 555, top: 720, z: 6 })}
<img class="sp" src="${스('pjs_02')}" style="left:64px;bottom:110px;width:180px;z-index:9">
<div class="foot">한끼 · 레시피 → 만들었어요</div>`,
}

const br = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const pg = await br.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 })
const 낸것 = []
for (const [이름, 만들기] of Object.entries(시안)) {
  await pg.setContent(만들기(), { waitUntil: 'load' })
  await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(350)
  const p = join(OUT, `소소3-짜임-${이름}.png`)
  await pg.screenshot({ path: p }); 낸것.push(p); console.log('  🎨', 이름)
}
await br.close()
execFileSync('python3', ['-c', `
from PIL import Image
import sys
ps = sys.argv[1:]
ims = [Image.open(p) for p in ps]
w = 660; hs = [int(i.height*w/i.width) for i in ims]
board = Image.new('RGB', (w*len(ims)+20*(len(ims)+1), max(hs)+40), '#ffffff')
x = 20
for i, h in zip(ims, hs):
    board.paste(i.resize((w, h), Image.LANCZOS), (x, 20)); x += w+20
board.save(ps[0].rsplit('/',1)[0] + '/짜임시안-검수판.png')
`, ...낸것], { stdio: 'inherit' })
console.log(`\n🎨 짜임 시안 3 ＋ 검수판 → ${OUT}`)
