// ✍️ 포스트잇 글자 «굵기»와 «크기 상한» — 고친 뒤 실물 (창업자 2026-08-31)
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
const S = readFileSync('/home/user/hankki/hankki/src/components/Stickers.jsx','utf8')
const i = S.indexOf('export const BOX_PAD'), j = S.indexOf('\n}', i)
const m = S.slice(i,j).match(/pn101:\s*\[([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\]/)
const pad=[+m[1],+m[2],+m[3],+m[4]]
const b64='data:image/png;base64,'+readFileSync('/home/user/hankki/hankki/src/assets/stickers/photo/pn101.png').toString('base64')
const 글='애호박 새우덮밥'
// ⛔⛔ 첫 판에 «지금 앱의 값»이 아예 없었다 — 창업자가 *"2번은 지금쓰는 값이야??"* 라고 되물어 드러났다.
//   지금 = 굵기 갈래가 «없고» 얇은 손글씨에 **0.4px 고정**(em 이 아니라 px 라 글자를 키우면 상대적으로 얇아진다).
//   ⭐ 그게 창업자 불만의 뿌리다 — *"레꾸해놓으면 제목이 잘 안보여"*.
//   ✅ 그래서 맨 앞에 「지금」을 넣고 나머지를 그 옆에 세운다. `null` = 0.4px 고정을 뜻한다.
const 굵기=[['① 지금 (0.4px 고정)',null],['② 얇게 0.025',0],['③ 보통 0.08',0.055],['④ 0.105',0.08],['⑤ 0.125',0.10]]
const 크기=[['크게',1.28],['아주 크게',1.6]]
const cq=13
const cell=(w,v,fat,cap)=>`<div style="text-align:center">
 <div style="color:#9aa;font-size:11px;margin-bottom:3px">${cap}</div>
 <div style="position:relative;width:${w}px;height:${Math.round(w*1.026)}px;container-type:size">
  <img src="${b64}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain">
  <div class="tx" style="position:absolute;top:${pad[0]}%;right:${pad[1]}%;bottom:${pad[2]}%;left:${pad[3]}%;
   box-sizing:border-box;display:flex;align-items:safe center;justify-content:safe center;color:#4a4038;
   font-family:'Gaegu',sans-serif;line-height:1.35;white-space:pre-wrap;word-break:keep-all;text-align:center;
   font-size:clamp(6px, ${(cq*v).toFixed(2)}cqw, 200px);
   ${fat===null?'-webkit-text-stroke:0.4px #4a4038;paint-order:stroke fill;':(fat+0.025>0?`-webkit-text-stroke:${(fat+0.025).toFixed(3)}em #4a4038;paint-order:stroke fill;`:'')}">${글}</div>
 </div></div>`
const html=`<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&display=swap">
<body style="margin:0;background:#1b1d25;padding:14px">
<div style="color:#ffd978;font-size:14px;margin:4px 0 8px">✍️ 굵기 3단계 (종이 300px · 크게)</div>
<div style="display:flex;gap:16px;margin-bottom:20px">${굵기.map(([n,f])=>cell(250,1.28,f,n)).join('')}</div>
<div style="color:#ffd978;font-size:14px;margin:4px 0 8px">📏 큰 종이(420px)에서 크기가 갈리나 — 상한 64 → 200px</div>
<div style="display:flex;gap:16px">${크기.map(([n,v])=>cell(420,v,0.055,n)).join('')}</div>
</body>`
writeFileSync('/tmp/wt.html',html)
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM})
const pg=await (await b.newContext({viewport:{width:1120,height:1000},deviceScaleFactor:2})).newPage()
await pg.goto('file:///tmp/wt.html'); await pg.waitForTimeout(1400)
const 잰다=await pg.evaluate(`[...document.querySelectorAll('.tx')].map(el=>({
  px:+getComputedStyle(el).fontSize.replace('px',''), stroke:getComputedStyle(el).webkitTextStrokeWidth }))`)
console.log('굵기 3 (종이300·크게):', 잰다.slice(0,3).map(x=>`${x.px.toFixed(0)}px stroke ${x.stroke}`).join(' | '))
console.log('크기 2 (종이420):', 잰다.slice(3).map(x=>`${x.px.toFixed(1)}px`).join(' | '), '← 전엔 둘 다 64.0px')
await pg.screenshot({path:'/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/글칸판/글자굵기.png',fullPage:true})
await b.close()
