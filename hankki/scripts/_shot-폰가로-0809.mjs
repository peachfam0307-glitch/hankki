import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const ROOT = new URL('.', import.meta.url).pathname
const DIST = '/home/user/hankki/hankki/dist'
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4390,r))
const { BASICS_VERSION } = await import('/home/user/hankki/hankki/src/data/basics.js')
const SEED={recipes:[],diary:[{id:'d1',kind:'diary',at:0,paper:{rule:'plain',skin:'ivory',art:'none'},decor:[],note:''}],seedV:BASICS_VERSION}
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'})
const OUT='/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/검수'
for (const [name, w, h] of [['폰가로-레꾸',891,322],['폰가로-일꾸',891,322]]) {
  const page=await b.newPage({viewport:{width:w,height:h},timezoneId:'Asia/Seoul',locale:'ko-KR',deviceScaleFactor:3})
  await page.addInitScript((s)=>{const d=new Date();d.setHours(12,0,0,0);s.diary.forEach(x=>{x.at=d.getTime()});localStorage.setItem('hankki:v1',JSON.stringify(s));localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:nudge:giftpack','1');const g=Storage.prototype.getItem;Storage.prototype.getItem=function(k){return (typeof k==='string'&&k.startsWith('hankki:coach:'))?'1':g.call(this,k)}},SEED)
  await page.goto('http://127.0.0.1:4390/hankki/',{waitUntil:'networkidle'})
  await page.waitForTimeout(1000)
  if (name.includes('레꾸')) {
    await page.locator('.grid-card').first().click(); await page.waitForTimeout(800)
    await page.getByRole('button',{name:/레시피 꾸미기|꾸미기/}).first().click()
  } else {
    await page.getByText('일기',{exact:true}).last().click(); await page.waitForTimeout(700)
    await page.getByRole('button',{name:/오늘 일기 (쓰기|보기)/}).first().click(); await page.waitForTimeout(1200)
    await page.getByRole('button',{name:'꾸미기 열기'}).first().click()
  }
  await page.waitForTimeout(1300)
  await page.screenshot({path:`${OUT}/${name}.png`})
  console.log('찍음', name)
  await page.close()
}
await b.close(); srv.close()
