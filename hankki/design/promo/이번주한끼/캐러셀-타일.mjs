import { chromium } from 'playwright'
import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
// 📣 인스타 「이번 주 한끼」 «캐러셀» (창업자 2026-11-02 「저번꺼보다 레시피랑 장바구니가 더 잘보이게」
//    ＋「디자인 다른스타일로 · 저번주랑 똑같잖아」＋「넘 작아 애들이」)
//    한 장(만들기.mjs)은 16개를 한 장에 넣어 그림이 작았다 → 한 장에 «3개까지», 그림을 화면 너비의 1/3 이상으로.
//    색은 주마다 바꾼다 — PAL=<번호> (docs/색조합-참고-릴스-2026-10-23.md 8개 중 · 기본 03 허니 바질)
// 실행: OUT=<폴더> PAL=03 SMOKE_CHROMIUM=… node 캐러셀.mjs <그 주 월요일>
// 목록 잣대 = 만들기.mjs 와 같다(월=새 레시피 · 수=SNS · 장바구니=일~토 · 원작자 표시 안 함)
const ROOT=new URL('../../..', import.meta.url).pathname.replace(/\/$/,''), S=process.env.OUT||'/tmp/claude-0/이번주한끼'
const 월=process.argv[2]||'2026-11-02'
const 더=(d,n)=>{const t=new Date(d+'T00:00:00Z');t.setUTCDate(t.getUTCDate()+n);return t.toISOString().slice(0,10)}
const 수=더(월,2),토=더(월,5),일=더(월,6),md=(d)=>`${+d.slice(5,7)}/${+d.slice(8,10)}`
const 요일=(d)=>'일월화수목금토'[new Date(d+'T00:00:00Z').getUTCDay()]
const {레시피들}=await import(join(ROOT,'scripts/recipe.mjs'));const L=레시피들()
const 월편=L.filter(r=>r.from===월),수편=L.filter(r=>r.from===수)
const cur=readFileSync(join(ROOT,'src/data/curation.js'),'utf8')
const 줄들=[];{let g='';for(const l of cur.split('\n')){const m=l.match(/^\s*cat: '.*icon: '([^']+)'/);if(m)g=m[1];if(/^\s*\{ name: '/.test(l)&&!/뺌:/.test(l))줄들.push([l,g])}}
const 장편=줄들.map(([l,g])=>({name:(l.match(/name: '([^']+)'/)||[])[1],icon:(l.match(/icon: '([^']+)'/)||[])[1]||g,brand:(l.match(/brand: '([^']*)'/)||[])[1]||'',from:(l.match(/from: '([\d-]+)'/)||[])[1]})).filter(p=>p.from&&p.from>=더(월,-1)&&p.from<=토).sort((a,b)=>a.from<b.from?-1:1)
const b64=(p)=>`data:image/png;base64,${readFileSync(p).toString('base64')}`
const 컷=(k)=>b64(join(ROOT,`src/assets/stickers/photo/${k}.png`))
const 폰트=readFileSync(join(ROOT,'design/promo/fonts-embed.css'),'utf8')
const 앱=b64(join(ROOT,'public/icons/icon-512-v7.png'))
// 🎨 색표 (색조합 참고 문서 그대로 · 바탕/글자) — 종이는 바탕을 밝힌 크림
const 색표={'01':['#D6A9AD','#37441F'],'02':['#FFD7B9','#4F67B1'],'03':['#DC9F2A','#475418'],'04':['#F4DEAF','#3F1D12'],'05':['#FFA62B','#2E5AA7'],'06':['#96C0CE','#7F0303'],'07':['#FFEDAB','#75070C'],'08':['#B7D1EA','#301728']}
const [바탕,글]=색표[process.env.PAL||'03'], 종이='#FFF8EC'
// 🧩 [2026-11-09] 두 번째 꼴 = «타일» — 창업자 「색이랑 디자인 좀 다르게해줘」
//    한 장에 2×2 타일(접시 크게 · 이름 아래) · 표지 = 왼쪽 정렬 큰 제목 ＋ 접시 넷 · 장 수 8 → 6
//    색 = 바탕(BG)·글(INK)·종이(PAPER) 를 직접 받는다(색표 번호 PAL 도 그대로 쓸 수 있다) · VIDEO=1 이면 쪽 번호·「넘겨 보세요」를 뺀다
const 바탕2=process.env.BG||바탕, 글2=process.env.INK||글, 종이2=process.env.PAPER||'#FFFDF7', 영상=process.env.VIDEO==='1'
const 공통=`${폰트}*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;position:relative;font-family:'Jua','Gowun Dodum',sans-serif;color:${글2};background:${바탕2}}
.띠{position:absolute;left:0;right:0;top:0;height:200px;display:flex;align-items:center;gap:22px;padding:0 64px;border-bottom:6px solid ${글2}}
.요일{font-size:46px;border:5px solid ${글2};border-radius:22px;padding:4px 18px}
.제목{font-size:70px;letter-spacing:-.02em}.날{font-size:32px;opacity:.75;margin-left:auto;text-align:right;line-height:1.3}
.판{position:absolute;left:44px;right:44px;top:240px;bottom:44px;display:grid;grid-template-columns:1fr 1fr;gap:28px}
.칸{background:${종이2};border:5px solid ${글2};border-radius:36px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:0 18px 30px;position:relative;overflow:hidden}
.칸 img{width:400px;height:400px;object-fit:contain;margin-top:-10px;filter:drop-shadow(0 12px 12px rgba(40,20,10,.28))}
.칸 b{font-weight:400;font-size:50px;line-height:1.1;text-align:center;word-break:keep-all;letter-spacing:-.02em}
.칸 small{font-size:28px;opacity:.65;margin-bottom:6px}
.번{position:absolute;left:24px;top:18px;font-size:34px;opacity:.5}
.쪽{position:absolute;right:44px;bottom:12px;font-size:24px;opacity:.6}`
const 장=[]
const 쪽=()=>영상?'':`<span class="쪽">__쪽__</span>`
const 넷씩=(a)=>{const o=[];for(let i=0;i<a.length;i+=4)o.push(a.slice(i,i+4));return o}
const 판=(머리,묶음,칸)=>`<style>${공통}</style>${머리}<div class="판" style="${묶음.length<=2?'grid-template-rows:1fr;':''}">${묶음.map(칸).join('')}</div>${쪽()}`
const 띠=(요,제목,날)=>`<div class="띠"><span class="요일">${요}</span><span class="제목">${제목}</span><span class="날">${날}</span></div>`
// ① 표지
const 표지셋=[월편[0],월편[2],수편[0],월편[5]].filter(Boolean)
장.push(`<style>${공통}
.표{position:absolute;left:70px;top:90px;right:70px}
.tag{display:inline-block;font-size:40px;border:5px solid ${글2};border-radius:999px;padding:6px 28px}
h1{font-size:190px;line-height:.92;margin:34px 0 26px;letter-spacing:-.05em}
.요약{font-size:40px;line-height:1.5}
.접시{position:absolute;left:24px;right:24px;bottom:30px;height:640px;display:grid;grid-template-columns:repeat(4,1fr);align-items:end}
.접시 img{width:112%;margin-left:-6%;aspect-ratio:1;object-fit:contain;filter:drop-shadow(0 16px 16px rgba(40,20,10,.3))}
.접시 img:nth-child(2n){transform:translateY(-190px)}
.넘김{position:absolute;right:60px;top:100px;font-size:30px;border:4px solid ${글2};border-radius:999px;padding:6px 20px}</style>
<div class="표"><span class="tag">${md(월)} – ${md(일)}</span><h1>이번 주<br>한끼</h1>
<div class="요약">새 레시피 <b style="font-weight:400;font-size:52px">${월편.length}</b>편 · SNS 레시피 <b style="font-weight:400;font-size:52px">${수편.length}</b>편<br>주부의 장바구니 <b style="font-weight:400;font-size:52px">${장편.length}</b>개</div></div>
<div class="접시">${표지셋.map((r)=>`<img src="${컷(r.icon)}">`).join('')}</div>${영상?'':'<div class="넘김">넘겨 보세요 →</div>'}`)
// ② 월 새 레시피 — 4편씩
let n=0
넷씩(월편).forEach((묶)=>장.push(판(띠('월','새 레시피',`${md(월)}<br>${월편.length}편`),묶,(r)=>`<div class="칸"><span class="번">${String(++n).padStart(2,'0')}</span><img src="${컷(r.icon)}"><b>${r.title}</b></div>`)))
// ③ 수 SNS
n=0
넷씩(수편).forEach((묶)=>장.push(판(띠('수','SNS 레시피',`${md(수)}<br>요즘 많이 해 먹는`),묶,(r)=>`<div class="칸"><span class="번">${String(++n).padStart(2,'0')}</span><img src="${컷(r.icon)}"><b>${r.title}</b></div>`)))
// ④ 장바구니
넷씩(장편).forEach((묶)=>장.push(판(띠('장','주부의 장바구니','직접 사서<br>써 본 것만'),묶,(p)=>`<div class="칸"><img src="${b64(join(ROOT,`src/assets/curation/${p.icon}.png`))}" style="width:360px;height:360px"><small>${요일(p.from)} ${md(p.from)}${p.brand?` · ${p.brand}`:''}</small><b style="font-size:46px">${p.name}</b></div>`)))
// ⑤ 끝
장.push(`<style>${공통}.끝{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:0 90px}
.끝 h2{font-size:140px;line-height:.98;letter-spacing:-.04em}.끝 p{font-size:44px;line-height:1.5;margin:30px 0 60px}
.알약{display:inline-flex;align-items:center;gap:16px;background:${종이2};border:5px solid ${글2};border-radius:999px;padding:14px 32px;font-size:34px;align-self:flex-start}.알약 img{width:60px;height:60px;border-radius:14px}</style>
<div class="끝"><h2>레시피는<br>한끼 앱에서</h2><p>재료 · 순서 · 타이머까지<br>그대로 따라 하면 돼요</p><span class="알약"><img src="${앱}">App Store · Google Play</span><p style="margin-top:26px;font-size:40px">「한끼 레시피북」 검색</p></div>`)
mkdirSync(S,{recursive:true})
const br=await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{});const pg=await br.newPage({viewport:{width:1080,height:1350}})
const 몇=process.env.ONLY?process.env.ONLY.split(',').map(Number):null
for(const [i,h] of 장.entries()){ if(몇&&!몇.includes(i+1))continue
  await pg.setContent(`<!doctype html><meta charset="utf-8">${h.replace('__쪽__',`${i+1} / ${장.length}`)}`);await pg.evaluate(()=>document.fonts.ready);await pg.waitForTimeout(250)
  await pg.screenshot({path:`${S}/이번주한끼-${월}-${String(i+1).padStart(2,'0')}.png`});console.log(`${i+1}장`)
}
await br.close()
