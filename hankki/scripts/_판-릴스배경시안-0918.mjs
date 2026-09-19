// 🎨 릴스 배경 무늬·색 시안 (2026-09-18) — 창업자 «배경짜임이랑 색 바꾸자» · «무늬같은거»
//   ⭐ 미감은 창업자가 판정한다(규칙 11) — 내가 고르지 않고 «나란히 놓아» 보여준다(절대원칙: 붙여 놓고 비교).
//   ⛔ 유니코드 이모지를 무늬로 쓰지 않는다(절대원칙) — 전부 CSS 로 그린다.
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const R = dirname(dirname(fileURLToPath(import.meta.url)))
const 밖 = process.env.OUT || '/tmp/claude-0/릴스배경시안-0918.png'
const 짐 = (p) => 'data:image/png;base64,' + readFileSync(p).toString('base64')
const 앱아이콘 = 짐(join(R, 'public/icons/icon-512-v7.png'))
const 폰트 = readFileSync(join(R, 'src/assets/fonts/gowun-dodum-korean-400.woff2')).toString('base64')
const 폰트L = readFileSync(join(R, 'src/assets/fonts/gowun-dodum-latin-400.woff2')).toString('base64')

// 🎨 후보 — 「바탕색 · 무늬 · 글자색」 한 벌
const 후보 = [
  { 이름: 'ⓐ 지금 (민무늬 크림)', 바탕: '#FFFDF7', 진: '#5d3410', 연: '#a98a6b', 무늬: 'none' },
  { 이름: 'ⓑ 크림 ＋ 잔점', 바탕: '#FBF4E6', 진: '#5d3410', 연: '#a98a6b',
    무늬: 'radial-gradient(#e4d3b4 3px, transparent 3.5px)', 칸: '46px 46px' },
  { 이름: 'ⓒ 식탁보 체크', 바탕: '#FBF3E4', 진: '#5d3410', 연: '#a3855f',
    무늬: 'repeating-linear-gradient(0deg,#efe0c6 0 3px,transparent 3px 64px),repeating-linear-gradient(90deg,#efe0c6 0 3px,transparent 3px 64px)' },
  { 이름: 'ⓓ 연한 하늘 ＋ 사선', 바탕: '#EDF3FA', 진: '#2f4a6d', 연: '#7d93b0',
    무늬: 'repeating-linear-gradient(45deg,#dfe9f6 0 6px,transparent 6px 34px)' },
  { 이름: 'ⓔ 세이지 ＋ 잔점', 바탕: '#EDF3EC', 진: '#2f5040', 연: '#7d9a8a',
    무늬: 'radial-gradient(#d4e3d3 3px, transparent 3.5px)', 칸: '46px 46px' },
  { 이름: 'ⓕ 살구 ＋ 물결', 바탕: '#FDF0E6', 진: '#7a3f1d', 연: '#bb8b6a',
    무늬: 'repeating-radial-gradient(circle at 0 0,transparent 0 26px,#f6e0cd 26px 29px)', 칸: '80px 80px' },
]

const 칸 = (c) => `
<div class="칸">
  <div class="판" style="background-color:${c.바탕};${c.무늬 === 'none' ? '' : `background-image:${c.무늬};background-size:${c.칸 || 'auto'}`}">
    <div class="작" style="color:${c.연}">한끼에</div>
    <div class="큰" style="color:${c.진}">식비 가계부</div>
    <div class="작2" style="color:${c.연}">곧 나와요</div>
    <div class="알약" style="color:${c.연};border-color:${c.연}33">
      <img src="${앱아이콘}"><span>App Store · Google Play 에서<br><b style="color:${c.진}">한끼 레시피북</b> 검색</span>
    </div>
  </div>
  <div class="이름">${c.이름}</div>
</div>`

const html = `<!doctype html><html><head><style>
  @font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트}) format('woff2');unicode-range:U+AC00-D7A3,U+1100-11FF,U+3130-318F}
  @font-face{font-family:GD;src:url(data:font/woff2;base64,${폰트L}) format('woff2')}
  *{margin:0;padding:0;box-sizing:border-box;font-family:GD,sans-serif}
  body{background:#2b2b33;padding:30px;display:flex;flex-wrap:wrap;gap:26px;width:1320px}
  .칸{width:400px}
  .판{width:400px;height:711px;border-radius:18px;overflow:hidden;position:relative;display:flex;
      flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:30px}
  .큰{font-size:64px;font-weight:700;letter-spacing:-1px}
  .작{font-size:26px}
  .작2{font-size:30px;font-weight:700}
  .알약{position:absolute;bottom:40px;display:inline-flex;align-items:center;gap:8px;background:#fff;
        border:2px solid;border-radius:999px;padding:11px 22px;font-size:20px;line-height:1.3;text-align:left}
  .알약 img{width:44px;height:44px;border-radius:12px}
  .이름{color:#fff;font-size:22px;padding:10px 4px}
</style></head><body>${후보.map(칸).join('')}</body></html>`

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const p = await (await b.newContext({ viewport: { width: 1320, height: 1600 }, deviceScaleFactor: 2 })).newPage()
await p.setContent(html); await p.waitForTimeout(600)
await p.screenshot({ path: 밖, fullPage: true })
await b.close()
console.log('📸', 밖)
