// 📣🏠 인스타 캐러셀 「소소한 기능 ② 홈이 알아서」 — 1080×1350 · 8장 (2026-09-07) — ①편 생산기(_판-소소장보기캐러셀-0906)의 짜임 A/B/C 를 그대로 물려받았다
//   재료 = design/promo/소소기능-앱화면-2509/홈 (창업자 백업 2026-09-07 로 찍은 v12.70 실물) · 창업자 「패드 되는 것도 한 줄」 = 8장
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
const 앱폴더 = process.env.APP || join(ROOT, 'design/promo/소소기능-앱화면-2509/홈')
const 창업자 = join(ROOT, 'design/promo/창업자캡처-소소기능-2509')
// 🎬 LAYER=base(스티커 없이) · LAYER=sticker(스티커만 · 투명) — 릴스에서 곰펭을 따로 «둥실» 움직이려고 두 겹으로 뜬다
const LAYER = process.env.LAYER || ''
const OUT = process.env.OUT || ('/tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad/소소2/캐러셀' + (LAYER ? '-' + LAYER : ''))
mkdirSync(OUT, { recursive: true })
const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`
const 폰트 = readFileSync(join(ROOT, 'design/promo/fonts-embed.css'), 'utf8')
const 앱 = (f) => b64(join(앱폴더, `${f}.png`))
const 스 = (k) => b64(join(ROOT, /^(pjs|duos)_/.test(k) ? `src/assets/sharepool/${k}.png` : `src/assets/stickers/photo/${k}.png`))
// 🎨 ②편 팔레트 = «밤의 홈» — 남색 바탕 · 크림 글자 · 노란 알약 (창업자 2026-09-07 「색이랑 배경, 알약색을 좀 다르게」 · 「인스타에 계속 비슷하게 올리면 재미가 없자나」)
//    ①편(크림 바탕·갈색 글자·파란 알약)과 정반대라 피드에서 갈린다. 변수 이름은 ①과 같이 두어 짜임 코드를 그대로 쓴다(갈색 = 제목색 · 파랑 = 알약색 · 크림 = 바탕).
const 갈색 = '#fff3dc', 파랑 = '#f0b429', 크림 = '#1f2a3c', 먹 = '#e8dcc4', 판 = '#2a3750', 알약글자 = '#1f2a3c', 흐림 = 'rgba(255,243,220,.62)'

const 기본 = `${폰트}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;position:relative;font-family:'Jua','Gowun Dodum',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.sp{position:absolute;filter:drop-shadow(0 12px 18px rgba(40,50,60,.22))}
.hh{font-family:'Jua';color:${갈색};letter-spacing:-0.02em}
.ss{font-family:'Gowun Dodum';line-height:1.5}
.foot{position:absolute;left:0;right:0;bottom:36px;text-align:center;font-family:'Gowun Dodum';font-size:24px;color:rgba(255,243,220,.5);z-index:9}
.tag{position:absolute;left:64px;top:64px;z-index:9;font-family:'Jua';font-size:30px;color:${알약글자};background:${파랑};border-radius:999px;padding:8px 26px}
`
// 앱 화면 «조각» — 원본(1170px 폭) 좌표로 잘라 종이 조각처럼. 절대 배치(left/top) 또는 흐름(flow) 둘 다.
// 파일이 '창업자:' 로 시작하면 창업자 캡처(824px 폭 · 갤럭시)에서 잘라 온다 — 원폭 을 같이 준다
const 조각 = ({ 파일, y, h, x = 50, w = 1070, 배율 = 0.6, 회전 = 0, left, top, z = 5, flow = false, r = 18, 원폭 = 1170 }) =>
  `<div class="piece" style="${flow ? 'position:relative;' : `position:absolute;z-index:${z};left:${left}px;top:${top}px;`}width:${Math.round(w * 배율)}px;height:${Math.round(h * 배율)}px;overflow:hidden;border-radius:${r}px;background:#f4efe6;box-shadow:0 16px 34px rgba(40,50,60,.18);${회전 ? `transform:rotate(${회전}deg)` : ''}">
  <img src="${파일.startsWith('창업자:') ? b64(join(창업자, 파일.slice(4))) : 앱(파일)}" style="position:absolute;left:${-x * 배율}px;top:${-y * 배율}px;width:${원폭 * 배율}px"></div>`
const 테이프 = (l, t, r = -5) => `<div class="tape" style="position:absolute;z-index:7;left:${l}px;top:${t}px;width:150px;height:44px;background:rgba(232,196,120,.75);transform:rotate(${r}deg)"></div>`

// ── A 풀블리드 ────────────────────────────────────────────────
const A = ({ no, 그림, 잘라 = 0, 그림폭 = 1080, 머리, 부제, 스티커, 동그라미 = '', 스자리 = 'right:40px;top:560px;width:200px;transform:rotate(6deg)', 꼬리 = '한끼 · 장보기 탭', 태그 = `소소한 기능 ① · ${no}` }) => `<style>${기본}
body{background:${크림}}
.shot{position:absolute;left:0;top:0;width:1080px;height:820px;overflow:hidden}
/* 🔍 그림폭 = 앱 화면을 «키워» 오른쪽 끝의 반쯤 잘린 칩을 틀 밖으로 밀어낸다(창업자 2026-09-07 「칩 수정」)
   ⛔ 키우면 세로도 같이 커지므로 잘라를 «같은 비율로» 환산해야 자리가 안 밀린다 */
