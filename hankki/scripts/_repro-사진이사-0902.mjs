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
const ctx = await b.newContext({ viewport:{width:390,height:844}, acceptDownloads: true })
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
  s.diary = [{ id:'zz-d1', at:t, date:'2026-09-02', title:'사진표지 하나', recipeId:'zz-1', rating:5, note:'맛있었다', photo:사진 }, ...(s.diary||[])]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
  return { 서랍전: (localStorage.getItem('hankki:v1')||'').length, 사진길이: 사진.length, 사진 }
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

// 📔📔 **일기 사진도 «화면에» 돌아오나** (2026-09-02 · `photoView.jsx` 가 지키는 자리)
//   ⛔⛔ 표지(`Thumb`)만 고치면 반쪽이다 — 일기 사진은 달력·앨범·일기 시트·속지가 «따로» 그린다.
//      쪽지를 그대로 `<img src>` 에 넣으면 **빈 칸**이 되고, 유저 눈엔 「사진이 사라졌다」로 보인다.
//   ⛔ 잣대를 「data: 그림이 있나」로 잡으면 «안 된다» — 빌드가 음식 아이콘 PNG 를 data: 로 인라인한다.
//      ✅ 그래서 **우리가 심은 그 사진**(JPEG · 가로 900)을 콕 집는다.
await p2.evaluate(()=>{const 바=document.querySelector('.bottom-nav')||document.querySelector('nav');[...(바?.querySelectorAll('button')||[])].find(x=>(x.innerText||'').trim().includes('일기'))?.click()})
await p2.waitForTimeout(1800)
const 일기화면 = await p2.evaluate(()=>{
  const 그림들=[...document.querySelectorAll('img')].filter(e=>/^data:image\/jpe?g/.test(e.src))
  return { 개수: 그림들.length, 심은것: 그림들.some(e=>e.naturalWidth===900) }
})
chk('⭐⭐ 껐다 켜도 «일기 사진»이 화면에 보인다 (달력·앨범)', 일기화면.심은것, `jpeg ${일기화면.개수}장`)

chk('pageerror 0', 오류.length===0, 오류.join(' · '))

// ── 💾 백업 — ⭐제일 조용히 깨지는 자리 ──
//    ⛔ 백업에 «쪽지»가 담기면 파일은 멀쩡히 생기고, 폰을 바꾼 «뒤에야» 사진이 없는 걸 안다.
//    ⭐ **유저가 하는 그대로** 잰다 — 설정 → 백업 → 파일로 저장 → «그 파일»을 연다.
//       ⛔ 모듈을 직접 부르면 「진짜 그 길」을 안 재는 판이 된다(규칙 18 ⓘ · 절대원칙 30).
// ⛔⛔ **백업을 «갓 켠 폰»에서 만든다 — 이걸 p1 에서 하면 판이 «아무것도 안 잰다».**
//    p1 은 이사를 «방금 한» 탭이라 화면이 든 값에 아직 «진짜 사진»이 그대로 있다(서랍만 갈렸다).
//    거기서 백업하면 되살리는 코드를 통째로 지워도 초록불이 뜬다(2026-09-02 규칙 12 로 실제로 드러났다).
//    ✅ 새 탭 = 서랍에서 읽으니 손에 든 값이 «쪽지»뿐 → 창고에서 꺼내 담는 그 길을 진짜로 걷는다.
const pb = await ctx.newPage()
await pb.goto('http://127.0.0.1:4495/hankki/',{waitUntil:'networkidle'}); await pb.waitForTimeout(3000)
const 백업글 = await (async () => {
  try {
    // 홈 → 상단바 ⚙(aria-label="설정") → 「백업 · 내보내기」 → 「폰에 파일로 저장」
    await pb.evaluate(()=>{const 바=document.querySelector('.bottom-nav')||document.querySelector('nav');[...(바?.querySelectorAll('button')||[])].find(x=>(x.innerText||'').trim()==='홈')?.click()})
    await pb.waitForTimeout(700)
    await pb.evaluate(()=>{[...document.querySelectorAll('button')].find(x=>x.getAttribute('aria-label')==='설정')?.click()})
    await pb.waitForTimeout(1000)
    await pb.evaluate(()=>{[...document.querySelectorAll('button')].find(x=>/백업 · 내보내기/.test(x.innerText||''))?.click()})
    await pb.waitForTimeout(1000)
    const [down] = await Promise.all([
      pb.waitForEvent('download', { timeout: 15000 }),
      pb.evaluate(()=>{[...document.querySelectorAll('button')].find(x=>/파일로 저장/.test(x.innerText||''))?.click()}),' '.trim(),
    ])
    const 길 = await down.path()
    const b = JSON.parse(readFileSync(길, 'utf8'))
    const 글 = JSON.stringify(b)
    return { 글자수: 글.length, 사진수: b._photos, 못담김: b._photosMissing,
      data있나: 글.includes('data:image/'), 도장: [b.inboxV, b.coverV], 판: b }
  } catch (e) { console.log('  (백업 길:', String(e.message).slice(0,60), ')'); return null }
})()
if (백업글) {
  chk('⭐⭐ 백업에 «진짜 사진»이 들어 있다', 백업글.data있나 && 백업글.사진수 >= 3,
    `사진 ${백업글.사진수}장 · 못 담은 것 ${백업글.못담김}장`)
  chk('백업에 «못 담은 사진」이 0장', 백업글.못담김 === 0)
  chk('백업이 이사 도장을 담는다 (복원해도 이사가 다시 안 돈다)',
    백업글.도장[0] != null, 'inboxV=' + 백업글.도장[0])
} else { 실패 += 3; 실패목록.push('백업을 못 만들었다'); console.log('  ❌ 백업을 못 만들었다') }

