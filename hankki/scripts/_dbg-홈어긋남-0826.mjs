import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST=join(new URL('..',import.meta.url).pathname,'dist')
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'};s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4399,r))
const {SEED_COACH_SEEN}=await import('../src/coach.js')
const b=await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})
const page=await b.newPage({viewport:{width:834,height:1194},deviceScaleFactor:1})
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1')}catch{}})
await page.goto('http://127.0.0.1:4399/hankki/',{waitUntil:'networkidle'})
await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(900)
console.log(await page.evaluate(()=>{
  const out=[]
  const 상자=[...document.querySelectorAll('.weekly-box')]
  상자.forEach((bx,i)=>{
    const r=bx.getBoundingClientRect()
    const 줄=bx.querySelector('.weekly-row')
    const 첫칸=bx.querySelector('.mini-card')
    const 그림=첫칸?.querySelector('img, .thumb, div')
    out.push(`상자${i+1} 위 ${Math.round(r.top)} · 줄 위 ${줄?Math.round(줄.getBoundingClientRect().top):'-'} · 첫 그림 위 ${그림?Math.round(그림.getBoundingClientRect().top):'-'}`)
    ;[...bx.children].forEach(e=>{
      const q=e.getBoundingClientRect()
      if(q.height<6) return
      out.push(`   ${String(Math.round(q.height)).padStart(3)}px  .${(typeof e.className==='string'?e.className.split(' ')[0]:e.tagName)}  「${(e.textContent||'').replace(/\s+/g,' ').trim().slice(0,20)}」`)
    })
  })
  const n=document.querySelector('.mini-card .name')
  const cs=getComputedStyle(n)
  const 잰=document.createElement('span')
  잰.style.cssText=`position:absolute;visibility:hidden;white-space:nowrap;font:${cs.font}`
  잰.textContent=n.textContent; document.body.appendChild(잰)
  out.push(`\n이름 「${n.textContent}」 — 칸 ${Math.round(n.getBoundingClientRect().width)}px · 한 줄로 재면 ${Math.round(잰.getBoundingClientRect().width)}px · word-break=${cs.wordBreak} · 글자 ${cs.fontSize}`)
  return out.join('\n')
}))
await b.close();srv.close()
