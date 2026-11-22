// 🎬 인스타 「이번 주 한끼」 릴스 — 스타일 B 「체크 식탁보 · 폴라로이드」 (창업자 2026-11-22 「저번거랑 같아 · 다른 스타일 · 매주 겹치지 않게」)
// 실행: CHROMIUM=/opt/pw-browsers/chromium OUT=<폴더> node design/promo/이번주한끼/릴스-폴라로이드.mjs <그 주 월요일>
// 목록 잣대 = 릴스.mjs 와 같다(월=새 레시피 · 수=SNS · 장바구니=일~토). 다른 건 «모양»뿐이다.
//   A(릴스.mjs) = 남색 겨울밤 · 눈 · 동그란 접시 · 옆에서 밀려 들어옴
//   B(이 파일)  = 크림 바탕 · 빨간 체크 식탁보 띠 · 폴라로이드 사진이 위에서 떨어져 꽂힘 · 손글씨 이름
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
const ROOT = new URL('../../..', import.meta.url).pathname.replace(/\/$/, '')
const 월 = process.argv[2] || '2026-11-23'
const OUT = process.env.OUT || `/tmp/claude-0/이번주한끼릴스B-${월}`
const T = { bg: '#FFF4E2', red: '#C8412F', red2: '#E0624D', ink: '#3A2A20', sub: '#8A6F5C', paper: '#FFFFFF' }
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

const FPS = 24, 장면 = []; let t = 0
const 넣기 = (길이, 종류, 내용) => { 장면.push({ s: t, d: 길이, 종류, ...내용 }); t += 길이 }
넣기(2.6, '표지', {})
넣기(1.0, '갈래', { 요일: '월요일', 제목: '새 레시피', 날: `${md(월)} · ${월편.length}편` })
월편.forEach((r, i) => 넣기(1.15, '음식', { 그림: 컷(r.icon), 이름: r.title, 번: `${i + 1} / ${월편.length}`, 위: '새 레시피', i }))
넣기(1.0, '갈래', { 요일: '수요일', 제목: 'SNS 레시피', 날: `${md(수)} · 요즘 많이 해 먹는` })
수편.forEach((r, i) => 넣기(1.2, '음식', { 그림: 컷(r.icon), 이름: r.title, 번: `${i + 1} / ${수편.length}`, 위: 'SNS 레시피', i: i + 1 }))
if (장편.length) {
  넣기(1.0, '갈래', { 요일: '장바구니', 제목: '주부의 장바구니', 날: '직접 사서 써 본 것만' })
  장편.forEach((p, i) => 넣기(1.2, '음식', { 그림: 장컷(p.icon), 이름: p.name, 작게: `${요일(p.from)} ${md(p.from)}${p.brand ? ' · ' + p.brand : ''}`, 번: `${i + 1} / ${장편.length}`, 위: '주부의 장바구니', i }))
}
넣기(3.2, '끝', {})
const 총 = t, 장수 = Math.round(총 * FPS)
console.log(`[B 폴라로이드] 월 ${월편.length} · 수 ${수편.length} · 장 ${장편.length} · ${총.toFixed(1)}초 · ${장수}장`)

