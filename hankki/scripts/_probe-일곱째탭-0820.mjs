import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const ROOT = '/home/user/hankki/hankki/'
const DIST = join(ROOT, 'dist')
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4395,r))
const { SEED_COACH_SEEN } = await import(ROOT+'src/coach.js')
const b = await chromium.launch()
console.log('화면폭  지금6칸    일곱째넣으면   44px?')
for (const w of [320, 360, 390, 412]) {
  const p = await b.newPage({ viewport:{width:w,height:800}, deviceScaleFactor:2 })
  await p.addInitScript(SEED_COACH_SEEN)
  await p.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1')}catch{}})
  await p.goto('http://127.0.0.1:4395/hankki/',{waitUntil:'networkidle'})
  await p.waitForTimeout(700)
  const r = await p.evaluate(()=>{
    const nav=document.querySelector('.bottom-nav'); if(!nav) return null
    const it=[...nav.querySelectorAll('.nav-item')]
    const now=it[0].getBoundingClientRect().width
    // 일곱째를 «진짜로» 넣어 본다 — 계산이 아니라 브라우저가 재게 한다
    const c=it[2].cloneNode(true); nav.appendChild(c)
    const after=[...nav.querySelectorAll('.nav-item')][0].getBoundingClientRect().width
    c.remove()
    return { now:Math.round(now*10)/10, after:Math.round(after*10)/10, n:it.length }
  })
  console.log(String(w).padEnd(7), String(r.now).padEnd(10), String(r.after).padEnd(14), r.after>=44?'✅ 된다':'⛔ 안 된다')
  await p.close()
}
await b.close(); srv.close()
