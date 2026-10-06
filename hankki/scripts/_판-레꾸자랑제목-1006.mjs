// 🎃 레꾸자랑 표지 «제목 구성» 시안 — 「제목쪽을 좀 바꿀수는 없나 글씨체나 구성이라도」·「디자인구성」(창업자 2026-10-06)
// 지금 표지(릴스 2.85초 프레임) 위 0~660px 를 배경 원본으로 덮고 제목 덩어리만 갈아 끼운다 → 나란히 한 장
// 쓰는 법: FRAME=<표지 프레임 png> OUT=<낼 png> SMOKE_CHROMIUM=… node scripts/_판-레꾸자랑제목-1006.mjs
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const 앱 = dirname(dirname(fileURLToPath(import.meta.url)))
const 짐 = (p) => 'data:image/png;base64,' + readFileSync(p).toString('base64')
const 폰 = (n) => readFileSync(join(앱, 'src/assets/fonts', n)).toString('base64')
const 글 = (f, n) => `@font-face{font-family:${f};src:url(data:font/woff2;base64,${폰(n + '-korean-400.woff2')})}@font-face{font-family:${f};src:url(data:font/woff2;base64,${폰(n + '-latin-400.woff2')})}`
const 판 = 짐(process.env.FRAME), 원본 = 짐(join(앱, 'design/promo/인스타-2610/배경-레꾸자랑-gpt원본.png'))
const 머리 = `<style>${글('BH', 'blackhansans')}${글('JU', 'jua')}${글('DH', 'dohyeon')}${글('SD', 'singleday')}${글('GD', 'gowun-dodum')}
*{margin:0;box-sizing:border-box}body{display:flex;gap:30px;background:#111;padding:30px}
.칸{width:1080px;height:1920px;position:relative;overflow:hidden;background:url(${판}) 0 0/1080px 1920px}
.덮{position:absolute;left:0;right:0;top:0;height:720px;background:linear-gradient(rgba(25,10,45,.7),rgba(25,10,45,.14)),url(${원본}) 0 0/1080px 1920px;-webkit-mask:linear-gradient(#000 93%,transparent)}
.이름{position:absolute;left:0;right:0;bottom:30px;text-align:center;font:700 60px sans-serif;color:#fff;background:rgba(0,0,0,.6);padding:16px}
.가{position:absolute;inset:0;text-align:center;color:#fff}
.선{display:flex;align-items:center;justify-content:center;gap:24px}.선 i{display:block;width:110px;height:3px;background:linear-gradient(90deg,transparent,#ffcf7a)}.선 i:last-child{transform:scaleX(-1)}
</style>`
const 칸 = (안, 이름) => `<div class="칸"><div class="덮"></div>${안}<div class="이름">${이름}</div></div>`

// 지금 = 덮지 않는다
const 지금 = `<div class="칸"><div class="이름">지금</div></div>`
// A · 포스터 — 작은 영문 머리줄 · 깔끔한 도현체 큰 제목 · 날짜는 얇은 금테 상자
const A = `<div class="가">
  <div style="position:absolute;top:110px;left:0;right:0;font-family:GD;font-size:34px;letter-spacing:14px;color:#ffcf7a">HANKKI · HALLOWEEN</div>
  <div style="position:absolute;top:170px;left:0;right:0;font-family:DH;font-size:200px;line-height:1;letter-spacing:-4px;text-shadow:0 8px 30px rgba(0,0,0,.55)">레꾸자랑</div>
  <div class="선" style="position:absolute;top:410px;left:0;right:0;font-family:JU;font-size:54px;letter-spacing:4px;color:#ffe3b5"><i></i>꾸미기 금손 모십니다<i></i></div>
  <div style="position:absolute;top:500px;left:50%;transform:translateX(-50%);font-family:DH;font-size:84px;letter-spacing:2px;color:#fff;border:3px solid #ffb347;border-radius:24px;padding:6px 40px;white-space:nowrap;background:rgba(30,12,50,.5)">10.16 — 10.26</div>
</div>`
// B · 손글씨 — 「10월 한끼」 작게 · 손글씨 큰 제목(주황 테) · 금손은 금빛 글자 · 날짜 굵게
const B = `<div class="가">
  <div style="position:absolute;top:95px;left:0;right:0;font-family:JU;font-size:60px;color:#ffb347">10월 한끼</div>
  <div style="position:absolute;top:150px;left:0;right:0;font-family:SD;font-size:230px;line-height:1;color:#fff;-webkit-text-stroke:8px #ff7a1a;paint-order:stroke fill;text-shadow:0 10px 30px rgba(0,0,0,.5);transform:rotate(-3deg)">레꾸자랑</div>
  <div style="position:absolute;top:420px;left:0;right:0;font-family:BH;font-size:62px;letter-spacing:2px;background:linear-gradient(180deg,#fff3c4,#ffcf6b 45%,#e8962e);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 4px 0 #5a2588)">꾸미기 금손 모십니다</div>
  <div style="position:absolute;top:510px;left:0;right:0;font-family:BH;font-size:100px;color:#fff;text-shadow:0 6px 0 #ff7a1a,0 12px 30px rgba(0,0,0,.5)">10.16 ~ 10.26</div>
</div>`
// C · 왼쪽 정렬 매거진 — 두 줄 큰 제목 · 주황 막대 · 날짜·금손을 작은 덩어리로
const C = `<div class="가" style="text-align:left">
  <div style="position:absolute;top:100px;left:80px;font-family:BH;font-size:150px;line-height:1.02;letter-spacing:-2px;text-shadow:0 8px 30px rgba(0,0,0,.55)"><span style="color:#ffb347">10월 한끼</span><br>레꾸자랑</div>
  <div style="position:absolute;top:440px;left:80px;width:120px;height:10px;border-radius:5px;background:#ff7a1a"></div>
  <div style="position:absolute;top:478px;left:80px;font-family:JU;font-size:54px;color:#ffe3b5;letter-spacing:2px">꾸미기 금손 모십니다</div>
  <div style="position:absolute;top:548px;left:80px;font-family:DH;font-size:76px;color:#fff;letter-spacing:2px">10.16 — 10.26</div>
</div>`
const html = `<!doctype html><html><head>${머리}</head><body>${지금}${칸(A, 'A · 포스터')}${칸(B, 'B · 손글씨')}${칸(C, 'C · 왼쪽 정렬')}</body></html>`
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const pg = await (await b.newContext({ viewport: { width: 4470, height: 1980 } })).newPage()
await pg.setContent(html); await pg.waitForTimeout(600)
await pg.screenshot({ path: process.env.OUT }); await b.close()
console.log('✅', process.env.OUT)