const 체크 = `repeating-linear-gradient(0deg, rgba(200,65,47,.55) 0 40px, transparent 40px 80px), repeating-linear-gradient(90deg, rgba(200,65,47,.55) 0 40px, #fff 40px 80px)`
const html = `<!doctype html><meta charset="utf-8"><style>${폰트}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;position:relative;font-family:'Jua',sans-serif;color:${T.ink};background:${T.bg}}
.띠{position:absolute;left:0;right:0;height:150px;background:${체크}}
.띠.위{top:0}.띠.아래{bottom:0}
.장{position:absolute;inset:0;display:none}
.표지글{position:absolute;top:260px;left:0;right:0;text-align:center}
.도장{display:inline-block;font-size:44px;color:${T.red};border:5px solid ${T.red};border-radius:16px;padding:8px 30px;transform:rotate(-6deg)}
.큰{font-size:200px;line-height:1.0;color:${T.red};margin-top:36px;letter-spacing:-.02em}
.이끔{font-family:'GowunDodum';font-size:46px;color:${T.sub};margin-top:34px;line-height:1.55}
.폴{position:absolute;background:${T.paper};padding:26px 26px 150px;box-shadow:0 18px 40px rgba(80,40,20,.25);border-radius:6px}
.폴 .사진{width:100%;height:100%;background:#FBEFDC;border-radius:3px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.폴 .사진 img{width:92%;height:92%;object-fit:contain}
.폴 .손글씨{position:absolute;left:0;right:0;bottom:22px;text-align:center;font-family:'NanumPen';font-size:112px;line-height:1;color:${T.ink};-webkit-text-stroke:1.5px ${T.ink};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 20px}
.테이프{position:absolute;top:-34px;left:50%;width:230px;height:68px;margin-left:-115px;background:rgba(224,98,77,.55);transform:rotate(-4deg)}
.갈래판{position:absolute;inset:0;background:${T.red};display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#FFF4E2}
.갈래판 .요{font-family:'NanumPen';font-size:120px;opacity:.9}
.갈래판 .제{font-size:150px;margin-top:10px}
.갈래판 .날{font-family:'GowunDodum';font-size:48px;margin-top:30px;opacity:.85}
.머리{position:absolute;top:210px;left:80px;right:80px;display:flex;justify-content:space-between;align-items:center}
.머리 .위말{font-size:52px;color:${T.red}}
.스티커{font-size:46px;color:#fff;background:${T.red};border-radius:50%;width:150px;height:150px;display:flex;align-items:center;justify-content:center;transform:rotate(10deg);box-shadow:0 8px 18px rgba(0,0,0,.18)}
#큰폴{left:110px;top:420px;width:860px;height:1060px}
.작은말{position:absolute;left:0;right:0;top:1560px;text-align:center;font-family:'GowunDodum';font-size:46px;color:${T.sub}}
.끝판{position:absolute;inset:0;background:${T.red};color:#FFF4E2;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.끝판 .h{font-size:150px;line-height:1.1}
.끝판 .s{font-family:'GowunDodum';font-size:48px;margin:40px 0 70px;line-height:1.6;opacity:.9}
.알약{display:inline-flex;align-items:center;gap:22px;background:#FFF4E2;color:${T.red};border-radius:999px;padding:22px 46px;font-size:52px}
.알약 img{width:82px;height:82px;border-radius:20px}
.검색{font-size:52px;margin-top:40px}
</style>
<div class="장" id="표지"><div class="띠 위"></div><div class="띠 아래"></div>
<div class="표지글"><span class="도장">${md(월)} – ${md(일)}</span><div class="큰">이번 주<br>한끼</div>
<div class="이끔">새 레시피 ${월편.length}편 · SNS 레시피 ${수편.length}편${장편.length ? `<br>주부의 장바구니 ${장편.length}개` : ''}</div></div>
${월편.slice(0, 3).map((r, i) => { const z = [[70, 1080, 400, -9], [610, 1060, 400, 8], [330, 1250, 420, -2]][i]; return `<div class="폴 표지폴" style="left:${z[0]}px;top:${z[1]}px;width:${z[2]}px;height:${z[2] + 60}px;padding:18px 18px 70px" data-r="${z[3]}"><div class="사진"><img src="${컷(r.icon)}"></div></div>` }).join('')}
</div>
<div class="장" id="갈래"><div class="갈래판"><div class="요" id="g요일"></div><div class="제" id="g제목"></div><div class="날" id="g날"></div></div></div>
<div class="장" id="음식판"><div class="띠 아래"></div><div class="머리"><span class="위말" id="위"></span><span class="스티커" id="번"></span></div>
<div class="폴" id="큰폴"><div class="테이프"></div><div class="사진"><img id="그림"></div><div class="손글씨" id="이름"></div></div><div class="작은말" id="작게"></div></div>
<div class="장" id="끝"><div class="끝판"><div class="h">레시피는<br>한끼 앱에서</div><div class="s">재료 · 순서 · 타이머까지<br>그대로 따라 하면 돼요</div>
<div class="알약"><img src="${앱}">App Store · Google Play</div><div class="검색">「한끼 레시피북」 검색</div></div></div>
<script>
const 장면=${JSON.stringify(장면)}
const 이즈=(x)=>1-Math.pow(1-Math.min(1,Math.max(0,x)),3)
const 튕=(x)=>{x=Math.min(1,Math.max(0,x));const c=1.70158*1.3;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)}
window.render=(t)=>{
  const c=장면.find(x=>t>=x.s&&t<x.s+x.d)||장면[장면.length-1]; const p=(t-c.s)/c.d, a=이즈(p/0.35), 나감=p>0.86?1-(p-0.86)/0.14:1
  for(const id of ['표지','갈래','음식판','끝'])document.getElementById(id).style.display='none'
  if(c.종류==='표지'){const el=document.getElementById('표지');el.style.display='block';el.style.opacity=나감
    const g=el.querySelector('.표지글');g.style.opacity=a;g.style.transform='scale('+(0.92+0.08*a)+')'
    el.querySelectorAll('.표지폴').forEach((f,i)=>{const q=(p-0.18-i*0.1)/0.3;const b=튕(q);f.style.opacity=Math.min(1,Math.max(0,q*3));f.style.transform='translateY('+(-700*(1-b))+'px) rotate('+(+f.dataset.r*(0.4+0.6*b))+'deg)'})}
  if(c.종류==='갈래'){const el=document.getElementById('갈래');el.style.display='block';el.style.opacity=나감
    const k=el.querySelector('.갈래판');k.style.clipPath='circle('+(a*150)+'% at 50% 50%)'
    document.getElementById('g요일').textContent=c.요일;document.getElementById('g제목').textContent=c.제목;document.getElementById('g날').textContent=c.날}
  if(c.종류==='음식'){const el=document.getElementById('음식판');el.style.display='block'
    document.getElementById('위').textContent=c.위;document.getElementById('번').textContent=c.번
    const g=document.getElementById('그림');if(g.dataset.k!==c.이름){g.src=c.그림;g.dataset.k=c.이름}
    document.getElementById('이름').textContent=c.이름;document.getElementById('작게').textContent=c.작게||''
    const 기울=(c.i%2?4:-4), b=튕(p/0.4), 폴=document.getElementById('큰폴')
    폴.style.transform='translateY('+(-1300*(1-b))+'px) rotate('+(기울+(1-b)*-14)+'deg)';폴.style.opacity=나감
    const 스=document.getElementById('번');스.style.transform='rotate(10deg) scale('+이즈((p-0.25)/0.25)+')'
    document.getElementById('작게').style.opacity=이즈((p-0.3)/0.3)*나감}
  if(c.종류==='끝'){const el=document.getElementById('끝');el.style.display='block';const k=el.querySelector('.끝판');k.style.clipPath='circle('+(a*150)+'% at 50% 100%)'}
}
</script>`
mkdirSync(join(OUT, 'frames'), { recursive: true })
writeFileSync(join(OUT, '릴스.html'), html)
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {})
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } })
await pg.setContent(html, { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready)
const 미리 = [['미리-표지', 2.0], ['미리-갈래', 장면[1].s + 0.7], ['미리-음식', 장면[2].s + 0.8], ['미리-장바구니', (장면.find((x) => x.위 === '주부의 장바구니') || 장면[2]).s + 0.8], ['미리-끝', 총 - 0.5]]
for (const [이름, 초] of 미리) { await pg.evaluate((tt) => window.render(tt), 초); await pg.screenshot({ path: join(OUT, 이름 + '.png') }) }
if (process.env.PREVIEW) { await b.close(); console.log('👀 미리보기만'); process.exit(0) }
for (let i = 0; i < 장수; i++) {
  await pg.evaluate((tt) => window.render(tt), i / FPS)
  await pg.screenshot({ path: join(OUT, 'frames', String(i).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 92 })
}
await b.close()
const 파일 = join(OUT, `이번주한끼-릴스B-${월}.mp4`)
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(OUT, 'frames/%04d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart', 파일])
console.log('✅', 파일)
