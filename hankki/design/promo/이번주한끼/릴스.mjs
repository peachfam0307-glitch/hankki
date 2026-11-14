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
const OUT = process.env.OUT || `/tmp/claude-0/이번주한끼릴스-${월}`
const 테마들 = {
  navy: { bg: '#1D2846', bg2: '#27355C', ink: '#F7EEDC', sub: '#B9C3DE', accent: '#E8553E', card: '#FBF4E6', cardInk: '#22305A' },
}
const T = 테마들[process.argv[3] || 'navy']
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

// 🎞 장면 표 — [시작초, 길이초, 종류, 내용]
const FPS = 24, 장면 = []; let t = 0
const 넣기 = (길이, 종류, 내용) => { 장면.push({ s: t, d: 길이, 종류, ...내용 }); t += 길이 }
넣기(2.6, '표지', {})
넣기(0.9, '갈래', { 요일: '월', 제목: '새 레시피', 날: `${md(월)} · ${월편.length}편` })
월편.forEach((r, i) => 넣기(1.15, '음식', { 그림: 컷(r.icon), 이름: r.title, 번: `${String(i + 1).padStart(2, '0')} / ${String(월편.length).padStart(2, '0')}`, 위: '새 레시피' }))
넣기(0.9, '갈래', { 요일: '수', 제목: 'SNS 레시피', 날: `${md(수)} · 요즘 많이 해 먹는` })
수편.forEach((r, i) => 넣기(1.2, '음식', { 그림: 컷(r.icon), 이름: r.title, 번: `${String(i + 1).padStart(2, '0')} / ${String(수편.length).padStart(2, '0')}`, 위: 'SNS 레시피' }))
if (장편.length) {
  넣기(0.9, '갈래', { 요일: '장', 제목: '주부의 장바구니', 날: '직접 사서 써 본 것만' })
  장편.forEach((p, i) => 넣기(1.2, '음식', { 그림: 장컷(p.icon), 이름: p.name, 작게: `${요일(p.from)} ${md(p.from)}${p.brand ? ' · ' + p.brand : ''}`, 번: `${String(i + 1).padStart(2, '0')} / ${String(장편.length).padStart(2, '0')}`, 위: '주부의 장바구니' }))
}
넣기(3.2, '끝', {})
const 총 = t, 장수 = Math.round(총 * FPS)
console.log(`월 ${월편.length} · 수 ${수편.length} · 장 ${장편.length} · ${총.toFixed(1)}초 · ${장수}장`)

