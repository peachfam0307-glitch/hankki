// 📏 두 카드의 «줄 간격»을 잰다 — 창업자 = *"아직안해봤어요랑 오늘 뭐해먹지랑 줄간이 너무 달라"*
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST=join(new URL('..',import.meta.url).pathname,'dist')
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'};s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4405,r))
const {SEED_COACH_SEEN}=await import('../src/coach.js')
const b=await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})
const page=await b.newPage({viewport:{width:1194,height:834},deviceScaleFactor:1})
await page.addInitScript(SEED_COACH_SEEN)
await page.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1')}catch{}})
await page.goto('http://127.0.0.1:4405/hankki/',{waitUntil:'networkidle'})
// ⛔ 주입 안 한다 — 이제 CSS 가 «파일에» 들어갔다. 또 얹으면 두 번 먹어 잣대가 거짓말한다.
await page.evaluate(()=>document.fonts.ready); await page.waitForTimeout(900)
console.log(await page.evaluate(()=>{
  const 줄=[]
  const 재기=(칸이름, 것들)=>{
    줄.push(`━━ ${칸이름}`)
    let 앞=null
    것들.forEach(([라벨,sel])=>{
      const e=document.querySelector(sel); if(!e) { 줄.push(`   ${라벨} — 없음`); return }
      const r=e.getBoundingClientRect(), cs=getComputedStyle(e)
      const 틈 = 앞 ? Math.round(r.top-앞) : 0
      줄.push(`   ${라벨.padEnd(6)} y${String(Math.round(r.top)).padStart(4)} h${String(Math.round(r.height)).padStart(3)} · 글자 ${cs.fontSize} · 줄높이 ${cs.lineHeight} · 위여백 ${cs.marginTop} · 앞과 틈 ${틈}px`)
      앞=r.bottom
    })
  }
  const o=document.querySelector('.next-open')
  if(o){ const cs=getComputedStyle(o)
    줄.push('🔎 .next-open display='+cs.display+' rows='+cs.gridTemplateRows+' alignContent='+cs.alignContent+' h='+Math.round(o.getBoundingClientRect().height))
    ;[...o.children].forEach(e=>{const r=e.getBoundingClientRect(); const c=getComputedStyle(e)
      줄.push('   자식 .'+((typeof e.className==='string'?e.className.split(' ')[0]:e.tagName)||'?')+' y'+Math.round(r.top)+' h'+Math.round(r.height)+' row='+c.gridRowStart+'/'+c.gridRowEnd)})
    const th=document.querySelector('.next-card [style*="--next-thumb"], .next-open > :first-child')
    줄.push('   표지? '+(th?th.className+' '+Math.round(th.getBoundingClientRect().width)+'px':'없음'))
  }
  재기('아직 안 해봤어요', [['라벨','.next-label'],['제목','.next-title'],['설명','.next-reason']])
  재기('오늘 뭐 해먹지',  [['라벨','.today-label'],['제목','.today-title'],['설명','.today-reason']])
  // 🎯 표지와 «글 덩어리»의 세로 가운데가 맞나 — 창업자 = *"오늘 뭐해먹지랑 콩국수 살짝 올라가있는데"*
  const 잰다=(이름, 표지sel, 글들)=>{
    const t=document.querySelector(표지sel); if(!t) return
    const tr=t.getBoundingClientRect()
    const 것=글들.map(s=>document.querySelector(s)).filter(Boolean).map(e=>e.getBoundingClientRect())
    if(!것.length) return
    const 위=Math.min(...것.map(r=>r.top)), 아래=Math.max(...것.map(r=>r.bottom))
    줄.push('🎯 '+이름+' 표지 가운데 y'+Math.round(tr.top+tr.height/2)+' · 글덩어리 가운데 y'+Math.round((위+아래)/2)+' → 어긋남 '+Math.round((위+아래)/2-(tr.top+tr.height/2))+'px')
  }
  잰다('아직 안 해봤어요','.next-thumb',['.next-label','.next-title','.next-reason'])
  잰다('오늘 뭐 해먹지','.today-main > :first-child',['.today-label','.today-title','.today-reason'])
  // 카드 «상자» 안에서 속이 가운데인가
  const 상자=(이름,박스sel,속sel)=>{
    const b=document.querySelector(박스sel), i=document.querySelector(속sel)
    if(!b||!i) return
    const br=b.getBoundingClientRect(), ir=i.getBoundingClientRect()
    줄.push('📦 '+이름+' 상자 y'+Math.round(br.top)+'~'+Math.round(br.bottom)+' · 속 y'+Math.round(ir.top)+'~'+Math.round(ir.bottom)
      +' → 위여백 '+Math.round(ir.top-br.top)+'px · 아래여백 '+Math.round(br.bottom-ir.bottom)+'px')
  }
  상자('아직 안 해봤어요','.next-card','.next-open')
  상자('오늘 뭐 해먹지','.today-card','.today-main')
  const nc=document.querySelector('.news-title'), ns=document.querySelector('.news-sub')
  if(nc) 줄.push('📣 한끼소식 제목 '+getComputedStyle(nc).fontSize+' · 설명 '+(ns?getComputedStyle(ns).fontSize:'?'))
  return 줄.join('\n')
}))
await b.close();srv.close()
