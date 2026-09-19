// 🎨💬 소개 릴스 배경 ＋ 자막 판 (2026-09-19) — 장면마다 한 장씩, 훅·끝장까지
//
// 📮 창업자 2026-09-18 = *"배경넣고 자막 얹자"*
// 🌙 배경 = **남색 ＋ 격자(진한 노트)** — 창업자가 ⓕ로 확정한 그것. 어제 예고(밝은 크림 노트)와 낮·밤 한 쌍.
//    📮 *"남색에 격자노트도 에쁜데?"* ＋ *"배경이랑 그런 것도 다르게 해줘"*
// ⛔ 유니코드 이모지를 무늬로 쓰지 않는다(절대원칙) — 전부 CSS 로 그린다.
//
// 쓰는 법: SMOKE_CHROMIUM=… node scripts/_판-흐름릴스자막-0919.mjs
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const R = dirname(dirname(fileURLToPath(import.meta.url)))
const 밖 = process.env.OUT || '/tmp/claude-0/녹화-식비흐름'
mkdirSync(밖, { recursive: true })
const 짐 = (p) => 'data:image/png;base64,' + readFileSync(p).toString('base64')
const 앱아이콘 = 짐(join(R, 'public/icons/icon-512-v7.png'))
// 🧾🧾 [창업자가 «뽑아 준» 컷 · 2026-09-18] 한끼 친구들 셋이 «가계부를 쓰고 있다»
//   📮 창업자 = *"아니면 애들 뽑아올까? 가계부쓰는 애들?"* → 직접 뽑아 줬다.
//   ⭐ 꼬르곰이 장부에 적고 · 펭펭은 계산기와 영수증 · 카롱도 영수증 — «식비 가계부» 그 자체다.
//   ⛔ 전엔 ps_01(펭펭 메모지＋장바구니)을 썼다. 그건 «장보기»지 «가계부»가 아니었다.
const 가계부컷 = 짐(join(R, 'docs/stickers/식비-창업자-2026-09-18/가계부-3인-원본.png'))
const 폰트 = readFileSync(join(R, 'src/assets/fonts/gowun-dodum-korean-400.woff2')).toString('base64')
const 폰트L = readFileSync(join(R, 'src/assets/fonts/gowun-dodum-latin-400.woff2')).toString('base64')

// 🌙 창업자 확정 ⓕ = 남색 ＋ 격자
const 바탕 = '#26354A', 줄 = '#2f4058', 진 = '#F3F7FC', 연 = '#9db0c8', 짚 = '#F5B301'

// 💬 장면마다 «한 줄». ⛔ 두 줄로 설명하지 않는다 — 릴스는 읽을 틈이 없다.
//    ⭐ 굵게(짚은 색)는 «그 장면에서 눈이 가야 할 낱말» 하나만.
const 자막 = [
  { 칸: '01', 작: '레시피에서', 큰: '필요한 재료만 <b>체크</b>' },
  { 칸: '02', 작: '장보기에 그대로 들어와요', 큰: '<b>금액</b>만 적으면 끝' },
  { 칸: '03', 작: '장본 것도 시킨 것도', 큰: '<b>배달·외식</b>도 여기서' },
  { 칸: '04', 작: '이번 주 얼마 안에 살까요', 큰: '<b>예산</b>을 정하면 보여요' },
  { 칸: '05', 작: '쓴 만큼 쌓여서', 큰: '<b>주별·달별</b>로 한눈에' },
  { 칸: '06', 작: '산 재료는 냉장고로', 큰: '그걸로 <b>만들 요리</b>까지' },
]

const 격자 = `background-color:${바탕};background-image:repeating-linear-gradient(0deg,${줄} 0 4px,transparent 4px 96px),repeating-linear-gradient(90deg,${줄} 0 4px,transparent 4px 96px)`

const 틀 = (속) => `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트}) format('woff2');unicode-range:U+AC00-D7A3,U+1100-11FF,U+3130-318F}
  @font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트L}) format('woff2')}
  *{margin:0;padding:0;box-sizing:border-box;font-family:GD,sans-serif}
  body{width:1080px;height:1920px;overflow:hidden;${격자}}
  .판{width:1080px;height:1920px;display:flex;flex-direction:column;align-items:center}
  .작{color:${연};font-size:44px;margin-top:104px;letter-spacing:-1px}
  .큰{color:${진};font-size:76px;font-weight:700;margin-top:16px;letter-spacing:-2px;text-align:center;line-height:1.22}
  .큰 b{color:${짚}}
  /* 📺 폰이 앉을 자리 — 영상은 여기에 겹쳐진다(이 판엔 «빈 자리»만 둔다) */
  .자리{width:866px;height:1541px;margin-top:38px;border-radius:30px;background:#0003;
        box-shadow:0 22px 60px #0006}
  /* 🎬 훅·끝장 */
  .가운데{height:1920px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px}
  /* 🧾 창업자가 뽑아 준 가계부 컷 — 바탕이 «흰색»이라 남색 위에 그냥 두면 흰 네모가 된다.
     ✅ 둥근 카드로 감싸 「종이 한 장」처럼 앉힌다. */
  .펭{width:820px;border-radius:38px;margin-bottom:34px;box-shadow:0 26px 60px #0009}
  .훅작{color:${연};font-size:62px;letter-spacing:-1px}
  .제안{color:${진};font-size:96px;font-weight:700;letter-spacing:-3px;line-height:1.28;text-align:center;margin-top:10px;text-shadow:0 10px 30px #0009}
  .제안밑{color:${짚};font-size:46px;margin-top:26px;letter-spacing:-1px}
  .훅큰{color:${진};font-size:186px;font-weight:700;letter-spacing:-8px;line-height:1.04;margin-top:4px;
        text-shadow:0 12px 36px #0009}
  .훅밑{color:${짚};font-size:56px;margin-top:20px;letter-spacing:-1px}
  .흐름{display:flex;align-items:center;gap:12px;margin-top:62px}
  .흐름 span{color:${연};font-size:44px;border:3px solid ${연}44;border-radius:60px;padding:15px 28px}
  .흐름 span.on{color:#1d2a3c;background:${짚};border-color:${짚};font-weight:700}
  .흐름 i{color:${연}99;font-size:42px;font-style:normal}
  .알약{margin-top:44px;display:flex;align-items:center;gap:20px;border:3px solid ${연}55;border-radius:70px;
        padding:22px 40px;color:${연};font-size:36px;line-height:1.4}
  .알약 img{width:92px;height:92px;border-radius:22px}
  .알약 b{color:${진}}
</style></head><body>${속}</body></html>`

