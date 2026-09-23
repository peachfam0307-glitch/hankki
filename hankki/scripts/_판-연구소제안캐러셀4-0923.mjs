// 📸 「한끼연구소에 온 제안」 캐러셀 «4장» 4:5 (1080×1350) — 2026-09-23
//
// 📮 창업자 = *"캐러셀을 한장씩 더 만들자 너무 잘 안보여"*
// ⛔⛔ 2장 판은 한 장에 기능 셋을 욱여넣어 폰이 322px 로 작아졌다 — 글자가 안 읽혔다.
//    → **기능마다 한 장**을 주고 폰을 «크게» 놓는다(2~4장 = 폭 620px · 2배 가까이).
// ⛔ 유니코드 이모지 금지(절대원칙 2026-07-26) — 앱이 쓰는 그림·아이콘 그대로.
// ⛔ 「북마크」라고 쓰지 않는다 — 앱 이름은 「해볼 것」(요리사모자)·「최애」(하트)(favName.js:34·favPin.js:50).
// 🏪 끝 알약 = App Store · Google Play 영어 표기 (절대원칙 2026-09-16) — 1장과 마지막 장에 둔다.
import { chromium } from 'playwright'
import { readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const R = dirname(dirname(fileURLToPath(import.meta.url)))
const 낼곳 = process.env.OUT || '/tmp/claude-0/연구소제안캐러셀4'
rmSync(낼곳, { recursive: true, force: true }); mkdirSync(낼곳, { recursive: true })
const b64 = (p) => existsSync(p) ? readFileSync(p).toString('base64') : ''
const png = (p) => { const s = b64(p); return s ? 'data:image/png;base64,' + s : '' }
const 폰트 = b64(join(R, 'src/assets/fonts/gowun-dodum-korean-400.woff2'))
const 폰트L = b64(join(R, 'src/assets/fonts/gowun-dodum-latin-400.woff2'))
const 앱아이콘 = png(join(R, 'public/icons/icon-512-v7.png'))
const 모자 = png(join(R, 'src/assets/ui/idx_chef.png'))
const 하트 = png(join(R, 'src/assets/ui/idx_heart.png'))
const S = '/tmp/claude-0/홍보3장면'
const 컷 = { 내것: png('/tmp/claude-0/내것칩/내것칩-1-내것-누른뒤.png'), 고름: png(`${S}/2a-고른모습.png`), 폴더: png(`${S}/2b-폴더시트.png`), 핀: png(`${S}/3-해볼것최애.png`) }
for (const [k, v] of Object.entries(컷)) if (!v) { console.error(`⛔ 캡처 없음: ${k}`); process.exit(1) }

const 바탕 = '#FFFDF7', 진 = '#5d3410', 흐림 = '#a98a6b', 포인트 = '#8a6a3a'
const 머리 = `<style>
 @font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트}) format('woff2');unicode-range:U+AC00-D7A3,U+1100-11FF,U+3130-318F}
 @font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트L}) format('woff2')}
 *{margin:0;padding:0;box-sizing:border-box;font-family:GD,sans-serif;-webkit-font-smoothing:antialiased}
 body{width:1080px;height:1350px;background:${바탕};color:${진};overflow:hidden;position:relative}
 .뱃지{display:inline-block;background:#fff;border:2px solid #efe2cf;border-radius:999px;padding:12px 28px;font-size:29px;color:#7a5a3a}
 .폰{border-radius:30px;border:3px solid #eadfcd;box-shadow:0 20px 50px rgba(90,60,20,.18);object-fit:cover}
 .꼬리{position:absolute;left:0;right:0;bottom:46px;text-align:center}
 .알약{display:inline-flex;align-items:center;gap:14px;background:#fff;border:2px solid #efe2cf;border-radius:999px;padding:16px 30px;font-size:28px;color:#7a5a3a}
 .알약 img{width:46px;height:46px;border-radius:12px}
 .쪽{position:absolute;right:52px;top:52px;font-size:26px;color:${흐림}}
</style>`
const svg1 = (d) => `<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="${포인트}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`
const svg = (d) => `<svg viewBox="0 0 24 24" width="54" height="54" fill="none" stroke="${포인트}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`
const 알약 = `<div class="꼬리"><span class="알약"><img src="${앱아이콘}">App Store · Google Play 에서 「한끼 레시피북」 검색</span></div>`

// ── 1장 표지
const 장1 = `${머리}
<!-- ⭐ 표지는 덩이가 하나뿐이라 «세로 가운데»로 놓는다 — 위에 붙이면 아래가 절반 비어 허전하다(2026-09-23 실물로 보고 고쳤다) -->
<div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:0 58px">
  <div class="뱃지">한끼연구소에 온 제안</div>
  <div style="position:relative;background:#fff;border:3px solid #efe2cf;border-radius:34px;padding:34px 38px;margin-top:22px">
    <div style="font-size:41px;line-height:1.5;letter-spacing:-.5px">“제가쓴 레시피는 따로 폴더나<br>그런것도 만들어주세요 헷갈려요”</div>
    <div style="position:absolute;left:72px;bottom:-19px;width:32px;height:32px;background:#fff;border-right:3px solid #efe2cf;border-bottom:3px solid #efe2cf;transform:rotate(45deg)"></div>
  </div>
  <div style="margin-top:16px;font-size:26px;color:${흐림}">— 한끼를 쓰는 분이 보내주셨어요</div>
  <!-- ⛔ 표지에 더 얹지 않는다 — 창업자 2026-09-23 = *"한장에 너무 많은 내용이 들어가서 정신없게 느껴져"*
       제보 한 덩이 ＋ 한 마디. 폰도 설명도 뺐다(2~4장이 그걸 한 장씩 맡는다). -->
  <!-- 🧩 [창업자 2026-09-23 ②] *"그래서 만들었어요 까지를 좀 다르게 눈에 들어오게 해봐"*
       ⛔ 앞 판은 제보도 이 한 마디도 «같은 바탕 위 검은 글씨»라 한 덩어리로 흘러갔다.
       → 이 한 마디만 «색을 뒤집는다»(진한 판 · 연한 글씨). 위(남이 한 말)와 아래(우리가 만든 것)가 여기서 갈린다. -->
  <div style="margin-top:36px;background:${진};color:#FFF6E6;border-radius:30px;padding:32px 44px;box-shadow:0 16px 34px rgba(90,60,20,.22)">
    <div style="font-size:26px;color:#e6cba6;letter-spacing:.5px">한끼가 답했습니다</div>
    <div style="margin-top:12px;font-size:70px;font-weight:700;letter-spacing:-1.8px;line-height:1.2">그래서 만들었어요.</div>
  </div>
  <!-- 🧩 [창업자 2026-09-23] *"1번 좀 휑해"* — 아래 절반이 비어 있었다.
       → 만든 것 «셋»을 줄로 세워 미리 보여준다(2·3·4장이 한 장씩 맡는 것과 «같은 차례·같은 그림»). -->
  <!-- 🧩 [창업자 2026-09-23] *"1번은 좀더 세련되게 만들어줄수있어? 지금은 지저분해보여."*
       ⛔ 앞 판은 «흰 네모 상자 셋 ＋ 아이콘 셋»이 글줄마다 붙어 눈이 여섯 번 멈췄다.
       → 상자와 아이콘을 «다 뺐다». 가는 선 하나 아래 짧은 글줄 셋만 — 세는 것은 글자 하나뿐이다. -->
  <!-- 🧩 [창업자 2026-09-23 ②] *"1번이 너무 글자가 작고 많고 다닥다닥 비슷하게 붙어있어"*
       ⛔ 앞 판은 33px 글줄 «셋»이 같은 크기·같은 색·같은 길이로 붙어 있어 한 덩어리로 보였다.
       → ⑴ 줄마다 «큰 이름»(46px 진한색)과 «작은 설명»(29px 흐린색)으로 층을 나눴다
         ⑵ 글자를 키우고 줄 사이를 22 → 40px 로 벌렸다
         ⑶ 글월을 «이름 한 마디»로 줄였다 — 읽을 것이 셋이 아니라 «세 낱말»이다. -->
  <div style="margin-top:40px;padding-top:34px;border-top:2px solid #eee2cf;display:flex;flex-direction:column;gap:30px">
    <div><div style="font-size:46px;font-weight:700;letter-spacing:-1px">내 것</div><div style="margin-top:6px;font-size:29px;color:${흐림}">내가 담은 편만 모아서</div></div>
    <div><div style="font-size:46px;font-weight:700;letter-spacing:-1px">폴더</div><div style="margin-top:6px;font-size:29px;color:${흐림}">꾹 눌러 여러 편을 한 번에</div></div>
    <div><div style="font-size:46px;font-weight:700;letter-spacing:-1px">해볼 것 · 최애</div><div style="margin-top:6px;font-size:29px;color:${흐림}">꽂아두면 맨 위에서 바로</div></div>
  </div>
</div>
${알약}`

// ── 2~4장 = 기능 한 장씩 (폰을 «크게»)
// 📐 폰 크기를 «장마다» 다르게 — 보여줄 것이 세로로 긴 장(목록)과 가로로 넓은 장(시트)이 다르다.
//   ⛔ 다 같은 네모로 두면 목록 장은 칩 줄만 크게 잘려 «정작 레시피가 안 보인다»(2026-09-23 실물로 보고 고쳤다).
// 🧩 [창업자 2026-09-23] *"2번은 제목 좀 내리자 · 3번은 제목 내리고 ui더 크게하고 위로 올려 · 4번은 ui도 더 크게"*
//   → 머리를 66 → 104px 로 «내리고», 폰을 장마다 키웠다(2장 470→530 · 3장 650→790 · 4장 470→560).
//   ⛔ 3장은 «위로» 올린다 = 바닥 띄움을 64 → 124px 로 «키운다»(bottom 이 커질수록 위로 간다).
const 폰크기 = { 2: [530, 800], 3: [790, 740], 4: [560, 720] }
const 폰바닥 = { 2: 46, 3: 124, 4: 168 }
// 🔦 [창업자 2026-09-23] 폰 그림 «위»에 덧칠하는 것 — 자리는 폰 네모에 대한 «비율»로 적는다.
//   📮 2장 = *"내것에도 효과를 줘. 내가 담은것이 내 것 폴더인지 우리는 알지만 사람들은 모르자나"*
//      → 「내 것」 칩이 그냥 칩 셋 중 하나로 보인다. 고리를 둘러 «여기를 보라»고 찍어 준다.
//   📮 3장 = *"글자만 안보이게 해줘"* → 시트에 반쯤 잘린 카드 제목 띠를 흐리게 덮는다(⛔지우지 않고 뭉갠다).
//   📮 4장 = *"ui에 핀에도 효과를 줄래? 작아서 잘 안보여"* → 카드에 꽂힌 작은 핀 둘에 고리를 두른다.
//   ⛔ 값은 «렌더한 그림을 열어 재서» 넣었다 — 짐작이 아니다(2026-09-23).
const 고리 = (x, y, w, h, 색 = 'rgba(200,120,40,.85)') =>
  `<span style="position:absolute;left:${x}%;top:${y}%;width:${w}px;height:${h}px;transform:translate(-50%,-50%);border:4px solid ${색};border-radius:999px;box-shadow:0 0 0 7px rgba(255,255,255,.55),0 0 26px 10px rgba(226,150,60,.45)"></span>`
const 덧칠 = {
  2: 고리(50, 34.9, 186, 70),
  3: `<span style="position:absolute;left:0;right:0;top:34%;height:10%;backdrop-filter:blur(13px)"></span>`,
  4: 고리(42.3, 60.4, 78, 78) + 고리(88.4, 60.4, 78, 78, 'rgba(214,110,95,.85)'),
}
const 기능장 = (n, 그림, 제목, 설명, 컷키, 자리) => `${머리}
<div class="쪽">${n} / 4</div>
<div style="padding:104px 58px 0">
  <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px">${그림}</div>
  <div style="font-size:60px;font-weight:700;letter-spacing:-1.4px;line-height:1.24">${제목}</div>
  <div style="margin-top:16px;font-size:34px;color:${흐림};line-height:1.5">${설명}</div>
</div>
<div style="position:absolute;left:50%;transform:translateX(-50%);bottom:${폰바닥[n]}px;width:${폰크기[n][0]}px;height:${폰크기[n][1]}px">
  <img class="폰" src="${컷[컷키]}" style="width:100%;height:100%;object-position:${자리}">
  ${덧칠[n] || ''}
</div>
${n === 4 ? 알약 : ''}`

const 장2 = 기능장(2, svg('M4 20h4L18.5 9.5l-4-4L4 16zM13 7l4 4'), '내가 담은 것만<br>따로 봐요', '내가 쓴 것도, 인스타·유튜브에서<br>가져온 것도 한 칸에', '내것', 'top')
const 장3 = 기능장(3, svg('M4 7a2 2 0 0 1 2-2h3l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z'), '꾹 눌러<br>폴더로 옮겨요', '여러 편을 골라서 한 번에.<br>새 폴더도 그 자리에서', '폴더', 'bottom')
// 🧩 [창업자 2026-09-23] *"4번은 요리사랑 하트핀 크게. 오른쪽으로 배치하고 ui도 더 크게 핀들 효과로 강조해줘."*
//   → 머리 왼쪽에 54px 로 얹혀 있던 핀 둘을 «오른쪽 큰 그림»으로 빼고(148px · 2.7배),
//     뒤에 둥근 빛을 깔아 눈이 먼저 가게 했다. 제목 자리는 빈 칸(높이 54px)으로 그대로 둔다.
const 핀강조 = (그림, 색) => `<span style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:186px;height:186px">
  <span style="position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle, ${색} 0%, rgba(255,255,255,0) 70%)"></span>
  <img src="${그림}" style="position:relative;height:148px;filter:drop-shadow(0 10px 18px rgba(90,60,20,.22))">
</span>`
const 장4 = 기능장(4, `<div style="height:54px"></div><div style="position:absolute;right:30px;top:112px;display:flex;align-items:center;gap:6px">${핀강조(모자, 'rgba(226,196,150,.55)')}${핀강조(하트, 'rgba(230,150,140,.5)')}</div>`, '해볼 것 · 최애로<br>꽂아둬요', '꽂아두면 맨 위에서<br>바로 찾아요', '핀', 'top')

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 })
for (const [i, html] of [장1, 장2, 장3, 장4].entries()) {
  await p.setContent(html, { waitUntil: 'networkidle' }); await p.waitForTimeout(350)
  await p.screenshot({ path: join(낼곳, `${i + 1}장.png`) })
}
await b.close(); console.log('저장 →', 낼곳)
