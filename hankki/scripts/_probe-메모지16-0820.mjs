// 📌 메모지 16컷이 앱에 «진짜로» 붙나 — 레시피마다 다른 종이 · 날짜 머리글 (2026-08-20)
//   ⭐ 물어야 할 것 = 「등록됐나」가 아니라 **「화면에 그 그림이 떴나」**(규칙 18 ⓘ)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const ROOT = new URL('..', import.meta.url).pathname, DIST = join(ROOT, 'dist')
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html'
let body,type=MIME[extname(p)]||'application/octet-stream'
try{body=readFileSync(join(DIST,p))}catch{body=readFileSync(join(DIST,'index.html'));type='text/html'}
s.writeHead(200,{'content-type':type});s.end(body)})
await new Promise(r=>srv.listen(4413,r))
const { SEED_COACH_SEEN } = await import('../src/coach.js')
const { MEMO_PAPERS } = await import('../src/memoPaper.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})
const ctx = await b.newContext({ viewport:{width:390,height:900}, timezoneId:'Asia/Seoul' })
const 넷 = ['콩국수','닭곰탕','제육볶음','된장찌개']
const p0 = await ctx.newPage(); await p0.addInitScript(SEED_COACH_SEEN)
await p0.addInitScript(()=>{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1')})
await p0.goto('http://127.0.0.1:4413/',{waitUntil:'networkidle'})
await p0.waitForFunction(()=>!!localStorage.getItem('hankki:v1'),null,{timeout:15000})
const 심은것 = await p0.evaluate((넷)=>{const s=JSON.parse(localStorage.getItem('hankki:v1'))
const 글=['간장 반만','물 조금 더','고추장 한 술 줄이기','무 먼저 깔기'], 산것=[]
s.diary=[]
넷.forEach((이름,i)=>{const r=s.recipes.find(x=>x.title===이름); if(!r)return
r.cooked=2; r.cookedAt=Date.now()-864e5
// ⛔ paper 를 «일부러 안 넣는다» — 이미 쓴 메모(폴백 경로)를 재현한다
s.diary.push({id:'d'+i,recipeId:r.id,title:r.title,at:Date.parse('2026-08-19T03:00:00Z')-i*864e5,rating:4,note:글[i],photo:null})
산것.push(r.title)})
localStorage.setItem('hankki:v1',JSON.stringify(s)); return 산것},넷)
await p0.close()

const 결과=[]
for (const 제목 of 심은것) {
  const p=await ctx.newPage(); await p.addInitScript(SEED_COACH_SEEN)
  await p.goto('http://127.0.0.1:4413/',{waitUntil:'networkidle'}); await p.waitForTimeout(600)
  await p.click(`text=${제목}`); await p.waitForSelector('.memo-note',{timeout:10000})
  const r=await p.evaluate(()=>{const el=[...document.querySelectorAll('.memo-note')].pop()
  const bg=getComputedStyle(el).backgroundImage
  return {종이:(bg.match(/pn\d{3}/)||[null])[0], 머리:el.querySelector('.memo-note-head span')?.textContent||'',
          폭:Math.round(el.getBoundingClientRect().width), 글씨:getComputedStyle(el).fontFamily.split(',')[0]}})
  결과.push({제목,...r}); await p.close()
}
await ctx.close(); await b.close(); srv.close()

let 죽음=0
// ⛔⛔ 「넷」이라 해놓고 셋만 심겨도 통과했다 — 못 찾은 레시피가 «조용히» 빠진다(규칙 18).
//    개수를 «먼저» 못 박는다. 이게 없으면 아래 every() 는 빈 배열에도 참이다.
const 말 = (ok,s)=>{ if(!ok)죽음++; console.log(`${ok?'✅':'⛔'} ${s}`) }
말(결과.length === 넷.length, `레시피 ${넷.length}편이 다 열렸다 (지금 ${결과.length}편)`)
결과.forEach(r=>console.log(`  ${r.제목.padEnd(6)} 종이=${r.종이} · 머리=「${r.머리}」 · 폭=${r.폭}px · 글씨=${r.글씨}`))
말(결과.every(r=>r.종이 && MEMO_PAPERS.includes(r.종이)), '넷 다 «새 16컷» 중 하나를 쓴다')
말(new Set(결과.map(r=>r.종이)).size >= 3, '레시피마다 다른 종이가 붙는다')
말(결과.every(r=>/^\d{1,2}월 \d{1,2}일$/.test(r.머리)), '머리글이 «날짜»다')
말(결과.every(r=>r.폭>=150 && r.폭<=170), '폭 44% (150~170px)')
말(결과.every(r=>r.글씨.replace(/"/g,'')==='Gaegu'), '글씨체가 귀염체')
process.exit(죽음 ? 1 : 0)
