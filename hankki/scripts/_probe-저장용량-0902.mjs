// 📦 「사진도 안 넣었는데 왜 4.88MB냐」 — 저장소를 «갈래별»로 잰다 (창업자 물음 2026-09-02)
// 실행: node scripts/_probe-저장용량-0902.mjs
// 🏷 이름표 = 판정대기
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4483,r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})
const ctx = await b.newContext({ viewport:{width:390,height:844} })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1')}catch{}})
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4483/hankki/',{waitUntil:'networkidle'}); await p.waitForTimeout(4000)

const 잰값 = await p.evaluate(() => {
  const 키들 = Object.keys(localStorage)
  const 전체 = 키들.map(k => [k, (localStorage.getItem(k)||'').length]).sort((a,b)=>b[1]-a[1])
  const s = JSON.parse(localStorage.getItem('hankki:v1')||'{}')
  const 갈래 = Object.entries(s).map(([k,v]) => [k, JSON.stringify(v).length]).sort((a,b)=>b[1]-a[1])
  const rs = s.recipes || []
  const 재기 = (f) => rs.reduce((m,r)=> m + JSON.stringify(r[f] ?? null).length, 0)
  return {
    키들: 전체.slice(0,6),
    전체길이: (localStorage.getItem('hankki:v1')||'').length,
    갈래: 갈래.slice(0,8),
    레시피수: rs.length,
    사진있는편: rs.filter(r=>r.image).length,
    필드별: [['image',재기('image')],['decor',재기('decor')],['rawText',재기('rawText')],
      ['steps',재기('steps')],['ingredients',재기('ingredients')],['memo',재기('memo')]].sort((a,b)=>b[1]-a[1]),
  }
})
const MB = (n)=> (n/1048576).toFixed(2)+'MB'
console.log('\n📦 갓 깐 앱(내 레시피 0편) 실측\n')
console.log(`  hankki:v1 전체 = ${MB(잰값.전체길이)}  ·  레시피 ${잰값.레시피수}편(사진 있는 편 ${잰값.사진있는편})`)
console.log('\n  갈래별:'); 잰값.갈래.forEach(([k,v])=>console.log(`    ${k.padEnd(14)} ${MB(v)}`))
console.log('\n  레시피 «필드»별:'); 잰값.필드별.forEach(([k,v])=>console.log(`    ${k.padEnd(14)} ${MB(v)}`))
console.log('\n  localStorage 키 전부:'); 잰값.키들.forEach(([k,v])=>console.log(`    ${k.padEnd(24)} ${MB(v)}`))
// 📸 캡처 한 장이 «얼마나» 먹나 — 폰 캡처(1080×2340)를 지금 규칙대로 줄여서 잰다
const 한장 = await p.evaluate(async () => {
  const 그리기 = (w,h) => { const c=document.createElement('canvas'); c.width=w; c.height=h
    const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,w,h)
    x.fillStyle='#222'; x.font='34px sans-serif'
    for(let k=0;k<28;k++) x.fillText('항정살은 한입 크기로 썰어 핏물을 뺀다 '+k, 60, 120+k*72)
    return c }
  const 원본 = 그리기(1080,2340)
  const 줄이기 = (cv, max, q) => { const s=Math.min(1,max/Math.max(cv.width,cv.height))
    const c=document.createElement('canvas'); c.width=Math.round(cv.width*s); c.height=Math.round(cv.height*s)
    c.getContext('2d').drawImage(cv,0,0,c.width,c.height); return c.toDataURL('image/jpeg',q).length }
  return { 원본: 원본.toDataURL('image/jpeg',0.92).length,
    지금_1600: 줄이기(원본,1600,0.85), 후보_1200: 줄이기(원본,1200,0.8),
    후보_900: 줄이기(원본,900,0.75), 후보_700: 줄이기(원본,700,0.7) }
})
const KB = (n)=> (n/1024).toFixed(0)+'KB'
console.log('\n📸 폰 캡처 한 장(1080×2340) 저장 크기 · 5MB 한도에 몇 장 들어가나\n')
for (const [이름, 값] of Object.entries(한장))
  console.log(`  ${이름.padEnd(10)} ${KB(값).padStart(7)}  →  약 ${Math.floor(5*1048576/값)}장`)

await b.close(); srv.close()