// ── 📊 계기판 — 설정에 「저장 공간」이 «숫자로» 뜨나 ──
//   ⛔⛔ 2026-09-02 아침 사고의 절반은 **「얼마나 찼는지 아무도 몰랐다」**는 것이다(4.56MB/5MB=91%).
//      벽이 있는데 계기판이 없으면 «터지고 나서» 안다.
//   ⛔ `navigator.storage.estimate()` 로 그리면 안 된다 — localStorage 를 «안 센다»(실측 1MB→0KB).
//      그래서 이 줄은 **우리가 쓰기 직전에 «직접 센» 글자 수**를 보여준다.
await pb.evaluate(()=>{[...document.querySelectorAll('button')].find(x=>x.getAttribute('aria-label')==='닫기')?.click()})
await pb.waitForTimeout(900)
const 계기판 = await pb.evaluate(()=>{
  const 칸 = document.querySelector('[data-probe="storage"]')
  if (!칸) return null
  const 글 = 칸.innerText || ''
  const m = 글.match(/(\d+)%/)
  return { 글, 퍼센트: m ? Number(m[1]) : -1, 메가있나: /MB/.test(글) }
})
chk('⭐ 설정에 「저장 공간」 줄이 있다', !!계기판 && /저장 공간/.test(계기판.글))
chk('⭐⭐ 그 줄이 «진짜로 잰 값»을 보여준다 (0% 가 아니다)', !!계기판 && 계기판.퍼센트 > 0 && 계기판.메가있나,
  계기판 ? 계기판.글.replace(/\n/g, ' · ') : '(줄이 없다)')

// ── 🔁 복원 — 백업으로 되살려도 사진이 살아남나 ──
const p3 = await ctx.newPage()
await p3.goto('http://127.0.0.1:4495/hankki/',{waitUntil:'networkidle'}); await p3.waitForTimeout(2000)
// ⭐ 「폰을 바꾼 셈」 — 창고를 통째로 비우고 **방금 내려받은 그 백업 파일**만 남긴다
const 복원 = 백업글 ? await p3.evaluate(async (백업) => {
  await new Promise((ok) => { const q = indexedDB.deleteDatabase('hankki-photos'); q.onsuccess = () => ok(); q.onerror = () => ok(); q.onblocked = () => ok() })
  localStorage.setItem('hankki:v1', JSON.stringify(백업))
  return { 백업에사진: JSON.stringify(백업).includes('data:image/') }
}, 백업글.판) : { 백업에사진: false }
chk('복원할 백업에 사진이 들어 있다 (앞 단계 확인)', 복원.백업에사진)
await p3.close()

