// 🚨🚨 「저장됐다고 하고 흔적 없이 증발」 재현판 — 창업자 실물 2026-09-02 08:42 〔뿌리 확정용〕
//
// 📮 창업자 = *"방금 하나 저장한거 흔적도 없이 증발함"* · *"채우고 있다고 했는데 레시피는 없어"*
//    ＋ *"어제처럼 증발했어 저장됐다고 하고"*
//
// ⛔⛔ **뿌리(코드) = `store.jsx:1056`**
//    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { 60초에 한 번만 알림 }
//    · 저장이 실패해도 **메모리 상태는 그대로**라 화면은 「저장됐다」고 말한다
//    · 그런데 한 글자도 안 써져서 **다시 그리면 사라진다**
//    · 그리고 **60초 안에 두 번째면 알림조차 안 뜬다** ← 창업자가 겪은 「흔적도 없이」
//
// ⭐ 이 판이 재는 것 = 「화면이 한 말」과 「진짜 저장된 것」이 갈리나
//    ⛔ 「토스트가 떴나」만 재면 안 된다 — 그건 메모리 얘기다(규칙 18 ⓘ)
//
// 실행: node scripts/_repro-저장꽉참-0902.mjs
// 🏷 이름표 = 판정대기 (고치기 «전»이라 지금은 «일부러» 빨간불이 나야 맞다)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4482,r))

let 통과 = 0, 실패 = 0; const 실패목록 = []
const chk = (이름, 조건, 덧말='') => { 조건 ? 통과++ : (실패++, 실패목록.push(이름)); console.log(`  ${조건?'✅':'❌'} ${이름}${덧말?'  '+덧말:''}`); return !!조건 }

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})
const ctx = await b.newContext({ viewport:{width:390,height:844} })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1')}catch{}})

console.log('\n🚨 「저장됐다고 하고 증발」 재현판\n')

const p0 = await ctx.newPage()
await p0.goto('http://127.0.0.1:4482/hankki/',{waitUntil:'networkidle'}); await p0.waitForTimeout(1500)
await p0.evaluate(()=>{
  const s = JSON.parse(localStorage.getItem('hankki:v1')||'{}')
  s.recipes = [{ id:'zz-full', title:'증발판정용', status:'unsorted', source:'photo', savedAt:Date.now(),
    ingredients:['콩나물 300g'], steps:[], favorite:false, cooked:0 }, ...(s.recipes||[])]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
})
await p0.close()

const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4482/hankki/',{waitUntil:'networkidle'}); await p.waitForTimeout(2500)

// ⛔⛔ 큰 덩이만으로는 «덜» 찬다 — 첫 판이 4.75MB 에서 멎었는데 64KB 는 아직 들어갔다.
//    그러면 앱이 쓸 자리가 남아서 **아무것도 재지 못하는 판**이 된다(규칙 18 ⓘ).
// ✅ 큰 것 → 작은 것 순으로 «틈이 없어질 때까지» 채운다.
const 채움 = await p.evaluate(() => {
  let n = 0
  for (const 칸 of [256 * 1024, 16 * 1024, 1024, 64]) {
    const 덩이 = 'x'.repeat(칸)
    try { for (let k = 0; k < 5000; k++) { localStorage.setItem('zz-pad-' + (n++), 덩이) } } catch { n-- }
  }
  return { 덩이수: n, 한끼길이: (localStorage.getItem('hankki:v1')||'').length }
})
console.log(`   채운 조각 = ${채움.덩이수}개 · 한끼 데이터 = ${(채움.한끼길이/1048576).toFixed(2)}MB`)
chk('저장 공간을 «진짜로» 꽉 채웠다 (안 채우면 이 판은 아무것도 안 잰다)',
  await p.evaluate(()=>{ try { localStorage.setItem('zz-probe','y'.repeat(64*1024)); localStorage.removeItem('zz-probe'); return false } catch { return true } }))

await p.getByRole('button',{name:/임시보관함/}).first().click(); await p.waitForTimeout(900)
await p.evaluate(()=>{
  const 줄=[...document.querySelectorAll('.inbox-row')].find(e=>/증발판정용/.test(e.innerText))
  const 칸=줄?.parentElement?.parentElement
  ;[...(칸?.querySelectorAll('button')||[])].find(x=>/채우러 가기/.test(x.innerText))?.click()
})
await p.waitForTimeout(1300)
await p.evaluate(()=>{
  const 칸=[...document.querySelectorAll('input')].find(e=>e.value==='증발판정용')
  if(!칸) return
  const set=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set
  set.call(칸,'증발판정용 고친제목')
  칸.dispatchEvent(new Event('input',{bubbles:true}))
})
await p.waitForTimeout(400)
await p.evaluate(()=>[...document.querySelectorAll('button.btn-primary')].find(x=>x.innerText.trim()==='저장')?.click())
await p.waitForTimeout(1500)

const 화면이한말 = await p.evaluate(()=>document.body.innerText)
chk('⚠️ 화면은 «성공»처럼 굴었다 (편집 화면을 빠져나왔다)', !/레시피 정리/.test(화면이한말))

const p2 = await ctx.newPage()
await p2.goto('http://127.0.0.1:4482/hankki/',{waitUntil:'networkidle'}); await p2.waitForTimeout(2500)
const 남았나 = await p2.evaluate(()=>{
  const s = JSON.parse(localStorage.getItem('hankki:v1')||'{}')
  const r = (s.recipes||[]).find(x=>x.id==='zz-full')
  return { 있나: !!r, 제목: r?.title ?? '(없음)' }
})
console.log(`   새 탭에서 본 값 = ${JSON.stringify(남았나)}`)
chk('⭐⭐ 고친 것이 «진짜로» 저장됐다 (＝증발하지 않았다)', 남았나.제목 === '증발판정용 고친제목', `제목 = ${남았나.제목}`)

const 알렸나 = /가득|저장 공간|저장하지 못/.test(화면이한말)
chk('⭐⭐ 저장이 안 됐으면 화면이 그걸 «말했다»', 남았나.제목 === '증발판정용 고친제목' || 알렸나,
  알렸나 ? '알렸다' : '⛔ 아무 말도 안 했다')

await b.close(); srv.close()
console.log(`\n${실패?'❌':'✅'} ${통과}/${통과+실패}`)
if (실패) { console.log('  실패:', 실패목록.join(' · ')) }
