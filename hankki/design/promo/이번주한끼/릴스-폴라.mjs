// 📸 폴라로이드 판(크림 종이·카드가 떨어져 쌓인다 · 창업자 2026-11-18 「디자인·구성·효과·색 다시」) · 원판 = 릴스.mjs
// 🎬 인스타 「이번 주 한끼」 릴스 (창업자 2026-11-14 「월요일 레시피·장바구니·이번주한끼 영상 · 디자인·색 다르게」)
// 실행: OUT=<폴더> node design/promo/이번주한끼/릴스.mjs <그 주 월요일> [테마]
//   테마 = navy(겨울밤 남색 · 기본) — 주마다 색을 바꾸려면 아래 테마 표에 한 줄 더한다
// 목록 = 만들기.mjs 와 같은 잣대 · 월=새 레시피 · 수=SNS · 장바구니=일~토 · 원작자 표시 안 함
// 만드는 법 = 한 HTML 에 render(t) 를 두고 24fps 로 한 장씩 찍어 ffmpeg 로 묶는다(시간이 곧 화면 → 흔들림 0)
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
const ROOT = new URL('../../..', import.meta.url).pathname.replace(/\/$/, '')
const 월 = process.argv[2] || '2026-11-16'
const OUT = process.env.OUT || `/tmp/claude-0/이번주한끼폴라-${월}`
const 테마들 = {
  paper: { bg: '#F3EBDD', bg2: '#FBF6EC', ink: '#23402F', sub: '#6E7B6A', accent: '#D2493B', gold: '#E7B448', card: '#FFFFFF', cardInk: '#23402F' },
  navy: { bg: '#1D2846', bg2: '#27355C', ink: '#F7EEDC', sub: '#B9C3DE', accent: '#E8553E', card: '#FBF4E6', cardInk: '#22305A' },
}
const T = 테마들[process.argv[3] || 'paper']
const 더 = (d, n) => { const t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10) }
const 수 = 더(월, 2), 토 = 더(월, 5), 일 = 더(월, 6), md = (d) => `${+d.slice(5, 7)}/${+d.slice(8, 10)}`
const 요일 = (d) => '일월화수목금토'[new Date(d + 'T00:00:00Z').getUTCDay()]
const { 레시피들 } = await import(join(ROOT, 'scripts/recipe.mjs')); const L = 레시피들()
const 월편 = L.filter((r) => r.from === 월), 수편 = L.filter((r) => r.from === 수)
const cur = readFileSync(join(ROOT, 'src/data/curation.js'), 'utf8')
const 줄들 = []; { let g = ''; for (const l of cur.split('\n')) { const m = l.match(/^\s*cat: '.*icon: '([^']+)'/); if (m) g = m[1]; if (/^\s*\{ name: '/.test(l) && !/뺌:/.test(l)) 줄들.push([l, g]) } }
const 장편 = 줄들.map(([l, g]) => ({ name: (l.match(/name: '([^']+)'/) || [])[1], icon: (l.match(/icon: '([^']+)'/) || [])[1] || g, brand: (l.match(/brand: '([^']*)'/) || [])[1] || '', from: (l.match(/from: '([\d-]+)'/) || [])[1] }))
  .filter((p) => p.from && p.from >= 더(월, -1) && p.from <= 토).sort((a, b) => (a.from < b.from ? -1 : 1))
const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`
const 컷 = (k) => b64(join(ROOT, `src/assets/stickers/photo/${k}.png`))
const 장컷 = (k) => b64(join(ROOT, `src/assets/curation/${k}.png`))
const 폰트 = readFileSync(join(ROOT, 'design/promo/fonts-embed.css'), 'utf8')
const 앱 = b64(join(ROOT, 'public/icons/icon-512-v7.png'))

// 🎞 장면 표
const FPS = 24, 장면 = []; let t = 0
const 넣기 = (길이, 종류, 내용) => { 장면.push({ s: t, d: 길이, 종류, ...내용 }); t += 길이 }
const 흔들 = (i) => [((i * 47) % 13) - 6, ((i * 71) % 90) - 45, ((i * 29) % 60) - 30]
넣기(2.8, '표지', {})
const 묶음 = [['월', '새 레시피', `${md(월)} 월요일`, 월편.map((r) => ({ 그림: 컷(r.icon), 이름: r.title, 주: r.made === '창업자' }))],
  ['수', 'SNS 레시피', `${md(수)} 수요일`, 수편.map((r) => ({ 그림: 컷(r.icon), 이름: r.title, 주: r.made === '창업자' }))],
  ['장', '주부의 장바구니', '직접 사서 써 본 것만', 장편.map((p) => ({ 그림: 장컷(p.icon), 이름: p.name, 작게: `${요일(p.from)} ${md(p.from)}${p.brand ? ' · ' + p.brand : ''}` }))]]
for (const [요, 제목, 날, 편] of 묶음) {
  if (!편.length) continue
  넣기(1.0, '갈래', { 요일: 요, 제목, 날, 수: 편.length })
  편.forEach((x, i) => 넣기(1.2, '카드', { ...x, 갈: 제목, i, n: 편.length, 앞: 편.slice(Math.max(0, i - 3), i).map((y, j) => ({ 그림: y.그림, h: 흔들(Math.max(0, i - 3) + j) })), h: 흔들(i) }))
}
넣기(3.4, '끝', {})
const 총 = t, 장수 = Math.round(총 * FPS)
console.log(`월 ${월편.length} · 수 ${수편.length} · 장 ${장편.length} · ${총.toFixed(1)}초 · ${장수}장`)

const html = `<!doctype html><meta charset="utf-8"><style>${폰트}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;position:relative;font-family:'Jua',sans-serif;color:${T.ink};background:${T.bg}}
#종이{position:absolute;inset:0;background:repeating-linear-gradient(0deg, transparent 0 95px, rgba(35,64,47,.06) 95px 97px),radial-gradient(90% 60% at 50% 40%, ${T.bg2} 0%, ${T.bg} 70%)}
#별{position:absolute;inset:0}
.별{position:absolute;width:26px;height:26px;color:${T.gold}}
.장{position:absolute;inset:0;display:none}
.날짜{position:absolute;top:210px;left:0;right:0;text-align:center;font-family:'GowunDodum';font-size:44px;letter-spacing:.12em;color:${T.sub}}
.제{position:absolute;top:290px;left:0;right:0;text-align:center;font-size:200px;line-height:1;letter-spacing:-.03em}
.제 em{font-style:normal;color:${T.accent}}
.밑줄{position:absolute;top:520px;left:50%;width:520px;margin-left:-260px;height:40px}
.요약{position:absolute;top:600px;left:0;right:0;text-align:center;font-family:'GowunDodum';font-size:44px;line-height:1.6}
.폴{position:absolute;background:${T.card};padding:34px 34px 120px;border-radius:10px;box-shadow:0 30px 50px rgba(60,40,20,.22),0 3px 8px rgba(60,40,20,.15)}
.폴 .속{background:#F6F1E7;border-radius:4px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.폴 img{object-fit:contain;filter:drop-shadow(0 14px 14px rgba(60,40,20,.25))}
.테이프{position:absolute;top:-26px;left:50%;width:40%;height:56px;margin-left:-20%;background:rgba(231,180,72,.75);transform:rotate(-3deg)}
.갈래{position:absolute;inset:0}
.달{position:absolute;left:50%;top:480px;width:600px;height:640px;margin-left:-300px;background:${T.card};border-radius:28px;box-shadow:0 30px 60px rgba(60,40,20,.2);transform-origin:50% 0}
.달 .윗{height:160px;background:${T.accent};color:#fff;font-size:72px;display:flex;align-items:center;justify-content:center;letter-spacing:.18em;border-radius:28px 28px 0 0}
.달 .큰{font-size:300px;text-align:center;line-height:460px}
.달 .구멍{position:absolute;top:-18px;width:36px;height:60px;border-radius:18px;background:${T.ink}}
.g제목{position:absolute;top:1240px;left:0;right:0;text-align:center;font-size:120px}
.g날{position:absolute;top:1400px;left:0;right:0;text-align:center;font-family:'GowunDodum';font-size:46px;color:${T.sub}}
.머리{position:absolute;top:200px;left:80px;right:80px;display:flex;justify-content:space-between;align-items:center;font-size:46px}
.점들{display:flex;gap:14px}.점들 i{width:22px;height:22px;border-radius:50%;background:rgba(35,64,47,.18)}.점들 i.on{background:${T.accent}}
.이름{position:absolute;left:60px;right:60px;top:1350px;text-align:center;font-size:112px;line-height:1.08;word-break:keep-all}
.작게{position:absolute;left:0;right:0;top:1280px;text-align:center;font-family:'GowunDodum';font-size:42px;color:${T.sub}}
.끝 .h{position:absolute;top:980px;left:0;right:0;text-align:center;font-size:138px;line-height:1.1}
.끝 .s{position:absolute;top:1300px;left:0;right:0;text-align:center;font-family:'GowunDodum';font-size:46px;color:${T.sub}}
.알약{position:absolute;top:1430px;left:50%;transform:translateX(-50%);white-space:nowrap;display:inline-flex;align-items:center;gap:22px;background:${T.ink};color:#fff;border-radius:999px;padding:22px 46px;font-size:50px;box-shadow:0 16px 36px rgba(35,64,47,.3)}
.알약 img{width:82px;height:82px;border-radius:20px}
.검색{position:absolute;top:1610px;left:0;right:0;text-align:center;font-size:52px}
</style>
<div id="종이"></div><div id="별"></div>
<div class="장" id="표지"><div class="날짜">${md(월)} — ${md(일)}</div><div class="제">이번 주 <em>한끼</em></div>
<svg class="밑줄" viewBox="0 0 520 40"><path id="줄" d="M10 26 C 120 6, 260 36, 510 14" fill="none" stroke="${T.gold}" stroke-width="14" stroke-linecap="round" stroke-dasharray="560" stroke-dashoffset="560"/></svg>
<div class="요약">새 레시피 ${월편.length} · SNS 레시피 ${수편.length}${장편.length ? ` · 장바구니 ${장편.length}` : ''}</div>
<div id="표폴"></div></div>
<div class="장" id="갈래"><div class="갈래"><div class="달" id="달"><div class="구멍" style="left:150px"></div><div class="구멍" style="right:150px"></div><div class="윗" id="g달윗"></div><div class="큰" id="g요일"></div></div><div class="g제목" id="g제목"></div><div class="g날" id="g날"></div></div></div>
<div class="장" id="카드판"><div class="머리"><span id="위"></span><span class="점들" id="점들"></span></div><div id="더미"></div><div class="작게" id="작게"></div><div class="이름" id="이름"></div></div>
<div class="장" id="끝판"><div class="끝"><div id="모음"></div><div class="h">레시피는<br>한끼 앱에서</div><div class="s">재료 · 순서 · 타이머까지 그대로</div>
<div class="알약"><img src="${앱}">App Store · Google Play</div><div class="검색">「한끼 레시피북」 검색</div></div></div>
<script>
const 주인장='${b64(join(ROOT, 'src/assets/avatars/av_gom.png'))}', 장면=${JSON.stringify(장면)}, 총=${총}, 표그림=${JSON.stringify(월편.slice(0, 3).map((r) => 컷(r.icon)))}
const 이즈=(x)=>1-Math.pow(1-Math.min(1,Math.max(0,x)),3)
const 튕=(x)=>{x=Math.min(1,Math.max(0,x));const c=1.7;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)}
const 폴=(src,w,extra)=>'<div class="폴" style="width:'+(w+68)+'px;'+(extra||'')+'"><div class="테이프"></div><div class="속" style="width:'+w+'px;height:'+w+'px"><img src="'+src+'" style="width:'+(w*0.86)+'px;height:'+(w*0.86)+'px"></div></div>'
document.getElementById('표폴').innerHTML=표그림.map((s,i)=>폴(s,360,'left:'+[70,640,355][i]+'px;top:'+[860,880,1080][i]+'px')).join('')
const 별=document.getElementById('별');const 별들=[]
const 별모양='<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="currentColor"/></svg>'
for(let i=0;i<18;i++){const e=document.createElement('div');e.className='별';e.innerHTML=별모양;e.style.left=((i*263)%1000+20)+'px';e.style.top=((i*419)%1800+60)+'px';별.appendChild(e);별들.push({e,w:i*0.9,sz:0.6+(i%4)*0.25})}
const 카드들=장면.filter(x=>x.종류==='카드'); let 지난=''
window.render=(t)=>{
  별들.forEach(s=>{const v=(Math.sin(t*2.2+s.w)+1)/2;s.e.style.opacity=0.15+0.6*v;s.e.style.transform='scale('+(s.sz*(0.6+0.5*v))+') rotate('+(t*20+s.w*40)+'deg)'})
  const c=장면.find(x=>t>=x.s&&t<x.s+x.d)||장면[장면.length-1]; const p=(t-c.s)/c.d, a=이즈(p/0.35), 나감=p>0.88?1-(p-0.88)/0.12:1
  for(const id of ['표지','갈래','카드판','끝판'])document.getElementById(id).style.display='none'
  if(c.종류==='표지'){const el=document.getElementById('표지');el.style.display='block';el.style.opacity=나감
    el.querySelector('.제').style.transform='translateY('+(70*(1-a))+'px)';el.querySelector('.제').style.opacity=a;el.querySelector('.날짜').style.opacity=a
    document.getElementById('줄').style.strokeDashoffset=560*(1-이즈((p-0.15)/0.3))
    el.querySelector('.요약').style.opacity=이즈((p-0.25)/0.25)
    el.querySelectorAll('#표폴 .폴').forEach((f,i)=>{const q=튕((p-0.3-i*0.1)/0.3);f.style.opacity=Math.min(1,q*2);f.style.transform='translateY('+(-1300*(1-q))+'px) rotate('+([-8,7,-2][i]+20*(1-q))+'deg)'})}
  if(c.종류==='갈래'){const el=document.getElementById('갈래');el.style.display='block';el.style.opacity=나감
    document.getElementById('g달윗').textContent=c.요일==='장'?'BASKET':'WEEK';document.getElementById('g요일').textContent=c.요일
    document.getElementById('g제목').textContent=c.제목;document.getElementById('g날').textContent=c.날+' · '+c.수+(c.요일==='장'?'개':'편')
    document.getElementById('달').style.transform='perspective(1400px) rotateX('+(-90*(1-튕(p/0.45)))+'deg)'
    const b=이즈((p-0.2)/0.3);document.getElementById('g제목').style.opacity=b;document.getElementById('g날').style.opacity=b;document.getElementById('g제목').style.transform='translateY('+(40*(1-b))+'px)'}
  if(c.종류==='카드'){const el=document.getElementById('카드판');el.style.display='block'
    document.getElementById('위').textContent=c.갈;document.getElementById('점들').innerHTML=Array.from({length:c.n},(_,k)=>'<i class="'+(k<=c.i?'on':'')+'"></i>').join('')
    const 열쇠=c.갈+c.i
    if(지난!==열쇠){지난=열쇠;document.getElementById('더미').innerHTML=c.앞.map(y=>폴(y.그림,680,'left:'+(166+y.h[1])+'px;top:'+(400+y.h[2])+'px;transform:rotate('+y.h[0]+'deg)')).join('')+폴(c.그림,680,'left:'+(166+c.h[1])+'px;top:'+(400+c.h[2])+'px')
      document.getElementById('이름').innerHTML=c.이름+(c.주?'<img src="'+주인장+'" style="width:108px;height:108px;vertical-align:-14px;margin-left:18px">':'');document.getElementById('작게').textContent=c.작게||''}
    const 더미=document.getElementById('더미').children, 지금=더미[더미.length-1], q=튕(p/0.4)
    지금.style.transform='translateY('+(-1500*(1-q))+'px) rotate('+(c.h[0]+(c.i%2?-24:24)*(1-q))+'deg)'
    const b=이즈((p-0.25)/0.3);const 이=document.getElementById('이름');이.style.opacity=b*나감;이.style.transform='translateY('+(40*(1-b))+'px)';document.getElementById('작게').style.opacity=b*나감}
  if(c.종류==='끝'){const el=document.getElementById('끝판');el.style.display='block'
    if(지난!=='끝'){지난='끝';document.getElementById('모음').innerHTML=카드들.map((x,k)=>폴(x.그림,120,'left:'+(52+(k%5)*200)+'px;top:'+(170+Math.floor(k/5)*245)+'px')).join('')}
    [...document.getElementById('모음').children].forEach((f,k)=>{const q=튕((p-k*0.025)/0.3);f.style.opacity=Math.min(1,q*2);f.style.transform='scale('+q+') rotate('+카드들[k].h[0]+'deg)'})
    const b=이즈((p-0.3)/0.3);for(const s of ['.h','.s','.검색','.알약']){el.querySelector(s).style.opacity=b};el.querySelector('.h').style.transform='translateY('+(50*(1-b))+'px)'}
}
</script>`
mkdirSync(join(OUT, 'frames'), { recursive: true })
writeFileSync(join(OUT, '릴스.html'), html)
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {})
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } })
await pg.setContent(html, { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready)
const 미리 = [['미리-표지', 2.3], ['미리-갈래', 장면[1].s + 0.7], ['미리-카드', (카드목록 => (카드목록[3] || 카드목록[0]).s + 0.9)(장면.filter((x) => x.종류 === '카드'))], ['미리-장바구니', (장면.find((x) => x.갈 === '주부의 장바구니') || 장면[2]).s + 0.9], ['미리-끝', 총 - 0.4]]
for (const [이름, 초] of 미리) { await pg.evaluate((tt) => window.render(tt), 초); await pg.screenshot({ path: join(OUT, 이름 + '.png') }) }
if (process.env.ONLY_PREVIEW) { await b.close(); process.exit(0) }
for (let i = 0; i < 장수; i++) {
  await pg.evaluate((tt) => window.render(tt), i / FPS)
  await pg.screenshot({ path: join(OUT, 'frames', String(i).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 92 })
}
await b.close()
const 파일 = join(OUT, `이번주한끼-릴스-${월}.mp4`)
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(OUT, 'frames/%04d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart', 파일])
console.log('✅', 파일)
