// 🔬 「포스트잇을 키워도 글자가 안 커진다」 — 진짜 그런가 (창업자 2026-08-31)
//   📮 *"포스잇 키워도 글자크기는 변함이 없어. 이게 너무 불편하거든."*
//   ⛔ 짐작 금지 — 종이 크기 × 글자 크기 갈래를 실제로 그려서 «화면 px»를 잰다.
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
const S = readFileSync('/home/user/hankki/hankki/src/components/Stickers.jsx','utf8')
const i = S.indexOf('export const BOX_PAD'), j = S.indexOf('\n}', i)
const m = S.slice(i,j).match(/pn101:\s*\[([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\]/)
const pad = [ +m[1], +m[2], +m[3], +m[4] ]
const b64 = 'data:image/png;base64,' + readFileSync('/home/user/hankki/hankki/src/assets/stickers/photo/pn101.png').toString('base64')
const 글 = '애호박 새우덮밥'
const 크기 = [['sm',0.82],['md',1],['lg',1.28],['hg',1.6]]
const 종이 = [120, 200, 300, 420]   // 화면에 놓이는 종이 폭(px) — 작게~크게 키운 것
// autoCqw 를 그대로 옮긴다(DecorLayer 와 같은 계산이라야 값이 맞다)
const autoCqw = (t, base, wPct, hPct, lh) => {
  const 글자 = [...(t||'')].length || 1
  for (let r = base; r >= 2; r -= 0.25) {
    const 줄폭 = wPct / (r * 0.5)
    const 줄수 = Math.ceil(글자 / Math.max(1, 줄폭))
    if (줄수 * r * lh <= hPct) return r
  }
  return 2
}
const cq = autoCqw(글, 13, 100-pad[1]-pad[3], (100-pad[0]-pad[2])/1.026, 1.35)
const cell = (w, v, k) => `<div style="text-align:center">
  <div style="color:#9aa;font-size:11px">${w}px · ${k}</div>
  <div style="position:relative;width:${w}px;height:${Math.round(w*1.026)}px;container-type:size;margin:0 auto">
    <img src="${b64}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain">
    <div class="tx" style="position:absolute;top:${pad[0]}%;right:${pad[1]}%;bottom:${pad[2]}%;left:${pad[3]}%;
      box-sizing:border-box;display:flex;align-items:safe center;justify-content:safe center;
      color:#4a4038;font-family:sans-serif;line-height:1.35;white-space:pre-wrap;word-break:keep-all;
      text-align:center;font-size:clamp(6px, ${(cq*v).toFixed(2)}cqw, 64px)">${글}</div>
  </div></div>`
const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#1b1d25;padding:12px">
${크기.map(([k,v])=>`<div style="display:flex;gap:14px;align-items:flex-end;margin-bottom:14px">${종이.map(w=>cell(w,v,k)).join('')}</div>`).join('')}
</body>`
writeFileSync('/tmp/sz.html', html)
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
const pg = await (await b.newContext({ viewport:{width:1200,height:1700}, deviceScaleFactor:2 })).newPage()
await pg.goto('file:///tmp/sz.html'); await pg.waitForTimeout(600)
const 잰다 = await pg.evaluate(`[...document.querySelectorAll('.tx')].map(el=>{
  const r=document.createRange(); r.selectNodeContents(el)
  const rects=[...r.getClientRects()].filter(x=>x.width>1&&x.height>1)
  return { px:+getComputedStyle(el).fontSize.replace('px',''), 줄:new Set(rects.map(x=>Math.round(x.top))).size||1 }
})`)
console.log(`계산된 기본 = ${cq.toFixed(2)}cqw · 상한 64px\n`)
console.log('종이폭 →   120     200     300     420')
크기.forEach(([k,v],r)=>{
  const 줄들 = 잰다.slice(r*종이.length,(r+1)*종이.length)
  console.log(`${k.padEnd(4)}  ` + 줄들.map(x=>`${x.px.toFixed(1)}px/${x.줄}줄`.padStart(12)).join(''))
})
console.log('\n⭐ 「종이 대비 글자 비율」 = 어느 종이 크기에서도 같아야 정상(cqw 라서)')
크기.forEach(([k,v],r)=>{
  const 줄들 = 잰다.slice(r*종이.length,(r+1)*종이.length)
  console.log(`${k.padEnd(4)}  ` + 줄들.map((x,c)=>`${(x.px/종이[c]*100).toFixed(1)}%`.padStart(12)).join(''))
})
await pg.screenshot({ path:'/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/글칸판/글자크기.png', fullPage:true })
await b.close()
