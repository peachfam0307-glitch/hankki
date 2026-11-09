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
const 공통=`${폰트}*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;position:relative;font-family:'Jua','Gowun Dodum',sans-serif;color:${글};
 background:${바탕} radial-gradient(rgba(255,255,255,.14) 2px,transparent 2.5px) 0 0/26px 26px}
.머리{position:absolute;left:64px;right:64px;top:56px;display:flex;align-items:center;justify-content:space-between}
.머리 .왼{display:flex;align-items:center;gap:16px}
.요일{width:92px;height:92px;border-radius:50%;background:${글};color:${바탕};font-size:52px;display:flex;align-items:center;justify-content:center}
.제목{font-size:64px;line-height:1;letter-spacing:-.02em}
.날{font-size:34px;opacity:.75;margin-top:6px}
.쪽{font-size:30px;background:${종이};border-radius:999px;padding:6px 20px}
.줄{position:absolute;left:52px;right:52px;display:flex;align-items:center;gap:8px;background:${종이};border-radius:48px;padding:0 40px 0 10px;box-shadow:0 10px 0 rgba(0,0,0,.08)}
.줄 img{width:380px;height:340px;object-fit:contain;margin:-20px 0;filter:drop-shadow(0 14px 14px rgba(70,40,10,.3)) drop-shadow(0 3px 3px rgba(70,40,10,.2))}
.줄 .번{font-size:36px;opacity:.45}
.줄 b{display:block;font-weight:400;font-size:66px;line-height:1.08;word-break:keep-all;letter-spacing:-.02em}
.줄 small{display:block;font-size:34px;opacity:.6;margin-top:10px}
.알약{display:inline-flex;align-items:center;gap:16px;background:${종이};border-radius:999px;padding:16px 34px;font-size:34px;box-shadow:0 10px 0 rgba(0,0,0,.08)}
.알약 img{width:60px;height:60px;border-radius:14px}`
const 앞수=(all,k)=>all.slice(0,k).reduce((n,a)=>n+a.length,0)   // ⛔ [2026-11-09] k*3 으로 셌더니 3·2·2 로 나뉜 7편에서 6번이 빠지고 7–8 이 됐다 → 앞 묶음 길이를 더한다
const 장=[], 셋씩=(a)=>{const n=Math.ceil(a.length/3),o=[];let s=0;for(let k=0;k<n;k++){const m=Math.ceil((a.length-s)/(n-k));o.push(a.slice(s,s+m));s+=m}return o}   // 고르게 나눈다(4 → 2·2 · 홀로 남는 장 없게)
const 쪽=()=>`<span class="쪽">__쪽__</span>`
// 한 장에 3줄 — 그림 380 × 3 = 화면 대부분
const 줄판=(머리,묶음,그림,아래)=>`<style>${공통}</style>${머리}${묶음.map((x,i)=>`<div class="줄" style="top:${200+(3-묶음.length)*186+i*372}px;height:340px;${i%2?'flex-direction:row-reverse;padding:0 10px 0 40px;text-align:right':''}"><img src="${그림(x)}"><div style="flex:1">${아래(x,i)}</div></div>`).join('')}`
// ① 표지
const 표지셋=[월편[0],월편[2],수편[0],월편[6]].filter(Boolean)
장.push(`<style>${공통}
.표{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding-top:110px}
.tag{font-size:42px;background:${글};color:${바탕};border-radius:999px;padding:8px 34px}
h1{font-size:170px;line-height:.95;margin:30px 0 18px;letter-spacing:-.04em;text-align:center}
.요약{font-size:40px;text-align:center;line-height:1.45}
.접시{position:absolute;left:0;right:0;bottom:70px;height:560px}
.접시 img{position:absolute;object-fit:contain;filter:drop-shadow(0 18px 18px rgba(70,40,10,.32))}
.넘김{position:absolute;right:60px;top:60px;font-size:30px;background:${종이};border-radius:999px;padding:8px 22px}</style>
<div class="표"><div class="tag">${md(월)} – ${md(일)}</div><h1>이번 주<br>한끼</h1>
<div class="요약">새 레시피 ${월편.length}편 · SNS 레시피 ${수편.length}편<br>주부의 장바구니 ${장편.length}개</div></div>
<div class="접시">${표지셋.map((r,i)=>{const 자=[[20,120,420],[330,10,440],[640,120,420],[180,250,0]][i];return 자[2]?`<img src="${컷(r.icon)}" style="left:${자[0]}px;top:${자[1]}px;width:${자[2]}px;height:${자[2]}px">`:''}).join('')}</div>
<div class="넘김">넘겨 보세요 →</div>`)
// ② 월 새 레시피 — 3편씩
셋씩(월편).forEach((묶,k,all)=>장.push(줄판(`<div class="머리"><div class="왼"><span class="요일">월</span><div><div class="제목">새 레시피</div><div class="날">${md(월)} · ${월편.length}편 중 ${앞수(all,k)+1}–${앞수(all,k)+묶.length}</div></div></div>${쪽()}</div>`,묶,r=>컷(r.icon),(r,i)=>`<span class="번">${String(앞수(all,k)+i+1).padStart(2,'0')}</span><b>${r.title}</b>`)))
// ③ 수 SNS — 3편씩
셋씩(수편).forEach((묶,k,all)=>장.push(줄판(`<div class="머리"><div class="왼"><span class="요일">수</span><div><div class="제목">SNS 레시피</div><div class="날">${md(수)} · 요즘 많이 해 먹는</div></div></div>${쪽()}</div>`,묶,r=>컷(r.icon),(r,i)=>`<span class="번">${String(앞수(all,k)+i+1).padStart(2,'0')}</span><b>${r.title}</b>`)))
// ④ 장바구니 — 3개씩
셋씩(장편).forEach((묶)=>장.push(줄판(`<div class="머리"><div class="왼"><span class="요일" style="font-size:40px">장</span><div><div class="제목">주부의 장바구니</div><div class="날">직접 사서 써 본 것만</div></div></div>${쪽()}</div>`,묶,p=>b64(join(ROOT,`src/assets/curation/${p.icon}.png`)),p=>`<small style="margin:0 0 8px">${요일(p.from)} ${md(p.from)}${p.brand?` · ${p.brand}`:``}</small><b style="font-size:58px">${p.name}</b>`)))
// ⑤ 끝
장.push(`<style>${공통}.끝{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.끝 h2{font-size:120px;line-height:1.02;letter-spacing:-.03em}.끝 p{font-size:44px;line-height:1.5;margin:28px 0 56px}</style>
<div class="끝"><h2>레시피는<br>한끼 앱에서</h2><p>재료 · 순서 · 타이머까지<br>그대로 따라 하면 돼요</p><span class="알약"><img src="${앱}">App Store · Google Play</span><p style="margin-top:26px;font-size:40px">「한끼 레시피북」 검색</p></div>`)
mkdirSync(S,{recursive:true})
const br=await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{});const pg=await br.newPage({viewport:{width:1080,height:1350}})
for(const [i,h] of 장.entries()){
  await pg.setContent(`<!doctype html><meta charset="utf-8">${h.replace('__쪽__',`${i+1} / ${장.length}`)}`);await pg.evaluate(()=>document.fonts.ready);await pg.waitForTimeout(250)
  const 바닥=await pg.evaluate(()=>Math.max(0,...[...document.querySelectorAll('.줄')].map(e=>e.getBoundingClientRect().bottom)))
  await pg.screenshot({path:`${S}/이번주한끼-${월}-${String(i+1).padStart(2,'0')}.png`});console.log(`${i+1}장 바닥 y = ${Math.round(바닥)} (화면 1350)`)
}
await br.close()
console.log('월',월편.map(r=>r.title).join(' · '));console.log('수',수편.map(r=>r.title).join(' · '));console.log('장',장편.map(p=>p.from+' '+p.brand+' '+p.name).join(' · '))
