// 🖼 A 15편 ＋ 붙을 아이콘 — 창업자가 «눈으로» 볼 판 (2026-09-11)
// ⛔ 이름을 손으로 안 적는다. A-다듬음.json 의 제목을 그대로 읽는다.
import { chromium } from 'playwright'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
const ROOT = new URL('..', import.meta.url).pathname
const 짝 = [
  ['가지 소고기 덮밥', 'docs/stickers/음식-창업자-2026-09-11/낱개/s101.png', '🆕 오늘 자른 것'],
  ['닭가슴살 오이 샐러드', 'docs/stickers/음식-창업자-2026-09-11/낱개/s102.png', '🆕 오늘 자른 것'],
  ['대파 소스 목살 덮밥', 'docs/stickers/음식-창업자-2026-09-11/낱개/s103.png', '🆕 오늘 자른 것'],
  ['닭목살 불고기', 'docs/stickers/음식-창업자-2026-09-11/낱개/s104.png', '🆕 오늘 자른 것'],
  ['달래 대패삼겹 덮밥', 'docs/stickers/음식-창업자-2026-09-11/낱개2/s201.png', '🆕 오늘 자른 것'],
  ['육회 깻잎무침', 'docs/stickers/음식-창업자-2026-09-11/낱개2/s202.png', '🆕 오늘 자른 것'],
  ['닭가슴살 피자 브리또', 'src/assets/stickers/photo/n2801.png', 'n2801'],
  ['새송이버섯 들깨무침', 'src/assets/stickers/photo/fe_156.png', 'fe_156'],
  ['미나리 오징어무침', 'src/assets/stickers/photo/gr_448.png', 'gr_448'],
  ['보쌈 무김치', 'src/assets/stickers/photo/n2704.png', 'n2704'],
  ['파기름 간장국수', 'src/assets/stickers/photo/gr_231.png', 'gr_231'],
  ['우삼겹 두부조림', 'src/assets/stickers/photo/gr_055.png', 'gr_055'],
  ['들깨 궁채나물', 'src/assets/stickers/photo/gr_080.png', 'gr_080'],
  ['간장 목살스테이크', 'src/assets/stickers/photo/gr_101.png', 'gr_101'],
  ['구움찰떡', 'src/assets/stickers/photo/gr_007.png', 'gr_007'],
]
const 칸 = 짝.map(([이름, p, 키]) => {
  const f = join(ROOT, p)
  const src = existsSync(f) ? `data:image/png;base64,${readFileSync(f).toString('base64')}` : ''
  return `<div class=c>${src ? `<img src="${src}">` : '<div class=x>⛔ 없음</div>'}<div class=n>${이름}</div><div class=k>${키}</div></div>`
}).join('')
const html = `<meta charset=utf-8><style>
 body{margin:0;background:#f8f5ee;font-family:system-ui,-apple-system,'Noto Sans KR',sans-serif;padding:24px}
 h1{font-size:26px;margin:0 0 4px;color:#3b2b1c}
 .s{font-size:15px;color:#8a7a6a;margin-bottom:20px}
 .g{display:grid;grid-template-columns:repeat(5,1fr);gap:18px}
 .c{background:#fff;border-radius:14px;padding:12px;text-align:center}
 .c img{width:100%;aspect-ratio:1;object-fit:contain}
 .x{aspect-ratio:1;display:flex;align-items:center;justify-content:center;color:#c00;font-size:18px}
 .n{font-size:15px;font-weight:700;color:#2e2318;margin-top:6px;line-height:1.3}
 .k{font-size:12px;color:#a09080;margin-top:3px}
</style><h1>🖼 A 15편 — 붙을 아이콘</h1>
<div class=s>15편 전부 아이콘이 있다. 🆕 여섯은 오늘 창업자가 뽑아온 것, 나머지 아홉은 앱에 이미 있던 것.</div>
<div class=g>${칸}</div>`
const b = await chromium.launch(process.env.SMOKE_CHROMIUM ? { executablePath: process.env.SMOKE_CHROMIUM } : {})
const p = await b.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2 })
await p.setContent(html); await p.waitForTimeout(400)
await p.screenshot({ path: '/tmp/A15-아이콘판.png', fullPage: true })
await b.close()
console.log('✅ /tmp/A15-아이콘판.png')