const 장면판 = (c) => 틀(`<div class="판"><div class="작">${c.작}</div><div class="큰">${c.큰}</div><div class="자리"></div></div>`)
// 🎬 훅 — ⛔ 처음엔 글자 셋만 두었더니 «휑했다». 📮 창업자 = *"첫장도 글씨 좀 크고 뚜렷하게. 휑해보여"*
//   🐧 창업자 = *"아니면 애들 뽑아올까? 가계부쓰는 애들?"* → 서랍을 뒤졌다.
//      ⛔ 「가계부 쓰는」 컷은 «없다». 제일 가까운 것 = `ps_01` = **펭펭이 «메모지»와 장바구니를 든 컷**.
//         (`펭펭-장보기-4컷` 중 첫 컷 — 나머지는 시장·카트·봉투라 「적는다」가 안 보인다)
//   ✅ ⑴펭펭을 크게(440px) ⑵글자를 키우고(식비 가계부 186px) ⑶흐름을 «알약 넷»으로 세웠다.
//      말줄(→ 로 이어 쓴 한 줄)은 작아서 안 읽힌다 — 알약이면 멀리서도 네 칸이 보인다.
// 🗣 [2026-09-19 19:3x · 창업자 「제일 처음에 한끼연구소 그거 어디갔어?」] 첫 장 = «제안 문구 ＋ 표지를 한 장에».
//   ⛔ 9/18 22:27 배경·자막을 얹을 때 내가 첫 장을 「한끼에 / 식비 가계부」로 «임의로» 바꿨다 — 창업자가 빼라고 한 적 없다.
//   ✅ 창업자 = *"문구랑 표지를 같은 장에 넣으면?"* → HOOK=A(문구＋표지) · B(＋아래 작게 식비 가계부 알약) 둘을 판으로 보여준다.
const 훅종류 = process.env.HOOK || 'A'
const 제안 = `
  <div class="제안">“식비도 기록할 수 있으면<br>좋겠어요”</div>
  <div class="제안밑">— 한끼 연구소에 온 제안</div>`
//   ＋ HOOK=1 = 창업자 「1번」 = 제안 문구 «한 장»(2초 · 훅0) → 표지＋「식비 가계부」 장(1.8초 · 훅) → 본편
const 훅판 = 훅종류 === '1'
  ? 틀(`<div class="가운데" style="gap:0">
  <img class="펭" src="${가계부컷}">
  <div class="훅작">한끼에</div>
  <div class="훅큰">식비 가계부</div>
  <div class="훅밑">장보기에서 바로 적어요</div>
  <div class="흐름">
    <span>레시피</span><i>›</i><span>장보기</span><i>›</i><span class="on">식비</span><i>›</i><span>냉장고</span>
  </div>
</div>`)
  : 틀(`<div class="가운데" style="gap:0">
  <img class="펭" src="${가계부컷}">
  ${제안}
  ${훅종류 === 'B' ? `<div class="흐름" style="margin-top:54px"><span>레시피</span><i>›</i><span>장보기</span><i>›</i><span class="on">식비</span><i>›</i><span>냉장고</span></div>` : ''}
</div>`)
const 훅0판 = 틀(`<div class="가운데" style="gap:0">${제안}</div>`)
const 끝판 = 틀(`<div class="가운데">
  <!-- ⛔ 「오늘 열려요」로 적었다가 창업자가 잡았다 — 📮 *"이 릴스를 올린 시점은 열렸을거야"*
       ✅ 올리는 시점엔 «이미 열려 있다». 예고는 어제 릴스가 이미 했다. 여기선 «지금 쓰라»고 한다. -->
  <div class="훅큰" style="font-size:112px">지금 쓸 수 있어요</div>
  <div class="훅밑">레시피 보다가 그 자리에서 식비까지</div>
  <div class="알약"><img src="${앱아이콘}"><span>App Store · Google Play 에서<br><b>한끼 레시피북</b> 검색</span></div>
</div>`)

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const p = await (await b.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })).newPage()
const 찍기 = async (이름, html) => {
  await p.setContent(html, { waitUntil: 'load' }); await p.waitForTimeout(350)
  await p.screenshot({ path: join(밖, 이름 + '.png') }); console.log('  🎨', 이름)
}
await 찍기('배경-훅', 훅판)
if (훅종류 === '1') await 찍기('배경-훅0', 훅0판)
for (const c of 자막) await 찍기('배경-' + c.칸, 장면판(c))
await 찍기('배경-끝', 끝판)
await b.close()
console.log('✅ 판 다 찍었다 →', 밖)
