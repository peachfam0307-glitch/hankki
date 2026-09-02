// 🗄 사진 창고(`src/photoStore.js`)가 «진짜로» 도나 — 만들자마자 잰다 (2026-09-02)
// ⛔ 만들어놓고 「되겠지」로 넘어가지 않는다. 특히 «못 넣었을 때 false 를 주나»가 중요하다 —
//    그게 참이라야 부르는 쪽이 「서랍에서 빼면 안 된다」를 안다.
// 실행: node scripts/_probe-사진창고-0902.mjs
// 🏷 이름표 = 반영됨 (창고 만들며 쓴 판)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const ROOT = new URL('..', import.meta.url).pathname
const MIME = { '.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.jsx':'text/javascript','.css':'text/css' }
const srv = createServer((q,s)=>{
  let p = decodeURIComponent(q.url.split('?')[0])
  if (p === '/' || p === '') { s.writeHead(200,{'content-type':'text/html'}); return s.end('<!doctype html><meta charset=utf-8><body>판</body>') }
  let body
  try { body = readFileSync(join(ROOT, p.replace(/^\//,''))) } catch { s.writeHead(404); return s.end('없다') }
  s.writeHead(200,{'content-type': MIME[extname(p)] || 'text/plain'}); s.end(body)
})
await new Promise(r=>srv.listen(4493,r))
const b = await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})
const p = await (await b.newContext()).newPage()
const 오류 = []; p.on('pageerror', e => 오류.push(e.message))
await p.goto('http://127.0.0.1:4493/', { waitUntil:'domcontentloaded' })

let 통과 = 0, 실패 = 0
const chk = (이름, 조건, 덧말='') => { 조건 ? 통과++ : 실패++; console.log(`  ${조건?'✅':'❌'} ${이름}${덧말?'  '+덧말:''}`) }

const r = await p.evaluate(async () => {
  const m = await import('/src/photoStore.js')
  const out = {}
  const 사진 = 'data:image/jpeg;base64,' + 'A'.repeat(100000)   // ≈100KB
  out.열림 = !!(await m.창고열기())
  out.넣기 = await m.넣기('r1', 사진)
  out.꺼낸것같나 = (await m.꺼내기('r1')) === 사진
  out.없는것 = (await m.꺼내기('없는열쇠')) === null
  const t0 = performance.now()
  await m.여럿넣기(Array.from({length:100}, (_,i)=>['p'+i, 사진]))
  out.백장넣기ms = Math.round(performance.now()-t0)
  const t1 = performance.now()
  const 한꺼번에 = await m.여럿꺼내기(Array.from({length:100}, (_,i)=>'p'+i))
  out.백장꺼내기ms = Math.round(performance.now()-t1)
  out.백장다왔나 = Object.keys(한꺼번에).length === 100
  out.열쇠수 = (await m.열쇠들()).length
  await m.지우기(['p0','p1'])
  out.지운뒤 = (await m.꺼내기('p0')) === null
  await m.통째로비우기()
  out.비운뒤열쇠수 = (await m.열쇠들()).length
  return out
})

console.log('\n🗄 사진 창고 시험\n')
chk('창고가 열린다', r.열림)
chk('넣으면 «진짜 들어간 뒤에» true 를 준다', r.넣기 === true)
chk('넣었다 꺼내면 «똑같다»', r.꺼낸것같나)
chk('없는 것은 null (⛔ 던지지 않는다)', r.없는것)
chk('100장 한 거래로 넣기', r.백장넣기ms < 5000, r.백장넣기ms + 'ms')
chk('100장 한 번에 꺼내기', r.백장꺼내기ms < 3000, r.백장꺼내기ms + 'ms')
chk('100장이 다 왔다', r.백장다왔나)
chk('열쇠 목록이 나온다', r.열쇠수 >= 100, r.열쇠수 + '개')
chk('지우면 없어진다', r.지운뒤)
chk('통째로 비우면 0개', r.비운뒤열쇠수 === 0, r.비운뒤열쇠수 + '개')
chk('pageerror 0', 오류.length === 0, 오류.join(' · '))

// ── 🪓 사진 갈라내기 ──
const g = await p.evaluate(async () => {
  const m = await import('/src/photoStore.js')
  const 사진 = 'data:image/jpeg;base64,' + 'B'.repeat(50000)
  const 상태 = {
    recipes: [
      { id: 'r1', title: '항정살', image: 사진, decor: [{ id: 'd1', type: 'photo', src: 사진 }, { id: 'd2', type: 'sticker', key: 'fe_04' }] },
      { id: 'r2', title: '기본편', image: '/recipe-photos/kong.jpg' },
      { id: 'r3', title: '사진없음', image: null },
    ],
    diary: [{ id: 'y1', photo: 사진, ph_l1: 사진, note: '맛있었다' }],
    profile: { avatar: { type: 'photo', value: 사진 } },
    inboxV: 2,
  }
  const a = m.나누기(상태)
  const b = m.나누기(상태)
  const 글자수 = JSON.stringify(상태).length
  const 뺀뒤 = JSON.stringify(a.판).length
  const 뒤바꾼 = { ...상태, recipes: [상태.recipes[2], 상태.recipes[0], 상태.recipes[1]] }
  const c = m.나누기(뒤바꾼)
  const 표 = Object.fromEntries(a.사진들)
  const 되돌린 = m.사진끼우기(a.판, 표)
  return {
    사진수: a.사진들.length,
    열쇠들: a.사진들.map(([k]) => k),
    두번째같나: JSON.stringify(a.사진들.map(([k]) => k)) === JSON.stringify(b.사진들.map(([k]) => k)),
    순서바꿔도같나: c.사진들.map(([k]) => k).sort().join() === a.사진들.map(([k]) => k).sort().join(),
    글자수, 뺀뒤,
    주소는안건드림: a.판.recipes[1].image === '/recipe-photos/kong.jpg',
    없는건그대로: a.판.recipes[2].image === null,
    스티커그대로: a.판.recipes[0].decor[1].key === 'fe_04',
    되돌리면같나: JSON.stringify(되돌린) === JSON.stringify(상태),
    쪽지수: m.쪽지열쇠모으기(a.판).length,
  }
})
console.log('\n🪓 사진 갈라내기\n')
chk('사진 다섯을 다 찾았다 (표지·꾸미기·일기 둘·아바타)', g.사진수 === 5, g.사진수 + '개')
chk('⭐ 두 번 갈라도 «열쇠가 같다» (창고에 쓰레기가 안 쌓인다)', g.두번째같나)
chk('⭐ 순서를 바꿔도 «열쇠가 같다» (id 로 만든다)', g.순서바꿔도같나)
chk('서랍에 넣을 판이 «확 작아졌다»', g.뺀뒤 < g.글자수 / 10,
  Math.round(g.글자수/1024) + 'KB → ' + Math.round(g.뺀뒤/1024) + 'KB')
chk('«주소» 사진은 안 건드린다 (/recipe-photos/…)', g.주소는안건드림)
chk('사진 «없는» 것은 null 그대로 (있다/없다를 안 헷갈린다)', g.없는건그대로)
chk('스티커 열쇠는 그대로', g.스티커그대로)
chk('⭐⭐ 되돌리면 «원래와 똑같다»', g.되돌리면같나)
chk('쪽지 열쇠를 다 모은다 (백업·클라우드용)', g.쪽지수 === 5, g.쪽지수 + '개')
console.log('  열쇠 =', g.열쇠들.join(' · '))

await b.close(); srv.close()
console.log(`\n${실패?'❌':'✅'} ${통과}/${통과+실패}`)
process.exit(실패 ? 1 : 0)
