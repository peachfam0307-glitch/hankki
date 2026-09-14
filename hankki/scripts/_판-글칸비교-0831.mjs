import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
const 컷 = ['pn101','pn201','pn301','pn404','dlb01','dgn01']
const 옛 = { pn101:[20.5,17.5,15.9,19.5], pn201:[17.8,14.4,13.2,14.0], pn301:[19.9,19.8,16.0,17.1],
             pn404:[22.3,19.8,17.6,19.4], dlb01:[17.0,11.7,30.0,30.0], dgn01:[16.9,15.8,17.5,26.0] }
const s = readFileSync('/home/user/hankki/hankki/src/components/Stickers.jsx','utf8')
const i = s.indexOf('export const BOX_PAD'), j = s.indexOf('\n}', i)
const blk = s.slice(i,j)
const 새 = {}
for (const k of 컷) { const m = blk.match(new RegExp(k+`:\\s*\\[([\\d.]+),\\s*([\\d.]+),\\s*([\\d.]+),\\s*([\\d.]+)\\]`)); if(m) 새[k]=[+m[1],+m[2],+m[3],+m[4]] }
const b64 = (k) => 'data:image/png;base64,' + readFileSync(`/home/user/hankki/hankki/src/assets/stickers/photo/${k}.png`).toString('base64')
const 글 = '애호박 새우덮밥'
const 칸 = (k, pad, 색) => `<div class="wrap"><img src="${b64(k)}"><div class="tx" style="top:${pad[0]}%;right:${pad[1]}%;bottom:${pad[2]}%;left:${pad[3]}%;outline:2px solid ${색}">${글}</div></div>`
const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;background:#1c1e26;font-family:sans-serif;padding:14px}
h3{color:#ffd978;font-size:15px;margin:16px 0 8px}
.row{display:flex;gap:16px;align-items:flex-start;margin-bottom:6px}
.cell{width:300px}
.cap{color:#9aa;font-size:12px;margin-bottom:4px;text-align:center}
.wrap{position:relative;width:300px;height:300px;container-type:size;background:#f4f1ea;border-radius:8px}
.wrap img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
.tx{position:absolute;box-sizing:border-box;display:flex;align-items:safe center;justify-content:safe center;
  color:#4a4038;font-family:'Gowun Dodum',sans-serif;line-height:1.35;white-space:pre-wrap;
  word-break:keep-all;overflow-wrap:break-word;text-align:center;font-size:11cqw}
</style><body>
${컷.map(k=>`<h3>${k}</h3><div class="row">
  <div class="cell"><div class="cap">🟥 지금 (폭 ${(100-옛[k][1]-옛[k][3]).toFixed(0)}%)</div>${칸(k,옛[k],'#dc5a5a')}</div>
  <div class="cell"><div class="cap">🟩 새로 (폭 ${(100-새[k][1]-새[k][3]).toFixed(0)}%)</div>${칸(k,새[k],'#3cbe6e')}</div>
</div>`).join('')}
</body>`
writeFileSync('/tmp/glcompare.html', html)
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const pg = await (await b.newContext({ viewport:{width:700,height:2400}, deviceScaleFactor:2 })).newPage()
await pg.goto('file:///tmp/glcompare.html'); await pg.waitForTimeout(900)
// 몇 줄로 접히나 재기
const 잰다 = await pg.evaluate(`[...document.querySelectorAll('.tx')].map(el=>{
  const r=document.createRange(); r.selectNodeContents(el)
  const rects=[...r.getClientRects()].filter(x=>x.width>1&&x.height>1)
  return new Set(rects.map(x=>Math.round(x.top))).size||1
})`)
console.log('줄 수 (지금/새로 번갈아):', 잰다.join(' '))
await pg.screenshot({ path:'/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/글칸판/실물비교.png', fullPage:true })
await b.close()
