// 🎨 릴스 배경 무늬·색 시안 (2026-09-18) — 창업자 «배경짜임이랑 색 바꾸자» · «무늬같은거»
//   ⭐ 미감은 창업자가 판정한다(규칙 11) — 내가 고르지 않고 «나란히 놓아» 보여준다(절대원칙: 붙여 놓고 비교).
//   ⛔ 유니코드 이모지를 무늬로 쓰지 않는다(절대원칙) — 전부 CSS 로 그린다.
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const R = dirname(dirname(fileURLToPath(import.meta.url)))
const 밖 = process.env.OUT || '/tmp/claude-0/소개릴스결시안-0919.png'
const 크롭 = (f) => 짐(join('/tmp/claude-0/흐름릴스-0919', f))
const 짐 = (p) => 'data:image/png;base64,' + readFileSync(p).toString('base64')
const 앱아이콘 = 짐(join(R, 'public/icons/icon-512-v7.png'))
const 폰트 = readFileSync(join(R, 'src/assets/fonts/gowun-dodum-korean-400.woff2')).toString('base64')
const 폰트L = readFileSync(join(R, 'src/assets/fonts/gowun-dodum-latin-400.woff2')).toString('base64')

// 🎨 후보 — 「바탕색 · 무늬 · 글자색」 한 벌
// 🎨 내일 «소개» 릴스 결 — 오늘 예고(노트 체크)와 «달라야» 한다.
//   📮 창업자 2026-09-18 = *"배경이랑 그런 것도 다르게 해줘 계속 우리 비슷한 느낌으로 릴스 만들었어서.."*
//   ⭐ 그래서 바탕색만이 아니라 «짜임»을 바꾼다 — 잘라낸 화면을 카드로 얹고, 색을 진하게 깐다.
const 후보 = [
  { 이름: 'ⓐ 진한 남색 판 (화면이 튀어나옴)', 바탕: '#2E3B4E', 진: '#ffffff', 연: '#a9bcd2', 무늬: 'none', 카드: '#fff' },
  { 이름: 'ⓑ 먹빛 ＋ 굵은 사선', 바탕: '#33302B', 진: '#F7EEDF', 연: '#b8a98f', 카드: '#fff',
    무늬: 'repeating-linear-gradient(45deg,#3c3832 0 18px,transparent 18px 60px)' },
  { 이름: 'ⓒ 진한 초록 ＋ 큰 점', 바탕: '#22402F', 진: '#F2EFE2', 연: '#9db8a6', 카드: '#fff',
    무늬: 'radial-gradient(#2b4e3a 8px, transparent 9px)', 칸: '72px 72px' },
  { 이름: 'ⓓ 벽돌색 판', 바탕: '#7A3B2E', 진: '#FFF3E8', 연: '#e0b39f', 무늬: 'none', 카드: '#fff' },
  { 이름: 'ⓔ 크림 ＋ 굵은 가로줄', 바탕: '#F7EFE0', 진: '#4a2f16', 연: '#9a7c5a', 카드: '#fff',
    무늬: 'repeating-linear-gradient(0deg,#ead9be 0 10px,transparent 10px 96px)' },
  { 이름: 'ⓕ 남색 ＋ 격자(진한 노트)', 바탕: '#26354A', 진: '#F3F7FC', 연: '#9db0c8', 카드: '#fff',
    무늬: 'repeating-linear-gradient(0deg,#2f4058 0 4px,transparent 4px 90px),repeating-linear-gradient(90deg,#2f4058 0 4px,transparent 4px 90px)' },
]

const 칸 = (c) => `
<div class="칸">
  <div class="판" style="background-color:${c.바탕};${c.무늬 === 'none' ? '' : `background-image:${c.무늬};background-size:${c.칸 || 'auto'}`}">
    <div class="번호" style="color:${c.연}">③</div>
    <div class="큰" style="color:${c.진}">얼마 남았는지<br>바로 보여요</div>
    <img class="컷" src="${크롭('c5-식비요약.png')}" style="background:${c.카드}">
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
      flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:28px}
  .큰{font-size:40px;font-weight:700;letter-spacing:-1px;line-height:1.3;text-align:center}
  .번호{font-size:44px;font-weight:700}
  .컷{width:344px;border-radius:14px;box-shadow:0 12px 30px rgba(0,0,0,.25);margin-top:6px}
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
