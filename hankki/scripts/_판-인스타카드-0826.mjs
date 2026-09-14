// 📸📸 인스타 사진 게시물(캐러셀) 카드 — 1080×1440 «3:4» (2026-08-26)
//
// 📮 창업자 = *"인스타에 앞으로 이번주에 나갈 것 안내도하고, 패드되는 것도 안내해야하면 좋겠다. 캐러셀도 만들어줘"*
//
// ⭐⭐ 왜 «3:4» 인가 — **9:16 사진은 인스타 피드에 못 올린다.** 최대 세로가 3:4 다.
//    (스토어 스샷 v5 는 1080×1920 이라 그대로 못 쓴다 — 그래서 이 도구가 따로 있다)
// ⛔⛔ ＋ 파일이 3:4 인 것만으로는 부족하다 — 인스타는 여러 장을 고르면 첫 화면에서 **1:1 로 맞춘다.**
//    올릴 때 **「세로 비율」로 바꿔야** 안 잘린다(2026-08-26 창업자가 올리기 직전에 잡았다).
//
// ⭐ 틀 = 스토어 v5(`_판-스토어시안-0822.mjs`)의 파스텔 바탕·도트·우리 서체를 그대로 물려받는다.
//    → 인스타 격자에 스토어 스샷과 같은 결로 쌓인다.
//
// 🗂 묶음 셋
//   `캐러셀` — 「저장한 레시피 어디 갔지?」 6장 (새 사람을 데려오는 글 · 문제 → 우리 답 → CTA)
//   `이번주` — 저절로 열리는 것 예고 2장 (⛔숫자는 `release-calendar.mjs` 로 «세서» 넣는다)
//   `패드`   — 태블릿에서도 된다 3장 (패드 화면은 가로 2560×1440 이라 카드 안에 가로로 눕힌다)
//
// 실행: cd /home/user/hankki/hankki && node scripts/_판-인스타카드-0826.mjs [묶음이름]
// 🏷 이름표 = 살아있는 도구
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const 화면 = join(ROOT, 'design/promo/앱화면-2508')
const OUT = join(ROOT, 'design/promo/인스타-2508/카드-3대4')
mkdirSync(OUT, { recursive: true })

const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`
const 폰트 = readFileSync(join(ROOT, 'design/promo/fonts-embed.css'), 'utf8')
const 곰펭 = b64(join(ROOT, 'src/assets/stickers/photo/gp_duoht.png'))
const 로고 = b64(join(ROOT, 'design/promo/logo/한끼로고-곰ㅎ-투명-2507.png'))

// ⛔ 색을 박지 않고 로고 색(#5d3410)을 쓴다 — 앱·스토어와 한 벌
const 공통 = `
${폰트}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1440px;overflow:hidden;position:relative;
  font-family:'Gowun Dodum','Jua',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
body::before{content:'';position:absolute;inset:0;opacity:.5;
  background-image:radial-gradient(rgba(93,52,16,.13) 3px,transparent 3px);background-size:34px 34px}
