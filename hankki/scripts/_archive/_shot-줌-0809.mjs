import '/home/user/hankki/hankki/scripts/_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const R='/home/user/hankki/hankki/', D=join(R,'dist')
const M={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=M[extname(p)]||'application/octet-stream';try{b=readFileSync(join(D,p))}catch{b=readFileSync(join(D,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4394,r))
const {BASICS_VERSION}=await import(R+'src/data/basics.js')
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM||'/opt/pw-browsers/chromium'})
const OUT='/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/검수'
const page=await b.newPage({viewport:{width:891,height:322},timezoneId:'Asia/Seoul',locale:'ko-KR',deviceScaleFactor:2})
await page.addInitScript((s)=>{const d=new Date();d.setHours(12,0,0,0);s.diary.forEach(x=>{x.at=d.getTime()});localStorage.setItem('hankki:v1',JSON.stringify(s));localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:nudge:giftpack','1');const g=Storage.prototype.getItem;Storage.prototype.getItem=function(k){return(typeof k==='string'&&k.startsWith('hankki:coach:'))?'1':g.call(this,k)}},{recipes:[],diary:[{id:'d1',kind:'diary',at:0,paper:{rule:'plain',skin:'ivory',art:'none'},decor:[],note:''}],seedV:BASICS_VERSION})
await page.goto('http://127.0.0.1:4394/hankki/',{waitUntil:'networkidle'});await page.waitForTimeout(900)
await page.getByText('일기',{exact:true}).last().click();await page.waitForTimeout(600)
await page.getByRole('button',{name:/오늘 일기 (쓰기|보기)/}).first().click();await page.waitForTimeout(1100)
await page.getByRole('button',{name:'꾸미기 열기'}).first().click();await page.waitForTimeout(1000)
// 속지 → 사진일기
await page.getByRole('button',{name:'속지',exact:true}).last().click();await page.waitForTimeout(600)
await page.getByText('사진일기',{exact:true}).first().click();await page.waitForTimeout(900)
await page.screenshot({path:`${OUT}/줌-100.png`})
for(const [n,k] of [['140',1],['180',2]]){ for(let i=0;i<1;i++) await page.getByRole('button',{name:'종이 크게'}).click(); await page.waitForTimeout(500); await page.screenshot({path:`${OUT}/줌-${n}.png`}) }
await b.close();srv.close()
