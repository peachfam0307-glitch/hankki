// 🏪🍂 스토어 스크린샷 v8 — 가을판 8장 (2026-09-06)
//
// 📮 창업자 (2026-09-05~06)
//   · *"스토어 스샷은 8장을 새 디자인으로"* · *"비슷한데 다른 느낌으로 글씨체는 주아로 가고 배경(뼈대)를 바꿔"*
//   · *"너무 진하지 않게 우리 인스타에 올린 것과 색감 너무 겹치지 않게 부탁해 좀 은은하게 (배경)"*
//   · *"저번거랑 너무 비슷한 것 같아"* → *"배경무늬나 글씨색의 변화를 줘"* → 짜임을 바꾼 D·E·F 중 *"캡쳐를 제일 잘 설명해주는건 1.3번"*
//   · *"1번으로 할까?"* → ✅ **D 에디토리얼** 확정 = 모눈 무늬 · 올리브 글씨 · 헤드라인 왼쪽 정렬 · 폰이 오른쏙 아래로 «화면 밖까지» · 왼쪽에 세로 단계
//   · 화면 교체 = 3 레꾸(콩국수 여름 씬 → 가을 꾸밈) · 5 요리모드(+타이머 열린 것 둘 다) · 6 일기(달력 → **일꾸 한 장**)
//
// 🖼 재료 = `design/promo/스토어v8-원본-2509/` (⛔ scratchpad 가 아니라 «저장소» — 8/28 사고: 갱신 자리와 읽는 자리가 다르면 조용히 낡는다)
//    다시 찍을 땐 `SMOKE_CHROMIUM=/opt/pw-browsers/chromium SHOT_RECIPE='공심채 볶음' node scripts/_shot-스토어용화면-0822.mjs` → 그 폴더로 복사.
// 🧭 v5·v7 에서 물려받은 것 = 앞 2~3장만 검색결과에 뜬다 · 「진짜 앱 화면 한 장 ＋ 헤드라인 한 줄」 · 마지막 장만 이야기.
// 🔎 규칙 21 — 만들고 «열어 본다». 특히 폰이 화면 밖으로 나가는 짜임이라 «아래가 잘리는 장»(07 카드 단추)을 장별 값으로 잡는다.
//
// 실행: cd /home/user/hankki/hankki && SMOKE_CHROMIUM=/opt/pw-browsers/chromium node scripts/_판-스토어v8-0906.mjs
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = new URL('..', import.meta.url).pathname
const 원본 = join(ROOT, 'design/promo/스토어v8-원본-2509')
const 안내원본 = join(ROOT, 'design/promo/가져오기안내-원본캡처-2508')
const OUT = process.env.OUT || '/tmp/claude-0/-home-user-hankki/0848ab85-00e3-56db-9a26-e87075950c12/scratchpad/v8'
mkdirSync(OUT, { recursive: true })

const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`
const 폰트 = readFileSync(join(ROOT, 'design/promo/fonts-embed.css'), 'utf8')
// 🐧 [창업자 00:33] *"펭펭 옛컷 그만 써..ㅠ"* — `gp_peng*`·`gp_duo*`(벨트 없는 트렌치)는 옛 펭펭이다. 펭펭·콤비는 **sharepool 의 정본**(`pjs_`·`duos_` · 2026-09-02 창업자 제공)만 쓴다. 곰 솔로 `gp_gom*` 은 그대로.
const 스티커 = (k) => b64(join(ROOT, /^(pjs|duos)_/.test(k) ? `src/assets/sharepool/${k}.png` : `src/assets/stickers/photo/${k}.png`))
const 앱 = (f) => b64(join(원본, `${f}.png`))

// 🎨 D 뼈대 — 모눈 #f1ede6 · 올리브 #4a4f36 · 포인트 #c2703a(앱 토큰) · 폰 테 #fffdf8
const 올리브 = '#4a4f36'
const 공통 = `${폰트}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;position:relative;font-family:'Jua','Gowun Dodum',system-ui,sans-serif;-webkit-font-smoothing:antialiased;
  background:#f1ede6;background-image:linear-gradient(rgba(74,79,54,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(74,79,54,.09) 1px,transparent 1px);background-size:54px 54px}
