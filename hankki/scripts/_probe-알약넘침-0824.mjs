import './_fresh.mjs'
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
const { basicRecipes, BASICS_VERSION } = await import('../src/data/basics.js')
const { COACH } = await import('../src/coach.js')
const now = Date.now()
const state = { recipes: basicRecipes.map((r,i)=>({...r,status:'sorted',savedAt:now-i*60000})), seedV: BASICS_VERSION }
const PORT = Number(process.env.PORT || 4421)
const srv = spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1','--directory','dist'],{stdio:'ignore'})
process.on('exit',()=>{try{srv.kill()}catch{}})
await new Promise(r=>setTimeout(r,900))
const b = await chromium.launch({ executablePath: process.env.SMOKE_CHROMIUM })
for (const W of [390, 360, 320, 412]) {
  const page = await (await b.newContext({viewport:{width:W,height:900},deviceScaleFactor:2})).newPage()
  page.setDefaultTimeout(15000)
  const url=`http://127.0.0.1:${PORT}/`
  await page.goto(url)
  await page.evaluate(({s,keys})=>{localStorage.setItem('hankki:v1',JSON.stringify(s));localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:nudge:giftpack','1');keys.forEach(k=>localStorage.setItem(k,'1'));localStorage.setItem('hankki:ocrLeft',JSON.stringify({welcome:20,month:5}))},{s:state,keys:Object.values(COACH)})
  await page.goto(url); await page.waitForTimeout(1600)
  try { await page.locator('[data-coach="import"]').first().click({timeout:8000}) } catch { await page.getByText('가져오기',{exact:true}).last().click({timeout:8000}) }
  await page.waitForTimeout(1300)
  const r = await page.evaluate(()=>{
    const pill=[...document.querySelectorAll('span')].find(s=>s.textContent.trim()==='제일 많이 써요')
    if(!pill) return null
    const 카드 = pill.closest('button')
    const p=pill.getBoundingClientRect(), c=카드.getBoundingClientRect()
    const 제목=[...document.querySelectorAll('span')].find(s=>s.textContent.trim()==='사진 · 직접 작성하기')
    const t=제목.getBoundingClientRect()
    const 줄 = pill.parentElement.getBoundingClientRect()
    return { 카드:`${Math.round(c.left)}~${Math.round(c.right)}`, 줄:`${Math.round(줄.left)}~${Math.round(줄.right)}`,
      제목폭:Math.round(t.width), 알약:`${Math.round(p.left)}~${Math.round(p.right)}`, 알약폭:Math.round(p.width),
      넘침: Math.round(p.right - c.right) }
  })
  console.log(`${W}px  ${JSON.stringify(r)}`)
  await page.close()
}
await b.close()
