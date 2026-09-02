// 🗄🗄 「사진이 큰 창고로 갔나 · 그래도 다 보이나」 재현판 — 2026-09-02 〔반영됨〕
//
// 📮 창업자 2026-09-02 08:42 = *"방금 하나 저장한거 흔적도 없이 증발함"* (서랍 4.56MB/5MB = 91%)
// 🔒 심장 = **「서랍이 «안» 커진다」 ＋ 「껐다 켜도 사진이 보인다」** 둘 다라야 한다.
//    ⛔ 하나만 재면 «사진을 버리고 서랍만 비운» 것도 초록불이 된다.
//
// 실행: node scripts/_repro-사진이사-0902.mjs
// 🏷 이름표 = 반영됨 (배포 게이트 · smoke)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4495,r))

let 통과=0, 실패=0; const 실패목록=[]
const chk=(이름,조건,덧말='')=>{조건?통과++:(실패++,실패목록.push(이름));console.log(`  ${조건?'✅':'❌'} ${이름}${덧말?'  '+덧말:''}`)}

const { SEED_COACH_SEEN } = await import('../src/coach.js')
const b = await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})
const ctx = await b.newContext({ viewport:{width:390,height:844} })
await ctx.addInitScript(SEED_COACH_SEEN)
await ctx.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1')}catch{}})

console.log('\n🗄 사진 이사 — 서랍이 비고, 그래도 다 보이나\n')

// ── 씨앗 = «옛 폰» 흉내: 서랍에 사진이 통째로 들어 있다 ──
const p0 = await ctx.newPage()
await p0.goto('http://127.0.0.1:4495/hankki/',{waitUntil:'networkidle'}); await p0.waitForTimeout(1500)
const 심은 = await p0.evaluate(() => {
  const c=document.createElement('canvas'); c.width=900; c.height=1200
  const x=c.getContext('2d'); x.fillStyle='#c33'; x.fillRect(0,0,900,1200)
  x.fillStyle='#fff'; x.font='bold 90px sans-serif'; x.fillText('사진', 300, 620)
  const 사진 = c.toDataURL('image/jpeg', 0.8)
  const s = JSON.parse(localStorage.getItem('hankki:v1')||'{}')
  const t = Date.now()
  s.recipes = [
    { id:'zz-1', title:'사진표지 하나', status:'sorted', source:'manual', thumb:'photo', image:사진, savedAt:t, ingredients:['콩나물 300g','들기름'], steps:['씻어요','무쳐요'], favorite:false, cooked:0 },
    { id:'zz-2', title:'사진표지 둘', status:'sorted', source:'manual', thumb:'photo', image:사진, savedAt:t-1, ingredients:['두부'], steps:['부쳐요','뒤집어요'], favorite:false, cooked:0 },
    ...(s.recipes||[])]
  s.diary = [{ id:'zz-d1', date:'2026-09-02', note:'맛있었다', photo:사진 }, ...(s.diary||[])]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  return { 서랍전: (localStorage.getItem('hankki:v1')||'').length, 사진길이: 사진.length }
})
console.log(`   심은 뒤 서랍 = ${(심은.서랍전/1048576).toFixed(2)}MB (사진 한 장 ${Math.round(심은.사진길이/1024)}KB × 3)`)
await p0.close()

// ── 앱을 켠다 → 저장이 돌면서 사진이 창고로 간다 ──
const p1 = await ctx.newPage()
const 오류=[]; p1.on('pageerror', e=>{ if(!/tesseract|importScripts|cdn\.jsdelivr|Failed to fetch/i.test(e.message)) 오류.push(e.message) })
await p1.goto('http://127.0.0.1:4495/hankki/',{waitUntil:'networkidle'}); await p1.waitForTimeout(3000)

