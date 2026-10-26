import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
// 📣 인스타 「이번 주 한끼」 한 장 (창업자 2026-10-26 · 매주 월요일 · 디자인은 주마다 다르게)
// 실행: OUT=<폴더> BG=<배경 png> INK=<글자색> ACCENT=<포인트색> node 만들기.mjs <그 주 월요일>
// 목록 = 앱 데이터(recipe.mjs · curation.js)에서 날짜로 · 월=새 레시피 · 수=SNS · 장바구니=일~토 · 원작자 표시 안 함(창업자 「소개글이니까」)
// ⚠️ 배경은 «가운데 넓은 빈 종이»가 있어야 한다 — 글 자리 = 왼쪽 150 · 오른쪽 96 · 위 262 · 아래 118
const ROOT=new URL('../../..', import.meta.url).pathname.replace(/\/$/,''), S=process.env.OUT||'/tmp/claude-0/이번주한끼'
const 월=process.argv[2]||'2026-10-26'
const 더=(d,n)=>{const t=new Date(d+'T00:00:00Z');t.setUTCDate(t.getUTCDate()+n);return t.toISOString().slice(0,10)}
const 수=더(월,2),토=더(월,5),일=더(월,6),md=(d)=>`${+d.slice(5,7)}/${+d.slice(8,10)}`
const {레시피들}=await import(join(ROOT,'scripts/recipe.mjs'));const L=레시피들()
const 월편=L.filter(r=>r.from===월),수편=L.filter(r=>r.from===수)
const cur=readFileSync(join(ROOT,'src/data/curation.js'),'utf8')
const 장시작=더(월,-1)
// 🖼 제 그림이 없으면 갈래 대표 그림(앱과 같은 잣대 `it.icon || g.icon`)
const 줄들=[];{let g='';for(const l of cur.split('\n')){const m=l.match(/^\s*cat: '.*icon: '([^']+)'/);if(m)g=m[1];if(/^\s*\{ name: '/.test(l)&&!/뺌:/.test(l))줄들.push([l,g])}}
const 토편=줄들.map(([l,g])=>({name:(l.match(/name: '([^']+)'/)||[])[1],icon:(l.match(/icon: '([^']+)'/)||[])[1]||g,brand:(l.match(/brand: '([^']*)'/)||[])[1]||'',from:(l.match(/from: '([\d-]+)'/)||[])[1]})).filter(p=>p.from&&p.from>=장시작&&p.from<=토).sort((a,b)=>a.from<b.from?-1:1)
console.log('장바구니',토편.map(p=>p.from+' '+p.brand+' '+p.name))
const b64=(p)=>`data:image/png;base64,${readFileSync(p).toString('base64')}`
const 컷=(k)=>b64(join(ROOT,`src/assets/stickers/photo/${k}.png`))
const 폰트=readFileSync(join(ROOT,'design/promo/fonts-embed.css'),'utf8')
const 앱=b64(join(ROOT,'public/icons/icon-512-v7.png')), 배경=b64(process.env.BG||join(ROOT,'design/promo/이번주한끼/배경-2026-10-26.png'))
const 글=process.env.INK||'#3F1D12', 포인트=process.env.ACCENT||'#B5562E'
const 칸=(r,w)=>`<div class="it" style="width:${w}px"><img src="${컷(r.icon)}" style="width:${w-18}px;height:${w-18}px"><b>${r.title}</b></div>`
const html=`<!doctype html><meta charset="utf-8"><style>${폰트}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;position:relative;background:url(${배경}) center/cover;font-family:'Jua','Gowun Dodum',sans-serif;color:${글}}
.paper{position:absolute;left:150px;right:96px;top:262px;bottom:118px;display:flex;flex-direction:column;align-items:center}
.tag{font-size:26px;color:#fff7ea;background:${포인트};border-radius:999px;padding:6px 22px;box-shadow:0 4px 10px rgba(120,60,20,.25)}
h1{font-size:72px;line-height:1;margin:8px 0 8px;letter-spacing:-.02em;text-shadow:0 3px 0 #fff,0 6px 14px rgba(120,70,30,.18)}
.sec{width:100%;margin-bottom:4px}
.hd{display:flex;align-items:center;gap:12px;margin:0 0 2px 6px}
.day{font-size:30px;color:#fff7ea;background:${글};border-radius:14px;padding:2px 14px}
.what{font-family:'Jua';font-size:24px;opacity:.8}
.row{display:flex;flex-wrap:wrap;justify-content:center;gap:0 4px}
.it{display:flex;flex-direction:column;align-items:center;text-align:center}
.it img{object-fit:contain;filter:drop-shadow(0 8px 8px rgba(110,60,20,.28)) drop-shadow(0 2px 2px rgba(110,60,20,.2))}
.it b{font-weight:400;font-size:20px;line-height:1.1;word-break:keep-all;margin-top:-2px}
.it small{font-family:'Jua';font-size:15px;opacity:.6}
.foot{position:absolute;left:0;right:0;bottom:30px;text-align:center}
.알약{display:inline-flex;align-items:center;gap:12px;background:#fffaf1;border-radius:999px;padding:12px 26px;font-size:26px;color:${글};box-shadow:0 8px 18px rgba(90,50,20,.25)}
.알약 img{width:42px;height:42px;border-radius:10px}
</style>
<div class="paper">
<div class="tag">${md(월)} – ${md(일)}</div>
<h1>이번 주 한끼</h1>
<div class="sec"><div class="hd"><span class="day">월</span><span class="what">${md(월)} · 새 레시피 ${월편.length}편</span></div><div class="row">${월편.map(r=>칸(r,138)).join('')}</div></div>
<div class="sec"><div class="hd"><span class="day">수</span><span class="what">${md(수)} · SNS 레시피 ${수편.length}편</span></div><div class="row">${수편.map(r=>칸(r,150)).join('')}</div></div>
<div class="sec"><div class="hd"><span class="day">장</span><span class="what">주부의 장바구니</span></div><div class="row" style="justify-content:flex-start;gap:0 18px;padding-left:40px;max-width:640px">${토편.map(p=>`<div class="it" style="width:180px"><img src="${b64(join(ROOT,`src/assets/curation/${p.icon}.png`))}" style="width:110px;height:110px"><small style="font-size:19px;opacity:.7">${"일월화수목금토"[new Date(p.from+"T00:00:00Z").getUTCDay()]} ${md(p.from)}</small><b style="font-size:21px">${p.brand}<br>${p.name}</b></div>`).join('')}</div></div>
</div>
<div class="foot"><span class="알약"><img src="${앱}">App Store · Google Play 에서 「한끼 레시피북」 검색</span></div>`
mkdirSync(S,{recursive:true})
const br=await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{});const p=await br.newPage({viewport:{width:1080,height:1350}})
await p.setContent(html);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300)
const 바닥=await p.evaluate(()=>{const s=[...document.querySelectorAll('.sec')].pop().getBoundingClientRect();return Math.round(s.bottom)})
await p.screenshot({path:`${S}/이번주한끼-${월}.png`});await br.close();console.log('내용 바닥 y =',바닥,'(종이 끝 ≈1232)')
