// 🔎 가로에서 «무엇이» 삐져나오나 — 이름을 대서 잡는다 (2026-08-09)
//   ⛔ 「N개가 넘친다」만으론 못 고친다. 창업자 2026-08-09 *"다른 탭들도 다 가로모드 되게"*
//   ⚠️ 「넘쳤다」≠「깨졌다」 — 가로로 굴러가게 «일부러» 만든 줄도 넘침으로 잡힌다(2026-08-09 오전에 한 번 속았다).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = '/home/user/hankki/hankki/dist'
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4392,r))
const { BASICS_VERSION } = await import('../src/data/basics.js')
const SEED={recipes:[],diary:[{id:'d1',kind:'diary',at:0,paper:{rule:'plain',skin:'ivory',art:'none'},decor:[],note:''}],seedV:BASICS_VERSION}
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM||'/opt/pw-browsers/chromium'})
for (const [탭, w, h] of [['레시피',891,322],['장보기',780,360],['레시피',780,360]]) {
  const page=await b.newPage({viewport:{width:w,height:h},timezoneId:'Asia/Seoul',locale:'ko-KR'})
  await page.addInitScript((s)=>{const d=new Date();d.setHours(12,0,0,0);s.diary.forEach(x=>{x.at=d.getTime()});localStorage.setItem('hankki:v1',JSON.stringify(s));localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:nudge:giftpack','1');const g=Storage.prototype.getItem;Storage.prototype.getItem=function(k){return (typeof k==='string'&&k.startsWith('hankki:coach:'))?'1':g.call(this,k)}},SEED)
  await page.goto('http://127.0.0.1:4392/hankki/',{waitUntil:'networkidle'}); await page.waitForTimeout(900)
  const t=page.getByText(탭,{exact:true}).last()
  if (await t.count().catch(()=>0)) { await t.click({timeout:3000}).catch(()=>{}); await page.waitForTimeout(900) }
  const out = await page.evaluate(() => {
    const r=[]
    for (const el of document.querySelectorAll('body *')) {
      const cs=getComputedStyle(el)
      if (cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0) continue
      const q=el.getBoundingClientRect()
      if (q.width<8||q.height<8) continue
      const over=Math.max(q.right-window.innerWidth, -q.left)
      if (over>2) {
        // ⭐ 「옆으로 굴러가는 줄」 안에 있으면 넘치는 게 «정상»이다 — 그걸 갈라 적는다
        let sc=null, p=el.parentElement
        while(p){const c=getComputedStyle(p);if((c.overflowX==='auto'||c.overflowX==='scroll')&&p.scrollWidth>p.clientWidth+4){sc=p.className||p.tagName;break}p=p.parentElement}
        r.push({ 이름: (el.className&&typeof el.className==='string'?'.'+el.className.split(' ').filter(Boolean).join('.'):el.tagName).slice(0,60),
          글: (el.innerText||'').replace(/\n/g,' ').slice(0,26), 넘침: Math.round(over),
          굴러가는줄안: sc ? String(sc).slice(0,40) : null })
      }
    }
    return r
  })
  console.log(`\n── ${탭} ${w}×${h} — 넘친 것 ${out.length}개`)
  for (const o of out) console.log('   ', JSON.stringify(o))
  await page.close()
}
await b.close(); srv.close()