const p4 = await ctx.newPage()
await p4.goto('http://127.0.0.1:4495/hankki/',{waitUntil:'networkidle'}); await p4.waitForTimeout(3000)
await p4.evaluate(()=>{const 바=document.querySelector('.bottom-nav')||document.querySelector('nav');[...(바?.querySelectorAll('button')||[])].find(x=>(x.innerText||'').trim()==='레시피')?.click()})
await p4.waitForTimeout(1800)
const 살았나 = await p4.evaluate(()=>{
  const e=[...document.querySelectorAll('.grid-card')].find(x=>x.innerText.includes('사진표지 하나'))
  return { 보이나: !!e?.querySelector('img[src^="data:image/"]'),
    서랍에data: (localStorage.getItem('hankki:v1')||'').includes('data:image/') }
})
chk('⭐⭐ 「복원 = 삭제」가 아니다 — 되살린 뒤에도 사진이 보인다', 살았나.보이나)
chk('되살린 뒤에도 서랍은 «가볍다»(사진이 도로 안 들어온다)', !살았나.서랍에data)

// ── 🧯 창고가 «고장 나도» 글자를 안 잃는다 ──
//   ⛔⛔ 제일 무서운 경우 = **사진은 창고에 못 넣었는데 서랍에서는 빼는 것.** 그러면 사진이 «증발»한다.
//      (2026-09-02 아침 창업자 폰에서 레시피가 사라진 그 모양이다)
//   ⭐ 그래서 `store.jsx` 는 **창고에 «들어간 뒤에만»** 서랍에서 뺀다. 못 넣으면 예전처럼 통째로 저장한다.
//   🧪 그 길을 진짜로 걷게 한다 — `indexedDB.open` 이 **늘 실패**하는 판을 만든다.
console.log('\n🧯 창고가 고장 난 폰')
const 고장 = await b.newContext({ viewport:{width:390,height:844} })
await 고장.addInitScript(SEED_COACH_SEEN)
await 고장.addInitScript(()=>{ try{ localStorage.setItem('hankki:onboarded','1'); localStorage.setItem('hankki:news:off','1') }catch{}
  try { indexedDB.open = () => { const r = { onerror:null, onsuccess:null, onblocked:null }
    setTimeout(()=>{ try { r.error = new Error('창고 고장 흉내'); r.onerror && r.onerror({ target:r }) } catch {} }, 0); return r } } catch {} })
const q0 = await 고장.newPage()
await q0.goto('http://127.0.0.1:4495/hankki/',{waitUntil:'networkidle'}); await q0.waitForTimeout(1500)
await q0.evaluate((사진)=>{
  const s = JSON.parse(localStorage.getItem('hankki:v1')||'{}')
  s.recipes = [{ id:'zz-9', title:'창고고장 레시피', status:'sorted', source:'manual', thumb:'photo', image:사진,
    savedAt:Date.now(), ingredients:['콩나물 300g'], steps:['씻어요','무쳐요'], favorite:false, cooked:0 }, ...(s.recipes||[])]
  localStorage.setItem('hankki:v1', JSON.stringify(s))
}, 심은.사진)
await q0.close()

const q1 = await 고장.newPage()
const 고장오류=[]; q1.on('pageerror', e=>{ if(!/tesseract|importScripts|cdn\.jsdelivr|Failed to fetch/i.test(e.message)) 고장오류.push(e.message) })
await q1.goto('http://127.0.0.1:4495/hankki/',{waitUntil:'networkidle'}); await q1.waitForTimeout(5000)
const 고장뒤 = await q1.evaluate(()=>{
  const 글 = localStorage.getItem('hankki:v1')||''
  const s = JSON.parse(글||'{}')
  const r = (s.recipes||[]).find(x=>x.id==='zz-9')
  return { 글자살았나: !!r && r.steps?.length === 2, 사진살았나: typeof r?.image==='string' && r.image.startsWith('data:'),
    쪽지로바뀌었나: typeof r?.image==='string' && r.image.startsWith('idb://') }
})
chk('⭐⭐ 창고가 고장 나도 «글자»를 안 잃는다', 고장뒤.글자살았나)
chk('⭐⭐ 창고에 못 넣었으면 서랍에서 «빼지 않는다» (사진 증발 금지)', 고장뒤.사진살았나 && !고장뒤.쪽지로바뀌었나)
chk('창고 고장에도 pageerror 0', 고장오류.length===0, 고장오류.join(' · '))
await 고장.close()

await b.close(); srv.close()
console.log(`\n${실패?'❌':'✅'} ${통과}/${통과+실패}`)
if (실패) console.log('  실패:', 실패목록.join(' · '))
process.exit(실패?1:0)
