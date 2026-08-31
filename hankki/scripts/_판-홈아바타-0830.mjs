// 🏠💬 「홈만 말풍선이 아래로 보인다」 — 고치는 길 둘을 실물로 (2026-08-30)
//   📮 창업자 = *"홈 프로필 사진이 작아서 그런지 말풍선이 홈만 아래로 내려가 보여.."*
//   🔢 실측 = 아바타 38px · 레시피 곰 43px. 아바타 하단 55 · 곰 하단 57 · 말풍선 top 64
//      → 홈 9px · 레시피 7px. ＋ 아바타는 «원»이라 꼬리가 닿는 왼쪽에서 곡선만큼 더 들어간다.
//   ⛔ 소스를 안 고친다 — 화면에서 값만 갈아끼워 찍는다(절대원칙 30).
import './_fresh.mjs'
import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'
const OUT='/tmp/claude-0/-home-user-hankki/a6ddf416-4395-54cf-84a2-c8a56d2df1b1/scratchpad/홈아바타'
mkdirSync(OUT,{recursive:true})
const DIST=join(new URL('..',import.meta.url).pathname,'dist')
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.woff2':'font/woff2'}
const srv=createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]).replace(/^\/hankki/,'');if(p==='/'||p==='')p='/index.html'
 let b,t=MIME[extname(p)]||'application/octet-stream';try{b=readFileSync(join(DIST,p))}catch{b=readFileSync(join(DIST,'index.html'));t='text/html'}
 s.writeHead(200,{'content-type':t});s.end(b)})
await new Promise(r=>srv.listen(4403,r))
const {SEED_COACH_SEEN}=await import('../src/coach.js')
const b=await chromium.launch(process.env.SMOKE_CHROMIUM?{executablePath:process.env.SMOKE_CHROMIUM}:{})

const 안=[
  {키:'A-지금', 아바타:38, 말풍선:0},
  {키:'B-아바타43', 아바타:43, 말풍선:0},
  {키:'C-말풍선4위', 아바타:38, 말풍선:-4},
]
console.log('안          | 아바타 | 아바타아래 | 말풍선까지')
console.log('─'.repeat(52))
for (const a of 안) {
  const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:3})
  await p.addInitScript(SEED_COACH_SEEN)
  await p.addInitScript(()=>{try{localStorage.setItem('hankki:onboarded','1');localStorage.setItem('hankki:news:off','1')}catch{}})
  await p.goto('http://127.0.0.1:4403/hankki/',{waitUntil:'networkidle'})
  await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(700)
  const r = await p.evaluate(({아바타,말풍선})=>{
    const 칸=document.querySelector('.topbar button[aria-label="프로필"]')
    const 아=칸?.firstElementChild
    if (아 && 아바타!==38) { 아.style.width=아바타+'px'; 아.style.height=아바타+'px'
      const inner=아.querySelector('svg,img'); if(inner){inner.style.width=아바타+'px';inner.style.height=아바타+'px'} }
    const t=document.querySelector('.tab-talk'); if(말풍선) t.style.marginTop=(-2+말풍선)+'px'
    const ar=아?.getBoundingClientRect(), mr=document.querySelector('.tab-talk-b').getBoundingClientRect()
    return {아래:ar?Math.round(ar.bottom):null, 거리:ar?+(mr.top-ar.bottom).toFixed(1):null}
  }, a)
  await p.waitForTimeout(200)
  console.log(`${a.키.padEnd(11)} | ${String(a.아바타).padStart(5)}px | ${String(r.아래).padStart(10)} | ${String(r.거리).padStart(9)}px`)
  await p.screenshot({path:`${OUT}/${a.키}.png`, clip:{x:0,y:0,width:390,height:130}})
  await p.close()
}
await b.close(); srv.close()
console.log(`\n📁 ${OUT}`)
