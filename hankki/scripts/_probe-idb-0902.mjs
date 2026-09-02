// 🗄 IndexedDB 가 «우리 앱에서» 진짜로 되나 — 이사 설계 전 실물 확인 (2026-09-02)
// ⛔ 「된다더라」로 설계하지 않는다(규칙 15). 사진 크기 그대로 넣고 빼서 잰다.
// 실행: node scripts/_probe-idb-0902.mjs
// 🏷 이름표 = 판정대기 (이사 설계 근거)
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const DIST = join(new URL('..', import.meta.url).pathname, 'dist')
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2' }
const srv = createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html';let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4485,r))
const b = await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})
const ctx = await b.newContext({ viewport:{width:390,height:844} })
const p = await ctx.newPage()
await p.goto('http://127.0.0.1:4485/hankki/',{waitUntil:'networkidle'}); await p.waitForTimeout(1500)

const 결과 = await p.evaluate(async () => {
  const 열기 = () => new Promise((res, rej) => {
    const q = indexedDB.open('hankki-probe', 1)
    q.onupgradeneeded = () => q.result.createObjectStore('img')
    q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error)
  })
  const 쓰기 = (db, k, v) => new Promise((res, rej) => {
    const t = db.transaction('img', 'readwrite'); t.objectStore('img').put(v, k)
    t.oncomplete = () => res(true); t.onerror = () => rej(t.error)
  })
  const 읽기 = (db, k) => new Promise((res, rej) => {
    const t = db.transaction('img', 'readonly'); const q = t.objectStore('img').get(k)
    q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error)
  })
  const 그림 = () => { const c=document.createElement('canvas'); c.width=415; c.height=900
    const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,415,900)
    x.fillStyle='#222'; x.font='16px sans-serif'
    for(let k=0;k<40;k++) x.fillText('항정살은 한입 크기로 썰어 핏물을 뺀다 '+k, 12, 30+k*21)
    return c.toDataURL('image/jpeg',0.75) }
  const out = { }
  try {
    const db = await 열기()
    const 한장 = 그림()
    out.한장크기KB = Math.round(한장.length/1024)
    // ⏱ 100장 넣기 (창업자 폰 65장보다 넉넉히)
    const t0 = performance.now()
    for (let i=0;i<100;i++) await 쓰기(db, 'img:'+i, 한장)
    out.쓰기100장ms = Math.round(performance.now()-t0)
    // ⏱ 100장 읽기 — 앱을 켤 때마다 이걸 한다
    const t1 = performance.now()
    let 합=0; for (let i=0;i<100;i++) 합 += (await 읽기(db,'img:'+i)).length
    out.읽기100장ms = Math.round(performance.now()-t1)
    out.읽은합MB = +(합/1048576).toFixed(2)
    // 💾 blob 으로 넣으면 더 작나 (base64 는 33% 부풀어 있다)
    const blob = await (await fetch(한장)).blob()
    out.blob크기KB = Math.round(blob.size/1024)
    await 쓰기(db, 'blob:0', blob)
    const 되읽음 = await 읽기(db, 'blob:0')
    out.blob왕복됨 = !!(되읽음 && 되읽음.size === blob.size)
    // 📏 남은 공간
    const e = await navigator.storage.estimate()
    out.쓴양MB = +(e.usage/1048576).toFixed(1); out.한도MB = Math.round(e.quota/1048576)
    out.persist = await navigator.storage.persisted?.() ?? null
    db.close(); indexedDB.deleteDatabase('hankki-probe')
  } catch (e) { out.오류 = String(e && e.message || e) }
  return out
})
console.log('\n🗄 IndexedDB 실물 측정\n')
Object.entries(결과).forEach(([k,v])=>console.log(`  ${k.padEnd(14)} ${v}`))
await b.close(); srv.close()
