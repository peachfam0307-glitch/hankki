// 🐛 재현: 옛 핀(favorite:true, favPin 없음=모자)을 «한 번» 누르면 어떻게 되나
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const ROOT='/home/user/hankki/hankki', DIST=join(ROOT,'dist')
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html'
 let body,type=MIME[extname(p)]||'application/octet-stream'
 try{body=readFileSync(join(DIST,p))}catch{body=readFileSync(join(DIST,'index.html'));type='text/html'}
 s.writeHead(200,{'content-type':type});s.end(body)})
await new Promise(r=>srv.listen(0,r)); const PORT=srv.address().port
const {BASICS_VERSION}=await import('file://'+join(ROOT,'src/data/basics.js'))
const now=Date.now()
const state={recipes:[0,1,2].map(i=>({id:'x'+i,title:'옛핀 '+i,category:'한식',time:10,thumb:'icon',icon:'fe_18',
  ingredients:['a'],steps:['해요.'],tags:[],savedAt:now-i*1000,source:'user',status:'sorted',
  favorite:false,favPin:'heart',cooked:0})),diary:[],seedV:BASICS_VERSION,removedSeedIds:[]}
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM})
const ctx=await b.newContext({viewport:{width:390,height:844}})
const {SEED_COACH_SEEN}=await import('file://'+join(ROOT,'src/coach.js'))
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(s=>{localStorage.setItem('hankki:v1',JSON.stringify(s));localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1');localStorage.setItem('hankki:gridSize','small')},state)
const p=await ctx.newPage()
await p.goto(`http://127.0.0.1:${PORT}/`,{waitUntil:'networkidle'});await p.waitForTimeout(1200)
await p.getByText('레시피',{exact:true}).last().click();await p.waitForTimeout(900)
const 칩 = async()=> (await p.$$eval('.pill',es=>es.map(e=>e.innerText.trim()))).join(' / ')
console.log('① 처음      :', await 칩())
await p.locator('.fav-dot').first().click(); await p.waitForTimeout(500)
console.log('② 한 번 누름:', await 칩())
await p.locator('.fav-dot').first().click(); await p.waitForTimeout(500)
console.log('③ 두 번 누름:', await 칩())
const 남은 = await p.evaluate(()=>JSON.parse(localStorage.getItem('hankki:v1')).recipes.map(r=>[r.title,r.favorite,r.favPin]))
console.log('④ 저장값:', JSON.stringify(남은))
await b.close(); srv.close()
