// 🔁 지울 카와이 7컷이 «아직 살아서 쓰이는 자리»(온보딩 6·프로필 1) — 새 세대 대체 후보를 창업자가 고르는 판 (2026-09-05)
import { chromium } from 'playwright'
import { join } from 'node:path'
const APP = '/home/user/hankki/hankki'
const 줄 = [
  ['fe_04', '프로필 기본 아바타 (버섯 솥밥)', ['gr_001','gr_343','gr_344']],
  ['fe_06', '온보딩 카드 (연어 포케볼)', ['fe_511','gr_242','gr_243','gr_349','gr_391']],
  ['fe_15', '온보딩 칩·달력 (그린 스무디)', ['fe_508','gr_014','gr_087']],
  ['fh_k27','온보딩 칩·달력 (국물 떡볶이)', ['gr_003','gr_443','gr_453']],
  ['fe_09', '온보딩 달력 (새우 볶음면)', ['gr_036','gr_300']],
  ['fe_81', '온보딩 그림 (비빔국수)', ['fe_300','gr_231','gr_232']],
  ['fe_08', '온보딩 그림 (새우 버섯 뚝배기)', ['fe_414']],
]
const img = (id) => `<div style="text-align:center"><img src="file://${join(APP,'src/assets/stickers/photo',id+'.png')}" style="width:110px;height:110px;object-fit:contain;background:#f6f2ea;border-radius:8px;display:block;margin:0 auto 2px"><span style="font-size:11px;color:#555">${id}</span></div>`
const html = `<body style="margin:14px;background:#fff;font:13px/1.3 sans-serif">
<div style="font-size:15px;margin-bottom:10px">🔁 지울 카와이 7컷이 «아직 살아서 쓰이는 자리» — 왼쪽(지울 것) → 오른쪽(새 세대 후보). 창업자가 고른다.</div>
${줄.map(([old,where,cands])=>`<div style="display:flex;align-items:center;gap:10px;margin:8px 0;padding:8px;border:1px solid #eee;border-radius:10px">
<div style="width:230px;color:#333">${where}</div>${img(old)}<div style="font-size:22px;color:#c33">→</div>${cands.map(img).join('')}</div>`).join('')}
</body>`
const OUT = process.argv[2]; import('node:fs').then(async ({ writeFileSync }) => { writeFileSync(OUT + '.html', html); const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1100, height: 900 } })
await p.goto('file://' + OUT + '.html', { waitUntil: 'networkidle' })
await p.screenshot({ path: process.argv[2], fullPage: true })
await b.close(); console.log('ok') })
