// 📸 새 기능 캐러셀 4:5 (1080×1350) — 「한끼에 새로 생긴 것」 (2026-10-29)
//
// 📮 창업자 = *"아쥬 좋아 다 반영해서 구워주고 오늘 한것들 인스타 캐러셀 만들자"*
// 오늘 한 것 = 📌 메모 붙이기 · 🔍 홈 검색 초성·꽂이 · 🆕 새 소개화면(오트 라떼)
// ⚠️ 이 기능들은 아이폰 86판 승인 뒤에 열린다(웹·갤럭시는 「같이 밀자」 때) — 올리는 날은 열린 뒤로 잡는다
// 🎨 색 = 새 소개화면과 같은 오트 라떼(#F4DEAF / #3F1D12) — 한 얼굴로 보이게
// 📸 앱 화면은 스크래치패드에서 받는다(SHOTS=<폴더>) — 핼러윈 끈 그레이지·11/12 날짜로 찍은 것
//    memo2/n-3.png(메모 붙임) · app5/새검색.png · onbnew/a1.png · onbnew/a7.png
// 📌 끝 장 = 고정멘트 「오늘도 한끼하세요」 ＋ 두 스토어(절대원칙 2026-09-16)
import { chromium } from 'playwright'
import { readFileSync, mkdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const R = dirname(dirname(fileURLToPath(import.meta.url)))
const 찍은곳 = process.env.SHOTS
if (!찍은곳) throw new Error('SHOTS=<스크래치패드 폴더> 가 필요하다')
const 낼곳 = process.env.OUT || join(찍은곳, '새기능캐러셀')
rmSync(낼곳, { recursive: true, force: true }); mkdirSync(낼곳, { recursive: true })

const 사진 = (p) => 'data:image/png;base64,' + readFileSync(join(찍은곳, p)).toString('base64')
const 파일 = (p) => 'data:image/png;base64,' + readFileSync(join(R, p)).toString('base64')
const 폰트 = readFileSync(join(R, 'src/assets/fonts/gowun-dodum-korean-400.woff2')).toString('base64')
const 폰트L = readFileSync(join(R, 'src/assets/fonts/gowun-dodum-latin-400.woff2')).toString('base64')

// 🎨 색 = PAL="바탕,글씨,점" 으로 바꿔 찍는다(창업자 2026-10-29 「한끼 소개랑 캐러셀색이 너무 똑같아서」 → 후보 넷 · docs/색조합-참고-릴스-2026-10-23.md)
const [바탕, 진, 점] = (process.env.PAL || '#FFEDAB,#75070C,#a3343a').split(',')   // ✅ 창업자 2026-10-29 「3번」= 버터 와인
const 머리 = `<style>
  @font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트}) format('woff2');unicode-range:U+AC00-D7A3,U+1100-11FF,U+3130-318F}
  @font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트L}) format('woff2')}
  *{margin:0;padding:0;box-sizing:border-box;font-family:GD,sans-serif;-webkit-font-smoothing:antialiased}
  body{width:1080px;height:1350px;background:${바탕};color:${진};overflow:hidden;position:relative}
  .k{font-size:34px;letter-spacing:.06em;color:${점};font-weight:700}
  h1{font-size:82px;line-height:1.25;letter-spacing:-2px;margin:16px 0 18px;font-weight:700}
  .s{font-size:38px;line-height:1.5;opacity:.85}
  .폰{position:absolute;left:50%;transform:translateX(-50%);border:16px solid ${진};border-bottom:0;border-radius:64px 64px 0 0;overflow:hidden;background:#f4f1ea}
  .폰 img{display:block;width:100%}
</style>`
const 글 = (k, h, s) => `<div style="position:absolute;left:90px;right:90px;top:110px"><div class="k">${k}</div><h1>${h}</h1><div class="s">${s}</div></div>`

const 장들 = [
  // 1 표지
  `${머리}<div style="position:absolute;left:0;right:0;top:150px;text-align:center">
     <div class="k">한끼 소식</div><h1 style="font-size:96px">한끼에<br>새로 생긴 것</h1>
     <div class="s" style="font-size:42px;line-height:1.75">레시피에 메모 붙이기<br>ㄷㅂ만 쳐도 찾는 검색</div></div>
   <div style="position:absolute;left:140px;width:800px;bottom:90px;background:#f9f9f9;border-radius:48px;overflow:hidden"><img src="${파일('src/assets/cast/lineup5.png')}" style="display:block;width:100%"></div>`,
  // 2 메모 붙이기
  `${머리}${글('메모 붙이기', '레시피에 메모를<br>언제든 붙여요', '나만의 레시피 메모 · 재료 옆에 포스트잇으로')}
   <div class="폰" style="top:560px;width:720px;height:790px"><img src="${사진('memo2/n-3.png')}" style="margin-top:-108%"></div>`,
  // 3 검색
  `${머리}${글('홈 검색', 'ㄷㅂ만 쳐도<br>찾아요', '두부·덮밥… 초성으로 찾고 바로 꽂아 둬요')}
   <div class="폰" style="top:560px;width:720px;height:790px"><img src="${사진('app5/새검색.png')}" style="margin-top:-12%"></div>`,
  // (새 첫 화면 장은 뺐다 — 창업자 2026-10-29 「새로온 소개는 빼자」)
  // 5 끝 — 고정멘트 ＋ 두 스토어
  `${머리}<div style="position:absolute;left:0;right:0;top:300px;text-align:center;font-size:84px;font-weight:700">오늘도 한끼하세요</div>
   <div style="position:absolute;left:190px;width:700px;top:470px;background:#f9f9f9;border-radius:48px;overflow:hidden"><img src="${파일('src/assets/cast/lineup5.png')}" style="display:block;width:100%"></div>
   <div style="position:absolute;left:0;right:0;bottom:170px;display:flex;justify-content:center">
     <div style="display:inline-flex;align-items:center;gap:18px;background:#fff;border-radius:999px;padding:18px 34px 18px 18px;font-size:36px">
       <img src="${파일('public/icons/icon-192-v7.png')}" style="width:76px;height:76px;border-radius:20px">
       <span>App Store · Google Play 에서 <b>「한끼 레시피북」</b> 검색</span></div></div>`,
]

const 브 = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const p = await 브.newPage({ viewport: { width: 1080, height: 1350 } })
for (const [i, h] of 장들.entries()) {
  await p.setContent(h, { waitUntil: 'load' }); await p.waitForTimeout(300)
  await p.screenshot({ path: join(낼곳, `${i + 1}.png`) })
}
await 브.close()
console.log('✅', 장들.length, '장 →', 낼곳)
