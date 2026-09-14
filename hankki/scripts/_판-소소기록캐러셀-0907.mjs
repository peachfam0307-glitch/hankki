// 📔📣 인스타 캐러셀 「소소한 기능 ③ 기록은 내 것」 — 1080×1350 · 8장 (2026-09-07)
//
// 📮 창업자 2026-09-07 = *"섞자."* — 짜임 시안 D·E·F 중 하나가 아니라 «장마다 어울리는 것»으로 섞는다.
//    ＋ *"배치하고, 애들 크기잘 맞춰서(카롱도 넣어도 돼) 등장했으니까."*
//
// 🎨 짜임 (시안 _판-소소기록-짜임시안-0907.mjs 에서 그대로 물려받았다)
//   D 스크랩북 — 공책 줄 위에 캡처를 삐뚤게 붙이고 손글씨 주석·동그라미  → 2 별점 · 3 메모 · 5 일기
//   E 이어지는 띠 — 팥죽색 띠가 비스듬히 가로지르고 다음 장을 부른다     → 1 표지 · 6 꾸미기 · 8 마무리
//   F 반반 대비 — 위 「그냥 두면」 ↔ 아래 「한끼에선」                     → 4 요리모드 · 7 백업
//
// 🔤 글꼴 ①② = Jua＋GowunDodum → ③ = **Gaegu＋NanumPen**(손글씨) · 🎨 색 ①크림밝음 ②남색어둠 → ③ 세이지 종이(중간톤)
//
// 🦫 카롱 등장 — ka_g02·ka_g03·ka_c02·ka_c04(솔로 4컷)는 Stickers.jsx:1926 에서 season autumn · from 2026-09-01 로 이미 열렸다.
// 🐻🐧🦫 **크기는 «폭»이 아니라 «높이»로 맞춘다** — pjs 427×588 · duos 620×601 · ka 489×611.
//    폭으로 맞추면 듀오컷 캐릭터가 3분의 2로 작아진다(②편에서 창업자가 「크기도 들쭉날쭉이야」로 잡은 원인).
//
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/_판-소소기록캐러셀-0907.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = new URL('..', import.meta.url).pathname
const 앱폴더 = process.env.APP || join(ROOT, 'design/promo/소소기능-앱화면-2509/기록')
const LAYER = process.env.LAYER || ''
const OUT = process.env.OUT || ('/tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad/소소3/캐러셀' + (LAYER ? '-' + LAYER : ''))
mkdirSync(OUT, { recursive: true })
const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`
const 폰트 = readFileSync(join(ROOT, 'design/promo/fonts-embed.css'), 'utf8')
const 앱 = (f) => b64(join(앱폴더, `${f}.png`))
// 🦫 ka_* 는 앱 스티커 폴더(photo)에 있다 — pjs_·duos_·gp_ 는 sharepool 정본
const 스 = (k) => b64(join(ROOT, /^(pjs|duos|gp|gom|gn|peng|pn|duo|sm|gc|pc|kc|tc)_/.test(k) ? `src/assets/sharepool/${k}.png` : `src/assets/stickers/photo/${k}.png`))
// 🎬 창업자 장면 컷 — 배경이 통째로 그려진 네모. 스크랩북 짜임에 «사진처럼» 붙인다
const 장면 = (f) => b64(join(ROOT, `docs/stickers/펭펭카롱-창업자-2026-09-07/장면/${f}.png`))
const 사진 = ({ 파일, w = 300, 회전 = 0, left, top, z = 6 }) =>
  `<div class="piece" style="position:absolute;z-index:${z};left:${left}px;top:${top}px;width:${w}px;height:${w}px;overflow:hidden;border:12px solid #fff;border-bottom-width:44px;background:#fff;box-shadow:0 14px 30px rgba(50,60,52,.26);transform:rotate(${회전}deg)">
  <img src="${장면(파일)}" style="width:100%;display:block"></div>`

// 🎨 ③ 팔레트 = «오래 쓴 노트» — 세이지 종이 · 먹빛 글자 · 팥죽색 포인트
const 종이 = '#e7ebe0', 먹 = '#38403a', 팥 = '#9c4a3c', 크림 = '#fbf9f3', 흐림 = '#6b746c'
const 스높이 = 200          // 🐻🐧🦫 «높이» 한 값 — 캐릭터가 같은 크기로 보인다
const 넓높이 = 250          // 🦫 가로형(kp_ 카롱＋펭펭) — 캐릭터 크기가 세로형과 같아 보이는 값
const 곰높이 = 186          // gp_gom* 만 원본이 배경 여백 없이 꽉 차서 조금 낮춘다

const 기본 = `${폰트}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;position:relative;font-family:'Gaegu','NanumPen',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.sp{position:absolute;height:${스높이}px;width:auto;filter:drop-shadow(0 12px 18px rgba(40,50,60,.22))}
.sp.gom{height:${곰높이}px}
.sp.wide{height:${넓높이}px}   /* 🦫 kp_* 는 «가로로 누운» 컷이라 높이를 같게 맞추면 캐릭터가 작아 보인다 */
.hh{font-family:'Gaegu';color:${먹};letter-spacing:-0.01em;font-weight:700}
.ss{font-family:'NanumPen';line-height:1.45;color:${흐림}}
.tape{position:absolute;background:rgba(190,180,150,.55);z-index:7}
.tag{position:absolute;left:60px;top:56px;z-index:9;font-family:'Gaegu';font-weight:700;font-size:34px;color:${크림};background:${팥};border-radius:6px;padding:6px 22px;transform:rotate(-2deg)}
.foot{position:absolute;left:64px;bottom:52px;font-family:'NanumPen';font-size:32px;color:#7d867e;z-index:9}
`
const 줄무늬 = `background-image:repeating-linear-gradient(180deg,transparent 0 57px,rgba(90,105,95,.16) 57px 59px);`
const 모눈 = `background-image:linear-gradient(rgba(90,105,95,.11) 1px,transparent 1px),linear-gradient(90deg,rgba(90,105,95,.11) 1px,transparent 1px);background-size:54px 54px;`

// 앱 화면 조각 — 원본 1170×2532 좌표로 잘라 온다 (자를 자리는 검수판으로 «눈으로» 보고 적었다)
const 조각 = ({ 파일, y, h, x = 0, w = 1170, 배율 = 0.6, 회전 = 0, left, top, z = 5, r = 10, 테 = true }) =>
  `<div class="piece" style="position:absolute;z-index:${z};left:${left}px;top:${top}px;width:${Math.round(w * 배율)}px;height:${Math.round(h * 배율)}px;overflow:hidden;border-radius:${r}px;background:#fff;${테 ? 'border:10px solid #fff;' : ''}box-shadow:0 14px 30px rgba(50,60,52,.22);transform:rotate(${회전}deg)">
  <img src="${앱(파일)}" style="position:absolute;left:${-x * 배율}px;top:${-y * 배율}px;width:${Math.round(1170 * 배율)}px"></div>`
const 테이프 = (l, t, w = 170, r = -6) => `<div class="tape" style="left:${l}px;top:${t}px;width:${w}px;height:42px;transform:rotate(${r}deg)"></div>`
const 손동그라미 = (l, t, w, h) => `<svg style="position:absolute;z-index:8;left:${l}px;top:${t}px" width="${w}" height="${h}"><ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2 - 8}" ry="${h / 2 - 8}" fill="none" stroke="${팥}" stroke-width="7" stroke-linecap="round" stroke-dasharray="1400 40" transform="rotate(-3 ${w / 2} ${h / 2})"/></svg>`
const 손화살표 = (l, t, w, h, 뒤집 = false) => `<svg style="position:absolute;z-index:8;left:${l}px;top:${t}px${뒤집 ? ';transform:scaleX(-1)' : ''}" width="${w}" height="${h}"><path d="M6 ${h - 10} C ${w * 0.3} ${h * 0.75}, ${w * 0.55} ${h * 0.5}, ${w - 22} 16" fill="none" stroke="${팥}" stroke-width="6" stroke-linecap="round"/><path d="M${w - 46} 20 L${w - 16} 12 L${w - 26} 44" fill="none" stroke="${팥}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const 태그3 = (n) => `소소한 기능 ③ · ${n}`

// ── D 스크랩북 ────────────────────────────────────────────────
const D = ({ no, 머리, 조각들, 메모 = '', 스티커, 스자리, 꼬리, 제목y = 148, 제목크기 = 92 }) => `<style>${기본}
body{background:${종이};${줄무늬}}
.hh{position:absolute;left:64px;top:${제목y}px;font-size:${제목크기}px;line-height:1.12;z-index:9;transform:rotate(-1.5deg)}
.memo{position:absolute;font-family:'NanumPen';font-size:44px;color:${팥};z-index:9;line-height:1.3}</style>
<div class="tag">${태그3(no)}</div>
<div class="hh">${머리}</div>
${조각들}${메모}
<img class="sp${/^gp_/.test(스티커) ? ' gom' : /^(kp|tc)_/.test(스티커) ? ' wide' : ''}" src="${스(스티커)}" style="${스자리};z-index:9">
<div class="foot">${꼬리}</div>`

// ── E 이어지는 띠 ─────────────────────────────────────────────
const E = ({ no, 머리, 띠글, 부제, 조각들, 스티커, 스자리, 꼬리, 다음 = '넘겨 보세요 ⟶', 다음위 = 'right:56px;bottom:64px', 부제폭 = 640, 띠top = 330 }) => `<style>${기본}
body{background:${크림}}
.band{position:absolute;left:-40px;top:${띠top}px;width:1200px;height:520px;background:${팥};transform:rotate(-6deg);z-index:2}
.band2{position:absolute;left:-40px;top:${띠top + 540}px;width:1200px;height:26px;background:${종이};transform:rotate(-6deg);z-index:3}
.hh{position:absolute;left:70px;top:118px;font-size:92px;line-height:1.1;z-index:9}
.on{position:absolute;left:70px;top:${띠top + 90}px;width:520px;font-size:66px;line-height:1.2;color:${크림};z-index:9;transform:rotate(-6deg)}
.ss{position:absolute;left:70px;top:${띠top + 630}px;width:${부제폭}px;font-size:44px;z-index:9}
.next{position:absolute;${다음위};font-family:'NanumPen';font-size:38px;color:${팥};z-index:9}</style>
<div class="tag">${태그3(no)}</div>
<div class="band"></div><div class="band2"></div>
<div class="hh">${머리}</div>
<div class="on">${띠글}</div>
${조각들}
<div class="ss">${부제}</div>
${다음 ? `<div class="next">${다음}</div>` : ''}
<img class="sp${/^gp_/.test(스티커) ? ' gom' : /^(kp|tc)_/.test(스티커) ? ' wide' : ''}" src="${스(스티커)}" style="${스자리};z-index:9">
<div class="foot">${꼬리}</div>`

// ── F 반반 대비 ───────────────────────────────────────────────
//   ⭐ 위 칸을 560px 로 잡아 인스타 미리보기(정사각 잘림)에서도 두 칸이 다 보인다
const F = ({ no, 위글, 머리, 부제, 조각들, 스티커, 스자리, 꼬리, 제목크기 = 84, 부제폭 = 480 }) => `<style>${기본}
body{background:${크림}}
.up{position:absolute;left:0;top:0;width:1080px;height:560px;background:#d8d4cb;overflow:hidden}
.dn{position:absolute;left:0;top:560px;width:1080px;height:790px;background:${종이};${모눈}overflow:hidden}
.cut{position:absolute;left:0;top:548px;width:1080px;height:26px;background:${팥};z-index:8}
.lab{position:absolute;font-family:'Gaegu';font-weight:700;font-size:40px;z-index:9;border-radius:6px;padding:6px 20px}
.hh{position:absolute;left:64px;top:632px;font-size:${제목크기}px;line-height:1.12;z-index:9}
.ss{position:absolute;left:64px;top:880px;width:${부제폭}px;font-size:42px;z-index:9}
.gray{position:absolute;left:64px;top:250px;width:640px;font-family:'NanumPen';font-size:52px;color:#7b766c;z-index:9;line-height:1.3}</style>
<div class="tag">${태그3(no)}</div>
<div class="up"></div><div class="dn"></div><div class="cut"></div>
<div class="lab" style="right:56px;top:56px;background:#b9b3a7;color:#fff">그냥 두면</div>
<div class="lab" style="right:56px;top:606px;background:${팥};color:${크림}">한끼에선</div>
<div class="gray">${위글}</div>
<div class="hh">${머리}</div>
<div class="ss">${부제}</div>
${조각들}
<img class="sp${/^gp_/.test(스티커) ? ' gom' : /^(kp|tc)_/.test(스티커) ? ' wide' : ''}" src="${스(스티커)}" style="${스자리};z-index:9">
<div class="foot">${꼬리}</div>`

// ── 8장 ───────────────────────────────────────────────────────
//   ⭐ 자를 자리는 전부 «재서» 넣었다(줄 경계 실측 ＋ 검수 스트립으로 눈으로 확인) — 글자 중간에서 안 끊긴다
//   ⭐ 조각은 left ＋ 폭 ≤ 1040 으로 둔다 — ②편에서 화면 밖으로 나가 반쯤 잘렸던 자리다
//   📮 창업자 2026-09-07 = *"제목도 ai문체말고 직관적이고 정확한 표현으로"* ＋ *"말을 예쁘게 하되 명확하게"*
//      ⛔「내 것은 내가 들고 가요」 같은 «뜻이 안 서는» 제목은 버린다 → 「폰을 바꿔도 그대로 옮겨가요」
const 장들 = {
  // 1 표지 — E
  '소소3-01-표지': () => E({ no: 1, 머리: '해먹은 건<br>기록으로 남아요', 띠글: '별점 · 한 줄 ·<br>사진 · 일기까지', 부제: '「만들었어요」 한 번이면 그날이 남아요<br>달력에 쌓이고, 백업으로 안 잃어요',
    조각들: 조각({ 파일: '03-시트-기록-별넷', y: 1120, h: 880, 배율: 0.40, 회전: -6, left: 560, top: 400, z: 6, 테: false, r: 22 }),
    스티커: 'tc_01', 스자리: 'right:44px;bottom:170px', 다음위: 'right:56px;bottom:64px', 꼬리: '한끼 · 레시피 → 만들었어요' }),

  // 2 별점·한 줄 — D
  '소소3-02-별점': () => D({ no: 2, 머리: '별점 주고<br>한 줄 적어요',
    // ⛔ 시트를 «둘로 쪼개» 붙였더니 실제에 없는 양식처럼 보였다(창업자 「요리기록남기기도 저 양식이 아니었어」)
    //    → 제목부터 저장하기까지 «한 덩어리»로 붙인다. 앱에서 보는 그대로다.
    조각들: 조각({ 파일: '03-시트-기록-별넷', y: 1120, h: 1300, 배율: 0.50, 회전: -2.5, left: 70, top: 420 }) + 테이프(120, 400),
    // ⭕ 동그라미는 «별점 그 자리»에 — 조각 top 430 ＋ (별줄 1444 − 자른 1120) × 0.56 ≒ 611 (전엔 사진칸을 감쌌다)
    메모: 손동그라미(215, 600, 300, 96) + `<div class="memo" style="left:790px;top:600px;transform:rotate(4deg)">여기 눌러<br>별 주기</div>` + 손화살표(566, 644, 150, 120, true),
    스티커: 'pjs_01', 스자리: 'right:56px;bottom:150px', 꼬리: '한끼 · 레시피 상세 → 포스트잇 누르기' }),

  // 3 메모 — D
  '소소3-03-메모': () => D({ no: 3, 머리: '레시피에<br>내 메모를 적어요',
    // ⛔ 여기에도 별점 시트 «조각»을 붙였다가 뺐다 — 3장 주인공은 포스트잇이고, 쪼갠 조각은 양식을 헷갈리게 한다
    조각들: 조각({ 파일: '04-상세-포스트잇', y: 985, h: 585, 배율: 0.66, 회전: -2, left: 60, top: 520 }) + 테이프(110, 500),
    메모: `<div class="memo" style="left:70px;top:940px;transform:rotate(-2deg)">다음에 또 할 때<br>이 한 줄이 제일 쓸모 있다</div>`,
    스티커: 'pjs_02', 스자리: 'right:52px;top:236px;transform:rotate(4deg)', 꼬리: '한끼 · 레시피 상세 → 포스트잇 누르기' }),

  // 4 요리모드 — F
  '소소3-04-요리모드': () => F({ no: 4, 위글: '손에 물 묻은 채<br>꺼진 화면을 자꾸 톡톡', 머리: '요리하는 동안<br>화면이 안 꺼져요', 부제: '요리모드로 들어가면 단계마다 큰 글씨<br>타이머도 그 단계에서 바로', 부제폭: 440,
    // 🍳 창업자 2026-09-07 = *"요리하는 동안 안꺼지는 걸 보여줘야하는데 안맞잖아"*
    //    ⛔ 전엔 «재료 준비» 화면을 썼다 — 그건 요리모드에 «들어가기 전»이다.
    //    ✅ 「재료 준비 완료·시작」을 눌러 들어간 «요리하는 동안» 화면(STEP 1/6 ＋ 큰 글씨 ＋ 타이머 단추)
    조각들: 조각({ 파일: '05b-요리모드-단계', y: 730, h: 1020, 배율: 0.36, 회전: -2, left: 550, top: 720, z: 6 }),
    스티커: 'gom_pot', 스자리: 'left:64px;bottom:104px', 꼬리: '한끼 · 레시피 상세 → 요리모드 시작' }),

  // 5 일기 — D
  '소소3-05-일기': () => D({ no: 5, 머리: '해먹은 날이<br>달력에 쌓여요',
    조각들: 조각({ 파일: '06-일기-달력', y: 60, h: 1100, 배율: 0.52, 회전: -2.5, left: 60, top: 420 }) + 테이프(110, 400),
    // 📮 창업자 2026-09-07 = *"달력에 쌓인게 별로 없어"* → 앱 화면을 «지난 달(8월 · 15번)»로 넘겨 다시 찍었다.
    // ⛔ 그래서 «이번 달 요리 수» 조각은 뺐다 — 그 카드는 달력을 넘겨도 «9월 값(2번)»이라 8월 달력과 어긋난다.
    // ➡️ 화살표는 달력을 아래에서 가리킨다
    메모: `<div class="memo" style="left:88px;top:1010px;transform:rotate(-2deg)">이만큼<br>해먹었네</div>` + 손화살표(300, 915, 150, 120),
    스티커: 'kp_leafsit', 스자리: 'right:40px;top:300px;transform:rotate(-3deg)', 꼬리: '한끼 · 일기 탭' }),

  // 6 꾸미기 — E
  '소소3-06-꾸미기': () => E({ no: 6, 띠top: 300, 머리: '속지도 글씨체도<br>골라 써요', 띠글: '속지 24종 ·<br>글씨체 6종', 부제: '계절 스티커까지 그날 기분대로<br>고르는 데 30초, 쓰는 건 매일', 부제폭: 400,
    조각들: 조각({ 파일: '07-꾸미기-속지', y: 1430, h: 1090, 배율: 0.34, 회전: -6, left: 550, top: 380, z: 6, 테: false, r: 22 }) +
      조각({ 파일: '08-꾸미기-글씨체', y: 1990, h: 300, x: 0, w: 1098, 배율: 0.42, 회전: 3, left: 452, top: 1030, z: 6 }),
    스티커: 'gom_heartplate', 스자리: 'left:64px;bottom:96px;transform:rotate(-4deg)', 다음위: 'right:56px;bottom:60px', 꼬리: '한끼 · 일기 → 꾸미기' }),

  // 7 백업 — F
  '소소3-07-백업': () => F({ no: 7, 위글: '폰 바꾸고 나면<br>적어둔 게 통째로 사라진다', 머리: '폰을 바꿔도<br>그대로 옮겨가요', 제목크기: 72, 부제: '백업 파일로 내보내고 그대로 되살려요<br>클라우드에 두면 폰이 바뀌어도 그대로', 부제폭: 500,
    조각들: 조각({ 파일: '09-설정-백업클라우드', y: 955, h: 1050, 배율: 0.38, 회전: -2, left: 585, top: 700, z: 6 }),
    스티커: 'kp_walk', 스자리: 'left:56px;bottom:104px', 꼬리: '한끼 · 설정 → 백업 · 내보내기' }),

  // 8 마무리 — E (넘길 게 없으니 「넘겨 보세요」를 빼고 스토어 알약을 넣는다)
  '소소3-08-마무리': () => `<style>${기본}
body{background:${크림}}
.band{position:absolute;left:-40px;top:300px;width:1200px;height:470px;background:${팥};transform:rotate(-6deg);z-index:2}
.band2{position:absolute;left:-40px;top:790px;width:1200px;height:26px;background:${종이};transform:rotate(-6deg);z-index:3}
.hh{position:absolute;left:70px;top:124px;font-size:84px;line-height:1.1;z-index:9}
.on{position:absolute;left:70px;top:396px;width:460px;font-size:62px;line-height:1.2;color:${크림};z-index:9;transform:rotate(-6deg)}
.ss{position:absolute;left:70px;top:900px;width:640px;font-size:42px;z-index:9}
.pill{position:absolute;left:70px;bottom:150px;z-index:9;background:${팥};color:${크림};border-radius:999px;padding:16px 40px;font-size:36px;font-family:'Gaegu';font-weight:700;white-space:nowrap}</style>
<div class="tag">${태그3(8)}</div>
<div class="band"></div><div class="band2"></div>
<div class="hh">배경 테마도<br>바꿔요</div>
<div class="on">그레이지 · 크림<br>살구 · 다크 넷</div>
${조각({ 파일: '10-설정-테마', y: 1292, h: 1040, 배율: 0.34, 회전: -6, left: 550, top: 345, z: 6, 테: false, r: 22 })}
<div class="ss">①장보기 ②홈이 알아서 ③기록은 내 것<br>세 편 다 무료로 쓰는 기능이에요</div>
<div class="pill">▶ Play 스토어에서 「한끼」 검색</div>
<img class="sp" src="${스('tc_04')}" style="right:40px;bottom:132px;height:250px;transform:rotate(-2deg);z-index:9">
<div class="foot">오늘도 한 끼 해냈다면, 한끼에서 만나요</div>`,
}

const br = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
// 🎬 TYPE=1 — 릴스 «쌓이기 ＋ 타자» 프레임 (2026-09-07 · 창업자 "쌓이기로 가고 타자 효과까지 얹어줘")
//   ②편(_판-소소홈캐러셀-0907.mjs)의 판을 그대로 물려받았다 — 조각·메모·띠·스티커가 하나씩 툭 내려앉고, 제목이 커서 달고 한 자씩 찍힌다.
//   조립 = design/promo/인스타-2509/조립-소소3릴스-타자.sh (ffmpeg concat · list.txt 가 머무는 시간을 갖고 있다)
if (process.env.TYPE) {
  const { writeFileSync } = await import('node:fs')
  const p = await br.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 })
  const T = process.env.OUT || '/tmp/claude-0/-home-user-hankki/2414fcda-d05a-5b79-84dc-8c748bfda84b/scratchpad/소소3/캐러셀-타자'
  const TICK = 0.085
  for (const [n, f] of Object.entries(장들)) {
    const D = `${T}/${n}`; mkdirSync(D, { recursive: true })
    const list = []; let k = 0
    const 찍 = async (dur) => { const file = `${D}/f${String(k++).padStart(3, '0')}.png`; await p.screenshot({ path: file }); list.push(`file '${file}'\nduration ${dur.toFixed(3)}`) }
    await p.setContent(`<!doctype html><meta charset="utf-8">${f()}<style>.ch.off{visibility:hidden}.cur{display:inline-block;width:.09em;height:.86em;background:${팥};vertical-align:-.06em;margin-left:.05em;border-radius:3px}.hid{visibility:hidden!important}</style>`)
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300)
    const N = await p.evaluate(() => {
      const h = document.querySelector('.hh'); let i = 0, out = ''
      for (const part of h.innerHTML.split(/(<br>)/)) { if (part === '<br>') { out += '<br>'; continue } for (const ch of part) out += `<span class="ch off" data-i="${i++}">${ch}</span>` }
      h.innerHTML = out
      const els = [...document.querySelectorAll('.piece, .tape, .memo, .band, .band2, .cut, .up, .dn, .lab, .ss, .pill, .foot, .next, .on, .gray, .sp')]
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
console.log(`\n📔 8장 ＋ 검수판 → ${OUT}`)
