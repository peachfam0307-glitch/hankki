import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST=join(new URL('..',import.meta.url).pathname,'dist')
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'};s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4402,r))
const {SEED_COACH_SEEN}=await import('../src/coach.js')
const b=await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})
const page=await b.newPage({viewport:{width:1194,height:834},deviceScaleFactor:1})
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1')}catch{}})
await page.goto('http://127.0.0.1:4402/hankki/',{waitUntil:'networkidle'})
await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(800)
await page.locator('.bottom-nav .nav-item').filter({hasText:'장보기'}).first().click()
await page.waitForTimeout(1200)
console.log(await page.evaluate(()=>{
  const 오=document.querySelector('.shop-list')
  const 줄=[]
  const 훑=(el,d)=>{[...el.children].forEach(e=>{
    const r=e.getBoundingClientRect(); if(r.height<4) return
    const cs=getComputedStyle(e)
    const 잘림 = (e.scrollHeight > e.clientHeight+2 && cs.overflowY!=='visible') ? ' 세로잘림!' : ''
    줄.push(`${'  '.repeat(d)}y${String(Math.round(r.top)).padStart(4)}~${String(Math.round(r.bottom)).padStart(4)} h${String(Math.round(r.height)).padStart(4)} .${(typeof e.className==='string'?e.className.split(' ')[0]:e.tagName)||'?'} of=${cs.overflow}${잘림} 「${(e.textContent||'').replace(/\s+/g,' ').trim().slice(0,22)}」`)
    if(d<1) 훑(e,d+1)
  })}
  훑(오,0)
  const 몰줄=document.querySelector('.mall-row')
  if (몰줄) {
    const mr=몰줄.getBoundingClientRect(), cs=getComputedStyle(몰줄)
    줄.push('MALL 보이는폭 '+Math.round(mr.width)+' 속폭 '+몰줄.scrollWidth+' overflowX='+cs.overflowX+' wrap='+cs.flexWrap)
    ;[...몰줄.children].forEach(e=>{
      const r=e.getBoundingClientRect()
      const 넘 = r.right > mr.right+0.5 || r.left < mr.left-0.5
      줄.push('   '+(넘?'NG':'ok')+' x'+Math.round(r.left)+'~'+Math.round(r.right)+' (칸 '+Math.round(mr.left)+'~'+Math.round(mr.right)+') '+(e.textContent||'').trim().slice(0,8))
    })
  }
  const 몰=document.querySelector('.mall-row')
  줄.push(`\n쇼핑몰 줄 y=${몰?Math.round(몰.getBoundingClientRect().top):'-'} · 오른쪽 칸 바닥 y=${Math.round(오.getBoundingClientRect().bottom)}`)
  return 줄.join('\n')
}))
await b.close();srv.close()
