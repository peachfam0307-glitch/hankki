// ❄️ 12월 겨울 꾸미기 홍보 릴스 세 편 (창업자 2026-11-27 「겨울꾸미기 목록 홍보영상」·「일꾸랑 레꾸 홍보영상」·「일단 만들어줭」)
//   스노우볼 = 12/1 에 여는 스티커·꾸미기 재료를 스노우볼에서 쏟아 보여 준다
//   일꾸     = 새 겨울 속지 7장 = 월~일 · 하루 한 장씩 한 끼 사진 ＋ 스티커
//   레꾸     = 흰 그릇 → 🎄 크리스마스 그릇(12/1 그릇 바꾸기) ＋ 스티커
// 실행: ASSET=<배포 갈래 hankki 폴더> OUT=<폴더> node design/promo/겨울꾸미기-2612/릴스.mjs <스노우볼|일꾸|레꾸> [PREVIEW=초,초]
//   ⭐ 그림은 전부 «우리 실물»(배포 갈래 src/assets/stickers/photo · public/ev/xmas · docs/stickers 겨울 속지·간식) — 힉스필드 0
//   ⭐ 틀 = design/promo/이번주한끼/릴스-트리.mjs 와 같다(한 HTML 에 render(t) → 24fps 로 찍어 ffmpeg)
//   색 = 한끼 색조합 ② 시글라스 에스프레소(docs/색조합-참고-릴스-2026-10-23.md)
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
const ROOT = new URL('../../..', import.meta.url).pathname.replace(/\/$/, '')
const 편 = process.argv[2] || '스노우볼'
const ASSET = process.env.ASSET || ROOT
const OUT = process.env.OUT || `/tmp/claude-0/겨울꾸미기-${편}`
const MASK = process.env.MASK   // 속지 창 마스크 폴더(c1~c7.png) — 겨울 속지 흰 창을 flood 로 잰 것
const 읽 = (p) => { if (!existsSync(p)) throw new Error('그림 없음 ' + p); return p }
const 데 = (p) => `data:image/${p.endsWith('.webp') ? 'webp' : 'png'};base64,${readFileSync(읽(p)).toString('base64')}`
const 스 = (k) => 데(join(ASSET, `src/assets/stickers/photo/${k}.png`))
const 크 = (id) => 데(join(ASSET, `public/ev/xmas/${id}.webp`))
const 속지 = (n) => { const f = ['', '창문', '우표편지', '뜨개', '스노우볼', '오너먼트', '군고구마', '붕어빵'][n]; return 데(join(ROOT, `docs/stickers/속지-겨울-시험-2026-10-21/2차-${n}-${f}.png`)) }
const 간식 = (k) => 데(join(ROOT, `docs/stickers/곰펭-겨울간식-2026-10-21/낱개/${k}.png`))
const 폰트 = readFileSync(join(ASSET, 'design/promo/fonts-embed.css'), 'utf8')
const 앱 = 데(join(ASSET, 'public/icons/icon-512-v7.png'))
// 편마다 바탕을 갈랐다(창업자 2026-11-27 「배경색도 바꿔줘 1번이랑 같으니까」) — 한끼 색조합 ②·③·①
const 색판 = {
  스노우볼: { bg: '#D4E8E6', bg2: '#EAF4F2', ink: '#3B2C25', pink: '#D6A9AD', red: '#C8432F', cream: '#FFFBF3', 가림: 'rgba(212,232,230,.86)' },   // ② 시글라스 에스프레소
  일꾸: { bg: '#E3E6CF', bg2: '#F1F2E4', ink: '#4A1D33', pink: '#979936', red: '#4A1D33', cream: '#FFFDF6', 가림: 'rgba(227,230,207,.86)' },       // ③ 쑥떡 플럼
  레꾸: { bg: '#EFE6D2', bg2: '#F8F2E6', ink: '#3B2C25', pink: '#B0B7A2', red: '#6B3344', cream: '#FFFDF8', 가림: 'rgba(239,230,210,.86)' },      // ① 보리차 로즈
}
const C = 색판[편] || 색판.스노우볼
const FPS = 24
const 장면 = []; let T = 0
const 넣기 = (d, 종류, 내용 = {}) => { 장면.push({ s: T, d, 종류, ...내용 }); T += d }

