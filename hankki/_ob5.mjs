// 온보딩 7장 렌더 검증 — 5인 소개 슬라이드가 제대로 뜨나
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const BASE='http://127.0.0.1:4207/'
const srv=spawn('npx',['vite','preview','--host','127.0.0.1','--port','4207','--strictPort'],{stdio:'ignore'})
for(let i=0;i<90;i++){try{const r=await fetch(BASE);if(r.status<500)break}catch{}await new Promise(r=>setTimeout(r,400))}
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM})
const ctx=await b.newContext({viewport:{width:430,height:940},deviceScaleFactor:3})
const p=await ctx.newPage(); const errs=[]
p.on('pageerror',e=>errs.push(String(e)))
await p.goto(BASE,{waitUntil:'domcontentloaded'});await p.waitForTimeout(2200)
for(let i=0;i<7;i++){
  const t=await p.evaluate(()=>document.body.innerText.replace(/\n+/g,' / ').slice(0,60))
  const cast=await p.evaluate(()=>[...document.images].filter(x=>/bu_(gom|peng|capy|fox|gecko)/.test(x.currentSrc)).map(x=>({n:x.currentSrc.split('/').pop().split('-')[0],src:x.naturalWidth,shown:Math.round(x.getBoundingClientRect().height)})))
  console.log(`장${i+1}: ${t}`)
  if(i===5) { console.log(`   ⭐ 5인 소개 장 — 컷 ${cast.length}개`); cast.forEach(c=>console.log(`      ${c.n} 소스${c.src}px → 화면 ${c.shown}px (DPR3 → ${c.shown*3}device px)`))
    await p.screenshot({path:'/tmp/ob5.png'}) }
  const nx=p.getByRole('button',{name:/다음|시작하기/}).first()
  if(!(await nx.isVisible().catch(()=>false))) break
  if(i<6) { await nx.click(); await p.waitForTimeout(800) }
}
// 유니코드 이모지 0 확인
const emo=await p.evaluate(()=>{const re=/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const bad=[];let n;while((n=w.nextNode()))if(re.test(n.nodeValue))bad.push(n.nodeValue.trim());return bad})
console.log('유니코드 이모지 =', emo.length?emo:'0개 ✅')
console.log('pageerror =',errs.length,errs.slice(0,2))
await b.close();srv.kill()
