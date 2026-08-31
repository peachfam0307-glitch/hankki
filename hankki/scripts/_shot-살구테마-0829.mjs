import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const OUT='/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad'
const { basicRecipes, BASICS_VERSION } = await import('/home/user/hankki/hankki/src/data/basics.js')
const { SEED_COACH_SEEN } = await import('/home/user/hankki/hankki/src/coach.js')
const now=Date.now()
const state={recipes:basicRecipes.map((r,i)=>({...r,status:'sorted',savedAt:now-i*60000})),seedV:BASICS_VERSION}
const P=4399
const srv=spawn('python3',['-m','http.server',String(P),'--bind','127.0.0.1','--directory','/home/user/hankki/hankki/dist'],{stdio:'ignore'})
await new Promise(r=>setTimeout(r,900))
const b=await chromium.launch({executablePath:process.env.SMOKE_CHROMIUM})
const ctx=await b.newContext({viewport:{width:411,height:891},deviceScaleFactor:2,timezoneId:'Asia/Seoul',locale:'ko-KR'})
await ctx.addInitScript({content:SEED_COACH_SEEN})
const p=await ctx.newPage()
const errs=[]; p.on('pageerror',e=>errs.push(String(e)))
await p.goto(`http://127.0.0.1:${P}/`)
await p.evaluate(s=>{localStorage.setItem('hankki:v1',JSON.stringify(s));localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki-theme','apricot')},state)
await p.goto(`http://127.0.0.1:${P}/`)
await p.waitForTimeout(1800)
for(let i=0;i<3;i++){const m=p.locator('.sheet-mask'); if(!(await m.count()))break
  const c=p.getByRole('button',{name:/^(닫기|확인|나중에)$/}); if(await c.count())await c.first().click().catch(()=>{}); else await p.keyboard.press('Escape'); await p.waitForTimeout(500)}
const t=await p.evaluate(()=>document.documentElement.getAttribute('data-theme'))
const bg=await p.evaluate(()=>getComputedStyle(document.body).backgroundColor)
console.log('data-theme =',t,'· body 배경 =',bg)
await p.screenshot({path:`${OUT}/apricot-home.png`})
await p.getByText('레시피',{exact:true}).last().click(); await p.waitForTimeout(900)
await p.screenshot({path:`${OUT}/apricot-recipes.png`})
console.log('pageerror',errs.length)
await b.close(); srv.kill(); process.exit(0)
