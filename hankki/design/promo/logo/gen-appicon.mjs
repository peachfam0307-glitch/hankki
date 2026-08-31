// 앱 아이콘 생성기 — 곰곰 셰프(곰돌이)만 크게, 크림 타일
// 사용법: node gen-appicon.mjs
// 출력: ../../..(레포)/public/icons/*-v5.png
import pw from '/opt/node22/lib/node_modules/playwright/index.js'
const { chromium } = pw
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const abs = (p) => new URL(p, import.meta.url).pathname
const OUT = abs('../../../public/icons/')

// 곰곰 셰프 (iconC.html 원본 벡터)
const BEAR = `
  <circle cx="14.5" cy="18" r="4.6" fill="#b98a63"/><circle cx="33.5" cy="18" r="4.6" fill="#b98a63"/>
  <circle cx="14.5" cy="18" r="2.2" fill="#d9b593"/><circle cx="33.5" cy="18" r="2.2" fill="#d9b593"/>
  <circle cx="24" cy="28" r="13" fill="#b98a63"/>
  <ellipse cx="24" cy="32.5" rx="6.4" ry="4.6" fill="#ecd9bd"/>
  <rect x="22.6" y="30" width="2.8" height="2.2" rx="1.1" fill="#5f4632"/>
  <path d="M24 32.4v1.6M24 34c-.9.9-2 .9-2.8.2M24 34c.9.9 2 .9 2.8.2" stroke="#5f4632" stroke-width="1" fill="none" stroke-linecap="round"/>
  <circle cx="18.6" cy="27.5" r="1.35" fill="#3d3830"/><circle cx="29.4" cy="27.5" r="1.35" fill="#3d3830"/>
  <circle cx="15.6" cy="31" r="2.1" fill="#f0b9a6" opacity="0.75"/><circle cx="32.4" cy="31" r="2.1" fill="#f0b9a6" opacity="0.75"/>
  <circle cx="16.8" cy="12.6" r="3.4" fill="#fff" stroke="#e2ded2" stroke-width="1"/>
  <circle cx="24" cy="10.6" r="3.9" fill="#fff" stroke="#e2ded2" stroke-width="1"/>
  <circle cx="31.2" cy="12.6" r="3.4" fill="#fff" stroke="#e2ded2" stroke-width="1"/>
  <rect x="15.5" y="14.6" width="17" height="3.6" rx="1.8" fill="#fff" stroke="#e2ded2" stroke-width="1"/>`

// viewBox 로 곰 크기 조절: 프레임 작을수록 곰이 큼
//  full     : 홈화면 일반 아이콘용 (곰 크게 ~78%)
//  maskable : 원형/각종 마스킹 크롭 안전용 (곰 ~63%, 여백 넉넉)
const html = (size, viewBox) => `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${size}px;height:${size}px}
  .tile{width:${size}px;height:${size}px;overflow:hidden;
    background:radial-gradient(120% 120% at 50% 30%,#faf7f0,#efe6d6);
    display:flex;align-items:center;justify-content:center}
  svg{width:${size}px;height:${size}px;display:block}
</style></head><body>
  <div class="tile"><svg viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">${BEAR}</svg></div>
</body></html>`

const FULL = '6 2 36 44'       // 곰 크게 (v5 — 비교용으로 보존)
const MASK = '2 -3 44 54'      // 곰 안전·여백 넉넉 ← 창업자 확정(B·네모, 2026-07-17)

// v6 = 확정본: 모든 크기를 B(여백 넉넉) 프레이밍으로 통일
const jobs = [
  { file: 'icon-512-v6.png',              size: 512, vb: MASK },
  { file: 'icon-192-v6.png',              size: 192, vb: MASK },
  { file: 'apple-touch-icon-180-v6.png',  size: 180, vb: MASK },
  { file: 'icon-maskable-512-v6.png',     size: 512, vb: MASK },
]

const b = await chromium.launch({ executablePath: CHROME })
for (const j of jobs) {
  const c = await b.newContext({ deviceScaleFactor: 1, viewport: { width: j.size, height: j.size } })
  const p = await c.newPage()
  await p.setContent(html(j.size, j.vb), { waitUntil: 'networkidle' })
  await p.waitForTimeout(120)
  await p.locator('.tile').screenshot({ path: OUT + j.file })
  await c.close()
  console.log('저장:', j.file, j.size + 'px')
}
await b.close()
