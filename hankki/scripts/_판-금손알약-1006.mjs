// 🎃 레꾸자랑 표지 «주황 알약» 시안 셋 — 「금손 모십니다 판 보여줘 좀 안촌스럽게 해줄래」(창업자 2026-10-06)
// 지금 표지(릴스 2.85초 프레임) 위에서 알약 자리만 배경 원본으로 덮고 시안을 얹는다 → 나란히 한 장
// 쓰는 법: FRAME=<표지 프레임 png> OUT=<낼 png> SMOKE_CHROMIUM=… node scripts/_판-금손알약-1006.mjs
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const 앱 = dirname(dirname(fileURLToPath(import.meta.url)))
const 짐 = (p) => 'data:image/png;base64,' + readFileSync(p).toString('base64')
const 폰 = (n) => readFileSync(join(앱, 'src/assets/fonts', n)).toString('base64')
const 판 = 짐(process.env.FRAME), 원본 = 짐(join(앱, 'design/promo/인스타-2610/배경-레꾸자랑-gpt원본.png'))
const 머리 = `<style>@font-face{font-family:BH;src:url(data:font/woff2;base64,${폰('blackhansans-korean-400.woff2')})}@font-face{font-family:JU;src:url(data:font/woff2;base64,${폰('jua-korean-400.woff2')})}
*{margin:0;box-sizing:border-box}body{display:flex;gap:30px;background:#111;padding:30px}
.칸{width:1080px;height:1920px;position:relative;overflow:hidden;background:url(${판}) 0 0/1080px 1920px}
.덮{position:absolute;left:0;right:0;top:365px;height:150px;background:linear-gradient(rgba(25,10,45,.42),rgba(25,10,45,.31)),url(${원본}) 0 -365px/1080px 1920px}
.자리{position:absolute;left:0;right:0;top:382px;height:100px;display:flex;align-items:center;justify-content:center}
.이름{position:absolute;left:0;right:0;bottom:30px;text-align:center;font:700 60px sans-serif;color:#fff;background:rgba(0,0,0,.6);padding:16px}
.A{font-family:JU;font-size:52px;color:#ffe3b5;letter-spacing:3px;padding:12px 46px;border:3px solid #ffb347;border-radius:999px;background:rgba(30,12,50,.55);box-shadow:0 0 24px rgba(255,160,60,.35)}
.B{display:flex;align-items:center;gap:26px;font-family:JU;font-size:56px;color:#ffcf7a;letter-spacing:4px;text-shadow:0 2px 14px rgba(0,0,0,.6)}.B i{display:block;width:120px;height:3px;background:linear-gradient(90deg,transparent,#ffcf7a)}.B i:last-child{transform:scaleX(-1)}
.C{font-family:BH;font-size:70px;letter-spacing:2px;background:linear-gradient(180deg,#fff3c4 0%,#ffcf6b 45%,#e8962e 100%);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 4px 0 #5a2588) drop-shadow(0 0 18px rgba(255,190,90,.45))}</style>`
const 칸 = (안, 이름) => `<div class="칸"><div class="덮"></div><div class="자리">${안}</div><div class="이름">${이름}</div></div>`
const html = `<!doctype html><html><head>${머리}</head><body>
${칸('<span style="display:inline-block;background:#ff7a1a;color:#fff;font-family:BH;font-size:60px;padding:14px 44px;border-radius:999px;transform:rotate(-2deg)">꾸미기 금손 모십니다</span>', '지금')}
${칸('<span class="A">꾸미기 금손 모십니다</span>', 'A · 얇은 금테')}
${칸('<span class="B"><i></i>꾸미기 금손 모십니다<i></i></span>', 'B · 양옆 금선')}
${칸('<span class="C">꾸미기 금손 모십니다</span>', 'C · 금빛 글자')}
</body></html>`
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const pg = await (await b.newContext({ viewport: { width: 4470, height: 1980 } })).newPage()
await pg.setContent(html); await pg.waitForTimeout(500)
await pg.screenshot({ path: process.env.OUT }); await b.close()
console.log('✅', process.env.OUT)