.shot img{width:${그림폭}px;display:block;margin-top:-${Math.round(잘라 * 그림폭 / 1080)}px}
.shot::after{content:'';position:absolute;left:0;right:0;bottom:0;height:260px;background:linear-gradient(180deg,rgba(31,42,60,0),${크림} 85%)}
.card{position:absolute;left:60px;right:60px;top:700px;bottom:60px;background:${판};border-radius:48px;box-shadow:0 30px 70px rgba(0,0,0,.35);text-align:center;padding:70px 60px 0;z-index:6}
.no{display:inline-block;background:${파랑};color:${알약글자};font-family:'Jua';font-size:30px;border-radius:999px;padding:8px 26px;margin-bottom:24px}
.hh{font-size:92px;line-height:1.18}
.ss{font-size:34px;color:${흐림};margin-top:26px}</style>
<div class="shot"><img src="${앱(그림)}">${동그라미}</div>
<div class="card"><div class="no">${태그}</div><div class="hh">${머리}</div><div class="ss">${부제}</div><div class="foot">${꼬리}</div></div>
<img class="sp" src="${스(스티커)}" style="${스자리};z-index:9">`

// ⭕ 앱 화면 «그 자리»에 연한 동그라미 — 창업자 2026-09-07 「동그라미라도 하나 쳐주고 (연하게라도)」
//    좌표는 원본 1170px 기준으로 적는다. A 는 1080 폭으로 눕히고 잘라만큼 올리므로 여기서 같이 환산한다.
const 동글 = ({ x, y, w, h, 잘라 = 0, 그림폭 = 1080 }) => {
  const k = 그림폭 / 1170   // ⛔ 그림을 키웠으면 «같은 비율»로 재야 동그라미가 칩에서 벗어나지 않는다
  return `<div style="position:absolute;z-index:8;left:${Math.round(x * k)}px;top:${Math.round(y * k - 잘라 * 그림폭 / 1080)}px;width:${Math.round(w * k)}px;height:${Math.round(h * k)}px;border:6px solid rgba(240,180,41,.6);border-radius:999px;box-shadow:0 0 0 8px rgba(240,180,41,.12)"></div>`
}

// ── B 조각 콜라주 ───────────────────────────────────────────
const B = ({ no, 머리, 부제, 조각들, 스티커, 스자리, 꼬리 = '한끼 · 장보기 탭', 제목y = 470, 태그 = `소소한 기능 ① · ${no}`, 태그자리 = '' }) => `<style>${기본}
body{background:#243044;background-image:radial-gradient(rgba(255,243,220,.13) 1.6px,transparent 1.9px);background-size:28px 28px}
.mid{position:absolute;left:0;right:0;top:${제목y}px;z-index:8;text-align:center}
.hh{font-size:112px;line-height:1.12;text-shadow:0 0 24px #243044,0 0 24px #243044,0 0 40px #243044}
.ss{font-size:34px;color:${흐림};margin-top:24px;text-shadow:0 0 16px #243044,0 0 16px #243044}
.big{position:absolute;right:60px;top:56px;z-index:9;font-family:'Jua';font-size:150px;color:${파랑};opacity:.18;line-height:1}</style>
<div class="tag" style="${태그자리}">${태그}</div>
${조각들}
<div class="mid"><div class="hh">${머리}</div><div class="ss">${부제}</div></div>
<img class="sp" src="${스(스티커)}" style="${스자리};z-index:9">
<div class="foot">${꼬리}</div>`

// ── C 대화 ─────────────────────────────────────────────────
const C = ({ no, 방, 줄들, 머리, 꼬리 = '한끼 · 장보기 탭', 태그 = `소소한 기능 ① · ${no}` }) => `<style>${기본}
body{background:${크림}}
.head{position:absolute;left:0;right:0;top:0;height:150px;background:${판};border-bottom:2px solid rgba(255,243,220,.12);display:flex;align-items:center;justify-content:center;gap:16px;font-family:'Jua';font-size:34px;color:${갈색}}
.head small{font-family:'Gowun Dodum';font-size:24px;color:${흐림}}
.row{position:absolute;left:0;right:0;display:flex;align-items:flex-end;gap:20px;padding:0 50px}
.row.me{justify-content:flex-end}
.bub{max-width:660px;background:${판};border-radius:34px;padding:26px 36px;font-family:'Jua';font-size:38px;line-height:1.35;color:${갈색};box-shadow:0 10px 26px rgba(60,50,40,.1)}
.me .bub{background:${파랑};color:${알약글자};border-bottom-right-radius:8px}
.you .bub{border-bottom-left-radius:8px}
.time{font-family:'Gowun Dodum';font-size:22px;color:rgba(255,243,220,.45);margin:0 8px 6px}
.col{display:flex;flex-direction:column;gap:12px}
.hh{position:absolute;left:0;right:0;bottom:80px;text-align:center;font-size:72px;line-height:1.2;z-index:8}</style>
<div class="head">${방}</div><div class="tag" style="left:auto;right:64px;top:47px">${태그}</div>
${줄들}
<div class="hh">${머리}</div>
<div class="foot">${꼬리}</div>`
const 나 = (top, 글, 시각 = '오후 6:12') => `<div class="row me" style="top:${top}px"><div class="time">${시각}</div><div class="bub">${글}</div></div>`
const 펭 = (top, 안, 얼굴 = 'pjs_05', 보임 = true) => `<div class="row you" style="top:${top}px"><img class="sp" src="${스(얼굴)}" style="position:static;width:${스크기}px;filter:none;${보임 ? '' : 'visibility:hidden'}"><div class="col">${안}</div></div>`
// 🐧 5장에서 말하는 펭펭은 «다른 컷»으로 — 창업자 2026-09-07 「뽑아준거는 골고루 다쓰자」
const 펭2 = (top, 안) => 펭(top, 안, 'pjs_02')
const 말 = (글) => `<div class="bub">${글}</div>`
// 창업자 캡처(1080×2340)를 조각으로 — 폭이 다르다
const 캡처조각 = ({ 파일, y, h, x = 0, w = 1080, 배율 = 0.55, r = 18 }) => `<div style="position:relative;width:${Math.round(w * 배율)}px;height:${Math.round(h * 배율)}px;overflow:hidden;border-radius:${r}px;background:#fff;box-shadow:0 16px 34px rgba(40,50,60,.18)"><img src="${b64(join(창업자, 파일))}" style="position:absolute;left:${-x * 배율}px;top:${-y * 배율}px;width:${1080 * 배율}px"></div>`

// ── 8장 ─────────────────────────────────────────────────────
// 좌표는 전부 원본 3배 px 실측(390×844 폰 · 1170×2532) · 패드 1640×2360 (2026-09-07 창업자 백업으로 찍은 v12.70)
// 🐻🐧 스티커는 «한 값»이다 — 창업자 2026-09-07 「애들 스티커 크기 다 맞춰줘. 너무 크지 않게」
const 스크기 = 200   // ⛔ 홑따옴표 스자리 문자열엔 못 쓴다(글자로 샌다) — 거기선 200px 를 손으로 적는다
const 태그2 = (n) => `소소한 기능 ② · ${n}`
const 장들 = {
  '소소2-01-표지': () => A({ no: 1, 태그: '소소한 기능 ②', 그림: '01-홈-오늘뭐해먹지', 잘라: 0, 머리: '켜면 오늘이<br>차려져 있어요', 부제: '오늘 뭐 해먹지 · 이번 주 제철 · 자주 해먹는<br>홈이 알아서 골라 둬요', 스티커: 'duos_02', 스자리: 'right:20px;top:706px;width:200px;transform:rotate(-4deg)', 꼬리: '한끼 · 홈' }),

  '소소2-02-오늘': () => C({ no: 2, 방: '홈', 태그: 태그2(2), 머리: '오늘 메뉴,<br>냉장고 보고 골라줘요', 꼬리: '한끼 · 홈 → 오늘 뭐 해먹지', 줄들:
    나(180, '냉장고에 뭐 있더라… 오늘 뭐 먹지') +
    펭(310, 말('냉장고 재료로 되는 걸 골라 뒀어') + 조각({ 파일: '01-홈-오늘뭐해먹지', y: 1030, h: 340, x: 40, w: 1090, 배율: 0.58, flow: true })) +
    나(620, '음… 이건 오늘 말고', '오후 6:13') +
    펭(730, 말('「다른 추천」 누르면 다음 것') + 조각({ 파일: '02-홈-다른추천', y: 1030, h: 340, x: 40, w: 1090, 배율: 0.58, flow: true }), 'pjs_05', false) }),

  '소소2-03-제철': () => B({ no: 3, 태그: 태그2(3), 태그자리: 'left:auto;right:60px', 머리: '월요일마다<br>새 레시피', 부제: '이번 주 제철 · 우리집레시피 = 월<br>SNS 요리 = 수 · 배지가 요일을 말해줘요', 스티커: 'pjs_08', 스자리: 'left:30px;top:1070px;width:200px;transform:rotate(-5deg)', 꼬리: '한끼 · 홈 → 이번 주', 제목y: 496, 조각들:
    조각({ 파일: '03-홈-제철우리집', y: 40, h: 330, x: 40, w: 1090, 배율: 0.6, 회전: -5, left: 30, top: 92 }) + 테이프(100, 72) +
    조각({ 파일: '03-홈-제철우리집', y: 1100, h: 330, x: 40, w: 1090, 배율: 0.6, 회전: 4, left: 400, top: 300 }) + 테이프(940, 290, 8) +
    조각({ 파일: '03-홈-제철우리집', y: 440, h: 560, x: 60, w: 1060, 배율: 0.62, 회전: -3, left: 330, top: 902 }) + 테이프(780, 892, 6) }),

  '소소2-04-영상': () => A({ no: 4, 태그: 태그2(4), 그림: '06-상세-영상카드', 잘라: 1090, 머리: '영상 보던 요리,<br>레시피로', 부제: '유튜브·인스타 편은 ▶ 칩이 붙어요<br>원본은 레시피 안에서 바로 열려요', 스티커: 'duos_08', 스자리: 'right:20px;top:600px;width:200px;transform:rotate(5deg)', 꼬리: '한끼 · 홈 → SNS 요리' }),

  '소소2-05-자주': () => C({ no: 5, 방: '홈', 태그: 태그2(5), 머리: '만든 만큼 앞에 와요', 꼬리: '한끼 · 홈 → 자주 해먹는 요리', 줄들:
    나(200, '저번에 해먹은 거 뭐였지') +
    펭2(340, 말('「만들었어요」 누른 게 쌓여') + 조각({ 파일: '05-홈-자주해먹는', y: 20, h: 570, x: 40, w: 1090, 배율: 0.58, flow: true })) +
    나(820, '자주 하는 것만 모아 볼 순 없어?', '오후 6:13') +
    펭(886, 말('레시피 탭 「자주」 칩 하나면 돼') + 조각({ 파일: '09-레시피-자주폴더', y: 495, h: 130, x: 20, w: 1000, 배율: 0.58, flow: true }), 'pjs_05', false) }),

  '소소2-06-검색': () => B({ no: 6, 태그: 태그2(6), 머리: '재료 하나로<br>찾아요', 부제: '「두부」 치면 두부 들어간 요리 18개<br>이름·재료·초성 다 돼요', 스티커: 'pjs_07', 스자리: 'left:30px;top:1070px;width:200px;transform:rotate(4deg)', 꼬리: '한끼 · 홈 오른쪽 위 돋보기', 제목y: 490, 조각들:
    조각({ 파일: '07-검색-두부', y: 210, h: 150, x: 40, w: 1090, 배율: 0.78, 회전: -4, left: 60, top: 160, r: 60 }) + 테이프(120, 145) +
    조각({ 파일: '07-검색-두부', y: 410, h: 110, x: 40, w: 700, 배율: 0.78, 회전: 3, left: 392, top: 330 }) + 테이프(812, 320, 8) +
    조각({ 파일: '07-검색-두부', y: 520, h: 775, x: 50, w: 1070, 배율: 0.5, 회전: -3, left: 272, top: 870 }) + 테이프(660, 855, 6) }),

  '소소2-07-폴더': () => A({ no: 7, 태그: 태그2(7), 그림: '08-레시피-모아보기', 잘라: 300, 그림폭: 1204, 머리: '해볼 것만<br>따로 모아요', 부제: '전체 · 해볼 것 · 자주 · SNS · 내가 만든 폴더<br>요리사 모자 칩 하나면 골라 둔 것만 딱', 스티커: 'gp_gomtb', 스자리: 'right:30px;top:580px;width:200px;transform:rotate(-4deg)', 꼬리: '한끼 · 레시피 탭 → 모아보기', 동그라미: 동글({ x: 335, y: 505, w: 385, h: 128, 잘라: 300, 그림폭: 1204 }) }),

  '소소2-08-마무리': () => `<style>${기본}
body{background:${크림}}
.top{position:absolute;left:0;right:0;top:90px;text-align:center;z-index:3}
.no{display:inline-block;background:${파랑};color:${알약글자};font-family:'Jua';font-size:30px;border-radius:999px;padding:8px 26px;margin-bottom:24px}
.hh{font-size:92px;line-height:1.18}
.ss{font-size:32px;color:${흐림};margin-top:20px}
.pad{position:absolute;left:60px;right:60px;top:530px;height:500px;border-radius:34px;overflow:hidden;background:#fff;box-shadow:0 22px 48px rgba(60,50,40,.16);z-index:5}
.pad img{width:100%;display:block;margin-top:-30px}
.pad::after{content:'';position:absolute;left:0;right:0;bottom:0;height:120px;background:linear-gradient(180deg,rgba(255,255,255,0),#fff 90%)}
.line{position:absolute;left:0;right:0;top:1060px;text-align:center;font-family:'Jua';color:${갈색};font-size:40px;z-index:6}
.line small{display:block;font-family:'Gowun Dodum';font-size:26px;color:${흐림};margin-top:8px}
.pill{position:absolute;left:50%;transform:translateX(-50%);bottom:120px;z-index:6;background:${파랑};color:${알약글자};border-radius:999px;padding:16px 40px;font-size:32px;font-family:'Jua';white-space:nowrap}
.end{position:absolute;left:0;right:0;bottom:50px;z-index:5;text-align:center;font-family:'Jua';color:${갈색};font-size:34px}</style>
<div class="top"><div class="no">${태그2(8)}</div><div class="hh">패드에선<br>한 화면에 다</div><div class="ss">제철·우리집이 나란히 · 가로로 눕혀도 돼요<br>다음 편 = 기록은 내 것</div></div>
<div class="pad"><img src="${앱('10-패드-홈')}"></div>
<div class="line">폰이든 패드든 같은 한끼<small>갤럭시 패드 · 폴드에서도 그대로</small></div>
<img class="sp" src="${스('duos_01')}" style="left:30px;top:1030px;width:${스크기}px;transform:rotate(-3deg);z-index:9">
<div class="pill">▶ Play 스토어에서 「한끼」 검색</div>
<div class="end">오늘도 한 끼 해냈다면, 한끼에서 만나요</div>`,
}

const br = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})

// 🎬 TYPE=1 — 릴스 «쌓이기 ＋ 타자» 프레임 (2026-09-07 · 창업자 "짜임 독특하게 효과도 넣을거 생각해서 해줘")
//   장마다 ①바탕·태그만 → ②조각·말풍선·카드·스티커가 «하나씩 툭» 떨어져 쌓인다(위에서 28px 내려앉는 두 프레임) → ③제목이 커서 달고 한 자씩 찍힌다.
//   프레임과 «머무는 시간»을 list.txt(ffmpeg concat) 로 같이 낸다 — 조립은 design/promo/인스타-2509/조립-소소2릴스.sh
if (process.env.TYPE) {
  const { writeFileSync } = await import('node:fs')
  const p = await br.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 })
  const T = process.env.OUT || '/tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad/소소2/캐러셀-타자'
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