.hh{font-family:'Jua','Gowun Dodum',system-ui,sans-serif;color:#5d3410;letter-spacing:-0.02em}
.ss{color:rgba(93,52,16,.68);letter-spacing:-0.01em}
.pill{position:absolute;left:50%;transform:translateX(-50%);bottom:56px;z-index:3;
  background:#5d3410;color:#fff8ec;border-radius:999px;padding:18px 40px;font-size:34px;
  font-family:'Jua','Gowun Dodum',system-ui,sans-serif;letter-spacing:-0.01em;white-space:nowrap}
`
const 감성색 = ['#fbf0e0', '#eef3e6', '#fdeef0', '#eaf1f6', '#f6efe2', '#f0f2e8', '#fdeee6']

// 📐 ① 앱 화면을 «세로로» 크게 — 3:4 라 v5(1920)보다 카드가 짧다
const 세로화면 = ({ 파일, 머리, 부제, 알약, 자리 = 'top' }, i) => `<style>${공통}
  body{background:${감성색[i % 감성색.length]}}
  .wrap{position:relative;z-index:2;padding:78px 68px 0;text-align:center}
  .hh{font-size:74px;line-height:1.28}
  .ss{font-size:33px;line-height:1.5;margin-top:18px}
  /* ⛔ 처음엔 height 1010 이라 카드 아래가 «알약에 가렸다»(2026-08-26 · 규칙 21 이 잡았다).
        320+950=1270 · 알약 윗변 1324 → 이제 안 겹친다. ⛔여기 값을 키울 땐 알약과 다시 재 볼 것. */
  .box{position:absolute;left:150px;right:150px;top:320px;z-index:2}
  .big{width:100%;height:950px;object-fit:cover;object-position:${자리};display:block;
    border-radius:36px;border:9px solid #fffdf8;
    box-shadow:0 28px 58px rgba(93,52,16,.22),0 5px 14px rgba(93,52,16,.10)}
</style>
<div class="wrap"><div class="hh">${머리}</div>${부제 ? `<div class="ss">${부제}</div>` : ''}</div>
<div class="box"><img class="big" src="${b64(join(화면, 파일))}"></div>
${알약 ? `<div class="pill">${알약}</div>` : ''}`

// 📐 ② 글만 — 후킹·CTA 처럼 화면이 없는 장
const 글만 = ({ 머리, 줄들 = [], 알약, 곰 = false, 로고표시 = false, 바탕 }, i) => `<style>${공통}
  body{background:${바탕 || 감성색[i % 감성색.length]}}
  .wrap{position:absolute;left:76px;right:76px;top:50%;transform:translateY(-50%);z-index:2;text-align:center}
  .hh{font-size:88px;line-height:1.32}
  .lines{margin-top:44px;color:#5d3410;font-size:40px;line-height:1.72;letter-spacing:-0.01em}
  .lines .go{color:#c2703a;font-weight:700}
  .duo{width:360px;margin:0 auto 34px;display:block;filter:drop-shadow(0 14px 26px rgba(93,52,16,.20))}
  .logo{width:250px;margin:0 auto 30px;display:block}
</style>
<div class="wrap">
  ${곰 ? `<img class="duo" src="${곰펭}">` : ''}
  ${로고표시 ? `<img class="logo" src="${로고}">` : ''}
  <div class="hh">${머리}</div>
  ${줄들.length ? `<div class="lines">${줄들.join('<br>')}</div>` : ''}
</div>
${알약 ? `<div class="pill">${알약}</div>` : ''}`

// 📐 ③ 목록 — 「이번 주에 열리는 것」처럼 항목을 세로로
const 목록 = ({ 머리, 부제, 항목, 알약, 바탕 }, i) => `<style>${공통}
  body{background:${바탕 || 감성색[i % 감성색.length]}}
  .wrap{position:relative;z-index:2;padding:86px 68px 0;text-align:center}
  .hh{font-size:74px;line-height:1.28}
  .ss{font-size:33px;line-height:1.5;margin-top:16px}
  .card{position:absolute;left:88px;right:88px;top:400px;z-index:2;background:#fffdf8;
    border-radius:38px;padding:44px 48px;box-shadow:0 18px 40px rgba(93,52,16,.14);text-align:left}
  .card li{list-style:none;color:#5d3410;font-size:39px;line-height:1.9;letter-spacing:-0.01em;
    display:flex;align-items:baseline;gap:18px}
  .card li b{color:#c2703a;font-family:'Jua',sans-serif;font-weight:400;font-size:34px}
</style>
<div class="wrap"><div class="hh">${머리}</div>${부제 ? `<div class="ss">${부제}</div>` : ''}</div>
<div class="card"><ul>${항목.map((t) => `<li><b>·</b><span>${t}</span></li>`).join('')}</ul></div>
${알약 ? `<div class="pill">${알약}</div>` : ''}`

// 📐 ④ 가로 화면 — 패드는 2560×1440 이라 카드 안에 «눕혀서» 넣는다
const 가로화면 = ({ 파일, 머리, 부제, 알약 }, i) => `<style>${공통}
  body{background:${감성색[i % 감성색.length]}}
  .wrap{position:relative;z-index:2;padding:96px 68px 0;text-align:center}
  .hh{font-size:74px;line-height:1.28}
  .ss{font-size:33px;line-height:1.5;margin-top:18px}
  .box{position:absolute;left:56px;right:56px;top:560px;z-index:2}
  .wide{width:100%;display:block;border-radius:26px;border:9px solid #fffdf8;
    box-shadow:0 28px 58px rgba(93,52,16,.22),0 5px 14px rgba(93,52,16,.10)}
</style>
<div class="wrap"><div class="hh">${머리}</div>${부제 ? `<div class="ss">${부제}</div>` : ''}</div>
<div class="box"><img class="wide" src="${b64(join(화면, 파일))}"></div>
${알약 ? `<div class="pill">${알약}</div>` : ''}`

// ═══════════════════════════════════════════════════════════
// 🗂 묶음 — ⛔순서가 곧 값어치다(캐러셀은 첫 장에서 끝까지 볼지가 갈린다)
const 묶음들 = {
  // ① 새 사람을 데려오는 글 — 문제 → 우리 답 → CTA
  캐러셀: [
    ['글만', { 머리: '저장한 레시피,<br>어디 갔더라?', 줄들: ['인스타에 저장하고', '캡처하고 링크도 복사했는데', '<span class="go">막상 해먹을 땐 못 찾아요.</span>'], 곰: true, 바탕: '#fbf0e0' }],
    // ⛔⛔ 「11-가져오기」를 쓰지 않는다 — 그 화면은 2026-08-22 판이라 «무료 AI 스캔 20회»가 찍혀 있다.
    //    v11.30(8/24)에서 그 재화 이름을 **「레시피열쇠」**로 바꿨으니 홍보물에 옛 이름이 나가면 안 된다.
    //    ⭐ 게다가 「가져오기」는 «과정»이고 유저가 보고 싶은 건 «결과»다 — 결과부터 보여주는 편이 낫다.
    //    📌 다시 쓰려면 그 화면부터 새로 찍을 것(`_shot-스토어용화면-0822.mjs` 엔 아직 그 장이 없다).
    ['세로화면', { 파일: '21-상세-재료순서.png', 머리: '캡처 한 장이면<br>이렇게 정리돼요', 부제: '재료도 순서도 알아서 · 옮겨 적을 필요 없이', 알약: '불 앞에서 보기 좋게' }],
    ['세로화면', { 파일: '20-레시피목록.png', 머리: '쌓이면<br>나만의 요리책', 부제: '표지도 내 마음대로', 알약: '찾느라 헤맬 일 없이' }],
    ['세로화면', { 파일: '23-꾸미기-스티커서랍.png', 머리: '레시피 정리? 우린<br>레시피 레꾸해요', 부제: '스티커 붙이고 배경 깔고 · 내 요리책이 돼요', 알약: '이게 «레꾸» 예요', 자리: 'center' }],
    ['세로화면', { 파일: '26-일기-채운달력.png', 머리: '오늘의 한 끼가<br>일기가 돼요', 부제: '달력에 하나씩 쌓여요', 알약: '해낸 날이 보여요' }],
    ['글만', { 머리: '지금 만나요', 줄들: ['꼬르곰 · 펭펭 · 카롱 · 뾰미 · 꼬비가', '부엌에서 기다릴게요'], 로고표시: true, 알약: '👇 프로필 링크에서 무료로 받기', 바탕: '#f7e6d2' }],
  ],

  // ② 저절로 열리는 것 예고 — ⛔숫자는 release-calendar.mjs 로 «세서» 넣는다(손으로 적으면 낡는다)
  이번주: [
    ['목록', {
      머리: '이번 주 한끼',
      부제: '8월 31일 · 저절로 열려요',
      항목: ['뚝딱 버섯 볶음밥', '돌솥비빔밥', '소고기 솥밥', '오징어 애호박 덮밥', '가지덮밥'],
      알약: '햅쌀 나오는 주간이에요 🌾', 바탕: '#f6efe2',
    }],
    ['글만', {
      머리: '9월 1일,<br>가을이 열려요',
      줄들: ['꾸미기 서랍에 <span class="go">76컷</span>이', '한꺼번에 들어와요', '', '가을 소품 · 마스킹테이프 ·', '카롱과 펭펭의 새 컷까지'],
      알약: '업데이트 없이 그날 저절로', 바탕: '#f0f2e8',
    }],
  ],

  // ③ 패드에서도 된다
  패드: [
    ['가로화면', { 파일: '태블릿-01-홈.png', 머리: '패드에서도<br>그대로 돼요', 부제: '폰에서 쓰던 그 한끼 그대로', 알약: '따로 받을 것 없이' }],
    ['가로화면', { 파일: '태블릿-03-레시피상세.png', 머리: '큰 화면은<br>두 단으로', 부제: '목록과 레시피를 한 번에 · 넘길 필요 없이', 알약: '주방에 세워두기 좋아요' }],
    ['가로화면', { 파일: '태블릿-04-레꾸.png', 머리: '레꾸도<br>시원하게', 부제: '스티커 서랍이 옆에 · 손이 안 가려요', 알약: '큰 화면이 편한 일 🎀' }],
  ],
}

// ═══════════════════════════════════════════════════════════
const 그리개 = { 세로화면, 글만, 목록, 가로화면 }
const 고른것 = process.argv[2]
const 돌릴것 = 고른것 ? { [고른것]: 묶음들[고른것] } : 묶음들
if (고른것 && !묶음들[고른것]) {
  console.log(`⛔ «${고른것}» 묶음이 없다 — ${Object.keys(묶음들).join(' · ')}`); process.exit(1)
}

const CHROMIUM = process.env.SMOKE_CHROMIUM
const br = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const p = await br.newPage({ viewport: { width: 1080, height: 1440 }, deviceScaleFactor: 1 })
let 찍음 = 0
for (const [묶음, 장들] of Object.entries(돌릴것)) {
  console.log(`\n📁 ${묶음} — ${장들.length}장`)
  for (let i = 0; i < 장들.length; i++) {
    const [꼴, 값] = 장들[i]
    await p.setContent(`<!doctype html><meta charset="utf-8">${그리개[꼴](값, i)}`)
    await p.evaluate(() => document.fonts.ready)
    await p.waitForTimeout(320)
    const 이름 = `${묶음}-${String(i + 1).padStart(2, '0')}.png`
    await p.screenshot({ path: join(OUT, 이름) })
    console.log(`  ✅ ${이름}`)
    찍음++
  }
}
await br.close()

// 🔒 규격 게이트 — 인스타 사진은 «3:4» 라야 한다(9:16 은 피드에 못 올린다)
const { readdirSync } = await import('node:fs')
for (const n of readdirSync(OUT).filter((f) => f.endsWith('.png'))) {
  const 바이트 = readFileSync(join(OUT, n))
  const w = 바이트.readUInt32BE(16), h = 바이트.readUInt32BE(20)
  if (w !== 1080 || h !== 1440) { console.log(`  ⛔ ${n} = ${w}×${h} — 1080×1440 이어야 한다`); process.exit(1) }
}
console.log(`\n✅ ${찍음}장 · 전부 1080×1440(3:4) → ${OUT}`)
