// 📣🛒 인스타 캐러셀 「소소한 기능 ① 장보기·냉장고」 — 1080×1350 · 8장 (2026-09-06 · 2판)
//
// 📮 창업자 20:13 = *"아직 소개 안 한 것+내가 적은 것 해서 2,3번에 나눠서 올려보자. 종류별로 묶어서"*
// 📮 창업자 22:12 = *"우리 계속 한거랑 너무 디자인이랑 글씨 배치, 비슷한데"* → 짜임 시안 셋(`_판-소소캐러셀-짜임시안-0906.mjs`)
// 📮 창업자 22:5x = *"1번이 좋고 … 기능마다 어울리는 짜임 스타일이 다르잖아 — abc 적절하게 섞어서"*
//    ⛔ 1판(냉장고 문·자석·영수증 종이 · 제목 위-왼쪽 · 폰 오른쪽)은 스토어 v8 과 짜임이 같아서 버렸다(git 에 있다).
//
// 🎨 장마다 짜임을 «기능에 맞게» 고른다
//   A 풀블리드 — 앱 화면이 위를 꽉 채우고 아래 흰 카드에 제목 가운데     → 1 표지 · 4 추천 · 7 쇼핑몰 · 8 마무리
//   B 조각 콜라주 — 폰 틀 없이 앱 «줄»을 종이 조각처럼 · 제목 한가운데    → 3 유통기한 · 6 체크→냉장고
//   C 대화 — 파란 말풍선이 묻고 펭펭·앱 조각이 답한다                    → 2 영수증 · 5 인분
// 🖼 재료 = design/promo/소소기능-앱화면-2509(`_shot-소소장보기-0906.mjs` · 1170×2532) ＋ 창업자 캡처 둘
// 🐧 스티커 = sharepool 정본(pjs_·duos_) ＋ 곰 gp_gom*(정본) — ⛔gp_peng·gp_duo 는 옛 펭펭(README 00절)
//
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/_판-소소장보기캐러셀-0906.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = new URL('..', import.meta.url).pathname
const 앱폴더 = process.env.APP || join(ROOT, 'design/promo/소소기능-앱화면-2509')
const 창업자 = join(ROOT, 'design/promo/창업자캡처-소소기능-2509')
// 🎬 LAYER=base(스티커 없이) · LAYER=sticker(스티커만 · 투명) — 릴스에서 곰펭을 따로 «둥실» 움직이려고 두 겹으로 뜬다
const LAYER = process.env.LAYER || ''
const OUT = process.env.OUT || ('/tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad/소소1/캐러셀' + (LAYER ? '-' + LAYER : ''))
mkdirSync(OUT, { recursive: true })
const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`
const 폰트 = readFileSync(join(ROOT, 'design/promo/fonts-embed.css'), 'utf8')
const 앱 = (f) => b64(join(앱폴더, `${f}.png`))
const 스 = (k) => b64(join(ROOT, /^(pjs|duos)_/.test(k) ? `src/assets/sharepool/${k}.png` : `src/assets/stickers/photo/${k}.png`))
const 갈색 = '#5d3410', 파랑 = '#5b7ea8', 크림 = '#fbf7ef', 먹 = '#3a3f46'

const 기본 = `${폰트}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;position:relative;font-family:'Jua','Gowun Dodum',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.sp{position:absolute;filter:drop-shadow(0 12px 18px rgba(40,50,60,.22))}
.hh{font-family:'Jua';color:${갈색};letter-spacing:-0.02em}
.ss{font-family:'Gowun Dodum';line-height:1.5}
.foot{position:absolute;left:0;right:0;bottom:36px;text-align:center;font-family:'Gowun Dodum';font-size:24px;color:rgba(58,63,70,.45);z-index:9}
.tag{position:absolute;left:64px;top:64px;z-index:9;font-family:'Jua';font-size:30px;color:#fff;background:${파랑};border-radius:999px;padding:8px 26px}
`
// 앱 화면 «조각» — 원본(1170px 폭) 좌표로 잘라 종이 조각처럼. 절대 배치(left/top) 또는 흐름(flow) 둘 다.
// 파일이 '창업자:' 로 시작하면 창업자 캡처(824px 폭 · 갤럭시)에서 잘라 온다 — 원폭 을 같이 준다
const 조각 = ({ 파일, y, h, x = 50, w = 1070, 배율 = 0.6, 회전 = 0, left, top, z = 5, flow = false, r = 18, 원폭 = 1170 }) =>
  `<div class="piece" style="${flow ? 'position:relative;' : `position:absolute;z-index:${z};left:${left}px;top:${top}px;`}width:${Math.round(w * 배율)}px;height:${Math.round(h * 배율)}px;overflow:hidden;border-radius:${r}px;background:#f4efe6;box-shadow:0 16px 34px rgba(40,50,60,.18);${회전 ? `transform:rotate(${회전}deg)` : ''}">
  <img src="${파일.startsWith('창업자:') ? b64(join(창업자, 파일.slice(4))) : 앱(파일)}" style="position:absolute;left:${-x * 배율}px;top:${-y * 배율}px;width:${원폭 * 배율}px"></div>`
const 테이프 = (l, t, r = -5) => `<div class="tape" style="position:absolute;z-index:7;left:${l}px;top:${t}px;width:150px;height:44px;background:rgba(232,196,120,.75);transform:rotate(${r}deg)"></div>`

// ── A 풀블리드 ────────────────────────────────────────────────
const A = ({ no, 그림, 잘라 = 0, 머리, 부제, 스티커, 스자리 = 'right:40px;top:560px;width:330px;transform:rotate(6deg)', 꼬리 = '한끼 · 장보기 탭', 태그 = `소소한 기능 ① · ${no}` }) => `<style>${기본}
body{background:${크림}}
.shot{position:absolute;left:0;top:0;width:1080px;height:820px;overflow:hidden}
.shot img{width:1080px;display:block;margin-top:-${잘라}px}
.shot::after{content:'';position:absolute;left:0;right:0;bottom:0;height:260px;background:linear-gradient(180deg,rgba(251,247,239,0),${크림} 85%)}
.card{position:absolute;left:60px;right:60px;top:700px;bottom:60px;background:#fff;border-radius:48px;box-shadow:0 30px 70px rgba(60,50,40,.14);text-align:center;padding:70px 60px 0;z-index:6}
.no{display:inline-block;background:${파랑};color:#fff;font-family:'Jua';font-size:30px;border-radius:999px;padding:8px 26px;margin-bottom:24px}
.hh{font-size:92px;line-height:1.18}
.ss{font-size:34px;color:rgba(58,63,70,.7);margin-top:26px}</style>
<div class="shot"><img src="${앱(그림)}"></div>
<div class="card"><div class="no">${태그}</div><div class="hh">${머리}</div><div class="ss">${부제}</div><div class="foot">${꼬리}</div></div>
<img class="sp" src="${스(스티커)}" style="${스자리};z-index:9">`

// ── B 조각 콜라주 ───────────────────────────────────────────
const B = ({ no, 머리, 부제, 조각들, 스티커, 스자리, 꼬리 = '한끼 · 장보기 탭', 제목y = 470 }) => `<style>${기본}
body{background:#eef1ea;background-image:radial-gradient(rgba(93,52,16,.07) 1.6px,transparent 1.9px);background-size:28px 28px}
.mid{position:absolute;left:0;right:0;top:${제목y}px;z-index:8;text-align:center}
.hh{font-size:112px;line-height:1.12;text-shadow:0 0 24px #eef1ea,0 0 24px #eef1ea,0 0 40px #eef1ea}
.ss{font-size:34px;color:rgba(58,63,70,.7);margin-top:24px;text-shadow:0 0 16px #eef1ea,0 0 16px #eef1ea}
.big{position:absolute;right:60px;top:56px;z-index:9;font-family:'Jua';font-size:150px;color:${파랑};opacity:.18;line-height:1}</style>
<div class="tag">소소한 기능 ① · ${no}</div>
${조각들}
<div class="mid"><div class="hh">${머리}</div><div class="ss">${부제}</div></div>
<img class="sp" src="${스(스티커)}" style="${스자리};z-index:9">
<div class="foot">${꼬리}</div>`

// ── C 대화 ─────────────────────────────────────────────────
const C = ({ no, 방, 줄들, 머리, 꼬리 = '한끼 · 장보기 탭' }) => `<style>${기본}
body{background:#f6f1e8}
.head{position:absolute;left:0;right:0;top:0;height:150px;background:#fff;border-bottom:2px solid rgba(93,52,16,.1);display:flex;align-items:center;justify-content:center;gap:16px;font-family:'Jua';font-size:34px;color:${갈색}}
.head small{font-family:'Gowun Dodum';font-size:24px;color:rgba(58,63,70,.5)}
.row{position:absolute;left:0;right:0;display:flex;align-items:flex-end;gap:20px;padding:0 50px}
.row.me{justify-content:flex-end}
.bub{max-width:660px;background:#fff;border-radius:34px;padding:26px 36px;font-family:'Jua';font-size:38px;line-height:1.35;color:${갈색};box-shadow:0 10px 26px rgba(60,50,40,.1)}
.me .bub{background:${파랑};color:#fff;border-bottom-right-radius:8px}
.you .bub{border-bottom-left-radius:8px}
.time{font-family:'Gowun Dodum';font-size:22px;color:rgba(58,63,70,.45);margin:0 8px 6px}
.col{display:flex;flex-direction:column;gap:12px}
.hh{position:absolute;left:0;right:0;bottom:80px;text-align:center;font-size:72px;line-height:1.2;z-index:8}</style>
<div class="head">${방}</div><div class="tag" style="left:auto;right:64px;top:47px">소소한 기능 ① · ${no}</div>
${줄들}
<div class="hh">${머리}</div>
<div class="foot">${꼬리}</div>`
const 나 = (top, 글, 시각 = '오후 6:12') => `<div class="row me" style="top:${top}px"><div class="time">${시각}</div><div class="bub">${글}</div></div>`
const 펭 = (top, 안, 얼굴 = 'pjs_05', 보임 = true) => `<div class="row you" style="top:${top}px"><img class="sp" src="${스(얼굴)}" style="position:static;width:150px;filter:none;${보임 ? '' : 'visibility:hidden'}"><div class="col">${안}</div></div>`
const 말 = (글) => `<div class="bub">${글}</div>`
// 창업자 캡처(1080×2340)를 조각으로 — 폭이 다르다
const 캡처조각 = ({ 파일, y, h, x = 0, w = 1080, 배율 = 0.55, r = 18 }) => `<div style="position:relative;width:${Math.round(w * 배율)}px;height:${Math.round(h * 배율)}px;overflow:hidden;border-radius:${r}px;background:#fff;box-shadow:0 16px 34px rgba(40,50,60,.18)"><img src="${b64(join(창업자, 파일))}" style="position:absolute;left:${-x * 배율}px;top:${-y * 배율}px;width:${1080 * 배율}px"></div>`

// ── 8장 ─────────────────────────────────────────────────────
// 좌표는 전부 원본 3배 px 실측(390×844 폰 · 1170×2532)
const 장들 = {
  '소소1-01-표지': () => A({ no: 1, 태그: '소소한 기능 ①', 그림: '01-냉장고추천', 잘라: 0, 머리: '장 봐 오면<br>그다음은 한끼가', 부제: '영수증 → 냉장고 → 오늘 메뉴 → 장보기까지<br>장보기 탭 하나에 다 있어요', 스티커: 'duos_04', 스자리: 'right:24px;top:616px;width:340px;transform:rotate(-4deg)' }),

  '소소1-02-영수증': () => C({ no: 2, 방: '냉장고', 머리: '영수증 찍으면 재료가 쏙', 꼬리: '한끼 · 장보기 탭 → 냉장고 → 영수증', 줄들:
    나(200, '장 봐 왔는데… 이거 다 하나씩 넣어?') +
    펭(330, 말('아니, 영수증만 찍어') + 캡처조각({ 파일: '소소-영수증-품목만-2026-09-06.png', y: 150, h: 400, x: 150, w: 780, 배율: 0.6 })) +
    나(720, '오 7개 찾았네', '오후 6:13') +
    펭(850, 말('아닌 건 체크만 풀면 돼') + 캡처조각({ 파일: '소소-영수증에서찾은재료-2026-09-06.png', y: 1090, h: 300, x: 60, w: 960, 배율: 0.55 }), 'pjs_07') }),

  // 🔔 2026-09-06 23:38 창업자 실물 캡처(알림 기능) = 장보기 탭 빨간 점 · 냉장고 탭 「2」 · D-3부터 표시. ⛔실제 푸시 알림은 안 된다(창업자 *"실제로 알림 울리는 건 안된데"*) — 「울린다」고 쓰지 않는다
  '소소1-03-유통기한': () => B({ no: 3, 머리: '유통기한은<br>앱이 세요', 부제: 'D-3부터 색으로 표시 · 가까운 것부터<br>앱 켜면 냉장고 탭에 개수 · 장보기 탭에 빨간 점', 스티커: 'pjs_08', 스자리: 'left:30px;top:1030px;width:280px;transform:rotate(-5deg)', 꼬리: '한끼 · 장보기 탭 → 냉장고', 조각들:
    조각({ 파일: '창업자:소소-알림-냉장고Dday-2026-09-06.png', 원폭: 824, x: 0, w: 824, y: 963, h: 148, 배율: 0.86, 회전: -6, left: 40, top: 190 }) + 테이프(110, 170) +
    조각({ 파일: '창업자:소소-알림-냉장고Dday-2026-09-06.png', 원폭: 824, x: 0, w: 824, y: 1112, h: 150, 배율: 0.86, 회전: 4, left: 340, top: 310 }) + 테이프(930, 300, 8) +
    조각({ 파일: '창업자:소소-알림-장보기탭-2026-09-06.png', 원폭: 824, x: 30, w: 764, y: 200, h: 112, 배율: 0.86, 회전: -3, left: 100, top: 870, r: 60 }) + 테이프(140, 840) +
    조각({ 파일: '창업자:소소-알림-장보기탭-2026-09-06.png', 원폭: 824, x: 0, w: 824, y: 1712, h: 118, 배율: 0.86, 회전: 5, left: 360, top: 1035 }) + 테이프(910, 1020, 6) }),
  '소소1-04-추천': () => A({ no: 4, 그림: '01-냉장고추천', 잘라: 690, 머리: '냉장고 열면<br>오늘 메뉴가', 부제: '넣어둔 재료로 만들 수 있는 요리를 골라줘요<br>「가진 재료 4개」 — 뭘 더 사야 하는지도', 스티커: 'gp_gomtb', 스자리: 'right:24px;top:600px;width:300px;transform:rotate(5deg)', 꼬리: '한끼 · 장보기 탭 → 냉장고' }),

  '소소1-05-인분': () => C({ no: 5, 방: '버섯 솥밥', 머리: '인분 바꾸면 재료도 따라와요', 꼬리: '한끼 · 레시피 → 재료', 줄들:
    나(200, '손님 와서 4인분 해야 하는데<br>재료 다시 계산해야 해?') +
    펭(370, 말('＋ 두 번만 눌러') + 조각({ 파일: '05-인분조절', y: 2180, h: 130, x: 40, w: 900, 배율: 0.66, flow: true, r: 14 })) +
    나(700, '장 볼 것도 적어야 하는데', '오후 6:13') +
    펭(830, 말('그건 「장보기 담기」 한 번') + 조각({ 파일: '05-인분조절', y: 2070, h: 120, x: 720, w: 400, 배율: 0.75, flow: true, r: 14 }) + 말('4인분 양으로 리스트에 들어가'), 'pjs_01') }),

  '소소1-06-체크': () => B({ no: 6, 머리: '샀으면 체크,<br>냉장고로 쏙', 부제: '지우는 게 아니라 냉장고에 넣어 둬요', 스티커: 'pjs_07', 스자리: 'left:30px;top:1030px;width:280px;transform:rotate(4deg)', 꼬리: '한끼 · 장보기 탭 → 장보기 리스트', 조각들:
    조각({ 파일: '03-장보기체크', y: 0, h: 115, x: 0, w: 1170, 배율: 0.7, 회전: -2, left: 130, top: 150, r: 26 }) +
    조각({ 파일: '03-장보기체크', y: 1040, h: 200, 배율: 0.62, 회전: 4, left: 60, top: 300 }) + 테이프(560, 270, 3) +
    조각({ 파일: '03-장보기체크', y: 1250, h: 200, x: 0, w: 1170, 배율: 0.58, 회전: -3, left: 300, top: 820 }) + 테이프(800, 805, 7) +
    조각({ 파일: '03-장보기체크', y: 1460, h: 200, 배율: 0.62, 회전: 5, left: 140, top: 990 }) + 테이프(620, 985, -6) }),

  '소소1-07-쇼핑몰': () => A({ no: 7, 그림: '04-쇼핑몰', 잘라: 1040, 머리: '사러가기는<br>늘 쓰던 몰로', 부제: '쿠팡·컬리·이마트몰… 깔려 있으면 바로 열려요<br>줄마다 「사러가기」 · 몰은 편집에서 내 걸로', 스티커: 'pjs_05', 스자리: 'right:30px;top:672px;width:300px;transform:rotate(-4deg)', 꼬리: '한끼 · 장보기 탭 → 쇼핑몰 바로가기' }),

  '소소1-08-마무리': () => `<style>${기본}
body{background:${크림}}
.top{position:absolute;left:0;right:0;top:110px;text-align:center;z-index:3}
.no{display:inline-block;background:${파랑};color:#fff;font-family:'Jua';font-size:30px;border-radius:999px;padding:8px 26px;margin-bottom:24px}
.hh{font-size:92px;line-height:1.18}
.ss{font-size:32px;color:rgba(58,63,70,.7);margin-top:20px}
.card{position:absolute;left:80px;right:80px;top:500px;background:#fff;border-radius:40px;padding:44px 48px;box-shadow:0 22px 48px rgba(60,50,40,.14);z-index:5}
.step{display:flex;align-items:center;gap:22px;margin:0 0 20px}
.step .d{width:60px;height:60px;border-radius:50%;background:${파랑};color:#fff;font-family:'Jua';font-size:30px;display:flex;align-items:center;justify-content:center;flex:none}
.step b{font-family:'Jua';color:${갈색};font-size:38px;font-weight:400} .step small{display:block;font-family:'Gowun Dodum';color:rgba(58,63,70,.65);font-size:25px;margin-top:2px}
.pill{position:absolute;left:50%;transform:translateX(-50%);bottom:130px;z-index:6;background:${갈색};color:#fff7ea;border-radius:999px;padding:16px 40px;font-size:32px;font-family:'Jua';white-space:nowrap}
.end{position:absolute;left:0;right:0;bottom:56px;z-index:5;text-align:center;font-family:'Jua';color:${갈색};font-size:36px}</style>
<div class="top"><div class="no">소소한 기능 ① · 8</div><div class="hh">장보기 탭 하나로<br>한 바퀴</div><div class="ss">다음 편 = 홈이 알아서 · 기록은 내 것</div></div>
<div class="card">
<div class="step"><div class="d">1</div><div><b>영수증 찍기</b><small>냉장고 → 영수증 · 재료가 들어가요</small></div></div>
<div class="step"><div class="d">2</div><div><b>유통기한 · 오늘 메뉴</b><small>D-day 표 · 가진 재료로 만들 수 있어요</small></div></div>
<div class="step"><div class="d">3</div><div><b>장보기 담기 → 체크</b><small>인분 맞춰 담고, 사면 체크 · 냉장고로</small></div></div>
<div class="step" style="margin:0"><div class="d">4</div><div><b>사러가기</b><small>늘 쓰던 쇼핑몰로 바로</small></div></div></div>
<img class="sp" src="${스('duos_01')}" style="left:20px;top:990px;width:280px;transform:rotate(-3deg);z-index:9">
<div class="pill">▶ Play 스토어에서 「한끼」 검색</div>
<div class="end">오늘도 한 끼 해냈다면, 한끼에서 만나요</div>`,
}

const br = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// 🎬 TYPE=1 — 릴스 «쌓이기 ＋ 타자» 프레임 (2026-09-07 · 창업자 "짜임 독특하게 효과도 넣을거 생각해서 해줘")
//   장마다 ①바탕·태그만 → ②조각·말풍선·카드·스티커가 «하나씩 툭» 떨어져 쌓인다(위에서 28px 내려앉는 두 프레임) → ③제목이 커서 달고 한 자씩 찍힌다.
//   프레임과 «머무는 시간»을 list.txt(ffmpeg concat) 로 같이 낸다 — 조립은 design/promo/인스타-2509/조립-소소3릴스-타자.sh
if (process.env.TYPE) {
  const { writeFileSync } = await import('node:fs')
  const p = await br.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 })
  const T = process.env.OUT || '/tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad/소소1/캐러셀-타자'
  const TICK = 0.085
  for (const [n, f] of Object.entries(장들)) {
    const D = `${T}/${n}`; mkdirSync(D, { recursive: true })
    const list = []; let k = 0
    const 찍 = async (dur) => { const file = `${D}/f${String(k++).padStart(3, '0')}.png`; await p.screenshot({ path: file }); list.push(`file '${file}'\nduration ${dur.toFixed(3)}`) }
    await p.setContent(`<!doctype html><meta charset="utf-8">${f()}<style>.ch.off{visibility:hidden}.cur{display:inline-block;width:.09em;height:.86em;background:${파랑};vertical-align:-.06em;margin-left:.05em;border-radius:3px}.hid{visibility:hidden!important}</style>`)
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300)
    // 쌓일 것들(문서 순서) — 테이프는 바로 앞 조각에 붙어 같이 나온다
    const N = await p.evaluate(() => {
      const h = document.querySelector('.hh'); let i = 0, out = ''
      for (const part of h.innerHTML.split(/(<br>)/)) { if (part === '<br>') { out += '<br>'; continue } for (const ch of part) out += `<span class="ch off" data-i="${i++}">${ch}</span>` }
      h.innerHTML = out
      const els = [...document.querySelectorAll('.shot, .card, .row, .piece, .tape, .mid, .pad, .line, .pill, .end, .sp')].filter((e) => !e.closest('.row') || e.classList.contains('row'))
      els.forEach((e, j) => { e.dataset.step = j; e.classList.add('hid') })
      return i
    })
    await 찍(0.35)   // 빈 판 — 「지금부터 쌓인다」
    const steps = await p.evaluate(() => [...document.querySelectorAll('[data-step]')].map((e) => [Number(e.dataset.step), e.classList.contains('tape')]))
    for (const [j, tape] of steps) {
      await p.evaluate((j) => { const e = document.querySelector(`[data-step="${j}"]`); e.classList.remove('hid'); e.style.translate = '0 -28px'; e.style.opacity = '.55' }, j)
      if (!tape) await 찍(0.07)
      await p.evaluate((j) => { const e = document.querySelector(`[data-step="${j}"]`); e.style.translate = ''; e.style.opacity = '' }, j)
      await 찍(tape ? 0.06 : 0.2)
    }
    for (let c = 0; c <= N; c++) {
      await p.evaluate((c) => {
        const h = document.querySelector('.hh'); h.querySelector('.cur')?.remove()
        const chs = [...h.querySelectorAll('.ch')]; chs.forEach((x, i) => x.classList.toggle('off', i >= c))
        const cur = document.createElement('span'); cur.className = 'cur'; c ? chs[c - 1].after(cur) : h.prepend(cur)
      }, c)
      await 찍(c === 0 ? 0.3 : TICK)
    }
    const last = list.length - 1
    await p.evaluate(() => document.querySelector('.hh .cur')?.remove()); await 찍(0.3)
    list.push(list[last].replace(/duration .*/, 'duration 0.3')); list.push(list[list.length - 2].replace(/duration .*/, 'duration 0.3'))   // 커서 깜빡 두 번
    await 찍(1.2)
    const total = list.reduce((a, l) => a + Number(l.match(/duration ([\d.]+)/)[1]), 0)
    writeFileSync(`${D}/list.txt`, list.join('\n') + '\n' + list[list.length - 1].split('\n')[0] + '\n')
    console.log('  🎬', n, `${steps.length}단 · ${N}자 · ${total.toFixed(2)}초`)
  }
  await br.close(); process.exit(0)
}

const p = await br.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 })
const names = []
for (const [n, f] of Object.entries(장들)) {
  const 겹 = LAYER === 'base' ? '<style>.sp{visibility:hidden!important}</style>' : LAYER === 'sticker' ? '<style>body,body *{visibility:hidden!important;background:transparent!important;box-shadow:none!important}.sp{visibility:visible!important}</style>' : ''
  await p.setContent(`<!doctype html><meta charset="utf-8">${f()}${겹}`)
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300)
  await p.screenshot({ path: `${OUT}/${n}.png`, omitBackground: LAYER === 'sticker' }); names.push(n); console.log('  ✅', n)
}
await br.close()
execFileSync('python3', ['-c', `from PIL import Image
names=${JSON.stringify(names)}
w=500; h=625
sh=Image.new('RGB',(w*4+50,h*2+30),'white')
for i,n in enumerate(names):
  sh.paste(Image.open('${OUT}/'+n+'.png').resize((w,h)),(10+(i%4)*(w+10),10+(i//4)*(h+10)))
sh.save('${OUT}/캐러셀-검수판.png')`])
console.log(`\n📸 8장 ＋ 검수판 → ${OUT}`)
