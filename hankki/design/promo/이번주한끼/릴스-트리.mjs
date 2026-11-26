// 🎄 트리판 = 레시피가 하나씩 오너먼트로 트리에 달린다 · 원래 장식은 우리 스티커 — 창업자 2026-11-26 「크리스마스 트리에 레시피가 하나씩 오너먼트처럼」「기존 오너먼트는 우리스티커로」「힉스이용해도 돼」
// 🎄 D판 = 밤 초록·진저쿠키 눈 · 크리스마스 그릇에 담긴 그림 + 꼬르곰·펭펭 — 창업자 2026-11-26 「디자인이나 아예 구성을 다르게해도 좋아. 우리애들이 나와도 좋고」
// (C판 바탕) = 크림·크리스마스 깅엄 · 11/30 개편 뒤 구성(이번 주 재료 · 테마 레시피 · 한끼 레시피 · 장바구니) — 창업자 2026-11-26 「이번주한끼 만들어줘」·「장바구니까지 넣어줘」
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
테마들.d = { bg: '#1F3B2D', bg2: '#2E5240', ink: '#FFF6E6', sub: '#D9CBB0', accent: '#D6463A', card: '#FFFDF8', cardInk: '#3A2A22', green: '#E9B949' }
테마들.c = { bg: '#FBF4E8', bg2: '#FFFBF3', ink: '#3A2A22', sub: '#7D6A5C', accent: '#C8432F', card: '#FFFFFF', cardInk: '#3A2A22', green: '#3F6B4E' }
const T = 테마들[process.argv[3] || 'd']
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
const 폰트 = readFileSync(join(ROOT, 'design/promo/fonts-embed.css'), 'utf8')
const 앱 = b64(join(ROOT, 'public/icons/icon-512-v7.png'))
const 배경 = b64(join(ROOT, 'design/promo/이번주한끼/트리배경-2026-11-26.png'))
const 장컷 = (k) => b64(join(ROOT, `src/assets/curation/${k}.png`))
const 애 = (k) => `data:image/webp;base64,${readFileSync(join(ROOT, `src/assets/stickers/season/${k}.webp`)).toString('base64')}`
const 담김 = { '돼지고기김치두루치기':'돼지고기김치두루치기-1','고등어 묵은지조림':'고등어묵은지조림-1','스팸 땡초 김밥':'스팸땡초김밥-3','백종원 시장 떡볶이':'시장떡볶이-1','양송이감자스프':'양송이감자스프-1','영양 닭죽':'영양닭죽-1','원팬 또띠아 토스트':'또띠아토스트-2','치즈 유부주먹밥':'치즈유부주먹밥-1','간편갈비조림':'간편갈비조림-1','연근사과샐러드':'연근사과샐러드-1','대패삼겹살 김치 솥밥':'대패김치솥밥-2','닭곰탕':'닭곰탕-1' }
const 그릇 = (t) => b64(`/home/user/hankki/hankki/docs/stickers/크리스마스그릇-2026-11-26/담김-${담김[t]}.png`)
const 묶음 = [['이번 주 재료 · 묵은지', ['돼지고기김치두루치기', '고등어 묵은지조림']], ['테마 레시피', ['스팸 땡초 김밥', '백종원 시장 떡볶이', '양송이감자스프', '영양 닭죽', '원팬 또띠아 토스트', '치즈 유부주먹밥']], ['한끼 레시피', ['간편갈비조림', '연근사과샐러드', '대패삼겹살 김치 솥밥', '닭곰탕']]]
for (const [, ts] of 묶음) for (const x of ts) if (!L.find((r) => r.title === x) || !담김[x]) throw new Error('없음 ' + x)
// 🎄 트리 자리 (1080x1920) — 레시피 오너먼트 12 · 우리 스티커 오너먼트
const 자리 = [[540, 440], [420, 640], [665, 625], [320, 840], [560, 800], [775, 850], [245, 1050], [475, 1020], [705, 1045], [870, 1110], [345, 1270], [640, 1260]]
const 스자리 = [['xg01', 700, 470, 95], ['xg02', 395, 735, 85], ['xg09', 205, 905, 90], ['xg07', 880, 920, 95], ['xg04', 610, 940, 95], ['xk_n05_02', 150, 1190, 120], ['xg06', 480, 1170, 90], ['xk_c02_02', 820, 1260, 125], ['xg08', 480, 1390, 100], ['xg01', 220, 1420, 95], ['xk_c02_03', 880, 1440, 120], ['xg02', 700, 1420, 90]]
const FPS = 24, 장면 = []; let t = 0
const 넣기 = (길이, 종류, 내용) => { 장면.push({ s: t, d: 길이, 종류, ...내용 }); t += 길이 }
넣기(2.4, '표지', {})
let k = 0
for (const [갈래, ts] of 묶음) { 넣기(0.9, '갈래', { 제목: 갈래 }); ts.forEach((x, i) => 넣기(1.45, '음식', { n: k++, 이름: x, 위: 갈래, 번: `${i + 1} / ${ts.length}` })) }
if (장편.length) { 넣기(0.9, '갈래', { 제목: '주부의 장바구니' }); 장편.forEach((p, i) => 넣기(1.3, '장', { n: i, 이름: p.name, 작게: `${요일(p.from)} ${md(p.from)}${p.brand ? ' · ' + p.brand : ''}`, 위: '주부의 장바구니', 번: `${i + 1} / ${장편.length}` })) }
넣기(3.6, '끝', {})
const 총 = t, 장수 = Math.round(총 * FPS)
const 음식들 = 묶음.flatMap(([, ts]) => ts)
const 선물자리 = 장편.map((_, i) => [540 + (i - (장편.length - 1) / 2) * 170, 1690 + (i % 2) * 40])
console.log(`오너먼트 ${음식들.length} · 장 ${장편.length} · ${총.toFixed(1)}초 · ${장수}장`)
const html = `<!doctype html><meta charset="utf-8"><style>${폰트}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;position:relative;font-family:'Jua',sans-serif;color:#3A2A22;background:#1F2F28}
#bg{position:absolute;inset:0;width:1080px;height:1920px;object-fit:cover}
.o{position:absolute;opacity:0}
.o .끈{position:absolute;left:50%;bottom:100%;width:4px;height:40px;margin-left:-2px;background:#E9B949}
.o .뚜{position:absolute;left:50%;top:-16px;width:44px;height:26px;margin-left:-22px;border-radius:8px;background:linear-gradient(#F6D77A,#C9952F);box-shadow:0 2px 4px rgba(0,0,0,.3)}
.o .공{width:100%;height:100%;border-radius:50%;overflow:hidden;border:7px solid #E9B949;box-shadow:0 10px 18px rgba(0,0,0,.45),inset 0 0 0 4px #fff;background:#fff}
.o .공 img{width:130%;height:130%;margin:-15%;object-fit:cover}
.s{position:absolute;filter:drop-shadow(0 6px 6px rgba(0,0,0,.35))}
#별{position:absolute;left:465px;top:70px;width:150px;filter:drop-shadow(0 0 30px rgba(255,220,120,.9))}
#어둠{position:absolute;inset:0;background:rgba(20,25,20,.55);opacity:0}
#카드{position:absolute;left:220px;top:470px;width:640px;height:640px;opacity:0}
#카드 .공{border-width:14px}
#이름판{position:absolute;left:70px;right:70px;top:1180px;text-align:center;opacity:0}
#이름판 .n{display:inline-block;background:#FFF6E6;border-radius:30px;padding:20px 44px;font-size:96px;line-height:1.1;word-break:keep-all;box-shadow:0 14px 30px rgba(0,0,0,.35)}
#이름판 .m{font-family:'GowunDodum';font-size:42px;color:#FFF6E6;margin-top:22px}
#머리{position:absolute;top:150px;left:0;right:0;text-align:center;opacity:0}
#머리 span{display:inline-block;background:#C8432F;color:#fff;border-radius:999px;padding:10px 34px;font-size:44px;box-shadow:0 8px 18px rgba(0,0,0,.35)}
#표지{position:absolute;inset:0;text-align:center}
#표지 .pill{display:inline-block;margin-top:150px;font-size:42px;background:#C8432F;color:#fff;border-radius:999px;padding:10px 34px}
#표지 .big{font-size:200px;line-height:1;color:#FFF6E6;margin-top:24px;text-shadow:0 8px 30px rgba(0,0,0,.6)}
#표지 .lead{font-family:'GowunDodum';font-size:46px;color:#FFF6E6;margin-top:30px;line-height:1.5;text-shadow:0 4px 12px rgba(0,0,0,.7)}
#갈래{position:absolute;left:0;right:0;top:800px;text-align:center;opacity:0}
#갈래 span{display:inline-block;background:#FFF6E6;border:8px dashed #C8432F;border-radius:40px;padding:30px 60px;font-size:110px;box-shadow:0 20px 40px rgba(0,0,0,.4)}
.애{position:absolute;bottom:40px;width:380px;filter:drop-shadow(0 12px 14px rgba(0,0,0,.4))}
#끝{position:absolute;left:0;right:0;top:120px;text-align:center;opacity:0}
#끝 .h{font-size:120px;line-height:1.1;color:#FFF6E6;text-shadow:0 8px 30px rgba(0,0,0,.7)}
.알약{display:inline-flex;align-items:center;gap:22px;background:#C8432F;color:#fff;border-radius:999px;padding:20px 44px;font-size:50px;margin-top:30px;box-shadow:0 16px 36px rgba(0,0,0,.4)}
.알약 img{width:78px;height:78px;border-radius:20px}
#끝 .검{font-size:50px;color:#FFF6E6;margin-top:22px;text-shadow:0 4px 12px rgba(0,0,0,.7)}
</style>
<img id="bg" src="${배경}">
${스자리.map(([k, x, y, w], i) => `<img class="s" data-i="${i}" src="${애(k)}" style="left:${x - w / 2}px;top:${y - w / 2}px;width:${w}px">`).join('')}
${음식들.map((x, i) => `<div class="o" id="o${i}" style="left:${자리[i][0] - 75}px;top:${자리[i][1] - 75}px;width:150px;height:150px"><div class="끈"></div><div class="공"><img src="${그릇(x)}"></div><div class="뚜"></div></div>`).join('')}
${장편.map((p, i) => `<img class="o 선" id="g${i}" src="${장컷(p.icon)}" style="left:${선물자리[i][0] - 80}px;top:${선물자리[i][1] - 80}px;width:160px;height:160px;object-fit:contain;filter:drop-shadow(0 8px 10px rgba(0,0,0,.4))">`).join('')}
<img id="별" src="${애('xg03')}">
<img class="애" id="곰" src="${애('xk_n012_02')}" style="left:-30px">
<img class="애" id="펭" src="${애('xk_n05_05')}" style="right:-20px;width:320px">
<div id="어둠"></div>
<div id="카드" class="o" style="opacity:0"><div class="공"><img id="카드img"></div></div>
<div id="머리"><span id="머리t"></span></div>
<div id="이름판"><div class="n" id="이름"></div><div class="m" id="작게"></div></div>
<div id="갈래"><span id="갈래t"></span></div>
<div id="표지"><span class="pill">${md(월)} – ${md(일)}</span><div class="big">이번 주<br>한끼</div><div class="lead">레시피 12편을 트리에 달아요${장편.length ? `<br>장바구니 ${장편.length}개는 선물로` : ''}</div></div>
<div id="끝"><div class="h">이번 주 한끼,<br>다 달았어요!</div><div class="알약"><img src="${앱}">App Store · Google Play</div><div class="검">「한끼 레시피북」 검색</div></div>
<script>
const 장면=${JSON.stringify(장면)},자리=${JSON.stringify(자리)},선물자리=${JSON.stringify(선물자리)},그림=${JSON.stringify(음식들.map(그릇))},장그림=${JSON.stringify(장편.map((p) => 장컷(p.icon)))}
const 이즈=(x)=>1-Math.pow(1-Math.min(1,Math.max(0,x)),3), $=(i)=>document.getElementById(i)
window.render=(t)=>{
  const c=장면.find(x=>t>=x.s&&t<x.s+x.d)||장면[장면.length-1], p=(t-c.s)/c.d, a=이즈(p/0.3)
  // 달린 것들
  장면.forEach(e=>{ if(e.종류!=='음식'&&e.종류!=='장')return; const el=$((e.종류==='음식'?'o':'g')+e.n); const 끝=e.s+e.d*0.85
    if(t>=끝){el.style.opacity=1;const w=Math.sin((t-끝)*2.4+e.n)*4;el.style.transform='rotate('+w+'deg)';el.style.transformOrigin='50% -40px'} else el.style.opacity=0 })
  // 스티커 오너먼트 반짝 흔들
  document.querySelectorAll('.s').forEach((el,i)=>{el.style.transform='rotate('+Math.sin(t*2+i)*5+'deg) scale('+(1+Math.sin(t*3+i*1.7)*0.04)+')'})
  $('별').style.transform='scale('+(1+Math.sin(t*4)*0.06)+') rotate('+Math.sin(t*1.5)*6+'deg)'
  $('곰').style.transform='translateY('+Math.abs(Math.sin(t*3))*-14+'px)';$('펭').style.transform='translateY('+Math.abs(Math.sin(t*3+1))*-12+'px)'
  for(const id of ['표지','갈래','끝','머리','이름판'])$(id).style.opacity=0
  $('어둠').style.opacity=0;$('카드').style.opacity=0
  if(c.종류==='표지'){const o=a*(p>0.85?1-(p-0.85)/0.15:1);$('표지').style.opacity=o;$('어둠').style.opacity=0.35*o;$('표지').style.transform='translateY('+(50*(1-a))+'px)'}
  if(c.종류==='갈래'){const o=a*(p>0.8?1-(p-0.8)/0.2:1);$('갈래').style.opacity=o;$('갈래').style.transform='scale('+(0.6+0.4*a)+') rotate(-3deg)';$('어둠').style.opacity=0.3*o}
  if(c.종류==='음식'||c.종류==='장'){
    $('머리').style.opacity=1;$('머리t').textContent=c.위+' · '+c.번
    const 이미지=c.종류==='음식'?그림[c.n]:장그림[c.n]; if($('카드img').dataset.k!==c.종류+c.n){$('카드img').src=이미지;$('카드img').dataset.k=c.종류+c.n}
    $('카드img').style.objectFit=c.종류==='장'?'contain':'cover'
    const 날=이즈((p-0.55)/0.3), 들=이즈(p/0.22)
    const [tx,ty]=c.종류==='음식'?자리[c.n]:선물자리[c.n], 작=c.종류==='음식'?150/640:160/640
    const cx=540+(tx-540)*날, cy=790+(ty-790)*날, sc=(0.5+0.5*들)*(1-(1-작)*날)
    $('카드').style.opacity=p<0.85?1:0; $('카드').style.transform='translate('+(cx-540)+'px,'+(cy-790)+'px) scale('+sc+') rotate('+(Math.sin(p*9)*3*(1-날))+'deg)'
    $('어둠').style.opacity=0.55*(1-날)
    $('이름').textContent=c.이름;$('작게').textContent=c.작게||''
    const nb=이즈((p-0.1)/0.25)*(1-이즈((p-0.5)/0.15));$('이름판').style.opacity=nb;$('이름판').style.transform='translateY('+(40*(1-nb))+'px)'}
  if(c.종류==='끝'){const 늦=이즈((p-0.3)/0.25);$('끝').style.opacity=늦;$('어둠').style.opacity=0.5*늦;$('끝').style.transform='translateY('+(40*(1-a))+'px)'}
}
</script>`
mkdirSync(join(OUT, 'frames'), { recursive: true })
writeFileSync(join(OUT, '릴스.html'), html)
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {})
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } })
await pg.setContent(html, { waitUntil: 'load' }); await pg.evaluate(() => document.fonts.ready)
const 미리 = process.env.PREVIEW
if (미리) { for (const 초 of 미리.split(',').map(Number)) { await pg.evaluate((tt) => window.render(tt), 초); await pg.screenshot({ path: join(OUT, `미리-${초}.png`) }) } await b.close(); process.exit(0) }
for (let i = 0; i < 장수; i++) { await pg.evaluate((tt) => window.render(tt), i / FPS); await pg.screenshot({ path: join(OUT, 'frames', String(i).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 92 }) }
await b.close()
const 파일 = join(OUT, `이번주한끼-릴스-트리-${월}.mp4`)
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(OUT, 'frames/%04d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart', 파일])
console.log('✅', 파일)