.wrap{position:relative;z-index:3;text-align:left;padding:110px 64px 0}
.hh{font-family:'Jua';color:${올리브};letter-spacing:-0.02em;font-size:96px;line-height:1.28}
.ss{font-family:'Gowun Dodum';color:rgba(74,79,54,.62);font-size:38px;line-height:1.5;margin-top:20px}
.rule{position:absolute;z-index:2;left:64px;right:64px;top:432px;height:3px;background:rgba(74,79,54,.22)}
/* 📱 주인공 폰 — 오른쪽 아래로 화면 밖까지. 살짝 기울여 «놓인» 느낌 */
.front{position:absolute;z-index:4;right:-90px;top:640px;width:720px;height:1400px;border-radius:52px;overflow:hidden;
  border:12px solid #fffdf8;transform:rotate(-4deg);box-shadow:0 40px 80px rgba(74,79,54,.22);background:#fffdf8}
.front img{width:100%;display:block;object-fit:cover;object-position:top}
/* 📱 곁 폰(작게 · 왼쪽 · 반대로 기울여) */
.back{position:absolute;z-index:3;left:52px;top:640px;width:330px;height:600px;border-radius:28px;overflow:hidden;
  border:9px solid #fffdf8;transform:rotate(3deg);box-shadow:0 30px 62px rgba(74,79,54,.18);background:#fffdf8}
.back img{width:100%;height:100%;object-fit:cover;object-position:top;display:block}
/* 🪜 왼쪽 세로 단계/포인트 */
.steps{position:absolute;z-index:6;left:64px;top:1300px;display:flex;flex-direction:column;gap:26px}
.step{display:flex;align-items:center;gap:18px}
.step img,.step .dot{width:96px;height:96px;border-radius:50%;display:block;box-shadow:0 4px 12px rgba(74,79,54,.16);border:4px solid #fffdf8;flex:0 0 auto}
.step .dot{background:#e6e2d6;display:flex;align-items:center;justify-content:center;font-size:44px}
.step b{font-family:'Jua';font-weight:400;color:${올리브};font-size:34px;letter-spacing:-0.02em;display:block}
.step small{display:block;font-family:'Gowun Dodum';color:rgba(74,79,54,.6);font-size:26px}
.duo{position:absolute;z-index:5;left:56px;top:700px;width:300px;filter:drop-shadow(0 10px 20px rgba(74,79,54,.16))}
.leaf{position:absolute;z-index:2;opacity:.5}
/* ✨ 샤랄라 — 📮 [00:42] *"효과도 넣어줘. 샤랄라같은거"* · 네 갈래 별을 폰 둘레와 헤드라인 곁에 흩는다(연한 금빛 · 은은한 광) */
.sp{position:absolute;z-index:5;filter:drop-shadow(0 0 10px rgba(255,214,120,.85))}
`
const 별 = (x, y, s, o = 1, c = '#f2c86a') => `<svg class="sp" style="left:${x}px;top:${y}px;width:${s}px;height:${s}px;opacity:${o}" viewBox="0 0 48 48"><path d="M24 2C25.6 16 32 22.4 46 24 32 25.6 25.6 32 24 46 22.4 32 16 25.6 2 24 16 22.4 22.4 16 24 2Z" fill="${c}"/></svg>`
const 샤랄라 = () => 별(700, 96, 74) + 별(790, 190, 40, .8, '#fff3d6') + 별(380, 560, 52, .9) + 별(440, 640, 28, .7, '#fff3d6') + 별(1000, 520, 62) + 별(950, 600, 30, .75, '#fff3d6') + 별(300, 1180, 44, .85) + 별(360, 1250, 24, .7, '#fff3d6')
const 머리 = (h, s) => `<div class="wrap"><div class="hh">${h}</div><div class="ss">${s}</div></div><div class="rule"></div>`
const 포인트 = (rows) => `<div class="steps">${rows.map(([e, b, s]) => `<div class="step"><div class="dot">${e}</div><div><b>${b}</b>${s ? `<small>${s}</small>` : ''}</div></div>`).join('')}</div>`

// 01 캡처하는 법 — 8/28 확정 장면 ㉢(인스타 › 한끼 ＋ 단계) 을 D 짜임으로
const 장01 = () => `<style>${공통}</style>
${머리('캡처 한 장이면<br>레시피가 정리돼요', '보다가 캡처 · 재료도 순서도 알아서')}${샤랄라()}
<div class="back"><img src="${b64(join(안내원본, '인스타-공유동그라미.png'))}"></div>
<div class="front"><img src="${앱('21-상세-재료순서')}"></div>
<div class="steps">
<div class="step"><img src="${b64(join(안내원본, 'i-공유.png'))}"><div><b>① 공유</b><small>캡처한 글에서</small></div></div>
<div class="step"><img src="${b64(join(안내원본, 'i-더보기.png'))}"><div><b>② 더보기</b></div></div>
<div class="step"><img src="${b64(join(안내원본, 'i-한끼.png'))}"><div><b>③ 한끼</b><small>누르면 끝</small></div></div></div>`

// 02~07 — 헤드라인 ＋ 주인공 폰 ＋ 왼쪽에 곰펭 한 마리와 포인트 둘
const 장 = ({ 머리: h, 부제, 파일, 곰, 포인트: pts, 자리 = 'top', 폰 = '' }) => `<style>${공통}
.front img{object-position:${자리}} ${폰}</style>
${머리(h, 부제)}${샤랄라()}
${곰 ? `<img class="duo" src="${스티커(곰)}">` : ''}
<div class="front"><img src="${앱(파일)}"></div>
${포인트(pts)}`

// 05 요리모드 — 📮 [00:18] *"불앞에서도 편하게는 요리모드인데 타이머 켜놓은 상태를 찍어줘"* → 타이머가 «돌아가는» 걸음 화면 한 장
//    (⛔ 첫 판은 걸음＋타이머 «시트» 두 폰이었다 — 시트는 「맞추는 중」이고 창업자가 원한 건 「켜 둔」 모습)
const 장05 = () => 장({ 머리: '불 앞에서도<br>편하게', 부제: '큰 글씨 걸음 · 타이머 켜 두고 · 화면도 안 꺼져요', 파일: '25c-요리모드-타이머작동', 곰: 'gp_gomft',
  포인트: [['⏲', '걸음마다 타이머', '끓는 시간 딱 맞게'], ['🔔', '소리와 진동으로', '다른 화면에 있어도']],
  // ⛔ 첫 판은 타이머 띠(이 장의 값어치)가 아래로 잘렸다(규칙 21) → 폰을 줄여 올리고 «아래»가 보이게 자른다
  자리: '50% 100%', 폰: '.front{top:520px;right:-40px;width:640px;height:1440px;transform:rotate(-3deg)}' })

// 08 왜 만들었나 — v5 마지막 장 글 «그대로»(창업자 확정 문단) · 뼈대만 D 로
const 장08 = () => `<style>${공통}
.wrap{padding-top:96px}.hh{font-size:88px}
.duo{left:auto;right:64px;top:120px;width:250px}
.card{position:absolute;left:64px;right:64px;top:560px;z-index:3;background:#fffdf8;border-radius:36px;padding:44px 46px;box-shadow:0 20px 44px rgba(74,79,54,.12);text-align:left}
.card p{font-family:'Gowun Dodum';color:${올리브};font-size:35px;line-height:1.62;letter-spacing:-0.01em}
.card .go{color:#c2703a;font-weight:700}
.card hr{border:0;border-top:2px dashed rgba(74,79,54,.22);margin:28px 0}
.pill{position:absolute;left:64px;bottom:214px;z-index:3;background:${올리브};color:#fff8ec;border-radius:999px;padding:20px 44px;font-size:36px;font-family:'Jua';white-space:nowrap}
.end{position:absolute;left:64px;right:64px;bottom:62px;z-index:3;text-align:left;font-family:'Jua';color:${올리브};font-size:50px;line-height:1.42;letter-spacing:-0.02em}
</style>
${머리('꼬르곰은 저예요', '펭펭은 제 사춘기 딸이고요')}${별(640, 90, 60)}${별(720, 170, 32, .8, '#fff3d6')}${별(130, 480, 44, .9)}
<img class="duo" src="${스티커('duos_06')}">
<div class="card">
  <p>저장만 해둔 레시피 캡처가 수백 장.<br>정작 해먹고 싶을 땐 못 찾았어요.<br><span class="go">그래서 한끼를 만들었어요.</span></p>
  <hr>
  <p>꼬르곰과 펭펭, 티격태격하지만<br>그게 곧 사랑이에요.<br>우리 집 이야기이자, 여느 집 이야기죠.</p>
  <hr>
  <p>제가 엄마의 밥상을 기억하듯<br>저 아이도 언젠가 오늘의 한 끼를<br><span class="go">기억했으면 좋겠어요.</span></p>
</div>
<div class="pill">18년차 주부가 만든 앱</div>
<div class="end">오늘도 한 끼 해냈다면,<br>한끼에서 만나요</div>`

// 🗂 8장 — ⛔순서가 곧 값어치다(앞 2~3장만 검색결과에 뜬다) · 파일 이름은 v8- 접두(latest-map)
const 장들 = {
  'v8-01-캡처하는법': 장01,
  'v8-02-요리책': () => 장({ 머리: '레시피가 쌓이면<br>나만의 요리책', 부제: '표지도 내 마음대로 꾸며요', 파일: '20-창업자-레꾸목록', 곰: 'gp_gomhi', // 📮 [00:39] *"레시피가 쌓이면 여기에서 레꾸 한것들로 바꿀까"* → 창업자 폰의 레꾸 표지 목록 캡처(부타노가쿠니·간장비빔국수·꽈리고추·광어깻잎·차돌짬뽕·보쌈무김치)
    포인트: [['📚', '폴더로 정리', '한식 · 간식 · 우리 집'], ['🖼', '표지는 내 취향', '사진도 스티커도']] }),
  // 📮 [창업자 00:13] *"콩국수 무슨일이야 ㅠㅠ 내가 꾸며놓은 것중에 예쁜 것들 있자나"* → 내가 심은 가을 꾸밈을 버리고
  //    **창업자가 직접 꾸민 「간장비빔국수」 표지 캡처**(가을 · 은행잎·목도리·낙엽더미 곰펭)를 쓴다. 상태바·제스처바만 잘랐다.
  'v8-03-레꾸': () => 장({ 머리: '레시피 정리? 우린<br>레시피 레꾸해요', 부제: '스티커 붙이고 배경 깔고 · 한 끼가 추억이 돼요', 파일: '23-창업자-간장비빔국수', 곰: 'pjs_03',
    포인트: [['🍂', '계절마다 새 스티커', '지금은 가을'], ['🐻', '꼬르곰·펭펭도', '함께 붙여요']], 자리: 'top' }),
  'v8-04-장보기': () => 장({ 머리: '재료는 한 번에<br>사러가기', 부제: '레시피 재료 그대로 톡 · 18년차 주부의 추천템까지', 파일: '27-장보기-사러가기', 곰: 'gp_gomtb',
    포인트: [['🛒', '담기 한 번', '재료가 리스트로'], ['🔗', '줄마다 사러가기', '검색 없이 바로']] }),
  'v8-05-요리모드': 장05,
  'v8-06-일꾸': () => 장({ 머리: '오늘의 한 끼가<br>일기가 돼요', 부제: '속지 고르고 · 사진 한 장 · 한 줄 · 스티커까지', 파일: '26-창업자-일꾸-임시', 곰: 'pjs_01', // 📮 [00:23] 창업자가 직접 꾸민 갈비탕 일기(⚠️ 임시 — 저장 띠는 잘랐고 사진 위 ✕ 는 남아 있다 · 깨끗한 재캡처 대기)
    포인트: [['📔', '속지도 여러 가지', '선 · 종이 · 틀'], ['✏️', '손글씨 서체로', '그날 기분 그대로']] }),
  // ⛔ 자랑 카드는 «아래 단추»(이 카드를 내 레시피 표지로)가 값어치다 → 폰을 덜 기울이고 위로 올려 아래가 남게
  'v8-07-자랑': () => 장({ 머리: '오늘의 한 끼를<br>카드 한 장으로', 부제: '뽑을 때마다 달라지는 카드 · 친구에게 톡', 파일: '10-랜덤카드', 곰: 'duos_02',
    포인트: [['🃏', '다시 뽑기', '마음에 드는 카드까지'], ['💬', '공유하기', '카톡으로 자랑']], 자리: '50% 8%',
    폰: '.front{top:560px;height:1480px;transform:rotate(-2.5deg)}' }),
  'v8-08-왜만들었나': 장08,
}

const CHROMIUM = process.env.SMOKE_CHROMIUM
const br = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {})
const p = await br.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 })
const 이름들 = []
for (const [이름, 만들기] of Object.entries(장들)) {
  await p.setContent(`<!doctype html><meta charset="utf-8">${만들기()}`)
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(350)
  await p.screenshot({ path: join(OUT, `${이름}.png`) })
  이름들.push(이름); console.log(`  ✅ ${이름}`)
}
await br.close()
// 🔎 검수판 — 8장을 한눈에(규칙 21). sharp 가 없어 Pillow.
execFileSync('python3', ['-c', `from PIL import Image
fs=${JSON.stringify(이름들)}
w,h=486,864
sh=Image.new('RGB',(w*4+50,h*2+30),'white')
for i,f in enumerate(fs):
  sh.paste(Image.open('${OUT}/'+f+'.png').resize((w,h)),(10+(i%4)*(w+10),10+(i//4)*(h+10)))
sh.save('${OUT}/v8-검수판.png')`])
console.log(`\n📸 8장 ＋ 검수판 → ${OUT}`)