const html = `<!doctype html><meta charset="utf-8"><style>${폰트}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;position:relative;font-family:'Jua',sans-serif;color:${T.ink};
 background:radial-gradient(120% 80% at 50% 0%, ${T.bg2} 0%, ${T.bg} 60%)}
#눈{position:absolute;inset:0}
.눈송이{position:absolute;border-radius:50%;background:#fff;opacity:.55}
.장{position:absolute;inset:0;display:none}
.top{position:absolute;top:240px;left:0;right:0;text-align:center}
.pill{display:inline-block;font-size:40px;background:${T.accent};color:#fff;border-radius:999px;padding:10px 34px}
.big{font-size:190px;line-height:1.02;letter-spacing:-.03em;margin-top:30px}
.lead{font-family:'GowunDodum';font-size:44px;color:${T.sub};margin-top:36px;line-height:1.55}
.접시{position:absolute;left:0;right:0;bottom:250px;height:640px}
.접시 img{position:absolute;object-fit:contain;filter:drop-shadow(0 26px 30px rgba(0,0,0,.45))}
.갈래{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.요일{width:230px;height:230px;border-radius:50%;background:${T.accent};color:#fff;font-size:130px;display:flex;align-items:center;justify-content:center}
.g제목{font-size:120px;margin-top:50px}
.g날{font-family:'GowunDodum';font-size:46px;color:${T.sub};margin-top:22px}
.머리{position:absolute;top:250px;left:80px;right:80px;display:flex;justify-content:space-between;align-items:center;font-size:44px;color:${T.sub}}
.머리 b{font-weight:400;color:${T.ink}}
.번{font-size:40px;color:${T.accent};background:${T.card};border-radius:999px;padding:6px 26px}
.원{position:absolute;left:50%;top:820px;width:860px;height:860px;margin:-430px 0 0 -430px;border-radius:50%;background:${T.card};box-shadow:0 30px 70px rgba(0,0,0,.35)}
.음식{position:absolute;left:50%;top:820px;width:780px;height:780px;margin:-390px 0 0 -390px;object-fit:contain;filter:drop-shadow(0 22px 22px rgba(30,30,60,.35))}
.이름{position:absolute;left:60px;right:60px;top:1330px;text-align:center;font-size:120px;line-height:1.08;word-break:keep-all}
.작게{position:absolute;left:0;right:0;top:1250px;text-align:center;font-family:'GowunDodum';font-size:42px;color:${T.sub}}
.끝{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.끝 .h{font-size:150px;line-height:1.1}
.끝 .s{font-family:'GowunDodum';font-size:48px;color:${T.sub};margin:40px 0 70px;line-height:1.6}
.알약{display:inline-flex;align-items:center;gap:22px;background:${T.card};color:${T.cardInk};border-radius:999px;padding:22px 46px;font-size:52px;box-shadow:0 16px 36px rgba(0,0,0,.35)}
.알약 img{width:82px;height:82px;border-radius:20px}
.검색{font-size:52px;margin-top:40px}
</style>
<div id="눈"></div>
<div class="장" id="표지"><div class="top"><span class="pill">${md(월)} – ${md(일)}</span><div class="big">이번 주<br>한끼</div>
<div class="lead">새 레시피 ${월편.length}편 · SNS 레시피 ${수편.length}편${장편.length ? `<br>주부의 장바구니 ${장편.length}개` : ''}</div></div>
<div class="접시">${월편.slice(0, 3).map((r, i) => { const z = [[40, 200, 440], [600, 200, 440], [300, 40, 480]][i]; return `<img src="${컷(r.icon)}" data-i="${i}" style="left:${z[0]}px;top:${z[1]}px;width:${z[2]}px;height:${z[2]}px">` }).join('')}</div></div>
<div class="장" id="갈래"><div class="갈래"><div class="요일" id="g요일"></div><div class="g제목" id="g제목"></div><div class="g날" id="g날"></div></div></div>
<div class="장" id="음식판"><div class="머리"><b id="위"></b><span class="번" id="번"></span></div><div class="원" id="원"></div><img class="음식" id="그림"><div class="작게" id="작게"></div><div class="이름" id="이름"></div></div>
<div class="장" id="끝판"><div class="끝"><div class="h">레시피는<br>한끼 앱에서</div><div class="s">재료 · 순서 · 타이머까지<br>그대로 따라 하면 돼요</div>
<div class="알약"><img src="${앱}">App Store · Google Play</div><div class="검색">「한끼 레시피북」 검색</div></div></div>
<script>
const 장면=${JSON.stringify(장면)}, 총=${총}
const 이즈=(x)=>1-Math.pow(1-Math.min(1,Math.max(0,x)),3)
const 눈=document.getElementById('눈'); const 송이=[]
for(let i=0;i<46;i++){const e=document.createElement('div');e.className='눈송이';const r=4+((i*37)%9);e.style.width=e.style.height=r+'px';눈.appendChild(e);송이.push({e,x:(i*233)%1080,y:(i*577)%1920,v:40+((i*53)%60),w:(i%7)*6})}
window.render=(t)=>{
  송이.forEach(s=>{s.e.style.transform='translate('+(s.x+Math.sin(t*1.3+s.w)*18)+'px,'+((s.y+t*s.v)%1960-20)+'px)'})
  const c=장면.find(x=>t>=x.s&&t<x.s+x.d)||장면[장면.length-1]; const p=(t-c.s)/c.d, a=이즈(p/0.35), 나감=p>0.85?1-(p-0.85)/0.15:1
  for(const id of ['표지','갈래','음식판','끝판'])document.getElementById(id).style.display='none'
  if(c.종류==='표지'){const el=document.getElementById('표지');el.style.display='block';el.style.opacity=나감
    el.querySelector('.top').style.transform='translateY('+(60*(1-a))+'px)';el.querySelector('.top').style.opacity=a
    el.querySelectorAll('.접시 img').forEach((im,i)=>{const q=이즈((p-0.15-i*0.08)/0.35);im.style.opacity=q;im.style.transform='translateY('+(160*(1-q))+'px) rotate('+((i-1)*6*(1-q))+'deg)'})}
  if(c.종류==='갈래'){const el=document.getElementById('갈래');el.style.display='block';el.style.opacity=나감
    document.getElementById('g요일').textContent=c.요일;document.getElementById('g제목').textContent=c.제목;document.getElementById('g날').textContent=c.날
    document.getElementById('g요일').style.transform='scale('+(0.4+0.6*a)+')';el.querySelector('.갈래').style.opacity=a}
  if(c.종류==='음식'){const el=document.getElementById('음식판');el.style.display='block'
    document.getElementById('위').textContent=c.위;document.getElementById('번').textContent=c.번
    const g=document.getElementById('그림');if(g.dataset.k!==c.이름){g.src=c.그림;g.dataset.k=c.이름}
    document.getElementById('이름').textContent=c.이름;document.getElementById('작게').textContent=c.작게||''
    document.getElementById('원').style.transform='scale('+(0.85+0.15*a)+')'
    g.style.transform='translateX('+(420*(1-a))+'px) rotate('+(14*(1-a))+'deg) scale('+(0.9+0.1*a)+')';g.style.opacity=Math.min(a*1.6,1)*나감
    const b=이즈((p-0.12)/0.35);document.getElementById('이름').style.transform='translateY('+(50*(1-b))+'px)';document.getElementById('이름').style.opacity=b*나감;document.getElementById('작게').style.opacity=b*나감}
  if(c.종류==='끝'){const el=document.getElementById('끝판');el.style.display='block';el.querySelector('.끝').style.opacity=a;el.querySelector('.끝').style.transform='translateY('+(50*(1-a))+'px)'}
}
</script>`
mkdirSync(join(OUT, 'frames'), { recursive: true })
writeFileSync(join(OUT, '릴스.html'), html)
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {})
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } })
await pg.setContent(html, { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready)
for (let i = 0; i < 장수; i++) {
  await pg.evaluate((tt) => window.render(tt), i / FPS)
  await pg.screenshot({ path: join(OUT, 'frames', String(i).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 92 })
}
for (const [이름, 초] of [['미리-표지', 1.8], ['미리-음식', 장면[2].s + 0.8], ['미리-장바구니', (장면.find((x) => x.위 === '주부의 장바구니') || 장면[2]).s + 0.8], ['미리-끝', 총 - 0.5]]) {
  await pg.evaluate((tt) => window.render(tt), 초); await pg.screenshot({ path: join(OUT, 이름 + '.png') })
}
await b.close()
const 파일 = join(OUT, `이번주한끼-릴스-${월}.mp4`)
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(OUT, 'frames/%04d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart', 파일])
console.log('✅', 파일)
