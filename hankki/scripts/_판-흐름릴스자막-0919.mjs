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
  .훅작{color:${연};font-size:58px}
  .훅큰{color:${진};font-size:150px;font-weight:700;letter-spacing:-5px}
  .훅줄{color:${짚};font-size:52px;margin-top:24px;letter-spacing:-1px}
  .알약{margin-top:44px;display:flex;align-items:center;gap:20px;border:3px solid ${연}55;border-radius:70px;
        padding:22px 40px;color:${연};font-size:36px;line-height:1.4}
  .알약 img{width:92px;height:92px;border-radius:22px}
  .알약 b{color:${진}}
</style></head><body>${속}</body></html>`

const 장면판 = (c) => 틀(`<div class="판"><div class="작">${c.작}</div><div class="큰">${c.큰}</div><div class="자리"></div></div>`)
const 훅판 = 틀(`<div class="가운데">
  <div class="훅작">한끼에</div>
  <div class="훅큰">식비 가계부</div>
  <div class="훅줄">레시피 → 장보기 → 식비 → 냉장고</div>
</div>`)
const 끝판 = 틀(`<div class="가운데">
  <div class="훅큰" style="font-size:112px">오늘 열려요</div>
  <div class="훅줄">레시피 보다가 그 자리에서 식비까지</div>
  <div class="알약"><img src="${앱아이콘}"><span>App Store · Google Play 에서<br><b>한끼 레시피북</b> 검색</span></div>
</div>`)

const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const p = await (await b.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })).newPage()
const 찍기 = async (이름, html) => {
  await p.setContent(html, { waitUntil: 'load' }); await p.waitForTimeout(350)
  await p.screenshot({ path: join(밖, 이름 + '.png') }); console.log('  🎨', 이름)
}
await 찍기('배경-훅', 훅판)
for (const c of 자막) await 찍기('배경-' + c.칸, 장면판(c))
await 찍기('배경-끝', 끝판)
await b.close()
console.log('✅ 판 다 찍었다 →', 밖)
