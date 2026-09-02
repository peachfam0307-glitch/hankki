// 🎛 「`navigator.storage.estimate()` 가 localStorage 를 «세나»」 — 계기판 설계의 갈림길 (2026-09-02)
// ⛔ 안 세면, 5MB 가 꽉 차 터지는 순간에도 계기판은 「3%」라고 말한다(＝초록불인 채로 데이터를 잃는다).
// 실행: node scripts/_probe-계기판-0902.mjs
// 🏷 이름표 = 판정대기 (설계 근거)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.json':'application/json' }
const srv = createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4489,r))
const b = await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})
const p = await (await b.newContext()).newPage()
await p.goto('http://127.0.0.1:4489/hankki/',{waitUntil:'networkidle'}); await p.waitForTimeout(1200)
const 결과 = await p.evaluate(async () => {
  const 재기 = async () => (await navigator.storage.estimate()).usage
  const 전 = await 재기()
  const 덩이 = 'x'.repeat(1024 * 1024)          // 1MB
  try { localStorage.setItem('zz-est', 덩이) } catch { return { 오류: 'localStorage 에 1MB 를 못 넣었다' } }
  await new Promise(r => setTimeout(r, 400))
  const 후 = await 재기()
  localStorage.removeItem('zz-est')
  return { 전KB: Math.round(전/1024), 후KB: Math.round(후/1024), 늘어난KB: Math.round((후-전)/1024) }
})
console.log('\n🎛 estimate() 가 localStorage 를 세나\n')
Object.entries(결과).forEach(([k,v])=>console.log(`  ${k.padEnd(10)} ${v}`))
const 센다 = (결과.늘어난KB ?? 0) > 500
console.log(`\n  👉 ${센다 ? '✅ 센다 — 한 계기판으로 된다' : '⛔ «안 센다» — 5MB 가 터져도 계기판은 조용하다. 계기판이 «둘»이라야 한다'}`)
await b.close(); srv.close()