const 뒤 = await p1.evaluate(async () => {
  const 서랍 = localStorage.getItem('hankki:v1')||''
  const s = JSON.parse(서랍)
  const r1 = (s.recipes||[]).find(r=>r.id==='zz-1')
  const d1 = (s.diary||[]).find(d=>d.id==='zz-d1')
  const m = await import('/hankki/assets/index.js').catch(()=>null)
  return {
    서랍후: 서랍.length,
    서랍에data가남았나: 서랍.includes('data:image/'),
    표지가쪽지인가: typeof r1?.image === 'string' && r1.image.startsWith('idb://'),
    일기도쪽지인가: typeof d1?.photo === 'string' && d1.photo.startsWith('idb://'),
    쪽지열쇠: r1?.image,
  }
})
// ⛔⛔ 「전체의 1/3 로 줄었나」로 재면 **잣대가 씨앗에 휘둘린다** — 기본 레시피 글자가 많으면
//    사진을 «다 빼고도» 그 문턱을 못 넘는다(첫 판이 그래서 빨간불이었다 · 규칙 18 ⓘ).
// ✅ 재야 할 것 = **「빠진 양이 사진 크기만큼인가」**. 씨앗이 뭐든 이건 안 흔들린다.
const 사진총량 = 심은.사진길이 * 3
chk('⭐⭐ 서랍에서 «사진 크기만큼» 빠졌다', (심은.서랍전 - 뒤.서랍후) >= 사진총량 * 0.9,
  `${(심은.서랍전/1024).toFixed(0)}KB → ${(뒤.서랍후/1024).toFixed(0)}KB (사진 ${(사진총량/1024).toFixed(0)}KB)`)
chk('⭐⭐ 서랍에 사진(data:)이 «한 글자도» 없다', !뒤.서랍에data가남았나)
chk('표지 자리에 «쪽지»가 남았다 (null 이 아니다 — 있다/없다를 갈라야 한다)', 뒤.표지가쪽지인가, 뒤.쪽지열쇠)
chk('일기 사진도 «칸 이름과 상관없이» 갔다', 뒤.일기도쪽지인가)

// ── 화면 = 표지가 «보이나» ──
await p1.evaluate(()=>{const 바=document.querySelector('.bottom-nav')||document.querySelector('nav');[...(바?.querySelectorAll('button')||[])].find(x=>(x.innerText||'').trim()==='레시피')?.click()})
await p1.waitForTimeout(1800)
const 화면 = await p1.evaluate(()=>{
  const 칸들=[...document.querySelectorAll('.grid-card')]
  const 찾기=(제목)=>칸들.find(e=>e.innerText.includes(제목))
  const 그림있나=(e)=>!!e?.querySelector('img[src^="data:image/"]')
  return { 하나: 그림있나(찾기('사진표지 하나')), 칸수: 칸들.length }
})
chk('⭐⭐ 창고에서 꺼내 «표지가 진짜로 그려진다»', 화면.하나, `칸 ${화면.칸수}개`)

// ── 새 탭 = 껐다 켜도 그대로인가 ──
const p2 = await ctx.newPage()
await p2.goto('http://127.0.0.1:4495/hankki/',{waitUntil:'networkidle'}); await p2.waitForTimeout(2500)
await p2.evaluate(()=>{const 바=document.querySelector('.bottom-nav')||document.querySelector('nav');[...(바?.querySelectorAll('button')||[])].find(x=>(x.innerText||'').trim()==='레시피')?.click()})
await p2.waitForTimeout(1800)
const 다시 = await p2.evaluate(()=>{
  const e=[...document.querySelectorAll('.grid-card')].find(x=>x.innerText.includes('사진표지 하나'))
  return !!e?.querySelector('img[src^="data:image/"]')
})
chk('⭐⭐ 껐다 켜도 사진이 «그대로 보인다»', 다시)
chk('pageerror 0', 오류.length===0, 오류.join(' · '))

await b.close(); srv.close()
console.log(`\n${실패?'❌':'✅'} ${통과}/${통과+실패}`)
if (실패) console.log('  실패:', 실패목록.join(' · '))
process.exit(실패?1:0)
