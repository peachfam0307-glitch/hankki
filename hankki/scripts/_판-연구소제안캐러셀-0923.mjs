// 📸 「한끼연구소에 온 제안」 캐러셀 2장 4:5 (1080×1350) — 2026-09-23
//
// 📮 창업자 = *"캐러셀2장도 되니까 정성껏만들어줘 표지1장 내용1장
//    그리고 우리 추가로 길게눌러폴더옮기는거랑 북마크도 같이 홍보하자"*
//
// ⛔ 번호(「제안 2」)를 «안» 붙인다 — 창업자 2026-09-23 = *"번호붙이지말자"*.
//    (1편은 있었다 = 9/19 식비 릴스 · 커밋 8e25546b. 창업자가 알려줬다.)
// ⛔ 「북마크」라고 쓰지 않는다 — 앱에 나가는 이름은 **「해볼 것」(요리사모자) · 「최애」(하트)** 다
//    (favName.js:34 · favPin.js:50). CLAUDE.md = 「같은 기능은 탭이 달라도 같은 이름」.
// ⛔ 1장을 «글자만»으로 만들지 않는다 — 9/19 식비 릴스가 글자 카드로 시작해 평균 3초/39초였다
//    (docs/이벤트-10월한끼레꾸자랑-2026-09-20.md:39). 그래서 표지에도 실물 폰을 크게 넣는다.
// 🖼 폰은 전부 «실물» 캡처다(규칙 30) — _shot-홍보3장면-0923.mjs 가 찍는다.
// 🏪 끝 알약 = App Store · Google Play 영어 표기 (절대원칙 2026-09-16 · check-두스토어 가 본다)
import { chromium } from 'playwright'
import { readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const R = dirname(dirname(fileURLToPath(import.meta.url)))
const 낼곳 = process.env.OUT || '/tmp/claude-0/연구소제안캐러셀'
rmSync(낼곳, { recursive: true, force: true }); mkdirSync(낼곳, { recursive: true })
const b64 = (p) => existsSync(p) ? readFileSync(p).toString('base64') : ''
const png = (p) => { const s = b64(p); return s ? 'data:image/png;base64,' + s : '' }
const 폰트 = b64(join(R, 'src/assets/fonts/gowun-dodum-korean-400.woff2'))
const 폰트L = b64(join(R, 'src/assets/fonts/gowun-dodum-latin-400.woff2'))
const 앱아이콘 = png(join(R, 'public/icons/icon-512-v7.png'))
const S = '/tmp/claude-0/홍보3장면'
// ⛔ ①은 «내 것 칩을 누른» 화면이라야 한다 — 그냥 목록을 쓰면 ③과 같은 그림이 된다(2026-09-23 실물로 보고 고쳤다)
const 컷 = { 내것: png('/tmp/claude-0/내것칩/내것칩-1-내것-누른뒤.png'), 고름: png(`${S}/2a-고른모습.png`), 폴더: png(`${S}/2b-폴더시트.png`), 핀: png(`${S}/3-해볼것최애.png`) }
// 🎨 ⛔유니코드 이모지 금지(절대원칙 · 창업자 2026-07-26) — 앱이 쓰는 그림·아이콘을 그대로 쓴다
const 모자 = png(join(R, 'src/assets/ui/idx_chef.png'))
const 하트 = png(join(R, 'src/assets/ui/idx_heart.png'))
const svg = (d) => `<svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="#8a6a3a" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`
const 표그림 = {
  연필: svg('M4 20h4L18.5 9.5l-4-4L4 16zM13 7l4 4'),                                    // Icon.jsx edit
  폴더: svg('M4 7a2 2 0 0 1 2-2h3l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z'), // Icon.jsx folder
  핀: `<span style="display:inline-flex;align-items:center;gap:4px"><img src="${모자}" style="height:46px"><img src="${하트}" style="height:46px"></span>`,
}
for (const [k, v] of Object.entries(컷)) if (!v) { console.error(`⛔ 캡처 없음: ${k} — scripts/_shot-홍보3장면-0923.mjs 를 먼저 돌린다`); process.exit(1) }

const 바탕 = '#FFFDF7', 진 = '#5d3410', 흐림 = '#a98a6b', 포인트 = '#8a6a3a'
const 머리 = `<style>
 @font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트}) format('woff2');unicode-range:U+AC00-D7A3,U+1100-11FF,U+3130-318F}
 @font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트L}) format('woff2')}
 *{margin:0;padding:0;box-sizing:border-box;font-family:GD,sans-serif;-webkit-font-smoothing:antialiased}
 body{width:1080px;height:1350px;background:${바탕};color:${진};overflow:hidden;position:relative}
 .뱃지{display:inline-block;background:#fff;border:2px solid #efe2cf;border-radius:999px;padding:12px 28px;font-size:29px;color:#7a5a3a}
 .폰{border-radius:26px;border:3px solid #eadfcd;box-shadow:0 18px 44px rgba(90,60,20,.16);object-fit:cover}
 .꼬리{position:absolute;left:0;right:0;bottom:48px;text-align:center}
 .알약{display:inline-flex;align-items:center;gap:14px;background:#fff;border:2px solid #efe2cf;border-radius:999px;padding:16px 30px;font-size:28px;color:#7a5a3a}
 .알약 img{width:46px;height:46px;border-radius:12px}
</style>`

// ── 1장 표지 — 제보 말풍선 ＋ 실물 폰(⛔글자만으로 시작하지 않는다)
const 장1 = `${머리}
<div style="padding:60px 58px 0">
  <div class="뱃지">한끼연구소에 온 제안</div>
  <div style="position:relative;background:#fff;border:3px solid #efe2cf;border-radius:34px;padding:32px 36px;margin-top:20px">
    <div style="font-size:39px;line-height:1.5;letter-spacing:-.5px">“제가쓴 레시피는 따로 폴더나<br>그런것도 만들어주세요 헷갈려요”</div>
    <div style="position:absolute;left:72px;bottom:-19px;width:32px;height:32px;background:#fff;border-right:3px solid #efe2cf;border-bottom:3px solid #efe2cf;transform:rotate(45deg)"></div>
  </div>
  <div style="margin-top:15px;font-size:25px;color:${흐림}">— 한끼를 쓰는 분이 보내주셨어요</div>
  <div style="margin-top:38px;font-size:56px;font-weight:700;letter-spacing:-1.2px;line-height:1.28">그래서 만들었어요.<br><span style="color:${포인트}">내가 담은 것만 따로 보여요</span></div>
</div>
<!-- ⛔ 폰을 아래에 작게 두면 «가운데가 휑하고» 레시피 카드가 잘려서 뭘 보여주는지 안 보인다(2026-09-23 실물로 보고 고쳤다) -->
<img class="폰" src="${컷.내것}" style="position:absolute;left:50%;transform:translateX(-50%);top:688px;width:486px;height:512px;object-position:top">
<div class="꼬리"><span class="알약"><img src="${앱아이콘}">App Store · Google Play 에서 「한끼 레시피북」 검색</span></div>`

// ── 2장 내용 — 셋을 «한 칸씩» (⛔같은 틀에 글자만 바꾸지 않는다 · 짜임을 가른다)
const 칸 = (n, 그림, 제목, 설명, 컷키, 자리) => `
  <div style="display:flex;align-items:center;gap:32px;margin-bottom:30px">
    <div style="flex:0 0 322px"><img class="폰" src="${컷[컷키]}" style="width:322px;height:286px;object-position:${자리}"></div>
    <div style="flex:1">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:8px">
        <span style="display:inline-block;background:${포인트};color:#fff;border-radius:999px;width:44px;height:44px;line-height:44px;text-align:center;font-size:25px">${n}</span>
        ${그림}
      </div>
      <div style="font-size:42px;font-weight:700;letter-spacing:-.8px;line-height:1.26">${제목}</div>
      <div style="margin-top:10px;font-size:29px;color:${흐림};line-height:1.5">${설명}</div>
    </div>
  </div>`
const 장2 = `${머리}
<div style="padding:58px 54px 0">
  <div style="font-size:52px;font-weight:700;letter-spacing:-1.2px;line-height:1.25;margin-bottom:34px">레시피가 쌓여도<br><span style="color:${포인트}">안 헷갈리게</span></div>
  ${칸(1, 표그림.연필, '내 것', '내가 쓰고 가져온 것만<br>모아서 봐요', '내것', 'top')}
  ${칸(2, 표그림.폴더, '꾹 눌러 폴더로', '여러 편을 한 번에<br>옮길 수 있어요', '폴더', 'bottom')}
  ${칸(3, 표그림.핀, '해볼 것 · 최애', '꽂아두면 위에서<br>바로 찾아요', '핀', 'top')}
</div>
<div class="꼬리"><span class="알약"><img src="${앱아이콘}">App Store · Google Play 에서 「한끼 레시피북」 검색</span></div>`

const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 })
for (const [i, html] of [장1, 장2].entries()) {
  await p.setContent(html, { waitUntil: 'networkidle' }); await p.waitForTimeout(350)
  await p.screenshot({ path: join(낼곳, `${i + 1}장.png`) })
}
await b.close(); console.log('저장 →', 낼곳)
