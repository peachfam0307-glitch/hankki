// 🔢 「정신없다」를 «재는» 자 — 창업자 2026-08-20 *"디자인이랑 색이 조잡하고 정신이 없어 안내박스랑 콩국수랑"*
//    미감은 말로 다투기 쉬워서 «세어» 놓고 본다: 겉카드 수 · 서로 다른 배경색 · 그림 · 글자 크기 종류.
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const ROOT='/home/user/hankki/hankki', DIST=join(ROOT,'dist')
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let body,type=MIME[extname(p)]||'application/octet-stream';try{body=readFileSync(join(DIST,p))}catch{body=readFileSync(join(DIST,'index.html'));type='text/html'}s.writeHead(200,{'content-type':type});s.end(body)})
await new Promise(r=>srv.listen(4399,r))
const { SEED_COACH_SEEN } = await import('/home/user/hankki/hankki/src/coach.js')
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM||undefined})
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2})
await p.addInitScript(SEED_COACH_SEEN)
await p.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1')}catch{}})
await p.goto('http://127.0.0.1:4399/hankki/',{waitUntil:'networkidle'})
await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(1000)
const r = await p.evaluate(()=>{
  const 안=(e)=>{const b=e.getBoundingClientRect();return b.top<844&&b.bottom>0&&b.width>40&&b.height>24}
  const sc=document.querySelector('.screen')||document.body
  // 첫 화면에 보이는 «카드»
  const 카드=[...sc.querySelectorAll('*')].filter(e=>{
    if(!안(e))return false
    const s=getComputedStyle(e)
    const bg=s.backgroundColor
    if(bg==='rgba(0, 0, 0, 0)'||bg==='transparent')return false
    const b=e.getBoundingClientRect()
    return b.width>250 && b.height>=44 && parseFloat(s.borderRadius)>=8
  })
  const 겉카드=카드.filter(e=>!카드.some(o=>o!==e&&o.contains(e)))
  const 색=[...new Set(겉카드.map(e=>getComputedStyle(e).backgroundColor))]
  const 그림=[...sc.querySelectorAll('img')].filter(안)
  const 글자크기=[...new Set([...sc.querySelectorAll('*')].filter(e=>안(e)&&e.children.length===0&&e.textContent.trim()).map(e=>Math.round(parseFloat(getComputedStyle(e).fontSize))))].sort((a,b)=>b-a)
  return {
    겉카드수:겉카드.length,
    카드들:겉카드.map(e=>({이름:(e.className||'').toString().slice(0,28),색:getComputedStyle(e).backgroundColor,높이:Math.round(e.getBoundingClientRect().height)})),
    서로다른배경색:색.length, 색목록:색,
    그림수:그림.length, 그림들:그림.map(e=>e.className.toString().slice(0,20)||e.alt||'(무명)'),
    글자크기종류:글자크기.length, 글자크기,
  }
})
console.log('■ 첫 화면(390×844)에 보이는 것')
console.log(`   겉카드 ${r.겉카드수}장 · 서로 다른 배경색 ${r.서로다른배경색}가지 · 그림 ${r.그림수}개 · 글자 크기 ${r.글자크기종류}종`)
console.log('   카드:'); r.카드들.forEach(c=>console.log(`      ${c.높이}px  ${c.색.padEnd(24)} ${c.이름}`))
console.log('   그림:', r.그림들.join(' · '))
console.log('   글자 크기:', r.글자크기.join('/'))
await b.close(); srv.close()
