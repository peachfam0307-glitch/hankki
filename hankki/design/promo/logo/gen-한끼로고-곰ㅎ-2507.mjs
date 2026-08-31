// 한끼 로고 — 진짜 물결곰(눈반짝B) 얼굴을 "한"의 ㅎ에 꽉 채워 넣기.
// 실행: node gen-logo-real.mjs [FILL] [FACE_CY] [FACE_RY] [TXT]
//   FILL=채움배수(1.15), FACE_CY=얼굴중심 y프랙(0.62), FACE_RY=얼굴 세로반경 프랙(0.345), TXT=글자색
import pw from '/opt/node22/lib/node_modules/playwright/index.js'
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const OUT = '/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/'
const FONTS = '/home/user/hankki/hankki/design/promo/fonts/'
const { readFileSync, writeFileSync } = await import('fs')
const b64 = (f) => readFileSync(FONTS + f).toString('base64')
const JUA_K=b64('jua-korean-400.woff2'), JUA_L=b64('jua-latin-400.woff2'), GD_L=b64('gowun-dodum-latin-400.woff2')
const HEAD = readFileSync(OUT+'gom-head-cut.png').toString('base64')
const FILL=Number(process.argv[2]??1.15), FACE_CY=Number(process.argv[3]??0.62), FACE_RY=Number(process.argv[4]??0.345), TXT=process.argv[5]??'#6b4f3a'

const b = await pw.chromium.launch({ executablePath: CHROME })
const p = await (await b.newContext({ deviceScaleFactor: 2 })).newPage()
await p.setContent(`<meta charset=utf-8><style>
@font-face{font-family:'JuaWM';src:url(data:font/woff2;base64,${JUA_L}) format('woff2')}
@font-face{font-family:'JuaWM';src:url(data:font/woff2;base64,${JUA_K}) format('woff2')}
@font-face{font-family:'GDWM';src:url(data:font/woff2;base64,${GD_L}) format('woff2')}
</style><canvas></canvas>`, { waitUntil: 'networkidle' })
await p.waitForTimeout(300)

const out = await p.evaluate(async ({HEAD,FILL,FACE_CY,FACE_RY,TXT}) => {
  await document.fonts.ready
  await document.fonts.load('172px JuaWM','한끼'); await document.fonts.load('38px GDWM','HANKKI')
  const head = await new Promise(r=>{const im=new Image(); im.onload=()=>r(im); im.src='data:image/png;base64,'+HEAD})
  function drawWord(x,bg,fg,en){
    if(bg){ x.fillStyle=bg; x.fillRect(0,0,512,512) }
    const wf=172; x.textBaseline='alphabetic'; x.fillStyle=fg; x.font=wf+'px JuaWM'
    const w='한끼', tw=x.measureText(w).width, wH=wf*0.72, eH=38*0.72, top=(512-(wH+6+eH))/2, wb=top+wH
    x.fillText(w,(512-tw)/2,wb)
    x.font='700 38px GDWM'; x.fillStyle=en; x.strokeStyle=en; x.lineWidth=0.9; x.lineJoin='round'
    const t='HANKKI', ls=14; let ew=0; for(const c of t) ew+=x.measureText(c).width+ls; ew-=ls
    let ex=(512-ew)/2; const eb=wb+wf*0.20+6+eH
    for(const c of t){ x.fillText(c,ex,eb); x.strokeText(c,ex,eb); ex+=x.measureText(c).width+ls }
    return {wb, wf}
  }
  // ㅎ 카운터 검출
  const t=document.createElement('canvas'); t.width=512; t.height=512; const tx=t.getContext('2d'); drawWord(tx,'#fffdf8','#6b4f3a','#b98a63')
  const d=tx.getImageData(0,0,512,512).data, W=512,H=512, brown=i=>d[i]<160&&d[i+1]<130&&d[i+2]<110
  const op=new Uint8Array(W*H), st=[]
  for(let i=0;i<W;i++) st.push(i,0,i,H-1); for(let j=0;j<H;j++) st.push(0,j,W-1,j)
  while(st.length){const y=st.pop(),x=st.pop(); if(x<0||y<0||x>=W||y>=H)continue; const q=y*W+x; if(op[q]||brown(q*4))continue; op[q]=1; st.push(x+1,y,x-1,y,x,y+1,x,y-1)}
  let mnx=W,mxx=0,mny=H,mxy=0
  for(let y=0;y<H*0.6;y++)for(let x=0;x<W*0.45;x++){const q=y*W+x; if(op[q]||brown(q*4))continue; if(x<mnx)mnx=x; if(x>mxx)mxx=x; if(y<mny)mny=y; if(y>mxy)mxy=y}
  const cx=(mnx+mxx)/2, cy=(mny+mxy)/2
  // ㅎ 원 바깥반경 Ro = 카운터중심 → ㅎ 좌측 바깥선 (원본 gen-logo 방식)
  let xl=0; for(let x=0;x<W;x++){ if(brown((Math.round(cy)*W+x)*4)){xl=x;break} }
  const Ro=cx-xl
  const cw=head.width, ch=head.height
  const target=Ro*FILL            // FILL=커버율(0.95=원 안쪽 채움, 1.05=링까지 덮음)
  const scale=target/(FACE_RY*ch)
  const WSQUISH=0.92, LIFT=4 // 얼굴 폭 살짝만 좁힘 + 곰 아래로 내림
  const dw=cw*scale*WSQUISH, dh=ch*scale, dx=cx-0.5*cw*scale*WSQUISH, dy=cy-FACE_CY*ch*scale-LIFT

  // ㅎ 링(브라운) 자리를 배경색으로 지운 뒤 곰을 얹어 = 브라운 테두리 안 보이게
  const render=(bg,fg,en,transparent)=>{ const c=document.createElement('canvas'); c.width=512; c.height=512; const o=c.getContext('2d'); drawWord(o,bg,fg,en);
    if(transparent){ o.save(); o.globalCompositeOperation='destination-out'; o.fillStyle='#000'; o.beginPath(); o.arc(cx,cy,Ro*1.05,0,Math.PI*2); o.fill(); o.restore() }
    else { o.fillStyle=bg; o.beginPath(); o.arc(cx,cy,Ro*1.05,0,Math.PI*2); o.fill() }
    o.drawImage(head,dx,dy,dw,dh); return c.toDataURL('image/png') }
  const cream=render('#fffdf8',TXT,TXT,false)
  const clay =render('#5d3410','#fffdf8','#fffdf8',false) // 왼쪽 크림의 정확한 색반전(브라운 배경 + 크림 글자)
  const trans=render(null,TXT,TXT,true) // 투명 배경(글자=진한 웜, ㅎ 자리 투명)
  return {cream,clay,trans,info:`Ro=${Ro.toFixed(1)} scale=${scale.toFixed(3)} dw=${dw.toFixed(0)} dh=${dh.toFixed(0)}`}
},{HEAD,FILL,FACE_CY,FACE_RY,TXT})
const save=(n,u)=>{ writeFileSync(OUT+n, Buffer.from(u.split(',')[1],'base64')); }
save('logo-real-cream.png', out.cream); save('logo-real-clay.png', out.clay); save('logo-real-trans.png', out.trans)
console.log(out.info)
await b.close()
