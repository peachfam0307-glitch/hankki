// ✍️ 글씨체 12개 × 새 굵기 — 「전체 글씨체에 다 적용되나」 (창업자 물음 2026-08-31)
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
const S=readFileSync('/home/user/hankki/hankki/src/components/Stickers.jsx','utf8')
const fi=S.indexOf('export const TEXT_FONTS = ['), fj=S.indexOf('\n]',fi)
const fonts=[...S.slice(fi,fj).matchAll(/\{\s*key:\s*'([^']+)'[^}]*?label:\s*'([^']+)'[^}]*?family:\s*"?'([^']+)'([^}]*)/g)]
  .map(m=>({k:m[1],l:m[2],f:m[3],fw:(m[4].match(/fw:\s*([\d.]+)/)||[,'1'])[1]*1}))
const bi=S.indexOf('export const BOX_PAD'), bj=S.indexOf('\n}',bi)
const m=S.slice(bi,bj).match(/pn101:\s*\[([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\]/)
const pad=[+m[1],+m[2],+m[3],+m[4]]
const b64='data:image/png;base64,'+readFileSync('/home/user/hankki/hankki/src/assets/stickers/photo/pn101.png').toString('base64')
const HAND=0.025, FAT=0.055   // 기본 = 보통
const 글='애호박 새우덮밥'
const cell=(f)=>{
  const 손 = f.k==='gaegu'||f.k==='nanumpen'
  const t=((손?HAND:0)+FAT)*f.fw    // ⭐ 글씨체 보정(fw)을 곱한다 — 안 곱하면 펜글씨·임팩트가 뭉갠다
  return `<div style="text-align:center">
  <div style="color:${손?'#ffd978':'#9aa'};font-size:11px;margin-bottom:2px">${f.l}${손?' ✍️':''} · fw ${f.fw} · ${t.toFixed(3)}em</div>
  <div style="position:relative;width:230px;height:236px;container-type:size">
   <img src="${b64}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain">
   <div class="tx" style="position:absolute;top:${pad[0]}%;right:${pad[1]}%;bottom:${pad[2]}%;left:${pad[3]}%;
    box-sizing:border-box;display:flex;align-items:safe center;justify-content:safe center;color:#4a4038;
    font-family:'${f.f}',sans-serif;line-height:1.35;white-space:pre-wrap;word-break:keep-all;text-align:center;
    font-size:clamp(6px, 16.6cqw, 200px);-webkit-text-stroke:${t.toFixed(3)}em #4a4038;paint-order:stroke fill">${글}</div>
  </div></div>`
}
// ⛔⛔ 처음엔 Google Fonts 를 불렀는데 **이 환경은 바깥을 못 연다** → 12개가 전부 폴백으로 그려져
//    「글씨체가 다 똑같아 보이는」 판이 나왔다. 앱은 `src/assets/fonts/*.woff2` 를 쓴다 → 그걸 그대로 심는다.
const { readdirSync } = await import('node:fs')
const 폰트파일 = readdirSync('/home/user/hankki/hankki/src/assets/fonts')
const faces = fonts.map((f) => {
  // 파일 이름은 글꼴 이름을 소문자로 붙여 쓴다(gowun-dodum · nanumpen · blackhansans …)
  const 후보 = f.f.toLowerCase().replace(/\s+/g, '')
  const 짝 = 폰트파일.find((n) => n.endsWith('-korean-400.woff2') && n.replace(/-korean-400\.woff2$/, '').replace(/-/g, '') === 후보)
    || 폰트파일.find((n) => n.endsWith('-korean-400.woff2') && 후보.includes(n.split('-')[0]))
  if (!짝) { console.log('⚠️ 폰트 파일 못 찾음:', f.l, f.f); return '' }
  const d = readFileSync('/home/user/hankki/hankki/src/assets/fonts/' + 짝).toString('base64')
  return `@font-face{font-family:'${f.f}';src:url(data:font/woff2;base64,${d}) format('woff2');font-display:block}`
}).join('\n')
const html=`<!doctype html><meta charset="utf-8"><style>${faces}</style>
<body style="margin:0;background:#1b1d25;padding:14px">
<div style="color:#ffd978;font-size:14px;margin:2px 0 10px">✍️ 글씨체 12개 · 굵기 「보통」(기본) — 손글씨 둘만 0.080em, 나머지 0.055em</div>
<div style="display:grid;grid-template-columns:repeat(4,230px);gap:14px">${fonts.map(cell).join('')}</div>
</body>`
writeFileSync('/tmp/ff.html',html)
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM})
const pg=await (await b.newContext({viewport:{width:1000,height:1000},deviceScaleFactor:2})).newPage()
await pg.goto('file:///tmp/ff.html'); await pg.waitForTimeout(2500)
const 잰다=await pg.evaluate(`[...document.querySelectorAll('.tx')].map(el=>getComputedStyle(el).webkitTextStrokeWidth)`)
console.log('글씨체', fonts.length, '개 · stroke:', 잰다.join(' '))
await pg.screenshot({path:'/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/글칸판/글씨체12.png',fullPage:true})
await b.close()