// ── 공통 겉 (눈 · 표지 · 끝) ───────────────────────────────
const 눈 = Array.from({ length: 70 }, (_, i) => ({ x: (i * 157) % 1080, y: (i * 389) % 1920, r: 4 + (i % 5) * 2, v: 40 + (i % 7) * 18, w: (i % 3) + 1 }))
const 공통css = `${폰트}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;position:relative;font-family:'Jua',sans-serif;color:${C.ink};background:linear-gradient(180deg,${C.bg2},${C.bg})}
.눈{position:absolute;border-radius:50%;background:#fff;opacity:.85;box-shadow:0 0 6px rgba(255,255,255,.9)}
.겉{position:absolute;opacity:0}
#표지{left:0;right:0;top:300px;text-align:center}
.pill{display:inline-block;background:${C.red};color:#fff;border-radius:999px;padding:12px 38px;font-size:46px;box-shadow:0 8px 18px rgba(59,44,37,.25)}
#표지 .big{font-size:170px;line-height:1.05;margin-top:30px;color:${C.ink}}
#표지 .lead{font-family:'GowunDodum';font-size:48px;margin-top:34px;line-height:1.5;color:${C.ink}}
#끝{left:0;right:0;top:1180px;text-align:center}
#끝 .h{font-size:104px;line-height:1.12}
.알약{display:inline-flex;align-items:center;gap:22px;background:${C.ink};color:#fff;border-radius:999px;padding:20px 44px;font-size:48px;margin-top:34px;box-shadow:0 16px 36px rgba(59,44,37,.35)}
.알약 img{width:76px;height:76px;border-radius:20px}
#끝 .검{font-family:'GowunDodum';font-size:46px;margin-top:22px}
#머리{left:0;right:0;top:120px;text-align:center}
.s{position:absolute;filter:drop-shadow(0 8px 10px rgba(59,44,37,.28))}
`
const 표지html = (pill, big, lead) => `<div id="표지" class="겉"><span class="pill">${pill}</span><div class="big">${big}</div><div class="lead">${lead}</div></div>`
const 끝html = (h) => `<div id="끝" class="겉"><div class="h">${h}</div><div class="알약"><img src="${앱}">App Store · Google Play</div><div class="검">「한끼 레시피북」 검색</div></div>`
const 공통js = `
const 이즈=(x)=>1-Math.pow(1-Math.min(1,Math.max(0,x)),3), 튐=(x)=>{x=Math.min(1,Math.max(0,x));return 1+2.2*Math.pow(x-1,3)+1.2*Math.pow(x-1,2)}, $=(i)=>document.getElementById(i)
const 눈=${JSON.stringify(눈)}
function 눈그리기(t){document.querySelectorAll('.눈').forEach((el,i)=>{const s=눈[i];const y=(s.y+t*s.v)%1960-20;const x=s.x+Math.sin(t*s.w+i)*30;el.style.transform='translate('+x+'px,'+y+'px)'})}
// 🩷 스티커 붙이기 — 손으로 들고 와서(크게·기울어져·그림자 멀리) 탁 눌러 붙이고(살짝 눌림) 그 뒤엔 숨 쉬듯 흔들 (창업자 2026-11-27 「스티커 붙이는 것도 움직이게」)
function 붙이기(el,시작,p,t,각,오는쪽){const x=(p-시작)/0.2; if(x<=0){el.style.opacity=0;return}
  const a=이즈(x), 눌=x>0.8&&x<1.15?Math.sin((x-0.8)/0.35*Math.PI)*0.08:0
  const dx=(오는쪽||1)*320*(1-a), dy=-380*(1-a), 들림=1-a
  el.style.opacity=Math.min(1,x*4)
  el.style.transform='translate('+dx+'px,'+dy+'px) rotate('+(각+30*(오는쪽||1)*들림+(x>1?Math.sin(t*2.2+각)*2:0))+'deg) scale('+(1+0.35*들림-눌)+','+(1+0.35*들림-눌*0.6)+')'
  el.style.filter='drop-shadow(0 '+(6+40*들림)+'px '+(8+24*들림)+'px rgba(59,44,37,'+(0.3-0.12*들림)+'))'}
function 겉(c,p,t){for(const id of ['표지','끝'])$(id).style.opacity=0
  const a=이즈(p/0.25)
  if(c.종류==='표지'){const o=a*(p>0.86?1-(p-0.86)/0.14:1);$('표지').style.opacity=o;$('표지').style.transform='translateY('+(60*(1-a))+'px)'}
  if(c.종류==='끝'){const o=이즈((p-0.15)/0.25);$('끝').style.opacity=o;$('끝').style.transform='translateY('+(50*(1-o))+'px)'}}
`
const 눈html = 눈.map(() => `<div class="눈" style="width:${0}px"></div>`).join('')
const 눈크기 = `<script>document.querySelectorAll('.눈').forEach((el,i)=>{const r=${JSON.stringify(눈.map((s) => s.r))}[i];el.style.width=el.style.height=r+'px'})</script>`

let html = ''
// ══════════════════════════════════════════════════════════
if (편 === '스노우볼') {
  const 묶음 = [
    ['한끼 친구들의 크리스마스', 19, ['xk_n012_02', 'xk_c02_01', 'xk_n05_02', 'xk_n09_01', 'xk_c01_02', 'xk_n012_04', 'xk_s05', 'xk_n05_01', 'xk_c04_02', 'xk_n012_03', 'xk_s07', 'xk_n09_03']],
    ['한끼 친구들의 겨울', 12, ['xk_s01', 'xk_s02', 'xk_s03', 'xk_s04', 'xk_c02_02', 'xk_c02_03', 'xk_n05_05', 'xk_c01_04', 'xk_n09_04']],
    ['진저브레드 쿠키', 9, ['xg01', 'xg02', 'xg03', 'xg04', 'xg05', 'xg06', 'xg07', 'xg08', 'xg09']],
    ['크리스마스 소품·메모', 22, ['xd06', 'xd13', 'xd14', 'xi03', 'xi07', 'xp05', 'xp09', 'xp12', 'xn02', 'xn06', 'xn07', 'xi01']],
    ['테이프 4 · 프레임 4', 8, ['xf01', 'xf03', 'xf05', 'xf12', 'xh01', 'xh02', 'xh03', 'xh04']],
  ]
  const 모두0 = [...new Set(묶음.flatMap((g) => g[2]))]
  const 그림 = Object.fromEntries(모두0.map((k) => [k, 스(k)]))
  // 유리 안엔 «스티커»만 — 프레임·테이프는 유리 안에서 엉뚱하게 보였다(창업자 2026-11-27 「왼쪽 프레임 그 자리가 아니라 이상해」)
  const 모두 = 모두0.filter((k) => !/^x[fh]/.test(k))
  const 간식들 = ['wg_02', 'wg_03', 'wg_04'].map(간식), 속지들 = [1, 2, 3, 4, 5, 6, 7].map(속지)
  // 유리 안 자리 (가운데 540,900 · 반지름 360)
  const 안 = 모두.map((k, i) => { const a = i * 2.399, r = 70 + 270 * Math.sqrt((i + 0.5) / 모두.length); return { k, x: 540 + Math.cos(a) * r, y: 900 + Math.sin(a) * r * 0.95 } })
  // 묶음 자리 (위쪽 격자)
  // 칸 = 정사각형 · 그림은 칸 «안에» 맞춰 넣는다(contain) → 키 큰 그림이 옆·제목을 안 덮는다 (창업자 「붙어있고 정렬이 안 된 느낌 · 제목이랑 겹친다」)
  const 위 = 430, 아래 = 1760
  const 격자 = (n, i, 테이프) => {
    if (테이프) return i < 4 ? { x: 540 + ((i % 2) - 0.5) * 420, y: 600 + Math.floor(i / 2) * 400, w: 360, h: 340 } : { x: 540, y: 1430 + (i - 4) * 110, w: 860, h: 96 }
    const 열 = n > 9 ? 3 : 3, 줄 = Math.ceil(n / 열), 칸 = Math.min(300, (아래 - 위) / 줄 - 20), 사이 = 칸 + 24
    const cx = i % 열, cy = Math.floor(i / 열), 이줄수 = Math.min(열, n - cy * 열)   // 마지막 줄이 덜 차면 가운데로
    return { x: 540 + (cx - (이줄수 - 1) / 2) * 사이, y: 위 + (아래 - 위 - 줄 * 사이) / 2 + (cy + 0.5) * 사이, w: 칸, h: 칸 } }
  넣기(2.4, '표지'); 넣기(2.0, '흔들')
  묶음.forEach((g, i) => 넣기(2.5, '묶음', { n: i, 이름: g[0], 수: g[1], 테이프: i === 4 }))
  넣기(3.0, '새것'); 넣기(3.6, '끝')
  html = `<!doctype html><meta charset="utf-8"><style>${공통css}
#유리{position:absolute;left:150px;top:510px;width:780px;height:780px;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.95),rgba(255,255,255,.55) 40%,rgba(205,230,232,.6) 75%,rgba(160,200,205,.7));border:10px solid rgba(255,255,255,.9);box-shadow:inset -30px -40px 80px rgba(120,170,175,.45),0 30px 60px rgba(59,44,37,.25)}
#빛{position:absolute;left:250px;top:580px;width:220px;height:130px;border-radius:50%;background:rgba(255,255,255,.7);filter:blur(8px);transform:rotate(-30deg)}
#받침{position:absolute;left:250px;top:1250px;width:580px;height:230px;background:linear-gradient(180deg,#A9764B,#7C5233);clip-path:polygon(9% 0,91% 0,100% 100%,0 100%);border-radius:30px;box-shadow:0 30px 50px rgba(59,44,37,.35)}
#리본{position:absolute;left:250px;top:1300px;width:580px;height:50px;background:${C.pink};clip-path:polygon(4% 0,96% 0,98% 100%,2% 100%)}
#이름표{left:0;right:0;top:150px;text-align:center}
#이름표 .n{display:inline-block;background:${C.cream};border:7px dashed ${C.red};border-radius:36px;padding:18px 46px;font-size:76px;box-shadow:0 16px 30px rgba(59,44,37,.25)}
#이름표 .m{font-size:52px;color:${C.red};margin-top:14px}
#가림{position:absolute;inset:0;background:${C.가림};opacity:0}
#새것{left:0;right:0;top:120px;text-align:center}
.속{position:absolute;width:250px;border-radius:14px;box-shadow:0 14px 24px rgba(59,44,37,.3)}
.간{position:absolute;width:300px;filter:drop-shadow(0 10px 12px rgba(59,44,37,.3))}
</style>
${눈html}
<div id="받침"></div><div id="리본"></div>
<div id="유리">${안.map((s, i) => `<img class="s 안" data-i="${i}" src="${그림[s.k]}" style="width:${s.k.startsWith('xh') ? 220 : 120}px;left:0;top:0">`).join('')}</div><div id="빛"></div>
<div id="가림"></div>
${묶음.map((g, gi) => g[2].map((k, i) => { const p = 격자(g[2].length, i, gi === 4); return `<img class="s 밖" data-g="${gi}" data-i="${i}" data-cx="${p.x}" data-cy="${p.y}" src="${그림[k]}" style="width:${p.w}px;height:${p.h}px;object-fit:contain;left:${p.x - p.w / 2}px;top:${p.y - p.h / 2}px;opacity:0">` }).join('')).join('')}
<div id="이름표" class="겉"><div class="n" id="이름"></div><div class="m" id="수"></div></div>
<div id="새것" class="겉"><span class="pill">NEW · 이번에 새로 그렸어요</span><div style="font-size:88px;margin-top:24px;line-height:1.2">겨울 간식 스티커 3<br>겨울 일기 속지 7장</div></div>
${속지들.map((s, i) => `<img class="속" id="속${i}" src="${s}" style="opacity:0">`).join('')}
${간식들.map((s, i) => `<img class="간" id="간${i}" src="${s}" style="opacity:0">`).join('')}
${표지html('12월 1일 열려요', '겨울 꾸미기<br>도착!', '스노우볼을 흔들면 쏟아져요 ❄️')}
${끝html('꾸미기 재료 80가지<br>새로 열려요!')}
${눈크기}
<script>${공통js}
const 장면=${JSON.stringify(장면)},안=${JSON.stringify(안)},격자수=${JSON.stringify(묶음.map((g) => g[2].length))}
const 안번={};${JSON.stringify(묶음.map((g) => g[2]))}.forEach((ks,gi)=>ks.forEach((k,i)=>{(안번[k]=안번[k]||[]).push([gi,i])}))
window.render=(t)=>{
  const c=장면.find(x=>t>=x.s&&t<x.s+x.d)||장면[장면.length-1], p=(t-c.s)/c.d
  눈그리기(t); 겉(c,p,t)
  // 유리 흔들기 — 흔들 장면에서 크게, 나머지는 살짝
  const 세=c.종류==='흔들'?Math.sin(p*Math.PI)*1:0
  const 각=Math.sin(t*14)*9*세
  for(const id of ['유리','빛'])$(id).style.transform='rotate('+각+'deg)'
  document.querySelectorAll('.안').forEach((el,i)=>{const s=안[i];const 돌=t*(0.25+세*3.2)+i;const dx=Math.cos(돌)*(18+세*120),dy=Math.sin(돌*1.3)*(18+세*140)
    const 가라=(c.종류==='끝')?이즈(p/0.5):0
    const x=s.x-150+dx, y=s.y-510+dy+가라*Math.max(0,(560-(s.y-510)))*0.55
    el.style.transform='translate('+(x-60)+'px,'+(y-60)+'px) rotate('+(Math.sin(돌)*25)+'deg)'})
  $('가림').style.opacity=0;$('이름표').style.opacity=0;$('새것').style.opacity=0
  document.querySelectorAll('.밖').forEach(el=>{el.style.opacity=0})
  for(let i=0;i<7;i++)$('속'+i).style.opacity=0; for(let i=0;i<3;i++)$('간'+i).style.opacity=0
  if(c.종류==='표지'){const o=이즈(p/0.25)*(p>0.86?1-(p-0.86)/0.14:1);$('가림').style.opacity=0.8*o}
  if(c.종류==='끝'){$('가림').style.opacity=0.7*이즈((p-0.15)/0.25)}
  if(c.종류==='묶음'){
    const 들=이즈(p/0.15), 나=p>0.85?1-(p-0.85)/0.15:1
    $('가림').style.opacity=0.85*들*나; $('이름표').style.opacity=들*나; $('이름').textContent=c.이름; $('수').textContent=c.수+'개'
    $('이름표').style.transform='scale('+(0.7+0.3*튐(p/0.2))+')'
    document.querySelectorAll('.밖[data-g="'+c.n+'"]').forEach((el,i)=>{const 늦=i*0.035;const q=튐((p-0.05-늦)/0.22)
      el.style.opacity=Math.min(1,Math.max(0,(p-0.05-늦)/0.06))*나
      const cx=+el.dataset.cx, cy=+el.dataset.cy, m=1-Math.min(1,q)
      el.style.transform='translate('+((540-cx)*m)+'px,'+((900-cy)*m)+'px) scale('+(0.2+0.8*q)+') rotate('+(Math.sin(t*2.5+i)*2.5)+'deg)'})
  }
  if(c.종류==='새것'){
    const 들=이즈(p/0.15), 나=p>0.9?1-(p-0.9)/0.1:1
    $('가림').style.opacity=0.85*들*나; $('새것').style.opacity=들*나
    for(let i=0;i<7;i++){const q=튐((p-0.1-i*0.05)/0.25), el=$('속'+i);el.style.opacity=Math.min(1,q)*나
      const x=540+(i-3)*125, y=900+Math.abs(i-3)*22, r=(i-3)*7
      el.style.left=(x-125)+'px';el.style.top=(y-167)+'px';el.style.transform='rotate('+r+'deg) scale('+(0.3+0.7*Math.min(1.1,q))+') translateY('+(200*(1-Math.min(1,q)))+'px)'}
    for(let i=0;i<3;i++){const q=튐((p-0.45-i*0.08)/0.25), el=$('간'+i);el.style.opacity=Math.min(1,Math.max(0,q))*나
      el.style.left=(60+i*330)+'px';el.style.top='1260px';el.style.transform='scale('+(0.2+0.8*Math.min(1.1,Math.max(0,q)))+') rotate('+((i-1)*5)+'deg)'}
  }
}
</script>`
}
// ══════════════════════════════════════════════════════════
if (편 === '일꾸') {
  if (!MASK) throw new Error('MASK 폴더가 필요하다(속지 창 마스크)')
  const 창 = JSON.parse(readFileSync(join(MASK, '창.json'), 'utf8'))
  // [요일, 속지, 그림, 이름, [캐릭터 스티커(큼직), 소품 스티커], 일기 두 줄]
  const 날 = [
    // 일기 = [오늘 먹은 것 한 줄, 힘나는 한마디] (창업자 2026-11-27 「일기에 힘나는 글귀들도 적어줘」·「큼직큼직하게」)
    ['월요일', 1, 'basic-gamja-cheese-omelet', '감자 치즈 오믈렛', ['wg_02', 'xd06'], ['첫눈 온 날, 치즈 오믈렛', '이번 주도 천천히,|잘 해낼 거야']],
    ['화요일', 2, 'basic-cheese-yubu-jumeokbap', '치즈 유부주먹밥', ['xk_c02_02', 'xg01'], ['도시락엔 유부주먹밥', '작은 한 끼에도|정성 한 스푼']],
    ['수요일', 3, 'basic-onepan-cream-pasta', '원팬 크림 파스타', ['xk_n05_01', 'xd14'], ['크리스마스 기분 파스타', '오늘 하루도|충분히 잘했어']],
    ['목요일', 4, 'basic-yangsongi-gamja-soup', '양송이감자스프', ['xk_c02_03', 'xg07'], ['추운 날엔 따끈한 스프', '따뜻한 한 그릇이면|힘이 나']],
    ['금요일', 5, 'basic-gul-jeon', '굴전', ['xk_n012_02', 'xi03'], ['불금엔 바삭한 굴전!', '고생한 나에게|맛있는 선물']],
    ['토요일', 6, 'basic-spam-ttaengcho-gimbap', '스팸 땡초 김밥', ['wg_03', 'xg04'], ['김밥 싸서 나들이~', '쉬어 가는 것도|잘하는 거야']],
    ['일요일', 7, 'basic-honghap-tang', '포장마차 홍합탕', ['wg_04', 'xg02'], ['한 주 마무리, 홍합탕', '다음 주도 맛있게,|힘내자!']],
  ]
  const 스티커그림 = (k) => (k.startsWith('wg_') ? 간식(k) : 스(k))
  // 자리 = 속지 원본(896×1200) 픽셀 «가운데» — 창(사진)·일기 메모를 피해 모서리에 (창업자 2026-11-27 「귀여운 스티커들도 좀 큼직하게」)
  const 붙일자리 = [[[170, 220], [770, 700]], [[740, 230], [140, 700]], [[170, 200], [760, 690]], [[760, 200], [140, 700]], [[160, 220], [770, 690]], [[760, 210], [140, 700]], [[170, 200], [770, 690]]]
  const 붙크기 = [370, 240]
  // 일기 메모 = 우리 줄노트 스티커(xn07) 위 손글씨 · 스노우볼은 속지 아래 흰 글칸에 바로 (창업자 2026-11-27 「일기에 글도 들어가야할 것 같아」)
  // 장마다 «다른 날 쓴 것처럼» — 메모지·글씨체·펜 색·기울기·자리를 다 바꾼다 (창업자 2026-11-27 「하루에 다 몰아쓴 것 처럼」·「각장마다 차별화」)
  //   [가운데x, 가운데y, 폭, 기울기, 메모지(null = 속지 글칸), 높이/폭, 글자 칸 [왼%,위%,오른%], 글씨체, 펜 색, 글자 크기]
  const 메모자리 = [
    [448, 960, 880, -2, 'xn09', 263 / 391, [22, 27, 9], 'NanumPen', '#2E4A7A', 60],   // 월 · 크리스마스 카드 · 남색 펜
    [600, 930, 620, 4, 'xn07', 310 / 343, [11, 30, 9], 'Gaegu', '#7A4A24', 50],       // 화 · 줄노트 · 갈색 연필
    [440, 980, 760, -4, 'xn12', 259 / 381, [12, 30, 12], 'Jua', '#FFFDF4', 50],       // 수 · 초록 종이 · 흰 펜
    [448, 1030, 640, 0, null, 170 / 640, [4, 9, 4], 'GowunDodum', '#B23A3A', 33],    // 목 · 스노우볼 속지 글칸 · 빨간 펜
    [448, 965, 760, 3, 'xn02', 306 / 373, [18, 40, 18], 'NanumPen', '#2F6B45', 50],  // 금 · 레이스 메모 · 초록 펜
    [580, 960, 700, -3, 'xn01', 291 / 401, [14, 27, 10], 'Gaegu', '#6A4A9C', 50],     // 토 · 카드 · 보라 펜
    [600, 990, 560, 5, 'xn06', 340 / 349, [20, 32, 20], 'Jua', '#C0507A', 33],        // 일 · 리스 메모 · 분홍 펜
  ]
  넣기(2.4, '표지')
  날.forEach((d, i) => 넣기(3.1, '날', { n: i }))
  넣기(3.8, '끝')
  const 판W = 840, 판비 = 판W / 896, 판H = 1200 * 판비, 판X = (1080 - 판W) / 2, 판Y = 300
  html = `<!doctype html><meta charset="utf-8"><style>${공통css}
.판{position:absolute;left:${판X}px;top:${판Y}px;width:${판W}px;height:${판H}px;border-radius:22px;overflow:hidden;box-shadow:0 24px 50px rgba(59,44,37,.3);opacity:0;transform-origin:0% 50%}
.판>img.바{position:absolute;inset:0;width:100%;height:100%}
.사{position:absolute;inset:0;-webkit-mask-size:100% 100%;mask-size:100% 100%;background:${C.cream}}
.사 img{position:absolute;object-fit:contain}
.붙{position:absolute;object-fit:contain;filter:drop-shadow(0 6px 8px rgba(59,44,37,.3))}
.메모{position:absolute;opacity:0}
.메모 img{position:absolute;inset:0;width:100%;height:100%;object-fit:fill}
.메모 .글{position:absolute;text-align:center;line-height:1.3;white-space:nowrap}
.메모 .줄{display:block;clip-path:inset(0 100% 0 0)}
#요일{left:0;right:0;top:150px;text-align:center}
#요일 .d{display:inline-block;background:${C.ink};color:#fff;border-radius:999px;padding:12px 44px;font-size:64px}
#음식{left:0;right:0;top:${판Y + 판H + 40}px;text-align:center;font-size:66px}
#음식 small{display:block;font-family:'GowunDodum';font-size:38px;margin-top:6px;color:#6B5A50}
.작{position:absolute;width:250px;border-radius:12px;box-shadow:0 12px 22px rgba(59,44,37,.3);opacity:0}
</style>
${눈html}
${날.map((d, i) => { const w = 창[String(d[1])].bbox; const [x0, y0, x1, y1] = w.map((v) => v * 판비)
  // 그릇 «통째»가 창 안에 보이게 — 창 크기의 78% 안에 contain (창업자 2026-11-27 「사이즈를 다 줄여야해 그릇이 보이게」)
  const 줄 = 0.98, cw = (x1 - x0) * 줄, ch = (y1 - y0) * 줄, cx0 = x0 + (x1 - x0 - cw) / 2, cy0 = y0 + Math.min((y1 - y0 - ch) / 2, 20)   // 그릇은 창 «위쪽»에 — 아래는 일기 메모가 덮는다
  return `<div class="판" id="판${i}"><img class="바" src="${속지(d[1])}"><div class="사" style="-webkit-mask-image:url(${데(join(MASK, `c${d[1]}.png`))});mask-image:url(${데(join(MASK, `c${d[1]}.png`))})"><img id="사${i}" src="${크(d[2])}" style="left:${cx0}px;top:${cy0}px;width:${cw}px;height:${ch}px"></div>
  ${(() => { const [mx, my, mw, mr, 지, 비, [gl, gt, gr], 체, 펜, 크] = 메모자리[i], 칸 = !지, W = mw * 판비, H = mw * 비 * 판비
    return `<div class="메모${칸 ? ' 칸' : ''}" id="메모${i}" style="left:${mx * 판비 - W / 2}px;top:${my * 판비 - H / 2}px;width:${W}px;height:${H}px;--r:${mr}deg">${칸 ? '' : `<img src="${스(지)}">`}<div class="글" style="left:${gl}%;top:${gt}%;right:${gr}%;font-family:'${체}';color:${펜};font-size:${크}px">${d[5].flatMap((l) => l.split('|')).map((l) => `<span class="줄">${l}</span>`).join('')}</div></div>` })()}
  ${d[4].map((k, j) => { const [px, py] = 붙일자리[i][j], s = 붙크기[j] * 판비; return `<img class="붙" id="붙${i}_${j}" src="${스티커그림(k)}" style="width:${s}px;height:${s}px;left:${px * 판비 - s / 2}px;top:${py * 판비 - s / 2}px;opacity:0">` }).join('')}</div>` }).join('')}
${날.map((d, i) => `<img class="작" id="작${i}" src="${속지(d[1])}">`).join('')}
<div id="요일" class="겉"><span class="d" id="요일t"></span></div>
<div id="음식" class="겉"><span id="음식t"></span><small>새 겨울 속지 · <span id="속이름"></span></small></div>
${표지html('12월 1일 · 새 겨울 속지 7장', '겨울 일기<br>일주일', '하루 한 장, 오늘 먹은 한 끼를 남겨요')}
${끝html('한 주 겨울 일기<br>완성!')}
${눈크기}
<script>${공통js}
const 장면=${JSON.stringify(장면)},날=${JSON.stringify(날.map((d) => [d[0], d[3], ['', '창문', '우표편지', '뜨개', '스노우볼', '오너먼트', '군고구마', '붕어빵'][d[1]]]))}
window.render=(t)=>{
  const c=장면.find(x=>t>=x.s&&t<x.s+x.d)||장면[장면.length-1], p=(t-c.s)/c.d
  눈그리기(t); 겉(c,p,t)
  for(const id of ['요일','음식'])$(id).style.opacity=0
  for(let i=0;i<7;i++){$('판'+i).style.opacity=0;$('작'+i).style.opacity=0}
  if(c.종류==='날'){const i=c.n, el=$('판'+i)
    // 책장 넘기듯 들어오고(앞 0.18) 나간다(뒤 0.12)
    const 들=이즈(p/0.18), 나=p>0.88?이즈((p-0.88)/0.12):0
    el.style.opacity=1; el.style.transform='perspective(1800px) rotateY('+(-70*(1-들)+80*나)+'deg) translateX('+(-120*나)+'px)'
    const 사=이즈((p-0.2)/0.2); $('사'+i).style.opacity=사; $('사'+i).style.transform='scale('+(1.25-0.25*사)+')'
    // 메모가 붙고(0.3) → 한 줄씩 써진다(0.38~0.62) → 스티커 둘이 날아와 붙는다(0.6·0.72)
    const 메=$('메모'+i), 칸=메.classList.contains('칸'), r=parseFloat(메.style.getPropertyValue('--r'))
    if(칸){메.style.opacity=1}else{붙이기(메,0.26,p,t,r,1);메.style.filter='none'}
    메.querySelectorAll('.줄').forEach((줄,k)=>{const w=Math.min(1,Math.max(0,(p-0.38-k*0.12)/0.12));줄.style.clipPath='inset(0 '+((1-w)*100)+'% 0 0)'})   // 줄마다 0.12 간격으로 써진다(세 줄 = 0.38~0.74)
    for(let j=0;j<2;j++)붙이기($('붙'+i+'_'+j),0.6+j*0.12,p,t,j?8:-8,j?-1:1)
    $('요일').style.opacity=들*(1-나); $('요일t').textContent=날[i][0]
    $('음식').style.opacity=이즈((p-0.25)/0.15)*(1-나); $('음식t').textContent=날[i][1]; $('속이름').textContent=날[i][2]
    if(i>0){const 앞=$('판'+(i-1));앞.style.opacity=1-들;앞.style.transform='perspective(1800px) rotateY('+(80)+'deg)'}
  }
  if(c.종류==='끝'||c.종류==='표지'){const q=c.종류==='끝'?이즈(p/0.3):0
    for(let i=0;i<7;i++){const el=$('작'+i);const x=540+(i-3)*118,y=560+Math.abs(i-3)*26;el.style.opacity=c.종류==='끝'?Math.min(1,Math.max(0,(p-i*0.03)/0.15)):0
      el.style.left=(x-125)+'px';el.style.top=(y-167)+'px';el.style.transform='rotate('+((i-3)*6)+'deg) scale('+(0.6+0.4*q)+')'}}
}
</script>`
}
// ══════════════════════════════════════════════════════════
if (편 === '레꾸') {
  const 짝 = [
    ['n3088', 'basic-gamja-cheese-omelet', '감자 치즈 오믈렛', ['xf01', 'xg01']],
    ['n3096', 'basic-spam-ttaengcho-gimbap', '스팸 땡초 김밥', ['xh02', 'xk_n05_02']],
    ['n3090', 'basic-cheese-yubu-jumeokbap', '치즈 유부주먹밥', ['xi01', 'xg03']],
    ['n3108', 'basic-yangsongi-gamja-soup', '양송이감자스프', ['xh01', 'xk_n012_02']],
    ['n3079', 'basic-honghap-tang', '포장마차 홍합탕', ['xp05', 'xk_c02_03']],
  ]
  const 모음 = ['basic-bibim-gim-guksu', 'basic-gul-sotbap', 'basic-haemul-oil-pasta', 'basic-kkomak-muchim', 'basic-eomuk-tang', 'basic-sukiyaki', 'basic-onepan-tortilla-toast', 'basic-dakgomtang', 'basic-paik-sijang-tteokbokki']
  넣기(2.4, '표지')
  짝.forEach((_, i) => 넣기(2.7, '카드', { n: i }))
  넣기(2.8, '모음'); 넣기(3.6, '끝')
  html = `<!doctype html><meta charset="utf-8"><style>${공통css}
#카드{position:absolute;left:130px;top:330px;width:820px;height:1080px;background:${C.cream};border-radius:44px;box-shadow:0 30px 60px rgba(59,44,37,.28);opacity:0}
#접시{position:absolute;left:80px;top:70px;width:660px;height:600px}
#접시 img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
#제목{position:absolute;left:0;right:0;top:720px;text-align:center;font-size:76px}
#단추{position:absolute;left:150px;right:150px;top:860px;height:120px;border-radius:999px;background:#fff;border:5px solid ${C.ink};display:flex;align-items:center;justify-content:center;font-size:52px;gap:14px}
#단추.켬{background:${C.red};border-color:${C.red};color:#fff}
#톡{position:absolute;width:150px;height:150px;border-radius:50%;border:8px solid ${C.red};opacity:0}
#반짝{position:absolute;left:0;top:0;width:820px;height:700px;pointer-events:none}
.별{position:absolute;color:#E9B949;font-size:60px;opacity:0}
.붙{position:absolute;filter:drop-shadow(0 8px 10px rgba(59,44,37,.3));opacity:0}
#머리{left:0;right:0;top:140px;text-align:center}
.모{position:absolute;width:300px;opacity:0;filter:drop-shadow(0 10px 12px rgba(59,44,37,.25))}
#모음글{left:0;right:0;top:150px;text-align:center}
#모음글 .h{font-size:84px;line-height:1.15;margin-top:22px}
</style>
${눈html}
<div id="머리" class="겉"><span class="pill" id="머리t"></span></div>
<div id="카드"><div id="접시"><img id="흰"><img id="크"></div><div id="반짝">${Array.from({ length: 10 }, (_, i) => `<span class="별" id="별${i}">✦</span>`).join('')}</div>
<div id="제목"></div><div id="단추"><span>🎄</span><span>크리스마스 그릇</span></div><div id="톡"></div>
<img class="붙" id="붙0"><img class="붙" id="붙1"></div>
${모음.map((k, i) => `<img class="모" id="모${i}" src="${크(k)}">`).join('')}
<div id="모음글" class="겉"><span class="pill">12월 1일부터</span><div class="h">레시피 44편이<br>크리스마스 그릇으로</div></div>
${표지html('12월 1일 · 그릇 바꾸기', '레시피도<br>크리스마스 옷!', '흰 그릇 → 🎄 크리스마스 그릇, 단추 한 번')}
${끝html('내 레시피 카드도<br>크리스마스처럼!')}
${눈크기}
<script>${공통js}
const 장면=${JSON.stringify(장면)},짝=${JSON.stringify(짝.map((x) => [스(x[0]), 크(x[1]), x[2], x[3].map((k) => [k, 스(k)])]))}
// 카드(820×1080) «안» 자리 [x,y,폭] — 제목(720~)·단추(860~)를 안 가리고 카드 밖으로 안 나가게 · 테이프는 카드 윗변에 걸쳐 붙인다(진짜 마테처럼)
const 붙자리=[[[24,24,240],[624,470,170]],[[160,-30,500],[604,450,200]],[[24,24,210],[624,470,170]],[[160,-30,500],[24,450,210]],[[616,24,180],[24,460,200]]]
window.render=(t)=>{
  const c=장면.find(x=>t>=x.s&&t<x.s+x.d)||장면[장면.length-1], p=(t-c.s)/c.d
  눈그리기(t); 겉(c,p,t)
  $('카드').style.opacity=0;$('머리').style.opacity=0;$('모음글').style.opacity=0
  for(let i=0;i<9;i++)$('모'+i).style.opacity=0
  if(c.종류==='카드'){const i=c.n, d=짝[i]
    const 들=이즈(p/0.12), 나=p>0.9?이즈((p-0.9)/0.1):0
    $('카드').style.opacity=1-나; $('카드').style.transform='translateX('+(700*(1-들)-700*나)+'px) rotate('+(4*(1-들)-4*나)+'deg)'
    $('머리').style.opacity=들*(1-나); $('머리t').textContent='레시피 '+(i+1)+' / '+짝.length
    if($('흰').dataset.k!=i){$('흰').src=d[0];$('크').src=d[1];$('흰').dataset.k=i;$('제목').textContent=d[2];$('붙0').src=d[3][0][1];$('붙1').src=d[3][1][1]}
    // 0.3 에 단추 «톡» → 0.36 에 그릇이 바뀐다
    const 바=이즈((p-0.34)/0.12); $('흰').style.opacity=1-바; $('크').style.opacity=바; $('크').style.transform='scale('+(0.85+0.15*튐((p-0.34)/0.18))+')'
    $('단추').className=p>0.32?'켬':''
    const 톡=(p-0.28)/0.14; $('톡').style.opacity=톡>0&&톡<1?1-톡:0; $('톡').style.left=(410-75)+'px';$('톡').style.top=(920-75)+'px';$('톡').style.transform='scale('+(0.4+1.2*Math.max(0,톡))+')'
    for(let k=0;k<10;k++){const s=$('별'+k), q=(p-0.36-k*0.015)/0.25, a=k*0.63;s.style.opacity=q>0&&q<1?1-q:0;s.style.left=(410+Math.cos(a)*(120+260*Math.max(0,q)))+'px';s.style.top=(370+Math.sin(a)*(110+240*Math.max(0,q)))+'px'}
    for(let j=0;j<2;j++){const [x,y,w]=붙자리[i][j], s=$('붙'+j);s.style.width=w+'px';s.style.left=x+'px';s.style.top=y+'px';붙이기(s,0.5+j*0.17,p,t,j?6:-5,j?-1:1)}
  }
  if(c.종류==='모음'){const 들=이즈(p/0.15), 나=p>0.9?1-(p-0.9)/0.1:1;$('모음글').style.opacity=들*나
    for(let i=0;i<9;i++){const q=튐((p-0.1-i*0.04)/0.22), el=$('모'+i), x=540+((i%3)-1)*330, y=760+Math.floor(i/3)*300;el.style.opacity=Math.min(1,Math.max(0,q))*나
      el.style.left=(x-150)+'px';el.style.top=(y-130)+'px';el.style.transform='scale('+Math.max(0,q)+') rotate('+(Math.sin(t*2+i)*3)+'deg)'}}
}
</script>`
}
if (!html) throw new Error('편 이름 = 스노우볼 | 일꾸 | 레꾸')
// ── 찍기 ───────────────────────────────────────────────────
const 총 = T, 장수 = Math.round(총 * FPS)
console.log(`${편} · ${총.toFixed(1)}초 · ${장수}장`)
mkdirSync(join(OUT, 'frames'), { recursive: true })
writeFileSync(join(OUT, `${편}.html`), html)
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {})
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } })
await pg.setContent(html, { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready)
const 미리 = process.env.PREVIEW
if (미리) { for (const 초 of 미리.split(',').map(Number)) { await pg.evaluate((tt) => window.render(tt), 초); await pg.screenshot({ path: join(OUT, `미리-${편}-${초}.png`) }) } await b.close(); process.exit(0) }
for (let i = 0; i < 장수; i++) { await pg.evaluate((tt) => window.render(tt), i / FPS); await pg.screenshot({ path: join(OUT, 'frames', String(i).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 90 }) }
await b.close()
const 파일 = join(OUT, `겨울꾸미기-${편}-릴스.mp4`)
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(OUT, 'frames/%04d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', 파일])
rmSync(join(OUT, 'frames'), { recursive: true, force: true })   // 디스크가 좁다(2.2G) — 찍은 장은 바로 지운다
console.log('✅', 파일)
